// components/dashboard/v2/CompetitorXray.tsx
// RAIO-X DE CONCORRENTES (unificado) — analisa um concorrente por PESQUISA WEB
// (Tavily + Gemini), salva no monitoramento (store.competitors) e mostra a lista
// de concorrentes monitorados com ângulos, aposta, brecha e contra-ataque.
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { Icon } from './Icon'
import { Card } from './Card'
import { Button } from './Button'

type Intensity = 'forte' | 'média' | 'leve'
const INT: Record<Intensity, { dot: string; label: string }> = {
  forte: { dot: '#E1483F', label: '🔥 aposta forte' },
  média: { dot: '#E08B0B', label: 'presente' },
  leve:  { dot: '#8A93A3', label: 'leve' },
}

const initials = (n: string) => (n.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('') || '?').toUpperCase()
const AV = ['#2B5BE3', '#0E9E6E', '#E08B0B', '#9333EA', '#E1483F', '#0E9CB0']
const avatarColor = (n: string) => { let h = 0; for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0; return AV[h % AV.length] }
const timeAgo = (iso?: string) => {
  if (!iso) return ''
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  return d <= 0 ? 'hoje' : d === 1 ? 'ontem' : `há ${d} dias`
}
// Render simples de **negrito** (a IA usa markdown leve).
const renderRich = (text: string) => (text || '').split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
  p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>)

