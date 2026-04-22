// components/dashboard/StatCard.tsx — KPI card com trend badge + sparkline opcional
'use client'

import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'

interface StatCardProps {
  label: string
  value: string
  trend?: number
  sub?: string
  color?: string
  delay?: number
  sparkline?: number[]  // ex: [120, 135, 128, 160, 155, 180]
  icon?: string
}

export function StatCard({ label, value, trend, sub, color = '#F0B429', delay = 0, sparkline, icon }: StatCardProps) {
  const isPositive  = trend !== undefined && trend >= 0
  const trendColor  = isPositive ? '#22C55E' : '#FF4D4D'
  const trendBg     = isPositive ? 'rgba(34,197,94,0.1)' : 'rgba(255,77,77,0.1)'
  const trendArrow  = isPositive ? '↑' : '↓'

  const sparkData = sparkline?.map((v, i) => ({ v, i }))

  return (
    <div
      className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5 animate-fade-up hover:border-[#3A3A42] transition-all hover:-translate-y-px"
      style={{ animationDelay: `${delay}s`, transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
    >
      {/* Label row */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
          {icon && <span className="mr-1.5">{icon}</span>}{label}
        </div>
        {trend !== undefined && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ color: trendColor, background: trendBg }}>
            {trendArrow} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>

      {/* Value */}
      <div className="font-display text-2xl font-bold mb-1" style={{ color }}>
        {value}
      </div>

      {/* Sub-label */}
      {sub && <div className="text-xs text-slate-600 mb-2">{sub}</div>}

      {/* Sparkline */}
      {sparkData && sparkData.length > 2 && (
        <div className="mt-3 -mx-1">
          <ResponsiveContainer width="100%" height={36}>
            <AreaChart data={sparkData} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
              <defs>
                <linearGradient id={`spark-${label.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={color} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={color}
                strokeWidth={1.5}
                fill={`url(#spark-${label.replace(/\s/g, '')})`}
                dot={false}
                activeDot={{ r: 3, fill: color, strokeWidth: 0 }}
              />
              <Tooltip
                contentStyle={{ display: 'none' }}
                cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '3 3', opacity: 0.4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
