// components/dashboard/TabRelatorios.tsx — Portal white-label + Agendamento de email
'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { getBenchmark } from '@/lib/niche_benchmarks'
import { generateRelatorioInteligentePDF } from '@/components/pdf/RelatorioInteligentePDF'

interface ReportShare {
  token: string
  url: string
  createdAt?: string
}

interface Schedule {
  id?: string
  emails: string[]
  frequency: 'weekly' | 'monthly'
  dayOfWeek: number
  active: boolean
}

const DAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

interface Props {
  onNavigateToConnections?: () => void
}

// ── SVG icon helpers ────────────────────────────────────────────────────────

function IconDocument() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="rgba(124,58,237,0.10)" />
      <path d="M13 10h9l6 6v14a1 1 0 0 1-1 1H13a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1z" stroke="#2C5FE0" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <path d="M22 10v7h6" stroke="#2C5FE0" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <line x1="15" y1="22" x2="25" y2="22" stroke="#2C5FE0" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="15" y1="25.5" x2="22" y2="25.5" stroke="#2C5FE0" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconLink({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.5 10.5a3.75 3.75 0 0 0 5.303 0l2.25-2.25a3.75 3.75 0 0 0-5.303-5.303L8.625 4.07" stroke="#2C5FE0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.5 7.5a3.75 3.75 0 0 0-5.303 0l-2.25 2.25a3.75 3.75 0 0 0 5.303 5.303l1.121-1.122" stroke="#2C5FE0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconMail({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="14" height="10" rx="2" stroke="#2C5FE0" strokeWidth="1.5" />
      <path d="M2 6.5l7 4.5 7-4.5" stroke="#2C5FE0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconEye({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.5 9s2.7-5.25 7.5-5.25S16.5 9 16.5 9s-2.7 5.25-7.5 5.25S1.5 9 1.5 9z" stroke="#2C5FE0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="9" r="2.25" stroke="#2C5FE0" strokeWidth="1.5" />
    </svg>
  )
}

function IconWarning({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1.5l6.5 12H1.5L8 1.5z" stroke="#E08B0B" strokeWidth="1.4" strokeLinejoin="round" />
      <line x1="8" y1="6" x2="8" y2="9.5" stroke="#E08B0B" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r="0.7" fill="#E08B0B" />
    </svg>
  )
}

