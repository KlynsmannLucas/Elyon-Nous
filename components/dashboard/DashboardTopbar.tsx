// components/dashboard/DashboardTopbar.tsx
'use client'

import { useState } from 'react'
import type { TabKey } from './DashboardSidebar'
import { SIDEBAR_SECTIONS } from './DashboardSidebar'

interface Props {
  activeTab: TabKey
  clientData: any
  onExport: (mode?: 'executive' | 'full') => void
  onReset: () => void
  onSave: () => void
  pdfLoading: boolean
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
}

export function DashboardTopbar({ activeTab, clientData, onExport, onReset, onSave, pdfLoading, sidebarCollapsed, onToggleSidebar }: Props) {
  const [savedFlash, setSavedFlash] = useState(false)
  const [pdfMenuOpen, setPdfMenuOpen] = useState(false)

  const allItems    = SIDEBAR_SECTIONS.flatMap((s) => s.items)
  const currentTab  = allItems.find((t) => t.key === activeTab)

  const handleSave = () => {
    onSave()
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }

  return (
    <div style={{
      height: '50px', flexShrink: 0,
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      background: 'rgba(3,3,5,0.92)', backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', padding: '0 20px 0 16px', gap: '10px',
    }}>

      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        title={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
        style={{
          width: '30px', height: '30px', borderRadius: '7px', flexShrink: 0,
          border: '1px solid rgba(255,255,255,0.06)', background: 'transparent',
          color: 'rgba(255,255,255,0.3)', fontSize: '13px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
          <rect y="3"  width="20" height="2" rx="1" />
          <rect y="9"  width="14" height="2" rx="1" />
          <rect y="15" width="20" height="2" rx="1" />
        </svg>
      </button>

      {/* Divider */}
      <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

      {/* Breadcrumb */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.16)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', flexShrink: 0 }}>DASHBOARD</span>
        <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: '10px', flexShrink: 0 }}>/</span>
        {currentTab && (
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 500, flexShrink: 0 }}>
            {currentTab.icon} {currentTab.label}
          </span>
        )}
        {clientData?.niche && (
          <>
            <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: '10px', flexShrink: 0 }}>/</span>
            <span style={{
              fontSize: '10px', color: '#F5A500', opacity: 0.65,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {clientData.niche}
            </span>
          </>
        )}
      </div>

      {/* Client name pill */}
      {clientData?.clientName && (
        <div style={{
          fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '6px', padding: '3px 8px', flexShrink: 0, whiteSpace: 'nowrap',
          maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {clientData.clientName}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
        <button onClick={handleSave} style={{
          padding: '4px 11px', borderRadius: '7px', cursor: 'pointer', fontSize: '11px', fontWeight: 500,
          transition: 'all 0.15s',
          border: savedFlash ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,255,255,0.07)',
          background: savedFlash ? 'rgba(34,197,94,0.08)' : 'transparent',
          color: savedFlash ? '#22C55E' : 'rgba(255,255,255,0.38)',
        }}
          onMouseEnter={e => { if (!savedFlash) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' } }}
          onMouseLeave={e => { if (!savedFlash) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.38)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' } }}
        >
          {savedFlash ? '✓ Salvo' : '💾 Salvar'}
        </button>

        <button onClick={onReset} style={{
          padding: '4px 10px', borderRadius: '7px',
          border: '1px solid rgba(255,255,255,0.06)',
          background: 'transparent', color: 'rgba(255,255,255,0.28)', fontSize: '11px', cursor: 'pointer',
          transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.28)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
        >
          Trocar cliente
        </button>

        {/* PDF button */}
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', borderRadius: '7px', overflow: 'hidden', background: 'linear-gradient(135deg, #F5A500, #FFD166)' }}>
            <button onClick={() => onExport('full')} disabled={pdfLoading} style={{
              padding: '4px 11px', background: 'transparent', border: 'none', color: '#000',
              fontSize: '11px', fontWeight: 700, cursor: pdfLoading ? 'not-allowed' : 'pointer',
              opacity: pdfLoading ? 0.65 : 1, borderRight: '1px solid rgba(0,0,0,0.15)',
              transition: 'opacity 0.15s',
            }}>
              {pdfLoading ? '⏳ Gerando...' : '↓ PDF'}
            </button>
            <button onClick={() => setPdfMenuOpen(v => !v)} disabled={pdfLoading} style={{
              padding: '4px 7px', background: 'transparent', border: 'none', color: '#000',
              fontSize: '10px', fontWeight: 700, cursor: pdfLoading ? 'not-allowed' : 'pointer',
              opacity: pdfLoading ? 0.65 : 1,
              transition: `transform 0.15s`,
              transform: pdfMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}>▾</button>
          </div>

          {pdfMenuOpen && (
            <div className="animate-scale-in" style={{
              position: 'absolute', right: 0, top: '110%', zIndex: 50,
              background: '#16161A', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px', padding: '6px', minWidth: '168px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}>
              {[
                { label: '📄 Relatório completo', mode: 'full' as const },
                { label: '⚡ Resumo executivo',  mode: 'executive' as const },
              ].map(({ label, mode }) => (
                <button key={mode} onClick={() => { onExport(mode); setPdfMenuOpen(false) }} style={{
                  display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left',
                  background: 'transparent', border: 'none', color: '#CBD5E1', fontSize: '11px',
                  cursor: 'pointer', borderRadius: '6px', transition: 'background 0.12s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
