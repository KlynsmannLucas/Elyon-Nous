// components/dashboard/TabFunil.tsx — Diagnóstico de Gargalo do Funil
'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { getBenchmark, getFunnelBenchmarks, BENCHMARKS } from '@/lib/niche_benchmarks'
import type { ClientData, FunnelEntry } from '@/lib/store'

interface Props {
  clientData: ClientData | null
}

const CHANNELS = ['Meta Ads', 'Google Search', 'Instagram', 'TikTok', 'YouTube', 'LinkedIn', 'WhatsApp Ads', 'Múltiplos canais']

const CTR_BY_CHANNEL: Record<string, number> = {
  'Meta Ads': 1.5, 'Google Search': 4.0, 'Instagram': 1.2,
  'TikTok': 1.0, 'YouTube': 0.4, 'LinkedIn': 0.5, 'WhatsApp Ads': 2.0, 'Múltiplos canais': 1.5,
}
const LP_CVR_BY_CHANNEL: Record<string, number> = {
  'Meta Ads': 8.0, 'Google Search': 12.0, 'Instagram': 7.0,
  'TikTok': 6.0, 'YouTube': 5.0, 'LinkedIn': 5.0, 'WhatsApp Ads': 22.0, 'Múltiplos canais': 8.0,
}

type Bottleneck = 'anuncio' | 'landing_page' | 'qualificacao' | 'fechamento' | 'velocidade' | 'saudavel'

interface StageResult {
  key: string
  label: string
  icon: string
  value: number | null
  benchmark: number | null
  unit: string
  lowerIsBetter: boolean
  status: 'bom' | 'atencao' | 'critico' | 'nd'
  score: number
  valueLabel: string
  benchLabel: string
}

interface DiagnosisResult {
  stages: StageResult[]
  bottleneck: Bottleneck
  score: number
  roas: number | null
  cac: number | null
}

const PRESCRIPTIONS: Record<Bottleneck, { title: string; icon: string; color: string; bg: string; border: string; description: string; actions: string[] }> = {
  anuncio: {
    title: 'Problema no Anúncio / Segmentação',
    icon: '📢',
    color: '#F87171',
    bg: 'rgba(248,113,113,0.05)',
    border: 'rgba(248,113,113,0.25)',
    description: 'O criativo ou a segmentação não está gerando cliques suficientes. Pessoas veem o anúncio mas não clicam — ele não desperta interesse suficiente ou está chegando nas pessoas erradas.',
    actions: [
      'Testar 3 novos criativos com ângulos diferentes nos próximos 14 dias',
      'Criar Lookalike 1–3% a partir de uma lista de clientes reais (não de leads)',
      'Reduzir texto no criativo — imagem/vídeo deve comunicar sozinho em 3 segundos',
      'Testar Reels/Stories vs Feed — o formato impacta o CTR em até 3×',
      'Revisar horários de veiculação: pausar nos horários com CTR baixo',
    ],
  },
  landing_page: {
    title: 'Problema na Landing Page',
    icon: '🖥️',
    color: '#FB923C',
    bg: 'rgba(251,146,60,0.05)',
    border: 'rgba(251,146,60,0.25)',
    description: 'O anúncio está funcionando — as pessoas clicam — mas a LP não converte. O visitante chega, não se convence e vai embora sem virar lead.',
    actions: [
      'Reescrever a headline: deve responder "o que eu ganho?" em menos de 5 segundos',
      'Adicionar prova social acima do fold: depoimentos reais, números, logos de clientes',
      'Simplificar o formulário: máximo 3 campos (nome, WhatsApp e cidade)',
      'Testar velocidade de carregamento: LP deve abrir em menos de 2s no mobile',
      'Adicionar CTA com urgência real: vagas limitadas, resposta em até X horas',
    ],
  },
  qualificacao: {
    title: 'Problema na Qualidade do Lead',
    icon: '🎯',
    color: '#FBBF24',
    bg: 'rgba(251,191,36,0.05)',
    border: 'rgba(251,191,36,0.25)',
    description: 'Os leads chegam mas poucos qualificam. A oferta está atraindo o público errado, ou a comunicação cria expectativas incompatíveis com o serviço ou preço.',
    actions: [
      'Mencionar faixa de investimento mínimo ou perfil do cliente ideal no anúncio',
      'Configurar bot de triagem no WhatsApp com 3 perguntas de qualificação automática',
      'Tornar o copy mais específico: dizer claramente para quem o serviço é (e para quem não é)',
      'Criar segmentação por comportamento de compra e renda no gerenciador de anúncios',
      'Entrevistar 5 leads não qualificados para entender a desconexão de expectativa',
    ],
  },
  fechamento: {
    title: 'Problema no Processo de Vendas',
    icon: '🤝',
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.05)',
    border: 'rgba(167,139,250,0.25)',
    description: 'Os leads são bons e qualificam, mas não fecham. O gargalo está no processo de venda, na proposta, no follow-up ou na gestão de objeções.',
    actions: [
      'Mapear em qual etapa as negociações travam: proposta? Preço? Confiança?',
      'Implementar follow-up estruturado: 3 contatos em 7 dias após o envio da proposta',
      'Criar uma proposta visual com cases, ROI esperado, comparativo e garantias claras',
      'Gravar chamadas de venda e identificar as 3 objeções mais frequentes',
      'Oferecer opção de menor comprometimento inicial: piloto, parcela de entrada reduzida',
    ],
  },
  velocidade: {
    title: 'Problema na Velocidade de Resposta',
    icon: '⚡',
    color: '#38BDF8',
    bg: 'rgba(56,189,248,0.05)',
    border: 'rgba(56,189,248,0.25)',
    description: 'Leads estão esfriando antes do primeiro contato. Lead respondido em menos de 5 minutos converte até 9× mais do que respondido após 1 hora.',
    actions: [
      'Configurar mensagem de boas-vindas automática no WhatsApp Business imediatamente após o cadastro',
      'Criar alerta no celular via Zapier ou Make para cada novo lead recebido',
      'Definir SLA interno: resposta humana em no máximo 15 minutos em horário comercial',
      'Implementar bot de qualificação que atende 24/7 enquanto a equipe está offline',
      'Centralizar todos os leads num único CRM com notificação push para o vendedor',
    ],
  },
  saudavel: {
    title: 'Funil Saudável — Hora de Escalar',
    icon: '🚀',
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.05)',
    border: 'rgba(34,197,94,0.25)',
    description: 'Todas as métricas estão dentro dos benchmarks do seu nicho. O funil está convertendo bem. Agora é o momento de aumentar o investimento com segurança.',
    actions: [
      'Aumentar o budget em 20–30% por semana até encontrar o teto de escala eficiente',
      'Duplicar os criativos vencedores com variações de copy, formato e CTA',
      'Expandir para novos públicos: Lookalike de clientes com maior ticket médio',
      'Abrir um segundo canal (se Meta está bom, testar Google Search ou vice-versa)',
      'Documentar o processo completo para replicar com novos nichos ou regiões',
    ],
  },
}

