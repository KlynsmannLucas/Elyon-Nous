// components/dashboard/ModeToast.tsx — Toast temporário ao trocar de modo (só em ação do usuário)
'use client'

import { useState, useEffect, useRef } from 'react'

interface ToastState { mode: 'simple' | 'pro'; key: number }

export function ModeToast() {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      const mode = (e as CustomEvent).detail?.mode as 'simple' | 'pro'
      if (!mode) return
      setToast({ mode, key: Date.now() })
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setToast(null), 4000)
    }
    window.addEventListener('elyon:mode-changed', handler)
    return () => window.removeEventListener('elyon:mode-changed', handler)
  }, [])

  if (!toast) return null

  const isSimple = toast.mode === 'simple'
  const cfg = isSimple
    ? { icon: '🟢', color: '#22C55E', border: 'rgba(34,197,94,0.35)', bg: 'rgba(10,28,20,0.96)',
        title: 'Você entrou no Modo Simplificado',
        text: 'Linguagem simples, diagnósticos claros e ações práticas.' }
    : { icon: '⚙️', color: '#A78BFA', border: 'rgba(124,58,237,0.35)', bg: 'rgba(14,16,30,0.96)',
        title: 'Você entrou no Modo Avançado',
        text: 'Métricas detalhadas e análises técnicas.' }

  return (
    <div
      key={toast.key}
      style={{
        position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 2200, maxWidth: '440px', width: 'calc(100% - 32px)',
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '14px 18px', borderRadius: '14px',
        background: cfg.bg, border: `1px solid ${cfg.border}`,
        boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
        backdropFilter: 'blur(12px)',
        animation: 'modeToastIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      <span style={{ fontSize: '22px', flexShrink: 0 }}>{cfg.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 800, color: cfg.color, marginBottom: '2px' }}>{cfg.title}</div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.45 }}>{cfg.text}</div>
      </div>
      <style>{`@keyframes modeToastIn { from { opacity: 0; transform: translate(-50%, 16px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>
    </div>
  )
}
