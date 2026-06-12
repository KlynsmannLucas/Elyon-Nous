// app/(elyon)/desempenho/page.tsx — Desempenho com DADOS REAIS (auditoria + estratégia).
'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Icon, Card, Badge, Button, SectionHead, Donut, BarChart, Funnel, CHART_COLORS } from '@/components/dashboard/v2'

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

  // Split por canal derivado das campanhas reais (quando a plataforma é conhecida).
  const chMap = new Map<string, { label: string; color: string; spend: number; leads: number }>()
  for (const c of camps) {
    const ch = channelOf(c)
    const e = chMap.get(ch.label) || { label: ch.label, color: ch.color, spend: 0, leads: 0 }
    e.spend += c.spend || 0; e.leads += c.leads || 0
    chMap.set(ch.label, e)
  }
  const channels = [...chMap.values()].sort((a, b) => b.spend - a.spend)
  const hasChannelSplit = channels.length >= 2 && !(channels.length === 1)
  const channelDonut = channels.map(c => ({ label: c.label, value: c.spend, color: c.color }))

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

      {tab === 'campanhas' && (
        <Card className="animate-fade-up">
          <SectionHead title="Todas as campanhas" subtitle={`${camps.length} campanhas`} icon={<Icon name="megaphone" size={17} />} />
          {camps.length > 0 ? <CampTable rows={camps} /> : <p className="text-center py-8 text-ink-3 text-sm">Nenhuma campanha.</p>}
        </Card>
      )}

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
                          <td className="py-2.5 px-2 text-right font-mono text-ink-2">{Math.round((s.v / top) * 100)}%</td>
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
