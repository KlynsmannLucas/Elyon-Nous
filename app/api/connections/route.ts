// app/api/connections/route.ts — Metadados de conexões OAuth (SEM tokens expostos)
// Tokens são tratados exclusivamente no backend via token-manager.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { saveConnection, listPublicConnections } from '@/repositories/user-connections'

// GET — metadados públicos das conexões (sem tokens)
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const connections = await listPublicConnections(userId)
    return NextResponse.json({ connections })
  } catch (e: any) {
    console.error('[connections GET]', e.message)
    return NextResponse.json({ connections: [] })
  }
}

// POST — salva ou atualiza conexão com tokens criptografados
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json()
  const { platform, accessToken, accountId, accountName } = body

  if (!platform || !accessToken) {
    return NextResponse.json({ error: 'platform e accessToken são obrigatórios' }, { status: 400 })
  }

  try {
    await saveConnection({
      userId,
      platform,
      accessToken,
      refreshToken: body.refreshToken || null,
      accountId:    accountId   || null,
      accountName:  accountName || null,
      connectedAt:  new Date().toISOString(),
      expiresAt:    body.expiresAt || null,
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[connections POST]', e.message)
    return NextResponse.json({ ok: false, error: e.message })
  }
}
