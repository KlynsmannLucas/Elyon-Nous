// app/(elyon)/desempenho/page.tsx — Desempenho com DADOS REAIS (auditoria + estratégia).
'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Icon, Card, Badge, Button, SectionHead } from '@/components/dashboard/v2'

const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n || 0)
const int = (n: number) => new Intl.NumberFormat('pt-BR').format(n || 0)
const campCPL = (c: any) => (c.leads > 0 ? Math.round(c.spend / c.leads) : null)

type SubTab = 'visao' | 'campanhas' | 'canais' | 'funil'
const STATUS_TONE: Record<string, 'good' | 'warn' | 'bad'> = { vencedora: 'good', atencao: 'warn', critica: 'bad' }
const STATUS_LABEL: Record<string, string> = { vencedora: 'Escalar', atencao: 'Otimizar', critica: 'Revisar' }

function Empty() {
  return (
    <div className="p-4 md:p-6">
      <Card className="max-w-xl mx-auto mt-12">
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-blue-soft flex items-center justify-center mx-auto mb-4"><span className="text-blue text-2xl">📊</span></div>
          <h2 className="text-lg font-semibold text-ink mb-2">Sem dados de performance</h2>
          <p className="text-sm text-ink-2 mb-4">Rode a Análise Profunda (ou conecte suas contas) para ver o desempenho por campanha.</p>
          <Button onClick={() => (window.location.href = '/diagnostico')}>Rodar Análise Profunda</Button>
        </div>
      </Card>
    </div>
  )
}

