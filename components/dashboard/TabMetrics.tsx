// components/dashboard/TabMetrics.tsx — Registro de métricas reais com alerta vs benchmark
'use client'

import { useState, useEffect } from 'react'
import { getBenchmark } from '@/lib/niche_benchmarks'
import type { ClientData } from '@/lib/store'

const CHANNELS = [
  'Meta Ads', 'Google Search', 'Google Shopping', 'Google PMAX',
  'YouTube Ads', 'Instagram Ads', 'TikTok Ads', 'LinkedIn Ads', 'Orgânico',
]

interface Props {
  clientData: ClientData | null
}

export function TabMetrics({ clientData }: Props) {
  const [metrics, setMetrics] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState<any>(null)
  const [form, setForm] = useState({
    channel: 'Meta Ads',
    periodMonth: new Date().toISOString().slice(0, 7),
    spendReal: '',
    leadsReal: '',
    salesReal: '',
    revenueReal: '',
    notes: '',
  })

  const bench = getBenchmark(clientData?.niche || '')

  // Carrega métricas salvas (mock userId por enquanto — substituir pelo userId do Clerk)
  useEffect(() => {
    const userId = 'demo-user'
    if (!clientData) return
    fetch(`/api/metrics?userId=${userId}&clientName=${encodeURIComponent(clientData.clientName)}`)
      .then((r) => r.json())
      .then((j) => setMetrics(j.data || []))
      .catch(() => {})
  }, [clientData])

  const handleSave = async () => {
    if (!clientData) return
    setLoading(true)
    setAlert(null)
    try {
      const res = await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user',
          clientName: clientData.clientName,
          niche: clientData.niche,
          channel: form.channel,
          periodMonth: form.periodMonth + '-01',
          spendReal: Number(form.spendReal),
          leadsReal: Number(form.leadsReal),
          salesReal: Number(form.salesReal),
          revenueReal: Number(form.revenueReal),
          notes: form.notes,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setAlert(json.benchmarkAlert)
        setMetrics((m) => [json.data, ...m])
        setForm((f) => ({ ...f, spendReal: '', leadsReal: '', salesReal: '', revenueReal: '', notes: '' }))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const totalSpend   = metrics.reduce((s, m) => s + (m.spend_real || 0), 0)
  const totalLeads   = metrics.reduce((s, m) => s + (m.leads_real || 0), 0)
  const totalRevenue = metrics.reduce((s, m) => s + (m.revenue_real || 0), 0)
  const blendedCPL   = totalLeads > 0 ? totalSpend / totalLeads : 0
  const blendedROAS  = totalSpend > 0 ? totalRevenue / totalSpend : 0

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-white">Métricas Reais</h2>

      {/* Benchmark do nicho */}
      {bench && (
        <div className="rounded-2xl p-5" style={{
          background: 'rgba(240,180,41,0.05)',
          border: '1px solid rgba(240,180,41,0.2)',
        }}>
          <div className="text-xs text-[#F0B429] font-semibold uppercase tracking-widest mb-3">
            📊 Benchmark: {clientData?.niche}
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="font-display text-lg font-bold text-white">R${bench.cpl_min}–{bench.cpl_max}</div>
              <div className="text-xs text-slate-500 mt-0.5">CPL médio do nicho</div>
            </div>
            <div>
              <div className="font-display text-lg font-bold text-[#22C55E]">{bench.kpi_thresholds.roas_good}×</div>
              <div className="text-xs text-slate-500 mt-0.5">ROAS bom</div>
            </div>
            <div>
              <div className="font-display text-lg font-bold text-[#A78BFA]">
                {(bench.cvr_lead_to_sale * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-slate-500 mt-0.5">CVR lead→venda</div>
            </div>
          </div>
        </div>
      )}

      {/* Totais acumulados */}
      {metrics.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Investimento total', value: `R$${totalSpend.toLocaleString('pt-BR')}`, color: '#F0B429' },
            { label: 'Leads gerados', value: totalLeads.toString(), color: '#22C55E' },
            {
              label: 'CPL real',
              value: `R$${Math.round(blendedCPL)}`,
              color: bench
                ? blendedCPL < bench.cpl_min ? '#22C55E'
                : blendedCPL <= bench.cpl_max ? '#F0B429'
                : '#FF4D4D'
                : '#38BDF8',
            },
            {
              label: 'ROAS real',
              value: `${blendedROAS.toFixed(1)}×`,
              color: bench && blendedROAS >= bench.kpi_thresholds.roas_good ? '#22C55E' : '#FF4D4D',
            },
          ].map((m) => (
            <div key={m.label} className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-4 text-center">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{m.label}</div>
              <div className="font-display text-xl font-bold" style={{ color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Formulário de registro */}
      <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-6">
        <h3 className="font-display font-bold text-white mb-4">Registrar métricas do período</h3>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider block mb-2">Canal</label>
            <select
              value={form.channel}
              onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
              className="w-full bg-[#16161A] border border-[#2A2A30] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F0B429]"
            >
              {CHANNELS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider block mb-2">Mês de referência</label>
            <input
              type="month"
              value={form.periodMonth}
              onChange={(e) => setForm((f) => ({ ...f, periodMonth: e.target.value }))}
              className="w-full bg-[#16161A] border border-[#2A2A30] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F0B429]"
            />
          </div>
          {[
            { key: 'spendReal',   label: 'Investimento (R$)', placeholder: '5000' },
            { key: 'leadsReal',   label: 'Leads gerados',     placeholder: '120'  },
            { key: 'salesReal',   label: 'Vendas realizadas', placeholder: '18'   },
            { key: 'revenueReal', label: 'Receita (R$)',       placeholder: '22000'},
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs text-slate-500 uppercase tracking-wider block mb-2">{label}</label>
              <input
                type="number"
                placeholder={placeholder}
                value={(form as any)[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full bg-[#16161A] border border-[#2A2A30] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F0B429]"
              />
            </div>
          ))}
        </div>
        <textarea
          placeholder="Observações (opcional)..."
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={2}
          className="w-full bg-[#16161A] border border-[#2A2A30] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F0B429] resize-none mb-4"
        />
        <button
          onClick={handleSave}
          disabled={loading || !form.spendReal}
          className="w-full py-3 rounded-xl font-bold text-black transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)' }}
        >
          {loading ? '💾 Salvando...' : '💾 Salvar métricas'}
        </button>
      </div>

      {/* Alerta benchmark após salvar */}
      {alert && (
        <div className="rounded-2xl p-5 animate-fade-up" style={{
          background: alert.cplStatus === 'excelente' ? 'rgba(34,197,94,0.08)' :
                      alert.cplStatus === 'bom'       ? 'rgba(240,180,41,0.08)' :
                      'rgba(255,77,77,0.08)',
          border: `1px solid ${alert.cplStatus === 'excelente' ? 'rgba(34,197,94,0.3)' : alert.cplStatus === 'bom' ? 'rgba(240,180,41,0.3)' : 'rgba(255,77,77,0.3)'}`,
        }}>
          <div className="font-semibold text-white mb-2">
            {alert.cplStatus === 'excelente' ? '🟢 CPL excelente — abaixo do benchmark!' :
             alert.cplStatus === 'bom'       ? '🟡 CPL dentro do esperado para o nicho' :
             '🔴 CPL acima do benchmark — revise segmentação'}
          </div>
          <div className="text-sm text-slate-400">
            Seu CPL: <strong className="text-white">R${alert.realCPL}</strong> ·
            Benchmark do nicho: <strong className="text-white">R${alert.benchCPLMin}–{alert.benchCPLMax}</strong>
            {alert.realROAS > 0 && (
              <> · ROAS: <strong className={alert.roasStatus === 'bom' ? 'text-[#22C55E]' : 'text-[#FF4D4D]'}>{alert.realROAS}×</strong> (meta {alert.benchROAS}×)</>
            )}
          </div>
        </div>
      )}

      {/* Lista de métricas salvas */}
      {metrics.length > 0 && (
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2A2A30]">
            <h3 className="font-display font-bold text-white">Histórico de métricas</h3>
          </div>
          {metrics.slice(0, 10).map((m) => {
            const cpl = m.leads_real > 0 ? Math.round(m.spend_real / m.leads_real) : 0
            const roas = m.spend_real > 0 ? (m.revenue_real / m.spend_real).toFixed(1) : '—'
            return (
              <div key={m.id} className="px-6 py-3 border-b border-[#1E1E24] last:border-0 flex items-center justify-between hover:bg-[#16161A] transition-colors">
                <div>
                  <div className="text-sm font-semibold text-white">{m.channel}</div>
                  <div className="text-xs text-slate-500">{m.period_month?.slice(0, 7)}</div>
                </div>
                <div className="flex items-center gap-6 text-sm text-right">
                  <div>
                    <div className="text-xs text-slate-500">Investido</div>
                    <div className="font-semibold text-white">R${m.spend_real?.toLocaleString('pt-BR')}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Leads</div>
                    <div className="font-semibold text-[#22C55E]">{m.leads_real}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">CPL</div>
                    <div className="font-semibold text-[#F0B429]">R${cpl}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">ROAS</div>
                    <div className="font-semibold text-[#A78BFA]">{roas}×</div>
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
