// components/dashboard/TabStrategy.tsx
'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { getBenchmark } from '@/lib/niche_benchmarks'
import StrategyAudienceSection from './StrategyAudienceSection'

const C = {
  bg:       '#080D1A',
  surface:  '#0F1629',
  elevated: '#131E35',
  border:   'rgba(255,255,255,0.06)',
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
  text2:    '#94A3B8',
  text3:    'rgba(255,255,255,0.25)',
}

const card: React.CSSProperties = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 14,
  padding: 20,
}

interface Props {
  strategy: Record<string, any>
  analysis: Record<string, any>
}

// ── Utilitários ───────────────────────────────────────────────────────────────

function label(x: string | undefined, fallback = '—') { return x || fallback }

function ChipList({ items, color, icon, limit = 4 }: { items: string[]; color: string; icon: string; limit?: number }) {
  const [showAll, setShowAll] = useState(false)
  if (!items?.length) return null
  const visible = showAll ? items : items.slice(0, limit)
  const extra   = items.length - limit
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
      {visible.map((item, i) => (
        <span key={i} style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 11, padding: '4px 10px', borderRadius: 20,
          background: `${color}18`, color, border: `1px solid ${color}30`,
        }}>
          <span style={{ flexShrink: 0 }}>{icon}</span>
          {item}
        </span>
      ))}
      {!showAll && extra > 0 && (
        <button onClick={() => setShowAll(true)} style={{
          fontSize: 11, padding: '4px 10px', borderRadius: 20, cursor: 'pointer',
          background: 'rgba(255,255,255,0.04)', color: C.text3, border: '1px solid rgba(255,255,255,0.08)',
        }}>
          +{extra} mais
        </button>
      )}
      {showAll && items.length > limit && (
        <button onClick={() => setShowAll(false)} style={{
          fontSize: 11, padding: '4px 10px', borderRadius: 20, cursor: 'pointer',
          background: 'rgba(255,255,255,0.04)', color: C.text3, border: '1px solid rgba(255,255,255,0.08)',
        }}>
          ver menos
        </button>
      )}
    </div>
  )
}

