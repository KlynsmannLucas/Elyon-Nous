// app/api/persona/route.ts — Geração de persona estruturada via Claude
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sanitizeText } from '@/lib/sanitize'
import { extractJson } from '@/lib/aiJson'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { clientData: _cd, role } = await req.json()
  const clientData = _cd ? {
    ..._cd,
    name:  sanitizeText(_cd.name, 120),
    niche: sanitizeText(_cd.niche, 120),
    products: Array.isArray(_cd.products) ? _cd.products.map((p: unknown) => sanitizeText(p, 100)) : _cd.products,
  } : _cd
  if (!clientData) return NextResponse.json({ error: 'Dados do cliente ausentes' }, { status: 400 })

  const roleMap: Record<string, string> = {
    gestor:    'Gestor de Tráfego Pago',
    social:    'Social Media / Criador de Conteúdo',
    influencer:'Influencer / Creator',
    dono:      'Dono do Negócio / Empreendedor',
  }
  const roleLabel = roleMap[role] || 'Estrategista de Marketing'

  const isGestor = role === 'gestor'

  // Avalia quais campos opcionais foram preenchidos no wizard
  const hasTargetAge      = Boolean(clientData.targetAge)
  const hasTargetGender   = Boolean(clientData.targetGender)
  const hasTargetIncome   = Boolean(clientData.targetIncome)
  const hasMainPains      = Boolean(clientData.mainPains)
  const hasMainObjection  = Boolean(clientData.mainObjection)
  const hasOnlineChannels = Boolean((clientData.onlineChannels || []).length)

  // Regras de precisão: quanto menos dados reais, menos específica deve ser a persona
  const ageInstruction     = hasTargetAge    ? `Use a faixa etária informada: ${clientData.targetAge}.`        : 'Use uma FAIXA ETÁRIA (ex: "entre 30 e 45 anos"), nunca uma idade exata.'
  const genderInstruction  = hasTargetGender ? `Gênero confirmado: ${clientData.targetGender}.`                : 'Use o perfil de gênero mais comum para o nicho, sem especificar.'
  const incomeInstruction  = hasTargetIncome ? `Use a renda informada: ${clientData.targetIncome}.`            : 'Use uma FAIXA DE RENDA (ex: "R$5.000–R$10.000/mês"), nunca um valor exato.'
  const painsInstruction   = hasMainPains    ? `Dores confirmadas pelo cliente: ${clientData.mainPains}.`      : 'Use dores TÍPICAS do nicho, sem inventar especificidades pessoais.'
  const objInstruction     = hasMainObjection? `Objeção confirmada: ${clientData.mainObjection}.`              : 'Use objeções comuns de quem compra nesse nicho.'
  const channelInstruction = hasOnlineChannels ? `Canais confirmados: ${(clientData.onlineChannels||[]).join(', ')}.` : 'Use os canais digitais mais comuns para o nicho.'

  const prompt = `Você é um estrategista sênior de marketing digital brasileiro.
O usuário é um ${roleLabel} que trabalha com ${clientData.niche}.

DADOS CONFIRMADOS DO NEGÓCIO (fonte: cadastro):
- Nicho: ${clientData.niche}
- Produto/Serviço: ${(clientData.products || []).join(', ')}
- Ticket médio: R$${clientData.ticketPrice || clientData.monthlyRevenue || 'não informado'}
- Cidade/Região: ${clientData.city || 'Brasil'}
- Budget de marketing: R$${clientData.budget}/mês
- Objetivo: ${clientData.objective}

DADOS DO PÚBLICO-ALVO (preenchidos no cadastro):
- Faixa etária: ${clientData.targetAge || 'não informado'}
- Gênero: ${clientData.targetGender || 'não informado'}
- Renda mensal: ${clientData.targetIncome || 'não informado'}
- Canais online preferidos: ${(clientData.onlineChannels || []).join(', ') || 'não informado'}
- Maior dor/problema: ${clientData.mainPains || 'não informado'}
- Principal objeção de compra: ${clientData.mainObjection || 'não informado'}

REGRAS DE PRECISÃO — SIGA OBRIGATORIAMENTE:
- ${ageInstruction}
- ${genderInstruction}
- ${incomeInstruction}
- ${painsInstruction}
- ${objInstruction}
- ${channelInstruction}
- Quanto menos dados reais disponíveis, use perfis MAIS AMPLOS e representativos. Nunca invente especificidades pessoais (estado civil, filhos, hobbies pessoais) que não tenham fonte.
- Profissão: use cargo genérico do segmento (ex: "Profissional liberal", "Empresária de médio porte"), não profissões ultra-específicas sem evidência.
- ANCORAGEM: dores, objeções e desejos devem refletir o que foi informado no cadastro (maior dor, principal objeção) e ser coerentes com o nicho/cidade — não clichês de marketing. PROIBIDO genérico vazio do tipo "quer qualidade" ou "tem medo de errar"; seja concreto e do mundo real desse público.

Crie uma persona estratégica e representativa baseada nesses dados. Útil para um ${roleLabel}.

${isGestor ? `IMPORTANTE: Como o usuário é Gestor de Tráfego, inclua OBRIGATORIAMENTE:
- facebookInterests: lista de 8-10 interesses específicos do Facebook/Instagram Ads (ex: marcas, páginas, comportamentos — não categorias genéricas)
- googleAdsKeywords: lista de 10-15 palavras-chave de intenção de compra para Google Ads, mix de broad/exact, em português, com modificadores (ex: "móveis planejados Curitiba", "orçamento cozinha planejada", "+marcenaria +curitiba")
- Seja hiper-específico: não "fitness" mas "Academia Smart Fit", não "beleza" mas "Sephora Brasil"` : ''}

${isGestor ? 'IMPORTANTE: preencha facebookInterests (8-10 interesses específicos do Meta Ads) e googleAdsKeywords (10-15 palavras-chave de intenção pro Google Ads).' : 'Não preencha facebookInterests nem googleAdsKeywords.'}
Use a ferramenta emit_persona para retornar a persona.`

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API key não configurada' }, { status: 500 })

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const anthropic = new Anthropic({ apiKey })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      tools: [{
        name: 'emit_persona',
        description: 'Retorna a persona estratégica estruturada.',
        input_schema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'nome fictício brasileiro (primeiro + sobrenome)' },
            age: { type: 'string', description: 'faixa etária, ex: entre 30 e 45 anos' },
            profession: { type: 'string' },
            income: { type: 'string', description: 'faixa de renda, ex: R$5.000–R$10.000/mês' },
            pains: { type: 'array', items: { type: 'string' }, description: '3-4 dores específicas e emocionais' },
            desires: { type: 'array', items: { type: 'string' } },
            fears: { type: 'array', items: { type: 'string' } },
            objections: { type: 'array', items: { type: 'string' } },
            favoriteChannels: { type: 'array', items: { type: 'string' } },
            buyingBehavior: { type: 'string', description: '2-3 frases sobre como decide a compra' },
            strategySummary: { type: 'string', description: `3-4 frases da melhor estratégia para o papel de ${roleLabel}` },
            facebookInterests: { type: 'array', items: { type: 'string' }, description: 'SÓ p/ Gestor de Tráfego: 8-10 interesses específicos do Meta Ads' },
            googleAdsKeywords: { type: 'array', items: { type: 'string' }, description: 'SÓ p/ Gestor: 10-15 palavras-chave de intenção pro Google Ads' },
            contentAngles: { type: 'array', items: { type: 'string' }, description: '3 ângulos de conteúdo' },
          },
          required: ['name', 'age', 'profession', 'income', 'pains', 'desires', 'fears', 'objections', 'favoriteChannels', 'buyingBehavior', 'strategySummary', 'contentAngles'],
        },
      }],
      tool_choice: { type: 'tool', name: 'emit_persona' },
      messages: [{ role: 'user', content: prompt }],
    })

    const persona: any = (response.content as any[]).find((b: any) => b.type === 'tool_use')?.input
    if (!persona?.name) return NextResponse.json({ error: 'Não consegui gerar a persona — tente novamente.' }, { status: 500 })

    return NextResponse.json({ success: true, persona })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
