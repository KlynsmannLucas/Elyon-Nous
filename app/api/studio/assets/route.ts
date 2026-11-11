import {
  studioIdentity,
  studioClient,
  studioFailure,
  studioResponse,
  sameOrigin,
  StudioError,
} from '@/services/studio/access'
import { listStudioAssets, uploadStudioReference } from '@/services/studio/assets'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export async function GET(request: Request) {
  try {
    return studioResponse({
      assets: await listStudioAssets(
        await studioIdentity(),
        new URL(request.url).searchParams.get('clientId') || '',
      ),
    })
  } catch (error) {
    return studioFailure(error)
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request)
    const user = await studioIdentity()
    if (Number(request.headers.get('content-length')) > 3500000)
      throw new StudioError('Envie uma imagem de até 3 MB.', 413)
    const form = await request.formData()
    const clientId = String(form.get('clientId') || '')
    await studioClient(user, clientId)
    const file = form.get('file'),
      kind = String(form.get('kind') || 'reference')
    if (!(file instanceof File) || !['reference', 'product', 'logo'].includes(kind))
      throw new StudioError('Imagem inválida.', 400)
    return studioResponse(
      { asset: await uploadStudioReference(user, clientId, file, kind as 'reference' | 'product' | 'logo') },
      201,
    )
  } catch (error) {
    return studioFailure(error)
  }
}
