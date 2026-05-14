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
  { key: 'email',     label: 'E-mail',     icon: '✉️', color: '#7C3AED' },
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
    <button
      onClick={handleCopy}
      style={{
        fontSize: '10px',
        padding: '2px 8px',
        borderRadius: '6px',
        flexShrink: 0,
        cursor: 'pointer',
        transition: 'all 0.15s',
        background: copied ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
        border: copied ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.06)',
        color: copied ? '#22C55E' : '#64748B',
      }}
    >
      {copied ? '✓ Copiado' : 'Copiar'}
    </button>
  )
}

function PostCard({ post, index, platform }: { post: Post; index: number; platform: string }) {
  const pl = PLATFORMS.find(p => p.key === platform)
  const color = pl?.color || '#7C3AED'
  const fullText = `${post.gancho}\n\n${post.legenda}\n\n${post.cta}\n\n${post.hashtags.map(h => `#${h.replace(/^#/, '')}`).join(' ')}`

  return (
    <div
      style={{
        background: '#0F1629',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '14px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: `${color}10`,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '999px',
              background: `${color}20`,
              color,
              border: `1px solid ${color}30`,
            }}
          >
            {post.tipo}
          </span>
          <span style={{ fontSize: '11px', color: '#64748B' }}>Ideia {index + 1}</span>
        </div>
        <CopyButton text={fullText} />
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Gancho */}
        <div>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '4px',
              color,
            }}
          >
            🎯 Gancho
          </div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9', lineHeight: 1.4, margin: 0 }}>
            {post.gancho}
          </p>
        </div>

        {/* Estrutura */}
        <div>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#64748B',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '4px',
            }}
          >
            📐 Estrutura
          </div>
          <p style={{ fontSize: '11px', color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>{post.estrutura}</p>
        </div>

        {/* Legenda */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '4px',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              ✍️ Legenda
            </div>
            <CopyButton text={post.legenda} />
          </div>
          <div
            style={{
              borderRadius: '10px',
              padding: '10px 12px',
              fontSize: '11px',
              color: '#94A3B8',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              background: '#080D1A',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {post.legenda}
          </div>
        </div>

        {/* CTA */}
        <div
          style={{
            borderRadius: '10px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: `${color}08`,
            border: `1px solid ${color}20`,
          }}
        >
          <div>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '2px',
                color,
              }}
            >
              CTA
            </div>
            <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>{post.cta}</p>
          </div>
        </div>

        {/* Hashtags */}
        {post.hashtags?.length > 0 && (
          <div>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '6px',
              }}
            >
              # Hashtags
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {post.hashtags.map((h, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: '#94A3B8',
                  }}
                >
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
  const generatedPersona  = useAppStore(s => s.generatedPersona)
  const connectedAccounts = useAppStore(s => s.connectedAccounts)
  const metaAccount       = connectedAccounts.find(a => a.platform === 'meta')
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
          metaAccessToken: metaAccount?.accessToken,
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          color: '#64748B',
          fontSize: '13px',
        }}
      >
        Configure um cliente primeiro para gerar conteúdo.
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '720px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 800,
            color: '#F1F5F9',
            margin: 0,
            marginBottom: '4px',
          }}
        >
          Gerador de Conteúdo
        </h2>
        <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
          IA cria 3 ideias prontas para usar — gancho, legenda, CTA e hashtags adaptados à plataforma e persona
        </p>
      </div>

      {/* Persona ativa */}
      {generatedPersona ? (
        <div
          style={{
            borderRadius: '10px',
            padding: '10px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(124,58,237,0.10)',
            border: '1px solid rgba(124,58,237,0.22)',
          }}
        >
          <span style={{ fontSize: '16px' }}>👤</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '11px', color: '#A78BFA', fontWeight: 600 }}>Persona ativa: </span>
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>
              {generatedPersona.name} · {generatedPersona.profession}
            </span>
          </div>
          <span style={{ fontSize: '10px', color: '#64748B', flexShrink: 0 }}>conteúdo será personalizado</span>
        </div>
      ) : (
        <div
          style={{
            borderRadius: '10px',
            padding: '10px 16px',
            marginBottom: '20px',
            fontSize: '11px',
            color: '#64748B',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          💡 Gere uma persona na aba{' '}
          <span style={{ color: '#94A3B8', fontWeight: 500 }}>Persona IA</span>{' '}
          para conteúdo ainda mais personalizado
        </div>
      )}

      {/* Seletor de plataforma */}
      <div
        style={{
          borderRadius: '14px',
          padding: '20px',
          marginBottom: '20px',
          background: '#0F1629',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#94A3B8',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '12px',
          }}
        >
          Plataforma
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
          }}
        >
          {PLATFORMS.map(pl => (
            <button
              key={pl.key}
              onClick={() => setPlatform(pl.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '10px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: platform === pl.key ? `${pl.color}12` : 'transparent',
                border: platform === pl.key ? `1px solid ${pl.color}40` : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span style={{ fontSize: '16px' }}>{pl.icon}</span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: platform === pl.key ? pl.color : '#94A3B8',
                }}
              >
                {pl.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tema */}
      <div
        style={{
          borderRadius: '14px',
          padding: '20px',
          marginBottom: '20px',
          background: '#0F1629',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#94A3B8',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '12px',
          }}
        >
          Tema do Conteúdo
        </div>
        <input
          value={theme}
          onChange={e => setTheme(e.target.value)}
          placeholder="Ex: Como perder 5kg em 30 dias sem dieta radical"
          style={{
            background: '#131E35',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px',
            color: '#F1F5F9',
            fontSize: '13px',
            padding: '8px 12px',
            outline: 'none',
            width: '100%',
            boxSizing: 'border-box',
            marginBottom: '12px',
          }}
          onKeyDown={e => e.key === 'Enter' && handleGenerate()}
        />
        <div
          style={{
            fontSize: '10px',
            color: '#64748B',
            marginBottom: '8px',
          }}
        >
          Sugestões rápidas:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {THEME_SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => setTheme(s)}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                e.currentTarget.style.color = '#F1F5F9'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                e.currentTarget.style.color = '#94A3B8'
              }}
              style={{
                fontSize: '10px',
                padding: '4px 10px',
                borderRadius: '999px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#94A3B8',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div
          style={{
            borderRadius: '10px',
            padding: '10px 16px',
            marginBottom: '16px',
            fontSize: '12px',
            color: '#EF4444',
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.2)',
          }}
        >
          {error}
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={loading || !theme.trim()}
        onMouseEnter={e => { if (!loading && theme.trim()) e.currentTarget.style.opacity = '0.88' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '10px',
          fontWeight: 700,
          fontSize: '13px',
          color: '#fff',
          marginBottom: '24px',
          cursor: loading || !theme.trim() ? 'not-allowed' : 'pointer',
          opacity: loading || !theme.trim() ? 0.4 : 1,
          transition: 'opacity 0.15s',
          background: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
          border: 'none',
        }}
      >
        {loading
          ? '⚡ Gerando conteúdo...'
          : `✨ Gerar 3 Ideias para ${PLATFORMS.find(p => p.key === platform)?.label}`}
      </button>

      {posts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              3 Ideias prontas para usar
            </div>
            <button
              onClick={() => setPosts([])}
              onMouseEnter={e => { e.currentTarget.style.color = '#94A3B8' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#64748B' }}
              style={{
                fontSize: '10px',
                color: '#64748B',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 0.15s',
              }}
            >
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
