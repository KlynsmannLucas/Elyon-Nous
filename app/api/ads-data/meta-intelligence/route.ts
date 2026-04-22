// app/api/ads-data/meta-intelligence/route.ts
// Meta Ad Intelligence — campanhas + ad sets + criativos + pixel + breakdowns geográfico/plataforma/demo
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

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

const OPTIMIZATION_GOAL_LABELS: Record<string, string> = {
  LEAD_GENERATION:     'Formulário de Lead',
  OFFSITE_CONVERSIONS: 'Conversões no Site',
  LINK_CLICKS:         'Cliques no Link',
  IMPRESSIONS:         'Impressões',
  REACH:               'Alcance',
  LANDING_PAGE_VIEWS:  'Visualizações de LP',
  VALUE:               'Valor de Conversão',
  REPLIES:             'Respostas',
  CONVERSATIONS:       'Conversas',
  APP_INSTALLS:        'Instalações',
  VIDEO_VIEWS:         'Visualizações de Vídeo',
  THRUPLAY:            'ThruPlay (vídeo)',
  QUALITY_LEAD:        'Lead de Qualidade',
  MEANINGFUL_CALL:     'Ligação',
  SUBSCRIBERS:         'Seguidores',
}

type LearningPhase = 'learning' | 'learning_limited' | 'stable' | 'inactive'
type RecType = 'critical' | 'warning' | 'opportunity'
type CampaignAge = 'new' | 'growing' | 'established' | 'veteran'

interface AdSet {
  id: string; name: string; status: string
  campaignId: string; campaignName: string
  optimizationGoal: string; optimizationGoalLabel: string
  dailyBudget: number; lifetimeBudget: number
  hasRemarketing: boolean
  spend: number; impressions: number; clicks: number
  leads: number; cpl: number; ctr: number; frequency: number
  issues: string[]
}

interface AdCreative {
  id: string; name: string; status: string
  campaignId: string; adsetId: string
  title: string; body: string; callToAction: string
  imageUrl: string
  spend: number; impressions: number; clicks: number
  leads: number; cpl: number; ctr: number; frequency: number
  tag: 'winner' | 'waste' | 'learning' | 'ok'
}

interface PixelInfo {
  id: string; name: string
  lastFiredTime: string | null
  isActive: boolean
  events: string[]
}

interface GeoBreakdown {
  region: string
  spend: number; leads: number; cpl: number; impressions: number
}

interface PlatformBreakdown {
  platform: string; position: string
  spend: number; leads: number; cpl: number; impressions: number; clicks: number; ctr: number
}

interface DemoBreakdown {
  age: string; gender: string
  spend: number; leads: number; cpl: number; impressions: number
}

type CampaignResult = {
  id: string; name: string; objective: string; objectiveLabel: string; status: string
  spend30: number; impressions: number; clicks: number; reach: number; frequency: number
  ctr30: number; cpc30: number; cpm30: number
  leads30: number; cpl30: number; purchases30: number
  revenue30: number; roas30: number
  messages30: number; videoViews30: number
  spend7: number; conversions7: number
  learningPhase: LearningPhase
  age: CampaignAge; ageDays: number
  issues: string[]; recommendations: string[]
}

function extractConversions(actions: any[], types: string[]): number {
  return (actions || []).filter((a: any) => types.includes(a.action_type)).reduce((s: number, a: any) => s + parseInt(a.value || '0'), 0)
}
function extractRevenue(actions: any[], types: string[]): number {
  return (actions || []).filter((a: any) => types.includes(a.action_type)).reduce((s: number, a: any) => s + parseFloat(a.value || '0'), 0)
}

const NICHE_FREQ_THRESHOLD: Record<string, number> = {
  'E-commerce': 5, 'Varejo': 5, 'Infoproduto': 3, 'Curso Online': 3,
  'Clínica / Saúde': 3.5, 'Imóveis': 3, 'Advocacia': 3,
  'Restaurante': 4, 'SaaS / Tech': 4, 'Serviços Locais': 3.5,
}
function freqThreshold(niche: string): number {
  for (const [key, val] of Object.entries(NICHE_FREQ_THRESHOLD)) {
    if (niche.toLowerCase().includes(key.toLowerCase())) return val
  }
  return 4
}
function dateStr(d: Date): string { return d.toISOString().split('T')[0] }
function campaignAge(createdTime: string | undefined): CampaignAge {
  if (!createdTime) return 'established'
  const days = (Date.now() - new Date(createdTime).getTime()) / 86400000
  if (days < 14) return 'new'; if (days < 45) return 'growing'; if (days < 180) return 'established'; return 'veteran'
}

