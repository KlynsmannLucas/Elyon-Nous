import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { assertSameOrigin, connectReportei, reporteiConnection, reporteiDb } from '@/services/reportei/workspace'
import { reporteiErrorResponse } from '@/services/reportei/response'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  try {
    const connection = await reporteiConnection(userId)
    return NextResponse.json(connection ? { connected: true, companyName: connection.company_name, connectedAt: connection.connected_at } : { connected: false }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) { return reporteiErrorResponse(error) }
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  try {
    assertSameOrigin(request)
    const body = await request.json().catch(() => ({}))
    return NextResponse.json(await connectReportei(userId, body.token), { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) { return reporteiErrorResponse(error) }
}

export async function DELETE(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  try {
    assertSameOrigin(request)
    const { error } = await reporteiDb().from('reportei_connections').delete().eq('user_id', userId)
    if (error) throw error
    return NextResponse.json({ connected: false })
  } catch (error) { return reporteiErrorResponse(error) }
}
