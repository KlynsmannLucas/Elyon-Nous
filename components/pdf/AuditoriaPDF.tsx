// components/pdf/AuditoriaPDF.tsx — PDF de auditoria de contas Ads com IA
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#0A0A0B',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A30',
  },
  logo: {
    fontSize: 22,
    color: '#F0B429',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 3,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerLabel: {
    fontSize: 8,
    color: '#64748B',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerValue: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  // Título
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  // Score card
  scoreCard: {
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: '#2A2A30',
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLeft: {},
  scoreLabel: {
    fontSize: 8,
    color: '#64748B',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 36,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  scoreGrade: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginLeft: 6,
  },
  scoreRight: {
    alignItems: 'flex-end',
  },
  wastedLabel: {
    fontSize: 8,
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  wastedValue: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#FF4D4D',
  },
  wastedPct: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
  },
  summary: {
    fontSize: 10,
    color: '#94A3B8',
    lineHeight: 1.6,
    marginTop: 12,
  },
  // Seções
  sectionTitle: {
    fontSize: 10,
    color: '#F0B429',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 16,
  },
  // Cards de issue
  issueCard: {
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  issueTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    flex: 1,
  },
  issueBadge: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    textTransform: 'capitalize',
  },
  issueDetail: {
    fontSize: 9,
    color: '#94A3B8',
    lineHeight: 1.5,
    marginBottom: 4,
  },
  issueAction: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1.4,
  },
  // Quick win
  winCard: {
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: '#2A2A30',
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
  },
  winHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  winTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    flex: 1,
  },
  winBadge: {
    fontSize: 7,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  winDesc: {
    fontSize: 9,
    color: '#64748B',
    lineHeight: 1.5,
  },
  // Platform card
  platformCard: {
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: '#2A2A30',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  platformHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  platformTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },
  platformStatus: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    textTransform: 'capitalize',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 7,
    color: '#64748B',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },
  insightRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  insightArrow: {
    fontSize: 9,
    color: '#38BDF8',
    marginRight: 5,
    marginTop: 1,
  },
  insightText: {
    fontSize: 9,
    color: '#64748B',
    lineHeight: 1.5,
    flex: 1,
  },
  // Recomendações
  recCard: {
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: '#2A2A30',
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  recNum: {
    width: 20,
    height: 20,
    backgroundColor: '#F0B429',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  recNumText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
  },
  recContent: { flex: 1 },
  recAction: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  recResult: {
    fontSize: 9,
    color: '#22C55E',
  },
  recChannel: {
    fontSize: 8,
    color: '#64748B',
    backgroundColor: '#2A2A30',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 4,
  },
  recRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#2A2A30',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#3A3A42',
  },
  // Grid 2 colunas
  row2: {
    flexDirection: 'row',
    gap: 10,
  },
  col2: {
    flex: 1,
  },
  // Benchmark
  benchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  benchItem: {
    flex: 1,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: '#2A2A30',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
  },
  benchLabel: {
    fontSize: 7,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  benchValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
})

function gradeColorVal(grade: string): string {
  if (grade === 'A+' || grade === 'A') return '#22C55E'
  if (grade === 'B+' || grade === 'B') return '#F0B429'
  return '#FF4D4D'
}

function statusColorVal(status: string): string {
  if (status === 'bom')     return '#22C55E'
  if (status === 'atenção') return '#F0B429'
  return '#FF4D4D'
}

function severityColorVal(severity: string): string {
  if (severity === 'alta')  return '#FF4D4D'
  if (severity === 'media') return '#F0B429'
  return '#38BDF8'
}

