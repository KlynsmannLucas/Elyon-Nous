// lib/gate.ts — Gating unificado para rotas de IA: autentica, valida plano/trial
// e cobra créditos numa só chamada. Mesmo comportamento das rotas que já cobram
// (nous, audit, strategy…), agora reaproveitável.
import { auth, clerkClient } from '@clerk/nextjs/server'
import { checkAndDeductCredits, refundCredits } from '@/lib/credits'
import { effectivePlanForUser } from '@/lib/access'

export interface GateResult { ok: boolean; status?: number; error?: string; userId?: string; effectivePlan?: string; chargeId?: string }

export async function gateAndCharge(operation: string): Promise<GateResult> {
  const { userId } = await auth()
  if (!userId) return { ok: false, status: 401, error: 'Não autorizado' }

  let effectivePlan: string | null
  try {
    const clerkUser = await (await clerkClient()).users.getUser(userId)
    effectivePlan = effectivePlanForUser(clerkUser)
  } catch {
    return { ok: false, status: 503, error: 'Não foi possível verificar seu plano. Tente novamente.' }
  }
  if (!effectivePlan) return { ok: false, status: 402, error: 'Período de avaliação encerrado. Assine um plano para continuar.', userId }

  const credit = await checkAndDeductCredits(userId, effectivePlan, operation)
  if (!credit.allowed) return { ok: false, status: credit.status || 503, error: credit.error, userId, effectivePlan }
  return { ok: true, userId, effectivePlan, chargeId: credit.chargeId }
}

// Devolve os créditos cobrados quando a geração falha após o débito (best-effort).
export async function refundGate(gate: GateResult, operation: string) {
  if (gate.userId && gate.effectivePlan) {
    try { await refundCredits(gate.userId, gate.effectivePlan, operation, gate.chargeId) } catch { /* best-effort */ }
  }
}

// Wrap JSON operations so validation/provider failures return the exact debit once.
export async function withCreditCharge(operation: string, run: () => Promise<Response>): Promise<Response> {
  const gate = await gateAndCharge(operation)
  if (!gate.ok) return Response.json({ success: false, error: gate.error }, { status: gate.status || 503 })
  try {
    const response = await run()
    let failed = !response.ok
    if (response.headers.get('content-type')?.includes('application/json')) {
      const body = await response.clone().json().catch(() => null)
      failed ||= body?.success === false || !!body?.error
    }
    if (failed) await refundGate(gate, operation)
    return response
  } catch {
    await refundGate(gate, operation)
    return Response.json({ success: false, error: 'Não foi possível concluir a operação.' }, { status: 500 })
  }
}
