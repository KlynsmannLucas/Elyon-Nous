// components/dashboard/TabAssets.tsx — Assets da empresa com persistência Supabase Storage
'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import type { ClientData } from '@/lib/store'
import CreativeVisionPanel from './CreativeVisionPanel'

interface Props { clientData: ClientData | null }

interface CopyVariant {
  headline: string
  primaryText: string
  cta: string
  angle: string
}

// Asset shape que espelha a linha da tabela client_assets
interface DBAsset {
  id: string
  type: 'logo' | 'product' | 'lifestyle' | 'banner' | 'other'
  name: string
  public_url: string
  mime_type: string
  size_kb: number
  uploaded_at: string
}

const ASSET_TYPES = [
  { key: 'logo'      as const, label: 'Logo',             color: '#2C5FE0' },
  { key: 'product'   as const, label: 'Produto',          color: '#2C5FE0' },
  { key: 'lifestyle' as const, label: 'Lifestyle',        color: '#0E9E6E' },
  { key: 'banner'    as const, label: 'Banner / Criativo', color: '#E08B0B' },
  { key: 'other'     as const, label: 'Outros',           color: '#8A93A3' },
]

const TYPE_ICON: Record<string, JSX.Element> = {
  logo: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
    </svg>
  ),
  product: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    </svg>
  ),
  lifestyle: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  banner: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  other: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
}

const UPLOAD_ICON = (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
)

const TRASH_ICON = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)

const EYE_ICON = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)

function formatSize(kb: number) {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })
}

