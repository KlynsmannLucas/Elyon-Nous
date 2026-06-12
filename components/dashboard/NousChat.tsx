// components/dashboard/NousChat.tsx — IA NOUS: assistente estratégico por nicho
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAppStore, type ClientData, type CampaignRecord, type NousMessage } from '@/lib/store'
import { getCurrentNicheFromOnboarding } from '@/lib/nicheConfigs'
import { getBenchmark, getBenchmarkSummary, getCreativeAngles, getSeasonalityContext, BENCHMARKS } from '@/lib/niche_benchmarks'

interface Props {
  clientData: ClientData | null
  strategy: Record<string, any>
  campaignHistory: CampaignRecord[]
}

const QUICK_PROMPTS = [
  'O que devo priorizar agora?',
  'Como reduzir meu CPL?',
  'O que está desperdiçando verba?',
  'Como escalar sem perder qualidade?',
  'Quais criativos testar primeiro?',
  'Como melhorar a taxa de conversão?',
]

export function NousChat({ clientData, strategy, campaignHistory }: Props) {
  const auditCache            = useAppStore((s) => s.auditCache)
  const pendingActionsCache   = useAppStore((s) => s.pendingActionsCache)
  const clientHealthScores    = useAppStore((s) => s.clientHealthScores)
  const nousConversations     = useAppStore((s) => s.nousConversations)
  const addNousMessage        = useAppStore((s) => s.addNousMessage)
  const clearNousConversation = useAppStore((s) => s.clearNousConversation)

  const clientName = clientData?.clientName || '__global__'
  const messages: NousMessage[] = nousConversations[clientName] || []

  // Compute data availability at component level so it can be passed to the API
  const cn = clientData?.clientName
  const latestAudit = cn && auditCache[cn]?.length > 0 ? auditCache[cn][0] : null
  const realMetrics = latestAudit ? (latestAudit.audit as any)?._realMetrics : null
  const hasRealCampaignData = !!(realMetrics && realMetrics.totalSpend > 0)
  const hasBenchmark = !!(clientData?.niche)

  const [open, setOpen]   = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null)
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Abre o chat ao receber o evento global (menu lateral / cards "Perguntar para a IA").
  // Preenche a pergunta no input — credit-safe: NÃO envia sozinho, o usuário confirma.
  useEffect(() => {
    const handler = (e: Event) => {
      setOpen(true)
      const q = (e as CustomEvent).detail?.question
      if (q) {
        setInput(q)
        setTimeout(() => inputRef.current?.focus(), 150)
      }
    }
    window.addEventListener('elyon:open-nous', handler)
    return () => window.removeEventListener('elyon:open-nous', handler)
  }, [])

  // Sync conversas ao banco com debounce de 2s após cada nova mensagem
  const syncConversationToDB = useCallback(() => {
    const msgs = useAppStore.getState().nousConversations[clientName] || []
    if (msgs.length === 0) return
    fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientName, messages: msgs }),
    }).catch(() => {})
  }, [clientName])

  useEffect(() => {
    if (messages.length === 0) return
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(syncConversationToDB, 2000)
    return () => { if (syncTimerRef.current) clearTimeout(syncTimerRef.current) }
  }, [messages.length, syncConversationToDB])

  useEffect(() => {
    if (open && messages.length === 0) {
      const niche = clientData?.niche || 'seu nicho'
      const name  = clientData?.clientName || 'cliente'
      const dataCtx = hasRealCampaignData
        ? `dados reais de campanha (Meta/Google Ads), ${campaignHistory.length > 0 ? `${campaignHistory.length} campanhas históricas, ` : ''}última auditoria e benchmarks do nicho`
        : `benchmarks do nicho ${niche}${campaignHistory.length > 0 ? `, ${campaignHistory.length} campanhas declaradas` : ''}${latestAudit ? ' e última auditoria (sem dados reais de plataforma)' : ''}`
      const dataNote = hasRealCampaignData
        ? 'Minha análise usa dados reais das suas campanhas.'
        : 'Ainda não há dados reais de campanha (Meta/Google Ads não conectado). Usarei benchmarks do nicho e as informações que você configurou — deixarei claro quando for estimativa.'
      addNousMessage(clientName, {
        role: 'nous',
        content: `Olá! Sou seu **Assistente IA**, especializado em **${niche}**.\n\nTenho acesso ao contexto de **${name}**: ${dataCtx}.\n\n${dataNote}\n\nMe pergunte qualquer coisa — diagnóstico, criativos, canais, CPL, ROAS.`,
        ts: Date.now(),
        dataSource: hasRealCampaignData ? 'real' : (hasBenchmark ? 'benchmark' : 'unavailable'),
      })
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const buildContext = () => {
    const lines: string[] = []

    // ── 1. Status dos dados (lido primeiro pelo modelo) ────────────────────────
    lines.push(`=== STATUS DOS DADOS — LEIA PRIMEIRO ===`)
    lines.push(`Dados reais de campanha (Meta/Google Ads): ${
      hasRealCampaignData
        ? `SIM — ${realMetrics.campaignCount} campanhas, R$${realMetrics.totalSpend.toLocaleString('pt-BR')} investidos`
        : 'NÃO — conta não conectada ou auditoria sem dados de plataforma'
    }`)
    lines.push(`Análise Profunda realizada: ${latestAudit ? `SIM (${new Date(latestAudit.createdAt || '').toLocaleDateString('pt-BR')})` : 'NÃO'}`)
    lines.push(`Histórico de campanhas declarado pelo usuário: ${campaignHistory.length > 0 ? `SIM (${campaignHistory.length} entradas)` : 'NÃO'}`)
    lines.push(`Benchmarks do nicho: ${hasBenchmark ? 'disponíveis' : 'indisponíveis'}`)
    if (!hasRealCampaignData) {
      lines.push(`⚠️ Sem dados reais de campanha — use benchmarks como referência, mas NÃO afirme ter analisado campanhas reais.`)
    }

    // ── 2. Dados declarados pelo usuário ───────────────────────────────────────
    if (clientData) {
      lines.push(`\n=== DADOS DECLARADOS PELO USUÁRIO (configurados manualmente — não extraídos de plataforma) ===`)
      lines.push(`Cliente: ${clientData.clientName}`)
      lines.push(`Nicho: ${clientData.niche}`)
      lines.push(`Budget mensal: R$${clientData.budget.toLocaleString('pt-BR')}`)
      lines.push(`Faturamento mensal: R$${clientData.monthlyRevenue.toLocaleString('pt-BR')}`)
      lines.push(`Objetivo: ${clientData.objective}`)
      if (clientData.city) lines.push(`Cidade: ${clientData.city}`)
      if (clientData.currentCPL) lines.push(`CPL atual: R$${clientData.currentCPL}`)
      if (clientData.mainChallenge) lines.push(`Maior desafio: ${clientData.mainChallenge}`)
      if (clientData.currentLeadSource) lines.push(`Origem de leads: ${clientData.currentLeadSource}`)

      const hasUnitEcon = clientData.ticketPrice || clientData.grossMargin || clientData.conversionRate
      if (hasUnitEcon) {
        lines.push(`\n=== UNIT ECONOMICS (calculado a partir dos dados declarados) ===`)
        if (clientData.ticketPrice) lines.push(`Ticket médio: R$${clientData.ticketPrice.toLocaleString('pt-BR')}`)
        if (clientData.grossMargin) lines.push(`Margem bruta: ${clientData.grossMargin}%`)
        if (clientData.conversionRate) lines.push(`Taxa de fechamento: ${clientData.conversionRate}%`)
        lines.push(`Modelo: ${clientData.isRecurring ? 'Recorrente/Assinatura' : 'Venda única'}`)
        if (clientData.ticketPrice && clientData.grossMargin && clientData.conversionRate) {
          const ticket = clientData.ticketPrice
          const margin = clientData.grossMargin / 100
          const cvr    = clientData.conversionRate / 100
          const breakEvenROAS = margin > 0 ? (1 / margin).toFixed(2) : null
          const maxCPL = cvr > 0 ? Math.round(ticket * margin * cvr) : null
          const ltv = clientData.isRecurring ? Math.round(ticket / 0.05) : ticket
          if (breakEvenROAS) lines.push(`ROAS break-even calculado: ${breakEvenROAS}×`)
          if (maxCPL) lines.push(`CPL máximo lucrativo: R$${maxCPL}`)
          lines.push(`LTV estimado: R$${ltv.toLocaleString('pt-BR')}`)
        }
      }
    }

    // ── 3. Restrição de budget ─────────────────────────────────────────────────
    if (clientData?.budget) {
      if (clientData.budget < 2000) {
        lines.push(`\n⚠️ RESTRIÇÃO DE BUDGET: R$${clientData.budget}/mês — recomendar APENAS canal único e campanha de conversão direta.`)
      } else if (clientData.budget < 5000) {
        lines.push(`\nNOTA BUDGET: R$${clientData.budget}/mês — budget moderado. Priorizar 1 canal principal.`)
      }
    }

    // ── 4. Benchmarks do nicho (dados de mercado, NÃO métricas da conta) ──────
    const benchSummary = clientData?.niche ? getBenchmarkSummary(clientData.niche) : null
    if (benchSummary) {
      lines.push(`\n=== BENCHMARKS DO NICHO (dados de mercado estimados — NÃO são métricas reais da conta) ===`)
      lines.push(benchSummary)
    }

    // ── 5. Sazonalidade e ângulos criativos (estimativas de mercado) ───────────
    if (clientData?.niche) {
      const bench = getBenchmark(clientData.niche)
      if (bench) {
        const benchKey = Object.keys(BENCHMARKS).find((k) => BENCHMARKS[k] === bench) || 'outro'
        const seasonCtx = getSeasonalityContext(benchKey)
        lines.push(`\n=== SAZONALIDADE DO NICHO (estimativa de mercado, não da conta) ===`)
        lines.push(`Mês atual: índice CPL ${seasonCtx.current.toFixed(2)} (${seasonCtx.interpretation}). Meses mais baratos: ${seasonCtx.valleyMonths.join(', ')}. Meses mais caros: ${seasonCtx.peakMonths.join(', ')}.`)

        const angles = getCreativeAngles(clientData.niche)
        if (angles) {
          lines.push(`\n=== ÂNGULOS DE CRIATIVO (referências de mercado para o nicho) ===`)
          lines.push(`Saturados (evitar): ${angles.saturated.join(', ')}`)
          lines.push(`Em alta (explorar): ${angles.trending.join(', ')}`)
          lines.push(`Subexplorados (oportunidade): ${angles.underexplored.join(', ')}`)
        }
      }
    }

    // ── 6. Estratégia gerada pela IA ───────────────────────────────────────────
    if (strategy?.recommendation) lines.push(`\n=== ESTRATÉGIA GERADA PELA IA ===\n${strategy.recommendation}`)
    if (strategy?.growth_diagnosis?.main_problem) lines.push(`Problema principal identificado: ${strategy.growth_diagnosis.main_problem}`)

    // ── 7. Health score ────────────────────────────────────────────────────────
    const hs = cn ? clientHealthScores[cn] : undefined
    if (hs) lines.push(`\nScore de saúde da conta: ${hs.score}/100 (${hs.grade}) — fonte: ${hs.source}`)

    // ── 8. Auditoria (rótulo muda conforme existência de dados reais) ──────────
    if (latestAudit) {
      const audit = latestAudit.audit as any
      const auditLabel = hasRealCampaignData
        ? `ANÁLISE PROFUNDA — DADOS REAIS (${new Date(latestAudit.createdAt || '').toLocaleDateString('pt-BR')} — Meta/Google Ads)`
        : `ANÁLISE PROFUNDA (${new Date(latestAudit.createdAt || '').toLocaleDateString('pt-BR')} — SEM dados reais de plataforma)`
      lines.push(`\n=== ${auditLabel} ===`)
      if (audit?.health_score) lines.push(`Score: ${audit.health_score}/100 (${audit.grade || ''})`)
      if (audit?.executive_summary) lines.push(`Sumário executivo: ${audit.executive_summary}`)
      if (hasRealCampaignData) {
        lines.push(`Métricas reais: R$${realMetrics.totalSpend.toLocaleString('pt-BR')} investidos | ${realMetrics.totalLeads} leads | CPL R$${realMetrics.avgCPL || '?'} | ROAS ${realMetrics.avgROAS || '?'}× | CTR ${realMetrics.avgCTR || '?'}% | ${realMetrics.campaignCount} campanhas`)
      }
      if (audit?.gargalos?.length) {
        lines.push(`Principais gargalos: ${audit.gargalos.slice(0, 3).map((g: any) => g.titulo).join('; ')}`)
      }
      if (audit?.plano_acao?.curto?.length) {
        lines.push(`Ações de curto prazo: ${audit.plano_acao.curto.slice(0, 2).map((a: any) => a.acao).join('; ')}`)
      }
    }

    // ── 9. Ações críticas pendentes ────────────────────────────────────────────
    const pendingActions = cn ? (pendingActionsCache[cn] || []) : []
    const criticalPending = pendingActions.filter(a => a.urgency === 'critica' && a.status === 'pendente')
    if (criticalPending.length > 0) {
      lines.push(`\nAÇÕES CRÍTICAS PENDENTES (${criticalPending.length}): ${criticalPending.slice(0, 3).map(a => a.title).join('; ')}`)
    }

    // ── 10. Histórico de campanhas (declarado pelo usuário) ────────────────────
    if (campaignHistory.length > 0) {
      lines.push(`\n=== HISTÓRICO DE CAMPANHAS (declarado pelo usuário — não extraído de plataforma) ===`)
      campaignHistory.slice(0, 5).forEach((c) => {
        lines.push(`- ${c.channel} (${c.period}): CPL R$${c.cplReal}, ${c.leads} leads, ${c.outcome}. OK: ${c.whatWorked || 'n/a'}. Falhou: ${c.whatFailed || 'n/a'}`)
      })
    }

    return lines.join('\n')
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    addNousMessage(clientName, { role: 'user', content: text.trim(), ts: Date.now() })
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/nous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          context: buildContext(),
          niche: clientData?.niche,
          city: clientData?.city,
          hasRealData: hasRealCampaignData,
          viewMode: useAppStore.getState().dashboardMode,
          nicheProfile: getCurrentNicheFromOnboarding().key,
          history: messages.slice(-6).map((m) => ({
            role: m.role === 'nous' ? 'assistant' : 'user',
            content: m.content,
          })),
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Erro')
      addNousMessage(clientName, {
        role: 'nous',
        content: json.reply,
        ts: Date.now(),
        dataSource: json.dataSource,
      })
    } catch (e: any) {
      addNousMessage(clientName, {
        role: 'nous',
        content: `Não consegui processar agora. Tente novamente. (${e.message})`,
        ts: Date.now(),
      })
    } finally {
      setLoading(false)
    }
  }


  const renderText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
        : <span key={i}>{part}</span>
    )
  }

  function DataSourceTag({ source }: { source: NousMessage['dataSource'] }) {
    if (!source || source === 'real') return null
    const cfg: Record<string, { label: string; color: string; icon: string }> = {
      benchmark:   { label: 'Benchmark do nicho',    color: 'rgba(240,180,41,0.7)',  icon: '~' },
      mixed:       { label: 'Dados reais + benchmark', color: 'rgba(56,189,248,0.7)', icon: '≈' },
      local:       { label: 'Fallback local',          color: 'rgba(251,146,60,0.7)', icon: '↩' },
      unavailable: { label: 'Sem dados',               color: 'rgba(239,68,68,0.7)',  icon: '!' },
    }
    const c = cfg[source]
    if (!c) return null
    return (
      <div style={{ marginTop: '6px', fontSize: '9px', color: c.color, fontFamily: 'var(--font-mono)', opacity: 0.85 }}>
        {c.icon} {c.label}
      </div>
    )
  }

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all hover:scale-105"
        style={{
          background: open ? '#FFFFFF' : 'linear-gradient(135deg, #F0B429, #FFD166)',
          border: open ? '1px solid rgba(240,180,41,0.4)' : 'none',
        }}
        title="Assistente IA — Analista Estratégica"
      >
        {open
          ? <span className="text-[#F0B429] text-xl font-bold">×</span>
          : <span className="text-black text-lg font-black">IA</span>
        }
      </button>

      {/* Painel do chat */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[380px] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: '#FFFFFF',
            border: '1px solid #2A2A30',
            height: '520px',
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2A2A30] flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(240,180,41,0.08), rgba(240,180,41,0.02))' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)' }}>
              <span className="text-black text-sm font-black">N</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-white text-sm">Assistente IA</div>
              <div className="text-[10px] text-slate-500">
                Analista estratégica · {clientData?.niche || 'aguardando contexto'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 1 && (
                <button
                  onClick={() => clearNousConversation(clientName)}
                  className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
                  title="Limpar conversa"
                >
                  limpar
                </button>
              )}
              <span className="flex items-center gap-1 text-[10px] text-[#0E9E6E]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0E9E6E] animate-pulse" />
                online
              </span>
            </div>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[85%] rounded-2xl px-3 py-2.5 text-xs leading-relaxed"
                  style={msg.role === 'user'
                    ? { background: 'rgba(240,180,41,0.12)', border: '1px solid rgba(240,180,41,0.2)', color: '#F0B429' }
                    : { background: '#FBFCFD', border: '1px solid #2A2A30', color: '#CBD5E1' }
                  }
                >
                  {msg.role === 'nous' && (
                    <div className="text-[9px] text-[#F0B429] font-bold uppercase tracking-widest mb-1">ASSISTENTE IA</div>
                  )}
                  <div className="whitespace-pre-wrap">
                    {msg.content.split('\n').map((line, li) => (
                      <div key={li}>{renderText(line)}</div>
                    ))}
                  </div>
                  {msg.role === 'nous' && <DataSourceTag source={msg.dataSource} />}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#FBFCFD] border border-[#2A2A30] rounded-2xl px-3 py-2.5">
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F0B429] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F0B429] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F0B429] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts (só quando não há mensagens do usuário) */}
          {messages.filter((m) => m.role === 'user').length === 0 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-[10px] px-2.5 py-1 rounded-full transition-all hover:opacity-80"
                  style={{ background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.2)', color: '#F0B429' }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-[#2A2A30] flex-shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                className="flex-1 bg-[#F4F5F7] border border-[#2A2A30] rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#F0B429] transition-colors"
                placeholder="Pergunte ao Assistente IA..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                disabled={loading}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)' }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 6h10M6 1l5 5-5 5" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
