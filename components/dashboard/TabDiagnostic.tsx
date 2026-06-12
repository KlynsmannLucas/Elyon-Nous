// components/dashboard/TabDiagnostic.tsx — Diagnóstico estratégico do negócio (saúde financeira, riscos, escala)
'use client'

import { useState } from 'react'
import { getBenchmark } from '@/lib/niche_benchmarks'
import { useAppStore } from '@/lib/store'
import { useViewMode, TAB_HEADINGS_SIMPLE } from '@/lib/viewMode'
import type { ClientData } from '@/lib/store'

const C = {
  bg:          '#F4F5F7',
  surface:     '#FFFFFF',
  elevated:    '#FBFCFD',
  border:      'rgba(99,120,255,0.1)',
  borderHover: 'rgba(124,58,237,0.25)',
  purple:      '#2C5FE0',
  purpleL:     '#2C5FE0',
  purpleXL:    '#C4B5FD',
  green:       '#0E9E6E',
  greenBg:     'rgba(34,197,94,0.1)',
  red:         '#E1483F',
  redBg:       'rgba(239,68,68,0.1)',
  blue:        '#2C5FE0',
  blueBg:      'rgba(56,189,248,0.1)',
  gold:        '#E08B0B',
  goldBg:      'rgba(245,158,11,0.1)',
  orange:      '#F97316',
  text1:       '#161B26',
  text2:       'rgba(255,255,255,0.5)',
  text3:       'rgba(255,255,255,0.25)',
}

interface Props {
  clientData: ClientData | null
  strategy: Record<string, any>
  analysis: Record<string, any>
}

function RiskBadge({ level }: { level: string }) {
  const map: Record<string, { label: string; color: string; bg: string; border: string }> = {
    critico:  { label: 'CRÍTICO',  color: C.red,    bg: C.redBg,            border: 'rgba(239,68,68,0.3)' },
    alto:     { label: 'ALTO',     color: C.orange, bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)' },
    medio:    { label: 'MÉDIO',    color: C.gold,   bg: C.goldBg,           border: 'rgba(245,158,11,0.3)' },
    baixo:    { label: 'BAIXO',    color: C.green,  bg: C.greenBg,          border: 'rgba(34,197,94,0.3)' },
    alta:     { label: 'ALTA',     color: C.red,    bg: C.redBg,            border: 'rgba(239,68,68,0.3)' },
    media:    { label: 'MÉDIA',    color: C.gold,   bg: C.goldBg,           border: 'rgba(245,158,11,0.3)' },
  }
  const s = map[level?.toLowerCase()] || map.medio
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
      textTransform: 'uppercase', letterSpacing: '0.06em',
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
    }}>
      {s.label}
    </span>
  )
}

function StatusDot({ status }: { status: string }) {
  const c = status === 'saudavel' ? C.green : status === 'problema' ? C.red : C.text3
  const label = status === 'saudavel' ? 'Saudável' : status === 'problema' ? 'Problema' : 'Não auditado'
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: c }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c, flexShrink: 0, display: 'inline-block' }} />
      {label}
    </span>
  )
}

function MetricCard({ label, value, sub, color, tip }: { label: string; value: string; sub?: string; color: string; tip?: string }) {
  return (
    <div style={{
      background: C.elevated,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: '16px 18px',
    }}>
      <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{sub}</div>}
      {tip && <div style={{ fontSize: 10, color: C.text3, marginTop: 4, fontStyle: 'italic', opacity: 0.7 }}>{tip}</div>}
    </div>
  )
}

function ScoreRing({ score, grade, color }: { score: number; grade: string; color: string }) {
  const r = 54
  const circ = 2 * Math.PI * r
  const pct  = Math.max(0, Math.min(score, 100)) / 100
  const dash = pct * circ
  const gap  = circ - dash

  const label =
    score >= 80 ? 'Excelente' :
    score >= 65 ? 'Bom' :
    score >= 50 ? 'Regular' :
    score >= 35 ? 'Atenção' : 'Crítico'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 128, height: 128 }}>
        <svg width="128" height="128" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="64" cy="64" r={r} fill="none" stroke={C.elevated} strokeWidth="10" />
          <circle cx="64" cy="64" r={r} fill="none"
            stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
            style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)', filter: `drop-shadow(0 0 6px ${color}60)` }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color, fontSize: 30, fontWeight: 800, lineHeight: 1 }}>{grade}</span>
          <span style={{ color: C.text3, fontSize: 10, marginTop: 2 }}>{score}/100</span>
        </div>
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, marginTop: 8, color }}>{label}</span>
    </div>
  )
}

