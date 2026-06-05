// lib/modeTheme.ts — Tokens de tema por modo de visualização (dark-consistent).
// Simple = acento verde/emerald (leve, consultivo). Avançado = roxo (técnico, atual).
// Mantém o dark theme premium; a diferenciação vem do ACENTO, badge e tint de fundo.

export interface ModeTheme {
  name: string
  badgeIcon: string
  badgeText: string
  microcopy: string
  accent: string         // cor principal do modo
  accentSoft: string     // fundo suave do acento
  accentBorder: string   // borda do acento
  activeBg: string       // fundo do item ativo na sidebar
  activeBorder: string   // borda do item ativo
  activeText: string     // texto do item ativo
  pageBg: string         // fundo da área principal
}

const SIMPLE: ModeTheme = {
  name:        'Modo Simplificado',
  badgeIcon:   '🟢',
  badgeText:   'Linguagem simples',
  microcopy:   'Para entender e agir',
  accent:      '#22C55E',
  accentSoft:  'rgba(34,197,94,0.12)',
  accentBorder:'rgba(34,197,94,0.30)',
  activeBg:    'rgba(34,197,94,0.14)',
  activeBorder:'rgba(34,197,94,0.30)',
  activeText:  '#4ADE80',
  pageBg:      'linear-gradient(160deg, rgba(34,197,94,0.05) 0%, #080D1A 38%)',
}

const ADVANCED: ModeTheme = {
  name:        'Modo Avançado',
  badgeIcon:   '⚙️',
  badgeText:   'Análise técnica',
  microcopy:   'Para analisar em detalhe',
  accent:      '#7C3AED',
  accentSoft:  'rgba(124,58,237,0.12)',
  accentBorder:'rgba(124,58,237,0.25)',
  activeBg:    'rgba(124,58,237,0.15)',
  activeBorder:'rgba(124,58,237,0.25)',
  activeText:  '#A78BFA',
  pageBg:      '#080D1A',
}

export function getModeTheme(mode: 'simple' | 'pro'): ModeTheme {
  return mode === 'simple' ? SIMPLE : ADVANCED
}
