'use client'
// components/dashboard/CreditsDisplay.tsx — Créditos de IA na topbar com explicação completa

import { useState, useEffect } from 'react'

const OPERATION_COSTS = [
  { op: 'Assistente IA (chat)',       cost: 2  },
  { op: 'Análise Profunda',           cost: 10 },
  { op: 'Estratégia de Crescimento',  cost: 8  },
  { op: 'Saúde do Negócio',           cost: 6  },
  { op: 'Otimização de Conversão',    cost: 5  },
  { op: 'Pesquisa de Concorrentes',   cost: 5  },
  { op: 'Criar Conteúdo',             cost: 3  },
  { op: 'Persona do Cliente',         cost: 3  },
  { op: 'TrafficBrain IA',            cost: 4  },
  { op: 'Alocador de Verba',          cost: 3  },
  { op: 'Mix de Canais',              cost: 3  },
  { op: 'Histórico de Aprendizado',   cost: 4  },
]

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
  const color   = isEmpty ? '#E1483F' : isLow ? '#E08B0B' : '#2C5FE0'
  const bgColor = isEmpty ? 'rgba(239,68,68,0.1)' : isLow ? 'rgba(245,158,11,0.1)' : 'rgba(124,58,237,0.08)'
  const border  = isEmpty ? 'rgba(239,68,68,0.25)' : isLow ? 'rgba(245,158,11,0.25)' : 'rgba(124,58,237,0.2)'

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(v => !v)}
        title="Créditos de IA — clique para ver detalhes"
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
          background: '#FFFFFF', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: 16, width: 280,
          boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
        }}>
          <button onClick={() => setOpen(false)} style={{
            position: 'absolute', top: 10, right: 10,
            background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)',
            cursor: 'pointer', fontSize: 14, lineHeight: 1,
          }}>×</button>

          <div style={{ fontSize: 12, fontWeight: 700, color: '#161B26', marginBottom: 6 }}>
            ⚡ Créditos de IA
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, marginBottom: 12 }}>
            Cada operação de IA consome créditos. O saldo é renovado mensalmente conforme seu plano.
          </div>

          {/* Usage bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Usados este mês</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#161B26' }}>
              {data.used} / {data.limit}
            </span>
          </div>
          <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginBottom: 8, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${Math.min(pct, 100)}%`,
              background: isEmpty ? '#E1483F' : isLow ? '#E08B0B' : 'linear-gradient(90deg, #2C5FE0, #2C5FE0)',
              borderRadius: 3, transition: 'width 0.4s ease',
            }} />
          </div>

          <div style={{ fontSize: 11, color: isEmpty ? '#E1483F' : isLow ? '#E08B0B' : '#2C5FE0', marginBottom: 12, fontWeight: 600 }}>
            {isEmpty
              ? '⚠️ Créditos esgotados — faça upgrade para continuar'
              : isLow
              ? `⚠️ Restam apenas ${data.remaining} créditos`
              : `✓ ${data.remaining} créditos disponíveis`}
          </div>

          {/* Operation costs */}
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
            Custo por operação
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 12 }}>
            {OPERATION_COSTS.map(row => (
              <div key={row.op} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{row.op}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: '#2C5FE0',
                  background: 'rgba(124,58,237,0.1)',
                  borderRadius: 4, padding: '1px 6px',
                }}>−{row.cost}</span>
              </div>
            ))}
          </div>

          {(isEmpty || isLow) && (
            <a href="/landing#pricing" style={{
              display: 'block', textAlign: 'center', padding: '8px',
              background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)',
              borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#2C5FE0',
              textDecoration: 'none', transition: 'all 0.15s',
            }}>
              ⚡ Fazer upgrade do plano →
            </a>
          )}
        </div>
      )}

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setOpen(false)} />
      )}
    </div>
  )
}
