export type MetaResultKey =
  | 'meta_lead'
  | 'form_lead'
  | 'website_lead'
  | 'whatsapp_conversation'
  | 'messenger_conversation'
  | 'instagram_direct_conversation'
  | 'message_conversation'
  | 'phone_call'
  | 'purchase'
  | 'app_install'
  | 'store_visit'
  | 'landing_page_view'
  | 'link_click'
  | 'post_engagement'
  | 'video_view'
  | 'reach'
  | 'impression'
  | 'other'

export type MetaAction = {
  action_type?: string
  value?: string | number
  action_destination?: string
}

export type MetaActionValue = {
  action_type?: string
  value?: string | number
}

export type MetaResultBreakdownItem = {
  key: MetaResultKey
  label: string
  value: number
  cost: number | null
}

export type MetaResultSummary = {
  objective: string
  objectiveLabel: string
  primaryResultKey: MetaResultKey
  primaryResultLabel: string
  primaryResultValue: number
  costPerResult: number
  formLeads: number
  websiteLeads: number
  leads: number
  whatsappConversations: number
  messengerConversations: number
  instagramDirectConversations: number
  messageConversations: number
  totalMessages: number
  phoneCalls: number
  purchases: number
  appInstalls: number
  storeVisits: number
  landingPageViews: number
  linkClicks: number
  postEngagements: number
  videoViews: number
  reachResults: number
  impressionResults: number
  revenue: number
  resultBreakdown: MetaResultBreakdownItem[]
}

export const META_OBJECTIVE_LABELS: Record<string, string> = {
  OUTCOME_AWARENESS: 'Reconhecimento',
  OUTCOME_TRAFFIC: 'Tráfego',
  OUTCOME_ENGAGEMENT: 'Engajamento',
  OUTCOME_LEADS: 'Leads',
  OUTCOME_APP_PROMOTION: 'Promoção de app',
  OUTCOME_SALES: 'Vendas',

  BRAND_AWARENESS: 'Reconhecimento de marca',
  REACH: 'Alcance',
  TRAFFIC: 'Tráfego',
  LINK_CLICKS: 'Cliques no link',
  POST_ENGAGEMENT: 'Engajamento em post',
  PAGE_LIKES: 'Curtidas na página',
  EVENT_RESPONSES: 'Respostas a evento',
  OFFER_CLAIMS: 'Resgates de oferta',
  VIDEO_VIEWS: 'Visualizações de vídeo',
  LEAD_GENERATION: 'Formulários de lead',
  MESSAGES: 'Mensagens',
  CONVERSIONS: 'Conversões',
  PRODUCT_CATALOG_SALES: 'Vendas por catálogo',
  APP_INSTALLS: 'Instalações de app',
  STORE_VISITS: 'Visitas à loja',
  LOCAL_AWARENESS: 'Reconhecimento local',
}

export const META_RESULT_LABELS: Record<MetaResultKey, string> = {
  meta_lead: 'Leads atribuídos pelo Meta',
  form_lead: 'Formulários',
  website_lead: 'Leads do site',
  whatsapp_conversation: 'Conversas no WhatsApp',
  messenger_conversation: 'Conversas no Messenger',
  instagram_direct_conversation: 'Conversas no Instagram',
  message_conversation: 'Conversas por mensagem',
  phone_call: 'Ações de ligação',
  purchase: 'Compras',
  app_install: 'Instalações de app',
  store_visit: 'Visitas à loja',
  landing_page_view: 'Visualizações da página',
  link_click: 'Cliques no link',
  post_engagement: 'Engajamentos',
  video_view: 'Visualizações de vídeo',
  reach: 'Pessoas alcançadas',
  impression: 'Impressões',
  other: 'Resultados',
}

const FORM_LEAD_TYPES = ['onsite_conversion.lead_grouped', 'onsite_conversion.leadgen_grouped']
const WEBSITE_LEAD_TYPES = ['offsite_conversion.fb_pixel_lead']
const MESSAGE_PRIORITY = [
  'onsite_conversion.messaging_conversation_started_7d',
  'onsite_conversion.messaging_conversation_started',
  'messaging_conversation_started',
]
const PURCHASE_TYPES = ['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase']
const APP_INSTALL_TYPES = ['mobile_app_install', 'app_install', 'omni_app_install']
const STORE_VISIT_TYPES = ['store_visit', 'offline_conversion.store_visit']
const LANDING_PAGE_VIEW_TYPES = ['landing_page_view']
const LINK_CLICK_TYPES = ['link_click', 'inline_link_click']
const POST_ENGAGEMENT_TYPES = ['post_engagement', 'page_engagement']
const VIDEO_VIEW_TYPES = ['video_view', 'thruplay', 'video_thruplay_watched_actions']

const val = (v: unknown): number => {
  const n = Number(v || 0)
  return Number.isFinite(n) ? n : 0
}

