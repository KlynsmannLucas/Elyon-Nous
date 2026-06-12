'use client'

import { ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-line-2 text-ink-2',
  success: 'bg-green-soft text-green-600',
  warning: 'bg-amber-soft text-amber-600',
  error: 'bg-red-soft text-red',
  info: 'bg-blue-soft text-blue',
  outline: 'bg-transparent border border-line text-ink-2',
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
