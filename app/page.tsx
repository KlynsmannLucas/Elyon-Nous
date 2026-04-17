// app/page.tsx — Portão de entrada: login obrigatório
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  const { userId } = auth()

  if (userId) {
    // Já autenticado → vai direto ao dashboard
    redirect('/dashboard')
  }

  // Não autenticado → tela de login
  redirect('/sign-in')
}
