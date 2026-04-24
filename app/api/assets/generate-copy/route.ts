// app/api/assets/generate-copy/route.ts — Gera copy de anúncio a partir de um asset
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const ASSET_CONTEXT: Record<string, string> = {
  logo:      'imagem do logotipo da marca (identidade visual, símbolo da empresa)',
  product:   'foto do produto/serviço oferecido (o que o cliente está comprando)',
  lifestyle: 'imagem de estilo de vida/ambiente (contexto emocional e aspiracional)',
  banner:    'arte/banner já criado para anúncio (criativo pronto para veicular)',
  other:     'imagem de apoio da marca',
}

const PLATFORM_GUIDE: Record<string, string> = {
  meta:    'Meta Ads (Facebook/Instagram) — primary text até 125 chars, headline até 40 chars',
  google:  'Google Ads — headline até 30 chars, description até 90 chars',
  tiktok:  'TikTok Ads — gancho nos primeiros 3s, texto curto e direto',
  default: 'Meta Ads (Facebook/Instagram) — primary text até 125 chars, headline até 40 chars',
}

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { clientData, assetType, assetName, persona, platform = 'meta' } = await req.json()

  if (!clientData || !assetType) {
    return NextResponse.json({ error: 'Dados insuficientes' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API key não configurada' }, { status: 500 })

  const assetDesc = ASSET_CONTEXT[assetType] || ASSET_CONTEXT.other
  const platformGuide = PLATFORM_GUIDE[platform] || PLATFORM_GUIDE.default

  const personaSection = persona
    ? `Persona do comprador ideal: ${persona.name}, ${persona.age}, ${persona.profession}.
Dores principais: ${persona.pains?.slice(0,2).join('; ')}.
Desejos: ${persona.desires?.slice(0,2).join('; ')}.
Objeções: ${persona.objections?.slice(0,1).join('; ')}.`
    : `Público do nicho ${clientData.niche}.`

  const prompt = `Você é um redator especialista em copy para anúncios digitais no mercado brasileiro.

CONTEXTO:
- Empresa: ${clientData.clientName} (${clientData.niche})
- Produtos/Serviços: ${(clientData.products || []).join(', ')}
- Asset: ${assetDesc} — arquivo: "${assetName}"
- Plataforma: ${platformGuide}
- ${personaSection}

TAREFA: Crie 3 variações de copy prontas para usar neste anúncio.
Cada variação deve:
- Ser específica para o nicho (NÃO genérica)
- Usar a dor/desejo do comprador ideal como gancho
- Ter um CTA direto e urgente
- Ser natural em português brasileiro

Retorne SOMENTE JSON válido:
{
  "variants": [
    {
      "headline": "até 40 chars — gancho forte que para o scroll",
      "primaryText": "copy principal 2-3 frases — dor → solução → CTA",
      "cta": "botão de ação específico (não genérico)",
      "angle": "ângulo usado (dor | aspiração | prova social | urgência | oferta)"
    }
  ]
}`

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const anthropic = new Anthropic({ apiKey })

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: 'Você é especialista em copy para anúncios. Responda APENAS com JSON válido.',
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (response.content[0] as any).text?.trim() || ''
    let result: any
    try {
      result = JSON.parse(text)
    } catch {
      const m = text.match(/(\{[\s\S]*\})/)
      if (!m) throw new Error('JSON inválido na resposta')
      result = JSON.parse(m[1])
    }

    return NextResponse.json({ success: true, variants: result.variants })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
