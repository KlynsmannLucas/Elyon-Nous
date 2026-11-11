import { createHash } from 'crypto'
import { reporteiDb, ownedClient } from './workspace'
import { decryptReporteiToken, encryptReporteiToken } from './crypto'
import {
  ReporteiError,
  reporteiRequest,
  reporteiList,
  fetchReporteiIntegration,
  integrationPlatform,
} from './client'
import { resolveReportingPeriod } from '@/lib/reporting-period'
import { normalizeAccountId } from '@/lib/reportei-metrics'
import { getValidMetaToken } from '@/services/meta/token-manager'
import { getValidGoogleToken } from '@/services/google/token-manager'
import { gaqlSearch } from '@/lib/google-ads'

export async function internalReporteiConfiguration() {
  const { data, error } = await reporteiDb()
    .from('reportei_service_config')
    .select('*')
    .eq('singleton', true)
    .maybeSingle()
  if (error) throw new ReporteiError('A leitura complementar está temporariamente indisponível.')
  return data
}
function serviceToken(config: any): string | null {
  if (process.env.REPORTEI_API_TOKEN?.trim()) return process.env.REPORTEI_API_TOKEN.trim()
  if (!config?.token_ciphertext) return null
  try {
    return decryptReporteiToken(config.token_ciphertext)
  } catch {
    throw new ReporteiError(
      'A sincronização interna precisa de manutenção. Seus dados diretos continuam disponíveis.',
    )
  }
}
export async function configureInternalReportei(adminId: string, token: unknown) {
  if (typeof token !== 'string' || token.trim().length < 16 || token.length > 4096 || /\s/.test(token.trim()))
    throw new ReporteiError('Informe uma credencial válida.', 400)
  const clean = token.trim()
  const response = await reporteiRequest(clean, '/companies/settings')
  const company = response.company || response
  if (!Number.isSafeInteger(Number(company.id)) || !company.name)
    throw new ReporteiError('Empresa Reportei inválida.')
  const previous = await internalReporteiConfiguration()
  if (previous && String(previous.company_id) !== String(company.id))
    throw new ReporteiError(
      'A credencial pertence a outra empresa. Os vínculos existentes foram preservados.',
      409,
    )
  const { error } = await reporteiDb()
    .from('reportei_service_config')
    .upsert(
      {
        singleton: true,
        company_id: company.id,
        company_name: String(company.name),
        token_ciphertext: encryptReporteiToken(clean),
        updated_by: adminId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'singleton' },
    )
  if (error) throw new ReporteiError('Não foi possível salvar a configuração interna.')
  return { configured: true, companyName: String(company.name) }
}

export function accountMatches(integrations: any[], verified: { platform: string; accountId: string }[]) {
  return integrations.filter(
    (source) =>
      ['meta', 'google'].includes(integrationPlatform(source.slug) || '') &&
      source.source_id &&
      verified.some(
        (account) =>
          account.platform === integrationPlatform(source.slug) &&
          normalizeAccountId(account.platform, account.accountId) ===
            normalizeAccountId(account.platform, source.source_id),
      ),
  )
}
async function verifyNativeAccounts(userId: string, client: any) {
  const selections = client.extra_data || {}
  const results = await Promise.allSettled([
    (async () => {
      const accountId = normalizeAccountId('meta', selections.selectedMetaAccountId)
      if (!/^\d+$/.test(accountId)) return null
      const token = await getValidMetaToken(userId)
      const response = await fetch(`https://graph.facebook.com/v21.0/act_${accountId}?fields=id`, {
        headers: { Authorization: `Bearer ${token.accessToken}` },
        signal: AbortSignal.timeout(10_000),
        cache: 'no-store',
      })
      const data = await response.json()
      return response.ok && normalizeAccountId('meta', data.id) === accountId
        ? { platform: 'meta', accountId }
        : null
    })(),
    (async () => {
      const accountId = normalizeAccountId('google', selections.selectedGoogleAccountId)
      if (!/^\d{10}$/.test(accountId) || !process.env.GOOGLE_ADS_DEVELOPER_TOKEN) return null
      const token = await getValidGoogleToken(userId)
      const data = await gaqlSearch(
        accountId,
        token.accessToken,
        process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
        'SELECT customer.id FROM customer LIMIT 1',
      )
      return data.some((row) => String(row.customer?.id) === accountId)
        ? { platform: 'google', accountId }
        : null
    })(),
  ])
  return results.flatMap((result) => (result.status === 'fulfilled' && result.value ? [result.value] : []))
}