function fmt(n: number): string {
  if (!n) return 'R$0'
  if (n >= 1_000_000) return `R$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000)      return `R$${(n / 1000).toFixed(1)}k`
  return `R$${Math.round(n).toLocaleString('pt-BR')}`
}

interface AuditoriaPDFProps {
  audit: Record<string, any>
  clientName: string
  niche: string
}

function AuditoriaDocument({ audit, clientName, niche }: AuditoriaPDFProps) {
  const gradeCol = gradeColorVal(audit.grade)
  const now = new Date(audit.generated_at || Date.now()).toLocaleDateString('pt-BR')

  return (
    <Document>
      {/* Página 1 — Score + Problemas + Quick Wins */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>ELYON</Text>
          <View style={styles.headerRight}>
            <Text style={styles.headerLabel}>Auditoria de Contas · {now}</Text>
            <Text style={styles.headerValue}>{clientName} · {niche}</Text>
          </View>
        </View>

        {/* Título */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Relatório de Auditoria</Text>
          <Text style={styles.subtitle}>Análise dos últimos 30 dias com dados reais das contas conectadas</Text>
        </View>

        {/* Score card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreLeft}>
            <Text style={styles.scoreLabel}>Score de Saúde da Conta</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={[styles.scoreValue, { color: gradeCol }]}>{audit.health_score}</Text>
              <Text style={[styles.scoreGrade, { color: gradeCol }]}>{audit.grade}</Text>
            </View>
          </View>
          <View style={styles.scoreRight}>
            <Text style={styles.wastedLabel}>Verba estimada em desperdício</Text>
            <Text style={styles.wastedValue}>{fmt(audit.wasted_spend?.estimated || 0)}</Text>
            <Text style={styles.wastedPct}>{audit.wasted_spend?.percentage || 0}% do gasto total</Text>
          </View>
        </View>
        <Text style={styles.summary}>{audit.summary}</Text>

        {/* Problemas */}
        {audit.critical_issues?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Problemas Identificados</Text>
            {audit.critical_issues.slice(0, 4).map((issue: any, i: number) => {
              const col = severityColorVal(issue.severity)
              return (
                <View key={i} style={[styles.issueCard, { backgroundColor: `${col}0D`, borderColor: `${col}40` }]}>
                  <View style={styles.issueHeader}>
                    <Text style={styles.issueTitle}>{issue.issue}</Text>
                    <Text style={[styles.issueBadge, { color: col, backgroundColor: `${col}20` }]}>
                      {issue.severity}
                    </Text>
                  </View>
                  <Text style={styles.issueDetail}>{issue.detail}</Text>
                  <Text style={[styles.issueAction, { color: col }]}>⚡ {issue.action}</Text>
                </View>
              )
            })}
          </>
        )}

        {/* Quick Wins */}
        {audit.quick_wins?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Quick Wins — Melhorias Rápidas</Text>
            {audit.quick_wins.slice(0, 4).map((win: any, i: number) => (
              <View key={i} style={styles.winCard}>
                <View style={styles.winHeader}>
                  <Text style={styles.winTitle}>{win.title}</Text>
                  <Text style={[styles.winBadge, {
                    color: win.impact === 'Alto' ? '#22C55E' : win.impact === 'Médio' ? '#F0B429' : '#94A3B8',
                    backgroundColor: win.impact === 'Alto' ? 'rgba(34,197,94,0.1)' : win.impact === 'Médio' ? 'rgba(240,180,41,0.1)' : 'rgba(148,163,184,0.1)',
                  }]}>
                    {win.impact}
                  </Text>
                </View>
                <Text style={styles.winDesc}>{win.description}</Text>
              </View>
            ))}
          </>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>ELYON · Auditoria com IA</Text>
          <Text style={styles.footerText}>{clientName} · {niche}</Text>
        </View>
      </Page>

      {/* Página 2 — Plataformas + Benchmark + Recomendações */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>ELYON</Text>
          <View style={styles.headerRight}>
            <Text style={styles.headerLabel}>Análise por Plataforma</Text>
            <Text style={styles.headerValue}>{clientName} · {niche}</Text>
          </View>
        </View>

        {/* Plataformas */}
        <Text style={styles.sectionTitle}>Análise por Plataforma</Text>
        <View style={styles.row2}>
          {audit.meta_analysis && (
            <View style={[styles.platformCard, styles.col2]}>
              <View style={styles.platformHeader}>
                <Text style={styles.platformTitle}>Meta Ads</Text>
                <Text style={[styles.platformStatus, {
                  color: statusColorVal(audit.meta_analysis.status),
                  backgroundColor: `${statusColorVal(audit.meta_analysis.status)}20`,
                }]}>
                  {audit.meta_analysis.status}
                </Text>
              </View>
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Gasto</Text>
                  <Text style={styles.metricValue}>{fmt(audit.meta_analysis.spend)}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>CPL</Text>
                  <Text style={styles.metricValue}>R${audit.meta_analysis.cpl}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Leads</Text>
                  <Text style={styles.metricValue}>{audit.meta_analysis.leads}</Text>
                </View>
              </View>
              {(audit.meta_analysis.insights || []).map((ins: string, i: number) => (
                <View key={i} style={styles.insightRow}>
                  <Text style={styles.insightArrow}>→</Text>
                  <Text style={styles.insightText}>{ins}</Text>
                </View>
              ))}
            </View>
          )}
          {audit.google_analysis && (
            <View style={[styles.platformCard, styles.col2]}>
              <View style={styles.platformHeader}>
                <Text style={styles.platformTitle}>Google Ads</Text>
                <Text style={[styles.platformStatus, {
                  color: statusColorVal(audit.google_analysis.status),
                  backgroundColor: `${statusColorVal(audit.google_analysis.status)}20`,
                }]}>
                  {audit.google_analysis.status}
                </Text>
              </View>
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Gasto</Text>
                  <Text style={styles.metricValue}>{fmt(audit.google_analysis.spend)}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>CPL</Text>
                  <Text style={styles.metricValue}>R${audit.google_analysis.cpl}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Leads</Text>
                  <Text style={styles.metricValue}>{audit.google_analysis.leads}</Text>
                </View>
              </View>
              {(audit.google_analysis.insights || []).map((ins: string, i: number) => (
                <View key={i} style={styles.insightRow}>
                  <Text style={styles.insightArrow}>→</Text>
                  <Text style={styles.insightText}>{ins}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Benchmark */}
        {audit.benchmark && (
          <>
            <Text style={styles.sectionTitle}>Benchmark do Nicho ({niche})</Text>
            <View style={styles.benchRow}>
              <View style={styles.benchItem}>
                <Text style={styles.benchLabel}>CPL Mín.</Text>
                <Text style={[styles.benchValue, { color: '#22C55E' }]}>R${audit.benchmark.cpl_min}</Text>
              </View>
              <View style={styles.benchItem}>
                <Text style={styles.benchLabel}>CPL Máx.</Text>
                <Text style={[styles.benchValue, { color: '#F0B429' }]}>R${audit.benchmark.cpl_max}</Text>
              </View>
              <View style={styles.benchItem}>
                <Text style={styles.benchLabel}>ROAS Bom</Text>
                <Text style={[styles.benchValue, { color: '#A78BFA' }]}>{audit.benchmark.roas_good}×</Text>
              </View>
              <View style={[styles.benchItem, { flex: 2 }]}>
                <Text style={styles.benchLabel}>Melhores Canais</Text>
                <Text style={[styles.benchValue, { color: '#38BDF8', fontSize: 9 }]}>
                  {(audit.benchmark.best_channels || []).slice(0, 3).join(' · ')}
                </Text>
              </View>
            </View>
            {(audit.benchmark.insights || []).map((ins: string, i: number) => (
              <View key={i} style={styles.insightRow}>
                <Text style={[styles.insightArrow, { color: '#F0B429' }]}>→</Text>
                <Text style={styles.insightText}>{ins}</Text>
              </View>
            ))}
          </>
        )}

        {/* Recomendações */}
        {audit.recommendations?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recomendações Priorizadas</Text>
            {audit.recommendations.map((rec: any, i: number) => (
              <View key={i} style={styles.recCard}>
                <View style={styles.recNum}>
                  <Text style={styles.recNumText}>{rec.priority}</Text>
                </View>
                <View style={styles.recContent}>
                  <View style={styles.recRow}>
                    <Text style={styles.recAction}>{rec.action}</Text>
                    <Text style={styles.recChannel}>{rec.channel}</Text>
                  </View>
                  <Text style={styles.recResult}>→ {rec.expected_result}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>ELYON · Auditoria com IA · {now}</Text>
          <Text style={styles.footerText}>{clientName}</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function generateAuditPDF(
  audit: Record<string, any>,
  clientName: string,
  niche: string
) {
  const blob = await pdf(
    <AuditoriaDocument audit={audit} clientName={clientName} niche={niche} />
  ).toBlob()

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `auditoria-${clientName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}
