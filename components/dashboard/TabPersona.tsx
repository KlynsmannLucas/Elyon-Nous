// components/dashboard/TabPersona.tsx — Gerador de Persona por IA
'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import type { ClientData, GeneratedPersona } from '@/lib/store'

interface Props { clientData: ClientData | null }

const ROLES = [
  { key: 'gestor',    label: 'Gestor de Tráfego',    icon: '📡', desc: 'Inclui interesses do Facebook Ads prontos para segmentar' },
  { key: 'social',    label: 'Social Media',          icon: '✏️', desc: 'Foco em ângulos de conteúdo e linguagem editorial' },
  { key: 'influencer',label: 'Influencer / Creator',  icon: '🎥', desc: 'Roteiros e ganchos que geram identificação' },
  { key: 'dono',      label: 'Dono do Negócio',       icon: '🏢', desc: 'Visão estratégica de posicionamento e proposta de valor' },
]

function Tag({ text, color = '#F0B429' }: { text: string; color?: string }) {
  return (
    <span className="inline-block text-[11px] px-2 py-0.5 rounded-full font-medium mr-1 mb-1"
      style={{ background: `${color}18`, color, border: `1px solid ${color}28` }}>
      {text}
    </span>
  )
}

function PersonaCard({ persona }: { persona: GeneratedPersona }) {
  return (
    <div className="animate-fade-up space-y-4">
      {/* Header */}
      <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(240,180,41,0.08), rgba(240,180,41,0.03))', border: '1px solid rgba(240,180,41,0.2)' }}>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: 'rgba(240,180,41,0.12)', border: '1px solid rgba(240,180,41,0.25)' }}>
            👤
          </div>
          <div className="flex-1">
            <div className="font-display text-xl font-bold text-white">{persona.name}</div>
            <div className="text-sm text-slate-400 mt-0.5">{persona.age} · {persona.profession}</div>
            <div className="text-xs text-slate-500 mt-0.5">Renda: {persona.income}</div>
            <div className="flex flex-wrap gap-1 mt-2">
              {persona.favoriteChannels.map((ch) => <Tag key={ch} text={ch} color="#38BDF8" />)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Dores */}
        <div className="rounded-2xl p-4" style={{ background: '#111114', border: '1px solid rgba(248,113,113,0.2)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">😣</span>
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Dores</span>
          </div>
          <ul className="space-y-1.5">
            {persona.pains.map((p, i) => (
              <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>{p}
              </li>
            ))}
          </ul>
        </div>

        {/* Desejos */}
        <div className="rounded-2xl p-4" style={{ background: '#111114', border: '1px solid rgba(34,197,94,0.2)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">✨</span>
            <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Desejos</span>
          </div>
          <ul className="space-y-1.5">
            {persona.desires.map((d, i) => (
              <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                <span className="text-green-400 mt-0.5 flex-shrink-0">•</span>{d}
              </li>
            ))}
          </ul>
        </div>

        {/* Medos */}
        <div className="rounded-2xl p-4" style={{ background: '#111114', border: '1px solid rgba(251,146,60,0.2)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">😰</span>
            <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Medos</span>
          </div>
          <ul className="space-y-1.5">
            {persona.fears.map((f, i) => (
              <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                <span className="text-orange-400 mt-0.5 flex-shrink-0">•</span>{f}
              </li>
            ))}
          </ul>
        </div>

        {/* Objeções */}
        <div className="rounded-2xl p-4" style={{ background: '#111114', border: '1px solid rgba(167,139,250,0.2)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🚧</span>
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Objeções</span>
          </div>
          <ul className="space-y-1.5">
            {persona.objections.map((o, i) => (
              <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                <span className="text-purple-400 mt-0.5 flex-shrink-0">"</span>{o}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Comportamento de compra */}
      <div className="rounded-2xl p-4" style={{ background: '#111114', border: '1px solid #2A2A30' }}>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">🛒 Comportamento de Compra</div>
        <p className="text-sm text-slate-300 leading-relaxed">{persona.buyingBehavior}</p>
      </div>

      {/* Ângulos de conteúdo */}
      {persona.contentAngles && persona.contentAngles.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: '#111114', border: '1px solid rgba(240,180,41,0.15)' }}>
          <div className="text-xs font-bold text-[#F0B429] uppercase tracking-wider mb-2">🎨 Ângulos de Conteúdo</div>
          <div className="flex flex-wrap">
            {persona.contentAngles.map((a, i) => <Tag key={i} text={a} color="#F0B429" />)}
          </div>
        </div>
      )}

      {/* Interesses Facebook/Instagram Ads */}
      {persona.facebookInterests && persona.facebookInterests.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.2)' }}>
          <div className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2">📡 Interesses para Facebook/Instagram Ads</div>
          <p className="text-[11px] text-slate-500 mb-2">Copie no Gerenciador de Anúncios → Segmentação Detalhada</p>
          <div className="flex flex-wrap">
            {persona.facebookInterests.map((i, idx) => <Tag key={idx} text={i} color="#38BDF8" />)}
          </div>
        </div>
      )}

      {/* Palavras-chave Google Ads */}
      {persona.googleAdsKeywords && persona.googleAdsKeywords.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.2)' }}>
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">🔍 Palavras-chave para Google Ads</div>
          <p className="text-[11px] text-slate-500 mb-2">Use no Planejador de Palavras-chave ou cole direto numa campanha de Pesquisa</p>
          <div className="flex flex-wrap">
            {persona.googleAdsKeywords.map((k, idx) => <Tag key={idx} text={k} color="#34D399" />)}
          </div>
        </div>
      )}

      {/* Resumo estratégico */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.2)' }}>
        <div className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">⚡ Estratégia Recomendada</div>
        <p className="text-sm text-slate-300 leading-relaxed">{persona.strategySummary}</p>
      </div>
    </div>
  )
}

export function TabPersona({ clientData }: Props) {
  const generatedPersona   = useAppStore((s) => s.generatedPersona)
  const setGeneratedPersona = useAppStore((s) => s.setGeneratedPersona)
  const [role, setRole]     = useState('gestor')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleGenerate = async () => {
    if (!clientData) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientData, role }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Erro ao gerar persona')
      setGeneratedPersona({ ...data.persona, role, generatedAt: new Date().toISOString() })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!clientData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-500 text-sm">
        Configure um cliente primeiro para gerar a persona.
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="font-display text-xl font-bold text-white">Gerador de Persona</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          IA cria a persona do cliente ideal com dores, desejos, objeções e interesses de segmentação — adaptada ao seu papel
        </p>
      </div>

      {/* Seletor de papel */}
      <div className="rounded-2xl p-5 mb-5" style={{ background: '#111114', border: '1px solid #2A2A30' }}>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Você é um:</div>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map((r) => (
            <button key={r.key} onClick={() => setRole(r.key)}
              className="flex items-start gap-3 p-3 rounded-xl text-left transition-all"
              style={{
                background: role === r.key ? 'rgba(240,180,41,0.08)' : 'transparent',
                border: role === r.key ? '1px solid rgba(240,180,41,0.35)' : '1px solid #1E1E24',
              }}>
              <span className="text-xl flex-shrink-0">{r.icon}</span>
              <div>
                <div className="text-sm font-semibold" style={{ color: role === r.key ? '#F0B429' : '#CBD5E1' }}>{r.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{r.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Dados base coletados no wizard */}
      {(clientData.targetAge || clientData.mainPains || clientData.onlineChannels?.length) && (
        <div className="rounded-xl px-4 py-3 mb-4 text-xs text-slate-400"
          style={{ background: 'rgba(240,180,41,0.04)', border: '1px solid rgba(240,180,41,0.12)' }}>
          <span className="text-[#F0B429] font-semibold">✓ Dados do cadastro:</span>{' '}
          {[clientData.targetAge, clientData.targetGender, clientData.targetIncome, clientData.onlineChannels?.join(', ')].filter(Boolean).join(' · ')}
        </div>
      )}

      {error && (
        <div className="rounded-xl px-4 py-3 mb-4 text-xs text-red-400"
          style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)' }}>
          {error}
        </div>
      )}

      <button onClick={handleGenerate} disabled={loading}
        className="w-full py-3.5 rounded-xl font-bold text-sm text-black mb-6 disabled:opacity-50 transition-opacity hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)' }}>
        {loading ? '⚡ Gerando persona...' : `✨ Gerar Persona para ${ROLES.find(r => r.key === role)?.label}`}
      </button>

      {generatedPersona && <PersonaCard persona={generatedPersona} />}
    </div>
  )
}
