// components/dashboard/v2/NousRail.tsx
// NOUS copiloto — rail (>=1280px) ou drawer (<1280px). Abas Insights/Perguntas (fiel ao prototype).
// Chat ligado ao /api/nous real; Insights derivado dos dados reais do cliente.
'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { Icon } from './Icon'

interface Message { role: 'user' | 'assistant'; content: string; proposedAction?: { campaignId: string; campaignName?: string; platform?: 'meta' | 'google'; action: 'pause' | 'scale'; reason?: string } }
interface NousRailProps { open: boolean; onClose: () => void; docked?: boolean }

const SUGGESTIONS = ['Como estão meus KPIs?', 'Qual campanha tem melhor ROAS?', 'O que eu faço esta semana?']

// Render simples de **negrito** (a resposta do NOUS usa markdown leve).
function renderRich(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i}>{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>)
}

export function NousOrb({ size = 40, thinking = false }: { size?: number; thinking?: boolean }) {
  const id = useMemo(() => 'orb' + Math.random().toString(36).slice(2, 6), [])
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className="block shrink-0">
      <defs>
        <radialGradient id={id} cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="#5B9BFF" /><stop offset="55%" stopColor="#2C5FE0" /><stop offset="100%" stopColor="#0E9CB0" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="none" stroke="#2C5FE0" strokeOpacity="0.18" strokeWidth="1" />
      <circle cx="24" cy="24" r="22" fill="none" stroke="#0E9CB0" strokeOpacity="0.25" strokeWidth="1.4" strokeDasharray="34 100" strokeLinecap="round"
        style={{ transformOrigin: '24px 24px', animation: `spin ${thinking ? '1.4s' : '9s'} linear infinite` }} />
      <circle cx="24" cy="24" r="13" fill={`url(#${id})`} style={{ animation: 'orbPulse 2.6s ease-in-out infinite' }} />
      <circle cx="20" cy="20" r="3.6" fill="#fff" fillOpacity="0.9" />
      <circle cx="28" cy="27" r="1.8" fill="#fff" fillOpacity="0.55" />
    </svg>
  )
}

interface InsightItem { tone: 'bad' | 'warn' | 'good' | 'blue'; title: string; tag?: string; body?: string; campaignId?: string; campaignName?: string; action?: 'pause' | 'scale'; platform?: 'meta' | 'google' }

