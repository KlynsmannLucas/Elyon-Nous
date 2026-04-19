// app/api/intelligence/route.ts — Insights personalizados por cliente usando IA
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getBenchmark, getBenchmarkSummary } from '@/lib/niche_benchmarks'

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

  try {
    const body = await req.json()
    const { clientName, niche, budget, objective, currentCPL, mainChallenge, strategy, campaignHistory } = body

    const bench = getBenchmark(niche)
    const benchmarkText = getBenchmarkSummary(niche)

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API não configurada.' }, { status: 500 })
    }

    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const anthropic = new Anthropic({ apiKey })

    const historySection = campaignHistory?.length > 0
      ? `\nHISTÓRICO REAL DE CAMPANHAS:\n${campaignHistory.map((c: any) =>
          `• ${c.channel} | CPL real: R$${c.cplReal} | Leads: ${c.leads} | Conversões: ${c.conversions} | ✓ Funcionou: ${c.whatWorked || '—'} | ✕ Falhou: ${c.whatFailed || '—'}`
        ).join('\n')}`
      : ''

    const prompt = `Você é um Head de Growth especializado em marketing digital no Brasil. Sua função é gerar insights táticos e acionáveis, específicos para este cliente — não insights genéricos de nicho.

DADOS DO CLIENTE:
- Nome: ${clientName}
- Nicho: ${niche}
- Budget mensal: R$${(budget || 0).toLocaleString('pt-BR')}
- Objetivo: ${objective || 'Gerar leads'}
- CPL atual: ${currentCPL ? `R$${currentCPL}` : 'Não informado'}
- Maior desafio: ${mainChallenge || 'Não informado'}
${historySection}

CANAIS RECOMENDADOS PELA ESTRATÉGIA: ${strategy?.recommended_channels_names?.join(', ') || 'Meta Ads, Google Ads'}
SCORE DA ESTRATÉGIA: ${strategy?.intelligence_score || 70}/100
${benchmarkText ? `\nBENCHMARKS DO NICHO:\n${benchmarkText}` : ''}

Gere 6 insights acionáveis e ESPECÍFICOS para este cliente — não genéricos. Cada insight deve:
- Ser baseado nos dados reais deste cliente (budget, CPL, desafio, histórico)
- Ter um título impactante e direto
- Ter uma descrição com números reais do nicho
- Ter 3-4 passos concretos de implementação

Categorias possíveis: "Processo", "Criativo", "Audiência", "Estratégia", "Sazonalidade", "Orçamento", "Conversão", "Retenção"

Cores por categoria (use exatamente):
- Processo: "#38BDF8"
- Criativo: "#A78BFA"
- Audiência: "#22C55E"
- Estratégia: "#F0B429"
- Sazonalidade: "#FB923C"
- Orçamento: "#F0B429"
- Conversão: "#22C55E"
- Retenção: "#A78BFA"

Responda APENAS com JSON válido:
{
  "insights": [
    {
      "icon": "<emoji relevante>",
      "title": "<título do insight — específico, com dado ou número>",
      "category": "<categoria>",
      "categoryColor": "<cor hex da categoria>",
      "description": "<descrição em 1-2 frases com dado real do nicho ou do cliente>",
      "steps": [
        "<passo concreto 1>",
        "<passo concreto 2>",
        "<passo concreto 3>",
        "<passo concreto 4>"
      ]
    }
  ]
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (message.content[0] as any).text.trim()
    const jsonStr = raw.startsWith('```')
      ? raw.split('```')[1].replace(/^json\n/, '')
      : raw

    const data = JSON.parse(jsonStr)
    return NextResponse.json({ success: true, insights: data.insights, source: 'ai' })

  } catch (error: any) {
    console.error('Intelligence route error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
