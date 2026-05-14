'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import type { ClientData, GeneratedPersona } from '@/lib/store'

const C = {
  bg:       '#080D1A',
  surface:  '#0F1629',
  elevated: '#131E35',
  border:   'rgba(99,120,255,0.1)',
  purple:   '#7C3AED',
  purpleL:  '#A78BFA',
  green:    '#22C55E',
  greenBg:  'rgba(34,197,94,0.1)',
  red:      '#EF4444',
  redBg:    'rgba(239,68,68,0.1)',
  blue:     '#38BDF8',
  blueBg:   'rgba(56,189,248,0.1)',
  gold:     '#F59E0B',
  goldBg:   'rgba(245,158,11,0.1)',
  orange:   '#F97316',
  orangeBg: 'rgba(249,115,22,0.1)',
  text1:    '#F1F5F9',
  text2:    'rgba(255,255,255,0.5)',
  text3:    'rgba(255,255,255,0.25)',
}

interface Props { clientData: ClientData | null }

const ROLES = [
  { key: 'gestor',    label: 'Gestor de Tráfego',   icon: '📡', desc: 'Interesses do Facebook Ads prontos para segmentar' },
  { key: 'social',    label: 'Social Media',         icon: '✏️', desc: 'Ângulos de conteúdo e linguagem editorial' },
  { key: 'influencer',label: 'Influencer / Creator', icon: '🎥', desc: 'Roteiros e ganchos que geram identificação' },
  { key: 'dono',      label: 'Dono do Negócio',      icon: '🏢', desc: 'Visão estratégica e proposta de valor' },
]

const INITIALS_COLORS = [
  { bg: 'linear-gradient(135deg, #7C3AED, #A78BFA)', shadow: 'rgba(124,58,237,0.4)' },
  { bg: 'linear-gradient(135deg, #0EA5E9, #38BDF8)', shadow: 'rgba(14,165,233,0.4)' },
  { bg: 'linear-gradient(135deg, #D97706, #F59E0B)', shadow: 'rgba(217,119,6,0.4)' },
  { bg: 'linear-gradient(135deg, #DC2626, #EF4444)', shadow: 'rgba(220,38,38,0.35)' },
  { bg: 'linear-gradient(135deg, #059669, #22C55E)', shadow: 'rgba(5,150,105,0.4)' },
]

function getAvatarStyle(name: string) {
  return INITIALS_COLORS[name.charCodeAt(0) % INITIALS_COLORS.length]
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function Chip({ text, color, bgOverride }: { text: string; color: string; bgOverride?: string }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 11, padding: '4px 11px', borderRadius: 99,
      fontWeight: 500, marginRight: 5, marginBottom: 5,
      color, background: bgOverride ?? `${color}18`, border: `1px solid ${color}30`,
    }}>
      {text}
    </span>
  )
}

