// components/dashboard/TabStrategy.tsx — Head de Growth: funil, otimização, posicionamento e visão 360°
'use client'

import { StatCard } from './StatCard'
import { strategyData } from '@/lib/mockData'

interface Props {
  strategy: Record<string, any>
  analysis: Record<string, any>
}

function PriorityBadge({ priority }: { priority: string | number }) {
  let label: string
  if (typeof priority === 'number') {
    label = priority === 1 ? '🥇 Alta' : priority === 2 ? '🥈 Média' : '🥉 Baixa'
  } else if (String(priority).match(/^\d+$/)) {
    const p = Number(priority)
    label = p === 1 ? '🥇 Alta' : p === 2 ? '🥈 Média' : '🥉 Baixa'
  } else {
    label = String(priority)
  }
  const colorMap: Record<string, string> = {
    '🥇 Alta': '#F0B429', '🥈 Média': '#94A3B8', '🥉 Baixa': '#64748B',
  }
  return (
    <span className="text-xs font-semibold" style={{ color: colorMap[label] || '#94A3B8' }}>
      {label}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'Ativo'
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{
        color: isActive ? '#22C55E' : '#FF4D4D',
        background: isActive ? 'rgba(34,197,94,0.1)' : 'rgba(255,77,77,0.1)',
      }}
    >
      {status}
    </span>
  )
}

