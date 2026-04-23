// src/pipeline.ts — Orquestrador `run_full_pipeline`
// Executa em cadeia: Auditor → Data Analyst → Estrategista → Copywriter → Report
// Cada agente recebe output relevante dos anteriores como contexto.

import { z } from "zod";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

import {
  runAuditor,
  AuditorInputSchema,
  type AuditorOutput,
} from "./agents/auditor.js";
import {
  runDataAnalyst,
  DataAnalystInputSchema,
  type DataAnalystOutput,
} from "./agents/data-analyst.js";
import {
  runEstrategista,
  EstrategistaInputSchema,
  type EstrategistaOutput,
} from "./agents/estrategista.js";
import {
  runCopywriter,
  CopywriterInputSchema,
  type CopywriterOutput,
} from "./agents/copywriter.js";
import {
  runReport,
  type ReportOutput,
} from "./agents/report.js";

// ── Input do pipeline ──────────────────────────────────────────────────────
// O pipeline aceita um briefing unificado + overrides opcionais por agente.
export const PipelineInputSchema = z.object({
  // Briefing mínimo obrigatório
  clientName: z.string(),
  niche: z.string(),
  budget: z.number().default(0),
  objective: z.string().default("Gerar leads qualificados"),

  // Opcional — propagado para vários agentes
  monthlyRevenue: z.number().default(0),
  city: z.string().optional(),
  products: z.array(z.string()).default([]),
  currentCPL: z.number().optional(),
  currentLeadSource: z.string().optional(),
  mainChallenge: z.string().optional(),
  nicheDetails: z.record(z.string()).default({}),

  // Unit economics
  ticketPrice: z.number().optional(),
  grossMargin: z.number().optional(),
  conversionRate: z.number().optional(),
  isRecurring: z.boolean().optional(),
  avgChurnMonthly: z.number().optional(),

  // Dados de campanha (para Auditor)
  metaCampaigns: z.array(z.any()).default([]),
  googleCampaigns: z.array(z.any()).default([]),
  metaTotals: z.record(z.any()).nullable().optional(),
  googleTotals: z.record(z.any()).nullable().optional(),
  uploadedCampaigns: z.array(z.any()).default([]),
  uploadedPlatform: z.string().nullable().optional(),

  // Histórico (Data Analyst + Estrategista)
  campaignHistory: z.array(z.any()).default([]),

  // Copywriter — pode passar especificação do criativo
  copyBriefing: z
    .object({
      product: z.string().optional(),
      offer: z.string().optional(),
      targetAudience: z.string().optional(),
      mainPain: z.string().optional(),
      mainDesire: z.string().optional(),
      objections: z.array(z.string()).optional(),
      differentials: z.array(z.string()).optional(),
      tone: z.string().optional(),
      platforms: z.array(z.string()).optional(),
      frameworks: z.array(z.string()).optional(),
      formats: z.array(z.string()).optional(),
      variationsPerFramework: z.number().optional(),
    })
    .optional(),

  // Controle de execução
  skipAgents: z
    .array(z.enum(["auditor", "data_analyst", "estrategista", "copywriter", "report"]))
    .default([])
    .describe("Agentes a pular (útil para pipelines parciais)"),
  reportFormat: z
    .enum(["executive", "tactical", "investor"])
    .default("executive"),
});

export type PipelineInput = z.infer<typeof PipelineInputSchema>;

// ── Output ──────────────────────────────────────────────────────────────────
export interface PipelineOutput {
  pipeline: "elyon_full";
  client: string;
  niche: string;
  executed_agents: string[];
  skipped_agents: string[];
  auditor: AuditorOutput | null;
  data_analyst: DataAnalystOutput | null;
  estrategista: EstrategistaOutput | null;
  copywriter: CopywriterOutput | null;
  report: ReportOutput | null;
  started_at: string;
  finished_at: string;
  duration_ms: number;
  errors: Array<{ agent: string; message: string }>;
}

