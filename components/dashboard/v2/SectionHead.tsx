// components/dashboard/v2/SectionHead.tsx
// Título de seção com ícone opcional
import { ReactNode } from 'react'

interface SectionHeadProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  action?: ReactNode
}

export function SectionHead({ title, subtitle, icon, action }: SectionHeadProps) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-center gap-2">
        {icon && <span className="text-ink-3">{icon}</span>}
        <div>
          <h3 className="text-[15px] font-semibold text-ink" style={{ letterSpacing: '-0.01em' }}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-ink-3 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
