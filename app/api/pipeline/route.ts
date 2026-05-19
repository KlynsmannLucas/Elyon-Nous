// app/api/pipeline/route.ts — Pipeline 360° ELYON via Anthropic SDK
// Executa 5 agentes em duas fases paralelas + report final, com SSE.

import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { getBenchmark, getBenchmarkSummary } from '@/lib/niche_benchmarks'
import { buildNichePromptContext } from '@/lib/niche_prompts'
import Anthropic from '@anthropic-ai/sdk'

// Aumenta o timeout do Vercel para 300s (suporta streaming long-running)
export const maxDuration = 300

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
  if (!key) throw new Error('ANTHROPIC_API_KEY não configurada no servidor')
  return new Anthropic({ apiKey: key })
}

// Retorna null em vez de lançar para erros de JSON — o pipeline continua
async function callLLMJson<T>(anthropic: Anthropic, prompt: string, maxTokens: number): Promise<T> {
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    system: 'Você é um especialista em marketing digital e tráfego pago. Responda APENAS com JSON válido e completo. Sem markdown, sem texto antes ou depois.',
    messages: [{ role: 'user', content: prompt }],
  })
  const block = msg.content[0]
  if (block.type !== 'text') throw new Error('LLM retornou conteúdo não-texto')
  let str = block.text.trim()

  // Remove markdown fences
  if (str.startsWith('```')) {
    str = str.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
  }
  // Descarta texto antes do primeiro { ou [
  const firstBrace = str.search(/[\[{]/)
  if (firstBrace > 0) str = str.slice(firstBrace)

  try { return JSON.parse(str) as T }
  catch {
    const objMatch = str.match(/(\{[\s\S]*\})/)
    if (objMatch) { try { return JSON.parse(objMatch[1]) as T } catch {} }
    const arrMatch = str.match(/(\[[\s\S]*\])/)
    if (arrMatch) { try { return JSON.parse(arrMatch[1]) as T } catch {} }
    // Último recurso: corta no último } ou ] válido
    const cutObj = str.lastIndexOf('}')
    const cutArr = str.lastIndexOf(']')
    const cut = Math.max(cutObj, cutArr)
    if (cut > 50) {
      try { return JSON.parse(str.slice(0, cut + 1)) as T } catch {}
    }
    throw new Error('JSON inválido na resposta do agente. Tente reanalisar.')
  }
}

// ── Normaliza métricas para evitar NaN / Infinity ────────────────────────────
function safeDiv(a: number, b: number, decimals = 2): number | null {
  if (!b || b === 0 || !isFinite(b)) return null
  const r = a / b
  return isFinite(r) ? +r.toFixed(decimals) : null
}

// ── Normaliza campanhas de qualquer plataforma ────────────────────────────────
function normalizeCampaigns(campaigns: any[], platform: 'meta' | 'google'): any[] {
  return campaigns.map(c => {
    const spend       = Number(c.spend) || 0
    const impressions = Number(c.impressions) || 0
    const clicks      = Number(c.clicks) || 0
    const leads       = Number(c.leads ?? c.conversions ?? 0)
    const reach       = Number(c.reach ?? 0)
    const frequency   = reach > 0 ? safeDiv(impressions, reach) ?? 0 : Number(c.frequency ?? 0)
    const ctr         = c._normalized?.ctr ?? safeDiv(clicks, impressions, 4) ?? 0
    const cpc         = c._normalized?.cpc ?? safeDiv(spend, clicks) ?? 0
    const cpl         = c._normalized?.cpl ?? (leads > 0 ? safeDiv(spend, leads) : null)
    const roas        = c._normalized?.roas ?? (spend > 0 ? safeDiv(Number(c.revenue ?? 0), spend) : null)

    return {
      id: c.id || c.campaign_id || c.name,
      name: c.campaign_name || c.name || 'Sem nome',
      platform,
      status: c.status || c.effective_status || (platform === 'meta' ? 'ACTIVE' : 'ENABLED'),
      spend, impressions, clicks,
      ctr:  ctr  ? +(ctr * 100).toFixed(2) : 0,    // como %
      cpc:  cpc  ? +cpc.toFixed(2) : 0,
      cpl:  cpl  ? +cpl.toFixed(2) : null,
      leads, reach, frequency: +frequency.toFixed(2),
      roas: roas ? +roas.toFixed(2) : null,
    }
  })
}

// ── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  let input: any
  try {
    input = await req.json()
  } catch {
    return new Response('Body JSON inválido', { status: 400 })
  }

  if (!input?.clientName || !input?.niche) {
    return new Response('clientName e niche são obrigatórios', { status: 400 })
  }

  let anthropic: Anthropic
  try {
    anthropic = getAnthropic()
  } catch (e: any) {
    return new Response(e.message, { status: 503 })
  }

  const skip = new Set<string>(input.skipAgents || [])

  // Normaliza dados de campanha antes de passar aos agentes
  const metaCampaigns    = normalizeCampaigns(input.metaCampaigns    || [], 'meta')
  const googleCampaigns  = normalizeCampaigns(input.googleCampaigns  || [], 'google')
  const uploadedCampaigns = normalizeCampaigns(input.uploadedCampaigns || [], 'meta')

  const normalizedInput = {
    ...input,
    metaCampaigns,
    googleCampaigns,
    uploadedCampaigns,
    hasMeta:   metaCampaigns.length > 0 || !!input.metaTotals,
    hasGoogle: googleCampaigns.length > 0 || !!input.googleTotals,
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try { controller.enqueue(new TextEncoder().encode(sseEvent(data))) } catch {}
      }

      const results:  Record<string, any> = {}
      const errors:   { agent: string; message: string }[] = []
      const executed: string[] = []
      const startedAt = Date.now()

      const total = ['auditor', 'data_analyst', 'estrategista', 'copywriter', 'report'].filter(a => !skip.has(a)).length
      send({ type: 'start', total, client: input.clientName, hasMeta: normalizedInput.hasMeta, hasGoogle: normalizedInput.hasGoogle })

      try {
        // ── FASE 1: Auditor + Estrategista em paralelo (independentes) ──────────
        const phase1 = (['auditor', 'estrategista'] as const).filter(a => !skip.has(a))
        if (phase1.length > 0) {
          for (const a of phase1) send({ type: 'agent_start', agent: a, label: AGENT_LABELS[a] })
          const p1 = await Promise.allSettled(phase1.map(a => runAgent(anthropic, a, normalizedInput, results)))
          for (let i = 0; i < phase1.length; i++) {
            const agent = phase1[i]
            const r = p1[i]
            if (r.status === 'fulfilled') {
              results[agent] = r.value
              executed.push(agent)
              send({ type: 'agent_done', agent, result: r.value, duration_ms: Date.now() - startedAt })
            } else {
              errors.push({ agent, message: r.reason?.message || 'Erro desconhecido' })
              send({ type: 'agent_error', agent, message: r.reason?.message || 'Erro desconhecido' })
            }
          }
        }

        // ── FASE 2: Data Analyst (pós-Auditor) + Copywriter (pós-Estrategista) ─
        const phase2 = (['data_analyst', 'copywriter'] as const).filter(a => !skip.has(a))
        if (phase2.length > 0) {
          for (const a of phase2) send({ type: 'agent_start', agent: a, label: AGENT_LABELS[a] })
          const p2 = await Promise.allSettled(phase2.map(a => runAgent(anthropic, a, normalizedInput, results)))
          for (let i = 0; i < phase2.length; i++) {
            const agent = phase2[i]
            const r = p2[i]
            if (r.status === 'fulfilled') {
              results[agent] = r.value
              executed.push(agent)
              send({ type: 'agent_done', agent, result: r.value, duration_ms: Date.now() - startedAt })
            } else {
              errors.push({ agent, message: r.reason?.message || 'Erro desconhecido' })
              send({ type: 'agent_error', agent, message: r.reason?.message || 'Erro desconhecido' })
            }
          }
        }

        // ── FASE 3: Report (consolida tudo) ────────────────────────────────────
        if (!skip.has('report')) {
          send({ type: 'agent_start', agent: 'report', label: AGENT_LABELS['report'] })
          try {
            results['report'] = await runAgent(anthropic, 'report', normalizedInput, results)
            executed.push('report')
            send({ type: 'agent_done', agent: 'report', result: results['report'], duration_ms: Date.now() - startedAt })
          } catch (e: any) {
            errors.push({ agent: 'report', message: e.message })
            send({ type: 'agent_error', agent: 'report', message: e.message })
          }
        }

      } catch (e: any) {
        send({ type: 'fatal_error', message: e.message })
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
        duration_ms: Date.now() - startedAt,
        platforms: {
          meta:   normalizedInput.hasMeta,
          google: normalizedInput.hasGoogle,
        },
      })

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no', // desativa buffering no Nginx/Vercel proxy
    },
  })
}

