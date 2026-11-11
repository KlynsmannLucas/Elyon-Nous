import { createHash } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { decryptReporteiToken, encryptReporteiToken, isEncryptedReporteiToken } from './crypto'
import { resolveReportingPeriod, type ReportingPeriod } from '@/lib/reporting-period'
import { ReporteiError, reporteiRequest, reporteiList, fetchReporteiIntegration, integrationPlatform } from './client'

export const reporteiDb = () => {
  if (!supabaseAdmin) throw new ReporteiError('A conexão de dados está indisponível no momento.')
  return supabaseAdmin
}
const dbError = () => new ReporteiError('Não foi possível acessar os dados do Reportei no Nous. Tente novamente.')

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) throw new ReporteiError('Origem da solicitação não autorizada.', 403)
}

export async function ownedClient(userId: string, clientId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(clientId)) throw new ReporteiError('Selecione um cliente salvo no Nous.', 400)
  const { data, error } = await reporteiDb().from('clients').select('id, client_data').eq('id', clientId).eq('user_id', userId).maybeSingle()
  if (error) throw dbError()
  if (!data) throw new ReporteiError('Cliente não encontrado nesta conta.', 404)
  return data
}

export async function reporteiConnection(userId: string) {
  const { data, error } = await reporteiDb().from('reportei_connections').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw dbError()
  return data
}

export function connectionToken(connection: any): string {
  // Fail closed on encryption errors, never send ciphertext or fall back to a shared token.
  if (!connection || !isEncryptedReporteiToken(connection.token_ciphertext)) throw new ReporteiError('Conecte sua conta Reportei nas Integrações.', 409)
  try { return decryptReporteiToken(connection.token_ciphertext) }
  catch { throw new ReporteiError('Reconecte o Reportei para restaurar o acesso.', 409) }
}

export async function connectReportei(userId: string, token: unknown) {
  if (typeof token !== 'string' || token.trim().length < 16 || token.length > 4096 || /\s/.test(token.trim())) throw new ReporteiError('Informe um token de API válido do Reportei.', 400)
  const cleanToken = token.trim()
  const response = await reporteiRequest(cleanToken, '/companies/settings')
  const company = response.company || response
  if (!Number.isSafeInteger(Number(company.id)) || !company.name) throw new ReporteiError('O Reportei não retornou uma empresa válida.')
  const ciphertext = encryptReporteiToken(cleanToken)
  const db = reporteiDb()
  const previous = await reporteiConnection(userId)
  if (previous && String(previous.company_id) !== String(company.id)) {
    throw new ReporteiError('Este token pertence a outra empresa. Para trocar de empresa, desconecte a conta atual e confirme a remoção dos vínculos antes de conectar novamente.', 409)
  }
  const connectedAt = new Date().toISOString()
  const { error } = await db.from('reportei_connections').upsert({ user_id: userId, token_ciphertext: ciphertext,
    company_id: company.id, company_name: String(company.name), connected_at: connectedAt }, { onConflict: 'user_id' })
  if (error) throw dbError()
  return { connected: true, companyName: String(company.name), connectedAt }
}

export async function clientReporteiLink(userId: string, clientId: string) {
  await ownedClient(userId, clientId)
  const { data, error } = await reporteiDb().from('reportei_client_links').select('project_id, project_name, timezone, integration_ids, updated_at')
    .eq('user_id', userId).eq('client_id', clientId).maybeSingle()
  if (error) throw dbError()
  return data
}

