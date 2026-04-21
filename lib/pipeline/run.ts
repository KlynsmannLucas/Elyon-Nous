// lib/pipeline/run.ts — Pipeline 5 agentes para Next.js (sem MCP)
// Usa Anthropic SDK diretamente via lib/pipeline/llm.ts

import { callLLMJson } from './llm'
import { getBenchmark, getBenchmarkSummary } from '@/lib/niche_benchmarks'
import { buildNichePromptContext } from '@/lib/niche_prompts'

// ── Tipos compartilhados ─────────────────────────────────────────────────────

export interface PipelineInput {
  clientName: string
  niche: string
  budget?: number
  objective?: string
  monthlyRevenue?: number
  city?: string
  products?: string[]
  currentCPL?: number
  currentLeadSource?: string
  mainChallenge?: string
  nicheDetails?: Record<string, string>
  ticketPrice?: number
  grossMargin?: number
  conversionRate?: number
  isRecurring?: boolean
  avgChurnMonthly?: number
  metaCampaigns?: any[]
  googleCampaigns?: any[]
  metaTotals?: Record<string, any> | null
  googleTotals?: Record<string, any> | null
  uploadedCampaigns?: any[]
  uploadedPlatform?: string | null
  campaignHistory?: any[]
  copyBriefing?: {
    product?: string; offer?: string; targetAudience?: string
    mainPain?: string; mainDesire?: string; objections?: string[]
    differentials?: string[]; tone?: string; platforms?: string[]
    frameworks?: string[]; formats?: string[]
  }
  skipAgents?: ('auditor' | 'data_analyst' | 'estrategista' | 'copywriter' | 'report')[]
  reportFormat?: 'executive' | 'tactical' | 'investor'
}

export interface PipelineOutput {
  pipeline: 'elyon_full'
  client: string
  niche: string
  executed_agents: string[]
  skipped_agents: string[]
  auditor: any | null
  data_analyst: any | null
  estrategista: any | null
  copywriter: any | null
  report: any | null
  started_at: string
  finished_at: string
  duration_ms: number
  errors: { agent: string; message: string }[]
}

// ── Agente 1: Auditor ────────────────────────────────────────────────────────

