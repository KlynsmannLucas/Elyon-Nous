// components/dashboard/TabDiagnostic.tsx — Diagnóstico estratégico do negócio (saúde financeira, riscos, escala)
'use client'

import { useState } from 'react'
import { getBenchmark } from '@/lib/niche_benchmarks'
import { useAppStore } from '@/lib/store'
import type { ClientData } from '@/lib/store'

interface Props {
  clientData: ClientData | null
  strategy: Record<string, any>
  analysis: Record<string, any>
}

function RiskBadge({ level }: { level: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    critico:  { label: 'CRÍTICO',  color: '#FF4D4D', bg: 'rgba(255,77,77,0.1)' },
    alto:     { label: 'ALTO',     color: '#FB923C', bg: 'rgba(251,146,60,0.1)' },
    medio:    { label: 'MÉDIO',    color: '#F0B429', bg: 'rgba(240,180,41,0.1)' },
    baixo:    { label: 'BAIXO',    color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
    alta:     { label: 'ALTA',     color: '#FF4D4D', bg: 'rgba(255,77,77,0.1)' },
    media:    { label: 'MÉDIA',    color: '#F0B429', bg: 'rgba(240,180,41,0.1)' },
  }
  const s = map[level?.toLowerCase()] || map.medio
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
      style={{ color: s.color, background: s.bg }}>
      {s.label}
    </span>
  )
}

function StatusDot({ status }: { status: string }) {
  const c = status === 'saudavel' ? '#22C55E' : status === 'problema' ? '#FF4D4D' : '#64748B'
  const label = status === 'saudavel' ? 'Saudável' : status === 'problema' ? 'Problema' : 'Não auditado'
  return (
    <span className="flex items-center gap-1.5 text-xs" style={{ color: c }}>
      <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ background: c }} />
      {label}
    </span>
  )
}

function MetricCard({ label, value, sub, color, tip }: { label: string; value: string; sub?: string; color: string; tip?: string }) {
  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-4">
      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="font-display text-2xl font-bold" style={{ color }}>{value}</div>
      {sub && <div className="text-[11px] text-slate-600 mt-0.5">{sub}</div>}
      {tip && <div className="text-[10px] text-slate-700 mt-1 italic">{tip}</div>}
    </div>
  )
}

