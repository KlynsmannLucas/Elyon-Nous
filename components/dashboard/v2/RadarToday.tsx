// components/dashboard/v2/RadarToday.tsx
// RADAR DE HOJE — o motivo de abrir o Elyon todo dia. Vigia as contas e mostra
// "as coisas que precisam de você hoje": 🔴 vazamento, 🟡 risco, 🟢 oportunidade —
// cada uma com o valor em R$ e o botão de ação (com aprovação explícita).
'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Icon } from './Icon'
import { Card } from './Card'

interface RadarAlert {
  severity: 'leak' | 'risk' | 'opportunity'
  title: string
  detail: string
  money: number
  deltaPct?: number | null
  campaignId?: string
  campaignName?: string
  platform?: 'meta' | 'google'
  action?: 'pause' | 'scale'
}

const brl = (n: number) => 'R$ ' + new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Math.round(n || 0))

const SEV: Record<RadarAlert['severity'], { dot: string; bg: string; border: string; label: string }> = {
  leak:        { dot: '#E1483F', bg: 'rgba(225,72,63,.06)',  border: 'rgba(225,72,63,.22)',  label: 'Vazamento' },
  risk:        { dot: '#E08B0B', bg: 'rgba(224,139,11,.06)', border: 'rgba(224,139,11,.22)', label: 'Risco' },
  opportunity: { dot: '#0E9E6E', bg: 'rgba(14,158,110,.06)', border: 'rgba(14,158,110,.22)', label: 'Oportunidade' },
}

// Cache por sessão p/ não refazer a chamada a cada navegação.
const RADAR_CACHE = new Map<string, { alerts: RadarAlert[]; moneyAtRisk: number }>()

