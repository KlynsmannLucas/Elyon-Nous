// app/perfil/layout.tsx — Server Component: auth + pré-carrega dados do usuário
import { redirect } from 'next/navigation'
import { UserDataProvider } from '@/app/dashboard/UserDataProvider'
import type { ServerUserData } from '@/app/dashboard/UserDataProvider'

export default async function PerfilLayout({ children }: { children: React.ReactNode }) {
  let userData: ServerUserData = null

  try {
    const { auth } = await import('@clerk/nextjs/server')
    const { userId } = await auth()

    if (!userId) {
      redirect('/sign-in')
    }

    const { clerkClient } = await import('@clerk/nextjs/server')
    const clerk = clerkClient()
    const u = await clerk.users.getUser(userId)

    const createdAtMs = typeof u.createdAt === 'number'
      ? u.createdAt
      : new Date(u.createdAt as any).getTime()

    const userEmail   = u.emailAddresses[0]?.emailAddress ?? ''
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    const isAdmin     = adminEmails.includes(userEmail.toLowerCase())

    userData = {
      id:        userId,
      firstName: u.firstName,
      lastName:  u.lastName,
      email:     userEmail,
      plan:      isAdmin ? 'avancada' : ((u.publicMetadata as any)?.plan ?? null),
      createdAt: createdAtMs,
    }
  } catch (e: any) {
    if (e?.digest?.startsWith('NEXT_REDIRECT')) throw e
  }

  return (
    <UserDataProvider data={userData}>
      {children}
    </UserDataProvider>
  )
}
