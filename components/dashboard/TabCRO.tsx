// components/dashboard/TabCRO.tsx — CRO Agent: Otimização de conversão (AGENT.md)
'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'

interface CRORecommendation {
  priority: 'urgent' | 'high' | 'medium' | 'low'
  area: 'landing_page' | 'creative' | 'audience' | 'funnel' | 'bid' | 'budget' | 'copy'
  title: string
  problem: string
  solution: string
  expectedImpact: string
  estimatedCPLReduction?: number
  effort: 'baixo' | 'médio' | 'alto'
  timeframe: string
}

interface CROAnalysis {
  score: number
  grade: string
  summary: string
  bottleneck: string
  recommendations: CRORecommendation[]
  quickWins: string[]
  estimatedCPLWithOptimization: number | null
}

const PRIORITY_CONFIG = {
  urgent: { color: '#FF4D4D', bg: 'rgba(255,77,77,0.08)', border: 'rgba(255,77,77,0.2)', label: 'Urgente', emoji: '🔴' },
  high:   { color: '#F0B429', bg: 'rgba(240,180,41,0.08)', border: 'rgba(240,180,41,0.2)', label: 'Alta',   emoji: '🟡' },
  medium: { color: '#38BDF8', bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.2)', label: 'Média',  emoji: '🔵' },
  low:    { color: '#94A3B8', bg: 'rgba(148,163,184,0.05)', border: 'rgba(148,163,184,0.1)', label: 'Baixa', emoji: '⚪' },
}

const AREA_LABELS: Record<string, { label: string; icon: string }> = {
  landing_page: { label: 'Landing Page',   icon: '🖥️' },
  creative:     { label: 'Criativos',       icon: '🎨' },
  audience:     { label: 'Públicos',        icon: '👥' },
  funnel:       { label: 'Funil',          icon: '🔬' },
  bid:          { label: 'Lances',         icon: '💰' },
  budget:       { label: 'Orçamento',      icon: '📊' },
  copy:         { label: 'Copywriting',    icon: '✍️' },
}

const EFFORT_CONFIG = {
  baixo: { color: '#22C55E', label: 'Esforço baixo' },
  médio: { color: '#F0B429', label: 'Esforço médio' },
  alto:  { color: '#FF4D4D', label: 'Esforço alto' },
}

