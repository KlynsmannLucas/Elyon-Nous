// components/dashboard/TabSimpleDiagnostic.tsx — Diagnóstico da Conta no Modo Simplificado
// Lê a auditoria mais recente (auditCache) e apresenta de forma consultiva.
// A versão técnica completa (TabAuditoria) permanece intacta no modo avançado.
'use client'

import { useAppStore } from '@/lib/store'
import { getBenchmark } from '@/lib/niche_benchmarks'
import { askAIWithContext } from '@/lib/askAI'
import type { ClientData } from '@/lib/store'
import type { TabKey } from './DashboardSidebar'

interface Props {
  clientData: ClientData | null
  onNavigate?: (tab: TabKey) => void
}

const C = {
  surface:  '#0C1426',
  elevated: '#111D33',
  border:   'rgba(255,255,255,0.06)',
  purple:   '#7C3AED',
  purpleHi: '#A78BFA',
  purpleBg: 'rgba(124,58,237,0.08)',
  green:    '#22C55E',
  greenBg:  'rgba(34,197,94,0.07)',
  amber:    '#F59E0B',
  amberBg:  'rgba(245,158,11,0.07)',
  red:      '#EF4444',
  redBg:    'rgba(239,68,68,0.07)',
  text1:    '#F1F5F9',
  text2:    '#94A3B8',
  text3:    'rgba(255,255,255,0.32)',
}

