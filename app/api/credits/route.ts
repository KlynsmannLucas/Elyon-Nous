// app/api/credits/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { getCredits, checkAndDeductCredits } from '@/lib/credits'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const user = await currentUser()
  const plan = ((user?.publicMetadata as any)?.plan as string) || 'free'
  const data = await getCredits(userId, plan)
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const user = await currentUser()
  const plan = ((user?.publicMetadata as any)?.plan as string) || 'free'
  const { operation } = await req.json() as { operation: string }

  const result = await checkAndDeductCredits(userId, plan, operation)

  if (!result.allowed) {
    return NextResponse.json({ error: result.error, ...result }, { status: 402 })
  }

  return NextResponse.json(result)
}
