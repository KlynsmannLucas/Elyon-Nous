import {
  studioIdentity,
  studioFailure,
  studioResponse,
  sameOrigin,
  StudioError,
} from '@/services/studio/access'
import { publicationOptions, deliverPausedDraft } from '@/services/studio/publication'
export const maxDuration = 300
export const dynamic = 'force-dynamic'
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await studioIdentity(),
      platform = new URL(request.url).searchParams.get('platform')
    if (platform !== 'meta' && platform !== 'google') throw new StudioError('Canal inválido.', 400)
    return studioResponse(await publicationOptions(user, params.id, platform))
  } catch (error) {
    return studioFailure(error)
  }
}
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    sameOrigin(request)
    return studioResponse(await deliverPausedDraft(await studioIdentity(), params.id, await request.json()))
  } catch (error) {
    return studioFailure(error)
  }
}
