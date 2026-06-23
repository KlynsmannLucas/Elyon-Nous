// components/dashboard/v2/CompetitorXray.tsx
// RAIO-X DE CONCORRENTES — vê os anúncios ativos de um concorrente, agrupa em
// ângulos com intensidade de APOSTA (nº de variações × dias rodando), mostra a
// brecha que você não explora e o contra-ataque do NOUS.
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { Icon } from './Icon'
import { Card } from './Card'
import { Button } from './Button'
import { Badge } from './Badge'

interface Angle { label: string; variations: number; maxDays: number; intensity: 'alta' | 'média' | 'baixa'; sampleHook: string }
interface XrayResult {
  competitor: string
  totalAds: number
  oldestDays?: number
  analysis: { angles: Angle[]; bet: string; gap: string; counterMove: string } | null
  reason?: string
}

const INT: Record<Angle['intensity'], { dot: string; label: string }> = {
  alta:  { dot: '#E1483F', label: '🔥 aposta forte' },
  média: { dot: '#E08B0B', label: 'testando' },
  baixa: { dot: '#8A93A3', label: 'leve' },
}

export function CompetitorXray() {
  const router = useRouter()
  const clientData = useAppStore(s => s.clientData)
  const strategyData = useAppStore(s => s.strategyData)
  const niche = clientData?.niche || ''
  const myAngles = (strategyData?.strategy?.target_audience?.interests || []).slice(0, 5).join(', ')

  const [competitor, setCompetitor] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<XrayResult | null>(null)
  const [error, setError] = useState('')

  const run = async () => {
    const c = competitor.trim()
    if (!c || loading) return
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/competitor-xray', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitor: c, niche, myAngles }),
      })
      const d = await res.json()
      if (!res.ok || d.error) { setError(d.error || 'Falha ao analisar.'); return }
      setResult(d)
    } catch { setError('Falha de conexão. Tente novamente.') }
    finally { setLoading(false) }
  }

  const a = result?.analysis

  return (
    <Card>
      <div className="flex items-start gap-3 mb-3">
        <span className="w-9 h-9 rounded-lg bg-ink flex items-center justify-center text-white shrink-0"><Icon name="eye" size={18} /></span>
        <div className="flex-1">
          <div className="text-[15px] font-bold text-ink" style={{ letterSpacing: '-0.01em' }}>Raio-X de Concorrentes</div>
          <p className="text-[12.5px] text-ink-2 mt-0.5">Veja os anúncios ativos de um concorrente e descubra a aposta dele — o que está funcionando no seu mercado agora.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-1">
        <input value={competitor} onChange={e => setCompetitor(e.target.value)} onKeyDown={e => e.key === 'Enter' && run()}
          placeholder="Nome do concorrente (ex: Móveis Premium SP)"
          className="flex-1 bg-paper border border-line rounded-sm px-3 py-2.5 text-sm text-ink focus:border-blue focus:outline-none" />
        <Button onClick={run} disabled={loading || !competitor.trim()} icon={<Icon name="search" size={15} />}>{loading ? 'Vasculhando…' : 'Raio-X'}</Button>
      </div>
      <p className="text-[11px] text-ink-3 mb-1">Consultamos a Biblioteca de Anúncios da Meta (anúncios ativos no Brasil). Custa 2 créditos.</p>

      {error && <div className="text-sm text-red mt-3 p-3 rounded-sm bg-red-soft">{error}</div>}

      {loading && <div className="text-center py-8 text-ink-3 text-sm">Vasculhando os anúncios ativos de "{competitor}"…</div>}

      {result && result.totalAds === 0 && (
        <div className="mt-3 p-4 rounded-sm bg-canvas-2 text-center">
          <div className="text-sm font-semibold text-ink">Nenhum anúncio ativo encontrado</div>
          <div className="text-[12.5px] text-ink-3 mt-1">Esse concorrente pode não estar anunciando agora, ou o nome não bate com a página. Tente o nome exato da página no Facebook.</div>
        </div>
      )}

      {a && (
        <div className="mt-4 space-y-4 animate-fade-up">
          <div className="flex items-center gap-2 text-[12.5px] text-ink-2">
            <Badge tone="neutral">{result!.totalAds} anúncios ativos</Badge>
            {result!.oldestDays ? <span className="text-ink-3">o mais antigo roda há {result!.oldestDays} dias</span> : null}
          </div>

          {/* Ângulos detectados */}
          <div className="space-y-2">
            {a.angles.map((ang, i) => {
              const it = INT[ang.intensity] || INT.baixa
              return (
                <div key={i} className="flex items-start gap-3 p-3 rounded-md bg-canvas-2">
                  <span className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ background: it.dot }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-ink">{ang.label}</span>
                      <span className="text-[10.5px] font-mono uppercase tracking-wide" style={{ color: it.dot }}>{it.label}</span>
                    </div>
                    <div className="text-[12px] text-ink-3 mt-0.5">{ang.variations} {ang.variations === 1 ? 'variação' : 'variações'} · roda há até {ang.maxDays}d</div>
                    {ang.sampleHook && <div className="text-[12px] text-ink-2 mt-1 italic">"{ang.sampleHook}"</div>}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Aposta · Brecha · Contra-ataque */}
          <div className="space-y-2.5">
            <div className="p-3 rounded-md" style={{ background: 'rgba(225,72,63,.06)', border: '1px solid rgba(225,72,63,.2)' }}>
              <div className="text-[10px] font-mono uppercase tracking-wider text-red mb-1">🎯 A aposta deles</div>
              <div className="text-[13px] text-ink leading-relaxed">{a.bet}</div>
            </div>
            <div className="p-3 rounded-md" style={{ background: 'rgba(224,139,11,.06)', border: '1px solid rgba(224,139,11,.2)' }}>
              <div className="text-[10px] font-mono uppercase tracking-wider text-amber mb-1">🕳️ Sua brecha</div>
              <div className="text-[13px] text-ink leading-relaxed">{a.gap}</div>
            </div>
            <div className="p-3 rounded-md bg-blue-soft border border-blue-line">
              <div className="text-[10px] font-mono uppercase tracking-wider text-blue mb-1">⚡ Contra-ataque do NOUS</div>
              <div className="text-[13px] text-ink leading-relaxed">{a.counterMove}</div>
              <Button size="sm" variant="soft" className="mt-2.5" icon={<Icon name="spark" size={14} />}
                onClick={() => { if (typeof window !== 'undefined') window.toast?.({ tone: 'blue', title: 'Estúdio de Criação', body: 'Use o contra-ataque como tema do conteúdo.' }); router.push('/conteudo') }}>
                Gerar criativo de resposta
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
