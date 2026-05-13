// app/api/meta/campaign/create/route.ts
// Executa a criação real via tool_use loop + SSE streaming
import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const META_BASE = 'https://graph.facebook.com/v19.0'

// ── Helpers ────────────────────────────────────────────────────────────────────
async function metaPost(path: string, params: Record<string, string>, token: string) {
  const body = new URLSearchParams({ ...params, access_token: token })
  const res  = await fetch(`${META_BASE}/${path}`, { method: 'POST', body })
  return res.json()
}

// ── Tool definitions ───────────────────────────────────────────────────────────
const TOOLS: Anthropic.Tool[] = [
  {
    name: 'create_campaign',
    description: 'Cria a campanha no Meta Ads. Sempre chame primeiro.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name:      { type: 'string' },
        objective: { type: 'string', enum: ['LEAD_GENERATION','CONVERSIONS','TRAFFIC','BRAND_AWARENESS','REACH','MESSAGES','VIDEO_VIEWS'] },
        status:    { type: 'string', enum: ['ACTIVE','PAUSED'] },
      },
      required: ['name','objective','status'],
    },
  },
  {
    name: 'create_ad_set',
    description: 'Cria o ad set com orçamento e segmentação. Chame após create_campaign.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name:              { type: 'string' },
        campaign_id:       { type: 'string' },
        daily_budget_brl:  { type: 'number', description: 'Orçamento diário em BRL (ex: 50 para R$50)' },
        optimization_goal: { type: 'string', enum: ['LEAD_GENERATION','CONVERSIONS','REACH','IMPRESSIONS','LINK_CLICKS','MESSAGES'] },
        age_min:           { type: 'number' },
        age_max:           { type: 'number' },
        genders:           { type: 'array', items: { type: 'number' }, description: '[] = todos, [1] = masculino, [2] = feminino' },
        countries:         { type: 'array', items: { type: 'string' }, description: 'Ex: ["BR"]' },
      },
      required: ['name','campaign_id','daily_budget_brl','optimization_goal','age_min','age_max'],
    },
  },
  {
    name: 'create_ad_creative',
    description: 'Cria o criativo do anúncio. Chame após create_ad_set.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name:         { type: 'string' },
        page_id:      { type: 'string', description: 'ID da Página do Facebook' },
        primary_text: { type: 'string', description: 'Texto principal (até 125 chars)' },
        headline:     { type: 'string', description: 'Título (até 40 chars)' },
        description:  { type: 'string', description: 'Descrição (até 30 chars)' },
        website_url:  { type: 'string' },
        call_to_action: { type: 'string', enum: ['LEARN_MORE','SIGN_UP','CONTACT_US','GET_QUOTE','SUBSCRIBE','BOOK_NOW','SHOP_NOW'] },
        image_url:    { type: 'string', description: 'URL pública da imagem (opcional)' },
      },
      required: ['name','page_id','primary_text','headline','website_url','call_to_action'],
    },
  },
  {
    name: 'create_ad',
    description: 'Cria o anúncio final. Chame por último.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name:        { type: 'string' },
        adset_id:    { type: 'string' },
        creative_id: { type: 'string' },
        status:      { type: 'string', enum: ['ACTIVE','PAUSED'] },
      },
      required: ['name','adset_id','creative_id','status'],
    },
  },
]

