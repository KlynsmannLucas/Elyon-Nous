// app/(elyon)/layout.tsx — Shell do redesign v2 (light).
// Monta Sidebar (6+2) + Topbar + NOUS rail ao redor de todas as áreas
// (/hoje, /desempenho, /diagnostico, /mercado, /plano, /relatorios,
// /integracoes, /config). Route group "(elyon)" não altera as URLs.
'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { SidebarV2, TopbarV2, NousRail, type AreaKey } from '@/components/dashboard/v2'

const TITLES: Record<AreaKey, string> = {
  hoje: 'Hoje', desempenho: 'Desempenho', diagnostico: 'Diagnóstico', mercado: 'Mercado',
  plano: 'Plano de Ação', relatorios: 'Relatórios', integracoes: 'Integrações', config: 'Configurações',
}

export default function ElyonShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const savedClients = useAppStore(s => s.savedClients)
  const clientData   = useAppStore(s => s.clientData)
  const loadSavedClient = useAppStore(s => s.loadSavedClient)

  const area = (pathname?.split('/')[1] || 'hoje') as AreaKey
  const activeArea: AreaKey = TITLES[area] ? area : 'hoje'

  const [mode, setMode] = useState<'simplified' | 'advanced'>('advanced')
  const [period, setPeriod] = useState('30d')
  const [collapsed, setCollapsed] = useState(false)
  const [nousOpen, setNousOpen] = useState(false)
  const [wide, setWide] = useState(true)

  // Persiste o modo
  useEffect(() => {
    try { const m = localStorage.getItem('elyon_v2_mode'); if (m === 'simplified' || m === 'advanced') setMode(m) } catch {}
  }, [])
  useEffect(() => { try { localStorage.setItem('elyon_v2_mode', mode) } catch {} }, [mode])

  // NOUS docked em telas largas (≥1280); drawer abaixo
  useEffect(() => {
    const check = () => { const w = window.innerWidth >= 1280; setWide(w); setNousOpen(w) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const clients = savedClients.map(c => ({ id: c.id, name: c.clientData.clientName }))
  const activeId = savedClients.find(c => c.clientData.clientName === clientData?.clientName)?.id

  return (
    <div className="elyon-v2 flex h-screen overflow-hidden bg-canvas text-ink">
      <SidebarV2
        activeArea={activeArea}
        onChangeArea={(a) => router.push(`/${a}`)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(v => !v)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopbarV2
          title={TITLES[activeArea]}
          mode={mode}
          onModeChange={setMode}
          period={period}
          onPeriodChange={setPeriod}
          clients={clients}
          activeClient={activeId}
          onClientChange={(id) => loadSavedClient(id)}
          onOpenNous={() => setNousOpen(true)}
        />
        <main className="flex-1 overflow-y-auto bg-canvas">{children}</main>
      </div>

      <NousRail open={nousOpen} onClose={() => setNousOpen(false)} docked={wide} />
    </div>
  )
}