function fmt(n: number) {
  if (!n) return 'R$0'
  if (n >= 1_000_000) return `R$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000)      return `R$${(n / 1000).toFixed(1)}k`
  return `R$${Math.round(n).toLocaleString('pt-BR')}`
}

function askNous(question: string) {
  askAIWithContext({ source: 'diagnostico-conta', title: 'Saúde da Conta', suggestedPrompt: question })
}

// ── Métrica traduzida ─────────────────────────────────────────────────────────
function MetricCard({ icon, value, label, explanation, color }: {
  icon: string; value: string; label: string; explanation: string; color: string
}) {
  return (
    <div style={{ padding: '16px', borderRadius: '12px', background: C.surface, border: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '16px' }}>{icon}</span>
        <span style={{ fontSize: '11px', color: C.text3 }}>{label}</span>
      </div>
      <div style={{ fontSize: '22px', fontWeight: 800, color, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '6px' }}>{value}</div>
      <div style={{ fontSize: '11px', color: C.text2, lineHeight: 1.5 }}>{explanation}</div>
    </div>
  )
}

// ── Bloco do resumo executivo ─────────────────────────────────────────────────
function SummaryBlock({ title, color, bg, items, emptyText }: {
  title: string; color: string; bg: string; items: string[]; emptyText: string
}) {
  return (
    <div style={{ padding: '16px', borderRadius: '12px', background: bg, border: `1px solid ${color}22` }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '10px' }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {items.length > 0 ? items.map((it, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', fontSize: '12px', color: C.text1, lineHeight: 1.45 }}>
            <span style={{ color, flexShrink: 0 }}>•</span>{it}
          </div>
        )) : (
          <div style={{ fontSize: '11px', color: C.text3, lineHeight: 1.5 }}>{emptyText}</div>
        )}
      </div>
    </div>
  )
}

export function TabSimpleDiagnostic({ clientData, onNavigate }: Props) {
  const auditCache = useAppStore(s => s.auditCache)

  const key   = clientData?.clientName || ''
  const hist  = auditCache[key]
  const audit = Array.isArray(hist) ? hist[0]?.audit : (hist as any)?.audit ?? hist
  const bench = clientData ? getBenchmark(clientData.niche) : null

  if (!clientData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: C.text3, fontSize: '13px' }}>
        Configure um cliente para ver o diagnóstico.
      </div>
    )
  }

  // ── Extração de dados da auditoria ─────────────────────────────────────────
  const score = (audit?.health_score as number) ?? null
  const rm    = audit?._realMetrics as any
  const camps = audit?._campanhasClassificadas as any
  const nWinners  = camps?.vencedoras?.length ?? 0
  const nCriticas = camps?.criticas?.length ?? 0
  const waste     = (audit?._wasteCampaigns as any[] | undefined)?.reduce((s, c) => s + (c.spend || 0), 0) ?? 0
  const nWaste    = (audit?._wasteCampaigns as any[] | undefined)?.length ?? 0
  const hasTracking = audit?.tracking?.prioridade_maxima
    || ((audit?._trackingChecklist as any[] | undefined) || []).filter((t: any) => t.status === 'nao_verificado').length >= 3

  const benchAvg = bench ? Math.round((bench.kpi_thresholds.cpl_good + bench.kpi_thresholds.cpl_bad) / 2) : null
  const cplBelow = rm?.avgCPL && benchAvg ? rm.avgCPL < benchAvg : null
  const cplPct   = rm?.avgCPL && benchAvg ? Math.round((1 - rm.avgCPL / benchAvg) * 100) : null

  // ── Status humano do score ──────────────────────────────────────────────────
  const statusCfg = score == null
    ? { icon: '⚪', color: C.text2, headline: 'Análise ainda não realizada' }
    : score >= 80
    ? { icon: '🟢', color: C.green, headline: 'Sua conta está saudável' }
    : score >= 60
    ? { icon: '🟡', color: C.amber, headline: 'Sua conta está vendendo, mas dá pra melhorar' }
    : { icon: '🔴', color: C.red, headline: 'Sua conta precisa de atenção' }

  const statusDetail = score == null
    ? 'Rode a análise para receber um diagnóstico completo da sua conta.'
    : score >= 80
    ? (waste > 0
        ? `Suas campanhas estão indo bem no geral, mas parte da verba pode estar sendo desperdiçada — há espaço para crescer com segurança.`
        : `Suas campanhas estão acima da média do mercado. Bom momento para crescer com segurança.`)
    : score >= 60
    ? `Sua conta está trazendo resultado, mas existem pontos que estão limitando o crescimento e merecem atenção.`
    : `Existem gargalos importantes que estão segurando seus resultados. Vale corrigir antes de investir mais.`

  // ── Resumo executivo (3 blocos) ──────────────────────────────────────────────
  const bom: string[] = []
  if (cplBelow === true)   bom.push('Você está conseguindo novos contatos por um custo abaixo da média do mercado.')
  if (nWinners > 0)        bom.push(`${nWinners} ${nWinners === 1 ? 'campanha está' : 'campanhas estão'} trazendo bons resultados.`)
  if (rm?.avgROAS && bench && rm.avgROAS >= bench.kpi_thresholds.roas_good) bom.push('O retorno do seu investimento está dentro da meta do seu setor.')
  if (!hasTracking && audit) bom.push('A medição dos seus resultados parece estar funcionando.')

  const atencao: string[] = []
  if (nWaste > 0)    atencao.push(`${nWaste} ${nWaste === 1 ? 'campanha está gastando' : 'campanhas estão gastando'} sem trazer retorno proporcional.`)
  if (hasTracking)   atencao.push('Pode haver falhas na medição dos resultados — isso atrapalha a otimização.')
  if (cplBelow === false) atencao.push('O custo por novo contato está acima do ideal para o seu setor.')
  if (nCriticas > 0 && nWaste === 0) atencao.push(`${nCriticas} ${nCriticas === 1 ? 'campanha precisa' : 'campanhas precisam'} de revisão.`)

  // ── Próxima melhor ação ──────────────────────────────────────────────────────
  const bestCamp = camps?.vencedoras?.[0]
  const nextAction = nWaste > 0
    ? { icon: '🛑', title: 'Pausar a campanha que está desperdiçando verba', desc: `Você tem ${nWaste > 1 ? `${nWaste} campanhas` : 'uma campanha'} gastando sem retorno. Pausar libera ${fmt(waste)} para investir no que funciona.` }
    : hasTracking
    ? { icon: '🔧', title: 'Corrigir a medição dos resultados', desc: 'Sem rastreamento correto, o sistema de anúncios otimiza com dados incompletos — você perde performance sem perceber.' }
    : bestCamp
    ? { icon: '🚀', title: `Investir mais na campanha "${bestCamp.name}"`, desc: `Essa campanha traz contatos baratos. Aumentar o orçamento aos poucos pode gerar mais clientes sem elevar o custo.` }
    : { icon: '📈', title: 'Continuar acompanhando', desc: 'Sua conta está estável. Monitore os números e mantenha o que está funcionando.' }

  const fazer: string[] = [nextAction.title]

  // ── Riscos priorizados (máx 3) ────────────────────────────────────────────────
  const riscos = [
    nWaste > 0 && {
      icon: '💸', color: C.red, bg: C.redBg, border: 'rgba(239,68,68,0.2)',
      title: 'Verba sendo desperdiçada',
      desc: `${nWaste > 1 ? `${nWaste} campanhas estão` : 'Uma campanha está'} consumindo orçamento sem gerar contatos na proporção esperada.`,
      impact: `Possível desperdício de ${fmt(waste)}.`,
      question: 'Qual campanha eu devo pausar e por quê?',
    },
    hasTracking && {
      icon: '📡', color: C.amber, bg: C.amberBg, border: 'rgba(245,158,11,0.2)',
      title: 'Possíveis falhas na medição',
      desc: 'Detectamos que o rastreamento dos resultados pode estar incompleto. Isso faz o algoritmo otimizar com dados errados.',
      impact: 'Suas campanhas podem render menos sem você perceber.',
      question: 'Como saber se meu rastreamento está funcionando?',
    },
    cplBelow === false && {
      icon: '🎯', color: C.amber, bg: C.amberBg, border: 'rgba(245,158,11,0.2)',
      title: 'Custo por contato acima do ideal',
      desc: 'Cada novo contato está custando mais do que a média do seu setor. Geralmente isso melhora trocando o anúncio ou ajustando o público.',
      impact: 'Você consegue menos clientes com o mesmo dinheiro.',
      question: 'Como reduzir o custo por contato dos meus anúncios?',
    },
  ].filter(Boolean) as { icon: string; color: string; bg: string; border: string; title: string; desc: string; impact: string; question: string }[]

  // ── Estado vazio ──────────────────────────────────────────────────────────────
  if (!audit) {
    return (
      <div style={{ maxWidth: '640px' }}>
        <div style={{ padding: '32px 28px', borderRadius: '16px', textAlign: 'center', background: C.surface, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔍</div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.text1, margin: '0 0 8px' }}>Ainda não analisamos sua conta</h2>
          <p style={{ fontSize: '13px', color: C.text2, lineHeight: 1.6, margin: '0 0 20px' }}>
            Conecte sua conta de anúncios ou importe um relatório para receber um diagnóstico completo e fácil de entender.
          </p>
          <button
            onClick={() => onNavigate?.('anuncios')}
            style={{ padding: '11px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #7C3AED, #A78BFA)' }}
          >
            Conectar minha conta de anúncios →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* 1 — Card principal de diagnóstico */}
      <div style={{ padding: '22px', borderRadius: '16px', background: `${statusCfg.color}0d`, border: `1px solid ${statusCfg.color}33` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {score != null && (
            <div style={{ flexShrink: 0, textAlign: 'center' }}>
              <div style={{ fontSize: '44px', fontWeight: 800, color: statusCfg.color, lineHeight: 1, letterSpacing: '-0.03em' }}>{score}</div>
              <div style={{ fontSize: '10px', color: C.text3, marginTop: '2px' }}>de 100</div>
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '18px' }}>{statusCfg.icon}</span>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: statusCfg.color, margin: 0, letterSpacing: '-0.01em' }}>{statusCfg.headline}</h2>
            </div>
            <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: 1.6, margin: 0 }}>{statusDetail}</p>
          </div>
        </div>
      </div>

      {/* 2 — Resumo executivo (3 blocos) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
        <SummaryBlock title="✅ O que está bom" color={C.green} bg={C.greenBg} items={bom} emptyText="Assim que houver dados, mostramos os pontos fortes aqui." />
        <SummaryBlock title="⚠️ Precisa de atenção" color={C.amber} bg={C.amberBg} items={atencao} emptyText="Nenhum ponto crítico detectado no momento." />
        <SummaryBlock title="🎯 O que fazer agora" color={C.purpleHi} bg={C.purpleBg} items={fazer} emptyText="Continue acompanhando os resultados." />
      </div>

      {/* 3 — Métricas traduzidas */}
      {rm && (
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: C.text3, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '10px' }}>
            Seus números, em linguagem simples
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
            {rm.totalSpend > 0 && (
              <MetricCard icon="💰" value={fmt(rm.totalSpend)} label="Quanto você investiu" color={C.amber}
                explanation={`Total aplicado em anúncios${rm.campaignCount ? ` em ${rm.campaignCount} campanhas` : ''}.`} />
            )}
            {rm.totalLeads > 0 && (
              <MetricCard icon="👥" value={rm.totalLeads.toLocaleString('pt-BR')} label="Contatos recebidos" color={C.green}
                explanation="Pessoas que demonstraram interesse e deixaram contato." />
            )}
            {rm.avgCPL && (
              <MetricCard icon="🏷️" value={`R$${rm.avgCPL}`} label="Custo por novo contato" color={cplBelow ? C.green : C.amber}
                explanation={cplPct != null && cplPct > 0
                  ? `Está ${cplPct}% mais barato que a média do mercado — suas campanhas estão eficientes.`
                  : bench ? `A média do seu setor fica entre R$${bench.cpl_min} e R$${bench.cpl_max}.` : 'Quanto custou cada pessoa que entrou em contato.'} />
            )}
            {nWinners > 0 && (
              <MetricCard icon="🚀" value={String(nWinners)} label="Campanhas ajudando" color={C.green}
                explanation="Campanhas que estão trazendo bons resultados pelo custo." />
            )}
            {nWaste > 0 && (
              <MetricCard icon="💸" value={String(nWaste)} label="Campanhas desperdiçando" color={C.red}
                explanation="Campanhas gastando verba sem retorno proporcional — vale revisar ou pausar." />
            )}
          </div>
        </div>
      )}

      {/* 4 — Riscos priorizados */}
      {riscos.length > 0 && (
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: C.text3, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '10px' }}>
            Riscos para corrigir primeiro
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {riscos.map((r, i) => (
              <div key={i} style={{ padding: '16px', borderRadius: '12px', background: r.bg, border: `1px solid ${r.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '16px' }}>{r.icon}</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: C.text1 }}>{r.title}</span>
                </div>
                <p style={{ fontSize: '12px', color: C.text2, lineHeight: 1.6, margin: '0 0 6px' }}>{r.desc}</p>
                <div style={{ fontSize: '11px', color: r.color, fontWeight: 600, marginBottom: '12px' }}>📊 {r.impact}</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                  <button
                    onClick={() => onNavigate?.('acoes')}
                    style={{ fontSize: '11px', fontWeight: 700, padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', border: 'none', color: '#fff', background: r.color }}
                  >
                    Ver o que fazer →
                  </button>
                  <button
                    onClick={() => askNous(r.question)}
                    style={{ fontSize: '11px', fontWeight: 600, padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,58,237,0.25)', color: C.purpleHi }}
                  >
                    💬 Perguntar para a IA
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5 — Próxima melhor ação */}
      <div style={{ padding: '18px 20px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(124,58,237,0.14), rgba(124,58,237,0.03))', border: '1px solid rgba(124,58,237,0.28)' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: C.purpleHi, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '8px' }}>
          🔥 Sua próxima melhor ação
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <span style={{ fontSize: '22px', flexShrink: 0 }}>{nextAction.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 800, color: C.text1, marginBottom: '4px', lineHeight: 1.35 }}>{nextAction.title}</div>
            <p style={{ fontSize: '12px', color: C.text2, lineHeight: 1.6, margin: '0 0 12px' }}>{nextAction.desc}</p>
            <button
              onClick={() => onNavigate?.('acoes')}
              style={{ fontSize: '12px', fontWeight: 700, padding: '9px 18px', borderRadius: '9px', cursor: 'pointer', border: 'none', color: '#fff', background: 'linear-gradient(135deg, #7C3AED, #A78BFA)' }}
            >
              Ver passo a passo →
            </button>
          </div>
        </div>
      </div>

      {/* Rodapé: ver versão completa */}
      <div style={{ padding: '12px 16px', borderRadius: '10px', background: C.purpleBg, border: '1px solid rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <span style={{ fontSize: '11px', color: C.text3 }}>Quer ver a auditoria técnica completa (CPL, CTR, campanhas)?</span>
        <button
          onClick={() => useAppStore.getState().setDashboardMode('pro')}
          style={{ flexShrink: 0, fontSize: '11px', fontWeight: 700, color: C.purpleHi, background: 'none', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '7px', padding: '5px 12px', cursor: 'pointer' }}
        >
          Modo Avançado ⚙
        </button>
      </div>
    </div>
  )
}
