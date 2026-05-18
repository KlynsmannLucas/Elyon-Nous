// app/api/connections/[platform]/route.ts — Remove conexão + revoga token na plataforma
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getConnection, deleteConnection } from '@/repositories/user-connections'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { platform } = await params

  try {
    // Para Google: revoga o token antes de deletar do banco
    if (platform === 'google') {
      const conn = await getConnection(userId, 'google')
      if (conn?.accessToken) {
        try {
          const tokenToRevoke = conn.refreshToken || conn.accessToken
          await fetch(`https://oauth2.googleapis.com/revoke?token=${tokenToRevoke}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          })
          console.info(`[disconnect] Token Google revogado para ${userId.slice(0, 8)}…`)
        } catch {
          // Não bloqueia a desconexão se a revogação falhar
        }
      }
    }

    await deleteConnection(userId, platform)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[connections DELETE]', e.message)
    return NextResponse.json({ ok: false, error: e.message })
  }
}
