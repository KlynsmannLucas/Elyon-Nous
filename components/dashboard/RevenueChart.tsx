// components/dashboard/RevenueChart.tsx — Gráfico de projeção de receita
'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { revenueChartData } from '@/lib/mockData'

interface ChartPoint {
  month: string
  projetado: number
  meta: number
}

interface Props {
  data?: ChartPoint[]
  title?: string
  subtitle?: string
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#16161A] border border-[#2A2A30] rounded-xl px-4 py-3 shadow-card text-sm">
      <div className="text-slate-400 mb-2 font-semibold">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-bold" style={{ color: p.color }}>
            R${p.value.toLocaleString('pt-BR')}
          </span>
        </div>
      ))}
    </div>
  )
}

export function RevenueChart({ data, title, subtitle }: Props) {
  // Se não passou dados reais, usa mock
  const chartData: ChartPoint[] = data && data.length > 0
    ? data
    : revenueChartData.map((d) => ({ month: d.month, projetado: d.real, meta: d.meta }))

  const hasRealData = !!(data && data.length > 0)

  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-6 animate-fade-up delay-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="font-display font-bold text-white text-lg">
            {title || 'Receita Real vs Meta'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {subtitle || (hasRealData ? 'Projeção 6 meses com ramp-up · R$' : 'Últimos 7 meses · R$')}
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-3 h-0.5 bg-[#F0B429] rounded-full inline-block" />
            {hasRealData ? 'Projetado' : 'Real'}
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-3 h-0.5 bg-[#A78BFA] rounded-full inline-block" style={{ borderTop: '2px dashed #A78BFA' }} />
            Meta
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradReal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#F0B429" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#F0B429" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="gradMeta" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#A78BFA" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#1E1E24" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: '#64748B', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748B', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="meta"
            name="Meta"
            stroke="#A78BFA"
            strokeWidth={1.5}
            strokeDasharray="6 3"
            fill="url(#gradMeta)"
          />
          <Area
            type="monotone"
            dataKey="projetado"
            name={hasRealData ? 'Projetado' : 'Real'}
            stroke="#F0B429"
            strokeWidth={2.5}
            fill="url(#gradReal)"
            dot={{ fill: '#F0B429', r: 3 }}
            activeDot={{ fill: '#FFD166', r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
