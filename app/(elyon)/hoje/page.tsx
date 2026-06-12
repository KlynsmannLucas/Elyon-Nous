// app/(elyon)/hoje/page.tsx — Tela "Hoje" (home diária) com DADOS REAIS do store.
'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Icon, Card, Badge, Button, SectionHead, Delta, SourceBadge, Gauge, Sparkline, CHART_COLORS } from '@/components/dashboard/v2'

const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n || 0)
const int = (n: number) => new Intl.NumberFormat('pt-BR').format(n || 0)

const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite' }
const today = () => new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

const URGENCY_TONE: Record<string, 'bad' | 'warn' | 'neutral'> = { critica: 'bad', alta: 'warn', media: 'neutral', baixa: 'neutral' }
const URGENCY_ORDER: Record<string, number> = { critica: 0, alta: 1, media: 2, baixa: 3 }

function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-blue-soft flex items-center justify-center mx-auto mb-4 animate-pulse"><span className="text-blue text-2xl">◎</span></div>
        <p className="text-ink-2">Carregando…</p>
      </div>
    </div>
  )
}

function Empty() {
  return (
    <div className="p-4 md:p-6">
      <Card className="bg-gradient-to-br from-blue-soft to-green-soft border-blue-line">
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-blue flex items-center justify-center mx-auto mb-4"><span className="text-white text-2xl">+</span></div>
          <h2 className="text-lg font-semibold text-ink mb-2">Bem-vindo ao Elyon</h2>
          <p className="text-sm text-ink-2 mb-4">Selecione um cliente ou crie o primeiro para ver seu painel.</p>
          <Button onClick={() => (window.location.href = '/dashboard?new=1')}>Criar primeiro cliente</Button>
        </div>
      </Card>
    </div>
  )
}

