// components/dashboard/TabOverview.tsx — Layout TrafficBrain AI
'use client'

import { useState, useEffect, useMemo } from 'react'
import { RevenueChart } from './RevenueChart'
import { getBenchmark, computeNicheProjection } from '@/lib/niche_benchmarks'
import { useAppStore } from '@/lib/store'
import type { ClientData } from '@/lib/store'

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  surface:  '#0F1629',
  elevated: '#131E35',
  border:   'rgba(255,255,255,0.06)',
  borderMd: 'rgba(255,255,255,0.1)',
  purple:   '#7C3AED',
  purpleL:  '#A78BFA',
  purpleD:  'rgba(124,58,237,0.12)',
  purpleB:  'rgba(124,58,237,0.22)',
  amber:    '#F59E0B',
  green:    '#22C55E',
  red:      '#EF4444',
  blue:     '#38BDF8',
  text1:    '#F1F5F9',
  text2:    '#94A3B8',
  text3:    '#64748B',
}

interface Props {
  strategy: Record<string, any>
  analysis: Record<string, any>
  clientData: ClientData | null
  onNavigate?: (tab: string) => void
}

// ── Sparkline component ───────────────────────────────────────────────────────
function Sparkline({ data, color, width = 80, height = 32 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 6) - 3
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  // Area fill path
  const first = `0,${height}`
  const last  = `${width},${height}`
  const area  = `${first} ${pts} ${last}`
  return (
    <svg width={width} height={height} style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg-${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Seeded sparkline data generator ──────────────────────────────────────────
function genSparkline(base: number, seed: string, len = 14): number[] {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h) + seed.charCodeAt(i)
  const rand = () => { h = (h * 1664525 + 1013904223) & 0xffffffff; return (h & 0x7fffffff) / 0x7fffffff }
  const data: number[] = []
  let v = base * 0.7
  for (let i = 0; i < len; i++) {
    v += (rand() - 0.42) * base * 0.12
    v = Math.max(base * 0.3, Math.min(base * 1.6, v))
    data.push(Math.round(v))
  }
  data[data.length - 1] = base
  return data
}

// ── KPI metric card ───────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, trend, sparkSeed, sparkBase, icon }: {
  label: string; value: string; sub: string; color: string
  trend?: number; sparkSeed: string; sparkBase: number; icon: React.ReactNode
}) {
  const sparkData = useMemo(() => sparkBase > 0 ? genSparkline(sparkBase, sparkSeed) : [], [sparkBase, sparkSeed])
  const isPos = trend == null ? null : trend >= 0
  // Extract the metric keyword from the label for tooltip (e.g. "CPL Real" → "CPL")
  const metricKey = Object.keys(METRIC_TIPS).find(k => label.toUpperCase().includes(k))
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: '14px', padding: '22px 22px 18px',
      display: 'flex', flexDirection: 'column', gap: '10px',
      minHeight: '140px',
      transition: 'border-color 0.15s, box-shadow 0.15s',
      cursor: 'default',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.purpleB; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(124,58,237,0.1)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
    >
      {/* Top row: icon + trend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '9px',
          background: `${color}18`, border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color, flexShrink: 0,
        }}>
          {icon}
        </div>
        {trend != null && (
          <span style={{
            fontSize: '11px', fontWeight: 700,
            color: isPos ? C.green : C.red,
            background: isPos ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${isPos ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
            borderRadius: '6px', padding: '2px 7px',
          }}>
            {isPos ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>

      {/* Value */}
      <div>
        <div style={{ fontSize: '24px', fontWeight: 800, color: C.text1, letterSpacing: '-0.03em', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: '9px', color: C.text3, marginTop: '4px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center' }}>
          {label}
          {metricKey && <MetricTooltip metric={metricKey} />}
        </div>
      </div>

      {/* Sparkline + sub */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ fontSize: '10px', color: C.text3, flex: 1, minWidth: 0, lineHeight: 1.4 }}>
          {sub}
        </div>
        <Sparkline data={sparkData} color={color} width={72} height={28} />
      </div>
    </div>
  )
}

// ── AI Score gauge ────────────────────────────────────────────────────────────
const SCORE_RANGES = [
  { min: 90, max: 100, label: 'Excelente',  color: '#22C55E', desc: 'Estrutura e performance acima da média do nicho.' },
  { min: 70, max: 89,  label: 'Saudável',   color: '#22C55E', desc: 'A conta está bem. Ainda há espaço para otimizar.' },
  { min: 45, max: 69,  label: 'Atenção',    color: '#F59E0B', desc: 'Existem problemas importantes para corrigir.' },
  { min: 0,  max: 44,  label: 'Crítico',    color: '#EF4444', desc: 'A conta precisa de ação urgente.' },
]

