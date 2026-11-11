// app/api/metrics/daily/route.ts — lê os snapshots diários (daily_metrics) do
// usuário p/ uma conta e devolve a série recente + delta day-over-day.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { resolveReportingPeriod } from '@/lib/reporting-period'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!supabaseAdmin) return NextResponse.json({ error: 'Histórico diário indisponível.' }, { status: 503 })

  const accountId = req.nextUrl.searchParams.get('accountId')
  if (!accountId) return NextResponse.json({ error: 'Selecione a conta deste cliente.' }, { status: 400 })
  let period: ReturnType<typeof resolveReportingPeriod>
  try { period = resolveReportingPeriod({ datePreset: req.nextUrl.searchParams.get('datePreset') || 'last_14d' }) }
  catch { return NextResponse.json({ error: 'Período inválido.' }, { status: 400 }) }

  try {
    let q = supabaseAdmin
      .from('daily_metrics')
      .select('date, spend, leads, impressions, clicks, cpl, ctr, account_id')
      .eq('user_id', userId)
      .eq('platform', 'meta')
      .eq('account_id', accountId)
      .gte('date', period.startDate)
      .lte('date', period.endDate)
      .order('date', { ascending: false })
      .limit(366)

    const { data, error } = await q
    if (error) return NextResponse.json({ error: 'Não foi possível ler o histórico diário.' }, { status: 503 })

    const days = data || []
    const pct = (cur: number, prev: number) => (prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null)
    let delta: any = null
    if (days.length >= 2) {
      const [today, prev] = days
      delta = {
        date:      today.date,
        prevDate:  prev.date,
        spendPct:  pct(Number(today.spend || 0), Number(prev.spend || 0)),
        leadsPct:  pct(Number(today.leads || 0), Number(prev.leads || 0)),
        cplPct:    (today.cpl != null && prev.cpl != null) ? pct(Number(today.cpl), Number(prev.cpl)) : null,
        spend:     Number(today.spend || 0),
        leads:     Number(today.leads || 0),
        cpl:       today.cpl != null ? Number(today.cpl) : null,
      }
    }

    return NextResponse.json({ days, delta, period, platform: 'meta' }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch {
    return NextResponse.json({ error: 'Histórico diário indisponível.' }, { status: 503 })
  }
}
