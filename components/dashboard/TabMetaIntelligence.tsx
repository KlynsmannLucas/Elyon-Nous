// components/dashboard/TabMetaIntelligence.tsx — Ads Manager Professional UI
'use client'

import { useViewMode } from '@/lib/viewMode'
import { useState, useEffect, useMemo, useRef } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, LabelList, ComposedChart, Line,
} from 'recharts'
import { useAppStore } from '@/lib/store'

// ── Types ──────────────────────────────────────────────────────────────────
type LearningPhase = 'learning' | 'learning_limited' | 'stable' | 'inactive'
type RecType = 'critical' | 'warning' | 'opportunity'
type InnerTab = 'overview' | 'campaigns' | 'adsets' | 'ads' | 'creatives' | 'problems' | 'opportunities'
type SortDir = 'asc' | 'desc'

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
  isActive: boolean; events: string[]
}

interface GeoBreakdown {
  region: string; spend: number; leads: number; cpl: number; impressions: number
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
  ctrDelta?: number | null; freqDelta?: number | null
  cpcDelta?: number | null; cpmDelta?: number | null; roasDelta?: number | null
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

interface TrackingCheckItem {
  id: string; name: string; description: string
  status: 'ok' | 'warning' | 'error' | 'not_checked'
  detail: string | null; actionRequired: string | null
}
interface TrackingAudit {
  overallStatus: 'ok' | 'warning' | 'error' | 'not_checked'
  checks: TrackingCheckItem[]
  summary: string
}

type DetectedProblem = {
  severity: 'critical' | 'warning'
  entityType: 'campaign' | 'adset' | 'creative'
  entityName: string
  issue: string
  action: string
}

type DetectedOpportunity = {
  entityType: 'campaign' | 'creative' | 'geo' | 'adset'
  entityName: string
  title: string
  action: string
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1_000_000) return `R$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `R$${(n / 1000).toFixed(1)}k`
  return `R$${n.toFixed(0)}`
}

function scoreColor(score: number) {
  if (score >= 80) return '#22C55E'
  if (score >= 65) return '#F0B429'
  if (score >= 50) return '#FB923C'
  return '#FF4D4D'
}

function computeHealthScore(c: Campaign, freqLimit: number): number {
  let score = 100
  if (c.learningPhase === 'learning_limited') score -= 20
  if (c.learningPhase === 'learning') score -= 5
  if (c.ctr30 < 0.5 && c.impressions > 500) score -= 25
  if (c.frequency > freqLimit + 2) score -= 25
  else if (c.frequency > freqLimit) score -= 10
  if (c.spend30 > 100 && c.leads30 === 0 && c.purchases30 === 0 && c.messages30 === 0) score -= 30
  score -= c.issues.length * 5
  return Math.max(0, Math.min(100, score))
}

function computeWastedSpend(campaigns: Campaign[]): number {
  return campaigns.filter(c => c.spend30 > 50 && c.leads30 === 0 && c.purchases30 === 0 && c.messages30 === 0).reduce((s, c) => s + c.spend30, 0)
}

function sortData<T extends Record<string, any>>(arr: T[], key: string, dir: SortDir): T[] {
  return [...arr].sort((a, b) => {
    const av = a[key]; const bv = b[key]
    if (typeof av === 'number' && typeof bv === 'number') return dir === 'asc' ? av - bv : bv - av
    return dir === 'asc' ? String(av ?? '').localeCompare(String(bv ?? '')) : String(bv ?? '').localeCompare(String(av ?? ''))
  })
}

function detectProblems(campaigns: Campaign[], adSets: AdSet[], ads: AdCreative[], freqLimit: number): DetectedProblem[] {
  const out: DetectedProblem[] = []
  for (const c of campaigns) {
    if (c.learningPhase === 'learning_limited')
      out.push({ severity: 'warning', entityType: 'campaign', entityName: c.name, issue: 'Aprendizado Limitado', action: 'Aumente o orçamento diário ou amplie a audiência para sair do aprendizado limitado.' })
    if (c.frequency > freqLimit + 2 && c.impressions > 500)
      out.push({ severity: 'critical', entityType: 'campaign', entityName: c.name, issue: `Frequência crítica (${c.frequency}×)`, action: 'Renove os criativos ou expanda a audiência para reduzir a fadiga de anúncio.' })
    if (c.ctr30 < 0.5 && c.impressions > 2000 && c.status === 'ACTIVE')
      out.push({ severity: 'warning', entityType: 'campaign', entityName: c.name, issue: `CTR baixo (${c.ctr30}%)`, action: 'Teste novos criativos ou revise a segmentação do público.' })
    if (c.spend30 > 100 && c.leads30 === 0 && c.purchases30 === 0 && c.messages30 === 0)
      out.push({ severity: 'critical', entityType: 'campaign', entityName: c.name, issue: `${fmt(c.spend30)} gastos sem conversões`, action: 'Verifique o pixel, a landing page e a segmentação. Considere pausar e revisar.' })
    for (const issue of c.issues)
      out.push({ severity: 'warning', entityType: 'campaign', entityName: c.name, issue, action: 'Verifique as configurações da campanha.' })
  }
  for (const as of adSets)
    for (const issue of as.issues)
      out.push({ severity: 'warning', entityType: 'adset', entityName: as.name, issue, action: 'Verifique as configurações do Ad Set.' })
  for (const ad of ads)
    if (ad.tag === 'waste' && ad.spend > 50)
      out.push({ severity: 'warning', entityType: 'creative', entityName: ad.name, issue: `CPL elevado (R$${ad.cpl})`, action: 'Criativo com baixo retorno. Considere pausar e testar novas variações.' })
  return out
}

function detectOpportunities(campaigns: Campaign[], ads: AdCreative[], geo: GeoBreakdown[]): DetectedOpportunity[] {
  const out: DetectedOpportunity[] = []
  const winners = campaigns.filter(c => c.learningPhase === 'stable' && c.leads30 > 0 && c.issues.length === 0 && c.status === 'ACTIVE')
  for (const c of winners.slice(0, 3))
    out.push({ entityType: 'campaign', entityName: c.name, title: 'Escalar campanha vencedora', action: `Esta campanha está estável com bom resultado. Aumente o orçamento em 20–30% para escalar os resultados.` })
  const winnerAds = ads.filter(a => a.tag === 'winner')
  for (const ad of winnerAds.slice(0, 3))
    out.push({ entityType: 'creative', entityName: ad.name, title: 'Criativo vencedor — replicar', action: `Este criativo está acima da média (CPL R$${ad.cpl}). Use como referência para novos anúncios.` })
  const bestGeo = geo.filter(g => g.leads > 0).sort((a, b) => a.cpl - b.cpl)[0]
  if (bestGeo)
    out.push({ entityType: 'geo', entityName: bestGeo.region, title: 'Melhor região — concentrar verba', action: `${bestGeo.region} tem CPL R$${bestGeo.cpl}, o melhor da conta. Considere aumentar verba nessa região.` })
  const lowFreq = campaigns.filter(c => c.frequency < 1.5 && c.spend30 > 50 && c.status === 'ACTIVE')
  for (const c of lowFreq.slice(0, 2))
    out.push({ entityType: 'campaign', entityName: c.name, title: 'Frequência baixa — ampliar alcance', action: `Frequência de ${c.frequency}× indica que a audiência ainda não foi saturada. Há espaço para aumentar o alcance.` })
  return out
}

// ── Badge Components ─────────────────────────────────────────────────────────
function HealthBadge({ score }: { score: number }) {
  const c = scoreColor(score)
  const label = score >= 80 ? 'Saudável' : score >= 65 ? 'Atenção' : score >= 50 ? 'Problema' : 'Crítico'
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums"
      style={{ color: c, background: `${c}18`, border: `1px solid ${c}30` }}>
      {score} {label}
    </span>
  )
}

function StatusBadge({ campaign, freqLimit }: { campaign: Campaign; freqLimit: number }) {
  const isActive = campaign.status === 'ACTIVE' && campaign.spend30 > 0
  if (!isActive) return <Chip color="#64748B" label="Pausada" />
  if (campaign.learningPhase === 'learning_limited') return <Chip color="#FB923C" label="Aprendizado Limitado" />
  if (campaign.learningPhase === 'learning') return <Chip color="#38BDF8" label="Em Aprendizado" />
  const score = computeHealthScore(campaign, freqLimit)
  if (score >= 80 && campaign.issues.length === 0) return <Chip color="#22C55E" label="Vencedora" />
  if (score < 50 || campaign.issues.length >= 2) return <Chip color="#FF4D4D" label="Problema Crítico" />
  if (score < 65 || campaign.issues.length > 0) return <Chip color="#F0B429" label="Atenção" />
  return <Chip color="#22C55E" label="Ativa" />
}

function Chip({ color, label }: { color: string; label: string }) {
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}>
      {label}
    </span>
  )
}

function AgeBadge({ age, days }: { age: Campaign['age']; days: number }) {
  const map = {
    new: { label: 'Nova', color: '#38BDF8' },
    growing: { label: 'Crescendo', color: '#A78BFA' },
    established: { label: 'Madura', color: '#22C55E' },
    veteran: { label: 'Veterana', color: '#F0B429' },
  }
  const s = map[age]
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      title={`${days >= 0 ? days + ' dias' : ''}`}
      style={{ color: s.color, background: `${s.color}12`, border: `1px solid ${s.color}25` }}>
      {s.label}{days >= 0 ? ` (${days}d)` : ''}
    </span>
  )
}

function DeltaBadge({ delta, invertColor }: { delta: number | null | undefined; invertColor?: boolean }) {
  if (delta == null) return null
  const positive = invertColor ? delta < 0 : delta > 0
  const color = positive ? '#22C55E' : '#FF4D4D'
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
      style={{ color, background: `${color}18` }}>
      {delta > 0 ? '↑' : '↓'}{Math.abs(delta).toFixed(1)}%
    </span>
  )
}

// ── InnerTabBar ───────────────────────────────────────────────────────────────
const INNER_TABS: { key: InnerTab; label: string; icon: string; tooltip: string }[] = [
  { key: 'overview',       label: 'Visão Geral',      icon: '📊', tooltip: 'Resumo geral da conta: pixel, aprendizado, objetivos e gráficos' },
  { key: 'campaigns',      label: 'Campanhas',        icon: '📋', tooltip: 'Tabela de campanhas com métricas, ordenação e filtros avançados' },
  { key: 'adsets',         label: 'Ad Sets',          icon: '📦', tooltip: 'Conjuntos de anúncios com públicos, orçamento e performance' },
  { key: 'ads',            label: 'Anúncios',         icon: '🖼️', tooltip: 'Lista de anúncios ativos com tag de performance' },
  { key: 'creatives',      label: 'Creative Intel',   icon: '🎨', tooltip: 'Ranking de criativos: vencedores, fadigados e em aprendizado' },
  { key: 'problems',       label: 'Ações Prioritárias', icon: '🚨', tooltip: 'Problemas detectados automaticamente que precisam de atenção' },
  { key: 'opportunities',  label: 'Oportunidades',    icon: '💡', tooltip: 'Oportunidades de escala e otimização detectadas pela IA' },
]

function InnerTabBar({ active, onChange, counts }: {
  active: InnerTab; onChange: (t: InnerTab) => void
  counts: Partial<Record<InnerTab, number>>
}) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
      {INNER_TABS.map(t => {
        const isActive = t.key === active
        const count = counts[t.key]
        const isProblems = t.key === 'problems'
        return (
          <button key={t.key} onClick={() => onChange(t.key)} title={t.tooltip}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0"
            style={{
              background: isActive ? 'rgba(24,119,242,0.15)' : 'rgba(255,255,255,0.03)',
              color: isActive ? '#60A5FA' : '#64748B',
              border: `1px solid ${isActive ? 'rgba(24,119,242,0.35)' : 'rgba(255,255,255,0.06)'}`,
            }}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
            {count != null && count > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                style={{
                  background: (isProblems && count > 0) ? 'rgba(255,77,77,0.2)' : 'rgba(255,255,255,0.1)',
                  color: (isProblems && count > 0) ? '#FF4D4D' : '#94A3B8',
                }}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── SortableHeader ────────────────────────────────────────────────────────────
const METRIC_TOOLTIPS: Record<string, string> = {
  spend30: 'Valor total investido nos últimos 30 dias',
  leads30: 'Leads gerados nos últimos 30 dias',
  cpl30: 'Custo Por Lead: quanto você paga por cada lead gerado',
  ctr30: 'Click-Through Rate: % de pessoas que clicaram no anúncio ao vê-lo',
  cpc30: 'Custo Por Clique: valor médio pago por cada clique',
  cpm30: 'Custo Por Mil Impressões: quanto custa exibir o anúncio 1.000 vezes',
  frequency: 'Frequência: quantas vezes em média cada pessoa viu o anúncio',
  roas30: 'Return on Ad Spend: retorno em receita para cada R$1 investido',
  impressions: 'Total de vezes que o anúncio foi exibido',
  reach: 'Número de pessoas únicas que viram o anúncio',
  _score: 'Health Score: pontuação de saúde calculada automaticamente (0–100)',
}

function SortableHeader({ label, sortKey, activeKey, dir, onSort, right }: {
  label: string; sortKey: string; activeKey: string; dir: SortDir
  onSort: (key: string) => void; right?: boolean
}) {
  const isActive = sortKey === activeKey
  const tooltip = METRIC_TOOLTIPS[sortKey]
  return (
    <th onClick={() => onSort(sortKey)} title={tooltip}
      className={`px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide cursor-pointer select-none whitespace-nowrap hover:text-slate-300 transition-colors ${right ? 'text-right' : 'text-left'} ${tooltip ? 'border-b border-dotted border-slate-700' : ''}`}
      style={{ color: isActive ? '#60A5FA' : '#475569' }}>
      {label}{isActive ? (dir === 'desc' ? ' ↓' : ' ↑') : ''}
    </th>
  )
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ spend30, spend7, height = 28 }: { spend30: number; spend7: number; height?: number }) {
  const dailyRecent = spend7 / 7
  const dailyOlder  = spend30 > spend7 ? (spend30 - spend7) / 23 : dailyRecent * 0.7
  const bars = [
    dailyOlder * 0.85, dailyOlder * 1.1, dailyOlder * 0.9, dailyOlder,
    dailyRecent * 0.9, dailyRecent * 1.05, dailyRecent,
  ]
  const max = Math.max(...bars, 1)
  const trend = dailyRecent > dailyOlder * 1.05 ? '#22C55E' : dailyRecent < dailyOlder * 0.9 ? '#FF4D4D' : '#F0B429'
  return (
    <svg width={56} height={height} viewBox={`0 0 56 ${height}`} style={{ display: 'block' }}>
      {bars.map((v, i) => {
        const barH = Math.max(2, (v / max) * (height - 4))
        const x = i * 8 + 1
        return <rect key={i} x={x} y={height - barH - 2} width={6} height={barH} rx={1.5}
          fill={i >= 4 ? trend : 'rgba(100,116,139,0.35)'}
        />
      })}
    </svg>
  )
}

// ── ColumnSelector ─────────────────────────────────────────────────────────────
type ColKey = 'status' | 'spend' | 'leads' | 'cpl' | 'ctr' | 'freq' | 'cpc' | 'cpm' | 'impressions' | 'roas' | 'score' | 'trend'

const ALL_COLS: { key: ColKey; label: string }[] = [
  { key: 'status',      label: 'Status' },
  { key: 'spend',       label: 'Gasto' },
  { key: 'leads',       label: 'Leads' },
  { key: 'cpl',         label: 'CPL' },
  { key: 'ctr',         label: 'CTR' },
  { key: 'freq',        label: 'Freq' },
  { key: 'cpc',         label: 'CPC' },
  { key: 'cpm',         label: 'CPM' },
  { key: 'impressions', label: 'Impressões' },
  { key: 'roas',        label: 'ROAS' },
  { key: 'score',       label: 'Score' },
  { key: 'trend',       label: 'Tendência' },
]

const DEFAULT_COLS = new Set<ColKey>(['status', 'spend', 'leads', 'cpl', 'ctr', 'freq', 'roas', 'score', 'trend'])

function ColumnSelector({ visible, onChange }: { visible: Set<ColKey>; onChange: (s: Set<ColKey>) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])
  const toggle = (k: ColKey) => {
    const next = new Set(visible)
    if (next.has(k)) { if (next.size > 3) next.delete(k) } else next.add(k)
    onChange(next)
  }
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '7px',
          background: open ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${open ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.08)'}`,
          color: open ? '#A78BFA' : '#64748B', cursor: 'pointer',
        }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        Colunas
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 9999,
          background: '#0F1629', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px', padding: '10px', minWidth: '180px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
        }}>
          <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', padding: '0 4px' }}>
            Colunas visíveis
          </div>
          {ALL_COLS.map(col => (
            <button key={col.key} onClick={() => toggle(col.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                width: '100%', padding: '6px 8px', borderRadius: '6px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: visible.has(col.key) ? '#F1F5F9' : '#475569',
                fontSize: '12px', textAlign: 'left', transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{
                width: '14px', height: '14px', borderRadius: '3px', flexShrink: 0,
                background: visible.has(col.key) ? '#7C3AED' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${visible.has(col.key) ? '#7C3AED' : 'rgba(255,255,255,0.12)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {visible.has(col.key) && <span style={{ color: '#fff', fontSize: '9px', fontWeight: 700 }}>✓</span>}
              </span>
              {col.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── FilterBar ─────────────────────────────────────────────────────────────────
function FilterBar({ search, onSearch, status, onStatus, objectives, objective, onObjective, performance, onPerformance, freqFilter, onFreqFilter }: {
  search: string; onSearch: (v: string) => void
  status: string; onStatus: (v: string) => void
  objectives?: string[]; objective: string; onObjective: (v: string) => void
  performance?: string; onPerformance?: (v: string) => void
  freqFilter?: string; onFreqFilter?: (v: string) => void
}) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const hasAdvancedFilter = (performance && performance !== 'all') || (freqFilter && freqFilter !== 'all')

  return (
    <div style={{ borderBottom: '1px solid #1E1E24' }}>
      {/* Linha principal */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', padding: '10px 12px' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '160px', maxWidth: '240px' }}>
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#475569', fontSize: '12px' }}>🔍</span>
          <input
            value={search} onChange={e => onSearch(e.target.value)}
            placeholder="Buscar..."
            style={{
              width: '100%', paddingLeft: '28px', paddingRight: '10px', paddingTop: '6px', paddingBottom: '6px',
              fontSize: '12px', background: '#16161A', border: '1px solid #2A2A30', borderRadius: '8px',
              color: '#CBD5E1', outline: 'none',
            }}
          />
        </div>
        {(['all', 'active', 'paused', 'issues'] as const).map(s => {
          const labels = { all: 'Todos', active: 'Ativos', paused: 'Pausados', issues: 'Problemas' }
          const colors = { all: '#64748B', active: '#22C55E', paused: '#94A3B8', issues: '#FF4D4D' }
          const isActive = status === s
          return (
            <button key={s} onClick={() => onStatus(s)}
              style={{
                fontSize: '11px', fontWeight: 600, padding: '5px 12px', borderRadius: '8px',
                color: isActive ? '#0D0D10' : colors[s],
                background: isActive ? colors[s] : `${colors[s]}12`,
                border: `1px solid ${colors[s]}35`, cursor: 'pointer',
              }}>
              {labels[s]}
            </button>
          )
        })}
        {objectives && objectives.length > 1 && (
          <select value={objective} onChange={e => onObjective(e.target.value)}
            style={{ fontSize: '12px', background: '#16161A', border: '1px solid #2A2A30', borderRadius: '8px', padding: '5px 8px', color: '#94A3B8', outline: 'none' }}>
            <option value="">Todos os objetivos</option>
            {objectives.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        )}
        {onPerformance && (
          <button onClick={() => setShowAdvanced(v => !v)}
            style={{
              fontSize: '11px', fontWeight: 600, padding: '5px 10px', borderRadius: '8px',
              color: hasAdvancedFilter ? '#A78BFA' : '#64748B',
              background: hasAdvancedFilter ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${hasAdvancedFilter ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.08)'}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
            }}>
            {hasAdvancedFilter ? '● ' : ''}Filtros {showAdvanced ? '▲' : '▼'}
          </button>
        )}
      </div>

      {/* Filtros avançados */}
      {showAdvanced && onPerformance && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '8px 12px 10px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid #1E1E24' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Performance:</span>
            {([
              { k: 'all', label: 'Todos' },
              { k: 'winning', label: '🏆 Vencedoras' },
              { k: 'learning', label: '📚 Aprendendo' },
              { k: 'declining', label: '📉 Problemas' },
              { k: 'saturated', label: '🔥 Saturadas' },
            ] as const).map(({ k, label }) => (
              <button key={k} onClick={() => onPerformance(k)}
                style={{
                  fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px',
                  color: performance === k ? '#0D0D10' : '#64748B',
                  background: performance === k ? '#A78BFA' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${performance === k ? '#A78BFA' : 'rgba(255,255,255,0.08)'}`,
                  cursor: 'pointer',
                }}>
                {label}
              </button>
            ))}
          </div>
          {onFreqFilter && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '10px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Frequência:</span>
              {([
                { k: 'all', label: 'Todas' },
                { k: 'normal', label: '✅ Normal' },
                { k: 'high', label: '⚠️ Alta' },
                { k: 'critical', label: '🚨 Crítica' },
              ] as const).map(({ k, label }) => (
                <button key={k} onClick={() => onFreqFilter(k)}
                  style={{
                    fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px',
                    color: freqFilter === k ? '#0D0D10' : '#64748B',
                    background: freqFilter === k ? '#FB923C' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${freqFilter === k ? '#FB923C' : 'rgba(255,255,255,0.08)'}`,
                    cursor: 'pointer',
                  }}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── EntityDrawer ──────────────────────────────────────────────────────────────
type DrawerEntity =
  | { type: 'campaign'; data: Campaign }
  | { type: 'adset'; data: AdSet }
  | { type: 'ad'; data: AdCreative }

function EntityDrawer({ entity, onClose, freqLimit }: { entity: DrawerEntity | null; onClose: () => void; freqLimit: number }) {
  if (!entity) return null
  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-[440px] bg-[#0D0D10] border-l border-[#2A2A30] z-50 overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A30] sticky top-0 bg-[#0D0D10]">
          <div className="text-xs text-slate-500 uppercase tracking-wider">
            {entity.type === 'campaign' ? '📋 Campanha' : entity.type === 'adset' ? '📦 Ad Set' : '🖼️ Anúncio'}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-lg leading-none">×</button>
        </div>
        <div className="p-5 space-y-4">
          {entity.type === 'campaign' && <CampaignDrawerContent campaign={entity.data} freqLimit={freqLimit} />}
          {entity.type === 'adset' && <AdSetDrawerContent adset={entity.data} />}
          {entity.type === 'ad' && <AdDrawerContent ad={entity.data} />}
        </div>
      </div>
    </>
  )
}

function StatCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-xl p-3 text-center">
      <div className="text-[10px] text-slate-600 uppercase mb-1">{label}</div>
      <div className="text-sm font-bold" style={{ color: color || '#CBD5E1' }}>{value}</div>
    </div>
  )
}

function QuickActions({ name }: { name: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard.writeText(name).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }) }
  return (
    <div className="flex flex-wrap gap-2 pt-2 border-t border-[#2A2A30]">
      <div className="text-[10px] text-slate-600 uppercase font-semibold w-full mb-1">Ações rápidas</div>
      <button onClick={copy} className="text-[11px] px-3 py-1.5 rounded-lg bg-[#16161A] border border-[#2A2A30] text-slate-400 hover:text-white hover:border-slate-500 transition-colors">
        {copied ? '✅ Copiado!' : '📋 Copiar nome'}
      </button>
      <button onClick={() => window.print()} className="text-[11px] px-3 py-1.5 rounded-lg bg-[#16161A] border border-[#2A2A30] text-slate-400 hover:text-white hover:border-slate-500 transition-colors">
        📤 Exportar
      </button>
    </div>
  )
}

function CampaignDrawerContent({ campaign: c, freqLimit }: { campaign: Campaign; freqLimit: number }) {
  const score = computeHealthScore(c, freqLimit)
  return (
    <>
      <div>
        <h3 className="font-bold text-white text-base leading-snug mb-2">{c.name}</h3>
        <div className="flex flex-wrap gap-2">
          <StatusBadge campaign={c} freqLimit={freqLimit} />
          <AgeBadge age={c.age ?? 'established'} days={c.ageDays ?? -1} />
          <HealthBadge score={score} />
        </div>
      </div>
      <div className="text-xs text-slate-500">Objetivo: <span className="text-slate-300 font-semibold">{c.objectiveLabel}</span></div>
      <div className="grid grid-cols-3 gap-2">
        <StatCell label="Investido" value={fmt(c.spend30)} color="#F0B429" />
        <StatCell label="Leads" value={c.leads30 > 0 ? String(c.leads30) : '—'} color="#38BDF8" />
        <StatCell label="CPL" value={c.cpl30 > 0 ? `R$${c.cpl30}` : '—'} />
        <StatCell label="CTR" value={`${c.ctr30}%`} color={c.ctr30 < 0.5 ? '#FF4D4D' : '#22C55E'} />
        <StatCell label="Frequência" value={`${c.frequency}×`} color={c.frequency > freqLimit ? '#FB923C' : '#CBD5E1'} />
        <StatCell label="ROAS" value={c.roas30 > 0 ? `${c.roas30}×` : '—'} color="#22C55E" />
        <StatCell label="CPC" value={`R$${c.cpc30}`} />
        <StatCell label="CPM" value={`R$${c.cpm30}`} />
        <StatCell label="Alcance" value={c.reach > 0 ? c.reach.toLocaleString('pt-BR') : '—'} />
      </div>
      {c.issues.length > 0 && (
        <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-4 space-y-1.5">
          <div className="text-[10px] text-red-400 uppercase font-semibold mb-2">Problemas detectados</div>
          {c.issues.map((issue, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-red-300">
              <span className="text-red-500 mt-0.5">●</span>{issue}
            </div>
          ))}
        </div>
      )}
      {c.recommendations.length > 0 && (
        <div className="bg-[#111114] border border-[#2A2A30] rounded-xl p-4 space-y-2">
          <div className="text-[10px] text-slate-500 uppercase font-semibold mb-2">Ações recomendadas</div>
          {c.recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
              <span className="text-[#F0B429] mt-0.5 flex-shrink-0">→</span>{rec}
            </div>
          ))}
        </div>
      )}
      <QuickActions name={c.name} />
    </>
  )
}

function AdSetDrawerContent({ adset: as }: { adset: AdSet }) {
  return (
    <>
      <div>
        <h3 className="font-bold text-white text-base leading-snug mb-2">{as.name}</h3>
        <div className="flex flex-wrap gap-2">
          {as.hasRemarketing && <Chip color="#A78BFA" label="Remarketing" />}
          {as.issues.length > 0 && <Chip color="#FF4D4D" label={`${as.issues.length} problema(s)`} />}
        </div>
      </div>
      <div className="text-xs text-slate-500">
        Campanha: <span className="text-slate-300 font-semibold">{as.campaignName}</span>
      </div>
      <div className="text-xs text-slate-500">
        Objetivo: <span className="text-slate-300 font-semibold">{as.optimizationGoalLabel}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <StatCell label="Gasto" value={as.spend > 0 ? fmt(as.spend) : '—'} color="#F0B429" />
        <StatCell label="Leads" value={as.leads > 0 ? String(as.leads) : '—'} color="#38BDF8" />
        <StatCell label="CPL" value={as.cpl > 0 ? `R$${as.cpl}` : '—'} />
        <StatCell label="CTR" value={as.ctr > 0 ? `${as.ctr}%` : '—'} color={as.ctr < 0.5 ? '#FF4D4D' : '#CBD5E1'} />
        <StatCell label="Frequência" value={`${as.frequency}×`} />
        <StatCell label="Orçamento" value={as.dailyBudget > 0 ? `${fmt(as.dailyBudget)}/dia` : as.lifetimeBudget > 0 ? fmt(as.lifetimeBudget) : '—'} />
      </div>
      {as.issues.length > 0 && (
        <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-4 space-y-1.5">
          <div className="text-[10px] text-red-400 uppercase font-semibold mb-2">Problemas</div>
          {as.issues.map((issue, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-red-300">
              <span className="text-red-500 mt-0.5">●</span>{issue}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function AdDrawerContent({ ad }: { ad: AdCreative }) {
  const tagConfig = {
    winner: { label: 'Vencedor', color: '#22C55E', icon: '🏆' },
    waste: { label: 'Pausar', color: '#FF4D4D', icon: '⛔' },
    learning: { label: 'Aprendendo', color: '#38BDF8', icon: '📚' },
    ok: { label: 'Neutro', color: '#64748B', icon: '✓' },
  }
  const t = tagConfig[ad.tag]
  return (
    <>
      <div>
        {ad.imageUrl && <img src={ad.imageUrl} alt="" className="w-full rounded-xl object-cover mb-3 max-h-48" />}
        <h3 className="font-bold text-white text-base leading-snug mb-2">{ad.name}</h3>
        <Chip color={t.color} label={`${t.icon} ${t.label}`} />
      </div>
      {ad.title && <div className="text-sm text-slate-300 font-semibold">"{ad.title}"</div>}
      {ad.body && <div className="text-xs text-slate-500 leading-relaxed">{ad.body}</div>}
      <div className="grid grid-cols-2 gap-2">
        <StatCell label="Gasto" value={ad.spend > 0 ? fmt(ad.spend) : '—'} color="#F0B429" />
        <StatCell label="Leads" value={ad.leads > 0 ? String(ad.leads) : '—'} color="#38BDF8" />
        <StatCell label="CPL" value={ad.cpl > 0 ? `R$${ad.cpl}` : '—'} />
        <StatCell label="CTR" value={ad.ctr > 0 ? `${ad.ctr}%` : '—'} color={ad.ctr < 0.5 ? '#FF4D4D' : '#CBD5E1'} />
        <StatCell label="Frequência" value={ad.frequency > 0 ? `${ad.frequency}×` : '—'} />
        <StatCell label="Impressões" value={ad.impressions > 0 ? ad.impressions.toLocaleString('pt-BR') : '—'} />
      </div>
    </>
  )
}

// ── Problems Panel ────────────────────────────────────────────────────────────
function ProblemsPanel({ problems }: { problems: DetectedProblem[] }) {
  if (problems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="font-bold text-white text-lg mb-2">Sem problemas críticos</h3>
        <p className="text-slate-500 text-sm">Nenhum problema crítico detectado nas campanhas, ad sets ou criativos.</p>
      </div>
    )
  }

  const critical = problems.filter(p => p.severity === 'critical')
  const warnings = problems.filter(p => p.severity === 'warning')

  return (
    <div className="space-y-3">
      {critical.length > 0 && (
        <div className="text-[10px] text-red-500 uppercase font-bold tracking-wider px-1">
          Críticos ({critical.length})
        </div>
      )}
      {critical.map((p, i) => <ProblemCard key={i} p={p} />)}
      {warnings.length > 0 && (
        <div className="text-[10px] text-[#F0B429] uppercase font-bold tracking-wider px-1 pt-2">
          Avisos ({warnings.length})
        </div>
      )}
      {warnings.map((p, i) => <ProblemCard key={i} p={p} />)}
    </div>
  )
}

function ProblemCard({ p }: { p: DetectedProblem }) {
  const color = p.severity === 'critical' ? '#FF4D4D' : '#F0B429'
  const icon = p.severity === 'critical' ? '🚨' : '⚠️'
  const entityIcon = { campaign: '📋', adset: '📦', creative: '🖼️' }[p.entityType]
  return (
    <div className="rounded-xl p-4" style={{ background: `${color}08`, border: `1px solid ${color}25` }}>
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0">{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-bold text-slate-500">{entityIcon} {p.entityType === 'campaign' ? 'Campanha' : p.entityType === 'adset' ? 'Ad Set' : 'Criativo'}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ color, background: `${color}18` }}>{p.issue}</span>
          </div>
          <div className="text-sm font-semibold text-white mb-1 truncate">{p.entityName}</div>
          {p.action && <div className="text-xs text-slate-400 leading-relaxed">{p.action}</div>}
        </div>
      </div>
    </div>
  )
}

// ── Opportunities Panel ───────────────────────────────────────────────────────
function OpportunitiesPanel({ opportunities }: { opportunities: DetectedOpportunity[] }) {
  if (opportunities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">📊</div>
        <h3 className="font-bold text-white text-lg mb-2">Analisando oportunidades</h3>
        <p className="text-slate-500 text-sm">Nenhuma oportunidade detectada automaticamente. Gere mais dados de campanhas.</p>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      <div className="text-[10px] text-[#22C55E] uppercase font-bold tracking-wider px-1">
        {opportunities.length} oportunidade{opportunities.length !== 1 ? 's' : ''} detectada{opportunities.length !== 1 ? 's' : ''}
      </div>
      {opportunities.map((o, i) => (
        <div key={i} className="rounded-xl p-4" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <div className="flex items-start gap-3">
            <span className="text-lg flex-shrink-0">💡</span>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold text-slate-500 mb-0.5">
                {{ campaign: '📋 Campanha', creative: '🎨 Criativo', geo: '🗺️ Região', adset: '📦 Ad Set' }[o.entityType]}
              </div>
              <div className="text-sm font-semibold text-white mb-0.5">{o.title}</div>
              <div className="text-[11px] text-[#22C55E] font-semibold mb-1">{o.entityName}</div>
              <div className="text-xs text-slate-400 leading-relaxed">{o.action}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── CampaignRowExpand ─────────────────────────────────────────────────────────
function CampaignRowExpand({ campaign: c, freqLimit, colSpan }: { campaign: Campaign; freqLimit: number; colSpan: number }) {
  const score = computeHealthScore(c, freqLimit)
  return (
    <tr style={{ background: 'rgba(24,119,242,0.04)', borderBottom: '1px solid rgba(24,119,242,0.12)' }}>
      <td colSpan={colSpan} style={{ padding: '0 16px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '16px', paddingTop: '12px' }}>
          {/* Sparkline */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '80px' }}>
            <div style={{ fontSize: '10px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tendência 7d</div>
            <Sparkline spend30={c.spend30} spend7={c.spend7} height={36} />
            <div style={{ fontSize: '10px', color: '#64748B' }}>
              {c.spend7 > 0 && c.spend30 > 0 && (() => {
                const dailyRecent = c.spend7 / 7
                const dailyOlder  = c.spend30 > c.spend7 ? (c.spend30 - c.spend7) / 23 : dailyRecent
                const pct = dailyOlder > 0 ? ((dailyRecent - dailyOlder) / dailyOlder * 100).toFixed(0) : null
                if (!pct) return null
                const up = +pct > 0
                return <span style={{ color: up ? '#22C55E' : '#FF4D4D', fontWeight: 700 }}>{up ? '↑' : '↓'}{Math.abs(+pct)}% vs mês</span>
              })()}
            </div>
          </div>

          {/* Métricas rápidas */}
          <div>
            <div style={{ fontSize: '10px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Resumo</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {[
                { label: 'ROAS', value: c.roas30 > 0 ? `${c.roas30}×` : '—', color: '#22C55E' },
                { label: 'CPC',  value: c.cpc30 > 0 ? `R$${c.cpc30}` : '—', color: '#A78BFA' },
                { label: 'CPM',  value: c.cpm30 > 0 ? `R$${c.cpm30}` : '—', color: '#38BDF8' },
                { label: 'Alcance', value: c.reach > 0 ? (c.reach >= 1000 ? `${(c.reach / 1000).toFixed(0)}k` : String(c.reach)) : '—', color: '#94A3B8' },
              ].map(m => (
                <div key={m.label} style={{ background: '#111114', borderRadius: '8px', padding: '6px 8px', border: '1px solid #2A2A30' }}>
                  <div style={{ fontSize: '9px', color: '#475569', textTransform: 'uppercase', fontWeight: 700 }}>{m.label}</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Problemas + recomendações */}
          <div>
            {c.issues.length > 0 ? (
              <>
                <div style={{ fontSize: '10px', color: '#FF4D4D', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Problemas</div>
                {c.issues.slice(0, 2).map((issue, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11px', color: '#FCA5A5', marginBottom: '3px' }}>
                    <span style={{ color: '#FF4D4D', flexShrink: 0 }}>●</span>{issue}
                  </div>
                ))}
              </>
            ) : c.recommendations.length > 0 ? (
              <>
                <div style={{ fontSize: '10px', color: '#22C55E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Recomendação</div>
                <div style={{ fontSize: '11px', color: '#86EFAC', lineHeight: 1.4 }}>{c.recommendations[0]}</div>
              </>
            ) : (
              <div style={{ fontSize: '11px', color: '#475569' }}>Score de saúde: <strong style={{ color: scoreColor(score) }}>{score}/100</strong></div>
            )}
          </div>
        </div>
      </td>
    </tr>
  )
}

// ── Campaigns Table ───────────────────────────────────────────────────────────
function CampaignsTable({ campaigns, freqLimit, onSelect, onDrillDown }: {
  campaigns: Campaign[]; freqLimit: number
  onSelect: (c: Campaign) => void
  onDrillDown?: (campaignId: string, campaignName: string) => void
}) {
  const [sort, setSort]             = useState<{ key: string; dir: SortDir }>({ key: 'spend30', dir: 'desc' })
  const [search, setSearch]         = useState('')
  const [status, setStatus]         = useState('all')
  const [objective, setObjective]   = useState('')
  const [performance, setPerf]      = useState('all')
  const [freqFilter, setFreqFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [visibleCols, setVisibleCols] = useState<Set<ColKey>>(new Set(DEFAULT_COLS))

  const objectives = useMemo(() => [...new Set(campaigns.map(c => c.objectiveLabel))], [campaigns])

  const filtered = useMemo(() => {
    let data = campaigns
    if (search)      data = data.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    if (status === 'active')  data = data.filter(c => c.status === 'ACTIVE' && c.spend30 > 0)
    if (status === 'paused')  data = data.filter(c => c.status !== 'ACTIVE' || c.spend30 === 0)
    if (status === 'issues')  data = data.filter(c => c.issues.length > 0)
    if (objective)            data = data.filter(c => c.objectiveLabel === objective)
    if (performance === 'winning')  data = data.filter(c => computeHealthScore(c, freqLimit) >= 80 && c.issues.length === 0)
    if (performance === 'learning') data = data.filter(c => c.learningPhase === 'learning' || c.learningPhase === 'learning_limited')
    if (performance === 'declining') data = data.filter(c => c.issues.length > 0 || computeHealthScore(c, freqLimit) < 50)
    if (performance === 'saturated') data = data.filter(c => c.frequency > freqLimit + 1)
    if (freqFilter === 'normal')   data = data.filter(c => c.frequency > 0 && c.frequency <= freqLimit)
    if (freqFilter === 'high')     data = data.filter(c => c.frequency > freqLimit && c.frequency <= freqLimit + 2)
    if (freqFilter === 'critical') data = data.filter(c => c.frequency > freqLimit + 2)
    return sortData(data, sort.key === '_score' ? 'spend30' : sort.key, sort.dir).map(c =>
      sort.key === '_score' ? c : c
    ).sort((a, b) => sort.key === '_score'
      ? sort.dir === 'desc'
        ? computeHealthScore(b, freqLimit) - computeHealthScore(a, freqLimit)
        : computeHealthScore(a, freqLimit) - computeHealthScore(b, freqLimit)
      : 0
    )
  }, [campaigns, search, status, objective, performance, freqFilter, sort, freqLimit])

  const toggleSort = (key: string) => setSort(s => s.key === key ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' })
  const ths = (label: string, key: string) => <SortableHeader label={label} sortKey={key} activeKey={sort.key} dir={sort.dir} onSort={toggleSort} right />

  const vis = visibleCols
  const totalCols = 3 + Array.from(vis).filter(k => k !== 'status' && k !== 'trend').length + (vis.has('status') ? 1 : 0) + (vis.has('trend') ? 1 : 0) + 1

  return (
    <div>
      <FilterBar
        search={search} onSearch={setSearch}
        status={status} onStatus={setStatus}
        objectives={objectives} objective={objective} onObjective={setObjective}
        performance={performance} onPerformance={setPerf}
        freqFilter={freqFilter} onFreqFilter={setFreqFilter}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 16px', borderBottom: '1px solid #1E1E24' }}>
        <span style={{ fontSize: '10px', color: '#475569' }}>{filtered.length} de {campaigns.length} campanhas</span>
        <ColumnSelector visible={visibleCols} onChange={setVisibleCols} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ minWidth: '800px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1E1E24' }}>
              <th style={{ padding: '8px 16px', textAlign: 'left', fontSize: '10px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', width: '24px' }}>#</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Nome</th>
              {vis.has('status') && <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Status</th>}
              {vis.has('spend')       && ths('Gasto', 'spend30')}
              {vis.has('leads')       && ths('Leads', 'leads30')}
              {vis.has('cpl')         && ths('CPL', 'cpl30')}
              {vis.has('ctr')         && ths('CTR', 'ctr30')}
              {vis.has('freq')        && ths('Freq', 'frequency')}
              {vis.has('cpc')         && ths('CPC', 'cpc30')}
              {vis.has('cpm')         && ths('CPM', 'cpm30')}
              {vis.has('impressions') && ths('Impressões', 'impressions')}
              {vis.has('roas')        && ths('ROAS', 'roas30')}
              {vis.has('score')       && ths('Score', '_score')}
              {vis.has('trend')       && <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>7d</th>}
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={totalCols} style={{ padding: '32px', textAlign: 'center', color: '#475569' }}>Nenhuma campanha encontrada.</td></tr>
            )}
            {filtered.map((c, i) => {
              const score   = computeHealthScore(c, freqLimit)
              const sc      = scoreColor(score)
              const isOpen  = expandedId === c.id
              return (
                <>
                  <tr key={c.id}
                    style={{ borderBottom: isOpen ? 'none' : '1px solid #1A1A20', background: isOpen ? 'rgba(24,119,242,0.06)' : 'transparent', cursor: 'pointer', transition: 'background 0.15s' }}
                    onClick={() => setExpandedId(isOpen ? null : c.id)}
                    onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = '#16161A' }}
                    onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent' }}>
                    <td style={{ padding: '10px 16px', color: '#475569' }}>{i + 1}</td>
                    <td style={{ padding: '10px 12px', maxWidth: '200px' }}>
                      <div style={{ fontWeight: 600, color: isOpen ? '#60A5FA' : '#F1F5F9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={c.name}>{c.name}</div>
                      <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>{c.objectiveLabel}</div>
                    </td>
                    {vis.has('status') && <td style={{ padding: '10px 12px' }} onClick={e => e.stopPropagation()}><StatusBadge campaign={c} freqLimit={freqLimit} /></td>}
                    {vis.has('spend')       && <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#F0B429', fontVariantNumeric: 'tabular-nums' }}>{c.spend30 > 0 ? fmt(c.spend30) : '—'}</td>}
                    {vis.has('leads')       && <td style={{ padding: '10px 12px', textAlign: 'right', color: '#38BDF8', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{c.leads30 > 0 ? c.leads30 : '—'}</td>}
                    {vis.has('cpl')         && <td style={{ padding: '10px 12px', textAlign: 'right', color: '#CBD5E1', fontVariantNumeric: 'tabular-nums' }}>{c.cpl30 > 0 ? `R$${c.cpl30}` : '—'}</td>}
                    {vis.has('ctr')         && <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}><span style={{ color: c.ctr30 < 0.5 && c.impressions > 500 ? '#F87171' : '#CBD5E1' }}>{c.ctr30}%</span></td>}
                    {vis.has('freq')        && <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}><span style={{ color: c.frequency > freqLimit ? '#FB923C' : '#CBD5E1' }}>{c.frequency > 0 ? `${c.frequency}×` : '—'}</span></td>}
                    {vis.has('cpc')         && <td style={{ padding: '10px 12px', textAlign: 'right', color: '#94A3B8', fontVariantNumeric: 'tabular-nums' }}>{c.cpc30 > 0 ? `R$${c.cpc30}` : '—'}</td>}
                    {vis.has('cpm')         && <td style={{ padding: '10px 12px', textAlign: 'right', color: '#94A3B8', fontVariantNumeric: 'tabular-nums' }}>{c.cpm30 > 0 ? `R$${c.cpm30}` : '—'}</td>}
                    {vis.has('impressions') && <td style={{ padding: '10px 12px', textAlign: 'right', color: '#94A3B8', fontVariantNumeric: 'tabular-nums' }}>{c.impressions > 0 ? c.impressions.toLocaleString('pt-BR') : '—'}</td>}
                    {vis.has('roas')        && <td style={{ padding: '10px 12px', textAlign: 'right', color: '#22C55E', fontVariantNumeric: 'tabular-nums' }}>{c.roas30 > 0 ? `${c.roas30}×` : '—'}</td>}
                    {vis.has('score')       && <td style={{ padding: '10px 12px', textAlign: 'right' }}><span style={{ fontSize: '12px', fontWeight: 700, color: sc }}>{score}</span></td>}
                    {vis.has('trend')       && <td style={{ padding: '10px 12px' }}><Sparkline spend30={c.spend30} spend7={c.spend7} /></td>}
                    <td style={{ padding: '10px 12px' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => onSelect(c)}
                          style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(24,119,242,0.15)', color: '#60A5FA', border: 'none', cursor: 'pointer' }}>
                          Detalhes
                        </button>
                        {onDrillDown && (
                          <button onClick={() => onDrillDown(c.id, c.name)}
                            style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#94A3B8', border: 'none', cursor: 'pointer' }}>
                            Ad Sets →
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isOpen && <CampaignRowExpand campaign={c} freqLimit={freqLimit} colSpan={totalCols} />}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Ad Sets Table ─────────────────────────────────────────────────────────────
function AdSetsTable({ adSets, onSelect }: { adSets: AdSet[]; onSelect: (a: AdSet) => void }) {
  const [sort, setSort] = useState<{ key: string; dir: SortDir }>({ key: 'spend', dir: 'desc' })
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')

  const filtered = useMemo(() => {
    let data = adSets
    if (search) data = data.filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
    if (status === 'active') data = data.filter(a => a.status === 'ACTIVE')
    if (status === 'paused') data = data.filter(a => a.status !== 'ACTIVE')
    if (status === 'issues') data = data.filter(a => a.issues.length > 0)
    return sortData(data, sort.key, sort.dir)
  }, [adSets, search, status, sort])

  const toggleSort = (key: string) => setSort(s => s.key === key ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' })
  const ths = (label: string, key: string) => <SortableHeader label={label} sortKey={key} activeKey={sort.key} dir={sort.dir} onSort={toggleSort} right />

  if (adSets.length === 0) return <div className="py-12 text-center text-slate-600 text-sm">Nenhum Ad Set disponível.</div>

  return (
    <div>
      <FilterBar search={search} onSearch={setSearch} status={status} onStatus={setStatus} objective="" onObjective={() => {}} />
      <div className="text-[10px] text-slate-600 px-4 py-2 border-b border-[#1E1E24]">{filtered.length} de {adSets.length} ad sets</div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[800px]">
          <thead>
            <tr className="border-b border-[#1E1E24]">
              <th className="px-4 py-2.5 text-left text-[10px] text-slate-600 font-semibold uppercase">Nome</th>
              <th className="px-3 py-2.5 text-left text-[10px] text-slate-600 font-semibold uppercase">Campanha</th>
              <th className="px-3 py-2.5 text-left text-[10px] text-slate-600 font-semibold uppercase">Tipo</th>
              {ths('Gasto', 'spend')}
              {ths('Leads', 'leads')}
              {ths('CPL', 'cpl')}
              {ths('CTR', 'ctr')}
              {ths('Freq', 'frequency')}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A1A20]">
            {filtered.map(as => (
              <tr key={as.id} onClick={() => onSelect(as)}
                className="hover:bg-[#16161A] cursor-pointer transition-colors">
                <td className="px-4 py-3 max-w-[200px]">
                  <div className="font-semibold text-white truncate">{as.name}</div>
                  {as.issues.length > 0 && <div className="text-[10px] text-red-400 mt-0.5">{as.issues.length} problema(s)</div>}
                </td>
                <td className="px-3 py-3 max-w-[160px]">
                  <div className="text-slate-400 truncate text-[11px]">{as.campaignName}</div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    {as.hasRemarketing && <Chip color="#A78BFA" label="Remarketing" />}
                    <Chip color="#475569" label={as.optimizationGoalLabel} />
                  </div>
                </td>
                <td className="px-3 py-3 text-right text-[#F0B429] font-semibold tabular-nums">{as.spend > 0 ? fmt(as.spend) : '—'}</td>
                <td className="px-3 py-3 text-right text-[#38BDF8] tabular-nums">{as.leads > 0 ? as.leads : '—'}</td>
                <td className="px-3 py-3 text-right text-slate-300 tabular-nums">{as.cpl > 0 ? `R$${as.cpl}` : '—'}</td>
                <td className="px-3 py-3 text-right tabular-nums">
                  <span className={as.ctr < 0.5 && as.ctr > 0 ? 'text-red-400' : 'text-slate-300'}>{as.ctr > 0 ? `${as.ctr}%` : '—'}</span>
                </td>
                <td className="px-3 py-3 text-right text-slate-300 tabular-nums">{as.frequency > 0 ? `${as.frequency}×` : '—'}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="px-5 py-8 text-center text-slate-600">Nenhum ad set encontrado.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Ads Table ─────────────────────────────────────────────────────────────────
function AdsTable({ ads, onSelect }: { ads: AdCreative[]; onSelect: (a: AdCreative) => void }) {
  const [sort, setSort] = useState<{ key: string; dir: SortDir }>({ key: 'spend', dir: 'desc' })
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')

  const tagConfig = {
    winner: { label: 'Vencedor', color: '#22C55E' },
    waste: { label: 'Pausar', color: '#FF4D4D' },
    learning: { label: 'Aprendendo', color: '#38BDF8' },
    ok: { label: 'Neutro', color: '#64748B' },
  }

  const filtered = useMemo(() => {
    let data = ads
    if (search) data = data.filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
    if (status === 'active') data = data.filter(a => a.tag === 'winner' || a.tag === 'ok')
    if (status === 'issues') data = data.filter(a => a.tag === 'waste')
    return sortData(data, sort.key, sort.dir)
  }, [ads, search, status, sort])

  const toggleSort = (key: string) => setSort(s => s.key === key ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' })
  const ths = (label: string, key: string) => <SortableHeader label={label} sortKey={key} activeKey={sort.key} dir={sort.dir} onSort={toggleSort} right />

  if (ads.length === 0) return <div className="py-12 text-center text-slate-600 text-sm">Nenhum anúncio disponível.</div>

  return (
    <div>
      <FilterBar search={search} onSearch={setSearch} status={status} onStatus={v => setStatus(v)} objective="" onObjective={() => {}} />
      <div className="text-[10px] text-slate-600 px-4 py-2 border-b border-[#1E1E24]">{filtered.length} de {ads.length} anúncios</div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[700px]">
          <thead>
            <tr className="border-b border-[#1E1E24]">
              <th className="px-4 py-2.5 text-left text-[10px] text-slate-600 font-semibold uppercase">Anúncio</th>
              <th className="px-3 py-2.5 text-left text-[10px] text-slate-600 font-semibold uppercase">Tag</th>
              {ths('Gasto', 'spend')}
              {ths('Leads', 'leads')}
              {ths('CPL', 'cpl')}
              {ths('CTR', 'ctr')}
              {ths('Freq', 'frequency')}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A1A20]">
            {filtered.map(ad => {
              const t = tagConfig[ad.tag]
              return (
                <tr key={ad.id} onClick={() => onSelect(ad)}
                  className="hover:bg-[#16161A] cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {ad.imageUrl
                        ? <img src={ad.imageUrl} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                        : <div className="w-8 h-8 rounded flex-shrink-0 bg-[#16161A] flex items-center justify-center text-xs">{ad.tag === 'winner' ? '🏆' : '🖼️'}</div>
                      }
                      <div>
                        <div className="font-semibold text-white truncate max-w-[160px]">{ad.name}</div>
                        {ad.title && <div className="text-[10px] text-slate-600 truncate max-w-[160px]">"{ad.title}"</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3"><Chip color={t.color} label={t.label} /></td>
                  <td className="px-3 py-3 text-right text-[#F0B429] font-semibold tabular-nums">{ad.spend > 0 ? fmt(ad.spend) : '—'}</td>
                  <td className="px-3 py-3 text-right text-[#38BDF8] tabular-nums">{ad.leads > 0 ? ad.leads : '—'}</td>
                  <td className="px-3 py-3 text-right text-slate-300 tabular-nums">{ad.cpl > 0 ? `R$${ad.cpl}` : '—'}</td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    <span className={ad.ctr < 0.5 && ad.ctr > 0 ? 'text-red-400' : 'text-slate-300'}>{ad.ctr > 0 ? `${ad.ctr}%` : '—'}</span>
                  </td>
                  <td className="px-3 py-3 text-right text-slate-300 tabular-nums">{ad.frequency > 0 ? `${ad.frequency}×` : '—'}</td>
                </tr>
              )
            })}
            {filtered.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-600">Nenhum anúncio encontrado.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Creatives Panel ───────────────────────────────────────────────────────────
function CreativesPanel({ ads }: { ads: AdCreative[] }) {
  const [filter, setFilter] = useState<'all' | 'winner' | 'waste' | 'learning'>('all')
  if (ads.length === 0) return <div className="py-12 text-center text-slate-600 text-sm">Nenhum criativo disponível.</div>

  const tagConfig = {
    winner: { label: 'Melhor Performance', color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)', icon: '🏆' },
    waste: { label: 'Rec. Pausar', color: '#FF4D4D', bg: 'rgba(255,77,77,0.1)', border: 'rgba(255,77,77,0.25)', icon: '⛔' },
    learning: { label: 'Em Aprendizado', color: '#38BDF8', bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.25)', icon: '📚' },
    ok: { label: 'Neutro', color: '#64748B', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.25)', icon: '✓' },
  }
  const counts = { winner: ads.filter(a => a.tag === 'winner').length, waste: ads.filter(a => a.tag === 'waste').length, learning: ads.filter(a => a.tag === 'learning').length }
  const filtered = ads.filter(a => filter === 'all' || a.tag === filter).sort((a, b) => ({ winner: 0, ok: 1, learning: 2, waste: 3 }[a.tag] - { winner: 0, ok: 1, learning: 2, waste: 3 }[b.tag] || b.spend - a.spend))

  return (
    <div>
      <div className="flex gap-2 flex-wrap p-4 border-b border-[#1E1E24]">
        {([
          { key: 'all', label: `Todos (${ads.length})`, color: '#64748B' },
          { key: 'winner', label: `🏆 Melhor Performance (${counts.winner})`, color: '#22C55E' },
          { key: 'waste', label: `⛔ Rec. Pausar (${counts.waste})`, color: '#FF4D4D' },
          { key: 'learning', label: `📚 Em Aprendizado (${counts.learning})`, color: '#38BDF8' },
        ] as const).map(f => (
          <button key={f.key} onClick={() => setFilter(f.key as any)}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{ color: filter === f.key ? '#0D0D10' : f.color, background: filter === f.key ? f.color : `${f.color}12`, border: `1px solid ${f.color}35` }}>
            {f.label}
          </button>
        ))}
      </div>
      <div className="divide-y divide-[#1E1E24]">
        {filtered.length === 0 && <div className="px-5 py-8 text-center text-sm text-slate-600">Nenhum criativo neste filtro.</div>}
        {filtered.map(ad => {
          const t = tagConfig[ad.tag]
          return (
            <div key={ad.id} className="px-5 py-4 hover:bg-[#16161A] transition-colors">
              <div className="flex items-start gap-3">
                {ad.imageUrl
                  ? <img src={ad.imageUrl} alt="" className="w-16 h-20 rounded-lg object-cover flex-shrink-0" />
                  : <div className="w-16 h-20 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl" style={{ background: t.bg, border: `1px solid ${t.border}` }}>{t.icon}</div>
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-white truncate">{ad.name}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: t.color, background: t.bg, border: `1px solid ${t.border}` }}>{t.icon} {t.label}</span>
                  </div>
                  {ad.title && <div className="text-xs text-slate-400 mb-1">"{ad.title}"</div>}
                  <div className="flex gap-3 text-xs text-slate-500 flex-wrap">
                    {ad.spend > 0 && <span>Gasto: <strong className="text-[#F0B429]">{fmt(ad.spend)}</strong></span>}
                    {ad.leads > 0 && <span>Leads: <strong className="text-[#38BDF8]">{ad.leads}</strong></span>}
                    {ad.cpl > 0 && <span>CPL: <strong className="text-white">R${ad.cpl}</strong></span>}
                    {ad.ctr > 0 && <span>CTR: <strong className={ad.ctr < 0.5 ? 'text-red-400' : 'text-slate-300'}>{ad.ctr}%</strong></span>}
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

// ── Pixel Card ────────────────────────────────────────────────────────────────
function PixelCard({ pixel }: { pixel: PixelInfo | null }) {
  if (!pixel) return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
      <h3 className="font-display font-bold text-white mb-3 flex items-center gap-2"><span>🔴</span> Pixel Meta</h3>
      <div className="text-sm text-slate-500">Nenhum pixel encontrado nesta conta.</div>
      <div className="mt-3 text-xs text-slate-600 leading-relaxed">Configure o Meta Pixel para rastrear conversões e habilitar públicos de remarketing.</div>
    </div>
  )
  const lastFiredDate = pixel.lastFiredTime ? new Date(pixel.lastFiredTime) : null
  const hoursAgo = lastFiredDate ? Math.floor((Date.now() - lastFiredDate.getTime()) / 3600000) : null
  const statusColor = pixel.isActive ? '#22C55E' : '#FF4D4D'
  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
      <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2"><span>🔵</span> Pixel Meta</h3>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
        <div>
          <div className="text-sm font-semibold text-white">{pixel.name}</div>
          <div className="text-xs" style={{ color: statusColor }}>{pixel.isActive ? 'Ativo' : 'Inativo'}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#16161A] rounded-xl px-3 py-2.5">
          <div className="text-[10px] text-slate-600 uppercase mb-0.5">Último disparo</div>
          <div className="text-xs font-semibold text-slate-300">
            {lastFiredDate ? (hoursAgo !== null && hoursAgo < 48 ? `${hoursAgo}h atrás` : lastFiredDate.toLocaleDateString('pt-BR')) : 'Nunca'}
          </div>
        </div>
        <div className="bg-[#16161A] rounded-xl px-3 py-2.5">
          <div className="text-[10px] text-slate-600 uppercase mb-0.5">Pixel ID</div>
          <div className="text-xs font-mono text-slate-400 truncate">{pixel.id}</div>
        </div>
      </div>
      {!pixel.isActive && (
        <div className="mt-3 text-xs rounded-lg px-3 py-2 leading-relaxed" style={{ background: 'rgba(255,77,77,0.08)', color: '#FF4D4D', border: '1px solid rgba(255,77,77,0.2)' }}>
          Pixel sem disparo há mais de 48h. Verifique a instalação no site ou GTM.
        </div>
      )}
    </div>
  )
}

// ── Tracking Audit Panel ──────────────────────────────────────────────────────
const TRACKING_STATUS_ICON: Record<string, string> = { ok: '✅', warning: '⚠️', error: '❌', not_checked: '⬜' }
const TRACKING_STATUS_COLOR: Record<string, string> = { ok: '#22C55E', warning: '#F0B429', error: '#FF4D4D', not_checked: '#475569' }

function TrackingAuditPanel({ audit, loading }: { audit: TrackingAudit | null; loading: boolean }) {
  if (loading) return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5 animate-pulse">
      <div className="h-4 w-32 bg-[#2A2A30] rounded mb-4" />
      <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-[#2A2A30] rounded-lg" />)}</div>
    </div>
  )
  if (!audit) return null
  const overallColor = TRACKING_STATUS_COLOR[audit.overallStatus] || '#64748B'
  const overallLabel = { ok: 'OK', warning: 'Atenção', error: 'Erro', not_checked: 'Parcial' }[audit.overallStatus] || ''
  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
      <h3 className="font-display font-bold text-white mb-1 flex items-center gap-2">
        <span>🔍</span> Rastreamento
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: overallColor, background: `${overallColor}18`, border: `1px solid ${overallColor}30` }}>{overallLabel}</span>
      </h3>
      <div className="text-[10px] text-slate-600 mb-3">{audit.summary}</div>
      <div className="space-y-2">
        {audit.checks.map(c => (
          <div key={c.id} className="bg-[#16161A] rounded-xl p-3">
            <div className="flex items-start gap-2">
              <span className="text-sm flex-shrink-0 mt-0.5">{TRACKING_STATUS_ICON[c.status]}</span>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-300">{c.name}</div>
                {c.detail && <div className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{c.detail}</div>}
                {c.actionRequired && c.status !== 'ok' && (
                  <div className="mt-1.5 text-[10px] text-amber-500 leading-relaxed border-l-2 border-amber-500/30 pl-2">{c.actionRequired}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── RecCard ───────────────────────────────────────────────────────────────────
function RecCard({ rec, index }: { rec: { type: RecType; title: string; description: string }; index: number }) {
  const map = {
    critical: { color: '#FF4D4D', bg: 'rgba(255,77,77,0.06)', border: 'rgba(255,77,77,0.2)', icon: '🚨' },
    warning: { color: '#F0B429', bg: 'rgba(240,180,41,0.06)', border: 'rgba(240,180,41,0.2)', icon: '⚠️' },
    opportunity: { color: '#22C55E', bg: 'rgba(34,197,94,0.06)', border: 'rgba(34,197,94,0.2)', icon: '💡' },
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

// ── ObjectiveCard ─────────────────────────────────────────────────────────────
function ObjectiveCard({ group, objective }: { group: ObjGroup; objective: string }) {
  const isSales = objective.includes('SALES') || objective === 'CONVERSIONS'
  const isLeads = objective.includes('LEAD')
  const isMsg = objective === 'MESSAGES'
  const color = isSales ? '#22C55E' : isLeads ? '#38BDF8' : isMsg ? '#A78BFA' : '#F0B429'
  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="font-display font-bold text-white text-sm">{group.label}</div>
          <div className="text-xs text-slate-500 mt-0.5">{group.count} campanha{group.count !== 1 ? 's' : ''}</div>
        </div>
        <span className="text-xs font-bold px-2 py-1 rounded-xl" style={{ color, background: `${color}15`, border: `1px solid ${color}25` }}>{fmt(group.totalSpend)}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(isLeads || isSales) && (
          <>
            <div className="bg-[#16161A] rounded-xl px-3 py-2.5 text-center">
              <div className="text-[10px] text-slate-600 uppercase mb-0.5">{isSales ? 'ROAS' : 'CPL Médio'}</div>
              <div className="text-base font-bold" style={{ color }}>{isSales ? (group.avgROAS > 0 ? `${group.avgROAS}×` : '—') : (group.avgCPL > 0 ? `R$${group.avgCPL}` : '—')}</div>
            </div>
            <div className="bg-[#16161A] rounded-xl px-3 py-2.5 text-center">
              <div className="text-[10px] text-slate-600 uppercase mb-0.5">{isSales ? 'Receita' : 'Leads'}</div>
              <div className="text-base font-bold text-white">{isSales ? fmt(group.totalRevenue) : group.totalLeads.toLocaleString('pt-BR')}</div>
            </div>
          </>
        )}
        {(!isLeads && !isSales) && (
          <div className="col-span-2 bg-[#16161A] rounded-xl px-3 py-2.5 text-center">
            <div className="text-[10px] text-slate-600 uppercase mb-0.5">Investido</div>
            <div className="text-base font-bold" style={{ color }}>{fmt(group.totalSpend)}</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Chart Components ──────────────────────────────────────────────────────────
function CampaignSpendChart({ campaigns }: { campaigns: Campaign[] }) {
  const top = [...campaigns].filter(c => c.spend30 > 0).sort((a, b) => b.spend30 - a.spend30).slice(0, 8)
    .map(c => ({ name: c.name.length > 24 ? c.name.slice(0, 24) + '…' : c.name, spend: Math.round(c.spend30), leads: c.leads30, cpl: c.cpl30 }))
  if (top.length === 0) return null
  const hasLeads = top.some(c => c.leads > 0)
  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
      <h3 className="font-display font-bold text-white mb-1 flex items-center gap-2"><span>📊</span> Investimento por Campanha</h3>
      <p className="text-xs text-slate-500 mb-5">Top {top.length} campanhas — últimos 30 dias</p>
      <ResponsiveContainer width="100%" height={Math.max(200, top.length * 48)}>
        <ComposedChart data={top} layout="vertical" margin={{ left: 8, right: 56, top: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={170} tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
          {hasLeads && <YAxis yAxisId="leads" orientation="right" type="number" tick={{ fill: '#38BDF8', fontSize: 10 }} axisLine={false} tickLine={false} width={36} />}
          <Tooltip cursor={{ fill: 'rgba(255,255,255,0.025)' }} content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload
            return (
              <div style={{ background: '#16161A', border: '1px solid #2A2A30', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
                <div className="text-slate-300 font-semibold mb-2">{d.name}</div>
                <div className="text-[#F0B429]">Investido: R${d.spend.toLocaleString('pt-BR')}</div>
                {d.leads > 0 && <div className="text-[#38BDF8]">Leads: {d.leads}</div>}
                {d.cpl > 0 && <div className="text-slate-400">CPL: R${d.cpl}</div>}
              </div>
            )
          }} />
          <Bar dataKey="spend" name="Investido" fill="#F0B429" radius={[0, 6, 6, 0]} barSize={18}>
            <LabelList dataKey="spend" position="right" formatter={(v: number) => v >= 1000 ? `R$${(v / 1000).toFixed(1)}k` : `R$${v}`} style={{ fill: '#94A3B8', fontSize: 10 }} />
          </Bar>
          {hasLeads && <Line yAxisId="leads" dataKey="leads" stroke="#38BDF8" strokeWidth={2} dot={{ fill: '#38BDF8', r: 4 }} type="monotone" />}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

const OBJ_COLORS = ['#1877F2', '#38BDF8', '#22C55E', '#F0B429', '#A78BFA', '#F472B6', '#FB923C', '#64748B']

function ObjectiveDonut({ byObjective, totalSpend }: { byObjective: Record<string, ObjGroup>; totalSpend: number }) {
  const data = Object.entries(byObjective).filter(([, g]) => g.totalSpend > 0)
    .map(([, g], i) => ({ name: g.label, value: Math.round(g.totalSpend), color: OBJ_COLORS[i % OBJ_COLORS.length] }))
  if (data.length === 0) return <div className="text-xs text-slate-600">Nenhum dado disponível.</div>
  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload
            const pct = totalSpend > 0 ? ((d.value / totalSpend) * 100).toFixed(1) : '0'
            return (
              <div style={{ background: '#16161A', border: '1px solid #2A2A30', borderRadius: 10, padding: '8px 12px', fontSize: 12 }}>
                <div style={{ color: d.color }} className="font-semibold mb-1">{d.name}</div>
                <div className="text-slate-300">R${d.value.toLocaleString('pt-BR')}</div>
                <div className="text-slate-500">{pct}% do total</div>
              </div>
            )
          }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span className="text-slate-400">{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PlatformBarChart({ platforms }: { platforms: PlatformBreakdown[] }) {
  const platformLabel: Record<string, string> = { facebook: 'Facebook', instagram: 'Instagram', audience_network: 'Aud. Network', messenger: 'Messenger' }
  const platformColor: Record<string, string> = { facebook: '#1877F2', instagram: '#E1306C', audience_network: '#F0B429', messenger: '#00B2FF' }
  const grouped: Record<string, { spend: number; leads: number }> = {}
  for (const p of platforms) {
    if (!grouped[p.platform]) grouped[p.platform] = { spend: 0, leads: 0 }
    grouped[p.platform].spend += p.spend; grouped[p.platform].leads += p.leads
  }
  const data = Object.entries(grouped).sort(([, a], [, b]) => b.spend - a.spend)
    .map(([plat, totals]) => ({ name: platformLabel[plat] || plat, spend: Math.round(totals.spend), leads: totals.leads, color: platformColor[plat] || '#64748B' }))
  if (data.length === 0) return null
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
        <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip content={({ active, payload }) => {
          if (!active || !payload?.length) return null
          const d = payload[0].payload
          return (
            <div style={{ background: '#16161A', border: '1px solid #2A2A30', borderRadius: 10, padding: '8px 12px', fontSize: 12 }}>
              <div style={{ color: d.color }} className="font-semibold mb-1">{d.name}</div>
              <div className="text-[#F0B429]">R${d.spend.toLocaleString('pt-BR')}</div>
              {d.leads > 0 && <div className="text-[#38BDF8]">{d.leads} leads</div>}
            </div>
          )
        }} />
        <Bar dataKey="spend" radius={[6, 6, 0, 0]} barSize={40}>
          {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          <LabelList dataKey="spend" position="top" formatter={(v: number) => v >= 1000 ? `R$${(v / 1000).toFixed(1)}k` : `R$${v}`} style={{ fill: '#94A3B8', fontSize: 10 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function GeoTable({ geo }: { geo: GeoBreakdown[] }) {
  if (geo.length === 0) return null
  const maxSpend = Math.max(...geo.map(g => g.spend), 1)
  const bestRegion = [...geo].filter(g => g.leads > 0).sort((a, b) => a.cpl - b.cpl)[0]
  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#2A2A30] flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-display font-bold text-white flex items-center gap-2"><span>🗺️</span> Performance Geográfica</h3>
        {bestRegion && <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }}>Melhor: {bestRegion.region} — CPL R${bestRegion.cpl}</span>}
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
                  <td className="px-5 py-2.5"><span className="font-semibold" style={{ color: isBest ? '#22C55E' : '#CBD5E1' }}>{row.region}</span>{isBest && <span className="ml-2 text-[10px] text-[#22C55E]">★ Melhor CPL</span>}</td>
                  <td className="px-3 py-2.5 text-right text-[#F0B429] font-semibold">{fmt(row.spend)}</td>
                  <td className="px-3 py-2.5 text-right text-[#38BDF8] font-semibold">{row.leads || '—'}</td>
                  <td className="px-3 py-2.5 text-right text-slate-300 font-semibold">{row.cpl > 0 ? `R$${row.cpl}` : '—'}</td>
                  <td className="px-5 py-2.5"><div className="h-1.5 bg-[#1E1E24] rounded-full overflow-hidden w-24"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: isBest ? '#22C55E' : 'linear-gradient(90deg,#1877F2,#38BDF8)' }} /></div></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PlatformPanel({ platforms }: { platforms: PlatformBreakdown[] }) {
  if (platforms.length === 0) return null
  const platformLabel: Record<string, string> = { facebook: 'Facebook', instagram: 'Instagram', audience_network: 'Audience Network', messenger: 'Messenger' }
  const positionLabel: Record<string, string> = { feed: 'Feed', story: 'Stories', reels: 'Reels', right_hand_column: 'Col. Direita', search: 'Pesquisa', marketplace: 'Marketplace', video_feeds: 'Feed de Vídeo', instagram_explore: 'Explorar', instagram_profile_feed: 'Perfil IG', instream_video: 'In-stream', rewarded_video: 'Rewarded' }
  const platformColor: Record<string, string> = { facebook: '#1877F2', instagram: '#E1306C', audience_network: '#F0B429', messenger: '#00B2FF' }
  const grouped: Record<string, PlatformBreakdown[]> = {}
  for (const p of platforms) { if (!grouped[p.platform]) grouped[p.platform] = []; grouped[p.platform].push(p) }
  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
      <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2"><span>📱</span> Distribuição por Plataforma</h3>
      <PlatformBarChart platforms={platforms} />
      <div className="mt-4 space-y-4">
        {Object.entries(grouped).map(([plat, rows]) => {
          const color = platformColor[plat] || '#64748B'
          const totalSpend = rows.reduce((s, r) => s + r.spend, 0)
          const totalLeads = rows.reduce((s, r) => s + r.leads, 0)
          const platCpl = totalLeads > 0 ? +(totalSpend / totalLeads).toFixed(2) : 0
          return (
            <div key={plat}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="font-semibold text-white text-sm">{platformLabel[plat] || plat}</span>
                </div>
                <div className="flex gap-3 text-xs text-slate-500">
                  {totalLeads > 0 && <span className="text-[#38BDF8]">{totalLeads} leads</span>}
                  {platCpl > 0 && <span className="text-slate-300">CPL R${platCpl}</span>}
                </div>
              </div>
              <div className="space-y-1.5 pl-4">
                {rows.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 w-24 flex-shrink-0 truncate">{positionLabel[r.position] || r.position}</span>
                    <div className="flex-1 h-1 bg-[#1E1E24] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${totalSpend > 0 ? (r.spend / totalSpend) * 100 : 0}%`, background: color }} /></div>
                    <span className="text-slate-400 w-16 text-right flex-shrink-0">{fmt(r.spend)}</span>
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

function DemoPanel({ demo }: { demo: DemoBreakdown[] }) {
  if (demo.length === 0) return null
  const ages = [...new Set(demo.map(d => d.age))].sort()
  const genders = [...new Set(demo.map(d => d.gender))]
  const genderLabel: Record<string, string> = { male: 'Homens', female: 'Mulheres', unknown: 'Desconh.' }
  const genderColor: Record<string, string> = { male: '#38BDF8', female: '#F472B6', unknown: '#64748B' }
  const maxSpend = Math.max(...demo.map(d => d.spend), 1)
  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
      <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2"><span>👥</span> Audiência por Idade e Gênero</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1E1E24]">
              <th className="py-2 pr-4 text-left text-slate-600 font-semibold uppercase">Faixa</th>
              {genders.map(g => <th key={g} className="py-2 px-2 text-center font-semibold" style={{ color: genderColor[g] || '#64748B' }}>{genderLabel[g] || g}</th>)}
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
                      <div className="rounded-lg px-2 py-1 inline-block min-w-[60px]" style={{ background: `${color}${Math.round(intensity * 0.3).toString(16).padStart(2, '0')}` }}>
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
    </div>
  )
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ data, trackingAudit, trackingLoading }: {
  data: IntelligenceData; trackingAudit: TrackingAudit | null; trackingLoading: boolean
}) {
  const freqLimit = data.freqThreshold ?? 4
  return (
    <div className="space-y-6">
      {/* Pixel + Rastreamento + Aprendizado + Objetivo */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <PixelCard pixel={data.pixel ?? null} />
        <TrackingAuditPanel audit={trackingAudit} loading={trackingLoading} />
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
          <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2"><span>🧠</span> Fase de Aprendizado</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Estáveis', count: data.campaigns.filter(c => c.learningPhase === 'stable').length, color: '#22C55E' },
              { label: 'Aprendendo', count: data.campaigns.filter(c => c.learningPhase === 'learning').length, color: '#38BDF8' },
              { label: 'Limitado', count: data.campaigns.filter(c => c.learningPhase === 'learning_limited').length, color: '#FB923C' },
            ].map(s => (
              <div key={s.label} className="bg-[#16161A] rounded-xl px-3 py-2.5 text-center">
                <div className="font-display text-2xl font-bold" style={{ color: s.color }}>{s.count}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="space-y-1.5 text-xs text-slate-500">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#38BDF8] flex-shrink-0" /><span>Em Aprendizado: evite editar para não reiniciar o ciclo</span></div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#FB923C] flex-shrink-0" /><span>Limitado: aumente orçamento ou amplie a audiência</span></div>
          </div>
        </div>
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
          <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2"><span>📊</span> Por Objetivo</h3>
          <ObjectiveDonut byObjective={data.byObjective} totalSpend={data.totals.spend} />
        </div>
      </div>

      {/* Recomendações */}
      {data.globalRecs.length > 0 && (
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
          <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2"><span>⚡</span> Recomendações Prioritárias</h3>
          <div className="space-y-3">{data.globalRecs.map((rec, i) => <RecCard key={i} rec={rec} index={i} />)}</div>
        </div>
      )}

      {/* Por Objetivo */}
      {Object.keys(data.byObjective).length > 0 && (
        <div>
          <h3 className="font-display font-bold text-white mb-3 flex items-center gap-2"><span>🎯</span> Performance por Objetivo</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(data.byObjective).map(([key, g]) => <ObjectiveCard key={key} objective={key} group={g} />)}
          </div>
        </div>
      )}

      {/* Charts */}
      {data.campaigns.length > 0 && <CampaignSpendChart campaigns={data.campaigns} />}
      <div className="grid md:grid-cols-2 gap-4">
        {(data.geoBreakdown?.length ?? 0) > 0 && <div className="md:col-span-2"><GeoTable geo={data.geoBreakdown} /></div>}
        {(data.platformBreakdown?.length ?? 0) > 0 && <PlatformPanel platforms={data.platformBreakdown} />}
        {(data.demoBreakdown?.length ?? 0) > 0 && <DemoPanel demo={data.demoBreakdown} />}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
interface Props {
  onNavigateToConnections?: () => void
}

export function TabMetaIntelligence({ onNavigateToConnections }: Props) {
  const { connectedAccounts, auditCache, setAuditCache, clientData: storeClientData, selectedMetaAccountByClient, setSelectedMetaAccountId } = useAppStore()
  const metaAccount = connectedAccounts.find(a => a.platform === 'meta')
  const clientKey = storeClientData?.clientName || ''
  const selectedMetaAccountId = selectedMetaAccountByClient[clientKey] || ''

  const [data, setData] = useState<IntelligenceData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fetched, setFetched] = useState(false)
  const [innerTab, setInnerTab] = useState<InnerTab>('overview')
  const [allAccounts, setAllAccounts] = useState<{ id: string; name: string }[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>(selectedMetaAccountId || metaAccount?.accountId || '')
  const [trackingAudit, setTrackingAudit] = useState<TrackingAudit | null>(null)
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [drawerEntity, setDrawerEntity] = useState<DrawerEntity | null>(null)
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null)
  const [adsetCampaignFilter, setAdsetCampaignFilter] = useState<string>('')

  const cacheKey = storeClientData?.clientName || metaAccount?.accountName || metaAccount?.accountId || ''
  const freqLimit = data?.freqThreshold ?? 4

  useEffect(() => {
    if (!fetched && cacheKey) {
      const history = auditCache[cacheKey]
      const latest = Array.isArray(history) ? history[0]?.audit : null
      if (latest?._intelligenceData) {
        setData(latest._intelligenceData as IntelligenceData)
        setFetched(true)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey])

  useEffect(() => {
    if (!metaAccount) return
    fetch('/api/meta/ad-accounts').then(r => r.json()).then(d => {
      if (d.success && Array.isArray(d.accounts) && d.accounts.length > 0) {
        setAllAccounts(d.accounts)
        const first = selectedMetaAccountId || d.accounts[0].id
        if (!selectedAccountId) {
          setSelectedAccountId(first)
          setSelectedMetaAccountId(clientKey, first)
        }
      }
    }).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metaAccount?.accountId])

  const fetchTrackingAudit = async (accountId: string) => {
    setTrackingLoading(true)
    try {
      const res = await fetch(`/api/meta/tracking-audit?accountId=${accountId}`)
      const d = await res.json()
      if (d.success) setTrackingAudit(d as TrackingAudit)
    } catch { } finally { setTrackingLoading(false) }
  }

  const fetchIntelligence = async () => {
    const accountId = selectedAccountId || metaAccount?.accountId
    if (!accountId) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/ads-data/meta-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, niche: storeClientData?.niche || '' }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setData(json); setFetched(true); setLastSyncAt(new Date())
      if (cacheKey) {
        setAuditCache(cacheKey, {
          _intelligenceData: json, _previousTotals: json.previousTotals,
          _realMetrics: { totalSpend: json.totals.spend, totalLeads: json.totals.leads, totalRevenue: json.totals.revenue, avgCPL: json.totals.cpl > 0 ? json.totals.cpl : null, avgROAS: json.totals.roas > 0 ? json.totals.roas : null, avgCTR: json.totals.avgCTR, campaignCount: json.totals.totalCampaigns, dataSource: 'Meta Ads (ao vivo)' },
          generated_at: new Date().toISOString(),
        })
      }
      fetchTrackingAudit(accountId)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Auto-detected problems and opportunities
  const problems = useMemo(() =>
    data ? detectProblems(data.campaigns, data.adSets ?? [], data.ads ?? [], freqLimit) : [],
    [data, freqLimit]
  )
  const opportunities = useMemo(() =>
    data ? detectOpportunities(data.campaigns, data.ads ?? [], data.geoBreakdown ?? []) : [],
    [data]
  )

  // Tab counts
  const tabCounts: Partial<Record<InnerTab, number>> = data ? {
    campaigns: data.campaigns.length,
    adsets: (data.adSets ?? []).length,
    ads: (data.ads ?? []).length,
    creatives: (data.ads ?? []).length,
    problems: problems.length,
    opportunities: opportunities.length,
  } : {}

  if (!metaAccount) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-white mb-1">{useViewMode().mode === 'simple' ? 'Seus Anúncios no Instagram e Facebook' : 'Meta Ad Intelligence'}</h2>
          <p className="text-slate-500 text-sm">Análise profunda das suas campanhas Meta Ads em tempo real.</p>
        </div>
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-10 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl" style={{ background: 'rgba(24,119,242,0.12)', border: '1px solid rgba(24,119,242,0.25)' }}>📘</div>
          <h3 className="font-display text-xl font-bold text-white mb-2">Conecte o Meta Ads</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto leading-relaxed">Conecte sua conta do Gerenciador de Anúncios para ver ROAS por objetivo, fase de aprendizado, criativos, ad sets, pixel, análise geográfica e demográfica.</p>
          <button onClick={onNavigateToConnections} className="px-6 py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-80" style={{ background: 'linear-gradient(135deg,#1877F2,#0a5dc2)', color: '#fff' }}>
            Ir para Conexões →
          </button>
        </div>
      </div>
    )
  }

  const sc = scoreColor(data?.score || 0)
  const prev = data?.previousTotals

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-white mb-1">{useViewMode().mode === 'simple' ? 'Seus Anúncios no Instagram e Facebook' : 'Meta Ad Intelligence'}</h2>
          <div className="flex items-center gap-3 flex-wrap">
            {allAccounts.length > 1 ? (
              <select value={selectedAccountId}
                onChange={e => { setSelectedAccountId(e.target.value); setSelectedMetaAccountId(clientKey, e.target.value); setFetched(false); setData(null); setTrackingAudit(null) }}
                className="text-sm font-semibold text-slate-300 bg-[#16161A] border border-[#2A2A30] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#1877F2]">
                {allAccounts.map(a => <option key={a.id} value={a.id}>{a.name || a.id}</option>)}
              </select>
            ) : (
              <span className="text-sm text-slate-500">Conta: <span className="text-slate-300 font-semibold">{metaAccount.accountName || metaAccount.accountId}</span></span>
            )}
            {data && (
              <span className="text-[11px] text-slate-600">
                {data.totals.totalCampaigns} campanhas{data.totals.totalAdSets > 0 && ` · ${data.totals.totalAdSets} ad sets`}{data.totals.totalAds > 0 && ` · ${data.totals.totalAds} criativos`} · últimos 30 dias
              </span>
            )}
            {lastSyncAt && (
              <span className="text-[10px] text-slate-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                Sincronizado {Math.round((Date.now() - lastSyncAt.getTime()) / 60000) < 1 ? 'agora' : `há ${Math.round((Date.now() - lastSyncAt.getTime()) / 60000)}min`}
              </span>
            )}
          </div>
        </div>
        <button onClick={fetchIntelligence} disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#1877F2,#0a5dc2)', color: '#fff' }}>
          {loading ? '⏳ Analisando...' : fetched ? '🔄 Reanalisar' : '🔍 Analisar conta'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 flex items-center justify-between">
          <span>{error}</span><button onClick={() => setError('')} className="ml-4 text-lg">×</button>
        </div>
      )}

      {!fetched && !loading && (
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-10 text-center">
          <div className="text-4xl mb-4">📡</div>
          <h3 className="font-display text-lg font-bold text-white mb-2">Pronto para analisar</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">Clique em "Analisar conta" para buscar campanhas, ad sets, criativos, pixel e breakdowns ao vivo.</p>
        </div>
      )}

      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">{[...Array(5)].map((_, i) => <div key={i} className="bg-[#111114] border border-[#2A2A30] rounded-2xl h-24" />)}</div>
          <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl h-12" />
          <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl h-64" />
        </div>
      )}

      {data && !loading && (
        <>
          {/* KPI Summary Cards */}
          {(() => {
            const wastedSpend = computeWastedSpend(data.campaigns)
            const problemCampaigns = data.campaigns.filter(c => c.issues.length > 0).length
            const winnerCreatives = (data.ads ?? []).filter(a => a.tag === 'winner').length
            const avgCPC = data.campaigns.length > 0
              ? +(data.campaigns.filter(c => c.cpc30 > 0).reduce((s, c) => s + c.cpc30, 0) / Math.max(data.campaigns.filter(c => c.cpc30 > 0).length, 1)).toFixed(2) : 0
            const avgCPM = data.campaigns.length > 0
              ? +(data.campaigns.filter(c => c.cpm30 > 0).reduce((s, c) => s + c.cpm30, 0) / Math.max(data.campaigns.filter(c => c.cpm30 > 0).length, 1)).toFixed(2) : 0

            return (
              <>
                {/* Row 1: Score + 4 principais */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="md:col-span-1 bg-[#111114] border border-[#2A2A30] rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                    <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">Score da conta</div>
                    <div className="font-display text-5xl font-bold mb-1" style={{ color: sc }}>{data.scoreGrade}</div>
                    <div className="text-xs text-slate-500">{data.score}/100</div>
                  </div>
                  {[
                    { label: 'Investido 30d', value: fmt(data.totals.spend), color: '#F0B429', delta: prev?.spendDelta, invertColor: false, sub: data.totals.activeCampaigns > 0 ? `${data.totals.activeCampaigns} ativa${data.totals.activeCampaigns !== 1 ? 's' : ''}` : undefined, tooltip: 'Valor total investido nos últimos 30 dias' },
                    { label: 'Leads', value: data.totals.leads > 0 ? String(data.totals.leads) : '—', color: '#38BDF8', delta: prev?.leadsDelta, invertColor: false, sub: data.totals.cpl > 0 ? `CPL: R$${data.totals.cpl}` : undefined, tooltip: 'Total de leads gerados (Custo Por Lead médio)' },
                    { label: 'ROAS', value: data.totals.roas > 0 ? `${data.totals.roas}×` : '—', color: '#22C55E', delta: prev?.roasDelta ?? null, invertColor: false, sub: data.totals.revenue > 0 ? `Receita: ${fmt(data.totals.revenue)}` : undefined, tooltip: 'Retorno sobre investimento em anúncios' },
                    { label: 'CTR Médio', value: `${data.totals.avgCTR}%`, color: data.totals.avgCTR < 0.5 ? '#FF4D4D' : data.totals.avgCTR >= 1.5 ? '#22C55E' : '#F0B429', delta: prev?.ctrDelta ?? null, invertColor: false, sub: `Freq: ${data.totals.avgFrequency}×`, tooltip: 'Taxa de cliques média. Acima de 1% é considerado bom' },
                  ].map(kpi => (
                    <div key={kpi.label} title={kpi.tooltip} className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-4 flex flex-col justify-between cursor-help">
                      <div className="text-[10px] text-slate-600 uppercase tracking-wider">{kpi.label}</div>
                      <div className="flex items-end gap-1 mt-2">
                        <div className="font-display text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
                        {kpi.delta != null && <DeltaBadge delta={kpi.delta} invertColor={kpi.invertColor} />}
                      </div>
                      {kpi.sub && <div className="text-[10px] text-slate-600 mt-1">{kpi.sub}</div>}
                    </div>
                  ))}
                </div>

                {/* Row 2: métricas secundárias */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    { label: 'CPC Médio',  value: avgCPC > 0 ? `R$${avgCPC}` : '—', color: '#A78BFA', delta: prev?.cpcDelta ?? null, invertColor: true, sub: 'Custo por clique', tooltip: 'Custo Por Clique médio de todas as campanhas' },
                    { label: 'CPM Médio',  value: avgCPM > 0 ? `R$${avgCPM}` : '—', color: '#38BDF8', delta: prev?.cpmDelta ?? null, invertColor: true, sub: 'A cada 1000 imp.', tooltip: 'Custo Por Mil Impressões médio' },
                    { label: 'Freq. Média',value: `${data.totals.avgFrequency}×`, color: data.totals.avgFrequency > (freqLimit + 1) ? '#FB923C' : '#94A3B8', delta: prev?.freqDelta ?? null, invertColor: true, sub: `Limite: ${freqLimit}×`, tooltip: `Frequência média. Acima de ${freqLimit}× indica fadiga de anúncio` },
                    { label: 'Gasto Desperdiçado', value: wastedSpend > 0 ? fmt(wastedSpend) : 'R$0', color: wastedSpend > 100 ? '#FF4D4D' : '#22C55E', delta: null, invertColor: true, sub: wastedSpend > 0 ? 'sem conversão' : 'sem desperdício', tooltip: 'Soma do gasto em campanhas com R$50+ investidos e zero conversões' },
                    { label: 'C/ Problemas',value: problemCampaigns > 0 ? String(problemCampaigns) : '0', color: problemCampaigns > 0 ? '#F0B429' : '#22C55E', delta: null, invertColor: true, sub: 'campanhas', tooltip: 'Número de campanhas com algum problema detectado' },
                    { label: 'Criativos Top',value: winnerCreatives > 0 ? String(winnerCreatives) : '0', color: winnerCreatives > 0 ? '#22C55E' : '#64748B', delta: null, invertColor: false, sub: 'vencedores', tooltip: 'Criativos classificados como Melhor Performance' },
                  ].map(kpi => (
                    <div key={kpi.label} title={kpi.tooltip} className="bg-[#111114] border border-[#2A2A30] rounded-xl p-3 flex flex-col cursor-help">
                      <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">{kpi.label}</div>
                      <div className="flex items-end gap-1 mt-1">
                        <div className="font-display text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
                        {'delta' in kpi && kpi.delta != null && <DeltaBadge delta={kpi.delta} invertColor={kpi.invertColor} />}
                      </div>
                      <div className="text-[10px] text-slate-600 mt-0.5">{kpi.sub}</div>
                    </div>
                  ))}
                </div>
              </>
            )
          })()}

          {/* Inner Tab Bar */}
          <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
            <div className="px-4 pt-4">
              <InnerTabBar active={innerTab} onChange={setInnerTab} counts={tabCounts} />
            </div>

            <div className="mt-0">
              {innerTab === 'overview' && (
                <div className="p-5">
                  <OverviewTab data={data} trackingAudit={trackingAudit} trackingLoading={trackingLoading} />
                </div>
              )}

              {innerTab === 'campaigns' && (
                <CampaignsTable
                  campaigns={data.campaigns}
                  freqLimit={freqLimit}
                  onSelect={c => setDrawerEntity({ type: 'campaign', data: c })}
                />
              )}

              {innerTab === 'adsets' && (
                <AdSetsTable
                  adSets={data.adSets ?? []}
                  onSelect={a => setDrawerEntity({ type: 'adset', data: a })}
                />
              )}

              {innerTab === 'ads' && (
                <AdsTable
                  ads={data.ads ?? []}
                  onSelect={a => setDrawerEntity({ type: 'ad', data: a })}
                />
              )}

              {innerTab === 'creatives' && (
                <CreativesPanel ads={data.ads ?? []} />
              )}

              {innerTab === 'problems' && (
                <div className="p-5">
                  <ProblemsPanel problems={problems} />
                </div>
              )}

              {innerTab === 'opportunities' && (
                <div className="p-5">
                  <OpportunitiesPanel opportunities={opportunities} />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Entity Drawer */}
      {drawerEntity && (
        <EntityDrawer entity={drawerEntity} onClose={() => setDrawerEntity(null)} freqLimit={freqLimit} />
      )}
    </div>
  )
}
