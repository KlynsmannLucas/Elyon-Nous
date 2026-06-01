// app/api/assets/save/route.ts — Faz upload de imagem para Supabase Storage e persiste metadados
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { normalizeClientId } from '@/lib/persistence'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY não configurada — configure no painel do Vercel e faça redeploy.' },
      { status: 503 }
    )
  }

  const formData = await req.formData()
  const file       = formData.get('file') as File | null
  const clientName = formData.get('clientName') as string | null
  const type       = formData.get('type') as string | null

  if (!file || !clientName || !type) {
    return NextResponse.json({ error: 'file, clientName e type são obrigatórios' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: `Tipo não permitido: ${file.type}` }, { status: 400 })
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: `Arquivo excede 5 MB (${(file.size / 1024 / 1024).toFixed(1)} MB)` }, { status: 400 })
  }

  const validTypes = ['logo', 'product', 'lifestyle', 'banner', 'other']
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: `Tipo de asset inválido: ${type}` }, { status: 400 })
  }

  const clientId    = normalizeClientId(clientName)
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${userId}/${clientId}/${type}/${Date.now()}_${safeFileName}`
  const sizeKb      = Math.round(file.size / 1024)

  // Upload do arquivo para o bucket Supabase Storage
  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: uploadError } = await supabaseAdmin.storage
    .from('client-assets')
    .upload(storagePath, buffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    console.error('[assets/save] upload error:', uploadError.message)
    return NextResponse.json({ error: `Erro no upload: ${uploadError.message}` }, { status: 500 })
  }

  // URL pública do arquivo
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('client-assets')
    .getPublicUrl(storagePath)

  // Persiste metadados na tabela client_assets
  const { data, error: dbError } = await supabaseAdmin
    .from('client_assets')
    .insert({
      user_id:      userId,
      client_id:    clientId,
      client_name:  clientName,
      type,
      name:         file.name,
      storage_path: storagePath,
      public_url:   publicUrl,
      mime_type:    file.type,
      size_kb:      sizeKb,
    })
    .select()
    .single()

  if (dbError) {
    // Limpa o arquivo do storage se o DB falhar
    await supabaseAdmin.storage.from('client-assets').remove([storagePath])
    console.error('[assets/save] db error:', dbError.message)
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ asset: data })
}
