// app/api/ga4/sessions/route.ts — Google Analytics 4 Data API
// PENDENTE: requer escopo analytics.readonly no OAuth.
// Esta rota está preparada para ser ativada quando o usuário conectar GA4.
// Scope necessário: https://www.googleapis.com/auth/analytics.readonly
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getValidGoogleToken, tokenErrorToResponse } from '@/services/google/token-manager'

const GA4_API = 'https://analyticsdata.googleapis.com/v1beta'

interface GA4RunReportBody {
  dateRanges: { startDate: string; endDate: string }[]
  dimensions?: { name: string }[]
  metrics:     { name: string }[]
  limit?:      number
  orderBys?:   { metric?: { metricName: string }; desc?: boolean }[]
}

async function runGA4Report(propertyId: string, accessToken: string, body: GA4RunReportBody) {
  const res = await fetch(`${GA4_API}/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  })

  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('application/json')) {
    throw new Error(`GA4 API HTTP ${res.status} — verifique o Property ID e os escopos OAuth.`)
  }

  const data = await res.json()

  if (!res.ok || data.error) {
    const msg = data.error?.message || `HTTP ${res.status}`
    if (data.error?.status === 'PERMISSION_DENIED') {
      throw new Error('Permissão insuficiente para Google Analytics. Reconecte com o escopo analytics.readonly.')
    }
    if (data.error?.status === 'NOT_FOUND') {
      throw new Error(`Property GA4 "${propertyId}" não encontrada. Verifique o ID (formato: 123456789).`)
    }
    throw new Error(`GA4 API: ${msg}`)
  }

  return data
}

function parseGA4Rows(data: any, dimensionNames: string[], metricNames: string[]) {
  return (data.rows || []).map((row: any) => {
    const obj: Record<string, string | number> = {}
    dimensionNames.forEach((name, i) => {
      obj[name] = row.dimensionValues?.[i]?.value || ''
    })
    metricNames.forEach((name, i) => {
      const val = row.metricValues?.[i]?.value
      obj[name] = isNaN(Number(val)) ? val : +Number(val).toFixed(2)
    })
    return obj
  })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const propertyId = body.propertyId as string | undefined
  const startDate  = (body.startDate as string) || '30daysAgo'
  const endDate    = (body.endDate   as string) || 'today'

  if (!propertyId) {
    return NextResponse.json({
      success: false,
      error: 'propertyId GA4 é obrigatório (ex: "123456789"). Encontre em Analytics → Admin → Property.',
      code: 'MISSING_PROPERTY_ID',
    }, { status: 400 })
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
    // Query 1: Sessões por source/medium
    const sessionData = await runGA4Report(propertyId, accessToken, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
        { name: 'sessionCampaignName' },
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'engagedSessions' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
        { name: 'conversions' },
        { name: 'totalRevenue' },
      ],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 50,
    })

    const sessions = parseGA4Rows(
      sessionData,
      ['sessionSource', 'sessionMedium', 'sessionCampaignName'],
      ['sessions', 'engagedSessions', 'bounceRate', 'averageSessionDuration', 'conversions', 'totalRevenue']
    )

    // Query 2: Totais gerais
    const totalData = await runGA4Report(propertyId, accessToken, {
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'engagedSessions' },
        { name: 'bounceRate' },
        { name: 'conversions' },
        { name: 'totalRevenue' },
      ],
    })

    const totalRow  = totalData.rows?.[0]
    const totals = totalRow ? {
      sessions:            +totalRow.metricValues[0]?.value || 0,
      activeUsers:         +totalRow.metricValues[1]?.value || 0,
      engagedSessions:     +totalRow.metricValues[2]?.value || 0,
      bounceRate:          +(+totalRow.metricValues[3]?.value * 100).toFixed(1) || 0,
      conversions:         +totalRow.metricValues[4]?.value || 0,
      revenue:             +(+totalRow.metricValues[5]?.value).toFixed(2) || 0,
    } : null

    return NextResponse.json({ success: true, sessions, totals, period: { startDate, endDate } })
  } catch (err: any) {
    const statusCode = err.message.includes('Permissão') ? 403
      : err.message.includes('não encontrada') ? 404 : 500
    return NextResponse.json({ success: false, error: err.message }, { status: statusCode })
  }
}
