'use client'
import { useState } from 'react'
import { Card, Badge, Button } from '@/components/dashboard/v2'
import {
  datasetEvent,
  eventOptions,
  ratio,
  sourceLabel,
  type PerformanceSource,
  resultGroups,
  campaignObjectiveLabel,
} from '@/lib/performance/model'
import { EVENT_LABELS } from '@/lib/performance/observations'
import {
  MetricCard,
  SectionTitle,
  Notice,
  Pending,
  EmptyPanel,
  DataTable,
  inputClass,
  count,
  money,
  percent,
} from './shared'
const aliases: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  messenger: 'Messenger',
  audience_network: 'Audience Network',
  feed: 'Feed',
  story: 'Stories',
  instagram_stories: 'Stories',
  facebook_stories: 'Stories',
  instagram_reels: 'Reels',
  facebook_reels: 'Reels',
  marketplace: 'Marketplace',
  video_feeds: 'Feed de vídeos',
  right_hand_column: 'Coluna da direita',
  female: 'Feminino',
  male: 'Masculino',
  unknown: 'Não informado',
  mobile: 'Celular',
  desktop: 'Computador',
  tablet: 'Tablet',
  iphone: 'iPhone',
  android_smartphone: 'Celular Android',
  android_tablet: 'Tablet Android',
  MOBILE: 'Celular',
  DESKTOP: 'Computador',
  TABLET: 'Tablet',
  CONNECTED_TV: 'TV conectada',
  MALE: 'Masculino',
  FEMALE: 'Feminino',
  UNDETERMINED: 'Não informado',
  MONDAY: 'Segunda-feira',
  TUESDAY: 'Terça-feira',
  WEDNESDAY: 'Quarta-feira',
  THURSDAY: 'Quinta-feira',
  FRIDAY: 'Sexta-feira',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
  SEARCH: 'Pesquisa',
  SEARCH_PARTNERS: 'Parceiros de pesquisa',
  CONTENT: 'Display',
  YOUTUBE_SEARCH: 'YouTube · busca',
  YOUTUBE_WATCH: 'YouTube',
  MIXED: 'Misto',
  PERFORMANCE_MAX: 'Performance Max',
  DISPLAY: 'Display',
  VIDEO: 'Vídeo',
  DEMAND_GEN: 'Demand Gen',
  SHOPPING: 'Shopping',
}
export const studyLabel = (label: string) =>
  label
    .split(' · ')
    .map(
      (part) =>
        aliases[part] ||
        campaignObjectiveLabel(part.replace(/^AGE_RANGE_/, '')).replace(
          /_/g,
          ' ',
        ),
    )
    .join(' · ')
