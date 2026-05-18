// app/api/meta/insights/route.ts
// Endpoint genérico para buscar insights da Meta Ads Insights API.
// Suporta diferentes níveis (account/campaign/adset/ad), date presets e breakdowns.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getValidMetaToken, metaTokenErrorToResponse } from '@/services/meta/token-manager'

type InsightLevel = 'account' | 'campaign' | 'adset' | 'ad'

interface InsightsRequestBody {
  accountId?:    string
  level?:        InsightLevel
  datePreset?:   string
  timeRange?:    { since: string; until: string }
  breakdowns?:   string[]
}

const STANDARD_FIELDS = [
  'spend', 'impressions', 'reach', 'frequency',
  'clicks', 'inline_link_clicks', 'ctr', 'cpc', 'cpm',
  'actions', 'action_values', 'cost_per_action_type',
].join(',')

function normalizeActions(
  actions: Array<{ action_type: string; value: string }> | undefined,
  types: string[]
): number {
  return (actions || [])
    .filter(a => types.includes(a.action_type))
    .reduce((sum, a) => sum + parseInt(a.value || '0'), 0)
}

function normalizeActionValues(
  actionValues: Array<{ action_type: string; value: string }> | undefined,
  types: string[]
): number {
  return (actionValues || [])
    .filter(a => types.includes(a.action_type))
    .reduce((sum, a) => sum + parseFloat(a.value || '0'), 0)
}

const LEAD_TYPES     = ['lead', 'onsite_conversion.lead_grouped']
const PURCHASE_TYPES = ['purchase', 'omni_purchase']

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })

  const body: InsightsRequestBody = await req.json().catch(() => ({}))
  const {
    level      = 'campaign',
    datePreset = 'last_30d',
    timeRange,
    breakdowns = [],
  } = body

  let accessToken: string
  let accountId: string | null
  try {
    const tokenData = await getValidMetaToken(userId)
    accessToken = tokenData.accessToken
    accountId   = body.accountId || tokenData.accountId
  } catch (err) {
    const { error, code } = metaTokenErrorToResponse(err)
    return NextResponse.json({ success: false, error, code }, { status: 401 })
  }

  if (!accountId) {
    return NextResponse.json(
      { success: false, error: 'Ad Account ID não encontrado', code: 'NO_ACCOUNT_ID' },
      { status: 400 }
    )
  }

  try {
    const params = new URLSearchParams({
      fields:       STANDARD_FIELDS,
      level,
      limit:        '200',
      access_token: accessToken,
    })

    if (timeRange) {
      params.set('time_range', JSON.stringify(timeRange))
    } else {
      params.set('date_preset', datePreset)
    }

    if (breakdowns.length > 0) {
      params.set('breakdowns', breakdowns.join(','))
    }

    const res = await fetch(
      `https://graph.facebook.com/v19.0/act_${accountId}/insights?${params}`,
      { signal: AbortSignal.timeout(30_000) }
    )

    const data = await res.json()
    if (data.error) {
      return NextResponse.json({ success: false, error: data.error.message }, { status: 400 })
    }

    // Normaliza métricas para formato consistente
    const rows = (data.data || []).map((row: Record<string, unknown>) => {
      const spend       = parseFloat((row.spend as string) || '0')
      const impressions = parseInt((row.impressions as string) || '0')
      const clicks      = parseInt((row.clicks as string) || '0')
      const actions     = row.actions as Array<{ action_type: string; value: string }> | undefined
      const actionValues = row.action_values as Array<{ action_type: string; value: string }> | undefined

      const leads     = normalizeActions(actions, LEAD_TYPES)
      const purchases = normalizeActions(actions, PURCHASE_TYPES)
      const revenue   = normalizeActionValues(actionValues, PURCHASE_TYPES)

      return {
        ...row,
        // Métricas normalizadas (sobrescrevem os campos raw)
        _normalized: {
          spend,
          impressions,
          reach:       parseInt((row.reach as string) || '0'),
          frequency:   +parseFloat((row.frequency as string) || '0').toFixed(2),
          clicks,
          ctr:         impressions > 0 ? +((clicks / impressions) * 100).toFixed(2) : 0,
          cpc:         clicks > 0 ? +(spend / clicks).toFixed(2) : 0,
          cpm:         impressions > 0 ? +((spend / impressions) * 1000).toFixed(2) : 0,
          leads,
          cpl:         leads > 0 ? +(spend / leads).toFixed(2) : 0,
          purchases,
          revenue,
          roas:        spend > 0 && revenue > 0 ? +(revenue / spend).toFixed(2) : 0,
        },
      }
    })

    return NextResponse.json({
      success: true,
      level,
      datePreset: timeRange ? null : datePreset,
      timeRange:  timeRange || null,
      breakdowns,
      count: rows.length,
      data:  rows,
      paging: data.paging || null,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
