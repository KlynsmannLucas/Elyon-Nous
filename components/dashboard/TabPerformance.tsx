// components/dashboard/TabPerformance.tsx
'use client'

import { useState } from 'react'
import { StatCard } from './StatCard'
import { getNicheContent } from '@/lib/niche_content'
import { getBenchmark, computeNicheProjection } from '@/lib/niche_benchmarks'
import { useAppStore } from '@/lib/store'
import type { ClientData, CampaignRecord } from '@/lib/store'

interface Props {
  clientData: ClientData | null
}

const C = {
  bg:       '#080D1A',
  surface:  '#0F1629',
  elevated: '#131E35',
  border:   'rgba(99,120,255,0.1)',
  purple:   '#7C3AED',
  purpleL:  '#A78BFA',
  green:    '#22C55E',
  greenBg:  'rgba(34,197,94,0.1)',
  red:      '#EF4444',
  redBg:    'rgba(239,68,68,0.1)',
  blue:     '#38BDF8',
  blueBg:   'rgba(56,189,248,0.1)',
  gold:     '#F59E0B',
  goldBg:   'rgba(245,158,11,0.1)',
  orange:   '#F97316',
  text1:    '#F1F5F9',
  text2:    'rgba(255,255,255,0.5)',
  text3:    'rgba(255,255,255,0.25)',
}

const card: React.CSSProperties = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 14,
  padding: 20,
}

