// app/api/assets/generate/route.ts
// Gera um criativo de anúncio com IA (OpenAI gpt-image-1), salva no Supabase Storage
// e persiste em client_assets — o resultado vira parte do banco de criativos do cliente.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { normalizeClientId } from '@/lib/persistence'

export const maxDuration = 120 // geração de imagem pode levar ~30-60s

const VALID_TYPES = ['logo', 'product', 'lifestyle', 'banner', 'other']
const VALID_SIZES: Record<string, string> = {
  square:   '1024x1024', // feed / post
  portrait: '1024x1536', // stories / reels
  landscape:'1536x1024', // banner / display
}

// Contexto por tipo de asset — orienta a estética do criativo
const TYPE_DIRECTION: Record<string, string> = {
  logo:      'a clean, modern brand logo concept, vector-like, solid background, no text artifacts',
  product:   'a professional product photography shot, studio lighting, sharp focus, e-commerce style',
  lifestyle: 'an aspirational lifestyle photograph showing the desired result/transformation, natural light, authentic feel',
  banner:    'a polished social media ad creative, strong focal point, leaving clear space for a headline overlay',
  other:     'a high-quality marketing visual aligned with the brand',
}

interface GenerateRequest {
  prompt: string
  clientName: string
  niche?: string
  type?: string
  format?: 'square' | 'portrait' | 'landscape'
  brandColors?: string
}

// Monta o prompt final injetando contexto do cliente + direção estética do tipo
function buildPrompt(body: GenerateRequest): string {
  const direction = TYPE_DIRECTION[body.type || 'banner'] || TYPE_DIRECTION.banner
  const parts = [
    body.prompt.trim(),
    body.niche ? `Business niche: ${body.niche}.` : '',
    body.brandColors ? `Brand colors to favor: ${body.brandColors}.` : '',
    `Style direction: ${direction}.`,
    'Photorealistic where appropriate, professional advertising quality, no watermarks, no gibberish text, no spelling errors in any visible text.',
  ].filter(Boolean)
  return parts.join(' ')
}

// Dica de composição por formato (o Flash image-gen não tem parâmetro de aspect ratio)
const ASPECT_HINT: Record<string, string> = {
  square:    ' Square 1:1 composition, centered.',
  portrait:  ' Vertical 9:16 composition (stories/reels), subject centered with headroom on top.',
  landscape: ' Horizontal 16:9 banner composition, leave clear space for a headline.',
}
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
// Modelos de geração de imagem do Gemini (free-tier via generateContent), em ordem de preferência.
const GEMINI_IMAGE_MODELS = ['gemini-2.5-flash-image-preview', 'gemini-2.0-flash-preview-image-generation']
// Por último, tenta o Imagen (pago/predict) caso a conta tenha billing.
const IMAGEN_MODEL = 'imagen-3.0-generate-002'

interface ProviderAttempt {
  provider: 'openai' | 'gemini'
  model?: string
  configured: boolean
  ok: boolean
  status?: number
  code?: string
  type?: string
  message: string
}

function parseProviderError(status: number, text: string): ProviderAttempt {
  let message = `Falha na geração (${status})`
  let code = ''
  let type = ''
  try {
    const j = JSON.parse(text)
    message = j?.error?.message || message
    code = j?.error?.code || ''
    type = j?.error?.type || ''
  } catch {
    if (text.trim()) message = text.trim().slice(0, 240)
  }
  return { provider: 'openai', configured: true, ok: false, status, code, type, message }
}

function buildOpenAIHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }
  const projectId = process.env.OPENAI_PROJECT_ID || process.env.OPENAI_PROJECT
  const orgId = process.env.OPENAI_ORGANIZATION_ID || process.env.OPENAI_ORG_ID || process.env.OPENAI_ORGANIZATION
  if (projectId) headers['OpenAI-Project'] = projectId
  if (orgId) headers['OpenAI-Organization'] = orgId
  return headers
}

