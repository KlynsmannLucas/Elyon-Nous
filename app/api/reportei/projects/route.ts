import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { connectionToken, reporteiConnection } from '@/services/reportei/workspace'
import { ReporteiError, reporteiList, integrationPlatform } from '@/services/reportei/client'
import { reporteiErrorResponse } from '@/services/reportei/response'

export const maxDuration = 120
export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  try {
    const token = connectionToken(await reporteiConnection(userId))
    const projectId = new URL(request.url).searchParams.get('projectId')
    if (projectId !== null) {
      if (!/^\d+$/.test(projectId) || !Number.isSafeInteger(Number(projectId))) throw new ReporteiError('Projeto inválido.', 400)
      const integrations = await reporteiList(token, `/integrations?project_id=${projectId}`)
      return NextResponse.json({ integrations: integrations.filter(row => Number(row.project_id) === Number(projectId) && integrationPlatform(row.slug))
        .map(row => ({ id: row.id, name: row.name, platform: integrationPlatform(row.slug), accountId: String(row.source_id || ''), status: row.status })) }, { headers: { 'Cache-Control': 'private, no-store' } })
    }
    const projects = await reporteiList(token, '/projects')
    return NextResponse.json({ projects: projects.map(row => ({ id: row.id, name: row.name, timezone: row.timezone })) }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) { return reporteiErrorResponse(error) }
}
