// components/dashboard/TabChannelMix.tsx — Channel Mix Agent (AGENT.md)
'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import type { ChannelMixResult, ChannelRecommendation } from '@/app/api/channel-mix/route'
import { SimpleSourceBadge } from './DataSourceBadge'

const PRIORITY_CONFIG = {
  primary:   { label: 'Principal',   color: '#F0B429', bg: 'rgba(240,180,41,0.10)', border: 'rgba(240,180,41,0.25)' },
  secondary: { label: 'Secundário',  color: '#38BDF8', bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.2)' },
  test:      { label: 'Testar',      color: '#A78BFA', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)' },
  avoid:     { label: 'Evitar',      color: '#64748B', bg: 'rgba(100,116,139,0.06)', border: 'rgba(100,116,139,0.15)' },
}

function FitBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: '10px', fontWeight: 700, color, minWidth: '24px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{value}</span>
    </div>
  )
}

function AllocationDonut({ channels }: { channels: ChannelRecommendation[] }) {
  const total = channels.reduce((s, c) => s + c.allocationPct, 0)
  const COLORS = ['#F0B429', '#38BDF8', '#A78BFA', '#22C55E', '#FF4D4D', '#FB923C']

  let cumulative = 0
  const segments = channels.map((ch, i) => {
    const pct = (ch.allocationPct / Math.max(total, 1)) * 100
    const start = cumulative
    cumulative += pct
    return { ...ch, pct, start, color: COLORS[i % COLORS.length] }
  })

  const r = 40
  const cx = 56
  const cy = 56
  const circumference = 2 * Math.PI * r

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <svg width="112" height="112" style={{ flexShrink: 0 }}>
        {/* Background circle */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="14" />
        {segments.map((seg, i) => {
          const dashArray = (seg.pct / 100) * circumference
          const dashOffset = circumference - (seg.start / 100) * circumference
          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="14"
              strokeDasharray={`${dashArray} ${circumference - dashArray}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="butt"
              style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px`, transition: 'stroke-dasharray 0.5s ease' }}
            />
          )
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="11" fontWeight="700">Mix</text>
        <text x={cx} y={cx + 8} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9">{channels.length} canais</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: seg.color, flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', minWidth: '110px' }}>{seg.name}</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: seg.color, fontFamily: 'var(--font-mono)' }}>{seg.allocationPct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TabChannelMix() {
  const [mix, setMix] = useState<ChannelMixResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [source, setSource] = useState<'ai' | 'fallback' | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [customBudget, setCustomBudget] = useState('')

  const clientData = useAppStore(s => s.clientData)
  const auditCache = useAppStore(s => s.auditCache)

  async function runAnalysis() {
    if (!clientData) return
    setLoading(true)
    setMix(null)
    try {
      const latestAudit = clientData.clientName ? auditCache[clientData.clientName]?.[0] : null
      const realMetrics = latestAudit?.audit?._realMetrics ?? null
      const budget = Number(customBudget) || clientData.budget || 0

      const res = await fetch('/api/channel-mix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: clientData.niche,
          budget,
          objective: clientData.objective,
          clientData,
          realMetrics,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setMix(data.mix)
      setSource(data.source)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const budget = Number(customBudget) || clientData?.budget || 0

  return (
    <div style={{ padding: '24px', maxWidth: '920px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '20px' }}>🌐</span>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Channel Mix Agent</h2>
            <span style={{
              fontSize: '9px', fontFamily: 'var(--font-mono)', color: '#F0B429',
              background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.2)',
              borderRadius: '4px', padding: '2px 6px', letterSpacing: '0.06em',
            }}>IA</span>
          </div>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0, maxWidth: '500px' }}>
            Recomendação do mix ideal de canais para o seu nicho, budget e objetivo — com alocação % e CPL esperado por canal.
          </p>
          {source && (
            <div style={{ marginTop: '8px' }}>
              <SimpleSourceBadge type={source === 'ai' ? 'real' : 'fallback'} />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>Budget mensal (R$)</div>
            <input
              type="number"
              value={customBudget}
              onChange={e => setCustomBudget(e.target.value)}
              placeholder={clientData?.budget ? String(clientData.budget) : 'Ex: 5000'}
              style={{
                width: '130px', padding: '7px 10px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontSize: '13px', fontWeight: 600, outline: 'none',
              }}
            />
          </div>
          <button
            onClick={runAnalysis}
            disabled={loading || !clientData || budget <= 0}
            style={{
              padding: '9px 20px', borderRadius: '9px', marginTop: '16px',
              background: (clientData && budget > 0) ? 'rgba(240,180,41,0.12)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${(clientData && budget > 0) ? 'rgba(240,180,41,0.3)' : 'rgba(255,255,255,0.06)'}`,
              color: (clientData && budget > 0) ? '#F0B429' : 'rgba(255,255,255,0.2)',
              fontSize: '13px', fontWeight: 600,
              cursor: (clientData && budget > 0 && !loading) ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
            }}
          >
            {loading ? '⏳ Analisando...' : mix ? '↻ Reanalisar' : '🌐 Analisar mix'}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {!clientData && (
        <div style={{ padding: '40px 24px', textAlign: 'center', background: '#111114', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🌐</div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>Selecione um cliente para ver a recomendação de canais.</div>
        </div>
      )}

      {clientData && !mix && !loading && (
        <div style={{ padding: '40px 24px', textAlign: 'center', background: '#111114', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🌐</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>
            Mix de canais para {clientData.niche}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '16px', maxWidth: '360px', margin: '0 auto 16px' }}>
            {budget > 0
              ? `Pronto para analisar. Budget: R$${budget.toLocaleString('pt-BR')}/mês.`
              : 'Insira o orçamento mensal acima e clique em "Analisar mix".'}
          </div>
        </div>
      )}

      {loading && (
        <div style={{ padding: '40px 24px', textAlign: 'center', background: '#111114', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🌐</div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Calculando mix ideal para {clientData?.niche}...</div>
        </div>
      )}

      {/* Results */}
      {mix && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Strategy banner */}
          <div style={{
            padding: '16px 20px',
            background: 'rgba(240,180,41,0.04)', border: '1px solid rgba(240,180,41,0.15)', borderRadius: '12px',
            display: 'flex', gap: '14px', alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>💡</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#F0B429', marginBottom: '6px' }}>Estratégia de mix recomendada</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.55' }}>{mix.strategy}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '6px', fontStyle: 'italic' }}>{mix.maturityNote}</div>
              {source === 'ai' && (
                <div style={{ fontSize: '10px', color: '#22C55E', marginTop: '5px', fontFamily: 'var(--font-mono)' }}>✓ Análise com Claude AI</div>
              )}
            </div>
          </div>

          {/* Overview: donut + summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '16px', alignItems: 'start' }}>
            <div style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px 24px' }}>
              <AllocationDonut channels={mix.recommendedChannels} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { label: 'Canal principal', value: mix.primaryChannel, color: '#F0B429' },
                { label: 'Canais recomendados', value: `${mix.recommendedChannels.length} canais`, color: '#38BDF8' },
                { label: 'Leads projetados/mês', value: mix.projectedTotalLeads > 0 ? mix.projectedTotalLeads : '—', color: '#22C55E' },
                { label: 'CPL médio projetado', value: mix.projectedAvgCPL > 0 ? `R$${mix.projectedAvgCPL}` : '—', color: '#A78BFA' },
              ].map((card, i) => (
                <div key={i} style={{ padding: '14px 16px', background: '#111114', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginBottom: '5px' }}>{card.label}</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: card.color }}>{card.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Channel cards */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: '10px', letterSpacing: '0.05em' }}>
              CANAIS RECOMENDADOS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {mix.recommendedChannels.map((ch) => {
                const pCfg = PRIORITY_CONFIG[ch.priority]
                const isOpen = expanded === ch.channel
                return (
                  <div key={ch.channel} style={{
                    background: '#111114',
                    border: `1px solid ${isOpen ? pCfg.border : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '10px', overflow: 'hidden', transition: 'border-color 0.15s',
                  }}>
                    {/* Row */}
                    <button
                      onClick={() => setExpanded(isOpen ? null : ch.channel)}
                      style={{
                        width: '100%', display: 'grid',
                        gridTemplateColumns: '36px 1fr 100px 80px 80px 90px 24px',
                        gap: '12px', alignItems: 'center',
                        padding: '14px 16px', background: 'transparent',
                        border: 'none', cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      {/* Icon */}
                      <div style={{ fontSize: '20px', textAlign: 'center' }}>{ch.icon}</div>

                      {/* Name + fit */}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>{ch.name}</div>
                        <FitBar value={ch.fit} color={pCfg.color} />
                      </div>

                      {/* Allocation */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: pCfg.color }}>{ch.allocationPct}%</div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>R${ch.allocationBRL.toLocaleString('pt-BR')}/mês</div>
                      </div>

                      {/* Expected CPL */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '1px' }}>CPL esperado</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: ch.expectedCPL ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                          {ch.expectedCPL ? `R$${ch.expectedCPL}` : '—'}
                        </div>
                      </div>

                      {/* Leads */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '1px' }}>Leads/mês</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: ch.expectedLeadsPerMonth ? '#22C55E' : 'rgba(255,255,255,0.3)' }}>
                          {ch.expectedLeadsPerMonth ?? '—'}
                        </div>
                      </div>

                      {/* Priority badge */}
                      <div>
                        <span style={{
                          fontSize: '10px', fontWeight: 700,
                          color: pCfg.color, background: pCfg.bg, border: `1px solid ${pCfg.border}`,
                          borderRadius: '5px', padding: '3px 8px', whiteSpace: 'nowrap',
                        }}>
                          {pCfg.label}
                        </span>
                      </div>

                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</span>
                    </button>

                    {/* Expanded */}
                    {isOpen && (
                      <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ paddingTop: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                          {/* Strengths */}
                          <div>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#22C55E', marginBottom: '6px', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>PONTOS FORTES</div>
                            {ch.strengths.map((s, i) => (
                              <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                                <span style={{ color: '#22C55E', fontSize: '11px', flexShrink: 0 }}>+</span>
                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.4' }}>{s}</span>
                              </div>
                            ))}
                          </div>

                          {/* Weaknesses */}
                          <div>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#FF4D4D', marginBottom: '6px', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>LIMITAÇÕES</div>
                            {ch.weaknesses.map((w, i) => (
                              <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                                <span style={{ color: '#FF4D4D', fontSize: '11px', flexShrink: 0 }}>−</span>
                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.4' }}>{w}</span>
                              </div>
                            ))}
                          </div>

                          {/* Setup */}
                          <div>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#F0B429', marginBottom: '6px', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>COMO CONFIGURAR</div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.5', marginBottom: '8px' }}>{ch.setup}</div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                              <span style={{ color: '#38BDF8' }}>Melhor para:</span> {ch.bestFor}
                            </div>
                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                              ⏱ Resultados em: {ch.timeToResults}
                            </div>
                            {ch.minBudget > budget && (
                              <div style={{
                                marginTop: '8px', padding: '6px 10px', borderRadius: '6px',
                                background: 'rgba(255,77,77,0.06)', border: '1px solid rgba(255,77,77,0.15)',
                                fontSize: '10px', color: '#FF4D4D',
                              }}>
                                ⚠️ Budget mínimo recomendado: R${ch.minBudget.toLocaleString('pt-BR')}/mês
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Avoid channels */}
          {mix.avoidChannels.length > 0 && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: '10px', letterSpacing: '0.05em' }}>
                NÃO RECOMENDADOS AGORA
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {mix.avoidChannels.map(ch => (
                  <div key={ch.channel} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                    opacity: 0.55,
                  }}>
                    <span style={{ fontSize: '14px' }}>{ch.icon}</span>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{ch.name}</span>
                    {ch.minBudget > budget && (
                      <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>
                        (mín. R${ch.minBudget.toLocaleString('pt-BR')})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
