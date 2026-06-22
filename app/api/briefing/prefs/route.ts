// app/api/briefing/prefs/route.ts — Gerencia opt-in do morning briefing
import { auth, currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { whatsappConfigured } from '@/lib/notify'
import { NextResponse } from 'next/server'

// GET — retorna preferência atual do usuário
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  if (!supabaseAdmin) return NextResponse.json({ enabled: false, whatsappAvailable: whatsappConfigured() })

  const { data } = await supabaseAdmin
    .from('report_schedules')
    .select('id, emails, active, metadata')
    .eq('user_id', userId)
    .eq('schedule_type', 'morning_briefing')
    .maybeSingle()

  const meta: any = data?.metadata || {}
  return NextResponse.json({
    enabled: data?.active ?? false,
    emails: data?.emails ?? [],
    channels: meta.channels || { email: true, whatsapp: false },
    phone: meta.phone || '',
    whatsappAvailable: whatsappConfigured(),
  })
}

// POST — ativa ou desativa o briefing
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const user = await currentUser()
  const body = await req.json()
  const { enabled, clientName, niche, budget, channels, phone } = body

  if (!supabaseAdmin) return NextResponse.json({ success: true })

  const userEmail = user?.emailAddresses?.[0]?.emailAddress
  if (!userEmail) return NextResponse.json({ error: 'Email não encontrado' }, { status: 400 })

  // Verifica se já existe
  const { data: existing } = await supabaseAdmin
    .from('report_schedules')
    .select('id')
    .eq('user_id', userId)
    .eq('schedule_type', 'morning_briefing')
    .maybeSingle()

  const normChannels = channels && typeof channels === 'object'
    ? { email: channels.email !== false, whatsapp: Boolean(channels.whatsapp) }
    : { email: true, whatsapp: false }

  const payload = {
    user_id:       userId,
    schedule_type: 'morning_briefing',
    emails:        [userEmail],
    client_name:   clientName || '',
    active:        Boolean(enabled),
    metadata: { clientName, niche, budget, channels: normChannels, phone: (phone || '').trim() },
  }

  if (existing) {
    await supabaseAdmin
      .from('report_schedules')
      .update(payload)
      .eq('id', existing.id)
  } else {
    await supabaseAdmin
      .from('report_schedules')
      .insert(payload)
  }

  return NextResponse.json({ success: true, enabled: Boolean(enabled) })
}
