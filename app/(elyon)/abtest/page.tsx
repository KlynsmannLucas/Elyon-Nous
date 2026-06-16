// app/(elyon)/abtest/page.tsx — TabABTest no v2.
'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { TabABTest } from '@/components/dashboard/TabABTest'

export default function Page() {
  const clientData = useAppStore(s => s.clientData)
  const savedClients = useAppStore(s => s.savedClients)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  const cd = clientData ?? savedClients?.[0]?.clientData ?? null
  return <div className="p-4 md:p-6"><TabABTest clientData={cd} /></div>
}
