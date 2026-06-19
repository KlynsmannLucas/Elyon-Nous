// Sanitização de campos de texto livre que vão para prompts de IA.
// Previne prompt injection, trunca entradas muito longas e remove caracteres de controle.

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/gi,
  /you\s+are\s+now/gi,
  /act\s+as\s+(a\s+)?(?:different|new|another)/gi,
  /system\s*:/gi,
  /\[INST\]/gi,
  /<\|(?:im_start|im_end|system|user|assistant)\|>/gi,
  /###\s*instruction/gi,
]

export function sanitizeText(value: unknown, maxLength = 500): string {
  if (typeof value !== 'string') return ''
  let s = value
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // controle
    .trim()
    .slice(0, maxLength)

  for (const pattern of INJECTION_PATTERNS) {
    s = s.replace(pattern, '[REMOVIDO]')
  }
  return s
}

export function sanitizeNumber(value: unknown, min = 0, max = 1_000_000_000): number {
  const n = Number(value)
  if (!isFinite(n)) return 0
  return Math.min(Math.max(n, min), max)
}
