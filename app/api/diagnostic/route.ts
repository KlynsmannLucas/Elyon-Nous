// app/api/diagnostic/route.ts — Diagnóstico inteligente por nicho com fallback por benchmark
import { NextRequest, NextResponse } from 'next/server'
import { getBenchmarkSummary, getBenchmark } from '@/lib/niche_benchmarks'
import { buildNichePromptContext } from '@/lib/niche_prompts'

function buildFallbackDiagnostic(
  clientName: string,
  niche: string,
  score: number,
  bench: NonNullable<ReturnType<typeof getBenchmark>>,
  topChannel: Record<string, any>
) {
  const projCPL = topChannel.cpl_avg || Math.round((bench.cpl_min + bench.cpl_max) / 2)
  const cplStatus = projCPL <= bench.cpl_min * 1.1 ? 'Excelente'
    : projCPL <= bench.cpl_max ? 'Bom' : 'Atenção'
  const roasStatus = score >= 75 ? 'Bom' : score >= 50 ? 'Atenção' : 'Crítico'
  const grade = score >= 85 ? 'A' : score >= 70 ? 'B+' : score >= 55 ? 'B' : score >= 40 ? 'C+' : 'C'

  return {
    score,
    grade,
    summary: `A estratégia de ${clientName} está ${grade === 'A' || grade === 'B+' ? 'bem estruturada' : 'com oportunidades claras de melhora'} para o nicho ${niche}. CPL projetado de R$${projCPL} vs benchmark R$${bench.cpl_min}–${bench.cpl_max} do mercado.`,
    strengths: [
      { title: 'Nicho com benchmarks definidos', detail: `${bench.name} tem CPL médio de R$${bench.cpl_min}–${bench.cpl_max} — permite validar performance com dados reais.` },
      { title: 'Canais com histórico de conversão', detail: `${bench.best_channels.slice(0, 2).join(' e ')} são os canais mais eficientes para este nicho.` },
      { title: 'Budget com potencial de leads', detail: `Com o budget configurado, a projeção é de ${Math.round((topChannel.budget_brl || 3000) / projCPL)} leads/mês.` },
    ],
    weaknesses: [
      { title: 'Estratégia não testada em dados reais', detail: 'Sem histórico de campanha rodando, o ROAS e CPL são projeções — monitore as primeiras 2 semanas ativamente.' },
      { title: 'Ciclo de otimização não iniciado', detail: 'Os primeiros 30 dias são de aprendizado — espere variação de até 40% no CPL inicial.' },
    ],
    opportunities: [
      { title: `Escalar com ${bench.best_channels[0]}`, detail: `Canal principal do nicho. Alocar 40% do budget aqui para validação inicial.`, impact: 'Alto' },
      { title: 'Teste A/B de criativos', detail: `No nicho ${niche}, criativos específicos para dores do público aumentam CTR em 30-60%.`, impact: 'Alto' },
      { title: 'Remarketing para leads não convertidos', detail: `No nicho ${niche}, apenas 20-40% dos leads convertem na primeira interação — remarketing é essencial.`, impact: 'Médio' },
    ],
    immediate_actions: [
      { action: `Configurar pixel/tag em todos os canais planejados`, timeline: 'Esta semana', expected_result: 'Base para remarketing e otimização por evento' },
      { action: `Definir CPL máximo de R$${bench.cpl_max} como KPI de corte`, timeline: '1ª semana de campanha', expected_result: 'Pausar automaticamente grupos acima do benchmark' },
      { action: `Criar 3–5 criativos com dores específicas do público de ${niche}`, timeline: 'Antes de lançar', expected_result: 'CTR 40–60% maior vs criativos genéricos' },
      { action: 'Implementar contato em menos de 5 minutos após lead', timeline: 'Antes de lançar', expected_result: 'Taxa de conversão de lead para cliente 2× maior' },
    ],
    benchmark_comparison: {
      cpl_status: cplStatus,
      cpl_message: `CPL projetado R$${projCPL} vs benchmark do nicho R$${bench.cpl_min}–${bench.cpl_max}. ${cplStatus === 'Excelente' ? 'Eficiência acima da média.' : cplStatus === 'Bom' ? 'Dentro do esperado para o nicho.' : 'Acima do benchmark — revisar segmentação.'}`,
      roas_status: roasStatus,
      roas_message: `ROAS bom para ${niche} é acima de ${bench.kpi_thresholds.roas_good}×. ${roasStatus === 'Bom' ? 'Projeção dentro do esperado.' : 'Foco em otimização de conversão para atingir o benchmark.'}`,
    },
    benchmark: {
      cpl_min: bench.cpl_min,
      cpl_max: bench.cpl_max,
      roas_good: bench.kpi_thresholds.roas_good,
      cvr: bench.cvr_lead_to_sale,
      best_channels: bench.best_channels,
      insights: bench.insights,
    },
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clientName, niche, strategy, analysis, nicheDetails } = body

    const bench = getBenchmark(niche)
    const benchmarkText = getBenchmarkSummary(niche)
    const nicheContext = buildNichePromptContext(niche, nicheDetails || {})

    const topChannel = analysis?.priority_ranking?.[0] || {}
    const projCPL = topChannel.cpl_avg || 0
    const projLeads = topChannel.leads_min || 0
    const score = analysis?.intelligence_score || 70

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (apiKey) {
      try {
        const { default: Anthropic } = await import('@anthropic-ai/sdk')
        const anthropic = new Anthropic({ apiKey })

        const prompt = `Você é um consultor sênior de marketing digital especializado em diagnóstico de campanhas no mercado brasileiro.

CLIENTE: ${clientName}
NICHO: ${niche}
SCORE ATUAL DA ESTRATÉGIA: ${score}/100

ESTRATÉGIA ATUAL:
- Canal principal: ${topChannel.channel || 'Não definido'}
- CPL projetado: R$${projCPL}
- Leads esperados: ${projLeads}/mês
- Budget: R$${topChannel.budget_brl || 0}/mês

${benchmarkText ? `DADOS REAIS DO MERCADO:\n${benchmarkText}` : ''}
${nicheContext ? `\nCONTEXTO ESPECIALIZADO DO NICHO:${nicheContext}` : ''}

Gere um diagnóstico detalhado e específico para este nicho. Use SEMPRE os números do benchmark.
Responda APENAS com JSON válido:

{
  "score": ${score},
  "grade": "<A+|A|B+|B|C+|C|D>",
  "summary": "<resumo executivo em 2 frases com números reais>",
  "strengths": [
    {"title": "<ponto forte>", "detail": "<explicação com dados>"}
  ],
  "weaknesses": [
    {"title": "<fraqueza>", "detail": "<o que está sendo perdido em R$ ou %>"}
  ],
  "opportunities": [
    {"title": "<oportunidade>", "detail": "<ação concreta e resultado esperado>", "impact": "<Alto|Médio|Baixo>"}
  ],
  "immediate_actions": [
    {"action": "<ação>", "timeline": "<prazo>", "expected_result": "<resultado>"}
  ],
  "benchmark_comparison": {
    "cpl_status": "<Excelente|Bom|Atenção|Crítico>",
    "cpl_message": "<comparação com benchmark do nicho>",
    "roas_status": "<Excelente|Bom|Atenção|Crítico>",
    "roas_message": "<comparação com benchmark do nicho>"
  }
}`

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        })

        const raw = (message.content[0] as any).text.trim()
        const jsonStr = raw.startsWith('```')
          ? raw.split('```')[1].replace(/^json\n/, '')
          : raw

        const diagnostic = JSON.parse(jsonStr)

        if (bench) {
          diagnostic.benchmark = {
            cpl_min: bench.cpl_min,
            cpl_max: bench.cpl_max,
            roas_good: bench.kpi_thresholds.roas_good,
            cvr: bench.cvr_lead_to_sale,
            best_channels: bench.best_channels,
            insights: bench.insights,
          }
        }

        return NextResponse.json({ success: true, diagnostic, source: 'ai' })

      } catch (aiError: any) {
        console.warn('Anthropic API falhou no diagnóstico, usando fallback:', aiError.message)
      }
    }

    // Fallback por benchmark
    if (!bench) {
      return NextResponse.json(
        { success: false, error: 'Nicho não reconhecido e API indisponível.' },
        { status: 400 }
      )
    }

    const diagnostic = buildFallbackDiagnostic(clientName, niche, score, bench, topChannel)
    return NextResponse.json({ success: true, diagnostic, source: 'benchmark' })

  } catch (error: any) {
    console.error('Diagnostic route error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
