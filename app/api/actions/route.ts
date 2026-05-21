// app/api/actions/route.ts — GET: busca ações do banco | POST: sincroniza ação local
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { loadPriorityActions, loadHealthScore, upsertPriorityActions } from '@/lib/persistence'
import type { RawAction } from '@/lib/persistence'

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

// POST /api/actions — sincroniza uma ação local (sem dbId) com o Supabase.
// Chamado pelo mecanismo de retry quando Supabase falhou durante a auditoria.
// Usa a mesma deduplicação de upsertPriorityActions — não cria duplicatas.
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await req.json()
    const { clientName, action } = body as { clientName: string; action: any }

    if (!clientName || !action?.title || !action?.platform || !action?.urgency) {
      return NextResponse.json(
        { error: 'clientName, action.title, action.platform e action.urgency são obrigatórios' },
        { status: 400 },
      )
    }

    const raw: RawAction = {
      clientId:        userId,
      title:           action.title,
      description:     action.description,
      platform:        action.platform,
      source:          action.source ?? 'auditoria',
      priority:        action.priority ?? 1,
      urgency:         action.urgency,
      metric:          action.metric,
      evidence:        action.evidence,
      impact:          action.impact,
      origin:          action.origin,
      relatedCampaign: action.relatedCampaign ?? undefined,
      relatedAdSet:    action.relatedAdSet ?? undefined,
      relatedAd:       action.relatedAd ?? undefined,
      auditReportId:   null,
    }

    const saved = await upsertPriorityActions(userId, clientName, [raw])
    const dbId = saved[0]?.id ?? null

    if (!dbId) {
      console.error('[api/actions POST] upsertPriorityActions não retornou id:', { clientName, title: action.title })
      return NextResponse.json({ error: 'Falha ao sincronizar ação no banco' }, { status: 500 })
    }

    console.info('[api/actions POST] Ação sincronizada com sucesso:', { dbId, title: action.title, clientName })
    return NextResponse.json({ success: true, dbId, action: saved[0] })
  } catch (e: any) {
    console.error('[api/actions POST]', e.message)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
