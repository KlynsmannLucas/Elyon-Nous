// app/desempenho/page.tsx — Desempenho (campanhas, métricas)
'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, Badge, Button, SectionHead, Delta, SourceBadge } from '@/components/dashboard/v2'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-canvas p-4 md:p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-blue-soft flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-blue text-2xl">📊</span>
        </div>
        <p className="text-ink-2">Carregando...</p>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="min-h-screen bg-canvas p-4 md:p-6">
      <Card className="max-w-xl mx-auto mt-20">
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-blue-soft flex items-center justify-center mx-auto mb-4">
            <span className="text-blue text-2xl">📊</span>
          </div>
          <h2 className="text-lg font-semibold text-ink mb-2">Sem dados de performance</h2>
          <p className="text-sm text-ink-2 mb-4">
            Conecte suas contas de anúncios para ver resultados.
          </p>
          <Button onClick={() => window.location.href = '/dashboard?view=connections'}>
            Conectar plataformas
          </Button>
        </div>
      </Card>
    </div>
  )
}

type SubTab = 'visao' | 'campanhas' | 'canais' | 'criativos' | 'funil'

export default function DesempenhoPage() {
  const clientData = useAppStore(s => s.clientData)
  const savedClients = useAppStore(s => s.savedClients)
  const campaignHistory = useAppStore(s => s.campaignHistory)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<SubTab>('visao')

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <LoadingState />

  const activeClient = clientData?.clientName || savedClients?.[0]?.clientData?.clientName

  if (!activeClient) {
    return <EmptyState />
  }

  const tabs: { key: SubTab; label: string }[] = [
    { key: 'visao', label: 'Visão Geral' },
    { key: 'campanhas', label: 'Campanhas' },
    { key: 'canais', label: 'Canais' },
    { key: 'criativos', label: 'Criativos' },
    { key: 'funil', label: 'Funil' },
  ]

  const campaigns = campaignHistory || []

  // Calculate totals
  const totalSpent = campaigns.reduce((sum, c) => sum + (c.budgetSpent || 0), 0)

  return (
    <div className="min-h-screen bg-canvas p-4 md:p-6">
      {/* Header */}
      <header className="mb-6 animate-fade-up">
        <h1 className="text-[23px] font-bold text-ink">Desempenho</h1>
        <p className="text-sm text-ink-2 mt-1">{activeClient}</p>
      </header>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-line">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.key 
                ? 'text-blue border-blue' 
                : 'text-ink-3 border-transparent hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'visao' && (
        <div className="space-y-4 animate-fade-up">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card padding="sm">
              <div className="text-[10.5px] font-mono uppercase text-ink-3">Investido</div>
              <div className="text-xl font-bold font-mono text-ink">{formatCurrency(totalSpent)}</div>
            </Card>
            <Card padding="sm">
              <div className="text-[10.5px] font-mono uppercase text-ink-3">Campanhas</div>
              <div className="text-xl font-bold font-mono text-ink">{campaigns.length}</div>
            </Card>
            <Card padding="sm">
              <div className="text-[10.5px] font-mono uppercase text-ink-3">ROAS</div>
              <div className="text-xl font-bold font-mono text-ink">0x</div>
            </Card>
            <Card padding="sm">
              <div className="text-[10.5px] font-mono uppercase text-ink-3">CPA</div>
              <div className="text-xl font-bold font-mono text-ink">R$ 0</div>
            </Card>
          </div>

          {/* Campaigns Table */}
          <Card>
            <SectionHead title="Campanhas" icon={<span>📊</span>} />
            {campaigns.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="text-left py-2 px-3 text-ink-3 font-medium">Nome</th>
                      <th className="text-right py-2 px-3 text-ink-3 font-medium">Investido</th>
                      <th className="text-right py-2 px-3 text-ink-3 font-medium">ROAS</th>
                      <th className="text-right py-2 px-3 text-ink-3 font-medium">CPA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.slice(0, 10).map((c, i) => (
                      <tr key={c.id || i} className="border-b border-line hover:bg-canvas-2">
                        <td className="py-2 px-3 text-ink">{c.channel}</td>
                        <td className="py-2 px-3 text-right font-mono text-ink">{formatCurrency(c.budgetSpent || 0)}</td>
                        <td className="py-2 px-3 text-right font-mono text-green">0x</td>
                        <td className="py-2 px-3 text-right font-mono text-ink">R$ 0</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-ink-3">
                <p>Nenhuma campanha encontrada.</p>
                <Button variant="ghost" size="sm" className="mt-3" onClick={() => window.location.href = '/dashboard?view=anuncios'}>
                  Criar campanha
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}


      {activeTab === 'campanhas' && (
        <Card className="animate-fade-up">
          <SectionHead title="Todas as Campanhas" icon={<span>📡</span>} />
          {campaigns.length > 0 ? (
            <div className="space-y-2">
              {campaigns.map((c, i) => (
                <div key={c.id || i} className="flex items-center justify-between p-3 bg-canvas-2 rounded-sm">
                  <div>
                    <div className="text-sm font-medium text-ink">{c.channel}</div>
                    <div className="text-xs text-ink-3">{c.period}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-ink">{formatCurrency(c.budgetSpent || 0)}</div>
                    <Badge tone="neutral" dot>{c.channel}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-ink-3">Nenhuma campanha.</p>
          )}
        </Card>
      )}

      {['canais', 'criativos', 'funil'].includes(activeTab) && (
        <Card className="animate-fade-up">
          <p className="text-center py-8 text-ink-3">
            Aba em desenvolvimento. Continue usando o dashboard principal.
          </p>
          <div className="text-center">
            <Button onClick={() => window.location.href = '/dashboard'}>
              Voltar ao dashboard
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
