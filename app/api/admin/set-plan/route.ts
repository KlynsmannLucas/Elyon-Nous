import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

const ALLOWED_PLANS = ['free', 'individual', 'profissional', 'avancada']

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { plan } = await req.json()
  if (!ALLOWED_PLANS.includes(plan)) {
    return NextResponse.json({ error: `Plano inválido. Use: ${ALLOWED_PLANS.join(', ')}` }, { status: 400 })
  }

  const client = await clerkClient()
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { plan },
  })

  return NextResponse.json({ ok: true, userId, plan })
}
