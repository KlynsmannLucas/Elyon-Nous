// components/dashboard/BeginnerJourney.tsx — Jornada guiada para quem nunca anunciou (AJUSTE 02 — Fluxo B)
'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import type { TabKey } from './DashboardSidebar'

const C = {
  surface:  '#0C1426',
  elevated: '#111D33',
  border:   'rgba(255,255,255,0.07)',
  purple:   '#2C5FE0',
  purpleHi: '#2C5FE0',
  purpleBg: 'rgba(124,58,237,0.08)',
  green:    '#0E9E6E',
  greenBg:  'rgba(34,197,94,0.08)',
  text1:    '#161B26',
  text2:    '#5A6473',
  text3:    'rgba(255,255,255,0.35)',
}

interface Props {
  onNavigate?: (tab: TabKey) => void
}

interface JourneyStep {
  id: string
  icon: string
  title: string
  description: string
  tab: TabKey
  cta: string
  done: (s: any, clientName: string) => boolean
}

const STEPS: JourneyStep[] = [
  {
    id: 'persona',
    icon: '👤',
    title: 'Defina seu cliente ideal',
    description: 'A IA cria o perfil de quem mais tem chance de comprar de você — dores, desejos e onde encontrá-lo.',
    tab: 'persona',
    cta: 'Criar minha persona',
    done: (s, name) => !!(s.clientPersonas?.[name] || s.generatedPersona),
  },
  {
    id: 'estrategia',
    icon: '⚡',
    title: 'Monte sua estratégia',
    description: 'Receba um plano de crescimento com os melhores canais, quanto investir e qual a meta de cada anúncio.',
    tab: 'strategy',
    cta: 'Ver minha estratégia',
    done: (s) => !!s.strategyData,
  },
  {
    id: 'conteudo',
    icon: '🎨',
    title: 'Crie seus anúncios',
    description: 'A IA gera textos, chamadas e ideias de criativo prontos para usar no Instagram e no Google.',
    tab: 'conteudo',
    cta: 'Criar conteúdo',
    done: (s, name) => (s.clientAssets?.[name]?.length ?? 0) > 0,
  },
  {
    id: 'implementar',
    icon: '✅',
    title: 'Coloque no ar',
    description: 'Siga o checklist de implementação: criar conta, configurar rastreamento e publicar sua primeira campanha.',
    tab: 'checklist',
    cta: 'Ver próximos passos',
    done: (s, name) => {
      const c = s.checklistCompleted?.[name] || {}
      return Object.values(c).filter(Boolean).length >= 3
    },
  },
]

export function BeginnerJourney({ onNavigate }: Props) {
  const userExperience = useAppStore(s => s.userExperience)
  const clientData     = useAppStore(s => s.clientData)
  const state          = useAppStore()
  const [dismissed, setDismissed] = useState(false)

  // Só aparece para iniciantes, com cliente configurado, e não dispensado
  if (userExperience !== 'beginner' || !clientData?.clientName || dismissed) return null

  const clientName = clientData.clientName
  const steps = STEPS.map(st => ({ ...st, isDone: st.done(state, clientName) }))
  const doneCount = steps.filter(s => s.isDone).length
  const pct = Math.round((doneCount / steps.length) * 100)
  const allDone = doneCount === steps.length

  // Primeiro passo não concluído = passo atual
  const currentIdx = steps.findIndex(s => !s.isDone)

  if (allDone) {
    // Jornada completa — banner discreto de parabéns
    return (
      <div style={{
        padding: '14px 18px', borderRadius: '12px', marginBottom: '20px',
        background: C.greenBg, border: '1px solid rgba(34,197,94,0.2)',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <span style={{ fontSize: '20px' }}>🎉</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: C.green }}>Você completou os primeiros passos!</div>
          <div style={{ fontSize: '11px', color: C.text3 }}>Agora é acompanhar os resultados e otimizar. Bom trabalho.</div>
        </div>
        <button onClick={() => setDismissed(true)} style={{ background: 'none', border: 'none', color: C.text3, cursor: 'pointer', fontSize: '16px', padding: '4px' }}>×</button>
      </div>
    )
  }

  return (
    <div style={{
      borderRadius: '16px', marginBottom: '20px', overflow: 'hidden',
      background: C.surface, border: '1px solid rgba(124,58,237,0.2)',
    }}>
      {/* Header */}
      <div style={{ padding: '18px 20px 14px', background: 'linear-gradient(160deg, rgba(124,58,237,0.12), transparent)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>🚀</span>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: C.text1, letterSpacing: '-0.01em' }}>
                Seus primeiros passos no tráfego pago
              </div>
              <div style={{ fontSize: '11px', color: C.text3, marginTop: '2px' }}>
                A IA vai guiar você do zero até sua primeira campanha no ar.
              </div>
            </div>
          </div>
          <button onClick={() => setDismissed(true)} title="Ocultar" style={{ background: 'none', border: 'none', color: C.text3, cursor: 'pointer', fontSize: '16px', padding: '2px 4px', flexShrink: 0 }}>×</button>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px' }}>
          <div style={{ flex: 1, height: '6px', borderRadius: '99px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, #2C5FE0, #2C5FE0)`, borderRadius: '99px', transition: 'width 0.6s ease' }} />
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: C.purpleHi, flexShrink: 0 }}>{doneCount}/{steps.length}</span>
        </div>
      </div>

      {/* Steps */}
      <div style={{ padding: '6px 12px 14px' }}>
        {steps.map((st, i) => {
          const isCurrent = i === currentIdx
          return (
            <div
              key={st.id}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                padding: '12px', borderRadius: '10px',
                background: isCurrent ? 'rgba(124,58,237,0.06)' : 'transparent',
                border: isCurrent ? '1px solid rgba(124,58,237,0.2)' : '1px solid transparent',
                opacity: st.isDone ? 0.6 : 1,
                transition: 'all 0.15s',
              }}
            >
              {/* Número/check */}
              <div style={{
                width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, marginTop: '1px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 800,
                background: st.isDone ? C.green : isCurrent ? C.purple : 'rgba(255,255,255,0.06)',
                color: st.isDone || isCurrent ? '#fff' : C.text3,
              }}>
                {st.isDone ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><polyline points="2 6 5 9 10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                ) : (i + 1)}
              </div>

              {/* Conteúdo */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px' }}>{st.icon}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: st.isDone ? C.text3 : C.text1, textDecoration: st.isDone ? 'line-through' : 'none' }}>
                    {st.title}
                  </span>
                </div>
                {!st.isDone && (
                  <div style={{ fontSize: '11px', color: C.text3, lineHeight: 1.5, marginTop: '3px' }}>
                    {st.description}
                  </div>
                )}
                {isCurrent && (
                  <button
                    onClick={() => onNavigate?.(st.tab)}
                    style={{
                      marginTop: '10px', padding: '7px 14px', borderRadius: '8px',
                      fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: 'none',
                      color: '#fff', background: 'linear-gradient(135deg, #2C5FE0, #2C5FE0)',
                      transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    {st.cta} →
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