function buildAuditPrompt(input: PipelineInput): string {
  const { clientName, niche, budget = 0, objective = '',
    metaCampaigns = [], googleCampaigns = [], metaTotals,
    googleTotals, uploadedCampaigns = [] } = input

  const bench = getBenchmark(niche)
  const benchmarkText = getBenchmarkSummary(niche)

  const hasMeta   = metaTotals != null || metaCampaigns.length > 0
  const hasGoogle = googleTotals != null || googleCampaigns.length > 0
  const allCampaigns = [...metaCampaigns, ...googleCampaigns, ...uploadedCampaigns]

  const totalSpend  = (metaTotals?.spend || 0) + (googleTotals?.spend || 0) + uploadedCampaigns.reduce((s, c) => s + (c.spend || 0), 0)
  const totalLeads  = (metaTotals?.leads || 0) + (googleTotals?.leads || 0) + uploadedCampaigns.reduce((s, c) => s + (c.leads || 0), 0)
  const realCPL     = totalLeads > 0 ? (totalSpend / totalLeads).toFixed(2) : '0'

  const anomalies: string[] = []
  allCampaigns.filter(c => (c.ctr || 0) > 10).forEach(c =>
    anomalies.push(`⚠ CTR SUSPEITO (>10%): ${c.name} (${c.ctr}%) — possível bot traffic`))
  allCampaigns.filter(c => (c.roas || 0) > 40).forEach(c =>
    anomalies.push(`⚠ ROAS IMPOSSÍVEL (>40×): ${c.name} (${c.roas}×)`))
  allCampaigns.filter(c => (c.spend || 0) > totalSpend * 0.1 && (c.leads || 0) === 0).forEach(c =>
    anomalies.push(`🔴 DESPERDÍCIO CRÍTICO: ${c.name} (R$${c.spend?.toFixed(0)}) SEM resultado`))
  allCampaigns.filter(c => (c.frequency || 0) > 4).forEach(c =>
    anomalies.push(`⚠ FADIGA CRIATIVA: ${c.name} (freq ${c.frequency?.toFixed(1)})`))

  const anomalySection = anomalies.length > 0
    ? `=== ANOMALIAS DETECTADAS ===\n${anomalies.join('\n')}\n`
    : '=== QUALIDADE DOS DADOS: OK ===\n'

  const ranked = [...allCampaigns].filter(c => (c.spend || 0) > 0).sort((a, b) => {
    if ((a.leads || 0) > 0 && (b.leads || 0) > 0) return (a.cpl || a.spend / a.leads) - (b.cpl || b.spend / b.leads)
    if ((a.leads || 0) === 0) return 1
    if ((b.leads || 0) === 0) return -1
    return 0
  })

  const rankingText = ranked.length > 0
    ? `=== RANKING POR EFICIÊNCIA ===\n${ranked.map((c, i) => {
        const cpa = (c.leads || 0) > 0 ? Math.round((c.spend || 0) / (c.leads || 1)) : null
        const eff = cpa === null ? '⛔ SEM CONVERSÃO'
          : bench && cpa <= bench.cpl_min * 1.1 ? '🏆 EXCELENTE'
          : bench && cpa <= bench.cpl_max ? '✅ DENTRO DO BENCHMARK'
          : bench && cpa <= bench.cpl_max * 2 ? '⚠ ACIMA DO BENCHMARK' : '🔴 CRÍTICO'
        return `  ${i + 1}. [${eff}] "${c.name}" — R$${Math.round(c.spend || 0)} | Leads: ${c.leads || 0} | CPA: ${cpa ? `R$${cpa}` : 'N/A'}`
      }).join('\n')}\n`
    : ''

  const metaSummary = hasMeta
    ? `=== META ADS ===\nGasto: R$${(metaTotals?.spend || 0).toFixed(2)} | CPL: R$${metaTotals?.cpl || 0} | ROAS: ${metaTotals?.roas || 0}× | Leads: ${metaTotals?.leads || 0}\n${metaCampaigns.slice(0, 20).map(c => `  [${c.status || 'ACTIVE'}] ${c.name} — R$${(c.spend || 0).toFixed(2)} | Leads ${c.leads || 0} | CPL R$${(c.cpl || 0).toFixed(2)}`).join('\n')}\n`
    : ''

  const googleSummary = hasGoogle
    ? `=== GOOGLE ADS ===\nGasto: R$${(googleTotals?.spend || 0).toFixed(2)} | CPL: R$${googleTotals?.cpl || 0} | Leads: ${googleTotals?.leads || 0}\n${googleCampaigns.slice(0, 20).map(c => `  [${c.status || 'ACTIVE'}] ${c.name} — R$${(c.spend || 0).toFixed(2)} | Leads ${c.leads || 0}`).join('\n')}\n`
    : ''

  return `Você é um consultor sênior de tráfego pago com 10+ anos de experiência no mercado brasileiro. Especialista em Meta Ads e Google Ads. Já gerenciou mais de R$50M em investimento.

REGRAS: Use nomes EXATOS das campanhas. Cite NÚMEROS REAIS. Classifique cada campanha como ESCALAR/MANTER/PAUSAR. Seja direto.

=== DADOS DO CLIENTE ===
Cliente: ${clientName} | Nicho: ${niche} | Budget: R$${budget}/mês | Objetivo: ${objective}

${anomalySection}${rankingText}${metaSummary}${googleSummary}
=== CONSOLIDADO ===
Investimento: R$${totalSpend.toFixed(2)} | Leads: ${totalLeads} | CPL: R$${realCPL}

${benchmarkText ? `=== BENCHMARK (${niche}) ===\n${benchmarkText}` : ''}

Responda APENAS com JSON válido (sem markdown):
{
  "score_conta": <0-100>,
  "grade": "<A+|A|A-|B+|B|B-|C+|C|D>",
  "resumo_executivo": "<2-3 frases com números críticos>",
  "diagnostico": ["<diag 1>","<diag 2>","<diag 3>"],
  "erros_criticos": ["<erro com nome da campanha>"],
  "gargalos": [{"rank":1,"titulo":"<gargalo>","descricao":"<com métricas>","impacto":"<R$ ou %>"}],
  "oportunidades": [{"titulo":"<oportunidade>","descricao":"<como capitalizar>","potencial":"<resultado>"}],
  "plano_acao": {
    "curto": [{"acao":"<7 dias>","como":"<passo a passo>","impacto":"<resultado>"}],
    "medio": [{"acao":"<30 dias>","como":"<execução>","impacto":"<resultado>"}],
    "longo": [{"acao":"<90 dias>","como":"<estratégia>","impacto":"<transformação>"}]
  }
}`
}

async function runAuditor(input: PipelineInput) {
  const prompt = buildAuditPrompt(input)
  const result = await callLLMJson<any>({ user: prompt, maxTokens: 6000 })
  const allCampaigns = [...(input.metaCampaigns || []), ...(input.googleCampaigns || []), ...(input.uploadedCampaigns || [])]
  const totalSpend = (input.metaTotals?.spend || 0) + (input.googleTotals?.spend || 0) + (input.uploadedCampaigns || []).reduce((s: number, c: any) => s + (c.spend || 0), 0)
  const totalLeads = (input.metaTotals?.leads || 0) + (input.googleTotals?.leads || 0) + (input.uploadedCampaigns || []).reduce((s: number, c: any) => s + (c.leads || 0), 0)
  return { agent: 'auditor', ...result, real_metrics: { totalSpend: Math.round(totalSpend), totalLeads: Math.round(totalLeads), avgCPL: totalLeads > 0 ? Math.round(totalSpend / totalLeads) : null, campaignCount: allCampaigns.length }, generated_at: new Date().toISOString(), source: 'ai' }
}

