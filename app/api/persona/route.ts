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

Crie uma persona estratégica e representativa baseada nesses dados. Útil para um ${roleLabel}.

${isGestor ? `IMPORTANTE: Como o usuário é Gestor de Tráfego, inclua OBRIGATORIAMENTE:
- facebookInterests: lista de 8-10 interesses específicos do Facebook/Instagram Ads (ex: marcas, páginas, comportamentos — não categorias genéricas)
- googleAdsKeywords: lista de 10-15 palavras-chave de intenção de compra para Google Ads, mix de broad/exact, em português, com modificadores (ex: "móveis planejados Curitiba", "orçamento cozinha planejada", "+marcenaria +curitiba")
- Seja hiper-específico: não "fitness" mas "Academia Smart Fit", não "beleza" mas "Sephora Brasil"` : ''}

Retorne APENAS um JSON válido, sem texto antes ou depois, com exatamente esta estrutura:
{
  "name": "nome fictício brasileiro (primeiro nome + sobrenome)",
  "age": "${hasTargetAge ? 'faixa baseada nos dados confirmados' : 'FAIXA etária, ex: entre 30 e 45 anos'}",
  "profession": "${hasTargetAge || hasTargetIncome ? 'profissão plausível' : 'perfil profissional genérico do segmento'}",
  "income": "${hasTargetIncome ? 'renda baseada nos dados confirmados' : 'FAIXA de renda, ex: R$5.000–R$10.000/mês'}",
  "pains": ["dor 1 específica e emocional", "dor 2", "dor 3", "dor 4"],
  "desires": ["desejo 1 específico e aspiracional", "desejo 2", "desejo 3", "desejo 4"],
  "fears": ["medo 1 específico", "medo 2", "medo 3"],
  "objections": ["objeção 1 com linguagem real", "objeção 2", "objeção 3"],
  "favoriteChannels": ["canal 1", "canal 2", "canal 3"],
  "buyingBehavior": "descrição de 2-3 frases sobre como essa persona toma decisões de compra",
  "strategySummary": "resumo de 3-4 frases da melhor estratégia para converter essa persona para o papel de ${roleLabel}",
  ${isGestor ? '"facebookInterests": ["interesse 1 específico", "interesse 2", "interesse 3", "interesse 4", "interesse 5", "interesse 6", "interesse 7", "interesse 8"],' : ''}
  ${isGestor ? '"googleAdsKeywords": ["palavra-chave 1", "palavra-chave 2", "palavra-chave 3", "palavra-chave 4", "palavra-chave 5", "palavra-chave 6", "palavra-chave 7", "palavra-chave 8", "palavra-chave 9", "palavra-chave 10"],' : ''}
  "contentAngles": ["ângulo de conteúdo 1 que ressoa com essa persona", "ângulo 2", "ângulo 3"]
}`

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API key não configurada' }, { status: 500 })

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const anthropic = new Anthropic({ apiKey })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: 'Você é um estrategista de marketing digital brasileiro. Responda APENAS com JSON válido e completo, sem texto antes ou depois, sem markdown, sem ```.',
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (response.content[0] as any).text?.trim() || ''
    const persona: any = extractJson(text)

    return NextResponse.json({ success: true, persona })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
