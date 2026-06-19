// app/(elyon)/plano/page.tsx — Plano de Ação (execução + estratégia 90 dias) com DADOS REAIS.
'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Icon, Card, Badge, Button, SectionHead, HBar, CHART_COLORS } from '@/components/dashboard/v2'
import { generateStrategyForActiveClient } from '@/lib/createClientFlow'
import { TabPersona } from '@/components/dashboard/TabPersona'

const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n || 0)
type SubTab = 'execucao' | 'estrategia' | 'persona'
const parseImpact = (s: any) => { const n = Number(String(s || '').replace(/[^\d]/g, '')); return Number.isFinite(n) ? n : 0 }
// Esforço estimado (1=baixo, 3=alto) por palavra-chave do título da ação.
const effortOf = (title: string) => {
  const t = (title || '').toLowerCase()
  if (/(pausar|reduzir|cortar|desativar|negativar)/.test(t)) return 1
  if (/(renovar|criar|reestruturar|refazer|nova campanha|landing|produzir)/.test(t)) return 3
  return 2
}

export default function PlanoPage() {
  const clientData = useAppStore(s => s.clientData)
  const savedClients = useAppStore(s => s.savedClients)
  const pendingActionsCache = useAppStore(s => s.pendingActionsCache)
  const updatePendingActionStatus = useAppStore(s => s.updatePendingActionStatus)
  const strategyData = useAppStore(s => s.strategyData)
  const dashboardMode = useAppStore(s => s.dashboardMode)
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState<SubTab>('execucao')
  const [done, setDone] = useState<Record<string, boolean>>({})
  const [genLoading, setGenLoading] = useState(false)
  const [executed, setExecuted] = useState<any[]>([])

  const genStrat = async () => {
    setGenLoading(true)
    const r = await generateStrategyForActiveClient()
    setGenLoading(false)
    if (typeof window !== 'undefined') window.toast?.(r.ok ? { tone: 'good', title: 'Estratégia gerada', body: 'Tese, matriz e plano 90 dias prontos.' } : { tone: 'bad', title: 'Falha ao gerar', body: r.error })
  }
  useEffect(() => { setMounted(true) }, [])

  const key = clientData?.clientName || savedClients?.[0]?.clientData?.clientName || ''
  // #2 Medir impacto — ações executadas no Meta e seu efeito no CPL da conta.
  useEffect(() => {
    if (!key) { setExecuted([]); return }
    let active = true
    fetch(`/api/actions/executed?clientName=${encodeURIComponent(key)}`)
      .then(r => (r.ok ? r.json() : null)).then(d => { if (active) setExecuted(d?.actions || []) }).catch(() => {})
    return () => { active = false }
  }, [key])
  if (!mounted) return null

  const actions = key ? pendingActionsCache[key] || [] : []
  const planned = actions.filter(a => a.status === 'pendente')
  const inProgress = actions.filter(a => a.status === 'em_andamento')
  const completed = actions.filter(a => a.status === 'concluida')
  // Checklist funcional: clicar avança pendente → em_andamento → concluída → pendente
  const nextStatus = (s: string): 'pendente' | 'em_andamento' | 'concluida' =>
    s === 'pendente' ? 'em_andamento' : s === 'em_andamento' ? 'concluida' : 'pendente'
  const rank: Record<string, number> = { pendente: 0, em_andamento: 1, concluida: 2, ignorada: 3 }
  const orderedActions = [...actions].filter(a => a.status !== 'ignorada').sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9))
  const impactTotal = actions.reduce((sum, a) => sum + parseImpact(a.impact), 0)
  const strat: any = strategyData?.strategy
  const ta = strat?.target_audience
  const matrix = strat?.strategic_matrix
  const plan = strat?.plan_7_30_90
  const ranking: any[] = strat?.priority_ranking || []

  const tabs: { key: SubTab; label: string; icon: string }[] = [
    { key: 'execucao', label: 'Execução', icon: 'check' }, { key: 'estrategia', label: 'Estratégia 90 dias', icon: 'scale' },
    { key: 'persona', label: 'Persona', icon: 'users' },
  ]

  const matrixText = (it: any) => it?.decision || it?.action || it?.hypothesis || (typeof it === 'string' ? it : '')
  const QUAD: { k: string; label: string; bg: string; bd: string; c: string }[] = [
    { k: 'escalar', label: 'Escalar', bg: '#E4F6EE', bd: '#BBE7D3', c: '#0B855D' },
    { k: 'corrigir', label: 'Corrigir', bg: '#FCF1DC', bd: '#F2DDB0', c: '#E08B0B' },
    { k: 'testar', label: 'Testar', bg: '#EAF0FE', bd: '#CBDBFB', c: '#1E4FD0' },
    { k: 'cortar', label: 'Cortar', bg: '#FCEBEA', bd: '#F3CFCC', c: '#E1483F' },
  ]

  return (
    <div className="p-4 md:p-6">
      <header className="mb-5 animate-fade-up">
        <h1 className="text-[23px] font-bold text-ink" style={{ letterSpacing: '-0.02em' }}>Plano de Ação</h1>
        <p className="text-sm text-ink-2 mt-0.5">{key || 'Selecione um cliente'}</p>
      </header>

      <div className="mb-5 flex gap-1 border-b border-line">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3.5 py-2.5 text-[13.5px] font-medium border-b-2 -mb-px transition-colors inline-flex items-center gap-1.5 ${tab === t.key ? 'text-ink border-blue font-semibold' : 'text-ink-3 border-transparent hover:text-ink'}`}>
            <Icon name={t.icon} size={15} />{t.label}
          </button>
        ))}
      </div>

      {tab === 'execucao' && (
        actions.length > 0 ? (
          <div className="space-y-4 animate-fade-up">
            {/* ── Cards de status (live) ───────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {([
                ['Ações planejadas', planned.length,    '#161B26', 'check'],
                ['Em andamento',     inProgress.length, '#1E4FD0', 'pulse'],
                ['Concluídas',       completed.length,  '#0B855D', 'trophy'],
              ] as const).map(([l, v, c, icon]) => (
                <Card key={l} padding="sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-7 h-7 rounded-md bg-canvas-2 flex items-center justify-center" style={{ color: c }}><Icon name={icon as any} size={15} /></span>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-ink-3">{l}</div>
                  </div>
                  <div className="text-2xl font-bold font-mono" style={{ color: c }}>{v}</div>
                </Card>
              ))}
              <Card padding="sm">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-7 h-7 rounded-md bg-green-soft flex items-center justify-center text-green-600"><Icon name="bolt" size={15} /></span>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-ink-3">Impacto total</div>
                </div>
                <div className="text-2xl font-bold font-mono text-green-600">{impactTotal > 0 ? `+${brl(impactTotal)}` : '—'}</div>
              </Card>
            </div>

            {/* ── Checklist funcional: clique progride o status ────────────── */}
            <Card>
              <SectionHead title="O que fazer agora" subtitle="Clique para avançar: pendente → em andamento → concluída" icon={<Icon name="check" size={17} />} />
              <div className="divide-y divide-line-2">
                {orderedActions.map((a) => {
                  const st = a.status
                  const isDone = st === 'concluida'
                  const isProg = st === 'em_andamento'
                  return (
                    <div key={a.id} className="flex items-start gap-3 py-3">
                      <button
                        onClick={() => updatePendingActionStatus(key, a.id, nextStatus(st))}
                        title="Avançar status"
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${isDone ? 'bg-green border-green text-white' : isProg ? 'bg-blue border-blue text-white' : 'border-line hover:border-blue'}`}>
                        {isDone ? <Icon name="check" size={12} w={3} /> : isProg ? <span className="w-2 h-2 rounded-full bg-white" /> : null}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${isDone ? 'text-ink-3 line-through' : 'text-ink'}`}>{a.title}</div>
                        {(a.description || (a as any).evidence) && (
                          <div className="text-xs text-ink-3 mt-0.5">{a.description || (a as any).evidence}</div>
                        )}
                        {isProg && <div className="text-[10px] font-mono uppercase tracking-wider text-blue mt-1">Em andamento</div>}
                      </div>
                      {parseImpact(a.impact) > 0 && (
                        <div className={`text-sm font-bold font-mono shrink-0 ${isDone ? 'text-ink-4 line-through' : 'text-green-600'}`}>+{brl(parseImpact(a.impact))}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* #2 Impacto das ações executadas no Meta (antes → depois do CPL da conta) */}
            {executed.length > 0 && (
              <Card>
                <SectionHead title="Impacto das ações executadas" subtitle="O que o NOUS executou no Meta e o efeito no CPL da conta" icon={<Icon name="bolt" size={17} />} />
                <div className="divide-y divide-line-2">
                  {executed.map((a: any) => {
                    const actLabel = a.action === 'pause' ? 'Pausou' : a.action === 'scale' ? 'Escalou' : 'Reativou'
                    const good = a.deltaPct != null && a.deltaPct < 0
                    return (
                      <div key={a.id} className="flex items-center gap-3 py-3">
                        <span className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${a.action === 'pause' ? 'bg-red-soft text-red' : 'bg-green-soft text-green-600'}`}><Icon name={a.action === 'scale' ? 'arrowUp' : 'check'} size={15} /></span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-ink truncate">{actLabel} "{a.campaign_name || 'campanha'}"</div>
                          <div className="text-xs text-ink-3">{a.days === 0 ? 'hoje' : `há ${a.days} ${a.days === 1 ? 'dia' : 'dias'}`}</div>
                        </div>
                        <div className="text-right shrink-0">
                          {a.measured ? (
                            <>
                              <div className="text-xs text-ink-3">CPL da conta</div>
                              <div className="text-sm font-mono font-semibold text-ink">{brl(a.cpl_before)} → {brl(a.cpl_after)}</div>
                              {a.deltaPct != null && <div className={`text-xs font-bold ${good ? 'text-green-600' : 'text-red'}`}>{a.deltaPct > 0 ? '+' : ''}{a.deltaPct}%</div>}
                            </>
                          ) : (
                            <div className="text-xs text-ink-3 italic">medindo… {a.days < 3 ? `(faltam ${3 - a.days}d)` : ''}</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            {/* Extras do modo Avançado: matriz impacto×esforço + roadmap */}
            {dashboardMode !== 'simple' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Matriz impacto × esforço */}
                {(() => {
                  const pts = planned.map(a => ({ title: a.title, impact: parseImpact(a.impact), effort: effortOf(a.title) })).filter(p => p.impact > 0)
                  if (!pts.length) return null
                  const maxI = Math.max(...pts.map(p => p.impact), 1)
                  return (
                    <Card>
                      <SectionHead title="Impacto × esforço" subtitle="Priorize os ganhos rápidos (alto impacto, baixo esforço)" icon={<Icon name="grid" size={17} />} />
                      <div className="relative" style={{ height: 240 }}>
                        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 rounded-sm overflow-hidden">
                          <div className="bg-green-soft/50 flex items-start justify-start p-2"><span className="text-[10px] font-mono uppercase tracking-wider text-green-600">Ganhos rápidos</span></div>
                          <div className="bg-canvas-2/50" /><div className="bg-canvas-2/50" /><div className="bg-canvas-2/40" />
                        </div>
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                          <line x1="50" y1="0" x2="50" y2="100" stroke="var(--line)" strokeWidth="0.4" />
                          <line x1="0" y1="50" x2="100" y2="50" stroke="var(--line)" strokeWidth="0.4" />
                        </svg>
                        {pts.map((p, i) => {
                          const xPos = ((p.effort - 1) / 2) * 80 + 10 // esforço baixo → esquerda
                          const yPos = (1 - p.impact / maxI) * 80 + 6
                          return (
                            <div key={i} title={`${p.title} · ${brl(p.impact)} · esforço ${p.effort}/3`}
                              className="absolute -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue border-2 border-paper shadow-sm"
                              style={{ left: `${xPos}%`, top: `${yPos}%` }} />
                          )
                        })}
                        <div className="absolute bottom-1 left-2 text-[10px] font-mono text-ink-3">← menor esforço</div>
                        <div className="absolute bottom-1 right-2 text-[10px] font-mono text-ink-3">maior esforço →</div>
                      </div>
                    </Card>
                  )
                })()}

                {/* Roadmap 7/30/90 */}
                {plan && (
                  <Card>
                    <SectionHead title="Roadmap 90 dias" subtitle="Sequência recomendada" icon={<Icon name="calendar" size={17} />} />
                    <div className="space-y-3">
                      {[['7 dias', plan.seven_days, '#2C5FE0', 33], ['30 dias', plan.thirty_days, '#0E9CB0', 66], ['90 dias', plan.ninety_days, '#0E9E6E', 100]].map(([label, items, c, w]: any) => (
                        <div key={label}>
                          <div className="flex items-center justify-between text-xs mb-1"><span className="font-semibold text-ink">{label}</span><span className="text-ink-3">{(items || []).length} ações</span></div>
                          <div className="h-6 rounded-sm flex items-center px-2" style={{ width: `${w}%`, minWidth: 80, background: c }}>
                            <span className="text-[11px] text-white truncate">{(items?.[0]?.action || items?.[0]?.objective || '—')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        ) : (
          <Card className="animate-fade-up">
            <div className="text-center py-8 text-ink-3">
              <p className="text-sm">Nenhuma ação ainda. Rode a Análise Profunda para gerar ações prioritárias.</p>
              <Button variant="soft" size="sm" className="mt-3" onClick={() => (window.location.href = '/diagnostico')}>Rodar Análise Profunda</Button>
            </div>
          </Card>
        )
      )}

      {tab === 'estrategia' && (
        strat ? (
          <div className="space-y-4 animate-fade-up">
            {(!strat.growth_thesis || !matrix || !ta || (strat._schemaVersion ?? 0) < 2) && (
              <Card className="bg-amber-soft border-[#F2DDB0]">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="w-9 h-9 rounded-md bg-paper flex items-center justify-center shrink-0" style={{ color: '#D9870B' }}><Icon name="alert" size={17} /></span>
                  <div className="flex-1 min-w-[220px]">
                    <div className="text-sm font-bold text-ink">Estratégia desatualizada</div>
                    <div className="text-xs text-ink-2 mt-0.5">Esta estratégia foi gerada antes da nova inteligência. Gere novamente para ver a <b>tese de crescimento</b>, a <b>matriz Escalar/Corrigir/Testar/Cortar</b> e a <b>persona-alvo</b> com dados reais.</div>
                  </div>
                  <Button variant="primary" size="sm" icon={<Icon name="spark" size={14} />} onClick={genStrat} disabled={genLoading}>{genLoading ? 'Gerando…' : 'Atualizar estratégia'}</Button>
                </div>
              </Card>
            )}
            {(strat.growth_thesis) && (
              <Card className="bg-gradient-to-br from-blue-soft to-green-soft border-blue-line">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue flex items-center justify-center shrink-0"><span className="text-white text-lg">◎</span></div>
                  <div><div className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3 mb-1">Tese de crescimento · 90 dias</div>
                    <p className="text-sm text-ink leading-relaxed">{strat.growth_thesis}</p></div>
                </div>
              </Card>
            )}

            {matrix && (
              <Card>
                <SectionHead title="Matriz estratégica" subtitle="Decisão por iniciativa" icon={<Icon name="target" size={17} />} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {QUAD.map(q => (
                    <div key={q.k} className="rounded-md p-4" style={{ background: q.bg, border: `1px solid ${q.bd}` }}>
                      <div className="font-bold text-sm mb-2.5" style={{ color: q.c }}>{q.label}</div>
                      <div className="space-y-1.5">
                        {(matrix[q.k] || []).slice(0, 4).map((it: any, i: number) => (
                          <div key={i} className="text-xs text-ink-2 flex gap-2"><span style={{ color: q.c }}>•</span><span className="line-clamp-2">{matrixText(it)}</span></div>
                        ))}
                        {!(matrix[q.k] || []).length && <div className="text-xs text-ink-3">—</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {ta && (
              <Card>
                <SectionHead title="Persona-alvo & público" icon={<Icon name="target" size={17} />} />
                <div className="flex flex-wrap items-baseline gap-2 mb-2">
                  <span className="text-base font-bold text-ink">{ta.persona_snapshot?.name}</span>
                  <span className="text-sm text-ink-2">{[ta.demographics?.age_range, ta.demographics?.gender, ta.demographics?.income_range].filter(Boolean).join(' · ')}</span>
                </div>
                {ta.persona_snapshot?.one_liner && <p className="text-sm text-ink-2 mb-3">{ta.persona_snapshot.one_liner}</p>}
                <div className="grid md:grid-cols-2 gap-3">
                  {ta.best_regions?.length > 0 && (
                    <div><div className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3 mb-1.5">Melhores regiões</div>
                      {ta.best_regions.slice(0, 3).map((r: any, i: number) => <div key={i} className="text-xs text-ink-2">📍 {r.region}</div>)}</div>
                  )}
                  {ta.interests?.length > 0 && (
                    <div><div className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3 mb-1.5">Interesses</div>
                      <div className="flex flex-wrap gap-1.5">{ta.interests.slice(0, 6).map((it: string, i: number) => <Badge key={i} tone="blue">{it}</Badge>)}</div></div>
                  )}
                </div>
              </Card>
            )}

            {ranking.length > 0 && (
              <Card>
                <SectionHead title="Ranking de canais" subtitle="Onde investir" icon={<Icon name="layers" size={17} />} />
                <div className="space-y-3">
                  {(() => {
                    const maxB = Math.max(...ranking.map((c: any) => c.budget_brl || 0), 1)
                    const palette = [CHART_COLORS.blue, CHART_COLORS.green, CHART_COLORS.teal, CHART_COLORS.amber, CHART_COLORS.slate]
                    return ranking.map((ch: any, i: number) => (
                      <div key={ch.channel || i}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="w-5 h-5 rounded-md bg-canvas-2 text-ink font-mono text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                          <span className="flex-1 text-sm font-medium text-ink truncate">{ch.channel}</span>
                          <span className="text-xs font-mono text-ink-3">{ch.budget_brl ? `${brl(ch.budget_brl)}/mês` : ''}{ch.cpl_avg ? ` · CPL ~${brl(ch.cpl_avg)}` : ''}</span>
                          {ch.roi_range && <Badge tone={i === 0 ? 'good' : i < 2 ? 'blue' : 'neutral'}>{i === 0 ? 'Escalar' : i < 2 ? 'Otimizar' : 'Manter'}</Badge>}
                        </div>
                        <HBar value={ch.budget_brl || 0} max={maxB} color={palette[i % palette.length]} h={8} />
                      </div>
                    ))
                  })()}
                </div>
              </Card>
            )}

            {plan && (
              <Card>
                <SectionHead title="Plano 7 / 30 / 90 dias" icon={<Icon name="calendar" size={17} />} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[['7 dias', plan.seven_days, '#2C5FE0'], ['30 dias', plan.thirty_days, '#0E9CB0'], ['90 dias', plan.ninety_days, '#0E9E6E']].map(([label, items, c]: any) => (
                    <div key={label}>
                      <div className="flex items-center gap-2 mb-2.5"><span className="w-2 h-2 rounded-full" style={{ background: c }} /><span className="text-sm font-bold text-ink">{label}</span></div>
                      <div className="space-y-2">
                        {(items || []).slice(0, 4).map((x: any, i: number) => (
                          <div key={i} className="flex gap-2 p-2.5 bg-canvas-2 rounded-sm text-xs text-ink-2"><span style={{ color: c }}>✓</span><span className="line-clamp-2">{x.action || x.objective}</span></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        ) : (
          <Card className="animate-fade-up">
            <div className="text-center py-8 text-ink-3">
              <p className="text-sm">Estratégia ainda não gerada para este cliente.</p>
              <Button size="sm" className="mt-3" onClick={genStrat} disabled={genLoading || !key}>{genLoading ? 'Gerando…' : 'Gerar estratégia'}</Button>
            </div>
          </Card>
        )
      )}

      {tab === 'persona' && (
        <div className="animate-fade-up"><TabPersona clientData={clientData ?? null} /></div>
      )}
    </div>
  )
}
