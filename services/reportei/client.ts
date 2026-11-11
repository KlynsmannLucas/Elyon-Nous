import { randomUUID } from 'crypto'
import { normalizeReporteiMetric, selectReporteiMetrics, type ReporteiMetricDefinition } from '@/lib/reportei-metrics'
import type { ReportingPeriod } from '@/lib/reporting-period'

export class ReporteiError extends Error {
  constructor(message: string, public status = 503) { super(message) }
}

const BASE = 'https://app.reportei.com/api/v2'
export async function reporteiRequest(token: string, path: string, body?: unknown): Promise<any> {
  let response: Response
  try {
    response = await fetch(`${BASE}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(35_000), cache: 'no-store', redirect: 'error',
    })
  } catch { throw new ReporteiError('O Reportei não respondeu a tempo. Os demais dados continuam disponíveis.') }
  if (response.status === 401 || response.status === 403) throw new ReporteiError('O Reportei recusou o acesso. Confira o token e as permissões da conta.', 401)
  if (response.status === 429) throw new ReporteiError('O Reportei atingiu o limite de consultas. Tente novamente em alguns minutos.', 429)
  if (!response.ok) throw new ReporteiError(`Não foi possível consultar o Reportei (HTTP ${response.status}).`)
  try { return await response.json() }
  catch { throw new ReporteiError('O Reportei retornou uma resposta inválida.') }
}

export async function reporteiList(token: string, path: string): Promise<any[]> {
  const rows: any[] = []
  const separator = path.includes('?') ? '&' : '?'
  for (let page = 1; page <= 100; page++) {
    const response = await reporteiRequest(token, `${path}${separator}page=${page}&per_page=100`)
    if (!Array.isArray(response.data)) throw new ReporteiError('A lista do Reportei está em um formato inesperado.')
    rows.push(...response.data)
    const lastPage = Number(response.meta?.last_page)
    if (Number.isFinite(lastPage) && lastPage >= page) {
      if (page === lastPage) return rows
    } else if (response.data.length < 100) return rows
  }
  throw new ReporteiError('A consulta excedeu o limite de páginas. Nenhum resultado parcial foi tratado como completo.')
}

export const integrationPlatform = (slug: string) => slug === 'facebook_ads' ? 'meta' : slug === 'google_adwords' ? 'google' : slug === 'kommo' ? 'kommo' : null

export async function fetchReporteiIntegration(token: string, integration: any, period: ReportingPeriod) {
  const base = { integrationId: integration.id, accountId: String(integration.source_id || ''), accountName: integration.name,
    platform: integrationPlatform(integration.slug), slug: integration.slug, fetchedAt: new Date().toISOString() }
  try {
    if (integration.status !== 'active') throw new ReporteiError('A integração está inativa no Reportei.')
    const catalog: ReporteiMetricDefinition[] = await reporteiList(token, `/metrics?integration_slug=${encodeURIComponent(integration.slug)}`)
    const definitions = selectReporteiMetrics(catalog)
    if (!definitions.length) throw new ReporteiError('Nenhuma métrica compatível foi disponibilizada por esta integração.')
    // IDs identify request widgets, not metric types. The API catalog may omit them.
    const widgets = definitions.map(definition => ({ ...definition, id: definition.id || randomUUID() }))
    const batches = Array.from({ length: Math.ceil(widgets.length / 20) }, (_, index) => widgets.slice(index * 20, (index + 1) * 20))
    const metrics = []
    for (const batch of batches) {
      const response = await reporteiRequest(token, '/metrics/get-data', { integration_id: integration.id,
        start: period.startDate, end: period.endDate, metrics: batch })
      const data = response.data || response
      metrics.push(...batch.map(widget => normalizeReporteiMetric(widget, data[widget.id] ?? data[widget.reference_key])))
    }
    const available = metrics.filter(metric => metric.status === 'available').length
    return { ...base, status: available === metrics.length ? 'available' : available > 0 ? 'partial' : 'unavailable', metrics,
      ...(available === 0 ? { error: 'A fonte não retornou valores válidos para este período.' } : {}) }
  } catch (error) {
    return { ...base, status: 'unavailable', error: error instanceof ReporteiError ? error.message : 'Não foi possível ler esta integração.', metrics: [] }
  }
}
