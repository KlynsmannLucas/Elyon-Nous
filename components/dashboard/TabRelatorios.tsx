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

  if (!clientData) {
    return (
      <div className="space-y-6">
        <div><h2 className="font-display text-2xl font-bold text-white mb-1">Relatórios</h2></div>
        <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-10 text-center">
          <div className="text-4xl mb-4">📄</div>
          <h3 className="font-display text-lg font-bold text-white mb-2">Nenhum cliente selecionado</h3>
          <p className="text-slate-500 text-sm">Selecione um cliente no menu para gerar relatórios.</p>
        </div>
      </div>
    )
  }

  const hasData = !!rm

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="font-display text-2xl font-bold text-white mb-1">Relatórios</h2>
        <p className="text-slate-500 text-sm">
          Compartilhe relatórios com clientes e configure envios automáticos por email.
        </p>
      </div>

      {!hasData && (
        <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-3"
          style={{ background: 'rgba(240,180,41,0.06)', border: '1px solid rgba(240,180,41,0.2)', color: '#F0B429' }}>
          <span>⚠️</span>
          <span>Conecte suas contas de anúncio e execute a análise de inteligência para gerar relatórios com dados reais.</span>
          {onNavigateToConnections && (
            <button onClick={onNavigateToConnections} className="ml-auto text-xs font-bold underline flex-shrink-0">Conectar →</button>
          )}
        </div>
      )}

      {/* ── 1. LINK COMPARTILHÁVEL ──────────────────────────────────────── */}
      <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-6">
        <h3 className="font-display font-bold text-white mb-1 flex items-center gap-2">
          <span>🔗</span> Link de Relatório para o Cliente
        </h3>
        <p className="text-slate-500 text-xs mb-5 leading-relaxed">
          Gera um link público que o cliente acessa sem precisar fazer login.
          Mostra os KPIs de forma visual e simples, sem jargão técnico.
        </p>

        {/* Branding */}
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Nome da agência (aparece no relatório)</label>
            <input
              value={agencyName}
              onChange={e => setAgencyName(e.target.value)}
              placeholder="Ex: Minha Agência Digital"
              className="input-base w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Cor principal</label>
            <div className="flex items-center gap-2">
              <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                className="w-9 h-9 rounded-lg border border-[#2A2A30] bg-transparent cursor-pointer" />
              <span className="text-xs text-slate-500 font-mono">{primaryColor}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Expiração do link</label>
            <select value={expiresInDays} onChange={e => setExpiresInDays(Number(e.target.value))}
              className="input-base w-full">
              <option value={7}>7 dias</option>
              <option value={30}>30 dias</option>
              <option value={90}>90 dias</option>
              <option value={0}>Sem expiração</option>
            </select>
          </div>
        </div>

        {shareError && (
          <div className="rounded-lg px-3 py-2 mb-4 text-sm" style={{ background: 'rgba(255,77,77,0.08)', color: '#FF4D4D', border: '1px solid rgba(255,77,77,0.2)' }}>
            {shareError}
          </div>
        )}

        {!shareResult ? (
          <button onClick={handleShare} disabled={shareLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #F5A500, #FFD166)', color: '#000' }}>
            {shareLoading ? '⏳ Gerando...' : '🔗 Gerar link de relatório'}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-xl px-3 py-2.5 text-xs font-mono truncate"
                style={{ background: '#16161A', border: '1px solid #2A2A30', color: '#94A3B8' }}>
                {shareResult.url}
              </div>
              <button onClick={copyLink}
                className="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{ background: copied ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.06)', color: copied ? '#22C55E' : '#CBD5E1', border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
                {copied ? '✓ Copiado' : 'Copiar'}
              </button>
              <a href={shareResult.url} target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#CBD5E1', border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none' }}>
                Abrir →
              </a>
            </div>
            <button onClick={() => setShareResult(null)} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
              + Gerar novo link
            </button>
          </div>
        )}
      </div>

      {/* ── 2. AGENDAMENTO POR EMAIL ────────────────────────────────────── */}
      <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-6">
        <h3 className="font-display font-bold text-white mb-1 flex items-center gap-2">
          <span>📧</span> Relatório Automático por Email
          {existingSchedule && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-1"
              style={{ background: existingSchedule.active ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)', color: existingSchedule.active ? '#22C55E' : '#64748B', border: `1px solid ${existingSchedule.active ? 'rgba(34,197,94,0.2)' : 'rgba(100,116,139,0.2)'}` }}>
              {existingSchedule.active ? 'Ativo' : 'Pausado'}
            </span>
          )}
        </h3>
        <p className="text-slate-500 text-xs mb-5 leading-relaxed">
          Envia automaticamente um resumo de performance para os emails cadastrados.
          Configure a frequência e o dia preferido.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Destinatários (separados por vírgula)</label>
            <textarea
              value={scheduleEmails}
              onChange={e => setScheduleEmails(e.target.value)}
              placeholder="cliente@empresa.com, gestor@agencia.com"
              rows={2}
              className="input-base w-full resize-none"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Frequência</label>
              <select value={scheduleFrequency} onChange={e => setScheduleFrequency(e.target.value as any)}
                className="input-base w-full">
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">
                {scheduleFrequency === 'weekly' ? 'Dia da semana' : 'Dia do mês'}
              </label>
              {scheduleFrequency === 'weekly' ? (
                <select value={scheduleDayOfWeek} onChange={e => setScheduleDayOfWeek(Number(e.target.value))}
                  className="input-base w-full">
                  {DAY_LABELS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              ) : (
                <select value={scheduleDayOfWeek} onChange={e => setScheduleDayOfWeek(Number(e.target.value))}
                  className="input-base w-full">
                  {[1,5,10,15,20,25,28].map(d => <option key={d} value={d}>Dia {d}</option>)}
                </select>
              )}
            </div>
          </div>

          {existingSchedule && (
            <div className="flex items-center gap-3">
              <button onClick={() => setScheduleActive(v => !v)}
                className="w-10 h-5 rounded-full transition-all flex-shrink-0"
                style={{ background: scheduleActive ? '#22C55E' : '#2A2A30', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '2px', left: scheduleActive ? '22px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }} />
              </button>
              <span className="text-xs text-slate-400">
                {scheduleActive ? 'Relatório automático ativado' : 'Relatório automático pausado'}
              </span>
            </div>
          )}

          {scheduleMsg && (
            <div className="rounded-lg px-3 py-2 text-xs"
              style={{ background: scheduleMsg.startsWith('✓') ? 'rgba(34,197,94,0.08)' : 'rgba(255,77,77,0.08)', color: scheduleMsg.startsWith('✓') ? '#22C55E' : '#FF4D4D', border: `1px solid ${scheduleMsg.startsWith('✓') ? 'rgba(34,197,94,0.2)' : 'rgba(255,77,77,0.2)'}` }}>
              {scheduleMsg}
            </div>
          )}

          <button onClick={handleSaveSchedule} disabled={scheduleSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#CBD5E1' }}>
            {scheduleSaving ? '⏳ Salvando...' : existingSchedule ? '💾 Atualizar agendamento' : '📅 Criar agendamento'}
          </button>
        </div>
      </div>

      {/* ── 3. PRÉVIA DO RELATÓRIO ──────────────────────────────────────── */}
      <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-6">
        <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2">
          <span>👁️</span> Prévia do Relatório
        </h3>
        {hasData ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Investimento', value: `R$${rm?.totalSpend?.toFixed(0) || 0}`, color: '#F0B429' },
                { label: 'Leads', value: String(rm?.totalLeads || rm?.leads || '—'), color: '#38BDF8' },
                { label: 'CPL Médio', value: (rm?.avgCPL || rm?.cpl) > 0 ? `R$${rm?.avgCPL || rm?.cpl}` : '—', color: '#A78BFA' },
                { label: 'ROAS', value: (rm?.avgROAS || rm?.roas) > 0 ? `${rm?.avgROAS || rm?.roas}×` : '—', color: '#22C55E' },
              ].map(k => (
                <div key={k.label} className="bg-[#16161A] rounded-xl px-3 py-2.5 text-center">
                  <div className="text-[10px] text-slate-600 uppercase mb-1">{k.label}</div>
                  <div className="text-base font-bold" style={{ color: k.color }}>{k.value}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-600">
              O cliente verá esses dados de forma visual e simplificada, sem métricas técnicas complexas.
            </p>
          </div>
        ) : (
          <div className="text-sm text-slate-600 text-center py-6">
            Execute a análise Meta ou Google Intelligence para gerar a prévia.
          </div>
        )}
      </div>

    </div>
  )
}
