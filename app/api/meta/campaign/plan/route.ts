// app/api/meta/campaign/plan/route.ts
// Recebe intenção do usuário + dados do cliente, retorna plano estruturado para revisão
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'
import { getValidMetaToken } from '@/services/meta/token-manager'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const META_BASE = 'https://graph.facebook.com/v21.0'

async function fetchPages(token: string) {
  try {
    const res  = await fetch(`${META_BASE}/me/accounts?fields=id,name&access_token=${token}`)
    const data = await res.json()
    return (data.data || []) as { id: string; name: string }[]
  } catch {
    return []
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { intent, accountId: bodyAccountId, clientData } = await req.json()
  if (!intent) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  // Busca token server-side — nunca exposto ao cliente
  let accessToken: string
  let accountId:   string
  try {
    const tokenData = await getValidMetaToken(userId)
    accessToken = tokenData.accessToken
    accountId   = bodyAccountId || tokenData.accountId || ''
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Token Meta inválido' }, { status: 401 })
  }
  if (!accountId) {
    return NextResponse.json({ error: 'Nenhuma conta de anúncios Meta configurada' }, { status: 400 })
  }

  // Busca páginas do Facebook disponíveis
  const pages = await fetchPages(accessToken)

  const clientCtx = clientData ? `
Dados do cliente:
- Nome: ${clientData.clientName || 'N/A'}
- Nicho: ${clientData.niche || 'N/A'}
- Orçamento mensal: R$${clientData.budget_monthly || 'N/A'}
- Público-alvo: ${clientData.target_audience || 'N/A'}
- Canais aprovados: ${(clientData.approved_channels || []).join(', ') || 'todos'}
- Produtos/serviços: ${(clientData.products || []).map((p: any) => p.name).join(', ') || 'N/A'}
` : ''

  const prompt = `Você é um especialista em Meta Ads. Analise a intenção abaixo e gere um plano de campanha completo.
${clientCtx}
Intenção do usuário: "${intent}"

Responda SOMENTE com um JSON válido no formato abaixo (sem markdown, sem texto extra):
{
  "campaign": {
    "name": "Nome descritivo da campanha",
    "objective": "LEAD_GENERATION | CONVERSIONS | TRAFFIC | BRAND_AWARENESS | REACH | MESSAGES | VIDEO_VIEWS",
    "status": "PAUSED",
    "reasoning": "Explicação do objetivo escolhido"
  },
  "ad_set": {
    "name": "Nome do ad set",
    "daily_budget_brl": 50,
    "optimization_goal": "LEAD_GENERATION | CONVERSIONS | REACH | IMPRESSIONS | LINK_CLICKS | MESSAGES",
    "age_min": 25,
    "age_max": 55,
    "genders": [],
    "geo_description": "Descrição do público geográfico (ex: São Paulo e Grande SP)",
    "countries": ["BR"],
    "reasoning": "Explicação da segmentação"
  },
  "creative": {
    "primary_text": "Texto principal do anúncio (até 125 chars)",
    "headline": "Título chamativo (até 40 chars)",
    "description": "Subtítulo curto (até 30 chars)",
    "call_to_action": "LEARN_MORE | SIGN_UP | CONTACT_US | GET_QUOTE | SUBSCRIBE | BOOK_NOW | SHOP_NOW",
    "website_url": "https://",
    "reasoning": "Justificativa do criativo"
  },
  "ad": {
    "name": "Nome do anúncio",
    "status": "PAUSED"
  },
  "summary": "Resumo executivo do plano em 2 frases"
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content.find(b => b.type === 'text')?.text || ''
    // Extrai JSON mesmo se vier com markdown
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Claude não retornou JSON válido' }, { status: 500 })

    const plan = JSON.parse(jsonMatch[0])
    return NextResponse.json({ plan, pages })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
