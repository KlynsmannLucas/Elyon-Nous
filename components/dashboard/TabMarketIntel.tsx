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

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-white">Inteligência de Mercado</h2>
            <p className="text-xs text-slate-500 mt-1">
              Sazonalidade, mercado local, maturidade e ângulos criativos para <strong className="text-slate-300">{clientData.niche}</strong>
            </p>
          </div>
          {benchMeta && (
            <DataSourceBadge meta={benchMeta} className="flex-shrink-0 mt-0.5" />
          )}
        </div>
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