function SectionCard({
  title, color, bg, items, type = 'bullet',
}: {
  title: string; color: string; bg: string; items: string[]; type?: 'bullet' | 'quote'
}) {
  return (
    <div style={{
      padding: 16, borderRadius: 12,
      background: bg, border: `1px solid ${color}28`,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: 1, color, marginBottom: 10,
      }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, i) => (
          <div key={i} style={{ fontSize: 12, color: C.text2, display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.4 }}>
            <span style={{ color, flexShrink: 0, marginTop: 1 }}>
              {type === 'quote' ? '"' : '•'}
            </span>
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

function PersonaCard({ persona }: { persona: GeneratedPersona }) {
  const av = getAvatarStyle(persona.name)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        padding: 20, borderRadius: 14,
        background: `linear-gradient(135deg, rgba(124,58,237,0.1), rgba(56,189,248,0.05))`,
        border: `1px solid rgba(124,58,237,0.25)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18, flexShrink: 0,
            background: av.bg,
            boxShadow: `0 0 20px ${av.shadow}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: 0.5,
          }}>
            {getInitials(persona.name)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.text1, marginBottom: 2 }}>{persona.name}</div>
            <div style={{ fontSize: 13, color: C.text2 }}>{persona.age} · {persona.profession}</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>Renda: {persona.income}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, marginTop: 8 }}>
              {persona.favoriteChannels.map((ch) => <Chip key={ch} text={ch} color={C.blue} />)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <SectionCard
          title="Dores"
          color={C.red}
          bg={C.redBg}
          items={persona.pains}
        />
        <SectionCard
          title="Desejos"
          color={C.green}
          bg={C.greenBg}
          items={persona.desires}
        />
        <SectionCard
          title="Medos"
          color={C.orange}
          bg={C.orangeBg}
          items={persona.fears}
        />
        <SectionCard
          title="Objecoes"
          color={C.purpleL}
          bg="rgba(167,139,250,0.07)"
          items={persona.objections}
          type="quote"
        />
      </div>

      <div style={{
        padding: 16, borderRadius: 12,
        background: C.surface, border: `1px solid ${C.border}`,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: C.text3, marginBottom: 8 }}>
          Comportamento de Compra
        </div>
        <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, margin: 0 }}>{persona.buyingBehavior}</p>
      </div>

      {persona.contentAngles && persona.contentAngles.length > 0 && (
        <div style={{
          padding: 16, borderRadius: 12,
          background: C.goldBg, border: `1px solid ${C.gold}30`,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: C.gold, marginBottom: 10 }}>
            Angulos de Conteudo
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const }}>
            {persona.contentAngles.map((a, i) => <Chip key={i} text={a} color={C.gold} />)}
          </div>
        </div>
      )}

      {persona.facebookInterests && persona.facebookInterests.length > 0 && (
        <div style={{
          padding: 16, borderRadius: 12,
          background: C.blueBg, border: `1px solid ${C.blue}30`,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: C.blue, marginBottom: 4 }}>
            Interesses para Facebook / Instagram Ads
          </div>
          <p style={{ fontSize: 11, color: C.text3, marginBottom: 10, marginTop: 0 }}>
            Copie no Gerenciador de Anúncios → Segmentação Detalhada
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const }}>
            {persona.facebookInterests.map((int, idx) => <Chip key={idx} text={int} color={C.blue} />)}
          </div>
        </div>
      )}

      {persona.googleAdsKeywords && persona.googleAdsKeywords.length > 0 && (
        <div style={{
          padding: 16, borderRadius: 12,
          background: C.greenBg, border: `1px solid ${C.green}25`,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: C.green, marginBottom: 4 }}>
            Palavras-chave para Google Ads
          </div>
          <p style={{ fontSize: 11, color: C.text3, marginBottom: 10, marginTop: 0 }}>
            Use no Planejador de Palavras-chave ou cole direto numa campanha de Pesquisa
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const }}>
            {persona.googleAdsKeywords.map((k, idx) => <Chip key={idx} text={k} color={C.green} />)}
          </div>
        </div>
      )}

      <div style={{
        padding: 16, borderRadius: 12,
        background: C.greenBg, border: `1px solid ${C.green}25`,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: C.green, marginBottom: 8 }}>
          Estrategia Recomendada
        </div>
        <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, margin: 0 }}>{persona.strategySummary}</p>
      </div>
    </div>
  )
}

export function TabPersona({ clientData }: Props) {
  const generatedPersona    = useAppStore((s) => s.generatedPersona)
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: C.text3, fontSize: 13 }}>
        Configure um cliente primeiro para gerar a persona.
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text1, margin: 0 }}>Gerador de Persona</h2>
        <p style={{ fontSize: 12, color: C.text3, marginTop: 4, marginBottom: 0 }}>
          IA cria a persona do cliente ideal com dores, desejos, objeções e interesses de segmentação — adaptada ao seu papel
        </p>
      </div>

      <div style={{
        borderRadius: 14, padding: 20, marginBottom: 20,
        background: C.surface, border: `1px solid ${C.border}`,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: C.text3, marginBottom: 12 }}>
          Voce e um:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {ROLES.map((r) => {
            const active = role === r.key
            return (
              <button
                key={r.key}
                onClick={() => setRole(r.key)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: 14, borderRadius: 12, textAlign: 'left',
                  background: active ? 'rgba(245,158,11,0.08)' : C.elevated,
                  border: `1px solid ${active ? `${C.gold}50` : C.border}`,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{r.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: active ? C.gold : C.text1, marginBottom: 2 }}>
                    {r.label}
                  </div>
                  <div style={{ fontSize: 10, color: C.text3, lineHeight: 1.4 }}>{r.desc}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {(clientData.targetAge || clientData.mainPains || clientData.onlineChannels?.length) && (
        <div style={{
          borderRadius: 10, padding: '10px 16px', marginBottom: 16,
          fontSize: 12, color: C.text2,
          background: C.goldBg, border: `1px solid ${C.gold}20`,
        }}>
          <span style={{ color: C.gold, fontWeight: 600 }}>Dados do cadastro: </span>
          {[clientData.targetAge, clientData.targetGender, clientData.targetIncome, clientData.onlineChannels?.join(', ')].filter(Boolean).join(' · ')}
        </div>
      )}

      {error && (
        <div style={{
          borderRadius: 10, padding: '12px 16px', marginBottom: 16,
          fontSize: 12, color: C.red,
          background: C.redBg, border: `1px solid ${C.red}30`,
        }}>
          {error}
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={loading}
        style={{
          width: '100%', padding: '14px 0', borderRadius: 12, marginBottom: 32,
          fontWeight: 700, fontSize: 14, color: '#000',
          background: loading ? C.elevated : `linear-gradient(135deg, ${C.gold}, #FFD166)`,
          border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {loading ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.text2} strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            <span style={{ color: C.text2 }}>Gerando persona...</span>
          </>
        ) : (
          `Gerar Persona para ${ROLES.find(r => r.key === role)?.label}`
        )}
      </button>

      {generatedPersona && <PersonaCard persona={generatedPersona} />}
    </div>
  )
}
