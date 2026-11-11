import { studioIdentity, studioFailure, studioResponse, sameOrigin } from '@/services/studio/access'
import { runStudioJob } from '@/services/studio/jobs'
export const maxDuration = 300
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    sameOrigin(request)
    return studioResponse({ job: await runStudioJob(await studioIdentity(), params.id) })
  } catch (error) {
    return studioFailure(error)
  }
}