// ── Agente 2: Data Analyst ───────────────────────────────────────────────────

function buildDataAnalystPrompt(input: PipelineInput, auditorOutput: any): string {
  const { clientName, niche, budget = 0, monthlyRevenue = 0, currentCPL, mainChallenge, currentLeadSource, isRecurring, objective, campaignHistory = [] } = input
  const bench = getBenchmark(niche)
  const benchmarkText = getBenchmarkSummary(niche)

  const margin  = (input.grossMargin ?? 40) / 100
  const cvr     = ((input.conversionRate ?? (bench?.cvr_lead_to_sale ?? 0.1) * 100)) / 100
  const ticket  = input.ticketPrice ?? bench?.avg_ticket ?? 1000
  const breakEvenROAS = margin > 0 ? +(1 / margin).toFixed(2) : 2.5
  const maxCPL = cvr > 0 ? Math.round(ticket * margin * cvr) : 0
  const ltv = isRecurring ? Math.round((ticket / 0.05) * margin) : Math.round(ticket * margin)
  const ltvCacRatio = maxCPL > 0 ? +(ltv / maxCPL).toFixed(1) : 3

  const historyCtx = campaignHistory.length > 0
    ? campaignHistory.slice(0, 10).map((c: any) => `• ${c.period} | ${c.channel} | R$${c.budgetSpent ?? '?'} | Leads: ${c.leads ?? '?'} | CPL: R$${c.cplReal ?? '?'} | ${c.outcome ?? '?'}`).join('\n')
    : 'Sem histórico.'

  const auditCtx = auditorOutput
    ? `CPL real: R$${auditorOutput.real_metrics?.avgCPL ?? 'N/A'} | Leads: ${auditorOutput.real_metrics?.totalLeads ?? 0} | Gasto: R$${auditorOutput.real_metrics?.totalSpend ?? 0}`
    : 'Sem auditoria.'

  return `Você é um Data Analyst SENIOR especialista em tráfego pago. Une CFO + CMO + Analista. Regras: dados quantitativos (% ou R$), cite nicho "${niche}" especificamente, use os unit economics como âncora.

Cliente: ${clientName} | Nicho: ${niche} | Budget: R$${budget} | Faturamento: R$${monthlyRevenue}
CPL atual: ${currentCPL ? `R$${currentCPL}` : 'N/A'} | Desafio: ${mainChallenge || 'N/A'} | Origem de leads: ${currentLeadSource || 'N/A'}

UNIT ECONOMICS: Ticket: R$${ticket} | Margem: ${(margin*100).toFixed(0)}% | CVR: ${(cvr*100).toFixed(0)}% | ROAS break-even: ${breakEvenROAS}× | CPL máx lucrativo: R$${maxCPL} | LTV: R$${ltv} | LTV:CAC: ${ltvCacRatio}×

HISTÓRICO: ${historyCtx}
AUDITORIA: ${auditCtx}
${benchmarkText ? `\nBENCHMARK (${niche}):\n${benchmarkText}` : ''}

Responda APENAS com JSON válido:
{
  "insights": ["<insight com número 1>","<insight 2>","<insight 3>"],
  "anomalias": [{"titulo":"<anomalia>","descricao":"<dado específico>","impacto":"<R$ ou %>"}],
  "segmentos_vencedores": [{"segmento":"<canal/público>","motivo":"<com dados>","metrica":"<CPL/CVR/ROAS>"}],
  "segmentos_perdedores": [{"segmento":"<canal/público>","motivo":"<com dados>","metrica":"<CPL/CVR/ROAS>"}],
  "recomendacoes": ["<recomendação acionável 1>","<recomendação 2>","<recomendação 3>"],
  "health_score": <0-100>,
  "grade": "<A+|A|A-|B+|B|B-|C+|C|D>",
  "executive_summary": "<2-3 frases com LTV:CAC, CPL vs break-even, projeção>",
  "saude_financeira": {
    "break_even_roas": ${breakEvenROAS},
    "cpl_maximo_lucrativo": ${maxCPL},
    "ltv_estimado": ${ltv},
    "cac_payback_meses": <número>,
    "ltv_cac_ratio": ${ltvCacRatio},
    "sustentabilidade": "<sustentavel|fragil|insustentavel>",
    "interpretacao": "<o que esses números SIGNIFICAM>"
  },
  "matriz_risco": [
    {"rank":1,"risco":"<risco com número>","probabilidade":"<alta|media|baixa>","impacto":"<critico|alto|medio|baixo>","mitigacao":"<ação específica>"},
    {"rank":2,"risco":"<risco 2>","probabilidade":"<alta|media|baixa>","impacto":"<critico|alto|medio|baixo>","mitigacao":"<ação>"},
    {"rank":3,"risco":"<risco 3>","probabilidade":"<alta|media|baixa>","impacto":"<critico|alto|medio|baixo>","mitigacao":"<ação>"}
  ],
  "prontidao_para_escalar": {
    "score": <0-100>,
    "pode_escalar_agora": <true|false>,
    "prerequisitos_faltando": ["<pré-req>"],
    "quando_escalar": "<condição>",
    "projecao_escala": {"budget_2x": ${(budget||0)*2},"leads_projetados":<número>,"receita_projetada":<número>}
  },
  "diagnostico_funil": {
    "etapas": [
      {"etapa":"Tráfego → Clique","status":"<saudavel|problema|nao_auditado>","observacao":"<CTR vs benchmark>"},
      {"etapa":"Clique → Lead","status":"<saudavel|problema|nao_auditado>","observacao":"<CPL vs break-even>"},
      {"etapa":"Lead → Atendimento","status":"<saudavel|problema|nao_auditado>","observacao":"<SLA>"},
      {"etapa":"Atendimento → Venda","status":"<saudavel|problema|nao_auditado>","observacao":"<CVR real>"}
    ],
    "gargalo_principal": "<trafego|pos-clique|atendimento|ambos>",
    "impacto_financeiro": "<R$ ou % perdido/mês>"
  },
  "recomendacao_principal": {
    "titulo": "<ação que muda tudo com número>",
    "descricao": "<por que supera as outras em ROI>",
    "acao_semana_1": "<7 dias>",
    "acao_mes_1": "<primeiro mês>",
    "acao_trimestre": "<90 dias>"
  },
  "inteligencia": [
    {"tipo":"oportunidade_mercado","icone":"🎯","titulo":"<oportunidade com %>","categoria":"Mercado","categoriaColor":"#F0B429","insight":"<o que está acontecendo em ${niche} agora>","dados":"<3 métricas>","acao_concreta":"<próximos 7 dias>","potencial":"<% ou R$>"},
    {"tipo":"audiencia_avancada","icone":"👥","titulo":"<segmento subexplorado>","categoria":"Audiência","categoriaColor":"#22C55E","insight":"<comportamento de compra>","dados":"<horários, dispositivos>","acao_concreta":"<como criar/testar>","potencial":"<impacto no CPL>"},
    {"tipo":"alocacao_orcamento","icone":"💰","titulo":"<redistribuição que maximiza ROAS>","categoria":"Orçamento","categoriaColor":"#38BDF8","insight":"<onde está subperformando>","dados":"<canal A X%, canal B Y%>","acao_concreta":"<como redistribuir R$${budget||0}>","potencial":"<redução CPL>"},
    {"tipo":"analise_competitiva","icone":"🔍","titulo":"<estratégia competitiva>","categoria":"Competição","categoriaColor":"#A78BFA","insight":"<o que concorrentes erram>","dados":"<comportamento vs conversão>","acao_concreta":"<como diferenciar>","potencial":"<ganho market share>"},
    {"tipo":"escala_inteligente","icone":"📈","titulo":"<estratégia de escala>","categoria":"Escala","categoriaColor":"#FB923C","insight":"<o que precisa antes de escalar>","dados":"<métricas-gatilho>","acao_concreta":"<plano 3 fases>","potencial":"<projeção leads/receita>"},
    {"tipo":"criativo_estrategico","icone":"🎨","titulo":"<ângulo criativo eficiente>","categoria":"Criativo","categoriaColor":"#EC4899","insight":"<o que move o público de ${niche}>","dados":"<CTR por gancho>","acao_concreta":"<brief do próximo criativo>","potencial":"<aumento CTR / redução CPL>"}
  ],
  "benchmark_comparativo": {
    "cpl_atual": ${currentCPL || 0},
    "cpl_benchmark": <CPL médio do nicho>,
    "cpl_status": "<excelente|bom|atencao|critico>",
    "roas_break_even": ${breakEvenROAS},
    "roas_bom_nicho": <ROAS bom do nicho>,
    "melhores_canais": <array dos melhores canais>,
    "insights_nicho": <array dos insights principais>
  }
}`
}

