// components/dashboard/v2/Sidebar.tsx
// Redesign v2 — Nova Sidebar (6+2 áreas)
'use client'

import { useState } from 'react'

// Nova arquitetura: 6 áreas por objetivo + 2 sistema
export type AreaKey = 
  | 'hoje' | 'desempenho' | 'diagnostico' | 'mercado' | 'plano' | 'relatorios'
  | 'integracoes' | 'config'

const AREAS = {
  hoje:       { label: 'Hoje',       icon: '🏠', color: '#2C5FE0', target: '/hoje' },
  desempenho: { label: 'Desempenho', icon: '📊', color: '#2C5FE0', target: '/desempenho' },
  diagnostico:{ label: 'Diagnóstico',icon: '🔬', color: '#2C5FE0', target: '/diagnostico' },
  mercado:   { label: 'Mercado',   icon: '🌐', color: '#0E9E6E', target: '/mercado' },
  plano:    { label: 'Plano de Ação', icon: '✅', color: '#0E9E6E', target: '/plano' },
  relatorios:{ label: 'Relatórios',icon: '📋', color: '#0E9CB0', target: '/relatorios' },
}

const SYSTEM_AREAS = {
  integracoes:{ label: 'Integrações',icon: '🔌', color: '#64748B', target: '/integracoes' },
  config:   { label: 'Config',    icon: '⚙️', color: '#64748B', target: '/config' },
}


interface SidebarProps {
  activeArea: AreaKey
  onChangeArea: (area: AreaKey) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
  credits?: number
  onOpenCredits?: () => void
}

export function SidebarV2({ 
  activeArea, 
  onChangeArea, 
  collapsed = false, 
  onToggleCollapse,
  credits,
  onOpenCredits 
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
      <div className="h-16 flex items-center px-4 border-b border-line">
        <div className="w-8 h-8 rounded-lg bg-blue-gradient flex items-center justify-center">
          <span className="text-white font-bold text-sm">E</span>
        </div>
        {!collapsed && (
          <span className="ml-2 font-semibold text-ink">Elyon</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {/* 6 Areas */}
        <div className="px-2 space-y-1">
          {(Object.keys(AREAS) as AreaKey[]).map(area => {
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
                <span className="text-base">{item.icon}</span>
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


        {/* System Areas */}
        <div className="px-2 space-y-1">
          {(Object.keys(SYSTEM_AREAS) as AreaKey[]).map(area => {
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
                <span className="text-base opacity-60">{item.icon}</span>
                {!collapsed && (
                  <span className="text-sm font-medium flex-1 opacity-60">{item.label}</span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Credits / Footer */}
      <div className="p-3 border-t border-line">
        {credits !== undefined && (
          <button 
            onClick={onOpenCredits}
            className="w-full flex items-center justify-between px-3 py-2 bg-canvas-2 rounded-sm text-sm text-ink-2 hover:bg-canvas"
          >
            <span>Credits IA</span>
            <span className="font-mono text-blue">{credits}</span>
          </button>
        )}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 mt-2 text-ink-3 hover:text-ink hover:bg-canvas-2 rounded-sm"
          >
            <span>{collapsed ? '→' : '←'}</span>
          </button>
        )}
      </div>
    </aside>
  )
}