// ── Orquestrador ────────────────────────────────────────────────────────────
export async function runPipeline(
  server: Server,
  input: PipelineInput
): Promise<PipelineOutput> {
  const started = Date.now();
  const executed: string[] = [];
  const errors: Array<{ agent: string; message: string }> = [];
  const skip = new Set(input.skipAgents);

  let auditor: AuditorOutput | null = null;
  let dataAnalyst: DataAnalystOutput | null = null;
  let estrategista: EstrategistaOutput | null = null;
  let copywriter: CopywriterOutput | null = null;
  let report: ReportOutput | null = null;

  // 1. AUDITOR ─────────────────────────────────────────────────────────────
  if (!skip.has("auditor")) {
    try {
      const auditorInput = AuditorInputSchema.parse({
        clientName: input.clientName,
        niche: input.niche,
        budget: input.budget,
        objective: input.objective,
        metaCampaigns: input.metaCampaigns,
        googleCampaigns: input.googleCampaigns,
        metaTotals: input.metaTotals,
        googleTotals: input.googleTotals,
        uploadedCampaigns: input.uploadedCampaigns,
        uploadedPlatform: input.uploadedPlatform,
      });
      auditor = await runAuditor(server, auditorInput);
      executed.push("auditor");
    } catch (e: any) {
      errors.push({ agent: "auditor", message: e.message });
    }
  }

  // 2. DATA ANALYST ────────────────────────────────────────────────────────
  if (!skip.has("data_analyst")) {
    try {
      const dataInput = DataAnalystInputSchema.parse({
        clientName: input.clientName,
        niche: input.niche,
        budget: input.budget,
        monthlyRevenue: input.monthlyRevenue,
        ticketPrice: input.ticketPrice,
        grossMargin: input.grossMargin,
        conversionRate: input.conversionRate,
        isRecurring: input.isRecurring,
        currentCPL: input.currentCPL,
        mainChallenge: input.mainChallenge,
        currentLeadSource: input.currentLeadSource,
        objective: input.objective,
        campaignHistory: input.campaignHistory,
        auditRealMetrics: auditor?.real_metrics
          ? {
              totalSpend: auditor.real_metrics.totalSpend,
              totalLeads: auditor.real_metrics.totalLeads,
              avgCPL: auditor.real_metrics.avgCPL,
              campaignCount: auditor.real_metrics.campaignCount,
            }
          : null,
      });
      dataAnalyst = await runDataAnalyst(server, dataInput);
      executed.push("data_analyst");
    } catch (e: any) {
      errors.push({ agent: "data_analyst", message: e.message });
    }
  }

  // 3. ESTRATEGISTA ────────────────────────────────────────────────────────
  if (!skip.has("estrategista")) {
    try {
      const stratInput = EstrategistaInputSchema.parse({
        clientName: input.clientName,
        niche: input.niche,
        products: input.products,
        budget: input.budget,
        objective: input.objective,
        monthlyRevenue: input.monthlyRevenue,
        nicheDetails: input.nicheDetails,
        city: input.city,
        currentCPL: input.currentCPL,
        currentLeadSource: input.currentLeadSource,
        mainChallenge: input.mainChallenge,
        campaignHistory: input.campaignHistory,
        ticketPrice: input.ticketPrice,
        grossMargin: input.grossMargin,
        isRecurring: input.isRecurring,
        conversionRate: input.conversionRate,
        avgChurnMonthly: input.avgChurnMonthly,
      });
      estrategista = await runEstrategista(server, stratInput);
      executed.push("estrategista");
    } catch (e: any) {
      errors.push({ agent: "estrategista", message: e.message });
    }
  }

  // 4. COPYWRITER ──────────────────────────────────────────────────────────
  if (!skip.has("copywriter")) {
    try {
      const cb = input.copyBriefing || {};
      const copyInput = CopywriterInputSchema.parse({
        clientName: input.clientName,
        niche: input.niche,
        product: cb.product || input.products[0] || input.objective,
        offer: cb.offer,
        targetAudience: cb.targetAudience,
        mainPain: cb.mainPain,
        mainDesire: cb.mainDesire,
        objections: cb.objections || [],
        differentials: cb.differentials || [],
        tone: cb.tone,
        platforms: (cb.platforms as any) || undefined,
        frameworks: (cb.frameworks as any) || undefined,
        formats: (cb.formats as any) || undefined,
        variationsPerFramework: cb.variationsPerFramework,
        nicheDetails: input.nicheDetails,
        strategyChannels: estrategista?.recommended_channels_names,
        cpl_target: estrategista?.optimization_scale?.cpl_target,
      });
      copywriter = await runCopywriter(server, copyInput);
      executed.push("copywriter");
    } catch (e: any) {
      errors.push({ agent: "copywriter", message: e.message });
    }
  }

  // 5. REPORT ──────────────────────────────────────────────────────────────
  if (!skip.has("report")) {
    try {
      report = await runReport(server, {
        client: {
          clientName: input.clientName,
          niche: input.niche,
          budget: input.budget,
          objective: input.objective,
          monthlyRevenue: input.monthlyRevenue,
          currentCPL: input.currentCPL,
          mainChallenge: input.mainChallenge,
        },
        auditor,
        data_analyst: dataAnalyst,
        estrategista,
        copywriter,
        format: input.reportFormat,
      });
      executed.push("report");
    } catch (e: any) {
      errors.push({ agent: "report", message: e.message });
    }
  }

  const finished = Date.now();

  return {
    pipeline: "elyon_full",
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
  };
}
