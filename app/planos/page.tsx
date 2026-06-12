// app/planos/page.tsx — Planos page (v2 light theme)
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

const PLANS = [
  {
    key: 'diagnostico',
    icon: '🔬',
    tag: 'GRÁTIS',
    color: '#64748B',
    title: 'Diagnóstico',
    desc: 'Análise inicial completa do seu marketing com IA. Entenda onde você está e o que melhorar.',
    price: 'Grátis',
    priceEnd: '',
    features: [
      '1 diagnóstico completo',
      'Análisis de 11 dimensões',
      'Relatório em PDF',
      'Sugestões priorizadas',
    ],
    highlight: false,
    cta: 'Fazer diagnóstico',
  },
  {
    key: 'plataforma',
    icon: '📊',
    tag: 'PLATAFORMA',
    color: '#2C5FE0',
    title: 'Plataforma',
    desc: 'Para profissionais e pequenos negócios que querem direção contínua baseada em dados.',
    price: 'R$297',
    priceEnd: '/mês',
    features: [
      '1 cliente ativo',
      'Estratégias ilimitadas com IA',
      'NOUS — analista IA',
      'Benchmarks por nicho',
      'Histórico de campanhas',
    ],
    highlight: false,
    cta: 'Assinar Plataforma',
  },
  {
    key: 'agency',
    icon: '🚀',
    tag: 'MAIS POPULAR',
    color: '#2C5FE0',
    bg: 'linear-gradient(135deg, rgba(44,95,224,0.08) 0%, rgba(44,95,224,0.03) 100%)',
    title: 'Agency',
    desc: 'Para gestores de tráfego e consultores que atendem múltiplos clientes.',
    price: 'R$997',
    priceEnd: '/mês',
    features: [
      'Até 8 clientes',
      'Tudo da Plataforma',
      'Conexão Meta + Google Ads',
      'Auditoria automática',
      'Suporte prioritário',
    ],
    highlight: true,
    cta: 'Assinar Agency',
  },
  {
    key: 'enterprise',
    icon: '💎',
    tag: 'ENTERPRISE',
    color: '#0E9E6E',
    title: 'Enterprise',
    desc: 'Para agências e empresas que precisam de escala com IA estratégica.',
    price: 'R$2.997',
    priceEnd: '/mês',
    features: [
      'Até 15 clientes',
      'Tudo do Agency',
      'Múltiplas contas Ads',
      'Relatórios avançados',
      'Acesso API',
      'SLA garantido',
    ],
    highlight: false,
    cta: 'Falar com vendas',
  },
]

export default function PlanosPage() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')

  const handleSubscribe = async (planKey: string) => {
    if (planKey === 'diagnostico') {
      router.push('/diagnostico')
      return
    }
    if (!isSignedIn) {
      router.push('/sign-in?redirect=/planos')
      return
    }
    setLoadingPlan(planKey)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Erro ao iniciar checkout.')
      }
    } catch {
      setError('Erro de conexão.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-canvas px-4 py-12">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-ink-3 hover:text-ink transition-colors"
        >
          ← Voltar
        </button>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Journey Stepper */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {['Diagnóstico', 'Acompanhamento', 'Operação'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i === 0 ? 'bg-green-soft text-green-600' : 'bg-canvas-2 text-ink-3'
              }`}>
                {i + 1}
              </div>
              <span className={`text-sm ${i === 0 ? 'text-ink font-medium' : 'text-ink-3'}`}>
                {step}
              </span>
              {i < 2 && <span className="text-ink-4">→</span>}
            </div>
          ))}
        </div>

        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full mb-4 bg-blue-soft text-blue">
            ⚡ PLANOS ELYON
          </div>
          <h1 className="text-[32px] font-display font-bold text-ink mb-4">
            Escolha seu plano
          </h1>
          <p className="text-ink-2 text-lg max-w-xl mx-auto">
            Inteligência de marketing com IA para transformar dados em decisões e budget em resultados.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <span className={`text-sm ${billingPeriod === 'monthly' ? 'text-ink font-medium' : 'text-ink-3'}`}>
              Mensal
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
              className="relative w-12 h-6 rounded-full bg-canvas-2 border border-line"
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-blue transition-all ${
                billingPeriod === 'annual' ? 'left-7' : 'left-1'
              }`} />
            </button>
            <span className={`text-sm ${billingPeriod === 'annual' ? 'text-ink font-medium' : 'text-ink-3'}`}>
              Anual
            </span>
            <span className="text-xs text-green ml-1">(-20%)</span>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`relative rounded-lg p-5 flex flex-col transition-all hover:shadow-card-hover ${
                plan.highlight ? 'bg-blue-soft border-2 border-blue' : 'bg-paper border border-line'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue text-white">
                    ★ Recomendado
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{plan.icon}</span>
                <span className="text-[10px] font-bold tracking-wider" style={{ color: plan.color }}>
                  {plan.tag}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-ink mb-2">{plan.title}</h2>
              <p className="text-xs text-ink-2 leading-relaxed mb-4">{plan.desc}</p>

              <ul className="space-y-2 mb-4 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-ink-2">
                    <span className="flex-shrink-0 text-green">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="border-t border-line pt-4">
                <div className="text-2xl font-bold text-ink">{plan.price}</div>
                {plan.priceEnd && (
                  <div className="text-xs text-ink-3 mb-3">{plan.priceEnd} · cancele quando quiser</div>
                )}
                <button
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={!!loadingPlan}
                  className={`w-full text-sm font-medium py-2.5 rounded-md transition-colors disabled:opacity-50 ${
                    plan.highlight
                      ? 'bg-blue text-white hover:bg-blue-600'
                      : 'bg-paper border border-line text-ink hover:bg-canvas-2'
                  }`}
                >
                  {loadingPlan === plan.key ? 'Carregando...' : plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="text-center text-red text-sm mb-6 bg-red-soft p-3 rounded-md">
            {error}
          </div>
        )}

        {/* Footer info */}
        <div className="text-center py-6 border-t border-line">
          <div className="flex items-center justify-center gap-6 flex-wrap text-xs text-ink-3">
            <span className="flex items-center gap-1.5">🔒 Pagamento seguro via Stripe</span>
            <span className="flex items-center gap-1.5">↩️ Cancele quando quiser</span>
            <span className="flex items-center gap-1.5">⚡ Acesso imediato após pagamento</span>
          </div>
        </div>
      </div>
    </div>
  )
}
