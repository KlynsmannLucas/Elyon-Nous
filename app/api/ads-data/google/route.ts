// app/api/ads-data/google/route.ts — Busca campanhas reais do Google Ads
// Token lido do Supabase via token-manager (com refresh automático).
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getValidGoogleToken, tokenErrorToResponse } from '@/services/google/token-manager'

const API_VERSIONS = ['v19', 'v18']

async function gaqlSearch(
  cleanId: string, accessToken: string, developerToken: string, query: string
): Promise<any[]> {
  let lastError = ''
  for (const version of API_VERSIONS) {
    const res = await fetch(
      `https://googleads.googleapis.com/${version}/customers/${cleanId}/googleAds:search`,
      {
        method: 'POST',
        headers: {
          'Authorization':     `Bearer ${accessToken}`,
          'developer-token':   developerToken,
          'login-customer-id': cleanId,
          'Content-Type':      'application/json',
        },
        body: JSON.stringify({ query }),
        signal: AbortSignal.timeout(15_000),
      }
    )
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('application/json')) {
      lastError = `HTTP ${res.status} — Customer ID inválido ou sem acesso`
      continue
    }
    const data = await res.json()
    if (data.error || !res.ok) {
      lastError = data.error?.message || `HTTP ${res.status}`
      continue
    }
    return data.results || []
  }
  throw new Error(lastError || 'Google Ads API indisponível')
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })

  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  if (!developerToken) {
    return NextResponse.json({ success: false, error: 'GOOGLE_ADS_DEVELOPER_TOKEN não configurado.' }, { status: 500 })
  }

  // accountId pode vir no body (seleção manual de conta) ou ser inferido do DB
  const body = await req.json().catch(() => ({}))
  const bodyAccountId = body.accountId as string | undefined

  // Converte datePreset para literal GAQL. Padrão: LAST_30_DAYS.
  const presetMap: Record<string, string> = {
    last_7d:    'LAST_7_DAYS',
    last_30d:   'LAST_30_DAYS',
    last_90d:   'LAST_90_DAYS',
    this_month: 'THIS_MONTH',
    last_month: 'LAST_MONTH',
  }
  const rawPreset  = (body.datePreset as string | undefined) || 'last_30d'
  const gaqlPeriod = presetMap[rawPreset] || 'LAST_30_DAYS'

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
    return NextResponse.json({
      success: false,
      error: 'Customer ID do Google Ads não encontrado. Informe o ID da conta nas configurações.',
      code: 'NO_ACCOUNT_ID',
    }, { status: 400 })
  }

  const cleanId = String(accountId).replace(/-/g, '')

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
    WHERE segments.date DURING ${gaqlPeriod}
      AND campaign.status != 'REMOVED'
    ORDER BY metrics.cost_micros DESC
    LIMIT 25
  `.trim()

  try {
    const results = await gaqlSearch(cleanId, accessToken, developerToken, query)

    const campaigns = results.map((r: any) => {
      const campaign = r.campaign
      const metrics  = r.metrics
      const spend    = (metrics.costMicros || 0) / 1_000_000
      const leads    = Math.round(metrics.conversions || 0)
      const revenue  = metrics.conversionsValue || 0
      const cpl      = leads  > 0 ? +(spend / leads).toFixed(2)   : 0
      const roas     = spend  > 0 && revenue > 0 ? +(revenue / spend).toFixed(2) : 0

      return {
        id: campaign.id, name: campaign.name, status: campaign.status,
        spend, impressions: metrics.impressions || 0, clicks: metrics.clicks || 0,
        ctr: metrics.impressions > 0
          ? +((metrics.clicks / metrics.impressions) * 100).toFixed(2) : 0,
        leads, cpl, revenue, roas, platform: 'google',
      }
    })

    type TotalsAcc = { spend: number; impressions: number; clicks: number; leads: number; revenue: number; cpl?: number; roas?: number; ctr?: number }
    const totals = campaigns.reduce<TotalsAcc>((acc, c: any) => ({
      spend:       acc.spend       + c.spend,
      impressions: acc.impressions + c.impressions,
      clicks:      acc.clicks      + c.clicks,
      leads:       acc.leads       + c.leads,
      revenue:     acc.revenue     + c.revenue,
    }), { spend: 0, impressions: 0, clicks: 0, leads: 0, revenue: 0 })

    totals.cpl  = totals.leads  > 0 ? +(totals.spend / totals.leads).toFixed(2) : 0
    totals.roas = totals.spend  > 0 && totals.revenue > 0 ? +(totals.revenue / totals.spend).toFixed(2) : 0
    totals.ctr  = totals.impressions > 0 ? +((totals.clicks / totals.impressions) * 100).toFixed(2) : 0

    return NextResponse.json({ success: true, campaigns, totals, platform: 'google' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
