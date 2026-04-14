// components/dashboard/TabAudiences.tsx — Perfil de audiência por nicho
'use client'

import { getBenchmark } from '@/lib/niche_benchmarks'
import { getNicheContent } from '@/lib/niche_content'

interface Props {
  niche?: string
}

function QuadrantCard({ title, items, borderColor, icon }: {
  title: string; items: string[]; borderColor: string; icon: string
}) {
  return (
    <div className="bg-[#111114] rounded-2xl p-5" style={{ border: `1px solid ${borderColor}` }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{icon}</span>
        <span className="font-display font-bold text-white text-sm">{title}</span>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: borderColor }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function TabAudiences({ niche }: Props) {
  const bench   = niche ? getBenchmark(niche) : null
  const content = getNicheContent(niche || '')
  const aud     = content.audience

  const profileMetrics = [
    { label: 'Idade',              value: aud.age,      icon: '👤' },
    { label: 'Gênero',            value: aud.gender,   icon: '⚤'  },
    { label: 'Renda',             value: aud.income,   icon: '💰' },
    { label: 'Localização',       value: aud.location, icon: '📍' },
    { label: 'Tempo até comprar', value: aud.buyTime,  icon: '⏱' },
    { label: 'ROAS benchmark',    value: bench ? `${bench.kpi_thresholds.roas_good}× (nicho)` : '—', icon: '⚡' },
    { label: 'CPL benchmark',     value: bench ? `R$${bench.cpl_min}–${bench.cpl_max}` : '—', icon: '🎯' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-1 h-10 rounded-full" style={{ background: 'linear-gradient(to bottom, #F0B429, #FFD166)' }} />
        <div>
          <h2 className="font-display font-bold text-white text-xl">Perfil de Audiência Validado</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dados reais de campanhas no nicho · {niche || 'Configure o cliente para ver dados do nicho'}
          </p>
        </div>
      </div>

      {/* Benchmark do nicho */}
      {bench && (
        <div className="rounded-2xl p-5" style={{
          background: 'rgba(240,180,41,0.05)',
          border: '1px solid rgba(240,180,41,0.2)',
        }}>
          <div className="text-xs text-[#F0B429] font-semibold uppercase tracking-widest mb-4">
            📊 Dados de Mercado — {bench.name}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="font-display text-lg font-bold text-[#F0B429]">R${bench.cpl_min}–{bench.cpl_max}</div>
              <div className="text-xs text-slate-500 mt-0.5">CPL médio do nicho</div>
            </div>
            <div className="text-center">
              <div className="font-display text-lg font-bold text-[#22C55E]">{bench.kpi_thresholds.roas_good}×</div>
              <div className="text-xs text-slate-500 mt-0.5">ROAS bom</div>
            </div>
            <div className="text-center">
              <div className="font-display text-lg font-bold text-[#A78BFA]">
                {(bench.cvr_lead_to_sale * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-slate-500 mt-0.5">CVR lead→venda</div>
            </div>
            <div className="text-center">
              <div className="font-display text-lg font-bold text-[#38BDF8]">
                R${bench.budget_floor.toLocaleString('pt-BR')}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Budget mínimo</div>
            </div>
          </div>

          {bench.best_channels?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[rgba(240,180,41,0.15)]">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Melhores canais para o nicho</div>
              <div className="flex flex-wrap gap-2">
                {bench.best_channels.map((ch) => (
                  <span key={ch} className="text-xs px-3 py-1 rounded-full font-medium"
                    style={{ background: 'rgba(240,180,41,0.1)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.3)' }}>
                    {ch}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7 métricas de perfil */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {profileMetrics.map((m, i) => (
          <div
            key={m.label}
            className="bg-[#111114] border border-[#2A2A30] rounded-xl p-4 animate-fade-up"
            style={{ animationDelay: `${i * 0.07}s` }}
          >
            <div className="text-xl mb-2">{m.icon}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{m.label}</div>
            <div className="font-display font-bold text-[#F0B429] text-sm">{m.value}</div>
          </div>
        ))}
      </div>

      {/* Grid 2×2 de quadrantes — dados do nicho real */}
      <div className="grid md:grid-cols-2 gap-4">
        <QuadrantCard title="Dores" items={aud.pains}
          borderColor="rgba(255,77,77,0.4)" icon="💢" />
        <QuadrantCard title="Por que compram" items={aud.motivations}
          borderColor="rgba(34,197,94,0.4)" icon="✅" />
        <QuadrantCard title="Hooks que convertem" items={aud.hooks}
          borderColor="rgba(240,180,41,0.4)" icon="🪝" />
        <QuadrantCard title="Objeções comuns" items={aud.objections}
          borderColor="rgba(245,158,11,0.4)" icon="🚧" />
      </div>

      {/* Insights do nicho */}
      {bench?.insights && (
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
          <div className="font-display font-bold text-white mb-3">💡 Insights do Mercado</div>
          <div className="space-y-2">
            {bench.insights.map((ins, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-400">
                <span className="text-[#F0B429] mt-0.5">→</span>
                {ins}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
