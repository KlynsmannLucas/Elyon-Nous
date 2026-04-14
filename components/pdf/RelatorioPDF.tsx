// components/pdf/RelatorioPDF.tsx — Relatório PDF com @react-pdf/renderer
// Chamado via generatePDF() que abre em nova aba

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer'
import {
  clientProfile,
  audienceProfile,
  strategyData,
  growthData,
  performanceData,
  overviewKPIs,
} from '@/lib/mockData'

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Páginas
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

  // Tipografia
  logo: {
    fontSize: 36,
    color: '#F0B429',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    letterSpacing: 4,
  },
  h1: {
    fontSize: 26,
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
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

  // Layout
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },

  // Cards
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

  // Dividers
  divider: {
    height: 1,
    backgroundColor: '#2A2A30',
    marginVertical: 16,
  },

  // Accent bar
  accentBar: {
    width: 4,
    height: '100%',
    backgroundColor: '#F0B429',
    borderRadius: 2,
    marginRight: 12,
  },

  // Table
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

  // Bullet list item
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
        ELYON
      </Text>
      <Text style={{ fontSize: 9, color: '#64748B' }}>
        {title} · {page}/{total}
      </Text>
    </View>
  )
}

// ── PÁGINA 1 — Capa ────────────────────────────────────────────────────────────
function PageCover() {
  const date = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  return (
    <Page size="A4" style={styles.pageCover}>
      {/* Accent dourado */}
      <View style={{ width: 60, height: 4, backgroundColor: '#F0B429', borderRadius: 2, marginBottom: 32 }} />

      {/* Logo */}
      <Text style={styles.logo}>ELYON</Text>
      <Text style={{ fontSize: 10, color: '#64748B', letterSpacing: 3, marginBottom: 48 }}>
        INTELIGÊNCIA DE MARKETING COM IA
      </Text>

      {/* Nicho */}
      <View style={{
        backgroundColor: '#111114',
        borderWidth: 1,
        borderColor: 'rgba(240,180,41,0.3)',
        borderRadius: 12,
        padding: '16 28',
        marginBottom: 24,
        alignItems: 'center',
      }}>
        <Text style={{ fontSize: 9, color: '#F0B429', letterSpacing: 2, marginBottom: 6 }}>
          NICHO ANALISADO
        </Text>
        <Text style={{ fontSize: 22, color: '#FFFFFF', fontFamily: 'Helvetica-Bold' }}>
          {clientProfile.niche}
        </Text>
      </View>

      {/* Cliente + data */}
      <Text style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>
        {clientProfile.clientName}
      </Text>
      <Text style={{ fontSize: 9, color: '#64748B' }}>
        Gerado em {date}
      </Text>

      {/* Rodapé */}
      <View style={{ position: 'absolute', bottom: 40, alignItems: 'center' }}>
        <Text style={{ fontSize: 8, color: '#2A2A30' }}>
          Relatório gerado automaticamente pela plataforma ELYON · Uso exclusivo interno
        </Text>
      </View>
    </Page>
  )
}

