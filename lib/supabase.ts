// lib/supabase.ts — Cliente Supabase (mesmo banco do app Python)
import { createClient } from '@supabase/supabase-js'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  || ''
const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Supabase is optional — features that depend on it degrade gracefully
export const supabase = url && key ? createClient(url, key) : null as any

// Cliente admin com service role key (server-side apenas)
// Se SUPABASE_SERVICE_ROLE_KEY não estiver definido, usa a anon key como fallback
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || key
export const supabaseAdmin = url && serviceKey
  ? createClient(url, serviceKey, { auth: { persistSession: false } })
  : null as any

// ── Tipos das tabelas ──────────────────────────────────────────────────────────
export interface StrategyRecord {
  id: string
  user_id: string
  client_name: string
  niche: string
  created_at: string
  strategy_snapshot: Record<string, any>
}

export interface MetricRecord {
  id: string
  user_id: string
  client_name: string
  channel: string
  period_month: string
  spend_real: number
  leads_real: number
  sales_real: number
  revenue_real: number
  notes: string
  niche: string
}

// ── Funções de banco ───────────────────────────────────────────────────────────

/** Busca histórico de estratégias do usuário */
export async function loadStrategyHistory(userId: string, clientName?: string) {
  let q = supabase
    .from('strategy_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (clientName) q = q.eq('client_name', clientName)
  const { data } = await q
  return data || []
}

/** Salva uma nova estratégia */
export async function saveStrategy(
  userId: string,
  clientName: string,
  niche: string,
  snapshot: Record<string, any>
) {
  const { data, error } = await supabase
    .from('strategy_history')
    .insert({
      user_id: userId,
      client_name: clientName,
      niche,
      strategy_snapshot: snapshot,
    })
    .select()
    .single()
  return { data, error }
}

/** Busca métricas do usuário */
export async function loadMetrics(userId: string, clientName?: string) {
  let q = supabase
    .from('campaign_metrics')
    .select('*')
    .eq('user_id', userId)
    .order('period_month', { ascending: false })
    .limit(60)

  if (clientName) q = q.eq('client_name', clientName)
  const { data } = await q
  return (data || []) as MetricRecord[]
}

/** Salva uma métrica */
export async function saveMetric(userId: string, metric: Omit<MetricRecord, 'id'>) {
  const { data, error } = await supabase
    .from('campaign_metrics')
    .insert({ ...metric, user_id: userId })
    .select()
    .single()
  return { data, error }
}
