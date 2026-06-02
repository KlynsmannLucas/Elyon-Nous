// components/dashboard/TabAuditoria.tsx — Auditoria sênior nível consultor premium (11 seções)
'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import type { ClientData } from '@/lib/store'
import { useClientActions } from '@/hooks/useClientActions'

interface Props { clientData: ClientData | null }

// ─── Helpers visuais ─────────────────────────────────────────────────────────
function fmt(n: number) {
  if (!n) return 'R$0'
  if (n >= 1_000_000) return `R$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000)      return `R$${(n / 1000).toFixed(1)}k`
  return `R$${n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const gradeColor: Record<string, string> = {
  'A+': '#22C55E', 'A': '#22C55E', 'A-': '#34D399',
  'B+': '#F0B429', 'B': '#F0B429', 'B-': '#FCD34D',
  'C+': '#FB923C', 'C': '#FB923C', 'D': '#FF4D4D',
}

function SectionHeader({ num, icon, title, color }: { num: string; icon: string; title: string; color?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono"
        style={{ background: `${color || '#F0B429'}15`, color: color || '#F0B429', border: `1px solid ${color || '#F0B429'}25` }}>
        {num}
      </span>
      <span className="text-lg">{icon}</span>
      <h3 className="font-display font-bold text-white text-base">{title}</h3>
    </div>
  )
}

function Pill({ text, color }: { text: string; color: string }) {
  return (
    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}>
      {text}
    </span>
  )
}

function BoolBadge({ val, trueLabel = 'Sim', falseLabel = 'Não' }: { val: boolean | null; trueLabel?: string; falseLabel?: string }) {
  if (val === null || val === undefined) return <Pill text="Não verificado" color="#64748B" />
  return val ? <Pill text={trueLabel} color="#22C55E" /> : <Pill text={falseLabel} color="#FF4D4D" />
}

function ItemList({ items, color, icon = '→' }: { items: string[]; color?: string; icon?: string }) {
  if (!items?.length) return null
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
          <span className="flex-shrink-0 mt-0.5 text-xs" style={{ color: color || '#F0B429' }}>{icon}</span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  )
}

function PlatformBlock({ label, icon, color, children }: { label: string; icon: string; color: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#16161A] border border-[#2A2A30] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span>{icon}</span>
        <span className="font-bold text-sm" style={{ color }}>{label}</span>
      </div>
      {children}
    </div>
  )
}

// ─── Parser de arquivo ────────────────────────────────────────────────────────
// Converte qualquer valor para número — suporta XLSX (number nativo), PT-BR (1.234,56) e US (1234.56)
function parseNum(v: any): number {
  if (v === null || v === undefined || v === '') return 0
  // XLSX retorna números nativos — retorna direto sem processar como string
  if (typeof v === 'number') return isNaN(v) ? 0 : v
  const s = String(v).replace(/[R$\s%×x\u00A0]/g, '').trim()
  if (!s || s === '-' || s === '–' || s === 'N/A' || s === '--' || s === '0,00' && false) return 0
  // PT-BR: vírgula como decimal e ponto como milhar  → "1.234,56" → 1234.56
  if (s.includes(',')) return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0
  // US / número limpo: ponto como decimal → "1234.56" ou "1234"
  return parseFloat(s.replace(/,/g, '')) || 0
}

// Normaliza string de coluna: remove acentos, pontuação, espaços extras → comparação limpa
function colKey(s: string) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // remove acentos
    .replace(/[^a-z0-9\s]/g, ' ')                        // remove pontuação
    .replace(/\s+/g, ' ').trim()
}

// Encontra coluna por lista de aliases — tenta match exato primeiro, depois partial
function findCol(row: Record<string, any>, ...aliases: string[]): any {
  const entries = Object.entries(row)
  const normalized = entries.map(([k, v]) => [colKey(k), v] as [string, any])

  for (const alias of aliases) {
    const a = colKey(alias)
    // Exact match
    const exact = normalized.find(([k]) => k === a)
    if (exact) return exact[1]
  }
  for (const alias of aliases) {
    const a = colKey(alias)
    // Starts-with match (evita false positives: "custo" não pega "custo por conv")
    const sw = normalized.find(([k]) => k.startsWith(a + ' ') || k === a)
    if (sw) return sw[1]
  }
  for (const alias of aliases) {
    const a = colKey(alias)
    // Contains match como último recurso
    const inc = normalized.find(([k]) => k.includes(a))
    if (inc) return inc[1]
  }
  return ''
}

// Detecta o nível do export (campanha / conjunto / anúncio) pelas colunas presentes
function detectLevel(row: Record<string, any>): 'ad' | 'adset' | 'campaign' {
  const keys = Object.keys(row).map(k => colKey(k))
  if (keys.some(k => k.includes('nome do anuncio') || k === 'ad name' || k.includes('ad name'))) return 'ad'
  if (keys.some(k => k.includes('conjunto de anuncios') || k.includes('ad set'))) return 'adset'
  return 'campaign'
}

