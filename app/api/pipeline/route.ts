// app/api/pipeline/route.ts — Pipeline 360° ELYON via Anthropic SDK
// Executa os 5 agentes em cadeia e faz streaming SSE do progresso.

import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { getBenchmark, getBenchmarkSummary } from '@/lib/niche_benchmarks'
import { buildNichePromptContext } from '@/lib/niche_prompts'
import Anthropic from '@anthropic-ai/sdk'

const AGENT_LABELS: Record<string, string> = {
  auditor:      'Auditor — análise das campanhas',
  data_analyst: 'Data Analyst — unit economics + mercado',
  estrategista: 'Estrategista — plano de crescimento',
  copywriter:   'Copywriter — criativos de performance',
  report:       'Report — relatório executivo 360°',
}

function sseEvent(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

function getAnthropic(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY não configurada')
  return new Anthropic({ apiKey: key })
}

async function callLLMJson<T>(anthropic: Anthropic, prompt: string, maxTokens: number): Promise<T> {
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })
  const block = msg.content[0]
  if (block.type !== 'text') throw new Error('LLM retornou conteúdo não-texto')
  let str = block.text.trim()
  if (str.startsWith('```')) {
    str = str.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
  }
  try { return JSON.parse(str) as T }
  catch {
    const cut = Math.max(str.lastIndexOf('}'), str.lastIndexOf(']'))
    if (cut > 50) { try { return JSON.parse(str.slice(0, cut + 1)) as T } catch {} }
    throw new Error('JSON inválido na resposta do agente')
  }
}

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const input = await req.json()
  if (!input?.clientName || !input?.niche) {
    return new Response('clientName e niche são obrigatórios', { status: 400 })
  }

  const anthropic = getAnthropic()
  const skip      = new Set<string>(input.skipAgents || [])

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => controller.enqueue(new TextEncoder().encode(sseEvent(data)))

      const results: Record<string, any> = {}
      const errors:  { agent: string; message: string }[] = []
      const executed: string[] = []

      const agents = ['auditor', 'data_analyst', 'estrategista', 'copywriter', 'report']
      const total  = agents.filter(a => !skip.has(a)).length

      send({ type: 'start', total, client: input.clientName })

      for (const agent of agents) {
        if (skip.has(agent)) continue

        send({ type: 'agent_start', agent, label: AGENT_LABELS[agent] })

        try {
          results[agent] = await runAgent(anthropic, agent, input, results)
          executed.push(agent)
          send({ type: 'agent_done', agent, result: results[agent] })
        } catch (e: any) {
          errors.push({ agent, message: e.message })
          send({ type: 'agent_error', agent, message: e.message })
        }
      }

      send({
        type: 'done',
        pipeline: 'elyon_full',
        client: input.clientName,
        niche: input.niche,
        executed_agents: executed,
        skipped_agents: Array.from(skip),
        auditor:      results['auditor']      ?? null,
        data_analyst: results['data_analyst'] ?? null,
        estrategista: results['estrategista'] ?? null,
        copywriter:   results['copywriter']   ?? null,
        report:       results['report']       ?? null,
        errors,
      })

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  })
}

// ── Dispatcher de agentes ────────────────────────────────────────────────────

async function runAgent(anthropic: Anthropic, agent: string, input: any, results: Record<string, any>) {
  switch (agent) {
    case 'auditor':      return runAuditor(anthropic, input)
    case 'data_analyst': return runDataAnalyst(anthropic, input, results['auditor'])
    case 'estrategista': return runEstrategista(anthropic, input)
    case 'copywriter':   return runCopywriter(anthropic, input, results['estrategista'])
    case 'report':       return runReport(anthropic, input, results)
    default: throw new Error(`Agente desconhecido: ${agent}`)
  }
}

// ── Auditor ──────────────────────────────────────────────────────────────────

