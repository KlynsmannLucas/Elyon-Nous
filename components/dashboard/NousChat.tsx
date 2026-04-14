// components/dashboard/NousChat.tsx — IA NOUS: assistente estratégico por nicho
'use client'

import { useState, useRef, useEffect } from 'react'
import type { ClientData, CampaignRecord } from '@/lib/store'

interface Message {
  role: 'user' | 'nous'
  content: string
  ts: number
}

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
  const [open, setOpen]       = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      // Mensagem de boas-vindas contextualizada
      const niche = clientData?.niche || 'seu nicho'
      const name  = clientData?.clientName || 'cliente'
      setMessages([{
        role: 'nous',
        content: `Olá! Sou a **NOUS**, sua analista estratégica especializada em **${niche}**.\n\nEstou com acesso aos dados de ${name}: budget, benchmarks do nicho${campaignHistory.length > 0 ? `, histórico de ${campaignHistory.length} campanhas` : ''} e estratégia gerada.\n\nMe pergunte qualquer coisa — diagnóstico, criativos, canais, budget, conversão. Sou direta e baseio tudo em dados.`,
        ts: Date.now(),
      }])
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
    if (clientData) {
      lines.push(`Cliente: ${clientData.clientName}`)
      lines.push(`Nicho: ${clientData.niche}`)
      lines.push(`Budget: R$${clientData.budget.toLocaleString('pt-BR')}/mês`)
      lines.push(`Faturamento: R$${clientData.monthlyRevenue.toLocaleString('pt-BR')}/mês`)
      lines.push(`Objetivo: ${clientData.objective}`)
      if (clientData.city) lines.push(`Cidade: ${clientData.city}`)
      if (clientData.currentCPL) lines.push(`CPL atual: R$${clientData.currentCPL}`)
      if (clientData.mainChallenge) lines.push(`Maior desafio: ${clientData.mainChallenge}`)
      if (clientData.currentLeadSource) lines.push(`Origem de leads: ${clientData.currentLeadSource}`)
    }
    if (strategy?.recommendation) lines.push(`\nRecomendação estratégica atual: ${strategy.recommendation}`)
    if (strategy?.growth_diagnosis?.main_problem) lines.push(`Problema principal identificado: ${strategy.growth_diagnosis.main_problem}`)
    if (campaignHistory.length > 0) {
      lines.push(`\nHistórico de campanhas (${campaignHistory.length}):`)
      campaignHistory.slice(0, 5).forEach((c) => {
        lines.push(`- ${c.channel} (${c.period}): CPL R$${c.cplReal}, ${c.leads} leads, resultado: ${c.outcome}. Funcionou: ${c.whatWorked || 'n/a'}. Falhou: ${c.whatFailed || 'n/a'}`)
      })
    }
    return lines.join('\n')
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text.trim(), ts: Date.now() }
    setMessages((m) => [...m, userMsg])
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
          history: messages.slice(-6).map((m) => ({
            role: m.role === 'nous' ? 'assistant' : 'user',
            content: m.content,
          })),
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Erro')
      setMessages((m) => [...m, { role: 'nous', content: json.reply, ts: Date.now() }])
    } catch (e: any) {
      setMessages((m) => [...m, {
        role: 'nous',
        content: `Não consegui processar agora. Tente novamente. (${e.message})`,
        ts: Date.now(),
      }])
    } finally {
      setLoading(false)
    }
  }

  // Renderiza markdown simples (bold e quebras de linha)
  const renderText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
        : <span key={i}>{part}</span>
    )
  }

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all hover:scale-105"
        style={{
          background: open ? '#111114' : 'linear-gradient(135deg, #F0B429, #FFD166)',
          border: open ? '1px solid rgba(240,180,41,0.4)' : 'none',
        }}
        title="NOUS — Assistente Estratégica"
      >
        {open
          ? <span className="text-[#F0B429] text-xl font-bold">×</span>
          : <span className="text-black text-lg font-black">N</span>
        }
      </button>

      {/* Painel do chat */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[380px] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: '#111114',
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
              <div className="font-display font-bold text-white text-sm">NOUS</div>
              <div className="text-[10px] text-slate-500">
                Analista estratégica · {clientData?.niche || 'aguardando contexto'}
              </div>
            </div>
            <span className="flex items-center gap-1 text-[10px] text-[#22C55E]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              online
            </span>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[85%] rounded-2xl px-3 py-2.5 text-xs leading-relaxed"
                  style={msg.role === 'user'
                    ? { background: 'rgba(240,180,41,0.12)', border: '1px solid rgba(240,180,41,0.2)', color: '#F0B429' }
                    : { background: '#16161A', border: '1px solid #2A2A30', color: '#CBD5E1' }
                  }
                >
                  {msg.role === 'nous' && (
                    <div className="text-[9px] text-[#F0B429] font-bold uppercase tracking-widest mb-1">NOUS</div>
                  )}
                  <div className="whitespace-pre-wrap">
                    {msg.content.split('\n').map((line, li) => (
                      <div key={li}>{renderText(line)}</div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#16161A] border border-[#2A2A30] rounded-2xl px-3 py-2.5">
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
                className="flex-1 bg-[#0A0A0B] border border-[#2A2A30] rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#F0B429] transition-colors"
                placeholder="Pergunte à NOUS..."
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
