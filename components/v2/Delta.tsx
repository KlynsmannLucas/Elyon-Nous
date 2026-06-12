'use client'

interface DeltaProps {
  value: number
  suffix?: string
  inverse?: boolean
  className?: string
}

export function Delta({ value, suffix = '', inverse = false, className = '' }: DeltaProps) {
  const isPositive = inverse ? value < 0 : value > 0
  const isNegative = inverse ? value > 0 : value < 0
  const isNeutral = value === 0

  const colorClass = isNeutral
    ? 'text-ink-3'
    : isPositive
      ? 'text-green-600'
      : 'text-red'

  const icon = isNeutral ? '•' : isPositive ? '↑' : '↓'

  const formattedValue =
    Math.abs(value) >= 1000
      ? `${(value / 1000).toFixed(1)}k`
      : Math.abs(value).toFixed(value % 1 === 0 ? 0 : 1)

  return (
    <span className={`font-mono text-sm font-medium ${colorClass} ${className}`}>
      {icon} {formattedValue}{suffix}
    </span>
  )
}
