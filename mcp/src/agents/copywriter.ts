// src/agents/copywriter.ts — Agente Copywriter (anúncios de performance)
// Gera variações de copy por framework psicológico (dor, desejo, prova social, CTA forte).
// Alinhado à voz do nicho via niche_prompts.

import { z } from "zod";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  getBenchmark,
  getBenchmarkSummary,
} from "../../../lib/niche_benchmarks.js";
import { buildNichePromptContext } from "../../../lib/niche_prompts.js";
import { callLLMJson } from "../sampling.js";

// ── Schemas ─────────────────────────────────────────────────────────────────
const PlatformEnum = z.enum([
  "meta_feed",
  "meta_stories",
  "meta_reels",
  "google_search",
  "google_pmax",
  "tiktok",
  "youtube",
  "linkedin",
  "whatsapp",
]);

const FrameworkEnum = z.enum([
  "dor",
  "desejo",
  "prova_social",
  "autoridade",
  "urgencia",
  "transformacao",
  "objecao",
  "curiosidade",
]);

const FormatEnum = z.enum([
  "imagem",
  "carrossel",
  "video_curto",
  "video_longo",
  "texto",
]);

export const CopywriterInputSchema = z.object({
  clientName: z.string(),
  niche: z.string(),
  product: z
    .string()
    .describe("Produto/serviço sendo anunciado (ex: 'clareamento dental')"),
  offer: z
    .string()
    .optional()
    .describe("Oferta específica (ex: '1ª consulta grátis')"),
  targetAudience: z
    .string()
    .optional()
    .describe("Público-alvo (ex: 'mulheres 25-45 que querem emagrecer')"),
  mainPain: z
    .string()
    .optional()
    .describe("Principal dor que o produto resolve"),
  mainDesire: z
    .string()
    .optional()
    .describe("Principal desejo/transformação do cliente"),
  objections: z
    .array(z.string())
    .default([])
    .describe("Objeções comuns que precisam ser quebradas"),
  differentials: z
    .array(z.string())
    .default([])
    .describe("Diferenciais (prova social, garantia, expertise)"),
  tone: z
    .string()
    .optional()
    .describe("Tom desejado: 'consultivo', 'urgente', 'inspirador', etc."),
  platforms: z
    .array(PlatformEnum)
    .default(["meta_feed", "google_search"])
    .describe("Plataformas alvo"),
  frameworks: z
    .array(FrameworkEnum)
    .default(["dor", "desejo", "prova_social", "urgencia"])
    .describe("Frameworks psicológicos a explorar"),
  formats: z
    .array(FormatEnum)
    .default(["imagem", "carrossel", "video_curto"])
    .describe("Formatos criativos desejados"),
  variationsPerFramework: z.number().int().default(2).describe("Variações por framework"),
  nicheDetails: z.record(z.string()).default({}),
  strategyChannels: z
    .array(z.string())
    .optional()
    .describe("Canais priorizados pela estratégia (vindo do Estrategista)"),
  cpl_target: z.number().optional().describe("CPL alvo da estratégia (R$)"),
  cta_preferences: z
    .array(z.string())
    .optional()
    .describe("CTAs preferidos do cliente"),
});

export type CopywriterInput = z.infer<typeof CopywriterInputSchema>;

// ── Output ──────────────────────────────────────────────────────────────────
export interface AdVariation {
  framework: string;
  titulo: string; // headline (até 40 chars)
  subtitulo?: string; // subhead (até 60 chars)
  corpo: string; // corpo do anúncio
  cta: string; // call to action
  formato_sugerido: string;
  plataforma: string;
  gancho: string; // primeira frase que prende
  beneficio_principal: string;
  prova: string; // prova social / garantia
  quebra_objecao: string;
  notas_criativo: string; // instruções visuais/audio
  teste_hipotese: string; // o que esta variação está testando
}

export interface CopywriterOutput {
  agent: "copywriter";
  briefing_resumo: string;
  tom_de_voz: string;
  big_idea: string; // conceito central da campanha
  variacoes: AdVariation[];
  variacoes_por_framework: Record<string, AdVariation[]>;
  recomendacoes_criativas: string[];
  headlines_alternativas: string[]; // 10 headlines extras para testes rápidos
  ctas_alternativos: string[];
  angulos_a_evitar: string[];
  plano_de_teste: Array<{ fase: string; teste: string; metrica: string }>;
  generated_at: string;
  source: "ai";
}

