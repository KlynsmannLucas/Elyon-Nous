'use client'
// components/dashboard/CreditsDisplay.tsx — Exibe créditos de IA restantes na topbar

import { useState, useEffect } from 'react'

export function CreditsDisplay() {
  const [data, setData]     = useState<{ used: number; limit: number; remaining: number } | null>(null)
  const [open, setOpen]     = useState(false)

  useEffect(() => {
    fetch('/api/credits')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d) })
      .catch(() => {})
  }, [])

  if (!data) return null

  const pct     = Math.round((data.used / data.limit) * 100)
  const isLow   = data.remaining <= data.limit * 0.15
  const isEmpty = data.remaining === 0
  const color   = isEmpty ? '#EF4444' : isLow ? '#F59E0B' : '#A78BFA'
  const bgColor = isEmpty ? 'rgba(239,68,68,0.1)' : isLow ? 'rgba(245,158,11,0.1)' : 'rgba(124,58,237,0.08)'
  const border  = isEmpty ? 'rgba(239,68,68,0.25)' : isLow ? 'rgba(245,158,11,0.25)' : 'rgba(124,58,237,0.2)'

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(v => !v)}
        title="Créditos de IA"
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 9px', borderRadius: 7, cursor: 'pointer',
          background: bgColor, border: `1px solid ${border}`,
          transition: 'all 0.15s',
        }}
      >
        <span style={{ fontSize: 11 }}>⚡</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>
          {data.remaining.toLocaleString('pt-BR')}
        </span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>créditos</span>
      </button>

      {open && (
        <div style={{
          position: 'fixed', top: 60, right: 20, zIndex: 9999,
          background: '#0F1221', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: 16, minWidth: 220,
          boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#F1F5F9', marginBottom: 12 }}>
            ⚡ Créditos de IA
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Usados este mês</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#F1F5F9' }}>
              {data.used} / {data.limit}
            </span>
          </div>

          <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginBottom: 10, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${Math.min(pct, 100)}%`,
              background: isEmpty ? '#EF4444' : isLow ? '#F59E0B' : 'linear-gradient(90deg, #7C3AED, #A78BFA)',
              borderRadius: 3, transition: 'width 0.4s ease',
            }} />
          </div>

          <div style={{ fontSize: 11, color: isEmpty ? '#EF4444' : isLow ? '#F59E0B' : '#A78BFA', marginBottom: 10, fontWeight: 600 }}>
            {isEmpty
              ? '⚠️ Créditos esgotados — faça upgrade'
              : isLow
              ? `⚠️ Restam apenas ${data.remaining} créditos`
              : `✓ ${data.remaining} créditos disponíveis`}
          </div>

          {[
            { op: 'Chat NOUS', cost: 2 },
            { op: 'Auditoria',  cost: 10 },
            { op: 'Estratégia', cost: 8 },
            { op: 'Diagnóstico', cost: 6 },
          ].map(row => (
            <div key={row.op} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{row.op}</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>−{row.cost}</span>
            </div>
          ))}

          <button onClick={() => setOpen(false)} style={{
            position: 'absolute', top: 10, right: 10,
            background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)',
            cursor: 'pointer', fontSize: 14, lineHeight: 1,
          }}>×</button>
        </div>
      )}

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setOpen(false)} />
      )}
    </div>
  )
}
