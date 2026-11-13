'use client'
import { useState } from 'react'
import { Card, Badge, Button } from '@/components/dashboard/v2'
import {
  campaignResult,
  delta,
  metricValue,
  ratio,
  resultGroups,
  sourceLabel,
  type PerformanceSource,
} from '@/lib/performance/model'
import {
  MetricCard,
  SectionTitle,
  Notice,
  Pending,
  DataTable,
  count,
  money,
  percent,
  day,
  timestamp,
} from './shared'
export default function Overview({
  sources,
  report,
  reportLoading,
  daily,
  dailyLoading,
  period,
  onNavigate,
}: {
  sources: PerformanceSource[]
  report: any
  reportLoading: boolean
  daily: any
  dailyLoading: boolean
  period: any
  onNavigate: (tab: string) => void
}) {
  const good = sources.filter((s) => s.success),
    campaigns = good.flatMap((s) => s.campaigns),
    sum = (key: string) =>
      good.reduce((n, s) => n + Number(s.totals?.[key] || 0), 0),
    previous =
      good.length && good.every((s) => s.previousTotals)
        ? {
            spend: good.reduce(
              (n, s) => n + Number(s.previousTotals.spend || 0),
              0,
            ),
            clicks: good.reduce(
              (n, s) => n + Number(s.previousTotals.clicks || 0),
              0,
            ),
          }
        : null
  const groups = resultGroups(campaigns),
    partial = sources.some((s) => !s.success),
    without = campaigns.filter(
      (c) =>
        Number(c.spend) > 0 &&
        campaignResult(c).value === 0 &&
        [
          'meta_lead',
          'form_lead',
          'website_lead',
          'message_conversation',
          'whatsapp_conversation',
          'purchase',
          'google_conversions',
        ].includes(campaignResult(c).key),
    )
  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <MetricCard
          label="Investimento em mídia"
          value={good.length ? money(sum('spend')) : '—'}
          change={previous ? delta(sum('spend'), previous.spend) : null}
          note={
            partial
              ? 'Total parcial: uma fonte não retornou.'
              : 'Soma das fontes disponíveis no período.'
          }
        />
        <MetricCard
          label="Cliques registrados"
          value={good.length ? count(sum('clicks')) : '—'}
          change={previous ? delta(sum('clicks'), previous.clicks) : null}
          note="Cliques nas plataformas; não são pessoas únicas."
        />
        <MetricCard
          label="CTR ponderado"
          value={percent(ratio(sum('clicks'), sum('impressions')))}
          note="Total de cliques ÷ total de impressões. Não é média simples dos canais."
        />
        <MetricCard
          label="CPC ponderado"
          value={money(ratio(sum('spend'), sum('clicks')))}
          note="Investimento ÷ cliques. Custo de tráfego, não custo por cliente."
        />
      </div>
      <Card>
        <SectionTitle
          title="Resultados, sem misturar objetivos"
          detail="Cada linha reúne campanhas do mesmo canal e evento principal. Conversas, compras e alcance não são somados como um único resultado."
          action={
            <Button
              size="sm"
              variant="soft"
              onClick={() => onNavigate('campanhas')}
            >
              Explorar campanhas →
            </Button>
          }
        />
        {groups.length ? (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {groups.map((group) => (
              <div
                key={group.platform + group.key + group.label}
                className="rounded-lg border border-line p-4"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${group.platform === 'meta' ? 'bg-blue' : 'bg-emerald-500'}`}
                  />
                  <p className="text-xs text-ink-2">
                    {sourceLabel(group.platform)} · {group.campaigns}{' '}
                    {group.campaigns === 1 ? 'campanha' : 'campanhas'}
                  </p>
                </div>
                <p className="text-2xl font-semibold text-ink mt-3">
                  {count(group.value)}
                </p>
                <p className="text-sm text-ink mt-1">{group.label}</p>
                <p className="text-xs text-ink-2 mt-3">
                  {group.key === 'reach' && group.campaigns > 1
                    ? 'Alcance não somado entre campanhas: pode haver sobreposição.'
                    : `Custo por resultado: ${money(ratio(group.spend, group.value))}`}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-2">
            Aguardando dados das campanhas deste período.
          </p>
        )}
      </Card>
      <div className="grid xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)] gap-4">
        <Card>
          <SectionTitle
            title="Investimento ao longo do período"
            detail="Séries diárias por canal. Valores de uma fonte que falhou não são preenchidos como zero."
          />
          {dailyLoading ? (
            <Pending>Carregando a série diária…</Pending>
          ) : (
            <DailyTrend data={daily} period={period} />
          )}
        </Card>
        <Card>
          <SectionTitle
            title="O que merece sua atenção"
            detail="Leituras dos dados disponíveis; nenhuma alteração é executada por esta tela."
          />
          <div className="space-y-4">
            {without.length > 0 && (
              <button
                onClick={() => onNavigate('campanhas')}
                className="w-full text-left rounded-lg border border-line p-4"
              >
                <Badge tone="warn">Conferir rastreamento e volume</Badge>
                <p className="text-sm font-semibold text-ink mt-2">
                  {count(without.length)}{' '}
                  {without.length === 1
                    ? 'campanha sem evento principal registrado'
                    : 'campanhas sem evento principal registrado'}
                </p>
                <p className="text-xs text-ink-2 mt-2">
                  {money(without.reduce((n, c) => n + Number(c.spend || 0), 0))}{' '}
                  investidos. Verifique período, objetivo e configuração antes
                  de concluir que há desperdício.
                </p>
              </button>
            )}
            {!reportLoading &&
              !report?.sources?.some(
                (s: any) =>
                  s.platform === 'kommo' &&
                  s.metrics?.some(
                    (m: any) =>
                      m.key === 'crm_won_leads' && m.status === 'available',
                  ),
              ) && (
                <button
                  onClick={() => onNavigate('contatos')}
                  className="w-full text-left rounded-lg border border-line p-4"
                >
                  <Badge tone="neutral">Leitura comercial</Badge>
                  <p className="text-sm font-semibold text-ink mt-2">
                    As vendas ainda precisam de confirmação no CRM
                  </p>
                  <p className="text-xs text-ink-2 mt-2">
                    Os eventos das plataformas estão separados de contatos e
                    negócios. Confira o estado da sincronização.
                  </p>
                </button>
              )}
            <button
              onClick={() => onNavigate('audiencias')}
              className="w-full text-left rounded-lg border border-line p-4"
            >
              <p className="text-sm font-semibold text-blue">
                Estudar público, horário e dispositivo →
              </p>
              <p className="text-xs text-ink-2 mt-2">
                Compare participação na verba com participação no evento
                escolhido e formule um teste.
              </p>
            </button>
          </div>
        </Card>
      </div>
      <Card>
        <SectionTitle
          title="Maiores investimentos do período"
          detail="Priorize a análise pelo volume de verba, considerando o tipo de resultado de cada campanha."
        />
        <DataTable
          caption="Campanhas por investimento"
          rows={[...campaigns]
            .sort((a, b) => Number(b.spend) - Number(a.spend))
            .slice(0, 6)}
          columns={[
            {
              key: 'name',
              label: 'Campanha',
              render: (c) => (
                <span>
                  {c.name}
                  <span className="block text-xs font-normal text-ink-2 mt-1">
                    {sourceLabel(c.platform)}
                  </span>
                </span>
              ),
            },
            {
              key: 'spend',
              label: 'Investimento',
              render: (c) => money(c.spend),
            },
            {
              key: 'results',
              label: 'Resultado',
              render: (c) => (
                <span>
                  {count(campaignResult(c).value)}
                  <span className="block text-xs">
                    {campaignResult(c).label}
                  </span>
                </span>
              ),
            },
            {
              key: 'cost',
              label: 'Custo por resultado',
              render: (c) => money(ratio(c.spend, campaignResult(c).value)),
            },
            {
              key: 'ctr',
              label: 'CTR',
              render: (c) => percent(ratio(c.clicks, c.impressions)),
            },
          ]}
        />
      </Card>
      <Card>
        <SectionTitle
          title="De onde vêm os números"
          detail="Contas selecionadas para este cliente, horário da consulta e disponibilidade. O período anterior tem a mesma duração do período atual."
        />
        <div className="grid md:grid-cols-2 gap-4">
          {sources.map((source) => (
            <div
              key={source.platform}
              className="border border-line rounded-lg p-4"
            >
              <div className="flex justify-between gap-3">
                <h3 className="font-semibold text-sm">
                  {sourceLabel(source.platform)}
                </h3>
                <Badge
                  tone={
                    source.success
                      ? 'good'
                      : (source as any).loading
                        ? 'blue'
                        : 'warn'
                  }
                >
                  {source.success
                    ? 'Consulta disponível'
                    : (source as any).loading
                      ? 'Consultando'
                      : 'Indisponível'}
                </Badge>
              </div>
              <p className="text-xs text-ink-2 mt-2">
                Conta {source.accountId}
              </p>
              <p className="text-xs text-ink-2 mt-1">
                {source.success
                  ? `Consultado em ${timestamp(source.fetchedAt || '')} · Brasília`
                  : source.error || 'Aguardando resposta.'}
              </p>
              {source.success && !source.previousTotals && (
                <p className="text-xs text-ink-2 mt-2">
                  Comparação com o período anterior indisponível.
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
export function DailyTrend({ data, period }: { data: any; period: any }) {
  const [hover, setHover] = useState<number | null>(null),
    [table, setTable] = useState(false)
  const good = (data?.sources || []).filter(
    (s: any) =>
      s.datasets?.daily?.status === 'available' && !s.datasets.daily.truncated,
  )
  if (!good.length)
    return (
      <Notice>
        Não há uma série diária confirmada para o período. Os totais acima
        continuam mostrando as leituras disponíveis.
      </Notice>
    )
  const dates: string[] = []
  for (
    let t = Date.parse(period.startDate + 'T00:00:00Z');
    t <= Date.parse(period.endDate + 'T00:00:00Z');
    t += 86400000
  )
    dates.push(new Date(t).toISOString().slice(0, 10))
  const series = good.map((s: any) => ({
      platform: s.platform,
      rows: new Map<string, any>(
        s.datasets.daily.rows.map((r: any) => [r.date, r]),
      ),
    })),
    rows = dates.map((date) => ({
      date,
      meta:
        series.find((s: any) => s.platform === 'meta')?.rows.get(date)?.spend ??
        (good.some((s: any) => s.platform === 'meta') ? 0 : null),
      google:
        series.find((s: any) => s.platform === 'google')?.rows.get(date)
          ?.spend ??
        (good.some((s: any) => s.platform === 'google') ? 0 : null),
    }))
  const max = Math.max(
      1,
      ...rows.flatMap((row) => [row.meta || 0, row.google || 0]),
    ),
    width = 650,
    height = 180,
    left = 12,
    right = 638,
    top = 12,
    bottom = 160,
    x = (index: number) =>
      left +
      (right - left) * (rows.length > 1 ? index / (rows.length - 1) : 0.5),
    y = (value: number) => bottom - ((bottom - top) * value) / max
  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Investimento diário por canal"
        className="w-full h-auto"
        onMouseMove={(event) => {
          const box = event.currentTarget.getBoundingClientRect(),
            at = ((event.clientX - box.left) / box.width) * width
          setHover(
            Math.max(
              0,
              Math.min(
                rows.length - 1,
                Math.round(((at - left) / (right - left)) * (rows.length - 1)),
              ),
            ),
          )
        }}
        onMouseLeave={() => setHover(null)}
      >
        {[0, 0.5, 1].map((t) => (
          <line
            key={t}
            x1={left}
            x2={right}
            y1={y(max * t)}
            y2={y(max * t)}
            stroke="#e4e5e2"
            strokeDasharray="3 4"
          />
        ))}
        {series.map((s: any) => {
          const key = s.platform as 'meta' | 'google',
            color = key === 'meta' ? '#315cf5' : '#10a575'
          return (
            <g key={key}>
              <path
                d={rows
                  .map(
                    (row, index) =>
                      `${index ? 'L' : 'M'} ${x(index)} ${y(Number(row[key] || 0))}`,
                  )
                  .join(' ')}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {rows.length === 1 && (
                <circle
                  cx={x(0)}
                  cy={y(Number(rows[0][key] || 0))}
                  r="4"
                  fill={color}
                />
              )}
            </g>
          )
        })}
        {hover !== null && (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={top}
            y2={bottom}
            stroke="#6b7280"
            strokeDasharray="3 3"
          />
        )}
      </svg>
      <div className="flex justify-between text-xs text-ink-2">
        <span>{day(period.startDate)}</span>
        <span>{day(period.endDate)}</span>
      </div>
      <div className="flex gap-4 flex-wrap text-xs mt-3">
        {good.map((s: any) => (
          <span key={s.platform} className="flex gap-2 items-center">
            <span
              className={`w-2 h-2 rounded-full ${s.platform === 'meta' ? 'bg-blue' : 'bg-emerald-500'}`}
            />
            {sourceLabel(s.platform)}{' '}
            {hover !== null
              ? money(rows[hover][s.platform as 'meta' | 'google'])
              : ''}
          </span>
        ))}
        {hover !== null && <span>{day(rows[hover].date)}</span>}
      </div>
      {good.length < (data?.sources?.length || 0) && (
        <p className="text-xs text-ink-2 mt-3">
          Série parcial: uma fonte não retornou seus dados diários.
        </p>
      )}
      <button
        className="text-xs text-blue font-semibold mt-4"
        onClick={() => setTable((v) => !v)}
      >
        {table ? 'Ocultar valores' : 'Ver valores diários'}
      </button>
      {table && (
        <div className="mt-3 max-h-72 overflow-auto">
          <DataTable
            caption="Valores diários de investimento"
            rows={rows}
            columns={[
              { key: 'date', label: 'Data', render: (r) => day(r.date) },
              ...good.map((s: any) => ({
                key: s.platform,
                label: sourceLabel(s.platform),
                render: (r: any) => money(r[s.platform]),
              })),
            ]}
          />
        </div>
      )}
    </div>
  )
}
