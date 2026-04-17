// lib/stripe.ts — Stripe client e definições de planos
import Stripe from 'stripe'

export type PlanKey = 'individual' | 'profissional' | 'avancada'

// Inicialização lazy — evita erro de build no Vercel quando env var não está disponível
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY?.trim()
    if (!key) throw new Error('STRIPE_SECRET_KEY não configurado')
    _stripe = new Stripe(key, { apiVersion: '2026-03-25.dahlia' })
  }
  return _stripe
}

// Mantém compatibilidade com código existente
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as any)[prop]
  },
})

export const PLANS: Record<PlanKey, {
  name: string
  priceId: string
  price: string
  priceEnd: string
  maxClients: number
  features: string[]
}> = {
  individual: {
    name: 'Individual',
    priceId: (process.env.STRIPE_PRICE_INDIVIDUAL || '').trim(),
    price: 'R$197',
    priceEnd: '/mês',
    maxClients: 1,
    features: ['1 cliente ativo', 'Estratégias por IA', 'NOUS chat', 'Diagnóstico básico', 'Histórico de campanhas'],
  },
  profissional: {
    name: 'Profissional',
    priceId: (process.env.STRIPE_PRICE_PROFISSIONAL || '').trim(),
    price: 'R$497',
    priceEnd: '/mês',
    maxClients: 10,
    features: ['Até 10 clientes', 'Tudo do Individual', 'Conexão Meta + Google Ads', 'Diagnóstico avançado', 'Suporte prioritário'],
  },
  avancada: {
    name: 'Avançada',
    priceId: (process.env.STRIPE_PRICE_AVANCADA || '').trim(),
    price: 'R$1.497',
    priceEnd: '/mês',
    maxClients: 999,
    features: ['Clientes ilimitados', 'Tudo do Profissional', 'Múltiplas contas Ads', 'Relatórios avançados', 'Acesso API'],
  },
}
