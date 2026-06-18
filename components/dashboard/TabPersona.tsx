'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import type { ClientData, GeneratedPersona } from '@/lib/store'
import { Icon } from '@/components/dashboard/v2'

// Ícone Clarity por papel (substitui os emojis)
const ROLE_ICON: Record<string, string> = { gestor: 'target', social: 'megaphone', influencer: 'bolt', dono: 'gem' }

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:       '#F4F5F7',
  surface:  '#FFFFFF',
  elevated: '#FBFCFD',
  border:   'rgba(99,120,255,0.1)',
  borderSub:'#E6E8EC',
  purple:   '#2C5FE0',
  purpleL:  '#2C5FE0',
  purpleBg: 'rgba(44,95,224,0.08)',
  green:    '#0E9E6E',
  greenBg:  'rgba(34,197,94,0.08)',
  red:      '#E1483F',
  redBg:    'rgba(239,68,68,0.08)',
  blue:     '#2C5FE0',
  blueBg:   'rgba(56,189,248,0.08)',
  gold:     '#E08B0B',
  goldBg:   'rgba(245,158,11,0.08)',
  orange:   '#F97316',
  orangeBg: 'rgba(249,115,22,0.08)',
  text1:    '#161B26',
  text2:    '#5A6473',
  text3:    '#8A93A3',
}

interface Props { clientData: ClientData | null }

const ROLES = [
  { key: 'gestor',     label: 'Gestor de Tráfego',   icon: '📡', desc: 'Interesses do Facebook Ads prontos para segmentar' },
  { key: 'social',     label: 'Social Media',         icon: '✏️', desc: 'Ângulos de conteúdo e linguagem editorial' },
  { key: 'influencer', label: 'Influencer / Creator', icon: '🎥', desc: 'Roteiros e ganchos que geram identificação' },
  { key: 'dono',       label: 'Dono do Negócio',      icon: '🏢', desc: 'Visão estratégica e proposta de valor' },
]

const INITIALS_COLORS = [
  { bg: 'linear-gradient(135deg, #2C5FE0, #2C5FE0)', shadow: 'rgba(44,95,224,0.4)' },
  { bg: 'linear-gradient(135deg, #0EA5E9, #2C5FE0)', shadow: 'rgba(14,165,233,0.4)' },
  { bg: 'linear-gradient(135deg, #D97706, #E08B0B)', shadow: 'rgba(217,119,6,0.4)' },
  { bg: 'linear-gradient(135deg, #DC2626, #E1483F)', shadow: 'rgba(220,38,38,0.35)' },
  { bg: 'linear-gradient(135deg, #059669, #0E9E6E)', shadow: 'rgba(5,150,105,0.4)' },
]

function getAvatarStyle(name: string) {
  return INITIALS_COLORS[name.charCodeAt(0) % INITIALS_COLORS.length]
}
function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

// ── Calcula pontuação de confiança baseada nos campos reais disponíveis ────────
function calcConfidence(cd: ClientData): { pct: number; label: string; detail: string } {
  let score = 0
  // Campos obrigatórios (sempre confirmados)
  if (cd.niche)             score += 12
  if (cd.products?.length)  score += 8
  if (cd.budget)            score += 7
  if (cd.objective)         score += 6
  if (cd.city)              score += 5   // geralmente preenchido
  // Campos opcionais do wizard (se preenchidos aumentam a confiança)
  if (cd.targetAge)         score += 10
  if (cd.targetGender)      score += 7
  if (cd.targetIncome)      score += 10
  if (cd.mainPains)         score += 12
  if (cd.mainObjection)     score += 8
  if (cd.onlineChannels?.length) score += 7
  if (cd.ticketPrice)       score += 5
  if (cd.awarenessStage)    score += 3

  const pct = Math.min(score, 68) // máximo realista ~68% com todos os dados
  const label = pct >= 55 ? 'Bem fundamentada' : pct >= 38 ? 'Parcialmente baseada em dados' : 'Baseada principalmente em inferências'
  const detail = pct >= 55
    ? 'Persona com alta aderência aos dados reais informados.'
    : pct >= 38
    ? 'Combina dados reais com inferências estratégicas da IA.'
    : 'Poucos dados disponíveis — a IA usou padrões do nicho para completar.'
  return { pct, label, detail }
}

