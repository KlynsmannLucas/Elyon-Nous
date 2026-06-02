// components/dashboard/TabMarketIntel.tsx — Inteligência de Mercado e Nicho
'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import {
  getBenchmark,
  getCreativeAngles,
  getSeasonalityContext,
  getCampaignMaturityStage,
  detectCitySize,
  computeNicheProjection,
  BENCHMARKS,
} from '@/lib/niche_benchmarks'
import type { ClientData } from '@/lib/store'
import { DataSourceBadge } from '@/components/dashboard/DataSourceBadge'
import type { BenchmarkMeta } from '@/lib/benchmark-service'

interface Props {
  clientData: ClientData | null
}

const MONTH_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// ── Gráfico de sazonalidade ───────────────────────────────────────────────────
function SeasonalityChart({ chartData }: { chartData: ReturnType<typeof getSeasonalityContext>['chartData'] }) {
  const maxIdx = Math.max(...chartData.map(d => d.index))
  const minIdx = Math.min(...chartData.map(d => d.index))

  return (
    <div className="mt-4">
      <div className="flex items-end gap-1.5 h-24">
        {chartData.map((d) => {
          const pct = ((d.index - minIdx) / (maxIdx - minIdx + 0.01)) * 100
          const barH = Math.max(15, pct)
          const color = d.isCurrent ? '#F0B429'
            : d.isPeak ? '#FF4D4D'
            : d.isValley ? '#22C55E'
            : '#2A2A30'
          return (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-[9px] font-mono"
                style={{ color: d.isCurrent ? '#F0B429' : 'transparent' }}>
                {d.index.toFixed(2)}
              </div>
              <div className="w-full rounded-t-sm relative transition-all"
                style={{ height: `${barH}%`, background: color, opacity: d.isCurrent ? 1 : 0.7 }}>
                {d.isCurrent && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#F0B429]" />
                )}
              </div>
              <span className="text-[9px]"
                style={{ color: d.isCurrent ? '#F0B429' : '#475569' }}>
                {d.month}
              </span>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-600">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#F0B429] inline-block" /> Mês atual</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#FF4D4D] inline-block" /> Pico (+ caro)</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#22C55E] inline-block" /> Vale (+ barato)</span>
      </div>
    </div>
  )
}

// ── Curva de maturidade ───────────────────────────────────────────────────────
function MaturityTimeline({ weeksActive }: { weeksActive: number }) {
  const stages = [
    getCampaignMaturityStage(1),
    getCampaignMaturityStage(4),
    getCampaignMaturityStage(10),
    getCampaignMaturityStage(20),
  ]
  const current = getCampaignMaturityStage(weeksActive)

  return (
    <div className="mt-4">
      <div className="flex gap-2 mb-4">
        {stages.map((s, i) => {
          const isActive = s.stage === current.stage
          return (
            <div key={i} className="flex-1 rounded-xl p-3 text-center transition-all"
              style={{
                background: isActive ? `${s.color}15` : '#111114',
                border: isActive ? `1px solid ${s.color}50` : '1px solid #2A2A30',
              }}>
              <div className="text-lg mb-1">
                {s.stage === 'aprendizado' ? '🌱' : s.stage === 'otimizacao' ? '🚀' : s.stage === 'estabilizacao' ? '⚓' : '🔥'}
              </div>
              <div className="text-[10px] font-bold" style={{ color: isActive ? s.color : '#475569' }}>
                {s.label}
              </div>
              <div className="text-[9px] text-slate-600 mt-0.5">{s.weekRange}</div>
              <div className="text-[10px] font-bold mt-1" style={{ color: isActive ? s.color : '#475569' }}>
                CPL {s.cplMultiplier >= 1 ? '+' : ''}{Math.round((s.cplMultiplier - 1) * 100)}%
              </div>
            </div>
          )
        })}
      </div>
      <div className="p-3 rounded-xl text-xs leading-relaxed"
        style={{ background: `${current.color}08`, border: `1px solid ${current.color}30`, color: '#CBD5E1' }}>
        <span className="font-semibold" style={{ color: current.color }}>Agora ({current.label}): </span>
        {current.advice}
      </div>
    </div>
  )
}

// ── Ângulos criativos ─────────────────────────────────────────────────────────
function CreativeAnglesPanel({ niche }: { niche: string }) {
  const angles = getCreativeAngles(niche)
  if (!angles) return null

  const sections = [
    { key: 'saturated', label: '🔴 Saturados — evitar', items: angles.saturated, color: '#FF4D4D', bg: 'rgba(255,77,77,0.05)', border: 'rgba(255,77,77,0.2)' },
    { key: 'trending', label: '🟡 Em alta — testar agora', items: angles.trending, color: '#F0B429', bg: 'rgba(240,180,41,0.05)', border: 'rgba(240,180,41,0.2)' },
    { key: 'underexplored', label: '🟢 Subexplorados — oportunidade', items: angles.underexplored, color: '#22C55E', bg: 'rgba(34,197,94,0.05)', border: 'rgba(34,197,94,0.2)' },
  ]

  return (
    <div className="space-y-3 mt-4">
      {sections.map(s => (
        <div key={s.key} className="rounded-xl p-4" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
          <div className="text-xs font-bold mb-2" style={{ color: s.color }}>{s.label}</div>
          <div className="flex flex-wrap gap-1.5">
            {s.items.map((item, i) => (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded-full"
                style={{ background: `${s.color}12`, color: s.color, border: `1px solid ${s.color}25` }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Card de modificador de cidade ─────────────────────────────────────────────
function CityIntelCard({ clientData, bench }: { clientData: ClientData; bench: NonNullable<ReturnType<typeof getBenchmark>> }) {
  const tiers: Array<{ tier: string; label: string; modifier: number; example: string }> = [
    { tier: 'capital',  label: 'Capital',      modifier: 1.00, example: 'SP, RJ, BH, BSB' },
    { tier: 'grande',   label: 'Cidade grande', modifier: 0.78, example: 'Campinas, Goiânia, Joinville' },
    { tier: 'medio',    label: 'Cidade média',  modifier: 0.62, example: 'Ribeirão Preto, Juiz de Fora' },
    { tier: 'pequeno',  label: 'Cidade pequena',modifier: 0.48, example: 'Municípios <100k hab.' },
  ]
  const currentTier = detectCitySize(clientData.city)
  const cplBase = Math.round((bench.cpl_min + bench.cpl_max) / 2)

  return (
    <div className="mt-4 space-y-2">
      <div className="text-[10px] text-slate-600 mb-3">
        CPL base para <strong className="text-slate-400">{bench.name}</strong>: R${bench.cpl_min}–{bench.cpl_max} · Detectado: <strong className="text-[#F0B429]">{clientData.city || 'não informado'}</strong>
      </div>
      {tiers.map(t => {
        const adjustedCPL = Math.round(cplBase * t.modifier)
        const isActive = t.tier === currentTier
        return (
          <div key={t.tier} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
            style={{
              background: isActive ? 'rgba(240,180,41,0.08)' : '#111114',
              border: isActive ? '1px solid rgba(240,180,41,0.3)' : '1px solid #2A2A30',
            }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: isActive ? '#F0B429' : '#2A2A30' }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold" style={{ color: isActive ? '#F0B429' : '#64748B' }}>{t.label}</div>
              <div className="text-[10px] text-slate-600">{t.example}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-sm font-bold" style={{ color: isActive ? '#F0B429' : '#475569' }}>R${adjustedCPL}</div>
              <div className="text-[9px] text-slate-600">{Math.round((1 - t.modifier) * 100)}% menos que capital</div>
            </div>
            <div className="w-20 bg-[#1E1E24] rounded-full h-1 flex-shrink-0">
              <div className="h-full rounded-full" style={{ width: `${t.modifier * 100}%`, background: isActive ? '#F0B429' : '#2A2A30' }} />
            </div>
          </div>
        )
      })}
      {currentTier === 'pequeno' && (
        <div className="text-[10px] text-amber-400 px-3 py-2 rounded-lg mt-1"
          style={{ background: 'rgba(245,165,0,0.06)', border: '1px solid rgba(245,165,0,0.2)' }}>
          ⚠️ Cidade pequena: CPL mais baixo, porém audiência limitante. Escalar acima de R${bench.budget_floor.toLocaleString('pt-BR')}/mês pode saturar rapidamente.
        </div>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export function TabMarketIntel({ clientData }: Props) {
  const campaignHistory = useAppStore((s) => s.campaignHistory)
  const [activeSection, setActiveSection] = useState<'sazonalidade' | 'cidade' | 'maturidade' | 'criativos' | 'auditoria'>('sazonalidade')
  const [benchMeta, setBenchMeta] = useState<BenchmarkMeta | null>(null)
  const [auditData, setAuditData] = useState<Array<{ key: string; name: string; dataSource: string; confidence: string | null; updatedAt: string | null; freshDays: number | null }> | null>(null)
  const [auditLoading, setAuditLoading] = useState(false)
  const [refreshingKey, setRefreshingKey] = useState<string | null>(null)
  const [refreshMsg, setRefreshMsg] = useState<{ key: string; ok: boolean; text: string } | null>(null)

  const bench = clientData ? getBenchmark(clientData.niche) : null
  const benchKey = bench ? (Object.keys(BENCHMARKS).find((k) => BENCHMARKS[k] === bench) || 'outro') : null

  useEffect(() => {
    if (!benchKey) return
    fetch(`/api/benchmarks/niche?key=${encodeURIComponent(benchKey)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.meta) setBenchMeta(data.meta) })
      .catch(() => {})
  }, [benchKey])

  if (!clientData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-500 text-sm">
        Configure um cliente para ver a inteligência de mercado.
      </div>
    )
  }

  if (!bench) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-500 text-sm">
        Nicho não mapeado nos benchmarks.
      </div>
    )
  }

  const resolvedKey = benchKey ?? 'outro'
  const seasonCtx = getSeasonalityContext(resolvedKey)
  const proj = computeNicheProjection(bench, clientData.budget, clientData.city, resolvedKey)

  // Estima semanas ativas pela campanha mais antiga
  const oldestCampaign = campaignHistory.length > 0
    ? campaignHistory.reduce((a, b) => a.createdAt < b.createdAt ? a : b)
    : null
  const weeksActive = oldestCampaign
    ? Math.round((Date.now() - new Date(oldestCampaign.createdAt).getTime()) / (7 * 24 * 3600 * 1000))
    : 1
  const maturity = getCampaignMaturityStage(weeksActive)

  const tabs: { key: string; label: string; badge?: string }[] = [
    { key: 'sazonalidade', label: '📅 Sazonalidade', badge: seasonCtx.cheaper ? '🟢 Bom mês' : undefined },
    { key: 'cidade',       label: '📍 Mercado Local' },
    { key: 'maturidade',   label: '📈 Maturidade', badge: maturity.stage === 'fadiga' ? '⚠️ Fadiga' : undefined },
    { key: 'criativos',    label: '🎨 Criativos' },
    { key: 'auditoria',    label: '🔍 Auditoria' },
  ]

  function loadAudit(force = false) {
    if ((auditData && !force) || auditLoading) return
    setAuditLoading(true)
    fetch('/api/benchmarks/niche?key=__all__')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.niches) setAuditData(d.niches) })
      .catch(() => {})
      .finally(() => setAuditLoading(false))
  }

  async function refreshNiche(key: string, name: string) {
    if (refreshingKey) return
    setRefreshingKey(key)
    setRefreshMsg(null)
    try {
      const res = await fetch('/api/benchmarks/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: name, nicheKey: key }),
      })
      const data = await res.json()
      if (res.ok && data.cpl_min) {
        setRefreshMsg({ key, ok: true, text: `CPL R$${data.cpl_min}–${data.cpl_max} · confiança ${data.confidence}` })
        // reload audit table
        loadAudit(true)
        // reload badge for current niche
        if (key === benchKey) {
          fetch(`/api/benchmarks/niche?key=${encodeURIComponent(key)}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.meta) setBenchMeta(d.meta) })
            .catch(() => {})
        }
      } else {
        setRefreshMsg({ key, ok: false, text: data.error || 'Sem dados suficientes' })
      }
    } catch {
      setRefreshMsg({ key, ok: false, text: 'Erro de conexão' })
    } finally {
      setRefreshingKey(null)
    }
  }

  // ── Variáveis de contexto reutilizadas em múltiplos blocos ──────────────────
  const goodMonth = proj.seasonalityIndex <= 0.95
  const badMonth  = proj.seasonalityIndex >= 1.1
  const goodCity  = proj.citySizeModifier <= 0.75
  const fatigued  = maturity.stage === 'fadiga'

  // ── Resumo executivo — calcula situação geral do mercado ─────────────────────
  const execSummary = (() => {
    const cplInRange   = proj.adjustedCPLAvg <= bench.cpl_max
    const cplBelow     = proj.adjustedCPLAvg <= bench.cpl_min
    const goodSignals  = [goodMonth, goodCity, cplInRange, !fatigued].filter(Boolean).length

    // Situação geral
    const status: 'green' | 'amber' | 'red' =
      goodSignals >= 3 && !badMonth && !fatigued ? 'green' :
      goodSignals >= 2 || (badMonth && !fatigued)  ? 'amber' : 'red'

    // M1: Labels consequenciais — comunicam resultado, não classificação
    const cfg = {
      green: { icon: '🟢', label: 'Excelente momento para captar clientes com menor custo.', color: '#22C55E', bg: 'rgba(34,197,94,0.07)', border: 'rgba(34,197,94,0.2)' },
      amber: { icon: '🟡', label: 'Momento estável. Escalar com cautela.',                   color: '#F59E0B', bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.2)' },
      red:   { icon: '🔴', label: 'Mercado mais competitivo que o normal.',                   color: '#EF4444', bg: 'rgba(239,68,68,0.07)',  border: 'rgba(239,68,68,0.2)' },
    }[status]

    // Diagnóstico em 1 linha — foco em consequência para o negócio
    const diagnosis = badMonth && fatigued
      ? `Sua conta está com campanhas saturadas em um período de alta concorrência. Continuar investindo sem revisar os criativos pode desperdiçar orçamento.`
      : badMonth
      ? `Este período tende a ser mais caro para anunciar no setor de ${clientData.niche}. Cada lead pode custar mais do que o habitual.`
      : fatigued
      ? `Suas campanhas apresentam sinais de saturação — o público já viu os mesmos anúncios várias vezes. Novos criativos podem recuperar o resultado sem precisar aumentar o orçamento.`
      : cplBelow && goodMonth
      ? `Este é um dos melhores momentos para anunciar no seu setor. O custo por lead está abaixo da média e a concorrência está mais baixa.`
      : cplInRange && goodMonth
      ? `O mercado está favorável: menor concorrência que o habitual${goodCity ? ` e vantagem de custo por estar em ${clientData.city || 'sua região'}` : ''}. Boa janela para crescer.`
      : `O mercado está dentro da normalidade. O custo por lead estimado de R$${proj.adjustedCPLAvg} está no benchmark do setor (R$${bench.cpl_min}–${bench.cpl_max}).`

    // M2: Impacto em R$ concreto
    const monthlyLeads = clientData.budget > 0 ? Math.round(clientData.budget / proj.adjustedCPLAvg) : 0
    const benchCPLAvg  = (bench.cpl_min + bench.cpl_max) / 2
    const extraLeads   = monthlyLeads > 0 ? Math.round((benchCPLAvg / proj.adjustedCPLAvg - 1) * monthlyLeads) : 0
    const savedMoney   = monthlyLeads > 0 ? Math.round((benchCPLAvg - proj.adjustedCPLAvg) * monthlyLeads) : 0
    const costPremium  = clientData.budget > 0 ? Math.round((proj.seasonalityIndex - 1) * clientData.budget) : 0
    const cityBonus    = clientData.budget > 0 ? Math.round((1 - proj.citySizeModifier) * clientData.budget) : 0

    const impact = badMonth && costPremium > 200
      ? `Você pode estar pagando até R$${costPremium.toLocaleString('pt-BR')}/mês a mais neste período em comparação com meses de menor concorrência.`
      : goodMonth && extraLeads > 0
      ? `Possibilidade de gerar até +${extraLeads} leads extras este mês — ou economizar R$${savedMoney.toLocaleString('pt-BR')} mantendo o mesmo volume de contatos.`
      : goodCity && cityBonus > 300
      ? `Sua localização representa uma economia estimada de R$${cityBonus.toLocaleString('pt-BR')}/mês em relação às capitais com o mesmo orçamento.`
      : proj.adjustedCPLAvg < benchCPLAvg
      ? `CPL estimado R$${proj.adjustedCPLAvg} está abaixo da média do setor (R$${Math.round(benchCPLAvg)}). Cada R$${clientData.budget > 0 ? clientData.budget.toLocaleString('pt-BR') : '—'} investido rende mais leads.`
      : null

    // Ação recomendada
    const action = fatigued
      ? 'Trocar os criativos principais antes de aumentar o orçamento.'
      : badMonth
      ? 'Manter orçamento estável e concentrar esforços no público quente (remarketing).'
      : goodMonth && cplBelow
      ? 'Aumentar o orçamento das campanhas vencedoras em 20–30% agora.'
      : goodMonth
      ? 'Testar novos ângulos criativos aproveitando o custo mais baixo deste período.'
      : 'Monitorar CPL diariamente e ajustar se ultrapassar R$' + bench.cpl_max + '.'

    return { cfg, diagnosis, impact, action }
  })()

  return (
    <div>
      {/* ── RESUMO EXECUTIVO ── Diagnóstico → Impacto → Ação ─────────────── */}
      <div style={{
        padding: '20px 22px', borderRadius: '14px', marginBottom: '20px',
        background: execSummary.cfg.bg, border: `1px solid ${execSummary.cfg.border}`,
      }}>
        {/* Status — frase consequencial grande */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
          <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>{execSummary.cfg.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '16px', fontWeight: 800, color: execSummary.cfg.color, letterSpacing: '-0.02em', lineHeight: 1.3 }}>
              {execSummary.cfg.label}
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '3px' }}>
              {clientData.niche}{clientData.city ? ` · ${clientData.city}` : ''}
            </div>
          </div>
        </div>

        {/* Diagnóstico */}
        <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: 1.7, margin: '0 0 14px', paddingLeft: '28px' }}>
          {execSummary.diagnosis}
        </p>

        {/* Impacto + Ação em grid */}
        <div style={{ display: 'grid', gridTemplateColumns: execSummary.impact ? '1fr 1fr' : '1fr', gap: '10px', paddingLeft: '28px' }}>
          {execSummary.impact && (
            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.2)', border: `1px solid ${execSummary.cfg.border}` }}>
              <div style={{ fontSize: '9px', fontWeight: 700, color: execSummary.cfg.color, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '5px' }}>
                Impacto para o seu negócio
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9', lineHeight: 1.5 }}>{execSummary.impact}</div>
            </div>
          )}
          <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)' }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#A78BFA', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '5px' }}>
              🔥 O que fazer agora
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9', lineHeight: 1.5 }}>{execSummary.action}</div>
          </div>
        </div>

        {/* M3: Selo de origem da análise */}
        <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: `1px solid ${execSummary.cfg.border}`, display: 'flex', alignItems: 'center', gap: '5px' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={execSummary.cfg.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14z"/>
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14z"/>
          </svg>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>
            Análise gerada pela IA com base em sazonalidade, benchmark do setor e dados do seu negócio.
          </span>
        </div>
      </div>

      {/* ── M1: O QUE IDENTIFICAMOS — descoberta específica ──────────────── */}
      {(() => {
        const monthlyLeads  = clientData.budget > 0 ? Math.round(clientData.budget / proj.adjustedCPLAvg) : 0
        const benchCPLAvg   = (bench.cpl_min + bench.cpl_max) / 2
        const citySaving    = goodCity ? Math.round((1 - proj.citySizeModifier) * 100) : 0
        const seasonSaving  = seasonCtx.cheaper ? Math.round((1 - proj.seasonalityIndex) * 100) : 0
        const peakMonthText = seasonCtx.peakMonths?.slice(0, 2).join(' e ') || ''
        const valleyMonthText = seasonCtx.valleyMonths?.slice(0, 2).join(' e ') || ''
        const currentMonth  = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][new Date().getMonth()]

        let finding = ''
        let explanation = ''
        let discoveryImpact = ''

        if (seasonCtx.cheaper && valleyMonthText) {
          finding = `A maioria dos anunciantes de ${clientData.niche} concentra investimento no início do mês e em ${peakMonthText || 'períodos de alta'}. Você está anunciando em ${currentMonth}, que historicamente tem menor concorrência.`
          explanation = `Em períodos de menor disputa pelo mesmo público, o algoritmo distribui o orçamento com mais eficiência — cada real investido gera mais resultado.`
          discoveryImpact = seasonSaving > 0
            ? `Esta janela pode representar ${seasonSaving}% de eficiência extra${monthlyLeads > 0 ? ` — ou seja, até ${Math.round(monthlyLeads * (seasonSaving / 100))} leads adicionais com o mesmo orçamento.` : '.'}`
            : `Capitalize este momento antes que a concorrência aumente novamente.`
        } else if (goodCity && clientData.city && citySaving > 15) {
          finding = `${clientData.city} apresenta menor densidade de anunciantes no setor de ${clientData.niche} em comparação com as capitais. Isso reduz o leilão de anúncios e o custo por resultado.`
          explanation = `Em mercados menos saturados, o algoritmo consegue encontrar público qualificado com menor custo por impressão (CPM), o que se traduz em CPL menor.`
          discoveryImpact = `Esta vantagem geográfica equivale a uma economia de ~${citySaving}% no custo por lead em relação às capitais — algo que a maioria dos anunciantes do setor não percebe.`
        } else if (maturity.stage === 'fadiga') {
          finding = `Sua conta apresenta sinais de fadiga criativa — o público viu os mesmos anúncios repetidamente e a taxa de engajamento caiu.`
          explanation = `Quando a frequência fica alta sem renovação de criativos, o algoritmo começa a pagar mais caro por cada impressão para encontrar público novo. O resultado: o CPL sobe sem aumentar o orçamento.`
          discoveryImpact = `Renovar os criativos principais agora pode recuperar a eficiência sem precisar aumentar o investimento.`
        } else {
          finding = `O setor de ${clientData.niche} tem períodos de alta concorrência em ${peakMonthText || 'alguns meses do ano'}, quando o CPL pode subir ${Math.round((bench.cpl_max / bench.cpl_min - 1) * 100)}% acima do mínimo do benchmark.`
          explanation = `Monitorar o índice sazonal e ajustar o orçamento antecipadamente é uma vantagem competitiva que a maioria dos anunciantes não explora sistematicamente.`
          discoveryImpact = valleyMonthText ? `Os meses de ${valleyMonthText} historicamente oferecem o melhor custo-benefício para este nicho.` : `Manter campanhas ativas nos períodos de vale reduz o CPL médio anual.`
        }

        return (
          <div style={{ padding: '16px 18px', borderRadius: '12px', marginBottom: '14px', background: '#0C1426', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#A78BFA', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>O que identificamos</span>
            </div>
            <p style={{ fontSize: '13px', color: '#E2E8F0', fontWeight: 600, lineHeight: 1.6, margin: '0 0 6px' }}>{finding}</p>
            <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.6, margin: '0 0 10px' }}>{explanation}</p>
            <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)', fontSize: '12px', color: '#C4B5FD', fontWeight: 500 }}>
              {discoveryImpact}
            </div>
          </div>
        )
      })()}

      {/* ── M2: POR QUE A IA CHEGOU NESSA CONCLUSÃO? ───────────────────── */}
      <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' as const }}>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>Esta análise considerou:</div>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' as const }}>
          {[
            { label: 'Sazonalidade do setor', ok: true },
            { label: 'Benchmark do nicho',    ok: true },
            { label: 'Maturidade da conta',   ok: !!oldestCampaign },
            { label: 'Histórico de campanhas',ok: campaignHistory.length > 0 },
            { label: 'Localização',            ok: !!clientData.city },
          ].map(({ label, ok }) => (
            <span key={label} style={{ fontSize: '10px', color: ok ? 'rgba(34,197,94,0.7)' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>{ok ? '✓' : '○'}</span> {label}
            </span>
          ))}
        </div>
      </div>

      {/* Header técnico (discreto, após o resumo) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
          Indicadores técnicos · <strong style={{ color: 'rgba(255,255,255,0.5)' }}>{clientData.niche}</strong>
        </p>
        {benchMeta && (
          <DataSourceBadge meta={benchMeta} className="flex-shrink-0" />
        )}
      </div>

      {/* Strip de métricas — compacto (Fase 3) */}
      <div style={{
        display: 'flex', alignItems: 'stretch', gap: '0',
        background: '#0C1426', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px', marginBottom: '20px', overflow: 'hidden',
      }}>
        {[
          {
            value: `${proj.seasonalityIndex.toFixed(2)}×`,
            label: 'Índice sazonal',
            sub: proj.seasonalityIndex >= 1.1 ? 'Pico' : proj.seasonalityIndex <= 0.9 ? 'Valle' : 'Normal',
            color: proj.seasonalityIndex >= 1.1 ? '#EF4444' : proj.seasonalityIndex <= 0.9 ? '#22C55E' : '#F59E0B',
          },
          {
            value: `R$${proj.adjustedCPLAvg}`,
            label: 'CPL ajustado',
            sub: benchMeta?.dataSource === 'real_market_data' ? '✓ real' : '~ estimado',
            color: '#F59E0B',
          },
          {
            value: `${maturity.cplMultiplier.toFixed(2)}×`,
            label: 'Maturidade',
            sub: maturity.label,
            color: maturity.color,
          },
          {
            value: `${Math.round(proj.citySizeModifier * 100)}%`,
            label: 'CPL vs capital',
            sub: proj.citySizeLabel,
            color: '#A78BFA',
          },
        ].map((stat, i) => (
          <div key={i} style={{
            flex: 1, padding: '14px 18px',
            borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
          }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: stat.color, letterSpacing: '-0.02em', lineHeight: 1 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.32)', marginTop: '4px' }}>{stat.label}</div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: stat.color, marginTop: '2px' }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Alerta de sazonalidade */}
      {proj.seasonalityLabel && (
        <div className="mb-5 px-4 py-3 rounded-xl text-xs leading-relaxed"
          style={{ background: 'rgba(240,180,41,0.05)', border: '1px solid rgba(240,180,41,0.18)', color: '#CBD5E1' }}>
          {proj.seasonalityLabel}
          {proj.seasonalityTrend === 'subindo' && <span className="ml-2 text-red-400 font-semibold">↑ CPL subindo no próximo mês</span>}
          {proj.seasonalityTrend === 'descendo' && <span className="ml-2 text-green-400 font-semibold">↓ CPL caindo no próximo mês</span>}
        </div>
      )}

      {/* Tabs de seção — estilo Linear */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0' }}>
        {tabs.map((t) => (
          <button key={t.key}
            onClick={() => { setActiveSection(t.key as typeof activeSection); if (t.key === 'auditoria') loadAudit() }}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              background: 'transparent', border: 'none', borderRadius: '0',
              borderBottom: activeSection === t.key ? '2px solid #F59E0B' : '2px solid transparent',
              color: activeSection === t.key ? '#F59E0B' : '#64748B',
              transition: 'color 0.12s, border-color 0.12s',
              marginBottom: '-1px',
            }}
            onMouseEnter={e => { if (activeSection !== t.key) e.currentTarget.style.color = '#94A3B8' }}
            onMouseLeave={e => { if (activeSection !== t.key) e.currentTarget.style.color = '#64748B' }}
          >
            {t.label}
            {t.badge && (
              <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', background: 'rgba(240,180,41,0.12)', color: '#F59E0B' }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Conteúdo das seções */}
      <div key={activeSection} className="animate-fade-up">
        {activeSection === 'sazonalidade' && (
          <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-display font-bold text-white text-sm">Curva de Sazonalidade — {bench.name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Índice de CPL mês a mês · 1.0 = custo médio</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-[#F0B429]">{MONTH_SHORT[new Date().getMonth()]} {new Date().getFullYear()}</div>
                <div className="text-[10px] text-slate-600">mês atual</div>
              </div>
            </div>
            <SeasonalityChart chartData={seasonCtx.chartData} />
            <div className="mt-4 grid grid-cols-2 gap-3">
              {seasonCtx.peakMonths.length > 0 && (
                <div className="p-3 rounded-xl" style={{ background: 'rgba(255,77,77,0.05)', border: '1px solid rgba(255,77,77,0.2)' }}>
                  <div className="text-[10px] font-bold text-red-400 mb-1">🔴 Meses mais caros</div>
                  <div className="text-xs text-slate-300">{seasonCtx.peakMonths.join(', ')}</div>
                  <div className="text-[10px] text-slate-600 mt-1">Aumente budget para manter volume</div>
                </div>
              )}
              {seasonCtx.valleyMonths.length > 0 && (
                <div className="p-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <div className="text-[10px] font-bold text-green-400 mb-1">🟢 Meses mais baratos</div>
                  <div className="text-xs text-slate-300">{seasonCtx.valleyMonths.join(', ')}</div>
                  <div className="text-[10px] text-slate-600 mt-1">Melhor janela para escalar e testar</div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'cidade' && (
          <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
            <div className="font-display font-bold text-white text-sm mb-1">Inteligência de Mercado Local</div>
            <div className="text-[10px] text-slate-500 mb-1">CPL varia até 2× dependendo do tamanho do mercado</div>
            <CityIntelCard clientData={clientData} bench={bench} />
          </div>
        )}

        {activeSection === 'maturidade' && (
          <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
            <div className="flex items-start justify-between mb-1">
              <div>
                <div className="font-display font-bold text-white text-sm">Curva de Maturidade de Campanha</div>
                <div className="text-[10px] text-slate-500">CPL evolui em 4 fases previsíveis — saiba onde você está</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold" style={{ color: maturity.color }}>{maturity.label}</div>
                <div className="text-[10px] text-slate-600">semana {weeksActive > 0 ? weeksActive : '?'}</div>
              </div>
            </div>
            <MaturityTimeline weeksActive={weeksActive} />
            {campaignHistory.length === 0 && (
              <div className="mt-3 text-[10px] text-slate-600 text-center">
                Registre histórico de campanhas na aba Performance para calcular a maturidade automaticamente.
              </div>
            )}
          </div>
        )}

        {activeSection === 'criativos' && (
          <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
            <div className="font-display font-bold text-white text-sm mb-1">Inteligência de Ângulos Criativos</div>
            <div className="text-[10px] text-slate-500 mb-1">
              Mapeamento de o que está saturado, em alta e subexplorado em <strong className="text-slate-300">{clientData.niche}</strong>
            </div>
            <CreativeAnglesPanel niche={clientData.niche} />
            <div className="mt-4 p-3 rounded-xl text-[10px] text-slate-500"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1E1E24' }}>
              💡 Use os ângulos subexplorados nos seus próximos Testes A/B. Eles têm menor competição e maior potencial de CTR no momento.
            </div>
          </div>
        )}

        {activeSection === 'auditoria' && (
          <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-display font-bold text-white text-sm">Auditoria de Benchmarks</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Origem e frescor dos dados por nicho</div>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#22C55E] inline-block" /> Dados reais (Tavily)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#F0B429] inline-block" /> Estimados (pesquisa)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#EF4444] inline-block" /> Indisponível</span>
              </div>
            </div>

            {auditLoading && (
              <div className="text-center py-8 text-slate-500 text-xs">Carregando auditoria...</div>
            )}

            {!auditLoading && auditData && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#2A2A30]">
                      <th className="text-left py-2 px-2 text-slate-500 font-medium">Nicho</th>
                      <th className="text-center py-2 px-2 text-slate-500 font-medium">Fonte</th>
                      <th className="text-center py-2 px-2 text-slate-500 font-medium">Confiança</th>
                      <th className="text-right py-2 px-2 text-slate-500 font-medium">Atualizado</th>
                      <th className="text-right py-2 px-2 text-slate-500 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditData.map(row => {
                      const color = row.dataSource === 'real_market_data' ? '#22C55E' : row.dataSource === 'estimated_data' ? '#F0B429' : '#EF4444'
                      const label = row.dataSource === 'real_market_data' ? 'real' : row.dataSource === 'estimated_data' ? 'estimado' : 'indisponível'
                      const isRefreshing = refreshingKey === row.key
                      const msg = refreshMsg?.key === row.key ? refreshMsg : null
                      return (
                        <tr key={row.key} className="border-b border-[#1E1E24] hover:bg-white/[0.02] transition-colors">
                          <td className="py-2 px-2">
                            <div className="text-slate-300 text-xs truncate max-w-[200px]">{row.name}</div>
                            {msg && (
                              <div className="text-[10px] mt-0.5" style={{ color: msg.ok ? '#22C55E' : '#EF4444' }}>
                                {msg.ok ? '✓ ' : '✗ '}{msg.text}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]"
                              style={{ background: `${color}12`, color, border: `1px solid ${color}30` }}>
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                              {label}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center text-[10px] text-slate-500">
                            {row.confidence ?? '—'}
                          </td>
                          <td className="py-2 px-2 text-right text-[10px]">
                            {row.updatedAt ? (
                              <span style={{ color: (row.freshDays ?? 99) > 35 ? '#EF4444' : '#22C55E' }}>
                                {row.freshDays}d atrás
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-right">
                            <button
                              onClick={() => refreshNiche(row.key, row.name)}
                              disabled={!!refreshingKey}
                              className="text-[10px] px-2 py-1 rounded-lg transition-all disabled:opacity-40"
                              style={{
                                background: isRefreshing ? 'rgba(240,180,41,0.12)' : 'rgba(255,255,255,0.04)',
                                color: isRefreshing ? '#F0B429' : '#475569',
                                border: `1px solid ${isRefreshing ? 'rgba(240,180,41,0.3)' : '#2A2A30'}`,
                              }}
                            >
                              {isRefreshing ? '⟳ buscando...' : '↻ atualizar'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <div className="mt-4 flex items-center gap-4 text-[10px] text-slate-600">
                  <span>Total: {auditData.length} nichos</span>
                  <span className="text-[#22C55E]">Real: {auditData.filter(r => r.dataSource === 'real_market_data').length}</span>
                  <span className="text-[#F0B429]">Estimado: {auditData.filter(r => r.dataSource === 'estimated_data').length}</span>
                  <span className="text-[#EF4444]">Indisponível: {auditData.filter(r => r.dataSource === 'unavailable').length}</span>
                  {refreshingKey && <span className="text-[#F0B429] animate-pulse">· atualizando {refreshingKey}...</span>}
                </div>
              </div>
            )}

            {!auditLoading && !auditData && (
              <div className="text-center py-8 text-slate-500 text-xs">Nenhum dado de auditoria disponível.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