function FunnelStageCard({ label: lbl, icon, goal, tactics, color }: {
  label: string; icon: string; goal: string; tactics: string[]; color: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
      <button onClick={() => setOpen(v => !v)} style={{
        width: '100%', padding: '16px 20px', textAlign: 'left',
        background: open ? `${color}08` : 'transparent', cursor: 'pointer', border: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color }}>{lbl}</span>
          </div>
          <span style={{ color: C.text3, fontSize: 10 }}>{open ? '▲' : '▼'}</span>
        </div>
        <p style={{ fontSize: 12, color: C.text2, marginTop: 8, lineHeight: 1.6 }}>{goal}</p>
      </button>
      {open && (
        <div style={{ padding: '12px 20px 16px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {tactics.map((t, i) => (
              <span key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 11, padding: '4px 10px', borderRadius: 20,
                background: `${color}15`, color, border: `1px solid ${color}30`,
              }}>→ {t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CollapsibleSection({ title, icon, defaultOpen = true, children }: {
  title: string; icon?: string; defaultOpen?: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
      <button onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', cursor: 'pointer', border: 'none', background: 'transparent', textAlign: 'left',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {icon && (
            <span style={{
              width: 30, height: 30, borderRadius: 8, background: C.elevated,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
            }}>{icon}</span>
          )}
          <span style={{ fontWeight: 700, color: C.text1, fontSize: 14 }}>{title}</span>
        </div>
        <span style={{ color: C.text3, fontSize: 11, flexShrink: 0, marginLeft: 12 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div style={{ padding: '0 20px 20px' }}>{children}</div>}
    </div>
  )
}

function FunnelHealthRow({ funnel_health }: { funnel_health: Record<string, any> }) {
  const [active, setActive] = useState<string | null>(null)
  const stages = [
    { key: 'tofu', label: 'TOFU', short: 'Atração'   },
    { key: 'mofu', label: 'MOFU', short: 'Nutrição'  },
    { key: 'bofu', label: 'BOFU', short: 'Conversão' },
  ]
  const color = (s: string) => s === 'ok' ? C.green : s === 'atenção' ? C.gold : C.red
  const emoji = (s: string) => s === 'ok' ? '🟢' : s === 'atenção' ? '🟡' : '🔴'
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {stages.map(({ key, label: lbl, short }) => {
          const s = funnel_health[key]
          if (!s) return null
          const c = color(s.status)
          const isActive = active === key
          return (
            <button key={key} onClick={() => setActive(isActive ? null : key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.2s',
                background: isActive ? `${c}18` : `${c}0D`,
                color: c, border: `1px solid ${isActive ? c : `${c}30`}`,
              }}>
              {emoji(s.status)} {lbl}: {s.status === 'ok' ? 'Saudável' : s.status === 'atenção' ? 'Atenção' : 'Crítico'}
              <span style={{ fontSize: 10, opacity: 0.6 }}>({short})</span>
            </button>
          )
        })}
      </div>
      {active && (() => {
        const s = funnel_health[active]
        const c = color(s.status)
        return (
          <div style={{
            borderRadius: 10, padding: '12px 16px', fontSize: 12, lineHeight: 1.6,
            background: `${c}08`, border: `1px solid ${c}20`,
          }}>
            <span style={{ fontWeight: 600, color: c }}>Problema: </span>
            <span style={{ color: C.text2 }}>{s.issue}</span>
            <span style={{ margin: '0 8px', color: C.text3 }}>·</span>
            <span style={{ fontWeight: 600, color: c }}>Ação: </span>
            <span style={{ color: C.text1 }}>{s.action}</span>
          </div>
        )
      })()}
    </div>
  )
}

// ── Score Growth ──────────────────────────────────────────────────────────────

function calcScoreGrowth(
  strategyScore: number,
  latestAudit: any,
  bench: any,
): { score: number; label: string; breakdown: string } {
  if (!latestAudit) {
    return { score: strategyScore, label: strategyScore >= 75 ? 'Boa' : 'Regular', breakdown: 'Baseado na estratégia gerada.' }
  }
  const healthScore = latestAudit?.health_score || strategyScore
  let score = healthScore
  const notes: string[] = []
  const venc     = (latestAudit._campanhasClassificadas?.vencedoras || []).length
  const criticas = (latestAudit._campanhasClassificadas?.criticas   || []).length
  const checklist: any[] = latestAudit._trackingChecklist || []
  const unverified   = checklist.filter((t: any) => t.status === 'nao_verificado').length
  const problems     = checklist.filter((t: any) => t.status === 'problema').length
  const confidence   = latestAudit._dataQuality?.confidence
  const wastePercent = latestAudit._wastePercent || 0
  const realCPL      = Number(latestAudit._realMetrics?.avgCPL || 0)
  const oqef: any[]  = latestAudit.o_que_eu_faria_agora || []
  const hasP1 = oqef.some((a: any) => (typeof a === 'object' ? a?.prioridade : null) === 'P1')

  if (venc >= 3) { score += 5; notes.push('+5 campanhas vencedoras') }
  else if (venc >= 1) { score += 2; notes.push('+2 campanha vencedora') }
  if (bench && realCPL > 0) {
    if (realCPL < bench.cpl_min) { score += 8; notes.push('+8 CPL abaixo benchmark') }
    else if (realCPL <= bench.cpl_max) { score += 3; notes.push('+3 CPL no benchmark') }
    else { score -= 5; notes.push('−5 CPL acima benchmark') }
  }
  if (criticas >= 3) { score -= 8; notes.push('−8 campanhas críticas') }
  else if (criticas >= 1) { score -= 3; notes.push('−3 campanha crítica') }
  if (unverified >= 4) { score -= 6; notes.push('−6 tracking não verificado') }
  else if (unverified >= 2) { score -= 2; notes.push('−2 tracking pendente') }
  if (problems > 0) { score -= 4 * problems; notes.push(`−${4 * problems} problemas tracking`) }
  if (confidence === 'baixa') { score -= 10; notes.push('−10 confiança baixa') }
  else if (confidence === 'media') { score -= 3; notes.push('−3 confiança média') }
  if (wastePercent > 30) { score -= 6; notes.push(`−6 desperdício ${wastePercent}%`) }
  else if (wastePercent > 15) { score -= 3; notes.push(`−3 desperdício ${wastePercent}%`) }
  if (hasP1) { score -= 3; notes.push('−3 ação P1 pendente') }

  score = Math.min(100, Math.max(0, Math.round(score)))
  const lbl = score >= 80 ? 'Excelente' : score >= 65 ? 'Boa' : score >= 50 ? 'Regular' : 'Crítico'
  return { score, label: lbl, breakdown: notes.slice(0, 4).join(' · ') || 'Baseado no score de saúde.' }
}

// ── Status estratégico da conta (calculado a partir da auditoria) ──────────────

type StrategicStatusKey = 'pronta_escalar' | 'escala_controlada' | 'corrigir_antes' | 'diagnostico_insuficiente' | 'alto_risco'

function calcStrategicStatus(
  latestAudit: any,
  bench: any,
  strategy: any,
): { key: StrategicStatusKey; label: string; color: string; description: string } {
  // Usa o status retornado pela IA se disponível
  const apiStatus = strategy?.strategic_status as StrategicStatusKey | undefined

  const healthScore  = latestAudit?.health_score || 0
  const confidence   = latestAudit?._dataQuality?.confidence
  const checklist: any[] = latestAudit?._trackingChecklist || []
  const problems     = checklist.filter((t: any) => t.status === 'problema').length
  const unverified   = checklist.filter((t: any) => t.status === 'nao_verificado').length
  const trackingRuim = latestAudit?.tracking?.prioridade_maxima || problems > 0
  const wastePercent = latestAudit?._wastePercent || 0
  const venc         = (latestAudit?._campanhasClassificadas?.vencedoras || []).length
  const realSpend    = Number(latestAudit?._realMetrics?.totalSpend || 0)
  const realLeads    = Number(latestAudit?._realMetrics?.totalLeads || 0)
  const realCPL      = Number(latestAudit?._realMetrics?.avgCPL || 0)
  const hasData      = realSpend > 0 || realLeads > 0 || healthScore > 0

  const map: Record<StrategicStatusKey, { label: string; color: string; description: string }> = {
    pronta_escalar: {
      label: 'Pronta para Escalar',
      color: C.green,
      description: 'Tracking verificado, dados confiáveis, campanhas vencedoras. Prioridade: aumentar budget.',
    },
    escala_controlada: {
      label: 'Escala Controlada',
      color: C.gold,
      description: 'Bons resultados, mas com riscos moderados. Escalar com monitoramento semanal.',
    },
    corrigir_antes: {
      label: 'Corrigir antes de Escalar',
      color: C.orange,
      description: 'Tracking fraco, dados de baixa confiança ou desperdício alto. Escala amplificará problemas.',
    },
    diagnostico_insuficiente: {
      label: 'Diagnóstico Insuficiente',
      color: C.text3,
      description: 'Dados insuficientes para estratégia confiável. Execute a Análise Profunda primeiro.',
    },
    alto_risco: {
      label: 'Alto Risco',
      color: C.red,
      description: 'Performance baixa + tracking ruim + desperdício alto. Revisão completa necessária.',
    },
  }

  // Calcula localmente
  let computedKey: StrategicStatusKey = 'diagnostico_insuficiente'
  if (hasData) {
    if (healthScore < 40 && (trackingRuim || wastePercent > 30)) {
      computedKey = 'alto_risco'
    } else if (trackingRuim || confidence === 'baixa' || wastePercent > 25 || unverified >= 5) {
      computedKey = 'corrigir_antes'
    } else if (healthScore >= 70 && confidence !== 'baixa' && !trackingRuim && venc > 0 && wastePercent < 15) {
      computedKey = 'pronta_escalar'
    } else {
      computedKey = 'escala_controlada'
    }
  }

  const finalKey = apiStatus && map[apiStatus] ? apiStatus : computedKey
  return { key: finalKey, ...map[finalKey] }
}

// ── Componente principal ───────────────────────────────────────────────────────

export function TabStrategy({ strategy, analysis }: Props) {
  const { clientData, auditCache, connectedAccounts, addPendingActions } = useAppStore()

  const cacheKey    = clientData?.clientName || ''
  const auditEntry  = auditCache[cacheKey]?.[0]
  const latestAudit = auditEntry?.audit
  const auditDate   = auditEntry?.createdAt

  const realMetrics       = latestAudit?._realMetrics
  const hasRealMetrics    = Boolean(realMetrics?.totalSpend > 0 || realMetrics?.totalLeads > 0)
  const campanhasClass    = latestAudit?._campanhasClassificadas
  const dataQuality       = latestAudit?._dataQuality
  const trackingChecklist = (latestAudit?._trackingChecklist as any[]) || []
  const auditSource       = latestAudit?._auditSource
  const gargalos          = (latestAudit?.gargalos as any[]) || []
  const oQueEuFariaAgora  = (latestAudit?.o_que_eu_faria_agora as any[]) || []
  const healthScore       = latestAudit?.health_score
  const grade             = latestAudit?.grade
  const hasFullAudit      = Boolean(latestAudit && (healthScore || campanhasClass || gargalos.length > 0))
  const metaConnected     = connectedAccounts.some(a => a.platform === 'meta')

  const unverifiedCount = trackingChecklist.filter((t: any) => t.status === 'nao_verificado').length
  const problemCount    = trackingChecklist.filter((t: any) => t.status === 'problema').length
  const trackingCritico = latestAudit?.tracking?.prioridade_maxima || problemCount > 0
  const trackingFraco   = trackingCritico || unverifiedCount >= 4
  const confidenceBaixa = dataQuality?.confidence === 'baixa'

  const bench = clientData?.niche ? getBenchmark(clientData.niche) : null

  const growthCalc     = calcScoreGrowth(strategy?.intelligence_score || 0, latestAudit, bench)
  const strategicStatus = calcStrategicStatus(latestAudit, bench, strategy)

  const hasRealData  = strategy && strategy.priority_ranking?.length > 0
  const hasGrowthData = strategy?.growth_diagnosis || strategy?.funnel_strategy

  // Tese de crescimento: prioriza o campo da IA, fallback para buildHeadOfGrowthText
  const growthThesis = strategy?.growth_thesis || (() => {
    if (!latestAudit) return strategy?.recommendation || ''
    const parts: string[] = []
    const rs = realMetrics?.totalSpend ? Number(realMetrics.totalSpend) : 0
    const rl = realMetrics?.totalLeads ? Number(realMetrics.totalLeads) : 0
    const rc = realMetrics?.avgCPL ? Number(realMetrics.avgCPL) : 0
    if (rs > 0) parts.push(`Conta com R$${Math.round(rs / 1000)}k investidos e ${rl.toLocaleString('pt-BR')} leads gerados.`)
    if (bench && rc > 0) {
      if (rc < bench.cpl_min) parts.push(`CPL de R$${rc} está ${Math.round((1 - rc / bench.cpl_min) * 100)}% abaixo do benchmark — escala é a prioridade.`)
      else if (rc <= bench.cpl_max) parts.push(`CPL de R$${rc} está dentro do benchmark — otimizar antes de escalar agressivamente.`)
      else parts.push(`CPL de R$${rc} acima do benchmark (R$${bench.cpl_min}–${bench.cpl_max}) — revisar segmentação antes de escalar.`)
    }
    if (trackingFraco) parts.push(`Tracking parcialmente não verificado — validar eventos de conversão é pré-requisito para qualquer escala.`)
    if (gargalos.length > 0) parts.push(`Maior bloqueio: ${gargalos[0]?.titulo}.`)
    return parts.join(' ') || strategy?.recommendation || ''
  })()

  // Budget
  const budgetIsReal     = hasRealMetrics && realMetrics?.totalSpend > 0
  const totalBudgetNum   = hasRealData
    ? strategy.priority_ranking.reduce((s: number, ch: any) => s + (ch.budget_brl || 0), 0)
    : 0
  const totalBudget = totalBudgetNum > 0 ? `R$${totalBudgetNum.toLocaleString('pt-BR')}` : '—'

  // Matriz estratégica: API ou calculada localmente
  const strategicMatrix = strategy?.strategic_matrix || null
  const budgetDecision  = strategy?.budget_decision  || null
  const plan7_30_90     = strategy?.plan_7_30_90     || null
  const strategicRisks  = strategy?.strategic_risks  || []
  const nextMoves       = strategy?.next_moves       || strategy?.key_actions || []

  // Gargalos como bloqueios estratégicos
  const gargalosComoDecisoes = gargalos.map((g: any) => ({
    bloqueio: g.titulo,
    decisao: (() => {
      const t = (g.titulo || '').toLowerCase()
      const d = (g.descricao || '').toLowerCase()
      if (t.includes('tracking') || d.includes('tracking')) return 'Não escalar antes de validar eventos de conversão no Events Manager.'
      if (t.includes('frequência') || t.includes('frequencia') || d.includes('criativo')) return 'Renovar criativos antes de aumentar orçamento para evitar queda de CTR.'
      if (t.includes('remarketing') || t.includes('mofu') || t.includes('bofu')) return 'Criar camada MOFU/BOFU antes de expandir tráfego frio.'
      if (t.includes('cpl') || t.includes('custo por lead')) return `Revisar segmentação e criativos até CPL atingir benchmark (R$${bench?.cpl_min || 'X'}–${bench?.cpl_max || 'Y'}).`
      if (t.includes('desperdício') || t.includes('desperdicio') || t.includes('verba')) return 'Pausar grupos sem conversão antes de alocar mais budget.'
      return g.descricao ? g.descricao.split('.')[0] + '.' : 'Revisar antes de escalar.'
    })(),
    impacto: g.impacto || g.severidade || '',
  }))

  // Vencedoras com decisão de escala
  const vencedoras: any[] = campanhasClass?.vencedoras || []
  const criticas: any[]   = campanhasClass?.criticas   || []
  const vencediretriz = (() => {
    if (!vencedoras.length) return null
    const topCPL = vencedoras
      .filter((c: any) => c.spend > 0 && c.leads > 0)
      .map((c: any) => ({ name: c.name, cpl: Math.round(c.spend / c.leads) }))
      .sort((a, b) => a.cpl - b.cpl)
    const abaixoBench = bench ? topCPL.filter(c => c.cpl < bench.cpl_min) : []
    return {
      count: vencedoras.length,
      exemplos: topCPL.slice(0, 2),
      abaixoBench: abaixoBench.length,
      recomendacao: bench
        ? abaixoBench.length > 0
          ? `Aumentar orçamento 15–20%/semana nas ${abaixoBench.length} campanha${abaixoBench.length > 1 ? 's' : ''} com CPL abaixo de R$${bench.cpl_min}. Pausar automaticamente se CPL passar de R$${bench.cpl_max}.`
          : `Escalar com cautela — manter CPL abaixo de R$${bench.cpl_max}. Aumentar 10–15%/semana e monitorar frequência.`
        : 'Aumentar orçamento 15–20% por semana nas vencedoras com estabilidade de CPL.',
    }
  })()

  const [sentActions, setSentActions] = useState<Set<number>>(new Set())

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Empty state — sem dados ── */}
      {!hasFullAudit && !hasRealMetrics && !metaConnected && !hasRealData && (
        <div style={{
          ...card, textAlign: 'center', padding: '40px 24px',
          background: 'rgba(124,58,237,0.03)', border: '1px solid rgba(124,58,237,0.12)',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🧭</div>
          <div style={{ fontWeight: 700, color: C.text1, fontSize: 16, marginBottom: 8 }}>
            Execute a Análise Profunda primeiro
          </div>
          <p style={{ color: C.text2, fontSize: 13, lineHeight: 1.6, marginBottom: 20, maxWidth: 420, margin: '0 auto 20px' }}>
            Para gerar uma estratégia real baseada nos dados da conta, execute a Análise Profunda antes. Sem diagnóstico, só há estimativas de benchmark.
          </p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('elyon:navigate', { detail: 'analise' }))}
            style={{
              padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.4)',
              color: C.purpleL,
            }}>
            Ir para Análise Profunda →
          </button>
        </div>
      )}

      {/* ── Banner de fonte ── */}
      {hasFullAudit ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 12,
          background: C.greenBg, border: '1px solid rgba(34,197,94,0.25)', flexWrap: 'wrap',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, flexShrink: 0, boxShadow: `0 0 6px ${C.green}` }} />
          <div style={{ flex: 1 }}>
            <span style={{ color: C.green, fontWeight: 700, fontSize: 12 }}>Estratégia baseada na última Análise Profunda</span>
            {auditDate && (
              <span style={{ color: C.text3, fontSize: 11, marginLeft: 8 }}>
                · {new Date(auditDate).toLocaleDateString('pt-BR')}
              </span>
            )}
            {hasRealMetrics && (
              <span style={{ color: C.text3, fontSize: 11, marginLeft: 8 }}>
                · R${realMetrics.totalSpend?.toLocaleString('pt-BR') || '0'} investidos
                {realMetrics.totalLeads > 0 && ` · ${realMetrics.totalLeads} leads`}
                {realMetrics.avgCPL && ` · CPL R$${realMetrics.avgCPL}`}
              </span>
            )}
          </div>
          {auditSource && auditSource !== 'auto' && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8,
              color: auditSource === 'api' ? C.blue : auditSource === 'upload' ? C.green : C.gold,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              {auditSource === 'api' ? '🔗 API' : auditSource === 'upload' ? '📂 Arquivo' : '⚡ Consolidado'}
            </span>
          )}
        </div>
      ) : hasRealMetrics ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 12,
          background: C.goldBg, border: '1px solid rgba(245,158,11,0.25)',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.gold, flexShrink: 0 }} />
          <span style={{ color: C.gold, fontWeight: 600, fontSize: 12 }}>Estratégia baseada em dados reais — Análise Profunda não executada</span>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('elyon:navigate', { detail: 'analise' }))}
            style={{
              marginLeft: 'auto', flexShrink: 0, padding: '5px 12px', borderRadius: 8,
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
              background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: C.gold,
            }}>
            Analisar conta →
          </button>
        </div>
      ) : metaConnected ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          padding: '10px 16px', borderRadius: 12, background: C.goldBg, border: '1px solid rgba(245,158,11,0.25)',
        }}>
          <span style={{ color: C.gold, fontWeight: 600, fontSize: 12 }}>Estratégia baseada em estimativas do nicho · Execute a Análise Profunda para usar dados reais</span>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('elyon:navigate', { detail: 'analise' }))}
            style={{ fontSize: 12, color: C.gold, flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Ir para Análise Profunda →
          </button>
        </div>
      ) : null}

      {/* ── Header: Status estratégico + scores ── */}
      {(hasFullAudit || hasRealData) && (
        <div style={{ ...card, padding: '16px 20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
            {/* Status estratégico — destaque principal */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 16px', borderRadius: 10,
              background: `${strategicStatus.color}10`,
              border: `1px solid ${strategicStatus.color}35`,
            }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: strategicStatus.color }}>
                {strategicStatus.key === 'pronta_escalar'         ? '🚀'
                  : strategicStatus.key === 'escala_controlada'   ? '📈'
                  : strategicStatus.key === 'corrigir_antes'      ? '⚠'
                  : strategicStatus.key === 'alto_risco'          ? '🚨'
                  : '🔍'}
              </span>
              <div>
                <div style={{ fontSize: 11, color: C.text3, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 2 }}>
                  Status estratégico
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: strategicStatus.color }}>
                  {strategicStatus.label}
                </div>
              </div>
            </div>

            <div style={{ width: '1px', height: 40, background: C.border, flexShrink: 0 }} />

            {/* Score saúde */}
            {hasFullAudit && (
              <div>
                <div style={{ fontSize: 10, color: C.text3, marginBottom: 2 }}>Saúde da conta</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                  <span style={{
                    fontSize: 28, fontWeight: 800, lineHeight: 1,
                    color: grade === 'A' ? C.green : grade === 'B' ? C.gold : grade === 'C' ? C.orange : C.red,
                  }}>{healthScore}</span>
                  <span style={{ fontSize: 12, color: C.text3 }}>/100</span>
                  <span style={{
                    fontSize: 16, fontWeight: 700, marginLeft: 4,
                    color: grade === 'A' ? C.green : grade === 'B' ? C.gold : grade === 'C' ? C.orange : C.red,
                  }}>{grade}</span>
                </div>
              </div>
            )}

            {/* Score growth */}
            <div>
              <div style={{ fontSize: 10, color: C.text3, marginBottom: 2 }}>Score Growth</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: growthCalc.score >= 70 ? C.green : growthCalc.score >= 50 ? C.gold : C.red }}>
                {growthCalc.score}<span style={{ fontSize: 11, color: C.text3 }}>/100</span>
              </div>
            </div>

            {/* Confiança */}
            {dataQuality?.confidence && (
              <div>
                <div style={{ fontSize: 10, color: C.text3, marginBottom: 2 }}>Confiança</div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8,
                  color:      dataQuality.confidence === 'alta' ? C.green : dataQuality.confidence === 'media' ? C.gold : C.red,
                  background: dataQuality.confidence === 'alta' ? 'rgba(34,197,94,0.1)' : dataQuality.confidence === 'media' ? 'rgba(240,180,41,0.1)' : 'rgba(239,68,68,0.1)',
                }}>
                  {dataQuality.confidence === 'alta' ? '✓ Alta' : dataQuality.confidence === 'media' ? '~ Média' : '! Baixa'}
                </span>
              </div>
            )}

            {/* Budget */}
            <div style={{ marginLeft: 'auto', textAlign: 'right' as const }}>
              <div style={{ fontSize: 10, color: C.text3, marginBottom: 2 }}>Budget</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.gold }}>{totalBudget}</div>
              <div style={{ fontSize: 9, color: C.text3 }}>
                {budgetIsReal ? '● Real' : '○ Estimado'}
              </div>
            </div>
          </div>

          {/* Descrição do status */}
          <div style={{ marginTop: 12, fontSize: 11, color: C.text2, lineHeight: 1.5, padding: '8px 12px', borderRadius: 8, background: `${strategicStatus.color}06`, border: `1px solid ${strategicStatus.color}15` }}>
            {strategicStatus.description}
            {hasFullAudit && growthCalc.breakdown && (
              <span style={{ color: C.text3, marginLeft: 8 }}>· {growthCalc.breakdown}</span>
            )}
          </div>
        </div>
      )}

      {/* ── Tese de Crescimento ── */}
      {growthThesis && (
        <div style={{
          borderRadius: 14, padding: '18px 22px',
          background: 'linear-gradient(135deg, rgba(124,58,237,0.09), rgba(124,58,237,0.02))',
          border: '1px solid rgba(124,58,237,0.22)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: 'rgba(124,58,237,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>🧭</div>
            <div>
              <div style={{ fontSize: 10, color: C.purpleL, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 8 }}>
                Tese de Crescimento
              </div>
              <p style={{ fontSize: 13, color: C.text1, lineHeight: 1.7, margin: 0 }}>{growthThesis}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Público-Alvo & Persona (híbrido: real Meta → cadastro → IA) ── */}
      <StrategyAudienceSection strategy={strategy} clientData={clientData} />

      {/* ── Alerta de tracking fraco ── */}
      {(trackingFraco || confidenceBaixa) && (
        <div style={{
          padding: '12px 16px', borderRadius: 12, display: 'flex', alignItems: 'flex-start', gap: 10,
          background: trackingCritico ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
          border: `1px solid ${trackingCritico ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>{trackingCritico ? '🚨' : '⚠'}</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: trackingCritico ? C.red : C.gold, marginBottom: 4 }}>
              {trackingCritico ? 'Decisão bloqueada: escala agressiva com tracking com problemas' : `Atenção: ${unverifiedCount} itens de tracking não verificados`}
            </div>
            <p style={{ fontSize: 11, color: C.text2, margin: 0, lineHeight: 1.5 }}>
              {trackingCritico
                ? 'Escalar budget com tracking com problemas pode otimizar para o evento errado, multiplicando o custo por lead inválido. Corrija os eventos de conversão antes de qualquer aumento de investimento.'
                : `${unverifiedCount} itens do checklist de tracking sem confirmação. Valide os eventos de conversão no Events Manager antes de escalar agressivamente.`}
            </p>
          </div>
        </div>
      )}

      {/* ── Matriz Estratégica ── */}
      {(strategicMatrix || gargalosComoDecisoes.length > 0 || vencediretriz) && (
        <div>
          <div style={{ fontWeight: 700, color: C.text1, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: C.elevated, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>⚡</span>
            Matriz Estratégica
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>

            {/* ESCALAR */}
            <div style={{ ...card, borderLeft: `3px solid ${C.green}` }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.green, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 12 }}>
                🚀 Escalar
              </div>
              {/* Vencedoras da auditoria */}
              {vencediretriz && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.text1, marginBottom: 4 }}>
                        Campanhas vencedoras ({vencediretriz.count})
                      </div>
                      {vencediretriz.exemplos.length > 0 && (
                        <div style={{ fontSize: 10, color: C.text3, marginBottom: 6 }}>
                          Evidência: {vencediretriz.exemplos.map(c => `${c.name} (CPL R$${c.cpl})`).join(', ')}
                        </div>
                      )}
                      <p style={{ fontSize: 11, color: C.text2, margin: 0, lineHeight: 1.5 }}>
                        {vencediretriz.recomendacao}
                      </p>
                      {bench && (
                        <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>
                          Condição: CPL deve permanecer abaixo de R${bench.cpl_max}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* Da IA */}
              {strategicMatrix?.escalar?.map((item: any, i: number) => (
                <div key={i} style={{ borderTop: i > 0 || vencediretriz ? `1px solid ${C.border}` : 'none', paddingTop: i > 0 || vencediretriz ? 10 : 0, marginTop: i > 0 || vencediretriz ? 10 : 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text1, marginBottom: 4 }}>{item.decision}</div>
                  {item.evidence && <div style={{ fontSize: 10, color: C.text3, marginBottom: 4 }}>Evidência: {item.evidence}</div>}
                  {item.condition && <div style={{ fontSize: 10, color: C.gold, marginBottom: 4 }}>Condição: {item.condition}</div>}
                  {item.action && <p style={{ fontSize: 11, color: C.text2, margin: 0 }}>→ {item.action}</p>}
                </div>
              ))}
              {!vencediretriz && !strategicMatrix?.escalar?.length && (
                <p style={{ fontSize: 11, color: C.text3, margin: 0 }}>Identifique campanhas com CPL abaixo do benchmark para escalar.</p>
              )}
            </div>

            {/* CORRIGIR */}
            <div style={{ ...card, borderLeft: `3px solid ${C.orange}` }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.orange, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 12 }}>
                🔧 Corrigir
              </div>
              {/* Gargalos da auditoria como decisões */}
              {gargalosComoDecisoes.slice(0, 3).map((g, i) => (
                <div key={i} style={{ borderTop: i > 0 ? `1px solid ${C.border}` : 'none', paddingTop: i > 0 ? 10 : 0, marginTop: i > 0 ? 10 : 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text1, marginBottom: 4 }}>{g.bloqueio}</div>
                  {g.impacto && <div style={{ fontSize: 10, color: C.red, marginBottom: 4 }}>{g.impacto}</div>}
                  <p style={{ fontSize: 11, color: C.text2, margin: 0 }}>→ {g.decisao}</p>
                </div>
              ))}
              {/* Da IA */}
              {strategicMatrix?.corrigir?.map((item: any, i: number) => (
                <div key={`ai-${i}`} style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginTop: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text1, marginBottom: 4 }}>{item.decision}</div>
                  {item.risk && <div style={{ fontSize: 10, color: C.red, marginBottom: 4 }}>Risco: {item.risk}</div>}
                  {item.action && <p style={{ fontSize: 11, color: C.text2, margin: 0 }}>→ {item.action}</p>}
                </div>
              ))}
              {!gargalosComoDecisoes.length && !strategicMatrix?.corrigir?.length && (
                <p style={{ fontSize: 11, color: C.text3, margin: 0 }}>Nenhum bloqueio crítico identificado na auditoria.</p>
              )}
            </div>

            {/* TESTAR */}
            <div style={{ ...card, borderLeft: `3px solid ${C.purpleL}` }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.purpleL, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 12 }}>
                🧪 Testar
              </div>
              {strategicMatrix?.testar?.map((item: any, i: number) => (
                <div key={i} style={{ borderTop: i > 0 ? `1px solid ${C.border}` : 'none', paddingTop: i > 0 ? 10 : 0, marginTop: i > 0 ? 10 : 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text1, marginBottom: 4 }}>{item.hypothesis}</div>
                  {item.metric && <div style={{ fontSize: 10, color: C.text3, marginBottom: 4 }}>Métrica: {item.metric}</div>}
                  {item.deadline && <div style={{ fontSize: 10, color: C.purpleL }}>Prazo: {item.deadline}</div>}
                </div>
              ))}
              {/* fallback com campanhas de atenção */}
              {!strategicMatrix?.testar?.length && campanhasClass?.atencao?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text1, marginBottom: 4 }}>
                    {campanhasClass.atencao.length} campanha{campanhasClass.atencao.length > 1 ? 's' : ''} em atenção
                  </div>
                  <p style={{ fontSize: 11, color: C.text2, margin: 0 }}>→ Candidatas a teste A/B de criativo, segmentação ou oferta antes de aumentar verba.</p>
                  {bench && <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>Métrica: CPL abaixo de R${bench.cpl_max}</div>}
                </div>
              )}
              {!strategicMatrix?.testar?.length && !campanhasClass?.atencao?.length && (
                <p style={{ fontSize: 11, color: C.text3, margin: 0 }}>Testar novos criativos com ângulos diferentes (dor / aspiração / prova social).</p>
              )}
            </div>

            {/* CORTAR */}
            <div style={{ ...card, borderLeft: `3px solid ${C.red}` }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.red, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 12 }}>
                ✂️ Cortar
              </div>
              {/* Campanhas críticas */}
              {criticas.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text1, marginBottom: 4 }}>
                    {criticas.length} campanha{criticas.length > 1 ? 's' : ''} crítica{criticas.length > 1 ? 's' : ''}
                  </div>
                  <p style={{ fontSize: 11, color: C.text2, margin: '0 0 4px' }}>
                    → Reduzir verba ou pausar. {bench ? `Campanhas com CPL acima de R$${bench.cpl_max} por 3+ dias.` : 'Revisar tracking e segmentação antes de reinvestir.'}
                  </p>
                  {latestAudit?._wastePercent > 0 && (
                    <div style={{ fontSize: 10, color: C.red }}>
                      {latestAudit._wastePercent}% do budget em campanhas sem retorno
                    </div>
                  )}
                </div>
              )}
              {strategicMatrix?.cortar?.map((item: any, i: number) => (
                <div key={i} style={{ borderTop: i > 0 || criticas.length > 0 ? `1px solid ${C.border}` : 'none', paddingTop: i > 0 || criticas.length > 0 ? 10 : 0, marginTop: i > 0 || criticas.length > 0 ? 10 : 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text1, marginBottom: 4 }}>{item.decision}</div>
                  {item.criterion && <p style={{ fontSize: 11, color: C.text2, margin: 0 }}>Critério: {item.criterion}</p>}
                </div>
              ))}
              {!criticas.length && !strategicMatrix?.cortar?.length && bench && (
                <p style={{ fontSize: 11, color: C.text3, margin: 0 }}>Pausar grupos com CPL acima de R${bench.cpl_max} por mais de 3 dias consecutivos.</p>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── Decisão de Orçamento ── */}
      {(budgetDecision || hasRealData) && (
        <div style={{ ...card }}>
          <div style={{ fontWeight: 700, color: C.text1, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: C.elevated, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>💰</span>
            Decisão de Orçamento
            <span style={{ fontSize: 10, color: C.text3, fontWeight: 400, marginLeft: 4 }}>
              {budgetIsReal ? '● Real' : '○ Estimado (benchmark)'}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {[
              { key: 'maintain',             label: 'Manter',    color: C.blue,   icon: '⟷' },
              { key: 'reallocate',            label: 'Realocar',  color: C.gold,   icon: '⇄' },
              { key: 'scale',                 label: 'Escalar',   color: C.green,  icon: '↑' },
              { key: 'cut',                   label: 'Cortar',    color: C.red,    icon: '↓' },
            ].map(({ key, label: lbl, color, icon }) => {
              const text = budgetDecision?.[key]
              if (!text) return null
              return (
                <div key={key} style={{
                  padding: '10px 12px', borderRadius: 10,
                  background: `${color}06`, border: `1px solid ${color}20`,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 4 }}>
                    {icon} {lbl}
                  </div>
                  <p style={{ fontSize: 11, color: C.text2, margin: 0, lineHeight: 1.5 }}>{text}</p>
                </div>
              )
            })}
          </div>
          {budgetDecision?.condition_to_increase && (
            <div style={{
              marginTop: 10, padding: '10px 14px', borderRadius: 10,
              background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.18)',
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.purpleL, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Condição para aumentar investimento:</span>
              <p style={{ fontSize: 11, color: C.text2, margin: '4px 0 0', lineHeight: 1.5 }}>{budgetDecision.condition_to_increase}</p>
            </div>
          )}
          {/* fallback com distribuição por canal */}
          {!budgetDecision && hasRealData && strategy.priority_ranking?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {strategy.priority_ranking.map((ch: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: C.elevated, borderRadius: 10 }}>
                  <div style={{ flex: 1, fontWeight: 600, color: C.text1, fontSize: 12 }}>{ch.channel}</div>
                  <span style={{ color: C.gold, fontWeight: 700, fontSize: 13 }}>R${(ch.budget_brl || 0).toLocaleString('pt-BR')}</span>
                  {ch.budget_pct && <span style={{ fontSize: 11, color: C.text3 }}>({ch.budget_pct}%)</span>}
                  <span style={{ fontSize: 11, color: C.text2 }}>CPL R${ch.cpl_min}–{ch.cpl_max}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Plano 7 / 30 / 90 dias ── */}
      {(plan7_30_90 || hasRealData) && (() => {
        type PlanTab = '7d' | '30d' | '90d'
        const Plan730 = () => {
          const [tab, setTab] = useState<PlanTab>('7d')
          const tabs: { id: PlanTab; label: string; color: string; data: any[] | undefined }[] = [
            { id: '7d',  label: '7 dias',   color: C.red,    data: plan7_30_90?.seven_days },
            { id: '30d', label: '30 dias',  color: C.gold,   data: plan7_30_90?.thirty_days },
            { id: '90d', label: '90 dias',  color: C.green,  data: plan7_30_90?.ninety_days },
          ]
          const active = tabs.find(t => t.id === tab)!
          const items = active.data || []

          // Fallback para plan_90_days da IA se plan_7_30_90 ausente
          const fallbackItems: string[] = !plan7_30_90 && strategy.plan_90_days?.length > 0
            ? (tab === '7d'
              ? strategy.plan_90_days[0]?.week_1 || []
              : tab === '30d'
              ? strategy.plan_90_days[1]?.week_1 || []
              : strategy.plan_90_days[2]?.week_1 || [])
            : []

          return (
            <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
                {tabs.map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)} style={{
                    flex: 1, padding: '12px 0', fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                    color:      tab === t.id ? t.color : C.text3,
                    background: tab === t.id ? `${t.color}08` : 'transparent',
                    borderBottom: tab === t.id ? `2px solid ${t.color}` : '2px solid transparent',
                  }}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Enriquecido com gargalos no 7d */}
                {tab === '7d' && hasFullAudit && gargalos.length > 0 && (
                  <div style={{
                    padding: '8px 12px', borderRadius: 8, fontSize: 11,
                    background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)',
                    color: C.text2, lineHeight: 1.5,
                  }}>
                    🎯 <span style={{ fontWeight: 600, color: C.red }}>Prioridade 7d: </span>
                    {gargalos[0]?.titulo} — {gargalosComoDecisoes[0]?.decisao}
                  </div>
                )}
                {items.length > 0 ? items.map((item: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: `${active.color}05`, borderRadius: 10, border: `1px solid ${active.color}18` }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                      background: `${active.color}20`, color: active.color, fontSize: 10, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.text1, marginBottom: 4 }}>
                        {item.objective || item}
                      </div>
                      {item.action && <p style={{ fontSize: 11, color: C.text2, margin: '0 0 4px', lineHeight: 1.5 }}>→ {item.action}</p>}
                      {item.metric && <div style={{ fontSize: 10, color: active.color }}>✓ {item.metric}</div>}
                    </div>
                  </div>
                )) : fallbackItems.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {fallbackItems.map((a: string, i: number) => (
                      <span key={i} style={{
                        fontSize: 11, padding: '4px 10px', borderRadius: 20,
                        background: `${active.color}10`, color: active.color, border: `1px solid ${active.color}25`,
                      }}>→ {a}</span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: C.text3, margin: 0 }}>Dados não disponíveis para este período.</p>
                )}
              </div>
            </div>
          )
        }
        return (
          <div>
            <div style={{ fontWeight: 700, color: C.text1, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: C.elevated, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>📅</span>
              Plano 7 / 30 / 90 Dias
            </div>
            <Plan730 />
          </div>
        )
      })()}

      {/* ── Estratégia de Funil ── */}
      {hasGrowthData && strategy.funnel_strategy && (
        <div>
          <div style={{ fontWeight: 700, color: C.text1, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 30, height: 30, borderRadius: 8, background: C.elevated,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
            }}>🎯</span>
            <span style={{ fontSize: 14 }}>Estratégia de Funil</span>
            <span style={{ fontSize: 10, color: C.text3, fontWeight: 400 }}>clique para ver táticas</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <FunnelStageCard label="TOFU — Atração"   icon="📣" color={C.blue}
              goal={strategy.funnel_strategy.tofu?.goal    || ''} tactics={strategy.funnel_strategy.tofu?.tactics    || []} />
            <FunnelStageCard label="MOFU — Nutrição"  icon="💬" color={C.purpleL}
              goal={strategy.funnel_strategy.mofu?.goal    || ''} tactics={strategy.funnel_strategy.mofu?.tactics    || []} />
            <FunnelStageCard label="BOFU — Conversão" icon="💰" color={C.green}
              goal={strategy.funnel_strategy.bofu?.goal    || ''} tactics={strategy.funnel_strategy.bofu?.tactics    || []} />
          </div>
        </div>
      )}

      {/* ── Riscos Estratégicos ── */}
      {strategicRisks.length > 0 && (
        <CollapsibleSection title="Riscos Estratégicos" icon="⚠" defaultOpen={false}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {strategicRisks.map((item: any, i: number) => (
              <div key={i} style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text1, marginBottom: 4 }}>
                  🔴 {item.risk || item}
                </div>
                {item.prevention && (
                  <p style={{ fontSize: 11, color: C.text2, margin: 0, lineHeight: 1.5 }}>
                    → Prevenção: {item.prevention}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* ── Próximos Movimentos ── */}
      {nextMoves.length > 0 && (
        <div style={{ ...card }}>
          <div style={{ fontWeight: 700, color: C.text1, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            <span style={{
              width: 30, height: 30, borderRadius: 8, background: 'rgba(124,58,237,0.12)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
            }}>▶</span>
            Próximos 5 Movimentos
            <span style={{ fontSize: 10, color: C.text3, fontWeight: 400 }}>Execute nessa ordem</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {nextMoves.slice(0, 5).map((move: string, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', background: C.elevated, borderRadius: 10 }}>
                <span style={{
                  width: 24, height: 24, borderRadius: 7, flexShrink: 0, marginTop: 1,
                  background: 'rgba(124,58,237,0.15)', color: C.purpleL,
                  fontSize: 11, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{i + 1}</span>
                <span style={{ fontSize: 12, color: C.text1, lineHeight: 1.5 }}>{move}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Ações da auditoria → Ações Prioritárias (colapsável, não é destaque) ── */}
      {oQueEuFariaAgora.length > 0 && (
        <CollapsibleSection title="Ações da Análise Profunda" icon="📋" defaultOpen={false}>
          <p style={{ fontSize: 11, color: C.text3, marginBottom: 14, lineHeight: 1.5 }}>
            Ações identificadas na Análise Profunda. Já incorporadas na Matriz Estratégica acima.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {oQueEuFariaAgora.map((action: any, i: number) => {
              const isObj  = typeof action === 'object' && action !== null
              const titulo = isObj ? action.titulo : action
              const prio   = isObj ? action.prioridade : null
              const sent   = sentActions.has(i)
              const prioColor = prio === 'P1' ? C.red : prio === 'P2' ? C.gold : C.text3
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: `1px solid ${C.border}` }}>
                  {prio && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, flexShrink: 0,
                      color: prioColor, background: `${prioColor}18`, border: `1px solid ${prioColor}30`,
                    }}>{prio}</span>
                  )}
                  <span style={{ flex: 1, fontSize: 12, color: C.text1 }}>{titulo}</span>
                  {clientData && (
                    <button
                      title={sent ? 'Já enviada' : 'Enviar para Ações Prioritárias'}
                      onClick={() => {
                        if (sent) return
                        addPendingActions(clientData.clientName, [{
                          id: `strategy_${Date.now()}_${i}`,
                          clientId: '',
                          title: titulo,
                          description: isObj ? [action.motivo, action.evidencia].filter(Boolean).join(' — ') : '',
                          platform: 'ambos' as const,
                          urgency: (prio === 'P1' ? 'critica' : prio === 'P2' ? 'alta' : 'media') as 'critica' | 'alta' | 'media',
                          priority: i + 1,
                          impact: isObj ? (action.impacto || '') : '',
                          evidence: isObj ? action.evidencia : undefined,
                          status: 'pendente' as const,
                          source: 'auditoria' as const,
                          origin: 'strategy',
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                        }])
                        setSentActions(prev => new Set(prev).add(i))
                      }}
                      style={{
                        flexShrink: 0, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 8,
                        cursor: sent ? 'default' : 'pointer',
                        background: sent ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
                        color: sent ? C.green : C.text3,
                        border: `1px solid ${sent ? 'rgba(34,197,94,0.3)' : C.border}`,
                      }}
                    >
                      {sent ? '✓' : '+ Ações'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* ── Colapsáveis secundários ── */}
      {hasGrowthData && strategy.brand_positioning && (
        <CollapsibleSection title="Posicionamento de Marca" icon="🏆" defaultOpen={false}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.gold, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>Autoridade</div>
              <ChipList items={strategy.brand_positioning.authority_strategies || []} color={C.gold} icon="→" />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.blue, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>Comunicação</div>
              <ChipList items={strategy.brand_positioning.communication_adjustments || []} color={C.blue} icon="→" />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.purpleL, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>Percepção de Valor</div>
              <ChipList items={strategy.brand_positioning.value_perception || []} color={C.purpleL} icon="→" />
            </div>
          </div>
        </CollapsibleSection>
      )}

      {hasGrowthData && strategy.vision_360 && (
        <CollapsibleSection title="Visão 360°" icon="🌐" defaultOpen={false}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.green, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>Site / Conversão</div>
              <ChipList items={strategy.vision_360.website_improvements || []} color={C.green} icon="→" />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.gold, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>Marketing + Vendas</div>
              <ChipList items={strategy.vision_360.sales_alignment || []} color={C.gold} icon="→" />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.blue, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>Fora dos Anúncios</div>
              <ChipList items={strategy.vision_360.off_ads_opportunities || []} color={C.blue} icon="→" />
            </div>
          </div>
        </CollapsibleSection>
      )}

      {hasGrowthData && strategy.growth_diagnosis?.funnel_health && (
        <CollapsibleSection title="Saúde do Funil" icon="📊" defaultOpen={false}>
          <FunnelHealthRow funnel_health={strategy.growth_diagnosis.funnel_health} />
        </CollapsibleSection>
      )}

    </div>
  )
}
