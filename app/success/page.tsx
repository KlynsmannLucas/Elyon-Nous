'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const PLAN_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  individual:   { label: 'Individual',   color: '#38BDF8', icon: '🔄' },
  profissional: { label: 'Profissional', color: '#F0B429', icon: '🚀' },
  avancada:     { label: 'Avançada',     color: '#22C55E', icon: '💣' },
}

function SuccessContent() {
  const router  = useRouter()
  const params  = useSearchParams()
  const planKey = params.get('plan') || ''
  const plan    = PLAN_LABELS[planKey]

  const [step, setStep]     = useState<'syncing' | 'done'>('syncing')
  const [syncMsg, setSyncMsg] = useState('Confirmando pagamento...')

  useEffect(() => {
    const trySync = async (attempt = 1): Promise<void> => {
      try {
        const res  = await fetch('/api/stripe/sync', { method: 'POST' })
        const data = await res.json()
        if (data.success && data.plan) {
          setSyncMsg(`Plano ${data.plan} ativado!`)
          setStep('done')
        } else if (attempt < 3) {
          setSyncMsg(`Aguardando confirmação... (${attempt}/3)`)
          await new Promise(r => setTimeout(r, 3000))
          return trySync(attempt + 1)
        } else {
          // Após 3 tentativas: redireciona mesmo assim (webhook vai ativar depois)
          setStep('done')
        }
      } catch {
        setStep('done')
      }
    }
    trySync()
  }, [])

  useEffect(() => {
    if (step !== 'done') return
    // window.location.href força reload completo → Clerk busca JWT fresco com o plano novo
    const t = setTimeout(() => { window.location.href = '/dashboard' }, 4000)
    return () => clearTimeout(t)
  }, [step])

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center px-4">
      <div className="text-center max-w-sm w-full">
        <div className="font-display font-bold text-2xl mb-8" style={{
          background: 'linear-gradient(135deg, #F0B429, #FFD166)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          ELYON
        </div>

        {step === 'syncing' ? (
          <>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.25)' }}>
              <div className="w-8 h-8 border-2 border-[#F0B429]/30 border-t-[#F0B429] rounded-full animate-spin" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white mb-3">Processando pagamento</h1>
            <p className="text-slate-400 text-sm">{syncMsg}</p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">{plan?.icon || '🎉'}</div>
            <div className="text-4xl font-bold mb-3" style={{ color: plan?.color || '#22C55E' }}>✓</div>
            <h1 className="font-display text-2xl font-bold text-white mb-2">Assinatura ativada!</h1>
            {plan && (
              <span className="inline-block text-sm font-bold px-4 py-1.5 rounded-full mb-4"
                style={{ background: `${plan.color}18`, color: plan.color, border: `1px solid ${plan.color}30` }}>
                Plano {plan.label}
              </span>
            )}
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              Bem-vindo ao ELYON!<br />Redirecionando para o dashboard...
            </p>
            <div className="w-full h-1.5 bg-[#1E1E24] rounded-full overflow-hidden mb-6">
              <div className="h-full rounded-full" style={{
                background: `linear-gradient(90deg, ${plan?.color || '#F0B429'}, ${plan?.color || '#FFD166'})`,
                animation: 'progressBar 4s linear forwards',
              }} />
            </div>
            <button
              onClick={() => { window.location.href = '/dashboard' }}
              className="text-sm font-bold px-6 py-3 rounded-xl hover:opacity-80 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)', color: '#000' }}
            >
              Ir para o dashboard →
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes progressBar { from { width: 0 } to { width: 100% } }`}</style>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#F0B429]/30 border-t-[#F0B429] rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
