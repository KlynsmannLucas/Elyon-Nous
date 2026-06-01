// app/api/assets/delete/route.ts — Remove asset do Storage e da tabela client_assets
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada' }, { status: 503 })
  }

  // Busca o storage_path antes de deletar (garante que o asset pertence ao userId)
  const { data: asset, error: fetchError } = await supabaseAdmin
    .from('client_assets')
    .select('storage_path')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (fetchError || !asset) {
    return NextResponse.json({ error: 'Asset não encontrado' }, { status: 404 })
  }

  // Remove do bucket primeiro
  const { error: storageError } = await supabaseAdmin.storage
    .from('client-assets')
    .remove([asset.storage_path])

  if (storageError) {
    console.warn('[assets/delete] storage remove error (continuando):', storageError.message)
  }

  // Remove da tabela
  const { error: dbError } = await supabaseAdmin
    .from('client_assets')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (dbError) {
    console.error('[assets/delete] db error:', dbError.message)
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
