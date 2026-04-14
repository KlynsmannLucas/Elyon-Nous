// app/api/ads-data/google/route.ts — Busca campanhas reais do Google Ads
import { NextRequest, NextResponse } from 'next/server'

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

    // Google Ads Query Language (GAQL) — últimos 30 dias
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions,
        metrics.conversions_value,
        metrics.cost_per_conversion
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
        AND campaign.status != 'REMOVED'
      ORDER BY metrics.cost_micros DESC
      LIMIT 20
    `.trim()

    const res = await fetch(
      `https://googleads.googleapis.com/v16/customers/${accountId}/googleAds:search`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': developerToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
        signal: AbortSignal.timeout(15000),
      }
    )

    const data = await res.json()

    if (data.error || !res.ok) {
      const msg = data.error?.message || data.error?.details?.[0]?.errors?.[0]?.message || 'Erro na Google Ads API'
      return NextResponse.json({ success: false, error: msg }, { status: 400 })
    }

    const campaigns = (data.results || []).map((r: any) => {
      const campaign = r.campaign
      const metrics  = r.metrics
      const spend    = (metrics.costMicros || 0) / 1_000_000
      const leads    = Math.round(metrics.conversions || 0)
      const revenue  = metrics.conversionsValue || 0
      const cpl      = leads > 0 ? +(spend / leads).toFixed(2) : 0
      const roas     = spend > 0 && revenue > 0 ? +(revenue / spend).toFixed(2) : 0

      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        spend,
        impressions: metrics.impressions || 0,
        clicks: metrics.clicks || 0,
        ctr: metrics.impressions > 0
          ? +((metrics.clicks / metrics.impressions) * 100).toFixed(2)
          : 0,
        leads,
        cpl,
        revenue,
        roas,
        platform: 'google',
      }
    })

    const totals = campaigns.reduce((acc: any, c: any) => ({
      spend:       acc.spend + c.spend,
      impressions: acc.impressions + c.impressions,
      clicks:      acc.clicks + c.clicks,
      leads:       acc.leads + c.leads,
      revenue:     acc.revenue + c.revenue,
    }), { spend: 0, impressions: 0, clicks: 0, leads: 0, revenue: 0 })

    totals.cpl  = totals.leads > 0  ? +(totals.spend / totals.leads).toFixed(2) : 0
    totals.roas = totals.spend > 0 && totals.revenue > 0 ? +(totals.revenue / totals.spend).toFixed(2) : 0
    totals.ctr  = totals.impressions > 0 ? +((totals.clicks / totals.impressions) * 100).toFixed(2) : 0

    return NextResponse.json({ success: true, campaigns, totals, platform: 'google' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
