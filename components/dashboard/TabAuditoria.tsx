// components/dashboard/TabAuditoria.tsx — Auditoria sênior nível consultor premium (11 seções)
'use client'

import { useState, useRef, useCallback } from 'react'
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
function normalizeRow(row: Record<string, string>): Record<string, any> {
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const found = Object.entries(row).find(([col]) => col.toLowerCase().includes(k.toLowerCase()))
      if (found) return found[1]
    }
    return ''
  }
  const parseNum = (v: string) => {
    if (!v) return 0
    const clean = String(v).replace(/[R$\s%×x]/g, '').replace(/\./g, '').replace(',', '.')
    return parseFloat(clean) || 0
  }
  const name      = get('campanha', 'campaign', 'conjunto', 'ad set', 'anúncio', 'ad name', 'nome')
  const status    = get('status', 'situação')
  const spend     = parseNum(get('valor usado', 'gasto', 'spend', 'custo', 'cost', 'investimento'))
  const impr      = parseNum(get('impressões', 'impressions', 'impr'))
  const clicks    = parseNum(get('cliques', 'clicks', 'clique'))
  const ctr       = parseNum(get('ctr', 'taxa de cliques'))
  const leads     = parseNum(get('leads', 'resultados', 'conversões', 'conversions', 'result'))
  const cpl       = parseNum(get('custo por lead', 'custo por resultado', 'cost per result', 'cpl'))
  const roas      = parseNum(get('roas', 'retorno'))
  const frequency = parseNum(get('frequência', 'frequency', 'freq'))
  const placement = get('posicionamento', 'placement', 'posição', 'device')
  const adName    = get('nome do anúncio', 'anúncio', 'ad name', 'creative')
  return { name, status, spend, impressions: impr, clicks, ctr, leads, cpl, roas, frequency, placement, adName }
}

function detectPlatform(headers: string[]): 'meta' | 'google' | 'unknown' {
  const h = headers.join(' ').toLowerCase()
  if (h.includes('valor usado') || h.includes('conjunto de anúncios') || h.includes('ad set') || h.includes('facebook') || h.includes('meta')) return 'meta'
  if (h.includes('campaign type') || h.includes('avg. cpc') || h.includes('google') || h.includes('keyword')) return 'google'
  return 'unknown'
}

interface UploadedFile {
  file: File
  campaigns: any[]
  platform: 'meta' | 'google' | 'unknown'
  rowCount: number
}

// ─── Componente principal ────────────────────────────────────────────────────
export function TabAuditoria({ clientData }: Props) {
  const { connectedAccounts } = useAppStore()
  const [audit,       setAudit]       = useState<Record<string, any> | null>(null)
  const [loading,     setLoading]     = useState(false)
  const [pdfLoading,  setPdfLoading]  = useState(false)
  const [error,       setError]       = useState('')
  const [source,      setSource]      = useState<'ai' | 'benchmark' | null>(null)
  const [dragOver,    setDragOver]    = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [parseError,  setParseError]  = useState('')
  const [activeAction, setActiveAction] = useState<'curto' | 'medio' | 'longo'>('curto')

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
        const text = await file.text()
        const lines = text.split('\n').filter(Boolean)
        const sep = lines[0].includes(';') ? ';' : ','
        const headers = lines[0].split(sep).map(h => h.replace(/"/g, '').trim())
        platform = detectPlatform(headers)
        campaigns = lines.slice(1).map(line => {
          const vals = line.split(sep).map(v => v.replace(/"/g, '').trim())
          const obj: Record<string, string> = {}
          headers.forEach((h, i) => { obj[h] = vals[i] || '' })
          return normalizeRow(obj)
        }).filter(r => r.name && r.name.trim())

      } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        const buf = await file.arrayBuffer()
        const { read, utils } = await import('xlsx')
        const wb = read(buf)
        const ws = wb.Sheets[wb.SheetNames[0]]
        const json: Record<string, string>[] = utils.sheet_to_json(ws, { defval: '' })
        const headers = json.length > 0 ? Object.keys(json[0]) : []
        platform = detectPlatform(headers)
        campaigns = json.map(normalizeRow).filter(r => r.name && r.name.trim())

      } else {
        setParseError('Formato inválido. Use .xlsx, .xls ou .csv')
        return
      }

      const newFile: UploadedFile = { file, campaigns, platform, rowCount: campaigns.length }
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
            {uploadedFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-3 bg-[#111114] border border-[#22C55E]/20 rounded-xl px-4 py-2.5">
                <span className="text-[#22C55E] text-sm">✓</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-white truncate block">{f.file.name}</span>
                  <span className="text-[10px] text-slate-500">
                    {f.rowCount} campanhas ·{' '}
                    {f.platform !== 'unknown' ? `${f.platform.charAt(0).toUpperCase()}${f.platform.slice(1)} Ads detectado` : 'Plataforma auto'}
                  </span>
                </div>
                <button onClick={() => removeFile(i)} className="text-slate-600 hover:text-[#FF4D4D] text-sm transition-colors">✕</button>
              </div>
            ))}
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

      {error && <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>}

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
