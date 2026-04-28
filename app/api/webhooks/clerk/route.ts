// app/api/webhooks/clerk/route.ts — Recebe eventos do Clerk e dispara ações
// Setup no Clerk Dashboard → Webhooks → Add Endpoint:
//   URL: https://seu-dominio.vercel.app/api/webhooks/clerk
//   Events: user.created
//   Signing Secret → copiar para CLERK_WEBHOOK_SECRET no Vercel

import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'

const WELCOME_HTML = (firstName: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bem-vindo ao Elyon</title>
</head>
<body style="margin:0;padding:0;background:#0A0A0B;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;font-size:28px;font-weight:900;background:linear-gradient(135deg,#F5A500,#FFD166);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
        ELYON
      </div>
    </div>

    <!-- Card -->
    <div style="background:#111114;border:1px solid #2A2A30;border-radius:20px;padding:36px 32px;">
      <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 8px;">
        Olá${firstName ? `, ${firstName}` : ''}! Seja bem-vindo 👋
      </h1>
      <p style="color:#64748B;font-size:15px;line-height:1.6;margin:0 0 28px;">
        Sua conta no <strong style="color:#F5A500;">Elyon</strong> está pronta. Agora você tem acesso ao seu dashboard de inteligência de tráfego pago.
      </p>

      <!-- 3 passos -->
      <div style="margin-bottom:28px;">
        ${[
          ['1', 'Cadastre seu primeiro cliente', 'Clique em "+ Novo cliente" e preencha os dados do negócio.'],
          ['2', 'Gere a estratégia com IA', 'O Elyon analisa o nicho, benchmarks reais e monta o plano completo.'],
          ['3', 'Conecte Meta Ads ou Google Ads', 'Acompanhe campanhas reais em tempo real direto no dashboard.'],
        ].map(([num, title, desc]) => `
          <div style="display:flex;gap:14px;margin-bottom:16px;align-items:flex-start;">
            <div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#F5A500,#FFD166);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#000;flex-shrink:0;">
              ${num}
            </div>
            <div>
              <div style="color:#fff;font-size:14px;font-weight:600;margin-bottom:2px;">${title}</div>
              <div style="color:#64748B;font-size:13px;line-height:1.5;">${desc}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- CTA -->
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://elyon-nous.vercel.app'}/dashboard"
        style="display:block;text-align:center;background:linear-gradient(135deg,#F5A500,#FFD166);color:#000;font-weight:800;font-size:15px;padding:16px;border-radius:14px;text-decoration:none;">
        Acessar meu dashboard →
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:24px;">
      <p style="color:#374151;font-size:12px;line-height:1.6;margin:0;">
        Você recebeu este email porque criou uma conta no Elyon.<br />
        Dúvidas? Responda este email — lemos todos.
      </p>
    </div>

  </div>
</body>
</html>
`

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'CLERK_WEBHOOK_SECRET não configurado' }, { status: 500 })
  }

  // Verificar assinatura Svix
  const svixId        = req.headers.get('svix-id')
  const svixTimestamp = req.headers.get('svix-timestamp')
  const svixSignature = req.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Headers Svix ausentes' }, { status: 400 })
  }

  const body = await req.text()
  const wh   = new Webhook(webhookSecret)

  let event: any
  try {
    event = wh.verify(body, {
      'svix-id':        svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    })
  } catch {
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 })
  }

  // Processar evento user.created
  if (event.type === 'user.created') {
    const user      = event.data
    const email     = user.email_addresses?.[0]?.email_address
    const firstName = user.first_name || ''

    if (!email) return NextResponse.json({ skipped: true, reason: 'sem email' })

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) return NextResponse.json({ skipped: true, reason: 'RESEND_API_KEY não configurado' })

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({
          from:    'Elyon <oi@elyon-nous.vercel.app>',
          to:      [email],
          subject: `Bem-vindo ao Elyon${firstName ? `, ${firstName}` : ''}! Seu dashboard está pronto 🚀`,
          html:    WELCOME_HTML(firstName),
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('[webhook/clerk] Resend error:', err)
        return NextResponse.json({ error: 'Falha ao enviar email' }, { status: 500 })
      }
    } catch (e: any) {
      console.error('[webhook/clerk] Erro:', e.message)
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
