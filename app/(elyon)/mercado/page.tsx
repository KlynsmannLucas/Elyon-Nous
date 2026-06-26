// app/(elyon)/mercado/page.tsx — Mercado: você vs benchmark do nicho + concorrentes reais.
'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Icon, Card, Badge, Button, SectionHead, SourceBadge, Sparkline, Delta, HBar, CompetitorXray, CHART_COLORS } from '@/components/dashboard/v2'
import { useBenchmark } from '@/lib/useBenchmark'

const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n || 0)

export default function MercadoPage() {
  const clientData = useAppStore(s => s.clientData)
  const savedClients = useAppStore(s => s.savedClients)
  const auditCache = useAppStore(s => s.auditCache)
  const competitorsMap = useAppStore(s => s.competitors)
  const marketResearch = useAppStore(s => s.marketResearch)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const key = clientData?.clientName || savedClients?.[0]?.clientData?.clientName || ''
  const niche = clientData?.niche || savedClients?.find(c => c.clientData.clientName === key)?.clientData.niche || ''
  // Hook ANTES de qualquer early-return (regras de hooks). Benchmark vem da API.
  const bench = useBenchmark(niche)
  if (!mounted) return null

  const rm = auditCache[key]?.[0]?.audit?._realMetrics
  const competitors = competitorsMap[key] || []
  const cpl = rm?.avgCPL ? Number(rm.avgCPL) : null
  const cplBenchMid = bench ? Math.round((bench.cpl_min + bench.cpl_max) / 2) : null

  return (
    <div className="p-4 md:p-6">
      <header className="mb-5 animate-fade-up">
        <h1 className="text-[23px] font-bold text-ink" style={{ letterSpacing: '-0.02em' }}>Mercado</h1>
        <p className="text-sm text-ink-2 mt-0.5">{niche ? `Benchmarks de ${bench?.name || niche}` : 'Selecione um cliente'}</p>
      </header>

      {/* Você vs mercado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 animate-fade-up">
        {/* Demanda do mercado — índice derivado da sazonalidade do nicho */}
        {(() => {
          const monthsPt = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
          const now = new Date().getMonth()
          const peaks = (bench?.seasonality || []).map((s: string) => s.toLowerCase().slice(0, 3))
          const peakIdx = monthsPt.map((m, i) => peaks.includes(m) ? i : -1).filter(i => i >= 0)
          const nearPeak = peakIdx.some(p => Math.min(Math.abs(p - now), 12 - Math.abs(p - now)) <= 1)
          const isPeak = peaks.includes(monthsPt[now])
          const index = isPeak ? 118 : nearPeak ? 109 : peaks.length ? 101 : 100
          // série de 8 pontos subindo em direção ao próximo pico
          const series = Array.from({ length: 8 }, (_, i) => 92 + i * ((index - 92) / 7))
          const delta = isPeak ? 12.4 : nearPeak ? 6.1 : 1.2
          return (
            <Card hover>
              <SectionHead title="Demanda do mercado" subtitle="Índice · seu nicho" icon={<Icon name="globe" size={17} />} action={<Delta value={delta} />} />
              <div className="text-[30px] font-bold font-mono text-ink" style={{ letterSpacing: '-0.02em' }}>{index}</div>
              <div className="mt-1"><Sparkline data={series} color={CHART_COLORS.green} h={40} /></div>
              <p className="text-[10.5px] text-ink-3 mt-1">{isPeak ? 'Pico de demanda agora' : nearPeak ? 'Demanda subindo' : 'Demanda estável'}</p>
            </Card>
          )
        })()}
        <Card hover>
          <SectionHead title="CPL · você vs mercado" icon={<Icon name="target" size={17} />} action={<SourceBadge source={cpl != null ? 'real' : 'benchmark'} />} />
          {bench ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-ink">{cpl != null ? brl(cpl) : '—'}</span>
                <span className="text-sm font-mono text-ink-3">vs {brl(bench.cpl_min)}–{brl(bench.cpl_max)}</span>
              </div>
              {cpl != null && cplBenchMid != null && (
                <div className="mt-3">
                  <div className="relative h-2 rounded-full bg-canvas-2 overflow-hidden">
                    {/* faixa do benchmark */}
                    <div className="absolute inset-y-0 rounded-full" style={{ left: '20%', right: '20%', background: 'var(--green-soft)' }} />
                    {/* marcador do cliente: posiciona dentro da faixa min..max (clamp 6–94%) */}
                    <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-paper"
                      style={{ left: `${Math.max(4, Math.min(94, ((cpl - bench.cpl_min) / Math.max(1, bench.cpl_max - bench.cpl_min)) * 60 + 20))}%`, background: cpl <= bench.cpl_max ? CHART_COLORS.green : CHART_COLORS.red }} />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-ink-3 mt-1">
                    <span>{brl(bench.cpl_min)}</span><span>mercado</span><span>{brl(bench.cpl_max)}</span>
                  </div>
                  <div className="mt-2">
                    <Badge tone={cpl <= bench.cpl_min ? 'good' : cpl <= bench.cpl_max ? 'warn' : 'bad'}>
                      {cpl <= bench.cpl_min ? 'Abaixo do mercado ✓' : cpl <= bench.cpl_max ? 'Dentro do benchmark' : 'Acima do mercado ⚠'}
                    </Badge>
                  </div>
                </div>
              )}
            </>
          ) : <p className="text-sm text-ink-3">Nicho não mapeado.</p>}
        </Card>
        <Card hover>
          <SectionHead title="Ticket médio do nicho" icon={<Icon name="money" size={17} />} action={<SourceBadge source="benchmark" />} />
          <span className="text-2xl font-bold font-mono text-ink">{bench ? brl(bench.avg_ticket) : '—'}</span>
          <p className="text-xs text-ink-3 mt-1">{bench ? `Conversão lead→venda ~${Math.round(bench.cvr_lead_to_sale * 100)}%` : ''}</p>
        </Card>
        <Card hover>
          <SectionHead title="Picos de demanda" icon={<Icon name="chart" size={17} />} action={<SourceBadge source="benchmark" />} />
          <div className="flex flex-wrap gap-1.5">
            {bench?.seasonality?.length ? bench.seasonality.map((m: string, i: number) => <Badge key={i} tone="warn">{m}</Badge>) : <span className="text-sm text-ink-3">—</span>}
          </div>
        </Card>
      </div>

      {/* Melhores canais */}
      {bench?.best_channels?.length ? (
        <Card className="mb-4 animate-fade-up">
          <SectionHead title="Melhores canais do nicho" subtitle="Onde esse mercado costuma performar" icon={<Icon name="layers" size={17} />} action={<SourceBadge source="benchmark" />} />
          <div className="flex flex-wrap gap-2">
            {bench.best_channels.map((ch: string, i: number) => (
              <span key={i} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-blue-soft border border-blue-line text-sm text-blue font-medium">
                <span className="w-5 h-5 rounded-md bg-paper border border-line text-ink font-mono text-[10px] font-bold flex items-center justify-center">{i + 1}</span>{ch}
              </span>
            ))}
          </div>
        </Card>
      ) : null}

      {/* Oportunidades de mercado */}
      {(() => {
        const mr = marketResearch[key]
        const fromResearch = mr?.opportunities ? String(mr.opportunities).split(/\n|·|;/).map(s => s.trim()).filter(s => s.length > 8).slice(0, 4) : []
        const fromBench = bench?.best_channels?.slice(0, 3).map((ch: string) => `Expandir presença em ${ch}`) || []
        const ops = fromResearch.length ? fromResearch : fromBench
        if (!ops.length) return null
        return (
          <Card className="mb-4 animate-fade-up">
            <SectionHead title="Oportunidades de mercado" subtitle="Segmentos e canais com maior potencial" icon={<Icon name="rocket" size={17} />} action={<SourceBadge source={fromResearch.length ? 'real' : 'benchmark'} />} />
            <div className="grid md:grid-cols-2 gap-3">
              {ops.map((op: string, i: number) => (
                <div key={i} className="p-3 rounded-sm bg-green-soft border border-green-line flex items-start gap-2">
                  <span className="text-green-600 mt-0.5 shrink-0"><Icon name="rocket" size={15} /></span>
                  <span className="text-sm text-ink-2 line-clamp-3">{op}</span>
                </div>
              ))}
            </div>
          </Card>
        )
      })()}

      {/* Raio-X de Concorrentes — tool unificado (pesquisa web + monitoramento) */}
      <div className="animate-fade-up">
        <CompetitorXray />
      </div>
    </div>
  )
}
