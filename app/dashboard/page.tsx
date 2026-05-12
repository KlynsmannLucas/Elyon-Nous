// app/dashboard/page.tsx — Dashboard principal
'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { useServerUserData } from './UserDataProvider'
import { useAppStore } from '@/lib/store'
import type { SavedClient } from '@/lib/store'
import { SetupWizard, type WizardImportData } from '@/components/dashboard/SetupWizard'
import { TabOverview }     from '@/components/dashboard/TabOverview'
import { TabAudiences }    from '@/components/dashboard/TabAudiences'
import { TabStrategy }     from '@/components/dashboard/TabStrategy'
import { TabIntelligence } from '@/components/dashboard/TabIntelligence'
import { TabGrowth }       from '@/components/dashboard/TabGrowth'
import { TabPerformance }  from '@/components/dashboard/TabPerformance'
import { TabDiagnostic }   from '@/components/dashboard/TabDiagnostic'
import { TabAcoes }        from '@/components/dashboard/TabAcoes'
import { TabErrorBoundary } from '@/components/dashboard/ErrorBoundary'
import { TabAnalise }      from '@/components/dashboard/TabAnalise'
import { TabAnuncios }     from '@/components/dashboard/TabAnuncios'
import { TabMarketIntel }  from '@/components/dashboard/TabMarketIntel'
import { TabFunil }        from '@/components/dashboard/TabFunil'
import { TabPersona }      from '@/components/dashboard/TabPersona'
import { TabConteudo }     from '@/components/dashboard/TabConteudo'
import { TabAssets }       from '@/components/dashboard/TabAssets'
import { TabConcorrentes } from '@/components/dashboard/TabConcorrentes'
import { TabCampanha }     from '@/components/dashboard/TabCampanha'
import { TabRelatorios }   from '@/components/dashboard/TabRelatorios'
import { NousChat }        from '@/components/dashboard/NousChat'
import { DashboardSidebar, type TabKey } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopbar } from '@/components/dashboard/DashboardTopbar'
import { TermsModal } from '@/components/dashboard/TermsModal'
import { getPlanLimits, hasActivePlan } from '@/lib/planUtils'

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  individual:   { label: 'Individual',   color: '#38BDF8' },
  profissional: { label: 'Profissional', color: '#F0B429' },
  avancada:     { label: 'Avançada',     color: '#22C55E' },
}