const LEAD_TYPES    = ['lead', 'onsite_conversion.lead_grouped']
const PURCHASE_TYPES = ['purchase', 'omni_purchase']
const MSG_TYPES     = ['onsite_conversion.messaging_conversation_started_7d','messaging_first_reply','onsite_conversion.messaging_first_reply','onsite_conversion.total_messaging_connection']

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })

  try {
    const { accessToken, accountId, niche = '' } = await req.json()
    if (!accessToken || !accountId) {
      return NextResponse.json({ success: false, error: 'Token ou Account ID não fornecido.' }, { status: 400 })
    }

    const freqLimit = freqThreshold(niche)
    const baseUrl   = `https://graph.facebook.com/v19.0`
    const act       = `act_${accountId}`
    const token     = encodeURIComponent(accessToken)

    const today     = new Date()
    const thirtyAgo = new Date(today.getTime() - 30 * 86400000)
    const sixtyAgo  = new Date(today.getTime() - 60 * 86400000)
    const prevRange = encodeURIComponent(JSON.stringify({ since: dateStr(sixtyAgo), until: dateStr(thirtyAgo) }))

    const insightFields = 'campaign_id,campaign_name,spend,impressions,clicks,reach,frequency,actions,cost_per_action_type'
    const adsetInsightFields = 'adset_id,adset_name,campaign_id,spend,impressions,clicks,reach,frequency,actions'
    const adInsightFields    = 'ad_id,ad_name,campaign_id,adset_id,spend,impressions,clicks,reach,frequency,actions'

    // ── 9 chamadas paralelas ─────────────────────────────────────────────────
    const [
      campaignsRes, ins30Res, ins7Res, insPrevRes,
      adSetsRes, adSetsInsRes,
      adsRes, adsInsRes,
      pixelRes,
      geoRes, platformRes, demoRes,
    ] = await Promise.allSettled([
      // 1 - campanhas (meta)
      fetch(`${baseUrl}/${act}/campaigns?fields=id,name,objective,effective_status,created_time,daily_budget,lifetime_budget&limit=50&status=["ACTIVE","PAUSED"]&access_token=${token}`, { signal: AbortSignal.timeout(15000) }).then(r => r.json()),
      // 2 - insights 30d por campanha
      fetch(`${baseUrl}/${act}/insights?fields=${insightFields}&date_preset=last_30d&level=campaign&limit=50&access_token=${token}`, { signal: AbortSignal.timeout(15000) }).then(r => r.json()),
      // 3 - insights 7d por campanha
      fetch(`${baseUrl}/${act}/insights?fields=campaign_id,spend,actions&date_preset=last_7d&level=campaign&limit=50&access_token=${token}`, { signal: AbortSignal.timeout(15000) }).then(r => r.json()),
      // 4 - insights período anterior (30-60d)
      fetch(`${baseUrl}/${act}/insights?fields=campaign_id,spend,actions&time_range=${prevRange}&level=campaign&limit=50&access_token=${token}`, { signal: AbortSignal.timeout(15000) }).then(r => r.json()),
      // 5 - ad sets (metadados)
      fetch(`${baseUrl}/${act}/adsets?fields=id,name,status,effective_status,optimization_goal,daily_budget,lifetime_budget,campaign_id,targeting&limit=100&access_token=${token}`, { signal: AbortSignal.timeout(15000) }).then(r => r.json()),
      // 6 - insights de ad sets
      fetch(`${baseUrl}/${act}/insights?fields=${adsetInsightFields}&date_preset=last_30d&level=adset&limit=100&access_token=${token}`, { signal: AbortSignal.timeout(15000) }).then(r => r.json()),
      // 7 - ads/criativos (metadados)
      fetch(`${baseUrl}/${act}/ads?fields=id,name,status,effective_status,campaign_id,adset_id,creative{id,title,body,call_to_action_type,image_url,thumbnail_url}&limit=100&access_token=${token}`, { signal: AbortSignal.timeout(15000) }).then(r => r.json()),
      // 8 - insights de ads
      fetch(`${baseUrl}/${act}/insights?fields=${adInsightFields}&date_preset=last_30d&level=ad&limit=100&access_token=${token}`, { signal: AbortSignal.timeout(15000) }).then(r => r.json()),
      // 9 - pixels
      fetch(`${baseUrl}/${act}/pixels?fields=id,name,last_fired_time,is_unavailable&access_token=${token}`, { signal: AbortSignal.timeout(10000) }).then(r => r.json()),
      // 10 - breakdown geográfico
      fetch(`${baseUrl}/${act}/insights?fields=spend,actions,impressions&breakdowns=region&date_preset=last_30d&limit=50&access_token=${token}`, { signal: AbortSignal.timeout(15000) }).then(r => r.json()),
      // 11 - breakdown por plataforma
      fetch(`${baseUrl}/${act}/insights?fields=spend,actions,impressions,clicks,ctr&breakdowns=publisher_platform,platform_position&date_preset=last_30d&limit=50&access_token=${token}`, { signal: AbortSignal.timeout(15000) }).then(r => r.json()),
      // 12 - breakdown por idade/gênero
      fetch(`${baseUrl}/${act}/insights?fields=spend,actions,impressions&breakdowns=age,gender&date_preset=last_30d&limit=100&access_token=${token}`, { signal: AbortSignal.timeout(15000) }).then(r => r.json()),
    ])

    // ── Valida resposta principal ─────────────────────────────────────────────
    const campaignsData = campaignsRes.status === 'fulfilled' ? campaignsRes.value : { data: [] }
    const ins30Data     = ins30Res.status     === 'fulfilled' ? ins30Res.value     : { data: [] }
    const ins7Data      = ins7Res.status      === 'fulfilled' ? ins7Res.value      : { data: [] }
    const insPrevData   = insPrevRes.status   === 'fulfilled' ? insPrevRes.value   : { data: [] }

    if (ins30Data.error) return NextResponse.json({ success: false, error: ins30Data.error.message }, { status: 400 })
    if (campaignsData.error) return NextResponse.json({ success: false, error: campaignsData.error.message }, { status: 400 })

    // ── Mapas de campanha ────────────────────────────────────────────────────
    const campaignMeta: Record<string, any> = {}
    for (const c of (campaignsData.data || [])) campaignMeta[c.id] = c

    const ins7Map: Record<string, any>    = {}
    for (const c of (ins7Data.data    || [])) ins7Map[c.campaign_id]    = c
    const insPrevMap: Record<string, any> = {}
    for (const c of (insPrevData.data || [])) insPrevMap[c.campaign_id] = c

    // ── Campanhas ────────────────────────────────────────────────────────────
    const campaigns: CampaignResult[] = (ins30Data.data || []).map((row: any): CampaignResult => {
      const meta   = campaignMeta[row.campaign_id] || {}
      const spend30 = parseFloat(row.spend || '0')
      const clicks  = parseInt(row.clicks || '0')
      const impressions = parseInt(row.impressions || '0')
      const reach   = parseInt(row.reach || '0')
      const frequency = +parseFloat(row.frequency || '0').toFixed(2)

      const formLeads30 = extractConversions(row.actions, LEAD_TYPES)
      const purchases30 = extractConversions(row.actions, PURCHASE_TYPES)
      const revenue30   = extractRevenue(row.actions, PURCHASE_TYPES)
      const messages30  = extractConversions(row.actions, MSG_TYPES)
      const leads30     = formLeads30 + messages30
      const videoViews30 = extractConversions(row.actions, ['video_view', 'video_thruplay_watched_actions'])

      const row7        = ins7Map[row.campaign_id] || {}
      const spend7      = parseFloat(row7.spend || '0')
      const leads7      = extractConversions(row7.actions, LEAD_TYPES) + extractConversions(row7.actions, MSG_TYPES)
      const purchases7  = extractConversions(row7.actions, PURCHASE_TYPES)
      const conversions7 = leads7 + purchases7

      const roas30 = spend30 > 0 && revenue30 > 0 ? +(revenue30 / spend30).toFixed(2) : 0
      const cpl30  = leads30  > 0 ? +(spend30 / leads30).toFixed(2) : 0
      const cpc30  = clicks   > 0 ? +(spend30 / clicks).toFixed(2) : 0
      const ctr30  = impressions > 0 ? +((clicks / impressions) * 100).toFixed(2) : 0
      const cpm30  = impressions > 0 ? +((spend30 / impressions) * 1000).toFixed(2) : 0

      const objective = meta.objective || 'UNKNOWN'
      const isConversionObj = ['OUTCOME_LEADS','OUTCOME_SALES','LEAD_GENERATION','CONVERSIONS'].includes(objective)
      const status  = meta.effective_status || 'ACTIVE'
      const age     = campaignAge(meta.created_time)
      const ageDays = meta.created_time ? Math.floor((Date.now() - new Date(meta.created_time).getTime()) / 86400000) : -1

      let learningPhase: LearningPhase = 'stable'
      if (status === 'PAUSED' || spend7 === 0) learningPhase = 'inactive'
      else if (isConversionObj) {
        if (conversions7 === 0 && spend7 > 50) learningPhase = 'learning_limited'
        else if (conversions7 < 50)             learningPhase = 'learning'
      }

      const issues: string[] = []
      if (ctr30 < 0.5 && spend30 > 200)                                             issues.push('CTR crítico (<0.5%)')
      if (frequency > freqLimit && spend30 > 200)                                    issues.push(`Fadiga de criativo (freq. >${freqLimit}×)`)
      if (spend30 > 500 && leads30 === 0 && revenue30 === 0 && messages30 === 0)    issues.push('Sem conversões registradas')
      if (learningPhase === 'learning_limited')                                       issues.push('Aprendizado limitado')
      if (roas30 > 0 && roas30 < 1)                                                  issues.push('ROAS negativo (<1×)')
      if (cpl30 > 500 && leads30 > 0)                                               issues.push('CPL muito alto (>R$500)')

      const recommendations: string[] = []
      if (learningPhase === 'learning')         recommendations.push('Não edite — deixe o algoritmo aprender')
      if (learningPhase === 'learning_limited') recommendations.push('Aumente o orçamento ou amplie a segmentação')
      if (ctr30 < 0.5 && spend30 > 100)        recommendations.push('Troque os criativos — CTR baixo indica anúncio irrelevante')
      if (frequency > freqLimit)                recommendations.push(`Renove criativos ou expanda audiência (limite: ${freqLimit}×)`)
      if (roas30 > 0 && roas30 < 1.5)          recommendations.push('ROAS abaixo do break-even — revise estrutura ou lance remarketing')
      if (messages30 > 0 && formLeads30 === 0) recommendations.push('Configure automação de atendimento (ManyChat) para escalar WhatsApp')
      if (age === 'new')                        recommendations.push('Campanha nova (<14d) — aguarde estabilização')

      return {
        id: row.campaign_id, name: row.campaign_name || meta.name || row.campaign_id,
        objective, objectiveLabel: OBJECTIVE_LABELS[objective] || objective, status,
        spend30, impressions, clicks, reach, frequency,
        ctr30, cpc30, cpm30, leads30, cpl30, purchases30,
        revenue30, roas30, messages30, videoViews30,
        spend7, conversions7, learningPhase, age, ageDays,
        issues, recommendations,
      }
    })

    // ── Ad Sets ──────────────────────────────────────────────────────────────
    const adSetsData    = adSetsRes.status    === 'fulfilled' ? adSetsRes.value    : { data: [] }
    const adSetsInsData = adSetsInsRes.status === 'fulfilled' ? adSetsInsRes.value : { data: [] }

    const adSetInsMap: Record<string, any> = {}
    for (const r of (adSetsInsData.data || [])) adSetInsMap[r.adset_id] = r

    const campaignNameMap: Record<string, string> = {}
    for (const c of (campaignsData.data || [])) campaignNameMap[c.id] = c.name

    const adSets: AdSet[] = (adSetsData.data || []).map((as: any): AdSet => {
      const ins = adSetInsMap[as.id] || {}
      const spend       = parseFloat(ins.spend || '0')
      const impressions = parseInt(ins.impressions || '0')
      const clicks      = parseInt(ins.clicks || '0')
      const frequency   = +parseFloat(ins.frequency || '0').toFixed(2)
      const formLeads   = extractConversions(ins.actions, LEAD_TYPES)
      const messages    = extractConversions(ins.actions, MSG_TYPES)
      const leads       = formLeads + messages
      const cpl         = leads > 0 ? +(spend / leads).toFixed(2) : 0
      const ctr         = impressions > 0 ? +((clicks / impressions) * 100).toFixed(2) : 0

      // Detectar remarketing: verificar se targeting tem custom_audiences ou retargeting
      const targeting    = as.targeting || {}
      const hasRemarketing = !!(
        targeting.custom_audiences?.length > 0 ||
        targeting.excluded_custom_audiences?.length > 0 ||
        /remar|retar|visitant|warm|morno|quente|hot|bof/i.test(as.name)
      )

      const optGoal = as.optimization_goal || ''
      const issues: string[] = []
      if (spend > 200 && leads === 0 && !['IMPRESSIONS','REACH','LINK_CLICKS'].includes(optGoal)) issues.push('Sem conversões registradas')
      if (frequency > freqLimit && spend > 100) issues.push(`Frequência alta (${frequency}×)`)

      return {
        id: as.id, name: as.name,
        status: as.effective_status || as.status || 'ACTIVE',
        campaignId:   as.campaign_id,
        campaignName: campaignNameMap[as.campaign_id] || as.campaign_id,
        optimizationGoal:      optGoal,
        optimizationGoalLabel: OPTIMIZATION_GOAL_LABELS[optGoal] || optGoal || 'Não definido',
        dailyBudget:    parseFloat(as.daily_budget    || '0') / 100,
        lifetimeBudget: parseFloat(as.lifetime_budget || '0') / 100,
        hasRemarketing,
        spend, impressions, clicks, leads, cpl, ctr, frequency,
        issues,
      }
    })

    // ── Criativos (Ads) ──────────────────────────────────────────────────────
    const adsData    = adsRes.status    === 'fulfilled' ? adsRes.value    : { data: [] }
    const adsInsData = adsInsRes.status === 'fulfilled' ? adsInsRes.value : { data: [] }

    const adInsMap: Record<string, any> = {}
    for (const r of (adsInsData.data || [])) adInsMap[r.ad_id] = r

    const ads: AdCreative[] = (adsData.data || []).map((ad: any): AdCreative => {
      const ins = adInsMap[ad.id] || {}
      const creative   = ad.creative || {}
      const spend       = parseFloat(ins.spend || '0')
      const impressions = parseInt(ins.impressions || '0')
      const clicks      = parseInt(ins.clicks || '0')
      const frequency   = +parseFloat(ins.frequency || '0').toFixed(2)
      const formLeads   = extractConversions(ins.actions, LEAD_TYPES)
      const messages    = extractConversions(ins.actions, MSG_TYPES)
      const leads       = formLeads + messages
      const cpl         = leads > 0 ? +(spend / leads).toFixed(2) : 0
      const ctr         = impressions > 0 ? +((clicks / impressions) * 100).toFixed(2) : 0

      let tag: AdCreative['tag'] = 'ok'
      if (leads >= 3 && cpl > 0 && cpl < 200)    tag = 'winner'
      else if (spend > 100 && leads === 0)         tag = 'waste'
      else if (spend < 30)                          tag = 'learning'

      return {
        id: ad.id, name: ad.name,
        status: ad.effective_status || ad.status || 'ACTIVE',
        campaignId: ad.campaign_id,
        adsetId:    ad.adset_id,
        title:         creative.title         || '',
        body:          creative.body          || '',
        callToAction:  creative.call_to_action_type || '',
        imageUrl:      creative.image_url || creative.thumbnail_url || '',
        spend, impressions, clicks, frequency,
        leads, cpl, ctr, tag,
      }
    })

    // ── Pixel ────────────────────────────────────────────────────────────────
    const pixelRawData = pixelRes.status === 'fulfilled' ? pixelRes.value : { data: [] }
    let pixel: PixelInfo | null = null
    if ((pixelRawData.data || []).length > 0) {
      const px = pixelRawData.data[0]
      const lastFired = px.last_fired_time || null
      const isActive  = lastFired ? (Date.now() - new Date(lastFired).getTime()) < 48 * 3600000 : false
      pixel = {
        id:   px.id,
        name: px.name || 'Pixel Meta',
        lastFiredTime: lastFired,
        isActive,
        events: [], // events require separate call to /{pixel_id}/stats
      }
    }

    // ── Breakdown Geográfico ──────────────────────────────────────────────────
    const geoRawData = geoRes.status === 'fulfilled' ? geoRes.value : { data: [] }
    const geoBreakdown: GeoBreakdown[] = (geoRawData.data || [])
      .map((r: any) => {
        const spend = parseFloat(r.spend || '0')
        const leads = extractConversions(r.actions, [...LEAD_TYPES, ...MSG_TYPES])
        return {
          region: r.region || 'Desconhecido',
          spend,
          leads,
          cpl: leads > 0 ? +(spend / leads).toFixed(2) : 0,
          impressions: parseInt(r.impressions || '0'),
        }
      })
      .filter((r: GeoBreakdown) => r.spend > 0)
      .sort((a: GeoBreakdown, b: GeoBreakdown) => b.spend - a.spend)
      .slice(0, 15)

    // ── Breakdown por Plataforma ──────────────────────────────────────────────
    const platformRawData = platformRes.status === 'fulfilled' ? platformRes.value : { data: [] }
    const platformBreakdown: PlatformBreakdown[] = (platformRawData.data || [])
      .map((r: any) => {
        const spend = parseFloat(r.spend || '0')
        const leads = extractConversions(r.actions, [...LEAD_TYPES, ...MSG_TYPES])
        const impressions = parseInt(r.impressions || '0')
        const clicks = parseInt(r.clicks || '0')
        return {
          platform: r.publisher_platform || 'unknown',
          position: r.platform_position  || 'unknown',
          spend, leads,
          cpl:   leads > 0 ? +(spend / leads).toFixed(2) : 0,
          impressions, clicks,
          ctr: impressions > 0 ? +((clicks / impressions) * 100).toFixed(2) : parseFloat(r.ctr || '0'),
        }
      })
      .filter((r: PlatformBreakdown) => r.spend > 0)
      .sort((a: PlatformBreakdown, b: PlatformBreakdown) => b.spend - a.spend)

    // ── Breakdown Demográfico (Idade/Gênero) ──────────────────────────────────
    const demoRawData = demoRes.status === 'fulfilled' ? demoRes.value : { data: [] }
    const demoBreakdown: DemoBreakdown[] = (demoRawData.data || [])
      .map((r: any) => {
        const spend = parseFloat(r.spend || '0')
        const leads = extractConversions(r.actions, [...LEAD_TYPES, ...MSG_TYPES])
        return {
          age:    r.age    || 'unknown',
          gender: r.gender || 'unknown',
          spend, leads,
          cpl:   leads > 0 ? +(spend / leads).toFixed(2) : 0,
          impressions: parseInt(r.impressions || '0'),
        }
      })
      .filter((r: DemoBreakdown) => r.spend > 0)
      .sort((a: DemoBreakdown, b: DemoBreakdown) => b.spend - a.spend)

    // ── Agrupamento por objetivo ──────────────────────────────────────────────
    type ObjGroup = {
      label: string; count: number
      totalSpend: number; totalLeads: number; totalRevenue: number
      avgCPL: number; avgROAS: number; campaigns: string[]
    }
    const byObjective: Record<string, ObjGroup> = {}
    for (const c of campaigns) {
      if (!byObjective[c.objective]) byObjective[c.objective] = { label: c.objectiveLabel, count: 0, totalSpend: 0, totalLeads: 0, totalRevenue: 0, avgCPL: 0, avgROAS: 0, campaigns: [] }
      const g = byObjective[c.objective]
      g.count++; g.totalSpend += c.spend30; g.totalLeads += c.leads30; g.totalRevenue += c.revenue30; g.campaigns.push(c.name)
    }
    for (const g of Object.values(byObjective)) {
      g.avgCPL  = g.totalLeads  > 0 ? +(g.totalSpend / g.totalLeads).toFixed(2)  : 0
      g.avgROAS = g.totalSpend  > 0 && g.totalRevenue > 0 ? +(g.totalRevenue / g.totalSpend).toFixed(2) : 0
    }

    // ── Totais ────────────────────────────────────────────────────────────────
    const activeCampaigns    = campaigns.filter(c => c.status !== 'PAUSED' && c.spend30 > 0)
    const learningCampaigns  = campaigns.filter(c => c.learningPhase === 'learning' || c.learningPhase === 'learning_limited')
    const totalSpend         = campaigns.reduce((s, c) => s + c.spend30,   0)
    const totalLeads         = campaigns.reduce((s, c) => s + c.leads30,   0)
    const totalRevenue       = campaigns.reduce((s, c) => s + c.revenue30, 0)
    const totalMessages      = campaigns.reduce((s, c) => s + c.messages30, 0)
    const avgCTR             = activeCampaigns.length > 0 ? activeCampaigns.reduce((s, c) => s + c.ctr30, 0) / activeCampaigns.length : 0
    const avgFrequency       = activeCampaigns.length > 0 ? activeCampaigns.reduce((s, c) => s + c.frequency, 0) / activeCampaigns.length : 0

    // ── Score ─────────────────────────────────────────────────────────────────
    let score = 65
    if (avgCTR >= 2.0)        score += 12; else if (avgCTR >= 1.0) score += 6; else if (avgCTR < 0.5) score -= 12
    if (avgFrequency < 2.5)   score += 8;  else if (avgFrequency > 5) score -= 12; else if (avgFrequency > 3.5) score -= 5
    const issueRatio = campaigns.length > 0 ? campaigns.filter(c => c.issues.length > 0).length / campaigns.length : 0
    if (issueRatio < 0.2)     score += 10; else if (issueRatio > 0.5) score -= 15
    const learningRatio = activeCampaigns.length > 0 ? learningCampaigns.length / activeCampaigns.length : 0
    if (learningRatio > 0.6)  score -= 10; else if (learningRatio < 0.2 && activeCampaigns.length > 0) score += 5
    if (totalRevenue > 0 && totalSpend > 0 && (totalRevenue / totalSpend) >= 3) score += 10
    // Bonus: tem remarketing estruturado
    const hasRemarketingAdSets = adSets.some(as => as.hasRemarketing)
    if (hasRemarketingAdSets) score += 5
    // Bonus: pixel ativo
    if (pixel?.isActive) score += 5
    score = Math.max(20, Math.min(99, Math.round(score)))
    const scoreGrade = score >= 90 ? 'A+' : score >= 85 ? 'A' : score >= 80 ? 'A-' : score >= 75 ? 'B+' : score >= 70 ? 'B' : score >= 65 ? 'B-' : score >= 55 ? 'C+' : score >= 45 ? 'C' : 'D'

    // ── Recomendações globais ─────────────────────────────────────────────────
    const globalRecs: Array<{ type: RecType; title: string; description: string }> = []

    const limitedC = campaigns.filter(c => c.learningPhase === 'learning_limited')
    if (limitedC.length > 0) globalRecs.push({ type: 'critical',
      title: `${limitedC.length} campanha(s) com aprendizado limitado`,
      description: 'Aumente o orçamento, amplie a audiência ou revise o evento de conversão.' })

    const wasteC = campaigns.filter(c => c.spend30 > 300 && c.leads30 === 0 && c.revenue30 === 0 && c.messages30 === 0)
    if (wasteC.length > 0) globalRecs.push({ type: 'critical',
      title: `R$${wasteC.reduce((s,c)=>s+c.spend30,0).toFixed(0)} em campanhas sem conversão`,
      description: `${wasteC.length} campanha(s) sem leads. Verifique pixel e evento de conversão.` })

    const wasteAds = ads.filter(a => a.tag === 'waste')
    if (wasteAds.length > 0) globalRecs.push({ type: 'critical',
      title: `${wasteAds.length} criativo(s) com gasto sem conversão`,
      description: `Pausar: ${wasteAds.slice(0,3).map(a=>`"${a.name}"`).join(', ')} — realoque verba para os criativos vencedores.` })

    const highFreqC = campaigns.filter(c => c.frequency > freqLimit && c.spend30 > 200)
    if (highFreqC.length > 0) globalRecs.push({ type: 'warning',
      title: `${highFreqC.length} campanha(s) com frequência acima de ${freqLimit}×`,
      description: 'Audiência saturada eleva CPL e reduz CTR. Renove criativos ou expanda público.' })

    if (!hasRemarketingAdSets) globalRecs.push({ type: 'warning',
      title: 'Sem estrutura de remarketing detectada',
      description: 'Crie ad sets com públicos de visitantes 7d, 30d e leads não convertidos — CPL de remarketing tende a ser 40-60% menor.' })

    if (pixel && !pixel.isActive) globalRecs.push({ type: 'warning',
      title: 'Pixel sem disparos recentes (>48h)',
      description: `Último disparo: ${pixel.lastFiredTime ? new Date(pixel.lastFiredTime).toLocaleDateString('pt-BR') : 'nunca'}. Verifique se o pixel está instalado corretamente.` })

    const winnerAds = ads.filter(a => a.tag === 'winner')
    if (winnerAds.length > 0) globalRecs.push({ type: 'opportunity',
      title: `${winnerAds.length} criativo(s) vencedor(es) — escalar agora`,
      description: `${winnerAds.slice(0,3).map(a=>`"${a.name}" (CPL R$${a.cpl})`).join(', ')} — aumente o orçamento desses ad sets.` })

    // Best geo
    const geoWithLeads = geoBreakdown.filter(g => g.leads > 0).sort((a,b) => a.cpl - b.cpl)
    if (geoWithLeads.length > 0) globalRecs.push({ type: 'opportunity',
      title: `"${geoWithLeads[0].region}" com CPL mais baixo (R$${geoWithLeads[0].cpl})`,
      description: `Concentre mais budget nessa região para reduzir o CPL médio da conta.` })

    // ── Previous period ────────────────────────────────────────────────────────
    const prevSpend = Object.values(insPrevMap).reduce((s: number, c: any) => s + parseFloat(c.spend || '0'), 0)
    const prevLeads = Object.values(insPrevMap).reduce((s: number, c: any) => {
      return s + extractConversions(c.actions, LEAD_TYPES) + extractConversions(c.actions, MSG_TYPES)
    }, 0)
    const prevCpl = prevLeads > 0 ? +(prevSpend / prevLeads).toFixed(2) : 0
    const pctDelta = (curr: number, prev: number) => prev > 0 ? +((curr - prev) / prev * 100).toFixed(1) : null

    return NextResponse.json({
      success: true, score, scoreGrade,
      campaigns, byObjective,
      adSets, ads,
      pixel,
      geoBreakdown, platformBreakdown, demoBreakdown,
      totals: {
        spend: totalSpend, leads: totalLeads, revenue: totalRevenue, messages: totalMessages,
        roas:  totalSpend > 0 && totalRevenue > 0 ? +(totalRevenue / totalSpend).toFixed(2) : 0,
        cpl:   totalLeads > 0 ? +(totalSpend / totalLeads).toFixed(2) : totalMessages > 0 ? +(totalSpend / totalMessages).toFixed(2) : 0,
        avgCTR: +avgCTR.toFixed(2), avgFrequency: +avgFrequency.toFixed(1),
        activeCampaigns: activeCampaigns.length,
        learningCampaigns: learningCampaigns.length,
        totalCampaigns: campaigns.length,
        totalAdSets: adSets.length,
        totalAds: ads.length,
      },
      previousTotals: {
        spend: +prevSpend.toFixed(2), leads: prevLeads, cpl: prevCpl,
        spendDelta: pctDelta(totalSpend, prevSpend),
        leadsDelta: pctDelta(totalLeads, prevLeads),
        cplDelta:   pctDelta(totalLeads > 0 ? totalSpend / totalLeads : 0, prevCpl),
      },
      freqThreshold: freqLimit,
      globalRecs,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
