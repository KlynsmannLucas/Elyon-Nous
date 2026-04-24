// app/api/concorrentes/route.ts — Radar de Concorrentes: Meta Ad Library + Claude
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

async function fetchCompetitorAds(
  accessToken: string,
  competitorName: string,
  niche: string
): Promise<{ body: string; title?: string; page?: string }[]> {
  try {
    const fields = ['ad_creative_bodies', 'ad_creative_link_titles', 'page_name'].join(',')
    const params = new URLSearchParams({
      ad_type:              'ALL',
      ad_reached_countries: JSON.stringify(['BR']),
      search_terms:         `${competitorName} ${niche}`.slice(0, 80),
      fields,
      limit:                '10',
      access_token:         accessToken,
    })
    const res = await fetch(
      `https://graph.facebook.com/v19.0/ads_archive?${params}`,
      { signal: AbortSignal.timeout(8000) }
    )
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('application/json')) return []
    const data = await res.json()
    if (data.error || !data.data) return []
    return (data.data as any[])
      .map((ad) => ({
        page:  ad.page_name || '',
        body:  (ad.ad_creative_bodies || [])[0] || '',
        title: (ad.ad_creative_link_titles || [])[0] || '',
      }))
      .filter((ad) => ad.body || ad.title)
      .slice(0, 6)
  } catch {
    return []
  }
}

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { competitorName, niche, metaAccessToken } = await req.json()
  if (!competitorName?.trim()) {
    return NextResponse.json({ error: 'Nome do concorrente obrigatório' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API key não configurada' }, { status: 500 })

  // Busca anúncios reais do concorrente (silenciosa — enriquece análise)
  const ads = metaAccessToken
    ? await fetchCompetitorAds(metaAccessToken, competitorName, niche)
    : []

  const adsContext = ads.length > 0
    ? `\nANÚNCIOS REAIS ENCONTRADOS NA BIBLIOTECA DO META:\n${ads
        .map((a, i) => `${i + 1}. ${a.page ? `[${a.page}] ` : ''}${a.title ? `"${a.title}" — ` : ''}${a.body.slice(0, 300)}`)
        .join('\n')}\n`
    : '\nNenhum anúncio encontrado na Biblioteca do Meta — faça análise baseada no nome e nicho.\n'

  const prompt = `Você é um especialista em inteligência competitiva de marketing digital brasileiro.

CONTEXTO:
- Concorrente analisado: "${competitorName}"
- Nicho: ${niche || 'não informado'}
${adsContext}

Analise este concorrente e crie um relatório de inteligência competitiva completo.
Com base nos anúncios encontrados (ou no nome/nicho se sem anúncios), identifique padrões e oportunidades.

Retorne APENAS JSON válido com esta estrutura:
{
  "mainOffer": "qual é a oferta principal/promessa central que eles comunicam",
  "creativeAngles": ["ângulo criativo 1", "ângulo criativo 2", "ângulo criativo 3"],
  "ctas": ["CTA 1 que usam", "CTA 2", "CTA 3"],
  "positioning": "como eles se posicionam no mercado (2-3 frases)",
  "weaknesses": ["ponto fraco 1", "ponto fraco 2", "ponto fraco 3"],
  "differentiation": "como você pode se diferenciar deles (1-2 frases diretas)",
  "recommendations": [
    "recomendação acionável 1 para superar este concorrente",
    "recomendação acionável 2",
    "recomendação acionável 3"
  ]
}`

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const anthropic = new Anthropic({ apiKey })

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: 'Você é especialista em inteligência competitiva de marketing digital. Responda APENAS com JSON válido, sem markdown.',
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (response.content[0] as any).text?.trim() || ''
    let analysis: any
    try { analysis = JSON.parse(text) } catch {
      const m = text.match(/(\{[\s\S]*\})/)
      if (!m) throw new Error('Resposta inválida da IA')
      analysis = JSON.parse(m[1])
    }

    return NextResponse.json({ success: true, ads, analysis })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
