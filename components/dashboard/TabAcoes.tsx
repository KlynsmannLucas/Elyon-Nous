// components/dashboard/TabAcoes.tsx — Plano de Ações consolidado
'use client'

import { useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { useViewMode, getUrgencyLabel } from '@/lib/viewMode'
import type { ClientData, StrategyData } from '@/lib/store'
import { syncActionStatus, useClientActions, retrySyncActions } from '@/hooks/useClientActions'

interface Props {
  clientData: ClientData | null
  strategyData: StrategyData | null
}

const C = {
  bg:       '#080D1A',
  surface:  '#0F1629',
  elevated: '#131E35',
  border:   'rgba(255,255,255,0.06)',
  purple:   '#7C3AED',
  purpleL:  '#A78BFA',
  green:    '#22C55E',
  greenBg:  'rgba(34,197,94,0.1)',
  red:      '#EF4444',
  redBg:    'rgba(239,68,68,0.1)',
  blue:     '#38BDF8',
  blueBg:   'rgba(56,189,248,0.1)',
  gold:     '#F59E0B',
  goldBg:   'rgba(245,158,11,0.1)',
  orange:   '#F97316',
  text1:    '#F1F5F9',
  text2:    '#94A3B8',
  text3:    'rgba(255,255,255,0.25)',
}

type Prioridade = 'critica' | 'alta' | 'media' | 'baixa'
type Status = 'pendente' | 'em_andamento' | 'concluida' | 'ignorada'
type Filtro = 'todas' | Status

const PRIORIDADE_CONFIG: Record<Prioridade, { label: string; color: string; bg: string; border: string; icon: string }> = {
  critica: { label: 'Crítica', color: C.red,    bg: C.redBg,    border: 'rgba(239,68,68,0.25)',   icon: '🔴' },
  alta:    { label: 'Alta',    color: C.orange,  bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)', icon: '🟠' },
  media:   { label: 'Média',   color: C.gold,    bg: C.goldBg,   border: 'rgba(245,158,11,0.25)',  icon: '🟡' },
  baixa:   { label: 'Baixa',   color: C.green,   bg: C.greenBg,  border: 'rgba(34,197,94,0.25)',   icon: '🟢' },
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; next: Status }> = {
  pendente:     { label: 'Pendente',     color: C.text2,  next: 'em_andamento' },
  em_andamento: { label: 'Em andamento', color: C.gold,   next: 'concluida' },
  concluida:    { label: 'Concluída',    color: C.green,  next: 'pendente' },
  ignorada:     { label: 'Ignorada',     color: C.text3,  next: 'pendente' },
}

const CATEGORIA_ICON: Record<string, string> = {
  Tracking: '📡', Criativos: '🎨', Audiências: '👥',
  Funil: '🔀', Escala: '📈', Estrutura: '🏗️', Orçamento: '💰',
}

const RESPONSAVEL_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  Gestor:   { label: 'Gestor',   color: C.blue,   bg: C.blueBg,              icon: '📡' },
  Copy:     { label: 'Copy',     color: C.purpleL, bg: 'rgba(167,139,250,0.1)', icon: '✏️' },
  Designer: { label: 'Designer', color: C.orange,  bg: 'rgba(249,115,22,0.1)', icon: '🎨' },
  Cliente:  { label: 'Cliente',  color: C.green,   bg: C.greenBg,             icon: '🏢' },
}

