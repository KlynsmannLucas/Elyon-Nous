// app/api/auth/signout/route.ts — Logout server-side: revoga sessão e redireciona
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { sessionId } = await auth()
    if (sessionId) {
      const { clerkClient } = await import('@clerk/nextjs/server')
      const clerk = clerkClient()
      await clerk.sessions.revokeSession(sessionId)
    }
  } catch {
    // Mesmo se revogar falhar, redireciona para sign-in
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://elyonnous.com'
  return NextResponse.redirect(`${appUrl}/sign-in`)
}
