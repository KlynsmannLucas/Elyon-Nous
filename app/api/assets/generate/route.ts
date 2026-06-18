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

// Fallback: gera a imagem com o Gemini (Imagen ou Flash image-gen). Retorna base64 ou null.
async function generateWithGemini(prompt: string, format: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null
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
        console.error(`[assets/generate] gemini ${model} error:`, res.status, (await res.text().catch(() => '')).slice(0, 300))
        continue
      }
      const data = await res.json()
      const parts: any[] = data?.candidates?.[0]?.content?.parts || []
      const img = parts.find(p => p?.inlineData?.data)?.inlineData?.data
      if (img) return img
      console.error(`[assets/generate] gemini ${model} sem imagem na resposta`)
    } catch (e: any) {
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
      return data?.predictions?.[0]?.bytesBase64Encoded || null
    }
    console.error('[assets/generate] imagen predict error:', res.status, (await res.text().catch(() => '')).slice(0, 300))
  } catch (e: any) {
    console.error('[assets/generate] imagen predict threw:', e?.message)
  }
  return null
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

  // ── 1. Gera a imagem: OpenAI (gpt-image-1) → fallback Gemini (Imagen) ───────
  const prompt = buildPrompt(body)
  let b64: string | null = null
  let provider = ''
  let openaiMsg = '' // mensagem amigável caso a OpenAI falhe (mostrada só se o Gemini também falhar)

  if (apiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'gpt-image-1', prompt, size, n: 1, quality: 'high' }),
        signal: AbortSignal.timeout(110000),
      })
      if (res.ok) {
        const data = await res.json()
        b64 = data?.data?.[0]?.b64_json || null
        if (b64) provider = 'openai'
      } else {
        const errText = await res.text().catch(() => '')
        let rawMsg = `Falha na geração (${res.status})`
        try { const j = JSON.parse(errText); rawMsg = j.error?.message || rawMsg } catch {}
        console.error('[assets/generate] openai error:', res.status, errText.slice(0, 400))
        const low = rawMsg.toLowerCase()
        if (low.includes('billing') || low.includes('hard limit') || res.status === 402) {
          openaiMsg = 'Limite de cobrança da conta OpenAI atingido (ajuste em platform.openai.com → Billing → Limits).'
        } else if (low.includes('quota') || low.includes('insufficient')) {
          openaiMsg = 'Conta OpenAI sem créditos/quota (adicione saldo em platform.openai.com).'
        } else if (res.status === 429) {
          openaiMsg = 'Muitas requisições à OpenAI agora.'
        } else {
          openaiMsg = rawMsg
        }
      }
    } catch (e: any) {
      openaiMsg = e?.name === 'TimeoutError' ? 'A OpenAI demorou demais para responder.' : (e?.message || 'Erro na OpenAI')
      console.error('[assets/generate] openai threw:', openaiMsg)
    }
  }

  // Fallback automático: se a OpenAI não gerou, tenta o Imagen (Gemini).
  if (!b64) {
    const g = await generateWithGemini(prompt, body.format || 'square')
    if (g) { b64 = g; provider = 'gemini' }
  }

  if (!b64) {
    const msg = openaiMsg
      ? `${openaiMsg} O fallback (Gemini Imagen) também não conseguiu gerar a imagem agora.`
      : 'Não foi possível gerar a imagem com nenhum provedor (OpenAI/Gemini). Tente novamente em instantes.'
    return NextResponse.json({ error: msg }, { status: 502 })
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
    await supabaseAdmin.storage.from('client-assets').remove([storagePath])
    console.error('[assets/generate] db error:', dbError.message)
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ asset })
}