function ScoreGauge({ score, label, description }: { score: number; label: string; description: string }) {
  const [showInfo, setShowInfo] = useState(false)
  const R = 52
  const CIRC = 2 * Math.PI * R
  const color = score >= 90 ? '#22C55E' : score >= 70 ? '#22C55E' : score >= 45 ? '#F59E0B' : '#EF4444'
  const bgColor = score >= 70 ? 'rgba(34,197,94,0.08)' : score >= 45 ? 'rgba(245,165,0,0.08)' : 'rgba(239,68,68,0.08)'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <svg width="130" height="130" viewBox="0 0 130 130">
          <circle cx="65" cy="65" r={R} fill="none" stroke={C.elevated} strokeWidth="10"
            strokeDasharray={`${CIRC * 0.75} ${CIRC}`} strokeLinecap="round"
            transform="rotate(135 65 65)" />
          <circle cx="65" cy="65" r={R} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${CIRC * 0.75 * score / 100} ${CIRC}`} strokeLinecap="round"
            transform="rotate(135 65 65)"
            style={{ transition: 'stroke-dasharray 1.2s ease', filter: `drop-shadow(0 0 6px ${color}60)` }} />
          <text x="65" y="60" textAnchor="middle" fill={C.text1} fontSize="28" fontWeight="800"
            fontFamily="var(--font-dm-sans)">{score}</text>
          <text x="65" y="76" textAnchor="middle" fill={C.text3} fontSize="11" fontWeight="500">/100</text>
        </svg>
        {/* Info button */}
        <button
          onClick={() => setShowInfo(v => !v)}
          title="O que é o Score IA?"
          style={{
            position: 'absolute', top: 2, right: 2,
            width: '18px', height: '18px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
          }}
        >?</button>
      </div>

      <div style={{ textAlign: 'center', width: '100%' }}>
        <div style={{
          fontSize: '12px', fontWeight: 700, color,
          background: bgColor, border: `1px solid ${color}30`,
          borderRadius: '6px', padding: '3px 10px', display: 'inline-block', marginBottom: '6px',
        }}>{label}</div>
        <div style={{ fontSize: '11px', color: C.text3, lineHeight: 1.5, maxWidth: '160px', margin: '0 auto' }}>
          {description}
        </div>
      </div>

      {/* Faixas de referência — expande ao clicar no ? */}
      {showInfo && (
        <div style={{
          width: '100%', background: '#0F1629',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px', padding: '10px 12px',
        }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Como o Score é calculado
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginBottom: '8px' }}>
            Avalia métricas da conta, alertas críticos encontrados, ações pendentes e recência da auditoria.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {SCORE_RANGES.map(r => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
                  background: r.color, opacity: score >= r.min && score <= r.max ? 1 : 0.25,
                }} />
                <span style={{ fontSize: '10px', fontWeight: 600, color: score >= r.min && score <= r.max ? r.color : 'rgba(255,255,255,0.3)', minWidth: '60px' }}>
                  {r.min}–{r.max} {r.label}
                </span>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{r.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Visual funnel ─────────────────────────────────────────────────────────────
function FunnelViz({ stages }: { stages: { label: string; value: number; pct: string; color: string }[] }) {
  const max = stages[0]?.value || 1
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {stages.map((s, i) => {
        const w = Math.max(35, (s.value / max) * 100)
        return (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Bar */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <div style={{
                width: `${w}%`, height: '32px', borderRadius: '6px',
                background: `${s.color}22`, border: `1px solid ${s.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: s.color }}>
                  {s.value >= 1000 ? `${(s.value/1000).toFixed(1)}k` : s.value.toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
            {/* Label + pct */}
            <div style={{ minWidth: '110px', textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: C.text2, fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: '10px', color: C.text3 }}>{s.pct}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Insight SVG icons ─────────────────────────────────────────────────────────
const INSIGHT_ICONS: Record<string, (color: string) => React.ReactNode> = {
  '🚨': (c) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  '⚡': (c) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  '🔄': (c) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  '🔗': (c) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  '📈': (c) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  '🧠': (c) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14z"/></svg>,
  '✅': (c) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  '💡': (c) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="3"/><path d="M12 6a6 6 0 0 1 6 6c0 2.5-1.5 4.5-3.5 5.5V20H9.5v-2.5C7.5 16.5 6 14.5 6 12a6 6 0 0 1 6-6z"/><line x1="9" y1="21" x2="15" y2="21"/></svg>,
}
function getInsightIcon(icon: string, color: string): React.ReactNode {
  const fn = INSIGHT_ICONS[icon]
  return fn ? fn(color) : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
}

const INSIGHT_ACTION_TAB: Record<string, string> = {
  'Ver auditoria':       'analise',
  'Auditar agora':       'analise',
  'Conectar conta':      'anuncios',
  'Atualizar estratégia':'strategy',
  'Ver estratégia':      'strategy',
  'Ver projeção':        'overview',
}

// ── Insight card ──────────────────────────────────────────────────────────────
function InsightCard({ icon, title, desc, color, action, onNavigate }: {
  icon: string; title: string; desc: string; color: string; action?: string; onNavigate?: (tab: string) => void
}) {
  const destTab = action ? INSIGHT_ACTION_TAB[action] : undefined
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: '12px', padding: '14px',
      display: 'flex', flexDirection: 'column', gap: '8px',
      transition: 'all 0.15s', cursor: 'default', minWidth: '0',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${color}40`; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${color}15` }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
    >
      <div style={{
        width: '34px', height: '34px', borderRadius: '9px',
        background: `${color}15`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>{getInsightIcon(icon, color)}</div>
      <div>
        <div style={{ fontSize: '12px', fontWeight: 700, color, marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '11px', color: C.text3, lineHeight: 1.5 }}>{desc}</div>
      </div>
      {action && (
        <button style={{
          marginTop: 'auto', padding: '5px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 600,
          background: `${color}10`, border: `1px solid ${color}25`, color,
          cursor: destTab && onNavigate ? 'pointer' : 'default',
          transition: 'all 0.15s', textAlign: 'left',
        }}
          onClick={() => { if (destTab && onNavigate) onNavigate(destTab) }}
          onMouseEnter={e => { e.currentTarget.style.background = `${color}20` }}
          onMouseLeave={e => { e.currentTarget.style.background = `${color}10` }}
        >{action} →</button>
      )}
    </div>
  )
}

// ── Metric tooltip ────────────────────────────────────────────────────────────
const METRIC_TIPS: Record<string, string> = {
  'CPL':        'Custo por Lead — quanto você paga em média para captar um lead. Quanto menor, melhor.',
  'CPA':        'Custo por Aquisição — quanto custa converter um lead em cliente. Depende da taxa de fechamento.',
  'CTR':        'Taxa de Cliques — % de pessoas que viram seu anúncio e clicaram. Acima de 1% é bom para tráfego pago.',
  'ROAS':       'Retorno sobre o Investimento em Anúncios — cada R$1 investido gera R$ X em receita. Acima de 3× costuma ser lucrativo.',
  'CPM':        'Custo por Mil Impressões — quanto custa para seu anúncio aparecer 1.000 vezes. Indica o custo de alcance.',
  'Frequência': 'Quantas vezes, em média, a mesma pessoa viu seu anúncio. Acima de 3× pode indicar saturação da audiência.',
  'CPC':        'Custo por Clique — quanto você paga cada vez que alguém clica no anúncio.',
}

function MetricTooltip({ metric }: { metric: string }) {
  const [show, setShow] = useState(false)
  const tip = METRIC_TIPS[metric]
  if (!tip) return null
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: '4px', cursor: 'help', verticalAlign: 'middle' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
      {show && (
        <span style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%',
          transform: 'translateX(-50%)',
          background: '#1C2440', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '8px', padding: '8px 10px',
          fontSize: '11px', color: 'rgba(255,255,255,0.75)',
          lineHeight: 1.5, whiteSpace: 'normal',
          width: '220px', zIndex: 100, pointerEvents: 'none',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          <strong style={{ color: '#A78BFA', display: 'block', marginBottom: '3px' }}>{metric}</strong>
          {tip}
        </span>
      )}
    </span>
  )
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 700, color: C.text1, margin: 0 }}>{title}</h3>
      {action && <span style={{ fontSize: '11px', color: C.purpleL, cursor: 'pointer', fontWeight: 500 }}>{action}</span>}
    </div>
  )
}

