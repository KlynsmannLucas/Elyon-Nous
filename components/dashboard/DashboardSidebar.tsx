// components/dashboard/DashboardSidebar.tsx
'use client'

import { useState } from 'react'

export type TabKey =
  | 'overview' | 'strategy' | 'diagnostic' | 'inteligencia'
  | 'analise' | 'anuncios' | 'audiencias'
  | 'performance' | 'acoes' | 'cenarios' | 'mercado' | 'funil'
  | 'persona' | 'conteudo' | 'assets' | 'concorrentes'

export const SIDEBAR_SECTIONS: {
  label: string
  items: { key: TabKey; label: string; icon: string; badge?: string }[]
}[] = [
  { label: 'Principal', items: [
    { key: 'overview',     label: 'Visão Geral',    icon: '🏠', badge: 'LIVE' },
    { key: 'strategy',     label: 'Estratégia',     icon: '⚡' },
  ]},
  { label: 'Análise', items: [
    { key: 'diagnostic',   label: 'Diagnóstico',    icon: '🎯' },
    { key: 'analise',      label: 'Análise Profunda', icon: '🔍' },
    { key: 'funil',        label: 'Gargalo do Funil', icon: '🔬' },
  ]},
  { label: 'Anúncios', items: [
    { key: 'anuncios',     label: 'Anúncios IA',    icon: '📡' },
    { key: 'audiencias',   label: 'Audiências',     icon: '👥' },
  ]},
  { label: 'Resultados', items: [
    { key: 'performance',  label: 'Performance',    icon: '📊' },
    { key: 'acoes',        label: 'Plano de Ações', icon: '✅' },
  ]},
  { label: 'Criativo', items: [
    { key: 'persona',      label: 'Persona IA',           icon: '👤' },
    { key: 'conteudo',     label: 'Criador de Conteúdo',  icon: '✨' },
    { key: 'assets',       label: 'Assets da Empresa',    icon: '🖼️' },
    { key: 'concorrentes', label: 'Radar Concorrentes',   icon: '🎯' },
  ]},
  { label: 'Avançado', items: [
    { key: 'inteligencia', label: 'Inteligência',    icon: '🧠' },
    { key: 'cenarios',     label: 'Cenários',        icon: '📈' },
    { key: 'mercado',      label: 'Mercado & Nicho', icon: '🌐' },
  ]},
]

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  individual:   { label: 'Individual',   color: '#38BDF8' },
  profissional: { label: 'Profissional', color: '#F0B429' },
  avancada:     { label: 'Avançada',     color: '#22C55E' },
}

