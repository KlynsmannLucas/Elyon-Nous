// app/planos/page.tsx — Página de assinatura de planos
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

const PLANS = [
  {
    key: 'individual',
    icon: '🔄',
    tag: 'RECORRÊNCIA BASE',
    color: '#38BDF8',
    border: 'rgba(56,189,248,0.3)',
    bg: 'linear-gradient(135deg, rgba(56,189,248,0.08) 0%, rgba(56,189,248,0.03) 100%)',
    title: 'Individual',
    desc: 'Para donos de negócio e profissionais que querem direção contínua baseada em dados reais.',
    price: 'R$197',
    priceEnd: '/mês',
    features: [
      '1 cliente ativo',
      'Estratégias ilimitadas com IA',
      'NOUS — analista estratégica IA',
      'Benchmarks por nicho',
      'Histórico de campanhas',
    ],
    highlight: false,
    cta: 'Assinar Individual',
  },
  {
    key: 'profissional',
    icon: '🚀',
    tag: 'MAIS POPULAR',
    color: '#F0B429',
    border: 'rgba(240,180,41,0.5)',
    bg: 'linear-gradient(135deg, rgba(240,180,41,0.12) 0%, rgba(240,180,41,0.05) 100%)',
    title: 'Profissional',
    desc: 'Para gestores de tráfego e consultores que atendem clientes com o sistema.',
    price: 'R$497',
    priceEnd: '/mês',
    features: [
      'Até 10 clientes ativos',
      'Tudo do Individual',
      'Conexão Meta + Google Ads',
      'Auditoria automática com IA',
      'Diagnóstico avançado',
      'Suporte prioritário',
    ],
    highlight: true,
    cta: 'Assinar Profissional',
  },
  {
    key: 'avancada',
    icon: '💣',
    tag: 'EMPRESAS E AGÊNCIAS',
    color: '#22C55E',
    border: 'rgba(34,197,94,0.3)',
    bg: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.03) 100%)',
    title: 'Avançada',
    desc: 'Para agências e empresas que escalam atendimento com IA estratégica de alto nível.',
    price: 'R$1.497',
    priceEnd: '/mês',
    features: [
      'Clientes ilimitados',
      'Tudo do Profissional',
      'Múltiplas contas Ads',
      'Relatórios avançados',
      'Acesso API',
      'SLA garantido',
    ],
    highlight: false,
    cta: 'Assinar Avançada',
  },
]

export default function PlanosPage() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleSubscribe = async (planKey: string) => {
    if (!isSignedIn) {
      router.push('/sign-in?redirect=/planos')
      return
    }
    setLoadingPlan(planKey)
    setError('')
    try {
      const res  = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Erro ao iniciar checkout. Tente novamente.')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] px-4 py-12">
      {/* Navbar mínima */}
      <div className="flex items-center justify-between max-w-5xl mx-auto mb-12">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors"
        >
          ← Voltar
        </button>
        <span
          className="font-display font-bold text-2xl"
          style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          ELYON
        </span>
        <div className="w-16" />
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full mb-4"
            style={{ color: '#F0B429', background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.25)' }}>
            ⚡ PLANOS ELYON
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            Escolha seu plano
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Inteligência de marketing com IA para transformar dados em decisões e budget em resultados.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-5 mb-8">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className="relative rounded-2xl p-7 flex flex-col transition-transform hover:-translate-y-1"
              style={{ background: plan.bg, border: `1px solid ${plan.border}` }}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="text-xs font-bold px-4 py-1 rounded-full text-black"
                    style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)' }}>
                    ★ Mais popular
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{plan.icon}</span>
                <span className="text-[10px] font-bold tracking-wider" style={{ color: plan.color }}>{plan.tag}</span>
              </div>
              <h2 className="font-display font-bold text-white text-2xl mb-2">{plan.title}</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-5">{plan.desc}</p>

              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="flex-shrink-0 mt-0.5 font-bold" style={{ color: plan.color }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="border-t pt-5" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="font-display text-3xl font-bold mb-0.5" style={{ color: plan.color }}>{plan.price}</div>
                <div className="text-xs text-slate-500 mb-4">{plan.priceEnd} · cancele quando quiser</div>
                <button
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={!!loadingPlan}
                  className="w-full flex items-center justify-center gap-2 text-sm font-bold px-5 py-3.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                  style={plan.highlight
                    ? { background: 'linear-gradient(135deg, #F0B429, #FFD166)', color: '#000' }
                    : { background: 'rgba(255,255,255,0.07)', border: `1px solid ${plan.border}`, color: '#fff' }
                  }
                >
                  {loadingPlan === plan.key ? (
                    <>
                      <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                      Redirecionando...
                    </>
                  ) : plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="text-center text-red-400 text-sm mb-6 bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Garantia */}
        <div className="text-center py-8 border-t border-[#2A2A30]">
          <div className="flex items-center justify-center gap-6 flex-wrap text-xs text-slate-500">
            <span className="flex items-center gap-1.5">🔒 Pagamento seguro via Stripe</span>
            <span className="flex items-center gap-1.5">↩️ Cancele quando quiser</span>
            <span className="flex items-center gap-1.5">⚡ Acesso imediato após pagamento</span>
          </div>
        </div>
      </div>
    </div>
  )
}
