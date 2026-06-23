// app/api/actions/executed/route.ts
// Lista as ações executadas pelo NOUS e mede o efeito: CPL da conta no dia da ação
// vs. CPL atual (de daily_metrics). Fecha o loop "did it work" e agrega o
// "Impacto ELYON" — quanto a conta melhorou DESDE que o NOUS começou a agir.
//
// Honestidade: a economia é uma ESTIMATIVA (queda real de CPL × volume de leads
// dos últimos ~30d). Só aparece quando há histórico medido; senão devolvemos só
// as contagens reais de ações — nunca um número inventado.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

const DAY = 86400000

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!supabaseAdmin) return NextResponse.json({ actions: [], summary: null })

  const clientName = req.nextUrl.searchParams.get('clientName') || undefined

  try {
    let q = supabaseAdmin.from('executed_actions')
      .select('id, account_id, campaign_name, action, cpl_before, executed_at')
      .eq('user_id', userId)
      .order('executed_at', { ascending: false })
      .limit(200)
    if (clientName) q = q.eq('client_name', clientName)
    const { data, error } = await q
    if (error || !data || data.length === 0) return NextResponse.json({ actions: [], summary: null })

    // Conta principal = a com mais ações (de onde tiramos a trajetória de CPL).
    const accCount: Record<string, number> = {}
    for (const a of data) if (a.account_id) accCount[a.account_id] = (accCount[a.account_id] || 0) + 1
    const primaryAcc = Object.entries(accCount).sort((x, y) => y[1] - x[1])[0]?.[0] || null

    // Série recente da conta principal (Meta) — CPL atual + volume de leads ~30d.
    let cplNow: number | null = null
    let leads30d = 0
    let spend30d = 0
    const cplByAcc: Record<string, number | null> = {}
    const accountIds = Array.from(new Set(data.map(a => a.account_id).filter(Boolean))) as string[]
    for (const acc of accountIds) {
      // Sem filtro de plataforma: um account_id pertence a um canal (Meta OU Google);
      // assim o Impacto mede tanto Meta quanto Google (daily_metrics agora cobre os dois).
      const { data: m } = await supabaseAdmin.from('daily_metrics')
        .select('date, cpl, leads, spend').eq('user_id', userId).eq('account_id', acc)
        .order('date', { ascending: false }).limit(30)
      const latestCpl = (m || []).find(r => r.cpl != null)?.cpl ?? null
      cplByAcc[acc] = latestCpl
      if (acc === primaryAcc) {
        cplNow = latestCpl
        leads30d = (m || []).reduce((s, r) => s + (r.leads || 0), 0)
        spend30d = (m || []).reduce((s, r) => s + Number(r.spend || 0), 0)
      }
    }

    // Lista por ação (efeito no CPL da conta) — mantém compatibilidade com a UI atual.
    const actions = data.slice(0, 12).map(a => {
      const days = Math.floor((Date.now() - new Date(a.executed_at).getTime()) / DAY)
      const after = a.account_id ? cplByAcc[a.account_id] ?? null : null
      const before = a.cpl_before ?? null
      const deltaPct = before && after ? Math.round(((after - before) / before) * 100) : null
      return {
        id: a.id, action: a.action, campaign_name: a.campaign_name,
        days, cpl_before: before, cpl_after: after,
        measured: days >= 3 && before != null && after != null,
        deltaPct,
      }
    })

    // ── Agregado "Impacto ELYON" ──────────────────────────────────────────────
    const pauses = data.filter(a => a.action === 'pause').length
    const scales = data.filter(a => a.action === 'scale').length
    const resumes = data.filter(a => a.action === 'resume').length

    // Baseline = CPL da conta no dia da PRIMEIRA ação do NOUS (quando começou a agir).
    const asc = [...data].reverse()
    const firstAt = asc[0]?.executed_at ? new Date(asc[0].executed_at).getTime() : null
    const daysSinceFirst = firstAt ? Math.floor((Date.now() - firstAt) / DAY) : 0
    const cplBaseline = asc.find(a => a.cpl_before != null)?.cpl_before ?? null

    const improved = cplBaseline != null && cplNow != null && cplNow < cplBaseline
    const cplDeltaPct = cplBaseline != null && cplNow != null && cplBaseline > 0
      ? Math.round(((cplNow - cplBaseline) / cplBaseline) * 100) : null
    // Economia/mês estimada = (queda de CPL) × leads recentes. Só com efeito medido (≥3d).
    const estMonthlySavings = improved && leads30d > 0 && daysSinceFirst >= 3
      ? Math.round((cplBaseline! - cplNow!) * leads30d) : null

    const summary = {
      count: data.length,
      pauses, scales, resumes,
      measuredCount: actions.filter(a => a.measured).length,
      cplBaseline, cplNow, cplDeltaPct, improved,
      leads30d, spend30d, daysSinceFirst,
      estMonthlySavings,
    }

    return NextResponse.json({ actions, summary })
  } catch {
    return NextResponse.json({ actions: [], summary: null })
  }
}
