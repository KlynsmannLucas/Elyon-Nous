'use client'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Card, Badge, Button } from '@/components/dashboard/v2'
import {
  campaignResult,
  efficiencySignal,
  ratio,
  sourceLabel,
  statusLabel,
  campaignObjectiveLabel,
  type PerformanceSource,
} from '@/lib/performance/model'
import { performanceFetch } from '@/lib/performance/usePerformance'
import {
  count,
  money,
  percent,
  inputClass,
  SectionTitle,
  Notice,
  EmptyPanel,
  Pending,
  DataTable,
} from './shared'
export function Dialog({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = ref.current
    element?.showModal()
    return () => element?.close()
  }, [])
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      aria-label={title}
      className="fixed rounded-xl border border-line bg-paper text-ink p-0 w-[calc(100%-24px)] max-w-4xl max-h-[90vh] backdrop:bg-black/50"
    >
      <div className="p-5 border-b border-line flex justify-between gap-4 items-center">
        <h2 className="font-semibold text-lg">{title}</h2>
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="p-2 text-ink-2"
        >
          ✕
        </button>
      </div>
      <div className="p-5 space-y-5 overflow-y-auto">{children}</div>
    </dialog>
  )
}
export function managerUrl(c: any, source?: PerformanceSource) {
  return c.platform === 'google'
    ? `https://ads.google.com/aw/campaigns?ocid=${encodeURIComponent(source?.accountId || '')}&campaignId=${encodeURIComponent(c.id)}`
    : `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${encodeURIComponent(source?.accountId || '')}&selected_campaign_ids=${encodeURIComponent(c.id)}`
}
function csvValue(value: any) {
  return (
    '"' +
    String(value ?? '')
      .replace(/^[=+\-@\t\r]/, "'$&")
      .replace(/"/g, '""') +
    '"'
  )
}
function exportCampaigns(rows: any[]) {
  const table = [
    [
      'Campanha',
      'Canal',
      'Entrega',
      'Investimento',
      'Resultado',
      'Tipo de resultado',
      'Custo por resultado',
      'Impressões',
      'Cliques',
      'CTR (%)',
    ],
    ...rows.map((c) => {
      const r = campaignResult(c)
      return [
        c.name,
        sourceLabel(c.platform),
        statusLabel(c.status),
        c.spend,
        r.value,
        r.label,
        ratio(c.spend, r.value),
        c.impressions,
        c.clicks,
        ratio(c.clicks, c.impressions) !== null
          ? ratio(c.clicks, c.impressions)! * 100
          : null,
      ]
    }),
  ]
  const blob = new Blob(
      ['\uFEFF' + table.map((row) => row.map(csvValue).join(';')).join('\r\n')],
      {
        type: 'text/csv;charset=utf-8',
      },
    ),
    url = URL.createObjectURL(blob),
    anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'nous-campanhas.csv'
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
export default function Campaigns({
  sources,
  period,
  clientName,
  onRefresh,
}: {
  sources: PerformanceSource[]
  period: any
  clientName: string
  onRefresh: () => void
}) {
  const campaigns = sources
      .filter((s) => s.success)
      .flatMap((s) => s.campaigns),
    [search, setSearch] = useState(''),
    [platform, setPlatform] = useState('all'),
    [delivery, setDelivery] = useState('all'),
    [event, setEvent] = useState('all'),
    [sort, setSort] = useState('spend'),
    [detail, setDetail] = useState<any>(null),
    [draft, setDraft] = useState<any>(null),
    [notice, setNotice] = useState('')
  const kinds = Array.from(
    new Map(
      campaigns.map((c) => [
        `${c.platform}:${campaignResult(c).key}`,
        `${sourceLabel(c.platform)} · ${campaignResult(c).label}`,
      ]),
    ).entries(),
  )
  const filtered = campaigns
    .filter(
      (c) =>
        (!search ||
          String(c.name)
            .toLocaleLowerCase('pt-BR')
            .includes(search.toLocaleLowerCase('pt-BR'))) &&
        (platform === 'all' || c.platform === platform) &&
        (delivery === 'all' || statusLabel(c.status) === delivery) &&
        (event === 'all' || `${c.platform}:${campaignResult(c).key}` === event),
    )
    .sort((a, b) =>
      sort === 'cost'
        ? (ratio(a.spend, campaignResult(a).value) ?? Infinity) -
          (ratio(b.spend, campaignResult(b).value) ?? Infinity)
        : sort === 'ctr'
          ? (ratio(b.clicks, b.impressions) || 0) -
            (ratio(a.clicks, a.impressions) || 0)
          : sort === 'results'
            ? (campaignResult(b).value || 0) - (campaignResult(a).value || 0)
            : Number(b.spend) - Number(a.spend),
    )
  const openAction = (campaign: any, action: string) =>
    setDraft({
      campaign,
      action,
      source: sources.find((s) => s.platform === campaign.platform),
    })
  return (
    <div className="space-y-5">
      <SectionTitle
        title="Campanhas, com contexto para decidir"
        detail="Entrega e resultado são informações diferentes: uma campanha pode estar pausada e ter registrado resultados no período."
        action={
          <Button
            variant="soft"
            size="sm"
            onClick={() => exportCampaigns(filtered)}
            disabled={!filtered.length}
          >
            Exportar campanhas
          </Button>
        }
      />
      <Card>
        <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
          <label className="text-xs text-ink-2">
            Buscar campanha
            <input
              className={`${inputClass} w-full block mt-1`}
              placeholder="Nome da campanha"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label className="text-xs text-ink-2">
            Canal
            <select
              className={`${inputClass} w-full block mt-1`}
              value={platform}
              onChange={(e) => {
                setPlatform(e.target.value)
                setEvent('all')
              }}
            >
              <option value="all">Todos os canais</option>
              {sources.map((s) => (
                <option key={s.platform} value={s.platform}>
                  {sourceLabel(s.platform)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-ink-2">
            Entrega
            <select
              className={`${inputClass} w-full block mt-1`}
              value={delivery}
              onChange={(e) => setDelivery(e.target.value)}
            >
              <option value="all">Todas</option>
              {[...new Set(campaigns.map((c) => statusLabel(c.status)))].map(
                (label) => (
                  <option key={label}>{label}</option>
                ),
              )}
            </select>
          </label>
          <label className="text-xs text-ink-2">
            Tipo de resultado
            <select
              className={`${inputClass} w-full block mt-1`}
              value={event}
              onChange={(e) => {
                setEvent(e.target.value)
                setSort('spend')
              }}
            >
              <option value="all">Todos os resultados</option>
              {kinds.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-ink-2">
            Ordenar
            <select
              className={`${inputClass} w-full block mt-1`}
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="spend">Maior investimento</option>
              <option value="ctr">Maior CTR</option>
              <option
                value="cost"
                disabled={event === 'all' && kinds.length > 1}
              >
                Menor custo por resultado
              </option>
              <option
                value="results"
                disabled={event === 'all' && kinds.length > 1}
              >
                Maior volume de resultado
              </option>
            </select>
          </label>
        </div>
        <p className="text-xs text-ink-2 mt-3">
          {count(filtered.length)}{' '}
          {filtered.length === 1 ? 'campanha exibida' : 'campanhas exibidas'} ·
          para comparar custo ou volume, escolha um mesmo tipo de resultado.
        </p>
      </Card>
      {notice && <Notice>{notice}</Notice>}
      {!filtered.length ? (
        <EmptyPanel
          title="Nenhuma campanha neste filtro"
          detail="Confira o período e os filtros. Se a conta ainda está carregando, as campanhas aparecerão quando a consulta terminar."
        />
      ) : (
        <Card>
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-line text-xs text-ink-2">
                  {[
                    'Campanha',
                    'Entrega',
                    'Investimento',
                    'Resultado principal',
                    'Custo / resultado',
                    'CTR',
                    'Leitura',
                  ].map((label) => (
                    <th
                      key={label}
                      scope="col"
                      className="py-3 px-3 first:pl-0 whitespace-nowrap"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const result = campaignResult(c),
                    signal = efficiencySignal(c, campaigns)
                  return (
                    <tr
                      key={c.platform + c.id}
                      className="border-b border-line last:border-0 align-top"
                    >
                      <th
                        scope="row"
                        className="py-4 pr-3 min-w-[220px] max-w-xs font-normal"
                      >
                        <button
                          onClick={() => setDetail(c)}
                          className="font-semibold text-blue text-left break-words"
                        >
                          {c.name}
                        </button>
                        <p className="text-xs text-ink-2 mt-1">
                          {sourceLabel(c.platform)} ·{' '}
                          {campaignObjectiveLabel(c.objective || c.channelType)}
                        </p>
                      </th>
                      <td className="p-3 whitespace-nowrap">
                        <Badge
                          tone={
                            statusLabel(c.status) === 'Ativa'
                              ? 'good'
                              : 'neutral'
                          }
                        >
                          {statusLabel(c.status)}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono whitespace-nowrap">
                        {money(c.spend)}
                      </td>
                      <td className="p-3">
                        <strong>{count(result.value)}</strong>
                        <span className="block text-xs text-ink-2 mt-1 max-w-[160px]">
                          {result.label}
                        </span>
                      </td>
                      <td className="p-3 font-mono whitespace-nowrap">
                        {money(ratio(c.spend, result.value))}
                      </td>
                      <td className="p-3 font-mono whitespace-nowrap">
                        {percent(ratio(c.clicks, c.impressions))}
                      </td>
                      <td className="p-3 max-w-[190px]">
                        <Badge tone={signal.tone as any}>{signal.label}</Badge>
                        <button
                          className="text-xs text-blue block mt-2"
                          onClick={() => setDetail(c)}
                        >
                          Ver detalhes →
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="lg:hidden space-y-4">
            {filtered.map((c) => {
              const result = campaignResult(c)
              return (
                <article
                  key={c.platform + c.id}
                  className="border border-line rounded-lg p-4"
                >
                  <div className="flex justify-between gap-3">
                    <p className="text-xs text-ink-2">
                      {sourceLabel(c.platform)}
                    </p>
                    <Badge
                      tone={
                        statusLabel(c.status) === 'Ativa' ? 'good' : 'neutral'
                      }
                    >
                      {statusLabel(c.status)}
                    </Badge>
                  </div>
                  <button
                    onClick={() => setDetail(c)}
                    className="font-semibold text-ink text-left mt-3 break-words"
                  >
                    {c.name}
                  </button>
                  <dl className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <dt className="text-xs text-ink-2">Investimento</dt>
                      <dd className="text-base font-semibold mt-1">
                        {money(c.spend)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-ink-2">{result.label}</dt>
                      <dd className="text-base font-semibold mt-1">
                        {count(result.value)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-ink-2">
                        Custo por resultado
                      </dt>
                      <dd className="text-sm mt-1">
                        {money(ratio(c.spend, result.value))}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-ink-2">CTR</dt>
                      <dd className="text-sm mt-1">
                        {percent(ratio(c.clicks, c.impressions))}
                      </dd>
                    </div>
                  </dl>
                  <button
                    onClick={() => setDetail(c)}
                    className="text-xs font-semibold text-blue mt-4"
                  >
                    Detalhar campanha →
                  </button>
                </article>
              )
            })}
          </div>
        </Card>
      )}
      {detail && !draft && (
        <CampaignDetail
          key={detail.platform + detail.id}
          campaign={detail}
          rows={campaigns}
          source={sources.find((s) => s.platform === detail.platform)}
          period={period}
          onClose={() => setDetail(null)}
          onAction={(action) => openAction(detail, action)}
        />
      )}
      {draft && (
        <CampaignAction
          draft={draft}
          clientName={clientName}
          onClose={() => setDraft(null)}
          onSuccess={(message) => {
            setDraft(null)
            setDetail(null)
            setNotice(message)
            onRefresh()
          }}
        />
      )}
    </div>
  )
}
function CampaignDetail({
  campaign: c,
  rows,
  source,
  period,
  onClose,
  onAction,
}: {
  campaign: any
  rows: any[]
  source?: PerformanceSource
  period: any
  onClose: () => void
  onAction: (action: string) => void
}) {
  const [breakdown, setBreakdown] = useState<any>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(''),
    result = campaignResult(c),
    signal = efficiencySignal(c, rows)
  async function load() {
    setLoading(true)
    setError('')
    try {
      setBreakdown(
        await performanceFetch('/api/ads-data/campaign-breakdown', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignId: c.id,
            platform: c.platform,
            accountId: source?.accountId,
            ...period,
          }),
        }),
      )
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }
  return (
    <Dialog title={c.name} onClose={onClose}>
      <div className="flex justify-between gap-4 flex-wrap">
        <div>
          <Badge tone="blue">{sourceLabel(c.platform)}</Badge>
          <span className="ml-2">
            <Badge tone="neutral">{statusLabel(c.status)}</Badge>
          </span>
          <p className="text-xs text-ink-2 mt-2">
            Conta {source?.accountId} · campanha {c.id}
          </p>
        </div>
        <a
          href={managerUrl(c, source)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue font-semibold"
        >
          Abrir no gerenciador ↗
        </a>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          ['Investimento', money(c.spend)],
          [result.label, count(result.value)],
          ['Custo por resultado', money(ratio(c.spend, result.value))],
          ['Cliques', count(c.clicks)],
          ['CTR', percent(ratio(c.clicks, c.impressions))],
          ['CPC', money(ratio(c.spend, c.clicks))],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-ink-2">{label}</p>
            <p className="text-xl font-semibold mt-1">{value}</p>
          </div>
        ))}
      </div>
      <Notice>
        <strong>{signal.label}.</strong> {signal.note}
      </Notice>
      {c.resultBreakdown?.length > 0 && (
        <DataTable
          caption="Eventos registrados na campanha"
          columns={[
            { key: 'label', label: 'Evento' },
            { key: 'value', label: 'Volume', render: (r) => count(r.value) },
            {
              key: 'cost',
              label: 'Custo / evento',
              render: (r) => money(r.cost),
            },
          ]}
          rows={c.resultBreakdown.filter(
            (r: any) => !['reach', 'impression'].includes(r.key),
          )}
        />
      )}
      <div className="flex gap-3 flex-wrap">
        <Button variant="soft" onClick={load} disabled={loading}>
          {loading ? 'Consultando…' : 'Ver grupos, regiões e posicionamentos'}
        </Button>
        {['Ativa', 'Pausada'].includes(statusLabel(c.status)) && (
          <Button
            variant="secondary"
            onClick={() =>
              onAction(statusLabel(c.status) === 'Pausada' ? 'resume' : 'pause')
            }
          >
            {statusLabel(c.status) === 'Pausada'
              ? 'Reativar campanha'
              : 'Pausar campanha'}
          </Button>
        )}
        <Button variant="secondary" onClick={() => onAction('set_budget')}>
          Revisar orçamento
        </Button>
      </div>
      {error && <Notice tone="bad">{error}</Notice>}
      {breakdown && (
        <>
          {breakdown.partial && (
            <Notice tone="warn">
              Alguns recortes não foram disponibilizados ou atingiram o limite
              de leitura. Os registros disponíveis foram preservados.
            </Notice>
          )}
          <p className="text-xs text-ink-2">
            Recortes da campanha neste mesmo período. Não some os quadros abaixo
            entre si.
          </p>
          {[
            ['adsets', 'Conjuntos / grupos'],
            ['placements', 'Posicionamentos e redes'],
            ['geo', 'Regiões'],
          ].map(([key, label]) => (
            <div key={key}>
              <h3 className="text-sm font-semibold mb-2">{label}</h3>
              {breakdown[key]?.length ? (
                <DataTable
                  caption={label}
                  columns={[
                    {
                      key: 'name',
                      label: 'Recorte',
                      render: (r) =>
                        r.name ||
                        r.region ||
                        [r.platform, r.position].filter(Boolean).join(' · '),
                    },
                    {
                      key: 'spend',
                      label: 'Investimento',
                      render: (r) => money(r.spend),
                    },
                    {
                      key: 'results',
                      label: 'Resultado',
                      render: (r) => (
                        <span>
                          {count(r.results ?? r.leads)}
                          <span className="text-xs block">
                            {r.resultLabel || result.label}
                          </span>
                        </span>
                      ),
                    },
                    {
                      key: 'cost',
                      label: 'Custo por resultado',
                      render: (r) =>
                        money(ratio(r.spend, r.results ?? r.leads)),
                    },
                  ]}
                  rows={breakdown[key]}
                />
              ) : (
                <p className="text-sm text-ink-2">
                  Recorte sem leitura disponível.
                </p>
              )}
            </div>
          ))}
        </>
      )}
    </Dialog>
  )
}
function CampaignAction({
  draft,
  clientName,
  onClose,
  onSuccess,
}: {
  draft: any
  clientName: string
  onClose: () => void
  onSuccess: (message: string) => void
}) {
  const c = draft.campaign,
    [budget, setBudget] = useState(
      c.dailyBudget != null ? String(c.dailyBudget) : '',
    ),
    [preview, setPreview] = useState<any>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [reviewed, setReviewed] = useState(false)
  const endpoint =
    c.platform === 'google'
      ? '/api/google/campaign/action'
      : '/api/meta/campaign/action'
  const payload = {
    action: draft.action,
    id: String(c.id),
    accountId: draft.source?.accountId,
    clientName,
    campaignName: c.name,
    ...(draft.action === 'set_budget' ? { targetBudget: Number(budget) } : {}),
  }
  useEffect(() => {
    if (
      draft.action === 'set_budget' &&
      (!Number.isFinite(Number(budget)) || Number(budget) <= 0)
    ) {
      setLoading(false)
      setPreview(null)
      return
    }
    const controller = new AbortController(),
      timer = setTimeout(() => {
        setLoading(true)
        setError('')
        setPreview(null)
        performanceFetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, dryRun: true }),
          signal: controller.signal,
        })
          .then((data) => {
            if (!controller.signal.aborted) setPreview(data)
          })
          .catch((e) => {
            if (!controller.signal.aborted) setError(e.message)
          })
          .finally(() => {
            if (!controller.signal.aborted) setLoading(false)
          })
      }, 300)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [budget])
  async function confirm() {
    if (!reviewed || !preview?.success) return
    setBusy(true)
    setError('')
    try {
      const result = await performanceFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      onSuccess(
        result.message ||
          'Campanha atualizada. Consulte os dados novamente para acompanhar a entrega.',
      )
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog
      title={
        draft.action === 'set_budget'
          ? 'Revisar orçamento da campanha'
          : draft.action === 'pause'
            ? 'Pausar campanha'
            : 'Reativar campanha'
      }
      onClose={onClose}
    >
      <p className="font-semibold">{c.name}</p>
      <p className="text-sm text-ink-2">
        {sourceLabel(c.platform)} · conta {draft.source?.accountId}
      </p>
      {draft.action === 'set_budget' && (
        <label className="text-sm block">
          Novo orçamento diário total (R$)
          <input
            type="number"
            min="0.01"
            step="0.01"
            className={`${inputClass} block mt-2 w-full`}
            value={budget}
            onChange={(e) => {
              setBudget(e.target.value)
              setReviewed(false)
            }}
          />
        </label>
      )}
      {loading ? (
        <Pending>Consultando o impacto da alteração…</Pending>
      ) : preview?.success ? (
        <Notice>
          {preview.plan ||
            preview.message ||
            'A alteração foi validada para esta campanha.'}
        </Notice>
      ) : null}
      {error && <Notice tone="bad">{error}</Notice>}
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={reviewed}
          onChange={(e) => setReviewed(e.target.checked)}
          className="mt-1"
        />
        <span>
          Revisei a conta, a campanha e a alteração.{' '}
          {draft.action === 'resume'
            ? 'Entendo que reativar permite consumir a verba configurada.'
            : 'Confirmo que desejo aplicar esta alteração na conta de anúncios.'}
        </span>
      </label>
      <div className="flex gap-3">
        <Button
          onClick={confirm}
          disabled={busy || loading || !reviewed || !preview?.success}
        >
          {busy ? 'Aplicando…' : 'Confirmar alteração'}
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </Dialog>
  )
}
