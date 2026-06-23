// app/api/budget-allocator/route.ts — Budget Allocator Agent (AGENT.md)
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getBenchmark } from '@/lib/niche_benchmarks'
import { sanitizeText } from '@/lib/sanitize'
import { safeExtractJson } from '@/lib/aiJson'

export interface CampaignAllocation {
  id: string
  name: string
  platform: 'meta' | 'google'
  status: string

  // Métricas atuais
  currentBudget: number    // orçamento diário atual
  currentSpend: number     // gasto total no período
  currentLeads: number
  currentCPL: number
  currentROAS: number
  currentCTR: number
  efficiency: number       // score 0-100

  // Alocação proposta
  proposedBudget: number   // orçamento diário proposto
  budgetChange: number     // diferença em R$ (positivo = aumento)
  budgetChangePct: number  // diferença em %
  action: 'scale' | 'maintain' | 'reduce' | 'pause' | 'test'
  actionReason: string

  // Impacto projetado
  projectedLeads: number   // leads projetados com novo orçamento
  projectedCPL: number     // CPL projetado
}

export interface BudgetAllocation {
  totalBudget: number
  totalCurrentSpend: number
  campaignCount: number
  allocations: CampaignAllocation[]
  summary: {
    currentLeadsPerMonth: number
    projectedLeadsPerMonth: number
    leadsGain: number
    leadsGainPct: number
    currentAvgCPL: number
    projectedAvgCPL: number
    cplReduction: number
    cplReductionPct: number
    campaignsToScale: number
    campaignsToPause: number
    campaignsToMaintain: number
  }
  topInsight: string
  strategy: string
}

function scoreEfficiency(campaign: any, benchCPLMax: number): number {
  const cpl = Number(campaign.cpl || campaign.currentCPL || 0)
  const ctr = Number(campaign.ctr || campaign.currentCTR || 0)
  const leads = Number(campaign.leads || campaign.currentLeads || 0)
  const spend = Number(campaign.spend || campaign.currentSpend || 0)
  const roas = Number(campaign.roas || campaign.currentROAS || 0)

  if (spend < 10) return 0  // dados insuficientes

  let score = 50

  // CPL vs benchmark (peso 40%)
  if (cpl > 0 && benchCPLMax > 0) {
    if (cpl <= benchCPLMax * 0.5) score += 30
    else if (cpl <= benchCPLMax * 0.75) score += 20
    else if (cpl <= benchCPLMax) score += 10
    else if (cpl <= benchCPLMax * 1.5) score -= 10
    else score -= 25
  }

  // CTR (peso 20%)
  if (ctr >= 2) score += 15
  else if (ctr >= 1) score += 8
  else if (ctr >= 0.5) score += 2
  else if (ctr > 0) score -= 10

  // Leads absolutos (escala — peso 20%)
  if (leads >= 50) score += 10
  else if (leads >= 20) score += 5
  else if (leads < 3 && spend > 200) score -= 15

  // ROAS (peso 20%)
  if (roas >= 3) score += 15
  else if (roas >= 1.5) score += 8
  else if (roas > 0 && roas < 1) score -= 15

  return Math.max(0, Math.min(100, score))
}

