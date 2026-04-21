// lib/pipeline/llm.ts — Anthropic SDK wrapper para o pipeline de agentes
// Substitui o MCP sampling (server.createMessage) por chamadas diretas à API.

import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) throw new Error('ANTHROPIC_API_KEY não configurada')
    _client = new Anthropic({ apiKey: key })
  }
  return _client
}

export async function callLLM(params: {
  system?: string
  user: string
  maxTokens?: number
  temperature?: number
}): Promise<string> {
  const client = getClient()
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: params.maxTokens ?? 4000,
    ...(params.temperature != null ? { temperature: params.temperature } : {}),
    ...(params.system ? { system: params.system } : {}),
    messages: [{ role: 'user', content: params.user }],
  })
  const block = msg.content[0]
  if (block.type !== 'text') throw new Error('LLM retornou conteúdo não-texto')
  return block.text
}

export function parseJsonSafe<T = unknown>(raw: string): T {
  let str = raw.trim()
  if (str.startsWith('```')) {
    str = str.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
  }
  try {
    return JSON.parse(str) as T
  } catch {
    const lastBrace   = str.lastIndexOf('}')
    const lastBracket = str.lastIndexOf(']')
    const cutAt = Math.max(lastBrace, lastBracket)
    if (cutAt > 50) {
      try { return JSON.parse(str.slice(0, cutAt + 1)) as T } catch { /* fall */ }
    }
    throw new Error('Resposta da IA com JSON inválido. Tente novamente.')
  }
}

export async function callLLMJson<T = unknown>(params: {
  system?: string
  user: string
  maxTokens?: number
  temperature?: number
}): Promise<T> {
  const raw = await callLLM(params)
  return parseJsonSafe<T>(raw)
}
