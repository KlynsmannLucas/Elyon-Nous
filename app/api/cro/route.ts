// app/api/cro/route.ts — CRO Agent: otimização de conversão baseada em dados reais
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getBenchmark } from '@/lib/niche_benchmarks'
import { sanitizeText } from '@/lib/sanitize'
import { gateAndCharge, refundGate } from '@/lib/gate'
import { safeExtractJson } from '@/lib/aiJson'

interface CRORecommendation {
  priority: 'urgent' | 'high' | 'medium' | 'low'
  area: 'landing_page' | 'creative' | 'audience' | 'funnel' | 'bid' | 'budget' | 'copy'
  title: string
  problem: string
  solution: string
  expectedImpact: string
  estimatedCPLReduction?: number // em %
  effort: 'baixo' | 'médio' | 'alto'
  timeframe: string
}

interface CROAnalysis {
  score: number // 0-100 — quanto otimizado está o funil
  grade: 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D'
  summary: string
  bottleneck: string // principal gargalo do funil
  recommendations: CRORecommendation[]
  quickWins: string[] // ações imediatas de baixo esforço
  estimatedCPLWithOptimization: number | null
}

function buildFallbackCRO(
  clientData: any,
  niche: string,
  realMetrics: any,
  funnelData: any[],
): CROAnalysis {
  const bench = getBenchmark(niche)
  const benchCPLMin = bench?.cpl_min ?? 30
  const benchCPLMax = bench?.cpl_max ?? 120
  const benchCTR = 1.0

  const spend = realMetrics?.totalSpend ?? 0
  const leads = realMetrics?.totalLeads ?? 0
  const clicks = realMetrics?.totalClicks ?? 0
  const impressions = realMetrics?.totalImpressions ?? 0
  const cpl = realMetrics?.avgCPL ?? clientData?.currentCPL ?? 0
  const ctr = realMetrics?.avgCTR ?? 0
  const roas = realMetrics?.avgROAS ?? 0

  const clickToLeadRate = clicks > 0 && leads > 0 ? (leads / clicks) * 100 : null
  const benchClickToLead = 15 // 15% é um bom benchmark para landing pages de leads

  const recs: CRORecommendation[] = []
  let score = 70

  // ── CTR analysis ─────────────────────────────────────────────────────────
  if (ctr > 0 && ctr < benchCTR * 0.5) {
    score -= 15
    recs.push({
      priority: 'urgent',
      area: 'creative',
      title: 'CTR crítico — criativos não atraem cliques',
      problem: `CTR de ${ctr.toFixed(2)}% está ${((1 - ctr / benchCTR) * 100).toFixed(0)}% abaixo do benchmark (${benchCTR}%). Os anúncios não estão chamando atenção suficiente para gerar cliques.`,
      solution: 'Teste 3–5 novos hooks nos primeiros 3 segundos do vídeo/imagem. Use números específicos, perguntas provocativas e provas sociais visíveis. A melhor prática é testar ângulos diferentes: problema → solução, prova social → oferta, comparação → benefício.',
      expectedImpact: 'CTR acima de 1% pode reduzir CPL em 30–50%.',
      estimatedCPLReduction: 35,
      effort: 'médio',
      timeframe: '7–14 dias',
    })
  } else if (ctr > 0 && ctr < benchCTR) {
    score -= 8
    recs.push({
      priority: 'high',
      area: 'creative',
      title: 'CTR abaixo do ideal',
      problem: `CTR de ${ctr.toFixed(2)}% tem espaço para melhorar (meta: ${benchCTR}%+).`,
      solution: 'Teste variações de título e imagem de destaque. Adicione mais urgência ou especificidade na chamada principal.',
      expectedImpact: 'Melhora de CTR de 1pp pode reduzir CPL em ~20%.',
      estimatedCPLReduction: 20,
      effort: 'baixo',
      timeframe: '5–10 dias',
    })
  }

  // ── Click-to-lead rate (landing page conversion) ─────────────────────────
  if (clickToLeadRate !== null) {
    if (clickToLeadRate < 5) {
      score -= 20
      recs.push({
        priority: 'urgent',
        area: 'landing_page',
        title: 'Taxa de conversão da landing page crítica',
        problem: `Apenas ${clickToLeadRate.toFixed(1)}% dos cliques viram leads. Benchmark: 10–20%. Isso significa que a landing page está desperdiçando a maior parte do tráfego pago.`,
        solution: 'Audite a landing page: (1) O formulário pede muitos campos? Reduza para nome + WhatsApp. (2) A proposta de valor está clara nos primeiros 5 segundos? (3) Tem prova social (depoimentos, números, selos)? (4) O CTA é específico e urgente? (5) A página carrega em menos de 3 segundos no mobile?',
        expectedImpact: 'Dobrar a taxa de conversão da landing page = CPL cai pela metade.',
        estimatedCPLReduction: 50,
        effort: 'alto',
        timeframe: '14–21 dias',
      })
    } else if (clickToLeadRate < 10) {
      score -= 10
      recs.push({
        priority: 'high',
        area: 'landing_page',
        title: 'Landing page com conversão abaixo do potencial',
        problem: `Taxa click → lead de ${clickToLeadRate.toFixed(1)}%. Benchmark: 15%+.`,
        solution: 'Simplifique o formulário, adicione urgência (vagas limitadas, prazo) e reforce a proposta de valor acima da dobra.',
        expectedImpact: 'Melhorar conversão de 10% → 15% = CPL cai 33%.',
        estimatedCPLReduction: 33,
        effort: 'médio',
        timeframe: '10–14 dias',
      })
    }
  }

  // ── CPL vs benchmark ─────────────────────────────────────────────────────
  if (cpl > 0 && cpl > benchCPLMax) {
    score -= 12
    recs.push({
      priority: 'high',
      area: 'audience',
      title: 'CPL acima do benchmark — revisar segmentação',
      problem: `CPL de R$${cpl} está acima do teto do nicho (R$${benchCPLMax}). Pode indicar público muito amplo, interesse errado ou exclusões insuficientes.`,
      solution: 'Crie públicos lookalike 1–3% baseados em seus melhores leads/clientes. Exclua visitantes que não converteram após 30 dias. Teste segmentação por comportamento de compra ao invés de interesses amplos.',
      expectedImpact: `Redução esperada de CPL para a faixa R$${benchCPLMin}–R$${benchCPLMax}.`,
      estimatedCPLReduction: Math.round(((cpl - benchCPLMax) / cpl) * 100),
      effort: 'médio',
      timeframe: '7–14 dias',
    })
  }

  // ── Funnel analysis ────────────────────────────────────────────────────
  if (funnelData && funnelData.length > 0) {
    const latest = funnelData[funnelData.length - 1]
    const q2lRate = latest.leads > 0 ? (latest.qualifiedLeads / latest.leads) * 100 : null
    const l2sRate = latest.qualifiedLeads > 0 ? (latest.sales / latest.qualifiedLeads) * 100 : null

    if (q2lRate !== null && q2lRate < 30) {
      score -= 8
      recs.push({
        priority: 'medium',
        area: 'funnel',
        title: 'Taxa de qualificação de leads baixa',
        problem: `Apenas ${q2lRate.toFixed(1)}% dos leads são qualificados. Isso eleva o custo por venda.`,
        solution: 'Implemente qualificação automática por WhatsApp: perguntas de filtro antes de agendar. Ajuste a segmentação para atrair leads mais qualificados (renda, interesse específico).',
        expectedImpact: 'Qualificação de 30%+ reduz CAC e sobrecarga da equipe de vendas.',
        effort: 'médio',
        timeframe: '14–30 dias',
      })
    }

    if (l2sRate !== null && l2sRate < 10) {
      score -= 8
      recs.push({
        priority: 'medium',
        area: 'funnel',
        title: 'Taxa de fechamento abaixo do potencial',
        problem: `Taxa lead qualificado → venda de ${l2sRate?.toFixed(1)}%. Benchmark: 15–25%.`,
        solution: 'Analise os objeções mais comuns e crie scripts de follow-up. Implemente sequência de nurturing por WhatsApp (3–5 touchpoints nos primeiros 7 dias após o lead).',
        expectedImpact: 'Taxa de fechamento de 20% = 2x mais vendas com mesmo orçamento.',
        effort: 'alto',
        timeframe: '30–45 dias',
      })
    }
  }

  // ── Sem funil de retargeting ──────────────────────────────────────────────
  if (spend > 1000 && leads > 0) {
    recs.push({
      priority: 'medium',
      area: 'audience',
      title: 'Implementar funil de retargeting',
      problem: 'A maioria dos visitantes não converte na primeira visita. Sem retargeting, esse tráfego é perdido.',
      solution: 'Crie 3 audiências de retargeting: (1) Visitaram a LP mas não preencheram (últimos 7 dias), (2) Assistiram 50%+ do vídeo do anúncio (últimos 14 dias), (3) Engajaram com o perfil (últimos 30 dias). Mostre anúncios específicos para cada grupo.',
      expectedImpact: 'Retargeting bem feito pode capturar 20–40% de leads adicionais sem aumentar orçamento.',
      effort: 'médio',
      timeframe: '7–10 dias',
    })
  }

  // ── Quick wins ──────────────────────────────────────────────────────────
  const quickWins: string[] = [
    'Ative a otimização de orçamento da campanha (CBO) nas campanhas com mais de 3 conjuntos.',
    `Pause campanhas com CPL acima de R$${Math.round(benchCPLMax * 1.5)} e redistribua o orçamento.`,
    'Adicione extensões de sitelink e callout nos anúncios do Google Ads.',
    'Configure o evento de lead com valor estimado (R$ por lead) para treinar melhor o algoritmo.',
    'Crie um anúncio de prova social com depoimentos reais de clientes — geralmente supera criativos institucionais.',
  ]

  // Score final
  score = Math.max(20, Math.min(95, score))
  const grade = score >= 85 ? 'A' : score >= 72 ? 'B+' : score >= 58 ? 'B' : score >= 45 ? 'C+' : score >= 30 ? 'C' : 'D'

  // Gargalo principal
  let bottleneck = 'Análise insuficiente de dados — execute a auditoria Meta Ads'
  if (ctr > 0 && ctr < 0.5) bottleneck = `CTR crítico (${ctr.toFixed(2)}%) — criativo não converte`
  else if (clickToLeadRate !== null && clickToLeadRate < 5) bottleneck = `Landing page com conversão de ${clickToLeadRate.toFixed(1)}% — principal desperdício de verba`
  else if (cpl > benchCPLMax * 1.5) bottleneck = `CPL ${((cpl / benchCPLMax - 1) * 100).toFixed(0)}% acima do teto — segmentação ou oferta precisam de ajuste`
  else if (recs.length === 0) bottleneck = 'Funil bem otimizado — foco em escala e testes de ângulos criativos'

  const estimatedCPL = cpl > 0 && recs.length > 0
    ? Math.round(cpl * (1 - (recs.reduce((s, r) => s + (r.estimatedCPLReduction ?? 0), 0) / 100 * 0.4)))
    : null

  return {
    score,
    grade,
    summary: score >= 70
      ? `Funil com boa base — ${recs.length} otimizações identificadas para reduzir CPL.`
      : `Funil com ${recs.filter(r => r.priority === 'urgent').length} pontos críticos que estão aumentando o CPL significativamente.`,
    bottleneck,
    recommendations: recs.sort((a, b) => {
      const order = { urgent: 0, high: 1, medium: 2, low: 3 }
      return order[a.priority] - order[b.priority]
    }),
    quickWins,
    estimatedCPLWithOptimization: estimatedCPL,
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
      clientData = {},
      niche = clientData.niche || '',
      realMetrics = null,
      funnelData = [],
      auditSections = null,
    } = body

    const sanitizedNiche = sanitizeText(niche)

    // Tenta gerar com IA se disponível
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (apiKey && (realMetrics || funnelData.length > 0)) {
      const croGate = await gateAndCharge('cro')
      if (croGate.ok) {
      try {
        const { default: Anthropic } = await import('@anthropic-ai/sdk')
        const anthropic = new Anthropic({ apiKey })
        const bench = getBenchmark(sanitizedNiche)

        const prompt = `Você é um especialista sênior em CRO (Conversion Rate Optimization) para tráfego pago no Brasil.

DADOS DO CLIENTE:
Nicho: ${sanitizedNiche}
Budget: R$${clientData.budget || '?'}/mês
CPL atual: R$${realMetrics?.avgCPL || clientData.currentCPL || '?'}
Benchmark do nicho: R$${bench?.cpl_min}–R$${bench?.cpl_max}

MÉTRICAS REAIS:
${realMetrics ? `
- Gasto total: R$${realMetrics.totalSpend}
- Leads: ${realMetrics.totalLeads}
- Cliques: ${realMetrics.totalClicks}
- Impressões: ${realMetrics.totalImpressions?.toLocaleString('pt-BR')}
- CTR médio: ${realMetrics.avgCTR}%
- CPL médio: R$${realMetrics.avgCPL}
- ROAS: ${realMetrics.avgROAS}×
` : 'Sem dados de métricas reais.'}

AUDITORIA (resumo por seção):
${auditSections ? JSON.stringify(auditSections, null, 2).slice(0, 2000) : 'Sem dados de auditoria.'}

Com base nesses dados, gere uma análise de CRO detalhada e acionável. Use a ferramenta emit_cro.

REGRAS DE QUALIDADE (obrigatórias):
- Cada recomendação deve ser ESPECÍFICA pra este cliente. PROIBIDO conselho genérico ("melhore o criativo", "otimize a landing", "conheça seu público", "poste com consistência").
- No campo "problem", cite a EVIDÊNCIA real (a métrica/sinal que comprova): ex. "CTR 0,7% vs 1,4% da média da conta", "CPL R$${realMetrics?.avgCPL || '?'} acima do benchmark". Se não houver métrica real pra sustentar, não invente o problema.
- No "solution", diga a ação exata (o quê mudar, como), não a direção vaga.`

        const msg = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 2500,
          tools: [{
            name: 'emit_cro',
            description: 'Retorna a análise de CRO (Conversion Rate Optimization) estruturada.',
            input_schema: {
              type: 'object',
              properties: {
                score: { type: 'number', description: '0-100' },
                grade: { type: 'string', enum: ['A', 'B+', 'B', 'C+', 'C', 'D'] },
                summary: { type: 'string', description: 'resumo de 1-2 frases' },
                bottleneck: { type: 'string', description: 'principal gargalo do funil em 1 frase' },
                recommendations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      priority: { type: 'string', enum: ['urgent', 'high', 'medium', 'low'] },
                      area: { type: 'string', enum: ['landing_page', 'creative', 'audience', 'funnel', 'bid', 'budget', 'copy'] },
                      title: { type: 'string' },
                      problem: { type: 'string' },
                      solution: { type: 'string', description: 'solução concreta e acionável' },
                      expectedImpact: { type: 'string' },
                      estimatedCPLReduction: { type: 'number', description: 'em %' },
                      effort: { type: 'string', enum: ['baixo', 'médio', 'alto'] },
                      timeframe: { type: 'string', description: 'ex: 7-14 dias' },
                    },
                    required: ['priority', 'area', 'title', 'problem', 'solution'],
                  },
                },
                quickWins: { type: 'array', items: { type: 'string' }, description: '3 ações rápidas' },
                estimatedCPLWithOptimization: { type: 'number', description: 'CPL estimado pós-otimização (omita se não der pra estimar)' },
              },
              required: ['score', 'grade', 'summary', 'recommendations', 'quickWins'],
            },
          }],
          tool_choice: { type: 'tool', name: 'emit_cro' },
          messages: [{ role: 'user', content: prompt }],
        })

        const parsed = (msg.content as any[]).find((b: any) => b.type === 'tool_use')?.input
        if (parsed?.recommendations) {
          return NextResponse.json({ cro: parsed, source: 'ai' })
        }
        await refundGate(croGate, 'cro')
      } catch (err) {
        await refundGate(croGate, 'cro')
        console.error('[cro] AI error, falling back:', err)
      }
      }
    }

    // Fallback estruturado
    const fallback = buildFallbackCRO(clientData, sanitizedNiche, realMetrics, funnelData)
    return NextResponse.json({ cro: fallback, source: 'fallback' })

  } catch (err) {
    console.error('[cro] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