function FunnelStageCard({
  label, icon, goal, tactics, color,
}: {
  label: string; icon: string; goal: string; tactics: string[]; color: string
}) {
  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{label}</span>
      </div>
      <p className="text-xs text-slate-400 mb-4 leading-relaxed">{goal}</p>
      <div className="space-y-2">
        {tactics.map((t, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
            <span className="mt-0.5 flex-shrink-0" style={{ color }}>→</span>
            <span>{t}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TabStrategy({ strategy, analysis }: Props) {
  const hasRealData = strategy && strategy.priority_ranking?.length > 0
  const hasGrowthData = strategy?.growth_diagnosis || strategy?.funnel_strategy

  const channels = hasRealData
    ? strategy.priority_ranking.map((ch: any) => ({
        name: ch.channel,
        priority: ch.priority,
        budget: `R$${(ch.budget_brl || 0).toLocaleString('pt-BR')}`,
        cpl: `R$${ch.cpl_min}–${ch.cpl_max}`,
        status: 'Ativo',
        rationale: ch.rationale,
        budgetPct: ch.budget_pct,
      }))
    : strategyData.channels.map((ch) => ({ ...ch, priority: ch.priority === '🥇 Alta' ? 1 : ch.priority === '🥈 Média' ? 2 : 3 }))

  const totalBudget = hasRealData
    ? `R$${strategy.priority_ranking.reduce((s: number, ch: any) => s + (ch.budget_brl || 0), 0).toLocaleString('pt-BR')}`
    : strategyData.totalBudget

  const aiInsight = hasRealData ? strategy.recommendation : strategyData.aiInsight

  // Funnel health helper
  const statusColor = (s: string) =>
    s === 'ok' ? '#22C55E' : s === 'atenção' ? '#F0B429' : '#FF4D4D'
  const statusLabel = (s: string) =>
    s === 'ok' ? '✅ Saudável' : s === 'atenção' ? '⚡ Atenção' : '🔴 Crítico'

  return (
    <div className="space-y-6">

      {/* KPIs de estratégia */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Budget total" value={totalBudget} color="#F0B429" />
        <StatCard label="Canais ativos" value={String(channels.length)} color="#22C55E" />
        <StatCard
          label="Score Growth"
          value={hasRealData ? `${strategy.intelligence_score}/100` : '—'}
          color="#A78BFA"
        />
      </div>

      {/* ── Diagnóstico de Crescimento ───────────────────────────────────── */}
      {hasGrowthData && strategy.growth_diagnosis && (
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5 space-y-4">
          <div className="font-display font-bold text-white">🔍 Diagnóstico de Crescimento</div>

          {/* Problema principal */}
          <div className="p-4 rounded-xl" style={{ background: 'rgba(255,77,77,0.05)', border: '1px solid rgba(255,77,77,0.2)' }}>
            <div className="text-xs font-semibold text-[#FF4D4D] uppercase tracking-wider mb-1">Principal Problema</div>
            <p className="text-sm text-slate-300 leading-relaxed">{strategy.growth_diagnosis.main_problem}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Desperdícios */}
            {strategy.growth_diagnosis.waste_analysis?.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-[#F0B429] uppercase tracking-wider mb-2">💸 Onde está o desperdício</div>
                <div className="space-y-1.5">
                  {strategy.growth_diagnosis.waste_analysis.map((w: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-400 bg-[#16161A] rounded-lg px-3 py-2">
                      <span className="text-[#F0B429] flex-shrink-0 mt-0.5">!</span>
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gargalos */}
            {strategy.growth_diagnosis.growth_blockers?.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-[#FF4D4D] uppercase tracking-wider mb-2">🚧 Gargalos de Crescimento</div>
                <div className="space-y-1.5">
                  {strategy.growth_diagnosis.growth_blockers.map((b: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-400 bg-[#16161A] rounded-lg px-3 py-2">
                      <span className="text-[#FF4D4D] flex-shrink-0 mt-0.5">→</span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Saúde do Funil */}
          {strategy.growth_diagnosis.funnel_health && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Saúde do Funil</div>
              <div className="grid grid-cols-3 gap-3">
                {(['tofu', 'mofu', 'bofu'] as const).map((stage) => {
                  const s = strategy.growth_diagnosis.funnel_health[stage]
                  if (!s) return null
                  const stageLabel = stage === 'tofu' ? 'Topo (Atração)' : stage === 'mofu' ? 'Meio (Nutrição)' : 'Fundo (Conversão)'
                  const color = statusColor(s.status)
                  return (
                    <div key={stage} className="bg-[#16161A] rounded-xl p-3 text-center" style={{ border: `1px solid ${color}33` }}>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{stageLabel}</div>
                      <div className="text-xs font-bold mb-2" style={{ color }}>{statusLabel(s.status)}</div>
                      <p className="text-[10px] text-slate-500 leading-tight mb-2">{s.issue}</p>
                      <p className="text-[10px] leading-tight" style={{ color }}>{s.action}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Estratégia de Funil TOFU / MOFU / BOFU ─────────────────────── */}
      {hasGrowthData && strategy.funnel_strategy && (
        <div>
          <div className="font-display font-bold text-white mb-3">🎯 Estratégia de Funil</div>
          <div className="grid md:grid-cols-3 gap-4">
            <FunnelStageCard
              label="TOFU — Atração"
              icon="📣"
              color="#38BDF8"
              goal={strategy.funnel_strategy.tofu?.goal || ''}
              tactics={strategy.funnel_strategy.tofu?.tactics || []}
            />
            <FunnelStageCard
              label="MOFU — Nutrição"
              icon="💬"
              color="#A78BFA"
              goal={strategy.funnel_strategy.mofu?.goal || ''}
              tactics={strategy.funnel_strategy.mofu?.tactics || []}
            />
            <FunnelStageCard
              label="BOFU — Conversão"
              icon="💰"
              color="#22C55E"
              goal={strategy.funnel_strategy.bofu?.goal || ''}
              tactics={strategy.funnel_strategy.bofu?.tactics || []}
            />
          </div>
        </div>
      )}

      {/* ── Distribuição por Canal ──────────────────────────────────────── */}
      <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2A2A30]">
          <h3 className="font-display font-bold text-white">Distribuição por Canal</h3>
          <p className="text-xs text-slate-500 mt-0.5">Budget, CPL estimado e prioridade</p>
        </div>

        <div className="grid grid-cols-4 px-6 py-3 text-xs text-slate-500 uppercase tracking-wider border-b border-[#1E1E24]">
          <span>Canal</span>
          <span>Prioridade</span>
          <span>Budget/mês</span>
          <span>CPL est.</span>
        </div>

        {channels.map((ch: any, i: number) => (
          <div
            key={ch.name}
            className="grid grid-cols-4 px-6 py-4 items-center border-b border-[#1E1E24] last:border-0 hover:bg-[#16161A] transition-colors animate-fade-up"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div>
              <div className="font-semibold text-white text-sm">{ch.name}</div>
              {hasRealData && ch.rationale && (
                <div className="text-xs text-slate-600 mt-0.5 max-w-[160px] truncate">{ch.rationale}</div>
              )}
            </div>
            <PriorityBadge priority={ch.priority} />
            <div>
              <span className="text-[#F0B429] font-bold text-sm">{ch.budget}</span>
              {hasRealData && ch.budgetPct && (
                <span className="text-xs text-slate-600 ml-1">({ch.budgetPct}%)</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-300 text-sm">{ch.cpl}</span>
              <StatusBadge status={ch.status} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Insight principal ──────────────────────────────────────────── */}
      {aiInsight && (
        <div className="rounded-2xl p-6 animate-fade-up" style={{
          background: 'linear-gradient(135deg, rgba(240,180,41,0.08) 0%, rgba(240,180,41,0.03) 100%)',
          border: '1px solid rgba(240,180,41,0.25)',
        }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🧠</span>
            <div>
              <div className="text-xs text-[#F0B429] font-semibold uppercase tracking-widest mb-2">Análise do Head of Growth</div>
              <p className="text-slate-200 text-sm leading-relaxed">{aiInsight}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Otimização e Escala ─────────────────────────────────────────── */}
      {hasGrowthData && strategy.optimization_scale && (
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
          <div className="font-display font-bold text-white mb-4">📈 Otimização e Escala</div>
          <div className="grid md:grid-cols-3 gap-4">
            {/* O que escalar */}
            <div>
              <div className="text-xs font-semibold text-[#22C55E] uppercase tracking-wider mb-2">🚀 Escalar</div>
              <div className="space-y-1.5">
                {(strategy.optimization_scale.scale_actions || []).map((a: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-400 bg-[#16161A] rounded-lg px-3 py-2">
                    <span className="text-[#22C55E] flex-shrink-0">↑</span>
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* O que cortar */}
            <div>
              <div className="text-xs font-semibold text-[#FF4D4D] uppercase tracking-wider mb-2">✂️ Cortar já</div>
              <div className="space-y-1.5">
                {(strategy.optimization_scale.cut_immediately || []).map((a: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-400 bg-[#16161A] rounded-lg px-3 py-2">
                    <span className="text-[#FF4D4D] flex-shrink-0">✕</span>
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Testes A/B */}
            <div>
              <div className="text-xs font-semibold text-[#A78BFA] uppercase tracking-wider mb-2">🧪 Testes A/B</div>
              <div className="space-y-1.5">
                {(strategy.optimization_scale.ab_tests || []).map((a: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-400 bg-[#16161A] rounded-lg px-3 py-2">
                    <span className="text-[#A78BFA] flex-shrink-0">⚡</span>
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {strategy.optimization_scale.cpl_target && (
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 bg-[#16161A] rounded-lg px-4 py-2">
              <span className="text-[#F0B429]">🎯</span>
              <span>CPL alvo: <strong className="text-white">R${strategy.optimization_scale.cpl_target}</strong> — meta de otimização das campanhas</span>
            </div>
          )}
        </div>
      )}

      {/* ── Posicionamento de Marca ────────────────────────────────────── */}
      {hasGrowthData && strategy.brand_positioning && (
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
          <div className="font-display font-bold text-white mb-4">🏆 Posicionamento de Marca</div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs font-semibold text-[#F0B429] uppercase tracking-wider mb-2">Autoridade</div>
              <div className="space-y-1.5">
                {(strategy.brand_positioning.authority_strategies || []).map((s: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-400 bg-[#16161A] rounded-lg px-3 py-2">
                    <span className="text-[#F0B429] flex-shrink-0">→</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-[#38BDF8] uppercase tracking-wider mb-2">Comunicação</div>
              <div className="space-y-1.5">
                {(strategy.brand_positioning.communication_adjustments || []).map((s: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-400 bg-[#16161A] rounded-lg px-3 py-2">
                    <span className="text-[#38BDF8] flex-shrink-0">→</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-[#A78BFA] uppercase tracking-wider mb-2">Percepção de Valor</div>
              <div className="space-y-1.5">
                {(strategy.brand_positioning.value_perception || []).map((s: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-400 bg-[#16161A] rounded-lg px-3 py-2">
                    <span className="text-[#A78BFA] flex-shrink-0">→</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Visão 360° ─────────────────────────────────────────────────── */}
      {hasGrowthData && strategy.vision_360 && (
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
          <div className="font-display font-bold text-white mb-4">🌐 Visão 360°</div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs font-semibold text-[#22C55E] uppercase tracking-wider mb-2">Site / Conversão</div>
              <div className="space-y-1.5">
                {(strategy.vision_360.website_improvements || []).map((s: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-400 bg-[#16161A] rounded-lg px-3 py-2">
                    <span className="text-[#22C55E] flex-shrink-0">→</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-[#F0B429] uppercase tracking-wider mb-2">Marketing + Vendas</div>
              <div className="space-y-1.5">
                {(strategy.vision_360.sales_alignment || []).map((s: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-400 bg-[#16161A] rounded-lg px-3 py-2">
                    <span className="text-[#F0B429] flex-shrink-0">→</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-[#38BDF8] uppercase tracking-wider mb-2">Fora dos Anúncios</div>
              <div className="space-y-1.5">
                {(strategy.vision_360.off_ads_opportunities || []).map((s: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-400 bg-[#16161A] rounded-lg px-3 py-2">
                    <span className="text-[#38BDF8] flex-shrink-0">→</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Plano de 90 dias ────────────────────────────────────────────── */}
      {hasRealData && strategy.plan_90_days?.length > 0 && (
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-6">
          <h3 className="font-display font-bold text-white mb-5">📅 Plano de 90 Dias</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {strategy.plan_90_days.map((month: any) => (
              <div key={month.month} className="bg-[#16161A] border border-[#2A2A30] rounded-xl p-4">
                <div className="text-xs text-[#F0B429] font-semibold uppercase tracking-widest mb-2">
                  Mês {month.month}
                </div>
                <div className="text-sm font-semibold text-white mb-3">{month.goal}</div>
                {[month.week_1, month.week_2, month.week_3, month.week_4].map((week, wi) => (
                  week?.length > 0 && (
                    <div key={wi} className="mb-2">
                      <div className="text-[10px] text-slate-600 uppercase mb-1">Semana {wi + 1}</div>
                      {week.slice(0, 2).map((action: string, ai: number) => (
                        <div key={ai} className="flex items-start gap-1.5 text-xs text-slate-400 mb-1">
                          <span className="text-[#F0B429] mt-0.5 flex-shrink-0">·</span>
                          {action}
                        </div>
                      ))}
                    </div>
                  )
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Ações prioritárias ──────────────────────────────────────────── */}
      {hasRealData && strategy.key_actions?.length > 0 && (
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
          <div className="font-display font-bold text-white mb-3">⚡ Ações Prioritárias</div>
          <div className="space-y-2">
            {strategy.key_actions.map((action: string, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-[#16161A] rounded-xl">
                <span className="w-5 h-5 rounded-full bg-[#F0B429] text-black text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm text-slate-300">{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