async function runDataAnalyst(input: PipelineInput, auditorOutput: any) {
  const prompt = buildDataAnalystPrompt(input, auditorOutput)
  const result = await callLLMJson<any>({ user: prompt, maxTokens: 8000 })
  return { agent: 'data_analyst', ...result, generated_at: new Date().toISOString(), source: 'ai' }
}

// ── Agente 3: Estrategista ────────────────────────────────────────────────────

function buildEstrategistaPrompt(input: PipelineInput): string {
  const { clientName, niche, products = [], budget = 0, objective = 'Gerar leads qualificados', monthlyRevenue = 0, nicheDetails = {}, city, currentCPL, currentLeadSource, mainChallenge, campaignHistory = [], ticketPrice, grossMargin, isRecurring, conversionRate, avgChurnMonthly } = input

  const bench = getBenchmark(niche)
  const benchmarkSection = getBenchmarkSummary(niche)
  const nicheContext = buildNichePromptContext(niche, nicheDetails)

  const ticket = ticketPrice || bench?.avg_ticket || 0
  const margin = grossMargin ? grossMargin / 100 : null
  const cvr    = conversionRate ? conversionRate / 100 : bench?.cvr_lead_to_sale || null
  const breakEvenROAS  = margin ? +(1 / margin).toFixed(2) : null
  const maxProfitCPL   = margin && cvr && ticket ? Math.round(ticket * margin * cvr) : null
  const ltv            = isRecurring && ticket && margin ? Math.round((ticket / ((avgChurnMonthly || 5) / 100)) * margin) : null

  const unitEconCtx = (breakEvenROAS || maxProfitCPL || ltv)
    ? `\nUNIT ECONOMICS:\n${ticket ? `Ticket: R$${ticket}` : ''} ${margin ? `| Margem: ${(margin*100).toFixed(0)}%` : ''} ${cvr ? `| CVR: ${(cvr*100).toFixed(1)}%` : ''}\n${breakEvenROAS ? `ROAS break-even: ${breakEvenROAS}×` : ''} ${maxProfitCPL ? `| CPL máx lucrativo: R$${maxProfitCPL}` : ''} ${ltv ? `| LTV: R$${ltv}` : ''}`
    : ''

  const historyCtx = campaignHistory.length > 0
    ? `\nHISTÓRICO REAL:\n${campaignHistory.map((c: any) => `• ${c.channel} | ${c.period} | R$${c.budgetSpent ?? '?'} | CPL: R$${c.cplReal ?? '?'} | ${c.outcome ?? '?'} — Funcionou: ${c.whatWorked || '—'}`).join('\n')}`
    : ''

  return `Você é Head de Growth e gestor sênior de tráfego pago com 10+ anos no mercado brasileiro. Pensa em unit economics, CAC payback, LTV e margem.

Cliente: ${clientName} | Nicho: ${niche} | Cidade: ${city || 'N/A'}
Produtos: ${products.join(', ') || 'N/A'} | Budget: R$${budget} | Objetivo: ${objective}
Faturamento: R$${monthlyRevenue}/mês ${currentCPL ? `| CPL atual: R$${currentCPL}` : ''} ${mainChallenge ? `| Desafio: ${mainChallenge}` : ''}
${unitEconCtx}${historyCtx}
${benchmarkSection ? `\nBENCHMARKS:\n${benchmarkSection}` : ''}${nicheContext ? `\nCONTEXTO DO NICHO:${nicheContext}` : ''}

Responda APENAS com JSON válido:
{
  "intelligence_score": <0-100>,
  "score_label": "<Básica|Boa|Avançada|Excelente>",
  "recommendation": "<insight principal 2-3 frases>",
  "estimated_monthly_revenue_range": "R$X–Y",
  "regulatory_alerts": ["<alerta regulatório se houver>"],
  "growth_diagnosis": {
    "main_problem": "<maior problema em 1-2 frases>",
    "waste_analysis": ["<desperdício 1>","<desperdício 2>","<desperdício 3>"],
    "growth_blockers": ["<gargalo 1>","<gargalo 2>","<gargalo 3>"],
    "funnel_health": {
      "tofu": {"status":"<ok|atenção|crítico>","issue":"<problema>","action":"<ação corretiva>"},
      "mofu": {"status":"<ok|atenção|crítico>","issue":"<problema>","action":"<ação corretiva>"},
      "bofu": {"status":"<ok|atenção|crítico>","issue":"<problema>","action":"<ação corretiva>"}
    }
  },
  "funnel_strategy": {
    "tofu": {"goal":"<meta>","channels":["<canal1>","<canal2>"],"tactics":["<tática 1>","<tática 2>","<tática 3>"]},
    "mofu": {"goal":"<meta>","tactics":["<tática 1>","<tática 2>","<tática 3>"]},
    "bofu": {"goal":"<meta>","tactics":["<tática 1>","<tática 2>","<tática 3>"]}
  },
  "optimization_scale": {
    "cpl_target": <CPL alvo R$>,
    "scale_actions": ["<o que escalar 1>","<o que escalar 2>"],
    "cut_immediately": ["<o que cortar 1>","<o que cortar 2>"],
    "ab_tests": ["<teste A/B 1>","<teste 2>","<teste 3>"]
  },
  "brand_positioning": {
    "authority_strategies": ["<estratégia 1>","<estratégia 2>"],
    "communication_adjustments": ["<ajuste 1>","<ajuste 2>"],
    "value_perception": ["<ação 1>","<ação 2>"]
  },
  "vision_360": {
    "website_improvements": ["<melhoria 1>","<melhoria 2>"],
    "sales_alignment": ["<alinhamento 1>","<alinhamento 2>"],
    "off_ads_opportunities": ["<oportunidade 1>","<oportunidade 2>"]
  },
  "priority_ranking": [
    {"channel":"<nome>","priority":1,"budget_pct":<0-100>,"budget_brl":<valor>,"cpl_min":<num>,"cpl_max":<num>,"cpl_avg":<num>,"leads_min":<num>,"leads_max":<num>,"roi_range":"<X%–Y%>","revenue_min":<num>,"revenue_max":<num>,"rationale":"<por que este canal>"}
  ],
  "recommended_channels_names": ["<canal1>","<canal2>"],
  "plan_90_days": [
    {"month":1,"goal":"<objetivo>","week_1":["<ação>"],"week_2":["<ação>"],"week_3":["<ação>"],"week_4":["<ação>"]},
    {"month":2,"goal":"<objetivo>","week_1":["<ação>"],"week_2":["<ação>"],"week_3":["<ação>"],"week_4":["<ação>"]},
    {"month":3,"goal":"<objetivo>","week_1":["<ação>"],"week_2":["<ação>"],"week_3":["<ação>"],"week_4":["<ação>"]}
  ],
  "key_actions": ["<ação 1>","<ação 2>","<ação 3>","<ação 4>","<ação 5>"]
}`
}

