// lib/persistence.ts — Camada de persistência server-side para auditoria, ações e score
// Usado exclusivamente em Route Handlers (server-side) com supabaseAdmin
// O frontend usa a store como cache rápido; este módulo é a fonte de verdade

import { supabaseAdmin } from '@/lib/supabase'

// ── Normalização de clientId ──────────────────────────────────────────────────
export function normalizeClientId(clientName: string): string {
  return clientName.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

// ── Tipos internos ────────────────────────────────────────────────────────────
export interface SavedAuditReport {
  id: string
  user_id: string
  client_id: string
  client_name: string
  score: number | null
  grade: string | null
  source: string
  created_at: string
}

export interface ActionRow {
  id: string
  user_id: string
  client_id: string
  title: string
  description: string | null
  platform: string
  source: string
  priority: number
  urgency: string
  status: string
  metric: string | null
  evidence: string | null
  impact: string | null
  origin: string | null
  related_campaign: string | null
  related_adset: string | null
  related_ad: string | null
  audit_report_id: string | null
  created_at: string
  updated_at: string
}

export interface HealthScoreRow {
  id: string
  user_id: string
  client_id: string
  score: number
  grade: string
  source: string
  audit_report_id: string | null
  calculated_at: string
  updated_at: string
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT REPORTS
// ─────────────────────────────────────────────────────────────────────────────

export async function saveAuditReport(
  userId: string,
  clientName: string,
  audit: any,
  realMetrics: any,
  dataSources: string[],
  source: 'ai' | 'benchmark',
): Promise<string | null> {
  if (!supabaseAdmin) return null
  try {
    const clientId = normalizeClientId(clientName)
    const { data, error } = await supabaseAdmin
      .from('audit_reports')
      .insert({
        user_id:          userId,
        client_id:        clientId,
        client_name:      clientName,
        data_sources:     dataSources,
        score:            audit.health_score ?? audit.overallScore ?? null,
        grade:            audit.grade ?? null,
        summary:          audit.executive_summary ?? audit.resumo_executivo ?? null,
        gargalos:         audit.gargalos ?? [],
        oportunidades:    audit.oportunidades ?? [],
        plano_acao:       audit.plano_acao ?? null,
        metrics_snapshot: realMetrics ?? null,
        raw_response:     audit,
        source,
      })
      .select('id')
      .single()
    if (error) { console.error('[persistence] saveAuditReport error:', error.message); return null }
    return data?.id ?? null
  } catch (e: any) {
    console.error('[persistence] saveAuditReport exception:', e.message)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIORITY ACTIONS — deduplicação inteligente
// ─────────────────────────────────────────────────────────────────────────────

interface RawAction {
  clientId: string        // Clerk userId
  title: string
  description?: string
  platform: string
  source?: string
  priority?: number
  urgency: string
  metric?: string
  evidence?: string
  impact?: string
  origin?: string
  relatedCampaign?: string
  relatedAdSet?: string
  relatedAd?: string
  auditReportId?: string | null
}

/**
 * Deduplicação inteligente com 7 regras:
 *
 * 1. Mesma chave (title+platform+source) + status pendente → atualiza evidência/urgência
 * 2. Mesma chave + status em_andamento → não sobrescreve, mantém andamento
 * 3. Mesma chave + status concluida → não reabrir automaticamente
 * 4. Mesma chave + status ignorada + nova urgência crítica → reabrir como pendente
 * 5. Mesma chave + status ignorada + urgência não-crítica → manter ignorada
 * 6. Mesmo problema mas campanha diferente → criar ação separada
 * 7. Não existe → inserir nova
 */
export async function upsertPriorityActions(
  userId: string,
  clientName: string,
  actions: RawAction[],
): Promise<ActionRow[]> {
  if (!supabaseAdmin || actions.length === 0) return []
  const clientId = normalizeClientId(clientName)
  const saved: ActionRow[] = []

  for (const action of actions) {
    try {
      // Busca ação existente pela chave de dedup
      const titleNorm = action.title.trim().toLowerCase()
      const { data: existing } = await supabaseAdmin
        .from('priority_actions')
        .select('id, status, urgency, updated_at')
        .eq('user_id', userId)
        .eq('client_id', clientId)
        .ilike('title', titleNorm)
        .eq('platform', action.platform)
        .eq('source', action.source ?? 'auditoria')
        // Se há campanha relacionada, a dedup é mais específica
        .eq('related_campaign', action.relatedCampaign ?? '')
        .maybeSingle()

      if (existing) {
        const s = existing.status as string

        if (s === 'pendente') {
          // Regra 1: atualiza evidência e urgência (pode ter escalado)
          const { data: upd } = await supabaseAdmin
            .from('priority_actions')
            .update({
              description:      action.description ?? null,
              urgency:          action.urgency,
              priority:         action.priority ?? 1,
              metric:           action.metric ?? null,
              evidence:         action.evidence ?? null,
              impact:           action.impact ?? null,
              origin:           action.origin ?? null,
              audit_report_id:  action.auditReportId ?? null,
              updated_at:       new Date().toISOString(),
            })
            .eq('id', existing.id)
            .select()
            .single()
          if (upd) saved.push(upd as ActionRow)

        } else if (s === 'em_andamento') {
          // Regra 2: não sobrescreve — só retorna o existente para hidratar store
          const { data: kept } = await supabaseAdmin
            .from('priority_actions')
            .select()
            .eq('id', existing.id)
            .single()
          if (kept) saved.push(kept as ActionRow)

        } else if (s === 'concluida') {
          // Regra 3: não reabrir automaticamente — retorna como concluída
          const { data: kept } = await supabaseAdmin
            .from('priority_actions')
            .select()
            .eq('id', existing.id)
            .single()
          if (kept) saved.push(kept as ActionRow)

        } else if (s === 'ignorada') {
          if (action.urgency === 'critica') {
            // Regra 4: urgência crítica reabre mesmo que ignorada
            const { data: upd } = await supabaseAdmin
              .from('priority_actions')
              .update({
                status:           'pendente',
                urgency:          'critica',
                evidence:         action.evidence ?? null,
                impact:           action.impact ?? null,
                audit_report_id:  action.auditReportId ?? null,
                updated_at:       new Date().toISOString(),
              })
              .eq('id', existing.id)
              .select()
              .single()
            if (upd) saved.push(upd as ActionRow)
          } else {
            // Regra 5: mantém ignorada
            const { data: kept } = await supabaseAdmin
              .from('priority_actions')
              .select()
              .eq('id', existing.id)
              .single()
            if (kept) saved.push(kept as ActionRow)
          }
        }
      } else {
        // Regra 7: não existe → inserir nova
        const { data: inserted } = await supabaseAdmin
          .from('priority_actions')
          .insert({
            user_id:          userId,
            client_id:        clientId,
            title:            action.title,
            description:      action.description ?? null,
            platform:         action.platform,
            source:           action.source ?? 'auditoria',
            priority:         action.priority ?? 1,
            urgency:          action.urgency,
            status:           'pendente',
            metric:           action.metric ?? null,
            evidence:         action.evidence ?? null,
            impact:           action.impact ?? null,
            origin:           action.origin ?? null,
            related_campaign: action.relatedCampaign ?? null,
            related_adset:    action.relatedAdSet ?? null,
            related_ad:       action.relatedAd ?? null,
            audit_report_id:  action.auditReportId ?? null,
          })
          .select()
          .single()
        if (inserted) saved.push(inserted as ActionRow)
      }
    } catch (e: any) {
      console.error('[persistence] upsertAction error:', e.message, action.title)
    }
  }

  return saved
}

// ─────────────────────────────────────────────────────────────────────────────
// LOAD ACTIONS (para hidratar o store no frontend)
// ─────────────────────────────────────────────────────────────────────────────

export async function loadPriorityActions(
  userId: string,
  clientName: string,
): Promise<ActionRow[]> {
  if (!supabaseAdmin) return []
  try {
    const clientId = normalizeClientId(clientName)
    const { data, error } = await supabaseAdmin
      .from('priority_actions')
      .select('*')
      .eq('user_id', userId)
      .eq('client_id', clientId)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) { console.error('[persistence] loadPriorityActions:', error.message); return [] }
    return (data || []) as ActionRow[]
  } catch (e: any) {
    console.error('[persistence] loadPriorityActions exception:', e.message)
    return []
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE ACTION STATUS
// ─────────────────────────────────────────────────────────────────────────────

export async function updateActionStatusInDB(
  userId: string,
  actionId: string,
  status: string,
): Promise<ActionRow | null> {
  if (!supabaseAdmin) return null
  try {
    const { data, error } = await supabaseAdmin
      .from('priority_actions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', actionId)
      .eq('user_id', userId)  // garante que só atualiza próprio dado
      .select()
      .single()
    if (error) { console.error('[persistence] updateActionStatus:', error.message); return null }
    return data as ActionRow
  } catch (e: any) {
    console.error('[persistence] updateActionStatus exception:', e.message)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT HEALTH SCORES
// ─────────────────────────────────────────────────────────────────────────────

export async function upsertHealthScore(
  userId: string,
  clientName: string,
  score: number,
  grade: string,
  source: 'ai' | 'benchmark',
  auditReportId?: string | null | null,
): Promise<HealthScoreRow | null> {
  if (!supabaseAdmin) return null
  try {
    const clientId = normalizeClientId(clientName)
    const { data, error } = await supabaseAdmin
      .from('client_health_scores')
      .upsert(
        {
          user_id:        userId,
          client_id:      clientId,
          score,
          grade,
          source,
          audit_report_id: auditReportId ?? null,
          calculated_at:  new Date().toISOString(),
          updated_at:     new Date().toISOString(),
        },
        { onConflict: 'user_id,client_id' }
      )
      .select()
      .single()
    if (error) { console.error('[persistence] upsertHealthScore:', error.message); return null }
    return data as HealthScoreRow
  } catch (e: any) {
    console.error('[persistence] upsertHealthScore exception:', e.message)
    return null
  }
}

export async function loadHealthScore(
  userId: string,
  clientName: string,
): Promise<HealthScoreRow | null> {
  if (!supabaseAdmin) return null
  try {
    const clientId = normalizeClientId(clientName)
    const { data, error } = await supabaseAdmin
      .from('client_health_scores')
      .select('*')
      .eq('user_id', userId)
      .eq('client_id', clientId)
      .single()
    if (error) return null
    return data as HealthScoreRow
  } catch {
    return null
  }
}
