// components/dashboard/v2/Sidebar.tsx
// Redesign v2 — Sidebar (6+2 áreas) com ClientSwitcher + linha de usuário (fiel ao prototype).
'use client'

import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

export type AreaKey =
  | 'hoje' | 'desempenho' | 'diagnostico' | 'mercado' | 'plano' | 'relatorios'
  | 'integracoes' | 'config'

const AREAS = {
  hoje:       { label: 'Hoje',         icon: 'home' },
  desempenho: { label: 'Desempenho',   icon: 'chart' },
  diagnostico:{ label: 'Diagnóstico',  icon: 'pulse' },
  mercado:    { label: 'Mercado',      icon: 'globe' },
  plano:      { label: 'Plano de Ação', icon: 'check' },
  relatorios: { label: 'Relatórios',   icon: 'doc' },
}
const SYSTEM_AREAS = {
  integracoes:{ label: 'Integrações',  icon: 'plug' },
  config:     { label: 'Configurações', icon: 'gear' },
}

interface Client { id: string; name: string }
interface SidebarProps {
  activeArea: AreaKey
  onChangeArea: (area: AreaKey) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
  clients?: Client[]
  activeClientId?: string
  onClientChange?: (id: string) => void
  onNewClient?: () => void
  userName?: string
  userPlan?: string
  onLogout?: () => void
}