async function runAuditor(anthropic: Anthropic, input: any) {
  const { clientName, niche, budget = 0, objective = '', metaCampaigns = [], googleCampaigns = [], metaTotals, googleTotals, uploadedCampaigns = [] } = input
  const bench = getBenchmark(niche)
  const benchmarkText = getBenchmarkSummary(niche)
  const allCampaigns = [...metaCampaigns, ...googleCampaigns, ...uploadedCampaigns]
  const totalSpend = (metaTotals?.spend || 0) + (googleTotals?.spend || 0) + uploadedCampaigns.reduce((s: number, c: any) => s + (c.spend || 0), 0)
  const totalLeads = (metaTotals?.leads || 0) + (googleTotals?.leads || 0) + uploadedCampaigns.reduce((s: number, c: any) => s + (c.leads || 0), 0)
  const realCPL = totalLeads > 0 ? (totalSpend / totalLeads).toFixed(2) : '0'

  const anomalies: string[] = []
  allCampaigns.filter((c: any) => (c.ctr || 0) > 10).forEach((c: any) => anomalies.push(`⚠ CTR SUSPEITO: ${c.name} (${c.ctr}%)`))
  allCampaigns.filter((c: any) => (c.roas || 0) > 40).forEach((c: any) => anomalies.push(`⚠ ROAS IMPOSSÍVEL: ${c.name} (${c.roas}×)`))
  allCampaigns.filter((c: any) => (c.spend || 0) > totalSpend * 0.1 && (c.leads || 0) === 0).forEach((c: any) => anomalies.push(`🔴 DESPERDÍCIO: ${c.name} (R$${c.spend?.toFixed(0)}) SEM leads`))

  const ranked = [...allCampaigns].filter((c: any) => (c.spend || 0) > 0).sort((a: any, b: any) => {
    if ((a.leads||0)>0 && (b.leads||0)>0) return (a.cpl||(a.spend||0)/(a.leads||1)) - (b.cpl||(b.spend||0)/(b.leads||1))
    return (a.leads||0) === 0 ? 1 : -1
  })

  const prompt = `Auditor sênior de tráfego pago, 10+ anos. R$50M+ gerenciados.

Cliente: ${clientName} | Nicho: ${niche} | Budget: R$${budget}/mês | Objetivo: ${objective}

${anomalies.length > 0 ? `ANOMALIAS:\n${anomalies.join('\n')}\n` : 'DADOS: OK\n'}
${ranked.length > 0 ? `RANKING:\n${ranked.slice(0,15).map((c: any, i: number) => {
  const cpa = (c.leads||0) > 0 ? Math.round((c.spend||0)/(c.leads||1)) : null
  const eff = cpa === null ? '⛔ SEM CONVERSÃO' : bench && cpa <= bench.cpl_min*1.1 ? '🏆 EXCELENTE' : bench && cpa <= bench.cpl_max ? '✅ OK' : '🔴 CRÍTICO'
  return `  ${i+1}. [${eff}] "${c.name}" — R$${Math.round(c.spend||0)} | Leads: ${c.leads||0} | CPA: ${cpa?`R$${cpa}`:'N/A'}`
}).join('\n')}\n` : ''}
${metaTotals ? `META: R$${(metaTotals.spend||0).toFixed(0)} | CPL R$${metaTotals.cpl||0} | ROAS ${metaTotals.roas||0}× | Leads ${metaTotals.leads||0}\n` : ''}
${googleTotals ? `GOOGLE: R$${(googleTotals.spend||0).toFixed(0)} | CPL R$${googleTotals.cpl||0} | Leads ${googleTotals.leads||0}\n` : ''}
TOTAL: R$${totalSpend.toFixed(0)} | Leads: ${totalLeads} | CPL: R$${realCPL}
${benchmarkText ? `\nBENCHMARK (${niche}):\n${benchmarkText}` : ''}

JSON:
{"score_conta":<0-100>,"grade":"<A+|A|A-|B+|B|B-|C+|C|D>","resumo_executivo":"<2-3 frases>","diagnostico":["<1>","<2>","<3>"],"erros_criticos":["<erro com nome campanha>"],"gargalos":[{"rank":1,"titulo":"<gargalo>","descricao":"<métricas>","impacto":"<R$ ou %>"}],"oportunidades":[{"titulo":"<oportunidade>","descricao":"<como>","potencial":"<resultado>"}],"plano_acao":{"curto":[{"acao":"<7d>","como":"<passos>","impacto":"<resultado>"}],"medio":[{"acao":"<30d>","como":"<execução>","impacto":"<resultado>"}],"longo":[{"acao":"<90d>","como":"<estratégia>","impacto":"<transformação>"}]}}`

  const result = await callLLMJson<any>(anthropic, prompt, 5000)
  return { agent: 'auditor', ...result, real_metrics: { totalSpend: Math.round(totalSpend), totalLeads: Math.round(totalLeads), avgCPL: totalLeads > 0 ? Math.round(totalSpend/totalLeads) : null, campaignCount: allCampaigns.length }, generated_at: new Date().toISOString(), source: 'ai' }
}

