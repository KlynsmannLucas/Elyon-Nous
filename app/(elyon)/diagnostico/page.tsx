// app/(elyon)/diagnostico/page.tsx — Diagnóstico com a AUDITORIA REAL.
'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Icon, Card, Badge, Button, SectionHead, Delta, SourceBadge, Gauge, Radar, CHART_COLORS } from '@/components/dashboard/v2'
import CrossCheckPanel from '@/components/dashboard/CrossCheckPanel'
import { getBenchmark } from '@/lib/niche_benchmarks'

// Maturidade por pilar derivada de sinais reais (CPL/CTR/conversão/tracking/volume).
function deriveMaturity(rm: any, bench: any, trackOkRatio: number, health: number | null) {
  const clamp = (n: number) => Math.max(20, Math.min(98, Math.round(n)))
  const ctr = rm?.avgCTR ? Number(rm.avgCTR) : null
  const cpl = rm?.avgCPL ? Number(rm.avgCPL) : null
  const cvr = rm?.totalClicks > 0 ? (rm.totalLeads / rm.totalClicks) : null
  const leads = rm?.totalLeads || 0
  const ef = cpl != null && bench ? (cpl <= bench.cpl_min ? 92 : cpl <= bench.cpl_max ? 72 : 48) : (health ?? 60)
  const cr = ctr != null ? (ctr >= 2 ? 86 : ctr >= 1 ? 66 : 46) : (health ?? 60)
  const cv = cvr != null ? (cvr >= 0.05 ? 86 : cvr >= 0.02 ? 66 : 46) : (health ?? 55)
  const dq = trackOkRatio != null ? clamp(40 + trackOkRatio * 58) : (health ?? 60)
  const aq = leads >= 1000 ? 86 : leads >= 300 ? 72 : leads >= 50 ? 56 : 42
  const rt = health ?? 60
  return {
    axes: ['Aquisição', 'Conversão', 'Retenção', 'Eficiência', 'Criativos', 'Dados & IA'],
    you: [aq, cv, rt, ef, cr, dq].map(clamp),
    sector: [70, 68, 66, 70, 65, 60],
  }
}

const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n || 0)
type SubTab = 'visao' | 'auditoria'

