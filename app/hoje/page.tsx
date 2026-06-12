// app/hoje/page.tsx — Tela Hoje (Home)
// Usa dados reais do store quando disponíveis
'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, Badge, Button, SectionHead, Delta, SourceBadge } from '@/components/dashboard/v2'

// Dados fallback (quando não há dados reais)
const FALLBACK_KPIS = [
  { label: 'Receita 7d', value: 'R$ 0', trend: 0, color: '#2C5FE0' },
  { label: 'ROAS', value: '0x', trend: 0, color: '#0E9E6E' },
  { label: 'CPA', value: 'R$ 0', trend: 0, color: '#E08B0B' },
  { label: 'Leads', value: '0', trend: 0, color: '#64748B' },
]

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function formatDate() {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-canvas p-4 md:p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-blue-soft flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-blue text-2xl">◎</span>
        </div>
        <p className="text-ink-2">Carregando dados...</p>
      </div>
    </div>
  )
}

function EmptyState({ clientName }: { clientName?: string }) {
  return (
    <div className="min-h-screen bg-canvas p-4 md:p-6">
      <header className="mb-6 animate-fade-up">
        <h1 className="text-[23px] font-bold text-ink">{getGreeting()}</h1>
        <p className="text-sm text-ink-2 mt-0.5">{formatDate()}</p>
      </header>
      <Card className="bg-gradient-to-br from-blue-soft to-green-soft border-blue-line">
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-blue flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">+</span>
          </div>
          <h2 className="text-lg font-semibold text-ink mb-2">Bem-vindo ao Elyon</h2>
          <p className="text-sm text-ink-2 mb-4">
            {clientName 
              ? `Olá, ${clientName}! Vamos configurar seu primeiro cliente.` 
              : 'Vamos começar configurando seu primeiro cliente.'}
          </p>
          <Button onClick={() => window.location.href = '/dashboard?view=wizard'}>
            Criar primeiro cliente
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default function HojePage() {
  const clientData = useAppStore(s => s.clientData)
  const savedClients = useAppStore(s => s.savedClients)
  const clientHealthScores = useAppStore(s => s.clientHealthScores)
  const pendingActionsCache = useAppStore(s => s.pendingActionsCache)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <LoadingState />

  const activeClientName = clientData?.clientName || savedClients?.[0]?.clientName
  const healthScore = activeClientName ? clientHealthScores[activeClientName] : null
  const actions = activeClientName ? pendingActionsCache[activeClientName] || [] : []

  if (!activeClientName) {
    return <EmptyState />
  }

  // Get KPI data - in a real app, this would come from an API
  const kpis = FALLBACK_KPIS
  const streak = 0 // Would come from user tracking in DB

  return (
    <div className="min-h-screen bg-canvas p-4 md:p-6">
      {/* Header */}
      <header className="mb-6 animate-fade-up">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[23px] font-bold text-ink" style={{ letterSpacing: '-0.02em' }}>
              {getGreeting()}, {activeClientName.split(' ')[0]}
            </h1>
            <p className="text-sm text-ink-2 mt-0.5 capitalize">{formatDate()}</p>
          </div>
          {streak > 0 && (
            <Badge tone="warn" dot>🔥 {streak} dias seguidos</Badge>
          )}
        </div>
      </header>

      {/* Briefing Hero */}
      <section className="mb-6 animate-fade-up d2">
        <Card className="bg-gradient-to-br from-blue-soft to-green-soft border-blue-line">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blue flex items-center justify-center shrink-0">
              <span className="text-white text-xl">◎</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3">
                  Briefing do NOUS · hoje
                </span>
                <SourceBadge source="ai" />
              </div>
              <h2 className="text-[16px] font-semibold text-ink mb-2">
                {!healthScore 
                  ? 'Complete a configuração para receber insights' 
                  : 'Continue otimizando suas campanhas'}
              </h2>
              <p className="text-sm text-ink-2 line-clamp-2 mb-3">
                {healthScore 
                  ? 'Seu negócio tem score de ' + healthScore.score + '. Vamos trabalhar para melhorá-lo.' 
                  : 'Configure suas conexões com Meta e Google Ads para começar a receber insights personalizados.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => window.location.href = '/dashboard'}>
                  Ver dashboard
                </Button>
                <Button size="sm" variant="soft" onClick={() => window.location.href = '/dashboard?view=connections'}>
                  Conectar plataformas
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* KPIs Row */}
      <section className="mb-6 animate-fade-up d3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpis.map((kpi) => (
            <Card key={kpi.label} padding="sm" hover>
              <div className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3 mb-1">
                {kpi.label}
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[20px] font-bold font-mono text-ink" style={{ letterSpacing: '-0.02em' }}>
                  {kpi.value}
                </span>
                {kpi.trend !== 0 && (
                  <Delta value={kpi.trend} inverse={kpi.label === 'ROAS'} />
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-up d4">
        <div className="lg:col-span-2 space-y-4">
          {/* Health Card */}
          <Card>
            <SectionHead 
              title="Saúde do Negócio" 
              icon={<span className="text-lg">💚</span>}
              action={<SourceBadge source="ai" />}
            />
            {healthScore ? (
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--canvas-2)" strokeWidth="8" />
                    <circle 
                      cx="50" cy="50" r="40" fill="none" 
                      stroke={healthScore.score >= 70 ? '#0E9E6E' : healthScore.score >= 50 ? '#E08B0B' : '#E1483F'}
                      strokeWidth="8" 
                      strokeDasharray={`${Math.round(healthScore.score * 2.51)} 251`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold font-mono text-ink">{healthScore.score}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">{healthScore.grade}</p>
                  <p className="text-xs text-ink-3 mt-1">
                    Fonte: {healthScore.source === 'ai' ? 'NOUS' : 'Benchmark'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-ink-3">
                <p className="text-sm">Configure um cliente para calcular a saúde.</p>
                <Button variant="soft" size="sm" className="mt-3" onClick={() => window.location.href = '/dashboard?view=diagnostic'}>
                  Calcular saúde
                </Button>
              </div>
            )}
          </Card>

          {/* Priority Actions */}
          <Card>
            <SectionHead 
              title="Ações Prioritárias"
              icon={<span className="text-lg">🎯</span>}
            />
            {actions.length > 0 ? (
              <div className="space-y-3">
                {actions.slice(0, 5).map((action, i) => (
                  <div key={action.id || i} className="flex items-start gap-3 p-3 bg-canvas-2 rounded-sm">
                    <span className="w-6 h-6 rounded-full bg-blue text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-ink">{action.title}</div>
                      <div className="text-xs text-ink-3 mt-1 flex gap-2">
                        <Badge tone={action.urgency === 'critica' ? 'bad' : action.urgency === 'alta' ? 'warn' : 'neutral'} dot>
                          {action.urgency}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-ink-3">
                <p className="text-sm">Nenhuma ação pendiente.</p>
                <Button variant="ghost" size="sm" className="mt-3" onClick={() => window.location.href = '/dashboard?view=acoes'}>
                  Ver todas as ações
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Right column - Alerts */}
        <div className="space-y-4">
          <Card>
            <SectionHead title="Alertas" icon={<span className="text-lg">🔔</span>} />
            <div className="text-center py-6 text-ink-3">
              <p className="text-sm">Nenhum alerta no momento.</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
