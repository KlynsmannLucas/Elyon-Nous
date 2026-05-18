// app/api/benchmarks/refresh/route.ts
// Busca dados frescos de CPL/ROAS/CPC/CTR/CPM/CPA para um nicho via Tavily + extração estruturada com Claude.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

async function tavilySearch(query: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'basic',
      include_answer: true,
      max_results: 4,
    }),
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) return ''
  const data = await res.json()
  const parts: string[] = []
  if (data.answer) parts.push(data.answer)
  ;(data.results || []).slice(0, 3).forEach((r: any) => {
    if (r.content) parts.push(r.content.slice(0, 300).trim())
  })
  return parts.join('\n')
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { niche } = await req.json()
  if (!niche) return NextResponse.json({ error: 'Nicho não informado' }, { status: 400 })

  const tavilyKey    = process.env.TAVILY_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!tavilyKey || !anthropicKey) {
    return NextResponse.json({ error: 'Chaves de API não configuradas' }, { status: 500 })
  }

  const year = new Date().getFullYear()

  // 5 queries: CPL/ROAS + CPC/CTR + CPM/CPA
  const queries = [
    `CPL custo por lead ${niche} Brasil ${year} Meta Ads Google Ads benchmark valores reais gestores`,
    `ROAS retorno sobre investimento ${niche} Brasil ${year} tráfego pago resultados médios`,
    `benchmark marketing digital ${niche} Brasil ${year} CPL médio investimento leads`,
    `CPC custo por clique CTR taxa de cliques ${niche} Brasil ${year} Meta Ads Google Ads média`,
    `CPM custo por mil impressões CPA custo por aquisição conversão ${niche} Brasil ${year} anúncios`,
  ]

  const results = await Promise.allSettled(
    queries.map(q => tavilySearch(q, tavilyKey))
  )

  const rawText = results
    .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
    .map(r => r.value)
    .filter(Boolean)
    .join('\n\n')

  if (!rawText.trim()) {
    return NextResponse.json({ error: 'Nenhum dado encontrado para este nicho' }, { status: 404 })
  }

  // Claude Haiku extrai todos os números estruturados do texto
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const anthropic = new Anthropic({ apiKey: anthropicKey })

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `Extraia dados de benchmark de marketing digital do texto abaixo para o nicho: ${niche} no Brasil.

TEXTO:
${rawText.slice(0, 4000)}

Retorne APENAS JSON válido com este formato (sem markdown, sem explicação):
{
  "cpl_min": NUMERO_OU_NULL,
  "cpl_max": NUMERO_OU_NULL,
  "roas_avg": NUMERO_OU_NULL,
  "cpc_avg": NUMERO_OU_NULL,
  "ctr_avg": NUMERO_OU_NULL,
  "cpm_avg": NUMERO_OU_NULL,
  "cpa_avg": NUMERO_OU_NULL,
  "confidence": "alta"|"media"|"baixa"
}

Regras:
- cpl_min e cpl_max: valores em R$ inteiros (ex: 45, 120). Se só achar um valor, use ±30% como range.
- roas_avg: número decimal (ex: 3.5). null se não encontrado.
- cpc_avg: custo médio por clique em R$ (ex: 2.50). null se não encontrado.
- ctr_avg: taxa de cliques média em % (ex: 1.8). null se não encontrado.
- cpm_avg: custo por mil impressões em R$ (ex: 18.00). null se não encontrado.
- cpa_avg: custo por aquisição/conversão em R$ (ex: 350). null se não encontrado.
- confidence: "alta" se encontrou pelo menos 2 fontes com valores, "media" se 1 fonte, "baixa" se estimado.
- Use apenas valores específicos para ${niche}. Não use benchmarks genéricos de outros nichos.
- Prefira null a inventar valores — dados ausentes são melhores que dados incorretos.`,
    }],
  })

  const raw = (msg.content[0] as any).text?.trim() || ''

  let parsed: {
    cpl_min:    number | null
    cpl_max:    number | null
    roas_avg:   number | null
    cpc_avg:    number | null
    ctr_avg:    number | null
    cpm_avg:    number | null
    cpa_avg:    number | null
    confidence: string
  }
  try {
    parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch {
    return NextResponse.json({ error: 'Falha ao interpretar dados extraídos', raw }, { status: 500 })
  }

  if (!parsed.cpl_min || !parsed.cpl_max || parsed.cpl_min <= 0 || parsed.cpl_max <= 0) {
    return NextResponse.json({ error: 'Dados insuficientes para este nicho. Tente novamente.' }, { status: 404 })
  }

  return NextResponse.json({
    niche,
    cpl_min:    Math.round(parsed.cpl_min),
    cpl_max:    Math.round(parsed.cpl_max),
    roas_avg:   parsed.roas_avg   ? +parsed.roas_avg.toFixed(1)  : null,
    cpc_avg:    parsed.cpc_avg    ? +parsed.cpc_avg.toFixed(2)   : null,
    ctr_avg:    parsed.ctr_avg    ? +parsed.ctr_avg.toFixed(2)   : null,
    cpm_avg:    parsed.cpm_avg    ? +parsed.cpm_avg.toFixed(2)   : null,
    cpa_avg:    parsed.cpa_avg    ? +parsed.cpa_avg.toFixed(0)   : null,
    confidence: parsed.confidence || 'media',
    fetchedAt:  new Date().toISOString(),
  })
}
