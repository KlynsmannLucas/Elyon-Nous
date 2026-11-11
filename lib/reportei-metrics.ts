export interface ObservedMetric {
  key: string
  referenceKey: string
  label: string
  description: string
  value: number | null
  status: 'available' | 'unavailable'
  error?: string
}

// Aliases are NOT added together. Each entry describes one specific event.
const DEFINITIONS: Record<string, [string, string, string]> = {
  spend: ['spend', 'Investimento', 'Valor informado pela conta de anúncios, na moeda da conta.'],
  impressions: ['impressions', 'Exibições dos anúncios', 'Uma pessoa pode ver o anúncio mais de uma vez.'],
  clicks: ['clicks', 'Cliques', 'Cliques registrados pela plataforma; não representam pessoas únicas.'],
  'actions:onsite_conversion.messaging_conversation_started_7d': ['messages_started', 'Conversas iniciadas', 'Inclui novas conversas e retomadas após pelo menos 7 dias de inatividade.'],
  'actions:onsite_conversion.messaging_first_reply': ['new_message_contacts', 'Novos contatos por mensagem', 'Contas que enviaram mensagem pela primeira vez, atribuídas aos anúncios. Métrica estimada pelo Meta.'],
  'actions:lead': ['meta_leads', 'Leads atribuídos pelo Meta', 'Pode incluir eventos do site e das tecnologias Meta. Não equivale a contatos únicos no CRM.'],
  'actions:onsite_conversion.lead_grouped': ['meta_form_leads', 'Leads nas tecnologias Meta', 'Cadastros atribuídos a formulários e outras tecnologias Meta, incluindo Messenger.'],
  'actions:offsite_conversion.fb_pixel_lead': ['website_leads', 'Leads no site', 'Eventos Lead do pixel ou API de Conversões, atribuídos aos anúncios. Podem estar incluídos no total de leads.'],
  'actions:offsite_conversion.fb_pixel_complete_registration': ['website_registrations', 'Cadastros concluídos no site', 'Eventos de cadastro concluído registrados no site. Não devem ser somados ao total de leads.'],
  'actions:omni_complete_registration': ['registrations', 'Cadastros concluídos', 'Eventos de cadastro concluído em todos os ambientes informados pela plataforma.'],
  'actions:contact_total': ['contact_events', 'Eventos de contato', 'Eventos Contact configurados no rastreamento. Não equivalem automaticamente a conversas ou pessoas únicas.'],
  'actions:omni_purchase': ['purchases', 'Compras atribuídas', 'Compras atribuídas pela plataforma de anúncios; podem diferir das vendas registradas no CRM.'],
  'metrics.conversions': ['google_conversions', 'Conversões principais do Google', 'Soma das ações configuradas como conversões principais. Pode incluir ações diferentes e valores fracionados.'],
  'metrics.all_conversions': ['google_all_conversions', 'Todas as conversões do Google', 'Inclui conversões principais e secundárias. Não somar com conversões principais.'],
  'metrics.phone_calls': ['phone_calls', 'Ligações', 'Ligações registradas pelo Google Ads.'],
  'metrics.conversion_contact': ['google_contact_events', 'Conversões de contato', 'Ações classificadas como Contact no Google Ads. Podem integrar o total de conversões.'],
  'metrics.conversion_sign_up': ['google_signups', 'Cadastros no Google', 'Conversões classificadas como inscrição ou cadastro.'],
  'metrics.conversion_submit_lead_form': ['google_forms', 'Formulários enviados', 'Conversões classificadas como envio de formulário de lead.'],
  'metrics.conversion_qualified_lead': ['google_qualified_leads', 'Leads qualificados no Google', 'Conversões que a conta classificou como Qualified Lead. Depende do envio e da configuração dos eventos.'],
  'metrics.conversion_request_quote': ['google_quotes', 'Pedidos de orçamento', 'Conversões classificadas como solicitação de orçamento.'],
  total_leads: ['crm_total_leads', 'Negócios no CRM', 'Negócios informados pelo Kommo no critério de período do Reportei. Um contato pode ter mais de um negócio.'],
  created_leads: ['crm_created_leads', 'Negócios criados', 'Negócios criados no Kommo no período consultado; não são necessariamente contatos únicos ou originados dos anúncios.'],
  open_leads: ['crm_open_leads', 'Negócios abertos', 'Negócios abertos no critério do período informado pelo Reportei.'],
  win_leads: ['crm_won_leads', 'Negócios ganhos', 'Negócios marcados como ganhos no critério do período do Reportei. Não presume uma mesma coorte dos anúncios.'],
  lost_leads: ['crm_lost_leads', 'Negócios perdidos', 'Negócios marcados como perdidos no critério do período do Reportei.'],
  no_task_leads: ['crm_no_task_leads', 'Negócios sem próxima tarefa', 'Negócios sem tarefa vinculada no Kommo.'],
  win_leads_value: ['crm_won_value', 'Valor dos negócios ganhos', 'Valor registrado nos negócios ganhos; não confirma recebimento financeiro nem atribuição aos anúncios.'],
}

export interface ReporteiMetricDefinition {
  id?: string
  reference_key: string
  component: string
  metrics: string[]
  dimensions?: unknown[]
  references?: { title?: string; description?: string; formatting_function?: string }
  [key: string]: unknown
}

