'use client'
import { useRef, useState } from 'react'
import { Button } from '@/components/dashboard/v2'
import { fieldClass, studioFetch } from './shared'

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
export default function StudioPublish({ job }: { job: any }) {
  const [platform, setPlatform] = useState<'meta' | 'google'>(job.brief.platforms[0]),
    [options, setOptions] = useState<any>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [receipt, setReceipt] = useState<any>(null)
  const [location, setLocation] = useState(''),
    [pageId, setPage] = useState(''),
    [pixelId, setPixel] = useState(''),
    [assetId, setAsset] = useState(''),
    [audienceIndex, setAudience] = useState(0),
    [maxCpc, setCpc] = useState(1),
    [reviewed, setReviewed] = useState(false),
    [interestIds, setInterests] = useState<string[]>([]),
    [customAudienceId, setCustom] = useState('')
  const sequence = useRef(0)
  async function prepare() {
    const version = ++sequence.current
    setBusy(true)
    setError('')
    setReceipt(null)
    try {
      const data = await studioFetch(`/api/studio/jobs/${job.id}/publication?platform=${platform}`)
      if (sequence.current !== version) return
      setOptions(data)
      setReviewed(false)
      setLocation(
        data.locations.length === 1 ? String(data.locations[0].key || data.locations[0].resourceName) : '',
      )
      setPage('')
      setPixel('')
      setAsset('')
      setAudience(0)
      setInterests([])
      setCustom('')
      if (data.publication) setReceipt(data.publication)
    } catch (e: any) {
      if (sequence.current === version) setError(e.message)
    } finally {
      if (sequence.current === version) setBusy(false)
    }
  }
  async function deliver() {
    if (!options || !reviewed) return
    setBusy(true)
    setError('')
    try {
      const data = await studioFetch(`/api/studio/jobs/${job.id}/publication`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          location,
          pageId,
          pixelId,
          assetId: platform === 'meta' ? assetId : undefined,
          audienceIndex,
          maxCpc,
          interestIds,
          customAudienceId,
          confirmedBudget: options.budget,
          confirmedDestination: options.destination,
          reviewed: true,
          political: false,
        }),
      })
      setReceipt(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  const audience = options?.audiences?.[audienceIndex],
    blocked = receipt && receipt.status !== 'failed'
  return (
    <div className="rounded-xl border border-line bg-canvas-2 p-5 space-y-4">
      <div>
        <h3 className="font-semibold text-ink">Enviar para a conta de anúncios</h3>
        <p className="text-sm text-ink-2 mt-1">
          Crie campanha, grupo/conjunto e anúncios pausados. Confira os dados abaixo; a ativação fica no
          gerenciador.
        </p>
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <label className="text-sm text-ink">
          Canal
          <select
            aria-label="Canal do envio"
            className={`${fieldClass} mt-1`}
            value={platform}
            disabled={busy}
            onChange={(e) => {
              sequence.current++
              setPlatform(e.target.value as 'meta' | 'google')
              setOptions(null)
              setReceipt(null)
              setError('')
            }}
          >
            {job.brief.platforms.map((p: string) => (
              <option key={p} value={p}>
                {p === 'meta' ? 'Meta Ads' : 'Google Ads'}
              </option>
            ))}
          </select>
        </label>
        <Button variant="soft" disabled={busy} onClick={prepare}>
          {busy ? 'Verificando…' : 'Revisar envio'}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {options && !blocked && (
        <>
          <div className="bg-paper rounded-lg p-4 text-sm text-ink space-y-2">
            <p>
              <strong>Conta:</strong> {options.account.name || options.account.id} · {options.account.id}
            </p>
            <p>
              <strong>Verba diária:</strong> {money(options.budget)} · {options.account.currency}
            </p>
            <p className="break-all">
              <strong>Destino:</strong> {options.destination}
            </p>
            <p className="text-xs text-ink-2">
              {platform === 'meta'
                ? job.brief.objective === 'whatsapp'
                  ? 'Conversas no WhatsApp conectado à página.'
                  : 'Anúncios para o site. Cadastros e vendas usam o evento do pixel selecionado.'
                : 'Campanha de Pesquisa com CPC manual. Revise as metas de conversão na conta antes de ativar.'}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="text-xs font-semibold text-ink">
              Confirme a localização
              <select
                className={`${fieldClass} mt-2`}
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value)
                  setReviewed(false)
                }}
                disabled={busy}
              >
                <option value="">Selecione a cidade correta</option>
                {options.locations.map((r: any) => (
                  <option key={r.key || r.resourceName} value={r.key || r.resourceName}>
                    {r.canonicalName || [r.name, r.region, r.country].filter(Boolean).join(', ')}
                  </option>
                ))}
              </select>
            </label>
            {platform === 'google' ? (
              <label className="text-xs font-semibold text-ink">
                CPC máximo inicial (R$)
                <input
                  className={`${fieldClass} mt-2`}
                  type="number"
                  min="0.1"
                  max="1000"
                  step="0.1"
                  value={maxCpc}
                  disabled={busy}
                  onChange={(e) => {
                    setCpc(Number(e.target.value))
                    setReviewed(false)
                  }}
                />
              </label>
            ) : (
              <>
                <label className="text-xs font-semibold text-ink">
                  Página do anúncio
                  <select
                    className={`${fieldClass} mt-2`}
                    value={pageId}
                    disabled={busy}
                    onChange={(e) => {
                      setPage(e.target.value)
                      setReviewed(false)
                    }}
                  >
                    <option value="">Selecione</option>
                    {options.pages.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-semibold text-ink">
                  Arte e posicionamento
                  <select
                    className={`${fieldClass} mt-2`}
                    value={assetId}
                    disabled={busy}
                    onChange={(e) => {
                      setAsset(e.target.value)
                      setReviewed(false)
                    }}
                  >
                    <option value="">Selecione</option>
                    {options.assets.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.format === 'story' ? 'Stories' : 'Feed'} · {r.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-semibold text-ink">
                  Público do conjunto
                  <select
                    className={`${fieldClass} mt-2`}
                    value={audienceIndex}
                    disabled={busy}
                    onChange={(e) => {
                      setAudience(Number(e.target.value))
                      setReviewed(false)
                      setInterests([])
                      setCustom('')
                    }}
                  >
                    {options.audiences.map((r: any, index: number) => (
                      <option key={index} value={index}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </label>
                {['leads', 'sales'].includes(job.brief.objective) && (
                  <label className="text-xs font-semibold text-ink">
                    Pixel de conversões
                    <select
                      className={`${fieldClass} mt-2`}
                      value={pixelId}
                      disabled={busy}
                      onChange={(e) => {
                        setPixel(e.target.value)
                        setReviewed(false)
                      }}
                    >
                      <option value="">Selecione</option>
                      {options.pixels.map((r: any) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </>
            )}
          </div>
          {platform === 'meta' && audience?.strategy === 'interests' && (
            <fieldset>
              <legend className="text-xs font-semibold text-ink mb-2">
                Interesses verificados · selecione até 5
              </legend>
              <div className="grid sm:grid-cols-2 gap-2">
                {options.interests.map((r: any) => (
                  <label key={r.id} className="flex gap-2 text-sm text-ink-2">
                    <input
                      type="checkbox"
                      checked={interestIds.includes(r.id)}
                      disabled={busy || (!interestIds.includes(r.id) && interestIds.length === 5)}
                      onChange={(e) => {
                        setInterests((previous) =>
                          e.target.checked ? [...previous, r.id] : previous.filter((id) => id !== r.id),
                        )
                        setReviewed(false)
                      }}
                    />
                    {r.name}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {platform === 'meta' && audience?.strategy === 'remarketing' && (
            <label className="block text-xs font-semibold text-ink">
              Base de remarketing existente
              <select
                className={`${fieldClass} mt-2`}
                value={customAudienceId}
                disabled={busy}
                onChange={(e) => {
                  setCustom(e.target.value)
                  setReviewed(false)
                }}
              >
                <option value="">Selecione uma base da conta</option>
                {options.customAudiences.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <span className="block text-xs font-normal text-ink-2 mt-2">
                A plataforma verificará a elegibilidade. Nenhuma lista de contatos será enviada pelo Nous.
              </span>
            </label>
          )}
          <label className="flex items-start gap-3 text-sm text-ink">
            <input
              type="checkbox"
              className="mt-1"
              checked={reviewed}
              disabled={busy}
              onChange={(e) => setReviewed(e.target.checked)}
            />
            <span>
              Revisei anúncio, arte, público, verba diária e destino. Confirmo que o conteúdo não é político e
              autorizo criar este rascunho pausado nesta conta.
            </span>
          </label>
          <Button
            disabled={
              busy ||
              !reviewed ||
              !location ||
              options.budget <= 0 ||
              (platform === 'meta' &&
                (!pageId ||
                  !assetId ||
                  (['leads', 'sales'].includes(job.brief.objective) && !pixelId) ||
                  (audience?.strategy === 'interests' && !interestIds.length) ||
                  (audience?.strategy === 'remarketing' && !customAudienceId)))
            }
            onClick={deliver}
          >
            {busy ? 'Enviando…' : 'Criar rascunho pausado'}
          </Button>
        </>
      )}
      {receipt && (
        <div role="status" className="rounded-lg border border-line bg-paper p-4">
          <h4 className="font-semibold text-sm text-ink">
            {receipt.status === 'paused'
              ? 'Rascunho criado e pausado'
              : receipt.status === 'creating'
                ? 'Envio em andamento'
                : receipt.status === 'partial'
                  ? 'Envio requer conferência no gerenciador'
                  : 'Configuração precisa de revisão'}
          </h4>
          <p className="text-sm text-ink-2 mt-2">
            {receipt.error ||
              (receipt.status === 'paused'
                ? 'Confira os objetos na conta de anúncios. A campanha permanece pausada até você decidir ativá-la.'
                : 'Atualize esta consulta para confirmar o resultado. Um envio com confirmação pendente não será repetido automaticamente.')}
          </p>
          {receipt.receipts?.length > 0 && (
            <div className="text-xs text-ink-2 mt-3 space-y-1">
              {receipt.receipts
                .filter((r: any) =>
                  ['campaign', 'adset', 'ad', 'campaignResult', 'adGroupResult', 'adGroupAdResult'].includes(
                    r.type,
                  ),
                )
                .map((r: any, i: number) => (
                  <p key={i} className="break-all">
                    {
                      (
                        {
                          campaign: 'Campanha',
                          adset: 'Conjunto',
                          ad: 'Anúncio',
                          campaignResult: 'Campanha',
                          adGroupResult: 'Grupo',
                          adGroupAdResult: 'Anúncio',
                        } as any
                      )[r.type]
                    }
                    : {r.id || r.resourceName}
                  </p>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
