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
  { key: 'email',     label: 'E-mail',     icon: '✉️', color: '#2B5BE3' },
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
        background: copied ? 'rgba(34,197,94,0.12)' : '#F1F1EE',
        border: copied ? '1px solid rgba(34,197,94,0.3)' : '1px solid #E6E5E0',
        color: copied ? '#0E9E6E' : '#898C97',
      }}
    >
      {copied ? '✓ Copiado' : 'Copiar'}
    </button>
  )
}

function PostCard({ post, index, platform }: { post: Post; index: number; platform: string }) {
  const pl = PLATFORMS.find(p => p.key === platform)
  const color = pl?.color || '#2B5BE3'
  const fullText = `${post.gancho}\n\n${post.legenda}\n\n${post.cta}\n\n${post.hashtags.map(h => `#${h.replace(/^#/, '')}`).join(' ')}`

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E6E5E0',
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
          borderBottom: '1px solid #E6E5E0',
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
          <span style={{ fontSize: '11px', color: '#898C97' }}>Ideia {index + 1}</span>
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
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#18191D', lineHeight: 1.4, margin: 0 }}>
            {post.gancho}
          </p>
        </div>

        {/* Estrutura */}
        <div>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#898C97',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '4px',
            }}
          >
            📐 Estrutura
          </div>
          <p style={{ fontSize: '11px', color: '#565862', lineHeight: 1.6, margin: 0 }}>{post.estrutura}</p>
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
                color: '#898C97',
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
              color: '#565862',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              background: '#F4F4F2',
              border: '1px solid #E6E5E0',
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
            <p style={{ fontSize: '11px', color: '#565862', margin: 0 }}>{post.cta}</p>
          </div>
        </div>

        {/* Hashtags */}
        {post.hashtags?.length > 0 && (
          <div>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#898C97',
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
                    background: '#F1F1EE',
                    border: '1px solid #E6E5E0',
                    color: '#565862',
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
          color: '#898C97',
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
            color: '#18191D',
            margin: 0,
            marginBottom: '4px',
          }}
        >
          Gerador de Conteúdo
        </h2>
        <p style={{ fontSize: '12px', color: '#898C97', margin: 0 }}>
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
            background: 'rgba(43,91,227,0.10)',
            border: '1px solid rgba(43,91,227,0.22)',
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: 99, background: '#2B5BE3', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '11px', color: '#2B5BE3', fontWeight: 600 }}>Persona ativa: </span>
            <span style={{ fontSize: '11px', color: '#565862' }}>
              {generatedPersona.name} · {generatedPersona.profession}
            </span>
          </div>
          <span style={{ fontSize: '10px', color: '#898C97', flexShrink: 0 }}>conteúdo será personalizado</span>
        </div>
      ) : (
        <div
          style={{
            borderRadius: '10px',
            padding: '10px 16px',
            marginBottom: '20px',
            fontSize: '11px',
            color: '#898C97',
            background: '#F1F1EE',
            border: '1px solid #E6E5E0',
          }}
        >
          💡 Gere uma persona na aba{' '}
          <span style={{ color: '#565862', fontWeight: 500 }}>Persona IA</span>{' '}
          para conteúdo ainda mais personalizado
        </div>
      )}

      {/* Seletor de plataforma */}
      <div
        style={{
          borderRadius: '14px',
          padding: '20px',
          marginBottom: '20px',
          background: '#FFFFFF',
          border: '1px solid #E6E5E0',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#565862',
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
          {PLATFORMS.map(pl => {
            const active = platform === pl.key
            return (
            <button
              key={pl.key}
              onClick={() => setPlatform(pl.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 12px',
                borderRadius: '8px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: active ? '#FFFFFF' : '#F4F4F2',
                border: `1px solid ${active ? pl.color : '#E6E5E0'}`,
                boxShadow: active ? '0 1px 2px rgba(20,20,30,0.05)' : 'none',
              }}
            >
              <span style={{ width: 9, height: 9, borderRadius: 3, background: pl.color, flexShrink: 0 }} />
              <span
                style={{
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: active ? '#18191D' : '#565862',
                }}
              >
                {pl.label}
              </span>
            </button>
            )
          })}
        </div>
      </div>

      {/* Tema */}
      <div
        style={{
          borderRadius: '14px',
          padding: '20px',
          marginBottom: '20px',
          background: '#FFFFFF',
          border: '1px solid #E6E5E0',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#565862',
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
            background: '#FBFCFD',
            border: '1px solid #E6E5E0',
            borderRadius: '10px',
            color: '#18191D',
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
            color: '#898C97',
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
                e.currentTarget.style.borderColor = '#565862'
                e.currentTarget.style.color = '#18191D'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#E6E5E0'
                e.currentTarget.style.color = '#565862'
              }}
              style={{
                fontSize: '10px',
                padding: '4px 10px',
                borderRadius: '999px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: '#F1F1EE',
                border: '1px solid #E6E5E0',
                color: '#565862',
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
            color: '#E1483F',
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
          color: '#18191D',
          marginBottom: '24px',
          cursor: loading || !theme.trim() ? 'not-allowed' : 'pointer',
          opacity: loading || !theme.trim() ? 0.4 : 1,
          transition: 'opacity 0.15s',
          background: 'linear-gradient(135deg, #2B5BE3, #2B5BE3)',
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
                color: '#565862',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              3 Ideias prontas para usar
            </div>
            <button
              onClick={() => setPosts([])}
              onMouseEnter={e => { e.currentTarget.style.color = '#565862' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#898C97' }}
              style={{
                fontSize: '10px',
                color: '#898C97',
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
