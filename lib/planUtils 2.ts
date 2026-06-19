// lib/planUtils.ts — Limites e permissões por plano

export type PlanTier = 'free' | 'trial' | 'individual' | 'profissional' | 'avancada'

export interface PlanLimits {
  maxClients: number
  maxStrategiesPerHour: number  // 0 = sem limite
  // Grupos de abas
  hasAnunciosGroup: boolean     // Anúncios IA + Audiências
  hasCriativoGroup: boolean     // Campanha, Persona, Conteúdo, Assets, Concorrentes
  hasAvancadoGroup: boolean     // Inteligência, Cenários, Mercado & Nicho
  // Features específicas
  hasConnections: boolean       // Meta Ads + Google Ads OAuth
  hasAudit: boolean             // Análise Profunda
}

const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    maxClients: 1,
    maxStrategiesPerHour: 2,
    hasAnunciosGroup: false,
    hasCriativoGroup: false,
    hasAvancadoGroup: false,
    hasConnections: false,
    hasAudit: false,
  },
  trial: {
    maxClients: 3,
    maxStrategiesPerHour: 4,
    hasAnunciosGroup: true,
    hasCriativoGroup: true,
    hasAvancadoGroup: true,
    hasConnections: true,
    hasAudit: true,
  },
  individual: {
    maxClients: 3,
    maxStrategiesPerHour: 0,
    hasAnunciosGroup: false,
    hasCriativoGroup: false,
    hasAvancadoGroup: false,
    hasConnections: false,
    hasAudit: true,
  },
  profissional: {
    maxClients: 10,
    maxStrategiesPerHour: 0,
    hasAnunciosGroup: true,
    hasCriativoGroup: true,
    hasAvancadoGroup: false,
    hasConnections: true,
    hasAudit: true,
  },
  avancada: {
    maxClients: 30,
    maxStrategiesPerHour: 0,
    hasAnunciosGroup: true,
    hasCriativoGroup: true,
    hasAvancadoGroup: true,
    hasConnections: true,
    hasAudit: true,
  },
}

export function getPlanLimits(plan?: string): PlanLimits {
  const tier = (plan || 'free') as PlanTier
  return PLAN_LIMITS[tier] ?? PLAN_LIMITS.free
}

export function hasActivePlan(plan?: string): boolean {
  return !!plan && plan !== 'free' && plan in PLAN_LIMITS
}

export const TRIAL_DAYS = 7

export const PLAN_NAMES: Record<string, string> = {
  free:         'Start',
  individual:   'Pro',
  profissional: 'Agency',
  avancada:     'Enterprise',
}

export const PLAN_PRICES: Record<string, string> = {
  individual:   'R$297/mês',
  profissional: 'R$997/mês',
  avancada:     'R$2.997/mês',
}

// Plano mínimo necessário para cada grupo bloqueado
export const GROUP_REQUIRED_PLAN: Record<string, { name: string; price: string; tier: PlanTier }> = {
  anuncios: { name: 'Agency', price: 'R$997/mês',   tier: 'profissional' },
  criativo: { name: 'Agency', price: 'R$997/mês',   tier: 'profissional' },
  avancado: { name: 'Enterprise', price: 'R$2.997/mês', tier: 'avancada' },
}
