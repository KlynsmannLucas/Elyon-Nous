// app/(elyon)/integracoes/page.tsx — Conexões OAuth (Meta/Google) + seleção da conta de anúncio.
'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, Badge, Button, SectionHead, Modal, AdAccountPicker } from '@/components/dashboard/v2'

function setReturnCookie() {
  try { document.cookie = `oauth_return=/integracoes; path=/; max-age=600; samesite=lax` } catch {}
}
function connectMeta() {
  setReturnCookie()
  const csrf = crypto.randomUUID()
  document.cookie = `oauth_csrf=${csrf}; path=/; max-age=300; samesite=lax`
  const appId = process.env.NEXT_PUBLIC_META_APP_ID
  const redirectUri = `${window.location.origin}/api/oauth/callback`
  window.location.href = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=ads_read,ads_management,business_management&state=${encodeURIComponent(`meta:${csrf}`)}`
}
function connectGoogle() {
  setReturnCookie()
  const csrf = crypto.randomUUID()
  document.cookie = `oauth_csrf=${csrf}; path=/; max-age=300; samesite=lax`
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const redirectUri = `${window.location.origin}/api/oauth/callback`
  const scope = encodeURIComponent('https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/userinfo.email')
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${encodeURIComponent(`google:${csrf}`)}&access_type=offline&prompt=consent`
}

export default function IntegracoesPage() {
  const clientData = useAppStore(s => s.clientData)
  const savedClients = useAppStore(s => s.savedClients)
  const connectedAccounts = useAppStore(s => s.connectedAccounts)
  const disconnectAccount = useAppStore(s => s.disconnectAccount)
  const [mounted, setMounted] = useState(false)
  const [showConnect, setShowConnect] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const key = clientData?.clientName || savedClients?.[0]?.clientData?.clientName || ''
  const connected = connectedAccounts.length
  const stats = [
    { label: 'Conectadas', value: connected, color: '#161B26' },
    { label: 'Saudáveis', value: connected, color: '#0B855D' },
    { label: 'Com atenção', value: 0, color: '#E08B0B' },
  ]

  const disconnect = (platform: 'meta' | 'google') => {
    if (!window.confirm(`Desconectar ${platform === 'meta' ? 'Meta Ads' : 'Google Ads'}?`)) return
    disconnectAccount(platform)
    fetch(`/api/connections/${platform}`, { method: 'DELETE' }).catch(() => {})
  }

  const platforms = [
    { id: 'meta' as const, name: 'Meta Ads', icon: '📘', connect: connectMeta, scopes: 'ler campanhas · gerenciar · contas do Business' },
    { id: 'google' as const, name: 'Google Ads', icon: '🔍', connect: connectGoogle, scopes: 'ler e gerenciar campanhas (AdWords)' },
  ]

  return (
    <div className="p-4 md:p-6">
      <header className="mb-5 flex items-start justify-between gap-3 flex-wrap animate-fade-up">
        <div>
          <h1 className="text-[23px] font-bold text-ink" style={{ letterSpacing: '-0.02em' }}>Integrações</h1>
          <p className="text-sm text-ink-2 mt-0.5">{key || 'Conecte suas contas de anúncio'}</p>
        </div>
        <Button size="sm" onClick={() => setShowConnect(true)}>+ Conectar nova</Button>
      </header>

      {/* KPIs de conexão */}
      <div className="grid grid-cols-3 gap-3 mb-4 animate-fade-up">
        {stats.map(s => (
          <Card key={s.label} padding="sm">
            <div className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3 mb-1">{s.label}</div>
            <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Modal Conectar nova */}
      <Modal open={showConnect} onClose={() => setShowConnect(false)} title="Conectar nova plataforma" sub="Sincronize dados reais das suas contas de anúncio" icon="plug">
        <div className="space-y-2.5">
          {platforms.map(p => {
            const isConnected = connectedAccounts.some(a => a.platform === p.id)
            return (
              <button key={p.id} onClick={() => { setShowConnect(false); p.connect() }}
                className="w-full flex items-center gap-3 p-3.5 rounded-sm border border-line bg-paper hover:border-blue-line transition-colors text-left">
                <span className="w-9 h-9 rounded-md bg-canvas-2 flex items-center justify-center shrink-0 text-lg">{p.icon}</span>
                <div className="flex-1"><div className="text-sm font-semibold text-ink">{p.name}</div><div className="text-xs text-ink-3">{p.scopes}</div></div>
                {isConnected ? <Badge tone="good" dot>Conectado</Badge> : <span className="text-blue text-sm font-medium">Conectar →</span>}
              </button>
            )
          })}
        </div>
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-up">
        {platforms.map(p => {
          const isConnected = connectedAccounts.some(a => a.platform === p.id)
          return (
            <Card key={p.id} className={isConnected ? 'border-green-line' : ''}>
              <SectionHead title={p.name} icon={<span>{p.icon}</span>}
                action={<Badge tone={isConnected ? 'good' : 'neutral'} dot>{isConnected ? 'Conectado' : 'Não conectado'}</Badge>} />
              {isConnected ? (
                <div className="space-y-1.5">
                  <AdAccountPicker platform={p.id} clientKey={key} />
                  <p className="text-[11px] text-ink-3">A Análise Profunda e os relatórios usam a conta selecionada acima.</p>
                </div>
              ) : (
                <p className="text-sm text-ink-3">Conecte para sincronizar dados reais — {p.scopes}.</p>
              )}
              <div className="mt-3 pt-3 border-t border-line flex gap-2">
                {isConnected ? (
                  <>
                    <Button size="sm" variant="soft" onClick={p.connect}>Reconectar</Button>
                    <Button size="sm" variant="ghost" onClick={() => disconnect(p.id)}>Desconectar</Button>
                  </>
                ) : (
                  <Button size="sm" onClick={p.connect}>Conectar {p.name}</Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      <p className="text-xs text-ink-3 mt-4">As conexões são por usuário e ficam salvas com segurança. Os tokens nunca são expostos ao navegador.</p>
    </div>
  )
}
