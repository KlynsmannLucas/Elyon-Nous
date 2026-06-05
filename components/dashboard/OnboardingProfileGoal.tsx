// components/dashboard/OnboardingProfileGoal.tsx — Onboarding por perfil + objetivo
// Pergunta quem é o usuário e seu objetivo, recomenda modo (simple/advanced) + tela inicial.
'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import type { TabKey } from './DashboardSidebar'

export const PROFILE_GOAL_KEY = 'dashboard_profile_goal_onboarding'

export interface ProfileGoalData {
  profile: string
  goal: string
  recommendedMode: 'simple' | 'advanced'
  recommendedTab: string
  completedAt: string
}

interface Props {
  onComplete: (data: ProfileGoalData, navigate: boolean) => void
}

const C = {
  bg:       '#050B1A',
  surface:  '#0C1426',
  border:   'rgba(255,255,255,0.08)',
  purple:   '#7C3AED',
  purpleHi: '#A78BFA',
  purpleBg: 'rgba(124,58,237,0.08)',
  green:    '#22C55E',
  text1:    '#F1F5F9',
  text2:    '#94A3B8',
  text3:    'rgba(255,255,255,0.4)',
}

const PROFILES = [
  { key: 'dono',         icon: '🏪', label: 'Dono de negócio',         desc: 'Tenho minha empresa e quero entender meus resultados.' },
  { key: 'local',        icon: '📍', label: 'Prestador de serviço / local', desc: 'Atendo clientes na minha região (clínica, salão, loja...).' },
  { key: 'social',       icon: '✏️', label: 'Social media',            desc: 'Cuido das redes e conteúdo de marcas.' },
  { key: 'gestor',       icon: '📡', label: 'Gestor de tráfego',       desc: 'Gerencio campanhas de anúncios.' },
  { key: 'agencia',      icon: '🏢', label: 'Agência',                 desc: 'Atendo vários clientes e preciso de relatórios.' },
  { key: 'infoprodutor', icon: '🎓', label: 'Infoprodutor',            desc: 'Vendo cursos, mentorias ou produtos digitais.' },
  { key: 'ecommerce',    icon: '🛒', label: 'E-commerce',              desc: 'Tenho loja online e vendo produtos.' },
]

const GOALS = [
  { key: 'entender',  icon: '🔍', label: 'Entender meus números',       desc: 'Saber se está indo bem ou mal.' },
  { key: 'vender',    icon: '💰', label: 'Vender mais',                 desc: 'Aumentar vendas e faturamento.' },
  { key: 'leads',     icon: '🎯', label: 'Gerar mais leads',            desc: 'Conseguir mais contatos de possíveis clientes.' },
  { key: 'custo',     icon: '✂️', label: 'Reduzir custo',               desc: 'Pagar menos por cada cliente.' },
  { key: 'campanhas', icon: '⚙️', label: 'Melhorar campanhas',          desc: 'Otimizar o que já está rodando.' },
  { key: 'relatorio', icon: '📤', label: 'Fazer relatório para cliente', desc: 'Apresentar resultados de forma profissional.' },
  { key: 'escalar',   icon: '🚀', label: 'Escalar com segurança',       desc: 'Crescer o investimento sem perder eficiência.' },
]

// Rótulos amigáveis das telas (tab key → nome exibido)
const TAB_LABEL: Record<string, string> = {
  diagnostic: 'Saúde do Negócio',
  funil:      'Onde Perco Clientes',
  analise:    'Saúde da Conta',
  anuncios:   'Meus Anúncios',
  relatorios: 'Relatórios',
  acoes:      'O Que Fazer Agora',
  overview:   'Como Estou Indo',
}

