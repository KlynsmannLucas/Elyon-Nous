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

  // 5 queries focadas — CPL por canal, ROAS, tendências e biblioteca de anúncios
  const queries = [
    `CPL custo por lead ${niche}${location} ${year} Facebook Ads Instagram Meta Ads benchmark real`,
    `CPL custo por lead ${niche}${location} ${year} Google Ads Search Shopping PMAX benchmark`,
    `CPL custo por lead ${niche}${location} ${year} TikTok LinkedIn YouTube Pinterest benchmark`,
    `ROAS retorno sobre investimento ${niche}${location} ${year} resultados reais gestores`,
    `tendências criativos anúncios ${niche}${location} ${year} melhores formatos que convertem`,
  ]

  try {
    const results = await Promise.allSettled(
      queries.map((query) => searchTavily(query, apiKey))
    )

    const sections: string[] = []

    results.forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value) {
        const label = i === 0 ? 'CPL Meta Ads (Facebook/Instagram) — Dados Reais'
          : i === 1 ? 'CPL Google Ads (Search/PMAX) — Dados Reais'
          : i === 2 ? 'CPL TikTok/LinkedIn/YouTube — Dados Reais'
          : i === 3 ? 'ROAS e Retorno sobre Investimento — Dados Reais'
          : 'Criativos e Formatos que Convertem'
        sections.push(`[${label}]\n${result.value}`)
      }
    })

    if (sections.length === 0) return ''

    return `\nDADOS DE MERCADO EM TEMPO REAL — CPL POR CANAL (fonte: busca web ${year}):\n${sections.join('\n\n')}\n\nCRÍTICO: Use esses dados de CPL real por canal para preencher os campos "cpl_min", "cpl_max" e "cpl_avg" de cada canal em "priority_ranking". Substitua benchmarks estáticos por esses dados reais quando disponíveis. Se um canal não tiver dados, use o benchmark interno como fallback.`

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
