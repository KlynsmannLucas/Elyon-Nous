// lib/useDailySeries.ts — hook compartilhado que lê a série diária real (daily_metrics)
// via /api/metrics/daily e devolve pronta para o LineChart (ordem crescente).
'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'

export interface DailySeries {
  labels: string[]        // "6 jun", "7 jun"…
  spend: number[]         // investimento diário (real)
  leads: number[]         // leads diários (real)
  revenue: number[] | null // null until the daily source provides actual revenue
  hasRevenue: boolean
}

const fmtDay = (iso: string) => {
  try {
    const d = new Date(iso + (iso.length <= 10 ? 'T00:00:00' : ''))
    return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' }).format(d).replace('.', '')
  } catch { return iso }
}

/** Lê a série diária real do cliente ativo. Retorna null enquanto carrega ou sem dados. */
export function useDailySeries(_avgROAS?: number | null): DailySeries | null {
  const clientData = useAppStore(s => s.clientData)
  const savedClients = useAppStore(s => s.savedClients)
  const selectedMetaAccountByClient = useAppStore(s => s.selectedMetaAccountByClient)
  const datePreset = useAppStore(s => s.globalPeriod.preset)
  const [series, setSeries] = useState<DailySeries | null>(null)

  const key = clientData?.clientName || savedClients?.[0]?.clientData?.clientName || ''
  // Isolamento por cliente: SÓ a conta que ESTE cliente selecionou (sem fallback pra
  // conta padrão do usuário, que é de outro cliente).
  const accountId = (key && selectedMetaAccountByClient[key]) || ''

  useEffect(() => {
    setSeries(null)
    if (!key || !accountId) { setSeries(null); return }
    let active = true
    fetch(`/api/metrics/daily?accountId=${encodeURIComponent(accountId)}&datePreset=${encodeURIComponent(datePreset)}`)
      .then(r => (r.ok ? r.json() : { days: [] }))
      .then(d => {
        if (!active) return
        const days = Array.isArray(d?.days) ? [...d.days].reverse() : [] // crescente
        if (days.length < 2) { setSeries(null); return }
        const spend = days.map((x: any) => Number(x.spend || 0))
        const leads = days.map((x: any) => Number(x.leads || 0))
        setSeries({
          labels: days.map((x: any) => fmtDay(String(x.date))),
          spend, leads, revenue: null, hasRevenue: false,
        })
      })
      .catch(() => { if (active) setSeries(null) })
    return () => { active = false }
  }, [key, accountId, datePreset])

  return series
}
