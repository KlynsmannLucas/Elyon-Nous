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
  const dryRun = body.dryRun === true                // preview: calcula o plano SEM executar
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

  const fmt = (cents: number) => 'R$' + Math.round(cents / 100).toLocaleString('pt-BR')

  try {
    // ── PAUSE / RESUME ───────────────────────────────────────────────────────
    if (action === 'pause' || action === 'resume') {
      const plan = action === 'pause'
        ? `Pausar a campanha "${body.campaignName || 'selecionada'}" no Meta Ads.`
        : `Reativar a campanha "${body.campaignName || 'selecionada'}" no Meta Ads.`
      if (dryRun) return NextResponse.json({ success: true, preview: true, plan })
      const status = action === 'pause' ? 'PAUSED' : 'ACTIVE'
      const r = await post(id, { status })
      if (!r.ok) return NextResponse.json({ success: false, error: r.error || 'Falha ao atualizar a campanha no Meta.' }, { status: 502 })
      await logExecutedAction(userId, tokenAccountId, body, action)
      return NextResponse.json({ success: true, message: action === 'pause' ? 'Campanha pausada no Meta Ads.' : 'Campanha reativada no Meta Ads.' })
    }

    // ── SCALE ────────────────────────────────────────────────────────────────
    // Calcula o PLANO (alvo + de/para) antes de tocar em qualquer coisa.
    const cur = await fetch(`${META_BASE}/${id}?fields=daily_budget,name&access_token=${encodeURIComponent(accessToken)}`, { signal: AbortSignal.timeout(15000) })
    const cj = await cur.json().catch(() => ({}))
    if (cj?.error) return NextResponse.json({ success: false, error: cj.error.message || 'Não foi possível ler o orçamento.' }, { status: 502 })
    const daily = Number(cj?.daily_budget || 0) // centavos

    // Define o alvo (campanha CBO ou ad set vencedor no ABO) sem executar.
    let targetId = id
    let targetBudget = daily
    let plan = ''
    if (daily) {
      const next = Math.round(daily * factor)
      plan = `Aumentar o orçamento da campanha "${cj.name || body.campaignName}" de ${fmt(daily)} para ${fmt(next)}/dia (+${Math.round((factor - 1) * 100)}%).`
    } else {
      // ABO: escolhe o ad set vencedor (menor CPL com leads).
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
      const candidates = (setsRes?.data || [])
        .filter((s: any) => Number(s.daily_budget || 0) > 0 && (s.effective_status === 'ACTIVE' || !s.effective_status))
        .map((s: any) => ({ id: String(s.id), name: s.name, budget: Number(s.daily_budget), cpl: cplByAdset[String(s.id)] ?? Infinity }))
        .filter((s: any) => isFinite(s.cpl))
        .sort((a: any, b: any) => a.cpl - b.cpl)
      if (!candidates.length) {
        return NextResponse.json({ success: false, error: 'Campanha com orçamento no conjunto (ABO) e sem um ad set vencedor com dados suficientes. Ajuste o conjunto de melhor CPL manualmente.' }, { status: 409 })
      }
      const best = candidates[0]
      targetId = best.id
      targetBudget = best.budget
      const next = Math.round(best.budget * factor)
      plan = `Aumentar o orçamento do AD SET VENCEDOR "${best.name}" (CPL ${fmt(Math.round(best.cpl * 100))}) de ${fmt(best.budget)} para ${fmt(next)}/dia (+${Math.round((factor - 1) * 100)}%). A campanha usa orçamento no conjunto (ABO).`
    }

    // Preview: NÃO executa, devolve o plano para o usuário aprovar.
    if (dryRun) return NextResponse.json({ success: true, preview: true, plan })

    // Execução (após aprovação explícita do usuário).
    const next = Math.round(targetBudget * factor)
    const r = await post(targetId, { daily_budget: String(next) })
    if (!r.ok) return NextResponse.json({ success: false, error: r.error || 'Falha ao escalar o orçamento.' }, { status: 502 })
    await logExecutedAction(userId, tokenAccountId, body, action)
    return NextResponse.json({ success: true, message: `${plan.replace('Aumentar', 'Aumentado')}` })
  } catch (e: any) {
    console.error('[meta/campaign/action]', e?.message)
    return NextResponse.json({ success: false, error: 'Erro ao executar a ação no Meta.' }, { status: 500 })
  }
}
