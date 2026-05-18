// app/api/ads-data/google-negatives/route.ts
// Gera lista de palavras negativas sugeridas com base em Search Terms sem conversão.
// Exportável em CSV ou JSON.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getValidGoogleToken, tokenErrorToResponse } from '@/services/google/token-manager'

const API_VERSIONS = ['v19', 'v18']

async function gaqlSearch(cleanId: string, accessToken: string, devToken: string, query: string): Promise<any[]> {
  let lastError = ''
  for (const version of API_VERSIONS) {
    const res = await fetch(
      `https://googleads.googleapis.com/${version}/customers/${cleanId}/googleAds:search`,
      {
        method: 'POST',
        headers: {
          'Authorization':     `Bearer ${accessToken}`,
          'developer-token':   devToken,
          'login-customer-id': cleanId,
          'Content-Type':      'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
        signal: AbortSignal.timeout(20_000),
      }
    )
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('application/json')) { lastError = `HTTP ${res.status}`; continue }
    const data = await res.json()
    if (data.error) {
      const msg = data.error?.message || `HTTP ${res.status}`
      if (/version|deprecated|not found/i.test(msg)) { lastError = msg; continue }
      throw new Error(msg)
    }
    return data.results || []
  }
  throw new Error(`Google Ads API indisponível (${lastError})`)
}

// Infere tipo de correspondência ideal com base no termo
function inferMatchType(term: string): 'Exata' | 'Frase' | 'Ampla Modificada' {
  const words = term.trim().split(/\s+/)
  if (words.length === 1) return 'Exata'
  if (words.length <= 3)  return 'Frase'
  return 'Ampla Modificada'
}

// Formata para inserção no Google Ads
function formatNegative(term: string, matchType: string): string {
  if (matchType === 'Exata')  return `[${term}]`
  if (matchType === 'Frase')  return `"${term}"`
  return term
}

// Detecta motivo do desperdício
function detectWasteReason(spend: number, clicks: number, conversions: number): string {
  if (spend > 100 && conversions === 0) return 'Gasto alto sem conversão'
  if (clicks > 50  && conversions === 0) return 'Muitos cliques sem conversão'
  if (spend > 50   && conversions === 0) return 'Custo sem retorno'
  return 'Sem conversão'
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })

  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  if (!devToken) return NextResponse.json({ success: false, error: 'Developer token não configurado' }, { status: 500 })

  const body = await req.json().catch(() => ({}))
  const bodyAccountId = body.accountId as string | undefined
  const format        = (body.format as string) || 'json' // 'json' | 'csv'
  const minSpend      = Number(body.minSpend) || 30       // gasto mínimo para sugerir negativa

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

  const cleanId = String(accountId).replace(/-/g, '')

  try {
    const results = await gaqlSearch(cleanId, accessToken, devToken, `
      SELECT
        search_term_view.search_term,
        search_term_view.status,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions,
        campaign.name,
        campaign.id,
        ad_group.name,
        ad_group.id
      FROM search_term_view
      WHERE segments.date DURING LAST_30_DAYS
        AND metrics.cost_micros > 0
        AND metrics.conversions = 0
      ORDER BY metrics.cost_micros DESC
      LIMIT 500
    `)

    const negatives = results
      .map((r: any) => {
        const m           = r.metrics
        const term        = r.searchTermView?.searchTerm || ''
        const spend       = (m.costMicros || 0) / 1_000_000
        const clicks      = parseInt(m.clicks || '0')
        const conversions = parseFloat(m.conversions || '0')
        const impressions = parseInt(m.impressions || '0')

        if (spend < minSpend) return null

        const matchType    = inferMatchType(term)
        const negativaStr  = formatNegative(term, matchType)
        const motivo       = detectWasteReason(spend, clicks, conversions)

        return {
          campanha:        r.campaign?.name  || '',
          campanhaId:      r.campaign?.id    || '',
          grupoAnuncio:    r.adGroup?.name   || '',
          grupoAnuncioId:  r.adGroup?.id     || '',
          termoSearch:     term,
          status:          r.searchTermView?.status || '',
          gasto:           +spend.toFixed(2),
          cliques:         clicks,
          impressoes:      impressions,
          conversoes:      conversions,
          motivo,
          negativaSugerida: negativaStr,
          tipoCorrespondencia: matchType,
        }
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.gasto - a.gasto)

    const totalDesperdicio = negatives.reduce((s: number, n: any) => s + n.gasto, 0)

    if (format === 'csv') {
      const headers = [
        'Campanha','Grupo de Anúncio','Termo Pesquisado',
        'Gasto (R$)','Cliques','Impressões','Conversões',
        'Motivo','Negativa Sugerida','Tipo de Correspondência'
      ].join(';')

      const rows = negatives.map((n: any) =>
        [
          n.campanha, n.grupoAnuncio, n.termoSearch,
          n.gasto, n.cliques, n.impressoes, n.conversoes,
          n.motivo, n.negativaSugerida, n.tipoCorrespondencia,
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')
      )

      const csv = [headers, ...rows].join('\n')
      return new NextResponse(csv, {
        headers: {
          'Content-Type':        'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="negativas-${cleanId}-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      totalTermos: negatives.length,
      totalDesperdicio: +totalDesperdicio.toFixed(2),
      negatives,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
