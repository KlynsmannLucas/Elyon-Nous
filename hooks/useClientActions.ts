// hooks/useClientActions.ts — Hidrata store com dados do Supabase ao mudar cliente
// Chamado no DashboardBody/TabAuditoria quando clientData muda.
// Garante que ações e score sobrevivem a logout, refresh e troca de device.
'use client'

import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/lib/store'
import type { PendingAction } from '@/lib/store'

interface Options {
  clientName: string | null | undefined
  enabled?: boolean  // false para desabilitar temporariamente (ex: durante auditoria)
}

interface UseClientActionsReturn {
  loading: boolean
  error: string | null
  lastSyncAt: string | null
}

/**
 * Busca ações e score do Supabase e hidrata o store.
 *
 * Estratégia de merge:
 * - Ações vindas do DB sobrescrevem apenas actions com mesmo DB id ainda como pendente no store
 * - Ações ativas (em_andamento/concluida/ignorada) no store NÃO são sobrescritas pelo DB
 *   (store pode estar mais atualizado que o DB se o sync ainda não terminou)
 * - Score do DB sempre sobrescreve o store (mais confiável)
 */
export function useClientActions({ clientName, enabled = true }: Options): UseClientActionsReturn {
  const addPendingActions  = useAppStore(s => s.addPendingActions)
  const setClientHealthScore = useAppStore(s => s.setClientHealthScore)
  const pendingActionsCache  = useAppStore(s => s.pendingActionsCache)

  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)

  // Evita re-fetch desnecessário quando clientName não muda
  const lastFetchedClient = useRef<string | null>(null)

  useEffect(() => {
    if (!clientName || !enabled) return
    if (lastFetchedClient.current === clientName) return  // já hidratado

    let cancelled = false
    setLoading(true)
    setError(null)

    async function fetchAndHydrate() {
      try {
        const res = await fetch(
          `/api/actions?clientName=${encodeURIComponent(clientName!)}`,
          { cache: 'no-store' }
        )
        if (cancelled) return

        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          throw new Error(j.error || `HTTP ${res.status}`)
        }

        const json: {
          success: boolean
          actions: any[]
          healthScore: { score: number; grade: string; source: string; updatedAt: string } | null
        } = await res.json()

        if (cancelled || !json.success) return

        // Converte ActionRow do banco → PendingAction do store
        const storeActions: PendingAction[] = json.actions.map((row) => ({
          id:              row.id,
          clientId:        row.user_id,
          title:           row.title,
          description:     row.description ?? '',
          platform:        (row.platform ?? 'ambos') as PendingAction['platform'],
          urgency:         (row.urgency ?? 'media') as PendingAction['urgency'],
          priority:        row.priority ?? 1,
          impact:          row.impact ?? '',
          metric:          row.metric ?? undefined,
          evidence:        row.evidence ?? undefined,
          status:          (row.status ?? 'pendente') as PendingAction['status'],
          source:          (row.source ?? 'auditoria') as PendingAction['source'],
          origin:          row.origin ?? '',
          relatedCampaign: row.related_campaign ?? undefined,
          relatedAdSet:    row.related_adset ?? undefined,
          relatedAd:       row.related_ad ?? undefined,
          createdAt:       row.created_at,
          updatedAt:       row.updated_at,
        }))

        if (storeActions.length > 0) {
          // addPendingActions já faz dedup inteligente no store
          addPendingActions(clientName!, storeActions)
        }

        if (json.healthScore) {
          setClientHealthScore(
            clientName!,
            json.healthScore.score,
            json.healthScore.grade,
            json.healthScore.source as 'ai' | 'benchmark',
          )
        }

        lastFetchedClient.current = clientName!
        setLastSyncAt(new Date().toISOString())
      } catch (e: any) {
        if (!cancelled) {
          console.warn('[useClientActions] fetch failed (non-fatal):', e.message)
          setError(e.message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchAndHydrate()
    return () => { cancelled = true }
  }, [clientName, enabled])

  return { loading, error, lastSyncAt }
}

// ── Função helper para sync de status (chama API + atualiza store) ─────────
export async function syncActionStatus(
  dbId: string | undefined,
  storeId: string,
  clientName: string,
  newStatus: PendingAction['status'],
  updateStoreCallback: (clientName: string, id: string, status: PendingAction['status']) => void,
): Promise<void> {
  // Atualiza store imediatamente (UX responsiva)
  updateStoreCallback(clientName, storeId, newStatus)

  // Tenta sincronizar com Supabase usando o dbId (pode ser o mesmo que storeId se veio do DB)
  const idToSync = dbId || storeId
  if (!idToSync) return

  try {
    const res = await fetch(`/api/actions/${idToSync}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      console.warn('[syncActionStatus] DB sync failed:', j.error)
      // Não reverte store — localStorage ainda persiste localmente
    }
  } catch (e: any) {
    console.warn('[syncActionStatus] network error (non-fatal):', e.message)
  }
}
