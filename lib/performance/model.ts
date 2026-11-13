import type { ObservedMetric } from '@/lib/reportei-metrics'
import {
  nativeObservedMetrics,
  normalizeAccountId,
} from '@/lib/reportei-metrics'
import { EVENT_LABELS } from './observations'
export type PerformanceSource = {
  platform: 'meta' | 'google'
  accountId: string
  success: boolean
  campaigns: any[]
  totals?: any
  previousTotals?: any
  period?: any
  observedMetrics?: ObservedMetric[]
  error?: string
  fetchedAt?: string
  purchaseValue?: number | null
}
export const sourceLabel = (p: string) =>
  p === 'meta'
    ? 'Meta Ads'
    : p === 'google'
      ? 'Google Ads'
      : p === 'kommo'
        ? 'Kommo'
        : p
export const campaignObjectiveLabel = (value: string) =>
  (
    ({
      SEARCH: 'Pesquisa',
      PERFORMANCE_MAX: 'Performance Max',
      DISPLAY: 'Display',
      VIDEO: 'Vídeo',
      SHOPPING: 'Shopping',
      DEMAND_GEN: 'Demand Gen',
      OUTCOME_LEADS: 'Geração de leads',
      OUTCOME_SALES: 'Vendas',
      OUTCOME_TRAFFIC: 'Tráfego',
      OUTCOME_ENGAGEMENT: 'Engajamento',
      OUTCOME_AWARENESS: 'Reconhecimento',
      OUTCOME_APP_PROMOTION: 'Promoção de app',
      MESSAGES: 'Mensagens',
      CONVERSIONS: 'Conversões',
      LINK_CLICKS: 'Cliques no link',
      LEAD_GENERATION: 'Geração de leads',
      REACH: 'Alcance',
    }) as Record<string, string>
  )[value] ||
  value ||
  'Objetivo não informado'
export const number = (n: any) =>
  n === null || n === undefined || n === ''
    ? null
    : Number.isFinite(Number(n))
      ? Number(n)
      : null
export const ratio = (a: any, b: any) =>
  number(a) !== null && number(b) !== null && Number(b) > 0
    ? Number(a) / Number(b)
    : null
export const delta = (current: any, previous: any) =>
  ratio(
    number(current) !== null && number(previous) !== null
      ? Number(current) - Number(previous)
      : null,
    previous,
  )
export const statusLabel = (s: string) =>
  (
    ({
      ACTIVE: 'Ativa',
      ENABLED: 'Ativa',
      PAUSED: 'Pausada',
      CAMPAIGN_PAUSED: 'Pausada',
      ADSET_PAUSED: 'Pausada',
      ARCHIVED: 'Arquivada',
      DELETED: 'Removida',
      REMOVED: 'Removida',
      DISABLED: 'Desativada',
    }) as Record<string, string>
  )[s] || 'Não informado'
