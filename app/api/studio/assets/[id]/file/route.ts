import { studioIdentity, studioDb, studioFailure, StudioError } from '@/services/studio/access'
import { ownedStudioAsset } from '@/services/studio/assets'
export const dynamic = 'force-dynamic'
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await studioIdentity(),
      url = new URL(request.url),
      clientId = url.searchParams.get('clientId')
    let client = clientId
    if (!client && !params.id.startsWith('legacy:')) {
      const found = await studioDb()
        .from('studio_assets')
        .select('client_id')
        .eq('user_id', user)
        .eq('id', params.id)
        .maybeSingle()
      client = found.data?.client_id
    }
    if (!client) throw new StudioError('Informe o cliente da imagem.', 400)
    const { row, bucket } = await ownedStudioAsset(user, client, params.id)
    const { data, error } = await studioDb().storage.from(bucket).download(row.storage_path)
    if (error || !data) throw new StudioError('Imagem indisponível.', 404)
    return new Response(await data.arrayBuffer(), {
      headers: {
        'Content-Type': row.mime_type,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        ...(url.searchParams.has('download')
          ? { 'Content-Disposition': 'attachment; filename="criativo-nous.png"' }
          : {}),
      },
    })
  } catch (error) {
    return studioFailure(error)
  }
}
