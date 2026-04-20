// components/dashboard/TabGoogleIntelligence.tsx — Google Ads Intelligence ao vivo
'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'

type RecType = 'critical' | 'warning' | 'opportunity'

interface GoogleCampaign {
  id: string; name: string; status: string
  campaignType: string; campaignTypeLabel: string
  bidStrategyType: string; bidStrategyLabel: string
  spend: number; impressions: number; clicks: number
  ctr: number; cpc: number; cpm: number
  conversions: number; conversionRate: number
  cpa: number; roas: number; revenue: number
  issues: string[]; recommendations: string[]
}

interface TypeGroup {
  label: string; count: number
  totalSpend: number; totalConversions: number; totalRevenue: number
  avgCPA: number; avgROAS: number
}

interface Totals {
  spend: number; conversions: number; revenue: number
  clicks: number; impressions: number
  avgCTR: number; avgCPA: number; avgROAS: number; avgCVR: number
  activeCampaigns: number; totalCampaigns: number
}

interface IntelligenceData {
  score: number; scoreGrade: string
  campaigns: GoogleCampaign[]
  byType: Record<string, TypeGroup>
  totals: Totals
  globalRecs: Array<{ type: RecType; title: string; description: string }>
}

function fmt(n: number) {
  if (n >= 1_000_000) return `R$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000)      return `R$${(n / 1000).toFixed(1)}k`
  return `R$${n.toFixed(0)}`
}

function scoreColor(s: number) {
  if (s >= 80) return '#22C55E'
  if (s >= 65) return '#F0B429'
  if (s >= 50) return '#FB923C'
  return '#FF4D4D'
}

const CAMPAIGN_TYPE_ICONS: Record<string, string> = {
  SEARCH:          '🔍',
  SHOPPING:        '🛒',
  DISPLAY:         '🖼️',
  VIDEO:           '▶️',
  PERFORMANCE_MAX: '⚡',
  SMART:           '🤖',
  DISCOVERY:       '🌐',
  LOCAL:           '📍',
}

const BID_STRATEGY_COLORS: Record<string, string> = {
  TARGET_CPA:                '#22C55E',
  TARGET_ROAS:               '#22C55E',
  MAXIMIZE_CONVERSIONS:      '#38BDF8',
  MAXIMIZE_CONVERSION_VALUE: '#38BDF8',
  MANUAL_CPC:                '#FB923C',
  ENHANCED_CPC:              '#F0B429',
  TARGET_IMPRESSION_SHARE:   '#A78BFA',
}

function RecCard({ rec, index }: { rec: { type: RecType; title: string; description: string }; index: number }) {
  const map = {
    critical:    { color: '#FF4D4D', bg: 'rgba(255,77,77,0.06)',   border: 'rgba(255,77,77,0.2)',   icon: '🚨' },
    warning:     { color: '#F0B429', bg: 'rgba(240,180,41,0.06)',  border: 'rgba(240,180,41,0.2)',  icon: '⚠️' },
    opportunity: { color: '#22C55E', bg: 'rgba(34,197,94,0.06)',   border: 'rgba(34,197,94,0.2)',   icon: '💡' },
  }
  const s = map[rec.type]
  return (
    <div className="rounded-xl p-4 animate-fade-up" style={{
      background: s.bg, border: `1px solid ${s.border}`,
      animationDelay: `${index * 0.06}s`,
    }}>
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0 mt-0.5">{s.icon}</span>
        <div>
          <div className="font-semibold text-white text-sm mb-1">{rec.title}</div>
          <div className="text-xs text-slate-400 leading-relaxed">{rec.description}</div>
        </div>
      </div>
    </div>
  )
}

function CampaignTypeCard({ group, typeKey }: { group: TypeGroup; typeKey: string }) {
  const icon  = CAMPAIGN_TYPE_ICONS[typeKey] || '📋'
  const color = group.totalConversions > 0 ? '#22C55E' : '#F0B429'

  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-base">{icon}</span>
            <div className="font-display font-bold text-white text-sm">{group.label}</div>
          </div>
          <div className="text-xs text-slate-500">{group.count} campanha{group.count !== 1 ? 's' : ''}</div>
        </div>
        <span className="text-xs font-bold px-2 py-1 rounded-xl"
          style={{ color: '#F0B429', background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.2)' }}>
          {fmt(group.totalSpend)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {group.totalConversions > 0 ? (
          <>
            <div className="bg-[#16161A] rounded-xl px-3 py-2.5 text-center">
              <div className="text-[10px] text-slate-600 uppercase mb-0.5">
                {group.avgROAS > 0 ? 'ROAS' : 'CPA Médio'}
              </div>
              <div className="text-base font-bold" style={{ color }}>
                {group.avgROAS > 0
                  ? `${group.avgROAS}×`
                  : group.avgCPA > 0 ? `R$${group.avgCPA}` : '—'}
              </div>
            </div>
            <div className="bg-[#16161A] rounded-xl px-3 py-2.5 text-center">
              <div className="text-[10px] text-slate-600 uppercase mb-0.5">
                {group.totalRevenue > 0 ? 'Receita' : 'Conversões'}
              </div>
              <div className="text-base font-bold text-white">
                {group.totalRevenue > 0
                  ? fmt(group.totalRevenue)
                  : group.totalConversions.toLocaleString('pt-BR')}
              </div>
            </div>
          </>
        ) : (
          <div className="col-span-2 bg-[#16161A] rounded-xl px-3 py-2.5 text-center">
            <div className="text-[10px] text-slate-600 uppercase mb-0.5">Investido</div>
            <div className="text-base font-bold" style={{ color: '#F0B429' }}>{fmt(group.totalSpend)}</div>
          </div>
        )}
      </div>
    </div>
  )
}

function CampaignRow({ campaign }: { campaign: GoogleCampaign }) {
  const [open, setOpen] = useState(false)
  const hasIssues = campaign.issues.length > 0
  const bidColor  = BID_STRATEGY_COLORS[campaign.bidStrategyType] || '#94A3B8'
  const typeIcon  = CAMPAIGN_TYPE_ICONS[campaign.campaignType] || '📋'

  return (
    <div className="border-b border-[#1E1E24] last:border-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-5 py-3.5 hover:bg-[#16161A] transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base flex-shrink-0">{typeIcon}</span>
              <span className="text-sm font-semibold text-white truncate max-w-[180px]">{campaign.name}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ color: bidColor, background: `${bidColor}18`, border: `1px solid ${bidColor}30` }}>
                {campaign.bidStrategyLabel}
              </span>
              {hasIssues && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,77,77,0.1)', color: '#FF4D4D', border: '1px solid rgba(255,77,77,0.2)' }}>
                  {campaign.issues.length} problema{campaign.issues.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex gap-3 mt-1 text-xs text-slate-500 flex-wrap">
              <span>Investido: <strong className="text-[#F0B429]">{fmt(campaign.spend)}</strong></span>
              {campaign.conversions > 0 && (
                <span>Conv: <strong className="text-[#38BDF8]">{campaign.conversions.toFixed(1)}</strong></span>
              )}
              {campaign.cpa > 0 && (
                <span>CPA: <strong className="text-white">R${campaign.cpa}</strong></span>
              )}
              {campaign.roas > 0 && (
                <span>ROAS: <strong className="text-[#22C55E]">{campaign.roas}×</strong></span>
              )}
              <span>CTR: <strong className={
                campaign.campaignType === 'SEARCH'
                  ? (campaign.ctr < 1 ? 'text-red-400' : 'text-slate-300')
                  : (campaign.ctr < 0.1 ? 'text-red-400' : 'text-slate-300')
              }>{campaign.ctr}%</strong></span>
              {campaign.conversionRate > 0 && (
                <span>CVR: <strong className={campaign.conversionRate < 1 ? 'text-orange-400' : 'text-slate-300'}>{campaign.conversionRate}%</strong></span>
              )}
            </div>
          </div>
          <span className="text-slate-600 text-xs flex-shrink-0">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-4 space-y-3">
          <div className="text-xs text-slate-500">
            Tipo: <span className="text-slate-300 font-semibold">{campaign.campaignTypeLabel}</span>
            {' '}·{' '}Status: <span className={campaign.status === 'ENABLED' ? 'text-green-400 font-semibold' : 'text-slate-400 font-semibold'}>{campaign.status === 'ENABLED' ? 'Ativa' : 'Pausada'}</span>
          </div>

          {campaign.issues.length > 0 && (
            <div className="space-y-1">
              {campaign.issues.map((issue, i) => (
                <div key={i} className="flex items-center gap-2 text-xs" style={{ color: '#FB923C' }}>
                  <span>●</span>{issue}
                </div>
              ))}
            </div>
          )}

          {campaign.recommendations.length > 0 && (
            <div className="bg-[#16161A] rounded-xl p-3 space-y-1.5">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Ações recomendadas</div>
              {campaign.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="text-[#F0B429] flex-shrink-0 mt-0.5">→</span>
                  {rec}
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'CPC',         value: `R$${campaign.cpc}` },
              { label: 'CPM',         value: `R$${campaign.cpm}` },
              { label: 'Impressões',  value: campaign.impressions.toLocaleString('pt-BR') },
              { label: 'Cliques',     value: campaign.clicks.toLocaleString('pt-BR') },
              ...(campaign.revenue > 0 ? [{ label: 'Receita', value: fmt(campaign.revenue) }] : []),
              ...(campaign.conversionRate > 0 ? [{ label: 'CVR', value: `${campaign.conversionRate}%` }] : []),
            ].map((m) => (
              <div key={m.label} className="bg-[#16161A] rounded-lg px-2.5 py-2 text-center">
                <div className="text-[10px] text-slate-600 uppercase mb-0.5">{m.label}</div>
                <div className="text-xs font-bold text-slate-300">{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface Props {
  onNavigateToConnections?: () => void
}

export function TabGoogleIntelligence({ onNavigateToConnections }: Props) {
  const { connectedAccounts } = useAppStore()
  const googleAccount = connectedAccounts.find(a => a.platform === 'google')

  const [data,    setData]    = useState<IntelligenceData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [fetched, setFetched] = useState(false)

  const fetchIntelligence = async () => {
    if (!googleAccount?.accessToken || !googleAccount?.accountId) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ads-data/google-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: googleAccount.accessToken,
          accountId:   googleAccount.accountId,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setData(json)
      setFetched(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Não conectado ─────────────────────────────────────────────────────────────
  if (!googleAccount) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-white mb-1">Google Ads IA</h2>
          <p className="text-slate-500 text-sm">Análise profunda das suas campanhas Google Ads em tempo real.</p>
        </div>
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-10 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl"
            style={{ background: 'rgba(66,133,244,0.12)', border: '1px solid rgba(66,133,244,0.25)' }}>
            🎯
          </div>
          <h3 className="font-display text-xl font-bold text-white mb-2">Conecte o Google Ads</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
            Conecte sua conta do Google Ads para ver CPA por tipo de campanha, diagnóstico de PMAX,
            estratégias de lance, detecção de desperdício e recomendações com IA.
          </p>
          <button
            onClick={onNavigateToConnections}
            className="px-6 py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
            style={{ background: 'linear-gradient(135deg, #4285F4, #1a6ae8)', color: '#fff' }}
          >
            Ir para Conexões →
          </button>
        </div>
      </div>
    )
  }

  const sc = scoreColor(data?.score || 0)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-white mb-1">Google Ads IA</h2>
          <p className="text-slate-500 text-sm">
            Conta: <span className="text-slate-300 font-semibold">{googleAccount.accountName || googleAccount.accountId}</span>
            {data && <span className="text-slate-600"> · {data.totals.totalCampaigns} campanhas · últimos 30 dias</span>}
          </p>
        </div>
        <button
          onClick={fetchIntelligence}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #4285F4, #1a6ae8)', color: '#fff' }}
        >
          {loading ? '⏳ Analisando...' : fetched ? '🔄 Reanalisar conta' : '🔍 Analisar conta agora'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-4">×</button>
        </div>
      )}

      {/* Estado inicial */}
      {!fetched && !loading && (
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-10 text-center">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="font-display text-lg font-bold text-white mb-2">Pronto para analisar</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Clique em "Analisar conta agora" para buscar campanhas ao vivo e gerar inteligência
            sobre CPA, ROAS, estratégias de lance, PMAX e oportunidades de escala.
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#111114] border border-[#2A2A30] rounded-2xl h-24" />
            ))}
          </div>
          <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl h-48" />
          <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl h-64" />
        </div>
      )}

      {/* Dados carregados */}
      {data && !loading && (
        <>
          {/* Score + KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Score hero */}
            <div className="md:col-span-1 bg-[#111114] border border-[#2A2A30] rounded-2xl p-5 flex flex-col items-center justify-center text-center">
              <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">Score da conta</div>
              <div className="font-display text-5xl font-bold mb-1" style={{ color: sc }}>
                {data.scoreGrade}
              </div>
              <div className="text-xs text-slate-500">{data.score}/100</div>
            </div>

            {/* KPIs */}
            {[
              {
                label: 'Investido 30d',
                value: fmt(data.totals.spend),
                color: '#F0B429',
                sub: data.totals.activeCampaigns > 0 ? `${data.totals.activeCampaigns} ativa${data.totals.activeCampaigns !== 1 ? 's' : ''}` : '',
              },
              {
                label: 'Conversões',
                value: data.totals.conversions > 0 ? data.totals.conversions.toFixed(0) : '—',
                color: '#38BDF8',
                sub: data.totals.avgCPA > 0 ? `CPA: R$${data.totals.avgCPA}` : '',
              },
              {
                label: data.totals.avgROAS > 0 ? 'ROAS' : 'CVR',
                value: data.totals.avgROAS > 0 ? `${data.totals.avgROAS}×` : `${data.totals.avgCVR}%`,
                color: '#22C55E',
                sub: data.totals.revenue > 0 ? `Receita: ${fmt(data.totals.revenue)}` : '',
              },
              {
                label: 'CTR Médio',
                value: `${data.totals.avgCTR}%`,
                color: data.totals.avgCTR < 1.0 ? '#FF4D4D' : data.totals.avgCTR >= 3.0 ? '#22C55E' : '#F0B429',
                sub: `${data.totals.clicks.toLocaleString('pt-BR')} cliques`,
              },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5 flex flex-col justify-between">
                <div className="text-[10px] text-slate-600 uppercase tracking-wider">{kpi.label}</div>
                <div className="font-display text-2xl font-bold mt-2" style={{ color: kpi.color }}>{kpi.value}</div>
                {kpi.sub && <div className="text-[10px] text-slate-600 mt-1">{kpi.sub}</div>}
              </div>
            ))}
          </div>

          {/* Distribuição por tipo + estratégias de lance */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Por tipo de campanha */}
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
              <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2">
                <span>📊</span> Distribuição por Tipo
              </h3>
              <div className="space-y-2.5">
                {Object.entries(data.byType).map(([key, g]) => {
                  const pct = data.totals.spend > 0 ? (g.totalSpend / data.totals.spend) * 100 : 0
                  const icon = CAMPAIGN_TYPE_ICONS[key] || '📋'
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <span>{icon}</span>
                          <span className="truncate max-w-[150px]">{g.label}</span>
                        </span>
                        <span className="text-slate-300 font-semibold">{fmt(g.totalSpend)}</span>
                      </div>
                      <div className="h-1.5 bg-[#1E1E24] rounded-full overflow-hidden">
                        <div className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #4285F4, #38BDF8)' }} />
                      </div>
                    </div>
                  )
                })}
                {Object.keys(data.byType).length === 0 && (
                  <div className="text-xs text-slate-600">Nenhum dado disponível.</div>
                )}
              </div>
            </div>

            {/* Estratégias de lance */}
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
              <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2">
                <span>🧠</span> Estratégias de Lance
              </h3>
              {(() => {
                const bidGroups: Record<string, { label: string; color: string; count: number; spend: number }> = {}
                for (const c of data.campaigns) {
                  if (!bidGroups[c.bidStrategyType]) {
                    bidGroups[c.bidStrategyType] = {
                      label: c.bidStrategyLabel,
                      color: BID_STRATEGY_COLORS[c.bidStrategyType] || '#94A3B8',
                      count: 0, spend: 0,
                    }
                  }
                  bidGroups[c.bidStrategyType].count++
                  bidGroups[c.bidStrategyType].spend += c.spend
                }
                const sorted = Object.entries(bidGroups).sort(([, a], [, b]) => b.spend - a.spend)
                return (
                  <div className="space-y-3">
                    {sorted.map(([key, g]) => (
                      <div key={key} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: g.color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-300 font-semibold truncate max-w-[160px]">{g.label}</span>
                            <span className="text-slate-500 ml-2 flex-shrink-0">{g.count} camp.</span>
                          </div>
                          <div className="text-[10px] text-slate-600 mt-0.5">{fmt(g.spend)}</div>
                        </div>
                      </div>
                    ))}
                    {sorted.some(([k]) => k === 'MANUAL_CPC') && (
                      <div className="mt-3 pt-3 border-t border-[#1E1E24] text-[10px] text-[#FB923C] leading-relaxed">
                        ⚠️ CPC Manual detectado — estratégias automáticas tendem a ter melhor performance com volume de conversões.
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Recomendações globais */}
          {data.globalRecs.length > 0 && (
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
              <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2">
                <span>⚡</span> Recomendações Prioritárias
              </h3>
              <div className="space-y-3">
                {data.globalRecs.map((rec, i) => (
                  <RecCard key={i} rec={rec} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Performance por tipo de campanha */}
          {Object.keys(data.byType).length > 0 && (
            <div>
              <h3 className="font-display font-bold text-white mb-3 flex items-center gap-2">
                <span>🎯</span> Performance por Tipo de Campanha
              </h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(data.byType).map(([key, g]) => (
                  <CampaignTypeCard key={key} typeKey={key} group={g} />
                ))}
              </div>
            </div>
          )}

          {/* Tabela de campanhas */}
          {data.campaigns.length > 0 && (
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#2A2A30] flex items-center justify-between">
                <h3 className="font-display font-bold text-white flex items-center gap-2">
                  <span>📋</span> Campanhas
                </h3>
                <span className="text-xs text-slate-500">Clique para expandir detalhes e recomendações</span>
              </div>
              <div>
                {data.campaigns
                  .sort((a, b) => b.spend - a.spend)
                  .map(c => <CampaignRow key={c.id} campaign={c} />)}
              </div>
            </div>
          )}

          {data.campaigns.length === 0 && (
            <div className="text-center py-8 text-slate-600 text-sm">
              Nenhuma campanha com dados nos últimos 30 dias.
            </div>
          )}
        </>
      )}
    </div>
  )
}
