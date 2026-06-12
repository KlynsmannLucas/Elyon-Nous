// components/dashboard/v2/Badge.tsx
// Badge com tons do tema light
interface BadgeProps {
  tone?: 'good' | 'bad' | 'warn' | 'blue' | 'neutral'
  children: React.ReactNode
  dot?: boolean
  className?: string
}

const TONES = {
  good:   { bg: 'bg-green-soft', text: 'text-green', border: 'border-green-line' },
  bad:    { bg: 'bg-red-soft', text: 'text-red', border: 'border-red/20' },
  warn:   { bg: 'bg-amber-soft', text: 'text-amber', border: 'border-amber/20' },
  blue:   { bg: 'bg-blue-soft', text: 'text-blue', border: 'border-blue-line' },
  neutral:{ bg: 'bg-canvas-2', text: 'text-ink-3', border: 'border-line' },
}

export function Badge({ tone = 'neutral', children, dot, className = '' }: BadgeProps) {
  const t = TONES[tone]
  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full
      text-[11px] font-medium border ${t.bg} ${t.text} ${t.border} ${className}
    `.trim()}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${t.text === 'text-green' ? 'bg-green' : t.text === 'text-red' ? 'bg-red' : t.text === 'text-amber' ? 'bg-amber' : t.text === 'text-blue' ? 'bg-blue' : 'bg-ink-3'}`} />}
      {children}
    </span>
  )
}
