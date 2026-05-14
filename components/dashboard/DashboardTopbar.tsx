// components/dashboard/DashboardTopbar.tsx
'use client'

import { useState } from 'react'
import type { TabKey } from './DashboardSidebar'
import { SIDEBAR_SECTIONS } from './DashboardSidebar'
import { AlertsPanel } from './AlertsPanel'
import { CreditsDisplay } from './CreditsDisplay'

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

const TAB_SUBTITLES: Partial<Record<TabKey, string>> = {
  overview:    'Resumo completo da performance das suas campanhas',
  analise:     'Diagnóstico profundo dos seus anúncios com IA',
  diagnostic:  'Saúde geral do negócio e métricas estratégicas',
  funil:       'Visualize cada etapa da jornada do cliente',
  strategy:    'Plano de crescimento de 90 dias gerado por IA',
  acoes:       'Tarefas prioritárias para executar agora',
  performance: 'Histórico de resultados e evolução das métricas',
  relatorios:  'Exporte relatórios profissionais em PDF',
  anuncios:    'Dados reais de Meta Ads e Google Ads',
  audiencias:  'Segmentação e públicos das suas campanhas',
  persona:     'Perfil detalhado do cliente ideal',
  concorrentes:'Inteligência competitiva do seu mercado',
  cro:         'Análise de conversão e oportunidades de melhoria',
  conteudo:    'Criação de conteúdo com IA para seus anúncios',
  assets:      'Arquivos e materiais da empresa',
  budget:      'Distribuição inteligente do investimento',
  channelmix:  'Canal ideal por nicho e orçamento',
  mercado:     'Pesquisa de mercado e tendências do setor',
  cenarios:    'Projeções e simulações de crescimento',
  financeiro:  'Honorários, MRR da agência e gestão financeira',
}

export function DashboardTopbar({
  activeTab, clientData, onExport, onReset, onSave, pdfLoading, sidebarCollapsed, onToggleSidebar,
}: Props) {
  const [savedFlash, setSavedFlash] = useState(false)
  const [pdfMenuOpen, setPdfMenuOpen] = useState(false)

  const allItems   = SIDEBAR_SECTIONS.flatMap(s => s.items)
  const currentTab = allItems.find(t => t.key === activeTab)
  const subtitle   = TAB_SUBTITLES[activeTab] || ''

  const handleSave = () => {
    onSave()
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }

  // ── Today's date formatted ────────────────────────────────────────────────
  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const dateRange = `${fmt(firstOfMonth)} — ${fmt(today)}`

  return (
    <div style={{
      height: '56px', flexShrink: 0,
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      background: 'rgba(8,10,20,0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center',
      padding: '0 20px 0 16px', gap: '12px',
      position: 'relative', zIndex: 10,
    }}>

      {/* Sidebar toggle */}
      <button onClick={onToggleSidebar} title={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'} style={{
        width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
        border: '1px solid rgba(255,255,255,0.06)', background: 'transparent',
        color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.08)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.25)'; e.currentTarget.style.color = '#A78BFA' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
          <rect y="3"  width="20" height="2" rx="1" />
          <rect y="9"  width="14" height="2" rx="1" />
          <rect y="15" width="20" height="2" rx="1" />
        </svg>
      </button>

      {/* Divider */}
      <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />

      {/* Page title + subtitle */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#F1F5F9', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
            {currentTab?.label || 'Dashboard'}
          </span>
          {clientData?.niche && (
            <>
              <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: '10px' }}>·</span>
              <span style={{ fontSize: '11px', color: '#A78BFA', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                {clientData.niche}
              </span>
            </>
          )}
        </div>
        {subtitle && (
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* Date range pill */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '4px 10px', borderRadius: '7px', flexShrink: 0,
        border: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
        color: 'rgba(255,255,255,0.4)', fontSize: '11px',
        cursor: 'default',
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span>{dateRange}</span>
      </div>

      {/* Client pill */}
      {clientData?.clientName && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
          padding: '4px 10px', borderRadius: '7px',
          background: 'rgba(124,58,237,0.08)',
          border: '1px solid rgba(124,58,237,0.2)',
        }}>
          <div style={{
            width: '18px', height: '18px', borderRadius: '5px',
            background: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '9px', fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {clientData.clientName.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#C4B5FD', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {clientData.clientName}
          </span>
        </div>
      )}

      {/* Credits display */}
      <CreditsDisplay />

      {/* Alerts bell */}
      <AlertsPanel clientName={clientData?.clientName} niche={clientData?.niche} />

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>

        {/* Save */}
        <button onClick={handleSave} style={{
          padding: '5px 11px', borderRadius: '7px', cursor: 'pointer',
          fontSize: '11px', fontWeight: 500, transition: 'all 0.15s',
          border: savedFlash ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(255,255,255,0.07)',
          background: savedFlash ? 'rgba(34,197,94,0.08)' : 'transparent',
          color: savedFlash ? '#22C55E' : 'rgba(255,255,255,0.35)',
        }}
          onMouseEnter={e => { if (!savedFlash) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' } }}
          onMouseLeave={e => { if (!savedFlash) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' } }}
        >
          {savedFlash ? '✓ Salvo' : '💾'}
        </button>

        {/* Reset */}
        <button onClick={onReset} style={{
          padding: '5px 10px', borderRadius: '7px', fontSize: '11px',
          border: '1px solid rgba(255,255,255,0.06)', background: 'transparent',
          color: 'rgba(255,255,255,0.28)', cursor: 'pointer', transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.28)' }}
        >
          Trocar
        </button>

        {/* PDF */}
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'flex', borderRadius: '8px', overflow: 'hidden',
            background: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
            boxShadow: '0 2px 10px rgba(124,58,237,0.35)',
          }}>
            <button onClick={() => onExport('full')} disabled={pdfLoading} style={{
              padding: '5px 12px', background: 'transparent', border: 'none', color: '#fff',
              fontSize: '11px', fontWeight: 700, cursor: pdfLoading ? 'not-allowed' : 'pointer',
              opacity: pdfLoading ? 0.65 : 1, borderRight: '1px solid rgba(255,255,255,0.2)',
              transition: 'opacity 0.15s', whiteSpace: 'nowrap',
            }}>
              {pdfLoading ? '⏳' : '↓ PDF'}
            </button>
            <button onClick={() => setPdfMenuOpen(v => !v)} disabled={pdfLoading} style={{
              padding: '5px 8px', background: 'transparent', border: 'none', color: '#fff',
              fontSize: '10px', fontWeight: 700, cursor: pdfLoading ? 'not-allowed' : 'pointer',
              opacity: pdfLoading ? 0.65 : 1,
              transition: 'transform 0.15s',
              transform: pdfMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}>▾</button>
          </div>

          {pdfMenuOpen && (
            <div className="animate-scale-in" style={{
              position: 'fixed', top: '60px', right: '20px', zIndex: 9999,
              background: '#0F1629', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px', padding: '6px', minWidth: '172px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
            }}>
              {[
                { label: '📄 Relatório completo', mode: 'full' as const },
                { label: '⚡ Resumo executivo',  mode: 'executive' as const },
              ].map(({ label, mode }) => (
                <button key={mode} onClick={() => { onExport(mode); setPdfMenuOpen(false) }} style={{
                  display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left',
                  background: 'transparent', border: 'none', color: '#CBD5E1',
                  fontSize: '12px', cursor: 'pointer', borderRadius: '7px', transition: 'background 0.12s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.1)')}
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
