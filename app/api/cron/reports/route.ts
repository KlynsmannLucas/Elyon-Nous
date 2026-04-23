// app/api/cron/reports/route.ts — Cron job: envia relatórios agendados por email
//
// Configurar no vercel.json:
// {
//   "crons": [{ "path": "/api/cron/reports", "schedule": "0 9 * * 1" }]
// }
//
// RESEND_API_KEY deve estar nas variáveis de ambiente do Vercel.

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(req: Request) {
  // Protege a rota: aceita chamadas do Vercel Cron (Authorization: Bearer <CRON_SECRET>)
  const auth = req.headers instanceof Headers ? req.headers.get('authorization') : null
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ skipped: true, reason: 'supabase not configured' })
  }

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    return NextResponse.json({ skipped: true, reason: 'RESEND_API_KEY not configured' })
  }

  const now = new Date()
  const today = now.getDay() // 0 = domingo … 6 = sábado

  // Busca agendamentos ativos cujo dia_of_week bate com hoje
  const { data: schedules, error } = await supabaseAdmin
    .from('report_schedules')
    .select('*')
    .eq('active', true)
    .eq('day_of_week', today)

  if (error) {
    console.error('[cron/reports] Erro ao buscar agendamentos:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!schedules || schedules.length === 0) {
    return NextResponse.json({ sent: 0, message: 'Nenhum agendamento para hoje' })
  }

  let sent = 0
  const errors: string[] = []

  for (const schedule of schedules) {
    try {
      // Verifica se já enviou hoje (evita duplicatas em re-runs)
      if (schedule.last_sent_at) {
        const lastSent = new Date(schedule.last_sent_at)
        if (
          lastSent.getFullYear() === now.getFullYear() &&
          lastSent.getMonth() === now.getMonth() &&
          lastSent.getDate() === now.getDate()
        ) {
          continue
        }
      }

      // Busca último relatório compartilhado para esse cliente
      const { data: share } = await supabaseAdmin
        .from('report_shares')
        .select('token, report_data, created_at')
        .eq('user_id', schedule.user_id)
        .eq('client_name', schedule.client_name)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://elyon-nous.vercel.app'
      const reportUrl = share ? `${appUrl}/report/${share.token}` : appUrl

      const rd = share?.report_data as any
      const metricsHtml = rd ? `
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr>
            <td style="padding:12px;background:#111114;border-radius:8px;text-align:center">
              <div style="font-size:11px;color:#64748B;text-transform:uppercase;margin-bottom:4px">Investimento</div>
              <div style="font-size:20px;font-weight:800;color:#F0B429">R$${Number(rd.totalSpend||0).toLocaleString('pt-BR')}</div>
            </td>
            <td style="width:8px"></td>
            <td style="padding:12px;background:#111114;border-radius:8px;text-align:center">
              <div style="font-size:11px;color:#64748B;text-transform:uppercase;margin-bottom:4px">Leads</div>
              <div style="font-size:20px;font-weight:800;color:#38BDF8">${rd.totalLeads||'—'}</div>
            </td>
            <td style="width:8px"></td>
            <td style="padding:12px;background:#111114;border-radius:8px;text-align:center">
              <div style="font-size:11px;color:#64748B;text-transform:uppercase;margin-bottom:4px">CPL Médio</div>
              <div style="font-size:20px;font-weight:800;color:#A78BFA">${rd.avgCPL ? `R$${rd.avgCPL}` : '—'}</div>
            </td>
          </tr>
        </table>
      ` : ''

      const html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;background:#0A0A0B;font-family:system-ui,sans-serif;color:#E2E8F0">
          <div style="max-width:560px;margin:0 auto;padding:32px 24px">
            <div style="font-size:22px;font-weight:800;background:linear-gradient(135deg,#F5A500,#FFD166);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px">ELYON</div>
            <div style="font-size:12px;color:#64748B;margin-bottom:24px">Relatório de Performance</div>

            <h2 style="font-size:18px;font-weight:700;color:#fff;margin:0 0 4px">${schedule.client_name}</h2>
            <p style="font-size:13px;color:#94A3B8;margin:0 0 20px">
              Período: ${rd?.period || 'última semana'} · Score: <strong style="color:#F5A500">${rd?.scoreGrade || '—'}</strong>
            </p>

            ${metricsHtml}

            <a href="${reportUrl}" style="display:inline-block;margin:8px 0 24px;padding:12px 24px;background:linear-gradient(135deg,#F5A500,#FFD166);color:#000;font-weight:700;font-size:14px;border-radius:10px;text-decoration:none">
              Ver relatório completo →
            </a>

            <div style="font-size:11px;color:#334155;border-top:1px solid rgba(255,255,255,0.04);padding-top:16px">
              Enviado automaticamente pelo ELYON · <a href="${appUrl}/dashboard" style="color:#475569">Gerenciar notificações</a>
            </div>
          </div>
        </body>
        </html>
      `

      // Envia via Resend
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: 'ELYON <relatorios@elyon.app>',
          to: schedule.emails,
          subject: `📊 Relatório semanal — ${schedule.client_name}`,
          html,
        }),
      })

      if (!emailRes.ok) {
        const errJson = await emailRes.json().catch(() => ({}))
        throw new Error(errJson.message || `Resend HTTP ${emailRes.status}`)
      }

      // Atualiza last_sent_at
      await supabaseAdmin
        .from('report_schedules')
        .update({ last_sent_at: now.toISOString() })
        .eq('id', schedule.id)

      sent++
    } catch (e: any) {
      errors.push(`${schedule.client_name}: ${e.message}`)
      console.error(`[cron/reports] Erro ao enviar para ${schedule.client_name}:`, e.message)
    }
  }

  return NextResponse.json({ sent, errors: errors.length ? errors : undefined })
}
