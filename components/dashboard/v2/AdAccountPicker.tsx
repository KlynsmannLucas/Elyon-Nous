// components/dashboard/v2/AdAccountPicker.tsx
// Seletor da conta de anúncio (Meta/Google) usado na Análise Profunda e em Integrações.
// Lê/grava a seleção no store (selectedMeta/GoogleAccountByClient) — o audit consome isso.
'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Icon } from './Icon'

interface AdAccount { id: string; name: string; currency?: string; accountStatus?: string }
const ENDPOINT: Record<'meta' | 'google', string> = {
  meta: '/api/meta/ad-accounts',
  google: '/api/ads-data/google-accounts',
}

export function AdAccountPicker({ platform, clientKey, compact }: { platform: 'meta' | 'google'; clientKey: string; compact?: boolean }) {
  const selMeta = useAppStore(s => s.selectedMetaAccountByClient)
  const selGoogle = useAppStore(s => s.selectedGoogleAccountByClient)
  const setMeta = useAppStore(s => s.setSelectedMetaAccountId)
  const setGoogle = useAppStore(s => s.setSelectedGoogleAccountId)
  const connectedAccounts = useAppStore(s => s.connectedAccounts)

  const [accts, setAccts] = useState<AdAccount[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const connected = connectedAccounts.some(a => a.platform === platform)
  const selected = platform === 'meta' ? selMeta[clientKey] : selGoogle[clientKey]
  const setSelected = (id: string) => (platform === 'meta' ? setMeta(clientKey, id) : setGoogle(clientKey, id))

  useEffect(() => {
    if (!connected) return
    let active = true
    setLoading(true); setErr('')
    fetch(ENDPOINT[platform], { signal: AbortSignal.timeout(20000) }).then(r => r.json()).then(d => {
      if (!active) return
      if (d.success && Array.isArray(d.accounts) && d.accounts.length > 0) {
        setAccts(d.accounts)
        if (clientKey && !selected && d.accounts[0]) setSelected(d.accounts[0].id)
      } else if (d.success) {
        setErr('Nenhuma conta de anúncio encontrada nesta conexão.')
      } else setErr(d.error || 'Não foi possível listar as contas.')
    }).catch((e) => active && setErr(e?.name === 'TimeoutError' ? 'A listagem demorou demais. Tente recarregar.' : 'Falha ao listar contas.')).finally(() => active && setLoading(false))
    return () => { active = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, platform, clientKey])

  if (!connected) return null

  const label = platform === 'meta' ? 'Meta Ads' : 'Google Ads'

  return (
    <div>
      {!compact && <div className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3 mb-1.5">Conta de anúncio · {label}</div>}
      {loading ? (
        <div className="text-sm text-ink-3 px-3 py-2 bg-canvas-2 rounded-sm">Carregando contas…</div>
      ) : accts && accts.length > 0 ? (
        <div className="relative">
          <select value={selected || ''} onChange={(e) => { setSelected(e.target.value); if (typeof window !== 'undefined') window.toast?.({ tone: 'good', title: 'Conta selecionada', body: accts.find(a => a.id === e.target.value)?.name || e.target.value }) }}
            className="w-full appearance-none bg-paper border border-line rounded-sm pl-3 pr-9 py-2.5 text-sm text-ink focus:border-blue focus:outline-none cursor-pointer">
            {accts.map(a => (
              <option key={a.id} value={a.id}>{a.name}{a.accountStatus && a.accountStatus !== 'ACTIVE' ? ` (${a.accountStatus})` : ''} — {a.id}</option>
            ))}
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none"><Icon name="chevD" size={14} /></span>
        </div>
      ) : err ? (
        <div className="text-sm text-amber px-3 py-2 bg-amber-soft rounded-sm">{err}</div>
      ) : (
        <div className="text-sm text-ink-3 px-3 py-2 bg-canvas-2 rounded-sm">Nenhuma conta de anúncio nesta conexão.</div>
      )}
    </div>
  )
}
