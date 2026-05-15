// components/dashboard/DashboardSidebar.tsx
'use client'

import { useState, useEffect } from 'react'
import { getPlanLimits } from '@/lib/planUtils'

export type TabKey =
  | 'overview' | 'strategy' | 'diagnostic' | 'inteligencia'
  | 'analise' | 'anuncios' | 'audiencias' | 'cro' | 'budget' | 'channelmix'
  | 'performance' | 'acoes' | 'cenarios' | 'mercado' | 'funil'
  | 'persona' | 'conteudo' | 'assets' | 'concorrentes' | 'campanha'
  | 'relatorios' | 'financeiro'

// ── SVG icons ─────────────────────────────────────────────────────────────────
const I = {
  grid: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  activity: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  funnel: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  zap: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  checkSquare: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  barChart: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  fileUp: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/></svg>,
  megaphone: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 19-9-9 19-2-8-8-2z"/></svg>,
  users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  userCircle: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  shield: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  trendUp: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  edit: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  image: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  wallet: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>,
  gitBranch: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>,
  globe: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  sliders: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>,
  lock: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  chevronLeft: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  chevronRight: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
}

const TAB_ICONS: Record<TabKey, JSX.Element> = {
  overview:    I.grid,
  analise:     I.search,
  diagnostic:  I.activity,
  funil:       I.funnel,
  strategy:    I.zap,
  acoes:       I.checkSquare,
  performance: I.barChart,
  relatorios:  I.fileUp,
  anuncios:    I.megaphone,
  audiencias:  I.users,
  persona:     I.userCircle,
  concorrentes:I.shield,
  cro:         I.trendUp,
  conteudo:    I.edit,
  assets:      I.image,
  budget:      I.wallet,
  channelmix:  I.gitBranch,
  mercado:     I.globe,
  cenarios:    I.sliders,
  inteligencia:I.activity,
  campanha:    I.megaphone,
  financeiro:  I.wallet,
}

export const SIDEBAR_SECTIONS: {
  label: string
  planLabel?: string
  items: { key: TabKey; label: string; icon: string; badge?: string }[]
}[] = [
  { label: 'Início', items: [
    { key: 'overview',    label: 'Visão Geral',          icon: '🏠', badge: 'LIVE' },
  ]},
  { label: 'Análise', items: [
    { key: 'analise',     label: 'Auditoria de Anúncios', icon: '🔍' },
    { key: 'diagnostic',  label: 'Saúde do Negócio',      icon: '🎯' },
    { key: 'funil',       label: 'Funil de Vendas',       icon: '🔬' },
  ]},
  { label: 'Estratégia', items: [
    { key: 'strategy',    label: 'Estratégia',            icon: '⚡' },
    { key: 'acoes',       label: 'Ações Prioritárias',    icon: '✅' },
    { key: 'performance', label: 'Resultados',            icon: '📊' },
    { key: 'relatorios',  label: 'Relatórios',            icon: '📤' },
    { key: 'financeiro',  label: 'Painel Financeiro',     icon: '💰', badge: 'NOVO' },
  ]},
  { label: 'Anúncios', planLabel: 'Profissional', items: [
    { key: 'anuncios',    label: 'Meta & Google Ads',     icon: '📡' },
    { key: 'audiencias',  label: 'Audiências',            icon: '👥' },
    { key: 'persona',     label: 'Persona do Cliente',    icon: '👤' },
  ]},
  { label: 'Criativo', planLabel: 'Profissional', items: [
    { key: 'concorrentes',label: 'Concorrentes',          icon: '🕵️' },
    { key: 'cro',         label: 'Melhorar Conversão',    icon: '⚙️', badge: 'IA' },
    { key: 'conteudo',    label: 'Criar Conteúdo',        icon: '✨' },
    { key: 'assets',      label: 'Arquivos da Empresa',   icon: '🖼️' },
  ]},
  { label: 'Avançado', planLabel: 'Avançada', items: [
    { key: 'budget',      label: 'Alocar Verba',          icon: '💰', badge: 'IA' },
    { key: 'channelmix',  label: 'Mix de Canais',         icon: '🌐', badge: 'IA' },
    { key: 'mercado',     label: 'Pesquisa de Mercado',   icon: '📡' },
    { key: 'cenarios',    label: 'Projeções',             icon: '📈' },
  ]},
]

