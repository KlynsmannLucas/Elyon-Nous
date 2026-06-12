// components/dashboard/v2/NousRail.tsx
// NOUS copiloto — rail à direita (>=1280px) ou drawer (<1280px)
'use client'

import { useState, useEffect, useRef } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface NousRailProps {
  open: boolean
  onClose: () => void
  docked?: boolean // true = rail, false = drawer
}

const SUGGESTIONS = [
  "Como estão meus KPIs hoje?",
  "Qual a campanha com melhor ROAS?",
  "Preciso aumentar meu orçamento?"
]

function NousOrb({ className = '' }: { className?: string }) {
  return (
    <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue to-teal flex items-center justify-center animate-pulse-dot ${className}`}>
      <span className="text-white text-xl">◎</span>
    </div>
  )
}

export function NousRail({ open, onClose, docked = true }: NousRailProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Olá! Sou o NOUS, seu copiloto de marketing. Como posso ajudar hoje?' }
  ])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    setMessages(m => [...m, { role: 'user', content: input }])
    setInput('')
    setIsTyping(true)
    // Simulate typing
    setTimeout(() => {
      setIsTyping(false)
      setMessages(m => [...m, { role: 'assistant', content: 'Entendi sua pergunta. Deixe-me analisar...' }])
    }, 1500)
  }

  const handleSuggestion = (s: string) => {
    setInput(s)
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop for drawer */}
      {!docked && (
        <div 
          className="fixed inset-0 bg-ink/20 z-40"
          onClick={onClose}
        />
      )}


      <aside className={`
        ${docked 
          ? 'w-[340px] border-l border-line'
          : 'fixed right-0 top-0 bottom-0 w-[340px] z-50'
        }
        h-screen bg-paper flex flex-col
      `.trim()}>
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-line">
          <div className="flex items-center gap-3">
            <NousOrb />
            <div>
              <h2 className="text-sm font-semibold text-ink">NOUS</h2>
              <p className="text-xs text-green">● online</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className={`px-2 py-1 text-xs rounded-sm ${true ? 'bg-blue-soft text-blue' : 'text-ink-3'}`}>
              Insights
            </button>
            <button className={`px-2 py-1 text-xs rounded-sm ${false ? 'bg-blue-soft text-blue' : 'text-ink-3'}`}>
              Perguntas
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`
                max-w-[85%] px-3 py-2 rounded-md text-sm
                ${msg.role === 'user' 
                  ? 'bg-blue text-white' 
                  : 'bg-canvas-2 text-ink'
                }
              `.trim()}>
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-2 text-ink-3 text-sm animate-pulse">
              <span>◎</span> Digitando...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        <div className="px-4 py-2 border-t border-line">
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestion(s)}
                className="px-2 py-1 text-xs bg-canvas-2 text-ink-2 rounded-full hover:bg-canvas hover:text-ink"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-line">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Pergunte ao NOUS..."
              className="flex-1 px-3 py-2 bg-canvas-2 border border-line rounded-sm text-sm text-ink placeholder:text-ink-3 focus:border-blue focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-4 py-2 bg-blue text-white rounded-sm text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
            >
              →
            </button>
          </div>
        </div>

        {/* Close button for drawer */}
        {!docked && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-ink-3 hover:text-ink"
          >
            ✕
          </button>
        )}
      </aside>
    </>
  )
}
