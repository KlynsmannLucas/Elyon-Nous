// app/mercado/page.tsx — Mercado (concorrentes, benchmarks, SOV)
'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, Badge, Button, SectionHead, SourceBadge } from '@/components/dashboard/v2'

function LoadingState() {
  return (
    <div className="min-h-screen bg-canvas p-4 md:p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-blue-soft flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-blue text-2xl">🌐</span>
        </div>
        <p className="text-ink-2">Carregando...</p>
      </div>
    </div>
  )
}

export default function MercadoPage() {
  const clientData = useAppStore(s => s.clientData)
  const savedClients = useAppStore(s => s.savedClients)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <LoadingState />

  const activeClient = clientData?.clientName || savedClients?.[0]?.clientName

  // Mock data
  const marketIndex = { value: 72, trend: 5 }
  const benchmarks = { yourROAS: 3.2, marketROAS: 2.8, delta: '+14%' }
  const sov = [
    { name: 'Seu品牌的', share: 28, isYou: true },
    { name: 'Concorrente A', share: 22, isYou: false },
    { name: 'Concorrente B', share: 18, isYou: false },
    { name: 'Outros', share: 32, isYou: false },
  ]
  const opportunities = [
    { segment: 'E-commerce B2C', growth: 45, cpl: 28, ease: 8 },
    { segment: 'Serviços B2B', growth: 32, cpl: 45, ease: 6 },
    { segment: 'Educação', growth: 28, cpl: 35, ease: 7 },
  ]

  return (
    <div className="min-h-screen bg-canvas p-4 md:p-6">
      <header className="mb-6 animate-fade-up">
        <h1 className="text-[23px] font-bold text-ink">Mercado</h1>
        <p className="text-sm text-ink-2 mt-1">{activeClient || 'Selecione um cliente'}</p>
      </header>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-fade-up d2">
        <Card>
          <div className="text-[10.5px] font-mono uppercase text-ink-3 mb-1">Demanda do Mercado</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-ink">{marketIndex.value}</span>
            <Badge tone={marketIndex.trend > 0 ? 'good' : 'bad'}>{marketIndex.trend > 0 ? '↑' : '↓'}{Math.abs(marketIndex.trend)}%</Badge>
          </div>
          <p className="text-xs text-ink-3 mt-1">Índice vs. 30 dias</p>
        </Card>
        <Card>
          <div className="text-[10.5px] font-mono uppercase text-ink-3 mb-1">Seu ROAS</div>
          <span className="text-2xl font-bold font-mono text-green">{benchmarks.yourROAS}x</span>
          <p className="text-xs text-ink-3 mt-1">vs. mercado {benchmarks.marketROAS}x</p>
        </Card>
        <Card>
          <div className="text-[10.5px] font-mono uppercase text-ink-3 mb-1">Delta</div>
          <span className="text-2xl font-bold font-mono text-blue">{benchmarks.delta}</span>
          <p className="text-xs text-ink-3 mt-1">Acima da média</p>
        </Card>
      </div>

      {/* Share of Voice */}
      <Card className="mb-6 animate-fade-up d3">
        <SectionHead title="Share of Voice" icon={<span>📊</span>} action={<SourceBadge source="estimate" />} />
        <div className="space-y-3 mt-3">
          {sov.map((item, i) => (
            <div key={item.name} className="flex items-center gap-3">
              <div className="w-24 text-sm text-ink">
                {item.isYou && <Badge tone="blue" dot>{item.name}</Badge>}
                {!item.isYou && item.name}
              </div>
              <div className="flex-1 h-6 bg-canvas-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${item.isYou ? 'bg-blue' : 'bg-slate'}`}
                  style={{ width: item.share + '%' }}
                />
              </div>
              <div className="w-12 text-sm font-mono text-ink text-right">{item.share}%</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Oportunidades */}
      <Card className="animate-fade-up d4">
        <SectionHead title="Oportunidades" icon={<span>💡</span>} action={<SourceBadge source="estimate" />} />
        <div className="space-y-3 mt-3">
          {opportunities.map((opp, i) => (
            <div key={opp.segment} className="flex items-center justify-between p-3 bg-canvas-2 rounded-sm">
              <div>
                <div className="text-sm font-medium text-ink">{opp.segment}</div>
                <div className="text-xs text-ink-3">
                  CPL: R$ {opp.cpl} · Facilidade: {opp.ease}/10
                </div>
              </div>
              <Badge tone={opp.growth > 30 ? 'good' : opp.growth > 20 ? 'warn' : 'neutral'}>
                +{opp.growth}%
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
