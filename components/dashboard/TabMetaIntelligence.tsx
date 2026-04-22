// components/dashboard/TabMetaIntelligence.tsx — Meta Ad Intelligence + Ad Sets + Criativos + Pixel + Breakdowns
'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'

type LearningPhase = 'learning' | 'learning_limited' | 'stable' | 'inactive'
type RecType = 'critical' | 'warning' | 'opportunity'

interface Campaign {
  id: string; name: string
  objective: string; objectiveLabel: string; status: string
  spend30: number; impressions: number; clicks: number
  reach: number; frequency: number
  ctr30: number; cpc30: number; cpm30: number
  leads30: number; cpl30: number; purchases30: number
  revenue30: number; roas30: number
  messages30: number; videoViews30: number
  spend7: number; conversions7: number
  learningPhase: LearningPhase
  age: 'new' | 'growing' | 'established' | 'veteran'; ageDays: number
  issues: string[]; recommendations: string[]
}

interface AdSet {
  id: string; name: string; status: string
  campaignId: string; campaignName: string
  optimizationGoal: string; optimizationGoalLabel: string
  dailyBudget: number; lifetimeBudget: number
  hasRemarketing: boolean
  spend: number; impressions: number; clicks: number
  leads: number; cpl: number; ctr: number; frequency: number
  issues: string[]
}

interface AdCreative {
  id: string; name: string; status: string
  campaignId: string; adsetId: string
  title: string; body: string; callToAction: string; imageUrl: string
  spend: number; impressions: number; clicks: number
  leads: number; cpl: number; ctr: number; frequency: number
  tag: 'winner' | 'waste' | 'learning' | 'ok'
}

interface PixelInfo {
  id: string; name: string
  lastFiredTime: string | null
  isActive: boolean
  events: string[]
}

interface GeoBreakdown {
  region: string
  spend: number; leads: number; cpl: number; impressions: number
}

interface PlatformBreakdown {
  platform: string; position: string
  spend: number; leads: number; cpl: number; impressions: number; clicks: number; ctr: number
}

interface DemoBreakdown {
  age: string; gender: string
  spend: number; leads: number; cpl: number; impressions: number
}

interface ObjGroup {
  label: string; count: number
  totalSpend: number; totalLeads: number; totalRevenue: number
  avgCPL: number; avgROAS: number; campaigns: string[]
}

interface Totals {
  spend: number; leads: number; revenue: number; messages: number
  roas: number; cpl: number; avgCTR: number; avgFrequency: number
  activeCampaigns: number; learningCampaigns: number; totalCampaigns: number
  totalAdSets: number; totalAds: number
}

interface PreviousTotals {
  spend: number; leads: number; cpl: number
  spendDelta: number | null; leadsDelta: number | null; cplDelta: number | null
}

interface IntelligenceData {
  score: number; scoreGrade: string
  campaigns: Campaign[]
  adSets: AdSet[]
  ads: AdCreative[]
  pixel: PixelInfo | null
  geoBreakdown: GeoBreakdown[]
  platformBreakdown: PlatformBreakdown[]
  demoBreakdown: DemoBreakdown[]
  byObjective: Record<string, ObjGroup>
  totals: Totals
  previousTotals?: PreviousTotals
  freqThreshold?: number
  globalRecs: Array<{ type: RecType; title: string; description: string }>
}

function fmt(n: number) {
  if (n >= 1_000_000) return `R$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000)      return `R$${(n / 1000).toFixed(1)}k`
  return `R$${n.toFixed(0)}`
}

function scoreColor(score: number) {
  if (score >= 80) return '#22C55E'
  if (score >= 65) return '#F0B429'
  if (score >= 50) return '#FB923C'
  return '#FF4D4D'
}

function AgeBadge({ age, days }: { age: Campaign['age']; days: number }) {
  const map = {
    new:         { label: 'Nova',       color: '#38BDF8', bg: 'rgba(56,189,248,0.1)' },
    growing:     { label: 'Crescendo',  color: '#A78BFA', bg: 'rgba(167,139,250,0.1)' },
    established: { label: 'Madura',     color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
    veteran:     { label: 'Veterana',   color: '#F0B429', bg: 'rgba(240,180,41,0.1)' },
  }
  const s = map[age]
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" title={`${days >= 0 ? days + ' dias' : ''}`}
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}30` }}>
      {s.label}{days >= 0 ? ` (${days}d)` : ''}
    </span>
  )
}

