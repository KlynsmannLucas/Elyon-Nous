// components/dashboard/v2/Toast.tsx
// Sistema global de toasts do Redesign v2. Provider montado no layout (elyon).
// Uso: const toast = useToast(); toast({ tone:'good', title, body })  — ou window.toast(...)
'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { Icon } from './Icon'

export type ToastTone = 'good' | 'bad' | 'warn' | 'blue'
export interface ToastInput { tone?: ToastTone; title?: string; body?: string; duration?: number }
interface ToastItem extends Required<Pick<ToastInput, 'tone'>> { id: string; title?: string; body?: string; duration: number }

const TONE: Record<ToastTone, { c: string; b: string; icon: string }> = {
  good: { c: '#0E9E6E', b: '#BBE7D3', icon: 'check' },
  bad:  { c: '#E1483F', b: '#F3CFCC', icon: 'alert' },
  warn: { c: '#E08B0B', b: '#F2DDB0', icon: 'flag' },
  blue: { c: '#2C5FE0', b: '#CBDBFB', icon: 'spark' },
}

const ToastCtx = createContext<(t: ToastInput) => void>(() => {})
export const useToast = () => useContext(ToastCtx)

declare global { interface Window { toast?: (t: ToastInput) => void } }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const dismiss = useCallback((id: string) => {
    setItems(s => s.filter(x => x.id !== id))
    if (timers.current[id]) { clearTimeout(timers.current[id]); delete timers.current[id] }
  }, [])

  const push = useCallback((t: ToastInput) => {
    const id = Math.random().toString(36).slice(2, 8)
    const item: ToastItem = { id, tone: t.tone ?? 'good', title: t.title, body: t.body, duration: t.duration ?? 3400 }
    setItems(s => [...s, item])
    timers.current[id] = setTimeout(() => dismiss(id), item.duration)
  }, [dismiss])

  useEffect(() => {
    window.toast = push
    return () => { if (window.toast === push) delete window.toast }
  }, [push])

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed right-5 bottom-5 z-[300] flex flex-col gap-2.5 pointer-events-none">
        {items.map(t => {
          const tone = TONE[t.tone]
          return (
            <div key={t.id} className="scale-in pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-[380px] bg-paper rounded-md shadow-pop px-3.5 py-3"
              style={{ border: `1px solid ${tone.b}`, borderLeft: `3px solid ${tone.c}` }}>
              <span style={{ color: tone.c }} className="shrink-0 mt-0.5"><Icon name={tone.icon} size={17} /></span>
              <div className="flex-1 min-w-0">
                {t.title && <div className="text-[13px] font-semibold text-ink" style={{ marginBottom: t.body ? 3 : 0 }}>{t.title}</div>}
                {t.body && <div className="text-[12.5px] text-ink-2 leading-snug">{t.body}</div>}
              </div>
              <button onClick={() => dismiss(t.id)} aria-label="Fechar" className="shrink-0 text-ink-4 hover:text-ink-2 p-0.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6l-12 12" /></svg>
              </button>
            </div>
          )
        })}
      </div>
    </ToastCtx.Provider>
  )
}
