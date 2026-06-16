// components/dashboard/v2/Charts.tsx
// Biblioteca de gráficos SVG do Redesign v2 — sem dependências externas.
// Paleta alinhada aos tokens: blue #2C5FE0 · green #0E9E6E · teal #0E9CB0 · amber #E08B0B · slate #64748B · red #E1483F
'use client'

import { ReactNode, useId } from 'react'

export const CHART_COLORS = {
  blue: '#2C5FE0',
  green: '#0E9E6E',
  teal: '#0E9CB0',
  amber: '#E08B0B',
  slate: '#64748B',
  red: '#E1483F',
  ink3: '#8A93A3',
}
export const SERIES = [CHART_COLORS.blue, CHART_COLORS.green, CHART_COLORS.teal, CHART_COLORS.amber, CHART_COLORS.slate]

const fmtInt = (n: number) => new Intl.NumberFormat('pt-BR').format(Math.round(n || 0))
const fmtK = (n: number) => {
  const v = n || 0
  if (Math.abs(v) >= 1000) return `R$${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 0)}k`
  return `R$${Math.round(v)}`
}

/* ───────────────────────── Sparkline ───────────────────────── */
export function Sparkline({ data, color = CHART_COLORS.green, h = 40, fill = true, className = '' }: {
  data: number[]; color?: string; h?: number; fill?: boolean; className?: string
}) {
  const id = useId()
  const pts = data && data.length > 1 ? data : [0, 0]
  const w = 100
  const min = Math.min(...pts), max = Math.max(...pts)
  const range = max - min || 1
  const step = w / (pts.length - 1)
  const coords = pts.map((v, i) => [i * step, h - 6 - ((v - min) / range) * (h - 12)] as const)
  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(' ')
  const area = `${line} L${w},${h} L0,${h} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={`w-full ${className}`} style={{ height: h }}>
      {fill && (
        <>
          <defs>
            <linearGradient id={`sg-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#sg-${id})`} />
        </>
      )}
      <path d={line} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r="4.2" fill={color} fillOpacity="0.16" />
      <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r="2.4" fill={color} />
    </svg>
  )
}

