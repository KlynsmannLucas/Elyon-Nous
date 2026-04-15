// components/dashboard/TabConnections.tsx — Conectar Meta Ads e Google Ads
'use client'

import { useState, useEffect } from 'react'
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

function StatusPill({ status }: { status: string }) {
  const active = status === 'ACTIVE' || status === 'ENABLED'
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{
        color: active ? '#22C55E' : '#94A3B8',
        background: active ? 'rgba(34,197,94,0.1)' : 'rgba(148,163,184,0.1)',
      }}>
      {active ? 'Ativa' : 'Pausada'}
    </span>
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

  const metaAccount   = connectedAccounts.find((a) => a.platform === 'meta')
  const googleAccount = connectedAccounts.find((a) => a.platform === 'google')

  // Lê parâmetros OAuth do callback na URL
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const success  = params.get('oauth_success')
    const platform = params.get('platform') as 'meta' | 'google' | null
    const token    = params.get('access_token')
    const accId    = params.get('account_id')
    const accName  = params.get('account_name')
    const oauthErr = params.get('oauth_error')

    if (oauthErr) {
      setError(`Erro ao conectar: ${oauthErr}`)
      window.history.replaceState({}, '', '/dashboard')
    }

    if (success && platform && token) {
      connectAccount({
        platform,
        accessToken: token,
        accountId:   accId   || undefined,
        accountName: accName || undefined,
        connectedAt: new Date().toISOString(),
      })
      window.history.replaceState({}, '', '/dashboard')
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
    const appId      = process.env.NEXT_PUBLIC_META_APP_ID
    const redirectUri = `${window.location.origin}/api/oauth/callback`
    const scope = 'ads_read,ads_management,business_management'
    window.location.href =
      `https://www.facebook.com/v19.0/dialog/oauth?` +
      `client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${scope}&state=meta`
  }

  const connectGoogle = () => {
    const clientId    = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const redirectUri = `${window.location.origin}/api/oauth/callback`
    const scope = encodeURIComponent(
      'https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/userinfo.email'
    )
    window.location.href =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code&scope=${scope}&state=google&access_type=offline&prompt=consent`
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

          {metaAccount ? (
            <div className="space-y-3">
              <div className="bg-[#16161A] rounded-xl px-3 py-2">
                <div className="text-[10px] text-slate-500 uppercase mb-0.5">Conta</div>
                <div className="text-sm font-semibold text-white truncate">
                  {metaAccount.accountName || metaAccount.accountId || 'Conta conectada'}
                </div>
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
                  onClick={() => { disconnectAccount('meta'); setMetaCampaigns([]); setMetaTotals(null) }}
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
                  onClick={() => { disconnectAccount('google'); setGoogleCampaigns([]); setGoogleTotals(null) }}
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

function CampaignTable({ title, icon, color, campaigns, totals }: {
  title: string; icon: string; color: string
  campaigns: AdsCampaign[]; totals: Totals | null
}) {
  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#2A2A30] flex items-center gap-2">
        <span>{icon}</span>
        <h3 className="font-display font-bold text-white">{title}</h3>
        <span className="text-xs text-slate-500 ml-1">· últimos 30 dias</span>
      </div>

      {/* KPIs totais */}
      {totals && (
        <div className="grid grid-cols-4 md:grid-cols-7 gap-0 border-b border-[#1E1E24]">
          {[
            { label: 'Investido',    value: fmt(totals.spend) },
            { label: 'Impressões',   value: totals.impressions.toLocaleString('pt-BR') },
            { label: 'Cliques',      value: totals.clicks.toLocaleString('pt-BR') },
            { label: 'CTR',          value: `${totals.ctr}%` },
            { label: 'Leads',        value: String(totals.leads) },
            { label: 'CPL Real',     value: `R$${totals.cpl}` },
            { label: 'ROAS',         value: totals.roas > 0 ? `${totals.roas}×` : '—' },
          ].map((k) => (
            <div key={k.label} className="px-4 py-3 text-center border-r border-[#1E1E24] last:border-0">
              <div className="text-[10px] text-slate-600 uppercase mb-0.5">{k.label}</div>
              <div className="text-sm font-bold" style={{ color }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabela de campanhas */}
      <div className="divide-y divide-[#1E1E24]">
        {campaigns.map((c) => (
          <div key={c.id} className="px-6 py-3 hover:bg-[#16161A] transition-colors">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-white truncate">{c.name}</span>
                  <StatusPill status={c.status} />
                </div>
                <div className="flex gap-4 text-xs text-slate-500">
                  <span>Investido: <strong className="text-[#F0B429]">{fmt(c.spend)}</strong></span>
                  <span>Leads: <strong className="text-white">{c.leads}</strong></span>
                  <span>CPL: <strong className="text-[#38BDF8]">R${c.cpl}</strong></span>
                  {c.roas > 0 && <span>ROAS: <strong className="text-[#22C55E]">{c.roas}×</strong></span>}
                  <span>CTR: <strong className="text-slate-300">{c.ctr}%</strong></span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
