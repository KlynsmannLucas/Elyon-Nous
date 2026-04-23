// app/api/report/route.ts — Geração e busca de relatórios compartilháveis
//
// SQL para criar a tabela no Supabase (rodar no Dashboard → SQL Editor):
// CREATE TABLE IF NOT EXISTS report_shares (
//   id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   token       TEXT UNIQUE NOT NULL,
//   user_id     TEXT NOT NULL,
//   client_name TEXT NOT NULL,
//   report_data JSONB NOT NULL,
//   branding    JSONB DEFAULT '{}',
//   expires_at  TIMESTAMPTZ,
//   password    TEXT,
//   created_at  TIMESTAMPTZ DEFAULT NOW()
// );
// CREATE INDEX IF NOT EXISTS report_shares_token_idx ON report_shares(token);

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { randomBytes } from 'crypto'

// POST /api/report — cria um share token para o relatório
export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const body = await req.json()
    const { clientName, reportData, branding, expiresInDays = 30, password } = body

    if (!clientName || !reportData) {
      return NextResponse.json({ error: 'clientName e reportData são obrigatórios' }, { status: 400 })
    }

    const token    = randomBytes(20).toString('hex')
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 86400000).toISOString()
      : null

    if (!supabaseAdmin) {
      // Fallback: retorna token codificado localmente (sem persistência)
      const payload = Buffer.from(JSON.stringify({ clientName, reportData, branding, expiresAt })).toString('base64url')
      return NextResponse.json({ token: `local_${payload}`, url: `/report/local_${payload}` })
    }

    const { error } = await supabaseAdmin.from('report_shares').insert({
      token,
      user_id:    userId,
      client_name: clientName,
      report_data: reportData,
      branding:   branding || {},
      expires_at: expiresAt,
      password:   password || null,
    })

    if (error) throw new Error(error.message)

    return NextResponse.json({ token, url: `/report/${token}` })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// GET /api/report?token=xxx — busca dados do relatório
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token obrigatório' }, { status: 400 })

  try {
    // Fallback local token
    if (token.startsWith('local_')) {
      const raw = token.slice(6)
      const data = JSON.parse(Buffer.from(raw, 'base64url').toString('utf-8'))
      return NextResponse.json({ success: true, ...data })
    }

    if (!supabaseAdmin) return NextResponse.json({ error: 'Banco não configurado' }, { status: 503 })

    const { data, error } = await supabaseAdmin
      .from('report_shares')
      .select('client_name, report_data, branding, expires_at, created_at')
      .eq('token', token)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Relatório não encontrado' }, { status: 404 })

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Este link expirou' }, { status: 410 })
    }

    return NextResponse.json({
      success: true,
      clientName:  data.client_name,
      reportData:  data.report_data,
      branding:    data.branding || {},
      createdAt:   data.created_at,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE /api/report?token=xxx — revoga um token
export async function DELETE(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const token = req.nextUrl.searchParams.get('token')
  if (!token || !supabaseAdmin) return NextResponse.json({ success: false })

  await supabaseAdmin.from('report_shares').delete().eq('token', token).eq('user_id', userId)
  return NextResponse.json({ success: true })
}
