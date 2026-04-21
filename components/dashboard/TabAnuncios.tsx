// components/dashboard/TabAnuncios.tsx — Hub de Anúncios: Conexões + Meta + Google unificados
'use client'

import { useState } from 'react'
import { TabConnections } from './TabConnections'
import { TabMetaIntelligence } from './TabMetaIntelligence'
import { TabGoogleIntelligence } from './TabGoogleIntelligence'
import { TabABTest } from './TabABTest'
import { useAppStore } from '@/lib/store'
import type { ClientData } from '@/lib/store'

interface Props {
  planHasConnections: boolean
  onUpgrade: () => void
  clientData: ClientData | null
}

type SubTab = 'meta' | 'google' | 'abtests' | 'conexoes'

export function TabAnuncios({ planHasConnections, onUpgrade, clientData }: Props) {
  const [sub, setSub] = useState<SubTab>('meta')
  const connectedAccounts = useAppStore((s) => s.connectedAccounts)
  const creativeTests     = useAppStore((s) => s.creativeTests)
  const metaConnected     = connectedAccounts.some((a) => a.platform === 'meta')
  const googleConnected   = connectedAccounts.some((a) => a.platform === 'google')

  const subTabs: { key: SubTab; label: string; icon: string; badge?: string }[] = [
    { key: 'meta',     label: 'Meta Ads IA',   icon: '📘', badge: metaConnected ? 'conectado' : undefined },
    { key: 'google',   label: 'Google Ads IA', icon: '🔵', badge: googleConnected ? 'conectado' : undefined },
    { key: 'abtests',  label: 'Testes A/B',    icon: '🧪', badge: creativeTests.filter(t => t.status === 'running').length > 0 ? String(creativeTests.filter(t => t.status === 'running').length) : undefined },
    { key: 'conexoes', label: 'Conexões',      icon: '🔗' },
  ]

  if (!planHasConnections) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="max-w-sm text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="font-display text-xl font-bold text-white mb-2">Anúncios ao Vivo</h3>
          <p className="text-slate-400 text-sm mb-6">
            Conecte suas contas Meta Ads e Google Ads para ver dados reais, análise por IA e recomendações em tempo real. Disponível nos planos Profissional e Avançada.
          </p>
          <button
            onClick={onUpgrade}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-black text-sm hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)' }}
          >
            ⚡ Fazer upgrade
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-[#1E1E24] pb-0">
        {subTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setSub(t.key)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all relative"
            style={{
              color: sub === t.key ? '#F0B429' : '#475569',
              borderTop: 'none', borderLeft: 'none', borderRight: 'none',
              borderBottom: sub === t.key ? '2px solid #F0B429' : '2px solid transparent',
              marginBottom: '-1px',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            <span>{t.icon}</span>
            {t.label}
            {t.badge && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono"
                style={{ color: '#22C55E', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Conteúdo da sub-tab */}
      <div key={sub} className="animate-fade-up">
        {sub === 'meta'     && <TabMetaIntelligence    onNavigateToConnections={() => setSub('conexoes')} />}
        {sub === 'google'   && <TabGoogleIntelligence  onNavigateToConnections={() => setSub('conexoes')} />}
        {sub === 'abtests'  && <TabABTest clientData={clientData} />}
        {sub === 'conexoes' && <TabConnections />}
      </div>
    </div>
  )
}