// ── Lógica de recomendação ────────────────────────────────────────────────────
function recommend(profile: string, goal: string): { mode: 'simple' | 'advanced'; tab: string } {
  // Modo pelo perfil
  let mode: 'simple' | 'advanced' =
    profile === 'dono' || profile === 'local' || profile === 'social' ? 'simple'
    : profile === 'gestor' || profile === 'agencia' || profile === 'ecommerce' ? 'advanced'
    : /* infoprodutor */ (goal === 'entender' ? 'simple' : goal === 'escalar' || goal === 'custo' ? 'advanced' : 'simple')

  // Tela pelo objetivo (com fallback por perfil)
  const goalTab: Record<string, string> = {
    entender:  'diagnostic',
    vender:    'funil',
    leads:     'funil',
    custo:     'analise',
    campanhas: 'anuncios',
    relatorio: 'relatorios',
    escalar:   'diagnostic',
  }
  let tab = goalTab[goal] || (mode === 'simple' ? 'diagnostic' : 'analise')

  // Ajustes por perfil
  if (profile === 'agencia' && goal !== 'relatorio') tab = goal === 'entender' ? 'analise' : tab
  if (profile === 'gestor' && goal === 'entender')   tab = 'analise'
  if (profile === 'social')                          tab = goal === 'campanhas' ? 'anuncios' : 'funil'

  // Relatórios só fazem sentido no avançado
  if (tab === 'relatorios') mode = 'advanced'

  // Fallback de segurança
  if (!TAB_LABEL[tab]) tab = mode === 'simple' ? 'diagnostic' : 'analise'

  return { mode, tab }
}

// 3 primeiros passos sugeridos
function steps(mode: 'simple' | 'advanced', tab: string): { label: string; tab: string }[] {
  const first = { label: TAB_LABEL[tab] || 'Visão geral', tab }
  if (mode === 'simple') {
    return [first, { label: 'O Que Fazer Agora', tab: 'acoes' }, { label: 'Perguntar para a IA', tab: '__nous__' }]
  }
  return [first, { label: 'Ações Prioritárias', tab: 'acoes' }, { label: 'Relatórios', tab: 'relatorios' }]
}

function Card({ icon, label, desc, selected, onClick }: {
  icon: string; label: string; desc: string; selected: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '12px', textAlign: 'left' as const,
        padding: '14px 16px', borderRadius: '12px', cursor: 'pointer', width: '100%',
        background: selected ? 'rgba(124,58,237,0.12)' : C.surface,
        border: `1px solid ${selected ? 'rgba(124,58,237,0.5)' : C.border}`,
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)' }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = C.border }}
    >
      <span style={{ fontSize: '22px', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: selected ? C.purpleHi : C.text1, marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '11px', color: C.text3, lineHeight: 1.45 }}>{desc}</div>
      </div>
      {selected && <span style={{ color: C.purpleHi, fontSize: '14px', flexShrink: 0 }}>✓</span>}
    </button>
  )
}

