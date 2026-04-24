// app/api/ads-data/meta/route.ts — Busca campanhas reais do Meta Ads
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// "lead" é o evento primário. "lead_grouped" agrega múltiplas janelas de atribuição
// e se sobrepõe com "lead" — usar os dois juntos infla o número. Usar apenas um.
const LEAD_FORM_PRIMARY   = 'lead'
const LEAD_FORM_FALLBACK  = 'onsite_conversion.lead_grouped'

// WhatsApp: "messaging_first_reply" = 1 reply por conversa (mais preciso).
// "total_messaging_connection" é muito amplo (qualquer interação) — excluído.
const WHATSAPP_ACTION_TYPES = [
  'onsite_conversion.messaging_conversation_started_7d',
  'messaging_first_reply',
  'onsite_conversion.messaging_first_reply',
]

function extractActions(actions: any[], types: string[]): number {
  return (actions || [])
    .filter((a: any) => types.includes(a.action_type))
    .reduce((s: number, a: any) => s + parseInt(a.value || '0'), 0)
}

// Retorna leads de formulário sem dupla-contagem:
// usa "lead" se existir, caso contrário usa "lead_grouped" como fallback.
function extractFormLeads(actions: any[]): number {
  const primary = extractActions(actions, [LEAD_FORM_PRIMARY])
  if (primary > 0) return primary
  return extractActions(actions, [LEAD_FORM_FALLBACK])
}

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

async function fetchAllInsights(accountId: string, accessToken: string, timeParam: string): Promise<any[]> {
  const insightFields = [
    'campaign_id', 'campaign_name', 'spend', 'impressions', 'clicks',
    'actions', 'reach', 'frequency',
  ].join(',')

  let url: string | null =
    `https://graph.facebook.com/v19.0/act_${accountId}/insights?` +
    `fields=${insightFields}` +
    `&${timeParam}` +
    `&level=campaign` +
    `&limit=50` +
    `&access_token=${accessToken}`

  const allRows: any[] = []

  while (url) {
    const res: Response = await fetch(url, { signal: AbortSignal.timeout(20000) })
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('application/json')) throw new Error(`Meta API retornou resposta inválida (HTTP ${res.status})`)
    const data: any = await res.json()
    if (data.error) throw new Error(data.error.message)
    allRows.push(...(data.data || []))
    url = data.paging?.next || null
  }

  return allRows
}

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })

  try {
    const { accessToken, accountId } = await req.json()
    if (!accessToken || !accountId) {
      return NextResponse.json({ success: false, error: 'Token ou Account ID não fornecido.' }, { status: 400 })
    }

    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000)
    const currentTimeParam = 'date_preset=last_30d'
    const prevTimeParam = `time_range=${encodeURIComponent(JSON.stringify({ since: dateStr(sixtyDaysAgo), until: dateStr(thirtyDaysAgo) }))}`

    const [rows, prevRows] = await Promise.all([
      fetchAllInsights(accountId, accessToken, currentTimeParam),
      fetchAllInsights(accountId, accessToken, prevTimeParam),
    ])

    // Busca status das campanhas separadamente
    const campaignIds = rows.map((c: any) => c.campaign_id).filter(Boolean)
    const statusMap: Record<string, string> = {}
    if (campaignIds.length > 0) {
      // Faz em lotes de 50 para evitar URL muito longa
      const chunks = Array.from({ length: Math.ceil(campaignIds.length / 50) }, (_, i) =>
        campaignIds.slice(i * 50, (i + 1) * 50)
      )
      for (const chunk of chunks) {
        const statusRes = await fetch(
          `https://graph.facebook.com/v19.0/?ids=${chunk.join(',')}&fields=id,status&access_token=${accessToken}`,
          { signal: AbortSignal.timeout(10000) }
        )
        const statusData = await statusRes.json()
        if (!statusData.error) {
          for (const [id, val] of Object.entries(statusData as Record<string, any>)) {
            statusMap[id] = (val as any).status || 'ACTIVE'
          }
        }
      }
    }

    const campaigns = rows.map((c: any) => {
      const spend       = parseFloat(c.spend || '0')
      const clicks      = parseInt(c.clicks || '0')
      const impressions = parseInt(c.impressions || '0')
      const frequency   = +parseFloat(c.frequency || '0').toFixed(2)

      // Leads via formulário — sem dupla-contagem entre "lead" e "lead_grouped"
      const leadFormLeads = extractFormLeads(c.actions)
      // Conversas WhatsApp (apenas first_reply, não conexões genéricas)
      const whatsappLeads = extractActions(c.actions, WHATSAPP_ACTION_TYPES)
      const leads = leadFormLeads + whatsappLeads

      const cpl = leads > 0 ? +(spend / leads).toFixed(2) : 0

      const purchaseAction = c.actions?.find((a: any) =>
        a.action_type === 'purchase' || a.action_type === 'omni_purchase'
      )
      const revenue = purchaseAction ? parseFloat(purchaseAction.value || '0') : 0
      const roas = spend > 0 && revenue > 0 ? +(revenue / spend).toFixed(2) : 0

      return {
        id: c.campaign_id || Math.random().toString(),
        name: c.campaign_name,
        status: statusMap[c.campaign_id] || 'ACTIVE',
        spend, impressions, clicks, frequency,
        ctr: impressions > 0 ? +((clicks / impressions) * 100).toFixed(2) : 0,
        leads,
        leadFormLeads,
        whatsappLeads,
        cpl, revenue, roas,
        platform: 'meta' as const,
      }
    })

    const totals = campaigns.reduce((acc, c) => ({
      spend:       acc.spend + c.spend,
      impressions: acc.impressions + c.impressions,
      clicks:      acc.clicks + c.clicks,
      leads:       acc.leads + c.leads,
      revenue:     acc.revenue + c.revenue,
    }), { spend: 0, impressions: 0, clicks: 0, leads: 0, revenue: 0 })

    const extTotals = {
      ...totals,
      cpl:  totals.leads > 0 ? +(totals.spend / totals.leads).toFixed(2) : 0,
      roas: totals.spend > 0 && totals.revenue > 0 ? +(totals.revenue / totals.spend).toFixed(2) : 0,
      ctr:  totals.impressions > 0 ? +((totals.clicks / totals.impressions) * 100).toFixed(2) : 0,
    }

    // Previous period totals for MoM comparison
    const prevTotals = prevRows.reduce((acc, c) => {
      const spend  = parseFloat(c.spend || '0')
      const leads  = extractFormLeads(c.actions) + extractActions(c.actions, WHATSAPP_ACTION_TYPES)
      const clicks = parseInt(c.clicks || '0')
      return { spend: acc.spend + spend, leads: acc.leads + leads, clicks: acc.clicks + clicks }
    }, { spend: 0, leads: 0, clicks: 0 })

    const delta = (curr: number, prev: number) =>
      prev > 0 ? +((curr - prev) / prev * 100).toFixed(1) : null

    const previousTotals = {
      ...prevTotals,
      cpl: prevTotals.leads > 0 ? +(prevTotals.spend / prevTotals.leads).toFixed(2) : 0,
      spendDelta:  delta(totals.spend,  prevTotals.spend),
      leadsDelta:  delta(totals.leads,  prevTotals.leads),
      clicksDelta: delta(totals.clicks, prevTotals.clicks),
      cplDelta:    delta(
        totals.leads > 0 ? totals.spend / totals.leads : 0,
        prevTotals.leads > 0 ? prevTotals.spend / prevTotals.leads : 0
      ),
    }

    return NextResponse.json({ success: true, campaigns, totals: extTotals, previousTotals, platform: 'meta' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
