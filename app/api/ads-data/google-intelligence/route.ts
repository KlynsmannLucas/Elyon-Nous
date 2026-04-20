// app/api/ads-data/google-intelligence/route.ts
// Google Ads Intelligence — análise profunda de conta com regras + IA
import { NextRequest, NextResponse } from 'next/server'

const CAMPAIGN_TYPE_LABELS: Record<string, string> = {
  SEARCH:             'Pesquisa (Search)',
  SHOPPING:           'Shopping',
  DISPLAY:            'Display / GDN',
  VIDEO:              'YouTube / Vídeo',
  PERFORMANCE_MAX:    'Performance Max',
  SMART:              'Smart Campaign',
  DISCOVERY:          'Discovery',
  LOCAL:              'Local',
  UNKNOWN:            'Outro',
  UNSPECIFIED:        'Outro',
}

const BID_STRATEGY_LABELS: Record<string, string> = {
  TARGET_CPA:               'CPA Alvo',
  TARGET_ROAS:              'ROAS Alvo',
  MAXIMIZE_CONVERSIONS:     'Maximizar Conversões',
  MAXIMIZE_CONVERSION_VALUE:'Maximizar Valor de Conversão',
  TARGET_IMPRESSION_SHARE:  'Parcela de Impressões',
  MANUAL_CPC:               'CPC Manual',
  ENHANCED_CPC:             'CPC Otimizado',
  MANUAL_CPM:               'CPM Manual',
  TARGET_CPM:               'CPM Alvo',
  COMMISSION:               'Comissão',
}

type CampaignStatus = 'ENABLED' | 'PAUSED' | 'REMOVED' | string
type RecType = 'critical' | 'warning' | 'opportunity'

interface GoogleCampaign {
  id: string; name: string; status: CampaignStatus
  campaignType: string; campaignTypeLabel: string
  bidStrategyType: string; bidStrategyLabel: string
  spend: number; impressions: number; clicks: number
  ctr: number; cpc: number; cpm: number
  conversions: number; conversionRate: number
  cpa: number; roas: number; revenue: number
  issues: string[]; recommendations: string[]
}

type RecItem = { type: RecType; title: string; description: string }

