// app/api/ads-data/meta-intelligence/route.ts
// Meta Ad Intelligence — campanhas + ad sets + criativos + pixel + breakdowns geográfico/plataforma/demo
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getValidMetaToken, metaTokenErrorToResponse } from '@/services/meta/token-manager'
import {classifyMetaCreative,creativeImage,type CreativeFormat} from '@/lib/performance/creative'
import {resolveReportingPeriod,previousReportingPeriod} from '@/lib/reporting-period'
import { summarizeMetaResults } from '@/lib/metaResults'

// ~13 chamadas paralelas ao Meta (cada uma até 20s) + breakdowns. Sem maxDuration a
// função caía no limite padrão e dava 504 em contas grandes (ex.: 50 campanhas/100 ads),
// voltando vazio. Igual às outras rotas pesadas do projeto.
export const maxDuration = 300

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
  results: number; resultLabel: string; resultType: string; costPerResult: number
  resultBreakdown: any[]
  formLeads: number; websiteLeads: number; whatsappConversations: number
  messengerConversations: number; instagramDirectConversations: number
  messageConversations: number; phoneCalls: number; purchases: number
  spend: number; impressions: number; clicks: number
  leads: number; cpl: number; ctr: number; frequency: number
  issues: string[]
}

interface AdCreative {
  id: string; name: string; status: string
  campaignId: string; adsetId: string
  creativeId: string
  title: string; body: string; callToAction: string
  imageUrl: string
  creativeUrl: string
  creativeUrlLabel: string
  creativeUrlSource: 'preview' | 'instagram' | 'post' | 'destination' | 'none'
  previewUrl: string
  destinationUrl: string
  objectStoryId: string
  format: CreativeFormat
  createdTime: string | null
  ageDays: number | null
  results: number; resultLabel: string; resultType: string; costPerResult: number
  resultBreakdown: any[]
  formLeads: number; websiteLeads: number; whatsappConversations: number
  messengerConversations: number; instagramDirectConversations: number
  messageConversations: number; phoneCalls: number; purchases: number
  spend: number; impressions: number; clicks: number
  leads: number; cpl: number; ctr: number; frequency: number
  tag: 'winner' | 'waste' | 'learning' | 'ok'
}

// Meta devolve image_url/thumbnail_url nulo p/ vídeo, carrossel e criativo dinâmico
// (Advantage+). Resolve a MELHOR imagem disponível pra exibir o criativo de verdade.
function resolveCreativeImage(creative:any){return {url:creativeImage(creative),format:classifyMetaCreative(creative)}}

function cleanUrl(value: any): string {
  const url = typeof value === 'string' ? value.trim() : ''
  return /^https?:\/\//i.test(url) ? url : ''
}

function storyPermalink(storyId: any): string {
  const raw = typeof storyId === 'string' ? storyId.trim() : ''
  const [pageId, postId] = raw.split('_')
  if (!pageId || !postId) return ''
  return `https://www.facebook.com/${pageId}/posts/${postId}`
}

