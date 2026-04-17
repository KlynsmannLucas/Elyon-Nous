// app/api/stripe/test/route.ts — Diagnóstico da conexão Stripe (temporário)
import { NextResponse } from 'next/server'

export async function GET() {
  const results: Record<string, any> = {}

  // 1. Verifica env vars
  results.hasSecretKey     = !!process.env.STRIPE_SECRET_KEY
  results.secretKeyPrefix  = process.env.STRIPE_SECRET_KEY?.slice(0, 12) + '...'
  results.hasIndividual    = !!process.env.STRIPE_PRICE_INDIVIDUAL
  results.hasProfissional  = !!process.env.STRIPE_PRICE_PROFISSIONAL
  results.hasAvancada      = !!process.env.STRIPE_PRICE_AVANCADA
  results.appUrl           = process.env.NEXT_PUBLIC_APP_URL
  results.priceIndividual  = process.env.STRIPE_PRICE_INDIVIDUAL
  results.priceProfissional = process.env.STRIPE_PRICE_PROFISSIONAL
  results.priceAvancada    = process.env.STRIPE_PRICE_AVANCADA

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ ok: false, error: 'STRIPE_SECRET_KEY não configurada', results })
  }

  // 2. Tenta conectar ao Stripe
  try {
    const { default: Stripe } = await import('stripe')
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' as any })

    // Testa conexão listando 1 produto
    const products = await stripe.products.list({ limit: 1 })
    results.stripeConnection = 'ok'
    results.stripeMode = process.env.STRIPE_SECRET_KEY.startsWith('sk_live') ? 'live' : 'test'

    // Valida cada price ID
    for (const [key, priceId] of Object.entries({
      individual: process.env.STRIPE_PRICE_INDIVIDUAL,
      profissional: process.env.STRIPE_PRICE_PROFISSIONAL,
      avancada: process.env.STRIPE_PRICE_AVANCADA,
    })) {
      if (!priceId) { results[`price_${key}`] = 'MISSING'; continue }
      try {
        const price = await stripe.prices.retrieve(priceId)
        results[`price_${key}`] = `ok — ${price.currency.toUpperCase()} ${price.unit_amount! / 100} (${price.recurring?.interval})`
      } catch (e: any) {
        results[`price_${key}`] = `ERRO: ${e.message}`
      }
    }

    return NextResponse.json({ ok: true, results })
  } catch (err: any) {
    results.stripeConnection = 'FALHOU'
    results.stripeError      = err.message
    results.stripeErrorType  = err.type || err.constructor?.name
    return NextResponse.json({ ok: false, error: err.message, results }, { status: 500 })
  }
}
