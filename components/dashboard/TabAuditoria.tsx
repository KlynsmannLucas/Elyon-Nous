// components/dashboard/TabAuditoria.tsx — Auditoria com upload XLSX/CSV + análise IA completa
'use client'

import { useState, useRef, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import type { ClientData } from '@/lib/store'

interface Props {
  clientData: ClientData | null
}

// ─── Cores ──────────────────────────────────────────────────────────────────
const gradeColor: Record<string, string> = {
  'A+': '#22C55E', A: '#22C55E', 'B+': '#F0B429',
  B: '#F0B429', 'C+': '#F59E0B', C: '#F59E0B', D: '#FF4D4D',
}
const severityColor: Record<string, string> = {
  alta: '#FF4D4D', media: '#F0B429', baixa: '#38BDF8',
}
const statusColor: Record<string, string> = {
  bom: '#22C55E', atenção: '#F0B429', crítico: '#FF4D4D',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (!n) return 'R$0'
  if (n >= 1_000_000) return `R$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000)      return `R$${(n / 1000).toFixed(1)}k`
  return `R$${n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

// Normaliza colunas CSV/XLSX de relatórios Meta Ads e Google Ads para um formato comum
function normalizeRow(row: Record<string, string>): Record<string, any> {
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const found = Object.entries(row).find(([col]) =>
        col.toLowerCase().includes(k.toLowerCase())
      )
      if (found) return found[1]
    }
    return ''
  }

  const parseNum = (v: string) => {
    if (!v) return 0
    const clean = String(v).replace(/[R$\s%×x,]/g, '').replace('.', '').replace(',', '.')
    return parseFloat(clean) || 0
  }

  const name     = get('campanha', 'campaign', 'conjunto', 'ad set', 'anúncio', 'ad name', 'nome')
  const status   = get('status', 'situação')
  const spend    = parseNum(get('valor usado', 'gasto', 'spend', 'custo', 'cost', 'investimento'))
  const impr     = parseNum(get('impressões', 'impressions', 'impr'))
  const clicks   = parseNum(get('cliques', 'clicks', 'clique'))
  const ctr      = parseNum(get('ctr', 'taxa de cliques'))
  const leads    = parseNum(get('leads', 'resultados', 'conversões', 'conversions', 'result'))
  const cpl      = parseNum(get('custo por lead', 'custo por resultado', 'cost per result', 'cpl', 'cpconv'))
  const roas     = parseNum(get('roas', 'retorno'))
  const budget   = parseNum(get('orçamento', 'budget'))
  const placement = get('posicionamento', 'placement', 'posição', 'device')
  const adName   = get('nome do anúncio', 'anúncio', 'ad name', 'creative')

  return { name, status, spend, impressions: impr, clicks, ctr, leads, cpl, roas, budget, placement, adName }
}

// Detecta se é relatório Meta ou Google
function detectPlatform(headers: string[]): 'meta' | 'google' | 'unknown' {
  const h = headers.join(' ').toLowerCase()
  if (h.includes('valor usado') || h.includes('conjunto de anúncios') || h.includes('ad set') || h.includes('facebook') || h.includes('meta')) return 'meta'
  if (h.includes('campaign type') || h.includes('avg. cpc') || h.includes('google') || h.includes('keyword')) return 'google'
  return 'unknown'
}

// ─── Componentes internos ────────────────────────────────────────────────────
function MetricCard({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-4 text-center">
      <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="font-display text-xl font-bold" style={{ color: color || '#F0B429' }}>{value}</div>
      {sub && <div className="text-[10px] text-slate-600 mt-0.5">{sub}</div>}
    </div>
  )
}

function SectionTitle({ icon, title, color }: { icon: string; title: string; color?: string }) {
  return (
    <div className="font-display font-bold text-white flex items-center gap-2 mb-3" style={{ color: color || 'white' }}>
      <span>{icon}</span> {title}
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────
export function TabAuditoria({ clientData }: Props) {
  const { connectedAccounts } = useAppStore()
  const [audit,      setAudit]      = useState<Record<string, any> | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [error,      setError]      = useState('')
  const [source,     setSource]     = useState<'ai' | 'benchmark' | null>(null)
  const [dragOver,   setDragOver]   = useState(false)

  // Dados parseados do arquivo
  const [uploadedFile,    setUploadedFile]    = useState<File | null>(null)
  const [uploadedRows,    setUploadedRows]    = useState<any[]>([])
  const [uploadedPlatform, setUploadedPlatform] = useState<'meta' | 'google' | 'unknown'>('unknown')
  const [parseError,      setParseError]      = useState('')

  const fileRef = useRef<HTMLInputElement>(null)

  const metaAccount   = connectedAccounts.find((a) => a.platform === 'meta')
  const googleAccount = connectedAccounts.find((a) => a.platform === 'google')
  const hasConnections = !!(metaAccount || googleAccount)
  const hasUpload      = uploadedRows.length > 0
  const canAudit       = (hasConnections || hasUpload) && !!clientData

  // ── Parse de arquivo ────────────────────────────────────────────────────────
  const parseFile = useCallback(async (file: File) => {
    setParseError('')
    const name = file.name.toLowerCase()

    try {
      if (name.endsWith('.csv')) {
        const text = await file.text()
        const lines = text.split('\n').filter(Boolean)
        const sep = lines[0].includes(';') ? ';' : ','
        const headers = lines[0].split(sep).map((h) => h.replace(/"/g, '').trim())
        const platform = detectPlatform(headers)
        const rows = lines.slice(1).map((line) => {
          const vals = line.split(sep).map((v) => v.replace(/"/g, '').trim())
          const obj: Record<string, string> = {}
          headers.forEach((h, i) => { obj[h] = vals[i] || '' })
          return normalizeRow(obj)
        }).filter((r) => r.name)

        setUploadedRows(rows)
        setUploadedPlatform(platform)
        setUploadedFile(file)

      } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        const buf = await file.arrayBuffer()
        const { read, utils } = await import('xlsx')
        const wb = read(buf)
        const ws = wb.Sheets[wb.SheetNames[0]]
        const json: Record<string, string>[] = utils.sheet_to_json(ws, { defval: '' })
        const headers = json.length > 0 ? Object.keys(json[0]) : []
        const platform = detectPlatform(headers)
        const rows = json.map(normalizeRow).filter((r) => r.name)

        setUploadedRows(rows)
        setUploadedPlatform(platform)
        setUploadedFile(file)

      } else {
        setParseError('Formato inválido. Use arquivos .xlsx, .xls ou .csv')
      }
    } catch (e: any) {
      setParseError('Erro ao ler o arquivo. Verifique se está em formato CSV ou XLSX válido.')
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) parseFile(file)
  }, [parseFile])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) parseFile(file)
  }

  // ── Auditoria ───────────────────────────────────────────────────────────────
  const handleAudit = async () => {
    if (!clientData) return
    setLoading(true)
    setError('')
    setAudit(null)

    try {
      // Dados de contas conectadas em paralelo (se existirem)
      const [metaResult, googleResult] = await Promise.all([
        metaAccount?.accessToken && metaAccount?.accountId
          ? fetch('/api/ads-data/meta', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ accessToken: metaAccount.accessToken, accountId: metaAccount.accountId }),
            }).then((r) => r.json()).catch(() => null)
          : Promise.resolve(null),

        googleAccount?.accessToken && googleAccount?.accountId
          ? fetch('/api/ads-data/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ accessToken: googleAccount.accessToken, accountId: googleAccount.accountId }),
            }).then((r) => r.json()).catch(() => null)
          : Promise.resolve(null),
      ])

      // Envia para a IA auditar (inclui dados do arquivo se houver)
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName:       clientData.clientName,
          niche:            clientData.niche,
          budget:           clientData.budget,
          objective:        clientData.objective,
          metaCampaigns:    metaResult?.campaigns   || [],
          metaTotals:       metaResult?.totals      || null,
          googleCampaigns:  googleResult?.campaigns || [],
          googleTotals:     googleResult?.totals    || null,
          uploadedCampaigns: hasUpload ? uploadedRows : [],
          uploadedPlatform:  hasUpload ? uploadedPlatform : null,
        }),
      })

      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setAudit(json.audit)
      setSource(json.source)

    } catch (e: any) {
      setError(e.message || 'Erro ao gerar auditoria.')
    } finally {
      setLoading(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-white mb-1">Auditoria de Campanhas</h2>
          <p className="text-slate-500 text-sm">
            Análise completa com IA — conecte contas ou importe um relatório XLSX / CSV.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
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
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Auditando...
                </>
              ) : '🔍 Iniciar Auditoria'}
            </button>
          </div>
          {audit && (
            <span className="text-[10px] text-slate-600">
              {source === 'ai' ? '⚡ Gerado por IA' : '📊 Gerado por benchmark'}
            </span>
          )}
        </div>
      </div>

      {/* Status das fontes de dados */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Meta Ads',   icon: '📘', acc: metaAccount,   type: 'connection' as const },
          { label: 'Google Ads', icon: '🔴', acc: googleAccount, type: 'connection' as const },
          { label: 'Arquivo importado', icon: '📄', acc: hasUpload ? { accountName: uploadedFile?.name } : null, type: 'upload' as const },
        ].map(({ label, icon, acc, type }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-xl p-3 border"
            style={{
              background: acc ? 'rgba(34,197,94,0.04)' : 'rgba(255,77,77,0.04)',
              borderColor: acc ? 'rgba(34,197,94,0.2)' : 'rgba(255,77,77,0.15)',
            }}
          >
            <span className="text-xl">{icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white">{label}</div>
              <div className="text-[10px] truncate" style={{ color: acc ? '#22C55E' : '#666' }}>
                {type === 'upload'
                  ? (hasUpload ? `${uploadedRows.length} campanhas · ${uploadedPlatform !== 'unknown' ? uploadedPlatform : 'formato auto'}` : 'Nenhum arquivo')
                  : (acc ? (acc as any).accountName || 'Conectado' : 'Não conectado')}
              </div>
            </div>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: acc ? '#22C55E' : '#2A2A30' }} />
          </div>
        ))}
      </div>

      {/* Upload zone */}
      <div
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${dragOver ? 'border-[#F0B429] bg-[#F0B42908]' : 'border-[#2A2A30] hover:border-[#3A3A45]'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleFileInput}
        />
        {hasUpload ? (
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl">✅</span>
            <div className="text-left">
              <div className="text-sm font-semibold text-white">{uploadedFile?.name}</div>
              <div className="text-xs text-slate-500">
                {uploadedRows.length} campanhas encontradas ·{' '}
                {uploadedPlatform !== 'unknown' ? uploadedPlatform.charAt(0).toUpperCase() + uploadedPlatform.slice(1) + ' Ads detectado' : 'Plataforma detectada automaticamente'}
              </div>
            </div>
            <button
              className="ml-4 text-xs text-slate-600 hover:text-red-400 transition-colors"
              onClick={(e) => { e.stopPropagation(); setUploadedRows([]); setUploadedFile(null); setParseError('') }}
            >
              Remover
            </button>
          </div>
        ) : (
          <>
            <div className="text-3xl mb-2 opacity-40">📂</div>
            <div className="text-sm text-slate-400 mb-1">
              Arraste seu relatório aqui ou <span className="text-[#F0B429]">clique para importar</span>
            </div>
            <div className="text-xs text-slate-600">
              Suporte para exportações do Meta Ads (Gerenciador de Anúncios) e Google Ads · XLSX ou CSV
            </div>
          </>
        )}
      </div>

      {parseError && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">{parseError}</div>
      )}

      {/* Hint se não tem nenhuma fonte */}
      {!canAudit && !loading && (
        <div className="flex flex-col items-center justify-center py-10 text-center bg-[#111114] border border-[#2A2A30] rounded-2xl">
          <div className="text-4xl mb-3 opacity-30">🔍</div>
          <div className="font-display text-base font-bold text-white mb-1">Nenhuma fonte de dados</div>
          <p className="text-slate-500 text-xs max-w-sm">
            Conecte sua conta Meta Ads / Google Ads na aba <strong className="text-slate-300">Conexões</strong>, ou importe um relatório exportado das plataformas acima.
          </p>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-[#2A2A30] rounded w-1/3 mb-3" />
              <div className="h-3 bg-[#2A2A30] rounded w-2/3 mb-2" />
              <div className="h-3 bg-[#2A2A30] rounded w-1/2" />
            </div>
          ))}
          <div className="text-center text-xs text-slate-600 py-2">Analisando campanhas com IA e benchmarks do nicho...</div>
        </div>
      )}

      {/* ──────────────────────── RESULTADO DA AUDITORIA ──────────────────── */}
      {audit && !loading && (
        <div className="space-y-5 animate-fade-up">

          {/* Score + grade + resumo */}
          <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Score de Saúde</div>
                <div className="font-display text-5xl font-bold" style={{ color: gradeColor[audit.grade] || '#F0B429' }}>
                  {audit.health_score}
                  <span className="text-2xl text-slate-500">/100</span>
                  <span className="text-3xl ml-3">{audit.grade}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 mb-1">Verba estimada em desperdício</div>
                <div className="font-display text-2xl font-bold text-[#FF4D4D]">{fmt(audit.wasted_spend?.estimated || 0)}</div>
                <div className="text-xs text-slate-600">{audit.wasted_spend?.percentage || 0}% do gasto total</div>
              </div>
            </div>
            <div className="w-full h-2.5 bg-[#1E1E24] rounded-full overflow-hidden mb-4">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${audit.health_score}%`, background: `linear-gradient(90deg, ${gradeColor[audit.grade] || '#F0B429'}, ${gradeColor[audit.grade] || '#F0B429'}88)` }} />
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{audit.summary}</p>
          </div>

          {/* ── ONDE DESPERDIÇOU ── */}
          {audit.wasted_spend?.main_causes?.length > 0 && (
            <div className="bg-[#111114] border border-[#FF4D4D]/20 rounded-2xl p-5">
              <SectionTitle icon="🚨" title="Onde Você Desperdiçou Dinheiro" color="#FF4D4D" />
              <div className="space-y-2">
                {audit.wasted_spend.main_causes.map((c: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="text-[#FF4D4D] flex-shrink-0 mt-0.5">→</span>{c}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── AÇÕES URGENTES ── */}
          {audit.urgent_actions?.length > 0 && (
            <div className="bg-[#111114] border border-[#FF4D4D]/30 rounded-2xl p-5">
              <SectionTitle icon="⚠️" title="O Que Precisa Ser Feito URGENTE" color="#FF4D4D" />
              <div className="space-y-2">
                {audit.urgent_actions.map((action: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#FF4D4D] text-black text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-slate-300">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ALOCAÇÃO DE BUDGET ── */}
          {(audit.budget_add?.length > 0 || audit.budget_remove?.length > 0) && (
            <div className="grid md:grid-cols-2 gap-4">
              {audit.budget_add?.length > 0 && (
                <div className="bg-[#111114] border border-[#22C55E]/20 rounded-2xl p-5">
                  <SectionTitle icon="📈" title="Onde Colocar Mais Verba" color="#22C55E" />
                  <div className="space-y-2">
                    {audit.budget_add.map((item: any, i: number) => (
                      <div key={i} className="rounded-xl p-3 bg-[#16161A] border border-[#22C55E]/10">
                        <div className="text-sm font-semibold text-white mb-0.5">{item.channel || item.campaign}</div>
                        <div className="text-xs text-[#22C55E]">{item.reason}</div>
                        {item.amount && <div className="text-xs text-slate-500 mt-0.5">{item.amount}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {audit.budget_remove?.length > 0 && (
                <div className="bg-[#111114] border border-[#FF4D4D]/20 rounded-2xl p-5">
                  <SectionTitle icon="📉" title="Onde Tirar o Dinheiro" color="#FF4D4D" />
                  <div className="space-y-2">
                    {audit.budget_remove.map((item: any, i: number) => (
                      <div key={i} className="rounded-xl p-3 bg-[#16161A] border border-[#FF4D4D]/10">
                        <div className="text-sm font-semibold text-white mb-0.5">{item.channel || item.campaign}</div>
                        <div className="text-xs text-[#FF4D4D]">{item.reason}</div>
                        {item.amount && <div className="text-xs text-slate-500 mt-0.5">{item.amount}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ONDE INVESTIR ── */}
          {audit.investment_map?.length > 0 && (
            <div className="bg-[#111114] border border-[#F0B429]/20 rounded-2xl p-5">
              <SectionTitle icon="💡" title="Onde e Quanto Investir" color="#F0B429" />
              <div className="grid md:grid-cols-2 gap-3">
                {audit.investment_map.map((item: any, i: number) => (
                  <div key={i} className="bg-[#16161A] rounded-xl p-4 border border-[#2A2A30]">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="text-sm font-semibold text-white">{item.channel}</div>
                      {item.allocation && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F0B42918] text-[#F0B429] border border-[#F0B42930] flex-shrink-0">
                          {item.allocation}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mb-1">{item.reason}</div>
                    {item.expected_cpl && (
                      <div className="text-xs text-[#22C55E]">CPL esperado: {item.expected_cpl}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PROBLEMAS IDENTIFICADOS ── */}
          {audit.critical_issues?.length > 0 && (
            <div className="space-y-3">
              <div className="font-display font-bold text-white text-sm uppercase tracking-wider">Problemas Identificados</div>
              {audit.critical_issues.map((issue: any, i: number) => {
                const color = severityColor[issue.severity] || '#F0B429'
                return (
                  <div key={i} className="rounded-xl p-4 border" style={{ background: `${color}08`, borderColor: `${color}30` }}>
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="font-semibold text-sm text-white">{issue.issue}</div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 capitalize"
                        style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}>
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{issue.detail}</p>
                    <div className="flex items-start gap-1.5 text-xs" style={{ color }}>
                      <span className="flex-shrink-0 mt-0.5">⚡</span>{issue.action}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── RANKING DE CAMPANHAS ── */}
          {audit.campaign_ranking && (
            <div className="bg-[#111114] border border-[#A78BFA]/20 rounded-2xl p-5">
              <SectionTitle icon="🏆" title="Ranking de Campanhas" color="#A78BFA" />
              <div className="space-y-3">

                {audit.campaign_ranking.best_campaign && (
                  <div className="bg-[#16161A] border border-[#22C55E]/20 rounded-xl p-4">
                    <div className="text-[10px] text-[#22C55E] uppercase tracking-widest mb-1 font-bold">Melhor Campanha</div>
                    <div className="text-sm font-semibold text-white mb-1">{audit.campaign_ranking.best_campaign.name}</div>
                    <div className="text-xs text-slate-400">{audit.campaign_ranking.best_campaign.reason}</div>
                    {audit.campaign_ranking.best_campaign.metrics && (
                      <div className="flex gap-3 mt-2 flex-wrap">
                        {Object.entries(audit.campaign_ranking.best_campaign.metrics).map(([k, v]) => (
                          <span key={k} className="text-[10px] text-slate-500 bg-[#2A2A30] px-2 py-0.5 rounded-full">{k}: {String(v)}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {audit.campaign_ranking.best_ad && (
                  <div className="bg-[#16161A] border border-[#38BDF8]/20 rounded-xl p-4">
                    <div className="text-[10px] text-[#38BDF8] uppercase tracking-widest mb-1 font-bold">Melhor Anúncio</div>
                    <div className="text-sm font-semibold text-white mb-1">{audit.campaign_ranking.best_ad.name}</div>
                    <div className="text-xs text-slate-400">{audit.campaign_ranking.best_ad.reason}</div>
                  </div>
                )}

                {audit.campaign_ranking.best_placement && (
                  <div className="bg-[#16161A] border border-[#F0B429]/20 rounded-xl p-4">
                    <div className="text-[10px] text-[#F0B429] uppercase tracking-widest mb-1 font-bold">Melhor Posicionamento</div>
                    <div className="text-sm font-semibold text-white mb-1">{audit.campaign_ranking.best_placement.name}</div>
                    <div className="text-xs text-slate-400">{audit.campaign_ranking.best_placement.reason}</div>
                  </div>
                )}

                {audit.campaign_ranking.worst_campaigns?.length > 0 && (
                  <div className="bg-[#16161A] border border-[#FF4D4D]/10 rounded-xl p-4">
                    <div className="text-[10px] text-[#FF4D4D] uppercase tracking-widest mb-2 font-bold">Campanhas para Pausar</div>
                    <div className="space-y-1.5">
                      {audit.campaign_ranking.worst_campaigns.map((c: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                          <span className="text-[#FF4D4D] flex-shrink-0">×</span>
                          <span><strong className="text-white">{c.name}</strong> — {c.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── CUSTO POR RESULTADO ── */}
          {audit.cpr_assessment?.length > 0 && (
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
              <SectionTitle icon="📊" title={`Custo por Resultado vs Benchmark (${clientData?.niche})`} color="#F0B429" />
              <div className="space-y-2">
                {audit.cpr_assessment.map((item: any, i: number) => {
                  const isGood = item.status === 'bom' || item.status === 'ok'
                  const isBad  = item.status === 'crítico' || item.status === 'alto'
                  const color  = isGood ? '#22C55E' : isBad ? '#FF4D4D' : '#F0B429'
                  return (
                    <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[#1A1A1F] last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white font-medium truncate">{item.campaign}</div>
                        <div className="text-xs text-slate-500">{item.detail}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold" style={{ color }}>R${item.cpl}</div>
                        <div className="text-[10px]" style={{ color }}>
                          {isGood ? '✓ Bom' : isBad ? '✗ Alto' : '~ Atenção'}
                        </div>
                      </div>
                      <div
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full capitalize flex-shrink-0"
                        style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}
                      >
                        {item.vs_benchmark}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── O QUE MELHORAR ── */}
          {audit.quick_wins?.length > 0 && (
            <div className="bg-[#111114] border border-[#22C55E]/20 rounded-2xl p-5">
              <SectionTitle icon="🚀" title="O Que Pode Melhorar" color="#22C55E" />
              <div className="grid md:grid-cols-2 gap-3">
                {audit.quick_wins.map((win: any, i: number) => (
                  <div key={i} className="bg-[#16161A] rounded-xl p-4 border border-[#2A2A30]">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="font-semibold text-sm text-white">{win.title}</div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{
                            color: win.impact === 'Alto' ? '#22C55E' : win.impact === 'Médio' ? '#F0B429' : '#94A3B8',
                            background: win.impact === 'Alto' ? 'rgba(34,197,94,0.1)' : win.impact === 'Médio' ? 'rgba(240,180,41,0.1)' : 'rgba(148,163,184,0.1)',
                          }}>
                          {win.impact}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-slate-500 bg-[#2A2A30]">Esforço {win.effort}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{win.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── POR PLATAFORMA ── */}
          <div className="grid md:grid-cols-2 gap-4">
            {audit.meta_analysis && (
              <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-display font-bold text-white flex items-center gap-2"><span>📘</span> Meta Ads</div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                    style={{ color: statusColor[audit.meta_analysis.status] || '#F0B429', background: `${statusColor[audit.meta_analysis.status] || '#F0B429'}18`, border: `1px solid ${statusColor[audit.meta_analysis.status] || '#F0B429'}30` }}>
                    {audit.meta_analysis.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center"><div className="text-[10px] text-slate-500 mb-0.5">Gasto</div><div className="text-sm font-bold text-white">{fmt(audit.meta_analysis.spend)}</div></div>
                  <div className="text-center"><div className="text-[10px] text-slate-500 mb-0.5">CPL</div><div className="text-sm font-bold text-white">R${audit.meta_analysis.cpl}</div></div>
                  <div className="text-center"><div className="text-[10px] text-slate-500 mb-0.5">Leads</div><div className="text-sm font-bold text-white">{audit.meta_analysis.leads}</div></div>
                </div>
                <div className="space-y-1.5">
                  {(audit.meta_analysis.insights || []).map((ins: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                      <span className="text-[#38BDF8] flex-shrink-0 mt-0.5">→</span>{ins}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {audit.google_analysis && (
              <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-display font-bold text-white flex items-center gap-2"><span>🔴</span> Google Ads</div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                    style={{ color: statusColor[audit.google_analysis.status] || '#F0B429', background: `${statusColor[audit.google_analysis.status] || '#F0B429'}18`, border: `1px solid ${statusColor[audit.google_analysis.status] || '#F0B429'}30` }}>
                    {audit.google_analysis.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center"><div className="text-[10px] text-slate-500 mb-0.5">Gasto</div><div className="text-sm font-bold text-white">{fmt(audit.google_analysis.spend)}</div></div>
                  <div className="text-center"><div className="text-[10px] text-slate-500 mb-0.5">CPL</div><div className="text-sm font-bold text-white">R${audit.google_analysis.cpl}</div></div>
                  <div className="text-center"><div className="text-[10px] text-slate-500 mb-0.5">Leads</div><div className="text-sm font-bold text-white">{audit.google_analysis.leads}</div></div>
                </div>
                <div className="space-y-1.5">
                  {(audit.google_analysis.insights || []).map((ins: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                      <span className="text-[#38BDF8] flex-shrink-0 mt-0.5">→</span>{ins}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── BENCHMARK ── */}
          {audit.benchmark && (
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
              <div className="font-display font-bold text-white mb-4">📊 Benchmark do Nicho ({clientData?.niche})</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <MetricCard label="CPL mín. nicho" value={`R$${audit.benchmark.cpl_min}`}   color="#22C55E" />
                <MetricCard label="CPL máx. nicho" value={`R$${audit.benchmark.cpl_max}`}   color="#F0B429" />
                <MetricCard label="ROAS bom"        value={`${audit.benchmark.roas_good}×`}  color="#A78BFA" />
                <MetricCard label="Melhores canais" value={audit.benchmark.best_channels?.slice(0, 2).join(', ')} color="#38BDF8" />
              </div>
              {audit.benchmark.insights?.length > 0 && (
                <div className="space-y-1.5 border-t border-[#2A2A30] pt-4">
                  {audit.benchmark.insights.map((ins: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                      <span className="text-[#F0B429] flex-shrink-0 mt-0.5">→</span>{ins}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── RECOMENDAÇÕES ── */}
          {audit.recommendations?.length > 0 && (
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
              <SectionTitle icon="⚡" title="Recomendações Priorizadas" color="#F0B429" />
              <div className="space-y-3">
                {audit.recommendations.map((rec: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-[#16161A] rounded-xl">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                      style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)', color: '#000' }}>
                      {rec.priority}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="text-sm font-semibold text-white">{rec.action}</div>
                        <span className="text-[10px] text-slate-500 flex-shrink-0 bg-[#2A2A30] px-1.5 py-0.5 rounded-full">{rec.channel}</span>
                      </div>
                      <div className="text-xs text-[#22C55E]">→ {rec.expected_result}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-center text-xs text-slate-700 pb-2">
            Auditoria gerada em {new Date(audit.generated_at).toLocaleString('pt-BR')}
          </div>
        </div>
      )}
    </div>
  )
}
