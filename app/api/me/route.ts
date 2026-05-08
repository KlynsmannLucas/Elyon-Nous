// app/api/me/route.ts — retorna dados do usuário via server-side (sem depender do Clerk JS)
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ user: null }, { status: 401 })

    const { clerkClient } = await import('@clerk/nextjs/server')
    const clerk = await clerkClient()
    const u = await clerk.users.getUser(userId)

    const createdAtMs = typeof u.createdAt === 'number'
      ? u.createdAt
      : new Date(u.createdAt as any).getTime()

    return NextResponse.json({
      user: {
        id:        userId,
        firstName: u.firstName,
        lastName:  u.lastName,
        email:     u.emailAddresses[0]?.emailAddress ?? '',
        plan:      (u.publicMetadata as any)?.plan ?? null,
        createdAt: createdAtMs,
      },
    })
  } catch {
    return NextResponse.json({ user: null }, { status: 500 })
  }
}
