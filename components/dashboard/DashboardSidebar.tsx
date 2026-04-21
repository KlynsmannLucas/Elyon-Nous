// components/dashboard/DashboardSidebar.tsx
'use client'

import { useState } from 'react'

export type TabKey =
  | 'overview' | 'strategy' | 'diagnostic' | 'inteligencia'
  | 'analise' | 'anuncios' | 'audiencias'
  | 'performance' | 'acoes' | 'cenarios'

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
  ]},
  { label: 'Anúncios', items: [
    { key: 'anuncios',     label: 'Anúncios IA',    icon: '📡' },
    { key: 'audiencias',   label: 'Audiências',     icon: '👥' },
  ]},
  { label: 'Resultados', items: [
    { key: 'performance',  label: 'Performance',    icon: '📊' },
    { key: 'acoes',        label: 'Plano de Ações', icon: '✅' },
  ]},
  { label: 'Avançado', items: [
    { key: 'inteligencia', label: 'Inteligência',   icon: '🧠' },
    { key: 'cenarios',     label: 'Cenários',       icon: '📈' },
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
}

export function DashboardSidebar({ active, onChange, clientData, userPlan, user, onSignOut }: Props) {
  const [portalLoading, setPortalLoading] = useState(false)
  const plan       = userPlan ? PLAN_LABELS[userPlan] : null
  const userName   = user?.firstName || user?.username || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Usuário'
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
          <a href="/perfil" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)', fontSize: '13px', textDecoration: 'none' }} title="Perfil">👤</a>
          {plan
            ? <button onClick={handlePortal} disabled={portalLoading} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: 'rgba(255,255,255,0.35)', fontSize: '13px', cursor: 'pointer' }} title="Assinatura">💳</button>
            : <a href="/landing#pricing" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px', borderRadius: '6px', border: '1px solid rgba(245,165,0,0.2)', background: 'rgba(245,165,0,0.06)', color: '#F5A500', fontSize: '11px', fontWeight: 700, textDecoration: 'none' }}>⚡</a>
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
