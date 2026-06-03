'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { useViewMode, TAB_HEADINGS_SIMPLE } from '@/lib/viewMode'
import type { ClientData, Competitor } from '@/lib/store'

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
  text1:    '#F1F5F9',
  text2:    'rgba(255,255,255,0.5)',
  text3:    'rgba(255,255,255,0.25)',
}

interface Props { clientData: ClientData | null }

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (d > 0) return `${d}d atrás`
  if (h > 0) return `${h}h atrás`
  return `${m}min atrás`
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  { bg: 'rgba(124,58,237,0.2)', border: 'rgba(124,58,237,0.4)', text: '#A78BFA' },
  { bg: 'rgba(56,189,248,0.15)', border: 'rgba(56,189,248,0.35)', text: '#38BDF8' },
  { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)', text: '#F59E0B' },
  { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', text: '#EF4444' },
  { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', text: '#22C55E' },
]

function avatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

function Chip({ text, color }: { text: string; color: string }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 11, padding: '3px 10px', borderRadius: 99,
      fontWeight: 500, marginRight: 4, marginBottom: 4,
      color, background: `${color}18`, border: `1px solid ${color}30`,
    }}>
      {text}
    </span>
  )
}

function AnalysisCard({ competitor, onRemove }: { competitor: Competitor; onRemove: () => void }) {
  const [open, setOpen] = useState(true)
  const a = competitor.analysis
  const av = avatarColor(competitor.name)

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 14, overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: av.bg, border: `1px solid ${av.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: av.text, letterSpacing: 0.5,
          }}>
            {getInitials(competitor.name)}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text1 }}>{competitor.name}</div>
            {competitor.analyzedAt && (
              <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>
                Analisado {timeAgo(competitor.analyzedAt)}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {competitor.ads && competitor.ads.length > 0 && (
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 600,
              background: C.greenBg, color: C.green, border: `1px solid ${C.green}30`,
            }}>
              {competitor.ads.length} anúncios
            </span>
          )}
          <button
            onClick={() => setOpen(v => !v)}
            style={{
              fontSize: 11, color: C.text2, background: C.elevated, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: '4px 10px', cursor: 'pointer',
            }}
          >
            {open ? '▲' : '▼'}
          </button>
          <button
            onClick={onRemove}
            style={{
              fontSize: 11, color: C.text3, background: 'transparent', border: 'none',
              borderRadius: 6, padding: '4px 6px', cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {open && a && (
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            padding: 14, borderRadius: 10,
            background: 'rgba(124,58,237,0.07)', border: `1px solid rgba(124,58,237,0.2)`,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: C.purpleL, marginBottom: 6 }}>
              Oferta Principal
            </div>
            <p style={{ fontSize: 13, color: C.text1, lineHeight: 1.5, margin: 0 }}>{a.mainOffer}</p>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: C.text3, marginBottom: 8 }}>
              Posicionamento
            </div>
            <p style={{ fontSize: 12, color: C.text2, lineHeight: 1.6, margin: 0 }}>{a.positioning}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: C.text3, marginBottom: 8 }}>
                Angulos Criativos
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {a.creativeAngles.map((angle, i) => (
                  <div key={i} style={{ fontSize: 11, color: C.text2, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <span style={{ color: C.purpleL, flexShrink: 0 }}>›</span>
                    {angle}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: C.text3, marginBottom: 8 }}>
                CTAs que usam
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const }}>
                {a.ctas.map((cta, i) => <Chip key={i} text={cta} color={C.blue} />)}
              </div>
            </div>
          </div>

          {a.weaknesses.length > 0 && (
            <div style={{
              padding: 14, borderRadius: 10,
              background: C.redBg, border: `1px solid ${C.red}25`,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: C.red, marginBottom: 8 }}>
                Pontos Fracos deles
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {a.weaknesses.map((w, i) => (
                  <div key={i} style={{ fontSize: 11, color: C.text2, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <span style={{ color: C.red, flexShrink: 0 }}>✗</span>
                    {w}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{
            padding: 14, borderRadius: 10,
            background: C.goldBg, border: `1px solid ${C.gold}30`,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: C.gold, marginBottom: 6 }}>
              Como se Diferenciar
            </div>
            <p style={{ fontSize: 12, color: C.text1, lineHeight: 1.6, margin: 0 }}>{a.differentiation}</p>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: C.text3, marginBottom: 8 }}>
              Acoes para Superar
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {a.recommendations.map((rec, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  fontSize: 12, color: C.text2, padding: '10px 14px', borderRadius: 8,
                  background: C.greenBg, border: `1px solid ${C.green}20`,
                }}>
                  <span style={{ color: C.green, fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                  {rec}
                </div>
              ))}
            </div>
          </div>

          {competitor.ads && competitor.ads.length > 0 && (
            <details>
              <summary style={{
                fontSize: 11, color: C.text3, cursor: 'pointer',
                userSelect: 'none', listStyle: 'none',
              }}>
                Ver {competitor.ads.length} anúncios capturados ›
              </summary>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {competitor.ads.map((ad, i) => (
                  <div key={i} style={{
                    padding: 12, borderRadius: 8, fontSize: 11, color: C.text2,
                    background: C.elevated, border: `1px solid ${C.border}`,
                  }}>
                    {ad.page && <div style={{ fontSize: 10, color: C.text3, marginBottom: 4 }}>{ad.page}</div>}
                    {ad.title && <div style={{ fontWeight: 600, color: C.text1, marginBottom: 4 }}>"{ad.title}"</div>}
                    {ad.body && <div style={{ lineHeight: 1.5 }}>{ad.body.slice(0, 280)}{ad.body.length > 280 ? '…' : ''}</div>}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

function MarketIntelCard({ clientName, niche, city }: { clientName: string; niche?: string; city?: string }) {
  const marketResearch        = useAppStore(s => s.marketResearch)
  const marketResearchTaskIds = useAppStore(s => s.marketResearchTaskIds)
  const setMarketResearch     = useAppStore(s => s.setMarketResearch)
  const setMarketResearchTaskId = useAppStore(s => s.setMarketResearchTaskId)
  const data   = marketResearch[clientName]
  const taskId = marketResearchTaskIds[clientName]
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const [polling, setPolling]       = useState(false)
  const [requesting, setRequesting] = useState(false)

  const startPolling = (tid: string) => {
    if (pollRef.current) clearInterval(pollRef.current)
    setPolling(true)
    let attempts = 0
    pollRef.current = setInterval(async () => {
      attempts++
      if (attempts > 30) { clearInterval(pollRef.current!); setPolling(false); return }
      try {
        const r = await fetch(`/api/manus/status?task_id=${tid}`)
        const d = await r.json()
        if (d.done && (d.parsed || d.output)) {
          clearInterval(pollRef.current!)
          setPolling(false)
          const researchData = {
            competitors: d.parsed?.competitors ?? (Array.isArray(d.parsed) ? d.parsed : []),
            opportunities: d.parsed?.opportunities ?? '',
            mistakes: d.parsed?.competitor_mistakes ?? '',
            raw: d.output,
            fetchedAt: new Date().toISOString(),
          }
          setMarketResearch(clientName, researchData)
          // Persiste no banco — fire-and-forget
          fetch('/api/market-intelligence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientName, niche,
              competitors:   researchData.competitors,
              opportunities: researchData.opportunities,
              mistakes:      researchData.mistakes,
              rawData:       { output: d.output, parsed: d.parsed },
              source: 'manus',
            }),
          }).catch(() => {})
        }
      } catch {}
    }, 20000)
  }

  useEffect(() => {
    if (!taskId || data || polling) return
    startPolling(taskId)
    return () => clearInterval(pollRef.current!)
  }, [taskId, data, clientName])

  const handleRefresh = async () => {
    if (!niche || requesting || polling) return
    setRequesting(true)
    try {
      const r = await fetch('/api/manus/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, city, type: 'competitors' }),
      })
      const d = await r.json()
      if (d.task_id) {
        setMarketResearchTaskId(clientName, d.task_id)
        startPolling(d.task_id)
      }
    } catch {}
    setRequesting(false)
  }

  if (!data && (taskId || polling)) {
    return (
      <div style={{
        borderRadius: 14, padding: '14px 18px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(124,58,237,0.06)', border: `1px solid rgba(124,58,237,0.2)`,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', background: C.purpleL, flexShrink: 0,
          animation: 'pulse 1.5s infinite',
        }} />
        <span style={{ fontSize: 11, color: C.text2 }}>
          Levantando inteligência de mercado para este nicho — disponível em alguns minutos.
        </span>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{
        borderRadius: 14, padding: '14px 18px', marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(124,58,237,0.04)', border: `1px solid ${C.border}`,
      }}>
        <span style={{ fontSize: 11, color: C.text3 }}>Pesquisa de mercado autônoma não gerada ainda.</span>
        <button
          onClick={handleRefresh}
          disabled={requesting || !niche}
          style={{
            fontSize: 11, padding: '6px 14px', borderRadius: 8, fontWeight: 600,
            background: 'rgba(124,58,237,0.15)', color: C.purpleL,
            border: `1px solid rgba(124,58,237,0.3)`, cursor: 'pointer', opacity: (requesting || !niche) ? 0.4 : 1,
          }}
        >
          {requesting ? 'Iniciando...' : '⚡ Pesquisar agora'}
        </button>
      </div>
    )
  }

  const competitors: any[] = data.competitors || []
  const opportunities = data.opportunities
  const mistakes = data.mistakes

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: C.text3 }}>
          Inteligência de Mercado
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {polling && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.purpleL }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.purpleL, display: 'inline-block' }} />
              atualizando...
            </span>
          )}
          {data.fetchedAt && !polling && (
            <span style={{ fontSize: 10, color: C.text3 }}>{timeAgo(data.fetchedAt)}</span>
          )}
          <button
            onClick={handleRefresh}
            disabled={requesting || polling || !niche}
            style={{
              fontSize: 10, padding: '5px 12px', borderRadius: 8,
              background: 'rgba(124,58,237,0.08)', color: C.purpleL,
              border: `1px solid rgba(124,58,237,0.2)`, cursor: 'pointer',
              opacity: (requesting || polling || !niche) ? 0.4 : 1,
            }}
          >
            {requesting ? '...' : '↻ Atualizar'}
          </button>
        </div>
      </div>

      {competitors.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {competitors.map((comp: any, i: number) => {
            const av = avatarColor(comp.name || comp.competitor_name || 'X')
            return (
              <div key={i} style={{
                borderRadius: 12, padding: 14,
                background: C.surface, border: `1px solid ${C.border}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: av.bg, border: `1px solid ${av.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: av.text,
                  }}>
                    {getInitials(comp.name || comp.competitor_name || 'XX')}
                  </div>
                  <span style={{ fontWeight: 700, color: C.text1, fontSize: 13 }}>
                    {comp.name || comp.competitor_name}
                  </span>
                  {comp.website && (
                    <a href={comp.website} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 10, color: C.text3, textDecoration: 'none' }}>↗</a>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                  {comp.positioning && (
                    <p style={{ fontSize: 11, color: C.text2, margin: 0, gridColumn: '1 / -1' }}>
                      <span style={{ color: C.text3 }}>Posicionamento: </span>{comp.positioning}
                    </p>
                  )}
                  {comp.channels && (
                    <p style={{ fontSize: 11, color: C.text2, margin: 0 }}>
                      <span style={{ color: C.green, fontWeight: 600 }}>Canais: </span>
                      {Array.isArray(comp.channels) ? comp.channels.join(', ') : comp.channels}
                    </p>
                  )}
                  {comp.pricing && (
                    <p style={{ fontSize: 11, color: C.text2, margin: 0 }}>
                      <span style={{ color: C.gold, fontWeight: 600 }}>Pricing: </span>{comp.pricing}
                    </p>
                  )}
                  {comp.weaknesses && (
                    <p style={{ fontSize: 11, color: C.text2, margin: 0, gridColumn: '1 / -1' }}>
                      <span style={{ color: C.red, fontWeight: 600 }}>Fraqueza: </span>
                      {Array.isArray(comp.weaknesses) ? comp.weaknesses.join(' · ') : comp.weaknesses}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {opportunities && (
          <div style={{
            padding: 14, borderRadius: 12,
            background: C.greenBg, border: `1px solid ${C.green}25`,
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: C.green, marginBottom: 6 }}>
              Oportunidades
            </div>
            <p style={{ fontSize: 11, color: C.text2, lineHeight: 1.6, margin: 0 }}>
              {Array.isArray(opportunities) ? opportunities.join(' · ') : opportunities}
            </p>
          </div>
        )}
        {mistakes && (
          <div style={{
            padding: 14, borderRadius: 12,
            background: C.redBg, border: `1px solid ${C.red}20`,
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: C.red, marginBottom: 6 }}>
              Erros do mercado
            </div>
            <p style={{ fontSize: 11, color: C.text2, lineHeight: 1.6, margin: 0 }}>
              {Array.isArray(mistakes) ? mistakes.join(' · ') : mistakes}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export function TabConcorrentes({ clientData }: Props) {
  const competitors      = useAppStore(s => s.competitors)
  const addCompetitor    = useAppStore(s => s.addCompetitor)
  const updateCompetitor = useAppStore(s => s.updateCompetitor)
  const removeCompetitor = useAppStore(s => s.removeCompetitor)
  const connectedAccounts = useAppStore(s => s.connectedAccounts)
  const metaAccount = connectedAccounts.find(a => a.platform === 'meta')

  const clientName = clientData?.clientName || ''
  const clientCompetitors = competitors[clientName] || []

  const [name, setName]   = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleAnalyze = async () => {
    if (!name.trim() || !clientData) return
    setLoading(true)
    setError('')

    addCompetitor(clientName, { name: name.trim(), notes: notes.trim() || undefined })

    try {
      const res = await fetch('/api/concorrentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitorName: name.trim(),
          niche: clientData.niche,
          metaAccessToken: metaAccount?.accessToken,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Erro ao analisar concorrente')

      const current = useAppStore.getState().competitors[clientName] || []
      const newest = current[0]
      if (newest) {
        updateCompetitor(clientName, newest.id, {
          analyzedAt: new Date().toISOString(),
          ads: data.ads,
          analysis: data.analysis,
        })
      }

      setName('')
      setNotes('')
    } catch (e: any) {
      setError(e.message)
      const current = useAppStore.getState().competitors[clientName] || []
      if (current[0] && !current[0].analyzedAt) {
        removeCompetitor(clientName, current[0].id)
      }
    } finally {
      setLoading(false)
    }
  }

  if (!clientData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: C.text3, fontSize: 13 }}>
        Configure um cliente primeiro para analisar concorrentes.
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text1, margin: 0 }}>{useViewMode().mode === 'simple' ? TAB_HEADINGS_SIMPLE.concorrentes.title : 'Radar de Concorrentes'}</h2>
        <p style={{ fontSize: 12, color: C.text3, marginTop: 4, marginBottom: 0 }}>
          {useViewMode().mode === 'simple' ? TAB_HEADINGS_SIMPLE.concorrentes.subtitle : 'IA analisa posicionamento, criativos e CTAs dos concorrentes — e aponta como se diferenciar'}
        </p>
      </div>

      {metaAccount ? (
        <div style={{
          borderRadius: 12, padding: '12px 16px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 10,
          background: C.greenBg, border: `1px solid ${C.green}25`,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>Meta Ads conectado — </span>
            <span style={{ fontSize: 12, color: C.text2 }}>anúncios reais do concorrente serão capturados automaticamente</span>
          </div>
        </div>
      ) : (
        <div style={{
          borderRadius: 12, padding: '12px 16px', marginBottom: 20,
          fontSize: 12, color: C.text3,
          background: C.surface, border: `1px solid ${C.border}`,
        }}>
          Conecte o <span style={{ color: C.text1, fontWeight: 600 }}>Meta Ads</span> em Anúncios IA para capturar anúncios reais dos concorrentes
        </div>
      )}

      <div style={{
        borderRadius: 14, padding: 20, marginBottom: 16,
        background: C.surface, border: `1px solid ${C.border}`,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: C.text3, marginBottom: 12 }}>
          Novo Concorrente
        </div>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
          placeholder="Nome do concorrente ou página no Facebook"
          style={{
            width: '100%', background: C.elevated, borderRadius: 10,
            padding: '12px 16px', fontSize: 13, color: C.text1,
            border: `1px solid ${C.border}`, outline: 'none',
            marginBottom: 10, boxSizing: 'border-box',
            fontFamily: 'inherit',
          }}
        />
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Observações opcionais (ex: principal oferta, site, diferenciais percebidos)"
          rows={2}
          style={{
            width: '100%', background: C.elevated, borderRadius: 10,
            padding: '10px 16px', fontSize: 12, color: C.text2,
            border: `1px solid ${C.border}`, outline: 'none', resize: 'none',
            boxSizing: 'border-box', fontFamily: 'inherit',
          }}
        />
      </div>

      {error && (
        <div style={{
          borderRadius: 10, padding: '12px 16px', marginBottom: 14,
          fontSize: 12, color: C.red,
          background: C.redBg, border: `1px solid ${C.red}30`,
        }}>
          {error}
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={loading || !name.trim()}
        style={{
          width: '100%', padding: '14px 0', borderRadius: 12,
          fontWeight: 700, fontSize: 13, color: '#fff',
          background: loading ? C.elevated : `linear-gradient(135deg, ${C.purple}, ${C.purpleL})`,
          border: 'none', cursor: loading || !name.trim() ? 'not-allowed' : 'pointer',
          opacity: !name.trim() ? 0.4 : 1, marginBottom: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        {loading ? 'Analisando concorrente...' : 'Analisar Concorrente'}
      </button>

      {clientData?.clientName && (
        <MarketIntelCard
          clientName={clientData.clientName}
          niche={clientData.niche}
          city={clientData.city}
        />
      )}

      {clientCompetitors.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: C.text3, marginBottom: 4 }}>
            {clientCompetitors.length} concorrente{clientCompetitors.length > 1 ? 's' : ''} monitorado{clientCompetitors.length > 1 ? 's' : ''}
          </div>
          {clientCompetitors.map(comp => (
            <AnalysisCard
              key={comp.id}
              competitor={comp}
              onRemove={() => removeCompetitor(clientName, comp.id)}
            />
          ))}
        </div>
      )}

      {clientCompetitors.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '64px 0', color: C.text3 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, margin: '0 auto 16px',
            background: C.elevated, border: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
          }}>
            🔍
          </div>
          <div style={{ fontSize: 14, color: C.text2, marginBottom: 6 }}>Nenhum concorrente analisado ainda</div>
          <div style={{ fontSize: 12 }}>Digite o nome acima e clique em Analisar</div>
        </div>
      )}
    </div>
  )
}
