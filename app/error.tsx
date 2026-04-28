'use client'
// app/error.tsx — Página de erro global (500 / runtime errors)
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[app/error]', error)
  }, [error])

  return (
    <div style={{
      minHeight: '100vh', background: '#0A0A0B', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      padding: '24px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '420px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: '0 0 12px' }}>
          Algo deu errado
        </h1>
        <p style={{ color: '#64748B', fontSize: '15px', lineHeight: 1.6, margin: '0 0 8px' }}>
          Ocorreu um erro inesperado. Nossa equipe já foi notificada.
        </p>
        {error?.digest && (
          <p style={{ color: '#374151', fontSize: '11px', fontFamily: 'monospace', margin: '0 0 28px' }}>
            Ref: {error.digest}
          </p>
        )}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={reset}
            style={{
              background: 'linear-gradient(135deg, #F5A500, #FFD166)',
              color: '#000', fontWeight: 700, fontSize: '15px',
              padding: '14px 28px', borderRadius: '14px', border: 'none', cursor: 'pointer',
            }}
          >
            Tentar novamente
          </button>
          <a href="/dashboard" style={{
            display: 'inline-block',
            background: 'transparent', color: '#64748B', fontWeight: 600, fontSize: '15px',
            padding: '14px 28px', borderRadius: '14px',
            border: '1px solid #2A2A30', textDecoration: 'none',
          }}>
            Ir ao dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
