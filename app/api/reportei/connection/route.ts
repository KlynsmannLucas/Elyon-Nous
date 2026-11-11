import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

async function internalOnly() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  return NextResponse.json({ internal: true, error: 'Esta integração é gerenciada internamente pelo Nous.' }, { status: 410, headers: { 'Cache-Control': 'private, no-store' } })
}
export const GET = internalOnly
export const POST = internalOnly
export const DELETE = internalOnly
