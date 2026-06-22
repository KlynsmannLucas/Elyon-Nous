// app/api/campaign/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { callLLMJson } from '@/lib/pipeline/llm'
import { getBenchmark, getBenchmarkSummary } from '@/lib/niche_benchmarks'
import { buildNichePromptContext } from '@/lib/niche_prompts'
import { sanitizeText } from '@/lib/sanitize'
import { gateAndCharge, refundGate } from '@/lib/gate'

interface CampaignGenerateRequest {
  clientName: string
  niche: string
  objective?: string
  ticketPrice?: number
  grossMargin?: number
  conversionRate?: number
  currentCPL?: number
  budget?: number
  product?: string
  offer?: string
  targetAudience?: string
  mainPain?: string
  mainDesire?: string
  objections?: string[]
  differentials?: string[]
  auditorInsights?: string[]
  estrategistaChannels?: string[]
  cplTarget?: number
  funnelGap?: string
  platforms?: ('meta' | 'google')[]
  frameworks?: string[]
  variationsPerFramework?: number
  nicheDetails?: Record<string, string>
}

interface AdVariation {
  framework: string
  platform: 'meta' | 'google'
  headline: string
  primaryText?: string
  description?: string
  hook: string
  cta: string
  angle: string
  visualNotes: string
  testHypothesis: string
}

interface CampaignGenerateResponse {
  success: true
  bigIdea: string
  toneOfVoice: string
  metaVariations: AdVariation[]
  googleVariations: AdVariation[]
  alternativeHeadlines: string[]
  alternativeCTAs: string[]
  creativePlan: Array<{ week: string; test: string; metric: string }>
  anglesToAvoid: string[]
  generatedAt: string
  context: {
    benchmarkUsed: boolean
    auditorDataUsed: boolean
    estrategistaDataUsed: boolean
    cplTarget: number | null
    funnelGap: string | null
  }
}