function InsightCard({ tone, title, tag, body, action, onAct, onExecute, executing }: InsightItem & { onAct?: () => void; onExecute?: () => void; executing?: boolean }) {
  const C: Record<string, string> = { bad: '#E1483F', warn: '#E08B0B', good: '#0E9E6E', blue: '#2C5FE0' }
  const icon = tone === 'bad' ? 'alert' : tone === 'warn' ? 'flag' : 'spark'
  const c = C[tone]
  return (
    <div className="bg-paper border border-line rounded-sm p-3 hover:shadow-card-hover transition-shadow" style={{ borderLeft: `3px solid ${c}` }}>
      <div className="flex items-center gap-2 mb-1.5">
        <span style={{ color: c }} className="flex"><Icon name={icon} size={14} /></span>
        <span className="text-[13px] font-semibold flex-1 text-ink" style={{ letterSpacing: '-0.01em' }}>{title}</span>
        {tag && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-pill" style={{ color: c, background: `${c}14` }}>{tag}</span>}
      </div>
      {body && <div className="text-xs text-ink-2 leading-relaxed">{body}</div>}
      <div className="flex items-center gap-3 mt-2">
        {action && onExecute && (
          <button onClick={onExecute} disabled={executing}
            className="text-xs font-bold inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-white disabled:opacity-60"
            style={{ background: action === 'pause' ? '#E1483F' : '#0E9E6E' }}>
            {executing ? 'Executando…' : action === 'pause' ? <>Pausar agora</> : <>Escalar +20%</>}
          </button>
        )}
        {onAct && <button onClick={onAct} className="text-xs font-semibold text-blue inline-flex items-center gap-1 hover:gap-1.5 transition-all">Ver no Desempenho <Icon name="chevR" size={13} /></button>}
      </div>
    </div>
  )
}

// Cache de insights ao vivo por cliente|conta (evita refetch a cada navegação na sessão).
const INSIGHTS_CACHE = new Map<string, InsightItem[]>()

export function NousRail({ open, onClose, docked = true }: NousRailProps) {
  const clientData = useAppStore(s => s.clientData)
  const auditCache = useAppStore(s => s.auditCache)
  const strategyData = useAppStore(s => s.strategyData)
  const dashboardMode = useAppStore(s => s.dashboardMode)
  const connectedAccounts = useAppStore(s => s.connectedAccounts)
  const selectedMetaAccountByClient = useAppStore(s => s.selectedMetaAccountByClient)

  const [tab, setTab] = useState<'insights' | 'perguntas'>('insights')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])

  const key = clientData?.clientName || ''
  const latestAudit: any = key ? auditCache[key]?.[0]?.audit : null
  const rm = latestAudit?._realMetrics
  const hasRealData = !!(rm && (rm.totalSpend > 0 || rm.totalLeads > 0))

  // Insights reais (briefing + alertas/ações)
  const briefing = latestAudit?.executive_summary || strategyData?.strategy?.growth_thesis
    || (rm ? `Conta com ${Number(rm.totalSpend).toLocaleString('pt-BR')} investidos e ${rm.totalLeads} leads.` : 'Rode a Análise Profunda para um briefing com os dados reais da conta.')
  const auditInsights: InsightItem[] =
    (latestAudit?.o_que_eu_faria_agora || []).filter((a: any) => a?.titulo).slice(0, 4)
      .map((a: any) => ({ tone: a.prioridade === 'P1' ? 'bad' as const : a.prioridade === 'P2' ? 'warn' as const : 'blue' as const, title: a.titulo, tag: a.prioridade, body: a.motivo || a.evidencia }))

  // Insights ao vivo — lê as campanhas reais do Meta (sem precisar rodar a Análise Profunda).
  const metaConnected = connectedAccounts.some(a => a.platform === 'meta')
  const metaAccountId = (key && selectedMetaAccountByClient[key]) || connectedAccounts.find(a => a.platform === 'meta')?.accountId || ''
  const [liveInsights, setLiveInsights] = useState<InsightItem[]>([])
  const [liveLoading, setLiveLoading] = useState(false)
  const [executingId, setExecutingId] = useState<string | null>(null)

  // Fecha o loop com APROVAÇÃO EXPLÍCITA: 1) preview do plano exato (sem executar)
  // → 2) o usuário aprova o plano específico → 3) executa. Nada vai ao Meta sem o OK.
  const executeInsight = async (ins: InsightItem) => {
    if (!ins.campaignId || !ins.action) return
    const isGoogle = ins.platform === 'google'
    const endpoint = isGoogle ? '/api/google/campaign/action' : '/api/meta/campaign/action'
    const canalLabel = isGoogle ? 'Google Ads' : 'Meta Ads'
    // accountId só para Meta; no Google a rota usa a conta da conexão (evita mandar id errado).
    const payload = { action: ins.action, id: ins.campaignId, accountId: isGoogle ? undefined : (metaAccountId || undefined), clientName: key, campaignName: ins.campaignName }
    setExecutingId(ins.campaignId)
    try {
      // 1) Preview — calcula exatamente o que vai mudar, sem tocar na conta.
      const prev = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, dryRun: true }),
      })
      const pd = await prev.json()
      if (!pd?.success) {
        if (typeof window !== 'undefined') window.toast?.({ tone: 'bad', title: 'Não foi possível', body: pd?.error || 'Tente novamente.' })
        return
      }
      // 2) Aprovação explícita do plano ESPECÍFICO (qual alvo, de/para).
      if (typeof window !== 'undefined' && !window.confirm(`${pd.plan}\n\nConfirmar e executar no ${canalLabel}?`)) return
      // 3) Executa só após o OK.
      const res = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const d = await res.json()
      if (typeof window !== 'undefined') window.toast?.(d?.success
        ? { tone: 'good', title: 'Ação executada', body: d.message }
        : { tone: 'bad', title: 'Não foi possível', body: d?.error || 'Tente novamente.' })
      if (d?.success) {
        INSIGHTS_CACHE.delete(`${key}|${metaAccountId}`)
        setLiveInsights(prev => prev.filter(x => x !== ins))
      }
    } catch {
      if (typeof window !== 'undefined') window.toast?.({ tone: 'bad', title: 'Falha de conexão' })
    } finally { setExecutingId(null) }
  }
  useEffect(() => {
    if (!metaConnected || !key) { setLiveInsights([]); return }
    const cacheKey = `${key}|${metaAccountId}`
    if (INSIGHTS_CACHE.has(cacheKey)) { setLiveInsights(INSIGHTS_CACHE.get(cacheKey)!); return }
    let active = true
    setLiveLoading(true)
    fetch('/api/insights', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ niche: clientData?.niche, accountId: metaAccountId || undefined, ticket: clientData?.ticketPrice, margin: clientData?.grossMargin, convRate: clientData?.conversionRate }),
    })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        const list = (d?.success && Array.isArray(d.insights)) ? d.insights : []
        INSIGHTS_CACHE.set(cacheKey, list)
        if (active) setLiveInsights(list)
      })
      .catch(() => { if (active) setLiveInsights([]) })
      .finally(() => { if (active) setLiveLoading(false) })
    return () => { active = false }
  }, [metaConnected, key, metaAccountId, clientData?.niche])

  // Prioriza insights ao vivo (específicos); completa com os da auditoria.
  const insights = [...liveInsights, ...auditInsights].slice(0, 6)

  const buildContext = () => {
    const l: string[] = ['=== STATUS DOS DADOS — LEIA PRIMEIRO ===']
    l.push(`Dados reais de campanha: ${hasRealData ? `SIM — ${rm.campaignCount || '?'} campanhas, R$${Number(rm.totalSpend).toLocaleString('pt-BR')} investidos, ${rm.totalLeads} leads, CPL R$${rm.avgCPL ?? '—'}` : 'NÃO'}`)
    l.push(`Análise Profunda: ${latestAudit ? 'SIM' : 'NÃO'}`)
    if (latestAudit?.health_score) l.push(`Score de saúde: ${latestAudit.health_score}/100 (${latestAudit.grade || '—'})`)
    if (clientData) {
      l.push('\n=== CLIENTE ==='); l.push(`Cliente: ${clientData.clientName}`); l.push(`Nicho: ${clientData.niche}`)
      l.push(`Budget mensal: R$${(clientData.budget || 0).toLocaleString('pt-BR')}`); l.push(`Objetivo: ${clientData.objective || '—'}`)
      if (clientData.city) l.push(`Cidade: ${clientData.city}`)
    }
    const gargalos = latestAudit?.gargalos
    if (Array.isArray(gargalos) && gargalos.length) l.push(`\nMaiores gargalos: ${gargalos.slice(0, 3).map((g: any) => g.titulo).filter(Boolean).join('; ')}`)
    return l.join('\n')
  }

  const send = async (text: string) => {
    const msg = text.trim()
    if (!msg || isTyping) return
    setTab('perguntas')
    const history = messages.slice(-6)
    setMessages(m => [...m, { role: 'user', content: msg }])
    setInput(''); setIsTyping(true)
    try {
      // Campanhas em desperdício da auditoria (com id real) — viram candidatas a pausar
      // pelo NOUS, mesmo que não estejam nos insights ao vivo (que ele costuma citar).
      const actionableCampaigns = (latestAudit?._wasteCampaigns || [])
        .filter((c: any) => c?.id)
        .slice(0, 8)
        .map((c: any) => ({ campaignId: String(c.id), campaignName: c.name || c.campaign_name || 'campanha', platform: c.platform === 'google' ? 'google' : 'meta', action: 'pause' as const }))
      const res = await fetch('/api/nous', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, context: buildContext(), niche: clientData?.niche, city: clientData?.city, hasRealData, viewMode: dashboardMode, history, clientName: key, liveInsights, metaAccountId, actionableCampaigns }),
      })
      const data = await res.json()
      setMessages(m => [...m, { role: 'assistant', content: data?.reply || data?.error || 'Não consegui responder agora.', proposedAction: data?.proposedAction || undefined }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Falha de conexão. Tente novamente.' }])
    } finally { setIsTyping(false) }
  }

  if (!open) return null

  return (
    <>
      {!docked && <div className="fixed inset-0 bg-ink/20 z-40" onClick={onClose} />}
      <aside className={`${docked ? 'w-[340px] border-l border-line' : 'fixed right-0 top-0 bottom-0 w-[340px] z-50 shadow-card-hover'} h-screen bg-paper flex flex-col`.trim()}>
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-line shrink-0">
          <div className="flex items-center gap-3">
            <NousOrb size={40} thinking={isTyping} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold tracking-wide text-ink">NOUS</span>
                <span className="inline-flex items-center gap-1 text-[10.5px] font-mono"><span className="pulse-dot" /><span className="text-green-600">online</span></span>
              </div>
              <div className="text-[11.5px] text-ink-3">Inteligência que decide</div>
            </div>
            <button onClick={onClose} title="Recolher" aria-label="Recolher o NOUS" className="p-1 text-ink-3 hover:text-ink"><Icon name="chevR" size={18} /></button>
          </div>
          <div className="flex gap-0.5 mt-3 bg-canvas-2 rounded-sm p-0.5">
            {(['insights', 'perguntas'] as const).map(k => (
              <button key={k} onClick={() => setTab(k)}
                className={`flex-1 py-1.5 text-[12.5px] rounded-[6px] transition-all ${tab === k ? 'bg-paper text-ink font-semibold shadow-sm' : 'text-ink-3 font-medium'}`}>
                {k === 'insights' ? 'Insights' : 'Perguntas'}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        {tab === 'insights' ? (
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 no-sb">
            <div className="rounded-md p-3.5 border border-blue-line" style={{ background: 'linear-gradient(135deg, var(--blue-soft), var(--green-soft))' }}>
              <div className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-blue-600 mb-1.5">Briefing de hoje</div>
              <div className="text-[13px] leading-relaxed text-ink line-clamp-5">{briefing}</div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-ink-3">Insights em destaque</div>
              {liveInsights.length > 0 && <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-green-600"><span className="pulse-dot" />ao vivo</span>}
            </div>
            {insights.length > 0 ? insights.map((a, i) => <InsightCard key={i} {...a} executing={!!a.campaignId && executingId === a.campaignId} onExecute={a.action && a.campaignId ? () => executeInsight(a) : undefined} onAct={() => (window.location.href = liveInsights.length > 0 ? '/desempenho' : '/diagnostico')} />)
              : liveLoading ? <p className="text-xs text-ink-3 text-center py-6">Lendo suas campanhas…</p>
              : metaConnected ? <p className="text-xs text-ink-3 text-center py-6">Nenhuma observação crítica nas campanhas agora. 👍</p>
              : <p className="text-xs text-ink-3 text-center py-6">Conecte o Meta Ads para ver insights da sua conta.</p>}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-3.5 no-sb">
            {messages.length === 0 && (
              <div className="text-center text-ink-3 text-[12.5px] py-6">
                <div className="flex justify-center"><NousOrb size={48} /></div>
                <div className="mt-2.5">Pergunte qualquer coisa sobre seus dados.</div>
              </div>
            )}
            <div className="space-y-2.5">
              {messages.map((m, i) => (
                <div key={i}>
                  <div className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-3 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-blue text-white rounded-xl rounded-br-[3px]' : 'bg-paper border border-line text-ink rounded-xl rounded-bl-[3px]'}`}>{m.role === 'assistant' ? renderRich(m.content) : m.content}</div>
                  </div>
                  {/* Ação proposta pelo NOUS na conversa — aprovação explícita (dryRun → confirmar → executar) */}
                  {m.role === 'assistant' && m.proposedAction && (
                    <div className="flex justify-start mt-1.5">
                      <button
                        onClick={() => executeInsight(m.proposedAction as any)}
                        disabled={executingId === m.proposedAction.campaignId}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-[12.5px] font-semibold disabled:opacity-60"
                        style={{ background: m.proposedAction.action === 'pause' ? '#E1483F' : '#0E9E6E' }}>
                        <Icon name={m.proposedAction.action === 'pause' ? 'alert' : 'arrowUp'} size={14} />
                        {executingId === m.proposedAction.campaignId
                          ? 'Aguarde…'
                          : `${m.proposedAction.action === 'pause' ? 'Pausar' : 'Escalar +20%'} "${(m.proposedAction.campaignName || 'campanha').slice(0, 28)}"`}
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {isTyping && <div className="flex gap-1 text-ink-4 px-1"><span className="pulse-dot" /><span className="pulse-dot" style={{ animationDelay: '.15s' }} /><span className="pulse-dot" style={{ animationDelay: '.3s' }} /></div>}
              <div ref={endRef} />
            </div>
          </div>
        )}

        {/* Suggestions + input */}
        <div className="border-t border-line p-3 bg-paper-2 shrink-0">
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => send(s)} disabled={isTyping}
                className="text-[11.5px] text-ink-2 bg-paper border border-line rounded-pill px-2.5 py-1 hover:border-blue-line hover:text-blue-600 disabled:opacity-50 transition-colors">{s}</button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 bg-paper border border-line rounded-pill pl-3.5 pr-1 py-1">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(input)}
              aria-label="Pergunte ao NOUS" placeholder="Pergunte ao NOUS…" className="flex-1 bg-transparent text-[13px] text-ink placeholder:text-ink-3 outline-none border-none" />
            <button onClick={() => send(input)} disabled={!input.trim() || isTyping} aria-label="Enviar pergunta"
              className="w-8 h-8 rounded-full bg-blue text-white flex items-center justify-center shrink-0 disabled:opacity-50"><Icon name="send" size={15} /></button>
          </div>
        </div>
      </aside>
    </>
  )
}
