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

  // 2. Teste 1: fetch nativo (sem SDK) — isola se é problema de rede ou do SDK
  try {
    const fetchResp = await fetch('https://api.stripe.com/v1/products?limit=1', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${secretKey}` },
    })
    const fetchBody = await fetchResp.json()
    results.fetchTest = {
      status: fetchResp.status,
      ok: fetchResp.ok,
      errorCode: fetchBody?.error?.code,
      errorType: fetchBody?.error?.type,
      errorMsg:  fetchBody?.error?.message,
    }
    if (fetchResp.ok) {
      results.networkOk = true
      results.authOk    = true
      results.stripeMode = secretKey.startsWith('sk_live') ? 'live' : 'test'
    } else if (fetchResp.status === 401) {
      results.networkOk = true
      results.authOk    = false
      results.authError = 'Chave inválida ou incorreta'
    } else {
      results.networkOk = true
      results.authOk    = false
    }
  } catch (fetchErr: any) {
    results.fetchTest = { error: fetchErr.message }
    results.networkOk = false
  }

  // 3. Teste 2: SDK Stripe (apenas se fetch funcionou)
  if (results.networkOk && results.authOk) {
    try {
      const { default: Stripe } = await import('stripe')
      const stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' as any })

      results.stripeConnection = 'ok'

      for (const [key, priceId] of Object.entries({
        individual: priceInd, profissional: priceProf, avancada: priceAdv,
      })) {
        if (!priceId) { results[`price_${key}`] = 'MISSING'; continue }
        try {
          const price = await stripe.prices.retrieve(priceId)
          results[`price_${key}`] = `ok — ${price.currency.toUpperCase()} ${(price.unit_amount || 0) / 100} (${price.recurring?.interval})`
        } catch (e: any) {
          results[`price_${key}`] = `ERRO: ${e.message}`
        }
      }
      return NextResponse.json({ ok: true, results })
    } catch (err: any) {
      results.stripeConnection = 'SDK falhou (mas fetch ok)'
      results.sdkError = err.message
    }
  }

  const isOk = results.networkOk && results.authOk
  return NextResponse.json({ ok: isOk, results }, { status: isOk ? 200 : 500 })
}