// ── Prompt builder ──────────────────────────────────────────────────────────
function buildCopywriterPrompt(input: CopywriterInput): string {
  const {
    clientName,
    niche,
    product,
    offer,
    targetAudience,
    mainPain,
    mainDesire,
    objections,
    differentials,
    tone,
    platforms,
    frameworks,
    formats,
    variationsPerFramework,
    nicheDetails,
    strategyChannels,
    cpl_target,
    cta_preferences,
  } = input;

  const bench = getBenchmark(niche);
  const benchmarkSection = getBenchmarkSummary(niche);
  const nicheContext = buildNichePromptContext(niche, nicheDetails);

  const totalVariations = frameworks.length * variationsPerFramework;

  return `Você é um copywriter sênior de tráfego pago, escola do direct response (Gary Halbert, Dan Kennedy, Eugene Schwartz), adaptado ao mercado brasileiro. Escreve copy que CONVERTE — não copy que soa bonito. Já escreveu mais de 10.000 anúncios no Meta/Google com ROAS comprovado.

FILOSOFIA:
- Copy que vende é copy que entende DOR antes de prometer solução
- O primeiro segundo decide tudo: se o gancho não prende, o resto não importa
- Escreva na linguagem EXATA do cliente — não do anunciante
- Prova > Promessa > Processo > Preço (nessa ordem)
- CTAs específicos convertem 3× mais que genéricos ("Agendar avaliação" > "Saiba mais")

REGRAS OBRIGATÓRIAS:
1. Use a terminologia correta do nicho "${niche}" — jamais genérico
2. Cada variação deve ter um GANCHO diferente (não repita ângulos)
3. Headlines com no máximo 40 caracteres — mobile first
4. Respeite o framework solicitado — não misture
5. CTAs específicos e verbais (comece com verbo de ação)
6. Não use clichês vazios ("transforme sua vida", "o melhor do mercado")
7. Adequar formato à plataforma (Stories ≠ Feed ≠ Search)

=== BRIEFING ===
Cliente: ${clientName}
Nicho: ${niche}
Produto/serviço: ${product}
Oferta: ${offer || "Não informada — criar ofertas relevantes"}
Público-alvo: ${targetAudience || "Definir com base no nicho"}
Principal dor: ${mainPain || "Inferir do nicho"}
Principal desejo: ${mainDesire || "Inferir do nicho"}
Objeções comuns: ${objections.length > 0 ? objections.join(" | ") : "Inferir do nicho"}
Diferenciais: ${differentials.length > 0 ? differentials.join(" | ") : "Nenhum informado"}
Tom desejado: ${tone || "Consultivo e direto"}

=== PLATAFORMAS ALVO ===
${platforms.join(", ")}

=== FORMATOS ===
${formats.join(", ")}

=== FRAMEWORKS A EXPLORAR ===
${frameworks.map((f) => `- ${f}`).join("\n")}

=== GERAR ===
${variationsPerFramework} variação(ões) por framework = ${totalVariations} variações no total.
${strategyChannels ? `\nCanais priorizados pela estratégia: ${strategyChannels.join(", ")}` : ""}
${cpl_target ? `\nCPL alvo da estratégia: R$${cpl_target} — escrever com foco em EFICIÊNCIA` : ""}
${cta_preferences ? `\nCTAs preferidos do cliente: ${cta_preferences.join(", ")}` : ""}

${benchmarkSection ? `=== BENCHMARK DO NICHO ===\n${benchmarkSection}` : ""}
${nicheContext ? `\n=== CONTEXTO ESPECIALIZADO DO NICHO ===${nicheContext}` : ""}
${bench?.insights?.length ? `\n=== INSIGHTS DO NICHO (use no gancho) ===\n${bench.insights.map((i) => `- ${i}`).join("\n")}` : ""}

Responda APENAS com JSON válido (sem markdown, sem \`\`\`json):

{
  "briefing_resumo": "<resumo em 1 frase do que vai ser criado>",
  "tom_de_voz": "<descrição do tom: vocabulário, ritmo, gatilhos>",
  "big_idea": "<conceito central que une todas as variações — a ideia ÚNICA>",

  "variacoes": [
    {
      "framework": "<dor|desejo|prova_social|autoridade|urgencia|transformacao|objecao|curiosidade>",
      "titulo": "<headline até 40 chars>",
      "subtitulo": "<subhead opcional até 60 chars>",
      "corpo": "<corpo do anúncio: 2-4 frases no Meta, 90 chars no Google Search>",
      "cta": "<call to action específico com verbo>",
      "formato_sugerido": "<imagem|carrossel|video_curto|video_longo|texto>",
      "plataforma": "<meta_feed|meta_stories|meta_reels|google_search|google_pmax|tiktok|youtube|linkedin|whatsapp>",
      "gancho": "<primeira frase que prende — separada para análise>",
      "beneficio_principal": "<benefício único desta variação>",
      "prova": "<elemento de prova: dado, depoimento, garantia, autoridade>",
      "quebra_objecao": "<objeção principal quebrada nesta variação>",
      "notas_criativo": "<instruções visuais para o designer/editor — cena, elemento principal, emoção>",
      "teste_hipotese": "<o que esta variação está testando que as outras não testam>"
    }
  ],

  "variacoes_por_framework": {
    "dor": [/* variações do framework dor */],
    "desejo": [/* etc */]
  },

  "recomendacoes_criativas": [
    "<recomendação #1 sobre composição visual>",
    "<recomendação #2 sobre ritmo e edição>",
    "<recomendação #3 sobre áudio/narração>"
  ],

  "headlines_alternativas": [
    "<headline extra #1>",
    "<headline extra #2>",
    "<até 10 headlines para testes rápidos>"
  ],

  "ctas_alternativos": [
    "<CTA alt #1>", "<CTA alt #2>", "<CTA alt #3>", "<CTA alt #4>"
  ],

  "angulos_a_evitar": [
    "<ângulo que NÃO funciona no nicho e por quê>"
  ],

  "plano_de_teste": [
    {"fase": "Semana 1", "teste": "<teste A/B prioritário>", "metrica": "<CTR, CPC, CPL — qual decide>"},
    {"fase": "Semana 2", "teste": "<teste seguinte>", "metrica": "<métrica>"},
    {"fase": "Semana 3", "teste": "<teste seguinte>", "metrica": "<métrica>"}
  ]
}`;
}

// ── Executor ────────────────────────────────────────────────────────────────
export async function runCopywriter(
  server: Server,
  input: CopywriterInput
): Promise<CopywriterOutput> {
  const prompt = buildCopywriterPrompt(input);

  const result = await callLLMJson<
    Omit<CopywriterOutput, "agent" | "generated_at" | "source">
  >(server, {
    user: prompt,
    maxTokens: 8000,
  });

  return {
    agent: "copywriter",
    ...result,
    generated_at: new Date().toISOString(),
    source: "ai",
  };
}
