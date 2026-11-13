import {
  normalizeReporteiMetric,
  type ObservedMetric,
} from '@/lib/reportei-metrics'
import { metricNumber } from '@/lib/marketing-totals'
export const META_EVENTS: Record<string, string[]> = {
  messages_started: [
    'onsite_conversion.messaging_conversation_started_7d',
    'onsite_conversion.messaging_conversation_started',
    'messaging_conversation_started',
  ],
  new_message_contacts: [
    'onsite_conversion.messaging_first_reply',
    'messaging_first_reply',
  ],
  meta_form_leads: [
    'onsite_conversion.lead_grouped',
    'onsite_conversion.leadgen_grouped',
  ],
  website_leads: ['offsite_conversion.fb_pixel_lead'],
  website_registrations: [
    'offsite_conversion.fb_pixel_complete_registration',
    'complete_registration',
  ],
  meta_leads: ['lead'],
  contact_events: ['contact_total'],
  purchases: [
    'omni_purchase',
    'purchase',
    'offsite_conversion.fb_pixel_purchase',
  ],
  landing_page_views: ['landing_page_view'],
  video_views: ['video_view'],
  link_clicks: ['link_click'],
}
export const EVENT_LABELS: Record<string, string> = {
  messages_started: 'Conversas iniciadas',
  new_message_contacts: 'Novos contatos por mensagem',
  meta_form_leads: 'Formulários Meta',
  website_leads: 'Leads no site',
  website_registrations: 'Cadastros concluídos no site',
  meta_leads: 'Leads atribuídos pelo Meta',
  contact_events: 'Eventos de contato',
  purchases: 'Compras atribuídas',
  landing_page_views: 'Visualizações da página',
  link_clicks: 'Cliques no link',
  video_views: 'Visualizações de vídeo',
  google_conversions: 'Conversões principais do Google',
  google_all_conversions: 'Todas as conversões do Google',
  google_forms: 'Formulários enviados',
  google_signups: 'Cadastros no Google',
  google_contact_events: 'Conversões de contato',
  google_qualified_leads: 'Leads qualificados',
  google_quotes: 'Pedidos de orçamento',
  crm_created_leads: 'Negócios criados',
  crm_total_leads: 'Negócios no CRM',
  crm_won_leads: 'Negócios ganhos',
  crm_won_value: 'Valor dos negócios ganhos',
  crm_open_leads: 'Negócios abertos',
  crm_lost_leads: 'Negócios perdidos',
}
export const GOOGLE_CATEGORIES: Record<string, string> = {
  CONTACT: 'google_contact_events',
  SUBMIT_LEAD_FORM: 'google_forms',
  SIGNUP: 'google_signups',
  QUALIFIED_LEAD: 'google_qualified_leads',
  REQUEST_QUOTE: 'google_quotes',
  PURCHASE: 'purchases',
}
export function metaEventValues(row: any): Record<string, number | null> {
  const actions = Array.isArray(row?.actions) ? row.actions : null
  return Object.fromEntries(
    Object.entries(META_EVENTS).map(([key, aliases]) => {
      if (!actions) return [key, null]
      const alias = aliases.find((type) =>
        actions.some((a: any) => a.action_type === type),
      )
      return [
        key,
        alias
          ? actions
              .filter((a: any) => a.action_type === alias)
              .reduce((n: number, a: any) => n + metricNumber(a.value), 0)
          : 0,
      ]
    }),
  )
}
export function metaObservedMetrics(row: any): ObservedMetric[] {
  const events = metaEventValues(row),
    result: ObservedMetric[] = []
  for (const key of ['spend', 'clicks', 'impressions'])
    result.push(
      normalizeReporteiMetric(
        {
          reference_key: `meta:account:${key}`,
          component: 'number_v1',
          metrics: [key],
        },
        { values: row?.[key] },
      ),
    )
  for (const [key, aliases] of Object.entries(META_EVENTS)) {
    const item = normalizeReporteiMetric(
      {
        reference_key: `meta:account:${aliases[0]}`,
        component: 'number_v1',
        metrics: [`actions:${aliases[0]}`],
      },
      { values: events[key] },
    )
    result.push({ ...item, key, label: EVENT_LABELS[key] })
  }
  return result
}
export function googleObservedMetrics(
  campaigns: any[],
  conversionRows: any[] | null,
): ObservedMetric[] {
  const sum = (field: string) =>
    campaigns.reduce((n, c) => n + metricNumber(c[field]), 0)
  const rows = [
    ['spend', sum('spend')],
    ['clicks', sum('clicks')],
    ['impressions', sum('impressions')],
    ['metrics.conversions', sum('leads')],
    ['metrics.all_conversions', sum('allConversions')],
  ] as const
  const result = rows.map(([metric, value]) =>
    normalizeReporteiMetric(
      {
        reference_key: `google:account:${metric}`,
        component: 'number_v1',
        metrics: [metric],
      },
      { values: value },
    ),
  )
  for (const [category, key] of Object.entries(GOOGLE_CATEGORIES)) {
    const matched = conversionRows?.filter(
      (r) => r.segments?.conversionActionCategory === category,
    )
    const value = matched
      ? matched.reduce((n, r) => n + metricNumber(r.metrics?.conversions), 0)
      : null
    result.push({
      key,
      referenceKey: `google:conversion_category:${category}`,
      label: EVENT_LABELS[key],
      description:
        'Ações de conversão principais classificadas pela conta. Não equivalem a pessoas únicas; revise a configuração e a atribuição.',
      value,
      status: value === null ? 'unavailable' : 'available',
    })
  }
  return result
}
export function purchaseValueFromGoogle(rows: any[] | null): number | null {
  return rows === null
    ? null
    : rows
        .filter((r) => r.segments?.conversionActionCategory === 'PURCHASE')
        .reduce((n, r) => n + metricNumber(r.metrics?.conversionsValue), 0)
}
