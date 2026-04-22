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
  impressionShare: number | null
  budgetLostIS: number | null
  rankLostIS: number | null
  issues: string[]; recommendations: string[]
}

interface SearchTerm {
  term: string; campaignName: string; campaignId: string; status: string
  spend: number; impressions: number; clicks: number
  conversions: number; cpa: number; ctr: number
  tag: 'waste' | 'opportunity' | 'ok'
}

interface Keyword {
  text: string; campaignName: string
  qualityScore: number | null
  creativeQuality: string | null; landingQuality: string | null; predictedCtr: string | null
  spend: number; impressions: number; conversions: number
}

interface AuctionInsight {
  domain: string
  impressionShare: number; overlapRate: number; outrankingShare: number
  topOfPageRate: number; absoluteTopRate: number
}

interface Totals {
  spend: number; conversions: number; revenue: number
  clicks: number; impressions: number
  avgCTR: number; avgCPA: number; avgROAS: number; avgCVR: number
  avgImpressionShare: number | null
  activeCampaigns: number; totalCampaigns: number
}

interface IntelligenceData {
  score: number; scoreGrade: string
  campaigns: GoogleCampaign[]
  byType: Record<string, { label: string; count: number; totalSpend: number; totalConversions: number; totalRevenue: number; avgCPA: number; avgROAS: number }>
  searchTerms: SearchTerm[]
  keywords: Keyword[]
  auctionInsights: AuctionInsight[]
  totals: Totals
  globalRecs: Array<{ type: RecType; title: string; description: string }>
}

