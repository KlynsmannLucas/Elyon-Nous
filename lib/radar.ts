// lib/radar.ts — Motor do RADAR (compartilhado pela rota /api/radar e pelo Pulse).
// Vigia Meta + Google (últimos 7 dias), detecta vazamento/risco/oportunidade,
// quantifica em R$ e usa a PRÓPRIA média da conta (daily_metrics) como baseline.
import { getValidMetaToken } from '@/services/meta/token-manager'
import { getBenchmark } from '@/lib/niche_benchmarks'
import { supabaseAdmin } from '@/lib/supabase'

export type Severity = 'leak' | 'risk' | 'opportunity'
export type RadarAction = 'pause' | 'scale'
export interface RadarAlert {
  severity: Severity
  title: string
  detail: string
  money: number
  deltaPct?: number | null
  campaignId?: string
  campaignName?: string
  platform?: 'meta' | 'google'
  action?: RadarAction
}

export interface BuildRadarOpts {
  userId: string
  niche?: string
  metaAccountId?: string
  googleAccountId?: string
  ticket?: number
  margin?: number
  convRate?: number
  // Isolamento por cliente: quando true, usa SOMENTE as contas passadas (meta/google).
  // Sem conta explícita, NÃO cai na conta padrão do usuário (que é de outro cliente).
  // O Pulse (cron, por usuário) não passa esse flag e mantém o comportamento antigo.
  strictAccounts?: boolean
}

const LEAD_RE = /lead|complete_registration|onsite_conversion\.messaging|purchase|offsite_conversion\.fb_pixel_(lead|purchase|complete_registration)/i
const brl = (n: number) => 'R$' + Math.round(n || 0).toLocaleString('pt-BR')
const leadsFromActions = (actions: any[]): number =>
  Array.isArray(actions) ? actions.reduce((t, a) => t + (LEAD_RE.test(a?.action_type || '') ? Number(a?.value || 0) : 0), 0) : 0

