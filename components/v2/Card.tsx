'use client'

import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  const paddingClass = {
    none: '',
    sm: 'p-3',
    md: 'p-4 md:p-5',
    lg: 'p-5 md:p-6',
  }[padding]

  return (
    <div
      className={`bg-paper border border-line rounded-lg shadow-sm ${paddingClass} ${className}`}
    >
      {children}
    </div>
  )
}
