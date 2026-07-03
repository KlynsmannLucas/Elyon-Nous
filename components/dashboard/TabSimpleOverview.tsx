// components/dashboard/TabSimpleOverview.tsx — Modo Simplificado: linguagem de negócio
'use client'

import { useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { getBenchmark } from '@/lib/niche_benchmarks'
import { askAIWithContext } from '@/lib/askAI'
import { isUsingSimpleDemoData, getDemoRealMetrics } from '@/lib/simpleDemoData'
import { DemoDataButton } from './DemoDataButton'
import type { ClientData } from '@/lib/store'

interface Props {
  clientData: ClientData | null
  onNavigate?: (tab: string) => void
  onSwitchToPro?: () => void
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  surface:  '#FFFFFF',
  elevated: '#FFFFFF',
  border:   'rgba(22,27,38,0.08)',
  borderHi: 'rgba(124,58,237,0.25)',
  purple:   '#2C5FE0',
  purpleHi: '#2C5FE0',
  purpleBg: 'rgba(124,58,237,0.08)',
  green:    '#0E9E6E',
  greenBg:  'rgba(34,197,94,0.08)',
  amber:    '#E08B0B',
  amberBg:  'rgba(245,158,11,0.08)',
  red:      '#E1483F',
  redBg:    'rgba(239,68,68,0.08)',
  text1:    '#161B26',
  text2:    '#5A6473',
  text3:    '#8A93A3',
}

function fmt(n: number) {
  if (n >= 1_000_000) return `R$${(n/1_000_000).toFixed(1)}M`
  if (n >= 1000)      return `R$${(n/1000).toFixed(0)}k`
  return `R$${n.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
}

function MetricRow({ icon, label, value, sub, status }: {
  icon: string; label: string; value: string; sub?: string; status: 'good' | 'warn' | 'neutral'
}) {
  const color = status === 'good' ? C.green : status === 'warn' ? C.amber : C.text2
  const bg    = status === 'good' ? C.greenBg : status === 'warn' ? C.amberBg : 'rgba(255,255,255,0.03)'
  const borderC = status === 'good' ? 'rgba(34,197,94,0.18)' : status === 'warn' ? 'rgba(245,158,11,0.18)' : C.border
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '12px', background: bg, border: `1px solid ${borderC}` }}>
      <span style={{ fontSize: '20px', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '11px', color: C.text3, marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '18px', fontWeight: 800, color, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: '10px', color: C.text3, marginTop: '3px' }}>{sub}</div>}
      </div>
      <span style={{ fontSize: '16px' }}>{status === 'good' ? '✅' : status === 'warn' ? '⚠️' : '📊'}</span>
    </div>
  )
}

function HealthScore({ score, label, color, bg, border }: {
  score: number; label: string; color: string; bg: string; border: string
}) {
  return (
    <div style={{
      minWidth: '180px', flex: '0 0 180px',
      padding: '16px', borderRadius: '14px',
      background: bg, border: `1px solid ${border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '10px' }}>
        <span style={{ fontSize: '34px', fontWeight: 900, color, letterSpacing: '-0.04em', lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: '12px', fontWeight: 800, color, opacity: 0.7 }}>/100</span>
      </div>
      <div style={{ height: '7px', borderRadius: '99px', background: 'rgba(22,27,38,0.08)', overflow: 'hidden', marginBottom: '9px' }}>
        <div style={{ width: `${score}%`, height: '100%', borderRadius: '99px', background: color, transition: 'width 0.4s ease' }} />
      </div>
      <div style={{ fontSize: '11px', fontWeight: 800, color, textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>
        {label}
      </div>
    </div>
  )
}

function SimpleSignal({ label, value, tone, hint }: {
  label: string; value: string; tone: 'good' | 'warn' | 'neutral'; hint: string
}) {
  const color = tone === 'good' ? C.green : tone === 'warn' ? C.amber : C.purpleHi
  const bg    = tone === 'good' ? C.greenBg : tone === 'warn' ? C.amberBg : C.purpleBg
  const border = tone === 'good' ? 'rgba(34,197,94,0.18)' : tone === 'warn' ? 'rgba(245,158,11,0.18)' : 'rgba(124,58,237,0.18)'
  return (
    <div style={{
      flex: '1 1 150px', minWidth: '140px',
      padding: '13px 14px', borderRadius: '12px',
      background: bg, border: `1px solid ${border}`,
    }}>
      <div style={{ fontSize: '10px', color: C.text3, marginBottom: '5px' }}>{label}</div>
      <div style={{ fontSize: '17px', fontWeight: 850, color, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: '10px', color: C.text3, marginTop: '4px', lineHeight: 1.35 }}>{hint}</div>
    </div>
  )
}

function PathCard({ step, title, desc, onClick, active }: {
  step: string; title: string; desc: string; onClick?: () => void; active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '12px', width: '100%',
        padding: '13px 14px', borderRadius: '12px', textAlign: 'left' as const,
        background: active ? 'rgba(34,197,94,0.08)' : C.surface,
        border: `1px solid ${active ? 'rgba(34,197,94,0.22)' : C.border}`,
        cursor: 'pointer', transition: 'opacity 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.borderColor = active ? 'rgba(34,197,94,0.32)' : 'rgba(124,58,237,0.28)' }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.borderColor = active ? 'rgba(34,197,94,0.22)' : C.border }}
    >
      <span style={{
        width: '28px', height: '28px', borderRadius: '9px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? C.greenBg : C.purpleBg,
        color: active ? C.green : C.purpleHi,
        fontSize: '12px', fontWeight: 900,
      }}>{step}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: C.text1, marginBottom: '3px' }}>{title}</span>
        <span style={{ display: 'block', fontSize: '11px', color: C.text2, lineHeight: 1.5 }}>{desc}</span>
      </span>
      <span style={{ color: active ? C.green : C.purpleHi, fontSize: '14px', flexShrink: 0 }}>→</span>
    </button>
  )
}

