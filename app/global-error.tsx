'use client'

import { Button } from '@/components/dashboard/v2/Button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error('GLOBAL ERROR:', error)

  return (
    <html lang="pt-BR">
      <body className="bg-canvas text-ink font-body antialiased">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-lg p-6 max-w-lg w-full text-center">
            <h1 className="text-xl font-semibold text-red mb-3">Erro crítico</h1>
            <p className="text-ink-2 text-sm mb-4">
              {error?.message || 'Ocorreu um erro inesperado.'}
            </p>
            {error?.digest && (
              <p className="text-xs text-ink-3 mb-4">Digest: {error.digest}</p>
            )}
            <Button onClick={reset}>Tentar novamente</Button>
          </div>
        </div>
      </body>
    </html>
  )
}