async function automaticBinding(userId: string, client: any, config: any, token: string) {
  const verified = await verifyNativeAccounts(userId, client)
  if (!verified.length) return null
  const integrations = await reporteiList(token, '/integrations')
  const matched = accountMatches(integrations, verified)
  const projectIds = [...new Set(matched.map((source) => Number(source.project_id)))]
  if (projectIds.length !== 1) return null // Ambiguous accounts are never assigned by names.
  const response = await reporteiRequest(token, `/projects/${projectIds[0]}`)
  const project = response.project || response
  const link = {
    user_id: userId,
    client_id: client.id,
    company_id: config.company_id,
    project_id: projectIds[0],
    project_name: String(project.name),
    timezone: project.timezone || 'America/Sao_Paulo',
    integration_ids: matched.map((source) => Number(source.id)),
    native_bindings: Object.fromEntries(verified.map((account) => [account.platform, account.accountId])),
    grant_type: 'verified_native_accounts',
    granted_by: userId,
    updated_at: new Date().toISOString(),
  }
  const { error } = await reporteiDb()
    .from('reportei_service_links')
    .upsert(link, { onConflict: 'user_id,client_id' })
  if (error) throw new ReporteiError('Não foi possível associar os dados complementares.')
  return link
}

export async function internalReporteiProjects(projectId?: number) {
  const config = await internalReporteiConfiguration()
  const token = serviceToken(config)
  if (!token) throw new ReporteiError('A credencial de serviço ainda não foi configurada.', 409)
  return projectId
    ? reporteiList(token, `/integrations?project_id=${projectId}`)
    : reporteiList(token, '/projects')
}
export async function grantInternalReportei(
  adminId: string,
  clientId: string,
  projectId: number,
  integrationIds: number[],
) {
  const db = reporteiDb()
  const { data: client, error } = await db
    .from('clients')
    .select('id,user_id,client_data')
    .eq('id', clientId)
    .maybeSingle()
  if (error || !client) throw new ReporteiError('Cliente não encontrado.', 404)
  if (
    !Number.isSafeInteger(projectId) ||
    projectId < 1 ||
    !Array.isArray(integrationIds) ||
    !integrationIds.length ||
    integrationIds.length > 20
  )
    throw new ReporteiError('Vínculo inválido.', 400)
  const config = await internalReporteiConfiguration(),
    token = serviceToken(config)
  if (!token) throw new ReporteiError('Configure a credencial interna primeiro.', 409)
  const projectResponse = await reporteiRequest(token, `/projects/${projectId}`)
  const project = projectResponse.project || projectResponse
  const integrations = await reporteiList(token, `/integrations?project_id=${projectId}`)
  if (
    Number(project.id) !== projectId ||
    integrationIds.some(
      (id) =>
        !integrations.some(
          (source) =>
            Number(source.id) === id &&
            Number(source.project_id) === projectId &&
            integrationPlatform(source.slug),
        ),
    )
  )
    throw new ReporteiError('Integração não pertence ao projeto.', 400)
  const link = {
    user_id: client.user_id,
    client_id: client.id,
    company_id: config.company_id,
    project_id: projectId,
    project_name: String(project.name),
    timezone: project.timezone || 'America/Sao_Paulo',
    integration_ids: [...new Set(integrationIds)],
    native_bindings: {},
    grant_type: 'administrator',
    granted_by: adminId,
    updated_at: new Date().toISOString(),
  }
  const saved = await db.from('reportei_service_links').upsert(link, { onConflict: 'user_id,client_id' })
  if (saved.error) throw new ReporteiError('Não foi possível salvar o vínculo interno.')
  return { clientId, projectName: link.project_name, integrationCount: link.integration_ids.length }
}

