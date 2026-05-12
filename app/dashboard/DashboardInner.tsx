'use client'
import { useState, useEffect } from 'react'
import DashboardBody from './DashboardBody'

export default function DashboardInner() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return (
    <div suppressHydrationWarning style={{ minHeight: '100vh', background: '#0A0A0B' }} />
  )

  return <DashboardBody />
}
