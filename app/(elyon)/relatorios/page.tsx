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
  useEffect(() => { setMounted(true) }, [])

  const key = clientData?.clientName || savedClients?.[0]?.clientData?.clientName || ''
  const daily = useDailySeries(auditCache[key]?.[0]?.audit?._realMetrics?.avgROAS ?? null)
  if (!mounted) return null

  const latestAudit = auditCache[key]?.[0]?.audit
  const hasData = !!(clientData && (latestAudit || strategyData))

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
    } catch (e) {
      console.error('Erro PDF:', e)
      setErr('Não foi possível gerar o PDF. Tente novamente.')
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
            action={<Badge tone="good" dot>Disponível</Badge>} />
          <p className="text-sm text-ink-2 mb-4">Gere um link público com um resumo dos resultados deste cliente — ideal para enviar ao cliente final, sem dar acesso ao painel.</p>
          <Button variant="soft" onClick={() => (window.location.href = '/dashboard?view=portal')}>Configurar portal</Button>
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