// ── Data Analyst ─────────────────────────────────────────────────────────────

async function runDataAnalyst(anthropic: Anthropic, input: any, auditorOutput: any) {
  const { clientName, niche, budget = 0, monthlyRevenue = 0, currentCPL, mainChallenge, isRecurring, campaignHistory = [] } = input
  const bench = getBenchmark(niche)
  const benchmarkText = getBenchmarkSummary(niche)
  const margin = ((input.grossMargin ?? 40)) / 100
  const cvr = ((input.conversionRate ?? (bench?.cvr_lead_to_sale ?? 0.1) * 100)) / 100
  const ticket = input.ticketPrice ?? bench?.avg_ticket ?? 1000
  const breakEvenROAS = margin > 0 ? +(1/margin).toFixed(2) : 2.5
  const maxCPL = cvr > 0 ? Math.round(ticket * margin * cvr) : 0
  const ltv = isRecurring ? Math.round((ticket/0.05)*margin) : Math.round(ticket*margin)
  const ltvCacRatio = maxCPL > 0 ? +(ltv/maxCPL).toFixed(1) : 3

  const prompt = `Data Analyst SENIOR em tráfego pago. Une CFO + CMO. Dados quantitativos obrigatórios.

Cliente: ${clientName} | Nicho: ${niche} | Budget: R$${budget} | Faturamento: R$${monthlyRevenue}
${currentCPL ? `CPL atual: R$${currentCPL}` : ''} ${mainChallenge ? `| Desafio: ${mainChallenge}` : ''}

UNIT ECONOMICS: Ticket: R$${ticket} | Margem: ${(margin*100).toFixed(0)}% | CVR: ${(cvr*100).toFixed(0)}%
ROAS break-even: ${breakEvenROAS}× | CPL máx lucrativo: R$${maxCPL} | LTV: R$${ltv} | LTV:CAC: ${ltvCacRatio}×

${campaignHistory.length > 0 ? `HISTÓRICO:\n${campaignHistory.slice(0,8).map((c: any) => `• ${c.period} | ${c.channel} | CPL: R$${c.cplReal??'?'} | ${c.outcome??'?'}`).join('\n')}` : ''}
${auditorOutput ? `AUDITORIA: CPL real R$${auditorOutput.real_metrics?.avgCPL??'N/A'} | Leads: ${auditorOutput.real_metrics?.totalLeads??0} | Gasto: R$${auditorOutput.real_metrics?.totalSpend??0}` : ''}
${benchmarkText ? `\nBENCHMARK:\n${benchmarkText}` : ''}

JSON (preencha TODAS as chaves):
{"insights":["<insight com %>","<insight 2>","<insight 3>"],"anomalias":[{"titulo":"<anomalia>","descricao":"<dado>","impacto":"<R$/%>"}],"segmentos_vencedores":[{"segmento":"<canal>","motivo":"<com dados>","metrica":"<CPL/CVR/ROAS>"}],"segmentos_perdedores":[{"segmento":"<canal>","motivo":"<com dados>","metrica":"<CPL/CVR/ROAS>"}],"recomendacoes":["<ação 1>","<ação 2>","<ação 3>"],"health_score":<0-100>,"grade":"<A+|A|B+|B|C>","executive_summary":"<2-3 frases>","saude_financeira":{"break_even_roas":${breakEvenROAS},"cpl_maximo_lucrativo":${maxCPL},"ltv_estimado":${ltv},"cac_payback_meses":<num>,"ltv_cac_ratio":${ltvCacRatio},"sustentabilidade":"<sustentavel|fragil|insustentavel>","interpretacao":"<significado>"},"matriz_risco":[{"rank":1,"risco":"<risco>","probabilidade":"<alta|media|baixa>","impacto":"<critico|alto|medio|baixo>","mitigacao":"<ação>"},{"rank":2,"risco":"<risco>","probabilidade":"<alta|media|baixa>","impacto":"<critico|alto|medio|baixo>","mitigacao":"<ação>"},{"rank":3,"risco":"<risco>","probabilidade":"<alta|media|baixa>","impacto":"<critico|alto|medio|baixo>","mitigacao":"<ação>"}],"prontidao_para_escalar":{"score":<0-100>,"pode_escalar_agora":<bool>,"prerequisitos_faltando":["<pré-req>"],"quando_escalar":"<condição>","projecao_escala":{"budget_2x":${(budget||0)*2},"leads_projetados":<num>,"receita_projetada":<num>}},"diagnostico_funil":{"etapas":[{"etapa":"Tráfego → Clique","status":"<saudavel|problema|nao_auditado>","observacao":"<CTR>"},{"etapa":"Clique → Lead","status":"<saudavel|problema|nao_auditado>","observacao":"<CPL>"},{"etapa":"Lead → Atendimento","status":"<saudavel|problema|nao_auditado>","observacao":"<SLA>"},{"etapa":"Atendimento → Venda","status":"<saudavel|problema|nao_auditado>","observacao":"<CVR>"}],"gargalo_principal":"<trafego|pos-clique|atendimento|ambos>","impacto_financeiro":"<R$/%>"},"recomendacao_principal":{"titulo":"<ação transformadora>","descricao":"<por que supera as outras>","acao_semana_1":"<7d>","acao_mes_1":"<30d>","acao_trimestre":"<90d>"},"inteligencia":[{"tipo":"oportunidade_mercado","icone":"🎯","titulo":"<oportunidade>","categoria":"Mercado","categoriaColor":"#F0B429","insight":"<insight>","dados":"<dados>","acao_concreta":"<ação>","potencial":"<resultado>"},{"tipo":"audiencia_avancada","icone":"👥","titulo":"<segmento>","categoria":"Audiência","categoriaColor":"#22C55E","insight":"<insight>","dados":"<dados>","acao_concreta":"<ação>","potencial":"<resultado>"},{"tipo":"alocacao_orcamento","icone":"💰","titulo":"<redistribuição>","categoria":"Orçamento","categoriaColor":"#38BDF8","insight":"<insight>","dados":"<dados>","acao_concreta":"<ação>","potencial":"<resultado>"},{"tipo":"analise_competitiva","icone":"🔍","titulo":"<competição>","categoria":"Competição","categoriaColor":"#A78BFA","insight":"<insight>","dados":"<dados>","acao_concreta":"<ação>","potencial":"<resultado>"},{"tipo":"escala_inteligente","icone":"📈","titulo":"<escala>","categoria":"Escala","categoriaColor":"#FB923C","insight":"<insight>","dados":"<dados>","acao_concreta":"<ação>","potencial":"<resultado>"},{"tipo":"criativo_estrategico","icone":"🎨","titulo":"<criativo>","categoria":"Criativo","categoriaColor":"#EC4899","insight":"<insight>","dados":"<dados>","acao_concreta":"<ação>","potencial":"<resultado>"}],"benchmark_comparativo":{"cpl_atual":${currentCPL||0},"cpl_benchmark":<num>,"cpl_status":"<excelente|bom|atencao|critico>","roas_break_even":${breakEvenROAS},"roas_bom_nicho":<num>,"melhores_canais":["<canal>"],"insights_nicho":["<insight>"]}}`

  const result = await callLLMJson<any>(anthropic, prompt, 7000)
  return { agent: 'data_analyst', ...result, generated_at: new Date().toISOString(), source: 'ai' }
}

