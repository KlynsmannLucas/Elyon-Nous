// app/(elyon)/criar/page.tsx — Criar campanha (IA) no v2.
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { TabCriarCampanha } from '@/components/dashboard/TabCriarCampanha'

export default function CriarPage() {
  const router = useRouter()
  const clientData = useAppStore(s => s.clientData)
  const savedClients = useAppStore(s => s.savedClients)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  const cd = clientData ?? savedClients?.[0]?.clientData ?? null
  return <div className="p-4 md:p-6"><TabCriarCampanha clientData={cd} onNavigateToConnections={() => router.push('/integracoes')} /></div>
}
