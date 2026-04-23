// src/agents/estrategista.ts — Agente Estrategista (Head of Growth)
// Porta o prompt de /api/strategy reaproveitando niche_prompts + benchmarks.
// Sem Tavily nem streaming — MCP sampling entrega resposta estruturada direta.

import { z } from "zod";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  getBenchmark,
  getBenchmarkSummary,
} from "../../../lib/niche_benchmarks.js";
import { buildNichePromptContext } from "../../../lib/niche_prompts.js";
import { callLLMJson } from "../sampling.js";

// ── Schemas ─────────────────────────────────────────────────────────────────
const CampaignHistorySchema = z.object({
  period: z.string(),
  channel: z.string(),
  budgetSpent: z.number().optional(),
  leads: z.number().optional(),
  cplReal: z.number().optional(),
  conversions: z.number().optional(),
  revenue: z.number().optional(),
  outcome: z.string().optional(),
  whatWorked: z.string().optional(),
  whatFailed: z.string().optional(),
  notes: z.string().optional(),
});

export const EstrategistaInputSchema = z.object({
  clientName: z.string(),
  niche: z.string(),
  products: z.array(z.string()).default([]),
  budget: z.number().default(0).describe("Investimento mensal R$"),
  objective: z.string().default("Gerar leads qualificados"),
  monthlyRevenue: z.number().default(0),
  nicheDetails: z.record(z.string()).default({}),
  city: z.string().optional(),
  currentCPL: z.number().optional(),
  currentLeadSource: z.string().optional(),
  mainChallenge: z.string().optional(),
  campaignHistory: z.array(CampaignHistorySchema).default([]),

  // Unit economics
  ticketPrice: z.number().optional(),
  grossMargin: z.number().optional().describe("Margem bruta em % (0-100)"),
  isRecurring: z.boolean().optional(),
  conversionRate: z
    .number()
    .optional()
    .describe("CVR lead→venda em % (0-100)"),
  avgChurnMonthly: z
    .number()
    .optional()
    .describe("Churn mensal em % (para LTV recorrente)"),
});

export type EstrategistaInput = z.infer<typeof EstrategistaInputSchema>;

// ── Output ──────────────────────────────────────────────────────────────────
export interface EstrategistaOutput {
  agent: "estrategista";
  intelligence_score: number;
  score_label: string;
  recommendation: string;
  estimated_monthly_revenue_range: string;
  regulatory_alerts: string[];
  growth_diagnosis: {
    main_problem: string;
    waste_analysis: string[];
    growth_blockers: string[];
    funnel_health: {
      tofu: { status: string; issue: string; action: string };
      mofu: { status: string; issue: string; action: string };
      bofu: { status: string; issue: string; action: string };
    };
  };
  funnel_strategy: {
    tofu: { goal: string; channels: string[]; tactics: string[] };
    mofu: { goal: string; tactics: string[] };
    bofu: { goal: string; tactics: string[] };
  };
  optimization_scale: {
    cpl_target: number;
    scale_actions: string[];
    cut_immediately: string[];
    ab_tests: string[];
  };
  brand_positioning: {
    authority_strategies: string[];
    communication_adjustments: string[];
    value_perception: string[];
  };
  vision_360: {
    website_improvements: string[];
    sales_alignment: string[];
    off_ads_opportunities: string[];
  };
  priority_ranking: Array<{
    channel: string;
    priority: number;
    budget_pct: number;
    budget_brl: number;
    cpl_min: number;
    cpl_max: number;
    cpl_avg: number;
    leads_min: number;
    leads_max: number;
    roi_range: string;
    revenue_min: number;
    revenue_max: number;
    rationale: string;
  }>;
  recommended_channels_names: string[];
  plan_90_days: Array<{
    month: number;
    goal: string;
    week_1: string[];
    week_2: string[];
    week_3: string[];
    week_4: string[];
  }>;
  key_actions: string[];
  generated_at: string;
  source: "ai" | "benchmark";
}

