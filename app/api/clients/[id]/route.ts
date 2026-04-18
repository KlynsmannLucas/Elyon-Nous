// app/api/clients/[id]/route.ts — Remove um cliente do banco
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!supabaseAdmin) {
    return NextResponse.json({ success: true, warning: 'Supabase not configured' })
  }

  const { error } = await supabaseAdmin
    .from('clients')
    .delete()
    .eq('id', params.id)
    .eq('user_id', userId) // segurança: só deleta do próprio usuário

  if (error) {
    console.error('[clients DELETE]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
