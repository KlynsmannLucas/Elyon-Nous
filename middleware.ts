import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isAuthRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/sso-callback(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  const url = new URL(req.url)

  // ?logout=1 → usuário acabou de pedir sign-out; deixa chegar na tela de login
  // mesmo que o cookie de sessão ainda exista (signOut() é assíncrono)
  if (url.searchParams.get('logout') === '1') return

  // Usuário já logado tentando ir para sign-in/sign-up → manda pro dashboard
  if (userId && isAuthRoute(req)) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
