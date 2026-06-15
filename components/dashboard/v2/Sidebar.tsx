// components/dashboard/v2/Sidebar.tsx
// Redesign v2 — Nova Sidebar (6+2 áreas)
'use client'

import { useState } from 'react'
import { Icon } from './Icon'

// Nova arquitetura: 6 áreas por objetivo + 2 sistema
export type AreaKey =
  | 'hoje' | 'desempenho' | 'diagnostico' | 'mercado' | 'plano' | 'relatorios'
  | 'integracoes' | 'config'

const AREAS = {
  hoje:       { label: 'Hoje',       icon: 'home',  color: '#2C5FE0', target: '/hoje' },
  desempenho: { label: 'Desempenho', icon: 'chart', color: '#2C5FE0', target: '/desempenho' },
  diagnostico:{ label: 'Diagnóstico',icon: 'pulse', color: '#2C5FE0', target: '/diagnostico' },
  mercado:   { label: 'Mercado',   icon: 'globe', color: '#0E9E6E', target: '/mercado' },
  plano:    { label: 'Plano de Ação', icon: 'check', color: '#0E9E6E', target: '/plano' },
  relatorios:{ label: 'Relatórios',icon: 'doc',   color: '#0E9CB0', target: '/relatorios' },
}

const SYSTEM_AREAS = {
  integracoes:{ label: 'Integrações',icon: 'plug', color: '#64748B', target: '/integracoes' },
  config:   { label: 'Config',    icon: 'gear', color: '#64748B', target: '/config' },
}


interface SidebarProps {
  activeArea: AreaKey
  onChangeArea: (area: AreaKey) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
  activeClient?: string
}

export function SidebarV2({
  activeArea,
  onChangeArea,
  collapsed = false,
  onToggleCollapse,
  activeClient,
}: SidebarProps) {
  const [hovered, setHovered] = useState<AreaKey | null>(null)

  const allAreas = { ...AREAS, ...SYSTEM_AREAS }


  return (
    <aside className={`
      h-screen bg-paper border-r border-line flex flex-col
      transition-all duration-200 sidebar-transition
      ${collapsed ? 'w-[66px]' : 'w-[232px]'}
    `.trim()}>
      {/* Logo */}
      <div className={`h-16 flex items-center border-b border-line gap-2.5 ${collapsed ? 'justify-center px-0' : 'px-4'}`}>
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

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {!collapsed && <div className="px-4 mb-2 text-[10.5px] font-mono uppercase tracking-[0.14em] text-ink-3">Operação</div>}
        {/* 6 Areas */}
        <div className="px-2 space-y-1">
          {(Object.keys(AREAS) as (keyof typeof AREAS)[]).map(area => {
            const item = AREAS[area]
            const isActive = activeArea === area
            return (
              <button
                key={area}
                onClick={() => onChangeArea(area)}
                onMouseEnter={() => setHovered(area)}
                onMouseLeave={() => setHovered(null)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-left
                  transition-all duration-150
                  ${isActive 
                    ? 'bg-blue-soft text-blue border border-blue-line' 
                    : 'text-ink-2 hover:bg-canvas-2 hover:text-ink'
                  }
                `.trim()}
              >
                <Icon name={item.icon} size={18} className="shrink-0" />
                {!collapsed && (
                  <>
                    <span className="text-sm font-medium flex-1">{item.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue" />
                    )}
                  </>
                )}
              </button>
            )
          })}
        </div>

        {/* Divider */}
        <div className="my-4 mx-4 border-t border-line" />
        {!collapsed && <div className="px-4 mb-2 text-[10.5px] font-mono uppercase tracking-[0.14em] text-ink-3">Sistema</div>}

        {/* System Areas */}
        <div className="px-2 space-y-1">
          {(Object.keys(SYSTEM_AREAS) as (keyof typeof SYSTEM_AREAS)[]).map(area => {
            const item = SYSTEM_AREAS[area]
            const isActive = activeArea === area
            return (
              <button
                key={area}
                onClick={() => onChangeArea(area)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-left
                  transition-all duration-150
                  ${isActive 
                    ? 'bg-canvas-2 text-ink border border-line' 
                    : 'text-ink-3 hover:bg-canvas-2 hover:text-ink-2'
                  }
                `.trim()}
              >
                <Icon name={item.icon} size={18} className="shrink-0 opacity-70" />
                {!collapsed && (
                  <span className="text-sm font-medium flex-1 opacity-80">{item.label}</span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Footer — cliente ativo + recolher */}
      <div className="p-3 border-t border-line">
        {!collapsed && activeClient && (
          <div className="flex items-center gap-2.5 px-2 py-2 mb-1 rounded-sm bg-canvas-2">
            <span className="w-7 h-7 rounded-full bg-blue text-white text-xs font-semibold flex items-center justify-center shrink-0">{activeClient.charAt(0).toUpperCase()}</span>
            <div className="min-w-0">
              <div className="text-[9.5px] font-mono uppercase tracking-[0.12em] text-ink-3">Cliente ativo</div>
              <div className="text-sm font-medium text-ink truncate">{activeClient}</div>
            </div>
          </div>
        )}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 text-ink-3 hover:text-ink hover:bg-canvas-2 rounded-sm"
            title={collapsed ? 'Expandir' : 'Recolher'}
          >
            <Icon name={collapsed ? 'chevR' : 'chevD'} size={16} className={collapsed ? '' : 'rotate-90'} />
          </button>
        )}
      </div>
    </aside>
  )
}
