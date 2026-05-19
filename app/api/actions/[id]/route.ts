// app/api/actions/[id]/route.ts — PATCH: atualiza status de uma ação no Supabase
// Garante que a mudança de status (pendente→em_andamento→concluida→ignorada)
// sobrevive a refresh, logout e troca de device
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { updateActionStatusInDB } from '@/lib/persistence'

const VALID_STATUSES = ['pendente', 'em_andamento', 'concluida', 'ignorada']

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id } = params
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    const body = await req.json()
    const { status } = body

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Status inválido. Use: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const updated = await updateActionStatusInDB(userId, id, status)
    if (!updated) {
      return NextResponse.json(
        { error: 'Ação não encontrada ou sem permissão para atualizar' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, action: updated })
  } catch (e: any) {
    console.error('[api/actions PATCH]', e.message)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
