// components/dashboard/TabAssets.tsx — Biblioteca de assets da empresa (logo, imagens)
'use client'

import { useRef, useState } from 'react'
import { useAppStore } from '@/lib/store'
import type { ClientData, ClientAsset } from '@/lib/store'

interface Props { clientData: ClientData | null }

const ASSET_TYPES: Array<{ key: ClientAsset['type']; label: string; icon: string; desc: string }> = [
  { key: 'logo',      label: 'Logo',             icon: '🏷️', desc: 'Logotipo da marca (PNG/SVG com fundo transparente)' },
  { key: 'product',   label: 'Produto',           icon: '📦', desc: 'Foto do produto ou serviço' },
  { key: 'lifestyle', label: 'Lifestyle',         icon: '🌅', desc: 'Imagens de estilo de vida / ambiente' },
  { key: 'banner',    label: 'Banner / Criativo', icon: '🖼️', desc: 'Artes prontas para anúncio' },
  { key: 'other',     label: 'Outros',            icon: '📁', desc: 'Outros arquivos de marca' },
]

const TYPE_COLOR: Record<ClientAsset['type'], string> = {
  logo:      '#F0B429',
  product:   '#38BDF8',
  lifestyle: '#22C55E',
  banner:    '#A78BFA',
  other:     '#64748B',
}

function formatSize(kb: number) {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`
}

export function TabAssets({ clientData }: Props) {
  const { clientAssets, addClientAsset, removeClientAsset } = useAppStore()
  const [selectedType, setSelectedType] = useState<ClientAsset['type']>('logo')
  const [dragOver,     setDragOver]     = useState(false)
  const [uploading,    setUploading]    = useState(false)
  const [filterType,   setFilterType]   = useState<ClientAsset['type'] | 'all'>('all')
  const fileRef = useRef<HTMLInputElement>(null)

  const key    = clientData?.clientName || ''
  const assets = (clientAssets[key] || []).filter(a => filterType === 'all' || a.type === filterType)

  if (!clientData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-500 text-sm">
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
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div>
        <h2 className="font-display text-2xl font-bold text-white mb-1">Assets da Empresa</h2>
        <p className="text-slate-500 text-sm">
          Logo, imagens e criativos de {clientData.clientName} — usados para gerar anúncios no Meta Ads
        </p>
      </div>

      {/* Contadores por tipo */}
      <div className="grid grid-cols-5 gap-3">
        {byType.map((t) => (
          <button key={t.key} onClick={() => setFilterType(filterType === t.key ? 'all' : t.key)}
            className="rounded-xl p-3 text-center transition-all"
            style={{
              background: filterType === t.key ? `${TYPE_COLOR[t.key]}12` : '#111114',
              border: `1px solid ${filterType === t.key ? TYPE_COLOR[t.key] + '40' : '#2A2A30'}`,
            }}>
            <div className="text-xl mb-1">{t.icon}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TYPE_COLOR[t.key] }}>{t.label}</div>
            <div className="text-lg font-display font-bold text-white">{t.count}</div>
          </button>
        ))}
      </div>

      {/* Upload area */}
      <div className="rounded-2xl p-5" style={{ background: '#111114', border: '1px solid #2A2A30' }}>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Tipo de asset a enviar</div>
        <div className="flex flex-wrap gap-2 mb-4">
          {ASSET_TYPES.map((t) => (
            <button key={t.key} onClick={() => setSelectedType(t.key)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: selectedType === t.key ? `${TYPE_COLOR[t.key]}15` : 'transparent',
                border: `1px solid ${selectedType === t.key ? TYPE_COLOR[t.key] + '50' : '#2A2A30'}`,
                color: selectedType === t.key ? TYPE_COLOR[t.key] : '#64748B',
              }}>
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
          className="rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all"
          style={{
            borderColor: dragOver ? '#F0B429' : '#2A2A30',
            background: dragOver ? 'rgba(240,180,41,0.04)' : 'transparent',
          }}>
          <input ref={fileRef} type="file" multiple accept="image/*" className="hidden"
            onChange={(e) => handleFiles(e.target.files)} />
          <div className="text-3xl mb-3">{uploading ? '⏳' : '📤'}</div>
          <div className="text-sm font-semibold text-white mb-1">
            {uploading ? 'Processando...' : 'Arraste imagens ou clique para selecionar'}
          </div>
          <div className="text-xs text-slate-500">
            PNG, JPG, SVG, WebP · máx 5 MB por arquivo · tipo: <span style={{ color: TYPE_COLOR[selectedType] }}>
              {ASSET_TYPES.find(t => t.key === selectedType)?.label}
            </span>
          </div>
        </div>
      </div>

      {/* Grid de assets */}
      {(clientAssets[key] || []).length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500">
              {filterType === 'all' ? `${totalCount} assets` : `${assets.length} ${ASSET_TYPES.find(t => t.key === filterType)?.label}`}
            </span>
            {filterType !== 'all' && (
              <button onClick={() => setFilterType('all')} className="text-xs text-slate-600 hover:text-slate-300">
                Ver todos ×
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {assets.map((asset) => (
              <div key={asset.id} className="rounded-2xl overflow-hidden group relative"
                style={{ background: '#111114', border: '1px solid #2A2A30' }}>
                {/* Preview */}
                <div className="relative aspect-square bg-[#0A0A0B] flex items-center justify-center overflow-hidden">
                  <img src={asset.dataUrl} alt={asset.name}
                    className="object-contain w-full h-full p-2" />
                  {/* Type badge */}
                  <span className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: `${TYPE_COLOR[asset.type]}20`, color: TYPE_COLOR[asset.type], border: `1px solid ${TYPE_COLOR[asset.type]}30` }}>
                    {ASSET_TYPES.find(t => t.key === asset.type)?.icon} {asset.type}
                  </span>
                  {/* Delete on hover */}
                  <button
                    onClick={() => removeClientAsset(key, asset.id)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    style={{ background: 'rgba(255,77,77,0.9)', color: '#fff' }}>
                    ✕
                  </button>
                </div>
                {/* Info */}
                <div className="p-3">
                  <div className="text-xs text-white font-medium truncate">{asset.name}</div>
                  <div className="text-[10px] text-slate-600 mt-0.5">{formatSize(asset.sizeKb)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(clientAssets[key] || []).length === 0 && (
        <div className="rounded-2xl p-12 text-center" style={{ background: '#111114', border: '1px solid #2A2A30' }}>
          <div className="text-4xl mb-4 opacity-30">🖼️</div>
          <div className="text-slate-500 text-sm">Nenhum asset enviado ainda.</div>
          <div className="text-slate-600 text-xs mt-1">Envie logo e imagens para usar na geração de criativos.</div>
        </div>
      )}

      {/* Tip: Meta Ad Library */}
      <div className="rounded-xl px-4 py-3 text-xs text-slate-500"
        style={{ background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.1)' }}>
        <span className="text-sky-400 font-semibold">💡 Como usar:</span>{' '}
        Com seus assets salvos, a IA usa essas imagens como referência ao gerar briefs de criativo e
        sugestões de anúncio no Meta Ads — o sistema pesquisa automaticamente na
        Biblioteca de Anúncios do Meta o que está performando melhor no seu nicho.
      </div>
    </div>
  )
}
