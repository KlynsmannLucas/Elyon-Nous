// components/dashboard/OnboardingFlow.tsx — Primeiros passos simplificado
'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import type { TabKey } from './DashboardSidebar'

interface Step {
  id: string
  number: number
  icon: string
  title: string
  description: string
  tab?: TabKey
  action?: string
  check: (state: any) => boolean
}

const STEPS: Step[] = [
  {
    id: 'client',
    number: 1,
    icon: '✍️',
    title: 'Cadastre os dados do cliente',
    description: 'Nome, nicho e orçamento mensal — o ELYON personaliza toda a análise com base nesses dados.',
    tab: 'overview' as TabKey,
    action: 'Ir para a tela inicial',
    check: (s) => !!s.clientData?.clientName,
  },
  {
    id: 'connect',
    number: 2,
    icon: '🔗',
    title: 'Conecte sua conta de anúncios',
    description: 'Importe dados reais do Meta Ads ou Google Ads — sem conexão, a análise usa estimativas do nicho em vez de dados reais.',
    tab: 'anuncios' as TabKey,
    action: 'Conectar Meta ou Google',
    // Passa se já conectou OU se já rodou auditoria (usuário avançado que pulou a ordem)
    check: (s) => (s.connectedAccounts?.length ?? 0) > 0
      || (s.clientData?.clientName ? (s.auditCache?.[s.clientData.clientName]?.length ?? 0) > 0 : false),
  },
  {
    id: 'audit',
    number: 3,
    icon: '🔍',
    title: 'Rode a Análise Profunda',
    description: 'Gere o diagnóstico completo da conta — pontos fortes, gargalos e oportunidades com IA.',
    tab: 'analise' as TabKey,
    action: 'Ir para Análise Profunda',
    check: (s) => {
      const name = s.clientData?.clientName
      return name ? (s.auditCache?.[name]?.length ?? 0) > 0 : false
    },
  },
  {
    id: 'strategy',
    number: 4,
    icon: '⚡',
    title: 'Gere a estratégia de crescimento',
    description: 'A IA cria um plano de 90 dias com canais recomendados, metas de CPL e ações prioritárias.',
    tab: 'strategy' as TabKey,
    action: 'Gerar estratégia',
    check: (s) => !!s.strategyData,
  },
  {
    id: 'actions',
    number: 5,
    icon: '✅',
    title: 'Execute o plano de ações',
    description: 'Veja as tarefas por ordem de impacto e marque conforme for executando. O ELYON acompanha o progresso.',
    tab: 'acoes' as TabKey,
    action: 'Ver ações',
    check: (s) => {
      const name = s.clientData?.clientName
      return name ? (s.actionPlanCache?.[name]?.length ?? 0) > 0 : false
    },
  },
]

interface Props {
  onNavigate: (tab: TabKey) => void
}

