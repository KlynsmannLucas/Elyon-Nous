// app/dashboard/page.tsx — Dashboard principal
'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useAppStore } from '@/lib/store'
import type { SavedClient } from '@/lib/store'
import { SetupWizard, type WizardImportData }    from '@/components/dashboard/SetupWizard'
import { TabOverview }     from '@/components/dashboard/TabOverview'
import { TabAudiences }    from '@/components/dashboard/TabAudiences'
import { TabStrategy }     from '@/components/dashboard/TabStrategy'
import { TabIntelligence } from '@/components/dashboard/TabIntelligence'
import { TabGrowth }       from '@/components/dashboard/TabGrowth'
import { TabPerformance }  from '@/components/dashboard/TabPerformance'
import { TabDiagnostic }   from '@/components/dashboard/TabDiagnostic'
import { TabAcoes }        from '@/components/dashboard/TabAcoes'
import { TabErrorBoundary } from '@/components/dashboard/ErrorBoundary'
import { TabConnections }       from '@/components/dashboard/TabConnections'
import { TabAuditoria }         from '@/components/dashboard/TabAuditoria'
import TabPipeline               from '@/components/dashboard/TabPipeline'
import { TabMetaIntelligence }    from '@/components/dashboard/TabMetaIntelligence'
import { TabGoogleIntelligence }  from '@/components/dashboard/TabGoogleIntelligence'
import { NousChat }       from '@/components/dashboard/NousChat'
import { getPlanLimits, hasActivePlan, UPGRADE_MESSAGES } from '@/lib/planUtils'

type TabKey = 'overview' | 'strategy' | 'intelligence' | 'audiences' | 'growth' | 'performance' | 'diagnostic' | 'connections' | 'auditoria' | 'meta-intelligence' | 'google-intelligence' | 'acoes' | 'pipeline'

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'overview',            label: 'Overview',          icon: '🏠' },
  { key: 'strategy',            label: 'Estratégia',        icon: '⚡' },
  { key: 'diagnostic',          label: 'Diagnóstico',       icon: '🎯' },
  { key: 'intelligence',        label: 'Inteligência',      icon: '🧠' },
  { key: 'auditoria',           label: 'Auditoria',         icon: '🔍' },
  { key: 'meta-intelligence',   label: 'Meta Ads IA',       icon: '📡' },
  { key: 'google-intelligence', label: 'Google Ads IA',     icon: '🎯' },
  { key: 'audiences',           label: 'Audiências',        icon: '👥' },
  { key: 'growth',              label: 'Crescimento',       icon: '📈' },
  { key: 'performance',         label: 'Performance',       icon: '📊' },
  { key: 'acoes',               label: 'Plano de Ações',    icon: '✅' },
  { key: 'connections',         label: 'Conexões',          icon: '🔗' },
]

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  individual:    { label: 'Individual',    color: '#38BDF8' },
  profissional:  { label: 'Profissional',  color: '#F0B429' },
  avancada:      { label: 'Avançada',      color: '#22C55E' },
}

const SIDEBAR_SECTIONS: { label: string; items: { key: TabKey; label: string; icon: string; badge?: string }[] }[] = [
  { label: 'Principal', items: [
    { key: 'overview',  label: 'Visão Geral', icon: '🏠', badge: 'LIVE' },
    { key: 'strategy',  label: 'Estratégia',  icon: '⚡' },
  ]},
  { label: 'Diagnóstico', items: [
    { key: 'diagnostic', label: 'Diagnóstico', icon: '🎯' },
    { key: 'auditoria',  label: 'Auditoria',   icon: '🔍' },
    { key: 'pipeline',   label: 'Pipeline 360°', icon: '🤖', badge: 'NEW' },
  ]},
  { label: 'Anúncios', items: [
    { key: 'meta-intelligence',   label: 'Meta Ads IA',   icon: '📡' },
    { key: 'google-intelligence', label: 'Google Ads IA', icon: '🎯' },
    { key: 'audiences',           label: 'Audiências',    icon: '👥' },
  ]},
  { label: 'Resultados', items: [
    { key: 'performance', label: 'Performance',    icon: '📊' },
    { key: 'acoes',       label: 'Plano de Ações', icon: '✅' },
  ]},
  { label: 'Avançado', items: [
    { key: 'intelligence', label: 'Inteligência', icon: '🧠' },
    { key: 'growth',       label: 'Crescimento',  icon: '📈' },
    { key: 'connections',  label: 'Conexões',     icon: '🔗' },
  ]},
]

