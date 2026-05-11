// app/api/auth/signout/route.ts — Logout server-side: revoga sessão e redireciona
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
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

  // Usa a origem da própria requisição — nunca vai para localhost em produção
  return NextResponse.redirect(new URL('/sign-in', req.url))
}
