// lib/gemini.ts — Wrapper REST do Google Gemini (camada ADITIVA ao Claude)
// Espelha a interface de lib/pipeline/llm.ts. Não substitui o Claude: é usado
// como fallback, grounding (Google Search), visão multimodal e cross-check.
// Se GEMINI_API_KEY não estiver setada, as funções lançam/retornam vazio e o
// app mantém exatamente o comportamento atual (degradação graciosa).

import { parseJsonSafe } from '@/lib/pipeline/llm'

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

/** Resolve o modelo por rota: GEMINI_MODEL_<FEATURE> → GEMINI_MODEL_DEFAULT → flash. */
export function geminiModel(feature?: 'VISION' | 'SEARCH' | 'CROSSCHECK' | 'FALLBACK'): string {
  const perFeature = feature ? process.env[`GEMINI_MODEL_${feature}`] : undefined
  return perFeature || process.env.GEMINI_MODEL_DEFAULT || 'gemini-2.0-flash'
}

export function isGeminiEnabled(): boolean {
  return !!process.env.GEMINI_API_KEY
}

export interface GeminiImage {
  mimeType: string  // ex. 'image/png', 'image/jpeg'
  base64: string    // conteúdo da imagem em base64 (sem o prefixo data:)
}

interface GeminiPart {
  text?: string
  inline_data?: { mime_type: string; data: string }
}

/**
 * Chamada de texto/visão ao Gemini via REST. Lança erro se a key não existir
 * ou se a API falhar — chamadores tratam como "indisponível" e seguem o
 * fallback já existente.
 */
export async function callGemini(params: {
  system?: string
  user: string
  maxTokens?: number
  temperature?: number
  model?: string
  images?: GeminiImage[]
  tools?: unknown[]
  timeoutMs?: number
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada')

  const model = params.model || geminiModel()

  const parts: GeminiPart[] = [{ text: params.user }]
  for (const img of params.images ?? []) {
    parts.push({ inline_data: { mime_type: img.mimeType, data: img.base64 } })
  }

  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      maxOutputTokens: params.maxTokens ?? 4000,
      ...(params.temperature != null ? { temperature: params.temperature } : {}),
    },
  }
  if (params.system) body.system_instruction = { parts: [{ text: params.system }] }
  if (params.tools) body.tools = params.tools

  const res = await fetch(`${GEMINI_BASE}/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(params.timeoutMs ?? 25000),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Gemini HTTP ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`)
  }

  const data = await res.json()
  const cand = data?.candidates?.[0]
  const text: string = (cand?.content?.parts ?? [])
    .map((p: GeminiPart) => p.text ?? '')
    .join('')
    .trim()

  if (!text) throw new Error('Gemini retornou resposta vazia')
  return text
}

/** Igual a callGemini, mas extrai JSON reusando o parser robusto do projeto. */
export async function callGeminiJson<T = unknown>(params: Parameters<typeof callGemini>[0]): Promise<T> {
  const raw = await callGemini(params)
  return parseJsonSafe<T>(raw)
}

// ── Grounding (Google Search) — mesma assinatura/`return ''` de lib/tavily.ts ──

/**
 * Busca benchmarks de marketing ancorados no Google Search (grounding nativo do
 * Gemini). Retorna string pronta para injetar no prompt, ou '' se indisponível.
 * Complementa — não substitui — fetchRealtimeBenchmarks() do Tavily.
 */
export async function fetchGroundedBenchmarks(niche: string, city?: string): Promise<string> {
  if (!isGeminiEnabled()) return ''
  const location = city ? ` em ${city}, Brasil` : ' no Brasil'
  const year = new Date().getFullYear()
  try {
    const text = await callGemini({
      model: geminiModel('SEARCH'),
      maxTokens: 900,
      temperature: 0.2,
      tools: [{ google_search: {} }],
      user: `Pesquise dados REAIS e atuais (${year}) de CPL (custo por lead), ROAS e CPC para o nicho "${niche}"${location}, separados por canal (Meta Ads, Google Ads, TikTok, LinkedIn). Responda em português, de forma concisa, listando faixas numéricas por canal com a fonte quando possível.`,
      timeoutMs: 9000,
    })
    return text ? `\n[Dados de mercado via Google Search — Gemini (${year})]\n${text}` : ''
  } catch {
    return ''
  }
}

/**
 * 1 consulta focada com grounding — para o chat Nous, onde velocidade importa.
 * Retorna string formatada ou '' se falhar.
 */
export async function fetchFocusedGrounded(niche: string, topic: string, city?: string): Promise<string> {
  if (!isGeminiEnabled()) return ''
  const location = city ? ` em ${city}, Brasil` : ' no Brasil'
  const year = new Date().getFullYear()
  try {
    const text = await callGemini({
      model: geminiModel('SEARCH'),
      maxTokens: 600,
      temperature: 0.2,
      tools: [{ google_search: {} }],
      user: `Pesquise dados reais e atuais (${year}) sobre "${topic}" para o nicho "${niche}"${location}. Responda em português, conciso, com números quando houver.`,
      timeoutMs: 8000,
    })
    return text ? `[Dados de mercado em tempo real — Google Search]\n${text}` : ''
  } catch {
    return ''
  }
}
