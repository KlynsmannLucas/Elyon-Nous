// app/api/cron/morning-briefing/route.ts — Morning briefing diário por email
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const CRON_SECRET   = process.env.CRON_SECRET
const RESEND_KEY    = process.env.RESEND_API_KEY
const FROM_EMAIL    = 'ELYON <relatorios@elyon.app>'

function buildBriefingHtml(entry: {
  email: string
  clientName: string
  niche: string
  budget: number
  agencyName?: string
}): string {
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const capDay = today.charAt(0).toUpperCase() + today.slice(1)

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Morning Briefing — ELYON</title>
</head>
<body style="margin:0;padding:0;background:#080D1A;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px;">

    <!-- Header -->
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px;">
      <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#7C3AED,#A78BFA);display:flex;align-items:center;justify-content:center;">
        <span style="font-size:16px;">⚡</span>
      </div>
      <div>
        <div style="font-size:16px;font-weight:700;color:#F1F5F9;">ELYON Morning Briefing</div>
        <div style="font-size:11px;color:#64748B;">${capDay}</div>
      </div>
    </div>

    <!-- Client -->
    <div style="background:#0F1629;border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:20px;margin-bottom:16px;">
      <div style="font-size:11px;color:#64748B;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px;">Cliente ativo</div>
      <div style="font-size:18px;font-weight:700;color:#F1F5F9;margin-bottom:4px;">${entry.clientName}</div>
      <div style="font-size:12px;color:#A78BFA;">${entry.niche}</div>
    </div>

    <!-- Checklist do dia -->
    <div style="background:#0F1629;border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:20px;margin-bottom:16px;">
      <div style="font-size:13px;font-weight:700;color:#F1F5F9;margin-bottom:14px;">📋 Checklist de hoje</div>
      ${[
        'Verificar CTR das campanhas ativas',
        'Checar frequência dos anúncios',
        'Revisar pacing do orçamento diário',
        'Analisar novos leads gerados ontem',
      ].map(item => `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
          <div style="width:16px;height:16px;border-radius:4px;border:1.5px solid rgba(255,255,255,0.15);flex-shrink:0;"></div>
          <span style="font-size:13px;color:#94A3B8;">${item}</span>
        </div>
      `).join('')}
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://elyon.app'}/dashboard"
        style="display:inline-block;padding:12px 28px;border-radius:10px;background:linear-gradient(135deg,#7C3AED,#A78BFA);color:#fff;font-weight:700;font-size:14px;text-decoration:none;">
        Abrir dashboard →
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;font-size:11px;color:#475569;">
      Você recebe este email porque ativou o Morning Briefing no ELYON.<br>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://elyon.app'}/dashboard" style="color:#7C3AED;">Desativar no dashboard</a>
    </div>
  </div>
</body>
</html>`
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_KEY) return false
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function GET(req: Request) {
  // Vercel cron authentication
  const authHeader = req.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ skipped: true, reason: 'Supabase not configured' })
  }

  // Busca assinantes do morning briefing na tabela report_schedules
  const { data: subscriptions, error } = await supabaseAdmin
    .from('report_schedules')
    .select('user_id, emails, client_name, metadata')
    .eq('schedule_type', 'morning_briefing')
    .eq('active', true)

  if (error) {
    console.error('[morning-briefing] query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ sent: 0, message: 'Nenhum assinante ativo' })
  }

  let sent = 0
  const errors: string[] = []

  for (const sub of subscriptions) {
    const emailList: string[] = Array.isArray(sub.emails) ? sub.emails : [sub.emails].filter(Boolean)
    if (!emailList.length) continue

    const meta = sub.metadata || {}
    const html = buildBriefingHtml({
      email:      emailList[0],
      clientName: sub.client_name || meta.clientName || 'Seu cliente',
      niche:      meta.niche || '',
      budget:     meta.budget || 0,
    })

    for (const email of emailList) {
      const ok = await sendEmail(email, '☀️ Morning Briefing — ELYON', html)
      if (ok) sent++
      else errors.push(email)
    }
  }

  return NextResponse.json({ sent, errors: errors.length, ts: new Date().toISOString() })
}

// Rota para opt-in/opt-out do morning briefing
export async function POST(req: Request) {
  // Esta rota não requer cron auth — requer Clerk auth via API separada
  // Veja /api/briefing/prefs para o opt-in do usuário
  return NextResponse.json({ error: 'Use POST /api/briefing/prefs' }, { status: 405 })
}
