'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, Badge, Button } from '@/components/dashboard/v2'
import { useAppStore } from '@/lib/store'
import {
  usePerformance,
  useTrafficStudy,
} from '@/lib/performance/usePerformance'
import { resolveReportingPeriod } from '@/lib/reporting-period'
import { sourceLabel } from '@/lib/performance/model'
import Overview from './Overview'
import Campaigns from './Campaigns'
import Contacts from './Contacts'
import { Audience, Channels } from './Study'
import Creatives from './Creatives'
import Funnel from './Funnel'
import { Pending, Notice, EmptyPanel, inputClass, day } from './shared'
const tabs = [
  ['visao', 'Visão geral'],
  ['campanhas', 'Campanhas'],
  ['contatos', 'Contatos e vendas'],
  ['audiencias', 'Audiência'],
  ['canais', 'Canais'],
  ['criativos', 'Criativos'],
  ['funil', 'Funil'],
]
export default function PerformanceDashboard() {
  const [tab, setTab] = useState('visao'),
    [refresh, setRefresh] = useState(0),
    [range, setRange] = useState<{ startDate: string; endDate: string } | null>(
      null,
    ),
    [draftStart, setDraftStart] = useState(''),
    [draftEnd, setDraftEnd] = useState(''),
    [rangeError, setRangeError] = useState('')
  const globalPreset = useAppStore((s) => s.globalPeriod.preset),
    data = usePerformance(refresh, range)
  const daily = useTrafficStudy(
      data.client?.id,
      data.period,
      'daily',
      true,
      data.scope,
    ),
    study = useTrafficStudy(
      data.client?.id,
      data.period,
      'audience',
      ['audiencias', 'canais'].includes(tab),
      data.scope,
    ),
    creatives = useTrafficStudy(
      data.client?.id,
      data.period,
      'creative',
      tab === 'criativos',
      data.scope,
    )
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('tab')
    if (tabs.some(([key]) => key === requested)) setTab(requested!)
  }, [])
  useEffect(() => {
    setRange(null)
    setDraftStart('')
    setDraftEnd('')
  }, [globalPreset])
  function navigate(key: string) {
    if (!tabs.some(([t]) => t === key)) return
    setTab(key)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', key)
    window.history.replaceState(null, '', url.pathname + url.search)
  }
  function applyRange(value: { startDate: string; endDate: string }) {
    try {
      resolveReportingPeriod(value)
      setRangeError('')
      setRange(value)
      setDraftStart(value.startDate)
      setDraftEnd(value.endDate)
    } catch (e: any) {
      setRangeError(e.message)
    }
  }
  return (
    <main className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-5">
      <header className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold text-blue">
            Nous · Desempenho
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink mt-2">
            Entenda a mídia. Acompanhe o resultado.
          </h1>
          <p className="text-sm text-ink-2 mt-2">
            {data.name || 'Selecione um cliente'} · {day(data.period.startDate)}{' '}
            a {day(data.period.endDate)}
            {data.period.includesToday ? ' · hoje ainda está em andamento' : ''}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <Badge tone={data.loading ? 'blue' : 'neutral'}>
            {data.loading ? 'Consultando fontes' : 'Leitura do período'}
          </Badge>
          <Button
            variant="soft"
            size="sm"
            disabled={data.loading}
            onClick={() => setRefresh((v) => v + 1)}
          >
            Atualizar dados
          </Button>
        </div>
      </header>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs text-ink-2">
          De
          <input
            type="date"
            className={`${inputClass} block mt-1 max-w-[170px]`}
            value={draftStart || data.period.startDate}
            onChange={(e) => setDraftStart(e.target.value)}
          />
        </label>
        <label className="text-xs text-ink-2">
          Até
          <input
            type="date"
            className={`${inputClass} block mt-1 max-w-[170px]`}
            value={draftEnd || data.period.endDate}
            onChange={(e) => setDraftEnd(e.target.value)}
          />
        </label>
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            applyRange({
              startDate: draftStart || data.period.startDate,
              endDate: draftEnd || data.period.endDate,
            })
          }
        >
          Aplicar período
        </Button>
        {range && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setRange(null)
              setDraftStart('')
              setDraftEnd('')
            }}
          >
            Usar período global
          </Button>
        )}
        {range && <Badge tone="neutral">Período personalizado</Badge>}
      </div>
      {rangeError && <Notice tone="bad">{rangeError}</Notice>}
      <nav
        aria-label="Abas de desempenho"
        className="flex gap-1 overflow-x-auto border-b border-line pb-2"
      >
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => navigate(key)}
            aria-current={tab === key ? 'page' : undefined}
            className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm transition ${tab === key ? 'bg-blue-soft text-blue font-semibold' : 'text-ink-2 hover:bg-canvas-2'}`}
          >
            {label}
          </button>
        ))}
      </nav>
      {data.error && (
        <EmptyPanel
          title="A leitura deste cliente precisa de atenção"
          detail={data.error}
        />
      )}
      {!data.client && data.loading && <Pending />}
      {data.client && !data.sources.length && !data.loading && (
        <Card>
          <h2 className="font-semibold text-ink">
            Selecione as contas de anúncios deste cliente
          </h2>
          <p className="text-sm text-ink-2 mt-2">
            O desempenho usa somente as contas associadas a {data.name}. As
            informações comerciais disponíveis continuam na aba Contatos e
            vendas.
          </p>
          <Link
            href="/integracoes"
            className="inline-block text-sm font-semibold text-blue mt-3"
          >
            Revisar contas do cliente →
          </Link>
        </Card>
      )}
      {data.sources
        .filter((s) => !s.success && !(s as any).loading)
        .map((source) => (
          <Notice key={source.platform} tone="warn">
            <strong>{sourceLabel(source.platform)}:</strong> {source.error} Os
            totais das demais fontes permanecem disponíveis.
          </Notice>
        ))}
      {data.client && (
        <div key={data.scope} className="min-w-0">
          {tab === 'visao' && (
            <Overview
              sources={data.sources}
              report={data.report}
              reportLoading={data.reportLoading}
              daily={daily.data}
              dailyLoading={daily.loading}
              period={data.period}
              onNavigate={navigate}
            />
          )}
          {tab === 'campanhas' && (
            <Campaigns
              sources={data.sources}
              period={data.period}
              clientName={data.name}
              onRefresh={() => setRefresh((v) => v + 1)}
            />
          )}
          {tab === 'contatos' && (
            <Contacts
              sources={data.sources}
              report={data.report}
              loading={data.reportLoading}
              error={data.reportError}
              onHistory={applyRange}
            />
          )}
          {tab === 'audiencias' && (
            <Audience
              study={study.data}
              loading={study.loading}
              error={study.error}
            />
          )}
          {tab === 'canais' && (
            <Channels
              sources={data.sources}
              study={study.data}
              loading={study.loading}
              error={study.error}
            />
          )}
          {tab === 'criativos' && (
            <Creatives
              study={creatives.data}
              loading={creatives.loading}
              error={creatives.error}
              sources={data.sources}
              client={data.client}
              period={data.period}
            />
          )}
          {tab === 'funil' && (
            <Funnel
              sources={data.sources}
              report={data.report}
              onContacts={() => navigate('contatos')}
            />
          )}
        </div>
      )}
      <p className="text-xs text-ink-2">
        As consultas de mídia usam o período acima. Dados de atribuição podem
        ser revisados pelas plataformas. “—” indica informação indisponível ou
        cálculo sem base; não significa zero.
      </p>
    </main>
  )
}
