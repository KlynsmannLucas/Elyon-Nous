'use client'

import { useState } from 'react'
import { Button } from './Button'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface NousRailProps {
  isOpen?: boolean
  onToggle?: () => void
}

export function NousRail({ isOpen = true, onToggle }: NousRailProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Olá! Sou o Nous, seu assistente de IA. Como posso ajudar?' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMsg: Message = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Entendi! Deixe-me analisar isso para você.' },
      ])
      setLoading(false)
    }, 1000)
  }

  if (!isOpen) return null

  return (
    <div className="w-80 h-full bg-paper border-l border-line flex flex-col">
      {/* Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-line">
        <div className="flex items-center gap-2">
          <span className="text-lg">◉</span>
          <span className="font-medium text-ink">Nous</span>
        </div>
        {onToggle && (
          <button
            onClick={onToggle}
            className="text-ink-3 hover:text-ink transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-soft text-blue ml-6' : 'bg-canvas-2 text-ink-2 mr-6'}`}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="bg-canvas-2 text-ink-2 p-3 rounded-lg text-sm mr-6">
            Digitando...
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-line">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte ao Nous..."
            className="flex-1 h-9 px-3 text-sm bg-canvas-2 border border-line rounded-md text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-blue/30"
          />
          <Button size="sm" loading={loading}>
            →
          </Button>
        </div>
      </form>
    </div>
  )
}
