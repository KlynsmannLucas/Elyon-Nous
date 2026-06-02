// components/dashboard/SaveIndicator.tsx — Indicador visual de autosave
'use client'

import { useEffect, useState } from 'react'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface Props {
  status: SaveStatus
  errorMsg?: string | null
}

export function SaveIndicator({ status, errorMsg }: Props) {
  const [visible, setVisible] = useState(false)

  // Esconde o indicador "salvo" após 3s
  useEffect(() => {
    if (status === 'saving' || status === 'error') {
      setVisible(true)
      return
    }
    if (status === 'saved') {
      setVisible(true)
      const t = setTimeout(() => setVisible(false), 3000)
      return () => clearTimeout(t)
    }
    setVisible(false)
  }, [status])

  if (!visible) return null

  const config = {
    saving: {
      color:  '#F59E0B',
      bg:     'rgba(245,158,11,0.08)',
      border: 'rgba(245,158,11,0.2)',
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ animation: 'save-spin 0.8s linear infinite', flexShrink: 0 }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
      ),
      label: 'Salvando...',
    },
    saved: {
      color:  '#22C55E',
      bg:     'rgba(34,197,94,0.07)',
      border: 'rgba(34,197,94,0.2)',
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ),
      label: 'Salvo',
    },
    error: {
      color:  '#EF4444',
      bg:     'rgba(239,68,68,0.07)',
      border: 'rgba(239,68,68,0.22)',
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      ),
      label: errorMsg ? `Erro: ${errorMsg}` : 'Erro ao salvar',
    },
    idle: { color: '', bg: '', border: '', icon: null, label: '' },
  }[status]

  return (
    <>
      <style>{`@keyframes save-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '4px 9px', borderRadius: '7px', flexShrink: 0,
        background: config.bg, border: `1px solid ${config.border}`,
        color: config.color, fontSize: '11px', fontWeight: 500,
        transition: 'all 0.2s',
      }}>
        {config.icon}
        <span>{config.label}</span>
      </div>
    </>
  )
}
