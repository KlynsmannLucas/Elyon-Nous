// app/api/gsc/keywords/route.ts — Google Search Console Data API
// PENDENTE: requer escopo webmasters.readonly no OAuth.
// Scope: https://www.googleapis.com/auth/webmasters.readonly
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getValidGoogleToken, tokenErrorToResponse } from '@/services/google/token-manager'

const GSC_API = 'https://www.googleapis.com/webmasters/v3'

interface GSCSearchQuery {
  startDate:   string
  endDate:     string
  dimensions:  string[]
  rowLimit?:   number
  startRow?:   number
  dimensionFilterGroups?: {
    filters: {
      dimension:  string
      operator:   string
      expression: string
    }[]
  }[]
}

async function gscQuery(siteUrl: string, accessToken: string, body: GSCSearchQuery) {
  const encodedSite = encodeURIComponent(siteUrl)
  const res = await fetch(`${GSC_API}/sites/${encodedSite}/searchAnalytics/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  })

  const data = await res.json()

  if (!res.ok || data.error) {
    const msg = data.error?.message || `HTTP ${res.status}`
    if (res.status === 403) throw new Error('Permissão insuficiente para Search Console. Reconecte com escopo webmasters.readonly.')
    if (res.status === 404) throw new Error(`Site "${siteUrl}" não encontrado no Search Console. Verifique se o site está verificado.`)
    throw new Error(`Search Console: ${msg}`)
  }

  return data.rows || []
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const siteUrl   = body.siteUrl  as string | undefined
  const startDate = (body.startDate as string) || (() => {
    const d = new Date(); d.setDate(d.getDate() - 28); return d.toISOString().split('T')[0]
  })()
  const endDate   = (body.endDate as string) || new Date().toISOString().split('T')[0]
  const limit     = Number(body.limit) || 100

  if (!siteUrl) {
    return NextResponse.json({
      success: false,
      error: 'siteUrl é obrigatório (ex: "https://seusite.com.br" ou "sc-domain:seusite.com.br")',
      code: 'MISSING_SITE_URL',
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
    const rows = await gscQuery(siteUrl, accessToken, {
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit:   limit,
    })

    const keywords = rows.map((row: any) => ({
      keyword:     row.keys[0],
      clicks:      row.clicks,
      impressions: row.impressions,
      ctr:         +(row.ctr * 100).toFixed(2),
      position:    +row.position.toFixed(1),
    }))

    // Cálculos de oportunidade
    const opportunities = keywords.filter((k: any) =>
      k.position > 5 && k.position <= 20 && k.impressions > 100
    ).map((k: any) => ({
      ...k,
      opportunityType: k.position <= 10 ? 'SEO_OTIMIZACAO' : 'CAMPANHA_PAGA',
      suggestion: k.position <= 10
        ? `Posição ${k.position}: otimize o conteúdo para subir ao Top 5`
        : `Posição ${k.position}: crie campanha paga para capturar tráfego imediato`,
    }))

    const totals = keywords.reduce((acc: any, k: any) => ({
      clicks:      acc.clicks      + k.clicks,
      impressions: acc.impressions + k.impressions,
    }), { clicks: 0, impressions: 0 })

    totals.avgCtr      = totals.impressions > 0 ? +((totals.clicks / totals.impressions) * 100).toFixed(2) : 0
    totals.avgPosition = keywords.length > 0
      ? +(keywords.reduce((s: number, k: any) => s + k.position, 0) / keywords.length).toFixed(1)
      : 0

    return NextResponse.json({
      success: true,
      keywords,
      opportunities,
      totals,
      period: { startDate, endDate },
    })
  } catch (err: any) {
    const status = err.message.includes('Permissão') ? 403
      : err.message.includes('não encontrado')       ? 404 : 500
    return NextResponse.json({ success: false, error: err.message }, { status })
  }
}
