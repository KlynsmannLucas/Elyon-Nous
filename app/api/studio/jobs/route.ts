import { studioIdentity, studioFailure, studioResponse, sameOrigin } from '@/services/studio/access'
import { createStudioJob, listStudioJobs } from '@/services/studio/jobs'
export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  try {
    const user = await studioIdentity()
    return studioResponse({
      jobs: await listStudioJobs(user, new URL(request.url).searchParams.get('clientId') || ''),
    })
  } catch (error) {
    return studioFailure(error)
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request)
    const user = await studioIdentity()
    const body = await request.json()
    return studioResponse({ job: await createStudioJob(user, body) }, 201)
  } catch (error) {
    return studioFailure(error)
  }
}
