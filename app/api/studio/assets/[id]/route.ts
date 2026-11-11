import {
  studioIdentity,
  studioDb,
  studioFailure,
  studioResponse,
  sameOrigin,
  StudioError,
} from '@/services/studio/access'
import { ownedStudioAsset } from '@/services/studio/assets'
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    sameOrigin(request)
    const user = await studioIdentity(),
      clientId = new URL(request.url).searchParams.get('clientId') || ''
    const { row, bucket } = await ownedStudioAsset(user, clientId, params.id)
    if (row.job_id)
      throw new StudioError(
        'Artes de campanha permanecem no histórico. Você pode criar uma nova versão.',
        409,
      )
    const { error } = await studioDb().storage.from(bucket).remove([row.storage_path])
    if (error) throw new StudioError('Não foi possível excluir a imagem.')
    const deleted = await studioDb()
      .from(params.id.startsWith('legacy:') ? 'client_assets' : 'studio_assets')
      .delete()
      .eq('id', row.id)
      .eq('user_id', user)
    if (deleted.error) throw new StudioError('Não foi possível concluir a exclusão.')
    return studioResponse({ success: true })
  } catch (error) {
    return studioFailure(error)
  }
}
