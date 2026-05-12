'use client'
import { useState, useEffect } from 'react'
import DashboardBody from './DashboardBody'

// DashboardInner: componente mínimo — só gerencia o guard de mount.
// DashboardBody (com todos os hooks pesados) só renderiza após mount no cliente,
// eliminando a falha de hidratação causada por hooks Clerk/Zustand no SSR.
export default function DashboardInner() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return (
    <div suppressHydrationWarning style={{ minHeight: '100vh', background: '#0A0A0B' }} />
  )

  return <DashboardBody />
}
