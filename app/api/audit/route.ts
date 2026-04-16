// app/api/audit/route.ts — Auditoria de contas Meta + Google Ads com IA
import { NextRequest, NextResponse } from 'next/server'
import { getBenchmark, getBenchmarkSummary } from '@/lib/niche_benchmarks'

function buildFallbackAudit(
  clientName: string,
  niche: string,
  metaTotals: Record<string, any> | null,
  googleTotals: Record<string, any> | null,
  metaCampaigns: any[],
  googleCampaigns: any[],
  bench: NonNullable<ReturnType<typeof getBenchmark>>
) {
  const totalSpend = (metaTotals?.spend || 0) + (googleTotals?.spend || 0)
  const totalLeads = (metaTotals?.leads || 0) + (googleTotals?.leads || 0)
  const realCPL    = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0
  const benchCPL   = Math.round((bench.cpl_min + bench.cpl_max) / 2)

  const cplDiff = realCPL > 0 ? ((realCPL - benchCPL) / benchCPL) * 100 : 0
  const wastedEstimate = cplDiff > 0 ? Math.round(totalSpend * (cplDiff / 100) * 0.5) : 0

  let score = 70
  if (realCPL > 0 && realCPL <= bench.cpl_min) score = 90
  else if (realCPL > 0 && realCPL <= bench.cpl_max) score = 75
  else if (realCPL > bench.cpl_max) score = 50

  const grade = score >= 85 ? 'A' : score >= 70 ? 'B+' : score >= 55 ? 'B' : score >= 40 ? 'C+' : 'C'

  const pausedMeta   = metaCampaigns.filter((c) => c.status !== 'ACTIVE').length
  const pausedGoogle = googleCampaigns.filter((c) => c.status !== 'ENABLED' && c.status !== 'ACTIVE').length

  return {
    health_score: score,
    grade,
    summary: `A conta de ${clientName} (${niche}) apresenta CPL real de R$${realCPL} vs benchmark do nicho de R$${bench.cpl_min}–${bench.cpl_max}. ${score >= 75 ? 'Performance dentro do esperado.' : 'Há oportunidades claras de otimização.'}`,
    wasted_spend: {
      estimated: wastedEstimate,
      percentage: Math.round(cplDiff > 0 ? Math.min(cplDiff * 0.5, 40) : 5),
      main_causes: [
        'Campanhas com CPL acima do benchmark do nicho',
        pausedMeta + pausedGoogle > 0 ? `${pausedMeta + pausedGoogle} campanhas pausadas consumindo orçamento residual` : 'Segmentação de público pode estar ampla demais',
        'Criativos sem rotação podem estar com fadiga',
      ],
    },
    critical_issues: [
      realCPL > bench.cpl_max
        ? { severity: 'alta', issue: 'CPL acima do benchmark', detail: `CPL atual R$${realCPL} está ${Math.round(cplDiff)}% acima do máximo do nicho (R$${bench.cpl_max}).`, action: 'Revisar segmentação de público e criativos imediatamente.' }
        : { severity: 'media', issue: 'Monitorar CPL continuamente', detail: `CPL atual R$${realCPL} dentro do benchmark R$${bench.cpl_min}–${bench.cpl_max}.`, action: 'Implementar alertas automáticos de CPL para evitar desvios.' },
      {
        severity: 'media',
        issue: 'Rastreamento de conversões',
        detail: 'Verificar se pixel Meta e tag Google estão disparando em todos os eventos de conversão.',
        action: 'Auditar eventos no Meta Events Manager e Google Tag Assistant.',
      },
    ],
    quick_wins: [
      { title: `Escalar ${bench.best_channels[0]}`, description: `Canal com melhor histórico para ${niche}. Aumentar budget em 20% e monitorar CPL por 7 dias.`, impact: 'Alto', effort: 'Baixo' },
      { title: 'Pausar campanhas de baixo desempenho', description: `Identificar campanhas com CPL > R$${bench.cpl_max} e pausar para redirecionar verba.`, impact: 'Alto', effort: 'Baixo' },
      { title: 'Teste A/B de criativos', description: `No nicho ${niche}, novos criativos a cada 15 dias evitam fadiga e mantêm CTR elevado.`, impact: 'Médio', effort: 'Médio' },
      { title: 'Remarketing para leads quentes', description: 'Criar audiência customizada dos últimos 30 dias para remarketing com oferta diferente.', impact: 'Médio', effort: 'Baixo' },
    ],
    meta_analysis: metaTotals
      ? {
          spend: metaTotals.spend,
          leads: metaTotals.leads,
          cpl: metaTotals.cpl,
          roas: metaTotals.roas,
          ctr: metaTotals.ctr,
          status: metaTotals.cpl <= bench.cpl_max ? 'bom' : 'atenção',
          insights: [
            `${metaCampaigns.length} campanhas ativas no período`,
            metaTotals.ctr < 1.5 ? 'CTR abaixo de 1.5% — criativos precisam de revisão' : `CTR de ${metaTotals.ctr}% — acima da média`,
            metaTotals.roas > 0 ? `ROAS de ${metaTotals.roas}× ${metaTotals.roas >= bench.kpi_thresholds.roas_good ? '— dentro do benchmark' : '— abaixo do benchmark'}` : 'ROAS não calculado — verificar rastreamento de receita',
          ],
        }
      : null,
    google_analysis: googleTotals
      ? {
          spend: googleTotals.spend,
          leads: googleTotals.leads,
          cpl: googleTotals.cpl,
          roas: googleTotals.roas,
          ctr: googleTotals.ctr,
          status: googleTotals.cpl <= bench.cpl_max ? 'bom' : 'atenção',
          insights: [
            `${googleCampaigns.length} campanhas ativas no período`,
            googleTotals.ctr < 2 ? 'CTR abaixo de 2% para Search — revisar palavras-chave e anúncios' : `CTR de ${googleTotals.ctr}% — saudável`,
            googleTotals.roas > 0 ? `ROAS de ${googleTotals.roas}×` : 'ROAS não calculado — verificar conversões no Google Ads',
          ],
        }
      : null,
    benchmark: {
      cpl_min: bench.cpl_min,
      cpl_max: bench.cpl_max,
      roas_good: bench.kpi_thresholds.roas_good,
      best_channels: bench.best_channels,
      insights: bench.insights,
    },
    recommendations: [
      { priority: 1, channel: bench.best_channels[0] || 'Meta Ads', action: `Concentrar 40% do budget em ${bench.best_channels[0]} com segmentação refinada`, expected_result: `CPL próximo de R$${bench.cpl_min}` },
      { priority: 2, channel: 'Criativos', action: 'Criar 3–5 novos criativos com dores específicas do público', expected_result: 'CTR +30–50%' },
      { priority: 3, channel: 'Remarketing', action: 'Implementar funil de remarketing em 3 camadas (visitantes, leads, prospects)', expected_result: 'Taxa de conversão +20%' },
    ],
    generated_at: new Date().toISOString(),
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      clientName,
      niche,
      metaCampaigns = [],
      metaTotals = null,
      googleCampaigns = [],
      googleTotals = null,
    } = body

    if (!clientName || !niche) {
      return NextResponse.json({ success: false, error: 'clientName e niche são obrigatórios.' }, { status: 400 })
    }

    const hasMeta   = metaTotals !== null || metaCampaigns.length > 0
    const hasGoogle = googleTotals !== null || googleCampaigns.length > 0

    if (!hasMeta && !hasGoogle) {
      return NextResponse.json({ success: false, error: 'Conecte pelo menos uma conta de anúncios antes de auditar.' }, { status: 400 })
    }

    const bench = getBenchmark(niche)
    const benchmarkText = getBenchmarkSummary(niche)

    const totalSpend = (metaTotals?.spend || 0) + (googleTotals?.spend || 0)
    const totalLeads = (metaTotals?.leads || 0) + (googleTotals?.leads || 0)
    const realCPL    = totalLeads > 0 ? (totalSpend / totalLeads).toFixed(2) : '0'

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (apiKey) {
      try {
        const { default: Anthropic } = await import('@anthropic-ai/sdk')
        const anthropic = new Anthropic({ apiKey })

        const metaSummary = hasMeta
          ? `META ADS:
- Gasto: R$${metaTotals?.spend?.toFixed(2) || 0}
- Impressões: ${metaTotals?.impressions?.toLocaleString('pt-BR') || 0}
- Cliques: ${metaTotals?.clicks || 0} (CTR ${metaTotals?.ctr || 0}%)
- Leads: ${metaTotals?.leads || 0}
- CPL: R$${metaTotals?.cpl || 0}
- ROAS: ${metaTotals?.roas || 0}×
- Campanhas (${metaCampaigns.length}):
${metaCampaigns.slice(0, 10).map((c: any) => `  • ${c.name} | Status: ${c.status} | Gasto: R$${c.spend} | Leads: ${c.leads} | CPL: R$${c.cpl} | CTR: ${c.ctr}%`).join('\n')}`
          : 'META ADS: não conectado'

        const googleSummary = hasGoogle
          ? `GOOGLE ADS:
- Gasto: R$${googleTotals?.spend?.toFixed(2) || 0}
- Impressões: ${googleTotals?.impressions?.toLocaleString('pt-BR') || 0}
- Cliques: ${googleTotals?.clicks || 0} (CTR ${googleTotals?.ctr || 0}%)
- Leads/Conversões: ${googleTotals?.leads || 0}
- CPL: R$${googleTotals?.cpl || 0}
- ROAS: ${googleTotals?.roas || 0}×
- Campanhas (${googleCampaigns.length}):
${googleCampaigns.slice(0, 10).map((c: any) => `  • ${c.name} | Status: ${c.status} | Gasto: R$${c.spend} | Leads: ${c.leads} | CPL: R$${c.cpl} | CTR: ${c.ctr}%`).join('\n')}`
          : 'GOOGLE ADS: não conectado'

        const prompt = `Você é um especialista sênior em auditoria de campanhas de tráfego pago no mercado brasileiro. Faça uma auditoria completa e cirúrgica das contas de anúncios abaixo.

CLIENTE: ${clientName}
NICHO: ${niche}
PERÍODO ANALISADO: últimos 30 dias

DADOS REAIS DAS CONTAS:
${metaSummary}

${googleSummary}

TOTAIS CONSOLIDADOS:
- Gasto total: R$${totalSpend.toFixed(2)}
- Total de leads: ${totalLeads}
- CPL médio real: R$${realCPL}

${benchmarkText ? `BENCHMARK DO NICHO (${niche}):\n${benchmarkText}` : ''}

Com base nesses dados REAIS, gere uma auditoria profissional. Seja específico, use os números fornecidos. Identifique desperdícios reais e oportunidades concretas.

Responda APENAS com JSON válido:

{
  "health_score": <0-100>,
  "grade": "<A+|A|B+|B|C+|C|D>",
  "summary": "<resumo executivo em 2-3 frases com números reais>",
  "wasted_spend": {
    "estimated": <valor em R$ estimado de verba desperdiçada>,
    "percentage": <% do total gasto estimado como desperdício>,
    "main_causes": ["<causa 1>", "<causa 2>", "<causa 3>"]
  },
  "critical_issues": [
    {
      "severity": "<alta|media|baixa>",
      "issue": "<problema identificado>",
      "detail": "<detalhes com números reais>",
      "action": "<ação corretiva imediata>"
    }
  ],
  "quick_wins": [
    {
      "title": "<ação rápida>",
      "description": "<como implementar>",
      "impact": "<Alto|Médio|Baixo>",
      "effort": "<Alto|Médio|Baixo>"
    }
  ],
  "meta_analysis": ${hasMeta ? `{
    "spend": ${metaTotals?.spend || 0},
    "leads": ${metaTotals?.leads || 0},
    "cpl": ${metaTotals?.cpl || 0},
    "roas": ${metaTotals?.roas || 0},
    "ctr": ${metaTotals?.ctr || 0},
    "status": "<bom|atenção|crítico>",
    "insights": ["<insight 1 com dados reais>", "<insight 2>", "<insight 3>"]
  }` : 'null'},
  "google_analysis": ${hasGoogle ? `{
    "spend": ${googleTotals?.spend || 0},
    "leads": ${googleTotals?.leads || 0},
    "cpl": ${googleTotals?.cpl || 0},
    "roas": ${googleTotals?.roas || 0},
    "ctr": ${googleTotals?.ctr || 0},
    "status": "<bom|atenção|crítico>",
    "insights": ["<insight 1 com dados reais>", "<insight 2>", "<insight 3>"]
  }` : 'null'},
  "benchmark": {
    "cpl_min": ${bench?.cpl_min || 0},
    "cpl_max": ${bench?.cpl_max || 0},
    "roas_good": ${bench?.kpi_thresholds?.roas_good || 3},
    "best_channels": ${JSON.stringify(bench?.best_channels || [])},
    "insights": ${JSON.stringify(bench?.insights || [])}
  },
  "recommendations": [
    {
      "priority": 1,
      "channel": "<canal>",
      "action": "<ação específica com números>",
      "expected_result": "<resultado esperado>"
    }
  ]
}`

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 3000,
          messages: [{ role: 'user', content: prompt }],
        })

        const raw = (message.content[0] as any).text.trim()
        const jsonStr = raw.startsWith('```')
          ? raw.split('```')[1].replace(/^json\n/, '')
          : raw

        const audit = JSON.parse(jsonStr)
        audit.generated_at = new Date().toISOString()

        return NextResponse.json({ success: true, audit, source: 'ai' })

      } catch (aiError: any) {
        console.warn('Anthropic API falhou na auditoria, usando fallback:', aiError.message)
      }
    }

    // Fallback por benchmark
    if (!bench) {
      return NextResponse.json(
        { success: false, error: 'Nicho não reconhecido e API indisponível.' },
        { status: 400 }
      )
    }

    const audit = buildFallbackAudit(
      clientName, niche, metaTotals, googleTotals,
      metaCampaigns, googleCampaigns, bench
    )
    return NextResponse.json({ success: true, audit, source: 'benchmark' })

  } catch (error: any) {
    console.error('Audit route error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
