// components/dashboard/TabDiagnostic.tsx — Diagnóstico inteligente por nicho
'use client'

import { useState } from 'react'
import { getBenchmark } from '@/lib/niche_benchmarks'
import type { ClientData } from '@/lib/store'

interface Props {
  clientData: ClientData | null
  strategy: Record<string, any>
  analysis: Record<string, any>
}

export function TabDiagnostic({ clientData, strategy, analysis }: Props) {
  const [diagnostic, setDiagnostic] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const bench = getBenchmark(clientData?.niche || '')

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientData?.clientName,
          niche: clientData?.niche,
          strategy,
          analysis,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setDiagnostic(json.diagnostic)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const gradeColor: Record<string, string> = {
    'A+': '#22C55E', A: '#22C55E', 'B+': '#F0B429',
    B: '#F0B429', 'C+': '#F59E0B', C: '#F59E0B', D: '#FF4D4D',
  }

  return (
    <div className="space-y-6">
      {/* Header + benchmark preview */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-white mb-1">Diagnóstico de Crescimento</h2>
          <p className="text-slate-500 text-sm">
            Análise orientada por dados: funil, desperdícios, gargalos e oportunidades reais.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)', color: '#000' }}
        >
          {loading ? '⚡ Analisando...' : '⚡ Gerar Diagnóstico'}
        </button>
      </div>

      {/* Benchmark cards (sempre visível) */}
      {bench && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'CPL benchmark', value: `R$${bench.cpl_min}–${bench.cpl_max}`, color: '#F0B429' },
            { label: 'ROAS bom (nicho)', value: `${bench.kpi_thresholds.roas_good}×`, color: '#22C55E' },
            { label: 'CVR lead→venda', value: `${(bench.cvr_lead_to_sale * 100).toFixed(0)}%`, color: '#A78BFA' },
            { label: 'Budget mínimo', value: `R$${bench.budget_floor.toLocaleString('pt-BR')}`, color: '#38BDF8' },
          ].map((m) => (
            <div key={m.label} className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-4 text-center">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{m.label}</div>
              <div className="font-display text-xl font-bold" style={{ color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* Resultado do diagnóstico */}
      {diagnostic && (
        <div className="space-y-4 animate-fade-up">
          {/* Score + grade */}
          <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Score da Estratégia</div>
                <div className="font-display text-4xl font-bold" style={{ color: gradeColor[diagnostic.grade] || '#F0B429' }}>
                  {diagnostic.score}/100 <span className="text-2xl">{diagnostic.grade}</span>
                </div>
              </div>
              {/* Barra */}
              <div className="w-32 h-3 bg-[#1E1E24] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${diagnostic.score}%`,
                    background: `${gradeColor[diagnostic.grade] || '#F0B429'}`,
                  }}
                />
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{diagnostic.summary}</p>
          </div>

          {/* Benchmark comparison */}
          {diagnostic.benchmark_comparison && (
            <div className="grid md:grid-cols-2 gap-3">
              {['cpl', 'roas'].map((key) => {
                const status = diagnostic.benchmark_comparison[`${key}_status`]
                const msg    = diagnostic.benchmark_comparison[`${key}_message`]
                const color  = status === 'Excelente' ? '#22C55E' : status === 'Bom' ? '#F0B429' : '#FF4D4D'
                return (
                  <div key={key} className="bg-[#111114] border rounded-xl p-4" style={{ borderColor: `${color}33` }}>
                    <div className="text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color }}>
                      {key.toUpperCase()} — {status}
                    </div>
                    <p className="text-sm text-slate-400">{msg}</p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Strengths / Weaknesses / Opportunities */}
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { key: 'strengths',     title: '✅ Pontos Fortes',  color: 'rgba(34,197,94,0.3)',  bg: 'rgba(34,197,94,0.05)' },
              { key: 'weaknesses',    title: '⚠️ Fraquezas',     color: 'rgba(255,77,77,0.3)',  bg: 'rgba(255,77,77,0.05)' },
              { key: 'opportunities', title: '🚀 Oportunidades',  color: 'rgba(240,180,41,0.3)', bg: 'rgba(240,180,41,0.05)' },
            ].map(({ key, title, color, bg }) => (
              <div key={key} className="rounded-2xl p-5" style={{ background: bg, border: `1px solid ${color}` }}>
                <div className="font-display font-bold text-white text-sm mb-3">{title}</div>
                <div className="space-y-3">
                  {(diagnostic[key] || []).slice(0, 3).map((item: any, i: number) => (
                    <div key={i}>
                      <div className="text-sm font-semibold text-white mb-0.5">{item.title}</div>
                      <div className="text-xs text-slate-500 leading-relaxed">{item.detail || item.expected_result}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Ações imediatas */}
          {diagnostic.immediate_actions?.length > 0 && (
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
              <div className="font-display font-bold text-white mb-4">⚡ Ações Imediatas</div>
              <div className="space-y-3">
                {diagnostic.immediate_actions.map((a: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-[#16161A] rounded-xl">
                    <span className="w-6 h-6 rounded-full bg-[#F0B429] text-black text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-white">{a.action}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{a.timeline} · {a.expected_result}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights do nicho */}
          {bench?.insights && (
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
              <div className="font-display font-bold text-white mb-3">💡 Insights do Mercado ({clientData?.niche})</div>
              <div className="space-y-2">
                {bench.insights.map((ins, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="text-[#F0B429] mt-0.5">→</span>
                    {ins}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!diagnostic && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-4 opacity-40">🎯</div>
          <div className="font-display text-lg font-bold text-white mb-2">Diagnóstico não gerado</div>
          <p className="text-slate-500 text-sm max-w-sm">
            Clique em "Gerar Diagnóstico" para receber uma análise detalhada com dados reais do nicho {clientData?.niche}.
          </p>
        </div>
      )}
    </div>
  )
}