// ── Cálculo do diagnóstico ────────────────────────────────────────────────────
function diagnose(entry: Omit<FunnelEntry, 'id' | 'createdAt'>, benchKey: string): DiagnosisResult {
  const fb = getFunnelBenchmarks(benchKey)
  const channel = entry.channel

  const ctr       = entry.impressions > 0 && entry.clicks > 0 ? (entry.clicks / entry.impressions) * 100 : null
  const lpCvr     = entry.clicks > 0 ? (entry.leads / entry.clicks) * 100 : null
  const cpl       = entry.leads > 0 ? entry.investment / entry.leads : null
  const qualRate  = entry.leads > 0 ? (entry.qualifiedLeads / entry.leads) * 100 : null
  const closeRate = entry.qualifiedLeads > 0 ? (entry.sales / entry.qualifiedLeads) * 100 : null
  const roas      = entry.sales > 0 && entry.avgTicket > 0 ? (entry.sales * entry.avgTicket) / entry.investment : null
  const cac       = entry.sales > 0 ? entry.investment / entry.sales : null

  const ctrBench   = CTR_BY_CHANNEL[channel] ?? 1.5
  const lpBench    = LP_CVR_BY_CHANNEL[channel] ?? 8.0

  function score(value: number | null, benchmark: number, lowerIsBetter = false, badMultiplier = 2): number {
    if (value === null) return 50
    if (lowerIsBetter) {
      const bad = benchmark * badMultiplier
      return Math.max(0, Math.min(100, ((bad - value) / (bad - benchmark * 0.5)) * 100))
    }
    return Math.max(0, Math.min(100, (value / benchmark) * 100))
  }

  function status(s: number): 'bom' | 'atencao' | 'critico' {
    return s >= 70 ? 'bom' : s >= 40 ? 'atencao' : 'critico'
  }

  const fmt = (v: number | null, unit: string, decimals = 1) =>
    v !== null ? `${unit === 'R$' ? 'R$' : ''}${v.toFixed(decimals)}${unit !== 'R$' ? unit : ''}` : 'N/D'

  const stages: StageResult[] = []

  if (ctr !== null) {
    const s = score(ctr, ctrBench)
    stages.push({ key: 'anuncio', label: 'CTR do Anúncio', icon: '📢', value: ctr, benchmark: ctrBench, unit: '%', lowerIsBetter: false, status: status(s), score: s, valueLabel: fmt(ctr, '%', 2), benchLabel: `≥ ${ctrBench.toFixed(1)}%` })
  }
  if (lpCvr !== null) {
    const s = score(lpCvr, lpBench)
    stages.push({ key: 'landing_page', label: 'Conversão da LP', icon: '🖥️', value: lpCvr, benchmark: lpBench, unit: '%', lowerIsBetter: false, status: status(s), score: s, valueLabel: fmt(lpCvr, '%', 1), benchLabel: `≥ ${lpBench.toFixed(0)}%` })
  }
  if (cpl !== null) {
    const s = score(cpl, fb.cpl_good, true, fb.cpl_bad / fb.cpl_good)
    stages.push({ key: 'cpl', label: 'CPL', icon: '💰', value: cpl, benchmark: fb.cpl_good, unit: 'R$', lowerIsBetter: true, status: status(s), score: s, valueLabel: `R$${cpl.toFixed(0)}`, benchLabel: `≤ R$${fb.cpl_good}` })
  }
  if (qualRate !== null) {
    const s = score(qualRate, fb.qualification_rate)
    stages.push({ key: 'qualificacao', label: 'Taxa de Qualificação', icon: '🎯', value: qualRate, benchmark: fb.qualification_rate, unit: '%', lowerIsBetter: false, status: status(s), score: s, valueLabel: fmt(qualRate, '%', 1), benchLabel: `≥ ${fb.qualification_rate.toFixed(0)}%` })
  }
  if (closeRate !== null) {
    const s = score(closeRate, fb.closing_rate)
    stages.push({ key: 'fechamento', label: 'Taxa de Fechamento', icon: '🤝', value: closeRate, benchmark: fb.closing_rate, unit: '%', lowerIsBetter: false, status: status(s), score: s, valueLabel: fmt(closeRate, '%', 1), benchLabel: `≥ ${fb.closing_rate.toFixed(0)}%` })
  }
  if (entry.avgResponseHours > 0) {
    const s = score(entry.avgResponseHours, fb.response_max_hours, true, 4)
    stages.push({ key: 'velocidade', label: 'Tempo de Resposta', icon: '⚡', value: entry.avgResponseHours, benchmark: fb.response_max_hours, unit: 'h', lowerIsBetter: true, status: status(s), score: s, valueLabel: entry.avgResponseHours < 1 ? `${Math.round(entry.avgResponseHours * 60)}min` : `${entry.avgResponseHours.toFixed(1)}h`, benchLabel: `≤ ${fb.response_max_hours}h` })
  }

  const dataStages = stages.filter((s) => s.value !== null)
  const bottleneckStage = dataStages.length === 0 ? null : dataStages.reduce((min, s) => s.score < min.score ? s : min)
  const avgScore = dataStages.length > 0 ? dataStages.reduce((a, s) => a + s.score, 0) / dataStages.length : 100

  let bottleneck: Bottleneck = 'saudavel'
  if (bottleneckStage && bottleneckStage.score < 70) {
    const keyMap: Record<string, Bottleneck> = {
      anuncio: 'anuncio', landing_page: 'landing_page', cpl: 'landing_page',
      qualificacao: 'qualificacao', fechamento: 'fechamento', velocidade: 'velocidade',
    }
    bottleneck = keyMap[bottleneckStage.key] || 'saudavel'
  }

  return { stages, bottleneck, score: Math.round(avgScore), roas, cac }
}

