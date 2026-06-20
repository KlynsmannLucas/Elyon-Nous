// app/api/meta/campaign/action/route.ts
// Executa ações reais numa campanha do Meta (pausar / reativar / escalar budget),
// a partir de um insight. Fecha o loop: recomendação -> ação executada.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getValidMetaToken, metaTokenErrorToResponse } from '@/services/meta/token-manager'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 30
const META_BASE = 'https://graph.facebook.com/v21.0'

type ActionType = 'pause' | 'resume' | 'scale'

// Registra a ação + o CPL/spend da conta no momento (para medir o "depois").
// Tolerante: se a tabela não existir ainda, apenas ignora.
async function logExecutedAction(userId: string, accountId: string | undefined, body: any, action: ActionType) {
  if (!supabaseAdmin) return
  try {
    let cplBefore: number | null = null
    let spendBefore: number | null = null
    if (accountId) {
      const { data } = await supabaseAdmin.from('daily_metrics')
        .select('cpl, spend').eq('user_id', userId).eq('account_id', accountId).eq('platform', 'meta')
        .order('date', { ascending: false }).limit(1)
      if (data?.[0]) { cplBefore = data[0].cpl ?? null; spendBefore = data[0].spend ?? null }
    }
    await supabaseAdmin.from('executed_actions').insert({
      user_id: userId, account_id: accountId || null, client_name: body.clientName || null,
      campaign_id: String(body.id || ''), campaign_name: body.campaignName || null,
      action, cpl_before: cplBefore, spend_before: spendBefore,
    })
  } catch { /* tabela ausente ou erro de log — não quebra a ação */ }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const action = body.action as ActionType
  const id = String(body.id || '').trim()           // campaign id
  const factor = Number(body.factor) || 1.2          // escala: +20% por padrão
  if (!['pause', 'resume', 'scale'].includes(action)) {
    return NextResponse.json({ success: false, error: 'Ação inválida.' }, { status: 400 })
  }
  if (!id) return NextResponse.json({ success: false, error: 'ID da campanha ausente.' }, { status: 400 })

  let accessToken: string
  let tokenAccountId: string | undefined
  try {
    const t = await getValidMetaToken(userId)
    accessToken = t.accessToken
    tokenAccountId = (body.accountId as string) || t.accountId || undefined
  } catch (err) {
    const { error, code } = metaTokenErrorToResponse(err)
    return NextResponse.json({ success: false, error, code }, { status: 401 })
  }

  const post = async (path: string, params: Record<string, string>) => {
    const res = await fetch(`${META_BASE}/${path}`, {
      method: 'POST',
      body: new URLSearchParams({ ...params, access_token: accessToken }),
      signal: AbortSignal.timeout(15000),
    })
    const j = await res.json().catch(() => ({}))
    return { ok: res.ok && !j?.error, error: j?.error?.message as string | undefined, data: j }
  }

  try {
    if (action === 'pause' || action === 'resume') {
      const status = action === 'pause' ? 'PAUSED' : 'ACTIVE'
      const r = await post(id, { status })
      if (!r.ok) return NextResponse.json({ success: false, error: r.error || 'Falha ao atualizar a campanha no Meta.' }, { status: 502 })
      await logExecutedAction(userId, tokenAccountId, body, action)
      return NextResponse.json({ success: true, message: action === 'pause' ? 'Campanha pausada no Meta Ads.' : 'Campanha reativada no Meta Ads.' })
    }

    // scale: lê o budget atual da campanha (CBO) e aumenta pelo fator.
    const cur = await fetch(`${META_BASE}/${id}?fields=daily_budget,lifetime_budget,name&access_token=${encodeURIComponent(accessToken)}`, { signal: AbortSignal.timeout(15000) })
    const cj = await cur.json().catch(() => ({}))
    if (cj?.error) return NextResponse.json({ success: false, error: cj.error.message || 'Não foi possível ler o orçamento.' }, { status: 502 })

    const fmt = (cents: number) => 'R$' + Math.round(cents / 100).toLocaleString('pt-BR')
    const daily = Number(cj?.daily_budget || 0) // em centavos

    // Caso CBO: escala o orçamento da campanha inteira.
    if (daily) {
      const next = Math.round(daily * factor)
      const r = await post(id, { daily_budget: String(next) })
      if (!r.ok) return NextResponse.json({ success: false, error: r.error || 'Falha ao escalar o orçamento.' }, { status: 502 })
      await logExecutedAction(userId, tokenAccountId, body, action)
      return NextResponse.json({ success: true, message: `Orçamento elevado de ${fmt(daily)} para ${fmt(next)}/dia.` })
    }

    // Caso ABO (orçamento no conjunto): escala o AD SET VENCEDOR (menor CPL com leads),
    // em vez de inflar a campanha inteira.
    const enc = encodeURIComponent(accessToken)
    const [setsRes, insRes] = await Promise.all([
      fetch(`${META_BASE}/${id}/adsets?fields=id,name,daily_budget,effective_status&limit=50&access_token=${enc}`, { signal: AbortSignal.timeout(15000) }).then(r => r.json()).catch(() => ({})),
      fetch(`${META_BASE}/${id}/insights?level=adset&fields=adset_id,spend,actions&date_preset=last_30d&limit=50&access_token=${enc}`, { signal: AbortSignal.timeout(15000) }).then(r => r.json()).catch(() => ({})),
    ])
    const LEAD_RE = /lead|complete_registration|onsite_conversion\.messaging|purchase/i
    const cplByAdset: Record<string, number> = {}
    for (const row of (insRes?.data || [])) {
      const spend = Number(row.spend || 0)
      let leads = 0
      for (const a of (row.actions || [])) if (LEAD_RE.test(a?.action_type || '')) leads += Number(a?.value || 0)
      cplByAdset[String(row.adset_id)] = leads > 0 ? spend / leads : Infinity
    }
    // candidatos: ad sets ativos, com daily_budget e com leads (CPL finito)
    const candidates = (setsRes?.data || [])
      .filter((s: any) => Number(s.daily_budget || 0) > 0 && (s.effective_status === 'ACTIVE' || !s.effective_status))
      .map((s: any) => ({ id: String(s.id), name: s.name, budget: Number(s.daily_budget), cpl: cplByAdset[String(s.id)] ?? Infinity }))
      .filter((s: any) => isFinite(s.cpl))
      .sort((a: any, b: any) => a.cpl - b.cpl)

    if (!candidates.length) {
      return NextResponse.json({ success: false, error: 'Esta campanha usa orçamento no conjunto (ABO) e não encontrei um ad set vencedor com dados suficientes para escalar com segurança. Ajuste manualmente o conjunto de melhor CPL.' }, { status: 409 })
    }
    const best = candidates[0]
    const next = Math.round(best.budget * factor)
    const r = await post(best.id, { daily_budget: String(next) })
    if (!r.ok) return NextResponse.json({ success: false, error: r.error || 'Falha ao escalar o ad set vencedor.' }, { status: 502 })
    await logExecutedAction(userId, tokenAccountId, body, action)
    return NextResponse.json({ success: true, message: `Ad set vencedor "${best.name}" (CPL ${fmt(Math.round(best.cpl * 100))}): orçamento ${fmt(best.budget)} → ${fmt(next)}/dia.` })
  } catch (e: any) {
    console.error('[meta/campaign/action]', e?.message)
    return NextResponse.json({ success: false, error: 'Erro ao executar a ação no Meta.' }, { status: 500 })
  }
}
