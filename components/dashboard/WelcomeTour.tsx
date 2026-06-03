// components/dashboard/WelcomeTour.tsx — Tour de boas-vindas (primeira visita)
'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'

const C = {
  surface:  '#0C1426',
  elevated: '#111D33',
  border:   'rgba(255,255,255,0.08)',
  purple:   '#7C3AED',
  purpleHi: '#A78BFA',
  green:    '#22C55E',
  text1:    '#F1F5F9',
  text2:    '#94A3B8',
  text3:    'rgba(255,255,255,0.4)',
}

interface Slide {
  icon: string
  title: string
  body: React.ReactNode
}

const SLIDES: Slide[] = [
  {
    icon: '👋',
    title: 'Bem-vindo ao ELYON',
    body: (
      <>
        Sua central de inteligência de marketing com IA. Aqui você descobre o que está
        funcionando nas suas campanhas, o que corrigir e exatamente o que fazer para crescer —
        em linguagem que você entende.
      </>
    ),
  },
  {
    icon: '🟢',
    title: 'Dois modos de visualização',
    body: (
      <>
        No topo da tela há um botão para alternar entre:
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
          <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <strong style={{ color: C.green }}>🟢 Simplificado</strong>
            <span style={{ color: C.text2, fontSize: '12px' }}> — linguagem de negócio, sem termos técnicos. Ideal para donos de empresa.</span>
          </div>
          <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <strong style={{ color: C.purpleHi }}>⚙ Avançado</strong>
            <span style={{ color: C.text2, fontSize: '12px' }}> — todas as métricas (CTR, CPL, ROAS). Ideal para gestores de tráfego.</span>
          </div>
        </div>
      </>
    ),
  },
  {
    icon: '🧭',
    title: 'Por onde começar',
    body: (
      <>
        No menu lateral você encontra tudo organizado por etapa:
        <ul style={{ margin: '12px 0 0', paddingLeft: '18px', color: C.text2, fontSize: '13px', lineHeight: 1.9 }}>
          <li><strong style={{ color: C.text1 }}>Como Estou Indo</strong> — resumo da sua conta</li>
          <li><strong style={{ color: C.text1 }}>Diagnóstico</strong> — o que a IA encontrou</li>
          <li><strong style={{ color: C.text1 }}>O Que Fazer Agora</strong> — suas ações prioritárias</li>
          <li><strong style={{ color: C.text1 }}>Próximos Passos</strong> — checklist de implementação</li>
        </ul>
      </>
    ),
  },
  {
    icon: '🚀',
    title: 'Pronto para começar',
    body: (
      <>
        A qualquer momento você pode trocar de modo, editar os dados do seu negócio
        e pedir ajuda ao assistente de IA (botão no canto inferior direito).
        <div style={{ marginTop: '12px', fontSize: '13px', color: C.purpleHi, fontWeight: 600 }}>
          Vamos fazer seu negócio crescer. 💜
        </div>
      </>
    ),
  },
]

export function WelcomeTour() {
  const welcomeTourSeen   = useAppStore(s => s.welcomeTourSeen)
  const setWelcomeTourSeen = useAppStore(s => s.setWelcomeTourSeen)
  const clientData        = useAppStore(s => s.clientData)

  const [step, setStep]   = useState(0)
  const [mounted, setMounted] = useState(false)

  // Só monta no cliente (evita hydration mismatch com persisted state)
  useEffect(() => { setMounted(true) }, [])

  // Só mostra quando já há um cliente configurado e o tour nunca foi visto
  if (!mounted || welcomeTourSeen || !clientData?.clientName) return null

  const isLast = step === SLIDES.length - 1
  const slide  = SLIDES[step]

  const close = () => setWelcomeTourSeen(true)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(2,6,16,0.8)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      animation: 'wt-fade 0.25s ease',
    }}>
      <div style={{
        width: '100%', maxWidth: '440px', borderRadius: '18px', overflow: 'hidden',
        background: C.surface, border: `1px solid ${C.border}`,
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Header gradiente */}
        <div style={{
          padding: '28px 28px 20px', textAlign: 'center',
          background: 'linear-gradient(160deg, rgba(124,58,237,0.18), rgba(124,58,237,0.02))',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>{slide.icon}</div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: C.text1, margin: 0, letterSpacing: '-0.02em' }}>
            {slide.title}
          </h2>
        </div>

        {/* Corpo */}
        <div style={{ padding: '4px 28px 24px', fontSize: '14px', color: C.text2, lineHeight: 1.7, minHeight: '120px' }}>
          {slide.body}
        </div>

        {/* Footer: dots + botões */}
        <div style={{ padding: '16px 28px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Dots */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {SLIDES.map((_, i) => (
              <span key={i} style={{
                width: i === step ? '20px' : '6px', height: '6px', borderRadius: '99px',
                background: i === step ? C.purpleHi : 'rgba(255,255,255,0.15)',
                transition: 'all 0.25s',
              }} />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {!isLast && (
              <button
                onClick={close}
                style={{ fontSize: '12px', color: C.text3, background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
              >
                Pular
              </button>
            )}
            <button
              onClick={() => isLast ? close() : setStep(step + 1)}
              style={{
                padding: '9px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                cursor: 'pointer', border: 'none', color: '#fff',
                background: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              {isLast ? 'Começar 🚀' : 'Próximo →'}
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes wt-fade { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </div>
  )
}