export function OnboardingProfileGoal({ onComplete }: Props) {
  const [step, setStep]       = useState<1 | 2 | 3>(1)
  const [profile, setProfile] = useState<string>('')
  const [goal, setGoal]       = useState<string>('')

  const rec = profile && goal ? recommend(profile, goal) : null
  const recSteps = rec ? steps(rec.mode, rec.tab) : []

  const profileLabel = PROFILES.find(p => p.key === profile)?.label || ''
  const recTabLabel  = rec ? (TAB_LABEL[rec.tab] || 'Visão geral') : ''

  const why = rec ? (
    rec.mode === 'simple'
      ? `Como você é ${profileLabel.toLowerCase()}, vamos começar de forma simples e direta — sem termos técnicos. Começar por "${recTabLabel}" responde rápido o que mais importa pra você agora.`
      : `Como você trabalha com performance, ativamos o modo completo com todas as métricas. Começar por "${recTabLabel}" te dá a visão técnica que você precisa.`
  ) : ''

  function finish(navigate: boolean) {
    if (!rec) return
    const data: ProfileGoalData = {
      profile, goal,
      recommendedMode: rec.mode,
      recommendedTab: rec.tab,
      completedAt: new Date().toISOString(),
    }
    try { localStorage.setItem(PROFILE_GOAL_KEY, JSON.stringify(data)) } catch {}
    onComplete(data, navigate)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2100, background: C.bg, overflowY: 'auto' as const }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 20px 40px' }}>

        {/* Logo + progresso */}
        <div style={{ textAlign: 'center' as const, marginBottom: '32px' }}>
          <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #A78BFA, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>ELYON</div>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '14px' }}>
            {[1, 2, 3].map(n => (
              <span key={n} style={{ width: n === step ? '24px' : '7px', height: '7px', borderRadius: '99px', background: n <= step ? C.purpleHi : 'rgba(255,255,255,0.15)', transition: 'all 0.25s' }} />
            ))}
          </div>
        </div>

        {/* Etapa 1 — Perfil */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: C.text1, margin: '0 0 6px', textAlign: 'center' as const, letterSpacing: '-0.02em' }}>Quem é você?</h2>
            <p style={{ fontSize: '13px', color: C.text3, margin: '0 0 24px', textAlign: 'center' as const }}>Isso nos ajuda a montar a experiência ideal pra você.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {PROFILES.map(p => (
                <Card key={p.key} icon={p.icon} label={p.label} desc={p.desc} selected={profile === p.key}
                  onClick={() => { setProfile(p.key); setStep(2) }} />
              ))}
            </div>
          </div>
        )}

        {/* Etapa 2 — Objetivo */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: C.text1, margin: '0 0 6px', textAlign: 'center' as const, letterSpacing: '-0.02em' }}>Qual é seu principal objetivo agora?</h2>
            <p style={{ fontSize: '13px', color: C.text3, margin: '0 0 24px', textAlign: 'center' as const }}>Escolha o que mais importa neste momento.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {GOALS.map(g => (
                <Card key={g.key} icon={g.icon} label={g.label} desc={g.desc} selected={goal === g.key}
                  onClick={() => { setGoal(g.key); setStep(3) }} />
              ))}
            </div>
            <button onClick={() => setStep(1)} style={{ marginTop: '18px', fontSize: '12px', color: C.text3, background: 'none', border: 'none', cursor: 'pointer' }}>← Voltar</button>
          </div>
        )}

        {/* Etapa 3 — Recomendação */}
        {step === 3 && rec && (
          <div>
            <div style={{ textAlign: 'center' as const, marginBottom: '8px' }}>
              <span style={{ fontSize: '32px' }}>{rec.mode === 'simple' ? '🟢' : '⚙️'}</span>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: C.text1, margin: '0 0 6px', textAlign: 'center' as const, letterSpacing: '-0.02em' }}>
              Seu caminho recomendado
            </h2>
            <p style={{ fontSize: '13px', color: C.text2, margin: '0 0 20px', textAlign: 'center' as const, lineHeight: 1.6 }}>{why}</p>

            {/* Resumo da recomendação */}
            <div style={{ padding: '18px 20px', borderRadius: '14px', background: C.purpleBg, border: '1px solid rgba(124,58,237,0.22)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' as const, marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: C.text3, textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: '3px' }}>Modo</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: rec.mode === 'simple' ? C.green : C.purpleHi }}>
                    {rec.mode === 'simple' ? '🟢 Simplificado' : '⚙️ Avançado'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: C.text3, textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: '3px' }}>Comece por</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: C.text1 }}>{recTabLabel}</div>
                </div>
              </div>

              {/* 3 primeiros passos */}
              <div style={{ fontSize: '10px', color: C.text3, textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: '8px' }}>Seus primeiros passos</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recSteps.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, background: 'rgba(124,58,237,0.2)', color: C.purpleHi, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>{i + 1}</span>
                    <span style={{ fontSize: '13px', color: C.text1 }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ações */}
            <button
              onClick={() => finish(true)}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', marginBottom: '10px' }}
            >
              Começar pelo caminho recomendado →
            </button>
            <button
              onClick={() => finish(false)}
              style={{ width: '100%', padding: '11px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, color: C.text3, background: 'none', border: `1px solid ${C.border}`, cursor: 'pointer' }}
            >
              Prefiro explorar por conta própria
            </button>
            <button onClick={() => setStep(2)} style={{ display: 'block', margin: '16px auto 0', fontSize: '12px', color: C.text3, background: 'none', border: 'none', cursor: 'pointer' }}>← Mudar objetivo</button>
          </div>
        )}
      </div>
    </div>
  )
}
