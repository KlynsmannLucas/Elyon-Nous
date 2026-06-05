// lib/errMsg.ts — Extrai uma mensagem legível de QUALQUER formato de erro.
// Evita renderizar "[object Object]" quando um erro estruturado (ex: Google Ads
// API, Supabase) é lançado em vez de um Error com .message string.

export function errMsg(x: unknown, fallback = 'Erro inesperado.'): string {
  if (x == null) return fallback
  if (typeof x === 'string') return x || fallback

  // Error nativo (ou similar) com message string
  const anyX = x as any
  if (typeof anyX.message === 'string' && anyX.message && anyX.message !== '[object Object]') {
    return anyX.message
  }

  // Padrões comuns de APIs: { error }, { error: { message } }, { errors: [...] }
  if (typeof anyX.error === 'string' && anyX.error) return anyX.error
  if (anyX.error && typeof anyX.error.message === 'string') return anyX.error.message
  if (Array.isArray(anyX.errors) && anyX.errors.length) {
    const parts = anyX.errors
      .map((e: any) => (typeof e === 'string' ? e : e?.message || e?.error_string || ''))
      .filter(Boolean)
    if (parts.length) return parts.join(' | ')
  }
  if (typeof anyX.error_string === 'string' && anyX.error_string) return anyX.error_string

  // Último recurso: serializa sem quebrar e sem "[object Object]"
  try {
    const json = JSON.stringify(anyX)
    if (json && json !== '{}') return json
  } catch {}
  return fallback
}
