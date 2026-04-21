// app/api/conteudo/route.ts — Geração de conteúdo para redes sociais via Claude
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const PLATFORM_GUIDE: Record<string, string> = {
  instagram: 'Instagram Feed/Reels — legendas de até 2200 chars, hashtags ao final, gancho forte nos primeiros 2 segundos do Reels',
  tiktok:    'TikTok — roteiro curto para vídeo (15-60s), gancho nos primeiros 3 segundos, linguagem informal, trending sounds',
  facebook:  'Facebook — posts mais longos permitidos, storytelling funciona bem, grupos e comunidades',
  linkedin:  'LinkedIn — tom profissional mas autêntico, dados e resultados, histórias de transformação B2B',
  youtube:   'YouTube Shorts ou vídeo longo — gancho forte no título, descrição com palavras-chave SEO',
  email:     'E-mail marketing — assunto irresistível, copy focado em um único CTA, personalização',
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { clientData, persona, platform, theme, role } = await req.json()
  if (!clientData || !platform || !theme) {
    return NextResponse.json({ error: 'Dados insuficientes' }, { status: 400 })
  }

  const platformGuide = PLATFORM_GUIDE[platform.toLowerCase()] || platform
  const personaContext = persona
    ? `Persona: ${persona.name}, ${persona.age}, ${persona.profession}. Dores: ${persona.pains?.slice(0,2).join('; ')}. Objeções: ${persona.objections?.slice(0,1).join('; ')}.`
    : `Público do nicho ${clientData.niche}.`

  const roleMap: Record<string, string> = {
    gestor: 'Gestor de Tráfego', social: 'Social Media', influencer: 'Influencer', dono: 'Dono do Negócio',
  }
  const roleLabel = roleMap[role] || 'Criador de Conteúdo'

  const prompt = `Você é um especialista em marketing de conteúdo digital brasileiro.

CONTEXTO:
- Negócio: ${clientData.niche} — ${(clientData.products || []).join(', ')}
- ${personaContext}
- Plataforma: ${platformGuide}
- Tema solicitado: ${theme}
- Quem vai criar: ${roleLabel}

Crie 3 ideias de conteúdo distintas para ${platform} sobre "${theme}".
Cada ideia deve ser pronta para usar — não genérica, específica para o nicho e a persona.

Retorne APENAS um JSON válido com esta estrutura:
{
  "posts": [
    {
      "tipo": "tipo do conteúdo (Reels, Carrossel, Stories, Post, Vídeo, etc.)",
      "gancho": "primeira frase ou cena — deve parar o scroll imediatamente, máximo 15 palavras",
      "estrutura": "descrição de 2-3 frases de como o conteúdo se desenvolve",
      "legenda": "legenda completa pronta para copiar e postar, com emojis e tom correto para a plataforma",
      "cta": "chamada para ação específica e não genérica",
      "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
    }
  ]
}`

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API key não configurada' }, { status: 500 })

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const anthropic = new Anthropic({ apiKey })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (response.content[0] as any).text?.trim() || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSON não encontrado na resposta')

    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json({ success: true, posts: result.posts })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
