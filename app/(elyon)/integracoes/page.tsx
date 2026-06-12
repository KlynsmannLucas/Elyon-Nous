// app/integracoes/page.tsx — Integrações (Meta, Google, tools)
'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, Badge, Button, SectionHead, SourceBadge } from '@/components/dashboard/v2'

function LoadingState() {
  return (
    <div className="min-h-screen bg-canvas p-4 md:p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-blue-soft flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-blue text-2xl">🔌</span>
        </div>
        <p className="text-ink-2">Carregando...</p>
      </div>
    </div>
  )
}

export default function IntegracoesPage() {
  const clientData = useAppStore(s => s.clientData)
  const savedClients = useAppStore(s => s.savedClients)
  const connectedAccounts = useAppStore(s => s.connectedAccounts)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <LoadingState />

  const activeClient = clientData?.clientName || savedClients?.[0]?.clientData?.clientName

  const integrations = [
    {
      platform: 'meta',
      name: 'Meta Ads',
      icon: '📘',
      accounts: connectedAccounts.filter(a => a.platform === 'meta'),
      status: connectedAccounts.some(a => a.platform === 'meta') ? 'connected' : 'disconnected',
      color: '#0081FB',
    },
    {
      platform: 'google',
      name: 'Google Ads',
      icon: '🔍',
      accounts: connectedAccounts.filter(a => a.platform === 'google'),
      status: connectedAccounts.some(a => a.platform === 'google') ? 'connected' : 'disconnected',
      color: '#EA4335',
    },
  ]

  const tools = [
    { name: 'Meta Pixel', status: 'connected', icon: '🔹' },
    { name: 'Google Tag Manager', status: 'pending', icon: '📊' },
    { name: 'Supabase', status: 'connected', icon: '🗄️' },
    { name: 'Slack', status: 'disconnected', icon: '💬' },
    { name: 'Zapier', status: 'disconnected', icon: '⚡' },
  ]

  return (
    <div className="min-h-screen bg-canvas p-4 md:p-6">
      <header className="mb-6 animate-fade-up">
        <h1 className="text-[23px] font-bold text-ink">Integrações</h1>
        <p className="text-sm text-ink-2 mt-1">{activeClient || 'Selecione um cliente'}</p>
      </header>

      {/* Ad Platforms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 animate-fade-up d2">
        {integrations.map(integ => (
          <Card key={integ.platform} className={integ.status === 'connected' ? 'border-green-line' : ''}>
            <SectionHead 
              title={integ.name} 
              icon={<span>{integ.icon}</span>}
              action={
                <Badge tone={integ.status === 'connected' ? 'good' : 'neutral'} dot>
                  {integ.status === 'connected' ? 'Conectado' : 'Pendente'}
                </Badge>
              }
            />
            {integ.status === 'connected' ? (
              <div className="mt-3 space-y-2">
                {integ.accounts.map((acc, i) => (
                  <div key={i} className="text-xs text-ink bg-canvas-2 p-2 rounded-sm">
                    {acc.accountName || acc.accountId}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 text-center py-4">
                <p className="text-sm text-ink-3 mb-3">Conecte para sincronizar dados.</p>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-line">
              <Button 
                size="sm" 
                variant={integ.status === 'connected' ? 'ghost' : 'soft'}
                onClick={() => window.location.href = '/dashboard?view=connections'}
              >
                {integ.status === 'connected' ? 'Gerenciar' : 'Conectar'}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Ferramentas */}
      <Card className="animate-fade-up d3">
        <SectionHead title="Ferramentas" icon={<span>🛠️</span>} />
        <div className="grid grid-cols-2 gap-3 mt-3">
          {tools.map(tool => (
            <div key={tool.name} className="flex items-center justify-between p-3 bg-canvas-2 rounded-sm">
              <div className="flex items-center gap-2">
                <span>{tool.icon}</span>
                <span className="text-sm text-ink">{tool.name}</span>
              </div>
              <Badge tone={tool.status === 'connected' ? 'good' : tool.status === 'pending' ? 'warn' : 'neutral'}>
                {tool.status === 'connected' ? 'OK' : tool.status === 'pending' ? 'Pendente' : 'Off'}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
