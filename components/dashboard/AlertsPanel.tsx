// components/dashboard/AlertsPanel.tsx — Painel de alertas proativos (AGENT.md: Alert Agent)
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import type { Alert } from '@/app/api/alerts/route'

interface Props {
  clientName?: string
  niche?: string
}

const TYPE_CONFIG = {
  critical:    { color: '#FF4D4D', bg: 'rgba(255,77,77,0.08)',   border: 'rgba(255,77,77,0.2)',   icon: '🔴', label: 'Crítico' },
  warning:     { color: '#F0B429', bg: 'rgba(240,180,41,0.08)',  border: 'rgba(240,180,41,0.2)',  icon: '🟡', label: 'Alerta' },
  opportunity: { color: '#0E9E6E', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)',   icon: '🟢', label: 'Oportunidade' },
  info:        { color: '#2C5FE0', bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.2)',  icon: '🔵', label: 'Info' },
}

export function AlertsPanel({ clientName, niche }: Props) {
  const [open, setOpen] = useState(false)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [summary, setSummary] = useState({ total: 0, critical: 0, warning: 0, opportunity: 0, info: 0 })
  const [loading, setLoading] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'all' | Alert['type']>('all')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const lastClientRef = useRef<string>('')
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 })

  const auditCache = useAppStore(s => s.auditCache)

  const fetchAlerts = useCallback(async () => {
    if (!clientName || !niche) return
    if (loading) return
    setLoading(true)
    try {
      const audit = clientName ? auditCache[clientName]?.[0] : null
      const realMetrics = audit?.audit?._realMetrics ?? null

      // Transforma métricas agregadas em 1 "campanha" sintética para o motor de alertas
      const campaigns = realMetrics ? [{
        id: 'aggregate',
        name: 'Conta (todos os canais)',
        spend: realMetrics.totalSpend ?? 0,
        leads: realMetrics.totalLeads ?? 0,
        impressions: realMetrics.totalImpressions ?? 0,
        clicks: realMetrics.totalClicks ?? 0,
        ctr: realMetrics.avgCTR ?? 0,
        roas: realMetrics.avgROAS ?? 0,
        frequency: 0,
        platform: 'meta' as const,
      }] : []

      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaigns, audit, niche, clientData: { clientName } }),
      })
      if (!res.ok) return
      const data = await res.json()
      setAlerts(data.alerts ?? [])
      setSummary(data.summary ?? { total: 0, critical: 0, warning: 0, opportunity: 0, info: 0 })
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [clientName, niche, auditCache])

  // Busca alertas quando cliente muda
  useEffect(() => {
    if (!clientName || clientName === lastClientRef.current) return
    lastClientRef.current = clientName
    fetchAlerts()
  }, [clientName, fetchAlerts])

  // Busca quando abre o painel
  useEffect(() => {
    if (open) fetchAlerts()
  }, [open])

  // Fecha ao clicar fora (dropdown é fixed, então verifica button + dropdown separado)
  const dropdownRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      const insideButton = buttonRef.current?.contains(target)
      const insideDropdown = dropdownRef.current?.contains(target)
      if (!insideButton && !insideDropdown) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const unread = alerts.filter(a => !readIds.has(a.id)).length
  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.type === filter)

  function markAllRead() {
    setReadIds(new Set(alerts.map(a => a.id)))
  }

  function markRead(id: string) {
    setReadIds(prev => new Set([...prev, id]))
  }

  const criticalCount = summary.critical
  const badgeColor = criticalCount > 0 ? '#FF4D4D' : summary.warning > 0 ? '#F0B429' : '#0E9E6E'

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        ref={buttonRef}
        onClick={() => {
          if (!open && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect()
            setDropdownPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
          }
          setOpen(v => !v)
        }}
        title="Alertas proativos"
        style={{
          width: '30px', height: '30px', borderRadius: '7px', flexShrink: 0,
          border: open ? '1px solid rgba(240,180,41,0.3)' : '1px solid rgba(255,255,255,0.06)',
          background: open ? 'rgba(240,180,41,0.06)' : 'transparent',
          color: open ? '#F0B429' : 'rgba(255,255,255,0.3)',
          fontSize: '13px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s', position: 'relative',
        }}
        onMouseEnter={e => {
          if (!open) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
            e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'rgba(255,255,255,0.3)'
          }
        }}
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            background: badgeColor, color: '#fff',
            fontSize: '9px', fontWeight: 700, lineHeight: 1,
            padding: '2px 4px', borderRadius: '999px',
            minWidth: '14px', textAlign: 'center',
            border: '1.5px solid #F4F5F7',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown — position:fixed to escape topbar backdropFilter stacking context */}
      {open && (
        <div ref={dropdownRef} style={{
          position: 'fixed', top: dropdownPos.top, right: dropdownPos.right, zIndex: 9999,
          width: '380px', maxHeight: '520px',
          background: '#FFFFFF', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px', boxShadow: '0 16px 48px rgba(0,0,0,0.8)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px 10px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                Alertas Proativos
              </div>
              {summary.total > 0 && (
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                  {summary.critical > 0 && <span style={{ color: '#FF4D4D', marginRight: '8px' }}>●&nbsp;{summary.critical} crítico{summary.critical !== 1 ? 's' : ''}</span>}
                  {summary.warning > 0 && <span style={{ color: '#F0B429', marginRight: '8px' }}>●&nbsp;{summary.warning} alerta{summary.warning !== 1 ? 's' : ''}</span>}
                  {summary.opportunity > 0 && <span style={{ color: '#0E9E6E' }}>●&nbsp;{summary.opportunity} oportunidade{summary.opportunity !== 1 ? 's' : ''}</span>}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {unread > 0 && (
                <button onClick={markAllRead} style={{
                  fontSize: '10px', color: 'rgba(255,255,255,0.4)', background: 'transparent',
                  border: 'none', cursor: 'pointer', padding: '3px 6px',
                  borderRadius: '5px', transition: 'color 0.15s',
                }}>
                  Marcar lidos
                </button>
              )}
              <button onClick={() => fetchAlerts()} style={{
                fontSize: '11px', color: 'rgba(255,255,255,0.3)', background: 'transparent',
                border: 'none', cursor: 'pointer', padding: '3px',
                borderRadius: '5px',
              }}>
                {loading ? '⏳' : '↻'}
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          {summary.total > 0 && (
            <div style={{
              display: 'flex', gap: '4px', padding: '8px 12px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              {(['all', 'critical', 'warning', 'opportunity'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  fontSize: '10px', fontWeight: 600,
                  padding: '3px 8px', borderRadius: '5px', cursor: 'pointer',
                  border: filter === f ? '1px solid rgba(240,180,41,0.4)' : '1px solid rgba(255,255,255,0.06)',
                  background: filter === f ? 'rgba(240,180,41,0.08)' : 'transparent',
                  color: filter === f ? '#F0B429' : 'rgba(255,255,255,0.35)',
                  transition: 'all 0.15s',
                }}>
                  {f === 'all' ? `Todos (${summary.total})` :
                   f === 'critical' ? `🔴 ${summary.critical}` :
                   f === 'warning' ? `🟡 ${summary.warning}` :
                   `🟢 ${summary.opportunity}`}
                </button>
              ))}
            </div>
          )}

          {/* Alert list */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading && alerts.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '12px' }}>
                Analisando dados...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                  {summary.total === 0 ? '✅' : '🔍'}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                  {summary.total === 0
                    ? !clientName
                      ? 'Selecione um cliente para ver alertas'
                      : 'Nenhum alerta encontrado. Execute a auditoria Meta Ads para alertas mais precisos.'
                    : 'Nenhum alerta nesta categoria'}
                </div>
              </div>
            ) : (
              <div style={{ padding: '8px' }}>
                {filtered.map(alert => {
                  const cfg = TYPE_CONFIG[alert.type]
                  const isRead = readIds.has(alert.id)
                  return (
                    <div
                      key={alert.id}
                      onClick={() => markRead(alert.id)}
                      style={{
                        padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                        marginBottom: '4px',
                        background: isRead ? 'transparent' : cfg.bg,
                        border: `1px solid ${isRead ? 'rgba(255,255,255,0.04)' : cfg.border}`,
                        transition: 'all 0.15s',
                        opacity: isRead ? 0.55 : 1,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>{cfg.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '12px', fontWeight: 700,
                            color: isRead ? 'rgba(255,255,255,0.5)' : '#fff',
                            marginBottom: '3px',
                          }}>
                            {alert.title}
                          </div>
                          <div style={{
                            fontSize: '11px', color: 'rgba(255,255,255,0.5)',
                            lineHeight: '1.45', marginBottom: alert.metric ? '4px' : 0,
                          }}>
                            {alert.message}
                          </div>
                          {alert.metric && (
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                              <span style={{
                                fontSize: '10px', fontWeight: 700,
                                color: cfg.color, background: cfg.bg,
                                padding: '1px 6px', borderRadius: '4px',
                              }}>
                                {alert.metric}
                              </span>
                              {alert.benchmark && (
                                <span style={{
                                  fontSize: '10px', color: 'rgba(255,255,255,0.3)',
                                  padding: '1px 6px', borderRadius: '4px',
                                  background: 'rgba(255,255,255,0.04)',
                                  border: '1px solid rgba(255,255,255,0.06)',
                                }}>
                                  meta: {alert.benchmark}
                                </span>
                              )}
                            </div>
                          )}
                          {alert.action && (
                            <div style={{
                              fontSize: '10px', color: cfg.color,
                              fontWeight: 500, marginTop: '2px',
                            }}>
                              → {alert.action}
                            </div>
                          )}
                          {alert.campaign && (
                            <div style={{
                              fontSize: '9px', color: 'rgba(255,255,255,0.2)',
                              marginTop: '4px', fontFamily: 'var(--font-mono)',
                            }}>
                              {alert.platform === 'meta' ? 'Meta' : 'Google'}: {alert.campaign}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '8px 16px',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            fontSize: '10px', color: 'rgba(255,255,255,0.2)', textAlign: 'center',
          }}>
            Alertas gerados com base em dados reais das campanhas
          </div>
        </div>
      )}
    </div>
  )
}
