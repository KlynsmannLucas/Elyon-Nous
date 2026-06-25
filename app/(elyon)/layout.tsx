// app/(elyon)/layout.tsx — Shell do redesign v2 (light).
// Monta Sidebar (6+2) + Topbar + NOUS rail ao redor de todas as áreas
// (/hoje, /desempenho, /diagnostico, /mercado, /plano, /relatorios,
// /integracoes, /config). Route group "(elyon)" não altera as URLs.
'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useUser, useClerk } from '@clerk/nextjs'
import { useAppStore } from '@/lib/store'
import { SidebarV2, TopbarV2, NousRail, NousOrb, StudioTabs, STUDIO_ROUTES, ToastProvider, type AreaKey } from '@/components/dashboard/v2'

const TITLES: Record<AreaKey, string> = {
  hoje: 'Hoje', desempenho: 'Desempenho', diagnostico: 'Diagnóstico', mercado: 'Mercado',
  plano: 'Plano de Ação', relatorios: 'Relatórios',
  estudio: 'Estúdio de Criação',
  criar: 'Criar campanha', biblioteca: 'Biblioteca', conteudo: 'Conteúdo', abtest: 'Teste A/B', cro: 'Otimização (CRO)',
  financeiro: 'Financeiro', integracoes: 'Integrações', config: 'Configurações',
}
const SUBTITLES: Record<AreaKey, string> = {
  hoje: 'Seu resumo diário e próximas ações', desempenho: 'Campanhas, canais, criativos e funil',
  diagnostico: 'Saúde do negócio, gargalos e causas', mercado: 'Concorrência, benchmarks e oportunidades',
  plano: 'Execução priorizada por impacto', relatorios: 'Gere e compartilhe resultados',
  estudio: 'Crie, teste e otimize — guiado pelo NOUS',
  criar: 'Descreva e o NOUS monta sua campanha', biblioteca: 'Criativos, assets e geração de copy com IA',
  conteudo: 'Ideias de posts geradas por IA', abtest: 'Compare variações e ache o vencedor', cro: 'Gargalos de conversão e ações com impacto no CPL',
  financeiro: 'Receita da agência e honorários', integracoes: 'Suas fontes de dados conectadas', config: 'Workspace e preferências',
}

