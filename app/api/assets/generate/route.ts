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

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY não configurada no servidor.' }, { status: 503 })
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

  // ── 1. Gera a imagem com gpt-image-1 ────────────────────────────────────────
  let b64: string
  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: buildPrompt(body),
        size,
        n: 1,
        quality: 'high',
      }),
      signal: AbortSignal.timeout(110000),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      let rawMsg = `Falha na geração (${res.status})`
      try { const j = JSON.parse(errText); rawMsg = j.error?.message || rawMsg } catch {}
      console.error('[assets/generate] openai error:', res.status, errText.slice(0, 400))
      // Mensagens amigáveis para erros de conta/cobrança da OpenAI.
      const low = rawMsg.toLowerCase()
      let msg = rawMsg
      if (low.includes('billing') || low.includes('hard limit') || res.status === 402) {
        msg = 'Geração de imagem indisponível: o limite de cobrança da conta OpenAI foi atingido. Ajuste o limite/saldo em platform.openai.com (Billing → Limits) e tente de novo.'
      } else if (low.includes('quota') || low.includes('insufficient')) {
        msg = 'Geração de imagem indisponível: a conta OpenAI está sem créditos/quota. Adicione saldo em platform.openai.com e tente de novo.'
      } else if (res.status === 429) {
        msg = 'Muitas requisições à OpenAI agora. Aguarde alguns segundos e tente de novo.'
      }
      return NextResponse.json({ error: msg }, { status: 502 })
    }

    const data = await res.json()
    b64 = data?.data?.[0]?.b64_json
    if (!b64) {
      console.error('[assets/generate] resposta sem b64_json')
      return NextResponse.json({ error: 'A IA não retornou imagem.' }, { status: 502 })
    }
  } catch (e: any) {
    const msg = e?.name === 'TimeoutError' ? 'A geração demorou demais. Tente um prompt mais simples.' : (e?.message || 'Erro na geração')
    console.error('[assets/generate]', msg)
    return NextResponse.json({ error: msg }, { status: 504 })
  }

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
