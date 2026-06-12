// components/dashboard/TabAnalise.tsx — Análise Profunda: Auditoria + Pipeline 360° unificados
'use client'

import { useState } from 'react'
import { TabAuditoria } from './TabAuditoria'
import TabPipeline from './TabPipeline'
import type { ClientData } from '@/lib/store'

interface Props {
  clientData: ClientData | null
  planHasAudit: boolean
  onUpgrade: () => void
  autoRun?: boolean
  onAutoRunConsumed?: () => void
}

const SENSITIVE_KEYWORDS = [
  'odontolog', 'clínica', 'médic', 'fisioterapia', 'psicolog', 'nutricion',
  'farmácia', 'laboratório', 'veterinári', 'estética', 'harmonização', 'home care',
  'advocacia', 'juríd', 'financeiro', 'crédito',
]

function isSensitiveNiche(niche?: string) {
  if (!niche) return false
  const n = niche.toLowerCase()
  return SENSITIVE_KEYWORDS.some((k) => n.includes(k))
}

const C = {
  surface:  '#FFFFFF',
  elevated: '#FBFCFD',
  border:   'rgba(255,255,255,0.06)',
  purple:   '#2C5FE0',
  purpleL:  '#2C5FE0',
  purpleD:  'rgba(124,58,237,0.12)',
  purpleB:  'rgba(124,58,237,0.22)',
  amber:    '#E08B0B',
  text1:    '#161B26',
  text2:    '#5A6473',
  text3:    '#8A93A3',
}

export function TabAnalise({ clientData, planHasAudit, onUpgrade, autoRun, onAutoRunConsumed }: Props) {
  const [mode, setMode] = useState<'auditoria' | 'pipeline'>('auditoria')
  const sensitive = isSensitiveNiche(clientData?.niche)

  return (
    <div>
      {/* Alerta de conformidade para nichos sensíveis */}
      {sensitive && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '12px',
          padding: '12px 16px', borderRadius: '12px', marginBottom: '20px',
          background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.22)',
        }}>
          <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '2px' }}>⚠️</span>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: C.amber, marginBottom: '2px' }}>
              Nicho com restrições de copy nos anúncios
            </div>
            <div style={{ fontSize: '12px', color: C.text2, lineHeight: 1.6 }}>
              Meta e Google têm políticas específicas para{' '}
              <strong style={{ color: C.text1 }}>{clientData?.niche}</strong>. Evite termos como "cura",
              "garantia de resultado" ou promessas de saúde/jurídico. Pergunte à{' '}
              <strong style={{ color: C.text1 }}>Assistente IA</strong> por ângulos de copy aprovados para esse nicho.
            </div>
          </div>
        </div>
      )}

      {/* Toggle de modo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{
          display: 'flex', borderRadius: '12px', padding: '4px', gap: '4px',
          background: C.elevated, border: `1px solid ${C.border}`,
        }}>
          {([
            { key: 'auditoria', label: '🔍 Auditoria Detalhada', sub: '11 seções' },
            { key: 'pipeline',  label: '🤖 Análise por Agentes IA', sub: '5 agentes' },
          ] as { key: 'auditoria' | 'pipeline'; label: string; sub: string }[]).map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key as typeof mode)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 16px', borderRadius: '9px', fontWeight: 600,
                fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s',
                border: 'none',
                ...(mode === m.key
                  ? { background: C.purpleD, color: C.purpleL, outline: `1px solid ${C.purpleB}` }
                  : { background: 'transparent', color: C.text3, outline: 'none' }),
              }}
            >
              {m.label}
              <span style={{
                fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                fontFamily: 'monospace',
                ...(mode === m.key
                  ? { color: C.purpleL, background: 'rgba(124,58,237,0.1)' }
                  : { color: '#475569', background: C.surface }),
              }}>
                {m.sub}
              </span>
            </button>
          ))}
        </div>

        <div style={{ fontSize: '11px', color: C.text3, marginLeft: 'auto' }}>
          {mode === 'auditoria'
            ? 'Análise manual com upload de CSV · diagnóstico completo em 11 dimensões'
            : 'Pipeline autônomo de 5 agentes IA · análise integrada em 3–5 min'
          }
        </div>
      </div>

      {/* Conteúdo do modo selecionado */}
      <div key={mode}>
        {mode === 'auditoria' ? (
          planHasAudit
            ? <TabAuditoria clientData={clientData} autoRun={autoRun} onAutoRunConsumed={onAutoRunConsumed} />
            : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
                <div style={{ maxWidth: '360px', textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔒</div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: C.text1, margin: '0 0 8px' }}>
                    Auditoria Avançada
                  </h3>
                  <p style={{ fontSize: '13px', color: C.text2, margin: '0 0 24px', lineHeight: 1.6 }}>
                    Disponível nos planos Profissional e Avançada. Faça upgrade para desbloquear auditoria completa com 11 dimensões e análise de campanhas reais.
                  </p>
                  <button
                    onClick={onUpgrade}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      padding: '12px 20px', borderRadius: '12px', fontWeight: 700,
                      fontSize: '13px', color: '#fff', cursor: 'pointer',
                      background: 'linear-gradient(135deg, #2C5FE0, #2C5FE0)', border: 'none',
                      boxShadow: '0 2px 12px rgba(124,58,237,0.35)',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.9' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                  >
                    ⚡ Fazer upgrade
                  </button>
                </div>
              </div>
            )
        ) : (
          <TabPipeline clientData={clientData} />
        )}
      </div>
    </div>
  )
}
