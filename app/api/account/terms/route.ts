// app/api/account/terms/route.ts — Registra aceite dos Termos de Uso e Política de Privacidade
import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

export async function POST() {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    await clerkClient().users.updateUser(userId, {
      publicMetadata: {
        termsAcceptedAt: new Date().toISOString(),
        termsVersion: '2025-04',
      },
    })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
