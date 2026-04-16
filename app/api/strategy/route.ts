// app/api/strategy/route.ts — Head de Growth: diagnóstico completo + funil + 360°
import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getBenchmark, getBenchmarkSummary } from '@/lib/niche_benchmarks'
import { buildNichePromptContext } from '@/lib/niche_prompts'
import { fetchRealtimeBenchmarks } from '@/lib/tavily'

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

// ── Fallback completo gerado a partir dos benchmarks ────────────────────────────
function buildFallbackStrategy(data: {
  clientName: string; niche: string; products: string[]
  budget: number; objective: string; monthlyRevenue: number
  currentCPL?: number; currentLeadSource?: string; mainChallenge?: string
}, bench: NonNullable<ReturnType<typeof getBenchmark>>) {
  const cplAvg   = Math.round((bench.cpl_min + bench.cpl_max) / 2)
  const leads    = Math.round(data.budget / cplAvg)
  const sales    = Math.round(leads * bench.cvr_lead_to_sale)
  const revenue  = sales * bench.avg_ticket
  const roas     = +(revenue / data.budget).toFixed(1)
  const channels = bench.best_channels.slice(0, 4)
  const pcts     = [40, 30, 20, 10]

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

  const budgetScore    = Math.min(40, Math.round((budgetRatio * 40)))
  const cplScore       = data.currentCPL
    ? data.currentCPL <= bench.cpl_min ? 30 : data.currentCPL <= bench.cpl_max ? 20 : 10
    : 20
  const historyScore   = 10
  const objectiveScore = data.objective?.toLowerCase().includes('escal') ? 10 : 8
  const dynamicScore   = Math.min(98, Math.max(40, budgetScore + cplScore + historyScore + objectiveScore))
  const scoreLabel     = dynamicScore >= 85 ? 'Excelente' : dynamicScore >= 70 ? 'Boa' : dynamicScore >= 55 ? 'Regular' : 'Básica'

  return {
    intelligence_score: dynamicScore,
    score_label: scoreLabel,
    recommendation: `Com R$${data.budget.toLocaleString('pt-BR')}/mês no nicho ${data.niche}, a projeção é de ${leads} leads/mês a CPL médio de R$${cplAvg}. Canal principal recomendado: ${channels[0]}. ROAS estimado: ${roas}×.`,
    estimated_monthly_revenue_range: `R$${Math.round(revenue * 0.8 / 1000)}k–${Math.round(revenue * 1.2 / 1000)}k`,
    regulatory_alerts: [],
    growth_diagnosis: {
      main_problem: budgetRatio < 0.5
        ? `Budget de R$${data.budget.toLocaleString('pt-BR')} está abaixo do mínimo recomendado (R$${bench.budget_floor.toLocaleString('pt-BR')}) para o nicho ${data.niche} — impossível ter volume de leads consistente.`
        : `Estratégia em fase inicial. O principal risco é a falta de dados históricos para otimização de campanhas — os primeiros 30 dias são críticos.`,
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
    clientName, niche, products, budget, objective, monthlyRevenue,
    nicheDetails, city, currentCPL, currentLeadSource, mainChallenge,
    campaignHistory,
  } = body

  const bench         = getBenchmark(niche)
  const nicheContext  = buildNichePromptContext(niche, nicheDetails || {})
  const realtimeDataPromise = fetchRealtimeBenchmarks(niche, city)

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (apiKey && bench) {
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk')
      const anthropic        = new Anthropic({ apiKey })
      const benchmarkSection = getBenchmarkSummary(niche)
      // Tavily com timeout curto para não estourar o limite da função
      const realtimeData = await Promise.race([
        realtimeDataPromise,
        new Promise<string>((resolve) => setTimeout(() => resolve(''), 3000)),
      ])

      const prompt = `Você é um Head de Growth altamente experiente, especializado em marketing digital, aquisição de clientes e tomada de decisão orientada por dados no mercado brasileiro.

Sua função não é apenas gerenciar campanhas. Você é responsável por:
- Diagnosticar problemas de crescimento e gargalos no funil
- Criar sistemas previsíveis de aquisição de clientes
- Melhorar eficiência do investimento em mídia
- Estruturar crescimento escalável e orientado a dados

DADOS DO CLIENTE:
- Nome: ${clientName}
- Nicho: ${niche}
- Cidade/Região: ${city || 'Não informada'}
- Produtos/Serviços: ${products.join(', ')}
- Budget mensal: R$${budget.toLocaleString('pt-BR')}
- Objetivo: ${objective}
- Faturamento atual: R$${monthlyRevenue.toLocaleString('pt-BR')}/mês
${currentCPL ? `- CPL atual: R$${currentCPL}` : ''}
${currentLeadSource ? `- Principal origem de leads atual: ${currentLeadSource}` : ''}
${mainChallenge ? `- Maior desafio atual: ${mainChallenge}` : ''}
${campaignHistory?.length > 0 ? `
HISTÓRICO DE CAMPANHAS REAIS DO CLIENTE:
${campaignHistory.map((c: any) => `
• ${c.channel} | ${c.period} | Investido: R$${c.budgetSpent} | Leads: ${c.leads} | CPL real: R$${c.cplReal} | Conversões: ${c.conversions} | Receita: R$${c.revenue} | Resultado: ${c.outcome}
  ✓ Funcionou: ${c.whatWorked || 'não informado'}
  ✕ Falhou: ${c.whatFailed || 'não informado'}
  Obs: ${c.notes || '—'}`).join('\n')}

USE ESSES DADOS REAIS para calibrar CPL esperado, identificar canais a priorizar ou evitar, e personalizar o diagnóstico de crescimento. Não ignore o histórico.` : ''}

${benchmarkSection ? `BENCHMARKS INTERNOS DO SISTEMA:\n${benchmarkSection}` : ''}
${realtimeData || ''}
${nicheContext ? `\nCONTEXTO ESPECIALIZADO DO NICHO:${nicheContext}` : ''}

Entregue uma análise completa de crescimento com as 5 etapas do Head de Growth. Responda APENAS com JSON válido:

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
  "key_actions": ["<ação prioritária 1>", "<ação 2>", "<ação 3>", "<ação 4>", "<ação 5>"]
}`

      // Race: IA com até 20s — SSE keepalive mantém conexão aberta, fallback só se AI realmente falhar
      const aiResult = await Promise.race([
        anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 3500,
          messages: [{ role: 'user', content: prompt }],
        }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 20000)),
      ])

      if (!aiResult) throw new Error('AI timeout — usando benchmark')

      const raw     = (aiResult.content[0] as any).text.trim()
      const jsonStr = raw.startsWith('```') ? raw.split('```')[1].replace(/^json\n/, '') : raw
      const strategy = JSON.parse(jsonStr)
      return { success: true, strategy, source: 'ai' }

    } catch (aiError: any) {
      console.warn('Anthropic API falhou, usando fallback de benchmark:', aiError.message)
    }
  }

  if (!bench) {
    return { success: false, error: 'Nicho não reconhecido e API indisponível.' }
  }

  const strategy = buildFallbackStrategy(
    { clientName, niche, products, budget, objective, monthlyRevenue, currentCPL, currentLeadSource, mainChallenge },
    bench
  )
  return { success: true, strategy, source: 'benchmark' }
}

// ── POST com streaming (keepalive a cada 3s → Vercel Hobby suporta até 60s) ─────
export async function POST(req: NextRequest) {
  // Verificação de plano ativo
  const { userId, sessionClaims } = await auth()
  if (!userId) {
    return new Response('Não autenticado', { status: 401 })
  }
  const plan = (sessionClaims?.publicMetadata as any)?.plan as string | undefined
  if (!plan || plan === 'free') {
    return new Response(
      `data: ${JSON.stringify({ success: false, error: 'Assinatura necessária para gerar estratégias.' })}\n\n`,
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
