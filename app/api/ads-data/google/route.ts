// app/api/ads-data/google/route.ts — Busca campanhas reais do Google Ads
// Token lido do Supabase via token-manager (com refresh automático).
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  getValidGoogleToken,
  tokenErrorToResponse,
} from '@/services/google/token-manager'
import { gaqlSearch, normalizeCustomerId } from '@/lib/google-ads'
import { errMsg } from '@/lib/errMsg'
import {
  googleObservedMetrics,
  purchaseValueFromGoogle,
} from '@/lib/performance/observations'
import { previousReportingPeriod } from '@/lib/reporting-period'
import { metricNumber, platformTotals } from '@/lib/marketing-totals'
import { resolveReportingPeriod } from '@/lib/reporting-period'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId)
    return NextResponse.json(
      { success: false, error: 'Não autorizado' },
      { status: 401 },
    )

  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  if (!developerToken) {
    return NextResponse.json(
      { success: false, error: 'GOOGLE_ADS_DEVELOPER_TOKEN não configurado.' },
      { status: 500 },
    )
  }

  // accountId pode vir no body (seleção manual de conta) ou ser inferido do DB
  const body = await req.json().catch(() => ({}))
  const bodyAccountId = body.accountId as string | undefined

  let period: ReturnType<typeof resolveReportingPeriod>
  try {
    period = resolveReportingPeriod(body)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: errMsg(error, 'Período inválido.') },
      { status: 400 },
    )
  }

  let accessToken: string
  let accountId: string | null

  try {
    const token = await getValidGoogleToken(userId)
    accessToken = token.accessToken
    accountId = bodyAccountId || token.accountId
  } catch (err) {
    const { error, code } = tokenErrorToResponse(err)
    return NextResponse.json({ success: false, error, code }, { status: 401 })
  }

  if (!accountId) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Customer ID do Google Ads não encontrado. Informe o ID da conta nas configurações.',
        code: 'NO_ACCOUNT_ID',
      },
      { status: 400 },
    )
  }

  const cleanId = normalizeCustomerId(accountId)

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      campaign_budget.amount_micros,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.all_conversions,
      metrics.conversions_value,
      metrics.cost_per_conversion
    FROM campaign
    WHERE segments.date BETWEEN '${period.startDate}' AND '${period.endDate}'
    ORDER BY metrics.cost_micros DESC
  `.trim()

  try {
    const previous = previousReportingPeriod(period)
    const [mainRead, previousRead, conversionRead] = await Promise.allSettled([
      gaqlSearch(cleanId, accessToken, developerToken, query),
      gaqlSearch(
        cleanId,
        accessToken,
        developerToken,
        query
          .replace(period.startDate, previous.startDate)
          .replace(period.endDate, previous.endDate),
      ),
      gaqlSearch(
        cleanId,
        accessToken,
        developerToken,
        `SELECT segments.conversion_action_category, segments.conversion_action_name, metrics.conversions, metrics.all_conversions, metrics.conversions_value FROM customer WHERE segments.date BETWEEN '${period.startDate}' AND '${period.endDate}'`,
      ),
    ])
    if (mainRead.status !== 'fulfilled') throw mainRead.reason
    const results = mainRead.value
    const conversionRows =
      conversionRead.status === 'fulfilled' ? conversionRead.value : null

    const campaigns = results.map((r: any) => {
      const campaign = r.campaign
      const metrics = r.metrics || {}
      const spend = metricNumber(metrics.costMicros) / 1_000_000
      const leads = metricNumber(metrics.conversions)
      const revenue = metricNumber(metrics.conversionsValue)
      const impressions = metricNumber(metrics.impressions)
      const clicks = metricNumber(metrics.clicks)
      const cpl = leads > 0 ? +(spend / leads).toFixed(2) : 0
      const roas = spend > 0 && revenue > 0 ? +(revenue / spend).toFixed(2) : 0

      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        channelType: campaign.advertisingChannelType || null,
        dailyBudget:
          r.campaignBudget?.amountMicros != null
            ? metricNumber(r.campaignBudget.amountMicros) / 1000000
            : null,
        spend,
        impressions,
        clicks,
        ctr: impressions > 0 ? +((clicks / impressions) * 100).toFixed(2) : 0,
        leads,
        results: leads,
        resultType: 'google_conversions',
        resultLabel: 'Conversões principais',
        allConversions: metricNumber(metrics.allConversions),
        cpl,
        revenue,
        roas,
        platform: 'google',
      }
    })

    const totals = { ...platformTotals(campaigns), cpl: 0, roas: 0, ctr: 0 }

    totals.cpl =
      totals.leads > 0 ? +(totals.spend / totals.leads).toFixed(2) : 0
    totals.roas =
      totals.spend > 0 && totals.revenue > 0
        ? +(totals.revenue / totals.spend).toFixed(2)
        : 0
    totals.ctr =
      totals.impressions > 0
        ? +((totals.clicks / totals.impressions) * 100).toFixed(2)
        : 0

    const previousRows =
      previousRead.status === 'fulfilled' ? previousRead.value : null
    const previousTotals =
      previousRows === null
        ? null
        : {
            spend: previousRows.reduce(
              (n: number, r: any) =>
                n + metricNumber(r.metrics?.costMicros) / 1000000,
              0,
            ),
            clicks: previousRows.reduce(
              (n: number, r: any) => n + metricNumber(r.metrics?.clicks),
              0,
            ),
            impressions: previousRows.reduce(
              (n: number, r: any) => n + metricNumber(r.metrics?.impressions),
              0,
            ),
          }
    return NextResponse.json({
      success: true,
      campaigns,
      totals,
      previousTotals,
      previousPeriod: previous,
      observedMetrics: googleObservedMetrics(campaigns, conversionRows),
      conversionBreakdownAvailable: conversionRows !== null,
      purchaseValue: purchaseValueFromGoogle(conversionRows),
      platform: 'google',
      accountId: cleanId,
      period,
      fetchedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: errMsg(error, 'Falha ao buscar dados do Google Ads.'),
      },
      { status: 500 },
    )
  }
}