export function RadarToday() {
  const clientData = useAppStore(s => s.clientData)
  const savedClients = useAppStore(s => s.savedClients)
  const connectedAccounts = useAppStore(s => s.connectedAccounts)
  const selectedMetaAccountByClient = useAppStore(s => s.selectedMetaAccountByClient)
  const selectedGoogleAccountByClient = useAppStore(s => s.selectedGoogleAccountByClient)

  const key = clientData?.clientName || savedClients?.[0]?.clientData?.clientName || ''
  const hasMeta = connectedAccounts.some(a => a.platform === 'meta')
  const hasGoogle = connectedAccounts.some(a => a.platform === 'google')
  const metaAccountId = (key && selectedMetaAccountByClient[key]) || connectedAccounts.find(a => a.platform === 'meta')?.accountId || ''
  const googleAccountId = (key && selectedGoogleAccountByClient[key]) || connectedAccounts.find(a => a.platform === 'google')?.accountId || ''

  const [alerts, setAlerts] = useState<RadarAlert[] | null>(null)
  const [moneyAtRisk, setMoneyAtRisk] = useState(0)
  const [loading, setLoading] = useState(false)
  const [execId, setExecId] = useState<string | null>(null)

  useEffect(() => {
    if (!key || (!hasMeta && !hasGoogle)) { setAlerts(null); return }
    const cacheKey = `${key}|${metaAccountId}|${googleAccountId}`
    if (RADAR_CACHE.has(cacheKey)) { const c = RADAR_CACHE.get(cacheKey)!; setAlerts(c.alerts); setMoneyAtRisk(c.moneyAtRisk); return }
    let active = true
    setLoading(true)
    fetch('/api/radar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        niche: clientData?.niche, accountId: metaAccountId || undefined, googleAccountId: googleAccountId || undefined,
        ticket: (clientData as any)?.ticketPrice, margin: (clientData as any)?.grossMargin, convRate: (clientData as any)?.conversionRate,
      }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const list: RadarAlert[] = d?.success && Array.isArray(d.alerts) ? d.alerts : []
        RADAR_CACHE.set(cacheKey, { alerts: list, moneyAtRisk: d?.moneyAtRisk || 0 })
        if (active) { setAlerts(list); setMoneyAtRisk(d?.moneyAtRisk || 0) }
      })
      .catch(() => { if (active) setAlerts([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [key, metaAccountId, googleAccountId, hasMeta, hasGoogle, clientData?.niche])

  // Ação com APROVAÇÃO EXPLÍCITA: preview do plano → confirmar → executar.
  const exec = async (a: RadarAlert) => {
    if (!a.campaignId || !a.action) return
    const isGoogle = a.platform === 'google'
    const endpoint = isGoogle ? '/api/google/campaign/action' : '/api/meta/campaign/action'
    const payload = { action: a.action, id: a.campaignId, accountId: isGoogle ? undefined : (metaAccountId || undefined), clientName: key, campaignName: a.campaignName }
    setExecId(a.campaignId)
    try {
      const prev = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, dryRun: true }) })
      const pd = await prev.json()
      if (!pd?.success) { window.toast?.({ tone: 'bad', title: 'Não foi possível', body: pd?.error || 'Tente novamente.' }); return }
      if (typeof window !== 'undefined' && !window.confirm(`${pd.plan}\n\nConfirmar e executar no ${isGoogle ? 'Google Ads' : 'Meta Ads'}?`)) return
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const d = await res.json()
      window.toast?.(d?.success ? { tone: 'good', title: 'Ação executada', body: d.message } : { tone: 'bad', title: 'Não foi possível', body: d?.error || 'Tente novamente.' })
      if (d?.success) setAlerts(prev => (prev || []).filter(x => x !== a))
    } catch { window.toast?.({ tone: 'bad', title: 'Falha de conexão' }) }
    finally { setExecId(null) }
  }

  if (!key || (!hasMeta && !hasGoogle)) return null
  if (alerts === null && !loading) return null

  return (
    <section className="mb-4 animate-fade-up">
      <Card>
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center text-white shrink-0"><Icon name="pulse" size={17} /></span>
            <div>
              <div className="text-[15px] font-bold text-ink" style={{ letterSpacing: '-0.01em' }}>Radar de hoje</div>
              <div className="text-[12px] text-ink-3">O que precisa de você agora · últimos 7 dias</div>
            </div>
          </div>
          {moneyAtRisk > 0 && (
            <div className="text-right">
              <div className="text-[10px] font-mono uppercase tracking-wider text-ink-3">Em risco</div>
              <div className="text-lg font-bold font-mono text-red">{brl(moneyAtRisk)}</div>
            </div>
          )}
        </div>

        {loading && <div className="text-center py-6 text-ink-3 text-sm">Vigiando suas contas…</div>}

        {!loading && alerts && alerts.length === 0 && (
          <div className="flex items-center gap-3 py-4 px-1">
            <span className="w-9 h-9 rounded-full bg-green-soft flex items-center justify-center text-green-600 shrink-0"><Icon name="check" size={18} /></span>
            <div>
              <div className="text-sm font-semibold text-ink">Tudo sob controle hoje 🎯</div>
              <div className="text-[12.5px] text-ink-3">Nenhum vazamento, fadiga ou risco detectado nos últimos 7 dias. Continue assim.</div>
            </div>
          </div>
        )}

        {!loading && alerts && alerts.length > 0 && (
          <div className="space-y-2.5">
            {alerts.map((a, i) => {
              const s = SEV[a.severity]
              return (
                <div key={i} className="flex items-start gap-3 p-3 rounded-md" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                  <span className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ background: s.dot }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: s.dot }}>{s.label}</span>
                      {a.money > 0 && <span className="text-[11px] font-mono font-bold text-ink">{a.severity === 'opportunity' ? '+' : ''}{brl(a.money)}</span>}
                      {a.platform && <span className="text-[10px] font-mono uppercase tracking-wide text-ink-4">{a.platform === 'google' ? 'Google' : 'Meta'}</span>}
                    </div>
                    <div className="text-[13.5px] font-semibold text-ink mt-0.5">{a.title}</div>
                    <div className="text-[12px] text-ink-2 mt-0.5 leading-relaxed">{a.detail}</div>
                  </div>
                  {a.action && a.campaignId && (
                    <button onClick={() => exec(a)} disabled={execId === a.campaignId}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-[12px] font-semibold shrink-0 self-center disabled:opacity-60"
                      style={{ background: a.action === 'pause' ? '#E1483F' : '#0E9E6E' }}>
                      <Icon name={a.action === 'pause' ? 'alert' : 'arrowUp'} size={13} />
                      {execId === a.campaignId ? 'Aguarde…' : a.action === 'pause' ? 'Pausar' : 'Escalar'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </section>
  )
}
