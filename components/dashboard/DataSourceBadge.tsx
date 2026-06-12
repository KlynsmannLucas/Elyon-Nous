'use client'

import type { DataSource, BenchmarkMeta } from '@/lib/benchmark-service'

const CONFIG: Record<DataSource, { color: string; bg: string; border: string; icon: string; label: string }> = {
  real_market_data: {
    color: '#0E9E6E',
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
    color: '#E1483F',
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

// ── Simple source badge (lightweight, no BenchmarkMeta required) ────────────
export type SimpleSourceType = 'real' | 'benchmark' | 'estimated' | 'fallback' | 'unavailable'

const SIMPLE_CONFIG: Record<SimpleSourceType, { color: string; bg: string; border: string; icon: string; label: string; tooltip: string }> = {
  real:        { color: '#0E9E6E', bg: 'rgba(34,197,94,0.06)',  border: 'rgba(34,197,94,0.25)',  icon: '✓', label: 'Dados reais',  tooltip: 'Dados extraídos diretamente das plataformas de anúncio conectadas.' },
  benchmark:   { color: '#F0B429', bg: 'rgba(240,180,41,0.06)', border: 'rgba(240,180,41,0.25)', icon: '~', label: 'Benchmark',     tooltip: 'Projeção baseada em médias de mercado para o nicho. Não representa dados reais desta conta.' },
  estimated:   { color: '#F0B429', bg: 'rgba(240,180,41,0.06)', border: 'rgba(240,180,41,0.25)', icon: '≈', label: 'Estimativa',    tooltip: 'Valor estimado com base em parâmetros do cliente e benchmarks do nicho.' },
  fallback:    { color: '#FB923C', bg: 'rgba(251,146,60,0.06)', border: 'rgba(251,146,60,0.25)', icon: '↩', label: 'Fallback IA',  tooltip: 'Análise gerada pela IA com dados parciais. Conecte anúncios para maior precisão.' },
  unavailable: { color: '#E1483F', bg: 'rgba(239,68,68,0.06)',  border: 'rgba(239,68,68,0.25)',  icon: '!', label: 'Indisponível', tooltip: 'Dados não disponíveis. Execute uma análise para obter informações.' },
}

export function SimpleSourceBadge({ type, tooltip, className = '' }: { type: SimpleSourceType; tooltip?: string; className?: string }) {
  const cfg = SIMPLE_CONFIG[type]
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold cursor-help ${className}`}
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
      title={tooltip ?? cfg.tooltip}
    >
      <span className="font-mono leading-none">{cfg.icon}</span>
      {cfg.label}
    </span>
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
