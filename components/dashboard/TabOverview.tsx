// components/dashboard/TabOverview.tsx — Overview ao vivo com projeções por nicho
'use client'

import { StatCard } from './StatCard'
import { RevenueChart } from './RevenueChart'
import { FunnelChart } from './FunnelChart'
import { getBenchmark, computeNicheProjection } from '@/lib/niche_benchmarks'
import { overviewKPIs, channelCards } from '@/lib/mockData'
import type { ClientData } from '@/lib/store'

interface Props {
  strategy: Record<string, any>
  analysis: Record<string, any>
  clientData: ClientData | null
}

function getChannelIcon(channel: string): string {
  const icons: Record<string, string> = {
    'Meta Ads': '📘', 'Facebook': '📘', 'Instagram': '📸',
    'Google Search': '🔍', 'Google Shopping': '🛒', 'Google PMAX': '🎯',
    'YouTube': '▶️', 'TikTok': '🎵', 'LinkedIn': '💼',
    'Orgânico': '🌿', 'SEO': '🌿', 'Email': '📧',
    'WhatsApp': '💬', 'Pinterest': '📌', 'Google Maps': '📍',
  }
  for (const [key, icon] of Object.entries(icons)) {
    if (channel.toLowerCase().includes(key.toLowerCase())) return icon
  }
  return '📊'
}