export default function DiagnosticoPage() {
  const clientData = useAppStore(s => s.clientData)
  const savedClients = useAppStore(s => s.savedClients)
  const auditCache = useAppStore(s => s.auditCache)
  const clientHealthScores = useAppStore(s => s.clientHealthScores)
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState<SubTab>('visao')
  const [running, setRunning] = useState(false)
  const [step, setStep] = useState('')
  const [runErr, setRunErr] = useState('')
  useEffect(() => { setMounted(true) }, [])

  const key = clientData?.clientName || savedClients?.[0]?.clientData?.clientName || ''

  const run = async () => {
    setRunning(true); setRunErr('')
    const { runAuditForActiveClient } = await import('@/lib/runAudit')
    const r = await runAuditForActiveClient({ onStep: setStep })
    setRunning(false); setStep('')
    if (!r.ok) setRunErr(r.error || 'Falha na auditoria.')
  }

  if (!mounted) return null

  if (running) return (
    <div className="p-4 md:p-6 min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-blue-soft flex items-center justify-center mx-auto mb-4 animate-pulse"><span className="text-blue text-2xl">🔬</span></div>
        <p className="text-ink font-semibold">Rodando Análise Profunda…</p>
        <p className="text-sm text-ink-3 mt-1">{step || 'Isso pode levar até 1 minuto.'}</p>
      </div>
    </div>
  )

  const audit: any = key ? auditCache[key]?.[0]?.audit : null

  if (!key || !audit) return (
    <div className="p-4 md:p-6">
      <Card className="max-w-xl mx-auto mt-12">
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-blue-soft flex items-center justify-center mx-auto mb-4"><span className="text-blue text-2xl">🔬</span></div>
          <h2 className="text-lg font-semibold text-ink mb-2">{key ? 'Diagnóstico ainda não gerado' : 'Selecione um cliente'}</h2>
          <p className="text-sm text-ink-2 mb-4">{key ? 'Rode a Análise Profunda para receber score de saúde, gargalos, oportunidades e desperdício — com os dados reais da conta conectada.' : 'Escolha um cliente no topo para diagnosticar.'}</p>
          {key
            ? <Button onClick={run}>Rodar Análise Profunda</Button>
            : <Button onClick={() => (window.location.href = '/dashboard?new=1')}>Criar cliente</Button>}
          {runErr && <div className="text-xs text-red mt-3">{runErr}</div>}
        </div>
      </Card>
    </div>
  )

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
  const rm = audit._realMetrics
  const niche = clientData?.niche || savedClients?.find(c => c.clientData.clientName === key)?.clientData.niche || ''
  const bench = niche ? getBenchmark(niche) : null
  const trackOkRatio = tracking.length > 0 ? tv / tracking.length : 0.6
  const maturity = deriveMaturity(rm, bench, trackOkRatio, score)

  const tabs: { key: SubTab; label: string }[] = [
    { key: 'visao', label: 'Visão geral' }, { key: 'auditoria', label: 'Auditoria profunda' },
  ]

  return (
    <div className="p-4 md:p-6">
      <header className="mb-5 flex items-start justify-between gap-3 flex-wrap animate-fade-up">
        <div>
          <h1 className="text-[23px] font-bold text-ink" style={{ letterSpacing: '-0.02em' }}>Diagnóstico</h1>
          <p className="text-sm text-ink-2 mt-0.5">{key}{audit._period ? ` · ${audit._period}` : ''}</p>
        </div>
        <Button size="sm" variant="soft" onClick={run}>↻ Atualizar auditoria</Button>
      </header>
      {runErr && <div className="text-xs text-red mb-3">{runErr}</div>}

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
              <SectionHead title="Saúde da conta" icon={<Icon name="pulse" size={17} />} action={<SourceBadge source={hs?.source === 'ai' ? 'ai' : 'real'} />} />
              <div className="flex items-center gap-5">
                <Gauge value={score ?? 0} label={score == null ? '—' : undefined} size={104} sub="saúde" color={scColor} />
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

          {/* Maturidade por pilar (radar) */}
          <Card>
            <SectionHead title="Maturidade por pilar" subtitle="Sua operação × benchmark do setor" icon={<Icon name="pulse" size={17} />} action={<SourceBadge source={rm ? 'real' : 'ai'} />} />
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-full max-w-[300px] mx-auto">
                <Radar axes={maturity.axes}
                  series={[
                    { name: 'Setor', color: CHART_COLORS.slate, values: maturity.sector, dashed: true },
                    { name: 'Você', color: CHART_COLORS.blue, values: maturity.you },
                  ]} />
              </div>
              <div className="flex-1 w-full grid grid-cols-2 gap-2.5">
                {maturity.axes.map((a, i) => (
                  <div key={a} className="p-2.5 rounded-sm bg-canvas-2">
                    <div className="text-[11px] text-ink-3">{a}</div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-bold font-mono text-ink">{maturity.you[i]}</span>
                      <span className="text-[10px] font-mono text-ink-3">/ setor {maturity.sector[i]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Gargalos */}
          {gargalos.length > 0 && (
            <Card>
              <SectionHead title="Maiores gargalos" subtitle="O que está travando o crescimento" icon={<Icon name="alert" size={17} />} />
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
              <SectionHead title="Oportunidades de escala" icon={<Icon name="rocket" size={17} />} />
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
          {/* Nota + dimensões derivadas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <SectionHead title="Notas por dimensão" subtitle="Derivado dos sinais reais da conta" icon={<Icon name="grid" size={17} />} action={<SourceBadge source={rm ? 'real' : 'ai'} />} />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                {maturity.axes.map((a, i) => {
                  const v = maturity.you[i]
                  const tone = v >= 75 ? CHART_COLORS.green : v >= 55 ? CHART_COLORS.amber : CHART_COLORS.red
                  const bg = v >= 75 ? '#E4F6EE' : v >= 55 ? '#FCF1DC' : '#FCEBEA'
                  return (
                    <div key={a} className="p-3 rounded-sm" style={{ background: bg }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-ink truncate">{a}</span>
                        <span className="text-sm font-bold font-mono" style={{ color: tone }}>{v}</span>
                      </div>
                      <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,.06)' }}>
                        <div className="h-full rounded-full" style={{ width: `${v}%`, background: tone }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
            <Card className="flex flex-col items-center justify-center text-center">
              <div className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3 mb-3">Nota da auditoria</div>
              <Gauge value={score ?? 0} label={grade} size={128} sub={score != null ? `score ${score}/100` : undefined} color={scColor} />
              {ev?.scoreDelta != null && ev.scoreDelta !== 0 && <div className="mt-3"><Delta value={ev.scoreDelta} suffix=" pts vs anterior" /></div>}
            </Card>
          </div>

          {/* Desperdício */}
          {waste.length > 0 && (
            <Card>
              <SectionHead title="Desperdício de verba" subtitle={`${audit._wastePercent ?? 0}% do investimento · sem conversão`} icon={<Icon name="money" size={17} />}
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
              <SectionHead title="Checklist de tracking" subtitle="Confiabilidade dos dados de conversão" icon={<Icon name="check" size={17} />} />
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