function fmt(n: number) {
  if (n >= 1_000_000) return `R$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000)      return `R$${(n / 1000).toFixed(1)}k`
  return `R$${n.toFixed(0)}`
}
function scoreColor(s: number) {
  return s >= 80 ? '#22C55E' : s >= 65 ? '#F0B429' : s >= 50 ? '#FB923C' : '#FF4D4D'
}

const CAMPAIGN_TYPE_ICONS: Record<string, string> = {
  SEARCH: '🔍', SHOPPING: '🛒', DISPLAY: '🖼️', VIDEO: '▶️',
  PERFORMANCE_MAX: '⚡', SMART: '🤖', DISCOVERY: '🌐', LOCAL: '📍',
}
const BID_STRATEGY_COLORS: Record<string, string> = {
  TARGET_CPA: '#22C55E', TARGET_ROAS: '#22C55E',
  MAXIMIZE_CONVERSIONS: '#38BDF8', MAXIMIZE_CONVERSION_VALUE: '#38BDF8',
  MANUAL_CPC: '#FB923C', ENHANCED_CPC: '#F0B429',
  TARGET_IMPRESSION_SHARE: '#A78BFA',
}

const QS_LABEL: Record<string, string> = {
  BELOW_AVERAGE: 'Abaixo da média',
  AVERAGE:       'Médio',
  ABOVE_AVERAGE: 'Acima da média',
  UNSPECIFIED:   '—',
}

function RecCard({ rec, index }: { rec: { type: RecType; title: string; description: string }; index: number }) {
  const map = {
    critical:    { color: '#FF4D4D', bg: 'rgba(255,77,77,0.06)',   border: 'rgba(255,77,77,0.2)',   icon: '🚨' },
    warning:     { color: '#F0B429', bg: 'rgba(240,180,41,0.06)',  border: 'rgba(240,180,41,0.2)',  icon: '⚠️' },
    opportunity: { color: '#22C55E', bg: 'rgba(34,197,94,0.06)',   border: 'rgba(34,197,94,0.2)',   icon: '💡' },
  }
  const s = map[rec.type]
  return (
    <div className="rounded-xl p-4 animate-fade-up" style={{ background: s.bg, border: `1px solid ${s.border}`, animationDelay: `${index * 0.06}s` }}>
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

function CampaignRow({ campaign }: { campaign: GoogleCampaign }) {
  const [open, setOpen] = useState(false)
  const hasIssues = campaign.issues.length > 0
  const bidColor  = BID_STRATEGY_COLORS[campaign.bidStrategyType] || '#94A3B8'
  const typeIcon  = CAMPAIGN_TYPE_ICONS[campaign.campaignType] || '📋'
  const isColor   = campaign.impressionShare !== null
    ? campaign.impressionShare >= 70 ? '#22C55E' : campaign.impressionShare >= 40 ? '#F0B429' : '#FF4D4D'
    : null

  return (
    <div className="border-b border-[#1E1E24] last:border-0">
      <button onClick={() => setOpen(v => !v)} className="w-full px-5 py-3.5 hover:bg-[#16161A] transition-colors text-left">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base flex-shrink-0">{typeIcon}</span>
              <span className="text-sm font-semibold text-white truncate max-w-[180px]">{campaign.name}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ color: bidColor, background: `${bidColor}18`, border: `1px solid ${bidColor}30` }}>
                {campaign.bidStrategyLabel}
              </span>
              {campaign.impressionShare !== null && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ color: isColor!, background: `${isColor}18`, border: `1px solid ${isColor}30` }}>
                  IS {campaign.impressionShare}%
                </span>
              )}
              {hasIssues && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,77,77,0.1)', color: '#FF4D4D', border: '1px solid rgba(255,77,77,0.2)' }}>
                  {campaign.issues.length} problema{campaign.issues.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex gap-3 mt-1 text-xs text-slate-500 flex-wrap">
              <span>Investido: <strong className="text-[#F0B429]">{fmt(campaign.spend)}</strong></span>
              {campaign.conversions > 0 && <span>Conv: <strong className="text-[#38BDF8]">{campaign.conversions.toFixed(1)}</strong></span>}
              {campaign.cpa > 0 && <span>CPA: <strong className="text-white">R${campaign.cpa}</strong></span>}
              {campaign.roas > 0 && <span>ROAS: <strong className="text-[#22C55E]">{campaign.roas}×</strong></span>}
              <span>CTR: <strong className={campaign.campaignType === 'SEARCH' ? (campaign.ctr < 1 ? 'text-red-400' : 'text-slate-300') : (campaign.ctr < 0.1 ? 'text-red-400' : 'text-slate-300')}>{campaign.ctr}%</strong></span>
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

          {/* Impression Share details */}
          {campaign.impressionShare !== null && (
            <div className="bg-[#16161A] rounded-xl p-3">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Parcela de Impressões (IS)</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-sm font-bold" style={{ color: isColor! }}>{campaign.impressionShare}%</div>
                  <div className="text-[10px] text-slate-600">IS Total</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-[#FB923C]">{campaign.budgetLostIS ?? 0}%</div>
                  <div className="text-[10px] text-slate-600">Perdido (budget)</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-[#F0B429]">{campaign.rankLostIS ?? 0}%</div>
                  <div className="text-[10px] text-slate-600">Perdido (ranking)</div>
                </div>
              </div>
            </div>
          )}

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
                  <span className="text-[#F0B429] flex-shrink-0 mt-0.5">→</span>{rec}
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'CPC',        value: `R$${campaign.cpc}` },
              { label: 'CPM',        value: `R$${campaign.cpm}` },
              { label: 'Impressões', value: campaign.impressions.toLocaleString('pt-BR') },
              { label: 'Cliques',    value: campaign.clicks.toLocaleString('pt-BR') },
              ...(campaign.revenue > 0 ? [{ label: 'Receita', value: fmt(campaign.revenue) }] : []),
              ...(campaign.conversionRate > 0 ? [{ label: 'CVR', value: `${campaign.conversionRate}%` }] : []),
            ].map(m => (
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

// ── Search Terms Panel ────────────────────────────────────────────────────────
function SearchTermsPanel({ terms }: { terms: SearchTerm[] }) {
  const [filter, setFilter] = useState<'all' | 'waste' | 'opportunity'>('all')
  const [copied, setCopied] = useState(false)

  const filtered = filter === 'all' ? terms : terms.filter(t => t.tag === filter)
  const waste     = terms.filter(t => t.tag === 'waste')
  const opp       = terms.filter(t => t.tag === 'opportunity')

  const copyNegatives = () => {
    const list = waste.map(t => t.term).join('\n')
    navigator.clipboard.writeText(list).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const TAG_STYLE = {
    waste:       { color: '#FF4D4D', bg: 'rgba(255,77,77,0.1)',  label: '⛔ Negativar' },
    opportunity: { color: '#22C55E', bg: 'rgba(34,197,94,0.1)',  label: '🏆 Oportunidade' },
    ok:          { color: '#64748B', bg: 'rgba(100,116,139,0.1)', label: '✓ Ok' },
  }

  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#2A2A30]">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-display font-bold text-white flex items-center gap-2">
            <span>🔎</span> Termos de Pesquisa
            <span className="text-xs text-slate-500 font-normal">({terms.length} termos · últimos 30d)</span>
          </h3>
          {waste.length > 0 && (
            <button
              onClick={copyNegatives}
              className="text-xs font-bold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
              style={{ background: 'rgba(255,77,77,0.1)', color: '#FF4D4D', border: '1px solid rgba(255,77,77,0.2)' }}
            >
              {copied ? '✓ Copiado!' : `⛔ Copiar ${waste.length} negativos`}
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {([
            { key: 'all',         label: `Todos (${terms.length})`,       color: '#64748B' },
            { key: 'waste',       label: `⛔ Negativar (${waste.length})`, color: '#FF4D4D' },
            { key: 'opportunity', label: `🏆 Escalar (${opp.length})`,    color: '#22C55E' },
          ] as { key: typeof filter; label: string; color: string }[]).map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="text-[11px] font-semibold px-3 py-1 rounded-full transition-all"
              style={{
                color:      filter === f.key ? '#0D0D10' : f.color,
                background: filter === f.key ? f.color : `${f.color}12`,
                border:     `1px solid ${f.color}40`,
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-[#1E1E24] max-h-96 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="px-5 py-6 text-center text-sm text-slate-600">
            {filter === 'waste' ? 'Nenhum termo desperdiçando budget.' : filter === 'opportunity' ? 'Nenhum termo de alta conversão detectado ainda.' : 'Nenhum dado.'}
          </div>
        )}
        {filtered.map((t, i) => {
          const ts = TAG_STYLE[t.tag]
          return (
            <div key={i} className="px-5 py-3 flex items-center gap-3">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap"
                style={{ color: ts.color, background: ts.bg, border: `1px solid ${ts.color}30` }}>
                {ts.label}
              </span>
              <span className="flex-1 text-sm text-slate-200 font-medium truncate" title={t.term}>"{t.term}"</span>
              <div className="flex gap-3 text-[11px] text-slate-500 flex-shrink-0">
                <span>R${t.spend.toFixed(0)}</span>
                {t.conversions > 0 && <span className="text-[#38BDF8]">{t.conversions} conv.</span>}
                {t.cpa > 0 && <span className="text-white">CPA R${t.cpa}</span>}
                <span>{t.ctr}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Quality Score Panel ───────────────────────────────────────────────────────
function KeywordsPanel({ keywords }: { keywords: Keyword[] }) {
  const withQS   = keywords.filter(k => k.qualityScore !== null).sort((a, b) => (a.qualityScore || 10) - (b.qualityScore || 10))
  const lowQS    = withQS.filter(k => (k.qualityScore || 10) <= 4)
  const goodQS   = withQS.filter(k => (k.qualityScore || 0) >= 7)

  if (withQS.length === 0) return null

  const qsColor = (qs: number | null) => qs === null ? '#64748B' : qs >= 7 ? '#22C55E' : qs >= 5 ? '#F0B429' : '#FF4D4D'

  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#2A2A30] flex items-center justify-between">
        <h3 className="font-display font-bold text-white flex items-center gap-2">
          <span>⭐</span> Quality Score das Palavras-Chave
        </h3>
        <div className="flex gap-3 text-xs text-slate-500">
          <span className="text-[#FF4D4D] font-semibold">{lowQS.length} baixo</span>
          <span className="text-[#22C55E] font-semibold">{goodQS.length} bom</span>
        </div>
      </div>
      <div className="divide-y divide-[#1E1E24] max-h-72 overflow-y-auto">
        {withQS.slice(0, 30).map((kw, i) => (
          <div key={i} className="px-5 py-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
              style={{ background: `${qsColor(kw.qualityScore)}18`, color: qsColor(kw.qualityScore) }}>
              {kw.qualityScore ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-slate-200 font-medium truncate">"{kw.text}"</div>
              <div className="text-[10px] text-slate-600 truncate">{kw.campaignName}</div>
            </div>
            <div className="flex gap-3 text-[11px] text-slate-500 flex-shrink-0">
              {kw.spend > 0 && <span>R${kw.spend.toFixed(0)}</span>}
              {kw.conversions > 0 && <span className="text-[#38BDF8]">{kw.conversions} conv.</span>}
              {kw.predictedCtr && <span title="CTR previsto">{QS_LABEL[kw.predictedCtr] || kw.predictedCtr}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Auction Insights Panel ────────────────────────────────────────────────────
function AuctionPanel({ insights, myIS }: { insights: AuctionInsight[]; myIS: number | null }) {
  if (insights.length === 0) return null
  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#2A2A30]">
        <h3 className="font-display font-bold text-white flex items-center gap-2">
          <span>🏁</span> Auction Insights — Concorrentes no Leilão
        </h3>
        {myIS !== null && (
          <p className="text-xs text-slate-500 mt-1">Sua parcela de impressões: <span className="text-white font-semibold">{myIS}%</span></p>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1E1E24]">
              {['Concorrente','IS %','Sobreposição','Supera (%)','Topo de Pág.','Abs. Topo'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] text-slate-600 uppercase tracking-wider font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E1E24]">
            {insights.map((ins, i) => {
              const isColor = ins.impressionShare >= 50 ? '#FF4D4D' : ins.impressionShare >= 25 ? '#F0B429' : '#22C55E'
              return (
                <tr key={i} className="hover:bg-[#16161A] transition-colors">
                  <td className="px-4 py-2.5 font-semibold text-slate-200 max-w-[180px] truncate">{ins.domain}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-[#1E1E24] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(ins.impressionShare, 100)}%`, background: isColor }} />
                      </div>
                      <span style={{ color: isColor }} className="font-bold">{ins.impressionShare}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-400">{ins.overlapRate}%</td>
                  <td className="px-4 py-2.5">
                    <span className={ins.outrankingShare >= 50 ? 'text-green-400 font-semibold' : 'text-slate-400'}>
                      {ins.outrankingShare}%
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-400">{ins.topOfPageRate}%</td>
                  <td className="px-4 py-2.5 text-slate-400">{ins.absoluteTopRate}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3 border-t border-[#1E1E24] text-[10px] text-slate-600">
        IS = parcela de impressões · Sobreposição = % que seu anúncio e o do concorrente apareceram juntos · Supera = % que você ficou acima
      </div>
    </div>
  )
}

