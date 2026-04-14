// components/dashboard/StatCard.tsx — Card de KPI com trend badge
'use client'

interface StatCardProps {
  label: string
  value: string
  trend?: number        // percentual positivo = alta, negativo = queda
  sub?: string
  color?: string
  delay?: number
}

export function StatCard({ label, value, trend, sub, color = '#F0B429', delay = 0 }: StatCardProps) {
  const isPositive = trend !== undefined && trend >= 0
  const trendColor = isPositive ? '#22C55E' : '#FF4D4D'
  const trendBg    = isPositive ? 'rgba(34,197,94,0.1)'  : 'rgba(255,77,77,0.1)'
  const trendArrow = isPositive ? '↑' : '↓'

  return (
    <div
      className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5 animate-fade-up hover:border-[#3A3A42] transition-colors"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Label */}
      <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">
        {label}
      </div>

      {/* Valor + trend */}
      <div className="flex items-end justify-between mb-2">
        <div className="font-display text-2xl font-bold" style={{ color }}>
          {value}
        </div>
        {trend !== undefined && (
          <span
            className="text-xs font-bold px-2 py-1 rounded-full"
            style={{ color: trendColor, background: trendBg }}
          >
            {trendArrow} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>

      {/* Sub-label */}
      {sub && (
        <div className="text-xs text-slate-600 mt-1">{sub}</div>
      )}
    </div>
  )
}
