'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Card, Badge, Button } from '@/components/dashboard/v2'
import { FORMAT_LABELS, type CreativeFormat } from '@/lib/performance/creative'
import {
  ratio,
  sourceLabel,
  statusLabel,
  type PerformanceSource,
} from '@/lib/performance/model'
import { EVENT_LABELS } from '@/lib/performance/observations'
import { performanceFetch } from '@/lib/performance/usePerformance'
import {
  count,
  money,
  percent,
  SectionTitle,
  Pending,
  Notice,
  EmptyPanel,
  inputClass,
} from './shared'
import { Dialog } from './Campaigns'
function Preview({
  creative: c,
  large = false,
}: {
  creative: any
  large?: boolean
}) {
  const [broken, setBroken] = useState(false)
  return (
    <div
      className={`relative bg-canvas-2 flex items-center justify-center ${large ? 'h-80' : 'h-52'}`}
    >
      {c.imageUrl && !broken ? (
        <img
          src={c.imageUrl}
          alt={`Prévia de ${c.label}`}
          loading="lazy"
          onError={() => setBroken(true)}
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="p-5 text-center">
          <p className="text-xs uppercase tracking-widest text-ink-2">
            {FORMAT_LABELS[c.format as CreativeFormat] || FORMAT_LABELS.unknown}
          </p>
          {c.format === 'text' ? (
            <p className="text-blue font-semibold text-sm mt-3 line-clamp-3">
              {c.title || c.label}
            </p>
          ) : (
            <p className="text-xs text-ink-2 mt-2">
              Prévia visual indisponível
            </p>
          )}
        </div>
      )}
      {c.format === 'video' && (
        <div
          className="absolute bottom-3 right-3 rounded-full bg-ink text-white w-9 h-9 flex items-center justify-center"
          aria-label="Anúncio em vídeo"
        >
          ▶
        </div>
      )}
    </div>
  )
}
export default function Creatives({
  study,
  loading,
  error,
  sources,
  client,
  period,
}: {
  study: any
  loading: boolean
  error: string
  sources: PerformanceSource[]
  client: any
  period: any
}) {
  const [platform, setPlatform] = useState('all'),
    [format, setFormat] = useState('all'),
    [search, setSearch] = useState(''),
    [sort, setSort] = useState('spend'),
    [open, setOpen] = useState<any>(null),
    [cache, setCache] = useState<Record<string, any>>({})
  const all = (study?.sources || []).flatMap(
      (source: any) => source.datasets?.creatives?.rows || [],
    ),
    rows = all
      .filter(
        (c: any) =>
          (platform === 'all' || c.platform === platform) &&
          (format === 'all' || c.format === format) &&
          (!search ||
            `${c.label} ${c.title} ${c.body}`
              .toLowerCase()
              .includes(search.toLowerCase())),
      )
      .sort((a: any, b: any) =>
        sort === 'ctr'
          ? (ratio(b.clicks, b.impressions) || 0) -
            (ratio(a.clicks, a.impressions) || 0)
          : b.spend - a.spend,
      )
  return (
    <div className="space-y-5">
      <SectionTitle
        title="Criativos que estão recebendo a verba"
        detail="Vídeo, imagem, carrossel, texto e anúncios dinâmicos são identificados pelos metadados da plataforma. Uma miniatura de vídeo continua sendo vídeo."
      />
      {loading && (
        <Pending>Buscando anúncios, formatos e desempenho do período…</Pending>
      )}
      {error && <Notice tone="bad">{error}</Notice>}
      {study?.sources?.map((source: any) =>
        source.status === 'unavailable' ||
        source.datasets?.creatives?.status === 'unavailable' ? (
          <Notice key={source.platform} tone="warn">
            {sourceLabel(source.platform)}: os criativos não puderam ser
            consultados agora.
          </Notice>
        ) : source.datasets?.creatives?.truncated ? (
          <Notice key={source.platform} tone="warn">
            {sourceLabel(source.platform)}: a consulta atingiu o limite de
            anúncios. A lista representa os registros retornados.
          </Notice>
        ) : null,
      )}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(FORMAT_LABELS) as [CreativeFormat, string][]).map(
          ([key, label]) => {
            const total = all.filter((c: any) => c.format === key).length
            return total > 0 ? (
              <button
                key={key}
                onClick={() => setFormat(format === key ? 'all' : key)}
                aria-pressed={format === key}
                className={`border rounded-lg px-3 py-2 text-xs ${format === key ? 'bg-blue-soft border-blue text-blue' : 'bg-paper border-line text-ink-2'}`}
              >
                {label} · {total}
              </button>
            ) : null
          },
        )}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="text-xs text-ink-2">
          Buscar anúncio
          <input
            className={`${inputClass} w-full mt-1`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nome ou texto"
          />
        </label>
        <label className="text-xs text-ink-2">
          Canal
          <select
            className={`${inputClass} w-full mt-1`}
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            <option value="all">Todos</option>
            {sources.map((s) => (
              <option key={s.platform} value={s.platform}>
                {sourceLabel(s.platform)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-ink-2">
          Formato
          <select
            className={`${inputClass} w-full mt-1`}
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          >
            <option value="all">Todos os formatos</option>
            {Object.entries(FORMAT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-ink-2">
          Ordenar
          <select
            className={`${inputClass} w-full mt-1`}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="spend">Maior investimento</option>
            <option value="ctr">Maior CTR</option>
          </select>
        </label>
      </div>
      {!loading && !rows.length ? (
        <EmptyPanel
          title="Nenhum criativo neste filtro"
          detail="Altere os filtros ou confira as contas e o período selecionados. Falta de prévia não faz o anúncio ser classificado como imagem."
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map((c: any) => {
            const event =
                c.platform === 'google' ? 'google_conversions' : c.resultType,
              result = c.results,
              label =
                c.resultLabel || EVENT_LABELS[event] || 'Resultado principal'
            return (
              <article
                key={c.platform + c.id}
                className="rounded-xl border border-line bg-paper overflow-hidden"
              >
                <button
                  className="block w-full text-left"
                  onClick={() => setOpen(c)}
                  aria-label={`Detalhar ${c.label}`}
                >
                  <Preview creative={c} />
                </button>
                <div className="p-4 space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    <Badge tone={c.format === 'video' ? 'blue' : 'neutral'}>
                      {FORMAT_LABELS[c.format as CreativeFormat] ||
                        FORMAT_LABELS.unknown}
                    </Badge>
                    <span className="text-xs text-ink-2">
                      {sourceLabel(c.platform)} · {statusLabel(c.status)}
                    </span>
                  </div>
                  <button
                    className="text-sm font-semibold text-ink text-left line-clamp-2 break-words"
                    onClick={() => setOpen(c)}
                  >
                    {c.label}
                  </button>
                  {c.body && (
                    <p className="text-xs text-ink-2 line-clamp-2">{c.body}</p>
                  )}
                  <div className="grid grid-cols-2 gap-3 border-t border-line pt-3">
                    <div>
                      <p className="text-xs text-ink-2">Investimento</p>
                      <p className="text-base font-semibold mt-1">
                        {money(c.spend)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-2">{label}</p>
                      <p className="text-base font-semibold mt-1">
                        {count(result)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-2">Custo / resultado</p>
                      <p className="text-sm mt-1">
                        {money(ratio(c.spend, result))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-2">CTR</p>
                      <p className="text-sm mt-1">
                        {percent(ratio(c.clicks, c.impressions))}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setOpen(c)}
                    className="text-xs font-semibold text-blue"
                  >
                    Abrir criativo e estudo →
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
      {open && (
        <CreativeDetail
          key={open.platform + open.id}
          creative={open}
          source={sources.find((s) => s.platform === open.platform)}
          client={client}
          period={period}
          cached={cache[open.platform + open.id]}
          onAnalyzed={(value) =>
            setCache((previous) => ({
              ...previous,
              [open.platform + open.id]: value,
            }))
          }
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  )
}
function CreativeDetail({
  creative: c,
  source,
  client,
  period,
  cached,
  onAnalyzed,
  onClose,
}: {
  creative: any
  source?: PerformanceSource
  client: any
  period: any
  cached: any
  onAnalyzed: (value: any) => void
  onClose: () => void
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  async function analyze() {
    if (cached || busy) return
    setBusy(true)
    setError('')
    try {
      const data = await performanceFetch('/api/creative-detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: client.clientData.clientName,
          niche: client.clientData.niche,
          platform: c.platform,
          period,
          creative: {
            ...c,
            name: c.label,
            ctr:
              ratio(c.clicks, c.impressions) !== null
                ? ratio(c.clicks, c.impressions)! * 100
                : null,
            costPerResult: ratio(c.spend, c.results),
          },
        }),
      })
      onAnalyzed(data.detail)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  const manager =
    c.platform === 'meta'
      ? `https://adsmanager.facebook.com/adsmanager/manage/ads?act=${source?.accountId}&selected_ad_ids=${c.id}`
      : `https://ads.google.com/aw/ads?ocid=${source?.accountId}&adId=${c.id}`
  const intent = `Prepare uma variação para ${client.clientData.clientName}. Anúncio original: ${c.label}. Formato: ${FORMAT_LABELS[c.format as CreativeFormat]}. Texto original: ${c.title || ''} ${c.body || ''}. Proponha um novo gancho, mantendo somente os fatos e ofertas confirmados. Vou selecionar as referências de produto no Estúdio.`
  return (
    <Dialog title={c.label} onClose={onClose}>
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <Preview creative={c} large />
          <div className="flex gap-2 mt-3 flex-wrap">
            <Badge tone="blue">
              {FORMAT_LABELS[c.format as CreativeFormat]}
            </Badge>
            <Badge tone="neutral">{sourceLabel(c.platform)}</Badge>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="font-semibold">{c.title || 'Texto do anúncio'}</h3>
          <p className="text-sm whitespace-pre-line text-ink-2">
            {c.body || 'A plataforma não disponibilizou o texto deste anúncio.'}
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['Investimento', money(c.spend)],
              ['CTR', percent(ratio(c.clicks, c.impressions))],
              [c.resultLabel || 'Resultado', count(c.results)],
              ['Custo / resultado', money(ratio(c.spend, c.results))],
              ['Impressões', count(c.impressions)],
              [
                'Frequência',
                c.frequency != null ? `${count(c.frequency)}×` : '—',
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-ink-2">{label}</p>
                <p className="font-semibold text-lg mt-1">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {c.format === 'video' && (
        <Card>
          <SectionTitle
            title="Avanço no vídeo"
            detail="Contagens de reproduções que atingiram cada ponto. Não representam pessoas únicas; campos ausentes não viram zero."
          />
          <div className="grid grid-cols-3 gap-4">
            {[
              ['25% do vídeo', c.video25],
              ['50% do vídeo', c.video50],
              ['95% do vídeo', c.video95],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <p className="text-xs text-ink-2">{label}</p>
                <p className="text-xl font-semibold mt-1">{count(value)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
      <div className="flex gap-4 flex-wrap text-sm">
        <a
          href={c.previewUrl || manager}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-blue"
        >
          {c.previewUrl ? 'Abrir prévia do anúncio' : 'Abrir no gerenciador'} ↗
        </a>
        {c.destinationUrl && (
          <a
            href={c.destinationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue"
          >
            Conferir destino ↗
          </a>
        )}
        <Link
          href={`/criar?mode=creative&intent=${encodeURIComponent(intent.slice(0, 3500))}`}
          className="text-blue font-semibold"
        >
          Preparar variação no Estúdio →
        </Link>
      </div>
      <Card>
        <SectionTitle
          title="Análise de texto e métricas"
          detail="A IA avalia os textos e os números disponíveis. Esta análise não assiste ao vídeo nem verifica a qualidade dos contatos."
          action={
            !cached ? (
              <Button
                size="sm"
                variant="soft"
                onClick={analyze}
                disabled={busy || (!c.title && !c.body)}
              >
                {busy ? 'Analisando…' : 'Analisar · 1 crédito'}
              </Button>
            ) : (
              <Badge tone="neutral">Análise disponível</Badge>
            )
          }
        />
        {error && <Notice tone="bad">{error}</Notice>}
        {cached ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              ['Ângulo', cached.angle],
              ['Gancho', cached.hook],
              ['O que avaliar', cached.what_works],
              ['Hipótese de melhoria', cached.tip],
              ['Sobre fadiga', cached.fatigue_note],
            ]
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-semibold text-ink">{label}</p>
                  <p className="text-sm text-ink-2 mt-1">{value}</p>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-sm text-ink-2">
            Considere amostra, período, objetivo e qualidade comercial.
            Frequência alta sozinha não comprova fadiga.
          </p>
        )}
      </Card>
    </Dialog>
  )
}
