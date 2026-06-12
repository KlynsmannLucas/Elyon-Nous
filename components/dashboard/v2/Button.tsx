// components/dashboard/v2/Button.tsx
// Button para tema light
import { ReactNode, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'soft'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
}

const VARIANTS = {
  primary:   'bg-blue text-white hover:bg-blue-600 shadow-card',
  secondary: 'bg-paper text-ink border border-line hover:border-blue hover:text-blue',
  ghost:     'bg-transparent text-ink-2 hover:text-ink hover:bg-canvas-2',
  soft:      'bg-blue-soft text-blue hover:bg-blue/10 border border-blue-line',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded-sm',
  md: 'px-4 py-2 text-sm rounded-sm',
  lg: 'px-5 py-2.5 text-base rounded-md',
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  icon, 
  iconPosition = 'left',
  children, 
  className = '',
  ...props 
}: ButtonProps) {
  return (
    <button 
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        transition-all duration-150 cursor-pointer disabled:opacity50
        ${VARIANTS[variant]} ${SIZES[size]} ${className}
      `.trim()}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </button>
  )
}
