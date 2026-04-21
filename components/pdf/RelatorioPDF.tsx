// components/pdf/RelatorioPDF.tsx — Relatório PDF com @react-pdf/renderer
// Usa dados reais do cliente/estratégia; mockData como fallback de exibição apenas

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer'
import { getBenchmark } from '@/lib/niche_benchmarks'
import { getNicheContent } from '@/lib/niche_content'
import type { ClientData } from '@/lib/store'

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface PDFData {
  clientData: ClientData | null
  strategy: Record<string, any>
  auditData?: any        // from auditCache (Meta Intelligence or Pipeline report)
  actionItems?: any[]   // from actionPlanCache
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#0A0A0B',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  pageCover: {
    backgroundColor: '#0A0A0B',
    padding: 60,
    fontFamily: 'Helvetica',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 36,
    color: '#F0B429',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    letterSpacing: 4,
  },
  h2: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  h3: {
    fontSize: 12,
    color: '#F0B429',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  body: {
    fontSize: 10,
    color: '#94A3B8',
    lineHeight: 1.6,
  },
  label: {
    fontSize: 8,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  card: {
    backgroundColor: '#111114',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A30',
  },
  kpiCard: {
    backgroundColor: '#111114',
    borderRadius: 10,
    padding: 12,
    flex: 1,
    borderWidth: 1,
    borderColor: '#2A2A30',
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 18,
    color: '#F0B429',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 8,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A30',
    marginVertical: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#16161A',
    borderRadius: 6,
    padding: 8,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    padding: '6 8',
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E24',
  },
  tableCell: {
    fontSize: 9,
    color: '#E2E8F0',
    flex: 1,
  },
  tableHeaderCell: {
    fontSize: 8,
    color: '#64748B',
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F0B429',
    marginTop: 4,
    marginRight: 8,
    flexShrink: 0,
  },
  bulletText: {
    fontSize: 9,
    color: '#94A3B8',
    flex: 1,
    lineHeight: 1.5,
  },
})

// ── Componentes auxiliares ────────────────────────────────────────────────────
function BulletItem({ text }: { text: string }) {
  return (
    <View style={styles.bulletItem}>
      <View style={styles.bullet} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  )
}

function PageHeader({ title, page, total }: { title: string; page: number; total: number }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
      <Text style={{ fontSize: 10, color: '#F0B429', fontFamily: 'Helvetica-Bold', letterSpacing: 2 }}>
        ELYON NOUS
      </Text>
      <Text style={{ fontSize: 9, color: '#64748B' }}>
        {title} · {page}/{total}
      </Text>
    </View>
  )
}

// ── PÁGINA 1 — Capa ────────────────────────────────────────────────────────────
function PageCover({ clientName, niche, budget }: { clientName: string; niche: string; budget: number }) {
  const date = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const budgetFmt = budget >= 1000 ? `R$${(budget / 1000).toFixed(0)}k/mês` : `R$${budget}/mês`
  return (
    <Page size="A4" style={styles.pageCover}>
      <View style={{ width: 60, height: 4, backgroundColor: '#F0B429', borderRadius: 2, marginBottom: 32 }} />

      <Text style={styles.logo}>ELYON</Text>
      <Text style={{ fontSize: 10, color: '#64748B', letterSpacing: 3, marginBottom: 48 }}>
        INTELIGÊNCIA DE MARKETING COM IA
      </Text>

      <View style={{
        backgroundColor: '#111114',
        borderWidth: 1,
        borderColor: 'rgba(240,180,41,0.3)',
        borderRadius: 12,
        padding: '16 28',
        marginBottom: 16,
        alignItems: 'center',
        minWidth: 260,
      }}>
        <Text style={{ fontSize: 9, color: '#F0B429', letterSpacing: 2, marginBottom: 6 }}>
          NICHO ANALISADO
        </Text>
        <Text style={{ fontSize: 22, color: '#FFFFFF', fontFamily: 'Helvetica-Bold', textAlign: 'center' }}>
          {niche || 'Estratégia de Marketing'}
        </Text>
      </View>

      {budget > 0 && (
        <View style={{
          backgroundColor: 'rgba(34,197,94,0.08)',
          borderWidth: 1,
          borderColor: 'rgba(34,197,94,0.2)',
          borderRadius: 8,
          padding: '8 20',
          marginBottom: 24,
          alignItems: 'center',
        }}>
          <Text style={{ fontSize: 9, color: '#22C55E', letterSpacing: 1 }}>
            BUDGET ANALISADO · {budgetFmt}
          </Text>
        </View>
      )}

      <Text style={{ fontSize: 13, color: '#FFFFFF', fontFamily: 'Helvetica-Bold', marginBottom: 4 }}>
        {clientName || 'Cliente'}
      </Text>
      <Text style={{ fontSize: 9, color: '#64748B' }}>
        Gerado em {date}
      </Text>

      <View style={{ position: 'absolute', bottom: 40, alignItems: 'center' }}>
        <Text style={{ fontSize: 8, color: '#2A2A30' }}>
          Relatório gerado automaticamente pela plataforma ELYON NOUS · Uso exclusivo interno
        </Text>
      </View>
    </Page>
  )
}