// ── Estrategista ─────────────────────────────────────────────────────────────

async function runEstrategista(anthropic: Anthropic, input: any) {
  const { clientName, niche, products = [], budget = 0, objective = 'Gerar leads', monthlyRevenue = 0, nicheDetails = {}, city, currentCPL, mainChallenge, campaignHistory = [], ticketPrice, grossMargin, isRecurring, conversionRate } = input
  const bench = getBenchmark(niche)
  const benchmarkSection = getBenchmarkSummary(niche)
  const nicheContext = buildNichePromptContext(niche, nicheDetails)

  const ticket = ticketPrice || bench?.avg_ticket || 0
  const margin = grossMargin ? grossMargin/100 : null
  const cvr    = conversionRate ? conversionRate/100 : bench?.cvr_lead_to_sale || null
  const breakEvenROAS = margin ? +(1/margin).toFixed(2) : null
  const maxProfitCPL = margin && cvr && ticket ? Math.round(ticket*margin*cvr) : null

  const prompt = `Head de Growth + gestor sênior tráfego pago, 10+ anos Brasil. Pensa em unit economics, CAC payback, LTV.

Cliente: ${clientName} | Nicho: ${niche} | Cidade: ${city||'N/A'} | Produtos: ${products.join(', ')||'N/A'}
Budget: R$${budget} | Objetivo: ${objective} | Faturamento: R$${monthlyRevenue}/mês
${currentCPL ? `CPL atual: R$${currentCPL}` : ''} ${mainChallenge ? `| Desafio: ${mainChallenge}` : ''}
${ticket ? `Ticket: R$${ticket}` : ''} ${margin ? `| Margem: ${(margin*100).toFixed(0)}%` : ''} ${breakEvenROAS ? `| ROAS break-even: ${breakEvenROAS}×` : ''} ${maxProfitCPL ? `| CPL máx lucrativo: R$${maxProfitCPL}` : ''}
${campaignHistory.length > 0 ? `\nHISTÓRICO:\n${campaignHistory.slice(0,6).map((c: any) => `• ${c.channel} | ${c.period} | CPL: R$${c.cplReal??'?'} | ${c.outcome??'?'} — ${c.whatWorked||'—'}`).join('\n')}` : ''}
${benchmarkSection ? `\nBENCHMARKS:\n${benchmarkSection}` : ''}${nicheContext ? `\nCONTEXTO DO NICHO:${nicheContext}` : ''}

JSON:
{"intelligence_score":<0-100>,"score_label":"<Básica|Boa|Avançada|Excelente>","recommendation":"<insight 2-3 frases>","estimated_monthly_revenue_range":"R$X–Y","regulatory_alerts":["<alerta>"],"growth_diagnosis":{"main_problem":"<problema principal>","waste_analysis":["<desperdício 1>","<2>","<3>"],"growth_blockers":["<gargalo 1>","<2>","<3>"],"funnel_health":{"tofu":{"status":"<ok|atenção|crítico>","issue":"<problema>","action":"<ação>"},"mofu":{"status":"<ok|atenção|crítico>","issue":"<problema>","action":"<ação>"},"bofu":{"status":"<ok|atenção|crítico>","issue":"<problema>","action":"<ação>"}}},"funnel_strategy":{"tofu":{"goal":"<meta>","channels":["<canal>"],"tactics":["<tática 1>","<tática 2>","<tática 3>"]},"mofu":{"goal":"<meta>","tactics":["<tática 1>","<tática 2>"]},"bofu":{"goal":"<meta>","tactics":["<tática 1>","<tática 2>"]}},"optimization_scale":{"cpl_target":<num>,"scale_actions":["<escalar 1>","<escalar 2>"],"cut_immediately":["<cortar 1>","<cortar 2>"],"ab_tests":["<teste 1>","<teste 2>","<teste 3>"]},"brand_positioning":{"authority_strategies":["<estratégia 1>","<estratégia 2>"],"communication_adjustments":["<ajuste 1>","<ajuste 2>"],"value_perception":["<ação 1>","<ação 2>"]},"vision_360":{"website_improvements":["<melhoria 1>","<melhoria 2>"],"sales_alignment":["<alinhamento 1>","<alinhamento 2>"],"off_ads_opportunities":["<oportunidade 1>","<oportunidade 2>"]},"priority_ranking":[{"channel":"<nome>","priority":1,"budget_pct":<0-100>,"budget_brl":<val>,"cpl_min":<num>,"cpl_max":<num>,"cpl_avg":<num>,"leads_min":<num>,"leads_max":<num>,"roi_range":"<X%–Y%>","revenue_min":<num>,"revenue_max":<num>,"rationale":"<por quê>"}],"recommended_channels_names":["<canal1>","<canal2>"],"plan_90_days":[{"month":1,"goal":"<objetivo>","week_1":["<ação>"],"week_2":["<ação>"],"week_3":["<ação>"],"week_4":["<ação>"]},{"month":2,"goal":"<objetivo>","week_1":["<ação>"],"week_2":["<ação>"],"week_3":["<ação>"],"week_4":["<ação>"]},{"month":3,"goal":"<objetivo>","week_1":["<ação>"],"week_2":["<ação>"],"week_3":["<ação>"],"week_4":["<ação>"]}],"key_actions":["<ação 1>","<ação 2>","<ação 3>","<ação 4>","<ação 5>"]}`

  const result = await callLLMJson<any>(anthropic, prompt, 6000)
  return { agent: 'estrategista', ...result, generated_at: new Date().toISOString(), source: 'ai' }
}

