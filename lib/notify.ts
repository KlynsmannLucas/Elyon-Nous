// lib/notify.ts — Canais de notificação do Pulse (e-mail + WhatsApp).
// Degrada sem quebrar: se as credenciais não estiverem setadas, retorna ok:false
// sem lançar erro — o cron apenas pula aquele canal.

const RESEND_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.PULSE_FROM_EMAIL || 'ELYON <relatorios@elyon.app>'

// WhatsApp Cloud API (Meta). Mensagem proativa (fora da janela de 24h) EXIGE template aprovado.
const WA_TOKEN    = process.env.WHATSAPP_ACCESS_TOKEN
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const WA_TEMPLATE = process.env.WHATSAPP_PULSE_TEMPLATE || 'pulse_diario'
const WA_LANG     = process.env.WHATSAPP_TEMPLATE_LANG || 'pt_BR'
const GRAPH       = 'https://graph.facebook.com/v21.0'

export function emailConfigured() { return Boolean(RESEND_KEY) }
export function whatsappConfigured() { return Boolean(WA_TOKEN && WA_PHONE_ID) }

export async function sendEmail(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_KEY) return { ok: false, error: 'RESEND_API_KEY ausente' }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) { const j = await res.json().catch(() => ({})) as any; return { ok: false, error: j?.message || `HTTP ${res.status}` } }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// Só dígitos, formato internacional (ex.: 5541999998888). Garante prefixo 55 p/ números BR de 10-11 dígitos.
export function normalizePhone(raw: string): string {
  let d = (raw || '').replace(/\D/g, '')
  if (d.length >= 10 && d.length <= 11) d = '55' + d
  return d
}

// Parâmetros de template não podem conter quebras de linha/tabs/4+ espaços (Meta rejeita).
function cleanParam(s: string): string {
  return (s || '').replace(/[\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, 1024) || '—'
}

// Envia o Pulse via template aprovado. `params` preenche {{1}}, {{2}}, ... do corpo do template.
export async function sendWhatsAppTemplate(to: string, params: string[]): Promise<{ ok: boolean; error?: string }> {
  if (!WA_TOKEN || !WA_PHONE_ID) return { ok: false, error: 'WhatsApp não configurado' }
  try {
    const res = await fetch(`${GRAPH}/${WA_PHONE_ID}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WA_TOKEN}` },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normalizePhone(to),
        type: 'template',
        template: {
          name: WA_TEMPLATE,
          language: { code: WA_LANG },
          components: [{ type: 'body', parameters: params.map(t => ({ type: 'text', text: cleanParam(t) })) }],
        },
      }),
      signal: AbortSignal.timeout(15000),
    })
    const j = await res.json().catch(() => ({})) as any
    if (!res.ok) return { ok: false, error: j?.error?.message || `HTTP ${res.status}` }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// Texto livre — só funciona dentro da janela de 24h (se o usuário mandou msg ao número).
// Útil para um teste de conectividade antes do template ser aprovado.
export async function sendWhatsAppText(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  if (!WA_TOKEN || !WA_PHONE_ID) return { ok: false, error: 'WhatsApp não configurado' }
  try {
    const res = await fetch(`${GRAPH}/${WA_PHONE_ID}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WA_TOKEN}` },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: normalizePhone(to), type: 'text', text: { body: body.slice(0, 4096) } }),
      signal: AbortSignal.timeout(15000),
    })
    const j = await res.json().catch(() => ({})) as any
    if (!res.ok) return { ok: false, error: j?.error?.message || `HTTP ${res.status}` }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
