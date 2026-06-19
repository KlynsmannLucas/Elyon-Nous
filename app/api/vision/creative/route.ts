// app/api/vision/creative/route.ts — Análise visual de criativos / landing pages
// Recurso ADITIVO via Gemini (multimodal). Não altera nenhuma rota existente.
// Recebe uma imagem (base64) + dados do cliente e devolve um parecer estruturado.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sanitizeText } from '@/lib/sanitize'

export const maxDuration = 30

interface VisionBody {
  image?: { mimeType?: string; base64?: string }
  kind?: 'creative' | 'landing'
  niche?: string
  clientName?: string
}

const MAX_IMAGE_BYTES = 6 * 1024 * 1024  // ~6MB de base64

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

  const { isGeminiEnabled } = await import('@/lib/gemini')
  if (!isGeminiEnabled()) {
    return NextResponse.json({ success: false, error: 'Análise visual indisponível no momento.' }, { status: 503 })
  }

  const { rateLimit } = await import('@/lib/rateLimit')
  const rl = rateLimit(userId, 'vision', { max: 15, windowSec: 3600 })
  if (!rl.ok) {
    const waitSec = rl.retryAfterSec ?? 3600
    return NextResponse.json(
      { success: false, error: `Limite atingido. Tente novamente em ${Math.ceil(waitSec / 60)} minuto(s).` },
      { status: 429, headers: { 'Retry-After': String(waitSec) } },
    )
  }

  const body = (await req.json()) as VisionBody
  const mimeType = body.image?.mimeType || ''
  const base64   = body.image?.base64 || ''
  if (!base64 || !/^image\/(png|jpe?g|webp|gif)$/i.test(mimeType)) {
    return NextResponse.json({ success: false, error: 'Imagem inválida. Envie um PNG, JPG ou WEBP.' }, { status: 400 })
  }
  if (base64.length > MAX_IMAGE_BYTES) {
    return NextResponse.json({ success: false, error: 'Imagem muito grande (máx. ~4MB).' }, { status: 413 })
  }

  const kind  = body.kind === 'landing' ? 'landing' : 'creative'
  const niche = sanitizeText(body.niche, 120) || 'negócio'

  // Plano / trial — mesmo padrão das demais rotas de IA
  const { clerkClient } = await import('@clerk/nextjs/server')
  const clerkUser = await (await clerkClient()).users.getUser(userId)
  const plan = (clerkUser.publicMetadata as any)?.plan as string | undefined
  const hasActivePlan = plan && plan !== 'free'
  let effectivePlan = plan || 'free'
  if (!hasActivePlan) {
    const createdAtMs = typeof clerkUser.createdAt === 'number' ? clerkUser.createdAt : new Date(clerkUser.createdAt as any).getTime()
    const inTrial = (Date.now() - createdAtMs) < 14 * 24 * 60 * 60 * 1000
    if (!inTrial) {
      return NextResponse.json({ success: false, error: 'Período de avaliação encerrado. Assine um plano para continuar.' }, { status: 402 })
    }
    effectivePlan = 'trial'
  }

  const { checkAndDeductCredits, refundCredits } = await import('@/lib/credits')
  const creditResult = await checkAndDeductCredits(userId, effectivePlan, 'gemini_vision')
  if (!creditResult.allowed) {
    return NextResponse.json({ success: false, error: creditResult.error }, { status: 402 })
  }

  const focusCreative = `Avalie este CRIATIVO de anúncio para o nicho "${niche}". Considere: clareza da oferta/proposta de valor, força do gancho, legibilidade do texto, hierarquia visual, presença e destaque do CTA, prova social, e aderência ao público do nicho. Estime o potencial de CTR.`
  const focusLanding  = `Avalie este print de LANDING PAGE para o nicho "${niche}". Considere: clareza da proposta de valor acima da dobra, visibilidade e clareza do CTA, número de campos de formulário, sinais de confiança/prova social, legibilidade e foco. Estime o potencial de conversão (clique→lead).`

  const prompt = `Você é um diretor de criação e CRO sênior do mercado brasileiro de tráfego pago.
${kind === 'landing' ? focusLanding : focusCreative}

Responda em português APENAS com JSON válido (sem markdown), nesta estrutura:
{
  "score": NUMBER_0_100,
  "veredito": "1-2 frases resumindo a qualidade e o maior ganho possível",
  "pontos_fortes": ["ponto 1", "ponto 2", "ponto 3"],
  "problemas": ["problema 1 específico", "problema 2", "problema 3"],
  "recomendacoes": [
    { "titulo": "ação direta", "impacto": "alto|medio|baixo", "detalhe": "como executar em 1 frase" }
  ]
}`

  try {
    const { callGeminiJson, geminiModel } = await import('@/lib/gemini')
    const analysis = await callGeminiJson<Record<string, unknown>>({
      model: geminiModel('VISION'),
      user: prompt,
      images: [{ mimeType, base64 }],
      maxTokens: 1600,
      timeoutMs: 26000,
    })
    return NextResponse.json({ success: true, kind, analysis, source: 'gemini' })
  } catch (err: any) {
    refundCredits(userId, effectivePlan, 'gemini_vision').catch(() => {})
    const raw = String(err?.message || err || '')
    // Bloqueio de conta/projeto do Google (403/PERMISSION_DENIED) ou indisponibilidade:
    // não é acionável pelo usuário → responde 503 para o painel se esconder sozinho.
    if (/403|permission_denied|denied access|api key not valid|quota|not enabled|forbidden/i.test(raw)) {
      console.error('[vision/creative] Gemini indisponível (403/permissão):', raw.slice(0, 200))
      return NextResponse.json({ success: false, error: 'Análise visual indisponível no momento.' }, { status: 503 })
    }
    const { errMsg } = await import('@/lib/errMsg')
    return NextResponse.json({ success: false, error: errMsg(err, 'Não foi possível analisar a imagem. Tente novamente.') }, { status: 500 })
  }
}