// ── Dispatcher ───────────────────────────────────────────────────────────────

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

// ── Agente 1: Auditor ────────────────────────────────────────────────────────

async function runAuditor(anthropic: Anthropic, input: any) {
  const {
    clientName, niche, budget = 0, objective = '',
    metaCampaigns = [], googleCampaigns = [], metaTotals, googleTotals,
    uploadedCampaigns = [], hasMeta, hasGoogle,
  } = input

  const bench = getBenchmark(niche)
  const benchmarkText = getBenchmarkSummary(niche)
  const allCampaigns = [...metaCampaigns, ...googleCampaigns, ...uploadedCampaigns]

  const totalSpend  = +(((metaTotals?.spend || 0) + (googleTotals?.spend || 0) + uploadedCampaigns.reduce((s: number, c: any) => s + (c.spend || 0), 0)).toFixed(2))
  const totalLeads  = (metaTotals?.leads || 0) + (googleTotals?.leads || 0) + uploadedCampaigns.reduce((s: number, c: any) => s + (c.leads || 0), 0)
  const realCPL     = totalLeads > 0 ? safeDiv(totalSpend, totalLeads) ?? 0 : null

  const anomalies: string[] = []
  allCampaigns.filter((c: any) => (c.ctr || 0) > 10).forEach((c: any) =>
    anomalies.push(`⚠ CTR SUSPEITO (>10%): "${c.name}" — ${c.ctr}% — pode ser bot traffic`))
  allCampaigns.filter((c: any) => (c.roas || 0) > 40).forEach((c: any) =>
    anomalies.push(`⚠ ROAS IMPOSSÍVEL (>40×): "${c.name}" — ${c.roas}× — evento duplicado?`))
  allCampaigns.filter((c: any) => (c.spend || 0) > totalSpend * 0.08 && (c.leads || 0) === 0).forEach((c: any) =>
    anomalies.push(`🔴 DESPERDÍCIO CRÍTICO: "${c.name}" — R$${c.spend?.toFixed(0)} SEM nenhum lead`))
  allCampaigns.filter((c: any) => (c.frequency || 0) > 4).forEach((c: any) =>
    anomalies.push(`⚠ FADIGA CRIATIVA: "${c.name}" — frequência ${c.frequency?.toFixed(1)} (>4 = saturado)`))

  const ranked = [...allCampaigns].filter((c: any) => (c.spend || 0) > 0).sort((a: any, b: any) => {
    const cplA = (a.leads || 0) > 0 ? (a.cpl || a.spend / a.leads) : Infinity
    const cplB = (b.leads || 0) > 0 ? (b.cpl || b.spend / b.leads) : Infinity
    return cplA - cplB
  })

  const platformSection = [
    hasMeta ? `META ADS: R$${(metaTotals?.spend || 0).toFixed(0)} | CPL R$${metaTotals?.cpl || 0} | ROAS ${metaTotals?.roas || 0}× | Leads ${metaTotals?.leads || 0} | ${metaCampaigns.length} campanhas` : 'META ADS: não conectado',
    hasGoogle ? `GOOGLE ADS: R$${(googleTotals?.spend || 0).toFixed(0)} | CPL R$${googleTotals?.cpl || 0} | Leads ${googleTotals?.leads || 0} | ${googleCampaigns.length} campanhas` : 'GOOGLE ADS: não conectado',
  ].join('\n')

  const prompt = `Auditor sênior de tráfego pago — 10+ anos, R$50M+ gerenciados, mercado brasileiro.
Use NOMES EXATOS das campanhas. Cite NÚMEROS REAIS. Classifique campanhas: ESCALAR/MANTER/PAUSAR.

CLIENTE: ${clientName} | NICHO: ${niche} | BUDGET: R$${budget}/mês | OBJETIVO: ${objective}

PLATAFORMAS:
${platformSection}

${anomalies.length > 0 ? `ANOMALIAS DETECTADAS:\n${anomalies.join('\n')}\n` : 'QUALIDADE DOS DADOS: OK\n'}
${ranked.length > 0 ? `RANKING (eficiência por CPL):\n${ranked.slice(0, 15).map((c: any, i: number) => {
  const cpl_c = (c.leads || 0) > 0 ? Math.round((c.spend || 0) / (c.leads || 1)) : null
  const eff = cpl_c === null ? '⛔ SEM CONVERSÃO'
    : bench && cpl_c <= bench.cpl_min * 1.1 ? '🏆 EXCELENTE'
    : bench && cpl_c <= bench.cpl_max ? '✅ OK'
    : bench && cpl_c <= bench.cpl_max * 2 ? '⚠ ACIMA'
    : '🔴 CRÍTICO'
  return `  ${i + 1}. [${eff}] "${c.name}" [${c.platform}] — R$${Math.round(c.spend || 0)} | Leads: ${c.leads || 0} | CPL: ${cpl_c ? `R$${cpl_c}` : 'N/A'} | CTR: ${c.ctr || 0}%`
}).join('\n')}\n` : 'CAMPANHAS: nenhuma campanha com gasto encontrada.\n'}
CONSOLIDADO: R$${totalSpend.toFixed(0)} investido | ${totalLeads} leads | CPL ${realCPL !== null ? `R$${realCPL}` : 'N/A'}
${benchmarkText ? `\nBENCHMARK (${niche}):\n${benchmarkText}` : ''}

JSON:
{"score_conta":<0-100>,"grade":"<A+|A|A-|B+|B|B-|C+|C|D>","resumo_executivo":"<2-3 frases com números>","plataformas_analisadas":["<platform>"],"diagnostico":["<1>","<2>","<3>"],"erros_criticos":["<erro com nome da campanha>"],"gargalos":[{"rank":1,"titulo":"<gargalo>","descricao":"<métricas>","impacto":"<R$ ou %>","plataforma":"<meta|google|ambos>"}],"oportunidades":[{"titulo":"<oportunidade>","descricao":"<como capitalizar>","potencial":"<resultado>","plataforma":"<meta|google|ambos>"}],"campanhas_destaque":[{"nome":"<campanha>","acao":"<ESCALAR|MANTER|PAUSAR>","motivo":"<razão com número>","plataforma":"<meta|google>"}],"plano_acao":{"curto":[{"acao":"<7d>","como":"<passos>","impacto":"<resultado>"}],"medio":[{"acao":"<30d>","como":"<execução>","impacto":"<resultado>"}],"longo":[{"acao":"<90d>","como":"<estratégia>","impacto":"<transformação>"}]}}`

  const result = await callLLMJson<any>(anthropic, prompt, 6000)
  return {
    agent: 'auditor',
    ...result,
    real_metrics: {
      totalSpend: Math.round(totalSpend),
      totalLeads: Math.round(totalLeads),
      avgCPL: realCPL,
      campaignCount: allCampaigns.length,
      metaCampaigns: metaCampaigns.length,
      googleCampaigns: googleCampaigns.length,
    },
    generated_at: new Date().toISOString(),
    source: 'ai',
  }
}

