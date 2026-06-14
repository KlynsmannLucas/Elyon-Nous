'use client'
import { useState, useEffect, Suspense } from 'react'
import PerfilPageInner from './PerfilPageInner'

export default function PerfilPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return <div className="min-h-screen bg-[#F4F5F7]" />
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F4F5F7]" />}>
      <PerfilPageInner />
    </Suspense>
  )
}
