// components/dashboard/StatCard.tsx
// Redesign v2 — "terminal de dados premium" (light theme)
'use client'

import { useViewMode, getMetricLabel } from '@/lib/viewMode'

interface StatCardProps {
  label: string
  value: string
  trend?: number
  sub?: string
  color?: string
  delay?: number
  sparkline?: number[]
  icon?: string
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const W = 80, H = 28
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - ((v - min) / range) * (H - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg width={W} height={H} style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id={`sc-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${H} ${pts} ${W},${H}`} fill={`url(#sc-${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function StatCard({ label, value, trend, sub, color = '#2C5FE0', delay = 0, sparkline, icon }: StatCardProps) {
  const { mode } = useViewMode()
  const displayLabel = getMetricLabel(label, mode)
  const isPos   = trend !== undefined && trend >= 0
  // Light theme colors
  const tColor  = isPos ? '#0E9E6E' : '#E1483F'
  const tBg     = isPos ? 'rgba(14,158,110,0.08)' : 'rgba(225,72,63,0.08)'
  const tBorder = isPos ? 'rgba(14,158,110,0.2)' : 'rgba(225,72,63,0.2)'

  const animDelay = delay ? { animationDelay: `${delay}s` } : {}

  return (
    <div className="animate-fade-up bg-paper rounded-md border border-line p-[18px] flex flex-col gap-[10px] hover-lift"
      style={{ ...animDelay, boxShadow: 'var(--sh-1)' }}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-wider text-ink-3">{displayLabel}</span>
        {icon && <span className="text-ink-3">{icon}</span>}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-[24px] font-bold font-mono text-ink tabular-nums" style={{ letterSpacing: '-0.02em' }}>{value}</span>
        {trend !== undefined && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: tBg, color: tColor, border: `1px solid ${tBorder}` }}>
            {isPos ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      {sub && <span className="text-xs text-ink-3">{sub}</span>}
      {sparkline && <MiniSparkline data={sparkline} color={color} />}
    </div>
  )
}
