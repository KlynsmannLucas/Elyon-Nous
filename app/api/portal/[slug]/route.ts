// app/api/portal/[slug]/route.ts — Leitura pública + deleção autenticada
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// GET — leitura pública do portal (sem autenticação)
export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params
  if (!slug) return NextResponse.json({ error: 'Slug inválido' }, { status: 400 })

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Banco de dados não configurado' }, { status: 503 })
  }

  const { data, error } = await supabaseAdmin
    .from('report_shares')
    .select('share_token, client_name, report_data, created_at')
    .eq('share_token', slug)
    .eq('report_data->>type', 'portal')
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: 'Portal não encontrado' }, { status: 404 })
  }

  // Registra visualização (best-effort, fire-and-forget)
  void supabaseAdmin
    .from('report_shares')
    .update({ viewed_at: new Date().toISOString() })
    .eq('share_token', slug)

  return NextResponse.json({
    slug:        data.share_token,
    clientName:  data.client_name,
    agencyName:  data.report_data?.agencyName || 'Agência',
    showMetrics: data.report_data?.showMetrics ?? true,
    showStrategy:data.report_data?.showStrategy ?? true,
    showActions: data.report_data?.showActions ?? false,
    niche:       data.report_data?.niche || '',
    budget:      data.report_data?.budget || 0,
    revenue:     data.report_data?.revenue || 0,
    createdAt:   data.created_at,
  })
}

// DELETE — remove portal (requer autenticação + ser o dono)
export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { slug } = params
  if (!supabaseAdmin) return NextResponse.json({ success: true })

  const { error } = await supabaseAdmin
    .from('report_shares')
    .delete()
    .eq('share_token', slug)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: 'Erro ao remover portal' }, { status: 500 })
  return NextResponse.json({ success: true })
}
