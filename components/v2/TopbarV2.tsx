'use client'

import { UserButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const periodOptions = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
  { value: '12m', label: '12 meses' },
]

interface TopbarV2Props {
  period?: string
  onPeriodChange?: (period: string) => void
}

export function TopbarV2({ period = '30d', onPeriodChange }: TopbarV2Props) {
  const pathname = usePathname()
  const { user } = useUser()

  return (
    <header className="h-14 bg-paper border-b border-line px-4 md:px-6 flex items-center justify-between gap-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/dashboard" className="text-ink-2 hover:text-ink transition-colors">
          Dashboard
        </Link>
        <span className="text-ink-3">/</span>
        <span className="text-ink font-medium">
          {pathname.split('/').pop() || 'Visão Geral'}
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Period selector */}
        <select
          value={period}
          onChange={(e) => onPeriodChange?.(e.target.value)}
          className="h-8 px-2 text-sm bg-paper border border-line rounded-md text-ink focus:outline-none focus:ring-2 focus:ring-blue/30"
        >
          {periodOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* User */}
        {user && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-2 hidden sm:block">
              {user.firstName}
            </span>
            <UserButton afterSignOutUrl="/" />
          </div>
        )}
      </div>
    </header>
  )
}