export function TabAssets({ clientData }: Props) {
  const [assets,       setAssets]       = useState<DBAsset[]>([])
  const [loading,      setLoading]      = useState(false)
  const [loadError,    setLoadError]    = useState('')
  const [selectedType, setSelectedType] = useState<DBAsset['type']>('logo')
  const [dragOver,     setDragOver]     = useState(false)
  const [uploading,    setUploading]    = useState(false)
  const [uploadError,  setUploadError]  = useState('')
  const [filterType,   setFilterType]   = useState<DBAsset['type'] | 'all'>('all')
  const [search,       setSearch]       = useState('')
  const [preview,      setPreview]      = useState<DBAsset | null>(null)
  const [deleting,     setDeleting]     = useState<string | null>(null)

  // Copy generation
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null)
  const [generating,    setGenerating]    = useState(false)
  const [variants,      setVariants]      = useState<CopyVariant[]>([])
  const [copyError,     setCopyError]     = useState('')
  const [copied,        setCopied]        = useState<string | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)

  // ── Carrega assets do banco ──────────────────────────────────────────────────
  const loadAssets = useCallback(async () => {
    if (!clientData?.clientName) return
    setLoading(true)
    setLoadError('')
    try {
      const res = await fetch(`/api/assets/list?clientName=${encodeURIComponent(clientData.clientName)}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao carregar assets')
      setAssets(json.assets || [])
    } catch (e: any) {
      setLoadError(e.message)
    } finally {
      setLoading(false)
    }
  }, [clientData?.clientName])

  useEffect(() => { loadAssets() }, [loadAssets])

  // ── Upload de arquivos ───────────────────────────────────────────────────────
  const handleFiles = async (files: FileList | null) => {
    if (!files || !clientData?.clientName) return
    setUploading(true)
    setUploadError('')
    const errors: string[] = []

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        errors.push(`${file.name}: apenas imagens são aceitas`)
        continue
      }
      if (file.size > 5 * 1024 * 1024) {
        errors.push(`${file.name} excede 5 MB`)
        continue
      }
      try {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('clientName', clientData.clientName)
        fd.append('type', selectedType)

        const res  = await fetch('/api/assets/save', { method: 'POST', body: fd })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Erro no upload')

        setAssets(prev => [json.asset, ...prev])
        // Log do upload
        fetch('/api/logs', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ module: 'assets', action: 'upload', clientName: clientData.clientName,
            detail: `Upload: ${file.name} (${selectedType})`, metadata: { name: file.name, type: selectedType, sizeKb: Math.round(file.size / 1024) } }) }).catch(() => {})
      } catch (e: any) {
        errors.push(`${file.name}: ${e.message}`)
      }
    }
    if (errors.length) setUploadError(errors.join(' · '))
    setUploading(false)
    // Limpa o input para permitir re-upload do mesmo arquivo
    if (fileRef.current) fileRef.current.value = ''
  }

  // ── Exclusão ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const res = await fetch(`/api/assets/delete?id=${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error)
      }
      setAssets(prev => prev.filter(a => a.id !== id))
      if (activeAssetId === id) { setActiveAssetId(null); setVariants([]) }
      // Log da exclusão
      fetch('/api/logs', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'assets', action: 'delete', clientName: clientData?.clientName,
          detail: `Asset excluído`, metadata: { id } }) }).catch(() => {})
    } catch (e: any) {
      alert(`Erro ao excluir: ${e.message}`)
    } finally {
      setDeleting(null)
    }
  }

  // ── Gerar copy com IA ────────────────────────────────────────────────────────
  const generateCopy = async (asset: DBAsset) => {
    if (!clientData) return
    setActiveAssetId(asset.id)
    setGenerating(true)
    setCopyError('')
    setVariants([])
    try {
      const res = await fetch('/api/assets/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientData,
          assetType: asset.type,
          assetName: asset.name,
          platform: 'meta',
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setVariants(data.variants || [])
    } catch (e: any) {
      setCopyError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  // ── Filtros ──────────────────────────────────────────────────────────────────
  const visibleAssets = assets.filter(a => {
    const matchType   = filterType === 'all' || a.type === filterType
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const countByType = (type: DBAsset['type']) => assets.filter(a => a.type === type).length

  // ── Design tokens ────────────────────────────────────────────────────────────
  const S = {
    bg:       '#050B1A',
    surface:  '#0C1426',
    elevated: '#111D33',
    border:   'rgba(255,255,255,0.06)',
    borderHi: 'rgba(124,58,237,0.35)',
    purple:   '#2C5FE0',
    purpleHi: '#2C5FE0',
    purpleBg: 'rgba(124,58,237,0.08)',
    text1:    '#161B26',
    text2:    '#5A6473',
    text3:    'rgba(255,255,255,0.32)',
    amber:    '#E08B0B',
    green:    '#0E9E6E',
    red:      '#E1483F',
  }

  if (!clientData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: S.text3, fontSize: '13px' }}>
        Configure um cliente primeiro para gerenciar os assets.
      </div>
    )
  }

  return (
    <>
      {/* ── Modal de preview ─────────────────────────────────────────────────── */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '100%', borderRadius: '16px', overflow: 'hidden', background: S.surface, border: `1px solid ${S.borderHi}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${S.border}` }}>
              <span style={{ fontSize: '13px', color: S.text1, fontWeight: 600 }}>{preview.name}</span>
              <button onClick={() => setPreview(null)} style={{ background: 'none', border: 'none', color: S.text2, cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ background: '#F4F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', padding: '24px' }}>
              <img src={preview.public_url} alt={preview.name} style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: '8px' }} />
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '960px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── Cabeçalho ───────────────────────────────────────────────────────── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: S.text3, marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
            <span>Arquivos da Empresa</span>
            <span>›</span>
            <span style={{ color: S.purpleHi }}>{clientData.clientName}</span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: S.text1, margin: 0, marginBottom: '4px', letterSpacing: '-0.02em' }}>
            Assets da Empresa
          </h2>
          <p style={{ fontSize: '13px', color: S.text2, margin: 0 }}>
            Logo, imagens e criativos de <strong style={{ color: S.text1 }}>{clientData.clientName}</strong> — usados para gerar anúncios automaticamente.
          </p>
        </div>

        {/* ── Análise visual com IA (Gemini) — aditivo, some se indisponível ────── */}
        <CreativeVisionPanel clientData={clientData} />

        {/* ── Banner de aviso ──────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '12px',
          padding: '12px 16px', borderRadius: '12px',
          background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)',
        }}>
          <svg style={{ flexShrink: 0, marginTop: '1px', color: S.amber }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
            <strong style={{ color: 'rgba(245,158,11,0.9)' }}>Assets salvos no banco de dados.</strong>
            {' '}Imagens são armazenadas de forma segura no Supabase Storage e ficam disponíveis em qualquer dispositivo. Faça backup dos arquivos originais fora do painel.
          </div>
        </div>

        {/* ── Erro de carregamento ─────────────────────────────────────────────── */}
        {loadError && (
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', fontSize: '12px', color: '#E1483F', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {loadError}
            <button onClick={loadAssets} style={{ marginLeft: 'auto', fontSize: '11px', color: '#E1483F', background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer' }}>Tentar novamente</button>
          </div>
        )}

        {/* ── Cards de resumo por categoria ────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
          {ASSET_TYPES.map(t => {
            const count    = countByType(t.key)
            const isActive = filterType === t.key
            return (
              <button
                key={t.key}
                onClick={() => setFilterType(isActive ? 'all' : t.key)}
                style={{
                  borderRadius: '12px', padding: '14px 10px', textAlign: 'center', cursor: 'pointer',
                  background: isActive ? `${t.color}10` : S.surface,
                  border: `1px solid ${isActive ? t.color + '40' : S.border}`,
                  transition: 'all 0.15s',
                  boxShadow: isActive ? `0 0 16px ${t.color}18` : 'none',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.border = `1px solid ${t.color}25`; e.currentTarget.style.background = `${t.color}06` } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.border = `1px solid ${S.border}`; e.currentTarget.style.background = S.surface } }}
              >
                <div style={{ color: t.color, display: 'flex', justifyContent: 'center', marginBottom: '6px', opacity: isActive ? 1 : 0.7 }}>
                  {TYPE_ICON[t.key]}
                </div>
                <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.color, marginBottom: '4px' }}>
                  {t.label}
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: S.text1, lineHeight: 1 }}>
                  {loading ? '·' : count}
                </div>
              </button>
            )
          })}
        </div>

        {/* ── Área de upload ───────────────────────────────────────────────────── */}
        <div style={{ borderRadius: '16px', padding: '20px', background: S.surface, border: `1px solid ${S.border}` }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: S.text3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', fontFamily: 'var(--font-mono)' }}>
            Tipo de Asset a Enviar
          </div>

          {/* Abas de tipo */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
            {ASSET_TYPES.map(t => (
              <button
                key={t.key}
                onClick={() => setSelectedType(t.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s',
                  background: selectedType === t.key ? `${t.color}14` : 'transparent',
                  border: `1px solid ${selectedType === t.key ? t.color + '50' : S.border}`,
                  color: selectedType === t.key ? t.color : S.text3,
                }}
              >
                <span style={{ color: 'inherit', display: 'flex', lineHeight: 0 }}>
                  {TYPE_ICON[t.key]}
                </span>
                {t.label}
              </button>
            ))}
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
            onClick={() => !uploading && fileRef.current?.click()}
            style={{
              borderRadius: '12px',
              border: `2px dashed ${dragOver ? S.purple : 'rgba(255,255,255,0.10)'}`,
              padding: '48px 24px',
              textAlign: 'center',
              cursor: uploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              background: dragOver ? S.purpleBg : 'transparent',
              boxShadow: dragOver ? `inset 0 0 40px ${S.purpleBg}` : 'none',
            }}
          >
            <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />

            <div style={{ color: dragOver ? S.purpleHi : S.text3, display: 'flex', justifyContent: 'center', marginBottom: '12px', transition: 'color 0.2s' }}>
              {uploading ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              ) : UPLOAD_ICON}
            </div>

            <div style={{ fontSize: '14px', fontWeight: 600, color: uploading ? S.text3 : S.text1, marginBottom: '4px' }}>
              {uploading ? 'Enviando para o banco de dados...' : 'Arraste imagens ou clique para selecionar'}
            </div>
            <div style={{ fontSize: '11px', color: S.text3 }}>
              PNG, JPG, SVG, WebP · máx 5 MB por arquivo · tipo:{' '}
              <span style={{ color: ASSET_TYPES.find(t => t.key === selectedType)?.color }}>
                {ASSET_TYPES.find(t => t.key === selectedType)?.label}
              </span>
            </div>
          </div>

          {/* Erro de upload */}
          {uploadError && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#E1483F', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '8px 12px' }}>
              {uploadError}
            </div>
          )}
        </div>

        {/* ── Galeria ──────────────────────────────────────────────────────────── */}
        {assets.length > 0 && (
          <div>
            {/* Toolbar de filtros e busca */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '160px' }}>
                <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: S.text3, pointerEvents: 'none' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por nome..."
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    paddingLeft: '30px', paddingRight: '12px', paddingTop: '7px', paddingBottom: '7px',
                    borderRadius: '8px', fontSize: '12px', color: S.text1,
                    background: S.surface, border: `1px solid ${S.border}`, outline: 'none',
                  }}
                />
              </div>
              <span style={{ fontSize: '11px', color: S.text3, whiteSpace: 'nowrap' }}>
                {visibleAssets.length} {filterType === 'all' ? `de ${assets.length}` : ''} assets
              </span>
              {filterType !== 'all' && (
                <button
                  onClick={() => setFilterType('all')}
                  style={{ fontSize: '11px', color: S.text3, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }}
                  onMouseEnter={e => e.currentTarget.style.color = S.text2}
                  onMouseLeave={e => e.currentTarget.style.color = S.text3}
                >
                  Ver todos ×
                </button>
              )}
            </div>

            {/* Grid de assets — 4 cols desktop, 2 tablet, 1 mobile */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: '14px',
            }}>
              {visibleAssets.map(asset => {
                const typeInfo = ASSET_TYPES.find(t => t.key === asset.type)!
                const isDeleting = deleting === asset.id
                return (
                  <div
                    key={asset.id}
                    style={{
                      borderRadius: '14px', overflow: 'hidden',
                      background: S.surface,
                      border: `1px solid ${activeAssetId === asset.id ? S.borderHi : S.border}`,
                      transition: 'all 0.15s',
                      opacity: isDeleting ? 0.5 : 1,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.border = `1px solid rgba(255,255,255,0.12)` }}
                    onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${activeAssetId === asset.id ? S.borderHi : S.border}` }}
                  >
                    {/* Thumbnail */}
                    <div style={{ position: 'relative', aspectRatio: '16/9', background: '#F4F5F7', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src={asset.public_url}
                        alt={asset.name}
                        style={{ objectFit: 'contain', width: '100%', height: '100%', padding: '8px', boxSizing: 'border-box' }}
                      />
                      {/* Tipo badge */}
                      <span style={{
                        position: 'absolute', top: '8px', left: '8px',
                        fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '6px',
                        background: `${typeInfo.color}18`, color: typeInfo.color, border: `1px solid ${typeInfo.color}28`,
                      }}>
                        {typeInfo.label}
                      </span>
                      {/* Botões de ação no hover */}
                      <div style={{
                        position: 'absolute', top: '8px', right: '8px',
                        display: 'flex', gap: '4px',
                      }}>
                        <button
                          onClick={() => setPreview(asset)}
                          title="Visualizar"
                          style={{
                            width: '26px', height: '26px', borderRadius: '8px', border: 'none',
                            background: 'rgba(15,22,41,0.85)', color: S.text2,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s', backdropFilter: 'blur(4px)',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = S.text1; e.currentTarget.style.background = 'rgba(15,22,41,0.98)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = S.text2; e.currentTarget.style.background = 'rgba(15,22,41,0.85)' }}
                        >{EYE_ICON}</button>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          disabled={isDeleting}
                          title="Excluir"
                          style={{
                            width: '26px', height: '26px', borderRadius: '8px', border: 'none',
                            background: 'rgba(15,22,41,0.85)', color: S.text2,
                            cursor: isDeleting ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s', backdropFilter: 'blur(4px)',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = S.red; e.currentTarget.style.background = 'rgba(239,68,68,0.15)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = S.text2; e.currentTarget.style.background = 'rgba(15,22,41,0.85)' }}
                        >{TRASH_ICON}</button>
                      </div>
                    </div>

                    {/* Info + botão IA */}
                    <div style={{ padding: '12px' }}>
                      <div style={{ fontSize: '12px', color: S.text1, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>
                        {asset.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '10px', color: S.text3 }}>{formatSize(asset.size_kb)}</span>
                        <span style={{ fontSize: '10px', color: S.text3 }}>{formatDate(asset.uploaded_at)}</span>
                      </div>
                      <button
                        onClick={() => generateCopy(asset)}
                        disabled={generating && activeAssetId === asset.id}
                        style={{
                          width: '100%', padding: '7px 0', borderRadius: '8px',
                          fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                          transition: 'opacity 0.15s',
                          background: 'linear-gradient(135deg, #2C5FE0, #2C5FE0)',
                          border: 'none', color: '#fff',
                          opacity: generating && activeAssetId === asset.id ? 0.5 : 1,
                        }}
                        onMouseEnter={e => { if (!(generating && activeAssetId === asset.id)) e.currentTarget.style.opacity = '0.85' }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = generating && activeAssetId === asset.id ? '0.5' : '1' }}
                      >
                        {generating && activeAssetId === asset.id ? '⏳ Gerando...' : '⚡ Gerar Copy com IA'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Sem resultados no filtro */}
            {visibleAssets.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: S.text3, fontSize: '13px' }}>
                Nenhum asset encontrado para o filtro atual.
              </div>
            )}

            {/* Copy generation results */}
            {activeAssetId && (variants.length > 0 || generating || copyError) && (
              <div style={{
                borderRadius: '14px', padding: '20px', marginTop: '20px',
                background: S.surface, border: `1px solid ${S.borderHi}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: S.text1, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ⚡ Copy gerada com IA
                    <span style={{ fontSize: '11px', color: S.text3, fontWeight: 400 }}>— pronta para usar no Meta Ads</span>
                  </h3>
                  <button onClick={() => { setActiveAssetId(null); setVariants([]) }} style={{ color: S.text3, fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer' }}>fechar ×</button>
                </div>

                {copyError && (
                  <div style={{ fontSize: '12px', color: S.red, background: 'rgba(239,68,68,0.1)', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px' }}>
                    {copyError}
                  </div>
                )}

                {generating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: S.text2, fontSize: '13px', padding: '12px 0' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    Analisando o asset e gerando 3 variações de copy para {clientData?.niche}...
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {variants.map((v, i) => {
                    const angleColors: Record<string, string> = { dor: '#E1483F', aspiração: '#2C5FE0', 'prova social': '#0E9E6E', urgência: '#E08B0B', oferta: '#2C5FE0' }
                    const ac = angleColors[v.angle] || '#8A93A3'
                    return (
                      <div key={i} style={{ borderRadius: '10px', padding: '16px', background: S.elevated, border: `1px solid ${S.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: `${ac}14`, color: ac, border: `1px solid ${ac}28` }}>{v.angle}</span>
                          <span style={{ fontSize: '10px', color: S.text3 }}>Variação {i + 1}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {[
                            { label: 'Headline', value: v.headline, key: `h-${i}`, bold: true },
                            { label: 'Texto Principal', value: v.primaryText, key: `p-${i}`, bold: false },
                          ].map(field => (
                            <div key={field.key} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '9px', color: S.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>{field.label}</div>
                                <div style={{ fontSize: field.bold ? '13px' : '11px', fontWeight: field.bold ? 700 : 400, color: field.bold ? S.text1 : S.text2, lineHeight: 1.6 }}>{field.value}</div>
                              </div>
                              <button
                                onClick={() => copyToClipboard(field.value, field.key)}
                                style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '6px', flexShrink: 0, cursor: 'pointer', transition: 'all 0.15s', background: copied === field.key ? 'rgba(34,197,94,0.10)' : 'rgba(255,255,255,0.04)', border: `1px solid ${copied === field.key ? 'rgba(34,197,94,0.25)' : S.border}`, color: copied === field.key ? S.green : S.text3 }}
                              >{copied === field.key ? '✓' : 'Copiar'}</button>
                            </div>
                          ))}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '4px' }}>
                            <span style={{ fontSize: '9px', color: S.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>CTA:</span>
                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 12px', borderRadius: '999px', background: S.purpleBg, color: S.purpleHi, border: `1px solid rgba(124,58,237,0.22)` }}>{v.cta}</span>
                            <button
                              onClick={() => copyToClipboard(`${v.headline}\n\n${v.primaryText}\n\nCTA: ${v.cta}`, `all-${i}`)}
                              style={{ marginLeft: 'auto', fontSize: '10px', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s', background: copied === `all-${i}` ? 'rgba(34,197,94,0.10)' : 'rgba(255,255,255,0.04)', border: `1px solid ${copied === `all-${i}` ? 'rgba(34,197,94,0.25)' : S.border}`, color: copied === `all-${i}` ? S.green : S.text3 }}
                            >{copied === `all-${i}` ? '✓ Copiado!' : 'Copiar tudo'}</button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Loading state ────────────────────────────────────────────────────── */}
        {loading && assets.length === 0 && (
          <div style={{ borderRadius: '14px', padding: '48px', textAlign: 'center', background: S.surface, border: `1px solid ${S.border}` }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={S.text3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            <div style={{ fontSize: '13px', color: S.text3 }}>Carregando assets do banco de dados...</div>
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────────────────────── */}
        {!loading && assets.length === 0 && !loadError && (
          <div style={{ borderRadius: '16px', padding: '56px 24px', textAlign: 'center', background: S.surface, border: `1px solid ${S.border}` }}>
            <div style={{ color: S.text3, display: 'flex', justifyContent: 'center', marginBottom: '16px', opacity: 0.4 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: S.text2, marginBottom: '6px' }}>Nenhum asset enviado ainda</div>
            <div style={{ fontSize: '12px', color: S.text3, maxWidth: '280px', margin: '0 auto', lineHeight: 1.6 }}>
              Envie logo, fotos de produto ou criativos para gerar copy com IA e acelerar a criação de anúncios.
            </div>
          </div>
        )}

        {/* ── Footer informativo ───────────────────────────────────────────────── */}
        <div style={{ borderRadius: '10px', padding: '10px 16px', fontSize: '12px', color: S.text2, background: S.purpleBg, border: `1px solid rgba(124,58,237,0.15)` }}>
          <span style={{ color: S.purpleHi, fontWeight: 600 }}>⚡ Como funciona:</span>{' '}
          Clique em "Gerar Copy com IA" em qualquer imagem. A IA cria 3 variações de headline + texto + CTA específicas para o nicho{clientData?.niche ? ` ${clientData.niche}` : ''} — prontas para colar no Meta Ads.
        </div>
      </div>

      {/* CSS animation para o spinner */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
