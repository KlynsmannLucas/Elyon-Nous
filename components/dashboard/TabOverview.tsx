// components/dashboard/TabOverview.tsx — Overview ao vivo com projeções por nicho
'use client'

import { StatCard } from './StatCard'
import { RevenueChart } from './RevenueChart'
import { FunnelChart } from './FunnelChart'
import { getBenchmark, computeNicheProjection } from '@/lib/niche_benchmarks'
import { overviewKPIs, channelCards } from '@/lib/mockData'
import { useAppStore } from '@/lib/store'
import type { ClientData } from '@/lib/store'

interface Props {
  strategy: Record<string, any>
  analysis: Record<string, any>
  clientData: ClientData | null
}

function DataSourceBadge({ source }: { source: 'real' | 'estimated' }) {
  return source === 'real' ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
      Dados reais
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: 'rgba(240,180,41,0.08)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.2)' }}>
      ~ Estimado
    </span>
  )
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
  const niche  = clientData?.niche || ''
  const budget = clientData?.budget || 0
  const bench  = getBenchmark(niche)
  const proj   = bench && budget > 0 ? computeNicheProjection(bench, budget) : null

  // Dados reais da auditoria mais recente
  const auditCache = useAppStore(s => s.auditCache)
  const key = clientData?.clientName || ''
  const auditHistory = auditCache[key]
  const latestAudit  = Array.isArray(auditHistory)
    ? auditHistory[0]?.audit
    : (auditHistory && !Array.isArray(auditHistory) ? auditHistory : null)
  const rm = latestAudit?._realMetrics as {
    totalSpend: number; totalLeads: number; totalRevenue: number
    avgCPL: number | null; avgROAS: number | null; avgCTR: number | null
    campaignCount: number; dataSource: string
  } | undefined

  // Tem dados reais úteis quando há spend E leads reais
  const hasRealData = !!(rm && rm.totalSpend > 0 && rm.totalLeads > 0)

  const hasAIStrategy = strategy && strategy.priority_ranking?.length > 0

  // KPIs: prioridade → dados reais da auditoria → IA → benchmark → mock
  const dataSource: 'real' | 'estimated' = hasRealData ? 'real' : 'estimated'

  const kpis = (() => {
    // ── 1. Dados reais da auditoria ──────────────────────────────────────────
    if (hasRealData && rm) {
      const cplColor = bench
        ? rm.avgCPL! <= bench.kpi_thresholds.cpl_good ? '#22C55E'
          : rm.avgCPL! <= bench.kpi_thresholds.cpl_bad ? '#F0B429' : '#FF4D4D'
        : '#F0B429'
      const roasColor = bench && rm.avgROAS
        ? rm.avgROAS >= bench.kpi_thresholds.roas_good ? '#22C55E'
          : rm.avgROAS >= bench.kpi_thresholds.roas_good * 0.7 ? '#F0B429' : '#FF4D4D'
        : '#64748B'
      return [
        {
          label: 'Investimento Real',
          value: rm.totalSpend >= 1000
            ? `R$${(rm.totalSpend / 1000).toFixed(1)}k`
            : `R$${rm.totalSpend}`,
          sub: `${rm.campaignCount} campanhas · fonte: ${rm.dataSource}`,
          color: '#F0B429',
        },
        {
          label: 'Leads Reais',
          value: rm.totalLeads.toLocaleString('pt-BR'),
          sub: bench ? `Benchmark CPL: R$${bench.cpl_min}–${bench.cpl_max}` : 'Dados da auditoria',
          color: '#22C55E',
        },
        {
          label: rm.avgROAS ? 'ROAS Real' : 'CPL Real',
          value: rm.avgROAS ? `${rm.avgROAS}×` : `R$${rm.avgCPL}`,
          sub: rm.avgROAS
            ? bench ? `Meta nicho: ${bench.kpi_thresholds.roas_good}×` : 'Dados de conversão'
            : bench ? `Benchmark: R$${bench.cpl_min}–${bench.cpl_max}` : 'CPL médio real',
          color: rm.avgROAS ? roasColor : cplColor,
        },
        {
          label: 'CPL Real',
          value: rm.avgCPL ? `R$${rm.avgCPL}` : '—',
          sub: bench ? `Benchmark: R$${bench.cpl_min}–${bench.cpl_max}` : 'CPL médio da conta',
          color: cplColor,
        },
      ]
    }

    // ── 2. Benchmark calculado (projeção) ────────────────────────────────────
    if (proj) {
      const roasColor =
        proj.roasStatus === 'excelente' ? '#22C55E' :
        proj.roasStatus === 'bom'       ? '#F0B429' : '#FF4D4D'
      const cplColor =
        proj.cplAvg <= bench!.kpi_thresholds.cpl_good ? '#22C55E' :
        proj.cplAvg <= bench!.kpi_thresholds.cpl_bad  ? '#F0B429' : '#FF4D4D'
      return [
        {
          label: 'Receita Estimada',
          value: `R$${Math.round(proj.revenueMonth / 1000)}k`,
          sub: `R$${Math.round(proj.revenueMin / 1000)}k – R$${Math.round(proj.revenueMax / 1000)}k/mês`,
          color: '#F0B429',
        },
        {
          label: 'Leads / mês',
          value: `~${proj.leadsMonth.toLocaleString('pt-BR')}`,
          sub: `Intervalo R$${Math.round(proj.cplAvg)} CPL · ${bench!.cpl_min}–${bench!.cpl_max} nicho`,
          color: '#22C55E',
        },
        {
          label: 'ROAS Estimado',
          value: proj.roasIsLtvBased ? `${proj.roasLtv}×` : `${proj.roas}×`,
          sub: proj.roasIsLtvBased
            ? `Inclui LTV · campanha direta: ${proj.roas}× · Meta: ${bench!.kpi_thresholds.roas_good}×`
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

      {/* Banner de fonte de dados */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <DataSourceBadge source={dataSource} />
        {hasRealData && rm && (
          <span className="text-[11px] text-slate-500">
            Última auditoria · {latestAudit?.generated_at
              ? new Date(latestAudit.generated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
              : 'data desconhecida'}
            {' · '}{rm.campaignCount} campanhas · {rm.dataSource}
          </span>
        )}
        {!hasRealData && (
          <span className="text-[11px] text-[#F0B429] flex items-center gap-1">
            ⚠ Execute a <strong>Auditoria</strong> para ver dados reais da sua conta
          </span>
        )}
      </div>

      {/* Alerta de budget */}
      {proj && !hasRealData && (
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

      {/* Métricas reais da auditoria — CTR, total investido, total leads */}
      {hasRealData && rm && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Investimento total',  value: `R$${rm.totalSpend >= 1000 ? (rm.totalSpend/1000).toFixed(1)+'k' : rm.totalSpend}`, color: '#F0B429' },
            { label: 'Total de leads',      value: rm.totalLeads.toLocaleString('pt-BR'), color: '#22C55E' },
            { label: 'CPL real',            value: rm.avgCPL ? `R$${rm.avgCPL}` : '—', color: rm.avgCPL && bench ? (rm.avgCPL <= bench.cpl_max ? '#22C55E' : '#FF4D4D') : '#64748B' },
            { label: rm.avgROAS ? 'ROAS real' : 'CTR médio', value: rm.avgROAS ? `${rm.avgROAS}×` : rm.avgCTR ? `${rm.avgCTR}%` : '—', color: '#A78BFA' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#111114] border border-[#2A2A30] rounded-xl p-3 text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</div>
              <div className="font-display text-lg font-bold" style={{ color }}>{value}</div>
              {bench && label === 'CPL real' && rm.avgCPL && (
                <div className="text-[10px] mt-0.5" style={{ color: rm.avgCPL <= bench.cpl_max ? '#22C55E' : '#FF4D4D' }}>
                  {rm.avgCPL <= bench.cpl_min ? '↓ Abaixo benchmark' : rm.avgCPL <= bench.cpl_max ? '~ Dentro benchmark' : '↑ Acima benchmark'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Métricas adicionais do nicho */}
      {proj && bench && !hasRealData && (
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

      {/* Unit Economics do cliente */}
      {clientData?.ticketPrice && clientData?.grossMargin ? (() => {
        const ticket  = clientData.ticketPrice!
        const margin  = clientData.grossMargin! / 100
        const cvr     = clientData.conversionRate ? clientData.conversionRate / 100 : null
        const churn   = clientData.avgChurnMonthly ? clientData.avgChurnMonthly / 100 : 0.05
        const breakEvenROAS = +(1 / margin).toFixed(2)
        const maxCPL  = cvr ? Math.round(ticket * margin * cvr) : null
        const ltv     = clientData.isRecurring ? Math.round(ticket / churn * margin) : null
        const payback = maxCPL ? +(maxCPL / (ticket * margin)).toFixed(1) : null

        return (
          <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">📐</span>
              <div className="font-display font-bold text-white text-sm">Unit Economics · {clientData.clientName}</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-[#16161A] rounded-xl p-3 text-center">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Break-even ROAS</div>
                <div className="font-display text-xl font-bold text-[#F0B429]">{breakEvenROAS}×</div>
                <div className="text-[10px] text-slate-600 mt-1">mínimo para lucro</div>
              </div>
              {maxCPL !== null && (
                <div className="bg-[#16161A] rounded-xl p-3 text-center">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">CPL Máx. Lucrativo</div>
                  <div className="font-display text-xl font-bold text-[#22C55E]">R${maxCPL}</div>
                  <div className="text-[10px] text-slate-600 mt-1">acima disso = prejuízo</div>
                </div>
              )}
              {ltv !== null && (
                <div className="bg-[#16161A] rounded-xl p-3 text-center">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">LTV Real</div>
                  <div className="font-display text-xl font-bold text-[#A78BFA]">R${ltv.toLocaleString('pt-BR')}</div>
                  <div className="text-[10px] text-slate-600 mt-1">margem × recorrência</div>
                </div>
              )}
              {payback !== null && (
                <div className="bg-[#16161A] rounded-xl p-3 text-center">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">CAC Payback</div>
                  <div className="font-display text-xl font-bold text-[#38BDF8]">{payback} meses</div>
                  <div className="text-[10px] text-slate-600 mt-1">para recuperar CAC</div>
                </div>
              )}
            </div>
          </div>
        )
      })() : null}

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

      {/* Gráfico de projeção — só mostra quando não há dados reais (evita números de benchmark enganosos) */}
      {!hasRealData && (
        <RevenueChart
          data={proj?.chartData}
          title="Projeção de Receita"
          subtitle={proj
            ? `Ramp-up 6 meses · Base: R$${Math.round(proj.revenueMonth / 1000)}k/mês`
            : 'Últimos 7 meses · R$'
          }
        />
      )}

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
