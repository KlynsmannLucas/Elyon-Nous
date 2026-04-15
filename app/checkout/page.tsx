'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'

export default function CheckoutPage() {
  const params   = useSearchParams()
  const router   = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const plan     = params.get('plan') || 'profissional'
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn) {
      router.push(`/sign-up?redirect_url=/checkout?plan=${plan}`)
      return
    }

    // Cria sessão de checkout
    fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.url) {
          window.location.href = data.url
        } else {
          setError(data.error || 'Erro ao criar sessão de pagamento.')
        }
      })
      .catch(() => setError('Erro de conexão. Tente novamente.'))
  }, [isLoaded, isSignedIn])

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
      <div className="text-center max-w-sm">
        {error ? (
          <>
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-white font-bold mb-2">Erro ao abrir checkout</p>
            <p className="text-slate-500 text-sm mb-6">{error}</p>
            <button
              onClick={() => router.push('/#pricing')}
              className="px-6 py-3 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.3)', color: '#F0B429' }}
            >
              ← Voltar aos planos
            </button>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.25)' }}>
              <span className="text-2xl animate-pulse">⚡</span>
            </div>
            <p className="font-display text-white font-bold text-lg mb-2">Abrindo checkout seguro...</p>
            <p className="text-slate-500 text-sm">Você será redirecionado para o Stripe.</p>
          </>
        )}
      </div>
    </div>
  )
}