export function selectReporteiMetrics(catalog: ReporteiMetricDefinition[]) {
  // Account totals only. Dimensional widgets and all-time CRM widgets have a different scope.
  const seen = new Set<string>()
  return catalog.filter(widget => {
    const metric = widget.metrics?.[0]
    if (widget.component !== 'number_v1' || widget.metrics?.length !== 1 || widget.dimensions?.length || !DEFINITIONS[metric]) return false
    if (widget.reference_key.startsWith('kommo:total_') && widget.reference_key !== 'kommo:total_leads') return false
    if (seen.has(metric)) return false
    seen.add(metric)
    return true
  })
}

export function normalizeReporteiMetric(widget: ReporteiMetricDefinition, result: any): ObservedMetric {
  const metric = widget.metrics[0]
  const definition = DEFINITIONS[metric]
  const value = result?.values
  const numeric = typeof value === 'number' || (typeof value === 'string' && value.trim() !== '') ? Number(value) : NaN
  const available = Number.isFinite(numeric) && Math.abs(numeric) <= Number.MAX_SAFE_INTEGER && !result?.error && !result?.type
  return { key: definition?.[0] || metric, referenceKey: widget.reference_key,
    label: definition?.[1] || widget.references?.title || metric,
    description: definition?.[2] || widget.references?.description || '',
    value: available ? numeric : null, status: available ? 'available' : 'unavailable',
    ...(!available ? { error: typeof result?.type === 'string' ? result.type : 'Sem valor válido retornado pela fonte.' } : {}) }
}

export interface NativeSource {
  platform: 'meta' | 'google'
  accountId: string
  success: boolean
  campaigns?: any[]
  totals?: Record<string, unknown>
  error?: string
}

export function nativeObservedMetrics(source: NativeSource): ObservedMetric[] {
  const row = (key: string, label: string, description: string, value: unknown): ObservedMetric => {
    const number = value == null || value === '' ? NaN : Number(value)
    const available = Number.isFinite(number) && Math.abs(number) <= Number.MAX_SAFE_INTEGER
    return { key, referenceKey: `native:${key}`, label, description, value: available ? number : null, status: available ? 'available' : 'unavailable' }
  }
  if (!source.success) return []
  const result = ['spend', 'impressions', 'clicks'].map(key => row(key, DEFINITIONS[key][1], DEFINITIONS[key][2], source.totals?.[key]))
  if (source.platform === 'google') result.push(row('google_conversions', DEFINITIONS['metrics.conversions'][1], DEFINITIONS['metrics.conversions'][2], source.totals?.leads))
  // Use only a breakdown present in every campaign; absence is not a reported zero.
  const breakdowns: [string, string, string][] = source.platform === 'meta' ? [
    ['messages_started', 'totalMessageConversations', 'actions:onsite_conversion.messaging_conversation_started_7d'],
    ['website_leads', 'websiteLeads', 'actions:offsite_conversion.fb_pixel_lead'],
  ] : []
  for (const [key, field, definition] of breakdowns) {
    const campaigns = source.campaigns || []
    const values = campaigns.map(campaign => campaign[field])
    const value = campaigns.length > 0 && values.every(value => value != null && Number.isFinite(Number(value)))
      ? values.reduce((sum, value) => sum + Number(value), 0) : null
    result.push(row(key, DEFINITIONS[definition][1], DEFINITIONS[definition][2], value))
  }
  return result
}

export const normalizeAccountId = (platform: string, accountId: unknown) => {
  const id = String(accountId || '').trim()
  return platform === 'meta' ? id.replace(/^act_/, '') : platform === 'google' ? id.replace(/-/g, '') : id
}

/** A comparison retains both values. No addition, replacement or inferred person-level matching. */
export function compareObservedMetrics(native: ObservedMetric[], reportei: ObservedMetric[]) {
  const keys = [...new Set([...native.map(metric => metric.key), ...reportei.map(metric => metric.key)])]
  const priority = ['new_message_contacts', 'messages_started', 'website_registrations', 'registrations', 'meta_form_leads', 'website_leads', 'meta_leads',
    'google_forms', 'google_signups', 'google_contact_events', 'google_qualified_leads', 'google_quotes', 'google_conversions', 'google_all_conversions',
    'crm_created_leads', 'crm_total_leads', 'crm_won_leads', 'crm_won_value', 'crm_open_leads', 'crm_lost_leads', 'spend', 'clicks', 'impressions']
  const order = (key: string) => priority.includes(key) ? priority.indexOf(key) : priority.length
  keys.sort((a, b) => order(a) - order(b))
  return keys.map(key => {
    const direct = native.find(metric => metric.key === key)
    const other = reportei.find(metric => metric.key === key)
    const comparable = direct?.status === 'available' && other?.status === 'available'
    return { key, label: (other || direct)!.label, description: (other || direct)!.description, native: direct || null, reportei: other || null,
      status: !comparable ? 'complementary' : Math.abs(direct!.value! - other!.value!) <= Math.max(0.01, Math.abs(direct!.value!) * 0.001) ? 'aligned' : 'different' }
  })
}