// ── Copywriter ────────────────────────────────────────────────────────────────

async function runCopywriter(anthropic: Anthropic, input: any, estrategistaOutput: any) {
  const { clientName, niche, products = [], nicheDetails = {}, currentCPL, copyBriefing = {} } = input
  const cb = copyBriefing
  const bench = getBenchmark(niche)
  const benchmarkSection = getBenchmarkSummary(niche)
  const nicheContext = buildNichePromptContext(niche, nicheDetails)
  const product    = cb.product || products[0] || 'Produto/serviço principal'
  const frameworks = cb.frameworks || ['dor', 'desejo', 'prova_social', 'urgencia']
  const cpl_target = estrategistaOutput?.optimization_scale?.cpl_target || currentCPL

  const prompt = `Copywriter sênior tráfego pago, escola direct response, mercado brasileiro. Regras: terminologia correta do nicho "${niche}", each variação com GANCHO diferente, headlines máx 40 chars, CTAs com verbo.

Cliente: ${clientName} | Nicho: ${niche} | Produto: ${product}
Oferta: ${cb.offer||'Criar oferta relevante'} | Público: ${cb.targetAudience||'Inferir do nicho'}
Dor: ${cb.mainPain||'Inferir'} | Desejo: ${cb.mainDesire||'Inferir'}
Objeções: ${(cb.objections||[]).join(' | ')||'Inferir'} | Diferenciais: ${(cb.differentials||[]).join(' | ')||'N/A'}
Frameworks: ${frameworks.join(', ')} | ${cpl_target ? `CPL alvo: R$${cpl_target}` : ''}
${estrategistaOutput?.recommended_channels_names ? `Canais da estratégia: ${estrategistaOutput.recommended_channels_names.join(', ')}` : ''}
${benchmarkSection ? `\nBENCHMARK:\n${benchmarkSection}` : ''}${nicheContext ? `\nCONTEXTO:${nicheContext}` : ''}${bench?.insights?.length ? `\nINSIGHTS DO NICHO:\n${bench.insights.map((i: string) => `- ${i}`).join('\n')}` : ''}

Gerar ${frameworks.length * 2} variações. JSON:
{"briefing_resumo":"<1 frase>","tom_de_voz":"<vocabulário, ritmo>","big_idea":"<conceito central>","variacoes":[{"framework":"<dor|desejo|prova_social|autoridade|urgencia|transformacao>","titulo":"<40 chars>","subtitulo":"<60 chars>","corpo":"<2-4 frases>","cta":"<verbo + ação>","formato_sugerido":"<imagem|carrossel|video_curto>","plataforma":"<meta_feed|meta_reels|google_search>","gancho":"<1ª frase>","beneficio_principal":"<benefício>","prova":"<dado/garantia>","quebra_objecao":"<objeção>","notas_criativo":"<instrução visual>","teste_hipotese":"<o que testa>"}],"variacoes_por_framework":{},"recomendacoes_criativas":["<recomendação 1>","<recomendação 2>","<recomendação 3>"],"headlines_alternativas":["<h1>","<h2>","<h3>","<h4>","<h5>"],"ctas_alternativos":["<cta1>","<cta2>","<cta3>"],"angulos_a_evitar":["<ângulo ineficiente no nicho>"],"plano_de_teste":[{"fase":"Semana 1","teste":"<teste A/B>","metrica":"<CTR|CPL>"},{"fase":"Semana 2","teste":"<teste>","metrica":"<métrica>"},{"fase":"Semana 3","teste":"<teste>","metrica":"<métrica>"}]}`

  const result = await callLLMJson<any>(anthropic, prompt, 7000)
  return { agent: 'copywriter', ...result, generated_at: new Date().toISOString(), source: 'ai' }
}

