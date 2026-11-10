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
const GEMINI_API_ROOT = 'https://generativelanguage.googleapis.com/v1beta'
const GEMINI_MODELS_BASE = `${GEMINI_API_ROOT}/models`
// Interactions API e modelos atuais de imagem do Gemini. Pode ser sobrescrito por GEMINI_IMAGE_MODELS.
const GEMINI_INTERACTION_IMAGE_MODELS = ['gemini-3.1-flash-image-preview', 'gemini-2.5-flash-image', 'gemini-3-pro-image-preview']
// Fallback legado via generateContent para contas que ainda têm estes previews habilitados.
const GEMINI_CONTENT_IMAGE_MODELS = ['gemini-2.5-flash-image-preview', 'gemini-2.0-flash-preview-image-generation']

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
  const gemini = classifyGeminiAttempts(geminiAttempts)

  return openai
    ? `${openai}${gemini ? ` ${gemini}` : ''}`
    : `Não foi possível gerar a imagem com nenhum provedor.${gemini ? ` ${gemini}` : ''}`
}

function classifyGeminiAttempts(attempts: ProviderAttempt[]): string {
  if (!attempts.length) return ''
  if (attempts.every(a => !a.configured)) return 'Fallback Gemini não está configurado na Vercel (GEMINI_API_KEY ausente).'
  if (attempts.some(a => a.ok)) return ''

  const last = [...attempts].reverse().find(a => !a.ok)
  const low = attempts.map(a => `${a.status || ''} ${a.code || ''} ${a.type || ''} ${a.message || ''}`).join(' ').toLowerCase()

  if (low.includes('api key not valid') || low.includes('api_key_invalid') || low.includes('invalid api key')) {
    return 'Fallback Gemini está com chave inválida. Atualize GEMINI_API_KEY na Vercel.'
  }
  if (low.includes('permission') || low.includes('permission_denied') || low.includes('not authorized')) {
    return 'Fallback Gemini sem permissão para gerar imagem. Libere a Gemini API/modelos de imagem no projeto Google da chave.'
  }
  if (low.includes('quota') || low.includes('resource_exhausted') || low.includes('rate limit')) {
    return 'Fallback Gemini atingiu quota/limite agora. Tente novamente em alguns minutos ou aumente o limite no Google AI Studio.'
  }
  if (low.includes('not found') || low.includes('unsupported') || low.includes('model')) {
    const models = [...new Set(attempts.map(a => a.model).filter(Boolean))].join(', ')
    return `Fallback Gemini não encontrou modelo de imagem liberado para essa chave${models ? ` (${models})` : ''}.`
  }
  return `Fallback Gemini tentou gerar, mas não retornou imagem${last?.status ? ` (HTTP ${last.status})` : ''}.`
}

function parseEnvList(name: string, fallback: string[]): string[] {
  const env = (process.env[name] || '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean)
  return [...new Set([...env, ...fallback])]
}

function parseGeminiError(status: number, text: string, model: string): ProviderAttempt {
  let message = `Gemini ${model} falhou`
  let code = ''
  let type = ''
  try {
    const j = JSON.parse(text)
    message = j?.error?.message || message
    code = j?.error?.status || j?.error?.code || ''
    type = j?.error?.type || ''
  } catch {
    if (text.trim()) message = text.trim().slice(0, 240)
  }
  return { provider: 'gemini', model, configured: true, ok: false, status, code, type, message }
}

function cleanBase64(value: string): string {
  return value.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '').trim()
}

function extractBase64Image(data: any): string | null {
  const seen = new Set<any>()

  const visit = (node: any): string | null => {
    if (!node || typeof node !== 'object' || seen.has(node)) return null
    seen.add(node)

    const type = String(node.type || '').toLowerCase()
    const mime = String(node.mime_type || node.mimeType || node.media_type || node.mediaType || '').toLowerCase()
    const isImage = type === 'image' || type === 'output_image' || mime.startsWith('image/')

    if (isImage) {
      for (const key of ['data', 'bytesBase64Encoded', 'b64_json', 'b64Json', 'base64']) {
        if (typeof node[key] === 'string' && node[key].trim()) return cleanBase64(node[key])
      }
    }

    const inline = node.inlineData || node.inline_data
    if (inline) {
      const img = visit(inline)
      if (img) return img
    }

    const source = node.source || node.image || node.output_image
    if (source) {
      const img = visit(source)
      if (img) return img
    }

    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          const img = visit(item)
          if (img) return img
        }
      } else if (value && typeof value === 'object') {
        const img = visit(value)
        if (img) return img
      }
    }
    return null
  }

  return visit(data)
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
  const aspectRatio = format === 'portrait' ? '9:16' : format === 'landscape' ? '16:9' : '1:1'

  // 1) Gemini Interactions API (rota atual de imagem).
  for (const model of parseEnvList('GEMINI_IMAGE_MODELS', GEMINI_INTERACTION_IMAGE_MODELS)) {
    try {
      const res = await fetch(`${GEMINI_API_ROOT}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          model,
          input: fullPrompt,
          response_format: { type: 'image', mime_type: 'image/png', aspect_ratio: aspectRatio, image_size: '1K' },
          store: false,
        }),
        signal: AbortSignal.timeout(110000),
      })
      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        attempts.push(parseGeminiError(res.status, errText, model))
        console.error(`[assets/generate] gemini interaction ${model} error:`, res.status, errText.slice(0, 300))
        continue
      }
      const data = await res.json()
      const img = extractBase64Image(data)
      if (img) {
        attempts.push({ provider: 'gemini', model, configured: true, ok: true, status: res.status, message: 'Imagem gerada' })
        return { b64: img, attempts }
      }
      attempts.push({ provider: 'gemini', model, configured: true, ok: false, status: res.status, message: 'Gemini Interactions respondeu sem imagem' })
      console.error(`[assets/generate] gemini interaction ${model} sem imagem na resposta`)
    } catch (e: any) {
      attempts.push({ provider: 'gemini', model, configured: true, ok: false, message: e?.message || 'Erro no Gemini Interactions' })
      console.error(`[assets/generate] gemini interaction ${model} threw:`, e?.message)
    }
  }

  // 2) Flash image generation legado (generateContent → inlineData).
  for (const model of parseEnvList('GEMINI_LEGACY_IMAGE_MODELS', GEMINI_CONTENT_IMAGE_MODELS)) {
    try {
      const res = await fetch(`${GEMINI_MODELS_BASE}/${model}:generateContent?key=${key}`, {
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
        attempts.push(parseGeminiError(res.status, errText, model))
        console.error(`[assets/generate] gemini ${model} error:`, res.status, errText.slice(0, 300))
        continue
      }
      const data = await res.json()
      const img = extractBase64Image(data)
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
  const { gateAndCharge, refundGate } = await import('@/lib/gate')
  const gate = await gateAndCharge('assets_generate')
  if (!gate.ok) return new Response(JSON.stringify({ success: false, error: gate.error }), { status: gate.status || 503, headers: { 'Content-Type': 'application/json' } })

  // Em qualquer saída de erro a partir daqui, devolvemos o crédito.
  const refund = () => { refundGate(gate, 'assets_generate').catch(() => {}) }

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