// ── Agente 2: Data Analyst ────────────────────────────────────────────────────

async function runDataAnalyst(anthropic: Anthropic, input: any, auditorOutput: any) {
  const {
    clientName, niche, budget = 0, monthlyRevenue = 0, currentCPL,
    mainChallenge, isRecurring, campaignHistory = [],
    metaTotals, googleTotals, hasMeta, hasGoogle,
  } = input

  const bench = getBenchmark(niche)
  const benchmarkText = getBenchmarkSummary(niche)
  const margin  = ((input.grossMargin ?? 40)) / 100
  const cvr     = ((input.conversionRate ?? (bench?.cvr_lead_to_sale ?? 0.1) * 100)) / 100
  const ticket  = input.ticketPrice ?? bench?.avg_ticket ?? 1000
  const breakEvenROAS   = margin > 0 ? +(1 / margin).toFixed(2) : 2.5
  const maxCPL          = cvr > 0 ? Math.round(ticket * margin * cvr) : 0
  const ltv             = isRecurring ? Math.round((ticket / 0.05) * margin) : Math.round(ticket * margin)
  const ltvCacRatio     = maxCPL > 0 ? +(ltv / maxCPL).toFixed(1) : 3

  const metaVsGoogle = (hasMeta && hasGoogle) ? `
COMPARATIVO CANAIS:
Meta Ads: R$${(metaTotals?.spend || 0).toFixed(0)} | ${metaTotals?.leads || 0} leads | CPL R$${metaTotals?.cpl || 'N/A'} | ROAS ${metaTotals?.roas || 'N/A'}×
Google Ads: R$${(googleTotals?.spend || 0).toFixed(0)} | ${googleTotals?.leads || 0} leads | CPL R$${googleTotals?.cpl || 'N/A'}` : ''

  const prompt = `Data Analyst SENIOR — tráfego pago, une CFO + CMO. Dados quantitativos com % e R$.

CLIENTE: ${clientName} | NICHO: ${niche} | BUDGET: R$${budget} | FATURAMENTO: R$${monthlyRevenue}
${currentCPL ? `CPL atual: R$${currentCPL}` : ''} ${mainChallenge ? `| Desafio: ${mainChallenge}` : ''}

UNIT ECONOMICS:
Ticket: R$${ticket} | Margem: ${(margin*100).toFixed(0)}% | CVR: ${(cvr*100).toFixed(0)}%
ROAS break-even: ${breakEvenROAS}× | CPL máx lucrativo: R$${maxCPL} | LTV: R$${ltv} | LTV:CAC: ${ltvCacRatio}×
${metaVsGoogle}
${campaignHistory.length > 0 ? `\nHISTÓRICO:\n${campaignHistory.slice(0, 8).map((c: any) => `• ${c.period} | ${c.channel} | CPL: R$${c.cplReal ?? '?'} | ${c.outcome ?? '?'}`).join('\n')}` : ''}
${auditorOutput ? `\nAUDITOR: CPL real R$${auditorOutput.real_metrics?.avgCPL ?? 'N/A'} | Leads: ${auditorOutput.real_metrics?.totalLeads ?? 0} | Gasto: R$${auditorOutput.real_metrics?.totalSpend ?? 0} | Score: ${auditorOutput.score_conta}/100 ${auditorOutput.grade}` : ''}
${benchmarkText ? `\nBENCHMARK:\n${benchmarkText}` : ''}

JSON:
{"insights":["<insight com %>","<insight 2>","<insight 3>"],"anomalias":[{"titulo":"<anomalia>","descricao":"<dado>","impacto":"<R$/%>"}],"segmentos_vencedores":[{"segmento":"<canal>","motivo":"<com dados>","metrica":"<CPL/CVR/ROAS>"}],"segmentos_perdedores":[{"segmento":"<canal>","motivo":"<com dados>","metrica":"<CPL/CVR/ROAS>"}],"recomendacoes":["<ação 1>","<ação 2>","<ação 3>"],"health_score":<0-100>,"grade":"<A+|A|B+|B|C>","executive_summary":"<2-3 frases>","saude_financeira":{"break_even_roas":${breakEvenROAS},"cpl_maximo_lucrativo":${maxCPL},"ltv_estimado":${ltv},"cac_payback_meses":<num>,"ltv_cac_ratio":${ltvCacRatio},"sustentabilidade":"<sustentavel|fragil|insustentavel>","interpretacao":"<o que esses números significam>"},"matriz_risco":[{"rank":1,"risco":"<risco>","probabilidade":"<alta|media|baixa>","impacto":"<critico|alto|medio|baixo>","mitigacao":"<ação>"},{"rank":2,"risco":"<risco 2>","probabilidade":"<alta|media|baixa>","impacto":"<critico|alto|medio|baixo>","mitigacao":"<ação>"},{"rank":3,"risco":"<risco 3>","probabilidade":"<alta|media|baixa>","impacto":"<critico|alto|medio|baixo>","mitigacao":"<ação>"}],"prontidao_para_escalar":{"score":<0-100>,"pode_escalar_agora":<bool>,"prerequisitos_faltando":["<pré-req>"],"quando_escalar":"<condição>","projecao_escala":{"budget_2x":${(budget || 0) * 2},"leads_projetados":<num>,"receita_projetada":<num>}},"diagnostico_funil":{"etapas":[{"etapa":"Tráfego → Clique","status":"<saudavel|problema|nao_auditado>","observacao":"<CTR>"},{"etapa":"Clique → Lead","status":"<saudavel|problema|nao_auditado>","observacao":"<CPL>"},{"etapa":"Lead → Atendimento","status":"<saudavel|problema|nao_auditado>","observacao":"<SLA>"},{"etapa":"Atendimento → Venda","status":"<saudavel|problema|nao_auditado>","observacao":"<CVR>"}],"gargalo_principal":"<trafego|pos-clique|atendimento|ambos>","impacto_financeiro":"<R$/%>"},"recomendacao_principal":{"titulo":"<ação>","descricao":"<por quê supera as outras>","acao_semana_1":"<7d>","acao_mes_1":"<30d>","acao_trimestre":"<90d>"},"inteligencia":[{"tipo":"oportunidade_mercado","icone":"🎯","titulo":"<oportunidade>","categoria":"Mercado","categoriaColor":"#F0B429","insight":"<insight>","dados":"<dados>","acao_concreta":"<ação>","potencial":"<resultado>"},{"tipo":"audiencia_avancada","icone":"👥","titulo":"<segmento>","categoria":"Audiência","categoriaColor":"#22C55E","insight":"<insight>","dados":"<dados>","acao_concreta":"<ação>","potencial":"<resultado>"},{"tipo":"alocacao_orcamento","icone":"💰","titulo":"<redistribuição>","categoria":"Orçamento","categoriaColor":"#38BDF8","insight":"<insight>","dados":"<dados>","acao_concreta":"<ação>","potencial":"<resultado>"}],"benchmark_comparativo":{"cpl_atual":${currentCPL || 0},"cpl_benchmark":<num>,"cpl_status":"<excelente|bom|atencao|critico>","roas_break_even":${breakEvenROAS},"roas_bom_nicho":<num>,"melhores_canais":["<canal>"],"insights_nicho":["<insight>"]}}`

  const result = await callLLMJson<any>(anthropic, prompt, 8000)
  return { agent: 'data_analyst', ...result, generated_at: new Date().toISOString(), source: 'ai' }
}

