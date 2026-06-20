// app/api/google/campaign/action/route.ts
// Executa ações reais numa campanha do Google Ads (pausar / reativar / escalar orçamento),
// com aprovação explícita (dryRun calcula o plano sem executar). Fecha o loop no Google.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 30
type ActionType = 'pause' | 'resume' | 'scale'

async function logExecutedAction(userId: string, accountId: string | undefined, body: any, action: ActionType) {
  if (!supabaseAdmin) return
  try {
    await supabaseAdmin.from('executed_actions').insert({
      user_id: userId, account_id: accountId || null, client_name: body.clientName || null,
      campaign_id: String(body.id || ''), campaign_name: body.campaignName || null,
      action, cpl_before: null, spend_before: null,
    })
  } catch { /* tabela ausente — não quebra */ }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const action = body.action as ActionType
  const id = String(body.id || '').trim()            // campaign id (numérico)
  const factor = Number(body.factor) || 1.2
  const dryRun = body.dryRun === true
  if (!['pause', 'resume', 'scale'].includes(action)) return NextResponse.json({ success: false, error: 'Ação inválida.' }, { status: 400 })
  if (!id) return NextResponse.json({ success: false, error: 'ID da campanha ausente.' }, { status: 400 })

  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  if (!devToken) return NextResponse.json({ success: false, error: 'GOOGLE_ADS_DEVELOPER_TOKEN não configurado.' }, { status: 500 })

  let accessToken: string, customerId: string
  try {
    const { getValidGoogleToken } = await import('@/services/google/token-manager')
    const { normalizeCustomerId } = await import('@/lib/google-ads')
    const t = await getValidGoogleToken(userId)
    accessToken = t.accessToken
    customerId = normalizeCustomerId((body.accountId as string) || t.accountId || '')
    if (!customerId) return NextResponse.json({ success: false, error: 'Customer ID do Google Ads não encontrado.' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Falha de autenticação no Google Ads.' }, { status: 401 })
  }

  const { gaqlSearch, googleAdsMutate } = await import('@/lib/google-ads')
  const brl = (n: number) => 'R$' + Math.round(n).toLocaleString('pt-BR')

  try {
    // ── PAUSE / RESUME ───────────────────────────────────────────────────────
    if (action === 'pause' || action === 'resume') {
      const status = action === 'pause' ? 'PAUSED' : 'ENABLED'
      const plan = `${action === 'pause' ? 'Pausar' : 'Reativar'} a campanha "${body.campaignName || id}" no Google Ads.`
      if (dryRun) return NextResponse.json({ success: true, preview: true, plan })
      await googleAdsMutate(customerId, accessToken, devToken, 'campaigns:mutate', {
        operations: [{ updateMask: 'status', update: { resourceName: `customers/${customerId}/campaigns/${id}`, status } }],
      })
      await logExecutedAction(userId, customerId, body, action)
      return NextResponse.json({ success: true, message: action === 'pause' ? 'Campanha pausada no Google Ads.' : 'Campanha reativada no Google Ads.' })
    }

    // ── SCALE (orçamento) ────────────────────────────────────────────────────
    // 1) descobre o orçamento da campanha (resource + valor atual)
    const rows = await gaqlSearch(customerId, accessToken, devToken, `
      SELECT campaign.name, campaign_budget.resource_name, campaign_budget.amount_micros
      FROM campaign WHERE campaign.id = ${Number(id)} LIMIT 1
    `)
    const row: any = rows?.[0]
    const budgetResource = row?.campaignBudget?.resourceName
    const amountMicros = Number(row?.campaignBudget?.amountMicros || 0)
    if (!budgetResource || !amountMicros) {
      return NextResponse.json({ success: false, error: 'Não foi possível ler o orçamento desta campanha no Google.' }, { status: 502 })
    }
    const cur = amountMicros / 1e6
    const next = Math.round(cur * factor)
    const plan = `Aumentar o orçamento diário da campanha "${row?.campaign?.name || body.campaignName}" de ${brl(cur)} para ${brl(next)}/dia (+${Math.round((factor - 1) * 100)}%) no Google Ads.`
    if (dryRun) return NextResponse.json({ success: true, preview: true, plan })

    await googleAdsMutate(customerId, accessToken, devToken, 'campaignBudgets:mutate', {
      operations: [{ updateMask: 'amount_micros', update: { resourceName: budgetResource, amountMicros: String(next * 1e6) } }],
    })
    await logExecutedAction(userId, customerId, body, action)
    return NextResponse.json({ success: true, message: `Orçamento elevado de ${brl(cur)} para ${brl(next)}/dia no Google Ads.` })
  } catch (e: any) {
    console.error('[google/campaign/action]', e?.message)
    return NextResponse.json({ success: false, error: e?.message || 'Erro ao executar a ação no Google Ads.' }, { status: 502 })
  }
}
