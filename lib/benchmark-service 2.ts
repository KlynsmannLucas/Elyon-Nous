// lib/benchmark-service.ts
// BenchmarkService: reads from Supabase benchmark_cache (real Tavily data) first,
// falls back to hardcoded lib/niche_benchmarks.ts data (estimated research data).
// Always returns a dataSource field so the UI can be transparent about data origin.
'use server'

import { supabaseAdmin } from '@/lib/supabase'
import { BENCHMARKS } from '@/lib/niche_benchmarks'

export type DataSource = 'real_market_data' | 'estimated_data' | 'unavailable'

export interface BenchmarkMeta {
  dataSource: DataSource
  confidence: 'alta' | 'media' | 'baixa' | null
  updatedAt: string | null
  freshDays: number | null
}

export interface LiveBenchmarkMetrics {
  cpl_min: number | null
  cpl_max: number | null
  roas_avg: number | null
  cpc_avg: number | null
  ctr_avg: number | null
  cpm_avg: number | null
  cpa_avg: number | null
}

export interface BenchmarkServiceResult extends LiveBenchmarkMetrics {
  niche_key: string
  niche_name: string
  // Hardcoded enrichment (always available for mapped niches)
  cvr_lead_to_sale: number | null
  avg_ticket: number | null
  ltv_multiplier: number | null
  best_channels: string[]
  budget_floor: number | null
  budget_ideal: number | null
  kpi_thresholds: {
    cpl_good: number | null
    cpl_bad: number | null
    roas_good: number | null
    cvr_good: number | null
  } | null
  insights: string[]
  // Source transparency
  meta: BenchmarkMeta
}

const CACHE_FRESH_DAYS = 35

function daysSince(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86_400_000)
}

export async function getBenchmarkForNiche(nicheKey: string): Promise<BenchmarkServiceResult> {
  console.log(`[benchmark-service] fetch niche="${nicheKey}"`)
  const hardcoded = BENCHMARKS[nicheKey] ?? null

  const base: BenchmarkServiceResult = {
    niche_key: nicheKey,
    niche_name: hardcoded?.name ?? nicheKey,
    cpl_min: hardcoded?.cpl_min ?? null,
    cpl_max: hardcoded?.cpl_max ?? null,
    roas_avg: hardcoded?.kpi_thresholds?.roas_good ?? null,
    cpc_avg: null,
    ctr_avg: null,
    cpm_avg: null,
    cpa_avg: null,
    cvr_lead_to_sale: hardcoded?.cvr_lead_to_sale ?? null,
    avg_ticket: hardcoded?.avg_ticket ?? null,
    ltv_multiplier: hardcoded?.ltv_multiplier ?? null,
    best_channels: hardcoded?.best_channels ?? [],
    budget_floor: hardcoded?.budget_floor ?? null,
    budget_ideal: hardcoded?.budget_ideal ?? null,
    kpi_thresholds: hardcoded?.kpi_thresholds
      ? {
          cpl_good: hardcoded.kpi_thresholds.cpl_good,
          cpl_bad: hardcoded.kpi_thresholds.cpl_bad,
          roas_good: hardcoded.kpi_thresholds.roas_good,
          cvr_good: hardcoded.kpi_thresholds.cvr_good,
        }
      : null,
    insights: hardcoded?.insights ?? [],
    meta: {
      dataSource: hardcoded ? 'estimated_data' : 'unavailable',
      confidence: hardcoded ? 'media' : null,
      updatedAt: null,
      freshDays: null,
    },
  }

  if (!supabaseAdmin) return base

  try {
    const { data, error } = await supabaseAdmin
      .from('benchmark_cache')
      .select('niche_key,niche_name,cpl_min,cpl_max,roas_avg,cpc_avg,ctr_avg,cpm_avg,cpa_avg,confidence,updated_at')
      .eq('niche_key', nicheKey)
      .maybeSingle()

    if (error || !data) {
      console.log(`[benchmark-service] niche="${nicheKey}" not in cache → estimated_data`)
      return base
    }

    const freshDays = data.updated_at ? daysSince(data.updated_at) : null
    const isStale = freshDays !== null && freshDays > CACHE_FRESH_DAYS
    console.log(`[benchmark-service] niche="${nicheKey}" cache hit freshDays=${freshDays} isStale=${isStale}`)

    const liveCPLMin = typeof data.cpl_min === 'number' ? data.cpl_min : null
    const liveCPLMax = typeof data.cpl_max === 'number' ? data.cpl_max : null

    return {
      ...base,
      niche_name: data.niche_name ?? base.niche_name,
      cpl_min: liveCPLMin ?? base.cpl_min,
      cpl_max: liveCPLMax ?? base.cpl_max,
      roas_avg: typeof data.roas_avg === 'number' ? data.roas_avg : base.roas_avg,
      cpc_avg: typeof data.cpc_avg === 'number' ? data.cpc_avg : null,
      ctr_avg: typeof data.ctr_avg === 'number' ? data.ctr_avg : null,
      cpm_avg: typeof data.cpm_avg === 'number' ? data.cpm_avg : null,
      cpa_avg: typeof data.cpa_avg === 'number' ? data.cpa_avg : null,
      meta: {
        dataSource: isStale ? 'estimated_data' : 'real_market_data',
        confidence: (data.confidence as BenchmarkMeta['confidence']) ?? 'media',
        updatedAt: data.updated_at ?? null,
        freshDays,
      },
    }
  } catch {
    return base
  }
}

export async function getBenchmarksForAllNiches(): Promise<Record<string, BenchmarkMeta>> {
  if (!supabaseAdmin) {
    return Object.fromEntries(
      Object.keys(BENCHMARKS).map(k => [k, { dataSource: 'estimated_data' as DataSource, confidence: 'media' as const, updatedAt: null, freshDays: null }])
    )
  }

  const { data } = await supabaseAdmin
    .from('benchmark_cache')
    .select('niche_key,confidence,updated_at')

  const liveMap: Record<string, { confidence: string; updated_at: string }> = {}
  for (const row of data ?? []) {
    liveMap[row.niche_key] = { confidence: row.confidence, updated_at: row.updated_at }
  }

  return Object.fromEntries(
    Object.keys(BENCHMARKS).map(k => {
      const live = liveMap[k]
      if (!live) return [k, { dataSource: 'estimated_data' as DataSource, confidence: 'media' as const, updatedAt: null, freshDays: null }]
      const freshDays = live.updated_at ? daysSince(live.updated_at) : null
      const isStale = freshDays !== null && freshDays > CACHE_FRESH_DAYS
      return [k, {
        dataSource: (isStale ? 'estimated_data' : 'real_market_data') as DataSource,
        confidence: live.confidence as BenchmarkMeta['confidence'],
        updatedAt: live.updated_at ?? null,
        freshDays,
      }]
    })
  )
}
