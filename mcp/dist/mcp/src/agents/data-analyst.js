// src/agents/data-analyst.ts — Agente Data Analyst (diagnóstico estratégico + inteligência de mercado)
// Une o prompt de /api/intelligence (6 seções de market intel) com
// /api/diagnostic (saúde financeira, matriz de risco, prontidão para escalar).
// Porta completa para MCP sampling — sem Anthropic SDK direto.
import { z } from "zod";
import { getBenchmark, getBenchmarkSummary, } from "../../../lib/niche_benchmarks.js";
import { callLLMJson } from "../sampling.js";
// ── Schemas ─────────────────────────────────────────────────────────────────
const CampaignHistorySchema = z.object({
    period: z.string().describe("Ex: '2025-Q1', 'Jan/25', 'últimos 30d'"),
    channel: z.string().describe("Canal: Meta, Google, TikTok, etc."),
    cplReal: z.number().optional(),
    leads: z.number().optional(),
    conversions: z.number().optional(),
    budgetSpent: z.number().optional(),
    outcome: z.enum(["sucesso", "parcial", "falha", "desconhecido"]).optional(),
    whatWorked: z.string().optional(),
    whatFailed: z.string().optional(),
});
const AuditRealMetricsSchema = z.object({
    totalSpend: z.number().optional(),
    totalLeads: z.number().optional(),
    avgCPL: z.number().nullable().optional(),
    campaignCount: z.number().optional(),
    avgROAS: z.number().nullable().optional(),
    avgCTR: z.number().nullable().optional(),
});
export const DataAnalystInputSchema = z.object({
    clientName: z.string().describe("Nome do cliente/empresa"),
    niche: z
        .string()
        .describe("Nicho (ex: 'odontologia', 'e-commerce', 'móveis planejados')"),
    budget: z.number().default(0).describe("Investimento mensal R$"),
    monthlyRevenue: z.number().default(0).describe("Faturamento mensal R$"),
    ticketPrice: z.number().optional().describe("Ticket médio R$"),
    grossMargin: z
        .number()
        .optional()
        .describe("Margem bruta em % (ex: 40 para 40%)"),
    conversionRate: z
        .number()
        .optional()
        .describe("CVR lead→venda em % (ex: 10 para 10%)"),
    isRecurring: z.boolean().optional().describe("Produto recorrente?"),
    currentCPL: z.number().optional().describe("CPL atual informado R$"),
    mainChallenge: z.string().optional(),
    currentLeadSource: z.string().optional(),
    objective: z.string().optional(),
    strategy: z
        .object({ recommended_channels_names: z.array(z.string()).optional() })
        .optional(),
    campaignHistory: z.array(CampaignHistorySchema).default([]),
    auditRealMetrics: AuditRealMetricsSchema.nullable().optional(),
});
// ── Unit economics pré-calculados (contexto do prompt) ──────────────────────
function computeUnitEconomics(input) {
    const bench = getBenchmark(input.niche);
    const margin = (input.grossMargin ?? 40) / 100;
    const cvr = (input.conversionRate ?? (bench?.cvr_lead_to_sale ?? 0.1) * 100) / 100;
    const ticket = input.ticketPrice ?? bench?.avg_ticket ?? 1000;
    const breakEvenROAS = margin > 0 ? +(1 / margin).toFixed(2) : 2.5;
    const maxCPL = cvr > 0 ? Math.round(ticket * margin * cvr) : 0;
    const ltv = input.isRecurring
        ? Math.round((ticket / 0.05) * margin)
        : Math.round(ticket * margin);
    const ltvCacRatio = maxCPL > 0 ? +(ltv / maxCPL).toFixed(1) : 3;
    const cacPayback = maxCPL > 0 ? +(maxCPL / (ticket * margin)).toFixed(1) : 1;
    return {
        bench,
        margin,
        cvr,
        ticket,
        breakEvenROAS,
        maxCPL,
        ltv,
        ltvCacRatio,
        cacPayback,
    };
}
// ── Prompt builder ──────────────────────────────────────────────────────────
function buildDataAnalystPrompt(input) {
    const { clientName, niche, budget = 0, monthlyRevenue = 0, currentCPL, mainChallenge, currentLeadSource, isRecurring, objective, strategy, campaignHistory, auditRealMetrics, } = input;
    const econ = computeUnitEconomics(input);
    const benchmarkText = getBenchmarkSummary(niche);
    const historyCtx = campaignHistory.length > 0
        ? campaignHistory
            .slice(0, 10)
            .map((c) => `• ${c.period} | ${c.channel} | Gasto: R$${c.budgetSpent ?? "?"} | Leads: ${c.leads ?? "?"} | CPL: R$${c.cplReal ?? "?"} | Vendas: ${c.conversions ?? "?"} | ${c.outcome?.toUpperCase() ?? "?"} | Funcionou: ${c.whatWorked || "—"} | Falhou: ${c.whatFailed || "—"}`)
            .join("\n")
        : "Sem histórico registrado — análise baseada em benchmarks do nicho.";
    const auditCtx = auditRealMetrics
        ? `CPL médio real: R$${auditRealMetrics.avgCPL ?? "N/A"} | Leads: ${auditRealMetrics.totalLeads ?? 0} | Gasto: R$${auditRealMetrics.totalSpend ?? 0} | ROAS: ${auditRealMetrics.avgROAS ?? "N/A"}× | CTR: ${auditRealMetrics.avgCTR ?? "N/A"}% | Campanhas: ${auditRealMetrics.campaignCount ?? 0}`
        : "Sem auditoria disponível — usar dados do cliente.";
    const channelsText = strategy?.recommended_channels_names?.join(", ") ||
        econ.bench?.best_channels?.join(", ") ||
        "Meta Ads, Google Ads";
    return `Você é um Data Analyst SENIOR especialista em tráfego pago no mercado digital brasileiro, com 10+ anos de experiência. Seu papel une CFO + CMO + Analista de dados. Já interpretou dados de mais de R$50M em mídia paga em dezenas de nichos.

SEU PAPEL NESTE PIPELINE:
Extrair insights ACIONÁVEIS dos dados do cliente — detectar anomalias, identificar segmentos vencedores/perdedores e gerar inteligência de mercado específica do nicho. Não fale genérico. Use os números.

REGRAS OBRIGATÓRIAS:
1. Cada insight deve ter DADO QUANTITATIVO (% ou R$) — nada de afirmação solta
2. Cite o nicho "${niche}" especificamente — evitar genéricos
3. Use os unit economics calculados abaixo como âncora — não reinvente
4. Detecte anomalias: CPL absurdamente baixo/alto, CVR incoerente, histórico com outliers
5. Seja tão direto quanto um consultor que cobra R$500/hora

=== DADOS DO CLIENTE ===
Cliente: ${clientName}
Nicho: ${niche}
Budget mensal: R$${budget.toLocaleString("pt-BR")}
Faturamento mensal: R$${monthlyRevenue.toLocaleString("pt-BR")}
CPL atual informado: ${currentCPL ? `R$${currentCPL}` : "Não informado"}
Objetivo: ${objective || "Gerar leads qualificados"}
Maior desafio: ${mainChallenge || "Não informado"}
Principal origem de leads: ${currentLeadSource || "Não informado"}
Produto recorrente: ${isRecurring ? "Sim" : "Não"}

=== UNIT ECONOMICS (pré-calculados — USE estes números) ===
Ticket médio: R$${econ.ticket}
Margem bruta: ${(econ.margin * 100).toFixed(0)}%
CVR lead→venda: ${(econ.cvr * 100).toFixed(0)}%
ROAS break-even: ${econ.breakEvenROAS}×
CPL máximo lucrativo: R$${econ.maxCPL}
LTV estimado: R$${econ.ltv}
LTV:CAC: ${econ.ltvCacRatio}×
CAC payback: ${econ.cacPayback} ${isRecurring ? "meses" : "vendas"}

=== HISTÓRICO DE CAMPANHAS ===
${historyCtx}

=== DADOS DA ÚLTIMA AUDITORIA ===
${auditCtx}

=== CANAIS RECOMENDADOS ===
${channelsText}

${benchmarkText ? `=== BENCHMARK DO NICHO (${niche}) ===\n${benchmarkText}` : ""}

=== OUTPUT OBRIGATÓRIO ===
Responda APENAS com JSON válido (sem markdown, sem \`\`\`json). Preencha TODAS as chaves:

{
  "insights": [
    "<insight quantitativo #1 com % ou R$>",
    "<insight quantitativo #2 específico do nicho>",
    "<insight #3 — padrão detectado no histórico>"
  ],
  "anomalias": [
    {"titulo": "<anomalia detectada>", "descricao": "<dado específico que revela>", "impacto": "<em R$ ou % no resultado>"}
  ],
  "segmentos_vencedores": [
    {"segmento": "<canal/público/campanha que ganha>", "motivo": "<por que ganha com dados>", "metrica": "<CPL/CVR/ROAS concreto>"}
  ],
  "segmentos_perdedores": [
    {"segmento": "<canal/público/campanha que perde>", "motivo": "<por que perde com dados>", "metrica": "<CPL/CVR/ROAS concreto>"}
  ],
  "recomendacoes": [
    "<recomendação acionável #1>",
    "<recomendação acionável #2>",
    "<recomendação acionável #3>"
  ],

  "health_score": <0-100 saúde financeira + estratégica>,
  "grade": "<A+|A|A-|B+|B|B-|C+|C|D>",
  "executive_summary": "<2-3 frases com LTV:CAC, CPL vs break-even, projeção de escala>",

  "saude_financeira": {
    "break_even_roas": ${econ.breakEvenROAS},
    "cpl_maximo_lucrativo": ${econ.maxCPL},
    "ltv_estimado": ${econ.ltv},
    "cac_payback_meses": <número>,
    "ltv_cac_ratio": ${econ.ltvCacRatio},
    "sustentabilidade": "<sustentavel|fragil|insustentavel>",
    "interpretacao": "<o que esses números SIGNIFICAM para o negócio>"
  },

  "matriz_risco": [
    {"rank": 1, "risco": "<risco #1 com número>", "probabilidade": "<alta|media|baixa>", "impacto": "<critico|alto|medio|baixo>", "mitigacao": "<ação específica>"},
    {"rank": 2, "risco": "<risco #2>", "probabilidade": "<alta|media|baixa>", "impacto": "<critico|alto|medio|baixo>", "mitigacao": "<ação específica>"},
    {"rank": 3, "risco": "<risco #3>", "probabilidade": "<alta|media|baixa>", "impacto": "<critico|alto|medio|baixo>", "mitigacao": "<ação específica>"}
  ],

  "prontidao_para_escalar": {
    "score": <0-100>,
    "pode_escalar_agora": <true|false>,
    "prerequisitos_faltando": ["<pré-requisito #1>"],
    "quando_escalar": "<condição para aumentar o investimento>",
    "projecao_escala": {
      "budget_2x": ${budget * 2},
      "leads_projetados": <número>,
      "receita_projetada": <número>
    }
  },

  "diagnostico_funil": {
    "etapas": [
      {"etapa": "Tráfego → Clique", "status": "<saudavel|problema|nao_auditado>", "observacao": "<CTR vs benchmark>"},
      {"etapa": "Clique → Lead", "status": "<saudavel|problema|nao_auditado>", "observacao": "<CPL vs break-even>"},
      {"etapa": "Lead → Atendimento", "status": "<saudavel|problema|nao_auditado>", "observacao": "<SLA e processo>"},
      {"etapa": "Atendimento → Venda", "status": "<saudavel|problema|nao_auditado>", "observacao": "<CVR real vs benchmark>"}
    ],
    "gargalo_principal": "<trafego|pos-clique|atendimento|ambos>",
    "impacto_financeiro": "<R$ ou % perdido por mês>"
  },

  "recomendacao_principal": {
    "titulo": "<uma ação que muda tudo — específica e com número>",
    "descricao": "<por que esta supera as outras em ROI>",
    "acao_semana_1": "<o que fazer em 7 dias>",
    "acao_mes_1": "<o que executar no primeiro mês>",
    "acao_trimestre": "<transformação em 90 dias>"
  },

  "inteligencia": [
    {
      "tipo": "oportunidade_mercado",
      "icone": "🎯",
      "titulo": "<oportunidade específica não explorada com potencial %>",
      "categoria": "Mercado",
      "categoriaColor": "#F0B429",
      "insight": "<o que está acontecendo no mercado de ${niche} agora>",
      "dados": "<3 métricas que suportam o insight>",
      "acao_concreta": "<o que fazer nos próximos 7 dias>",
      "potencial": "<resultado esperado em % ou R$>"
    },
    {
      "tipo": "audiencia_avancada",
      "icone": "👥",
      "titulo": "<segmento de audiência subexplorado>",
      "categoria": "Audiência",
      "categoriaColor": "#22C55E",
      "insight": "<comportamento de compra do público de ${niche} que poucos exploram>",
      "dados": "<horários, dispositivos, gatilhos de compra específicos>",
      "acao_concreta": "<como criar e testar a audiência>",
      "potencial": "<impacto no CPL e volume de leads>"
    },
    {
      "tipo": "alocacao_orcamento",
      "icone": "💰",
      "titulo": "<redistribuição de orçamento que maximiza ROAS>",
      "categoria": "Orçamento",
      "categoriaColor": "#38BDF8",
      "insight": "<onde o orçamento atual está subperformando vs excesso>",
      "dados": "<Canal A X%, Canal B Y%, Remarketing Z% — com CPL esperado>",
      "acao_concreta": "<como redistribuir o R$${budget} de forma ótima>",
      "potencial": "<redução de CPL e aumento de leads>"
    },
    {
      "tipo": "analise_competitiva",
      "icone": "🔍",
      "titulo": "<estratégia competitiva diferenciada para ${niche}>",
      "categoria": "Competição",
      "categoriaColor": "#A78BFA",
      "insight": "<o que os concorrentes de ${niche} geralmente erram>",
      "dados": "<comportamento típico vs o que realmente converte>",
      "acao_concreta": "<como diferenciar o posicionamento>",
      "potencial": "<ganho de market share e impacto no CPL>"
    },
    {
      "tipo": "escala_inteligente",
      "icone": "📈",
      "titulo": "<estratégia de escala sem queimar budget>",
      "categoria": "Escala",
      "categoriaColor": "#FB923C",
      "insight": "<o que precisa estar funcionando antes de escalar>",
      "dados": "<métricas-gatilho: CPL < R$X por N dias, CVR > Y%>",
      "acao_concreta": "<plano 3 fases: sem 1-2, sem 3-4, mês 2+>",
      "potencial": "<projeção de leads e receita na escala>"
    },
    {
      "tipo": "criativo_estrategico",
      "icone": "🎨",
      "titulo": "<ângulo criativo mais eficiente para ${niche}>",
      "categoria": "Criativo",
      "categoriaColor": "#EC4899",
      "insight": "<o que move o público de ${niche} — medo, desejo, status, urgência ou transformação>",
      "dados": "<CTR por tipo de gancho, formato que converte mais>",
      "acao_concreta": "<brief do próximo criativo: gancho, valor, CTA, formato>",
      "potencial": "<aumento de CTR e redução de CPL>"
    }
  ],

  "benchmark_comparativo": {
    "cpl_atual": ${currentCPL || 0},
    "cpl_benchmark": <CPL médio do nicho>,
    "cpl_status": "<excelente|bom|atencao|critico>",
    "roas_break_even": ${econ.breakEvenROAS},
    "roas_bom_nicho": <ROAS bom do nicho>,
    "melhores_canais": <array dos melhores canais>,
    "insights_nicho": <array dos insights principais>
  }
}`;
}
// ── Executor ────────────────────────────────────────────────────────────────
export async function runDataAnalyst(server, input) {
    const prompt = buildDataAnalystPrompt(input);
    const result = await callLLMJson(server, {
        user: prompt,
        maxTokens: 8000,
    });
    return {
        agent: "data_analyst",
        ...result,
        generated_at: new Date().toISOString(),
        source: "ai",
    };
}
//# sourceMappingURL=data-analyst.js.map