// components/dashboard/TabStrategy.tsx
'use client'

import { useState } from 'react'
import { StatCard } from './StatCard'
import { useAppStore } from '@/lib/store'
import { getBenchmark } from '@/lib/niche_benchmarks'

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

const card: React.CSSProperties = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 14,
  padding: 20,
}

interface Props {
  strategy: Record<string, any>
  analysis: Record<string, any>
}

// ── Sub-components (unchanged) ────────────────────────────────────────────────

function ChipList({ items, color, icon, limit = 4 }: { items: string[]; color: string; icon: string; limit?: number }) {
  const [showAll, setShowAll] = useState(false)
  if (!items?.length) return null
  const visible = showAll ? items : items.slice(0, limit)
  const extra   = items.length - limit
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
      {visible.map((item, i) => (
        <span key={i} style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 11, padding: '4px 10px', borderRadius: 20,
          background: `${color}18`, color, border: `1px solid ${color}30`,
        }}>
          <span style={{ flexShrink: 0 }}>{icon}</span>
          {item}
        </span>
      ))}
      {!showAll && extra > 0 && (
        <button onClick={() => setShowAll(true)} style={{
          fontSize: 11, padding: '4px 10px', borderRadius: 20, cursor: 'pointer',
          background: 'rgba(255,255,255,0.04)', color: C.text3, border: '1px solid rgba(255,255,255,0.08)',
        }}>
          +{extra} mais
        </button>
      )}
      {showAll && items.length > limit && (
        <button onClick={() => setShowAll(false)} style={{
          fontSize: 11, padding: '4px 10px', borderRadius: 20, cursor: 'pointer',
          background: 'rgba(255,255,255,0.04)', color: C.text3, border: '1px solid rgba(255,255,255,0.08)',
        }}>
          ver menos
        </button>
      )}
    </div>
  )
}

