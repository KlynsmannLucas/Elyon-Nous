// app/api/gsc/opportunities/route.ts
// Mapa de oportunidades: keywords com forte presença orgânica → sugestão de campanhas pagas.
// Scope necessário: https://www.googleapis.com/auth/webmasters.readonly
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getValidGoogleToken, tokenErrorToResponse } from '@/services/google/token-manager'

const GSC_API = 'https://www.googleapis.com/webmasters/v3'

async function gscQuery(siteUrl: string, accessToken: string, body: object) {
  const encodedSite = encodeURIComponent(siteUrl)
  const res = await fetch(`${GSC_API}/sites/${encodedSite}/searchAnalytics/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  })
  const data = await res.json()
  if (!res.ok || data.error) {
    if (res.status === 403) throw new Error('Permissão insuficiente para Search Console.')
    if (res.status === 404) throw new Error(`Site não encontrado no Search Console.`)
    throw new Error(`GSC: ${data.error?.message || `HTTP ${res.status}`}`)
  }
  return data.rows || []
}

function classifyOpportunity(position: number, impressions: number, ctr: number): {
  type: 'PAGAR_AGORA' | 'OTIMIZAR_SEO' | 'ESCALAR_PAGO' | 'MONITORAR'
  priority: 'alta' | 'media' | 'baixa'
  reason: string
} {
  if (position > 10 && impressions > 500) {
    return { type: 'PAGAR_AGORA',    priority: 'alta',  reason: 'Alto volume orgânico com posição baixa — campanha paga captura tráfego imediato' }
  }
  if (position <= 10 && position > 5 && impressions > 200) {
    return { type: 'OTIMIZAR_SEO',   priority: 'alta',  reason: 'Próximo ao Top 5 — otimização de conteúdo pode eliminar necessidade de verba paga' }
  }
  if (position <= 5 && ctr < 5) {
    return { type: 'ESCALAR_PAGO',   priority: 'media', reason: 'Posição orgânica boa mas CTR baixo — anúncio reforça presença e aumenta cliques totais' }
  }
  return { type: 'MONITORAR',        priority: 'baixa', reason: 'Monitore o comportamento antes de investir' }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const siteUrl = body.siteUrl as string | undefined

  if (!siteUrl) {
    return NextResponse.json({ success: false, error: 'siteUrl obrigatório', code: 'MISSING_SITE_URL' }, { status: 400 })
  }

  const startDate = (body.startDate as string) || (() => {
    const d = new Date(); d.setDate(d.getDate() - 28); return d.toISOString().split('T')[0]
  })()
  const endDate = (body.endDate as string) || new Date().toISOString().split('T')[0]

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
      startDate, endDate,
      dimensions: ['query'],
      rowLimit: 200,
    })

    const opportunities = rows
      .filter((row: any) => row.impressions > 100 && row.position > 3)
      .map((row: any) => {
        const keyword     = row.keys[0]
        const clicks      = row.clicks
        const impressions = row.impressions
        const ctr         = +(row.ctr * 100).toFixed(2)
        const position    = +row.position.toFixed(1)
        const classification = classifyOpportunity(position, impressions, ctr)

        // Estimativa de cliques adicionais com campanha paga (benchmark: anúncios pegam 15-25% extra)
        const estimatedExtraClicks = Math.round(impressions * 0.18)

        return {
          keyword,
          clicks,
          impressions,
          ctr,
          position,
          ...classification,
          estimatedExtraClicks,
          suggestedAction: classification.type === 'PAGAR_AGORA'
            ? `Criar campanha Search para "${keyword}"`
            : classification.type === 'OTIMIZAR_SEO'
            ? `Otimizar página para "${keyword}" e subir para Top 5`
            : classification.type === 'ESCALAR_PAGO'
            ? `Adicionar "${keyword}" a campanha existente com lance moderado`
            : `Monitorar "${keyword}" nos próximos 30 dias`,
        }
      })
      // sorting done after filter

    const priorityOrder: Record<'alta' | 'media' | 'baixa', number> = { alta: 0, media: 1, baixa: 2 }

    opportunities.sort((a: any, b: any) =>
      priorityOrder[a.priority as 'alta' | 'media' | 'baixa'] -
      priorityOrder[b.priority as 'alta' | 'media' | 'baixa'] || b.impressions - a.impressions
    )

    const summary = {
      total:       opportunities.length,
      alta:        opportunities.filter((o: any) => o.priority === 'alta').length,
      media:       opportunities.filter((o: any) => o.priority === 'media').length,
      baixa:       opportunities.filter((o: any) => o.priority === 'baixa').length,
      pagarAgora:  opportunities.filter((o: any) => o.type === 'PAGAR_AGORA').length,
      otimizarSEO: opportunities.filter((o: any) => o.type === 'OTIMIZAR_SEO').length,
    }

    return NextResponse.json({ success: true, opportunities, summary, period: { startDate, endDate } })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
