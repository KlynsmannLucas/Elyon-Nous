// components/dashboard/ErrorBoundary.tsx
'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  tabName?: string
}

interface State {
  hasError: boolean
  message: string
}

export class TabErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error) {
    console.error(`[TabErrorBoundary] ${this.props.tabName || 'Tab'} crashed:`, error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-4xl mb-4 opacity-30">⚠️</div>
          <div className="font-display font-bold text-white mb-2">
            Algo deu errado nesta aba
          </div>
          <p className="text-slate-500 text-sm max-w-sm mb-5 leading-relaxed">
            {this.state.message || 'Erro inesperado. Seus dados estão seguros.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="text-sm font-bold px-4 py-2 rounded-xl transition-opacity hover:opacity-80"
            style={{ background: 'rgba(240,180,41,0.15)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.3)' }}
          >
            Tentar novamente
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
