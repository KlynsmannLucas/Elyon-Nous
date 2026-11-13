'use client'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { resolveReportingPeriod } from '@/lib/reporting-period'
import type { PerformanceSource } from './model'
export async function performanceFetch(url: string, init?: RequestInit) {
  const r = await fetch(url, { cache: 'no-store', ...init })
  const d = await r.json().catch(() => null)
  if (!r.ok || d?.success === false || !d)
    throw new Error(d?.error || 'Não foi possível consultar esta fonte.')
  return d
}
export function usePerformance(
  refresh: number,
  customRange: { startDate: string; endDate: string } | null = null,
) {
  const active = useAppStore((s) => s.clientData),
    saved = useAppStore((s) => s.savedClients),
    preset = useAppStore((s) => s.globalPeriod.preset)
  const name = active?.clientName || saved[0]?.clientData?.clientName || ''
  const selectedMeta = useAppStore(
      (s) => s.selectedMetaAccountByClient[name] || '',
    ),
    selectedGoogle = useAppStore(
      (s) => s.selectedGoogleAccountByClient[name] || '',
    )
  const period = resolveReportingPeriod(customRange || { datePreset: preset }),
    scope = `${name}:${selectedMeta}:${selectedGoogle}:${period.startDate}:${period.endDate}:${refresh}`
  const empty = {
    scope,
    client: null as any,
    sources: [] as PerformanceSource[],
    report: null as any,
    reportLoading: true,
    reportError: '',
    loading: true,
    error: '',
  }
  const [state, setState] = useState(empty)
  useEffect(() => {
    const controller = new AbortController(),
      signal = controller.signal
    const update = (fn: (state: typeof empty) => typeof empty) => {
      if (!signal.aborted)
        setState((previous) => fn(previous.scope === scope ? previous : empty))
    }
    setState(empty)
    ;(async () => {
      try {
        const data = await performanceFetch('/api/clients', { signal }),
          matches = data.clients.filter(
            (row: any) => row.clientData?.clientName === name,
          )
        if (matches.length !== 1) {
          update((s) => ({
            ...s,
            loading: false,
            reportLoading: false,
            error: matches.length
              ? 'Há clientes com o mesmo nome. Identifique o cliente correto antes de consultar.'
              : 'Selecione e salve um cliente para consultar seu desempenho.',
          }))
          return
        }
        const client = matches[0],
          ids = {
            meta: String(client.extraData?.selectedMetaAccountId || '').replace(
              /^act_/,
              '',
            ),
            google: String(
              client.extraData?.selectedGoogleAccountId || '',
            ).replace(/-/g, ''),
          }
        const platforms = (['meta', 'google'] as const).filter((p) => ids[p])
        update((s) => ({
          ...s,
          client,
          sources: platforms.map(
            (platform) =>
              ({
                platform,
                accountId: ids[platform],
                success: false,
                campaigns: [],
                loading: true,
              }) as any,
          ),
        }))
        const nativeReads = platforms.map(async (platform) => {
          let source: PerformanceSource
          try {
            source = {
              ...(await performanceFetch(`/api/ads-data/${platform}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountId: ids[platform], ...period }),
                signal,
              })),
              platform,
              accountId: ids[platform],
            }
          } catch (error) {
            source = {
              platform,
              accountId: ids[platform],
              success: false,
              campaigns: [],
              error:
                error instanceof Error ? error.message : 'Fonte indisponível.',
            }
          }
          update((s) => ({
            ...s,
            sources: s.sources.map((row) =>
              row.platform === platform ? source : row,
            ),
          }))
        })
        const reportRead = (async () => {
          try {
            const report = await performanceFetch(
              '/api/reportei/data?' +
                new URLSearchParams({
                  clientId: client.id,
                  ...period,
                  startDate: period.startDate,
                  endDate: period.endDate,
                  ...(refresh ? { refresh: '1' } : {}),
                } as any),
              { signal },
            )
            update((s) => ({ ...s, report, reportLoading: false }))
          } catch (error) {
            update((s) => ({
              ...s,
              reportLoading: false,
              reportError:
                error instanceof Error
                  ? error.message
                  : 'Fonte complementar indisponível.',
            }))
          }
        })()
        await Promise.allSettled([...nativeReads, reportRead])
        update((s) => ({ ...s, loading: false }))
      } catch (error) {
        update((s) => ({
          ...s,
          loading: false,
          reportLoading: false,
          error:
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar o cliente.',
        }))
      }
    })()
    return () => controller.abort()
  }, [scope])
  return { ...(state.scope === scope ? state : empty), period, scope, name }
}
export function useTrafficStudy(
  clientId: string | undefined,
  period: { startDate: string; endDate: string },
  view: 'daily' | 'audience' | 'creative',
  active: boolean,
  scope: string,
) {
  const key = `${scope}:${clientId}:${view}`,
    [state, setState] = useState<{
      key: string
      data: any
      loading: boolean
      error: string
    }>({
      key: '',
      data: null,
      loading: false,
      error: '',
    })
  useEffect(() => {
    if (!clientId || !active) return
    const controller = new AbortController(),
      signal = controller.signal
    setState({ key, data: null, loading: true, error: '' })
    performanceFetch(
      '/api/performance/study?' +
        new URLSearchParams({ clientId, view, ...period }),
      {
        signal,
      },
    )
      .then((data) => {
        if (!signal.aborted) setState({ key, data, loading: false, error: '' })
      })
      .catch((error) => {
        if (!signal.aborted)
          setState({ key, data: null, loading: false, error: error.message })
      })
    return () => controller.abort()
  }, [key, active])
  return state.key === key
    ? state
    : { key, data: null, loading: active && !!clientId, error: '' }
}
