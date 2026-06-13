// components/dashboard/v2/Topbar.tsx
// Redesign v2 — Nova Topbar
'use client'

import { useState, ReactNode } from 'react'

interface TopbarProps {
  title: string
  subtitle?: string
  mode: 'simplified' | 'advanced'
  onModeChange: (mode: 'simplified' | 'advanced') => void
  period: string
  onPeriodChange: (period: string) => void
  clients?: { id: string; name: string }[]
  activeClient?: string
  onClientChange?: (clientId: string) => void
  onNewClient?: () => void
  credits?: number
  onOpenCredits?: () => void
  onOpenNous?: () => void
  notificationCount?: number
}

const PERIODS = ['Hoje', '7d', '30d', '90d', 'Este mês', 'Mês passado']

export function TopbarV2({
  title,
  mode,
  onModeChange,
  period,
  onPeriodChange,
  clients,
  activeClient,
  onClientChange,
  onNewClient,
  credits,
  onOpenCredits,
  onOpenNous,
  notificationCount = 0
}: TopbarProps) {
  const [showPeriodMenu, setShowPeriodMenu] = useState(false)
  const [showClientMenu, setShowClientMenu] = useState(false)

  const activeClientData = clients?.find(c => c.id === activeClient)

  return (
    <header className="sticky top-0 z-40 h-16 glass border-b border-line flex items-center px-4 gap-4">
      {/* Title */}
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold text-ink">{title}</h1>
      </div>

      <div className="flex-1" />


      {/* Mode Toggle */}
      <div className="flex bg-canvas-2 rounded-sm p-0.5">
        <button
          onClick={() => onModeChange('simplified')}
          className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
            mode === 'simplified' 
              ? 'bg-paper text-ink shadow-sm' 
              : 'text-ink-3 hover:text-ink'
          }`}
        >
          Simplificada
        </button>
        <button
          onClick={() => onModeChange('advanced')}
          className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
            mode === 'advanced' 
              ? 'bg-paper text-ink shadow-sm' 
              : 'text-ink-3 hover:text-ink'
          }`}
        >
          Avançada
        </button>
      </div>

      {/* Period Selector */}
      <div className="relative">
        <button
          onClick={() => setShowPeriodMenu(!showPeriodMenu)}
          className="flex items-center gap-2 px-3 py-2 bg-paper border border-line rounded-sm text-sm text-ink hover:border-blue"
        >
          <span>{period}</span>
          <span className="text-xs">▼</span>
        </button>
        {showPeriodMenu && (
          <div className="absolute top-full right-0 mt-1 w-32 bg-paper border border-line rounded-sm shadow-pop z-50">
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => { onPeriodChange(p); setShowPeriodMenu(false) }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-canvas-2 ${
                  period === p ? 'text-blue font-medium' : 'text-ink'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Multi-Client Selector */}
      {((clients && clients.length > 0) || onNewClient) && (
        <div className="relative">
          <button
            onClick={() => setShowClientMenu(!showClientMenu)}
            className="flex items-center gap-2 px-3 py-2 bg-paper border border-line rounded-sm text-sm text-ink hover:border-blue"
          >
            <span className="w-6 h-6 rounded-full bg-blue flex items-center justify-center text-white text-xs">
              {activeClientData?.name?.charAt(0) || '+'}
            </span>
            <span>{activeClientData?.name || 'Novo cliente'}</span>
            <span className="text-xs">▼</span>
          </button>
          {showClientMenu && (
            <div className="absolute top-full right-0 mt-1 w-52 bg-paper border border-line rounded-sm shadow-pop z-50 overflow-hidden">
              {clients?.map(c => (
                <button
                  key={c.id}
                  onClick={() => { onClientChange?.(c.id); setShowClientMenu(false) }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-canvas-2 ${
                    activeClient === c.id ? 'text-blue font-medium' : 'text-ink'
                  }`}
                >
                  {c.name}
                </button>
              ))}
              {onNewClient && (
                <button
                  onClick={() => { onNewClient(); setShowClientMenu(false) }}
                  className="w-full px-3 py-2 text-left text-sm text-blue font-medium hover:bg-blue-soft border-t border-line flex items-center gap-2"
                >
                  <span className="w-5 h-5 rounded-md bg-blue-soft flex items-center justify-center text-blue text-xs">+</span>
                  Novo cliente
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Credits */}
      {credits !== undefined && (
        <button
          onClick={onOpenCredits}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-soft text-blue rounded-sm text-sm font-medium"
        >
          <span>💎</span>
          <span className="font-mono">{credits}</span>
        </button>
      )}

      {/* NOUS Button */}
      <button
        onClick={onOpenNous}
        className="flex items-center gap-2 px-4 py-2 bg-blue text-white rounded-sm text-sm font-medium hover:bg-blue-600"
      >
        <span>◎</span>
        <span> Perguntar ao NOUS</span>
      </button>

      {/* Notifications */}
      <button className="relative p-2 text-ink-3 hover:text-ink">
        <span>🔔</span>
        {notificationCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red text-white text-[10px] rounded-full flex items-center justify-center">
            {notificationCount}
          </span>
        )}
      </button>
    </header>
  )
}
