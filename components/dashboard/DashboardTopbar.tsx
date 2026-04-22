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
}

export function DashboardTopbar({ activeTab, clientData, onExport, onReset, onSave, pdfLoading }: Props) {
  const [savedFlash, setSavedFlash] = useState(false)
  const [pdfMenuOpen, setPdfMenuOpen] = useState(false)

  const allItems = SIDEBAR_SECTIONS.flatMap((s) => s.items)
  const currentTab = allItems.find((t) => t.key === activeTab)

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
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', borderRadius: '7px', overflow: 'hidden', border: 'none', background: 'linear-gradient(135deg, #F5A500, #FFD166)' }}>
            <button onClick={() => onExport('full')} disabled={pdfLoading} style={{
              padding: '5px 12px', background: 'transparent', border: 'none', color: '#000',
              fontSize: '11px', fontWeight: 700, cursor: pdfLoading ? 'not-allowed' : 'pointer',
              opacity: pdfLoading ? 0.65 : 1, borderRight: '1px solid rgba(0,0,0,0.15)',
            }}>
              {pdfLoading ? '⏳ Gerando...' : '↓ PDF'}
            </button>
            <button onClick={() => setPdfMenuOpen(v => !v)} disabled={pdfLoading} style={{
              padding: '5px 7px', background: 'transparent', border: 'none', color: '#000',
              fontSize: '10px', fontWeight: 700, cursor: pdfLoading ? 'not-allowed' : 'pointer',
              opacity: pdfLoading ? 0.65 : 1,
            }}>▾</button>
          </div>
          {pdfMenuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '110%', zIndex: 50,
              background: '#16161A', border: '1px solid #2A2A30', borderRadius: '10px',
              padding: '6px', minWidth: '160px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}>
              {[
                { label: '📄 Relatório completo', mode: 'full' as const },
                { label: '⚡ Resumo executivo', mode: 'executive' as const },
              ].map(({ label, mode }) => (
                <button key={mode} onClick={() => { onExport(mode); setPdfMenuOpen(false) }} style={{
                  display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left',
                  background: 'transparent', border: 'none', color: '#CBD5E1', fontSize: '11px',
                  cursor: 'pointer', borderRadius: '6px',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1E1E24')}
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
