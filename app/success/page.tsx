'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SuccessPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => router.push('/dashboard'), 4000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="font-display text-2xl font-bold text-white mb-3">Assinatura ativada!</h1>
        <p className="text-slate-400 text-sm mb-8">
          Seu plano está ativo. Você será redirecionado para o dashboard em instantes.
        </p>
        <div className="w-full h-1 bg-[#1E1E24] rounded-full overflow-hidden">
          <div className="h-full rounded-full animate-[grow_4s_linear]"
            style={{ background: 'linear-gradient(90deg, #F0B429, #FFD166)', width: '100%', transformOrigin: 'left' }} />
        </div>
      </div>
    </div>
  )
}
