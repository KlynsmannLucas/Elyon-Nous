// components/dashboard/TabAssets.tsx — Biblioteca de assets da empresa (logo, imagens)
'use client'

import { useRef, useState } from 'react'
import { useAppStore } from '@/lib/store'
import type { ClientData, ClientAsset } from '@/lib/store'

interface Props { clientData: ClientData | null }

interface CopyVariant {
  headline: string
  primaryText: string
  cta: string
  angle: string
}

const ASSET_TYPES: Array<{ key: ClientAsset['type']; label: string; icon: string; desc: string }> = [
  { key: 'logo',      label: 'Logo',             icon: '🏷️', desc: 'Logotipo da marca (PNG/SVG com fundo transparente)' },
  { key: 'product',   label: 'Produto',           icon: '📦', desc: 'Foto do produto ou serviço' },
  { key: 'lifestyle', label: 'Lifestyle',         icon: '🌅', desc: 'Imagens de estilo de vida / ambiente' },
  { key: 'banner',    label: 'Banner / Criativo', icon: '🖼️', desc: 'Artes prontas para anúncio' },
  { key: 'other',     label: 'Outros',            icon: '📁', desc: 'Outros arquivos de marca' },
]

const TYPE_COLOR: Record<ClientAsset['type'], string> = {
  logo:      '#A78BFA',
  product:   '#38BDF8',
  lifestyle: '#22C55E',
  banner:    '#7C3AED',
  other:     '#64748B',
}

