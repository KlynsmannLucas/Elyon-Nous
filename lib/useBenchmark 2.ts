// lib/useBenchmark.ts
// Hook client que busca o benchmark de UM nicho via API (server-side), mantendo os
// ~42 KB de lib/niche_benchmarks fora do bundle do cliente. Cacheia por nicho.
'use client'

import { useEffect, useState } from 'react'

const cache = new Map<string, any>()

export function useBenchmark(niche?: string | null): any | null {
  const [bench, setBench] = useState<any | null>(() => (niche && cache.has(niche) ? cache.get(niche) : null))

  useEffect(() => {
    if (!niche) { setBench(null); return }
    if (cache.has(niche)) { setBench(cache.get(niche)); return }
    let active = true
    fetch(`/api/benchmarks/niche?niche=${encodeURIComponent(niche)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        const b = d?.benchmark ?? null
        cache.set(niche, b)
        if (active) setBench(b)
      })
      .catch(() => { if (active) setBench(null) })
    return () => { active = false }
  }, [niche])

  return bench
}
