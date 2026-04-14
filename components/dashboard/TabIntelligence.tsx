// components/dashboard/TabIntelligence.tsx — Insights acionáveis por nicho
'use client'

import { useState } from 'react'
import { StatCard } from './StatCard'
import { getNicheContent } from '@/lib/niche_content'
import type { NicheInsight } from '@/lib/niche_content'
import type { ClientData } from '@/lib/store'

interface Props {
  clientData: ClientData | null
}

function InsightCard({ insight, index }: { insight: NicheInsight; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleApply = () => {
    if (!insight.steps) {
      // Sem steps → copia o insight para clipboard como checklist
      const text = `📌 ${insight.title}\n${insight.description}`
      navigator.clipboard?.writeText(text).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      return
    }
    setExpanded((v) => !v)
  }

  const handleCopyChecklist = () => {
    if (!insight.steps) return
    const text = `✅ ${insight.title}\n\n${insight.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="bg-[#111114] border rounded-2xl overflow-hidden transition-all duration-300 animate-fade-up"
      style={{
        borderColor: expanded ? `${insight.categoryColor}40` : '#2A2A30',
        animationDelay: `${index * 0.08}s`,
      }}
    >
      {/* Linha principal */}
      <div className="p-5 flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: `${insight.categoryColor}18` }}
        >
          {insight.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h4 className="font-display font-bold text-white text-sm leading-snug">{insight.title}</h4>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ color: insight.categoryColor, background: `${insight.categoryColor}18` }}
            >
              {insight.category}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed mb-3">{insight.description}</p>
          <button
            onClick={handleApply}
            className="text-xs font-semibold transition-all hover:opacity-70 flex items-center gap-1"
            style={{ color: insight.categoryColor }}
          >
            {copied && !expanded
              ? '✓ Copiado!'
              : expanded
                ? '▲ Fechar'
                : insight.steps
                  ? '▼ Como aplicar →'
                  : '📋 Copiar insight →'
            }
          </button>
        </div>
      </div>

      {/* Accordion de passos */}
      {expanded && insight.steps && (
        <div
          className="px-5 pb-5 pt-0"
          style={{ borderTop: `1px solid ${insight.categoryColor}20` }}
        >
          <div className="pt-4">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span style={{ color: insight.categoryColor }}>⚡</span>
              Passo a passo para aplicar
            </div>
            <div className="space-y-2.5">
              {insight.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                    style={{ background: `${insight.categoryColor}20`, color: insight.categoryColor }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-xs text-slate-300 leading-relaxed">{step}</span>
                </div>
              ))}
            </div>

            {/* Botão copiar checklist */}
            <button
              onClick={handleCopyChecklist}
              className="mt-4 flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg transition-all hover:opacity-80"
              style={{
                background: copied ? 'rgba(34,197,94,0.1)' : `${insight.categoryColor}10`,
                color: copied ? '#22C55E' : insight.categoryColor,
                border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : `${insight.categoryColor}25`}`,
              }}
            >
              {copied ? '✓ Checklist copiado!' : '📋 Copiar como checklist'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function TabIntelligence({ clientData }: Props) {
  const content  = getNicheContent(clientData?.niche || '')
  const insights = content.insights
  const withSteps = insights.filter((i) => i.steps).length

  const stats = [
    { label: 'Insights do nicho',    value: String(insights.length), color: '#F0B429' },
    { label: 'Com passo a passo',    value: String(withSteps),        color: '#22C55E' },
    { label: 'Impacto potencial',    value: '+32%',                   color: '#A78BFA' },
  ]

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <StatCard key={s.label} label={s.label} value={s.value} color={s.color} delay={i * 0.1} />
        ))}
      </div>

      {/* Badge do nicho */}
      {clientData?.niche && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Insights para o nicho:</span>
          <span className="px-3 py-1 rounded-full font-semibold"
            style={{ background: 'rgba(240,180,41,0.1)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.25)' }}>
            {clientData.niche}
          </span>
          {withSteps > 0 && (
            <span className="text-slate-600 text-[11px]">
              · {withSteps} com passo a passo — clique em "Como aplicar →"
            </span>
          )}
        </div>
      )}

      {/* Lista de insights */}
      <div className="space-y-3">
        {insights.map((insight, i) => (
          <InsightCard key={insight.title} insight={insight} index={i} />
        ))}
      </div>
    </div>
  )
}
