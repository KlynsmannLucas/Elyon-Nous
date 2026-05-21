// hooks/useClientActions.ts — Hidrata store com dados do Supabase ao mudar cliente
// Exporta syncActionStatus (store-first, PATCH só com dbId válido)
// Exporta retrySyncActions (retry para ações sem dbId ou com PATCH falho)
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
 * Após hidratação, faz retry automático de ações com syncState 'pending_sync' (sem dbId).
 */
export function useClientActions({ clientName, enabled = true }: Options): UseClientActionsReturn {
  const addPendingActions          = useAppStore(s => s.addPendingActions)
  const setClientHealthScore       = useAppStore(s => s.setClientHealthScore)
  const updatePendingActionSyncState = useAppStore(s => s.updatePendingActionSyncState)

  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)

  const lastFetchedClient = useRef<string | null>(null)
  const prevEnabled       = useRef<boolean>(enabled)

  // Reseta o guard quando enabled vai de false → true (auditoria termina)
  useEffect(() => {
    if (enabled && !prevEnabled.current) {
      lastFetchedClient.current = null
    }
    prevEnabled.current = enabled
  }, [enabled])

  useEffect(() => {
    if (!clientName || !enabled) return
    if (lastFetchedClient.current === clientName) return

    let cancelled = false
    setLoading(true)
    setError(null)

    async function fetchAndHydrate() {
      try {
        const res = await fetch(
          `/api/actions?clientName=${encodeURIComponent(clientName!)}`,
          { cache: 'no-store' },
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

        // Converte ActionRow → PendingAction. dbId = row.id ⟹ syncState: 'synced'
        const storeActions: PendingAction[] = json.actions.map((row) => ({
          id:              row.id,
          dbId:            row.id,
          syncState:       'synced' as const,
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

        // Retry automático de ações pending_sync (sem dbId) após hidratação do banco
        const allCurrent = useAppStore.getState().pendingActionsCache[clientName!] || []
        const toRetry = allCurrent.filter(
          (a) => a.syncState === 'pending_sync' && !a.dbId,
        )
        if (toRetry.length > 0) {
          console.info(
            `[useClientActions] Retrying ${toRetry.length} ação(ões) pending_sync para "${clientName}"`,
          )
          retrySyncActions(clientName!, toRetry, updatePendingActionSyncState).catch((e) => {
            console.warn('[useClientActions] retrySyncActions falhou:', e.message)
          })
        }
      } catch (e: any) {
        if (!cancelled) {
          console.warn('[useClientActions] fetch falhou (não-fatal):', e.message)
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

// ── syncActionStatus ─────────────────────────────────────────────────────────
// Regras:
//   1. Atualiza store imediatamente (UX responsiva)
//   2. Se não há dbId → marca pending_sync e retorna sem PATCH (nunca chama
//      /api/actions/undefined ou /api/actions/<id_local>)
//   3. Se há dbId → faz PATCH e atualiza syncState conforme resultado
export async function syncActionStatus(
  dbId: string | undefined,
  storeId: string,
  clientName: string,
  newStatus: PendingAction['status'],
  updateStoreCallback: (clientName: string, id: string, status: PendingAction['status']) => void,
  updateSyncStateCallback?: (
    clientName: string,
    id: string,
    syncState: NonNullable<PendingAction['syncState']>,
    dbId?: string,
  ) => void,
): Promise<void> {
  // Atualiza store imediatamente
  updateStoreCallback(clientName, storeId, newStatus)

  if (!dbId) {
    console.warn(
      '[syncActionStatus] Ação sem dbId — status salvo localmente, aguardando sync.',
      { storeId, clientName, newStatus },
    )
    updateSyncStateCallback?.(clientName, storeId, 'pending_sync')
    return
  }

  try {
    const res = await fetch(`/api/actions/${dbId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      console.warn('[syncActionStatus] PATCH falhou:', j.error, { dbId, storeId, newStatus })
      updateSyncStateCallback?.(clientName, storeId, 'sync_failed')
    } else {
      updateSyncStateCallback?.(clientName, storeId, 'synced')
    }
  } catch (e: any) {
    console.warn('[syncActionStatus] Erro de rede (não-fatal):', e.message, { dbId, storeId })
    updateSyncStateCallback?.(clientName, storeId, 'sync_failed')
  }
}

// ── retrySyncActions ─────────────────────────────────────────────────────────
// Aceita ações pending_sync (sem dbId) e sync_failed (com dbId).
//   - Sem dbId → POST /api/actions para criar no banco, depois PATCH status se necessário
//   - Com dbId → PATCH status diretamente (Supabase já tem o registro)
export async function retrySyncActions(
  clientName: string,
  actions: PendingAction[],
  updateSyncState: (
    clientName: string,
    id: string,
    syncState: NonNullable<PendingAction['syncState']>,
    dbId?: string,
  ) => void,
): Promise<{ succeeded: number; failed: number }> {
  let succeeded = 0
  let failed = 0

  for (const action of actions) {
    try {
      if (!action.dbId) {
        // ── Caso 1: ação nunca chegou ao banco — criar via POST ────────────
        const res = await fetch('/api/actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientName, action }),
        })
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          console.warn('[retrySyncActions] POST falhou:', j.error ?? `HTTP ${res.status}`, {
            title: action.title,
          })
          updateSyncState(clientName, action.id, 'sync_failed')
          failed++
          continue
        }
        const { dbId } = await res.json() as { dbId: string }
        console.info('[retrySyncActions] POST ok — ação sincronizada:', {
          dbId,
          title: action.title,
        })
        updateSyncState(clientName, action.id, 'synced', dbId)

        // Sinc o status se já foi alterado localmente
        if (action.status !== 'pendente') {
          await fetch(`/api/actions/${dbId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: action.status }),
          }).catch((e) =>
            console.warn('[retrySyncActions] PATCH de status após POST falhou:', e.message, {
              dbId,
              title: action.title,
            }),
          )
        }
        succeeded++
      } else {
        // ── Caso 2: ação existe no banco, mas o PATCH de status falhou ────
        const res = await fetch(`/api/actions/${action.dbId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: action.status }),
        })
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          console.warn('[retrySyncActions] PATCH retry falhou:', j.error ?? `HTTP ${res.status}`, {
            dbId: action.dbId,
            title: action.title,
          })
          failed++
          continue
        }
        console.info('[retrySyncActions] PATCH retry ok:', {
          dbId: action.dbId,
          status: action.status,
          title: action.title,
        })
        updateSyncState(clientName, action.id, 'synced')
        succeeded++
      }
    } catch (e: any) {
      console.warn('[retrySyncActions] Erro de rede:', e.message, { title: action.title })
      updateSyncState(clientName, action.id, 'sync_failed')
      failed++
    }
  }

  if (succeeded > 0) {
    console.info(`[retrySyncActions] Resultado: ${succeeded} sincronizadas, ${failed} falharam para "${clientName}"`)
  }
  return { succeeded, failed }
}
