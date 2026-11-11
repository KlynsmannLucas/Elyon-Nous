// app/api/ads-data/meta/route.ts — Busca campanhas reais do Meta Ads
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getValidMetaToken, metaTokenErrorToResponse } from '@/services/meta/token-manager'
import { errMsg } from '@/lib/errMsg'
import { summarizeMetaResults } from '@/lib/metaResults'
import { resolveReportingPeriod, previousReportingPeriod } from '@/lib/reporting-period'

async function fetchAllInsights(accountId: string, accessToken: string, timeParam: string): Promise<any[]> {
  const insightFields = [
    'campaign_id', 'campaign_name', 'objective', 'spend', 'impressions', 'clicks',
    'inline_link_clicks', 'actions', 'action_values', 'reach', 'frequency',
  ].join(',')

  let url: string | null =
    `https://graph.facebook.com/v21.0/act_${accountId}/insights?` +
    `fields=${insightFields}` +
    `&${timeParam}` +
    `&level=campaign` +
    `&action_breakdowns=action_type,action_destination` +
    `&limit=50` +
    `&access_token=${accessToken}`

  const allRows: any[] = []

  while (url) {
    const res: Response = await fetch(url, { signal: AbortSignal.timeout(20000) })
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('application/json')) throw new Error(`Meta API retornou resposta inválida (HTTP ${res.status})`)
    const data: any = await res.json()
    if (data.error) throw new Error(data.error.message)
    allRows.push(...(data.data || []))
    url = data.paging?.next || null
  }

  return allRows
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })

  try {
    const body = await req.json().catch(() => ({}))
    const bodyAccountId = (body.accountId as string | undefined)

    let accessToken: string
    let accountId: string | null
    try {
      const tokenData = await getValidMetaToken(userId)
      accessToken = tokenData.accessToken
      accountId   = bodyAccountId || tokenData.accountId
    } catch (err) {
      const { error, code } = metaTokenErrorToResponse(err)
      return NextResponse.json({ success: false, error, code }, { status: 401 })
    }

    if (!accountId) {
      return NextResponse.json({ success: false, error: 'Ad Account ID não encontrado. Selecione uma conta.', code: 'NO_ACCOUNT_ID' }, { status: 400 })
    }

    accountId = String(accountId).replace(/^act_/i, '')
    if (!/^\d+$/.test(accountId)) return NextResponse.json({ success: false, error: 'ID da conta Meta inválido.' }, { status: 400 })

    let period: ReturnType<typeof resolveReportingPeriod>
    try { period = resolveReportingPeriod(body) }
    catch (error) { return NextResponse.json({ success: false, error: errMsg(error, 'Período inválido.') }, { status: 400 }) }
    const previous = previousReportingPeriod(period)
    const timeParam = (p: typeof period) => `time_range=${encodeURIComponent(JSON.stringify({ since: p.startDate, until: p.endDate }))}`
    const currentTimeParam = timeParam(period)
    const prevTimeParam = timeParam(previous)

    const [rows, prevRows] = await Promise.all([
      fetchAllInsights(accountId, accessToken, currentTimeParam),
      fetchAllInsights(accountId, accessToken, prevTimeParam),
    ])

    // Busca status das campanhas separadamente
    const campaignIds = rows.map((c: any) => c.campaign_id).filter(Boolean)
    const statusMap: Record<string, string> = {}
    if (campaignIds.length > 0) {
      // Faz em lotes de 50 para evitar URL muito longa
      const chunks = Array.from({ length: Math.ceil(campaignIds.length / 50) }, (_, i) =>
        campaignIds.slice(i * 50, (i + 1) * 50)
      )
      for (const chunk of chunks) {
        const statusRes = await fetch(
          `https://graph.facebook.com/v21.0/?ids=${chunk.join(',')}&fields=id,status&access_token=${accessToken}`,
          { signal: AbortSignal.timeout(10000) }
        )
        const statusData = await statusRes.json()
        if (!statusData.error) {
          for (const [id, val] of Object.entries(statusData as Record<string, any>)) {
            statusMap[id] = (val as any).status || 'ACTIVE'
          }
        }
      }
    }

    const campaigns = rows.map((c: any) => {
      const spend       = parseFloat(c.spend || '0')
      const clicks      = parseInt(c.clicks || '0')
      const impressions = parseInt(c.impressions || '0')
      const frequency   = +parseFloat(c.frequency || '0').toFixed(2)

      const objective = (c.objective || '').toUpperCase()
      const result = summarizeMetaResults({
        objective,
        actions: c.actions,
        actionValues: c.action_values,
        spend,
        clicks,
        inlineLinkClicks: parseInt(c.inline_link_clicks || '0'),
        impressions,
        reach: parseInt(c.reach || '0'),
      })
      const leads = result.leads + result.totalMessages + result.phoneCalls
      const cpl = leads > 0 ? +(spend / leads).toFixed(2) : 0
      const revenue = result.revenue
      const roas = spend > 0 && revenue > 0 ? +(revenue / spend).toFixed(2) : 0

      return {
        id: c.campaign_id || Math.random().toString(),
        name: c.campaign_name,
        objective: result.objectiveLabel || c.objective || null,
        objectiveKey: objective || null,
        status: statusMap[c.campaign_id] || 'ACTIVE',
        spend, impressions, clicks, frequency,
        ctr: impressions > 0 ? +((clicks / impressions) * 100).toFixed(2) : 0,
        results: result.primaryResultValue,
        resultLabel: result.primaryResultLabel,
        resultType: result.primaryResultKey,
        costPerResult: result.costPerResult,
        resultBreakdown: result.resultBreakdown,
        leads,
        formLeads: result.formLeads,
        websiteLeads: result.websiteLeads,
        whatsappConversations: result.whatsappConversations,
        messengerConversations: result.messengerConversations,
        instagramDirectConversations: result.instagramDirectConversations,
        messageConversations: result.messageConversations,
        totalMessageConversations: result.totalMessages,
        phoneCalls: result.phoneCalls,
        purchases: result.purchases,
        landingPageViews: result.landingPageViews,
        linkClicks: result.linkClicks,
        postEngagements: result.postEngagements,
        videoViews: result.videoViews,
        cpl, revenue, roas,
        platform: 'meta' as const,
      }
    })

    const totals = campaigns.reduce((acc, c) => ({
      spend:       acc.spend + c.spend,
      impressions: acc.impressions + c.impressions,
      clicks:      acc.clicks + c.clicks,
      leads:       acc.leads + c.leads,
      results:     acc.results + c.results,
      revenue:     acc.revenue + c.revenue,
    }), { spend: 0, impressions: 0, clicks: 0, leads: 0, results: 0, revenue: 0 })

    const extTotals = {
      ...totals,
      totalResults: totals.results,
      resultLabel: 'Resultados',
      costPerResult: totals.results > 0 ? +(totals.spend / totals.results).toFixed(2) : 0,
      avgCostPerResult: totals.results > 0 ? +(totals.spend / totals.results).toFixed(2) : 0,
      cpl:  totals.leads > 0 ? +(totals.spend / totals.leads).toFixed(2) : 0,
      roas: totals.spend > 0 && totals.revenue > 0 ? +(totals.revenue / totals.spend).toFixed(2) : 0,
      ctr:  totals.impressions > 0 ? +((totals.clicks / totals.impressions) * 100).toFixed(2) : 0,
    }

    // Previous period totals for MoM comparison
    const prevTotals = prevRows.reduce((acc, c) => {
      const spend  = parseFloat(c.spend || '0')
      const result = summarizeMetaResults({
        objective: c.objective,
        actions: c.actions,
        actionValues: c.action_values,
        spend,
        clicks: parseInt(c.clicks || '0'),
        impressions: parseInt(c.impressions || '0'),
      })
      const leads  = result.leads + result.totalMessages + result.phoneCalls
      const results = result.primaryResultValue
      const clicks = parseInt(c.clicks || '0')
      return { spend: acc.spend + spend, leads: acc.leads + leads, results: acc.results + results, clicks: acc.clicks + clicks }
    }, { spend: 0, leads: 0, results: 0, clicks: 0 })

    const delta = (curr: number, prev: number) =>
      prev > 0 ? +((curr - prev) / prev * 100).toFixed(1) : null

    const previousTotals = {
      ...prevTotals,
      totalResults: prevTotals.results,
      costPerResult: prevTotals.results > 0 ? +(prevTotals.spend / prevTotals.results).toFixed(2) : 0,
      cpl: prevTotals.leads > 0 ? +(prevTotals.spend / prevTotals.leads).toFixed(2) : 0,
      spendDelta:  delta(totals.spend,  prevTotals.spend),
      leadsDelta:  delta(totals.leads,  prevTotals.leads),
      resultsDelta: delta(totals.results, prevTotals.results),
      clicksDelta: delta(totals.clicks, prevTotals.clicks),
      cplDelta:    delta(
        totals.leads > 0 ? totals.spend / totals.leads : 0,
        prevTotals.leads > 0 ? prevTotals.spend / prevTotals.leads : 0
      ),
    }

    return NextResponse.json({ success: true, campaigns, totals: extTotals, previousTotals, platform: 'meta', accountId: String(accountId).replace(/^act_/, ''), period, previousPeriod: previous })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: errMsg(error, 'Falha ao buscar dados do Meta Ads.') }, { status: 500 })
  }
}
