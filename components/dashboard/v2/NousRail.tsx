// components/dashboard/v2/NousRail.tsx
// NOUS copiloto — rail (>=1280px) ou drawer (<1280px). Ligado ao /api/nous real.
'use client'

import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/lib/store'

interface Message { role: 'user' | 'assistant'; content: string }
interface NousRailProps { open: boolean; onClose: () => void; docked?: boolean }

const SUGGESTIONS = ['Como estão meus KPIs?', 'Qual campanha tem melhor ROAS?', 'O que eu faço esta semana?']

function NousOrb({ className = '' }: { className?: string }) {
  return (
    <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue to-teal flex items-center justify-center animate-pulse-dot ${className}`}>
      <span className="text-white text-xl">◎</span>
    </div>
  )
}

export function NousRail({ open, onClose, docked = true }: NousRailProps) {
  const clientData = useAppStore(s => s.clientData)
  const auditCache = useAppStore(s => s.auditCache)
  const campaignHistory = useAppStore(s => s.campaignHistory)
  const dashboardMode = useAppStore(s => s.dashboardMode)

  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Olá! Sou o NOUS, seu copiloto de marketing. Pergunte sobre seus KPIs, campanhas, CPL, próximos passos…' },
  ])
  const [isTyping, setIsTyping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])

  const key = clientData?.clientName || ''
  const latestAudit: any = key ? auditCache[key]?.[0]?.audit : null
  const rm = latestAudit?._realMetrics
  const hasRealData = !!(rm && (rm.totalSpend > 0 || rm.totalLeads > 0))

  const buildContext = () => {
    const l: string[] = ['=== STATUS DOS DADOS — LEIA PRIMEIRO ===']
    l.push(`Dados reais de campanha: ${hasRealData ? `SIM — ${rm.campaignCount || '?'} campanhas, R$${Number(rm.totalSpend).toLocaleString('pt-BR')} investidos, ${rm.totalLeads} leads, CPL R$${rm.avgCPL ?? '—'}` : 'NÃO'}`)
    l.push(`Análise Profunda: ${latestAudit ? 'SIM' : 'NÃO'}`)
    if (latestAudit?.health_score) l.push(`Score de saúde: ${latestAudit.health_score}/100 (${latestAudit.grade || '—'})`)
    if (clientData) {
      l.push('\n=== CLIENTE ===')
      l.push(`Cliente: ${clientData.clientName}`)
      l.push(`Nicho: ${clientData.niche}`)
      l.push(`Budget mensal: R$${(clientData.budget || 0).toLocaleString('pt-BR')}`)
      l.push(`Objetivo: ${clientData.objective || '—'}`)
      if (clientData.city) l.push(`Cidade: ${clientData.city}`)
    }
    const gargalos = latestAudit?.gargalos
    if (Array.isArray(gargalos) && gargalos.length) l.push(`\nMaiores gargalos: ${gargalos.slice(0, 3).map((g: any) => g.titulo).filter(Boolean).join('; ')}`)
    return l.join('\n')
  }

  const send = async (text: string) => {
    const msg = text.trim()
    if (!msg || isTyping) return
    const history = messages.slice(-6)
    setMessages(m => [...m, { role: 'user', content: msg }])
    setInput(''); setIsTyping(true)
    try {
      const res = await fetch('/api/nous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          context: buildContext(),
          niche: clientData?.niche,
          city: clientData?.city,
          hasRealData,
          viewMode: dashboardMode,
          history,
        }),
      })
      const data = await res.json()
      const reply = data?.reply || data?.error || 'Não consegui responder agora. Tente de novo.'
      setMessages(m => [...m, { role: 'assistant', content: reply }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Falha de conexão. Tente novamente.' }])
    } finally {
      setIsTyping(false)
    }
  }

  if (!open) return null

  return (
    <>
      {!docked && <div className="fixed inset-0 bg-ink/20 z-40" onClick={onClose} />}
      <aside className={`${docked ? 'w-[340px] border-l border-line' : 'fixed right-0 top-0 bottom-0 w-[340px] z-50 shadow-card-hover'} h-screen bg-paper flex flex-col`.trim()}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-line shrink-0">
          <div className="flex items-center gap-3">
            <NousOrb />
            <div>
              <h2 className="text-sm font-semibold text-ink">NOUS</h2>
              <p className="text-xs text-green">● {clientData?.niche ? clientData.niche : 'online'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-ink-3 hover:text-ink rounded-sm" title="Fechar">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-3 py-2 rounded-md text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-blue text-white' : 'bg-canvas-2 text-ink'}`.trim()}>{m.content}</div>
            </div>
          ))}
          {isTyping && <div className="flex gap-2 text-ink-3 text-sm animate-pulse"><span>◎</span> Pensando…</div>}
          <div ref={endRef} />
        </div>

        <div className="px-4 py-2 border-t border-line shrink-0">
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => send(s)} disabled={isTyping}
                className="px-2.5 py-1 text-xs bg-canvas-2 text-ink-2 rounded-full hover:bg-canvas hover:text-ink disabled:opacity-50">{s}</button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-line shrink-0">
          <div className="flex gap-2">
            <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(input)}
              placeholder="Pergunte ao NOUS…"
              className="flex-1 px-3 py-2 bg-canvas-2 border border-line rounded-sm text-sm text-ink placeholder:text-ink-3 focus:border-blue focus:outline-none" />
            <button onClick={() => send(input)} disabled={!input.trim() || isTyping}
              className="px-4 py-2 bg-blue text-white rounded-sm text-sm font-medium hover:bg-blue-600 disabled:opacity-50">→</button>
          </div>
        </div>
      </aside>
    </>
  )
}
