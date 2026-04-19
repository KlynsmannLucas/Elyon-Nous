// app/api/metrics/route.ts — CRUD de métricas reais no Supabase
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { getBenchmark } from '@/lib/niche_benchmarks'

// GET — busca métricas do usuário
export async function GET(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const clientName = searchParams.get('clientName')

  let q = supabase
    .from('campaign_metrics')
    .select('*')
    .eq('user_id', userId)
    .order('period_month', { ascending: false })
    .limit(60)

  if (clientName) q = q.eq('client_name', clientName)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

// POST — salva nova métrica e retorna análise vs benchmark
export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const body = await req.json()
    const { clientName, channel, periodMonth, spendReal,
            leadsReal, salesReal, revenueReal, notes, niche } = body

    // Salva no Supabase
    const { data, error } = await supabase
      .from('campaign_metrics')
      .insert({
        user_id: userId,
        client_name: clientName,
        channel,
        period_month: periodMonth,
        spend_real: spendReal,
        leads_real: leadsReal,
        sales_real: salesReal,
        revenue_real: revenueReal,
        notes,
        niche,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Análise vs benchmark
    let benchmarkAlert = null
    const bench = getBenchmark(niche || '')
    if (bench && spendReal > 0 && leadsReal > 0) {
      const realCPL = spendReal / leadsReal
      const realROAS = revenueReal > 0 ? revenueReal / spendReal : 0

      const cplStatus =
        realCPL < bench.cpl_min ? 'excelente' :
        realCPL <= bench.cpl_max ? 'bom' : 'alto'

      const roasStatus =
        realROAS >= bench.kpi_thresholds.roas_good ? 'bom' :
        realROAS >= bench.kpi_thresholds.roas_good * 0.7 ? 'atenção' : 'baixo'

      benchmarkAlert = {
        realCPL: Math.round(realCPL),
        realROAS: Math.round(realROAS * 10) / 10,
        benchCPLMin: bench.cpl_min,
        benchCPLMax: bench.cpl_max,
        benchROAS: bench.kpi_thresholds.roas_good,
        cplStatus,
        roasStatus,
      }
    }

    return NextResponse.json({ success: true, data, benchmarkAlert })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE — remove uma métrica
export async function DELETE(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const { error } = await supabase
    .from('campaign_metrics')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