function buildAllocations(
  campaigns: any[],
  totalBudget: number,
  niche: string,
): BudgetAllocation {
  const bench = getBenchmark(niche)
  const benchCPLMin = bench?.cpl_min ?? 30
  const benchCPLMax = bench?.cpl_max ?? 120
  const dailyBudget = totalBudget / 30

  // Score cada campanha
  const scored = campaigns.map(c => ({
    ...c,
    efficiency: scoreEfficiency(c, benchCPLMax),
    cpl: Number(c.cpl || c.currentCPL || 0),
    spend: Number(c.spend || c.currentSpend || 0),
    leads: Number(c.leads || c.currentLeads || 0),
    ctr: Number(c.ctr || c.currentCTR || 0),
    roas: Number(c.roas || c.currentROAS || 0),
    dailyBudget: Number(c.dailyBudget || c.currentBudget || (c.spend ? c.spend / 30 : 0)),
  }))

  // Classifica campanhas por ação
  const allocations: CampaignAllocation[] = scored.map(c => {
    const eff = c.efficiency
    const hasSufficientData = c.spend >= 50
    let action: CampaignAllocation['action'] = 'maintain'
    let actionReason = ''

    if (!hasSufficientData) {
      action = 'test'
      actionReason = 'Dados insuficientes — manter verba de teste por mais 7 dias'
    } else if (eff >= 75) {
      action = 'scale'
      actionReason = `Eficiência alta (${eff}/100) — CPL excelente, escalar com segurança`
    } else if (eff >= 55) {
      action = 'maintain'
      actionReason = `Performance dentro do benchmark — manter e otimizar criativos`
    } else if (eff >= 35) {
      action = 'reduce'
      actionReason = `CPL acima do ideal — reduzir verba e revisar segmentação`
    } else {
      action = 'pause'
      actionReason = `Eficiência crítica (${eff}/100) — pausar e reestruturar antes de reinvestir`
    }

    return {
      id: c.id || c.name,
      name: c.name || c.campaignName || 'Campanha',
      platform: c.platform === 'google' ? 'google' : 'meta',
      status: c.status || 'ACTIVE',
      currentBudget: c.dailyBudget,
      currentSpend: c.spend,
      currentLeads: c.leads,
      currentCPL: c.cpl,
      currentROAS: c.roas,
      currentCTR: c.ctr,
      efficiency: eff,
      proposedBudget: 0,  // preenchido abaixo
      budgetChange: 0,
      budgetChangePct: 0,
      action,
      actionReason,
      projectedLeads: 0,
      projectedCPL: 0,
    }
  })

  // Distribui o orçamento diário proporcional à eficiência
  const totalEfficiency = allocations.reduce((s, a) => {
    if (a.action === 'pause') return s
    return s + Math.max(a.efficiency, 1)
  }, 0)

  for (const a of allocations) {
    if (a.action === 'pause') {
      a.proposedBudget = 0
    } else {
      const weight = a.efficiency / totalEfficiency
      a.proposedBudget = Math.round(dailyBudget * weight * 100) / 100

      // Limites: escalar no máx 3x, reduzir no mín 20%
      if (a.action === 'scale') {
        a.proposedBudget = Math.min(a.proposedBudget, a.currentBudget * 3)
      } else if (a.action === 'reduce') {
        a.proposedBudget = Math.max(a.proposedBudget, a.currentBudget * 0.2)
        a.proposedBudget = Math.min(a.proposedBudget, a.currentBudget * 0.7)
      }
    }

    a.budgetChange = a.proposedBudget - a.currentBudget
    a.budgetChangePct = a.currentBudget > 0
      ? ((a.proposedBudget - a.currentBudget) / a.currentBudget) * 100
      : 0

    // Projeta leads com novo orçamento
    if (a.currentSpend > 0 && a.currentLeads > 0) {
      const cplCurrent = a.currentCPL > 0 ? a.currentCPL : a.currentSpend / a.currentLeads
      // Scale se eficiência alta: CPL melhora ligeiramente com escala (algoritmo aprende)
      const cplImprovement = a.action === 'scale' ? 0.95 : a.action === 'reduce' ? 1.05 : 1.0
      a.projectedCPL = Math.round(cplCurrent * cplImprovement)
      a.projectedLeads = a.projectedCPL > 0
        ? Math.round((a.proposedBudget * 30) / a.projectedCPL)
        : 0
    } else {
      a.projectedCPL = a.currentCPL
      a.projectedLeads = 0
    }
  }

  // Summary
  const currentLeads = allocations.reduce((s, a) => s + a.currentLeads, 0)
  const projectedLeads = allocations.reduce((s, a) => s + a.projectedLeads, 0)
  const currentAvgCPL = currentLeads > 0
    ? Math.round(allocations.reduce((s, a) => s + a.currentSpend, 0) / currentLeads)
    : 0
  const projectedTotalSpend = allocations.reduce((s, a) => s + a.proposedBudget * 30, 0)
  const projectedAvgCPL = projectedLeads > 0
    ? Math.round(projectedTotalSpend / projectedLeads)
    : 0

  const toScale = allocations.filter(a => a.action === 'scale').length
  const toPause = allocations.filter(a => a.action === 'pause').length
  const toMaintain = allocations.filter(a => a.action === 'maintain').length

  const topScaler = allocations.filter(a => a.action === 'scale').sort((a, b) => b.efficiency - a.efficiency)[0]
  const topPause = allocations.filter(a => a.action === 'pause').sort((a, b) => a.efficiency - b.efficiency)[0]

  let topInsight = ''
  if (topScaler) {
    topInsight = `"${topScaler.name}" tem CPL R$${topScaler.currentCPL} — ${topScaler.efficiency}/100 de eficiência. Escalar pode gerar +${topScaler.projectedLeads - topScaler.currentLeads} leads/mês.`
  } else if (toPause > 0) {
    topInsight = `${toPause} campanha${toPause > 1 ? 's estão' : ' está'} desperdiçando verba — realocar para campanhas eficientes.`
  }

  let strategy = ''
  if (toScale > 0 && toPause > 0) {
    strategy = `Realocar verba das ${toPause} campanha${toPause > 1 ? 's' : ''} ineficiente${toPause > 1 ? 's' : ''} para as ${toScale} campanha${toScale > 1 ? 's' : ''} de alto desempenho.`
  } else if (toScale > 0) {
    strategy = `Aumentar orçamento nas ${toScale} campanha${toScale > 1 ? 's' : ''} com melhor eficiência — ROI comprovado.`
  } else if (toPause > 0) {
    strategy = `Pausar ${toPause} campanha${toPause > 1 ? 's' : ''} com baixa eficiência e concentrar verba nas restantes.`
  } else {
    strategy = `Portfólio de campanhas equilibrado — foco em testes criativos para melhorar eficiência global.`
  }

  return {
    totalBudget,
    totalCurrentSpend: allocations.reduce((s, a) => s + a.currentSpend, 0),
    campaignCount: allocations.length,
    allocations: allocations.sort((a, b) => b.efficiency - a.efficiency),
    summary: {
      currentLeadsPerMonth: currentLeads,
      projectedLeadsPerMonth: projectedLeads,
      leadsGain: projectedLeads - currentLeads,
      leadsGainPct: currentLeads > 0 ? ((projectedLeads - currentLeads) / currentLeads) * 100 : 0,
      currentAvgCPL,
      projectedAvgCPL,
      cplReduction: currentAvgCPL - projectedAvgCPL,
      cplReductionPct: currentAvgCPL > 0 ? ((currentAvgCPL - projectedAvgCPL) / currentAvgCPL) * 100 : 0,
      campaignsToScale: toScale,
      campaignsToPause: toPause,
      campaignsToMaintain: toMaintain,
    },
    topInsight,
    strategy,
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { campaigns = [], totalBudget = 0, niche = '', clientData = {} } = body

    if (campaigns.length === 0) {
      return NextResponse.json({ error: 'Sem campanhas para analisar' }, { status: 400 })
    }

    const sanitizedNiche = sanitizeText(niche || clientData?.niche || '')
    const budget = Number(totalBudget) || Number(clientData?.budget) || 0

    // Tenta enriquecer com Claude AI
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (apiKey && campaigns.length > 0) {
      try {
        const { default: Anthropic } = await import('@anthropic-ai/sdk')
        const anthropic = new Anthropic({ apiKey })
        const bench = getBenchmark(sanitizedNiche)

        const campSummary = campaigns.slice(0, 15).map((c: any) =>
          `- ${c.name}: Gasto R$${c.spend||0} | Leads ${c.leads||0} | CPL R$${c.cpl||0} | CTR ${c.ctr||0}% | ROAS ${c.roas||0}x | Status ${c.status||'ACTIVE'}`
        ).join('\n')

        const prompt = `Você é um especialista em media buying e gestão de budget de tráfego pago no Brasil.

DADOS DO CLIENTE:
Nicho: ${sanitizedNiche}
Budget mensal total: R$${budget}
Budget diário disponível: R$${(budget/30).toFixed(2)}
Benchmark do nicho: CPL R$${bench?.cpl_min}–R$${bench?.cpl_max}

CAMPANHAS ATIVAS:
${campSummary}

Gere uma análise de alocação de budget no JSON abaixo. Para cada campanha, defina action (scale/maintain/reduce/pause/test) e proposedBudget (diário em R$). A soma dos proposedBudget deve aproximar R$${(budget/30).toFixed(2)}/dia.

Responda APENAS com JSON válido:
{
  "allocations": [
    {
      "name": "<nome exato da campanha>",
      "action": "<scale|maintain|reduce|pause|test>",
      "proposedBudget": <número>,
      "actionReason": "<justificativa de 1 linha>",
      "projectedCPL": <número>
    }
  ],
  "strategy": "<estratégia geral em 2 linhas>",
  "topInsight": "<insight principal em 1 linha>"
}`

        const msg = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 1500,
          messages: [{ role: 'user', content: prompt }],
        })

        const raw = (msg.content[0] as any).text?.trim() || ''
        const aiData = safeExtractJson<any>(raw)
        if (aiData) {
          // Mescla as ações da IA com o cálculo base
          const base = buildAllocations(campaigns, budget, sanitizedNiche)

          for (const alloc of base.allocations) {
            const aiAlloc = aiData.allocations?.find((a: any) =>
              a.name?.toLowerCase().includes(alloc.name.toLowerCase().slice(0, 15)) ||
              alloc.name.toLowerCase().includes(a.name?.toLowerCase().slice(0, 15) ?? '')
            )
            if (aiAlloc) {
              alloc.action = aiAlloc.action || alloc.action
              alloc.actionReason = aiAlloc.actionReason || alloc.actionReason
              if (aiAlloc.proposedBudget) alloc.proposedBudget = aiAlloc.proposedBudget
              if (aiAlloc.projectedCPL) alloc.projectedCPL = aiAlloc.projectedCPL
              alloc.budgetChange = alloc.proposedBudget - alloc.currentBudget
              alloc.budgetChangePct = alloc.currentBudget > 0
                ? ((alloc.proposedBudget - alloc.currentBudget) / alloc.currentBudget) * 100
                : 0
            }
          }

          if (aiData.strategy) base.strategy = aiData.strategy
          if (aiData.topInsight) base.topInsight = aiData.topInsight

          return NextResponse.json({ allocation: base, source: 'ai' })
        }
      } catch (err) {
        console.error('[budget-allocator] AI error, falling back:', err)
      }
    }

    const result = buildAllocations(campaigns, budget, sanitizedNiche)
    return NextResponse.json({ allocation: result, source: 'fallback' })

  } catch (err) {
    console.error('[budget-allocator] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
