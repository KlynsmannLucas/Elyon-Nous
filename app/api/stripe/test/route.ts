// app/api/stripe/test/route.ts — Diagnóstico da conexão Stripe (temporário)
import { NextResponse } from 'next/server'

export async function GET() {
  const results: Record<string, any> = {}

  // 1. Verifica env vars (com trim para remover \n acidental)
  const secretKey   = process.env.STRIPE_SECRET_KEY?.trim() || ''
  const priceInd    = process.env.STRIPE_PRICE_INDIVIDUAL?.trim() || ''
  const priceProf   = process.env.STRIPE_PRICE_PROFISSIONAL?.trim() || ''
  const priceAdv    = process.env.STRIPE_PRICE_AVANCADA?.trim() || ''

  results.hasSecretKey         = !!secretKey
  results.secretKeyPrefix      = secretKey.slice(0, 12) + '...'
  results.keyHadTrailingNewline = (process.env.STRIPE_SECRET_KEY || '').endsWith('\n')
  results.pricesHadNewlines    = [
    process.env.STRIPE_PRICE_INDIVIDUAL,
    process.env.STRIPE_PRICE_PROFISSIONAL,
    process.env.STRIPE_PRICE_AVANCADA,
  ].some(v => v?.endsWith('\n'))
  results.appUrl               = process.env.NEXT_PUBLIC_APP_URL
  results.priceIndividual      = priceInd
  results.priceProfissional    = priceProf
  results.priceAvancada        = priceAdv

  if (!secretKey) {
    return NextResponse.json({ ok: false, error: 'STRIPE_SECRET_KEY não configurada', results })
  }

  // 2. Tenta conectar ao Stripe (usando chaves trimadas)
  try {
    const { default: Stripe } = await import('stripe')
    const stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' as any })

    // Testa conexão listando 1 produto
    const products = await stripe.products.list({ limit: 1 })
    results.stripeConnection = 'ok'
    results.stripeMode = process.env.STRIPE_SECRET_KEY.startsWith('sk_live') ? 'live' : 'test'

    // Valida cada price ID (trimado)
    for (const [key, priceId] of Object.entries({
      individual: priceInd,
      profissional: priceProf,
      avancada: priceAdv,
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