const sumExact = (actions: MetaAction[] | undefined, types: string[]): number =>
  (actions || [])
    .filter((a) => types.includes(String(a.action_type || '')))
    .reduce((s, a) => s + val(a.value), 0)

const firstAvailable = (actions: MetaAction[] | undefined, types: string[]): number => {
  for (const type of types) {
    const n = sumExact(actions, [type])
    if ((actions || []).some((a) => a.action_type === type)) return n
  }
  return 0
}

const actionDestination = (action: MetaAction): 'whatsapp' | 'messenger' | 'instagram' | 'unknown' => {
  const raw = String(action.action_destination || '').toLowerCase()
  if (raw.includes('whatsapp')) return 'whatsapp'
  if (raw.includes('messenger')) return 'messenger'
  if (raw.includes('instagram')) return 'instagram'
  return 'unknown'
}

const messageByDestination = (
  actions: MetaAction[] | undefined,
  destination: ReturnType<typeof actionDestination>,
): number => {
  const rows = (actions || []).filter(
    (a) => MESSAGE_PRIORITY.includes(String(a.action_type || '')) && actionDestination(a) === destination,
  )
  return firstAvailable(rows, MESSAGE_PRIORITY)
}

const hasMessageDestination = (actions: MetaAction[] | undefined): boolean =>
  (actions || []).some(
    (a) => MESSAGE_PRIORITY.includes(String(a.action_type || '')) && actionDestination(a) !== 'unknown',
  )

const phoneCalls = (actions: MetaAction[] | undefined): number => {
  const aliases = [
    'phone_call',
    'onsite_conversion.phone_call',
    'contact_phone',
    'onsite_conversion.click_to_call',
    'click_to_call',
  ]
  const found =
    aliases.find((type) => (actions || []).some((a) => a.action_type === type)) ||
    (actions || []).find((a) =>
      /(^|[._])phone(_|$)|(^|[._])call(_|$)|click_to_call|contact_phone|phone_call/.test(
        String(a.action_type || ''),
      ),
    )?.action_type
  return found ? sumExact(actions, [found]) : 0
}

const revenueFrom = (actionValues: MetaActionValue[] | undefined): number =>
  firstAvailable(actionValues, PURCHASE_TYPES)

const cost = (spend: number, value: number): number | null => (value > 0 ? +(spend / value).toFixed(2) : null)

function row(key: MetaResultKey, value: number, spend: number): MetaResultBreakdownItem | null {
  if (value <= 0) return null
  return { key, label: META_RESULT_LABELS[key], value, cost: cost(spend, value) }
}

function choosePrimaryResult(
  objective: string,
  rows: MetaResultBreakdownItem[],
  fallback: MetaResultBreakdownItem,
): MetaResultBreakdownItem {
  const obj = objective.toUpperCase()
  const by = (keys: MetaResultKey[]) => keys.map((key) => rows.find((r) => r.key === key)).find(Boolean)

  if (['OUTCOME_LEADS', 'LEAD_GENERATION'].includes(obj)) {
    return (
      by([
        'phone_call',
        'whatsapp_conversation',
        'messenger_conversation',
        'instagram_direct_conversation',
        'message_conversation',
        'form_lead',
        'website_lead',
        'meta_lead',
      ]) || fallback
    )
  }
  if (['MESSAGES'].includes(obj)) {
    return (
      by([
        'whatsapp_conversation',
        'messenger_conversation',
        'instagram_direct_conversation',
        'message_conversation',
      ]) || fallback
    )
  }
  if (['OUTCOME_SALES', 'CONVERSIONS', 'PRODUCT_CATALOG_SALES'].includes(obj)) {
    return by(['purchase', 'website_lead', 'form_lead', 'meta_lead']) || fallback
  }
  if (['OUTCOME_APP_PROMOTION', 'APP_INSTALLS'].includes(obj)) return by(['app_install']) || fallback
  if (['STORE_VISITS'].includes(obj)) return by(['store_visit']) || fallback
  if (['OUTCOME_TRAFFIC', 'TRAFFIC', 'LINK_CLICKS'].includes(obj))
    return by(['landing_page_view', 'link_click']) || fallback
  if (
    ['OUTCOME_ENGAGEMENT', 'POST_ENGAGEMENT', 'PAGE_LIKES', 'EVENT_RESPONSES', 'OFFER_CLAIMS'].includes(obj)
  ) {
    return (
      by([
        'whatsapp_conversation',
        'messenger_conversation',
        'instagram_direct_conversation',
        'message_conversation',
        'post_engagement',
        'video_view',
      ]) || fallback
    )
  }
  if (['VIDEO_VIEWS'].includes(obj)) return by(['video_view']) || fallback
  if (['OUTCOME_AWARENESS', 'BRAND_AWARENESS', 'REACH', 'LOCAL_AWARENESS'].includes(obj))
    return by(['reach', 'impression']) || fallback

  return fallback
}