// ── Badges de classificação de dados ─────────────────────────────────────────
type BadgeType = 'confirmed' | 'inferred' | 'benchmark'
function DataBadge({ type }: { type: BadgeType }) {
  const cfg = {
    confirmed:  { dot: '#0E9E6E', label: 'Confirmado',        bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)' },
    inferred:   { dot: '#E08B0B', label: 'Inferido pela IA',  bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)' },
    benchmark:  { dot: '#2C5FE0', label: 'Padrão do nicho',   bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.2)' },
  }[type]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      fontSize: '9px', fontWeight: 600, padding: '2px 7px', borderRadius: '99px',
      background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.dot,
      letterSpacing: '0.03em',
    }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  )
}

// ── Seção de campos com badge ─────────────────────────────────────────────────
function SectionCard({ title, color, bg, items, type = 'bullet', badgeType }: {
  title: string; color: string; bg: string; items: string[]
  type?: 'bullet' | 'quote'; badgeType: BadgeType
}) {
  return (
    <div style={{ padding: 16, borderRadius: 12, background: bg, border: `1px solid ${color}28` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, color }}>
          {title}
        </div>
        <DataBadge type={badgeType} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
        {items.map((item, i) => (
          <div key={i} style={{ fontSize: 12, color: C.text2, display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.4 }}>
            <span style={{ color, flexShrink: 0, marginTop: 1 }}>{type === 'quote' ? '"' : '•'}</span>
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

function Chip({ text, color }: { text: string; color: string }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 11, padding: '4px 11px', borderRadius: 99,
      fontWeight: 500, marginRight: 5, marginBottom: 5,
      color, background: `${color}18`, border: `1px solid ${color}30`,
    }}>
      {text}
    </span>
  )
}

// ── Card principal da Persona ─────────────────────────────────────────────────
function PersonaCard({ persona, clientData }: { persona: GeneratedPersona; clientData: ClientData }) {
  const av         = getAvatarStyle(persona.name)
  const confidence = calcConfidence(clientData)

  // Determina badge de cada campo baseado nos dados do wizard
  const ageBadge:     BadgeType = clientData.targetAge     ? 'confirmed' : 'benchmark'
  const incomeBadge:  BadgeType = clientData.targetIncome  ? 'confirmed' : 'inferred'
  const painsBadge:   BadgeType = clientData.mainPains     ? 'confirmed' : 'benchmark'
  const objBadge:     BadgeType = clientData.mainObjection ? 'confirmed' : 'benchmark'
  const channelBadge: BadgeType = clientData.onlineChannels?.length ? 'confirmed' : 'benchmark'

  const roleLabel = ROLES.find(r => r.key === persona.role)?.label || 'Gestor de Tráfego'
  const personaSummary = persona.strategySummary || persona.buyingBehavior || `${persona.profession}.`
  const statBoxes: [string, string][] = [
    ['Idade', persona.age || '—'],
    ['Gênero', clientData.targetGender || '—'],
    ['Renda', persona.income || clientData.targetIncome || '—'],
    ['Regiões', clientData.city || '—'],
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>

      {/* ── Perfil da persona (fiel a screens-extra › PersonaBlock) ──────── */}
      <div style={{ padding: 18, borderRadius: 16, background: '#FFFFFF', border: '1px solid #E6E5E0', boxShadow: '0 1px 2px rgba(24,25,29,.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' as const }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, background: '#ECECE8', color: C.text2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="users" size={16} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text1, letterSpacing: '-0.01em' }}>Perfil da persona</div>
            <div style={{ fontSize: 12, color: C.text3 }}>Adaptado para {roleLabel}</div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: '#EBF0FE', color: '#1E47C4', border: '1px solid #CCDAFB' }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: '#2B5BE3' }} /> {roleLabel}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, flexShrink: 0, background: av.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff' }}>
            {getInitials(persona.name)}
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.text1 }}>{persona.name}</div>
            <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, marginTop: 4 }}>{personaSummary}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 16 }}>
          {statBoxes.map(([k, v]) => (
            <div key={k} style={{ padding: '10px 12px', background: '#F4F4F2', borderRadius: 8, border: '1px solid #E6E5E0' }}>
              <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: C.text3, marginBottom: 3 }}>{k}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. SEÇÕES DORES / DESEJOS / MEDOS / OBJEÇÕES com badges ────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <SectionCard title="Dores"    color={C.red}     bg={C.redBg}    items={persona.pains}      badgeType={painsBadge} />
        <SectionCard title="Desejos"  color={C.green}   bg={C.greenBg}  items={persona.desires}    badgeType="benchmark" />
        <SectionCard title="Medos"    color={C.orange}  bg={C.orangeBg} items={persona.fears}      badgeType="benchmark" />
        <SectionCard title="Objeções" color={C.purpleL} bg={C.purpleBg} items={persona.objections} badgeType={objBadge} type="quote" />
      </div>

      {/* ── 5. COMPORTAMENTO DE COMPRA ───────────────────────────────────── */}
      <div style={{ padding: 16, borderRadius: 12, background: C.surface, border: `1px solid ${C.borderSub}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, color: C.text3 }}>
            Comportamento de Compra
          </div>
          <DataBadge type="inferred" />
        </div>
        <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, margin: 0 }}>{persona.buyingBehavior}</p>
      </div>

      {/* ── 6. ÂNGULOS DE CONTEÚDO ───────────────────────────────────────── */}
      {persona.contentAngles && persona.contentAngles.length > 0 && (
        <div style={{ padding: 16, borderRadius: 12, background: C.goldBg, border: `1px solid ${C.gold}30` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, color: C.gold }}>
              Ângulos de Conteúdo
            </div>
            <DataBadge type="inferred" />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const }}>
            {persona.contentAngles.map((a, i) => <Chip key={i} text={a} color={C.gold} />)}
          </div>
        </div>
      )}

      {/* ── 7. SEGMENTAÇÕES META ADS — com disclaimer (Melhoria 5) ──────── */}
      {persona.facebookInterests && persona.facebookInterests.length > 0 && (
        <div style={{ padding: 16, borderRadius: 12, background: C.blueBg, border: `1px solid ${C.blue}30` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text1, letterSpacing: '-0.01em' }}>Interesses para o Facebook Ads</div>
              <div style={{ fontSize: 12, color: C.text3 }}>Prontos para colar no Gerenciador de Anúncios</div>
            </div>
            <DataBadge type="benchmark" />
          </div>
          <p style={{ fontSize: 11, color: C.text3, margin: '0 0 10px', lineHeight: 1.5 }}>
            Hipóteses estratégicas geradas pela IA. Valide em campanhas reais antes de escalar.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const }}>
            {persona.facebookInterests.map((int, idx) => <Chip key={idx} text={int} color={C.blue} />)}
          </div>
        </div>
      )}

      {/* ── 8. KEYWORDS GOOGLE ADS — com disclaimer ──────────────────────── */}
      {persona.googleAdsKeywords && persona.googleAdsKeywords.length > 0 && (
        <div style={{ padding: 16, borderRadius: 12, background: C.greenBg, border: `1px solid ${C.green}25` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, color: C.green }}>
              Palavras-chave sugeridas para Google Ads
            </div>
            <DataBadge type="benchmark" />
          </div>
          <p style={{ fontSize: 11, color: C.text3, margin: '0 0 10px', lineHeight: 1.5 }}>
            Hipóteses de intenção de busca baseadas no nicho. Valide volume e CPC no Planejador de Palavras-chave do Google antes de ativar.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const }}>
            {persona.googleAdsKeywords.map((k, idx) => <Chip key={idx} text={k} color={C.green} />)}
          </div>
        </div>
      )}

      {/* ── 9. CONTRIBUIÇÃO DA IA (Melhoria 7) ──────────────────────────── */}
      <div style={{ padding: '14px 18px', borderRadius: 12, background: C.purpleBg, border: '1px solid rgba(44,95,224,0.18)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.purpleL, marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
          O que a IA acrescentou
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 5 }}>
          {[
            !clientData.targetAge     && 'Estimou a faixa etária mais provável para o nicho',
            !clientData.targetIncome  && 'Estimou a faixa de renda do público-alvo',
            !clientData.mainPains     && 'Identificou as dores mais comuns do segmento',
                                         'Inferiu comportamentos digitais típicos do perfil',
            persona.facebookInterests?.length && 'Sugeriu interesses para segmentação no Meta Ads',
            persona.googleAdsKeywords?.length && 'Sugeriu palavras-chave de intenção de compra para Google',
                                         'Criou ângulos de conteúdo alinhados ao nicho e ao objetivo',
          ].filter(Boolean).map((line, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12, color: C.text2, lineHeight: 1.4 }}>
              <span style={{ color: C.purpleL, flexShrink: 0, marginTop: 1 }}>✓</span>
              {line}
            </div>
          ))}
        </div>
      </div>

      {/* ── 10. ESTRATÉGIA RECOMENDADA ───────────────────────────────────── */}
      <div style={{ padding: 16, borderRadius: 12, background: C.greenBg, border: `1px solid ${C.green}25` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, color: C.green }}>
            Estratégia Recomendada
          </div>
          <DataBadge type="inferred" />
        </div>
        <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, margin: 0 }}>{persona.strategySummary}</p>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export function TabPersona({ clientData }: Props) {
  const generatedPersona    = useAppStore(s => s.generatedPersona)
  const setGeneratedPersona = useAppStore(s => s.setGeneratedPersona)
  const [role, setRole]     = useState('gestor')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleGenerate = async () => {
    if (!clientData) return
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientData, role }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Erro ao gerar persona')
      setGeneratedPersona({ ...data.persona, role, generatedAt: new Date().toISOString() })
      fetch('/api/logs', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'persona', action: 'generate', clientName: clientData.clientName,
          detail: `Persona gerada para ${clientData.clientName} (${clientData.niche})` }) }).catch(() => {})
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

  // Pré-calcula confiança para exibir antes de gerar
  const confidence = calcConfidence(clientData)
  const filledOptional = [
    clientData.targetAge, clientData.targetGender, clientData.targetIncome,
    clientData.mainPains, clientData.mainObjection, clientData.onlineChannels?.length,
  ].filter(Boolean).length

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text1, margin: 0, letterSpacing: '-0.025em' }}>Persona do Cliente</h2>
        <p style={{ fontSize: 13.5, color: C.text2, marginTop: 5, marginBottom: 0, lineHeight: 1.6, maxWidth: 680 }}>
          O NOUS cria o perfil do cliente ideal — dores, desejos, objeções e segmentações — a partir dos dados reais do seu negócio, adaptado para quem vai usar.
        </p>
      </div>

      {/* Seletor de papel */}
      <div style={{ borderRadius: 14, padding: 20, marginBottom: 16, background: C.surface, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: C.text3, marginBottom: 13 }}>
          Você vai usar como
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {ROLES.map(r => {
            const active = role === r.key
            return (
              <button key={r.key} onClick={() => setRole(r.key)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 15px', borderRadius: 12, textAlign: 'left' as const,
                background: active ? '#EBF0FE' : '#FFFFFF',
                border: `1px solid ${active ? '#2B5BE3' : C.border}`,
                boxShadow: active ? 'none' : '0 1px 2px rgba(24,25,29,.04)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                <span style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: active ? '#2B5BE3' : '#ECECE8', color: active ? '#fff' : C.text2 }}>
                  <Icon name={ROLE_ICON[r.key] || 'users'} size={19} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: active ? '#1E47C4' : C.text1, marginBottom: 2 }}>{r.label}</div>
                  <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.4 }}>{r.desc}</div>
                </div>
                <span style={{ width: 20, height: 20, borderRadius: 99, flexShrink: 0, border: `2px solid ${active ? '#2B5BE3' : '#D5D4CD'}`, background: active ? '#2B5BE3' : 'transparent', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {active && <Icon name="check" size={12} w={3} />}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Preview da confiança antes de gerar */}
      {!generatedPersona && (
        <div style={{ borderRadius: 10, padding: '10px 16px', marginBottom: 14, background: C.surface, border: `1px solid ${C.borderSub}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: C.text3, fontWeight: 600 }}>Qualidade estimada da persona</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: confidence.pct >= 50 ? C.green : confidence.pct >= 35 ? C.gold : C.orange }}>
              ~{confidence.pct}%
            </span>
          </div>
          <div style={{ height: 4, borderRadius: 99, background: '#E6E8EC', overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ height: '100%', borderRadius: 99, width: `${confidence.pct}%`, background: confidence.pct >= 50 ? C.green : confidence.pct >= 35 ? C.gold : C.orange, transition: 'width 0.6s ease' }} />
          </div>
          <p style={{ fontSize: 11, color: C.text3, margin: 0, lineHeight: 1.5 }}>
            {filledOptional < 3
              ? `Você preencheu ${filledOptional} de 6 campos opcionais do público-alvo. `
              : `${filledOptional} de 6 campos opcionais preenchidos. `}
            <button
              onClick={() => {}}
              style={{ color: C.purpleL, background: 'none', border: 'none', cursor: 'default', fontSize: 11, padding: 0 }}
            >
              {filledOptional < 3
                ? 'Completar os campos Faixa Etária, Dores e Renda pode dobrar a precisão.'
                : 'Bom nível de dados para uma persona sólida.'}
            </button>
          </p>
        </div>
      )}

      {/* Dados do wizard que foram preenchidos */}
      {(clientData.targetAge || clientData.mainPains || clientData.onlineChannels?.length) && (
        <div style={{ borderRadius: 10, padding: '8px 14px', marginBottom: 14, fontSize: 12, color: C.text2, background: C.goldBg, border: `1px solid ${C.gold}20` }}>
          <span style={{ color: C.gold, fontWeight: 600 }}>Dados confirmados do público: </span>
          {[clientData.targetAge, clientData.targetGender, clientData.targetIncome, clientData.onlineChannels?.join(', ')].filter(Boolean).join(' · ')}
        </div>
      )}

      {error && (
        <div style={{ borderRadius: 10, padding: '12px 16px', marginBottom: 14, fontSize: 12, color: C.red, background: C.redBg, border: `1px solid ${C.red}30` }}>
          {error}
        </div>
      )}

      {/* Botão de geração */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        style={{
          width: '100%', padding: '14px 0', borderRadius: 12, marginBottom: 28,
          fontWeight: 700, fontSize: 14, color: '#fff',
          background: loading ? '#ECECE8' : '#2B5BE3',
          border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {loading ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.text2} strokeWidth="2"
              style={{ animation: 'personaSpin 1s linear infinite' }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            <span style={{ color: C.text2 }}>Gerando persona…</span>
          </>
        ) : (
          <><Icon name="spark" size={15} /> {generatedPersona ? 'Regenerar' : 'Gerar'} persona para {ROLES.find(r => r.key === role)?.label}</>
        )}
      </button>

      {generatedPersona && <PersonaCard persona={generatedPersona} clientData={clientData} />}

      <style>{`@keyframes personaSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
