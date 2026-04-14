// components/dashboard/TabGrowth.tsx — Cenários de budget, projeção e calendário de marketing
'use client'

import { GrowthChart } from './GrowthChart'
import { getBenchmark, computeNicheProjection } from '@/lib/niche_benchmarks'
import { getNicheContent } from '@/lib/niche_content'
import { growthData } from '@/lib/mockData'
import type { ClientData } from '@/lib/store'

interface Props {
  analysis: Record<string, any>
  clientData?: ClientData | null
}

const ACTION_ICONS: Record<string, string> = {
  invest:   '💰',
  retain:   '🔄',
  creative: '🎨',
  pause:    '⏸',
  scale:    '🚀',
  test:     '🧪',
}

const ACTION_LABELS: Record<string, string> = {
  invest:   'Investir',
  retain:   'Reter',
  creative: 'Criativos',
  pause:    'Pausar',
  scale:    'Escalar',
  test:     'Testar',
}

export function TabGrowth({ analysis, clientData }: Props) {
  const niche  = clientData?.niche || ''
  const budget = clientData?.budget || 0
  const bench  = getBenchmark(niche)
  const proj   = bench && budget > 0 ? computeNicheProjection(bench, budget) : null
  const content = getNicheContent(niche)
  const hasAIData = analysis && analysis.priority_ranking?.length > 0

  // Cenários baseados em dados reais do nicho
  const scenarios = (() => {
    if (proj && bench) {
      const conserv = {
        name: 'Conservador',
        budget: `R$${bench.budget_floor.toLocaleString('pt-BR')}/mês`,
        budgetNum: bench.budget_floor,
        leads: String(Math.round(bench.budget_floor / ((bench.cpl_min + bench.cpl_max) / 2))),
        revenue: `R$${Math.round(Math.round(bench.budget_floor / ((bench.cpl_min + bench.cpl_max) / 2)) * bench.cvr_lead_to_sale * bench.avg_ticket / 1000)}k`,
        roas: +((Math.round(bench.budget_floor / ((bench.cpl_min + bench.cpl_max) / 2)) * bench.cvr_lead_to_sale * bench.avg_ticket) / bench.budget_floor).toFixed(1),
        recommended: false,
        color: '#94A3B8',
        description: 'Budget mínimo para o nicho',
      }
      const base = {
        name: 'Recomendado',
        budget: `R$${bench.budget_ideal.toLocaleString('pt-BR')}/mês`,
        budgetNum: bench.budget_ideal,
        leads: String(Math.round(bench.budget_ideal / ((bench.cpl_min + bench.cpl_max) / 2))),
        revenue: `R$${Math.round(Math.round(bench.budget_ideal / ((bench.cpl_min + bench.cpl_max) / 2)) * bench.cvr_lead_to_sale * bench.avg_ticket / 1000)}k`,
        roas: +((Math.round(bench.budget_ideal / ((bench.cpl_min + bench.cpl_max) / 2)) * bench.cvr_lead_to_sale * bench.avg_ticket) / bench.budget_ideal).toFixed(1),
        recommended: true,
        color: '#F0B429',
        description: 'Resultado consistente e previsível',
      }
      const agressivo = {
        name: 'Agressivo',
        budget: `R$${(bench.budget_ideal * 2.2).toLocaleString('pt-BR')}/mês`,
        budgetNum: Math.round(bench.budget_ideal * 2.2),
        leads: String(Math.round(bench.budget_ideal * 2.2 / ((bench.cpl_min + bench.cpl_max) / 2))),
        revenue: `R$${Math.round(Math.round(bench.budget_ideal * 2.2 / ((bench.cpl_min + bench.cpl_max) / 2)) * bench.cvr_lead_to_sale * bench.avg_ticket / 1000)}k`,
        roas: +((Math.round(bench.budget_ideal * 2.2 / ((bench.cpl_min + bench.cpl_max) / 2)) * bench.cvr_lead_to_sale * bench.avg_ticket) / (bench.budget_ideal * 2.2)).toFixed(1),
        recommended: false,
        color: '#22C55E',
        description: 'Escala máxima e dominância',
      }
      return [conserv, base, agressivo]
    }
    return growthData.scenarios.map((s) => ({ ...s, budgetNum: 0, description: '' }))
  })()

  const calendar = content.calendar
  const currentMonth = new Date().getMonth() + 1 // 1–12

  return (
    <div className="space-y-6">
      {/* 3 cards de cenário */}
      <div className="grid md:grid-cols-3 gap-4">
        {scenarios.map((s: any, i: number) => (
          <div
            key={s.name}
            className="relative rounded-2xl p-6 animate-fade-up"
            style={{
              background: s.recommended
                ? 'linear-gradient(135deg, rgba(240,180,41,0.10) 0%, rgba(240,180,41,0.04) 100%)'
                : '#111114',
              border: `1px solid ${s.recommended ? 'rgba(240,180,41,0.4)' : '#2A2A30'}`,
              animationDelay: `${i * 0.1}s`,
            }}
          >
            {s.recommended && (
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap"
                style={{ background: '#F0B429', color: '#000' }}
              >
                RECOMENDADO
              </div>
            )}

            <div className="font-display font-bold text-lg mb-0.5" style={{ color: s.color }}>{s.name}</div>
            {s.description && <div className="text-xs text-slate-500 mb-3">{s.description}</div>}
            <div className="text-2xl font-display font-bold text-white mb-4">{s.budget}</div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Leads/mês</span>
                <span className="font-semibold text-white">{s.leads}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Receita est.</span>
                <span className="font-semibold" style={{ color: s.color }}>{s.revenue}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">ROAS</span>
                <span className="font-semibold text-[#22C55E]">{s.roas}×</span>
              </div>
            </div>

            <div className="mt-4">
              <div className="h-1.5 bg-[#1E1E24] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min((Number(s.roas) / 8) * 100, 100)}%`, background: s.color }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico de projeção */}
      <GrowthChart bench={bench} currentBudget={budget} />

      {/* ── Calendário de Marketing ─────────────────────────────────────── */}
      <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2A2A30] flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-white">📅 Calendário de Marketing</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Quando investir, escalar, reter e trocar criativos · {niche || 'Nicho geral'}
            </p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full font-semibold"
            style={{ background: 'rgba(240,180,41,0.1)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.25)' }}>
            2026
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0">
          {calendar.map((month) => {
            const isCurrent = month.monthNum === currentMonth
            return (
              <div
                key={month.month}
                className="p-4 border-b border-r border-[#1E1E24] last:border-r-0 hover:bg-[#16161A] transition-colors"
                style={{
                  background: isCurrent ? 'rgba(240,180,41,0.04)' : 'transparent',
                  borderColor: '#1E1E24',
                }}
              >
                {/* Mês */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="font-display font-bold text-sm"
                    style={{ color: isCurrent ? '#F0B429' : '#94A3B8' }}
                  >
                    {month.month}
                  </div>
                  {isCurrent && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: '#F0B429', color: '#000' }}>
                      AGORA
                    </span>
                  )}
                </div>

                {/* Ações */}
                <div className="space-y-2">
                  {month.actions.map((action, ai) => (
                    <div key={ai} className="flex items-start gap-1.5">
                      <span className="text-sm flex-shrink-0 mt-0.5">{ACTION_ICONS[action.type]}</span>
                      <div>
                        <div
                          className="text-[10px] font-bold uppercase tracking-wide"
                          style={{ color: action.color }}
                        >
                          {action.label}
                        </div>
                        <div className="text-[10px] text-slate-600 leading-tight mt-0.5">
                          {action.detail}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-4 px-1">
        {Object.entries(ACTION_ICONS).map(([type, icon]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>{icon}</span>
            <span>{ACTION_LABELS[type]}</span>
          </div>
        ))}
      </div>

      {/* Ações prioritárias da IA */}
      {hasAIData && analysis.key_actions?.length > 0 && (
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
          <div className="font-display font-bold text-white mb-3">🚀 Próximos Passos (IA)</div>
          <div className="space-y-2">
            {analysis.key_actions.map((action: string, i: number) => (
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
