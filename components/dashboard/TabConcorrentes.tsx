// components/dashboard/TabConcorrentes.tsx — Radar de Concorrentes
'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import type { ClientData, Competitor } from '@/lib/store'

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

function AnalysisCard({ competitor, onRemove }: { competitor: Competitor; onRemove: () => void }) {
  const [open, setOpen] = useState(true)
  const a = competitor.analysis

  return (
    <div className="rounded-2xl overflow-hidden animate-fade-up" style={{ border: '1px solid #2A2A30', background: '#111114' }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #1E1E24' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}>
            🔍
          </div>
          <div>
            <div className="text-sm font-bold text-white">{competitor.name}</div>
            {competitor.analyzedAt && (
              <div className="text-[10px] text-slate-500">Analisado {timeAgo(competitor.analyzedAt)}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {competitor.ads && competitor.ads.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }}>
              {competitor.ads.length} anúncios reais
            </span>
          )}
          <button onClick={() => setOpen(v => !v)}
            className="text-[10px] text-slate-500 hover:text-slate-300 px-2 py-1 rounded transition-colors">
            {open ? '▲ Recolher' : '▼ Expandir'}
          </button>
          <button onClick={onRemove} className="text-[10px] text-slate-600 hover:text-red-400 transition-colors px-1">✕</button>
        </div>
      </div>

      {open && a && (
        <div className="p-4 space-y-4">
          {/* Oferta principal */}
          <div className="rounded-xl p-3" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#818CF8' }}>🎯 Oferta Principal</div>
            <p className="text-sm text-white leading-snug">{a.mainOffer}</p>
          </div>

          {/* Posicionamento */}
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">📌 Posicionamento</div>
            <p className="text-xs text-slate-300 leading-relaxed">{a.positioning}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Ângulos criativos */}
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">🎨 Ângulos Criativos</div>
              <div className="space-y-1">
                {a.creativeAngles.map((angle, i) => (
                  <div key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                    <span className="text-slate-600 mt-0.5">→</span>{angle}
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs usados */}
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">📢 CTAs que usam</div>
              <div className="flex flex-wrap gap-1">
                {a.ctas.map((cta, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #2A2A30', color: '#94A3B8' }}>
                    {cta}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Pontos fracos */}
          {a.weaknesses.length > 0 && (
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,77,77,0.05)', border: '1px solid rgba(255,77,77,0.15)' }}>
              <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#FF4D4D' }}>⚠️ Pontos Fracos deles</div>
              <div className="space-y-1">
                {a.weaknesses.map((w, i) => (
                  <div key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                    <span style={{ color: '#FF4D4D' }}>✗</span>{w}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Como se diferenciar */}
          <div className="rounded-xl p-3" style={{ background: 'rgba(240,180,41,0.06)', border: '1px solid rgba(240,180,41,0.2)' }}>
            <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#F0B429' }}>⚡ Como se Diferenciar</div>
            <p className="text-xs text-slate-200 leading-relaxed">{a.differentiation}</p>
          </div>

          {/* Recomendações */}
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">✅ Ações para Superar</div>
            <div className="space-y-1.5">
              {a.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-300 rounded-lg px-3 py-2"
                  style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.1)' }}>
                  <span className="text-[#22C55E] font-bold flex-shrink-0">{i + 1}.</span>
                  {rec}
                </div>
              ))}
            </div>
          </div>

          {/* Anúncios reais (expandível) */}
          {competitor.ads && competitor.ads.length > 0 && (
            <details className="group">
              <summary className="text-[10px] text-slate-600 hover:text-slate-400 cursor-pointer transition-colors select-none">
                Ver {competitor.ads.length} anúncios capturados ▸
              </summary>
              <div className="mt-2 space-y-2">
                {competitor.ads.map((ad, i) => (
                  <div key={i} className="rounded-lg p-2.5 text-[11px] text-slate-400"
                    style={{ background: '#0C0C0F', border: '1px solid #1E1E24' }}>
                    {ad.page && <div className="text-[10px] text-slate-600 mb-1">{ad.page}</div>}
                    {ad.title && <div className="font-semibold text-slate-300 mb-1">"{ad.title}"</div>}
                    {ad.body && <div className="leading-relaxed">{ad.body.slice(0, 280)}{ad.body.length > 280 ? '…' : ''}</div>}
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

    // Add placeholder immediately so user sees progress
    const tempId = crypto.randomUUID()
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

      // Find the just-added competitor (first in list) and update with analysis
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
      // Remove the placeholder on error
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
      <div className="flex items-center justify-center min-h-[50vh] text-slate-500 text-sm">
        Configure um cliente primeiro para analisar concorrentes.
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="font-display text-xl font-bold text-white">Radar de Concorrentes</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          IA analisa posicionamento, criativos e CTAs dos concorrentes — e aponta como se diferenciar
        </p>
      </div>

      {/* Meta badge */}
      {metaAccount ? (
        <div className="rounded-xl px-4 py-3 mb-5 flex items-center gap-3"
          style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)' }}>
          <span className="text-base">🔗</span>
          <div className="flex-1">
            <span className="text-xs text-[#22C55E] font-semibold">Meta Ads conectado — </span>
            <span className="text-xs text-slate-400">anúncios reais do concorrente serão capturados automaticamente</span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl px-4 py-3 mb-5 text-xs text-slate-500"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #2A2A30' }}>
          💡 Conecte o <span className="text-slate-300 font-medium">Meta Ads</span> em Anúncios IA para capturar anúncios reais dos concorrentes
        </div>
      )}

      {/* Formulário */}
      <div className="rounded-2xl p-5 mb-5" style={{ background: '#111114', border: '1px solid #2A2A30' }}>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Novo Concorrente</div>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
          placeholder="Nome do concorrente ou página no Facebook"
          className="w-full bg-transparent rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none mb-3"
          style={{ border: '1px solid #2A2A30' }}
        />
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Observações opcionais (ex: principal oferta, site, diferenciais percebidos)"
          rows={2}
          className="w-full bg-transparent rounded-xl px-4 py-2.5 text-xs text-slate-300 placeholder-slate-600 outline-none resize-none"
          style={{ border: '1px solid #2A2A30' }}
        />
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 mb-4 text-xs text-red-400"
          style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)' }}>
          {error}
        </div>
      )}

      <button onClick={handleAnalyze} disabled={loading || !name.trim()}
        className="w-full py-3.5 rounded-xl font-bold text-sm text-black mb-6 disabled:opacity-40 transition-opacity hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #6366F1, #818CF8)' }}>
        {loading ? '🔍 Analisando concorrente...' : '🔍 Analisar Concorrente'}
      </button>

      {/* Lista de concorrentes */}
      {clientCompetitors.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {clientCompetitors.length} concorrente{clientCompetitors.length > 1 ? 's' : ''} monitorado{clientCompetitors.length > 1 ? 's' : ''}
            </div>
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
        <div className="text-center py-16 text-slate-600">
          <div className="text-4xl mb-3">🔍</div>
          <div className="text-sm">Nenhum concorrente analisado ainda</div>
          <div className="text-xs mt-1">Digite o nome acima e clique em Analisar</div>
        </div>
      )}
    </div>
  )
}
