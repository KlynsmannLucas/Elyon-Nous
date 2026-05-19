// app/api/auth/signout/route.ts — Logout server-side: revoga sessão, limpa cookies e redireciona
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { sessionId } = await auth()
    if (sessionId) {
      const { clerkClient } = await import('@clerk/nextjs/server')
      const clerk = await clerkClient()
      await clerk.sessions.revokeSession(sessionId)
    }
  } catch {
    // Mesmo se revogar falhar, limpa cookies e redireciona
  }

  const res = NextResponse.redirect(new URL('/sign-in', req.url))

  // Limpa os cookies de sessão do Clerk para que o middleware não redirecione de volta
  res.cookies.set('__session', '', { maxAge: 0, path: '/' })
  res.cookies.set('__client_uat', '', { maxAge: 0, path: '/' })

  return res
}