// ── Tela de geração ────────────────────────────────────────────────────────────
function GeneratingScreen({ clientName, niche }: { clientName: string; niche: string }) {
  const steps = [
    'Diagnosticando gargalos e desperdícios no funil...',
    'Calculando CPL e ROAS esperados por canal...',
    'Estruturando TOFU / MOFU / BOFU personalizado...',
    'Definindo o que escalar, testar e cortar...',
    'Montando plano de 90 dias orientado a crescimento...',
  ]
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((s) => Math.min(s + 1, steps.length - 1))
    }, 1400)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.25)' }}>
          <span className="text-3xl animate-pulse">⚡</span>
        </div>
        <h3 className="font-display text-2xl font-bold text-white mb-2">
          Gerando estratégia para {clientName}
        </h3>
        <p className="text-slate-500 text-sm mb-8">{niche}</p>
        <div className="space-y-3">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-left">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all ${
                i < currentStep ? 'bg-[#22C55E] text-black' :
                i === currentStep ? 'bg-[#F0B429] text-black' :
                'bg-[#2A2A30] text-slate-600'
              }`}>
                {i < currentStep ? '✓' : i + 1}
              </span>
              <span className={i <= currentStep ? 'text-slate-200' : 'text-slate-600'}>
                {s}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Score de saúde por cliente ─────────────────────────────────────────────────
function getClientHealthScore(client: SavedClient, auditCache: Record<string, any>): {
  score: number; label: string; color: string; dot: string
} {
  let score = 30
  if (client.strategyData) {
    score += 25
    const ageMs = Date.now() - new Date(client.strategyData.generatedAt || client.savedAt).getTime()
    if (ageMs < 30 * 24 * 3600000) score += 15
  }
  const cacheEntry = auditCache[client.clientData.clientName]
  if (cacheEntry) {
    score += 20
    const latest = Array.isArray(cacheEntry) ? cacheEntry[0]?.audit : cacheEntry
    if (latest?._realMetrics) score += 10
    const alerts: any[] = latest?.alerts || []
    const criticals = alerts.filter((a: any) => a.type === 'critical').length
    score = Math.max(0, score - criticals * 5)
  }
  score = Math.min(100, score)
  if (score >= 75) return { score, label: 'Saudável',  color: '#22C55E', dot: '🟢' }
  if (score >= 45) return { score, label: 'Atenção',   color: '#F0B429', dot: '🟡' }
  return              { score, label: 'Crítico',   color: '#FF4D4D', dot: '🔴' }
}

// ── Seletor de cliente salvo ───────────────────────────────────────────────────
function ClientSelector({
  savedClients,
  onSelect,
  onDelete,
  clientLimitReached,
  maxClients,
  user,
  userPlan,
  auditCache,
}: {
  savedClients: SavedClient[]
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  clientLimitReached?: boolean
  maxClients?: number
  user: any
  userPlan?: string
  auditCache: Record<string, any>
}) {
  const getNicheIcon = (niche: string) => {
    const n = niche.toLowerCase()
    if (n.includes('odonto') || n.includes('saúde') || n.includes('clínica')) return '🦷'
    if (n.includes('financeiro') || n.includes('crédito')) return '💰'
    if (n.includes('imobili')) return '🏠'
    if (n.includes('fitness') || n.includes('academia')) return '💪'
    if (n.includes('beleza') || n.includes('estética')) return '💅'
    if (n.includes('educaç') || n.includes('curso')) return '📚'
    if (n.includes('jurídico') || n.includes('advoc')) return '⚖️'
    if (n.includes('tech') || n.includes('saas')) return '💻'
    if (n.includes('ecommerce') || n.includes('varejo')) return '🛒'
    if (n.includes('marketing') || n.includes('agência')) return '📣'
    if (n.includes('restaurante') || n.includes('food')) return '🍽️'
    if (n.includes('pet')) return '🐾'
    return '📊'
  }

  const userName = user?.firstName || user?.username || user?.emailAddresses?.[0]?.emailAddress || 'Usuário'
  const userEmail = user?.emailAddresses?.[0]?.emailAddress || ''
  const avatarLetter = userName.charAt(0).toUpperCase()
  const plan = userPlan ? PLAN_LABELS[userPlan] : null

  const profileLinks = [
    { icon: '👤', label: 'Dados pessoais',  href: '/perfil?tab=dados' },
    { icon: '📞', label: 'Contatos',         href: '/perfil?tab=contatos' },
    { icon: '💳', label: 'Pagamentos',       href: '/perfil?tab=pagamentos' },
    { icon: '🧾', label: 'Faturas',          href: '/perfil?tab=faturas' },
    { icon: '🔒', label: 'Login e senha',    href: '/perfil?tab=seguranca' },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0B] animate-fade-in">
      <div className="max-w-2xl mx-auto px-6 pt-10 pb-8">

        {/* Header: Logo + logout */}
        <div className="flex items-center justify-between mb-10">
          <span className="font-display font-bold text-2xl" style={{
            background: 'linear-gradient(135deg, #F0B429, #FFD166)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            ELYON
          </span>
          <a
            href="/api/auth/signout"
            title="Sair da conta"
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-red-400 transition-colors px-3 py-2 rounded-xl border border-[#2A2A30] hover:border-red-400/30"
            style={{ textDecoration: 'none' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sair
          </a>
        </div>

        {/* Card do perfil do usuário */}
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5 mb-8">
          <div className="flex items-center gap-4 mb-5">
            {/* Avatar */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-display font-bold text-lg text-black"
              style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)' }}
            >
              {avatarLetter}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white text-sm truncate">{userName}</div>
              <div className="text-xs text-slate-500 truncate mt-0.5">{userEmail}</div>
              {plan && (
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1"
                  style={{ color: plan.color, background: `${plan.color}18`, border: `1px solid ${plan.color}30` }}>
                  {plan.label}
                </span>
              )}
              {!plan && (
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1"
                  style={{ color: '#64748B', background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)' }}>
                  Trial / Sem plano
                </span>
              )}
            </div>
          </div>

          {/* Links do perfil */}
          <div className="grid grid-cols-5 gap-2">
            {profileLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-[#16161A] border border-[#2A2A30] hover:border-[rgba(240,180,41,0.3)] hover:bg-[rgba(240,180,41,0.04)] transition-all text-center group"
              >
                <span className="text-lg">{link.icon}</span>
                <span className="text-[10px] text-slate-500 group-hover:text-slate-300 transition-colors leading-tight">{link.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Título dos clientes */}
        <div className="text-center mb-6">
          <p className="text-slate-400 text-sm font-medium">Selecione um cliente ou crie novo</p>
        </div>

        {/* Clientes salvos */}
        {savedClients.length > 0 && (
          <div className="mb-6">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-3 px-1">
              Clientes salvos
            </div>
            <div className="space-y-2">
              {savedClients.map((sc) => (
                <div
                  key={sc.id}
                  className="flex items-center gap-4 bg-[#111114] border border-[#2A2A30] rounded-2xl p-4 hover:border-[rgba(240,180,41,0.3)] transition-all group"
                >
                  {/* Ícone + info */}
                  <button
                    className="flex items-center gap-4 flex-1 text-left"
                    onClick={() => onSelect(sc.id)}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                      style={{ background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.2)' }}>
                      {getNicheIcon(sc.clientData.niche)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-sm truncate">
                        {sc.clientData.clientName}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {sc.clientData.niche} · R${sc.clientData.budget.toLocaleString('pt-BR')}/mês
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {(() => {
                        const h = getClientHealthScore(sc, auditCache)
                        return (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                            style={{ color: h.color, background: `${h.color}18`, border: `1px solid ${h.color}30` }}
                            title={`Score ${h.score}/100`}>
                            {h.dot} {h.label}
                          </span>
                        )
                      })()}
                      <span className="text-[#F0B429] text-sm opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </div>
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => {
                      if (window.confirm(`Remover "${sc.clientData.clientName}"?\n\nEsta ação não pode ser desfeita.`)) {
                        onDelete(sc.id)
                      }
                    }}
                    className="text-slate-700 hover:text-[#FF4D4D] transition-colors text-lg flex-shrink-0 ml-1"
                    title="Remover cliente"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Criar novo cliente */}
        {clientLimitReached ? (
          <a
            href="/planos"
            className="w-full flex items-center justify-center gap-3 border border-dashed rounded-2xl p-5 transition-all"
            style={{ display: 'flex', textDecoration: 'none', borderColor: 'rgba(255,77,77,0.3)', color: '#FF4D4D' }}
          >
            <span className="text-xl">🔒</span>
            <div className="text-left">
              <span className="text-sm font-semibold block">
                Limite atingido ({maxClients} cliente{maxClients !== 1 ? 's' : ''})
              </span>
              <span className="text-xs opacity-70">Clique para fazer upgrade →</span>
            </div>
          </a>
        ) : (
          <a
            href="/dashboard?new=1"
            className="w-full flex items-center justify-center gap-3 border border-dashed rounded-2xl p-5 transition-all hover:border-[rgba(240,180,41,0.3)] hover:text-slate-300"
            style={{ borderColor: '#2A2A30', color: '#64748B', textDecoration: 'none', display: 'flex' }}
          >
            <span className="text-xl">+</span>
            <span className="text-sm font-semibold">Novo cliente</span>
          </a>
        )}
      </div>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, isLoaded } = useUser()

  // Rehydrata o store do localStorage (skipHydration:true impede auto-hidratação antes do React montar).
  // try/catch protege contra JSON corrompido no localStorage que derrubaria o componente.
  useEffect(() => {
    try { useAppStore.persist.rehydrate() } catch {}
  }, [])

  // Mounted: evita hydration mismatch com Clerk (useUser retorna valores diferentes server vs client).
  // Sem isso, onClick/useEffect não funcionam em produção.
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // Timeout: se Clerk demorar >3s para carregar, continua mesmo sem isLoaded.
  // Usa [] para nunca resetar — se isLoaded oscilar, o timer não é cancelado.
  const [clerkTimeout, setClerkTimeout] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setClerkTimeout(true), 3000)
    return () => clearTimeout(t)
  }, [])

  const termsAccepted = Boolean(user?.publicMetadata?.termsAcceptedAt)
  const [termsAcceptedLocal, setTermsAcceptedLocal] = useState(false)
  useEffect(() => {
    try { setTermsAcceptedLocal(localStorage.getItem('elyon_terms_v1') === '1') } catch {}
  }, [])
  const showTermsModal = isLoaded && user && !termsAccepted && !termsAcceptedLocal

  const TRIAL_DAYS = 14

  const {
    clientData, strategyData, isGenerating,
    setStrategyData, setIsGenerating, clearAll, setWizardStep,
    savedClients, setSavedClients, saveCurrentClient, loadSavedClient, deleteSavedClient,
    campaignHistory,
    recordStrategyGeneration, getStrategyCountLastHour,
    setAuditCache, auditCache, actionPlanCache,
    generatedPersona, connectedAccounts,
  } = useAppStore()

  // ── Helpers de persistência no banco ─────────────────────────────────────────

  /** Coleta todos os dados por-cliente para salvar no campo extra_data */
  const buildExtraData = useCallback((clientName: string) => {
    const s = useAppStore.getState()
    return {
      competitors:      s.competitors[clientName]      ?? [],
      actionPlanCache:  s.actionPlanCache[clientName]  ?? [],
      clientPersona:    s.clientPersonas[clientName]   ?? null,
      nousConversation: s.nousConversations[clientName] ?? [],
      funnelEntries:    s.funnelEntries.filter((e) => e.clientName === clientName),
      campaignHistory:  s.campaignHistory,
      creativeTests:    s.creativeTests,
    }
  }, [])

  /** POST um cliente ao Supabase imediatamente (sem debounce) */
  const saveToDb = useCallback((clientName?: string) => {
    const state = useAppStore.getState()
    const { clientData: cd, savedClients: sc, auditCache: ac } = state
    const name = clientName ?? cd?.clientName
    if (!name) return
    const entry = sc.find((s) => s.clientData.clientName === name)
    if (!entry) return
    fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...entry,
        auditData: ac[name] ?? null,
        extraData: buildExtraData(name),
      }),
    }).catch(() => {})
  }, [buildExtraData])

  // ── User info pré-carregado pelo layout.tsx (server-side, sem fetch extra) ────
  const serverUser = useServerUserData()

  // Sempre usa serverUser para effectiveUser: garante output idêntico no server e no client
  // inicial (antes do Clerk carregar). Operações dinâmicas que precisam do Clerk real
  // (ex: reload após checkout) usam `user` diretamente.
  const effectiveUser = serverUser
    ? {
        firstName:      serverUser.firstName,
        lastName:       serverUser.lastName,
        username:       null as string | null,
        emailAddresses: [{ emailAddress: serverUser.email, id: 'primary' }],
        publicMetadata: { plan: serverUser.plan } as Record<string, unknown>,
        createdAt:      serverUser.createdAt,
        reload:         async () => { try { await (user as any)?.reload?.() } catch {} },
      } as any
    : null

  // Todos os cálculos de plano/trial derivados do effectiveUser (Clerk ou servidor)
  const effectiveUserPlan = effectiveUser?.publicMetadata?.plan as string | undefined
  const rawCreatedAt      = effectiveUser?.createdAt
  const createdAt         = rawCreatedAt instanceof Date
    ? rawCreatedAt.getTime()
    : typeof rawCreatedAt === 'number' ? rawCreatedAt : Date.now()
  const trialMsLeft    = (createdAt + TRIAL_DAYS * 24 * 60 * 60 * 1000) - Date.now()
  const inTrial        = effectiveUser ? trialMsLeft > 0 : false
  const trialDaysLeft  = Math.ceil(trialMsLeft / (24 * 60 * 60 * 1000))
  const hasAccess      = (!isLoaded && !serverUser) ? true : effectiveUser ? (hasActivePlan(effectiveUserPlan) || inTrial) : false
  const effectivePlan  = hasActivePlan(effectiveUserPlan) ? effectiveUserPlan : (inTrial ? 'trial' : 'free')
  const planLimits     = getPlanLimits(effectivePlan)

  // ── Sincronização com banco de dados ──────────────────────────────────────────
  // Roda na montagem sem esperar pelo Clerk JS — auth server-side via cookie de sessão
  const [dbLoaded, setDbLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/clients')
      .then(r => r.ok ? r.json() : { clients: [] })
      .then(({ clients, _dbError }) => {
        if (_dbError) console.warn('[clients sync] DB error:', _dbError)
        if (!Array.isArray(clients) || clients.length === 0) return

        setSavedClients(clients)

        // Restaura auditCache + extraData de todos os clientes
        const auditRestored: Record<string, any[]> = {}
        for (const c of clients) {
          const name: string = c.clientData?.clientName
          if (!name) continue
          if (c.auditData) auditRestored[name] = c.auditData
          if (c.extraData) {
            useAppStore.setState((s) => ({
              competitors:     c.extraData.competitors?.length     ? { ...s.competitors,     [name]: c.extraData.competitors }     : s.competitors,
              actionPlanCache: c.extraData.actionPlanCache?.length  ? { ...s.actionPlanCache, [name]: c.extraData.actionPlanCache }  : s.actionPlanCache,
              clientPersonas:  c.extraData.clientPersona            ? { ...s.clientPersonas,  [name]: c.extraData.clientPersona }    : s.clientPersonas,
              nousConversations: c.extraData.nousConversation?.length ? { ...s.nousConversations, [name]: c.extraData.nousConversation } : s.nousConversations,
              funnelEntries:   c.extraData.funnelEntries?.length    ? [...s.funnelEntries, ...c.extraData.funnelEntries.filter((e: any) => !s.funnelEntries.find((f) => f.id === e.id))] : s.funnelEntries,
              campaignHistory: s.campaignHistory.length === 0 && c.extraData.campaignHistory?.length ? c.extraData.campaignHistory : s.campaignHistory,
              creativeTests:   s.creativeTests.length === 0   && c.extraData.creativeTests?.length   ? c.extraData.creativeTests   : s.creativeTests,
            }))
          }
        }
        if (Object.keys(auditRestored).length > 0) {
          useAppStore.setState((s) => ({ auditCache: { ...s.auditCache, ...auditRestored } }))
        }

        // Sem dados locais (incognito / cache limpo) → carrega o cliente mais recente
        if (!useAppStore.getState().clientData) {
          useAppStore.getState().loadSavedClient(clients[0].id)
        }
      })
      .catch(() => {})
      .finally(() => setDbLoaded(true))
  }, []) // monta uma vez — autenticação garantida pelo layout.tsx server-side

  // Quando o banco carrega e temos cliente+estratégia, vai direto pro dashboard
  // (cobre o caso de incognito / cache limpo onde localStorage estava vazio)
  useEffect(() => {
    if (!dbLoaded) return
    const { clientData: cd, strategyData: sd } = useAppStore.getState()
    if (cd && sd) setView('dashboard')
  }, [dbLoaded])

  // Persiste cliente no banco + localStorage (debounced: máx 1 req/3s)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const persistSave = useCallback(async () => {
    saveCurrentClient() // atualiza localStorage imediatamente
    // Debounce: cancela requisição pendente e agenda nova em 3s
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => saveToDb(), 3000)
  }, [saveCurrentClient, saveToDb])

  // Remove cliente do banco + localStorage
  const persistDelete = useCallback((id: string) => {
    deleteSavedClient(id)
    fetch(`/api/clients/${id}`, { method: 'DELETE' }).catch(() => {})
  }, [deleteSavedClient])

  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setSidebarCollapsed(true)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const [view, setView] = useState<'selector' | 'wizard' | 'dashboard'>('selector')
  const [genError, setGenError] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  // View inicial: lê do store APÓS rehydrate() para ver os dados do localStorage.
  // Usa getState() em vez de variáveis do closure para capturar o estado pós-hidratação.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const { clientData: cd, strategyData: sd, savedClients: sc } = useAppStore.getState()

    // ?new=1 tem prioridade — usuário clicou "Novo cliente" (link <a href>)
    if (params.get('new') === '1') {
      window.history.replaceState({}, '', '/dashboard')
      setView('wizard')
      setWizardStep(0)
    } else if (cd && sd) {
      setView('dashboard')
    } else if (cd || sc.length > 0) {
      setView('selector')
    }
    // Se não há nada local nem no banco ainda, fica em 'selector' (estado inicial padrão)

    if (params.get('checkout') === 'ok' || params.get('checkout') === 'success') {
      user?.reload().then(() => {
        window.history.replaceState({}, '', '/dashboard')
      })
    }
  }, []) // só na montagem — o hook [dbLoaded] cuida do caso assíncrono

  const handleWizardComplete = useCallback(async (importData?: WizardImportData[]) => {
    if (!clientData) return

    if (planLimits.maxStrategiesPerHour > 0 && getStrategyCountLastHour() >= planLimits.maxStrategiesPerHour) {
      setGenError(`Limite de ${planLimits.maxStrategiesPerHour} estratégias por hora atingido. Tente novamente mais tarde.`)
      return
    }

    setIsGenerating(true)
    setGenError('')
    setView('dashboard')

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 58000)
      const res = await fetch('/api/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...clientData,
          campaignHistory,
          recentAudit: clientData ? auditCache[clientData.clientName]?.[0]?.audit ?? null : null,
          persona: generatedPersona,
          metaAccessToken: connectedAccounts.find(a => a.platform === 'meta')?.accessToken ?? null,
        }),
        signal: controller.signal,
      })
      clearTimeout(timeout)

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let json: any = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim()
          if (line.startsWith('data: ')) {
            json = JSON.parse(line.slice(6))
          }
        }
        buffer = lines[lines.length - 1]
        if (json) break
      }

      if (!json) throw new Error('Resposta vazia do servidor.')
      if (!json.success) throw new Error(json.error)

      // Save previous strategy version to audit cache before overwriting
      const prevStrategy = useAppStore.getState().strategyData
      if (prevStrategy && clientData?.clientName) {
        const existingHistory = useAppStore.getState().auditCache[clientData.clientName]
        const existingLatest = Array.isArray(existingHistory) ? existingHistory[0]?.audit : null
        setAuditCache(clientData.clientName, {
          ...(existingLatest || {}),
          _strategyHistory: [
            { strategy: prevStrategy, savedAt: prevStrategy.generatedAt || new Date().toISOString() },
            ...((existingLatest?._strategyHistory || []).slice(0, 4)),
          ],
        })
      }

      setStrategyData({
        analysis: json.strategy,
        strategy: json.strategy,
        adCopy: {},
        audienceSuggestions: {},
        creativeBrief: {},
        generatedAt: new Date().toISOString(),
      })
      recordStrategyGeneration()
      saveCurrentClient() // localStorage imediato
      saveToDb()          // banco imediato (sem debounce — não pode perder o primeiro save)

      // Se o usuário importou arquivos no wizard, auto-executa a auditoria
      if (importData && importData.length > 0) {
        try {
          const uploadedFiles = importData.map(d => ({
            filename: d.filename,
            platform: d.platform,
            campaigns: d.campaigns,
          }))
          const auditRes = await fetch('/api/audit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientName: clientData.clientName,
              niche: clientData.niche,
              budget: clientData.budget,
              objective: clientData.objective,
              uploadedFiles,
            }),
          })
          const auditJson = await auditRes.json()
          if (auditJson.success) {
            setAuditCache(clientData.clientName, auditJson.audit)
            setActiveTab('analise')
          }
        } catch {
          // Auditoria automática falhou — não bloqueia o fluxo principal
        }
      }
    } catch (e: any) {
      setGenError(e.message)
    } finally {
      setIsGenerating(false)
    }
  }, [clientData, setIsGenerating, setStrategyData, persistSave, planLimits, getStrategyCountLastHour, recordStrategyGeneration, setAuditCache, setActiveTab, saveToDb, buildExtraData])

  // Auto-save sempre que a estratégia muda (protege contra perda de dados em refresh)
  useEffect(() => {
    if (clientData && strategyData) {
      persistSave()
    }
  }, [strategyData, clientData, persistSave])

  const handleSelectSaved = (id: string) => {
    const found = loadSavedClient(id)
    if (found) {
      setView('dashboard')
      setActiveTab('overview')
    }
  }

  const handleSaveClient = () => {
    persistSave()
  }

  const [pdfLoading, setPdfLoading] = useState(false)

  const handleExportPDF = useCallback(async (mode: 'executive' | 'full' = 'full') => {
    setPdfLoading(true)
    try {
      const { generatePDF } = await import('@/components/pdf/RelatorioPDF')
      const key = clientData?.clientName || ''
      const auditHistory = auditCache[key]
      const latestAudit  = Array.isArray(auditHistory) ? auditHistory[0]?.audit : auditHistory
      const actions = actionPlanCache[key] || []
      await generatePDF({
        clientData: clientData ?? null,
        strategy:    strategyData?.strategy || {},
        auditData:   latestAudit ?? null,
        actionItems: actions,
      }, mode)
    } catch (e) {
      console.error('Erro PDF:', e)
      alert('Não foi possível gerar o PDF. Tente novamente.')
    } finally {
      setPdfLoading(false)
    }
  }, [clientData, strategyData, auditCache, actionPlanCache])

  const handleReset = () => {
    clearAll()
    // Se só tem 1 cliente salvo e já está no limite, vai direto pro seletor (não wizard vazio)
    setView(savedClients.length > 0 ? 'selector' : 'wizard')
    setActiveTab('overview')
    setWizardStep(0)
    setGenError('')
  }

  function renderTab() {
    const strategy = strategyData?.strategy || {}
    const analysis = strategyData?.analysis || {}

    const wrap = (name: string, node: React.ReactNode) => (
      <TabErrorBoundary tabName={name}>{node}</TabErrorBoundary>
    )

    const goUpgrade = () => window.location.href = '/landing#pricing'

    switch (activeTab) {
      case 'overview':      return wrap('Overview',          <TabOverview strategy={strategy} analysis={analysis} clientData={clientData} />)
      case 'strategy':      return wrap('Estratégia',        <TabStrategy strategy={strategy} analysis={analysis} />)
      case 'diagnostic':    return wrap('Diagnóstico',       <TabDiagnostic clientData={clientData} strategy={strategy} analysis={analysis} />)
      case 'analise':       return wrap('Análise Profunda',  <TabAnalise clientData={clientData} planHasAudit={planLimits.hasAudit} onUpgrade={goUpgrade} />)
      case 'anuncios':      return wrap('Anúncios IA',       <TabAnuncios planHasConnections={planLimits.hasConnections} onUpgrade={goUpgrade} clientData={clientData} />)
      case 'audiencias':    return wrap('Audiências',        <TabAudiences niche={clientData?.niche} />)
      case 'performance':   return wrap('Performance',       <TabPerformance clientData={clientData} />)
      case 'acoes':         return wrap('Plano de Ações',    <TabAcoes clientData={clientData} strategyData={strategyData} />)
      case 'inteligencia':  return wrap('Inteligência',      <TabIntelligence clientData={clientData} />)
      case 'cenarios':      return wrap('Cenários',          <TabGrowth analysis={analysis} clientData={clientData} />)
      case 'mercado':       return wrap('Mercado & Nicho',   <TabMarketIntel clientData={clientData} />)
      case 'funil':         return wrap('Gargalo do Funil',  <TabFunil clientData={clientData} />)
      case 'persona':       return wrap('Persona IA',          <TabPersona clientData={clientData} />)
      case 'conteudo':      return wrap('Criador de Conteúdo', <TabConteudo clientData={clientData} />)
      case 'assets':        return wrap('Assets da Empresa',     <TabAssets       clientData={clientData} />)
      case 'concorrentes':  return wrap('Radar de Concorrentes', <TabConcorrentes clientData={clientData} />)
      case 'campanha':      return wrap('Campanha Campeã',       <TabCampanha />)
      case 'relatorios':    return wrap('Relatórios',            <TabRelatorios />)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncMsg('')
    try {
      const res = await fetch('/api/stripe/sync', { method: 'POST' })
      const data = await res.json()
      if (data.success && data.plan) {
        setSyncMsg(`Plano "${data.plan}" ativado! Recarregando...`)
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setSyncMsg(data.message || 'Nenhuma assinatura ativa encontrada.')
      }
    } catch {
      setSyncMsg('Erro ao verificar. Tente novamente.')
    } finally {
      setSyncing(false)
    }
  }

  // ── Clerk falhou a inicializar em 3s (timeout) — mostra tela de reconexão ──
  if (clerkTimeout && !isLoaded) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <span className="font-display font-bold text-2xl block mb-6" style={{
            background: 'linear-gradient(135deg, #F0B429, #FFD166)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>ELYON</span>
          <p className="text-slate-400 text-sm mb-2">Não foi possível verificar sua sessão.</p>
          <p className="text-slate-600 text-xs mb-6">Recarregue a página ou faça login novamente.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-black"
              style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)' }}
            >
              Recarregar
            </button>
            <a
              href="/sign-in"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-[#2A2A30] text-slate-400 hover:text-white transition-colors"
            >
              Fazer login
            </a>
          </div>
        </div>
      </div>
    )
  }

  // ── Não autenticado: redireciona para sign-in ──
  if (isLoaded && !user) {
    if (typeof window !== 'undefined') window.location.href = '/sign-in'
    return null
  }

  // ── Sem acesso (trial expirado + sem plano): mostra paywall ──
  if (isLoaded && !hasAccess) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <span className="font-display font-bold text-3xl mb-6 block" style={{
            background: 'linear-gradient(135deg, #F0B429, #FFD166)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            ELYON
          </span>
          <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-8 mb-4">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="font-display text-2xl font-bold text-white mb-3">
              Seu período gratuito encerrou
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Você teve {TRIAL_DAYS} dias para explorar o ELYON. Assine agora para continuar gerando estratégias com IA, diagnósticos e relatórios para os seus clientes.
            </p>
            <a
              href="/landing#pricing"
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-black text-base hover:opacity-90 transition-opacity mb-3"
              style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)' }}
            >
              ⚡ Ver planos e assinar
            </a>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="w-full py-2.5 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-50 mb-2"
              style={{ borderColor: 'rgba(240,180,41,0.3)', color: '#F0B429', background: 'rgba(240,180,41,0.05)' }}
            >
              {syncing ? '🔄 Verificando...' : '✓ Já assinei — verificar plano'}
            </button>
            {syncMsg && (
              <p className="text-xs mb-2" style={{ color: syncMsg.includes('ativado') ? '#22C55E' : '#F0B429' }}>{syncMsg}</p>
            )}
            <a
              href="/api/auth/signout"
              className="w-full py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-300 border border-[#2A2A30] transition-colors flex items-center justify-center"
              style={{ textDecoration: 'none' }}
            >
              Sair da conta
            </a>
          </div>
          <p className="text-xs text-slate-600">
            Problemas com sua assinatura?{' '}
            <a href="mailto:suporte@elyon.app" className="text-[#F0B429] hover:underline">
              Entre em contato
            </a>
          </p>
        </div>
      </div>
    )
  }

  // Bloqueia qualquer render que dependa de isLoaded/user enquanto o componente não montou.
  // Garante que server (isLoaded=true) e client initial (isLoaded=false) produzam o mesmo HTML.
  if (!mounted) return <div className="min-h-screen bg-[#0A0A0B]" />

  // ── Banner de trial ativo ──
  const TrialBanner = inTrial && !hasActivePlan(effectiveUserPlan) ? (
    <div style={{ position: 'fixed', bottom: 0, left: isMobile ? 0 : (sidebarCollapsed ? '56px' : '220px'), right: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(3,3,5,0.95)', backdropFilter: 'blur(12px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#F5A500', display: 'inline-block', animation: 'pulseDot 2s ease-in-out infinite' }} />
        Avaliação gratuita · <strong style={{ color: '#F5A500' }}>{trialDaysLeft} dia{trialDaysLeft !== 1 ? 's' : ''} restante{trialDaysLeft !== 1 ? 's' : ''}</strong>
      </div>
      <a href="/landing#pricing" style={{ fontSize: '11px', fontWeight: 700, padding: '5px 14px', borderRadius: '7px', background: 'linear-gradient(135deg, #F5A500, #FFD166)', color: '#000', textDecoration: 'none' }}>
        Assinar agora
      </a>
    </div>
  ) : null

  // ── Seletor de clientes ──
  if (view === 'selector') {
    // Servidor já garantiu autenticação (layout.tsx) — não bloqueia no isLoaded do cliente.
    // Só verifica limite depois que o Clerk carregou — evita falso "Limite atingido"
    const atClientLimit = isLoaded && savedClients.length >= planLimits.maxClients
    return (
      <ClientSelector
        savedClients={savedClients}
        onSelect={handleSelectSaved}
        onDelete={persistDelete}
        clientLimitReached={atClientLimit}
        maxClients={planLimits.maxClients}
        user={effectiveUser}
        userPlan={effectiveUserPlan}
        auditCache={auditCache}
      />
    )
  }

  // ── Wizard ──
  if (view === 'wizard') {
    return (
      <div className="min-h-screen bg-[#0A0A0B] animate-fade-in">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-8">
          <div className="text-center mb-12">
            <span className="font-display font-bold text-3xl" style={{
              background: 'linear-gradient(135deg, #F0B429, #FFD166)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              ELYON
            </span>
            <p className="text-slate-600 text-sm mt-1">Configure seu cliente para começar</p>
          </div>
          {savedClients.length > 0 && (
            <div className="text-center mb-6">
              <button
                onClick={() => setView('selector')}
                className="text-xs text-slate-500 hover:text-[#F0B429] transition-colors"
              >
                ← Voltar para clientes salvos
              </button>
            </div>
          )}
          <SetupWizard onComplete={handleWizardComplete} />
        </div>
      </div>
    )
  }

  // ── Gerando estratégia ──
  if (isGenerating && clientData) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] animate-fade-in pt-16">
        <GeneratingScreen clientName={clientData.clientName} niche={clientData.niche} />
      </div>
    )
  }

  // ── Erro ──
  if (genError) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="font-display text-xl font-bold text-white mb-2">Erro ao gerar estratégia</h3>
          <p className="text-slate-500 text-sm mb-6">{genError}</p>
          <button onClick={handleReset} className="px-6 py-3 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.3)', color: '#F0B429' }}>
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  // ── Dashboard completo ──
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#030305', overflow: 'hidden' }}>
      {showTermsModal && (
        <TermsModal onAccept={() => {
          localStorage.setItem('elyon_terms_v1', '1')
          setTermsAcceptedLocal(true)
        }} />
      )}
      <DashboardSidebar
        active={activeTab}
        onChange={setActiveTab}
        clientData={clientData}
        userPlan={effectiveUserPlan}
        user={effectiveUser}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(v => !v)}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <DashboardTopbar
          activeTab={activeTab}
          clientData={clientData}
          onExport={handleExportPDF}
          onReset={handleReset}
          onSave={handleSaveClient}
          pdfLoading={pdfLoading}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(v => !v)}
        />
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', paddingBottom: inTrial && !hasActivePlan(effectiveUserPlan) ? '72px' : '40px' }}>
          <div key={activeTab} className="animate-fade-up">
            {renderTab()}
          </div>
        </main>
      </div>
      <NousChat
        clientData={clientData}
        strategy={strategyData?.strategy || {}}
        campaignHistory={campaignHistory}
      />
      {TrialBanner}
    </div>
  )
}