function classifyOpenAIMessage(attempt: ProviderAttempt | null): string {
  if (!attempt) return ''
  const low = `${attempt.code || ''} ${attempt.type || ''} ${attempt.message || ''}`.toLowerCase()

  if (attempt.status === 401 || low.includes('invalid api key') || low.includes('incorrect api key')) {
    return 'A chave OpenAI configurada no servidor está inválida. Atualize OPENAI_API_KEY na Vercel.'
  }
  if (attempt.status === 403 || low.includes('permission') || low.includes('not authorized')) {
    return 'A chave/projeto OpenAI não tem permissão para gerar imagem. Confira permissões da API key e Model Usage do projeto.'
  }
  if (low.includes('billing_hard_limit') || low.includes('hard limit')) {
    return 'O projeto/chave OpenAI configurado no servidor atingiu o limite de uso. O saldo geral pode existir, mas o projeto da chave precisa ter limite/modelo liberado.'
  }
  if (low.includes('insufficient_quota') || low.includes('current quota') || low.includes('quota')) {
    return 'A chave/projeto OpenAI configurado no servidor está sem quota disponível. Confira se a OPENAI_API_KEY da Vercel pertence ao mesmo projeto que tem saldo e se o limite/modelo está liberado.'
  }
  if (low.includes('billing')) {
    return 'A OpenAI recusou a geração por configuração de cobrança do projeto/chave. Confira Billing, Project Limits e Model Usage no projeto da API key.'
  }
  if (attempt.status === 429) return 'A OpenAI limitou as requisições agora. Tente novamente em alguns minutos.'
  if (low.includes('model') && (low.includes('not found') || low.includes('does not exist') || low.includes('unsupported'))) {
    return 'O modelo de imagem não está disponível para o projeto OpenAI configurado. Libere o modelo em Project → Limits → Model Usage.'
  }
  return attempt.message || 'A OpenAI não conseguiu gerar a imagem.'
}

function buildFailureMessage(openaiAttempt: ProviderAttempt | null, geminiAttempts: ProviderAttempt[]): string {
  const openai = classifyOpenAIMessage(openaiAttempt)
  const hasGeminiKey = geminiAttempts.some(a => a.configured)
  const geminiOk = geminiAttempts.some(a => a.ok)
  const geminiLast = [...geminiAttempts].reverse().find(a => !a.ok && a.message)

  const gemini = geminiOk
    ? ''
    : hasGeminiKey
      ? ` Fallback Gemini tentou gerar, mas falhou (${geminiLast?.message || 'sem imagem retornada'}).`
      : ' Fallback Gemini não está configurado na Vercel (GEMINI_API_KEY ausente).'

  return openai
    ? `${openai}${gemini}`
    : `Não foi possível gerar a imagem com nenhum provedor.${gemini}`
}

