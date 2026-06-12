// components/dashboard/v2/Delta.tsx
// Indicador de mudança porcentual
interface DeltaProps {
  value: number
  suffix?: string
  inverse?: boolean // inverte cor (good = queda)
}

export function Delta({ value, suffix = '%', inverse = false }: DeltaProps) {
  const isPositive = inverse ? value < 0 : value > 0
  const isNeutral = value === 0
  
  const colors = isNeutral 
    ? { bg: 'bg-canvas-2', text: 'text-ink-3', border: 'border-line' }
    : isPositive 
      ? { bg: 'bg-green-soft', text: 'text-green', border: 'border-green-line' }
      : { bg: 'bg-red-soft', text: 'text-red', border: 'border-red/20' }
  
  const arrow = isNeutral ? '·' : isPositive ? '↑' : '↓'
  
  return (
    <span className={`
      inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
      ${colors.bg} ${colors.text} border ${colors.border}
    `.trim()}>
      {arrow} {Math.abs(value)}{suffix}
    </span>
  )
}
