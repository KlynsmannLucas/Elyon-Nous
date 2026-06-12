// app/(elyon)/diagnostico/page.tsx — Diagnóstico com a AUDITORIA REAL.
'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, Badge, Button, SectionHead, Delta, SourceBadge } from '@/components/dashboard/v2'
import CrossCheckPanel from '@/components/dashboard/CrossCheckPanel'

const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n || 0)
type SubTab = 'visao' | 'auditoria'

function Empty() {
  return (
    <div className="p-4 md:p-6">
      <Card className="max-w-xl mx-auto mt-12">
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-blue-soft flex items-center justify-center mx-auto mb-4"><span className="text-blue text-2xl">🔬</span></div>
          <h2 className="text-lg font-semibold text-ink mb-2">Diagnóstico ainda não gerado</h2>
          <p className="text-sm text-ink-2 mb-4">Rode a Análise Profunda para receber score de saúde, gargalos, oportunidades e desperdício de verba — com os dados reais da conta.</p>
          <Button onClick={() => (window.location.href = '/dashboard?view=audit')}>Rodar Análise Profunda</Button>
        </div>
      </Card>
    </div>
  )
}

export default function DiagnosticoPage() {
  const clientData = useAppStore(s => s.clientData)
  const savedClients = useAppStore(s => s.savedClients)
  const auditCache = useAppStore(s => s.auditCache)
  const clientHealthScores = useAppStore(s => s.clientHealthScores)
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState<SubTab>('visao')
  useEffect(() => { setMounted(true) }, [])

  const key = clientData?.clientName || savedClients?.[0]?.clientData?.clientName || ''
  if (!mounted) return null
  if (!key) return <Empty />

  const audit: any = auditCache[key]?.[0]?.audit
  if (!audit) return <Empty />

  const hs = clientHealthScores[key]
  const score: number | null = hs?.score ?? audit.health_score ?? null
  const grade: string = hs?.grade ?? audit.grade ?? '—'
  const ev = audit._evolution
  const scColor = score == null ? '#8A93A3' : score >= 70 ? '#0E9E6E' : score >= 50 ? '#E08B0B' : '#E1483F'
  const gargalos: any[] = audit.gargalos || []
  const oportunidades: any[] = audit.oportunidades || []
  const waste: any[] = audit._wasteCampaigns || []
  const wasteTotal = waste.reduce((s, c) => s + (c.spend || 0), 0)
  const tracking: any[] = audit._trackingChecklist || []
  const tv = tracking.filter(t => t.status === 'verificado').length
  const tu = tracking.filter(t => t.status === 'nao_verificado').length
  const tp = tracking.filter(t => t.status === 'problema').length

  const tabs: { key: SubTab; label: string }[] = [
    { key: 'visao', label: 'Visão geral' }, { key: 'auditoria', label: 'Auditoria profunda' },
  ]

  return (
    <div className="p-4 md:p-6">
      <header className="mb-5 animate-fade-up">
        <h1 className="text-[23px] font-bold text-ink" style={{ letterSpacing: '-0.02em' }}>Diagnóstico</h1>
        <p className="text-sm text-ink-2 mt-0.5">{key}{audit._period ? ` · ${audit._period}` : ''}</p>
      </header>

      <div className="mb-5 flex gap-1 border-b border-line">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.key ? 'text-blue border-blue' : 'text-ink-3 border-transparent hover:text-ink'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'visao' && (
        <div className="space-y-4 animate-fade-up">
          {/* Health + summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <SectionHead title="Saúde da conta" icon={<span>💚</span>} action={<SourceBadge source={hs?.source === 'ai' ? 'ai' : 'real'} />} />
              <div className="flex items-center gap-5">
                <div className="relative w-24 h-24 shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--canvas-2)" strokeWidth="8" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke={scColor} strokeWidth="8" strokeDasharray={`${Math.round((score || 0) * 2.51)} 251`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center"><span className="text-2xl font-bold font-mono text-ink">{score ?? '—'}</span></div>
                </div>
                <div>
                  <div className="flex items-center gap-2"><span className="text-lg font-bold" style={{ color: scColor }}>{grade}</span>{ev?.scoreDelta != null && ev.scoreDelta !== 0 && <Delta value={ev.scoreDelta} suffix=" pts" />}</div>
                  <p className="text-xs text-ink-3 mt-1">{(score ?? 0) >= 80 ? 'Acima da média do mercado.' : (score ?? 0) >= 60 ? 'Há oportunidades de melhoria.' : 'Gargalos limitando os resultados.'}</p>
                </div>
              </div>
            </Card>
            <Card className="lg:col-span-2 bg-gradient-to-br from-blue-soft to-green-soft border-blue-line">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue flex items-center justify-center shrink-0"><span className="text-white text-lg">◎</span></div>
                <div className="min-w-0">
                  <div className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3 mb-1">Resumo do NOUS</div>
                  <p className="text-sm text-ink-2 line-clamp-4">{audit.executive_summary || audit.qualidade_dados || 'Auditoria concluída — veja gargalos e oportunidades abaixo.'}</p>
                  <Button size="sm" className="mt-3" onClick={() => (window.location.href = '/plano')}>Ver plano recomendado</Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Gargalos */}
          {gargalos.length > 0 && (
            <Card>
              <SectionHead title="Maiores gargalos" subtitle="O que está travando o crescimento" icon={<span>🚧</span>} />
              <div className="space-y-2.5">
                {gargalos.slice(0, 5).map((g, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-sm" style={{ background: '#FCEBEA', border: '1px solid #F3CFCC' }}>
                    <span className="w-5 h-5 rounded-full bg-red text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{g.rank || i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-ink">{g.titulo}</span>
                        {g.impacto && <span className="text-[11px] font-semibold text-red ml-auto shrink-0">{g.impacto}</span>}
                      </div>
                      {g.descricao && <p className="text-xs text-ink-2 mt-0.5 leading-relaxed line-clamp-2">{g.descricao}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Oportunidades */}
          {oportunidades.length > 0 && (
            <Card>
              <SectionHead title="Oportunidades de escala" icon={<span>🚀</span>} />
              <div className="grid md:grid-cols-2 gap-3">
                {oportunidades.slice(0, 4).map((op, i) => (
                  <div key={i} className="p-3 rounded-sm bg-green-soft border border-green-line">
                    <div className="text-sm font-semibold text-ink mb-1">{op.titulo}</div>
                    {op.descricao && <p className="text-xs text-ink-2 leading-relaxed line-clamp-3">{op.descricao}</p>}
                    {op.potencial && <div className="text-xs font-semibold text-green-600 mt-2">📈 {op.potencial}</div>}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {tab === 'auditoria' && (
        <div className="space-y-4 animate-fade-up">
          {/* Desperdício */}
          {waste.length > 0 && (
            <Card>
              <SectionHead title="Desperdício de verba" subtitle={`${audit._wastePercent ?? 0}% do investimento · sem conversão`} icon={<span>💸</span>}
                action={<span className="font-mono text-base font-bold text-red">−{brl(wasteTotal)}</span>} />
              <div className="space-y-2">
                {waste.slice(0, 6).map((c, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-sm" style={{ background: '#FCEBEA', border: '1px solid #F3CFCC' }}>
                    <span className="text-red shrink-0">⚠</span>
                    <span className="flex-1 text-sm text-ink truncate">{c.name || 'Sem nome'}</span>
                    <span className="font-mono text-sm font-bold text-red">−{brl(c.spend || 0)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Tracking */}
          {tracking.length > 0 && (
            <Card>
              <SectionHead title="Checklist de tracking" subtitle="Confiabilidade dos dados de conversão" icon={<span>✅</span>} />
              <div className="flex gap-2 flex-wrap">
                {tv > 0 && <Badge tone="good" dot>{tv} verificados</Badge>}
                {tu > 0 && <Badge tone="warn" dot>{tu} não verificados</Badge>}
                {tp > 0 && <Badge tone="bad" dot>{tp} com problema</Badge>}
              </div>
              {(tu + tp) > 0 && <p className="text-xs text-ink-3 mt-3">Valide os eventos de conversão no Events Manager antes de escalar agressivamente.</p>}
            </Card>
          )}

          {/* Segunda opinião (Gemini) — reusa o painel existente */}
          <CrossCheckPanel kind="audit" payload={audit} niche={clientData?.niche} />

          {!waste.length && !tracking.length && (
            <Card><p className="text-center py-8 text-ink-3 text-sm">Detalhes da auditoria disponíveis na Análise Profunda do dashboard.</p></Card>
          )}
        </div>
      )}
    </div>
  )
}
