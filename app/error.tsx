'use client'
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('APP ERROR:', error)
  }, [error])

  return (
    <div style={{ background: 'white', color: 'black', minHeight: '100vh', padding: 40 }}>
      <h1 style={{ color: 'red', marginBottom: 16 }}>Erro capturado em app/error.tsx</h1>
      <pre style={{ fontSize: 13, marginBottom: 24, whiteSpace: 'pre-wrap' }}>{error?.message}</pre>
      <pre style={{ fontSize: 11, color: '#555', whiteSpace: 'pre-wrap' }}>{error?.stack}</pre>
      {error?.digest && <p style={{ fontSize: 11, marginTop: 16 }}>Digest: {error.digest}</p>}
      <button onClick={reset} style={{ marginTop: 24, padding: '12px 24px', background: '#F5A500', border: 'none', cursor: 'pointer', fontWeight: 700, borderRadius: 8 }}>
        Tentar novamente
      </button>
    </div>
  )
}
