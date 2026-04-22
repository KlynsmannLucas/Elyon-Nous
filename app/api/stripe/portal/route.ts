// app/api/stripe/portal/route.ts — Abre portal de gerenciamento de assinatura
import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe'

export async function POST(_req: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const user = await currentUser()
    const stripeCustomerId = user?.publicMetadata?.stripeCustomerId as string | undefined

    if (!stripeCustomerId) {
      return NextResponse.json({ error: 'Sem assinatura ativa.' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://elyon-nous.vercel.app'
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${appUrl}/dashboard`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
