// app/api/oauth/token/route.ts — Retorna o token OAuth pendente via cookie httpOnly e o apaga
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const raw = req.cookies.get('oauth_result')?.value
  if (!raw) return NextResponse.json({ error: 'Nenhum token OAuth pendente' }, { status: 404 })

  try {
    const data = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'))
    const res  = NextResponse.json({ success: true, ...data })
    res.cookies.set('oauth_result', '', { maxAge: 0, path: '/' })
    return res
  } catch {
    return NextResponse.json({ error: 'Token OAuth inválido' }, { status: 400 })
  }
}
