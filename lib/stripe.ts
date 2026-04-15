// lib/stripe.ts — Stripe client e definições de planos
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

export type PlanKey = 'individual' | 'profissional' | 'avancada'

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
    priceId: process.env.STRIPE_PRICE_INDIVIDUAL!,
    price: 'R$197',
    priceEnd: '/mês',
    maxClients: 1,
    features: ['1 cliente ativo', 'Estratégias por IA', 'NOUS chat', 'Diagnóstico básico', 'Histórico de campanhas'],
  },
  profissional: {
    name: 'Profissional',
    priceId: process.env.STRIPE_PRICE_PROFISSIONAL!,
    price: 'R$497',
    priceEnd: '/mês',
    maxClients: 10,
    features: ['Até 10 clientes', 'Tudo do Individual', 'Conexão Meta + Google Ads', 'Diagnóstico avançado', 'Suporte prioritário'],
  },
  avancada: {
    name: 'Avançada',
    priceId: process.env.STRIPE_PRICE_AVANCADA!,
    price: 'R$1.497',
    priceEnd: '/mês',
    maxClients: 999,
    features: ['Clientes ilimitados', 'Tudo do Profissional', 'Múltiplas contas Ads', 'Relatórios avançados', 'Acesso API'],
  },
}
