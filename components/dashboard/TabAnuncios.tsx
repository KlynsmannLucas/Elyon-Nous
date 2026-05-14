'use client'

import { useState } from 'react'
import { TabConnections } from './TabConnections'
import { TabMetaIntelligence } from './TabMetaIntelligence'
import { TabGoogleIntelligence } from './TabGoogleIntelligence'
import { TabABTest } from './TabABTest'
import { TabCriarCampanha } from './TabCriarCampanha'
import { useAppStore } from '@/lib/store'
import type { ClientData } from '@/lib/store'

const C = {
  bg:       '#080D1A',
  surface:  '#0F1629',
  elevated: '#131E35',
  border:   'rgba(99,120,255,0.1)',
  purple:   '#7C3AED',
  purpleL:  '#A78BFA',
  green:    '#22C55E',
  greenBg:  'rgba(34,197,94,0.1)',
  red:      '#EF4444',
  redBg:    'rgba(239,68,68,0.1)',
  blue:     '#38BDF8',
  blueBg:   'rgba(56,189,248,0.1)',
  gold:     '#F59E0B',
  goldBg:   'rgba(245,158,11,0.1)',
  text1:    '#F1F5F9',
  text2:    'rgba(255,255,255,0.5)',
  text3:    'rgba(255,255,255,0.25)',
}

interface Props {
  planHasConnections: boolean
  onUpgrade: () => void
  clientData: ClientData | null
}

type SubTab = 'meta' | 'google' | 'criar' | 'abtests' | 'conexoes'

const META_SVG = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#38BDF8">
    <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/>
  </svg>
)

const GOOGLE_SVG = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

export function TabAnuncios({ planHasConnections, onUpgrade, clientData }: Props) {
  const [sub, setSub] = useState<SubTab>('meta')
  const connectedAccounts = useAppStore((s) => s.connectedAccounts)
  const creativeTests     = useAppStore((s) => s.creativeTests)
  const metaConnected     = connectedAccounts.some((a) => a.platform === 'meta')
  const googleConnected   = connectedAccounts.some((a) => a.platform === 'google')
  const runningTests      = creativeTests.filter(t => t.status === 'running').length

  const subTabs: { key: SubTab; label: string; icon: React.ReactNode; badge?: string; badgeColor?: string }[] = [
    {
      key: 'meta',
      label: 'Meta Ads IA',
      icon: META_SVG,
      badge: metaConnected ? 'ao vivo' : undefined,
      badgeColor: C.green,
    },
    {
      key: 'google',
      label: 'Google Ads IA',
      icon: GOOGLE_SVG,
      badge: googleConnected ? 'ao vivo' : undefined,
      badgeColor: C.green,
    },
    {
      key: 'criar',
      label: 'Criar Campanha',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      ),
    },
    {
      key: 'abtests',
      label: 'Testes A/B',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
        </svg>
      ),
      badge: runningTests > 0 ? String(runningTests) : undefined,
      badgeColor: C.gold,
    },
    {
      key: 'conexoes',
      label: 'Conexões',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
      ),
    },
  ]

  if (!planHasConnections) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <div style={{ maxWidth: 360, textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: C.goldBg, border: `1px solid ${C.gold}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, margin: '0 auto 20px',
          }}>
            🔒
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.text1, marginBottom: 8 }}>
            Anúncios ao Vivo
          </div>
          <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, marginBottom: 24 }}>
            Conecte suas contas Meta Ads e Google Ads para ver dados reais, análise por IA e recomendações em tempo real. Disponível nos planos Profissional e Avançada.
          </p>
          <button
            onClick={onUpgrade}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', borderRadius: 12,
              background: `linear-gradient(135deg, ${C.gold}, #FFD166)`,
              color: '#000', fontWeight: 700, fontSize: 14,
              border: 'none', cursor: 'pointer',
            }}
          >
            ⚡ Fazer upgrade
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        borderBottom: `1px solid ${C.border}`,
        marginBottom: 24, paddingBottom: 0,
      }}>
        {subTabs.map((t) => {
          const active = sub === t.key
          return (
            <button
              key={t.key}
              onClick={() => setSub(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 16px',
                fontSize: 13, fontWeight: 600,
                color: active ? C.purpleL : C.text2,
                background: 'transparent',
                border: 'none',
                borderBottom: active ? `2px solid ${C.purpleL}` : '2px solid transparent',
                marginBottom: -1,
                cursor: 'pointer',
                transition: 'color 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ color: active ? C.purpleL : C.text3, display: 'flex', alignItems: 'center' }}>
                {t.icon}
              </span>
              {t.label}
              {t.badge && (
                <span style={{
                  fontSize: 10, padding: '1px 6px', borderRadius: 99, fontFamily: 'monospace',
                  color: t.badgeColor ?? C.green,
                  background: `${t.badgeColor ?? C.green}18`,
                  border: `1px solid ${t.badgeColor ?? C.green}30`,
                }}>
                  {t.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div key={sub}>
        {sub === 'meta'     && <TabMetaIntelligence    onNavigateToConnections={() => setSub('conexoes')} />}
        {sub === 'google'   && <TabGoogleIntelligence  onNavigateToConnections={() => setSub('conexoes')} />}
        {sub === 'criar'    && <TabCriarCampanha clientData={clientData} onNavigateToConnections={() => setSub('conexoes')} />}
        {sub === 'abtests'  && <TabABTest clientData={clientData} />}
        {sub === 'conexoes' && <TabConnections />}
      </div>
    </div>
  )
}
