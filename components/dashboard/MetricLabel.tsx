// components/dashboard/MetricLabel.tsx — Rótulo de métrica ciente do modo (Simplificado/Avançado)
'use client'

import { useState } from 'react'
import { useViewMode, getMetricLabel, METRIC_TOOLTIPS } from '@/lib/viewMode'

interface Props {
  /** Chave técnica da métrica: 'CTR', 'CPL', 'ROAS', etc. */
  metric: string
  /** Sufixo opcional exibido após o rótulo (ex: ' médio') */
  suffix?: string
  /** Estilo do texto */
  style?: React.CSSProperties
  /** Usa a versão curta no modo simples (para espaços apertados) */
  short?: boolean
}

/**
 * Exibe o nome da métrica conforme o modo:
 * - Avançado: 'CTR'
 * - Simplificado: 'Pessoas que clicaram no anúncio'
 * Em ambos, um ícone (?) mostra o tooltip educativo quando disponível.
 */
export function MetricLabel({ metric, suffix = '', style, short = false }: Props) {
  const { mode } = useViewMode()
  const [show, setShow] = useState(false)

  const key   = short && mode === 'simple' ? `${metric}_short` : metric
  const label = getMetricLabel(key, mode) + suffix
  const tip   = METRIC_TOOLTIPS[metric]

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', ...style }}>
      {label}
      {tip && (
        <span
          style={{ position: 'relative', display: 'inline-flex', cursor: 'help' }}
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          {show && (
            <span style={{
              position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
              width: '220px', zIndex: 200, pointerEvents: 'none',
              background: '#1C2440', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px',
              padding: '8px 10px', fontSize: '11px', color: 'rgba(255,255,255,0.78)', lineHeight: 1.5,
              fontWeight: 400, textTransform: 'none', letterSpacing: 'normal',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}>
              <strong style={{ color: '#A78BFA', display: 'block', marginBottom: '3px' }}>{metric}</strong>
              {tip}
            </span>
          )}
        </span>
      )}
    </span>
  )
}
