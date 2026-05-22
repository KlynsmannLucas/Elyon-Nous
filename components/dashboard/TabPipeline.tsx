'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAppStore } from '@/lib/store'

// ── Tipos ────────────────────────────────────────────────────────────────────

type AgentStatus = 'pending' | 'running' | 'done' | 'error' | 'skipped'
type PlatformStatus = 'connected' | 'disconnected' | 'fetching' | 'no_data' | 'error'

interface PlatformInfo {
  id: 'meta' | 'google'
  label: string
  icon: string
  status: PlatformStatus
  campaigns: number
  spend?: number
  leads?: number
  errorMsg?: string
}

const AGENTS = [
  { key: 'auditor',      icon: '🔬', label: 'Auditor',      desc: 'Análise das campanhas' },
  { key: 'data_analyst', icon: '📊', label: 'Data Analyst',  desc: 'Unit economics + mercado' },
  { key: 'estrategista', icon: '🎯', label: 'Estrategista', desc: 'Plano de crescimento' },
  { key: 'copywriter',   icon: '✍️', label: 'Copywriter',   desc: 'Criativos de performance' },
  { key: 'report',       icon: '📋', label: 'Report',       desc: 'Relatório executivo 360°' },
]

const C = {
  gold:    '#F0B429', green:   '#22C55E',
  blue:    '#38BDF8', red:     '#FF4D4D',
  purple:  '#A78BFA', slate:   '#64748B',
}

const PRIORIDADE_COLOR: Record<string, string> = {
  critica: C.red, alta: C.gold, media: C.blue, baixa: C.green,
}
const STATUS_COLOR: Record<string, string> = {
  excelente: C.green, bom: C.blue, atencao: C.gold, critico: C.red,
  saudavel:  C.green, problema: C.red, nao_auditado: C.slate,
  sustentavel: C.green, fragil: C.gold, insustentavel: C.red,
}
const GRADE_COLOR: Record<string, string> = {
  'A+': C.green, A: C.green, 'A-': C.blue,
  'B+': C.blue,  B: C.blue,  'B-': C.gold,
  'C+': C.gold,  C: C.gold,  D: C.red,
}

// ── Helpers de UI ─────────────────────────────────────────────────────────────

function Badge({ label, color }: { label: string; color?: string }) {
  return (
    <span style={{
      background: color ? `${color}18` : 'rgba(255,255,255,0.06)',
      color: color || '#888',
      border: `1px solid ${color ? `${color}30` : 'rgba(255,255,255,0.1)'}`,
    }} className="text-xs px-2 py-0.5 rounded-full font-mono">
      {label}
    </span>
  )
}

function ScoreRing({ score, grade, size = 64 }: { score: number; grade: string; size?: number }) {
  const r     = size * 0.38
  const circ  = 2 * Math.PI * r
  const dash  = (Math.min(Math.max(score, 0), 100) / 100) * circ
  const color = score >= 80 ? C.green : score >= 60 ? C.gold : C.red
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={size*0.07} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.07}
          strokeDasharray={circ} strokeDashoffset={circ - dash} strokeLinecap="round" />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span style={{ color, fontSize: size * 0.22 }} className="font-bold font-mono">{score}</span>
        <span style={{ color: '#fff', fontSize: size * 0.16, opacity: 0.5 }} className="font-semibold mt-0.5">{grade}</span>
      </div>
    </div>
  )
}

function AgentStatusDot({ status }: { status: AgentStatus }) {
  if (status === 'done')    return <span style={{ color: C.green }} className="text-sm">✓</span>
  if (status === 'running') return <span style={{ color: C.gold }} className="text-sm animate-pulse">●</span>
  if (status === 'error')   return <span style={{ color: C.red }} className="text-sm">✗</span>
  if (status === 'skipped') return <span style={{ color: C.slate }} className="text-sm">–</span>
  return <span style={{ color: '#333' }} className="text-sm">○</span>
}

