// app/api/connections/route.ts — Persiste conexões OAuth no Supabase vinculadas ao usuário Clerk
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET — carrega conexões do usuário
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!supabaseAdmin) return NextResponse.json({ connections: [] })

  try {
    const { data, error } = await supabaseAdmin
      .from('ads_connections')
      .select('platform, account_id, account_name, access_token, connected_at')
      .eq('user_id', userId)

    if (error) {
      // Tabela pode não existir ainda — retorna vazio sem quebrar
      console.warn('[connections] Supabase error (tabela pode não existir):', error.message)
      return NextResponse.json({ connections: [] })
    }

    const connections = (data || []).map((row: any) => ({
      platform:    row.platform,
      accountId:   row.account_id || undefined,
      accountName: row.account_name || undefined,
      accessToken: row.access_token,
      connectedAt: row.connected_at,
    }))

    return NextResponse.json({ connections })
  } catch (e: any) {
    console.error('[connections GET]', e.message)
    return NextResponse.json({ connections: [] })
  }
}

// POST — salva ou atualiza conexão (upsert por user_id + platform)
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Supabase não configurado' })

  const body = await req.json()
  const { platform, accessToken, accountId, accountName } = body

  if (!platform || !accessToken) {
    return NextResponse.json({ error: 'platform e accessToken são obrigatórios' }, { status: 400 })
  }

  try {
    const { error } = await supabaseAdmin
      .from('ads_connections')
      .upsert(
        {
          user_id:      userId,
          platform,
          access_token: accessToken,
          account_id:   accountId   || null,
          account_name: accountName || null,
          connected_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,platform' }
      )

    if (error) {
      console.warn('[connections POST] Supabase error:', error.message)
      return NextResponse.json({ ok: false, error: error.message })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[connections POST]', e.message)
    return NextResponse.json({ ok: false, error: e.message })
  }
}
