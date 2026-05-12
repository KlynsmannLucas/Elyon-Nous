'use client'
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body style={{ margin: 0, background: '#fff', fontFamily: 'monospace' }}>
        <div style={{ minHeight: '100vh', padding: '40px' }}>
          <h1 style={{ color: 'red', fontSize: '24px', margin: '0 0 16px' }}>ERRO GLOBAL CAPTURADO</h1>
          <pre style={{ color: '#111', fontSize: '13px', whiteSpace: 'pre-wrap', marginBottom: 24 }}>
            {error?.message}{'\n\n'}{error?.stack}
          </pre>
          <button onClick={reset} style={{ background: '#F5A500', color: '#000', fontWeight: 700, fontSize: '15px', padding: '12px 24px', border: 'none', cursor: 'pointer', borderRadius: 8 }}>
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  )
}
