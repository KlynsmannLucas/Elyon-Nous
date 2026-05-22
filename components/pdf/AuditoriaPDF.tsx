// components/pdf/AuditoriaPDF.tsx — PDF de auditoria usando campos reais da resposta
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer'

const S = StyleSheet.create({
  page: { backgroundColor: '#0A0A0B', padding: 40, fontFamily: 'Helvetica' },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A30',
  },
  logo: { fontSize: 20, color: '#F0B429', fontFamily: 'Helvetica-Bold', letterSpacing: 2 },
  headerRight: { alignItems: 'flex-end' },
  headerLabel: { fontSize: 7, color: '#64748B', letterSpacing: 1, textTransform: 'uppercase' },
  headerValue: { fontSize: 9, color: '#94A3B8', marginTop: 2 },
  // Typography
  sectionTitle: {
    fontSize: 8,
    color: '#F0B429',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 14,
  },
  label: { fontSize: 7, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  value: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  body: { fontSize: 9, color: '#94A3B8', lineHeight: 1.55 },
  // Score
  scoreCard: {
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: '#2A2A30',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreNum: { fontSize: 34, fontFamily: 'Helvetica-Bold' },
  scoreGrade: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginLeft: 4 },
  // Metric row
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: '#2A2A30',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  metricItem: { flex: 1, alignItems: 'center' },
  metricLabel: { fontSize: 7, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  metricValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  metricSub: { fontSize: 7, color: '#64748B', marginTop: 1 },
  // Info badges
  badgeRow: { flexDirection: 'row', marginBottom: 8 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, marginRight: 6 },
  badgeText: { fontSize: 7, fontFamily: 'Helvetica-Bold' },
  // Campaign cards
  campCard: {
    borderRadius: 6,
    padding: 10,
    marginBottom: 5,
    borderWidth: 1,
  },
  campRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 },
  campName: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', flex: 1 },
  campCPL: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginLeft: 6 },
  campMetrics: { flexDirection: 'row', marginBottom: 3 },
  campMetric: { fontSize: 7, color: '#64748B', marginRight: 10 },
  campEvidence: { fontSize: 8, color: '#94A3B8', lineHeight: 1.4, marginBottom: 2 },
  campAction: { fontSize: 8, fontFamily: 'Helvetica-Bold', lineHeight: 1.4 },
  // Issue list
  issueRow: { flexDirection: 'row', marginBottom: 4 },
  issueDot: { fontSize: 9, marginRight: 5, marginTop: 1 },
  issueText: { fontSize: 9, color: '#94A3B8', lineHeight: 1.5, flex: 1 },
  // Action cards
  actionCard: {
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: '#2A2A30',
    borderRadius: 6,
    padding: 10,
    marginBottom: 5,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  actionNum: {
    width: 18,
    height: 18,
    backgroundColor: '#F0B429',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  actionNumText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#000000' },
  actionContent: { flex: 1 },
  actionTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', marginBottom: 2 },
  actionDetail: { fontSize: 8, color: '#64748B', lineHeight: 1.45 },
  actionBadgeRow: { flexDirection: 'row', marginTop: 3 },
  actionBadge: { fontSize: 7, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, marginRight: 4 },
  // Tracking
  checkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#1E1E24' },
  checkLabel: { fontSize: 8, color: '#FFFFFF', flex: 1 },
  checkStatus: { fontSize: 7, fontFamily: 'Helvetica-Bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  // Plano de ação
  planoCard: {
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: '#2A2A30',
    borderRadius: 6,
    padding: 8,
    marginBottom: 5,
  },
  planoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  planoAcao: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', flex: 1, marginBottom: 2 },
  planoBadge: { fontSize: 7, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, marginLeft: 4 },
  planoImpacto: { fontSize: 8, color: '#22C55E' },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#2A2A30',
    paddingTop: 8,
  },
  footerText: { fontSize: 7, color: '#3A3A42' },
  // Waste
  wasteCard: {
    borderWidth: 1,
    borderColor: 'rgba(255,77,77,0.3)',
    backgroundColor: 'rgba(255,77,77,0.06)',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  wasteValue: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#FF4D4D', marginBottom: 2 },
})

// ── helpers ──────────────────────────────────────────────────────────────────

function gradeColor(grade: string): string {
  if (grade === 'A+' || grade === 'A') return '#22C55E'
  if (grade === 'B+' || grade === 'B') return '#F0B429'
  return '#FF4D4D'
}

function confidenceColor(conf: string): string {
  if (conf === 'alta')  return '#22C55E'
  if (conf === 'média') return '#F0B429'
  return '#FF4D4D'
}

function prioColor(p: string): string {
  if (p === 'alta' || p === 'crítica') return '#FF4D4D'
  if (p === 'média') return '#F0B429'
  return '#22C55E'
}

function trackingColor(s: string): { color: string; bg: string } {
  if (s === 'verificado')     return { color: '#22C55E', bg: 'rgba(34,197,94,0.15)' }
  if (s === 'problema')       return { color: '#FF4D4D', bg: 'rgba(255,77,77,0.15)' }
  if (s === 'nao_verificado') return { color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' }
  if (s === 'precisa_acesso') return { color: '#F0B429', bg: 'rgba(240,180,41,0.12)' }
  return { color: '#64748B', bg: 'rgba(100,116,139,0.12)' }
}

function trackingLabel(s: string): string {
  if (s === 'verificado')     return 'Verificado'
  if (s === 'problema')       return 'Problema'
  if (s === 'nao_verificado') return 'Não verificado'
  if (s === 'precisa_acesso') return 'Precisa acesso'
  return 'Indisponível'
}

function fmt(n: number): string {
  if (!n) return 'R$0'
  if (n >= 1_000_000) return `R$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000)      return `R$${(n / 1000).toFixed(1)}k`
  return `R$${Math.round(n).toLocaleString('pt-BR')}`
}

function fmtN(n: any): string {
  if (!n && n !== 0) return '—'
  return String(n)
}

// ── component ─────────────────────────────────────────────────────────────────

interface AuditoriaPDFProps {
  audit: Record<string, any>
  clientName: string
  niche: string
}

function AuditoriaDocument({ audit, clientName, niche }: AuditoriaPDFProps) {
  const grade   = audit.grade || '?'
  const gCol    = gradeColor(grade)
  const score   = audit.health_score ?? '—'
  const now     = new Date(audit.generated_at || Date.now()).toLocaleDateString('pt-BR')

  const m       = audit._realMetrics || {}
  const dq      = audit._dataQuality || {}
  const conf    = dq.confidence || 'baixa'
  const confCol = confidenceColor(conf)

  // Campaigns
  const classified = audit._campanhasClassificadas || {}
  const winners    = classified.vencedoras || []
  const attention  = classified.atencao    || []
  const critical   = classified.criticas   || []

  // Waste
  const wasteCamps = audit._wasteCampaigns || []
  const wastePct   = audit._wastePercent   || 0
  const wasteTotal = wasteCamps.reduce((s: number, c: any) => s + (c.spend || 0), 0)

  // Actions (o_que_eu_faria_agora) — handle both string[] and object[]
  const rawActions = audit.o_que_eu_faria_agora || []
  const actions: any[] = rawActions.map((a: any) =>
    typeof a === 'string' ? { titulo: a, prioridade: 'média' } : a
  ).slice(0, 5)

  // Plano de ação
  const plano = (audit.plano_acao || []).slice(0, 5)

  // Tracking
  const tracking = audit._trackingChecklist || []

  // Source info
  const sourceMap: Record<string, string> = {
    api:         'Apenas API',
    upload:      'Apenas CSV',
    consolidate: 'Consolidado',
    auto:        'Automático',
  }
  const sourceLabel = sourceMap[audit._auditSource] || 'Automático'
  const platforms   = (audit._platforms || []).join(' + ')

  // Insights / Gargalos
  const gargalos    = audit.gargalos    || []
  const oportunidades = audit.oportunidades || []

  const period = audit._period || '—'

  return (
    <Document>
      {/* ── PÁGINA 1 — Score, KPIs, Campanhas, Desperdício ─────────────────── */}
      <Page size="A4" style={S.page}>
        <View style={S.header}>
          <Text style={S.logo}>ELYON</Text>
          <View style={S.headerRight}>
            <Text style={S.headerLabel}>Auditoria com IA · {now}</Text>
            <Text style={S.headerValue}>{clientName} · {niche}</Text>
          </View>
        </View>

        {/* Score + Dados */}
        <View style={S.scoreCard}>
          <View>
            <Text style={S.label}>Score de saúde</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={[S.scoreNum, { color: gCol }]}>{score}</Text>
              <Text style={[S.scoreGrade, { color: gCol }]}>{grade}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={S.label}>Fonte / período</Text>
            <Text style={[S.body, { color: '#FFFFFF', marginBottom: 2 }]}>{sourceLabel}{platforms ? ` · ${platforms}` : ''}</Text>
            <Text style={S.body}>{period}</Text>
          </View>
        </View>

        {/* Confiança + Resumo */}
        <View style={S.badgeRow}>
          <View style={[S.badge, { backgroundColor: `${confCol}20` }]}>
            <Text style={[S.badgeText, { color: confCol }]}>Confiança {conf}</Text>
          </View>
          {dq.issues?.slice(0, 2).map((issue: string, i: number) => (
            <View key={i} style={[S.badge, { backgroundColor: 'rgba(100,116,139,0.15)' }]}>
              <Text style={[S.badgeText, { color: '#94A3B8' }]}>{issue}</Text>
            </View>
          ))}
        </View>
        {audit.executive_summary && (
          <Text style={[S.body, { marginBottom: 10 }]}>{audit.executive_summary}</Text>
        )}

        {/* KPIs */}
        <View style={S.metricsRow}>
          <View style={S.metricItem}>
            <Text style={S.metricLabel}>Investimento</Text>
            <Text style={S.metricValue}>{fmt(m.totalSpend || 0)}</Text>
          </View>
          <View style={S.metricItem}>
            <Text style={S.metricLabel}>Leads</Text>
            <Text style={S.metricValue}>{fmtN(m.totalLeads)}</Text>
            {audit._hasGoogleConversions && <Text style={S.metricSub}>incl. conversões</Text>}
          </View>
          <View style={S.metricItem}>
            <Text style={S.metricLabel}>CPL médio</Text>
            <Text style={S.metricValue}>{m.avgCPL ? `R$${m.avgCPL}` : '—'}</Text>
          </View>
          {m.roas > 0 && (
            <View style={S.metricItem}>
              <Text style={S.metricLabel}>ROAS</Text>
              <Text style={S.metricValue}>{m.roas}×</Text>
            </View>
          )}
          {m.avgCTR > 0 && (
            <View style={S.metricItem}>
              <Text style={S.metricLabel}>CTR</Text>
              <Text style={S.metricValue}>{m.avgCTR}%</Text>
            </View>
          )}
        </View>

        {/* Campanhas críticas e de atenção */}
        {critical.length > 0 && (
          <>
            <Text style={S.sectionTitle}>Campanhas Críticas</Text>
            {critical.slice(0, 3).map((c: any, i: number) => (
              <View key={i} style={[S.campCard, { backgroundColor: 'rgba(255,77,77,0.06)', borderColor: 'rgba(255,77,77,0.3)' }]}>
                <View style={S.campRow}>
                  <Text style={S.campName}>{c.name}</Text>
                  <Text style={[S.campCPL, { color: '#FF4D4D' }]}>{c.cpl ? `R$${c.cpl}` : fmt(c.spend)}</Text>
                </View>
                {(c.ctr || c.frequency) ? (
                  <View style={S.campMetrics}>
                    {c.ctr       && <Text style={S.campMetric}>CTR: {c.ctr}%</Text>}
                    {c.frequency && <Text style={S.campMetric}>Freq: {c.frequency}</Text>}
                    <Text style={S.campMetric}>Gasto: {fmt(c.spend)}</Text>
                  </View>
                ) : null}
                {c.evidence && <Text style={S.campEvidence}>{c.evidence}</Text>}
                {c.recommended_action && <Text style={[S.campAction, { color: '#FF4D4D' }]}>{c.recommended_action}</Text>}
              </View>
            ))}
          </>
        )}

        {attention.length > 0 && (
          <>
            <Text style={S.sectionTitle}>Campanhas de Atenção</Text>
            {attention.slice(0, 2).map((c: any, i: number) => (
              <View key={i} style={[S.campCard, { backgroundColor: 'rgba(240,180,41,0.06)', borderColor: 'rgba(240,180,41,0.25)' }]}>
                <View style={S.campRow}>
                  <Text style={S.campName}>{c.name}</Text>
                  <Text style={[S.campCPL, { color: '#F0B429' }]}>{c.cpl ? `R$${c.cpl}` : fmt(c.spend)}</Text>
                </View>
                {c.evidence && <Text style={S.campEvidence}>{c.evidence}</Text>}
                {c.recommended_action && <Text style={[S.campAction, { color: '#F0B429' }]}>{c.recommended_action}</Text>}
              </View>
            ))}
          </>
        )}

        {/* Desperdício */}
        {wasteTotal > 0 && (
          <>
            <Text style={S.sectionTitle}>Estimativa de Desperdício</Text>
            <View style={S.wasteCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={S.wasteValue}>{fmt(wasteTotal)}</Text>
                  <Text style={[S.body, { color: '#64748B' }]}>{wastePct}% do investimento total em campanhas ineficientes</Text>
                </View>
                <Text style={[S.body, { color: '#FF4D4D' }]}>{wasteCamps.length} camp.</Text>
              </View>
            </View>
          </>
        )}

        <View style={S.footer} fixed>
          <Text style={S.footerText}>ELYON · Auditoria com IA · Página 1</Text>
          <Text style={S.footerText}>{clientName} · {now}</Text>
        </View>
      </Page>

      {/* ── PÁGINA 2 — Ações, Plano, Gargalos, Tracking ────────────────────── */}
      <Page size="A4" style={S.page}>
        <View style={S.header}>
          <Text style={S.logo}>ELYON</Text>
          <View style={S.headerRight}>
            <Text style={S.headerLabel}>Plano de Ação · {now}</Text>
            <Text style={S.headerValue}>{clientName} · {niche}</Text>
          </View>
        </View>

        {/* Campanhas vencedoras */}
        {winners.length > 0 && (
          <>
            <Text style={S.sectionTitle}>Campanhas Vencedoras</Text>
            {winners.slice(0, 3).map((c: any, i: number) => (
              <View key={i} style={[S.campCard, { backgroundColor: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.25)' }]}>
                <View style={S.campRow}>
                  <Text style={S.campName}>{c.name}</Text>
                  <Text style={[S.campCPL, { color: '#22C55E' }]}>{c.cpl ? `R$${c.cpl}` : fmt(c.spend)}</Text>
                </View>
                {c.evidence && <Text style={S.campEvidence}>{c.evidence}</Text>}
                {c.recommended_action && <Text style={[S.campAction, { color: '#22C55E' }]}>{c.recommended_action}</Text>}
              </View>
            ))}
          </>
        )}

        {/* O que eu faria agora */}
        {actions.length > 0 && (
          <>
            <Text style={S.sectionTitle}>O que eu faria agora</Text>
            {actions.map((a: any, i: number) => {
              const pCol = prioColor(a.prioridade || 'média')
              return (
                <View key={i} style={S.actionCard}>
                  <View style={S.actionNum}>
                    <Text style={S.actionNumText}>{i + 1}</Text>
                  </View>
                  <View style={S.actionContent}>
                    <Text style={S.actionTitle}>{a.titulo}</Text>
                    {a.motivo && <Text style={S.actionDetail}>{a.motivo}</Text>}
                    {a.evidencia && <Text style={[S.actionDetail, { color: '#64748B' }]}>{a.evidencia}</Text>}
                    <View style={S.actionBadgeRow}>
                      {a.prioridade && (
                        <Text style={[S.actionBadge, { color: pCol, backgroundColor: `${pCol}18` }]}>
                          {a.prioridade}
                        </Text>
                      )}
                      {a.prazo && (
                        <Text style={[S.actionBadge, { color: '#94A3B8', backgroundColor: 'rgba(148,163,184,0.12)' }]}>
                          {a.prazo}
                        </Text>
                      )}
                      {a.esforco && (
                        <Text style={[S.actionBadge, { color: '#94A3B8', backgroundColor: 'rgba(148,163,184,0.12)' }]}>
                          {a.esforco}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              )
            })}
          </>
        )}

        {/* Gargalos + Oportunidades */}
        {gargalos.length > 0 && (
          <>
            <Text style={S.sectionTitle}>Gargalos Identificados</Text>
            {gargalos.slice(0, 4).map((g: string, i: number) => (
              <View key={i} style={S.issueRow}>
                <Text style={[S.issueDot, { color: '#FF4D4D' }]}>✕</Text>
                <Text style={S.issueText}>{g}</Text>
              </View>
            ))}
          </>
        )}

        {oportunidades.length > 0 && (
          <>
            <Text style={S.sectionTitle}>Oportunidades</Text>
            {oportunidades.slice(0, 4).map((o: string, i: number) => (
              <View key={i} style={S.issueRow}>
                <Text style={[S.issueDot, { color: '#22C55E' }]}>+</Text>
                <Text style={S.issueText}>{o}</Text>
              </View>
            ))}
          </>
        )}

        {/* Plano de ação */}
        {plano.length > 0 && (
          <>
            <Text style={S.sectionTitle}>Plano de Ação</Text>
            {plano.map((p: any, i: number) => (
              <View key={i} style={S.planoCard}>
                <View style={S.planoRow}>
                  <Text style={S.planoAcao}>{p.acao}</Text>
                  {p.prazo && (
                    <Text style={[S.planoBadge, { color: '#94A3B8', backgroundColor: 'rgba(148,163,184,0.12)' }]}>
                      {p.prazo}
                    </Text>
                  )}
                </View>
                {p.impacto && <Text style={S.planoImpacto}>{p.impacto}</Text>}
              </View>
            ))}
          </>
        )}

        {/* Tracking checklist */}
        {tracking.length > 0 && (
          <>
            <Text style={S.sectionTitle}>Checklist de Rastreamento</Text>
            {tracking.map((t: any, i: number) => {
              const tc = trackingColor(t.status)
              return (
                <View key={i} style={S.checkRow}>
                  <Text style={S.checkLabel}>{t.item}</Text>
                  <Text style={[S.checkStatus, { color: tc.color, backgroundColor: tc.bg }]}>
                    {trackingLabel(t.status)}
                  </Text>
                </View>
              )
            })}
          </>
        )}

        {/* Insights senior */}
        {(audit.insights_senior || []).length > 0 && (
          <>
            <Text style={S.sectionTitle}>Insights do Especialista</Text>
            {(audit.insights_senior as string[]).slice(0, 3).map((ins, i) => (
              <View key={i} style={S.issueRow}>
                <Text style={[S.issueDot, { color: '#38BDF8' }]}>→</Text>
                <Text style={S.issueText}>{ins}</Text>
              </View>
            ))}
          </>
        )}

        <View style={S.footer} fixed>
          <Text style={S.footerText}>ELYON · Auditoria com IA · Página 2</Text>
          <Text style={S.footerText}>{clientName} · {now}</Text>
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