// ── Tool executor ──────────────────────────────────────────────────────────────
async function executeTool(name: string, input: Record<string, any>, accountId: string, token: string): Promise<string> {
  const actId = accountId.startsWith('act_') ? accountId : `act_${accountId}`

  try {
    if (name === 'create_campaign') {
      const data = await metaPost(`${actId}/campaigns`, {
        name:                   input.name,
        objective:              input.objective,
        status:                 input.status,
        special_ad_categories:  '[]',
      }, token)
      if (data.error) return JSON.stringify({ error: data.error.message })
      return JSON.stringify({ success: true, campaign_id: data.id })
    }

    if (name === 'create_ad_set') {
      const targeting = JSON.stringify({
        age_min:       input.age_min  || 18,
        age_max:       input.age_max  || 65,
        ...(input.genders?.length ? { genders: input.genders } : {}),
        geo_locations: { countries: input.countries?.length ? input.countries : ['BR'] },
      })
      const data = await metaPost(`${actId}/adsets`, {
        name:              input.name,
        campaign_id:       input.campaign_id,
        daily_budget:      String(Math.round((input.daily_budget_brl || 50) * 100)),
        billing_event:     'IMPRESSIONS',
        optimization_goal: input.optimization_goal,
        bid_strategy:      'LOWEST_COST_WITHOUT_CAP',
        targeting,
        status:            'PAUSED',
      }, token)
      if (data.error) return JSON.stringify({ error: data.error.message })
      return JSON.stringify({ success: true, adset_id: data.id })
    }

    if (name === 'create_ad_creative') {
      const linkData: Record<string, any> = {
        message:         input.primary_text,
        link:            input.website_url,
        name:            input.headline,
        description:     input.description || '',
        call_to_action:  { type: input.call_to_action, value: { link: input.website_url } },
      }
      if (input.image_url) linkData.picture = input.image_url

      const data = await metaPost(`${actId}/adcreatives`, {
        name:               input.name,
        object_story_spec:  JSON.stringify({ page_id: input.page_id, link_data: linkData }),
      }, token)
      if (data.error) return JSON.stringify({ error: data.error.message })
      return JSON.stringify({ success: true, creative_id: data.id })
    }

    if (name === 'create_ad') {
      const data = await metaPost(`${actId}/ads`, {
        name:      input.name,
        adset_id:  input.adset_id,
        creative:  JSON.stringify({ creative_id: input.creative_id }),
        status:    input.status,
      }, token)
      if (data.error) return JSON.stringify({ error: data.error.message })
      return JSON.stringify({ success: true, ad_id: data.id })
    }

    return JSON.stringify({ error: 'Tool desconhecida' })
  } catch (e: any) {
    return JSON.stringify({ error: e.message })
  }
}

// ── Route ──────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return new Response('Não autenticado', { status: 401 })
  }

  const { plan, accessToken, accountId, pageId } = await req.json()
  if (!plan || !accessToken || !accountId || !pageId) {
    return new Response('Dados incompletos', { status: 400 })
  }

  const encoder = new TextEncoder()
  const stream  = new TransformStream()
  const writer  = stream.writable.getWriter()

  const send = (data: object) => {
    writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
  }

  // Roda o loop de tool_use em background
  ;(async () => {
    try {
      const systemPrompt = `Você é um especialista em Meta Ads que está criando uma campanha.
Você tem acesso à Página do Facebook com ID: ${pageId}.
Execute as tools na ordem: create_campaign → create_ad_set → create_ad_creative → create_ad.
Use exatamente os parâmetros do plano fornecido, ajustando apenas o necessário.
Ao final, confirme o que foi criado com um resumo amigável em português.`

      const userMsg = `Crie a campanha com base neste plano:
${JSON.stringify(plan, null, 2)}`

      let messages: Anthropic.MessageParam[] = [
        { role: 'user', content: userMsg },
      ]

      let iterations = 0
      while (iterations < 10) {
        iterations++
        const response = await anthropic.messages.create({
          model:      'claude-sonnet-4-6',
          max_tokens: 2048,
          system:     systemPrompt,
          tools:      TOOLS,
          messages,
        })

        // Coleta tool calls e texto
        const toolUses: Anthropic.ToolUseBlock[]  = []
        let   summaryText = ''

        for (const block of response.content) {
          if (block.type === 'text')     summaryText = block.text
          if (block.type === 'tool_use') toolUses.push(block)
        }

        if (response.stop_reason === 'end_turn') {
          send({ type: 'done', summary: summaryText })
          break
        }

        if (response.stop_reason === 'tool_use' && toolUses.length > 0) {
          const toolResults: Anthropic.ToolResultBlockParam[] = []

          for (const tu of toolUses) {
            send({ type: 'tool_call', tool: tu.name, input: tu.input })

            const resultStr = await executeTool(tu.name, tu.input as Record<string, any>, accountId, accessToken)
            const result    = JSON.parse(resultStr)

            send({ type: 'tool_result', tool: tu.name, result })

            if (result.error) {
              send({ type: 'error', message: `Erro em ${tu.name}: ${result.error}` })
              writer.close()
              return
            }

            toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: resultStr })
          }

          messages = [
            ...messages,
            { role: 'assistant', content: response.content },
            { role: 'user',      content: toolResults },
          ]
        }
      }
    } catch (e: any) {
      send({ type: 'error', message: e.message })
    } finally {
      writer.close()
    }
  })()

  return new Response(stream.readable, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  })
}
