// app/api/ads-data/meta/route.ts — Busca campanhas reais do Meta Ads
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { accessToken, accountId } = await req.json()
    if (!accessToken || !accountId) {
      return NextResponse.json({ success: false, error: 'Token ou Account ID não fornecido.' }, { status: 400 })
    }

    const insightFields = [
      'campaign_id', 'campaign_name', 'spend', 'impressions', 'clicks',
      'actions', 'reach', 'frequency',
    ].join(',')

    // Busca insights dos últimos 30 dias
    const url = `https://graph.facebook.com/v19.0/act_${accountId}/insights?` +
      `fields=${insightFields}` +
      `&date_preset=last_30d` +
      `&level=campaign` +
      `&limit=20` +
      `&access_token=${accessToken}`

    const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
    const data = await res.json()

    if (data.error) {
      return NextResponse.json({ success: false, error: data.error.message }, { status: 400 })
    }

    // Busca status das campanhas separadamente
    const campaignIds = (data.data || []).map((c: any) => c.campaign_id).filter(Boolean)
    const statusMap: Record<string, string> = {}
    if (campaignIds.length > 0) {
      const statusRes = await fetch(
        `https://graph.facebook.com/v19.0/?ids=${campaignIds.join(',')}&fields=id,status&access_token=${accessToken}`,
        { signal: AbortSignal.timeout(10000) }
      )
      const statusData = await statusRes.json()
      if (!statusData.error) {
        for (const [id, val] of Object.entries(statusData as Record<string, any>)) {
          statusMap[id] = val.status || 'ACTIVE'
        }
      }
    }

    // Normaliza os dados para o formato da plataforma
    const campaigns = (data.data || []).map((c: any) => {
      const spend = parseFloat(c.spend || '0')
      const clicks = parseInt(c.clicks || '0')
      const impressions = parseInt(c.impressions || '0')

      // Extrai leads da ação de geração de leads
      const leadAction = c.actions?.find((a: any) =>
        a.action_type === 'lead' || a.action_type === 'onsite_conversion.lead_grouped'
      )
      const leads = leadAction ? parseInt(leadAction.value) : 0
      const cpl = leads > 0 ? +(spend / leads).toFixed(2) : 0

      // Extrai valor de conversão para ROAS
      const purchaseAction = c.actions?.find((a: any) =>
        a.action_type === 'purchase' || a.action_type === 'omni_purchase'
      )
      const revenue = purchaseAction ? parseFloat(purchaseAction.value || '0') : 0
      const roas = spend > 0 && revenue > 0 ? +(revenue / spend).toFixed(2) : 0

      return {
        id: c.campaign_id || c.ad_id || Math.random().toString(),
        name: c.campaign_name,
        status: statusMap[c.campaign_id] || 'ACTIVE',
        spend,
        impressions,
        clicks,
        ctr: impressions > 0 ? +((clicks / impressions) * 100).toFixed(2) : 0,
        leads,
        cpl,
        revenue,
        roas,
        platform: 'meta',
      }
    })

    // Totais agregados
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

    return NextResponse.json({ success: true, campaigns, totals, platform: 'meta' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
