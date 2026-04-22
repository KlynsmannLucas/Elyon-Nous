// app/api/ads-data/google-intelligence/route.ts
// Google Ads Intelligence — campanhas + search terms + QS/IS + auction insights
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

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

type RecType = 'critical' | 'warning' | 'opportunity'

interface GoogleCampaign {
  id: string; name: string; status: string
  campaignType: string; campaignTypeLabel: string
  bidStrategyType: string; bidStrategyLabel: string
  spend: number; impressions: number; clicks: number
  ctr: number; cpc: number; cpm: number
  conversions: number; conversionRate: number
  cpa: number; roas: number; revenue: number
  impressionShare: number | null
  budgetLostIS: number | null
  rankLostIS: number | null
  issues: string[]; recommendations: string[]
}

interface SearchTerm {
  term: string
  campaignName: string
  campaignId: string
  status: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  cpa: number
  ctr: number
  tag: 'waste' | 'opportunity' | 'ok'
}

interface Keyword {
  text: string
  campaignName: string
  qualityScore: number | null
  creativeQuality: string | null
  landingQuality: string | null
  predictedCtr: string | null
  spend: number
  impressions: number
  conversions: number
}

interface AuctionInsight {
  domain: string
  impressionShare: number
  overlapRate: number
  outrankingShare: number
  topOfPageRate: number
  absoluteTopRate: number
}

type RecItem = { type: RecType; title: string; description: string }

