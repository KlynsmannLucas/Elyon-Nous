// components/dashboard/TabConteudo.tsx — Gerador de Conteúdo para Redes Sociais
'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import type { ClientData } from '@/lib/store'

interface Props { clientData: ClientData | null }

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram',  icon: '📸', color: '#E1306C' },
  { key: 'tiktok',    label: 'TikTok',     icon: '🎵', color: '#69C9D0' },
  { key: 'facebook',  label: 'Facebook',   icon: '👥', color: '#1877F2' },
  { key: 'linkedin',  label: 'LinkedIn',   icon: '💼', color: '#0A66C2' },
  { key: 'youtube',   label: 'YouTube',    icon: '▶️', color: '#FF0000' },
  { key: 'email',     label: 'E-mail',     icon: '✉️', color: '#F0B429' },
]

const THEME_SUGGESTIONS = [
  'Transformação de cliente real',
  'Bastidores do negócio',
  'Mito vs Verdade no nicho',
  'Dica rápida e prática',
  'Prova social / depoimento',
  'Oferta com urgência',
  'Educativo: "Você sabia que..."',
  'Objeção mais comum respondida',
]

interface Post {
  tipo: string
  gancho: string
  estrutura: string
  legenda: string
  cta: string
  hashtags: string[]
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={handleCopy}
      className="text-[10px] px-2 py-0.5 rounded-md transition-all flex-shrink-0"
      style={{
        background: copied ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
        border: copied ? '1px solid rgba(34,197,94,0.3)' : '1px solid #2A2A30',
        color: copied ? '#4ADE80' : '#64748B',
      }}>
      {copied ? '✓ Copiado' : 'Copiar'}
    </button>
  )
}

