// app/api/connections/[platform]/route.ts — Remove conexão específica
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!supabaseAdmin) return NextResponse.json({ ok: false })

  const { platform } = await params

  try {
    const { error } = await supabaseAdmin
      .from('ads_connections')
      .delete()
      .eq('user_id', userId)
      .eq('platform', platform)

    if (error) {
      console.warn('[connections DELETE]', error.message)
      return NextResponse.json({ ok: false, error: error.message })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[connections DELETE]', e.message)
    return NextResponse.json({ ok: false, error: e.message })
  }
}
