// src/agents/auditor.ts — Agente Auditor (nível cirúrgico)
// Porta o prompt da rota /api/audit reaproveitando benchmarks por nicho.
import { z } from "zod";
import { getBenchmark, getBenchmarkSummary, } from "../../../lib/niche_benchmarks.js";
import { callLLMJson } from "../sampling.js";
// ── Schema de input ─────────────────────────────────────────────────────────
const CampaignSchema = z.object({
    name: z.string(),
    platform: z.string().optional(),
    status: z.string().optional(),
    spend: z.number().optional(),
    impressions: z.number().optional(),
    clicks: z.number().optional(),
    leads: z.number().optional(),
    ctr: z.number().optional(),
    cpl: z.number().optional(),
    roas: z.number().optional(),
    frequency: z.number().optional(),
    campaignType: z.string().optional(),
    adName: z.string().optional(),
    placement: z.string().optional(),
    revenue: z.number().optional(),
});
export const AuditorInputSchema = z.object({
    clientName: z.string().describe("Nome do cliente/empresa"),
    niche: z
        .string()
        .describe("Nicho do cliente (ex: 'odontologia', 'e-commerce', 'móveis planejados')"),
    budget: z.number().optional().describe("Investimento mensal em R$"),
    objective: z.string().optional().describe("Objetivo principal da campanha"),
    metaCampaigns: z.array(CampaignSchema).default([]),
    googleCampaigns: z.array(CampaignSchema).default([]),
    metaTotals: z.record(z.any()).nullable().optional(),
    googleTotals: z.record(z.any()).nullable().optional(),
    uploadedCampaigns: z.array(CampaignSchema).default([]),
    uploadedPlatform: z.string().nullable().optional(),
});
// ── Prompt builder (porta do prompt rico de /api/audit) ─────────────────────
function buildAuditPrompt(input) {
    const { clientName, niche, budget = 0, objective = "", metaCampaigns, googleCampaigns, metaTotals, googleTotals, uploadedCampaigns, } = input;
    const bench = getBenchmark(niche);
    const benchmarkText = getBenchmarkSummary(niche);
    const hasMeta = metaTotals != null || metaCampaigns.length > 0;
    const hasGoogle = googleTotals != null || googleCampaigns.length > 0;
    const allCampaigns = [...metaCampaigns, ...googleCampaigns, ...uploadedCampaigns];
    const totalSpend = (metaTotals?.spend || 0) +
        (googleTotals?.spend || 0) +
        uploadedCampaigns.reduce((s, c) => s + (c.spend || 0), 0);
    const totalLeads = (metaTotals?.leads || 0) +
        (googleTotals?.leads || 0) +
        uploadedCampaigns.reduce((s, c) => s + (c.leads || 0), 0);
    const realCPL = totalLeads > 0 ? (totalSpend / totalLeads).toFixed(2) : "0";
    // Detecção de anomalias
    const anomalies = [];
    const highCTR = allCampaigns.filter((c) => (c.ctr || 0) > 10);
    if (highCTR.length > 0)
        anomalies.push(`⚠ CTR SUSPEITO (>10%): ${highCTR.map((c) => `${c.name} (${c.ctr}%)`).join(", ")} — possível bot traffic ou erro de evento`);
    const absurdROAS = allCampaigns.filter((c) => (c.roas || 0) > 40);
    if (absurdROAS.length > 0)
        anomalies.push(`⚠ ROAS IMPOSSÍVEL (>40×): ${absurdROAS.map((c) => `${c.name} (${c.roas}×)`).join(", ")} — provável erro no valor de conversão`);
    const wasteCamps = allCampaigns.filter((c) => (c.spend || 0) > totalSpend * 0.1 && (c.leads || 0) === 0);
    if (wasteCamps.length > 0)
        anomalies.push(`🔴 DESPERDÍCIO CRÍTICO: ${wasteCamps.map((c) => `${c.name} (R$${c.spend?.toFixed(0)})`).join(", ")} — investimento alto SEM resultado`);
    const highFreq = allCampaigns.filter((c) => (c.frequency || 0) > 4);
    if (highFreq.length > 0)
        anomalies.push(`⚠ FADIGA CRIATIVA: ${highFreq.map((c) => `${c.name} (freq ${c.frequency?.toFixed(1)})`).join(", ")}`);
    const anomalySection = anomalies.length > 0
        ? `=== ANOMALIAS DETECTADAS (analise PRIMEIRO) ===\n${anomalies.join("\n")}\n`
        : "=== QUALIDADE DOS DADOS: OK ===\n";
    // Ranking de campanhas por eficiência
    const ranked = [...allCampaigns]
        .filter((c) => (c.spend || 0) > 0)
        .sort((a, b) => {
        if ((a.leads || 0) > 0 && (b.leads || 0) > 0) {
            return ((a.cpl || (a.spend || 0) / (a.leads || 1)) -
                (b.cpl || (b.spend || 0) / (b.leads || 1)));
        }
        if ((a.leads || 0) === 0)
            return 1;
        if ((b.leads || 0) === 0)
            return -1;
        return 0;
    });
    const rankingText = ranked.length > 0
        ? `=== RANKING POR EFICIÊNCIA ===\n${ranked
            .map((c, i) => {
            const cpa = (c.leads || 0) > 0 ? Math.round((c.spend || 0) / (c.leads || 1)) : null;
            const eff = cpa === null
                ? "⛔ SEM CONVERSÃO"
                : bench && cpa <= bench.cpl_min * 1.1
                    ? "🏆 EXCELENTE"
                    : bench && cpa <= bench.cpl_max
                        ? "✅ DENTRO DO BENCHMARK"
                        : bench && cpa <= bench.cpl_max * 2
                            ? "⚠ ACIMA DO BENCHMARK"
                            : "🔴 CRÍTICO";
            return `  ${i + 1}. [${eff}] "${c.name}" — Gasto: R$${Math.round(c.spend || 0)} | Conversões: ${c.leads || 0} | CPA: ${cpa ? `R$${cpa}` : "N/A"} | CTR: ${(c.ctr || 0).toFixed(2)}%`;
        })
            .join("\n")}\n`
        : "";
    const metaSummary = hasMeta
        ? `=== META ADS ===\nGasto: R$${(metaTotals?.spend || 0).toFixed(2)} | CTR: ${metaTotals?.ctr || 0}% | CPL: R$${metaTotals?.cpl || 0} | ROAS: ${metaTotals?.roas || 0}× | Leads: ${metaTotals?.leads || 0}\n${metaCampaigns
            .slice(0, 20)
            .map((c) => `  [${c.status || "ACTIVE"}] ${c.name} — Gasto R$${(c.spend || 0).toFixed(2)} | Leads ${c.leads || 0} | CPL R$${(c.cpl || 0).toFixed(2)} | CTR ${(c.ctr || 0).toFixed(2)}% | Freq ${(c.frequency || 0).toFixed(1)}`)
            .join("\n")}\n`
        : "";
    const googleSummary = hasGoogle
        ? `=== GOOGLE ADS ===\nGasto: R$${(googleTotals?.spend || 0).toFixed(2)} | CTR: ${googleTotals?.ctr || 0}% | CPL: R$${googleTotals?.cpl || 0} | Conversões: ${googleTotals?.leads || 0}\n${googleCampaigns
            .slice(0, 20)
            .map((c) => `  [${c.status || "ACTIVE"}] ${c.name} — Gasto R$${(c.spend || 0).toFixed(2)} | Leads ${c.leads || 0} | CPL R$${(c.cpl || 0).toFixed(2)}`)
            .join("\n")}\n`
        : "";
    return `Você é um consultor sênior de tráfego pago com 10+ anos de experiência no mercado brasileiro, especialista em Meta Ads (Advantage+, CBO, ASC) e Google Ads (Search, PMAX, Smart Bidding). Já gerenciou mais de R$50M em investimento.

REGRAS OBRIGATÓRIAS:
1. Use os NOMES EXATOS das campanhas nas recomendações
2. Cite NÚMEROS REAIS (CPA, gasto, conversões) — nunca invente métricas
3. Classifique cada campanha como ESCALAR / MANTER / PAUSAR com justificativa numérica
4. Seja tão direto quanto um relatório de R$10.000 — sem rodeios

=== DADOS DO CLIENTE ===
Cliente: ${clientName}
Nicho: ${niche}
Investimento: R$${budget}/mês
Objetivo: ${objective}

${anomalySection}
${rankingText}
${metaSummary}
${googleSummary}

=== CONSOLIDADO ===
Investimento total: R$${totalSpend.toFixed(2)}
Leads/conversões: ${totalLeads}
CPL médio real: R$${realCPL}

${benchmarkText ? `=== BENCHMARK DO NICHO (${niche}) ===\n${benchmarkText}` : ""}

Responda APENAS com JSON válido (sem markdown, sem \`\`\`json):
{
  "score_conta": <0-100 baseado nos dados reais>,
  "grade": "<A+|A|A-|B+|B|B-|C+|C|D>",
  "resumo_executivo": "<2-3 frases executivas com os números mais críticos>",
  "diagnostico": ["<diagnóstico 1>", "<diagnóstico 2>", "<diagnóstico 3>"],
  "erros_criticos": ["<erro crítico específico com nome da campanha>"],
  "gargalos": [
    {"rank": 1, "titulo": "<gargalo mais crítico>", "descricao": "<com métricas>", "impacto": "<impacto em R$ ou %>"}
  ],
  "oportunidades": [
    {"titulo": "<oportunidade específica>", "descricao": "<como capitalizar>", "potencial": "<resultado esperado>"}
  ],
  "plano_acao": {
    "curto": [{"acao": "<ação 7 dias>", "como": "<passo a passo>", "impacto": "<resultado>"}],
    "medio": [{"acao": "<ação 30 dias>", "como": "<execução>", "impacto": "<resultado>"}],
    "longo": [{"acao": "<ação 90 dias>", "como": "<estratégia>", "impacto": "<transformação>"}]
  }
}`;
}
// ── Executor ────────────────────────────────────────────────────────────────
export async function runAuditor(server, input) {
    const prompt = buildAuditPrompt(input);
    const result = await callLLMJson(server, {
        user: prompt,
        maxTokens: 6000,
    });
    // Métricas consolidadas reais
    const allCampaigns = [
        ...input.metaCampaigns,
        ...input.googleCampaigns,
        ...input.uploadedCampaigns,
    ];
    const totalSpend = (input.metaTotals?.spend || 0) +
        (input.googleTotals?.spend || 0) +
        input.uploadedCampaigns.reduce((s, c) => s + (c.spend || 0), 0);
    const totalLeads = (input.metaTotals?.leads || 0) +
        (input.googleTotals?.leads || 0) +
        input.uploadedCampaigns.reduce((s, c) => s + (c.leads || 0), 0);
    return {
        agent: "auditor",
        ...result,
        real_metrics: {
            totalSpend: Math.round(totalSpend),
            totalLeads: Math.round(totalLeads),
            avgCPL: totalLeads > 0 ? Math.round(totalSpend / totalLeads) : null,
            campaignCount: allCampaigns.length,
        },
        generated_at: new Date().toISOString(),
        source: "ai",
    };
}
//# sourceMappingURL=auditor.js.map