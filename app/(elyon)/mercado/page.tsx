// app/(elyon)/mercado/page.tsx — Mercado: você vs benchmark do nicho + concorrentes reais.
'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, Badge, Button, SectionHead, SourceBadge } from '@/components/dashboard/v2'
import { getBenchmark } from '@/lib/niche_benchmarks'

const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n || 0)

export default function MercadoPage() {
  const clientData = useAppStore(s => s.clientData)
  const savedClients = useAppStore(s => s.savedClients)
  const auditCache = useAppStore(s => s.auditCache)
  const competitorsMap = useAppStore(s => s.competitors)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const key = clientData?.clientName || savedClients?.[0]?.clientData?.clientName || ''
  const niche = clientData?.niche || savedClients?.find(c => c.clientData.clientName === key)?.clientData.niche || ''
  if (!mounted) return null

  const bench = niche ? getBenchmark(niche) : null
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 animate-fade-up">
        <Card hover>
          <SectionHead title="CPL · você vs mercado" icon={<span>🎯</span>} action={<SourceBadge source={cpl != null ? 'real' : 'benchmark'} />} />
          {bench ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-ink">{cpl != null ? brl(cpl) : '—'}</span>
                <span className="text-sm font-mono text-ink-3">vs {brl(bench.cpl_min)}–{brl(bench.cpl_max)}</span>
              </div>
              {cpl != null && cplBenchMid != null && (
                <div className="mt-2">
                  <Badge tone={cpl <= bench.cpl_min ? 'good' : cpl <= bench.cpl_max ? 'warn' : 'bad'}>
                    {cpl <= bench.cpl_min ? 'Abaixo do mercado ✓' : cpl <= bench.cpl_max ? 'Dentro do benchmark' : 'Acima do mercado ⚠'}
                  </Badge>
                </div>
              )}
            </>
          ) : <p className="text-sm text-ink-3">Nicho não mapeado.</p>}
        </Card>
        <Card hover>
          <SectionHead title="Ticket médio do nicho" icon={<span>💰</span>} action={<SourceBadge source="benchmark" />} />
          <span className="text-2xl font-bold font-mono text-ink">{bench ? brl(bench.avg_ticket) : '—'}</span>
          <p className="text-xs text-ink-3 mt-1">{bench ? `Conversão lead→venda ~${Math.round(bench.cvr_lead_to_sale * 100)}%` : ''}</p>
        </Card>
        <Card hover>
          <SectionHead title="Picos de demanda" icon={<span>📈</span>} action={<SourceBadge source="benchmark" />} />
          <div className="flex flex-wrap gap-1.5">
            {bench?.seasonality?.length ? bench.seasonality.map((m: string, i: number) => <Badge key={i} tone="warn">{m}</Badge>) : <span className="text-sm text-ink-3">—</span>}
          </div>
        </Card>
      </div>

      {/* Melhores canais */}
      {bench?.best_channels?.length ? (
        <Card className="mb-4 animate-fade-up">
          <SectionHead title="Melhores canais do nicho" subtitle="Onde esse mercado costuma performar" icon={<span>🧩</span>} action={<SourceBadge source="benchmark" />} />
          <div className="flex flex-wrap gap-2">
            {bench.best_channels.map((ch: string, i: number) => (
              <span key={i} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-blue-soft border border-blue-line text-sm text-blue font-medium">
                <span className="w-5 h-5 rounded-md bg-paper border border-line text-ink font-mono text-[10px] font-bold flex items-center justify-center">{i + 1}</span>{ch}
              </span>
            ))}
          </div>
        </Card>
      ) : null}

      {/* Concorrentes */}
      <Card className="animate-fade-up">
        <SectionHead title="Concorrentes" subtitle={competitors.length ? `${competitors.length} analisados` : 'Análise da concorrência'} icon={<span>🏁</span>}
          action={<SourceBadge source="real" />} />
        {competitors.length > 0 ? (
          <div className="space-y-3">
            {competitors.map((c) => (
              <div key={c.id} className="p-3 rounded-sm bg-canvas-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-ink">{c.name}</span>
                  {c.ads?.length ? <Badge tone="neutral">{c.ads.length} anúncios</Badge> : null}
                </div>
                {c.analysis?.positioning && <p className="text-xs text-ink-2 mt-1.5 line-clamp-2"><b className="text-ink">Posicionamento:</b> {c.analysis.positioning}</p>}
                {c.analysis?.mainOffer && <p className="text-xs text-ink-2 mt-1 line-clamp-1"><b className="text-ink">Oferta:</b> {c.analysis.mainOffer}</p>}
                {c.analysis?.differentiation && <p className="text-xs text-green-600 mt-1 line-clamp-2">↳ {c.analysis.differentiation}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-ink-3">
            <p className="text-sm">Nenhum concorrente analisado ainda.</p>
            <Button variant="soft" size="sm" className="mt-3" onClick={() => (window.location.href = '/dashboard?view=concorrentes')}>Analisar concorrentes</Button>
          </div>
        )}
      </Card>
    </div>
  )
}
