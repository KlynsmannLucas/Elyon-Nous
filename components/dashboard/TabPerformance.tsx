// components/dashboard/TabPerformance.tsx — Performance e criativos por nicho
'use client'

import { StatCard } from './StatCard'
import { getNicheContent } from '@/lib/niche_content'
import { getBenchmark, computeNicheProjection } from '@/lib/niche_benchmarks'
import type { ClientData } from '@/lib/store'

interface Props {
  clientData: ClientData | null
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? '#22C55E' : score >= 60 ? '#F0B429' : '#FF4D4D'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-[#1E1E24] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-bold w-8 text-right" style={{ color }}>{score}</span>
    </div>
  )
}

export function TabPerformance({ clientData }: Props) {
  const niche  = clientData?.niche || ''
  const budget = clientData?.budget || 0
  const bench  = getBenchmark(niche)
  const proj   = bench && budget > 0 ? computeNicheProjection(bench, budget) : null
  const content = getNicheContent(niche)

  const stats = proj
    ? [
        { label: 'Impressões est.',  value: `${Math.round(proj.leadsMonth * 150 / 1000)}K`, sub: 'projeção mensal',   color: '#F0B429' },
        { label: 'CTR estimado',     value: `3.0%`,                                         sub: 'benchmark do nicho', color: '#22C55E' },
        { label: 'Leads / mês',      value: `${proj.leadsMin}–${proj.leadsMax}`,             sub: 'faixa estimada',    color: '#A78BFA' },
        { label: 'Investimento',     value: `R$${budget.toLocaleString('pt-BR')}`,           sub: 'budget configurado', color: '#38BDF8' },
      ]
    : [
        { label: 'Impressões',  value: '142K',    sub: 'últimos 30 dias', color: '#F0B429' },
        { label: 'CTR',         value: '5.98%',   sub: 'acima da média',  color: '#22C55E' },
        { label: 'Leads',       value: '340',     sub: 'mês corrente',    color: '#A78BFA' },
        { label: 'Gasto total', value: 'R$9.200', sub: 'budget mensal',   color: '#38BDF8' },
      ]

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} color={s.color} delay={i * 0.08} />
        ))}
      </div>

      {/* Tabela de criativos */}
      <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2A2A30]">
          <h3 className="font-display font-bold text-white">Criativos em Análise</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Score IA baseado em CTR, CPL e taxa de conversão · {niche || 'Nicho geral'}
          </p>
        </div>

        <div className="grid grid-cols-12 px-6 py-3 text-xs text-slate-500 uppercase tracking-wider border-b border-[#1E1E24]">
          <span className="col-span-5">Criativo</span>
          <span className="col-span-2">Canal</span>
          <span className="col-span-3">Score IA</span>
          <span className="col-span-2">Status</span>
        </div>

        {content.creatives.map((c, i) => (
          <div
            key={c.name}
            className="grid grid-cols-12 px-6 py-4 items-center border-b border-[#1E1E24] last:border-0 hover:bg-[#16161A] transition-colors animate-fade-up"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div className="col-span-5">
              <span className="text-sm text-white font-medium leading-tight">{c.name}</span>
            </div>
            <div className="col-span-2">
              <span className="text-xs text-slate-500">{c.channel}</span>
            </div>
            <div className="col-span-3">
              <ScoreBar score={c.score} />
            </div>
            <div className="col-span-2">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ color: c.statusColor, background: `${c.statusColor}18` }}
              >
                {c.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Dicas de criativos por nicho */}
      {bench && (
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
          <div className="font-display font-bold text-white mb-3">🎨 Referências de CPL por canal · {niche}</div>
          <div className="grid md:grid-cols-2 gap-3">
            {Object.entries(bench.cpl_by_channel).map(([canal, cpl]) => (
              <div key={canal} className="flex items-center justify-between p-3 bg-[#16161A] rounded-xl">
                <span className="text-sm text-slate-300">{canal}</span>
                <span className="text-sm font-bold text-[#F0B429]">{cpl}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
