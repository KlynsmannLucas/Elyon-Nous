// app/api/audit/route.ts — Auditoria de campanhas com IA (contas conectadas + upload XLSX/CSV)
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getBenchmark, getBenchmarkSummary } from '@/lib/niche_benchmarks'

function buildFallbackAudit(
  clientName: string,
  niche: string,
  metaTotals: Record<string, any> | null,
  googleTotals: Record<string, any> | null,
  metaCampaigns: any[],
  googleCampaigns: any[],
  uploadedCampaigns: any[],
  bench: NonNullable<ReturnType<typeof getBenchmark>>
) {
  // Consolida campanhas de todas as fontes
  const allCampaigns = [...metaCampaigns, ...googleCampaigns, ...uploadedCampaigns]

  const totalSpend = allCampaigns.reduce((s, c) => s + (c.spend || 0), 0)
    || (metaTotals?.spend || 0) + (googleTotals?.spend || 0)
  const totalLeads = allCampaigns.reduce((s, c) => s + (c.leads || 0), 0)
    || (metaTotals?.leads || 0) + (googleTotals?.leads || 0)
  const realCPL    = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0
  const benchCPL   = Math.round((bench.cpl_min + bench.cpl_max) / 2)

  const cplDiff = realCPL > 0 ? ((realCPL - benchCPL) / benchCPL) * 100 : 0
  const wastedEstimate = cplDiff > 0 ? Math.round(totalSpend * (cplDiff / 100) * 0.5) : 0

  let score = 70
  if (realCPL > 0 && realCPL <= bench.cpl_min) score = 90
  else if (realCPL > 0 && realCPL <= bench.cpl_max) score = 75
  else if (realCPL > bench.cpl_max) score = 50

  const grade = score >= 85 ? 'A' : score >= 70 ? 'B+' : score >= 55 ? 'B' : score >= 40 ? 'C+' : 'C'

  // Identifica melhor e pior campanha pelos dados disponíveis
  const activeCamps = allCampaigns.filter((c) => c.leads > 0)
  const sorted = [...activeCamps].sort((a, b) => (a.cpl || 999) - (b.cpl || 999))
  const bestCamp = sorted[0]
  const worstCamps = sorted.slice(-2).reverse()

  return {
    health_score: score,
    grade,
    summary: `A conta de ${clientName} (${niche}) apresenta CPL real de R$${realCPL} vs benchmark do nicho de R$${bench.cpl_min}–${bench.cpl_max}. ${score >= 75 ? 'Performance dentro do esperado.' : 'Há oportunidades claras de otimização.'}`,
    wasted_spend: {
      estimated: wastedEstimate,
      percentage: Math.round(cplDiff > 0 ? Math.min(cplDiff * 0.5, 40) : 5),
      main_causes: [
        'Campanhas com CPL acima do benchmark do nicho',
        'Segmentação de público pode estar ampla demais',
        'Criativos sem rotação podem estar com fadiga',
      ],
    },
    urgent_actions: [
      realCPL > bench.cpl_max ? `Pausar campanhas com CPL acima de R$${bench.cpl_max} imediatamente` : `Implementar alertas automáticos de CPL — limite R$${bench.cpl_max}`,
      'Auditar pixel/tag de conversão — verificar se todos os eventos estão disparando',
      'Revisar segmentação: substituir interesses amplos por lookalike de clientes reais',
    ],
    budget_add: [
      { channel: bench.best_channels[0] || 'Meta Ads', reason: `Melhor canal histórico para ${niche} com menor CPL`, amount: 'Aumentar 20–30% do budget total' },
    ],
    budget_remove: worstCamps.length > 0 ? worstCamps.map((c) => ({
      campaign: c.name,
      reason: `CPL de R$${c.cpl} acima do benchmark R$${bench.cpl_max}`,
      amount: `Redirecionar verba para ${bench.best_channels[0]}`,
    })) : [
      { channel: 'Campanhas com CTR < 1%', reason: 'CTR baixo indica criativo com problema de relevância', amount: 'Pausar ou recriar criativo' },
    ],
    investment_map: bench.best_channels.slice(0, 3).map((ch: string, i: number) => ({
      channel: ch,
      allocation: i === 0 ? '40–50% do budget' : i === 1 ? '25–30% do budget' : '15–20% do budget',
      reason: `Canal com ${i === 0 ? 'melhor' : i === 1 ? 'segundo melhor' : 'terceiro melhor'} histórico para ${niche}`,
      expected_cpl: `R$${bench.cpl_min + i * 10}–${bench.cpl_max + i * 10}`,
    })),
    critical_issues: [
      realCPL > bench.cpl_max
        ? { severity: 'alta', issue: 'CPL acima do benchmark', detail: `CPL atual R$${realCPL} está ${Math.round(cplDiff)}% acima do máximo do nicho (R$${bench.cpl_max}).`, action: 'Revisar segmentação de público e criativos imediatamente.' }
        : { severity: 'media', issue: 'Monitorar CPL continuamente', detail: `CPL atual R$${realCPL} dentro do benchmark R$${bench.cpl_min}–${bench.cpl_max}.`, action: 'Implementar alertas automáticos de CPL para evitar desvios.' },
      { severity: 'media', issue: 'Rastreamento de conversões', detail: 'Verificar se pixel Meta e tag Google estão disparando em todos os eventos de conversão.', action: 'Auditar eventos no Meta Events Manager e Google Tag Assistant.' },
    ],
    campaign_ranking: {
      best_campaign: bestCamp ? {
        name: bestCamp.name,
        reason: `CPL mais baixo (R$${bestCamp.cpl}) com ${bestCamp.leads} leads gerados`,
        metrics: { 'CPL': `R$${bestCamp.cpl}`, 'Leads': bestCamp.leads, 'Gasto': `R$${Math.round(bestCamp.spend)}` },
      } : null,
      best_ad: null,
      best_placement: { name: 'Feed Mobile', reason: `Historicamente o posicionamento com menor CPL para ${niche} no Meta Ads` },
      worst_campaigns: worstCamps.map((c) => ({ name: c.name, reason: `CPL de R$${c.cpl} acima do benchmark` })),
    },
    cpr_assessment: activeCamps.slice(0, 5).map((c) => ({
      campaign: c.name,
      cpl: c.cpl,
      detail: `${c.leads} leads · R$${Math.round(c.spend)} gasto`,
      status: c.cpl <= bench.cpl_min ? 'bom' : c.cpl <= bench.cpl_max ? 'atenção' : 'crítico',
      vs_benchmark: c.cpl <= bench.cpl_min ? `${Math.round(((bench.cpl_max - c.cpl) / bench.cpl_max) * 100)}% abaixo` : c.cpl <= bench.cpl_max ? 'Dentro do limite' : `${Math.round(((c.cpl - bench.cpl_max) / bench.cpl_max) * 100)}% acima`,
    })),
    quick_wins: [
      { title: `Escalar ${bench.best_channels[0]}`, description: `Canal com melhor histórico para ${niche}. Aumentar budget em 20% e monitorar CPL por 7 dias.`, impact: 'Alto', effort: 'Baixo' },
      { title: 'Pausar campanhas de baixo desempenho', description: `Identificar campanhas com CPL > R$${bench.cpl_max} e pausar para redirecionar verba.`, impact: 'Alto', effort: 'Baixo' },
      { title: 'Teste A/B de criativos', description: `No nicho ${niche}, novos criativos a cada 15 dias evitam fadiga e mantêm CTR elevado.`, impact: 'Médio', effort: 'Médio' },
      { title: 'Remarketing para leads quentes', description: 'Criar audiência customizada dos últimos 30 dias para remarketing com oferta diferente.', impact: 'Médio', effort: 'Baixo' },
    ],
    meta_analysis: metaTotals ? {
      spend: metaTotals.spend, leads: metaTotals.leads, cpl: metaTotals.cpl,
      roas: metaTotals.roas, ctr: metaTotals.ctr,
      status: metaTotals.cpl <= bench.cpl_max ? 'bom' : 'atenção',
      insights: [
        `${metaCampaigns.length} campanhas no período`,
        metaTotals.ctr < 1.5 ? 'CTR abaixo de 1.5% — criativos precisam de revisão' : `CTR de ${metaTotals.ctr}% — acima da média`,
        metaTotals.roas > 0 ? `ROAS ${metaTotals.roas}× ${metaTotals.roas >= bench.kpi_thresholds.roas_good ? '— dentro do benchmark' : '— abaixo do benchmark'}` : 'ROAS não calculado — verificar rastreamento',
      ],
    } : null,
    google_analysis: googleTotals ? {
      spend: googleTotals.spend, leads: googleTotals.leads, cpl: googleTotals.cpl,
      roas: googleTotals.roas, ctr: googleTotals.ctr,
      status: googleTotals.cpl <= bench.cpl_max ? 'bom' : 'atenção',
      insights: [
        `${googleCampaigns.length} campanhas no período`,
        googleTotals.ctr < 2 ? 'CTR abaixo de 2% — revisar palavras-chave e anúncios' : `CTR de ${googleTotals.ctr}% — saudável`,
        googleTotals.roas > 0 ? `ROAS ${googleTotals.roas}×` : 'ROAS não calculado — verificar conversões',
      ],
    } : null,
    benchmark: {
      cpl_min: bench.cpl_min, cpl_max: bench.cpl_max,
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
    // Auth check — sempre lê do Clerk diretamente, JWT pode estar cacheado
    const { userId } = auth()
    if (!userId) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

    const { clerkClient } = await import('@clerk/nextjs/server')
    const clerkUser = await clerkClient().users.getUser(userId)
    const plan = (clerkUser.publicMetadata as any)?.plan as string | undefined
    const hasActivePlan = plan && plan !== 'free'
    if (!hasActivePlan) {
      const inTrial = (Date.now() - clerkUser.createdAt) < 7 * 24 * 60 * 60 * 1000
      if (!inTrial) {
        return NextResponse.json({ success: false, error: 'Período de avaliação encerrado. Assine um plano para continuar.' }, { status: 402 })
      }
    }

    const body = await req.json()
    const {
      clientName,
      niche,
      budget        = 0,
      objective     = '',
      metaCampaigns    = [],
      metaTotals       = null,
      googleCampaigns  = [],
      googleTotals     = null,
      uploadedCampaigns = [],
      uploadedPlatform  = null,
    } = body

    if (!clientName || !niche) {
      return NextResponse.json({ success: false, error: 'clientName e niche são obrigatórios.' }, { status: 400 })
    }

    const hasMeta     = metaTotals !== null || metaCampaigns.length > 0
    const hasGoogle   = googleTotals !== null || googleCampaigns.length > 0
    const hasUpload   = uploadedCampaigns.length > 0

    if (!hasMeta && !hasGoogle && !hasUpload) {
      return NextResponse.json({ success: false, error: 'Conecte uma conta ou importe um arquivo CSV/XLSX para auditar.' }, { status: 400 })
    }

    const bench = getBenchmark(niche)
    const benchmarkText = getBenchmarkSummary(niche)

    // Totais consolidados (contas + upload)
    const uploadTotalSpend = uploadedCampaigns.reduce((s: number, c: any) => s + (c.spend || 0), 0)
    const uploadTotalLeads = uploadedCampaigns.reduce((s: number, c: any) => s + (c.leads || 0), 0)
    const totalSpend = (metaTotals?.spend || 0) + (googleTotals?.spend || 0) + uploadTotalSpend
    const totalLeads = (metaTotals?.leads || 0) + (googleTotals?.leads || 0) + uploadTotalLeads
    const realCPL    = totalLeads > 0 ? (totalSpend / totalLeads).toFixed(2) : '0'

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (apiKey) {
      try {
        const { default: Anthropic } = await import('@anthropic-ai/sdk')
        const anthropic = new Anthropic({ apiKey })

        const metaSummary = hasMeta
          ? `META ADS:
- Gasto: R$${(metaTotals?.spend || 0).toFixed(2)}
- Impressões: ${(metaTotals?.impressions || 0).toLocaleString('pt-BR')}
- Cliques: ${metaTotals?.clicks || 0} (CTR ${metaTotals?.ctr || 0}%)
- Leads: ${metaTotals?.leads || 0}
- CPL: R$${metaTotals?.cpl || 0}
- ROAS: ${metaTotals?.roas || 0}×
- Campanhas:
${metaCampaigns.slice(0, 15).map((c: any) => `  • ${c.name} | Status: ${c.status} | Gasto: R$${c.spend} | Leads: ${c.leads} | CPL: R$${c.cpl} | CTR: ${c.ctr}%`).join('\n')}`
          : ''

        const googleSummary = hasGoogle
          ? `GOOGLE ADS:
- Gasto: R$${(googleTotals?.spend || 0).toFixed(2)}
- Impressões: ${(googleTotals?.impressions || 0).toLocaleString('pt-BR')}
- Cliques: ${googleTotals?.clicks || 0} (CTR ${googleTotals?.ctr || 0}%)
- Leads/Conversões: ${googleTotals?.leads || 0}
- CPL: R$${googleTotals?.cpl || 0}
- ROAS: ${googleTotals?.roas || 0}×
- Campanhas:
${googleCampaigns.slice(0, 15).map((c: any) => `  • ${c.name} | Status: ${c.status} | Gasto: R$${c.spend} | Leads: ${c.leads} | CPL: R$${c.cpl} | CTR: ${c.ctr}%`).join('\n')}`
          : ''

        const uploadSummary = hasUpload
          ? `DADOS IMPORTADOS (${uploadedPlatform || 'plataforma desconhecida'} · ${uploadedCampaigns.length} campanhas):
${uploadedCampaigns.slice(0, 20).map((c: any) => `  • ${c.name}${c.adName && c.adName !== c.name ? ` / ${c.adName}` : ''} | Status: ${c.status || '-'} | Gasto: R$${(c.spend || 0).toFixed(2)} | Leads: ${c.leads || 0} | CPL: R$${(c.cpl || 0).toFixed(2)} | CTR: ${(c.ctr || 0).toFixed(2)}% | ROAS: ${(c.roas || 0).toFixed(2)}×${c.placement ? ` | Posicionamento: ${c.placement}` : ''}`).join('\n')}
- Gasto total importado: R$${uploadTotalSpend.toFixed(2)}
- Leads totais importados: ${uploadTotalLeads}
- CPL médio importado: R$${uploadTotalLeads > 0 ? (uploadTotalSpend / uploadTotalLeads).toFixed(2) : '0'}`
          : ''

        const prompt = `Você é um especialista sênior em auditoria de campanhas de tráfego pago no mercado brasileiro com 10+ anos de experiência. Faça uma auditoria COMPLETA e CIRÚRGICA das campanhas abaixo.

CLIENTE: ${clientName}
NICHO: ${niche}
BUDGET MENSAL: R$${budget}
OBJETIVO: ${objective}

${metaSummary}
${googleSummary}
${uploadSummary}

TOTAIS CONSOLIDADOS:
- Gasto total: R$${totalSpend.toFixed(2)}
- Total de leads/conversões: ${totalLeads}
- CPL médio real: R$${realCPL}

${benchmarkText ? `BENCHMARK DO NICHO (${niche}):\n${benchmarkText}` : ''}

ANALISE COM PROFUNDIDADE:
1. Onde o cliente está desperdiçando dinheiro (com valores R$)
2. Quais campanhas/anúncios/posicionamentos têm melhor e pior desempenho
3. O custo por resultado está bom ou não em relação ao benchmark do nicho
4. Onde deve colocar mais dinheiro e onde deve tirar
5. O que precisa ser feito com urgência
6. Onde e quanto investir (alocação ideal do budget)

Seja específico — use nomes reais das campanhas dos dados fornecidos. Cite números reais.

Responda APENAS com JSON válido (sem markdown, sem \`\`\`):
{
  "health_score": <0-100>,
  "grade": "<A+|A|B+|B|C+|C|D>",
  "summary": "<resumo executivo 2-3 frases com números reais>",
  "wasted_spend": {
    "estimated": <R$ estimado desperdiçado>,
    "percentage": <%>,
    "main_causes": ["<causa específica com valor R$>", "<causa 2>", "<causa 3>"]
  },
  "urgent_actions": [
    "<ação urgente 1 — específica com campanha/canal>",
    "<ação urgente 2>",
    "<ação urgente 3>"
  ],
  "budget_add": [
    { "channel": "<canal ou campanha>", "reason": "<por que aumentar>", "amount": "<quanto ou %" }
  ],
  "budget_remove": [
    { "campaign": "<campanha específica>", "reason": "<por que tirar>", "amount": "<valor ou %>" }
  ],
  "investment_map": [
    { "channel": "<canal>", "allocation": "<% ou R$>", "reason": "<justificativa com dados>", "expected_cpl": "<CPL esperado>" }
  ],
  "critical_issues": [
    { "severity": "<alta|media|baixa>", "issue": "<problema>", "detail": "<detalhes com números>", "action": "<ação corretiva>" }
  ],
  "campaign_ranking": {
    "best_campaign": { "name": "<nome exato da campanha>", "reason": "<por que é melhor>", "metrics": { "<chave>": "<valor>" } },
    "best_ad": { "name": "<nome do anúncio>", "reason": "<por que é melhor>" },
    "best_placement": { "name": "<posicionamento>", "reason": "<justificativa>" },
    "worst_campaigns": [{ "name": "<nome>", "reason": "<por que está mal>" }]
  },
  "cpr_assessment": [
    { "campaign": "<nome>", "cpl": <valor numérico>, "detail": "<leads e gasto>", "status": "<bom|atenção|crítico>", "vs_benchmark": "<texto comparativo>" }
  ],
  "quick_wins": [
    { "title": "<ação>", "description": "<como fazer>", "impact": "<Alto|Médio|Baixo>", "effort": "<Alto|Médio|Baixo>" }
  ],
  "meta_analysis": ${hasMeta ? '{ "spend": <num>, "leads": <num>, "cpl": <num>, "roas": <num>, "ctr": <num>, "status": "<bom|atenção|crítico>", "insights": ["<texto>"] }' : 'null'},
  "google_analysis": ${hasGoogle ? '{ "spend": <num>, "leads": <num>, "cpl": <num>, "roas": <num>, "ctr": <num>, "status": "<bom|atenção|crítico>", "insights": ["<texto>"] }' : 'null'},
  "benchmark": {
    "cpl_min": ${bench?.cpl_min || 0},
    "cpl_max": ${bench?.cpl_max || 0},
    "roas_good": ${bench?.kpi_thresholds?.roas_good || 3},
    "best_channels": ${JSON.stringify(bench?.best_channels || [])},
    "insights": ${JSON.stringify(bench?.insights || [])}
  },
  "recommendations": [
    { "priority": 1, "channel": "<canal>", "action": "<ação específica com números>", "expected_result": "<resultado>" }
  ]
}`

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }],
        })

        const raw = (message.content[0] as any).text.trim()
        // Remove markdown code fences if present
        const jsonStr = raw.startsWith('```')
          ? raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
          : raw

        const audit = JSON.parse(jsonStr)
        audit.generated_at = new Date().toISOString()

        return NextResponse.json({ success: true, audit, source: 'ai' })

      } catch (aiError: any) {
        console.warn('Anthropic API falhou na auditoria, usando fallback:', aiError.message)
      }
    }

    // ── Fallback por benchmark ──────────────────────────────────────────────
    if (!bench) {
      return NextResponse.json(
        { success: false, error: 'Nicho não reconhecido e API indisponível.' },
        { status: 400 }
      )
    }

    const audit = buildFallbackAudit(
      clientName, niche, metaTotals, googleTotals,
      metaCampaigns, googleCampaigns, uploadedCampaigns, bench
    )
    return NextResponse.json({ success: true, audit, source: 'benchmark' })

  } catch (error: any) {
    console.error('Audit route error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