export function TabDiagnostic({ clientData, strategy, analysis }: Props) {
  const { mode: viewMode } = useViewMode()
  const dHeading = viewMode === 'simple' ? TAB_HEADINGS_SIMPLE.diagnostic : null
  const { campaignHistory, auditCache } = useAppStore()
  const [diagnostic,         setDiagnostic]         = useState<Record<string, any> | null>(null)
  const [loading,            setLoading]             = useState(false)
  const [error,              setError]               = useState('')
  const [showInterpretacao,  setShowInterpretacao]   = useState(false)
  const [expandedRisk,       setExpandedRisk]        = useState<number | null>(null)
  const [showRecoDesc,       setShowRecoDesc]        = useState(false)
  const [showQuandoEscalar,  setShowQuandoEscalar]   = useState(false)
  const [showFullSummary,    setShowFullSummary]     = useState(false)

  const bench = getBenchmark(clientData?.niche || '')

  const clientAudits = auditCache[clientData?.clientName || ''] || []
  const lastAudit = clientAudits[0]?.audit
  const auditRealMetrics = lastAudit?._realMetrics || null

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
          budget: clientData?.budget,
          monthlyRevenue: clientData?.monthlyRevenue,
          ticketPrice: clientData?.ticketPrice,
          grossMargin: clientData?.grossMargin,
          conversionRate: clientData?.conversionRate,
          isRecurring: clientData?.isRecurring,
          currentCPL: clientData?.currentCPL,
          mainChallenge: clientData?.mainChallenge,
          currentLeadSource: clientData?.currentLeadSource,
          campaignHistory: campaignHistory.slice(0, 12),
          auditRealMetrics,
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
    'A+': C.green, A: C.green, 'A-': C.green,
    'B+': C.gold,  B: C.gold,  'B-': C.gold,
    'C+': C.orange, C: C.orange, D: C.red,
  }

  const sustColor: Record<string, string> = {
    sustentavel: C.green,
    fragil: C.gold,
    insustentavel: C.red,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text1, margin: 0, marginBottom: 6 }}>
            {dHeading?.title ?? 'Diagnóstico Estratégico do Negócio'}
          </h2>
          <p style={{ fontSize: 13, color: C.text2, margin: 0 }}>
            {dHeading?.subtitle ?? (
              <>Saúde financeira, viabilidade de escala, riscos críticos e recomendação prioritária.
              <span style={{ color: C.text3 }}> · Distinto da Auditoria (que analisa campanhas).</span></>
            )}
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading || !clientData}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 12,
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            background: 'linear-gradient(135deg, #E08B0B, #FBBF24)',
            color: '#000', border: 'none',
            opacity: (loading || !clientData) ? 0.5 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          {loading ? 'Diagnosticando...' : 'Gerar Diagnóstico'}
        </button>
      </div>

      {/* Contexto de dados disponíveis */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        {[
          { label: 'Budget configurado', value: clientData?.budget ? `R$${clientData.budget.toLocaleString('pt-BR')}` : '—', ok: !!clientData?.budget },
          { label: 'Ticket médio', value: clientData?.ticketPrice ? `R$${clientData.ticketPrice.toLocaleString('pt-BR')}` : '—', ok: !!clientData?.ticketPrice },
          { label: 'Histórico de campanhas', value: `${campaignHistory.length} períodos`, ok: campaignHistory.length >= 2 },
          { label: 'Última auditoria', value: lastAudit ? 'Disponível' : 'Sem dados', ok: !!lastAudit },
        ].map((item) => (
          <div key={item.label} style={{
            background: C.surface,
            border: `1px solid ${item.ok ? 'rgba(34,197,94,0.2)' : C.border}`,
            borderRadius: 12, padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: item.ok ? C.greenBg : 'rgba(255,255,255,0.04)',
              color: item.ok ? C.green : C.text3, fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>
              {item.ok ? '✓' : '○'}
            </span>
            <div>
              <div style={{ fontSize: 10, color: C.text3, marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text1 }}>{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{
          background: C.redBg, border: `1px solid rgba(239,68,68,0.3)`,
          borderRadius: 12, padding: '12px 16px', fontSize: 13, color: C.red,
        }}>
          {error}
        </div>
      )}

      {/* Resultado */}
      {diagnostic && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Score + Grade + Summary */}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 16, padding: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 28, flexWrap: 'wrap' }}>
              <ScoreRing
                score={diagnostic.health_score}
                grade={diagnostic.grade}
                color={gradeColor[diagnostic.grade] || C.gold}
              />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                  Saúde Estratégica do Negócio
                </div>
                {diagnostic.saude_financeira?.sustentabilidade && (
                  <span style={{
                    display: 'inline-block', marginBottom: 14,
                    padding: '4px 12px', borderRadius: 99,
                    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                    color: sustColor[diagnostic.saude_financeira.sustentabilidade] || C.gold,
                    background: `${sustColor[diagnostic.saude_financeira.sustentabilidade] || C.gold}18`,
                    border: `1px solid ${sustColor[diagnostic.saude_financeira.sustentabilidade] || C.gold}40`,
                  }}>
                    {diagnostic.saude_financeira.sustentabilidade}
                  </span>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Saúde Financeira', v: diagnostic.health_score },
                    { label: 'Viabilidade de Escala', v: Math.max(20, diagnostic.health_score - 8) },
                    { label: 'Risco Operacional', v: Math.min(100, 100 - (diagnostic.risk_matrix?.length ?? 0) * 12) },
                  ].map(({ label, v }) => {
                    const barColor = v >= 70 ? C.green : v >= 45 ? C.gold : C.red
                    return (
                      <div key={label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.text3, marginBottom: 4 }}>
                          <span>{label}</span><span style={{ color: barColor }}>{v}%</span>
                        </div>
                        <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 99,
                            width: `${v}%`,
                            background: barColor,
                            boxShadow: `0 0 6px ${barColor}60`,
                            transition: 'width 1.2s cubic-bezier(.4,0,.2,1)',
                          }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ marginTop: 16 }}>
                  <p style={{
                    fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0,
                    display: showFullSummary ? 'block' : '-webkit-box',
                    WebkitLineClamp: showFullSummary ? undefined : 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: showFullSummary ? 'visible' : 'hidden',
                  } as React.CSSProperties}>
                    {diagnostic.executive_summary}
                  </p>
                  {(diagnostic.executive_summary?.length ?? 0) > 180 && (
                    <button onClick={() => setShowFullSummary(v => !v)} style={{
                      marginTop: 6, fontSize: 11, color: C.text3, background: 'none',
                      border: 'none', cursor: 'pointer', padding: 0,
                    }}>
                      {showFullSummary ? '▲ ver menos' : '▼ ver mais'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Saúde Financeira */}
          {diagnostic.saude_financeira && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: C.goldBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={C.gold}>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93V18h-2v1.93C7.06 19.44 4.56 16.94 4.07 14H6v-2H4.07C4.56 9.06 7.06 6.56 10 6.07V8h2V6.07C16.94 6.56 19.44 9.06 19.93 12H18v2h1.93c-.49 2.94-2.99 5.44-5.93 5.93z"/>
                  </svg>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text1 }}>Unit Economics & Saúde Financeira</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 12 }}>
                <MetricCard
                  label="ROAS Break-even"
                  value={`${diagnostic.saude_financeira.break_even_roas}×`}
                  sub="ROAS mínimo para não ter prejuízo"
                  color={C.gold}
                  tip="Abaixo disso = prejuízo"
                />
                <MetricCard
                  label="CPL Máximo Lucrativo"
                  value={`R$${diagnostic.saude_financeira.cpl_maximo_lucrativo}`}
                  sub="Acima disso = gasta mais do que ganha"
                  color={C.red}
                  tip="Piso de pausa de campanhas"
                />
                <MetricCard
                  label="LTV Estimado"
                  value={`R$${(diagnostic.saude_financeira.ltv_estimado || 0).toLocaleString('pt-BR')}`}
                  sub="Valor vitalício do cliente"
                  color={C.green}
                />
                <MetricCard
                  label="LTV:CAC"
                  value={`${diagnostic.saude_financeira.ltv_cac_ratio}×`}
                  sub="Mínimo saudável = 3×"
                  color={diagnostic.saude_financeira.ltv_cac_ratio >= 3 ? C.green : diagnostic.saude_financeira.ltv_cac_ratio >= 1.5 ? C.gold : C.red}
                  tip={diagnostic.saude_financeira.ltv_cac_ratio >= 3 ? 'Modelo saudável para escalar' : 'Otimizar antes de escalar'}
                />
                <MetricCard
                  label="CAC Payback"
                  value={`${diagnostic.saude_financeira.cac_payback_meses} ${diagnostic.saude_financeira.cac_payback_meses === 1 ? 'mês' : 'meses'}`}
                  sub="Tempo para recuperar custo"
                  color={diagnostic.saude_financeira.cac_payback_meses <= 3 ? C.green : diagnostic.saude_financeira.cac_payback_meses <= 6 ? C.gold : C.red}
                />
                {diagnostic.prontidao_para_escalar?.projecao_escala?.receita_projetada > 0 && (
                  <MetricCard
                    label="Receita com Budget 2×"
                    value={`R$${(diagnostic.prontidao_para_escalar.projecao_escala.receita_projetada || 0).toLocaleString('pt-BR')}`}
                    sub="Projeção ao dobrar investimento"
                    color={C.purpleL}
                  />
                )}
              </div>
              <button onClick={() => setShowInterpretacao(v => !v)} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 12,
                padding: '10px 16px', cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{ fontSize: 11, color: C.text2, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill={C.text2}>
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                  </svg>
                  Interpretação
                </span>
                <span style={{ fontSize: 10, color: C.text3 }}>{showInterpretacao ? '▲ ocultar' : '▼ ver análise'}</span>
              </button>
              {showInterpretacao && (
                <div style={{
                  background: C.elevated, border: `1px solid ${C.border}`,
                  borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '12px 16px',
                }}>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0 }}>
                    {diagnostic.saude_financeira.interpretacao}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Matriz de Risco */}
          {diagnostic.matriz_risco?.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: C.redBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill={C.red}>
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                  </svg>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text1 }}>Matriz de Risco</span>
                <span style={{ fontSize: 11, color: C.text3, marginLeft: 2 }}>ranqueada por impacto</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {diagnostic.matriz_risco.map((r: any, i: number) => {
                  const riskColor = r.impacto === 'critico' ? C.red : r.impacto === 'alto' ? C.orange : C.gold
                  const isOpen = expandedRisk === i
                  return (
                    <div key={i} style={{
                      background: C.surface, border: `1px solid ${isOpen ? riskColor + '40' : C.border}`,
                      borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s',
                    }}>
                      <button onClick={() => setExpandedRisk(isOpen ? null : i)} style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                      }}>
                        <span style={{
                          width: 26, height: 26, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 800, flexShrink: 0,
                          background: `${riskColor}18`, color: riskColor,
                        }}>
                          {i + 1}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.text1, flex: 1 }}>{r.risco}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          <RiskBadge level={r.probabilidade} />
                          <RiskBadge level={r.impacto} />
                          <span style={{ color: C.text3, fontSize: 10, marginLeft: 4 }}>{isOpen ? '▲' : '▼'}</span>
                        </div>
                      </button>
                      {isOpen && (
                        <div style={{
                          padding: '10px 16px 14px',
                          borderTop: `1px solid rgba(99,120,255,0.08)`,
                          display: 'flex', alignItems: 'flex-start', gap: 8,
                        }}>
                          <span style={{ color: C.green, fontSize: 12, marginTop: 1, flexShrink: 0 }}>→</span>
                          <span style={{ fontSize: 12, color: C.text2, lineHeight: 1.6 }}>{r.mitigacao}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Prontidão para Escalar */}
          {diagnostic.prontidao_para_escalar && (
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: C.blueBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill={C.blue}>
                      <path d="M12 2.5c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm-1 14.5v-5.5l4.5 2.75L11 17z"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text1 }}>Prontidão para Escalar</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 80, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 99,
                        width: `${diagnostic.prontidao_para_escalar.score}%`,
                        background: diagnostic.prontidao_para_escalar.pode_escalar_agora ? C.green : C.gold,
                        transition: 'width 1s ease',
                      }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: diagnostic.prontidao_para_escalar.pode_escalar_agora ? C.green : C.gold }}>
                      {diagnostic.prontidao_para_escalar.score}/100
                    </span>
                  </div>
                  <span style={{
                    padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                    color: diagnostic.prontidao_para_escalar.pode_escalar_agora ? C.green : C.gold,
                    background: diagnostic.prontidao_para_escalar.pode_escalar_agora ? C.greenBg : C.goldBg,
                    border: `1px solid ${diagnostic.prontidao_para_escalar.pode_escalar_agora ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
                  }}>
                    {diagnostic.prontidao_para_escalar.pode_escalar_agora ? '✓ Pode escalar' : '⚠ Não escalar ainda'}
                  </span>
                </div>
              </div>

              {diagnostic.prontidao_para_escalar.prerequisitos_faltando?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    Pré-requisitos faltando antes de escalar:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {diagnostic.prontidao_para_escalar.prerequisitos_faltando.map((p: string, i: number) => (
                      <span key={i} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 11, padding: '4px 10px', borderRadius: 99,
                        background: C.redBg, color: C.red, border: '1px solid rgba(239,68,68,0.25)',
                      }}>
                        ✕ {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={() => setShowQuandoEscalar(v => !v)} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10,
                padding: '10px 14px', cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{ fontSize: 10, color: C.text2, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill={C.text2}>
                    <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>
                  </svg>
                  Quando e como escalar
                </span>
                <span style={{ fontSize: 10, color: C.text3 }}>{showQuandoEscalar ? '▲' : '▼ ver'}</span>
              </button>
              {showQuandoEscalar && (
                <div style={{
                  background: C.elevated, border: `1px solid ${C.border}`,
                  borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '12px 14px',
                }}>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.6 }}>
                    {diagnostic.prontidao_para_escalar.quando_escalar}
                  </p>
                </div>
              )}

              {diagnostic.prontidao_para_escalar.projecao_escala && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 14 }}>
                  {[
                    { label: 'Budget 2×', value: `R$${(diagnostic.prontidao_para_escalar.projecao_escala.budget_2x || 0).toLocaleString('pt-BR')}`, color: C.blue },
                    { label: 'Leads proj.', value: (diagnostic.prontidao_para_escalar.projecao_escala.leads_projetados || 0).toLocaleString('pt-BR'), color: C.purpleL },
                    { label: 'Receita proj.', value: `R$${(diagnostic.prontidao_para_escalar.projecao_escala.receita_projetada || 0).toLocaleString('pt-BR')}`, color: C.green },
                  ].map((m) => (
                    <div key={m.label} style={{
                      background: C.elevated, border: `1px solid ${C.border}`,
                      borderRadius: 10, padding: 12, textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 10, color: C.text3, marginBottom: 4 }}>{m.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: m.color }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Diagnóstico do Funil */}
          {diagnostic.diagnostico_funil && (
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: C.blueBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill={C.blue}>
                    <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
                  </svg>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text1 }}>Diagnóstico do Funil</span>
                <span style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 99, marginLeft: 4,
                  color: diagnostic.diagnostico_funil.gargalo_principal === 'trafego' ? C.red : C.gold,
                  background: diagnostic.diagnostico_funil.gargalo_principal === 'trafego' ? C.redBg : C.goldBg,
                  border: `1px solid ${diagnostic.diagnostico_funil.gargalo_principal === 'trafego' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`,
                }}>
                  Gargalo: {diagnostic.diagnostico_funil.gargalo_principal}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                {diagnostic.diagnostico_funil.etapas?.map((e: any, i: number) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    padding: '10px 14px', background: C.elevated, borderRadius: 10,
                    borderBottom: `1px solid rgba(99,120,255,0.08)`,
                  }}>
                    <span style={{ fontSize: 13, color: C.text1, fontWeight: 500, flex: 1, minWidth: 0 }}>{e.etapa}</span>
                    <span style={{ fontSize: 11, color: C.text3, flex: 1, display: 'none' }}>{e.observacao}</span>
                    <StatusDot status={e.status} />
                  </div>
                ))}
              </div>
              {diagnostic.diagnostico_funil.impacto_financeiro && (
                <div style={{ background: C.elevated, borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    Impacto Financeiro
                  </div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.6 }}>
                    {diagnostic.diagnostico_funil.impacto_financeiro}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Recomendação Principal */}
          {diagnostic.recomendacao_principal && (
            <div style={{
              background: `linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(124,58,237,0.06) 100%)`,
              border: `1px solid rgba(245,158,11,0.25)`,
              borderRadius: 16, padding: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: C.goldBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill={C.gold}>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                  </svg>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text1 }}>Recomendação Principal</span>
                <span style={{ fontSize: 11, color: C.text3 }}>uma ação que muda tudo</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.gold }}>{diagnostic.recomendacao_principal.titulo}</div>
                <button onClick={() => setShowRecoDesc(v => !v)} style={{
                  fontSize: 11, color: C.text2, background: 'none',
                  border: `1px solid ${C.border}`, borderRadius: 8,
                  padding: '4px 10px', cursor: 'pointer',
                }}>
                  {showRecoDesc ? '▲ ocultar' : '▼ ver detalhe'}
                </button>
              </div>
              {showRecoDesc && (
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 14, marginTop: 0 }}>
                  {diagnostic.recomendacao_principal.descricao}
                </p>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                {[
                  { label: 'Esta semana', text: diagnostic.recomendacao_principal.acao_semana_1, color: C.red, bg: C.redBg, border: 'rgba(239,68,68,0.2)' },
                  { label: 'Mês 1', text: diagnostic.recomendacao_principal.acao_mes_1, color: C.gold, bg: C.goldBg, border: 'rgba(245,158,11,0.2)' },
                  { label: 'Trimestre', text: diagnostic.recomendacao_principal.acao_trimestre, color: C.green, bg: C.greenBg, border: 'rgba(34,197,94,0.2)' },
                ].map((a) => (
                  <div key={a.label} style={{
                    background: a.bg, border: `1px solid ${a.border}`,
                    borderRadius: 10, padding: 12,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: a.color, marginBottom: 6 }}>{a.label}</div>
                    <p style={{ fontSize: 12, color: C.text2, lineHeight: 1.5, margin: 0 }}>{a.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Benchmark do nicho */}
          {diagnostic.benchmark_comparativo && (
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: 'rgba(167,139,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill={C.purpleL}>
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                  </svg>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text1 }}>
                  Benchmark do Nicho — {clientData?.niche}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'CPL atual', value: diagnostic.benchmark_comparativo.cpl_atual > 0 ? `R$${diagnostic.benchmark_comparativo.cpl_atual}` : '—', color: C.blue },
                  { label: 'CPL benchmark', value: `R$${diagnostic.benchmark_comparativo.cpl_benchmark}`, color: C.gold },
                  { label: 'ROAS break-even', value: `${diagnostic.benchmark_comparativo.roas_break_even}×`, color: C.purpleL },
                  { label: 'ROAS bom (nicho)', value: `${diagnostic.benchmark_comparativo.roas_bom_nicho}×`, color: C.green },
                ].map((m) => (
                  <div key={m.label} style={{
                    textAlign: 'center', padding: '12px 10px',
                    background: C.elevated, borderRadius: 10,
                    border: `1px solid ${C.border}`,
                  }}>
                    <div style={{ fontSize: 10, color: C.text3, marginBottom: 6 }}>{m.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>
              {diagnostic.benchmark_comparativo.melhores_canais?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    Melhores canais para o nicho
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {diagnostic.benchmark_comparativo.melhores_canais.map((canal: string, i: number) => (
                      <span key={i} style={{
                        padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                        background: 'rgba(167,139,250,0.1)', color: C.purpleL,
                        border: '1px solid rgba(167,139,250,0.25)',
                      }}>
                        {i === 0 ? '★ ' : ''}{canal}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {diagnostic.benchmark_comparativo.insights_nicho?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {diagnostic.benchmark_comparativo.insights_nicho.map((ins: string, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: C.text2 }}>
                      <span style={{ color: C.gold, marginTop: 1, flexShrink: 0 }}>→</span>
                      {ins}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Estado vazio */}
      {!diagnostic && !loading && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '60px 20px', textAlign: 'center',
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, marginBottom: 20,
            background: 'rgba(124,58,237,0.08)', border: `1px solid rgba(124,58,237,0.15)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill={C.purpleL} opacity={0.5}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.text1, marginBottom: 8 }}>Diagnóstico Estratégico</div>
          <p style={{ fontSize: 13, color: C.text2, maxWidth: 400, marginBottom: 16, lineHeight: 1.6 }}>
            Análise da saúde financeira do negócio: LTV:CAC, ROAS break-even, matriz de risco e prontidão para escalar.
            Diferente da Auditoria, que foca nas campanhas — aqui o foco é no{' '}
            <span style={{ color: C.text1, fontWeight: 600 }}>modelo de negócio</span>.
          </p>
          {!clientData?.ticketPrice && (
            <p style={{
              fontSize: 12, color: C.gold, maxWidth: 360,
              background: C.goldBg, border: `1px solid rgba(245,158,11,0.25)`,
              borderRadius: 10, padding: '10px 16px',
            }}>
              Dica: adicione ticket médio e margem bruta no perfil do cliente para um diagnóstico financeiro mais preciso.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
