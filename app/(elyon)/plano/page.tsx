// app/(elyon)/plano/page.tsx — Plano de Ação (execução + estratégia 90 dias) com DADOS REAIS.
'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, Badge, Button, SectionHead } from '@/components/dashboard/v2'

const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n || 0)
type SubTab = 'execucao' | 'estrategia'
const URGENCY_TONE: Record<string, 'bad' | 'warn' | 'neutral'> = { critica: 'bad', alta: 'warn', media: 'neutral', baixa: 'neutral' }

export default function PlanoPage() {
  const clientData = useAppStore(s => s.clientData)
  const savedClients = useAppStore(s => s.savedClients)
  const pendingActionsCache = useAppStore(s => s.pendingActionsCache)
  const strategyData = useAppStore(s => s.strategyData)
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState<SubTab>('execucao')
  useEffect(() => { setMounted(true) }, [])

  const key = clientData?.clientName || savedClients?.[0]?.clientData?.clientName || ''
  if (!mounted) return null

  const actions = key ? pendingActionsCache[key] || [] : []
  const planned = actions.filter(a => a.status === 'pendente')
  const inProgress = actions.filter(a => a.status === 'em_andamento')
  const completed = actions.filter(a => a.status === 'concluida')
  const strat: any = strategyData?.strategy
  const ta = strat?.target_audience
  const matrix = strat?.strategic_matrix
  const plan = strat?.plan_7_30_90
  const ranking: any[] = strat?.priority_ranking || []

  const tabs: { key: SubTab; label: string }[] = [
    { key: 'execucao', label: 'Execução' }, { key: 'estrategia', label: 'Estratégia 90 dias' },
  ]

  const Column = ({ title, icon, items, tone }: { title: string; icon: string; items: any[]; tone: 'neutral' | 'blue' | 'good' }) => (
    <Card>
      <SectionHead title={title} subtitle={`${items.length}`} icon={<span>{icon}</span>} />
      <div className="space-y-2">
        {items.length ? items.map((a, i) => (
          <div key={a.id || i} className="p-3 rounded-sm" style={{ background: tone === 'blue' ? '#EAF0FE' : tone === 'good' ? '#E4F6EE' : '#EEF0F3' }}>
            <div className="text-sm font-medium text-ink">{a.title}</div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge tone={URGENCY_TONE[a.urgency] || 'neutral'} dot>{a.urgency}</Badge>
              {a.platform && a.platform !== 'ambos' && <span className="text-[10px] text-ink-3 uppercase font-mono">{a.platform}</span>}
            </div>
          </div>
        )) : <p className="text-xs text-ink-3 py-3 text-center">Vazio</p>}
      </div>
    </Card>
  )

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

      <div className="grid grid-cols-3 gap-3 mb-5 animate-fade-up">
        {[['Planejadas', planned.length, '#161B26'], ['Em andamento', inProgress.length, '#1E4FD0'], ['Concluídas', completed.length, '#0B855D']].map(([l, v, c]) => (
          <Card key={l as string} padding="sm">
            <div className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3 mb-1">{l}</div>
            <div className="text-xl font-bold font-mono" style={{ color: c as string }}>{v as number}</div>
          </Card>
        ))}
      </div>

      <div className="mb-5 flex gap-1 border-b border-line">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.key ? 'text-blue border-blue' : 'text-ink-3 border-transparent hover:text-ink'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'execucao' && (
        actions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-up">
            <Column title="Planejado" icon="📋" items={planned} tone="neutral" />
            <Column title="Em andamento" icon="🔄" items={inProgress} tone="blue" />
            <Column title="Concluído" icon="✓" items={completed} tone="good" />
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
                <SectionHead title="Matriz estratégica" subtitle="Decisão por iniciativa" icon={<span>🎯</span>} />
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
                <SectionHead title="Persona-alvo & público" icon={<span>🎯</span>} />
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
                <SectionHead title="Ranking de canais" subtitle="Onde investir" icon={<span>🧩</span>} />
                <div className="space-y-2">
                  {ranking.map((ch: any, i: number) => (
                    <div key={ch.channel || i} className="flex items-center gap-3 p-2.5 bg-canvas-2 rounded-sm">
                      <span className="w-6 h-6 rounded-md bg-paper border border-line text-ink font-mono text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <span className="flex-1 text-sm font-medium text-ink">{ch.channel}</span>
                      <span className="text-xs font-mono text-ink-3">{ch.budget_brl ? `${brl(ch.budget_brl)}/mês` : ''}{ch.cpl_avg ? ` · CPL ~${brl(ch.cpl_avg)}` : ''}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {plan && (
              <Card>
                <SectionHead title="Plano 7 / 30 / 90 dias" icon={<span>📅</span>} />
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
              <Button variant="soft" size="sm" className="mt-3" onClick={() => (window.location.href = '/dashboard')}>Gerar estratégia</Button>
            </div>
          </Card>
        )
      )}
    </div>
  )
}