export async function readInternalReporteiData(
  userId: string,
  clientId: string,
  input: { datePreset?: string; startDate?: string; endDate?: string },
  refresh = false,
) {
  const client = await ownedClient(userId, clientId)
  const config = await internalReporteiConfiguration(),
    token = serviceToken(config)
  const db = reporteiDb()
  const { data: savedLink, error } = await db
    .from('reportei_service_links')
    .select('*')
    .eq('user_id', userId)
    .eq('client_id', clientId)
    .maybeSingle()
  if (error) throw new ReporteiError('A leitura complementar está indisponível.')
  let link = savedLink
  if (link?.grant_type === 'verified_native_accounts') {
    const selections = client.extra_data || {}
    const unchanged = Object.entries(link.native_bindings || {}).every(
      ([platform, account]) =>
        normalizeAccountId(
          platform,
          selections[platform === 'meta' ? 'selectedMetaAccountId' : 'selectedGoogleAccountId'],
        ) === account,
    )
    if (!unchanged) link = null
  }
  if (!link && token && config) link = await automaticBinding(userId, client, config, token)
  if (!link)
    return {
      connected: false,
      internal: true,
      sources: [],
      message: 'Dados complementares ainda não disponíveis para este cliente.',
    }
  let period
  try {
    period = resolveReportingPeriod(input, new Date(), link.timezone)
  } catch (error) {
    throw new ReporteiError(error instanceof Error ? error.message : 'Período inválido.', 400)
  }
  const version = createHash('sha256')
    .update(
      JSON.stringify([
        Number(link.project_id),
        [...link.integration_ids].map(Number).sort((a, b) => a - b),
        Number(config?.company_id),
        link.grant_type,
        link.native_bindings || {},
      ]),
    )
    .digest('hex')
  const { data: snapshots, error: cacheError } = await db
    .from('reportei_service_snapshots')
    .select('payload,fetched_at,config_version')
    .eq('user_id', userId)
    .eq('client_id', clientId)
    .eq('start_date', period.startDate)
    .eq('end_date', period.endDate)
    .order('fetched_at', { ascending: false })
    .limit(1)
  if (cacheError) throw new ReporteiError('Não foi possível ler os dados complementares salvos.')
  const snapshot = snapshots?.[0]
  const sameConfig = snapshot?.config_version === version
  const fresh = snapshot && Date.now() - Date.parse(snapshot.fetched_at) < 15 * 60_000
  if (sameConfig && ((!refresh && fresh) || !token))
    return { ...snapshot.payload, internal: true, cached: true, stale: !fresh, syncUnavailable: !token }
  if (!token)
    return {
      connected: false,
      internal: true,
      sources: [],
      message: 'A sincronização complementar está temporariamente indisponível.',
    }
  const integrations = await reporteiList(token, `/integrations?project_id=${link.project_id}`)
  const sources = await Promise.all(
    (link.integration_ids as number[]).map((id) => {
      const integration = integrations.find(
        (source) => Number(source.id) === Number(id) && Number(source.project_id) === Number(link.project_id),
      )
      return integration
        ? fetchReporteiIntegration(token, integration, period)
        : Promise.resolve({
            integrationId: id,
            status: 'unavailable',
            metrics: [],
            error: 'Fonte indisponível.',
          })
    }),
  )
  const payload = {
    connected: true,
    internal: true,
    projectName: link.project_name,
    period,
    fetchedAt: new Date().toISOString(),
    sources,
    partial: sources.some((source) => source.status !== 'available'),
    cached: false,
  }
  const saved = await db
    .from('reportei_service_snapshots')
    .upsert(
      {
        user_id: userId,
        client_id: clientId,
        start_date: period.startDate,
        end_date: period.endDate,
        config_version: version,
        payload,
        fetched_at: payload.fetchedAt,
      },
      { onConflict: 'user_id,client_id,start_date,end_date,config_version' },
    )
  if (saved.error) throw new ReporteiError('Não foi possível salvar a leitura complementar.')
  return payload
}
