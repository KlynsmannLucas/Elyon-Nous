'use client'
import dynamic from 'next/dynamic'

// ssr: false elimina hydration mismatch — dashboard é autenticado, não precisa de SSR
const DashboardInner = dynamic(() => import('./DashboardInner'), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-[#0A0A0B]" />,
})

export default function DashboardPage() {
  return <DashboardInner />
}
