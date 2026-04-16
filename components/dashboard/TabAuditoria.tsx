// components/dashboard/TabAuditoria.tsx — Auditoria de contas Meta + Google Ads com IA
'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import type { ClientData } from '@/lib/store'

interface Props {
  clientData: ClientData | null
}

const gradeColor: Record<string, string> = {
  'A+': '#22C55E', A: '#22C55E', 'B+': '#F0B429',
  B: '#F0B429', 'C+': '#F59E0B', C: '#F59E0B', D: '#FF4D4D',
}

const severityColor: Record<string, string> = {
  alta:  '#FF4D4D',
  media: '#F0B429',
  baixa: '#38BDF8',
}

const statusColor: Record<string, string> = {
  bom:     '#22C55E',
  atenção: '#F0B429',
  crítico: '#FF4D4D',
}

function fmt(n: number) {
  if (!n) return 'R$0'
  if (n >= 1_000_000) return `R$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000)      return `R$${(n / 1000).toFixed(1)}k`
  return `R$${n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function MetricCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-4 text-center">
      <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="font-display text-xl font-bold" style={{ color: color || '#F0B429' }}>{value}</div>
    </div>
  )
}

export function TabAuditoria({ clientData }: Props) {
  const { connectedAccounts } = useAppStore()
  const [audit,      setAudit]      = useState<Record<string, any> | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [error,      setError]      = useState('')
  const [source,     setSource]     = useState<'ai' | 'benchmark' | null>(null)

  const metaAccount   = connectedAccounts.find((a) => a.platform === 'meta')
  const googleAccount = connectedAccounts.find((a) => a.platform === 'google')
  const hasConnections = !!(metaAccount || googleAccount)

  const handleAudit = async () => {
    if (!clientData) return
    setLoading(true)
    setError('')
    setAudit(null)

    try {
      // 1. Busca dados reais das contas conectadas em paralelo
      const [metaResult, googleResult] = await Promise.all([
        metaAccount?.accessToken && metaAccount?.accountId
          ? fetch('/api/ads-data/meta', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                accessToken: metaAccount.accessToken,
                accountId:   metaAccount.accountId,
              }),
            }).then((r) => r.json())
          : Promise.resolve(null),

        googleAccount?.accessToken && googleAccount?.accountId
          ? fetch('/api/ads-data/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                accessToken: googleAccount.accessToken,
                accountId:   googleAccount.accountId,
              }),
            }).then((r) => r.json())
          : Promise.resolve(null),
      ])

      // 2. Envia para a IA auditar
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName:      clientData.clientName,
          niche:           clientData.niche,
          metaCampaigns:   metaResult?.campaigns  || [],
          metaTotals:      metaResult?.totals     || null,
          googleCampaigns: googleResult?.campaigns || [],
          googleTotals:    googleResult?.totals    || null,
        }),
      })

      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setAudit(json.audit)
      setSource(json.source)

    } catch (e: any) {
      setError(e.message || 'Erro ao gerar auditoria.')
    } finally {
      setLoading(false)
    }
  }

  // ── Tela vazia: nenhuma conta conectada ────────────────────────────────────────
  if (!hasConnections) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-white mb-1">Auditoria de Contas</h2>
          <p className="text-slate-500 text-sm">Análise automática das suas contas Meta e Google Ads com IA.</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center bg-[#111114] border border-[#2A2A30] rounded-2xl">
          <div className="text-5xl mb-4 opacity-40">🔗</div>
          <div className="font-display text-lg font-bold text-white mb-2">Nenhuma conta conectada</div>
          <p className="text-slate-500 text-sm max-w-sm mb-6">
            Conecte sua conta Meta Ads ou Google Ads na aba <strong className="text-slate-300">Conexões</strong> para iniciar a auditoria.
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="w-2 h-2 rounded-full bg-[#2A2A30]" />
            Meta Ads — não conectado
            <span className="w-2 h-2 rounded-full bg-[#2A2A30] ml-3" />
            Google Ads — não conectado
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-white mb-1">Auditoria de Contas</h2>
          <p className="text-slate-500 text-sm">
            Análise automática dos últimos 30 dias com dados reais das suas contas.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            {audit && (
              <button
                onClick={async () => {
                  if (!audit || !clientData) return
                  setPdfLoading(true)
                  try {
                    const { generateAuditPDF } = await import('@/components/pdf/AuditoriaPDF')
                    await generateAuditPDF(audit, clientData.clientName, clientData.niche)
                  } catch (e) {
                    console.error('Erro PDF auditoria:', e)
                  } finally {
                    setPdfLoading(false)
                  }
                }}
                disabled={pdfLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all hover:opacity-80 disabled:opacity-50"
                style={{ border: '1px solid rgba(240,180,41,0.3)', color: '#F0B429', background: 'rgba(240,180,41,0.05)' }}
              >
                {pdfLoading ? '⏳' : '↓'} PDF
              </button>
            )}
            <button
              onClick={handleAudit}
              disabled={loading || !clientData}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)', color: '#000' }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Auditando...
                </>
              ) : (
                '🔍 Iniciar Auditoria'
              )}
            </button>
          </div>
          {audit && (
            <span className="text-[10px] text-slate-600">
              {source === 'ai' ? '⚡ Gerado por IA' : '📊 Gerado por benchmark'}
            </span>
          )}
        </div>
      </div>

      {/* Contas conectadas */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { platform: 'meta',   label: 'Meta Ads',   icon: '📘', acc: metaAccount },
          { platform: 'google', label: 'Google Ads', icon: '🔴', acc: googleAccount },
        ].map(({ platform, label, icon, acc }) => (
          <div
            key={platform}
            className="flex items-center gap-3 rounded-xl p-3 border"
            style={{
              background: acc ? 'rgba(34,197,94,0.04)' : 'rgba(255,77,77,0.04)',
              borderColor: acc ? 'rgba(34,197,94,0.2)' : 'rgba(255,77,77,0.15)',
            }}
          >
            <span className="text-xl">{icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white">{label}</div>
              <div className="text-[10px] truncate" style={{ color: acc ? '#22C55E' : '#FF4D4D' }}>
                {acc ? acc.accountName || 'Conectado' : 'Não conectado'}
              </div>
            </div>
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: acc ? '#22C55E' : '#FF4D4D' }}
            />
          </div>
        ))}
      </div>

      {/* Erro */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-[#2A2A30] rounded w-1/3 mb-3" />
              <div className="h-3 bg-[#2A2A30] rounded w-2/3 mb-2" />
              <div className="h-3 bg-[#2A2A30] rounded w-1/2" />
            </div>
          ))}
          <div className="text-center text-xs text-slate-600 py-2">
            Buscando dados reais e analisando com IA...
          </div>
        </div>
      )}

      {/* Resultado da auditoria */}
      {audit && !loading && (
        <div className="space-y-5 animate-fade-up" id="audit-result">

          {/* Score + grade + summary */}
          <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Score de Saúde da Conta</div>
                <div className="font-display text-5xl font-bold" style={{ color: gradeColor[audit.grade] || '#F0B429' }}>
                  {audit.health_score}
                  <span className="text-2xl text-slate-500">/100</span>
                  <span className="text-3xl ml-3">{audit.grade}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 mb-1">Verba estimada em desperdício</div>
                <div className="font-display text-2xl font-bold text-[#FF4D4D]">
                  {fmt(audit.wasted_spend?.estimated || 0)}
                </div>
                <div className="text-xs text-slate-600">{audit.wasted_spend?.percentage || 0}% do gasto total</div>
              </div>
            </div>
            {/* Barra de score */}
            <div className="w-full h-2.5 bg-[#1E1E24] rounded-full overflow-hidden mb-4">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${audit.health_score}%`,
                  background: `linear-gradient(90deg, ${gradeColor[audit.grade] || '#F0B429'}, ${gradeColor[audit.grade] || '#F0B429'}88)`,
                }}
              />
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{audit.summary}</p>
          </div>

          {/* Principais causas de desperdício */}
          {audit.wasted_spend?.main_causes?.length > 0 && (
            <div className="bg-[#111114] border border-[#FF4D4D]/20 rounded-2xl p-5">
              <div className="font-display font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-[#FF4D4D]">⚠</span> Causas do Desperdício
              </div>
              <div className="space-y-2">
                {audit.wasted_spend.main_causes.map((cause: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="text-[#FF4D4D] mt-0.5 flex-shrink-0">→</span>
                    {cause}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Problemas críticos */}
          {audit.critical_issues?.length > 0 && (
            <div className="space-y-3">
              <div className="font-display font-bold text-white text-sm uppercase tracking-wider">Problemas Identificados</div>
              {audit.critical_issues.map((issue: any, i: number) => {
                const color = severityColor[issue.severity] || '#F0B429'
                return (
                  <div key={i} className="rounded-xl p-4 border" style={{ background: `${color}08`, borderColor: `${color}30` }}>
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="font-semibold text-sm text-white">{issue.issue}</div>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 capitalize"
                        style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}
                      >
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{issue.detail}</p>
                    <div className="flex items-start gap-1.5 text-xs" style={{ color }}>
                      <span className="flex-shrink-0 mt-0.5">⚡</span>
                      {issue.action}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Quick wins */}
          {audit.quick_wins?.length > 0 && (
            <div className="bg-[#111114] border border-[#22C55E]/20 rounded-2xl p-5">
              <div className="font-display font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-[#22C55E]">🚀</span> Quick Wins — Melhorias Rápidas
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {audit.quick_wins.map((win: any, i: number) => (
                  <div key={i} className="bg-[#16161A] rounded-xl p-4 border border-[#2A2A30]">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="font-semibold text-sm text-white">{win.title}</div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{
                            color: win.impact === 'Alto' ? '#22C55E' : win.impact === 'Médio' ? '#F0B429' : '#94A3B8',
                            background: win.impact === 'Alto' ? 'rgba(34,197,94,0.1)' : win.impact === 'Médio' ? 'rgba(240,180,41,0.1)' : 'rgba(148,163,184,0.1)',
                          }}
                        >
                          {win.impact}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-slate-500 bg-[#2A2A30]">
                          Esforço {win.effort}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{win.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Análise por plataforma */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Meta */}
            {audit.meta_analysis && (
              <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-display font-bold text-white flex items-center gap-2">
                    <span>📘</span> Meta Ads
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                    style={{
                      color: statusColor[audit.meta_analysis.status] || '#F0B429',
                      background: `${statusColor[audit.meta_analysis.status] || '#F0B429'}18`,
                      border: `1px solid ${statusColor[audit.meta_analysis.status] || '#F0B429'}30`,
                    }}
                  >
                    {audit.meta_analysis.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center">
                    <div className="text-[10px] text-slate-500 mb-0.5">Gasto</div>
                    <div className="text-sm font-bold text-white">{fmt(audit.meta_analysis.spend)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-slate-500 mb-0.5">CPL</div>
                    <div className="text-sm font-bold text-white">R${audit.meta_analysis.cpl}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-slate-500 mb-0.5">Leads</div>
                    <div className="text-sm font-bold text-white">{audit.meta_analysis.leads}</div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {(audit.meta_analysis.insights || []).map((ins: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                      <span className="text-[#38BDF8] flex-shrink-0 mt-0.5">→</span>
                      {ins}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Google */}
            {audit.google_analysis && (
              <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-display font-bold text-white flex items-center gap-2">
                    <span>🔴</span> Google Ads
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                    style={{
                      color: statusColor[audit.google_analysis.status] || '#F0B429',
                      background: `${statusColor[audit.google_analysis.status] || '#F0B429'}18`,
                      border: `1px solid ${statusColor[audit.google_analysis.status] || '#F0B429'}30`,
                    }}
                  >
                    {audit.google_analysis.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center">
                    <div className="text-[10px] text-slate-500 mb-0.5">Gasto</div>
                    <div className="text-sm font-bold text-white">{fmt(audit.google_analysis.spend)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-slate-500 mb-0.5">CPL</div>
                    <div className="text-sm font-bold text-white">R${audit.google_analysis.cpl}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-slate-500 mb-0.5">Leads</div>
                    <div className="text-sm font-bold text-white">{audit.google_analysis.leads}</div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {(audit.google_analysis.insights || []).map((ins: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                      <span className="text-[#38BDF8] flex-shrink-0 mt-0.5">→</span>
                      {ins}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Benchmark do nicho */}
          {audit.benchmark && (
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
              <div className="font-display font-bold text-white mb-4">📊 Benchmark do Nicho ({clientData?.niche})</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <MetricCard label="CPL mín. nicho"   value={`R$${audit.benchmark.cpl_min}`}   color="#22C55E" />
                <MetricCard label="CPL máx. nicho"   value={`R$${audit.benchmark.cpl_max}`}   color="#F0B429" />
                <MetricCard label="ROAS bom"          value={`${audit.benchmark.roas_good}×`}  color="#A78BFA" />
                <MetricCard label="Melhores canais"   value={audit.benchmark.best_channels?.slice(0,2).join(', ')} color="#38BDF8" />
              </div>
              {audit.benchmark.insights?.length > 0 && (
                <div className="space-y-1.5 border-t border-[#2A2A30] pt-4">
                  {audit.benchmark.insights.map((ins: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                      <span className="text-[#F0B429] flex-shrink-0 mt-0.5">→</span>
                      {ins}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recomendações priorizadas */}
          {audit.recommendations?.length > 0 && (
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
              <div className="font-display font-bold text-white mb-4">⚡ Recomendações Priorizadas</div>
              <div className="space-y-3">
                {audit.recommendations.map((rec: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-[#16161A] rounded-xl">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                      style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)', color: '#000' }}
                    >
                      {rec.priority}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="text-sm font-semibold text-white">{rec.action}</div>
                        <span className="text-[10px] text-slate-500 flex-shrink-0 bg-[#2A2A30] px-1.5 py-0.5 rounded-full">
                          {rec.channel}
                        </span>
                      </div>
                      <div className="text-xs text-[#22C55E]">→ {rec.expected_result}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data da auditoria */}
          <div className="text-center text-xs text-slate-700 pb-2">
            Auditoria gerada em {new Date(audit.generated_at).toLocaleString('pt-BR')}
          </div>
        </div>
      )}

      {/* Estado inicial (sem auditoria) */}
      {!audit && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-[#111114] border border-[#2A2A30] rounded-2xl">
          <div className="text-5xl mb-4 opacity-40">🔍</div>
          <div className="font-display text-lg font-bold text-white mb-2">Pronto para auditar</div>
          <p className="text-slate-500 text-sm max-w-sm mb-6">
            Clique em "Iniciar Auditoria" para analisar os dados reais das suas contas conectadas com IA.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            {metaAccount && (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                Meta conectado
              </div>
            )}
            {googleAccount && (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                Google conectado
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