// ── Channel icon ──────────────────────────────────────────────────────────────
function getChannelIcon(ch: string) {
  const m: Record<string, string> = {
    'Meta': '📘', 'Facebook': '📘', 'Instagram': '📸', 'Google Search': '🔍',
    'Google Shopping': '🛒', 'Google PMAX': '🎯', 'YouTube': '▶️', 'TikTok': '🎵',
    'LinkedIn': '💼', 'Orgânico': '🌿', 'Email': '📧', 'WhatsApp': '💬',
    'Pinterest': '📌', 'Google Maps': '📍',
  }
  for (const [k, v] of Object.entries(m)) if (ch.toLowerCase().includes(k.toLowerCase())) return v
  return '📊'
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (d > 0) return `${d}d atrás`
  if (h > 0) return `${h}h atrás`
  if (m > 0) return `${m}min atrás`
  return 'agora'
}

// ─────────────────────────────────────────────────────────────────────────────
export function TabOverview({ strategy, analysis, clientData, onNavigate }: Props) {
  const niche  = clientData?.niche || ''
  const budget = clientData?.budget || 0
  const bench  = getBenchmark(niche)
  const proj   = bench && budget > 0 ? computeNicheProjection(bench, budget) : null

  const auditCache          = useAppStore(s => s.auditCache)
  const strategyData        = useAppStore(s => s.strategyData)
  const competitorStore     = useAppStore(s => s.competitors)
  const connectedAccounts   = useAppStore(s => s.connectedAccounts)
  const setClientData       = useAppStore(s => s.setClientData)
  const saveCurrentClient   = useAppStore(s => s.saveCurrentClient)
  const freshBenchmarks     = useAppStore(s => s.freshBenchmarks)
  const setFreshBenchmark   = useAppStore(s => s.setFreshBenchmark)
  const pendingActionsCache = useAppStore(s => s.pendingActionsCache)
  const clientHealthScores  = useAppStore(s => s.clientHealthScores)

  const [refreshing, setRefreshing]   = useState(false)
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<number>>(new Set())

  const key          = clientData?.clientName || ''
  const auditHistory = auditCache[key]
  const latestAudit  = Array.isArray(auditHistory) ? auditHistory[0]?.audit
    : (auditHistory && !Array.isArray(auditHistory) ? auditHistory : null)
  const rm = latestAudit?._realMetrics as {
    totalSpend: number; totalLeads: number; totalRevenue: number
    avgCPL: number | null; avgROAS: number | null; avgCTR: number | null
    campaignCount: number; dataSource: string
  } | undefined
  const prevTotals = latestAudit?._previousTotals as {
    spendDelta: number | null; leadsDelta: number | null; cplDelta: number | null
  } | undefined

  const hasRealData  = !!(rm && rm.totalSpend > 0 && rm.totalLeads > 0)
  const hasAIStrategy = strategy && strategy.priority_ranking?.length > 0
  const metaAccount   = connectedAccounts.find(a => a.platform === 'meta')
  const lastAuditTime = Array.isArray(auditHistory) && auditHistory[0]?.createdAt
    ? new Date(auditHistory[0].createdAt).getTime() : null

  // ── Health score (same logic as DashboardBody) ───────────────────────────
  const healthScore = useMemo(() => {
    let s = 30
    if (strategyData) { s += 25; if (Date.now() - new Date(strategyData.generatedAt || '').getTime() < 30*86400000) s += 10 }
    if (latestAudit) {
      s += 20
      if (rm) s += 10
      const criticals = (latestAudit.alerts || []).filter((a: any) => a.type === 'critical').length
      s = Math.max(0, s - criticals * 5)
    }
    return Math.min(100, s)
  }, [strategyData, latestAudit, rm])

  const scoreLabel = healthScore >= 90 ? 'Excelente' : healthScore >= 70 ? 'Saudável' : healthScore >= 45 ? 'Atenção' : 'Crítico'
  const scoreDesc  = healthScore >= 90
    ? 'Estrutura e performance acima da média. Continue monitorando.'
    : healthScore >= 70
    ? 'A conta está bem. Ainda há oportunidades para otimizar e escalar.'
    : healthScore >= 45
    ? 'Existem problemas importantes. Revise as campanhas e execute as ações.'
    : 'A conta precisa de ação urgente. Execute a auditoria e corrija os alertas críticos.'

  // ── KPI cards data ───────────────────────────────────────────────────────
  const kpiCards = (() => {
    if (hasRealData && rm) {
      const cplColor = bench
        ? rm.avgCPL! <= bench.kpi_thresholds.cpl_good ? C.green
          : rm.avgCPL! <= bench.kpi_thresholds.cpl_bad ? C.amber : C.red
        : C.amber
      const roasColor = rm.avgROAS && bench
        ? rm.avgROAS >= bench.kpi_thresholds.roas_good ? C.green
          : rm.avgROAS >= bench.kpi_thresholds.roas_good * 0.7 ? C.amber : C.red
        : C.blue
      return [
        {
          label: 'Investimento Real', value: rm.totalSpend >= 1000 ? `R$${(rm.totalSpend/1000).toFixed(1)}k` : `R$${rm.totalSpend}`,
          sub: `${rm.campaignCount} campanhas · ${rm.dataSource}`, color: C.red,
          trend: prevTotals?.spendDelta ?? undefined, base: rm.totalSpend,
          icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
        },
        {
          label: 'Leads Reais', value: rm.totalLeads.toLocaleString('pt-BR'),
          sub: bench ? `Benchmark CPL: R$${bench.cpl_min}–${bench.cpl_max}` : 'Dados da auditoria',
          color: C.green, trend: prevTotals?.leadsDelta ?? undefined, base: rm.totalLeads,
          icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
        },
        {
          label: 'ROAS Real', value: rm.avgROAS ? `${rm.avgROAS}×` : '—',
          sub: bench ? `Meta nicho: ${bench.kpi_thresholds.roas_good}×` : 'Retorno sobre investimento',
          color: roasColor, trend: undefined, base: (rm.avgROAS ?? 2) * 10,
          icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
        },
        {
          label: 'CPL Real', value: rm.avgCPL ? `R$${rm.avgCPL}` : '—',
          sub: bench ? `Benchmark: R$${bench.cpl_min}–${bench.cpl_max}` : 'Custo por lead',
          color: cplColor, trend: prevTotals?.cplDelta != null ? -prevTotals.cplDelta : undefined, base: rm.avgCPL ?? 100,
          icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
        },
        {
          label: 'CTR Médio', value: rm.avgCTR ? `${rm.avgCTR}%` : '—',
          sub: 'Cliques / Impressões da conta', color: C.purpleL, trend: undefined, base: (rm.avgCTR ?? 2) * 50,
          icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
        },
        {
          label: 'Score IA', value: `${healthScore}/100`,
          sub: scoreLabel, color: healthScore >= 70 ? C.green : healthScore >= 45 ? C.amber : C.red,
          trend: undefined, base: healthScore,
          icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
        },
      ]
    }
    if (proj && bench) {
      return [
        {
          label: 'Receita Est./mês', value: `R$${Math.round(proj.revenueMonth/1000)}k`,
          sub: `R$${Math.round(proj.revenueMin/1000)}k–R$${Math.round(proj.revenueMax/1000)}k/mês`,
          color: C.green, trend: undefined, base: proj.revenueMonth,
          icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
        },
        {
          label: 'Leads/mês Est.', value: `~${proj.leadsMonth.toLocaleString('pt-BR')}`,
          sub: `CPL médio R$${Math.round(proj.adjustedCPLAvg)}`, color: C.green,
          trend: undefined, base: proj.leadsMonth,
          icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
        },
        {
          label: 'ROAS Estimado', value: `${proj.roas}×`,
          sub: `Meta do nicho: ${bench.kpi_thresholds.roas_good}×`, color: C.blue,
          trend: undefined, base: proj.roas * 10,
          icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
        },
        {
          label: 'CPL Médio Est.', value: `R$${Math.round(proj.cplAvg)}`,
          sub: `Benchmark: R$${bench.cpl_min}–${bench.cpl_max}`,
          color: proj.cplAvg <= bench.kpi_thresholds.cpl_good ? C.green : proj.cplAvg <= bench.kpi_thresholds.cpl_bad ? C.amber : C.red,
          trend: undefined, base: proj.cplAvg,
          icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
        },
        {
          label: 'LTV por Cliente', value: `R$${Math.round(proj.ltv/1000)}k`,
          sub: `${bench.ltv_multiplier}× ticket médio`, color: C.purpleL,
          trend: undefined, base: proj.ltv,
          icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
        },
        {
          label: 'Score IA', value: `${healthScore}/100`,
          sub: scoreLabel, color: healthScore >= 70 ? C.green : healthScore >= 45 ? C.amber : C.red,
          trend: undefined, base: healthScore,
          icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
        },
      ]
    }
    // Sem dados reais nem projeção — mostra cards informativos (sem mock de outra empresa)
    return [
      { label: 'Investimento', value: '—', sub: 'Execute a auditoria', color: C.amber, trend: undefined, base: 0, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
      { label: 'Leads / mês',  value: '—', sub: bench ? `Benchmark CPL: R$${bench.cpl_min}–${bench.cpl_max}` : 'Conecte Meta ou Google Ads', color: C.green, trend: undefined, base: 0, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
      { label: 'CPL Médio',    value: clientData?.currentCPL ? `R$${clientData.currentCPL}` : '—', sub: bench ? `Benchmark: R$${bench.cpl_min}–${bench.cpl_max}` : 'Custo por lead', color: C.blue, trend: undefined, base: clientData?.currentCPL || 0, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> },
      { label: 'Score IA',     value: `${healthScore}/100`, sub: scoreLabel, color: healthScore >= 70 ? C.green : healthScore >= 45 ? C.amber : C.red, trend: undefined, base: healthScore, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
    ]
  })()

  // ── Funnel stages ────────────────────────────────────────────────────────
  const funnelStages = useMemo(() => {
    if (hasRealData && rm) {
      const impressions = rm.totalLeads * 60
      const clicks      = Math.round(rm.totalLeads * (rm.avgCTR ? 100 / rm.avgCTR : 25))
      return [
        { label: 'Impressões',  value: impressions, pct: '100%',  color: C.purple },
        { label: 'Cliques',     value: clicks,      pct: rm.avgCTR ? `${rm.avgCTR}%` : '~4%', color: C.blue },
        { label: 'Leads',       value: rm.totalLeads, pct: `${((rm.totalLeads/clicks)*100).toFixed(1)}%`, color: C.green },
        { label: 'Conversões',  value: Math.round(rm.totalLeads * 0.25), pct: '~25%', color: C.amber },
      ]
    }
    if (proj) {
      return [
        { label: 'Impressões',  value: proj.leadsMonth * 120, pct: '100%', color: C.purple },
        { label: 'Cliques',     value: proj.leadsMonth * 20,  pct: '~1.7%', color: C.blue },
        { label: 'Leads',       value: proj.leadsMonth,       pct: '~5%',   color: C.green },
        { label: 'Vendas Est.', value: proj.salesMonth,       pct: `${(bench!.cvr_lead_to_sale*100).toFixed(0)}%`, color: C.amber },
      ]
    }
    return []
  }, [hasRealData, rm, proj, bench])

  // ── Channels ─────────────────────────────────────────────────────────────
  const channels = useMemo(() => {
    if (hasAIStrategy) {
      return strategy.priority_ranking.slice(0, 5).map((ch: any) => {
        // Prefer per-channel CPL from benchmark over the strategy's generic cpl_avg
        let cpl = Math.round(ch.cpl_avg ?? ch.cpl_min ?? 0)
        if (bench) {
          const channelKey = Object.keys(bench.cpl_by_channel).find(k =>
            (ch.channel ?? '').toLowerCase().includes(k.toLowerCase()) ||
            k.toLowerCase().includes((ch.channel ?? '').toLowerCase())
          )
          if (channelKey) {
            const parts = bench.cpl_by_channel[channelKey].replace(/R\$/g, '').split('–')
            const lo = parseInt(parts[0], 10)
            const hi = parts[1] ? parseInt(parts[1], 10) : lo
            if (!isNaN(lo)) cpl = Math.round((lo + (!isNaN(hi) ? hi : lo)) / 2)
          }
        }
        return {
          name: ch.channel, icon: getChannelIcon(ch.channel),
          leads: `${ch.leads_min ?? '?'}–${ch.leads_max ?? '?'}`,
          cpl,
          budget: ch.budget_brl ? `R$${ch.budget_brl.toLocaleString('pt-BR')}` : '—',
        }
      })
    }
    if (bench) {
      return bench.best_channels.slice(0, 4).map((ch) => {
        const range = bench.cpl_by_channel[ch] || `R$${bench.cpl_min}–${bench.cpl_max}`
        const [minStr] = range.replace('R$','').split('–')
        const cplVal = parseInt(minStr, 10) || bench.cpl_min || 1
        return { name: ch, icon: getChannelIcon(ch), leads: proj ? `~${Math.round((budget/bench.best_channels.length)/cplVal)}` : '—', cpl: cplVal, budget: proj ? `R$${Math.round(budget/bench.best_channels.length).toLocaleString('pt-BR')}` : '—' }
      })
    }
    return []
  }, [hasAIStrategy, strategy, bench, proj, budget])

  // ── Insights (smart alerts → cards) ──────────────────────────────────────
  const insights = useMemo(() => {
    const list: { icon: string; title: string; desc: string; color: string; action?: string }[] = []
    if (rm?.avgCPL && bench?.kpi_thresholds.cpl_bad && rm.avgCPL > bench.kpi_thresholds.cpl_bad) {
      list.push({ icon: '🚨', title: 'CPL Acima do Limite', desc: `Seu CPL R$${rm.avgCPL} está acima do benchmark. Revise audiências e criativos.`, color: C.red, action: 'Ver auditoria' })
    }
    if (strategyData?.generatedAt && (Date.now() - new Date(strategyData.generatedAt).getTime()) > 30*86400000) {
      list.push({ icon: '⚡', title: 'Estratégia Desatualizada', desc: 'Sua estratégia tem mais de 30 dias. Gere uma nova com os dados atuais.', color: C.amber, action: 'Atualizar estratégia' })
    }
    if (lastAuditTime && Date.now() - lastAuditTime > 7*86400000) {
      list.push({ icon: '🔄', title: 'Auditoria Pendente', desc: 'Última auditoria há mais de 7 dias. Execute para dados atualizados.', color: C.blue, action: 'Auditar agora' })
    }
    if (!metaAccount && !rm) {
      list.push({ icon: '🔗', title: 'Conecte seus Anúncios', desc: 'Integre Meta Ads ou Google Ads para substituir estimativas por dados reais.', color: C.purple, action: 'Conectar conta' })
    }
    if (rm?.avgCPL && bench && rm.avgCPL < bench.kpi_thresholds.cpl_good) {
      list.push({ icon: '📈', title: 'Oportunidade de Escala', desc: `CPL R$${rm.avgCPL} abaixo do benchmark. Considere aumentar o orçamento 20–30%.`, color: C.green, action: 'Ver projeção' })
    }
    if (hasAIStrategy && strategy.recommendation) {
      list.push({ icon: '🧠', title: 'Recomendação IA', desc: String(strategy.recommendation).slice(0, 120) + '...', color: C.purpleL, action: 'Ver estratégia' })
    }
    if (list.length === 0) {
      list.push({ icon: '✅', title: 'Conta Saudável', desc: 'Nenhum alerta crítico detectado. Continue monitorando as métricas.', color: C.green })
      list.push({ icon: '💡', title: 'Dica do Sistema', desc: 'Execute a auditoria periodicamente para manter os dados atualizados.', color: C.blue })
    }
    return list.slice(0, 5)
  }, [rm, bench, strategyData, lastAuditTime, metaAccount, hasAIStrategy, strategy])

  // ── Pulse feed ───────────────────────────────────────────────────────────
  const pulseItems = useMemo(() => {
    const items: { icon: string; title: string; desc: string; time: string; color: string }[] = []
    if (strategyData?.generatedAt) items.push({ icon: '⚡', title: 'Estratégia gerada', desc: `Plano para ${clientData?.clientName || 'cliente'}`, time: strategyData.generatedAt, color: C.amber })
    const latestEntry = Array.isArray(auditHistory) ? auditHistory[0] : null
    if (latestEntry?.createdAt) items.push({ icon: '🔍', title: 'Auditoria realizada', desc: 'Dados reais sincronizados', time: latestEntry.createdAt, color: C.green })
    for (const c of (competitorStore[key] || []).filter((c: any) => c.analyzedAt)) {
      items.push({ icon: '🎯', title: `Concorrente: ${c.name}`, desc: 'Radar competitivo atualizado', time: c.analyzedAt as string, color: C.purpleL })
    }
    if (metaAccount) items.push({ icon: '🔗', title: 'Meta Ads conectado', desc: metaAccount.accountName || 'Conta vinculada', time: metaAccount.connectedAt, color: '#1877F2' })
    return items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5)
  }, [strategyData, auditHistory, competitorStore, connectedAccounts, key, clientData])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: C.text1, margin: 0, letterSpacing: '-0.02em' }}>
            Visão Geral
          </h1>
          <p style={{ fontSize: '12px', color: C.text3, margin: '3px 0 0', fontWeight: 400 }}>
            {clientData?.clientName
              ? `Aqui está o resumo completo da performance de ${clientData.clientName}`
              : 'Selecione um cliente para ver os dados completos das campanhas'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {hasRealData ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '7px',
              background: 'rgba(34,197,94,0.1)', color: C.green, border: '1px solid rgba(34,197,94,0.2)',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.green, display: 'inline-block', animation: 'pulseDot 2s infinite' }} />
              Dados reais · {rm?.campaignCount} campanhas
            </span>
          ) : (
            <span style={{
              fontSize: '11px', color: C.amber,
              background: 'rgba(245,165,0,0.08)', border: '1px solid rgba(245,165,0,0.2)',
              borderRadius: '7px', padding: '4px 10px', fontWeight: 600,
            }}>
              ⚠ Execute a Auditoria para dados reais
            </span>
          )}
        </div>
      </div>

      {/* ── O que fazer agora (exibido apenas quando não há dados reais) ── */}
      {!hasRealData && !latestAudit && clientData?.clientName && (
        <div style={{
          background: 'rgba(124,58,237,0.04)', border: '1px solid rgba(124,58,237,0.15)',
          borderRadius: '14px', padding: '20px 24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '14px' }}>🎯</span>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: C.text1, margin: 0 }}>O que fazer agora</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {[
              { step: '1', title: 'Conecte seus dados', desc: 'Ligue Meta Ads ou Google Ads para importar campanhas reais.', tab: 'analise', cta: 'Conectar conta', color: '#38BDF8' },
              { step: '2', title: 'Rode a Análise Profunda', desc: 'Gere o diagnóstico completo da conta — score, alertas e oportunidades.', tab: 'analise', cta: 'Ir para Análise', color: '#A78BFA' },
              { step: '3', title: 'Gere sua Estratégia', desc: 'A IA cria um plano de 90 dias com canais, CPL-alvo e ações.', tab: 'strategy', cta: 'Ir para Estratégia', color: '#F0B429' },
            ].map(item => (
              <div key={item.step} style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: '10px', padding: '14px',
                display: 'flex', flexDirection: 'column', gap: '6px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                    background: `${item.color}18`, border: `1px solid ${item.color}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 800, color: item.color,
                  }}>{item.step}</div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: C.text1 }}>{item.title}</span>
                </div>
                <div style={{ fontSize: '11px', color: C.text3, lineHeight: 1.5, flex: 1 }}>{item.desc}</div>
                <button
                  onClick={() => onNavigate?.(item.tab)}
                  style={{
                    marginTop: '4px', padding: '6px 12px', borderRadius: '7px',
                    background: `${item.color}12`, border: `1px solid ${item.color}30`,
                    color: item.color, fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                    textAlign: 'left', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = `${item.color}22`}
                  onMouseLeave={e => e.currentTarget.style.background = `${item.color}12`}
                >
                  {item.cta} →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── KPI Cards — 6 colunas ──────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px',
      }}>
        {kpiCards.map((k, i) => (
          <KpiCard
            key={k.label}
            label={k.label}
            value={k.value}
            sub={k.sub}
            color={k.color}
            trend={(k as any).trend}
            sparkSeed={k.label + (clientData?.clientName || '')}
            sparkBase={k.base ?? 0}
            icon={k.icon}
          />
        ))}
      </div>

      {/* ── Ações críticas pendentes (ou call-to-action para executar auditoria) ── */}
      {(() => {
        const pending = (pendingActionsCache[key] || []).filter(a => a.status === 'pendente')
        const critical = pending.filter(a => a.urgency === 'critica' || a.urgency === 'alta')
        if (!critical.length) {
          // Mostra call-to-action somente quando não há auditoria e nem dados reais
          if (!latestAudit && !hasRealData) {
            return (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                background: 'rgba(124,58,237,0.04)', border: '1px solid rgba(124,58,237,0.15)',
                borderRadius: '14px', padding: '16px 20px',
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                  background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                }}>🔍</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: C.text1, marginBottom: '2px' }}>
                    Nenhuma ação prioritária gerada
                  </div>
                  <div style={{ fontSize: '11px', color: C.text3, lineHeight: 1.5 }}>
                    Execute uma auditoria para gerar ações prioritárias automaticamente com base nos seus dados reais.
                  </div>
                </div>
              </div>
            )
          }
          return null
        }
        const storedScore = clientHealthScores[key]
        return (
          <div style={{
            background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '14px', padding: '18px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>🚨</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: C.text1 }}>
                    {critical.length} ação{critical.length > 1 ? 'ões' : ''} de alta prioridade pendente{critical.length > 1 ? 's' : ''}
                  </div>
                  {storedScore && (
                    <div style={{ fontSize: '11px', color: C.text3 }}>Score da conta: {storedScore.score}/100 ({storedScore.grade})</div>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {critical.slice(0, 4).map((action) => (
                <div key={action.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  background: C.surface, borderRadius: '10px', padding: '10px 14px',
                  border: `1px solid ${action.urgency === 'critica' ? 'rgba(239,68,68,0.2)' : 'rgba(249,115,22,0.2)'}`,
                  borderLeft: `3px solid ${action.urgency === 'critica' ? C.red : '#F97316'}`,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: C.text1, marginBottom: '2px' }}>{action.title}</div>
                    {action.impact && (
                      <div style={{ fontSize: '10px', color: C.text3 }}>Impacto: {action.impact}</div>
                    )}
                  </div>
                  <span style={{
                    fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px', flexShrink: 0,
                    background: action.urgency === 'critica' ? 'rgba(239,68,68,0.12)' : 'rgba(249,115,22,0.12)',
                    color: action.urgency === 'critica' ? C.red : '#F97316',
                    border: `1px solid ${action.urgency === 'critica' ? 'rgba(239,68,68,0.3)' : 'rgba(249,115,22,0.3)'}`,
                  }}>
                    {action.urgency === 'critica' ? 'CRÍTICA' : 'ALTA'}
                  </span>
                </div>
              ))}
              {critical.length > 4 && (
                <div style={{ fontSize: '11px', color: C.text3, textAlign: 'center', paddingTop: '4px' }}>
                  + {critical.length - 4} ações — veja em Ações Prioritárias
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* ── Row 2: Chart + Funnel + Score ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px 200px', gap: '14px', alignItems: 'stretch' }}>

        {/* Performance chart — RevenueChart is self-contained card */}
        <RevenueChart
          data={proj?.chartData}
          title="Performance ao longo do tempo"
          subtitle={hasRealData ? `${rm?.campaignCount} campanhas · ${rm?.dataSource}` : proj ? `Projeção 6 meses · R$${Math.round(proj.revenueMonth/1000)}k/mês` : ''}
        />

        {/* Funnel */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '20px' }}>
          <SectionHeader title="Funil de Conversão" />
          {funnelStages.length > 0
            ? <FunnelViz stages={funnelStages} />
            : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: C.text3, fontSize: '12px', lineHeight: 1.6 }}>
                Execute a auditoria com dados reais<br />para ver o funil de conversão
              </div>
            )
          }
        </div>

        {/* AI Score */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: C.text2, marginBottom: '16px', textAlign: 'center' }}>
            Score de Saúde da Conta
          </div>
          <ScoreGauge score={healthScore} label={scoreLabel} description={scoreDesc} />
        </div>
      </div>

      {/* ── Row 3: Top campanhas + Canais ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

        {/* Top campanhas */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '20px' }}>
          <SectionHeader title="Top Campanhas" />
          <div style={{ textAlign: 'center', padding: '24px 0', color: C.text3, fontSize: '12px', lineHeight: 1.6 }}>
            {hasRealData
              ? <>Dados por campanha disponíveis em<br /><strong style={{ color: C.text2 }}>Diagnóstico → Análise Profunda</strong></>
              : <>Conecte Meta Ads ou Google Ads<br />para ver o desempenho por campanha</>
            }
          </div>
        </div>

        {/* Canais recomendados */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '20px' }}>
          <SectionHeader title={hasAIStrategy ? 'Canais Recomendados · IA' : bench ? `Melhores Canais · ${bench.name}` : 'Canais Ativos'} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {channels.slice(0, 4).map((ch: any) => (
              <div key={ch.name} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 10px', borderRadius: '9px',
                background: C.elevated, border: `1px solid ${C.border}`,
                transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = C.purpleB)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
              >
                <span style={{ fontSize: '18px', flexShrink: 0 }}>{ch.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: C.text1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.name}</div>
                  <div style={{ fontSize: '10px', color: C.text3 }}>{ch.leads} leads/mês</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: C.amber }}>R${ch.cpl}</div>
                  <div style={{ fontSize: '9px', color: C.text3 }}>CPL</div>
                </div>
                <span style={{
                  fontSize: '9px', fontWeight: 700, color: C.green,
                  background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                  borderRadius: '5px', padding: '2px 6px', flexShrink: 0,
                }}>Ativo</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Insights da IA ────────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: C.purpleD, border: `1px solid ${C.purpleB}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
            }}>✨</div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: C.text1, margin: 0 }}>Insights da IA</h3>
          </div>
          <span style={{ fontSize: '11px', color: C.purpleL, cursor: 'pointer', fontWeight: 500 }}>Ver todos os insights</span>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
        }}>
          {insights.map((ins, i) => (
            <InsightCard key={i} {...ins} onNavigate={onNavigate} />
          ))}
        </div>
      </div>

      {/* ── Benchmark CPL radar ─────────────────────────────────────────── */}
      {bench && (rm?.avgCPL || proj) && (() => {
        const userCPL  = rm?.avgCPL ?? proj?.adjustedCPLAvg ?? 0
        const freshB   = freshBenchmarks[niche.toLowerCase()]
        const isFresh  = !!(freshB && (Date.now() - new Date(freshB.fetchedAt).getTime()) < 24*3600000)
        const benchMin = isFresh ? freshB!.cpl_min : bench.cpl_min
        const benchMax = isFresh ? freshB!.cpl_max : bench.cpl_max
        const benchMid = (benchMin + benchMax) / 2
        const maxBar   = Math.max(userCPL, benchMax) * 1.2
        const userPct  = Math.min((userCPL / maxBar) * 100, 100)
        const cplStatus = userCPL <= bench.kpi_thresholds.cpl_good ? { label: 'Abaixo do benchmark ✓', color: C.green }
          : userCPL <= bench.kpi_thresholds.cpl_bad ? { label: 'Dentro do benchmark', color: C.amber }
          : { label: 'Acima do benchmark ⚠', color: C.red }
        return (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: C.text1 }}>📊 CPL · Você vs. Benchmark</div>
                <div style={{ fontSize: '11px', color: C.text3, marginTop: '2px' }}>
                  {isFresh ? `via web · ${timeAgo(freshB!.fetchedAt)} · ${freshB!.confidence}` : `${bench.name} · benchmark interno`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '7px', color: cplStatus.color, background: `${cplStatus.color}15`, border: `1px solid ${cplStatus.color}30` }}>{cplStatus.label}</span>
                <button onClick={async () => {
                  if (!niche || refreshing) return
                  setRefreshing(true)
                  try {
                    const res = await fetch('/api/benchmarks/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ niche }) })
                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error)
                    setFreshBenchmark(niche.toLowerCase(), data)
                  } catch {}
                  setRefreshing(false)
                }} style={{
                  fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '7px', cursor: 'pointer',
                  background: C.purpleD, border: `1px solid ${C.purpleB}`, color: C.purpleL, transition: 'all 0.15s',
                }}>
                  {refreshing ? '⏳ Buscando...' : '🔄 Atualizar'}
                </button>
              </div>
            </div>
            {/* Bar */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ height: '10px', background: C.elevated, borderRadius: '99px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', height: '100%', background: `${C.green}30`, left: `${(benchMin/maxBar)*100}%`, width: `${((benchMax-benchMin)/maxBar)*100}%`, borderRadius: '99px' }} />
                <div style={{ height: '100%', background: cplStatus.color, borderRadius: '99px', width: `${userPct}%`, transition: 'width 1s ease', boxShadow: `0 0 8px ${cplStatus.color}60` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: C.text3 }}>
                <span>R${benchMin}</span>
                <span style={{ color: C.green, fontWeight: 700 }}>R${Math.round(benchMid)} ★ benchmark</span>
                <span>R${benchMax}</span>
              </div>
            </div>
            {/* 3 metric mini-cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {[
                { label: 'Seu CPL', value: `R$${Math.round(userCPL)}`, sub: rm?.avgCPL ? 'dados reais' : 'projeção', color: cplStatus.color },
                { label: 'Benchmark', value: `R$${Math.round(benchMid)}`, sub: 'média do nicho', color: C.green },
                { label: 'CPL Máx. Lucrativo', value: clientData?.ticketPrice && clientData?.grossMargin && clientData?.conversionRate
                  ? `R$${Math.round(clientData.ticketPrice * (clientData.grossMargin/100) * (clientData.conversionRate/100))}`
                  : `R$${bench.kpi_thresholds.cpl_good}`, sub: clientData?.ticketPrice ? 'calculado' : 'benchmark', color: C.purpleL },
              ].map(m => (
                <div key={m.label} style={{ background: C.elevated, borderRadius: '10px', padding: '12px', textAlign: 'center', border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: '10px', color: C.text3, marginBottom: '4px', fontWeight: 500 }}>{m.label}</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: m.color }}>{m.value}</div>
                  <div style={{ fontSize: '10px', color: C.text3, marginTop: '2px' }}>{m.sub}</div>
                </div>
              ))}
            </div>
            {/* Métricas extras via Tavily — exibidas apenas quando disponíveis no freshBenchmark */}
            {isFresh && (freshB!.cpc_avg || freshB!.ctr_avg || freshB!.cpm_avg || freshB!.cpa_avg) && (
              <div style={{ marginTop: '12px', borderTop: `1px solid ${C.border}`, paddingTop: '12px' }}>
                <div style={{ fontSize: '10px', color: C.text3, marginBottom: '8px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Métricas de canal · busca web em tempo real
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {[
                    { label: 'CPC médio',   value: freshB!.cpc_avg  ? `R$${freshB!.cpc_avg.toFixed(2)}`  : null },
                    { label: 'CTR médio',   value: freshB!.ctr_avg  ? `${freshB!.ctr_avg.toFixed(1)}%`   : null },
                    { label: 'CPM médio',   value: freshB!.cpm_avg  ? `R$${freshB!.cpm_avg.toFixed(2)}`  : null },
                    { label: 'CPA médio',   value: freshB!.cpa_avg  ? `R$${freshB!.cpa_avg}`             : null },
                  ].filter(m => m.value !== null).map(m => (
                    <div key={m.label} style={{ background: C.elevated, borderRadius: '8px', padding: '8px', textAlign: 'center', border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: '9px', color: C.text3, marginBottom: '3px', fontWeight: 500 }}>{m.label}</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: C.purpleL }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {/* ── Sistema ao Vivo ──────────────────────────────────────────────── */}
      {pulseItems.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: C.green, display: 'inline-block', animation: 'pulseDot 2s infinite', flexShrink: 0 }} />
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: C.text1, margin: 0 }}>Sistema ao Vivo</h3>
            {lastAuditTime && (
              <span style={{ marginLeft: 'auto', fontSize: '10px', color: C.text3 }}>
                última sync {timeAgo(new Date(lastAuditTime).toISOString())}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pulseItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
                  background: `${item.color}15`, border: `1px solid ${item.color}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
                }}>{item.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: C.text1 }}>{item.title}</div>
                  <div style={{ fontSize: '11px', color: C.text3, marginTop: '1px' }}>{item.desc}</div>
                </div>
                <div style={{ fontSize: '10px', color: C.text3, flexShrink: 0 }}>{timeAgo(item.time)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Insights do nicho ────────────────────────────────────────────── */}
      {bench && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: C.text1, margin: 0 }}>
              💡 Insights de Mercado · {bench.name}
            </h3>
            {bench.seasonality.length > 0 && (
              <span style={{
                fontSize: '11px', padding: '3px 10px', borderRadius: '6px', fontWeight: 600,
                background: 'rgba(245,165,0,0.1)', color: C.amber, border: '1px solid rgba(245,165,0,0.25)',
              }}>
                Pico: {bench.seasonality.join(' · ')}
              </span>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
            {bench.insights.map((ins, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '8px',
                background: C.elevated, borderRadius: '10px', padding: '10px 12px',
                border: `1px solid ${C.border}`,
              }}>
                <span style={{ color: C.amber, flexShrink: 0, marginTop: '1px', fontSize: '12px' }}>→</span>
                <span style={{ fontSize: '12px', color: C.text2, lineHeight: 1.5 }}>{ins}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
