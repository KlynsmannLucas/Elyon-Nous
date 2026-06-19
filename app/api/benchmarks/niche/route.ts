// app/api/benchmarks/niche/route.ts
// Returns benchmark data for a niche with data source transparency.
// Reads from Supabase benchmark_cache (real Tavily data) first,
// falls back to hardcoded estimates.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getBenchmarkForNiche, getBenchmarksForAllNiches } from '@/lib/benchmark-service'
import { BENCHMARKS, getBenchmark } from '@/lib/niche_benchmarks'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  // Lookup direto por NOME do nicho (server-side) — mantém o shape de getBenchmark()
  // fora do bundle do cliente. Usado pelo hook client useBenchmark.
  const niche = req.nextUrl.searchParams.get('niche')
  if (niche) {
    return NextResponse.json({ benchmark: getBenchmark(niche) })
  }

  const key = req.nextUrl.searchParams.get('key')

  // Return overview of all niches (for audit/admin view)
  if (key === '__all__') {
    const metas = await getBenchmarksForAllNiches()
    const summary = Object.keys(BENCHMARKS).map(k => ({
      key: k,
      name: BENCHMARKS[k]?.name ?? k,
      ...metas[k],
    }))
    return NextResponse.json({ niches: summary, total: summary.length })
  }

  if (!key) {
    return NextResponse.json({ error: 'Parâmetro key é obrigatório' }, { status: 400 })
  }

  const result = await getBenchmarkForNiche(key)
  return NextResponse.json(result)
}