export default function ElyonShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const savedClients = useAppStore(s => s.savedClients)
  const clientData   = useAppStore(s => s.clientData)
  const loadSavedClient = useAppStore(s => s.loadSavedClient)
  const globalPeriod = useAppStore(s => s.globalPeriod)
  const setGlobalPeriod = useAppStore(s => s.setGlobalPeriod)
  const pendingActionsCache = useAppStore(s => s.pendingActionsCache)
  const auditCache = useAppStore(s => s.auditCache)
  const connectedAccounts = useAppStore(s => s.connectedAccounts)
  const selectedMetaAccountByClient = useAppStore(s => s.selectedMetaAccountByClient)
  const selectedGoogleAccountByClient = useAppStore(s => s.selectedGoogleAccountByClient)
  const PLATFORM_LABEL: Record<string, string> = { meta: 'Meta Ads', google: 'Google Ads' }
  const syncPlatforms = Array.from(new Set(connectedAccounts.map(a => PLATFORM_LABEL[a.platform] || a.platform)))
  // Modo compartilhado com o app (persistido no store): pro↔avançado, simple↔simplificado
  const dashboardMode = useAppStore(s => s.dashboardMode)
  const setDashboardMode = useAppStore(s => s.setDashboardMode)

  // Sincroniza a conta de anúncio escolhida POR cliente para o servidor (extra_data do
  // client). A seleção vive no localStorage; o cron do Pulse/daily-snapshot precisa dela
  // para isolar os dados por cliente. Roda na carga (migra seleções antigas) e a cada mudança.
  useEffect(() => {
    const names = Array.from(new Set([...Object.keys(selectedMetaAccountByClient), ...Object.keys(selectedGoogleAccountByClient)]))
    if (!names.length) return
    const selections: Record<string, { meta: string | null; google: string | null }> = {}
    for (const n of names) selections[n] = { meta: selectedMetaAccountByClient[n] || null, google: selectedGoogleAccountByClient[n] || null }
    const t = setTimeout(() => {
      fetch('/api/clients/account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ selections }) }).catch(() => {})
    }, 900)
    return () => clearTimeout(t)
  }, [selectedMetaAccountByClient, selectedGoogleAccountByClient])
  const mode: 'simplified' | 'advanced' = dashboardMode === 'pro' ? 'advanced' : 'simplified'

  const area = (pathname?.split('/')[1] || 'hoje') as AreaKey
  const activeArea: AreaKey = TITLES[area] ? area : 'hoje'

  const { user } = useUser()
  const { signOut } = useClerk()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [nousOpen, setNousOpen] = useState(false)
  const [wide, setWide] = useState(true)
  const [credits, setCredits] = useState<number | undefined>(undefined)
  const [plan, setPlan] = useState<string | undefined>(undefined)

  const userName = user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'Você'

  // Créditos de IA restantes (topbar)
  useEffect(() => {
    fetch('/api/credits').then(r => (r.ok ? r.json() : null)).then(d => {
      if (d && typeof d.remaining === 'number') setCredits(d.remaining)
      if (d?.plan) setPlan(String(d.plan))
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

  // Restaura os CLIENTES do Supabase (fonte da verdade, isolada por user_id).
  // Corrige "clientes sumiram": se o localStorage foi limpo/evictado ou estourou
  // a cota, os clientes voltam do banco em vez de aparecerem como conta vazia.
  useEffect(() => {
    fetch('/api/clients')
      .then(r => (r.ok ? r.json() : { clients: [] }))
      .then(({ clients }) => {
        const server = Array.isArray(clients) ? clients : []
        if (server.length === 0) return // server vazio/erro transitório → NÃO apaga o local
        const st = useAppStore.getState()
        // Base = server (restaura os que sumiram); local sobrepõe (mantém edições/recém-criados).
        const byId = new Map<string, any>()
        for (const c of server) byId.set(c.id, { id: c.id, clientData: c.clientData, strategyData: c.strategyData ?? null, savedAt: c.savedAt })
        for (const c of st.savedClients) byId.set(c.id, c)
        st.setSavedClients(Array.from(byId.values()))
        // Restaura o auditCache do servidor (local da sessão tem precedência).
        const auditRestored: Record<string, any[]> = {}
        for (const c of server) {
          const name = c.clientData?.clientName
          if (name && c.auditData) auditRestored[name] = Array.isArray(c.auditData) ? c.auditData : [c.auditData]
        }
        if (Object.keys(auditRestored).length) {
          useAppStore.setState(s => ({ auditCache: { ...auditRestored, ...s.auditCache } }))
        }
      })
      .catch(() => {})
  }, [])

  // NOUS docked em telas largas (≥1280); drawer abaixo
  useEffect(() => {
    const check = () => { const w = window.innerWidth >= 1280; setWide(w); setNousOpen(w) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Fecha o drawer da sidebar ao navegar (mobile).
  useEffect(() => { setMobileNav(false) }, [pathname])

  const clients = savedClients.map(c => ({ id: c.id, name: c.clientData.clientName }))
  const activeId = savedClients.find(c => c.clientData.clientName === clientData?.clientName)?.id

  // Notificações reais derivadas das ações pendentes + alertas da última auditoria.
  const nkey = clientData?.clientName || savedClients?.[0]?.clientData?.clientName || ''
  const URG_TONE: Record<string, 'bad' | 'warn' | 'blue'> = { critica: 'bad', alta: 'warn', media: 'blue', baixa: 'blue' }
  const pendingNotifs = (pendingActionsCache[nkey] || [])
    .filter((a: any) => a.status === 'pendente')
    .slice(0, 6)
    .map((a: any) => ({
      id: a.id, tone: URG_TONE[a.urgency] || 'blue', title: a.title,
      body: typeof a.impact === 'string' ? a.impact : a.evidence, when: undefined, area: 'plano', read: false,
    }))

  // #4 Alertas proativos — insights ao vivo das campanhas (severidade alta) viram notificação.
  const [insightNotifs, setInsightNotifs] = useState<any[]>([])
  useEffect(() => {
    const metaConn = connectedAccounts.some(a => a.platform === 'meta')
    // Isolamento por cliente: usa SÓ a conta de anúncio que ESTE cliente selecionou.
    // Sem conta própria selecionada, não busca nada — senão o servidor cairia na conta
    // padrão do usuário (que pertence a outro cliente) e vazaria dados cruzados.
    const accId = nkey ? selectedMetaAccountByClient[nkey] : ''
    if (!metaConn || !nkey || !accId) { setInsightNotifs([]); return }
    let active = true
    fetch('/api/insights', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ niche: clientData?.niche, accountId: accId, strict: true, ticket: clientData?.ticketPrice, margin: clientData?.grossMargin, convRate: clientData?.conversionRate }) })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!active || !d?.success) return
        setInsightNotifs((d.insights || [])
          .filter((i: any) => i.tone === 'bad' || i.tone === 'warn')
          .slice(0, 4)
          .map((i: any, idx: number) => ({ id: `insight_${idx}`, tone: i.tone, title: i.title, body: i.body, area: 'desempenho', read: false })))
      })
      .catch(() => {})
    return () => { active = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nkey, clientData?.niche, connectedAccounts.length, nkey ? selectedMetaAccountByClient[nkey] : ''])

  // Insights de campanha (tempo real) primeiro; depois as ações pendentes.
  const notifications = [...insightNotifs, ...pendingNotifs].slice(0, 8)

  // Apagar cliente: remove do servidor (não volta na hidratação) + do store; se era
  // o ativo, troca pro primeiro restante (ou vai criar um novo se não sobrar nenhum).
  const onDeleteClient = (id: string) => {
    const st = useAppStore.getState()
    const target = st.savedClients.find(c => c.id === id)
    if (!target) return
    const wasActive = st.clientData?.clientName === target.clientData.clientName
    fetch('/api/clients', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }).catch(() => {})
    st.deleteSavedClient(id)
    if (wasActive) {
      const remaining = useAppStore.getState().savedClients
      if (remaining[0]) st.loadSavedClient(remaining[0].id)
      else router.push('/novo')
    }
    if (typeof window !== 'undefined') window.toast?.({ tone: 'good', title: 'Cliente apagado', body: target.clientData.clientName })
  }

  // Rotas com TELA PRÓPRIA (full-screen, sem sidebar/topbar/NOUS rail): wizard de
  // criação e o "Meu primeiro anúncio".
  const BARE_ROUTES = ['/novo', '/primeiro-anuncio']
  if (BARE_ROUTES.includes(pathname || '')) {
    return (
      <ToastProvider>
        <div className="elyon-v2 min-h-screen bg-canvas text-ink overflow-y-auto">{children}</div>
      </ToastProvider>
    )
  }

  return (
    <ToastProvider>
      <div className="elyon-v2 flex h-screen overflow-hidden bg-canvas text-ink">
        <SidebarV2
          activeArea={activeArea}
          onChangeArea={(a) => router.push(`/${a}`)}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(v => !v)}
          clients={clients}
          activeClientId={activeId}
          onClientChange={(id) => loadSavedClient(id)}
          onNewClient={() => router.push('/novo')}
          onDeleteClient={onDeleteClient}
          userName={userName}
          userPlan={plan}
          onLogout={() => signOut(() => router.push('/'))}
          mobileOpen={mobileNav}
          onMobileClose={() => setMobileNav(false)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <TopbarV2
            onMenu={() => setMobileNav(true)}
            title={TITLES[activeArea]}
            subtitle={activeArea === 'diagnostico' ? `${SUBTITLES[activeArea]} · ${globalPeriod.label}` : SUBTITLES[activeArea]}
            mode={mode}
            onModeChange={(m) => { setDashboardMode(m === 'advanced' ? 'pro' : 'simple'); if (typeof window !== 'undefined') window.toast?.({ tone: 'blue', title: m === 'advanced' ? 'Modo Avançado' : 'Modo Simplificado' }) }}
            showPeriod={activeArea === 'diagnostico'}
            period={globalPeriod.label}
            onPeriodChange={() => {}}
            onSelectPeriod={(p) => { setGlobalPeriod(p); if (typeof window !== 'undefined') window.toast?.({ tone: 'blue', title: 'Período atualizado', body: p.label }) }}
            credits={credits}
            onOpenCredits={() => router.push('/config')}
            onOpenNous={() => setNousOpen(true)}
            notifications={notifications}
            onNavigate={(a) => router.push(`/${a}`)}
            syncPlatforms={syncPlatforms}
          />
          <main className="flex-1 overflow-y-auto bg-canvas">
          <div className="mx-auto" style={{ maxWidth: 1240 }}>
            {STUDIO_ROUTES.includes(activeArea) && (
              <div className="px-4 md:px-6 pt-5"><StudioTabs /></div>
            )}
            {children}
          </div>
        </main>
        </div>

        <NousRail open={nousOpen} onClose={() => setNousOpen(false)} docked={wide} />

        {/* Orb flutuante — reabre o NOUS quando recolhido */}
        {!nousOpen && (
          <button onClick={() => setNousOpen(true)} title="Perguntar ao NOUS"
            className="fixed right-5 bottom-5 z-[120] flex items-center gap-2.5 pl-3.5 pr-2 py-2 rounded-pill bg-paper border border-line shadow-pop hover:shadow-highlight transition-shadow scale-in">
            <span className="text-[13px] font-semibold text-ink">Perguntar ao NOUS</span>
            <NousOrb size={34} />
          </button>
        )}
      </div>
    </ToastProvider>
  )
}
