// app/(elyon)/desempenho/page.tsx — Desempenho com DADOS REAIS (auditoria + estratégia).
'use client'

import { Fragment, useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Icon, Card, Badge, Button, SectionHead, SourceBadge, Delta, Sparkline, Donut, BarChart, Funnel, LineChart, LegendDot, HBar, ChannelMark, platformName, Modal, CHART_COLORS } from '@/components/dashboard/v2'
import { useDailySeries } from '@/lib/useDailySeries'

const CHANNEL_META: Record<string, { label: string; color: string }> = {
  meta: { label: 'Meta Ads', color: CHART_COLORS.blue },
  facebook: { label: 'Meta Ads', color: CHART_COLORS.blue },
  instagram: { label: 'Meta Ads', color: CHART_COLORS.blue },
  google: { label: 'Google Ads', color: CHART_COLORS.green },
  tiktok: { label: 'TikTok Ads', color: CHART_COLORS.teal },
  linkedin: { label: 'LinkedIn', color: CHART_COLORS.amber },
}
const channelOf = (c: any): { key: string; label: string; color: string } => {
  const raw = String(c.platform || c.channel || c.source || '').toLowerCase()
  const hit = Object.keys(CHANNEL_META).find(k => raw.includes(k))
  if (hit) return { key: CHANNEL_META[hit].label, ...CHANNEL_META[hit] }
  return { key: 'Outros', label: 'Outros', color: CHART_COLORS.slate }
}
// ROI só é exibido quando plausível (cálculo de benchmark pode estourar p/ nichos de ticket alto).
const roiOk = (range: any) => { const m = String(range || '').match(/(\d+)/g); return m ? Number(m[m.length - 1]) <= 600 : false }

const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n || 0)
const int = (n: number) => new Intl.NumberFormat('pt-BR').format(n || 0)
const campCPL = (c: any) => (c.leads > 0 ? Math.round(c.spend / c.leads) : null)

// Exporta as campanhas filtradas como CSV real (download no navegador).
function exportCsv(rows: any[]) {
  const head = ['Campanha', 'Canal', 'Investimento', 'Receita', 'Conversoes', 'ROAS', 'CPA', 'CTR', 'Status']
  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = rows.map(c => [
    c.name || '', String(c.platform || ''), Math.round(c.spend || 0), Math.round(c.revenue || 0),
    Math.round(c.leads || 0), c.roas ? Number(c.roas).toFixed(2) : '', campCPL(c) ?? '',
    c.ctr ? Number(c.ctr).toFixed(2) : '', STATUS_LABEL[c._s] || '',
  ].map(esc).join(','))
  const csv = [head.map(esc).join(','), ...lines].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `campanhas_${new Date().toISOString().slice(0, 10)}.csv`
  a.click(); URL.revokeObjectURL(url)
  if (typeof window !== 'undefined') window.toast?.({ tone: 'good', title: 'CSV exportado', body: `${rows.length} campanhas baixadas.` })
}

type SubTab = 'visao' | 'campanhas' | 'audiencias' | 'canais' | 'criativos' | 'funil' | 'alocador'
const STATUS_TONE: Record<string, 'good' | 'warn' | 'bad'> = { vencedora: 'good', atencao: 'warn', critica: 'bad' }
const STATUS_LABEL: Record<string, string> = { vencedora: 'Escalar', atencao: 'Otimizar', critica: 'Revisar' }

