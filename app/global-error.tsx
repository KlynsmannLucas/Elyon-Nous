'use client'
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body style={{ margin: 0, background: '#0A0A0B', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ textAlign: 'center', maxWidth: '420px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: '0 0 12px' }}>
              Algo deu errado
            </h1>
            <p style={{ color: '#64748B', fontSize: '15px', lineHeight: 1.6, margin: '0 0 28px' }}>
              Ocorreu um erro inesperado. Nossa equipe já foi notificada.
            </p>
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
          </div>
        </div>
      </body>
    </html>
  )
}
