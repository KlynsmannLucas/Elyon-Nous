// app/api/benchmarks/refresh/route.ts
// Busca dados frescos de CPL/ROAS para um nicho via Tavily + extração estruturada com Claude.
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
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { niche } = await req.json()
  if (!niche) return NextResponse.json({ error: 'Nicho não informado' }, { status: 400 })

  const tavilyKey    = process.env.TAVILY_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!tavilyKey || !anthropicKey) {
    return NextResponse.json({ error: 'Chaves de API não configuradas' }, { status: 500 })
  }

  const year = new Date().getFullYear()

  // 3 queries focadas em números reais de CPL e ROAS
  const queries = [
    `CPL custo por lead ${niche} Brasil ${year} Meta Ads Google Ads benchmark valores reais gestores`,
    `ROAS retorno sobre investimento ${niche} Brasil ${year} tráfego pago resultados médios`,
    `benchmark marketing digital ${niche} Brasil ${year} CPL médio investimento leads`,
  ]

  const [r1, r2, r3] = await Promise.allSettled(
    queries.map(q => tavilySearch(q, tavilyKey))
  )

  const rawText = [
    r1.status === 'fulfilled' ? r1.value : '',
    r2.status === 'fulfilled' ? r2.value : '',
    r3.status === 'fulfilled' ? r3.value : '',
  ].filter(Boolean).join('\n\n')

  if (!rawText.trim()) {
    return NextResponse.json({ error: 'Nenhum dado encontrado para este nicho' }, { status: 404 })
  }

  // Claude Haiku extrai os números estruturados do texto
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const anthropic = new Anthropic({ apiKey: anthropicKey })

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: `Extraia os dados de benchmark de marketing do texto abaixo para o nicho: ${niche} no Brasil.

TEXTO:
${rawText.slice(0, 3000)}

Retorne APENAS JSON válido com este formato (sem markdown, sem explicação):
{"cpl_min":NUMERO,"cpl_max":NUMERO,"roas_avg":NUMERO_OU_NULL,"confidence":"alta"|"media"|"baixa"}

Regras:
- cpl_min e cpl_max: valores em R$ inteiros (ex: 45, 120). Se só achar um valor, use ±30% como range.
- roas_avg: número decimal (ex: 3.5). null se não encontrado.
- confidence: "alta" se encontrou pelo menos 2 fontes com valores, "media" se 1 fonte, "baixa" se estimado.
- Use apenas valores específicos para ${niche}. Não use benchmarks genéricos de outros nichos.`,
    }],
  })

  const raw = (msg.content[0] as any).text?.trim() || ''

  let parsed: { cpl_min: number; cpl_max: number; roas_avg: number | null; confidence: string }
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
    roas_avg:   parsed.roas_avg ? +parsed.roas_avg.toFixed(1) : null,
    confidence: parsed.confidence || 'media',
    fetchedAt:  new Date().toISOString(),
  })
}
