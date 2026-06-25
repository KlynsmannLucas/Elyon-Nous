// app/api/cron/daily-snapshot/route.ts
// Cron diário: captura as métricas de ONTEM de cada conta de anúncio em uso e grava
// um snapshot em daily_metrics. Habilita deltas day-over-day reais ("o que mudou desde
// ontem") no Pulse e no briefing. Degrada sem quebrar: se a tabela não existir ou um
// token falhar, apenas pula aquele item.
//
// Isolamento por cliente: um mesmo login (ads_connections) dá acesso a várias contas de
// anúncio — uma por cliente. Por isso fazemos snapshot da UNIÃO {conta padrão da conexão}
// ∪ {contas escolhidas por cliente em clients.extra_data}. Sem isto, só a conta padrão
// teria histórico diário e os outros clientes ficariam sem dados.
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getValidMetaToken } from '@/services/meta/token-manager'
import { getValidGoogleToken } from '@/services/google/token-manager'
import { gaqlSearch, normalizeCustomerId } from '@/lib/google-ads'

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

// Lê as contas de anúncio escolhidas POR cliente (clients.extra_data) e agrupa por usuário.
async function selectedAccountsByUser(): Promise<{
  meta: Map<string, Set<string>>
  google: Map<string, Set<string>>
}> {
  const meta = new Map<string, Set<string>>()
  const google = new Map<string, Set<string>>()
  try {
    const { data } = await supabaseAdmin!.from('clients').select('user_id, extra_data')
    for (const r of data || []) {
      const ex = (r.extra_data as any) || {}
      if (ex.selectedMetaAccountId) {
        if (!meta.has(r.user_id)) meta.set(r.user_id, new Set())
        meta.get(r.user_id)!.add(String(ex.selectedMetaAccountId))
      }
      if (ex.selectedGoogleAccountId) {
        if (!google.has(r.user_id)) google.set(r.user_id, new Set())
        google.get(r.user_id)!.add(String(ex.selectedGoogleAccountId))
      }
    }
  } catch { /* coluna extra_data ausente — segue só com a conta padrão da conexão */ }
  return { meta, google }
}

// Snapshot de UMA conta Meta. Retorna true (salvo), string (erro) ou null (sem dado).
async function snapshotMeta(userId: string, accountId: string, accessToken: string, date: string): Promise<true | string | null> {
  try {
    const url =
      `https://graph.facebook.com/v21.0/act_${accountId}/insights?` +
      `level=account&fields=spend,impressions,clicks,actions&date_preset=yesterday` +
      `&access_token=${accessToken}`
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
    const json = await res.json()
    if (json.error || !Array.isArray(json.data) || json.data.length === 0) return null

    const row = json.data[0]
    const spend       = Math.round(Number(row.spend || 0))
    const impressions = parseInt(row.impressions || '0')
    const clicks      = parseInt(row.clicks || '0')
    const leads       = extractLeads(row.actions || [])
    const cpl         = leads > 0 ? Math.round(spend / leads) : null
    const ctr         = impressions > 0 ? +((clicks / impressions) * 100).toFixed(2) : null

    const { error: upErr } = await supabaseAdmin!
      .from('daily_metrics')
      .upsert(
        { user_id: userId, account_id: accountId, platform: 'meta', date, spend, leads, impressions, clicks, cpl, ctr },
        { onConflict: 'user_id,account_id,platform,date' },
      )
    return upErr ? upErr.message : true
  } catch (e) {
    return (e as Error).message
  }
}

// Snapshot de UMA conta Google. Retorna true (salvo), string (erro) ou null (sem dado).
async function snapshotGoogle(userId: string, accountId: string, accessToken: string, developerToken: string, date: string): Promise<true | string | null> {
  try {
    const cleanId = normalizeCustomerId(accountId)
    const query = `SELECT metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions FROM campaign WHERE segments.date = '${date}' AND campaign.status != 'REMOVED'`
    const rows = await gaqlSearch(cleanId, accessToken, developerToken, query)
    if (!rows || rows.length === 0) return null

    let costMicros = 0, impressions = 0, clicks = 0, conversions = 0
    for (const r of rows) {
      const m = r.metrics || {}
      costMicros  += Number(m.costMicros || 0)
      impressions += Number(m.impressions || 0)
      clicks      += Number(m.clicks || 0)
      conversions += Number(m.conversions || 0)
    }
    const spend = Math.round(costMicros / 1_000_000)
    const leads = Math.round(conversions)
    const cpl   = leads > 0 ? Math.round(spend / leads) : null
    const ctr   = impressions > 0 ? +((clicks / impressions) * 100).toFixed(2) : null

    const { error: upErr } = await supabaseAdmin!
      .from('daily_metrics')
      .upsert(
        { user_id: userId, account_id: accountId, platform: 'google', date, spend, leads, impressions, clicks, cpl, ctr },
        { onConflict: 'user_id,account_id,platform,date' },
      )
    return upErr ? upErr.message : true
  } catch (e) {
    return (e as Error).message
  }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ skipped: true, reason: 'Supabase not configured' })
  }

  const date = yesterdayISO()
  let saved = 0
  const errors: string[] = []

  // Contas escolhidas por cliente (além da conta padrão da conexão).
  const selected = await selectedAccountsByUser()

  // ── META ────────────────────────────────────────────────────────────────────
  const { data: conns, error } = await supabaseAdmin
    .from('ads_connections')
    .select('user_id, account_id')
    .eq('platform', 'meta')
    .limit(1000)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let processed = 0
  for (const c of (conns || [])) {
    try {
      const token = await getValidMetaToken(c.user_id)
      // União: conta padrão da conexão + todas as contas escolhidas por cliente do usuário.
      const accounts = new Set<string>()
      const def = c.account_id || token.accountId
      if (def) accounts.add(String(def))
      for (const a of (selected.meta.get(c.user_id) || [])) accounts.add(a)

      for (const accountId of accounts) {
        processed++
        const r = await snapshotMeta(c.user_id, accountId, token.accessToken, date)
        if (r === true) saved++
        else if (typeof r === 'string') errors.push(r)
      }
    } catch (e) {
      errors.push((e as Error).message)
    }
  }

  // ── GOOGLE ───────────────────────────────────────────────────────────────────
  let savedGoogle = 0
  let googleProcessed = 0
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  if (developerToken) {
    const { data: gConns } = await supabaseAdmin
      .from('ads_connections')
      .select('user_id, account_id')
      .eq('platform', 'google')
      .limit(1000)

    for (const c of (gConns || [])) {
      try {
        const token = await getValidGoogleToken(c.user_id)
        const accounts = new Set<string>()
        const def = c.account_id || token.accountId
        if (def) accounts.add(String(def))
        for (const a of (selected.google.get(c.user_id) || [])) accounts.add(a)

        for (const accountId of accounts) {
          googleProcessed++
          const r = await snapshotGoogle(c.user_id, accountId, token.accessToken, developerToken, date)
          if (r === true) savedGoogle++
          else if (typeof r === 'string') errors.push(r)
        }
      } catch (e) {
        errors.push((e as Error).message)
      }
    }
  }

  return NextResponse.json({
    processed, saved,
    googleProcessed, savedGoogle,
    date, errors: errors.length, errorDetail: errors.slice(0, 5), ts: new Date().toISOString(),
  })
}
