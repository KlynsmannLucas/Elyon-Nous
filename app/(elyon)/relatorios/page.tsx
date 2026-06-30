// app/(elyon)/relatorios/page.tsx — Relatórios: export PDF real + portal do cliente.
'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Icon, Card, Badge, Button, SectionHead, LineChart, LegendDot, CHART_COLORS } from '@/components/dashboard/v2'
import { useDailySeries } from '@/lib/useDailySeries'

export default function RelatoriosPage() {
  const clientData = useAppStore(s => s.clientData)
  const savedClients = useAppStore(s => s.savedClients)
  const auditCache = useAppStore(s => s.auditCache)
  const strategyData = useAppStore(s => s.strategyData)
  const actionPlanCache = useAppStore(s => s.actionPlanCache)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState<'full' | 'executive' | null>(null)
  const [err, setErr] = useState('')
  // Portal do cliente — seções que a página pública /portal/[slug] realmente renderiza.
  const [portal, setPortal] = useState({ metrics: true, strategy: true, actions: false })
  const [portalSlug, setPortalSlug] = useState('')
  const [portalBusy, setPortalBusy] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const key = clientData?.clientName || savedClients?.[0]?.clientData?.clientName || ''
  const daily = useDailySeries(auditCache[key]?.[0]?.audit?._realMetrics?.avgROAS ?? null)
  // Carrega o portal já existente deste cliente (reusa o slug + restaura as seções).
  useEffect(() => {
    if (!key) { setPortalSlug(''); return }
    let active = true
    fetch('/api/portal').then(r => r.ok ? r.json() : { portals: [] }).then(d => {
      if (!active) return
      const p = (d.portals || []).find((x: any) => x.clientName === key)
      if (p) { setPortalSlug(p.slug); setPortal({ metrics: p.showMetrics ?? true, strategy: p.showStrategy ?? true, actions: p.showActions ?? false }) }
      else setPortalSlug('')
    }).catch(() => {})
    return () => { active = false }
  }, [key])
  if (!mounted) return null

  const latestAudit = auditCache[key]?.[0]?.audit
  const hasData = !!(clientData && (latestAudit || strategyData))

  // Cria/atualiza o portal no servidor (upsert) e devolve o slug. Mesma URL ao editar seções.
  const savePortal = async (sections: typeof portal = portal, slug: string = portalSlug): Promise<string> => {
    if (!clientData || !key) return ''
    setPortalBusy(true)
    try {
      const s = slug || (typeof crypto !== 'undefined' ? crypto.randomUUID().replace(/-/g, '').slice(0, 16) : String(Date.now()))
      // Snapshot dos KPIs REAIS da última auditoria (com tendência vs período anterior).
      const rm: any = auditCache[key]?.[0]?.audit?._realMetrics
      const prev: any = auditCache[key]?.[0]?.audit?._previousTotals
      const kpis = rm ? {
        spend: rm.totalSpend, leads: rm.totalLeads, cpl: rm.avgCPL, roas: rm.avgROAS, revenue: rm.totalRevenue, ctr: rm.avgCTR,
        spendDelta: prev?.spendDelta ?? null, leadsDelta: prev?.leadsDelta ?? null, cplDelta: prev?.cplDelta ?? null, revenueDelta: prev?.revenueDelta ?? null,
      } : null
      const res = await fetch('/api/portal', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: s, clientName: key, agencyName: (clientData as any)?.agencyName || key || 'Agência',
          showMetrics: sections.metrics, showStrategy: sections.strategy, showActions: sections.actions,
          niche: clientData.niche, budget: clientData.budget, revenue: (clientData as any).monthlyRevenue, kpis,
        }),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok && d.success) { setPortalSlug(s); return s }
      if (typeof window !== 'undefined') window.toast?.({ tone: 'bad', title: 'Não foi possível', body: d?.error || 'Tente novamente.' })
    } catch { if (typeof window !== 'undefined') window.toast?.({ tone: 'bad', title: 'Falha de conexão' }) }
    finally { setPortalBusy(false) }
    return ''
  }
  const toggleSection = (k: keyof typeof portal) => {
    const next = { ...portal, [k]: !portal[k] }
    setPortal(next)
    if (portalSlug) savePortal(next, portalSlug) // já ativo → persiste a mudança (URL não muda)
  }

  const exportPDF = async (mode: 'full' | 'executive') => {
    if (!clientData) { window.location.href = '/novo'; return }
    setLoading(mode); setErr('')
    try {
      const { generatePDF } = await import('@/components/pdf/RelatorioPDF')
      await generatePDF({
        clientData: clientData ?? null,
        strategy: strategyData?.strategy || {},
        auditData: latestAudit ?? null,
        actionItems: actionPlanCache[key] || [],
      }, mode)
      if (typeof window !== 'undefined') window.toast?.({ tone: 'good', title: 'Relatório gerado', body: mode === 'full' ? 'PDF completo pronto para download.' : 'Resumo executivo pronto.' })
    } catch (e) {
      console.error('Erro PDF:', e)
      setErr('Não foi possível gerar o PDF. Tente novamente.')
      if (typeof window !== 'undefined') window.toast?.({ tone: 'bad', title: 'Falha ao gerar PDF', body: 'Tente novamente.' })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="p-4 md:p-6">
      <header className="mb-5 animate-fade-up">
        <h1 className="text-[23px] font-bold text-ink" style={{ letterSpacing: '-0.02em' }}>Relatórios</h1>
        <p className="text-sm text-ink-2 mt-0.5">{key || 'Selecione um cliente'}</p>
      </header>

      {daily && (
        <Card className="mb-4 animate-fade-up">
          <SectionHead title={daily.hasRevenue ? 'Receita × investimento' : 'Investimento × leads'} subtitle="Série diária real (Meta)" icon={<Icon name="chart" size={17} />}
            action={<div className="flex gap-3">{daily.hasRevenue ? <LegendDot color={CHART_COLORS.green}>Receita</LegendDot> : <LegendDot color={CHART_COLORS.green}>Leads</LegendDot>}<LegendDot color={CHART_COLORS.blue}>Investimento</LegendDot></div>} />
          <LineChart
            labels={daily.labels}
            money={daily.hasRevenue}
            series={daily.hasRevenue
              ? [{ name: 'Receita', color: CHART_COLORS.green, data: daily.revenue! }, { name: 'Investimento', color: CHART_COLORS.blue, data: daily.spend }]
              : [{ name: 'Leads', color: CHART_COLORS.green, data: daily.leads }, { name: 'Investimento', color: CHART_COLORS.blue, data: daily.spend }]} />
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-up">
        {/* Exportar */}
        <Card>
          <SectionHead title="Exportar relatório" subtitle="Gera um PDF com os dados reais do cliente" icon={<Icon name="download" size={17} />} />
          {!hasData && <p className="text-xs text-ink-3 mb-3">Rode a Análise Profunda e gere a estratégia para um relatório completo.</p>}
          <div className="space-y-2.5">
            <button onClick={() => exportPDF('full')} disabled={loading !== null}
              className="w-full flex items-center gap-3 p-3.5 rounded-sm border border-line bg-paper hover:border-blue-line transition-colors text-left disabled:opacity-60">
              <span className="w-9 h-9 rounded-md bg-blue-soft text-blue flex items-center justify-center shrink-0">📄</span>
              <div className="flex-1"><div className="text-sm font-semibold text-ink">Relatório completo</div><div className="text-xs text-ink-3">Auditoria + estratégia + plano de ação</div></div>
              <span className="text-ink-3">{loading === 'full' ? '⏳' : '→'}</span>
            </button>
            <button onClick={() => exportPDF('executive')} disabled={loading !== null}
              className="w-full flex items-center gap-3 p-3.5 rounded-sm border border-line bg-paper hover:border-blue-line transition-colors text-left disabled:opacity-60">
              <span className="w-9 h-9 rounded-md bg-green-soft text-green-600 flex items-center justify-center shrink-0">⚡</span>
              <div className="flex-1"><div className="text-sm font-semibold text-ink">Resumo executivo</div><div className="text-xs text-ink-3">Visão geral de KPIs e direção</div></div>
              <span className="text-ink-3">{loading === 'executive' ? '⏳' : '→'}</span>
            </button>
          </div>
          {err && <div className="text-xs text-red mt-3">{err}</div>}
        </Card>

        {/* Portal do cliente */}
        <Card>
          <SectionHead title="Portal do cliente" subtitle="Compartilhe resultados por link, sem login" icon={<Icon name="link" size={17} />}
            action={<Badge tone={portalSlug ? 'good' : 'neutral'} dot>{portalSlug ? 'Ativo' : 'Inativo'}</Badge>} />
          {(() => {
            const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.elyonnous.com'
            const fullUrl = portalSlug ? `${origin}/portal/${portalSlug}` : ''
            const display = fullUrl.replace(/^https?:\/\//, '')
            const copy = () => { try { navigator.clipboard?.writeText(fullUrl) } catch {}; if (typeof window !== 'undefined') window.toast?.({ tone: 'good', title: 'Link copiado', body: display }) }
            return (
              <>
                {portalSlug ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-sm bg-canvas-2 border border-line mb-3">
                    <Icon name="link" size={15} /><span className="flex-1 text-sm font-mono text-ink-2 truncate">{display}</span>
                    <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="text-[12px] text-blue hover:underline px-1">Abrir</a>
                    <Button size="sm" variant="soft" onClick={copy}>Copiar</Button>
                  </div>
                ) : (
                  <div className="mb-3">
                    <Button size="sm" variant="primary" disabled={portalBusy || !clientData} icon={<Icon name="link" size={14} />} onClick={() => savePortal()}>
                      {portalBusy ? 'Gerando…' : 'Gerar link do portal'}
                    </Button>
                    <p className="text-[11.5px] text-ink-3 mt-1.5">Cria uma página pública (sem login) com os resultados de {key || 'este cliente'} pra você enviar.</p>
                  </div>
                )}
                <div className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3 mb-2">Seções visíveis para o cliente</div>
                <div className="space-y-1">
                  {([['metrics', 'Resumo & KPIs'], ['strategy', 'Estratégia'], ['actions', 'Plano de ação']] as const).map(([k, label]) => (
                    <button key={k} onClick={() => toggleSection(k)} disabled={portalBusy}
                      className="w-full flex items-center justify-between py-2 text-left disabled:opacity-60">
                      <span className="text-sm text-ink">{label}</span>
                      <span className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${portal[k] ? 'bg-blue' : 'bg-canvas-2 border border-line'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${portal[k] ? 'left-[18px]' : 'left-0.5'}`} />
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )
          })()}
        </Card>
      </div>

      {/* Modelos */}
      <Card className="mt-4 animate-fade-up">
        <SectionHead title="Modelos de relatório" subtitle="Atalhos por finalidade" icon={<Icon name="grid" size={17} />} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { t: 'Executivo mensal', d: 'KPIs do período', m: 'executive' as const },
            { t: 'Completo', d: 'Tudo em um PDF', m: 'full' as const },
            { t: 'Diagnóstico', d: 'Auditoria da conta', m: 'full' as const },
            { t: 'Estratégia', d: 'Plano de 90 dias', m: 'full' as const },
          ].map((tpl, i) => (
            <button key={i} onClick={() => exportPDF(tpl.m)} disabled={loading !== null}
              className="text-left p-3.5 rounded-md border border-line bg-paper hover:shadow-card-hover hover:border-blue-line transition-all disabled:opacity-60">
              <span className="w-8 h-8 rounded-md bg-blue-soft text-blue flex items-center justify-center mb-2.5">📑</span>
              <div className="text-sm font-semibold text-ink">{tpl.t}</div>
              <div className="text-xs text-ink-3 mt-0.5">{tpl.d}</div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
