// lib/useDailySeries.ts — hook compartilhado que lê a série diária real (daily_metrics)
// via /api/metrics/daily e devolve pronta para o LineChart (ordem crescente).
'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'

export interface DailySeries {
  labels: string[]        // "6 jun", "7 jun"…
  spend: number[]         // investimento diário (real)
  leads: number[]         // leads diários (real)
  revenue: number[] | null // receita estimada = spend × avgROAS (derivada) — null se sem ROAS
  hasRevenue: boolean
}

const fmtDay = (iso: string) => {
  try {
    const d = new Date(iso + (iso.length <= 10 ? 'T00:00:00' : ''))
    return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' }).format(d).replace('.', '')
  } catch { return iso }
}

/** Lê a série diária real do cliente ativo. Retorna null enquanto carrega ou sem dados. */
export function useDailySeries(avgROAS?: number | null): DailySeries | null {
  const clientData = useAppStore(s => s.clientData)
  const savedClients = useAppStore(s => s.savedClients)
  const connectedAccounts = useAppStore(s => s.connectedAccounts)
  const selectedMetaAccountByClient = useAppStore(s => s.selectedMetaAccountByClient)
  const [series, setSeries] = useState<DailySeries | null>(null)

  const key = clientData?.clientName || savedClients?.[0]?.clientData?.clientName || ''
  const metaAccount = connectedAccounts.find(a => a.platform === 'meta')
  const accountId = selectedMetaAccountByClient[key] || metaAccount?.accountId

  useEffect(() => {
    if (!key || !metaAccount) { setSeries(null); return }
    let active = true
    fetch(`/api/metrics/daily${accountId ? `?accountId=${encodeURIComponent(accountId)}` : ''}`)
      .then(r => (r.ok ? r.json() : { days: [] }))
      .then(d => {
        if (!active) return
        const days = Array.isArray(d?.days) ? [...d.days].reverse() : [] // crescente
        if (days.length < 2) { setSeries(null); return }
        const spend = days.map((x: any) => Number(x.spend || 0))
        const leads = days.map((x: any) => Number(x.leads || 0))
        const roas = avgROAS && avgROAS > 0 ? Number(avgROAS) : null
        const revenue = roas ? spend.map(s => Math.round(s * roas)) : null
        setSeries({
          labels: days.map((x: any) => fmtDay(String(x.date))),
          spend, leads, revenue, hasRevenue: !!revenue,
        })
      })
      .catch(() => { if (active) setSeries(null) })
    return () => { active = false }
  }, [key, accountId, metaAccount, avgROAS])

  return series
}
