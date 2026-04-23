// components/dashboard/TabStrategy.tsx
'use client'

import { useState } from 'react'
import { StatCard } from './StatCard'
import { strategyData } from '@/lib/mockData'

interface Props {
  strategy: Record<string, any>
  analysis: Record<string, any>
}

// ── Chips inline compactos ────────────────────────────────────────────────────
function ChipList({ items, color, icon, limit = 4 }: { items: string[]; color: string; icon: string; limit?: number }) {
  const [showAll, setShowAll] = useState(false)
  if (!items?.length) return null
  const visible = showAll ? items : items.slice(0, limit)
  const extra   = items.length - limit

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {visible.map((item, i) => (
        <span key={i}
          className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full leading-tight"
          style={{ background: `${color}10`, color, border: `1px solid ${color}25` }}>
          <span className="flex-shrink-0">{icon}</span>
          {item}
        </span>
      ))}
      {!showAll && extra > 0 && (
        <button onClick={() => setShowAll(true)}
          className="text-[11px] px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(255,255,255,0.04)', color: '#64748B', border: '1px solid rgba(255,255,255,0.07)' }}>
          +{extra} mais
        </button>
      )}
      {showAll && items.length > limit && (
        <button onClick={() => setShowAll(false)}
          className="text-[11px] px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(255,255,255,0.04)', color: '#64748B', border: '1px solid rgba(255,255,255,0.07)' }}>
          ver menos
        </button>
      )}
    </div>
  )
}

