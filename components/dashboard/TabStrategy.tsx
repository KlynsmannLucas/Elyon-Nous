// components/dashboard/TabStrategy.tsx
'use client'

import { useState } from 'react'
import { StatCard } from './StatCard'
import { strategyData } from '@/lib/mockData'
import { useAppStore } from '@/lib/store'

const C = {
  bg:       '#080D1A',
  surface:  '#0F1629',
  elevated: '#131E35',
  border:   'rgba(99,120,255,0.1)',
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
  text2:    'rgba(255,255,255,0.5)',
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
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color }}>
              {label}
            </span>
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
              }}>
                → {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PriorityBadge({ priority }: { priority: string | number }) {
  const p = typeof priority === 'number' ? priority : Number(String(priority).match(/^\d+$/) ? priority : 2)
  const map = [
    { label: '🥇 Alta',  color: C.gold },
    { label: '🥈 Média', color: C.text2 },
    { label: '🥉 Baixa', color: C.text3 },
  ]
  const { label, color } = map[(p - 1)] ?? map[1]
  return <span style={{ fontSize: 12, fontWeight: 600, color }}>{label}</span>
}

function FunnelHealthRow({ funnel_health }: { funnel_health: Record<string, any> }) {
  const [active, setActive] = useState<string | null>(null)
  const stages = [
    { key: 'tofu', label: 'TOFU',  short: 'Atração'   },
    { key: 'mofu', label: 'MOFU',  short: 'Nutrição'  },
    { key: 'bofu', label: 'BOFU',  short: 'Conversão' },
  ]
  const color  = (s: string) => s === 'ok' ? C.green : s === 'atenção' ? C.gold : C.red
  const emoji  = (s: string) => s === 'ok' ? '🟢' : s === 'atenção' ? '🟡' : '🔴'

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
              color:      activeMonth === i ? C.gold : C.text3,
              background: activeMonth === i ? `${C.gold}08` : 'transparent',
              borderBottom: activeMonth === i ? `2px solid ${C.gold}` : '2px solid transparent',
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
                    background: `${C.gold}10`, color: C.gold, border: `1px solid ${C.gold}28`,
                  }}>
                    · {action}
                  </span>
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
          width: 28, height: 28, borderRadius: 8, background: `${C.gold}18`,
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

