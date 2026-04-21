// components/dashboard/DashboardTopbar.tsx
'use client'

import { useState } from 'react'
import type { TabKey } from './DashboardSidebar'
import { SIDEBAR_SECTIONS } from './DashboardSidebar'

interface Props {
  activeTab: TabKey
  clientData: any
  onExport: () => void
  onReset: () => void
  onSave: () => void
  pdfLoading: boolean
}

export function DashboardTopbar({ activeTab, clientData, onExport, onReset, onSave, pdfLoading }: Props) {
  const [savedFlash, setSavedFlash] = useState(false)

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
