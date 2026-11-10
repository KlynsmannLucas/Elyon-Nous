import { TRIAL_DAYS } from '@/lib/planUtils'

// Role is server-managed private metadata; subscription names never grant admin access.
export function isAdministrator(user: { privateMetadata?: Record<string, unknown> }): boolean {
  return user.privateMetadata?.role === 'admin'
}

export function effectivePlanForUser(user: {
  publicMetadata?: Record<string, unknown>; privateMetadata?: Record<string, unknown>; createdAt: number
}, now = Date.now()): string | null {
  if (isAdministrator(user)) return 'admin'
  const plan = user.publicMetadata?.plan
  if (plan === 'individual' || plan === 'profissional' || plan === 'avancada') return plan
  const age = now - user.createdAt
  return age >= 0 && age < TRIAL_DAYS * 86400000 ? 'trial' : null
}