// ── Barra de progresso ────────────────────────────────────────────────────────
function StatusBar({ value, max, status }: { value: number; max: number; status: string }) {
  const pct = Math.min(100, (value / max) * 100)
  const color = status === 'bom' ? '#22C55E' : status === 'atencao' ? '#FBBF24' : '#F87171'
  return (
    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mt-1">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

// ── Card de etapa do funil ────────────────────────────────────────────────────
function StageCard({ stage, isBottleneck }: { stage: StageResult; isBottleneck: boolean }) {
  const colors = { bom: '#22C55E', atencao: '#FBBF24', critico: '#F87171', nd: '#475569' }
  const c = colors[stage.status]
  return (
    <div className="rounded-xl p-4 transition-all"
      style={{
        background: isBottleneck ? 'rgba(248,113,113,0.06)' : '#111114',
        border: isBottleneck ? '1px solid rgba(248,113,113,0.35)' : '1px solid #1E1E24',
        boxShadow: isBottleneck ? '0 0 20px rgba(248,113,113,0.08)' : 'none',
      }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{stage.icon}</span>
          <span className="text-xs font-semibold text-slate-300">{stage.label}</span>
          {isBottleneck && <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold" style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171' }}>GARGALO</span>}
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ color: c, background: `${c}18` }}>
          {stage.status === 'bom' ? '✓ BOM' : stage.status === 'atencao' ? '⚠ ATENÇÃO' : '✗ CRÍTICO'}
        </span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-xl font-bold" style={{ color: c }}>{stage.valueLabel}</span>
        <span className="text-[10px] text-slate-500">benchmark {stage.benchLabel}</span>
      </div>
      <StatusBar value={stage.score} max={100} status={stage.status} />
    </div>
  )
}

// ── Formulário ────────────────────────────────────────────────────────────────
function FunnelForm({ clientData, onSubmit }: { clientData: ClientData; onSubmit: (data: Omit<FunnelEntry, 'id' | 'createdAt'>) => void }) {
  const months = ['Jan 2025','Fev 2025','Mar 2025','Abr 2025','Mai 2025','Jun 2025','Jul 2025','Ago 2025','Set 2025','Out 2025','Nov 2025','Dez 2025',
                  'Jan 2026','Fev 2026','Mar 2026','Abr 2026','Mai 2026','Jun 2026']
  const [form, setForm] = useState({
    period: 'Abr 2026',
    channel: 'Meta Ads',
    investment: clientData.budget,
    impressions: 0,
    clicks: 0,
    leads: 0,
    qualifiedLeads: 0,
    sales: 0,
    avgTicket: clientData.ticketPrice ?? 0,
    avgResponseHours: 0,
  })
  const set = (k: string, v: number | string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ ...form, clientName: clientData.clientName })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#0C0C12', border: '1px solid #2A2A30',
    borderRadius: '10px', padding: '8px 12px', color: '#F8FAFC',
    fontSize: '13px', outline: 'none',
  }
  const labelStyle: React.CSSProperties = { fontSize: '11px', color: '#64748B', marginBottom: '4px', display: 'block' }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label style={labelStyle}>Período</label>
          <select value={form.period} onChange={(e) => set('period', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            {months.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Canal principal</label>
          <select value={form.channel} onChange={(e) => set('channel', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            {CHANNELS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label style={labelStyle}>Investimento (R$)</label>
          <input type="number" value={form.investment || ''} onChange={(e) => set('investment', Number(e.target.value))} style={inputStyle} min={0} required />
        </div>
        <div>
          <label style={labelStyle}>Impressões <span className="text-slate-600">(opcional)</span></label>
          <input type="number" value={form.impressions || ''} onChange={(e) => set('impressions', Number(e.target.value))} style={inputStyle} min={0} placeholder="0" />
        </div>
        <div>
          <label style={labelStyle}>Cliques <span className="text-slate-600">(opcional)</span></label>
          <input type="number" value={form.clicks || ''} onChange={(e) => set('clicks', Number(e.target.value))} style={inputStyle} min={0} placeholder="0" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-3">
        <div>
          <label style={labelStyle}>Leads gerados</label>
          <input type="number" value={form.leads || ''} onChange={(e) => set('leads', Number(e.target.value))} style={inputStyle} min={0} required />
        </div>
        <div>
          <label style={labelStyle}>Leads qualificados</label>
          <input type="number" value={form.qualifiedLeads || ''} onChange={(e) => set('qualifiedLeads', Number(e.target.value))} style={inputStyle} min={0} required />
        </div>
        <div>
          <label style={labelStyle}>Vendas fechadas</label>
          <input type="number" value={form.sales || ''} onChange={(e) => set('sales', Number(e.target.value))} style={inputStyle} min={0} required />
        </div>
        <div>
          <label style={labelStyle}>Ticket médio (R$)</label>
          <input type="number" value={form.avgTicket || ''} onChange={(e) => set('avgTicket', Number(e.target.value))} style={inputStyle} min={0} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label style={labelStyle}>Tempo médio de resposta ao lead <span className="text-slate-600">(horas — opcional)</span></label>
          <input type="number" value={form.avgResponseHours || ''} onChange={(e) => set('avgResponseHours', Number(e.target.value))} style={inputStyle} min={0} step={0.5} placeholder="ex: 0.5 = 30min" />
        </div>
      </div>

      <button type="submit" className="w-full py-3 rounded-xl font-bold text-sm text-black"
        style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)' }}>
        🔬 Diagnosticar Gargalo
      </button>
    </form>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export function TabFunil({ clientData }: Props) {
  const funnelEntries  = useAppStore((s) => s.funnelEntries)
  const addFunnelEntry = useAppStore((s) => s.addFunnelEntry)
  const deleteFunnelEntry = useAppStore((s) => s.deleteFunnelEntry)
  const [showForm, setShowForm]         = useState(true)
  const [result, setResult]             = useState<DiagnosisResult | null>(null)
  const [lastEntry, setLastEntry]       = useState<Omit<FunnelEntry, 'id' | 'createdAt'> | null>(null)

  if (!clientData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-500 text-sm">
        Configure um cliente primeiro para usar o diagnóstico de funil.
      </div>
    )
  }

  const bench    = getBenchmark(clientData.niche)
  const benchKey = bench ? Object.keys(BENCHMARKS).find((k) => BENCHMARKS[k] === bench) || 'outro' : 'outro'

  const clientEntries = funnelEntries.filter((e) => e.clientName === clientData.clientName)

  const handleSubmit = (data: Omit<FunnelEntry, 'id' | 'createdAt'>) => {
    const dx = diagnose(data, benchKey)
    setResult(dx)
    setLastEntry(data)
    addFunnelEntry(data)
    setShowForm(false)
  }

  const presc = result ? PRESCRIPTIONS[result.bottleneck] : null

  const scoreColor = result
    ? result.score >= 70 ? '#22C55E' : result.score >= 45 ? '#FBBF24' : '#F87171'
    : '#F0B429'

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-xl font-bold text-white">Diagnóstico de Gargalo do Funil</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Identifica com precisão onde o funil está perdendo dinheiro — anúncio, LP, qualificação, vendas ou velocidade
          </p>
        </div>
        {result && (
          <button onClick={() => { setShowForm(true); setResult(null) }}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold"
            style={{ background: 'rgba(240,180,41,0.1)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.2)' }}>
            + Nova análise
          </button>
        )}
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="rounded-2xl p-5 mb-6" style={{ background: '#111114', border: '1px solid #2A2A30' }}>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">📊 Dados do período</div>
          <FunnelForm clientData={clientData} onSubmit={handleSubmit} />
        </div>
      )}

      {/* Resultado */}
      {result && lastEntry && presc && (
        <div key={result.bottleneck} className="animate-fade-up">
          {/* Score geral + resumo financeiro */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            <div className="rounded-xl p-4 col-span-1" style={{ background: '#111114', border: '1px solid #2A2A30' }}>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Score do Funil</div>
              <div className="text-3xl font-bold" style={{ color: scoreColor }}>{result.score}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">/100</div>
            </div>
            <div className="rounded-xl p-4" style={{ background: '#111114', border: '1px solid #2A2A30' }}>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Investimento</div>
              <div className="text-xl font-bold text-white">R${lastEntry.investment.toLocaleString('pt-BR')}</div>
              <div className="text-[10px] text-slate-500">{lastEntry.period}</div>
            </div>
            <div className="rounded-xl p-4" style={{ background: '#111114', border: '1px solid #2A2A30' }}>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">ROAS</div>
              <div className="text-xl font-bold" style={{ color: result.roas ? (result.roas >= 3 ? '#22C55E' : result.roas >= 1.5 ? '#FBBF24' : '#F87171') : '#475569' }}>
                {result.roas ? `${result.roas.toFixed(1)}×` : 'N/D'}
              </div>
              <div className="text-[10px] text-slate-500">retorno s/ invest.</div>
            </div>
            <div className="rounded-xl p-4" style={{ background: '#111114', border: '1px solid #2A2A30' }}>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">CAC</div>
              <div className="text-xl font-bold text-white">{result.cac ? `R$${result.cac.toFixed(0)}` : 'N/D'}</div>
              <div className="text-[10px] text-slate-500">custo por cliente</div>
            </div>
          </div>

          {/* Cards das etapas */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {result.stages.map((stage) => (
              <StageCard
                key={stage.key}
                stage={stage}
                isBottleneck={
                  result.bottleneck !== 'saudavel' &&
                  stage.score === Math.min(...result.stages.map((s) => s.score))
                }
              />
            ))}
          </div>

          {/* Funil visual simplificado */}
          <div className="rounded-2xl p-5 mb-5" style={{ background: '#111114', border: '1px solid #2A2A30' }}>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Funil de Conversão</div>
            {(() => {
              const rows = [
                lastEntry.impressions > 0 && { label: 'Impressões', value: lastEntry.impressions, pct: null },
                lastEntry.clicks > 0     && { label: 'Cliques',     value: lastEntry.clicks, pct: lastEntry.impressions > 0 ? (lastEntry.clicks / lastEntry.impressions * 100).toFixed(1) + '%' : null },
                lastEntry.leads > 0      && { label: 'Leads',       value: lastEntry.leads,  pct: lastEntry.clicks > 0 ? (lastEntry.leads / lastEntry.clicks * 100).toFixed(1) + '%' : null },
                lastEntry.qualifiedLeads >= 0 && { label: 'Qualificados', value: lastEntry.qualifiedLeads, pct: lastEntry.leads > 0 ? (lastEntry.qualifiedLeads / lastEntry.leads * 100).toFixed(1) + '%' : null },
                lastEntry.sales >= 0     && { label: 'Vendas',      value: lastEntry.sales,  pct: lastEntry.qualifiedLeads > 0 ? (lastEntry.sales / lastEntry.qualifiedLeads * 100).toFixed(1) + '%' : null },
              ].filter(Boolean) as { label: string; value: number; pct: string | null }[]

              const maxV = rows[0]?.value || 1
              return rows.map((row, i) => {
                const w = Math.max(20, (row.value / maxV) * 100)
                return (
                  <div key={row.label} className="flex items-center gap-3 mb-2">
                    <div className="w-28 text-right text-xs text-slate-400 flex-shrink-0">{row.label}</div>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="rounded-md h-7 flex items-center px-3 text-xs font-bold text-white transition-all"
                        style={{ width: `${w}%`, minWidth: 60, background: i === 0 ? 'rgba(240,180,41,0.25)' : 'rgba(240,180,41,0.12)', border: '1px solid rgba(240,180,41,0.2)' }}>
                        {row.value.toLocaleString('pt-BR')}
                      </div>
                      {row.pct && <span className="text-[11px] text-slate-500">{row.pct}</span>}
                    </div>
                  </div>
                )
              })
            })()}
          </div>

          {/* Diagnóstico e prescrição */}
          <div className="rounded-2xl p-5" style={{ background: presc.bg, border: `1px solid ${presc.border}` }}>
            <div className="flex items-start gap-4">
              <div className="text-4xl flex-shrink-0 mt-1">{presc.icon}</div>
              <div className="flex-1">
                <div className="font-display font-bold text-white text-base mb-1">{presc.title}</div>
                <p className="text-xs leading-relaxed mb-4" style={{ color: '#94A3B8' }}>{presc.description}</p>
                <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: presc.color }}>Plano de ação</div>
                <ol className="space-y-2">
                  {presc.actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="flex-shrink-0 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center mt-0.5"
                        style={{ background: `${presc.color}22`, color: presc.color }}>
                        {i + 1}
                      </span>
                      {action}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Histórico */}
      {clientEntries.length > 0 && (
        <div className="mt-8">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Histórico de análises — {clientData.clientName}</div>
          <div className="space-y-2">
            {clientEntries.map((entry) => {
              const dx = diagnose(entry, benchKey)
              const pr = PRESCRIPTIONS[dx.bottleneck]
              const sc = dx.score >= 70 ? '#22C55E' : dx.score >= 45 ? '#FBBF24' : '#F87171'
              return (
                <div key={entry.id} className="flex items-center justify-between rounded-xl px-4 py-3"
                  style={{ background: '#111114', border: '1px solid #1E1E24' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-base">{pr.icon}</span>
                    <div>
                      <div className="text-sm font-semibold text-white">{entry.period} — {entry.channel}</div>
                      <div className="text-[11px] text-slate-500">{entry.leads} leads · {entry.sales} vendas · R${entry.investment.toLocaleString('pt-BR')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-bold" style={{ color: sc }}>{dx.score}</div>
                      <div className="text-[9px] text-slate-600">score</div>
                    </div>
                    <button onClick={() => deleteFunnelEntry(entry.id)} className="text-slate-600 hover:text-red-400 transition-colors text-xs">✕</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