const PLAN_META: Record<string, { label: string; color: string; bg: string }> = {
  individual:   { label: 'Individual',   color: '#38BDF8', bg: 'rgba(56,189,248,0.12)' },
  profissional: { label: 'Profissional', color: '#F5A500', bg: 'rgba(245,165,0,0.12)' },
  avancada:     { label: 'Avançada',     color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
}

interface Props {
  active: TabKey
  onChange: (t: TabKey) => void
  clientData: any
  userPlan?: string
  user: any
  collapsed: boolean
  onToggleCollapse: () => void
  hasConnectedAccount?: boolean
}

export function DashboardSidebar({ active, onChange, clientData, userPlan, user, collapsed, onToggleCollapse, hasConnectedAccount = false }: Props) {
  const [portalLoading, setPortalLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const planLimits = getPlanLimits(userPlan)
  const SECTION_LOCK: Record<string, boolean> = {
    'Anúncios': !planLimits.hasAnunciosGroup,
    'Criativo':  !planLimits.hasCriativoGroup,
    'Avançado':  !planLimits.hasAvancadoGroup,
  }

  const plan         = userPlan ? PLAN_META[userPlan] : null
  const userName     = user?.firstName || user?.username || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || ''
  const avatarLetter = userName ? userName.charAt(0).toUpperCase() : '·'

  const handlePortal = async () => {
    setPortalLoading(true)
    const res  = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    setPortalLoading(false)
  }

  const W = isMobile
    ? (collapsed ? '0px' : '248px')
    : (collapsed ? '60px' : '240px')

  // ── Color tokens ─────────────────────────────────────────────────────────
  const BG       = '#0B0D1A'
  const BORDER   = 'rgba(255,255,255,0.05)'
  const PURPLE   = '#7C3AED'
  const PURPLE_D = 'rgba(124,58,237,0.15)'
  const PURPLE_B = 'rgba(124,58,237,0.25)'

  return (
    <>
      {isMobile && !collapsed && (
        <div onClick={onToggleCollapse} style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 299,
        }} />
      )}

      <aside style={{
        width: W, flexShrink: 0, height: '100vh',
        background: BG,
        borderRight: `1px solid ${BORDER}`,
        display: 'flex', flexDirection: 'column',
        overflowY: isMobile && collapsed ? 'hidden' : 'auto',
        overflowX: 'hidden',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        ...(isMobile ? {
          position: 'fixed', top: 0, left: 0, bottom: 0,
          zIndex: 300,
          boxShadow: collapsed ? 'none' : '8px 0 40px rgba(0,0,0,0.7)',
        } : {}),
      }}>

        {/* ── Logo ─────────────────────────────────────────────────────── */}
        <div style={{
          padding: collapsed ? '18px 0' : '20px 16px 16px',
          borderBottom: `1px solid ${BORDER}`,
          flexShrink: 0,
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Logo mark */}
              <div style={{
                width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
                background: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(124,58,237,0.4)',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <div>
                <div style={{
                  fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1,
                  background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>ELYON</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <span className="status-dot-live" style={{ width: '5px', height: '5px' }} />
                  <span style={{ fontSize: '9px', color: '#22C55E', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', fontWeight: 600 }}>LIVE</span>
                </div>
              </div>
            </div>
          )}

          {collapsed && (
            <div style={{
              width: '32px', height: '32px', borderRadius: '9px',
              background: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
          )}

          {!collapsed && (
            <button onClick={onToggleCollapse} title="Recolher menu" style={{
              width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0,
              background: 'transparent', border: `1px solid ${BORDER}`,
              color: 'rgba(255,255,255,0.25)', fontSize: '10px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.25)' }}
            >{I.chevronLeft}</button>
          )}
        </div>

        {/* Collapsed: expand button */}
        {collapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px', borderBottom: `1px solid ${BORDER}` }}>
            <button onClick={onToggleCollapse} title="Expandir menu" style={{
              width: '32px', height: '24px', borderRadius: '6px',
              background: 'transparent', border: `1px solid ${BORDER}`,
              color: 'rgba(255,255,255,0.25)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.25)' }}
            >{I.chevronRight}</button>
          </div>
        )}

        {/* ── Nav ──────────────────────────────────────────────────────── */}
        <nav style={{ flex: 1, padding: collapsed ? '10px 8px' : '10px 10px', overflowY: 'auto' }}>
          {SIDEBAR_SECTIONS.map((section) => {
            const isLocked = SECTION_LOCK[section.label] ?? false
            return (
              <div key={section.label} style={{ marginBottom: collapsed ? '6px' : '20px' }}>

                {/* Section header */}
                {!collapsed && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 6px', marginBottom: '4px',
                  }}>
                    <span style={{
                      fontSize: '9px', fontWeight: 700,
                      color: isLocked ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.4)',
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {section.label}
                    </span>
                    {isLocked && section.planLabel && (
                      <a href="/landing#pricing" style={{
                        fontSize: '8px', fontWeight: 700, letterSpacing: '0.04em',
                        color: PURPLE, background: PURPLE_D,
                        border: `1px solid ${PURPLE_B}`,
                        borderRadius: '4px', padding: '1px 6px',
                        textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px',
                        transition: 'opacity 0.15s', opacity: 0.9,
                      }}>
                        {I.lock} {section.planLabel}
                      </a>
                    )}
                  </div>
                )}

                {collapsed && (
                  <div style={{ height: '1px', background: BORDER, margin: '2px 0 6px' }} />
                )}

                {/* Items */}
                {section.items.map((item) => {
                  const isActive = active === item.key
                  return (
                    <button
                      key={item.key}
                      onClick={() => { onChange(item.key); if (isMobile && !collapsed) onToggleCollapse() }}
                      title={collapsed ? item.label : undefined}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center',
                        gap: collapsed ? '0' : '9px',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        padding: collapsed ? '8px 0' : '7px 8px',
                        borderRadius: '8px', border: 'none',
                        marginBottom: '1px',
                        background: isActive ? PURPLE_D : 'transparent',
                        boxShadow: isActive ? `inset 0 0 0 1px ${PURPLE_B}` : 'none',
                        color: isLocked ? 'rgba(255,255,255,0.2)'
                          : isActive ? '#A78BFA'
                          : 'rgba(255,255,255,0.55)',
                        cursor: 'pointer', textAlign: 'left', outline: 'none',
                        transition: 'all 0.12s', position: 'relative',
                        opacity: isLocked ? 0.55 : 1,
                      }}
                      onMouseEnter={e => {
                        if (isLocked || isActive) return
                        e.currentTarget.style.background = 'rgba(124,58,237,0.07)'
                        e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                      }}
                      onMouseLeave={e => {
                        if (isLocked || isActive) return
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'rgba(255,255,255,0.55)'
                      }}
                    >
                      {/* Icon */}
                      <span style={{
                        flexShrink: 0, lineHeight: 0,
                        color: isActive ? '#A78BFA' : 'inherit',
                      }}>
                        {TAB_ICONS[item.key] ?? <span style={{ fontSize: '14px' }}>{item.icon}</span>}
                      </span>

                      {/* Label + badge */}
                      {!collapsed && (
                        <>
                          <span style={{
                            flex: 1, fontSize: '13px', fontWeight: isActive ? 600 : 400,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {item.label}
                          </span>
                          {isLocked ? (
                            <span style={{ color: 'rgba(255,255,255,0.15)', flexShrink: 0 }}>{I.lock}</span>
                          ) : item.badge === 'LIVE' && hasConnectedAccount ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                              <span className="status-dot-live" style={{ width: '5px', height: '5px' }} />
                            </span>
                          ) : item.badge && item.badge !== 'LIVE' ? (
                            <span style={{
                              fontSize: '8px', fontFamily: 'var(--font-mono)',
                              color: '#A78BFA',
                              background: 'rgba(167,139,250,0.12)',
                              border: '1px solid rgba(167,139,250,0.25)',
                              borderRadius: '4px', padding: '1px 5px',
                              letterSpacing: '0.04em', flexShrink: 0, fontWeight: 700,
                            }}>
                              {item.badge}
                            </span>
                          ) : null}
                        </>
                      )}

                      {/* Collapsed: active indicator */}
                      {collapsed && isActive && (
                        <span style={{
                          position: 'absolute', left: 0, top: '25%', bottom: '25%',
                          width: '2px', borderRadius: '0 2px 2px 0',
                          background: PURPLE,
                        }} />
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* ── Client badge ─────────────────────────────────────────────── */}
        {clientData?.clientName && !collapsed && (
          <div style={{
            margin: '0 10px 10px', padding: '10px 12px',
            background: 'rgba(124,58,237,0.06)',
            border: '1px solid rgba(124,58,237,0.15)',
            borderRadius: '10px', flexShrink: 0,
          }}>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', marginBottom: '3px' }}>CLIENTE ATIVO</div>
            <div style={{ fontSize: '12px', color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clientData.clientName}</div>
            {clientData.niche && (
              <div style={{ fontSize: '11px', color: '#A78BFA', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clientData.niche}</div>
            )}
          </div>
        )}

        {/* Collapsed client dot */}
        {clientData?.clientName && collapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0', borderTop: `1px solid ${BORDER}` }} title={clientData.clientName}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: PURPLE_D, border: `1px solid ${PURPLE_B}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', color: '#A78BFA', fontWeight: 700,
            }}>
              {clientData.clientName.charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        {/* ── User footer ──────────────────────────────────────────────── */}
        <div style={{
          padding: collapsed ? '10px 8px' : '12px 12px',
          borderTop: `1px solid ${BORDER}`, flexShrink: 0,
        }}>
          {!collapsed ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                {/* Avatar */}
                <div style={{
                  width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
                  background: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 700, color: '#fff',
                  boxShadow: '0 2px 8px rgba(124,58,237,0.35)',
                }}>{avatarLetter}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
                  {plan ? (
                    <span style={{
                      fontSize: '9px', color: plan.color, fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.06em', fontWeight: 700,
                      background: plan.bg, borderRadius: '3px', padding: '1px 5px',
                      display: 'inline-block', marginTop: '2px',
                    }}>{plan.label.toUpperCase()}</span>
                  ) : (
                    <span style={{ fontSize: '9px', color: '#64748B', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>TRIAL</span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {[
                  { href: '/perfil', title: 'Perfil', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
                ].map(btn => (
                  <a key={btn.href} href={btn.href} title={btn.title} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '6px', borderRadius: '7px',
                    border: `1px solid ${BORDER}`, color: 'rgba(255,255,255,0.3)',
                    textDecoration: 'none', transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = PURPLE_B; (e.currentTarget as HTMLElement).style.color = '#A78BFA' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = BORDER; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)' }}
                  >{btn.icon}</a>
                ))}

                {plan ? (
                  <button onClick={handlePortal} disabled={portalLoading} title="Assinatura" style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '6px', borderRadius: '7px', border: `1px solid ${BORDER}`,
                    background: 'transparent', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.08)'; e.currentTarget.style.borderColor = PURPLE_B; e.currentTarget.style.color = '#A78BFA' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  </button>
                ) : (
                  <a href="/landing#pricing" title="Upgrade" style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '6px', borderRadius: '7px',
                    border: `1px solid ${PURPLE_B}`, background: PURPLE_D,
                    color: '#A78BFA', fontSize: '10px', fontWeight: 700, textDecoration: 'none',
                  }}>⚡</a>
                )}

                <button type="button" onClick={() => window.location.assign('/api/auth/signout')} title="Sair" style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '6px', borderRadius: '7px',
                  border: `1px solid ${BORDER}`, background: 'transparent',
                  color: 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.color = '#EF4444' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div title={userName} style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700, color: '#fff',
              }}>{avatarLetter}</div>
              <button type="button" onClick={() => window.location.assign('/api/auth/signout')} title="Sair" style={{
                width: '32px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '6px', border: `1px solid ${BORDER}`, background: 'transparent',
                color: 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.borderColor = BORDER }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
