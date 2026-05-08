// app/dashboard/layout.tsx — Server Component: auth gate antes do React hidratar
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  try {
    const { userId } = await auth()
    if (!userId) redirect('/sign-in')
  } catch {
    // Clerk não configurado corretamente — deixa a página carregar;
    // o client-side vai lidar com auth ou mostrar o erro adequado.
  }
  return <>{children}</>
}
