// app/api/diagnostic/route.ts — Diagnóstico estratégico de negócio (distinto da Auditoria de campanhas)
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getBenchmarkSummary, getBenchmark } from '@/lib/niche_benchmarks'

// ── Fallback estruturado quando IA indisponível ──────────────────────────────
function buildFallbackDiagnostic(params: {
  clientName: string
  niche: string
  budget: number
  monthlyRevenue: number
  ticketPrice?: number
  grossMargin?: number
  conversionRate?: number
  isRecurring?: boolean
  currentCPL?: number
  mainChallenge?: string
  bench: NonNullable<ReturnType<typeof getBenchmark>>
  campaignHistory: any[]
}) {
  const { clientName, niche, budget, monthlyRevenue, ticketPrice, grossMargin,
    conversionRate, isRecurring, currentCPL, bench, campaignHistory } = params

  const margin = (grossMargin || 40) / 100
  const cvr = (conversionRate || bench.cvr_lead_to_sale * 100) / 100
  const ticket = ticketPrice || bench.avg_ticket
  const cplBench = Math.round((bench.cpl_min + bench.cpl_max) / 2)
  const cplReal = currentCPL || cplBench
  const cplEfficiency = ((cplBench - cplReal) / cplBench) * 100
  const breakEvenROAS = margin > 0 ? +(1 / margin).toFixed(2) : 2.5
  const maxCPL = cvr > 0 ? Math.round(ticket * margin * cvr) : cplBench
  const ltv = isRecurring ? Math.round(ticket / 0.05 * margin) : Math.round(ticket * margin)
  const cacPayback = maxCPL > 0 ? +(maxCPL / (ticket * margin)).toFixed(1) : 1
  const ltvCacRatio = maxCPL > 0 ? +(ltv / maxCPL).toFixed(1) : 3
  const revenueFromAds = budget > 0 ? Math.round(budget * breakEvenROAS * 1.2) : 0

  const healthScore = Math.min(100, Math.max(20,
    60
    + (cplReal <= bench.cpl_min ? 15 : cplReal <= bench.cpl_max ? 8 : -10)
    + (ltvCacRatio >= 3 ? 10 : ltvCacRatio >= 2 ? 5 : -5)
    + (campaignHistory.length >= 3 ? 10 : campaignHistory.length >= 1 ? 5 : 0)
    + (monthlyRevenue > budget * 5 ? 5 : 0)
  ))
  const grade = healthScore >= 85 ? 'A' : healthScore >= 72 ? 'B+' : healthScore >= 58 ? 'B' : healthScore >= 45 ? 'C+' : 'C'

  return {
    health_score: healthScore,
    grade,
    executive_summary: `${clientName} (${niche}) apresenta razão LTV:CAC de ${ltvCacRatio}× — ${ltvCacRatio >= 3 ? 'acima do mínimo saudável de 3×' : 'abaixo do ideal — modelo precisa otimização'}. Com budget de R$${budget.toLocaleString('pt-BR')}/mês e ticket médio de R$${ticket.toLocaleString('pt-BR')}, o ponto de break-even está em ROAS ${breakEvenROAS}×. ${cplReal <= bench.cpl_max ? 'CPL dentro do benchmark do nicho.' : `CPL ${Math.round(Math.abs(cplEfficiency))}% acima do benchmark — compressão de margem identificada.`}`,

    saude_financeira: {
      break_even_roas: breakEvenROAS,
      cpl_maximo_lucrativo: maxCPL,
      ltv_estimado: ltv,
      cac_payback_meses: cacPayback,
      ltv_cac_ratio: ltvCacRatio,
      receita_estimada_ads: revenueFromAds,
      sustentabilidade: ltvCacRatio >= 3 ? 'sustentavel' : ltvCacRatio >= 1.5 ? 'fragil' : 'insustentavel',
      interpretacao: `ROAS break-even de ${breakEvenROAS}× significa que cada R$1 investido precisa retornar R$${breakEvenROAS} para cobrir os custos. Com CPL máximo lucrativo de R$${maxCPL} e payback de ${cacPayback} ${isRecurring ? 'meses' : 'vendas'}, o modelo ${ltvCacRatio >= 3 ? 'é saudável para escalar' : 'precisa otimização antes de escalar'}. LTV:CAC de ${ltvCacRatio}× (mínimo saudável = 3×).`,
    },

    matriz_risco: [
      {
        rank: 1,
        risco: currentCPL && currentCPL > bench.cpl_max ? `CPL R$${currentCPL} acima do máximo lucrativo R$${maxCPL}` : 'Tracking não auditado',
        probabilidade: currentCPL && currentCPL > bench.cpl_max ? 'alta' : 'media',
        impacto: 'critico',
        mitigacao: currentCPL && currentCPL > bench.cpl_max
          ? `Reduzir CPL para R$${Math.round(bench.cpl_max * 0.85)} — pausar campanhas com CPL > R$${bench.cpl_max}`
          : 'Auditar pixel e API de conversões — base de toda otimização',
      },
      {
        rank: 2,
        risco: campaignHistory.length < 2 ? 'Histórico insuficiente — otimização no escuro' : 'Dependência de canal único',
        probabilidade: 'media',
        impacto: 'alto',
        mitigacao: campaignHistory.length < 2
          ? 'Documentar resultados de cada período — mínimo 3 meses para identificar tendências'
          : `Diversificar para ${bench.best_channels[1] || 'Google Search'} — reduz risco de plataforma`,
      },
      {
        rank: 3,
        risco: 'Saturação de público sem rotação de criativos',
        probabilidade: 'media',
        impacto: 'medio',
        mitigacao: 'Ciclo de 15-21 dias para novos criativos — mínimo 3 variações simultâneas',
      },
    ],

    prontidao_para_escalar: {
      score: Math.min(100, healthScore + 5),
      pode_escalar_agora: healthScore >= 70 && ltvCacRatio >= 2.5,
      prerequisitos_faltando: [
        ...(campaignHistory.length < 2 ? ['Histórico de pelo menos 2–3 meses de campanhas documentado'] : []),
        ...(ltvCacRatio < 3 ? [`LTV:CAC precisa chegar a 3× (atual ${ltvCacRatio}×) — otimizar conversão ou aumentar ticket`] : []),
        ...(!grossMargin ? ['Definir margem bruta real para calcular break-even preciso'] : []),
      ],
      quando_escalar: healthScore >= 70
        ? 'Pronto para aumentar 20-30% do budget por semana mantendo CPL no benchmark'
        : 'Estabilizar CPL e documentar CVR lead→venda antes de escalar — escalar o errado amplifica prejuízo',
      projecao_escala: budget > 0 ? {
        budget_2x: budget * 2,
        leads_projetados: Math.round((budget * 2) / (currentCPL || cplBench)),
        receita_projetada: Math.round((budget * 2) / (currentCPL || cplBench) * cvr * ticket),
      } : null,
    },

    diagnostico_funil: {
      etapas: [
        { etapa: 'Tráfego → Clique', status: 'nao_auditado', observacao: 'Analisar CTR por campanha — benchmark do nicho é 1-3%' },
        { etapa: 'Clique → Lead', status: cplReal <= bench.cpl_max ? 'saudavel' : 'problema', observacao: `CPL R$${cplReal} vs benchmark R$${bench.cpl_min}-${bench.cpl_max}` },
        { etapa: 'Lead → Atendimento', status: 'nao_auditado', observacao: 'SLA de 5 minutos aumenta conversão em 3× — medir tempo de resposta' },
        { etapa: 'Atendimento → Venda', status: 'nao_auditado', observacao: `CVR médio do nicho: ${(bench.cvr_lead_to_sale * 100).toFixed(0)}% — comparar com taxa real` },
      ],
      gargalo_principal: cplReal > bench.cpl_max ? 'trafego' : 'pos-clique',
      impacto_financeiro: cplReal > bench.cpl_max
        ? `Cada R$1.000 investido gera ${Math.floor(1000 / cplReal)} leads vs ${Math.floor(1000 / bench.cpl_max)} no benchmark — ${Math.floor(1000 / bench.cpl_max) - Math.floor(1000 / cplReal)} leads perdidos por R$1k`
        : `Custo de aquisição no benchmark — foco em aumentar taxa lead→venda (${(cvr * 100).toFixed(0)}% atual)`,
    },

    recomendacao_principal: {
      titulo: ltvCacRatio < 3
        ? 'Aumentar LTV ou Reduzir CAC — o modelo não escala com a economia atual'
        : cplReal > bench.cpl_max
          ? 'Auditoria imediata das campanhas com CPL acima do break-even'
          : `Escalar ${bench.best_channels[0]} com CPL < R$${bench.cpl_max}`,
      descricao: ltvCacRatio < 3
        ? `Com LTV:CAC de ${ltvCacRatio}×, para cada R$${maxCPL} gasto em aquisição, o retorno é R$${ltv} — abaixo do mínimo saudável de 3×. Prioridade: aumentar ticket médio de R$${ticket} em 20% ou reduzir CPL para R$${Math.round(maxCPL * 0.7)}.`
        : `Com a economia atual, escalar de R$${budget.toLocaleString('pt-BR')} para R$${(budget * 2).toLocaleString('pt-BR')}/mês projeta ${Math.round((budget * 2) / (currentCPL || cplBench))} leads e receita de R$${Math.round((budget * 2) / (currentCPL || cplBench) * cvr * ticket).toLocaleString('pt-BR')}/mês.`,
      acao_semana_1: 'Auditar tracking (pixel + API conversões) e documentar CPL e CVR reais por canal',
      acao_mes_1: `Otimizar campanhas para CPL < R$${Math.round(bench.cpl_max * 0.85)} e documentar lead→venda`,
      acao_trimestre: ltvCacRatio >= 3 ? `Escalar budget 20%/semana até R$${budget * 3} mantendo CPL no benchmark` : 'Reestruturar modelo de precificação ou processo de conversão',
    },

    benchmark_comparativo: {
      cpl_atual: cplReal,
      cpl_benchmark: cplBench,
      cpl_status: cplReal <= bench.cpl_min ? 'excelente' : cplReal <= bench.cpl_max ? 'bom' : 'critico',
      roas_break_even: breakEvenROAS,
      roas_bom_nicho: bench.kpi_thresholds.roas_good,
      melhores_canais: bench.best_channels,
      insights_nicho: bench.insights,
    },

    generated_at: new Date().toISOString(),
  }
}

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const body = await req.json()
    const {
      clientName, niche, budget = 0, monthlyRevenue = 0,
      ticketPrice, grossMargin, conversionRate, isRecurring,
      currentCPL, mainChallenge, currentLeadSource,
      campaignHistory = [],
      auditRealMetrics = null,   // dados reais da última auditoria, se disponível
    } = body

    const bench = getBenchmark(niche)
    const benchmarkText = getBenchmarkSummary(niche)

    const margin = (grossMargin || 40) / 100
    const cvr    = (conversionRate || (bench?.cvr_lead_to_sale || 0.1) * 100) / 100
    const ticket = ticketPrice || bench?.avg_ticket || 1000
    const breakEvenROAS = margin > 0 ? +(1 / margin).toFixed(2) : 2.5
    const maxCPL = cvr > 0 ? Math.round(ticket * margin * cvr) : 0
    const ltv    = isRecurring ? Math.round(ticket / 0.05 * margin) : Math.round(ticket * margin)
    const ltvCacRatio = maxCPL > 0 ? +(ltv / maxCPL).toFixed(1) : 3

    // Histórico de campanhas para contexto
    const historyCtx = campaignHistory.length > 0
      ? campaignHistory.slice(0, 10).map((c: any) =>
          `• ${c.period} | ${c.channel} | Gasto: R$${c.budgetSpent} | Leads: ${c.leads} | CPL: R$${c.cplReal} | Vendas: ${c.conversions} | ${c.outcome?.toUpperCase()}`
        ).join('\n')
      : 'Sem histórico registrado — análise baseada em projeções do benchmark.'

    // Dados reais de auditoria (se existirem)
    const auditCtx = auditRealMetrics
      ? `Última auditoria: CPL médio R$${auditRealMetrics.avgCPL} | Leads: ${auditRealMetrics.totalLeads} | Investimento: R$${auditRealMetrics.totalSpend} | Campanhas: ${auditRealMetrics.campaignCount}`
      : 'Sem auditoria de campanhas disponível.'

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (apiKey) {
      try {
        const { default: Anthropic } = await import('@anthropic-ai/sdk')
        const anthropic = new Anthropic({ apiKey })

        const prompt = `Você é um gestor sênior de tráfego pago com 10+ anos de experiência gerindo campanhas para empresas de pequeno e médio porte no mercado digital brasileiro. Já gerenciou mais de R$50M em investimento publicitário em dezenas de nichos diferentes. Você pensa como CFO + CMO simultaneamente — une estratégia de negócio com execução de mídia paga.

SEU PAPEL AQUI: Fazer um DIAGNÓSTICO ESTRATÉGICO DO NEGÓCIO — não das campanhas (isso é a auditoria). Você responde:
1. O modelo de aquisição é financeiramente sustentável? (LTV:CAC, break-even, margem)
2. O negócio está pronto para escalar investimento? (pré-requisitos, riscos)
3. Quais são os riscos que podem destruir o ROI? (matriz de risco priorizada)
4. Qual é a trajetória projetada se mantiver o atual? (tendência)
5. O que precisa mudar agora para destravar crescimento? (uma recomendação principal)

REGRAS — siga obrigatoriamente:
1. Use NÚMEROS REAIS do cliente — nada genérico
2. Calcule LTV:CAC, break-even ROAS, CPL máximo lucrativo
3. Projete cenários: atual vs. otimizado vs. escala
4. Identifique o gargalo MAIS CRÍTICO que está limitando crescimento
5. Seja direto como um consultor que cobra R$500/hora — sem enrolação

=== DADOS DO CLIENTE ===
Cliente: ${clientName}
Nicho: ${niche}
Budget mensal: R$${budget.toLocaleString('pt-BR')}
Faturamento mensal atual: R$${monthlyRevenue.toLocaleString('pt-BR')}
CPL atual informado: ${currentCPL ? `R$${currentCPL}` : 'Não informado'}
Maior desafio: ${mainChallenge || 'Não informado'}
Principal origem de leads: ${currentLeadSource || 'Não informado'}
Produto recorrente: ${isRecurring ? 'Sim' : 'Não'}

=== UNIT ECONOMICS ===
Ticket médio: R$${ticket}
Margem bruta: ${(margin * 100).toFixed(0)}%
Conversão lead→venda: ${(cvr * 100).toFixed(0)}%
ROAS break-even calculado: ${breakEvenROAS}×
CPL máximo lucrativo calculado: R$${maxCPL}
LTV estimado: R$${ltv}
LTV:CAC calculado: ${ltvCacRatio}×

=== HISTÓRICO DE CAMPANHAS ===
${historyCtx}

=== DADOS DA ÚLTIMA AUDITORIA ===
${auditCtx}

${benchmarkText ? `=== BENCHMARK DO NICHO (${niche}) ===\n${benchmarkText}` : ''}

=== DIAGNÓSTICO OBRIGATÓRIO ===
Responda APENAS com JSON válido. Seja específico, use os números calculados acima, interprete o que eles SIGNIFICAM para o negócio:

{
  "health_score": <0-100 baseado na saúde financeira e estratégica>,
  "grade": "<A+|A|A-|B+|B|B-|C+|C|D>",
  "executive_summary": "<2-3 frases executivas com os números mais críticos — LTV:CAC, CPL vs break-even, projeção de escala>",

  "saude_financeira": {
    "break_even_roas": ${breakEvenROAS},
    "cpl_maximo_lucrativo": ${maxCPL},
    "ltv_estimado": ${ltv},
    "cac_payback_meses": <meses para recuperar CAC>,
    "ltv_cac_ratio": ${ltvCacRatio},
    "sustentabilidade": "<sustentavel|fragil|insustentavel>",
    "interpretacao": "<o que esses números significam para a viabilidade do negócio — seja específico>"
  },

  "matriz_risco": [
    {
      "rank": 1,
      "risco": "<risco mais crítico com dados específicos>",
      "probabilidade": "<alta|media|baixa>",
      "impacto": "<critico|alto|medio|baixo>",
      "mitigacao": "<ação específica para mitigar>"
    }
  ],

  "prontidao_para_escalar": {
    "score": <0-100>,
    "pode_escalar_agora": <true|false>,
    "prerequisitos_faltando": ["<pré-requisito específico>"],
    "quando_escalar": "<quando e como aumentar o investimento>",
    "projecao_escala": {
      "budget_2x": ${budget * 2},
      "leads_projetados": <número>,
      "receita_projetada": <número>
    }
  },

  "diagnostico_funil": {
    "etapas": [
      {"etapa": "Tráfego → Clique", "status": "<saudavel|problema|nao_auditado>", "observacao": "<dado específico>"},
      {"etapa": "Clique → Lead", "status": "<saudavel|problema|nao_auditado>", "observacao": "<CPL vs break-even>"},
      {"etapa": "Lead → Atendimento", "status": "<saudavel|problema|nao_auditado>", "observacao": "<SLA e processo>"},
      {"etapa": "Atendimento → Venda", "status": "<saudavel|problema|nao_auditado>", "observacao": "<CVR real vs benchmark>"}
    ],
    "gargalo_principal": "<trafego|pos-clique|atendimento|ambos>",
    "impacto_financeiro": "<o que o gargalo está custando em R$ por mês>"
  },

  "recomendacao_principal": {
    "titulo": "<uma ação que muda tudo — específica e com número>",
    "descricao": "<por que esta ação supera todas as outras em ROI>",
    "acao_semana_1": "<o que fazer nos próximos 7 dias>",
    "acao_mes_1": "<o que executar no primeiro mês>",
    "acao_trimestre": "<posição no trimestre se executar corretamente>"
  },

  "benchmark_comparativo": {
    "cpl_atual": ${currentCPL || 0},
    "cpl_benchmark": <CPL médio do nicho>,
    "cpl_status": "<excelente|bom|atencao|critico>",
    "roas_break_even": ${breakEvenROAS},
    "roas_bom_nicho": <ROAS considerado bom para o nicho>,
    "melhores_canais": <array dos melhores canais do nicho>,
    "insights_nicho": <array dos insights principais do nicho>
  }
}`

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 3000,
          messages: [{ role: 'user', content: prompt }],
        })

        const raw = (message.content[0] as any).text.trim()
        const jsonStr = raw.startsWith('```') ? raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '') : raw
        const diagnostic = JSON.parse(jsonStr)
        diagnostic.generated_at = new Date().toISOString()
        return NextResponse.json({ success: true, diagnostic, source: 'ai' })

      } catch (aiError: any) {
        console.warn('Anthropic API falhou no diagnóstico, usando fallback:', aiError.message)
      }
    }

    if (!bench) {
      return NextResponse.json({ success: false, error: 'Nicho não reconhecido e API indisponível.' }, { status: 400 })
    }

    const diagnostic = buildFallbackDiagnostic({
      clientName, niche, budget, monthlyRevenue, ticketPrice, grossMargin,
      conversionRate, isRecurring, currentCPL, mainChallenge, bench, campaignHistory,
    })
    return NextResponse.json({ success: true, diagnostic, source: 'benchmark' })

  } catch (error: any) {
    console.error('Diagnostic route error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
