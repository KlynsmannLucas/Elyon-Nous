// app/api/logs/route.ts — Registra ações na tabela activity_logs
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { normalizeClientId } from '@/lib/persistence'

// POST /api/logs — insere um log de atividade
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!supabaseAdmin) return NextResponse.json({ ok: true }) // silently ok when DB not configured

  const body = await req.json()
  const { module, action, clientName, detail, metadata } = body

  if (!module || !action) {
    return NextResponse.json({ error: 'module e action são obrigatórios' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('activity_logs').insert({
    user_id:     userId,
    client_id:   clientName ? normalizeClientId(clientName) : null,
    client_name: clientName || null,
    module,
    action,
    detail:      detail || null,
    metadata:    metadata || null,
  })

  if (error) {
    // Falha silenciosa — logs não devem quebrar o fluxo principal
    console.warn('[activity_logs] insert failed:', error.message)
  }

  return NextResponse.json({ ok: true })
}

// GET /api/logs — lista os últimos 100 logs do usuário
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!supabaseAdmin) return NextResponse.json({ logs: [] })

  const module = req.nextUrl.searchParams.get('module')
  const limit  = Math.min(Number(req.nextUrl.searchParams.get('limit') || 100), 500)

  let q = supabaseAdmin
    .from('activity_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (module) q = q.eq('module', module)

  const { data, error } = await q

  if (error) {
    console.error('[activity_logs GET]', error.message)
    return NextResponse.json({ logs: [], error: error.message })
  }

  return NextResponse.json({ logs: data || [] })
}
