// app/dashboard/layout.tsx — Server Component: auth gate antes do React hidratar
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  return <>{children}</>
}
