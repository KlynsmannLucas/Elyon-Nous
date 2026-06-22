// app/api/pulse/test/route.ts — Dispara um Pulse de teste para o próprio usuário,
// pelos canais informados. Serve para validar e-mail (Resend) e WhatsApp (Cloud API)
// assim que as credenciais/templates estiverem configurados.
import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { buildPulseData, pulseToEmailBlocks, pulseToWhatsAppParams } from '@/lib/pulse'
import { sendEmail, sendWhatsAppTemplate, whatsappConfigured, emailConfigured } from '@/lib/notify'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const clientName: string = body.clientName || 'Seu cliente'
  const phone: string = (body.phone || '').trim()
  const channels = body.channels || { email: true, whatsapp: Boolean(phone) }

  const pd = await buildPulseData(userId, clientName)

  const result: any = { ok: true, sent: { email: null as any, whatsapp: null as any }, configured: { email: emailConfigured(), whatsapp: whatsappConfigured() } }

  // E-mail de teste
  if (channels.email !== false) {
    const user = await currentUser()
    const to = user?.emailAddresses?.[0]?.emailAddress
    if (!to) result.sent.email = { ok: false, error: 'E-mail do usuário não encontrado' }
    else {
      const html = `<!DOCTYPE html><html lang="pt-BR"><body style="margin:0;background:#080D1A;font-family:system-ui,sans-serif;">
        <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
          <div style="font-size:16px;font-weight:700;color:#F1F5F9;margin-bottom:6px;">☀️ Pulse ELYON — teste</div>
          <div style="font-size:12px;color:#64748B;margin-bottom:20px;">${pd.clientName} · ${pd.dateLabel}</div>
          ${pulseToEmailBlocks(pd)}
          <div style="text-align:center;margin-top:20px;"><a href="${pd.dashboardUrl}" style="display:inline-block;padding:12px 28px;border-radius:10px;background:linear-gradient(135deg,#7C3AED,#A78BFA);color:#fff;font-weight:700;font-size:14px;text-decoration:none;">Abrir painel →</a></div>
        </div></body></html>`
      result.sent.email = await sendEmail(to, '☀️ Pulse ELYON — teste', html)
    }
  }

  // WhatsApp de teste (template aprovado)
  if (channels.whatsapp && phone) {
    result.sent.whatsapp = await sendWhatsAppTemplate(phone, pulseToWhatsAppParams(pd))
  } else if (channels.whatsapp && !phone) {
    result.sent.whatsapp = { ok: false, error: 'Informe um número de WhatsApp' }
  }

  return NextResponse.json(result)
}