export function TabCRO() {
  const [cro, setCro] = useState<CROAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [source, setSource] = useState<'ai' | 'fallback' | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | CRORecommendation['priority']>('all')

  const clientData   = useAppStore(s => s.clientData)
  const auditCache   = useAppStore(s => s.auditCache)
  const funnelEntries = useAppStore(s => s.funnelEntries)

  async function runCROAnalysis() {
    if (!clientData) return
    setLoading(true)
    setCro(null)
    try {
      const latestAudit = clientData.clientName ? auditCache[clientData.clientName]?.[0] : null
      const realMetrics = latestAudit?.audit?._realMetrics ?? null
      const auditSections = latestAudit?.audit?.sections ?? null
      const clientFunnelData = funnelEntries.filter(f => f.clientName === clientData.clientName)

      const res = await fetch('/api/cro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientData,
          niche: clientData.niche,
          realMetrics,
          funnelData: clientFunnelData,
          auditSections,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setCro(data.cro)
      setSource(data.source)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const filtered = cro
    ? (filter === 'all' ? cro.recommendations : cro.recommendations.filter(r => r.priority === filter))
    : []

  const scoreColor = !cro ? '#64748B'
    : cro.score >= 80 ? '#22C55E'
    : cro.score >= 60 ? '#F0B429'
    : '#FF4D4D'

  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '20px' }}>⚙️</span>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>
              Otimização de Conversão
            </h2>
            <span style={{
              fontSize: '9px', fontFamily: 'var(--font-mono)', color: '#F0B429',
              background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.2)',
              borderRadius: '4px', padding: '2px 6px', letterSpacing: '0.06em',
            }}>IA</span>
          </div>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0, maxWidth: '500px' }}>
            Análise automatizada de otimização de conversão — identifica gargalos e sugere ações com impacto estimado no CPL.
          </p>
        </div>
        <button
          onClick={runCROAnalysis}
          disabled={loading || !clientData}
          style={{
            padding: '9px 20px', borderRadius: '9px', flexShrink: 0,
            background: loading ? 'rgba(240,180,41,0.1)' : 'rgba(240,180,41,0.12)',
            border: '1px solid rgba(240,180,41,0.3)', color: loading ? 'rgba(240,180,41,0.5)' : '#F0B429',
            fontSize: '13px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {loading ? '⏳ Analisando...' : cro ? '↻ Reanalisar' : '⚙️ Rodar análise CRO'}
        </button>
      </div>

      {/* No client */}
      {!clientData && (
        <div style={{
          padding: '40px 24px', textAlign: 'center',
          background: '#111114', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
            Selecione um cliente para rodar a análise CRO.
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{
          padding: '40px 24px', textAlign: 'center',
          background: '#111114', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚙️</div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
            Analisando funil de conversão...
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
            {auditCache[clientData?.clientName ?? '']
              ? 'Usando dados reais da auditoria Meta Ads'
              : 'Análise baseada nos dados cadastrados'}
          </div>
        </div>
      )}

      {/* Results */}
      {cro && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Score card */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '20px', alignItems: 'center',
            background: '#111114', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px', padding: '20px 24px',
          }}>
            {/* Score circle */}
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              border: `3px solid ${scoreColor}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: `${scoreColor}10`,
            }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{cro.score}</span>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>/100</span>
            </div>

            {/* Summary */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{
                  fontSize: '18px', fontWeight: 800, color: scoreColor,
                  fontFamily: 'var(--font-mono)',
                }}>
                  {cro.grade}
                </span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                  {cro.summary}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                🎯 Gargalo principal: <span style={{ color: '#F0B429' }}>{cro.bottleneck}</span>
              </div>
              {source === 'ai' && (
                <div style={{ fontSize: '10px', color: '#22C55E', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                  ✓ Análise gerada com Claude AI
                </div>
              )}
            </div>

            {/* CPL estimate */}
            {cro.estimatedCPLWithOptimization && clientData?.currentCPL && (
              <div style={{
                textAlign: 'center', padding: '12px 16px',
                background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)',
                borderRadius: '10px',
              }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>CPL após otimização</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#22C55E' }}>
                  R${cro.estimatedCPLWithOptimization}
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                  vs R${clientData.currentCPL} atual
                </div>
              </div>
            )}
          </div>

          {/* Quick wins */}
          {cro.quickWins.length > 0 && (
            <div style={{
              background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)',
              borderRadius: '12px', padding: '16px 20px',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#22C55E', marginBottom: '10px' }}>
                ⚡ Quick Wins — ações imediatas de alto impacto
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {cro.quickWins.map((win, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '11px', color: '#22C55E', flexShrink: 0, marginTop: '1px' }}>→</span>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>{win}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter */}
          {cro.recommendations.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Filtrar:</span>
              {(['all', 'urgent', 'high', 'medium', 'low'] as const).map(f => {
                const count = f === 'all' ? cro.recommendations.length : cro.recommendations.filter(r => r.priority === f).length
                if (count === 0 && f !== 'all') return null
                const cfg = f === 'all' ? null : PRIORITY_CONFIG[f]
                return (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '6px',
                    cursor: 'pointer', transition: 'all 0.15s',
                    border: filter === f
                      ? `1px solid ${cfg?.border ?? 'rgba(240,180,41,0.4)'}`
                      : '1px solid rgba(255,255,255,0.06)',
                    background: filter === f
                      ? (cfg?.bg ?? 'rgba(240,180,41,0.08)')
                      : 'transparent',
                    color: filter === f
                      ? (cfg?.color ?? '#F0B429')
                      : 'rgba(255,255,255,0.35)',
                  }}>
                    {f === 'all' ? `Todos (${count})` : `${cfg?.emoji} ${cfg?.label} (${count})`}
                  </button>
                )
              })}
            </div>
          )}

          {/* Recommendations */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map((rec, i) => {
              const cfg = PRIORITY_CONFIG[rec.priority]
              const areaCfg = AREA_LABELS[rec.area] ?? { label: rec.area, icon: '📌' }
              const effortCfg = EFFORT_CONFIG[rec.effort]
              const key = `${rec.area}-${i}`
              const isOpen = expanded === key

              return (
                <div key={key} style={{
                  background: '#111114', border: `1px solid ${isOpen ? cfg.border : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '10px', overflow: 'hidden',
                  transition: 'border-color 0.15s',
                }}>
                  {/* Header */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : key)}
                    style={{
                      width: '100%', padding: '14px 16px', display: 'flex',
                      alignItems: 'center', gap: '10px', background: 'transparent',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: '14px', flexShrink: 0 }}>{cfg.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '3px',
                      }}>
                        {rec.title}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '10px', color: cfg.color, background: cfg.bg,
                          border: `1px solid ${cfg.border}`, borderRadius: '4px', padding: '1px 6px',
                        }}>
                          {cfg.label}
                        </span>
                        <span style={{
                          fontSize: '10px', color: 'rgba(255,255,255,0.5)',
                          background: 'rgba(255,255,255,0.04)', borderRadius: '4px', padding: '1px 6px',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                          {areaCfg.icon} {areaCfg.label}
                        </span>
                        {rec.estimatedCPLReduction && (
                          <span style={{
                            fontSize: '10px', color: '#22C55E',
                            background: 'rgba(34,197,94,0.08)', borderRadius: '4px', padding: '1px 6px',
                            border: '1px solid rgba(34,197,94,0.15)',
                          }}>
                            −{rec.estimatedCPLReduction}% CPL
                          </span>
                        )}
                        <span style={{
                          fontSize: '10px', color: effortCfg.color,
                          background: 'transparent', borderRadius: '4px', padding: '1px 6px',
                          border: `1px solid ${effortCfg.color}30`,
                        }}>
                          {effortCfg.label}
                        </span>
                        <span style={{
                          fontSize: '10px', color: 'rgba(255,255,255,0.3)',
                          padding: '1px 4px',
                        }}>
                          ⏱ {rec.timeframe}
                        </span>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '10px', color: 'rgba(255,255,255,0.3)',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s', flexShrink: 0,
                    }}>▾</span>
                  </button>

                  {/* Expanded body */}
                  {isOpen && (
                    <div style={{
                      padding: '0 16px 16px',
                      borderTop: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      <div style={{ paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: '#FF4D4D', marginBottom: '4px', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>PROBLEMA</div>
                          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.5' }}>{rec.problem}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: '#22C55E', marginBottom: '4px', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>SOLUÇÃO</div>
                          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>{rec.solution}</div>
                        </div>
                        <div style={{
                          padding: '10px 12px',
                          background: 'rgba(240,180,41,0.05)', border: '1px solid rgba(240,180,41,0.15)',
                          borderRadius: '8px',
                        }}>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: '#F0B429', marginBottom: '3px', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>IMPACTO ESPERADO</div>
                          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>{rec.expectedImpact}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
              Nenhuma recomendação nesta categoria.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
