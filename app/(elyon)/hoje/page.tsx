// app/(elyon)/hoje/page.tsx — Tela "Hoje" (home diária) com DADOS REAIS do store.
'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Icon, Card, Badge, Button, SectionHead, Delta, SourceBadge, Gauge, Sparkline, HBar, NousOrb, CHART_COLORS } from '@/components/dashboard/v2'
import { deriveMaturity } from '@/lib/maturity'
import { getBenchmark } from '@/lib/niche_benchmarks'

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
          <Button onClick={() => (window.location.href = '/novo')}>Criar primeiro cliente</Button>
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
  // KPIs com os 6 rótulos exatos do prototype (Receita/ROAS mostram "—" sem dado real).
  const kpis = rm ? [
    { label: 'Investimento', value: brl(rm.totalSpend), trend: prev?.spendDelta ?? null, inverse: false, series: spark(rm.totalSpend, prev?.spendDelta), up: (prev?.spendDelta ?? 0) >= 0 },
    { label: 'Receita', value: rm.totalRevenue > 0 ? brl(rm.totalRevenue) : '—', trend: prev?.revenueDelta ?? null, inverse: false, series: rm.totalRevenue > 0 ? spark(rm.totalRevenue, prev?.revenueDelta) : null, up: (prev?.revenueDelta ?? 0) >= 0 },
    { label: 'ROAS', value: rm.avgROAS ? `${rm.avgROAS}x` : '—', trend: null, inverse: false, series: null, up: true },
    { label: 'Conversões', value: int(rm.totalLeads), trend: prev?.leadsDelta ?? null, inverse: false, series: spark(rm.totalLeads, prev?.leadsDelta), up: (prev?.leadsDelta ?? 0) >= 0 },
    { label: 'CPA médio', value: rm.avgCPL ? brl(rm.avgCPL) : '—', trend: prev?.cplDelta ?? null, inverse: true, series: spark(rm.avgCPL, prev?.cplDelta), up: (prev?.cplDelta ?? 0) <= 0 },
    { label: 'CTR médio', value: rm.avgCTR ? `${rm.avgCTR}%` : '—', trend: null, inverse: false, series: null, up: true },
  ].slice(0, pro ? 6 : 4) : []

  // 6 pilares de saúde (ordem do prototype) derivados de sinais reais.
  const niche = clientData?.niche || savedClients?.find(c => c.clientData.clientName === key)?.clientData.niche || ''
  const bench = niche ? getBenchmark(niche) : null
  const trackingArr: any[] = latestAudit?._trackingChecklist || []
  const trackOk = trackingArr.length > 0 ? trackingArr.filter((t: any) => t.status === 'verificado').length / trackingArr.length : null
  const maturity = rm ? deriveMaturity(rm, bench, trackOk, score) : null
  const pillars = maturity ? maturity.axes.map((a, i) => ({ label: a, v: maturity.you[i] })) : []

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

  // Streak — dias desde o primeiro cliente salvo (proxy real de uso contínuo).
  const firstSaved = savedClients?.[0]?.savedAt
  const streak = firstSaved ? Math.max(1, Math.floor((Date.now() - new Date(firstSaved).getTime()) / 86400000) + 1) : null

  // Metas do mês — rótulos exatos do prototype; "—" quando a conta não tem o dado (regra B).
  const goals = rm ? ([
    { k: 'Receita do mês', cur: rm.totalRevenue || 0, target: rm.totalRevenue > 0 ? Math.max(1000, Math.ceil((rm.totalRevenue * 1.25) / 1000) * 1000) : 0, fmt: 'brl' as const, has: rm.totalRevenue > 0 },
    { k: 'ROAS alvo', cur: rm.avgROAS || 0, target: rm.avgROAS ? Math.round((rm.avgROAS + 0.5) * 10) / 10 : 0, fmt: 'x' as const, has: !!rm.avgROAS },
    { k: 'Novos clientes', cur: rm.totalLeads || 0, target: Math.max(10, Math.ceil(((rm.totalLeads || 0) * 1.2) / 10) * 10), fmt: 'int' as const, has: true },
  ]) : []
  const goalFmt = (v: number, f: 'brl' | 'int' | 'x') => f === 'brl' ? brl(v) : f === 'x' ? `${v}x` : int(v)

  // Headline do briefing + ganhos rápidos (soma do impacto das ações pendentes).
  const firstName = key ? key.split(' ')[0] : ''
  const headline = ev?.scoreDelta && ev.scoreDelta > 0
    ? `${greeting()}, ${firstName}. Sua operação subiu ${ev.scoreDelta} pontos.`
    : rm ? `${greeting()}, ${firstName}. Aqui está o resumo de hoje.`
    : `${greeting()}, ${firstName}. Vamos começar.`
  const parseImpact = (s: any) => { const n = Number(String(s || '').replace(/[^\d]/g, '')); return Number.isFinite(n) ? n : 0 }
  const quickGain = (pendingActionsCache[key] || []).filter((a: any) => a.status === 'pendente').reduce((t: number, a: any) => t + parseImpact(a.impact), 0)

  const changes: { text: string; sub: string; tone: 'good' | 'bad' | 'warn'; icon: 'up' | 'down' | 'flag' }[] = []
  if (pro) {
    if (ev?.scoreDelta) changes.push({ text: `Score ${ev.scoreDelta > 0 ? 'subiu' : 'caiu'} ${Math.abs(ev.scoreDelta)} pts`, sub: 'vs última auditoria', tone: ev.scoreDelta > 0 ? 'good' : 'bad', icon: ev.scoreDelta > 0 ? 'up' : 'down' })
    if (daily?.cplPct != null && daily.cplPct !== 0) changes.push({ text: `CPL ${daily.cplPct > 0 ? '+' : ''}${daily.cplPct}%`, sub: 'vs ontem', tone: daily.cplPct > 0 ? 'bad' : 'good', icon: daily.cplPct > 0 ? 'up' : 'down' })
    if (daily?.leadsPct != null && daily.leadsPct !== 0) changes.push({ text: `Leads ${daily.leadsPct > 0 ? '+' : ''}${daily.leadsPct}%`, sub: 'vs ontem', tone: daily.leadsPct > 0 ? 'good' : 'warn', icon: daily.leadsPct > 0 ? 'up' : 'flag' })
  }

  return (
    <div className="p-4 md:p-6">
      <header className="mb-4 flex items-center justify-between gap-3 flex-wrap animate-fade-up">
        <div>
          <h1 className="text-[23px] font-bold text-ink" style={{ letterSpacing: '-0.02em' }}>{greeting()}{key ? `, ${key.split(' ')[0]}` : ''} 👋</h1>
          <p className="text-[13.5px] text-ink-3 mt-0.5 capitalize">{today()}{key ? ` · ${key}` : ''}</p>
        </div>
        {streak != null && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-amber-soft" style={{ border: '1px solid #F2DDB0' }}>
            <span className="text-amber"><Icon name="bolt" size={16} /></span>
            <span className="text-[13px] font-semibold text-amber">{streak} dias seguidos</span>
          </div>
        )}
      </header>

      {/* Briefing Hero — command center escuro (CLARITY) */}
      <section className="mb-4 animate-fade-up sheen rounded-lg overflow-hidden" style={{ boxShadow: 'var(--sh-ink)', border: '1px solid var(--ink-line)', background: 'radial-gradient(135% 130% at 6% -10%, rgba(43,91,227,.34), transparent 46%), radial-gradient(120% 130% at 102% 120%, rgba(14,156,176,.20), transparent 52%), var(--ink-surface)' }}>
        <div className="flex items-start gap-[22px] flex-wrap" style={{ padding: '24px 26px' }}>
          <NousOrb size={50} />
          <div className="flex-1" style={{ minWidth: 280 }}>
            <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
              <span className="text-[10.5px] font-mono uppercase tracking-[0.14em] font-medium" style={{ color: 'var(--blue-500)' }}>Briefing do NOUS</span>
              <span className="text-[10.5px] font-mono tracking-[0.12em]" style={{ color: 'var(--on-ink-3)' }}>{today().toUpperCase()}</span>
              <span className="inline-flex items-center gap-1.5"><span className="live-dot" /><span className="text-[10px] font-mono tracking-[0.06em]" style={{ color: 'var(--green-500)' }}>ATUALIZADO AGORA</span></span>
            </div>
            <div className="font-bold leading-[1.22]" style={{ fontSize: pro ? 21 : 24, letterSpacing: '-0.025em', color: 'var(--on-ink)' }}>{headline}</div>
            <p className="text-sm leading-relaxed mt-3 max-w-[680px]" style={{ color: 'var(--on-ink-2)' }}>{briefing}</p>
            <div className="flex flex-wrap gap-2.5 mt-[18px]">
              <Button onClick={() => (window.location.href = '/plano')}>Ver meu plano de hoje</Button>
              <button onClick={() => (window.location.href = rm ? '/diagnostico' : '/diagnostico')}
                className="inline-flex items-center gap-1.5 px-[15px] py-[9px] text-[13.5px] font-semibold rounded-sm transition-colors"
                style={{ background: 'rgba(255,255,255,.06)', color: 'var(--on-ink)', border: '1px solid var(--ink-line)' }}>
                <Icon name="sparkle2" size={15} /> {rm ? 'Perguntar ao NOUS' : 'Rodar Análise Profunda'}
              </button>
            </div>
          </div>
          {/* Ganhos rápidos — dado virando ação em R$ */}
          {quickGain > 0 && (
            <div className="flex flex-col gap-1" style={{ minWidth: 188, flex: '0 1 220px', alignSelf: 'stretch', padding: '15px 16px', borderRadius: 'var(--r-md)', background: 'rgba(255,255,255,.05)', border: '1px solid var(--ink-line)' }}>
              <span className="text-[10.5px] font-mono uppercase tracking-[0.14em]" style={{ color: 'var(--on-ink-3)' }}>Ganhos rápidos</span>
              <span className="font-mono font-bold count-up whitespace-nowrap" style={{ fontSize: 25, letterSpacing: '-0.03em', color: 'var(--green-500)' }}>+{brl(quickGain)}</span>
              <span className="text-[11.5px] leading-snug" style={{ color: 'var(--on-ink-2)' }}>esperando sua aprovação no plano de hoje</span>
              <button onClick={() => (window.location.href = '/plano')} className="mt-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[12.5px] font-semibold rounded-sm transition-colors"
                style={{ border: '1px solid var(--ink-line)', background: 'rgba(255,255,255,.06)', color: 'var(--on-ink)' }}>
                Revisar e aprovar <Icon name="arrowR" size={14} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* O que mudou desde ontem — texto completo (CLARITY) */}
      {pro && changes.length > 0 && (
        <section className="mb-4 animate-fade-up">
          <div className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-ink-3 mb-2">O que mudou desde ontem</div>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {changes.map((c, i) => {
              const col = c.tone === 'good' ? { c: '#0E9E6E', bg: '#E3F6EE' } : c.tone === 'bad' ? { c: '#E1483F', bg: '#FCEBE9' } : { c: '#D9870B', bg: '#FBF0D9' }
              return (
                <div key={i} className="flex items-center gap-2.5 px-3.5 py-3 bg-paper border border-line rounded-md">
                  <span className="w-[30px] h-[30px] rounded-lg shrink-0 flex items-center justify-center" style={{ background: col.bg, color: col.c }}><Icon name={c.icon === 'up' ? 'arrowUp' : c.icon === 'down' ? 'arrowDown' : 'flag'} size={16} w={2.2} /></span>
                  <div className="min-w-0"><div className="text-[12.5px] font-semibold text-ink">{c.text}</div><div className="text-[11px] text-ink-3">{c.sub}</div></div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* KPIs */}
      {kpis.length > 0 && (
        <section className="mb-4 animate-fade-up">
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
            {kpis.map(kpi => (
              <Card key={kpi.label} padding="sm" hover>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3">{kpi.label}</span>
                  {kpi.trend != null && kpi.trend !== 0 && <Delta value={kpi.trend} inverse={kpi.inverse} />}
                </div>
                <span className="text-[20px] font-bold font-mono text-ink block count-up" style={{ letterSpacing: '-0.02em' }}>{kpi.value}</span>
                {kpi.series && <div className="mt-2"><Sparkline data={kpi.series} h={28} color={kpi.up ? CHART_COLORS.green : CHART_COLORS.red} /></div>}
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Main grid — split-narrow (Saúde+Metas | Ações+Alertas) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.35fr] gap-4 items-start animate-fade-up">
        {/* Coluna esquerda: Saúde + Metas */}
        <div className="space-y-4">
          {/* Health */}
          <Card>
            <SectionHead title="Saúde do negócio" subtitle="Índice geral da conta" icon={<Icon name="pulse" size={18} />}
              action={<SourceBadge source={hs?.source === 'ai' ? 'ai' : rm ? 'real' : 'benchmark'} />} />
            {score != null ? (
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-4">
                  <Gauge value={score} size={108} sub="saúde" color={scColor} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold" style={{ color: scColor }}>{grade}</span>
                      {ev?.scoreDelta != null && ev.scoreDelta !== 0 && <Delta value={ev.scoreDelta} suffix=" pts" />}
                    </div>
                    <p className="text-xs text-ink-3 mt-1 max-w-[170px]">{score >= 80 ? 'Conta saudável, acima da média.' : score >= 60 ? 'Oportunidades de melhoria identificadas.' : 'Atenção: gargalos limitando resultados.'}</p>
                  </div>
                </div>
                {pillars.length > 0 && (
                  <div className="flex-1 min-w-[180px] space-y-2.5">
                    {pillars.slice(0, pro ? 6 : 3).map(p => (
                      <div key={p.label}>
                        <div className="flex justify-between text-xs mb-1"><span className="text-ink-2">{p.label}</span><span className="font-mono font-semibold text-ink">{p.v}</span></div>
                        <div className="h-1.5 rounded-full bg-canvas-2 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${p.v}%`, background: p.v >= 70 ? '#0E9E6E' : p.v >= 50 ? '#E08B0B' : '#E1483F' }} /></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-ink-3">
                <p className="text-sm">Rode a Análise Profunda para calcular a saúde da conta.</p>
                <Button variant="soft" size="sm" className="mt-3" onClick={() => (window.location.href = '/diagnostico')}>Calcular saúde</Button>
              </div>
            )}
          </Card>

          {/* Goals — Metas do mês */}
          {goals.length > 0 && (
            <Card>
              <SectionHead title="Metas do mês" subtitle="Seu progresso rumo aos alvos" icon={<Icon name="target" size={18} />} />
              <div className="space-y-4">
                {goals.map(g => {
                  const pct = g.has ? Math.min(100, Math.round((g.cur / Math.max(g.target, 0.01)) * 100)) : 0
                  return (
                    <div key={g.k}>
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-[13px] font-semibold text-ink">{g.k}</span>
                        <span className="font-mono text-[12.5px] text-ink-2">{g.has ? <><b className="text-ink">{goalFmt(g.cur, g.fmt)}</b> / {goalFmt(g.target, g.fmt)}</> : <span className="text-ink-3">— sem dado</span>}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1"><HBar value={pct} color={pct >= 80 ? CHART_COLORS.green : CHART_COLORS.blue} h={9} /></div>
                        <span className="font-mono text-xs font-bold w-9 text-right" style={{ color: pct >= 80 ? '#0B855D' : '#1E4FD0' }}>{pct}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Coluna direita: Ações + Alertas */}
        <div className="space-y-4">
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

          {/* Alerts */}
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
