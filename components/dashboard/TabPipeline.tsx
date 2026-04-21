'use client'

import { useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'

const AGENTS = [
  { key: 'auditor',      icon: '🔬', label: 'Auditor',      desc: 'Análise das campanhas' },
  { key: 'data_analyst', icon: '📊', label: 'Data Analyst',  desc: 'Unit economics + mercado' },
  { key: 'estrategista', icon: '🎯', label: 'Estrategista', desc: 'Plano de crescimento' },
  { key: 'copywriter',   icon: '✍️', label: 'Copywriter',   desc: 'Criativos de performance' },
  { key: 'report',       icon: '📋', label: 'Report',       desc: 'Relatório 360° executivo' },
]

const PRIORIDADE_COLOR: Record<string, string> = {
  critica: '#FF4D4D', alta: '#F0B429', media: '#38BDF8', baixa: '#22C55E',
}
const STATUS_COLOR: Record<string, string> = {
  excelente: '#22C55E', bom: '#38BDF8', atencao: '#F0B429', critico: '#FF4D4D',
  saudavel: '#22C55E', problema: '#FF4D4D', nao_auditado: '#888',
  sustentavel: '#22C55E', fragil: '#F0B429', insustentavel: '#FF4D4D',
}
const GRADE_COLOR: Record<string, string> = {
  'A+': '#22C55E', A: '#22C55E', 'A-': '#38BDF8',
  'B+': '#38BDF8', B: '#38BDF8', 'B-': '#F0B429',
  'C+': '#F0B429', C: '#F0B429', D: '#FF4D4D',
}

function Badge({ label, color }: { label: string; color?: string }) {
  return (
    <span style={{ background: color ? `${color}20` : 'rgba(255,255,255,0.08)', color: color || '#aaa', border: `1px solid ${color || 'rgba(255,255,255,0.1)'}40` }} className="text-xs px-2 py-0.5 rounded-full font-mono">
      {label}
    </span>
  )
}

function ScoreRing({ score, grade, size = 64 }: { score: number; grade: string; size?: number }) {
  const r = size * 0.38
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 80 ? '#22C55E' : score >= 60 ? '#F0B429' : '#FF4D4D'
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={size*0.06} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.06} strokeDasharray={circ} strokeDashoffset={circ - dash} strokeLinecap="round" />
      </svg>
      <div className="absolute flex flex-col items-center leading-tight">
        <span style={{ color, fontSize: size * 0.2 }} className="font-bold">{score}</span>
        <span className="text-white/50" style={{ fontSize: size * 0.14 }}>{grade}</span>
      </div>
    </div>
  )
}

