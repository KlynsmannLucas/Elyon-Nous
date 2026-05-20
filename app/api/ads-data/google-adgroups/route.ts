// app/api/ads-data/google-adgroups/route.ts — Ad Groups com métricas detalhadas
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getValidGoogleToken, tokenErrorToResponse } from '@/services/google/token-manager'
import { gaqlSearch, normalizeCustomerId } from '@/lib/google-ads'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })

  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  if (!devToken) return NextResponse.json({ success: false, error: 'Developer token não configurado' }, { status: 500 })

  const body = await req.json().catch(() => ({}))
  const bodyAccountId = body.accountId as string | undefined

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

  const cleanId = normalizeCustomerId(accountId)

  try {
    const results = await gaqlSearch(cleanId, accessToken, devToken, `
      SELECT
        ad_group.id,
        ad_group.name,
        ad_group.status,
        ad_group.type,
        campaign.id,
        campaign.name,
        campaign.status,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc,
        metrics.cost_per_conversion
      FROM ad_group
      WHERE segments.date DURING LAST_30_DAYS
        AND ad_group.status != 'REMOVED'
        AND campaign.status != 'REMOVED'
      ORDER BY metrics.cost_micros DESC
      LIMIT 100
    `)

    const adGroups = results.map((r: any) => {
      const ag = r.adGroup
      const m  = r.metrics
      const spend       = (m.costMicros || 0) / 1_000_000
      const impressions = parseInt(m.impressions || '0')
      const clicks      = parseInt(m.clicks || '0')
      const conversions = parseFloat(m.conversions || '0')
      const revenue     = m.conversionsValue || 0
      const cpl         = conversions > 0 ? +(spend / conversions).toFixed(2) : 0
      const cpc         = +(( (m.averageCpc || 0) / 1_000_000 ).toFixed(2))
      const ctr         = impressions > 0 ? +((clicks / impressions) * 100).toFixed(2) : 0
      const cvr         = clicks > 0 ? +((conversions / clicks) * 100).toFixed(2) : 0
      const roas        = spend > 0 && revenue > 0 ? +(revenue / spend).toFixed(2) : 0

      return {
        id:           ag.id,
        name:         ag.name,
        status:       ag.status,
        type:         ag.type,
        campaignId:   r.campaign?.id,
        campaignName: r.campaign?.name,
        campaignStatus: r.campaign?.status,
        spend, impressions, clicks, conversions, revenue,
        cpl, cpc, ctr, cvr, roas,
      }
    })

    type Totals = { spend: number; impressions: number; clicks: number; conversions: number; ctr?: number; cpl?: number }
    const totals = adGroups.reduce<Totals>((acc, ag: any) => ({
      spend:       acc.spend       + ag.spend,
      impressions: acc.impressions + ag.impressions,
      clicks:      acc.clicks      + ag.clicks,
      conversions: acc.conversions + ag.conversions,
    }), { spend: 0, impressions: 0, clicks: 0, conversions: 0 })

    totals.ctr = totals.impressions > 0 ? +((totals.clicks / totals.impressions) * 100).toFixed(2) : 0
    totals.cpl = totals.conversions > 0 ? +(totals.spend / totals.conversions).toFixed(2) : 0

    return NextResponse.json({ success: true, adGroups, totals })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
