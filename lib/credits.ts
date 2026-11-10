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
  first_ad:        2,
  competitor_xray: 2,
  pipeline:        29, // full 360° analysis bundle
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
  assets_generate:  5,
  market_intel:     4,
  gemini_vision:    3,
  gemini_crosscheck:4,
  creative_intelligence: 4,
  creative_detail:       1,
}

export interface CreditResult {
  allowed: boolean; remaining: number; used: number; limit: number
  error?: string; status?: number; chargeId?: string
}

export async function getCredits(userId: string, plan: string) {
  if (!supabaseAdmin) throw new Error('Serviço de créditos indisponível')
  const { data, error } = await supabaseAdmin.from('ai_credits')
    .select('used, reset_at').eq('user_id', userId).maybeSingle()
  if (error) throw new Error('Não foi possível consultar os créditos')
  const limit = PLAN_CREDITS[plan] ?? PLAN_CREDITS.free
  const expired = !data || new Date(data.reset_at).getTime() <= Date.now()
  const used = expired ? 0 : data.used
  const next = new Date(); next.setUTCMonth(next.getUTCMonth() + 1, 1); next.setUTCHours(0, 0, 0, 0)
  return { used, limit, remaining: Math.max(0, limit - used), resetAt: expired ? next.toISOString() : data.reset_at, plan }
}

export async function checkAndDeductCredits(userId: string, plan: string, operation: string): Promise<CreditResult> {
  const limit = PLAN_CREDITS[plan] ?? PLAN_CREDITS.free
  const cost = OPERATION_COSTS[operation]
  const unavailable: CreditResult = { allowed: false, remaining: 0, used: 0, limit, status: 503, error: 'Serviço de créditos indisponível. Tente novamente.' }
  if (!cost) return { ...unavailable, status: 400, error: 'Operação inválida' }
  if (!supabaseAdmin) return unavailable
  try {
    const { data, error } = await supabaseAdmin.rpc('elyon_charge_credits', {
      p_user_id: userId, p_limit: limit, p_cost: cost, p_operation: operation,
    })
    if (error || !data) return unavailable
    return { ...data, status: data.allowed ? 200 : 402,
      error: data.allowed ? undefined : 'Créditos insuficientes. Faça upgrade do plano para continuar.' }
  } catch { return unavailable }
}

// Refunds identify the exact debit: retry-safe and cannot affect a new monthly period.
export async function refundCredits(userId: string, _plan: string, _operation: string, chargeId?: string): Promise<void> {
  if (!supabaseAdmin || !chargeId) return
  const { error } = await supabaseAdmin.rpc('elyon_refund_credits', { p_user_id: userId, p_charge_id: chargeId })
  if (error) console.error('[credits] Falha ao estornar cobrança', error.message)
}
