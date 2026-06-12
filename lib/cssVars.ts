// lib/cssVars.ts — leitura de CSS variables em runtime (client-side).
// Usado pelo tema por modo (lib/modeTheme.ts). Seguro no SSR: retorna fallback.

export function getCssVariableValue(name: string, fallback = ''): string {
  if (typeof window === 'undefined' || typeof document === 'undefined') return fallback
  try {
    const varName = name.startsWith('--') ? name : `--${name}`
    const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
    return val || fallback
  } catch {
    return fallback
  }
}