// ── Prompt builder ──────────────────────────────────────────────────────────
function buildEstrategistaPrompt(input: EstrategistaInput): string {
  const {
    clientName,
    niche,
    products,
    budget,
    objective,
    monthlyRevenue,
    nicheDetails,
    city,
    currentCPL,
    currentLeadSource,
    mainChallenge,
    campaignHistory,
    ticketPrice,
    grossMargin,
    isRecurring,
    conversionRate,
    avgChurnMonthly,
  } = input;

  const bench = getBenchmark(niche);
  const benchmarkSection = getBenchmarkSummary(niche);
  const nicheContext = buildNichePromptContext(niche, nicheDetails);

  // Unit economics calculados
  const ticket = ticketPrice || bench?.avg_ticket || 0;
  const margin = grossMargin ? grossMargin / 100 : null;
  const cvr = conversionRate
    ? conversionRate / 100
    : bench?.cvr_lead_to_sale || null;
  const breakEvenROAS = margin ? +(1 / margin).toFixed(2) : null;
  const maxProfitCPL =
    margin && cvr && ticket ? Math.round(ticket * margin * cvr) : null;
  const ltv =
    isRecurring && ticket && margin
      ? Math.round((ticket / ((avgChurnMonthly || 5) / 100)) * margin)
      : null;
  const cacPaybackMonths =
    maxProfitCPL && cvr && ticket && margin
      ? +((maxProfitCPL / (ticket * margin)).toFixed(1))
      : null;

  const unitEconomicsSection =
    breakEvenROAS || maxProfitCPL || ltv || cacPaybackMonths
      ? `
=== UNIT ECONOMICS DO CLIENTE ===
${ticket ? `- Ticket médio: R$${ticket.toLocaleString("pt-BR")}` : ""}
${margin ? `- Margem bruta: ${(margin * 100).toFixed(0)}%` : ""}
${cvr ? `- Taxa conversão lead→venda: ${(cvr * 100).toFixed(1)}%` : ""}
${isRecurring ? `- Produto RECORRENTE (assinatura/mensalidade)` : "- Produto de venda única"}
${breakEvenROAS ? `- ROAS break-even real: ${breakEvenROAS}× (abaixo disso opera com prejuízo)` : ""}
${maxProfitCPL ? `- CPL máximo lucrativo: R$${maxProfitCPL} (acima disso perde dinheiro por lead)` : ""}
${ltv ? `- LTV estimado: R$${ltv.toLocaleString("pt-BR")}` : ""}
${cacPaybackMonths ? `- Payback do CAC: ${cacPaybackMonths} mês(es)` : ""}

ATENÇÃO: Use esses dados para calibrar metas de ROAS e CPL. Não recomende estratégias que não cubram o break-even. Se o CPL recomendado ultrapassar R$${maxProfitCPL || "X"}, a operação fica deficitária.`
      : "";

  const historyCtx =
    campaignHistory.length > 0
      ? `
HISTÓRICO DE CAMPANHAS REAIS DO CLIENTE:
${campaignHistory
  .map(
    (c) => `
• ${c.channel} | ${c.period} | Investido: R$${c.budgetSpent ?? "?"} | Leads: ${c.leads ?? "?"} | CPL real: R$${c.cplReal ?? "?"} | Conversões: ${c.conversions ?? "?"} | Receita: R$${c.revenue ?? "?"} | Resultado: ${c.outcome ?? "?"}
  ✓ Funcionou: ${c.whatWorked || "não informado"}
  ✕ Falhou: ${c.whatFailed || "não informado"}
  Obs: ${c.notes || "—"}`
  )
  .join("\n")}

USE ESSES DADOS REAIS para calibrar CPL esperado, identificar canais a priorizar ou evitar, e personalizar o diagnóstico de crescimento.`
      : "";

  return `Você é um Head de Growth e gestor sênior de tráfego pago com 10+ anos de experiência no mercado brasileiro. Especialista em Meta Ads (Advantage+, CBO, campanhas de conversão e geração de leads), Google Ads (Search, PMAX, Display, YouTube, smart bidding), TikTok Ads e estratégia de growth para PMEs.

Você já gerenciou mais de R$50M em investimento publicitário. Sabe diagnosticar gargalos reais, não apenas recomendar "testar criativos". Você pensa em unit economics, CAC payback, LTV e margem — não apenas em CPL e ROAS brutos.

DADOS DO CLIENTE:
- Nome: ${clientName}
- Nicho: ${niche}
- Cidade/Região: ${city || "Não informada"}
- Produtos/Serviços: ${products.join(", ") || "Não informado"}
- Investimento mensal: R$${budget.toLocaleString("pt-BR")}
- Objetivo: ${objective}
- Faturamento atual: R$${monthlyRevenue.toLocaleString("pt-BR")}/mês
${currentCPL ? `- CPL atual: R$${currentCPL}` : ""}
${currentLeadSource ? `- Principal origem de leads atual: ${currentLeadSource}` : ""}
${mainChallenge ? `- Maior desafio atual: ${mainChallenge}` : ""}
${unitEconomicsSection}
${historyCtx}

${benchmarkSection ? `BENCHMARKS INTERNOS DO SISTEMA:\n${benchmarkSection}` : ""}
${nicheContext ? `\nCONTEXTO ESPECIALIZADO DO NICHO:${nicheContext}` : ""}

Entregue uma análise completa de crescimento com as 5 etapas do Head de Growth. Responda APENAS com JSON válido (sem markdown, sem \`\`\`json):

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
    },
    {
      "month": 2, "goal": "<objetivo do mês>",
      "week_1": ["<ação>"], "week_2": ["<ação>"], "week_3": ["<ação>"], "week_4": ["<ação>"]
    },
    {
      "month": 3, "goal": "<objetivo do mês>",
      "week_1": ["<ação>"], "week_2": ["<ação>"], "week_3": ["<ação>"], "week_4": ["<ação>"]
    }
  ],
  "key_actions": ["<ação prioritária 1>", "<ação 2>", "<ação 3>", "<ação 4>", "<ação 5>"]
}`;
}

// ── Executor ────────────────────────────────────────────────────────────────
export async function runEstrategista(
  server: Server,
  input: EstrategistaInput
): Promise<EstrategistaOutput> {
  const prompt = buildEstrategistaPrompt(input);

  const result = await callLLMJson<
    Omit<EstrategistaOutput, "agent" | "generated_at" | "source">
  >(server, {
    user: prompt,
    maxTokens: 6000,
  });

  return {
    agent: "estrategista",
    ...result,
    generated_at: new Date().toISOString(),
    source: "ai",
  };
}