export function TabDiagnostic({ clientData, strategy, analysis }: Props) {
  const { campaignHistory, auditCache } = useAppStore()
  const [diagnostic, setDiagnostic] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const bench = getBenchmark(clientData?.niche || '')

  // Pega os dados reais da última auditoria disponível
  const clientAudits = auditCache[clientData?.clientName || ''] || []
  const lastAudit = clientAudits[0]?.audit
  const auditRealMetrics = lastAudit?._realMetrics || null

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientData?.clientName,
          niche: clientData?.niche,
          budget: clientData?.budget,
          monthlyRevenue: clientData?.monthlyRevenue,
          ticketPrice: clientData?.ticketPrice,
          grossMargin: clientData?.grossMargin,
          conversionRate: clientData?.conversionRate,
          isRecurring: clientData?.isRecurring,
          currentCPL: clientData?.currentCPL,
          mainChallenge: clientData?.mainChallenge,
          currentLeadSource: clientData?.currentLeadSource,
          campaignHistory: campaignHistory.slice(0, 12),
          auditRealMetrics,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setDiagnostic(json.diagnostic)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const gradeColor: Record<string, string> = {
    'A+': '#22C55E', A: '#22C55E', 'A-': '#22C55E',
    'B+': '#F0B429', B: '#F0B429', 'B-': '#F0B429',
    'C+': '#FB923C', C: '#FB923C', D: '#FF4D4D',
  }

  const sustColor = { sustentavel: '#22C55E', fragil: '#F0B429', insustentavel: '#FF4D4D' }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-white mb-1">Diagnóstico Estratégico do Negócio</h2>
          <p className="text-slate-500 text-sm">
            Saúde financeira, viabilidade de escala, riscos críticos e recomendação prioritária.
            <span className="text-slate-600"> · Distinto da Auditoria (que analisa campanhas).</span>
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading || !clientData}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)', color: '#000' }}
        >
          {loading ? '⚡ Diagnosticando...' : '⚡ Gerar Diagnóstico'}
        </button>
      </div>

      {/* Contexto de dados disponíveis */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: 'Budget configurado', value: clientData?.budget ? `R$${clientData.budget.toLocaleString('pt-BR')}` : '—', ok: !!clientData?.budget },
          { label: 'Ticket médio', value: clientData?.ticketPrice ? `R$${clientData.ticketPrice.toLocaleString('pt-BR')}` : '—', ok: !!clientData?.ticketPrice },
          { label: 'Histórico de campanhas', value: `${campaignHistory.length} períodos`, ok: campaignHistory.length >= 2 },
          { label: 'Última auditoria', value: lastAudit ? 'Disponível' : 'Sem dados', ok: !!lastAudit },
        ].map((item) => (
          <div key={item.label} className="bg-[#111114] border border-[#2A2A30] rounded-xl p-3 flex items-center gap-2">
            <span className="text-xs" style={{ color: item.ok ? '#22C55E' : '#64748B' }}>{item.ok ? '✓' : '○'}</span>
            <div>
              <div className="text-[10px] text-slate-600">{item.label}</div>
              <div className="text-xs font-semibold text-white">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* Resultado */}
      {diagnostic && (
        <div className="space-y-5 animate-fade-up">

          {/* Score + Grade + Summary */}
          <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Saúde Estratégica do Negócio</div>
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-5xl font-bold" style={{ color: gradeColor[diagnostic.grade] || '#F0B429' }}>
                    {diagnostic.grade}
                  </span>
                  <span className="text-2xl font-bold text-slate-400">{diagnostic.health_score}/100</span>
                </div>
              </div>
              {diagnostic.saude_financeira?.sustentabilidade && (
                <div className="text-center">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Modelo de Aquisição</div>
                  <span className="px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider"
                    style={{
                      color: (sustColor as any)[diagnostic.saude_financeira.sustentabilidade] || '#F0B429',
                      background: `${(sustColor as any)[diagnostic.saude_financeira.sustentabilidade] || '#F0B429'}15`,
                      border: `1px solid ${(sustColor as any)[diagnostic.saude_financeira.sustentabilidade] || '#F0B429'}40`,
                    }}>
                    {diagnostic.saude_financeira.sustentabilidade}
                  </span>
                </div>
              )}
            </div>
            <div className="h-2 bg-[#1E1E24] rounded-full mb-4 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${diagnostic.health_score}%`, background: `linear-gradient(90deg, ${gradeColor[diagnostic.grade] || '#F0B429'}, ${gradeColor[diagnostic.grade] || '#F0B429'}88)` }} />
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{diagnostic.executive_summary}</p>
          </div>

          {/* Saúde Financeira */}
          {diagnostic.saude_financeira && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">💰</span>
                <span className="font-display font-bold text-white">Unit Economics & Saúde Financeira</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                <MetricCard
                  label="ROAS Break-even"
                  value={`${diagnostic.saude_financeira.break_even_roas}×`}
                  sub="ROAS mínimo para não ter prejuízo"
                  color="#F0B429"
                  tip="Abaixo disso = prejuízo"
                />
                <MetricCard
                  label="CPL Máximo Lucrativo"
                  value={`R$${diagnostic.saude_financeira.cpl_maximo_lucrativo}`}
                  sub="Acima disso = gasta mais do que ganha"
                  color="#FF4D4D"
                  tip="Piso de pausa de campanhas"
                />
                <MetricCard
                  label="LTV Estimado"
                  value={`R$${(diagnostic.saude_financeira.ltv_estimado || 0).toLocaleString('pt-BR')}`}
                  sub="Valor vitalício do cliente"
                  color="#22C55E"
                />
                <MetricCard
                  label="LTV:CAC"
                  value={`${diagnostic.saude_financeira.ltv_cac_ratio}×`}
                  sub="Mínimo saudável = 3×"
                  color={diagnostic.saude_financeira.ltv_cac_ratio >= 3 ? '#22C55E' : diagnostic.saude_financeira.ltv_cac_ratio >= 1.5 ? '#F0B429' : '#FF4D4D'}
                  tip={diagnostic.saude_financeira.ltv_cac_ratio >= 3 ? 'Modelo saudável para escalar' : 'Otimizar antes de escalar'}
                />
                <MetricCard
                  label="CAC Payback"
                  value={`${diagnostic.saude_financeira.cac_payback_meses} ${diagnostic.saude_financeira.cac_payback_meses === 1 ? 'mês' : 'meses'}`}
                  sub="Tempo para recuperar custo"
                  color={diagnostic.saude_financeira.cac_payback_meses <= 3 ? '#22C55E' : diagnostic.saude_financeira.cac_payback_meses <= 6 ? '#F0B429' : '#FF4D4D'}
                />
                {diagnostic.prontidao_para_escalar?.projecao_escala?.receita_projetada > 0 && (
                  <MetricCard
                    label="Receita com Budget 2×"
                    value={`R$${(diagnostic.prontidao_para_escalar.projecao_escala.receita_projetada || 0).toLocaleString('pt-BR')}`}
                    sub="Projeção ao dobrar investimento"
                    color="#A78BFA"
                  />
                )}
              </div>
              <div className="bg-[#16161A] border border-[#2A2A30] rounded-xl p-4">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Interpretação</div>
                <p className="text-sm text-slate-300 leading-relaxed">{diagnostic.saude_financeira.interpretacao}</p>
              </div>
            </div>
          )}

          {/* Matriz de Risco */}
          {diagnostic.matriz_risco?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">⚠️</span>
                <span className="font-display font-bold text-white">Matriz de Risco</span>
                <span className="text-xs text-slate-600 ml-1">ranqueada por impacto</span>
              </div>
              <div className="space-y-2">
                {diagnostic.matriz_risco.map((r: any, i: number) => (
                  <div key={i} className="bg-[#111114] border border-[#2A2A30] rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{
                            background: r.impacto === 'critico' ? 'rgba(255,77,77,0.15)' : r.impacto === 'alto' ? 'rgba(251,146,60,0.15)' : 'rgba(240,180,41,0.15)',
                            color: r.impacto === 'critico' ? '#FF4D4D' : r.impacto === 'alto' ? '#FB923C' : '#F0B429',
                          }}>
                          {i + 1}
                        </span>
                        <span className="text-sm font-semibold text-white">{r.risco}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <RiskBadge level={r.probabilidade} />
                        <RiskBadge level={r.impacto} />
                      </div>
                    </div>
                    <div className="flex items-start gap-2 pl-8">
                      <span className="text-[#22C55E] text-xs mt-0.5 flex-shrink-0">→</span>
                      <span className="text-xs text-slate-500 leading-relaxed">{r.mitigacao}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prontidão para Escalar */}
          {diagnostic.prontidao_para_escalar && (
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🚀</span>
                  <span className="font-display font-bold text-white">Prontidão para Escalar</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-[#1E1E24] rounded-full overflow-hidden">
                    <div className="h-full rounded-full"
                      style={{
                        width: `${diagnostic.prontidao_para_escalar.score}%`,
                        background: diagnostic.prontidao_para_escalar.pode_escalar_agora ? '#22C55E' : '#F0B429',
                      }} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: diagnostic.prontidao_para_escalar.pode_escalar_agora ? '#22C55E' : '#F0B429' }}>
                    {diagnostic.prontidao_para_escalar.score}/100
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      color: diagnostic.prontidao_para_escalar.pode_escalar_agora ? '#22C55E' : '#F0B429',
                      background: diagnostic.prontidao_para_escalar.pode_escalar_agora ? 'rgba(34,197,94,0.1)' : 'rgba(240,180,41,0.1)',
                    }}>
                    {diagnostic.prontidao_para_escalar.pode_escalar_agora ? '✓ Pode escalar' : '⚠ Não escalar ainda'}
                  </span>
                </div>
              </div>

              {diagnostic.prontidao_para_escalar.prerequisitos_faltando?.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Pré-requisitos faltando antes de escalar:</div>
                  <div className="space-y-1.5">
                    {diagnostic.prontidao_para_escalar.prerequisitos_faltando.map((p: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-[#FF4D4D] flex-shrink-0 mt-0.5">✕</span>
                        <span className="text-slate-400">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-[#16161A] rounded-xl p-3">
                <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Quando e como escalar</div>
                <p className="text-sm text-slate-300">{diagnostic.prontidao_para_escalar.quando_escalar}</p>
              </div>

              {diagnostic.prontidao_para_escalar.projecao_escala && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {[
                    { label: 'Budget 2×', value: `R$${(diagnostic.prontidao_para_escalar.projecao_escala.budget_2x || 0).toLocaleString('pt-BR')}`, color: '#38BDF8' },
                    { label: 'Leads proj.', value: (diagnostic.prontidao_para_escalar.projecao_escala.leads_projetados || 0).toLocaleString('pt-BR'), color: '#A78BFA' },
                    { label: 'Receita proj.', value: `R$${(diagnostic.prontidao_para_escalar.projecao_escala.receita_projetada || 0).toLocaleString('pt-BR')}`, color: '#22C55E' },
                  ].map((m) => (
                    <div key={m.label} className="bg-[#111114] border border-[#2A2A30] rounded-xl p-3 text-center">
                      <div className="text-[10px] text-slate-500 mb-0.5">{m.label}</div>
                      <div className="font-bold text-sm" style={{ color: m.color }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Diagnóstico do Funil */}
          {diagnostic.diagnostico_funil && (
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-base">🔬</span>
                <span className="font-display font-bold text-white">Diagnóstico do Funil</span>
                <span className="text-xs px-2 py-0.5 rounded-full ml-1"
                  style={{
                    color: diagnostic.diagnostico_funil.gargalo_principal === 'trafego' ? '#FF4D4D' : '#F0B429',
                    background: diagnostic.diagnostico_funil.gargalo_principal === 'trafego' ? 'rgba(255,77,77,0.1)' : 'rgba(240,180,41,0.1)',
                  }}>
                  Gargalo: {diagnostic.diagnostico_funil.gargalo_principal}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                {diagnostic.diagnostico_funil.etapas?.map((e: any, i: number) => (
                  <div key={i} className="flex items-center justify-between gap-3 p-3 bg-[#16161A] rounded-xl">
                    <span className="text-sm text-white font-medium min-w-0 flex-1">{e.etapa}</span>
                    <span className="text-xs text-slate-500 flex-1 hidden md:block">{e.observacao}</span>
                    <StatusDot status={e.status} />
                  </div>
                ))}
              </div>
              {diagnostic.diagnostico_funil.impacto_financeiro && (
                <div className="bg-[#16161A] rounded-xl p-3">
                  <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Impacto Financeiro</div>
                  <p className="text-sm text-slate-300">{diagnostic.diagnostico_funil.impacto_financeiro}</p>
                </div>
              )}
            </div>
          )}

          {/* Recomendação Principal */}
          {diagnostic.recomendacao_principal && (
            <div className="rounded-2xl p-5" style={{ background: 'rgba(240,180,41,0.05)', border: '1px solid rgba(240,180,41,0.25)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">🎯</span>
                <span className="font-display font-bold text-white">Recomendação Principal</span>
                <span className="text-xs text-slate-600">uma ação que muda tudo</span>
              </div>
              <div className="text-base font-bold text-[#F0B429] mb-2">{diagnostic.recomendacao_principal.titulo}</div>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">{diagnostic.recomendacao_principal.descricao}</p>
              <div className="grid md:grid-cols-3 gap-3">
                {[
                  { label: '⚡ Esta semana', text: diagnostic.recomendacao_principal.acao_semana_1, color: '#FF4D4D' },
                  { label: '📅 Mês 1', text: diagnostic.recomendacao_principal.acao_mes_1, color: '#F0B429' },
                  { label: '📈 Trimestre', text: diagnostic.recomendacao_principal.acao_trimestre, color: '#22C55E' },
                ].map((a) => (
                  <div key={a.label} className="bg-[#16161A] rounded-xl p-3 border border-[#2A2A30]">
                    <div className="text-xs font-bold mb-1.5" style={{ color: a.color }}>{a.label}</div>
                    <p className="text-xs text-slate-400 leading-relaxed">{a.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Benchmark do nicho */}
          {diagnostic.benchmark_comparativo && (
            <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">📊</span>
                <span className="font-display font-bold text-white">Benchmark do Nicho — {clientData?.niche}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'CPL atual', value: diagnostic.benchmark_comparativo.cpl_atual > 0 ? `R$${diagnostic.benchmark_comparativo.cpl_atual}` : '—', color: '#38BDF8' },
                  { label: 'CPL benchmark', value: `R$${diagnostic.benchmark_comparativo.cpl_benchmark}`, color: '#F0B429' },
                  { label: 'ROAS break-even', value: `${diagnostic.benchmark_comparativo.roas_break_even}×`, color: '#A78BFA' },
                  { label: 'ROAS bom (nicho)', value: `${diagnostic.benchmark_comparativo.roas_bom_nicho}×`, color: '#22C55E' },
                ].map((m) => (
                  <div key={m.label} className="text-center p-3 bg-[#16161A] rounded-xl">
                    <div className="text-[10px] text-slate-500 mb-0.5">{m.label}</div>
                    <div className="font-bold text-sm" style={{ color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>
              {diagnostic.benchmark_comparativo.melhores_canais?.length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Melhores canais para o nicho</div>
                  <div className="flex flex-wrap gap-2">
                    {diagnostic.benchmark_comparativo.melhores_canais.map((canal: string, i: number) => (
                      <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{ background: 'rgba(167,139,250,0.1)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.25)' }}>
                        {i === 0 ? '★ ' : ''}{canal}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {diagnostic.benchmark_comparativo.insights_nicho?.length > 0 && (
                <div className="space-y-1.5">
                  {diagnostic.benchmark_comparativo.insights_nicho.map((ins: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-500">
                      <span className="text-[#F0B429] mt-0.5 flex-shrink-0">→</span>
                      {ins}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!diagnostic && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-5xl mb-4 opacity-20">🎯</div>
          <div className="font-display text-lg font-bold text-white mb-2">Diagnóstico Estratégico</div>
          <p className="text-slate-500 text-sm max-w-md mb-4">
            Análise da saúde financeira do negócio: LTV:CAC, ROAS break-even, matriz de risco e prontidão para escalar.
            Diferente da Auditoria, que foca nas campanhas — aqui o foco é no <strong className="text-slate-400">modelo de negócio</strong>.
          </p>
          {!clientData?.ticketPrice && (
            <p className="text-xs text-[#F0B429] bg-[#F0B42910] border border-[#F0B42925] rounded-lg px-4 py-2 max-w-sm">
              💡 Dica: adicione ticket médio e margem bruta no perfil do cliente para um diagnóstico financeiro mais preciso.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
