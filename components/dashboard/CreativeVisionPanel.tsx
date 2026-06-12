// components/dashboard/CreativeVisionPanel.tsx — Análise visual de criativos / LPs (Gemini)
// Componente ADITIVO e autossuficiente: se o endpoint responder 503 (Gemini
// desativado), o painel se esconde sozinho. Não interfere em nada existente.
'use client'

import { useRef, useState } from 'react'
import type { ClientData } from '@/lib/store'

interface Recommendation { titulo?: string; impacto?: string; detalhe?: string }
interface VisionAnalysis {
  score?: number
  veredito?: string
  pontos_fortes?: string[]
  problemas?: string[]
  recomendacoes?: Recommendation[]
}

const C = {
  surface: '#FFFFFF', elevated: '#FBFCFD', border: 'rgba(255,255,255,0.06)',
  text1: '#161B26', text2: '#5A6473', text3: '#8A93A3',
  amber: '#E08B0B', green: '#0E9E6E', red: '#E1483F', purpleL: '#2C5FE0',
}

function scoreColor(s: number) { return s >= 75 ? C.green : s >= 50 ? C.amber : C.red }
function impactColor(i?: string) { return i === 'alto' ? C.red : i === 'medio' ? C.amber : C.text3 }

export default function CreativeVisionPanel({ clientData }: { clientData: ClientData | null }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [kind, setKind] = useState<'creative' | 'landing'>('creative')
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hidden, setHidden] = useState(false)  // some quando o recurso não está disponível
  const [result, setResult] = useState<VisionAnalysis | null>(null)

  if (hidden) return null

  const onPick = async (file: File) => {
    setError(''); setResult(null)
    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) { setError('Envie um PNG, JPG ou WEBP.'); return }
    if (file.size > 4 * 1024 * 1024) { setError('Imagem muito grande (máx. 4MB).'); return }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(String(r.result))
      r.onerror = reject
      r.readAsDataURL(file)
    })
    setPreview(dataUrl)
    const base64 = dataUrl.split(',')[1] ?? ''

    setLoading(true)
    try {
      const res = await fetch('/api/vision/creative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: { mimeType: file.type, base64 }, kind, niche: clientData?.niche, clientName: clientData?.clientName }),
      })
      if (res.status === 503) { setHidden(true); return }
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Falha na análise.')
      setResult(json.analysis as VisionAnalysis)
    } catch (e: any) {
      setError(e.message || 'Não foi possível analisar a imagem.')
    } finally {
      setLoading(false)
    }
  }

  const score = typeof result?.score === 'number' ? Math.max(0, Math.min(100, Math.round(result.score))) : null

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: C.text1, margin: 0, display: 'flex', alignItems: 'center', gap: '7px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.purpleL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/></svg>
            Análise visual com IA
            <span style={{ fontSize: '9px', fontWeight: 700, color: C.purpleL, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: '5px', padding: '1px 6px' }}>Gemini</span>
          </h3>
          <p style={{ fontSize: '11px', color: C.text3, margin: '3px 0 0' }}>Suba a imagem do anúncio ou um print da landing page e receba um parecer de CRO.</p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['creative', 'landing'] as const).map(k => (
            <button key={k} onClick={() => setKind(k)} style={{
              fontSize: '11px', fontWeight: 600, padding: '5px 11px', borderRadius: '7px', cursor: 'pointer',
              background: kind === k ? 'rgba(167,139,250,0.14)' : 'transparent',
              border: `1px solid ${kind === k ? 'rgba(167,139,250,0.4)' : C.border}`,
              color: kind === k ? C.purpleL : C.text2,
            }}>{k === 'creative' ? 'Criativo' : 'Landing page'}</button>
          ))}
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = '' }} />

      <div style={{ display: 'grid', gridTemplateColumns: preview ? '160px 1fr' : '1fr', gap: '16px', alignItems: 'start' }}>
        {preview && (
          <img src={preview} alt="preview" style={{ width: '100%', borderRadius: '10px', border: `1px solid ${C.border}` }} />
        )}
        <div>
          <button onClick={() => fileRef.current?.click()} disabled={loading} style={{
            width: preview ? 'auto' : '100%', padding: '10px 16px', borderRadius: '10px',
            border: `1px dashed ${C.border}`, background: C.elevated, color: loading ? C.text3 : C.text2,
            cursor: loading ? 'wait' : 'pointer', fontSize: '12px', fontWeight: 600,
          }}>
            {loading ? '⏳ Analisando imagem…' : preview ? '↻ Trocar imagem' : '+ Selecionar imagem'}
          </button>
          {error && <div style={{ marginTop: '10px', fontSize: '11px', color: C.red }}>{error}</div>}

          {result && (
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {score !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: scoreColor(score) }}>{score}</div>
                  <div style={{ fontSize: '11px', color: C.text3 }}>/100<br />score visual</div>
                  {result.veredito && <div style={{ fontSize: '12px', color: C.text2, flex: 1 }}>{result.veredito}</div>}
                </div>
              )}
              {!!result.pontos_fortes?.length && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: C.green, marginBottom: '4px' }}>Pontos fortes</div>
                  {result.pontos_fortes.map((p, i) => <div key={i} style={{ fontSize: '12px', color: C.text2, marginBottom: '2px' }}>✓ {p}</div>)}
                </div>
              )}
              {!!result.problemas?.length && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: C.red, marginBottom: '4px' }}>Problemas</div>
                  {result.problemas.map((p, i) => <div key={i} style={{ fontSize: '12px', color: C.text2, marginBottom: '2px' }}>• {p}</div>)}
                </div>
              )}
              {!!result.recomendacoes?.length && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: C.purpleL, marginBottom: '6px' }}>Recomendações</div>
                  {result.recomendacoes.map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'baseline', marginBottom: '5px' }}>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: impactColor(r.impacto), border: `1px solid ${impactColor(r.impacto)}40`, background: `${impactColor(r.impacto)}14`, borderRadius: '5px', padding: '1px 6px', flexShrink: 0 }}>{(r.impacto || 'médio').toUpperCase()}</span>
                      <span style={{ fontSize: '12px', color: C.text1 }}><strong>{r.titulo}</strong>{r.detalhe ? ` — ${r.detalhe}` : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