// ── PÁGINA 2 — Perfil de Audiência ────────────────────────────────────────────
function PageAudience() {
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="Perfil de Audiência" page={2} total={4} />

      <Text style={styles.h2}>Perfil de Audiência Validado</Text>
      <Text style={{ ...styles.body, marginBottom: 16 }}>
        Dados baseados em campanhas reais no nicho {clientProfile.niche}.
      </Text>

      {/* 7 métricas em grid 4+3 */}
      <View style={{ ...styles.row, marginBottom: 12 }}>
        {audienceProfile.metrics.slice(0, 4).map((m) => (
          <View key={m.label} style={styles.kpiCard}>
            <Text style={{ fontSize: 14, marginBottom: 4 }}>{m.icon}</Text>
            <Text style={styles.kpiLabel}>{m.label}</Text>
            <Text style={{ ...styles.kpiValue, fontSize: 11, color: '#F0B429' }}>{m.value}</Text>
          </View>
        ))}
      </View>
      <View style={{ ...styles.row, marginBottom: 20 }}>
        {audienceProfile.metrics.slice(4).map((m) => (
          <View key={m.label} style={{ ...styles.kpiCard, flex: 1 }}>
            <Text style={{ fontSize: 14, marginBottom: 4 }}>{m.icon}</Text>
            <Text style={styles.kpiLabel}>{m.label}</Text>
            <Text style={{ ...styles.kpiValue, fontSize: 11, color: '#F0B429' }}>{m.value}</Text>
          </View>
        ))}
        {/* spacer para alinhar */}
        <View style={{ flex: 1 }} />
      </View>

      {/* 4 quadrantes */}
      <View style={styles.row}>
        {/* Coluna esquerda */}
        <View style={styles.col}>
          <View style={{ ...styles.card, borderColor: 'rgba(255,77,77,0.3)' }}>
            <Text style={{ ...styles.h3, color: '#FF4D4D' }}>💢 Dores</Text>
            {audienceProfile.pains.map((p) => <BulletItem key={p} text={p} />)}
          </View>
          <View style={{ ...styles.card, borderColor: 'rgba(240,180,41,0.3)' }}>
            <Text style={{ ...styles.h3, color: '#F0B429' }}>🪝 Hooks</Text>
            {audienceProfile.hooks.map((h) => <BulletItem key={h} text={h} />)}
          </View>
        </View>

        {/* Coluna direita */}
        <View style={styles.col}>
          <View style={{ ...styles.card, borderColor: 'rgba(34,197,94,0.3)' }}>
            <Text style={{ ...styles.h3, color: '#22C55E' }}>✅ Por que compram</Text>
            {audienceProfile.motivations.map((m) => <BulletItem key={m} text={m} />)}
          </View>
          <View style={{ ...styles.card, borderColor: 'rgba(245,158,11,0.3)' }}>
            <Text style={{ ...styles.h3, color: '#F59E0B' }}>🚧 Objeções</Text>
            {audienceProfile.objections.map((o) => <BulletItem key={o} text={o} />)}
          </View>
        </View>
      </View>
    </Page>
  )
}

