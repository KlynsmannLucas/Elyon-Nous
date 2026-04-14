// components/dashboard/TabHistory.tsx — Histórico de campanhas passadas
'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import type { CampaignRecord } from '@/lib/store'

const CHANNELS = [
  'Meta Ads', 'Google Ads', 'Google Search', 'Google Shopping',
  'TikTok Ads', 'YouTube Ads', 'LinkedIn Ads',
  'E-mail Marketing', 'WhatsApp Marketing',
  'Orgânico / SEO', 'Influenciadores', 'Outro',
]

const OUTCOME_CONFIG = {
  vencedora: { label: '🏆 Vencedora', color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)' },
  neutra:    { label: '➖ Neutra',    color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' },
  perdedora: { label: '⚠️ Perdedora', color: '#FF4D4D', bg: 'rgba(255,77,77,0.1)',  border: 'rgba(255,77,77,0.3)' },
}

const EMPTY_FORM = {
  channel: '',
  period: '',
  budgetSpent: '',
  leads: '',
  conversions: '',
  revenue: '',
  outcome: 'neutra' as CampaignRecord['outcome'],
  whatWorked: '',
  whatFailed: '',
  notes: '',
}

function inputClass() {
  return 'w-full bg-[#0A0A0B] border border-[#2A2A30] rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#F0B429] transition-colors'
}

function fmt(n: number) {
  if (!n) return '—'
  if (n >= 1000) return `R$${(n / 1000).toFixed(1)}k`
  return `R$${n}`
}

export function TabHistory() {
  const { campaignHistory, addCampaign, deleteCampaign } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const update = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }))

  const cplCalc = form.leads && form.budgetSpent
    ? Math.round(Number(form.budgetSpent) / Number(form.leads))
    : null

  const roasCalc = form.revenue && form.budgetSpent && Number(form.budgetSpent) > 0
    ? +(Number(form.revenue) / Number(form.budgetSpent)).toFixed(1)
    : null

  const handleSubmit = () => {
    if (!form.channel || !form.period) return
    addCampaign({
      channel:      form.channel,
      period:       form.period,
      budgetSpent:  Number(form.budgetSpent) || 0,
      leads:        Number(form.leads) || 0,
      cplReal:      cplCalc || 0,
      conversions:  Number(form.conversions) || 0,
      revenue:      Number(form.revenue) || 0,
      outcome:      form.outcome,
      whatWorked:   form.whatWorked,
      whatFailed:   form.whatFailed,
      notes:        form.notes,
    })
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  // Separar por resultado
  const winners  = campaignHistory.filter((c) => c.outcome === 'vencedora')
  const losers   = campaignHistory.filter((c) => c.outcome === 'perdedora')

  // KPIs agregados
  const totalInvested = campaignHistory.reduce((s, c) => s + c.budgetSpent, 0)
  const totalLeads    = campaignHistory.reduce((s, c) => s + c.leads, 0)
  const totalRevenue  = campaignHistory.reduce((s, c) => s + c.revenue, 0)
  const avgCPL        = totalLeads > 0 ? Math.round(totalInvested / totalLeads) : 0
  const avgROAS       = totalInvested > 0 ? +(totalRevenue / totalInvested).toFixed(1) : 0

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-white mb-1">Histórico de Campanhas</h2>
          <p className="text-slate-500 text-sm">
            Registre o que funcionou e o que não funcionou — a IA usa esses dados para diagnósticos mais precisos.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setForm(EMPTY_FORM) }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
          style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)', color: '#000' }}
        >
          + Adicionar Campanha
        </button>
      </div>

      {/* KPIs do histórico */}
      {campaignHistory.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Campanhas',       value: String(campaignHistory.length), color: '#A78BFA' },
            { label: 'Total Investido', value: fmt(totalInvested),             color: '#F0B429' },
            { label: 'Total Leads',     value: String(totalLeads),             color: '#38BDF8' },
            { label: 'CPL Médio Real',  value: avgCPL ? `R$${avgCPL}` : '—',  color: '#22C55E' },
            { label: 'ROAS Médio Real', value: avgROAS ? `${avgROAS}×` : '—', color: '#22C55E' },
          ].map((k) => (
            <div key={k.label} className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-4 text-center">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{k.label}</div>
              <div className="font-display text-lg font-bold" style={{ color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Resumo rápido: o que funcionou vs o que não funcionou */}
      {campaignHistory.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Vencedoras */}
          <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🏆</span>
              <div className="font-display font-bold text-[#22C55E] text-sm">O que funcionou</div>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }}>
                {winners.length} campanhas
              </span>
            </div>
            {winners.length === 0 ? (
              <p className="text-xs text-slate-600">Nenhuma campanha vencedora registrada ainda.</p>
            ) : (
              <div className="space-y-2">
                {winners.slice(0, 3).map((c) => (
                  <div key={c.id} className="bg-[#16161A] rounded-xl px-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-white">{c.channel} · {c.period}</span>
                      <span className="text-xs text-[#22C55E]">CPL R${c.cplReal}</span>
                    </div>
                    {c.whatWorked && (
                      <p className="text-xs text-slate-500 leading-snug">{c.whatWorked}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Perdedoras */}
          <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">⚠️</span>
              <div className="font-display font-bold text-[#FF4D4D] text-sm">O que não funcionou</div>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(255,77,77,0.1)', color: '#FF4D4D', border: '1px solid rgba(255,77,77,0.2)' }}>
                {losers.length} campanhas
              </span>
            </div>
            {losers.length === 0 ? (
              <p className="text-xs text-slate-600">Nenhuma campanha perdedora registrada ainda.</p>
            ) : (
              <div className="space-y-2">
                {losers.slice(0, 3).map((c) => (
                  <div key={c.id} className="bg-[#16161A] rounded-xl px-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-white">{c.channel} · {c.period}</span>
                      <span className="text-xs text-[#FF4D4D]">CPL R${c.cplReal}</span>
                    </div>
                    {c.whatFailed && (
                      <p className="text-xs text-slate-500 leading-snug">{c.whatFailed}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lista completa de campanhas */}
      {campaignHistory.length > 0 && (
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2A2A30]">
            <h3 className="font-display font-bold text-white">Todas as Campanhas</h3>
          </div>
          <div className="divide-y divide-[#1E1E24]">
            {campaignHistory.map((c) => {
              const oc = OUTCOME_CONFIG[c.outcome]
              return (
                <div key={c.id} className="px-6 py-4 hover:bg-[#16161A] transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Linha 1 */}
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="font-semibold text-white text-sm">{c.channel}</span>
                        <span className="text-xs text-slate-500">{c.period}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ color: oc.color, background: oc.bg, border: `1px solid ${oc.border}` }}>
                          {oc.label}
                        </span>
                      </div>

                      {/* Métricas */}
                      <div className="flex flex-wrap gap-4 mb-2">
                        {c.budgetSpent > 0 && (
                          <div>
                            <div className="text-[10px] text-slate-600 uppercase">Investido</div>
                            <div className="text-xs font-bold text-[#F0B429]">{fmt(c.budgetSpent)}</div>
                          </div>
                        )}
                        {c.leads > 0 && (
                          <div>
                            <div className="text-[10px] text-slate-600 uppercase">Leads</div>
                            <div className="text-xs font-bold text-white">{c.leads}</div>
                          </div>
                        )}
                        {c.cplReal > 0 && (
                          <div>
                            <div className="text-[10px] text-slate-600 uppercase">CPL Real</div>
                            <div className="text-xs font-bold text-[#38BDF8]">R${c.cplReal}</div>
                          </div>
                        )}
                        {c.conversions > 0 && (
                          <div>
                            <div className="text-[10px] text-slate-600 uppercase">Conversões</div>
                            <div className="text-xs font-bold text-white">{c.conversions}</div>
                          </div>
                        )}
                        {c.revenue > 0 && (
                          <div>
                            <div className="text-[10px] text-slate-600 uppercase">Receita</div>
                            <div className="text-xs font-bold text-[#22C55E]">{fmt(c.revenue)}</div>
                          </div>
                        )}
                        {c.revenue > 0 && c.budgetSpent > 0 && (
                          <div>
                            <div className="text-[10px] text-slate-600 uppercase">ROAS</div>
                            <div className="text-xs font-bold text-[#22C55E]">
                              {(c.revenue / c.budgetSpent).toFixed(1)}×
                            </div>
                          </div>
                        )}
                      </div>

                      {/* O que funcionou / falhou */}
                      <div className="flex flex-col gap-1">
                        {c.whatWorked && (
                          <div className="flex items-start gap-1.5 text-xs text-slate-400">
                            <span className="text-[#22C55E] flex-shrink-0 mt-0.5">✓</span>
                            <span>{c.whatWorked}</span>
                          </div>
                        )}
                        {c.whatFailed && (
                          <div className="flex items-start gap-1.5 text-xs text-slate-400">
                            <span className="text-[#FF4D4D] flex-shrink-0 mt-0.5">✕</span>
                            <span>{c.whatFailed}</span>
                          </div>
                        )}
                        {c.notes && (
                          <div className="flex items-start gap-1.5 text-xs text-slate-500">
                            <span className="text-slate-600 flex-shrink-0 mt-0.5">💬</span>
                            <span>{c.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => deleteCampaign(c.id)}
                      className="text-slate-700 hover:text-[#FF4D4D] transition-colors text-lg flex-shrink-0 mt-0.5"
                      title="Remover"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {campaignHistory.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-5xl mb-4 opacity-30">📊</div>
          <div className="font-display text-lg font-bold text-white mb-2">Nenhuma campanha registrada</div>
          <p className="text-slate-500 text-sm max-w-sm mb-6">
            Registre campanhas passadas — o que funcionou e o que não funcionou. A ELYON usa esses dados para um diagnóstico muito mais preciso.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 rounded-xl text-sm font-bold"
            style={{ background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.3)', color: '#F0B429' }}
          >
            + Adicionar primeira campanha
          </button>
        </div>
      )}

      {/* ── Formulário de nova campanha ────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[72px] pb-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden flex flex-col my-auto">
            {/* Header modal */}
            <div className="px-6 py-4 border-b border-[#2A2A30] flex items-center justify-between flex-shrink-0">
              <div className="font-display font-bold text-white">Nova Campanha</div>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white transition-colors text-xl">×</button>
            </div>

            {/* Body modal (scrollável) */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

              {/* Canal + Período */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 block">Canal *</label>
                  <select
                    className={inputClass()}
                    value={form.channel}
                    onChange={(e) => update('channel', e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 block">Período *</label>
                  <input
                    type="text"
                    className={inputClass()}
                    placeholder="Ex: Jan 2025, Q1 2025"
                    value={form.period}
                    onChange={(e) => update('period', e.target.value)}
                  />
                </div>
              </div>

              {/* Budget + Leads + Conversões + Receita */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 block">Investido (R$)</label>
                  <input type="number" className={inputClass()} placeholder="5000"
                    value={form.budgetSpent} onChange={(e) => update('budgetSpent', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 block">Leads gerados</label>
                  <input type="number" className={inputClass()} placeholder="120"
                    value={form.leads} onChange={(e) => update('leads', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 block">Conversões (vendas)</label>
                  <input type="number" className={inputClass()} placeholder="8"
                    value={form.conversions} onChange={(e) => update('conversions', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 block">Receita gerada (R$)</label>
                  <input type="number" className={inputClass()} placeholder="25000"
                    value={form.revenue} onChange={(e) => update('revenue', e.target.value)} />
                </div>
              </div>

              {/* CPL e ROAS calculados ao vivo */}
              {(cplCalc || roasCalc) && (
                <div className="flex gap-4 p-3 rounded-xl" style={{ background: 'rgba(240,180,41,0.05)', border: '1px solid rgba(240,180,41,0.15)' }}>
                  {cplCalc && (
                    <div className="text-center">
                      <div className="text-[10px] text-slate-500 uppercase">CPL calculado</div>
                      <div className="text-sm font-bold text-[#F0B429]">R${cplCalc}</div>
                    </div>
                  )}
                  {roasCalc && (
                    <div className="text-center">
                      <div className="text-[10px] text-slate-500 uppercase">ROAS</div>
                      <div className="text-sm font-bold text-[#22C55E]">{roasCalc}×</div>
                    </div>
                  )}
                </div>
              )}

              {/* Resultado */}
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 block">Resultado geral</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(OUTCOME_CONFIG) as [CampaignRecord['outcome'], typeof OUTCOME_CONFIG[keyof typeof OUTCOME_CONFIG]][]).map(([key, oc]) => (
                    <button
                      key={key}
                      onClick={() => update('outcome', key)}
                      className="py-2.5 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: form.outcome === key ? oc.bg : '#0A0A0B',
                        border: form.outcome === key ? `1px solid ${oc.border}` : '1px solid #2A2A30',
                        color: form.outcome === key ? oc.color : '#64748B',
                      }}
                    >
                      {oc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* O que funcionou */}
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 block">
                  ✓ O que funcionou
                </label>
                <textarea
                  className={inputClass()}
                  style={{ resize: 'none' }}
                  rows={2}
                  placeholder="Ex: Criativo de vídeo curto com antes/depois teve CTR 4%..."
                  value={form.whatWorked}
                  onChange={(e) => update('whatWorked', e.target.value)}
                />
              </div>

              {/* O que não funcionou */}
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 block">
                  ✕ O que não funcionou
                </label>
                <textarea
                  className={inputClass()}
                  style={{ resize: 'none' }}
                  rows={2}
                  placeholder="Ex: Público de interesse amplo gerou leads sem intenção de compra..."
                  value={form.whatFailed}
                  onChange={(e) => update('whatFailed', e.target.value)}
                />
              </div>

              {/* Observações */}
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 block">Observações gerais</label>
                <textarea
                  className={inputClass()}
                  style={{ resize: 'none' }}
                  rows={2}
                  placeholder="Contexto extra, sazonalidade, concorrência..."
                  value={form.notes}
                  onChange={(e) => update('notes', e.target.value)}
                />
              </div>
            </div>

            {/* Footer modal */}
            <div className="px-6 py-4 border-t border-[#2A2A30] flex gap-3 flex-shrink-0">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-300 transition-colors border border-[#2A2A30]"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.channel || !form.period}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)', color: '#000' }}
              >
                Salvar Campanha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