function LearningBadge({ phase }: { phase: LearningPhase }) {
  const map = {
    stable:           { label: 'Estável',               color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
    learning:         { label: 'Em Aprendizado',         color: '#38BDF8', bg: 'rgba(56,189,248,0.1)' },
    learning_limited: { label: 'Aprendizado Limitado',   color: '#FB923C', bg: 'rgba(251,146,60,0.1)' },
    inactive:         { label: 'Inativa',                color: '#64748B', bg: 'rgba(100,116,139,0.1)' },
  }
  const s = map[phase]
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}30` }}>
      {s.label}
    </span>
  )
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

function ObjectiveCard({ group, objective }: { group: ObjGroup; objective: string }) {
  const isLeads   = objective.includes('LEAD')
  const isSales   = objective.includes('SALES') || objective === 'CONVERSIONS'
  const isTraffic = objective.includes('TRAFFIC') || objective === 'LINK_CLICKS'
  const isMsg     = objective === 'MESSAGES'
  const color     = isSales ? '#22C55E' : isLeads ? '#38BDF8' : isMsg ? '#A78BFA' : '#F0B429'
  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="font-display font-bold text-white text-sm">{group.label}</div>
          <div className="text-xs text-slate-500 mt-0.5">{group.count} campanha{group.count !== 1 ? 's' : ''}</div>
        </div>
        <span className="text-xs font-bold px-2 py-1 rounded-xl" style={{ color, background: `${color}15`, border: `1px solid ${color}25` }}>
          {fmt(group.totalSpend)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(isLeads || isSales) && (
          <>
            <div className="bg-[#16161A] rounded-xl px-3 py-2.5 text-center">
              <div className="text-[10px] text-slate-600 uppercase mb-0.5">{isSales ? 'ROAS' : 'CPL Médio'}</div>
              <div className="text-base font-bold" style={{ color }}>
                {isSales ? (group.avgROAS > 0 ? `${group.avgROAS}×` : '—') : (group.avgCPL > 0 ? `R$${group.avgCPL}` : '—')}
              </div>
            </div>
            <div className="bg-[#16161A] rounded-xl px-3 py-2.5 text-center">
              <div className="text-[10px] text-slate-600 uppercase mb-0.5">{isSales ? 'Receita' : 'Leads'}</div>
              <div className="text-base font-bold text-white">
                {isSales ? fmt(group.totalRevenue) : group.totalLeads.toLocaleString('pt-BR')}
              </div>
            </div>
          </>
        )}
        {(isTraffic || isMsg || (!isLeads && !isSales)) && (
          <div className="col-span-2 bg-[#16161A] rounded-xl px-3 py-2.5 text-center">
            <div className="text-[10px] text-slate-600 uppercase mb-0.5">Investido</div>
            <div className="text-base font-bold" style={{ color }}>{fmt(group.totalSpend)}</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Pixel Status Card ──────────────────────────────────────────────────────
function PixelCard({ pixel }: { pixel: PixelInfo | null }) {
  if (!pixel) {
    return (
      <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
        <h3 className="font-display font-bold text-white mb-3 flex items-center gap-2">
          <span>🔴</span> Pixel Meta
        </h3>
        <div className="text-sm text-slate-500">Nenhum pixel encontrado nesta conta.</div>
        <div className="mt-3 text-xs text-slate-600 leading-relaxed">
          Configure o Meta Pixel para rastrear conversões e habilitar públicos de remarketing.
        </div>
      </div>
    )
  }
  const lastFiredDate = pixel.lastFiredTime ? new Date(pixel.lastFiredTime) : null
  const hoursAgo = lastFiredDate ? Math.floor((Date.now() - lastFiredDate.getTime()) / 3600000) : null
  const statusColor = pixel.isActive ? '#22C55E' : '#FF4D4D'
  const statusLabel = pixel.isActive ? 'Ativo' : 'Inativo'
  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
      <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2">
        <span>🔵</span> Pixel Meta
      </h3>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
        <div>
          <div className="text-sm font-semibold text-white">{pixel.name}</div>
          <div className="text-xs" style={{ color: statusColor }}>{statusLabel}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#16161A] rounded-xl px-3 py-2.5">
          <div className="text-[10px] text-slate-600 uppercase mb-0.5">Último disparo</div>
          <div className="text-xs font-semibold text-slate-300">
            {lastFiredDate
              ? hoursAgo !== null && hoursAgo < 48
                ? `${hoursAgo}h atrás`
                : lastFiredDate.toLocaleDateString('pt-BR')
              : 'Nunca'}
          </div>
        </div>
        <div className="bg-[#16161A] rounded-xl px-3 py-2.5">
          <div className="text-[10px] text-slate-600 uppercase mb-0.5">Pixel ID</div>
          <div className="text-xs font-mono text-slate-400 truncate">{pixel.id}</div>
        </div>
      </div>
      {!pixel.isActive && (
        <div className="mt-3 text-xs rounded-lg px-3 py-2 leading-relaxed"
          style={{ background: 'rgba(255,77,77,0.08)', color: '#FF4D4D', border: '1px solid rgba(255,77,77,0.2)' }}>
          Pixel sem disparo há mais de 48h. Verifique a instalação no seu site ou GTM.
        </div>
      )}
    </div>
  )
}

// ── Ad Sets Panel ─────────────────────────────────────────────────────────
function AdSetsPanel({ adSets }: { adSets: AdSet[] }) {
  const [filter, setFilter] = useState<'all' | 'remarketing' | 'issues'>('all')

  if (adSets.length === 0) return null

  const byObjective = adSets.filter(as => {
    if (filter === 'remarketing') return as.hasRemarketing
    if (filter === 'issues')      return as.issues.length > 0
    return true
  })

  const remarketingCount = adSets.filter(a => a.hasRemarketing).length
  const issuesCount      = adSets.filter(a => a.issues.length > 0).length

  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#2A2A30]">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-display font-bold text-white flex items-center gap-2">
            <span>📦</span> Ad Sets <span className="text-slate-600 font-normal text-sm">({adSets.length})</span>
          </h3>
          <div className="flex gap-2">
            {([
              { key: 'all',         label: `Todos (${adSets.length})`,            color: '#64748B' },
              { key: 'remarketing', label: `Remarketing (${remarketingCount})`,   color: '#A78BFA' },
              { key: 'issues',      label: `Problemas (${issuesCount})`,          color: '#FF4D4D' },
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
      </div>
      <div className="divide-y divide-[#1E1E24]">
        {byObjective.length === 0 && (
          <div className="px-5 py-6 text-center text-sm text-slate-600">Nenhum ad set neste filtro.</div>
        )}
        {byObjective.map(as => (
          <div key={as.id} className="px-5 py-3 hover:bg-[#16161A] transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-semibold text-white truncate max-w-[200px]">{as.name}</span>
                  {as.hasRemarketing && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(167,139,250,0.12)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.25)' }}>
                      Remarketing
                    </span>
                  )}
                  {as.issues.map((issue, i) => (
                    <span key={i} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,77,77,0.1)', color: '#FF4D4D', border: '1px solid rgba(255,77,77,0.2)' }}>
                      {issue}
                    </span>
                  ))}
                </div>
                <div className="flex gap-3 text-xs text-slate-500 flex-wrap">
                  <span className="text-slate-600 truncate max-w-[150px]">{as.campaignName}</span>
                  <span>Meta: <strong className="text-slate-400">{as.optimizationGoalLabel}</strong></span>
                  {as.spend > 0 && <span>Gasto: <strong className="text-[#F0B429]">{fmt(as.spend)}</strong></span>}
                  {as.leads > 0 && <span>Leads: <strong className="text-[#38BDF8]">{as.leads}</strong></span>}
                  {as.cpl   > 0 && <span>CPL: <strong className="text-white">R${as.cpl}</strong></span>}
                  {as.ctr   > 0 && <span>CTR: <strong className={as.ctr < 0.5 ? 'text-red-400' : 'text-slate-300'}>{as.ctr}%</strong></span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                {(as.dailyBudget > 0 || as.lifetimeBudget > 0) && (
                  <div className="text-xs text-slate-600">
                    {as.dailyBudget > 0 ? `${fmt(as.dailyBudget)}/dia` : fmt(as.lifetimeBudget)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Creatives Ranking ─────────────────────────────────────────────────────
function CreativesRanking({ ads }: { ads: AdCreative[] }) {
  const [filter, setFilter] = useState<'all' | 'winner' | 'waste' | 'learning'>('all')

  if (ads.length === 0) return null

  const tagConfig = {
    winner:   { label: 'Vencedor',   color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)',   icon: '🏆' },
    waste:    { label: 'Pausar',     color: '#FF4D4D', bg: 'rgba(255,77,77,0.1)',   border: 'rgba(255,77,77,0.25)',   icon: '⛔' },
    learning: { label: 'Aprendendo', color: '#38BDF8', bg: 'rgba(56,189,248,0.1)',  border: 'rgba(56,189,248,0.25)', icon: '📚' },
    ok:       { label: 'Neutro',     color: '#64748B', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.25)', icon: '✓' },
  }

  const filtered = ads
    .filter(a => filter === 'all' || a.tag === filter)
    .sort((a, b) => {
      const order = { winner: 0, ok: 1, learning: 2, waste: 3 }
      return order[a.tag] - order[b.tag] || b.spend - a.spend
    })

  const counts = { winner: ads.filter(a => a.tag === 'winner').length, waste: ads.filter(a => a.tag === 'waste').length, learning: ads.filter(a => a.tag === 'learning').length }

  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#2A2A30]">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-display font-bold text-white flex items-center gap-2">
            <span>🎨</span> Criativos <span className="text-slate-600 font-normal text-sm">({ads.length})</span>
          </h3>
          <div className="flex gap-2 flex-wrap">
            {([
              { key: 'all',      label: `Todos (${ads.length})`,               color: '#64748B' },
              { key: 'winner',   label: `🏆 Vencedores (${counts.winner})`,    color: '#22C55E' },
              { key: 'waste',    label: `⛔ Pausar (${counts.waste})`,         color: '#FF4D4D' },
              { key: 'learning', label: `📚 Aprendendo (${counts.learning})`,  color: '#38BDF8' },
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
      </div>
      <div className="divide-y divide-[#1E1E24]">
        {filtered.length === 0 && (
          <div className="px-5 py-6 text-center text-sm text-slate-600">Nenhum criativo neste filtro.</div>
        )}
        {filtered.map(ad => {
          const t = tagConfig[ad.tag]
          return (
            <div key={ad.id} className="px-5 py-3 hover:bg-[#16161A] transition-colors">
              <div className="flex items-start gap-3">
                {ad.imageUrl ? (
                  <img src={ad.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-[#1E1E24]" />
                ) : (
                  <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-xl"
                    style={{ background: t.bg, border: `1px solid ${t.border}` }}>
                    {t.icon}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-white truncate max-w-[200px]">{ad.name}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ color: t.color, background: t.bg, border: `1px solid ${t.border}` }}>
                      {t.icon} {t.label}
                    </span>
                  </div>
                  {ad.title && <div className="text-xs text-slate-400 truncate mb-1">"{ad.title}"</div>}
                  <div className="flex gap-3 text-xs text-slate-500 flex-wrap">
                    {ad.spend > 0     && <span>Gasto: <strong className="text-[#F0B429]">{fmt(ad.spend)}</strong></span>}
                    {ad.leads > 0     && <span>Leads: <strong className="text-[#38BDF8]">{ad.leads}</strong></span>}
                    {ad.cpl > 0       && <span>CPL: <strong className="text-white">R${ad.cpl}</strong></span>}
                    {ad.ctr > 0       && <span>CTR: <strong className={ad.ctr < 0.5 ? 'text-red-400' : 'text-slate-300'}>{ad.ctr}%</strong></span>}
                    {ad.frequency > 0 && <span>Freq: <strong className="text-slate-300">{ad.frequency}×</strong></span>}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Geo Breakdown Table ───────────────────────────────────────────────────
function GeoTable({ geo }: { geo: GeoBreakdown[] }) {
  if (geo.length === 0) return null
  const maxSpend = Math.max(...geo.map(g => g.spend), 1)
  const withLeads = [...geo].filter(g => g.leads > 0).sort((a, b) => a.cpl - b.cpl)
  const bestRegion = withLeads[0]

  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#2A2A30] flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-display font-bold text-white flex items-center gap-2">
          <span>🗺️</span> Performance Geográfica
        </h3>
        {bestRegion && (
          <span className="text-xs px-2 py-1 rounded-full font-semibold"
            style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }}>
            Melhor: {bestRegion.region} — CPL R${bestRegion.cpl}
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1E1E24]">
              <th className="px-5 py-2.5 text-left text-slate-600 font-semibold uppercase tracking-wide">Região</th>
              <th className="px-3 py-2.5 text-right text-slate-600 font-semibold uppercase tracking-wide">Gasto</th>
              <th className="px-3 py-2.5 text-right text-slate-600 font-semibold uppercase tracking-wide">Leads</th>
              <th className="px-3 py-2.5 text-right text-slate-600 font-semibold uppercase tracking-wide">CPL</th>
              <th className="px-5 py-2.5 text-left text-slate-600 font-semibold uppercase tracking-wide w-32">Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A1A20]">
            {geo.map((row, i) => {
              const pct = (row.spend / maxSpend) * 100
              const isBest = row === bestRegion
              return (
                <tr key={i} className="hover:bg-[#16161A] transition-colors">
                  <td className="px-5 py-2.5">
                    <span className="font-semibold" style={{ color: isBest ? '#22C55E' : '#CBD5E1' }}>{row.region}</span>
                    {isBest && <span className="ml-2 text-[10px] text-[#22C55E]">★ Melhor CPL</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right text-[#F0B429] font-semibold">{fmt(row.spend)}</td>
                  <td className="px-3 py-2.5 text-right text-[#38BDF8] font-semibold">{row.leads || '—'}</td>
                  <td className="px-3 py-2.5 text-right text-slate-300 font-semibold">{row.cpl > 0 ? `R$${row.cpl}` : '—'}</td>
                  <td className="px-5 py-2.5">
                    <div className="h-1.5 bg-[#1E1E24] rounded-full overflow-hidden w-24">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: isBest ? '#22C55E' : 'linear-gradient(90deg, #1877F2, #38BDF8)' }} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Platform Breakdown ────────────────────────────────────────────────────
function PlatformPanel({ platforms }: { platforms: PlatformBreakdown[] }) {
  if (platforms.length === 0) return null

  const platformLabel: Record<string, string> = {
    facebook:  'Facebook', instagram: 'Instagram', audience_network: 'Audience Network', messenger: 'Messenger',
  }
  const positionLabel: Record<string, string> = {
    feed: 'Feed', story: 'Stories', reels: 'Reels', right_hand_column: 'Col. Direita',
    search: 'Pesquisa', marketplace: 'Marketplace', video_feeds: 'Feed de Vídeo', instagram_explore: 'Explorar',
    instagram_profile_feed: 'Perfil IG', instream_video: 'In-stream', rewarded_video: 'Rewarded',
  }
  const platformColor: Record<string, string> = {
    facebook: '#1877F2', instagram: '#E1306C', audience_network: '#F0B429', messenger: '#00B2FF',
  }

  const grouped: Record<string, PlatformBreakdown[]> = {}
  for (const p of platforms) {
    if (!grouped[p.platform]) grouped[p.platform] = []
    grouped[p.platform].push(p)
  }

  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
      <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2">
        <span>📱</span> Distribuição por Plataforma
      </h3>
      <div className="space-y-5">
        {Object.entries(grouped).map(([plat, rows]) => {
          const color = platformColor[plat] || '#64748B'
          const totalSpend = rows.reduce((s, r) => s + r.spend, 0)
          const totalLeads = rows.reduce((s, r) => s + r.leads, 0)
          const platCpl    = totalLeads > 0 ? +(totalSpend / totalLeads).toFixed(2) : 0
          return (
            <div key={plat}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="font-semibold text-white text-sm">{platformLabel[plat] || plat}</span>
                </div>
                <div className="flex gap-3 text-xs text-slate-500">
                  <span className="text-[#F0B429] font-semibold">{fmt(totalSpend)}</span>
                  {totalLeads > 0 && <span className="text-[#38BDF8]">{totalLeads} leads</span>}
                  {platCpl    > 0 && <span className="text-slate-300">CPL R${platCpl}</span>}
                </div>
              </div>
              <div className="space-y-1.5 pl-4">
                {rows.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 w-24 flex-shrink-0 truncate">{positionLabel[r.position] || r.position}</span>
                    <div className="flex-1 h-1 bg-[#1E1E24] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${totalSpend > 0 ? (r.spend / totalSpend) * 100 : 0}%`, background: color }} />
                    </div>
                    <span className="text-slate-400 w-16 text-right flex-shrink-0">{fmt(r.spend)}</span>
                    {r.ctr > 0 && <span className="text-slate-600 w-14 text-right flex-shrink-0">{r.ctr}% CTR</span>}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Demographics Breakdown ─────────────────────────────────────────────────
