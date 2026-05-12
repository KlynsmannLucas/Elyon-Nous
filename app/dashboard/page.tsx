'use client'
import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'

const DashboardInner = dynamic(() => import('./DashboardInner'), {
  ssr: false,
  loading: () => (
    <div style={{ background: 'orange', color: 'black', minHeight: '100vh', padding: 40, fontSize: 24 }}>
      Carregando chunk DashboardInner...
    </div>
  ),
})

export default function DashboardPage() {
  console.log('DASHBOARD PAGE RENDER')
  const [chunkError, setChunkError] = useState<string | null>(null)

  useEffect(() => {
    import('./DashboardInner').catch((err) => {
      console.error('CHUNK LOAD ERROR:', err)
      setChunkError(String(err))
    })
  }, [])

  if (chunkError) {
    return (
      <div style={{ background: 'white', color: 'red', minHeight: '100vh', padding: 40 }}>
        <h1>Erro ao carregar chunk DashboardInner</h1>
        <pre>{chunkError}</pre>
      </div>
    )
  }

  return <DashboardInner />
}