export async function saveReporteiLink(userId: string, clientId: string, projectId: number, integrationIds: number[]) {
  await ownedClient(userId, clientId)
  if (!Number.isSafeInteger(projectId) || projectId <= 0 || !Array.isArray(integrationIds) || !integrationIds.length || integrationIds.length > 20
      || integrationIds.some(id => !Number.isSafeInteger(id) || id <= 0)) throw new ReporteiError('Escolha um projeto e suas integrações.', 400)
  const token = connectionToken(await reporteiConnection(userId))
  // Verify BOTH project and integrations with this user's credential, never trust posted names or IDs.
  const projectResponse = await reporteiRequest(token, `/projects/${projectId}`)
  const project = projectResponse.project || projectResponse
  if (Number(project.id) !== projectId) throw new ReporteiError('Projeto não disponível nesta conta.', 404)
  const integrations = await reporteiList(token, `/integrations?project_id=${projectId}`)
  const allowed = integrations.filter(row => Number(row.project_id) === projectId && integrationPlatform(row.slug))
  if (integrationIds.some(id => !allowed.some(row => Number(row.id) === id))) throw new ReporteiError('Uma integração não pertence a este projeto ou não é compatível.', 400)
  const timezone = String(project.timezone || 'America/Sao_Paulo')
  try { new Intl.DateTimeFormat('pt-BR', { timeZone: timezone }).format() }
  catch { throw new ReporteiError('O projeto possui um fuso horário inválido.', 400) }
  const link = { user_id: userId, client_id: clientId, project_id: projectId, project_name: String(project.name), timezone,
    integration_ids: [...new Set(integrationIds)].sort((a, b) => a - b), updated_at: new Date().toISOString() }
  const { error } = await reporteiDb().from('reportei_client_links').upsert(link, { onConflict: 'user_id,client_id' })
  if (error?.code === '23505') throw new ReporteiError('Este projeto do Reportei já está vinculado a outro cliente do Nous.', 409)
  if (error) throw dbError()
  return { project_id: link.project_id, project_name: link.project_name, timezone: link.timezone, integration_ids: link.integration_ids }
}

export async function readReporteiData(userId: string, clientId: string, input: { datePreset?: string; startDate?: string; endDate?: string }, refresh = false) {
  const link = await clientReporteiLink(userId, clientId)
  if (!link) return { connected: false, sources: [], message: 'Vincule este cliente a um projeto do Reportei nas Integrações.' }
  const connection = await reporteiConnection(userId)
  const token = connectionToken(connection)
  let period: ReportingPeriod
  try { period = resolveReportingPeriod(input, new Date(), link.timezone) }
  catch (error) { throw new ReporteiError(error instanceof Error ? error.message : 'Período inválido.', 400) }
  const version = createHash('sha256').update(JSON.stringify([link, connection!.company_id, connection!.connected_at])).digest('hex')
  const db = reporteiDb()
  const { data: snapshot, error: snapshotError } = await db.from('reportei_snapshots').select('payload, fetched_at')
    .eq('user_id', userId).eq('client_id', clientId).eq('start_date', period.startDate).eq('end_date', period.endDate).eq('config_version', version).maybeSingle()
  if (snapshotError) throw dbError()
  if (!refresh && snapshot && Date.now() - Date.parse(snapshot.fetched_at) < 15 * 60_000) return { ...snapshot.payload, cached: true }
  const integrations = await reporteiList(token, `/integrations?project_id=${link.project_id}`)
  const selected = (link.integration_ids as number[]).map(id => integrations.find(row => Number(row.id) === Number(id) && Number(row.project_id) === Number(link.project_id)))
  const sources = await Promise.all(selected.map((integration, index) => integration
    ? fetchReporteiIntegration(token, integration, period)
    : Promise.resolve({ integrationId: link.integration_ids[index], status: 'unavailable', metrics: [], error: 'Integração não encontrada neste projeto.' })))
  const payload = { connected: true, projectName: link.project_name, period, fetchedAt: new Date().toISOString(), sources,
    partial: sources.some(source => source.status !== 'available'), cached: false }
  const { error } = await db.from('reportei_snapshots').upsert({ user_id: userId, client_id: clientId, start_date: period.startDate,
    end_date: period.endDate, config_version: version, payload, fetched_at: payload.fetchedAt }, { onConflict: 'user_id,client_id,start_date,end_date,config_version' })
  if (error) throw dbError()
  return payload
}
