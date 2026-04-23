// src/agents/report.ts — Agente Report (consolidação executiva)
// Recebe outputs dos 4 agentes anteriores + briefing do cliente,
// entrega um sumário executivo com plano de ação priorizado.
import { z } from "zod";
import { callLLMJson } from "../sampling.js";
// ── Schemas ─────────────────────────────────────────────────────────────────
const ClientBriefSchema = z.object({
    clientName: z.string(),
    niche: z.string(),
    budget: z.number().default(0),
    objective: z.string().optional(),
    monthlyRevenue: z.number().optional(),
    currentCPL: z.number().optional(),
    mainChallenge: z.string().optional(),
});
export const ReportInputSchema = z.object({
    client: ClientBriefSchema,
    auditor: z.any().optional().describe("Output do agente Auditor"),
    data_analyst: z.any().optional().describe("Output do agente Data Analyst"),
    estrategista: z.any().optional().describe("Output do agente Estrategista"),
    copywriter: z.any().optional().describe("Output do agente Copywriter"),
    format: z
        .enum(["executive", "tactical", "investor"])
        .default("executive")
        .describe("Formato do relatório: executive (C-level), tactical (operacional), investor (pitch)"),
});
// ── Helpers de contexto ─────────────────────────────────────────────────────
function auditorCtx(a) {
    if (!a)
        return "";
    return `=== AUDITOR (score ${a.score_conta ?? "?"}/100 ${a.grade ?? ""}) ===
Resumo: ${a.resumo_executivo || a.executive_summary || "—"}

Diagnósticos: ${(a.diagnostico || []).slice(0, 5).join(" | ")}
Erros críticos: ${(a.erros_criticos || []).slice(0, 5).join(" | ")}

Gargalos (top 3):
${(a.gargalos || [])
        .slice(0, 3)
        .map((g) => `  [${g.rank}] ${g.titulo}: ${g.descricao} → ${g.impacto}`)
        .join("\n")}

Oportunidades (top 3):
${(a.oportunidades || [])
        .slice(0, 3)
        .map((o) => `  • ${o.titulo} — ${o.potencial}`)
        .join("\n")}

Plano (auditor):
- Curto: ${(a.plano_acao?.curto || []).map((x) => x.acao).join("; ")}
- Médio: ${(a.plano_acao?.medio || []).map((x) => x.acao).join("; ")}
- Longo: ${(a.plano_acao?.longo || []).map((x) => x.acao).join("; ")}

Métricas reais: Gasto R$${a.real_metrics?.totalSpend ?? 0} | Leads ${a.real_metrics?.totalLeads ?? 0} | CPL R$${a.real_metrics?.avgCPL ?? "?"} | Campanhas ${a.real_metrics?.campaignCount ?? 0}`;
}
function dataAnalystCtx(d) {
    if (!d)
        return "";
    return `=== DATA ANALYST (health ${d.health_score ?? "?"}/100 ${d.grade ?? ""}) ===
Resumo: ${d.executive_summary || "—"}

Insights principais: ${(d.insights || []).slice(0, 5).join(" | ")}

Anomalias: ${(d.anomalias || []).map((a) => `${a.titulo} (${a.impacto})`).join(" | ")}

Segmentos vencedores: ${(d.segmentos_vencedores || []).map((s) => `${s.segmento} (${s.metrica})`).join(" | ")}
Segmentos perdedores: ${(d.segmentos_perdedores || []).map((s) => `${s.segmento} (${s.metrica})`).join(" | ")}

Saúde financeira:
- Break-even ROAS: ${d.saude_financeira?.break_even_roas}×
- CPL máx lucrativo: R$${d.saude_financeira?.cpl_maximo_lucrativo}
- LTV:CAC: ${d.saude_financeira?.ltv_cac_ratio}×
- Sustentabilidade: ${d.saude_financeira?.sustentabilidade}

Prontidão para escalar: ${d.prontidao_para_escalar?.pode_escalar_agora ? "SIM" : "NÃO"} (score ${d.prontidao_para_escalar?.score})
Prereqs faltando: ${(d.prontidao_para_escalar?.prerequisitos_faltando || []).join("; ")}

Recomendação principal: ${d.recomendacao_principal?.titulo || "—"}
→ Semana 1: ${d.recomendacao_principal?.acao_semana_1 || "—"}

Inteligência de mercado: ${(d.inteligencia || []).slice(0, 3).map((i) => i.titulo).join(" | ")}`;
}
function estrategistaCtx(s) {
    if (!s)
        return "";
    return `=== ESTRATEGISTA (score ${s.intelligence_score ?? "?"} ${s.score_label ?? ""}) ===
Recomendação: ${s.recommendation || "—"}
Receita estimada: ${s.estimated_monthly_revenue_range || "—"}

Problema principal: ${s.growth_diagnosis?.main_problem || "—"}
Funil — TOFU: ${s.growth_diagnosis?.funnel_health?.tofu?.status} | MOFU: ${s.growth_diagnosis?.funnel_health?.mofu?.status} | BOFU: ${s.growth_diagnosis?.funnel_health?.bofu?.status}

Canais recomendados: ${(s.recommended_channels_names || []).join(", ")}
CPL alvo: R$${s.optimization_scale?.cpl_target ?? "?"}

Ranking de canais:
${(s.priority_ranking || [])
        .slice(0, 4)
        .map((r) => `  ${r.priority}. ${r.channel} — ${r.budget_pct}% (R$${r.budget_brl}) | CPL R$${r.cpl_min}-${r.cpl_max} | Leads ${r.leads_min}-${r.leads_max}`)
        .join("\n")}

Key actions: ${(s.key_actions || []).slice(0, 5).join(" | ")}`;
}
function copywriterCtx(c) {
    if (!c)
        return "";
    return `=== COPYWRITER ===
Big idea: ${c.big_idea || "—"}
Tom: ${c.tom_de_voz || "—"}
Variações geradas: ${(c.variacoes || []).length}
Frameworks explorados: ${[...new Set((c.variacoes || []).map((v) => v.framework))].join(", ")}

Headlines exemplo:
${(c.variacoes || [])
        .slice(0, 5)
        .map((v) => `  [${v.framework}] ${v.titulo} → ${v.cta}`)
        .join("\n")}

Plano de teste criativo: ${(c.plano_de_teste || []).map((p) => `${p.fase}: ${p.teste}`).join(" | ")}`;
}
// ── Prompt builder ──────────────────────────────────────────────────────────
function buildReportPrompt(input) {
    const { client, auditor, data_analyst, estrategista, copywriter, format } = input;
    const formatInstructions = {
        executive: "Tom: C-level. Linguagem de sala de reunião. Números antes de opiniões. Foco em impacto financeiro e decisões de budget.",
        tactical: "Tom: operacional. Foco em EXECUÇÃO — quem faz o quê, em qual ordem, com qual métrica. Menos narrativa, mais checklist.",
        investor: "Tom: pitch para comitê. Demonstrar oportunidade, tração e plano de capital. Números de mercado, unit economics e projeção.",
    };
    return `Você é um diretor de planejamento sênior de agência de tráfego pago. Sua função é CONSOLIDAR os diagnósticos dos 4 agentes anteriores (Auditor, Data Analyst, Estrategista, Copywriter) em um RELATÓRIO ÚNICO executivo — evitando redundância, cruzando evidências, priorizando ações por ROI.

REGRAS OBRIGATÓRIAS:
1. NUNCA repita texto bruto dos agentes — sintetize
2. Cite números REAIS dos agentes (não invente)
3. Cruze dados: se Auditor diz X e Data Analyst diz Y, encontre a relação
4. Priorize ações por IMPACTO × VELOCIDADE (matriz ICE simplificada)
5. ${formatInstructions[format]}

=== BRIEFING DO CLIENTE ===
Cliente: ${client.clientName}
Nicho: ${client.niche}
Budget mensal: R$${client.budget.toLocaleString("pt-BR")}
Objetivo: ${client.objective || "Não informado"}
Faturamento mensal: ${client.monthlyRevenue ? `R$${client.monthlyRevenue.toLocaleString("pt-BR")}` : "Não informado"}
CPL atual: ${client.currentCPL ? `R$${client.currentCPL}` : "Não informado"}
Maior desafio: ${client.mainChallenge || "Não informado"}

${auditorCtx(auditor)}

${dataAnalystCtx(data_analyst)}

${estrategistaCtx(estrategista)}

${copywriterCtx(copywriter)}

=== OUTPUT OBRIGATÓRIO ===
Responda APENAS com JSON válido (sem markdown, sem \`\`\`json):

{
  "titulo": "<título do relatório — ex: 'Diagnóstico 360° — <cliente>'>",
  "cliente": "${client.clientName}",
  "nicho": "${client.niche}",
  "score_geral": <0-100 ponderando auditor + data_analyst + estrategista>,
  "grade": "<A+|A|A-|B+|B|B-|C+|C|D>",

  "sumario_executivo": "<3-5 frases de resumo estratégico combinando os 4 agentes — ESPECÍFICO, com números>",

  "kpis_chave": [
    {"nome": "CPL atual", "valor": "<R$X>", "status": "<excelente|bom|atencao|critico>", "benchmark": "<vs benchmark>"},
    {"nome": "ROAS break-even", "valor": "<X×>", "status": "<status>", "benchmark": "<vs atual>"},
    {"nome": "LTV:CAC", "valor": "<X×>", "status": "<status>", "benchmark": "<mínimo saudável 3×>"},
    {"nome": "Health score", "valor": "<X/100>", "status": "<status>", "benchmark": "<posição>"},
    {"nome": "Budget eficiência", "valor": "<%>", "status": "<status>", "benchmark": "<ideal>"}
  ],

  "principais_descobertas": [
    "<descoberta #1 cruzando 2+ agentes — com números>",
    "<descoberta #2>",
    "<descoberta #3>",
    "<descoberta #4>",
    "<descoberta #5>"
  ],

  "riscos_criticos": [
    "<risco #1 com impacto em R$ ou %>",
    "<risco #2>",
    "<risco #3>"
  ],

  "oportunidades_principais": [
    "<oportunidade #1 com potencial quantificado>",
    "<oportunidade #2>",
    "<oportunidade #3>"
  ],

  "plano_acao": [
    {
      "id": "acao_1",
      "prioridade": "<critica|alta|media|baixa>",
      "categoria": "<Tracking|Criativos|Audiências|Funil|Escala|Estrutura|Orçamento|Copy|Processo>",
      "titulo": "<até 8 palavras — ação concreta>",
      "descricao": "<o que fazer e POR QUÊ — com números>",
      "como": "<passo a passo de execução>",
      "impacto": "<resultado esperado em % ou R$>",
      "prazo": "<Imediato|7 dias|30 dias|90 dias>",
      "responsavel_sugerido": "<Gestor de tráfego|Copy|Designer|Vendas|Cliente>",
      "dependencia": "<ação que precisa vir antes ou null>"
    }
  ],

  "projecao_90_dias": {
    "cenario_base": "<descrição com leads/receita/CPL projetados mantendo cenário atual>",
    "cenario_otimizado": "<descrição com leads/receita/CPL projetados executando o plano>",
    "premissas": ["<premissa #1>", "<premissa #2>", "<premissa #3>"]
  },

  "proximos_passos_imediatos": [
    "<ação prioritária dos próximos 7 dias #1>",
    "<ação #2>",
    "<ação #3>",
    "<ação #4>",
    "<ação #5>"
  ],

  "slide_pitch": "<3-5 bullets em markdown para apresentar em reunião rápida — use quebras de linha \\n•>"
}

IMPORTANTE: gere ENTRE 8 E 15 ações em plano_acao, priorizadas, sem genéricos, cada uma com números reais.`;
}
// ── Executor ────────────────────────────────────────────────────────────────
export async function runReport(server, input) {
    const prompt = buildReportPrompt(input);
    const result = await callLLMJson(server, {
        user: prompt,
        maxTokens: 8000,
    });
    // Ids estáveis se a IA esquecer
    const plano = (result.plano_acao || []).map((a, i) => ({
        ...a,
        id: a.id || `acao_${i + 1}`,
    }));
    return {
        agent: "report",
        ...result,
        plano_acao: plano,
        generated_at: new Date().toISOString(),
        source: "ai",
    };
}
//# sourceMappingURL=report.js.map