function BudgetStatusBadge({ status, budget, recommended }: {
  status: 'abaixo' | 'mínimo' | 'ideal'
  budget: number
  recommended: number
}) {
  const config = {
    abaixo: { color: '#FF4D4D', bg: 'rgba(255,77,77,0.1)', icon: '⚠️', label: 'Abaixo do mínimo' },
    mínimo: { color: '#F0B429', bg: 'rgba(240,180,41,0.1)', icon: '⚡', label: 'Budget mínimo' },
    ideal:  { color: '#22C55E', bg: 'rgba(34,197,94,0.1)',  icon: '✅', label: 'Budget ideal' },
  }
  const c = config[status]

  if (status === 'ideal') return null // não mostra badge se estiver bom

  return (
    <div className="rounded-2xl p-4" style={{ background: c.bg, border: `1px solid ${c.color}33` }}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{c.icon}</span>
        <div className="flex-1">
          <div className="text-sm font-semibold" style={{ color: c.color }}>
            {c.icon} {c.label}
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Seu budget atual <strong className="text-white">R${budget.toLocaleString('pt-BR')}</strong> está{' '}
            {status === 'abaixo' ? 'abaixo do mínimo recomendado' : 'no patamar mínimo'} para este nicho.{' '}
            O investimento ideal para resultados consistentes é{' '}
            <strong className="text-white">R${recommended.toLocaleString('pt-BR')}/mês</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}

export function TabOverview({ strategy, analysis, clientData }: Props) {
  const niche = clientData?.niche || ''
  const budget = clientData?.budget || 0
  const bench = getBenchmark(niche)
  const proj = bench && budget > 0 ? computeNicheProjection(bench, budget) : null

  const hasAIStrategy = strategy && strategy.priority_ranking?.length > 0

  // KPIs: prioridade → IA gerada → benchmark calculado → mock
  const kpis = (() => {
    if (proj) {
      const roasColor =
        proj.roasStatus === 'excelente' ? '#22C55E' :
        proj.roasStatus === 'bom'       ? '#F0B429' : '#FF4D4D'

      const cplColor =
        proj.cplAvg <= (bench!.kpi_thresholds.cpl_good)  ? '#22C55E' :
        proj.cplAvg <= (bench!.kpi_thresholds.cpl_bad)   ? '#F0B429' : '#FF4D4D'

      return [
        {
          label: 'Receita Estimada',
          value: `R$${Math.round(proj.revenueMonth / 1000)}k`,
          sub: `R$${Math.round(proj.revenueMin / 1000)}k – R$${Math.round(proj.revenueMax / 1000)}k/mês`,
          color: '#F0B429',
        },
        {
          label: 'Leads / mês',
          value: `${proj.leadsMin}–${proj.leadsMax}`,
          sub: `CPL médio R$${Math.round(proj.cplAvg)} · nicho ${bench!.name}`,
          color: '#22C55E',
        },
        {
          label: 'ROAS Estimado',
          value: proj.roasIsLtvBased ? `${proj.roas}× → ${proj.roasLtv}×` : `${proj.roas}×`,
          sub: proj.roasIsLtvBased
            ? `Campanha → LTV · Meta: ${bench!.kpi_thresholds.roas_good}×`
            : `Meta do nicho: ${bench!.kpi_thresholds.roas_good}×`,
          color: roasColor,
        },
        {
          label: 'CPL Médio',
          value: `R$${Math.round(proj.cplAvg)}`,
          sub: `Benchmark: R$${bench!.cpl_min}–${bench!.cpl_max}`,
          color: cplColor,
        },
      ]
    }
    return overviewKPIs
  })()

  // Canais: IA → benchmark top_channels → mock
  const channels = (() => {
    if (hasAIStrategy) {
      return strategy.priority_ranking.slice(0, 5).map((ch: any) => ({
        name: ch.channel,
        icon: getChannelIcon(ch.channel),
        leads: `${ch.leads_min ?? '?'}–${ch.leads_max ?? '?'}`,
        cpl: Math.round(ch.cpl_avg ?? ch.cpl_min ?? 0),
        budget: ch.budget_brl ? `R$${ch.budget_brl.toLocaleString('pt-BR')}` : '—',
        status: 'Ativo',
      }))
    }
    if (bench) {
      const cplByChannel = bench.cpl_by_channel
      return bench.best_channels.slice(0, 4).map((ch) => {
        const range = cplByChannel[ch] || `R$${bench.cpl_min}–${bench.cpl_max}`
        const [minStr] = range.replace('R$', '').split('–')
        const cplNum = parseInt(minStr, 10)
        const leadsEst = proj ? Math.round((budget / bench.best_channels.length) / cplNum) : '—'
        return {
          name: ch,
          icon: getChannelIcon(ch),
          leads: proj ? `~${leadsEst}` : '—',
          cpl: cplNum,
          budget: proj ? `R$${Math.round(budget / bench.best_channels.length).toLocaleString('pt-BR')}` : '—',
          status: 'Ativo',
        }
      })
    }
    return channelCards
  })()

  return (
    <div className="space-y-6">

      {/* Alerta de budget */}
      {proj && (
        <BudgetStatusBadge
          status={proj.budgetStatus}
          budget={budget}
          recommended={proj.budgetRecommended}
        />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            trend={(kpi as any).trend}
            sub={kpi.sub}
            color={kpi.color}
            delay={i * 0.08}
          />
        ))}
      </div>

      {/* Métricas adicionais do nicho */}
      {proj && bench && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-4 text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">LTV por Cliente</div>
            <div className="font-display text-xl font-bold text-[#A78BFA]">
              R${Math.round(proj.ltv / 1000)}k
            </div>
            <div className="text-[10px] text-slate-600 mt-1">{bench.ltv_multiplier}× ticket médio</div>
          </div>
          <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-4 text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Vendas Est./mês</div>
            <div className="font-display text-xl font-bold text-[#22C55E]">{proj.salesMonth}</div>
            <div className="text-[10px] text-slate-600 mt-1">CVR {(bench.cvr_lead_to_sale * 100).toFixed(0)}% do nicho</div>
          </div>
          <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-4 text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Ticket Médio</div>
            <div className="font-display text-xl font-bold text-[#38BDF8]">
              R${bench.avg_ticket.toLocaleString('pt-BR')}
            </div>
            <div className="text-[10px] text-slate-600 mt-1">{bench.name}</div>
          </div>
        </div>
      )}

      {/* Recomendação — IA ou benchmark local */}
      {(proj || hasAIStrategy) && (
        <div className="rounded-2xl p-5" style={{
          background: 'linear-gradient(135deg, rgba(240,180,41,0.07) 0%, rgba(240,180,41,0.02) 100%)',
          border: '1px solid rgba(240,180,41,0.2)',
        }}>
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">🧠</span>
            <div className="flex-1">
              <div className="text-xs text-[#F0B429] font-semibold uppercase tracking-widest mb-1">
                {hasAIStrategy && strategy.score_label
                  ? `Análise IA · ${strategy.score_label}`
                  : `Análise de Benchmark · ${bench?.name || niche}`}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                {hasAIStrategy && strategy.recommendation
                  ? strategy.recommendation
                  : proj!.recommendation}
              </p>
              {/* Nota sobre ROAS LTV quando aplicável */}
              {proj?.roasIsLtvBased && !hasAIStrategy && (
                <div className="mt-3 flex items-start gap-2 text-xs text-slate-500 bg-[#16161A] rounded-lg px-3 py-2">
                  <span className="text-[#F0B429] flex-shrink-0">ℹ</span>
                  <span>
                    O ROAS de campanha ({proj.roas}×) é baixo na primeira venda — normal em nichos com alta recorrência.
                    O ROAS real considerando LTV é de <strong className="text-[#F0B429]">{proj.roasLtv}×</strong>, que justifica o investimento.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Gráfico de projeção */}
      <RevenueChart
        data={proj?.chartData}
        title={proj ? 'Projeção de Receita' : 'Receita Real vs Meta'}
        subtitle={proj
          ? `Ramp-up 6 meses · Base: R$${Math.round(proj.revenueMonth / 1000)}k/mês`
          : 'Últimos 7 meses · R$'
        }
      />

      {/* Funil + Canais */}
      <div className="grid md:grid-cols-2 gap-6">
        <FunnelChart data={proj?.funnelData} />

        {/* Canais */}
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-6 animate-fade-up delay-400">
          <div className="font-display font-bold text-white text-lg mb-1">
            {hasAIStrategy ? 'Canais Recomendados' : bench ? 'Melhores Canais do Nicho' : 'Canais Ativos'}
          </div>
          <div className="text-xs text-slate-500 mb-5">
            {hasAIStrategy ? 'Estratégia IA · por prioridade' :
             bench ? `Benchmark ${bench.name}` : 'Performance por canal'}
          </div>

          <div className="space-y-3">
            {channels.map((ch: any) => (
              <div
                key={ch.name}
                className="flex items-center justify-between p-3 bg-[#16161A] border border-[#2A2A30] rounded-xl hover:border-[#3A3A42] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{ch.icon}</span>
                  <div>
                    <div className="text-sm font-semibold text-white">{ch.name}</div>
                    <div className="text-xs text-slate-500">{ch.leads} leads/mês</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <div>
                    <div className="text-xs text-slate-500">CPL</div>
                    <div className="text-sm font-bold text-[#F0B429]">R${ch.cpl}</div>
                  </div>
                  {ch.budget && (
                    <div>
                      <div className="text-xs text-slate-500">Budget</div>
                      <div className="text-xs font-semibold text-slate-300">{ch.budget}</div>
                    </div>
                  )}
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ color: '#22C55E', background: 'rgba(34,197,94,0.1)' }}
                  >
                    {ch.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights do nicho */}
      {bench && (
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">💡</span>
            <div className="font-display font-bold text-white">Insights de Mercado · {bench.name}</div>
            {bench.seasonality.length > 0 && (
              <span className="ml-auto text-xs px-2 py-1 rounded-full font-medium"
                style={{ background: 'rgba(240,180,41,0.1)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.25)' }}>
                Pico: {bench.seasonality.join(' · ')}
              </span>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-2">
            {bench.insights.map((ins, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-400 bg-[#16161A] rounded-xl px-3 py-2">
                <span className="text-[#F0B429] mt-0.5 flex-shrink-0">→</span>
                {ins}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alertas regulatórios (IA) */}
      {hasAIStrategy && strategy.regulatory_alerts?.length > 0 && (
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
          <div className="font-display font-bold text-white text-sm mb-3">⚠️ Alertas do Nicho</div>
          <div className="space-y-2">
            {strategy.regulatory_alerts.map((alert: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-400">
                <span className="text-[#F0B429] mt-0.5 flex-shrink-0">→</span>
                {alert}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