const initials = (s: string) => (s || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
const AV_COLORS = ['#2C5FE0', '#0E9E6E', '#0E9CB0', '#E08B0B', '#7C5CFC', '#E1483F']
const colorFor = (s: string) => AV_COLORS[(s || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length]

function Avatar({ name, size = 30 }: { name: string; size?: number }) {
  return (
    <span className="rounded-full text-white font-semibold flex items-center justify-center shrink-0"
      style={{ width: size, height: size, background: colorFor(name), fontSize: size * 0.4 }}>{initials(name)}</span>
  )
}

function ClientSwitcher({ clients, activeId, onChange, onNew }: { clients: Client[]; activeId?: string; onChange?: (id: string) => void; onNew?: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc); return () => document.removeEventListener('mousedown', onDoc)
  }, [open])
  const active = clients.find(c => c.id === activeId) || clients[0]
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2.5 w-full px-2.5 py-2 bg-canvas border border-line rounded-sm text-left hover:border-line-strong transition-colors">
        <Avatar name={active?.name || 'Novo'} size={28} />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-ink-3">Cliente ativo</div>
          <div className="text-[12.5px] font-semibold text-ink truncate">{active?.name || 'Selecionar'}</div>
        </div>
        <Icon name="chevD" size={15} className="text-ink-3 shrink-0" />
      </button>
      {open && (
        <div className="scale-in absolute left-0 right-0 bottom-[calc(100%+6px)] min-w-[240px] bg-paper border border-line rounded-md shadow-pop p-1.5 z-[120]">
          <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-ink-3 px-2 pt-1.5 pb-1">Trocar cliente</div>
          {clients.map(c => (
            <button key={c.id} onClick={() => { onChange?.(c.id); setOpen(false) }}
              className={`flex items-center gap-2.5 w-full px-2 py-2 rounded-sm text-left transition-colors ${c.id === active?.id ? 'bg-blue-soft' : 'hover:bg-canvas-2'}`}>
              <Avatar name={c.name} size={30} />
              <span className="text-[13px] font-semibold text-ink truncate flex-1">{c.name}</span>
              {c.id === active?.id && <Icon name="check" size={14} className="text-blue" />}
            </button>
          ))}
          {onNew && (
            <button onClick={() => { onNew(); setOpen(false) }}
              className="flex items-center gap-2 w-full px-2 py-2.5 mt-1 border-t border-line text-blue-600 text-[12.5px] font-semibold hover:bg-blue-soft rounded-sm">
              <Icon name="plus" size={15} /> Adicionar cliente
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function SidebarV2({
  activeArea, onChangeArea, collapsed = false, onToggleCollapse,
  clients = [], activeClientId, onClientChange, onNewClient, userName, userPlan, onLogout,
}: SidebarProps) {
  const NavBtn = ({ area, item, sys }: { area: string; item: { label: string; icon: string }; sys?: boolean }) => {
    const isActive = activeArea === area
    return (
      <button onClick={() => onChangeArea(area as AreaKey)} title={collapsed ? item.label : undefined}
        className={`w-full flex items-center gap-3 rounded-sm text-left relative transition-all ${collapsed ? 'justify-center py-2.5' : 'px-3 py-2.5'}
          ${isActive ? (sys ? 'bg-canvas-2 text-ink' : 'bg-blue-soft text-blue-600 font-semibold') : sys ? 'text-ink-3 hover:bg-canvas-2 hover:text-ink-2' : 'text-ink-2 hover:bg-canvas-2 hover:text-ink'}`}>
        {isActive && !collapsed && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-blue" />}
        <Icon name={item.icon} size={18} w={isActive ? 2 : 1.8} className={`shrink-0 ${sys && !isActive ? 'opacity-70' : ''}`} />
        {!collapsed && <span className={`text-[13.5px] flex-1 ${sys && !isActive ? 'opacity-80' : ''}`}>{item.label}</span>}
      </button>
    )
  }

  return (
    <aside className={`h-screen bg-paper border-r border-line flex flex-col transition-all duration-200 ${collapsed ? 'w-[66px]' : 'w-[232px]'}`}>
      {/* Logo + recolher */}
      <div className={`h-16 flex items-center border-b border-line ${collapsed ? 'justify-center px-0' : 'px-4 justify-between'}`}>
        <div className="flex items-center gap-2.5">
          <svg width="30" height="30" viewBox="0 0 32 32" className="shrink-0">
            <defs><linearGradient id="lgmk" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#2C5FE0" /><stop offset="100%" stopColor="#0E9CB0" /></linearGradient></defs>
            <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#lgmk)" />
            <path d="M11 9h10M11 16h7M11 23h10" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="22" cy="16" r="1.8" fill="#fff" />
          </svg>
          {!collapsed && (
            <div className="leading-none">
              <div className="text-base font-bold text-ink" style={{ letterSpacing: '-0.01em' }}>Elyon</div>
              <div className="font-mono text-[9.5px] tracking-[0.28em] text-ink-3 mt-0.5">NOUS</div>
            </div>
          )}
        </div>
        {!collapsed && onToggleCollapse && (
          <button onClick={onToggleCollapse} title="Recolher" className="p-1 text-ink-4 hover:text-ink"><Icon name="chevL" size={18} /></button>
        )}
      </div>
      {collapsed && onToggleCollapse && (
        <button onClick={onToggleCollapse} title="Expandir" className="self-center mt-2 text-ink-4 hover:text-ink"><Icon name="chevR" size={18} /></button>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-3.5 px-3 overflow-y-auto no-sb">
        {!collapsed && <div className="px-1 pb-2 text-[10.5px] font-mono uppercase tracking-[0.14em] text-ink-3">Operação</div>}
        <div className="space-y-0.5">
          {(Object.keys(AREAS) as (keyof typeof AREAS)[]).map(area => <NavBtn key={area} area={area} item={AREAS[area]} />)}
        </div>
        <div className="h-px bg-line mx-1 my-3.5" />
        {!collapsed && <div className="px-1 pb-2 text-[10.5px] font-mono uppercase tracking-[0.14em] text-ink-3">Sistema</div>}
        <div className="space-y-0.5">
          {(Object.keys(SYSTEM_AREAS) as (keyof typeof SYSTEM_AREAS)[]).map(area => <NavBtn key={area} area={area} item={SYSTEM_AREAS[area]} sys />)}
        </div>
      </nav>

      {/* Footer — cliente ativo + usuário */}
      {!collapsed ? (
        <div className="p-3 border-t border-line">
          {clients.length > 0 && <div className="mb-2.5"><ClientSwitcher clients={clients} activeId={activeClientId} onChange={onClientChange} onNew={onNewClient} /></div>}
          <div className="flex items-center gap-2.5">
            <Avatar name={userName || 'Você'} size={34} />
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-semibold text-ink truncate">{userName || 'Você'}</div>
              {userPlan && <div className="font-mono text-[10px] text-ink-3 uppercase">Plano {userPlan}</div>}
            </div>
            {onLogout && <button onClick={onLogout} title="Sair" className="p-1.5 border border-line rounded-md text-ink-3 hover:text-ink hover:border-line-strong"><Icon name="logout" size={15} /></button>}
          </div>
        </div>
      ) : (
        <div className="py-3 border-t border-line flex flex-col items-center gap-2">
          <Avatar name={userName || 'Você'} size={32} />
          {onLogout && <button onClick={onLogout} title="Sair" className="p-1.5 border border-line rounded-md text-ink-3 hover:text-ink"><Icon name="logout" size={14} /></button>}
        </div>
      )}
    </aside>
  )
}
