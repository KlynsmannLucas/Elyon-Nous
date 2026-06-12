'use client'

import { ReactNode } from 'react'

interface SectionHeadProps {
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
}

export function SectionHead({
  title,
  subtitle,
  action,
  className = '',
}: SectionHeadProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${className}`}>
      <div>
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {subtitle && <p className="text-sm text-ink-2 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
