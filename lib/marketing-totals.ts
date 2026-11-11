/** API int64 values arrive as strings. Reject malformed/unsafe values before adding. */
export function metricNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value !== 'number' && typeof value !== 'string') throw new Error('Métrica numérica inválida.')
  const number = Number(value)
  if (!Number.isFinite(number) || Math.abs(number) > Number.MAX_SAFE_INTEGER) throw new Error('Métrica fora do intervalo numérico seguro. Atualize os dados da fonte.')
  return number
}

type MetricRow = Record<string, any>
const valueOf = (row: MetricRow, key: string) => key === 'results'
  ? row.totalResults ?? row.results ?? row.primaryResultValue ?? row.leads
  : key === 'revenue' ? row.revenue ?? row.conversionValue : row[key]

/** Account totals and campaign totals are two views of the same events, never additive. */
export function platformTotals(campaigns: MetricRow[], totals: MetricRow | null = null) {
  const get = (key: string) => totals && valueOf(totals, key) != null
    ? metricNumber(valueOf(totals, key))
    : campaigns.reduce((sum, campaign) => sum + metricNumber(valueOf(campaign, key)), 0)
  return { spend: get('spend'), impressions: get('impressions'), clicks: get('clicks'), leads: get('leads'), results: get('results'), revenue: get('revenue') }
}

export function aggregateAuditMetrics(sources: { campaigns: MetricRow[]; totals?: MetricRow | null }[]) {
  const totals = sources.map(source => platformTotals(source.campaigns, source.totals))
  const sum = (key: keyof ReturnType<typeof platformTotals>) => totals.reduce((value, row) => value + row[key], 0)
  const totalSpend = sum('spend'), totalLeads = sum('leads'), totalResults = sum('results')
  const totalImpressions = sum('impressions'), totalClicks = sum('clicks'), totalRevenue = sum('revenue')
  const resultKinds = [...new Set(sources.flatMap(source => source.campaigns)
    .filter(row => metricNumber(valueOf(row, 'results')) > 0)
    .map(row => String(row.resultLabel || row.primaryResultLabel || (row.platform === 'google' ? 'Conversões' : 'Resultados'))))]
  const resultsComparable = resultKinds.length <= 1
  const ratio = (numerator: number, denominator: number) => denominator > 0 ? +(numerator / denominator).toFixed(2) : null
  return { totalSpend: +totalSpend.toFixed(2), totalLeads, totalResults, totalRevenue: +totalRevenue.toFixed(2), totalImpressions, totalClicks,
    avgCPL: ratio(totalSpend, totalLeads), avgCostPerResult: resultsComparable ? ratio(totalSpend, totalResults) : null,
    avgROAS: totalRevenue > 0 ? ratio(totalRevenue, totalSpend) : null, avgCTR: ratio(totalClicks * 100, totalImpressions), resultKinds, resultsComparable }
}
