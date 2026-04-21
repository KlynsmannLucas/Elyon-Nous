// app/api/action-plan/route.ts — Plano de ações consolidado com IA
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

    const body = await req.json()
    const { clientData, strategyData, auditData, metaIntelData } = body

    if (!clientData) return NextResponse.json({ success: false, error: 'Dados do cliente obrigatórios.' }, { status: 400 })

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ success: false, error: 'API indisponível.' }, { status: 503 })

    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const anthropic = new Anthropic({ apiKey })

    const strategyCtx = strategyData?.strategy
      ? `=== ESTRATÉGIA GERADA ===
Posicionamento: ${strategyData.strategy.positioning || ''}
Canal principal: ${strategyData.strategy.primaryChannel || ''}
Meta ROAS: ${strategyData.strategy.targetROAS || ''}
Objetivos: ${JSON.stringify(strategyData.strategy.objectives || {})}`
      : ''

    const auditCtx = auditData?.health_score
      ? `=== AUDITORIA GERAL ===
Score: ${auditData.health_score}/100 (${auditData.grade})
Resumo: ${auditData.executive_summary || ''}
Gargalos: ${(auditData.gargalos || []).map((g: any) => `${g.titulo}: ${g.descricao}`).join('; ')}`
      : ''

    // Rich context from Meta Intelligence: real campaigns, CPLs, frequencies
    const metaCtx = metaIntelData
      ? (() => {
          const t = metaIntelData.totals
          const topCampaigns = (metaIntelData.campaigns || [])
            .sort((a: any, b: any) => b.spend30 - a.spend30)
            .slice(0, 8)
            .map((c: any) => {
              const parts = [`"${c.name}" — R$${c.spend30.toFixed(0)} investido`]
              if (c.leads30 > 0)    parts.push(`${c.leads30} leads (CPL R$${c.cpl30})`)
              if (c.messages30 > 0) parts.push(`${c.messages30} msgs WhatsApp`)
              if (c.roas30 > 0)     parts.push(`ROAS ${c.roas30}×`)
              if (c.frequency > 0)  parts.push(`freq ${c.frequency}×`)
              if (c.ctr30 > 0)      parts.push(`CTR ${c.ctr30}%`)
              parts.push(`status: ${c.status === 'PAUSED' ? 'PAUSADA' : 'ATIVA'}`)
              if (c.issues.length > 0) parts.push(`problemas: ${c.issues.join(', ')}`)
              return '  - ' + parts.join(' · ')
            })
            .join('\n')

          const wasteC = (metaIntelData.campaigns || []).filter((c: any) =>
            c.spend30 > 300 && c.leads30 === 0 && c.revenue30 === 0 && c.messages30 === 0)
          const highFreqC = (metaIntelData.campaigns || []).filter((c: any) => c.frequency > 4 && c.spend30 > 200)
          const limitedC  = (metaIntelData.campaigns || []).filter((c: any) => c.learningPhase === 'learning_limited')

          return `=== META ADS — DADOS REAIS DA CONTA ===
Score da conta: ${metaIntelData.score}/100 (${metaIntelData.scoreGrade})
Total investido (30d): R$${t.spend?.toFixed(0) || 0}
Total de leads: ${t.leads || 0} (CPL médio: R$${t.cpl || 0})
Conversas WhatsApp: ${t.messages || 0}
ROAS médio: ${t.roas > 0 ? `${t.roas}×` : 'sem receita rastreada'}
CTR médio: ${t.avgCTR}%
Frequência média: ${t.avgFrequency}×
Campanhas ativas: ${t.activeCampaigns} de ${t.totalCampaigns}
${limitedC.length > 0 ? `Campanhas com aprendizado limitado: ${limitedC.map((c: any) => c.name).join(', ')}` : ''}
${wasteC.length > 0 ? `Campanhas sem conversão (desperdício R$${wasteC.reduce((s: number, c: any) => s + c.spend30, 0).toFixed(0)}): ${wasteC.map((c: any) => c.name).join(', ')}` : ''}
${highFreqC.length > 0 ? `Campanhas com fadiga (freq >4×): ${highFreqC.map((c: any) => `${c.name} (${c.frequency}×)`).join(', ')}` : ''}

Top campanhas por investimento:
${topCampaigns}

Alertas globais da IA:
${(metaIntelData.globalRecs || []).map((r: any) => `  [${r.type.toUpperCase()}] ${r.title}: ${r.description}`).join('\n')}`
        })()
      : ''

    const prompt = `Você é um consultor sênior de tráfego pago e growth. Com base nos dados REAIS abaixo, crie um PLANO DE AÇÕES CONSOLIDADO e priorizado para o cliente.

=== DADOS DO CLIENTE ===
Cliente: ${clientData.clientName}
Nicho: ${clientData.niche}
Investimento mensal configurado: R$${clientData.budget}
Objetivo: ${clientData.objective || ''}
${clientData.currentCPL ? `CPL atual reportado pelo cliente: R$${clientData.currentCPL}` : ''}
${clientData.mainChallenge ? `Principal desafio: ${clientData.mainChallenge}` : ''}

${metaCtx}

${strategyCtx}

${auditCtx}

=== INSTRUÇÕES ===
Gere entre 8 e 15 ações concretas, priorizadas, sem repetição e sem genéricos.
CITE campanhas, valores e métricas REAIS dos dados acima (ex: "Pausar campanha X que gastou R$Y sem conversão", "Renovar criativos nas campanhas com freq >4×").
Agrupe em prioridades reais: crítico (bloqueia resultado agora), alto (impacto imediato), médio (escala), baixo (otimização futura).
Cada ação deve ter impacto estimado em % ou R$ com base nos números reais informados.

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
      max_tokens: 8096,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (message.content[0] as any).text.trim()
    // Strip markdown fences if present
    const jsonStr = raw.startsWith('```')
      ? raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      : raw

    let items: any[]
    try {
      items = JSON.parse(jsonStr)
    } catch {
      // Try to extract a valid JSON array even if the response was slightly truncated
      const match = jsonStr.match(/^\s*(\[[\s\S]*\])\s*$/)
      if (match) {
        items = JSON.parse(match[1])
      } else {
        // Find the last complete object and close the array
        const lastComplete = jsonStr.lastIndexOf('},')
        if (lastComplete > 0) {
          items = JSON.parse(jsonStr.slice(0, lastComplete + 1) + ']')
        } else {
          throw new Error('Resposta da IA inválida — tente novamente.')
        }
      }
    }

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
