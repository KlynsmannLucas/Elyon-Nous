'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/dashboard/v2'
import { useStudioClient, studioFetch, prepareReference, StudioEmpty, type StudioAsset } from './shared'

export default function StudioLibrary() {
  const scope = useStudioClient()
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {scope.client ? (
        <Library key={scope.client.id} client={scope.client} />
      ) : (
        <StudioEmpty loading={scope.loading} error={scope.error} />
      )}
    </div>
  )
}
function Library({ client }: { client: any }) {
  const [assets, setAssets] = useState<StudioAsset[]>([]),
    [filter, setFilter] = useState('all'),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true)
  const upload = useRef<HTMLInputElement>(null),
    alive = useRef(true)
  useEffect(() => {
    alive.current = true
    const controller = new AbortController()
    studioFetch(`/api/studio/assets?clientId=${client.id}`, { signal: controller.signal })
      .then((data) => {
        if (alive.current) setAssets(data.assets)
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message)
      })
      .finally(() => {
        if (alive.current) setLoading(false)
      })
    return () => {
      alive.current = false
      controller.abort()
    }
  }, [client.id])
  async function add(files: FileList | null) {
    if (!files) return
    setBusy(true)
    setError('')
    try {
      for (const file of Array.from(files).slice(0, 5)) {
        const body = new FormData()
        body.set('clientId', client.id)
        body.set('kind', 'reference')
        body.set('file', await prepareReference(file))
        const data = await studioFetch('/api/studio/assets', { method: 'POST', body })
        if (alive.current) setAssets((rows) => [data.asset, ...rows])
      }
    } catch (e: any) {
      if (alive.current) setError(e.message)
    } finally {
      if (alive.current) setBusy(false)
      if (upload.current) upload.current.value = ''
    }
  }
  async function remove(asset: StudioAsset) {
    if (!window.confirm(`Excluir a referência “${asset.name}”?`)) return
    setError('')
    try {
      await studioFetch(`/api/studio/assets/${asset.id}?clientId=${client.id}`, { method: 'DELETE' })
      if (alive.current) setAssets((rows) => rows.filter((row) => row.id !== asset.id))
    } catch (e: any) {
      if (alive.current) setError(e.message)
    }
  }
  const filtered = assets.filter(
    (asset) =>
      filter === 'all' || (filter === 'generated' ? asset.kind === 'generated' : asset.kind !== 'generated'),
  )
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest text-blue font-semibold">Estúdio / Biblioteca</p>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink mt-2">
            A memória visual de {client.clientData.clientName}
          </h1>
          <p className="text-sm text-ink-2 mt-2 max-w-xl">
            Produtos, referências e artes prontas no mesmo lugar. Use uma imagem como ponto de partida para a
            próxima criação.
          </p>
        </div>
        <Link href="/criar" className="text-sm font-semibold text-blue">
          Criar com IA →
        </Link>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 rounded-lg bg-canvas-2 p-1">
          {[
            ['all', 'Tudo'],
            ['reference', 'Referências'],
            ['generated', 'Artes criadas'],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
              className={`rounded-md px-3 py-2 text-sm ${filter === value ? 'bg-paper shadow-sm text-blue font-semibold' : 'text-ink-2'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <Button onClick={() => upload.current?.click()} disabled={busy}>
          {busy ? 'Salvando…' : '+ Adicionar imagens'}
        </Button>
        <input
          ref={upload}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          hidden
          onChange={(e) => add(e.target.files)}
        />
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 text-red-700 p-3 text-sm">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status" className="text-sm text-ink-2">
          Abrindo a biblioteca…
        </p>
      ) : !filtered.length ? (
        <div className="border border-dashed border-line rounded-xl bg-paper p-12 text-center">
          <h2 className="font-semibold text-ink">Sua próxima campanha começa aqui</h2>
          <p className="text-sm text-ink-2 mt-2">
            Adicione fotos reais dos produtos e a identidade da marca. A IA poderá usá-las como referência.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((asset) => (
            <article key={asset.id} className="rounded-xl overflow-hidden border border-line bg-paper">
              <div className="h-64 bg-canvas-2 flex justify-center p-3">
                <img
                  src={asset.url}
                  alt={asset.name}
                  loading="lazy"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between gap-2">
                  <h2 className="font-semibold text-sm text-ink truncate" title={asset.name}>
                    {asset.name}
                  </h2>
                  <span className="text-xs text-ink-2 shrink-0">
                    {asset.kind === 'generated' ? 'Arte IA' : 'Referência'}
                  </span>
                </div>
                <p className="text-xs text-ink-2 mt-1">
                  {asset.width ? `${asset.width} × ${asset.height} · ` : ''}
                  {new Date(asset.createdAt).toLocaleDateString('pt-BR')}
                </p>
                <div className="flex flex-wrap gap-4 mt-4 text-xs font-semibold">
                  <Link
                    href={`/criar?mode=creative&reference=${encodeURIComponent(asset.id)}`}
                    className="text-blue"
                  >
                    Criar nova versão →
                  </Link>
                  <a href={`${asset.url}&download=1`} className="text-ink-2">
                    Baixar
                  </a>
                  {!asset.jobId && (
                    <button onClick={() => remove(asset)} className="text-ink-2">
                      Excluir
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
