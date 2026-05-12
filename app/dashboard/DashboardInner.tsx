'use client'

import { useEffect, useState } from 'react'

export default function DashboardInner() {
  const [mounted, setMounted] = useState(false)

  console.log('DASHBOARD INNER RENDER', { mounted })

  useEffect(() => {
    console.log('DASHBOARD INNER EFFECT RAN')
    document.body.style.background = 'white'
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div
        id="pre-mount-test"
        style={{
          minHeight: '100vh',
          background: '#000',
          color: '#fff',
          padding: 40,
          fontSize: 32,
          fontFamily: 'monospace',
        }}
      >
        PRE-MOUNT STATIC TEST
      </div>
    )
  }

  return (
    <div
      id="post-mount-test"
      style={{
        minHeight: '100vh',
        background: 'lime',
        color: 'black',
        padding: 40,
        fontSize: 32,
        fontFamily: 'monospace',
        fontWeight: 'bold',
      }}
    >
      POST-MOUNT TEST — USEEFFECT RODOU
    </div>
  )
}
