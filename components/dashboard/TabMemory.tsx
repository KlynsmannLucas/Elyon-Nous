// components/dashboard/TabMemory.tsx — Memória da campanha (RAG)
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'

type MemoryType = 'winning_creative' | 'losing_pattern' | 'benchmark' | 'audience_insight' | 'copy_angle' | 'funnel_insight' | 'general'
type Confidence = 'alta' | 'media' | 'baixa'

interface MemoryItem {
  id: string
  client_name?: string
  niche?: string
  memory_type: MemoryType
  title: string
  description: string
  metrics?: Record<string, any>
  tags?: string[]
  platform?: string
  confidence?: Confidence
  source?: string
  period?: string
  created_at: string
  similarity?: number
}

const TYPE_CONFIG: Record<MemoryType, { label: string; icon: string; color: string; bg: string; border: string }> = {
  winning_creative:  { label: 'Criativo vencedor', icon: '🏆', color: '#22C55E', bg: 'rgba(34,197,94,0.07)',   border: 'rgba(34,197,94,0.2)' },
  losing_pattern:    { label: 'Padrão perdedor',   icon: '⚠️', color: '#FF4D4D', bg: 'rgba(255,77,77,0.07)',   border: 'rgba(255,77,77,0.2)' },
  benchmark:         { label: 'Benchmark',          icon: '📊', color: '#38BDF8', bg: 'rgba(56,189,248,0.07)',  border: 'rgba(56,189,248,0.2)' },
  audience_insight:  { label: 'Insight de público', icon: '👥', color: '#A78BFA', bg: 'rgba(167,139,250,0.07)', border: 'rgba(167,139,250,0.2)' },
  copy_angle:        { label: 'Ângulo de copy',     icon: '✍️', color: '#F0B429', bg: 'rgba(240,180,41,0.07)',  border: 'rgba(240,180,41,0.2)' },
  funnel_insight:    { label: 'Insight de funil',   icon: '🔬', color: '#FB923C', bg: 'rgba(251,146,60,0.07)',  border: 'rgba(251,146,60,0.2)' },
  general:           { label: 'Geral',              icon: '💡', color: '#94A3B8', bg: 'rgba(148,163,184,0.07)', border: 'rgba(148,163,184,0.2)' },
}

const CONFIDENCE_COLORS: Record<Confidence, string> = {
  alta:  '#22C55E',
  media: '#F0B429',
  baixa: '#94A3B8',
}

const EMPTY_FORM = {
  title: '', description: '', memoryType: 'general' as MemoryType, platform: '',
  confidence: 'media' as Confidence, source: '', period: '', metrics: '', tags: '',
}