// ── PÁGINA 3 — Estratégia ─────────────────────────────────────────────────────
function PageStrategy() {
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="Estratégia" page={3} total={4} />

      <Text style={styles.h2}>Estratégia Recomendada</Text>
      <Text style={{ ...styles.body, marginBottom: 20 }}>
        Distribuição de budget e canais priorizados por ROI esperado.
      </Text>

      {/* Tabela de canais */}
      <View style={styles.tableHeader}>
        <Text style={{ ...styles.tableHeaderCell }}>Canal</Text>
        <Text style={{ ...styles.tableHeaderCell }}>Prioridade</Text>
        <Text style={{ ...styles.tableHeaderCell }}>Budget/mês</Text>
        <Text style={{ ...styles.tableHeaderCell }}>CPL est.</Text>
        <Text style={{ ...styles.tableHeaderCell }}>Status</Text>
      </View>

      {strategyData.channels.map((ch) => (
        <View key={ch.name} style={styles.tableRow}>
          <Text style={{ ...styles.tableCell, color: '#FFFFFF', fontFamily: 'Helvetica-Bold' }}>{ch.name}</Text>
          <Text style={styles.tableCell}>{ch.priority}</Text>
          <Text style={{ ...styles.tableCell, color: '#F0B429' }}>{ch.budget}</Text>
          <Text style={styles.tableCell}>{ch.cpl}</Text>
          <Text style={{ ...styles.tableCell, color: ch.status === 'Ativo' ? '#22C55E' : '#FF4D4D' }}>
            {ch.status}
          </Text>
        </View>
      ))}

      {/* Insight IA */}
      <View style={{ ...styles.card, borderColor: 'rgba(240,180,41,0.3)', marginTop: 20 }}>
        <Text style={styles.h3}>🧠 Insight da IA</Text>
        <Text style={styles.body}>{strategyData.aiInsight}</Text>
      </View>

      <View style={styles.divider} />

      {/* Cenários */}
      <Text style={styles.h3}>Cenários de Budget</Text>
      <View style={styles.row}>
        {growthData.scenarios.map((s) => (
          <View
            key={s.name}
            style={{
              ...styles.kpiCard,
              borderColor: s.recommended ? 'rgba(240,180,41,0.5)' : '#2A2A30',
            }}
          >
            <Text style={{ fontSize: 9, color: s.recommended ? '#F0B429' : '#64748B', marginBottom: 4 }}>
              {s.name}{s.recommended ? ' ★' : ''}
            </Text>
            <Text style={{ fontSize: 13, color: '#FFFFFF', fontFamily: 'Helvetica-Bold', marginBottom: 8 }}>
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

// ── PÁGINA 4 — Performance ────────────────────────────────────────────────────
function PagePerformance() {
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="Performance" page={4} total={4} />

      <Text style={styles.h2}>Performance da Campanha</Text>
      <Text style={{ ...styles.body, marginBottom: 20 }}>
        Métricas do período atual e análise dos criativos em circulação.
      </Text>

      {/* KPIs em linha */}
      <View style={{ ...styles.row, marginBottom: 20 }}>
        {performanceData.stats.map((s) => (
          <View key={s.label} style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{s.label}</Text>
            <Text style={{ ...styles.kpiValue, color: s.color }}>{s.value}</Text>
            <Text style={{ fontSize: 7, color: '#64748B' }}>{s.sub}</Text>
          </View>
        ))}
      </View>

      {/* Overview KPIs */}
      <Text style={styles.h3}>KPIs Principais</Text>
      <View style={{ ...styles.row, marginBottom: 20 }}>
        {overviewKPIs.map((kpi) => (
          <View key={kpi.label} style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{kpi.label}</Text>
            <Text style={{ ...styles.kpiValue, fontSize: 14, color: kpi.color }}>{kpi.value}</Text>
            <Text style={{ fontSize: 8, color: kpi.trend >= 0 ? '#22C55E' : '#FF4D4D' }}>
              {kpi.trend >= 0 ? '↑' : '↓'} {Math.abs(kpi.trend)}%
            </Text>
          </View>
        ))}
      </View>

      {/* Tabela criativos */}
      <Text style={styles.h3}>Criativos em Análise</Text>
      <View style={styles.tableHeader}>
        <Text style={{ ...styles.tableHeaderCell, flex: 3 }}>Criativo</Text>
        <Text style={styles.tableHeaderCell}>Canal</Text>
        <Text style={styles.tableHeaderCell}>Score IA</Text>
        <Text style={{ ...styles.tableHeaderCell, flex: 1.5 }}>Status</Text>
      </View>

      {performanceData.creatives.map((c) => (
        <View key={c.name} style={styles.tableRow}>
          <Text style={{ ...styles.tableCell, flex: 3, color: '#E2E8F0' }}>{c.name}</Text>
          <Text style={styles.tableCell}>{c.channel}</Text>
          <Text style={{
            ...styles.tableCell,
            color: c.score >= 80 ? '#22C55E' : c.score >= 60 ? '#F0B429' : '#FF4D4D',
            fontFamily: 'Helvetica-Bold',
          }}>
            {c.score}/100
          </Text>
          <Text style={{ ...styles.tableCell, flex: 1.5, color: c.statusColor }}>{c.status}</Text>
        </View>
      ))}

      {/* Rodapé */}
      <View style={{ position: 'absolute', bottom: 40, left: 40, right: 40 }}>
        <View style={styles.divider} />
        <Text style={{ fontSize: 8, color: '#2A2A30', textAlign: 'center' }}>
          ELYON · Relatório gerado automaticamente · Dados referentes a {clientProfile.period}
        </Text>
      </View>
    </Page>
  )
}

// ── Documento PDF completo ────────────────────────────────────────────────────
function RelatorioPDF() {
  return (
    <Document>
      <PageCover />
      <PageAudience />
      <PageStrategy />
      <PagePerformance />
    </Document>
  )
}

// ── Função exportada para abrir PDF em nova aba ───────────────────────────────
export async function generatePDF(): Promise<void> {
  const blob = await pdf(<RelatorioPDF />).toBlob()
  const url  = URL.createObjectURL(blob)
  window.open(url, '_blank')
}

export default RelatorioPDF
