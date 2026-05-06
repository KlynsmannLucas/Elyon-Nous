'use client'

import { useSignIn } from '@clerk/nextjs'
import { useState } from 'react'
import Link from 'next/link'

export default function SignInPage() {
  const { signIn, isLoaded } = useSignIn()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogle = async () => {
    if (!isLoaded || loading) return
    setLoading(true)
    setError('')
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard',
      })
    } catch (err: any) {
      setError('Não foi possível conectar com o Google. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-10 text-center">
        <div
          className="font-display font-bold text-4xl mb-2"
          style={{
            background: 'linear-gradient(135deg, #F0B429, #FFD166)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          ELYON
        </div>
        <p className="text-slate-500 text-sm">Inteligência de marketing com IA</p>
      </div>

      {/* Card de login */}
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{ background: '#111114', border: '1px solid #2A2A30' }}
      >
        <h1 className="text-white font-display font-bold text-xl mb-1 text-center">
          Entrar na ELYON
        </h1>
        <p className="text-slate-500 text-sm text-center mb-8">
          Acesse sua conta para continuar
        </p>

        {/* Botão Google */}
        <button
          onClick={handleGoogle}
          disabled={!isLoaded || loading}
          className="w-full flex items-center justify-center gap-3 rounded-xl py-3 px-4 font-semibold text-sm transition-all"
          style={{
            background: loading ? 'rgba(240,180,41,0.05)' : '#16161A',
            border: '1px solid #2A2A30',
            color: loading ? '#94A3B8' : '#E2E8F0',
            cursor: (!isLoaded || loading) ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? (
            <>
              <span
                className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: '#F0B429', borderTopColor: 'transparent' }}
              />
              Conectando...
            </>
          ) : (
            <>
              {/* Ícone Google SVG */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Entrar com Google
            </>
          )}
        </button>

        {error && (
          <p className="text-red-400 text-xs text-center mt-4">{error}</p>
        )}

        <div className="mt-6 pt-6 text-center" style={{ borderTop: '1px solid #2A2A30' }}>
          <p className="text-slate-500 text-sm">
            Não tem conta?{' '}
            <Link href="/sign-up" className="font-semibold" style={{ color: '#F0B429' }}>
              Criar conta grátis
            </Link>
          </p>
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-600 text-center max-w-xs">
        Ao entrar, você concorda com nossos{' '}
        <span style={{ color: '#F0B429' }}>Termos de Uso</span> e{' '}
        <span style={{ color: '#F0B429' }}>Política de Privacidade</span>.
      </p>
    </div>
  )
}