function FunnelStageCard({ label, icon, goal, tactics, color }: {
  label: string; icon: string; goal: string; tactics: string[]; color: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
      <button onClick={() => setOpen(v => !v)} style={{
        width: '100%', padding: '16px 20px', textAlign: 'left',
        background: open ? `${color}08` : 'transparent', cursor: 'pointer', border: 'none',
        transition: 'background 0.2s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color }}>{label}</span>
          </div>
          <span style={{ color: C.text3, fontSize: 10 }}>{open ? '▲' : '▼'}</span>
        </div>
        <p style={{ fontSize: 12, color: C.text2, marginTop: 8, lineHeight: 1.6 }}>{goal}</p>
      </button>
      {open && (
        <div style={{ padding: '12px 20px 16px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {tactics.map((t, i) => (
              <span key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 11, padding: '4px 10px', borderRadius: 20,
                background: `${color}15`, color, border: `1px solid ${color}30`,
              }}>→ {t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Plan90Days({ plan }: { plan: any[] }) {
  const [activeMonth, setActiveMonth] = useState(0)
  const [openWeek,   setOpenWeek]     = useState<number | null>(0)
  const month = plan[activeMonth]
  if (!month) return null
  const weeks = [month.week_1, month.week_2, month.week_3, month.week_4].filter(Boolean)
  return (
    <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
        {plan.map((m, i) => (
          <button key={i} onClick={() => { setActiveMonth(i); setOpenWeek(0) }}
            style={{
              flex: 1, padding: '12px 0', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', border: 'none', transition: 'all 0.2s',
              color:      activeMonth === i ? C.purpleL : C.text3,
              background: activeMonth === i ? 'rgba(124,58,237,0.08)' : 'transparent',
              borderBottom: activeMonth === i ? `2px solid ${C.purpleL}` : '2px solid transparent',
            }}>
            Mês {m.month}
          </button>
        ))}
      </div>
      <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Objetivo · </span>
        <span style={{ fontSize: 12, color: C.text1, fontWeight: 600 }}>{month.goal}</span>
      </div>
      <div>
        {weeks.map((week: string[], wi: number) => (
          <div key={wi} style={{ borderBottom: wi < weeks.length - 1 ? `1px solid ${C.border}` : 'none' }}>
            <button onClick={() => setOpenWeek(openWeek === wi ? null : wi)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 20px', cursor: 'pointer', border: 'none', background: 'transparent', textAlign: 'left',
              }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.text2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Semana {wi + 1}
              </span>
              <span style={{ color: C.text3, fontSize: 10 }}>
                {openWeek === wi ? '▲' : `${week.length} ações ▼`}
              </span>
            </button>
            {openWeek === wi && (
              <div style={{ padding: '0 20px 14px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {week.map((action: string, ai: number) => (
                  <span key={ai} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 11, padding: '4px 10px', borderRadius: 20,
                    background: 'rgba(124,58,237,0.08)', color: C.purpleL, border: '1px solid rgba(124,58,237,0.25)',
                  }}>· {action}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function KeyActionsSection({ actions }: { actions: string[] }) {
  const [showAll, setShowAll] = useState(false)
  const limit   = 5
  const visible = showAll ? actions : actions.slice(0, limit)
  const extra   = actions.length - limit
  return (
    <div style={card}>
      <div style={{ fontWeight: 700, color: C.text1, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          width: 28, height: 28, borderRadius: 8, background: 'rgba(124,58,237,0.12)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
        }}>⚡</span>
        Ações Prioritárias
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.map((action: string, i: number) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 14px', background: C.elevated, borderRadius: 10,
          }}>
            <span style={{
              width: 22, height: 22, borderRadius: 6, background: `${C.gold}20`,
              color: C.gold, fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {i + 1}
            </span>
            <span style={{ fontSize: 12, color: C.text1 }}>{action}</span>
          </div>
        ))}
      </div>
      {!showAll && extra > 0 && (
        <button onClick={() => setShowAll(true)} style={{
          marginTop: 10, width: '100%', fontSize: 11, color: C.text3,
          padding: '8px 0', borderRadius: 10, cursor: 'pointer',
          background: 'transparent', border: `1px solid ${C.border}`, transition: 'all 0.2s',
        }}>
          Ver todas (+{extra} ações) ▼
        </button>
      )}
      {showAll && actions.length > limit && (
        <button onClick={() => setShowAll(false)} style={{
          marginTop: 10, width: '100%', fontSize: 11, color: C.text3,
          padding: '8px 0', borderRadius: 10, cursor: 'pointer',
          background: 'transparent', border: `1px solid ${C.border}`,
        }}>
          Ver menos ▲
        </button>
      )}
    </div>
  )
}

function CollapsibleSection({ title, icon, defaultOpen = true, children }: {
  title: string; icon?: string; defaultOpen?: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
      <button onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', cursor: 'pointer', border: 'none', background: 'transparent', textAlign: 'left',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {icon && (
            <span style={{
              width: 30, height: 30, borderRadius: 8, background: C.elevated,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
            }}>{icon}</span>
          )}
          <span style={{ fontWeight: 700, color: C.text1, fontSize: 14 }}>{title}</span>
        </div>
        <span style={{ color: C.text3, fontSize: 11, flexShrink: 0, marginLeft: 12 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div style={{ padding: '0 20px 20px' }}>{children}</div>}
    </div>
  )
}

function FunnelHealthRow({ funnel_health }: { funnel_health: Record<string, any> }) {
  const [active, setActive] = useState<string | null>(null)
  const stages = [
    { key: 'tofu', label: 'TOFU', short: 'Atração'   },
    { key: 'mofu', label: 'MOFU', short: 'Nutrição'  },
    { key: 'bofu', label: 'BOFU', short: 'Conversão' },
  ]
  const color = (s: string) => s === 'ok' ? C.green : s === 'atenção' ? C.gold : C.red
  const emoji = (s: string) => s === 'ok' ? '🟢' : s === 'atenção' ? '🟡' : '🔴'
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {stages.map(({ key, label, short }) => {
          const s = funnel_health[key]
          if (!s) return null
          const c = color(s.status)
          const isActive = active === key
          return (
            <button key={key} onClick={() => setActive(isActive ? null : key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.2s',
                background: isActive ? `${c}18` : `${c}0D`,
                color: c, border: `1px solid ${isActive ? c : `${c}30`}`,
              }}>
              {emoji(s.status)} {label}: {s.status === 'ok' ? 'Saudável' : s.status === 'atenção' ? 'Atenção' : 'Crítico'}
              <span style={{ fontSize: 10, opacity: 0.6 }}>({short})</span>
            </button>
          )
        })}
      </div>
      {active && (() => {
        const s = funnel_health[active]
        const c = color(s.status)
        return (
          <div style={{
            borderRadius: 10, padding: '12px 16px', fontSize: 12, lineHeight: 1.6,
            background: `${c}08`, border: `1px solid ${c}20`,
          }}>
            <span style={{ fontWeight: 600, color: c }}>Problema: </span>
            <span style={{ color: C.text2 }}>{s.issue}</span>
            <span style={{ margin: '0 8px', color: C.text3 }}>·</span>
            <span style={{ fontWeight: 600, color: c }}>Ação: </span>
            <span style={{ color: C.text1 }}>{s.action}</span>
          </div>
        )
      })()}
    </div>
  )
}

// ── Nova seção: Estratégia por Campanhas ─────────────────────────────────────

function CampanhaEstrategiaSection({
  campanhasClassificadas,
  bench,
}: {
  campanhasClassificadas: any
  bench: any
}) {
  const [tab, setTab] = useState<'vencedoras' | 'atencao' | 'criticas'>('vencedoras')
  const vencedoras: any[] = campanhasClassificadas?.vencedoras || []
  const atencao: any[]    = campanhasClassificadas?.atencao    || []
  const criticas: any[]   = campanhasClassificadas?.criticas   || []
  const total = vencedoras.length + atencao.length + criticas.length
  if (total === 0) return null

  const tabs = [
    { id: 'vencedoras' as const, label: `🏆 Vencedoras (${vencedoras.length})`, color: C.green,
      strategy: 'Escalar com cautela: aumentar orçamento em 15–20% a cada 3–5 dias desde que o CPL permaneça estável.' },
    { id: 'atencao'    as const, label: `⚠ Atenção (${atencao.length})`,       color: C.gold,
      strategy: 'Revisar segmentação, criativo e oferta. Candidatas a teste A/B antes de aumentar verba.' },
    { id: 'criticas'   as const, label: `🔴 Críticas (${criticas.length})`,     color: C.red,
      strategy: 'Reduzir verba ou pausar. Revisar tracking, segmentação e criativo antes de reinvestir.' },
  ]

  const active = tabs.find(t => t.id === tab)!
  const camps: any[] = campanhasClassificadas?.[tab] || []

  return (
    <CollapsibleSection title="Estratégia por Campanhas" icon="📊" defaultOpen={true}>
      {/* estratégia orientada */}
      <div style={{
        padding: '10px 14px', borderRadius: 10, marginBottom: 14,
        background: `${active.color}08`, border: `1px solid ${active.color}20`,
        fontSize: 12, color: C.text2, lineHeight: 1.6,
      }}>
        <span style={{ fontWeight: 700, color: active.color }}>Diretriz: </span>
        {active.strategy}
        {bench && tab === 'vencedoras' && (
          <span> Benchmark do nicho: R${bench.cpl_min}–{bench.cpl_max} CPL.</span>
        )}
      </div>

      {/* tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '8px 4px', borderRadius: 10, fontSize: 11, fontWeight: 700,
              cursor: 'pointer', border: 'none', transition: 'all 0.2s',
              background: tab === t.id ? `${t.color}18` : 'transparent',
              color:      tab === t.id ? t.color : C.text3,
              outline:    tab === t.id ? `1px solid ${t.color}40` : '1px solid rgba(255,255,255,0.06)',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* listagem */}
      {camps.length === 0 ? (
        <p style={{ fontSize: 12, color: C.text3, textAlign: 'center', padding: '16px 0' }}>
          Nenhuma campanha nesta categoria.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {camps.map((c: any, i: number) => {
            const cpl = c.leads > 0 ? Math.round(c.spend / c.leads) : null
            const cplColor = bench && cpl
              ? cpl < bench.cpl_min ? C.green : cpl <= bench.cpl_max ? C.gold : C.red
              : active.color
            return (
              <div key={i} style={{
                borderRadius: 10, padding: '12px 14px',
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${active.color}18`,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>{c.name}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                      {c.spend > 0 && (
                        <span style={{ fontSize: 10, color: C.text3 }}>
                          R${c.spend.toLocaleString('pt-BR')}
                        </span>
                      )}
                      {cpl !== null && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: cplColor }}>
                          CPL R${cpl}
                          {bench && ` (bench R$${bench.cpl_min}–${bench.cpl_max})`}
                        </span>
                      )}
                      {c.leads > 0 && <span style={{ fontSize: 10, color: C.text3 }}>{c.leads} leads</span>}
                      {c.ctr > 0 && <span style={{ fontSize: 10, color: C.text3 }}>CTR {c.ctr.toFixed(1)}%</span>}
                      {c.frequency > 0 && <span style={{ fontSize: 10, color: c.frequency > 4 ? C.red : C.text3 }}>Freq {c.frequency.toFixed(1)}×</span>}
                    </div>
                  </div>
                  {c.recommended_action && (
                    <div style={{ fontSize: 10, color: C.text2, maxWidth: 200, textAlign: 'right', flexShrink: 0 }}>
                      → {c.recommended_action}
                    </div>
                  )}
                </div>
                {c.evidence && (
                  <p style={{ fontSize: 9, color: `${active.color}80`, marginTop: 6, lineHeight: 1.5 }}>
                    {c.evidence}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </CollapsibleSection>
  )
}

// ── Nova seção: Prioridades Estratégicas (de o_que_eu_faria_agora) ────────────

function PrioridadesEstrategicas({
  acoes,
  clientData,
  addPendingActions,
}: {
  acoes: any[]
  clientData: any
  addPendingActions: (name: string, actions: any[]) => void
}) {
  const [sentActions, setSentActions] = useState<Set<number>>(new Set())
  if (!acoes?.length) return null

  return (
    <CollapsibleSection title="Prioridades Estratégicas" icon="⚡" defaultOpen={true}>
      <p style={{ fontSize: 11, color: C.text3, marginBottom: 14, lineHeight: 1.5 }}>
        Derivadas da última Análise Profunda — execute primeiro, depois escale.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {acoes.map((action: any, i: number) => {
          const isObj      = typeof action === 'object' && action !== null
          const titulo     = isObj ? action.titulo    : action
          const prioridade = isObj ? action.prioridade : null
          const motivo     = isObj ? action.motivo    : null
          const evidencia  = isObj ? action.evidencia : null
          const impacto    = isObj ? action.impacto   : null
          const prazo      = isObj ? action.prazo     : null
          const esforco    = isObj ? action.esforco   : null
          const prioColor  = prioridade === 'P1' ? C.red : prioridade === 'P2' ? C.gold : C.text3
          const sent       = sentActions.has(i)

          return (
            <div key={i} style={{
              borderRadius: 10, padding: '12px 14px',
              background: 'rgba(240,180,41,0.04)',
              border: `1px solid rgba(240,180,41,0.15)`,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                {/* número */}
                <span style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                  background: C.gold, color: '#000', fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text1, margin: 0, lineHeight: 1.4 }}>{titulo}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {prioridade && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                          color: prioColor, background: `${prioColor}18`, border: `1px solid ${prioColor}30`,
                        }}>
                          {prioridade}
                        </span>
                      )}
                      {prazo && <span style={{ fontSize: 9, color: C.text3 }}>{prazo}</span>}
                      {esforco && <span style={{ fontSize: 9, color: C.text3 }}>esforço {esforco}</span>}
                    </div>
                  </div>
                  {motivo   && <p style={{ fontSize: 11, color: C.text2, margin: '6px 0 0', lineHeight: 1.5 }}>{motivo}</p>}
                  {evidencia && <p style={{ fontSize: 10, color: 'rgba(240,180,41,0.7)', margin: '4px 0 0', lineHeight: 1.4 }}>📊 {evidencia}</p>}
                  {impacto  && <p style={{ fontSize: 10, color: 'rgba(34,197,94,0.8)', margin: '4px 0 0', lineHeight: 1.4 }}>→ {impacto}</p>}
                </div>
                {/* botão enviar para ações */}
                {clientData && (
                  <button
                    title={sent ? 'Já enviada para Ações Prioritárias' : 'Enviar para Ações Prioritárias'}
                    onClick={() => {
                      if (sent) return
                      const newAction = {
                        id: `strategy_${Date.now()}_${i}`,
                        clientId: '',
                        title: titulo,
                        description: [motivo, evidencia].filter(Boolean).join(' — '),
                        platform: 'ambos' as const,
                        urgency: (prioridade === 'P1' ? 'critica' : prioridade === 'P2' ? 'alta' : 'media') as 'critica' | 'alta' | 'media',
                        priority: i + 1,
                        impact: impacto || '',
                        evidence: evidencia,
                        status: 'pendente' as const,
                        source: 'auditoria' as const,
                        origin: 'strategy',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      }
                      addPendingActions(clientData.clientName, [newAction])
                      setSentActions(prev => new Set(prev).add(i))
                    }}
                    style={{
                      flexShrink: 0, fontSize: 10, fontWeight: 600,
                      padding: '4px 8px', borderRadius: 8, cursor: sent ? 'default' : 'pointer',
                      background: sent ? 'rgba(34,197,94,0.1)' : 'rgba(240,180,41,0.1)',
                      color:      sent ? C.green : C.gold,
                      border:     `1px solid ${sent ? 'rgba(34,197,94,0.3)' : 'rgba(240,180,41,0.25)'}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    {sent ? '✓ Enviado' : '+ Ações'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </CollapsibleSection>
  )
}

// ── Score Growth baseado na auditoria ─────────────────────────────────────────

function calcScoreGrowth(
  strategyScore: number,
  latestAudit: any,
  bench: any,
): { score: number; label: string; breakdown: string } {
  if (!latestAudit) {
    return { score: strategyScore, label: strategyScore >= 75 ? 'Boa' : 'Regular', breakdown: 'Baseado na estratégia gerada.' }
  }

  const healthScore = latestAudit?.health_score || strategyScore
  let score = healthScore
  const notes: string[] = []

  const venc    = (latestAudit._campanhasClassificadas?.vencedoras || []).length
  const criticas = (latestAudit._campanhasClassificadas?.criticas  || []).length
  const checklist: any[] = latestAudit._trackingChecklist || []
  const unverified = checklist.filter((t: any) => t.status === 'nao_verificado').length
  const problems   = checklist.filter((t: any) => t.status === 'problema').length
  const confidence = latestAudit._dataQuality?.confidence
  const wastePercent = latestAudit._wastePercent || 0
  const realCPL = Number(latestAudit._realMetrics?.avgCPL || 0)
  const oqef: any[] = latestAudit.o_que_eu_faria_agora || []
  const hasP1 = oqef.some((a: any) => (typeof a === 'object' ? a?.prioridade : null) === 'P1')

  if (venc >= 3) { score += 5; notes.push('+5 por ≥3 campanhas vencedoras') }
  else if (venc >= 1) { score += 2; notes.push('+2 por campanha vencedora') }

  if (bench && realCPL > 0) {
    if (realCPL < bench.cpl_min) { score += 8; notes.push('+8 CPL abaixo do benchmark') }
    else if (realCPL <= bench.cpl_max) { score += 3; notes.push('+3 CPL dentro do benchmark') }
    else { score -= 5; notes.push('−5 CPL acima do benchmark') }
  }

  if (criticas >= 3) { score -= 8; notes.push('−8 por ≥3 campanhas críticas') }
  else if (criticas >= 1) { score -= 3; notes.push('−3 por campanhas críticas') }

  if (unverified >= 4) { score -= 6; notes.push('−6 tracking não verificado') }
  else if (unverified >= 2) { score -= 2; notes.push('−2 itens de tracking pendentes') }

  if (problems > 0) { score -= 4 * problems; notes.push(`−${4 * problems} problemas de tracking`) }

  if (confidence === 'baixa') { score -= 10; notes.push('−10 confiança baixa dos dados') }
  else if (confidence === 'media') { score -= 3; notes.push('−3 confiança média') }

  if (wastePercent > 30) { score -= 6; notes.push(`−6 desperdício ${wastePercent}%`) }
  else if (wastePercent > 15) { score -= 3; notes.push(`−3 desperdício ${wastePercent}%`) }

  if (hasP1) { score -= 3; notes.push('−3 ação crítica P1 pendente') }

  score = Math.min(100, Math.max(0, Math.round(score)))
  const label = score >= 80 ? 'Excelente' : score >= 65 ? 'Boa' : score >= 50 ? 'Regular' : 'Crítico'
  return { score, label, breakdown: notes.slice(0, 4).join(' · ') || 'Baseado no score de saúde da auditoria.' }
}

// ── Head of Growth inteligente ─────────────────────────────────────────────────

function buildHeadOfGrowthText(
  latestAudit: any,
  strategyRec: string,
  bench: any,
  clientData: any,
): string {
  if (!latestAudit) return strategyRec

  const healthScore = latestAudit.health_score || 0
  const grade = latestAudit.grade || '—'
  const realCPL = Number(latestAudit._realMetrics?.avgCPL || 0)
  const realSpend = Number(latestAudit._realMetrics?.totalSpend || 0)
  const realLeads = Number(latestAudit._realMetrics?.totalLeads || 0)
  const confidence = latestAudit._dataQuality?.confidence
  const checklist: any[] = latestAudit._trackingChecklist || []
  const unverified = checklist.filter((t: any) => t.status === 'nao_verificado').length
  const problems   = checklist.filter((t: any) => t.status === 'problema').length
  const gargalos: any[] = latestAudit.gargalos || []
  const venc = (latestAudit._campanhasClassificadas?.vencedoras || []).length
  const criticas = (latestAudit._campanhasClassificadas?.criticas || []).length
  const wastePercent = latestAudit._wastePercent || 0
  const tracking = latestAudit.tracking
  const trackingCritico = tracking?.prioridade_maxima

  const parts: string[] = []

  // Fase da conta
  if (realSpend > 100000 || realLeads > 10000) {
    parts.push(`Esta conta está em fase de escala madura — R$${Math.round(realSpend / 1000)}k investidos e ${realLeads.toLocaleString('pt-BR')} leads gerados.`)
  } else if (realSpend > 20000 || realLeads > 1000) {
    parts.push(`Conta em crescimento com dados suficientes para otimização — R$${Math.round(realSpend / 1000)}k investidos e ${realLeads.toLocaleString('pt-BR')} leads.`)
  } else if (realSpend > 0) {
    parts.push(`Conta em fase inicial de aprendizado — dados em acumulação.`)
  }

  // Score e eficiência de CPL
  if (bench && realCPL > 0) {
    if (realCPL < bench.cpl_min) {
      parts.push(`CPL real de R$${realCPL} está ${Math.round((1 - realCPL / bench.cpl_min) * 100)}% abaixo do benchmark (R$${bench.cpl_min}–${bench.cpl_max}) — sinal claro de eficiência.`)
    } else if (realCPL <= bench.cpl_max) {
      parts.push(`CPL de R$${realCPL} está dentro do benchmark do nicho (R$${bench.cpl_min}–${bench.cpl_max}) — conta equilibrada.`)
    } else {
      parts.push(`CPL de R$${realCPL} está acima do benchmark (R$${bench.cpl_min}–${bench.cpl_max}) — otimização é prioridade antes de escalar.`)
    }
  }

  // Alerta de tracking
  if (trackingCritico || problems > 0) {
    parts.push(`⚠ Tracking com problemas críticos detectados — escala agressiva antes de corrigir pode multiplicar erros de dados e prejudicar a otimização dos algoritmos.`)
  } else if (unverified >= 4) {
    parts.push(`Tracking parcialmente não verificado (${unverified} itens). Valide os eventos de conversão antes de aumentar investimento.`)
  }

  // Maior gargalo
  if (gargalos.length > 0) {
    const top = gargalos[0]
    parts.push(`Maior gargalo identificado: ${top.titulo}${top.impacto ? ` (${top.impacto})` : ''}.`)
  }

  // Campanhas
  if (venc > 0 && criticas === 0) {
    parts.push(`${venc} campanha${venc > 1 ? 's vencedoras' : ' vencedora'} identificada${venc > 1 ? 's' : ''} — candidata${venc > 1 ? 's' : ''} à escala controlada de 15–20% a cada 3–5 dias.`)
  } else if (venc > 0 && criticas > 0) {
    parts.push(`${venc} campanha${venc > 1 ? 's vencedoras' : ' vencedora'} com potencial de escala, mas ${criticas} crítica${criticas > 1 ? 's' : ''} consumindo verba sem retorno — realoque antes de escalar.`)
  }

  // O que não fazer
  if (wastePercent > 20) {
    parts.push(`Não escale com ${wastePercent}% de verba desperdiçada em campanhas sem conversão — corrija o desperdício primeiro.`)
  }
  if (confidence === 'baixa') {
    parts.push(`Confiança dos dados baixa — estratégia conservadora recomendada até enriquecer o histórico.`)
  }

  return parts.length > 0 ? parts.slice(0, 4).join(' ') : (strategyRec || 'Análise em processamento.')
}

// ── Componente principal ───────────────────────────────────────────────────────

export function TabStrategy({ strategy, analysis }: Props) {
  const { clientData, auditCache, connectedAccounts, addPendingActions } = useAppStore()
  const hasRealData   = strategy && strategy.priority_ranking?.length > 0
  const hasGrowthData = strategy?.growth_diagnosis || strategy?.funnel_strategy

  const cacheKey    = clientData?.clientName || ''
  const auditEntry  = auditCache[cacheKey]?.[0]
  const latestAudit = auditEntry?.audit
  const auditDate   = auditEntry?.createdAt

  // Dados da auditoria
  const realMetrics         = latestAudit?._realMetrics
  const hasRealMetrics      = Boolean(realMetrics?.totalSpend > 0 || realMetrics?.totalLeads > 0)
  const campanhasClass      = latestAudit?._campanhasClassificadas
  const dataQuality         = latestAudit?._dataQuality
  const trackingChecklist   = (latestAudit?._trackingChecklist as any[]) || []
  const auditSource         = latestAudit?._auditSource
  const gargalos            = (latestAudit?.gargalos as any[]) || []
  const oportunidades       = (latestAudit?.oportunidades as any[]) || []
  const oQueEuFariaAgora    = (latestAudit?.o_que_eu_faria_agora as any[]) || []
  const healthScore         = latestAudit?.health_score
  const grade               = latestAudit?.grade
  const hasFullAudit        = Boolean(latestAudit && (healthScore || campanhasClass || gargalos.length > 0))
  const metaConnected       = connectedAccounts.some(a => a.platform === 'meta')

  // Tracking alerta
  const unverifiedCount     = trackingChecklist.filter((t: any) => t.status === 'nao_verificado').length
  const problemCount        = trackingChecklist.filter((t: any) => t.status === 'problema').length
  const trackingCritico     = latestAudit?.tracking?.prioridade_maxima || problemCount > 0
  const trackingFraco       = trackingCritico || unverifiedCount >= 4
  const confidenceBaixa     = dataQuality?.confidence === 'baixa'
  const blockAgressiveScale = trackingFraco || confidenceBaixa

  // Benchmark
  const bench = clientData?.niche ? getBenchmark(clientData.niche) : null

  // Score Growth calculado com base na auditoria
  const growthCalc = calcScoreGrowth(
    strategy?.intelligence_score || 0,
    latestAudit,
    bench,
  )

  // Orçamento
  const channels = hasRealData
    ? strategy.priority_ranking.map((ch: any) => ({
        name: ch.channel, priority: ch.priority,
        budget: `R$${(ch.budget_brl || 0).toLocaleString('pt-BR')}`,
        cpl: `R$${ch.cpl_min}–${ch.cpl_max}`,
        status: 'Ativo', rationale: ch.rationale, budgetPct: ch.budget_pct,
      }))
    : []

  const totalBudgetNum = hasRealData
    ? strategy.priority_ranking.reduce((s: number, ch: any) => s + (ch.budget_brl || 0), 0)
    : 0
  const totalBudget = totalBudgetNum > 0 ? `R$${totalBudgetNum.toLocaleString('pt-BR')}` : '—'
  const budgetIsReal = hasRealMetrics && realMetrics?.totalSpend > 0

  // Head of Growth text
  const headOfGrowthText = buildHeadOfGrowthText(
    latestAudit,
    strategy?.recommendation || '',
    bench,
    clientData,
  )

  // Fonte da estratégia: auditoria → dados reais → estimativa
  const strategySourceLabel = hasFullAudit
    ? `Estratégia baseada na última Análise Profunda${auditDate ? ` · ${new Date(auditDate).toLocaleDateString('pt-BR')}` : ''}`
    : hasRealMetrics
    ? 'Estratégia baseada em dados reais de Meta Ads'
    : 'Estratégia baseada em estimativas do nicho'

  const PriorityBadge = ({ priority }: { priority: string | number }) => {
    const p = typeof priority === 'number' ? priority : Number(String(priority).match(/^\d+$/) ? priority : 2)
    const map = [
      { label: '🥇 Alta',  color: C.gold },
      { label: '🥈 Média', color: C.text2 },
      { label: '🥉 Baixa', color: C.text3 },
    ]
    const { label, color } = map[(p - 1)] ?? map[1]
    return <span style={{ fontSize: 12, fontWeight: 600, color }}>{label}</span>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Banner de fonte ── */}
      {hasFullAudit ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 12,
          background: C.greenBg, border: '1px solid rgba(34,197,94,0.25)',
          flexWrap: 'wrap',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, flexShrink: 0, boxShadow: `0 0 6px ${C.green}` }} />
          <div style={{ flex: 1 }}>
            <span style={{ color: C.green, fontWeight: 700, fontSize: 12 }}>Estratégia baseada na última Análise Profunda</span>
            {auditDate && (
              <span style={{ color: C.text3, fontSize: 11, marginLeft: 8 }}>
                · auditoria de {new Date(auditDate).toLocaleDateString('pt-BR')}
              </span>
            )}
            {hasRealMetrics && (
              <span style={{ color: C.text3, fontSize: 11, marginLeft: 8 }}>
                · R${realMetrics.totalSpend?.toLocaleString('pt-BR') || '0'} investidos
                {realMetrics.totalLeads > 0 && ` · ${realMetrics.totalLeads} leads`}
                {realMetrics.avgCPL && ` · CPL R$${realMetrics.avgCPL}`}
              </span>
            )}
          </div>
          {auditSource && auditSource !== 'auto' && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8,
              color: auditSource === 'api' ? C.blue : auditSource === 'upload' ? C.green : C.gold,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              {auditSource === 'api' ? '🔗 API' : auditSource === 'upload' ? '📂 Arquivo' : '⚡ Consolidado'}
            </span>
          )}
        </div>
      ) : hasRealMetrics ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 12,
          background: C.goldBg, border: '1px solid rgba(245,158,11,0.25)',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.gold, flexShrink: 0 }} />
          <span style={{ color: C.gold, fontWeight: 600, fontSize: 12 }}>Estratégia baseada em dados reais de Meta Ads</span>
          <span style={{ color: C.text3, fontSize: 11 }}>· Execute a Análise Profunda para enriquecer com auditoria completa</span>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('elyon:navigate', { detail: 'analise' }))}
            style={{
              marginLeft: 'auto', flexShrink: 0,
              padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: C.gold,
            }}>
            Analisar conta →
          </button>
        </div>
      ) : metaConnected ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          padding: '10px 16px', borderRadius: 12,
          background: C.goldBg, border: '1px solid rgba(245,158,11,0.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.gold, flexShrink: 0 }} />
            <span style={{ color: C.gold, fontWeight: 600, fontSize: 12 }}>Estratégia baseada em estimativas do nicho</span>
            <span style={{ color: C.text3, fontSize: 12 }}>· Execute a Análise Profunda para usar dados reais</span>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('elyon:navigate', { detail: 'analise' }))}
            style={{ fontSize: 12, color: C.gold, flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Ir para Análise Profunda →
          </button>
        </div>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          padding: '12px 16px', borderRadius: 12,
          background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
            <div>
              <div style={{ color: '#A78BFA', fontWeight: 600, fontSize: 12, marginBottom: 2 }}>
                Estratégia baseada em estimativas do nicho
              </div>
              <div style={{ color: C.text3, fontSize: 11, lineHeight: 1.5 }}>
                Execute a Análise Profunda primeiro para gerar uma estratégia baseada nos dados reais da conta.
              </div>
            </div>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('elyon:navigate', { detail: 'analise' }))}
            style={{
              padding: '7px 14px', borderRadius: 8, flexShrink: 0,
              background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)',
              color: '#A78BFA', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}>
            Ir para Análise Profunda →
          </button>
        </div>
      )}

      {/* ── Header estratégico — metadados da auditoria ── */}
      {hasFullAudit && (
        <div style={{ ...card, padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          {/* score de saúde */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{
              fontSize: 32, fontWeight: 800, lineHeight: 1,
              color: grade === 'A' ? C.green : grade === 'B' ? C.gold : grade === 'C' ? C.orange : C.red,
            }}>
              {healthScore}
            </span>
            <span style={{ fontSize: 14, color: C.text3 }}>/100</span>
            <span style={{
              fontSize: 20, fontWeight: 700, marginLeft: 4,
              color: grade === 'A' ? C.green : grade === 'B' ? C.gold : grade === 'C' ? C.orange : C.red,
            }}>
              {grade}
            </span>
            <span style={{ fontSize: 10, color: C.text3, marginLeft: 4 }}>saúde</span>
          </div>

          <div style={{ width: '1px', height: 32, background: C.border, flexShrink: 0 }} />

          {/* score growth */}
          <div>
            <div style={{ fontSize: 10, color: C.text3, marginBottom: 2 }}>Score Growth</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: growthCalc.score >= 70 ? C.green : growthCalc.score >= 50 ? C.gold : C.red }}>
              {growthCalc.score}<span style={{ fontSize: 11, color: C.text3 }}>/100</span>
            </div>
          </div>

          {/* confiança */}
          {dataQuality?.confidence && (
            <div>
              <div style={{ fontSize: 10, color: C.text3, marginBottom: 2 }}>Confiança</div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8,
                color:      dataQuality.confidence === 'alta' ? C.green : dataQuality.confidence === 'media' ? C.gold : C.red,
                background: dataQuality.confidence === 'alta' ? 'rgba(34,197,94,0.1)' : dataQuality.confidence === 'media' ? 'rgba(240,180,41,0.1)' : 'rgba(239,68,68,0.1)',
              }}>
                {dataQuality.confidence === 'alta' ? '✓ Alta' : dataQuality.confidence === 'media' ? '~ Média' : '! Baixa'}
              </span>
            </div>
          )}

          {/* plataformas */}
          {latestAudit?._platforms?.length > 0 && (
            <div>
              <div style={{ fontSize: 10, color: C.text3, marginBottom: 2 }}>Plataformas</div>
              <div style={{ fontSize: 11, color: C.text1 }}>{(latestAudit._platforms as string[]).join(' + ')}</div>
            </div>
          )}

          {/* score growth breakdown */}
          {growthCalc.breakdown && (
            <div style={{ marginLeft: 'auto', maxWidth: 300 }}>
              <div style={{ fontSize: 9, color: C.text3, lineHeight: 1.4 }}>
                Score Growth: {growthCalc.breakdown}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <div style={{ ...card, position: 'relative' as const }}>
          <div style={{ fontSize: 10, color: C.text3, marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
            Budget total
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.gold }}>{totalBudget}</div>
          <div style={{ fontSize: 9, color: C.text3, marginTop: 4 }}>
            {budgetIsReal ? '● Real (baseado em investimento)' : '○ Estimado (benchmark)'}
          </div>
        </div>
        <StatCard label="Canais ativos" value={String(channels.length || '—')} color={C.green} />
        <div style={card}>
          <div style={{ fontSize: 10, color: C.text3, marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
            Score Growth
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: growthCalc.score >= 70 ? C.green : growthCalc.score >= 50 ? C.gold : C.red }}>
            {growthCalc.score}/100
          </div>
          <div style={{ fontSize: 9, color: C.text3, marginTop: 4 }}>
            {growthCalc.label} · {hasFullAudit ? 'baseado na auditoria' : 'baseado na estratégia'}
          </div>
        </div>
      </div>

      {/* ── Head of Growth ── */}
      <div style={{
        borderRadius: 14, padding: '16px 20px',
        display: 'flex', alignItems: 'flex-start', gap: 12,
        background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(124,58,237,0.02))',
        border: '1px solid rgba(124,58,237,0.22)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>🧠</div>
        <div>
          <div style={{ fontSize: 10, color: C.purpleL, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 6 }}>
            Head of Growth
          </div>
          <p style={{ fontSize: 13, color: C.text1, lineHeight: 1.65, margin: 0 }}>{headOfGrowthText}</p>
        </div>
      </div>

      {/* ── Alerta de tracking fraco — antes de qualquer recomendação de escala ── */}
      {blockAgressiveScale && (
        <div style={{
          padding: '12px 16px', borderRadius: 12, display: 'flex', alignItems: 'flex-start', gap: 10,
          background: trackingCritico ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
          border: `1px solid ${trackingCritico ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>{trackingCritico ? '🚨' : '⚠'}</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: trackingCritico ? C.red : C.gold, marginBottom: 4 }}>
              {trackingCritico ? 'Escala bloqueada — tracking com problemas críticos' : `Escala cautelosa — ${unverifiedCount} itens de tracking não verificados`}
            </div>
            <p style={{ fontSize: 11, color: C.text2, margin: 0, lineHeight: 1.5 }}>
              {trackingCritico
                ? 'Problemas de tracking detectados. Escalar budget antes de corrigir pode multiplicar erros e distorcer a otimização dos algoritmos. Corrija tracking antes de aumentar investimento.'
                : `${unverifiedCount} itens do checklist de tracking sem confirmação. Valide os eventos de conversão no Events Manager (Meta) ou Google Ads antes de escalar agressivamente.`}
            </p>
          </div>
        </div>
      )}

      {/* ── Estratégia por Campanhas (de _campanhasClassificadas) ── */}
      {campanhasClass && (
        <CampanhaEstrategiaSection
          campanhasClassificadas={campanhasClass}
          bench={bench}
        />
      )}

      {/* ── Diagnóstico de Crescimento ── */}
      {(hasGrowthData && strategy.growth_diagnosis) || gargalos.length > 0 ? (
        <CollapsibleSection title="Diagnóstico de Crescimento" icon="🔍">
          {/* Gargalos da auditoria (prioridade sobre os genéricos) */}
          {gargalos.length > 0 ? (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.red, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>
                🚨 Gargalos identificados na auditoria
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {gargalos.map((g: any, i: number) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10,
                    background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)',
                  }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%', background: C.red,
                      color: '#000', fontSize: 9, fontWeight: 700, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
                    }}>
                      {g.rank || i + 1}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.text1 }}>{g.titulo}</span>
                        {g.impacto && <span style={{ fontSize: 10, fontWeight: 700, color: C.red }}>{g.impacto}</span>}
                      </div>
                      {g.descricao && <p style={{ fontSize: 11, color: C.text2, margin: '4px 0 0', lineHeight: 1.4 }}>{g.descricao}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : strategy.growth_diagnosis?.main_problem ? (
            <div style={{
              marginBottom: 14, padding: '10px 14px', borderRadius: 10,
              display: 'flex', alignItems: 'flex-start', gap: 8,
              background: C.redBg, border: '1px solid rgba(239,68,68,0.2)',
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>🚨</span>
              <p style={{ fontSize: 12, color: C.text1, lineHeight: 1.6, margin: 0 }}>
                {strategy.growth_diagnosis.main_problem}
              </p>
            </div>
          ) : null}

          {/* Oportunidades da auditoria */}
          {oportunidades.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.green, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>
                🚀 Oportunidades de escala
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {oportunidades.map((op: any, i: number) => (
                  <span key={i} style={{
                    fontSize: 11, padding: '4px 10px', borderRadius: 20,
                    background: 'rgba(34,197,94,0.1)', color: C.green, border: '1px solid rgba(34,197,94,0.2)',
                  }}>
                    → {op.titulo || op}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Desperdícios e gargalos genéricos (fallback) */}
          {!gargalos.length && hasGrowthData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {strategy.growth_diagnosis?.waste_analysis?.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.gold, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>
                    💸 Desperdícios
                  </div>
                  <ChipList items={strategy.growth_diagnosis.waste_analysis} color={C.gold} icon="!" limit={4} />
                </div>
              )}
              {strategy.growth_diagnosis?.growth_blockers?.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.red, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>
                    🚧 Gargalos
                  </div>
                  <ChipList items={strategy.growth_diagnosis.growth_blockers} color={C.red} icon="→" limit={4} />
                </div>
              )}
            </div>
          )}

          {/* Saúde do funil */}
          {strategy.growth_diagnosis?.funnel_health && (
            <div style={{ marginTop: gargalos.length > 0 ? 14 : 0 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.text3, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>
                Saúde do Funil
              </div>
              <FunnelHealthRow funnel_health={strategy.growth_diagnosis.funnel_health} />
            </div>
          )}
        </CollapsibleSection>
      ) : null}

      {/* ── Estratégia de Funil ── */}
      {hasGrowthData && strategy.funnel_strategy && (
        <div>
          <div style={{ fontWeight: 700, color: C.text1, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 30, height: 30, borderRadius: 8, background: C.elevated,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
            }}>🎯</span>
            <span style={{ fontSize: 14 }}>Estratégia de Funil</span>
            <span style={{ fontSize: 10, color: C.text3, fontWeight: 400 }}>clique na fase para ver táticas</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <FunnelStageCard label="TOFU — Atração"   icon="📣" color={C.blue}
              goal={strategy.funnel_strategy.tofu?.goal    || ''} tactics={strategy.funnel_strategy.tofu?.tactics    || []} />
            <FunnelStageCard label="MOFU — Nutrição"  icon="💬" color={C.purpleL}
              goal={strategy.funnel_strategy.mofu?.goal    || ''} tactics={strategy.funnel_strategy.mofu?.tactics    || []} />
            <FunnelStageCard label="BOFU — Conversão" icon="💰" color={C.green}
              goal={strategy.funnel_strategy.bofu?.goal    || ''} tactics={strategy.funnel_strategy.bofu?.tactics    || []} />
          </div>
        </div>
      )}

      {/* ── Distribuição por Canal ── */}
      {channels.length > 0 && (
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <h3 style={{ fontWeight: 700, color: C.text1, fontSize: 14, margin: 0 }}>Distribuição por Canal</h3>
              <p style={{ fontSize: 11, color: C.text3, marginTop: 4, marginBottom: 0 }}>
                Budget{budgetIsReal ? ' real' : ' estimado'}, CPL estimado e prioridade
              </p>
            </div>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            padding: '10px 20px',
            fontSize: 10, color: C.text3, textTransform: 'uppercase' as const, letterSpacing: '0.08em',
            borderBottom: `1px solid ${C.border}`,
          }}>
            <span>Canal</span><span>Prioridade</span><span>Budget/mês</span><span>CPL est.</span>
          </div>
          {channels.map((ch: any, i: number) => (
            <div key={ch.name} style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
              padding: '12px 20px', alignItems: 'center',
              borderBottom: i < channels.length - 1 ? `1px solid ${C.border}` : 'none',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = C.elevated)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div>
                <div style={{ fontWeight: 600, color: C.text1, fontSize: 13 }}>{ch.name}</div>
                {hasRealData && ch.rationale && (
                  <div style={{ fontSize: 10, color: C.text3, marginTop: 2, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}
                    title={ch.rationale}>{ch.rationale}</div>
                )}
              </div>
              <PriorityBadge priority={ch.priority} />
              <div>
                <span style={{ color: C.gold, fontWeight: 700, fontSize: 13 }}>{ch.budget}</span>
                {hasRealData && ch.budgetPct && <span style={{ fontSize: 11, color: C.text3, marginLeft: 4 }}>({ch.budgetPct}%)</span>}
              </div>
              <span style={{ color: C.text1, fontSize: 13 }}>{ch.cpl}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Otimização e Escala (gated se tracking fraco) ── */}
      {hasGrowthData && strategy.optimization_scale && (
        <CollapsibleSection title={blockAgressiveScale ? 'Otimização e Escala ⚠ (dados fracos)' : 'Otimização e Escala'} icon="📈">
          {blockAgressiveScale && (
            <div style={{
              padding: '8px 12px', borderRadius: 8, marginBottom: 14, fontSize: 11,
              background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
              color: C.gold, lineHeight: 1.5,
            }}>
              ⚠ Recomendações de escala devem ser aplicadas com cautela — corrija tracking e/ou qualidade de dados primeiro.
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.green, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>🚀 Escalar</div>
              <ChipList items={strategy.optimization_scale.scale_actions || []} color={C.green} icon="↑" />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.red, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>✂️ Cortar</div>
              <ChipList items={strategy.optimization_scale.cut_immediately || []} color={C.red} icon="✕" />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.purpleL, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>🧪 Testes A/B</div>
              <ChipList items={strategy.optimization_scale.ab_tests || []} color={C.purpleL} icon="⚡" />
            </div>
          </div>
          {strategy.optimization_scale.cpl_target && (
            <div style={{
              marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 12, color: C.text2,
              background: C.elevated, borderRadius: 10, padding: '8px 16px',
            }}>
              <span style={{ color: C.gold }}>🎯</span>
              CPL alvo: <strong style={{ color: C.text1 }}>R${strategy.optimization_scale.cpl_target}</strong>
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* ── Posicionamento de Marca ── */}
      {hasGrowthData && strategy.brand_positioning && (
        <CollapsibleSection title="Posicionamento de Marca" icon="🏆" defaultOpen={false}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.gold, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>Autoridade</div>
              <ChipList items={strategy.brand_positioning.authority_strategies || []} color={C.gold} icon="→" />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.blue, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>Comunicação</div>
              <ChipList items={strategy.brand_positioning.communication_adjustments || []} color={C.blue} icon="→" />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.purpleL, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>Percepção de Valor</div>
              <ChipList items={strategy.brand_positioning.value_perception || []} color={C.purpleL} icon="→" />
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* ── Visão 360° ── */}
      {hasGrowthData && strategy.vision_360 && (
        <CollapsibleSection title="Visão 360°" icon="🌐" defaultOpen={false}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.green, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>Site / Conversão</div>
              <ChipList items={strategy.vision_360.website_improvements || []} color={C.green} icon="→" />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.gold, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>Marketing + Vendas</div>
              <ChipList items={strategy.vision_360.sales_alignment || []} color={C.gold} icon="→" />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.blue, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>Fora dos Anúncios</div>
              <ChipList items={strategy.vision_360.off_ads_opportunities || []} color={C.blue} icon="→" />
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* ── Prioridades Estratégicas (de o_que_eu_faria_agora) ── */}
      {oQueEuFariaAgora.length > 0 && (
        <PrioridadesEstrategicas
          acoes={oQueEuFariaAgora}
          clientData={clientData}
          addPendingActions={addPendingActions}
        />
      )}

      {/* ── Plano 90 dias ── */}
      {hasRealData && strategy.plan_90_days?.length > 0 && (
        <div>
          <div style={{ fontWeight: 700, color: C.text1, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 30, height: 30, borderRadius: 8, background: C.elevated,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
            }}>📅</span>
            <span style={{ fontSize: 14 }}>Plano de 90 Dias</span>
            {hasFullAudit && gargalos.length > 0 && (
              <span style={{ fontSize: 10, color: C.text3, fontWeight: 400 }}>
                · Semana 1 prioriza: {gargalos[0]?.titulo || 'gargalo identificado'}
              </span>
            )}
          </div>
          <Plan90Days plan={strategy.plan_90_days} />
        </div>
      )}

      {/* ── Ações prioritárias da estratégia ── */}
      {hasRealData && strategy.key_actions?.length > 0 && (
        <KeyActionsSection actions={strategy.key_actions} />
      )}

    </div>
  )
}
