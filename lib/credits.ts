// lib/credits.ts — Sistema de créditos de IA por plano
import { supabaseAdmin } from '@/lib/supabase'

export const PLAN_CREDITS: Record<string, number> = {
  free:         15,
  trial:        60,
  individual:   150,
  profissional: 500,
  avancada:     2000,
  admin:        9999999,
}

export const OPERATION_COSTS: Record<string, number> = {
  nous_chat:        2,
  audit:            10,
  strategy:         8,
  diagnostic:       6,
  cro:              5,
  concorrentes:     5,
  conteudo:         3,
  persona:          3,
  intelligence:     4,
  budget_allocator: 3,
  channel_mix:      3,
  campaign_generate:4,
  action_plan:      3,
  assets_copy:      2,
  market_intel:     4,
}

function getLimit(plan: string): number {
  return PLAN_CREDITS[plan] ?? PLAN_CREDITS.free
}

function nextMonthReset(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString()
}

export async function getCredits(userId: string, plan: string) {
  const limit = getLimit(plan)
  if (!supabaseAdmin) return { used: 0, limit, remaining: limit, resetAt: nextMonthReset() }

  try {
    const { data } = await supabaseAdmin
      .from('ai_credits')
      .select('used, limit, reset_at')
      .eq('user_id', userId)
      .single()

    if (!data) return { used: 0, limit, remaining: limit, resetAt: nextMonthReset() }

    const now = new Date()
    const resetAt = new Date(data.reset_at)
    const used = now > resetAt ? 0 : (data.used ?? 0)

    return { used, limit, remaining: Math.max(limit - used, 0), resetAt: data.reset_at }
  } catch {
    return { used: 0, limit, remaining: limit, resetAt: nextMonthReset() }
  }
}

export async function checkAndDeductCredits(
  userId: string,
  plan: string,
  operation: string
): Promise<{ allowed: boolean; remaining: number; used: number; limit: number; error?: string }> {
  const limit = getLimit(plan)

  if (plan === 'admin' || limit >= 9999999) {
    return { allowed: true, remaining: 9999999, used: 0, limit }
  }

  const cost = OPERATION_COSTS[operation] ?? 2

  if (!supabaseAdmin) {
    return { allowed: true, remaining: limit, used: 0, limit }
  }

  try {
    const now      = new Date()
    const resetAt  = nextMonthReset()

    const { data: existing } = await supabaseAdmin
      .from('ai_credits')
      .select('used, limit, reset_at')
      .eq('user_id', userId)
      .single()

    let currentUsed = 0

    if (existing) {
      const expiry = new Date(existing.reset_at)
      currentUsed  = now > expiry ? 0 : (existing.used ?? 0)
    }

    if (currentUsed + cost > limit) {
      return {
        allowed:   false,
        remaining: Math.max(limit - currentUsed, 0),
        used:      currentUsed,
        limit,
        error:     `Você usou todos os seus créditos de IA este mês. Faça upgrade do seu plano para continuar.`,
      }
    }

    const newUsed = currentUsed + cost

    await supabaseAdmin.from('ai_credits').upsert(
      { user_id: userId, used: newUsed, limit, reset_at: existing?.reset_at || resetAt },
      { onConflict: 'user_id' }
    )

    return { allowed: true, remaining: limit - newUsed, used: newUsed, limit }
  } catch {
    return { allowed: true, remaining: limit, used: 0, limit }
  }
}
