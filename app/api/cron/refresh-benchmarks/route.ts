// app/api/cron/refresh-benchmarks/route.ts
// Cron mensal: atualiza CPL/ROAS de todos os nichos via Tavily + Claude Haiku
// e persiste em Supabase para disponibilidade instantânea nas rotas.
//
// Vercel Cron (vercel.json):
//   { "path": "/api/cron/refresh-benchmarks", "schedule": "0 6 1 * *" }
//   → Roda às 06:00 UTC no dia 1 de cada mês
//
// SQL para criar a tabela (rode no Supabase SQL Editor uma vez):
//   CREATE TABLE IF NOT EXISTS benchmark_cache (
//     niche_key  TEXT PRIMARY KEY,
//     niche_name TEXT,
//     cpl_min    NUMERIC,
//     cpl_max    NUMERIC,
//     roas_avg   NUMERIC,
//     confidence TEXT,
//     summary    TEXT,
//     updated_at TIMESTAMPTZ DEFAULT NOW()
//   );

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const CRON_SECRET = process.env.CRON_SECRET

// Todos os nichos a atualizar — chave + nome de busca para Tavily
const NICHES_TO_REFRESH: { key: string; name: string; searchTerm: string }[] = [
  { key: 'financeiro',          name: 'Financeiro / Crédito',            searchTerm: 'financeiro crédito empréstimo' },
  { key: 'saude',               name: 'Saúde / Clínica',                 searchTerm: 'clínica médica saúde' },
  { key: 'odontologia',         name: 'Odontologia',                     searchTerm: 'dentista odontologia' },
  { key: 'educacao',            name: 'Educação / Cursos',               searchTerm: 'curso online educação' },
  { key: 'imobiliario',         name: 'Imobiliário',                     searchTerm: 'imóvel lançamento construtora' },
  { key: 'ecommerce',           name: 'E-commerce',                      searchTerm: 'loja virtual e-commerce' },
  { key: 'juridico',            name: 'Jurídico / Advocacia',            searchTerm: 'advogado advocacia' },
  { key: 'contabilidade',       name: 'Contabilidade',                   searchTerm: 'contabilidade contador' },
  { key: 'beleza',              name: 'Beleza / Estética',               searchTerm: 'salão beleza estética' },
  { key: 'fitness',             name: 'Fitness / Academia',              searchTerm: 'academia fitness personal trainer' },
  { key: 'tecnologia',          name: 'Tecnologia / SaaS',               searchTerm: 'software SaaS tecnologia' },
  { key: 'pet',                 name: 'Pet / Veterinário',               searchTerm: 'petshop veterinário pet' },
  { key: 'turismo',             name: 'Turismo / Viagens',               searchTerm: 'turismo viagem hotel' },
  { key: 'restaurante',         name: 'Restaurante / Food',              searchTerm: 'restaurante delivery food' },
  { key: 'consultoria',         name: 'Consultoria / Coaching',          searchTerm: 'consultoria coach mentoria' },
  { key: 'marketing_agencia',   name: 'Marketing / Agência',             searchTerm: 'agência marketing tráfego pago' },
  { key: 'construcao',          name: 'Construção / Reforma',            searchTerm: 'construção reforma engenharia' },
  { key: 'psicologia',          name: 'Psicologia / Terapia',            searchTerm: 'psicólogo terapia psicologia' },
  { key: 'automotivo',          name: 'Automotivo / Oficina',            searchTerm: 'oficina mecânica automotivo' },
  { key: 'fisioterapia',        name: 'Fisioterapia',                    searchTerm: 'fisioterapia fisioterapeuta' },
  { key: 'corretor_saude',      name: 'Corretor de Planos de Saúde',     searchTerm: 'plano de saúde corretor' },
  { key: 'corretor_imobiliario',name: 'Corretor Imobiliário',            searchTerm: 'corretor imobiliário venda imóvel' },
  { key: 'protecao_patrimonial',name: 'Proteção Patrimonial',            searchTerm: 'proteção patrimonial holding familiar' },
  { key: 'seguro_vida',         name: 'Seguro de Vida',                  searchTerm: 'seguro de vida corretor' },
  { key: 'seguro_auto',         name: 'Seguro Automotivo',               searchTerm: 'seguro automotivo carro' },
  { key: 'seguro_residencial',  name: 'Seguro Residencial',              searchTerm: 'seguro residencial casa' },
  { key: 'rh_empresa',          name: 'Empresas de RH',                  searchTerm: 'recursos humanos RH outsourcing recrutamento' },
  { key: 'auditoria',           name: 'Auditoria / Compliance',          searchTerm: 'auditoria compliance governança' },
]