async function runEstrategista(input: PipelineInput) {
  const prompt = buildEstrategistaPrompt(input)
  const result = await callLLMJson<any>({ user: prompt, maxTokens: 6000 })
  return { agent: 'estrategista', ...result, generated_at: new Date().toISOString(), source: 'ai' }
}

// ── Agente 4: Copywriter ─────────────────────────────────────────────────────

function buildCopywriterPrompt(input: PipelineInput, estrategistaOutput: any): string {
  const { clientName, niche, products = [], nicheDetails = {}, currentCPL, copyBriefing = {} } = input
  const cb = copyBriefing
  const bench = getBenchmark(niche)
  const benchmarkSection = getBenchmarkSummary(niche)
  const nicheContext = buildNichePromptContext(niche, nicheDetails)

  const product    = cb.product || products[0] || 'Produto/serviço principal'
  const platforms  = cb.platforms || ['meta_feed', 'google_search']
  const frameworks = cb.frameworks || ['dor', 'desejo', 'prova_social', 'urgencia']
  const formats    = cb.formats || ['imagem', 'carrossel', 'video_curto']
  const totalVars  = frameworks.length * 2

  const strategyChannels = estrategistaOutput?.recommended_channels_names
  const cpl_target       = estrategistaOutput?.optimization_scale?.cpl_target || currentCPL

  return `Você é copywriter sênior de tráfego pago, escola direct response, adaptado ao mercado brasileiro. Regras: terminologia correta do nicho "${niche}", cada variação com GANCHO diferente, headlines máx 40 chars, CTAs específicos com verbo de ação.

BRIEFING:
Cliente: ${clientName} | Nicho: ${niche} | Produto: ${product}
Oferta: ${cb.offer || 'Criar oferta relevante para o nicho'} | Público: ${cb.targetAudience || 'Inferir do nicho'}
Dor principal: ${cb.mainPain || 'Inferir do nicho'} | Desejo: ${cb.mainDesire || 'Inferir do nicho'}
Objeções: ${(cb.objections || []).join(' | ') || 'Inferir do nicho'}
Diferenciais: ${(cb.differentials || []).join(' | ') || 'Nenhum informado'}
Tom: ${cb.tone || 'Consultivo e direto'}
Plataformas: ${platforms.join(', ')} | Frameworks: ${frameworks.join(', ')}
${strategyChannels ? `Canais da estratégia: ${strategyChannels.join(', ')}` : ''}
${cpl_target ? `CPL alvo: R$${cpl_target}` : ''}

${benchmarkSection ? `BENCHMARK:\n${benchmarkSection}` : ''}${nicheContext ? `\nCONTEXTO DO NICHO:${nicheContext}` : ''}${bench?.insights?.length ? `\nINSIGHTS DO NICHO:\n${bench.insights.map((i: string) => `- ${i}`).join('\n')}` : ''}

Gerar ${totalVars} variações (2 por framework). Responda APENAS com JSON válido:
{
  "briefing_resumo": "<resumo em 1 frase>",
  "tom_de_voz": "<vocabulário, ritmo, gatilhos>",
  "big_idea": "<conceito central único>",
  "variacoes": [
    {
      "framework": "<dor|desejo|prova_social|autoridade|urgencia|transformacao|objecao|curiosidade>",
      "titulo": "<headline até 40 chars>",
      "subtitulo": "<subhead opcional até 60 chars>",
      "corpo": "<corpo: 2-4 frases Meta / 90 chars Google>",
      "cta": "<CTA específico com verbo>",
      "formato_sugerido": "<imagem|carrossel|video_curto|video_longo|texto>",
      "plataforma": "<meta_feed|meta_stories|meta_reels|google_search|tiktok|youtube>",
      "gancho": "<primeira frase que prende>",
      "beneficio_principal": "<benefício único>",
      "prova": "<dado, depoimento ou garantia>",
      "quebra_objecao": "<objeção quebrada>",
      "notas_criativo": "<instruções visuais para o designer>",
      "teste_hipotese": "<o que esta variação testa>"
    }
  ],
  "variacoes_por_framework": {},
  "recomendacoes_criativas": ["<recomendação 1>","<recomendação 2>","<recomendação 3>"],
  "headlines_alternativas": ["<headline 1>","<headline 2>","<headline 3>","<até 10>"],
  "ctas_alternativos": ["<CTA 1>","<CTA 2>","<CTA 3>"],
  "angulos_a_evitar": ["<ângulo que não funciona no nicho>"],
  "plano_de_teste": [
    {"fase":"Semana 1","teste":"<teste A/B>","metrica":"<CTR|CPC|CPL>"},
    {"fase":"Semana 2","teste":"<teste>","metrica":"<métrica>"},
    {"fase":"Semana 3","teste":"<teste>","metrica":"<métrica>"}
  ]
}`
}

