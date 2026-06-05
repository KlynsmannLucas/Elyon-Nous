// components/dashboard/DashboardTopbar.tsx
'use client'

import React, { useState, useRef, useEffect } from 'react'
import type { TabKey } from './DashboardSidebar'
import { SIDEBAR_SECTIONS } from './DashboardSidebar'
import { AlertsPanel } from './AlertsPanel'
import { CreditsDisplay } from './CreditsDisplay'
import { SaveIndicator, type SaveStatus } from './SaveIndicator'
import { ViewModeToggle } from './ViewModeToggle'
import { useViewMode, TAB_LABELS_SIMPLE } from '@/lib/viewMode'
import { useAppStore } from '@/lib/store'

interface Props {
  activeTab: TabKey
  clientData: any
  onExport: (mode?: 'executive' | 'full') => void
  onReset: () => void
  onSave: () => void
  onEdit?: () => void
  pdfLoading: boolean
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
  saveStatus?: SaveStatus
  saveErrorMsg?: string | null
}

const TAB_SUBTITLES: Partial<Record<TabKey, string>> = {
  overview:    'Resumo completo da performance das suas campanhas',
  analise:     'Auditoria avançada das campanhas, anúncios, criativos e oportunidades de otimização.',
  diagnostic:  'Visão executiva da performance, gargalos e impacto do marketing no negócio.',
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
  checklist:   'Tarefas geradas automaticamente para otimizar hoje',
  portal:      'Link white-label para o cliente acompanhar resultados',
  inteligencia:'Alertas proativos, sugestões avançadas e análises em tempo real',
  memory:      'Insights acumulados de análises anteriores — personalize o Assistente IA',
  workflow:    'Configure alertas e notificações com base nos dados das campanhas — execução automática em desenvolvimento',
  campanha:    'Histórico de campanhas criadas e performance ao longo do tempo',
}