function buildGenerativePrompt(req: CampaignGenerateRequest): string {
  const bench        = getBenchmark(req.niche)
  const benchSummary = getBenchmarkSummary(req.niche)
  const nicheCtx     = buildNichePromptContext(req.niche, req.nicheDetails || {})

  const platforms  = req.platforms  || ['meta', 'google']
  const frameworks = req.frameworks || ['dor', 'desejo', 'prova_social', 'urgencia']
  const vPerFw     = req.variationsPerFramework || 2

  const cplMax = req.ticketPrice && req.grossMargin && req.conversionRate
    ? (req.ticketPrice * (req.grossMargin / 100) * (req.conversionRate / 100)).toFixed(0)
    : null

  const financialCtx = [
    req.ticketPrice    ? `Ticket médio: R$${req.ticketPrice}`              : null,
    req.grossMargin    ? `Margem bruta: ${req.grossMargin}%`              : null,
    req.conversionRate ? `Taxa de fechamento: ${req.conversionRate}%`     : null,
    cplMax             ? `CPL máximo lucrativo calculado: R$${cplMax}`    : null,
    req.currentCPL     ? `CPL atual do cliente: R$${req.currentCPL}`      : null,
    req.cplTarget      ? `CPL alvo da estratégia: R$${req.cplTarget}`     : null,
    req.budget         ? `Budget mensal: R$${req.budget}`                 : null,
  ].filter(Boolean).join('\n')

  const auditorCtx = req.auditorInsights?.length
    ? `\n=== QUICK WINS IDENTIFICADOS PELO AUDITOR ===\n${req.auditorInsights.map(i => `- ${i}`).join('\n')}`
    : ''

  const estrategistaCtx = req.estrategistaChannels?.length
    ? `\nCanais priorizados pela estratégia: ${req.estrategistaChannels.join(', ')}`
    : ''

  const funnelCtx = req.funnelGap
    ? `\nGargalo do funil identificado: ${req.funnelGap} — priorizar copy para este estágio`
    : ''

  return `Você é um copywriter sênior de direct response, escola Gary Halbert/Dan Kennedy, especialista no mercado brasileiro de tráfego pago. Já gerou mais de R$50M em receita com anúncios no Meta e Google.

MISSÃO: O sistema ELYON já fez o diagnóstico completo deste cliente. Agora gere os anúncios PRONTOS para subir — calibrados pelos dados reais do nicho, não por suposições.

FILOSOFIA:
- O gancho decide tudo. Se não prende em 1,5s, o budget vai pro lixo.
- Copy que vende fala da DOR do cliente, não do produto do anunciante.
- CTAs específicos convertem 3× mais: "Agendar avaliação" > "Saiba mais"
- Prova > Promessa > Processo > Preço (nessa ordem)
- Mobile first: headline máx 40 chars Meta, 30 chars Google

REGRAS ABSOLUTAS:
1. NUNCA use clichês: "transforme sua vida", "o melhor do mercado", "não perca essa oportunidade"
2. Cada variação tem ÂNGULO diferente — nenhuma se repete
3. Linguagem natural de PT-BR — como o cliente fala, não como o anunciante
4. Respeite os limites de caracteres de cada plataforma
5. CTAs começam com verbo de ação direto

=== BRIEFING DO CLIENTE ===
Empresa: ${req.clientName}
Nicho: ${req.niche}
Produto/Serviço: ${req.product || 'Principal produto do nicho'}
Oferta específica: ${req.offer || 'Definir com base no nicho'}
Público-alvo: ${req.targetAudience || 'Inferir do nicho e benchmark'}
Principal dor: ${req.mainPain || 'Inferir do nicho'}
Principal desejo: ${req.mainDesire || 'Inferir do nicho'}
Objeções: ${req.objections?.join(' | ') || 'Inferir do nicho'}
Diferenciais: ${req.differentials?.join(' | ') || 'Inferir do nicho'}

=== DADOS FINANCEIROS DO CLIENTE ===
${financialCtx || 'Não informado — usar benchmark do nicho como referência'}
${funnelCtx}
${estrategistaCtx}
${auditorCtx}

${benchSummary ? `=== BENCHMARK REAL DO NICHO (use para calibrar urgência e promessas) ===\n${benchSummary}` : ''}
${nicheCtx ? `\n=== CONTEXTO ESPECIALIZADO DO NICHO ===\n${nicheCtx}` : ''}
${bench?.insights?.length ? `\n=== INSIGHTS DO NICHO (use como ganchos) ===\n${bench.insights.map((i: string) => `- ${i}`).join('\n')}` : ''}

=== O QUE GERAR ===
Plataformas: ${platforms.join(', ')}
Frameworks: ${frameworks.join(', ')}
${vPerFw} variação(ões) por framework por plataforma.

Responda APENAS com JSON válido (sem markdown, sem \`\`\`json):

{
  "bigIdea": "<conceito central que une todas as variações — 1 frase>",
  "toneOfVoice": "<guia de tom: vocabulário, ritmo, gatilhos que funcionam neste nicho>",

  "metaVariations": [
    {
      "framework": "<dor|desejo|prova_social|urgencia|autoridade|transformacao|objecao|curiosidade>",
      "platform": "meta",
      "headline": "<máx 40 chars — gancho que para o scroll>",
      "primaryText": "<máx 125 chars — dor → solução → CTA em 2-3 frases naturais>",
      "hook": "<primeira frase isolada — o que prende>",
      "cta": "<botão específico com verbo: ex 'Agendar avaliação grátis'>",
      "angle": "<ângulo desta variação em 3-5 palavras>",
      "visualNotes": "<orientação para designer: cena, emoção, elemento principal>",
      "testHypothesis": "<o que esta variação testa que as outras não testam>"
    }
  ],

  "googleVariations": [
    {
      "framework": "<framework>",
      "platform": "google",
      "headline": "<máx 30 chars — incluir keyword do nicho>",
      "description": "<máx 90 chars — benefício direto + CTA>",
      "hook": "<palavra/frase que ativa a intenção de busca>",
      "cta": "<extensão de sitelink ou CTA do anúncio>",
      "angle": "<ângulo em 3-5 palavras>",
      "visualNotes": "<extensões recomendadas: callout, estrutura de site, promoção>",
      "testHypothesis": "<o que esta variação testa>"
    }
  ],

  "alternativeHeadlines": ["<até 10 headlines extras para testes rápidos — máx 40 chars cada>"],

  "alternativeCTAs": ["<CTA alt 1>", "<CTA alt 2>", "<CTA alt 3>", "<CTA alt 4>"],

  "creativePlan": [
    {"week": "Semana 1", "test": "<primeiro teste A/B>", "metric": "<CTR|CPL|CVR — qual decide>"},
    {"week": "Semana 2", "test": "<segundo teste>",      "metric": "<métrica>"},
    {"week": "Semana 3", "test": "<terceiro teste>",     "metric": "<métrica>"}
  ],

  "anglesToAvoid": ["<ângulo que NÃO funciona neste nicho e por quê>"]
}`
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { rateLimit } = await import('@/lib/rateLimit')
  const rl = rateLimit(userId, 'campaign', { max: 10, windowSec: 3600 })
  if (!rl.ok) {
    return NextResponse.json({ error: `Limite atingido. Tente novamente em ${rl.retryAfterSec}s.` }, {
      status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) },
    })
  }

  let body: CampaignGenerateRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido no body' }, { status: 400 })
  }

  body.clientName = sanitizeText(body.clientName, 120)
  body.niche      = sanitizeText(body.niche, 120)
  if (body.objective) body.objective = sanitizeText(body.objective, 300)

  if (!body.clientName || !body.niche) {
    return NextResponse.json({ error: 'clientName e niche são obrigatórios' }, { status: 400 })
  }

  const gate = await gateAndCharge('campaign_generate')
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  try {
    const prompt = buildGenerativePrompt(body)

    const result = await callLLMJson<Omit<CampaignGenerateResponse,
      'success' | 'generatedAt' | 'context'
    >>({ user: prompt, maxTokens: 8000 })

    const response: CampaignGenerateResponse = {
      success: true,
      ...result,
      generatedAt: new Date().toISOString(),
      context: {
        benchmarkUsed:        !!getBenchmark(body.niche),
        auditorDataUsed:      !!(body.auditorInsights?.length),
        estrategistaDataUsed: !!(body.estrategistaChannels?.length || body.cplTarget),
        cplTarget:            body.cplTarget ?? null,
        funnelGap:            body.funnelGap ?? null,
      },
    }

    return NextResponse.json(response)
  } catch (e: any) {
    await refundGate(gate, 'campaign_generate')
    console.error('[campaign/generate] Erro:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
