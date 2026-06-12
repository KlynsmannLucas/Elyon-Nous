// app/api/strategy/route.ts — Head de Growth: diagnóstico completo + funil + 360°
import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getBenchmark, getBenchmarkSummary } from '@/lib/niche_benchmarks'
import { buildNichePromptContext } from '@/lib/niche_prompts'
import { fetchRealtimeBenchmarks } from '@/lib/tavily'
import { sanitizeText } from '@/lib/sanitize'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

// CPL relativo por canal — multiplicadores sobre a média do nicho
const CHANNEL_CPL_MULT: Record<string, number> = {
  'Meta Ads':       1.00,
  'Facebook Ads':   1.00,
  'Instagram Ads':  1.10,
  'Google Ads':     1.35,
  'Google Search':  1.40,
  'Google PMAX':    1.20,
  'YouTube Ads':    0.85,
  'TikTok Ads':     0.90,
  'Pinterest Ads':  0.80,
  'LinkedIn Ads':   2.20,
  'WhatsApp':       0.55,
}

function channelCPL(channel: string, cplAvg: number) {
  const mult = CHANNEL_CPL_MULT[channel] ?? 1.0
  return {
    cpl_min: Math.round(cplAvg * mult * 0.80),
    cpl_max: Math.round(cplAvg * mult * 1.20),
    cpl_avg: Math.round(cplAvg * mult),
  }
}

// ── Classificação de maturidade da conta ─────────────────────────────────────────
function classifyMaturity(realSpend: number, realLeads: number): {
  stage: 'iniciante' | 'crescendo' | 'madura' | 'veterana'
  label: string; emoji: string; description: string
} {
  if (realSpend > 150000 || realLeads > 15000) return {
    stage: 'veterana', emoji: '🏆', label: 'Conta Veterana',
    description: 'Conta com histórico robusto e dados suficientes para otimização avançada e escala agressiva.',
  }
  if (realSpend > 50000 || realLeads > 3000) return {
    stage: 'madura', emoji: '📈', label: 'Conta Madura',
    description: 'Conta com base de dados sólida. Foco em redução de CPL e escalonamento dos canais validados.',
  }
  if (realSpend > 10000 || realLeads > 500) return {
    stage: 'crescendo', emoji: '🌱', label: 'Conta em Crescimento',
    description: 'Conta com aprendizado inicial concluído. Hora de escalar o que funciona e cortar o que não funciona.',
  }
  return {
    stage: 'iniciante', emoji: '🚀', label: 'Conta Iniciante',
    description: 'Fase de testes e aprendizado. Os primeiros 30-60 dias são críticos para encontrar o CPL de equilíbrio.',
  }
}

