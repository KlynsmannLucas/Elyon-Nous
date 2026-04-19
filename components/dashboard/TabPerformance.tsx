// components/dashboard/TabPerformance.tsx — Performance e criativos por nicho
'use client'

import { StatCard } from './StatCard'
import { getNicheContent } from '@/lib/niche_content'
import { getBenchmark, computeNicheProjection } from '@/lib/niche_benchmarks'
import { useAppStore } from '@/lib/store'
import type { ClientData } from '@/lib/store'

interface Props {
  clientData: ClientData | null
}

// ── Gráfico de linha SVG (sem dependência externa) ───────────────────────────
function TrendChart({ points, color, label, format }: {
  points: { x: string; y: number }[]
  color: string
  label: string
  format: (v: number) => string
}) {
  if (points.length < 2) return null
  const W = 100, H = 50, PAD = 4
  const ys = points.map(p => p.y)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const rangeY = maxY - minY || 1
  const toX = (i: number) => PAD + (i / (points.length - 1)) * (W - PAD * 2)
  const toY = (v: number) => PAD + (1 - (v - minY) / rangeY) * (H - PAD * 2)
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(p.y).toFixed(1)}`).join(' ')
  const last = points[points.length - 1]
  const prev = points[points.length - 2]
  const delta = last.y - prev.y
  const deltaColor = label === 'CPL' ? (delta <= 0 ? '#22C55E' : '#FF4D4D') : (delta >= 0 ? '#22C55E' : '#FF4D4D')

  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
          <div className="font-display text-2xl font-bold mt-0.5" style={{ color }}>{format(last.y)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold" style={{ color: deltaColor }}>
            {delta > 0 ? '▲' : '▼'} {format(Math.abs(delta))}
          </div>
          <div className="text-[10px] text-slate-600 mt-0.5">vs mês anterior</div>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 64 }}>
        {/* área preenchida */}
        <path
          d={`${d} L${toX(points.length - 1).toFixed(1)},${(H - PAD).toFixed(1)} L${PAD},${(H - PAD).toFixed(1)} Z`}
          fill={color}
          opacity={0.06}
        />
        {/* linha */}
        <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* pontos */}
        {points.map((p, i) => (
          <circle key={i} cx={toX(i)} cy={toY(p.y)} r="1.8" fill={color} />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        {[points[0], points[points.length - 1]].map((p, i) => (
          <span key={i} className="text-[10px] text-slate-600">{p.x}</span>
        ))}
      </div>
    </div>
  )
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

  // Tendência histórica a partir do campaignHistory do store
  const campaignHistory = useAppStore(s => s.campaignHistory)
  const clientHistory = campaignHistory.filter(c => c.channel && clientData?.clientName
    ? campaignHistory.some(r => r.channel) // só filtra por cliente se tiver clientName no record
    : true
  )

  // Agrupa por período (ordena cronologicamente)
  const byPeriod: Record<string, { spend: number; leads: number; revenue: number; count: number }> = {}
  for (const r of clientHistory) {
    if (!byPeriod[r.period]) byPeriod[r.period] = { spend: 0, leads: 0, revenue: 0, count: 0 }
    byPeriod[r.period].spend   += r.budgetSpent
    byPeriod[r.period].leads   += r.leads
    byPeriod[r.period].revenue += r.revenue
    byPeriod[r.period].count   += 1
  }
  const periods = Object.keys(byPeriod).sort()
  const cplPoints  = periods.map(x => ({ x, y: byPeriod[x].leads > 0 ? Math.round(byPeriod[x].spend / byPeriod[x].leads) : 0 }))
  const roasPoints = periods.map(x => ({ x, y: byPeriod[x].spend > 0 ? +((byPeriod[x].revenue / byPeriod[x].spend).toFixed(1)) : 0 }))
  const hasTrend   = periods.length >= 2

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

      {/* Tendência histórica */}
      {hasTrend ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📈</span>
            <div className="font-display font-bold text-white">Tendência Histórica</div>
            <span className="text-[10px] text-slate-600 ml-1">{periods.length} períodos · baseado no histórico de campanhas</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <TrendChart
              points={cplPoints}
              color="#F0B429"
              label="CPL Médio"
              format={v => `R$${v}`}
            />
            <TrendChart
              points={roasPoints}
              color="#22C55E"
              label="ROAS"
              format={v => `${v}×`}
            />
          </div>
        </div>
      ) : (
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5 text-center">
          <div className="text-3xl mb-2 opacity-20">📈</div>
          <div className="text-sm font-semibold text-white mb-1">Sem histórico suficiente</div>
          <p className="text-xs text-slate-500">
            Adicione pelo menos 2 períodos no <strong className="text-slate-400">Histórico de Campanhas</strong> para ver a tendência de CPL e ROAS.
          </p>
        </div>
      )}

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
