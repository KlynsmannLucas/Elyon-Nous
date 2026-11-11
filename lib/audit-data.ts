/** Historic reports remain archived; old arithmetic is not reused as current metrics. */
export function normalizeAuditCache(value: unknown): Record<string, any[]> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(Object.entries(value).map(([name, history]) => {
    const entries = Array.isArray(history) ? history : history ? [history] : []
    return [name, entries.map((entry, index) => {
      const audit = entry?.audit || entry
      if (!audit || typeof audit !== 'object') return null
      const record = entry?.audit ? entry : { id: `restored-${name}-${index}`, audit, createdAt: audit.generated_at || null }
      if (audit._metricsVersion === 2 || !audit._realMetrics) return record
      return { ...record, audit: { ...audit, _legacyRealMetrics: audit._realMetrics, _realMetrics: null,
        _legacyCampaignClassification: audit._campanhasClassificadas, _campanhasClassificadas: null, _metricsNeedRefresh: true } }
    }).filter(Boolean)]
  }))
}
