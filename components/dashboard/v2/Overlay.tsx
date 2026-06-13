// components/dashboard/v2/Overlay.tsx
// Primitivos de overlay do Redesign v2: Modal, DropdownMenu, MenuItem/Label/Divider.
// Esc fecha, click-outside fecha, backdrop blur — conforme o handoff (polish.jsx).
'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

/* ── Modal ──────────────────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, sub, icon, children, footer, width = 520 }: {
  open: boolean; onClose: () => void; title: string; sub?: string; icon?: string
  children: ReactNode; footer?: ReactNode; width?: number
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-[rgba(20,28,46,0.32)] animate-fade-in" style={{ backdropFilter: 'blur(3px)' }} />
      <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true"
        className="scale-in relative w-full bg-paper border border-line rounded-lg shadow-pop max-h-[90vh] flex flex-col"
        style={{ maxWidth: width }}>
        <div className="px-[22px] pt-[18px] pb-3.5 border-b border-line flex items-start gap-3">
          {icon && <span className="w-9 h-9 rounded-sm bg-blue-soft text-blue flex items-center justify-center shrink-0"><Icon name={icon} size={18} /></span>}
          <div className="flex-1 min-w-0">
            <div className="text-base font-bold text-ink" style={{ letterSpacing: '-0.01em' }}>{title}</div>
            {sub && <div className="text-[12.5px] text-ink-3 mt-0.5">{sub}</div>}
          </div>
          <button onClick={onClose} aria-label="Fechar" className="p-1.5 rounded-sm text-ink-3 hover:bg-canvas-2 shrink-0">
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="px-[22px] py-[18px] overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-[22px] py-3.5 border-t border-line flex gap-2.5 justify-end bg-paper-2 rounded-b-lg">{footer}</div>}
      </div>
    </div>
  )
}

/* ── DropdownMenu (ancorado, click-outside, Esc) ────────────────────────── */
export function DropdownMenu({ trigger, children, align = 'right', minWidth = 220 }: {
  trigger: ReactNode; children: ReactNode; align?: 'left' | 'right'; minWidth?: number
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])
  return (
    <div ref={wrapRef} className="relative inline-flex">
      <span onClick={() => setOpen(o => !o)}>{trigger}</span>
      {open && (
        <div className="scale-in absolute top-[calc(100%+6px)] bg-paper border border-line rounded-md shadow-pop p-1.5 z-[150]"
          style={{ minWidth, [align]: 0 }} onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  )
}

export function MenuItem({ icon, children, onClick, active, danger }: {
  icon?: string; children: ReactNode; onClick?: () => void; active?: boolean; danger?: boolean
}) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-sm text-[13px] text-left transition-colors
        ${active ? 'bg-blue-soft text-blue-600 font-semibold' : danger ? 'text-red hover:bg-canvas-2' : 'text-ink-2 hover:bg-canvas-2 font-medium'}`}>
      {icon && <Icon name={icon} size={15} />}<span className="flex-1">{children}</span>
      {active && <Icon name="check" size={14} w={2.6} />}
    </button>
  )
}
export function MenuLabel({ children }: { children: ReactNode }) {
  return <div className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-ink-3 px-2.5 pt-1.5 pb-1">{children}</div>
}
export function MenuDivider() {
  return <div className="h-px bg-line mx-1 my-1.5" />
}
