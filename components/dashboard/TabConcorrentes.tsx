// components/dashboard/TabConcorrentes.tsx — Radar de Concorrentes
'use client'

import { useState, useRef, useEffect } from 'react'
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

// ── Inteligência de Mercado (resultado gerado automaticamente + refresh on-demand) ──
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
          setMarketResearch(clientName, {
            competitors: d.parsed?.competitors ?? (Array.isArray(d.parsed) ? d.parsed : []),
            opportunities: d.parsed?.opportunities ?? '',
            mistakes: d.parsed?.competitor_mistakes ?? '',
            raw: d.output,
            fetchedAt: new Date().toISOString(),
          })
        }
      } catch {}
    }, 20000)
  }

  // Retoma polling se task pendente sem resultado
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

  // Ainda processando
  if (!data && (taskId || polling)) {
    return (
      <div className="rounded-2xl p-4 mb-5 flex items-center gap-3"
        style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.15)' }}>
        <div className="w-1.5 h-1.5 rounded-full bg-[#818CF8] animate-pulse flex-shrink-0" />
        <span className="text-[11px] text-slate-500">Levantando inteligência de mercado para este nicho — disponível em alguns minutos.</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl p-4 mb-5 flex items-center justify-between"
        style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.15)' }}>
        <span className="text-[11px] text-slate-500">Pesquisa de mercado autônoma não gerada ainda.</span>
        <button onClick={handleRefresh} disabled={requesting || !niche}
          className="text-[10px] px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ background: 'rgba(99,102,241,0.15)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.25)' }}>
          {requesting ? 'Iniciando...' : '⚡ Pesquisar agora'}
        </button>
      </div>
    )
  }

  const competitors: any[] = data.competitors || []
  const opportunities = data.opportunities
  const mistakes = data.mistakes

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inteligência de Mercado</div>
        <div className="flex items-center gap-3">
          {polling && (
            <span className="flex items-center gap-1 text-[10px] text-[#818CF8]">
              <span className="w-1 h-1 rounded-full bg-[#818CF8] animate-pulse" />atualizando...
            </span>
          )}
          {data.fetchedAt && !polling && (
            <span className="text-[10px] text-slate-600">{timeAgo(data.fetchedAt)}</span>
          )}
          <button onClick={handleRefresh} disabled={requesting || polling || !niche}
            className="text-[10px] px-2.5 py-1 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ background: 'rgba(99,102,241,0.08)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.2)' }}>
            {requesting ? '...' : '↻ Atualizar'}
          </button>
        </div>
      </div>

      {competitors.length > 0 && (
        <div className="space-y-2 mb-3">
          {competitors.map((c: any, i: number) => (
            <div key={i} className="rounded-xl p-3" style={{ background: '#111114', border: '1px solid #2A2A30' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-white text-sm">{c.name || c.competitor_name}</span>
                {c.website && (
                  <a href={c.website} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] text-slate-500 hover:text-slate-300">↗</a>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {c.positioning && <p className="text-[11px] text-slate-400 col-span-2"><span className="text-slate-500">Posicionamento: </span>{c.positioning}</p>}
                {c.channels && <p className="text-[11px] text-slate-400"><span className="text-[#22C55E] font-medium">Canais: </span>{Array.isArray(c.channels) ? c.channels.join(', ') : c.channels}</p>}
                {c.pricing && <p className="text-[11px] text-slate-400"><span className="text-[#F0B429] font-medium">Pricing: </span>{c.pricing}</p>}
                {c.weaknesses && <p className="text-[11px] text-slate-400 col-span-2"><span className="text-[#FF4D4D] font-medium">Fraqueza: </span>{Array.isArray(c.weaknesses) ? c.weaknesses.join(' · ') : c.weaknesses}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {opportunities && (
          <div className="rounded-xl p-3" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)' }}>
            <div className="text-[9px] font-bold text-[#22C55E] uppercase tracking-wider mb-1.5">Oportunidades</div>
            <p className="text-[11px] text-slate-300 leading-relaxed">{Array.isArray(opportunities) ? opportunities.join(' · ') : opportunities}</p>
          </div>
        )}
        {mistakes && (
          <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)' }}>
            <div className="text-[9px] font-bold text-[#FF4D4D] uppercase tracking-wider mb-1.5">Erros do mercado</div>
            <p className="text-[11px] text-slate-300 leading-relaxed">{Array.isArray(mistakes) ? mistakes.join(' · ') : mistakes}</p>
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

      {/* Inteligência de mercado gerada automaticamente + refresh on-demand */}
      {clientData?.clientName && (
        <MarketIntelCard
          clientName={clientData.clientName}
          niche={clientData.niche}
          city={clientData.city}
        />
      )}

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
