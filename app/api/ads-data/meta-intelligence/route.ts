// app/api/ads-data/meta-intelligence/route.ts
// Sprint 1: Meta Ad Intelligence — análise profunda de conta Meta com IA de regras
import { NextRequest, NextResponse } from 'next/server'

const OBJECTIVE_LABELS: Record<string, string> = {
  OUTCOME_LEADS:          'Geração de Leads',
  OUTCOME_TRAFFIC:        'Tráfego',
  OUTCOME_SALES:          'Vendas / Conversões',
  OUTCOME_AWARENESS:      'Reconhecimento de Marca',
  OUTCOME_ENGAGEMENT:     'Engajamento',
  OUTCOME_APP_PROMOTION:  'Promoção de App',
  LEAD_GENERATION:        'Geração de Leads',
  CONVERSIONS:            'Conversões',
  LINK_CLICKS:            'Cliques no Link',
  REACH:                  'Alcance',
  BRAND_AWARENESS:        'Reconhecimento de Marca',
  VIDEO_VIEWS:            'Visualizações de Vídeo',
  MESSAGES:               'Mensagens (WhatsApp)',
  PAGE_LIKES:             'Curtidas na Página',
  POST_ENGAGEMENT:        'Engajamento em Post',
  APP_INSTALLS:           'Instalações de App',
  STORE_VISITS:           'Visitas à Loja',
}

type LearningPhase = 'learning' | 'learning_limited' | 'stable' | 'inactive'
type RecType = 'critical' | 'warning' | 'opportunity'

type CampaignResult = {
  id: string; name: string; objective: string; objectiveLabel: string; status: string
  spend30: number; impressions: number; clicks: number; reach: number; frequency: number
  ctr30: number; cpc30: number; cpm30: number
  leads30: number; cpl30: number; purchases30: number
  revenue30: number; roas30: number
  messages30: number; videoViews30: number
  spend7: number; conversions7: number
  learningPhase: LearningPhase
  issues: string[]; recommendations: string[]
}

function extractConversions(actions: any[], types: string[]): number {
  return (actions || [])
    .filter((a: any) => types.includes(a.action_type))
    .reduce((s: number, a: any) => s + parseInt(a.value || '0'), 0)
}

function extractRevenue(actions: any[], types: string[]): number {
  return (actions || [])
    .filter((a: any) => types.includes(a.action_type))
    .reduce((s: number, a: any) => s + parseFloat(a.value || '0'), 0)
}