function DemoPanel({ demo }: { demo: DemoBreakdown[] }) {
  if (demo.length === 0) return null

  const ages = [...new Set(demo.map(d => d.age))].sort()
  const genders = [...new Set(demo.map(d => d.gender))]
  const genderLabel: Record<string, string> = { male: 'Homens', female: 'Mulheres', unknown: 'Desconh.' }
  const genderColor: Record<string, string> = { male: '#38BDF8', female: '#F472B6', unknown: '#64748B' }

  const maxSpend = Math.max(...demo.map(d => d.spend), 1)

  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
      <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2">
        <span>👥</span> Audiência por Idade e Gênero
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1E1E24]">
              <th className="py-2 pr-4 text-left text-slate-600 font-semibold uppercase">Faixa</th>
              {genders.map(g => (
                <th key={g} className="py-2 px-2 text-center font-semibold" style={{ color: genderColor[g] || '#64748B' }}>
                  {genderLabel[g] || g}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A1A20]">
            {ages.map(age => (
              <tr key={age} className="hover:bg-[#16161A] transition-colors">
                <td className="py-2.5 pr-4 font-semibold text-slate-300">{age}</td>
                {genders.map(gender => {
                  const cell = demo.find(d => d.age === age && d.gender === gender)
                  if (!cell) return <td key={gender} className="py-2.5 px-2 text-center text-slate-700">—</td>
                  const intensity = Math.round((cell.spend / maxSpend) * 90) + 10
                  const color = genderColor[gender] || '#64748B'
                  return (
                    <td key={gender} className="py-2.5 px-2 text-center">
                      <div className="rounded-lg px-2 py-1 inline-block min-w-[60px]"
                        style={{ background: `${color}${Math.round(intensity * 0.3).toString(16).padStart(2,'0')}` }}>
                        <div className="font-bold" style={{ color }}>{fmt(cell.spend)}</div>
                        {cell.leads > 0 && <div className="text-[10px] text-slate-400">{cell.leads} leads</div>}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
        {genders.map(g => {
          const total = demo.filter(d => d.gender === g).reduce((s, d) => s + d.spend, 0)
          const leads = demo.filter(d => d.gender === g).reduce((s, d) => s + d.leads, 0)
          return (
            <span key={g}>
              <span style={{ color: genderColor[g] }}>●</span> {genderLabel[g] || g}:
              <strong className="text-slate-400 ml-1">{fmt(total)}</strong>
              {leads > 0 && <span className="ml-1 text-[#38BDF8]">· {leads} leads</span>}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function CampaignRow({ campaign, freqLimit }: { campaign: Campaign; freqLimit: number }) {
  const [open, setOpen] = useState(false)
  const hasIssues = campaign.issues.length > 0

  return (
    <div className="border-b border-[#1E1E24] last:border-0">
      <button onClick={() => setOpen(v => !v)} className="w-full px-5 py-3.5 hover:bg-[#16161A] transition-colors text-left">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white truncate max-w-[200px]">{campaign.name}</span>
              <LearningBadge phase={campaign.learningPhase} />
              <AgeBadge age={campaign.age ?? 'established'} days={campaign.ageDays ?? -1} />
              {hasIssues && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,77,77,0.1)', color: '#FF4D4D', border: '1px solid rgba(255,77,77,0.2)' }}>
                  {campaign.issues.length} problema{campaign.issues.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex gap-3 mt-1 text-xs text-slate-500 flex-wrap">
              <span>Investido: <strong className="text-[#F0B429]">{fmt(campaign.spend30)}</strong></span>
              {campaign.leads30  > 0 && <span>Leads: <strong className="text-[#38BDF8]">{campaign.leads30}</strong></span>}
              {campaign.cpl30    > 0 && <span>CPL: <strong className="text-white">R${campaign.cpl30}</strong></span>}
              {campaign.roas30   > 0 && <span>ROAS: <strong className="text-[#22C55E]">{campaign.roas30}×</strong></span>}
              <span>CTR: <strong className={campaign.ctr30 < 0.5 ? 'text-red-400' : 'text-slate-300'}>{campaign.ctr30}%</strong></span>
              {campaign.frequency > 0 && (
                <span>Freq: <strong className={campaign.frequency > freqLimit ? 'text-orange-400' : 'text-slate-300'}>{campaign.frequency}×</strong></span>
              )}
            </div>
          </div>
          <span className="text-slate-600 text-xs flex-shrink-0">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-4 space-y-3">
          <div className="text-xs text-slate-500">
            Objetivo: <span className="text-slate-300 font-semibold">{campaign.objectiveLabel}</span>
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
              { label: 'CPM',        value: `R$${campaign.cpm30}` },
              { label: 'CPC',        value: `R$${campaign.cpc30}` },
              { label: 'Alcance',    value: campaign.reach.toLocaleString('pt-BR') },
              { label: 'Impressões', value: campaign.impressions.toLocaleString('pt-BR') },
              ...(campaign.messages30  > 0 ? [{ label: 'WhatsApp',  value: String(campaign.messages30) }]  : []),
              ...(campaign.conversions7 > 0 ? [{ label: 'Conv. 7d', value: String(campaign.conversions7) }] : []),
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

type StatusFilter = 'all' | 'active' | 'paused' | 'issues'

export function TabMetaIntelligence({ onNavigateToConnections }: Props) {
  const { connectedAccounts, auditCache, setAuditCache, clientData: storeClientData } = useAppStore()
  const metaAccount = connectedAccounts.find(a => a.platform === 'meta')

  const [data,         setData]         = useState<IntelligenceData | null>(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [fetched,      setFetched]      = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const cacheKey = storeClientData?.clientName || metaAccount?.accountName || metaAccount?.accountId || ''

  useEffect(() => {
    if (!fetched && cacheKey) {
      const history = auditCache[cacheKey]
      const latest  = Array.isArray(history) ? history[0]?.audit : null
      if (latest?._intelligenceData) {
        setData(latest._intelligenceData as IntelligenceData)
        setFetched(true)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey])

  const fetchIntelligence = async () => {
    if (!metaAccount?.accessToken || !metaAccount?.accountId) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ads-data/meta-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: metaAccount.accessToken,
          accountId:   metaAccount.accountId,
          niche:       storeClientData?.niche || '',
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setData(json)
      setFetched(true)

      if (cacheKey) {
        setAuditCache(cacheKey, {
          _intelligenceData: json,
          _previousTotals:   json.previousTotals,
          _realMetrics: {
            totalSpend:    json.totals.spend,
            totalLeads:    json.totals.leads,
            totalRevenue:  json.totals.revenue,
            avgCPL:        json.totals.cpl > 0 ? json.totals.cpl : null,
            avgROAS:       json.totals.roas > 0 ? json.totals.roas : null,
            avgCTR:        json.totals.avgCTR,
            campaignCount: json.totals.totalCampaigns,
            dataSource:    'Meta Ads (ao vivo)',
          },
          generated_at: new Date().toISOString(),
        })
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!metaAccount) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-white mb-1">Meta Ad Intelligence</h2>
          <p className="text-slate-500 text-sm">Análise profunda das suas campanhas Meta Ads em tempo real.</p>
        </div>
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-10 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl"
            style={{ background: 'rgba(24,119,242,0.12)', border: '1px solid rgba(24,119,242,0.25)' }}>
            📘
          </div>
          <h3 className="font-display text-xl font-bold text-white mb-2">Conecte o Meta Ads</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
            Conecte sua conta do Gerenciador de Anúncios para ver ROAS por objetivo, fase de aprendizado,
            criativos, ad sets, pixel, análise geográfica e demográfica.
          </p>
          <button onClick={onNavigateToConnections}
            className="px-6 py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
            style={{ background: 'linear-gradient(135deg, #1877F2, #0a5dc2)', color: '#fff' }}>
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
          <h2 className="font-display text-2xl font-bold text-white mb-1">Meta Ad Intelligence</h2>
          <p className="text-slate-500 text-sm">
            Conta: <span className="text-slate-300 font-semibold">{metaAccount.accountName || metaAccount.accountId}</span>
            {data && (
              <span className="text-slate-600">
                {' '}· {data.totals.totalCampaigns} campanhas
                {data.totals.totalAdSets > 0 && ` · ${data.totals.totalAdSets} ad sets`}
                {data.totals.totalAds > 0 && ` · ${data.totals.totalAds} criativos`}
                {' '}· últimos 30 dias
              </span>
            )}
          </p>
        </div>
        <button onClick={fetchIntelligence} disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #1877F2, #0a5dc2)', color: '#fff' }}>
          {loading ? '⏳ Analisando...' : fetched ? '🔄 Reanalisar conta' : '🔍 Analisar conta agora'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-4">×</button>
        </div>
      )}

      {!fetched && !loading && (
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-10 text-center">
          <div className="text-4xl mb-4">📡</div>
          <h3 className="font-display text-lg font-bold text-white mb-2">Pronto para analisar</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Clique em "Analisar conta agora" para buscar campanhas, ad sets, criativos, pixel e breakdowns ao vivo.
          </p>
        </div>
      )}

      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="bg-[#111114] border border-[#2A2A30] rounded-2xl h-24" />)}
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="bg-[#111114] border border-[#2A2A30] rounded-2xl h-40" />)}
          </div>
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
            {(() => {
              const prev = data.previousTotals
              const DeltaBadge = ({ delta, invertColor }: { delta: number | null | undefined; invertColor?: boolean }) => {
                if (delta == null) return null
                const positive = invertColor ? delta < 0 : delta > 0
                const color    = positive ? '#22C55E' : '#FF4D4D'
                return (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1" style={{ color, background: `${color}18` }}>
                    {delta > 0 ? '↑' : '↓'}{Math.abs(delta).toFixed(1)}%
                  </span>
                )
              }
              return [
                {
                  label: 'Investido 30d', value: fmt(data.totals.spend), color: '#F0B429',
                  delta: prev?.spendDelta, invertColor: false,
                  sub: data.totals.activeCampaigns > 0 ? `${data.totals.activeCampaigns} ativa${data.totals.activeCampaigns !== 1 ? 's' : ''}` : undefined,
                },
                {
                  label: 'Leads', value: data.totals.leads > 0 ? String(data.totals.leads) : '—', color: '#38BDF8',
                  delta: prev?.leadsDelta, invertColor: false,
                  sub: data.totals.cpl > 0 ? `CPL: R$${data.totals.cpl}` : undefined,
                },
                {
                  label: 'ROAS', value: data.totals.roas > 0 ? `${data.totals.roas}×` : '—', color: '#22C55E',
                  delta: null, invertColor: false,
                  sub: data.totals.revenue > 0 ? `Receita: ${fmt(data.totals.revenue)}` : undefined,
                },
                {
                  label: 'CTR Médio',
                  value: `${data.totals.avgCTR}%`,
                  color: data.totals.avgCTR < 0.5 ? '#FF4D4D' : data.totals.avgCTR >= 1.5 ? '#22C55E' : '#F0B429',
                  delta: null, invertColor: false,
                  sub: `Freq: ${data.totals.avgFrequency}×`,
                },
              ].map((kpi) => (
                <div key={kpi.label} className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5 flex flex-col justify-between">
                  <div className="text-[10px] text-slate-600 uppercase tracking-wider">{kpi.label}</div>
                  <div className="flex items-end gap-1 mt-2">
                    <div className="font-display text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
                    <DeltaBadge delta={kpi.delta} invertColor={kpi.invertColor} />
                  </div>
                  {kpi.sub && <div className="text-[10px] text-slate-600 mt-1">{kpi.sub}</div>}
                </div>
              ))
            })()}
          </div>

          {/* Pixel + Aprendizado + Objetivo */}
          <div className="grid md:grid-cols-3 gap-4">
            <PixelCard pixel={data.pixel ?? null} />

            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
              <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2">
                <span>🧠</span> Fase de Aprendizado
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Estáveis',   count: data.campaigns.filter(c => c.learningPhase === 'stable').length,          color: '#22C55E' },
                  { label: 'Aprendendo', count: data.campaigns.filter(c => c.learningPhase === 'learning').length,         color: '#38BDF8' },
                  { label: 'Limitado',   count: data.campaigns.filter(c => c.learningPhase === 'learning_limited').length, color: '#FB923C' },
                ].map(s => (
                  <div key={s.label} className="bg-[#16161A] rounded-xl px-3 py-2.5 text-center">
                    <div className="font-display text-2xl font-bold" style={{ color: s.color }}>{s.count}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#38BDF8] flex-shrink-0" />
                  <span>Em Aprendizado: evite editar para não reiniciar o ciclo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FB923C] flex-shrink-0" />
                  <span>Limitado: aumente orçamento ou amplie a audiência</span>
                </div>
              </div>
            </div>

            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
              <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2">
                <span>📊</span> Distribuição por Objetivo
              </h3>
              <div className="space-y-2.5">
                {Object.entries(data.byObjective).map(([key, g]) => {
                  const pct = data.totals.spend > 0 ? (g.totalSpend / data.totals.spend) * 100 : 0
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-400 truncate max-w-[160px]">{g.label}</span>
                        <span className="text-slate-300 font-semibold">{fmt(g.totalSpend)}</span>
                      </div>
                      <div className="h-1.5 bg-[#1E1E24] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #1877F2, #38BDF8)' }} />
                      </div>
                    </div>
                  )
                })}
                {Object.keys(data.byObjective).length === 0 && (
                  <div className="text-xs text-slate-600">Nenhum dado disponível.</div>
                )}
              </div>
            </div>
          </div>

          {/* Recomendações globais */}
          {data.globalRecs.length > 0 && (
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
              <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2">
                <span>⚡</span> Recomendações Prioritárias
              </h3>
              <div className="space-y-3">
                {data.globalRecs.map((rec, i) => <RecCard key={i} rec={rec} index={i} />)}
              </div>
            </div>
          )}

          {/* Performance por Objetivo */}
          {Object.keys(data.byObjective).length > 0 && (
            <div>
              <h3 className="font-display font-bold text-white mb-3 flex items-center gap-2">
                <span>🎯</span> Performance por Objetivo
              </h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(data.byObjective).map(([key, g]) => (
                  <ObjectiveCard key={key} objective={key} group={g} />
                ))}
              </div>
            </div>
          )}

          {/* Ad Sets */}
          {(data.adSets?.length ?? 0) > 0 && <AdSetsPanel adSets={data.adSets} />}

          {/* Criativos */}
          {(data.ads?.length ?? 0) > 0 && <CreativesRanking ads={data.ads} />}

          {/* Geo + Platform + Demo */}
          <div className="grid md:grid-cols-2 gap-4">
            {(data.geoBreakdown?.length ?? 0) > 0 && (
              <div className="md:col-span-2">
                <GeoTable geo={data.geoBreakdown} />
              </div>
            )}
            {(data.platformBreakdown?.length ?? 0) > 0 && <PlatformPanel platforms={data.platformBreakdown} />}
            {(data.demoBreakdown?.length ?? 0) > 0 && <DemoPanel demo={data.demoBreakdown} />}
          </div>

          {/* Tabela de campanhas */}
          {data.campaigns.length > 0 && (() => {
            const filtered = data.campaigns
              .filter(c => {
                if (statusFilter === 'active')  return c.status === 'ACTIVE' && c.spend30 > 0
                if (statusFilter === 'paused')  return c.status !== 'ACTIVE' || c.spend30 === 0
                if (statusFilter === 'issues')  return c.issues.length > 0
                return true
              })
              .sort((a, b) => b.spend30 - a.spend30)

            const countActive = data.campaigns.filter(c => c.status === 'ACTIVE' && c.spend30 > 0).length
            const countPaused = data.campaigns.filter(c => c.status !== 'ACTIVE' || c.spend30 === 0).length
            const countIssues = data.campaigns.filter(c => c.issues.length > 0).length

            return (
              <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#2A2A30]">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <h3 className="font-display font-bold text-white flex items-center gap-2">
                      <span>📋</span> Campanhas
                    </h3>
                    <span className="text-xs text-slate-500">{filtered.length} de {data.campaigns.length} campanhas</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {([
                      { key: 'all',    label: `Todas (${data.campaigns.length})`, color: '#64748B' },
                      { key: 'active', label: `Ativas (${countActive})`,          color: '#22C55E' },
                      { key: 'paused', label: `Pausadas (${countPaused})`,        color: '#94A3B8' },
                      { key: 'issues', label: `Problemas (${countIssues})`,       color: '#FF4D4D' },
                    ] as { key: StatusFilter; label: string; color: string }[]).map(f => (
                      <button key={f.key} onClick={() => setStatusFilter(f.key)}
                        className="text-[11px] font-semibold px-3 py-1 rounded-full transition-all"
                        style={{
                          color:      statusFilter === f.key ? '#0D0D10' : f.color,
                          background: statusFilter === f.key ? f.color : `${f.color}12`,
                          border:     `1px solid ${f.color}40`,
                        }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  {filtered.length > 0
                    ? filtered.map(c => <CampaignRow key={c.id} campaign={c} freqLimit={data.freqThreshold ?? 4} />)
                    : <div className="px-5 py-8 text-center text-sm text-slate-600">Nenhuma campanha neste filtro.</div>
                  }
                </div>
              </div>
            )
          })()}

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
