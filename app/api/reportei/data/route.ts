import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { readReporteiData } from '@/services/reportei/workspace'
import { reporteiErrorResponse } from '@/services/reportei/response'

export const maxDuration = 300
export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  const params = new URL(request.url).searchParams
  try {
    const result = await readReporteiData(userId, params.get('clientId') || '', {
      datePreset: params.get('datePreset') || undefined, startDate: params.get('startDate') || undefined, endDate: params.get('endDate') || undefined,
    }, params.get('refresh') === '1')
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) { return reporteiErrorResponse(error) }
}
