// lib/modeTheme.ts — Tokens de tema por modo de visualização (light)
// Simple = accent green (leve, consultivo). Avançado = blue (técnico, atual)

import { getCssVariableValue } from '@/lib/cssVars'

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
  accent:      '#0E9E6E',
  accentSoft:  'rgba(14,158,110,0.08)',
  accentBorder:'rgba(14,158,110,0.20)',
  activeBg:    'rgba(14,158,110,0.10)',
  activeBorder:'rgba(14,158,110,0.20)',
  activeText:  '#0E9E6E',
  pageBg:      '#F4F5F7',
}

const ADVANCED: ModeTheme = {
  name:        'Modo Avançado',
  badgeIcon:   '⚙️',
  badgeText:   'Análise técnica',
  microcopy:   'Para analisar em detalhe',
  accent:      '#2C5FE0',
  accentSoft:  'rgba(44,95,224,0.08)',
  accentBorder:'rgba(44,95,224,0.20)',
  activeBg:    'rgba(44,95,224,0.10)',
  activeBorder:'rgba(44,95,224,0.20)',
  activeText:  '#2C5FE0',
  pageBg:      '#F4F5F7',
}

export function getModeTheme(mode: 'simple' | 'pro'): ModeTheme {
  return mode === 'simple' ? SIMPLE : ADVANCED
}
