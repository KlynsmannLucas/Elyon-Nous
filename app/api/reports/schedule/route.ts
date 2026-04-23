// app/api/reports/schedule/route.ts — Agendamento de relatórios por email
//
// SQL para criar a tabela (Supabase Dashboard → SQL Editor):
// CREATE TABLE IF NOT EXISTS report_schedules (
//   id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   user_id      TEXT NOT NULL,
//   client_name  TEXT NOT NULL,
//   emails       TEXT[] NOT NULL,
//   frequency    TEXT NOT NULL DEFAULT 'weekly',
//   day_of_week  INTEGER DEFAULT 1,
//   active       BOOLEAN DEFAULT TRUE,
//   last_sent_at TIMESTAMPTZ,
//   created_at   TIMESTAMPTZ DEFAULT NOW(),
//   updated_at   TIMESTAMPTZ DEFAULT NOW()
// );
// CREATE INDEX IF NOT EXISTS report_schedules_user_idx ON report_schedules(user_id);

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET — lista agendamentos do usuário
export async function GET() {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!supabaseAdmin) return NextResponse.json({ schedules: [] })

  const { data, error } = await supabaseAdmin
    .from('report_schedules')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ schedules: data || [] })
}

// POST — cria ou atualiza agendamento
export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { clientName, emails, frequency = 'weekly', dayOfWeek = 1, active = true } = await req.json()
  if (!clientName || !emails?.length) {
    return NextResponse.json({ error: 'clientName e emails são obrigatórios' }, { status: 400 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ success: true, message: 'Banco não configurado — agendamento salvo localmente' })
  }

  // Upsert por user_id + client_name
  const { data: existing } = await supabaseAdmin
    .from('report_schedules')
    .select('id')
    .eq('user_id', userId)
    .eq('client_name', clientName)
    .single()

  if (existing) {
    const { error } = await supabaseAdmin
      .from('report_schedules')
      .update({ emails, frequency, day_of_week: dayOfWeek, active, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, action: 'updated' })
  }

  const { error } = await supabaseAdmin
    .from('report_schedules')
    .insert({ user_id: userId, client_name: clientName, emails, frequency, day_of_week: dayOfWeek, active })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, action: 'created' })
}

// DELETE — remove agendamento por clientName
export async function DELETE(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const clientName = req.nextUrl.searchParams.get('clientName')
  if (!clientName || !supabaseAdmin) return NextResponse.json({ success: false })

  await supabaseAdmin.from('report_schedules').delete().eq('user_id', userId).eq('client_name', clientName)
  return NextResponse.json({ success: true })
}
