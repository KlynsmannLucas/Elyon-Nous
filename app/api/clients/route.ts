// app/api/clients/route.ts — Persistência de clientes no Supabase
// SQL necessário (rodar no Supabase Dashboard → SQL Editor):
//
// CREATE TABLE IF NOT EXISTS clients (
//   id            TEXT PRIMARY KEY,
//   user_id       TEXT NOT NULL,
//   client_data   JSONB NOT NULL,
//   strategy_data JSONB,
//   audit_data    JSONB,
//   saved_at      TIMESTAMPTZ,
//   updated_at    TIMESTAMPTZ DEFAULT NOW()
// );
// CREATE INDEX IF NOT EXISTS clients_user_id_idx ON clients(user_id);
// -- Se a tabela já existe, adicione a coluna:
// ALTER TABLE clients ADD COLUMN IF NOT EXISTS audit_data JSONB;

import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const PLAN_LIMITS: Record<string, number> = {
  individual:   3,
  profissional: 8,
  avancada:     15,
}
const FREE_LIMIT = 1

// GET /api/clients — lista todos os clientes do usuário autenticado
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!supabaseAdmin) {
    return NextResponse.json({ clients: [] })
  }

  // Tenta com extra_data; se a coluna não existir ainda, faz fallback sem ela
  let data: any[] | null = null
  let hasExtraData = true

  const res1 = await supabaseAdmin
    .from('clients')
    .select('id, client_data, strategy_data, audit_data, extra_data, saved_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (res1.error) {
    if (res1.error.message?.includes('extra_data') || res1.error.code === '42703') {
      // Coluna extra_data ainda não foi criada — faz fallback
      hasExtraData = false
      const res2 = await supabaseAdmin
        .from('clients')
        .select('id, client_data, strategy_data, audit_data, saved_at, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (res2.error) {
        console.error('[clients GET]', res2.error.message)
        return NextResponse.json({ clients: [], _dbError: res2.error.message })
      }
      data = res2.data
    } else {
      console.error('[clients GET]', res1.error.message)
      return NextResponse.json({ clients: [], _dbError: res1.error.message })
    }
  } else {
    data = res1.data
  }

  const clients = (data || []).map((row: any) => ({
    id: row.id,
    clientData: row.client_data,
    strategyData: row.strategy_data ?? null,
    auditData: row.audit_data ?? null,
    extraData: hasExtraData ? (row.extra_data ?? null) : null,
    savedAt: row.saved_at || row.updated_at,
  }))

  return NextResponse.json({ clients })
}

// POST /api/clients — cria ou atualiza (upsert) um cliente
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!supabaseAdmin) {
    return NextResponse.json({ success: false, warning: 'Supabase not configured' })
  }

  const body = await req.json()
  const { id, clientData, strategyData, auditData, extraData, savedAt } = body

  if (!id || !clientData) {
    return NextResponse.json({ error: 'Missing id or clientData' }, { status: 400 })
  }

  if (supabaseAdmin) {
    // Check if this is a new client (not an update to an existing one)
    const { data: existing } = await supabaseAdmin
      .from('clients').select('id').eq('id', id).eq('user_id', userId).maybeSingle()

    if (!existing) {
      // New client — enforce plan limit
      const { count } = await supabaseAdmin
        .from('clients').select('id', { count: 'exact', head: true }).eq('user_id', userId)

      const user = await (await clerkClient()).users.getUser(userId)
      const plan = (user.publicMetadata?.plan as string | undefined) ?? ''
      const limit = PLAN_LIMITS[plan] ?? FREE_LIMIT

      if ((count ?? 0) >= limit) {
        return NextResponse.json(
          { error: 'Limite de clientes atingido', limit, plan: plan || 'free', upgrade: true },
          { status: 403 }
        )
      }
    }
  }

  const record = {
    id,
    user_id: userId,
    client_data: clientData,
    strategy_data: strategyData ?? null,
    audit_data: auditData ?? null,
    extra_data: extraData ?? null,
    saved_at: savedAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabaseAdmin
    .from('clients')
    .upsert(record, { onConflict: 'id' })

  if (error) {
    // Coluna extra_data ainda não existe — faz fallback sem ela
    if (error.message?.includes('extra_data') || error.code === '42703') {
      const { extra_data: _dropped, ...recordWithoutExtra } = record
      const { error: e2 } = await supabaseAdmin
        .from('clients')
        .upsert(recordWithoutExtra, { onConflict: 'id' })
      if (e2) {
        console.error('[clients POST fallback]', e2.message)
        return NextResponse.json({ error: e2.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, _missingColumn: 'extra_data' })
    }
    console.error('[clients POST]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
