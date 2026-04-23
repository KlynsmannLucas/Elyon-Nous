# ELYON MCP — 5 Agentes Especialistas em Tráfego Pago

MCP server que transforma o `elyon-dashboard` em 5 agentes acionáveis via Claude Code, Claude Desktop ou qualquer cliente MCP compatível com **sampling**.

## Arquitetura

```
mcp/
├── src/
│   ├── server.ts          # entry point — registra 6 tools via stdio
│   ├── sampling.ts        # helper para chamar o LLM via server.createMessage()
│   ├── pipeline.ts        # orquestra Auditor → DataAnalyst → Estrategista → Copywriter → Report
│   └── agents/
│       ├── auditor.ts         # auditoria cirúrgica de contas Meta/Google
│       ├── data-analyst.ts    # insights quantitativos + diagnóstico estratégico + market intel
│       ├── estrategista.ts    # Head of Growth — funil + canais + plano 90d
│       ├── copywriter.ts      # variações de copy por framework psicológico
│       └── report.ts          # consolida os 4 em relatório executivo
└── tsconfig.json / package.json
```

Reaproveita sem duplicar: `../lib/niche_benchmarks.ts` e `../lib/niche_prompts.ts` do projeto principal (24 nichos de mercado brasileiro + prompts especializados por vertical).

## Por que sampling?

Cada agente chama `server.createMessage()` — a infra do CLIENTE MCP fornece o modelo (Claude, GPT, Gemini, Llama...). **Sem API key no servidor.** O mesmo binário roda em qualquer cliente, qualquer modelo.

## Tools expostas

| Tool | Quando usar |
|---|---|
| `elyon_auditor` | Tem dados de campanha (Meta/Google) e quer auditoria forense com score, gargalos e plano |
| `elyon_data_analyst` | Quer insights quantitativos, anomalias, segmentos vencedores/perdedores + diagnóstico LTV:CAC + market intel |
| `elyon_estrategista` | Quer estratégia de growth 90d: funil TOFU/MOFU/BOFU, ranking de canais, budget allocation |
| `elyon_copywriter` | Quer variações de anúncio por framework (dor, desejo, prova, urgência...) e plataforma |
| `elyon_report` | Já tem outputs de agentes anteriores e quer consolidar em relatório executivo |
| `elyon_run_full_pipeline` | Quer rodar o fluxo completo — recebe o briefing e devolve tudo encadeado |

Schemas completos de input são registrados via JSON Schema — Claude Code mostra os parâmetros quando você invoca a tool.

## Setup

### 1. Build

```bash
cd mcp
npm install
npm run build
```

A build compila `src/` + `../lib/niche_benchmarks.ts` + `../lib/niche_prompts.ts` em `dist/`.

### 2. Registrar no Claude Code

Crie (ou edite) `.mcp.json` na raiz do seu projeto:

```json
{
  "mcpServers": {
    "elyon": {
      "command": "node",
      "args": ["./mcp/dist/mcp/src/server.js"]
    }
  }
}
```

Ou registre globalmente no Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "elyon": {
      "command": "node",
      "args": ["/caminho/absoluto/para/elyon-dashboard/mcp/dist/mcp/src/server.js"]
    }
  }
}
```

Reinicie o Claude Code / Claude Desktop. As 6 tools aparecem como `elyon_auditor`, `elyon_data_analyst`, etc.

### 3. Dev loop

```bash
npm run dev      # tsc --watch
npm run inspect  # abre o MCP Inspector com o server carregado
```

## Exemplo de uso

### Auditor isolado

```
Use a tool elyon_auditor com:
- clientName: "Clínica Zênite"
- niche: "odontologia"
- budget: 15000
- metaCampaigns: [...dados...]
- googleCampaigns: [...dados...]
```

### Pipeline completo

```
Rode elyon_run_full_pipeline para a Clínica Zênite:
- nicho: odontologia estética
- budget: R$15k/mês
- faturamento: R$80k/mês
- ticket: R$2.500, margem 55%, CVR 12%
- histórico de campanhas: [últimos 3 meses]
- reportFormat: executive
```

O pipeline devolve um único JSON com `auditor`, `data_analyst`, `estrategista`, `copywriter`, `report` + lista de agentes executados/pulados + erros por agente (falhas não cascateiam).

Para pipelines parciais (ex.: cliente novo sem dados de campanha), passe `skipAgents: ["auditor"]` e o Data Analyst é invocado sem contexto de auditoria.

## Requisitos do cliente MCP

O cliente precisa suportar **sampling** (`createMessage`). Claude Code, Claude Desktop e o MCP Inspector suportam. Se usar um cliente que não suporta, as tools retornam `isError: true` com mensagem clara.

## Debug

- Logs em stderr — stdout é reservado ao protocolo JSON-RPC
- `npm run inspect` abre UI para testar tools interativamente
- Validação de input via Zod — erros retornam `isError: true` com detalhes

## Licença

Herda do projeto pai (`elyon-dashboard`).