function IconReport({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="1.5" width="14" height="15" rx="2" stroke="#2C5FE0" strokeWidth="1.5" />
      <line x1="5" y1="6" x2="13" y2="6" stroke="#2C5FE0" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="5" y1="9" x2="13" y2="9" stroke="#2C5FE0" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="5" y1="12" x2="9" y2="12" stroke="#2C5FE0" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

// ── Relatório Inteligente helpers ───────────────────────────────────────────

function rlPrioColor(p: string): string {
  const s = (p || '').toLowerCase()
  if (s === 'p1' || s === 'alta' || s === 'crítica' || s === 'critica') return '#FF4D4D'
  if (s === 'p2' || s === 'média' || s === 'media') return '#F0B429'
  return '#0E9E6E'
}

function rlScoreColor(s: number): string {
  if (s >= 75) return '#0E9E6E'
  if (s >= 55) return '#F0B429'
  return '#E1483F'
}

function rlFmt(n: number | undefined | null, prefix = '', suffix = '', decimals = 0): string {
  if (n == null || n === 0) return '—'
  return `${prefix}${n.toFixed(decimals)}${suffix}`
}

function rlTrunc(s: string | undefined, max = 40): string {
  if (!s) return '—'
  return s.length > max ? s.slice(0, max) + '…' : s
}

function rlStatusIcon(status: string): string {
  if (status === 'verificado') return '✓'
  if (status === 'problema') return '✗'
  if (status === 'nao_verificado') return '?'
  return '—'
}

function rlStatusColor(status: string): string {
  if (status === 'verificado') return '#0E9E6E'
  if (status === 'problema') return '#E1483F'
  if (status === 'nao_verificado') return '#F0B429'
  return '#8A93A3'
}

// ── Shared style constants ──────────────────────────────────────────────────

const S = {
  card: {
    background: '#FFFFFF',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    padding: '22px',
  } as React.CSSProperties,

  inputBase: {
    background: '#FBFCFD',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '10px',
    color: '#161B26',
    fontSize: '13px',
    padding: '8px 12px',
    outline: 'none',
    width: '100%',
    display: 'block',
  } as React.CSSProperties,

  label: {
    fontSize: '11px',
    color: '#5A6473',
    marginBottom: '6px',
    display: 'block',
  } as React.CSSProperties,

  ctaBtn: {
    background: 'linear-gradient(135deg, #2C5FE0, #2C5FE0)',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 700,
    padding: '9px 20px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    opacity: 1,
  } as React.CSSProperties,

  ghostBtn: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: '10px',
    color: '#CBD5E1',
    fontSize: '13px',
    fontWeight: 700,
    padding: '9px 20px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  } as React.CSSProperties,
}

// ── Component ────────────────────────────────────────────────────────────────

export function TabRelatorios({ onNavigateToConnections }: Props) {
  const { clientData, auditCache, connectedAccounts, pendingActionsCache } = useAppStore()

  // ── Share state ──
  const [shareLoading, setShareLoading]   = useState(false)
  const [shareError,   setShareError]     = useState('')
  const [shareResult,  setShareResult]    = useState<ReportShare | null>(null)
  const [copied,       setCopied]         = useState(false)
  const [expiresInDays, setExpiresInDays] = useState(30)

  // ── Branding state ──
  const [agencyName,    setAgencyName]    = useState('')
  const [primaryColor,  setPrimaryColor]  = useState('#2C5FE0')

  // ── Relatório Inteligente state ──
  const [reportMode, setReportMode] = useState<'executivo' | 'tecnico' | 'agencia'>('executivo')
  const [pdfLoading, setPdfLoading] = useState(false)

  // ── Schedule state ──
  const [scheduleEmails,    setScheduleEmails]    = useState('')
  const [scheduleFrequency, setScheduleFrequency] = useState<'weekly' | 'monthly'>('weekly')
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState(1)
  const [scheduleActive,    setScheduleActive]    = useState(true)
  const [scheduleSaving,    setScheduleSaving]    = useState(false)
  const [scheduleMsg,       setScheduleMsg]       = useState('')
  const [existingSchedule,  setExistingSchedule]  = useState<Schedule | null>(null)

  const cacheKey  = clientData?.clientName || ''
  const audits    = cacheKey ? (auditCache[cacheKey] || []) : []
  const latest    = audits[0]
  const rm        = latest?.audit?._realMetrics || latest?.audit?._intelligenceData?.totals

  // Fetch existing schedule on mount
  useEffect(() => {
    if (!cacheKey) return
    fetch('/api/reports/schedule')
      .then(r => r.json())
      .then(({ schedules }) => {
        const found = (schedules || []).find((s: any) => s.client_name === cacheKey)
        if (found) {
          setExistingSchedule({ id: found.id, emails: found.emails, frequency: found.frequency, dayOfWeek: found.day_of_week, active: found.active })
          setScheduleEmails(found.emails.join(', '))
          setScheduleFrequency(found.frequency)
          setScheduleDayOfWeek(found.day_of_week)
          setScheduleActive(found.active)
        }
      })
      .catch(() => {})
  }, [cacheKey])

  // ── Build report data snapshot ─────────────────────────────────────
  function buildReportData() {
    if (!clientData) return null

    const globalRecs = latest?.audit?.globalRecs || latest?.audit?._intelligenceData?.globalRecs || []
    const channels   = connectedAccounts.map(a => ({
      name:   a.platform === 'meta' ? 'Meta Ads' : 'Google Ads',
      spend:  rm?.totalSpend ? rm.totalSpend * (a.platform === 'meta' ? 0.7 : 0.3) : 0,
      leads:  rm?.totalLeads ? rm.totalLeads * (a.platform === 'meta' ? 0.7 : 0.3) : 0,
      cpl:    rm?.avgCPL || 0,
    }))

    const score = latest?.audit?._intelligenceData?.score || latest?.audit?.score || 60
    const scoreGrade = score >= 90 ? 'A+' : score >= 85 ? 'A' : score >= 80 ? 'A-' : score >= 75 ? 'B+' : score >= 70 ? 'B' : score >= 65 ? 'B-' : score >= 55 ? 'C+' : 'C'

    const highlights: string[] = []
    if (rm?.totalLeads > 0) highlights.push(`${rm.totalLeads} leads gerados no período com investimento de R$${rm.totalSpend?.toFixed(0)}`)
    if (rm?.avgCPL > 0) highlights.push(`Custo por lead médio de R$${rm.avgCPL}`)
    if (rm?.avgROAS > 0) highlights.push(`ROAS médio de ${rm.avgROAS}× — R$${rm.totalRevenue?.toFixed(0)} em receita atribuída`)

    return {
      clientName:      clientData.clientName,
      niche:           clientData.niche,
      period:          'últimos 30 dias',
      totalSpend:      rm?.totalSpend || 0,
      totalLeads:      rm?.totalLeads || 0,
      avgCPL:          rm?.avgCPL || rm?.cpl || 0,
      avgROAS:         rm?.avgROAS || rm?.roas || 0,
      score,
      scoreGrade,
      activeCampaigns: rm?.activeCampaigns || 0,
      alerts:          globalRecs.slice(0, 5),
      channels,
      highlights,
    }
  }

  // ── Relatório Inteligente derived data ────────────────────────────
  const audit      = audits[0]?.audit
  const rRm        = audit?._realMetrics || {}
  const rDq        = audit?._dataQuality || {}
  const rScore: number = audit?._intelligenceData?.score ?? audit?.score ?? audit?.health_score ?? 0
  const rGrade: string = audit?.grade || '?'
  const rClass     = audit?._campanhasClassificadas || {}
  const rWinners   = rClass.vencedoras || []
  const rCritical  = rClass.criticas   || []
  const rAttn      = rClass.atencao    || []
  const rAllCamps  = [...rWinners, ...rAttn, ...rCritical]
  const rWaste     = audit?._wasteCampaigns || []
  const rChecklist = audit?._trackingChecklist || []
  const rGargalos  = audit?.gargalos    || []
  const rOport     = audit?.oportunidades || []
  const rInsights  = audit?.insights_senior || []
  const rPlano     = audit?.plano_acao  || {}
  const rActions   = (audit?.o_que_eu_faria_agora || []).map((a: any) =>
    typeof a === 'string' ? { titulo: a, prioridade: 'P2' } : a
  )
  const rBench     = clientData ? getBenchmark(clientData.niche) : null
  const rCompleted = (pendingActionsCache[cacheKey] || []).filter(a => a.status === 'concluida')
  const rPending   = (pendingActionsCache[cacheKey] || []).filter(a => a.status !== 'concluida' && a.status !== 'ignorada')

  // ── PDF Export ─────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    if (!audit || !clientData) return
    setPdfLoading(true)
    try {
      const benchArg = rBench ? {
        cpl_min: rBench.cpl_min, cpl_max: rBench.cpl_max,
        roas_good: rBench.kpi_thresholds.roas_good, best_channels: rBench.best_channels,
      } : null
      await generateRelatorioInteligentePDF(audit, clientData.clientName, clientData.niche, reportMode, agencyName || undefined, benchArg)
    } catch (e) {
      console.error('PDF export failed:', e)
    } finally {
      setPdfLoading(false)
    }
  }

  // ── Share actions ──────────────────────────────────────────────────
  const handleShare = async () => {
    const reportData = buildReportData()
    if (!reportData || !clientData) return
    setShareLoading(true)
    setShareError('')
    try {
      const res  = await fetch('/api/report', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName:   clientData.clientName,
          reportData,
          branding: { agencyName, primaryColor },
          expiresInDays,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      const fullUrl = `${window.location.origin}${json.url}`
      setShareResult({ token: json.token, url: fullUrl })
    } catch (e: any) {
      setShareError(e.message)
    } finally {
      setShareLoading(false)
    }
  }

  const copyLink = () => {
    if (!shareResult) return
    navigator.clipboard.writeText(shareResult.url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // ── Schedule actions ───────────────────────────────────────────────
  const handleSaveSchedule = async () => {
    if (!clientData) return
    const emailList = scheduleEmails.split(/[,;\n]/).map(e => e.trim()).filter(Boolean)
    if (emailList.length === 0) { setScheduleMsg('Insira pelo menos um email.'); return }
    setScheduleSaving(true)
    setScheduleMsg('')
    try {
      const res  = await fetch('/api/reports/schedule', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName: clientData.clientName, emails: emailList, frequency: scheduleFrequency, dayOfWeek: scheduleDayOfWeek, active: scheduleActive }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setScheduleMsg(existingSchedule ? '✓ Agendamento atualizado!' : '✓ Agendamento criado! Relatórios serão enviados automaticamente.')
      setExistingSchedule({ emails: emailList, frequency: scheduleFrequency, dayOfWeek: scheduleDayOfWeek, active: scheduleActive })
    } catch (e: any) {
      setScheduleMsg(`Erro: ${e.message}`)
    } finally {
      setScheduleSaving(false)
    }
  }

  // ── Empty state (no client) ────────────────────────────────────────
  if (!clientData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#161B26', margin: 0 }}>Relatórios</h2>
        </div>
        <div style={{ ...S.card, padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '12px' }}>
          <IconDocument />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#161B26', margin: 0 }}>Nenhum cliente selecionado</h3>
          <p style={{ fontSize: '13px', color: '#8A93A3', margin: 0 }}>Selecione um cliente no menu para gerar relatórios.</p>
        </div>
      </div>
    )
  }

  const hasData = !!rm

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#161B26', margin: '0 0 4px' }}>Relatórios</h2>
        <p style={{ fontSize: '13px', color: '#8A93A3', margin: 0 }}>
          Compartilhe relatórios com clientes e configure envios automáticos por email.
        </p>
      </div>

      {/* Warning banner — no data */}
      {!hasData && (
        <div style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: '10px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#E08B0B',
          fontSize: '13px',
        }}>
          <IconWarning size={16} />
          <span>Conecte suas contas de anúncio e execute a Análise Profunda para gerar relatórios com dados reais.</span>
          {onNavigateToConnections && (
            <button
              onClick={onNavigateToConnections}
              style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 700, color: '#E08B0B', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', flexShrink: 0 }}
            >
              Conectar →
            </button>
          )}
        </div>
      )}

      {/* ── 0. RELATÓRIO INTELIGENTE ────────────────────────────────────── */}
      {(() => {
        const sectionLabel: React.CSSProperties = {
          fontSize: '9px', fontWeight: 700, color: '#2C5FE0',
          letterSpacing: '0.08em', textTransform: 'uppercase',
          marginBottom: '8px', marginTop: '4px',
        }
        const sectionBox: React.CSSProperties = {
          background: '#0A0D18',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '10px',
          padding: '12px',
        }
        const benchBox: React.CSSProperties = {
          background: '#0A0D18',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '8px',
          padding: '10px',
          textAlign: 'center' as const,
        }

        const hasAudit = !!audit?._realMetrics

        return (
          <div style={S.card}>
            {/* Heading + mode tabs */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconReport size={17} />
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#161B26', margin: 0 }}>Relatório Inteligente</h3>
                  <p style={{ fontSize: '11px', color: '#8A93A3', margin: 0 }}>
                    {reportMode === 'executivo'
                      ? 'Visão geral para o decisor — sem jargão técnico.'
                      : reportMode === 'tecnico'
                      ? 'Análise completa para o gestor de tráfego.'
                      : 'Apresentação consultiva para o cliente.'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '3px', background: '#FBFCFD', borderRadius: '10px', padding: '3px' }}>
                  {(['executivo', 'tecnico', 'agencia'] as const).map(m => (
                    <button key={m} onClick={() => setReportMode(m)} style={{
                      padding: '5px 11px', fontSize: '11px', fontWeight: 700, borderRadius: '7px',
                      cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                      background: reportMode === m ? 'linear-gradient(135deg, #2C5FE0, #2C5FE0)' : 'transparent',
                      color: reportMode === m ? '#fff' : '#8A93A3',
                    }}>
                      {m === 'executivo' ? 'Executivo' : m === 'tecnico' ? 'Técnico' : 'Agência'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* No-data guard */}
            {!hasAudit ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '40px 0', textAlign: 'center' }}>
                <IconReport size={36} />
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#161B26', margin: 0 }}>Dados insuficientes</h4>
                <p style={{ fontSize: '13px', color: '#8A93A3', margin: 0, maxWidth: '300px' }}>
                  Execute a Análise Profunda para gerar o Relatório Inteligente com dados reais da conta.
                </p>
              </div>
            ) : (
              <>
                {/* ── Cover: client + score + KPIs ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '14px', marginBottom: '18px', background: '#0A0D18', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#161B26', marginBottom: '2px' }}>{clientData.clientName}</div>
                    <div style={{ fontSize: '12px', color: '#8A93A3', marginBottom: '12px' }}>
                      {clientData.niche} · {audit._period || 'Últimos 30 dias'} · Fonte:{' '}
                      {audit._auditSource === 'api' ? 'Somente API' : audit._auditSource === 'upload' ? 'Somente arquivo' : 'Consolidado'}
                    </div>
                    <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
                      {[
                        { label: 'Investimento', value: rlFmt(rRm.totalSpend, 'R$', '', 0), color: '#F0B429' },
                        { label: 'Leads', value: rlFmt(rRm.totalLeads, '', '', 0), color: '#2C5FE0' },
                        { label: 'CPL Médio', value: rlFmt(rRm.avgCPL, 'R$', '', 2), color: '#2C5FE0' },
                        ...(rRm.avgROAS > 0 ? [{ label: 'ROAS', value: rlFmt(rRm.avgROAS, '', '×', 2), color: '#0E9E6E' }] : []),
                      ].map(k => (
                        <div key={k.label}>
                          <div style={{ fontSize: '10px', color: '#8A93A3', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>{k.label}</div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: k.color }}>{k.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', minWidth: '72px' }}>
                    <div style={{ fontSize: '36px', fontWeight: 700, color: rlScoreColor(rScore), lineHeight: 1 }}>{rScore}</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: rlScoreColor(rScore) }}>{rGrade}</div>
                    <div style={{ fontSize: '9px', color: '#8A93A3', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score IA</div>
                  </div>
                </div>

                {/* ── EXECUTIVO MODE ── */}
                {reportMode === 'executivo' && (
                  <>
                    {audit.executive_summary && (
                      <div style={{ ...sectionBox, marginBottom: '14px' }}>
                        <div style={sectionLabel}>RESUMO EXECUTIVO</div>
                        <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: '1.65', margin: 0 }}>{audit.executive_summary}</p>
                      </div>
                    )}

                    {rWinners.length > 0 && (
                      <div style={{ marginBottom: '14px' }}>
                        <div style={sectionLabel}>O QUE ESTÁ FUNCIONANDO BEM</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {rWinners.slice(0, 4).map((c: any, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)', borderRadius: '8px' }}>
                              <span style={{ fontSize: '12px', color: '#0E9E6E', flexShrink: 0 }}>✓</span>
                              <span style={{ fontSize: '12px', color: '#CBD5E1', flex: 1 }}>{rlTrunc(c.campaign_name || c.name, 52)}</span>
                              {c.cpl > 0 && <span style={{ fontSize: '11px', color: '#0E9E6E', fontWeight: 700, flexShrink: 0 }}>R${c.cpl.toFixed(2)}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {rCritical.length > 0 && (
                      <div style={{ marginBottom: '14px' }}>
                        <div style={sectionLabel}>O QUE PRECISA DE ATENÇÃO</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {rCritical.slice(0, 3).map((c: any, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px 10px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px' }}>
                              <span style={{ fontSize: '12px', color: '#E1483F', flexShrink: 0, marginTop: '1px' }}>!</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '12px', color: '#CBD5E1' }}>{rlTrunc(c.campaign_name || c.name, 46)}</div>
                                {c.evidence && <div style={{ fontSize: '11px', color: '#5A6473', marginTop: '2px' }}>{rlTrunc(c.evidence, 80)}</div>}
                              </div>
                              {c.cpl > 0 && <span style={{ fontSize: '11px', color: '#E1483F', fontWeight: 700, flexShrink: 0 }}>R${c.cpl.toFixed(2)}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(audit._wastePercent || 0) > 0 && (
                      <div style={{ marginBottom: '14px', padding: '10px 14px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#E1483F', flexShrink: 0 }}>⚠</span>
                        <p style={{ fontSize: '12px', color: '#CBD5E1', margin: 0, lineHeight: '1.5' }}>
                          <strong style={{ color: '#E1483F' }}>Desperdício estimado:</strong>{' '}
                          {audit._wastePercent}% do orçamento em campanhas sem resultado
                          {rRm.totalSpend > 0 ? ` — aproximadamente ${rlFmt(rRm.totalSpend * audit._wastePercent / 100, 'R$', '', 0)} no período` : ''}.
                        </p>
                      </div>
                    )}

                    {rActions.length > 0 && (
                      <div style={{ marginBottom: '14px' }}>
                        <div style={sectionLabel}>O QUE FAZER AGORA</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {rActions.slice(0, 3).map((a: any, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px 10px', background: '#0A0D18', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                              <span style={{ fontSize: '10px', fontWeight: 700, color: rlPrioColor(a.prioridade), background: `${rlPrioColor(a.prioridade)}18`, border: `1px solid ${rlPrioColor(a.prioridade)}35`, borderRadius: '4px', padding: '1px 5px', flexShrink: 0, marginTop: '1px' }}>
                                {a.prioridade || 'P1'}
                              </span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '12px', color: '#161B26', fontWeight: 600 }}>{a.titulo || String(a)}</div>
                                {a.prazo && <div style={{ fontSize: '11px', color: '#8A93A3', marginTop: '2px' }}>Prazo: {a.prazo}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(rPlano.trinta_dias || []).length > 0 && (
                      <div>
                        <div style={sectionLabel}>PRÓXIMOS 30 DIAS</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {(rPlano.trinta_dias as string[]).slice(0, 4).map((item: string, i: number) => (
                            <div key={i} style={{ fontSize: '12px', color: '#5A6473', paddingLeft: '12px', position: 'relative', lineHeight: '1.5' }}>
                              <span style={{ position: 'absolute', left: 0, color: '#2C5FE0' }}>·</span>
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ── TÉCNICO MODE ── */}
                {reportMode === 'tecnico' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
                      {[
                        { label: 'Investimento', value: rlFmt(rRm.totalSpend, 'R$', '', 0), color: '#F0B429' },
                        { label: 'Leads', value: rlFmt(rRm.totalLeads, '', '', 0), color: '#2C5FE0' },
                        { label: 'CPL Médio', value: rlFmt(rRm.avgCPL, 'R$', '', 2), color: '#2C5FE0' },
                        { label: 'ROAS', value: rRm.avgROAS > 0 ? rlFmt(rRm.avgROAS, '', '×', 2) : '—', color: '#0E9E6E' },
                        { label: 'CTR Médio', value: rRm.avgCTR > 0 ? rlFmt(rRm.avgCTR, '', '%', 2) : '—', color: '#CBD5E1' },
                        { label: 'Impressões', value: rRm.totalImpressions > 0 ? `${((rRm.totalImpressions as number) / 1000).toFixed(0)}k` : '—', color: '#CBD5E1' },
                        { label: 'Campanhas', value: String(rAllCamps.length) || '—', color: '#CBD5E1' },
                        { label: 'Confiança', value: rDq.level === 'alto' ? 'Alta' : rDq.level === 'medio' ? 'Média' : 'Baixa', color: rDq.level === 'alto' ? '#0E9E6E' : rDq.level === 'medio' ? '#F0B429' : '#E1483F' },
                      ].map(k => (
                        <div key={k.label} style={{ background: '#0A0D18', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '8px 10px', textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#8A93A3', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>{k.label}</div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: k.color }}>{k.value}</div>
                        </div>
                      ))}
                    </div>

                    {rDq.reason && (
                      <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '14px' }}>
                        <span style={{ fontSize: '11px', color: '#8A93A3', fontStyle: 'italic' }}>{rDq.reason}</span>
                      </div>
                    )}

                    {rBench && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={sectionLabel}>BENCHMARK — {clientData.niche.toUpperCase()}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                          <div style={benchBox}>
                            <div style={{ fontSize: '9px', color: '#8A93A3', textTransform: 'uppercase', marginBottom: '3px' }}>CPL de mercado</div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#CBD5E1' }}>R${rBench.cpl_min}–R${rBench.cpl_max}</div>
                            {rRm.avgCPL > 0 && (
                              <div style={{ fontSize: '10px', marginTop: '3px', color: rRm.avgCPL <= rBench.kpi_thresholds.cpl_good ? '#0E9E6E' : rRm.avgCPL >= rBench.kpi_thresholds.cpl_bad ? '#E1483F' : '#F0B429' }}>
                                Seu CPL: {rlFmt(rRm.avgCPL, 'R$', '', 2)}{' '}
                                {rRm.avgCPL <= rBench.kpi_thresholds.cpl_good ? '✓' : rRm.avgCPL >= rBench.kpi_thresholds.cpl_bad ? '✗' : '~'}
                              </div>
                            )}
                          </div>
                          <div style={benchBox}>
                            <div style={{ fontSize: '9px', color: '#8A93A3', textTransform: 'uppercase', marginBottom: '3px' }}>ROAS referência</div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#CBD5E1' }}>{rBench.kpi_thresholds.roas_good}×</div>
                            {rRm.avgROAS > 0 && (
                              <div style={{ fontSize: '10px', marginTop: '3px', color: rRm.avgROAS >= rBench.kpi_thresholds.roas_good ? '#0E9E6E' : '#8A93A3' }}>
                                Seu ROAS: {rlFmt(rRm.avgROAS, '', '×', 2)}
                              </div>
                            )}
                          </div>
                          <div style={benchBox}>
                            <div style={{ fontSize: '9px', color: '#8A93A3', textTransform: 'uppercase', marginBottom: '3px' }}>Melhores canais</div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#CBD5E1' }}>{rBench.best_channels.slice(0, 2).join(', ')}</div>
                          </div>
                        </div>
                        <p style={{ fontSize: '10px', color: '#8A93A3', margin: '6px 0 0', fontStyle: 'italic' }}>* Benchmark baseado em médias de mercado — não representa dados específicos desta conta.</p>
                      </div>
                    )}

                    {rAllCamps.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={sectionLabel}>CAMPANHAS CLASSIFICADAS ({rAllCamps.length})</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {rAllCamps.map((c: any, i: number) => {
                            const isW = rWinners.some((w: any) => (w.campaign_name || w.name) === (c.campaign_name || c.name))
                            const isC = rCritical.some((x: any) => (x.campaign_name || x.name) === (c.campaign_name || c.name))
                            const borderCol  = isW ? 'rgba(34,197,94,0.15)' : isC ? 'rgba(239,68,68,0.15)' : 'rgba(240,180,41,0.12)'
                            const badgeBg    = isW ? 'rgba(34,197,94,0.10)' : isC ? 'rgba(239,68,68,0.10)' : 'rgba(240,180,41,0.10)'
                            const badgeColor = isW ? '#0E9E6E' : isC ? '#E1483F' : '#F0B429'
                            const badgeLabel = isW ? 'Vencedora' : isC ? 'Crítica' : 'Atenção'
                            return (
                              <div key={i} style={{ padding: '8px 10px', background: '#0A0D18', border: `1px solid ${borderCol}`, borderRadius: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                  <span style={{ fontSize: '9px', fontWeight: 700, color: badgeColor, background: badgeBg, borderRadius: '4px', padding: '1px 5px', flexShrink: 0 }}>{badgeLabel}</span>
                                  <span style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: 600, flex: 1 }}>{rlTrunc(c.campaign_name || c.name, 48)}</span>
                                  <span style={{ fontSize: '11px', color: '#5A6473', fontFamily: 'monospace', flexShrink: 0 }}>CPL: {rlFmt(c.cpl, 'R$', '', 2)}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', marginBottom: (c.evidence || c.recommended_action) ? '4px' : 0 }}>
                                  {c.spend > 0 && <span style={{ fontSize: '10px', color: '#8A93A3' }}>Gasto: {rlFmt(c.spend, 'R$')}</span>}
                                  {c.leads > 0 && <span style={{ fontSize: '10px', color: '#8A93A3' }}>Leads: {c.leads}</span>}
                                  {c.ctr  > 0 && <span style={{ fontSize: '10px', color: '#8A93A3' }}>CTR: {rlFmt(c.ctr, '', '%', 2)}</span>}
                                </div>
                                {c.evidence && <div style={{ fontSize: '10px', color: '#5A6473', lineHeight: '1.45' }}>{c.evidence}</div>}
                                {c.recommended_action && <div style={{ fontSize: '10px', color: '#2C5FE0', marginTop: '3px', fontWeight: 600 }}>→ {c.recommended_action}</div>}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {rWaste.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={sectionLabel}>DESPERDÍCIO ESTIMADO</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {rWaste.map((w: any, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.10)', borderRadius: '8px' }}>
                              <span style={{ fontSize: '10px', color: '#E1483F', fontWeight: 700, flexShrink: 0 }}>−</span>
                              <span style={{ fontSize: '11px', color: '#CBD5E1', flex: 1 }}>{rlTrunc(w.campaign_name || w.name, 46)}</span>
                              <span style={{ fontSize: '11px', color: '#E1483F', fontWeight: 700, flexShrink: 0 }}>{rlFmt(w.wasted_spend || w.spend, 'R$')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {rChecklist.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={sectionLabel}>TRACKING CHECKLIST</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                          {rChecklist.map((t: any, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px', background: '#0A0D18', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                              <span style={{ fontSize: '11px', color: rlStatusColor(t.status), flexShrink: 0 }}>{rlStatusIcon(t.status)}</span>
                              <span style={{ fontSize: '10px', color: '#5A6473' }}>{t.label || t.item || '—'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {rActions.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={sectionLabel}>O QUE EU FARIA AGORA</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {rActions.map((a: any, i: number) => (
                            <div key={i} style={{ padding: '10px', background: '#0A0D18', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                                <span style={{ fontSize: '10px', fontWeight: 700, color: rlPrioColor(a.prioridade), background: `${rlPrioColor(a.prioridade)}18`, border: `1px solid ${rlPrioColor(a.prioridade)}35`, borderRadius: '4px', padding: '1px 5px', flexShrink: 0 }}>
                                  {a.prioridade || 'P1'}
                                </span>
                                <span style={{ fontSize: '12px', color: '#161B26', fontWeight: 600 }}>{a.titulo || String(a)}</span>
                              </div>
                              {a.motivo    && <div style={{ fontSize: '10px', color: '#5A6473', marginBottom: '2px' }}><strong>Motivo:</strong> {a.motivo}</div>}
                              {a.evidencia && <div style={{ fontSize: '10px', color: '#5A6473', marginBottom: '2px' }}><strong>Evidência:</strong> {a.evidencia}</div>}
                              <div style={{ display: 'flex', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                                {a.prazo   && <span style={{ fontSize: '10px', color: '#8A93A3' }}>Prazo: {a.prazo}</span>}
                                {a.esforco && <span style={{ fontSize: '10px', color: '#8A93A3' }}>Esforço: {a.esforco}</span>}
                                {a.impacto && <span style={{ fontSize: '10px', color: '#8A93A3' }}>Impacto: {a.impacto}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(rPlano.sete_dias || rPlano.quinze_dias || rPlano.trinta_dias) && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={sectionLabel}>PLANO DE AÇÃO</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                          {[
                            { title: '7 dias', items: (rPlano.sete_dias || []) as string[], color: '#E1483F' },
                            { title: '15 dias', items: (rPlano.quinze_dias || []) as string[], color: '#F0B429' },
                            { title: '30 dias', items: (rPlano.trinta_dias || []) as string[], color: '#0E9E6E' },
                          ].map(col => (
                            <div key={col.title} style={{ background: '#0A0D18', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px' }}>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: col.color, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{col.title}</div>
                              {col.items.map((item, i) => (
                                <div key={i} style={{ fontSize: '10px', color: '#5A6473', marginBottom: '4px', paddingLeft: '10px', position: 'relative', lineHeight: '1.45' }}>
                                  <span style={{ position: 'absolute', left: 0, color: col.color }}>·</span>
                                  {item}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(rGargalos.length > 0 || rOport.length > 0) && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                        {rGargalos.length > 0 && (
                          <div>
                            <div style={sectionLabel}>GARGALOS</div>
                            {rGargalos.slice(0, 4).map((g: any, i: number) => (
                              <div key={i} style={{ fontSize: '11px', color: '#5A6473', marginBottom: '5px', paddingLeft: '12px', position: 'relative', lineHeight: '1.45' }}>
                                <span style={{ position: 'absolute', left: 0, color: '#E1483F' }}>✗</span>
                                {typeof g === 'string' ? g : g.titulo || g.descricao || ''}
                              </div>
                            ))}
                          </div>
                        )}
                        {rOport.length > 0 && (
                          <div>
                            <div style={sectionLabel}>OPORTUNIDADES</div>
                            {rOport.slice(0, 4).map((o: any, i: number) => (
                              <div key={i} style={{ fontSize: '11px', color: '#5A6473', marginBottom: '5px', paddingLeft: '12px', position: 'relative', lineHeight: '1.45' }}>
                                <span style={{ position: 'absolute', left: 0, color: '#0E9E6E' }}>→</span>
                                {typeof o === 'string' ? o : o.titulo || o.descricao || ''}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {rInsights.length > 0 && (
                      <div style={{ marginBottom: '14px' }}>
                        <div style={sectionLabel}>COMENTÁRIO DO ESPECIALISTA</div>
                        {rInsights.slice(0, 3).map((ins: any, i: number) => {
                          const txt = typeof ins === 'string' ? ins : `${ins.titulo ? ins.titulo + ': ' : ''}${ins.texto || ''}`
                          return (
                            <div key={i} style={{ fontSize: '11px', color: '#5A6473', marginBottom: '5px', paddingLeft: '12px', position: 'relative', lineHeight: '1.55' }}>
                              <span style={{ position: 'absolute', left: 0, color: '#2C5FE0' }}>→</span>
                              {txt}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* ── AGÊNCIA MODE ── */}
                {reportMode === 'agencia' && (
                  <>
                    {(audit.executive_summary || audit.comentario_ia) && (
                      <div style={{ ...sectionBox, marginBottom: '14px' }}>
                        <div style={sectionLabel}>ANÁLISE DO PERÍODO</div>
                        <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: '1.65', margin: 0 }}>
                          {audit.executive_summary || audit.comentario_ia}
                        </p>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                      {[
                        { label: 'Investimento', value: rlFmt(rRm.totalSpend, 'R$', '', 0), color: '#F0B429', show: rRm.totalSpend > 0 },
                        { label: 'Leads gerados', value: rlFmt(rRm.totalLeads, '', '', 0), color: '#2C5FE0', show: rRm.totalLeads > 0 },
                        { label: 'CPL Médio', value: rlFmt(rRm.avgCPL, 'R$', '', 2), color: '#2C5FE0', show: rRm.avgCPL > 0 },
                        { label: 'ROAS', value: rlFmt(rRm.avgROAS, '', '×', 2), color: '#0E9E6E', show: rRm.avgROAS > 0 },
                      ].filter(k => k.show).map(k => (
                        <div key={k.label} style={{ flex: 1, minWidth: '90px', padding: '10px 12px', background: '#0A0D18', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#8A93A3', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>{k.label}</div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: k.color }}>{k.value}</div>
                        </div>
                      ))}
                    </div>

                    {rWinners.length > 0 && (
                      <div style={{ marginBottom: '14px' }}>
                        <div style={sectionLabel}>CAMPANHAS DE DESTAQUE</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {rWinners.slice(0, 4).map((c: any, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)', borderRadius: '8px' }}>
                              <span style={{ fontSize: '12px', color: '#0E9E6E', flexShrink: 0 }}>★</span>
                              <span style={{ fontSize: '12px', color: '#CBD5E1', flex: 1 }}>{rlTrunc(c.campaign_name || c.name, 52)}</span>
                              {c.cpl > 0 && <span style={{ fontSize: '11px', color: '#0E9E6E', fontWeight: 700, flexShrink: 0 }}>CPL R${c.cpl.toFixed(2)}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {rOport.length > 0 && (
                      <div style={{ marginBottom: '14px' }}>
                        <div style={sectionLabel}>OPORTUNIDADES IDENTIFICADAS</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {rOport.slice(0, 4).map((o: any, i: number) => {
                            const txt = typeof o === 'string' ? o : o.titulo || o.descricao || ''
                            return (
                              <div key={i} style={{ fontSize: '12px', color: '#5A6473', paddingLeft: '14px', position: 'relative', lineHeight: '1.55' }}>
                                <span style={{ position: 'absolute', left: 0, color: '#2C5FE0' }}>→</span>
                                {txt}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {rCompleted.length > 0 && (
                      <div style={{ marginBottom: '14px' }}>
                        <div style={sectionLabel}>O QUE JÁ FIZEMOS</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {rCompleted.slice(0, 5).map((a, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#5A6473' }}>
                              <span style={{ color: '#0E9E6E', flexShrink: 0 }}>✓</span>
                              <span>{a.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(rPending.length > 0 || (rPlano.quinze_dias || []).length > 0) && (
                      <div style={{ marginBottom: '14px' }}>
                        <div style={sectionLabel}>PRÓXIMAS AÇÕES</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {rPending.slice(0, 3).map((a, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#5A6473' }}>
                              <span style={{ color: '#2C5FE0', flexShrink: 0 }}>·</span>
                              <span>{a.title}</span>
                            </div>
                          ))}
                          {(rPlano.quinze_dias as string[] || []).slice(0, 3).map((item: string, i: number) => (
                            <div key={`p-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#5A6473' }}>
                              <span style={{ color: '#2C5FE0', flexShrink: 0 }}>·</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {rInsights.length > 0 && (
                      <div>
                        <div style={sectionLabel}>COMENTÁRIO DO ESPECIALISTA</div>
                        {rInsights.slice(0, 2).map((ins: any, i: number) => {
                          const txt = typeof ins === 'string' ? ins : `${ins.titulo ? ins.titulo + ': ' : ''}${ins.texto || ''}`
                          return (
                            <div key={i} style={{ fontSize: '12px', color: '#CBD5E1', marginBottom: '6px', lineHeight: '1.6', paddingLeft: '12px', position: 'relative' }}>
                              <span style={{ position: 'absolute', left: 0, color: '#2C5FE0' }}>→</span>
                              {txt}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* PDF Export */}
                <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <p style={{ fontSize: '11px', color: '#8A93A3', margin: 0 }}>
                    O PDF exportado reflete exatamente as informações exibidas acima.
                  </p>
                  <button
                    onClick={handleExportPDF}
                    disabled={pdfLoading}
                    style={{ ...S.ctaBtn, opacity: pdfLoading ? 0.5 : 1, cursor: pdfLoading ? 'not-allowed' : 'pointer' }}
                  >
                    {pdfLoading ? 'Gerando PDF…' : '↓ Exportar PDF'}
                  </button>
                </div>
              </>
            )}
          </div>
        )
      })()}

      {/* ── 1. LINK COMPARTILHÁVEL ──────────────────────────────────────── */}
      <div style={S.card}>
        {/* Section heading */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <IconLink size={17} />
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#161B26', margin: 0 }}>Link de Relatório para o Cliente</h3>
        </div>
        <p style={{ fontSize: '12px', color: '#8A93A3', margin: '0 0 20px', lineHeight: '1.6' }}>
          Gera um link público que o cliente acessa sem precisar fazer login.
          Mostra os KPIs de forma visual e simples, sem jargão técnico.
        </p>

        {/* Branding inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
          <div>
            <label htmlFor="rel-agency-name" style={S.label}>Nome da agência (aparece no relatório)</label>
            <input
              id="rel-agency-name"
              value={agencyName}
              onChange={e => setAgencyName(e.target.value)}
              placeholder="Ex: Minha Agência Digital"
              style={S.inputBase}
            />
          </div>

          <div>
            <label htmlFor="rel-primary-color" style={S.label}>Cor principal</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                id="rel-primary-color"
                type="color"
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', cursor: 'pointer', padding: '2px' }}
              />
              <span style={{ fontSize: '12px', color: '#5A6473', fontFamily: 'monospace' }}>{primaryColor}</span>
            </div>
          </div>

          <div>
            <label htmlFor="rel-expires" style={S.label}>Expiração do link</label>
            <select
              id="rel-expires"
              value={expiresInDays}
              onChange={e => setExpiresInDays(Number(e.target.value))}
              style={S.inputBase}
            >
              <option value={7}>7 dias</option>
              <option value={30}>30 dias</option>
              <option value={90}>90 dias</option>
              <option value={0}>Sem expiração</option>
            </select>
          </div>
        </div>

        {/* Error banner */}
        {shareError && (
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '10px',
            padding: '9px 14px',
            fontSize: '13px',
            color: '#E1483F',
            marginBottom: '16px',
          }}>
            {shareError}
          </div>
        )}

        {/* CTA / Result */}
        {!shareResult ? (
          <button
            onClick={handleShare}
            disabled={shareLoading}
            style={{ ...S.ctaBtn, opacity: shareLoading ? 0.5 : 1, cursor: shareLoading ? 'not-allowed' : 'pointer' }}
          >
            <IconLink size={15} />
            {shareLoading ? 'Gerando...' : 'Gerar link de relatório'}
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                flex: 1,
                background: '#FBFCFD',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
                padding: '9px 12px',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#5A6473',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {shareResult.url}
              </div>
              <button
                onClick={copyLink}
                style={{
                  flexShrink: 0,
                  padding: '9px 16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: copied ? 'rgba(34,197,94,0.10)' : 'rgba(255,255,255,0.06)',
                  color: copied ? '#0E9E6E' : '#CBD5E1',
                  border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.10)'}`,
                  transition: 'all 0.15s',
                }}
              >
                {copied ? '✓ Copiado' : 'Copiar'}
              </button>
              <a
                href={shareResult.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flexShrink: 0,
                  padding: '9px 16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: 'rgba(255,255,255,0.06)',
                  color: '#CBD5E1',
                  border: '1px solid rgba(255,255,255,0.10)',
                  textDecoration: 'none',
                }}
              >
                Abrir →
              </a>
            </div>
            <button
              onClick={() => setShareResult(null)}
              style={{ background: 'none', border: 'none', fontSize: '12px', color: '#8A93A3', cursor: 'pointer', textAlign: 'left', padding: 0 }}
            >
              + Gerar novo link
            </button>
          </div>
        )}
      </div>

      {/* ── 2. AGENDAMENTO POR EMAIL ────────────────────────────────────── */}
      <div style={S.card}>
        {/* Section heading */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <IconMail size={17} />
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#161B26', margin: 0 }}>Relatório Automático por Email</h3>
          {existingSchedule && (
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '100px',
              marginLeft: '4px',
              background: existingSchedule.active ? 'rgba(34,197,94,0.10)' : 'rgba(100,116,139,0.10)',
              color: existingSchedule.active ? '#0E9E6E' : '#8A93A3',
              border: `1px solid ${existingSchedule.active ? 'rgba(34,197,94,0.2)' : 'rgba(100,116,139,0.2)'}`,
            }}>
              {existingSchedule.active ? 'Ativo' : 'Pausado'}
            </span>
          )}
        </div>
        <p style={{ fontSize: '12px', color: '#8A93A3', margin: '0 0 20px', lineHeight: '1.6' }}>
          Envia automaticamente um resumo de performance para os emails cadastrados.
          Configure a frequência e o dia preferido.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Email recipients */}
          <div>
            <label htmlFor="rel-sched-emails" style={S.label}>Destinatários (separados por vírgula)</label>
            <textarea
              id="rel-sched-emails"
              value={scheduleEmails}
              onChange={e => setScheduleEmails(e.target.value)}
              placeholder="cliente@empresa.com, gestor@agencia.com"
              rows={2}
              style={{ ...S.inputBase, resize: 'none', lineHeight: '1.5' }}
            />
          </div>

          {/* Frequency + day row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label htmlFor="rel-sched-freq" style={S.label}>Frequência</label>
              <select
                id="rel-sched-freq"
                value={scheduleFrequency}
                onChange={e => setScheduleFrequency(e.target.value as 'weekly' | 'monthly')}
                style={S.inputBase}
              >
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
              </select>
            </div>
            <div>
              <label htmlFor="rel-sched-day" style={S.label}>{scheduleFrequency === 'weekly' ? 'Dia da semana' : 'Dia do mês'}</label>
              {scheduleFrequency === 'weekly' ? (
                <select
                  id="rel-sched-day"
                  value={scheduleDayOfWeek}
                  onChange={e => setScheduleDayOfWeek(Number(e.target.value))}
                  style={S.inputBase}
                >
                  {DAY_LABELS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              ) : (
                <select
                  id="rel-sched-day"
                  value={scheduleDayOfWeek}
                  onChange={e => setScheduleDayOfWeek(Number(e.target.value))}
                  style={S.inputBase}
                >
                  {[1, 5, 10, 15, 20, 25, 28].map(d => <option key={d} value={d}>Dia {d}</option>)}
                </select>
              )}
            </div>
          </div>

          {/* Active toggle (only when editing existing) */}
          {existingSchedule && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setScheduleActive(v => !v)}
                style={{
                  width: '40px',
                  height: '22px',
                  borderRadius: '11px',
                  border: 'none',
                  cursor: 'pointer',
                  background: scheduleActive ? '#0E9E6E' : 'rgba(255,255,255,0.10)',
                  position: 'relative',
                  flexShrink: 0,
                  transition: 'background 0.15s',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '3px',
                  left: scheduleActive ? '21px' : '3px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.15s',
                }} />
              </button>
              <span style={{ fontSize: '12px', color: '#5A6473' }}>
                {scheduleActive ? 'Relatório automático ativado' : 'Relatório automático pausado'}
              </span>
            </div>
          )}

          {/* Feedback message */}
          {scheduleMsg && (
            <div style={
              scheduleMsg.startsWith('✓')
                ? { background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '10px', padding: '9px 14px', fontSize: '12px', color: '#0E9E6E' }
                : { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '9px 14px', fontSize: '12px', color: '#E1483F' }
            }>
              {scheduleMsg}
            </div>
          )}

          {/* Save button */}
          <div>
            <button
              onClick={handleSaveSchedule}
              disabled={scheduleSaving}
              style={{ ...S.ctaBtn, opacity: scheduleSaving ? 0.5 : 1, cursor: scheduleSaving ? 'not-allowed' : 'pointer' }}
            >
              <IconMail size={15} />
              {scheduleSaving ? 'Salvando...' : existingSchedule ? 'Atualizar agendamento' : 'Criar agendamento'}
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. PRÉVIA DO RELATÓRIO ──────────────────────────────────────── */}
      <div style={S.card}>
        {/* Section heading */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <IconEye size={17} />
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#161B26', margin: 0 }}>Prévia do Relatório</h3>
        </div>

        {hasData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {[
                { label: 'Investimento', value: `R$${rm?.totalSpend?.toFixed(0) || 0}`, color: '#E08B0B' },
                { label: 'Leads', value: String(rm?.totalLeads || rm?.leads || '—'), color: '#2C5FE0' },
                { label: 'CPL Médio', value: (rm?.avgCPL || rm?.cpl) > 0 ? `R$${rm?.avgCPL || rm?.cpl}` : '—', color: '#2C5FE0' },
                { label: 'ROAS', value: (rm?.avgROAS || rm?.roas) > 0 ? `${rm?.avgROAS || rm?.roas}×` : '—', color: '#0E9E6E' },
              ].map(k => (
                <div key={k.label} style={{
                  background: '#FBFCFD',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '10px', color: '#8A93A3', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>{k.label}</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: k.color }}>{k.value}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '12px', color: '#8A93A3', margin: 0 }}>
              O cliente verá esses dados de forma visual e simplificada, sem métricas técnicas complexas.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '32px 0', textAlign: 'center' }}>
            <IconEye size={32} />
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#161B26', margin: 0 }}>Nenhum dado disponível</h4>
            <p style={{ fontSize: '13px', color: '#8A93A3', margin: 0 }}>
              Execute a análise Meta ou Google Intelligence para gerar a prévia.
            </p>
          </div>
        )}
      </div>

    </div>
  )
}
