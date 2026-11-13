// app/api/ads-data/campaign-breakdown/route.ts — Breakdowns de UMA campanha (não da conta).
// Meta: ad sets + posicionamentos + geografia + demografia DAQUELA campanha (filtering
// por campaign.id). Google: grupos de anúncios + redes DAQUELA campanha (GAQL por campaign.id).
// Resolve o bug de "cliquei numa campanha do Google e vi dados do Meta da conta inteira".
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getValidMetaToken } from '@/services/meta/token-manager'
import { resolveReportingPeriod } from '@/lib/reporting-period'
import { summarizeMetaResults } from '@/lib/metaResults'
import { graph } from '@/services/meta/graph-collection'

export const maxDuration = 60

const contactsFrom = (row: any, objective?: string): number => {
  const result = summarizeMetaResults({
    objective,
    actions: row?.actions,
    actionValues: row?.action_values,
    spend: Number(row?.spend || 0),
    clicks: Number(row?.clicks || 0),
    inlineLinkClicks: Number(row?.inline_link_clicks || 0),
    impressions: Number(row?.impressions || 0),
    reach: Number(row?.reach || 0),
  })
  return result.leads + result.totalMessages + result.phoneCalls
}

const resultInfo = (row: any, objective?: string) =>
  summarizeMetaResults({
    objective,
    actions: row?.actions,
    actionValues: row?.action_values,
    spend: Number(row?.spend || 0),
    clicks: Number(row?.clicks || 0),
    inlineLinkClicks: Number(row?.inline_link_clicks || 0),
    impressions: Number(row?.impressions || 0),
    reach: Number(row?.reach || 0),
  })

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId)
    return NextResponse.json(
      { success: false, error: 'Não autorizado' },
      { status: 401 },
    )

  try {
    const body = await req.json().catch(() => ({}))
    const campaignId = String(body.campaignId || '')
    const platform = body.platform === 'google' ? 'google' : 'meta'
    let period: ReturnType<typeof resolveReportingPeriod>
    try {
      period = resolveReportingPeriod(body)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Período inválido.' },
        { status: 400 },
      )
    }
    if (!/^\d+$/.test(campaignId))
      return NextResponse.json(
        { success: false, error: 'campaignId obrigatório' },
        { status: 400 },
      )

    // ── META ──────────────────────────────────────────────────────────────────
    if (platform === 'meta') {
      const t = await getValidMetaToken(userId)
      const accountId = String(body.accountId || t.accountId || '')
      if (!accountId)
        return NextResponse.json(
          { success: false, error: 'Conta Meta não encontrada' },
          { status: 400 },
        )
      const act = `act_${accountId.replace(/^act_/, '')}`
      if (!/^act_\d+$/.test(act))
        return NextResponse.json(
          { success: false, error: 'Conta Meta inválida.' },
          { status: 400 },
        )
      const read = async (extra: string) => {
        const result = await graph(
          `${act}/insights`,
          t.accessToken,
          {
            ...Object.fromEntries(new URLSearchParams(extra)),
            level: new URLSearchParams(extra).get('level') || 'campaign',
            filtering: JSON.stringify([
              { field: 'campaign.id', operator: 'IN', value: [campaignId] },
            ]),
            time_range: JSON.stringify({
              since: period.startDate,
              until: period.endDate,
            }),
            action_breakdowns: 'action_type,action_destination',
          },
          2000,
        )
        return { data: result.rows, truncated: result.truncated }
      }

      const [adsetRes, placeRes, geoRes, demoRes, hourRes, campRes] =
        await Promise.allSettled([
          read(
            'level=adset&fields=adset_id,adset_name,spend,impressions,clicks,inline_link_clicks,reach,frequency,actions,action_values',
          ),
          read(
            'fields=spend,actions,action_values,impressions,clicks,inline_link_clicks,reach&breakdowns=publisher_platform,platform_position',
          ),
          read(
            'fields=spend,actions,action_values,impressions,clicks,inline_link_clicks,reach&breakdowns=region',
          ),
          read(
            'fields=spend,actions,action_values,impressions,clicks,inline_link_clicks,reach&breakdowns=age,gender',
          ),
          read(
            'fields=spend,actions,action_values,impressions,clicks,inline_link_clicks,reach&breakdowns=hourly_stats_aggregated_by_advertiser_time_zone',
          ),
          // Nó da campanha (datas de início/término agendadas) — não vem nos insights.
          fetch(
            `https://graph.facebook.com/v21.0/${campaignId}?fields=start_time,stop_time,created_time,objective`,
            {
              headers: { Authorization: `Bearer ${t.accessToken}` },
              signal: AbortSignal.timeout(15000),
              cache: 'no-store',
            },
          ).then((r) => r.json()),
        ])
      const val = (r: any) =>
        r.status === 'fulfilled' && !r.value?.error ? r.value.data || [] : []
      const campObj =
        campRes.status === 'fulfilled' && !campRes.value?.error
          ? campRes.value
          : {}
      const dates = {
        start: campObj.start_time || null,
        stop: campObj.stop_time || null,
        created: campObj.created_time || null,
      }
      const objective = String(campObj.objective || '')

      const adsets = val(adsetRes)
        .map((a: any) => {
          const spend = Number(a.spend || 0)
          const result = resultInfo(a, objective)
          const leads = contactsFrom(a, objective)
          return {
            id: a.adset_id,
            name: a.adset_name || 'Conjunto',
            spend,
            leads,
            results: result.primaryResultValue,
            resultLabel: result.primaryResultLabel,
            resultType: result.primaryResultKey,
            resultBreakdown: result.resultBreakdown,
            cpl: leads > 0 ? spend / leads : 0,
            costPerResult: result.costPerResult,
            frequency: Number(a.frequency || 0),
          }
        })
        .filter((a: any) => a.spend > 0)
        .sort((a: any, b: any) => b.spend - a.spend)

      const placements = val(placeRes)
        .map((p: any) => ({
          platform: p.publisher_platform || '—',
          position: p.platform_position || '',
          spend: Number(p.spend || 0),
          leads: contactsFrom(p, objective),
          results: resultInfo(p, objective).primaryResultValue,
          resultLabel: resultInfo(p, objective).primaryResultLabel,
        }))
        .filter((p: any) => p.spend > 0)
        .sort((a: any, b: any) => b.spend - a.spend)
        .slice(0, 8)

      const geo = val(geoRes)
        .map((g: any) => {
          const spend = Number(g.spend || 0)
          const result = resultInfo(g, objective)
          const leads = contactsFrom(g, objective)
          return {
            region: g.region || '—',
            spend,
            leads,
            results: result.primaryResultValue,
            resultLabel: result.primaryResultLabel,
            cpl: leads > 0 ? spend / leads : 0,
            costPerResult: result.costPerResult,
          }
        })
        .filter((g: any) => g.spend > 0)
        .sort((a: any, b: any) => b.spend - a.spend)
        .slice(0, 8)

      const demo = val(demoRes)
        .map((d: any) => {
          const spend = Number(d.spend || 0)
          const result = resultInfo(d, objective)
          const leads = contactsFrom(d, objective)
          return {
            age: d.age || '',
            gender: d.gender || '',
            spend,
            leads,
            results: result.primaryResultValue,
            resultLabel: result.primaryResultLabel,
            cpl: leads > 0 ? spend / leads : 0,
            costPerResult: result.costPerResult,
          }
        })
        .filter((d: any) => d.leads > 0)
        .sort((a: any, b: any) => b.leads - a.leads)
        .slice(0, 8)

      // Por HORA do dia (0-23, fuso do anunciante) — dayparting.
      const hourly = val(hourRes)
        .map((h: any) => {
          const raw = String(
            h.hourly_stats_aggregated_by_advertiser_time_zone || '',
          )
          const hour = parseInt(raw.slice(0, 2), 10)
          const spend = Number(h.spend || 0)
          const result = resultInfo(h, objective)
          const leads = contactsFrom(h, objective)
          return {
            hour: isNaN(hour) ? -1 : hour,
            spend,
            leads,
            results: result.primaryResultValue,
            resultLabel: result.primaryResultLabel,
            cpl: leads > 0 ? spend / leads : 0,
            costPerResult: result.costPerResult,
          }
        })
        .filter((h: any) => h.hour >= 0)
        .sort((a: any, b: any) => a.hour - b.hour)

      const partial = [adsetRes, placeRes, geoRes, demoRes, hourRes].some(
        (r) =>
          r.status === 'rejected' ||
          (r.status === 'fulfilled' && r.value.truncated),
      )
      return NextResponse.json({
        success: true,
        period,
        platform,
        adsets,
        placements,
        geo,
        demo,
        hourly,
        dates,
        objective,
        partial,
      })
    }

    // ── GOOGLE ────────────────────────────────────────────────────────────────
    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
    if (!devToken)
      return NextResponse.json(
        { success: false, error: 'Google Ads não configurado.' },
        { status: 400 },
      )
    const { getValidGoogleToken } = await import(
      '@/services/google/token-manager'
    )
    const { gaqlSearch, normalizeCustomerId } = await import('@/lib/google-ads')
    const gt = await getValidGoogleToken(userId)
    const cid = normalizeCustomerId(
      String(body.accountId || gt.accountId || ''),
    )
    if (!cid)
      return NextResponse.json(
        { success: false, error: 'Conta Google não encontrada' },
        { status: 400 },
      )

    const DATE_RANGE = `BETWEEN '${period.startDate}' AND '${period.endDate}'`
    const NETWORK_LABEL: Record<string, string> = {
      SEARCH: 'Pesquisa',
      SEARCH_PARTNERS: 'Parceiros de pesquisa',
      CONTENT: 'Display',
      YOUTUBE_SEARCH: 'YouTube (busca)',
      YOUTUBE_WATCH: 'YouTube',
      MIXED: 'Misto',
    }

    const [groupsR, netsR, hourR, datesR] = await Promise.allSettled([
      gaqlSearch(
        cid,
        gt.accessToken,
        devToken,
        `SELECT ad_group.name, metrics.cost_micros, metrics.conversions FROM ad_group WHERE campaign.id = ${campaignId} AND segments.date ${DATE_RANGE} ORDER BY metrics.cost_micros DESC LIMIT 1000`,
      ),
      gaqlSearch(
        cid,
        gt.accessToken,
        devToken,
        `SELECT segments.ad_network_type, metrics.cost_micros, metrics.conversions FROM campaign WHERE campaign.id = ${campaignId} AND segments.date ${DATE_RANGE}`,
      ),
      gaqlSearch(
        cid,
        gt.accessToken,
        devToken,
        `SELECT segments.hour, metrics.cost_micros, metrics.conversions FROM campaign WHERE campaign.id = ${campaignId} AND segments.date ${DATE_RANGE}`,
      ),
      gaqlSearch(
        cid,
        gt.accessToken,
        devToken,
        `SELECT campaign.start_date, campaign.end_date FROM campaign WHERE campaign.id = ${campaignId} LIMIT 1`,
      ),
    ])
    const grows = groupsR.status === 'fulfilled' ? groupsR.value || [] : []
    const nrows = netsR.status === 'fulfilled' ? netsR.value || [] : []
    const hrows = hourR.status === 'fulfilled' ? hourR.value || [] : []
    // Datas da campanha; Google usa 2037-12-30 como "sem término" → vira null.
    const dRow =
      (datesR.status === 'fulfilled' ? datesR.value || [] : [])[0]?.campaign ||
      {}
    const gEnd =
      dRow.endDate && !String(dRow.endDate).startsWith('2037')
        ? dRow.endDate
        : null
    const dates = { start: dRow.startDate || null, stop: gEnd, created: null }

    const adsets = grows
      .map((r: any) => {
        const spend = Number(r.metrics?.costMicros || 0) / 1e6
        const leads = Number(r.metrics?.conversions || 0)
        return {
          results: leads,
          resultLabel: 'Conversões principais',
          resultType: 'google_conversions',
          id: r.adGroup?.name,
          name: r.adGroup?.name || 'Grupo',
          spend,
          leads,
          cpl: leads > 0 ? spend / leads : 0,
          frequency: 0,
        }
      })
      .filter((a: any) => a.spend > 0)

    const netMap = new Map<string, { spend: number; leads: number }>()
    for (const r of nrows) {
      const net = r.segments?.adNetworkType || 'MIXED'
      const cur = netMap.get(net) || { spend: 0, leads: 0 }
      cur.spend += Number(r.metrics?.costMicros || 0) / 1e6
      cur.leads += Number(r.metrics?.conversions || 0)
      netMap.set(net, cur)
    }
    const placements = [...netMap.entries()]
      .map(([net, v]) => ({
        platform: NETWORK_LABEL[net] || net,
        position: '',
        spend: v.spend,
        leads: v.leads,
        results: v.leads,
        resultLabel: 'Conversões principais',
      }))
      .filter((p) => p.spend > 0)
      .sort((a, b) => b.spend - a.spend)

    const hourAgg = new Map<number, { spend: number; leads: number }>()
    for (const r of hrows) {
      const hour = Number(r.segments?.hour)
      if (isNaN(hour)) continue
      const cur = hourAgg.get(hour) || { spend: 0, leads: 0 }
      cur.spend += Number(r.metrics?.costMicros || 0) / 1e6
      cur.leads += Number(r.metrics?.conversions || 0)
      hourAgg.set(hour, cur)
    }
    const hourly = [...hourAgg.entries()]
      .map(([hour, v]) => ({
        hour,
        spend: v.spend,
        leads: v.leads,
        cpl: v.leads > 0 ? v.spend / v.leads : 0,
      }))
      .sort((a, b) => a.hour - b.hour)

    return NextResponse.json({
      success: true,
      period,
      platform,
      adsets,
      placements,
      geo: [],
      demo: [],
      hourly,
      dates,
      partial:
        [groupsR, netsR, hourR].some((r) => r.status === 'rejected') ||
        grows.length >= 1000,
    })
  } catch (e: any) {
    console.error('[campaign-breakdown]', e?.message)
    return NextResponse.json(
      { success: false, error: e?.message || 'Erro ao buscar a campanha.' },
      { status: 500 },
    )
  }
}