export default function HojePage() {
  const clientData = useAppStore(s => s.clientData)
  const savedClients = useAppStore(s => s.savedClients)
  const auditCache = useAppStore(s => s.auditCache)
  const clientHealthScores = useAppStore(s => s.clientHealthScores)
  const pendingActionsCache = useAppStore(s => s.pendingActionsCache)
  const strategyData = useAppStore(s => s.strategyData)
  const dashboardMode = useAppStore(s => s.dashboardMode)
  const connectedAccounts = useAppStore(s => s.connectedAccounts)
  const selectedMetaAccountByClient = useAppStore(s => s.selectedMetaAccountByClient)

  const [mounted, setMounted] = useState(false)
  const [daily, setDaily] = useState<any>(null)
  useEffect(() => { setMounted(true) }, [])

  const key = clientData?.clientName || savedClients?.[0]?.clientData?.clientName || ''
  const pro = dashboardMode === 'pro'

  const metaAccount = connectedAccounts.find(a => a.platform === 'meta')
  const dailyAccountId = selectedMetaAccountByClient[key] || metaAccount?.accountId
  useEffect(() => {
    if (!key || !metaAccount) { setDaily(null); return }
    let active = true
    fetch(`/api/metrics/daily${dailyAccountId ? `?accountId=${encodeURIComponent(dailyAccountId)}` : ''}`)
      .then(r => r.ok ? r.json() : { delta: null }).then(d => { if (active) setDaily(d?.delta ?? null) }).catch(() => { if (active) setDaily(null) })
    return () => { active = false }
  }, [key, dailyAccountId, metaAccount])

  if (!mounted) return <Loading />
  if (!key) return <Empty />

  const latestAudit: any = auditCache[key]?.[0]?.audit
  const rm = latestAudit?._realMetrics
  const prev = latestAudit?._previousTotals
  const ev = latestAudit?._evolution
  const hs = clientHealthScores[key]
  const score: number | null = hs?.score ?? latestAudit?.health_score ?? null
  const grade: string = hs?.grade ?? latestAudit?.grade ?? '—'
  const scColor = score == null ? '#8A93A3' : score >= 70 ? '#0E9E6E' : score >= 50 ? '#E08B0B' : '#E1483F'

  // Série honesta de 2 pontos (período anterior → atual), reconstruída do delta real.
  const spark = (cur: number, deltaPct: number | null | undefined): number[] | null => {
    if (cur == null || deltaPct == null || deltaPct === 0) return null
    const prevVal = cur / (1 + deltaPct / 100)
    return [prevVal, cur]
  }
  const kpis = rm ? [
    { label: 'Investimento', value: brl(rm.totalSpend), trend: prev?.spendDelta ?? null, inverse: false, series: spark(rm.totalSpend, prev?.spendDelta), up: (prev?.spendDelta ?? 0) >= 0 },
    { label: 'Leads', value: int(rm.totalLeads), trend: prev?.leadsDelta ?? null, inverse: false, series: spark(rm.totalLeads, prev?.leadsDelta), up: (prev?.leadsDelta ?? 0) >= 0 },
    { label: 'ROAS', value: rm.avgROAS ? `${rm.avgROAS}x` : '—', trend: null, inverse: false, series: null, up: true },
    { label: 'CPL', value: rm.avgCPL ? brl(rm.avgCPL) : '—', trend: prev?.cplDelta ?? null, inverse: true, series: spark(rm.avgCPL, prev?.cplDelta), up: (prev?.cplDelta ?? 0) <= 0 },
    { label: 'CTR', value: rm.avgCTR ? `${rm.avgCTR}%` : '—', trend: null, inverse: false, series: null, up: true },
  ].slice(0, pro ? 5 : 4) : []

  const actions = (pendingActionsCache[key] || [])
    .filter(a => a.status === 'pendente')
    .sort((a, b) => (URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency]) || (a.priority - b.priority))
    .slice(0, pro ? 5 : 3)

  const alerts: { titulo: string; motivo?: string; tone: 'bad' | 'warn' }[] =
    (latestAudit?.o_que_eu_faria_agora || [])
      .filter((a: any) => a?.titulo)
      .slice(0, 3)
      .map((a: any) => ({ titulo: a.titulo, motivo: a.motivo || a.evidencia, tone: a.prioridade === 'P1' ? 'bad' as const : 'warn' as const }))

  const briefing = latestAudit?.executive_summary || strategyData?.strategy?.growth_thesis
    || (rm ? `Conta com ${brl(rm.totalSpend)} investidos e ${int(rm.totalLeads)} leads.${ev?.cplDelta != null ? ` CPL ${ev.cplDelta > 0 ? 'subiu' : 'caiu'} ${Math.abs(ev.cplDelta)}% vs a auditoria anterior.` : ''}` : 'Rode a Análise Profunda para receber um briefing com base nos dados reais da conta.')

  const changes: { text: string; sub: string; tone: 'good' | 'bad' | 'warn' }[] = []
  if (pro) {
    if (ev?.scoreDelta) changes.push({ text: `Score ${ev.scoreDelta > 0 ? 'subiu' : 'caiu'} ${Math.abs(ev.scoreDelta)} pts`, sub: 'vs última auditoria', tone: ev.scoreDelta > 0 ? 'good' : 'bad' })
    if (daily?.cplPct != null && daily.cplPct !== 0) changes.push({ text: `CPL ${daily.cplPct > 0 ? '+' : ''}${daily.cplPct}%`, sub: 'vs ontem', tone: daily.cplPct > 0 ? 'bad' : 'good' })
    if (daily?.leadsPct != null && daily.leadsPct !== 0) changes.push({ text: `Leads ${daily.leadsPct > 0 ? '+' : ''}${daily.leadsPct}%`, sub: 'vs ontem', tone: daily.leadsPct > 0 ? 'good' : 'warn' })
  }

  return (
    <div className="p-4 md:p-6">
      <header className="mb-6 animate-fade-up">
        <h1 className="text-[23px] font-bold text-ink" style={{ letterSpacing: '-0.02em' }}>{greeting()}{key ? `, ${key.split(' ')[0]}` : ''}</h1>
        <p className="text-sm text-ink-2 mt-0.5 capitalize">{today()}</p>
      </header>

      {/* Briefing Hero */}
      <section className="mb-6 animate-fade-up">
        <Card className="bg-gradient-to-br from-blue-soft to-green-soft border-blue-line">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blue flex items-center justify-center shrink-0"><span className="text-white text-xl">◎</span></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3">Briefing do NOUS · hoje</span>
                <SourceBadge source={rm ? 'real' : 'benchmark'} />
              </div>
              <p className="text-sm text-ink-2 mb-3 line-clamp-3">{briefing}</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => (window.location.href = '/plano')}>Ver meu plano de hoje</Button>
                {!rm && <Button size="sm" variant="soft" onClick={() => (window.location.href = '/diagnostico')}>Rodar Análise Profunda</Button>}
              </div>
              {changes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-line">
                  {changes.map((c, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-pill bg-paper border border-line">
                      <span style={{ color: c.tone === 'good' ? '#0E9E6E' : c.tone === 'bad' ? '#E1483F' : '#E08B0B' }}>{c.tone === 'good' ? '↑' : c.tone === 'bad' ? '↓' : '⚑'}</span>
                      <span className="font-medium text-ink">{c.text}</span><span className="text-ink-3">· {c.sub}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </section>

      {/* KPIs */}
      {kpis.length > 0 && (
        <section className="mb-6 animate-fade-up">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {kpis.map(kpi => (
              <Card key={kpi.label} padding="sm" hover>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3">{kpi.label}</span>
                  {kpi.trend != null && kpi.trend !== 0 && <Delta value={kpi.trend} inverse={kpi.inverse} />}
                </div>
                <span className="text-[20px] font-bold font-mono text-ink block" style={{ letterSpacing: '-0.02em' }}>{kpi.value}</span>
                {kpi.series && <div className="mt-2"><Sparkline data={kpi.series} h={28} color={kpi.up ? CHART_COLORS.green : CHART_COLORS.red} /></div>}
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-up">
        <div className="lg:col-span-2 space-y-4">
          {/* Health */}
          <Card>
            <SectionHead title="Saúde do negócio" subtitle="Índice geral da conta" icon={<Icon name="pulse" size={18} />}
              action={<SourceBadge source={hs?.source === 'ai' ? 'ai' : rm ? 'real' : 'benchmark'} />} />
            {score != null ? (
              <div className="flex items-center gap-6">
                <Gauge value={score} size={108} sub="saúde" color={scColor} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold" style={{ color: scColor }}>{grade}</span>
                    {ev?.scoreDelta != null && ev.scoreDelta !== 0 && <Delta value={ev.scoreDelta} suffix=" pts" />}
                  </div>
                  <p className="text-xs text-ink-3 mt-1">{score >= 80 ? 'Conta saudável, acima da média.' : score >= 60 ? 'Oportunidades de melhoria identificadas.' : 'Atenção: gargalos limitando resultados.'}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-ink-3">
                <p className="text-sm">Rode a Análise Profunda para calcular a saúde da conta.</p>
                <Button variant="soft" size="sm" className="mt-3" onClick={() => (window.location.href = '/diagnostico')}>Calcular saúde</Button>
              </div>
            )}
          </Card>

          {/* Priority actions */}
          <Card>
            <SectionHead title={pro ? 'Ações prioritárias' : 'O que fazer agora'} subtitle={actions.length ? `${actions.length} priorizadas pelo NOUS` : undefined} icon={<Icon name="target" size={18} />} />
            {actions.length > 0 ? (
              <div className="divide-y divide-line-2">
                {actions.map((a, i) => (
                  <div key={a.id} className="flex items-start gap-3 py-3">
                    <span className="w-7 h-7 rounded-md bg-canvas-2 text-ink font-mono text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-ink">{a.title}</span>
                        <Badge tone={URGENCY_TONE[a.urgency]} dot>{a.urgency}</Badge>
                      </div>
                      {(a.impact || a.evidence) && <p className="text-xs text-ink-3 mt-1 line-clamp-2">{a.impact || a.evidence}</p>}
                    </div>
                    <Button size="sm" variant="soft" onClick={() => (window.location.href = '/plano')}>Ver</Button>
                  </div>
                ))}
                <Button variant="ghost" className="mt-3 w-full" onClick={() => (window.location.href = '/plano')}>Abrir plano de ação completo</Button>
              </div>
            ) : (
              <div className="text-center py-6 text-ink-3">
                <p className="text-sm">Nenhuma ação pendente.</p>
                <Button variant="ghost" size="sm" className="mt-3" onClick={() => (window.location.href = '/plano')}>Ver plano de ação</Button>
              </div>
            )}
          </Card>
        </div>

        {/* Alerts */}
        <div className="space-y-4">
          <Card>
            <SectionHead title="Alertas" subtitle="O que precisa de atenção" icon={<Icon name="bell" size={18} />}
              action={alerts.length ? <Badge tone="bad" dot>{alerts.length}</Badge> : undefined} />
            {alerts.length > 0 ? (
              <div className="space-y-2.5">
                {alerts.map((al, i) => (
                  <div key={i} className="flex gap-2.5 p-3 rounded-sm" style={{ background: al.tone === 'bad' ? '#FCEBEA' : '#FCF1DC', border: `1px solid ${al.tone === 'bad' ? '#F3CFCC' : '#F2DDB0'}` }}>
                    <span style={{ color: al.tone === 'bad' ? '#E1483F' : '#E08B0B' }}>{al.tone === 'bad' ? '⚠' : '⚑'}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium" style={{ color: al.tone === 'bad' ? '#E1483F' : '#E08B0B' }}>{al.titulo}</div>
                      {al.motivo && <div className="text-xs text-ink-2 mt-0.5 line-clamp-2">{al.motivo}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-ink-3"><p className="text-sm">Nenhum alerta no momento.</p></div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