export function CompetitorXray() {
  const router = useRouter()
  const clientData = useAppStore(s => s.clientData)
  const strategyData = useAppStore(s => s.strategyData)
  const competitors = useAppStore(s => s.competitors)
  const addCompetitor = useAppStore(s => s.addCompetitor)
  const updateCompetitor = useAppStore(s => s.updateCompetitor)
  const removeCompetitor = useAppStore(s => s.removeCompetitor)

  const key = clientData?.clientName || ''
  const niche = clientData?.niche || ''
  const city = clientData?.city || ''
  const myAngles = (strategyData?.strategy?.target_audience?.interests || []).slice(0, 5).join(', ')
  const list = (key && competitors[key]) || []

  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [analyzingId, setAnalyzingId] = useState<string | null>(null) // 'new' ou id existente
  const [openId, setOpenId] = useState<string | null>(null)

  const analyze = async (compName: string, compNotes: string, existingId?: string) => {
    const c = compName.trim()
    if (!c || analyzingId) return
    setAnalyzingId(existingId || 'new')
    try {
      const res = await fetch('/api/competitor-xray', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitor: c, niche, city, myAngles }),
      })
      const d = await res.json()
      if (!res.ok || d.error || !d.analysis) { window.toast?.({ tone: 'bad', title: 'Não foi possível', body: d?.error || 'Tente novamente.' }); return }
      const xray = { ...d.analysis, hasWeb: !!d.hasWeb }
      if (existingId) {
        updateCompetitor(key, existingId, { xray, analyzedAt: new Date().toISOString() })
        setOpenId(existingId)
      } else {
        addCompetitor(key, { name: c, notes: compNotes.trim() || undefined, xray, analyzedAt: new Date().toISOString() })
        setName(''); setNotes('')
      }
      window.toast?.({ tone: 'good', title: 'Raio-X pronto', body: `Análise de "${c}" salva no monitoramento.` })
    } catch { window.toast?.({ tone: 'bad', title: 'Falha de conexão' }) }
    finally { setAnalyzingId(null) }
  }

  const toCounter = (counter: string) => {
    try { sessionStorage.setItem('elyon_xray_theme', counter) } catch {}
    window.toast?.({ tone: 'blue', title: 'Tema preenchido', body: 'O contra-ataque já está no gerador.' })
    router.push('/conteudo')
  }

  if (!key) return null

  return (
    <Card>
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <span className="w-9 h-9 rounded-lg bg-ink flex items-center justify-center text-white shrink-0"><Icon name="eye" size={18} /></span>
        <div className="flex-1">
          <div className="text-[15px] font-bold text-ink" style={{ letterSpacing: '-0.01em' }}>Raio-X de Concorrentes</div>
          <p className="text-[12.5px] text-ink-2 mt-0.5">Pesquisamos o concorrente na web (ofertas, posicionamento, reputação) e o NOUS aponta a aposta dele, a sua brecha e o contra-ataque. Os analisados ficam salvos aqui.</p>
        </div>
      </div>

      {/* Novo concorrente */}
      <div className="space-y-2 p-3 rounded-md bg-canvas-2 mb-4">
        <div className="flex gap-2">
          <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && analyze(name, notes)}
            placeholder="Nome ou site do concorrente (ex: Móveis Premium SP)"
            className="flex-1 bg-paper border border-line rounded-sm px-3 py-2.5 text-sm text-ink focus:border-blue focus:outline-none" />
          <Button onClick={() => analyze(name, notes)} disabled={analyzingId === 'new' || !name.trim()} icon={<Icon name="search" size={15} />}>
            {analyzingId === 'new' ? 'Pesquisando…' : 'Raio-X'}
          </Button>
        </div>
        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observações opcionais (ex: principal oferta, diferencial percebido)"
          className="w-full bg-paper border border-line rounded-sm px-3 py-2 text-[13px] text-ink placeholder:text-ink-3 focus:border-blue focus:outline-none" />
        <p className="text-[11px] text-ink-3">Pesquisa na web + IA. Custa 2 créditos por análise.</p>
      </div>

      {/* Lista de monitorados */}
      {list.length === 0 ? (
        <div className="text-center py-6 text-ink-3 text-[13px]">Nenhum concorrente monitorado ainda. Analise o primeiro acima.</div>
      ) : (
        <>
          <div className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3 mb-2">{list.length} concorrente{list.length > 1 ? 's' : ''} monitorado{list.length > 1 ? 's' : ''}</div>
          <div className="space-y-2.5">
            {list.map((c) => {
              const x = c.xray
              const open = openId === c.id
              const busy = analyzingId === c.id
              return (
                <div key={c.id} className="border border-line rounded-md overflow-hidden">
                  {/* Cabeçalho do card */}
                  <div className="flex items-center gap-3 p-3 bg-paper">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[12px] font-bold shrink-0" style={{ background: avatarColor(c.name) }}>{initials(c.name)}</span>
                    <button onClick={() => setOpenId(open ? null : c.id)} className="flex-1 min-w-0 text-left">
                      <div className="text-sm font-semibold text-ink truncate">{c.name}</div>
                      <div className="text-[11.5px] text-ink-3">{c.analyzedAt ? `Analisado ${timeAgo(c.analyzedAt)}` : 'Sem análise'}{x ? ` · ${x.angles?.length || 0} ângulos` : ''}</div>
                    </button>
                    <button onClick={() => analyze(c.name, c.notes || '', c.id)} disabled={!!analyzingId} title="Re-analisar"
                      className="text-ink-3 hover:text-blue p-1.5 disabled:opacity-50">{busy ? <span className="text-[11px]">…</span> : <Icon name="search" size={15} />}</button>
                    <button onClick={() => { if (confirm(`Remover "${c.name}" do monitoramento?`)) removeCompetitor(key, c.id) }} title="Remover" className="text-ink-3 hover:text-red p-1.5"><Icon name="x" size={15} /></button>
                    <button onClick={() => setOpenId(open ? null : c.id)} className="text-ink-3 p-1"><Icon name={open ? 'chevD' : 'chevR'} size={15} /></button>
                  </div>

                  {/* Corpo (Raio-X) */}
                  {open && (
                    <div className="p-3 border-t border-line-2 bg-canvas-2 animate-fade-up">
                      {!x ? (
                        <div className="text-[13px] text-ink-3">Análise antiga ou ausente. Clique no ícone de busca acima para gerar o Raio-X atualizado.</div>
                      ) : (
                        <div className="space-y-3">
                          {x.hasWeb === false && <div className="text-[11.5px] text-ink-3">Pouca informação pública — análise por padrões do nicho (hipóteses a validar).</div>}
                          {/* Ângulos */}
                          <div className="space-y-1.5">
                            {(x.angles || []).map((ang, i) => {
                              const it = INT[ang.intensity] || INT.leve
                              return (
                                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-sm bg-paper">
                                  <span className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ background: it.dot }} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[13px] font-semibold text-ink">{ang.label}</span>
                                      <span className="text-[10px] font-mono uppercase tracking-wide" style={{ color: it.dot }}>{it.label}</span>
                                    </div>
                                    {ang.messaging && <div className="text-[12px] text-ink-2 mt-0.5 italic">"{ang.messaging}"</div>}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          {/* Aposta · Brecha · Contra-ataque */}
                          <div className="p-2.5 rounded-sm" style={{ background: 'rgba(225,72,63,.06)', border: '1px solid rgba(225,72,63,.2)' }}>
                            <div className="text-[10px] font-mono uppercase tracking-wider text-red mb-1">🎯 A aposta deles</div>
                            <div className="text-[12.5px] text-ink leading-relaxed">{renderRich(x.bet)}</div>
                          </div>
                          <div className="p-2.5 rounded-sm" style={{ background: 'rgba(224,139,11,.06)', border: '1px solid rgba(224,139,11,.2)' }}>
                            <div className="text-[10px] font-mono uppercase tracking-wider text-amber mb-1">🕳️ Sua brecha</div>
                            <div className="text-[12.5px] text-ink leading-relaxed">{renderRich(x.gap)}</div>
                          </div>
                          <div className="p-2.5 rounded-sm bg-blue-soft border border-blue-line">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-blue mb-1">⚡ Contra-ataque do NOUS</div>
                            <div className="text-[12.5px] text-ink leading-relaxed">{renderRich(x.counterMove)}</div>
                            <Button size="sm" variant="soft" className="mt-2.5" icon={<Icon name="spark" size={14} />} onClick={() => toCounter(x.counterMove)}>Gerar criativo de resposta</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </Card>
  )
}