async function runCopywriter(input: PipelineInput, estrategistaOutput: any) {
  const prompt = buildCopywriterPrompt(input, estrategistaOutput)
  const result = await callLLMJson<any>({ user: prompt, maxTokens: 8000 })
  return { agent: 'copywriter', ...result, generated_at: new Date().toISOString(), source: 'ai' }
}

// ── Agente 5: Report ─────────────────────────────────────────────────────────

function buildReportPrompt(input: PipelineInput, auditor: any, dataAnalyst: any, estrategista: any, copywriter: any): string {
  const { clientName, niche, budget = 0, objective, monthlyRevenue, currentCPL, mainChallenge } = input
  const format = input.reportFormat || 'executive'

  const fmtInstr = {
    executive: 'Tom C-level. Linguagem de sala de reunião. Números antes de opiniões. Impacto financeiro.',
    tactical:  'Tom operacional. Foco em EXECUÇÃO — quem faz o quê, em qual ordem. Mais checklist.',
    investor:  'Tom pitch para comitê. Oportunidade, tração e capital. Unit economics e projeção.',
  }[format]

  const audCtx = auditor ? `=== AUDITOR (${auditor.score_conta}/100 ${auditor.grade}) ===\n${auditor.resumo_executivo}\nGargalos: ${(auditor.gargalos || []).slice(0,3).map((g: any) => `[${g.rank}] ${g.titulo} → ${g.impacto}`).join(' | ')}\nOportunidades: ${(auditor.oportunidades || []).slice(0,3).map((o: any) => o.titulo).join(' | ')}` : ''
  const daCtx  = dataAnalyst ? `=== DATA ANALYST (${dataAnalyst.health_score}/100 ${dataAnalyst.grade}) ===\n${dataAnalyst.executive_summary}\nInsights: ${(dataAnalyst.insights || []).slice(0,3).join(' | ')}\nSaúde financeira: break-even ${dataAnalyst.saude_financeira?.break_even_roas}× | CPL máx lucrativo R$${dataAnalyst.saude_financeira?.cpl_maximo_lucrativo} | LTV:CAC ${dataAnalyst.saude_financeira?.ltv_cac_ratio}×\nEscala: ${dataAnalyst.prontidao_para_escalar?.pode_escalar_agora ? 'PODE ESCALAR' : 'NÃO ESCALAR AINDA'} (score ${dataAnalyst.prontidao_para_escalar?.score})` : ''
  const stCtx  = estrategista ? `=== ESTRATEGISTA (${estrategista.intelligence_score} ${estrategista.score_label}) ===\n${estrategista.recommendation}\nCanais: ${(estrategista.recommended_channels_names || []).join(', ')} | CPL alvo: R$${estrategista.optimization_scale?.cpl_target}` : ''
  const cpCtx  = copywriter ? `=== COPYWRITER ===\nBig idea: ${copywriter.big_idea} | ${(copywriter.variacoes || []).length} variações geradas` : ''

  return `Você é diretor de planejamento sênior de agência de tráfego pago. CONSOLIDE os 4 agentes em um relatório único. NUNCA repita texto bruto — sintetize. Cruze dados. Priorize por ROI.

${fmtInstr}

=== CLIENTE === ${clientName} | ${niche} | R$${budget}/mês | ${objective || ''} | Faturamento: R$${monthlyRevenue || 'N/A'} | CPL: ${currentCPL ? `R$${currentCPL}` : 'N/A'} | Desafio: ${mainChallenge || 'N/A'}

${audCtx}
${daCtx}
${stCtx}
${cpCtx}

Responda APENAS com JSON válido. Gere ENTRE 8 E 15 ações em plano_acao:
{
  "titulo": "<Diagnóstico 360° — ${clientName}>",
  "cliente": "${clientName}",
  "nicho": "${niche}",
  "score_geral": <0-100>,
  "grade": "<A+|A|A-|B+|B|B-|C+|C|D>",
  "sumario_executivo": "<3-5 frases com números reais dos agentes>",
  "kpis_chave": [
    {"nome":"CPL atual","valor":"<R$X>","status":"<excelente|bom|atencao|critico>","benchmark":"<vs benchmark>"},
    {"nome":"ROAS break-even","valor":"<X×>","status":"<status>","benchmark":"<vs atual>"},
    {"nome":"LTV:CAC","valor":"<X×>","status":"<status>","benchmark":"<mínimo 3×>"},
    {"nome":"Health score","valor":"<X/100>","status":"<status>","benchmark":"<posição>"},
    {"nome":"Budget eficiência","valor":"<%>","status":"<status>","benchmark":"<ideal>"}
  ],
  "principais_descobertas": ["<descoberta cruzando 2+ agentes>","<descoberta 2>","<descoberta 3>","<descoberta 4>","<descoberta 5>"],
  "riscos_criticos": ["<risco com R$ ou %>","<risco 2>","<risco 3>"],
  "oportunidades_principais": ["<oportunidade com potencial quantificado>","<oportunidade 2>","<oportunidade 3>"],
  "plano_acao": [
    {
      "id": "acao_1",
      "prioridade": "<critica|alta|media|baixa>",
      "categoria": "<Tracking|Criativos|Audiências|Funil|Escala|Estrutura|Orçamento|Copy|Processo>",
      "titulo": "<até 8 palavras>",
      "descricao": "<o que fazer e por quê com números>",
      "como": "<passo a passo>",
      "impacto": "<resultado em % ou R$>",
      "prazo": "<Imediato|7 dias|30 dias|90 dias>",
      "responsavel_sugerido": "<Gestor|Copy|Designer|Vendas|Cliente>"
    }
  ],
  "projecao_90_dias": {
    "cenario_base": "<leads/receita/CPL mantendo atual>",
    "cenario_otimizado": "<leads/receita/CPL executando o plano>",
    "premissas": ["<premissa 1>","<premissa 2>","<premissa 3>"]
  },
  "proximos_passos_imediatos": ["<ação prioritária 7 dias #1>","<ação 2>","<ação 3>","<ação 4>","<ação 5>"],
  "slide_pitch": "<3-5 bullets em markdown para reunião rápida — use \\n•>"
}`
}