// ── Card de fase do funil colapsável ──────────────────────────────────────────
function FunnelStageCard({ label, icon, goal, tactics, color }: {
  label: string; icon: string; goal: string; tactics: string[]; color: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full px-5 py-4 text-left hover:bg-[#16161A] transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{label}</span>
          </div>
          <span className="text-slate-600 text-xs">{open ? '▲' : '▼'}</span>
        </div>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">{goal}</p>
      </button>
      {open && (
        <div className="px-5 pb-4 border-t border-[#1E1E24] pt-3">
          <div className="flex flex-wrap gap-1.5">
            {tactics.map((t, i) => (
              <span key={i}
                className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full"
                style={{ background: `${color}10`, color, border: `1px solid ${color}25` }}>
                → {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Badge de prioridade ───────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: string | number }) {
  const p = typeof priority === 'number' ? priority : Number(String(priority).match(/^\d+$/) ? priority : 2)
  const map = [
    { label: '🥇 Alta',  color: '#F0B429' },
    { label: '🥈 Média', color: '#94A3B8' },
    { label: '🥉 Baixa', color: '#64748B' },
  ]
  const { label, color } = map[(p - 1)] ?? map[1]
  return <span className="text-xs font-semibold" style={{ color }}>{label}</span>
}

// ── Pill de saúde de funil ────────────────────────────────────────────────────
function FunnelHealthRow({ funnel_health }: { funnel_health: Record<string, any> }) {
  const [active, setActive] = useState<string | null>(null)
  const stages = [
    { key: 'tofu', label: 'TOFU',  short: 'Atração'   },
    { key: 'mofu', label: 'MOFU',  short: 'Nutrição'  },
    { key: 'bofu', label: 'BOFU',  short: 'Conversão' },
  ]
  const color  = (s: string) => s === 'ok' ? '#22C55E' : s === 'atenção' ? '#F0B429' : '#FF4D4D'
  const emoji  = (s: string) => s === 'ok' ? '🟢' : s === 'atenção' ? '🟡' : '🔴'

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-3">
        {stages.map(({ key, label, short }) => {
          const s   = funnel_health[key]
          if (!s) return null
          const c   = color(s.status)
          const isActive = active === key
          return (
            <button key={key} onClick={() => setActive(isActive ? null : key)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                background: isActive ? `${c}18` : `${c}0D`,
                color: c,
                border: `1px solid ${isActive ? c : `${c}30`}`,
              }}>
              {emoji(s.status)} {label}: {s.status === 'ok' ? 'Saudável' : s.status === 'atenção' ? 'Atenção' : 'Crítico'}
              <span className="text-[10px] opacity-60 ml-0.5">({short})</span>
            </button>
          )
        })}
      </div>
      {active && (() => {
        const s = funnel_health[active]
        const c = color(s.status)
        return (
          <div className="rounded-xl px-4 py-3 text-xs leading-relaxed animate-fade-up"
            style={{ background: `${c}08`, border: `1px solid ${c}20` }}>
            <span className="font-semibold" style={{ color: c }}>Problema: </span>
            <span className="text-slate-400">{s.issue}</span>
            <span className="mx-2 text-slate-600">·</span>
            <span className="font-semibold" style={{ color: c }}>Ação: </span>
            <span className="text-slate-300">{s.action}</span>
          </div>
        )
      })()}
    </div>
  )
}

// ── Plano 90 dias com tabs ────────────────────────────────────────────────────
function Plan90Days({ plan }: { plan: any[] }) {
  const [activeMonth, setActiveMonth] = useState(0)
  const [openWeek,   setOpenWeek]     = useState<number | null>(0)
  const month = plan[activeMonth]
  if (!month) return null

  const weeks = [month.week_1, month.week_2, month.week_3, month.week_4].filter(Boolean)

  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
      {/* Tab header */}
      <div className="flex border-b border-[#2A2A30]">
        {plan.map((m, i) => (
          <button key={i} onClick={() => { setActiveMonth(i); setOpenWeek(0) }}
            className="flex-1 py-3 text-xs font-bold transition-all"
            style={{
              color:      activeMonth === i ? '#F5A500' : '#475569',
              background: activeMonth === i ? 'rgba(245,165,0,0.06)' : 'transparent',
              borderBottom: activeMonth === i ? '2px solid #F5A500' : '2px solid transparent',
            }}>
            Mês {m.month}
          </button>
        ))}
      </div>
      {/* Goal */}
      <div className="px-5 py-3 border-b border-[#1E1E24]">
        <span className="text-[10px] text-slate-600 uppercase tracking-wider">Objetivo · </span>
        <span className="text-xs text-slate-300 font-semibold">{month.goal}</span>
      </div>
      {/* Semanas colapsáveis */}
      <div className="divide-y divide-[#1E1E24]">
        {weeks.map((week: string[], wi: number) => (
          <div key={wi}>
            <button onClick={() => setOpenWeek(openWeek === wi ? null : wi)}
              className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-[#16161A] transition-colors text-left">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Semana {wi + 1}</span>
              <span className="text-slate-600 text-[10px]">{openWeek === wi ? '▲' : `${week.length} ações ▼`}</span>
            </button>
            {openWeek === wi && (
              <div className="px-5 pb-3 flex flex-wrap gap-1.5 animate-fade-up">
                {week.map((action: string, ai: number) => (
                  <span key={ai}
                    className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(245,165,0,0.08)', color: '#F5A500', border: '1px solid rgba(245,165,0,0.2)' }}>
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

// ── Seção colapsável genérica ─────────────────────────────────────────────────
function CollapsibleSection({ title, defaultOpen = true, children }: {
  title: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#16161A] transition-colors text-left">
        <div className="font-display font-bold text-white">{title}</div>
        <span className="text-slate-600 text-xs ml-4 flex-shrink-0">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export function TabStrategy({ strategy, analysis }: Props) {
  const hasRealData   = strategy && strategy.priority_ranking?.length > 0
  const hasGrowthData = strategy?.growth_diagnosis || strategy?.funnel_strategy

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
    <div className="space-y-5">

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Budget total"  value={totalBudget} color="#F0B429" />
        <StatCard label="Canais ativos" value={String(channels.length)} color="#22C55E" />
        <StatCard label="Score Growth"  value={hasRealData ? `${strategy.intelligence_score}/100` : '—'} color="#A78BFA" />
      </div>

      {/* Insight principal — compacto */}
      {aiInsight && (
        <div className="rounded-2xl px-5 py-4 flex items-start gap-3" style={{
          background: 'linear-gradient(135deg, rgba(240,180,41,0.07), rgba(240,180,41,0.02))',
          border: '1px solid rgba(240,180,41,0.2)',
        }}>
          <span className="text-xl flex-shrink-0">🧠</span>
          <div>
            <div className="text-[10px] text-[#F0B429] font-semibold uppercase tracking-widest mb-1">Head of Growth</div>
            <p className="text-slate-300 text-xs leading-relaxed">{aiInsight}</p>
          </div>
        </div>
      )}

      {/* ── Diagnóstico de Crescimento ──────────────────────────────────── */}
      {hasGrowthData && strategy.growth_diagnosis && (
        <CollapsibleSection title="🔍 Diagnóstico de Crescimento">

          {/* Problema principal */}
          <div className="mb-4 p-3 rounded-xl flex items-start gap-2"
            style={{ background: 'rgba(255,77,77,0.06)', border: '1px solid rgba(255,77,77,0.18)' }}>
            <span className="text-base flex-shrink-0">🚨</span>
            <p className="text-xs text-slate-300 leading-relaxed">{strategy.growth_diagnosis.main_problem}</p>
          </div>

          <div className="space-y-3">
            {/* Desperdícios */}
            {strategy.growth_diagnosis.waste_analysis?.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold text-[#F0B429] uppercase tracking-wider mb-2">💸 Desperdícios</div>
                <ChipList items={strategy.growth_diagnosis.waste_analysis} color="#F0B429" icon="!" limit={4} />
              </div>
            )}

            {/* Gargalos */}
            {strategy.growth_diagnosis.growth_blockers?.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold text-[#FF4D4D] uppercase tracking-wider mb-2">🚧 Gargalos</div>
                <ChipList items={strategy.growth_diagnosis.growth_blockers} color="#FF4D4D" icon="→" limit={4} />
              </div>
            )}

            {/* Saúde do Funil — pills clicáveis */}
            {strategy.growth_diagnosis.funnel_health && (
              <div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Saúde do Funil</div>
                <FunnelHealthRow funnel_health={strategy.growth_diagnosis.funnel_health} />
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* ── Estratégia de Funil (colapsável por fase) ───────────────────── */}
      {hasGrowthData && strategy.funnel_strategy && (
        <div>
          <div className="font-display font-bold text-white mb-3 flex items-center gap-2">
            🎯 Estratégia de Funil
            <span className="text-[10px] text-slate-600 font-normal">clique na fase para ver táticas</span>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <FunnelStageCard label="TOFU — Atração"    icon="📣" color="#38BDF8"
              goal={strategy.funnel_strategy.tofu?.goal    || ''} tactics={strategy.funnel_strategy.tofu?.tactics    || []} />
            <FunnelStageCard label="MOFU — Nutrição"   icon="💬" color="#A78BFA"
              goal={strategy.funnel_strategy.mofu?.goal    || ''} tactics={strategy.funnel_strategy.mofu?.tactics    || []} />
            <FunnelStageCard label="BOFU — Conversão"  icon="💰" color="#22C55E"
              goal={strategy.funnel_strategy.bofu?.goal    || ''} tactics={strategy.funnel_strategy.bofu?.tactics    || []} />
          </div>
        </div>
      )}

      {/* ── Distribuição por Canal ─────────────────────────────────────── */}
      <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2A2A30] flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-white">Distribuição por Canal</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Budget, CPL estimado e prioridade</p>
          </div>
        </div>
        <div className="grid grid-cols-4 px-5 py-2.5 text-[10px] text-slate-600 uppercase tracking-wider border-b border-[#1E1E24]">
          <span>Canal</span><span>Prioridade</span><span>Budget/mês</span><span>CPL est.</span>
        </div>
        {channels.map((ch: any, i: number) => (
          <div key={ch.name}
            className="grid grid-cols-4 px-5 py-3 items-center border-b border-[#1E1E24] last:border-0 hover:bg-[#16161A] transition-colors animate-fade-up"
            style={{ animationDelay: `${i * 0.08}s` }}>
            <div>
              <div className="font-semibold text-white text-sm">{ch.name}</div>
              {hasRealData && ch.rationale && (
                <div className="text-[10px] text-slate-600 mt-0.5 max-w-[160px] truncate" title={ch.rationale}>{ch.rationale}</div>
              )}
            </div>
            <PriorityBadge priority={ch.priority} />
            <div>
              <span className="text-[#F0B429] font-bold text-sm">{ch.budget}</span>
              {hasRealData && ch.budgetPct && <span className="text-[11px] text-slate-600 ml-1">({ch.budgetPct}%)</span>}
            </div>
            <span className="text-slate-300 text-sm">{ch.cpl}</span>
          </div>
        ))}
      </div>

      {/* ── Otimização e Escala ────────────────────────────────────────── */}
      {hasGrowthData && strategy.optimization_scale && (
        <CollapsibleSection title="📈 Otimização e Escala">
          <div className="grid md:grid-cols-3 gap-5">
            <div>
              <div className="text-[10px] font-semibold text-[#22C55E] uppercase tracking-wider mb-2">🚀 Escalar</div>
              <ChipList items={strategy.optimization_scale.scale_actions || []} color="#22C55E" icon="↑" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-[#FF4D4D] uppercase tracking-wider mb-2">✂️ Cortar</div>
              <ChipList items={strategy.optimization_scale.cut_immediately || []} color="#FF4D4D" icon="✕" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-[#A78BFA] uppercase tracking-wider mb-2">🧪 Testes A/B</div>
              <ChipList items={strategy.optimization_scale.ab_tests || []} color="#A78BFA" icon="⚡" />
            </div>
          </div>
          {strategy.optimization_scale.cpl_target && (
            <div className="mt-4 inline-flex items-center gap-2 text-xs text-slate-400 bg-[#16161A] rounded-lg px-4 py-2">
              <span className="text-[#F0B429]">🎯</span>
              CPL alvo: <strong className="text-white">R${strategy.optimization_scale.cpl_target}</strong>
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* ── Posicionamento de Marca ────────────────────────────────────── */}
      {hasGrowthData && strategy.brand_positioning && (
        <CollapsibleSection title="🏆 Posicionamento de Marca" defaultOpen={false}>
          <div className="grid md:grid-cols-3 gap-5">
            <div>
              <div className="text-[10px] font-semibold text-[#F0B429] uppercase tracking-wider mb-2">Autoridade</div>
              <ChipList items={strategy.brand_positioning.authority_strategies || []} color="#F0B429" icon="→" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-[#38BDF8] uppercase tracking-wider mb-2">Comunicação</div>
              <ChipList items={strategy.brand_positioning.communication_adjustments || []} color="#38BDF8" icon="→" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-[#A78BFA] uppercase tracking-wider mb-2">Percepção de Valor</div>
              <ChipList items={strategy.brand_positioning.value_perception || []} color="#A78BFA" icon="→" />
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* ── Visão 360° ────────────────────────────────────────────────── */}
      {hasGrowthData && strategy.vision_360 && (
        <CollapsibleSection title="🌐 Visão 360°" defaultOpen={false}>
          <div className="grid md:grid-cols-3 gap-5">
            <div>
              <div className="text-[10px] font-semibold text-[#22C55E] uppercase tracking-wider mb-2">Site / Conversão</div>
              <ChipList items={strategy.vision_360.website_improvements || []} color="#22C55E" icon="→" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-[#F0B429] uppercase tracking-wider mb-2">Marketing + Vendas</div>
              <ChipList items={strategy.vision_360.sales_alignment || []} color="#F0B429" icon="→" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-[#38BDF8] uppercase tracking-wider mb-2">Fora dos Anúncios</div>
              <ChipList items={strategy.vision_360.off_ads_opportunities || []} color="#38BDF8" icon="→" />
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* ── Plano 90 dias com tabs ─────────────────────────────────────── */}
      {hasRealData && strategy.plan_90_days?.length > 0 && (
        <div>
          <div className="font-display font-bold text-white mb-3">📅 Plano de 90 Dias</div>
          <Plan90Days plan={strategy.plan_90_days} />
        </div>
      )}

      {/* ── Ações prioritárias ────────────────────────────────────────── */}
      {hasRealData && strategy.key_actions?.length > 0 && (
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
          <div className="font-display font-bold text-white mb-3">⚡ Ações Prioritárias</div>
          <div className="flex flex-col gap-2">
            {strategy.key_actions.map((action: string, i: number) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-[#16161A] rounded-xl">
                <span className="w-5 h-5 rounded-full bg-[#F0B429] text-black text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-xs text-slate-300">{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
