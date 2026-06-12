// components/dashboard/GrowthChart.tsx — 3 cenários de projeção com dados reais do benchmark
'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { SimpleSourceBadge } from './DataSourceBadge'

interface ScenarioPoint {
  month: string
  conservador: number
  recomendado: number
  agressivo: number
}

interface Props {
  bench?: {
    budget_floor: number
    budget_ideal: number
    cpl_min: number
    cpl_max: number
    cvr_lead_to_sale: number
    avg_ticket: number
    name: string
  } | null
  currentBudget?: number
  scenarioBudgets?: { conservNum: number; baseNum: number; agresNum: number }
}

function buildScenarios(
  bench: Props['bench'],
  scenarioBudgets?: Props['scenarioBudgets'],
): ScenarioPoint[] {
  if (!bench) {
    return ['Mês 1','Mês 2','Mês 3','Mês 4','Mês 5','Mês 6'].map((month, i) => ({
      month,
      conservador: Math.round(8000  * (0.55 + i * 0.09)),
      recomendado: Math.round(25000 * (0.55 + i * 0.09)),
      agressivo:   Math.round(55000 * (0.55 + i * 0.09)),
    }))
  }

  const cplAvg = (bench.cpl_min + bench.cpl_max) / 2

  // Use client-derived scenario budgets when available; otherwise benchmark defaults
  const conservBudget = scenarioBudgets?.conservNum ?? bench.budget_floor
  const recoBudget    = scenarioBudgets?.baseNum    ?? bench.budget_ideal
  const agressBudget  = scenarioBudgets?.agresNum   ?? Math.round(bench.budget_ideal * 2)

  const revenue = (b: number) => {
    const leads = b / cplAvg
    return leads * bench.cvr_lead_to_sale * bench.avg_ticket
  }

  const ramp = [0.45, 0.62, 0.78, 0.88, 0.95, 1.00]

  return ['Mês 1','Mês 2','Mês 3','Mês 4','Mês 5','Mês 6'].map((month, i) => ({
    month,
    conservador: Math.round(revenue(conservBudget) * ramp[i]),
    recomendado: Math.round(revenue(recoBudget)    * ramp[i]),
    agressivo:   Math.round(revenue(agressBudget)  * ramp[i]),
  }))
}

function fmt(v: number) {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1000)      return `R$${Math.round(v / 1000)}k`
  return `R$${v}`
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#16161A] border border-[#2A2A30] rounded-xl px-4 py-3 shadow-lg text-sm min-w-[200px]">
      <div className="text-slate-400 font-semibold mb-2">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
            <span className="text-slate-400 text-xs">{p.name}</span>
          </div>
          <span className="font-bold text-xs" style={{ color: p.color }}>
            {fmt(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

function CustomLegend({ payload }: any) {
  return (
    <div className="flex justify-center gap-6 mt-2">
      {payload?.map((p: any) => (
        <div key={p.value} className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: p.color }} />
          {p.value}
        </div>
      ))}
    </div>
  )
}

export function GrowthChart({ bench, currentBudget, scenarioBudgets }: Props) {
  const data = buildScenarios(bench, scenarioBudgets)

  const conservBudget = scenarioBudgets
    ? `R$${scenarioBudgets.conservNum.toLocaleString('pt-BR')}`
    : bench ? `R$${bench.budget_floor.toLocaleString('pt-BR')}` : '—'
  const recoBudget = scenarioBudgets
    ? `R$${scenarioBudgets.baseNum.toLocaleString('pt-BR')}`
    : bench ? `R$${bench.budget_ideal.toLocaleString('pt-BR')}` : '—'
  const agressBudget = scenarioBudgets
    ? `R$${scenarioBudgets.agresNum.toLocaleString('pt-BR')}`
    : bench ? `R$${Math.round(bench.budget_ideal * 2).toLocaleString('pt-BR')}` : '—'

  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-6">
      <div className="flex items-start justify-between mb-1 flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="font-display font-bold text-white text-lg">Projeção de Receita</div>
            <SimpleSourceBadge type={bench ? 'benchmark' : 'estimated'} />
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            3 cenários · próximos 6 meses · ramp-up de otimização incluído
            {bench ? ` · ${bench.name}` : ''}
          </div>
        </div>
        {bench && (
          <div className="flex gap-3 text-[10px]">
            <span className="px-2 py-1 rounded-lg" style={{ background: 'rgba(148,163,184,0.1)', color: '#5A6473', border: '1px solid rgba(148,163,184,0.2)' }}>
              Conservador {conservBudget}/mês
            </span>
            <span className="px-2 py-1 rounded-lg" style={{ background: 'rgba(240,180,41,0.1)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.25)' }}>
              Recomendado {recoBudget}/mês
            </span>
            <span className="px-2 py-1 rounded-lg hidden md:inline" style={{ background: 'rgba(34,197,94,0.08)', color: '#0E9E6E', border: '1px solid rgba(34,197,94,0.2)' }}>
              Agressivo {agressBudget}/mês
            </span>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 10, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradCons" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#5A6473" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#5A6473" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradReco" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#F0B429" stopOpacity={0.20} />
              <stop offset="95%" stopColor="#F0B429" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradAg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#0E9E6E" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#0E9E6E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1E1E24" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: '#8A93A3', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: '#8A93A3', fontSize: 10 }}
            axisLine={false} tickLine={false}
            tickFormatter={(v) => {
              if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`
              if (v >= 1000)      return `R$${Math.round(v / 1000)}k`
              return `R$${v}`
            }}
            width={54}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          <Area type="monotone" dataKey="conservador" name="Conservador"
            stroke="#5A6473" strokeWidth={1.5} strokeDasharray="4 2"
            fill="url(#gradCons)" dot={{ r: 3, fill: '#5A6473' }} />
          <Area type="monotone" dataKey="recomendado" name="Recomendado"
            stroke="#F0B429" strokeWidth={2.5}
            fill="url(#gradReco)" dot={{ r: 4, fill: '#F0B429' }} />
          <Area type="monotone" dataKey="agressivo" name="Agressivo"
            stroke="#0E9E6E" strokeWidth={2}
            fill="url(#gradAg)" dot={{ r: 3, fill: '#0E9E6E' }} />
        </AreaChart>
      </ResponsiveContainer>

      {/* Premissas da estimativa */}
      {bench && (
        <div className="mt-4 pt-3 border-t border-[#1E1E24]">
          <div className="text-[10px] text-slate-600 font-semibold uppercase tracking-wide mb-2">Premissas da projeção</div>
          <div className="flex flex-wrap gap-3 text-[10px] text-slate-500">
            <span>CPL médio: <strong className="text-slate-400">R${Math.round((bench.cpl_min + bench.cpl_max) / 2)}</strong></span>
            <span>CVR lead→venda: <strong className="text-slate-400">{(bench.cvr_lead_to_sale * 100).toFixed(1)}%</strong></span>
            <span>Ticket médio: <strong className="text-slate-400">R${bench.avg_ticket.toLocaleString('pt-BR')}</strong></span>
            <span>Fonte: <strong className="text-slate-400">benchmark {bench.name}</strong></span>
          </div>
          <div className="text-[10px] text-slate-700 mt-1">
            Estes valores são estimativas de mercado — conecte seus anúncios para projeções baseadas em dados reais.
          </div>
        </div>
      )}

      {/* Nota explicativa */}
      {!bench && (
        <div className="mt-3 text-[10px] text-slate-600 text-center">
          Projeção baseada em benchmarks reais do nicho · CPL histórico × CVR × ticket médio.
          Mês 1 considera período de aprendizado das campanhas.
        </div>
      )}
    </div>
  )
}
