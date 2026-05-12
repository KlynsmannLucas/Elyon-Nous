'use client'
// Versão mínima para testar qual import quebra o chunk
import { useUser } from '@clerk/nextjs'
import { useAppStore } from '@/lib/store'
import { useServerUserData } from './UserDataProvider'

export default function DashboardTest() {
  const { isLoaded } = useUser()
  const serverUser = useServerUserData()
  const clientData = useAppStore((s) => s.clientData)

  return (
    <div style={{ background: 'cyan', color: 'black', minHeight: '100vh', padding: 40, fontSize: 24 }}>
      <h1>DashboardTest carregou!</h1>
      <p>isLoaded: {String(isLoaded)}</p>
      <p>serverUser: {serverUser?.firstName ?? 'null'}</p>
      <p>clientData: {clientData?.clientName ?? 'null'}</p>
    </div>
  )
}
