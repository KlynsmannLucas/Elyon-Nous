// app/api/actions/executed/route.ts
// Lista as ações executadas pelo NOUS e mede o efeito: CPL da conta no dia da ação
// vs. CPL atual (de daily_metrics). Fecha o loop "did it work".
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!supabaseAdmin) return NextResponse.json({ actions: [] })

  const clientName = req.nextUrl.searchParams.get('clientName') || undefined

  try {
    let q = supabaseAdmin.from('executed_actions')
      .select('id, account_id, campaign_name, action, cpl_before, executed_at')
      .eq('user_id', userId)
      .order('executed_at', { ascending: false })
      .limit(10)
    if (clientName) q = q.eq('client_name', clientName)
    const { data, error } = await q
    if (error || !data) return NextResponse.json({ actions: [] })

    // CPL atual da conta (último daily_metrics por conta)
    const accountIds = Array.from(new Set(data.map(a => a.account_id).filter(Boolean)))
    const cplNow: Record<string, number | null> = {}
    for (const acc of accountIds) {
      const { data: m } = await supabaseAdmin.from('daily_metrics')
        .select('cpl').eq('user_id', userId).eq('account_id', acc as string).eq('platform', 'meta')
        .order('date', { ascending: false }).limit(1)
      cplNow[acc as string] = m?.[0]?.cpl ?? null
    }

    const DAY = 86400000
    const actions = data.map(a => {
      const days = Math.floor((Date.now() - new Date(a.executed_at).getTime()) / DAY)
      const after = a.account_id ? cplNow[a.account_id] ?? null : null
      const before = a.cpl_before ?? null
      const deltaPct = before && after ? Math.round(((after - before) / before) * 100) : null
      return {
        id: a.id, action: a.action, campaign_name: a.campaign_name,
        days, cpl_before: before, cpl_after: after,
        // só consideramos "medido" após 3 dias para o efeito aparecer
        measured: days >= 3 && before != null && after != null,
        deltaPct,
      }
    })
    return NextResponse.json({ actions })
  } catch {
    return NextResponse.json({ actions: [] })
  }
}