// Fallback: gera a imagem com o Gemini (Imagen ou Flash image-gen). Retorna base64 + tentativas.
async function generateWithGemini(prompt: string, format: string): Promise<{ b64: string | null; attempts: ProviderAttempt[] }> {
  const key = process.env.GEMINI_API_KEY
  const attempts: ProviderAttempt[] = []
  if (!key) {
    return {
      b64: null,
      attempts: [{ provider: 'gemini', configured: false, ok: false, message: 'GEMINI_API_KEY ausente na Vercel' }],
    }
  }
  const fullPrompt = prompt + (ASPECT_HINT[format] || ASPECT_HINT.square)

  // 1) Flash image generation (generateContent → inlineData) — funciona na API key padrão.
  for (const model of GEMINI_IMAGE_MODELS) {
    try {
      const res = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
        }),
        signal: AbortSignal.timeout(110000),
      })
      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        attempts.push({ provider: 'gemini', model, configured: true, ok: false, status: res.status, message: errText.slice(0, 240) || `Gemini ${model} falhou` })
        console.error(`[assets/generate] gemini ${model} error:`, res.status, errText.slice(0, 300))
        continue
      }
      const data = await res.json()
      const parts: any[] = data?.candidates?.[0]?.content?.parts || []
      const img = parts.find(p => p?.inlineData?.data)?.inlineData?.data
      if (img) {
        attempts.push({ provider: 'gemini', model, configured: true, ok: true, status: res.status, message: 'Imagem gerada' })
        return { b64: img, attempts }
      }
      attempts.push({ provider: 'gemini', model, configured: true, ok: false, status: res.status, message: 'Gemini respondeu sem imagem' })
      console.error(`[assets/generate] gemini ${model} sem imagem na resposta`)
    } catch (e: any) {
      attempts.push({ provider: 'gemini', model, configured: true, ok: false, message: e?.message || 'Erro no Gemini' })
      console.error(`[assets/generate] gemini ${model} threw:`, e?.message)
    }
  }

  // 2) Imagen predict (só se a conta Google tiver billing).
  try {
    const ar = format === 'portrait' ? '9:16' : format === 'landscape' ? '16:9' : '1:1'
    const res = await fetch(`${GEMINI_BASE}/${IMAGEN_MODEL}:predict?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instances: [{ prompt }], parameters: { sampleCount: 1, aspectRatio: ar } }),
      signal: AbortSignal.timeout(110000),
    })
    if (res.ok) {
      const data = await res.json()
      const img = data?.predictions?.[0]?.bytesBase64Encoded || null
      attempts.push({ provider: 'gemini', model: IMAGEN_MODEL, configured: true, ok: !!img, status: res.status, message: img ? 'Imagem gerada' : 'Imagen respondeu sem imagem' })
      return { b64: img, attempts }
    }
    const errText = await res.text().catch(() => '')
    attempts.push({ provider: 'gemini', model: IMAGEN_MODEL, configured: true, ok: false, status: res.status, message: errText.slice(0, 240) || 'Imagen falhou' })
    console.error('[assets/generate] imagen predict error:', res.status, errText.slice(0, 300))
  } catch (e: any) {
    attempts.push({ provider: 'gemini', model: IMAGEN_MODEL, configured: true, ok: false, message: e?.message || 'Erro no Imagen' })
    console.error('[assets/generate] imagen predict threw:', e?.message)
  }
  return { b64: null, attempts }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey && !process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'Nenhum provedor de imagem configurado (OPENAI_API_KEY ou GEMINI_API_KEY).' }, { status: 503 })
  }
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY não configurada — configure no Vercel e faça redeploy.' },
      { status: 503 }
    )
  }

  let body: GenerateRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  if (!body.prompt?.trim() || !body.clientName) {
    return NextResponse.json({ error: 'prompt e clientName são obrigatórios' }, { status: 400 })
  }
  const type = VALID_TYPES.includes(body.type || '') ? body.type! : 'banner'
  const size = VALID_SIZES[body.format || 'square'] || VALID_SIZES.square

  // ── Controle de custo: debita créditos ANTES de chamar os provedores ────────
  const { clerkClient } = await import('@clerk/nextjs/server')
  const clerkUser = await (await clerkClient()).users.getUser(userId)
  const plan = (clerkUser.publicMetadata as any)?.plan as string | undefined
  const hasActivePlan = !!plan && plan !== 'free'
  const createdAtMs = typeof clerkUser.createdAt === 'number' ? clerkUser.createdAt : new Date(clerkUser.createdAt as any).getTime()
  const inTrial = (Date.now() - createdAtMs) < 14 * 24 * 60 * 60 * 1000
  const effectivePlan = hasActivePlan ? plan! : (inTrial ? 'trial' : 'free')

  const { checkAndDeductCredits, refundCredits } = await import('@/lib/credits')
  const credit = await checkAndDeductCredits(userId, effectivePlan, 'assets_generate')
  if (!credit.allowed) {
    return NextResponse.json({ error: credit.error || 'Créditos insuficientes para gerar imagem.' }, { status: 402 })
  }
  // Em qualquer saída de erro a partir daqui, devolvemos o crédito.
  const refund = () => { refundCredits(userId, effectivePlan, 'assets_generate').catch(() => {}) }

  // ── 1. Gera a imagem: OpenAI (gpt-image-1) → fallback Gemini (Imagen) ───────
  const prompt = buildPrompt(body)
  let b64: string | null = null
  let provider = ''
  let openaiAttempt: ProviderAttempt | null = null
  let geminiAttempts: ProviderAttempt[] = []

  if (apiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: buildOpenAIHeaders(apiKey),
        body: JSON.stringify({ model: 'gpt-image-1', prompt, size, n: 1, quality: 'high' }),
        signal: AbortSignal.timeout(110000),
      })
      if (res.ok) {
        const data = await res.json()
        b64 = data?.data?.[0]?.b64_json || null
        if (b64) {
          provider = 'openai'
          openaiAttempt = { provider: 'openai', configured: true, ok: true, status: res.status, message: 'Imagem gerada' }
        } else {
          openaiAttempt = { provider: 'openai', configured: true, ok: false, status: res.status, message: 'OpenAI respondeu sem imagem' }
        }
      } else {
        const errText = await res.text().catch(() => '')
        openaiAttempt = parseProviderError(res.status, errText)
        console.error('[assets/generate] openai error:', res.status, errText.slice(0, 400))
      }
    } catch (e: any) {
      const message = e?.name === 'TimeoutError' ? 'A OpenAI demorou demais para responder.' : (e?.message || 'Erro na OpenAI')
      openaiAttempt = { provider: 'openai', configured: true, ok: false, message }
      console.error('[assets/generate] openai threw:', message)
    }
  } else {
    openaiAttempt = { provider: 'openai', configured: false, ok: false, message: 'OPENAI_API_KEY ausente na Vercel' }
  }

  // Fallback automático: se a OpenAI não gerou, tenta o Imagen (Gemini).
  if (!b64) {
    const g = await generateWithGemini(prompt, body.format || 'square')
    geminiAttempts = g.attempts
    if (g.b64) { b64 = g.b64; provider = 'gemini' }
  }

  if (!b64) {
    refund()
    const msg = buildFailureMessage(openaiAttempt, geminiAttempts)
    return NextResponse.json({ error: msg, attempts: [openaiAttempt, ...geminiAttempts].filter(Boolean) }, { status: 502 })
  }
  console.log('[assets/generate] imagem gerada via', provider)

  // ── 2. Upload para o Supabase Storage ───────────────────────────────────────
  const buffer = Buffer.from(b64, 'base64')
  const sizeKb = Math.round(buffer.length / 1024)
  const clientId = normalizeClientId(body.clientName)
  const fileName = `ai_${Date.now()}.png`
  const storagePath = `${userId}/${clientId}/${type}/${fileName}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from('client-assets')
    .upload(storagePath, buffer, { contentType: 'image/png', upsert: false })

  if (uploadError) {
    refund()
    console.error('[assets/generate] upload error:', uploadError.message)
    return NextResponse.json({ error: `Erro ao salvar imagem: ${uploadError.message}` }, { status: 500 })
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('client-assets')
    .getPublicUrl(storagePath)

  // Nome legível derivado do prompt (banco de criativos)
  const shortPrompt = body.prompt.trim().replace(/\s+/g, ' ').slice(0, 48)
  const assetName = `IA · ${shortPrompt}${body.prompt.trim().length > 48 ? '…' : ''}`

  // ── 3. Persiste metadados (mesmas colunas do /save) ─────────────────────────
  const { data: asset, error: dbError } = await supabaseAdmin
    .from('client_assets')
    .insert({
      user_id:      userId,
      client_id:    clientId,
      client_name:  body.clientName,
      type,
      name:         assetName,
      storage_path: storagePath,
      public_url:   publicUrl,
      mime_type:    'image/png',
      size_kb:      sizeKb,
    })
    .select()
    .single()

  if (dbError) {
    refund()
    await supabaseAdmin.storage.from('client-assets').remove([storagePath])
    console.error('[assets/generate] db error:', dbError.message)
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ asset, provider })
}