function Empty() {
  return (
    <div className="p-4 md:p-6">
      <Card className="max-w-xl mx-auto mt-12">
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-blue-soft flex items-center justify-center mx-auto mb-4"><Icon name="chart" size={26} /></div>
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
  const [openRow, setOpenRow] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [channelFilter, setChannelFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  useEffect(() => { setMounted(true) }, [])

  const key = clientData?.clientName || savedClients?.[0]?.clientData?.clientName || ''
  const daily = useDailySeries(auditCache[key]?.[0]?.audit?._realMetrics?.avgROAS ?? null)
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

  // Split por canal derivado das campanhas reais. Se a conta tem só UMA plataforma
  // conectada (dataSource), todo o investimento é dela — evita subcontar como "Outros".
  const singlePlatform = rm?.dataSource === 'meta' ? { label: 'Meta Ads', color: CHART_COLORS.blue }
    : rm?.dataSource === 'google' ? { label: 'Google Ads', color: CHART_COLORS.green } : null
  const chMap = new Map<string, { label: string; color: string; spend: number; leads: number }>()
  for (const c of camps) {
    const ch = singlePlatform || channelOf(c)
    const e = chMap.get(ch.label) || { label: ch.label, color: ch.color, spend: 0, leads: 0 }
    e.spend += c.spend || 0; e.leads += c.leads || 0
    chMap.set(ch.label, e)
  }
  const channels = [...chMap.values()].sort((a, b) => b.spend - a.spend)
  const hasChannelSplit = channels.length >= 2 && !(channels.length === 1)
  const channelDonut = channels.map(c => ({ label: c.label, value: c.spend, color: c.color }))

  // KPIs (6 rótulos exatos do prototype) com mini-sparkline derivada do delta real.
  const prev = audit?._previousTotals
  const spark = (cur: number, deltaPct: number | null | undefined): number[] | null => {
    if (cur == null || deltaPct == null || deltaPct === 0) return null
    return [cur / (1 + deltaPct / 100), cur]
  }
  const kpis = rm ? [
    { label: 'Investimento', value: brl(rm.totalSpend), trend: prev?.spendDelta ?? null, inverse: false, series: spark(rm.totalSpend, prev?.spendDelta), up: (prev?.spendDelta ?? 0) >= 0 },
    { label: 'Receita', value: rm.totalRevenue > 0 ? brl(rm.totalRevenue) : '—', trend: prev?.revenueDelta ?? null, inverse: false, series: rm.totalRevenue > 0 ? spark(rm.totalRevenue, prev?.revenueDelta) : null, up: (prev?.revenueDelta ?? 0) >= 0 },
    { label: 'ROAS', value: rm.avgROAS ? `${rm.avgROAS}x` : '—', trend: null, inverse: false, series: null, up: true },
    { label: 'Conversões', value: int(rm.totalLeads), trend: prev?.leadsDelta ?? null, inverse: false, series: spark(rm.totalLeads, prev?.leadsDelta), up: (prev?.leadsDelta ?? 0) >= 0 },
    { label: 'CPA médio', value: rm.avgCPL ? brl(rm.avgCPL) : '—', trend: prev?.cplDelta ?? null, inverse: true, series: spark(rm.avgCPL, prev?.cplDelta), up: (prev?.cplDelta ?? 0) <= 0 },
    { label: 'CTR médio', value: rm.avgCTR ? `${rm.avgCTR}%` : '—', trend: null, inverse: false, series: null, up: true },
  ] : []

  const tabs: { key: SubTab; label: string; icon: string }[] = [
    { key: 'visao', label: 'Visão geral', icon: 'chart' }, { key: 'campanhas', label: 'Campanhas', icon: 'megaphone' },
    { key: 'audiencias', label: 'Audiências', icon: 'users' }, { key: 'canais', label: 'Canais', icon: 'layers' },
    { key: 'criativos', label: 'Criativos', icon: 'spark' }, { key: 'funil', label: 'Funil', icon: 'funnel' },
    { key: 'alocador', label: 'Alocador IA', icon: 'scale' },
  ]
  const ta: any = strategyData?.strategy?.target_audience
  const criativos: any = audit?.criativos_meta

  const CampTable = ({ rows }: { rows: any[] }) => {
    // Omite colunas sem dado real (Receita/ROAS/CTR ausentes em contas de leads).
    const hasRev = rows.some(r => (r.revenue || 0) > 0)
    const hasRoas = rows.some(r => (r.roas || 0) > 0)
    const hasCtr = rows.some(r => (r.ctr || 0) > 0)
    const colCount = 5 + (hasRev ? 1 : 0) + (hasRoas ? 1 : 0) + (hasCtr ? 1 : 0)
    const th = 'py-2.5 px-3 font-semibold border-b border-line whitespace-nowrap'
    return (
      <div className="overflow-x-auto no-sb">
        <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr className="text-[10.5px] font-mono uppercase tracking-[0.06em] text-ink-3">
              <th className={`text-left ${th}`}>Campanha</th>
              <th className={`text-right ${th}`}>Investimento</th>
              {hasRev && <th className={`text-right ${th}`}>Receita</th>}
              <th className={`text-right ${th}`}>Conv.</th>
              {hasRoas && <th className={`text-right ${th}`}>ROAS</th>}
              <th className={`text-right ${th}`}>CPA</th>
              {hasCtr && <th className={`text-right ${th}`}>CTR</th>}
              <th className={`text-center ${th}`}>Status</th>
              <th className={`border-b border-line w-8`}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c, i) => {
              const id = `${c.name}-${i}`
              const open = openRow === id
              const hasDetail = !!(c.evidence || c.recommended_action)
              const cpa = c.leads > 0 ? Math.round(c.spend / c.leads) : null
              const roas = Number(c.roas || 0)
              const td = 'py-[11px] px-3 border-b border-line-2 whitespace-nowrap font-mono'
              return (
                <Fragment key={id}>
                  <tr className={`hover:bg-canvas transition-colors ${hasDetail ? 'cursor-pointer' : ''}`} onClick={() => hasDetail && setOpenRow(open ? null : id)}>
                    <td className="py-[11px] px-3 border-b border-line-2 max-w-[300px]">
                      <div className="flex items-center gap-2.5">
                        <ChannelMark name={platformName(c.platform)} size={20} />
                        <span className="text-ink font-medium truncate">{c.name || 'Sem nome'}</span>
                      </div>
                    </td>
                    <td className={`text-right text-ink ${td}`}>{brl(c.spend || 0)}</td>
                    {hasRev && <td className={`text-right text-ink ${td}`}>{(c.revenue || 0) > 0 ? brl(c.revenue) : '—'}</td>}
                    <td className={`text-right text-ink ${td}`}>{int(c.leads || 0)}</td>
                    {hasRoas && <td className={`text-right ${td} font-semibold`} style={{ color: roas >= 3 ? '#0B855D' : '#E08B0B' }}>{roas > 0 ? `${roas.toFixed(2)}x` : '—'}</td>}
                    <td className={`text-right text-ink ${td}`}>{cpa != null ? brl(cpa) : '—'}</td>
                    {hasCtr && <td className={`text-right text-ink-2 ${td}`}>{(c.ctr || 0) > 0 ? `${Number(c.ctr).toFixed(2)}%` : '—'}</td>}
                    <td className="py-[11px] px-3 border-b border-line-2 text-center"><Badge tone={STATUS_TONE[c._s]} dot>{STATUS_LABEL[c._s]}</Badge></td>
                    <td className="py-[11px] px-3 border-b border-line-2 text-right text-ink-4">{hasDetail && <Icon name="chevR" size={15} className={`inline transition-transform ${open ? 'rotate-90' : ''}`} />}</td>
                  </tr>
                  {open && hasDetail && (
                    <tr className="bg-canvas-2/50">
                      <td colSpan={colCount} className="px-3 pb-3 pt-1">
                        <div className="grid md:grid-cols-2 gap-3">
                          {c.evidence && (
                            <div className="p-3 rounded-sm bg-paper border border-line">
                              <div className="text-[10px] font-mono uppercase tracking-wider text-ink-3 mb-1">Evidência</div>
                              <p className="text-xs text-ink-2 leading-relaxed">{c.evidence}</p>
                            </div>
                          )}
                          {c.recommended_action && (
                            <div className="p-3 rounded-sm bg-blue-soft border border-blue-line">
                              <div className="text-[10px] font-mono uppercase tracking-wider text-blue mb-1">Recomendação do NOUS</div>
                              <p className="text-xs text-ink-2 leading-relaxed">{c.recommended_action}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <header className="mb-5 animate-fade-up">
        <h1 className="text-[23px] font-bold text-ink" style={{ letterSpacing: '-0.02em' }}>Desempenho</h1>
        <p className="text-sm text-ink-2 mt-0.5">{key}{rm ? ` · ${int(rm.campaignCount || camps.length)} campanhas` : ''}</p>
      </header>

      <div className="mb-5 flex gap-1 border-b border-line overflow-x-auto no-sb">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3.5 py-2.5 text-[13.5px] font-medium border-b-2 -mb-px whitespace-nowrap transition-colors inline-flex items-center gap-1.5 ${tab === t.key ? 'text-ink border-blue font-semibold' : 'text-ink-3 border-transparent hover:text-ink'}`}>
            <Icon name={t.icon} size={15} />{t.label}
          </button>
        ))}
      </div>

      {tab === 'visao' && (
        <div className="space-y-4 animate-fade-up">
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
            {kpis.map(k => (
              <Card key={k.label} padding="sm" hover>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3">{k.label}</span>
                  {k.trend != null && k.trend !== 0 && <Delta value={k.trend} inverse={k.inverse} />}
                </div>
                <span className="text-[20px] font-bold font-mono text-ink block" style={{ letterSpacing: '-0.02em' }}>{k.value}</span>
                {k.series && <div className="mt-2"><Sparkline data={k.series} h={26} color={k.up ? CHART_COLORS.green : CHART_COLORS.red} /></div>}
              </Card>
            ))}
          </div>
          {daily && (
            <Card>
              <SectionHead title={daily.hasRevenue ? 'Tendência de receita × investimento' : 'Tendência de investimento × leads'} subtitle="Série diária real (Meta)" icon={<Icon name="chart" size={17} />}
                action={<div className="flex gap-3">{daily.hasRevenue ? <LegendDot color={CHART_COLORS.green}>Receita</LegendDot> : <LegendDot color={CHART_COLORS.green}>Leads</LegendDot>}<LegendDot color={CHART_COLORS.blue}>Investimento</LegendDot></div>} />
              <LineChart
                labels={daily.labels}
                money={daily.hasRevenue}
                series={daily.hasRevenue
                  ? [{ name: 'Receita', color: CHART_COLORS.green, data: daily.revenue! }, { name: 'Investimento', color: CHART_COLORS.blue, data: daily.spend }]
                  : [{ name: 'Leads', color: CHART_COLORS.green, data: daily.leads }, { name: 'Investimento', color: CHART_COLORS.blue, data: daily.spend }]} />
              {daily.hasRevenue && <p className="text-[11px] text-ink-3 mt-2">Receita estimada a partir do investimento diário real × ROAS médio da conta.</p>}
            </Card>
          )}
          {hasChannelSplit && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <SectionHead title="Distribuição por canal" subtitle="Investimento" icon={<Icon name="layers" size={17} />} />
                <Donut data={channelDonut} centerLabel={brl(channels.reduce((s, c) => s + c.spend, 0)).replace('R$ ', 'R$')} centerSub="total" />
              </Card>
              <Card>
                <SectionHead title="Leads por canal" subtitle="Volume de conversões" icon={<Icon name="chart" size={17} />} />
                <BarChart data={channels.map(c => ({ label: c.label.replace(' Ads', ''), value: c.leads, color: c.color }))} height={200} valueFmt={(v) => int(v)} />
              </Card>
            </div>
          )}
          <Card>
            <SectionHead title="Top campanhas" subtitle={camps.length ? `${camps.length} com investimento` : undefined} icon={<Icon name="chart" size={17} />} />
            {camps.length > 0 ? <CampTable rows={camps.slice(0, 8)} /> : <p className="text-center py-8 text-ink-3 text-sm">Sem dados por campanha. Rode a Análise Profunda.</p>}
          </Card>
        </div>
      )}

      {tab === 'campanhas' && (() => {
        const channels = Array.from(new Set(camps.map((c: any) => platformName(c.platform))))
        const filtered = camps.filter((c: any) =>
          (channelFilter === 'all' || platformName(c.platform) === channelFilter) &&
          (statusFilter === 'all' || c._s === statusFilter))
        const activeFilters = (channelFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0)
        const pill = (active: boolean) => `px-3 py-1.5 text-[12.5px] font-semibold rounded-pill border-[1.5px] ${active ? 'border-blue bg-blue-soft text-blue-600' : 'border-line bg-paper text-ink-2 hover:border-line-strong'}`
        return (
          <div className="animate-fade-up">
            <Card>
              <SectionHead title="Desempenho por campanha" subtitle={`${filtered.length} de ${camps.length} campanhas · clique numa linha para detalhes`} icon={<Icon name="megaphone" size={17} />}
                action={camps.length ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" icon="filter" onClick={() => setFilterOpen(true)}>Filtros{activeFilters ? ` · ${activeFilters}` : ''}</Button>
                    <Button size="sm" variant="ghost" icon="download" onClick={() => setExportOpen(true)}>Exportar</Button>
                  </div>
                ) : undefined} />
              {filtered.length > 0 ? <CampTable rows={filtered} /> : <p className="text-center py-8 text-ink-3 text-sm">Nenhuma campanha{activeFilters ? ' com esses filtros' : ''}.</p>}
            </Card>

            <Modal open={filterOpen} onClose={() => setFilterOpen(false)} icon="filter" title="Filtrar campanhas" sub="Refine a lista por canal e status"
              footer={<><Button variant="ghost" onClick={() => { setChannelFilter('all'); setStatusFilter('all') }}>Limpar</Button><Button onClick={() => setFilterOpen(false)}>Aplicar</Button></>}>
              <div className="text-xs font-semibold text-ink-2 mb-2">Canal</div>
              <div className="flex flex-wrap gap-2 mb-4">
                {['all', ...channels].map(c => <button key={c} onClick={() => setChannelFilter(c)} className={pill(channelFilter === c)}>{c === 'all' ? 'Todos' : c}</button>)}
              </div>
              <div className="text-xs font-semibold text-ink-2 mb-2">Status</div>
              <div className="flex flex-wrap gap-2">
                {[['all', 'Todos'], ['vencedora', 'Escalar'], ['atencao', 'Otimizar'], ['critica', 'Revisar']].map(([k, l]) => <button key={k} onClick={() => setStatusFilter(k)} className={pill(statusFilter === k)}>{l}</button>)}
              </div>
            </Modal>

            <Modal open={exportOpen} onClose={() => setExportOpen(false)} icon="download" title="Exportar campanhas" sub="Escolha o formato">
              <div className="grid gap-2.5">
                {[['CSV detalhado', 'layers'], ['PDF executivo', 'doc'], ['Slides para diretoria', 'image']].map(([l, ic]) => (
                  <button key={l} onClick={() => { setExportOpen(false); if (l === 'CSV detalhado') exportCsv(filtered); else window.toast?.({ tone: 'good', title: 'Gerando', body: `${l}…` }) }}
                    className="flex items-center gap-3 p-3.5 rounded-sm border border-line bg-paper hover:border-blue-line transition-colors text-left">
                    <span className="text-blue"><Icon name={ic} size={17} /></span>
                    <span className="flex-1 text-[13.5px] font-semibold text-ink">{l}</span>
                    <Icon name="chevR" size={15} className="text-ink-3" />
                  </button>
                ))}
              </div>
            </Modal>
          </div>
        )
      })()}

      {tab === 'canais' && (
        <div className="space-y-4 animate-fade-up">
          {hasChannelSplit && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {channels.map(c => {
                  const cpl = c.leads > 0 ? Math.round(c.spend / c.leads) : null
                  return (
                    <Card key={c.label} padding="sm" hover>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                        <span className="text-sm font-semibold text-ink truncate">{c.label}</span>
                      </div>
                      <div className="text-[18px] font-bold font-mono text-ink">{brl(c.spend)}</div>
                      <div className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3 mt-0.5">investido</div>
                      <div className="mt-2 pt-2 border-t border-line-2 flex justify-between text-xs">
                        <span className="text-ink-3">Leads</span><span className="font-mono text-ink">{int(c.leads)}</span>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-ink-3">CPL</span><span className="font-mono text-ink">{cpl != null ? brl(cpl) : '—'}</span>
                      </div>
                    </Card>
                  )
                })}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <SectionHead title="Leads por canal" icon={<Icon name="chart" size={17} />} />
                  <BarChart data={channels.map(c => ({ label: c.label.replace(' Ads', ''), value: c.leads, color: c.color }))} height={200} valueFmt={(v) => int(v)} />
                </Card>
                <Card>
                  <SectionHead title="Distribuição de verba" subtitle="Participação no investimento" icon={<Icon name="layers" size={17} />} />
                  <Donut data={channelDonut} centerLabel={int(channels.reduce((s, c) => s + c.leads, 0))} centerSub="leads" />
                </Card>
              </div>
            </>
          )}
        <Card>
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
                  {roiOk(ch.roi_range) && <Badge tone="good">ROI {ch.roi_range}</Badge>}
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
        </div>
      )}

      {tab === 'audiencias' && (
        <div className="space-y-4 animate-fade-up">
          {ta ? (
            <>
              <Card>
                <SectionHead title="Público-alvo" subtitle="Quem converte na sua conta" icon={<Icon name="users" size={17} />} action={<Badge tone="blue" dot>NOUS</Badge>} />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[['Faixa etária', ta.demographics?.age_range], ['Gênero', ta.demographics?.gender], ['Renda', ta.demographics?.income_range], ['Foco de canal', (ta.channel_focus || [])[0]]].map(([l, v]) => (
                    <div key={l as string} className="p-3 rounded-sm bg-canvas-2">
                      <div className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3 mb-1">{l}</div>
                      <div className="text-sm font-semibold text-ink">{(v as string) || '—'}</div>
                    </div>
                  ))}
                </div>
              </Card>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {ta.best_regions?.length > 0 && (
                  <Card>
                    <SectionHead title="Melhores regiões" icon={<Icon name="globe" size={17} />} />
                    <div className="space-y-2">
                      {ta.best_regions.slice(0, 5).map((r: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 p-2.5 rounded-sm bg-canvas-2">
                          <span className="w-5 h-5 rounded-md bg-paper border border-line text-ink font-mono text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                          <span className="text-sm text-ink flex-1">{r.region || r}</span>
                          {r.why && <span className="text-xs text-ink-3 truncate max-w-[50%]">{r.why}</span>}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
                {ta.interests?.length > 0 && (
                  <Card>
                    <SectionHead title="Interesses & afinidades" icon={<Icon name="target" size={17} />} />
                    <div className="flex flex-wrap gap-2">
                      {ta.interests.map((it: string, i: number) => <Badge key={i} tone="blue">{it}</Badge>)}
                    </div>
                    {ta.persona_snapshot?.one_liner && <p className="text-sm text-ink-2 mt-3 leading-relaxed">{ta.persona_snapshot.one_liner}</p>}
                  </Card>
                )}
              </div>
            </>
          ) : (
            <Card><div className="text-center py-8 text-ink-3"><p className="text-sm">Gere a estratégia para ver público-alvo, regiões e interesses.</p><Button variant="soft" size="sm" className="mt-3" onClick={() => (window.location.href = '/plano')}>Ver Plano de Ação</Button></div></Card>
          )}
        </div>
      )}

      {tab === 'criativos' && (
        <div className="space-y-4 animate-fade-up">
          {criativos ? (
            <>
              <Card>
                <SectionHead title="Análise de criativos" subtitle="Diagnóstico do NOUS sobre os anúncios" icon={<Icon name="spark" size={17} />} action={<SourceBadge source={rm ? 'real' : 'ai'} />} />
                <div className="grid md:grid-cols-2 gap-3">
                  {[['Ganchos', criativos.qualidade_ganchos], ['Clareza da oferta', criativos.clareza_oferta], ['Prova social', criativos.prova_social], ['Ângulo', criativos.angulo], ['Teste A/B', criativos.teste_ab], ['Quantidade', criativos.quantidade]].filter(([, v]) => v).map(([l, v]) => (
                    <div key={l as string} className="p-3 rounded-sm bg-canvas-2">
                      <div className="text-[11px] font-semibold text-ink mb-1">{l}</div>
                      <p className="text-xs text-ink-2 leading-relaxed">{v as string}</p>
                    </div>
                  ))}
                </div>
              </Card>
              {criativos.fadiga && (
                <Card className="border-amber/30" >
                  <SectionHead title="Curva de fadiga" subtitle="Risco de saturação criativa" icon={<Icon name="pulse" size={17} />} action={<Badge tone="warn" dot>Atenção</Badge>} />
                  <p className="text-sm text-ink-2 leading-relaxed">{criativos.fadiga}</p>
                </Card>
              )}
              {criativos.problemas?.length > 0 && (
                <Card>
                  <SectionHead title="Problemas que custam dinheiro" icon={<Icon name="alert" size={17} />} />
                  <div className="space-y-2">
                    {criativos.problemas.map((p: string, i: number) => (
                      <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-sm" style={{ background: '#FCEBEA', border: '1px solid #F3CFCC' }}>
                        <span className="text-red shrink-0 mt-0.5">⚠</span><span className="text-sm text-ink-2">{p}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card><div className="text-center py-8 text-ink-3"><p className="text-sm">Rode a Análise Profunda (com Meta conectado) para a análise de criativos.</p><Button variant="soft" size="sm" className="mt-3" onClick={() => (window.location.href = '/diagnostico')}>Rodar Análise Profunda</Button></div></Card>
          )}
        </div>
      )}

      {tab === 'alocador' && (
        <div className="space-y-4 animate-fade-up">
          {ranking.length > 0 && channels.length > 0 ? (() => {
            const totalCur = channels.reduce((s, c) => s + c.spend, 0) || 1
            const totalSug = ranking.reduce((s: number, r: any) => s + (r.budget_brl || 0), 0) || totalCur
            const rows = ranking.map((r: any) => {
              const cur = channels.find(c => c.label.toLowerCase().includes(String(r.channel || '').toLowerCase().split(' ')[0]))?.spend || 0
              const sug = totalSug > 0 ? Math.round((r.budget_brl || 0) / totalSug * totalCur) : cur
              return { channel: r.channel, cur, sug, delta: cur > 0 ? Math.round((sug / cur - 1) * 100) : null }
            })
            const maxV = Math.max(...rows.flatMap((r: any) => [r.cur, r.sug]), 1)
            return (
              <>
                <Card className="bg-gradient-to-br from-blue-soft to-green-soft border-blue-line">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue flex items-center justify-center shrink-0"><span className="text-white text-lg">◎</span></div>
                      <div>
                        <div className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3 mb-1">Alocador de verba · NOUS IA</div>
                        <p className="text-sm text-ink">Realocação sugerida mantendo o mesmo orçamento total ({brl(totalCur)}).</p>
                      </div>
                    </div>
                    <Button onClick={() => window.toast?.({ tone: 'good', title: 'Alocação aplicada', body: 'A sugestão foi registrada no plano de ação.' })}>Aplicar alocação</Button>
                  </div>
                </Card>
                <Card>
                  <SectionHead title="Atual → Sugerido" subtitle="Por canal" icon={<Icon name="layers" size={17} />} />
                  <div className="space-y-4">
                    {rows.map((r: any, i: number) => (
                      <div key={i}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-sm font-medium text-ink flex-1">{r.channel}</span>
                          <span className="font-mono text-xs text-ink-3">{brl(r.cur)} → <span className="text-ink font-semibold">{brl(r.sug)}</span></span>
                          {r.delta != null && r.delta !== 0 && <Badge tone={r.delta > 0 ? 'good' : 'bad'}>{r.delta > 0 ? '↑' : '↓'} {Math.abs(r.delta)}%</Badge>}
                        </div>
                        <div className="relative">
                          <HBar value={r.cur} max={maxV} color="#C7CDD6" h={6} className="mb-1" />
                          <HBar value={r.sug} max={maxV} color={CHART_COLORS.blue} h={6} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4 mt-4 pt-3 border-t border-line-2">
                    <LegendDot color="#C7CDD6">Atual</LegendDot><LegendDot color={CHART_COLORS.blue}>Sugerido pelo NOUS</LegendDot>
                  </div>
                </Card>
              </>
            )
          })() : (
            <Card><div className="text-center py-8 text-ink-3"><p className="text-sm">Gere a estratégia e rode a auditoria para o alocador de verba.</p><Button variant="soft" size="sm" className="mt-3" onClick={() => (window.location.href = '/plano')}>Ver Plano de Ação</Button></div></Card>
          )}
        </div>
      )}

      {tab === 'funil' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-up">
          <Card>
            <SectionHead title="Funil de conversão" subtitle="Da impressão ao lead" icon={<Icon name="funnel" size={17} />}
              action={rm?.totalImpressions && rm?.totalLeads ? <Badge tone="blue">Conv. {((rm.totalLeads / rm.totalImpressions) * 100).toFixed(2)}%</Badge> : undefined} />
            {rm && (rm.totalImpressions || rm.totalClicks || rm.totalLeads) ? (
              <Funnel stages={[
                { label: 'Impressões', value: rm.totalImpressions || 0, color: CHART_COLORS.blue },
                { label: 'Cliques', value: rm.totalClicks || 0, color: CHART_COLORS.teal },
                { label: 'Leads', value: rm.totalLeads || 0, color: CHART_COLORS.green },
              ]} />
            ) : (
              <p className="text-center py-8 text-ink-3 text-sm">Sem dados de funil. Rode a Análise Profunda com dados de campanha.</p>
            )}
          </Card>
          {rm && (rm.totalImpressions || rm.totalClicks || rm.totalLeads) && (
            <Card>
              <SectionHead title="Conversão por etapa" icon={<Icon name="chart" size={17} />} />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-[10.5px] font-mono uppercase tracking-wider text-ink-3">
                      <th className="text-left py-2.5 px-2 font-semibold">Etapa</th>
                      <th className="text-right py-2.5 px-2 font-semibold">Volume</th>
                      <th className="text-right py-2.5 px-2 font-semibold">% topo</th>
                      <th className="text-right py-2.5 px-2 font-semibold">Queda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { stage: 'Impressões', v: rm.totalImpressions || 0 },
                      { stage: 'Cliques', v: rm.totalClicks || 0 },
                      { stage: 'Leads', v: rm.totalLeads || 0 },
                    ].map((s, i, arr) => {
                      const top = arr[0].v || 1
                      const drop = i > 0 && arr[i - 1].v > 0 ? Math.round((1 - s.v / arr[i - 1].v) * 100) : null
                      return (
                        <tr key={s.stage} className="border-b border-line-2">
                          <td className="py-2.5 px-2 text-ink font-medium">{s.stage}</td>
                          <td className="py-2.5 px-2 text-right font-mono text-ink">{int(s.v)}</td>
                          <td className="py-2.5 px-2 text-right font-mono text-ink-2">{(() => { const p = (s.v / top) * 100; return p >= 1 || p === 0 ? Math.round(p) : p.toFixed(2) })()}%</td>
                          <td className="py-2.5 px-2 text-right font-mono text-red">{drop != null ? `−${drop}%` : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
