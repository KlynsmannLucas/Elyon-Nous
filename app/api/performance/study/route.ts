import { auth } from '@clerk/nextjs/server'
import { readPerformanceStudy, StudyError } from '@/services/performance/study'
export const maxDuration = 120
export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Entre na sua conta.' }, { status: 401 })
  try {
    const params = Object.fromEntries(new URL(request.url).searchParams)
    const data = await readPerformanceStudy(userId, params.clientId || '', params)
    return Response.json(data, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return Response.json(
      { error: error instanceof StudyError ? error.message : 'Não foi possível consultar o desempenho.' },
      {
        status: error instanceof StudyError ? error.status : 503,
        headers: { 'Cache-Control': 'private, no-store' },
      },
    )
  }
}
