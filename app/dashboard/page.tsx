'use client'
import dynamic from 'next/dynamic'

const DashboardTest = dynamic(() => import('./DashboardTest'), {
  ssr: false,
  loading: () => (
    <div style={{ background: 'orange', color: 'black', minHeight: '100vh', padding: 40, fontSize: 24 }}>
      Carregando chunk mínimo...
    </div>
  ),
})

export default function DashboardPage() {
  return <DashboardTest />
}