export function metricValue(
  source: PerformanceSource | undefined,
  key: string,
): number | null {
  if (!source?.success) return null
  const observations =
    source.observedMetrics || nativeObservedMetrics(source as any)
  return (
    observations.find((m) => m.key === key && m.status === 'available')
      ?.value ?? null
  )
}
export function reportedMetric(
  report: any,
  platform: string,
  key: string,
  accountId?: string,
): ObservedMetric | null {
  const sources = (report?.sources || []).filter(
    (s: any) =>
      s.platform === platform &&
      (!accountId ||
        normalizeAccountId(platform, s.accountId) ===
          normalizeAccountId(platform, accountId)),
  )
  return (
    (sources.length === 1 ? sources[0] : null)?.metrics?.find(
      (m: ObservedMetric) =>
        m.key === key && m.status === 'available' && m.value !== null,
    ) || null
  )
}
export function crmMetricValue(report: any, key: string): number | null {
  const rows = (report?.sources || [])
    .filter((s: any) => s.platform === 'kommo')
    .flatMap((s: any) =>
      (s.metrics || []).filter(
        (m: any) => m.key === key && m.status === 'available',
      ),
    )
  return rows.length === 1 ? number(rows[0].value) : null
}
export function crmIntakeMetric(report: any) {
  const created = crmMetricValue(report, 'crm_created_leads')
  return created !== null
    ? { label: 'Negócios criados', value: created }
    : {
        label: 'Negócios no CRM (período)',
        value: crmMetricValue(report, 'crm_total_leads'),
      }
}
export function campaignResult(c: any) {
  return {
    value: number(c.results ?? c.primaryResultValue ?? c.leads),
    key:
      c.resultType ||
      (c.platform === 'google' ? 'google_conversions' : 'unknown'),
    label:
      c.resultLabel ||
      (c.platform === 'google' ? 'Conversões' : 'Resultado não identificado'),
  }
}
export function resultGroups(campaigns: any[]) {
  const map = new Map<
    string,
    {
      platform: string
      key: string
      label: string
      value: number | null
      spend: number
      campaigns: number
    }
  >()
  for (const c of campaigns) {
    const r = campaignResult(c)
    if (r.value === null) continue
    const id = `${c.platform}:${r.key}:${r.label}`
    const current = map.get(id) || {
      platform: c.platform,
      key: r.key,
      label: r.label,
      value: 0,
      spend: 0,
      campaigns: 0,
    }
    current.value = (current.value || 0) + r.value
    current.spend += Number(c.spend || 0)
    current.campaigns++
    map.set(id, current)
  }
  return [...map.values()].map((group) =>
    group.key === 'reach' && group.campaigns > 1
      ? { ...group, value: null }
      : group,
  )
}
export function efficiencySignal(c: any, rows: any[]) {
  const result = campaignResult(c),
    peers = rows.filter(
      (r) =>
        r.platform === c.platform &&
        campaignResult(r).key === result.key &&
        campaignResult(r).label === result.label,
    )
  const spend = peers.reduce((n, r) => n + Number(r.spend || 0), 0),
    values = peers.reduce((n, r) => n + (campaignResult(r).value || 0), 0),
    reference = ratio(spend, values),
    cost = ratio(c.spend, result.value)
  if (!Number(c.spend))
    return {
      label: 'Sem investimento',
      tone: 'neutral',
      note: 'Sem entrega financeira no período.',
    }
  if (result.value === 0)
    return {
      label: 'Sem resultado registrado',
      tone: 'warn',
      note: `${result.label}: nenhum evento principal registrado neste recorte. Confira objetivo e rastreamento antes de decidir.`,
    }
  if (
    reference === null ||
    cost === null ||
    peers.length < 2 ||
    Number(result.value) < 10
  )
    return {
      label: 'Em observação',
      tone: 'neutral',
      note: 'Volume ou comparação insuficiente para classificar eficiência com segurança.',
    }
  const rate = cost / reference
  return rate > 1.3
    ? {
        label: 'Custo acima da referência',
        tone: 'warn',
        note: `${Math.round((rate - 1) * 100)}% acima do custo ponderado de ${peers.length} campanhas do mesmo canal e resultado. Compare qualidade, janela e volume antes de alterar.`,
      }
    : rate < 0.8
      ? {
          label: 'Custo abaixo da referência',
          tone: 'good',
          note: `${Math.round((1 - rate) * 100)}% abaixo do custo ponderado das campanhas comparáveis. Não confirma qualidade nem vendas.`,
        }
      : {
          label: 'Próximo da referência',
          tone: 'neutral',
          note: 'Custo dentro da faixa de comparação do mesmo canal e evento.',
        }
}
export function datasetEvent(row: any, key: string): number | null {
  return row.events && key in row.events ? number(row.events[key]) : null
}
export function eventOptions(rows: any[]) {
  const keys = [
    ...new Set(rows.flatMap((row) => Object.keys(row.events || {}))),
  ]
  return keys
    .filter((key) => rows.some((row) => number(row.events?.[key]) !== null))
    .map((key) => ({ key, label: EVENT_LABELS[key] || key }))
}
