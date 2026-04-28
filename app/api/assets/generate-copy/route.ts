// app/api/assets/generate-copy/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { callLLMJson } from '@/lib/pipeline/llm'
import { getBenchmark, getBenchmarkSummary } from '@/lib/niche_benchmarks'

const ASSET_CONTEXT: Record<string, string> = {
  logo:      'logotipo da marca — reforçar identidade e autoridade da empresa',
  product:   'foto do produto/serviço — mostrar o que o cliente está comprando',
  lifestyle: 'imagem aspiracional — mostrar a transformação/resultado desejado',
  banner:    'arte/banner pronto — anúncio criativo já estruturado para veicular',
  other:     'imagem de apoio da marca',
}

const PLATFORM_RULES: Record<string, { headlineMax: number; bodyMax: number; notes: string }> = {
  meta:    { headlineMax: 40,  bodyMax: 125, notes: 'Meta Ads (Feed/Stories) — primeiros 3 chars são gold, emoji permitido no body' },
  google:  { headlineMax: 30,  bodyMax: 90,  notes: 'Google RSA — incluir keyword principal no headline, sem emoji' },
  tiktok:  { headlineMax: 35,  bodyMax: 80,  notes: 'TikTok — gancho nos 1,5s, linguagem informal, trend-aware' },
  default: { headlineMax: 40,  bodyMax: 125, notes: 'Meta Ads — primary text até 125 chars, headline até 40 chars' },
}

interface GenerateCopyRequest {
  clientData: {
    clientName: string
    niche: string
    products?: string[]
    ticketPrice?: number
    grossMargin?: number
    conversionRate?: number
  }
  assetType: string
  assetName: string
  persona?: {
    name?: string
    age?: string
    profession?: string
    pains?: string[]
    desires?: string[]
    objections?: string[]
  }
  platform?: string
  auditInsights?: string[]
  cplTarget?: number
  funnelGap?: string
}

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { rateLimit } = await import('@/lib/rateLimit')
  const rl = rateLimit(userId, 'assets', { max: 10, windowSec: 3600 })
  if (!rl.ok) {
    return NextResponse.json({ error: `Limite atingido. Tente novamente em ${rl.retryAfterSec}s.` }, {
      status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) },
    })
  }

  const body: GenerateCopyRequest = await req.json()
  const { clientData, assetType, assetName, persona, platform = 'meta', auditInsights, cplTarget, funnelGap } = body

  if (!clientData || !assetType) {
    return NextResponse.json({ error: 'Dados insuficientes' }, { status: 400 })
  }

  const assetDesc    = ASSET_CONTEXT[assetType] || ASSET_CONTEXT.other
  const platformCfg  = PLATFORM_RULES[platform] || PLATFORM_RULES.default
  const bench        = getBenchmark(clientData.niche)
  const benchSummary = getBenchmarkSummary(clientData.niche)

  const cplMax = clientData.ticketPrice && clientData.grossMargin && clientData.conversionRate
    ? (clientData.ticketPrice * (clientData.grossMargin / 100) * (clientData.conversionRate / 100)).toFixed(0)
    : null

  const personaSection = persona
    ? `Persona: ${persona.name || 'Ideal'}, ${persona.age || ''}, ${persona.profession || ''}.
Dores: ${persona.pains?.slice(0, 2).join('; ') || 'Inferir do nicho'}.
Desejos: ${persona.desires?.slice(0, 2).join('; ') || 'Inferir do nicho'}.
Objeção principal: ${persona.objections?.[0] || 'Inferir do nicho'}.`
    : `Público típico do nicho "${clientData.niche}".`

  const contextExtras = [
    cplMax        ? `CPL máximo lucrativo: R$${cplMax}`                              : null,
    cplTarget     ? `CPL alvo: R$${cplTarget}`                                       : null,
    funnelGap     ? `Gargalo do funil: ${funnelGap} — priorizar copy para este estágio` : null,
    auditInsights?.length
      ? `Quick wins do Auditor: ${auditInsights.slice(0, 3).join(' | ')}`
      : null,
  ].filter(Boolean).join('\n')

  const prompt = `Você é copywriter sênior de direct response especializado em anúncios pagos no Brasil.

CONTEXTO:
- Empresa: ${clientData.clientName} | Nicho: ${clientData.niche}
- Produtos: ${(clientData.products || []).join(', ') || 'Principal produto do nicho'}
- Asset: ${assetDesc} — "${assetName}"
- Plataforma: ${platformCfg.notes}
- Headline: máx ${platformCfg.headlineMax} chars | Body: máx ${platformCfg.bodyMax} chars
- ${personaSection}
${contextExtras ? `\nDADOS DO DIAGNÓSTICO ELYON:\n${contextExtras}` : ''}
${benchSummary ? `\nBENCHMARK DO NICHO:\n${benchSummary}` : ''}
${bench?.insights?.length ? `\nINSIGHTS DO NICHO (use como ganchos):\n${bench.insights.slice(0, 4).map((i: string) => `- ${i}`).join('\n')}` : ''}

TAREFA: Crie 3 variações de copy prontas para usar neste anúncio.
Cada variação com um ÂNGULO diferente (dor / aspiração / prova social).

REGRAS:
- Linguagem natural PT-BR — como o cliente fala
- Headline: gancho direto que para o scroll, dentro do limite
- Body: dor → solução → CTA em 2-3 frases (Meta) ou 1 frase densa (Google)
- CTA: verbo de ação + benefício específico (não "Saiba mais")
- Sem clichês: "transforme sua vida", "o melhor", "não perca"

Retorne SOMENTE JSON válido:
{
  "variants": [
    {
      "headline": "<máx ${platformCfg.headlineMax} chars>",
      "primaryText": "<máx ${platformCfg.bodyMax} chars>",
      "cta": "<verbo + benefício específico>",
      "angle": "<dor | aspiração | prova_social | urgência | oferta>",
      "hook": "<primeira frase que prende — separada para análise>",
      "visualNotes": "<orientação para o designer: cena, emoção, elemento principal>"
    }
  ]
}`

  try {
    const result = await callLLMJson<{ variants: any[] }>({ user: prompt, maxTokens: 2000 })

    return NextResponse.json({
      success: true,
      variants: result.variants,
      benchmarkUsed: !!bench,
      niche: clientData.niche,
    })
  } catch (e: any) {
    console.error('[generate-copy] Erro:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
