'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/dashboard/v2'
import { FORMAT_DIMENSIONS, generationCost, type StudioBrief } from '@/lib/studio/schema'
import {
  studioFetch,
  useStudioClient,
  StudioEmpty,
  prepareReference,
  fieldClass,
  type StudioAsset,
} from './shared'
import StudioResult from './StudioResult'

const modes = [
  {
    id: 'campaign',
    name: 'Campanha completa',
    description: 'Estratégia, anúncios, artes e públicos',
    icon: '01',
  },
  {
    id: 'creative',
    name: 'Criativo com referência',
    description: 'Suas fotos, um novo ângulo de venda',
    icon: '02',
  },
  {
    id: 'audience',
    name: 'Públicos e segmentações',
    description: 'Intenção, interesses e palavras-chave',
    icon: '03',
  },
] as const
export default function StudioComposer() {
  const scope = useStudioClient()
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {scope.client ? (
        <Composer key={scope.client.id} client={scope.client} />
      ) : (
        <StudioEmpty loading={scope.loading} error={scope.error} />
      )}
    </div>
  )
}
function Composer({ client }: { client: any }) {
  const [brief, setBrief] = useState<StudioBrief>({
    mode: 'campaign',
    prompt: '',
    platforms: ['meta', 'google'],
    objective: 'leads',
    dailyBudget: 0,
    city: client.clientData.city || '',
    radiusKm: 25,
    destinationUrl: '',
    referenceIds: [],
    formats: ['feed', 'story'],
    brandColors: [],
  })
  const [assets, setAssets] = useState<StudioAsset[]>([]),
    [jobs, setJobs] = useState<any[]>([]),
    [job, setJob] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState(''),
    [showLibrary, setShowLibrary] = useState(false)
  const upload = useRef<HTMLInputElement>(null),
    alive = useRef(true),
    activeJob = useRef(''),
    running = useRef(false)
  const patch = (value: Partial<StudioBrief>) => setBrief((previous) => ({ ...previous, ...value }))
  useEffect(() => {
    alive.current = true
    const controller = new AbortController(),
      query = new URLSearchParams(window.location.search)
    const mode = query.get('mode')
    if (modes.some((m) => m.id === mode)) patch({ mode: mode as StudioBrief['mode'] })
    const prompt = query.get('intent') || query.get('prompt')
    if (prompt) patch({ prompt: prompt.slice(0, 4000) })
    Promise.all([
      studioFetch(`/api/studio/assets?clientId=${client.id}`, { signal: controller.signal }),
      studioFetch(`/api/studio/jobs?clientId=${client.id}`, { signal: controller.signal }),
    ])
      .then(([library, history]) => {
        if (!alive.current) return
        setAssets(library.assets)
        setJobs(history.jobs)
        const reference = query.get('reference')
        if (reference && library.assets.some((asset: StudioAsset) => asset.id === reference))
          patch({ referenceIds: [reference] })
        const requested = query.get('job')
        if (requested && history.jobs.some((row: any) => row.id === requested)) openJob(requested)
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message)
      })
    return () => {
      alive.current = false
      controller.abort()
      activeJob.current = ''
    }
  }, [client.id])
  useEffect(() => {
    if (!busy || !job?.id) return
    const id = job.id
    const timer = window.setInterval(() => {
      studioFetch(`/api/studio/jobs/${id}`)
        .then((data) => {
          if (alive.current && activeJob.current === id) {
            setJob(data.job)
            if (!running.current && !['planning', 'rendering'].includes(data.job.status)) setBusy(false)
          }
        })
        .catch(() => {})
    }, 2500)
    return () => window.clearInterval(timer)
  }, [busy, job?.id])
  async function openJob(id: string) {
    setError('')
    activeJob.current = id
    try {
      const data = await studioFetch(`/api/studio/jobs/${id}`)
      if (alive.current && activeJob.current === id) {
        setJob(data.job)
        setBrief(data.job.brief)
        setBusy(
          ['planning', 'rendering'].includes(data.job.status) &&
            Date.parse(data.job.lease_until || '') > Date.now(),
        )
      }
    } catch (e: any) {
      if (alive.current) setError(e.message)
    }
  }
  async function run(id: string) {
    try {
      const data = await studioFetch(`/api/studio/jobs/${id}/run`, { method: 'POST' })
      if (alive.current && activeJob.current === id) setJob(data.job)
    } catch (e: any) {
      if (alive.current) setError(`${e.message} O progresso fica salvo no histórico.`)
    } finally {
      running.current = false
      if (alive.current) {
        setBusy(false)
        studioFetch(`/api/studio/jobs?clientId=${client.id}`)
          .then((data) => {
            if (alive.current) setJobs(data.jobs)
          })
          .catch(() => {})
      }
    }
  }
  async function generate() {
    if (running.current) return
    running.current = true
    setError('')
    setBusy(true)
    setJob(null)
    try {
      const data = await studioFetch('/api/studio/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id, requestId: crypto.randomUUID(), brief }),
      })
      if (!alive.current) {
        running.current = false
        return
      }
      activeJob.current = data.job.id
      setJob(data.job)
      await run(data.job.id)
    } catch (e: any) {
      running.current = false
      if (alive.current) {
        setError(e.message)
        setBusy(false)
      }
    }
  }
  async function add(files: FileList | null) {
    if (!files) return
    setUploading(true)
    setError('')
    try {
      for (const file of Array.from(files).slice(0, 5 - brief.referenceIds.length)) {
        const body = new FormData()
        body.set('clientId', client.id)
        body.set('kind', 'reference')
        body.set('file', await prepareReference(file))
        const data = await studioFetch('/api/studio/assets', { method: 'POST', body })
        if (alive.current) {
          setAssets((rows) => [data.asset, ...rows])
          setBrief((previous) => ({
            ...previous,
            referenceIds: [...previous.referenceIds, data.asset.id].slice(0, 5),
          }))
        }
      }
    } catch (e: any) {
      if (alive.current) setError(e.message)
    } finally {
      if (alive.current) setUploading(false)
      if (upload.current) upload.current.value = ''
    }
  }
  const cost = generationCost(brief),
    selected = assets.filter((asset) => brief.referenceIds.includes(asset.id))
  const toggleReference = (id: string) =>
    setBrief((previous) => ({
      ...previous,
      referenceIds: previous.referenceIds.includes(id)
        ? previous.referenceIds.filter((v) => v !== id)
        : [...previous.referenceIds, id].slice(0, 5),
    }))
  return (
    <div className="space-y-6">
      <header className="flex justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-blue">
            Nous · Estúdio de criação
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink mt-2">
            Da sua ideia à próxima campanha.
          </h1>
          <p className="text-sm text-ink-2 mt-2">
            Crie para <strong className="text-ink">{client.clientData.clientName}</strong>, com contexto do
            negócio e referências reais.
          </p>
        </div>
        <Link href="/biblioteca" className="text-sm font-semibold text-blue">
          Abrir biblioteca →
        </Link>
      </header>
      <div className="grid md:grid-cols-3 gap-3">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => {
              if (!busy) patch({ mode: mode.id })
            }}
            disabled={busy}
            aria-pressed={brief.mode === mode.id}
            className={`text-left rounded-xl border p-4 transition ${brief.mode === mode.id ? 'border-blue bg-blue-soft' : 'border-line bg-paper hover:border-blue'}`}
          >
            <span className="text-xs font-mono text-blue">{mode.icon}</span>
            <h2 className="font-semibold text-ink mt-2 text-sm">{mode.name}</h2>
            <p className="text-xs text-ink-2 mt-1">{mode.description}</p>
          </button>
        ))}
      </div>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-5 items-start">
        <section className="rounded-xl border border-line bg-paper p-5 md:p-6 space-y-5">
          <div>
            <label htmlFor="studio-prompt" className="font-semibold text-ink text-sm">
              O que vamos criar?
            </label>
            <textarea
              id="studio-prompt"
              value={brief.prompt}
              onChange={(e) => patch({ prompt: e.target.value })}
              disabled={busy}
              maxLength={4000}
              rows={5}
              className={`${fieldClass} mt-2 resize-y`}
              placeholder="Ex.: uma campanha de móveis planejados em Curitiba para gerar conversas no WhatsApp. Use a foto da cozinha, destaque o projeto gratuito e prepare um teste de criativos."
            />
            <p className="text-xs text-ink-2 mt-1">
              Informe produto, oferta confirmada, público e objetivo. Se faltar algo, o agente sinaliza para
              revisão.
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-semibold text-ink">
                Referências visuais{' '}
                <span className="font-normal text-ink-2">{brief.referenceIds.length}/5</span>
              </h3>
              <button
                onClick={() => setShowLibrary((v) => !v)}
                className="text-xs font-semibold text-blue"
                disabled={busy}
              >
                Escolher da biblioteca
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {selected.map((asset) => (
                <div key={asset.id} className="relative w-20 h-20 border border-line rounded-lg bg-canvas-2">
                  <img src={asset.url} alt={asset.name} className="w-full h-full object-contain rounded-lg" />
                  <button
                    onClick={() => toggleReference(asset.id)}
                    disabled={busy}
                    aria-label={`Remover ${asset.name} das referências`}
                    className="absolute -top-2 -right-2 bg-ink text-white rounded-full w-5 h-5 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => upload.current?.click()}
                disabled={busy || uploading || brief.referenceIds.length === 5}
                className="border border-dashed border-line rounded-lg px-4 py-3 text-xs text-ink-2 min-h-20"
              >
                {uploading ? 'Salvando…' : '+ Anexar fotos ou logo'}
              </button>
            </div>
            <input
              ref={upload}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              hidden
              onChange={(e) => add(e.target.files)}
            />
            <p className="text-xs text-ink-2 mt-2">
              A IA recebe as fotos selecionadas como referência. Revise produto, identidade e textos antes de
              anunciar.
            </p>
            {showLibrary && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2 rounded-lg bg-canvas-2 p-3 max-h-56 overflow-y-auto">
                {assets.length ? (
                  assets.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => toggleReference(asset.id)}
                      disabled={busy}
                      title={asset.name}
                      aria-pressed={brief.referenceIds.includes(asset.id)}
                      className={`border-2 rounded-md p-1 ${brief.referenceIds.includes(asset.id) ? 'border-blue' : 'border-transparent'}`}
                    >
                      <img src={asset.url} alt={asset.name} className="h-16 w-full object-contain" />
                    </button>
                  ))
                ) : (
                  <p className="col-span-full text-sm text-ink-2">Adicione as primeiras imagens.</p>
                )}
              </div>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <fieldset>
              <legend className="text-xs font-semibold text-ink mb-2">Canais</legend>
              <div className="flex gap-4">
                {(['meta', 'google'] as const).map((platform) => (
                  <label key={platform} className="flex gap-2 items-center text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={brief.platforms.includes(platform)}
                      disabled={busy}
                      onChange={(e) =>
                        patch({
                          platforms: e.target.checked
                            ? [...brief.platforms, platform]
                            : brief.platforms.filter((p) => p !== platform),
                        })
                      }
                    />
                    {platform === 'meta' ? 'Meta Ads' : 'Google Ads'}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="text-xs font-semibold text-ink">
              Objetivo
              <select
                className={`${fieldClass} mt-2`}
                value={brief.objective}
                disabled={busy}
                onChange={(e) => patch({ objective: e.target.value as StudioBrief['objective'] })}
              >
                <option value="leads">Gerar cadastros e contatos</option>
                <option value="whatsapp">Conversas no WhatsApp</option>
                <option value="sales">Vendas</option>
                <option value="traffic">Visitas ao site</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-ink">
              Cidade / região
              <input
                className={`${fieldClass} mt-2`}
                placeholder="Curitiba, Paraná, Brasil"
                value={brief.city}
                maxLength={120}
                disabled={busy}
                onChange={(e) => patch({ city: e.target.value })}
              />
            </label>
            <label className="text-xs font-semibold text-ink">
              Orçamento diário total (R$)
              <input
                className={`${fieldClass} mt-2`}
                type="number"
                min="0"
                max="100000"
                step="0.01"
                value={brief.dailyBudget || ''}
                placeholder="Ex.: 150"
                disabled={busy}
                onChange={(e) => patch({ dailyBudget: Number(e.target.value) })}
              />
              <span className="block text-xs font-normal text-ink-2 mt-1">
                Será dividido entre os canais escolhidos.
              </span>
            </label>
          </div>
          <label className="block text-xs font-semibold text-ink">
            Destino do anúncio
            <input
              type="url"
              className={`${fieldClass} mt-2`}
              value={brief.destinationUrl}
              placeholder="https://sua-loja.com.br ou https://wa.me/…"
              disabled={busy}
              onChange={(e) => patch({ destinationUrl: e.target.value })}
            />
          </label>
          {brief.mode !== 'audience' && (
            <fieldset>
              <legend className="text-xs font-semibold text-ink mb-2">
                Artes para gerar · escolha até 2
              </legend>
              <div className="flex flex-wrap gap-3">
                {Object.entries(FORMAT_DIMENSIONS).map(([value, format]) => (
                  <label
                    key={value}
                    className="inline-flex items-center gap-2 text-xs text-ink rounded-md border border-line px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={brief.formats.includes(value as any)}
                      disabled={busy || (!brief.formats.includes(value as any) && brief.formats.length === 2)}
                      onChange={(e) =>
                        patch({
                          formats: e.target.checked
                            ? [...brief.formats, value as any]
                            : brief.formats.filter((f) => f !== value),
                        })
                      }
                    />
                    {format.label}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {error && (
            <p role="alert" className="text-sm bg-red-50 text-red-700 p-3 rounded-lg">
              {error}
            </p>
          )}
          <div className="border-t border-line pt-4">
            <Button
              className="w-full sm:w-auto"
              size="lg"
              disabled={
                busy ||
                uploading ||
                brief.prompt.trim().length < 10 ||
                !brief.platforms.length ||
                (brief.mode !== 'audience' && !brief.formats.length)
              }
              onClick={generate}
            >
              {busy
                ? 'Preparando sua criação…'
                : `Preparar ${brief.mode === 'campaign' ? 'tudo' : brief.mode === 'creative' ? 'criativos' : 'públicos'} · até ${cost.total} créditos`}
            </Button>
            <p className="text-xs text-ink-2 mt-2">
              {cost.plan} pelo plano{cost.images ? ` + ${cost.images} pelas artes` : ''}. Etapas sem resultado
              são estornadas. A geração pode levar alguns minutos.
            </p>
          </div>
        </section>
        <aside className="space-y-4">
          <div className="rounded-xl bg-ink text-white p-5">
            <p className="text-xs uppercase tracking-wider opacity-70">Um briefing, um pacote</p>
            <h2 className="font-semibold text-lg mt-3">O agente conecta as partes.</h2>
            <ul className="space-y-3 text-sm mt-4 opacity-90">
              <li>Estratégia alinhada ao objetivo</li>
              <li>Texto e arte com a mesma oferta</li>
              <li>Públicos e intenção de compra</li>
              <li>Plano de teste e mensuração</li>
            </ul>
            <p className="text-xs mt-5 opacity-70 leading-relaxed">
              Você recebe um pacote para revisar e exportar. A geração não ativa anúncios nem utiliza verba de
              mídia.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-paper p-4">
            <h2 className="font-semibold text-sm text-ink">Histórico do cliente</h2>
            {!jobs.length ? (
              <p className="text-xs text-ink-2 mt-3">
                As criações aparecerão aqui, inclusive as que precisarem ser retomadas.
              </p>
            ) : (
              <div className="mt-2 max-h-72 overflow-y-auto">
                {jobs.map((row) => (
                  <button
                    key={row.id}
                    onClick={() => openJob(row.id)}
                    disabled={busy}
                    className="w-full text-left border-t border-line py-3"
                  >
                    <p className="text-xs font-medium text-ink line-clamp-2">{row.brief.prompt}</p>
                    <p className="text-xs text-ink-2 mt-1">
                      {new Date(row.created_at).toLocaleDateString('pt-BR')} ·{' '}
                      {
                        (
                          {
                            ready: 'Pronto',
                            partial: 'Parcial',
                            error: 'Retomar',
                            queued: 'Na fila',
                            planning: 'Planejando',
                            rendering: 'Criando artes',
                          } as any
                        )[row.status]
                      }
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
      {job && (
        <div aria-live="polite">
          {busy && (
            <div className="bg-blue-soft border border-blue rounded-xl p-5 mb-4">
              <p role="status" className="font-semibold text-blue">
                {job.stage}
              </p>
              <p className="text-xs text-ink-2 mt-1">
                Você pode acompanhar o resultado aqui. Se sair, abra a criação pelo histórico.
              </p>
            </div>
          )}
          <StudioResult job={job} />
          {!busy && ['partial', 'error', 'queued'].includes(job.status) && (
            <Button
              className="mt-4"
              onClick={() => {
                if (!running.current) {
                  running.current = true
                  setBusy(true)
                  run(job.id)
                }
              }}
            >
              Retomar etapas pendentes
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
