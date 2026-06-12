// components/dashboard/CrossCheckPanel.tsx — "Segunda opinião (Gemini)" sobre uma
// análise já gerada (auditoria/estratégia). Aditivo e autossuficiente: some se o
// endpoint responder 503 (Gemini desativado). Não altera a análise original.
'use client'

import { useState } from 'react'

interface Divergence { ponto?: string; discordancia?: string; recomendacao?: string }
interface Review {
  veredito?: string
  concordancias?: string[]
  divergencias?: Divergence[]
  pontos_cegos?: string[]
}

const C = {
  surface: '#FFFFFF', elevated: '#FBFCFD', border: 'rgba(255,255,255,0.06)',
  text1: '#161B26', text2: '#5A6473', text3: '#8A93A3',
  amber: '#E08B0B', green: '#0E9E6E', red: '#E1483F', purpleL: '#2C5FE0',
}

export default function CrossCheckPanel({
  kind, payload, niche,
}: {
  kind: 'audit' | 'strategy'
  payload: unknown
  niche?: string | null
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hidden, setHidden] = useState(false)
  const [review, setReview] = useState<Review | null>(null)

  if (hidden) return null

  const run = async () => {
    setError(''); setLoading(true); setReview(null)
    try {
      const res = await fetch('/api/cross-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, payload, niche }),
      })
      if (res.status === 503) { setHidden(true); return }
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Falha ao gerar segunda opinião.')
      setReview(json.review as Review)
    } catch (e: any) {
      setError(e.message || 'Não foi possível gerar a segunda opinião.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '18px 20px', marginTop: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: C.text1, margin: 0, display: 'flex', alignItems: 'center', gap: '7px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.purpleL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Segunda opinião
            <span style={{ fontSize: '9px', fontWeight: 700, color: C.purpleL, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: '5px', padding: '1px 6px' }}>Gemini</span>
          </h3>
          <p style={{ fontSize: '11px', color: C.text3, margin: '3px 0 0' }}>Um segundo modelo revisa esta análise e aponta concordâncias e divergências.</p>
        </div>
        <button onClick={run} disabled={loading} style={{
          fontSize: '12px', fontWeight: 600, padding: '7px 14px', borderRadius: '8px', cursor: loading ? 'wait' : 'pointer',
          background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.35)', color: C.purpleL,
        }}>{loading ? '⏳ Revisando…' : review ? '↻ Revisar de novo' : 'Pedir segunda opinião'}</button>
      </div>

      {error && <div style={{ marginTop: '10px', fontSize: '11px', color: C.red }}>{error}</div>}

      {review && (
        <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {review.veredito && (
            <div style={{ fontSize: '12px', color: C.text2, background: C.elevated, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '10px 12px' }}>{review.veredito}</div>
          )}
          {!!review.concordancias?.length && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: C.green, marginBottom: '4px' }}>Concordâncias</div>
              {review.concordancias.map((p, i) => <div key={i} style={{ fontSize: '12px', color: C.text2, marginBottom: '2px' }}>✓ {p}</div>)}
            </div>
          )}
          {!!review.divergencias?.length && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: C.amber, marginBottom: '6px' }}>Divergências</div>
              {review.divergencias.map((d, i) => (
                <div key={i} style={{ fontSize: '12px', color: C.text2, marginBottom: '8px', paddingLeft: '10px', borderLeft: `2px solid ${C.amber}55` }}>
                  {d.ponto && <div style={{ color: C.text1 }}><strong>Análise:</strong> {d.ponto}</div>}
                  {d.discordancia && <div><strong style={{ color: C.amber }}>Discordo:</strong> {d.discordancia}</div>}
                  {d.recomendacao && <div><strong style={{ color: C.purpleL }}>Faria:</strong> {d.recomendacao}</div>}
                </div>
              ))}
            </div>
          )}
          {!!review.pontos_cegos?.length && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: C.red, marginBottom: '4px' }}>Pontos cegos</div>
              {review.pontos_cegos.map((p, i) => <div key={i} style={{ fontSize: '12px', color: C.text2, marginBottom: '2px' }}>• {p}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
