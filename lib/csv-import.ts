// lib/csv-import.ts — Utilitários de parsing de CSV/XLSX reutilizáveis
// (compartilhado entre TabAuditoria e SetupWizard)

export interface ParsedCampaign {
  name: string
  platform: 'meta' | 'google' | 'unknown'
  spend: number
  leads: number
  cpl: number
  ctr: number
  clicks: number
  impressions: number
  roas: number
  revenue: number
  status?: string
}

export interface ImportSummary {
  platform: 'meta' | 'google' | 'unknown'
  campaigns: ParsedCampaign[]
  totalSpend: number
  totalLeads: number
  avgCPL: number
  filename: string
}

function parseNum(v: any): number {
  if (v === null || v === undefined || v === '') return 0
  if (typeof v === 'number') return isNaN(v) ? 0 : v
  const s = String(v).replace(/[R$\s%×x\u00A0]/g, '').trim()
  if (!s || s === '-' || s === '–' || s === 'N/A' || s === '--') return 0
  if (s.includes(',')) return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0
  return parseFloat(s.replace(/,/g, '')) || 0
}

function colKey(s: string) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ').trim()
}

function findCol(row: Record<string, any>, ...aliases: string[]): any {
  const entries = Object.entries(row)
  const normalized = entries.map(([k, v]) => [colKey(k), v] as [string, any])
  for (const alias of aliases) {
    const a = colKey(alias)
    const exact = normalized.find(([k]) => k === a)
    if (exact) return exact[1]
  }
  for (const alias of aliases) {
    const a = colKey(alias)
    const sw = normalized.find(([k]) => k.startsWith(a + ' ') || k === a)
    if (sw) return sw[1]
  }
  for (const alias of aliases) {
    const a = colKey(alias)
    const inc = normalized.find(([k]) => k.includes(a))
    if (inc) return inc[1]
  }
  return ''
}

function normalizeRow(row: Record<string, any>): ParsedCampaign {
  const name = findCol(row,
    'nome da campanha', 'campanha', 'campaign name', 'campaign', 'nome',
    'nome do anuncio', 'ad name', 'conjunto de anuncios', 'ad set name',
  ) || 'Sem nome'

  const spend = parseNum(findCol(row,
    'valor usado', 'valor gasto', 'quantia gasta', 'amount spent',
    'custo', 'cost', 'gasto', 'spend', 'investimento', 'total gasto',
  ))

  const impressions = parseNum(findCol(row, 'impressoes', 'impressions', 'impr'))
  const clicks = parseNum(findCol(row, 'cliques no link', 'link clicks', 'cliques', 'clicks', 'clique'))
  const ctr = parseNum(findCol(row, 'ctr'))
  const roas = parseNum(findCol(row, 'roas', 'retorno sobre', 'purchase roas'))
  const revenue = parseNum(findCol(row, 'valor conv', 'conv  value', 'valor de conversao', 'receita', 'revenue'))

  const leads = parseNum(findCol(row,
    'conversoes', 'conversions', 'conv.', 'conv ', 'conv',
    'mensagens iniciadas', 'conversas iniciadas', 'novo contato no whatsapp',
    'contatos no whatsapp', 'mensagem iniciada', 'conversa iniciada',
    'messaging conversations started', 'conversations started',
    'leads',
    'resultados', 'resultado', 'results', 'result',
    'acoes na publicacao', 'acoes', 'actions',
    'total de resultados', 'total de leads',
  ))

  const cpl = parseNum(findCol(row,
    'custo conv', 'custo   conv', 'cost conv', 'cost   conv',
    'custo por conversao', 'cost per conversion',
    'custo por conversa iniciada', 'custo por mensagem iniciada',
    'custo por novo contato no whatsapp', 'custo por contato no whatsapp',
    'custo por resultado', 'cost per result',
    'custo por lead', 'cost per lead',
    'custo por acao', 'cpa', 'cpl',
  )) || (leads > 0 && spend > 0 ? spend / leads : 0)

  const status = String(findCol(row, 'estado', 'status', 'situacao', 'delivery', 'veiculacao') || '')

  return {
    name: String(name).trim(),
    platform: 'unknown',
    spend, leads, cpl, ctr, clicks, impressions, roas, revenue, status,
  }
}