export async function buildRadar(opts: BuildRadarOpts): Promise<{ alerts: RadarAlert[]; moneyAtRisk: number; analyzed: number }> {
  const { userId, niche = '' } = opts
  const ticket = Number(opts.ticket) || 0
  const margin = Number(opts.margin) || 0
  const convRate = Number(opts.convRate) || 0
  const bench = getBenchmark(niche)
  // E-commerce/varejo (compra direta): break-even = ticket × margem (o CPL já é o CPA,
  // não se multiplica pela conversão lead→venda). Lead-gen: ticket × margem × conversão.
  const breakeven = bench?.directPurchase
    ? (ticket > 0 && margin > 0 ? Math.round(ticket * (margin / 100)) : null)
    : (ticket > 0 && margin > 0 && convRate > 0 ? Math.round(ticket * (margin / 100) * (convRate / 100)) : null)
  const cplMin = bench?.cpl_min ?? null

  const alerts: RadarAlert[] = []

  // ── META (últimos 7 dias) ────────────────────────────────────────────────
  let metaAccountId: string | null = null
  let camps: { id: string; name: string; spend: number; leads: number; cpl: number; freq: number }[] = []
  try {
    const t = await getValidMetaToken(userId)
    metaAccountId = opts.strictAccounts ? (opts.metaAccountId || null) : (opts.metaAccountId || t.accountId)
    if (metaAccountId) {
      const token = encodeURIComponent(t.accessToken)
      const fields = 'campaign_id,campaign_name,spend,frequency,actions'
      const url = `https://graph.facebook.com/v21.0/act_${metaAccountId}/insights?fields=${fields}&level=campaign&date_preset=last_7d&limit=80&access_token=${token}`
      const res = await fetch(url, { signal: AbortSignal.timeout(18000) })
      const json = await res.json()
      if (!json?.error) {
        camps = (json?.data || []).map((r: any) => {
          const spend = Number(r.spend || 0)
          const leads = leadsFromActions(r.actions)
          return { id: String(r.campaign_id || ''), name: r.campaign_name || 'Campanha', spend, leads, cpl: leads > 0 ? spend / leads : Infinity, freq: Number(r.frequency || 0) }
        }).filter((c: any) => c.spend > 0)
      }
    }
  } catch { /* Meta não conectado */ }

  const totalSpend = camps.reduce((s, c) => s + c.spend, 0)

  // 🔴 Vazamento: gasto sem conversão
  const waste = camps.filter(c => c.leads === 0 && c.spend > Math.max(100, totalSpend * 0.05)).sort((a, b) => b.spend - a.spend)
  if (waste.length) {
    const c = waste[0]
    const wasteTotal = waste.reduce((s, x) => s + x.spend, 0)
    alerts.push({ severity: 'leak', title: `${brl(c.spend)} queimados sem conversão`, detail: waste.length > 1 ? `"${c.name}" e mais ${waste.length - 1} campanha(s) gastaram ${brl(wasteTotal)} em 7 dias sem 1 conversão.` : `"${c.name}" gastou sem gerar nenhum resultado em 7 dias.`, money: Math.round(wasteTotal), campaignId: c.id || undefined, campaignName: c.name, platform: 'meta', action: c.id ? 'pause' : undefined })
  }

  // 🔴 Prejuízo: CPL acima do equilíbrio
  if (breakeven) {
    const loss = camps.filter(c => c.leads > 0 && c.cpl > breakeven).sort((a, b) => (b.cpl - breakeven) * b.leads - (a.cpl - breakeven) * a.leads)
    if (loss.length) {
      const c = loss[0]
      const extra = Math.round((c.cpl - breakeven) * c.leads)
      alerts.push({ severity: 'leak', title: `"${c.name}" dá prejuízo (CPL ${brl(c.cpl)})`, detail: `Acima do seu equilíbrio (${brl(breakeven)}). Cada lead custa mais do que gera de lucro — ~${brl(extra)} a mais em 7 dias.`, money: extra, campaignId: c.id || undefined, campaignName: c.name, platform: 'meta', action: c.id ? 'pause' : undefined })
    }
  }

  // 🟡 Fadiga de criativo
  const sat = camps.filter(c => c.freq >= 3.5).sort((a, b) => b.freq - a.freq)
  if (sat.length) {
    const c = sat[0]
    alerts.push({ severity: 'risk', title: `"${c.name}" com fadiga (frequência ${c.freq.toFixed(1)}×)`, detail: `O público está vendo o mesmo anúncio demais — o CTR cai e o CPL sobe. Renove o criativo.`, money: 0, campaignName: c.name, platform: 'meta' })
  }

  // 🟢 Vencedora barata → escalar
  const winThreshold = breakeven ? breakeven * 0.7 : cplMin
  if (winThreshold) {
    const winners = camps.filter(c => c.leads > 1 && c.cpl <= winThreshold).sort((a, b) => a.cpl - b.cpl)
    if (winners.length) {
      const c = winners[0]
      alerts.push({ severity: 'opportunity', title: `"${c.name}" rende barato (CPL ${brl(c.cpl)}) — escale`, detail: `Bem abaixo do seu alvo. Suba o orçamento ~20% enquanto o CPL segurar — dá pra colocar ~${brl(c.spend * 0.2)}/sem a mais com lucro.`, money: Math.round(c.spend * 0.2), campaignId: c.id || undefined, campaignName: c.name, platform: 'meta', action: c.id ? 'scale' : undefined })
    }
  }

  // 🔴/🟡 Baseline: CPL de ontem vs a própria média (daily_metrics)
  if (supabaseAdmin && metaAccountId) {
    try {
      const { data: series } = await supabaseAdmin.from('daily_metrics')
        .select('date, cpl, leads').eq('user_id', userId).eq('account_id', metaAccountId)
        .order('date', { ascending: false }).limit(8)
      const withCpl = (series || []).filter(r => r.cpl != null)
      if (withCpl.length >= 4) {
        const yest = withCpl[0]
        const prior = withCpl.slice(1)
        const avg = prior.reduce((s, r) => s + (r.cpl || 0), 0) / prior.length
        if (avg > 0 && yest.cpl! > avg * 1.25) {
          const deltaPct = Math.round(((yest.cpl! - avg) / avg) * 100)
          const extra = Math.round((yest.cpl! - avg) * (yest.leads || 0))
          alerts.push({ severity: deltaPct >= 50 ? 'leak' : 'risk', title: `CPL da conta disparou ${deltaPct}% vs sua média`, detail: `Ontem o CPL foi ${brl(yest.cpl!)} contra a sua média de ${brl(avg)}. Algo mudou — investigue antes que escale.`, money: extra > 0 ? extra : 0, deltaPct })
        }
      }
    } catch { /* baseline opcional */ }
  }

  // ── GOOGLE (últimos 7 dias) ──────────────────────────────────────────────
  try {
    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
    if (devToken) {
      const { getValidGoogleToken } = await import('@/services/google/token-manager')
      const { gaqlSearch, normalizeCustomerId } = await import('@/lib/google-ads')
      const gt = await getValidGoogleToken(userId)
      const cid = normalizeCustomerId(opts.strictAccounts ? (opts.googleAccountId || '') : (opts.googleAccountId || gt.accountId || ''))
      if (cid) {
        const results = await gaqlSearch(cid, gt.accessToken, devToken, `
          SELECT campaign.id, campaign.name, metrics.cost_micros, metrics.conversions, metrics.conversions_value
          FROM campaign
          WHERE segments.date DURING LAST_7_DAYS AND campaign.status = 'ENABLED'
          ORDER BY metrics.cost_micros DESC LIMIT 40
        `)
        const gcamps = (results || []).map((r: any) => {
          const m = r.metrics || {}
          const cost = Number(m.costMicros || 0) / 1e6
          const conv = Number(m.conversions || 0)
          const rev = Number(m.conversionsValue || 0) / 1e6
          return { id: String(r.campaign?.id || ''), name: r.campaign?.name || 'Campanha', cost, conv, cpa: conv > 0 ? cost / conv : Infinity, roas: cost > 0 ? rev / cost : 0, hasRev: rev > 0 }
        }).filter((c: any) => c.cost > 0)
        const gTotal = gcamps.reduce((s: number, c: any) => s + c.cost, 0)

        const gLoss = gcamps.filter((c: any) => c.hasRev && c.roas < 1).sort((a: any, b: any) => a.roas - b.roas)
        if (gLoss.length) {
          const c = gLoss[0]
          alerts.push({ severity: 'leak', title: `"${c.name}" no prejuízo (ROAS ${c.roas.toFixed(2)}×)`, detail: `Gasta ${brl(c.cost)} e retorna menos que o investido em 7 dias — revise lances, negativas e a landing.`, money: Math.round(c.cost), campaignId: c.id || undefined, campaignName: c.name, platform: 'google', action: c.id ? 'pause' : undefined })
        }
        const gWaste = gcamps.filter((c: any) => c.conv === 0 && c.cost > Math.max(100, gTotal * 0.05)).sort((a: any, b: any) => b.cost - a.cost)
        if (gWaste.length) {
          const c = gWaste[0]
          const wt = gWaste.reduce((s: number, x: any) => s + x.cost, 0)
          alerts.push({ severity: 'leak', title: `${brl(c.cost)} no Google sem conversão`, detail: gWaste.length > 1 ? `"${c.name}" e mais ${gWaste.length - 1} somam ${brl(wt)} em 7 dias sem resultado.` : `"${c.name}" gastou sem converter — adicione negativas ou pause.`, money: Math.round(wt), campaignId: c.id || undefined, campaignName: c.name, platform: 'google', action: c.id ? 'pause' : undefined })
        }
        const be2 = breakeven
        const gWin = gcamps.filter((c: any) => c.conv > 1 && (be2 ? c.cpa <= be2 * 0.7 : c.roas >= 2)).sort((a: any, b: any) => a.cpa - b.cpa)
        if (gWin.length) {
          const c = gWin[0]
          alerts.push({ severity: 'opportunity', title: `"${c.name}" rende bem no Google — escale`, detail: `${be2 ? `CPA ${brl(c.cpa)} abaixo do alvo` : `ROAS ${c.roas.toFixed(1)}×`}. Aumente o orçamento ~20% e amplie palavras-chave.`, money: Math.round(c.cost * 0.2), campaignId: c.id || undefined, campaignName: c.name, platform: 'google', action: c.id ? 'scale' : undefined })
        }
      }
    }
  } catch { /* Google não conectado */ }

  // Não repetir: suprime recomendações de ações já EXECUTADAS nos últimos 7 dias
  // (ex.: já escalei essa campanha → não recomendar escalar de novo até a ação fazer efeito).
  let actioned = new Set<string>()
  if (supabaseAdmin && userId) {
    try {
      const since = new Date(Date.now() - 7 * 86400000).toISOString()
      const { data } = await supabaseAdmin.from('executed_actions')
        .select('campaign_id, action, executed_at').eq('user_id', userId).gte('executed_at', since)
      actioned = new Set((data || []).map((a: any) => `${a.campaign_id}|${a.action}`))
    } catch { /* sem tabela — segue sem suprimir */ }
  }
  const visible = actioned.size
    ? alerts.filter(a => !(a.action && a.campaignId && actioned.has(`${a.campaignId}|${a.action}`)))
    : alerts

  const sev: Record<Severity, number> = { leak: 0, risk: 1, opportunity: 2 }
  visible.sort((a, b) => sev[a.severity] - sev[b.severity] || b.money - a.money)
  const moneyAtRisk = visible.filter(a => a.severity !== 'opportunity').reduce((s, a) => s + (a.money || 0), 0)
  return { alerts: visible, moneyAtRisk, analyzed: camps.length }
}
