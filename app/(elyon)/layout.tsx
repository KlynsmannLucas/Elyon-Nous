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
  // Modo compartilhado com o app (persistido no store): pro↔avançado, simple↔simplificado
  const dashboardMode = useAppStore(s => s.dashboardMode)
  const setDashboardMode = useAppStore(s => s.setDashboardMode)
  const mode: 'simplified' | 'advanced' = dashboardMode === 'pro' ? 'advanced' : 'simplified'

  const area = (pathname?.split('/')[1] || 'hoje') as AreaKey
  const activeArea: AreaKey = TITLES[area] ? area : 'hoje'

  const [period, setPeriod] = useState('30d')
  const [collapsed, setCollapsed] = useState(false)
  const [nousOpen, setNousOpen] = useState(false)
  const [wide, setWide] = useState(true)
  const [credits, setCredits] = useState<number | undefined>(undefined)

  // Créditos de IA restantes (topbar)
  useEffect(() => {
    fetch('/api/credits').then(r => (r.ok ? r.json() : null)).then(d => {
      if (d && typeof d.remaining === 'number') setCredits(d.remaining)
    }).catch(() => {})
  }, [])

  // Restaura conexões OAuth do servidor (persistência por usuário) + processa
  // o retorno do OAuth (?oauth_success=1) feito a partir do v2.
  useEffect(() => {
    const restore = () => {
      fetch('/api/connections')
        .then(r => (r.ok ? r.json() : { connections: [] }))
        .then(({ connections }) => {
          if (!Array.isArray(connections)) return
          const cur = useAppStore.getState().connectedAccounts
          for (const conn of connections) {
            if (!cur.some(c => c.platform === conn.platform)) useAppStore.getState().connectAccount(conn)
          }
        })
        .catch(() => {})
    }
    restore()
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('oauth_success') === '1') {
      window.history.replaceState({}, '', window.location.pathname)
      setTimeout(restore, 600) // dá tempo do callback persistir antes do refetch
    }
  }, [])

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
          onModeChange={(m) => setDashboardMode(m === 'advanced' ? 'pro' : 'simple')}
          period={period}
          onPeriodChange={setPeriod}
          clients={clients}
          activeClient={activeId}
          onClientChange={(id) => loadSavedClient(id)}
          credits={credits}
          onOpenCredits={() => router.push('/config')}
          onOpenNous={() => setNousOpen(true)}
        />
        <main className="flex-1 overflow-y-auto bg-canvas">{children}</main>
      </div>

      <NousRail open={nousOpen} onClose={() => setNousOpen(false)} docked={wide} />
    </div>
  )
}
