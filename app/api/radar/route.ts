// app/api/radar/route.ts — RADAR DIÁRIO (wrapper fino sobre lib/radar.ts).
// Vigia Meta + Google (últimos 7 dias) e devolve "o que precisa de você hoje"
// ranqueado por dinheiro. A lógica vive em lib/radar.ts (reusada pelo Pulse).
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { buildRadar } from '@/lib/radar'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })

  try {
    const body = await req.json().catch(() => ({}))
    const { alerts, moneyAtRisk, analyzed } = await buildRadar({
      userId,
      niche: body.niche,
      metaAccountId: body.accountId,
      googleAccountId: body.googleAccountId,
      ticket: body.ticket,
      margin: body.margin,
      convRate: body.convRate,
      strictAccounts: true, // isolamento: só as contas deste cliente, sem cair na padrão do usuário
    })
    return NextResponse.json({ success: true, alerts: alerts.slice(0, 5), moneyAtRisk, analyzed })
  } catch (e: any) {
    console.error('[radar]', e?.message)
    return NextResponse.json({ success: false, error: 'Erro ao gerar o radar.' }, { status: 500 })
  }
}