export function TabStrategy({ strategy, analysis }: Props) {
  const { clientData, auditCache, connectedAccounts } = useAppStore()
  const hasRealData   = strategy && strategy.priority_ranking?.length > 0
  const hasGrowthData = strategy?.growth_diagnosis || strategy?.funnel_strategy

  const cacheKey        = clientData?.clientName || ''
  const latestAudit     = auditCache[cacheKey]?.[0]?.audit
  const realMetrics     = latestAudit?._realMetrics
  const hasRealMetrics  = Boolean(realMetrics?.totalSpend > 0 || realMetrics?.totalLeads > 0)
  const metaConnected   = connectedAccounts.some(a => a.platform === 'meta')

  const channels = hasRealData
    ? strategy.priority_ranking.map((ch: any) => ({
        name: ch.channel, priority: ch.priority,
        budget: `R$${(ch.budget_brl || 0).toLocaleString('pt-BR')}`,
        cpl: `R$${ch.cpl_min}–${ch.cpl_max}`,
        status: 'Ativo', rationale: ch.rationale, budgetPct: ch.budget_pct,
      }))
    : strategyData.channels.map((ch) => ({ ...ch, priority: ch.priority === '🥇 Alta' ? 1 : ch.priority === '🥈 Média' ? 2 : 3 }))

  const totalBudget = hasRealData
    ? `R$${strategy.priority_ranking.reduce((s: number, ch: any) => s + (ch.budget_brl || 0), 0).toLocaleString('pt-BR')}`
    : strategyData.totalBudget

  const aiInsight = hasRealData ? strategy.recommendation : strategyData.aiInsight

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Banner de qualidade dos dados */}
      {hasRealMetrics ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 12,
          background: C.greenBg, border: `1px solid rgba(34,197,94,0.25)`,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, flexShrink: 0, boxShadow: `0 0 6px ${C.green}` }} />
          <div style={{ flex: 1 }}>
            <span style={{ color: C.green, fontWeight: 600, fontSize: 12 }}>Estratégia baseada em dados reais do Meta Ads</span>
            <span style={{ color: C.text3, fontSize: 12, marginLeft: 8 }}>
              · Gasto: R${realMetrics.totalSpend?.toLocaleString('pt-BR') || '0'}
              {realMetrics.totalLeads > 0 && ` · ${realMetrics.totalLeads} leads`}
              {realMetrics.avgCPL && ` · CPL real: R$${realMetrics.avgCPL}`}
            </span>
          </div>
        </div>
      ) : metaConnected ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          padding: '10px 16px', borderRadius: 12,
          background: C.goldBg, border: `1px solid rgba(245,158,11,0.25)`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.gold, flexShrink: 0 }} />
            <span style={{ color: C.gold, fontWeight: 600, fontSize: 12 }}>Estratégia baseada em estimativas do nicho</span>
            <span style={{ color: C.text3, fontSize: 12 }}>· Execute a análise Meta Ads para usar dados reais</span>
          </div>
          <a href="#anuncios" style={{ fontSize: 12, color: C.gold, flexShrink: 0 }}>
            Analisar conta →
          </a>
        </div>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 12,
          background: 'rgba(100,116,139,0.06)', border: '1px solid rgba(100,116,139,0.15)',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.text3, flexShrink: 0 }} />
          <span style={{ color: C.text3, fontSize: 12 }}>
            Estratégia baseada em estimativas do nicho · Conecte o Meta Ads para calibrar com dados reais
          </span>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <StatCard label="Budget total"  value={totalBudget} color={C.gold} />
        <StatCard label="Canais ativos" value={String(channels.length)} color={C.green} />
        <StatCard label="Score Growth"  value={hasRealData ? `${strategy.intelligence_score}/100` : '—'} color={C.purpleL} />
      </div>

      {/* Insight principal */}
      {aiInsight && (
        <div style={{
          borderRadius: 14, padding: '16px 20px',
          display: 'flex', alignItems: 'flex-start', gap: 12,
          background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))',
          border: `1px solid rgba(245,158,11,0.22)`,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: `${C.gold}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>🧠</div>
          <div>
            <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
              Head of Growth
            </div>
            <p style={{ fontSize: 13, color: C.text1, lineHeight: 1.65, margin: 0 }}>{aiInsight}</p>
          </div>
        </div>
      )}

      {/* Diagnóstico de Crescimento */}
      {hasGrowthData && strategy.growth_diagnosis && (
        <CollapsibleSection title="Diagnóstico de Crescimento" icon="🔍">
          <div style={{
            marginBottom: 14, padding: '10px 14px', borderRadius: 10,
            display: 'flex', alignItems: 'flex-start', gap: 8,
            background: C.redBg, border: `1px solid rgba(239,68,68,0.2)`,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>🚨</span>
            <p style={{ fontSize: 12, color: C.text1, lineHeight: 1.6, margin: 0 }}>
              {strategy.growth_diagnosis.main_problem}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {strategy.growth_diagnosis.waste_analysis?.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  💸 Desperdícios
                </div>
                <ChipList items={strategy.growth_diagnosis.waste_analysis} color={C.gold} icon="!" limit={4} />
              </div>
            )}
            {strategy.growth_diagnosis.growth_blockers?.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.red, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  🚧 Gargalos
                </div>
                <ChipList items={strategy.growth_diagnosis.growth_blockers} color={C.red} icon="→" limit={4} />
              </div>
            )}
            {strategy.growth_diagnosis.funnel_health && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  Saúde do Funil
                </div>
                <FunnelHealthRow funnel_health={strategy.growth_diagnosis.funnel_health} />
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Estratégia de Funil */}
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

      {/* Distribuição por Canal */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ fontWeight: 700, color: C.text1, fontSize: 14, margin: 0 }}>Distribuição por Canal</h3>
            <p style={{ fontSize: 11, color: C.text3, marginTop: 4, marginBottom: 0 }}>Budget, CPL estimado e prioridade</p>
          </div>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          padding: '10px 20px',
          fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em',
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
                <div style={{ fontSize: 10, color: C.text3, marginTop: 2, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
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

      {/* Otimização e Escala */}
      {hasGrowthData && strategy.optimization_scale && (
        <CollapsibleSection title="Otimização e Escala" icon="📈">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>🚀 Escalar</div>
              <ChipList items={strategy.optimization_scale.scale_actions || []} color={C.green} icon="↑" />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.red, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>✂️ Cortar</div>
              <ChipList items={strategy.optimization_scale.cut_immediately || []} color={C.red} icon="✕" />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.purpleL, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>🧪 Testes A/B</div>
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

      {/* Posicionamento de Marca */}
      {hasGrowthData && strategy.brand_positioning && (
        <CollapsibleSection title="Posicionamento de Marca" icon="🏆" defaultOpen={false}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Autoridade</div>
              <ChipList items={strategy.brand_positioning.authority_strategies || []} color={C.gold} icon="→" />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Comunicação</div>
              <ChipList items={strategy.brand_positioning.communication_adjustments || []} color={C.blue} icon="→" />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.purpleL, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Percepção de Valor</div>
              <ChipList items={strategy.brand_positioning.value_perception || []} color={C.purpleL} icon="→" />
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Visão 360° */}
      {hasGrowthData && strategy.vision_360 && (
        <CollapsibleSection title="Visão 360°" icon="🌐" defaultOpen={false}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Site / Conversão</div>
              <ChipList items={strategy.vision_360.website_improvements || []} color={C.green} icon="→" />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Marketing + Vendas</div>
              <ChipList items={strategy.vision_360.sales_alignment || []} color={C.gold} icon="→" />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Fora dos Anúncios</div>
              <ChipList items={strategy.vision_360.off_ads_opportunities || []} color={C.blue} icon="→" />
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Plano 90 dias */}
      {hasRealData && strategy.plan_90_days?.length > 0 && (
        <div>
          <div style={{ fontWeight: 700, color: C.text1, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 30, height: 30, borderRadius: 8, background: C.elevated,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
            }}>📅</span>
            <span style={{ fontSize: 14 }}>Plano de 90 Dias</span>
          </div>
          <Plan90Days plan={strategy.plan_90_days} />
        </div>
      )}

      {/* Ações prioritárias */}
      {hasRealData && strategy.key_actions?.length > 0 && (
        <KeyActionsSection actions={strategy.key_actions} />
      )}

    </div>
  )
}
