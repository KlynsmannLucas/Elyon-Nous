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

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/clients — lista todos os clientes do usuário autenticado
export async function GET() {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!supabaseAdmin) {
    return NextResponse.json({ clients: [] })
  }

  const { data, error } = await supabaseAdmin
    .from('clients')
    .select('id, client_data, strategy_data, audit_data, saved_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('[clients GET]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const clients = (data || []).map((row: any) => ({
    id: row.id,
    clientData: row.client_data,
    strategyData: row.strategy_data ?? null,
    auditData: row.audit_data ?? null,
    savedAt: row.saved_at || row.updated_at,
  }))

  return NextResponse.json({ clients })
}

// POST /api/clients — cria ou atualiza (upsert) um cliente
export async function POST(req: Request) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!supabaseAdmin) {
    return NextResponse.json({ success: true, warning: 'Supabase not configured' })
  }

  const body = await req.json()
  const { id, clientData, strategyData, auditData, savedAt } = body

  if (!id || !clientData) {
    return NextResponse.json({ error: 'Missing id or clientData' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('clients')
    .upsert(
      {
        id,
        user_id: userId,
        client_data: clientData,
        strategy_data: strategyData ?? null,
        audit_data: auditData ?? null,
        saved_at: savedAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

  if (error) {
    console.error('[clients POST]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