// ── Fallback completo gerado a partir dos benchmarks + dados reais ───────────────
function buildFallbackStrategy(data: {
  clientName: string; niche: string; products: string[]
  budget: number; objective: string; monthlyRevenue: number
  currentCPL?: number; currentLeadSource?: string; mainChallenge?: string
  city?: string
}, bench: NonNullable<ReturnType<typeof getBenchmark>>, realMetrics?: any, persona?: any) {
  // Usa CPL real quando disponível, senão usa benchmark
  const realCPL    = realMetrics?.avgCPL  ? Number(realMetrics.avgCPL)  : 0
  const realLeads  = realMetrics?.totalLeads ? Number(realMetrics.totalLeads) : 0
  const realSpend  = realMetrics?.totalSpend ? Number(realMetrics.totalSpend) : 0
  const cplAvg     = realCPL > 0 ? realCPL : Math.round((bench.cpl_min + bench.cpl_max) / 2)
  const hasReal    = realSpend > 0 || realLeads > 0

  const maturity   = classifyMaturity(realSpend, realLeads)
  const leads      = realLeads > 0 ? realLeads : Math.round(data.budget / cplAvg)
  const sales      = Math.round(leads * bench.cvr_lead_to_sale)
  const revenue    = sales * bench.avg_ticket
  const roas       = +(revenue / data.budget).toFixed(1)
  const channels   = bench.best_channels.slice(0, 4)
  const pcts       = [40, 30, 20, 10]

  const budgetRatio = data.budget / bench.budget_ideal
  const tofuStatus  = budgetRatio >= 0.8 ? 'ok' : budgetRatio >= 0.5 ? 'atenção' : 'crítico'
  const mofuStatus  = bench.cvr_lead_to_sale >= 0.1 ? 'ok' : bench.cvr_lead_to_sale >= 0.05 ? 'atenção' : 'crítico'
  const bofuStatus  = data.monthlyRevenue > 0 && data.monthlyRevenue < revenue * 0.5 ? 'atenção' : 'ok'

  const priority_ranking = channels.map((ch, i) => {
    const pct      = pcts[i] ?? 10
    const chBudget = Math.round(data.budget * pct / 100)
    const chCPL    = channelCPL(ch, cplAvg)
    const chLeads  = Math.round(chBudget / chCPL.cpl_avg)
    return {
      channel: ch,
      priority: i + 1,
      budget_pct: pct,
      budget_brl: chBudget,
      cpl_min:    chCPL.cpl_min,
      cpl_max:    chCPL.cpl_max,
      cpl_avg:    chCPL.cpl_avg,
      leads_min:  Math.round(chLeads * 0.8),
      leads_max:  Math.round(chLeads * 1.2),
      roi_range:  `${Math.round((chBudget > 0 ? (chLeads * bench.cvr_lead_to_sale * bench.avg_ticket / chBudget - 1) * 100 * 0.8 : 0))}%–${Math.round((chBudget > 0 ? (chLeads * bench.cvr_lead_to_sale * bench.avg_ticket / chBudget - 1) * 100 * 1.2 : 0))}%`,
      revenue_min: Math.round(chLeads * 0.8 * bench.cvr_lead_to_sale * bench.avg_ticket),
      revenue_max: Math.round(chLeads * 1.2 * bench.cvr_lead_to_sale * bench.avg_ticket),
      rationale: `Canal prioritário para ${data.niche} com CPL estimado de R$${chCPL.cpl_min}–${chCPL.cpl_max}`,
    }
  })

  const maturityBonus  = maturity.stage === 'veterana' ? 20 : maturity.stage === 'madura' ? 15 : maturity.stage === 'crescendo' ? 10 : 0
  const budgetScore    = Math.min(40, Math.round((budgetRatio * 40)))
  const cplScore       = realCPL > 0
    ? realCPL <= bench.cpl_min ? 30 : realCPL <= bench.cpl_max ? 20 : 10
    : data.currentCPL
      ? data.currentCPL <= bench.cpl_min ? 30 : data.currentCPL <= bench.cpl_max ? 20 : 10
      : 20
  const objectiveScore = data.objective?.toLowerCase().includes('escal') ? 10 : 8
  const dynamicScore   = Math.min(98, Math.max(40, budgetScore + cplScore + maturityBonus + objectiveScore))
  const scoreLabel     = dynamicScore >= 85 ? 'Excelente' : dynamicScore >= 70 ? 'Boa' : dynamicScore >= 55 ? 'Regular' : 'Básica'

  // Diagnóstico baseado na maturidade real da conta
  const mainProblem = (() => {
    if (maturity.stage === 'veterana') {
      return realCPL > 0 && realCPL < bench.cpl_min
        ? `Conta veterana com CPL de R$${realCPL} abaixo do benchmark (R$${bench.cpl_min}–${bench.cpl_max}) — oportunidade de escala agressiva. Foco em duplicar orçamento nos conjuntos vencedores e expandir públicos lookalike.`
        : `Conta veterana com R$${Math.round(realSpend / 1000)}k investidos e ${realLeads.toLocaleString('pt-BR')} leads gerados. Estágio de maturidade avançada — estratégia deve focar em eficiência, diversificação de canais e redução do CPL atual de R$${realCPL}.`
    }
    if (maturity.stage === 'madura') {
      return `Conta madura com histórico sólido. CPL real de R$${realCPL > 0 ? realCPL : cplAvg} ${realCPL > 0 && realCPL <= bench.cpl_max ? 'dentro do benchmark' : 'acima do benchmark'} — foco em otimização dos conjuntos existentes e teste de novos formatos criativos.`
    }
    if (maturity.stage === 'crescendo') {
      return `Conta em fase de crescimento com dados iniciais para otimização. CPL de R$${realCPL > 0 ? realCPL : cplAvg} — momento de escalar o que já funciona e pausar o que consome budget sem retorno.`
    }
    return budgetRatio < 0.5
      ? `Budget de R$${data.budget.toLocaleString('pt-BR')} está abaixo do mínimo recomendado (R$${bench.budget_floor.toLocaleString('pt-BR')}) para o nicho ${data.niche} — impossível ter volume de leads consistente.`
      : `Conta em fase inicial. Os primeiros 30–60 dias são críticos para encontrar o CPL de equilíbrio e identificar os criativos vencedores.`
  })()

  return {
    intelligence_score: dynamicScore,
    score_label: scoreLabel,
    recommendation: hasReal
      ? `${maturity.emoji} ${maturity.label} — R$${Math.round(realSpend / 1000)}k investidos, ${realLeads.toLocaleString('pt-BR')} leads gerados, CPL real de R$${realCPL}. ${realCPL < bench.cpl_min ? `CPL ${Math.round((1 - realCPL / bench.cpl_min) * 100)}% abaixo do benchmark — conta com alta eficiência, prioridade: escala.` : realCPL <= bench.cpl_max ? `CPL dentro do benchmark — foco em otimização e redução gradual.` : `CPL acima do benchmark — revisar segmentação e criativos.`}`
      : `Com R$${data.budget.toLocaleString('pt-BR')}/mês no nicho ${data.niche}, a projeção é de ${leads} leads/mês a CPL médio de R$${cplAvg}. Canal principal recomendado: ${channels[0]}. ROAS estimado: ${roas}×.`,
    estimated_monthly_revenue_range: `R$${Math.round(revenue * 0.8 / 1000)}k–${Math.round(revenue * 1.2 / 1000)}k`,
    regulatory_alerts: [],
    growth_diagnosis: {
      main_problem: mainProblem,
      waste_analysis: [
        `Sem segmentação avançada, até 40% do budget é consumido por públicos fora do perfil de compra`,
        `Criativos genéricos reduzem CTR em 50–70% vs criativos com dores específicas do nicho ${data.niche}`,
        `Leads sem follow-up em até 5 minutos perdem 80% da probabilidade de fechamento`,
      ],
      growth_blockers: [
        tofuStatus !== 'ok' ? `TOFU fraco: budget insuficiente para gerar volume de leads previsível no nicho` : `Volume de topo de funil adequado para o budget`,
        `Ausência de fluxo de nutrição estruturado (MOFU) — leads esquentam e resfriam sem CRM ou sequência de follow-up`,
        `Taxa de conversão de lead para cliente depende do processo comercial — integrar marketing com vendas`,
      ],
      funnel_health: {
        tofu: {
          status: tofuStatus,
          issue: tofuStatus === 'ok' ? 'Volume de atração adequado para o budget'
            : tofuStatus === 'atenção' ? `Budget ${Math.round((1 - budgetRatio) * 100)}% abaixo do ideal — alcance limitado`
            : `Budget crítico — volume de leads insuficiente para testar e otimizar`,
          action: tofuStatus === 'ok' ? 'Manter e testar novos públicos lookalike'
            : `Aumentar budget para R$${bench.budget_ideal.toLocaleString('pt-BR')} ou concentrar em 1 canal`,
        },
        mofu: {
          status: mofuStatus,
          issue: mofuStatus === 'ok'
            ? `CVR do nicho de ${(bench.cvr_lead_to_sale * 100).toFixed(0)}% é saudável — nutrição funciona`
            : `CVR abaixo de 10% — leads não estão sendo trabalhados adequadamente após a captura`,
          action: 'Criar sequência de nutrição: WhatsApp + e-mail nos primeiros 7 dias após lead',
        },
        bofu: {
          status: bofuStatus,
          issue: bofuStatus === 'ok' ? 'Conversão final alinhada com benchmark do nicho'
            : 'Gap entre lead qualificado e fechamento — processo comercial precisa de otimização',
          action: 'Implementar CRM, script de objeções e contato em até 5 min após conversão',
        },
      },
    },
    funnel_strategy: {
      tofu: {
        goal: `Gerar ${Math.round(leads * 1.2)}–${Math.round(leads * 1.5)} leads/mês qualificados a CPL abaixo de R$${bench.cpl_max}`,
        channels: channels.slice(0, 2),
        tactics: [
          `Campanhas de descoberta em ${channels[0]} com criativos voltados às dores do público do nicho ${data.niche}`,
          `Conteúdo orgânico para alimentar remarketing: reels, antes/depois, depoimentos reais`,
          `Públicos lookalike baseados nos melhores clientes atuais — expandir depois de 500+ eventos`,
          `Teste A/B de 3 ângulos de mensagem: dor, aspiração e prova social`,
        ],
      },
      mofu: {
        goal: 'Nutrir e qualificar leads até o momento da decisão de compra',
        tactics: [
          `Sequência de WhatsApp: 5 mensagens nos primeiros 7 dias com conteúdo de valor sobre ${data.niche}`,
          `Remarketing para visitantes e leads não convertidos com oferta diferenciada (ex: bônus, urgência)`,
          `Conteúdo educativo que responde objeções comuns antes da abordagem comercial`,
          `Lead scoring básico: leads que abriram 3+ mensagens ou visitaram o site 2× são quentes`,
        ],
      },
      bofu: {
        goal: `Converter leads qualificados em clientes a CAC sustentável — meta: R$${Math.round(bench.avg_ticket * 0.15).toLocaleString('pt-BR')}`,
        tactics: [
          `Contato em até 5 minutos após conversão — aumenta fechamento em 2×`,
          `Script de vendas com mapeamento de objeções específicas do nicho ${data.niche}`,
          `Oferta de entrada de menor risco para diminuir fricção da primeira compra`,
          `Depoimentos e provas sociais entregues no momento da decisão (link rápido no WhatsApp)`,
        ],
      },
    },
    optimization_scale: {
      cpl_target: Math.round(bench.cpl_min * 1.1),
      scale_actions: [
        `Identificar os 20% dos criativos com menor CPL e escalar budget 3× neles`,
        `Duplicar campanhas vencedoras com público expandido antes de aumentar lance`,
        `Aumentar budget em 15–20% a cada 7 dias nos grupos com ROAS acima de ${bench.kpi_thresholds.roas_good}×`,
      ],
      cut_immediately: [
        `Pausar qualquer grupo de anúncio com CPL acima de R$${bench.cpl_max} após 3+ dias de dados`,
        `Desativar criativos com CTR abaixo de 0.8% após 2.000 impressões`,
      ],
      ab_tests: [
        `Teste A/B de headline: pergunta vs. afirmação vs. prova social`,
        `Teste de formato: carrossel vs. vídeo curto vs. imagem estática`,
        `Teste de oferta: consulta grátis vs. diagnóstico vs. resultado em X dias`,
        `Teste de landing page: longa (storytelling) vs. curta (oferta direta)`,
      ],
    },
    brand_positioning: {
      authority_strategies: [
        `Criar série de conteúdo educativo semanal posicionando como referência em ${data.niche} na região`,
        `Publicar casos de sucesso com números reais — resultados concretos constroem autoridade`,
        `Parcerias e co-marketing com negócios complementares para ampliar alcance orgânico`,
      ],
      communication_adjustments: [
        `Linguagem de especialista, não de vendedor — educar antes de vender`,
        `Comunicação focada na transformação do cliente, não nas características do serviço`,
      ],
      value_perception: [
        `Posicionar o processo como diferencial — mostrar o "como" aumenta percepção de valor`,
        `Criar pacotes/ancoragem de preço (básico / recomendado / premium) para elevar ticket médio`,
        `Garantia ou política de resultado deixa claro o comprometimento e reduz objeção de preço`,
      ],
    },
    vision_360: {
      website_improvements: [
        `CTA principal acima da dobra — o visitante deve saber em 5 segundos o que fazer`,
        `Adicionar prova social visível na home: número de clientes, depoimentos, selos`,
        `Página de obrigado com próximo passo claro após conversão — não desperdiçar o momento quente`,
        `Velocidade de carregamento: cada 1s a mais reduz conversão em 7% (mobile-first)`,
      ],
      sales_alignment: [
        `Criar script de abordagem inicial alinhado com a promessa dos anúncios — sem inconsistência`,
        `Feedback semanal do time de vendas para marketing: qualidade dos leads, objeções mais comuns`,
        `Definir SLA de contato: todo lead recebe resposta em até 5 minutos (automação + humano)`,
        `Dashboard compartilhado: marketing e vendas vendo as mesmas métricas em tempo real`,
      ],
      off_ads_opportunities: [
        `Programa de indicação: cliente indica e ganha benefício — CPL próximo de zero`,
        `Parceria com influenciadores locais micro (5k–50k seguidores) para alcance orgânico`,
        `Google Meu Negócio otimizado: fotos, posts semanais, resposta a reviews — canal gratuito com alta intenção`,
      ],
    },
    strategic_status: (() => {
      if (!hasReal) return 'diagnostico_insuficiente'
      if (maturity.stage === 'veterana' && realCPL > 0 && bench && realCPL <= bench.cpl_min) return 'pronta_escalar'
      if (maturity.stage === 'veterana' || maturity.stage === 'madura') return 'escala_controlada'
      return 'escala_controlada'
    })(),
    growth_thesis: hasReal
      ? `${maturity.label} com R$${Math.round(realSpend / 1000)}k investidos e ${realLeads.toLocaleString('pt-BR')} leads gerados. ${bench && realCPL > 0
        ? realCPL < bench.cpl_min
          ? `CPL de R$${realCPL} está ${Math.round((1 - realCPL / bench.cpl_min) * 100)}% abaixo do benchmark (R$${bench.cpl_min}–${bench.cpl_max}) — escala é a prioridade: aumentar budget 15–20%/semana nas campanhas vencedoras enquanto CPL permanecer abaixo de R$${bench.cpl_max}.`
          : realCPL <= bench.cpl_max
            ? `CPL de R$${realCPL} está dentro do benchmark — foco em otimização gradual e teste de novos criativos antes de escala agressiva. Aumentar budget somente após identificar conjuntos com CPL abaixo de R$${bench.cpl_min}.`
            : `CPL de R$${realCPL} está acima do benchmark (R$${bench.cpl_min}–${bench.cpl_max}) — não escalar antes de revisar segmentação e criativos. Pausar grupos acima de R$${bench.cpl_max} imediatamente.`
        : 'Identificar criativos e públicos vencedores antes de escalar budget.'}`
      : `Estratégia estimada com base no benchmark do nicho ${data.niche}. Execute a Análise Profunda com dados reais para gerar uma tese de crescimento personalizada.`,
    strategic_matrix: {
      escalar: bench ? [{
        decision: `Escalar campanhas com CPL abaixo de R$${bench.cpl_min}`,
        evidence: realCPL > 0 && realCPL < bench.cpl_min
          ? `CPL real de R$${realCPL} está abaixo do benchmark`
          : `Benchmark do nicho: R$${bench.cpl_min}–${bench.cpl_max}`,
        condition: `CPL deve permanecer abaixo de R$${bench.cpl_max} após aumento`,
        action: `Aumentar budget em 15–20% a cada 3–5 dias; pausar automaticamente se CPL ultrapassar R$${bench.cpl_max}`,
      }] : [],
      corrigir: [
        { decision: 'Validar tracking antes de escalar', risk: 'Otimizar para evento errado multiplica investimento em leads não qualificados', action: 'Verificar todos os eventos de conversão no Events Manager — prazo: 7 dias' },
      ],
      testar: [
        { hypothesis: `Novo criativo com ângulo de prova social reduz CPL vs criativo atual`, metric: `CPL abaixo de R$${bench ? bench.cpl_min : 'benchmark'}`, deadline: '14 dias' },
        { hypothesis: 'Público lookalike 1% da base de clientes converte melhor que interesse', metric: 'CPL e taxa de lead qualificado', deadline: '21 dias' },
      ],
      cortar: bench ? [
        { decision: `Pausar grupos com CPL acima de R$${bench.cpl_max} por 3+ dias`, criterion: `CPL > R$${bench.cpl_max} com mais de 500 impressões` },
        { decision: 'Desativar criativos com CTR abaixo de 0.8%', criterion: 'CTR < 0.8% após 2.000 impressões' },
      ] : [],
    },
    budget_decision: {
      maintain: `Manter budget base de R$${data.budget.toLocaleString('pt-BR')}/mês no canal principal enquanto CPL permanecer dentro do benchmark`,
      reallocate: realCPL > 0 && bench && realCPL > bench.cpl_max
        ? `Realocar 20–30% das campanhas com CPL acima de R$${bench.cpl_max} para os conjuntos mais eficientes`
        : `Manter distribuição atual e realocar apenas após identificar vencedores claros (CPL < R$${bench?.cpl_min || 'benchmark'})`,
      scale: `Escalar 15–20%/semana nas campanhas com CPL abaixo de R$${bench?.cpl_min || 'benchmark'} — somente após validar tracking`,
      cut: `Pausar campanhas com CPL acima de R$${bench?.cpl_max || 'benchmark'} por mais de 3 dias consecutivos`,
      condition_to_increase: `Aumentar budget total somente após: (1) tracking validado, (2) CPL estável por 7 dias, (3) pelo menos 1 campanha com CPL abaixo de R$${bench?.cpl_min || 'benchmark'}`,
    },
    plan_7_30_90: {
      seven_days: [
        { objective: 'Corrigir bloqueios críticos de tracking', action: 'Validar todos os eventos de conversão no Events Manager e definir CPL máximo de corte', metric: `100% dos eventos verificados e regra de corte em R$${bench?.cpl_max || 'X'} ativada` },
        { objective: 'Mapear campanhas vencedoras', action: `Identificar grupos com CPL abaixo de R$${bench?.cpl_min || 'benchmark'} e suspender os acima de R$${bench?.cpl_max || 'benchmark'}`, metric: 'Lista de campanhas elegíveis para escala definida' },
      ],
      thirty_days: [
        { objective: 'Otimizar CPL e testar criativos', action: 'Lançar 3 criativos com ângulos diferentes (dor/aspiração/prova social) e testar lookalike 1%', metric: `CPL médio abaixo de R$${bench ? Math.round((bench.cpl_min + bench.cpl_max) / 2) : 'benchmark'}` },
        { objective: 'Escalar canais vencedores', action: 'Aumentar budget 15–20% por semana nos grupos validados; criar estrutura de remarketing', metric: 'Volume de leads 20% acima do mês 1 sem aumento de CPL' },
      ],
      ninety_days: [
        { objective: 'Previsibilidade e escala sustentável', action: `Consolidar os canais vencedores, diversificar para ${channels[1] || 'segundo canal recomendado'}, estruturar funil MOFU`, metric: `CPL sustentável abaixo de R$${bench ? Math.round(bench.cpl_min * 1.1) : 'benchmark'} e funil MOFU/BOFU ativo` },
      ],
    },
    strategic_risks: [
      { risk: 'Escala antes de validar tracking resulta em otimização para evento errado', prevention: 'Verificar todos os eventos antes de qualquer aumento de budget' },
      { risk: 'Saturação criativa com frequência alta causa queda de CTR e aumento de CPL', prevention: 'Monitorar frequência semanalmente — renovar criativos quando frequência ultrapassar 3×' },
      { risk: `CPL acima de R$${bench?.cpl_max || 'benchmark'} por mais de 5 dias sem intervenção drena budget`, prevention: `Criar regra automática de pausa: CPL > R$${bench?.cpl_max || 'X'} por 3 dias consecutivos` },
    ],
    next_moves: [
      `Validar eventos de conversão no Events Manager — prazo: 48h`,
      `Pausar grupos com CPL acima de R$${bench?.cpl_max || 'X'} imediatamente`,
      `Definir CPL máximo de corte de R$${bench?.cpl_max || 'X'} como regra automática no Meta`,
      `Concentrar 70% do budget nas 3 campanhas com menor CPL`,
      `Criar 2 novos criativos com prova social para testar em paralelo`,
    ],
    target_audience: {
      persona_snapshot: {
        name:     persona?.name || 'Cliente ideal',
        age:      persona?.age || '30–45 anos',
        profile:  persona?.profession || `Público típico de ${bench.name}`,
        one_liner: persona?.strategySummary?.split('.')[0]
          || persona?.buyingBehavior
          || `Busca soluções de ${data.niche} com confiança e bom custo-benefício`,
      },
      demographics: {
        age_range:    persona?.age || '30–45 anos',
        gender:       persona?.gender || 'Ambos',
        income_range: persona?.income || 'R$3.000–10.000/mês',
      },
      best_regions: data.city
        ? [{ region: data.city, why: 'Região de atuação declarada — concentre o investimento aqui primeiro.' }]
        : [{ region: 'Brasil', why: 'Sem região definida — comece amplo e refine pelas conversões reais.' }],
      interests: persona?.facebookInterests?.slice(0, 4)
        || (data.products?.length ? data.products.slice(0, 4) : [bench.name]),
      channel_focus: persona?.favoriteChannels?.slice(0, 2) || bench.best_channels.slice(0, 2),
    },
    priority_ranking,
    recommended_channels_names: channels,
    plan_90_days: [
      {
        month: 1,
        goal: 'Diagnóstico, estruturação e primeiros testes',
        week_1: [
          'Configurar pixel/tag em todos os canais e validar eventos de conversão',
          'Definir CPL máximo de corte e dashboard de acompanhamento semanal',
        ],
        week_2: [
          `Lançar campanhas piloto com 30% do budget (R$${Math.round(data.budget * 0.3).toLocaleString('pt-BR')}) — 2 criativos por canal`,
          'Implementar sequência de nutrição no WhatsApp (5 mensagens / 7 dias)',
        ],
        week_3: [
          `Pausar grupos com CPL acima de R$${bench.cpl_max} — escalar os que estão abaixo`,
          'Primeiro relatório de qualidade: entrevistar 5 leads e mapear objeções reais',
        ],
        week_4: [
          'Consolidar aprendizados e ajustar segmentação e criativos para o mês 2',
          'Alinhar script de vendas com o que os leads estão dizendo',
        ],
      },
      {
        month: 2,
        goal: 'Otimização de CPL e escala dos canais validados',
        week_1: ['Aumentar budget 20% nos canais com menor CPL', 'Lançar 3 novos criativos baseados nas objeções mapeadas no mês 1'],
        week_2: ['Expandir públicos lookalike (1%→2%→3%) nos canais vencedores', 'Ativar remarketing dinâmico para visitantes e leads não convertidos'],
        week_3: ['Teste A/B de landing page: versão atual vs nova versão com prova social', 'Ajustar lances por dispositivo (mobile tende a ter CPL menor em saúde/serviços)'],
        week_4: ['Relatório de performance mês 2: CPL, CVR, ROAS — comparar com benchmark do nicho', 'Planejamento detalhado mês 3 com foco em escala'],
      },
      {
        month: 3,
        goal: 'Previsibilidade, escala e sistema de crescimento',
        week_1: [`Atingir CPL sustentável abaixo de R$${Math.round(cplAvg * 0.85)} (15% abaixo da média do nicho)`, 'Estruturar funil de reativação para leads de 30–60 dias sem conversão'],
        week_2: ['Escalar budget 20% nos canais validados — duplicar campanhas vencedoras', 'Lançar campanha de autoridade: conteúdo de prova social e resultados'],
        week_3: ['Automatizar relatório semanal: CPL, leads, conversões, ROAS', 'Implementar programa de indicação para clientes atuais'],
        week_4: ['Consolidar os 90 dias: benchmark antes vs depois, ROI do investimento em marketing', 'Definir estratégia do próximo trimestre com metas de escala'],
      },
    ],
    key_actions: [
      `Definir CPL máximo de R$${bench.cpl_max} como KPI de corte — pausar qualquer grupo acima disso imediatamente`,
      `Implementar contato em até 5 minutos após conversão — isso sozinho pode dobrar a taxa de fechamento`,
      `Concentrar ${pcts[0]}% do budget em ${channels[0]} nos primeiros 30 dias — validar antes de diversificar`,
      `Criar 3 criativos com ângulos diferentes (dor / aspiração / prova social) e testar em paralelo`,
      `Alinhar marketing e vendas: feedback semanal sobre qualidade dos leads e objeções mais comuns`,
    ],
  }
}

