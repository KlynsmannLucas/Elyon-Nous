'use client'

import type { DataSource, BenchmarkMeta } from '@/lib/benchmark-service'

const CONFIG: Record<DataSource, { color: string; bg: string; border: string; icon: string; label: string }> = {
  real_market_data: {
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.06)',
    border: 'rgba(34,197,94,0.25)',
    icon: '✓',
    label: 'Dados reais',
  },
  estimated_data: {
    color: '#F0B429',
    bg: 'rgba(240,180,41,0.06)',
    border: 'rgba(240,180,41,0.25)',
    icon: '~',
    label: 'Dados estimados',
  },
  unavailable: {
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.06)',
    border: 'rgba(239,68,68,0.25)',
    icon: '!',
    label: 'Sem dados',
  },
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

interface Props {
  meta: BenchmarkMeta
  className?: string
}

export function DataSourceBadge({ meta, className = '' }: Props) {
  const cfg = CONFIG[meta.dataSource]

  let subtitle = ''
  if (meta.dataSource === 'real_market_data' && meta.updatedAt) {
    subtitle = `via Tavily · ${formatDate(meta.updatedAt)}`
  } else if (meta.dataSource === 'estimated_data') {
    if (meta.updatedAt && meta.freshDays !== null) {
      subtitle = `desatualizado · ${formatDate(meta.updatedAt)}`
    } else {
      subtitle = 'base de pesquisa 2024–2025'
    }
  } else {
    subtitle = 'nicho não mapeado'
  }

  const confidenceLabel =
    meta.confidence === 'alta' ? '· confiança alta' :
    meta.confidence === 'media' ? '· confiança média' :
    meta.confidence === 'baixa' ? '· confiança baixa' : ''

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium ${className}`}
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
      title={`${cfg.label} — ${subtitle}${confidenceLabel}`}
    >
      <span className="font-mono text-[11px] leading-none">{cfg.icon}</span>
      <span>{cfg.label}</span>
      {subtitle && <span style={{ color: cfg.color, opacity: 0.7 }}>· {subtitle}</span>}
      {meta.confidence && meta.confidence !== 'media' && (
        <span style={{ color: cfg.color, opacity: 0.6 }}>{confidenceLabel}</span>
      )}
    </div>
  )
}

// Smaller inline version for table cells
export function DataSourceDot({ dataSource }: { dataSource: DataSource }) {
  const cfg = CONFIG[dataSource]
  const titles: Record<DataSource, string> = {
    real_market_data: 'Dados reais (Tavily)',
    estimated_data: 'Dados estimados (pesquisa 2024–2025)',
    unavailable: 'Dados indisponíveis',
  }
  return (
    <span
      className="inline-flex w-2 h-2 rounded-full flex-shrink-0"
      style={{ background: cfg.color }}
      title={titles[dataSource]}
    />
  )
}