export function TabMemory() {
  const [memories, setMemories] = useState<MemoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [filterType, setFilterType] = useState<MemoryType | ''>('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const clientData = useAppStore(s => s.clientData)

  const fetchMemories = useCallback(async (q = '', type = '') => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '20' })
      if (q) params.set('query', q)
      if (type) params.set('type', type)
      if (clientData?.niche) params.set('niche', clientData.niche)
      const res = await fetch(`/api/memory?${params}`)
      if (!res.ok) throw new Error('Falha')
      const data = await res.json()
      setMemories(data.memories || [])
    } catch {
      setMemories([])
    } finally {
      setLoading(false)
    }
  }, [clientData?.niche])

  useEffect(() => {
    fetchMemories()
  }, [fetchMemories])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    fetchMemories(query, filterType)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.description.trim()) return
    setSaving(true)
    setSaveMsg('')
    try {
      let metricsObj: Record<string, any> | undefined
      if (form.metrics.trim()) {
        try { metricsObj = JSON.parse(form.metrics) } catch { metricsObj = { raw: form.metrics } }
      }
      const tagsArr = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientData?.clientName || '',
          niche: clientData?.niche || '',
          memoryType: form.memoryType,
          title: form.title,
          description: form.description,
          metrics: metricsObj,
          tags: tagsArr.length ? tagsArr : undefined,
          platform: form.platform || undefined,
          confidence: form.confidence,
          source: form.source || undefined,
          period: form.period || undefined,
        }),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      setSaveMsg('✓ Memória salva com sucesso!')
      setForm(EMPTY_FORM)
      setShowForm(false)
      fetchMemories(query, filterType)
    } catch (e: any) {
      setSaveMsg(e.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      await fetch(`/api/memory?id=${id}`, { method: 'DELETE' })
      setMemories(prev => prev.filter(m => m.id !== id))
    } catch { /* silent */ }
    finally { setDeleting(null) }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '20px' }}>🧠</span>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Memória da Campanha</h2>
            <span style={{
              fontSize: '9px', fontFamily: 'var(--font-mono)', color: '#A78BFA',
              background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)',
              borderRadius: '4px', padding: '2px 6px', letterSpacing: '0.06em',
            }}>RAG</span>
          </div>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0, maxWidth: '500px' }}>
            Salve aprendizados, criativos vencedores e padrões de campanha. A IA usa essa memória para gerar recomendações mais precisas.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setSaveMsg('') }}
          style={{
            padding: '9px 18px', borderRadius: '9px', flexShrink: 0,
            background: 'rgba(167,139,250,0.10)', border: '1px solid rgba(167,139,250,0.25)',
            color: '#A78BFA', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          {showForm ? '✕ Cancelar' : '+ Novo aprendizado'}
        </button>
      </div>

      {/* New memory form */}
      {showForm && (
        <div style={{
          background: '#111114', border: '1px solid rgba(167,139,250,0.2)', borderRadius: '14px',
          padding: '20px 24px', marginBottom: '20px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#A78BFA', marginBottom: '16px' }}>
            + Registrar novo aprendizado
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            {/* Tipo */}
            <div>
              <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>Tipo</label>
              <select
                value={form.memoryType}
                onChange={e => setForm(p => ({ ...p, memoryType: e.target.value as MemoryType }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#1A1A22', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '12px', outline: 'none', colorScheme: 'dark' }}
              >
                {(Object.entries(TYPE_CONFIG) as [MemoryType, any][]).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>
            {/* Plataforma */}
            <div>
              <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>Plataforma</label>
              <select
                value={form.platform}
                onChange={e => setForm(p => ({ ...p, platform: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#1A1A22', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '12px', outline: 'none', colorScheme: 'dark' }}
              >
                <option value="">Todas</option>
                <option value="meta">Meta Ads</option>
                <option value="google">Google Ads</option>
                <option value="tiktok">TikTok Ads</option>
                <option value="linkedin">LinkedIn Ads</option>
              </select>
            </div>
            {/* Título */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>Título *</label>
              <input
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Ex: Vídeo de depoimento converte 3x mais que estático"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            {/* Descrição */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>Descrição *</label>
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Descreva o aprendizado em detalhes: contexto, o que foi testado, resultado..."
                rows={3}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '12px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
            {/* Métricas */}
            <div>
              <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>Métricas (JSON ou texto)</label>
              <input
                value={form.metrics}
                onChange={e => setForm(p => ({ ...p, metrics: e.target.value }))}
                placeholder='{"cpl": 45, "ctr": "1.8%"}'
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '12px', outline: 'none', fontFamily: 'var(--font-mono)', boxSizing: 'border-box' }}
              />
            </div>
            {/* Tags */}
            <div>
              <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>Tags (vírgula separadas)</label>
              <input
                value={form.tags}
                onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                placeholder="vídeo, depoimento, lead-gen"
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            {/* Fonte */}
            <div>
              <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>Fonte / Origem</label>
              <input
                value={form.source}
                onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
                placeholder="Teste A/B, auditoria, reunião..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            {/* Confiança */}
            <div>
              <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>Confiança</label>
              <select
                value={form.confidence}
                onChange={e => setForm(p => ({ ...p, confidence: e.target.value as Confidence }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#1A1A22', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '12px', outline: 'none', colorScheme: 'dark' }}
              >
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={handleSave}
              disabled={saving || !form.title.trim() || !form.description.trim()}
              style={{
                padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                background: saving || !form.title.trim() ? 'rgba(255,255,255,0.04)' : 'rgba(167,139,250,0.12)',
                border: `1px solid ${saving || !form.title.trim() ? 'rgba(255,255,255,0.06)' : 'rgba(167,139,250,0.3)'}`,
                color: saving || !form.title.trim() ? 'rgba(255,255,255,0.25)' : '#A78BFA',
                cursor: saving || !form.title.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? '⏳ Salvando...' : '💾 Salvar'}
            </button>
            {saveMsg && (
              <span style={{ fontSize: '12px', color: saveMsg.startsWith('✓') ? '#22C55E' : '#FF4D4D', fontFamily: 'var(--font-mono)' }}>
                {saveMsg}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Search + filter */}
      <form onSubmit={handleSearch} style={{
        display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '10px', alignItems: 'center',
        background: '#111114', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
        padding: '14px 16px', marginBottom: '16px',
      }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={'Busca semântica: ex. “criativos com CTR alto”...'}
          style={{
            padding: '8px 12px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#fff', fontSize: '13px', outline: 'none',
          }}
        />
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as MemoryType | '')}
          style={{
            padding: '8px 10px', borderRadius: '8px',
            background: '#1A1A22', border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.6)', fontSize: '12px', outline: 'none', colorScheme: 'dark',
          }}
        >
          <option value="">Todos os tipos</option>
          {(Object.entries(TYPE_CONFIG) as [MemoryType, any][]).map(([k, v]) => (
            <option key={k} value={k}>{v.icon} {v.label}</option>
          ))}
        </select>
        <button
          type="submit"
          style={{
            padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
            background: 'rgba(167,139,250,0.10)', border: '1px solid rgba(167,139,250,0.25)',
            color: '#A78BFA', cursor: 'pointer',
          }}
        >
          🔍 Buscar
        </button>
      </form>

      {/* Results */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
          Buscando memórias...
        </div>
      ) : memories.length === 0 ? (
        <div style={{
          padding: '48px 24px', textAlign: 'center',
          background: '#111114', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px',
        }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🧠</div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>
            {query ? 'Nenhum resultado para esta busca' : 'Nenhum aprendizado salvo ainda'}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', maxWidth: '380px', margin: '0 auto 20px' }}>
            {query
              ? 'Tente termos diferentes ou remova o filtro de tipo.'
              : 'Registre criativos vencedores, padrões de público e benchmarks. A IA usa esses dados para dar recomendações mais precisas.'}
          </div>
          {!query && (
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: '9px 20px', borderRadius: '9px', fontSize: '13px', fontWeight: 600,
                background: 'rgba(167,139,250,0.10)', border: '1px solid rgba(167,139,250,0.25)',
                color: '#A78BFA', cursor: 'pointer',
              }}
            >
              + Registrar primeiro aprendizado
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
            {memories.length} resultado{memories.length !== 1 ? 's' : ''}{query ? ` para "${query}"` : ''}
            {memories[0]?.similarity !== undefined && ' · ordenados por relevância semântica'}
          </div>
          {memories.map(m => {
            const cfg = TYPE_CONFIG[m.memory_type] || TYPE_CONFIG.general
            const conf = m.confidence as Confidence
            return (
              <div key={m.id} style={{
                background: '#111114', border: `1px solid rgba(255,255,255,0.06)`, borderRadius: '12px',
                padding: '16px 18px',
                transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(167,139,250,0.2)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Type badge + title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '5px',
                        color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
                      }}>
                        {cfg.icon} {cfg.label}
                      </span>
                      {m.platform && (
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>
                          {m.platform}
                        </span>
                      )}
                      {conf && (
                        <span style={{ fontSize: '10px', color: CONFIDENCE_COLORS[conf] || '#94A3B8', fontFamily: 'var(--font-mono)' }}>
                          confiança {conf}
                        </span>
                      )}
                      {m.similarity !== undefined && (
                        <span style={{ fontSize: '10px', color: '#A78BFA', fontFamily: 'var(--font-mono)' }}>
                          {(m.similarity * 100).toFixed(0)}% relevante
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                      {m.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.5', marginBottom: '8px' }}>
                      {m.description}
                    </div>
                    {/* Metrics */}
                    {m.metrics && Object.keys(m.metrics).length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        {Object.entries(m.metrics).map(([k, v]) => (
                          <span key={k} style={{
                            fontSize: '11px', padding: '2px 8px', borderRadius: '5px',
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)',
                          }}>
                            {k}: {String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Tags */}
                    {m.tags && m.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {m.tags.map(t => (
                          <span key={t} style={{
                            fontSize: '10px', padding: '1px 7px', borderRadius: '4px',
                            background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.15)',
                            color: '#A78BFA',
                          }}>#{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                    <button
                      onClick={() => handleDelete(m.id)}
                      disabled={deleting === m.id}
                      title="Apagar"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: deleting === m.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,77,77,0.4)',
                        fontSize: '13px', padding: '2px',
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => { if (deleting !== m.id) (e.currentTarget as HTMLElement).style.color = '#FF4D4D' }}
                      onMouseLeave={e => { if (deleting !== m.id) (e.currentTarget as HTMLElement).style.color = 'rgba(255,77,77,0.4)' }}
                    >
                      {deleting === m.id ? '⏳' : '✕'}
                    </button>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                      {new Date(m.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    {m.source && (
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', maxWidth: '100px', textAlign: 'right' }}>
                        {m.source}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
