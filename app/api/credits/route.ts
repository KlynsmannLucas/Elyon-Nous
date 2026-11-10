import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { getCredits } from '@/lib/credits'
import { effectivePlanForUser } from '@/lib/access'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    const plan = effectivePlanForUser(user) || 'free'
    return NextResponse.json(await getCredits(userId, plan))
  } catch {
    return NextResponse.json({ error: 'Serviço de créditos indisponível' }, { status: 503 })
  }
}
// Debit is exclusively server-side inside the operation that delivers the result.
