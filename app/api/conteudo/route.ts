// app/api/conteudo/route.ts — Geração de conteúdo para redes sociais via Claude
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sanitizeText } from '@/lib/sanitize'

const PLATFORM_GUIDE: Record<string, string> = {
  instagram: 'Instagram Feed/Reels — legendas de até 2200 chars, hashtags ao final, gancho forte nos primeiros 2 segundos do Reels',
  tiktok:    'TikTok — roteiro curto para vídeo (15-60s), gancho nos primeiros 3 segundos, linguagem informal, trending sounds',
  facebook:  'Facebook — posts mais longos permitidos, storytelling funciona bem, grupos e comunidades',
  linkedin:  'LinkedIn — tom profissional mas autêntico, dados e resultados, histórias de transformação B2B',
  youtube:   'YouTube Shorts ou vídeo longo — gancho forte no título, descrição com palavras-chave SEO',
  email:     'E-mail marketing — assunto irresistível, copy focado em um único CTA, personalização',
}

async function fetchAdLibraryContext(accessToken: string, niche: string, theme: string): Promise<string> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/meta-ad-library`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken, searchTerms: `${niche} ${theme}`.slice(0, 80), niche }),
      signal: AbortSignal.timeout(6000),
    })
    const data = await res.json()
    if (!data.success || !data.ads?.length) return ''
    const examples = data.ads
      .filter((a: any) => a.body)
      .slice(0, 3)
      .map((a: any, i: number) => `Exemplo ${i + 1} (${a.page || 'anunciante'}): "${a.body.slice(0, 200)}"${a.title ? ` | Título: "${a.title}"` : ''}`)
      .join('\n')
    return examples ? `\nREFERÊNCIAS REAIS DA BIBLIOTECA DE ANÚNCIOS DO META (nicho ${niche}):\n${examples}\nUse como inspiração de tom e estrutura — crie algo DIFERENTE e melhor.\n` : ''
  } catch {
    return ''
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { clientData: _cd, persona, platform, theme: _theme, role, metaAccessToken } = await req.json()
  const theme = sanitizeText(_theme, 200)
  const clientData = _cd ? { ..._cd, niche: sanitizeText(_cd.niche, 120), name: sanitizeText(_cd.name, 120) } : _cd
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

Use a ferramenta "emit_posts" para retornar as 3 ideias. Cada post precisa de:
- tipo: tipo do conteúdo (Reels, Carrossel, Stories, Post, Vídeo, etc.)
- gancho: primeira frase ou cena que para o scroll imediatamente, máximo 15 palavras
- estrutura: 2-3 frases de como o conteúdo se desenvolve
- legenda: legenda completa pronta para copiar e postar, com emojis e tom correto para a plataforma
- cta: chamada para ação específica e não genérica
- hashtags: 5 hashtags relevantes`

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API key não configurada' }, { status: 500 })

  // Pesquisa na Biblioteca de Anúncios do Meta em paralelo (silenciosa — só enriquece o prompt)
  const adLibCtx = metaAccessToken
    ? await fetchAdLibraryContext(metaAccessToken, clientData.niche, theme)
    : ''

  const enrichedPrompt = adLibCtx ? prompt.replace(
    'Crie 3 ideias de conteúdo distintas',
    `${adLibCtx}\nCrie 3 ideias de conteúdo distintas`
  ) : prompt

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const anthropic = new Anthropic({ apiKey })

    // Structured output via tool use: a API garante JSON válido (já parseado),
    // sem o risco de aspas/quebras de linha no texto quebrarem o JSON.parse.
    const postSchema = {
      type: 'object' as const,
      properties: {
        tipo:      { type: 'string' as const },
        gancho:    { type: 'string' as const },
        estrutura: { type: 'string' as const },
        legenda:   { type: 'string' as const },
        cta:       { type: 'string' as const },
        hashtags:  { type: 'array' as const, items: { type: 'string' as const } },
      },
      required: ['tipo', 'gancho', 'estrutura', 'legenda', 'cta', 'hashtags'],
    }

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      system: 'Você é um especialista em marketing de conteúdo digital brasileiro.',
      tools: [{
        name: 'emit_posts',
        description: 'Retorna as 3 ideias de conteúdo geradas, prontas para usar.',
        input_schema: {
          type: 'object',
          properties: { posts: { type: 'array', items: postSchema } },
          required: ['posts'],
        },
      }],
      tool_choice: { type: 'tool', name: 'emit_posts' },
      messages: [{ role: 'user', content: enrichedPrompt }],
    })

    const toolUse = response.content.find((b: any) => b.type === 'tool_use') as any
    let result: any = toolUse?.input
    // Fallback defensivo: se por algum motivo não vier tool_use, tenta texto.
    if (!result?.posts) {
      const text = (response.content.find((b: any) => b.type === 'text') as any)?.text?.trim() || ''
      const m = text.match(/(\{[\s\S]*\})/)
      if (m) { try { result = JSON.parse(m[1]) } catch {} }
    }
    if (!Array.isArray(result?.posts) || result.posts.length === 0) {
      throw new Error('Não consegui gerar as ideias agora — tente novamente.')
    }
    return NextResponse.json({ success: true, posts: result.posts, usedAdLibrary: !!adLibCtx })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
