// app/api/ga4/campaign-quality/route.ts
// Qualidade do tráfego pago: cruzamento entre campanhas Google Ads e comportamento no GA4.
// Responde: "O clique virou sessão qualificada?"
// Scope necessário: https://www.googleapis.com/auth/analytics.readonly
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getValidGoogleToken, tokenErrorToResponse } from '@/services/google/token-manager'

const GA4_API = 'https://analyticsdata.googleapis.com/v1beta'

async function runGA4Report(propertyId: string, accessToken: string, body: object) {
  const res = await fetch(`${GA4_API}/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  })
  const data = await res.json()
  if (!res.ok || data.error) {
    const msg = data.error?.message || `HTTP ${res.status}`
    if (data.error?.status === 'PERMISSION_DENIED') throw new Error('Permissão insuficiente para GA4. Reconecte com escopo analytics.readonly.')
    throw new Error(`GA4: ${msg}`)
  }
  return data
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const propertyId = body.propertyId as string
  const startDate  = (body.startDate as string) || '30daysAgo'
  const endDate    = (body.endDate   as string) || 'today'

  if (!propertyId) {
    return NextResponse.json({ success: false, error: 'propertyId GA4 obrigatório', code: 'MISSING_PROPERTY_ID' }, { status: 400 })
  }

  let accessToken: string
  try {
    const token = await getValidGoogleToken(userId)
    accessToken = token.accessToken
  } catch (err) {
    const { error, code } = tokenErrorToResponse(err)
    return NextResponse.json({ success: false, error, code }, { status: 401 })
  }

  try {
    // Métricas de qualidade por campanha paga
    const data = await runGA4Report(propertyId, accessToken, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'sessionCampaignName' },
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
        { name: 'landingPage' },
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'engagedSessions' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
        { name: 'screenPageViewsPerSession' },
        { name: 'conversions' },
        { name: 'totalRevenue' },
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'sessionMedium',
          stringFilter: { matchType: 'CONTAINS', value: 'cpc', caseSensitive: false },
        },
      },
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 50,
    })

    const campaigns = (data.rows || []).map((row: any) => {
      const dims = row.dimensionValues || []
      const mets = row.metricValues   || []
      const sessions         = +mets[0]?.value || 0
      const engagedSessions  = +mets[1]?.value || 0
      const bounceRate       = +(+mets[2]?.value * 100).toFixed(1) || 0
      const avgDuration      = +mets[3]?.value || 0
      const pagesPerSession  = +(+mets[4]?.value).toFixed(2) || 0
      const conversions      = +mets[5]?.value || 0
      const revenue          = +(+mets[6]?.value).toFixed(2) || 0
      const engagementRate   = sessions > 0 ? +((engagedSessions / sessions) * 100).toFixed(1) : 0
      const cvr              = sessions > 0 ? +((conversions / sessions) * 100).toFixed(2) : 0

      // Diagnóstico de qualidade
      const issues: string[] = []
      if (bounceRate > 70)      issues.push('Taxa de rejeição alta (>70%) — problema na landing page')
      if (avgDuration < 30)     issues.push('Sessão muito curta (<30s) — tráfego pode ser irrelevante')
      if (pagesPerSession < 1.5) issues.push('Poucas páginas por sessão — usuário não está engajado')
      if (cvr === 0 && sessions > 20) issues.push('Sem conversões com volume significativo — revisar funil')

      return {
        campanha:       dims[0]?.value || '(sem nome)',
        source:         dims[1]?.value || '',
        medium:         dims[2]?.value || '',
        landingPage:    dims[3]?.value || '',
        sessions,
        engagedSessions,
        bounceRate,
        avgDuration:    +avgDuration.toFixed(0),
        pagesPerSession,
        conversions,
        revenue,
        engagementRate,
        cvr,
        qualityScore:   Math.max(0, Math.min(100, Math.round(
          (engagementRate > 60 ? 30 : engagementRate > 40 ? 20 : 10) +
          (bounceRate < 40 ? 30 : bounceRate < 60 ? 20 : 5) +
          (cvr > 3 ? 25 : cvr > 1 ? 15 : cvr > 0 ? 8 : 0) +
          (pagesPerSession > 3 ? 15 : pagesPerSession > 2 ? 10 : 5)
        ))),
        issues,
      }
    })

    return NextResponse.json({ success: true, campaigns, period: { startDate, endDate } })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
