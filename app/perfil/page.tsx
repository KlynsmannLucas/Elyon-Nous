'use client'
import { useState, useEffect } from 'react'
import PerfilPageInner from './PerfilPageInner'

export default function PerfilPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return <div className="min-h-screen bg-[#0A0A0B]" />
  return <PerfilPageInner />
}
