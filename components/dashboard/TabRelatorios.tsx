// components/dashboard/TabRelatorios.tsx — Portal white-label + Agendamento de email
'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'

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
      <path d="M13 10h9l6 6v14a1 1 0 0 1-1 1H13a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1z" stroke="#7C3AED" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <path d="M22 10v7h6" stroke="#7C3AED" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <line x1="15" y1="22" x2="25" y2="22" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="15" y1="25.5" x2="22" y2="25.5" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconLink({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.5 10.5a3.75 3.75 0 0 0 5.303 0l2.25-2.25a3.75 3.75 0 0 0-5.303-5.303L8.625 4.07" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.5 7.5a3.75 3.75 0 0 0-5.303 0l-2.25 2.25a3.75 3.75 0 0 0 5.303 5.303l1.121-1.122" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconMail({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="14" height="10" rx="2" stroke="#A78BFA" strokeWidth="1.5" />
      <path d="M2 6.5l7 4.5 7-4.5" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconEye({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.5 9s2.7-5.25 7.5-5.25S16.5 9 16.5 9s-2.7 5.25-7.5 5.25S1.5 9 1.5 9z" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="9" r="2.25" stroke="#A78BFA" strokeWidth="1.5" />
    </svg>
  )
}

function IconWarning({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1.5l6.5 12H1.5L8 1.5z" stroke="#F59E0B" strokeWidth="1.4" strokeLinejoin="round" />
      <line x1="8" y1="6" x2="8" y2="9.5" stroke="#F59E0B" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r="0.7" fill="#F59E0B" />
    </svg>
  )
}

// ── Shared style constants ──────────────────────────────────────────────────

const S = {
  card: {
    background: '#0F1629',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    padding: '22px',
  } as React.CSSProperties,

  inputBase: {
    background: '#131E35',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '10px',
    color: '#F1F5F9',
    fontSize: '13px',
    padding: '8px 12px',
    outline: 'none',
    width: '100%',
    display: 'block',
  } as React.CSSProperties,

  label: {
    fontSize: '11px',
    color: '#94A3B8',
    marginBottom: '6px',
    display: 'block',
  } as React.CSSProperties,

  ctaBtn: {
    background: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
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
  const { clientData, auditCache, connectedAccounts } = useAppStore()

  // ── Share state ──
  const [shareLoading, setShareLoading]   = useState(false)
  const [shareError,   setShareError]     = useState('')
  const [shareResult,  setShareResult]    = useState<ReportShare | null>(null)
  const [copied,       setCopied]         = useState(false)
  const [expiresInDays, setExpiresInDays] = useState(30)

  // ── Branding state ──
  const [agencyName,    setAgencyName]    = useState('')
  const [primaryColor,  setPrimaryColor]  = useState('#F5A500')

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
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#F1F5F9', margin: 0 }}>Relatórios</h2>
        </div>
        <div style={{ ...S.card, padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '12px' }}>
          <IconDocument />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F1F5F9', margin: 0 }}>Nenhum cliente selecionado</h3>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Selecione um cliente no menu para gerar relatórios.</p>
        </div>
      </div>
    )
  }

  const hasData = !!rm

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#F1F5F9', margin: '0 0 4px' }}>Relatórios</h2>
        <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
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
          color: '#F59E0B',
          fontSize: '13px',
        }}>
          <IconWarning size={16} />
          <span>Conecte suas contas de anúncio e execute a análise de inteligência para gerar relatórios com dados reais.</span>
          {onNavigateToConnections && (
            <button
              onClick={onNavigateToConnections}
              style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 700, color: '#F59E0B', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', flexShrink: 0 }}
            >
              Conectar →
            </button>
          )}
        </div>
      )}

      {/* ── 1. LINK COMPARTILHÁVEL ──────────────────────────────────────── */}
      <div style={S.card}>
        {/* Section heading */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <IconLink size={17} />
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#F1F5F9', margin: 0 }}>Link de Relatório para o Cliente</h3>
        </div>
        <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 20px', lineHeight: '1.6' }}>
          Gera um link público que o cliente acessa sem precisar fazer login.
          Mostra os KPIs de forma visual e simples, sem jargão técnico.
        </p>

        {/* Branding inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
          <div>
            <label style={S.label}>Nome da agência (aparece no relatório)</label>
            <input
              value={agencyName}
              onChange={e => setAgencyName(e.target.value)}
              placeholder="Ex: Minha Agência Digital"
              style={S.inputBase}
            />
          </div>

          <div>
            <label style={S.label}>Cor principal</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="color"
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', cursor: 'pointer', padding: '2px' }}
              />
              <span style={{ fontSize: '12px', color: '#94A3B8', fontFamily: 'monospace' }}>{primaryColor}</span>
            </div>
          </div>

          <div>
            <label style={S.label}>Expiração do link</label>
            <select
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
            color: '#EF4444',
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
                background: '#131E35',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
                padding: '9px 12px',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#94A3B8',
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
                  color: copied ? '#22C55E' : '#CBD5E1',
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
              style={{ background: 'none', border: 'none', fontSize: '12px', color: '#64748B', cursor: 'pointer', textAlign: 'left', padding: 0 }}
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
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#F1F5F9', margin: 0 }}>Relatório Automático por Email</h3>
          {existingSchedule && (
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '100px',
              marginLeft: '4px',
              background: existingSchedule.active ? 'rgba(34,197,94,0.10)' : 'rgba(100,116,139,0.10)',
              color: existingSchedule.active ? '#22C55E' : '#64748B',
              border: `1px solid ${existingSchedule.active ? 'rgba(34,197,94,0.2)' : 'rgba(100,116,139,0.2)'}`,
            }}>
              {existingSchedule.active ? 'Ativo' : 'Pausado'}
            </span>
          )}
        </div>
        <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 20px', lineHeight: '1.6' }}>
          Envia automaticamente um resumo de performance para os emails cadastrados.
          Configure a frequência e o dia preferido.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Email recipients */}
          <div>
            <label style={S.label}>Destinatários (separados por vírgula)</label>
            <textarea
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
              <label style={S.label}>Frequência</label>
              <select
                value={scheduleFrequency}
                onChange={e => setScheduleFrequency(e.target.value as 'weekly' | 'monthly')}
                style={S.inputBase}
              >
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
              </select>
            </div>
            <div>
              <label style={S.label}>{scheduleFrequency === 'weekly' ? 'Dia da semana' : 'Dia do mês'}</label>
              {scheduleFrequency === 'weekly' ? (
                <select
                  value={scheduleDayOfWeek}
                  onChange={e => setScheduleDayOfWeek(Number(e.target.value))}
                  style={S.inputBase}
                >
                  {DAY_LABELS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              ) : (
                <select
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
                  background: scheduleActive ? '#22C55E' : 'rgba(255,255,255,0.10)',
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
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                {scheduleActive ? 'Relatório automático ativado' : 'Relatório automático pausado'}
              </span>
            </div>
          )}

          {/* Feedback message */}
          {scheduleMsg && (
            <div style={
              scheduleMsg.startsWith('✓')
                ? { background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '10px', padding: '9px 14px', fontSize: '12px', color: '#22C55E' }
                : { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '9px 14px', fontSize: '12px', color: '#EF4444' }
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
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#F1F5F9', margin: 0 }}>Prévia do Relatório</h3>
        </div>

        {hasData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {[
                { label: 'Investimento', value: `R$${rm?.totalSpend?.toFixed(0) || 0}`, color: '#F59E0B' },
                { label: 'Leads', value: String(rm?.totalLeads || rm?.leads || '—'), color: '#38BDF8' },
                { label: 'CPL Médio', value: (rm?.avgCPL || rm?.cpl) > 0 ? `R$${rm?.avgCPL || rm?.cpl}` : '—', color: '#A78BFA' },
                { label: 'ROAS', value: (rm?.avgROAS || rm?.roas) > 0 ? `${rm?.avgROAS || rm?.roas}×` : '—', color: '#22C55E' },
              ].map(k => (
                <div key={k.label} style={{
                  background: '#131E35',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>{k.label}</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: k.color }}>{k.value}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
              O cliente verá esses dados de forma visual e simplificada, sem métricas técnicas complexas.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '32px 0', textAlign: 'center' }}>
            <IconEye size={32} />
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#F1F5F9', margin: 0 }}>Nenhum dado disponível</h4>
            <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
              Execute a análise Meta ou Google Intelligence para gerar a prévia.
            </p>
          </div>
        )}
      </div>

    </div>
  )
}