function resolveCreativeUrl(ad: any, creative: any): Pick<AdCreative, 'creativeUrl' | 'creativeUrlLabel' | 'creativeUrlSource' | 'previewUrl' | 'destinationUrl' | 'objectStoryId'> {
  const oss = creative?.object_story_spec || {}
  const previewUrl = cleanUrl(ad?.preview_shareable_link)
  const instagramUrl = cleanUrl(creative?.instagram_permalink_url)
  const objectStoryId = String(creative?.effective_object_story_id || creative?.object_story_id || '')
  const postUrl = storyPermalink(objectStoryId)
  const destinationUrl = cleanUrl(
    creative?.object_url ||
    oss?.link_data?.link ||
    oss?.video_data?.call_to_action?.value?.link ||
    oss?.link_data?.child_attachments?.find?.((c: any) => cleanUrl(c?.link))?.link
  )

  if (previewUrl) return { creativeUrl: previewUrl, creativeUrlLabel: 'Prévia do anúncio', creativeUrlSource: 'preview', previewUrl, destinationUrl, objectStoryId }
  if (instagramUrl) return { creativeUrl: instagramUrl, creativeUrlLabel: 'Post do Instagram', creativeUrlSource: 'instagram', previewUrl, destinationUrl, objectStoryId }
  if (postUrl) return { creativeUrl: postUrl, creativeUrlLabel: 'Post do Facebook', creativeUrlSource: 'post', previewUrl, destinationUrl, objectStoryId }
  if (destinationUrl) return { creativeUrl: destinationUrl, creativeUrlLabel: 'Destino do anúncio', creativeUrlSource: 'destination', previewUrl, destinationUrl, objectStoryId }

  return { creativeUrl: '', creativeUrlLabel: '', creativeUrlSource: 'none', previewUrl, destinationUrl, objectStoryId }
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
  results30: number; resultLabel: string; resultType: string; costPerResult: number
  resultBreakdown: any[]
  formLeads30: number; websiteLeads30: number; whatsappConversations30: number
  messengerConversations30: number; instagramDirectConversations30: number
  messageConversations30: number; phoneCalls30: number
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

const NICHE_FREQ_THRESHOLD: Record<string, number> = {
  'E-commerce': 5, 'Varejo': 5, 'Infoproduto': 3, 'Curso Online': 3,
  'Clínica / Saúde': 3.5, 'Imóveis': 3, 'Advocacia': 3,
  'Restaurante': 4, 'SaaS / Tech': 4, 'Serviços Locais': 3.5,
  'Franquia': 3, 'Franquias': 3,
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

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })

  try {
    const body = await req.json().catch(() => ({}))
    const niche         = (body.niche as string) || ''
    const bodyAccountId = body.accountId as string | undefined

    let accessToken: string
    let accountId: string | null
    try {
      const tokenData = await getValidMetaToken(userId)
      accessToken = tokenData.accessToken
      accountId   = bodyAccountId || tokenData.accountId
    } catch (err) {
      const { error, code } = metaTokenErrorToResponse(err)
      return NextResponse.json({ success: false, error, code }, { status: 401 })
    }

    if (!accountId) {
      return NextResponse.json({ success: false, error: 'Ad Account ID não encontrado', code: 'NO_ACCOUNT_ID' }, { status: 400 })
    }

    const freqLimit = freqThreshold(niche)
    const baseUrl   = `https://graph.facebook.com/v21.0`
    const act       = `act_${String(accountId).replace(/^act_/, '')}`
    const token     = encodeURIComponent(accessToken)

    const period=resolveReportingPeriod(body),previous=previousReportingPeriod(period)
    const currentRange=encodeURIComponent(JSON.stringify({since:period.startDate,until:period.endDate}))
    const prevRange=encodeURIComponent(JSON.stringify({since:previous.startDate,until:previous.endDate}))
    const weekStart=new Date(Date.parse(period.endDate+'T00:00:00Z')-6*86400000).toISOString().slice(0,10)
    const weekRange=encodeURIComponent(JSON.stringify({since:weekStart<period.startDate?period.startDate:weekStart,until:period.endDate}))

    const insightFields = 'campaign_id,campaign_name,spend,impressions,clicks,inline_link_clicks,reach,frequency,actions,action_values,cost_per_action_type'
    const adsetInsightFields = 'adset_id,adset_name,campaign_id,spend,impressions,clicks,inline_link_clicks,reach,frequency,actions,action_values'
    const adInsightFields    = 'ad_id,ad_name,campaign_id,adset_id,spend,impressions,clicks,inline_link_clicks,reach,frequency,actions,action_values'
    const actionBreakdowns = '&action_breakdowns=action_type,action_destination'
    const adFieldsBase       = 'id,name,status,effective_status,campaign_id,adset_id,created_time,creative{id,title,body,video_id,object_type,call_to_action_type,image_url,thumbnail_url,object_story_spec{link_data{picture,child_attachments{picture}},video_data{image_url}},asset_feed_spec{images{url},videos{thumbnail_url}}}'
    const adFieldsWithLinks  = 'id,name,status,effective_status,campaign_id,adset_id,created_time,preview_shareable_link,creative{id,title,body,video_id,object_type,call_to_action_type,image_url,thumbnail_url,effective_object_story_id,object_story_id,instagram_permalink_url,object_url,object_story_spec{link_data{link,picture,child_attachments{link,picture}},video_data{image_url,call_to_action{value{link}}}},asset_feed_spec{images{url},videos{thumbnail_url}}}'

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
      fetch(`${baseUrl}/${act}/insights?fields=${insightFields}&time_range=${currentRange}&level=campaign${actionBreakdowns}&limit=50&access_token=${token}`, { signal: AbortSignal.timeout(15000) }).then(r => r.json()),
      // 3 - insights 7d por campanha
      fetch(`${baseUrl}/${act}/insights?fields=campaign_id,spend,impressions,clicks,inline_link_clicks,reach,actions,action_values&time_range=${weekRange}&level=campaign${actionBreakdowns}&limit=50&access_token=${token}`, { signal: AbortSignal.timeout(15000) }).then(r => r.json()),
      // 4 - insights período anterior (30-60d)
      fetch(`${baseUrl}/${act}/insights?fields=campaign_id,spend,actions,action_values,impressions,clicks,inline_link_clicks,reach,frequency&time_range=${prevRange}&level=campaign${actionBreakdowns}&limit=50&access_token=${token}`, { signal: AbortSignal.timeout(15000) }).then(r => r.json()),
      // 5 - ad sets (metadados)
      fetch(`${baseUrl}/${act}/adsets?fields=id,name,status,effective_status,optimization_goal,daily_budget,lifetime_budget,campaign_id,targeting&limit=100&access_token=${token}`, { signal: AbortSignal.timeout(15000) }).then(r => r.json()),
      // 6 - insights de ad sets
      fetch(`${baseUrl}/${act}/insights?fields=${adsetInsightFields}&time_range=${currentRange}&level=adset${actionBreakdowns}&limit=100&access_token=${token}`, { signal: AbortSignal.timeout(15000) }).then(r => r.json()),
      // 7 - ads/criativos (metadados)
      fetch(`${baseUrl}/${act}/ads?fields=${adFieldsWithLinks}&limit=80&access_token=${token}`, { signal: AbortSignal.timeout(20000) }).then(r => r.json()),
      // 8 - insights de ads
      fetch(`${baseUrl}/${act}/insights?fields=${adInsightFields}&time_range=${currentRange}&level=ad${actionBreakdowns}&limit=100&access_token=${token}`, { signal: AbortSignal.timeout(20000) }).then(r => r.json()),
      // 9 - pixels (endpoint correto: adspixels)
      fetch(`${baseUrl}/${act}/adspixels?fields=id,name,last_fired_time,is_unavailable&access_token=${token}`, { signal: AbortSignal.timeout(10000) }).then(r => r.json()),
      // 10 - breakdown geográfico
      fetch(`${baseUrl}/${act}/insights?fields=spend,actions,action_values,impressions,clicks,reach&breakdowns=region&time_range=${currentRange}${actionBreakdowns}&limit=50&access_token=${token}`, { signal: AbortSignal.timeout(15000) }).then(r => r.json()),
      // 11 - breakdown por plataforma
      fetch(`${baseUrl}/${act}/insights?fields=spend,actions,action_values,impressions,clicks,reach,ctr&breakdowns=publisher_platform,platform_position&time_range=${currentRange}${actionBreakdowns}&limit=50&access_token=${token}`, { signal: AbortSignal.timeout(15000) }).then(r => r.json()),
      // 12 - breakdown por idade/gênero
      fetch(`${baseUrl}/${act}/insights?fields=spend,actions,action_values,impressions,clicks,reach&breakdowns=age,gender&time_range=${currentRange}${actionBreakdowns}&limit=100&access_token=${token}`, { signal: AbortSignal.timeout(15000) }).then(r => r.json()),
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

      // Objetivo determina qual métrica é o resultado real da campanha
      const objective   = (meta.objective || 'UNKNOWN').toUpperCase()
      const result30 = summarizeMetaResults({
        objective,
        actions: row.actions,
        actionValues: row.action_values,
        spend: spend30,
        clicks,
        inlineLinkClicks: parseInt(row.inline_link_clicks || '0'),
        impressions,
        reach,
      })
      const purchases30 = result30.purchases
      const revenue30   = result30.revenue
      const messages30  = result30.totalMessages
      const formLeads30 = result30.formLeads
      const leads30     = result30.leads + result30.totalMessages + result30.phoneCalls
      const videoViews30 = extractConversions(row.actions, ['video_view', 'video_thruplay_watched_actions'])

      const row7        = ins7Map[row.campaign_id] || {}
      const spend7      = parseFloat(row7.spend || '0')
      const result7     = summarizeMetaResults({
        objective,
        actions: row7.actions,
        actionValues: row7.action_values,
        spend: spend7,
        clicks: parseInt(row7.clicks || '0'),
        inlineLinkClicks: parseInt(row7.inline_link_clicks || '0'),
        impressions: parseInt(row7.impressions || '0'),
        reach: parseInt(row7.reach || '0'),
      })
      const leads7      = result7.leads + result7.totalMessages + result7.phoneCalls
      const purchases7  = result7.purchases
      const conversions7 = leads7 + purchases7

      const roas30 = spend30 > 0 && revenue30 > 0 ? +(revenue30 / spend30).toFixed(2) : 0
      const cpl30  = leads30  > 0 ? +(spend30 / leads30).toFixed(2) : 0
      const cpc30  = clicks   > 0 ? +(spend30 / clicks).toFixed(2) : 0
      const ctr30  = impressions > 0 ? +((clicks / impressions) * 100).toFixed(2) : 0
      const cpm30  = impressions > 0 ? +((spend30 / impressions) * 1000).toFixed(2) : 0
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
        ctr30, cpc30, cpm30,
        results30: result30.primaryResultValue,
        resultLabel: result30.primaryResultLabel,
        resultType: result30.primaryResultKey,
        costPerResult: result30.costPerResult,
        resultBreakdown: result30.resultBreakdown,
        formLeads30,
        websiteLeads30: result30.websiteLeads,
        whatsappConversations30: result30.whatsappConversations,
        messengerConversations30: result30.messengerConversations,
        instagramDirectConversations30: result30.instagramDirectConversations,
        messageConversations30: result30.messageConversations,
        phoneCalls30: result30.phoneCalls,
        leads30, cpl30, purchases30,
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
      const asObjKey      = (campaignMeta[as.campaign_id]?.objective || '').toUpperCase()
      const result        = summarizeMetaResults({
        objective: asObjKey,
        actions: ins.actions,
        actionValues: ins.action_values,
        spend,
        clicks,
        inlineLinkClicks: parseInt(ins.inline_link_clicks || '0'),
        impressions,
        reach: parseInt(ins.reach || '0'),
      })
      const leads         = result.leads + result.totalMessages + result.phoneCalls
      const cpl           = leads > 0 ? +(spend / leads).toFixed(2) : 0
      const ctr           = impressions > 0 ? +((clicks / impressions) * 100).toFixed(2) : 0

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
        results: result.primaryResultValue,
        resultLabel: result.primaryResultLabel,
        resultType: result.primaryResultKey,
        costPerResult: result.costPerResult,
        resultBreakdown: result.resultBreakdown,
        formLeads: result.formLeads,
        websiteLeads: result.websiteLeads,
        whatsappConversations: result.whatsappConversations,
        messengerConversations: result.messengerConversations,
        instagramDirectConversations: result.instagramDirectConversations,
        messageConversations: result.messageConversations,
        phoneCalls: result.phoneCalls,
        purchases: result.purchases,
        spend, impressions, clicks, leads, cpl, ctr, frequency,
        issues,
      }
    })

    // ── Criativos (Ads) ──────────────────────────────────────────────────────
    let adsData      = adsRes.status    === 'fulfilled' ? adsRes.value    : { data: [] }
    const adsInsData = adsInsRes.status === 'fulfilled' ? adsInsRes.value : { data: [] }
    // Distingue "zero criativos" de "a busca falhou" (timeout/erro do Meta) — senão a UI
    // mostra "nenhum criativo" quando na verdade deu erro.
    let adsError: string | null = adsRes.status === 'rejected'
      ? (adsRes.reason?.name === 'TimeoutError' ? 'Tempo esgotado ao buscar os criativos. Tente recarregar.' : 'Falha ao buscar os criativos no Meta.')
      : (adsData?.error?.message || null)

    if (adsError) {
      try {
        const fallback = await fetch(`${baseUrl}/${act}/ads?fields=${adFieldsBase}&limit=80&access_token=${token}`, { signal: AbortSignal.timeout(20000) }).then(r => r.json())
        if (!fallback?.error) {
          adsData = fallback
          adsError = null
        } else {
          adsError = fallback.error.message || adsError
        }
      } catch {
        // Mantém a mensagem original.
      }
    }

    const adInsMap: Record<string, any> = {}
    for (const r of (adsInsData.data || [])) adInsMap[r.ad_id] = r

    const ads: AdCreative[] = (adsData.data || []).map((ad: any): AdCreative => {
      const ins = adInsMap[ad.id] || {}
      const creative   = ad.creative || {}
      const spend       = parseFloat(ins.spend || '0')
      const impressions = parseInt(ins.impressions || '0')
      const clicks      = parseInt(ins.clicks || '0')
      const frequency   = +parseFloat(ins.frequency || '0').toFixed(2)
      const adObjKey      = (campaignMeta[ad.campaign_id]?.objective || '').toUpperCase()
      const result        = summarizeMetaResults({
        objective: adObjKey,
        actions: ins.actions,
        actionValues: ins.action_values,
        spend,
        clicks,
        inlineLinkClicks: parseInt(ins.inline_link_clicks || '0'),
        impressions,
        reach: parseInt(ins.reach || '0'),
      })
      const leads         = result.leads + result.totalMessages + result.phoneCalls
      const cpl           = leads > 0 ? +(spend / leads).toFixed(2) : 0
      const ctr           = impressions > 0 ? +((clicks / impressions) * 100).toFixed(2) : 0

      let tag: AdCreative['tag'] = 'ok'
      if (leads >= 3 && cpl > 0 && cpl < 200)    tag = 'winner'
      else if (spend > 100 && leads === 0)         tag = 'waste'
      else if (spend < 30)                          tag = 'learning'

      const { url: imageUrl, format } = resolveCreativeImage(creative)
      const link = resolveCreativeUrl(ad, creative)
      const createdTime = ad.created_time || null
      const ageDays = createdTime ? Math.floor((Date.now() - new Date(createdTime).getTime()) / 86400000) : null

      return {
        id: ad.id, name: ad.name,
        status: ad.effective_status || ad.status || 'ACTIVE',
        campaignId: ad.campaign_id,
        adsetId:    ad.adset_id,
        creativeId:  creative.id || '',
        title:         creative.title         || '',
        body:          creative.body          || '',
        callToAction:  creative.call_to_action_type || '',
        imageUrl,
        ...link,
        format,
        createdTime,
        ageDays,
        results: result.primaryResultValue,
        resultLabel: result.primaryResultLabel,
        resultType: result.primaryResultKey,
        costPerResult: result.costPerResult,
        resultBreakdown: result.resultBreakdown,
        formLeads: result.formLeads,
        websiteLeads: result.websiteLeads,
        whatsappConversations: result.whatsappConversations,
        messengerConversations: result.messengerConversations,
        instagramDirectConversations: result.instagramDirectConversations,
        messageConversations: result.messageConversations,
        phoneCalls: result.phoneCalls,
        purchases: result.purchases,
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
        const spend   = parseFloat(r.spend || '0')
        const result  = summarizeMetaResults({
          actions: r.actions,
          actionValues: r.action_values,
          spend,
          clicks: parseInt(r.clicks || '0'),
          impressions: parseInt(r.impressions || '0'),
          reach: parseInt(r.reach || '0'),
        })
        const leads   = result.leads + result.totalMessages + result.phoneCalls
        return {
          region: r.region || 'Desconhecido',
          spend,
          leads,
          results: result.primaryResultValue,
          resultLabel: result.primaryResultLabel,
          resultBreakdown: result.resultBreakdown,
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
        const spend       = parseFloat(r.spend || '0')
        const impressions = parseInt(r.impressions || '0')
        const clicks      = parseInt(r.clicks || '0')
        const result      = summarizeMetaResults({ actions: r.actions, actionValues: r.action_values, spend, clicks, impressions, reach: parseInt(r.reach || '0') })
        const leads       = result.leads + result.totalMessages + result.phoneCalls
        return {
          platform: r.publisher_platform || 'unknown',
          position: r.platform_position  || 'unknown',
          spend, leads,
          results: result.primaryResultValue,
          resultLabel: result.primaryResultLabel,
          resultBreakdown: result.resultBreakdown,
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
        const spend  = parseFloat(r.spend || '0')
        const result = summarizeMetaResults({ actions: r.actions, actionValues: r.action_values, spend, clicks: parseInt(r.clicks || '0'), impressions: parseInt(r.impressions || '0'), reach: parseInt(r.reach || '0') })
        const leads  = result.leads + result.totalMessages + result.phoneCalls
        return {
          age:    r.age    || 'unknown',
          gender: r.gender || 'unknown',
          spend, leads,
          results: result.primaryResultValue,
          resultLabel: result.primaryResultLabel,
          resultBreakdown: result.resultBreakdown,
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
    const totalSpend         = campaigns.reduce((s, c) => s + c.spend30,      0)
    const totalLeads         = campaigns.reduce((s, c) => s + c.leads30,      0)
    const totalResults       = campaigns.reduce((s, c) => s + c.results30,    0)
    const totalRevenue       = campaigns.reduce((s, c) => s + c.revenue30,    0)
    const totalMessages      = campaigns.reduce((s, c) => s + (Number(c.messages30) || 0),   0)
    const totalClicks        = campaigns.reduce((s, c) => s + (Number(c.clicks) || 0),       0)
    const totalImpressions   = campaigns.reduce((s, c) => s + (Number(c.impressions) || 0),  0)
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
      const result = summarizeMetaResults({
        actions: c.actions,
        actionValues: c.action_values,
        spend: parseFloat(c.spend || '0'),
        clicks: parseInt(c.clicks || '0'),
        impressions: parseInt(c.impressions || '0'),
        reach: parseInt(c.reach || '0'),
      })
      return s + result.leads + result.totalMessages + result.phoneCalls
    }, 0)
    const prevImpressions = Object.values(insPrevMap).reduce((s: number, c: any) => s + parseInt(c.impressions || '0'), 0)
    const prevClicks      = Object.values(insPrevMap).reduce((s: number, c: any) => s + parseInt(c.clicks || '0'), 0)
    const prevFreqValues  = Object.values(insPrevMap).map((c: any) => parseFloat(c.frequency || '0')).filter(f => f > 0)
    const prevCpl         = prevLeads > 0 ? +(prevSpend / prevLeads).toFixed(2) : 0
    const prevRevenue     = Object.values(insPrevMap).reduce((s: number, c: any) => s + summarizeMetaResults({ actions: c.actions, actionValues: c.action_values }).revenue, 0)
    const prevRoas        = prevSpend > 0 && prevRevenue > 0 ? +(prevRevenue / prevSpend).toFixed(2) : 0
    const prevCTR         = prevImpressions > 0 ? +(prevClicks / prevImpressions * 100).toFixed(2) : 0
    const prevCPC         = prevClicks > 0 ? +(prevSpend / prevClicks).toFixed(2) : 0
    const prevCPM         = prevImpressions > 0 ? +(prevSpend / prevImpressions * 1000).toFixed(2) : 0
    const prevFreq        = prevFreqValues.length > 0 ? +(prevFreqValues.reduce((s, f) => s + f, 0) / prevFreqValues.length).toFixed(1) : 0

    const pctDelta = (curr: number, prev: number) => prev > 0 ? +((curr - prev) / prev * 100).toFixed(1) : null

    const currCTR = avgCTR
    const currCPC = totalClicks > 0 ? +(totalSpend / totalClicks).toFixed(2) : 0
    const currCPM = totalImpressions > 0 ? +(totalSpend / totalImpressions * 1000).toFixed(2) : 0
    const currRoas = totalSpend > 0 && totalRevenue > 0 ? +(totalRevenue / totalSpend).toFixed(2) : 0

    return NextResponse.json({
      success: true, period, previousPeriod:previous, score, scoreGrade,
      campaigns, byObjective,
      adSets, ads, adsError,
      pixel,
      geoBreakdown, platformBreakdown, demoBreakdown,
      totals: {
        spend: totalSpend, leads: totalLeads, revenue: totalRevenue, messages: totalMessages,
        results: totalResults,
        totalResults,
        resultLabel: 'Resultados',
        costPerResult: totalResults > 0 ? +(totalSpend / totalResults).toFixed(2) : 0,
        roas:  currRoas,
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
        ctrDelta:   pctDelta(currCTR, prevCTR),
        freqDelta:  pctDelta(avgFrequency, prevFreq),
        cpcDelta:   pctDelta(currCPC, prevCPC),
        cpmDelta:   pctDelta(currCPM, prevCPM),
        roasDelta:  pctDelta(currRoas, prevRoas),
      },
      freqThreshold: freqLimit,
      globalRecs,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
