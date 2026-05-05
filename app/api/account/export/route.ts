// app/api/account/export/route.ts — LGPD Art. 18: portabilidade de dados do usuário
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })
  }

  const [clientsRes, strategiesRes, metricsRes] = await Promise.all([
    supabaseAdmin.from('clients').select('*').eq('user_id', userId),
    supabaseAdmin.from('strategies').select('*').eq('user_id', userId),
    supabaseAdmin.from('metrics').select('*').eq('user_id', userId),
  ])

  const exportData = {
    exportedAt: new Date().toISOString(),
    userId,
    email: (sessionClaims?.email as string) ?? null,
    data: {
      clients:    clientsRes.data   ?? [],
      strategies: strategiesRes.data ?? [],
      metrics:    metricsRes.data   ?? [],
    },
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="elyon-dados-${new Date().toISOString().slice(0,10)}.json"`,
    },
  })
}
