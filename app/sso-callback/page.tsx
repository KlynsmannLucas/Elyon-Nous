'use client'

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'

export default function SSOCallbackPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
      <div className="text-center">
        <div
          className="font-display font-bold text-3xl mb-4"
          style={{
            background: 'linear-gradient(135deg, #F0B429, #FFD166)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          ELYON
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <span
            className="w-4 h-4 rounded-full border-2 animate-spin inline-block"
            style={{ borderColor: '#F0B429', borderTopColor: 'transparent' }}
          />
          Verificando autenticação...
        </div>
      </div>
      <AuthenticateWithRedirectCallback />
    </div>
  )
}