export function summarizeMetaResults(params: {
  objective?: string | null
  actions?: MetaAction[]
  actionValues?: MetaActionValue[]
  spend?: number
  clicks?: number
  inlineLinkClicks?: number
  impressions?: number
  reach?: number
}): MetaResultSummary {
  const objective = String(params.objective || '').toUpperCase()
  const spend = val(params.spend)
  const actions = params.actions || []

  const formLeads = firstAvailable(actions, FORM_LEAD_TYPES)
  const websiteLeads = firstAvailable(actions, WEBSITE_LEAD_TYPES)
  const aggregateLeads = firstAvailable(actions, ['lead'])
  const phone = phoneCalls(actions)
  const hasDest = hasMessageDestination(actions)
  const whatsapp = hasDest ? messageByDestination(actions, 'whatsapp') : 0
  const messenger = hasDest ? messageByDestination(actions, 'messenger') : 0
  const instagram = hasDest ? messageByDestination(actions, 'instagram') : 0
  const aggregateMessages = hasDest
    ? messageByDestination(actions, 'unknown')
    : firstAvailable(actions, MESSAGE_PRIORITY)
  const destinationMessages = whatsapp + messenger + instagram
  const genericMessages = hasDest ? Math.max(0, aggregateMessages - destinationMessages) : aggregateMessages
  const purchases = firstAvailable(actions, PURCHASE_TYPES)
  const appInstalls = firstAvailable(actions, APP_INSTALL_TYPES)
  const storeVisits = firstAvailable(actions, STORE_VISIT_TYPES)
  const landingPageViews = sumExact(actions, LANDING_PAGE_VIEW_TYPES)
  const actionLinkClicks = sumExact(actions, LINK_CLICK_TYPES)
  const linkClicks = actionLinkClicks || val(params.inlineLinkClicks) || val(params.clicks)
  const postEngagements = sumExact(actions, POST_ENGAGEMENT_TYPES)
  const videoViews = firstAvailable(actions, VIDEO_VIEW_TYPES)
  const reachResults = val(params.reach)
  const impressionResults = val(params.impressions)

  const resultBreakdown = [
    row('phone_call', phone, spend),
    row('meta_lead', aggregateLeads, spend),
    row('form_lead', formLeads, spend),
    row('website_lead', websiteLeads, spend),
    row('whatsapp_conversation', whatsapp, spend),
    row('messenger_conversation', messenger, spend),
    row('instagram_direct_conversation', instagram, spend),
    row('message_conversation', genericMessages, spend),
    row('purchase', purchases, spend),
    row('app_install', appInstalls, spend),
    row('store_visit', storeVisits, spend),
    row('landing_page_view', landingPageViews, spend),
    row('link_click', linkClicks, spend),
    row('post_engagement', postEngagements, spend),
    row('video_view', videoViews, spend),
    row('reach', reachResults, spend),
    row('impression', impressionResults, spend),
  ].filter(Boolean) as MetaResultBreakdownItem[]

  const measurableRows = resultBreakdown.filter((r) => !['reach', 'impression', 'link_click'].includes(r.key))
  const fallback = measurableRows[0] ||
    resultBreakdown[0] || { key: 'other' as const, label: META_RESULT_LABELS.other, value: 0, cost: null }
  const expected: Record<string, MetaResultKey> = {
    OUTCOME_LEADS: 'meta_lead',
    LEAD_GENERATION: 'form_lead',
    MESSAGES: 'message_conversation',
    OUTCOME_ENGAGEMENT: 'post_engagement',
    OUTCOME_SALES: 'purchase',
    CONVERSIONS: 'purchase',
    OUTCOME_TRAFFIC: 'link_click',
    LINK_CLICKS: 'link_click',
    VIDEO_VIEWS: 'video_view',
  }
  const empty = {
    key: expected[objective] || ('other' as MetaResultKey),
    label: META_RESULT_LABELS[expected[objective] || 'other'],
    value: 0,
    cost: null,
  }
  const primary = choosePrimaryResult(objective, resultBreakdown, expected[objective] ? empty : fallback)

  return {
    objective,
    objectiveLabel: META_OBJECTIVE_LABELS[objective] || objective || 'Objetivo não informado',
    primaryResultKey: primary.key,
    primaryResultLabel: primary.label,
    primaryResultValue: primary.value,
    costPerResult: primary.cost || 0,
    formLeads,
    websiteLeads,
    leads: actions.some((a) => a.action_type === 'lead') ? aggregateLeads : formLeads + websiteLeads,
    whatsappConversations: whatsapp,
    messengerConversations: messenger,
    instagramDirectConversations: instagram,
    messageConversations: genericMessages,
    totalMessages: whatsapp + messenger + instagram + genericMessages,
    phoneCalls: phone,
    purchases,
    appInstalls,
    storeVisits,
    landingPageViews,
    linkClicks,
    postEngagements,
    videoViews,
    reachResults,
    impressionResults,
    revenue: revenueFrom(params.actionValues),
    resultBreakdown,
  }
}