// ── Sidebar ────────────────────────────────────────────────────────────────────
function Sidebar({ active, onChange, clientData, userPlan, user, onSignOut }: {
  active: TabKey; onChange: (t: TabKey) => void
  clientData: any; userPlan?: string; user: any; onSignOut: () => void
}) {
  const [portalLoading, setPortalLoading] = useState(false)
  const plan = userPlan ? PLAN_LABELS[userPlan] : null
  const userName = user?.firstName || user?.username || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Usuário'
  const avatarLetter = userName.charAt(0).toUpperCase()

  const handlePortal = async () => {
    setPortalLoading(true)
    const res  = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    setPortalLoading(false)
  }

  const sidebarStyle: React.CSSProperties = {
    width: '220px', flexShrink: 0, height: '100vh',
    background: '#0C0C12',
    borderRight: '1px solid rgba(255,255,255,0.05)',
    display: 'flex', flexDirection: 'column',
    overflowY: 'auto', overflowX: 'hidden',
  }

  const navItemStyle = (isActive: boolean): React.CSSProperties => ({
    width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
    padding: '7px 8px', borderRadius: '8px', border: 'none',
    background: isActive ? 'rgba(245,165,0,0.1)' : 'transparent',
    boxShadow: isActive ? 'inset 0 0 0 1px rgba(245,165,0,0.18)' : 'none',
    color: isActive ? '#F5A500' : 'rgba(255,255,255,0.42)',
    fontSize: '13px', fontWeight: isActive ? 600 : 400,
    cursor: 'pointer', textAlign: 'left', outline: 'none',
    transition: 'all 0.12s',
  })

  return (
    <aside style={sidebarStyle}>
      {/* Logo */}
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
        <div style={{
          fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1,
          fontFamily: 'var(--font-syne)',
          background: 'linear-gradient(135deg, #F5A500 0%, #FFD166 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>ELYON</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'pulseDot 2s ease-in-out infinite' }} />
          <span style={{ fontSize: '9px', color: '#22C55E', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>LIVE</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px', overflowY: 'auto' }}>
        {SIDEBAR_SECTIONS.map((section) => (
          <div key={section.label} style={{ marginBottom: '14px' }}>
            <div style={{
              fontSize: '9px', fontFamily: 'var(--font-mono)',
              color: 'rgba(255,255,255,0.22)', letterSpacing: '0.12em',
              textTransform: 'uppercase', padding: '0 8px', marginBottom: '3px',
            }}>
              {section.label}
            </div>
            {section.items.map((item) => {
              const isActive = active === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => onChange(item.key)}
                  style={navItemStyle(isActive)}
                  onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)' } }}
                  onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.42)' } }}
                >
                  <span style={{ fontSize: '14px', flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                  {item.badge && (
                    <span style={{
                      fontSize: '8px', fontFamily: 'var(--font-mono)', color: '#22C55E',
                      background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                      borderRadius: '4px', padding: '1px 4px', letterSpacing: '0.06em', flexShrink: 0,
                    }}>{item.badge}</span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Client badge */}
      {clientData && (
        <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', marginBottom: '3px' }}>CLIENTE</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clientData.clientName}</div>
          <div style={{ fontSize: '11px', color: '#F5A500', opacity: 0.65, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clientData.niche}</div>
        </div>
      )}

      {/* User footer */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '7px', flexShrink: 0,
            background: 'linear-gradient(135deg, #F5A500, #FFD166)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 700, color: '#000',
          }}>{avatarLetter}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
            {plan
              ? <span style={{ fontSize: '9px', color: plan.color, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>{plan.label.toUpperCase()}</span>
              : <span style={{ fontSize: '9px', color: '#64748B', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>TRIAL</span>
            }
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <a href="/perfil" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)', fontSize: '13px', textDecoration: 'none', transition: 'all 0.15s' }} title="Perfil">👤</a>
          {plan
            ? <button onClick={handlePortal} disabled={portalLoading} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: 'rgba(255,255,255,0.35)', fontSize: '13px', cursor: 'pointer' }} title="Assinatura">💳</button>
            : <a href="/landing#pricing" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px', borderRadius: '6px', border: '1px solid rgba(245,165,0,0.2)', background: 'rgba(245,165,0,0.06)', color: '#F5A500', fontSize: '11px', fontWeight: 700, textDecoration: 'none' }} title="Ver planos">⚡</a>
          }
          <button onClick={onSignOut} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: 'rgba(255,255,255,0.35)', cursor: 'pointer' }} title="Sair">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}

// ── Topbar ─────────────────────────────────────────────────────────────────────
function Topbar({ activeTab, clientData, onExport, onReset, onSave, pdfLoading, userPlan }: {
  activeTab: TabKey; clientData: any
  onExport: () => void; onReset: () => void; onSave: () => void
  pdfLoading: boolean; userPlan?: string
}) {
  const [savedFlash, setSavedFlash] = useState(false)
  const currentTab = TABS.find(t => t.key === activeTab)

  const handleSave = () => {
    onSave()
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }

  return (
    <div style={{
      height: '52px', flexShrink: 0,
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      background: 'rgba(3,3,5,0.9)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', padding: '0 24px', gap: '12px',
    }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.18)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>DASHBOARD</span>
        <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: '11px' }}>/</span>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>
          {currentTab ? `${currentTab.icon} ${currentTab.label}` : ''}
        </span>
        {clientData?.niche && (
          <>
            <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: '11px' }}>/</span>
            <span style={{ fontSize: '11px', color: '#F5A500', opacity: 0.7 }}>{clientData.niche}</span>
          </>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <button onClick={handleSave} style={{
          padding: '5px 12px', borderRadius: '7px', cursor: 'pointer', fontSize: '11px', fontWeight: 500, transition: 'all 0.15s',
          border: savedFlash ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,255,255,0.07)',
          background: savedFlash ? 'rgba(34,197,94,0.08)' : 'transparent',
          color: savedFlash ? '#22C55E' : 'rgba(255,255,255,0.38)',
        }}>
          {savedFlash ? '✓ Salvo' : '💾 Salvar'}
        </button>
        <button onClick={onReset} style={{
          padding: '5px 10px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.06)',
          background: 'transparent', color: 'rgba(255,255,255,0.28)', fontSize: '11px', cursor: 'pointer',
        }}>
          Trocar cliente
        </button>
        <button onClick={onExport} disabled={pdfLoading} style={{
          padding: '5px 14px', borderRadius: '7px', border: 'none',
          background: 'linear-gradient(135deg, #F5A500, #FFD166)', color: '#000',
          fontSize: '11px', fontWeight: 700, cursor: pdfLoading ? 'not-allowed' : 'pointer',
          opacity: pdfLoading ? 0.65 : 1,
        }}>
          {pdfLoading ? '⏳ Gerando...' : '↓ PDF'}
        </button>
      </div>
    </div>
  )
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

// ── Seletor de cliente salvo ───────────────────────────────────────────────────
function ClientSelector({
  savedClients,
  onSelect,
  onNew,
  onDelete,
  clientLimitReached,
  maxClients,
  user,
  userPlan,
  onSignOut,
}: {
  savedClients: SavedClient[]
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  clientLimitReached?: boolean
  maxClients?: number
  user: any
  userPlan?: string
  onSignOut: () => void
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
          <button
            onClick={onSignOut}
            title="Sair da conta"
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-red-400 transition-colors px-3 py-2 rounded-xl border border-[#2A2A30] hover:border-red-400/30"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sair
          </button>
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
                      {sc.strategyData && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }}>
                          Estratégia pronta
                        </span>
                      )}
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
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-3 border border-dashed rounded-2xl p-5 transition-all"
          style={clientLimitReached
            ? { borderColor: 'rgba(255,77,77,0.3)', color: '#FF4D4D', cursor: 'not-allowed', opacity: 0.7 }
            : { borderColor: '#2A2A30', color: '#64748B' }
          }
        >
          <span className="text-xl">{clientLimitReached ? '🔒' : '+'}</span>
          <div className="text-left">
            <span className="text-sm font-semibold block">
              {clientLimitReached ? `Limite atingido (${maxClients} cliente${maxClients !== 1 ? 's' : ''})` : 'Novo cliente'}
            </span>
            {clientLimitReached && (
              <span className="text-xs opacity-70">Faça upgrade para adicionar mais →</span>
            )}
          </div>
        </button>
      </div>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const { signOut }        = useClerk()
  const userPlan   = user?.publicMetadata?.plan as string | undefined

  // Trial de 7 dias — baseado no createdAt do Clerk
  const TRIAL_DAYS = 7
  const createdAt      = typeof user?.createdAt === 'number' ? user.createdAt : Date.now()
  const trialMsLeft    = (createdAt + TRIAL_DAYS * 24 * 60 * 60 * 1000) - Date.now()
  const inTrial        = trialMsLeft > 0
  const trialDaysLeft  = Math.ceil(trialMsLeft / (24 * 60 * 60 * 1000))
  const hasAccess      = hasActivePlan(userPlan) || inTrial

  // Durante trial sem plano, aplica limites do tier 'trial' (3 clientes, 4 estratégias/hora)
  const effectivePlan = hasActivePlan(userPlan) ? userPlan : (inTrial ? 'trial' : 'free')
  const planLimits    = getPlanLimits(effectivePlan)

  const {
    clientData, strategyData, isGenerating,
    setStrategyData, setIsGenerating, clearAll, wizardStep, setWizardStep,
    savedClients, setSavedClients, saveCurrentClient, loadSavedClient, deleteSavedClient,
    campaignHistory,
    recordStrategyGeneration, getStrategyCountLastHour,
    setAuditCache,
  } = useAppStore()

  // ── Sincronização com banco de dados ──────────────────────────────────────────
  // Carrega clientes do Supabase ao montar (garante sync cross-device)
  useEffect(() => {
    if (!isLoaded || !user) return
    fetch('/api/clients')
      .then((r) => r.json())
      .then(({ clients }) => {
        if (Array.isArray(clients) && clients.length > 0) {
          setSavedClients(clients)
          const restored: Record<string, any[]> = {}
          for (const c of clients) {
            if (c.auditData && c.clientData?.clientName) {
              restored[c.clientData.clientName] = c.auditData
            }
          }
          if (Object.keys(restored).length > 0) {
            useAppStore.setState((s) => ({ auditCache: { ...s.auditCache, ...restored } }))
          }
        }
      })
      .catch(() => {}) // falha silenciosa — localStorage continua funcionando
  }, [isLoaded, user?.id])

  // Persiste cliente no banco + localStorage (debounced: máx 1 req/3s)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const persistSave = useCallback(async () => {
    saveCurrentClient() // atualiza localStorage imediatamente
    // Debounce: cancela requisição pendente e agenda nova em 3s
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const state = useAppStore.getState()
      const { clientData: cd, savedClients: sc, auditCache: ac } = state
      if (!cd) return
      const entry = sc.find((s) => s.clientData.clientName === cd.clientName)
      if (!entry) return
      fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...entry, auditData: ac[cd.clientName] ?? null }),
      }).catch(() => {})
    }, 3000)
  }, [saveCurrentClient])

  // Remove cliente do banco + localStorage
  const persistDelete = useCallback((id: string) => {
    deleteSavedClient(id)
    fetch(`/api/clients/${id}`, { method: 'DELETE' }).catch(() => {})
  }, [deleteSavedClient])

  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [view, setView] = useState<'selector' | 'wizard' | 'dashboard'>('selector')
  const [genError, setGenError] = useState('')

  // Se há clientData e strategyData no store ao montar, vai direto pro dashboard
  // Caso contrário sempre cai no seletor (mesmo sem clientes salvos)
  useEffect(() => {
    if (clientData && strategyData) {
      setView('dashboard')
    } else {
      setView('selector')
    }

    // Se voltou de um checkout bem-sucedido, força reload do user no Clerk
    // para buscar o plano atualizado (JWT pode estar em cache)
    const params = new URLSearchParams(window.location.search)
    if (params.get('checkout') === 'ok' || params.get('checkout') === 'success') {
      user?.reload().then(() => {
        // Limpa o param da URL sem reload da página
        window.history.replaceState({}, '', '/dashboard')
      })
    }
  }, []) // só na montagem

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
        body: JSON.stringify({ ...clientData, campaignHistory }),
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

      setStrategyData({
        analysis: json.strategy,
        strategy: json.strategy,
        adCopy: {},
        audienceSuggestions: {},
        creativeBrief: {},
        generatedAt: new Date().toISOString(),
      })
      recordStrategyGeneration()
      await persistSave()

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
            setActiveTab('auditoria')
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
  }, [clientData, setIsGenerating, setStrategyData, persistSave, planLimits, getStrategyCountLastHour, recordStrategyGeneration, setAuditCache, setActiveTab])

  // Auto-save sempre que a estratégia muda (protege contra perda de dados em refresh)
  useEffect(() => {
    if (clientData && strategyData) {
      persistSave()
    }
  }, [strategyData])

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

  const handleExportPDF = useCallback(async () => {
    setPdfLoading(true)
    try {
      const { generatePDF } = await import('@/components/pdf/RelatorioPDF')
      await generatePDF({
        clientData: clientData ?? null,
        strategy: strategyData?.strategy || {},
      })
    } catch (e) {
      console.error('Erro PDF:', e)
      alert('Não foi possível gerar o PDF. Tente novamente.')
    } finally {
      setPdfLoading(false)
    }
  }, [clientData, strategyData])

  const handleReset = () => {
    clearAll()
    // Se só tem 1 cliente salvo e já está no limite, vai direto pro seletor (não wizard vazio)
    setView(savedClients.length > 0 ? 'selector' : 'wizard')
    setActiveTab('overview')
    setWizardStep(0)
    setGenError('')
  }

  function UpgradeGate({ feature }: { feature: keyof typeof UPGRADE_MESSAGES }) {
    const msg = UPGRADE_MESSAGES[feature]
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="max-w-sm text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="font-display text-xl font-bold text-white mb-2">{msg.title}</h3>
          <p className="text-slate-400 text-sm mb-6">{msg.description}</p>
          <div className="text-xs text-[#F0B429] mb-4 font-semibold">
            Disponível no plano {msg.requiredPlan}+
          </div>
          <a href="/landing#pricing"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-black text-sm hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)' }}>
            ⚡ Fazer upgrade
          </a>
        </div>
      </div>
    )
  }

  function renderTab() {
    const strategy = strategyData?.strategy || {}
    const analysis = strategyData?.analysis || {}

    const wrap = (name: string, node: React.ReactNode) => (
      <TabErrorBoundary tabName={name}>{node}</TabErrorBoundary>
    )

    switch (activeTab) {
      case 'overview':     return wrap('Overview',     <TabOverview strategy={strategy} analysis={analysis} clientData={clientData} />)
      case 'strategy':     return wrap('Estratégia',   <TabStrategy strategy={strategy} analysis={analysis} />)
      case 'diagnostic':   return wrap('Diagnóstico',  <TabDiagnostic clientData={clientData} strategy={strategy} analysis={analysis} />)
      case 'intelligence': return wrap('Inteligência', <TabIntelligence clientData={clientData} />)
      case 'audiences':    return wrap('Audiências',   <TabAudiences niche={clientData?.niche} />)
      case 'growth':       return wrap('Crescimento',  <TabGrowth analysis={analysis} clientData={clientData} />)
      case 'performance':  return wrap('Performance',  <TabPerformance clientData={clientData} />)
      case 'acoes':        return wrap('Plano de Ações', <TabAcoes clientData={clientData} strategyData={strategyData} />)
      case 'meta-intelligence':    return wrap('Meta Ads IA',    <TabMetaIntelligence    onNavigateToConnections={() => setActiveTab('connections')} />)
      case 'google-intelligence': return wrap('Google Ads IA', <TabGoogleIntelligence onNavigateToConnections={() => setActiveTab('connections')} />)
      case 'connections':  return wrap('Conexões', planLimits.hasConnections
        ? <TabConnections />
        : <UpgradeGate feature="connections" />)
      case 'auditoria':    return wrap('Auditoria', planLimits.hasAudit
        ? <TabAuditoria clientData={clientData} />
        : <UpgradeGate feature="audit" />)
      case 'pipeline':     return wrap('Pipeline 360°', <TabPipeline clientData={clientData} />)
    }
  }

  // ── Sem acesso (trial expirado + sem plano): mostra paywall ──
  if (isLoaded && !hasAccess) {
    const [syncing, setSyncing] = useState(false)
    const [syncMsg, setSyncMsg] = useState('')

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
            <button
              onClick={() => signOut({ redirectUrl: '/sign-in' })}
              className="w-full py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-300 border border-[#2A2A30] transition-colors"
            >
              Sair da conta
            </button>
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

  // ── Banner de trial ativo ──
  const TrialBanner = inTrial && !hasActivePlan(userPlan) ? (
    <div style={{ position: 'fixed', bottom: 0, left: '220px', right: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(3,3,5,0.95)', backdropFilter: 'blur(12px)' }}>
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
    const atClientLimit = savedClients.length >= planLimits.maxClients
    return (
      <ClientSelector
        savedClients={savedClients}
        onSelect={handleSelectSaved}
        onNew={() => {
          if (atClientLimit) {
            alert(`Seu plano permite até ${planLimits.maxClients} cliente${planLimits.maxClients > 1 ? 's' : ''}. Faça upgrade para adicionar mais.`)
            return
          }
          setView('wizard'); setWizardStep(0)
        }}
        onDelete={persistDelete}
        clientLimitReached={atClientLimit}
        maxClients={planLimits.maxClients}
        user={user}
        userPlan={userPlan}
        onSignOut={() => signOut({ redirectUrl: '/sign-in' })}
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
      <Sidebar
        active={activeTab}
        onChange={setActiveTab}
        clientData={clientData}
        userPlan={userPlan}
        user={user}
        onSignOut={() => signOut({ redirectUrl: '/sign-in' })}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar
          activeTab={activeTab}
          clientData={clientData}
          onExport={handleExportPDF}
          onReset={handleReset}
          onSave={handleSaveClient}
          pdfLoading={pdfLoading}
          userPlan={userPlan}
        />
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', paddingBottom: inTrial && !hasActivePlan(userPlan) ? '72px' : '40px' }}>
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
