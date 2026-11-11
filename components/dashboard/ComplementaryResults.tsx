'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, Badge, Button } from '@/components/dashboard/v2'
import { resolveReportingPeriod } from '@/lib/reporting-period'
import { compareObservedMetrics, nativeObservedMetrics, normalizeAccountId, type NativeSource, type ObservedMetric } from '@/lib/reportei-metrics'

const labels: Record<string, string> = { meta: 'Meta Ads', google: 'Google Ads', kommo: 'Kommo' }
const format = (metric: ObservedMetric | null) => metric?.status === 'available' && metric.value != null
  ? new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(metric.value) : 'Não informado'

export default function ComplementaryResults({ clientId, clientName }: { clientId?: string; clientName: string }) {
  const preset = useAppStore(state => state.globalPeriod.preset)
  const metaId = useAppStore(state => state.selectedMetaAccountByClient[clientName]) || ''
  const googleId = useAppStore(state => state.selectedGoogleAccountByClient[clientName]) || ''
  return <ResultsScope key={`${clientId}:${preset}:${metaId}:${googleId}`} clientId={clientId} preset={preset} metaId={metaId} googleId={googleId} />
}

function ResultsScope({ clientId, preset, metaId, googleId }: { clientId?: string; preset: string; metaId: string; googleId: string }) {
  const [loading, setLoading] = useState(true)
  const [reportei, setReportei] = useState<any>(null)
  const [native, setNative] = useState<NativeSource[]>([])
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [requestPeriod, setRequestPeriod] = useState<ReturnType<typeof resolveReportingPeriod> | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal
    setLoading(true); setError(''); setReportei(null); setNative([])
    let period: ReturnType<typeof resolveReportingPeriod>
    try { period = resolveReportingPeriod({ datePreset: preset }) }
    catch (error: any) { setError(error.message); setLoading(false); return }
    setRequestPeriod(period)
    const fetchNative = async (platform: 'meta' | 'google', accountId: string): Promise<NativeSource> => {
      try {
        const response = await fetch(`/api/ads-data/${platform}`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountId, ...period }), signal })
        const data = await response.json()
        return { ...data, platform, accountId, success: response.ok && data.success }
      } catch { return { platform, accountId, success: false, error: 'A fonte não respondeu. Tente novamente.' } }
    }
    const nativeJob = Promise.all([
      ...(metaId ? [fetchNative('meta', metaId)] : []), ...(googleId ? [fetchNative('google', googleId)] : []),
    ]).then(data => { if (!signal.aborted) setNative(data) })
    const reporteiJob = clientId ? (async () => {
      const query = new URLSearchParams({ clientId, startDate: period.startDate, endDate: period.endDate, ...(refresh ? { refresh: '1' } : {}) })
      try {
        const response = await fetch(`/api/reportei/data?${query}`, { signal, cache: 'no-store' })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Falha ao consultar o Reportei.')
        if (!signal.aborted) setReportei(data)
      } catch (error: any) { if (!signal.aborted) setError(error.message) }
    })() : Promise.resolve()
    Promise.allSettled([nativeJob, reporteiJob]).finally(() => { if (!signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [clientId, preset, metaId, googleId, refresh])

  const reporteiSources: any[] = reportei?.sources || []
  const accountKey = (source: any) => `${source.platform}:${normalizeAccountId(source.platform, source.accountId)}`
  const groups: { id: string; direct?: NativeSource; other?: any }[] = native.map(source => ({ id: accountKey(source), direct: source }))
  // Preserve integrations individually, including same-named accounts. Missing account IDs are never guessed.
  for (const source of reporteiSources) {
    const match = source.accountId && groups.find(group => group.direct && !group.other && accountKey(group.direct) === accountKey(source))
    if (match) match.other = source
    else groups.push({ id: `reportei:${source.integrationId}`, other: source })
  }

  return <div className="space-y-4">
    <Card>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div><h2 className="font-semibold text-ink">Dos anúncios ao atendimento e às vendas</h2>
          <p className="text-sm text-ink-2 mt-1">Acompanhe cada etapa com o significado e a origem dos números.</p>
        </div>
        <Button size="sm" variant="soft" disabled={loading} onClick={() => setRefresh(value => value + 1)}>{loading ? 'Consultando…' : 'Atualizar dados'}</Button>
      </div>
      <div className="grid sm:grid-cols-3 gap-3 mt-4">
        {[
          ['Anúncios', 'Investimento, exibições e cliques por conta de mídia.'],
          ['Contatos e cadastros', 'Conversas, primeiros contatos e formulários, cada evento separado.'],
          ['Comercial', 'Negócios e valores registrados no Kommo, quando disponíveis.'],
        ].map(([title, text]) => <div key={title} className="rounded-sm bg-canvas-2 p-3"><h3 className="text-sm font-semibold text-ink">{title}</h3><p className="text-xs text-ink-2 mt-1">{text}</p></div>)}
      </div>
      {requestPeriod && <p className="text-xs text-ink-3 mt-3">Datas solicitadas: {requestPeriod.startDate.split('-').reverse().join('/')} a {requestPeriod.endDate.split('-').reverse().join('/')}{requestPeriod.includesToday ? ' · Hoje ainda está em andamento' : ' · Dias completos'}. As contas devem usar fusos e critérios de atribuição compatíveis para comparação.</p>}
      {reportei?.fetchedAt && <p className="text-xs text-ink-3 mt-1">Reportei: atualizado em {new Date(reportei.fetchedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} (Brasília){(reportei.stale || reportei.syncUnavailable) ? ' · Cópia da última sincronização; atualização interna temporariamente indisponível' : reportei.cached ? ' · Sincronização interna salva' : ''}.</p>}
    </Card>

    {error && <Card><p role="alert" className="text-sm text-red-700">Leitura complementar: {error}</p><p className="text-xs text-ink-3 mt-2">A equipe do Nous gerencia essa sincronização. Os dados diretos das suas contas continuam sendo consultados.</p></Card>}
    {!loading && !reportei?.connected && !error && <Card><p className="text-sm text-ink-2">{reportei?.message || 'Dados complementares ainda não disponíveis para este cliente.'}</p><p className="text-xs text-ink-3 mt-2">A associação é feita internamente às contas autorizadas. Nenhuma credencial adicional é solicitada a você.</p></Card>}
    {loading && <p role="status" className="text-sm text-ink-3">Consultando cada fonte. Os resultados disponíveis são preservados se outra fonte falhar.</p>}

    {groups.map(group => {
      const source = group.other || group.direct!
      const rows = compareObservedMetrics(group.direct ? nativeObservedMetrics(group.direct) : [], group.other?.metrics || [])
      return <Card key={group.id}>
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <div><h3 className="font-semibold text-ink">{labels[source.platform] || 'Reportei'}{group.other?.accountName ? ` · ${group.other.accountName}` : ''}</h3>
            <p className="text-xs text-ink-3 mt-1">{source.accountId ? `Conta ${source.accountId}` : 'Identificador da conta não informado'}{group.other ? ` · Integração Reportei #${group.other.integrationId}` : ''}</p>
          </div>
          <Badge tone={group.other?.status === 'unavailable' || group.direct?.success === false ? 'warn' : 'neutral'}>{group.direct && group.other ? 'Duas leituras da mesma conta' : group.other ? 'Dados do Reportei' : 'Conexão direta'}</Badge>
        </div>
        {group.direct?.success === false && <p className="text-sm text-red-700 mb-2">Conexão direta: {group.direct.error || 'Dados indisponíveis.'}</p>}
        {group.other?.error && <p className="text-sm text-red-700 mb-2">Reportei: {group.other.error}</p>}
        {rows.length > 0 ? <>
          <div className="md:hidden space-y-4" role="list" aria-label="Métricas por fonte">
            {rows.map(row => <div key={row.key} role="listitem" className="border-t border-line pt-3">
              <h4 className="text-sm font-semibold text-ink">{row.label}</h4>
              <p className="text-xs text-ink-3 mt-1">{row.description}</p>
              <dl className="grid grid-cols-2 gap-3 mt-2">
                <div><dt className="text-[11px] text-ink-3">Direto da plataforma</dt><dd className="text-sm font-mono text-ink mt-1">{format(row.native)}</dd></div>
                <div><dt className="text-[11px] text-ink-3">Via Reportei</dt><dd className="text-sm font-mono text-ink mt-1">{format(row.reportei)}</dd></div>
              </dl>
              <p className="text-xs text-ink-2 mt-2">{row.status === 'different' ? 'Valores diferentes: conferir atualização, fuso e atribuição.' : row.status === 'aligned' ? 'Valores coincidem nesta consulta.' : 'Informação complementar.'}</p>
            </div>)}
          </div>
          <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm text-left">
          <caption className="sr-only">Métricas por fonte de {labels[source.platform] || 'Reportei'}, conta {source.accountId}</caption>
          <thead><tr className="border-b border-line text-xs text-ink-3"><th scope="col" className="py-2 pr-3">Informação</th><th scope="col" className="py-2 px-3">Direto da plataforma</th><th scope="col" className="py-2 px-3">Via Reportei</th><th scope="col" className="py-2 pl-3">Leitura</th></tr></thead>
          <tbody>{rows.map(row => <tr key={row.key} className="border-b border-line last:border-0 align-top">
            <th scope="row" className="py-3 pr-3 min-w-[200px] font-medium text-ink">{row.label}<span className="block text-xs text-ink-3 font-normal mt-1 max-w-md">{row.description}</span></th>
            <td className="py-3 px-3 whitespace-nowrap font-mono text-ink">{format(row.native)}</td>
            <td className="py-3 px-3 whitespace-nowrap font-mono text-ink">{format(row.reportei)}</td>
            <td className="py-3 pl-3 text-xs text-ink-2 min-w-[145px]">{row.status === 'different' ? 'Valores diferentes: conferir atualização, fuso e atribuição.' : row.status === 'aligned' ? 'Valores coincidem nesta consulta.' : 'Informação complementar.'}</td>
          </tr>)}</tbody>
        </table></div></> : <p className="text-sm text-ink-3">Nenhuma métrica disponível nesta consulta. Isso não representa resultado zero.</p>}
      </Card>
    })}
    <p className="text-xs text-ink-3">Uma pessoa pode iniciar conversa, preencher um cadastro e virar negócio no CRM. Esses números não são somados como pessoas únicas. Valores de negócios ganhos também não são somados à receita atribuída pelos anúncios. As campanhas da conexão direta continuam disponíveis na aba Campanhas.</p>
  </div>
}
