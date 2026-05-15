// app/api/portal/route.ts — CRUD de portais de cliente
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// GET — lista portais do usuário autenticado
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  if (!supabaseAdmin) {
    return NextResponse.json({ portals: [] })
  }

  const { data, error } = await supabaseAdmin
    .from('report_shares')
    .select('share_token, client_name, report_data, created_at')
    .eq('user_id', userId)
    .eq('report_data->>type', 'portal')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ portals: [] })

  const portals = (data || []).map((row: any) => ({
    slug:        row.share_token,
    clientName:  row.client_name,
    agencyName:  row.report_data?.agencyName || '',
    showMetrics: row.report_data?.showMetrics ?? true,
    showStrategy:row.report_data?.showStrategy ?? true,
    showActions: row.report_data?.showActions ?? false,
    createdAt:   row.created_at,
  }))

  return NextResponse.json({ portals })
}

// POST — cria novo portal
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json()
  const { slug, clientName, agencyName, showMetrics, showStrategy, showActions, niche, budget, revenue } = body

  if (!slug || !clientName || !agencyName) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
  }

  if (!supabaseAdmin) {
    // Supabase não configurado — apenas confirma (estado fica no localStorage)
    return NextResponse.json({ success: true, slug })
  }

  const { error } = await supabaseAdmin
    .from('report_shares')
    .insert({
      user_id:      userId,
      share_token:  slug,
      client_name:  clientName,
      report_data: {
        type:         'portal',
        agencyName,
        showMetrics,
        showStrategy,
        showActions,
        niche,
        budget,
        revenue,
      },
    })

  if (error) {
    console.error('[portal] insert error:', error)
    return NextResponse.json({ error: 'Erro ao salvar portal' }, { status: 500 })
  }

  return NextResponse.json({ success: true, slug })
}
