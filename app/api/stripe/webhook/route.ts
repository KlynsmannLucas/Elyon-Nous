// app/api/stripe/webhook/route.ts — Processa eventos do Stripe e atualiza plano do usuário
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { clerkClient } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')!
  const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim()

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  const client = await clerkClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any
      const userId  = session.metadata?.userId
      const plan    = session.metadata?.plan

      if (userId && plan) {
        await client.users.updateUserMetadata(userId, {
          publicMetadata: { plan, stripeCustomerId: session.customer, planUpdatedAt: new Date().toISOString() },
        })
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub    = event.data.object as any
      const userId = sub.metadata?.userId
      const plan   = sub.metadata?.plan
      const status = sub.status

      if (userId) {
        await client.users.updateUserMetadata(userId, {
          publicMetadata: {
            plan: status === 'active' ? plan : 'free',
            subscriptionStatus: status,
            planUpdatedAt: new Date().toISOString(),
          },
        })
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub    = event.data.object as any
      const userId = sub.metadata?.userId

      if (userId) {
        await client.users.updateUserMetadata(userId, {
          publicMetadata: { plan: 'free', subscriptionStatus: 'canceled' },
        })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
