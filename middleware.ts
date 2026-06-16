import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isAuthRoute      = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/sso-callback(.*)'])
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)', '/perfil(.*)', '/planos(.*)',
  // Redesign v2 — áreas autenticadas
  '/hoje(.*)', '/desempenho(.*)', '/diagnostico(.*)', '/mercado(.*)',
  '/plano(.*)', '/relatorios(.*)', '/integracoes(.*)', '/config(.*)', '/novo(.*)',
  '/criar(.*)', '/biblioteca(.*)', '/conteudo(.*)', '/abtest(.*)', '/cro(.*)',
])

export default clerkMiddleware((auth, req) => {
  const { userId } = auth()
  const url = new URL(req.url)

  // ?logout=1 → usuário acabou de pedir sign-out; deixa chegar na tela de login
  if (url.searchParams.get('logout') === '1') return

  // Rota protegida sem autenticação → manda pro sign-in
  if (!userId && isProtectedRoute(req)) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(signInUrl)
  }

  // Usuário logado tentando ir para sign-in/sign-up → manda pra home (redesign)
  if (userId && isAuthRoute(req)) {
    return NextResponse.redirect(new URL('/hoje', req.url))
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
