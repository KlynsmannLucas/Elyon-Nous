// app/api/action-plan/route.ts — Plano de ações consolidado com IA
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

    const body = await req.json()
    const { clientData, strategyData, auditData } = body

    if (!clientData) return NextResponse.json({ success: false, error: 'Dados do cliente obrigatórios.' }, { status: 400 })

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ success: false, error: 'API indisponível.' }, { status: 503 })

    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const anthropic = new Anthropic({ apiKey })

    // Monta contexto disponível
    const strategyCtx = strategyData?.strategy
      ? `=== ESTRATÉGIA GERADA ===
Posicionamento: ${strategyData.strategy.positioning || ''}
Canal principal: ${strategyData.strategy.primaryChannel || ''}
Meta ROAS: ${strategyData.strategy.targetROAS || ''}
Objetivos: ${JSON.stringify(strategyData.strategy.objectives || {})}`
      : ''

    const auditCtx = auditData
      ? `=== RESULTADO DA AUDITORIA ===
Score: ${auditData.health_score}/100 (${auditData.grade})
Resumo executivo: ${auditData.executive_summary || ''}

Gargalos principais:
${(auditData.gargalos || []).map((g: any) => `  [${g.rank}] ${g.titulo}: ${g.descricao} — Impacto: ${g.impacto}`).join('\n')}

Plano de ação da auditoria:
Curto prazo: ${(auditData.plano_acao?.curto || []).map((a: any) => `${a.acao}`).join('; ')}
Médio prazo: ${(auditData.plano_acao?.medio || []).map((a: any) => `${a.acao}`).join('; ')}
Longo prazo: ${(auditData.plano_acao?.longo || []).map((a: any) => `${a.acao}`).join('; ')}

Oportunidades: ${(auditData.oportunidades || []).map((o: any) => `${o.titulo} — ${o.potencial}`).join('; ')}`
      : ''

    const prompt = `Você é um consultor sênior de tráfego pago e growth. Com base nos dados abaixo, crie um PLANO DE AÇÕES CONSOLIDADO e priorizado para o cliente.

=== DADOS DO CLIENTE ===
Cliente: ${clientData.clientName}
Nicho: ${clientData.niche}
Investimento mensal: R$${clientData.budget}
Objetivo: ${clientData.objective || ''}

${strategyCtx}

${auditCtx}

=== INSTRUÇÕES ===
Gere entre 8 e 15 ações concretas, priorizadas, sem repetição e sem genéricos.
Cada ação deve ser ESPECÍFICA para este cliente/nicho — cite números, plataformas e situações reais quando disponível.
Agrupe em prioridades reais: crítico (bloqueia resultado agora), alto (impacto imediato), médio (escala), baixo (otimização futura).

Responda APENAS com JSON válido (array), sem markdown:
[
  {
    "prioridade": "critica" | "alta" | "media" | "baixa",
    "categoria": "Tracking" | "Criativos" | "Audiências" | "Funil" | "Escala" | "Estrutura" | "Orçamento",
    "titulo": "<ação concreta em até 8 palavras>",
    "descricao": "<o que fazer e por quê — com dados reais se disponíveis>",
    "como": "<passo a passo resumido de execução>",
    "impacto": "<resultado esperado em % ou R$>",
    "prazo": "Imediato" | "7 dias" | "30 dias" | "90 dias"
  }
]`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (message.content[0] as any).text.trim()
    const jsonStr = raw.startsWith('```') ? raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '') : raw
    const items = JSON.parse(jsonStr)

    // Adiciona id e status padrão
    const actions = items.map((item: any, i: number) => ({
      ...item,
      id: `${Date.now()}_${i}`,
      status: 'pendente',
    }))

    return NextResponse.json({ success: true, actions })

  } catch (error: any) {
    console.error('Action plan error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