function PostCard({ post, index, platform }: { post: Post; index: number; platform: string }) {
  const pl = PLATFORMS.find(p => p.key === platform)
  const color = pl?.color || '#F0B429'
  const fullText = `${post.gancho}\n\n${post.legenda}\n\n${post.cta}\n\n${post.hashtags.map(h => `#${h.replace(/^#/, '')}`).join(' ')}`

  return (
    <div className="rounded-2xl overflow-hidden animate-fade-up" style={{ border: '1px solid #2A2A30', background: '#111114' }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between"
        style={{ background: `${color}10`, borderBottom: '1px solid #1E1E24' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${color}20`, color, border: `1px solid ${color}30` }}>
            {post.tipo}
          </span>
          <span className="text-xs text-slate-500">Ideia {index + 1}</span>
        </div>
        <CopyButton text={fullText} />
      </div>

      <div className="p-4 space-y-3">
        {/* Gancho */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color }}>
            🎯 Gancho
          </div>
          <p className="text-sm font-semibold text-white leading-snug">{post.gancho}</p>
        </div>

        {/* Estrutura */}
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">📐 Estrutura</div>
          <p className="text-xs text-slate-400 leading-relaxed">{post.estrutura}</p>
        </div>

        {/* Legenda */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">✍️ Legenda</div>
            <CopyButton text={post.legenda} />
          </div>
          <div className="rounded-xl p-3 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap"
            style={{ background: '#0C0C0F', border: '1px solid #1E1E24' }}>
            {post.legenda}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-xl px-3 py-2 flex items-center justify-between"
          style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color }}>CTA</div>
            <p className="text-xs text-slate-300">{post.cta}</p>
          </div>
        </div>

        {/* Hashtags */}
        {post.hashtags?.length > 0 && (
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5"># Hashtags</div>
            <div className="flex flex-wrap gap-1">
              {post.hashtags.map((h, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-md"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #2A2A30', color: '#94A3B8' }}>
                  #{h.replace(/^#/, '')}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function TabConteudo({ clientData }: Props) {
  const generatedPersona = useAppStore(s => s.generatedPersona)
  const [platform, setPlatform]   = useState('instagram')
  const [theme, setTheme]         = useState('')
  const [posts, setPosts]         = useState<Post[]>([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const handleGenerate = async () => {
    if (!clientData || !theme.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/conteudo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientData,
          persona: generatedPersona,
          platform,
          theme: theme.trim(),
          role: generatedPersona?.role || 'social',
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Erro ao gerar conteúdo')
      setPosts(data.posts || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!clientData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-500 text-sm">
        Configure um cliente primeiro para gerar conteúdo.
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="font-display text-xl font-bold text-white">Gerador de Conteúdo</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          IA cria 3 ideias prontas para usar — gancho, legenda, CTA e hashtags adaptados à plataforma e persona
        </p>
      </div>

      {/* Persona ativa */}
      {generatedPersona ? (
        <div className="rounded-xl px-4 py-3 mb-5 flex items-center gap-3"
          style={{ background: 'rgba(240,180,41,0.04)', border: '1px solid rgba(240,180,41,0.15)' }}>
          <span className="text-base">👤</span>
          <div className="flex-1 min-w-0">
            <span className="text-xs text-[#F0B429] font-semibold">Persona ativa: </span>
            <span className="text-xs text-slate-300">{generatedPersona.name} · {generatedPersona.profession}</span>
          </div>
          <span className="text-[10px] text-slate-500 flex-shrink-0">conteúdo será personalizado</span>
        </div>
      ) : (
        <div className="rounded-xl px-4 py-3 mb-5 text-xs text-slate-500"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #2A2A30' }}>
          💡 Gere uma persona na aba <span className="text-slate-300 font-medium">Persona IA</span> para conteúdo ainda mais personalizado
        </div>
      )}

      {/* Seletor de plataforma */}
      <div className="rounded-2xl p-5 mb-5" style={{ background: '#111114', border: '1px solid #2A2A30' }}>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Plataforma</div>
        <div className="grid grid-cols-3 gap-2">
          {PLATFORMS.map(pl => (
            <button key={pl.key} onClick={() => setPlatform(pl.key)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all"
              style={{
                background: platform === pl.key ? `${pl.color}12` : 'transparent',
                border: platform === pl.key ? `1px solid ${pl.color}40` : '1px solid #1E1E24',
              }}>
              <span className="text-base">{pl.icon}</span>
              <span className="text-xs font-semibold" style={{ color: platform === pl.key ? pl.color : '#94A3B8' }}>
                {pl.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tema */}
      <div className="rounded-2xl p-5 mb-5" style={{ background: '#111114', border: '1px solid #2A2A30' }}>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Tema do Conteúdo</div>
        <input
          value={theme}
          onChange={e => setTheme(e.target.value)}
          placeholder="Ex: Como perder 5kg em 30 dias sem dieta radical"
          className="w-full bg-transparent rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none mb-3"
          style={{ border: '1px solid #2A2A30' }}
          onKeyDown={e => e.key === 'Enter' && handleGenerate()}
        />
        <div className="text-[10px] text-slate-600 mb-2">Sugestões rápidas:</div>
        <div className="flex flex-wrap gap-1.5">
          {THEME_SUGGESTIONS.map(s => (
            <button key={s} onClick={() => setTheme(s)}
              className="text-[10px] px-2.5 py-1 rounded-full transition-all hover:border-slate-500"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #2A2A30', color: '#94A3B8' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 mb-4 text-xs text-red-400"
          style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)' }}>
          {error}
        </div>
      )}

      <button onClick={handleGenerate} disabled={loading || !theme.trim()}
        className="w-full py-3.5 rounded-xl font-bold text-sm text-black mb-6 disabled:opacity-40 transition-opacity hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)' }}>
        {loading
          ? '⚡ Gerando conteúdo...'
          : `✨ Gerar 3 Ideias para ${PLATFORMS.find(p => p.key === platform)?.label}`}
      </button>

      {posts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              3 Ideias prontas para usar
            </div>
            <button onClick={() => setPosts([])}
              className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">
              Limpar
            </button>
          </div>
          {posts.map((post, i) => (
            <PostCard key={i} post={post} index={i} platform={platform} />
          ))}
        </div>
      )}
    </div>
  )
}
