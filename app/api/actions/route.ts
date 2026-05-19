// app/api/actions/route.ts — GET: busca ações do cliente ativo no Supabase
// Chamado pelo hook useClientActions para hidratar a store após login/troca de cliente
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { loadPriorityActions, loadHealthScore } from '@/lib/persistence'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const clientName = req.nextUrl.searchParams.get('clientName')
    if (!clientName) return NextResponse.json({ error: 'clientName obrigatório' }, { status: 400 })

    const [actions, healthScore] = await Promise.all([
      loadPriorityActions(userId, clientName),
      loadHealthScore(userId, clientName),
    ])

    return NextResponse.json({
      success: true,
      actions,
      healthScore: healthScore
        ? {
            score:        healthScore.score,
            grade:        healthScore.grade,
            source:       healthScore.source,
            updatedAt:    healthScore.updated_at,
            calculatedAt: healthScore.calculated_at,
          }
        : null,
    })
  } catch (e: any) {
    console.error('[api/actions GET]', e.message)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
