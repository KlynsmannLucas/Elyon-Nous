// components/dashboard/TabAcoes.tsx — Plano de Ações consolidado
'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import type { ClientData, StrategyData } from '@/lib/store'

interface Props {
  clientData: ClientData | null
  strategyData: StrategyData | null
}

type Prioridade = 'critica' | 'alta' | 'media' | 'baixa'
type Status = 'pendente' | 'em_andamento' | 'concluida'
type Filtro = 'todas' | Status

const PRIORIDADE_CONFIG: Record<Prioridade, { label: string; color: string; bg: string; icon: string }> = {
  critica: { label: 'Crítica',  color: '#FF4D4D', bg: 'rgba(255,77,77,0.08)',   icon: '🔴' },
  alta:    { label: 'Alta',     color: '#F0B429', bg: 'rgba(240,180,41,0.08)',  icon: '🟡' },
  media:   { label: 'Média',    color: '#38BDF8', bg: 'rgba(56,189,248,0.08)',  icon: '🔵' },
  baixa:   { label: 'Baixa',    color: '#22C55E', bg: 'rgba(34,197,94,0.08)',   icon: '🟢' },
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; next: Status }> = {
  pendente:     { label: 'Pendente',      color: '#64748B', next: 'em_andamento' },
  em_andamento: { label: 'Em andamento',  color: '#F0B429', next: 'concluida' },
  concluida:    { label: 'Concluída',     color: '#22C55E', next: 'pendente' },
}

const CATEGORIA_ICON: Record<string, string> = {
  Tracking:   '📡', Criativos: '🎨', Audiências: '👥',
  Funil:      '🔀', Escala:    '📈', Estrutura:  '🏗️', Orçamento: '💰',
}