function TrendChart({ points, color, label, format }: {
  points: { x: string; y: number }[]
  color: string
  label: string
  format: (v: number) => string
}) {
  if (points.length < 2) return null
  const W = 100, H = 50, PAD = 4
  const ys = points.map(p => p.y)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const rangeY = maxY - minY || 1
  const toX = (i: number) => PAD + (i / (points.length - 1)) * (W - PAD * 2)
  const toY = (v: number) => PAD + (1 - (v - minY) / rangeY) * (H - PAD * 2)
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(p.y).toFixed(1)}`).join(' ')
  const last = points[points.length - 1]
  const prev = points[points.length - 2]
  const delta = last.y - prev.y
  const deltaColor = label.includes('CPL') ? (delta <= 0 ? C.green : C.red) : (delta >= 0 ? C.green : C.red)

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4, color }}>{format(last.y)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: deltaColor }}>
            {delta > 0 ? '▲' : '▼'} {format(Math.abs(delta))}
          </div>
          <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>vs período anterior</div>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 64 }}>
        <path
          d={`${d} L${toX(points.length - 1).toFixed(1)},${(H - PAD).toFixed(1)} L${PAD},${(H - PAD).toFixed(1)} Z`}
          fill={color} opacity={0.06}
        />
        <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={toX(i)} cy={toY(p.y)} r="1.8" fill={color} />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        {[points[0], points[points.length - 1]].map((p, i) => (
          <span key={i} style={{ fontSize: 10, color: C.text3 }}>{p.x}</span>
        ))}
      </div>
    </div>
  )
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? C.green : score >= 60 ? C.gold : C.red
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 6, background: C.elevated, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 4, transition: 'all 0.7s', width: `${score}%`, background: color }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, width: 28, textAlign: 'right', color }}>{score}</span>
    </div>
  )
}

function SimuladorCenarios({ clientData }: { clientData: ClientData | null }) {
  const niche      = clientData?.niche || ''
  const bench      = getBenchmark(niche)
  const initBudget = clientData?.budget || 5000
  const initTicket = clientData?.ticketPrice || bench?.avg_ticket || 1500
  const initMargin = clientData?.grossMargin || 40

  const [budget,   setBudget]   = useState(initBudget)
  const [ticket,   setTicket]   = useState(initTicket)
  const [margin,   setMargin]   = useState(initMargin)
  const [scenIdx,  setScenIdx]  = useState<0 | 1 | 2>(1)

  if (!bench) return null

  const benchCVR = clientData?.conversionRate
    ? clientData.conversionRate / 100
    : bench.cvr_lead_to_sale
  const ltv = bench.ltv_multiplier

  const SCENES = [
    {
      key: 'conservador', label: 'Conservador', emoji: '🛡',
      desc: 'Início ou mercado competitivo',
      color: C.text2, glow: 'rgba(148,163,184,0.07)', border: 'rgba(148,163,184,0.25)',
      cplCalc: () => bench.cpl_max * 1.20,
      cvrFactor: 0.65, efficiency: 0.82,
    },
    {
      key: 'recomendado', label: 'Recomendado', emoji: '⚡',
      desc: 'Estratégia sólida · benchmark do nicho',
      color: C.gold, glow: 'rgba(245,158,11,0.09)', border: 'rgba(245,158,11,0.38)',
      cplCalc: () => (bench.cpl_min + bench.cpl_max) / 2,
      cvrFactor: 1.00, efficiency: 0.91,
    },
    {
      key: 'agressivo', label: 'Agressivo', emoji: '🚀',
      desc: 'Funil otimizado + criativos vencedores',
      color: C.green, glow: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.30)',
      cplCalc: () => bench.cpl_min * 0.78,
      cvrFactor: 1.35, efficiency: 0.96,
    },
  ]

  function calcScene(i: 0 | 1 | 2) {
    const s            = SCENES[i]
    const cpl          = Math.max(s.cplCalc(), 1)
    const activeBudget = budget * s.efficiency
    const leads        = Math.round(activeBudget / cpl)
    const cvr          = Math.min(benchCVR * s.cvrFactor, 1)
    const sales        = +(leads * cvr).toFixed(1)
    const revenue      = Math.round(sales * ticket)
    const roas         = budget > 0 ? +(revenue / budget).toFixed(2) : 0
    const ltvRevenue   = Math.round(sales * ticket * ltv)
    const profit       = Math.round(revenue * (margin / 100) - budget)
    const breakEvenSales = margin > 0 ? budget / (ticket * (margin / 100)) : 0
    const breakEvenMet   = sales >= breakEvenSales
    return { cpl: Math.round(cpl), leads, sales, revenue, roas, ltvRevenue, profit, cvr: +(cvr * 100).toFixed(1), breakEvenSales: +breakEvenSales.toFixed(1), breakEvenMet }
  }

  const all = ([0, 1, 2] as const).map(i => calcScene(i))
  const cur = all[scenIdx]
  const sc  = SCENES[scenIdx]

  const rampFactors = [0.55, 0.70, 0.83, 0.92, 0.97, 1.00]
  const rampLabels  = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6']

  const fmtR = (v: number) =>
    v >= 1_000_000 ? `R$${(v / 1_000_000).toFixed(1)}M`
    : v >= 1000    ? `R$${(v / 1000).toFixed(0)}K`
    :                `R$${v.toLocaleString('pt-BR')}`

  return (
    <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '18px 24px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: `${C.gold}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>🎯</div>
        <div>
          <div style={{ fontWeight: 700, color: C.text1, fontSize: 14 }}>Simulador de Cenários</div>
          <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>
            Projeção mensal baseada nos benchmarks de {niche || 'seu nicho'}
          </div>
        </div>
        <div style={{
          marginLeft: 'auto', padding: '6px 12px', borderRadius: 20,
          fontSize: 10, fontWeight: 700,
          background: C.goldBg, border: `1px solid rgba(245,158,11,0.2)`, color: C.gold,
        }}>
          CPL bench: R${bench.cpl_min}–R${bench.cpl_max}
        </div>
      </div>

      {/* Sliders */}
      <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.border}`, background: C.bg }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            { label: 'Orçamento mensal', value: `R$${budget.toLocaleString('pt-BR')}`, min: 500, max: 100000, step: 500, val: budget, setter: setBudget, color: C.gold, minL: 'R$500', maxL: 'R$100K' },
            { label: 'Ticket médio', value: `R$${ticket.toLocaleString('pt-BR')}`, min: 100, max: 50000, step: 100, val: ticket, setter: setTicket, color: C.purpleL, minL: 'R$100', maxL: 'R$50K' },
            { label: 'Margem bruta', value: `${margin}%`, min: 10, max: 90, step: 5, val: margin, setter: setMargin, color: C.green, minL: '10%', maxL: '90%' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text1 }}>{s.value}</span>
              </div>
              <input type="range" min={s.min} max={s.max} step={s.step} value={s.val}
                onChange={e => s.setter(Number(e.target.value))}
                style={{ width: '100%', height: 6, borderRadius: 4, cursor: 'pointer', accentColor: s.color }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.text3, marginTop: 4 }}>
                <span>{s.minL}</span><span>{s.maxL}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scenario pills */}
      <div style={{
        padding: '16px 24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12, borderBottom: `1px solid ${C.border}`,
      }}>
        {SCENES.map((s, i) => (
          <button key={s.key} onClick={() => setScenIdx(i as 0|1|2)}
            style={{
              position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 4, paddingTop: 20, paddingBottom: 16, borderRadius: 14, textAlign: 'center',
              cursor: 'pointer', transition: 'all 0.2s',
              background:  scenIdx === i ? s.glow : C.elevated,
              border:      `1.5px solid ${scenIdx === i ? s.border : C.border}`,
              boxShadow:   scenIdx === i ? `0 0 24px ${s.glow}` : 'none',
            }}>
            {i === 1 && (
              <span style={{
                position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                padding: '2px 8px', borderRadius: 20, fontSize: 9, fontWeight: 700,
                background: C.gold, color: '#000',
              }}>
                RECOMENDADO
              </span>
            )}
            <span style={{ fontSize: 24 }}>{s.emoji}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: scenIdx === i ? s.color : C.text3 }}>{s.label}</span>
            <span style={{ fontSize: 10, color: C.text3, padding: '0 8px', lineHeight: 1.4 }}>{s.desc}</span>
            <div style={{ marginTop: 8, fontWeight: 700, fontSize: 18, color: s.color }}>
              {fmtR(all[i].revenue)}
              <span style={{ fontSize: 10, fontWeight: 400, color: C.text3 }}>/mês</span>
            </div>
          </button>
        ))}
      </div>

      {/* Active scenario detail */}
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 4 KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Leads / mês',    value: cur.leads.toString(),            color: C.blue,   sub: `CPL alvo: R$${cur.cpl}` },
            { label: 'Vendas / mês',   value: cur.sales.toString(),            color: sc.color, sub: `CVR: ${cur.cvr}%` },
            { label: 'Receita / mês',  value: fmtR(cur.revenue),              color: C.gold,   sub: `ROAS: ${cur.roas}×` },
            { label: 'Lucro bruto',    value: fmtR(Math.max(0, cur.profit)),   color: cur.profit > 0 ? C.green : C.red, sub: cur.profit > 0 ? `margem aplicada: ${margin}%` : 'abaixo do break-even' },
          ].map(k => (
            <div key={k.label} style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* CPL position bar */}
        <div style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Posição do CPL alvo no benchmark</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: sc.color }}>R${cur.cpl} / lead</span>
          </div>
          <div style={{ position: 'relative', height: 8, background: C.bg, borderRadius: 4 }}>
            {(() => {
              const scale  = bench.cpl_max * 1.6
              const minPct = Math.min((bench.cpl_min / scale) * 100, 90)
              const maxPct = Math.min((bench.cpl_max / scale) * 100, 90)
              const curPct = Math.min(Math.max((cur.cpl  / scale) * 100, 2), 96)
              return (
                <>
                  <div style={{
                    position: 'absolute', height: '100%', borderRadius: 4, opacity: 0.3,
                    left: `${minPct}%`, width: `${maxPct - minPct}%`,
                    background: 'linear-gradient(90deg,#22C55E,#F59E0B,#EF4444)',
                  }} />
                  <div style={{
                    position: 'absolute', width: 14, height: 14, borderRadius: '50%',
                    border: `2px solid ${C.surface}`, background: sc.color,
                    left: `${curPct}%`, top: '50%', transform: 'translate(-50%,-50%)',
                  }} />
                </>
              )
            })()}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.text3, marginTop: 8 }}>
            <span>R$0</span>
            <span>Benchmark: R${bench.cpl_min}–R${bench.cpl_max}</span>
            <span>R${Math.round(bench.cpl_max * 1.6)}</span>
          </div>
        </div>

        {/* Break-even + LTV */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Break-even mensal</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: cur.breakEvenMet ? C.green : C.gold }}>
              {cur.breakEvenSales.toFixed(1)}{' '}
              <span style={{ fontSize: 13, fontWeight: 400, color: C.text3 }}>vendas p/ cobrir o gasto</span>
            </div>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 6, background: C.bg, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4, transition: 'all 0.5s',
                  width: `${Math.min((cur.sales / Math.max(cur.breakEvenSales, 0.1)) * 100, 100)}%`,
                  background: cur.breakEvenMet ? C.green : C.gold,
                }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', color: cur.breakEvenMet ? C.green : C.gold }}>
                {cur.sales} / {cur.breakEvenSales.toFixed(1)}
              </span>
            </div>
            <div style={{ fontSize: 10, marginTop: 8, color: cur.breakEvenMet ? C.green : C.text2 }}>
              {cur.breakEvenMet ? '✓ Projeção cobre o investimento' : '⚠ Abaixo do break-even — aumente o ticket ou a margem'}
            </div>
          </div>

          <div style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Valor real por cliente (LTV)</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.purpleL }}>{fmtR(cur.ltvRevenue)}</div>
            <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>
              {cur.sales} clientes × R${ticket.toLocaleString('pt-BR')} × {ltv}× LTV
            </div>
            <div style={{ marginTop: 8, fontSize: 10, color: C.text3 }}>
              ROAS efetivo com LTV:{' '}
              <span style={{ fontWeight: 700, color: C.purpleL }}>{+(cur.roas * ltv).toFixed(1)}×</span>
              {ltv > 1.5 && <span style={{ marginLeft: 4, color: C.text3 }}>· nicho com alta recorrência</span>}
            </div>
          </div>
        </div>

        {/* Ramp bars */}
        <div style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Curva de maturação — receita projetada mês a mês
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 88 }}>
            {rampFactors.map((f, i) => {
              const rev = Math.round(cur.revenue * f)
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: i === 5 ? sc.color : C.text3 }}>{fmtR(rev)}</div>
                  <div style={{
                    width: '100%', borderRadius: '4px 4px 0 0', transition: 'all 0.5s',
                    height: `${Math.round(f * 64)}px`,
                    background: i === 5 ? sc.color : `${sc.color}35`,
                    minHeight: 4,
                  }} />
                  <div style={{ fontSize: 9, color: C.text3 }}>{rampLabels[i]}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sensitivity */}
        <div style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Análise de sensibilidade</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              {
                label: 'CPL +25%',
                detail: `${Math.round(cur.leads * 0.80)} leads → ${fmtR(Math.round(cur.leads * 0.80 * (cur.cvr / 100) * ticket))} receita`,
                color: C.red, sign: '▼',
              },
              {
                label: 'CVR −20%',
                detail: `${(cur.cvr * 0.8).toFixed(1)}% CVR → ${fmtR(Math.round(cur.leads * (cur.cvr * 0.8 / 100) * ticket))} receita`,
                color: C.gold, sign: '▼',
              },
              {
                label: 'Ticket +15%',
                detail: `R$${Math.round(ticket * 1.15).toLocaleString('pt-BR')} → ${fmtR(Math.round(cur.sales * ticket * 1.15))} receita`,
                color: C.green, sign: '▲',
              },
            ].map(s => (
              <div key={s.label} style={{
                padding: 12, borderRadius: 10,
                background: `${s.color}08`, border: `1px solid ${s.color}20`,
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 4, color: s.color }}>
                  {s.sign} {s.label}
                </span>
                <span style={{ fontSize: 11, color: C.text2 }}>{s.detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison table */}
        <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.border}`, overflowX: 'auto' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
            padding: '12px 16px', background: 'rgba(255,255,255,0.03)',
            fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.35)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            <span>Cenário</span>
            <span>CPL</span><span>Leads</span><span>Vendas</span><span>Receita</span><span>ROAS</span>
          </div>
          {SCENES.map((s, i) => {
            const m = all[i]
            const roasGood = bench.kpi_thresholds?.roas_good ?? 3
            return (
              <div key={s.key}
                style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
                  padding: '12px 16px', alignItems: 'center',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  background:  scenIdx === i ? s.glow : 'transparent',
                  borderLeft:  `3px solid ${scenIdx === i ? s.color : 'transparent'}`,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onClick={() => setScenIdx(i as 0|1|2)}
                onMouseEnter={e => { if (scenIdx !== i) e.currentTarget.style.background = 'rgba(124,58,237,0.04)' }}
                onMouseLeave={e => { e.currentTarget.style.background = scenIdx === i ? s.glow : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{s.emoji}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: scenIdx === i ? s.color : C.text2 }}>{s.label}</span>
                </div>
                <span style={{ fontSize: 12, color: C.text2, fontFamily: 'var(--font-mono)' }}>R${m.cpl}</span>
                <span style={{ fontSize: 12, color: C.text2, fontFamily: 'var(--font-mono)' }}>{m.leads}</span>
                <span style={{ fontSize: 12, color: C.text2, fontFamily: 'var(--font-mono)' }}>{m.sales}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: s.color, fontFamily: 'var(--font-mono)' }}>{fmtR(m.revenue)}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: m.roas >= roasGood ? C.green : C.gold, fontFamily: 'var(--font-mono)' }}>{m.roas}×</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function AddHistoryForm({ onClose }: { onClose: () => void }) {
  const { addCampaign, connectedAccounts } = useAppStore()
  const [form, setForm] = useState({
    channel: 'Meta Ads',
    period: '',
    budgetSpent: '',
    leads: '',
    conversions: '',
    revenue: '',
    outcome: 'neutra' as 'vencedora' | 'neutra' | 'perdedora',
    whatWorked: '',
    whatFailed: '',
    notes: '',
    salesCycle: '',
  })
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState('')

  const GOOGLE_CHANNELS = ['Google Ads', 'Google Search', 'Google PMAX']
  const connectedMeta   = connectedAccounts.find(a => a.platform === 'meta')
  const connectedGoogle = connectedAccounts.find(a => a.platform === 'google')
  const isGoogle        = GOOGLE_CHANNELS.includes(form.channel)
  const activeAccount   = isGoogle ? connectedGoogle : (form.channel === 'Meta Ads' ? connectedMeta : null)

  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

  async function importFromAds() {
    if (!activeAccount) return
    setImporting(true)
    setImportMsg('')
    try {
      const endpoint = isGoogle ? '/api/ads-data/google' : '/api/ads-data/meta'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: activeAccount.accessToken, accountId: activeAccount.accountId }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Erro ao importar dados')
      const now = new Date()
      const period = `${months[now.getMonth()]} ${now.getFullYear()}`
      setForm(f => ({
        ...f,
        period,
        budgetSpent: Math.round(data.totals?.spend ?? 0).toString(),
        leads:       Math.round(data.totals?.leads ?? 0).toString(),
        revenue:     Math.round(data.totals?.revenue ?? 0).toString(),
      }))
      setImportMsg('✓ Dados importados — últimos 30 dias')
    } catch (err: any) {
      setImportMsg('✗ ' + (err.message || 'Erro ao conectar'))
    } finally {
      setImporting(false)
    }
  }

  const u = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const cplPreview = form.budgetSpent && form.leads && Number(form.leads) > 0
    ? Math.round(Number(form.budgetSpent) / Number(form.leads))
    : null

  const CHANNELS = ['Meta Ads', 'Google Ads', 'Google Search', 'Google PMAX', 'TikTok Ads', 'YouTube Ads', 'LinkedIn Ads', 'Outro']
  const PERIODS_SUGG = (() => {
    const now = new Date()
    const months2 = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      return `${months2[d.getMonth()]} ${d.getFullYear()}`
    })
  })()

  const handleSave = () => {
    if (!form.period || !form.budgetSpent) return
    setSaving(true)
    addCampaign({
      channel: form.channel,
      period: form.period,
      budgetSpent: Number(form.budgetSpent) || 0,
      leads: Number(form.leads) || 0,
      cplReal: 0,
      conversions: Number(form.conversions) || 0,
      revenue: Number(form.revenue) || 0,
      outcome: form.outcome,
      whatWorked: form.whatWorked,
      whatFailed: form.whatFailed,
      notes: form.salesCycle
        ? `${form.notes}${form.notes ? ' | ' : ''}Prazo fechamento: ${form.salesCycle}`
        : form.notes,
    })
    setTimeout(() => { setSaving(false); onClose() }, 300)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: C.elevated, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: '10px 12px', color: C.text1, fontSize: 13,
    outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 10, color: C.text3, textTransform: 'uppercase' as const, letterSpacing: '0.08em', display: 'block', marginBottom: 6,
  }

  return (
    <div style={{
      ...card,
      border: `1px solid rgba(245,158,11,0.25)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: C.text1, fontSize: 13 }}>+ Registrar Período</div>
        <button onClick={onClose} style={{ color: C.text3, fontSize: 18, background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
      </div>

      {activeAccount && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '10px 12px', borderRadius: 10,
          background: C.greenBg, border: `1px solid rgba(34,197,94,0.2)`,
        }}>
          <span style={{ fontSize: 10, color: C.text3, flex: 1 }}>
            {isGoogle ? 'Google Ads' : 'Meta Ads'} conectado
            {importMsg ? (
              <span style={{ marginLeft: 8, fontWeight: 600, color: importMsg.startsWith('✓') ? C.green : C.red }}>{importMsg}</span>
            ) : (
              <span style={{ marginLeft: 8, color: C.text3 }}>· Preencha automaticamente com dados reais</span>
            )}
          </span>
          <button onClick={importFromAds} disabled={importing} style={{
            padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            background: 'rgba(34,197,94,0.12)', border: `1px solid rgba(34,197,94,0.3)`, color: C.green,
            opacity: importing ? 0.5 : 1,
          }}>
            {importing ? '⏳ Importando...' : '⬇ Importar últimos 30d'}
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Canal de mídia</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CHANNELS.map(c => (
              <button key={c} onClick={() => u('channel', c)} style={{
                padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.15s',
                background: form.channel === c ? `${C.gold}18` : C.elevated,
                border: form.channel === c ? `1px solid rgba(245,158,11,0.4)` : `1px solid ${C.border}`,
                color: form.channel === c ? C.gold : C.text3,
              }}>{c}</button>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Período</label>
          <input type="text" style={inputStyle} placeholder="Ex: Abr 2025, Q1 2025, Semana 1 Mai..."
            value={form.period} onChange={e => u('period', e.target.value)} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {PERIODS_SUGG.map(p => (
              <button key={p} onClick={() => u('period', p)} style={{
                padding: '2px 8px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
                background: form.period === p ? `${C.gold}12` : 'transparent',
                color: form.period === p ? C.gold : C.text3,
                border: `1px solid ${C.border}`,
              }}>{p}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Gasto (R$) *</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.text3, fontSize: 13 }}>R$</span>
              <input type="number" style={{ ...inputStyle, paddingLeft: 32 }}
                placeholder="5000" value={form.budgetSpent} onChange={e => u('budgetSpent', e.target.value)} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Leads gerados *</label>
            <input type="number" style={inputStyle} placeholder="120"
              value={form.leads} onChange={e => u('leads', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Vendas / Conversões</label>
            <input type="number" style={inputStyle} placeholder="15"
              value={form.conversions} onChange={e => u('conversions', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Receita gerada (R$)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.text3, fontSize: 13 }}>R$</span>
              <input type="number" style={{ ...inputStyle, paddingLeft: 32 }}
                placeholder="30000" value={form.revenue} onChange={e => u('revenue', e.target.value)} />
            </div>
          </div>
        </div>

        {cplPreview !== null && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
            background: C.goldBg, border: `1px solid rgba(245,158,11,0.2)`,
          }}>
            <span style={{ fontSize: 12, color: C.text3 }}>CPL calculado:</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>R${cplPreview}</span>
            {form.revenue && form.budgetSpent && Number(form.budgetSpent) > 0 && (
              <>
                <span style={{ fontSize: 12, color: C.text3 }}>·</span>
                <span style={{ fontSize: 12, color: C.text3 }}>ROAS:</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.green }}>
                  {(Number(form.revenue) / Number(form.budgetSpent)).toFixed(1)}×
                </span>
              </>
            )}
          </div>
        )}

        <div>
          <label style={labelStyle}>Resultado do período</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {(['vencedora', 'neutra', 'perdedora'] as const).map(o => {
              const oColor = o === 'vencedora' ? C.green : o === 'perdedora' ? C.red : C.gold
              const isActive = form.outcome === o
              return (
                <button key={o} onClick={() => setForm(f => ({ ...f, outcome: o }))} style={{
                  padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize',
                  background: isActive ? `${oColor}18` : C.elevated,
                  border: isActive ? `1px solid ${oColor}50` : `1px solid ${C.border}`,
                  color: isActive ? oColor : C.text3,
                }}>
                  {o === 'vencedora' ? '✓ Vencedora' : o === 'perdedora' ? '✕ Perdedora' : '— Neutra'}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ ...labelStyle, color: C.green }}>O que funcionou</label>
            <textarea style={{ ...inputStyle, resize: 'none' }} rows={2}
              placeholder="Ex: Criativo de antes/depois, público LAL..."
              value={form.whatWorked} onChange={e => u('whatWorked', e.target.value)} />
          </div>
          <div>
            <label style={{ ...labelStyle, color: C.red }}>O que falhou</label>
            <textarea style={{ ...inputStyle, resize: 'none' }} rows={2}
              placeholder="Ex: CPL subiu na 3ª semana, CBO instável..."
              value={form.whatFailed} onChange={e => u('whatFailed', e.target.value)} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>
            Prazo médio de fechamento
            <span style={{ marginLeft: 4, fontWeight: 400, color: C.text3 }}>(opcional · imobiliária, móveis, jurídico)</span>
          </label>
          <input type="text" style={inputStyle}
            placeholder="Ex: 30 dias, 2 meses, 90 dias..."
            value={form.salesCycle} onChange={e => u('salesCycle', e.target.value)} />
        </div>

        <button onClick={handleSave} disabled={!form.period || !form.budgetSpent || saving} style={{
          width: '100%', padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 700,
          cursor: 'pointer', border: 'none', transition: 'opacity 0.2s',
          background: 'linear-gradient(135deg, #F59E0B, #FCD34D)', color: '#000',
          opacity: (!form.period || !form.budgetSpent || saving) ? 0.4 : 1,
        }}>
          {saving ? 'Salvando...' : '+ Registrar no Histórico'}
        </button>
      </div>
    </div>
  )
}

function HistoryTable({ records, onDelete }: { records: CampaignRecord[]; onDelete: (id: string) => void }) {
  const [confirmDel, setConfirmDel] = useState<string | null>(null)

  if (records.length === 0) return null

  const channelColor = (ch: string) => {
    if (ch.includes('Meta')) return C.blue
    if (ch.includes('Google')) return C.red
    if (ch.includes('TikTok')) return C.text2
    return C.purpleL
  }

  return (
    <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
      <div style={{
        padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontWeight: 700, color: C.text1, fontSize: 13 }}>Histórico de Campanhas</div>
          <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>{records.length} períodos registrados</div>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
              {['Período', 'Canal', 'Gasto', 'Leads', 'CPL Real', 'Vendas', 'ROAS', 'Resultado', ''].map(h => (
                <th key={h} style={{
                  padding: '12px 16px', textAlign: 'left',
                  fontSize: '10px', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((r) => {
              const roas = r.revenue > 0 && r.budgetSpent > 0 ? (r.revenue / r.budgetSpent).toFixed(1) : '—'
              const outcomeColor = r.outcome === 'vencedora' ? C.green : r.outcome === 'perdedora' ? C.red : C.gold
              const cColor = channelColor(r.channel)
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 16px', color: C.text1, fontWeight: 500, whiteSpace: 'nowrap' }}>{r.period}</td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: `${cColor}12`, color: cColor,
                    }}>{r.channel}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: C.text2, whiteSpace: 'nowrap', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>R${r.budgetSpent.toLocaleString('pt-BR')}</td>
                  <td style={{ padding: '12px 16px', color: C.text2, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{r.leads}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'right', fontFamily: 'var(--font-mono)', color: r.cplReal > 0 ? C.gold : C.text3 }}>
                    {r.cplReal > 0 ? `R$${r.cplReal}` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', color: C.text2, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{r.conversions || '—'}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right', fontFamily: 'var(--font-mono)', color: roas !== '—' ? C.green : C.text3 }}>
                    {roas !== '—' ? `${roas}×` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, textTransform: 'capitalize',
                      color: outcomeColor, background: `${outcomeColor}15`,
                    }}>
                      {r.outcome}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {confirmDel === r.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button onClick={() => { onDelete(r.id); setConfirmDel(null) }}
                          style={{ fontSize: 10, color: C.red, background: 'none', border: 'none', cursor: 'pointer' }}>Confirmar</button>
                        <span style={{ color: C.text3 }}>·</span>
                        <button onClick={() => setConfirmDel(null)}
                          style={{ fontSize: 10, color: C.text3, background: 'none', border: 'none', cursor: 'pointer' }}>Cancelar</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDel(r.id)}
                        style={{ color: C.text3, fontSize: 16, background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                    )}
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

export function TabPerformance({ clientData }: Props) {
  const niche  = clientData?.niche || ''
  const budget = clientData?.budget || 0
  const bench  = getBenchmark(niche)
  const proj   = bench && budget > 0 ? computeNicheProjection(bench, budget) : null
  const content = getNicheContent(niche)

  const { campaignHistory, deleteCampaign } = useAppStore()
  const [showAddForm, setShowAddForm] = useState(false)

  const byPeriod: Record<string, { spend: number; leads: number; revenue: number; count: number }> = {}
  for (const r of campaignHistory) {
    if (!byPeriod[r.period]) byPeriod[r.period] = { spend: 0, leads: 0, revenue: 0, count: 0 }
    byPeriod[r.period].spend   += r.budgetSpent
    byPeriod[r.period].leads   += r.leads
    byPeriod[r.period].revenue += r.revenue
    byPeriod[r.period].count   += 1
  }
  const periods     = Object.keys(byPeriod).sort()
  const cplPoints   = periods.map(x => ({ x, y: byPeriod[x].leads > 0 ? Math.round(byPeriod[x].spend / byPeriod[x].leads) : 0 }))
  const roasPoints  = periods.map(x => ({ x, y: byPeriod[x].spend > 0 ? +((byPeriod[x].revenue / byPeriod[x].spend).toFixed(1)) : 0 }))
  const hasTrend    = periods.length >= 2

  const lastPeriodData = periods.length > 0 ? byPeriod[periods[periods.length - 1]] : null
  const realCPL  = lastPeriodData && lastPeriodData.leads > 0 ? Math.round(lastPeriodData.spend / lastPeriodData.leads) : null
  const realROAS = lastPeriodData && lastPeriodData.spend > 0 && lastPeriodData.revenue > 0 ? +(lastPeriodData.revenue / lastPeriodData.spend).toFixed(1) : null

  const stats = realCPL
    ? [
        { label: 'CPL Real (último período)', value: `R$${realCPL}`, sub: 'baseado no histórico real', color: C.gold },
        { label: 'ROAS Real', value: realROAS ? `${realROAS}×` : '—', sub: 'último período', color: C.green },
        { label: 'Leads (último período)', value: lastPeriodData!.leads.toString(), sub: 'do histórico registrado', color: C.purpleL },
        { label: 'Gasto (último período)', value: `R$${lastPeriodData!.spend.toLocaleString('pt-BR')}`, sub: 'investimento real', color: C.blue },
      ]
    : proj
    ? [
        { label: 'Impressões est.',  value: `${Math.round(proj.leadsMonth * 150 / 1000)}K`, sub: 'projeção mensal',    color: C.gold },
        { label: 'CTR estimado',     value: `3.0%`,                                          sub: 'benchmark do nicho', color: C.green },
        { label: 'Leads / mês',      value: `${proj.leadsMin}–${proj.leadsMax}`,              sub: 'faixa estimada',    color: C.purpleL },
        { label: 'Investimento',     value: `R$${budget.toLocaleString('pt-BR')}`,            sub: 'budget configurado', color: C.blue },
      ]
    : [
        { label: 'Impressões',  value: '—', sub: 'sem histórico', color: C.gold },
        { label: 'CTR',         value: '—', sub: 'sem histórico', color: C.green },
        { label: 'Leads',       value: '—', sub: 'sem histórico', color: C.purpleL },
        { label: 'Gasto total', value: '—', sub: 'sem histórico', color: C.blue },
      ]

  const mom = (() => {
    if (periods.length < 2) return null
    const curr = byPeriod[periods[periods.length - 1]]
    const prev = byPeriod[periods[periods.length - 2]]
    const currPeriod = periods[periods.length - 1]
    const prevPeriod = periods[periods.length - 2]
    const currCPL = curr.leads > 0 ? Math.round(curr.spend / curr.leads) : null
    const prevCPL = prev.leads > 0 ? Math.round(prev.spend / prev.leads) : null
    const currROAS = curr.spend > 0 && curr.revenue > 0 ? +(curr.revenue / curr.spend).toFixed(1) : null
    const prevROAS = prev.spend > 0 && prev.revenue > 0 ? +(prev.revenue / prev.spend).toFixed(1) : null
    const pct = (c: number | null, p: number | null) =>
      c != null && p != null && p !== 0 ? +((( c - p) / p * 100).toFixed(1)) : null
    return {
      currPeriod, prevPeriod,
      items: [
        { label: 'Investimento', curr: curr.spend,   prev: prev.spend,   delta: pct(curr.spend, prev.spend),     fmt: (v: number) => v >= 1000 ? `R$${(v/1000).toFixed(1)}k` : `R$${v}`, higherIsBetter: null as boolean | null },
        { label: 'Leads',        curr: curr.leads,   prev: prev.leads,   delta: pct(curr.leads, prev.leads),     fmt: (v: number) => v.toLocaleString('pt-BR'),                           higherIsBetter: true  as boolean | null },
        { label: 'CPL',          curr: currCPL,      prev: prevCPL,      delta: pct(currCPL, prevCPL),           fmt: (v: number) => `R$${v}`,                                            higherIsBetter: false as boolean | null },
        { label: 'ROAS',         curr: currROAS,     prev: prevROAS,     delta: pct(currROAS, prevROAS),         fmt: (v: number) => `${v}×`,                                             higherIsBetter: true  as boolean | null },
      ],
    }
  })()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {stats.map((s, i) => (
          <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} color={s.color} delay={i * 0.08} />
        ))}
      </div>

      {/* Simulador de Cenários */}
      <SimuladorCenarios clientData={clientData} />

      {/* Comparativo MoM */}
      {mom && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, color: C.text1, fontSize: 13 }}>Comparativo Mês a Mês</div>
              <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>{mom.prevPeriod} → {mom.currPeriod}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {mom.items.map(item => {
              const d = item.delta
              const isGood = d === null || item.higherIsBetter === null ? null
                : item.higherIsBetter ? d >= 0 : d <= 0
              const color = isGood === null ? C.text3 : isGood ? C.green : C.red
              return (
                <div key={item.label} style={{ background: C.elevated, borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{item.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.text1, marginBottom: 4 }}>
                    {item.curr != null ? item.fmt(item.curr as number) : '—'}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color }}>
                    {d !== null ? `${d >= 0 ? '▲' : '▼'} ${Math.abs(d)}%` : 'Sem dado anterior'}
                  </div>
                  <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>
                    Ant.: {item.prev != null ? item.fmt(item.prev as number) : '—'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Histórico de Campanhas */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 30, height: 30, borderRadius: 8, background: C.elevated,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
            }}>📅</span>
            <span style={{ fontWeight: 700, color: C.text1, fontSize: 14 }}>Histórico de Campanhas</span>
            <span style={{ fontSize: 12, color: C.text3 }}>
              {campaignHistory.length > 0 ? `${campaignHistory.length} períodos` : 'vazio'}
            </span>
          </div>
          <button onClick={() => setShowAddForm(v => !v)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            background: showAddForm ? `${C.gold}20` : C.goldBg,
            border: `1px solid rgba(245,158,11,0.3)`, color: C.gold,
          }}>
            {showAddForm ? '▲ Fechar' : '+ Registrar Período'}
          </button>
        </div>

        {showAddForm && (
          <div style={{ marginBottom: 16 }}>
            <AddHistoryForm onClose={() => setShowAddForm(false)} />
          </div>
        )}

        {campaignHistory.length === 0 && !showAddForm ? (
          <div style={{
            ...card,
            border: `1px dashed ${C.border}`,
            textAlign: 'center', padding: 40,
          }}>
            <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.15 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text1, marginBottom: 6 }}>Sem histórico registrado</div>
            <p style={{ fontSize: 12, color: C.text3, marginBottom: 20 }}>
              Registre os resultados de cada período para visualizar a tendência de CPL e ROAS ao longo do tempo.
            </p>
            <button onClick={() => setShowAddForm(true)} style={{
              padding: '8px 20px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: C.goldBg, border: `1px solid rgba(245,158,11,0.3)`, color: C.gold,
            }}>
              + Registrar primeiro período
            </button>
          </div>
        ) : (
          <HistoryTable records={campaignHistory} onDelete={deleteCampaign} />
        )}
      </div>

      {/* Tendência histórica */}
      {hasTrend && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 30, height: 30, borderRadius: 8, background: C.elevated,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
            }}>📈</span>
            <div style={{ fontWeight: 700, color: C.text1, fontSize: 14 }}>Tendência de Performance</div>
            <span style={{ fontSize: 12, color: C.text3 }}>{periods.length} períodos</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <TrendChart points={cplPoints} color={C.gold} label="CPL Médio" format={v => `R$${v}`} />
            <TrendChart points={roasPoints} color={C.green} label="ROAS" format={v => `${v}×`} />
          </div>
        </div>
      )}

      {/* Criativos recomendados */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ fontWeight: 700, color: C.text1, fontSize: 14, margin: 0 }}>Criativos Recomendados por IA</h3>
          <p style={{ fontSize: 12, color: C.text3, marginTop: 4, marginBottom: 0 }}>
            Score baseado em benchmark de CTR e CPL para {niche || 'o nicho'}
          </p>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: '5fr 2fr 3fr 2fr',
          padding: '12px 24px', background: 'rgba(255,255,255,0.03)',
          fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.35)',
          textTransform: 'uppercase', letterSpacing: '0.06em',
          borderBottom: `1px solid ${C.border}`,
        }}>
          <span>Formato / Ângulo</span>
          <span>Canal</span>
          <span>Score IA</span>
          <span>Status</span>
        </div>
        {content.creatives.map((c, i) => (
          <div key={c.name} style={{
            display: 'grid', gridTemplateColumns: '5fr 2fr 3fr 2fr',
            padding: '12px 24px', alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.04)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <span style={{ fontSize: 13, color: C.text1, fontWeight: 500, lineHeight: 1.4 }}>{c.name}</span>
            <span style={{ fontSize: 12, color: C.text3 }}>{c.channel}</span>
            <div><ScoreBar score={c.score} /></div>
            <span style={{
              fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, display: 'inline-block',
              color: c.statusColor, background: `${c.statusColor}18`,
            }}>{c.status}</span>
          </div>
        ))}
      </div>

      {/* CPL por canal (benchmark) */}
      {bench && (
        <div style={card}>
          <div style={{ fontWeight: 700, color: C.text1, fontSize: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 30, height: 30, borderRadius: 8, background: C.elevated,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
            }}>🎯</span>
            CPL Benchmark por Canal · {niche}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {Object.entries(bench.cpl_by_channel).map(([canal, cpl]) => {
              const cColor = canal.includes('Meta') ? C.blue : canal.includes('Google') ? C.red : canal.includes('TikTok') ? C.text2 : C.purpleL
              return (
                <div key={canal} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: C.elevated, borderRadius: 10,
                  border: `1px solid ${C.border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: cColor, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: C.text2 }}>{canal}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>{cpl}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
