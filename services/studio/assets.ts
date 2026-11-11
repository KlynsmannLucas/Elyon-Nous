import { randomUUID } from 'crypto'
import sharp from 'sharp'
import { normalizeClientId } from '@/lib/persistence'
import { studioClient, studioDb, StudioError } from './access'
import { FORMAT_DIMENSIONS, type StudioFormat } from '@/lib/studio/schema'

const BUCKET = 'studio-assets'
const MAX_INPUT_BYTES = 3 * 1024 * 1024
export const publicAsset = (asset: any) => ({
  id: asset.id,
  clientId: asset.client_id,
  jobId: asset.job_id,
  name: asset.name,
  kind: asset.kind,
  format: asset.format,
  width: asset.width,
  height: asset.height,
  mimeType: asset.mime_type,
  createdAt: asset.created_at || asset.uploaded_at,
  url: `/api/studio/assets/${asset.id}/file?clientId=${asset.client_id}`,
  metadata: asset.metadata || {},
})

async function ensureBucket() {
  const db = studioDb()
  const { data, error } = await db.storage.getBucket(BUCKET)
  if (data?.public)
    throw new StudioError('A configuração de privacidade da biblioteca precisa de manutenção.')
  if (!error && data) return
  const created = await db.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: 15 * 1024 * 1024,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  })
  if (created.error) {
    const check = await db.storage.getBucket(BUCKET)
    if (!check.data || check.data.public)
      throw new StudioError('Não foi possível preparar a biblioteca privada.')
  }
}
export async function listStudioAssets(userId: string, clientId: string) {
  const client = await studioClient(userId, clientId)
  const db = studioDb()
  const { data, error } = await db
    .from('studio_assets')
    .select('*')
    .eq('user_id', userId)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(150)
  if (error) throw new StudioError('Não foi possível carregar a biblioteca.')
  const result = (data || []).map(publicAsset)
  // Legacy images remain available only when this name identifies one client of this user.
  const owners = await db.from('clients').select('id,client_data').eq('user_id', userId)
  const name = normalizeClientId(client.client_data.clientName)
  if (
    !owners.error &&
    owners.data?.filter((row) => normalizeClientId(row.client_data?.clientName || '') === name).length === 1
  ) {
    const legacy = await db
      .from('client_assets')
      .select('*')
      .eq('user_id', userId)
      .eq('client_id', name)
      .order('uploaded_at', { ascending: false })
      .limit(100)
    for (const asset of legacy.data || []) {
      if (
        !['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(asset.mime_type) ||
        !asset.storage_path?.startsWith(`${userId}/${name}/`)
      )
        continue
      result.push({
        ...publicAsset({
          ...asset,
          id: `legacy:${asset.id}`,
          client_id: clientId,
          kind: asset.type === 'logo' ? 'logo' : 'reference',
          metadata: { legacy: true },
        }),
        width: null,
        height: null,
      })
    }
  }
  return result
}
export async function ownedStudioAsset(userId: string, clientId: string, assetId: string) {
  const client = await studioClient(userId, clientId)
  const legacy = assetId.startsWith('legacy:')
  const id = legacy ? assetId.slice(7) : assetId
  if (!/^[a-f0-9-]{36}$/i.test(id)) throw new StudioError('Imagem inválida.', 400)
  const { data, error } = await studioDb()
    .from(legacy ? 'client_assets' : 'studio_assets')
    .select('*')
    .eq('user_id', userId)
    .eq('client_id', legacy ? normalizeClientId(client.client_data.clientName) : clientId)
    .eq('id', id)
    .maybeSingle()
  if (error || !data) throw new StudioError('Imagem não encontrada neste cliente.', 404)
  if (
    !data.storage_path?.startsWith(
      `${userId}/${legacy ? normalizeClientId(client.client_data.clientName) : clientId}/`,
    )
  )
    throw new StudioError('Imagem não autorizada.', 403)
  if (legacy) {
    const clients = await studioDb().from('clients').select('id,client_data').eq('user_id', userId)
    const matching = clients.data?.filter(
      (row) =>
        normalizeClientId(row.client_data?.clientName || '') ===
        normalizeClientId(client.client_data.clientName),
    )
    if (clients.error || matching?.length !== 1)
      throw new StudioError('A imagem antiga precisa de associação ao cliente correto.', 409)
  }
  return { row: data, bucket: legacy ? 'client-assets' : BUCKET }
}
export async function referenceBytes(userId: string, clientId: string, ids: string[]) {
  if (ids.length > 5 || new Set(ids).size !== ids.length)
    throw new StudioError('Selecione até cinco referências diferentes.', 400)
  return Promise.all(
    ids.map(async (id) => {
      const { row, bucket } = await ownedStudioAsset(userId, clientId, id)
      if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(row.mime_type))
        throw new StudioError('A referência deve ser JPG, PNG ou WebP.', 400)
      const { data, error } = await studioDb().storage.from(bucket).download(row.storage_path)
      if (error || !data) throw new StudioError('Não foi possível ler uma das referências.')
      if (data.size > 15 * 1024 * 1024) throw new StudioError('A referência é muito grande.', 400)
      const original = Buffer.from(await data.arrayBuffer())
      const buffer = await sharp(original, { limitInputPixels: 40_000_000, animated: false })
        .rotate()
        .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
        .png()
        .toBuffer()
      return { id, name: row.name, kind: row.kind || row.type, buffer, mediaType: 'image/png' as const }
    }),
  )
}
export async function saveStudioImage(
  userId: string,
  clientId: string,
  input: {
    bytes: Buffer
    name: string
    kind: 'reference' | 'product' | 'logo' | 'generated'
    format?: StudioFormat
    jobId?: string
    metadata?: Record<string, unknown>
  },
) {
  await studioClient(userId, clientId)
  const image = sharp(input.bytes, { limitInputPixels: 40_000_000, animated: false }).rotate()
  const dimensions = input.format ? FORMAT_DIMENSIONS[input.format] : null
  const { data: buffer, info } = await (
    dimensions
      ? image.resize(dimensions.width, dimensions.height, { fit: 'contain', background: '#ffffff' })
      : image.resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
  )
    .png()
    .toBuffer({ resolveWithObject: true })
  await ensureBucket()
  const id = randomUUID(),
    storagePath = `${userId}/${clientId}/${id}.png`,
    db = studioDb()
  const upload = await db.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: 'image/png', upsert: false })
  if (upload.error) throw new StudioError('Não foi possível salvar a arte na biblioteca.')
  const saved = await db
    .from('studio_assets')
    .insert({
      id,
      user_id: userId,
      client_id: clientId,
      job_id: input.jobId || null,
      name: input.name.slice(0, 180),
      kind: input.kind,
      format: input.format || null,
      storage_path: storagePath,
      mime_type: 'image/png',
      width: info.width,
      height: info.height,
      metadata: input.metadata || {},
    })
    .select('*')
    .single()
  if (saved.error || !saved.data) {
    await db.storage.from(BUCKET).remove([storagePath])
    throw new StudioError('Não foi possível registrar a arte. Tente novamente.')
  }
  return publicAsset(saved.data)
}
export async function uploadStudioReference(
  userId: string,
  clientId: string,
  file: File,
  kind: 'reference' | 'product' | 'logo',
) {
  if (
    !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
    !file.size ||
    file.size > MAX_INPUT_BYTES
  )
    throw new StudioError('Use JPG, PNG ou WebP de até 3 MB.', 400)
  const bytes = Buffer.from(await file.arrayBuffer())
  try {
    return await saveStudioImage(userId, clientId, {
      bytes,
      name: file.name,
      kind,
      metadata: { originalName: file.name.slice(0, 180) },
    })
  } catch (error) {
    if (error instanceof StudioError) throw error
    throw new StudioError('O arquivo não contém uma imagem válida.', 400)
  }
}