function PlatformChip({ p }: { p: PlatformInfo }) {
  const statusLabel: Record<PlatformStatus, string> = {
    connected: 'Conectado', disconnected: 'Não conectado',
    fetching: 'Buscando dados...', no_data: 'Sem dados no período',
    error: 'Erro na busca',
  }
  const statusColor: Record<PlatformStatus, string> = {
    connected: C.green, disconnected: C.slate,
    fetching: C.gold, no_data: C.gold, error: C.red,
  }
  const color = statusColor[p.status]
  return (
    <div style={{
      background: `${color}10`,
      border: `1px solid ${color}30`,
      borderRadius: 10, padding: '6px 12px',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span className="text-sm">{p.icon}</span>
      <div>
        <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{p.label}</div>
        <div style={{ color, fontSize: 10 }}>
          {p.status === 'fetching' && '⟳ Buscando...'}
          {p.status === 'connected' && `✓ ${p.campaigns} campanhas${p.spend ? ` · R$${Math.round(p.spend).toLocaleString('pt-BR')}` : ''}`}
          {p.status === 'disconnected' && '○ Não conectado'}
          {p.status === 'no_data' && '○ Sem dados no período'}
          {p.status === 'error' && `✗ ${p.errorMsg || 'Erro ao buscar'}`}
        </div>
      </div>
    </div>
  )
}

// ── Card expansível por agente ────────────────────────────────────────────────

function AgentDetail({ agentKey, result, icon, label }: {
  agentKey: string; result: any; icon: string; label: string
}) {
  const [open, setOpen] = useState(false)
  if (!result) return null

  const subtitle = agentKey === 'auditor'      ? `Score ${result.score_conta}/100 · ${result.grade}`
    : agentKey === 'data_analyst' ? `Health ${result.health_score}/100 · ${result.grade}`
    : agentKey === 'estrategista' ? `${result.intelligence_score} · ${result.score_label}`
    : agentKey === 'copywriter'   ? `${(result.variacoes || []).length} variações`
    : agentKey === 'report'       ? `Score ${result.score_geral}/100 · ${result.grade}`
    : ''

  return (
    <div style={{ background: '#0A0A14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
        style={{ borderRadius: 12 }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <div className="text-left">
            <div className="font-semibold text-white text-sm">{label}</div>
            <div className="text-white/40 text-xs mt-0.5">{subtitle}</div>
          </div>
        </div>
        <span style={{ color: '#555' }} className="text-lg select-none">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 16 }}>

          {/* Auditor */}
          {agentKey === 'auditor' && (
            <>
              <p className="text-white/70 text-sm leading-relaxed">{result.resumo_executivo}</p>
              {result.gargalos?.length > 0 && (
                <div>
                  <div className="text-white/30 text-xs uppercase tracking-wider mb-2">Gargalos</div>
                  {result.gargalos.slice(0, 4).map((g: any, i: number) => (
                    <div key={i} className="flex gap-3 mb-3">
                      <span className="text-xs font-mono text-white/20 mt-0.5 w-4 shrink-0">#{g.rank}</span>
                      <div>
                        <div className="text-white/80 text-sm font-medium">{g.titulo}</div>
                        <div className="text-white/50 text-xs mt-0.5">{g.descricao}</div>
                        <div className="text-xs mt-0.5" style={{ color: C.gold }}>Impacto: {g.impacto}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {result.campanhas_destaque?.length > 0 && (
                <div>
                  <div className="text-white/30 text-xs uppercase tracking-wider mb-2">Campanhas — Ação Recomendada</div>
                  {result.campanhas_destaque.map((c: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                      <span className="text-white/70 text-xs truncate flex-1 mr-2">{c.nome}</span>
                      <Badge
                        label={c.acao}
                        color={c.acao === 'ESCALAR' ? C.green : c.acao === 'PAUSAR' ? C.red : C.gold}
                      />
                    </div>
                  ))}
                </div>
              )}
              {result.erros_criticos?.length > 0 && (
                <div>
                  <div className="text-white/30 text-xs uppercase tracking-wider mb-2">Erros Críticos</div>
                  {result.erros_criticos.map((e: string, i: number) => (
                    <div key={i} style={{ background: `${C.red}10`, border: `1px solid ${C.red}25`, color: C.red }} className="rounded-lg px-3 py-2 text-xs mb-1">
                      <span style={{ color: '#F87171' }}>{e}</span>
                    </div>
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
                <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}
                  className="p-3 grid grid-cols-2 gap-3 text-xs">
                  {[
                    ['ROAS break-even', `${result.saude_financeira.break_even_roas}×`],
                    ['CPL máx lucrativo', `R$${result.saude_financeira.cpl_maximo_lucrativo}`],
                    ['LTV estimado', `R$${result.saude_financeira.ltv_estimado}`],
                    ['LTV:CAC', `${result.saude_financeira.ltv_cac_ratio}×`],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div className="text-white/30">{k}</div>
                      <div className="text-white font-mono font-semibold mt-0.5">{v}</div>
                    </div>
                  ))}
                  <div className="col-span-2">
                    <div className="text-white/30">Sustentabilidade</div>
                    <div style={{ color: STATUS_COLOR[result.saude_financeira.sustentabilidade] || '#aaa' }} className="font-semibold capitalize text-sm mt-0.5">
                      {result.saude_financeira.sustentabilidade} — {result.saude_financeira.interpretacao}
                    </div>
                  </div>
                </div>
              )}
              {result.recomendacao_principal && (
                <div style={{ background: `${C.gold}08`, border: `1px solid ${C.gold}25`, borderRadius: 10 }} className="p-3">
                  <div style={{ color: C.gold }} className="font-semibold text-sm">{result.recomendacao_principal.titulo}</div>
                  <div className="text-white/60 text-xs mt-1">{result.recomendacao_principal.descricao}</div>
                </div>
              )}
              {result.inteligencia?.slice(0, 3).map((intel: any, i: number) => (
                <div key={i} style={{ background: '#111118', border: `1px solid ${intel.categoriaColor}25`, borderRadius: 10 }} className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{intel.icone}</span>
                    <span style={{ color: intel.categoriaColor }} className="text-xs font-semibold">{intel.categoria}</span>
                  </div>
                  <div className="text-white/80 text-sm font-medium">{intel.titulo}</div>
                  <div className="text-white/50 text-xs mt-1">{intel.acao_concreta}</div>
                </div>
              ))}
            </>
          )}

          {/* Estrategista */}
          {agentKey === 'estrategista' && (
            <>
              <p className="text-white/70 text-sm leading-relaxed">{result.recommendation}</p>
              {result.priority_ranking?.slice(0, 4).map((r: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <span className="text-white/20 text-xs font-mono w-5">#{r.priority}</span>
                    <span className="text-white/80 text-sm">{r.channel}</span>
                  </div>
                  <div className="text-right">
                    <div style={{ color: C.gold }} className="text-xs font-mono">{r.budget_pct}% · R${(r.budget_brl || 0).toLocaleString('pt-BR')}</div>
                    <div className="text-white/30 text-xs">CPL R${r.cpl_min}–{r.cpl_max} | {r.leads_min}–{r.leads_max} leads</div>
                  </div>
                </div>
              ))}
              {result.key_actions?.map((a: string, i: number) => (
                <div key={i} className="flex gap-2">
                  <span style={{ color: C.gold }} className="text-xs mt-0.5 shrink-0">▸</span>
                  <span className="text-white/70 text-sm">{a}</span>
                </div>
              ))}
            </>
          )}

          {/* Copywriter */}
          {agentKey === 'copywriter' && (
            <>
              <div style={{ background: `${C.gold}08`, border: `1px solid ${C.gold}25`, borderRadius: 10 }} className="p-3">
                <div className="text-white/30 text-xs mb-1">Big Idea</div>
                <div style={{ color: C.gold }} className="font-semibold text-sm">{result.big_idea}</div>
              </div>
              {result.variacoes?.slice(0, 4).map((v: any, i: number) => (
                <div key={i} style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }} className="p-3">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <Badge label={v.framework} />
                    <Badge label={v.plataforma} />
                    <Badge label={v.formato_sugerido} />
                  </div>
                  <div className="text-white font-semibold text-sm">{v.titulo}</div>
                  {v.subtitulo && <div className="text-white/50 text-xs mt-0.5">{v.subtitulo}</div>}
                  <div className="text-white/70 text-xs mt-2 leading-relaxed">{v.corpo}</div>
                  <div style={{ color: C.gold }} className="text-xs mt-2 font-semibold">CTA: {v.cta}</div>
                  {v.gancho && <div className="text-white/30 text-xs mt-1">Gancho: {v.gancho}</div>}
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
                    <div key={i} style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }} className="p-2.5">
                      <div className="text-white/30 text-xs">{kpi.nome}</div>
                      <div className="text-white font-mono font-bold text-sm mt-0.5">{kpi.valor}</div>
                      <div style={{ color: STATUS_COLOR[kpi.status] || '#aaa' }} className="text-xs capitalize mt-0.5">{kpi.status}</div>
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
  const [running,      setRunning]      = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [progress,     setProgress]     = useState<Record<string, AgentStatus>>({})
  const [agentTimes,   setAgentTimes]   = useState<Record<string, number>>({}) // timestamp de início
  const [results,      setResults]      = useState<Record<string, any>>({})
  const [errors,       setErrors]       = useState<{ agent: string; message: string }[]>([])
  const [doneEvent,    setDoneEvent]    = useState<any>(null)
  const [currentAgent, setCurrentAgent] = useState<string | null>(null)
  const [platforms,    setPlatforms]    = useState<PlatformInfo[]>([])
  const [lastRunAt,    setLastRunAt]    = useState<string | null>(null)
  const [totalDuration, setTotalDuration] = useState<number | null>(null)
  const [activeSection, setActiveSection] = useState<'progress' | 'summary' | 'problems' | 'actions' | 'report' | 'agents'>('progress')
  const abortRef = useRef<AbortController | null>(null)

  const { auditCache, campaignHistory, connectedAccounts, setAuditCache, selectedMetaAccountByClient, selectedGoogleAccountByClient } = useAppStore()
  const clientName  = clientData?.clientName
  const selectedMetaAccountId   = selectedMetaAccountByClient[clientName   || ''] || ''
  const selectedGoogleAccountId = selectedGoogleAccountByClient[clientName || ''] || ''
  const latestAudit = auditCache[clientName]?.[0]?.audit
  // Pipeline results são persistidos como uma entrada especial no auditCache
  const cachedPipeline = (Array.isArray(auditCache[clientName])
    ? auditCache[clientName].find((e: any) => e?._isPipeline)
    : null)?.audit

  // Restaura último resultado do cache ao montar
  useEffect(() => {
    if (!cachedPipeline) return
    const r = cachedPipeline.results || {}
    setResults(r)
    setDoneEvent(cachedPipeline.doneEvent || null)
    setProgress(Object.fromEntries(Object.keys(r).map(k => [k, 'done' as AgentStatus])))
    setLastRunAt(cachedPipeline.generated_at || null)
  }, [clientName]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Busca dados reais das plataformas antes de rodar ─────────────────────
  const fetchLiveData = useCallback(async () => {
    const metaAccount   = connectedAccounts.find(a => a.platform === 'meta')
    const googleAccount = connectedAccounts.find(a => a.platform === 'google')

    const infos: PlatformInfo[] = [
      { id: 'meta',   label: 'Meta Ads',   icon: '📘', status: 'disconnected', campaigns: 0 },
      { id: 'google', label: 'Google Ads', icon: '🟢', status: 'disconnected', campaigns: 0 },
    ]
    setPlatforms([...infos])

    let metaCampaigns:   any[]  = []
    let metaTotals:      any    = null
    let googleCampaigns: any[]  = []
    let googleTotals:    any    = null

    // Meta Ads
    if (metaAccount) {
      infos[0].status = 'fetching'
      setPlatforms([...infos])
      try {
        const res  = await fetch('/api/ads-data/meta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountId: selectedMetaAccountId || metaAccount.accountId, datePreset: 'last_30d' }),
        })
        const data = await res.json()
        if (data.success && Array.isArray(data.campaigns) && data.campaigns.length > 0) {
          metaCampaigns = data.campaigns
          metaTotals    = data.totals
          infos[0].status    = 'connected'
          infos[0].campaigns = metaCampaigns.length
          infos[0].spend     = metaTotals?.spend
          infos[0].leads     = metaTotals?.leads
        } else {
          infos[0].status = 'no_data'
        }
      } catch (e: any) {
        infos[0].status   = 'error'
        infos[0].errorMsg = e.message
      }
    }

    // Google Ads
    if (googleAccount) {
      infos[1].status = 'fetching'
      setPlatforms([...infos])
      try {
        const res  = await fetch('/api/ads-data/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountId: selectedGoogleAccountId || googleAccount.accountId }),
        })
        const data = await res.json()
        if (data.success && Array.isArray(data.campaigns) && data.campaigns.length > 0) {
          googleCampaigns = data.campaigns
          googleTotals    = data.totals
          infos[1].status    = 'connected'
          infos[1].campaigns = googleCampaigns.length
          infos[1].spend     = googleTotals?.spend
          infos[1].leads     = googleTotals?.leads
        } else {
          infos[1].status = 'no_data'
        }
      } catch (e: any) {
        infos[1].status   = 'error'
        infos[1].errorMsg = e.message
      }
    }

    // Fallback: dados do audit cache (CSV ou upload manual)
    if (metaCampaigns.length === 0 && googleCampaigns.length === 0 && latestAudit?.campanhas?.length > 0) {
      const cached = latestAudit.campanhas
      metaCampaigns   = cached.filter((c: any) => /meta|facebook/i.test(c.platform || ''))
      googleCampaigns = cached.filter((c: any) => /google/i.test(c.platform || ''))
      metaTotals      = latestAudit.metaTotals   || null
      googleTotals    = latestAudit.googleTotals  || null
      if (metaCampaigns.length > 0)   { infos[0].status = 'connected'; infos[0].campaigns = metaCampaigns.length }
      if (googleCampaigns.length > 0) { infos[1].status = 'connected'; infos[1].campaigns = googleCampaigns.length }
    }

    setPlatforms([...infos])
    return { metaCampaigns, metaTotals, googleCampaigns, googleTotals }
  }, [connectedAccounts, latestAudit])

  // ── Persiste resultado no auditCache para sobreviver ao refresh ───────────
  const persistPipeline = useCallback((
    resultsMap: Record<string, any>,
    done: any,
  ) => {
    if (!clientName) return
    const entry = {
      _isPipeline: true,
      audit: {
        results:     resultsMap,
        doneEvent:   done,
        generated_at: new Date().toISOString(),
      },
    }
    // Insere ou atualiza a entrada do pipeline no auditCache (sem apagar auditorias existentes)
    const existing = Array.isArray(auditCache[clientName]) ? auditCache[clientName] : []
    const filtered = existing.filter((e: any) => !e?._isPipeline)
    setAuditCache(clientName, { _isPipeline: true, results: resultsMap, doneEvent: done, generated_at: new Date().toISOString() })
  }, [clientName, auditCache, setAuditCache])

  // ── Inicia o pipeline ─────────────────────────────────────────────────────
  const handleRun = useCallback(async () => {
    if (!clientData || running) return

    // Reset state
    setRunning(true)
    setFetchingData(true)
    setProgress({})
    setResults({})
    setErrors([])
    setDoneEvent(null)
    setCurrentAgent(null)
    setAgentTimes({})
    setTotalDuration(null)
    setActiveSection('progress')

    // Cancela requisição anterior se houver
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    let metaCampaigns:   any[] = []
    let metaTotals:      any   = null
    let googleCampaigns: any[] = []
    let googleTotals:    any   = null

    try {
      const liveData = await fetchLiveData()
      metaCampaigns   = liveData.metaCampaigns
      metaTotals      = liveData.metaTotals
      googleCampaigns = liveData.googleCampaigns
      googleTotals    = liveData.googleTotals
    } catch {}

    setFetchingData(false)

    const history = (campaignHistory || []).map((h: any) => ({
      period:      h.period || h.month,
      channel:     h.channel || h.platform,
      budgetSpent: h.spend,
      leads:       h.leads,
      cplReal:     h.cpl,
      conversions: h.conversions,
      outcome:     h.outcome || 'desconhecido',
      whatWorked:  h.whatWorked,
      whatFailed:  h.whatFailed,
    }))

    const payload = {
      clientName:       clientData.clientName,
      niche:            clientData.niche,
      budget:           clientData.budget || 0,
      objective:        clientData.objective || 'Gerar leads qualificados',
      monthlyRevenue:   clientData.monthlyRevenue || 0,
      city:             clientData.city,
      products:         clientData.products || [],
      currentCPL:       clientData.currentCPL,
      currentLeadSource: clientData.currentLeadSource,
      mainChallenge:    clientData.mainChallenge,
      nicheDetails:     clientData.nicheDetails || {},
      ticketPrice:      clientData.ticketPrice,
      grossMargin:      clientData.grossMargin,
      conversionRate:   clientData.conversionRate,
      isRecurring:      clientData.isRecurring,
      metaCampaigns,
      googleCampaigns,
      metaTotals,
      googleTotals,
      uploadedCampaigns: latestAudit?.campanhas?.filter((c: any) => !/meta|facebook|google/i.test(c.platform || '')) || [],
      campaignHistory:  history,
      reportFormat:     'executive',
    }

    const runStart = Date.now()

    let timeoutId: ReturnType<typeof setTimeout> | null = null

    try {
      // Timeout global de 5 minutos — mantido até o finally (cobre toda a leitura do stream)
      timeoutId = setTimeout(() => abortRef.current?.abort(), 5 * 60 * 1000)

      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => `Erro ${res.status}`)
        throw new Error(errText || `Erro ${res.status} ao iniciar pipeline`)
      }
      if (!res.body) throw new Error('Servidor não retornou stream. Tente novamente.')

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let   buffer  = ''
      const resultsMap: Record<string, any> = {}

      // Detecta inatividade: se o servidor não enviar nada por 120s, aborta
      // Deve ser maior que AGENT_TIMEOUT_MS (90s) no backend para que o backend envie agent_error antes
      const INACTIVITY_MS = 120_000
      const readWithTimeout = () => Promise.race([
        reader.read(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Servidor parou de responder por 120s. Tente novamente ou cancele.')),
            INACTIVITY_MS,
          )
        ),
      ])

      while (true) {
        const { done, value } = await readWithTimeout()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          let event: any
          try { event = JSON.parse(line.slice(6)) } catch { continue }

          switch (event.type) {
            case 'start':
              break

            case 'agent_start':
              setCurrentAgent(event.agent)
              setAgentTimes(t => ({ ...t, [event.agent]: Date.now() }))
              setProgress(p => ({ ...p, [event.agent]: 'running' }))
              break

            case 'agent_done':
              setProgress(p => ({ ...p, [event.agent]: 'done' }))
              setResults(r => { const next = { ...r, [event.agent]: event.result }; resultsMap[event.agent] = event.result; return next })
              setCurrentAgent(null)
              break

            case 'agent_error':
              setProgress(p => ({ ...p, [event.agent]: 'error' }))
              setErrors(e => [...e, { agent: event.agent, message: event.message }])
              setCurrentAgent(null)
              break

            case 'fatal_error':
              throw new Error(event.message || 'Erro interno no pipeline')

            case 'done':
              setDoneEvent(event)
              setTotalDuration(event.duration_ms || (Date.now() - runStart))
              persistPipeline(resultsMap, event)
              setLastRunAt(new Date().toISOString())
              setActiveSection('summary')
              break
          }
        }
      }
    } catch (e: any) {
      const isAbort = e?.name === 'AbortError'
      const msg = isAbort
        ? 'Análise cancelada pelo tempo limite (5 min). Tente com menos plataformas ou verifique a conexão.'
        : e.message || 'Erro de rede ao conectar com o servidor'
      setErrors(prev => [...prev, {
        agent: 'pipeline',
        message: msg,
      }])
    } finally {
      if (timeoutId !== null) clearTimeout(timeoutId)
      setRunning(false)
      setFetchingData(false)
      setCurrentAgent(null)
    }
  }, [clientData, running, fetchLiveData, campaignHistory, latestAudit, persistPipeline])

  // ── Derivações ────────────────────────────────────────────────────────────
  const hasResults  = Object.keys(results).length > 0
  const totalDone   = Object.values(progress).filter(s => s === 'done').length
  const totalAgents = 5
  const report      = doneEvent?.report || results['report'] || null
  const auditor     = results['auditor'] || null

  // Seções disponíveis baseadas nos resultados
  const sections = [
    { key: 'progress', label: 'Progresso', available: true },
    { key: 'summary',  label: 'Resumo', available: !!report },
    { key: 'problems', label: 'Problemas', available: !!auditor },
    { key: 'actions',  label: 'Plano de Ação', available: !!report?.plano_acao?.length },
    { key: 'report',   label: 'Relatório', available: !!report },
    { key: 'agents',   label: 'Agentes', available: hasResults },
  ].filter(s => s.available)

  const fmtDuration = (ms: number) => ms < 60000 ? `${Math.round(ms / 1000)}s` : `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(240,180,41,0.07) 0%, rgba(167,139,250,0.04) 100%)',
        border: '1px solid rgba(240,180,41,0.15)',
        borderRadius: 16, padding: 20,
      }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-white font-bold text-lg">Análise por Agentes IA</h2>
              {lastRunAt && (
                <span className="text-xs text-white/30">
                  Última análise: {new Date(lastRunAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  {totalDuration && ` · ${fmtDuration(totalDuration)}`}
                </span>
              )}
            </div>
            <p className="text-white/40 text-sm mt-0.5">5 agentes de IA em cadeia — diagnóstico completo da conta de anúncios</p>

            {/* Status das plataformas */}
            {platforms.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {platforms.map(p => <PlatformChip key={p.id} p={p} />)}
              </div>
            )}

            {/* Avisos */}
            {!running && platforms.length === 0 && (
              <div className="mt-2 text-xs text-white/30">
                {connectedAccounts.length === 0
                  ? '⚠ Nenhuma plataforma conectada — análise usará dados do briefing + benchmarks'
                  : '⚠ Clique em "Iniciar" para buscar dados das plataformas'}
              </div>
            )}
            {!running && !latestAudit && platforms.length === 0 && (
              <div className="mt-1 text-xs" style={{ color: C.gold }}>
                💡 Conecte Meta Ads ou Google Ads para usar dados reais
              </div>
            )}
          </div>

          <button
            onClick={handleRun}
            disabled={running}
            style={{
              background: running ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg, #F0B429 0%, #FFD166 100%)',
              color: running ? '#555' : '#000',
              fontWeight: 700, fontSize: 14,
              padding: '10px 20px', borderRadius: 10,
              border: 'none', cursor: running ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
          >
            {fetchingData ? '⟳ Buscando dados...' : running ? '⏳ Analisando...' : hasResults ? '🔄 Re-analisar' : '▶ Iniciar Análise'}
          </button>
        </div>
      </div>

      {/* ── Tabs de seção ─────────────────────────────────────────────────── */}
      {(running || hasResults) && (
        <div className="flex gap-1 overflow-x-auto pb-1">
          {sections.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key as any)}
              style={{
                background: activeSection === s.key ? 'rgba(240,180,41,0.15)' : 'rgba(255,255,255,0.04)',
                border: activeSection === s.key ? '1px solid rgba(240,180,41,0.35)' : '1px solid rgba(255,255,255,0.06)',
                color: activeSection === s.key ? C.gold : '#666',
                fontSize: 12, fontWeight: 600,
                padding: '6px 14px', borderRadius: 8,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Progresso ─────────────────────────────────────────────────────── */}
      {activeSection === 'progress' && (running || hasResults) && (
        <div style={{ background: '#0A0A14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }} className="p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/50 text-sm font-medium">Agentes de IA</span>
            <span className="text-white/30 text-xs font-mono">{totalDone}/{totalAgents} concluídos</span>
          </div>
          <div className="space-y-3">
            {AGENTS.map(({ key, icon, label, desc }) => {
              const st      = progress[key] || 'pending'
              const started = agentTimes[key]
              const elapsed = started && st === 'running' ? Math.round((Date.now() - started) / 1000) : null
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className={`text-base shrink-0 ${st === 'running' ? 'animate-pulse' : ''}`}>{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm truncate ${
                        st === 'done' ? 'text-white/80' : st === 'running' ? 'text-white font-semibold' : 'text-white/25'
                      }`}>{label}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        {elapsed !== null && <span className="text-xs font-mono" style={{ color: C.gold }}>{elapsed}s</span>}
                        <AgentStatusDot status={st} />
                      </div>
                    </div>
                    <div className={`text-xs mt-0.5 ${st === 'running' ? 'text-white/40' : 'text-white/15'}`}>{desc}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Barra de progresso */}
          <div className="mt-4 h-1 bg-white/[0.05] rounded-full overflow-hidden">
            <div
              style={{
                width: `${(totalDone / totalAgents) * 100}%`,
                background: 'linear-gradient(90deg, #F0B429, #22C55E)',
                transition: 'width 0.6s ease',
              }}
              className="h-full rounded-full"
            />
          </div>

          {running && (
            <p className="text-center text-xs mt-3" style={{ color: '#555' }}>
              {fetchingData ? 'Buscando dados das plataformas...' : currentAgent ? `Agente em execução: ${AGENT_LABELS_SHORT[currentAgent] || currentAgent}...` : 'Iniciando...'}
            </p>
          )}
        </div>
      )}

      {/* ── Resumo executivo ──────────────────────────────────────────────── */}
      {activeSection === 'summary' && report && (
        <div className="space-y-4">
          {/* Score + sumário */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(240,180,41,0.07) 0%, rgba(34,197,94,0.04) 100%)',
            border: '1px solid rgba(240,180,41,0.2)', borderRadius: 16, padding: 20,
          }}>
            <div className="flex items-start gap-4">
              <ScoreRing score={report.score_geral || 0} grade={report.grade || '—'} size={76} />
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-base">{report.titulo}</div>
                <div className="text-white/30 text-xs mt-0.5">{report.plataformas}</div>
                <p className="text-white/65 text-sm mt-2 leading-relaxed">{report.sumario_executivo}</p>
              </div>
            </div>
          </div>

          {/* KPIs */}
          {report.kpis_chave?.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {report.kpis_chave.map((kpi: any, i: number) => (
                <div key={i} style={{ background: '#0A0A14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }} className="p-3">
                  <div className="text-white/30 text-xs">{kpi.nome}</div>
                  <div className="text-white font-mono font-bold text-sm mt-1">{kpi.valor}</div>
                  <div style={{ color: STATUS_COLOR[kpi.status] || '#aaa' }} className="text-xs capitalize mt-0.5">{kpi.status}</div>
                  {kpi.benchmark && <div className="text-white/20 text-xs mt-0.5">{kpi.benchmark}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Principais descobertas */}
          {report.principais_descobertas?.length > 0 && (
            <div style={{ background: '#0A0A14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }} className="p-4">
              <div className="text-white/30 text-xs uppercase tracking-wider mb-3">Principais Descobertas</div>
              {report.principais_descobertas.map((d: string, i: number) => (
                <div key={i} className="flex gap-3 mb-2.5">
                  <span style={{ color: C.blue }} className="text-xs mt-0.5 shrink-0">◆</span>
                  <span className="text-white/70 text-sm">{d}</span>
                </div>
              ))}
            </div>
          )}

          {/* Alertas imediatos */}
          {report.alertas_imediatos?.length > 0 && (
            <div style={{ background: `${C.red}08`, border: `1px solid ${C.red}25`, borderRadius: 14 }} className="p-4">
              <div style={{ color: C.red }} className="text-xs uppercase tracking-wider mb-2 font-semibold">⚠ Alertas Imediatos</div>
              {report.alertas_imediatos.map((a: string, i: number) => (
                <div key={i} className="text-sm mb-1.5" style={{ color: '#FCA5A5' }}>{a}</div>
              ))}
            </div>
          )}

          {/* Riscos + Oportunidades */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {report.riscos_criticos?.length > 0 && (
              <div style={{ background: '#0A0A14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }} className="p-4">
                <div className="text-white/30 text-xs uppercase tracking-wider mb-2">Riscos Críticos</div>
                {report.riscos_criticos.map((r: string, i: number) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <span style={{ color: C.red }} className="text-xs shrink-0 mt-0.5">!</span>
                    <span className="text-white/60 text-sm">{r}</span>
                  </div>
                ))}
              </div>
            )}
            {report.oportunidades_principais?.length > 0 && (
              <div style={{ background: '#0A0A14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }} className="p-4">
                <div className="text-white/30 text-xs uppercase tracking-wider mb-2">Oportunidades</div>
                {report.oportunidades_principais.map((o: string, i: number) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <span style={{ color: C.green }} className="text-xs shrink-0 mt-0.5">✦</span>
                    <span className="text-white/60 text-sm">{o}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Problemas encontrados (Auditor) ───────────────────────────────── */}
      {activeSection === 'problems' && auditor && (
        <div className="space-y-4">
          <div style={{ background: '#0A0A14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }} className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <ScoreRing score={auditor.score_conta || 0} grade={auditor.grade || '—'} size={52} />
              <div>
                <div className="text-white font-semibold text-sm">Score da Conta</div>
                <p className="text-white/60 text-xs mt-0.5 leading-relaxed">{auditor.resumo_executivo}</p>
              </div>
            </div>
          </div>

          {/* Gargalos */}
          {auditor.gargalos?.length > 0 && (
            <div>
              <div className="text-white/30 text-xs uppercase tracking-wider mb-2">Gargalos Identificados</div>
              {auditor.gargalos.map((g: any, i: number) => (
                <div key={i} style={{ background: '#0A0A14', border: `1px solid ${C.red}25`, borderRadius: 12, marginBottom: 8 }} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-white font-semibold text-sm">{g.titulo}</div>
                      <div className="text-white/55 text-xs mt-1 leading-relaxed">{g.descricao}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div style={{ color: C.red }} className="text-xs font-semibold font-mono">{g.impacto}</div>
                      {g.plataforma && <div className="text-white/20 text-xs mt-0.5">{g.plataforma}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Oportunidades */}
          {auditor.oportunidades?.length > 0 && (
            <div>
              <div className="text-white/30 text-xs uppercase tracking-wider mb-2">Oportunidades Detectadas</div>
              {auditor.oportunidades.map((o: any, i: number) => (
                <div key={i} style={{ background: '#0A0A14', border: `1px solid ${C.green}25`, borderRadius: 12, marginBottom: 8 }} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-white font-semibold text-sm">{o.titulo}</div>
                      <div className="text-white/55 text-xs mt-1 leading-relaxed">{o.descricao}</div>
                    </div>
                    <div style={{ color: C.green }} className="text-xs font-semibold shrink-0">{o.potencial}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Campanhas destaque */}
          {auditor.campanhas_destaque?.length > 0 && (
            <div>
              <div className="text-white/30 text-xs uppercase tracking-wider mb-2">Campanhas — Ação Recomendada</div>
              {auditor.campanhas_destaque.map((c: any, i: number) => (
                <div key={i} style={{ background: '#0A0A14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, marginBottom: 6 }} className="p-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-white/70 text-sm">{c.nome}</span>
                    <div className="text-white/30 text-xs mt-0.5">{c.motivo}</div>
                  </div>
                  <Badge
                    label={c.acao}
                    color={c.acao === 'ESCALAR' ? C.green : c.acao === 'PAUSAR' ? C.red : C.gold}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Plano de Ação ─────────────────────────────────────────────────── */}
      {activeSection === 'actions' && report?.plano_acao?.length > 0 && (
        <div className="space-y-4">
          <div className="text-white/30 text-xs uppercase tracking-wider">
            Plano de Ação — {report.plano_acao.length} ações priorizadas
          </div>

          {/* Próximos passos imediatos */}
          {report.proximos_passos_imediatos?.length > 0 && (
            <div style={{ background: `${C.green}08`, border: `1px solid ${C.green}25`, borderRadius: 14 }} className="p-4">
              <div style={{ color: C.green }} className="text-xs font-semibold uppercase tracking-wider mb-2">✓ Próximos 7 dias</div>
              {report.proximos_passos_imediatos.map((p: string, i: number) => (
                <div key={i} className="flex gap-2 mb-1.5">
                  <span style={{ color: C.green }} className="text-xs shrink-0 mt-0.5">→</span>
                  <span className="text-white/70 text-sm">{p}</span>
                </div>
              ))}
            </div>
          )}

          {/* Lista completa de ações */}
          {(['critica', 'alta', 'media', 'baixa'] as const).map(prio => {
            const acoes = report.plano_acao.filter((a: any) => a.prioridade === prio)
            if (!acoes.length) return null
            return (
              <div key={prio}>
                <div className="text-white/20 text-xs uppercase tracking-wider mb-2">
                  Prioridade {prio}
                </div>
                <div className="space-y-2">
                  {acoes.map((a: any, i: number) => (
                    <div key={i} style={{
                      background: '#0A0A14',
                      border: `1px solid ${PRIORIDADE_COLOR[a.prioridade] || '#333'}30`,
                      borderRadius: 12,
                    }} className="p-4">
                      <div className="flex items-start gap-2 flex-wrap mb-2">
                        <Badge label={a.prioridade?.toUpperCase()} color={PRIORIDADE_COLOR[a.prioridade]} />
                        <Badge label={a.categoria} />
                        <Badge label={a.prazo} />
                        {a.plataforma && <Badge label={a.plataforma} color={a.plataforma === 'meta' ? '#1877F2' : a.plataforma === 'google' ? '#34A853' : undefined} />}
                      </div>
                      <div className="text-white font-semibold text-sm">{a.titulo}</div>
                      <div className="text-white/55 text-xs mt-1 leading-relaxed">{a.descricao}</div>
                      {a.como && <div className="text-white/35 text-xs mt-1.5 border-t border-white/[0.04] pt-1.5">{a.como}</div>}
                      {a.impacto && <div style={{ color: C.gold }} className="text-xs mt-1.5 font-medium">→ {a.impacto}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Projeção 90 dias */}
          {report.projecao_90_dias && (
            <div style={{ background: '#0A0A14', border: `1px solid ${C.purple}25`, borderRadius: 14 }} className="p-4">
              <div style={{ color: C.purple }} className="text-xs font-semibold uppercase tracking-wider mb-2">📈 Projeção 90 dias</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-white/30 text-xs mb-1">Cenário atual (sem mudanças)</div>
                  <div className="text-white/70 text-sm">{report.projecao_90_dias.cenario_base}</div>
                </div>
                <div>
                  <div style={{ color: C.green }} className="text-xs mb-1 font-semibold">Cenário otimizado (executando o plano)</div>
                  <div className="text-white/70 text-sm">{report.projecao_90_dias.cenario_otimizado}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Relatório Final ───────────────────────────────────────────────── */}
      {activeSection === 'report' && report && (
        <div className="space-y-4">
          {/* Resumo para o cliente */}
          {report.sumario_cliente && (
            <div style={{ background: `${C.blue}08`, border: `1px solid ${C.blue}25`, borderRadius: 14 }} className="p-4">
              <div style={{ color: C.blue }} className="text-xs font-semibold uppercase tracking-wider mb-2">👤 Resumo para o cliente</div>
              <p className="text-white/70 text-sm leading-relaxed">{report.sumario_cliente}</p>
            </div>
          )}

          {/* Slide pitch */}
          {report.slide_pitch && (
            <div style={{ background: '#0A0A14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-white/30 text-xs uppercase tracking-wider">Slide para reunião</div>
                <button
                  onClick={() => navigator.clipboard.writeText(report.slide_pitch)}
                  style={{ color: C.gold, fontSize: 11, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  📋 Copiar
                </button>
              </div>
              <div className="text-white/70 text-sm whitespace-pre-line leading-relaxed font-mono">
                {report.slide_pitch}
              </div>
            </div>
          )}

          {/* Sumário executivo completo */}
          <div style={{ background: '#0A0A14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-white/30 text-xs uppercase tracking-wider">Resumo técnico completo</div>
              <button
                onClick={() => {
                  const text = [
                    `DIAGNÓSTICO 360° — ${report.cliente}`,
                    `Score: ${report.score_geral}/100 ${report.grade}`,
                    `\n${report.sumario_executivo}`,
                    report.principais_descobertas?.length ? `\nDESCOBERTAS:\n${report.principais_descobertas.map((d: string) => `• ${d}`).join('\n')}` : '',
                    report.proximos_passos_imediatos?.length ? `\nPRÓXIMOS PASSOS:\n${report.proximos_passos_imediatos.map((p: string) => `✓ ${p}`).join('\n')}` : '',
                  ].filter(Boolean).join('\n')
                  navigator.clipboard.writeText(text)
                }}
                style={{ color: C.gold, fontSize: 11, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                📋 Copiar
              </button>
            </div>
            <p className="text-white/65 text-sm leading-relaxed">{report.sumario_executivo}</p>
          </div>
        </div>
      )}

      {/* ── Detalhes por agente ───────────────────────────────────────────── */}
      {activeSection === 'agents' && hasResults && (
        <div className="space-y-3">
          <div className="text-white/30 text-xs uppercase tracking-wider">Resultados por Agente</div>
          {AGENTS.map(({ key, icon, label }) => (
            <AgentDetail key={key} agentKey={key} result={results[key]} icon={icon} label={label} />
          ))}
        </div>
      )}

      {/* ── Erros ─────────────────────────────────────────────────────────── */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((e, i) => (
            <div key={i} style={{
              background: `${C.red}08`, border: `1px solid ${C.red}25`, borderRadius: 12,
            }} className="p-3">
              <div style={{ color: '#F87171' }} className="text-sm">
                <span className="font-semibold capitalize">{e.agent}:</span>{' '}
                {e.message}
              </div>
              {e.agent === 'pipeline' && (
                <div className="text-xs text-white/30 mt-1">
                  Tente reanalisar. Se o erro persistir, verifique a conexão com as plataformas ou reduza o período de análise.
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {!running && !hasResults && errors.length === 0 && (
        <div className="text-center py-14">
          <div className="text-5xl mb-4">🤖</div>
          <div className="text-white/40 text-sm font-medium">Análise por Agentes IA</div>
          <div className="text-white/20 text-xs mt-1 mb-6">5 agentes de IA em cadeia: Auditor → Data Analyst → Estrategista → Copywriter → Report</div>
          <div className="space-y-2 max-w-xs mx-auto text-left">
            {[
              connectedAccounts.some(a => a.platform === 'meta') ? '✓ Meta Ads conectado' : '○ Meta Ads não conectado',
              connectedAccounts.some(a => a.platform === 'google') ? '✓ Google Ads conectado' : '○ Google Ads não conectado',
              latestAudit ? '✓ Dados de auditoria disponíveis' : '○ Sem auditoria anterior',
            ].map((item, i) => (
              <div key={i} style={{
                color: item.startsWith('✓') ? C.green : '#444',
                fontSize: 12,
              }}>
                {item}
              </div>
            ))}
          </div>
          <div className="text-white/15 text-xs mt-4">Duração estimada: 2–4 minutos</div>
        </div>
      )}
    </div>
  )
}

// Labels curtos para exibição em progresso
const AGENT_LABELS_SHORT: Record<string, string> = {
  auditor:      'Auditor',
  data_analyst: 'Data Analyst',
  estrategista: 'Estrategista',
  copywriter:   'Copywriter',
  report:       'Report',
}
