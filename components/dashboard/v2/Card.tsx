// components/dashboard/v2/Card.tsx
// Redesign v2 — Card base para tema light
import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const PADDING = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-[18px]',
  lg: 'p-5',
}

export function Card({ children, className = '', hover = false, padding = 'md' }: CardProps) {
  return (
    <div className={`
      bg-paper rounded-md border border-line 
      shadow-card ${hover ? 'hover-lift hover:shadow-card-hover' : ''}
      ${PADDING[padding]} ${className}
    `.trim()}>
      {children}
    </div>
  )
}
