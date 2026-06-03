// components/dashboard/TabSimpleOverview.tsx — Modo Simplificado: linguagem de negócio
'use client'

import { useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { getBenchmark } from '@/lib/niche_benchmarks'
import type { ClientData } from '@/lib/store'

interface Props {
  clientData: ClientData | null
  onNavigate?: (tab: string) => void
  onSwitchToPro?: () => void
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  surface:  '#0C1426',
  elevated: '#111D33',
  border:   'rgba(255,255,255,0.06)',
  borderHi: 'rgba(124,58,237,0.25)',
  purple:   '#7C3AED',
  purpleHi: '#A78BFA',
  purpleBg: 'rgba(124,58,237,0.08)',
  green:    '#22C55E',
  greenBg:  'rgba(34,197,94,0.08)',
  amber:    '#F59E0B',
  amberBg:  'rgba(245,158,11,0.08)',
  red:      '#EF4444',
  redBg:    'rgba(239,68,68,0.08)',
  text1:    '#F1F5F9',
  text2:    '#94A3B8',
  text3:    'rgba(255,255,255,0.32)',
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

function ActionButton({ label, icon, onClick, primary }: {
  label: string; icon: string; onClick?: () => void; primary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
        padding: '14px 18px', borderRadius: '12px', cursor: 'pointer',
        background: primary ? 'linear-gradient(135deg, #7C3AED, #A78BFA)' : C.surface,
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

  const key          = clientData?.clientName || ''
  const auditHistory = auditCache[key]
  const latestAudit  = Array.isArray(auditHistory) ? auditHistory[0]?.audit : auditHistory
  const rm           = latestAudit?._realMetrics as any
  const bench        = clientData ? getBenchmark(clientData.niche) : null

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
    great: { icon: '🟢', headline: 'Seus anúncios estão funcionando bem!', color: C.green,  bg: C.greenBg,  border: 'rgba(34,197,94,0.2)' },
    ok:    { icon: '🟡', headline: 'Seus anúncios estão estáveis.',         color: C.amber,  bg: C.amberBg,  border: 'rgba(245,158,11,0.2)' },
    warn:  { icon: '🔴', headline: 'Seus anúncios precisam de atenção.',     color: C.red,    bg: C.redBg,    border: 'rgba(239,68,68,0.2)' },
  }[overallStatus]

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

  if (!clientData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: C.text3, fontSize: '13px' }}>
        Configure um cliente para ver o resumo.
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Saudação + status geral */}
      <div style={{ padding: '20px 22px', borderRadius: '16px', background: statusCfg.bg, border: `1px solid ${statusCfg.border}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
          <span style={{ fontSize: '24px', flexShrink: 0 }}>{statusCfg.icon}</span>
          <div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: statusCfg.color, letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: '4px' }}>
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
          <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: 1.7, margin: 0 }}>{meaning}</p>
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
      <div>
        <div style={{ fontSize: '10px', fontWeight: 700, color: C.text3, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '10px' }}>
          O que fazer agora
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {actions.map((a, i) => (
            <ActionButton key={i} label={a.label} icon={a.icon} primary={a.primary} onClick={() => onNavigate?.(a.tab)} />
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
