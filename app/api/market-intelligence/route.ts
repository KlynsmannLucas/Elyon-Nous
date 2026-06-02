// app/api/market-intelligence/route.ts — Persiste e carrega inteligência de mercado por cliente
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { normalizeClientId } from '@/lib/persistence'

// GET /api/market-intelligence?clientName=X
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientName = req.nextUrl.searchParams.get('clientName')
  if (!clientName) return NextResponse.json({ error: 'clientName obrigatório' }, { status: 400 })

  if (!supabaseAdmin) return NextResponse.json({ intelligence: null })

  const clientId = normalizeClientId(clientName)
  const { data, error } = await supabaseAdmin
    .from('market_intelligence')
    .select('*')
    .eq('user_id', userId)
    .eq('client_id', clientId)
    .maybeSingle()

  if (error) {
    console.error('[market-intelligence GET]', error.message)
    return NextResponse.json({ intelligence: null, error: error.message })
  }

  return NextResponse.json({ intelligence: data ?? null })
}

// POST /api/market-intelligence — upsert (1 registro por cliente)
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!supabaseAdmin) return NextResponse.json({ ok: true })

  const body = await req.json()
  const { clientName, niche, competitors, opportunities, mistakes, rawData, source } = body

  if (!clientName) return NextResponse.json({ error: 'clientName obrigatório' }, { status: 400 })

  const clientId = normalizeClientId(clientName)
  const { error } = await supabaseAdmin
    .from('market_intelligence')
    .upsert({
      user_id:      userId,
      client_id:    clientId,
      client_name:  clientName,
      niche:        niche || null,
      competitors:  competitors || [],
      opportunities: opportunities || [],
      mistakes:     mistakes || [],
      raw_data:     rawData || null,
      source:       source || 'ai',
      updated_at:   new Date().toISOString(),
    }, { onConflict: 'user_id,client_id' })

  if (error) {
    console.error('[market-intelligence POST]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log da ação
  await supabaseAdmin.from('activity_logs').insert({
    user_id:     userId,
    client_id:   clientId,
    client_name: clientName,
    module:      'market_intelligence',
    action:      'generate',
    detail:      `Inteligência de mercado gerada para ${clientName}`,
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
