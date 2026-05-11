// app/dashboard/layout.tsx — Server Component: auth + pré-carrega dados do usuário
import { redirect } from 'next/navigation'
import { UserDataProvider } from './UserDataProvider'
import type { ServerUserData } from './UserDataProvider'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let userData: ServerUserData = null

  try {
    const { auth } = await import('@clerk/nextjs/server')
    const { userId } = await auth()

    if (!userId) {
      redirect('/sign-in')
    }

    // Busca dados do usuário server-side — evita flash de "Usuário" no client
    const { clerkClient } = await import('@clerk/nextjs/server')
    const clerk = clerkClient()
    const u = await clerk.users.getUser(userId)

    const createdAtMs = typeof u.createdAt === 'number'
      ? u.createdAt
      : new Date(u.createdAt as any).getTime()

    userData = {
      id:        userId,
      firstName: u.firstName,
      lastName:  u.lastName,
      email:     u.emailAddresses[0]?.emailAddress ?? '',
      plan:      (u.publicMetadata as any)?.plan ?? null,
      createdAt: createdAtMs,
    }
  } catch (e: any) {
    // Propaga redirect — não engole o Next.js redirect error
    if (e?.digest?.startsWith('NEXT_REDIRECT')) throw e
  }

  return (
    <UserDataProvider data={userData}>
      {children}
    </UserDataProvider>
  )
}
