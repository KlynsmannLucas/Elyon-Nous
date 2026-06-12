// app/plano/page.tsx — Plano de Ação (kanban, estratégia, roadmap)
'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, Badge, Button, SectionHead, Delta, SourceBadge } from '@/components/dashboard/v2'

function LoadingState() {
  return (
    <div className="min-h-screen bg-canvas p-4 md:p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-blue-soft flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-blue text-2xl">✅</span>
        </div>
        <p className="text-ink-2">Carregando...</p>
      </div>
    </div>
  )
}

type SubTab = 'execucao' | 'estrategia'

export default function PlanoPage() {
  const clientData = useAppStore(s => s.clientData)
  const savedClients = useAppStore(s => s.savedClients)
  const pendingActionsCache = useAppStore(s => s.pendingActionsCache)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<SubTab>('execucao')

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <LoadingState />

  const activeClient = clientData?.clientName || savedClients?.[0]?.clientName
  const actions = activeClient ? pendingActionsCache[activeClient] || [] : []

  const tabs: { key: SubTab; label: string }[] = [
    { key: 'execucao', label: 'Execução' },
    { key: 'estrategia', label: 'Estratégia 90 dias' },
  ]

  // Kanban mock
  const planned = actions.filter(a => a.status === 'pendente')
  const inProgress = actions.filter(a => a.status === 'em_andamento')
  const completed = actions.filter(a => a.status === 'concluida')

  // Mock totals
  const totalPlanned = planned.length || 3
  const totalInProgress = inProgress.length || 1
  const totalCompleted = completed.length || 5
  const impactTotal = 8500

  return (
    <div className="min-h-screen bg-canvas p-4 md:p-6">
      <header className="mb-6 animate-fade-up">
        <h1 className="text-[23px] font-bold text-ink">Plano de Ação</h1>
        <p className="text-sm text-ink-2 mt-1">{activeClient || 'Selecione um cliente'}</p>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 animate-fade-up d2">
        <Card padding="sm">
          <div className="text-[10.5px] font-mono uppercase text-ink-3">Planejadas</div>
          <div className="text-xl font-bold font-mono text-ink">{totalPlanned}</div>
        </Card>
        <Card padding="sm">
          <div className="text-[10.5px] font-mono uppercase text-ink-3">Em Andamento</div>
          <div className="text-xl font-bold font-mono text-blue">{totalInProgress}</div>
        </Card>
        <Card padding="sm">
          <div className="text-[10.5px] font-mono uppercase text-ink-3">Concluídas</div>
          <div className="text-xl font-bold font-mono text-green">{totalCompleted}</div>
        </Card>
        <Card padding="sm">
          <div className="text-[10.5px] font-mono uppercase text-ink-3">Impacto</div>
          <div className="text-xl font-bold font-mono text-green">R$ {impactTotal}</div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-line">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.key ? 'text-blue border-blue' : 'text-ink-3 border-transparent hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'execucao' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-up d3">
          {/* Kanban Columns */}
          <Card>
            <SectionHead title="Planejado" icon={<span>📋</span>} />
            <div className="space-y-2 mt-3">
              <div className="p-3 bg-canvas-2 rounded-sm">
                <div className="text-sm text-ink">Aumentar orçamento em 15%</div>
                <div className="text-xs text-ink-3 mt-1">Impacto: R$ 4.200</div>
              </div>
              <div className="p-3 bg-canvas-2 rounded-sm">
                <div className="text-sm text-ink">Testar novo creativo</div>
                <div className="text-xs text-ink-3 mt-1">Impacto: R$ 2.500</div>
              </div>
              <div className="p-3 bg-canvas-2 rounded-sm">
                <div className="text-sm text-ink">Revisar copy Remarketing</div>
                <div className="text-xs text-ink-3 mt-1">Impacto: R$ 1.800</div>
              </div>
            </div>
          </Card>
          <Card>
            <SectionHead title="Em Andamento" icon={<span>🔄</span>} />
            <div className="space-y-2 mt-3">
              <div className="p-3 bg-blue-soft rounded-sm">
                <div className="text-sm text-ink">Configurar pixel CAPI</div>
                <Badge tone="warn" className="mt-1">Em progresso</Badge>
              </div>
            </div>
          </Card>
          <Card>
            <SectionHead title="Concluído" icon={<span>✓</span>} />
            <div className="space-y-2 mt-3">
              <div className="p-3 bg-green-soft rounded-sm">
                <div className="text-sm text-ink">Auditoria inicial</div>
                <Badge tone="good" className="mt-1">Concluído</Badge>
              </div>
              <div className="p-3 bg-green-soft rounded-sm">
                <div className="text-sm text-ink">Conectar Meta Ads</div>
                <Badge tone="good" className="mt-1">Concluído</Badge>
              </div>
            </div>
          </Card>
        </div>
      )}


      {activeTab === 'estrategia' && (
        <div className="space-y-4 animate-fade-up d3">
          {/* Matriz Impacto × Esforço */}
          <Card>
            <SectionHead title="Matriz Impacto × Esforço" icon={<span>🎯</span>} />
            <div className="mt-4 p-8 bg-canvas-2 rounded-sm text-center text-ink-3">
              Gráfico de dispersão: Quadrante superior direito = Ganhos rápidos
            </div>
          </Card>

          {/* Roadmap */}
          <Card>
            <SectionHead title="Roadmap 90 dias" icon={<span>📅</span>} />
            <div className="grid grid-cols-3 gap-4 mt-3">
              <div>
                <div className="text-xs font-semibold text-ink-3 mb-2">Julho</div>
                <div className="space-y-2">
                  <div className="p-2 bg-blue-soft rounded-sm text-xs text-blue">Audit setup</div>
                  <div className="p-2 bg-blue-soft rounded-sm text-xs text-blue">Conexões</div>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-ink-3 mb-2">Agosto</div>
                <div className="space-y-2">
                  <div className="p-2 bg-green-soft rounded-sm text-xs text-green">A/B测试</div>
                  <div className="p-2 bg-amber-soft rounded-sm text-xs text-amber">Otimização</div>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-ink-3 mb-2">Setembro</div>
                <div className="space-y-2">
                  <div className="p-2 bg-canvas-2 rounded-sm text-xs text-ink">Escala</div>
                  <div className="p-2 bg-canvas-2 rounded-sm text-xs text-ink">Nova campaña</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
