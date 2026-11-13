export async function graph(path: string, token: string, params: Record<string, string>, maxRows = 1500) {
  const rows: any[] = [],
    seen = new Set<string>()
  let after = ''
  let truncated = false
  for (let page = 0; page < 20; page++) {
    const query = new URLSearchParams({ ...params, limit: '100', ...(after ? { after } : {}) })
    const response = await fetch(`https://graph.facebook.com/v21.0/${path}?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(18000),
      redirect: 'error',
    })
    const data = await response.json()
    if (!response.ok || data.error)
      throw new Error('O Meta não disponibilizou este recorte. Confira permissões e tente novamente.')
    if (!Array.isArray(data.data)) throw new Error('O Meta retornou uma coleção inválida.')
    rows.push(...data.data)
    const next = data.paging?.next ? data.paging?.cursors?.after : null
    if (!data.paging?.next) return { rows, truncated }
    if (!next || seen.has(next)) throw new Error('A paginação do Meta não pôde ser confirmada.')
    if (rows.length >= maxRows || page === 19) {
      truncated = true
      break
    }
    seen.add(next)
    after = next
  }
  return { rows: rows.slice(0, maxRows), truncated }
}
