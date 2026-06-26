// app/api/ads-data/campaign-breakdown/route.ts — Breakdowns de UMA campanha (não da conta).
// Meta: ad sets + posicionamentos + geografia + demografia DAQUELA campanha (filtering
// por campaign.id). Google: grupos de anúncios + redes DAQUELA campanha (GAQL por campaign.id).
// Resolve o bug de "cliquei numa campanha do Google e vi dados do Meta da conta inteira".
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getValidMetaToken } from '@/services/meta/token-manager'

export const maxDuration = 60

const LEAD_RE = /lead|complete_registration|onsite_conversion\.messaging|purchase|offsite_conversion\.fb_pixel_(lead|purchase|complete_registration)/i
const leadsFromActions = (actions: any[]): number =>
  Array.isArray(actions) ? actions.reduce((t, a) => t + (LEAD_RE.test(a?.action_type || '') ? Number(a?.value || 0) : 0), 0) : 0

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })

  try {
    const body = await req.json().catch(() => ({}))
    const campaignId = String(body.campaignId || '')
    const platform = body.platform === 'google' ? 'google' : 'meta'
    const datePreset = (body.datePreset as string) || 'last_30d'
    if (!campaignId) return NextResponse.json({ success: false, error: 'campaignId obrigatório' }, { status: 400 })

    // ── META ──────────────────────────────────────────────────────────────────
    if (platform === 'meta') {
      const t = await getValidMetaToken(userId)
      const accountId = String(body.accountId || t.accountId || '')
      if (!accountId) return NextResponse.json({ success: false, error: 'Conta Meta não encontrada' }, { status: 400 })
      const act = `act_${accountId}`
      const token = encodeURIComponent(t.accessToken)
      const filt = encodeURIComponent(JSON.stringify([{ field: 'campaign.id', operator: 'IN', value: [campaignId] }]))
      const base = `https://graph.facebook.com/v21.0/${act}/insights`
      const q = (extra: string) => `${base}?${extra}&filtering=${filt}&date_preset=${datePreset}&access_token=${token}`

      const [adsetRes, placeRes, geoRes, demoRes, hourRes] = await Promise.allSettled([
        fetch(q('level=adset&fields=adset_id,adset_name,spend,impressions,clicks,frequency,actions&limit=50'), { signal: AbortSignal.timeout(20000) }).then(r => r.json()),
        fetch(q('fields=spend,actions,impressions&breakdowns=publisher_platform,platform_position&limit=50'), { signal: AbortSignal.timeout(20000) }).then(r => r.json()),
        fetch(q('fields=spend,actions&breakdowns=region&limit=40'), { signal: AbortSignal.timeout(20000) }).then(r => r.json()),
        fetch(q('fields=spend,actions&breakdowns=age,gender&limit=100'), { signal: AbortSignal.timeout(20000) }).then(r => r.json()),
        fetch(q('fields=spend,actions&breakdowns=hourly_stats_aggregated_by_advertiser_time_zone&limit=30'), { signal: AbortSignal.timeout(20000) }).then(r => r.json()),
      ])
      const val = (r: any) => (r.status === 'fulfilled' && !r.value?.error ? (r.value.data || []) : [])

      const adsets = val(adsetRes).map((a: any) => {
        const spend = Number(a.spend || 0); const leads = leadsFromActions(a.actions)
        return { id: a.adset_id, name: a.adset_name || 'Conjunto', spend, leads, cpl: leads > 0 ? Math.round(spend / leads) : 0, frequency: Number(a.frequency || 0) }
      }).filter((a: any) => a.spend > 0).sort((a: any, b: any) => b.spend - a.spend)

      const placements = val(placeRes).map((p: any) => ({
        platform: p.publisher_platform || '—', position: p.platform_position || '', spend: Number(p.spend || 0), leads: leadsFromActions(p.actions),
      })).filter((p: any) => p.spend > 0).sort((a: any, b: any) => b.spend - a.spend).slice(0, 8)

      const geo = val(geoRes).map((g: any) => {
        const spend = Number(g.spend || 0); const leads = leadsFromActions(g.actions)
        return { region: g.region || '—', spend, leads, cpl: leads > 0 ? Math.round(spend / leads) : 0 }
      }).filter((g: any) => g.spend > 0).sort((a: any, b: any) => b.spend - a.spend).slice(0, 8)

      const demo = val(demoRes).map((d: any) => {
        const spend = Number(d.spend || 0); const leads = leadsFromActions(d.actions)
        return { age: d.age || '', gender: d.gender || '', spend, leads, cpl: leads > 0 ? Math.round(spend / leads) : 0 }
      }).filter((d: any) => d.leads > 0).sort((a: any, b: any) => b.leads - a.leads).slice(0, 8)

      // Por HORA do dia (0-23, fuso do anunciante) — dayparting.
      const hourly = val(hourRes).map((h: any) => {
        const raw = String(h.hourly_stats_aggregated_by_advertiser_time_zone || '')
        const hour = parseInt(raw.slice(0, 2), 10)
        const spend = Number(h.spend || 0); const leads = leadsFromActions(h.actions)
        return { hour: isNaN(hour) ? -1 : hour, spend, leads, cpl: leads > 0 ? Math.round(spend / leads) : 0 }
      }).filter((h: any) => h.hour >= 0).sort((a: any, b: any) => a.hour - b.hour)

      return NextResponse.json({ success: true, platform, adsets, placements, geo, demo, hourly })
    }

    // ── GOOGLE ────────────────────────────────────────────────────────────────
    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
    if (!devToken) return NextResponse.json({ success: false, error: 'Google Ads não configurado.' }, { status: 400 })
    const { getValidGoogleToken } = await import('@/services/google/token-manager')
    const { gaqlSearch, normalizeCustomerId } = await import('@/lib/google-ads')
    const gt = await getValidGoogleToken(userId)
    const cid = normalizeCustomerId(String(body.accountId || gt.accountId || ''))
    if (!cid) return NextResponse.json({ success: false, error: 'Conta Google não encontrada' }, { status: 400 })

    const DURING = datePreset === 'last_7d' ? 'LAST_7_DAYS' : datePreset === 'last_90d' ? 'LAST_90_DAYS' : 'LAST_30_DAYS'
    const NETWORK_LABEL: Record<string, string> = {
      SEARCH: 'Pesquisa', SEARCH_PARTNERS: 'Parceiros de pesquisa', CONTENT: 'Display', YOUTUBE_SEARCH: 'YouTube (busca)', YOUTUBE_WATCH: 'YouTube', MIXED: 'Misto',
    }

    const [groupsR, netsR, hourR] = await Promise.allSettled([
      gaqlSearch(cid, gt.accessToken, devToken, `SELECT ad_group.name, metrics.cost_micros, metrics.conversions FROM ad_group WHERE campaign.id = ${campaignId} AND segments.date DURING ${DURING} AND ad_group.status != 'REMOVED' ORDER BY metrics.cost_micros DESC LIMIT 50`),
      gaqlSearch(cid, gt.accessToken, devToken, `SELECT segments.ad_network_type, metrics.cost_micros, metrics.conversions FROM campaign WHERE campaign.id = ${campaignId} AND segments.date DURING ${DURING}`),
      gaqlSearch(cid, gt.accessToken, devToken, `SELECT segments.hour, metrics.cost_micros, metrics.conversions FROM campaign WHERE campaign.id = ${campaignId} AND segments.date DURING ${DURING}`),
    ])
    const grows = groupsR.status === 'fulfilled' ? (groupsR.value || []) : []
    const nrows = netsR.status === 'fulfilled' ? (netsR.value || []) : []
    const hrows = hourR.status === 'fulfilled' ? (hourR.value || []) : []

    const adsets = grows.map((r: any) => {
      const spend = Math.round(Number(r.metrics?.costMicros || 0) / 1e6); const leads = Math.round(Number(r.metrics?.conversions || 0))
      return { id: r.adGroup?.name, name: r.adGroup?.name || 'Grupo', spend, leads, cpl: leads > 0 ? Math.round(spend / leads) : 0, frequency: 0 }
    }).filter((a: any) => a.spend > 0)

    const netMap = new Map<string, { spend: number; leads: number }>()
    for (const r of nrows) {
      const net = r.segments?.adNetworkType || 'MIXED'
      const cur = netMap.get(net) || { spend: 0, leads: 0 }
      cur.spend += Math.round(Number(r.metrics?.costMicros || 0) / 1e6)
      cur.leads += Math.round(Number(r.metrics?.conversions || 0))
      netMap.set(net, cur)
    }
    const placements = [...netMap.entries()].map(([net, v]) => ({ platform: NETWORK_LABEL[net] || net, position: '', spend: v.spend, leads: v.leads }))
      .filter(p => p.spend > 0).sort((a, b) => b.spend - a.spend)

    const hourAgg = new Map<number, { spend: number; leads: number }>()
    for (const r of hrows) {
      const hour = Number(r.segments?.hour)
      if (isNaN(hour)) continue
      const cur = hourAgg.get(hour) || { spend: 0, leads: 0 }
      cur.spend += Math.round(Number(r.metrics?.costMicros || 0) / 1e6)
      cur.leads += Math.round(Number(r.metrics?.conversions || 0))
      hourAgg.set(hour, cur)
    }
    const hourly = [...hourAgg.entries()].map(([hour, v]) => ({ hour, spend: v.spend, leads: v.leads, cpl: v.leads > 0 ? Math.round(v.spend / v.leads) : 0 }))
      .sort((a, b) => a.hour - b.hour)

    return NextResponse.json({ success: true, platform, adsets, placements, geo: [], demo: [], hourly })
  } catch (e: any) {
    console.error('[campaign-breakdown]', e?.message)
    return NextResponse.json({ success: false, error: e?.message || 'Erro ao buscar a campanha.' }, { status: 500 })
  }
}