async function runReport(input: PipelineInput, auditor: any, dataAnalyst: any, estrategista: any, copywriter: any) {
  const prompt = buildReportPrompt(input, auditor, dataAnalyst, estrategista, copywriter)
  const result = await callLLMJson<any>({ user: prompt, maxTokens: 8000 })
  const plano = (result.plano_acao || []).map((a: any, i: number) => ({ ...a, id: a.id || `acao_${i+1}` }))
  return { agent: 'report', ...result, plano_acao: plano, generated_at: new Date().toISOString(), source: 'ai' }
}

// ── Orquestrador principal ───────────────────────────────────────────────────

export async function runPipeline(input: PipelineInput): Promise<PipelineOutput> {
  const started   = Date.now()
  const skip      = new Set(input.skipAgents || [])
  const executed: string[] = []
  const errors:   { agent: string; message: string }[] = []

  let auditor:     any = null
  let dataAnalyst: any = null
  let estrategista: any = null
  let copywriter:  any = null
  let report:      any = null

  if (!skip.has('auditor')) {
    try { auditor = await runAuditor(input); executed.push('auditor') }
    catch (e: any) { errors.push({ agent: 'auditor', message: e.message }) }
  }

  if (!skip.has('data_analyst')) {
    try { dataAnalyst = await runDataAnalyst(input, auditor); executed.push('data_analyst') }
    catch (e: any) { errors.push({ agent: 'data_analyst', message: e.message }) }
  }

  if (!skip.has('estrategista')) {
    try { estrategista = await runEstrategista(input); executed.push('estrategista') }
    catch (e: any) { errors.push({ agent: 'estrategista', message: e.message }) }
  }

  if (!skip.has('copywriter')) {
    try { copywriter = await runCopywriter(input, estrategista); executed.push('copywriter') }
    catch (e: any) { errors.push({ agent: 'copywriter', message: e.message }) }
  }

  if (!skip.has('report')) {
    try { report = await runReport(input, auditor, dataAnalyst, estrategista, copywriter); executed.push('report') }
    catch (e: any) { errors.push({ agent: 'report', message: e.message }) }
  }

  const finished = Date.now()

  return {
    pipeline: 'elyon_full',
    client: input.clientName,
    niche: input.niche,
    executed_agents: executed,
    skipped_agents: Array.from(skip),
    auditor,
    data_analyst: dataAnalyst,
    estrategista,
    copywriter,
    report,
    started_at: new Date(started).toISOString(),
    finished_at: new Date(finished).toISOString(),
    duration_ms: finished - started,
    errors,
  }
}