function AgentCard({ agentKey, result, icon, label }: { agentKey: string; result: any; icon: string; label: string }) {
  const [open, setOpen] = useState(false)
  if (!result) return null

  return (
    <div style={{ background: '#0C0C12', border: '1px solid rgba(255,255,255,0.06)' }} className="rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <div className="text-left">
            <div className="font-semibold text-white text-sm">{label}</div>
            <div className="text-white/40 text-xs mt-0.5">
              {agentKey === 'auditor' && `Score ${result.score_conta}/100 · ${result.grade}`}
              {agentKey === 'data_analyst' && `Health ${result.health_score}/100 · ${result.grade}`}
              {agentKey === 'estrategista' && `Score ${result.intelligence_score} · ${result.score_label}`}
              {agentKey === 'copywriter' && `${(result.variacoes || []).length} variações geradas`}
              {agentKey === 'report' && `Score ${result.score_geral}/100 · ${result.grade}`}
            </div>
          </div>
        </div>
        <span className="text-white/30 text-lg">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-white/[0.04] pt-4 space-y-4">
          {/* Auditor */}
          {agentKey === 'auditor' && (
            <>
              <p className="text-white/70 text-sm leading-relaxed">{result.resumo_executivo}</p>
              {result.gargalos?.length > 0 && (
                <div>
                  <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Gargalos</div>
                  {result.gargalos.slice(0, 3).map((g: any, i: number) => (
                    <div key={i} className="flex gap-3 mb-2">
                      <span className="text-xs font-mono text-white/30 mt-0.5">#{g.rank}</span>
                      <div>
                        <div className="text-white/80 text-sm font-medium">{g.titulo}</div>
                        <div className="text-white/50 text-xs">{g.descricao}</div>
                        <div className="text-gold text-xs mt-0.5">Impacto: {g.impacto}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {result.erros_criticos?.length > 0 && (
                <div>
                  <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Erros Críticos</div>
                  {result.erros_criticos.map((e: string, i: number) => (
                    <div key={i} style={{ background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)' }} className="rounded-lg px-3 py-2 text-sm text-red-400 mb-1">{e}</div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Data Analyst */}
          {agentKey === 'data_analyst' && (
            <>
              <p className="text-white/70 text-sm leading-relaxed">{result.executive_summary}</p>
              {result.saude_financeira && (
                <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)' }} className="rounded-lg p-3 grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-white/40">ROAS break-even</span><div className="text-white font-mono font-semibold">{result.saude_financeira.break_even_roas}×</div></div>
                  <div><span className="text-white/40">CPL máx lucrativo</span><div className="text-white font-mono font-semibold">R${result.saude_financeira.cpl_maximo_lucrativo}</div></div>
                  <div><span className="text-white/40">LTV:CAC</span><div className="text-white font-mono font-semibold">{result.saude_financeira.ltv_cac_ratio}×</div></div>
                  <div><span className="text-white/40">Sustentabilidade</span><div style={{ color: STATUS_COLOR[result.saude_financeira.sustentabilidade] || '#aaa' }} className="font-semibold capitalize">{result.saude_financeira.sustentabilidade}</div></div>
                </div>
              )}
              {result.recomendacao_principal && (
                <div>
                  <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Recomendação Principal</div>
                  <div style={{ background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.2)' }} className="rounded-lg p-3">
                    <div className="text-gold font-semibold text-sm">{result.recomendacao_principal.titulo}</div>
                    <div className="text-white/60 text-xs mt-1">{result.recomendacao_principal.descricao}</div>
                  </div>
                </div>
              )}
              {result.inteligencia?.length > 0 && (
                <div>
                  <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Inteligência de Mercado</div>
                  <div className="grid grid-cols-1 gap-2">
                    {result.inteligencia.slice(0, 3).map((intel: any, i: number) => (
                      <div key={i} style={{ background: '#111118', border: `1px solid ${intel.categoriaColor}30` }} className="rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span>{intel.icone}</span>
                          <span style={{ color: intel.categoriaColor }} className="text-xs font-semibold">{intel.categoria}</span>
                        </div>
                        <div className="text-white/80 text-sm font-medium">{intel.titulo}</div>
                        <div className="text-white/50 text-xs mt-1">{intel.acao_concreta}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Estrategista */}
          {agentKey === 'estrategista' && (
            <>
              <p className="text-white/70 text-sm leading-relaxed">{result.recommendation}</p>
              {result.priority_ranking?.length > 0 && (
                <div>
                  <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Ranking de Canais</div>
                  {result.priority_ranking.slice(0, 4).map((r: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                      <div className="flex items-center gap-2">
                        <span className="text-white/30 text-xs font-mono w-5">#{r.priority}</span>
                        <span className="text-white/80 text-sm">{r.channel}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-gold text-xs font-mono">{r.budget_pct}% · R${r.budget_brl?.toLocaleString('pt-BR')}</div>
                        <div className="text-white/40 text-xs">CPL R${r.cpl_min}–{r.cpl_max} | {r.leads_min}–{r.leads_max} leads</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {result.key_actions?.length > 0 && (
                <div>
                  <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Ações-Chave</div>
                  {result.key_actions.map((a: string, i: number) => (
                    <div key={i} className="flex gap-2 mb-1.5">
                      <span className="text-gold text-xs mt-0.5">▸</span>
                      <span className="text-white/70 text-sm">{a}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Copywriter */}
          {agentKey === 'copywriter' && (
            <>
              <div style={{ background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.2)' }} className="rounded-lg p-3">
                <div className="text-white/40 text-xs mb-1">Big Idea</div>
                <div className="text-gold font-semibold text-sm">{result.big_idea}</div>
              </div>
              {result.variacoes?.slice(0, 4).map((v: any, i: number) => (
                <div key={i} style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)' }} className="rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge label={v.framework} />
                    <Badge label={v.plataforma} />
                    <Badge label={v.formato_sugerido} />
                  </div>
                  <div className="text-white font-semibold text-sm">{v.titulo}</div>
                  {v.subtitulo && <div className="text-white/60 text-xs mt-0.5">{v.subtitulo}</div>}
                  <div className="text-white/70 text-xs mt-2 leading-relaxed">{v.corpo}</div>
                  <div style={{ color: '#F0B429' }} className="text-xs mt-2 font-semibold">CTA: {v.cta}</div>
                </div>
              ))}
            </>
          )}

          {/* Report */}
          {agentKey === 'report' && (
            <>
              <p className="text-white/70 text-sm leading-relaxed">{result.sumario_executivo}</p>
              {result.kpis_chave?.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {result.kpis_chave.map((kpi: any, i: number) => (
                    <div key={i} style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)' }} className="rounded-lg p-2.5">
                      <div className="text-white/40 text-xs">{kpi.nome}</div>
                      <div className="text-white font-mono font-bold text-sm mt-0.5">{kpi.valor}</div>
                      <div style={{ color: STATUS_COLOR[kpi.status] || '#aaa' }} className="text-xs mt-0.5 capitalize">{kpi.status}</div>
                    </div>
                  ))}
                </div>
              )}
              {result.proximos_passos_imediatos?.length > 0 && (
                <div>
                  <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Próximos 7 dias</div>
                  {result.proximos_passos_imediatos.map((p: string, i: number) => (
                    <div key={i} className="flex gap-2 mb-1.5">
                      <span className="text-green-400 text-xs mt-0.5">✓</span>
                      <span className="text-white/70 text-sm">{p}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function TabPipeline({ clientData }: { clientData: any }) {
  const [running, setRunning]     = useState(false)
  const [progress, setProgress]   = useState<Record<string, 'pending' | 'running' | 'done' | 'error'>>({})
  const [results, setResults]     = useState<Record<string, any>>({})
  const [errors, setErrors]       = useState<{ agent: string; message: string }[]>([])
  const [report, setReport]       = useState<any>(null)
  const [currentAgent, setCurrentAgent] = useState<string | null>(null)

  const { auditCache, campaignHistory, strategyData } = useAppStore()
  const latestAudit = auditCache[clientData?.clientName]?.[0]?.audit

  const handleRun = useCallback(async () => {
    if (!clientData) return
    setRunning(true)
    setProgress({})
    setResults({})
    setErrors([])
    setReport(null)
    setCurrentAgent(null)

    const metaCampaigns    = latestAudit?.campanhas?.filter((c: any) => c.platform === 'Meta') || []
    const googleCampaigns  = latestAudit?.campanhas?.filter((c: any) => c.platform === 'Google') || []
    const metaTotals       = latestAudit?.metaTotals || null
    const googleTotals     = latestAudit?.googleTotals || null
    const uploadedCampaigns = latestAudit?.campanhas || []

    const history = (campaignHistory || []).map((h: any) => ({
      period: h.period || h.month, channel: h.channel || h.platform,
      budgetSpent: h.spend, leads: h.leads, cplReal: h.cpl,
      conversions: h.conversions, outcome: h.outcome || 'desconhecido',
      whatWorked: h.whatWorked, whatFailed: h.whatFailed,
    }))

    const payload = {
      clientName:   clientData.clientName,
      niche:        clientData.niche,
      budget:       clientData.budget || 0,
      objective:    clientData.objective || 'Gerar leads qualificados',
      monthlyRevenue: clientData.monthlyRevenue || 0,
      city:         clientData.city,
      products:     clientData.products || [],
      currentCPL:   clientData.currentCPL,
      currentLeadSource: clientData.currentLeadSource,
      mainChallenge: clientData.mainChallenge,
      nicheDetails:  clientData.nicheDetails || {},
      ticketPrice:   clientData.ticketPrice,
      grossMargin:   clientData.grossMargin,
      conversionRate: clientData.conversionRate,
      isRecurring:   clientData.isRecurring,
      metaCampaigns, googleCampaigns, metaTotals, googleTotals, uploadedCampaigns,
      campaignHistory: history,
      reportFormat: 'executive',
    }

    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error(`Erro ${res.status}`)
      if (!res.body) throw new Error('Sem resposta do servidor')

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'agent_start') {
              setCurrentAgent(event.agent)
              setProgress(p => ({ ...p, [event.agent]: 'running' }))
            } else if (event.type === 'agent_done') {
              setProgress(p => ({ ...p, [event.agent]: 'done' }))
              setResults(r => ({ ...r, [event.agent]: event.result }))
            } else if (event.type === 'agent_error') {
              setProgress(p => ({ ...p, [event.agent]: 'error' }))
              setErrors(e => [...e, { agent: event.agent, message: event.message }])
            } else if (event.type === 'done') {
              setReport(event)
              setCurrentAgent(null)
            }
          } catch {}
        }
      }
    } catch (e: any) {
      setErrors([{ agent: 'pipeline', message: e.message }])
    } finally {
      setRunning(false)
      setCurrentAgent(null)
    }
  }, [clientData, latestAudit, campaignHistory])

  const hasResults = Object.keys(results).length > 0
  const totalDone  = Object.values(progress).filter(s => s === 'done').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, rgba(240,180,41,0.08) 0%, rgba(167,139,250,0.04) 100%)', border: '1px solid rgba(240,180,41,0.15)' }} className="rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-white font-semibold text-lg">Pipeline 360° ELYON</h2>
            <p className="text-white/50 text-sm mt-1">5 agentes de IA em cadeia: Auditor → Data Analyst → Estrategista → Copywriter → Report</p>
            {!latestAudit && (
              <p className="text-yellow-400/70 text-xs mt-2">⚠ Sem auditoria de campanhas — análise baseada nos dados do wizard + benchmarks</p>
            )}
          </div>
          <button
            onClick={handleRun}
            disabled={running}
            style={{
              background: running ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #F0B429 0%, #FFD166 100%)',
              color: running ? '#666' : '#000',
            }}
            className="shrink-0 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all disabled:cursor-not-allowed whitespace-nowrap"
          >
            {running ? '⏳ Analisando...' : hasResults ? '🔄 Re-analisar' : '▶ Iniciar Análise'}
          </button>
        </div>
      </div>

      {/* Progress */}
      {(running || hasResults) && (
        <div style={{ background: '#0C0C12', border: '1px solid rgba(255,255,255,0.06)' }} className="rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/60 text-sm">Progresso</span>
            <span className="text-white/40 text-xs font-mono">{totalDone}/{AGENTS.length} agentes</span>
          </div>
          <div className="space-y-2">
            {AGENTS.map(({ key, icon, label, desc }) => {
              const st = progress[key] || 'pending'
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className={`text-base transition-all ${st === 'running' ? 'animate-pulse' : ''}`}>{icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${st === 'done' ? 'text-white/80' : st === 'running' ? 'text-white' : 'text-white/30'}`}>{label}</span>
                      <span className="text-xs">
                        {st === 'done' && <span className="text-green-400">✓</span>}
                        {st === 'running' && <span className="text-gold animate-pulse">●</span>}
                        {st === 'error' && <span className="text-red-400">✗</span>}
                      </span>
                    </div>
                    <div className={`text-xs mt-0.5 ${st === 'running' ? 'text-white/50' : 'text-white/20'}`}>{desc}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {running && (
            <div className="mt-3 h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div style={{ width: `${(totalDone / AGENTS.length) * 100}%`, background: 'linear-gradient(90deg, #F0B429, #FFD166)' }} className="h-full rounded-full transition-all duration-500" />
            </div>
          )}
        </div>
      )}

      {/* Report summary */}
      {report && report.report && (
        <div style={{ background: 'linear-gradient(135deg, rgba(240,180,41,0.06) 0%, rgba(34,197,94,0.04) 100%)', border: '1px solid rgba(240,180,41,0.2)' }} className="rounded-xl p-5">
          <div className="flex items-start gap-4">
            <ScoreRing score={report.report.score_geral || 0} grade={report.report.grade || '—'} size={72} />
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold text-base">{report.report.titulo}</div>
              <p className="text-white/60 text-sm mt-1 leading-relaxed">{report.report.sumario_executivo}</p>
              {report.report.proximos_passos_imediatos?.slice(0, 3).map((p: string, i: number) => (
                <div key={i} className="flex gap-2 mt-1.5">
                  <span className="text-green-400 text-xs">✓</span>
                  <span className="text-white/70 text-xs">{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Plano de ação do report */}
      {report?.report?.plano_acao?.length > 0 && (
        <div>
          <div className="text-white/40 text-xs uppercase tracking-wider mb-3">Plano de Ação ({report.report.plano_acao.length} ações)</div>
          <div className="space-y-2">
            {report.report.plano_acao.map((a: any, i: number) => (
              <div key={i} style={{ background: '#0C0C12', border: `1px solid ${PRIORIDADE_COLOR[a.prioridade] || '#333'}30` }} className="rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge label={a.prioridade?.toUpperCase()} color={PRIORIDADE_COLOR[a.prioridade]} />
                  <Badge label={a.categoria} />
                  <Badge label={a.prazo} />
                </div>
                <div className="text-white font-semibold text-sm">{a.titulo}</div>
                <div className="text-white/60 text-xs mt-1">{a.descricao}</div>
                {a.impacto && <div className="text-gold text-xs mt-1.5 font-medium">→ {a.impacto}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resultados por agente */}
      {hasResults && (
        <div className="space-y-3">
          <div className="text-white/40 text-xs uppercase tracking-wider">Detalhes por Agente</div>
          {AGENTS.map(({ key, icon, label }) => (
            <AgentCard key={key} agentKey={key} result={results[key]} icon={icon} label={label} />
          ))}
        </div>
      )}

      {/* Erros */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((e, i) => (
            <div key={i} style={{ background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)' }} className="rounded-lg p-3 text-sm text-red-400">
              <span className="font-semibold">{e.agent}:</span> {e.message}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!running && !hasResults && (
        <div className="text-center py-12 text-white/30">
          <div className="text-4xl mb-3">🤖</div>
          <div className="text-sm">Clique em "Iniciar Análise" para rodar o pipeline completo</div>
          <div className="text-xs mt-1">Duração estimada: 2–4 minutos</div>
        </div>
      )}
    </div>
  )
}
