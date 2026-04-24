// app/api/intelligence/route.ts — Inteligência de Mercado: análise estratégica senior, não ideias genéricas
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getBenchmark, getBenchmarkSummary } from '@/lib/niche_benchmarks'
import { fetchRealtimeBenchmarks } from '@/lib/tavily'

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

  try {
    const body = await req.json()
    const {
      clientName, niche, budget, objective, currentCPL, mainChallenge,
      strategy, campaignHistory = [],
      ticketPrice, grossMargin, conversionRate, isRecurring,
      auditRealMetrics = null,
    } = body

    const bench = getBenchmark(niche)
    const benchmarkText = getBenchmarkSummary(niche)

    // Tavily: busca dados reais do mercado em paralelo com setup (até 6s)
    const realtimeDataPromise = fetchRealtimeBenchmarks(niche, body.city).catch(() => '')

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API não configurada.' }, { status: 500 })
    }

    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const anthropic = new Anthropic({ apiKey })

    const margin    = (grossMargin || 40) / 100
    const cvr       = (conversionRate || (bench?.cvr_lead_to_sale || 0.1) * 100) / 100
    const ticket    = ticketPrice || bench?.avg_ticket || 1000
    const maxCPL    = cvr > 0 ? Math.round(ticket * margin * cvr) : 0

    const historyCtx = campaignHistory.length > 0
      ? campaignHistory.slice(0, 8).map((c: any) =>
          `• ${c.period} | ${c.channel} | CPL: R$${c.cplReal} | Leads: ${c.leads} | Vendas: ${c.conversions} | ${c.outcome?.toUpperCase()} | Funcionou: ${c.whatWorked || '—'} | Falhou: ${c.whatFailed || '—'}`
        ).join('\n')
      : 'Sem histórico de campanhas registrado.'

    const auditCtx = auditRealMetrics
      ? `CPL médio real: R$${auditRealMetrics.avgCPL} | Leads: ${auditRealMetrics.totalLeads} | Gasto: R$${auditRealMetrics.totalSpend} | ROAS: ${auditRealMetrics.avgROAS || 'N/A'}× | CTR: ${auditRealMetrics.avgCTR || 'N/A'}%`
      : 'Sem dados de auditoria disponíveis.'

    const prompt = `Você é um gestor sênior de tráfego pago com 10+ anos de experiência no mercado digital brasileiro, especialista em Meta Ads e Google Ads. Já gerenciou mais de R$50M em investimento para centenas de empresas de diferentes nichos.

Você vai gerar INTELIGÊNCIA DE MERCADO para este cliente — não ideias genéricas de conteúdo. Sua análise combina:
- Comportamento de mercado e tendências do nicho
- Oportunidades de audiência não exploradas
- Estratégias de escala baseadas em dados reais
- Análise competitiva e posicionamento
- Alocação inteligente de orçamento

REGRAS — siga obrigatoriamente:
1. Cada seção deve ter dados QUANTITATIVOS (%) não apenas afirmações
2. Cite o nicho "${niche}" especificamente — nada genérico
3. Use o histórico real para identificar padrões, não apenas projetar
4. Seja tão direto quanto um relatório de R$5.000/hora

=== DADOS DO CLIENTE ===
Cliente: ${clientName}
Nicho: ${niche}
Budget: R$${(budget || 0).toLocaleString('pt-BR')}/mês
Objetivo: ${objective || 'Gerar leads qualificados'}
CPL atual: ${currentCPL ? `R$${currentCPL}` : 'Não informado'}
CPL máximo lucrativo: R$${maxCPL}
Maior desafio: ${mainChallenge || 'Não informado'}
Ticket médio: R$${ticket}
Margem bruta: ${(margin * 100).toFixed(0)}%

=== HISTÓRICO DE CAMPANHAS ===
${historyCtx}

=== DADOS DA ÚLTIMA AUDITORIA ===
${auditCtx}

=== CANAIS RECOMENDADOS ===
${strategy?.recommended_channels_names?.join(', ') || bench?.best_channels?.join(', ') || 'Meta Ads, Google Ads'}

${benchmarkText ? `=== BENCHMARK DO NICHO (${niche}) ===\n${benchmarkText}` : ''}

=== INTELIGÊNCIA DE MERCADO OBRIGATÓRIA ===
Gere EXATAMENTE 6 seções de inteligência, cada uma com foco diferente. Responda APENAS com JSON válido:
{
  "inteligencia": [
    {
      "tipo": "oportunidade_mercado",
      "icone": "🎯",
      "titulo": "<oportunidade específica não explorada com potencial percentual>",
      "categoria": "Mercado",
      "categoriaColor": "#F0B429",
      "insight": "<o que está acontecendo no mercado de ${niche} agora que cria uma janela de oportunidade>",
      "dados": "<3 métricas ou percentuais que suportam o insight — ex: 'CPL cai 30% em X período'>",
      "acao_concreta": "<o que fazer nos próximos 7 dias para capturar esta oportunidade>",
      "potencial": "<resultado esperado em % ou R$ com este nicho especificamente>"
    },
    {
      "tipo": "audiencia_avancada",
      "icone": "👥",
      "titulo": "<segmento de audiência subexplorado com maior intenção de compra>",
      "categoria": "Audiência",
      "categoriaColor": "#22C55E",
      "insight": "<comportamento de compra do público de ${niche} que poucos gestores exploram>",
      "dados": "<dados de comportamento: horários, dispositivos, gatilhos de compra específicos do nicho>",
      "acao_concreta": "<como criar a audiência e testá-la — passo a passo>",
      "potencial": "<impacto esperado no CPL e volume de leads>"
    },
    {
      "tipo": "alocacao_orcamento",
      "icone": "💰",
      "titulo": "<redistribuição de orçamento que maximiza ROAS — com % específico>",
      "categoria": "Orçamento",
      "categoriaColor": "#38BDF8",
      "insight": "<análise de onde o orçamento atual está subperformando vs onde está em excesso>",
      "dados": "<alocação recomendada: Canal A X%, Canal B Y%, Remarketing Z% — com CPL esperado por canal>",
      "acao_concreta": "<como redistribuir o R$${budget || 5000} de forma otimizada>",
      "potencial": "<redução de CPL esperada e aumento de leads com mesmo budget>"
    },
    {
      "tipo": "analise_competitiva",
      "icone": "🔍",
      "titulo": "<estratégia competitiva diferenciada para ${niche} que gera vantagem>",
      "categoria": "Competição",
      "categoriaColor": "#A78BFA",
      "insight": "<o que os concorrentes do nicho ${niche} geralmente erram que cria abertura>",
      "dados": "<comportamento típico de anunciantes do nicho vs o que realmente converte — dados de benchmark>",
      "acao_concreta": "<como diferenciar o posicionamento e capturar a demanda dos concorrentes>",
      "potencial": "<ganho de market share estimado e impacto no CPL vs concorrência>"
    },
    {
      "tipo": "escala_inteligente",
      "icone": "📈",
      "titulo": "<estratégia de escala sem queimar budget — fase por fase>",
      "categoria": "Escala",
      "categoriaColor": "#FB923C",
      "insight": "<o que precisa estar funcionando antes de escalar — sinal de que o modelo está pronto>",
      "dados": "<métricas-gatilho para escalar: CPL < R$X por N dias consecutivos, CVR > Y%, etc.>",
      "acao_concreta": "<plano de escala em 3 fases: semanas 1-2, semanas 3-4, mês 2+>",
      "potencial": "<projeção de leads e receita ao executar o plano de escala>"
    },
    {
      "tipo": "criativo_estrategico",
      "icone": "🎨",
      "titulo": "<ângulo criativo mais eficiente para ${niche} baseado em psicologia do consumidor>",
      "categoria": "Criativo",
      "categoriaColor": "#EC4899",
      "insight": "<o que move o público de ${niche} a agir — medo, desejo, status, urgência ou transformação?>",
      "dados": "<CTR esperado por tipo de gancho, formato que converte mais (vídeo/imagem/carrossel) no nicho>",
      "acao_concreta": "<brief do próximo criativo: gancho, proposta de valor, CTA e formato>",
      "potencial": "<aumento de CTR e redução de CPL com criativos otimizados para o nicho>"
    }
  ]
}`

    // Aguarda Tavily (até 6s) antes de chamar Claude — dados reais enriquecem a análise
    const realtimeData = await Promise.race([
      realtimeDataPromise,
      new Promise<string>(res => setTimeout(() => res(''), 6000)),
    ])
    const enrichedPrompt = realtimeData
      ? prompt.replace(
          '=== INTELIGÊNCIA DE MERCADO OBRIGATÓRIA ===',
          `=== DADOS DE MERCADO EM TEMPO REAL (CPL/ROAS por canal) ===\n${realtimeData}\n\n=== INTELIGÊNCIA DE MERCADO OBRIGATÓRIA ===`
        )
      : prompt

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 6000,
      messages: [{ role: 'user', content: enrichedPrompt }],
    })

    const raw = (message.content[0] as any).text.trim()
    const jsonStr = raw.startsWith('```') ? raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '') : raw

    let data: any
    try {
      data = JSON.parse(jsonStr)
    } catch {
      // Tenta recuperar JSON truncado: busca o último objeto completo
      const lastBrace = jsonStr.lastIndexOf('}')
      const lastBracket = jsonStr.lastIndexOf(']')
      const cutAt = Math.max(lastBrace, lastBracket)
      if (cutAt > 100) {
        try {
          // Fecha a estrutura esperada: {"inteligencia": [...]}
          const partial = jsonStr.slice(0, cutAt + 1)
          const repaired = partial.endsWith(']}') ? partial
            : partial.endsWith('}')  ? partial + ']}'
            : partial + '}]}'
          data = JSON.parse(repaired)
        } catch {
          throw new Error('Resposta da IA com JSON inválido — tente novamente.')
        }
      } else {
        throw new Error('Resposta da IA com JSON inválido — tente novamente.')
      }
    }

    return NextResponse.json({ success: true, inteligencia: data.inteligencia, source: 'ai' })

  } catch (error: any) {
    console.error('Intelligence route error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