export function DashboardTopbar({
  activeTab, clientData, onExport, onReset, onSave, onEdit, pdfLoading, sidebarCollapsed, onToggleSidebar,
  saveStatus = 'idle', saveErrorMsg,
}: Props) {
  const [clientMenuOpen,    setClientMenuOpen]    = useState(false)
  const [pdfMenuOpen,       setPdfMenuOpen]       = useState(false)
  const [briefingTooltip,   setBriefingTooltip]   = useState(false)
  const [briefingSaving,    setBriefingSaving]     = useState(false)
  const clientMenuRef = useRef<HTMLDivElement>(null)

  const briefingEnabled    = useAppStore(s => s.briefingEnabled)
  const setBriefingEnabled = useAppStore(s => s.setBriefingEnabled)

  const toggleBriefing = async () => {
    const next = !briefingEnabled
    setBriefingSaving(true)
    setBriefingEnabled(next)
    try {
      await fetch('/api/briefing-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      })
    } catch { /* silently fails — store already updated */ }
    setBriefingSaving(false)
  }

  // Auto-save on mount and every 60s silently
  useEffect(() => {
    onSave()
    const id = setInterval(() => onSave(), 60_000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close client menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (clientMenuRef.current && !clientMenuRef.current.contains(e.target as Node)) {
        setClientMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { mode: viewMode } = useViewMode()
  const allItems   = SIDEBAR_SECTIONS.flatMap(s => s.items)
  const currentTab = allItems.find(t => t.key === activeTab)
  // No modo simples, usa o rótulo simplificado da aba (consistente com o menu lateral)
  const tabTitle   = viewMode === 'simple' ? (TAB_LABELS_SIMPLE[activeTab] ?? currentTab?.label) : currentTab?.label
  const subtitle   = TAB_SUBTITLES[activeTab] || ''

  const today = new Date()
  const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  // Calcula o range real com base no último preset de auditoria salvo no store
  const { auditCache } = useAppStore()
  const lastAuditPreset = (() => {
    if (!clientData?.clientName) return null
    const entries = auditCache[clientData.clientName]
    if (!entries?.length) return null
    return (entries[0]?.audit as any)?._datePreset as string | undefined
  })()

  const dateRange = (() => {
    const preset = lastAuditPreset
    const d = new Date(today)
    if (preset === 'last_7d') {
      const s = new Date(d); s.setDate(d.getDate() - 7)
      return `${fmt(s)} — ${fmt(d)}`
    }
    if (preset === 'last_30d' || !preset) {
      const s = new Date(d); s.setDate(d.getDate() - 30)
      return `${fmt(s)} — ${fmt(d)}`
    }
    if (preset === 'last_90d') {
      const s = new Date(d); s.setDate(d.getDate() - 90)
      return `${fmt(s)} — ${fmt(d)}`
    }
    if (preset === 'this_month') {
      const s = new Date(d.getFullYear(), d.getMonth(), 1)
      return `${fmt(s)} — ${fmt(d)}`
    }
    if (preset === 'last_month') {
      const s = new Date(d.getFullYear(), d.getMonth() - 1, 1)
      const e = new Date(d.getFullYear(), d.getMonth(), 0)
      return `${fmt(s)} — ${fmt(e)}`
    }
    // fallback
    const s = new Date(d.getFullYear(), d.getMonth(), 1)
    return `${fmt(s)} — ${fmt(d)}`
  })()

  return (
    <div style={{
      height: '56px', flexShrink: 0,
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      background: 'rgba(8,10,20,0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center',
      padding: '0 20px 0 16px', gap: '10px',
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
            {tabTitle || 'Dashboard'}
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

      {/* AutoSave indicator */}
      <SaveIndicator status={saveStatus} errorMsg={saveErrorMsg} />

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

      {/* Client pill — click opens dropdown with "Trocar cliente" */}
      {clientData?.clientName && (
        <div ref={clientMenuRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setClientMenuOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '4px 10px', borderRadius: '7px', cursor: 'pointer',
              background: 'rgba(124,58,237,0.08)',
              border: `1px solid ${clientMenuOpen ? 'rgba(124,58,237,0.4)' : 'rgba(124,58,237,0.2)'}`,
              transition: 'all 0.15s',
            }}
          >
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
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none" style={{ color: 'rgba(196,181,253,0.5)', flexShrink: 0, transform: clientMenuOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.15s' }}>
              <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {clientMenuOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 9999,
              background: '#0F1629', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px', padding: '6px', minWidth: '160px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
            }}>
              {onEdit && (
                <button
                  onClick={() => { onEdit(); setClientMenuOpen(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    width: '100%', padding: '8px 10px', borderRadius: '7px',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: '#CBD5E1', fontSize: '12px', textAlign: 'left',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Editar dados do cliente
                </button>
              )}
              <button
                onClick={() => { window.dispatchEvent(new CustomEvent('elyon:open-profile-goal')); setClientMenuOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  width: '100%', padding: '8px 10px', borderRadius: '7px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: '#CBD5E1', fontSize: '12px', textAlign: 'left',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>
                </svg>
                Editar perfil/objetivo
              </button>
              <button
                onClick={() => { onReset(); setClientMenuOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  width: '100%', padding: '8px 10px', borderRadius: '7px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: '#CBD5E1', fontSize: '12px', textAlign: 'left',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Trocar cliente
              </button>
            </div>
          )}
        </div>
      )}

      {/* Morning briefing toggle */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={toggleBriefing}
          disabled={briefingSaving}
          title={briefingEnabled ? 'Morning briefing ativo — clique para desativar' : 'Ativar morning briefing por email'}
          onMouseEnter={() => setBriefingTooltip(true)}
          onMouseLeave={() => setBriefingTooltip(false)}
          style={{
            width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
            border: `1px solid ${briefingEnabled ? 'rgba(52,211,153,0.35)' : 'rgba(255,255,255,0.06)'}`,
            background: briefingEnabled ? 'rgba(52,211,153,0.1)' : 'transparent',
            color: briefingEnabled ? '#34D399' : 'rgba(255,255,255,0.3)',
            cursor: briefingSaving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
            opacity: briefingSaving ? 0.6 : 1,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </button>
        {briefingTooltip && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 9999,
            background: '#0F1629', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px', padding: '6px 10px', whiteSpace: 'nowrap',
            fontSize: '11px', color: '#CBD5E1',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          }}>
            {briefingEnabled
              ? <><span style={{ color: '#34D399' }}>● </span>Briefing ativo — clique para pausar</>
              : <><span style={{ color: 'rgba(255,255,255,0.3)' }}>○ </span>Receber briefing diário por email</>
            }
          </div>
        )}
      </div>

      {/* Modo Simplificado / Avançado toggle */}
      <ViewModeToggle variant="topbar" />

      {/* Credits display */}
      <CreditsDisplay />

      {/* Alerts bell */}
      <AlertsPanel clientName={clientData?.clientName} niche={clientData?.niche} />

      {/* PDF export */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
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
            {([
              { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, label: 'Relatório completo', mode: 'full' as const },
              { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, label: 'Resumo executivo', mode: 'executive' as const },
            ] as { icon: React.ReactNode; label: string; mode: 'full' | 'executive' }[]).map(({ icon, label, mode }) => (
              <button key={mode} onClick={() => { onExport(mode); setPdfMenuOpen(false) }} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                width: '100%', padding: '8px 12px', textAlign: 'left',
                background: 'transparent', border: 'none', color: '#CBD5E1',
                fontSize: '12px', cursor: 'pointer', borderRadius: '7px', transition: 'background 0.12s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
