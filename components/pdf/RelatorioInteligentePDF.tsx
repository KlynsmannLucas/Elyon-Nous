// components/pdf/RelatorioInteligentePDF.tsx — PDF do Relatório Inteligente (3 modos)
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'

const S = StyleSheet.create({
  page:  { backgroundColor: '#0A0A0B', padding: 40, fontFamily: 'Helvetica' },
  page2: { backgroundColor: '#0A0A0B', padding: 40, fontFamily: 'Helvetica' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 22, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#2A2A30',
  },
  logo:     { fontSize: 18, color: '#F0B429', fontFamily: 'Helvetica-Bold', letterSpacing: 2 },
  hRight:   { alignItems: 'flex-end' },
  hLabel:   { fontSize: 7, color: '#64748B', letterSpacing: 1, textTransform: 'uppercase' },
  hVal:     { fontSize: 9, color: '#94A3B8', marginTop: 2 },
  // Cover
  coverBox: {
    backgroundColor: '#111114', borderWidth: 1, borderColor: '#2A2A30',
    borderRadius: 8, padding: 22, marginBottom: 14,
  },
  coverTitle: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', marginBottom: 4 },
  coverSub:   { fontSize: 10, color: '#64748B' },
  coverMeta:  { flexDirection: 'row', marginTop: 14, gap: 16 },
  coverItem:  { flex: 1 },
  coverLabel: { fontSize: 7, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  coverValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  // Score
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  scoreNum: { fontSize: 38, fontFamily: 'Helvetica-Bold' },
  scoreGrade: { fontSize: 20, fontFamily: 'Helvetica-Bold', marginLeft: 4 },
  // KPI grid
  kpiRow: { flexDirection: 'row', marginBottom: 12 },
  kpiBox: {
    flex: 1, backgroundColor: '#111114', borderWidth: 1, borderColor: '#2A2A30',
    borderRadius: 6, padding: 10, alignItems: 'center', marginRight: 6,
  },
  kpiLabel: { fontSize: 7, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 },
  kpiValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  // Section
  sectionTitle: {
    fontSize: 8, color: '#F0B429', fontFamily: 'Helvetica-Bold',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, marginTop: 14,
  },
  body:   { fontSize: 9, color: '#94A3B8', lineHeight: 1.55 },
  bodyW:  { fontSize: 9, color: '#FFFFFF', lineHeight: 1.55 },
  // Benchmark
  benchRow: { flexDirection: 'row', marginBottom: 10 },
  benchBox: {
    flex: 1, backgroundColor: '#111114', borderWidth: 1, borderColor: '#2A2A30',
    borderRadius: 6, padding: 8, alignItems: 'center', marginRight: 6,
  },
  benchLabel: { fontSize: 7, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 },
  benchValue: { fontSize: 11, fontFamily: 'Helvetica-Bold' },
  // Campaign card
  campCard: { borderRadius: 6, padding: 10, marginBottom: 5, borderWidth: 1 },
  campRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  campName: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', flex: 1 },
  campCPL:  { fontSize: 9, fontFamily: 'Helvetica-Bold', marginLeft: 6 },
  campEvid: { fontSize: 8, color: '#94A3B8', lineHeight: 1.4, marginBottom: 2 },
  campAct:  { fontSize: 8, fontFamily: 'Helvetica-Bold', lineHeight: 1.4 },
  // List item
  listRow:  { flexDirection: 'row', marginBottom: 4 },
  listDot:  { fontSize: 9, marginRight: 5, marginTop: 1 },
  listText: { fontSize: 9, color: '#94A3B8', lineHeight: 1.5, flex: 1 },
  // Action card
  actionCard: {
    backgroundColor: '#111114', borderWidth: 1, borderColor: '#2A2A30',
    borderRadius: 6, padding: 9, marginBottom: 5, flexDirection: 'row',
  },
  actionNum: {
    width: 18, height: 18, backgroundColor: '#F0B429', borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0,
  },
  actionNumTxt: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#000000' },
  actionContent: { flex: 1 },
  actionTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', marginBottom: 2 },
  actionDetail: { fontSize: 8, color: '#64748B', lineHeight: 1.4 },
  // Waste
  wasteCard: {
    backgroundColor: 'rgba(255,77,77,0.06)', borderWidth: 1, borderColor: 'rgba(255,77,77,0.25)',
    borderRadius: 6, padding: 10, marginBottom: 5, flexDirection: 'row', justifyContent: 'space-between',
  },
  wasteName: { fontSize: 9, color: '#FFFFFF', flex: 1 },
  wasteAmt:  { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#FF4D4D' },
  // Footer
  footer: {
    position: 'absolute', bottom: 20, left: 40, right: 40,
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: '#2A2A30', paddingTop: 8,
  },
  footerText: { fontSize: 7, color: '#3A3A42' },
  // Mode badge
  modeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  modeBadgeTxt: { fontSize: 8, fontFamily: 'Helvetica-Bold' },
})

function gradeColor(g: string): string {
  if (g === 'A+' || g === 'A') return '#22C55E'
  if (g === 'B+' || g === 'B') return '#F0B429'
  return '#FF4D4D'
}
function fmtR(n: number): string {
  if (!n) return 'R$0'
  if (n >= 1_000_000) return `R$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000)      return `R$${(n / 1000).toFixed(1)}k`
  return `R$${Math.round(n).toLocaleString('pt-BR')}`
}
function prioColor(p: string): string {
  if (p === 'P1' || p === 'alta' || p === 'crítica') return '#FF4D4D'
  if (p === 'P2' || p === 'média') return '#F0B429'
  return '#22C55E'
}

export interface RelatorioInteligentePDFProps {
  audit: Record<string, any>
  clientName: string
  niche: string
  mode: 'executivo' | 'tecnico' | 'agencia'
  agencyName?: string
  bench?: { cpl_min: number; cpl_max: number; roas_good: number; best_channels: string[] } | null
}

function RelatorioDocument({ audit, clientName, niche, mode, agencyName, bench }: RelatorioInteligentePDFProps) {
  const rm      = audit._realMetrics || {}
  const dq      = audit._dataQuality || {}
  const grade   = audit.grade || '?'
  const gCol    = gradeColor(grade)
  const now     = new Date(audit.generated_at || Date.now()).toLocaleDateString('pt-BR')
  const period  = audit._period || 'Últimos 30 dias'
  const source  = audit._auditSource || 'auto'
  const sourceLabel = source === 'api' ? 'Somente API' : source === 'upload' ? 'Somente arquivo' : 'Consolidado'

  const classified = audit._campanhasClassificadas || {}
  const winners  = classified.vencedoras || []
  const critical = classified.criticas   || []
  const attn     = classified.atencao    || []
  const waste    = audit._wasteCampaigns || []
  const wastePct = audit._wastePercent   || 0

  const actions  = (audit.o_que_eu_faria_agora || []).slice(0, 5).map((a: any) =>
    typeof a === 'string' ? { titulo: a, prioridade: 'média' } : a
  )
  const plano    = audit.plano_acao || {}
  const gargalos = (audit.gargalos || []).slice(0, 4)
  const opps     = (audit.oportunidades || []).slice(0, 3)
  const insights = (audit.insights_senior || []).slice(0, 2)

  const modeLabel = mode === 'executivo' ? 'Relatório Executivo' : mode === 'tecnico' ? 'Relatório Técnico' : 'Relatório para Cliente'
  const modeColor = mode === 'executivo' ? '#38BDF8' : mode === 'tecnico' ? '#A78BFA' : '#22C55E'

  return (
    <Document>
      {/* ── PAGE 1 ─────────────────────────────────────────────────────────── */}
      <Page size="A4" style={S.page}>
        <View style={S.header}>
          <Text style={S.logo}>{agencyName || 'ELYON'}</Text>
          <View style={S.hRight}>
            <Text style={S.hLabel}>{modeLabel} · {now}</Text>
            <Text style={S.hVal}>{clientName} · {niche}</Text>
          </View>
        </View>

        {/* Cover */}
        <View style={S.coverBox}>
          <View style={[S.modeBadge, { backgroundColor: `${modeColor}18`, alignSelf: 'flex-start', marginBottom: 10 }]}>
            <Text style={[S.modeBadgeTxt, { color: modeColor }]}>{modeLabel.toUpperCase()}</Text>
          </View>
          <Text style={S.coverTitle}>{clientName}</Text>
          <Text style={S.coverSub}>{niche} · {period} · Fonte: {sourceLabel}</Text>
          <View style={S.coverMeta}>
            <View style={S.coverItem}>
              <Text style={S.coverLabel}>Investimento</Text>
              <Text style={[S.coverValue, { color: '#F0B429' }]}>{fmtR(rm.totalSpend || 0)}</Text>
            </View>
            <View style={S.coverItem}>
              <Text style={S.coverLabel}>Leads/Conv.</Text>
              <Text style={[S.coverValue, { color: '#22C55E' }]}>{rm.totalLeads ?? '—'}</Text>
            </View>
            <View style={S.coverItem}>
              <Text style={S.coverLabel}>CPL Médio</Text>
              <Text style={[S.coverValue, { color: '#38BDF8' }]}>{rm.avgCPL ? `R$${rm.avgCPL}` : '—'}</Text>
            </View>
            {rm.avgROAS > 0 && (
              <View style={S.coverItem}>
                <Text style={S.coverLabel}>ROAS</Text>
                <Text style={[S.coverValue, { color: '#A78BFA' }]}>{rm.avgROAS}×</Text>
              </View>
            )}
          </View>
        </View>

        {/* Score */}
        <View style={S.scoreRow}>
          <View>
            <Text style={S.hLabel}>Score de saúde</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={[S.scoreNum, { color: gCol }]}>{audit.health_score}</Text>
              <Text style={[S.scoreGrade, { color: gCol }]}>{grade}</Text>
            </View>
          </View>
          <View style={{ flex: 1, paddingLeft: 16 }}>
            {audit.executive_summary && <Text style={S.body}>{audit.executive_summary}</Text>}
          </View>
        </View>

        {/* Benchmark (Técnico + Executivo) */}
        {bench && (mode === 'tecnico' || mode === 'executivo') && (
          <>
            <Text style={S.sectionTitle}>Benchmark do Nicho ({niche})</Text>
            <View style={S.benchRow}>
              <View style={S.benchBox}>
                <Text style={S.benchLabel}>CPL Mín.</Text>
                <Text style={[S.benchValue, { color: '#22C55E' }]}>R${bench.cpl_min}</Text>
              </View>
              <View style={S.benchBox}>
                <Text style={S.benchLabel}>CPL Máx.</Text>
                <Text style={[S.benchValue, { color: '#F0B429' }]}>R${bench.cpl_max}</Text>
              </View>
              <View style={S.benchBox}>
                <Text style={S.benchLabel}>ROAS Bom</Text>
                <Text style={[S.benchValue, { color: '#A78BFA' }]}>{bench.roas_good}×</Text>
              </View>
              {rm.avgCPL > 0 && (
                <View style={S.benchBox}>
                  <Text style={S.benchLabel}>Seu CPL</Text>
                  <Text style={[S.benchValue, { color: rm.avgCPL <= bench.cpl_max ? '#22C55E' : '#FF4D4D' }]}>
                    R${rm.avgCPL}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Campanhas críticas */}
        {critical.length > 0 && (mode === 'tecnico' || mode === 'executivo') && (
          <>
            <Text style={S.sectionTitle}>Campanhas Críticas</Text>
            {critical.slice(0, 3).map((c: any, i: number) => (
              <View key={i} style={[S.campCard, { backgroundColor: 'rgba(255,77,77,0.06)', borderColor: 'rgba(255,77,77,0.25)' }]}>
                <View style={S.campRow}>
                  <Text style={S.campName}>{c.name}</Text>
                  <Text style={[S.campCPL, { color: '#FF4D4D' }]}>{c.leads === 0 ? '0 conv.' : c.cpl ? `R$${Math.round(c.cpl)}` : fmtR(c.spend)}</Text>
                </View>
                {c.evidence && <Text style={S.campEvid}>{c.evidence}</Text>}
                {c.recommended_action && <Text style={[S.campAct, { color: '#FF4D4D' }]}>{c.recommended_action}</Text>}
              </View>
            ))}
          </>
        )}

        {/* Desperdício */}
        {waste.length > 0 && (
          <>
            <Text style={S.sectionTitle}>Desperdício Estimado — {fmtR(waste.reduce((s: number, c: any) => s + c.spend, 0))} ({wastePct}%)</Text>
            {waste.slice(0, 4).map((c: any, i: number) => (
              <View key={i} style={S.wasteCard}>
                <Text style={S.wasteName}>{c.name}</Text>
                <Text style={S.wasteAmt}>{fmtR(c.spend)} · 0 conv.</Text>
              </View>
            ))}
          </>
        )}

        <View style={S.footer} fixed>
          <Text style={S.footerText}>{agencyName || 'ELYON'} · {modeLabel} · Página 1</Text>
          <Text style={S.footerText}>{clientName} · {now}</Text>
        </View>
      </Page>

      {/* ── PAGE 2 ─────────────────────────────────────────────────────────── */}
      <Page size="A4" style={S.page2}>
        <View style={S.header}>
          <Text style={S.logo}>{agencyName || 'ELYON'}</Text>
          <View style={S.hRight}>
            <Text style={S.hLabel}>Plano de Ação · {now}</Text>
            <Text style={S.hVal}>{clientName} · {niche}</Text>
          </View>
        </View>

        {/* Campanhas vencedoras (Técnico + Agência) */}
        {winners.length > 0 && mode !== 'executivo' && (
          <>
            <Text style={S.sectionTitle}>Campanhas Vencedoras</Text>
            {winners.slice(0, 3).map((c: any, i: number) => (
              <View key={i} style={[S.campCard, { backgroundColor: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.25)' }]}>
                <View style={S.campRow}>
                  <Text style={S.campName}>{c.name}</Text>
                  <Text style={[S.campCPL, { color: '#22C55E' }]}>{c.cpl ? `R$${Math.round(c.cpl)}` : fmtR(c.spend)}</Text>
                </View>
                {c.evidence && <Text style={S.campEvid}>{c.evidence}</Text>}
                {c.recommended_action && <Text style={[S.campAct, { color: '#22C55E' }]}>{c.recommended_action}</Text>}
              </View>
            ))}
          </>
        )}

        {/* O que fazer agora */}
        {actions.length > 0 && (
          <>
            <Text style={S.sectionTitle}>O Que Fazer Agora</Text>
            {actions.map((a: any, i: number) => {
              const pc = prioColor(a.prioridade || 'média')
              return (
                <View key={i} style={S.actionCard}>
                  <View style={S.actionNum}><Text style={S.actionNumTxt}>{i + 1}</Text></View>
                  <View style={S.actionContent}>
                    <Text style={S.actionTitle}>{a.titulo}</Text>
                    {a.motivo && <Text style={S.actionDetail}>{a.motivo}</Text>}
                    {(a.prazo || a.esforco) && (
                      <Text style={[S.actionDetail, { color: pc, marginTop: 2 }]}>
                        {[a.prioridade, a.prazo, a.esforco ? `esforço ${a.esforco}` : ''].filter(Boolean).join(' · ')}
                      </Text>
                    )}
                  </View>
                </View>
              )
            })}
          </>
        )}

        {/* Gargalos (Técnico) */}
        {gargalos.length > 0 && mode === 'tecnico' && (
          <>
            <Text style={S.sectionTitle}>Gargalos Identificados</Text>
            {gargalos.map((g: any, i: number) => (
              <View key={i} style={S.listRow}>
                <Text style={[S.listDot, { color: '#FF4D4D' }]}>✕</Text>
                <Text style={S.listText}>{typeof g === 'string' ? g : g.titulo || g.descricao || ''}</Text>
              </View>
            ))}
          </>
        )}

        {/* Oportunidades (Agência + Executivo) */}
        {opps.length > 0 && mode !== 'tecnico' && (
          <>
            <Text style={S.sectionTitle}>Oportunidades Identificadas</Text>
            {opps.map((o: any, i: number) => (
              <View key={i} style={S.listRow}>
                <Text style={[S.listDot, { color: '#22C55E' }]}>+</Text>
                <Text style={S.listText}>{typeof o === 'string' ? o : o.titulo || o.descricao || ''}</Text>
              </View>
            ))}
          </>
        )}

        {/* Plano de ação por horizonte (Técnico) */}
        {mode === 'tecnico' && (plano.curto?.length || plano.medio?.length) && (
          <>
            <Text style={S.sectionTitle}>Plano de Ação</Text>
            {[...(plano.curto || []), ...(plano.medio || [])].slice(0, 5).map((p: any, i: number) => (
              <View key={i} style={[S.actionCard]}>
                <View style={S.actionNum}><Text style={S.actionNumTxt}>{i + 1}</Text></View>
                <View style={S.actionContent}>
                  <Text style={S.actionTitle}>{p.acao}</Text>
                  {p.impacto && <Text style={S.actionDetail}>{p.impacto}</Text>}
                </View>
              </View>
            ))}
          </>
        )}

        {/* Insights (IA comentário) */}
        {insights.length > 0 && (
          <>
            <Text style={S.sectionTitle}>Comentário do Especialista</Text>
            {insights.map((ins: any, i: number) => {
              const txt = typeof ins === 'string' ? ins : `${ins.titulo ? ins.titulo + ': ' : ''}${ins.texto || ''}`
              return (
                <View key={i} style={S.listRow}>
                  <Text style={[S.listDot, { color: '#A78BFA' }]}>→</Text>
                  <Text style={S.listText}>{txt}</Text>
                </View>
              )
            })}
          </>
        )}

        {/* Confiança dos dados */}
        {dq.reason && (
          <Text style={[S.body, { marginTop: 14, fontStyle: 'italic' }]}>{dq.reason}</Text>
        )}

        <View style={S.footer} fixed>
          <Text style={S.footerText}>{agencyName || 'ELYON'} · {modeLabel} · Página 2</Text>
          <Text style={S.footerText}>{clientName} · {now}</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function generateRelatorioInteligentePDF(
  audit: Record<string, any>,
  clientName: string,
  niche: string,
  mode: 'executivo' | 'tecnico' | 'agencia',
  agencyName?: string,
  bench?: { cpl_min: number; cpl_max: number; roas_good: number; best_channels: string[] } | null,
) {
  const blob = await pdf(
    <RelatorioDocument
      audit={audit} clientName={clientName} niche={niche}
      mode={mode} agencyName={agencyName} bench={bench}
    />
  ).toBlob()

  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href  = url
  link.download = `relatorio-${mode}-${clientName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}