function detectPlatform(headers: string[]): 'meta' | 'google' | 'unknown' {
  const h = headers.join(' ').toLowerCase()
  if (h.includes('custo / conv') || h.includes('cost / conv') || h.includes('cpc med') ||
      h.includes('avg. cpc') || h.includes('tipo de campanha') || h.includes('campaign type') ||
      h.includes('taxa de conv') || h.includes('quality score') || h.includes('impressao')) return 'google'
  if (h.includes('frequencia') || h.includes('frequency') || h.includes('alcance') ||
      h.includes('reach') || h.includes('valor usado') || h.includes('amount spent') ||
      h.includes('mensagens iniciadas') || h.includes('contatos no whatsapp')) return 'meta'
  return 'unknown'
}

function aggregateCampaigns(rows: ParsedCampaign[]): ParsedCampaign[] {
  const map = new Map<string, ParsedCampaign>()
  for (const r of rows) {
    const key = r.name?.trim()
    if (!key) continue
    if (!map.has(key)) {
      map.set(key, { ...r })
    } else {
      const agg = map.get(key)!
      agg.spend       += r.spend
      agg.impressions += r.impressions
      agg.clicks      += r.clicks
      agg.leads       += r.leads
      agg.revenue     += r.revenue
      agg.cpl         = agg.leads > 0 ? agg.spend / agg.leads : 0
      agg.ctr         = agg.impressions > 0 ? (agg.clicks / agg.impressions) * 100 : 0
      agg.roas        = agg.spend > 0 && agg.revenue > 0 ? agg.revenue / agg.spend : 0
    }
  }
  return Array.from(map.values())
}

function parseCSVLine(line: string, sep: string): string[] {
  const result: string[] = []
  let cur = '', inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { inQ = !inQ; continue }
    if (ch === sep && !inQ) { result.push(cur); cur = ''; continue }
    cur += ch
  }
  result.push(cur)
  return result
}

export async function parseImportFile(file: File): Promise<ImportSummary> {
  const name = file.name.toLowerCase()
  let campaigns: ParsedCampaign[] = []
  let platform: 'meta' | 'google' | 'unknown' = 'unknown'

  if (name.endsWith('.csv')) {
    const text = (await file.text()).replace(/^\uFEFF/, '')
    const lines = text.split('\n').filter(l => l.trim())
    const sep = lines[0].includes(';') ? ';' : ','
    const headers = parseCSVLine(lines[0], sep).map(h => h.replace(/"/g, '').trim())
    platform = detectPlatform(headers)
    campaigns = aggregateCampaigns(
      lines.slice(1).map(line => {
        const vals = parseCSVLine(line, sep)
        const obj: Record<string, string> = {}
        headers.forEach((h, i) => { obj[h] = vals[i] ?? '' })
        return normalizeRow(obj)
      }).filter(r => r.name && r.name.trim() && r.name !== 'Sem nome')
    )
  } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const buf = await file.arrayBuffer()
    const { read, utils } = await import('xlsx')
    const wb = read(buf)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const json: Record<string, string>[] = utils.sheet_to_json(ws, { defval: '' })
    const headers = json.length > 0 ? Object.keys(json[0]) : []
    platform = detectPlatform(headers)
    campaigns = aggregateCampaigns(
      json.map(normalizeRow).filter(r => r.name && r.name.trim() && r.name !== 'Sem nome')
    )
  }

  campaigns.forEach(c => { c.platform = platform })
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0)
  const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0)
  const avgCPL = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0

  return { platform, campaigns, totalSpend, totalLeads, avgCPL, filename: file.name }
}
