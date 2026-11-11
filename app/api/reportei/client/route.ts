import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { assertSameOrigin, clientReporteiLink, ownedClient, reporteiDb, saveReporteiLink } from '@/services/reportei/workspace'
import { reporteiErrorResponse } from '@/services/reportei/response'

export const maxDuration = 120
export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  try { return NextResponse.json({ link: await clientReporteiLink(userId, new URL(request.url).searchParams.get('clientId') || '') }, { headers: { 'Cache-Control': 'private, no-store' } }) }
  catch (error) { return reporteiErrorResponse(error) }
}
export async function PUT(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  try {
    assertSameOrigin(request)
    const body = await request.json().catch(() => ({}))
    return NextResponse.json({ link: await saveReporteiLink(userId, String(body.clientId || ''), body.projectId, body.integrationIds) })
  } catch (error) { return reporteiErrorResponse(error) }
}
export async function DELETE(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  try {
    assertSameOrigin(request)
    const clientId = new URL(request.url).searchParams.get('clientId') || ''
    await ownedClient(userId, clientId)
    const { error } = await reporteiDb().from('reportei_client_links').delete().eq('user_id', userId).eq('client_id', clientId)
    if (error) throw error
    return NextResponse.json({ link: null })
  } catch (error) { return reporteiErrorResponse(error) }
}
