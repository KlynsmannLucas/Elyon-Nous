import { NextResponse } from 'next/server'
import { administrator } from '@/lib/server-admin'
import {
  assertSameOrigin,
  reporteiConnection,
  connectionToken,
  reporteiDb,
} from '@/services/reportei/workspace'
import {
  configureInternalReportei,
  grantInternalReportei,
  internalReporteiConfiguration,
  internalReporteiProjects,
} from '@/services/reportei/internal'
import { reporteiErrorResponse } from '@/services/reportei/response'

export const maxDuration = 120
export async function GET(request: Request) {
  const access = await administrator()
  if (!access.allowed)
    return NextResponse.json({ error: 'Acesso administrativo necessário.' }, { status: access.status })
  try {
    const params = new URL(request.url).searchParams
    if (params.get('projects') === '1') {
      const id = Number(params.get('projectId')) || undefined
      const rows = await internalReporteiProjects(id)
      return NextResponse.json(
        {
          rows: rows.map((row) => ({
            id: row.id,
            name: row.name,
            slug: row.slug,
            status: row.status,
            source_id: row.source_id,
          })),
        },
        { headers: { 'Cache-Control': 'private, no-store' } },
      )
    }
    const config = await internalReporteiConfiguration()
    const result: any = {
      administrator: true,
      internal: true,
      configured: !!(config?.token_ciphertext || process.env.REPORTEI_API_TOKEN),
      companyName: config?.company_name || null,
    }
    if (params.get('status') !== '1') {
      const [clients, links, legacy] = await Promise.all([
        reporteiDb()
          .from('clients')
          .select('id,user_id,client_data')
          .order('updated_at', { ascending: false }),
        reporteiDb()
          .from('reportei_service_links')
          .select('client_id,project_id,project_name,integration_ids,grant_type'),
        reporteiConnection(access.userId!),
      ])
      if (clients.error || links.error) throw new Error('Database unavailable')
      result.clients = (clients.data || []).map((client) => ({
        id: client.id,
        name: client.client_data?.clientName || 'Cliente',
        owner: client.user_id,
      }))
      result.links = links.data || []
      result.canAdoptOwnConnection = !!legacy
    }
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return reporteiErrorResponse(error)
  }
}
export async function POST(request: Request) {
  const access = await administrator()
  if (!access.allowed)
    return NextResponse.json({ error: 'Acesso administrativo necessário.' }, { status: access.status })
  try {
    assertSameOrigin(request)
    const body = await request.json().catch(() => ({}))
    const result =
      body.action === 'link'
        ? await grantInternalReportei(
            access.userId!,
            String(body.clientId || ''),
            body.projectId,
            body.integrationIds,
          )
        : body.action === 'adopt'
          ? await configureInternalReportei(
              access.userId!,
              connectionToken(await reporteiConnection(access.userId!)),
            )
          : await configureInternalReportei(access.userId!, body.token)
    return NextResponse.json(
      { success: true, ...result },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    return reporteiErrorResponse(error)
  }
}