// ── Lógica principal separada para streaming ────────────────────────────────────
async function runStrategy(body: any) {
  const {
    clientName: _cn, niche: _ni, products, budget, objective: _obj, monthlyRevenue,
    nicheDetails, city, currentCPL, currentLeadSource, mainChallenge: _mc,
    campaignHistory,
    // Unit economics
    ticketPrice, grossMargin, isRecurring, conversionRate,
    // Dados enriquecidos (passados opcionalmente pelo dashboard)
    recentAudit, persona,
  } = body
  const clientName   = sanitizeText(_cn, 120)
  const niche        = sanitizeText(_ni, 120)
  const objective    = sanitizeText(_obj, 300)
  const mainChallenge = sanitizeText(_mc, 300)

  const bench         = getBenchmark(niche)
  const nicheContext  = buildNichePromptContext(niche, nicheDetails || {})

  // Cálculos de unit economics para incluir no prompt
  const ticket          = ticketPrice || bench?.avg_ticket || 0
  const margin          = grossMargin ? grossMargin / 100 : null
  const cvr             = conversionRate ? conversionRate / 100 : bench?.cvr_lead_to_sale || null
  const breakEvenROAS   = margin ? +(1 / margin).toFixed(2) : null
  const maxProfitCPL    = (margin && cvr && ticket) ? Math.round(ticket * margin * cvr) : null
  const ltv             = (isRecurring && ticket && margin)
    ? Math.round(ticket / ((body.avgChurnMonthly || 5) / 100) * margin) : null
  const cacPaybackMonths = (maxProfitCPL && cvr && ticket && margin)
    ? +((maxProfitCPL / (ticket * margin)).toFixed(1)) : null

  // Tavily + grounding do Gemini (Google Search) rodam em paralelo — não bloqueiam
  // a IA (apenas enriquecem se chegarem a tempo). Cada fonte degrada para '' isolada.
  const realtimeDataPromise = (async () => {
    const { fetchGroundedBenchmarks } = await import('@/lib/gemini')
    const [tav, gem] = await Promise.allSettled([
      fetchRealtimeBenchmarks(niche, city),
      fetchGroundedBenchmarks(niche, city),
    ])
    return [
      tav.status === 'fulfilled' ? tav.value : '',
      gem.status === 'fulfilled' ? gem.value : '',
    ].filter(Boolean).join('\n')
  })().catch(() => '')

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY não configurado — usando fallback de benchmark')
  }

  if (apiKey && bench) {
    let prompt = ''  // hoisted: usado também no fallback do Gemini (catch)
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk')
      const anthropic        = new Anthropic({ apiKey })
      const benchmarkSection = getBenchmarkSummary(niche)

      // Tavily aguarda até 8s antes do Claude — garante dados reais no prompt
      const realtimeData = await Promise.race([
        realtimeDataPromise,
        new Promise<string>((resolve) => setTimeout(() => resolve(''), 8000)),
      ])

      const unitEconomicsSection = (breakEvenROAS || maxProfitCPL || ltv || cacPaybackMonths) ? `
=== UNIT ECONOMICS DO CLIENTE ===
${ticket ? `- Ticket médio: R$${ticket.toLocaleString('pt-BR')}` : ''}
${margin ? `- Margem bruta: ${(margin * 100).toFixed(0)}%` : ''}
${cvr ? `- Taxa conversão lead→venda: ${(cvr * 100).toFixed(1)}%` : ''}
${isRecurring ? `- Produto RECORRENTE (assinatura/mensalidade)` : '- Produto de venda única'}
${breakEvenROAS ? `- ROAS break-even real: ${breakEvenROAS}× (abaixo disso opera com prejuízo)` : ''}
${maxProfitCPL ? `- CPL máximo lucrativo: R$${maxProfitCPL} (acima disso perde dinheiro por lead)` : ''}
${ltv ? `- LTV estimado: R$${ltv.toLocaleString('pt-BR')}` : ''}
${cacPaybackMonths ? `- Payback do CAC: ${cacPaybackMonths} mês(es)` : ''}

ATENÇÃO: Use esses dados para calibrar metas de ROAS e CPL. Não recomende estratégias que não cubram o break-even. Se o CPL recomendado ultrapassar R$${maxProfitCPL || 'X'}, a operação fica deficitária.` : ''

      prompt = `Você é um Head de Growth e gestor sênior de tráfego pago com 10+ anos de experiência no mercado brasileiro. Especialista em Meta Ads (Advantage+, CBO, campanhas de conversão e geração de leads), Google Ads (Search, PMAX, Display, YouTube, smart bidding), TikTok Ads e estratégia de growth para PMEs.

Você já gerenciou mais de R$50M em investimento publicitário. Sabe diagnosticar gargalos reais, não apenas recomendar "testar criativos". Você pensa em unit economics, CAC payback, LTV e margem — não apenas em CPL e ROAS brutos.

DADOS DO CLIENTE:
- Nome: ${clientName}
- Nicho: ${niche}
- Cidade/Região: ${city || 'Não informada'}
- Produtos/Serviços: ${products.join(', ')}
- Investimento mensal: R$${budget.toLocaleString('pt-BR')}
- Objetivo: ${objective}
- Faturamento atual: R$${monthlyRevenue.toLocaleString('pt-BR')}/mês
${currentCPL ? `- CPL atual: R$${currentCPL}` : ''}
${currentLeadSource ? `- Principal origem de leads atual: ${currentLeadSource}` : ''}
${mainChallenge ? `- Maior desafio atual: ${mainChallenge}` : ''}
${unitEconomicsSection}
${campaignHistory?.length > 0 ? `
HISTÓRICO DE CAMPANHAS REAIS DO CLIENTE:
${campaignHistory.map((c: any) => `
• ${c.channel} | ${c.period} | Investido: R$${c.budgetSpent} | Leads: ${c.leads} | CPL real: R$${c.cplReal} | Conversões: ${c.conversions} | Receita: R$${c.revenue} | Resultado: ${c.outcome}
  ✓ Funcionou: ${c.whatWorked || 'não informado'}
  ✕ Falhou: ${c.whatFailed || 'não informado'}
  Obs: ${c.notes || '—'}`).join('\n')}

USE ESSES DADOS REAIS para calibrar CPL esperado, identificar canais a priorizar ou evitar, e personalizar o diagnóstico de crescimento. Não ignore o histórico.` : ''}
${recentAudit?._realMetrics ? (() => {
        const rm = recentAudit._realMetrics
        const rSpend  = Number(rm.totalSpend  || 0)
        const rLeads  = Number(rm.totalLeads  || 0)
        const rCPL    = Number(rm.avgCPL      || 0)
        const mat     = classifyMaturity(rSpend, rLeads)
        const benchAvg = bench ? Math.round((bench.cpl_min + bench.cpl_max) / 2) : 0
        return `
=== MATURIDADE E DADOS REAIS DA CONTA META ADS ===
ESTÁGIO DA CONTA: ${mat.emoji} ${mat.label.toUpperCase()}
${mat.description}

- Investimento acumulado (30d): R$${rSpend.toLocaleString('pt-BR')}
- Leads gerados (30d): ${rLeads.toLocaleString('pt-BR')}
- CPL real: ${rCPL > 0 ? `R$${rCPL}` : 'não calculado'} ${rCPL > 0 && benchAvg > 0 ? `(benchmark do nicho: R$${bench?.cpl_min}–${bench?.cpl_max} — conta está ${rCPL < (bench?.cpl_min || 999) ? '✅ ABAIXO do benchmark (eficiente)' : rCPL <= (bench?.cpl_max || 0) ? '✅ DENTRO do benchmark' : '⚠️ ACIMA do benchmark'})` : ''}
- ROAS real: ${rm.avgROAS ? `${rm.avgROAS}×` : 'não calculado'}
- CTR médio: ${rm.avgCTR ? `${rm.avgCTR}%` : 'não disponível'}
- Campanhas ativas: ${rm.campaignCount || 0}
${recentAudit._evolution ? (() => {
        const ev = recentAudit._evolution
        const parts: string[] = []
        if (ev.scoreDelta != null && ev.scoreDelta !== 0) parts.push(`score ${ev.scoreDelta > 0 ? 'subiu' : 'caiu'} ${Math.abs(ev.scoreDelta)} pts`)
        if (ev.cplDelta   != null && ev.cplDelta   !== 0) parts.push(`CPL ${ev.cplDelta > 0 ? 'piorou' : 'melhorou'} ${Math.abs(ev.cplDelta)}%`)
        if (ev.leadsDelta != null && ev.leadsDelta !== 0) parts.push(`leads ${ev.leadsDelta > 0 ? '+' : ''}${ev.leadsDelta}%`)
        return parts.length ? `\nEVOLUÇÃO vs auditoria anterior (${ev.sinceDate ? new Date(ev.sinceDate).toLocaleDateString('pt-BR') : ''}): ${parts.join(', ')}. Leve essa tendência em conta: se está melhorando, foque em escalar o que funciona; se piorando, priorize correção antes de escalar.` : ''
      })() : ''}

INSTRUÇÕES OBRIGATÓRIAS BASEADAS NA MATURIDADE:
${mat.stage === 'veterana' ? `- Esta é uma conta VETERANA. JAMAIS diga "fase inicial" ou "primeiros 30 dias são críticos" — isso não se aplica.
- O diagnóstico deve focar em: eficiência de escala, diversificação de canais, redução de CPL via otimização avançada.
- Recomende estratégias para quem já tem dados: lookalike avançado, Advantage+, CBO com histórico, automação de regras.
- Se CPL real < benchmark: prioridade máxima é ESCALAR budget — não mexa no que funciona.` :
mat.stage === 'madura' ? `- Conta MADURA com dados suficientes para otimização. Foco em escalar vencedores e pausar perdedores.
- Recomende testes A/B baseados em dados reais, não apenas "testar criativos" genericamente.` :
mat.stage === 'crescendo' ? `- Conta em CRESCIMENTO. Dados iniciais disponíveis — hora de identificar padrões e escalar.
- Balance entre explorar novos públicos e explorar o que já funciona.` :
`- Conta INICIANTE. Fase de aprendizado e testes — os primeiros 60 dias são críticos.`}

CRÍTICO: Use os dados reais acima como baseline. Não use estimativas de benchmark quando há dados reais.`
      })() : ''}
${persona ? `
=== PERSONA DO CLIENTE IDEAL (gerada por IA) ===
- Nome: ${persona.name} · Idade: ${persona.age}
- Profissão: ${persona.profession} · Renda: ${persona.income}
- Principais dores: ${persona.pains?.slice(0,3).join('; ')}
- Desejos: ${persona.desires?.slice(0,2).join('; ')}
- Canais favoritos: ${persona.favoriteChannels?.join(', ')}
- Interesses Facebook Ads: ${persona.facebookInterests?.slice(0,5).join(', ') || 'não mapeados'}
- Keywords Google: ${persona.googleAdsKeywords?.slice(0,5).join(', ') || 'não mapeadas'}
USE esta persona para calibrar segmentação nos canais, ângulos criativos e linguagem das recomendações.` : ''}

${benchmarkSection ? `BENCHMARKS INTERNOS DO SISTEMA:\n${benchmarkSection}` : ''}
${realtimeData || ''}
${nicheContext ? `\nCONTEXTO ESPECIALIZADO DO NICHO:${nicheContext}` : ''}

REGRA CRÍTICA: Você está gerando uma ESTRATÉGIA, não uma auditoria. NÃO repita os problemas encontrados. TRANSFORME cada problema em uma decisão concreta: o que fazer, com qual campanha/público/criativo, qual critério de corte, qual condição para escalar, qual prazo. Se há gargalo, diga o que ele BLOQUEIA e qual DECISÃO tomar. Se há campanha vencedora, diga QUANTO escalar e com qual CONDIÇÃO. Respostas genéricas como "criar criativos melhores" ou "melhorar funil" não são aceitas — use dados específicos do cliente.

Entregue uma estratégia de crescimento baseada no diagnóstico. Responda APENAS com JSON válido:

{
  "intelligence_score": <0-100>,
  "score_label": "<Básica|Boa|Avançada|Excelente>",
  "recommendation": "<insight principal em 2-3 frases diretas com foco em crescimento>",
  "estimated_monthly_revenue_range": "R$X–Y",
  "regulatory_alerts": ["<alerta se houver restrição no setor>"],

  "growth_diagnosis": {
    "main_problem": "<o maior problema de crescimento deste negócio em 1-2 frases diretas>",
    "waste_analysis": ["<onde está o desperdício de verba 1>", "<desperdício 2>", "<desperdício 3>"],
    "growth_blockers": ["<o que está travando o crescimento 1>", "<gargalo 2>", "<gargalo 3>"],
    "funnel_health": {
      "tofu": {"status": "<ok|atenção|crítico>", "issue": "<problema específico>", "action": "<ação corretiva>"},
      "mofu": {"status": "<ok|atenção|crítico>", "issue": "<problema específico>", "action": "<ação corretiva>"},
      "bofu": {"status": "<ok|atenção|crítico>", "issue": "<problema específico>", "action": "<ação corretiva>"}
    }
  },

  "funnel_strategy": {
    "tofu": {"goal": "<meta>", "channels": ["<canal1>", "<canal2>"], "tactics": ["<tática 1>", "<tática 2>", "<tática 3>", "<tática 4>"]},
    "mofu": {"goal": "<meta>", "tactics": ["<tática 1>", "<tática 2>", "<tática 3>"]},
    "bofu": {"goal": "<meta>", "tactics": ["<tática 1>", "<tática 2>", "<tática 3>"]}
  },

  "optimization_scale": {
    "cpl_target": <CPL alvo em R$>,
    "scale_actions": ["<o que escalar 1>", "<o que escalar 2>", "<o que escalar 3>"],
    "cut_immediately": ["<o que cortar 1>", "<o que cortar 2>"],
    "ab_tests": ["<teste A/B prioritário 1>", "<teste 2>", "<teste 3>"]
  },

  "brand_positioning": {
    "authority_strategies": ["<estratégia 1>", "<estratégia 2>", "<estratégia 3>"],
    "communication_adjustments": ["<ajuste 1>", "<ajuste 2>"],
    "value_perception": ["<ação 1>", "<ação 2>"]
  },

  "vision_360": {
    "website_improvements": ["<melhoria 1>", "<melhoria 2>", "<melhoria 3>"],
    "sales_alignment": ["<alinhamento 1>", "<alinhamento 2>"],
    "off_ads_opportunities": ["<oportunidade 1>", "<oportunidade 2>", "<oportunidade 3>"]
  },

  "priority_ranking": [
    {
      "channel": "<nome>", "priority": <1-5>,
      "budget_pct": <0-100>, "budget_brl": <valor>,
      "cpl_min": <num>, "cpl_max": <num>, "cpl_avg": <num>,
      "leads_min": <num>, "leads_max": <num>,
      "roi_range": "<X%–Y%>",
      "revenue_min": <num>, "revenue_max": <num>,
      "rationale": "<por que este canal para este nicho específico>"
    }
  ],
  "recommended_channels_names": ["<canal1>", "<canal2>"],
  "plan_90_days": [
    {
      "month": 1, "goal": "<objetivo do mês>",
      "week_1": ["<ação1>", "<ação2>"],
      "week_2": ["<ação1>", "<ação2>"],
      "week_3": ["<ação1>", "<ação2>"],
      "week_4": ["<ação1>", "<ação2>"]
    }
  ],
  "key_actions": ["<ação prioritária 1>", "<ação 2>", "<ação 3>", "<ação 4>", "<ação 5>"],

  "strategic_status": "<pronta_escalar|escala_controlada|corrigir_antes|diagnostico_insuficiente|alto_risco>",
  "growth_thesis": "<1 parágrafo direto: tese de crescimento desta conta — o que escalar, o que corrigir, qual condição e qual risco principal. Use dados reais. Não repita o diagnóstico — diga a DIREÇÃO.>",
  "strategic_matrix": {
    "escalar": [{"decision": "<decisão de escala>", "evidence": "<evidência da auditoria>", "condition": "<condição para escalar>", "action": "<ação concreta com critério>"}],
    "corrigir": [{"decision": "<o que corrigir>", "risk": "<risco de não corrigir>", "action": "<ação com prazo>"}],
    "testar": [{"hypothesis": "<hipótese específica>", "metric": "<métrica de validação>", "deadline": "<prazo>"}],
    "cortar": [{"decision": "<o que cortar>", "criterion": "<critério objetivo de corte>"}]
  },
  "budget_decision": {
    "maintain": "<o que manter e por quê>",
    "reallocate": "<de onde para onde realocar>",
    "scale": "<o que escalar — campanha/canal — e condição>",
    "cut": "<o que cortar e critério>",
    "condition_to_increase": "<condição objetiva para aumentar total investido>"
  },
  "plan_7_30_90": {
    "seven_days": [{"objective": "<objetivo>", "action": "<ação específica>", "metric": "<métrica de sucesso>"}],
    "thirty_days": [{"objective": "<objetivo>", "action": "<ação>", "metric": "<métrica>"}],
    "ninety_days": [{"objective": "<objetivo>", "action": "<ação>", "metric": "<métrica>"}]
  },
  "strategic_risks": [{"risk": "<risco estratégico>", "prevention": "<como prevenir>"}],
  "next_moves": ["<decisão clara e específica 1>", "<decisão 2>", "<decisão 3>", "<decisão 4>", "<decisão 5>"],

  "target_audience": {
    "persona_snapshot": {"name": "<nome fictício do cliente ideal>", "age": "<FAIXA etária, ex: 30–45 anos>", "profile": "<profissão/perfil do segmento>", "one_liner": "<1 frase: quem é e o que mais quer>"},
    "demographics": {"age_range": "<faixa etária recomendada p/ segmentar>", "gender": "<Feminino|Masculino|Ambos>", "income_range": "<faixa de renda, ex: R$5.000–10.000/mês>"},
    "best_regions": [{"region": "<cidade/estado/região recomendada>", "why": "<por que priorizar aqui — 1 frase>"}],
    "interests": ["<interesse/segmentação Meta 1>", "<interesse 2>", "<interesse 3>", "<interesse 4>"],
    "channel_focus": ["<canal prioritário p/ esse público 1>", "<canal 2>"]
  }
}

Para "target_audience": use a PERSONA fornecida, a cidade/região do negócio e o benchmark do nicho. Se houver dados reais de campanha, calibre por eles. Faixas (idade/renda), nunca valores exatos. "best_regions": 2–3 itens priorizando onde há melhor custo/demanda.`

      // IA com 23s — Tavily já rodou em paralelo (2s max), SSE keepalive mantém conexão
      const aiResult = await Promise.race([
        anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }],
        }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 23000)),
      ])

      if (!aiResult) throw new Error('AI timeout — usando benchmark')

      const raw     = (aiResult.content[0] as any).text.trim()
      const jsonStr = raw.startsWith('```') ? raw.split('```')[1].replace(/^json\n/, '') : raw
      const strategy = JSON.parse(jsonStr)
      return { success: true, strategy, source: 'ai' }

    } catch (aiError: any) {
      console.warn('Anthropic API falhou, usando fallback de benchmark:', aiError.message)

      // Fallback aditivo: tenta o Gemini antes de cair no benchmark estático.
      try {
        const { callGeminiJson, geminiModel, isGeminiEnabled } = await import('@/lib/gemini')
        if (isGeminiEnabled()) {
          const strategy = await callGeminiJson<any>({
            model: geminiModel('FALLBACK'),
            user: prompt,
            maxTokens: 4000,
            timeoutMs: 22000,
          })
          return { success: true, strategy, source: 'gemini' }
        }
      } catch (gemErr: any) {
        console.warn('Gemini fallback também falhou:', gemErr.message)
      }
    }
  }

  if (!bench) {
    return { success: false, error: 'Nicho não reconhecido e API indisponível.' }
  }

  const strategy = buildFallbackStrategy(
    { clientName, niche, products, budget, objective, monthlyRevenue, currentCPL, currentLeadSource, mainChallenge, city },
    bench,
    recentAudit?._realMetrics ?? null,
    persona
  )
  return { success: true, strategy, source: 'benchmark' }
}

