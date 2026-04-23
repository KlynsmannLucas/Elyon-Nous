#!/usr/bin/env node
// src/server.ts — Entry point da MCP ELYON
// Registra 6 tools: auditor, data_analyst, estrategista, copywriter, report, run_full_pipeline
// Usa sampling do cliente MCP — sem API key própria.

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

import { runAuditor, AuditorInputSchema } from "./agents/auditor.js";
import {
  runDataAnalyst,
  DataAnalystInputSchema,
} from "./agents/data-analyst.js";
import {
  runEstrategista,
  EstrategistaInputSchema,
} from "./agents/estrategista.js";
import {
  runCopywriter,
  CopywriterInputSchema,
} from "./agents/copywriter.js";
import { runReport, ReportInputSchema } from "./agents/report.js";
import { runPipeline, PipelineInputSchema } from "./pipeline.js";

// ── Helpers ─────────────────────────────────────────────────────────────────
function toInputSchema(schema: z.ZodTypeAny) {
  // zod-to-json-schema retorna JSON Schema compatível com MCP
  return zodToJsonSchema(schema, { $refStrategy: "none" }) as Record<
    string,
    unknown
  >;
}

// ── Tools catálogo ──────────────────────────────────────────────────────────
const TOOLS = [
  {
    name: "elyon_auditor",
    description:
      "Agente Auditor — auditoria cirúrgica de contas Meta/Google Ads. Detecta anomalias (CTR suspeito, ROAS impossível, desperdício, fadiga criativa), classifica campanhas por eficiência vs benchmark do nicho, entrega score, gargalos ranqueados, oportunidades e plano de ação (curto/médio/longo prazo). Use ANTES de qualquer outro agente quando houver dados de campanha.",
    inputSchema: toInputSchema(AuditorInputSchema),
  },
  {
    name: "elyon_data_analyst",
    description:
      "Agente Data Analyst — extrai insights quantitativos e detecta anomalias, segmentos vencedores/perdedores. Inclui diagnóstico estratégico de negócio (LTV:CAC, break-even ROAS, CPL máximo lucrativo, matriz de risco, prontidão para escalar) e inteligência de mercado em 6 dimensões (oportunidade, audiência, orçamento, competição, escala, criativo). Use DEPOIS do auditor quando houver.",
    inputSchema: toInputSchema(DataAnalystInputSchema),
  },
  {
    name: "elyon_estrategista",
    description:
      "Agente Estrategista (Head of Growth) — diagnóstico completo de crescimento + funil TOFU/MOFU/BOFU + ranking de canais com budget allocation + plano 90 dias com ações semanais + posicionamento de marca + visão 360° (site, vendas, off-ads). Combina unit economics com tática de mídia. Responde 'como escalar sem queimar dinheiro'.",
    inputSchema: toInputSchema(EstrategistaInputSchema),
  },
  {
    name: "elyon_copywriter",
    description:
      "Agente Copywriter — gera variações de anúncios por framework psicológico (dor, desejo, prova social, autoridade, urgência, transformação, objeção, curiosidade) e por plataforma (Meta Feed/Stories/Reels, Google Search/PMAX, TikTok, YouTube, LinkedIn, WhatsApp). Entrega big idea, headlines testáveis, CTAs, plano de teste A/B. Usa voz e terminologia corretas do nicho.",
    inputSchema: toInputSchema(CopywriterInputSchema),
  },
  {
    name: "elyon_report",
    description:
      "Agente Report — consolida os outputs dos 4 agentes anteriores em um relatório executivo único. Cruza evidências, elimina redundância, prioriza ações por ICE (impacto × velocidade), entrega sumário executivo, KPIs-chave, riscos, oportunidades, plano de ação priorizado (8-15 ações), projeção 90 dias e pitch rápido. Formato executive | tactical | investor.",
    inputSchema: toInputSchema(ReportInputSchema),
  },
  {
    name: "elyon_run_full_pipeline",
    description:
      "Pipeline completo ELYON — executa em cadeia: Auditor → Data Analyst → Estrategista → Copywriter → Report. Cada agente recebe outputs dos anteriores como contexto (auditoria alimenta data analyst, estratégia alimenta copywriter, tudo alimenta o report). Use para um diagnóstico 360° completo. Pode pular agentes via `skipAgents`.",
    inputSchema: toInputSchema(PipelineInputSchema),
  },
];

// ── Server setup ────────────────────────────────────────────────────────────
const server = new Server(
  {
    name: "elyon-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);
// Sampling é capability do CLIENTE — o servidor apenas chama server.createMessage()
// que é enviado ao cliente. Se o cliente não suporta, a chamada falha com erro claro.

// Lista de tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

// Dispatcher
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;

  try {
    let result: unknown;

    switch (name) {
      case "elyon_auditor":
        result = await runAuditor(server, AuditorInputSchema.parse(args));
        break;
      case "elyon_data_analyst":
        result = await runDataAnalyst(
          server,
          DataAnalystInputSchema.parse(args)
        );
        break;
      case "elyon_estrategista":
        result = await runEstrategista(
          server,
          EstrategistaInputSchema.parse(args)
        );
        break;
      case "elyon_copywriter":
        result = await runCopywriter(
          server,
          CopywriterInputSchema.parse(args)
        );
        break;
      case "elyon_report":
        result = await runReport(server, ReportInputSchema.parse(args));
        break;
      case "elyon_run_full_pipeline":
        result = await runPipeline(server, PipelineInputSchema.parse(args));
        break;
      default:
        return {
          content: [
            { type: "text", text: `Tool desconhecida: ${name}` },
          ],
          isError: true,
        };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (err: any) {
    const msg = err?.message || String(err);
    // Se foi erro de validação Zod, retorna mensagem mais útil
    const details =
      err instanceof z.ZodError
        ? JSON.stringify(err.errors, null, 2)
        : undefined;
    return {
      content: [
        {
          type: "text",
          text: details
            ? `Erro em ${name}: ${msg}\n\nValidação:\n${details}`
            : `Erro em ${name}: ${msg}`,
        },
      ],
      isError: true,
    };
  }
});

// Bootstrap
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stderr log — stdout é reservado ao protocolo JSON-RPC
  console.error("[elyon-mcp] server pronto — 6 tools registradas via stdio");
}

main().catch((err) => {
  console.error("[elyon-mcp] erro fatal:", err);
  process.exit(1);
});