// ── Agente 3: Estrategista ────────────────────────────────────────────────────

async function runEstrategista(anthropic: Anthropic, input: any) {
  const {
    clientName, niche, products = [], budget = 0, objective = 'Gerar leads',
    monthlyRevenue = 0, nicheDetails = {}, city, currentCPL, mainChallenge,
    campaignHistory = [], ticketPrice, grossMargin, isRecurring, conversionRate,
    hasMeta, hasGoogle,
  } = input

  const bench = getBenchmark(niche)
  const benchmarkSection = getBenchmarkSummary(niche)
  const nicheContext = buildNichePromptContext(niche, nicheDetails)
  const ticket  = ticketPrice || bench?.avg_ticket || 0
  const margin  = grossMargin ? grossMargin / 100 : null
  const cvr     = conversionRate ? conversionRate / 100 : bench?.cvr_lead_to_sale || null
  const breakEvenROAS = margin ? +(1 / margin).toFixed(2) : null
  const maxProfitCPL  = margin && cvr && ticket ? Math.round(ticket * margin * cvr) : null

  const channelsAvailable = [hasMeta && 'Meta Ads', hasGoogle && 'Google Ads'].filter(Boolean).join(' + ') || 'Nenhum conectado — recomende conexão'

  const prompt = `Head de Growth + gestor sênior de tráfego pago — 10+ anos no Brasil. Pensa em unit economics, CAC payback, LTV.

CLIENTE: ${clientName} | NICHO: ${niche} | CIDADE: ${city || 'N/A'}
PRODUTOS: ${products.join(', ') || 'N/A'} | BUDGET: R$${budget} | OBJETIVO: ${objective}
FATURAMENTO: R$${monthlyRevenue}/mês ${currentCPL ? `| CPL atual: R$${currentCPL}` : ''} ${mainChallenge ? `| Desafio: ${mainChallenge}` : ''}
${ticket ? `Ticket: R$${ticket}` : ''} ${margin ? `| Margem: ${(margin * 100).toFixed(0)}%` : ''} ${breakEvenROAS ? `| ROAS break-even: ${breakEvenROAS}×` : ''} ${maxProfitCPL ? `| CPL máx lucrativo: R$${maxProfitCPL}` : ''}
PLATAFORMAS CONECTADAS: ${channelsAvailable}

${campaignHistory.length > 0 ? `HISTÓRICO:\n${campaignHistory.slice(0, 6).map((c: any) => `• ${c.channel} | ${c.period} | CPL: R$${c.cplReal ?? '?'} | ${c.outcome ?? '?'}`).join('\n')}` : ''}
${benchmarkSection ? `\nBENCHMARKS:\n${benchmarkSection}` : ''}${nicheContext ? `\nCONTEXTO:\n${nicheContext}` : ''}

JSON:
{"intelligence_score":<0-100>,"score_label":"<Básica|Boa|Avançada|Excelente>","recommendation":"<2-3 frases>","estimated_monthly_revenue_range":"R$X–Y","regulatory_alerts":["<alerta>"],"growth_diagnosis":{"main_problem":"<problema>","waste_analysis":["<desperdício>","<2>","<3>"],"growth_blockers":["<gargalo>","<2>","<3>"],"funnel_health":{"tofu":{"status":"<ok|atenção|crítico>","issue":"<problema>","action":"<ação>"},"mofu":{"status":"<ok|atenção|crítico>","issue":"<problema>","action":"<ação>"},"bofu":{"status":"<ok|atenção|crítico>","issue":"<problema>","action":"<ação>"}}},"funnel_strategy":{"tofu":{"goal":"<meta>","channels":["<canal>"],"tactics":["<tática>","<2>","<3>"]},"mofu":{"goal":"<meta>","tactics":["<tática>","<2>"]},"bofu":{"goal":"<meta>","tactics":["<tática>","<2>"]}},"optimization_scale":{"cpl_target":<num>,"scale_actions":["<escalar>","<2>"],"cut_immediately":["<cortar>","<2>"],"ab_tests":["<teste>","<2>","<3>"]},"brand_positioning":{"authority_strategies":["<estratégia>","<2>"],"communication_adjustments":["<ajuste>","<2>"],"value_perception":["<ação>","<2>"]},"vision_360":{"website_improvements":["<melhoria>","<2>"],"sales_alignment":["<alinhamento>","<2>"],"off_ads_opportunities":["<oportunidade>","<2>"]},"priority_ranking":[{"channel":"<nome>","priority":1,"budget_pct":<0-100>,"budget_brl":<val>,"cpl_min":<num>,"cpl_max":<num>,"cpl_avg":<num>,"leads_min":<num>,"leads_max":<num>,"roi_range":"<X%–Y%>","revenue_min":<num>,"revenue_max":<num>,"rationale":"<por que>"}],"recommended_channels_names":["<canal>"],"plan_90_days":[{"month":1,"goal":"<objetivo>","week_1":["<ação>"],"week_2":["<ação>"],"week_3":["<ação>"],"week_4":["<ação>"]},{"month":2,"goal":"<objetivo>","week_1":["<ação>"],"week_2":["<ação>"],"week_3":["<ação>"],"week_4":["<ação>"]},{"month":3,"goal":"<objetivo>","week_1":["<ação>"],"week_2":["<ação>"],"week_3":["<ação>"],"week_4":["<ação>"]}],"key_actions":["<ação>","<2>","<3>","<4>","<5>"]}`

  const result = await callLLMJson<any>(anthropic, prompt, 6000)
  return { agent: 'estrategista', ...result, generated_at: new Date().toISOString(), source: 'ai' }
}