function prazoToDate(prazo: string, generatedAt?: string): string {
  const base = generatedAt ? new Date(generatedAt) : new Date()
  const days = prazo === 'Imediato' ? 1 : prazo === '7 dias' ? 7 : prazo === '30 dias' ? 30 : 90
  const d = new Date(base.getTime() + days * 86400000)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function TabAcoes({ clientData, strategyData }: Props) {
  const { auditCache, actionPlanCache, setActionPlanCache, updateActionStatus, pendingActionsCache, updatePendingActionStatus, updatePendingActionSyncState } = useAppStore()
  const { mode: viewMode } = useViewMode()
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [filtro, setFiltro]           = useState<Filtro>('todas')
  const [expanded, setExpanded]       = useState<string | null>(null)
  const [showAuditActions, setShowAuditActions] = useState(true)
  const [retrying, setRetrying]       = useState(false)
  const [retryResult, setRetryResult] = useState<{ succeeded: number; failed: number } | null>(null)

  // Hidrata store do Supabase ao abrir a aba (cross-device persistence)
  const { loading: hydrating } = useClientActions({ clientName: clientData?.clientName })

  const key             = clientData?.clientName || ''
  const actions         = actionPlanCache[key] || []
  const planGeneratedAt = actions[0]?.id ? new Date(parseInt(String(actions[0].id).split('_')[0])).toISOString() : undefined

  const auditHistory  = auditCache[key]
  const latestAudit   = Array.isArray(auditHistory) ? auditHistory[0]?.audit : auditHistory
  const metaIntelData = latestAudit?._intelligenceData || null

  // Ações auto-geradas da auditoria
  const pendingActions = pendingActionsCache[key] || []
  const pendingStats = {
    total:    pendingActions.filter(a => a.status !== 'ignorada').length,
    critica:  pendingActions.filter(a => a.urgency === 'critica' && a.status === 'pendente').length,
    pendente: pendingActions.filter(a => a.status === 'pendente').length,
    ignorada: pendingActions.filter(a => a.status === 'ignorada').length,
  }

  const unsyncedActions = pendingActions.filter(
    a => a.syncState === 'pending_sync' || a.syncState === 'sync_failed',
  )
  const unsyncedCount = unsyncedActions.length

  const handleRetrySync = async () => {
    if (retrying || !key || unsyncedCount === 0) return
    setRetrying(true)
    setRetryResult(null)
    const result = await retrySyncActions(key, unsyncedActions, updatePendingActionSyncState)
    setRetryResult(result)
    setRetrying(false)
  }

  const stats = {
    total:     actions.filter((a: any) => a.status !== 'ignorada').length,
    pendente:  actions.filter((a: any) => a.status === 'pendente').length,
    andamento: actions.filter((a: any) => a.status === 'em_andamento').length,
    concluida: actions.filter((a: any) => a.status === 'concluida').length,
    ignorada:  actions.filter((a: any) => a.status === 'ignorada').length,
  }
  const pct = stats.total > 0 ? Math.round((stats.concluida / stats.total) * 100) : 0

  const handleGenerate = async () => {
    if (!clientData) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/action-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientData, strategyData, auditData: latestAudit, metaIntelData }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setActionPlanCache(key, json.actions)
    } catch (e: any) {
      setError(e.message || 'Erro ao gerar plano.')
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (!actions.length) return
    const header = ['Prioridade', 'Categoria', 'Status', 'Prazo', 'Título', 'Descrição', 'Como executar', 'Impacto esperado']
    const rows = actions.map((a: any) => [
      a.prioridade, a.categoria,
      STATUS_CONFIG[a.status as Status]?.label || a.status,
      a.prazo, a.titulo, a.descricao, a.como, a.impacto,
    ])
    const escape = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = [header, ...rows].map(r => r.map(escape).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `plano-acoes-${key.replace(/\s+/g, '-').toLowerCase()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleStatusChange = (id: string) => {
    const item = actions.find((a: any) => a.id === id)
    if (!item) return
    const next = STATUS_CONFIG[item.status as Status]?.next || 'pendente'
    updateActionStatus(key, id, next)
  }

  const filtered = filtro === 'todas'
    ? actions
    : actions.filter((a: any) => a.status === filtro)

  const grouped = (['critica', 'alta', 'media', 'baixa'] as Prioridade[]).map((p) => ({
    prioridade: p,
    items: filtered.filter((a: any) => a.prioridade === p),
  })).filter(g => g.items.length > 0)

  if (!clientData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: C.text2, fontSize: 14 }}>
        Selecione um cliente para ver o plano de ações.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: C.text1, margin: '0 0 6px' }}>Plano de Ações</h2>
          <p style={{ fontSize: 13, color: C.text2, margin: 0 }}>
            Ações priorizadas geradas a partir de estratégia + Análise Profunda · {clientData.clientName}
          </p>
          {hydrating && (
            <span style={{ fontSize: 10, color: C.text3, display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, border: '1.5px solid rgba(124,58,237,0.3)', borderTopColor: '#A78BFA', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
              Sincronizando com a nuvem…
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {actions.length > 0 && (
            <button
              onClick={handleExportCSV}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: C.blueBg, color: C.blue, border: `1px solid rgba(56,189,248,0.25)`,
              }}>
              ↓ Exportar CSV
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
              borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', color: '#fff',
              border: 'none', opacity: loading ? 0.6 : 1,
            }}>
            {loading
              ? (<><span style={{ width: 16, height: 16, borderRadius: 999, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Gerando...</>)
              : actions.length > 0 ? '🔄 Atualizar plano' : '⚡ Gerar plano de ações'
            }
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { label: 'Estratégia',    ok: !!strategyData,                    icon: '⚡' },
          { label: 'Análise Profunda', ok: !!(latestAudit || metaIntelData), icon: '🔍' },
          { label: 'Dados cliente', ok: !!clientData,                      icon: '👤' },
        ].map(({ label, ok, icon }) => (
          <span key={label} style={{
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600,
            padding: '5px 12px', borderRadius: 999,
            background: ok ? C.greenBg : 'rgba(255,255,255,0.04)',
            color: ok ? C.green : C.text2,
            border: `1px solid ${ok ? 'rgba(34,197,94,0.2)' : C.border}`,
          }}>
            {icon} {label} {ok ? '✓' : '—'}
          </span>
        ))}
        {!latestAudit && !metaIntelData && (
          <span style={{ fontSize: 11, color: C.gold, display: 'flex', alignItems: 'center', gap: 4 }}>
            ⚠ Execute a análise Meta Ads para ações mais precisas
          </span>
        )}
      </div>

      {error && (
        <div style={{ background: C.redBg, border: `1px solid rgba(239,68,68,0.3)`, borderRadius: 12, padding: '12px 16px', fontSize: 13, color: C.red }}>
          {error}
        </div>
      )}

      {/* Ações da Auditoria — auto-geradas */}
      {pendingActions.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid rgba(167,139,250,0.2)`, borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>🔍</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text1 }}>Ações da Análise</span>
              {pendingStats.critica > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                  background: 'rgba(239,68,68,0.1)', color: C.red, border: '1px solid rgba(239,68,68,0.3)',
                }}>
                  {pendingStats.critica} crítica{pendingStats.critica > 1 ? 's' : ''}
                </span>
              )}
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                background: 'rgba(167,139,250,0.1)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.25)',
              }}>
                Auto-gerado da auditoria
              </span>
            </div>
            <button onClick={() => setShowAuditActions(v => !v)} style={{ fontSize: 11, color: '#A78BFA', background: 'none', border: 'none', cursor: 'pointer' }}>
              {showAuditActions ? '▲ Recolher' : '▼ Expandir'}
            </button>
          </div>

          {showAuditActions && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

              {/* Banner de sincronização */}
              {unsyncedCount > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: retryResult?.failed
                    ? 'rgba(239,68,68,0.07)'
                    : 'rgba(245,158,11,0.07)',
                  border: `1px solid ${retryResult?.failed ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
                  borderRadius: 10, padding: '8px 14px', gap: 10,
                }}>
                  <span style={{ fontSize: 11, color: retryResult?.failed ? C.red : C.gold }}>
                    {retryResult
                      ? retryResult.failed > 0
                        ? `⚠ ${retryResult.failed} ação${retryResult.failed > 1 ? 'ões' : ''} ainda sem sincronizar — verifique a conexão`
                        : `✓ Sincronização concluída`
                      : `☁ ${unsyncedCount} ação${unsyncedCount > 1 ? 'ões' : ''} não sincronizada${unsyncedCount > 1 ? 's' : ''} com o banco`
                    }
                  </span>
                  <button
                    onClick={handleRetrySync}
                    disabled={retrying}
                    style={{
                      fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 8,
                      cursor: retrying ? 'not-allowed' : 'pointer', border: 'none',
                      background: 'rgba(245,158,11,0.15)', color: C.gold,
                      opacity: retrying ? 0.6 : 1, flexShrink: 0,
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                    {retrying
                      ? <><span style={{ width: 10, height: 10, borderRadius: 999, border: '1.5px solid rgba(245,158,11,0.3)', borderTopColor: C.gold, display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Sincronizando…</>
                      : '↻ Sincronizar'
                    }
                  </button>
                </div>
              )}

              {(['critica', 'alta', 'media', 'baixa'] as Prioridade[]).map(urgency => {
                // Respeita o filtro global: mostra tudo ou filtra por status
                const items = pendingActions.filter(a =>
                  a.urgency === urgency &&
                  (filtro === 'todas' || a.status === filtro)
                )
                if (!items.length) return null
                const cfg = PRIORIDADE_CONFIG[urgency]
                return (
                  <div key={urgency}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, marginTop: 4 }}>
                      <span style={{ fontSize: 12 }}>{cfg.icon}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: cfg.color }}>
                        {getUrgencyLabel(urgency, viewMode)}
                      </span>
                    </div>
                    {items.map(item => {
                      const sCfg = STATUS_CONFIG[item.status as Status] || STATUS_CONFIG.pendente
                      const isOpen = expanded === item.id
                      const isIgnored = item.status === 'ignorada'
                      return (
                        <div key={item.id} style={{
                          background: C.elevated, borderRadius: 12, overflow: 'hidden',
                          border: `1px solid ${isIgnored ? 'rgba(255,255,255,0.04)' : C.border}`,
                          borderLeft: `3px solid ${isIgnored ? C.text3 : cfg.color}`,
                          marginBottom: 6,
                          opacity: isIgnored ? 0.5 : 1,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
                            {/* Botão de ciclo de status — sincroniza com Supabase */}
                            <button
                              title={`Status atual: ${sCfg.label} — clique para avançar`}
                              onClick={() => {
                                const next = isIgnored
                                  ? 'pendente'
                                  : (STATUS_CONFIG[item.status as Status]?.next || 'pendente')
                                syncActionStatus(
                                  item.dbId,
                                  item.id,
                                  key,
                                  next as Status,
                                  updatePendingActionStatus,
                                  updatePendingActionSyncState,
                                ).catch(() => {})
                              }}
                              style={{
                                width: 18, height: 18, borderRadius: 999, border: `2px solid ${sCfg.color}`,
                                flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', background: item.status === 'concluida' ? sCfg.color : 'transparent',
                              }}
                            >
                              {item.status === 'concluida' && <span style={{ fontSize: 9, color: '#000', fontWeight: 700 }}>✓</span>}
                              {item.status === 'em_andamento' && <span style={{ width: 7, height: 7, borderRadius: 999, background: sCfg.color, display: 'block' }} />}
                              {item.status === 'ignorada' && <span style={{ fontSize: 8, color: C.text3, fontWeight: 700 }}>–</span>}
                            </button>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                                <span style={{
                                  fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                                  background: item.platform === 'meta' ? 'rgba(24,119,242,0.12)' : item.platform === 'google' ? 'rgba(234,67,53,0.12)' : 'rgba(124,58,237,0.1)',
                                  color: item.platform === 'meta' ? '#1877F2' : item.platform === 'google' ? '#EA4335' : '#A78BFA',
                                  border: `1px solid ${item.platform === 'meta' ? 'rgba(24,119,242,0.25)' : item.platform === 'google' ? 'rgba(234,67,53,0.25)' : 'rgba(124,58,237,0.25)'}`,
                                }}>
                                  {item.platform === 'meta' ? '📘 Meta' : item.platform === 'google' ? '🔍 Google' : '📡 Ambos'}
                                </span>
                                <span style={{ fontSize: 10, color: sCfg.color }}>{sCfg.label}</span>
                                {item.metric && (
                                  <span style={{ fontSize: 10, color: C.text3 }}>· {item.metric}</span>
                                )}
                                {/* Indicador de estado de sync */}
                                {item.syncState === 'sync_failed' && (
                                  <span
                                    title="Falha ao sincronizar — clique em Sincronizar para tentar novamente"
                                    style={{ fontSize: 10, color: C.red, cursor: 'default', flexShrink: 0 }}>
                                    ⚠
                                  </span>
                                )}
                                {item.syncState === 'pending_sync' && (
                                  <span
                                    title="Aguardando sincronização com o banco de dados"
                                    style={{ fontSize: 10, color: C.gold, cursor: 'default', flexShrink: 0 }}>
                                    ☁
                                  </span>
                                )}
                              </div>
                              <span style={{
                                fontSize: 12, fontWeight: 600, color: C.text1,
                                textDecoration: item.status === 'concluida' || isIgnored ? 'line-through' : 'none',
                                opacity: item.status === 'concluida' || isIgnored ? 0.5 : 1,
                              }}>
                                {item.title}
                              </span>
                            </div>
                            {/* Botão ignorar (apenas para ações não-ignoradas) */}
                            {!isIgnored && (
                              <button
                                title="Ignorar esta ação"
                                onClick={() => syncActionStatus(
                                  item.dbId,
                                  item.id,
                                  key,
                                  'ignorada',
                                  updatePendingActionStatus,
                                  updatePendingActionSyncState,
                                ).catch(() => {})}
                                style={{
                                  width: 18, height: 18, borderRadius: 4, border: `1px solid ${C.border}`,
                                  flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  cursor: 'pointer', background: 'transparent', color: C.text3, fontSize: 10,
                                }}>
                                ×
                              </button>
                            )}
                            <button onClick={() => setExpanded(isOpen ? null : item.id)}
                              style={{ color: C.text3, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11 }}>
                              {isOpen ? '▲' : '▼'}
                            </button>
                          </div>
                          {isOpen && (
                            <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${C.border}` }}>
                              <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {item.description && (
                                  <div>
                                    <div style={{ fontSize: 10, color: C.text2, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Como executar</div>
                                    <p style={{ fontSize: 12, color: C.text1, lineHeight: 1.6, margin: 0 }}>{item.description}</p>
                                  </div>
                                )}
                                {item.evidence && (
                                  <div style={{ background: 'rgba(245,158,11,0.06)', borderRadius: 8, padding: '8px 12px', display: 'flex', gap: 8 }}>
                                    <span style={{ fontSize: 11, color: C.text2 }}>Evidência:</span>
                                    <span style={{ fontSize: 11, color: C.gold }}>{item.evidence}</span>
                                  </div>
                                )}
                                {item.impact && (
                                  <div style={{ background: C.surface, borderRadius: 8, padding: '8px 12px', display: 'flex', gap: 8 }}>
                                    <span style={{ fontSize: 11, color: C.text2 }}>Impacto esperado:</span>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: C.green }}>{item.impact}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
              {pendingStats.ignorada > 0 && filtro !== 'ignorada' && (
                <div style={{ fontSize: 11, color: C.text3, textAlign: 'center', paddingTop: 4 }}>
                  {pendingStats.ignorada} ação{pendingStats.ignorada > 1 ? 'ões' : ''} ignorada{pendingStats.ignorada > 1 ? 's' : ''} — use o filtro para visualizar
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 48, textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 999, border: '2px solid rgba(124,58,237,0.15)', borderTopColor: '#A78BFA', margin: '0 auto 20px', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text1, marginBottom: 6 }}>Consultando especialista sênior...</div>
          <div style={{ fontSize: 12, color: C.text2 }}>Analisando estratégia, auditoria e nicho para criar ações específicas</div>
        </div>
      )}

      {!loading && actions.length === 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '64px 24px', textAlign: 'center',
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.2 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text1, marginBottom: 8 }}>Nenhum plano gerado</div>
          <p style={{ fontSize: 12, color: C.text2, maxWidth: 360, lineHeight: 1.6, marginBottom: 20 }}>
            Clique em <strong style={{ color: C.text1 }}>Gerar plano de ações</strong> para criar uma lista priorizada
            com base na estratégia e auditoria do cliente.
          </p>
          <p style={{ fontSize: 11, color: C.text3 }}>
            Dica: execute a <strong style={{ color: C.text2 }}>Análise Profunda</strong> antes para ações mais precisas.
          </p>
        </div>
      )}

      {!loading && actions.length > 0 && (
        <>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text1 }}>Progresso geral</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: pct === 100 ? C.green : C.gold }}>{pct}%</span>
            </div>
            <div style={{ width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: 999, height: 6, marginBottom: 20, overflow: 'hidden' }}>
              <div style={{
                height: 6, borderRadius: 999, transition: 'width 0.5s ease',
                width: `${pct}%`,
                background: pct === 100 ? C.green : 'linear-gradient(90deg, #7C3AED, #A78BFA)',
              }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {([
                { label: 'Pendentes',    val: stats.pendente,  color: C.text2 },
                { label: 'Em andamento', val: stats.andamento, color: C.gold },
                { label: 'Concluídas',   val: stats.concluida, color: C.green },
              ] as const).map(({ label, val, color }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color }}>{val}</div>
                  <div style={{ fontSize: 11, color: C.text2, marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {([
              { key: 'todas',        label: `Todas (${stats.total})` },
              { key: 'pendente',     label: `Pendentes (${stats.pendente})` },
              { key: 'em_andamento', label: `Em andamento (${stats.andamento})` },
              { key: 'concluida',    label: `Concluídas (${stats.concluida})` },
              { key: 'ignorada',     label: `Ignoradas (${stats.ignorada ?? 0})` },
            ] as { key: Filtro; label: string }[]).map(({ key: f, label }) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                style={{
                  fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 999, cursor: 'pointer',
                  ...(filtro === f
                    ? { background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.3)', color: C.purpleL }
                    : { background: 'transparent', border: `1px solid ${C.border}`, color: C.text2 }),
                }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {grouped.map(({ prioridade, items }) => {
              const cfg = PRIORIDADE_CONFIG[prioridade]
              return (
                <div key={prioridade}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 14 }}>{cfg.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: cfg.color }}>
                      {viewMode === 'simple' ? getUrgencyLabel(prioridade, viewMode) : `Prioridade ${cfg.label}`}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                    }}>
                      {items.length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {items.map((item: any) => {
                      const sCfg = STATUS_CONFIG[item.status as Status] || STATUS_CONFIG.pendente
                      const isOpen = expanded === item.id
                      const imp = String(item.impacto || '').toLowerCase()
                      const impHigh  = imp.includes('alto') || imp.includes('crítico') || imp.includes('alta')
                      const impMid   = imp.includes('médio') || imp.includes('media') || imp.includes('moderado')
                      const impColor = impHigh ? C.green : impMid ? C.gold : C.text2
                      const impLabel = impHigh ? '💰 Alto' : impMid ? '💰 Médio' : '💰 Baixo'
                      const respCfg  = item.responsavel
                        ? RESPONSAVEL_CONFIG[item.responsavel] || { label: item.responsavel, color: C.text2, bg: 'rgba(255,255,255,0.04)', icon: '👤' }
                        : null

                      return (
                        <div key={item.id} style={{
                          background: C.surface, borderRadius: 14, overflow: 'hidden',
                          border: `1px solid ${C.border}`,
                          borderLeft: `3px solid ${cfg.color}`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                            <button
                              onClick={() => handleStatusChange(item.id)}
                              title={`Clique para avançar: ${sCfg.label} → ${STATUS_CONFIG[sCfg.next].label}`}
                              style={{
                                width: 20, height: 20, borderRadius: 999, border: `2px solid ${sCfg.color}`,
                                flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', background: item.status === 'concluida' ? sCfg.color : 'transparent',
                                transition: 'transform 0.15s',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
                              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                            >
                              {item.status === 'concluida' && <span style={{ fontSize: 10, color: '#000', fontWeight: 700 }}>✓</span>}
                              {item.status === 'em_andamento' && <span style={{ width: 8, height: 8, borderRadius: 999, background: sCfg.color, display: 'block' }} />}
                            </button>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                                <span style={{
                                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                                  background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                                }}>
                                  {CATEGORIA_ICON[item.categoria] || '📌'} {item.categoria}
                                </span>
                                <span style={{
                                  fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                                  background: 'rgba(255,255,255,0.04)', color: sCfg.color,
                                  border: `1px solid ${sCfg.color}30`,
                                }}>
                                  {sCfg.label}
                                </span>
                                <span style={{ fontSize: 10, color: C.text3 }}>
                                  ⏱ {prazoToDate(item.prazo, planGeneratedAt)} ({item.prazo})
                                </span>
                                {respCfg && (
                                  <span style={{
                                    fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                                    color: respCfg.color, background: respCfg.bg, border: `1px solid ${respCfg.color}30`,
                                  }}>
                                    {respCfg.icon} {respCfg.label}
                                  </span>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{
                                  fontSize: 13, fontWeight: 600, color: C.text1, lineHeight: 1.3,
                                  textDecoration: item.status === 'concluida' ? 'line-through' : 'none',
                                  opacity: item.status === 'concluida' ? 0.5 : 1,
                                }}>
                                  {item.titulo}
                                </span>
                                {item.impacto && (
                                  <span style={{
                                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                                    color: impColor, background: `${impColor}12`, border: `1px solid ${impColor}25`, flexShrink: 0,
                                  }}>
                                    {impLabel}
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => setExpanded(isOpen ? null : item.id)}
                              style={{ color: C.text3, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, flexShrink: 0, padding: '0 4px', transition: 'color 0.15s' }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = C.text1)}
                              onMouseLeave={(e) => (e.currentTarget.style.color = C.text3)}
                            >
                              {isOpen ? '▲' : '▼'}
                            </button>
                          </div>

                          {isOpen && (
                            <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${C.border}` }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 14 }}>
                                <div>
                                  <div style={{ fontSize: 10, color: C.text2, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Por quê</div>
                                  <p style={{ fontSize: 13, color: C.text1, lineHeight: 1.6, margin: 0 }}>{item.descricao}</p>
                                </div>
                                <div>
                                  <div style={{ fontSize: 10, color: C.text2, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Como executar</div>
                                  <p style={{ fontSize: 13, color: C.text1, lineHeight: 1.6, margin: 0 }}>{item.como}</p>
                                </div>
                                <div style={{
                                  display: 'flex', alignItems: 'center', gap: 10,
                                  background: C.elevated, borderRadius: 10, padding: '10px 14px',
                                }}>
                                  <span style={{ fontSize: 11, color: C.text2 }}>Impacto esperado:</span>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>{item.impacto}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
