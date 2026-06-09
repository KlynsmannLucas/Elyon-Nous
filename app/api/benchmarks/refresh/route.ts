// app/api/benchmarks/refresh/route.ts
// Atualiza benchmark de um nicho específico via Tavily + Claude e persiste no Supabase.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

async function tavilySearch(query: string, apiKey: string): Promise<string> {
  try {
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
  } catch {
    return ''
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { niche, nicheKey } = body
  if (!niche) return NextResponse.json({ error: 'Nicho não informado' }, { status: 400 })

  const tavilyKey    = process.env.TAVILY_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!tavilyKey || !anthropicKey) {
    return NextResponse.json({ error: 'Chaves de API não configuradas' }, { status: 500 })
  }

  const year = new Date().getFullYear()

  // 3 queries channel-specific: Meta, Google, TikTok/LinkedIn + métricas gerais
  const queries = [
    `CPL Meta Ads Instagram ${niche} Brasil ${year} custo por lead benchmark gestores resultado real`,
    `CPL Google Ads ${niche} Brasil ${year} custo por lead benchmark pesquisa paga resultado`,
    `ROAS CPC CTR CPM ${niche} Brasil ${year} Meta Ads Google Ads benchmark tráfego pago`,
    `CPL TikTok LinkedIn ${niche} Brasil ${year} custo por lead anúncios benchmark`,
  ]

  const { fetchGroundedBenchmarks } = await import('@/lib/gemini')
  const [tavilyResults, geminiGrounded] = await Promise.all([
    Promise.allSettled(queries.map(q => tavilySearch(q, tavilyKey))),
    fetchGroundedBenchmarks(niche).catch(() => ''),  // aditivo: complementa o Tavily
  ])
  const rawText = [
    ...tavilyResults
      .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
      .map(r => r.value),
    geminiGrounded,
  ]
    .filter(Boolean)
    .join('\n\n')

  if (!rawText.trim()) {
    return NextResponse.json({ error: 'Nenhum dado encontrado para este nicho' }, { status: 404 })
  }

  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const anthropic = new Anthropic({ apiKey: anthropicKey })

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `Extraia benchmarks de marketing digital para o nicho "${niche}" no Brasil.
Retorne APENAS JSON válido (sem markdown):
{
  "cpl_min": NUMBER_OR_NULL,
  "cpl_max": NUMBER_OR_NULL,
  "cpl_meta_min": NUMBER_OR_NULL,
  "cpl_meta_max": NUMBER_OR_NULL,
  "cpl_google_min": NUMBER_OR_NULL,
  "cpl_google_max": NUMBER_OR_NULL,
  "cpl_tiktok_min": NUMBER_OR_NULL,
  "cpl_tiktok_max": NUMBER_OR_NULL,
  "cpl_linkedin_min": NUMBER_OR_NULL,
  "cpl_linkedin_max": NUMBER_OR_NULL,
  "roas_avg": NUMBER_OR_NULL,
  "cpc_avg": NUMBER_OR_NULL,
  "ctr_avg": NUMBER_OR_NULL,
  "cpm_avg": NUMBER_OR_NULL,
  "cpa_avg": NUMBER_OR_NULL,
  "confidence": "alta|media|baixa"
}
Regras:
- cpl_min/max: range geral (menor canal, maior canal) em R$.
- cpl_meta/google/tiktok/linkedin: CPL específico por canal. null se não citado.
- ctr_avg em %. cpc_avg/cpm_avg/cpa_avg em R$.
- confidence: "alta" = 2+ fontes, "media" = 1 fonte, "baixa" = estimado.
- Prefira null a inventar. Dados ausentes são melhores que dados incorretos.

TEXTO:
${rawText.slice(0, 4000)}`,
    }],
  })

  const raw = (msg.content[0] as any).text?.trim() || ''
  let parsed: any
  try {
    parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch {
    return NextResponse.json({ error: 'Falha ao interpretar dados extraídos', raw }, { status: 500 })
  }

  if (!parsed.cpl_min || !parsed.cpl_max || parsed.cpl_min <= 0 || parsed.cpl_max <= 0) {
    return NextResponse.json({ error: 'Dados insuficientes. Tente novamente.' }, { status: 404 })
  }

  const updatedAt = new Date().toISOString()
  const saved = nicheKey && supabaseAdmin
  if (saved) {
    await supabaseAdmin!
      .from('benchmark_cache')
      .upsert({
        niche_key:        nicheKey,
        niche_name:       niche,
        cpl_min:          Math.round(parsed.cpl_min),
        cpl_max:          Math.round(parsed.cpl_max),
        cpl_meta_min:     parsed.cpl_meta_min   ? Math.round(parsed.cpl_meta_min)   : null,
        cpl_meta_max:     parsed.cpl_meta_max   ? Math.round(parsed.cpl_meta_max)   : null,
        cpl_google_min:   parsed.cpl_google_min ? Math.round(parsed.cpl_google_min) : null,
        cpl_google_max:   parsed.cpl_google_max ? Math.round(parsed.cpl_google_max) : null,
        cpl_tiktok_min:   parsed.cpl_tiktok_min ? Math.round(parsed.cpl_tiktok_min) : null,
        cpl_tiktok_max:   parsed.cpl_tiktok_max ? Math.round(parsed.cpl_tiktok_max) : null,
        cpl_linkedin_min: parsed.cpl_linkedin_min ? Math.round(parsed.cpl_linkedin_min) : null,
        cpl_linkedin_max: parsed.cpl_linkedin_max ? Math.round(parsed.cpl_linkedin_max) : null,
        roas_avg:         parsed.roas_avg   ? +parsed.roas_avg.toFixed(1)  : null,
        cpc_avg:          parsed.cpc_avg    ? +parsed.cpc_avg.toFixed(2)   : null,
        ctr_avg:          parsed.ctr_avg    ? +parsed.ctr_avg.toFixed(2)   : null,
        cpm_avg:          parsed.cpm_avg    ? +parsed.cpm_avg.toFixed(2)   : null,
        cpa_avg:          parsed.cpa_avg    ? +parsed.cpa_avg.toFixed(0)   : null,
        confidence:       parsed.confidence || 'media',
        summary:          rawText.slice(0, 600),
        updated_at:       updatedAt,
      }, { onConflict: 'niche_key' })
  }

  return NextResponse.json({
    niche,
    nicheKey:         nicheKey ?? null,
    savedToCache:     !!saved,
    fetchedAt:        updatedAt,
    cpl_min:          Math.round(parsed.cpl_min),
    cpl_max:          Math.round(parsed.cpl_max),
    cpl_meta_min:     parsed.cpl_meta_min   ? Math.round(parsed.cpl_meta_min)   : null,
    cpl_meta_max:     parsed.cpl_meta_max   ? Math.round(parsed.cpl_meta_max)   : null,
    cpl_google_min:   parsed.cpl_google_min ? Math.round(parsed.cpl_google_min) : null,
    cpl_google_max:   parsed.cpl_google_max ? Math.round(parsed.cpl_google_max) : null,
    cpl_tiktok_min:   parsed.cpl_tiktok_min ? Math.round(parsed.cpl_tiktok_min) : null,
    cpl_tiktok_max:   parsed.cpl_tiktok_max ? Math.round(parsed.cpl_tiktok_max) : null,
    cpl_linkedin_min: parsed.cpl_linkedin_min ? Math.round(parsed.cpl_linkedin_min) : null,
    cpl_linkedin_max: parsed.cpl_linkedin_max ? Math.round(parsed.cpl_linkedin_max) : null,
    roas_avg:         parsed.roas_avg   ? +parsed.roas_avg.toFixed(1)  : null,
    cpc_avg:          parsed.cpc_avg    ? +parsed.cpc_avg.toFixed(2)   : null,
    ctr_avg:          parsed.ctr_avg    ? +parsed.ctr_avg.toFixed(2)   : null,
    cpm_avg:          parsed.cpm_avg    ? +parsed.cpm_avg.toFixed(2)   : null,
    cpa_avg:          parsed.cpa_avg    ? +parsed.cpa_avg.toFixed(0)   : null,
    confidence:       parsed.confidence || 'media',
  })
}