// ── POST com streaming (keepalive a cada 3s → Vercel Hobby suporta até 60s) ─────
export async function POST(req: NextRequest) {
  // Verificação de acesso: sempre busca do Clerk diretamente (JWT pode estar cacheado)
  const { userId } = await auth()
  if (!userId) {
    return new Response('Não autenticado', { status: 401 })
  }

  const { rateLimit } = await import('@/lib/rateLimit')
  const rl = rateLimit(userId, 'strategy', { max: 5, windowSec: 3600 })
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: `Limite atingido. Tente novamente em ${rl.retryAfterSec}s.` }), {
      status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rl.retryAfterSec) },
    })
  }

  const { clerkClient } = await import('@clerk/nextjs/server')
  const clerkUser = await (await clerkClient()).users.getUser(userId)
  const plan = (clerkUser.publicMetadata as any)?.plan as string | undefined
  const hasActivePlan = plan && plan !== 'free'
  let effectivePlan = plan || 'free'

  if (!hasActivePlan) {
    const TRIAL_DAYS = 14
    const createdAtMs = typeof clerkUser.createdAt === 'number' ? clerkUser.createdAt : new Date(clerkUser.createdAt as any).getTime()
    const inTrial = (Date.now() - createdAtMs) < TRIAL_DAYS * 24 * 60 * 60 * 1000
    if (!inTrial) {
      return new Response(
        `data: ${JSON.stringify({ success: false, error: 'Período de avaliação encerrado. Assine um plano para continuar.' })}\n\n`,
        { status: 402, headers: { 'Content-Type': 'text/event-stream' } }
      )
    }
    effectivePlan = 'trial'
  }

  const { checkAndDeductCredits, refundCredits } = await import('@/lib/credits')
  const creditResult = await checkAndDeductCredits(userId, effectivePlan, 'strategy')
  if (!creditResult.allowed) {
    return new Response(
      `data: ${JSON.stringify({ success: false, error: creditResult.error })}\n\n`,
      { status: 402, headers: { 'Content-Type': 'text/event-stream' } }
    )
  }

  const body = await req.json()
  const encoder = new TextEncoder()
  let pingTimer: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream({
    async start(controller) {
      // Keepalive a cada 3s — mantém a conexão aberta no Vercel Hobby
      pingTimer = setInterval(() => {
        try { controller.enqueue(encoder.encode(': keepalive\n\n')) } catch {}
      }, 3000)

      try {
        const result = await runStrategy(body)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(result)}\n\n`))
      } catch (err: any) {
        console.error('Strategy stream error:', err)
        // Devolve créditos — estratégia falhou, usuário não recebeu resultado
        refundCredits(userId, effectivePlan, 'strategy').catch(() => {})
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ success: false, error: err.message || 'Erro inesperado.' })}\n\n`))
      } finally {
        if (pingTimer) clearInterval(pingTimer)
        controller.close()
      }
    },
    cancel() {
      if (pingTimer) clearInterval(pingTimer)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
