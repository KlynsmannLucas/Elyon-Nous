// app/api/insights/route.ts
// Insights do NOUS — observações ESPECÍFICAS derivadas das campanhas reais do Meta,
// sem depender de rodar a Análise Profunda. Uma chamada leve + regras determinísticas.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getValidMetaToken } from '@/services/meta/token-manager'
import { getBenchmark } from '@/lib/niche_benchmarks'

export const maxDuration = 30

type Tone = 'bad' | 'warn' | 'good' | 'blue'
type Action = 'pause' | 'scale'
interface Insight { tone: Tone; title: string; body?: string; tag?: string; campaignId?: string; campaignName?: string; action?: Action; platform?: 'meta' | 'google' }

const LEAD_RE = /lead|complete_registration|onsite_conversion\.messaging|purchase|offsite_conversion\.fb_pixel_(lead|purchase|complete_registration)/i
const REMARKETING_RE = /\b(remar|retar|remarketing|retargeting|rmk|bof|bofu|quente|hot|carrinho|abandon)/i

function leadsFromActions(actions: any[]): number {
  if (!Array.isArray(actions)) return 0
  // Evita dupla contagem: prioriza messaging/lead; soma valores dos tipos relevantes.
  let total = 0
  for (const a of actions) {
    if (LEAD_RE.test(a?.action_type || '')) total += Number(a?.value || 0)
  }
  return total
}

