// app/(elyon)/integracoes/page.tsx — Conexões OAuth (Meta/Google) direto no v2.
'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, Badge, Button, SectionHead } from '@/components/dashboard/v2'

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
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const key = clientData?.clientName || savedClients?.[0]?.clientData?.clientName || ''

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
      <header className="mb-5 animate-fade-up">
        <h1 className="text-[23px] font-bold text-ink" style={{ letterSpacing: '-0.02em' }}>Integrações</h1>
        <p className="text-sm text-ink-2 mt-0.5">{key || 'Conecte suas contas de anúncio'}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-up">
        {platforms.map(p => {
          const accounts = connectedAccounts.filter(a => a.platform === p.id)
          const connected = accounts.length > 0
          return (
            <Card key={p.id} className={connected ? 'border-green-line' : ''}>
              <SectionHead title={p.name} icon={<span>{p.icon}</span>}
                action={<Badge tone={connected ? 'good' : 'neutral'} dot>{connected ? 'Conectado' : 'Não conectado'}</Badge>} />
              {connected ? (
                <div className="space-y-2">
                  {accounts.map((acc, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm bg-canvas-2 px-3 py-2 rounded-sm">
                      <span className="text-green-600">●</span>
                      <span className="text-ink truncate">{acc.accountName || acc.accountId || 'Conta conectada'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-3">Conecte para sincronizar dados reais — {p.scopes}.</p>
              )}
              <div className="mt-3 pt-3 border-t border-line flex gap-2">
                {connected ? (
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
