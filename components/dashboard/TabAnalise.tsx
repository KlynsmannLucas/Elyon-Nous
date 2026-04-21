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

export function TabAnalise({ clientData, planHasAudit, onUpgrade }: Props) {
  const [mode, setMode] = useState<'auditoria' | 'pipeline'>('auditoria')
  const sensitive = isSensitiveNiche(clientData?.niche)

  return (
    <div>
      {/* Alerta de conformidade para nichos sensíveis */}
      {sensitive && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl mb-5"
          style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.22)' }}>
          <span className="text-base flex-shrink-0 mt-0.5">⚠️</span>
          <div>
            <div className="text-xs font-semibold mb-0.5" style={{ color: '#F0B429' }}>
              Nicho com restrições de copy nos anúncios
            </div>
            <div className="text-xs text-slate-400 leading-relaxed">
              Meta e Google têm políticas específicas para <strong className="text-slate-300">{clientData?.niche}</strong>. Evite termos como "cura", "garantia de resultado" ou promessas de saúde/jurídico. Pergunte à <strong className="text-slate-300">NOUS</strong> por ângulos de copy aprovados para esse nicho.
            </div>
          </div>
        </div>
      )}

      {/* Toggle de modo */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex rounded-xl p-1 gap-1" style={{ background: '#111114', border: '1px solid #2A2A30' }}>
          {[
            { key: 'auditoria', label: '🔍 Auditoria Detalhada', sub: '11 seções' },
            { key: 'pipeline',  label: '🤖 Pipeline 360°',       sub: '5 agentes IA' },
          ].map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key as typeof mode)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={mode === m.key
                ? { background: 'rgba(240,180,41,0.12)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.35)' }
                : { background: 'transparent', color: '#64748B', border: '1px solid transparent' }
              }
            >
              {m.label}
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                style={mode === m.key
                  ? { color: '#F0B429', background: 'rgba(240,180,41,0.1)' }
                  : { color: '#475569', background: '#16161A' }
                }
              >
                {m.sub}
              </span>
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-600 ml-auto">
          {mode === 'auditoria'
            ? 'Análise manual com upload de CSV · diagnóstico completo em 11 dimensões'
            : 'Pipeline autônomo de 5 agentes IA · análise integrada em 3–5 min'
          }
        </div>
      </div>

      {/* Conteúdo do modo selecionado */}
      <div key={mode} className="animate-fade-up">
        {mode === 'auditoria' ? (
          planHasAudit
            ? <TabAuditoria clientData={clientData} />
            : (
              <div className="flex items-center justify-center min-h-[50vh]">
                <div className="max-w-sm text-center">
                  <div className="text-4xl mb-4">🔒</div>
                  <h3 className="font-display text-xl font-bold text-white mb-2">Auditoria Avançada</h3>
                  <p className="text-slate-400 text-sm mb-6">
                    Disponível nos planos Profissional e Avançada. Faça upgrade para desbloquear auditoria completa com 11 dimensões e análise de campanhas reais.
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
        ) : (
          <TabPipeline clientData={clientData} />
        )}
      </div>
    </div>
  )
}
