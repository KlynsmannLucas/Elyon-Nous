// components/dashboard/v2/SourceBadge.tsx
// Badge de origem do dado (Dados reais / Estimativa / Fallback IA)
import { Badge } from './Badge'

type SourceType = 'real' | 'estimate' | 'benchmark' | 'ai'

const LABELS: Record<SourceType, { label: string; tone: 'good' | 'warn' | 'neutral' }> = {
  real:      { label: 'Dados reais', tone: 'good' },
  estimate:  { label: 'Estimativa', tone: 'warn' },
  benchmark: { label: 'Estimativa do nicho', tone: 'warn' },
  ai:        { label: 'Fallback IA', tone: 'neutral' },
}

interface SourceBadgeProps {
  source: SourceType
  className?: string
}

export function SourceBadge({ source, className = '' }: SourceBadgeProps) {
  const config = LABELS[source]
  return (
    <Badge tone={config.tone} dot className={className}>
      {config.label}
    </Badge>
  )
}