interface Props {
  active: TabKey
  onChange: (t: TabKey) => void
  clientData: any
  userPlan?: string
  user: any
  onSignOut: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export function DashboardSidebar({ active, onChange, clientData, userPlan, user, onSignOut, collapsed, onToggleCollapse }: Props) {
  const [portalLoading, setPortalLoading] = useState(false)

  const plan         = userPlan ? PLAN_LABELS[userPlan] : null
  const userName     = user?.firstName || user?.username || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Usuário'
  const avatarLetter = userName.charAt(0).toUpperCase()

  const handlePortal = async () => {
    setPortalLoading(true)
    const res  = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    setPortalLoading(false)
  }

  const W = collapsed ? '56px' : '220px'

  return (
    <aside style={{
      width: W, flexShrink: 0, height: '100vh',
      background: '#0C0C12',
      borderRight: '1px solid rgba(255,255,255,0.05)',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto', overflowX: 'hidden',
      transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
    }}>

      {/* Logo + toggle */}
      <div style={{
        padding: collapsed ? '16px 0' : '18px 16px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        flexShrink: 0,
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: '8px',
      }}>
        {!collapsed && (
          <div>
            <div style={{
              fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1,
              fontFamily: 'var(--font-syne)',
              background: 'linear-gradient(135deg, #F5A500 0%, #FFD166 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>ELYON</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>
              <span className="status-dot-live" />
              <span style={{ fontSize: '9px', color: '#22C55E', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>LIVE</span>
            </div>
          </div>
        )}

        {collapsed && (
          <div style={{
            fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-syne)',
            background: 'linear-gradient(135deg, #F5A500, #FFD166)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>E</div>
        )}

        {/* Collapse toggle button */}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          style={{
            width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
            background: 'transparent', border: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.3)', fontSize: '9px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: collapsed ? '8px 4px' : '8px', overflowY: 'auto' }}>
        {SIDEBAR_SECTIONS.map((section) => (
          <div key={section.label} style={{ marginBottom: collapsed ? '8px' : '14px' }}>
            {/* Section label — hidden when collapsed */}
            {!collapsed && (
              <div style={{
                fontSize: '9px', fontFamily: 'var(--font-mono)',
                color: 'rgba(255,255,255,0.22)', letterSpacing: '0.12em',
                textTransform: 'uppercase', padding: '0 8px', marginBottom: '3px',
              }}>
                {section.label}
              </div>
            )}

            {collapsed && (
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 6px 6px' }} />
            )}

            {section.items.map((item) => {
              const isActive = active === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => onChange(item.key)}
                  title={collapsed ? item.label : undefined}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: collapsed ? '0' : '8px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    padding: collapsed ? '7px 0' : '7px 8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isActive ? 'rgba(245,165,0,0.1)' : 'transparent',
                    boxShadow: isActive ? 'inset 0 0 0 1px rgba(245,165,0,0.18)' : 'none',
                    color: isActive ? '#F5A500' : 'rgba(255,255,255,0.42)',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    textAlign: 'left',
                    outline: 'none',
                    transition: 'all 0.12s',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)' } }}
                  onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.42)' } }}
                >
                  <span style={{ fontSize: '14px', flexShrink: 0, lineHeight: 1 }}>{item.icon}</span>

                  {/* Label + badge — hidden when collapsed */}
                  {!collapsed && (
                    <>
                      <span style={{
                        flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        opacity: 1, transition: 'opacity 0.15s',
                      }}>
                        {item.label}
                      </span>
                      {item.badge && (
                        <span style={{
                          fontSize: '8px', fontFamily: 'var(--font-mono)', color: '#22C55E',
                          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                          borderRadius: '4px', padding: '1px 4px', letterSpacing: '0.06em', flexShrink: 0,
                        }}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}

                  {/* Live badge dot when collapsed */}
                  {collapsed && item.badge && (
                    <span style={{
                      position: 'absolute', top: '5px', right: '5px',
                      width: '5px', height: '5px', borderRadius: '50%',
                      background: '#22C55E',
                    }} />
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Client badge */}
      {clientData && !collapsed && (
        <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', marginBottom: '3px' }}>CLIENTE</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clientData.clientName}</div>
          <div style={{ fontSize: '11px', color: '#F5A500', opacity: 0.65, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clientData.niche}</div>
        </div>
      )}

      {/* Client dot when collapsed */}
      {clientData && collapsed && (
        <div style={{ padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.04)', flexShrink: 0, display: 'flex', justifyContent: 'center' }}
          title={clientData.clientName}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'rgba(245,165,0,0.12)', border: '1px solid rgba(245,165,0,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', color: '#F5A500', fontWeight: 700,
          }}>
            {clientData.clientName.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* User footer */}
      <div style={{ padding: collapsed ? '10px 4px' : '10px 12px', borderTop: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
        {!collapsed ? (
          <>
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
              <a href="/perfil"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)', fontSize: '13px', textDecoration: 'none', transition: 'all 0.15s' }}
                title="Perfil"
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)' }}
              >👤</a>
              {plan
                ? <button onClick={handlePortal} disabled={portalLoading}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: 'rgba(255,255,255,0.35)', fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s' }}
                    title="Assinatura"
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
                  >💳</button>
                : <a href="/landing#pricing"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px', borderRadius: '6px', border: '1px solid rgba(245,165,0,0.2)', background: 'rgba(245,165,0,0.06)', color: '#F5A500', fontSize: '11px', fontWeight: 700, textDecoration: 'none' }}>
                    ⚡
                  </a>
              }
              <button onClick={onSignOut}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', transition: 'all 0.15s' }}
                title="Sair"
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,77,77,0.08)'; e.currentTarget.style.color = '#FF4D4D'; e.currentTarget.style.borderColor = 'rgba(255,77,77,0.2)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          /* Collapsed user footer — just avatar + sign out */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div
              title={userName}
              style={{
                width: '30px', height: '30px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #F5A500, #FFD166)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 700, color: '#000',
              }}>{avatarLetter}</div>
            <button onClick={onSignOut}
              title="Sair"
              style={{ width: '30px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,77,77,0.08)'; e.currentTarget.style.color = '#FF4D4D'; e.currentTarget.style.borderColor = 'rgba(255,77,77,0.2)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