export function OnboardingFlow({ onNavigate }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const [expanded, setExpanded] = useState(true)

  const clientData      = useAppStore(s => s.clientData)
  const strategyData    = useAppStore(s => s.strategyData)
  const auditCache      = useAppStore(s => s.auditCache)
  const actionPlanCache = useAppStore(s => s.actionPlanCache)
  const connectedAccounts = useAppStore(s => s.connectedAccounts)
  const state = { clientData, strategyData, auditCache, actionPlanCache, connectedAccounts }

  useEffect(() => {
    try {
      const val = localStorage.getItem('elyon_onboarding_dismissed')
      if (val === '1') setDismissed(true)
    } catch {}
  }, [])

  function dismiss() {
    setDismissed(true)
    try { localStorage.setItem('elyon_onboarding_dismissed', '1') } catch {}
  }

  const completedCount = STEPS.filter(s => s.check(state)).length
  const allDone = completedCount === STEPS.length
  const nextStep = STEPS.find(s => !s.check(state))
  const progressPct = (completedCount / STEPS.length) * 100

  if (dismissed) return null

  if (allDone) {
    return (
      <div style={{
        margin: '0 24px 16px',
        padding: '12px 16px',
        background: 'rgba(34,197,94,0.06)',
        border: '1px solid rgba(34,197,94,0.2)',
        borderRadius: '10px',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <span style={{ fontSize: '18px' }}>🎉</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#0E9E6E' }}>
            Configuração completa! O ELYON está pronto para uso.
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
            Use o <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Assistente IA</strong> (botão dourado no canto inferior direito) para tirar dúvidas a qualquer momento.
          </div>
        </div>
        <button onClick={dismiss} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
          fontSize: '16px', cursor: 'pointer', padding: '2px',
        }}>×</button>
      </div>
    )
  }

  return (
    <div style={{
      margin: '0 24px 16px',
      background: '#111114',
      border: '1px solid rgba(240,180,41,0.2)',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 16px', background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: '15px' }}>🗺️</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#F0B429', marginBottom: '3px' }}>
            Comece aqui — {completedCount}/{STEPS.length} etapas concluídas
          </div>
          <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              width: `${progressPct}%`, height: '100%',
              background: 'linear-gradient(90deg, #F0B429, #0E9E6E)',
              borderRadius: '2px', transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            onClick={e => { e.stopPropagation(); dismiss() }}
            style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)',
              fontSize: '14px', cursor: 'pointer', padding: '2px 4px',
              borderRadius: '4px',
            }}
            title="Fechar tutorial"
          >×</button>
          <span style={{
            fontSize: '10px', color: 'rgba(255,255,255,0.3)',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s', display: 'inline-block',
          }}>▾</span>
        </div>
      </button>

      {/* Steps */}
      {expanded && (
        <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {STEPS.map((step) => {
            const done = step.check(state)
            const isNext = step.id === nextStep?.id
            return (
              <div
                key={step.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 10px', borderRadius: '8px',
                  background: isNext ? 'rgba(240,180,41,0.05)' : 'transparent',
                  border: `1px solid ${isNext ? 'rgba(240,180,41,0.15)' : 'transparent'}`,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: done ? '12px' : '11px', fontWeight: 700,
                  background: done ? '#0E9E6E' : isNext ? 'rgba(240,180,41,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${done ? '#0E9E6E' : isNext ? 'rgba(240,180,41,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  color: done ? '#000' : isNext ? '#F0B429' : 'rgba(255,255,255,0.3)',
                }}>
                  {done ? '✓' : step.number}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px' }}>{step.icon}</span>
                    <span style={{
                      fontSize: '12px', fontWeight: done ? 500 : 600,
                      color: done ? 'rgba(255,255,255,0.4)' : '#fff',
                      textDecoration: done ? 'line-through' : 'none',
                    }}>
                      {step.title}
                    </span>
                  </div>
                  {isNext && (
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px', lineHeight: 1.4 }}>
                      {step.description}
                    </div>
                  )}
                </div>

                {isNext && step.tab && (
                  <button
                    onClick={() => onNavigate(step.tab!)}
                    style={{
                      padding: '5px 12px', borderRadius: '6px', flexShrink: 0,
                      background: 'rgba(240,180,41,0.12)', border: '1px solid rgba(240,180,41,0.3)',
                      color: '#F0B429', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {step.action} →
                  </button>
                )}

                {done && (
                  <span style={{ fontSize: '11px', color: '#0E9E6E', flexShrink: 0 }}>Feito</span>
                )}
              </div>
            )
          })}

          {/* "How ELYON works" footer tip */}
          <div style={{
            marginTop: '4px', padding: '8px 10px',
            background: 'rgba(124,58,237,0.06)',
            border: '1px solid rgba(124,58,237,0.12)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'flex-start', gap: '8px',
          }}>
            <span style={{ fontSize: '12px', marginTop: '1px' }}>💡</span>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
              <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Como o ELYON funciona:</strong>{' '}
              você cria o cliente → conecta as contas de anúncio → a IA faz a análise → gera estratégia personalizada → você executa com apoio do Assistente IA.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
