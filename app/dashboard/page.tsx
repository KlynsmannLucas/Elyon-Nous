'use client'
import { lazy, Suspense } from 'react'

// Testa React.lazy nativo em vez de next/dynamic
const DashboardTest = lazy(() => import('./DashboardTest'))

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div style={{ background: 'purple', color: 'white', minHeight: '100vh', padding: 40, fontSize: 24 }}>
        React.lazy carregando...
      </div>
    }>
      <DashboardTest />
    </Suspense>
  )
}