// ── Report ────────────────────────────────────────────────────────────────────

async function runReport(anthropic: Anthropic, input: any, results: Record<string, any>) {
  const { clientName, niche, budget = 0, objective, monthlyRevenue, currentCPL, mainChallenge } = input
  const { auditor: aud, data_analyst: da, estrategista: st, copywriter: cp } = results
  const format = input.reportFormat || 'executive'

  const audCtx = aud ? `AUDITOR (${aud.score_conta}/100 ${aud.grade}): ${aud.resumo_executivo}\nGargalos: ${(aud.gargalos||[]).slice(0,3).map((g: any) => `${g.titulo} → ${g.impacto}`).join(' | ')}` : ''
  const daCtx  = da ? `DATA ANALYST (${da.health_score}/100 ${da.grade}): ${da.executive_summary}\nBreak-even: ${da.saude_financeira?.break_even_roas}× | CPL máx: R$${da.saude_financeira?.cpl_maximo_lucrativo} | LTV:CAC: ${da.saude_financeira?.ltv_cac_ratio}×` : ''
  const stCtx  = st ? `ESTRATEGISTA (${st.intelligence_score} ${st.score_label}): ${st.recommendation}\nCanais: ${(st.recommended_channels_names||[]).join(', ')} | CPL alvo: R$${st.optimization_scale?.cpl_target}` : ''
  const cpCtx  = cp ? `COPYWRITER: Big idea: ${cp.big_idea} | ${(cp.variacoes||[]).length} variações` : ''

  const prompt = `Diretor de planejamento sênior. CONSOLIDE os 4 agentes. Não repita texto bruto. Cruze dados. Priorize por ROI.

Cliente: ${clientName} | Nicho: ${niche} | Budget: R$${budget} | ${objective||''} | Faturamento: R$${monthlyRevenue||'N/A'} | CPL: ${currentCPL?`R$${currentCPL}`:'N/A'} | Desafio: ${mainChallenge||'N/A'}

${audCtx}
${daCtx}
${stCtx}
${cpCtx}

Formato: ${format === 'executive' ? 'C-level, impacto financeiro' : format === 'tactical' ? 'operacional, execução' : 'pitch para investidor'}

Gere 8-15 ações no plano_acao. JSON:
{"titulo":"Diagnóstico 360° — ${clientName}","cliente":"${clientName}","nicho":"${niche}","score_geral":<0-100>,"grade":"<A+|A|A-|B+|B|B-|C+|C|D>","sumario_executivo":"<3-5 frases com números reais>","kpis_chave":[{"nome":"CPL atual","valor":"<R$X>","status":"<excelente|bom|atencao|critico>","benchmark":"<vs benchmark>"},{"nome":"ROAS break-even","valor":"<X×>","status":"<status>","benchmark":"<vs atual>"},{"nome":"LTV:CAC","valor":"<X×>","status":"<status>","benchmark":"<mínimo 3×>"},{"nome":"Health score","valor":"<X/100>","status":"<status>","benchmark":"<posição>"},{"nome":"Budget eficiência","valor":"<%>","status":"<status>","benchmark":"<ideal>"}],"principais_descobertas":["<descoberta 1>","<descoberta 2>","<descoberta 3>","<descoberta 4>","<descoberta 5>"],"riscos_criticos":["<risco com R$/%>","<risco 2>","<risco 3>"],"oportunidades_principais":["<oportunidade quantificada>","<oportunidade 2>","<oportunidade 3>"],"plano_acao":[{"id":"acao_1","prioridade":"<critica|alta|media|baixa>","categoria":"<Tracking|Criativos|Audiências|Funil|Escala|Estrutura|Orçamento|Copy|Processo>","titulo":"<até 8 palavras>","descricao":"<o que fazer e por quê>","como":"<passo a passo>","impacto":"<% ou R$>","prazo":"<Imediato|7 dias|30 dias|90 dias>","responsavel_sugerido":"<Gestor|Copy|Designer|Vendas|Cliente>"}],"projecao_90_dias":{"cenario_base":"<leads/receita mantendo atual>","cenario_otimizado":"<leads/receita executando o plano>","premissas":["<premissa 1>","<premissa 2>","<premissa 3>"]},"proximos_passos_imediatos":["<ação 7 dias 1>","<ação 2>","<ação 3>","<ação 4>","<ação 5>"],"slide_pitch":"<3-5 bullets com \\n• para reunião rápida>"}`

  const result = await callLLMJson<any>(anthropic, prompt, 7000)
  const plano = (result.plano_acao||[]).map((a: any, i: number) => ({ ...a, id: a.id||`acao_${i+1}` }))
  return { agent: 'report', ...result, plano_acao: plano, generated_at: new Date().toISOString(), source: 'ai' }
}