// ── PÁGINA 2 — Diagnóstico da Conta ──────────────────────────────────────────
function PageDiagnostico({ auditData, clientName, niche }: { auditData: any; clientName: string; niche: string }) {
  const intel = auditData?._intelligenceData
  const rm    = auditData?._realMetrics
  const score = intel?.score ?? auditData?.score_conta ?? auditData?.health_score ?? null
  const grade = intel?.scoreGrade ?? auditData?.grade ?? null
  const totals = intel?.totals ?? {}
  const gradeCol = !grade ? '#64748B'
    : grade.startsWith('A') ? '#22C55E'
    : grade.startsWith('B') ? '#F0B429'
    : '#FF4D4D'

  const fmt = (n: number) => n >= 1000 ? `R$${(n/1000).toFixed(1)}k` : `R$${n}`

  const kpis = rm ? [
    { label: 'Investido 30d', value: fmt(rm.totalSpend || 0),      color: '#F0B429' },
    { label: 'Leads',         value: (rm.totalLeads || 0).toLocaleString('pt-BR'), color: '#38BDF8' },
    { label: 'CPL Médio',     value: rm.avgCPL ? `R$${rm.avgCPL}` : '—',       color: '#22C55E' },
    { label: 'CTR Médio',     value: totals.avgCTR ? `${totals.avgCTR}%` : '—', color: '#A78BFA' },
  ] : []

  // Problemas (crítico e warning)
  const problems: string[] = [
    ...(intel?.globalRecs || []).filter((r: any) => r.type === 'critical' || r.type === 'warning').map((r: any) => `${r.title}: ${r.description}`),
    ...(auditData?.erros_criticos || []),
    ...(auditData?.diagnostico || []).slice(0, 3),
  ].slice(0, 6)

  // O que está funcionando (oportunidades)
  const wins: string[] = [
    ...(intel?.globalRecs || []).filter((r: any) => r.type === 'opportunity').map((r: any) => `${r.title}: ${r.description}`),
    ...(auditData?.oportunidades || []).map((o: any) => `${o.titulo}: ${o.descricao || o.potencial}`),
  ].slice(0, 4)

  // Sumário executivo
  const summary = auditData?.sumario_executivo
    || auditData?.executive_summary
    || auditData?.resumo_executivo
    || 'Análise baseada nos dados reais da conta de anúncios.'

  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="Diagnóstico" page={2} total={4} />

      <Text style={styles.h2}>Diagnóstico da Conta — {clientName}</Text>
      <Text style={{ ...styles.body, marginBottom: 16 }}>
        {niche} · Análise dos últimos 30 dias com dados reais das contas conectadas
      </Text>

      {/* Score + KPIs */}
      <View style={{ ...styles.row, marginBottom: 16 }}>
        {score !== null && (
          <View style={{ ...styles.kpiCard, flex: 0.6, justifyContent: 'center' }}>
            <Text style={styles.kpiLabel}>Score de Saúde</Text>
            <Text style={{ fontSize: 32, color: gradeCol, fontFamily: 'Helvetica-Bold', marginVertical: 4 }}>
              {grade || score}
            </Text>
            <Text style={{ fontSize: 9, color: gradeCol }}>{score}/100</Text>
          </View>
        )}
        {kpis.map((k) => (
          <View key={k.label} style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{k.label}</Text>
            <Text style={{ ...styles.kpiValue, color: k.color, fontSize: 14 }}>{k.value}</Text>
          </View>
        ))}
      </View>

      {/* Resumo executivo */}
      <View style={{ ...styles.card, borderColor: 'rgba(240,180,41,0.3)', marginBottom: 14 }}>
        <Text style={styles.h3}>Resumo Executivo</Text>
        <Text style={styles.body}>{summary}</Text>
      </View>

      {/* O que está errado vs certo */}
      <View style={styles.row}>
        <View style={styles.col}>
          <View style={{ ...styles.card, borderColor: 'rgba(255,77,77,0.35)' }}>
            <Text style={{ ...styles.h3, color: '#FF4D4D' }}>Problemas Identificados</Text>
            {problems.length > 0
              ? problems.map((p, i) => <BulletItem key={i} text={p} />)
              : <Text style={styles.body}>Nenhum problema crítico identificado.</Text>
            }
          </View>
        </View>
        <View style={styles.col}>
          <View style={{ ...styles.card, borderColor: 'rgba(34,197,94,0.35)' }}>
            <Text style={{ ...styles.h3, color: '#22C55E' }}>O que Está Funcionando</Text>
            {wins.length > 0
              ? wins.map((w, i) => <BulletItem key={i} text={w} />)
              : <Text style={styles.body}>Execute a análise de conta para ver oportunidades.</Text>
            }
          </View>
        </View>
      </View>
    </Page>
  )
}

