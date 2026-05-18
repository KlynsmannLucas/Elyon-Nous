// app/api/briefing-preference/route.ts — Opt-in/opt-out de morning briefing por email
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(_req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  if (!supabaseAdmin) return NextResponse.json({ enabled: false })

  const { data } = await supabaseAdmin
    .from('user_preferences')
    .select('briefing_enabled')
    .eq('user_id', userId)
    .maybeSingle()

  return NextResponse.json({ enabled: data?.briefing_enabled ?? false })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { enabled } = await req.json()

  if (!supabaseAdmin) return NextResponse.json({ ok: true })

  await supabaseAdmin
    .from('user_preferences')
    .upsert({ user_id: userId, briefing_enabled: enabled }, { onConflict: 'user_id' })

  return NextResponse.json({ ok: true, enabled })
}
