// components/dashboard/TabAuditoria.tsx — Auditoria sênior nível consultor premium (11 seções)
'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import type { ClientData } from '@/lib/store'

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
    'valor usado', 'amount spent', 'quantia gasta',
    'custo', 'cost', 'gasto', 'spend', 'investimento',
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

  // ── Conversões / Leads / Resultados ───────────────────────────────────────
  // Prioridade: métricas específicas de lead/conversa antes de "Resultados"
  // (que no Meta pode ser micro-conversão — ex: "cliques em mensagem")
  //
  // Google PT: "Conversoes" | Google EN: "Conversions" / "Conv."
  // Meta Mensagens PT: "Mensagens iniciadas" / "Conversas iniciadas" / "Contatos no WhatsApp"
  // Meta Lead Ads PT: "Leads" | Meta genérico PT: "Resultados"
  const leads = parseNum(findCol(row,
    // Google
    'conversoes', 'conversions', 'conv ',
    // Meta — específicos de mensagens/WhatsApp (prioridade antes de "resultados")
    'mensagens iniciadas', 'conversas iniciadas', 'novo contato no whatsapp',
    'contatos no whatsapp', 'mensagem iniciada', 'conversa iniciada',
    'messaging conversations started', 'conversations started',
    // Meta Lead Ads
    'leads',
    // Meta genérico — último recurso (pode ser micro-métrica)
    'resultados', 'results',
    'acoes', 'actions',
  ))

  // ── CPA / CPL — custo por conversão ───────────────────────────────────────
  // Google PT: "Custo / conv." | Google EN: "Cost / conv."
  // Meta Mensagens: "Custo por conversa iniciada" / "Custo por mensagem iniciada"
  // Meta genérico: "Custo por resultado" | Meta EN: "Cost per result"
  const cpl = parseNum(findCol(row,
    // Google
    'custo   conv', 'cost   conv',    // colKey remove "/" → "custo   conv"
    // Meta — específicos de mensagens/WhatsApp (prioridade)
    'custo por conversa iniciada', 'custo por mensagem iniciada',
    'custo por novo contato no whatsapp', 'custo por contato no whatsapp',
    'cost per messaging conversation started', 'cost per conversation started',
    // Meta Lead Ads / genérico
    'custo por resultado', 'cost per result',
    'custo por lead', 'cost per lead',
    'custo por acao', 'cpa', 'cpl',
  ))

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
  const { connectedAccounts, auditCache, setAuditCache, deleteAuditEntry } = useAppStore()
  const [audit,         setAudit]         = useState<Record<string, any> | null>(null)
  const [selectedId,    setSelectedId]    = useState<string | null>(null)
  const [loading,       setLoading]       = useState(false)
  const [pdfLoading,    setPdfLoading]    = useState(false)
  const [error,         setError]         = useState('')
  const [source,        setSource]        = useState<'ai' | 'benchmark' | null>(null)
  const [dragOver,      setDragOver]      = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [parseError,    setParseError]    = useState('')
  const [activeAction,  setActiveAction]  = useState<'curto' | 'medio' | 'longo'>('curto')

  const key = clientData?.clientName || ''

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

  const fileRef = useRef<HTMLInputElement>(null)
  const metaAccount   = connectedAccounts.find(a => a.platform === 'meta')
  const googleAccount = connectedAccounts.find(a => a.platform === 'google')
  const hasUpload      = uploadedFiles.length > 0
  const canAudit       = (!!metaAccount || !!googleAccount || hasUpload) && !!clientData

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
    setError('')
    setAudit(null)

    try {
      const [metaResult, googleResult] = await Promise.all([
        metaAccount?.accessToken && metaAccount?.accountId
          ? fetch('/api/ads-data/meta', { method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ accessToken: metaAccount.accessToken, accountId: metaAccount.accountId }) })
              .then(r => r.json()).catch(() => null)
          : Promise.resolve(null),
        googleAccount?.accessToken && googleAccount?.accountId
          ? fetch('/api/ads-data/google', { method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ accessToken: googleAccount.accessToken, accountId: googleAccount.accountId }) })
              .then(r => r.json()).catch(() => null)
          : Promise.resolve(null),
      ])

      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName:    clientData.clientName,
          niche:         clientData.niche,
          budget:        clientData.budget,
          objective:     clientData.objective,
          metaCampaigns:   metaResult?.campaigns   || [],
          metaTotals:      metaResult?.totals      || null,
          googleCampaigns: googleResult?.campaigns || [],
          googleTotals:    googleResult?.totals    || null,
          uploadedFiles: uploadedFiles.map(f => ({
            filename: f.file.name,
            platform: f.platform,
            campaigns: f.campaigns,
          })),
        }),
      })

      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setAudit(json.audit)
      setSource(json.source)
      // Persiste resultado no store para carregar automaticamente ao reabrir a aba
      if (clientData?.clientName) setAuditCache(clientData.clientName, json.audit)

    } catch (e: any) {
      setError(e.message || 'Erro ao gerar auditoria.')
    } finally {
      setLoading(false)
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
          {audit && (
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
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all hover:opacity-80 disabled:opacity-50"
              style={{ border: '1px solid rgba(240,180,41,0.3)', color: '#F0B429', background: 'rgba(240,180,41,0.05)' }}
            >
              {pdfLoading ? '⏳' : '↓'} PDF
            </button>
          )}
          <button
            onClick={handleAudit}
            disabled={loading || !canAudit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: canAudit ? 'linear-gradient(135deg, #F0B429, #FFD166)' : '#2A2A30', color: canAudit ? '#000' : '#555' }}
          >
            {loading ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Auditando...</> : '🔍 Iniciar Auditoria'}
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

          {/* ── Score Hero ── */}
          <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-6">
            <div className="flex items-start justify-between gap-6 mb-4">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Score de Saúde da Conta</div>
                <div className="flex items-end gap-3">
                  <span className="font-display text-6xl font-bold" style={{ color: sc }}>{audit.health_score}</span>
                  <span className="font-display text-2xl text-slate-500 mb-1">/100</span>
                  <span className="font-display text-4xl font-bold mb-1" style={{ color: sc }}>{audit.grade}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] text-slate-500 uppercase mb-1">Fonte</div>
                <Pill text={source === 'ai' ? '⚡ IA Sênior' : '📊 Benchmark'} color={source === 'ai' ? '#A78BFA' : '#38BDF8'} />
              </div>
            </div>
            <div className="w-full h-2.5 bg-[#1E1E24] rounded-full overflow-hidden mb-5">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${audit.health_score}%`, background: `linear-gradient(90deg, ${sc}, ${sc}88)` }} />
            </div>
            {audit.executive_summary && (
              <p className="text-slate-300 text-sm leading-relaxed border-t border-[#2A2A30] pt-4">{audit.executive_summary}</p>
            )}
          </div>

          {/* ── 01 VISÃO GERAL ── */}
          {audit.visao_geral && (
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
              <SectionHeader num="01" icon="🏢" title="Visão Geral do Negócio" color="#38BDF8" />
              <div className="space-y-4">
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
            </div>
          )}

          {/* ── 02 ESTRUTURA DAS CAMPANHAS ── */}
          {audit.estrutura_campanhas && (audit.estrutura_campanhas.meta || audit.estrutura_campanhas.google) && (
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
              <SectionHeader num="02" icon="🏗️" title="Análise de Estrutura das Campanhas" color="#F0B429" />
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

          {/* ── 03 TRACKING ── */}
          {audit.tracking && (
            <div className="bg-[#111114] rounded-2xl p-5" style={{
              border: audit.tracking.prioridade_maxima ? '2px solid rgba(255,77,77,0.5)' : '1px solid #2A2A30',
            }}>
              <div className="flex items-center gap-3 mb-4">
                <SectionHeader num="03" icon="📡" title="Análise de Tracking e Dados" color="#FF4D4D" />
                {audit.tracking.prioridade_maxima && (
                  <span className="ml-auto text-[10px] font-bold px-2 py-1 rounded-full animate-pulse"
                    style={{ background: 'rgba(255,77,77,0.2)', color: '#FF4D4D', border: '1px solid rgba(255,77,77,0.4)' }}>
                    ⚠ PRIORIDADE MÁXIMA
                  </span>
                )}
              </div>
              {audit.tracking.alerta && (
                <div className="bg-[#FF4D4D]/08 border border-[#FF4D4D]/20 rounded-xl px-4 py-3 text-sm text-slate-300 mb-4">
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
                        <div className="mt-2 pt-2 border-t border-[#2A2A30]">
                          <ItemList items={audit.tracking.meta.problemas} color="#FB923C" icon="→" />
                        </div>
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
                        <div className="mt-2 pt-2 border-t border-[#2A2A30]">
                          <ItemList items={audit.tracking.google.problemas} color="#FB923C" icon="→" />
                        </div>
                      )}
                    </div>
                  </PlatformBlock>
                )}
              </div>
            </div>
          )}

          {/* ── 04 PERFORMANCE ── */}
          {audit.performance && (audit.performance.meta || audit.performance.google) && (
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
              <SectionHeader num="04" icon="📊" title="Análise de Performance" color="#F0B429" />
              <div className="grid md:grid-cols-2 gap-4">
                {audit.performance.meta && (
                  <PlatformBlock label="Meta Ads" icon="📘" color="#1877F2">
                    {audit.performance.meta.metricas && (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[
                          { label: 'CTR', value: `${audit.performance.meta.metricas.ctr || 0}%`, warn: (audit.performance.meta.metricas.ctr || 0) < 1 },
                          { label: 'CPL', value: `R$${audit.performance.meta.metricas.cpa || 0}`, warn: false },
                          { label: 'Freq.', value: `${audit.performance.meta.metricas.frequencia || 0}×`, warn: (audit.performance.meta.metricas.frequencia || 0) > 4 },
                        ].map(m => (
                          <div key={m.label} className="bg-[#111114] rounded-lg p-2 text-center">
                            <div className="text-[10px] text-slate-600 mb-0.5">{m.label}</div>
                            <div className="text-sm font-bold" style={{ color: m.warn ? '#FF4D4D' : '#F0B429' }}>{m.value}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {audit.performance.meta.gargalos?.length > 0 && (
                      <div className="mb-3"><div className="text-[10px] text-[#FB923C] font-bold uppercase mb-1.5">Gargalos</div>
                        <ItemList items={audit.performance.meta.gargalos} color="#FB923C" icon="⚠" /></div>
                    )}
                    {audit.performance.meta.interpretacao && (
                      <p className="text-xs text-slate-400 leading-relaxed border-t border-[#2A2A30] pt-2">{audit.performance.meta.interpretacao}</p>
                    )}
                  </PlatformBlock>
                )}
                {audit.performance.google && (
                  <PlatformBlock label="Google Ads" icon="🔍" color="#EA4335">
                    {audit.performance.google.metricas && (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[
                          { label: 'CTR', value: `${audit.performance.google.metricas.ctr || 0}%`, warn: (audit.performance.google.metricas.ctr || 0) < 2 },
                          { label: 'CPC', value: `R$${audit.performance.google.metricas.cpc || 0}`, warn: false },
                          { label: 'Conv.', value: `${audit.performance.google.metricas.taxa_conversao || 0}%`, warn: (audit.performance.google.metricas.taxa_conversao || 0) < 2 },
                        ].map(m => (
                          <div key={m.label} className="bg-[#111114] rounded-lg p-2 text-center">
                            <div className="text-[10px] text-slate-600 mb-0.5">{m.label}</div>
                            <div className="text-sm font-bold" style={{ color: m.warn ? '#FF4D4D' : '#F0B429' }}>{m.value}</div>
                          </div>
                        ))}
                      </div>
                    )}
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

          {/* ── 05 CRIATIVOS ── */}
          {audit.criativos_meta && (
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
              <SectionHeader num="05" icon="🎨" title="Análise de Criativos (Meta Ads)" color="#A78BFA" />
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { label: 'Quantidade',    value: audit.criativos_meta.quantidade },
                  { label: 'Ganchos',       value: audit.criativos_meta.qualidade_ganchos },
                  { label: 'Clareza da oferta', value: audit.criativos_meta.clareza_oferta },
                  { label: 'Prova social',  value: audit.criativos_meta.prova_social },
                  { label: 'Testes A/B',    value: audit.criativos_meta.teste_ab },
                  { label: 'Fadiga',        value: audit.criativos_meta.fadiga },
                  { label: 'Ângulo criativo', value: audit.criativos_meta.angulo },
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
            </div>
          )}

          {/* ── 06 PÚBLICOS ── */}
          {audit.publicos && (audit.publicos.meta || audit.publicos.google) && (
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
              <SectionHeader num="06" icon="👥" title="Análise de Públicos" color="#38BDF8" />
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

          {/* ── 07 FUNIL ── */}
          {audit.funil && (
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
              <SectionHeader num="07" icon="🔄" title="Análise de Funil e Conversão" color="#22C55E" />
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {[
                  { label: 'Landing Page',  value: audit.funil.landing_page,  icon: '🖥️' },
                  { label: 'Atendimento',   value: audit.funil.atendimento,    icon: '💬' },
                  { label: 'Follow-up',     value: audit.funil.follow_up,      icon: '📱' },
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
                  {audit.funil.gargalo_principal && (
                    <span className="ml-auto shrink-0">
                      <Pill text={`Gargalo: ${audit.funil.gargalo_principal}`}
                        color={audit.funil.gargalo_principal === 'trafego' ? '#FB923C' : audit.funil.gargalo_principal === 'pos-clique' ? '#38BDF8' : '#F0B429'} />
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── 08 GARGALOS ── */}
          {audit.gargalos?.length > 0 && (
            <div className="bg-[#111114] border border-[#FF4D4D]/25 rounded-2xl p-5">
              <SectionHeader num="08" icon="🚨" title="Principais Gargalos" color="#FF4D4D" />
              <div className="space-y-3">
                {audit.gargalos.map((g: any, i: number) => (
                  <div key={i} className="rounded-xl p-4 border" style={{ background: 'rgba(255,77,77,0.04)', borderColor: 'rgba(255,77,77,0.15)' }}>
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#FF4D4D] text-black text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {g.rank}
                      </span>
                      <div className="flex-1">
                        <div className="font-semibold text-white text-sm mb-1">{g.titulo}</div>
                        <p className="text-xs text-slate-400 leading-relaxed mb-2">{g.descricao}</p>
                        {g.impacto && (
                          <div className="text-xs font-semibold" style={{ color: '#FF4D4D' }}>
                            💸 Impacto: {g.impacto}
                          </div>
                        )}
                      </div>
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
    </div>
  )
}