export function TabAcoes({ clientData, strategyData }: Props) {
  const { auditCache, actionPlanCache, setActionPlanCache, updateActionStatus } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [filtro,  setFiltro]  = useState<Filtro>('todas')
  const [expanded, setExpanded] = useState<string | null>(null)

  const key     = clientData?.clientName || ''
  const actions = actionPlanCache[key] || []

  // Extract latest audit object (handles both old array format and direct object)
  const auditHistory  = auditCache[key]
  const latestAudit   = Array.isArray(auditHistory) ? auditHistory[0]?.audit : auditHistory
  // Meta Intelligence data saved by TabMetaIntelligence
  const metaIntelData = latestAudit?._intelligenceData || null

  const stats = {
    total:       actions.length,
    pendente:    actions.filter((a: any) => a.status === 'pendente').length,
    andamento:   actions.filter((a: any) => a.status === 'em_andamento').length,
    concluida:   actions.filter((a: any) => a.status === 'concluida').length,
  }
  const pct = stats.total > 0 ? Math.round((stats.concluida / stats.total) * 100) : 0

  const handleGenerate = async () => {
    if (!clientData) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/action-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientData, strategyData, auditData: latestAudit, metaIntelData }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setActionPlanCache(key, json.actions)
    } catch (e: any) {
      setError(e.message || 'Erro ao gerar plano.')
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (!actions.length) return
    const header = ['Prioridade', 'Categoria', 'Status', 'Prazo', 'Título', 'Descrição', 'Como executar', 'Impacto esperado']
    const rows = actions.map((a: any) => [
      a.prioridade, a.categoria,
      STATUS_CONFIG[a.status as Status]?.label || a.status,
      a.prazo, a.titulo, a.descricao, a.como, a.impacto,
    ])
    const escape = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = [header, ...rows].map(r => r.map(escape).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `plano-acoes-${key.replace(/\s+/g, '-').toLowerCase()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleStatusChange = (id: string) => {
    const item = actions.find((a: any) => a.id === id)
    if (!item) return
    const next = STATUS_CONFIG[item.status as Status]?.next || 'pendente'
    updateActionStatus(key, id, next)
  }

  const filtered = filtro === 'todas'
    ? actions
    : actions.filter((a: any) => a.status === filtro)

  const grouped = (['critica', 'alta', 'media', 'baixa'] as Prioridade[]).map((p) => ({
    prioridade: p,
    items: filtered.filter((a: any) => a.prioridade === p),
  })).filter(g => g.items.length > 0)

  if (!clientData) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 text-sm">
        Selecione um cliente para ver o plano de ações.
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-white mb-1">Plano de Ações</h2>
          <p className="text-slate-500 text-sm">
            Ações priorizadas geradas a partir de estratégia + auditoria · {clientData.clientName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {actions.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
              style={{ background: 'rgba(56,189,248,0.1)', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.25)' }}
            >
              ↓ Exportar CSV
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)', color: '#000' }}
          >
            {loading
              ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Gerando...</>
              : actions.length > 0 ? '🔄 Atualizar plano' : '⚡ Gerar plano de ações'
            }
          </button>
        </div>
      </div>

      {/* Fontes disponíveis */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: 'Estratégia',  ok: !!strategyData,  icon: '⚡' },
          { label: 'Auditoria',   ok: !!(latestAudit || metaIntelData),  icon: '🔍' },
          { label: 'Dados cliente', ok: !!clientData,   icon: '👤' },
        ].map(({ label, ok, icon }) => (
          <span key={label} className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full"
            style={{ background: ok ? 'rgba(34,197,94,0.08)' : 'rgba(100,116,139,0.08)', color: ok ? '#22C55E' : '#64748B', border: `1px solid ${ok ? 'rgba(34,197,94,0.2)' : '#2A2A30'}` }}>
            {icon} {label} {ok ? '✓' : '—'}
          </span>
        ))}
        {!latestAudit && !metaIntelData && (
          <span className="text-[11px] text-[#F0B429] flex items-center gap-1">
            ⚠ Execute a análise Meta Ads para ações mais precisas
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-10 text-center">
          <div className="w-12 h-12 border-2 border-[#F0B429]/20 border-t-[#F0B429] rounded-full animate-spin mx-auto mb-4" />
          <div className="font-display font-bold text-white mb-1">Consultando especialista sênior...</div>
          <div className="text-xs text-slate-500">Analisando estratégia, auditoria e nicho para criar ações específicas</div>
        </div>
      )}

      {/* Estado vazio */}
      {!loading && actions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-[#111114] border border-[#2A2A30] rounded-2xl">
          <div className="text-5xl mb-4 opacity-20">✅</div>
          <div className="font-display text-base font-bold text-white mb-2">Nenhum plano gerado</div>
          <p className="text-slate-500 text-xs max-w-sm leading-relaxed mb-6">
            Clique em <strong className="text-white">Gerar plano de ações</strong> para criar uma lista priorizada
            com base na estratégia e auditoria do cliente.
          </p>
          <p className="text-[11px] text-slate-600">
            Dica: execute a <strong className="text-slate-400">Auditoria</strong> antes para ações mais cirúrgicas.
          </p>
        </div>
      )}

      {/* Plano gerado */}
      {!loading && actions.length > 0 && (
        <>
          {/* Progresso */}
          <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-white">Progresso geral</span>
              <span className="text-sm font-bold" style={{ color: pct === 100 ? '#22C55E' : '#F0B429' }}>{pct}%</span>
            </div>
            <div className="w-full bg-[#2A2A30] rounded-full h-2 mb-4">
              <div className="h-2 rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: pct === 100 ? '#22C55E' : 'linear-gradient(90deg, #F0B429, #FFD166)' }} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {([
                { label: 'Pendentes',     val: stats.pendente,  color: '#64748B' },
                { label: 'Em andamento',  val: stats.andamento, color: '#F0B429' },
                { label: 'Concluídas',    val: stats.concluida, color: '#22C55E' },
              ] as const).map(({ label, val, color }) => (
                <div key={label} className="text-center">
                  <div className="text-xl font-bold font-display" style={{ color }}>{val}</div>
                  <div className="text-[10px] text-slate-500">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Filtros de status */}
          <div className="flex gap-2 flex-wrap">
            {(['todas', 'pendente', 'em_andamento', 'concluida'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                style={filtro === f
                  ? { background: 'rgba(240,180,41,0.15)', border: '1px solid rgba(240,180,41,0.4)', color: '#F0B429' }
                  : { background: 'transparent', border: '1px solid #2A2A30', color: '#64748B' }
                }
              >
                {f === 'todas' ? `Todas (${stats.total})`
                  : f === 'pendente' ? `Pendentes (${stats.pendente})`
                  : f === 'em_andamento' ? `Em andamento (${stats.andamento})`
                  : `Concluídas (${stats.concluida})`}
              </button>
            ))}
          </div>

          {/* Grupos por prioridade */}
          <div className="space-y-6">
            {grouped.map(({ prioridade, items }) => {
              const cfg = PRIORIDADE_CONFIG[prioridade]
              return (
                <div key={prioridade}>
                  <div className="flex items-center gap-2 mb-3">
                    <span>{cfg.icon}</span>
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: cfg.color }}>
                      Prioridade {cfg.label}
                    </span>
                    <span className="text-[10px] text-slate-600 ml-1">({items.length})</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((item: any) => {
                      const sCfg = STATUS_CONFIG[item.status as Status] || STATUS_CONFIG.pendente
                      const isOpen = expanded === item.id
                      return (
                        <div key={item.id} className="bg-[#111114] border border-[#2A2A30] rounded-xl overflow-hidden transition-all"
                          style={{ borderLeftWidth: 3, borderLeftColor: cfg.color }}>
                          {/* Row header */}
                          <div className="flex items-center gap-3 px-4 py-3">
                            {/* Status toggle */}
                            <button
                              onClick={() => handleStatusChange(item.id)}
                              title={`Clique para avançar status: ${sCfg.label} → ${STATUS_CONFIG[sCfg.next].label}`}
                              className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all hover:scale-110"
                              style={{
                                borderColor: sCfg.color,
                                background: item.status === 'concluida' ? sCfg.color : 'transparent',
                              }}
                            >
                              {item.status === 'concluida' && <span className="text-[10px] text-black font-bold">✓</span>}
                              {item.status === 'em_andamento' && <span className="w-2 h-2 rounded-full" style={{ background: sCfg.color }} />}
                            </button>

                            {/* Categoria + título */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                                  style={{ background: cfg.bg, color: cfg.color }}>
                                  {CATEGORIA_ICON[item.categoria] || '📌'} {item.categoria}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded font-semibold"
                                  style={{ background: 'rgba(100,116,139,0.1)', color: sCfg.color, border: `1px solid ${sCfg.color}30` }}>
                                  {sCfg.label}
                                </span>
                                <span className="text-[10px] text-slate-600">⏱ {item.prazo}</span>
                              </div>
                              <div className="text-sm font-semibold text-white mt-1 leading-snug"
                                style={{ textDecoration: item.status === 'concluida' ? 'line-through' : 'none', opacity: item.status === 'concluida' ? 0.5 : 1 }}>
                                {item.titulo}
                              </div>
                            </div>

                            {/* Expand */}
                            <button onClick={() => setExpanded(isOpen ? null : item.id)}
                              className="text-slate-600 hover:text-slate-300 transition-colors text-sm flex-shrink-0 ml-1 px-1">
                              {isOpen ? '▲' : '▼'}
                            </button>
                          </div>

                          {/* Expanded detail */}
                          {isOpen && (
                            <div className="px-4 pb-4 pt-0 border-t border-[#2A2A30] mt-0">
                              <div className="space-y-3 pt-3">
                                <div>
                                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Por quê</div>
                                  <p className="text-sm text-slate-300 leading-relaxed">{item.descricao}</p>
                                </div>
                                <div>
                                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Como executar</div>
                                  <p className="text-sm text-slate-300 leading-relaxed">{item.como}</p>
                                </div>
                                <div className="flex items-center gap-2 bg-[#16161A] rounded-lg px-3 py-2">
                                  <span className="text-xs text-slate-500">Impacto esperado:</span>
                                  <span className="text-xs font-bold text-[#22C55E]">{item.impacto}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
