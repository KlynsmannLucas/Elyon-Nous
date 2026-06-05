// components/dashboard/ViewModeToggle.tsx — Toggle reutilizável Simplificado / Avançado
'use client'

import { useViewMode } from '@/lib/viewMode'

interface Props {
  variant?: 'topbar' | 'inline' | 'compact'
}

export function ViewModeToggle({ variant = 'topbar' }: Props) {
  const { mode, setMode, isSimple } = useViewMode()

  // Troca o modo e avisa o app (dispara o toast — só em ação do usuário)
  const switchTo = (next: 'simple' | 'pro') => {
    if (next === mode) return
    setMode(next)
    window.dispatchEvent(new CustomEvent('elyon:mode-changed', { detail: { mode: next } }))
  }
  const toggle = () => switchTo(isSimple ? 'pro' : 'simple')

  if (variant === 'compact') {
    return (
      <button
        onClick={toggle}
        title={isSimple ? 'Modo Simplificado ativo — clique para Modo Avançado' : 'Modo Avançado ativo — clique para Modo Simplificado'}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
          cursor: 'pointer', transition: 'all 0.15s',
          border: isSimple ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.1)',
          background: isSimple ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)',
          color: isSimple ? '#22C55E' : 'rgba(255,255,255,0.5)',
        }}
      >
        {isSimple ? '🟢 Simplificado' : '⚙ Avançado'}
      </button>
    )
  }

  if (variant === 'inline') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '2px',
        background: '#0C1426', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px', padding: '3px',
      }}>
        {(['simple', 'pro'] as const).map(m => (
          <button
            key={m}
            onClick={() => switchTo(m)}
            style={{
              padding: '5px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s', border: 'none',
              background: mode === m ? (m === 'simple' ? 'rgba(34,197,94,0.12)' : 'rgba(124,58,237,0.12)') : 'transparent',
              color: mode === m ? (m === 'simple' ? '#22C55E' : '#A78BFA') : 'rgba(255,255,255,0.3)',
            }}
          >
            {m === 'simple' ? '🟢 Simplificado' : '⚙ Avançado'}
          </button>
        ))}
      </div>
    )
  }

  // topbar variant (padrão)
  return (
    <button
      onClick={toggle}
      title={isSimple
        ? 'Modo Simplificado — linguagem de negócio. Clique para Modo Avançado (métricas técnicas).'
        : 'Modo Avançado — métricas técnicas. Clique para Modo Simplificado (linguagem de negócio).'}
      style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '4px 11px', borderRadius: '7px', flexShrink: 0,
        border: isSimple ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(124,58,237,0.3)',
        background: isSimple ? 'rgba(34,197,94,0.1)' : 'rgba(124,58,237,0.1)',
        color: isSimple ? '#4ADE80' : '#A78BFA',
        cursor: 'pointer', transition: 'all 0.25s',
        fontSize: '10px', fontWeight: 700, letterSpacing: '0.02em',
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '0.82' }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
    >
      {isSimple ? '🟢 Modo Simplificado' : '⚙️ Modo Avançado'}
    </button>
  )
}