// ── Agente 4: Copywriter / Creative Strategist ───────────────────────────────

async function runCopywriter(anthropic: Anthropic, input: any, estrategistaOutput: any) {
  const {
    clientName, niche, products = [], nicheDetails = {},
    currentCPL, copyBriefing = {},
    metaCampaigns = [], googleCampaigns = [],
  } = input
  const cb = copyBriefing
  const bench = getBenchmark(niche)
  const benchmarkSection = getBenchmarkSummary(niche)
  const nicheContext = buildNichePromptContext(niche, nicheDetails)
  const product    = cb.product || products[0] || 'Produto/serviço principal'
  const frameworks = cb.frameworks || ['dor', 'desejo', 'prova_social', 'urgencia']
  const cpl_target = estrategistaOutput?.optimization_scale?.cpl_target || currentCPL

  // Criativos com fadiga (Meta)
  const fatigued = metaCampaigns.filter((c: any) => (c.frequency || 0) > 4)
  const fatigueCtx = fatigued.length > 0
    ? `\nCRIATIVOS COM FADIGA: ${fatigued.map((c: any) => `"${c.name}" (freq ${c.frequency})`).join(', ')} — precisa de renovação urgente`
    : ''

  // CTR por campanha para identificar hooks vencedores
  const allCamps = [...metaCampaigns, ...googleCampaigns].filter((c: any) => (c.clicks || 0) > 100)
  const topCTR = allCamps.sort((a: any, b: any) => (b.ctr || 0) - (a.ctr || 0)).slice(0, 3)
  const ctrCtx = topCTR.length > 0
    ? `\nHOOKS VENCEDORES (maior CTR): ${topCTR.map((c: any) => `"${c.name}" — CTR ${c.ctr}%`).join(' | ')}`
    : ''

  const prompt = `Copywriter sênior de tráfego pago — direct response, mercado brasileiro. Cada variação com GANCHO diferente. Headlines máx 40 chars. CTAs com verbo de ação.

CLIENTE: ${clientName} | NICHO: ${niche} | PRODUTO: ${product}
OFERTA: ${cb.offer || 'Criar oferta relevante'} | PÚBLICO: ${cb.targetAudience || 'Inferir do nicho'}
DOR: ${cb.mainPain || 'Inferir'} | DESEJO: ${cb.mainDesire || 'Inferir'}
OBJEÇÕES: ${(cb.objections || []).join(' | ') || 'Inferir'} | DIFERENCIAIS: ${(cb.differentials || []).join(' | ') || 'N/A'}
FRAMEWORKS: ${frameworks.join(', ')} | CPL ALVO: ${cpl_target ? `R$${cpl_target}` : 'Não definido'}
${estrategistaOutput?.recommended_channels_names ? `CANAIS DA ESTRATÉGIA: ${estrategistaOutput.recommended_channels_names.join(', ')}` : ''}
${fatigueCtx}${ctrCtx}
${benchmarkSection ? `\nBENCHMARK:\n${benchmarkSection}` : ''}${nicheContext ? `\nCONTEXTO:\n${nicheContext}` : ''}${bench?.insights?.length ? `\nINSIGHTS DO NICHO:\n${bench.insights.map((i: string) => `- ${i}`).join('\n')}` : ''}

Gere ${frameworks.length * 2} variações (2 por framework). JSON:
{"briefing_resumo":"<1 frase>","tom_de_voz":"<vocabulário, ritmo>","big_idea":"<conceito central>","criativos_vencedores":["<criativo com maior CTR>"],"variacoes":[{"framework":"<dor|desejo|prova_social|autoridade|urgencia|transformacao>","titulo":"<40 chars>","subtitulo":"<60 chars>","corpo":"<2-4 frases>","cta":"<verbo + ação>","formato_sugerido":"<imagem|carrossel|video_curto>","plataforma":"<meta_feed|meta_reels|google_search>","gancho":"<1ª frase>","beneficio_principal":"<benefício>","prova":"<dado/garantia>","quebra_objecao":"<objeção>","notas_criativo":"<instrução visual>","teste_hipotese":"<o que testa>"}],"recomendacoes_criativas":["<recomendação>","<2>","<3>"],"headlines_alternativas":["<h1>","<h2>","<h3>","<h4>","<h5>"],"ctas_alternativos":["<cta1>","<cta2>","<cta3>"],"angulos_a_evitar":["<ângulo ineficiente>"],"plano_de_teste":[{"fase":"Semana 1","teste":"<teste A/B>","metrica":"<CTR|CPL>"},{"fase":"Semana 2","teste":"<teste>","metrica":"<métrica>"},{"fase":"Semana 3","teste":"<teste>","metrica":"<métrica>"}]}`

  const result = await callLLMJson<any>(anthropic, prompt, 7000)
  return { agent: 'copywriter', ...result, generated_at: new Date().toISOString(), source: 'ai' }
}

