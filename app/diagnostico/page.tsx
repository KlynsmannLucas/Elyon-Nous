// app/diagnostico/page.tsx — Diagnóstico (audit, radar, gargalo, SWOT)
'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, Badge, Button, SectionHead, Delta, SourceBadge } from '@/components/dashboard/v2'

function LoadingState() {
  return (
    <div className="min-h-screen bg-canvas p-4 md:p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-blue-soft flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-blue text-2xl">🔬</span>
        </div>
        <p className="text-ink-2">Carregando...</p>
      </div>
    </div>
  )
}

type SubTab = 'visao' | 'auditoria'

export default function DiagnosticoPage() {
  const clientData = useAppStore(s => s.clientData)
  const savedClients = useAppStore(s => s.savedClients)
  const auditCache = useAppStore(s => s.auditCache)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<SubTab>('visao')

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <LoadingState />

  const activeClient = clientData?.clientName || savedClients?.[0]?.clientName
  const audits = activeClient ? auditCache[activeClient] || [] : []
  const latestAudit = audits[0]

  const tabs: { key: SubTab; label: string }[] = [
    { key: 'visao', label: 'Visão Geral' },
    { key: 'auditoria', label: 'Auditoria Profunda' },
  ]

  // Mock radar data
  const pillars = [
    { name: 'Estratégia', value: 72, benchmark: 75 },
    { name: 'Criativos', value: 65, benchmark: 70 },
    { name: 'Segmentação', value: 78, benchmark: 65 },
    { name: 'Landing', value: 55, benchmark: 70 },
    { name: 'Tracking', value: 82, benchmark: 80 },
    { name: 'Conversion', value: 68, benchmark: 65 },
  ]

  return (
    <div className="min-h-screen bg-canvas p-4 md:p-6">
      <header className="mb-6 animate-fade-up">
        <h1 className="text-[23px] font-bold text-ink">Diagnóstico</h1>
        <p className="text-sm text-ink-2 mt-1">{activeClient || 'Selecione um cliente'}</p>
      </header>

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

      {activeTab === 'visao' && (
        <div className="space-y-4 animate-fade-up">
          {/* Radar de Maturidade */}
          <Card>
            <SectionHead 
              title="Maturidade por Pilar" 
              subtitle="Você vs. Benchmark"
              icon={<span>📊</span>}
              action={<SourceBadge source="benchmark" />}
            />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {pillars.map(p => (
                <div key={p.name} className="text-center">
                  <div className="relative w-20 h-20 mx-auto">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="var(--canvas-2)" strokeWidth="10" />
                      <circle 
                        cx="50" cy="50" r="40" fill="none" 
                        stroke={p.value >= p.benchmark ? '#0E9E6E' : '#E08B0B'}
                        strokeWidth="10" 
                        strokeDasharray={`${p.value * 2.51} 251`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold font-mono text-ink">{p.value}</span>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-ink mt-2">{p.name}</div>
                  <div className="text-[10px] text-ink-3">vs {p.benchmark}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* SWOT */}
          <Card>
            <SectionHead title="SWOT" icon={<span>🎯</span>} />
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-3 bg-green-soft rounded-sm">
                <div className="text-xs font-semibold text-green mb-1">FORÇAS</div>
                <div className="text-xs text-ink-2">- boa segmentação</div>
                <div className="text-xs text-ink-2">- tracking configurado</div>
              </div>
              <div className="p-3 bg-red-soft rounded-sm">
                <div className="text-xs font-semibold text-red mb-1">FRAQUEZAS</div>
                <div className="text-xs text-ink-2">- landing page fraca</div>
                <div className="text-xs text-ink-2">- poucos criativos</div>
              </div>
              <div className="p-3 bg-blue-soft rounded-sm">
                <div className="text-xs font-semibold text-blue mb-1">OPORTUNIDADES</div>
                <div className="text-xs text-ink-2">-Expandir para Google</div>
                <div className="text-xs text-ink-2">-Novos nichos</div>
              </div>
              <div className="p-3 bg-amber-soft rounded-sm">
                <div className="text-xs font-semibold text-amber mb-1">AMEAÇAS</div>
                <div className="text-xs text-ink-2">-Concorrentes subiram</div>
                <div className="text-xs text-ink-2">-Custo por clique</div>
              </div>
            </div>
          </Card>

          {/* NOUS Banner */}
          <Card className="bg-gradient-to-br from-blue-soft to-green-soft border-blue-line">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue flex items-center justify-center shrink-0">
                <span className="text-white text-lg">◎</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-ink mb-1">Hipótese do NOUS</div>
                <p className="text-sm text-ink-2">
                  Seu maior gargalo é a conversão na landing page. 
                  Recomendo A/B test com nova versão em 48h.
                </p>
                <Button size="sm" className="mt-3">Ver plano recomendado</Button>
              </div>
            </div>
          </Card>
        </div>
      )}


      {activeTab === 'auditoria' && (
        <Card className="animate-fade-up">
          <SectionHead title="Auditoria Profunda" icon={<span>🔍</span>} />
          <p className="text-sm text-ink-2 mt-3">
            Auditoria em 11 dimensões._complete o diagnóstico abaixo.
          </p>
          <div className="mt-4 space-y-3">
            {['Pixel', 'API', 'CAPI', 'Conversões', ' audiencias', 'Criativos', ' copy', 'Landing', 'Ofertas', 'Segmentação', 'Budget'].map(dim => (
              <div key={dim} className="flex items-center justify-between p-3 bg-canvas-2 rounded-sm">
                <span className="text-sm text-ink">{dim}</span>
                <Badge tone="neutral">Pendente</Badge>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Button onClick={() => window.location.href = '/dashboard?view=audit'}>
              Iniciar Auditoria
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
