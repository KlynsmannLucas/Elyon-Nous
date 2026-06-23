// lib/aiJson.ts — Parsing ROBUSTO de JSON vindo de LLM (texto).
// Substitui o padrão frágil `JSON.parse(text)` + regex que quebrava com aspas/
// quebras de linha no meio de strings (causa de erros "Expected ',' or '}'").
//
// Estratégia em camadas:
// 1) parse direto;
// 2) remove cercas markdown ```json ... ```;
// 3) extrai o bloco {…}/[…] BALANCEADO (respeitando strings/escapes);
// 4) repara: tira vírgula sobrando + escapa control chars literais dentro de strings.

function tryParse<T>(s: string): T | null {
  try { return JSON.parse(s) as T } catch { return null }
}

// Acha o primeiro bloco { } ou [ ] balanceado, ignorando chaves dentro de strings.
function extractBalanced(s: string): string | null {
  const start = s.search(/[{[]/)
  if (start < 0) return null
  const open = s[start]
  const close = open === '{' ? '}' : ']'
  let depth = 0, inStr = false, escaped = false
  for (let i = start; i < s.length; i++) {
    const ch = s[i]
    if (escaped) { escaped = false; continue }
    if (ch === '\\') { escaped = true; continue }
    if (ch === '"') { inStr = !inStr; continue }
    if (inStr) continue
    if (ch === open) depth++
    else if (ch === close) { depth--; if (depth === 0) return s.slice(start, i + 1) }
  }
  return s.slice(start) // não fechou — devolve do início para o reparo tentar
}

// Repara as duas falhas mais comuns de LLM.
function repair(s: string): string {
  // vírgula sobrando antes de } ou ]
  let t = s.replace(/,(\s*[}\]])/g, '$1')
  // control chars LITERAIS dentro de strings → escapados
  let out = ''
  let inStr = false, escaped = false
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]
    if (escaped) { out += ch; escaped = false; continue }
    if (ch === '\\') { out += ch; escaped = true; continue }
    if (ch === '"') { inStr = !inStr; out += ch; continue }
    if (inStr) {
      if (ch === '\n') { out += '\\n'; continue }
      if (ch === '\r') { out += '\\r'; continue }
      if (ch === '\t') { out += '\\t'; continue }
    }
    out += ch
  }
  return out
}

/**
 * Extrai e parseia JSON de uma resposta de LLM, tolerando os erros comuns.
 * Lança Error com mensagem amigável se for impossível interpretar.
 */
export function extractJson<T = any>(raw: string): T {
  if (!raw || typeof raw !== 'string') throw new Error('Resposta vazia da IA.')
  let s = raw.trim()
  // remove cercas markdown
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

  let out = tryParse<T>(s)
  if (out !== null) return out

  const block = extractBalanced(s)
  if (block) {
    out = tryParse<T>(block)
    if (out !== null) return out
    out = tryParse<T>(repair(block))
    if (out !== null) return out
  }
  throw new Error('Não consegui interpretar a resposta da IA (JSON inválido).')
}

/** Versão que não lança: devolve `fallback` (default null) se não conseguir parsear. */
export function safeExtractJson<T = any>(raw: string, fallback: T | null = null): T | null {
  try { return extractJson<T>(raw) } catch { return fallback }
}
