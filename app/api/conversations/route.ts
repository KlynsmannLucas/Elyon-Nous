// app/api/conversations/route.ts — Persiste histórico de conversas NOUS por cliente
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { normalizeClientId } from '@/lib/persistence'

// GET /api/conversations?clientName=X — carrega conversa do cliente
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientName = req.nextUrl.searchParams.get('clientName')
  if (!clientName) return NextResponse.json({ error: 'clientName obrigatório' }, { status: 400 })

  if (!supabaseAdmin) return NextResponse.json({ messages: [] })

  const clientId = normalizeClientId(clientName)
  const { data, error } = await supabaseAdmin
    .from('client_conversations')
    .select('messages')
    .eq('user_id', userId)
    .eq('client_id', clientId)
    .maybeSingle()

  if (error) {
    console.error('[conversations GET]', error.message)
    return NextResponse.json({ messages: [] })
  }

  return NextResponse.json({ messages: data?.messages ?? [] })
}

// POST /api/conversations — upsert das mensagens (mantém últimas 100)
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!supabaseAdmin) return NextResponse.json({ ok: true })

  const body = await req.json()
  const { clientName, messages } = body

  if (!clientName || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'clientName e messages são obrigatórios' }, { status: 400 })
  }

  const clientId = normalizeClientId(clientName)
  // Mantém apenas as últimas 100 mensagens para economizar espaço
  const trimmedMessages = messages.slice(-100)

  const { error } = await supabaseAdmin
    .from('client_conversations')
    .upsert({
      user_id:     userId,
      client_id:   clientId,
      client_name: clientName,
      messages:    trimmedMessages,
      updated_at:  new Date().toISOString(),
    }, { onConflict: 'user_id,client_id' })

  if (error) {
    console.error('[conversations POST]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// DELETE /api/conversations?clientName=X — limpa conversa
export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientName = req.nextUrl.searchParams.get('clientName')
  if (!clientName || !supabaseAdmin) return NextResponse.json({ ok: true })

  const clientId = normalizeClientId(clientName)
  await supabaseAdmin
    .from('client_conversations')
    .delete()
    .eq('user_id', userId)
    .eq('client_id', clientId)

  return NextResponse.json({ ok: true })
}