// ── PÁGINA 3 — Estratégia ─────────────────────────────────────────────────────
function PageStrategy({
  strategy, niche, budget,
}: { strategy: Record<string, any>; niche: string; budget: number }) {
  const bench = getBenchmark(niche)
  const cplAvg = bench ? Math.round((bench.cpl_min + bench.cpl_max) / 2) : 0

  const channels: { name: string; priority: number; budget: string; cpl: string; status: string }[] =
    strategy.priority_ranking?.length > 0
      ? strategy.priority_ranking.slice(0, 4).map((ch: any) => ({
          name:     ch.channel,
          priority: ch.priority,
          budget:   `R$${(ch.budget_brl || 0).toLocaleString('pt-BR')}`,
          cpl:      `R$${ch.cpl_min}–${ch.cpl_max}`,
          status:   'Recomendado',
        }))
      : bench?.best_channels.slice(0, 3).map((ch: string, i: number) => ({
          name:     ch,
          priority: i + 1,
          budget:   `R$${Math.round(budget * [0.4, 0.3, 0.2][i] / 1000)}k`,
          cpl:      `R$${bench.cpl_min}–${bench.cpl_max}`,
          status:   'Recomendado',
        })) || []

  const aiInsight = strategy.recommendation
    || (bench ? `CPL médio estimado R$${cplAvg} para o nicho ${niche}. Canal principal recomendado: ${bench.best_channels[0]}.` : '')

  const baseNum   = budget > 0 ? budget : bench?.budget_ideal || 5000
  const conservNum = Math.max(bench?.budget_floor || 1500, Math.round(baseNum * 0.5))
  const agresNum   = Math.round(baseNum * 2)
  const fmt = (n: number) => n >= 1_000_000 ? `R$${(n / 1_000_000).toFixed(1)}M` : `R$${Math.round(n / 1000)}k`

  const scenarioCalc = (b: number) => {
    if (!bench) return { leads: 0, revenue: '—', roas: 0 }
    const cpl = (bench.cpl_min + bench.cpl_max) / 2
    const leads = Math.round(b / cpl)
    const rev = leads * bench.cvr_lead_to_sale * bench.avg_ticket
    return { leads, revenue: fmt(rev), roas: +((rev / b).toFixed(1)) }
  }

  const scenarios = [
    { name: 'Conservador', budget: `R$${conservNum.toLocaleString('pt-BR')}/mês`, ...scenarioCalc(conservNum), recommended: false, color: '#94A3B8' },
    { name: 'Atual',       budget: `R$${baseNum.toLocaleString('pt-BR')}/mês`,    ...scenarioCalc(baseNum),    recommended: true,  color: '#F0B429' },
    { name: 'Agressivo',   budget: `R$${agresNum.toLocaleString('pt-BR')}/mês`,   ...scenarioCalc(agresNum),   recommended: false, color: '#22C55E' },
  ]

  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="Estratégia" page={3} total={4} />

      <Text style={styles.h2}>Estratégia Recomendada</Text>
      <Text style={{ ...styles.body, marginBottom: 20 }}>
        Distribuição de budget e canais priorizados por ROI esperado para o nicho {niche}.
      </Text>

      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderCell}>Canal</Text>
        <Text style={styles.tableHeaderCell}>Prioridade</Text>
        <Text style={styles.tableHeaderCell}>Budget/mês</Text>
        <Text style={styles.tableHeaderCell}>CPL est.</Text>
        <Text style={styles.tableHeaderCell}>Status</Text>
      </View>
      {channels.map((ch) => (
        <View key={ch.name} style={styles.tableRow}>
          <Text style={{ ...styles.tableCell, color: '#FFFFFF', fontFamily: 'Helvetica-Bold' }}>{ch.name}</Text>
          <Text style={styles.tableCell}>{ch.priority}º</Text>
          <Text style={{ ...styles.tableCell, color: '#F0B429' }}>{ch.budget}</Text>
          <Text style={styles.tableCell}>{ch.cpl}</Text>
          <Text style={{ ...styles.tableCell, color: '#22C55E' }}>{ch.status}</Text>
        </View>
      ))}

      <View style={{ ...styles.card, borderColor: 'rgba(240,180,41,0.3)', marginTop: 20 }}>
        <Text style={styles.h3}>Insight da IA</Text>
        <Text style={styles.body}>{aiInsight}</Text>
      </View>

      <View style={styles.divider} />

      <Text style={styles.h3}>Cenários de Budget</Text>
      <View style={styles.row}>
        {scenarios.map((s) => (
          <View key={s.name} style={{ ...styles.kpiCard, borderColor: s.recommended ? 'rgba(240,180,41,0.5)' : '#2A2A30' }}>
            <Text style={{ fontSize: 9, color: s.recommended ? '#F0B429' : '#64748B', marginBottom: 4 }}>
              {s.name}{s.recommended ? ' ★' : ''}
            </Text>
            <Text style={{ fontSize: 12, color: '#FFFFFF', fontFamily: 'Helvetica-Bold', marginBottom: 6 }}>
              {s.budget}
            </Text>
            <Text style={{ fontSize: 8, color: '#94A3B8' }}>Leads: {s.leads}/mês</Text>
            <Text style={{ fontSize: 8, color: '#94A3B8' }}>Receita: {s.revenue}</Text>
            <Text style={{ fontSize: 8, color: '#22C55E', marginTop: 4 }}>ROAS: {s.roas}×</Text>
          </View>
        ))}
      </View>
    </Page>
  )
}