async function tavilyQuery(query: string, apiKey: string): Promise<string> {
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',
        include_answer: true,
        max_results: 3,
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return ''
    const data = await res.json()
    const parts: string[] = []
    if (data.answer) parts.push(data.answer)
    data.results?.slice(0, 2).forEach((r: any) => {
      if (r.content) parts.push(r.content.slice(0, 300))
    })
    return parts.join('\n')
  } catch {
    return ''
  }
}

async function fetchBenchmarksFromTavily(searchTerm: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) return ''
  const year = new Date().getFullYear()
  const [r1, r2] = await Promise.allSettled([
    tavilyQuery(`CPL custo por lead ROAS ${searchTerm} Brasil ${year} Meta Ads Google Ads benchmark real`, apiKey),
    tavilyQuery(`CPC CTR CPM CPA ${searchTerm} Brasil ${year} anúncios benchmark tráfego pago`, apiKey),
  ])
  return [
    r1.status === 'fulfilled' ? r1.value : '',
    r2.status === 'fulfilled' ? r2.value : '',
  ].filter(Boolean).join('\n\n')
}

async function extractNumbers(rawText: string, nicheName: string): Promise<{
  cpl_min: number | null; cpl_max: number | null; roas_avg: number | null
  cpc_avg: number | null; ctr_avg: number | null; cpm_avg: number | null; cpa_avg: number | null
  confidence: string
} | null> {
  if (!rawText) return null
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey })
    const res = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 350,
      messages: [{
        role: 'user',
        content: `Extraia métricas de benchmark de marketing digital para o nicho "${nicheName}" no Brasil.
Retorne APENAS JSON: {
  "cpl_min": NUMBER_OR_NULL, "cpl_max": NUMBER_OR_NULL, "roas_avg": NUMBER_OR_NULL,
  "cpc_avg": NUMBER_OR_NULL, "ctr_avg": NUMBER_OR_NULL, "cpm_avg": NUMBER_OR_NULL, "cpa_avg": NUMBER_OR_NULL,
  "confidence": "alta|media|baixa"
}
Se não encontrar dados confiáveis para um campo, use null. Prefira null a inventar valores.
cpc_avg = custo por clique em R$, ctr_avg = taxa de cliques em %, cpm_avg = CPM em R$, cpa_avg = CPA em R$.

TEXTO:
${rawText.slice(0, 1000)}`,
      }],
    })
    const text = (res.content[0] as any).text?.trim() || ''
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  const authHeader = req.headers instanceof Headers ? req.headers.get('authorization') : null
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ skipped: true, reason: 'supabase not configured' })
  }

  const tavilyKey = process.env.TAVILY_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!tavilyKey || !anthropicKey) {
    return NextResponse.json({ skipped: true, reason: 'TAVILY_API_KEY ou ANTHROPIC_API_KEY não configurados' })
  }

  const results: { key: string; status: string; cpl_min?: number | null; cpl_max?: number | null }[] = []
  const updatedAt = new Date().toISOString()

  for (const niche of NICHES_TO_REFRESH) {
    try {
      const raw = await fetchBenchmarksFromTavily(niche.searchTerm)
      const extracted = await extractNumbers(raw, niche.name)

      if (extracted && (extracted.cpl_min || extracted.cpl_max)) {
        const { error } = await supabaseAdmin
          .from('benchmark_cache')
          .upsert({
            niche_key:  niche.key,
            niche_name: niche.name,
            cpl_min:    extracted.cpl_min,
            cpl_max:    extracted.cpl_max,
            roas_avg:   extracted.roas_avg,
            cpc_avg:    extracted.cpc_avg,
            ctr_avg:    extracted.ctr_avg,
            cpm_avg:    extracted.cpm_avg,
            cpa_avg:    extracted.cpa_avg,
            confidence: extracted.confidence,
            summary:    raw.slice(0, 600),
            updated_at: updatedAt,
          }, { onConflict: 'niche_key' })

        results.push({
          key: niche.key,
          status: error ? `erro: ${error.message}` : 'ok',
          cpl_min: extracted.cpl_min,
          cpl_max: extracted.cpl_max,
        })
      } else {
        results.push({ key: niche.key, status: 'sem dados suficientes' })
      }

      // Delay entre nichos para não saturar Tavily
      await new Promise(r => setTimeout(r, 500))
    } catch (e: any) {
      results.push({ key: niche.key, status: `falhou: ${e.message}` })
    }
  }

  const ok = results.filter(r => r.status === 'ok').length
  console.log(`[cron/refresh-benchmarks] ${ok}/${NICHES_TO_REFRESH.length} nichos atualizados`)

  return NextResponse.json({
    refreshedAt: updatedAt,
    total: NICHES_TO_REFRESH.length,
    updated: ok,
    results,
  })
}