// ── Agente 5: Report ─────────────────────────────────────────────────────────

async function runReport(anthropic: Anthropic, input: any, results: Record<string, any>) {
  const {
    clientName, niche, budget = 0, objective,
    monthlyRevenue, currentCPL, mainChallenge,
    hasMeta, hasGoogle,
  } = input
  const { auditor: aud, data_analyst: da, estrategista: st, copywriter: cp } = results
  const format = input.reportFormat || 'executive'

  const platforms = [hasMeta && 'Meta Ads', hasGoogle && 'Google Ads'].filter(Boolean).join(' + ') || 'Sem plataformas conectadas'

  const audCtx = aud
    ? `AUDITOR (${aud.score_conta}/100 ${aud.grade}): ${aud.resumo_executivo}
Gargalos: ${(aud.gargalos || []).slice(0, 3).map((g: any) => `${g.titulo} → ${g.impacto}`).join(' | ')}
Oportunidades: ${(aud.oportunidades || []).slice(0, 3).map((o: any) => o.titulo).join(' | ')}`
    : ''

  const daCtx = da
    ? `DATA ANALYST (${da.health_score}/100 ${da.grade}): ${da.executive_summary}
Break-even: ${da.saude_financeira?.break_even_roas}× | CPL máx: R$${da.saude_financeira?.cpl_maximo_lucrativo} | LTV:CAC: ${da.saude_financeira?.ltv_cac_ratio}×
Pode escalar agora: ${da.prontidao_para_escalar?.pode_escalar_agora ? 'SIM' : 'NÃO'}`
    : ''

  const stCtx = st
    ? `ESTRATEGISTA (${st.intelligence_score} ${st.score_label}): ${st.recommendation}
Canais recomendados: ${(st.recommended_channels_names || []).join(', ')} | CPL alvo: R$${st.optimization_scale?.cpl_target}`
    : ''

  const cpCtx = cp ? `COPYWRITER: Big idea: ${cp.big_idea} | ${(cp.variacoes || []).length} variações geradas` : ''

  const fmtInstr = format === 'executive' ? 'Tom C-level — sala de reunião, impacto financeiro, números antes de opiniões'
    : format === 'tactical' ? 'Tom operacional — execução, quem faz o quê, em qual ordem, checklist'
    : 'Tom pitch para investidor — oportunidade, tração, unit economics'

  const prompt = `Diretor de planejamento de agência de tráfego pago. CONSOLIDE os 4 agentes. NUNCA repita texto bruto — sintetize. Cruze dados. Priorize por ROI.
${fmtInstr}

CLIENTE: ${clientName} | NICHO: ${niche} | BUDGET: R$${budget} | OBJETIVO: ${objective || 'N/A'}
FATURAMENTO: R$${monthlyRevenue || 'N/A'} | CPL: ${currentCPL ? `R$${currentCPL}` : 'N/A'} | DESAFIO: ${mainChallenge || 'N/A'}
PLATAFORMAS: ${platforms}

${audCtx}
${daCtx}
${stCtx}
${cpCtx}

Gere ENTRE 8 E 15 ações em plano_acao. JSON:
{"titulo":"Diagnóstico 360° — ${clientName}","cliente":"${clientName}","nicho":"${niche}","plataformas":"${platforms}","score_geral":<0-100>,"grade":"<A+|A|A-|B+|B|B-|C+|C|D>","sumario_executivo":"<3-5 frases com números reais>","sumario_cliente":"<2-3 frases simples para o cliente, sem jargão>","kpis_chave":[{"nome":"CPL atual","valor":"<R$X>","status":"<excelente|bom|atencao|critico>","benchmark":"<vs benchmark>"},{"nome":"ROAS break-even","valor":"<X×>","status":"<status>","benchmark":"<vs atual>"},{"nome":"LTV:CAC","valor":"<X×>","status":"<status>","benchmark":"<mínimo 3×>"},{"nome":"Health score","valor":"<X/100>","status":"<status>","benchmark":"<posição>"},{"nome":"Budget eficiência","valor":"<%>","status":"<status>","benchmark":"<ideal>"}],"principais_descobertas":["<descoberta>","<2>","<3>","<4>","<5>"],"riscos_criticos":["<risco com R$/%>","<2>","<3>"],"oportunidades_principais":["<oportunidade quantificada>","<2>","<3>"],"plano_acao":[{"id":"acao_1","prioridade":"<critica|alta|media|baixa>","categoria":"<Tracking|Criativos|Audiências|Funil|Escala|Estrutura|Orçamento|Copy|Processo>","titulo":"<até 8 palavras>","descricao":"<o que e por quê com números>","como":"<passo a passo>","impacto":"<% ou R$>","prazo":"<Imediato|7 dias|30 dias|90 dias>","responsavel_sugerido":"<Gestor|Copy|Designer|Vendas|Cliente>","plataforma":"<meta|google|ambos>"}],"projecao_90_dias":{"cenario_base":"<leads/receita mantendo atual>","cenario_otimizado":"<leads/receita executando o plano>","premissas":["<premissa>","<2>","<3>"]},"proximos_passos_imediatos":["<ação 7 dias #1>","<2>","<3>","<4>","<5>"],"slide_pitch":"<3-5 bullets com \\n• para reunião>","alertas_imediatos":["<alerta urgente>"]}`

  const result = await callLLMJson<any>(anthropic, prompt, 7000)
  const plano = (result.plano_acao || []).map((a: any, i: number) => ({ ...a, id: a.id || `acao_${i + 1}` }))
  return { agent: 'report', ...result, plano_acao: plano, generated_at: new Date().toISOString(), source: 'ai' }
}
