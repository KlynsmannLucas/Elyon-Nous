// app/api/stripe/checkout/route.ts — Cria sessão de checkout Stripe
import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { stripe, PLANS, type PlanKey } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()   // auth() é síncrono no Clerk v5
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Valida env var antes de qualquer chamada ao Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY não configurada nas variáveis de ambiente')
      return NextResponse.json({ error: 'Configuração de pagamento ausente. Contate o suporte.' }, { status: 500 })
    }

    const user = await currentUser()
    const body = await req.json() as { plan: PlanKey }
    const plan = body?.plan

    if (!plan || !PLANS[plan]) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }

    const priceId = PLANS[plan].priceId
    if (!priceId || priceId === 'undefined') {
      return NextResponse.json({ error: `Plano "${plan}" não está configurado. Contate o suporte.` }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://elyonnous.com'
    const email  = user?.emailAddresses?.[0]?.emailAddress

    // Reutiliza customer existente se já tiver stripeCustomerId salvo no Clerk
    // Evita duplicatas quando o mesmo usuário acessa o checkout mais de uma vez
    const savedCustomerId = (user?.publicMetadata as any)?.stripeCustomerId as string | undefined
    let stripeCustomer: string | undefined

    if (savedCustomerId) {
      // Verifica se o customer ainda existe no Stripe
      try {
        const existing = await stripe.customers.retrieve(savedCustomerId)
        if (!existing.deleted) stripeCustomer = savedCustomerId
      } catch {
        // Customer não existe mais — cria um novo abaixo
      }
    }

    if (!stripeCustomer && email) {
      // Busca por email antes de criar (evita duplicata se metadado não foi salvo)
      const found = await stripe.customers.list({ email, limit: 1 })
      if (found.data.length > 0) {
        stripeCustomer = found.data[0].id
      } else {
        const created = await stripe.customers.create({
          email,
          metadata: { userId },
        })
        stripeCustomer = created.id
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      ...(stripeCustomer ? { customer: stripeCustomer } : { customer_email: email }),
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/success?plan=${plan}&checkout=ok`,
      cancel_url: `${appUrl}/planos`,
      metadata: { userId, plan },
      subscription_data: {
        metadata: { userId, plan },
      },
      locale: 'pt-BR',
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Checkout error:', err)
    // Mensagem amigável para erros conhecidos
    const msg = err.type === 'StripeInvalidRequestError'
      ? `Erro no Stripe: ${err.message}`
      : err.code === 'resource_missing'
      ? 'ID de preço não encontrado no Stripe. Verifique as variáveis STRIPE_PRICE_*.'
      : err.message || 'Erro desconhecido ao criar checkout.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
