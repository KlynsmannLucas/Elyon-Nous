# Integração Google Gemini (camada aditiva)

O Gemini foi adicionado de forma **100% aditiva** ao redor do Claude (que segue
sendo o motor principal). Se `GEMINI_API_KEY` não estiver configurada, o app se
comporta **exatamente como antes** — todas as features Gemini se desativam
sozinhas (endpoints retornam 503 e os painéis de UI se escondem).

## Variáveis de ambiente

Adicione em `.env.local` (e nas envs da Vercel):

```bash
# Obrigatória para ligar qualquer feature Gemini
GEMINI_API_KEY=...

# Modelo padrão (opcional — default no código: gemini-2.0-flash)
GEMINI_MODEL_DEFAULT=gemini-2.0-flash

# Overrides opcionais por rota/feature (decisão "por rota").
# Cada um cai para GEMINI_MODEL_DEFAULT se não definido.
GEMINI_MODEL_FALLBACK=gemini-2.0-flash   # resiliência (strategy/audit/nous)
GEMINI_MODEL_SEARCH=gemini-2.0-flash     # grounding Google Search
GEMINI_MODEL_VISION=gemini-2.0-flash     # análise visual de criativos/LP
GEMINI_MODEL_CROSSCHECK=gemini-2.0-flash # segunda opinião
```

> Chave: https://aistudio.google.com/apikey

As chamadas são **server-side** (rotas `app/api/*`), então **não há mudança de
CSP** em `next.config.mjs`.

## O que cada fase faz

| Fase | Onde | Comportamento |
|------|------|---------------|
| 1 — Resiliência | `app/api/strategy`, `app/api/audit`, `app/api/nous` | Se o Claude falhar/timeout, tenta o Gemini **antes** do fallback estático. Resposta marca `source: 'gemini'`. |
| 2 — Grounding | `app/api/benchmarks/refresh`, `app/api/nous`, `app/api/strategy` | Roda Tavily **+** Google Search do Gemini em paralelo e concatena. Cada fonte degrada para `''` isolada. |
| 3 — Segunda opinião | `app/api/cross-check` + painel em `TabAuditoria` | Gemini revisa a análise do Claude e aponta concordâncias/divergências/pontos cegos. Não altera a análise original. |
| 4 — Análise visual | `app/api/vision/creative` + painel em `TabAssets` | Upload de imagem de criativo / print de LP → parecer de CRO (score, problemas, recomendações). |

## Helper central

`lib/gemini.ts` — espelha `lib/pipeline/llm.ts`:
- `callGemini(...)` / `callGeminiJson(...)` (texto + visão via `images`)
- `fetchGroundedBenchmarks(...)` / `fetchFocusedGrounded(...)` (grounding)
- `geminiModel(feature)` resolve o modelo por rota
- `isGeminiEnabled()` — usado para esconder features quando não há chave
- reusa `parseJsonSafe` de `lib/pipeline/llm.ts`

## Créditos

Apenas as features com custo novo de usuário debitam crédito
(`lib/credits.ts` → `OPERATION_COSTS`): `gemini_vision: 3`, `gemini_crosscheck: 4`.
Resiliência e grounding **não cobram a mais** (já estão dentro de operações que
já debitaram). Em falha, há `refundCredits`.

## Como verificar

1. **Sem** `GEMINI_API_KEY`: app idêntico ao de hoje; painéis Gemini ausentes.
2. **Com** a chave: painéis "Análise visual" (aba Assets) e "Segunda opinião"
   (aba Auditoria) aparecem; benchmarks/estratégia ganham dados via grounding.
3. Forçando falha do Claude (chave inválida temporária): respostas passam a vir
   com `source: 'gemini'` em vez do benchmark estático.