async function gaqlSearch(cleanId: string, accessToken: string, developerToken: string, query: string) {
  const res = await fetch(
    `https://googleads.googleapis.com/v18/customers/${cleanId}/googleAds:search`,
    {
      method: 'POST',
      headers: {
        'Authorization':     `Bearer ${accessToken}`,
        'developer-token':   developerToken,
        'login-customer-id': cleanId,
        'Content-Type':      'application/json',
      },
      body:   JSON.stringify({ query: query.trim() }),
      signal: AbortSignal.timeout(20000),
    }
  )
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('application/json')) {
    let hint = ''; try { hint = (await res.text()).slice(0, 200) } catch {}
    throw new Error(`Google Ads API HTTP ${res.status}: ${hint}`)
  }
  const data = await res.json()
  if (data.error) throw new Error(data.error?.message || JSON.stringify(data.error))
  return data.results || []
}

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })

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

    // ── 4 queries em paralelo ───────────────────────────────────────────────
    const [campaignResults, searchTermResults, auctionResults, keywordResults] = await Promise.allSettled([
      gaqlSearch(cleanId, accessToken, developerToken, `
        SELECT
          campaign.id, campaign.name, campaign.status,
          campaign.advertising_channel_type,
          campaign.bidding_strategy_type,
          metrics.cost_micros, metrics.impressions, metrics.clicks,
          metrics.conversions, metrics.conversions_value,
          metrics.cost_per_conversion, metrics.ctr,
          metrics.average_cpc, metrics.average_cpm,
          metrics.search_impression_share,
          metrics.search_budget_lost_impression_share,
          metrics.search_rank_lost_impression_share
        FROM campaign
        WHERE segments.date DURING LAST_30_DAYS
          AND campaign.status != 'REMOVED'
        ORDER BY metrics.cost_micros DESC
        LIMIT 50
      `),
      gaqlSearch(cleanId, accessToken, developerToken, `
        SELECT
          search_term_view.search_term,
          search_term_view.status,
          metrics.cost_micros,
          metrics.impressions,
          metrics.clicks,
          metrics.conversions,
          metrics.cost_per_conversion,
          campaign.name,
          campaign.id
        FROM search_term_view
        WHERE segments.date DURING LAST_30_DAYS
          AND metrics.cost_micros > 0
        ORDER BY metrics.cost_micros DESC
        LIMIT 200
      `),
      gaqlSearch(cleanId, accessToken, developerToken, `
        SELECT
          auction_insight_competitor_metric.domain,
          auction_insight_competitor_metric.impression_share,
          auction_insight_competitor_metric.overlap_rate,
          auction_insight_competitor_metric.outranking_share,
          auction_insight_competitor_metric.top_of_page_rate,
          auction_insight_competitor_metric.absolute_top_of_page_rate,
          campaign.name
        FROM auction_insight_competitor_metric
        WHERE segments.date DURING LAST_30_DAYS
        ORDER BY auction_insight_competitor_metric.impression_share DESC
        LIMIT 20
      `),
      gaqlSearch(cleanId, accessToken, developerToken, `
        SELECT
          ad_group_criterion.keyword.text,
          ad_group_criterion.quality_info.quality_score,
          ad_group_criterion.quality_info.creative_quality_score,
          ad_group_criterion.quality_info.post_click_quality_score,
          ad_group_criterion.quality_info.search_predicted_ctr,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          campaign.name
        FROM keyword_view
        WHERE segments.date DURING LAST_30_DAYS
          AND campaign.status != 'REMOVED'
          AND ad_group.status != 'REMOVED'
          AND ad_group_criterion.status NOT IN ('REMOVED', 'PAUSED')
          AND metrics.impressions > 0
        ORDER BY metrics.cost_micros DESC
        LIMIT 100
      `),
    ])

    // ── Campanhas ───────────────────────────────────────────────────────────
    if (campaignResults.status === 'rejected') {
      return NextResponse.json({ success: false, error: campaignResults.reason?.message || 'Erro na Google Ads API' }, { status: 400 })
    }
    const rawCampaigns = campaignResults.value

    const campaigns: GoogleCampaign[] = rawCampaigns.map((r: any): GoogleCampaign => {
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
      const campaignTypeLabel = CAMPAIGN_TYPE_LABELS[campaignType]   || campaignType
      const bidStrategyLabel  = BID_STRATEGY_LABELS[bidStrategyType] || bidStrategyType

      const isSearch = campaignType === 'SEARCH' || campaignType === 'SHOPPING'
      const impressionShare = isSearch && m.searchImpressionShare != null ? +(m.searchImpressionShare * 100).toFixed(1) : null
      const budgetLostIS    = isSearch && m.searchBudgetLostImpressionShare != null ? +(m.searchBudgetLostImpressionShare * 100).toFixed(1) : null
      const rankLostIS      = isSearch && m.searchRankLostImpressionShare != null ? +(m.searchRankLostImpressionShare * 100).toFixed(1) : null

      const issues: string[] = []
      if (ctr < 1.0 && spend > 200 && campaignType === 'SEARCH')    issues.push('CTR baixo para Search (<1%)')
      if (ctr < 0.1 && spend > 100 && campaignType === 'DISPLAY')   issues.push('CTR crítico para Display (<0.1%)')
      if (spend > 500 && conversions === 0)                          issues.push('Sem conversões registradas')
      if (cpa > 1000 && conversions > 0)                             issues.push('CPA muito alto (>R$1.000)')
      if (roas > 0 && roas < 1)                                      issues.push('ROAS negativo (<1×)')
      if (bidStrategyType === 'MANUAL_CPC' && spend > 500)           issues.push('Lances manuais — considere estratégia automática')
      if (budgetLostIS !== null && budgetLostIS > 20)                issues.push(`Perdendo ${budgetLostIS}% IS por budget`)
      if (rankLostIS    !== null && rankLostIS   > 30)               issues.push(`Perdendo ${rankLostIS}% IS por ranking`)

      const recommendations: string[] = []
      if (ctr < 1.0 && campaignType === 'SEARCH')                    recommendations.push('Revise os textos dos anúncios e adicione extensões para melhorar o CTR')
      if (ctr < 0.1 && campaignType === 'DISPLAY')                   recommendations.push('Troque os banners — CTR baixo no Display indica criativos pouco relevantes')
      if (spend > 300 && conversions === 0)                           recommendations.push('Verifique a tag de conversão e o evento de acompanhamento na landing page')
      if (bidStrategyType === 'MANUAL_CPC' && spend > 500)           recommendations.push('Migre para "Maximizar Conversões" com CPA alvo para escalar')
      if (campaignType === 'PERFORMANCE_MAX' && conversions < 30)    recommendations.push('PMAX precisa de ≥30 conversões/mês — alimente mais sinais de audiência')
      if (roas > 0 && roas < 1.5)                                     recommendations.push('ROAS abaixo do break-even — revise bid, landing page e funil')
      if (cpa > 0 && cpa < 100 && conversions > 10)                  recommendations.push('CPA eficiente — aumente o orçamento 20-30% para escalar')
      if (budgetLostIS !== null && budgetLostIS > 20)                recommendations.push(`Aumente o budget: você perde ${budgetLostIS}% das impressões por limite de orçamento`)
      if (rankLostIS   !== null && rankLostIS   > 30)                recommendations.push(`Melhore o QS e os lances: ${rankLostIS}% das impressões perdidas por ranking`)

      return {
        id: c.id, name: c.name, status: c.status,
        campaignType, campaignTypeLabel, bidStrategyType, bidStrategyLabel,
        spend, impressions, clicks, ctr, cpc, cpm,
        conversions, conversionRate, cpa, roas, revenue,
        impressionShare, budgetLostIS, rankLostIS,
        issues, recommendations,
      }
    })

    // ── Search Terms ─────────────────────────────────────────────────────────
    const rawSearchTerms = searchTermResults.status === 'fulfilled' ? searchTermResults.value : []
    const searchTerms: SearchTerm[] = rawSearchTerms.map((r: any): SearchTerm => {
      const m = r.metrics
      const spend       = (m.costMicros || 0) / 1_000_000
      const impressions = parseInt(m.impressions || '0')
      const clicks      = parseInt(m.clicks || '0')
      const conversions = parseFloat(m.conversions || '0')
      const cpa         = conversions > 0 ? +(spend / conversions).toFixed(2) : 0
      const ctr         = impressions > 0 ? +((clicks / impressions) * 100).toFixed(2) : 0
      let tag: 'waste' | 'opportunity' | 'ok' = 'ok'
      if (spend > 50 && conversions === 0) tag = 'waste'
      else if (cpa > 0 && cpa < 80 && conversions >= 2) tag = 'opportunity'
      return {
        term: r.searchTermView?.searchTerm || '',
        campaignName: r.campaign?.name || '',
        campaignId:   r.campaign?.id   || '',
        status: r.searchTermView?.status || 'ADDED',
        spend, impressions, clicks, conversions, cpa, ctr, tag,
      }
    })

    // ── Keywords com Quality Score ──────────────────────────────────────────
    const rawKeywords = keywordResults.status === 'fulfilled' ? keywordResults.value : []
    const keywords: Keyword[] = rawKeywords.map((r: any): Keyword => {
      const qi = r.adGroupCriterion?.qualityInfo || {}
      return {
        text:            r.adGroupCriterion?.keyword?.text || '',
        campaignName:    r.campaign?.name || '',
        qualityScore:    qi.qualityScore ?? null,
        creativeQuality: qi.creativeQualityScore || null,
        landingQuality:  qi.postClickQualityScore || null,
        predictedCtr:    qi.searchPredictedCtr || null,
        spend:     (r.metrics?.costMicros || 0) / 1_000_000,
        impressions: parseInt(r.metrics?.impressions || '0'),
        conversions: parseFloat(r.metrics?.conversions || '0'),
      }
    })

    // ── Auction Insights ─────────────────────────────────────────────────────
    const rawAuction = auctionResults.status === 'fulfilled' ? auctionResults.value : []
    const seenDomains = new Set<string>()
    const auctionInsights: AuctionInsight[] = []
    for (const r of rawAuction) {
      const m = r.auctionInsightCompetitorMetric
      if (!m?.domain || seenDomains.has(m.domain)) continue
      seenDomains.add(m.domain)
      auctionInsights.push({
        domain:          m.domain,
        impressionShare: +((m.impressionShare    || 0) * 100).toFixed(1),
        overlapRate:     +((m.overlapRate        || 0) * 100).toFixed(1),
        outrankingShare: +((m.outrankingShare    || 0) * 100).toFixed(1),
        topOfPageRate:   +((m.topOfPageRate      || 0) * 100).toFixed(1),
        absoluteTopRate: +((m.absoluteTopOfPageRate || 0) * 100).toFixed(1),
      })
    }

    // ── Agrupamento por tipo ─────────────────────────────────────────────────
    const byType: Record<string, {
      label: string; count: number
      totalSpend: number; totalConversions: number; totalRevenue: number
      avgCPA: number; avgROAS: number
    }> = {}
    for (const c of campaigns) {
      if (!byType[c.campaignType]) byType[c.campaignType] = { label: c.campaignTypeLabel, count: 0, totalSpend: 0, totalConversions: 0, totalRevenue: 0, avgCPA: 0, avgROAS: 0 }
      const g = byType[c.campaignType]
      g.count++; g.totalSpend += c.spend; g.totalConversions += c.conversions; g.totalRevenue += c.revenue
    }
    for (const g of Object.values(byType)) {
      g.avgCPA  = g.totalConversions > 0 ? +(g.totalSpend / g.totalConversions).toFixed(2) : 0
      g.avgROAS = g.totalSpend > 0 && g.totalRevenue > 0 ? +(g.totalRevenue / g.totalSpend).toFixed(2) : 0
    }

    // ── Totais ───────────────────────────────────────────────────────────────
    const activeCampaigns  = campaigns.filter(c => c.status === 'ENABLED' && c.spend > 0)
    const totalSpend       = campaigns.reduce((s, c) => s + c.spend,       0)
    const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0)
    const totalRevenue     = campaigns.reduce((s, c) => s + c.revenue,     0)
    const totalClicks      = campaigns.reduce((s, c) => s + c.clicks,      0)
    const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0)
    const avgCTR  = totalImpressions > 0 ? +((totalClicks / totalImpressions) * 100).toFixed(2) : 0
    const avgCPA  = totalConversions > 0 ? +(totalSpend / totalConversions).toFixed(2) : 0
    const avgROAS = totalSpend > 0 && totalRevenue > 0 ? +(totalRevenue / totalSpend).toFixed(2) : 0
    const avgCVR  = totalClicks > 0 ? +((totalConversions / totalClicks) * 100).toFixed(2) : 0
    const searchCamps = campaigns.filter(c => c.impressionShare !== null)
    const avgIS   = searchCamps.length > 0
      ? +(searchCamps.reduce((s, c) => s + (c.impressionShare || 0), 0) / searchCamps.length).toFixed(1)
      : null

    // ── Score ────────────────────────────────────────────────────────────────
    let score = 60
    if (avgCTR >= 5.0)    score += 15; else if (avgCTR >= 2.5)  score += 8;  else if (avgCTR < 1.0) score -= 12
    if (avgCVR >= 5.0)    score += 15; else if (avgCVR >= 2.0)  score += 7;  else if (avgCVR < 1.0) score -= 10
    if (issueRatio(campaigns) < 0.2) score += 10; else if (issueRatio(campaigns) > 0.5) score -= 15
    if (avgROAS >= 3)      score += 10; else if (avgROAS > 0 && avgROAS < 1)  score -= 10
    if (avgIS !== null) { if (avgIS >= 70) score += 8; else if (avgIS < 30) score -= 8 }
    const smartBidCount = campaigns.filter(c =>
      ['TARGET_CPA','TARGET_ROAS','MAXIMIZE_CONVERSIONS','MAXIMIZE_CONVERSION_VALUE'].includes(c.bidStrategyType)
    ).length
    if (activeCampaigns.length > 0 && smartBidCount / activeCampaigns.length >= 0.7) score += 5
    score = Math.max(20, Math.min(99, Math.round(score)))
    const scoreGrade = score >= 90 ? 'A+' : score >= 85 ? 'A' : score >= 80 ? 'A-' : score >= 75 ? 'B+' : score >= 70 ? 'B' : score >= 65 ? 'B-' : score >= 55 ? 'C+' : score >= 45 ? 'C' : 'D'

    // ── Recomendações globais ─────────────────────────────────────────────────
    const globalRecs: RecItem[] = []

    const noConvC = campaigns.filter(c => c.spend > 300 && c.conversions === 0)
    if (noConvC.length > 0) globalRecs.push({ type: 'critical',
      title: `R$${noConvC.reduce((s,c)=>s+c.spend,0).toFixed(0)} em campanhas sem conversão`,
      description: `${noConvC.length} campanha(s) gastando sem registrar conversões. Verifique tag de conversão, pixel e landing page.` })

    const wasteTerms = searchTerms.filter(t => t.tag === 'waste')
    if (wasteTerms.length > 0) globalRecs.push({ type: 'critical',
      title: `R$${wasteTerms.reduce((s,t)=>s+t.spend,0).toFixed(0)} em ${wasteTerms.length} termos sem conversão — negativar`,
      description: `${wasteTerms.slice(0,4).map(t=>`"${t.term}"`).join(', ')}${wasteTerms.length>4?` +${wasteTerms.length-4} outros`:''} — adicione como negativos imediatamente.` })

    const manualBidC = campaigns.filter(c => c.bidStrategyType === 'MANUAL_CPC' && c.spend > 300)
    if (manualBidC.length > 0) globalRecs.push({ type: 'warning',
      title: `${manualBidC.length} campanha(s) com CPC Manual`,
      description: 'Migre para estratégias automáticas (Maximizar Conversões ou CPA Alvo) para aproveitar o machine learning do Google.' })

    const budgetLostCamps = campaigns.filter(c => (c.budgetLostIS || 0) > 20)
    if (budgetLostCamps.length > 0) globalRecs.push({ type: 'warning',
      title: `${budgetLostCamps.length} campanha(s) perdendo alcance por budget`,
      description: budgetLostCamps.map(c=>`"${c.name}" (−${c.budgetLostIS}% IS)`).join(', ') + '. Aumente o orçamento ou redistribua verba.' })

    const lowQsKws = keywords.filter(k => k.qualityScore !== null && (k.qualityScore as number) <= 4 && k.spend > 50)
    if (lowQsKws.length > 0) globalRecs.push({ type: 'warning',
      title: `${lowQsKws.length} palavra(s)-chave com Quality Score ≤4`,
      description: `QS baixo eleva CPC e reduz posição. Melhore relevância do anúncio e LP para: ${lowQsKws.slice(0,3).map(k=>`"${k.text}" (QS ${k.qualityScore})`).join(', ')}.` })

    if (auctionInsights.length > 0) globalRecs.push({ type: 'opportunity',
      title: `Concorrente "${auctionInsights[0].domain}" — IS ${auctionInsights[0].impressionShare}%`,
      description: `Você supera esse concorrente em ${auctionInsights[0].outrankingShare}% dos leilões. Sobreposição: ${auctionInsights[0].overlapRate}%. Analise os anúncios para diferenciar sua proposta.` })

    const oppTerms = searchTerms.filter(t => t.tag === 'opportunity')
    if (oppTerms.length > 0) globalRecs.push({ type: 'opportunity',
      title: `${oppTerms.length} termos de alta conversão para escalar`,
      description: `${oppTerms.slice(0,3).map(t=>`"${t.term}" (CPA R$${t.cpa})`).join(', ')} — crie campanhas dedicadas e aumente os lances.` })

    const highROASC = campaigns.filter(c => c.roas >= 3)
    if (highROASC.length > 0) globalRecs.push({ type: 'opportunity',
      title: `${highROASC.length} campanha(s) com ROAS ≥ 3× — candidatas a escalar`,
      description: 'Aumente o orçamento 20-30% por semana mantendo o ROAS alvo.' })

    return NextResponse.json({
      success: true, score, scoreGrade,
      campaigns, byType,
      searchTerms, keywords, auctionInsights,
      totals: {
        spend: totalSpend, conversions: totalConversions, revenue: totalRevenue,
        clicks: totalClicks, impressions: totalImpressions,
        avgCTR, avgCPA, avgROAS, avgCVR,
        avgImpressionShare: avgIS,
        activeCampaigns: activeCampaigns.length,
        totalCampaigns:  campaigns.length,
      },
      globalRecs,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

function issueRatio(campaigns: GoogleCampaign[]) {
  return campaigns.length > 0 ? campaigns.filter(c => c.issues.length > 0).length / campaigns.length : 0
}