interface Props { onNavigateToConnections?: () => void }

export function TabGoogleIntelligence({ onNavigateToConnections }: Props) {
  const { connectedAccounts } = useAppStore()
  const googleAccount = connectedAccounts.find(a => a.platform === 'google')

  const [data,        setData]        = useState<IntelligenceData | null>(null)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [fetched,     setFetched]     = useState(false)
  const [manualAccId, setManualAccId] = useState('')

  const resolvedAccountId = googleAccount?.accountId || manualAccId.trim().replace(/-/g, '')

  const fetchIntelligence = async () => {
    if (!googleAccount?.accessToken || !resolvedAccountId) return
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/ads-data/google-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: googleAccount.accessToken, accountId: resolvedAccountId }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setData(json); setFetched(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!googleAccount) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-white mb-1">Google Ads IA</h2>
          <p className="text-slate-500 text-sm">Análise profunda das suas campanhas Google Ads em tempo real.</p>
        </div>
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-10 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl"
            style={{ background: 'rgba(66,133,244,0.12)', border: '1px solid rgba(66,133,244,0.25)' }}>🎯</div>
          <h3 className="font-display text-xl font-bold text-white mb-2">Conecte o Google Ads</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
            Conecte sua conta para ver Search Terms com sugestão de negativos, Quality Score, Impression Share e Auction Insights dos concorrentes.
          </p>
          <button onClick={onNavigateToConnections}
            className="px-6 py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
            style={{ background: 'linear-gradient(135deg, #4285F4, #1a6ae8)', color: '#fff' }}>
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
            {data && <span className="text-slate-600"> · {data.totals.totalCampaigns} campanhas · {data.searchTerms.length} termos · últimos 30d</span>}
          </p>
        </div>
        <button onClick={fetchIntelligence} disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #4285F4, #1a6ae8)', color: '#fff' }}>
          {loading ? '⏳ Analisando...' : fetched ? '🔄 Reanalisar conta' : '🔍 Analisar conta agora'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 flex items-center justify-between">
          <span>{error}</span><button onClick={() => setError('')} className="ml-4">×</button>
        </div>
      )}

      {!googleAccount.accountId && (
        <div className="rounded-2xl p-5" style={{ background: 'rgba(240,180,41,0.05)', border: '1px solid rgba(240,180,41,0.2)' }}>
          <div className="text-sm font-semibold text-[#F0B429] mb-1">⚠ Customer ID não detectado automaticamente</div>
          <p className="text-xs text-slate-500 mb-3">Insira seu Customer ID (formato: 123-456-7890 ou 1234567890).</p>
          <div className="flex gap-2">
            <input type="text" value={manualAccId} onChange={e => setManualAccId(e.target.value)}
              placeholder="ex: 123-456-7890"
              className="flex-1 bg-[#111114] border border-[#2A2A30] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#F0B429]" />
            <button onClick={fetchIntelligence} disabled={loading || !manualAccId.trim()}
              className="px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #4285F4, #1a6ae8)', color: '#fff' }}>
              {loading ? 'Analisando...' : 'Analisar'}
            </button>
          </div>
        </div>
      )}

      {!fetched && !loading && googleAccount.accountId && (
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-10 text-center">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="font-display text-lg font-bold text-white mb-2">Pronto para analisar</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Clique em "Analisar conta agora" para buscar campanhas, termos de pesquisa, Quality Score, Impression Share e concorrentes no leilão em tempo real.
          </p>
        </div>
      )}

      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="bg-[#111114] border border-[#2A2A30] rounded-2xl h-24" />)}</div>
          <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl h-48" />
          <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl h-64" />
          <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl h-64" />
        </div>
      )}

      {data && !loading && (
        <>
          {/* Score + KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="md:col-span-1 bg-[#111114] border border-[#2A2A30] rounded-2xl p-5 flex flex-col items-center justify-center text-center">
              <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">Score da conta</div>
              <div className="font-display text-5xl font-bold mb-1" style={{ color: sc }}>{data.scoreGrade}</div>
              <div className="text-xs text-slate-500">{data.score}/100</div>
            </div>
            {[
              { label: 'Investido 30d', value: fmt(data.totals.spend), color: '#F0B429', sub: `${data.totals.activeCampaigns} ativa${data.totals.activeCampaigns !== 1 ? 's' : ''}` },
              { label: 'Conversões',    value: data.totals.conversions > 0 ? data.totals.conversions.toFixed(0) : '—', color: '#38BDF8', sub: data.totals.avgCPA > 0 ? `CPA: R$${data.totals.avgCPA}` : '' },
              { label: data.totals.avgROAS > 0 ? 'ROAS' : 'CVR', value: data.totals.avgROAS > 0 ? `${data.totals.avgROAS}×` : `${data.totals.avgCVR}%`, color: '#22C55E', sub: data.totals.revenue > 0 ? `Receita: ${fmt(data.totals.revenue)}` : '' },
              { label: data.totals.avgImpressionShare !== null ? 'IS Médio' : 'CTR Médio', value: data.totals.avgImpressionShare !== null ? `${data.totals.avgImpressionShare}%` : `${data.totals.avgCTR}%`, color: data.totals.avgCTR < 1.0 ? '#FF4D4D' : data.totals.avgCTR >= 3.0 ? '#22C55E' : '#F0B429', sub: `${data.totals.clicks.toLocaleString('pt-BR')} cliques` },
            ].map(kpi => (
              <div key={kpi.label} className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5 flex flex-col justify-between">
                <div className="text-[10px] text-slate-600 uppercase tracking-wider">{kpi.label}</div>
                <div className="font-display text-2xl font-bold mt-2" style={{ color: kpi.color }}>{kpi.value}</div>
                {kpi.sub && <div className="text-[10px] text-slate-600 mt-1">{kpi.sub}</div>}
              </div>
            ))}
          </div>

          {/* Recomendações globais */}
          {data.globalRecs.length > 0 && (
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
              <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2"><span>⚡</span> Recomendações Prioritárias</h3>
              <div className="space-y-3">{data.globalRecs.map((rec, i) => <RecCard key={i} rec={rec} index={i} />)}</div>
            </div>
          )}

          {/* Search Terms — destaque principal */}
          {data.searchTerms.length > 0 && <SearchTermsPanel terms={data.searchTerms} />}

          {/* Distribuição por tipo + estratégias de lance */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
              <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2"><span>📊</span> Distribuição por Tipo</h3>
              <div className="space-y-2.5">
                {Object.entries(data.byType).map(([key, g]) => {
                  const pct  = data.totals.spend > 0 ? (g.totalSpend / data.totals.spend) * 100 : 0
                  const icon = CAMPAIGN_TYPE_ICONS[key] || '📋'
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-400 flex items-center gap-1.5"><span>{icon}</span><span className="truncate max-w-[150px]">{g.label}</span></span>
                        <span className="text-slate-300 font-semibold">{fmt(g.totalSpend)}</span>
                      </div>
                      <div className="h-1.5 bg-[#1E1E24] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #4285F4, #38BDF8)' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
              <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2"><span>🧠</span> Estratégias de Lance</h3>
              {(() => {
                const bidGroups: Record<string, { label: string; color: string; count: number; spend: number }> = {}
                for (const c of data.campaigns) {
                  if (!bidGroups[c.bidStrategyType]) bidGroups[c.bidStrategyType] = { label: c.bidStrategyLabel, color: BID_STRATEGY_COLORS[c.bidStrategyType] || '#94A3B8', count: 0, spend: 0 }
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
                        ⚠️ CPC Manual detectado — migre para estratégias automáticas para aproveitar o ML do Google.
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Quality Score */}
          {data.keywords.length > 0 && <KeywordsPanel keywords={data.keywords} />}

          {/* Auction Insights */}
          <AuctionPanel insights={data.auctionInsights} myIS={data.totals.avgImpressionShare} />

          {/* Campanhas */}
          {data.campaigns.length > 0 && (
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#2A2A30] flex items-center justify-between">
                <h3 className="font-display font-bold text-white flex items-center gap-2"><span>📋</span> Campanhas</h3>
                <span className="text-xs text-slate-500">Clique para ver IS, problemas e recomendações</span>
              </div>
              <div>{data.campaigns.sort((a, b) => b.spend - a.spend).map(c => <CampaignRow key={c.id} campaign={c} />)}</div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
