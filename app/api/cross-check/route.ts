// app/api/cross-check/route.ts — "Segunda opinião" via Gemini sobre uma análise
// já gerada pelo Claude (auditoria ou estratégia). Recurso ADITIVO: não altera
// a geração original; apenas valida e aponta concordâncias/divergências.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sanitizeText } from '@/lib/sanitize'

export const maxDuration = 30

interface CrossCheckBody {
  kind?: 'audit' | 'strategy'
  payload?: unknown
  niche?: string
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

  const { isGeminiEnabled } = await import('@/lib/gemini')
  if (!isGeminiEnabled()) {
    return NextResponse.json({ success: false, error: 'Segunda opinião indisponível no momento.' }, { status: 503 })
  }

  const { rateLimit } = await import('@/lib/rateLimit')
  const rl = rateLimit(userId, 'cross-check', { max: 15, windowSec: 3600 })
  if (!rl.ok) {
    const waitSec = rl.retryAfterSec ?? 3600
    return NextResponse.json(
      { success: false, error: `Limite atingido. Tente novamente em ${Math.ceil(waitSec / 60)} minuto(s).` },
      { status: 429, headers: { 'Retry-After': String(waitSec) } },
    )
  }

  const body = (await req.json()) as CrossCheckBody
  const kind = body.kind === 'strategy' ? 'strategy' : 'audit'
  const niche = sanitizeText(body.niche, 120) || 'negócio'
  if (!body.payload) return NextResponse.json({ success: false, error: 'Análise ausente.' }, { status: 400 })

  // Plano / trial — mesmo padrão das demais rotas de IA
  const { gateAndCharge, refundGate } = await import('@/lib/gate')
  const gate = await gateAndCharge('gemini_crosscheck')
  if (!gate.ok) return new Response(JSON.stringify({ success: false, error: gate.error }), { status: gate.status || 503, headers: { 'Content-Type': 'application/json' } })


  // Serializa a análise (limitada para não estourar o prompt)
  const analysisJson = JSON.stringify(body.payload).slice(0, 12000)
  const label = kind === 'strategy' ? 'estratégia de growth' : 'auditoria de tráfego pago'

  const prompt = `Você é um segundo consultor sênior de tráfego pago e growth no Brasil, dando uma SEGUNDA OPINIÃO independente sobre uma ${label} já produzida por outro especialista para o nicho "${niche}".

ANÁLISE A REVISAR (JSON):
${analysisJson}

Avalie criticamente: onde você concorda, onde discorda (e por quê), e quais pontos cegos foram ignorados. Seja específico e direto. NÃO repita a análise — só valide.

Responda em português APENAS com JSON válido (sem markdown):
{
  "veredito": "1-2 frases: a análise está sólida? qual o maior risco de segui-la como está?",
  "concordancias": ["ponto em que você concorda 1", "2", "3"],
  "divergencias": [
    { "ponto": "o que a análise diz", "discordancia": "por que você vê diferente", "recomendacao": "o que faria" }
  ],
  "pontos_cegos": ["algo importante que a análise não considerou 1", "2"]
}`

  try {
    const { callGeminiJson, geminiModel } = await import('@/lib/gemini')
    const review = await callGeminiJson<Record<string, unknown>>({
      model: geminiModel('CROSSCHECK'),
      user: prompt,
      maxTokens: 2000,
      timeoutMs: 26000,
    })
    return NextResponse.json({ success: true, kind, review, source: 'gemini' })
  } catch (err: any) {
    refundGate(gate, 'gemini_crosscheck').catch(() => {})
    const { errMsg } = await import('@/lib/errMsg')
    return NextResponse.json({ success: false, error: errMsg(err, 'Não foi possível gerar a segunda opinião.') }, { status: 500 })
  }
}
