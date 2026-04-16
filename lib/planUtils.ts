// lib/planUtils.ts — Limites e permissões por plano

export type PlanTier = 'free' | 'individual' | 'profissional' | 'avancada'

export interface PlanLimits {
  maxClients: number
  hasConnections: boolean   // Meta Ads + Google Ads OAuth
  hasMultipleAccounts: boolean // Múltiplas contas por plataforma
  hasAudit: boolean         // Auditoria com IA
  hasAdvancedDiagnostic: boolean
  hasAPI: boolean
}

const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    maxClients: 0,
    hasConnections: false,
    hasMultipleAccounts: false,
    hasAudit: false,
    hasAdvancedDiagnostic: false,
    hasAPI: false,
  },
  individual: {
    maxClients: 1,
    hasConnections: false,
    hasMultipleAccounts: false,
    hasAudit: false,
    hasAdvancedDiagnostic: false,
    hasAPI: false,
  },
  profissional: {
    maxClients: 10,
    hasConnections: true,
    hasMultipleAccounts: false,
    hasAudit: true,
    hasAdvancedDiagnostic: true,
    hasAPI: false,
  },
  avancada: {
    maxClients: 999,
    hasConnections: true,
    hasMultipleAccounts: true,
    hasAudit: true,
    hasAdvancedDiagnostic: true,
    hasAPI: true,
  },
}

export function getPlanLimits(plan?: string): PlanLimits {
  const tier = (plan || 'free') as PlanTier
  return PLAN_LIMITS[tier] ?? PLAN_LIMITS.free
}

export function hasActivePlan(plan?: string): boolean {
  return !!plan && plan !== 'free' && plan in PLAN_LIMITS && plan !== 'free'
}

export const PLAN_NAMES: Record<string, string> = {
  individual:   'Individual',
  profissional: 'Profissional',
  avancada:     'Avançada',
}

export const UPGRADE_MESSAGES: Record<string, { title: string; description: string; requiredPlan: string }> = {
  connections: {
    title: 'Conexão Meta + Google Ads',
    description: 'Conecte suas contas de anúncios para ver dados reais em tempo real.',
    requiredPlan: 'Profissional',
  },
  audit: {
    title: 'Auditoria com IA',
    description: 'Análise automatizada das suas campanhas com recomendações da IA.',
    requiredPlan: 'Profissional',
  },
  clients: {
    title: 'Mais clientes',
    description: 'O plano Individual permite apenas 1 cliente ativo.',
    requiredPlan: 'Profissional',
  },
}
