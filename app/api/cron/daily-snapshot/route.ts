// app/api/cron/daily-snapshot/route.ts
// Cron diário: para cada conta Meta conectada, captura as métricas de ONTEM e
// grava um snapshot em daily_metrics. Habilita deltas day-over-day reais
// ("o que mudou desde ontem") no Pulse e no briefing. Degrada sem quebrar:
// se a tabela não existir ou um token falhar, apenas pula aquele item.
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getValidMetaToken } from '@/services/meta/token-manager'

export const maxDuration = 300

const CRON_SECRET = process.env.CRON_SECRET

const extractActions = (actions: any[], types: string[]): number =>
  (actions || []).filter((a: any) => types.includes(a.action_type)).reduce((s: number, a: any) => s + parseInt(a.value || '0'), 0)

// Mesma lógica de leads do /api/ads-data/meta (sem dupla contagem)
function extractLeads(actions: any[]): number {
  const primary = extractActions(actions, ['lead'])
  if (primary > 0) return primary
  const grouped = extractActions(actions, ['onsite_conversion.lead_grouped'])
  if (grouped > 0) return grouped
  for (const t of ['onsite_conversion.messaging_conversation_started_7d', 'messaging_first_reply', 'onsite_conversion.messaging_first_reply']) {
    const v = extractActions(actions, [t])
    if (v > 0) return v
  }
  return 0
}

function yesterdayISO(): string {
  const d = new Date(Date.now() - 24 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 10)
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ skipped: true, reason: 'Supabase not configured' })
  }

  // Lista todas as conexões Meta ativas
  const { data: conns, error } = await supabaseAdmin
    .from('ads_connections')
    .select('user_id, account_id')
    .eq('platform', 'meta')
    .limit(1000)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!conns?.length) return NextResponse.json({ processed: 0, saved: 0 })

  const date = yesterdayISO()
  let saved = 0
  const errors: string[] = []

  for (const c of conns) {
    try {
      const token = await getValidMetaToken(c.user_id)
      const accountId = c.account_id || token.accountId
      if (!accountId) continue

      const url =
        `https://graph.facebook.com/v21.0/act_${accountId}/insights?` +
        `level=account&fields=spend,impressions,clicks,actions&date_preset=yesterday` +
        `&access_token=${token.accessToken}`
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
      const json = await res.json()
      if (json.error || !Array.isArray(json.data) || json.data.length === 0) continue

      const row = json.data[0]
      const spend       = Math.round(Number(row.spend || 0))
      const impressions = parseInt(row.impressions || '0')
      const clicks      = parseInt(row.clicks || '0')
      const leads       = extractLeads(row.actions || [])
      const cpl         = leads > 0 ? Math.round(spend / leads) : null
      const ctr         = impressions > 0 ? +((clicks / impressions) * 100).toFixed(2) : null

      const { error: upErr } = await supabaseAdmin
        .from('daily_metrics')
        .upsert(
          { user_id: c.user_id, account_id: accountId, platform: 'meta', date, spend, leads, impressions, clicks, cpl, ctr },
          { onConflict: 'user_id,account_id,platform,date' },
        )
      if (upErr) { errors.push(upErr.message); continue }
      saved++
    } catch (e) {
      errors.push((e as Error).message)
    }
  }

  return NextResponse.json({ processed: conns.length, saved, date, errors: errors.length, ts: new Date().toISOString() })
}
