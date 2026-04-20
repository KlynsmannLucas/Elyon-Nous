// components/dashboard/TabPerformance.tsx — Performance com histórico inline fácil de preencher
'use client'

import { useState } from 'react'
import { StatCard } from './StatCard'
import { getNicheContent } from '@/lib/niche_content'
import { getBenchmark, computeNicheProjection } from '@/lib/niche_benchmarks'
import { useAppStore } from '@/lib/store'
import type { ClientData, CampaignRecord } from '@/lib/store'

interface Props {
  clientData: ClientData | null
}

// ── Gráfico de linha SVG ─────────────────────────────────────────────────────
function TrendChart({ points, color, label, format }: {
  points: { x: string; y: number }[]
  color: string
  label: string
  format: (v: number) => string
}) {
  if (points.length < 2) return null
  const W = 100, H = 50, PAD = 4
  const ys = points.map(p => p.y)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const rangeY = maxY - minY || 1
  const toX = (i: number) => PAD + (i / (points.length - 1)) * (W - PAD * 2)
  const toY = (v: number) => PAD + (1 - (v - minY) / rangeY) * (H - PAD * 2)
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(p.y).toFixed(1)}`).join(' ')
  const last = points[points.length - 1]
  const prev = points[points.length - 2]
  const delta = last.y - prev.y
  const deltaColor = label.includes('CPL') ? (delta <= 0 ? '#22C55E' : '#FF4D4D') : (delta >= 0 ? '#22C55E' : '#FF4D4D')

  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
          <div className="font-display text-2xl font-bold mt-0.5" style={{ color }}>{format(last.y)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold" style={{ color: deltaColor }}>
            {delta > 0 ? '▲' : '▼'} {format(Math.abs(delta))}
          </div>
          <div className="text-[10px] text-slate-600 mt-0.5">vs período anterior</div>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 64 }}>
        <path
          d={`${d} L${toX(points.length - 1).toFixed(1)},${(H - PAD).toFixed(1)} L${PAD},${(H - PAD).toFixed(1)} Z`}
          fill={color} opacity={0.06}
        />
        <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={toX(i)} cy={toY(p.y)} r="1.8" fill={color} />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        {[points[0], points[points.length - 1]].map((p, i) => (
          <span key={i} className="text-[10px] text-slate-600">{p.x}</span>
        ))}
      </div>
    </div>
  )
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? '#22C55E' : score >= 60 ? '#F0B429' : '#FF4D4D'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-[#1E1E24] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-bold w-8 text-right" style={{ color }}>{score}</span>
    </div>
  )
}

// ── Formulário de entrada rápida de histórico ────────────────────────────────
function AddHistoryForm({ onClose }: { onClose: () => void }) {
  const { addCampaign } = useAppStore()
  const [form, setForm] = useState({
    channel: 'Meta Ads',
    period: '',
    budgetSpent: '',
    leads: '',
    conversions: '',
    revenue: '',
    outcome: 'neutra' as 'vencedora' | 'neutra' | 'perdedora',
    whatWorked: '',
    whatFailed: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  const u = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const cplPreview = form.budgetSpent && form.leads && Number(form.leads) > 0
    ? Math.round(Number(form.budgetSpent) / Number(form.leads))
    : null

  const CHANNELS = ['Meta Ads', 'Google Ads', 'Google Search', 'Google PMAX', 'TikTok Ads', 'YouTube Ads', 'LinkedIn Ads', 'Outro']
  const PERIODS_SUGG = (() => {
    const now = new Date()
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      return `${months[d.getMonth()]} ${d.getFullYear()}`
    })
  })()

  const handleSave = () => {
    if (!form.period || !form.budgetSpent) return
    setSaving(true)
    addCampaign({
      channel: form.channel,
      period: form.period,
      budgetSpent: Number(form.budgetSpent) || 0,
      leads: Number(form.leads) || 0,
      cplReal: 0, // calculado automaticamente pela store
      conversions: Number(form.conversions) || 0,
      revenue: Number(form.revenue) || 0,
      outcome: form.outcome,
      whatWorked: form.whatWorked,
      whatFailed: form.whatFailed,
      notes: form.notes,
    })
    setTimeout(() => { setSaving(false); onClose() }, 300)
  }

  const inputCls = 'w-full bg-[#0D0D10] border border-[#2A2A30] rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-slate-700 focus:outline-none focus:border-[#F0B429] transition-colors'

  return (
    <div className="bg-[#111114] border border-[#F0B42930] rounded-2xl p-5 animate-fade-up">
      <div className="flex items-center justify-between mb-4">
        <div className="font-display font-bold text-white text-sm">+ Registrar Período</div>
        <button onClick={onClose} className="text-slate-600 hover:text-slate-400 text-lg">×</button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Canal */}
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1.5">Canal de mídia</label>
          <div className="flex flex-wrap gap-1.5">
            {CHANNELS.map(c => (
              <button key={c} onClick={() => u('channel', c)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: form.channel === c ? 'rgba(240,180,41,0.12)' : '#16161A',
                  border: form.channel === c ? '1px solid rgba(240,180,41,0.4)' : '1px solid #2A2A30',
                  color: form.channel === c ? '#F0B429' : '#64748B',
                }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Período */}
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1.5">Período</label>
          <input type="text" className={inputCls} placeholder="Ex: Abr 2025, Q1 2025, Semana 1 Mai..."
            value={form.period} onChange={e => u('period', e.target.value)} />
          <div className="flex flex-wrap gap-1 mt-1.5">
            {PERIODS_SUGG.map(p => (
              <button key={p} onClick={() => u('period', p)}
                className="px-2 py-0.5 rounded text-[10px] transition-colors"
                style={{
                  background: form.period === p ? 'rgba(240,180,41,0.1)' : 'transparent',
                  color: form.period === p ? '#F0B429' : '#475569',
                  border: '1px solid #2A2A30',
                }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Métricas principais */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1.5">Gasto (R$) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-sm">R$</span>
              <input type="number" className={inputCls} style={{ paddingLeft: '2rem' }}
                placeholder="5000" value={form.budgetSpent} onChange={e => u('budgetSpent', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1.5">Leads gerados *</label>
            <input type="number" className={inputCls} placeholder="120"
              value={form.leads} onChange={e => u('leads', e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1.5">Vendas / Conversões</label>
            <input type="number" className={inputCls} placeholder="15"
              value={form.conversions} onChange={e => u('conversions', e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1.5">Receita gerada (R$)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-sm">R$</span>
              <input type="number" className={inputCls} style={{ paddingLeft: '2rem' }}
                placeholder="30000" value={form.revenue} onChange={e => u('revenue', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Preview CPL */}
        {cplPreview !== null && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(240,180,41,0.06)', border: '1px solid rgba(240,180,41,0.2)' }}>
            <span className="text-xs text-slate-500">CPL calculado:</span>
            <span className="text-sm font-bold text-[#F0B429]">R${cplPreview}</span>
            {form.revenue && form.budgetSpent && Number(form.budgetSpent) > 0 && (
              <>
                <span className="text-xs text-slate-600">·</span>
                <span className="text-xs text-slate-500">ROAS:</span>
                <span className="text-sm font-bold text-[#22C55E]">{(Number(form.revenue) / Number(form.budgetSpent)).toFixed(1)}×</span>
              </>
            )}
          </div>
        )}

        {/* Resultado */}
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1.5">Resultado do período</label>
          <div className="grid grid-cols-3 gap-2">
            {(['vencedora', 'neutra', 'perdedora'] as const).map(o => (
              <button key={o} onClick={() => setForm(f => ({ ...f, outcome: o }))}
                className="py-2 rounded-xl text-xs font-bold transition-all capitalize"
                style={{
                  background: form.outcome === o
                    ? o === 'vencedora' ? 'rgba(34,197,94,0.12)' : o === 'perdedora' ? 'rgba(255,77,77,0.12)' : 'rgba(240,180,41,0.12)'
                    : '#16161A',
                  border: form.outcome === o
                    ? o === 'vencedora' ? '1px solid rgba(34,197,94,0.4)' : o === 'perdedora' ? '1px solid rgba(255,77,77,0.4)' : '1px solid rgba(240,180,41,0.4)'
                    : '1px solid #2A2A30',
                  color: form.outcome === o
                    ? o === 'vencedora' ? '#22C55E' : o === 'perdedora' ? '#FF4D4D' : '#F0B429'
                    : '#64748B',
                }}>
                {o === 'vencedora' ? '✓ Vencedora' : o === 'perdedora' ? '✕ Perdedora' : '— Neutra'}
              </button>
            ))}
          </div>
        </div>

        {/* O que funcionou / falhou */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-[#22C55E] uppercase tracking-wider block mb-1.5">O que funcionou</label>
            <textarea className={inputCls} rows={2} style={{ resize: 'none' }}
              placeholder="Ex: Criativo de antes/depois, público LAL..."
              value={form.whatWorked} onChange={e => u('whatWorked', e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] text-[#FF4D4D] uppercase tracking-wider block mb-1.5">O que falhou</label>
            <textarea className={inputCls} rows={2} style={{ resize: 'none' }}
              placeholder="Ex: CPL subiu na 3ª semana, CBO instável..."
              value={form.whatFailed} onChange={e => u('whatFailed', e.target.value)} />
          </div>
        </div>

        {/* Botão salvar */}
        <button
          onClick={handleSave}
          disabled={!form.period || !form.budgetSpent || saving}
          className="w-full py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)', color: '#000' }}
        >
          {saving ? 'Salvando...' : '+ Registrar no Histórico'}
        </button>
      </div>
    </div>
  )
}

// ── Tabela de histórico ──────────────────────────────────────────────────────
function HistoryTable({ records, onDelete }: { records: CampaignRecord[]; onDelete: (id: string) => void }) {
  const [confirmDel, setConfirmDel] = useState<string | null>(null)

  if (records.length === 0) return null

  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#2A2A30] flex items-center justify-between">
        <div>
          <div className="font-display font-bold text-white text-sm">Histórico de Campanhas</div>
          <div className="text-[10px] text-slate-600 mt-0.5">{records.length} períodos registrados</div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1E1E24]">
              {['Período', 'Canal', 'Gasto', 'Leads', 'CPL Real', 'Vendas', 'ROAS', 'Resultado', ''].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-slate-600 uppercase tracking-wider font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((r) => {
              const roas = r.revenue > 0 && r.budgetSpent > 0 ? (r.revenue / r.budgetSpent).toFixed(1) : '—'
              const outcomeColor = r.outcome === 'vencedora' ? '#22C55E' : r.outcome === 'perdedora' ? '#FF4D4D' : '#F0B429'
              return (
                <tr key={r.id} className="border-b border-[#1E1E24] last:border-0 hover:bg-[#16161A] transition-colors">
                  <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{r.period}</td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{r.channel}</td>
                  <td className="px-4 py-3 text-slate-300 whitespace-nowrap">R${r.budgetSpent.toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3 text-slate-300">{r.leads}</td>
                  <td className="px-4 py-3 font-bold whitespace-nowrap"
                    style={{ color: r.cplReal > 0 ? '#F0B429' : '#64748B' }}>
                    {r.cplReal > 0 ? `R$${r.cplReal}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{r.conversions || '—'}</td>
                  <td className="px-4 py-3 font-bold" style={{ color: roas !== '—' ? '#22C55E' : '#64748B' }}>
                    {roas !== '—' ? `${roas}×` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold capitalize"
                      style={{ color: outcomeColor, background: `${outcomeColor}15` }}>
                      {r.outcome}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {confirmDel === r.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => { onDelete(r.id); setConfirmDel(null) }}
                          className="text-[10px] text-red-400 hover:text-red-300">Confirmar</button>
                        <span className="text-slate-700">·</span>
                        <button onClick={() => setConfirmDel(null)} className="text-[10px] text-slate-600">Cancelar</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDel(r.id)} className="text-slate-700 hover:text-slate-500 text-sm">×</button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function TabPerformance({ clientData }: Props) {
  const niche  = clientData?.niche || ''
  const budget = clientData?.budget || 0
  const bench  = getBenchmark(niche)
  const proj   = bench && budget > 0 ? computeNicheProjection(bench, budget) : null
  const content = getNicheContent(niche)

  const { campaignHistory, deleteCampaign } = useAppStore()
  const [showAddForm, setShowAddForm] = useState(false)

  const byPeriod: Record<string, { spend: number; leads: number; revenue: number; count: number }> = {}
  for (const r of campaignHistory) {
    if (!byPeriod[r.period]) byPeriod[r.period] = { spend: 0, leads: 0, revenue: 0, count: 0 }
    byPeriod[r.period].spend   += r.budgetSpent
    byPeriod[r.period].leads   += r.leads
    byPeriod[r.period].revenue += r.revenue
    byPeriod[r.period].count   += 1
  }
  const periods     = Object.keys(byPeriod).sort()
  const cplPoints   = periods.map(x => ({ x, y: byPeriod[x].leads > 0 ? Math.round(byPeriod[x].spend / byPeriod[x].leads) : 0 }))
  const roasPoints  = periods.map(x => ({ x, y: byPeriod[x].spend > 0 ? +((byPeriod[x].revenue / byPeriod[x].spend).toFixed(1)) : 0 }))
  const hasTrend    = periods.length >= 2

  // KPIs reais se houver histórico, senão projeção
  const lastPeriodData = periods.length > 0 ? byPeriod[periods[periods.length - 1]] : null
  const realCPL  = lastPeriodData && lastPeriodData.leads > 0 ? Math.round(lastPeriodData.spend / lastPeriodData.leads) : null
  const realROAS = lastPeriodData && lastPeriodData.spend > 0 && lastPeriodData.revenue > 0 ? +(lastPeriodData.revenue / lastPeriodData.spend).toFixed(1) : null

  const stats = realCPL
    ? [
        { label: 'CPL Real (último período)', value: `R$${realCPL}`, sub: 'baseado no histórico real', color: '#F0B429' },
        { label: 'ROAS Real', value: realROAS ? `${realROAS}×` : '—', sub: 'último período', color: '#22C55E' },
        { label: 'Leads (último período)', value: lastPeriodData!.leads.toString(), sub: 'do histórico registrado', color: '#A78BFA' },
        { label: 'Gasto (último período)', value: `R$${lastPeriodData!.spend.toLocaleString('pt-BR')}`, sub: 'investimento real', color: '#38BDF8' },
      ]
    : proj
    ? [
        { label: 'Impressões est.',  value: `${Math.round(proj.leadsMonth * 150 / 1000)}K`, sub: 'projeção mensal',    color: '#F0B429' },
        { label: 'CTR estimado',     value: `3.0%`,                                          sub: 'benchmark do nicho', color: '#22C55E' },
        { label: 'Leads / mês',      value: `${proj.leadsMin}–${proj.leadsMax}`,              sub: 'faixa estimada',    color: '#A78BFA' },
        { label: 'Investimento',     value: `R$${budget.toLocaleString('pt-BR')}`,            sub: 'budget configurado', color: '#38BDF8' },
      ]
    : [
        { label: 'Impressões',  value: '—', sub: 'sem histórico', color: '#F0B429' },
        { label: 'CTR',         value: '—', sub: 'sem histórico', color: '#22C55E' },
        { label: 'Leads',       value: '—', sub: 'sem histórico', color: '#A78BFA' },
        { label: 'Gasto total', value: '—', sub: 'sem histórico', color: '#38BDF8' },
      ]

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} color={s.color} delay={i * 0.08} />
        ))}
      </div>

      {/* Seção de Histórico */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">📅</span>
            <span className="font-display font-bold text-white">Histórico de Campanhas</span>
            <span className="text-xs text-slate-600">{campaignHistory.length > 0 ? `${campaignHistory.length} períodos` : 'vazio'}</span>
          </div>
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{
              background: showAddForm ? 'rgba(240,180,41,0.15)' : 'rgba(240,180,41,0.08)',
              border: '1px solid rgba(240,180,41,0.3)',
              color: '#F0B429',
            }}
          >
            {showAddForm ? '▲ Fechar' : '+ Registrar Período'}
          </button>
        </div>

        {showAddForm && (
          <div className="mb-4">
            <AddHistoryForm onClose={() => setShowAddForm(false)} />
          </div>
        )}

        {campaignHistory.length === 0 && !showAddForm ? (
          <div className="bg-[#111114] border border-dashed border-[#2A2A30] rounded-2xl p-8 text-center">
            <div className="text-3xl mb-3 opacity-20">📋</div>
            <div className="text-sm font-semibold text-white mb-1">Sem histórico registrado</div>
            <p className="text-xs text-slate-500 mb-4">
              Registre os resultados de cada período para visualizar a tendência de CPL e ROAS ao longo do tempo.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
              style={{ background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.3)', color: '#F0B429' }}
            >
              + Registrar primeiro período
            </button>
          </div>
        ) : (
          <HistoryTable records={campaignHistory} onDelete={deleteCampaign} />
        )}
      </div>

      {/* Tendência histórica */}
      {hasTrend && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📈</span>
            <div className="font-display font-bold text-white">Tendência de Performance</div>
            <span className="text-[10px] text-slate-600 ml-1">{periods.length} períodos</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <TrendChart points={cplPoints} color="#F0B429" label="CPL Médio" format={v => `R$${v}`} />
            <TrendChart points={roasPoints} color="#22C55E" label="ROAS" format={v => `${v}×`} />
          </div>
        </div>
      )}

      {/* Tabela de criativos */}
      <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2A2A30]">
          <h3 className="font-display font-bold text-white">Criativos Recomendados por IA</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Score baseado em benchmark de CTR e CPL para {niche || 'o nicho'}
          </p>
        </div>
        <div className="grid grid-cols-12 px-6 py-3 text-xs text-slate-500 uppercase tracking-wider border-b border-[#1E1E24]">
          <span className="col-span-5">Formato / Ângulo</span>
          <span className="col-span-2">Canal</span>
          <span className="col-span-3">Score IA</span>
          <span className="col-span-2">Status</span>
        </div>
        {content.creatives.map((c, i) => (
          <div key={c.name}
            className="grid grid-cols-12 px-6 py-4 items-center border-b border-[#1E1E24] last:border-0 hover:bg-[#16161A] transition-colors animate-fade-up"
            style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="col-span-5">
              <span className="text-sm text-white font-medium leading-tight">{c.name}</span>
            </div>
            <div className="col-span-2">
              <span className="text-xs text-slate-500">{c.channel}</span>
            </div>
            <div className="col-span-3">
              <ScoreBar score={c.score} />
            </div>
            <div className="col-span-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ color: c.statusColor, background: `${c.statusColor}18` }}>
                {c.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* CPL por canal (benchmark) */}
      {bench && (
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
          <div className="font-display font-bold text-white mb-3">🎯 CPL Benchmark por Canal · {niche}</div>
          <div className="grid md:grid-cols-2 gap-3">
            {Object.entries(bench.cpl_by_channel).map(([canal, cpl]) => (
              <div key={canal} className="flex items-center justify-between p-3 bg-[#16161A] rounded-xl">
                <span className="text-sm text-slate-300">{canal}</span>
                <span className="text-sm font-bold text-[#F0B429]">{cpl}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
