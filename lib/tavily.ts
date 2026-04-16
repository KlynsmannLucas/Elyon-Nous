// lib/tavily.ts — Busca de benchmarks de marketing em tempo real via Tavily
// Chamado antes de gerar a estratégia para enriquecer o prompt com dados reais do mercado

export interface TavilyResult {
  query: string
  answer: string
  sources: { url: string; title: string; content: string }[]
}

/**
 * Busca dados de mercado reais para um nicho específico.
 * Retorna string formatada pronta para injetar no prompt da IA.
 */
export async function fetchRealtimeBenchmarks(
  niche: string,
  city?: string
): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) return ''

  const location = city ? ` ${city} Brasil` : ' Brasil'
  const year = new Date().getFullYear()

  // 3 queries focadas — CPL, ROAS e tendências do nicho
  const queries = [
    `CPL custo por lead ${niche}${location} ${year} Meta Ads Google Ads benchmark`,
    `ROAS retorno sobre investimento ${niche}${location} ${year} marketing digital`,
    `tendências marketing digital ${niche}${location} ${year} melhores canais estratégia`,
  ]

  try {
    const results = await Promise.allSettled(
      queries.map((query) => searchTavily(query, apiKey))
    )

    const sections: string[] = []

    results.forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value) {
        const label = i === 0 ? 'CPL e Benchmarks de Custo'
          : i === 1 ? 'ROAS e Retorno sobre Investimento'
          : 'Tendências e Melhores Canais'
        sections.push(`[${label}]\n${result.value}`)
      }
    })

    if (sections.length === 0) return ''

    return `\nDADOS DE MERCADO EM TEMPO REAL (fonte: busca web ${year}):\n${sections.join('\n\n')}\n\nUSE esses dados para calibrar CPL, ROAS e canais recomendados. Priorize dados reais sobre benchmarks estáticos quando houver conflito.`

  } catch {
    return ''
  }
}

async function searchTavily(query: string, apiKey: string): Promise<string> {
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
    signal: AbortSignal.timeout(4000), // 4s timeout por query
  })

  if (!res.ok) return ''
  const data = await res.json()

  // Combina a resposta resumida + trechos dos resultados
  const parts: string[] = []

  if (data.answer) {
    parts.push(data.answer)
  }

  if (data.results?.length > 0) {
    data.results.slice(0, 2).forEach((r: any) => {
      if (r.content) {
        // Pega só os primeiros 200 chars de cada resultado para não inflar o prompt
        parts.push(`• ${r.content.slice(0, 220).trim()}...`)
      }
    })
  }

  return parts.join('\n')
}