const brl = (n: number) => 'R$' + Math.round(n || 0).toLocaleString('pt-BR')

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })

  try {
    const body = await req.json().catch(() => ({}))
    const niche = (body.niche as string) || ''
    const bodyAccountId = body.accountId as string | undefined

    // ── META (opcional — se não conectado, seguimos só com Google) ───────────
    let camps: { id: string; name: string; spend: number; leads: number; cpl: number; ctr: number; freq: number; impressions: number }[] = []
    try {
      const t = await getValidMetaToken(userId)
      const accountId = bodyAccountId || t.accountId
      if (accountId) {
        const act = `act_${accountId}`
        const token = encodeURIComponent(t.accessToken)
        const fields = 'campaign_id,campaign_name,spend,impressions,clicks,reach,frequency,ctr,actions'
        const url = `https://graph.facebook.com/v21.0/${act}/insights?fields=${fields}&level=campaign&date_preset=last_30d&limit=80&access_token=${token}`
        const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
        const json = await res.json()
        if (!json?.error) {
          camps = (json?.data || []).map((r: any) => {
            const spend = Number(r.spend || 0)
            const leads = leadsFromActions(r.actions)
            return { id: String(r.campaign_id || ''), name: r.campaign_name || 'Campanha', spend, leads, cpl: leads > 0 ? spend / leads : Infinity, ctr: Number(r.ctr || 0), freq: Number(r.frequency || 0), impressions: Number(r.impressions || 0) }
          }).filter((c: any) => c.spend > 0)
        }
      }
    } catch { /* Meta não conectado */ }

    const bench = getBenchmark(niche)
    const cplMax = bench?.cpl_max ?? null
    const cplMin = bench?.cpl_min ?? null
    const totalSpend = camps.reduce((s, c) => s + c.spend, 0)
    const freqLimit = 3.5

    // #3 Unit economics — CPL de equilíbrio (acima disso o lead dá PREJUÍZO).
    const ticket = Number(body.ticket) || 0
    const margin = Number(body.margin) || 0     // %
    const convRate = Number(body.convRate) || 0 // % lead -> venda
    const breakeven = ticket > 0 && margin > 0 && convRate > 0
      ? Math.round(ticket * (margin / 100) * (convRate / 100))
      : null

    const insights: Insight[] = []

    // Prioridade máxima: campanhas que custam mais que o lucro por lead (prejuízo real).
    if (breakeven && breakeven > 0) {
      const loss = camps.filter(c => c.leads > 0 && c.cpl > breakeven).sort((a, b) => b.cpl - a.cpl)
      if (loss.length) {
        const c = loss[0]
        insights.push({ tone: 'bad', tag: 'Prejuízo', title: `"${c.name}" dá prejuízo (CPL ${brl(c.cpl)})`, body: `Acima do seu CPL de equilíbrio (${brl(breakeven)} = ticket × margem × conversão). Cada lead aqui custa mais do que gera de lucro.`, campaignId: c.id || undefined, campaignName: c.name, action: c.id ? 'pause' : undefined })
      } else {
        insights.push({ tone: 'good', tag: 'Lucro', title: `Toda a conta opera no lucro`, body: `Nenhuma campanha acima do CPL de equilíbrio (${brl(breakeven)}). Foque em escalar as vencedoras.` })
      }
    }

    // 1. Saturação de público (frequência alta)
    const saturated = camps.filter(c => c.freq >= freqLimit).sort((a, b) => b.freq - a.freq)
    if (saturated.length) {
      const c = saturated[0]
      insights.push({ tone: c.freq >= 5 ? 'bad' : 'warn', tag: 'Criativo', title: `"${c.name}" com frequência ${c.freq.toFixed(1)}×`, body: `O público está vendo o mesmo anúncio demais — renove o criativo antes que o CTR caia e o CPL suba.` })
    }

    // 2. Desperdício (gasto relevante, zero conversão)
    const waste = camps.filter(c => c.leads === 0 && c.spend > Math.max(200, totalSpend * 0.05)).sort((a, b) => b.spend - a.spend)
    if (waste.length) {
      const c = waste[0]
      const wasteTotal = waste.reduce((s, x) => s + x.spend, 0)
      insights.push({ tone: 'bad', tag: 'Desperdício', title: `"${c.name}" gastou ${brl(c.spend)} sem conversão`, body: waste.length > 1 ? `${waste.length} campanhas sem nenhum resultado somam ${brl(wasteTotal)} — pause e realoque.` : 'Pause ou revise o público/criativo desta campanha.', campaignId: c.id || undefined, campaignName: c.name, action: c.id ? 'pause' : undefined })
    }

    // 3. CPL muito acima do benchmark — só quando NÃO há unit economics (senão usamos o prejuízo real acima)
    if (cplMax && !breakeven) {
      const overpriced = camps.filter(c => c.leads > 0 && c.cpl > cplMax).sort((a, b) => b.cpl - a.cpl)
      if (overpriced.length) {
        const c = overpriced[0]
        insights.push({ tone: 'warn', tag: 'CPL', title: `"${c.name}" com CPL ${brl(c.cpl)}`, body: `${(c.cpl / cplMax).toFixed(1)}× o teto do benchmark (${brl(cplMax)}) — revise segmentação ou corte a verba.`, campaignId: c.id || undefined, campaignName: c.name, action: c.id ? 'pause' : undefined })
      }
    }

    // 4. Vencedora (CPL abaixo do piso) — escalar
    if (cplMin) {
      const winners = camps.filter(c => c.leads > 1 && c.cpl <= cplMin).sort((a, b) => a.cpl - b.cpl)
      if (winners.length) {
        const c = winners[0]
        insights.push({ tone: 'good', tag: 'Escalar', title: `"${c.name}" rende abaixo do mercado (CPL ${brl(c.cpl)})`, body: `Abaixo do piso do nicho (${brl(cplMin)}) — suba o budget 15–20%/semana enquanto o CPL segurar.`, campaignId: c.id || undefined, campaignName: c.name, action: c.id ? 'scale' : undefined })
      }
    }

    // 5. CTR baixo (criativo fraco)
    const lowCtr = camps.filter(c => c.impressions > 2000 && c.ctr > 0 && c.ctr < 1).sort((a, b) => a.ctr - b.ctr)
    if (lowCtr.length && insights.length < 6) {
      const c = lowCtr[0]
      insights.push({ tone: 'warn', tag: 'Criativo', title: `CTR de ${c.ctr.toFixed(2)}% em "${c.name}"`, body: 'Abaixo de 1% — o criativo/oferta não está prendendo. Teste um novo ângulo (dor, prova social).' })
    }

    // 6. Concentração de verba
    const top = [...camps].sort((a, b) => b.spend - a.spend)[0]
    if (top && totalSpend > 0 && top.spend / totalSpend > 0.5 && camps.length > 1) {
      insights.push({ tone: 'blue', tag: 'Risco', title: `${Math.round((top.spend / totalSpend) * 100)}% da verba em 1 campanha`, body: `"${top.name}" concentra quase tudo — diversifique para reduzir o risco se ela cair.` })
    }

    // 7. Sem remarketing ativo
    const hasRmk = camps.some(c => REMARKETING_RE.test(c.name))
    if (!hasRmk && insights.length < 6) {
      insights.push({ tone: 'blue', tag: 'Funil', title: 'Nenhuma campanha de remarketing ativa', body: 'Você está deixando na mesa quem já te conhece — crie audiências de visitantes 7d/30d e leads sem conversão.' })
    }

    // ── GOOGLE ADS (mesma inteligência: prejuízo/ROAS, desperdício, CPA, vencedora) ──
    let gAnalyzed = 0
    try {
      const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
      if (devToken) {
        const { getValidGoogleToken } = await import('@/services/google/token-manager')
        const { gaqlSearch, normalizeCustomerId } = await import('@/lib/google-ads')
        const gt = await getValidGoogleToken(userId)
        const cid = normalizeCustomerId((body.googleAccountId as string) || gt.accountId || '')
        if (cid) {
          const results = await gaqlSearch(cid, gt.accessToken, devToken, `
            SELECT campaign.id, campaign.name, metrics.cost_micros, metrics.conversions, metrics.conversions_value, metrics.ctr, metrics.cost_per_conversion
            FROM campaign
            WHERE segments.date DURING LAST_30_DAYS AND campaign.status = 'ENABLED'
            ORDER BY metrics.cost_micros DESC LIMIT 40
          `)
          const gcamps = (results || []).map((r: any) => {
            const m = r.metrics || {}
            const cost = Number(m.costMicros || 0) / 1e6
            const conv = Number(m.conversions || 0)
            const rev = Number(m.conversionsValue || 0) / 1e6
            return { id: String(r.campaign?.id || ''), name: r.campaign?.name || 'Campanha', cost, conv, cpa: conv > 0 ? cost / conv : Infinity, roas: cost > 0 ? rev / cost : 0, hasRev: rev > 0, ctr: Number(m.ctr || 0) * 100 }
          }).filter((c: any) => c.cost > 0)
          gAnalyzed = gcamps.length
          const gTotal = gcamps.reduce((s: number, c: any) => s + c.cost, 0)

          // Prejuízo (ROAS < 1 em campanhas com receita) — o caso mais grave no Google.
          const gLoss = gcamps.filter((c: any) => c.hasRev && c.roas < 1).sort((a: any, b: any) => a.roas - b.roas)
          if (gLoss.length) {
            const c = gLoss[0]
            insights.push({ tone: 'bad', tag: 'Google · Prejuízo', title: `"${c.name}" com ROAS ${c.roas.toFixed(2)}×`, body: `Gasta ${brl(c.cost)} e retorna menos que o investido — revise lances, palavras-chave negativas e a landing.`, campaignId: c.id || undefined, campaignName: c.name, platform: 'google', action: c.id ? 'pause' : undefined })
          }
          // Desperdício (gasto relevante, zero conversão)
          const gWaste = gcamps.filter((c: any) => c.conv === 0 && c.cost > Math.max(200, gTotal * 0.05)).sort((a: any, b: any) => b.cost - a.cost)
          if (gWaste.length && insights.length < 8) {
            const c = gWaste[0]
            const wt = gWaste.reduce((s: number, x: any) => s + x.cost, 0)
            insights.push({ tone: 'bad', tag: 'Google · Desperdício', title: `"${c.name}" gastou ${brl(c.cost)} sem conversão`, body: gWaste.length > 1 ? `${gWaste.length} campanhas Google sem resultado somam ${brl(wt)} — adicione negativas/pause.` : 'Adicione palavras-chave negativas ou pause.', campaignId: c.id || undefined, campaignName: c.name, platform: 'google', action: c.id ? 'pause' : undefined })
          }
          // CPA acima do equilíbrio (prejuízo por lead)
          const be2 = ticket > 0 && margin > 0 && convRate > 0 ? Math.round(ticket * (margin / 100) * (convRate / 100)) : null
          if (be2) {
            const gOver = gcamps.filter((c: any) => c.conv > 0 && c.cpa > be2).sort((a: any, b: any) => b.cpa - a.cpa)
            if (gOver.length && insights.length < 8) {
              const c = gOver[0]
              insights.push({ tone: 'warn', tag: 'Google · CPA', title: `"${c.name}" com CPA ${brl(c.cpa)}`, body: `${(c.cpa / be2).toFixed(1)}× o ponto de equilíbrio (${brl(be2)}) — cada conversão sai cara demais.`, campaignId: c.id || undefined, campaignName: c.name, platform: 'google', action: c.id ? 'pause' : undefined })
            }
          }
          // Vencedora Google (CPA baixo ou ROAS alto)
          const gWin = gcamps.filter((c: any) => c.conv > 1 && (be2 ? c.cpa <= be2 : c.roas >= 2)).sort((a: any, b: any) => a.cpa - b.cpa)
          if (gWin.length && insights.length < 8) {
            const c = gWin[0]
            insights.push({ tone: 'good', tag: 'Google · Escalar', title: `"${c.name}" rende bem no Google${c.roas ? ` (ROAS ${c.roas.toFixed(1)}×)` : ''}`, body: 'Aumente o orçamento e amplie palavras-chave/lances dessa campanha.', campaignId: c.id || undefined, campaignName: c.name, platform: 'google', action: c.id ? 'scale' : undefined })
          }
        }
      }
    } catch { /* Google não conectado */ }

    if (insights.length === 0) {
      return NextResponse.json({ success: true, insights: [], reason: 'no_campaigns' })
    }

    const order: Record<Tone, number> = { bad: 0, warn: 1, good: 2, blue: 3 }
    insights.sort((a, b) => order[a.tone] - order[b.tone])

    return NextResponse.json({ success: true, insights: insights.slice(0, 7), analyzed: camps.length + gAnalyzed })
  } catch (e: any) {
    console.error('[insights]', e?.message)
    return NextResponse.json({ success: false, error: 'Erro ao gerar insights.' }, { status: 500 })
  }
}