/* ───────────────────────── LineChart (multi-série, área) ───────────────────────── */
export function LineChart({ series, labels, height = 240, money = false, yTicks = 4 }: {
  series: { name: string; color: string; data: number[] }[]
  labels?: string[]; height?: number; money?: boolean; yTicks?: number
}) {
  const id = useId()
  const W = 600, H = height, padL = 48, padB = 26, padT = 10, padR = 10
  const all = series.flatMap(s => s.data)
  const max = Math.max(...all, 1), min = Math.min(...all, 0)
  const range = max - min || 1
  const n = Math.max(...series.map(s => s.data.length), 2)
  const xw = W - padL - padR, yh = H - padB - padT
  const x = (i: number) => padL + (i / (n - 1)) * xw
  const y = (v: number) => padT + yh - ((v - min) / range) * yh
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => min + (range * i) / yTicks)
  const fmt = (v: number) => money ? fmtK(v) : fmtInt(v)
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 'auto' }}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="var(--line-2, #EEF0F3)" strokeWidth="1" strokeDasharray="3 3" />
            <text x={padL - 8} y={y(t) + 3} textAnchor="end" className="fill-ink-3" style={{ fontSize: 10, fontFamily: 'var(--font-jetbrains, monospace)' }}>{fmt(t)}</text>
          </g>
        ))}
        {series.map((s, si) => {
          const line = s.data.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
          const area = `${line} L${x(s.data.length - 1)},${padT + yh} L${x(0)},${padT + yh} Z`
          return (
            <g key={s.name}>
              <defs>
                <linearGradient id={`lg-${id}-${si}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity="0.14" />
                  <stop offset="100%" stopColor={s.color} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={area} fill={`url(#lg-${id}-${si})`} />
              <path d={line} fill="none" stroke={s.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              {(() => { const li = s.data.length - 1; return <g><circle cx={x(li)} cy={y(s.data[li])} r="6" fill={s.color} fillOpacity="0.14" /><circle cx={x(li)} cy={y(s.data[li])} r="3.4" fill={s.color} stroke="var(--paper)" strokeWidth="2" /></g> })()}
            </g>
          )
        })}
        {labels && labels.map((l, i) => (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" className="fill-ink-3" style={{ fontSize: 10, fontFamily: 'var(--font-jetbrains, monospace)' }}>{l}</text>
        ))}
      </svg>
    </div>
  )
}

/* ───────────────────────── Donut ───────────────────────── */
export function Donut({ data, centerLabel, centerSub, size = 160, thickness = 22, legend = true }: {
  data: { label: string; value: number; color?: string }[]
  centerLabel?: string; centerSub?: string; size?: number; thickness?: number; legend?: boolean
}) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0) || 1
  const r = (size - thickness) / 2
  const cx = size / 2, cy = size / 2
  const circ = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="flex items-center gap-5 flex-wrap">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--canvas-2, #F1F3F6)" strokeWidth={thickness} />
          {data.map((d, i) => {
            const frac = (d.value || 0) / total
            const dash = frac * circ
            const el = (
              <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                stroke={d.color || SERIES[i % SERIES.length]} strokeWidth={thickness}
                strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset} strokeLinecap="butt" />
            )
            offset += dash
            return el
          })}
        </svg>
        {(centerLabel || centerSub) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerLabel && <span className="text-[19px] font-bold font-mono text-ink leading-none">{centerLabel}</span>}
            {centerSub && <span className="text-[9.5px] font-mono uppercase tracking-wider text-ink-3 mt-1">{centerSub}</span>}
          </div>
        )}
      </div>
      {legend && (
        <div className="flex-1 min-w-[140px] space-y-2">
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color || SERIES[i % SERIES.length] }} />
              <span className="text-ink-2 flex-1 truncate">{d.label}</span>
              <span className="font-mono text-ink font-medium">{Math.round(((d.value || 0) / total) * 100)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ───────────────────────── BarChart (vertical) ───────────────────────── */
export function BarChart({ data, height = 200, suffix = '', valueFmt }: {
  data: { label: string; value: number; color?: string }[]
  height?: number; suffix?: string; valueFmt?: (v: number) => string
}) {
  const max = Math.max(...data.map(d => d.value || 0), 1)
  const fmt = valueFmt || ((v: number) => `${fmtInt(v)}${suffix}`)
  return (
    <div className="flex items-end gap-3" style={{ height }}>
      {data.map((d, i) => {
        const h = Math.max(4, ((d.value || 0) / max) * (height - 44))
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 min-w-0">
            <span className="text-xs font-mono font-semibold text-ink">{fmt(d.value || 0)}</span>
            <div className="w-full rounded-md transition-all" style={{ height: h, background: d.color || SERIES[i % SERIES.length], maxWidth: 80 }} />
            <span className="text-[11px] text-ink-3 truncate w-full text-center">{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

/* ───────────────────────── Funnel ───────────────────────── */
export function Funnel({ stages }: { stages: { label: string; value: number; color?: string }[] }) {
  const max = Math.max(...stages.map(s => s.value || 0), 1)
  return (
    <div className="flex flex-col items-center gap-1.5">
      {stages.map((s, i) => {
        const pct = Math.max(8, ((s.value || 0) / max) * 100)
        const conv = i > 0 && stages[i - 1].value > 0 ? Math.round(((s.value || 0) / stages[i - 1].value) * 100) : null
        return (
          <div key={i} className="w-full flex flex-col items-center">
            <div className="rounded-md flex items-center justify-center text-white py-2.5 transition-all"
              style={{ width: `${pct}%`, minWidth: 90, background: s.color || SERIES[i % SERIES.length] }}>
              <div className="text-center leading-tight">
                <div className="text-[11px] font-medium opacity-90">{s.label}</div>
                <div className="text-sm font-mono font-bold">{fmtInt(s.value)}</div>
              </div>
            </div>
            {conv != null && <div className="text-[10px] font-mono text-ink-3 py-0.5">↓ {conv}%</div>}
          </div>
        )
      })}
    </div>
  )
}

/* ───────────────────────── Gauge (score circular) ───────────────────────── */
export function Gauge({ value, max = 100, size = 120, label, sub, color }: {
  value: number; max?: number; size?: number; label?: string; sub?: string; color?: string
}) {
  const pct = Math.max(0, Math.min(1, (value || 0) / max))
  const c = color || (value >= 70 ? CHART_COLORS.green : value >= 50 ? CHART_COLORS.amber : CHART_COLORS.red)
  const r = 40
  const circ = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--canvas-2, #F1F3F6)" strokeWidth="9" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={c} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={`${(pct * circ).toFixed(1)} ${circ}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[26px] font-bold font-mono text-ink leading-none">{label ?? Math.round(value)}</span>
        {sub && <span className="text-[9px] font-mono uppercase tracking-wider text-ink-3 mt-1">{sub}</span>}
      </div>
    </div>
  )
}

/* ───────────────────────── Radar (maturidade por pilar) ───────────────────────── */
export function Radar({ axes, series, size = 280, maxValue = 100 }: {
  axes: string[]
  series: { name: string; color: string; values: number[]; dashed?: boolean }[]
  size?: number; maxValue?: number
}) {
  const cx = size / 2, cy = size / 2, R = size / 2 - 38
  const N = axes.length
  const angle = (i: number) => (Math.PI * 2 * i) / N - Math.PI / 2
  const pt = (i: number, frac: number) => [cx + Math.cos(angle(i)) * R * frac, cy + Math.sin(angle(i)) * R * frac] as const
  const rings = [0.25, 0.5, 0.75, 1]
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full" style={{ maxWidth: size }}>
      {rings.map((f, ri) => (
        <polygon key={ri} points={axes.map((_, i) => pt(i, f).join(',')).join(' ')}
          fill="none" stroke="var(--line, #E6E9EE)" strokeWidth="1" />
      ))}
      {axes.map((_, i) => {
        const [ex, ey] = pt(i, 1)
        return <line key={i} x1={cx} y1={cy} x2={ex} y2={ey} stroke="var(--line, #E6E9EE)" strokeWidth="1" />
      })}
      {series.map((s, si) => {
        const poly = s.values.map((v, i) => pt(i, Math.max(0, Math.min(1, v / maxValue))).join(',')).join(' ')
        return (
          <polygon key={si} points={poly}
            fill={s.dashed ? 'none' : s.color} fillOpacity={s.dashed ? 0 : 0.16}
            stroke={s.color} strokeWidth="2" strokeDasharray={s.dashed ? '4 3' : undefined} />
        )
      })}
      {axes.map((a, i) => {
        const [lx, ly] = pt(i, 1.18)
        return (
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            className="fill-ink-2" style={{ fontSize: 10.5, fontWeight: 600 }}>{a}</text>
        )
      })}
    </svg>
  )
}

/* ───────────────────────── HBar (barra horizontal / progresso) ───────────────────────── */
export function HBar({ value, max = 100, color = CHART_COLORS.blue, track = 'var(--canvas-2, #F1F3F6)', h = 8, className = '' }: {
  value: number; max?: number; color?: string; track?: string; h?: number; className?: string
}) {
  const pct = Math.max(0, Math.min(100, ((value || 0) / max) * 100))
  return (
    <div className={`w-full rounded-full overflow-hidden ${className}`} style={{ height: h, background: track }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

/* wrapper helper p/ legendas inline */
export function LegendDot({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />{children}
    </span>
  )
}
