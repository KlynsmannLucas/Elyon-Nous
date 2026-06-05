// components/dashboard/TabFunil.tsx — Diagnóstico de Gargalo do Funil
'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { useViewMode, getFieldLabel, TAB_HEADINGS_SIMPLE } from '@/lib/viewMode'
import { getBenchmark, getFunnelBenchmarks, BENCHMARKS } from '@/lib/niche_benchmarks'
import type { ClientData, FunnelEntry } from '@/lib/store'

interface Props {
  clientData: ClientData | null
}

const C = {
  bg:       '#080D1A',
  surface:  '#0F1629',
  elevated: '#131E35',
  border:   'rgba(255,255,255,0.06)',
  purple:   '#7C3AED',
  purpleL:  '#A78BFA',
  green:    '#22C55E',
  greenBg:  'rgba(34,197,94,0.1)',
  red:      '#EF4444',
  redBg:    'rgba(239,68,68,0.1)',
  blue:     '#38BDF8',
  blueBg:   'rgba(56,189,248,0.1)',
  gold:     '#F59E0B',
  goldBg:   'rgba(245,158,11,0.1)',
  orange:   '#F97316',
  text1:    '#F1F5F9',
  text2:    '#94A3B8',
  text3:    'rgba(255,255,255,0.25)',
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

export type Bottleneck = 'anuncio' | 'landing_page' | 'qualificacao' | 'fechamento' | 'velocidade' | 'saudavel'

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

export interface DiagnosisResult {
  stages: StageResult[]
  bottleneck: Bottleneck
  score: number
  roas: number | null
  cac: number | null
}

export const PRESCRIPTIONS: Record<Bottleneck, { title: string; icon: string; color: string; bg: string; border: string; description: string; actions: string[] }> = {
  anuncio: {
    title: 'Problema no Anúncio / Segmentação',
    icon: '📢',
    color: C.red,
    bg: C.redBg,
    border: 'rgba(239,68,68,0.25)',
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
    color: C.orange,
    bg: 'rgba(249,115,22,0.1)',
    border: 'rgba(249,115,22,0.25)',
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
    color: C.gold,
    bg: C.goldBg,
    border: 'rgba(245,158,11,0.25)',
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
    color: C.purpleL,
    bg: 'rgba(167,139,250,0.1)',
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
    color: C.blue,
    bg: C.blueBg,
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
    color: C.green,
    bg: C.greenBg,
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

export function diagnose(entry: Omit<FunnelEntry, 'id' | 'createdAt'>, benchKey: string): DiagnosisResult {
  const fb = getFunnelBenchmarks(benchKey)
  const channel = entry.channel

  const ctr       = entry.impressions > 0 && entry.clicks > 0 ? (entry.clicks / entry.impressions) * 100 : null
  const lpCvr     = entry.clicks > 0 ? (entry.leads / entry.clicks) * 100 : null
  const cpl       = entry.leads > 0 ? entry.investment / entry.leads : null
  const qualRate  = entry.leads > 0 ? (entry.qualifiedLeads / entry.leads) * 100 : null
  const closeRate = entry.qualifiedLeads > 0 ? (entry.sales / entry.qualifiedLeads) * 100 : null
  const roas      = entry.sales > 0 && entry.avgTicket > 0 ? (entry.sales * entry.avgTicket) / entry.investment : null
  const cac       = entry.sales > 0 ? entry.investment / entry.sales : null

  const ctrBench = CTR_BY_CHANNEL[channel] ?? 1.5
  const lpBench  = LP_CVR_BY_CHANNEL[channel] ?? 8.0

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

const STAGE_COLORS = [C.purple, C.blue, C.gold, C.green, '#22D3EE', '#A78BFA']

function StageCard({ stage, isBottleneck }: { stage: StageResult; isBottleneck: boolean }) {
  const color = stage.status === 'bom' ? C.green : stage.status === 'atencao' ? C.gold : C.red
  const colorBg = stage.status === 'bom' ? C.greenBg : stage.status === 'atencao' ? C.goldBg : C.redBg
  const pct = Math.min(100, stage.score)

  return (
    <div style={{
      background: isBottleneck ? 'rgba(239,68,68,0.06)' : C.surface,
      border: isBottleneck ? `1px solid rgba(239,68,68,0.35)` : `1px solid ${C.border}`,
      borderRadius: 14,
      padding: 20,
      boxShadow: isBottleneck ? '0 0 24px rgba(239,68,68,0.08)' : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>{stage.icon}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.text1 }}>{stage.label}</span>
          {isBottleneck && (
            <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 700, fontFamily: 'monospace', background: 'rgba(239,68,68,0.15)', color: C.red, letterSpacing: 1 }}>
              GARGALO
            </span>
          )}
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, color, background: colorBg, border: `1px solid ${color}40` }}>
          {stage.status === 'bom' ? '✓ BOM' : stage.status === 'atencao' ? '⚠ ATENÇÃO' : '✗ CRÍTICO'}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{stage.valueLabel}</span>
        <span style={{ fontSize: 10, color: C.text3 }}>benchmark {stage.benchLabel}</span>
      </div>
      <div style={{ height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 999, width: `${pct}%`, background: color, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

function Field({ label, hint, required, children }: { label: string; hint: string; required?: boolean; children: React.ReactNode }) {
  const { mode } = useViewMode()
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.text1 }}>{getFieldLabel(label, mode)}</span>
        {required
          ? <span style={{ fontSize: 10, color: C.gold, fontWeight: 700 }}>obrigatório</span>
          : <span style={{ fontSize: 10, color: C.text3 }}>opcional</span>}
      </div>
      <p style={{ fontSize: 10, color: C.text2, marginBottom: 8, lineHeight: 1.4 }}>{hint}</p>
      {children}
    </div>
  )
}

const INP: React.CSSProperties = {
  width: '100%', background: '#060A14', border: `1px solid ${C.border}`,
  borderRadius: 10, padding: '10px 12px', color: C.text1,
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
}

function FunnelForm({ clientData, onSubmit, prefill }: { clientData: ClientData; onSubmit: (data: Omit<FunnelEntry, 'id' | 'createdAt'>) => void; prefill?: { investment?: number; impressions?: number; clicks?: number; leads?: number } }) {
  const months = ['Jan 2025','Fev 2025','Mar 2025','Abr 2025','Mai 2025','Jun 2025','Jul 2025','Ago 2025','Set 2025','Out 2025','Nov 2025','Dez 2025',
                  'Jan 2026','Fev 2026','Mar 2026','Abr 2026','Mai 2026','Jun 2026']
  const [form, setForm] = useState({
    period: 'Mai 2026',
    channel: 'Meta Ads',
    investment: prefill?.investment ?? clientData.budget,
    impressions: prefill?.impressions ?? 0,
    clicks: prefill?.clicks ?? 0,
    leads: prefill?.leads ?? 0,
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

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ background: C.goldBg, border: `1px solid rgba(245,158,11,0.2)`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Como usar em 3 passos</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            'Abra o gerenciador de anúncios (Meta Ads Manager ou Google Ads)',
            'Selecione o período, cole os números que aparecem na tela',
            'Campos opcionais ficam em branco — o diagnóstico funciona mesmo assim',
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 11, color: C.text2 }}>
              <span style={{ width: 16, height: 16, borderRadius: 999, background: 'rgba(245,158,11,0.12)', color: C.gold, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
              {s}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.text2, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>📅 Período & Canal</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Período" hint="Mês que você quer analisar">
            <select value={form.period} onChange={(e) => set('period', e.target.value)} style={{ ...INP, cursor: 'pointer' }}>
              {months.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Canal principal" hint="Onde rodou os anúncios">
            <select value={form.channel} onChange={(e) => set('channel', e.target.value)} style={{ ...INP, cursor: 'pointer' }}>
              {CHANNELS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.text2, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>💰 Investimento & Alcance do Anúncio</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Field label="Investimento (R$)" hint="Total gasto em anúncios no período" required>
            <input type="number" value={form.investment || ''} onChange={(e) => set('investment', Number(e.target.value))} style={INP} min={0} required placeholder="ex: 3.000" />
          </Field>
          <Field label="Impressões" hint="Vezes que o anúncio foi exibido — está no painel de anúncios">
            <input type="number" value={form.impressions || ''} onChange={(e) => set('impressions', Number(e.target.value))} style={INP} min={0} placeholder="ex: 50.000" />
          </Field>
          <Field label="Cliques no anúncio" hint="Quantas pessoas clicaram — também no painel">
            <input type="number" value={form.clicks || ''} onChange={(e) => set('clicks', Number(e.target.value))} style={INP} min={0} placeholder="ex: 750" />
          </Field>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.text2, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>🎯 Resultados do Funil de Vendas</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Leads gerados" hint="Formulários preenchidos ou mensagens recebidas pelo anúncio" required>
            <input type="number" value={form.leads || ''} onChange={(e) => set('leads', Number(e.target.value))} style={INP} min={0} required placeholder="ex: 42" />
          </Field>
          <Field label="Leads qualificados" hint="Dos leads recebidos, quantos tinham perfil real para comprar" required>
            <input type="number" value={form.qualifiedLeads || ''} onChange={(e) => set('qualifiedLeads', Number(e.target.value))} style={INP} min={0} required placeholder="ex: 18" />
          </Field>
          <Field label="Vendas fechadas" hint="Clientes que efetivamente compraram / assinaram" required>
            <input type="number" value={form.sales || ''} onChange={(e) => set('sales', Number(e.target.value))} style={INP} min={0} required placeholder="ex: 5" />
          </Field>
          <Field label="Ticket médio (R$)" hint="Valor médio de cada venda — calcula ROAS e CAC automaticamente">
            <input type="number" value={form.avgTicket || ''} onChange={(e) => set('avgTicket', Number(e.target.value))} style={INP} min={0} placeholder="ex: 1.500" />
          </Field>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.text2, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>⚡ Velocidade de Resposta ao Lead</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Tempo médio de resposta (horas)" hint="Em quanto tempo você contata o lead? · 0.5 = 30min · 1 = 1h · 4 = meio período">
            <input type="number" value={form.avgResponseHours || ''} onChange={(e) => set('avgResponseHours', Number(e.target.value))} style={INP} min={0} step={0.5} placeholder="ex: 0.5 (30min) ou 2 (2 horas)" />
          </Field>
        </div>
      </div>

      <button type="submit" style={{
        width: '100%', padding: '14px 0', borderRadius: 12, fontWeight: 700, fontSize: 14,
        color: '#fff', background: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
        border: 'none', cursor: 'pointer', letterSpacing: 0.3,
      }}>
        🔬 Diagnosticar Gargalo
      </button>
    </form>
  )
}

function VisualFunnel({ entry }: { entry: Omit<FunnelEntry, 'id' | 'createdAt'> }) {
  const rows = [
    entry.impressions > 0  && { label: 'Impressões',   value: entry.impressions,   pct: null as string | null },
    entry.clicks > 0       && { label: 'Cliques',       value: entry.clicks,        pct: entry.impressions > 0 ? (entry.clicks / entry.impressions * 100).toFixed(1) + '%' : null },
    entry.leads > 0        && { label: 'Leads',         value: entry.leads,         pct: entry.clicks > 0 ? (entry.leads / entry.clicks * 100).toFixed(1) + '%' : null },
    entry.qualifiedLeads >= 0 && { label: 'Qualificados', value: entry.qualifiedLeads, pct: entry.leads > 0 ? (entry.qualifiedLeads / entry.leads * 100).toFixed(1) + '%' : null },
    entry.sales >= 0       && { label: 'Vendas',        value: entry.sales,         pct: entry.qualifiedLeads > 0 ? (entry.sales / entry.qualifiedLeads * 100).toFixed(1) + '%' : null },
  ].filter(Boolean) as { label: string; value: number; pct: string | null }[]

  const maxV = rows[0]?.value || 1
  const stageColors = [C.purple, C.blue, C.gold, C.green, '#22D3EE']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {rows.map((row, i) => {
        const w = Math.max(18, (row.value / maxV) * 100)
        const color = stageColors[i] || C.purpleL
        const isLast = i === rows.length - 1

        return (
          <div key={row.label}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: isLast ? 0 : 0 }}>
              <div style={{ width: 100, textAlign: 'right', fontSize: 11, color: C.text2, flexShrink: 0 }}>{row.label}</div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  height: 32, borderRadius: 8,
                  width: `${w}%`, minWidth: 60,
                  background: `linear-gradient(90deg, ${color}30, ${color}18)`,
                  border: `1px solid ${color}40`,
                  display: 'flex', alignItems: 'center', padding: '0 12px',
                  fontSize: 12, fontWeight: 700, color,
                  transition: 'width 0.6s ease',
                }}>
                  {row.value.toLocaleString('pt-BR')}
                </div>
                {row.pct && (
                  <span style={{ fontSize: 11, color: C.text3, flexShrink: 0 }}>{row.pct}</span>
                )}
              </div>
            </div>
            {!isLast && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '3px 0' }}>
                <div style={{ width: 100, flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
                  <div style={{ width: 1, height: 10, background: `${color}30`, marginLeft: 20 }} />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function TabFunil({ clientData }: Props) {
  const { mode: viewMode } = useViewMode()
  const heading = viewMode === 'simple' ? TAB_HEADINGS_SIMPLE.funil : null
  const funnelEntries     = useAppStore((s) => s.funnelEntries)
  const addFunnelEntry    = useAppStore((s) => s.addFunnelEntry)
  const deleteFunnelEntry = useAppStore((s) => s.deleteFunnelEntry)
  const auditCache        = useAppStore((s) => s.auditCache)
  const [showForm, setShowForm]   = useState(true)
  const [result, setResult]       = useState<DiagnosisResult | null>(null)
  const [lastEntry, setLastEntry] = useState<Omit<FunnelEntry, 'id' | 'createdAt'> | null>(null)

  if (!clientData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: C.text2, fontSize: 14 }}>
        Configure um cliente primeiro para usar o diagnóstico de funil.
      </div>
    )
  }

  const bench    = getBenchmark(clientData.niche)
  const benchKey = bench ? Object.keys(BENCHMARKS).find((k) => BENCHMARKS[k] === bench) || 'outro' : 'outro'
  const clientEntries = funnelEntries.filter((e) => e.clientName === clientData.clientName)

  // Pré-preenche com dados reais da última auditoria
  const auditHistory = auditCache[clientData.clientName]
  const latestAudit  = Array.isArray(auditHistory) ? auditHistory[0]?.audit : auditHistory
  const rm = latestAudit?._realMetrics as any
  // Só pré-preenche campos que têm dados reais — zeros falsos confundem o diagnóstico
  const auditPrefill = rm && rm.totalSpend > 0 ? {
    investment:  rm.totalSpend,
    impressions: rm.totalImpressions > 0 ? rm.totalImpressions : undefined,
    clicks:      rm.totalClicks > 0      ? rm.totalClicks      : undefined,
    leads:       rm.totalLeads > 0       ? rm.totalLeads       : undefined,
  } : undefined

  const handleSubmit = (data: Omit<FunnelEntry, 'id' | 'createdAt'>) => {
    const dx = diagnose(data, benchKey)
    setResult(dx)
    setLastEntry(data)
    addFunnelEntry(data)
    setShowForm(false)
  }

  const presc = result ? PRESCRIPTIONS[result.bottleneck] : null
  const scoreColor = result
    ? result.score >= 70 ? C.green : result.score >= 45 ? C.gold : C.red
    : C.gold

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text1, margin: 0 }}>{heading?.title ?? 'Diagnóstico de Gargalo do Funil'}</h2>
          <p style={{ fontSize: 12, color: C.text2, marginTop: 4, margin: '4px 0 0' }}>
            {heading?.subtitle ?? 'Identifica com precisão onde o funil está perdendo dinheiro — anúncio, LP, qualificação, vendas ou velocidade'}
          </p>
        </div>
        {result && (
          <button
            onClick={() => { setShowForm(true); setResult(null) }}
            style={{
              fontSize: 12, padding: '7px 14px', borderRadius: 10, fontWeight: 600, cursor: 'pointer',
              background: 'rgba(124,58,237,0.08)', color: C.purpleL, border: '1px solid rgba(124,58,237,0.25)',
            }}>
            + Nova análise
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.text2, textTransform: 'uppercase', letterSpacing: 2 }}>📊 Dados do período</div>
            {auditPrefill && (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)',
              }}>
                ✓ Pré-preenchido com dados da auditoria
              </span>
            )}
          </div>
          <FunnelForm clientData={clientData} onSubmit={handleSubmit} prefill={auditPrefill} />
        </div>
      )}

      {result && lastEntry && presc && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 10, color: C.text2, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Score do Funil</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{result.score}</div>
              <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>/100</div>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 10, color: C.text2, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Investimento</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.text1, lineHeight: 1 }}>R${lastEntry.investment.toLocaleString('pt-BR')}</div>
              <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{lastEntry.period}</div>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 10, color: C.text2, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>ROAS</div>
              <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1, color: result.roas ? (result.roas >= 3 ? C.green : result.roas >= 1.5 ? C.gold : C.red) : C.text3 }}>
                {result.roas ? `${result.roas.toFixed(1)}×` : 'N/D'}
              </div>
              <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>retorno s/ invest.</div>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 10, color: C.text2, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>CAC</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.text1, lineHeight: 1 }}>{result.cac ? `R$${result.cac.toFixed(0)}` : 'N/D'}</div>
              <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>custo por cliente</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
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

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.text2, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 20 }}>Funil de Conversão Visual</div>
            <VisualFunnel entry={lastEntry} />
          </div>

          <div style={{ background: presc.bg, border: `1px solid ${presc.border}`, borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
              <div style={{ fontSize: 40, flexShrink: 0, marginTop: 2 }}>{presc.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.text1, marginBottom: 8 }}>{presc.title}</div>
                <p style={{ fontSize: 12, lineHeight: 1.6, color: C.text2, marginBottom: 20 }}>{presc.description}</p>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: presc.color, marginBottom: 12 }}>Plano de ação</div>
                <ol style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: 0, padding: 0, listStyle: 'none' }}>
                  {presc.actions.map((action, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, color: C.text1 }}>
                      <span style={{
                        flexShrink: 0, width: 20, height: 20, borderRadius: 999, fontSize: 9, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
                        background: `${presc.color}22`, color: presc.color,
                      }}>
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

      {clientEntries.length > 0 && (
        <div style={{ marginTop: 36 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.text2, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
            Histórico de análises — {clientData.clientName}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {clientEntries.map((entry) => {
              const dx = diagnose(entry, benchKey)
              const pr = PRESCRIPTIONS[dx.bottleneck]
              const sc = dx.score >= 70 ? C.green : dx.score >= 45 ? C.gold : C.red
              return (
                <div key={entry.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 18 }}>{pr.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>{entry.period} — {entry.channel}</div>
                      <div style={{ fontSize: 11, color: C.text2, marginTop: 2 }}>{entry.leads} leads · {entry.sales} vendas · R${entry.investment.toLocaleString('pt-BR')}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: sc }}>{dx.score}</div>
                      <div style={{ fontSize: 9, color: C.text3 }}>score</div>
                    </div>
                    <button
                      onClick={() => deleteFunnelEntry(entry.id)}
                      style={{ color: C.text3, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: 4 }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = C.red)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = C.text3)}
                    >
                      ✕
                    </button>
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