// ── PÁGINA 4 — Plano de Ação (45 dias) ───────────────────────────────────────
function PageActionPlan({
  strategy, actionItems, clientName, niche,
}: { strategy: Record<string, any>; actionItems: any[]; clientName: string; niche: string }) {
  const PRIORIDADE_COLOR: Record<string, string> = {
    critica: '#FF4D4D', alta: '#F0B429', media: '#38BDF8', baixa: '#22C55E',
  }
  const PRAZO_DAYS: Record<string, number> = {
    'Imediato': 0, '7 dias': 7, '30 dias': 30, '45 dias': 45, '90 dias': 90,
  }

  // Sort by priority then deadline
  const priorityOrder: Record<string, number> = { critica: 0, alta: 1, media: 2, baixa: 3 }
  const sorted = [...actionItems].sort((a, b) => {
    const pDiff = (priorityOrder[a.prioridade] ?? 9) - (priorityOrder[b.prioridade] ?? 9)
    if (pDiff !== 0) return pDiff
    return (PRAZO_DAYS[a.prazo] ?? 99) - (PRAZO_DAYS[b.prazo] ?? 99)
  }).slice(0, 10)

  // Fallback to strategy key_actions if no real actions
  const fallbackActions: string[] = strategy.key_actions?.slice(0, 8) || []

  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="Plano de Ações" page={4} total={4} />

      <Text style={styles.h2}>Plano de Ações — {clientName}</Text>
      <Text style={{ ...styles.body, marginBottom: 16 }}>
        Ações priorizadas por impacto real · Nicho {niche}
      </Text>

      {sorted.length > 0 ? (
        <>
          <View style={{ ...styles.tableHeader, marginBottom: 6 }}>
            <Text style={{ ...styles.tableHeaderCell, flex: 0.4 }}>Prior.</Text>
            <Text style={{ ...styles.tableHeaderCell, flex: 1.8 }}>Ação</Text>
            <Text style={{ ...styles.tableHeaderCell, flex: 0.9 }}>Prazo</Text>
            <Text style={{ ...styles.tableHeaderCell, flex: 1.2 }}>Impacto</Text>
          </View>
          {sorted.map((item, i) => {
            const col = PRIORIDADE_COLOR[item.prioridade] || '#64748B'
            return (
              <View key={i} style={{ ...styles.tableRow, alignItems: 'flex-start' }}>
                <View style={{ flex: 0.4, alignItems: 'center' }}>
                  <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: col,
                    borderWidth: 1, borderColor: `${col}40`, borderRadius: 4,
                    paddingLeft: 3, paddingRight: 3, paddingTop: 1, paddingBottom: 1 }}>
                    {(item.prioridade || '').toUpperCase().slice(0, 4)}
                  </Text>
                </View>
                <View style={{ flex: 1.8 }}>
                  <Text style={{ fontSize: 9, color: '#FFFFFF', fontFamily: 'Helvetica-Bold', marginBottom: 2 }}>
                    {item.titulo}
                  </Text>
                  <Text style={{ fontSize: 8, color: '#94A3B8', lineHeight: 1.4 }}>
                    {(item.descricao || '').slice(0, 120)}{item.descricao?.length > 120 ? '...' : ''}
                  </Text>
                </View>
                <Text style={{ ...styles.tableCell, flex: 0.9, fontSize: 8, color: '#F0B429' }}>
                  {item.prazo || '—'}
                </Text>
                <Text style={{ ...styles.tableCell, flex: 1.2, fontSize: 8, color: '#22C55E' }}>
                  {(item.impacto || '—').slice(0, 60)}
                </Text>
              </View>
            )
          })}
        </>
      ) : (
        <View style={styles.card}>
          <Text style={styles.h3}>Ações Recomendadas</Text>
          {fallbackActions.map((a, i) => <BulletItem key={i} text={`${i + 1}. ${a}`} />)}
        </View>
      )}

      <View style={{ position: 'absolute', bottom: 40, left: 40, right: 40 }}>
        <View style={styles.divider} />
        <Text style={{ fontSize: 8, color: '#2A2A30', textAlign: 'center' }}>
          ELYON NOUS · Relatório gerado automaticamente · elyon-nous.vercel.app
        </Text>
      </View>
    </Page>
  )
}

// ── Documento PDF completo ────────────────────────────────────────────────────
function RelatorioPDF({ data }: { data: PDFData }) {
  const clientName = data.clientData?.clientName || 'Cliente'
  const niche      = data.clientData?.niche || ''
  const budget     = data.clientData?.budget || 0
  const strategy   = data.strategy || {}
  const actionItems = data.actionItems || []

  return (
    <Document>
      <PageCover clientName={clientName} niche={niche} budget={budget} />
      <PageDiagnostico auditData={data.auditData} clientName={clientName} niche={niche} />
      <PageStrategy strategy={strategy} niche={niche} budget={budget} />
      <PageActionPlan strategy={strategy} actionItems={actionItems} clientName={clientName} niche={niche} />
    </Document>
  )
}

// ── Função exportada para abrir PDF em nova aba ───────────────────────────────
export async function generatePDF(data: PDFData): Promise<void> {
  const clientName = data.clientData?.clientName || 'relatorio'
  const date = new Date().toISOString().split('T')[0]
  const blob = await pdf(<RelatorioPDF data={data} />).toBlob()
  const url  = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `elyon-auditoria-${clientName.toLowerCase().replace(/\s+/g, '-')}-${date}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

export default RelatorioPDF
