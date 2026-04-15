// components/dashboard/TabIntelligence.tsx — Insights personalizados por IA
'use client'

import { useState } from 'react'
import { StatCard } from './StatCard'
import { getNicheContent } from '@/lib/niche_content'
import type { NicheInsight } from '@/lib/niche_content'
import type { ClientData } from '@/lib/store'
import { useAppStore } from '@/lib/store'

interface Props {
  clientData: ClientData | null
}

function InsightCard({ insight, index }: { insight: NicheInsight; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleApply = () => {
    if (!insight.steps) {
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
  const { strategyData, campaignHistory } = useAppStore()
  const [aiInsights, setAiInsights] = useState<NicheInsight[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [source, setSource] = useState<'static' | 'ai'>('static')

  const staticContent = getNicheContent(clientData?.niche || '')
  const displayInsights = source === 'ai' && aiInsights ? aiInsights : staticContent.insights
  const withSteps = displayInsights.filter((i) => i.steps).length

  const handleGenerate = async () => {
    if (!clientData) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientData.clientName,
          niche: clientData.niche,
          budget: clientData.budget,
          objective: clientData.objective,
          currentCPL: clientData.currentCPL,
          mainChallenge: clientData.mainChallenge,
          strategy: strategyData?.strategy,
          campaignHistory,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setAiInsights(json.insights)
      setSource('ai')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    { label: 'Insights disponíveis', value: String(displayInsights.length), color: '#F0B429' },
    { label: 'Com passo a passo',   value: String(withSteps),               color: '#22C55E' },
    { label: 'Fonte',               value: source === 'ai' ? 'IA' : 'Nicho', color: '#A78BFA' },
  ]

  return (
    <div className="space-y-6">
      {/* Header + botão */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-white mb-1">Inteligência de Mercado</h2>
          <p className="text-slate-500 text-sm">
            {source === 'ai'
              ? 'Insights gerados pela IA com base nos dados específicos deste cliente.'
              : 'Insights do nicho. Clique em "Gerar com IA" para personalizar ao máximo.'}
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading || !clientData}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #A78BFA, #7C3AED)', color: '#fff' }}
        >
          {loading ? '🧠 Gerando...' : source === 'ai' ? '🔄 Regerar com IA' : '🧠 Gerar com IA'}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <StatCard key={s.label} label={s.label} value={s.value} color={s.color} delay={i * 0.1} />
        ))}
      </div>

      {/* Badge do nicho + fonte */}
      {clientData?.niche && (
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="text-slate-500">Insights para:</span>
          <span className="px-3 py-1 rounded-full font-semibold"
            style={{ background: 'rgba(240,180,41,0.1)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.25)' }}>
            {clientData.niche}
          </span>
          {source === 'ai' && (
            <span className="px-3 py-1 rounded-full font-semibold"
              style={{ background: 'rgba(167,139,250,0.1)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.25)' }}>
              ✨ Personalizado por IA
            </span>
          )}
          {withSteps > 0 && (
            <span className="text-slate-600 text-[11px]">
              · {withSteps} com passo a passo
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#1E1E24]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#1E1E24] rounded w-3/4" />
                  <div className="h-3 bg-[#1E1E24] rounded w-full" />
                  <div className="h-3 bg-[#1E1E24] rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lista de insights */}
      {!loading && (
        <div className="space-y-3">
          {displayInsights.map((insight, i) => (
            <InsightCard key={`${source}-${insight.title}`} insight={insight} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