function EventTable({
  set,
  eventKey,
  platform,
}: {
  set: any
  eventKey: string
  platform: string
}) {
  if (!set || set.status !== 'available')
    return (
      <Notice>
        {set?.message ||
          'Este recorte não está disponível para a conta no período selecionado.'}
      </Notice>
    )
  const rows = [...set.rows].sort((a: any, b: any) => b.spend - a.spend),
    spend = rows.reduce((n: number, r: any) => n + r.spend, 0),
    events = rows.reduce(
      (n: number, r: any) => n + (datasetEvent(r, eventKey) || 0),
      0,
    )
  return (
    <>
      {set.truncated && (
        <Notice tone="warn">
          O recorte atingiu o limite de leitura. Os números abaixo representam
          somente os registros retornados.
        </Notice>
      )}
      {rows.length ? (
        <DataTable
          caption={`${sourceLabel(platform)} · ${EVENT_LABELS[eventKey] || eventKey}`}
          rows={rows.slice(0, 100)}
          columns={[
            {
              key: 'label',
              label: 'Recorte',
              render: (r) => studyLabel(r.label),
            },
            {
              key: 'spend',
              label: 'Investimento',
              render: (r) => money(r.spend),
            },
            {
              key: 'share',
              label: '% da verba',
              render: (r) => percent(ratio(r.spend, spend)),
            },
            {
              key: 'events',
              label: EVENT_LABELS[eventKey] || 'Eventos',
              render: (r) => count(datasetEvent(r, eventKey)),
            },
            {
              key: 'eventShare',
              label: '% dos eventos',
              render: (r) =>
                percent(
                  datasetEvent(r, eventKey) === null
                    ? null
                    : ratio(datasetEvent(r, eventKey), events),
                ),
            },
            {
              key: 'cost',
              label: 'Custo / evento',
              render: (r) => money(ratio(r.spend, datasetEvent(r, eventKey))),
            },
            {
              key: 'ctr',
              label: 'CTR',
              render: (r) => percent(ratio(r.clicks, r.impressions)),
            },
          ]}
        />
      ) : (
        <p className="text-sm text-ink-2 py-5">
          Nenhuma entrega retornada para este recorte.
        </p>
      )}
    </>
  )
}
export function Audience({
  study,
  loading,
  error,
}: {
  study: any
  loading: boolean
  error: string
}) {
  const [platform, setPlatform] = useState('meta'),
    [dimension, setDimension] = useState('demographics'),
    [selectedEvent, setEvent] = useState('')
  const sources = study?.sources || [],
    source = sources.find((s: any) => s.platform === platform) || sources[0],
    p = source?.platform || platform
  const dimensions =
    p === 'meta'
      ? [
          ['demographics', 'Idade e gênero'],
          ['regions', 'Regiões'],
          ['placements', 'Posicionamentos'],
          ['devices', 'Dispositivos'],
          ['hours', 'Horários'],
        ]
      : [
          ['ages', 'Faixa etária'],
          ['genders', 'Gênero'],
          ['devices', 'Dispositivos'],
          ['hours', 'Horários'],
          ['weekdays', 'Dias da semana'],
          ['networks', 'Redes de veiculação'],
        ]
  const key = dimensions.some(([k]) => k === dimension)
      ? dimension
      : dimensions[0][0],
    set = source?.datasets?.[key],
    rows = set?.rows || []
  const options = eventOptions(rows),
    event = options.some((o) => o.key === selectedEvent)
      ? selectedEvent
      : options.find((o) =>
          rows.some((r: any) => Number(r.events?.[o.key]) > 0),
        )?.key ||
        options[0]?.key ||
        'messages_started'
  const candidates = rows.filter(
      (r: any) => Number(datasetEvent(r, event)) >= 10,
    ),
    best = [...candidates].sort(
      (a, b) =>
        (ratio(a.spend, datasetEvent(a, event)) || 0) -
        (ratio(b.spend, datasetEvent(b, event)) || 0),
    )[0],
    volume = [...rows].sort(
      (a: any, b: any) =>
        (datasetEvent(b, event) || 0) - (datasetEvent(a, event) || 0),
    )[0]
  const spend = rows.reduce((n: number, r: any) => n + r.spend, 0),
    events = rows.reduce(
      (n: number, r: any) => n + (datasetEvent(r, event) || 0),
      0,
    )
  return (
    <div className="space-y-5">
      <SectionTitle
        title="Estudo de audiência e veiculação"
        detail="Entenda quem recebeu os anúncios, onde a verba foi entregue e quais recortes registraram o evento escolhido. Os dados são observações; não comprovam intenção individual nem causalidade."
      />
      {loading && (
        <Pending>Consultando recortes reais de audiência e entrega…</Pending>
      )}
      {error && <Notice tone="bad">{error}</Notice>}
      <div className="flex gap-3 flex-wrap">
        <label className="text-xs text-ink-2">
          Conta
          <select
            aria-label="Conta da audiência"
            className={`${inputClass} block mt-1`}
            value={p}
            onChange={(e) => {
              setPlatform(e.target.value)
              setEvent('')
            }}
          >
            {sources.map((s: any) => (
              <option key={s.platform} value={s.platform}>
                {sourceLabel(s.platform)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-ink-2">
          Estudar por
          <select
            aria-label="Dimensão da audiência"
            className={`${inputClass} block mt-1`}
            value={key}
            onChange={(e) => setDimension(e.target.value)}
          >
            {dimensions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-ink-2">
          Evento para comparar
          <select
            aria-label="Evento da audiência"
            className={`${inputClass} block mt-1 max-w-full`}
            value={event}
            onChange={(e) => setEvent(e.target.value)}
          >
            {options.length ? (
              options.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))
            ) : (
              <option value={event}>Sem evento disponível</option>
            )}
          </select>
        </label>
      </div>
      {source?.status === 'unavailable' ? (
        <Notice tone="warn">{source.message}</Notice>
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-3">
            <MetricCard
              label="Menor custo observado"
              value={
                best
                  ? money(ratio(best.spend, datasetEvent(best, event)))
                  : 'Aguardando volume'
              }
              note={
                best
                  ? `${studyLabel(best.label)} · ${count(datasetEvent(best, event))} eventos. Comparação exploratória entre recortes com pelo menos 10 eventos.`
                  : 'Nenhum recorte tem 10 eventos para esta comparação exploratória.'
              }
            />
            <MetricCard
              label="Maior volume de eventos"
              value={
                volume && Number(datasetEvent(volume, event)) > 0
                  ? count(datasetEvent(volume, event))
                  : '—'
              }
              note={
                volume
                  ? `${studyLabel(volume.label)}. Volume não confirma qualidade comercial.`
                  : 'Sem leitura disponível.'
              }
            />
            <MetricCard
              label="Custo ponderado deste recorte"
              value={money(ratio(spend, events))}
              note="Investimento dividido pelos eventos do recorte exibido; não é média simples dos custos."
            />
          </div>
          <Card>
            <SectionTitle
              title={dimensions.find(([k]) => k === key)?.[1] || 'Recorte'}
              detail={`${sourceLabel(p)} · ${EVENT_LABELS[event] || 'Evento não informado'}. Não some este quadro com outro recorte: são visões da mesma entrega.`}
            />
            <EventTable set={set} eventKey={event} platform={p} />
          </Card>
        </>
      )}
      <Notice>
        Participações são calculadas sobre os registros retornados em cada
        recorte. Diferenças de custo podem refletir objetivo da campanha,
        oferta, formato, rastreamento, volume e janela de atribuição. Faixas
        demográficas podem ser agregadas ou limitadas pelas regras de
        privacidade. Valide a hipótese em um teste antes de excluir um público
        ou aumentar a verba.
      </Notice>
    </div>
  )
}
export function Channels({
  sources,
  study,
  loading,
  error,
}: {
  sources: PerformanceSource[]
  study: any
  loading: boolean
  error: string
}) {
  const good = sources.filter((s) => s.success),
    total = good.reduce((n, s) => n + Number(s.totals?.spend || 0), 0)
  return (
    <div className="space-y-5">
      <SectionTitle
        title="Onde a verba está trabalhando"
        detail="Distribuição real do investimento, custo do tráfego e tipos de resultado. Campanhas de conversa e de compra são avaliadas com seus próprios eventos."
      />
      {!good.length ? (
        <EmptyPanel
          title="Sem leitura de canais disponível"
          detail="As comparações aparecerão quando uma conta selecionada retornar dados do período."
        />
      ) : (
        <>
          <Card>
            <SectionTitle
              title="Distribuição do investimento"
              detail={`${money(total)} nas fontes disponíveis. Fontes que falharam não são tratadas como investimento zero.`}
            />
            <div
              className="h-4 rounded-full bg-canvas-2 overflow-hidden flex"
              role="img"
              aria-label="Participação do investimento por canal"
            >
              {good.map((s) => (
                <div
                  key={s.platform}
                  className={
                    s.platform === 'meta' ? 'bg-blue' : 'bg-emerald-500'
                  }
                  style={{
                    width: `${total ? (Number(s.totals?.spend || 0) / total) * 100 : 0}%`,
                  }}
                />
              ))}
            </div>
            <div className="flex gap-5 flex-wrap mt-4 text-sm">
              {good.map((s) => (
                <span key={s.platform} className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${s.platform === 'meta' ? 'bg-blue' : 'bg-emerald-500'}`}
                  />
                  {sourceLabel(s.platform)}{' '}
                  <strong>{percent(ratio(s.totals?.spend, total))}</strong>
                </span>
              ))}
            </div>
          </Card>
          <div className="grid lg:grid-cols-2 gap-4">
            {good.map((source) => (
              <Card key={source.platform}>
                <SectionTitle
                  title={sourceLabel(source.platform)}
                  detail={`Conta ${source.accountId}`}
                  action={
                    <Badge tone="neutral">
                      {count(source.campaigns.length)}{' '}
                      {source.campaigns.length === 1 ? 'campanha' : 'campanhas'}
                    </Badge>
                  }
                />
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-ink-2">Investimento</p>
                    <p className="text-lg font-semibold text-ink mt-1">
                      {money(source.totals?.spend)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-2">CPC</p>
                    <p className="text-lg font-semibold text-ink mt-1">
                      {money(
                        ratio(source.totals?.spend, source.totals?.clicks),
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-2">CTR</p>
                    <p className="text-lg font-semibold text-ink mt-1">
                      {percent(
                        ratio(
                          source.totals?.clicks,
                          source.totals?.impressions,
                        ),
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-5 border-t border-line pt-4 space-y-3">
                  {resultGroups(source.campaigns).map((group) => (
                    <div
                      key={group.key + group.label}
                      className="flex justify-between gap-3 text-sm"
                    >
                      <span className="text-ink-2">
                        {group.label}
                        <span className="block text-xs mt-1">
                          {count(group.campaigns)}{' '}
                          {group.campaigns === 1 ? 'campanha' : 'campanhas'} ·
                          custo por evento{' '}
                          {money(ratio(group.spend, group.value))}
                        </span>
                      </span>
                      <strong className="text-ink">{count(group.value)}</strong>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
      {good.some((s) => s.platform === 'google') && (
        <Card>
          <SectionTitle
            title="Tipos de campanha no Google"
            detail="Pesquisa, Performance Max, Display e outros tipos reportados pela própria conta."
          />
          <DataTable
            caption="Tipos de campanha Google"
            columns={[
              { key: 'label', label: 'Tipo' },
              {
                key: 'spend',
                label: 'Investimento',
                render: (r) => money(r.spend),
              },
              {
                key: 'count',
                label: 'Campanhas',
                render: (r) => count(r.count),
              },
            ]}
            rows={Object.values(
              good
                .find((s) => s.platform === 'google')!
                .campaigns.reduce((map: any, c: any) => {
                  const key = c.channelType || 'Não informado'
                  map[key] ||= { label: studyLabel(key), spend: 0, count: 0 }
                  map[key].spend += Number(c.spend || 0)
                  map[key].count++
                  return map
                }, {}),
            )}
          />
        </Card>
      )}
      <SectionTitle
        title="Dentro de cada canal"
        detail="Redes e posicionamentos realmente utilizados. Os quadros detalham a verba do canal; não são novos canais para adicionar ao total."
      />
      {loading && <Pending>Consultando posicionamentos e redes…</Pending>}
      {error && <Notice tone="bad">{error}</Notice>}
      {study?.sources?.map((source: any) => (
        <Placement key={source.platform} source={source} />
      ))}
    </div>
  )
}
function Placement({ source }: { source: any }) {
  const set =
      source.datasets?.[source.platform === 'meta' ? 'placements' : 'networks'],
    options = eventOptions(set?.rows || []),
    [selected, setSelected] = useState(''),
    event =
      options.find((o) => o.key === selected)?.key ||
      options.find((o) =>
        (set?.rows || []).some((r: any) => Number(r.events?.[o.key]) > 0),
      )?.key ||
      options[0]?.key ||
      'messages_started'
  return (
    <Card>
      <SectionTitle
        title={sourceLabel(source.platform)}
        action={
          options.length > 0 ? (
            <label
              className="sr-only"
              htmlFor={`placement-event-${source.platform}`}
            >
              Evento dos posicionamentos
            </label>
          ) : null
        }
      />
      {options.length > 0 && (
        <select
          id={`placement-event-${source.platform}`}
          className={`${inputClass} mb-3 max-w-full`}
          value={event}
          onChange={(e) => setSelected(e.target.value)}
        >
          {options.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      )}
      <EventTable set={set} eventKey={event} platform={source.platform} />
    </Card>
  )
}
