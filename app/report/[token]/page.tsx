// app/report/[token]/page.tsx — Portal de relatório público (white-label)
import { Metadata } from 'next'

interface ReportData {
  clientName:    string
  niche:         string
  period:        string
  totalSpend:    number
  totalLeads:    number
  avgCPL:        number
  avgROAS:       number
  score:         number
  scoreGrade:    string
  activeCampaigns: number
  alerts:        Array<{ type: 'critical' | 'warning' | 'opportunity'; title: string; description: string }>
  channels:      Array<{ name: string; spend: number; leads: number; cpl: number }>
  highlights:    string[]
}

interface Branding {
  agencyName?:   string
  primaryColor?: string
  logoUrl?:      string
}

export const metadata: Metadata = {
  title: 'Relatório de Performance',
}

async function fetchReport(token: string): Promise<{ reportData?: ReportData; branding?: Branding; clientName?: string; error?: string }> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'https://elyon-nous.vercel.app'
    const res  = await fetch(`${base}/api/report?token=${token}`, { cache: 'no-store' })
    if (!res.ok) {
      const json = await res.json()
      return { error: json.error || 'Relatório não encontrado' }
    }
    const json = await res.json()
    return { reportData: json.reportData, branding: json.branding, clientName: json.clientName }
  } catch {
    return { error: 'Erro ao carregar relatório' }
  }
}

function fmt(n: number) {
  if (!n || isNaN(n)) return '—'
  if (n >= 1_000_000) return `R$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000)      return `R$${(n / 1000).toFixed(1)}k`
  return `R$${n.toFixed(0)}`
}

function scoreColor(score: number) {
  if (score >= 80) return '#22C55E'
  if (score >= 65) return '#F0B429'
  if (score >= 50) return '#FB923C'
  return '#FF4D4D'
}

function alertConfig(type: string) {
  if (type === 'critical')    return { color: '#FF4D4D', bg: 'rgba(255,77,77,0.08)',   border: 'rgba(255,77,77,0.2)',   icon: '🚨' }
  if (type === 'warning')     return { color: '#F0B429', bg: 'rgba(240,180,41,0.08)',  border: 'rgba(240,180,41,0.2)',  icon: '⚠️' }
  return                             { color: '#22C55E', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)',   icon: '💡' }
}

export default async function ReportPage({ params }: { params: { token: string } }) {
  const { reportData: rd, branding, clientName, error } = await fetchReport(params.token)

  const primary = branding?.primaryColor || '#F5A500'

  if (error || !rd) {
    return (
      <div style={{ minHeight: '100vh', background: '#030305', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔗</div>
          <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
            {error === 'Este link expirou' ? 'Link expirado' : 'Relatório não encontrado'}
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>
            {error || 'Este link de relatório não existe ou foi removido.'}
          </p>
        </div>
      </div>
    )
  }

  const sc = scoreColor(rd.score)

  return (
    <div style={{ minHeight: '100vh', background: '#030305', color: '#E2E8F0', fontFamily: 'system-ui, -apple-system, sans-serif', WebkitFontSmoothing: 'antialiased' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(12,12,18,0.95)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {branding?.logoUrl
            ? <img src={branding.logoUrl} alt="logo" style={{ height: '32px', objectFit: 'contain' }} />
            : (
              <div style={{ fontSize: '18px', fontWeight: 800, background: `linear-gradient(135deg, ${primary}, #FFD166)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {branding?.agencyName || 'ELYON'}
              </div>
            )
          }
        </div>
        <div style={{ fontSize: '12px', color: '#64748B' }}>
          Relatório de Performance · {rd.period}
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Client + Score */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>{clientName || rd.clientName}</h1>
            <div style={{ fontSize: '13px', color: '#64748B' }}>{rd.niche} · {rd.period}</div>
          </div>
          <div style={{ textAlign: 'center', background: '#0C0C12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px 24px' }}>
            <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Score da conta</div>
            <div style={{ fontSize: '40px', fontWeight: 800, color: sc, lineHeight: 1 }}>{rd.scoreGrade || '—'}</div>
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>{rd.score}/100</div>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '28px' }}>
          {[
            { label: 'Investimento', value: fmt(rd.totalSpend), color: '#F0B429' },
            { label: rd.avgROAS > 0 ? 'ROAS' : 'Leads', value: rd.avgROAS > 0 ? `${rd.avgROAS}×` : String(rd.totalLeads), color: rd.avgROAS > 0 ? '#22C55E' : '#38BDF8' },
            { label: 'CPL Médio', value: rd.avgCPL > 0 ? `R$${rd.avgCPL}` : '—', color: '#A78BFA' },
            { label: 'Campanhas ativas', value: String(rd.activeCampaigns || '—'), color: '#F0B429' },
          ].map(kpi => (
            <div key={kpi.label} style={{ background: '#0C0C12', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px' }}>
              <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{kpi.label}</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Destaques (Highlights) */}
        {rd.highlights && rd.highlights.length > 0 && (
          <div style={{ background: '#0C0C12', border: `1px solid ${primary}25`, borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: primary, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>
              ✨ Destaques do período
            </h3>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {rd.highlights.map((h, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#CBD5E1' }}>
                  <span style={{ color: primary, flexShrink: 0 }}>→</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Canais */}
        {rd.channels && rd.channels.length > 0 && (
          <div style={{ background: '#0C0C12', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>
              📊 Performance por Canal
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {rd.channels.map((ch, i) => {
                const pct = rd.totalSpend > 0 ? (ch.spend / rd.totalSpend) * 100 : 0
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', color: '#CBD5E1', fontWeight: 600 }}>{ch.name}</span>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#64748B' }}>
                        <span style={{ color: '#F0B429' }}>{fmt(ch.spend)}</span>
                        {ch.leads > 0 && <span style={{ color: '#38BDF8' }}>{ch.leads} leads</span>}
                        {ch.cpl > 0  && <span>CPL R${ch.cpl}</span>}
                      </div>
                    </div>
                    <div style={{ height: '4px', background: '#1E1E24', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: '99px', width: `${pct}%`, background: `linear-gradient(90deg, ${primary}, #FFD166)` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Alertas e Recomendações */}
        {rd.alerts && rd.alerts.length > 0 && (
          <div style={{ background: '#0C0C12', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>
              ⚡ Pontos de Atenção
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {rd.alerts.slice(0, 5).map((a, i) => {
                const c = alertConfig(a.type)
                return (
                  <div key={i} style={{ padding: '12px 14px', borderRadius: '10px', background: c.bg, border: `1px solid ${c.border}` }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '16px', flexShrink: 0 }}>{c.icon}</span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: c.color, marginBottom: '2px' }}>{a.title}</div>
                        <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.5 }}>{a.description}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ fontSize: '11px', color: '#334155' }}>
            Relatório gerado por {branding?.agencyName || 'ELYON'}
            {' · '}
            <span style={{ color: '#475569' }}>Dados referentes a {rd.period}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