export default function DesempenhoPage() {
  const clientData = useAppStore(s => s.clientData)
  const savedClients = useAppStore(s => s.savedClients)
  const auditCache = useAppStore(s => s.auditCache)
  const strategyData = useAppStore(s => s.strategyData)
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState<SubTab>('visao')
  useEffect(() => { setMounted(true) }, [])

  const key = clientData?.clientName || savedClients?.[0]?.clientData?.clientName || ''
  if (!mounted) return null
  if (!key) return <Empty />

  const audit: any = auditCache[key]?.[0]?.audit
  const rm = audit?._realMetrics
  const cc = audit?._campanhasClassificadas
  const ranking: any[] = strategyData?.strategy?.priority_ranking || []

  const camps = cc
    ? [
        ...(cc.vencedoras || []).map((c: any) => ({ ...c, _s: 'vencedora' })),
        ...(cc.atencao || []).map((c: any) => ({ ...c, _s: 'atencao' })),
        ...(cc.criticas || []).map((c: any) => ({ ...c, _s: 'critica' })),
      ].sort((a, b) => (b.spend || 0) - (a.spend || 0))
    : []

  if (!rm && camps.length === 0 && ranking.length === 0) return <Empty />

  const kpis = [
    { label: 'Investido', value: rm ? brl(rm.totalSpend) : '—' },
    { label: 'Leads', value: rm ? int(rm.totalLeads) : '—' },
    { label: 'ROAS', value: rm?.avgROAS ? `${rm.avgROAS}x` : '—' },
    { label: 'CPL médio', value: rm?.avgCPL ? brl(rm.avgCPL) : '—' },
  ]

  const tabs: { key: SubTab; label: string }[] = [
    { key: 'visao', label: 'Visão geral' }, { key: 'campanhas', label: 'Campanhas' },
    { key: 'canais', label: 'Canais' }, { key: 'funil', label: 'Funil' },
  ]

  const CampTable = ({ rows }: { rows: any[] }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-[10.5px] font-mono uppercase tracking-wider text-ink-3">
            <th className="text-left py-2.5 px-3 font-semibold">Campanha</th>
            <th className="text-right py-2.5 px-3 font-semibold">Investido</th>
            <th className="text-right py-2.5 px-3 font-semibold">Leads</th>
            <th className="text-right py-2.5 px-3 font-semibold">CPL</th>
            <th className="text-center py-2.5 px-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c, i) => (
            <tr key={`${c.name}-${i}`} className="border-b border-line-2 hover:bg-canvas">
              <td className="py-2.5 px-3 text-ink font-medium max-w-[280px] truncate">{c.name || 'Sem nome'}</td>
              <td className="py-2.5 px-3 text-right font-mono text-ink">{brl(c.spend || 0)}</td>
              <td className="py-2.5 px-3 text-right font-mono text-ink">{int(c.leads || 0)}</td>
              <td className="py-2.5 px-3 text-right font-mono text-ink">{campCPL(c) != null ? brl(campCPL(c)!) : '—'}</td>
              <td className="py-2.5 px-3 text-center"><Badge tone={STATUS_TONE[c._s]} dot>{STATUS_LABEL[c._s]}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="p-4 md:p-6">
      <header className="mb-5 animate-fade-up">
        <h1 className="text-[23px] font-bold text-ink" style={{ letterSpacing: '-0.02em' }}>Desempenho</h1>
        <p className="text-sm text-ink-2 mt-0.5">{key}{rm ? ` · ${int(rm.campaignCount || camps.length)} campanhas` : ''}</p>
      </header>

      <div className="mb-5 flex gap-1 border-b border-line overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${tab === t.key ? 'text-blue border-blue' : 'text-ink-3 border-transparent hover:text-ink'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'visao' && (
        <div className="space-y-4 animate-fade-up">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {kpis.map(k => (
              <Card key={k.label} padding="sm" hover>
                <div className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3 mb-1">{k.label}</div>
                <div className="text-[20px] font-bold font-mono text-ink" style={{ letterSpacing: '-0.02em' }}>{k.value}</div>
              </Card>
            ))}
          </div>
          <Card>
            <SectionHead title="Top campanhas" subtitle={camps.length ? `${camps.length} com investimento` : undefined} icon={<Icon name="chart" size={17} />} />
            {camps.length > 0 ? <CampTable rows={camps.slice(0, 8)} /> : <p className="text-center py-8 text-ink-3 text-sm">Sem dados por campanha. Rode a Análise Profunda.</p>}
          </Card>
        </div>
      )}

      {tab === 'campanhas' && (
        <Card className="animate-fade-up">
          <SectionHead title="Todas as campanhas" subtitle={`${camps.length} campanhas`} icon={<Icon name="megaphone" size={17} />} />
          {camps.length > 0 ? <CampTable rows={camps} /> : <p className="text-center py-8 text-ink-3 text-sm">Nenhuma campanha.</p>}
        </Card>
      )}

      {tab === 'canais' && (
        <Card className="animate-fade-up">
          <SectionHead title="Canais recomendados" subtitle="Ranking e alocação sugerida pela IA" icon={<Icon name="layers" size={17} />} />
          {ranking.length > 0 ? (
            <div className="space-y-3">
              {ranking.map((ch: any, i: number) => (
                <div key={ch.channel || i} className="flex items-center gap-3 p-3 bg-canvas-2 rounded-sm">
                  <span className="w-7 h-7 rounded-md bg-paper border border-line text-ink font-mono text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink">{ch.channel}</div>
                    <div className="text-xs text-ink-3">{ch.budget_brl ? `${brl(ch.budget_brl)}/mês` : ''}{ch.cpl_avg ? ` · CPL ~${brl(ch.cpl_avg)}` : ''}{ch.leads_min ? ` · ${int(ch.leads_min)}–${int(ch.leads_max)} leads` : ''}</div>
                  </div>
                  {ch.roi_range && <Badge tone="good">{ch.roi_range}</Badge>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-ink-3">
              <p className="text-sm">Gere a estratégia para ver o ranking de canais.</p>
              <Button variant="soft" size="sm" className="mt-3" onClick={() => (window.location.href = '/plano')}>Ver Plano de Ação</Button>
            </div>
          )}
        </Card>
      )}

      {tab === 'funil' && (
        <Card className="animate-fade-up">
          <SectionHead title="Funil de conversão" subtitle="Da impressão ao lead" icon={<Icon name="funnel" size={17} />} />
          {rm && (rm.totalImpressions || rm.totalClicks || rm.totalLeads) ? (
            <div className="space-y-3 max-w-xl">
              {[
                { stage: 'Impressões', v: rm.totalImpressions || 0, color: '#2C5FE0' },
                { stage: 'Cliques', v: rm.totalClicks || 0, color: '#0E9CB0' },
                { stage: 'Leads', v: rm.totalLeads || 0, color: '#0E9E6E' },
              ].map((s, i, arr) => {
                const max = arr[0].v || 1
                const pct = Math.max(4, Math.round((s.v / max) * 100))
                const conv = i > 0 && arr[i - 1].v > 0 ? ((s.v / arr[i - 1].v) * 100).toFixed(1) : null
                return (
                  <div key={s.stage}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-ink font-medium">{s.stage}</span>
                      <span className="font-mono text-ink-2">{int(s.v)}{conv ? ` · ${conv}%` : ''}</span>
                    </div>
                    <div className="h-7 rounded-sm flex items-center px-2" style={{ width: `${pct}%`, minWidth: 60, background: s.color }}>
                      <span className="text-[11px] font-mono text-white">{int(s.v)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-center py-8 text-ink-3 text-sm">Sem dados de funil. Rode a Análise Profunda com dados de campanha.</p>
          )}
        </Card>
      )}
    </div>
  )
}