function normalizeRow(row: Record<string, any>): Record<string, any> {
  // ── Nome: usa o identificador MAIS ESPECÍFICO disponível ──────────────────
  // Isso evita que exports de conjunto + anúncio colem no mesmo nome de campanha
  // e dupliquem o gasto na agregação.
  //
  // Ad level   → usa nome do anúncio (único por linha)
  // Ad set level → usa nome do conjunto (único por linha)
  // Campaign level → usa nome da campanha
  const level = detectLevel(row)
  const adName     = findCol(row, 'nome do anuncio', 'ad name', 'criativo', 'creative')
  const adSetName  = findCol(row, 'conjunto de anuncios', 'ad set name', 'ad set')
  const campName   = findCol(row, 'nome da campanha', 'campanha', 'campaign name', 'campaign', 'nome')
  const name = level === 'ad'    ? (adName    || adSetName || campName)
             : level === 'adset' ? (adSetName || campName)
             : campName

  // ── Status ─────────────────────────────────────────────────────────────────
  const status = findCol(row, 'estado', 'status', 'situacao', 'delivery', 'veiculo', 'veiculacao')

  // ── Tipo de campanha (Google: "Tipo de campanha" / "Campaign type") ────────
  const campaignType = findCol(row, 'tipo de campanha', 'campaign type', 'tipo')

  // ── Investimento / Custo ───────────────────────────────────────────────────
  // Google PT: "Custo" | Google EN: "Cost"
  // Meta PT: "Valor usado (BRL)" / "Quantia gasta" | Meta EN: "Amount spent"
  const spend = parseNum(findCol(row,
    // Meta PT: "Valor usado (BRL)" / "Quantia gasta (BRL)"
    'valor usado', 'valor gasto', 'quantia gasta', 'amount spent',
    // Google PT: "Custo" | EN: "Cost"
    'custo', 'cost',
    // genéricos
    'gasto', 'spend', 'investimento', 'total gasto', 'total spent',
  ))

  // ── Impressões ─────────────────────────────────────────────────────────────
  const impr = parseNum(findCol(row, 'impressoes', 'impressions', 'impr'))

  // ── Cliques ────────────────────────────────────────────────────────────────
  // Meta: "Cliques no link" | Google: "Cliques"
  const clicks = parseNum(findCol(row, 'cliques no link', 'link clicks', 'cliques', 'clicks', 'clique'))

  // ── CTR ────────────────────────────────────────────────────────────────────
  // Google EN: "CTR" | Meta PT: "CTR (taxa de cliques no link)"
  const ctr = parseNum(findCol(row, 'ctr'))

  // ── CPC ────────────────────────────────────────────────────────────────────
  // Google: "CPC med." / "Avg. CPC" | Meta: "CPC (custo por clique)"
  const cpc = parseNum(findCol(row, 'cpc med', 'avg cpc', 'cpc medio', 'cpc'))

  // ── Indicador de resultado (Meta) ─────────────────────────────────────────
  // "Indicador de resultado" diz o que "Resultados" representa naquela campanha.
  // Para campanhas de Tráfego: "Cliques no link" → resultados = cliques, NÃO leads.
  // Para campanhas de Leads: "Leads" ou "Mensagens iniciadas" → resultados = leads.
  const resultIndicatorRaw = String(findCol(row,
    'indicador de resultado', 'indicador do resultado',
    'result indicator', 'tipo de resultado', 'result type',
  ) || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  // Se o indicador aponta para métrica de tráfego, zera leads para não poluir o CPL
  const resultIsTraffic = resultIndicatorRaw.length > 0 && (
    resultIndicatorRaw.includes('clique') || resultIndicatorRaw.includes('click') ||
    resultIndicatorRaw.includes('visualiza') || resultIndicatorRaw.includes('view') ||
    resultIndicatorRaw.includes('alcance') || resultIndicatorRaw.includes('reach') ||
    resultIndicatorRaw.includes('impressao') || resultIndicatorRaw.includes('impression') ||
    resultIndicatorRaw.includes('reproducao') || resultIndicatorRaw.includes('play') ||
    resultIndicatorRaw.includes('engajamento') || resultIndicatorRaw.includes('engagement') ||
    resultIndicatorRaw.includes('curtida') || resultIndicatorRaw.includes('like') ||
    resultIndicatorRaw.includes('trafego') || resultIndicatorRaw.includes('traffic')
  )

  // ── Conversões / Leads / Resultados ───────────────────────────────────────
  // Prioridade: métricas específicas de lead/conversa antes de "Resultados"
  // (que no Meta pode ser micro-conversão — ex: "cliques em mensagem")
  //
  // Google PT: "Conversoes" | Google EN: "Conversions" / "Conv."
  // Meta Mensagens PT: "Mensagens iniciadas" / "Conversas iniciadas" / "Contatos no WhatsApp"
  // Meta Lead Ads PT: "Leads" | Meta genérico PT: "Resultados"
  const leads = resultIsTraffic ? 0 : parseNum(findCol(row,
    // Google PT/EN
    'conversoes', 'conversions', 'conv.', 'conv ', 'conv',
    // Meta — específicos de mensagens/WhatsApp (prioridade antes de "resultados")
    'mensagens iniciadas', 'conversas iniciadas', 'novo contato no whatsapp',
    'contatos no whatsapp', 'mensagem iniciada', 'conversa iniciada',
    'messaging conversations started', 'conversations started',
    // Meta Lead Ads
    'leads',
    // Meta genérico — último recurso (pode ser micro-métrica)
    'resultados', 'resultado', 'results', 'result',
    'acoes na publicacao', 'acoes', 'actions',
    // outros padrões de exportação
    'total de resultados', 'total de leads', 'total de conversoes',
  ))

  // ── CPA / CPL — custo por conversão ───────────────────────────────────────
  // Google PT: "Custo / conv." | Google EN: "Cost / conv."
  // Meta Mensagens: "Custo por conversa iniciada" / "Custo por mensagem iniciada"
  // Meta genérico: "Custo por resultado" | Meta EN: "Cost per result"
  // Quando resultIsTraffic: "Custo por resultado" é CPC, não CPL real → zeramos
  const rawCPL = parseNum(findCol(row,
    // Google PT: "Custo / conv." → colKey → "custo conv"
    'custo conv', 'custo   conv', 'cost conv', 'cost   conv',
    'custo por conversao', 'cost per conversion',
    // Meta — específicos de mensagens/WhatsApp (prioridade)
    'custo por conversa iniciada', 'custo por mensagem iniciada',
    'custo por novo contato no whatsapp', 'custo por contato no whatsapp',
    'cost per messaging conversation started', 'cost per conversation started',
    // Meta Lead Ads / genérico
    'custo por resultado', 'cost per result',
    'custo por lead', 'cost per lead',
    'custo por acao na publicacao', 'custo por acao', 'cost per action',
    'cpa', 'cpl',
  ))
  const cpl = resultIsTraffic ? 0 : rawCPL

  // ── Taxa de conversão ──────────────────────────────────────────────────────
  const convRate = parseNum(findCol(row, 'taxa de conv', 'conv  rate', 'conversion rate'))

  // ── ROAS ───────────────────────────────────────────────────────────────────
  const roas = parseNum(findCol(row, 'roas', 'retorno sobre', 'purchase roas'))

  // ── Frequência (Meta) ──────────────────────────────────────────────────────
  const frequency = parseNum(findCol(row, 'frequencia', 'frequency', 'freq'))

  // ── Alcance / Reach (Meta) ─────────────────────────────────────────────────
  const reach = parseNum(findCol(row, 'alcance', 'reach'))

  // ── Valor de conversão / Receita ───────────────────────────────────────────
  // Google: "Valor conv." / "Conv. value" | Meta: "Valor de conversão de compra"
  const revenue = parseNum(findCol(row,
    'valor conv', 'conv  value', 'valor de conversao',
    'receita', 'revenue', 'conversion value',
  ))

  // ── Outros ────────────────────────────────────────────────────────────────
  const placement = findCol(row, 'posicionamento', 'placement', 'posicao', 'device', 'dispositivo')

  return {
    name, status, campaignType, level,
    spend, impressions: impr, clicks, ctr, cpc,
    leads, cpl, convRate, roas, frequency, reach, revenue,
    placement, adName,
  }
}

// Agrega linhas da mesma campanha (ex: export com breakdown por dia/dispositivo)
function aggregateCampaigns(rows: Record<string, any>[]): Record<string, any>[] {
  const map = new Map<string, Record<string, any>>()
  for (const r of rows) {
    const key = r.name?.trim()
    if (!key) continue
    if (!map.has(key)) {
      map.set(key, { ...r })
    } else {
      const agg = map.get(key)!
      agg.spend       = (agg.spend       || 0) + (r.spend       || 0)
      agg.impressions = (agg.impressions || 0) + (r.impressions || 0)
      agg.clicks      = (agg.clicks      || 0) + (r.clicks      || 0)
      agg.leads       = (agg.leads       || 0) + (r.leads       || 0)
      agg.revenue     = (agg.revenue     || 0) + (r.revenue     || 0)
      agg.reach       = (agg.reach       || 0) + (r.reach       || 0)
      // recalcula métricas derivadas
      agg.cpl         = agg.leads > 0 ? agg.spend / agg.leads : 0
      agg.ctr         = agg.impressions > 0 ? (agg.clicks / agg.impressions) * 100 : 0
      agg.cpc         = agg.clicks > 0 ? agg.spend / agg.clicks : 0
      agg.roas        = agg.spend > 0 && agg.revenue > 0 ? agg.revenue / agg.spend : 0
    }
  }
  return Array.from(map.values())
}

function detectPlatform(headers: string[]): 'meta' | 'google' | 'unknown' {
  const h = headers.join(' ').toLowerCase()
  // Google Ads signals (PT + EN)
  if (h.includes('custo / conv') || h.includes('cost / conv') ||
      h.includes('cpc med') || h.includes('avg. cpc') || h.includes('avg cpc') ||
      h.includes('tipo de campanha') || h.includes('campaign type') ||
      h.includes('taxa de conv') || h.includes('conv. rate') ||
      h.includes('keyword') || h.includes('search term') ||
      h.includes('quality score') || h.includes('impressao') && !h.includes('frequencia')) return 'google'
  // Meta Ads signals (PT + EN)
  if (h.includes('valor usado') || h.includes('amount spent') ||
      h.includes('conjunto de anuncios') || h.includes('ad set') ||
      h.includes('frequencia') || h.includes('frequency') ||
      h.includes('alcance') || h.includes('reach') ||
      h.includes('facebook') || h.includes('meta') ||
      h.includes('custo por resultado') || h.includes('cost per result')) return 'meta'
  return 'unknown'
}

// Parsing robusto de CSV: suporta campos quoted com vírgulas internas
function parseCSVLine(line: string, sep: string): string[] {
  if (!line.includes('"')) return line.split(sep).map(v => v.trim())
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === sep && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

interface UploadedFile {
  file: File
  campaigns: any[]
  platform: 'meta' | 'google' | 'unknown'
  level: 'ad' | 'adset' | 'campaign' | 'mixed'
  rowCount: number
  showCampaigns?: boolean
}

// ─── Componente principal ────────────────────────────────────────────────────
export function TabAuditoria({ clientData }: Props) {
  const { connectedAccounts, auditCache, setAuditCache, deleteAuditEntry, selectedMetaAccountByClient, selectedGoogleAccountByClient, addPendingActions, setClientHealthScore } = useAppStore()
  const clientKey = clientData?.clientName || ''
  const selectedMetaAccountId   = selectedMetaAccountByClient[clientKey]   || ''
  const selectedGoogleAccountId = selectedGoogleAccountByClient[clientKey] || ''
  const [audit,             setAudit]             = useState<Record<string, any> | null>(null)
  const [selectedId,        setSelectedId]        = useState<string | null>(null)
  const [loading,           setLoading]           = useState(false)
  const [loadingStep,       setLoadingStep]        = useState('')
  const [pdfLoading,        setPdfLoading]        = useState(false)
  const [error,             setError]             = useState('')
  const [source,            setSource]            = useState<'ai' | 'benchmark' | null>(null)
  const [persistenceStatus, setPersistenceStatus] = useState<Record<string, any> | null>(null)
  const [dragOver,      setDragOver]      = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [parseError,    setParseError]    = useState('')
  const [activeAction,  setActiveAction]  = useState<'curto' | 'medio' | 'longo'>('curto')
  const [datePreset,    setDatePreset]    = useState<string>('last_30d')
  const [auditSource,   setAuditSource]   = useState<'api' | 'upload' | 'consolidate'>('api')
  const [sentActions,   setSentActions]   = useState<Set<number>>(new Set())
  const [actionToast,   setActionToast]   = useState<{ msg: string; ok: boolean } | null>(null)
  const [campTab,       setCampTab]       = useState<'vencedoras' | 'atencao' | 'criticas'>('vencedoras')
  const [collapsed,     setCollapsed]     = useState<Record<string, boolean>>({
    visao_geral: true, estrutura: true, tracking: false, checklist: false,
    performance: true, criativos: true, publicos: true, funil: true,
  })

  const key = clientData?.clientName || ''

  // Hidrata store com dados do Supabase ao montar / trocar cliente
  // Garante que ações e score sobrevivem a logout/refresh/troca de device
  useClientActions({ clientName: clientData?.clientName, enabled: !loading })

  // Normaliza histórico: suporta formato legado (objeto único) e novo (array)
  const history: import('@/lib/store').AuditEntry[] = (() => {
    const raw = auditCache[key]
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    return [{ id: 'legacy', audit: raw, createdAt: '' }]
  })()

  // Carrega auditoria mais recente ao abrir a aba
  useEffect(() => {
    if (clientData?.clientName && history.length > 0 && !audit) {
      const first = history[0]
      setAudit(first.audit)
      setSelectedId(first.id)
      setSource('ai')
    }
  }, [clientData?.clientName])

  // Toast auto-dismiss
  useEffect(() => {
    if (!actionToast) return
    const t = setTimeout(() => setActionToast(null), 2500)
    return () => clearTimeout(t)
  }, [actionToast])

  // Resetar "enviado" ao trocar de auditoria
  useEffect(() => { setSentActions(new Set()) }, [audit?.generated_at])

  const fileRef = useRef<HTMLInputElement>(null)
  const metaAccount   = connectedAccounts.find(a => a.platform === 'meta')
  const googleAccount = connectedAccounts.find(a => a.platform === 'google')
  const hasUpload      = uploadedFiles.length > 0
  const canAudit       = (!!metaAccount || !!googleAccount || hasUpload) && !!clientData

  // Conflito = API + arquivo da MESMA plataforma → usuário precisa escolher fonte
  const hasMetaConflict   = !!metaAccount && uploadedFiles.some(f => f.platform === 'meta')
  const hasGoogleConflict = !!googleAccount && uploadedFiles.some(f => f.platform === 'google')
  const hasSourceConflict  = hasMetaConflict || hasGoogleConflict

  // ── Parse de arquivo ────────────────────────────────────────────────────────
  const parseFile = useCallback(async (file: File) => {
    setParseError('')
    const name = file.name.toLowerCase()
    try {
      let campaigns: any[] = []
      let platform: 'meta' | 'google' | 'unknown' = 'unknown'

      if (name.endsWith('.csv')) {
        const text = (await file.text()).replace(/^\uFEFF/, '') // remove BOM
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
          }).filter(r => r.name && r.name.trim())
        )

      } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        const buf = await file.arrayBuffer()
        const { read, utils } = await import('xlsx')
        const wb = read(buf)
        const ws = wb.Sheets[wb.SheetNames[0]]
        const json: Record<string, string>[] = utils.sheet_to_json(ws, { defval: '' })
        const headers = json.length > 0 ? Object.keys(json[0]) : []
        platform = detectPlatform(headers)
        campaigns = aggregateCampaigns(json.map(normalizeRow).filter(r => r.name && r.name.trim()))

      } else {
        setParseError('Formato inválido. Use .xlsx, .xls ou .csv')
        return
      }

      // Detecta o nível predominante do export
      const levels = campaigns.map((c: any) => c.level as string).filter(Boolean)
      const levelCounts = levels.reduce((acc: Record<string, number>, l) => { acc[l] = (acc[l] || 0) + 1; return acc }, {})
      const dominantLevel = (Object.entries(levelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'campaign') as UploadedFile['level']

      const newFile: UploadedFile = { file, campaigns, platform, level: dominantLevel, rowCount: campaigns.length }
      setUploadedFiles(prev => [...prev, newFile])

    } catch {
      setParseError('Erro ao ler o arquivo. Verifique se é um CSV ou XLSX válido.')
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    Array.from(e.dataTransfer.files).forEach(parseFile)
  }, [parseFile])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(parseFile)
    e.target.value = ''
  }

  const removeFile = (idx: number) => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))

  // ── Auditoria ───────────────────────────────────────────────────────────────
  const handleAudit = async () => {
    if (!clientData) return
    setLoading(true)
    setLoadingStep('Buscando dados das plataformas…')
    setError('')
    setAudit(null)

    try {
      // Busca dados reais das plataformas em paralelo
      // Tokens são buscados server-side via getValidMetaToken/getValidGoogleToken
      const [metaResult, googleResult] = await Promise.all([
        metaAccount
          ? fetch('/api/ads-data/meta', { method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                accountId: selectedMetaAccountId || metaAccount.accountId || undefined,
                datePreset,
              }) })
              .then(r => r.json())
              .catch(() => null)
          : Promise.resolve(null),
        googleAccount
          ? fetch('/api/ads-data/google', { method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                accountId: selectedGoogleAccountId || googleAccount.accountId || undefined,
                datePreset,
              }) })
              .then(r => r.json())
              .catch(() => null)
          : Promise.resolve(null),
      ])

      // Verifica se as chamadas retornaram erro (sem lançar exceção)
      const metaError   = metaResult   && !metaResult.success   ? metaResult.error   : null
      const googleError = googleResult && !googleResult.success ? googleResult.error : null

      // Se ambas falharam e não há upload, reportar erro claro
      if (metaError && googleError && uploadedFiles.length === 0) {
        throw new Error(`Meta Ads: ${metaError} | Google Ads: ${googleError}`)
      }

      setLoadingStep('Normalizando métricas…')

      const metaCampaigns   = metaResult?.success   ? metaResult.campaigns   : []
      const metaTotals      = metaResult?.success   ? metaResult.totals      : null
      const googleCampaigns = googleResult?.success ? googleResult.campaigns : []
      const googleTotals    = googleResult?.success ? googleResult.totals    : null

      // Aviso parcial se uma plataforma falhou mas a outra funcionou
      const partialWarning = (metaError && !googleError && !uploadedFiles.length)
        ? `Meta Ads indisponível (${metaError}) — auditando apenas Google Ads.`
        : (googleError && !metaError && !uploadedFiles.length)
          ? `Google Ads indisponível (${googleError}) — auditando apenas Meta Ads.`
          : null
      if (partialWarning) setError(partialWarning)

      setLoadingStep('Analisando campanhas com IA…')

      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName:    clientData.clientName,
          niche:         clientData.niche,
          budget:        clientData.budget,
          objective:     clientData.objective,
          datePreset,
          metaCampaigns,
          metaTotals,
          googleCampaigns,
          googleTotals,
          uploadedFiles: uploadedFiles.map(f => ({
            filename: f.file.name,
            platform: f.platform,
            campaigns: f.campaigns,
          })),
          auditSource: hasSourceConflict ? auditSource : 'auto',
        }),
      })

      setLoadingStep('Salvando auditoria…')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setAudit(json.audit)
      setSource(json.source)
      setPersistenceStatus(json.persistence ?? null)
      if (!partialWarning) setError('')
      // Persiste no store (Zustand persist → localStorage)
      if (clientData?.clientName) {
        setAuditCache(clientData.clientName, json.audit)
        if (json.priorityActions?.length) addPendingActions(clientData.clientName, json.priorityActions)
        if (json.audit.health_score) {
          setClientHealthScore(
            clientData.clientName,
            json.audit.health_score,
            json.audit.grade || 'B',
            json.source === 'ai' ? 'ai' : 'benchmark',
          )
        }
      }

    } catch (e: any) {
      const msg = e.message || 'Erro ao gerar auditoria.'
      // Mensagens de erro mais amigáveis
      const friendly = msg.includes('TOKEN_EXPIRED') ? 'Token da plataforma expirado. Reconecte a conta em Conexões.'
        : msg.includes('NO_CONNECTION') ? 'Conta não conectada. Vá em Conexões e vincule sua conta.'
        : msg.includes('NO_ACCOUNT_ID') ? 'ID da conta não encontrado. Selecione a conta correta em Meta Ads IA ou Google Ads IA.'
        : msg.includes('Unauthorized') || msg.includes('401') ? 'Sessão expirada. Faça login novamente.'
        : msg.includes('timeout') || msg.includes('Timeout') ? 'A auditoria demorou mais que o esperado. Tente novamente.'
        : msg
      setError(friendly)
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  const sc = audit ? gradeColor[audit.grade] || '#F0B429' : '#F0B429'

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-white mb-1">Auditoria de Campanhas</h2>
          <p className="text-slate-500 text-sm">
            Análise sênior com IA — importe relatórios ou conecte contas para auditoria ao vivo.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Seletor de período */}
          <select
            value={datePreset}
            onChange={e => setDatePreset(e.target.value)}
            disabled={loading}
            className="text-xs font-semibold text-slate-300 bg-[#16161A] border border-[#2A2A30] rounded-lg px-3 py-2 focus:outline-none focus:border-[#F0B429] disabled:opacity-50"
          >
            <option value="last_7d">Últimos 7 dias</option>
            <option value="last_30d">Últimos 30 dias</option>
            <option value="last_90d">Últimos 90 dias</option>
            <option value="this_month">Este mês</option>
            <option value="last_month">Mês anterior</option>
          </select>

          <button
            onClick={handleAudit}
            disabled={loading || !canAudit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: canAudit ? 'linear-gradient(135deg, #F0B429, #FFD166)' : '#2A2A30', color: canAudit ? '#000' : '#555' }}
          >
            {loading
              ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Auditando…</>
              : '🔍 Iniciar Auditoria'}
          </button>
        </div>
      </div>

      {/* Fontes de dados */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Meta Ads',      icon: '📘', active: !!metaAccount,       sub: metaAccount?.accountName || 'Conectar na aba Conexões' },
          { label: 'Google Ads',    icon: '🔍', active: !!googleAccount,      sub: googleAccount?.accountName || 'Conectar na aba Conexões' },
          { label: 'Arquivos',      icon: '📂', active: hasUpload,            sub: hasUpload ? `${uploadedFiles.length} arquivo(s) · ${uploadedFiles.reduce((s,f)=>s+f.rowCount,0)} campanhas` : 'Nenhum importado' },
          { label: 'Dados prontos', icon: '✅', active: canAudit,             sub: canAudit ? 'Pronto para auditar' : 'Aguardando dados' },
        ].map(({ label, icon, active, sub }) => (
          <div key={label} className="flex items-center gap-2.5 rounded-xl p-3 border"
            style={{ background: active ? 'rgba(34,197,94,0.04)' : 'rgba(100,116,139,0.04)', borderColor: active ? 'rgba(34,197,94,0.2)' : '#2A2A30' }}>
            <span>{icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white">{label}</div>
              <div className="text-[10px] truncate" style={{ color: active ? '#22C55E' : '#64748B' }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload múltiplo */}
      <div className="space-y-3">
        <div
          className={`relative border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer ${dragOver ? 'border-[#F0B429] bg-[#F0B42908]' : 'border-[#2A2A30] hover:border-[#3A3A45]'}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" multiple className="hidden" onChange={handleFileInput} />
          <div className="text-2xl mb-1.5 opacity-40">📂</div>
          <div className="text-sm text-slate-400 mb-1">
            Arraste seus relatórios ou <span className="text-[#F0B429]">clique para importar</span>
          </div>
          <div className="text-xs text-slate-600">
            Aceita múltiplos arquivos — exportações do Meta Ads (Gerenciador) e Google Ads · XLSX ou CSV
          </div>
        </div>

        {/* Dica de exportação Meta (nível de anúncio) */}
        {metaAccount && (
          <div className="flex items-start gap-2 px-1">
            <span className="flex-shrink-0 mt-0.5 text-[10px] text-[#38BDF8]">ℹ</span>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Para auditar criativos e frequência com mais precisão, exporte no <strong className="text-slate-400">nível de anúncio</strong> incluindo: Frequência, CTR, Gasto, Leads e CPL.
            </p>
          </div>
        )}

        {/* Lista de arquivos carregados */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            {/* Aviso de dupla contagem quando múltiplos arquivos da mesma plataforma */}
            {(() => {
              const counts: Record<string, number> = {}
              uploadedFiles.forEach(f => { if (f.platform !== 'unknown') counts[f.platform] = (counts[f.platform] || 0) + 1 })
              const duped = Object.entries(counts).filter(([, n]) => n > 1)
              if (!duped.length) return null
              return (
                <div className="flex items-start gap-2 bg-[#F0B429]/06 border border-[#F0B429]/25 rounded-xl px-4 py-3 text-[11px] text-[#F0B429]">
                  <span className="flex-shrink-0 mt-0.5">⚠</span>
                  <span>
                    Você importou <strong>{duped.map(([p, n]) => `${n} arquivos de ${p === 'meta' ? 'Meta Ads' : 'Google Ads'}`).join(' e ')}</strong>.
                    {' '}Para evitar dupla contagem nos totais, o sistema usará automaticamente <strong>o arquivo com maior investimento por plataforma</strong>. Todos os arquivos são enviados à IA para análise.
                  </span>
                </div>
              )
            })()}

            {uploadedFiles.map((f, i) => {
              const fSpend = f.campaigns.reduce((s: number, c: any) => s + (c.spend || 0), 0)
              const fLeads = f.campaigns.reduce((s: number, c: any) => s + (c.leads || 0), 0)
              const fCpl   = fLeads > 0 ? fSpend / fLeads : 0
              const hasData = fSpend > 0 || fLeads > 0

              const levelLabel: Record<string, string> = { ad: 'Anúncios', adset: 'Conjuntos', campaign: 'Campanhas', mixed: 'Misto' }
              const levelColor: Record<string, string> = { ad: '#A78BFA', adset: '#38BDF8', campaign: '#22C55E', mixed: '#F0B429' }
              const lc = levelColor[f.level] || '#64748B'

              return (
                <div key={i} className="bg-[#111114] border rounded-xl px-4 py-3"
                  style={{ borderColor: hasData ? 'rgba(34,197,94,0.2)' : 'rgba(240,180,41,0.2)' }}>
                  {/* Cabeçalho do arquivo */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm" style={{ color: hasData ? '#22C55E' : '#F0B429' }}>{hasData ? '✓' : '⚠'}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-white truncate block">{f.file.name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-500">
                          {f.rowCount} linhas ·{' '}
                          {f.platform !== 'unknown' ? `${f.platform === 'meta' ? 'Meta' : 'Google'} Ads` : 'Plataforma não identificada'}
                        </span>
                        {f.platform !== 'unknown' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ color: lc, background: `${lc}18`, border: `1px solid ${lc}30` }}>
                            {levelLabel[f.level]}
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => removeFile(i)} className="text-slate-600 hover:text-[#FF4D4D] text-sm transition-colors flex-shrink-0">✕</button>
                  </div>

                  {/* Métricas resumidas */}
                  {hasData ? (
                    <>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        {[
                          { label: 'Investimento', val: fmt(fSpend) },
                          { label: 'Leads/Conv.', val: fLeads.toLocaleString('pt-BR') },
                          { label: 'CPL médio', val: fCpl > 0 ? fmt(fCpl) : '—' },
                        ].map(({ label, val }) => (
                          <div key={label} className="bg-[#16161A] rounded-lg px-2.5 py-1.5 text-center">
                            <div className="text-[9px] text-slate-500 uppercase tracking-wider">{label}</div>
                            <div className="text-xs font-bold text-[#22C55E]">{val}</div>
                          </div>
                        ))}
                      </div>

                      {/* Toggle tabela de campanhas */}
                      <button
                        onClick={() => setUploadedFiles(prev => prev.map((x, j) => j === i ? { ...x, showCampaigns: !x.showCampaigns } : x))}
                        className="mt-2 text-[10px] text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
                      >
                        <span>{f.showCampaigns ? '▲' : '▼'}</span>
                        {f.showCampaigns ? 'Ocultar' : `Ver ${f.campaigns.length} linha(s) detectada(s)`}
                      </button>

                      {/* Tabela de preview */}
                      {f.showCampaigns && (
                        <div className="mt-2 rounded-xl overflow-hidden border border-[#2A2A30]">
                          <div className="grid text-[9px] text-slate-500 uppercase tracking-wider px-3 py-2 bg-[#0E0E11] border-b border-[#2A2A30]"
                            style={{ gridTemplateColumns: '1fr 70px 50px 70px 60px' }}>
                            <span>Nome</span>
                            <span className="text-right">Gasto</span>
                            <span className="text-right">Conv.</span>
                            <span className="text-right">CPL</span>
                            <span className="text-right">Status</span>
                          </div>
                          {f.campaigns.slice(0, 12).map((c: any, ci: number) => {
                            const cpl = c.leads > 0 ? c.spend / c.leads : null
                            const hasConv = (c.leads || 0) > 0
                            return (
                              <div key={ci} className="grid items-center px-3 py-2 border-b border-[#1E1E24] last:border-0 hover:bg-[#16161A]"
                                style={{ gridTemplateColumns: '1fr 70px 50px 70px 60px' }}>
                                <span className="text-[10px] text-slate-300 truncate pr-2">{c.name || '—'}</span>
                                <span className="text-[10px] text-right text-slate-400">{fmt(c.spend || 0)}</span>
                                <span className="text-[10px] text-right" style={{ color: hasConv ? '#22C55E' : '#64748B' }}>{c.leads || 0}</span>
                                <span className="text-[10px] text-right text-[#F0B429]">{cpl ? fmt(cpl) : '—'}</span>
                                <span className="text-[9px] text-right" style={{ color: hasConv ? '#22C55E' : '#FF4D4D' }}>
                                  {hasConv ? '✓ conv.' : '⛔ sem conv.'}
                                </span>
                              </div>
                            )
                          })}
                          {f.campaigns.length > 12 && (
                            <div className="text-center text-[10px] text-slate-600 py-2">
                              + {f.campaigns.length - 12} linha(s) não exibidas
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-[10px] text-[#F0B429] mt-1 flex items-start gap-1.5">
                      <span className="flex-shrink-0">⚠</span>
                      <span>
                        Colunas de gasto/leads não identificadas. O arquivo deve conter:{' '}
                        <strong>Valor usado</strong> (Meta) ou <strong>Custo</strong> (Google) para gasto, e{' '}
                        <strong>Mensagens iniciadas</strong>, <strong>Resultados</strong> ou <strong>Conversões</strong> para leads.
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {parseError && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">{parseError}</div>
        )}
      </div>

      {/* ── Seletor de fonte quando API + CSV do mesmo canal estão presentes ── */}
      {hasSourceConflict && canAudit && (
        <div className="rounded-2xl p-5" style={{ background: '#111114', border: '2px solid rgba(240,180,41,0.4)' }}>
          <div className="flex items-start gap-3 mb-4">
            <span className="text-xl flex-shrink-0">⚡</span>
            <div>
              <div className="font-bold text-[#F0B429] text-sm mb-1">Conflito de fontes detectado</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {[hasMetaConflict && 'Meta Ads', hasGoogleConflict && 'Google Ads'].filter(Boolean).join(' e ')} tem{' '}
                dados da API <strong>e</strong> arquivo importado. Escolha qual fonte usar para garantir métricas corretas.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {([
              { value: 'api' as const,         icon: '🔗', label: 'Usar somente API',     desc: 'Dados em tempo real da plataforma conectada' },
              { value: 'upload' as const,       icon: '📂', label: 'Usar somente arquivo', desc: 'Dados do relatório CSV/XLSX importado' },
              { value: 'consolidate' as const,  icon: '⚠',  label: 'Consolidar tudo',      desc: 'Soma API + arquivo — pode duplicar se mesmo período' },
            ] as const).map(({ value, icon, label, desc }) => (
              <button
                key={value}
                onClick={() => setAuditSource(value)}
                className="flex items-start gap-3 rounded-xl px-4 py-3 text-left transition-all"
                style={{
                  background:   auditSource === value ? 'rgba(240,180,41,0.1)' : 'rgba(255,255,255,0.02)',
                  border:       `1px solid ${auditSource === value ? 'rgba(240,180,41,0.5)' : '#2A2A30'}`,
                }}
              >
                <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
                <div>
                  <div className="text-xs font-bold" style={{ color: auditSource === value ? '#F0B429' : '#94A3B8' }}>{label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{desc}</div>
                </div>
                {auditSource === value && (
                  <span className="ml-auto flex-shrink-0 text-[10px] font-bold text-[#F0B429]">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {!canAudit && !loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-[#111114] border border-[#2A2A30] rounded-2xl">
          <div className="text-5xl mb-4 opacity-20">🔍</div>
          <div className="font-display text-base font-bold text-white mb-2">Nenhuma fonte de dados</div>
          <p className="text-slate-500 text-xs max-w-sm leading-relaxed">
            Importe um relatório exportado do Meta Ads ou Google Ads (XLSX/CSV) ou conecte sua conta na aba <strong className="text-slate-300">Conexões</strong>.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
          <span className="text-sm text-red-400">{error}</span>
          <button
            onClick={handleAudit}
            className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: 'rgba(255,77,77,0.15)', color: '#FF4D4D', border: '1px solid rgba(255,77,77,0.3)' }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-8 text-center">
            <div className="w-12 h-12 border-2 border-[#F0B429]/20 border-t-[#F0B429] rounded-full animate-spin mx-auto mb-4" />
            <div className="font-display font-bold text-white mb-1">Consultando especialista sênior</div>
            {loadingStep && (
              <div className="text-xs font-semibold text-[#F0B429] mb-1">{loadingStep}</div>
            )}
            <div className="text-xs text-slate-500">Analisando estrutura, performance, tracking, criativos e funil...</div>
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-[#2A2A30] rounded w-1/4 mb-3" />
              <div className="h-3 bg-[#2A2A30] rounded w-3/4 mb-2" />
              <div className="h-3 bg-[#2A2A30] rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════ HISTÓRICO DE AUDITORIAS ══════════════════════ */}
      {history.length > 1 && !loading && (
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Histórico de auditorias · {clientData?.clientName}</div>
          <div className="flex gap-2 flex-wrap">
            {history.map((entry) => {
              const grade = entry.audit?.grade || '—'
              const score = entry.audit?.health_score
              const color = gradeColor[grade] || '#64748B'
              const date  = entry.createdAt
                ? new Date(entry.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                : 'Legado'
              const isSelected = selectedId === entry.id
              return (
                <div key={entry.id} className="flex items-center gap-1">
                  <button
                    onClick={() => { setAudit(entry.audit); setSelectedId(entry.id); setSource('ai') }}
                    className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                    style={isSelected
                      ? { background: `${color}18`, border: `1px solid ${color}50`, color }
                      : { background: 'transparent', border: '1px solid #2A2A30', color: '#64748B' }}
                  >
                    <span style={{ color }}>{grade}{score !== undefined ? ` · ${score}` : ''}</span>
                    <span>{date}</span>
                  </button>
                  {entry.id !== 'legacy' && (
                    <button
                      onClick={() => {
                        deleteAuditEntry(key, entry.id)
                        if (selectedId === entry.id) {
                          const next = history.find(e => e.id !== entry.id)
                          if (next) { setAudit(next.audit); setSelectedId(next.id) }
                          else { setAudit(null); setSelectedId(null) }
                        }
                      }}
                      title="Remover esta auditoria"
                      className="text-slate-600 hover:text-red-400 transition-colors text-xs px-1"
                    >✕</button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════ RESULTADO DA AUDITORIA ══════════════════════ */}
      {audit && !loading && (
        <div className="space-y-5 animate-fade-up">

          {/* Benchmark warning */}
          {source === 'benchmark' && audit._realMetrics?.totalSpend === 0 && (
            <div className="flex items-start gap-3 bg-[#F0B429]/06 border border-[#F0B429]/30 rounded-2xl px-5 py-4">
              <span className="text-lg flex-shrink-0 mt-0.5">⚠️</span>
              <div>
                <div className="font-bold text-[#F0B429] text-sm mb-1">Análise por benchmark — sem dados da conta</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  A conta conectada não retornou dados de performance para o período selecionado.
                  Para auditoria com seus dados reais:
                </p>
                <ul className="mt-2 space-y-1 text-xs text-slate-400">
                  <li>→ Vá em <strong className="text-slate-200">Meta Ads IA</strong> e selecione a conta que tem campanhas ativas</li>
                  <li>→ Ou mude o período (ex: "Este mês" → "Últimos 30 dias")</li>
                  <li>→ Ou importe um relatório CSV/XLSX exportado do Gerenciador de Anúncios</li>
                </ul>
              </div>
            </div>
          )}

          {/* ── AUDIT HERO (Score + KPIs + Metadata merged) ── */}
          <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
            {/* Top row: Score + Progress + Badges + PDF */}
            <div className="flex items-start gap-4 mb-5 flex-wrap">
              <div className="shrink-0">
                <div className="flex items-end gap-2">
                  <span className="font-display text-5xl font-bold leading-none" style={{ color: sc }}>{audit.health_score}</span>
                  <span className="font-display text-xl text-slate-500 mb-0.5">/100</span>
                  <span className="font-display text-3xl font-bold mb-0.5" style={{ color: sc }}>{audit.grade}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Score de saúde</div>
                {/* Situação atual — tradução humana do score */}
                {(() => {
                  const s = audit.health_score as number
                  const cfg = s >= 80
                    ? { icon: '🟢', color: '#22C55E', text: 'Conta saudável, acima da média do mercado.' }
                    : s >= 60
                    ? { icon: '🟡', color: '#F59E0B', text: 'Oportunidades de melhoria identificadas.' }
                    : { icon: '🔴', text: 'Gargalos estão limitando seus resultados.', color: '#EF4444' }
                  return (
                    <div style={{ marginTop: '8px', fontSize: '11px', color: cfg.color, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>{cfg.icon}</span><span>{cfg.text}</span>
                    </div>
                  )
                })()}
                {/* Valor Identificado pela IA */}
                {audit._campanhasClassificadas && (() => {
                  const waste = (audit._wasteCampaigns as any[] | undefined)?.reduce((s: number, c: any) => s + (c.spend || 0), 0) || 0
                  const nWinners = (audit._campanhasClassificadas.vencedoras as any[]).length
                  const bestCamp = (audit._campanhasClassificadas.vencedoras as any[])[0]
                  const scaleGain = bestCamp ? Math.round((bestCamp.spend || 0) * 0.2) : 0
                  const value = waste > 0 ? waste : scaleGain
                  if (value < 500) return null
                  const isWaste = waste > 0
                  return (
                    <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '7px', background: isWaste ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', border: `1px solid ${isWaste ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}` }}>
                      <span style={{ fontSize: '10px' }}>{isWaste ? '💸' : '📈'}</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: isWaste ? '#EF4444' : '#22C55E' }}>
                        {isWaste ? `R$${Math.round(waste).toLocaleString('pt-BR')} a recuperar` : `+R$${Math.round(scaleGain).toLocaleString('pt-BR')} potencial`}
                      </span>
                      <span style={{ fontSize: '9px', color: '#64748B' }}>identificado pela IA</span>
                    </div>
                  )
                })()}
              </div>
              <div className="flex-1 min-w-[160px]">
                <div className="w-full h-2 bg-[#1E1E24] rounded-full overflow-hidden mb-2">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${audit.health_score}%`, background: `linear-gradient(90deg, ${sc}, ${sc}88)` }} />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Pill text={source === 'ai' ? '⚡ IA Sênior' : '📊 Benchmark'} color={source === 'ai' ? '#A78BFA' : '#38BDF8'} />
                  {audit._dataQuality && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                      color:      audit._dataQuality.confidence === 'alta' ? '#22C55E' : audit._dataQuality.confidence === 'media' ? '#F0B429' : '#FF4D4D',
                      background: audit._dataQuality.confidence === 'alta' ? 'rgba(34,197,94,0.12)' : audit._dataQuality.confidence === 'media' ? 'rgba(240,180,41,0.12)' : 'rgba(255,77,77,0.12)',
                      border:     `1px solid ${audit._dataQuality.confidence === 'alta' ? 'rgba(34,197,94,0.3)' : audit._dataQuality.confidence === 'media' ? 'rgba(240,180,41,0.3)' : 'rgba(255,77,77,0.3)'}`,
                    }}>
                      {audit._dataQuality.confidence === 'alta' ? '✓ Alta' : audit._dataQuality.confidence === 'media' ? '~ Média' : '! Baixa'}
                    </span>
                  )}
                  {audit._platforms?.length > 0 && (
                    <span className="text-[10px] text-slate-500">{(audit._platforms as string[]).join(' + ')}</span>
                  )}
                  {audit._auditSource && audit._auditSource !== 'auto' && (
                    <span className="text-[10px] font-semibold" style={{ color: audit._auditSource === 'api' ? '#38BDF8' : audit._auditSource === 'upload' ? '#22C55E' : '#F0B429' }}>
                      {audit._auditSource === 'api' ? '🔗 API' : audit._auditSource === 'upload' ? '📂 Arquivo' : '⚡ Consolidado'}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={async () => {
                  if (!audit || !clientData) return
                  setPdfLoading(true)
                  try {
                    const { generateAuditPDF } = await import('@/components/pdf/AuditoriaPDF')
                    await generateAuditPDF(audit, clientData.clientName, clientData.niche)
                  } catch (e) { console.error(e) }
                  finally { setPdfLoading(false) }
                }}
                disabled={pdfLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all hover:opacity-80 disabled:opacity-50 shrink-0"
                style={{ border: '1px solid rgba(240,180,41,0.3)', color: '#F0B429', background: 'rgba(240,180,41,0.05)' }}
              >
                {pdfLoading ? '⏳' : '↓'} PDF
              </button>
            </div>

            {/* KPIs grid */}
            {audit._realMetrics && (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
                {[
                  { label: 'Investimento', value: audit._realMetrics.totalSpend > 0   ? fmt(audit._realMetrics.totalSpend)                   : null, color: '#F0B429' },
                  { label: 'Leads/Conv.',  value: audit._realMetrics.totalLeads >= 0  ? audit._realMetrics.totalLeads.toLocaleString('pt-BR') : null, color: '#22C55E' },
                  { label: 'CPL médio',    value: audit._realMetrics.avgCPL           ? fmt(audit._realMetrics.avgCPL)                       : null, color: '#38BDF8' },
                  { label: 'CTR médio',    value: audit._realMetrics.avgCTR           ? `${audit._realMetrics.avgCTR}%`                      : null, color: '#A78BFA' },
                  { label: 'ROAS',         value: audit._realMetrics.avgROAS          ? `${audit._realMetrics.avgROAS}×`                     : null, color: '#22C55E' },
                  { label: 'Campanhas',    value: audit._realMetrics.campaignCount > 0 ? String(audit._realMetrics.campaignCount)             : null, color: '#64748B' },
                ].filter(k => k.value !== null).map(k => (
                  <div key={k.label} className="bg-[#0E0E11] border border-[#1E1E24] rounded-xl p-3 text-center">
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">{k.label}</div>
                    <div className="text-base font-bold" style={{ color: k.color }}>{k.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Resumo executivo da IA — bloco estruturado ── */}
            {(audit.executive_summary || audit._campanhasClassificadas) && (() => {
              const nV = (audit._campanhasClassificadas?.vencedoras as any[] | undefined)?.length ?? 0
              const nA = (audit._campanhasClassificadas?.atencao     as any[] | undefined)?.length ?? 0
              const nC = (audit._campanhasClassificadas?.criticas     as any[] | undefined)?.length ?? 0
              const rm = audit._realMetrics as any
              const waste = (audit._wasteCampaigns as any[] | undefined)?.reduce((s: number, c: any) => s + (c.spend || 0), 0) ?? 0
              const bestCamp = (audit._campanhasClassificadas?.vencedoras as any[] | undefined)?.[0]
              const scaleLeads = bestCamp?.leads ? Math.round(bestCamp.leads * 0.2) : null
              const cplBetter = rm?.avgCPL && audit._benchmarkCPL
                ? Math.round((1 - rm.avgCPL / ((audit._benchmarkCPL.min + audit._benchmarkCPL.max) / 2)) * 100)
                : null
              const impactLine = waste > 500
                ? `Economia potencial de R$${Math.round(waste).toLocaleString('pt-BR')}/mês ao pausar campanhas sem retorno.`
                : scaleLeads
                ? `Escalar a melhor campanha em 20% pode gerar +${scaleLeads} leads mantendo CPL atual.`
                : cplBetter && cplBetter > 0
                ? `Seu CPL está ${cplBetter}% abaixo da média do mercado — há espaço para escalar.`
                : null
              return (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', marginTop: '4px' }}>
                  {/* Cabeçalho */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px' }}>🤖</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Resumo da IA</span>
                    {rm?.campaignCount > 0 && (
                      <span style={{ fontSize: '10px', color: '#64748B', marginLeft: 'auto' }}>
                        {rm.campaignCount} campanhas · R${rm.totalSpend > 0 ? Math.round(rm.totalSpend).toLocaleString('pt-BR') : '—'} investidos
                      </span>
                    )}
                  </div>
                  {/* Contagem de descobertas */}
                  {(nV > 0 || nA > 0 || nC > 0) && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      {nV > 0 && <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '6px', background: 'rgba(34,197,94,0.08)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)', fontWeight: 600 }}>🟢 {nV} {nV === 1 ? 'oportunidade' : 'oportunidades'} de escala</span>}
                      {nA > 0 && <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '6px', background: 'rgba(245,158,11,0.08)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)', fontWeight: 600 }}>🟡 {nA} {nA === 1 ? 'ponto' : 'pontos'} de atenção</span>}
                      {nC > 0 && <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '6px', background: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', fontWeight: 600 }}>🔴 {nC} {nC === 1 ? 'risco crítico' : 'riscos críticos'}</span>}
                    </div>
                  )}
                  {/* Resumo textual da IA */}
                  {audit.executive_summary && (
                    <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.65, margin: 0, marginBottom: impactLine ? '10px' : '0' }}>
                      {audit.executive_summary}
                    </p>
                  )}
                  {/* Linha de impacto financeiro */}
                  {impactLine && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
                      <span style={{ fontSize: '12px' }}>⚡</span>
                      <span style={{ fontSize: '11px', color: '#CBD5E1', lineHeight: 1.5 }}>
                        <strong style={{ color: '#A78BFA' }}>Impacto potencial:</strong> {impactLine}
                      </span>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Data warnings */}
            {(audit._dataWarnings as string[] | undefined)?.length! > 0 && (
              <div className="mt-3 bg-[#F0B429]/08 border border-[#F0B429]/30 rounded-xl px-4 py-3">
                <div className="text-[10px] text-[#F0B429] font-bold uppercase mb-1.5">⚠ Atenção — possível inconsistência de dados</div>
                {(audit._dataWarnings as string[]).map((w: string, i: number) => (
                  <p key={i} className="text-xs text-slate-400 leading-relaxed mt-1">{w}</p>
                ))}
              </div>
            )}

            {/* Data quality issues */}
            {(audit._dataQuality?.issues as string[] | undefined)?.length! > 0 && (
              <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-600 mt-2">
                <span>Pontos cegos:</span>
                {(audit._dataQuality.issues as string[]).map((issue: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-[#2A2A30] text-slate-400">{issue}</span>
                ))}
              </div>
            )}

            {/* Supabase persistence */}
            {persistenceStatus && (() => {
              const allSaved  = persistenceStatus.auditReportSaved && persistenceStatus.priorityActionsSaved && persistenceStatus.healthScoreSaved
              const noneSaved = !persistenceStatus.auditReportSaved && !persistenceStatus.priorityActionsSaved && !persistenceStatus.healthScoreSaved
              const color  = allSaved ? '#22C55E' : noneSaved ? '#EF4444' : '#F59E0B'
              const bgColor = allSaved ? 'rgba(34,197,94,0.07)' : noneSaved ? 'rgba(239,68,68,0.07)' : 'rgba(245,158,11,0.07)'
              const borderColor = allSaved ? 'rgba(34,197,94,0.2)' : noneSaved ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'
              const icon   = allSaved ? '✅' : noneSaved ? '⚠' : '⚡'
              const label  = allSaved ? 'Auditoria salva no banco' : noneSaved ? 'Auditoria gerada, mas não sincronizada com o banco' : 'Auditoria parcialmente sincronizada'
              return (
                <div style={{ marginTop: '12px', padding: '8px 12px', borderRadius: '8px', background: bgColor, border: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px' }}>{icon}</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color, flex: 1 }}>{label}</span>
                  {!allSaved && (
                    <span style={{ fontSize: '10px', color: '#94A3B8' }}>
                      {[
                        persistenceStatus.auditReportSaved ? null : 'relatório',
                        persistenceStatus.priorityActionsSaved ? null : `ações (${persistenceStatus.actionsSaved ?? 0}/${(persistenceStatus.errors as string[])?.length > 0 ? '?' : '0'})`,
                        persistenceStatus.healthScoreSaved ? null : 'score',
                      ].filter(Boolean).join(', ')} não salvos
                    </span>
                  )}
                  {persistenceStatus.auditReportSaved && (
                    <span style={{ fontSize: '10px', color: '#64748B', fontFamily: 'monospace' }}>
                      #{String(persistenceStatus.auditReportId).slice(0, 8)}
                    </span>
                  )}
                </div>
              )
            })()}
          </div>

          {/* ── SECTION STATUS NAV ── */}
          {(() => {
            const trackingChecklist = (audit._trackingChecklist as any[]) || []
            const navItems = [
              audit._campanhasClassificadas && {
                label: 'Campanhas',
                status: (audit._campanhasClassificadas.criticas?.length || 0) > 0 ? 'critico' : (audit._campanhasClassificadas.atencao?.length || 0) > 0 ? 'atencao' : 'ok',
              },
              (audit.tracking || trackingChecklist.length > 0) && {
                label: 'Tracking',
                status: audit.tracking?.prioridade_maxima ? 'critico' : trackingChecklist.filter((t: any) => t.status === 'nao_verificado').length >= 4 ? 'atencao' : 'ok',
              },
              audit.criativos_meta && { label: 'Criativos', status: (audit.criativos_meta.problemas?.length || 0) > 0 ? 'atencao' : 'ok' },
              (audit.publicos?.meta || audit.publicos?.google) && { label: 'Públicos', status: 'ok' as const },
              audit.funil && { label: 'Funil', status: audit.funil.gargalo_principal ? 'atencao' : 'ok' as const },
              (audit.gargalos?.length || 0) > 0 && {
                label: 'Gargalos',
                status: (() => {
                  const gs = audit.gargalos as any[]
                  const hasCritical = gs.some((g: any) => {
                    const imp = (g.impacto || g.severidade || '').toLowerCase()
                    return imp.includes('crít') || imp.includes('alto') || imp.includes('alta') || imp.includes('crítico')
                  })
                  return hasCritical ? 'critico' : 'atencao'
                })(),
              },
              (audit.o_que_eu_faria_agora as any[] | undefined)?.length! > 0 && {
                label: 'Ações agora',
                status: (() => {
                  const acoes = audit.o_que_eu_faria_agora as any[]
                  if (acoes.some((a: any) => (typeof a === 'object' ? a?.prioridade : null) === 'P1')) return 'critico'
                  if (acoes.some((a: any) => (typeof a === 'object' ? a?.prioridade : null) === 'P2')) return 'atencao'
                  return 'atencao'
                })(),
              },
            ].filter(Boolean) as { label: string; status: string }[]
            if (!navItems.length) return null
            return (
              <div className="flex gap-1.5 flex-wrap">
                {navItems.map(({ label, status }) => {
                  const nc = status === 'critico' ? '#FF4D4D' : status === 'atencao' ? '#F0B429' : '#22C55E'
                  const nl = status === 'critico' ? 'Requer ação' : status === 'atencao' ? 'Monitorar' : 'Saudável'
                  return (
                    <div key={label}
                      className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg"
                      style={{ background: `${nc}08`, border: `1px solid ${nc}25`, color: '#94A3B8' }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: nc }} />
                      {label}
                      <span style={{ color: nc }}>{nl}</span>
                    </div>
                  )
                })}
              </div>
            )
          })()}

          {/* ── PRINCIPAIS DESCOBERTAS ── */}
          {audit._campanhasClassificadas && (() => {
            const nV = (audit._campanhasClassificadas.vencedoras as any[]).length
            const nA = (audit._campanhasClassificadas.atencao     as any[]).length
            const nC = (audit._campanhasClassificadas.criticas     as any[]).length
            const hasTracking = audit.tracking?.prioridade_maxima || ((audit._trackingChecklist as any[] | undefined) || []).filter((t: any) => t.status === 'nao_verificado').length >= 3
            const waste = (audit._wasteCampaigns as any[] | undefined)?.reduce((s: number, c: any) => s + (c.spend || 0), 0) ?? 0
            if (nV + nA + nC === 0) return null
            const discoveries = [
              nV > 0 && {
                icon: '🎯',
                color: '#22C55E',
                bg: 'rgba(34,197,94,0.06)',
                border: 'rgba(34,197,94,0.18)',
                label: 'Oportunidade',
                title: `${nV} ${nV === 1 ? 'campanha com' : 'campanhas com'} potencial de escala`,
                desc: 'Estas campanhas geram leads abaixo do benchmark — há espaço para aumentar o investimento sem elevar o CPL.',
                impact: 'Impacto: +15% a +30% no volume de leads mantendo o custo atual.',
              },
              hasTracking && {
                icon: '⚠️',
                color: '#F59E0B',
                bg: 'rgba(245,158,11,0.06)',
                border: 'rgba(245,158,11,0.18)',
                label: 'Atenção',
                title: 'Inconsistências detectadas na medição',
                desc: 'O sistema identificou possíveis falhas no rastreamento de eventos. O algoritmo pode estar otimizando com dados incompletos.',
                impact: 'Impacto: campanhas podem estar subperformando sem que você perceba.',
              },
              nC > 0 && {
                icon: '🔥',
                color: '#EF4444',
                bg: 'rgba(239,68,68,0.06)',
                border: 'rgba(239,68,68,0.18)',
                label: 'Risco',
                title: `${nC} ${nC === 1 ? 'campanha consome' : 'campanhas consomem'} verba acima do esperado`,
                desc: waste > 0
                  ? `R$${Math.round(waste).toLocaleString('pt-BR')} investidos sem conversões registradas — possível desperdício de orçamento.`
                  : 'Campanhas com CPL acima do benchmark. Cada lead está custando mais do que o mercado pratica.',
                impact: 'Impacto: revisar ou pausar pode liberar orçamento para campanhas vencedoras.',
              },
            ].filter(Boolean) as Array<{ icon: string; color: string; bg: string; border: string; label: string; title: string; desc: string; impact: string }>
            if (discoveries.length === 0) return null
            return (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  Principais Descobertas
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${discoveries.length}, 1fr)`, gap: '10px', marginBottom: '4px' }}>
                  {discoveries.map((d, i) => (
                    <div key={i} style={{ padding: '14px', borderRadius: '12px', background: d.bg, border: `1px solid ${d.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px' }}>{d.icon}</span>
                        <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: d.color }}>{d.label}</span>
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#F1F5F9', marginBottom: '4px', lineHeight: 1.4 }}>{d.title}</div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', lineHeight: 1.55, marginBottom: '8px' }}>{d.desc}</div>
                      <div style={{ fontSize: '10px', color: d.color, fontWeight: 500 }}>{d.impact}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* ── AÇÃO PRIORITÁRIA DA SEMANA ── */}
          {audit._campanhasClassificadas && (() => {
            const best = (audit._campanhasClassificadas.vencedoras as any[])[0]
            if (!best) return null
            const cpl = best.leads > 0 ? Math.round(best.spend / best.leads) : null
            const leadsGain = best.leads ? Math.round(best.leads * 0.2) : null
            return (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.18)' }}>
                <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>🔥</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>Ação mais importante desta semana</div>
                  <div style={{ fontSize: '12px', color: '#F1F5F9', fontWeight: 500 }}>
                    Escalar a campanha <strong style={{ color: '#fff' }}>"{best.name}"</strong> em 20%.
                  </div>
                  {leadsGain && (
                    <div style={{ fontSize: '11px', color: '#A78BFA', marginTop: '2px' }}>
                      Potencial estimado: +{leadsGain} leads mantendo{cpl ? ` CPL de R$${cpl}` : ' o CPL atual'}.
                    </div>
                  )}
                </div>
              </div>
            )
          })()}

          {/* ── CLASSIFICAÇÃO DE CAMPANHAS (tabs) ── */}
          {audit._campanhasClassificadas && (
            audit._campanhasClassificadas.vencedoras.length > 0 ||
            audit._campanhasClassificadas.atencao.length   > 0 ||
            audit._campanhasClassificadas.criticas.length  > 0
          ) && (
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono"
                  style={{ background: 'rgba(240,180,41,0.1)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.2)' }}>C</span>
                <span className="text-lg">📊</span>
                <h3 className="font-display font-bold text-white text-base">Classificação de Campanhas</h3>
                <span className="ml-auto text-[10px] text-slate-600">
                  {audit._campanhasClassificadas.vencedoras.length + audit._campanhasClassificadas.atencao.length + audit._campanhasClassificadas.criticas.length} campanhas
                </span>
              </div>
              <div className="flex gap-2 mb-1">
                {([
                  { id: 'vencedoras', label: `🏆 Vencedoras (${audit._campanhasClassificadas.vencedoras.length})`, color: '#22C55E' },
                  { id: 'atencao',   label: `⚠ Atenção (${audit._campanhasClassificadas.atencao.length})`,       color: '#F0B429' },
                  { id: 'criticas',  label: `🔴 Críticas (${audit._campanhasClassificadas.criticas.length})`,     color: '#FF4D4D' },
                ] as const).map(({ id, label, color }) => (
                  <button key={id} onClick={() => setCampTab(id)}
                    className="flex-1 py-2 rounded-xl text-[11px] font-bold transition-all"
                    style={{
                      background: campTab === id ? `${color}15` : 'transparent',
                      border: campTab === id ? `1px solid ${color}40` : '1px solid #2A2A30',
                      color: campTab === id ? color : '#64748B',
                    }}
                  >{label}</button>
                ))}
              </div>
              {/* Subtítulo contextual da aba ativa */}
              <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '14px', paddingLeft: '2px', lineHeight: 1.5 }}>
                {campTab === 'vencedoras' && 'Geram resultado acima da média · Recomendação: escalar gradualmente'}
                {campTab === 'atencao'   && 'Necessitam de otimizações · Recomendação: monitorar e ajustar'}
                {campTab === 'criticas'  && 'Consomem verba sem retorno esperado · Recomendação: revisar ou pausar'}
              </div>
              {(() => {
                const camps: any[] = audit._campanhasClassificadas[campTab] || []
                const tabColor = campTab === 'vencedoras' ? '#22C55E' : campTab === 'atencao' ? '#F0B429' : '#FF4D4D'
                if (camps.length === 0) return <p className="text-[11px] text-slate-600 py-4 text-center">Nenhuma campanha nesta categoria.</p>
                return (
                  <div className="space-y-2">
                    {camps.map((c: any, i: number) => {
                      const cpl = c.leads > 0 ? Math.round(c.spend / c.leads) : null
                      return (
                        <div key={i} className="rounded-xl px-4 py-3"
                          style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${tabColor}15` }}>
                          <div className="flex items-start gap-3 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-slate-200 truncate">{c.name}</div>
                              <div className="flex flex-wrap gap-2 mt-1 text-[10px]">
                                {c.spend > 0 && <span className="text-slate-500">{fmt(c.spend)}</span>}
                                {cpl !== null && <span className="font-semibold" style={{ color: tabColor }}>CPL R${cpl}</span>}
                                {!cpl && campTab === 'criticas' && <span className="font-semibold text-[#FF4D4D]">0 conv.</span>}
                                {c.leads > 0 && <span className="text-slate-500">{c.leads} leads</span>}
                                {c.ctr > 0 && <span className="text-slate-500">CTR {c.ctr.toFixed(1)}%</span>}
                                {c.frequency > 0 && <span className="text-slate-500">Freq {c.frequency.toFixed(1)}×</span>}
                                {c.platform && <span className="text-slate-600">{c.platform}</span>}
                              </div>
                            </div>
                            {c.recommended_action && (
                              <div className="text-[10px] text-slate-400 shrink-0 max-w-[200px] text-right">→ {c.recommended_action}</div>
                            )}
                          </div>
                          {c.evidence && (
                            <p className="text-[9px] mt-1.5 leading-tight" style={{ color: `${tabColor}80` }}>{c.evidence}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          )}

          {/* ── DESPERDÍCIO DE VERBA ─────────────────────────────────────────── */}
          {(audit._wasteCampaigns as any[] | undefined)?.length! > 0 && (
            <div className="rounded-2xl p-5" style={{ background: '#111114', border: '1px solid rgba(255,77,77,0.3)' }}>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono"
                    style={{ background: 'rgba(255,77,77,0.12)', color: '#FF4D4D', border: '1px solid rgba(255,77,77,0.25)' }}>D</span>
                  <span className="text-lg">💸</span>
                  <h3 className="font-display font-bold text-white text-base">Desperdício de Verba</h3>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-[#FF4D4D]">{fmt(audit._wasteCampaigns.reduce((s: number, c: any) => s + (c.spend || 0), 0))}</div>
                  <div className="text-[10px] text-slate-500">{audit._wastePercent}% do investimento · 0 conversões</div>
                </div>
              </div>
              <div className="space-y-2">
                {(audit._wasteCampaigns as any[]).map((c: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{ background: 'rgba(255,77,77,0.04)', border: '1px solid rgba(255,77,77,0.15)' }}>
                    <span className="text-sm flex-shrink-0">⛔</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{c.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {c.platform && <span>{c.platform} · </span>}
                        {c.status && <span>{c.status}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-[#FF4D4D]">{fmt(c.spend)}</div>
                      <div className="text-[10px] text-slate-600">0 conversões</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── O QUE EU FARIA AGORA (before plano) ── */}
          {(audit.o_que_eu_faria_agora as any[] | undefined)?.length! > 0 && (
            <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #111114 0%, #0E0E11 100%)', border: '1px solid rgba(240,180,41,0.35)' }}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono"
                  style={{ background: 'rgba(240,180,41,0.15)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.35)' }}>⚡ Ações Agora</span>
                <h3 className="font-display font-bold text-white text-base">O que eu faria agora</h3>
                <span className="ml-auto text-[10px] text-slate-600">Perspectiva do consultor sênior</span>
              </div>
              <div className="space-y-2.5">
                {(audit.o_que_eu_faria_agora as any[]).map((action: any, i: number) => {
                  const isObj = typeof action === 'object' && action !== null
                  const titulo    = isObj ? action.titulo    : action
                  const prioridade = isObj ? action.prioridade : null
                  const motivo    = isObj ? action.motivo    : null
                  const evidencia = isObj ? action.evidencia : null
                  const impacto   = isObj ? action.impacto   : null
                  const prazo     = isObj ? action.prazo     : null
                  const esforco   = isObj ? action.esforco   : null
                  const prioColor = prioridade === 'P1' ? '#FF4D4D' : prioridade === 'P2' ? '#F0B429' : '#64748B'
                  return (
                    <div key={i} className="rounded-xl px-4 py-3"
                      style={{ background: 'rgba(240,180,41,0.05)', border: '1px solid rgba(240,180,41,0.15)' }}>
                      <div className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 text-black"
                          style={{ background: '#F0B429' }}>{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-slate-200 leading-snug">{titulo}</p>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {prioridade && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                                  style={{ color: prioColor, background: `${prioColor}15`, border: `1px solid ${prioColor}30` }}>
                                  {prioridade}
                                </span>
                              )}
                              {prazo && <span className="text-[9px] text-slate-500">{prazo}</span>}
                              {esforco && <span className="text-[9px] text-slate-500">esforço {esforco}</span>}
                            </div>
                          </div>
                          {motivo && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{motivo}</p>}
                          {evidencia && <p className="text-[10px] text-[#F0B429]/70 mt-1 leading-relaxed">📊 {evidencia}</p>}
                          {impacto && <p className="text-[10px] text-[#22C55E]/80 mt-1 leading-relaxed">→ {impacto}</p>}
                        </div>
                        {clientData && (
                          <button
                            title={sentActions.has(i) ? 'Esta ação já está em Ações Prioritárias' : 'Enviar para Ações Prioritárias'}
                            onClick={() => {
                              if (sentActions.has(i)) {
                                setActionToast({ msg: 'Esta ação já está em Ações Prioritárias.', ok: false })
                                return
                              }
                              const newAction = {
                                id: `oqef_${Date.now()}_${i}`,
                                clientId: '',
                                title: titulo,
                                description: [motivo, evidencia].filter(Boolean).join(' — '),
                                platform: 'ambos' as const,
                                urgency: (prioridade === 'P1' ? 'critica' : prioridade === 'P2' ? 'alta' : 'media') as 'critica' | 'alta' | 'media',
                                priority: i + 1,
                                impact: impacto || '',
                                metric: undefined,
                                evidence: evidencia,
                                status: 'pendente' as const,
                                source: 'auditoria' as const,
                                origin: 'auditoria',
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                              }
                              addPendingActions(clientData.clientName, [newAction])
                              setSentActions(prev => new Set(prev).add(i))
                              setActionToast({ msg: 'Ação enviada para Ações Prioritárias.', ok: true })
                            }}
                            className="flex-shrink-0 text-[10px] font-semibold px-2 py-1 rounded-lg transition-all"
                            style={{
                              background: sentActions.has(i) ? 'rgba(34,197,94,0.1)' : 'rgba(240,180,41,0.1)',
                              color:      sentActions.has(i) ? '#22C55E' : '#F0B429',
                              border:     `1px solid ${sentActions.has(i) ? 'rgba(34,197,94,0.3)' : 'rgba(240,180,41,0.25)'}`,
                            }}
                          >{sentActions.has(i) ? '✓ Enviado' : '+ Ações'}</button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── 08 GARGALOS (compact ranked list) ── */}
          {audit.gargalos?.length > 0 && (
            <div className="bg-[#111114] border border-[#FF4D4D]/25 rounded-2xl p-5">
              <SectionHeader num="08" icon="🚨" title="Principais Gargalos" color="#FF4D4D" />
              <div className="space-y-2">
                {audit.gargalos.map((g: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl px-4 py-3"
                    style={{ background: 'rgba(255,77,77,0.04)', border: '1px solid rgba(255,77,77,0.12)' }}>
                    <span className="w-5 h-5 rounded-full bg-[#FF4D4D] text-black text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {g.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <span className="font-semibold text-white text-sm">{g.titulo}</span>
                        {g.impacto && <span className="text-[10px] font-semibold text-[#FF4D4D] ml-auto shrink-0">{g.impacto}</span>}
                      </div>
                      {g.descricao && <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{g.descricao}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 09 OPORTUNIDADES ── */}
          {audit.oportunidades?.length > 0 && (
            <div className="bg-[#111114] border border-[#22C55E]/20 rounded-2xl p-5">
              <SectionHeader num="09" icon="🚀" title="Oportunidades de Escala" color="#22C55E" />
              <div className="grid md:grid-cols-2 gap-3">
                {audit.oportunidades.map((op: any, i: number) => (
                  <div key={i} className="bg-[#16161A] border border-[#22C55E]/15 rounded-xl p-4">
                    <div className="font-semibold text-white text-sm mb-2">{op.titulo}</div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-2">{op.descricao}</p>
                    {op.potencial && (
                      <div className="text-xs font-semibold text-[#22C55E]">📈 Potencial: {op.potencial}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 01 VISÃO GERAL (collapsible) ── */}
          {audit.visao_geral && (
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
              <button className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors"
                onClick={() => setCollapsed(prev => ({ ...prev, visao_geral: !prev.visao_geral }))}>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono"
                  style={{ background: 'rgba(56,189,248,0.1)', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.2)' }}>01</span>
                <span className="text-base">🏢</span>
                <span className="font-display font-bold text-white text-sm">Visão Geral do Negócio</span>
                <span className="ml-auto text-slate-600 text-xs">{collapsed.visao_geral ? '▼ Ver' : '▲ Ocultar'}</span>
              </button>
              {!collapsed.visao_geral && (
                <div className="px-5 pb-5 space-y-4 border-t border-[#2A2A30] pt-4">
                  <div>
                    <div className="text-[10px] text-[#38BDF8] uppercase tracking-widest mb-2 font-bold">Modelo de Aquisição</div>
                    <p className="text-sm text-slate-300 leading-relaxed">{audit.visao_geral.modelo_aquisicao}</p>
                  </div>
                  {audit.visao_geral.desalinhamentos?.length > 0 && (
                    <div>
                      <div className="text-[10px] text-[#FB923C] uppercase tracking-widest mb-2 font-bold">Desalinhamentos Identificados</div>
                      <ItemList items={audit.visao_geral.desalinhamentos} color="#FB923C" icon="⚠" />
                    </div>
                  )}
                  {audit.visao_geral.riscos?.length > 0 && (
                    <div>
                      <div className="text-[10px] text-[#FF4D4D] uppercase tracking-widest mb-2 font-bold">Riscos Estratégicos</div>
                      <ItemList items={audit.visao_geral.riscos} color="#FF4D4D" icon="▲" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── 02 ESTRUTURA (collapsible) ── */}
          {audit.estrutura_campanhas && (audit.estrutura_campanhas.meta || audit.estrutura_campanhas.google) && (
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
              <button className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors"
                onClick={() => setCollapsed(prev => ({ ...prev, estrutura: !prev.estrutura }))}>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono"
                  style={{ background: 'rgba(240,180,41,0.1)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.2)' }}>02</span>
                <span className="text-base">🏗️</span>
                <span className="font-display font-bold text-white text-sm">Análise de Estrutura das Campanhas</span>
                <span className="ml-auto text-slate-600 text-xs">{collapsed.estrutura ? '▼ Ver' : '▲ Ocultar'}</span>
              </button>
              {!collapsed.estrutura && (
                <div className="px-5 pb-5 border-t border-[#2A2A30] pt-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    {audit.estrutura_campanhas.meta && (
                      <PlatformBlock label="Meta Ads" icon="📘" color="#1877F2">
                        <div className="space-y-2.5 text-xs">
                          <div><span className="text-slate-500">Organização:</span> <span className="text-slate-200">{audit.estrutura_campanhas.meta.organizacao_funil}</span></div>
                          <div><span className="text-slate-500">Públicos:</span> <span className="text-slate-200">{audit.estrutura_campanhas.meta.separacao_publicos}</span></div>
                          <div><span className="text-slate-500">Tipos:</span> <span className="text-slate-200">{audit.estrutura_campanhas.meta.tipos_campanha}</span></div>
                          {audit.estrutura_campanhas.meta.erros?.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-[#2A2A30]">
                              <div className="text-[10px] text-[#FF4D4D] font-bold mb-1.5 uppercase">Erros Estruturais</div>
                              <ItemList items={audit.estrutura_campanhas.meta.erros} color="#FF4D4D" icon="✗" />
                            </div>
                          )}
                        </div>
                      </PlatformBlock>
                    )}
                    {audit.estrutura_campanhas.google && (
                      <PlatformBlock label="Google Ads" icon="🔍" color="#EA4335">
                        <div className="space-y-2.5 text-xs">
                          <div><span className="text-slate-500">Organização:</span> <span className="text-slate-200">{audit.estrutura_campanhas.google.organizacao}</span></div>
                          <div><span className="text-slate-500">Palavras-chave:</span> <span className="text-slate-200">{audit.estrutura_campanhas.google.palavras_chave_estrutura}</span></div>
                          <div><span className="text-slate-500">Tipos:</span> <span className="text-slate-200">{audit.estrutura_campanhas.google.tipos_campanha}</span></div>
                          {audit.estrutura_campanhas.google.erros?.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-[#2A2A30]">
                              <div className="text-[10px] text-[#FF4D4D] font-bold mb-1.5 uppercase">Erros Estruturais</div>
                              <ItemList items={audit.estrutura_campanhas.google.erros} color="#FF4D4D" icon="✗" />
                            </div>
                          )}
                        </div>
                      </PlatformBlock>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── 03 TRACKING (collapsible) ── */}
          {audit.tracking && (
            <div className="rounded-2xl overflow-hidden" style={{
              border: audit.tracking.prioridade_maxima ? '2px solid rgba(255,77,77,0.5)' : '1px solid #2A2A30',
              background: '#111114',
            }}>
              <button className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors"
                onClick={() => setCollapsed(prev => ({ ...prev, tracking: !prev.tracking }))}>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono"
                  style={{ background: 'rgba(255,77,77,0.1)', color: '#FF4D4D', border: '1px solid rgba(255,77,77,0.2)' }}>03</span>
                <span className="text-base">📡</span>
                <span className="font-display font-bold text-white text-sm">Análise de Tracking e Dados</span>
                {audit.tracking.prioridade_maxima && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-2 animate-pulse"
                    style={{ background: 'rgba(255,77,77,0.2)', color: '#FF4D4D', border: '1px solid rgba(255,77,77,0.4)' }}>
                    ⚠ PRIORIDADE MÁXIMA
                  </span>
                )}
                <span className="ml-auto text-slate-600 text-xs">{collapsed.tracking ? '▼ Ver' : '▲ Ocultar'}</span>
              </button>
              {!collapsed.tracking && (
                <div className="px-5 pb-5 border-t border-[#2A2A30] pt-5 space-y-4">
                  {audit.tracking.alerta && (
                    <div className="bg-[#FF4D4D]/08 border border-[#FF4D4D]/20 rounded-xl px-4 py-3 text-sm text-slate-300">
                      {audit.tracking.alerta}
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                    {audit.tracking.meta && (
                      <PlatformBlock label="Meta Ads — Pixel & API" icon="📘" color="#1877F2">
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between"><span className="text-slate-500">Pixel instalado:</span><BoolBadge val={audit.tracking.meta.pixel_ok} trueLabel="✓ OK" falseLabel="✗ Problema" /></div>
                          <div className="flex items-center justify-between"><span className="text-slate-500">API de Conversões:</span><BoolBadge val={audit.tracking.meta.api_conversoes} trueLabel="✓ Ativa" falseLabel="✗ Inativa" /></div>
                          <div className="flex items-center justify-between"><span className="text-slate-500">Eventos duplicados:</span><BoolBadge val={audit.tracking.meta.eventos_duplicados} trueLabel="✗ Detectado" falseLabel="✓ Limpo" /></div>
                          {audit.tracking.meta.problemas?.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-[#2A2A30]"><ItemList items={audit.tracking.meta.problemas} color="#FB923C" icon="→" /></div>
                          )}
                        </div>
                      </PlatformBlock>
                    )}
                    {audit.tracking.google && (
                      <PlatformBlock label="Google Ads — Conversões" icon="🔍" color="#EA4335">
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between"><span className="text-slate-500">Conversões confiáveis:</span><BoolBadge val={audit.tracking.google.conversoes_confiaveis} trueLabel="✓ Sim" falseLabel="✗ Duvido" /></div>
                          <div className="flex items-center justify-between"><span className="text-slate-500">Importação correta:</span><BoolBadge val={audit.tracking.google.importacao_correta} trueLabel="✓ Sim" falseLabel="✗ Verificar" /></div>
                          <div className="flex items-center justify-between"><span className="text-slate-500">Conversão de vaidade:</span><BoolBadge val={audit.tracking.google.problema_vaidade} trueLabel="✗ Risco" falseLabel="✓ OK" /></div>
                          {audit.tracking.google.problemas?.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-[#2A2A30]"><ItemList items={audit.tracking.google.problemas} color="#FB923C" icon="→" /></div>
                          )}
                        </div>
                      </PlatformBlock>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── CHECKLIST DE TRACKING (collapsible with summary) ── */}
          {(audit._trackingChecklist as any[] | undefined)?.length! > 0 && (
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
              <button className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors"
                onClick={() => setCollapsed(prev => ({ ...prev, checklist: !prev.checklist }))}>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono"
                  style={{ background: 'rgba(255,77,77,0.1)', color: '#FF4D4D', border: '1px solid rgba(255,77,77,0.2)' }}>TC</span>
                <span className="text-base">✅</span>
                <span className="font-display font-bold text-white text-sm">Checklist de Tracking</span>
                {(() => {
                  const checklist = audit._trackingChecklist as any[]
                  const v = checklist.filter((t: any) => t.status === 'verificado').length
                  const u = checklist.filter((t: any) => t.status === 'nao_verificado').length
                  const p = checklist.filter((t: any) => t.status === 'problema').length
                  return (
                    <div className="ml-2 flex items-center gap-1.5">
                      {v > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>{v} ✓</span>}
                      {u > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(240,180,41,0.15)', color: '#F0B429' }}>{u} ?</span>}
                      {p > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,77,77,0.15)', color: '#FF4D4D' }}>{p} ✗</span>}
                    </div>
                  )
                })()}
                <span className="ml-auto text-slate-600 text-xs">{collapsed.checklist ? '▼ Ver' : '▲ Ocultar'}</span>
              </button>
              {!collapsed.checklist && (
                <div className="px-5 pb-5 border-t border-[#2A2A30] pt-4 space-y-3">
                  {(audit._hasGoogleConversions || !!googleAccount) && (
                    <div className="flex items-start gap-2 text-[10px] text-[#38BDF8] bg-[#38BDF8]/06 border border-[#38BDF8]/20 rounded-xl px-3 py-2">
                      <span className="flex-shrink-0 mt-0.5">ℹ</span>
                      <span>No Google Ads, conversões podem incluir diferentes ações configuradas na conta (formulários, ligações, compras, eventos de site). Confirme se a conversão principal representa o evento mais relevante — lead, venda ou contato.</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                    {(audit._trackingChecklist as any[]).map((item: any) => {
                      const statusConfig = {
                        verificado:     { color: '#22C55E', bg: 'rgba(34,197,94,0.08)',   label: '✓ Verificado' },
                        nao_verificado: { color: '#F0B429', bg: 'rgba(240,180,41,0.06)',  label: '? Não verificado' },
                        problema:       { color: '#FF4D4D', bg: 'rgba(255,77,77,0.08)',   label: '✗ Problema' },
                        indisponivel:   { color: '#64748B', bg: 'rgba(100,116,139,0.06)', label: '— Indisponível' },
                        precisa_acesso: { color: '#A78BFA', bg: 'rgba(167,139,250,0.08)', label: '🔑 Precisa de acesso' },
                      } as Record<string, { color: string; bg: string; label: string }>
                      const cfg = statusConfig[item.status] || statusConfig['nao_verificado']
                      return (
                        <div key={item.id} className="flex items-center justify-between rounded-lg px-3 py-2"
                          style={{ background: cfg.bg, border: `1px solid ${cfg.color}20` }}>
                          <span className="text-[11px] text-slate-300">{item.label}</span>
                          <span className="text-[10px] font-bold flex-shrink-0 ml-2" style={{ color: cfg.color }}>{cfg.label}</span>
                        </div>
                      )
                    })}
                  </div>
                  {(() => {
                    const unverified = (audit._trackingChecklist as any[]).filter((t: any) => t.status === 'nao_verificado').length
                    if (unverified < 4) return null
                    return (
                      <div className="flex items-start gap-2 bg-[#F0B429]/06 border border-[#F0B429]/20 rounded-xl px-3 py-2.5">
                        <span className="flex-shrink-0 text-[#F0B429] text-[11px] mt-0.5">⚠</span>
                        <p className="text-[11px] text-[#F0B429] leading-relaxed">
                          Parte do tracking precisa ser validada manualmente. A auditoria não conseguiu confirmar todos os eventos com os dados disponíveis — <strong>{unverified} de 8</strong> itens sem verificação.
                        </p>
                      </div>
                    )
                  })()}
                  <p className="text-[10px] text-slate-600">Itens "Não verificado" requerem acesso ao Events Manager (Meta) ou Google Ads para confirmação manual.</p>
                </div>
              )}
            </div>
          )}

          {/* ── 04 PERFORMANCE (collapsible) ── */}
          {audit.performance && (audit.performance.meta || audit.performance.google) && (
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
              <button className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors"
                onClick={() => setCollapsed(prev => ({ ...prev, performance: !prev.performance }))}>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono"
                  style={{ background: 'rgba(240,180,41,0.1)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.2)' }}>04</span>
                <span className="text-base">📊</span>
                <span className="font-display font-bold text-white text-sm">Análise de Performance</span>
                <span className="ml-auto text-slate-600 text-xs">{collapsed.performance ? '▼ Ver' : '▲ Ocultar'}</span>
              </button>
              {!collapsed.performance && (
                <div className="px-5 pb-5 border-t border-[#2A2A30] pt-5">
                  {audit._realMetrics && audit._realMetrics.totalSpend === 0 && audit._realMetrics.totalLeads === 0 && (
                    <div className="mb-4 flex items-start gap-2 bg-[#F0B429]/06 border border-[#F0B429]/25 rounded-xl px-4 py-3 text-[11px] text-[#F0B429]">
                      <span className="flex-shrink-0 mt-0.5">⚠</span>
                      <span><strong>Sem dados de performance para o período selecionado.</strong>{' '}
                        Verifique em <strong>Meta Ads IA</strong> ou <strong>Google Ads IA</strong> qual conta está selecionada, ou importe um relatório CSV.</span>
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                    {audit.performance.meta && (
                      <PlatformBlock label="Meta Ads" icon="📘" color="#1877F2">
                        {audit.performance.meta.metricas && (() => {
                          const m = audit.performance.meta.metricas
                          const noData = !m.ctr && !m.cpa && !m.frequencia
                          return (
                            <>
                              <div className="grid grid-cols-3 gap-2 mb-3">
                                {[
                                  { label: 'CTR', value: m.ctr > 0 ? `${m.ctr}%` : '—', warn: m.ctr > 0 && m.ctr < 1 },
                                  { label: 'CPL', value: m.cpa > 0 ? `R$${m.cpa}` : '—', warn: false },
                                  { label: 'Freq.', value: m.frequencia > 0 ? `${m.frequencia}×` : '—', warn: m.frequencia > 0 && m.frequencia > 4 },
                                ].map(item => (
                                  <div key={item.label} className="bg-[#111114] rounded-lg p-2 text-center">
                                    <div className="text-[10px] text-slate-600 mb-0.5">{item.label}</div>
                                    <div className="text-sm font-bold" style={{ color: item.value === '—' ? '#64748B' : item.warn ? '#FF4D4D' : '#F0B429' }}>{item.value}</div>
                                  </div>
                                ))}
                              </div>
                              {noData && (
                                <div className="text-[10px] text-slate-500 text-center mb-2">Sem métricas disponíveis para o período</div>
                              )}
                            </>
                          )
                        })()}
                        {audit.performance.meta.gargalos?.length > 0 && (
                          <div className="mb-3">
                            <div className="text-[10px] text-[#FB923C] font-bold uppercase mb-1.5">Gargalos</div>
                            <ItemList items={audit.performance.meta.gargalos} color="#FB923C" icon="⚠" />
                          </div>
                        )}
                        {audit.performance.meta.interpretacao && (
                          <p className="text-xs text-slate-400 leading-relaxed border-t border-[#2A2A30] pt-2">{audit.performance.meta.interpretacao}</p>
                        )}
                      </PlatformBlock>
                    )}
                    {audit.performance.google && (
                      <PlatformBlock label="Google Ads" icon="🔍" color="#EA4335">
                        {audit.performance.google.metricas && (() => {
                          const gm = audit.performance.google.metricas
                          return (
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              {[
                                { label: 'CTR', value: gm.ctr > 0 ? `${gm.ctr}%` : '—', warn: gm.ctr > 0 && gm.ctr < 2 },
                                { label: 'CPC', value: gm.cpc > 0 ? `R$${gm.cpc}` : '—', warn: false },
                                { label: 'Conv.', value: gm.taxa_conversao > 0 ? `${gm.taxa_conversao}%` : '—', warn: gm.taxa_conversao > 0 && gm.taxa_conversao < 2 },
                              ].map(item => (
                                <div key={item.label} className="bg-[#111114] rounded-lg p-2 text-center">
                                  <div className="text-[10px] text-slate-600 mb-0.5">{item.label}</div>
                                  <div className="text-sm font-bold" style={{ color: item.value === '—' ? '#64748B' : item.warn ? '#FF4D4D' : '#F0B429' }}>{item.value}</div>
                                </div>
                              ))}
                            </div>
                          )
                        })()}
                        {audit.performance.google.palavras_chave_analise && (
                          <p className="text-xs text-slate-400 mb-2">{audit.performance.google.palavras_chave_analise}</p>
                        )}
                        {audit.performance.google.interpretacao && (
                          <p className="text-xs text-slate-400 leading-relaxed border-t border-[#2A2A30] pt-2">{audit.performance.google.interpretacao}</p>
                        )}
                      </PlatformBlock>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── 05 CRIATIVOS (collapsible) ── */}
          {audit.criativos_meta && (
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
              <button className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors"
                onClick={() => setCollapsed(prev => ({ ...prev, criativos: !prev.criativos }))}>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono"
                  style={{ background: 'rgba(167,139,250,0.1)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.2)' }}>05</span>
                <span className="text-base">🎨</span>
                <span className="font-display font-bold text-white text-sm">Análise de Criativos (Meta Ads)</span>
                <span className="ml-auto text-slate-600 text-xs">{collapsed.criativos ? '▼ Ver' : '▲ Ocultar'}</span>
              </button>
              {!collapsed.criativos && (
                <div className="px-5 pb-5 border-t border-[#2A2A30] pt-5">
                  {uploadedFiles.length > 0 && !uploadedFiles.some(f => f.level === 'ad') ? (
                    <div className="flex items-start gap-3 bg-[#A78BFA]/06 border border-[#A78BFA]/20 rounded-xl px-4 py-4">
                      <span className="text-[#A78BFA] text-lg flex-shrink-0">🎨</span>
                      <div>
                        <div className="text-sm font-semibold text-[#A78BFA] mb-1">Dados de nível de anúncio não encontrados</div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Para analisar criativos com mais precisão, exporte no <strong className="text-slate-300">nível de anúncio</strong> incluindo: Frequência, CTR, Gasto e Leads por anúncio.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid md:grid-cols-2 gap-3">
                        {[
                          { label: 'Quantidade',       value: audit.criativos_meta.quantidade },
                          { label: 'Ganchos',           value: audit.criativos_meta.qualidade_ganchos },
                          { label: 'Clareza da oferta', value: audit.criativos_meta.clareza_oferta },
                          { label: 'Prova social',      value: audit.criativos_meta.prova_social },
                          { label: 'Testes A/B',        value: audit.criativos_meta.teste_ab },
                          { label: 'Fadiga',            value: audit.criativos_meta.fadiga },
                          { label: 'Ângulo criativo',   value: audit.criativos_meta.angulo },
                        ].filter(i => i.value).map(item => (
                          <div key={item.label} className="bg-[#16161A] rounded-xl px-3 py-2.5">
                            <div className="text-[10px] text-[#A78BFA] uppercase font-bold mb-1">{item.label}</div>
                            <div className="text-xs text-slate-300 leading-relaxed">{item.value}</div>
                          </div>
                        ))}
                      </div>
                      {audit.criativos_meta.problemas?.length > 0 && (
                        <div className="mt-4 bg-[#FF4D4D]/06 border border-[#FF4D4D]/20 rounded-xl p-3">
                          <div className="text-[10px] text-[#FF4D4D] font-bold uppercase mb-2">Problemas Críticos de Criativo</div>
                          <ItemList items={audit.criativos_meta.problemas} color="#FF4D4D" icon="✗" />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── 06 PÚBLICOS (collapsible) ── */}
          {audit.publicos && (audit.publicos.meta || audit.publicos.google) && (
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
              <button className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors"
                onClick={() => setCollapsed(prev => ({ ...prev, publicos: !prev.publicos }))}>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono"
                  style={{ background: 'rgba(56,189,248,0.1)', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.2)' }}>06</span>
                <span className="text-base">👥</span>
                <span className="font-display font-bold text-white text-sm">Análise de Públicos</span>
                <span className="ml-auto text-slate-600 text-xs">{collapsed.publicos ? '▼ Ver' : '▲ Ocultar'}</span>
              </button>
              {!collapsed.publicos && (
                <div className="px-5 pb-5 border-t border-[#2A2A30] pt-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    {audit.publicos.meta && (
                      <PlatformBlock label="Meta Ads" icon="📘" color="#1877F2">
                        <div className="space-y-2.5 text-xs">
                          {audit.publicos.meta.amplos_segmentados && <div><span className="text-slate-500 block mb-0.5">Amplos vs Segmentados:</span><span className="text-slate-200">{audit.publicos.meta.amplos_segmentados}</span></div>}
                          {audit.publicos.meta.lookalikes && <div><span className="text-slate-500 block mb-0.5">Lookalikes:</span><span className="text-slate-200">{audit.publicos.meta.lookalikes}</span></div>}
                          {audit.publicos.meta.remarketing && <div><span className="text-slate-500 block mb-0.5">Remarketing:</span><span className="text-slate-200">{audit.publicos.meta.remarketing}</span></div>}
                          {audit.publicos.meta.problemas?.length > 0 && <div className="pt-2 border-t border-[#2A2A30]"><ItemList items={audit.publicos.meta.problemas} color="#FB923C" icon="→" /></div>}
                        </div>
                      </PlatformBlock>
                    )}
                    {audit.publicos.google && (
                      <PlatformBlock label="Google Ads" icon="🔍" color="#EA4335">
                        <div className="space-y-2.5 text-xs">
                          {audit.publicos.google.qualidade_kws && <div><span className="text-slate-500 block mb-0.5">Palavras-chave:</span><span className="text-slate-200">{audit.publicos.google.qualidade_kws}</span></div>}
                          {audit.publicos.google.correspondencia && <div><span className="text-slate-500 block mb-0.5">Correspondência:</span><span className="text-slate-200">{audit.publicos.google.correspondencia}</span></div>}
                          {audit.publicos.google.negativacao && <div><span className="text-slate-500 block mb-0.5">Negativação:</span><span className="text-slate-200">{audit.publicos.google.negativacao}</span></div>}
                          {audit.publicos.google.problemas?.length > 0 && <div className="pt-2 border-t border-[#2A2A30]"><ItemList items={audit.publicos.google.problemas} color="#FB923C" icon="→" /></div>}
                        </div>
                      </PlatformBlock>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── 07 FUNIL (collapsible) ── */}
          {audit.funil && (
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
              <button className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors"
                onClick={() => setCollapsed(prev => ({ ...prev, funil: !prev.funil }))}>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono"
                  style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }}>07</span>
                <span className="text-base">🔄</span>
                <span className="font-display font-bold text-white text-sm">Análise de Funil e Conversão</span>
                {audit.funil.gargalo_principal && (
                  <span className="ml-2">
                    <Pill text={`Gargalo: ${audit.funil.gargalo_principal}`}
                      color={audit.funil.gargalo_principal === 'trafego' ? '#FB923C' : audit.funil.gargalo_principal === 'pos-clique' ? '#38BDF8' : '#F0B429'} />
                  </span>
                )}
                <span className="ml-auto text-slate-600 text-xs">{collapsed.funil ? '▼ Ver' : '▲ Ocultar'}</span>
              </button>
              {!collapsed.funil && (
                <div className="px-5 pb-5 border-t border-[#2A2A30] pt-5">
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    {[
                      { label: 'Landing Page', value: audit.funil.landing_page, icon: '🖥️' },
                      { label: 'Atendimento',  value: audit.funil.atendimento,   icon: '💬' },
                      { label: 'Follow-up',    value: audit.funil.follow_up,     icon: '📱' },
                    ].filter(i => i.value).map(item => (
                      <div key={item.label} className="bg-[#16161A] rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span>{item.icon}</span>
                          <span className="text-[10px] text-[#22C55E] font-bold uppercase">{item.label}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  {audit.funil.nota && (
                    <div className="bg-[#22C55E]/06 border border-[#22C55E]/20 rounded-xl px-4 py-3 flex items-start gap-2">
                      <span className="text-[#22C55E] mt-0.5">→</span>
                      <p className="text-sm text-slate-300">{audit.funil.nota}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── 10 PLANO DE AÇÃO ── */}
          {audit.plano_acao && (
            <div className="bg-[#111114] border border-[#F0B429]/20 rounded-2xl p-5">
              <SectionHeader num="10" icon="📋" title="Plano de Ação Estratégico" color="#F0B429" />

              {/* Tabs */}
              <div className="flex gap-2 mb-4">
                {([['curto', '0–15 dias', '#22C55E'], ['medio', '15–45 dias', '#F0B429'], ['longo', '45+ dias', '#A78BFA']] as const).map(([key, label, color]) => (
                  <button
                    key={key}
                    onClick={() => setActiveAction(key)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: activeAction === key ? `${color}15` : 'transparent',
                      border: activeAction === key ? `1px solid ${color}40` : '1px solid #2A2A30',
                      color: activeAction === key ? color : '#64748B',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Ações */}
              <div className="space-y-3">
                {(audit.plano_acao[activeAction] || []).map((item: any, i: number) => {
                  const color = activeAction === 'curto' ? '#22C55E' : activeAction === 'medio' ? '#F0B429' : '#A78BFA'
                  return (
                    <div key={i} className="bg-[#16161A] border border-[#2A2A30] rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 text-black"
                          style={{ background: color }}>{i + 1}</span>
                        <div>
                          <div className="font-semibold text-white text-sm mb-1">{item.acao}</div>
                          <p className="text-xs text-slate-400 mb-2">{item.como}</p>
                          {item.impacto && <div className="text-xs font-semibold" style={{ color }}>→ {item.impacto}</div>}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {!(audit.plano_acao[activeAction]?.length) && (
                  <div className="text-center text-xs text-slate-600 py-4">Nenhuma ação definida para este período.</div>
                )}
              </div>
            </div>
          )}

          {/* ── 11 INSIGHTS SÊNIOR ── */}
          {audit.insights_senior?.length > 0 && (
            <div className="bg-[#111114] border border-[#A78BFA]/25 rounded-2xl p-5">
              <SectionHeader num="11" icon="🧠" title="Insights Estratégicos (Nível Sênior)" color="#A78BFA" />
              <div className="space-y-4">
                {audit.insights_senior.map((ins: any, i: number) => (
                  <div key={i} className="border-l-2 border-[#A78BFA]/40 pl-4">
                    <div className="font-semibold text-white text-sm mb-1.5">{ins.titulo}</div>
                    <p className="text-sm text-slate-400 leading-relaxed">{ins.texto}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Toast de feedback "Enviar para Ações" */}
      {actionToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold animate-fade-up"
          style={{
            background: actionToast.ok ? 'rgba(15,15,18,0.97)' : 'rgba(15,15,18,0.97)',
            border:     `1px solid ${actionToast.ok ? 'rgba(34,197,94,0.5)' : 'rgba(240,180,41,0.5)'}`,
            color:      actionToast.ok ? '#22C55E' : '#F0B429',
          }}>
          <span>{actionToast.ok ? '✓' : '!'}</span>
          {actionToast.msg}
        </div>
      )}
    </div>
  )
}
