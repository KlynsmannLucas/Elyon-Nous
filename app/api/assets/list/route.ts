// app/api/assets/list/route.ts — Lista assets do cliente vindos do Supabase
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { normalizeClientId } from '@/lib/persistence'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientName = req.nextUrl.searchParams.get('clientName')
  if (!clientName) return NextResponse.json({ error: 'clientName obrigatório' }, { status: 400 })

  if (!supabaseAdmin) return NextResponse.json({ assets: [] })

  const clientId = normalizeClientId(clientName)
  const { data, error } = await supabaseAdmin
    .from('client_assets')
    .select('*')
    .eq('user_id', userId)
    .eq('client_id', clientId)
    .order('uploaded_at', { ascending: false })

  if (error) {
    console.error('[assets/list]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ assets: data ?? [] })
}
