import { studioIdentity, studioFailure, studioResponse } from '@/services/studio/access'
import { getStudioJob } from '@/services/studio/jobs'
export const dynamic = 'force-dynamic'
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    return studioResponse({ job: await getStudioJob(await studioIdentity(), params.id) })
  } catch (error) {
    return studioFailure(error)
  }
}
