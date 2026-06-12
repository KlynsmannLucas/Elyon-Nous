'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Visão Geral', icon: '◫' },
  { href: '/dashboard/auditoria', label: 'Auditoria', icon: '◉' },
  { href: '/dashboard/estrategia', label: 'Estratégia', icon: '◎' },
  { href: '/dashboard/performance', label: 'Performance', icon: '◧' },
  { href: '/dashboard/campanhas', label: 'Campanhas', icon: '◪' },
  { href: '/dashboard/financeiro', label: 'Financeiro', icon: '◫' },
  { href: '/dashboard/relatorios', label: 'Relatórios', icon: '◫' },
]

export function SidebarV2() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-paper border-r border-line transition-all duration-200 ${collapsed ? 'w-16' : 'w-56'}`}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="h-14 px-4 flex items-center border-b border-line">
          <span className="font-display font-bold text-lg text-ink">ELYON</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-blue-soft text-blue' : 'text-ink-2 hover:bg-canvas-2 hover:text-ink'}`}
              >
                <span className="text-base">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="h-12 border-t border-line flex items-center justify-center text-ink-3 hover:text-ink transition-colors"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>
    </aside>
  )
}
