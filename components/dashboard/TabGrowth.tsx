// components/dashboard/TabGrowth.tsx — Cenários de budget, projeção e calendário de marketing
'use client'

import { GrowthChart } from './GrowthChart'
import { getBenchmark } from '@/lib/niche_benchmarks'
import { getNicheContent } from '@/lib/niche_content'
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

function fmtRevenue(n: number) {
  if (n >= 1_000_000) return `R$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000)      return `R$${Math.round(n / 1000)}k`
  return `R$${n.toLocaleString('pt-BR')}`
}

function makeScenario(b: number, cplAvg: number, cvr: number, ticket: number) {
  if (b <= 0 || cplAvg <= 0 || cvr <= 0 || ticket <= 0) return null
  const leads   = Math.round(b / cplAvg)
  const revenue = Math.round(leads * cvr * ticket)
  const roas    = revenue > 0 ? +(revenue / b).toFixed(1) : 0
  return { leads, revenue, roas }
}

export function TabGrowth({ analysis, clientData }: Props) {
  const niche  = clientData?.niche || ''
  const budget = clientData?.budget || 0
  const bench  = getBenchmark(niche)
  const content = getNicheContent(niche)
  const hasAIData = analysis && analysis.priority_ranking?.length > 0

  // ── Cenários de budget ────────────────────────────────────────────────────
  // Regra invariante: conservador ≤ recomendado ≤ agressivo
  // Recomendado = budget real do cliente (ou benchmark_ideal se sem orçamento)
  // Conservador = 50% do Recomendado (sem flooring acima do Recomendado)
  // Agressivo   = 200% do Recomendado
  const scenarios = (() => {
    if (bench) {
      const cplAvg     = (bench.cpl_min + bench.cpl_max) / 2
      const baseNum    = budget > 0 ? budget : bench.budget_ideal
      const conservNum = Math.round(baseNum * 0.5)   // sempre 50% do recomendado
      const agresNum   = Math.round(baseNum * 2)      // sempre 200% do recomendado

      // Guard: nunca renderizar cenários invertidos
      if (conservNum > baseNum || baseNum > agresNum) {
        console.error('[ELYON] Cenários incoerentes detectados:', { conservNum, baseNum, agresNum })
      }

      const c = makeScenario(conservNum, cplAvg, bench.cvr_lead_to_sale, bench.avg_ticket)
      const r = makeScenario(baseNum,    cplAvg, bench.cvr_lead_to_sale, bench.avg_ticket)
      const a = makeScenario(agresNum,   cplAvg, bench.cvr_lead_to_sale, bench.avg_ticket)

      if (!c || !r || !a) return null

      return {
        conservNum, baseNum, agresNum,
        belowFloor: budget > 0 && budget < bench.budget_floor,
        hasClientBudget: budget > 0,
        dataSource: budget > 0 ? 'real' : 'benchmark',
        cplAvg,
        items: [
          {
            name: 'Conservador',
            budget: `R$${conservNum.toLocaleString('pt-BR')}/mês`,
            budgetNum: conservNum,
            leads: c.leads,
            revenue: fmtRevenue(c.revenue),
            roas: c.roas,
            recommended: false,
            color: '#94A3B8',
            description: budget > 0 ? 'Conservador — 50% do orçamento atual' : 'Investimento inicial mínimo',
          },
          {
            name: 'Recomendado',
            budget: `R$${baseNum.toLocaleString('pt-BR')}/mês`,
            budgetNum: baseNum,
            leads: r.leads,
            revenue: fmtRevenue(r.revenue),
            roas: r.roas,
            recommended: true,
            color: '#F0B429',
            description: budget > 0 ? 'Atual / Recomendado — orçamento atual do cliente' : 'Recomendado para resultado consistente',
          },
          {
            name: 'Agressivo',
            budget: `R$${agresNum.toLocaleString('pt-BR')}/mês`,
            budgetNum: agresNum,
            leads: a.leads,
            revenue: fmtRevenue(a.revenue),
            roas: a.roas,
            recommended: false,
            color: '#22C55E',
            description: budget > 0 ? 'Agressivo — 2× o orçamento atual' : 'Escala máxima e dominância',
          },
        ],
      }
    }
    return null
  })()

  const calendar = content.calendar
  const currentMonth = new Date().getMonth() + 1 // 1–12

  return (
    <div className="space-y-6">
      {/* Aviso: orçamento abaixo do mínimo recomendado */}
      {scenarios?.belowFloor && bench && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
          style={{ background: 'rgba(240,180,41,0.06)', border: '1px solid rgba(240,180,41,0.25)' }}>
          <span className="flex-shrink-0 mt-0.5">⚠️</span>
          <div>
            <span className="font-semibold text-[#F0B429]">Orçamento abaixo do mínimo para {bench.name}. </span>
            <span className="text-slate-400">
              O mínimo recomendado é <strong className="text-white">R${bench.budget_floor.toLocaleString('pt-BR')}/mês</strong>.
              Com R${budget.toLocaleString('pt-BR')}/mês o CPL tende a ficar acima de R${bench.cpl_max} e os resultados serão limitados.
              As projeções abaixo refletem o orçamento atual — aumente para o patamar recomendado para previsibilidade.
            </span>
          </div>
        </div>
      )}

      {/* Empty state sem orçamento */}
      {!scenarios && (
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-8 text-center">
          <div className="text-3xl mb-3">📊</div>
          <div className="text-sm font-semibold text-slate-400 mb-1">Configure o orçamento do cliente</div>
          <div className="text-xs text-slate-600">Acesse a aba Visão Geral e preencha o orçamento mensal para ver as projeções.</div>
        </div>
      )}

      {/* 3 cards de cenário */}
      {scenarios && (
        <div className="grid md:grid-cols-3 gap-4">
          {scenarios.items.map((s, i) => (
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
                    style={{ width: `${Math.min((s.roas / 8) * 100, 100)}%`, background: s.color }}
                  />
                </div>
              </div>

              {/* Fonte dos dados */}
              <div className="mt-3 pt-3 border-t border-[#1E1E24] flex items-center gap-1.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                  style={{
                    background: scenarios.dataSource === 'real' ? 'rgba(34,197,94,0.08)' : 'rgba(240,180,41,0.08)',
                    color:      scenarios.dataSource === 'real' ? '#22C55E' : '#F0B429',
                    border:     `1px solid ${scenarios.dataSource === 'real' ? 'rgba(34,197,94,0.2)' : 'rgba(240,180,41,0.2)'}`,
                  }}>
                  {scenarios.dataSource === 'real' ? 'Orçamento real' : 'Benchmark do nicho'}
                </span>
                <span className="text-[10px] text-slate-600">CPL médio R${scenarios.cplAvg.toFixed(0)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Gráfico de projeção */}
      <GrowthChart
        bench={bench}
        currentBudget={budget}
        scenarioBudgets={scenarios ? {
          conservNum: scenarios.conservNum,
          baseNum:    scenarios.baseNum,
          agresNum:   scenarios.agresNum,
        } : undefined}
      />

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
