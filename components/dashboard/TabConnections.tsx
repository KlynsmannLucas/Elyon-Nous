// components/dashboard/TabConnections.tsx — Conectar Meta Ads e Google Ads
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import type { AdsCampaign } from '@/lib/store'

interface Totals {
  spend: number; impressions: number; clicks: number
  leads: number; revenue: number; cpl: number; roas: number; ctr: number
}

function fmt(n: number) {
  if (n >= 1_000_000) return `R$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000)      return `R$${(n / 1000).toFixed(1)}k`
  return `R$${n.toFixed(0)}`
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000)      return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

type SortKey = 'name' | 'spend' | 'leads' | 'cpl' | 'ctr' | 'impressions' | 'roas'
type SortDir = 'asc' | 'desc'

function StatusDot({ status }: { status: string }) {
  const active = status === 'ACTIVE' || status === 'ENABLED'
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: active ? '#22C55E' : '#475569', boxShadow: active ? '0 0 5px #22C55E80' : 'none' }} />
      <span className="text-xs" style={{ color: active ? '#22C55E' : '#475569' }}>
        {active ? 'Ativo' : 'Pausado'}
      </span>
    </div>
  )
}

function SortHeader({ label, sortKey, current, dir, onSort }: {
  label: string; sortKey: SortKey; current: SortKey; dir: SortDir
  onSort: (k: SortKey) => void
}) {
  const active = current === sortKey
  return (
    <th
      className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide cursor-pointer select-none whitespace-nowrap"
      style={{ color: active ? '#F0B429' : '#475569' }}
      onClick={() => onSort(sortKey)}
    >
      {label}
      <span className="ml-1 opacity-60">{active ? (dir === 'desc' ? '↓' : '↑') : '↕'}</span>
    </th>
  )
}

function CampaignTable({ title, icon, color, campaigns, totals }: {
  title: string; icon: string; color: string
  campaigns: AdsCampaign[]; totals: Totals | null
}) {
  const [search,     setSearch]     = useState('')
  const [statusFilt, setStatusFilt] = useState<'all' | 'active' | 'paused'>('all')
  const [sortKey,    setSortKey]    = useState<SortKey>('spend')
  const [sortDir,    setSortDir]    = useState<SortDir>('desc')

  const handleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(k); setSortDir('desc') }
  }

  const filtered = useMemo(() => {
    let list = [...campaigns]
    if (statusFilt === 'active') list = list.filter(c => c.status === 'ACTIVE' || c.status === 'ENABLED')
    if (statusFilt === 'paused') list = list.filter(c => c.status !== 'ACTIVE' && c.status !== 'ENABLED')
    if (search.trim()) list = list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    list.sort((a, b) => {
      const av = sortKey === 'name' ? a.name : (a as any)[sortKey] ?? 0
      const bv = sortKey === 'name' ? b.name : (b as any)[sortKey] ?? 0
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      return sortDir === 'asc' ? av - bv : bv - av
    })
    return list
  }, [campaigns, statusFilt, search, sortKey, sortDir])

  const activeCount = campaigns.filter(c => c.status === 'ACTIVE' || c.status === 'ENABLED').length
  const pausedCount = campaigns.length - activeCount

  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-[#2A2A30]">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <h3 className="font-display font-bold text-white">{title}</h3>
            <span className="text-xs text-slate-600">· {campaigns.length} campanhas · últimos 30 dias</span>
          </div>
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Pesquisar campanha..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="text-xs bg-[#16161A] border border-[#2A2A30] rounded-lg px-3 py-1.5 pr-7 text-slate-300 placeholder:text-slate-600 outline-none focus:border-[#F0B429] w-52"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 text-xs">🔍</span>
          </div>
        </div>
        {/* Status filter tabs */}
        <div className="flex gap-1">
          {([
            { key: 'all',    label: `Todos (${campaigns.length})` },
            { key: 'active', label: `Ativos (${activeCount})` },
            { key: 'paused', label: `Pausados (${pausedCount})` },
          ] as { key: typeof statusFilt; label: string }[]).map(f => (
            <button key={f.key} onClick={() => setStatusFilt(f.key)}
              className="text-[11px] font-semibold px-3 py-1 rounded-full transition-all"
              style={{
                color:      statusFilt === f.key ? '#0D0D10' : '#475569',
                background: statusFilt === f.key ? color : 'rgba(71,85,105,0.1)',
                border:     `1px solid ${statusFilt === f.key ? color : 'rgba(71,85,105,0.2)'}`,
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI totals bar */}
      {totals && (
        <div className="grid grid-cols-4 md:grid-cols-7 border-b border-[#1E1E24]">
          {[
            { label: 'Investido',  value: fmt(totals.spend),                         color: '#F0B429' },
            { label: 'Impressões', value: fmtNum(totals.impressions),                 color: '#94A3B8' },
            { label: 'Cliques',    value: fmtNum(totals.clicks),                      color: '#94A3B8' },
            { label: 'CTR',        value: `${totals.ctr}%`,                           color: totals.ctr >= 1.5 ? '#22C55E' : totals.ctr >= 0.8 ? '#F0B429' : '#FF4D4D' },
            { label: 'Leads',      value: String(totals.leads),                       color: '#38BDF8' },
            { label: 'CPL Real',   value: `R$${totals.cpl}`,                          color: '#A78BFA' },
            { label: 'ROAS',       value: totals.roas > 0 ? `${totals.roas}×` : '—', color: totals.roas >= 3 ? '#22C55E' : totals.roas > 0 ? '#F0B429' : '#475569' },
          ].map((k) => (
            <div key={k.label} className="px-4 py-3 text-center border-r border-[#1E1E24] last:border-0">
              <div className="text-[9px] text-slate-600 uppercase tracking-wide mb-1">{k.label}</div>
              <div className="text-sm font-bold font-mono" style={{ color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1E1E24] bg-[#0D0D10]">
              <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-600 w-8">#</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-600 cursor-pointer select-none"
                onClick={() => handleSort('name')}>
                Campanha <span className="ml-1 opacity-60">{sortKey === 'name' ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}</span>
              </th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-600">Status</th>
              <SortHeader label="Investido"   sortKey="spend"       current={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHeader label="Leads"       sortKey="leads"       current={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHeader label="CPL"         sortKey="cpl"         current={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHeader label="CTR"         sortKey="ctr"         current={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHeader label="Impressões"  sortKey="impressions" current={sortKey} dir={sortDir} onSort={handleSort} />
              {campaigns.some(c => c.roas > 0) && (
                <SortHeader label="ROAS" sortKey="roas" current={sortKey} dir={sortDir} onSort={handleSort} />
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A1A20]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-8 text-center text-slate-600">
                  {search ? 'Nenhuma campanha encontrada.' : 'Nenhuma campanha neste filtro.'}
                </td>
              </tr>
            ) : filtered.map((c, i) => {
              const active = c.status === 'ACTIVE' || c.status === 'ENABLED'
              const cplColor = c.cpl > 0 ? (c.cpl < 30 ? '#22C55E' : c.cpl < 80 ? '#F0B429' : '#FF4D4D') : '#475569'
              const ctrColor = c.ctr >= 1.5 ? '#22C55E' : c.ctr >= 0.8 ? '#F0B429' : c.ctr > 0 ? '#FF4D4D' : '#475569'
              return (
                <tr key={c.id} className="hover:bg-[#16161A] transition-colors group">
                  <td className="px-5 py-3 text-slate-700 font-mono text-[10px]">{i + 1}</td>
                  <td className="px-3 py-3 max-w-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-8 rounded-full flex-shrink-0"
                        style={{ background: active ? color : '#2A2A30' }} />
                      <span className="font-semibold text-white leading-tight">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <StatusDot status={c.status} />
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-semibold text-[#F0B429]">{fmt(c.spend)}</td>
                  <td className="px-3 py-3 text-right font-mono font-semibold text-[#38BDF8]">
                    {c.leads > 0 ? c.leads.toLocaleString('pt-BR') : <span className="text-slate-700">—</span>}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-semibold" style={{ color: cplColor }}>
                    {c.cpl > 0 ? `R$${c.cpl}` : <span className="text-slate-700">—</span>}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-semibold" style={{ color: ctrColor }}>
                    {c.ctr > 0 ? `${c.ctr}%` : <span className="text-slate-700">—</span>}
                  </td>
                  <td className="px-3 py-3 text-right text-slate-500 font-mono">
                    {fmtNum(c.impressions)}
                  </td>
                  {campaigns.some(cc => cc.roas > 0) && (
                    <td className="px-3 py-3 text-right font-mono font-semibold"
                      style={{ color: c.roas >= 3 ? '#22C55E' : c.roas > 0 ? '#F0B429' : '#475569' }}>
                      {c.roas > 0 ? `${c.roas}×` : <span className="text-slate-700">—</span>}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
          {/* Totals footer row */}
          {totals && filtered.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-[#2A2A30] bg-[#0D0D10]">
                <td className="px-5 py-2.5"></td>
                <td className="px-3 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wide" colSpan={2}>
                  Total ({filtered.length} campanhas)
                </td>
                <td className="px-3 py-2.5 text-right font-mono font-bold text-[#F0B429] text-xs">{fmt(totals.spend)}</td>
                <td className="px-3 py-2.5 text-right font-mono font-bold text-[#38BDF8] text-xs">{totals.leads.toLocaleString('pt-BR')}</td>
                <td className="px-3 py-2.5 text-right font-mono font-bold text-[#A78BFA] text-xs">R${totals.cpl}</td>
                <td className="px-3 py-2.5 text-right font-mono font-bold text-xs"
                  style={{ color: totals.ctr >= 1.5 ? '#22C55E' : totals.ctr >= 0.8 ? '#F0B429' : '#FF4D4D' }}>
                  {totals.ctr}%
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-slate-500 text-xs">{fmtNum(totals.impressions)}</td>
                {campaigns.some(c => c.roas > 0) && (
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-xs"
                    style={{ color: totals.roas >= 3 ? '#22C55E' : totals.roas > 0 ? '#F0B429' : '#475569' }}>
                    {totals.roas > 0 ? `${totals.roas}×` : '—'}
                  </td>
                )}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}

export function TabConnections() {
  const { connectedAccounts, connectAccount, disconnectAccount } = useAppStore()

  const [metaCampaigns,   setMetaCampaigns]   = useState<AdsCampaign[]>([])
  const [googleCampaigns, setGoogleCampaigns] = useState<AdsCampaign[]>([])
  const [metaTotals,      setMetaTotals]      = useState<Totals | null>(null)
  const [googleTotals,    setGoogleTotals]    = useState<Totals | null>(null)
  const [loadingMeta,     setLoadingMeta]     = useState(false)
  const [loadingGoogle,   setLoadingGoogle]   = useState(false)
  const [error,           setError]           = useState('')

  // Seletor de conta Meta — ativo quando há múltiplas contas após OAuth
  const [pendingMeta,     setPendingMeta]     = useState<{
    accessToken: string
    accounts: { id: string; name: string }[]
  } | null>(null)

  const metaAccount   = connectedAccounts.find((a) => a.platform === 'meta')
  const googleAccount = connectedAccounts.find((a) => a.platform === 'google')

  // Lê resultado OAuth via cookie httpOnly (token nunca fica na URL)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params   = new URLSearchParams(window.location.search)
    const success  = params.get('oauth_success')
    const platform = params.get('platform') as 'meta' | 'google' | null
    const oauthErr = params.get('oauth_error')

    if (oauthErr) {
      setError(`Erro ao conectar: ${oauthErr}`)
      window.history.replaceState({}, '', '/dashboard')
      return
    }

    if (success && platform) {
      window.history.replaceState({}, '', '/dashboard')
      fetch('/api/oauth/token')
        .then((r) => r.json())
        .then((data) => {
          if (!data.success || !data.accessToken) return
          const accounts: { id: string; name: string }[] = data.accounts || []

          // Meta com múltiplas contas → mostra seletor
          if (data.platform === 'meta' && accounts.length > 1) {
            setPendingMeta({ accessToken: data.accessToken, accounts })
            return
          }

          // Conta única ou Google → conecta direto
          const accountToConnect = {
            platform:    data.platform,
            accessToken: data.accessToken,
            accountId:   data.accountId   || undefined,
            accountName: data.accountName || undefined,
            connectedAt: new Date().toISOString(),
          }
          connectAccount(accountToConnect)
          // Persiste no Supabase vinculado ao usuário
          fetch('/api/connections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(accountToConnect),
          }).catch(() => {})
        })
        .catch(() => setError('Erro ao recuperar token de conexão. Tente conectar novamente.'))
    }
  }, [])

  // Busca dados quando conta conectada muda
  useEffect(() => {
    if (metaAccount?.accessToken && metaAccount?.accountId) {
      fetchMetaData(metaAccount.accessToken, metaAccount.accountId)
    }
  }, [metaAccount?.accountId])

  useEffect(() => {
    if (googleAccount?.accessToken && googleAccount?.accountId) {
      fetchGoogleData(googleAccount.accessToken, googleAccount.accountId)
    }
  }, [googleAccount?.accountId])

  const fetchMetaData = async (token: string, accountId: string) => {
    setLoadingMeta(true)
    try {
      const res  = await fetch('/api/ads-data/meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token, accountId }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setMetaCampaigns(data.campaigns)
      setMetaTotals(data.totals)
    } catch (e: any) {
      setError(`Meta Ads: ${e.message}`)
    } finally {
      setLoadingMeta(false)
    }
  }

  const fetchGoogleData = async (token: string, accountId: string) => {
    setLoadingGoogle(true)
    try {
      const res  = await fetch('/api/ads-data/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token, accountId }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setGoogleCampaigns(data.campaigns)
      setGoogleTotals(data.totals)
    } catch (e: any) {
      setError(`Google Ads: ${e.message}`)
    } finally {
      setLoadingGoogle(false)
    }
  }

  const connectMeta = () => {
    const csrf        = crypto.randomUUID()
    document.cookie   = `oauth_csrf=${csrf}; path=/; max-age=300; samesite=lax`
    const appId       = process.env.NEXT_PUBLIC_META_APP_ID
    const redirectUri = `${window.location.origin}/api/oauth/callback`
    const scope       = 'ads_read,ads_management,business_management'
    window.location.href =
      `https://www.facebook.com/v19.0/dialog/oauth?` +
      `client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${scope}&state=${encodeURIComponent(`meta:${csrf}`)}`
  }

  const connectGoogle = () => {
    const csrf        = crypto.randomUUID()
    document.cookie   = `oauth_csrf=${csrf}; path=/; max-age=300; samesite=lax`
    const clientId    = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const redirectUri = `${window.location.origin}/api/oauth/callback`
    const scope = encodeURIComponent(
      'https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/userinfo.email'
    )
    window.location.href =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code&scope=${scope}&state=${encodeURIComponent(`google:${csrf}`)}&access_type=offline&prompt=consent`
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="font-display text-2xl font-bold text-white mb-1">Conexões de Anúncios</h2>
        <p className="text-slate-500 text-sm">
          Conecte suas contas para acompanhar campanhas reais em tempo real — CPL, ROAS e leads direto do Meta e Google.
        </p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-300 ml-4">×</button>
        </div>
      )}

      {/* Cards de conexão */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Meta Ads */}
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: 'rgba(24,119,242,0.15)', border: '1px solid rgba(24,119,242,0.3)' }}>
                📘
              </div>
              <div>
                <div className="font-display font-bold text-white">Meta Ads</div>
                <div className="text-xs text-slate-500">Facebook · Instagram · Reels</div>
              </div>
            </div>
            {metaAccount ? (
              <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }}>
                ✓ Conectado
              </span>
            ) : (
              <span className="text-[10px] text-slate-600 px-2 py-1 rounded-full border border-[#2A2A30]">
                Desconectado
              </span>
            )}
          </div>

          {/* Seletor de conta — aparece após OAuth com múltiplas contas */}
          {!metaAccount && pendingMeta ? (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 font-semibold">Selecione a conta de anúncios:</div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {pendingMeta.accounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => {
                      const chosen = {
                        platform:    'meta' as const,
                        accessToken: pendingMeta.accessToken,
                        accountId:   acc.id,
                        accountName: acc.name,
                        connectedAt: new Date().toISOString(),
                      }
                      connectAccount(chosen)
                      setPendingMeta(null)
                      // Persiste no Supabase vinculado ao usuário
                      fetch('/api/connections', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(chosen),
                      }).catch(() => {})
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-80"
                    style={{ background: 'rgba(24,119,242,0.1)', border: '1px solid rgba(24,119,242,0.25)' }}
                  >
                    <div className="text-sm font-semibold truncate">{acc.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {acc.id}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPendingMeta(null)}
                className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          ) : metaAccount ? (
            <div className="space-y-3">
              <div className="bg-[#16161A] rounded-xl px-3 py-2">
                <div className="text-[10px] text-slate-500 uppercase mb-0.5">Conta ativa</div>
                <div className="text-sm font-semibold text-white truncate">
                  {metaAccount.accountName || metaAccount.accountId || 'Conta conectada'}
                </div>
                <div className="text-[10px] text-slate-600 font-mono mt-0.5">ID: {metaAccount.accountId}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => metaAccount.accountId && fetchMetaData(metaAccount.accessToken, metaAccount.accountId)}
                  disabled={loadingMeta}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                  style={{ background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.3)', color: '#F0B429' }}
                >
                  {loadingMeta ? '⏳ Buscando...' : '🔄 Atualizar dados'}
                </button>
                <button
                  onClick={() => {
                    disconnectAccount('meta')
                    setMetaCampaigns([])
                    setMetaTotals(null)
                    fetch('/api/connections/meta', { method: 'DELETE' }).catch(() => {})
                  }}
                  className="px-3 py-2 rounded-xl text-xs text-slate-600 hover:text-[#FF4D4D] border border-[#2A2A30] transition-colors"
                >
                  Desconectar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 leading-relaxed">
                Conecte sua conta do Gerenciador de Anúncios para ver campanhas, CPL real e ROAS atualizado automaticamente.
              </p>
              <div className="text-[10px] text-slate-600 bg-[#16161A] rounded-xl px-3 py-2 space-y-1">
                <div className="font-semibold text-slate-500 mb-1">Permissões solicitadas:</div>
                <div>→ ads_read (ler campanhas e métricas)</div>
                <div>→ business_management (acessar contas)</div>
              </div>
              <button
                onClick={connectMeta}
                className="w-full py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                style={{ background: 'linear-gradient(135deg, #1877F2, #0a5dc2)', color: '#fff' }}
              >
                Conectar Meta Ads
              </button>
            </div>
          )}
        </div>

        {/* Google Ads */}
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: 'rgba(234,67,53,0.12)', border: '1px solid rgba(234,67,53,0.25)' }}>
                🔍
              </div>
              <div>
                <div className="font-display font-bold text-white">Google Ads</div>
                <div className="text-xs text-slate-500">Search · Shopping · YouTube · PMAX</div>
              </div>
            </div>
            {googleAccount ? (
              <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }}>
                ✓ Conectado
              </span>
            ) : (
              <span className="text-[10px] text-slate-600 px-2 py-1 rounded-full border border-[#2A2A30]">
                Desconectado
              </span>
            )}
          </div>

          {googleAccount ? (
            <div className="space-y-3">
              <div className="bg-[#16161A] rounded-xl px-3 py-2">
                <div className="text-[10px] text-slate-500 uppercase mb-0.5">Conta</div>
                <div className="text-sm font-semibold text-white truncate">
                  {googleAccount.accountName || googleAccount.accountId || 'Conta conectada'}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => googleAccount.accountId && fetchGoogleData(googleAccount.accessToken, googleAccount.accountId)}
                  disabled={loadingGoogle}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                  style={{ background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.3)', color: '#F0B429' }}
                >
                  {loadingGoogle ? '⏳ Buscando...' : '🔄 Atualizar dados'}
                </button>
                <button
                  onClick={() => {
                    disconnectAccount('google')
                    setGoogleCampaigns([])
                    setGoogleTotals(null)
                    fetch('/api/connections/google', { method: 'DELETE' }).catch(() => {})
                  }}
                  className="px-3 py-2 rounded-xl text-xs text-slate-600 hover:text-[#FF4D4D] border border-[#2A2A30] transition-colors"
                >
                  Desconectar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 leading-relaxed">
                Conecte sua conta do Google Ads para acompanhar campanhas de Search, Shopping e PMAX com dados reais.
              </p>
              <div className="text-[10px] text-slate-600 bg-[#16161A] rounded-xl px-3 py-2 space-y-1">
                <div className="font-semibold text-slate-500 mb-1">Permissões solicitadas:</div>
                <div>→ adwords (ler campanhas e métricas)</div>
                <div>→ userinfo.email (identificar a conta)</div>
              </div>
              <button
                onClick={connectGoogle}
                className="w-full py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                style={{ background: 'linear-gradient(135deg, #EA4335, #c5221f)', color: '#fff' }}
              >
                Conectar Google Ads
              </button>
            </div>
          )}
        </div>
      </div>


      {/* Campanhas Meta */}
      {metaCampaigns.length > 0 && (
        <CampaignTable
          title="Campanhas Meta Ads"
          icon="📘"
          color="#1877F2"
          campaigns={metaCampaigns}
          totals={metaTotals}
        />
      )}

      {/* Campanhas Google */}
      {googleCampaigns.length > 0 && (
        <CampaignTable
          title="Campanhas Google Ads"
          icon="🔍"
          color="#EA4335"
          campaigns={googleCampaigns}
          totals={googleTotals}
        />
      )}

      {/* Estado vazio com contas conectadas mas sem dados ainda */}
      {(metaAccount && metaCampaigns.length === 0 && !loadingMeta) ||
       (googleAccount && googleCampaigns.length === 0 && !loadingGoogle) ? (
        <div className="text-center py-8 text-slate-600 text-sm">
          Clique em "Atualizar dados" para buscar suas campanhas ativas.
        </div>
      ) : null}
    </div>
  )
}