function ActionButton({ label, icon, onClick, primary }: {
  label: string; icon: string; onClick?: () => void; primary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
        padding: '14px 18px', borderRadius: '12px', cursor: 'pointer',
        background: primary ? 'linear-gradient(135deg, #2C5FE0, #2C5FE0)' : C.surface,
        border: primary ? 'none' : `1px solid ${C.border}`,
        color: primary ? '#fff' : C.text2,
        fontSize: '13px', fontWeight: primary ? 700 : 500,
        textAlign: 'left' as const, transition: 'opacity 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
    >
      <span style={{ fontSize: '18px', flexShrink: 0 }}>{icon}</span>
      {label}
      <span style={{ marginLeft: 'auto', opacity: 0.6 }}>→</span>
    </button>
  )
}

export function TabSimpleOverview({ clientData, onNavigate, onSwitchToPro }: Props) {
  const auditCache   = useAppStore(s => s.auditCache)
  const setDashboardMode = useAppStore(s => s.setDashboardMode)
  const pendingActionsCache = useAppStore(s => s.pendingActionsCache)
  const funnelEntries = useAppStore(s => s.funnelEntries)

  const key          = clientData?.clientName || ''
  const auditHistory = auditCache[key]
  const latestAudit  = Array.isArray(auditHistory) ? auditHistory[0]?.audit : auditHistory
  const demo         = isUsingSimpleDemoData()
  const rm           = (latestAudit?._realMetrics as any) || (demo ? getDemoRealMetrics() : null)
  const bench        = clientData ? getBenchmark(clientData.niche) : null
  const pendingActions = pendingActionsCache[key] || []
  const urgentActions = pendingActions.filter(a => a.status === 'pendente' && (a.urgency === 'critica' || a.urgency === 'alta'))
  const latestFunnel = funnelEntries.filter(e => e.clientName === key).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0]

  const hasData = !!(rm && rm.totalSpend > 0)

  // ── Status geral ─────────────────────────────────────────────────────────
  const overallStatus = useMemo((): 'great' | 'ok' | 'warn' => {
    if (!hasData) return 'ok'
    const cplOk = rm.avgCPL && bench ? rm.avgCPL <= bench.kpi_thresholds.cpl_bad : null
    const cplGood = rm.avgCPL && bench ? rm.avgCPL <= bench.kpi_thresholds.cpl_good : null
    if (cplGood && rm.totalLeads > 0) return 'great'
    if (cplOk && rm.totalLeads > 0) return 'ok'
    return 'warn'
  }, [rm, bench, hasData])

  const statusCfg = {
    great: { icon: '🟢', headline: 'Sua conta está saudável.',              label: 'Saudável', color: C.green,  bg: C.greenBg,  border: 'rgba(34,197,94,0.2)' },
    ok:    { icon: '🟡', headline: 'Sua conta está no caminho certo.',       label: 'Estável', color: C.amber,  bg: C.amberBg,  border: 'rgba(245,158,11,0.2)' },
    warn:  { icon: '🔴', headline: 'Sua conta precisa de atenção.',          label: 'Atenção', color: C.red,    bg: C.redBg,    border: 'rgba(239,68,68,0.2)' },
  }[overallStatus]

  const healthScore = useMemo(() => {
    if (!hasData) return 58
    let score = 68
    if (overallStatus === 'great') score += 18
    if (overallStatus === 'warn') score -= 18
    if (rm.avgCTR >= 1.2) score += 6
    if (rm.avgCTR > 0 && rm.avgCTR < 0.5) score -= 8
    if (rm.avgROAS >= 2) score += 8
    if (rm.avgROAS > 0 && rm.avgROAS < 1) score -= 10
    score -= Math.min(urgentActions.length * 4, 12)
    return Math.max(12, Math.min(96, score))
  }, [hasData, overallStatus, rm, urgentActions.length])

  const decision = useMemo(() => {
    if (!hasData) return {
      title: 'Primeiro passo: conectar seus dados',
      body: 'Sem conexão com anúncios, a plataforma ainda trabalha com estimativas do seu nicho. Conecte Meta ou Google para saber exatamente onde está bom, ruim ou desperdiçando dinheiro.',
      tab: 'anuncios',
      cta: 'Conectar anúncios',
    }
    if (overallStatus === 'great') return {
      title: 'Decisão: crescer com cuidado',
      body: 'Os sinais principais estão bons. O próximo passo é aumentar orçamento aos poucos nas campanhas que geram contatos mais baratos.',
      tab: 'acoes',
      cta: 'Ver como crescer',
    }
    if (overallStatus === 'warn') return {
      title: 'Decisão: corrigir antes de investir mais',
      body: 'Existe algum ponto fazendo a conta ficar cara. Antes de colocar mais verba, revise público, anúncios e etapas onde os clientes desistem.',
      tab: 'analise',
      cta: 'Ver problema principal',
    }
    return {
      title: 'Decisão: otimizar para ganhar eficiência',
      body: 'A conta não está ruim, mas ainda dá para pagar menos por contato e transformar melhor os interessados em clientes.',
      tab: 'acoes',
      cta: 'Ver melhorias',
    }
  }, [hasData, overallStatus])

  const simpleSignals = useMemo(() => {
    const cplTone: 'good' | 'warn' | 'neutral' = hasData && bench && rm.avgCPL
      ? rm.avgCPL <= bench.kpi_thresholds.cpl_good ? 'good' : rm.avgCPL > bench.kpi_thresholds.cpl_bad ? 'warn' : 'neutral'
      : 'neutral'
    const leadsValue = hasData ? String(rm.totalLeads || 0) : clientData?.budget && bench ? `~${Math.round(clientData.budget / ((bench.cpl_min + bench.cpl_max) / 2))}` : 'Aguardando'
    return [
      {
        label: 'Clientes chegando',
        value: leadsValue,
        tone: hasData && rm.totalLeads > 0 ? 'good' as const : 'neutral' as const,
        hint: hasData ? 'Contatos recebidos no período' : 'Estimativa até conectar dados',
      },
      {
        label: 'Custo por contato',
        value: hasData && rm.avgCPL ? `R$${rm.avgCPL}` : bench ? `R$${bench.cpl_min}-${bench.cpl_max}` : 'Sem base',
        tone: cplTone,
        hint: bench ? 'Comparado com a média do seu setor' : 'Depende dos dados conectados',
      },
      {
        label: 'Urgências',
        value: urgentActions.length > 0 ? String(urgentActions.length) : '0',
        tone: urgentActions.length > 0 ? 'warn' as const : 'good' as const,
        hint: urgentActions.length > 0 ? 'Itens que merecem atenção agora' : 'Nada crítico pendente',
      },
    ]
  }, [hasData, rm, bench, clientData, urgentActions.length])

  type Metric = { icon: string; label: string; value: string; sub: string; status: 'good' | 'warn' | 'neutral' }

  // ── Métricas em linguagem de negócio ─────────────────────────────────────
  const metrics = useMemo((): Metric[] => {
    if (!hasData) {
      // Sem dados reais — mostra estimativas pelo benchmark
      const estimatedLeads = bench && clientData?.budget ? Math.round(clientData.budget / ((bench.cpl_min + bench.cpl_max) / 2)) : null
      return [
        estimatedLeads ? {
          icon: '👥', label: 'Novos contatos estimados / mês', value: `~${estimatedLeads}`,
          sub: `Baseado no seu orçamento de R$${clientData?.budget?.toLocaleString('pt-BR')}`, status: 'neutral' as const,
        } : null,
        bench ? {
          icon: '💰', label: 'Custo por contato estimado', value: `R$${bench.cpl_min}–${bench.cpl_max}`,
          sub: 'Benchmark do seu setor', status: 'neutral' as const,
        } : null,
      ].filter(Boolean) as Metric[]
    }
    const cplStatus: 'good' | 'warn' | 'neutral' = bench
      ? rm.avgCPL <= bench.kpi_thresholds.cpl_good ? 'good' : rm.avgCPL <= bench.kpi_thresholds.cpl_bad ? 'neutral' : 'warn'
      : 'neutral'
    const ctrStatus: 'good' | 'warn' | 'neutral' = rm.avgCTR >= 1.2 ? 'good' : rm.avgCTR >= 0.5 ? 'neutral' : 'warn'
    const roasStatus: 'good' | 'warn' | 'neutral' = bench
      ? rm.avgROAS >= bench.kpi_thresholds.roas_good ? 'good' : rm.avgROAS >= 1 ? 'neutral' : 'warn'
      : 'neutral'

    const benchAvg = bench ? Math.round((bench.kpi_thresholds.cpl_good + bench.kpi_thresholds.cpl_bad) / 2) : null
    const cplPct   = rm.avgCPL && benchAvg ? Math.round((1 - rm.avgCPL / benchAvg) * 100) : null

    return [
      rm.totalLeads > 0 && {
        icon: '👥',
        label: 'Novos contatos recebidos',
        value: rm.totalLeads.toLocaleString('pt-BR'),
        sub: `Por ${fmt(rm.totalSpend)} investidos`,
        status: 'good' as const,
      },
      rm.avgCPL && {
        icon: '💰',
        label: 'Quanto custa cada novo contato',
        value: `R$${rm.avgCPL}`,
        sub: cplPct != null && cplPct > 0
          ? `${cplPct}% mais barato que a média do setor`
          : bench ? `Benchmark: R$${bench.cpl_min}–${bench.cpl_max}` : '',
        status: cplStatus,
      },
      rm.avgCTR && {
        icon: '👆',
        label: 'Pessoas que clicaram no seu anúncio',
        value: `${rm.avgCTR}%`,
        sub: rm.avgCTR >= 1.2 ? 'Acima da média — anúncios atraentes' : 'Abaixo da média — testar novos criativos',
        status: ctrStatus,
      },
      rm.avgROAS && {
        icon: '📈',
        label: 'Retorno do investimento',
        value: `${rm.avgROAS}×`,
        sub: `Para cada R$1 investido, você gera R$${rm.avgROAS} em receita`,
        status: roasStatus,
      },
    ].filter(Boolean) as Metric[]
  }, [rm, bench, clientData, hasData])

  // ── O que isso significa ──────────────────────────────────────────────────
  const meaning = useMemo(() => {
    if (!hasData) {
      return `Ainda não há dados de campanha conectados. Conecte seu Meta Ads ou Google Ads para ver o desempenho real dos seus anúncios. Por enquanto, os números são estimativas baseadas no seu setor.`
    }
    const cplGood = rm.avgCPL && bench ? rm.avgCPL <= bench.kpi_thresholds.cpl_good : false
    const ctrGood = rm.avgCTR >= 1.2
    if (overallStatus === 'great') {
      return `Seus anúncios estão captando clientes a um custo abaixo da média do mercado. ${ctrGood ? 'As pessoas estão clicando com frequência, o que indica que o criativo está funcionando bem.' : ''} ${rm.avgROAS >= 2 ? `Cada R$1 investido está gerando R$${rm.avgROAS} em retorno.` : ''} Este é um bom momento para aumentar o orçamento gradualmente.`
    }
    if (overallStatus === 'warn') {
      return `Seus anúncios estão custando mais do que o ideal para este setor. Isso pode indicar que o público-alvo precisa de ajuste ou que os criativos precisam ser renovados. A IA identificou oportunidades de melhoria.`
    }
    return `Seus anúncios estão funcionando dentro do esperado para o setor de ${clientData?.niche}. Existem algumas oportunidades de otimização para reduzir custos e aumentar o volume de contatos.`
  }, [rm, bench, overallStatus, clientData, hasData])

  // ── Ações recomendadas ────────────────────────────────────────────────────
  const actions = useMemo(() => {
    const list: { label: string; icon: string; tab: string; primary?: boolean }[] = []
    if (!hasData) {
      list.push({ label: 'Conectar meus anúncios', icon: '🔗', tab: 'anuncios', primary: true })
      list.push({ label: 'Ver análise completa', icon: '🔍', tab: 'analise' })
    } else if (overallStatus === 'great') {
      list.push({ label: 'Escalar campanhas vencedoras', icon: '🚀', tab: 'acoes', primary: true })
      list.push({ label: 'Ver análise detalhada', icon: '🔍', tab: 'analise' })
    } else if (overallStatus === 'warn') {
      list.push({ label: 'Ver o que precisa de atenção', icon: '🔍', tab: 'analise', primary: true })
      list.push({ label: 'Ver ações recomendadas', icon: '✅', tab: 'acoes' })
    } else {
      list.push({ label: 'Ver análise completa', icon: '🔍', tab: 'analise', primary: true })
      list.push({ label: 'Ver próximas ações', icon: '✅', tab: 'acoes' })
    }
    return list
  }, [hasData, overallStatus])

  const beginnerPath = useMemo(() => {
    const hasAudit = Array.isArray(auditHistory) ? auditHistory.length > 0 : !!auditHistory
    return [
      {
        step: '1',
        title: hasData ? 'Entenda se a conta está bem' : 'Conecte seus anúncios',
        desc: hasData ? 'Veja o resumo sem termos técnicos e entenda o principal sinal da conta.' : 'Traga dados reais de Meta ou Google para sair das estimativas.',
        tab: hasData ? 'diagnostic' : 'anuncios',
        active: !hasData,
      },
      {
        step: '2',
        title: latestFunnel ? 'Veja onde perde clientes' : 'Mapeie a jornada do cliente',
        desc: latestFunnel ? 'Confira em qual etapa as pessoas param antes de comprar.' : 'Preencha entradas simples para descobrir onde o dinheiro escapa.',
        tab: 'funil',
        active: hasData && !latestFunnel,
      },
      {
        step: '3',
        title: urgentActions.length > 0 ? 'Resolva as urgências' : 'Siga o plano recomendado',
        desc: urgentActions.length > 0 ? 'Priorize os ajustes que mais afetam seu dinheiro agora.' : 'Execute as próximas ações em ordem de impacto.',
        tab: urgentActions.length > 0 || hasAudit ? 'acoes' : 'analise',
        active: hasData && (urgentActions.length > 0 || overallStatus === 'warn'),
      },
    ]
  }, [hasData, auditHistory, latestFunnel, urgentActions.length, overallStatus])

  if (!clientData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: C.text3, fontSize: '13px' }}>
        Configure um cliente para ver o resumo.
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1120px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Saudação + status geral */}
      <div style={{ padding: '20px 22px', borderRadius: '16px', background: statusCfg.bg, border: `1px solid ${statusCfg.border}` }}>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: '18px', flexWrap: 'wrap' as const }}>
          <div style={{ flex: '1 1 360px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
              <span style={{ fontSize: '24px', flexShrink: 0 }}>{statusCfg.icon}</span>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: statusCfg.color, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '5px' }}>
                  Resumo simples da conta
                </div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: statusCfg.color, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '5px' }}>
                  {statusCfg.headline}
                </div>
                <div style={{ fontSize: '12px', color: C.text3 }}>
                  {clientData.clientName} · {clientData.niche}{clientData.city ? ` · ${clientData.city}` : ''}
                </div>
              </div>
            </div>
            <div style={{ marginTop: '4px', paddingTop: '12px', borderTop: `1px solid ${statusCfg.border}` }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: statusCfg.color, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '5px' }}>
                O que isso significa
              </div>
              <p style={{ fontSize: '13px', color: C.text2, lineHeight: 1.7, margin: 0 }}>{meaning}</p>
            </div>
          </div>
          <HealthScore score={healthScore} label={statusCfg.label} color={statusCfg.color} bg="rgba(255,255,255,0.04)" border={statusCfg.border} />
        </div>
      </div>

      {/* Leitura rapida + decisao */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch', flexWrap: 'wrap' as const }}>
        <div style={{ flex: '1 1 520px', minWidth: 0, padding: '16px', borderRadius: '16px', background: C.elevated, border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 800, color: C.text3, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
                Conta em 1 minuto
              </div>
              <div style={{ fontSize: '13px', color: C.text2, marginTop: '3px' }}>
                Os 3 sinais que mais importam para quem não vive de métricas.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
            {simpleSignals.map((s) => <SimpleSignal key={s.label} {...s} />)}
          </div>
        </div>

        <div style={{ flex: '1 1 300px', minWidth: 0, padding: '16px', borderRadius: '16px', background: C.surface, border: `1px solid ${C.borderHi}` }}>
          <div style={{ fontSize: '10px', fontWeight: 800, color: C.purpleHi, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '7px' }}>
            Decisão recomendada
          </div>
          <div style={{ fontSize: '16px', fontWeight: 850, color: C.text1, letterSpacing: '-0.02em', marginBottom: '7px' }}>{decision.title}</div>
          <p style={{ fontSize: '12px', color: C.text2, lineHeight: 1.65, margin: '0 0 14px' }}>{decision.body}</p>
          <ActionButton label={decision.cta} icon="✅" primary onClick={() => onNavigate?.(decision.tab)} />
        </div>
      </div>

      {/* O que está acontecendo */}
      {metrics.length > 0 && (
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: C.text3, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '10px' }}>
            O que está acontecendo
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {metrics.map((m, i) => (
              <MetricRow key={i} icon={m.icon} label={m.label} value={m.value} sub={m.sub} status={m.status} />
            ))}
          </div>
        </div>
      )}

      {/* O que fazer agora */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' as const }}>
        <div style={{ flex: '1 1 360px', minWidth: 0 }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: C.text3, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '10px' }}>
          O que fazer agora
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {actions.map((a, i) => (
            <ActionButton key={i} label={a.label} icon={a.icon} primary={a.primary} onClick={() => onNavigate?.(a.tab)} />
          ))}
          {!hasData && !demo && (
            <div style={{ marginTop: '2px' }}><DemoDataButton /></div>
          )}
        </div>
        </div>

        <div style={{ flex: '1 1 420px', minWidth: 0 }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: C.text3, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '10px' }}>
            Caminho guiado para iniciantes
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {beginnerPath.map((p) => (
              <PathCard
                key={p.step}
                step={p.step}
                title={p.title}
                desc={p.desc}
                active={p.active}
                onClick={() => onNavigate?.(p.tab)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Pergunte ao NOUS — card consultivo */}
      <div style={{ padding: '18px 20px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(124,58,237,0.03))', border: '1px solid rgba(124,58,237,0.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <span style={{ fontSize: '20px' }}>🤖</span>
          <div style={{ fontSize: '14px', fontWeight: 800, color: C.text1, letterSpacing: '-0.01em' }}>
            Quer entender melhor esse resultado?
          </div>
        </div>
        <p style={{ fontSize: '12px', color: C.text2, margin: '0 0 14px', lineHeight: 1.6 }}>
          Pergunte para a IA em linguagem simples — ela responde como um consultor de marketing.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px' }}>
          {[
            'Meus anúncios estão indo bem?',
            'Quanto posso aumentar de orçamento?',
            'Qual campanha eu devo pausar?',
            'Onde estou perdendo clientes?',
          ].map((q) => (
            <button
              key={q}
              onClick={() => askAIWithContext({ source: 'home', title: 'Como Estou Indo', suggestedPrompt: q })}
              style={{
                fontSize: '12px', fontWeight: 500, padding: '8px 14px', borderRadius: '99px',
                cursor: 'pointer', transition: 'all 0.15s',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,58,237,0.25)', color: C.purpleHi,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.14)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Rodapé: mudar para modo PRO */}
      <div style={{ padding: '12px 16px', borderRadius: '10px', background: C.purpleBg, border: '1px solid rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <span style={{ fontSize: '11px', color: C.text3 }}>
          Quer ver métricas detalhadas como CTR, ROAS e segmentações?
        </span>
        <button
          onClick={() => { setDashboardMode('pro'); onNavigate?.('overview') }}
          style={{ flexShrink: 0, fontSize: '11px', fontWeight: 700, color: C.purpleHi, background: 'none', border: `1px solid rgba(124,58,237,0.3)`, borderRadius: '7px', padding: '5px 12px', cursor: 'pointer', transition: 'opacity 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          Modo PRO ⚙
        </button>
      </div>
    </div>
  )
}
