// app/api/portal/route.ts — CRUD de portais de cliente
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// GET — lista portais do usuário autenticado
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  if (!supabaseAdmin) return NextResponse.json({ portals: [] })

  const { data } = await supabaseAdmin
    .from('report_shares')
    .select('token, client_name, report_data, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const portals = (data || [])
    .filter((row: any) => row.report_data?.type === 'portal')
    .map((row: any) => ({
      slug:         row.token,
      clientName:   row.client_name,
      agencyName:   row.report_data?.agencyName || '',
      showMetrics:  row.report_data?.showMetrics ?? true,
      showStrategy: row.report_data?.showStrategy ?? true,
      showActions:  row.report_data?.showActions ?? false,
      createdAt:    row.created_at,
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

  if (!supabaseAdmin) return NextResponse.json({ success: true, slug })

  const { error } = await supabaseAdmin
    .from('report_shares')
    .insert({
      token:        slug,
      user_id:      userId,
      client_name:  clientName,
      report_data: {
        type: 'portal',
        agencyName, showMetrics, showStrategy, showActions, niche, budget, revenue,
      },
    })

  if (error) {
    console.warn('[portal] Supabase insert warning:', error.message)
  }

  return NextResponse.json({ success: true, slug })
}
