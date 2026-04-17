// app/api/stripe/invoices/route.ts — Lista faturas do usuário via Stripe
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe'

export async function GET() {
  try {
    const { userId } = auth()
    if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { clerkClient } = await import('@clerk/nextjs/server')
    const clerkUser = await clerkClient().users.getUser(userId)

    // Tenta usar stripeCustomerId salvo no metadata primeiro
    const stripeCustomerId = (clerkUser.publicMetadata as any)?.stripeCustomerId as string | undefined
    const email = clerkUser.emailAddresses[0]?.emailAddress

    let customerId = stripeCustomerId

    // Se não tiver ID salvo, busca pelo email
    if (!customerId && email) {
      const customers = await stripe.customers.list({ email, limit: 1 })
      if (customers.data.length) {
        customerId = customers.data[0].id
      }
    }

    if (!customerId) {
      return NextResponse.json({ invoices: [] })
    }

    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 24,
      expand: ['data.lines'],
    })

    const data = invoices.data.map((inv) => ({
      id: inv.id,
      number: inv.number || inv.id,
      date: inv.created,
      amount: inv.amount_paid,
      currency: inv.currency,
      status: inv.status,
      pdfUrl: inv.invoice_pdf,
      hostedUrl: inv.hosted_invoice_url,
      description:
        inv.lines?.data[0]?.description ||
        (inv as any).description ||
        'Assinatura ELYON',
    }))

    return NextResponse.json({ invoices: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
