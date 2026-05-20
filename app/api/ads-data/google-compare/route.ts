// app/api/ads-data/google-compare/route.ts
// Comparativo de períodos para Google Ads — retorna variação percentual das métricas.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getValidGoogleToken, tokenErrorToResponse } from '@/services/google/token-manager'
import { gaqlSearch, normalizeCustomerId } from '@/lib/google-ads'

type Period =
  | 'THIS_WEEK_SUN_TODAY'
  | 'LAST_WEEK_SUN_SAT'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'LAST_7_DAYS'
  | 'LAST_14_DAYS'
  | 'LAST_30_DAYS'

const PERIOD_PAIRS: Record<string, { current: Period; previous: Period; label: string }> = {
  week:    { current: 'THIS_WEEK_SUN_TODAY', previous: 'LAST_WEEK_SUN_SAT', label: 'Semana atual vs. semana anterior' },
  month:   { current: 'THIS_MONTH',          previous: 'LAST_MONTH',         label: 'Mês atual vs. mês anterior' },
  '7d':    { current: 'LAST_7_DAYS',         previous: 'LAST_14_DAYS',       label: 'Últimos 7 dias vs. 7 dias anteriores' },
  '30d':   { current: 'LAST_30_DAYS',        previous: 'LAST_30_DAYS',       label: 'Últimos 30 dias (referência interna)' },
}

function sumMetrics(results: any[]) {
  return results.reduce((acc, r) => {
    const m = r.metrics
    acc.spend       += (m.costMicros   || 0) / 1_000_000
    acc.impressions += parseInt(m.impressions  || '0')
    acc.clicks      += parseInt(m.clicks       || '0')
    acc.conversions += parseFloat(m.conversions || '0')
    acc.revenue     += m.conversionsValue || 0
    return acc
  }, { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 })
}

function derive(sums: ReturnType<typeof sumMetrics>) {
  const { spend, impressions, clicks, conversions, revenue } = sums
  return {
    spend:       +spend.toFixed(2),
    impressions,
    clicks,
    conversions: +conversions.toFixed(1),
    revenue:     +revenue.toFixed(2),
    ctr:         impressions > 0 ? +((clicks / impressions) * 100).toFixed(2) : 0,
    cpc:         clicks > 0      ? +(spend / clicks).toFixed(2) : 0,
    cpl:         conversions > 0 ? +(spend / conversions).toFixed(2) : 0,
    roas:        spend > 0 && revenue > 0 ? +(revenue / spend).toFixed(2) : 0,
    cvr:         clicks > 0 ? +((conversions / clicks) * 100).toFixed(2) : 0,
  }
}

function delta(curr: number, prev: number): number | null {
  if (prev === 0) return null
  return +((curr - prev) / prev * 100).toFixed(1)
}

function buildComparison(curr: ReturnType<typeof derive>, prev: ReturnType<typeof derive>) {
  const keys = ['spend', 'impressions', 'clicks', 'conversions', 'revenue', 'ctr', 'cpc', 'cpl', 'roas', 'cvr'] as const
  const result: Record<string, { current: number; previous: number; delta: number | null; direction: 'up' | 'down' | 'neutral' }> = {}
  for (const key of keys) {
    const d = delta(curr[key], prev[key])
    // Para custo (cpc, cpl, spend), subir é ruim; para o resto, subir é bom
    const costMetric  = ['cpc', 'cpl', 'spend'].includes(key)
    const direction   = d === null || d === 0 ? 'neutral'
      : costMetric ? (d > 0 ? 'down' : 'up')
      : (d > 0 ? 'up' : 'down')
    result[key] = { current: curr[key], previous: prev[key], delta: d, direction }
  }
  return result
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })

  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  if (!devToken) return NextResponse.json({ success: false, error: 'Developer token não configurado' }, { status: 500 })

  const body = await req.json().catch(() => ({}))
  const periodKey     = (body.period as string) || '30d'
  const bodyAccountId = body.accountId as string | undefined
  const campaignId    = body.campaignId as string | undefined // filtro opcional

  const pair = PERIOD_PAIRS[periodKey]
  if (!pair) {
    return NextResponse.json({
      success: false,
      error: `Período inválido. Use: ${Object.keys(PERIOD_PAIRS).join(', ')}`,
    }, { status: 400 })
  }

  let accessToken: string
  let accountId:   string | null
  try {
    const token = await getValidGoogleToken(userId)
    accessToken = token.accessToken
    accountId   = bodyAccountId || token.accountId
  } catch (err) {
    const { error, code } = tokenErrorToResponse(err)
    return NextResponse.json({ success: false, error, code }, { status: 401 })
  }

  if (!accountId) {
    return NextResponse.json({ success: false, error: 'Customer ID não encontrado', code: 'NO_ACCOUNT_ID' }, { status: 400 })
  }

  const cleanId    = normalizeCustomerId(accountId)
  const campaignFilter = campaignId ? `AND campaign.id = ${campaignId}` : ''

  const baseQuery = (during: string) => `
    SELECT
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.conversions_value,
      campaign.name,
      campaign.id
    FROM campaign
    WHERE segments.date DURING ${during}
      AND campaign.status != 'REMOVED'
      ${campaignFilter}
    ORDER BY metrics.cost_micros DESC
    LIMIT 100
  `

  try {
    const [currResults, prevResults] = await Promise.all([
      gaqlSearch(cleanId, accessToken, devToken, baseQuery(pair.current)),
      gaqlSearch(cleanId, accessToken, devToken, baseQuery(pair.previous)),
    ])

    const currDerived = derive(sumMetrics(currResults))
    const prevDerived = derive(sumMetrics(prevResults))
    const comparison  = buildComparison(currDerived, prevDerived)

    // Breakdown por campanha (período atual)
    const byCampaign = currResults.map((r: any) => {
      const m = r.metrics
      const spend       = (m.costMicros || 0) / 1_000_000
      const impressions = parseInt(m.impressions || '0')
      const clicks      = parseInt(m.clicks || '0')
      const conversions = parseFloat(m.conversions || '0')
      const revenue     = m.conversionsValue || 0
      return {
        id:          r.campaign?.id,
        name:        r.campaign?.name,
        spend:       +spend.toFixed(2),
        impressions, clicks,
        conversions: +conversions.toFixed(1),
        revenue:     +revenue.toFixed(2),
        ctr:         impressions > 0 ? +((clicks / impressions) * 100).toFixed(2) : 0,
        cpl:         conversions > 0 ? +(spend / conversions).toFixed(2) : 0,
        roas:        spend > 0 && revenue > 0 ? +(revenue / spend).toFixed(2) : 0,
      }
    })

    return NextResponse.json({
      success: true,
      period:  { key: periodKey, label: pair.label },
      current:  currDerived,
      previous: prevDerived,
      comparison,
      byCampaign,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