function formatSize(kb: number) {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`
}

export function TabAssets({ clientData }: Props) {
  const { clientAssets, addClientAsset, removeClientAsset, generatedPersona } = useAppStore()
  const [selectedType,  setSelectedType]  = useState<ClientAsset['type']>('logo')
  const [dragOver,      setDragOver]      = useState(false)
  const [uploading,     setUploading]     = useState(false)
  const [filterType,    setFilterType]    = useState<ClientAsset['type'] | 'all'>('all')
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null)
  const [generating,    setGenerating]    = useState(false)
  const [variants,      setVariants]      = useState<CopyVariant[]>([])
  const [copyError,     setCopyError]     = useState('')
  const [copied,        setCopied]        = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const generateCopy = async (asset: ClientAsset) => {
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
          persona: generatedPersona,
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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
  }

  const key    = clientData?.clientName || ''
  const assets = (clientAssets[key] || []).filter(a => filterType === 'all' || a.type === filterType)

  if (!clientData) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          color: '#64748B',
          fontSize: '13px',
        }}
      >
        Configure um cliente primeiro para gerenciar os assets.
      </div>
    )
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || !key) return
    setUploading(true)
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      const sizeKb = Math.round(file.size / 1024)
      if (sizeKb > 5120) { alert(`${file.name} excede 5 MB — reduza o tamanho.`); continue }
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      })
      addClientAsset(key, { type: selectedType, name: file.name, dataUrl, mimeType: file.type, sizeKb })
    }
    setUploading(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  const totalCount = (clientAssets[key] || []).length
  const byType = ASSET_TYPES.map(t => ({
    ...t,
    count: (clientAssets[key] || []).filter(a => a.type === t.key).length,
  }))

  return (
    <div style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 800,
            color: '#F1F5F9',
            margin: 0,
            marginBottom: '4px',
          }}
        >
          Assets da Empresa
        </h2>
        <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
          Logo, imagens e criativos de {clientData.clientName} — usados para gerar anúncios no Meta Ads
        </p>
      </div>

      {/* Storage warning */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        padding: '10px 14px', borderRadius: '10px',
        background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.18)',
      }}>
        <span style={{ fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>⚠️</span>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.55 }}>
          <strong style={{ color: 'rgba(245,158,11,0.8)' }}>Assets salvos localmente no navegador.</strong>
          {' '}Imagens grandes são armazenadas em localStorage e podem ser perdidas ao limpar o cache.
          Faça backup dos arquivos originais fora do painel.
        </div>
      </div>

      {/* Contadores por tipo */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '12px',
        }}
      >
        {byType.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilterType(filterType === t.key ? 'all' : t.key)}
            onMouseEnter={e => {
              e.currentTarget.style.opacity = '0.88'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.opacity = '1'
            }}
            style={{
              borderRadius: '10px',
              padding: '12px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: filterType === t.key ? `${TYPE_COLOR[t.key]}12` : '#0F1629',
              border: `1px solid ${filterType === t.key ? TYPE_COLOR[t.key] + '40' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>{t.icon}</div>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: TYPE_COLOR[t.key],
              }}
            >
              {t.label}
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#F1F5F9' }}>{t.count}</div>
          </button>
        ))}
      </div>

      {/* Upload area */}
      <div
        style={{
          borderRadius: '14px',
          padding: '20px',
          background: '#0F1629',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#94A3B8',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '12px',
          }}
        >
          Tipo de asset a enviar
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {ASSET_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setSelectedType(t.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: selectedType === t.key ? `${TYPE_COLOR[t.key]}15` : 'transparent',
                border: `1px solid ${selectedType === t.key ? TYPE_COLOR[t.key] + '50' : 'rgba(255,255,255,0.06)'}`,
                color: selectedType === t.key ? TYPE_COLOR[t.key] : '#64748B',
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            borderRadius: '10px',
            border: `2px dashed ${dragOver ? '#7C3AED' : 'rgba(255,255,255,0.10)'}`,
            padding: '40px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s',
            background: dragOver ? 'rgba(124,58,237,0.06)' : 'transparent',
          }}
        >
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div style={{ fontSize: '28px', marginBottom: '10px' }}>{uploading ? '⏳' : '📤'}</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9', marginBottom: '4px' }}>
            {uploading ? 'Processando...' : 'Arraste imagens ou clique para selecionar'}
          </div>
          <div style={{ fontSize: '11px', color: '#64748B' }}>
            PNG, JPG, SVG, WebP · máx 5 MB por arquivo · tipo:{' '}
            <span style={{ color: TYPE_COLOR[selectedType] }}>
              {ASSET_TYPES.find(t => t.key === selectedType)?.label}
            </span>
          </div>
        </div>
      </div>

      {/* Grid de assets */}
      {(clientAssets[key] || []).length > 0 && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontSize: '11px', color: '#64748B' }}>
              {filterType === 'all'
                ? `${totalCount} assets`
                : `${assets.length} ${ASSET_TYPES.find(t => t.key === filterType)?.label}`}
            </span>
            {filterType !== 'all' && (
              <button
                onClick={() => setFilterType('all')}
                onMouseEnter={e => { e.currentTarget.style.color = '#94A3B8' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#64748B' }}
                style={{
                  fontSize: '12px',
                  color: '#64748B',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'color 0.15s',
                }}
              >
                Ver todos ×
              </button>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '16px',
            }}
          >
            {assets.map((asset) => (
              <div
                key={asset.id}
                style={{
                  borderRadius: '14px',
                  overflow: 'hidden',
                  position: 'relative',
                  background: '#0F1629',
                  border: `1px solid ${activeAssetId === asset.id ? 'rgba(124,58,237,0.40)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                {/* Preview */}
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '16/9',
                    background: '#080D1A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={asset.dataUrl}
                    alt={asset.name}
                    style={{ objectFit: 'contain', width: '100%', height: '100%', padding: '8px', boxSizing: 'border-box' }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '6px',
                      background: `${TYPE_COLOR[asset.type]}20`,
                      color: TYPE_COLOR[asset.type],
                      border: `1px solid ${TYPE_COLOR[asset.type]}30`,
                    }}
                  >
                    {ASSET_TYPES.find(t => t.key === asset.type)?.icon} {asset.type}
                  </span>
                  <button
                    onClick={() => removeClientAsset(key, asset.id)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      cursor: 'pointer',
                      background: 'rgba(239,68,68,0.90)',
                      color: '#fff',
                      border: 'none',
                    }}
                  >
                    ✕
                  </button>
                </div>
                {/* Info + generate button */}
                <div style={{ padding: '12px' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#F1F5F9',
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginBottom: '4px',
                    }}
                  >
                    {asset.name}
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '8px' }}>
                    {formatSize(asset.sizeKb)}
                  </div>
                  <button
                    onClick={() => generateCopy(asset)}
                    disabled={generating && activeAssetId === asset.id}
                    onMouseEnter={e => { if (!(generating && activeAssetId === asset.id)) e.currentTarget.style.opacity = '0.85' }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                    style={{
                      width: '100%',
                      padding: '6px 0',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: generating && activeAssetId === asset.id ? 'not-allowed' : 'pointer',
                      opacity: generating && activeAssetId === asset.id ? 0.5 : 1,
                      transition: 'opacity 0.15s',
                      background: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
                      border: 'none',
                      color: '#fff',
                    }}
                  >
                    {generating && activeAssetId === asset.id ? '⏳ Gerando...' : '⚡ Gerar Copy com IA'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Copy generation results */}
          {activeAssetId && (variants.length > 0 || generating || copyError) && (
            <div
              style={{
                borderRadius: '14px',
                padding: '20px',
                marginTop: '24px',
                background: '#0F1629',
                border: '1px solid rgba(124,58,237,0.22)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <h3
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#F1F5F9',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>⚡</span> Copy gerada com IA
                  <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 400 }}>
                    — pronta para usar no Meta Ads
                  </span>
                </h3>
                <button
                  onClick={() => { setActiveAssetId(null); setVariants([]) }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#94A3B8' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#64748B' }}
                  style={{
                    color: '#64748B',
                    fontSize: '12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'color 0.15s',
                  }}
                >
                  fechar ×
                </button>
              </div>

              {copyError && (
                <div
                  style={{
                    fontSize: '12px',
                    color: '#EF4444',
                    background: 'rgba(239,68,68,0.12)',
                    borderRadius: '10px',
                    padding: '10px 16px',
                    marginBottom: '12px',
                  }}
                >
                  {copyError}
                </div>
              )}

              {generating && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: '#94A3B8',
                    fontSize: '13px',
                    padding: '16px 0',
                  }}
                >
                  <span>⚡</span>
                  Analisando o asset e gerando 3 variações de copy específicas para {clientData?.niche}...
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {variants.map((v, i) => {
                  const angleColors: Record<string, string> = {
                    dor: '#EF4444',
                    aspiração: '#38BDF8',
                    'prova social': '#22C55E',
                    urgência: '#F59E0B',
                    oferta: '#A78BFA',
                  }
                  const ac = angleColors[v.angle] || '#64748B'
                  return (
                    <div
                      key={i}
                      style={{
                        borderRadius: '10px',
                        padding: '16px',
                        background: '#131E35',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '8px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: `${ac}15`,
                            color: ac,
                            border: `1px solid ${ac}30`,
                          }}
                        >
                          {v.angle}
                        </span>
                        <span style={{ fontSize: '10px', color: '#64748B' }}>Variação {i + 1}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {/* Headline */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                          <div>
                            <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', marginBottom: '2px' }}>
                              Headline
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#F1F5F9' }}>{v.headline}</div>
                          </div>
                          <button
                            onClick={() => copyToClipboard(v.headline, `h-${i}`)}
                            style={{
                              fontSize: '10px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              flexShrink: 0,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              background: copied === `h-${i}` ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
                              border: copied === `h-${i}` ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.06)',
                              color: copied === `h-${i}` ? '#22C55E' : '#64748B',
                            }}
                          >
                            {copied === `h-${i}` ? '✓' : 'Copiar'}
                          </button>
                        </div>
                        {/* Primary text */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', marginBottom: '2px' }}>
                              Texto Principal
                            </div>
                            <div style={{ fontSize: '11px', color: '#94A3B8', lineHeight: 1.6 }}>{v.primaryText}</div>
                          </div>
                          <button
                            onClick={() => copyToClipboard(v.primaryText, `p-${i}`)}
                            style={{
                              fontSize: '10px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              flexShrink: 0,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              background: copied === `p-${i}` ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
                              border: copied === `p-${i}` ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.06)',
                              color: copied === `p-${i}` ? '#22C55E' : '#64748B',
                            }}
                          >
                            {copied === `p-${i}` ? '✓' : 'Copiar'}
                          </button>
                        </div>
                        {/* CTA */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '4px' }}>
                          <span style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase' }}>CTA:</span>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '3px 12px',
                              borderRadius: '999px',
                              background: 'rgba(124,58,237,0.10)',
                              color: '#A78BFA',
                              border: '1px solid rgba(124,58,237,0.22)',
                            }}
                          >
                            {v.cta}
                          </span>
                          <button
                            onClick={() => copyToClipboard(`${v.headline}\n\n${v.primaryText}\n\nCTA: ${v.cta}`, `all-${i}`)}
                            style={{
                              marginLeft: 'auto',
                              fontSize: '10px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              background: copied === `all-${i}` ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
                              border: copied === `all-${i}` ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.06)',
                              color: copied === `all-${i}` ? '#22C55E' : '#64748B',
                            }}
                          >
                            {copied === `all-${i}` ? '✓ Copiado!' : 'Copiar tudo'}
                          </button>
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

      {/* Empty state */}
      {(clientAssets[key] || []).length === 0 && (
        <div
          style={{
            borderRadius: '14px',
            padding: '48px',
            textAlign: 'center',
            background: '#0F1629',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '16px', opacity: 0.3 }}>🖼️</div>
          <div style={{ fontSize: '13px', color: '#64748B' }}>Nenhum asset enviado ainda.</div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', opacity: 0.7 }}>
            Envie logo, fotos de produto ou criativos para gerar copy com IA.
          </div>
        </div>
      )}

      {/* Info footer */}
      <div
        style={{
          borderRadius: '10px',
          padding: '10px 16px',
          fontSize: '12px',
          color: '#94A3B8',
          background: 'rgba(124,58,237,0.06)',
          border: '1px solid rgba(124,58,237,0.15)',
        }}
      >
        <span style={{ color: '#A78BFA', fontWeight: 600 }}>⚡ Como funciona:</span>{' '}
        Clique em "Gerar Copy com IA" em qualquer imagem. A IA cria 3 variações de headline + texto + CTA
        específicas para o nicho {clientData?.niche} — prontas para colar no Meta Ads. Gere a Persona IA primeiro
        para resultados ainda mais precisos.
      </div>
    </div>
  )
}