export async function POST(req: NextRequest) {
  try {
    const { accessToken, accountId } = await req.json()
    if (!accessToken || !accountId) {
      return NextResponse.json({ success: false, error: 'Token ou Account ID não fornecido.' }, { status: 400 })
    }

    const baseUrl = `https://graph.facebook.com/v19.0`
    const act     = `act_${accountId}`
    const token   = encodeURIComponent(accessToken)

    // ── 3 chamadas paralelas ──────────────────────────────────────────────────
    const [campaignsRes, ins30Res, ins7Res] = await Promise.all([
      fetch(
        `${baseUrl}/${act}/campaigns?fields=id,name,objective,effective_status,created_time,daily_budget,lifetime_budget&limit=50&status=["ACTIVE","PAUSED"]&access_token=${token}`,
        { signal: AbortSignal.timeout(15000) }
      ),
      fetch(
        `${baseUrl}/${act}/insights?fields=campaign_id,campaign_name,spend,impressions,clicks,reach,frequency,actions,cost_per_action_type&date_preset=last_30d&level=campaign&limit=50&access_token=${token}`,
        { signal: AbortSignal.timeout(15000) }
      ),
      fetch(
        `${baseUrl}/${act}/insights?fields=campaign_id,spend,actions&date_preset=last_7d&level=campaign&limit=50&access_token=${token}`,
        { signal: AbortSignal.timeout(15000) }
      ),
    ])

    const [campaignsData, ins30Data, ins7Data] = await Promise.all([
      campaignsRes.json(), ins30Res.json(), ins7Res.json(),
    ])

    if (campaignsData.error) {
      return NextResponse.json({ success: false, error: campaignsData.error.message }, { status: 400 })
    }
    if (ins30Data.error) {
      return NextResponse.json({ success: false, error: ins30Data.error.message }, { status: 400 })
    }

    // ── Mapas por campaign_id ─────────────────────────────────────────────────
    const campaignMeta: Record<string, any> = {}
    for (const c of (campaignsData.data || [])) campaignMeta[c.id] = c

    const ins7Map: Record<string, any> = {}
    for (const c of (ins7Data.data || [])) ins7Map[c.campaign_id] = c

    // ── Processa cada campanha ───────────────────────────────────────────────
    const campaigns: CampaignResult[] = (ins30Data.data || []).map((row: any): CampaignResult => {
      const meta = campaignMeta[row.campaign_id] || {}

      const spend30       = parseFloat(row.spend || '0')
      const clicks        = parseInt(row.clicks || '0')
      const impressions   = parseInt(row.impressions || '0')
      const reach         = parseInt(row.reach || '0')
      const frequency     = parseFloat(row.frequency || '0')

      const leads30    = extractConversions(row.actions, ['lead', 'onsite_conversion.lead_grouped'])
      const purchases30 = extractConversions(row.actions, ['purchase', 'omni_purchase'])
      const revenue30  = extractRevenue(row.actions, ['purchase', 'omni_purchase'])
      const messages30 = extractConversions(row.actions, [
        'onsite_conversion.messaging_conversation_started_7d',
        'messaging_first_reply',
        'onsite_conversion.messaging_first_reply',
      ])
      const videoViews30 = extractConversions(row.actions, ['video_view', 'video_thruplay_watched_actions'])

      const row7        = ins7Map[row.campaign_id] || {}
      const spend7      = parseFloat(row7.spend || '0')
      const leads7      = extractConversions(row7.actions, ['lead', 'onsite_conversion.lead_grouped'])
      const purchases7  = extractConversions(row7.actions, ['purchase', 'omni_purchase'])
      const conversions7 = leads7 + purchases7

      const roas30 = spend30 > 0 && revenue30 > 0 ? +(revenue30 / spend30).toFixed(2) : 0
      const cpl30  = leads30  > 0 ? +(spend30 / leads30).toFixed(2) : 0
      const cpc30  = clicks   > 0 ? +(spend30 / clicks).toFixed(2) : 0
      const ctr30  = impressions > 0 ? +((clicks / impressions) * 100).toFixed(2) : 0
      const cpm30  = impressions > 0 ? +((spend30 / impressions) * 1000).toFixed(2) : 0

      const objective = meta.objective || 'UNKNOWN'
      const isConversionObj = ['OUTCOME_LEADS','OUTCOME_SALES','LEAD_GENERATION','CONVERSIONS'].includes(objective)
      const status = meta.effective_status || 'ACTIVE'

      // ── Fase de aprendizado ───────────────────────────────────────────────
      let learningPhase: LearningPhase = 'stable'
      if (status === 'PAUSED' || spend7 === 0) {
        learningPhase = 'inactive'
      } else if (isConversionObj) {
        if (conversions7 === 0 && spend7 > 50) {
          learningPhase = 'learning_limited'
        } else if (conversions7 < 50) {
          learningPhase = 'learning'
        }
      }

      // ── Problemas ─────────────────────────────────────────────────────────
      const issues: string[] = []
      if (ctr30 < 0.5 && spend30 > 200)                        issues.push('CTR crítico (<0.5%)')
      if (frequency > 4 && spend30 > 200)                      issues.push('Fadiga de criativo (frequência >4×)')
      if (spend30 > 500 && leads30 === 0 && revenue30 === 0)   issues.push('Sem conversões registradas')
      if (learningPhase === 'learning_limited')                  issues.push('Aprendizado limitado')
      if (roas30 > 0 && roas30 < 1)                            issues.push('ROAS negativo (<1×)')
      if (cpl30 > 500 && leads30 > 0)                          issues.push('CPL muito alto (>R$500)')

      // ── Recomendações por campanha ────────────────────────────────────────
      const recommendations: string[] = []
      if (learningPhase === 'learning')         recommendations.push('Não edite a campanha nos próximos dias — deixe o algoritmo aprender')
      if (learningPhase === 'learning_limited') recommendations.push('Aumente o orçamento ou amplie a segmentação para superar o aprendizado limitado')
      if (ctr30 < 0.5 && spend30 > 100)        recommendations.push('Troque os criativos — CTR baixo indica anúncio pouco relevante')
      if (frequency > 4)                        recommendations.push('Renove os criativos ou expanda a audiência para reduzir saturação')
      if (roas30 > 0 && roas30 < 1.5)          recommendations.push('ROAS abaixo do break-even — revise a estrutura ou lance uma campanha de remarketing')
      if (messages30 > 0 && messages30 > leads30 * 2) recommendations.push('Muitas mensagens no WhatsApp — configure automação de atendimento para converter mais')
      if (cpm30 > 80 && ctr30 < 1)             recommendations.push('CPM alto com CTR baixo — otimize o ângulo criativo ou reduza a audiência')
      if (reach > 0 && frequency < 1.5 && spend30 > 200) recommendations.push('Frequência muito baixa — aumente o orçamento ou reduza a janela de remarketing')

      return {
        id:            row.campaign_id,
        name:          row.campaign_name || meta.name || row.campaign_id,
        objective,
        objectiveLabel: OBJECTIVE_LABELS[objective] || objective,
        status,
        spend30,  impressions,  clicks, reach, frequency,
        ctr30,    cpc30,        cpm30,
        leads30,  cpl30,        purchases30,
        revenue30, roas30,
        messages30, videoViews30,
        spend7,   conversions7,
        learningPhase,
        issues,
        recommendations,
      }
    })

    // ── Agrupamento por objetivo ──────────────────────────────────────────────
    type ObjGroup = {
      label: string; count: number
      totalSpend: number; totalLeads: number; totalRevenue: number
      avgCPL: number; avgROAS: number; campaigns: string[]
    }
    const byObjective: Record<string, ObjGroup> = {}
    for (const c of campaigns) {
      if (!byObjective[c.objective]) {
        byObjective[c.objective] = {
          label: c.objectiveLabel, count: 0,
          totalSpend: 0, totalLeads: 0, totalRevenue: 0,
          avgCPL: 0, avgROAS: 0, campaigns: [],
        }
      }
      const g = byObjective[c.objective]
      g.count++
      g.totalSpend   += c.spend30
      g.totalLeads   += c.leads30
      g.totalRevenue += c.revenue30
      g.campaigns.push(c.name)
    }
    for (const g of Object.values(byObjective)) {
      g.avgCPL  = g.totalLeads  > 0 ? +(g.totalSpend / g.totalLeads).toFixed(2) : 0
      g.avgROAS = g.totalSpend  > 0 && g.totalRevenue > 0 ? +(g.totalRevenue / g.totalSpend).toFixed(2) : 0
    }

    // ── Totais ────────────────────────────────────────────────────────────────
    const activeCampaigns   = campaigns.filter(c => c.status !== 'PAUSED' && c.spend30 > 0)
    const learningCampaigns = campaigns.filter(c => c.learningPhase === 'learning' || c.learningPhase === 'learning_limited')
    const totalSpend        = campaigns.reduce((s, c) => s + c.spend30,   0)
    const totalLeads        = campaigns.reduce((s, c) => s + c.leads30,   0)
    const totalRevenue      = campaigns.reduce((s, c) => s + c.revenue30, 0)
    const totalMessages     = campaigns.reduce((s, c) => s + c.messages30, 0)
    const avgCTR            = activeCampaigns.length > 0
      ? activeCampaigns.reduce((s, c) => s + c.ctr30, 0) / activeCampaigns.length : 0
    const avgFrequency      = activeCampaigns.length > 0
      ? activeCampaigns.reduce((s, c) => s + c.frequency, 0) / activeCampaigns.length : 0

    // ── Score da conta (0-100) ────────────────────────────────────────────────
    let score = 65
    if (avgCTR  >= 2.0) score += 12; else if (avgCTR  >= 1.0) score += 6; else if (avgCTR < 0.5) score -= 12
    if (avgFrequency < 2.5) score += 8; else if (avgFrequency > 5) score -= 12; else if (avgFrequency > 3.5) score -= 5
    const issueRatio = campaigns.length > 0 ? campaigns.filter(c => c.issues.length > 0).length / campaigns.length : 0
    if (issueRatio < 0.2) score += 10; else if (issueRatio > 0.5) score -= 15
    const learningRatio = activeCampaigns.length > 0 ? learningCampaigns.length / activeCampaigns.length : 0
    if (learningRatio > 0.6) score -= 10; else if (learningRatio < 0.2 && activeCampaigns.length > 0) score += 5
    if (totalRevenue > 0 && totalSpend > 0 && (totalRevenue / totalSpend) >= 3) score += 10
    score = Math.max(20, Math.min(99, Math.round(score)))

    const scoreGrade =
      score >= 90 ? 'A+' : score >= 85 ? 'A'  : score >= 80 ? 'A-' :
      score >= 75 ? 'B+' : score >= 70 ? 'B'  : score >= 65 ? 'B-' :
      score >= 55 ? 'C+' : score >= 45 ? 'C'  : 'D'

    // ── Recomendações globais ─────────────────────────────────────────────────
    const globalRecs: Array<{ type: RecType; title: string; description: string }> = []

    const limitedC = campaigns.filter(c => c.learningPhase === 'learning_limited')
    if (limitedC.length > 0) {
      globalRecs.push({
        type: 'critical',
        title: `${limitedC.length} campanha(s) com aprendizado limitado`,
        description: 'O algoritmo não está encontrando conversões suficientes. Aumente o orçamento, amplie a audiência ou revise o evento de conversão.',
      })
    }

    const wasteC = campaigns.filter(c => c.spend30 > 300 && c.leads30 === 0 && c.revenue30 === 0)
    if (wasteC.length > 0) {
      const wasted = wasteC.reduce((s, c) => s + c.spend30, 0)
      globalRecs.push({
        type: 'critical',
        title: `R$${wasted.toFixed(0)} em campanhas sem conversão`,
        description: `${wasteC.length} campanha(s) gastando sem leads ou receita registrados. Verifique o pixel, o evento de conversão e a landing page.`,
      })
    }

    const highFreqC = campaigns.filter(c => c.frequency > 4 && c.spend30 > 200)
    if (highFreqC.length > 0) {
      globalRecs.push({
        type: 'warning',
        title: `${highFreqC.length} campanha(s) com frequência acima de 4×`,
        description: 'Audiência saturada reduz CTR e eleva CPL. Renove criativos ou expanda o público-alvo.',
      })
    }

    const lowCtrC = campaigns.filter(c => c.ctr30 < 0.5 && c.spend30 > 200)
    if (lowCtrC.length > 0) {
      globalRecs.push({
        type: 'warning',
        title: `${lowCtrC.length} campanha(s) com CTR crítico (<0.5%)`,
        description: 'Anúncios com baixo engajamento encarecem o CPM e reduzem o alcance efetivo. Teste novos criativos.',
      })
    }

    if (totalMessages > 0) {
      const convRate = totalLeads > 0 ? ((totalLeads / (totalLeads + totalMessages)) * 100).toFixed(0) : '0'
      globalRecs.push({
        type: 'opportunity',
        title: `${totalMessages.toLocaleString('pt-BR')} conversas no WhatsApp abertas`,
        description: `Campanhas de mensagem ativas com volume relevante. Automatize o primeiro atendimento para aumentar a taxa de conversão (atual ~${convRate}% leads formais).`,
      })
    }

    const highRoasC = campaigns.filter(c => c.roas30 >= 3)
    if (highRoasC.length > 0) {
      globalRecs.push({
        type: 'opportunity',
        title: `${highRoasC.length} campanha(s) com ROAS ≥ 3× — candidatas a escalar`,
        description: 'Campanhas com bom retorno. Aumente o orçamento 20-30% por vez para escalar sem sair da fase estável.',
      })
    }

    return NextResponse.json({
      success: true,
      score,
      scoreGrade,
      campaigns,
      byObjective,
      totals: {
        spend:           totalSpend,
        leads:           totalLeads,
        revenue:         totalRevenue,
        messages:        totalMessages,
        roas:            totalSpend > 0 && totalRevenue > 0 ? +(totalRevenue / totalSpend).toFixed(2) : 0,
        cpl:             totalLeads > 0 ? +(totalSpend / totalLeads).toFixed(2) : 0,
        avgCTR:          +avgCTR.toFixed(2),
        avgFrequency:    +avgFrequency.toFixed(1),
        activeCampaigns: activeCampaigns.length,
        learningCampaigns: learningCampaigns.length,
        totalCampaigns:  campaigns.length,
      },
      globalRecs,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
