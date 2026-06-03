// components/dashboard/StatCard.tsx
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

export function StatCard({ label, value, trend, sub, color = '#7C3AED', delay = 0, sparkline, icon }: StatCardProps) {
  const { mode } = useViewMode()
  const displayLabel = getMetricLabel(label, mode)
  const isPos   = trend !== undefined && trend >= 0
  const tColor  = isPos ? '#22C55E' : '#EF4444'
  const tBg     = isPos ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'
  const tBorder = isPos ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'

  return (
    <div style={{
      background: '#0F1629',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '14px', padding: '18px',
      display: 'flex', flexDirection: 'column', gap: '10px',
      animationDelay: `${delay}s`,
      transition: 'border-color 0.15s, box-shadow 0.15s',
    }}
      className="animate-fade-up"
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.25)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(124,58,237,0.1)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)',
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          {icon && <span style={{ marginRight: '5px' }}>{icon}</span>}{displayLabel}
        </div>
        {trend !== undefined && (
          <span style={{
            fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '6px',
            color: tColor, background: tBg, border: `1px solid ${tBorder}`,
          }}>
            {isPos ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>

      {/* Value */}
      <div style={{ fontSize: '24px', fontWeight: 800, color, letterSpacing: '-0.03em', lineHeight: 1 }}>
        {value}
      </div>

      {/* Sub + sparkline */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
        {sub && <div style={{ fontSize: '11px', color: '#64748B', flex: 1, minWidth: 0, lineHeight: 1.4 }}>{sub}</div>}
        {sparkline && sparkline.length > 2 && (
          <MiniSparkline data={sparkline} color={color} />
        )}
      </div>
    </div>
  )
}