export async function POST(req: NextRequest) {
  try {
    const { accessToken, accountId } = await req.json()
    if (!accessToken || !accountId) {
      return NextResponse.json({ success: false, error: 'Token ou Account ID não fornecido.' }, { status: 400 })
    }

    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
    if (!developerToken) {
      return NextResponse.json({ success: false, error: 'GOOGLE_ADS_DEVELOPER_TOKEN não configurado.' }, { status: 500 })
    }

    const cleanId = String(accountId).replace(/-/g, '')

    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        campaign.bidding_strategy_type,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions,
        metrics.conversions_value,
        metrics.cost_per_conversion,
        metrics.ctr,
        metrics.average_cpc,
        metrics.average_cpm
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
        AND campaign.status != 'REMOVED'
      ORDER BY metrics.cost_micros DESC
      LIMIT 50
    `.trim()

    const res = await fetch(
      `https://googleads.googleapis.com/v16/customers/${cleanId}/googleAds:search`,
      {
        method: 'POST',
        headers: {
          'Authorization':   `Bearer ${accessToken}`,
          'developer-token': developerToken,
          'Content-Type':    'application/json',
        },
        body:   JSON.stringify({ query }),
        signal: AbortSignal.timeout(20000),
      }
    )

    const data = await res.json()

    if (data.error || !res.ok) {
      const msg = data.error?.message
        || data.error?.details?.[0]?.errors?.[0]?.message
        || 'Erro na Google Ads API'
      return NextResponse.json({ success: false, error: msg }, { status: 400 })
    }

    const campaigns: GoogleCampaign[] = (data.results || []).map((r: any): GoogleCampaign => {
      const c = r.campaign
      const m = r.metrics

      const spend       = (m.costMicros || 0) / 1_000_000
      const impressions = parseInt(m.impressions || '0')
      const clicks      = parseInt(m.clicks || '0')
      const conversions = parseFloat(m.conversions || '0')
      const revenue     = parseFloat(m.conversionsValue || '0')

      const ctr            = impressions > 0 ? +((clicks / impressions) * 100).toFixed(2) : parseFloat(m.ctr || '0') * 100
      const cpc            = clicks > 0 ? +(spend / clicks).toFixed(2) : (m.averageCpc ? m.averageCpc / 1_000_000 : 0)
      const cpm            = impressions > 0 ? +((spend / impressions) * 1000).toFixed(2) : (m.averageCpm ? m.averageCpm / 1_000_000 : 0)
      const conversionRate = clicks > 0 ? +((conversions / clicks) * 100).toFixed(2) : 0
      const cpa            = conversions > 0 ? +(spend / conversions).toFixed(2) : 0
      const roas           = spend > 0 && revenue > 0 ? +(revenue / spend).toFixed(2) : 0

      const campaignType      = c.advertisingChannelType || 'UNKNOWN'
      const bidStrategyType   = c.biddingStrategyType    || 'UNKNOWN'
      const campaignTypeLabel = CAMPAIGN_TYPE_LABELS[campaignType]      || campaignType
      const bidStrategyLabel  = BID_STRATEGY_LABELS[bidStrategyType]    || bidStrategyType

      // ── Problemas ──────────────────────────────────────────────────────────────
      const issues: string[] = []
      if (ctr < 1.0 && spend > 200 && campaignType === 'SEARCH')    issues.push('CTR baixo para Search (<1%)')
      if (ctr < 0.1 && spend > 100 && campaignType === 'DISPLAY')   issues.push('CTR crítico para Display (<0.1%)')
      if (spend > 500 && conversions === 0)                          issues.push('Sem conversões registradas')
      if (cpa > 1000 && conversions > 0)                             issues.push('CPA muito alto (>R$1.000)')
      if (roas > 0 && roas < 1)                                      issues.push('ROAS negativo (<1×)')
      if (bidStrategyType === 'MANUAL_CPC' && spend > 500)           issues.push('Lances manuais — considere estratégia automática')

      // ── Recomendações ──────────────────────────────────────────────────────────
      const recommendations: string[] = []
      if (ctr < 1.0 && campaignType === 'SEARCH')                    recommendations.push('Revise os textos dos anúncios e adicione extensões para melhorar o CTR')
      if (ctr < 0.1 && campaignType === 'DISPLAY')                   recommendations.push('Troque os banners — CTR baixo no Display indica criativos pouco relevantes')
      if (spend > 300 && conversions === 0)                           recommendations.push('Verifique a tag de conversão e o evento de acompanhamento na landing page')
      if (bidStrategyType === 'MANUAL_CPC' && spend > 500)           recommendations.push('Migre para "Maximizar Conversões" com CPA alvo para escalar com eficiência')
      if (campaignType === 'PERFORMANCE_MAX' && conversions < 30)    recommendations.push('PMAX precisa de pelo menos 30-50 conversões/mês para otimizar — alimente mais sinais de audiência')
      if (roas > 0 && roas < 1.5)                                     recommendations.push('ROAS abaixo do break-even — revise o bid, a landing page e o funil de conversão')
      if (cpa > 0 && cpa < 100 && conversions > 10)                  recommendations.push('CPA eficiente — considere aumentar o orçamento 20-30% para escalar')
      if (campaignType === 'SEARCH' && conversionRate < 1)           recommendations.push('Taxa de conversão baixa — otimize a landing page e teste variações de copy')

      return {
        id: c.id, name: c.name, status: c.status,
        campaignType, campaignTypeLabel,
        bidStrategyType, bidStrategyLabel,
        spend, impressions, clicks, ctr, cpc, cpm,
        conversions, conversionRate, cpa, roas, revenue,
        issues, recommendations,
      }
    })

    // ── Agrupamento por tipo de campanha ────────────────────────────────────────
    const byType: Record<string, {
      label: string; count: number
      totalSpend: number; totalConversions: number; totalRevenue: number
      avgCPA: number; avgROAS: number
    }> = {}

    for (const c of campaigns) {
      if (!byType[c.campaignType]) {
        byType[c.campaignType] = {
          label: c.campaignTypeLabel, count: 0,
          totalSpend: 0, totalConversions: 0, totalRevenue: 0,
          avgCPA: 0, avgROAS: 0,
        }
      }
      const g = byType[c.campaignType]
      g.count++
      g.totalSpend       += c.spend
      g.totalConversions += c.conversions
      g.totalRevenue     += c.revenue
    }
    for (const g of Object.values(byType)) {
      g.avgCPA  = g.totalConversions > 0 ? +(g.totalSpend / g.totalConversions).toFixed(2) : 0
      g.avgROAS = g.totalSpend > 0 && g.totalRevenue > 0 ? +(g.totalRevenue / g.totalSpend).toFixed(2) : 0
    }

    // ── Totais ──────────────────────────────────────────────────────────────────
    const activeCampaigns = campaigns.filter(c => c.status === 'ENABLED' && c.spend > 0)
    const totalSpend       = campaigns.reduce((s, c) => s + c.spend,       0)
    const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0)
    const totalRevenue     = campaigns.reduce((s, c) => s + c.revenue,     0)
    const totalClicks      = campaigns.reduce((s, c) => s + c.clicks,      0)
    const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0)
    const avgCTR           = totalImpressions > 0 ? +((totalClicks / totalImpressions) * 100).toFixed(2) : 0
    const avgCPA           = totalConversions > 0 ? +(totalSpend / totalConversions).toFixed(2) : 0
    const avgROAS          = totalSpend > 0 && totalRevenue > 0 ? +(totalRevenue / totalSpend).toFixed(2) : 0
    const avgCVR           = totalClicks > 0 ? +((totalConversions / totalClicks) * 100).toFixed(2) : 0

    // ── Score (0-100) ───────────────────────────────────────────────────────────
    let score = 60
    if (avgCTR >= 5.0)       score += 15; else if (avgCTR >= 2.5) score += 8; else if (avgCTR < 1.0) score -= 12
    if (avgCVR >= 5.0)       score += 15; else if (avgCVR >= 2.0) score += 7; else if (avgCVR < 1.0) score -= 10
    const issueRatio = campaigns.length > 0 ? campaigns.filter(c => c.issues.length > 0).length / campaigns.length : 0
    if (issueRatio < 0.2)    score += 10; else if (issueRatio > 0.5) score -= 15
    if (avgROAS >= 3)         score += 10; else if (avgROAS > 0 && avgROAS < 1) score -= 10
    const smartBidCount = campaigns.filter(c =>
      ['TARGET_CPA','TARGET_ROAS','MAXIMIZE_CONVERSIONS','MAXIMIZE_CONVERSION_VALUE'].includes(c.bidStrategyType)
    ).length
    if (activeCampaigns.length > 0 && smartBidCount / activeCampaigns.length >= 0.7) score += 5
    score = Math.max(20, Math.min(99, Math.round(score)))
    const scoreGrade =
      score >= 90 ? 'A+' : score >= 85 ? 'A'  : score >= 80 ? 'A-' :
      score >= 75 ? 'B+' : score >= 70 ? 'B'  : score >= 65 ? 'B-' :
      score >= 55 ? 'C+' : score >= 45 ? 'C'  : 'D'

    // ── Recomendações globais ────────────────────────────────────────────────────
    const globalRecs: RecItem[] = []

    const noConvC = campaigns.filter(c => c.spend > 300 && c.conversions === 0)
    if (noConvC.length > 0) {
      const wasted = noConvC.reduce((s, c) => s + c.spend, 0)
      globalRecs.push({
        type: 'critical',
        title: `R$${wasted.toFixed(0)} em campanhas sem conversão`,
        description: `${noConvC.length} campanha(s) gastando sem registrar conversões. Verifique a tag de conversão, o pixel/evento e a landing page.`,
      })
    }

    const manualBidC = campaigns.filter(c => c.bidStrategyType === 'MANUAL_CPC' && c.spend > 300)
    if (manualBidC.length > 0) {
      globalRecs.push({
        type: 'warning',
        title: `${manualBidC.length} campanha(s) com CPC Manual`,
        description: 'Campanhas com lances manuais deixam dinheiro na mesa. Migre para estratégias automáticas (Maximizar Conversões ou CPA Alvo) para aproveitar o machine learning do Google.',
      })
    }

    const lowCtrSearchC = campaigns.filter(c => c.campaignType === 'SEARCH' && c.ctr < 1.0 && c.spend > 150)
    if (lowCtrSearchC.length > 0) {
      globalRecs.push({
        type: 'warning',
        title: `${lowCtrSearchC.length} campanha(s) de Search com CTR abaixo de 1%`,
        description: 'CTR baixo no Search indica anúncios pouco relevantes ou palavras-chave muito genéricas. Revise os textos, adicione extensões e refine as correspondências.',
      })
    }

    const pmaxC = campaigns.filter(c => c.campaignType === 'PERFORMANCE_MAX' && c.conversions < 30)
    if (pmaxC.length > 0) {
      globalRecs.push({
        type: 'warning',
        title: `${pmaxC.length} campanha(s) PMAX com menos de 30 conversões`,
        description: 'Performance Max precisa de volume de conversões para otimizar. Alimente mais sinais de audiência (listas de clientes, visitantes do site) e aguarde ao menos 4-6 semanas.',
      })
    }

    const highROASC = campaigns.filter(c => c.roas >= 3)
    if (highROASC.length > 0) {
      globalRecs.push({
        type: 'opportunity',
        title: `${highROASC.length} campanha(s) com ROAS ≥ 3× — candidatas a escalar`,
        description: 'Aumente o orçamento 20-30% por semana mantendo o ROAS alvo. Certifique-se de ter volume de conversões suficiente antes de escalar.',
      })
    }

    if (avgCVR >= 3) {
      globalRecs.push({
        type: 'opportunity',
        title: `Taxa de conversão de ${avgCVR}% — landing page performando bem`,
        description: 'Com boa taxa de conversão, o próximo passo é aumentar o volume de tráfego qualificado. Expanda palavras-chave de cauda longa e teste campanhas PMAX com asset groups novos.',
      })
    }

    return NextResponse.json({
      success: true,
      score, scoreGrade,
      campaigns, byType,
      totals: {
        spend:           totalSpend,
        conversions:     totalConversions,
        revenue:         totalRevenue,
        clicks:          totalClicks,
        impressions:     totalImpressions,
        avgCTR,
        avgCPA,
        avgROAS,
        avgCVR,
        activeCampaigns: activeCampaigns.length,
        totalCampaigns:  campaigns.length,
      },
      globalRecs,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
