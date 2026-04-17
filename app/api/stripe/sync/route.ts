// app/api/stripe/sync/route.ts
// Busca assinatura ativa do usuário direto no Stripe e sincroniza com Clerk.
// Usado quando o webhook falhou ou o JWT ainda está cacheado.
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe'

// trim() obrigatório — env vars no Vercel podem ter \n acidental no final
const PRICE_TO_PLAN: Record<string, string> = {
  [(process.env.STRIPE_PRICE_INDIVIDUAL   || '').trim()]: 'individual',
  [(process.env.STRIPE_PRICE_PROFISSIONAL || '').trim()]: 'profissional',
  [(process.env.STRIPE_PRICE_AVANCADA     || '').trim()]: 'avancada',
}

export async function POST() {
  try {
    const { userId } = auth()
    if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { clerkClient } = await import('@clerk/nextjs/server')
    const clerkUser = await clerkClient().users.getUser(userId)
    const email = clerkUser.emailAddresses?.[0]?.emailAddress

    if (!email) return NextResponse.json({ error: 'Email não encontrado' }, { status: 400 })

    // Busca clientes Stripe pelo email
    const customers = await stripe.customers.list({ email, limit: 5 })
    if (!customers.data.length) {
      return NextResponse.json({ plan: null, message: 'Nenhuma assinatura encontrada para este email.' })
    }

    // Busca assinaturas ativas de todos os customers encontrados
    let activePlan: string | null = null
    let stripeCustomerId: string | null = null

    for (const customer of customers.data) {
      const subs = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'active',
        limit: 5,
      })

      for (const sub of subs.data) {
        // Tenta 1: mapeamento por price ID
        for (const item of sub.items.data) {
          const plan = PRICE_TO_PLAN[item.price.id.trim()]
          if (plan) {
            activePlan = plan
            stripeCustomerId = customer.id
            break
          }
        }

        // Tenta 2: fallback pelo metadata da subscription (definido no checkout)
        if (!activePlan && sub.metadata?.plan) {
          const validPlans = ['individual', 'profissional', 'avancada']
          if (validPlans.includes(sub.metadata.plan)) {
            activePlan = sub.metadata.plan
            stripeCustomerId = customer.id
          }
        }

        if (activePlan) break
      }
      if (activePlan) break
    }

    if (!activePlan) {
      return NextResponse.json({ plan: null, message: 'Nenhuma assinatura ativa encontrada.' })
    }

    // Atualiza Clerk com o plano encontrado
    await clerkClient().users.updateUserMetadata(userId, {
      publicMetadata: {
        plan: activePlan,
        stripeCustomerId,
        planUpdatedAt: new Date().toISOString(),
        planSyncedManually: true,
      },
    })

    return NextResponse.json({ success: true, plan: activePlan })
  } catch (error: any) {
    console.error('Stripe sync error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
