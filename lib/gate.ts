// lib/gate.ts — Gating unificado para rotas de IA: autentica, valida plano/trial
// e cobra créditos numa só chamada. Mesmo comportamento das rotas que já cobram
// (nous, audit, strategy…), agora reaproveitável.
import { auth, clerkClient } from '@clerk/nextjs/server'
import { checkAndDeductCredits, refundCredits } from '@/lib/credits'
import { hasActivePlan, TRIAL_DAYS } from '@/lib/planUtils'

export interface GateResult { ok: boolean; status?: number; error?: string; userId?: string; effectivePlan?: string }

export async function gateAndCharge(operation: string): Promise<GateResult> {
  const { userId } = await auth()
  if (!userId) return { ok: false, status: 401, error: 'Não autorizado' }

  let effectivePlan = 'free'
  try {
    const clerkUser = await (await clerkClient()).users.getUser(userId)
    const plan = (clerkUser.publicMetadata as any)?.plan as string | undefined
    effectivePlan = plan || 'free'
    if (!hasActivePlan(plan)) {
      const createdAtMs = typeof clerkUser.createdAt === 'number' ? clerkUser.createdAt : new Date(clerkUser.createdAt as any).getTime()
      const inTrial = (Date.now() - createdAtMs) < TRIAL_DAYS * 24 * 60 * 60 * 1000
      if (!inTrial) return { ok: false, status: 402, error: 'Período de avaliação encerrado. Assine um plano para continuar.', userId }
      effectivePlan = 'trial'
    }
  } catch {
    // Se o Clerk falhar, não bloqueia por plano — segue para créditos como 'free'.
  }

  const credit = await checkAndDeductCredits(userId, effectivePlan, operation)
  if (!credit.allowed) return { ok: false, status: 402, error: credit.error, userId, effectivePlan }
  return { ok: true, userId, effectivePlan }
}

// Devolve os créditos cobrados quando a geração falha após o débito (best-effort).
export async function refundGate(gate: GateResult, operation: string) {
  if (gate.userId && gate.effectivePlan) {
    try { await refundCredits(gate.userId, gate.effectivePlan, operation) } catch { /* best-effort */ }
  }
}
