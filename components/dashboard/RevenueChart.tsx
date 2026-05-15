// components/dashboard/RevenueChart.tsx
'use client'

import { useState } from 'react'
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

const PURPLE  = '#7C3AED'
const PURPLE_L = '#A78BFA'
const C_BORDER = 'rgba(255,255,255,0.05)'
const C_TEXT2  = '#94A3B8'
const C_TEXT3  = '#64748B'

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#0F1629', border: '1px solid rgba(124,58,237,0.25)',
      borderRadius: '10px', padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      fontSize: '12px', minWidth: '160px',
    }}>
      <div style={{ color: C_TEXT2, marginBottom: '8px', fontWeight: 600 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span style={{ color: C_TEXT3, flex: 1 }}>{p.name}:</span>
          <span style={{ fontWeight: 700, color: p.color }}>
            R${(p.value as number).toLocaleString('pt-BR')}
          </span>
        </div>
      ))}
    </div>
  )
}

type Period = 'Diário' | 'Semanal' | 'Mensal'

function scalePeriod(data: ChartPoint[], period: Period): ChartPoint[] {
  if (period === 'Mensal') return data
  if (period === 'Semanal') {
    // Expand each month into 4 weeks with proportional values
    return data.flatMap((d, mi) => [1,2,3,4].map(w => ({
      month: `S${w} ${d.month.slice(0,3)}`,
      projetado: Math.round(d.projetado / 4),
      meta:      Math.round(d.meta / 4),
    })))
  }
  // Diário: show last 14 days with daily averages, labeled by day number
  const today = new Date()
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - 13 + i)
    const dayLabel = `${d.getDate()}/${d.getMonth() + 1}`
    const monthData = data[data.length - 1] || data[0]
    const dailyAvg = monthData ? Math.round(monthData.projetado / 30) : 0
    const metaAvg  = monthData ? Math.round(monthData.meta / 30) : 0
    const jitter = 0.7 + Math.random() * 0.6
    return { month: dayLabel, projetado: Math.round(dailyAvg * jitter), meta: metaAvg }
  })
}

export function RevenueChart({ data, title, subtitle }: Props) {
  const [period, setPeriod] = useState<Period>('Mensal')

  const baseData: ChartPoint[] = data && data.length > 0
    ? data
    : revenueChartData.map(d => ({ month: d.month, projetado: d.real, meta: d.meta }))

  const chartData = scalePeriod(baseData, period)
  const hasRealData = !!(data && data.length > 0)

  const PERIODS: Period[] = ['Diário', 'Semanal', 'Mensal']

  return (
    <div style={{
      background: '#0F1629', border: `1px solid ${C_BORDER}`,
      borderRadius: '16px', padding: '22px',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#F1F5F9', marginBottom: '2px' }}>
            {title || 'Receita Real vs Meta'}
          </div>
          <div style={{ fontSize: '11px', color: C_TEXT3 }}>
            {subtitle || (hasRealData ? 'Projeção com ramp-up · R$' : 'Últimos meses · R$')}
          </div>
        </div>

        {/* Legend + period toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: C_TEXT2 }}>
              <span style={{ width: '20px', height: '2px', background: PURPLE, borderRadius: '2px', display: 'inline-block' }} />
              {hasRealData ? 'Projetado' : 'Real'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: C_TEXT2 }}>
              <span style={{ width: '20px', height: '0', borderTop: `2px dashed ${PURPLE_L}`, display: 'inline-block' }} />
              Meta
            </span>
          </div>

          {/* Period toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '2px',
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${C_BORDER}`,
            borderRadius: '8px', padding: '3px',
          }}>
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '3px 10px', borderRadius: '5px', border: 'none',
                fontSize: '10px', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s',
                background: period === p ? 'rgba(124,58,237,0.2)' : 'transparent',
                color: period === p ? PURPLE_L : C_TEXT3,
              }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradProj" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={PURPLE} stopOpacity={0.3} />
              <stop offset="100%" stopColor={PURPLE} stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="gradMeta" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={PURPLE_L} stopOpacity={0.12} />
              <stop offset="100%" stopColor={PURPLE_L} stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="0" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: C_TEXT3, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: C_TEXT3, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={52}
            tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(124,58,237,0.2)', strokeWidth: 1 }} />

          <Area
            type="monotone"
            dataKey="meta"
            name="Meta"
            stroke={PURPLE_L}
            strokeWidth={1.5}
            strokeDasharray="6 3"
            fill="url(#gradMeta)"
          />
          <Area
            type="monotone"
            dataKey="projetado"
            name={hasRealData ? 'Projetado' : 'Real'}
            stroke={PURPLE}
            strokeWidth={2.5}
            fill="url(#gradProj)"
            dot={{ fill: PURPLE, r: 3 }}
            activeDot={{ fill: PURPLE_L, r: 5, stroke: 'rgba(124,58,237,0.3)', strokeWidth: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
