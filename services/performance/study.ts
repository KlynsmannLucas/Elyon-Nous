import { graph } from '@/services/meta/graph-collection'
import { supabaseAdmin } from '@/lib/supabase'
import { getValidMetaToken } from '@/services/meta/token-manager'
import { getValidGoogleToken } from '@/services/google/token-manager'
import { gaqlSearch, normalizeCustomerId } from '@/lib/google-ads'
import {
  resolveReportingPeriod,
  type ReportingPeriod,
} from '@/lib/reporting-period'
import { metricNumber } from '@/lib/marketing-totals'
import {
  metaEventValues,
  GOOGLE_CATEGORIES,
} from '@/lib/performance/observations'
import {
  classifyMetaCreative,
  creativeImage,
  classifyGoogleCreative,
} from '@/lib/performance/creative'
import { summarizeMetaResults } from '@/lib/metaResults'
export class StudyError extends Error {
  constructor(
    message: string,
    public status = 503,
  ) {
    super(message)
  }
}
export async function ownedPerformanceClient(userId: string, id: string) {
  if (
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)
  )
    throw new StudyError('Selecione um cliente salvo.', 400)
  if (!supabaseAdmin)
    throw new StudyError('Dados temporariamente indisponíveis.')
  const result = await supabaseAdmin
    .from('clients')
    .select('id,client_data,extra_data')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()
  if (result.error) throw new StudyError('Não foi possível carregar o cliente.')
  if (!result.data)
    throw new StudyError('Cliente não encontrado nesta conta.', 404)
  return result.data
}

function studyRow(
  row: any,
  platform: 'meta' | 'google',
  label: string,
  details?: Record<string, unknown>,
) {
  if (platform === 'meta')
    return {
      label,
      ...details,
      spend: metricNumber(row.spend),
      impressions: metricNumber(row.impressions),
      clicks: metricNumber(row.clicks),
      linkClicks:
        row.inline_link_clicks != null
          ? metricNumber(row.inline_link_clicks)
          : null,
      events: metaEventValues(row),
    }
  return {
    label,
    ...details,
    spend: metricNumber(row.metrics?.costMicros) / 1000000,
    impressions: metricNumber(row.metrics?.impressions),
    clicks: metricNumber(row.metrics?.clicks),
    events: { google_conversions: metricNumber(row.metrics?.conversions) },
  }
}
function safeLink(value: unknown) {
  if (typeof value !== 'string') return ''
  try {
    const u = new URL(value)
    return ['https:', 'http:'].includes(u.protocol) &&
      !u.username &&
      !u.password
      ? u.toString()
      : ''
  } catch {
    return ''
  }
}
async function metaStudy(
  userId: string,
  accountId: string,
  period: ReportingPeriod,
  view: string,
) {
  const token = (await getValidMetaToken(userId)).accessToken,
    act = `act_${accountId}`,
    time_range = JSON.stringify({
      since: period.startDate,
      until: period.endDate,
    })
  const base = {
    fields: 'spend,impressions,clicks,inline_link_clicks,actions,action_values',
    time_range,
    level: 'account',
  }
  const sets: Record<string, () => Promise<any>> = {}
  if (view === 'daily')
    sets.daily = () =>
      graph(`${act}/insights`, token, { ...base, time_increment: '1' })
  else if (view === 'audience') {
    for (const [key, breakdowns] of Object.entries({
      demographics: 'age,gender',
      regions: 'region',
      placements: 'publisher_platform,platform_position',
      devices: 'impression_device',
      hours: 'hourly_stats_aggregated_by_advertiser_time_zone',
    }))
      sets[key] = () => graph(`${act}/insights`, token, { ...base, breakdowns })
  } else {
    sets.ads = () =>
      graph(
        `${act}/ads`,
        token,
        {
          fields:
            'id,name,effective_status,campaign_id,adset_id,preview_shareable_link,creative{id,title,body,video_id,object_type,image_hash,image_url,thumbnail_url,object_story_spec,asset_feed_spec,effective_object_story_id,instagram_permalink_url,object_url}',
        },
        1000,
      ).catch(() =>
        graph(
          `${act}/ads`,
          token,
          {
            fields:
              'id,name,effective_status,campaign_id,adset_id,creative{id,title,body,video_id,object_type,image_url,thumbnail_url,object_story_spec,asset_feed_spec}',
          },
          1000,
        ),
      )
    sets.adMetrics = () =>
      graph(
        `${act}/insights`,
        token,
        {
          ...base,
          fields:
            base.fields +
            ',ad_id,ad_name,campaign_id,adset_id,objective,reach,frequency,video_p25_watched_actions,video_p50_watched_actions,video_p95_watched_actions',
          level: 'ad',
        },
        2000,
      ).catch(() =>
        graph(
          `${act}/insights`,
          token,
          {
            ...base,
            fields:
              base.fields +
              ',ad_id,ad_name,campaign_id,adset_id,objective,reach,frequency',
            level: 'ad',
          },
          2000,
        ),
      )
  }
  const names = Object.keys(sets),
    reads = await Promise.allSettled(names.map((name) => sets[name]()))
  const datasets: Record<string, any> = {}
  names.forEach((name, index) => {
    const r = reads[index]
    datasets[name] =
      r.status === 'fulfilled'
        ? {
            status: 'available',
            rows: r.value.rows,
            truncated: r.value.truncated,
          }
        : {
            status: 'unavailable',
            rows: [],
            truncated: false,
            message: 'Este recorte não foi disponibilizado pelo Meta.',
          }
  })
  if (view === 'creative') {
    if (datasets.adMetrics.status !== 'available')
      return {
        platform: 'meta',
        accountId,
        datasets: { creatives: datasets.adMetrics },
      }
    const map = new Map(
      (datasets.ads.rows || []).map((ad: any) => [String(ad.id), ad]),
    )
    const rows = datasets.adMetrics.rows.map((raw: any) => {
      const ad: any = map.get(String(raw.ad_id)) || {},
        creative = ad.creative || {},
        result = summarizeMetaResults({
          objective: raw.objective,
          actions: raw.actions,
          actionValues: raw.action_values,
          spend: metricNumber(raw.spend),
          clicks: metricNumber(raw.clicks),
          impressions: metricNumber(raw.impressions),
        })
      const story = String(creative.effective_object_story_id || '').split('_')
      const preview =
        safeLink(ad.preview_shareable_link) ||
        safeLink(creative.instagram_permalink_url) ||
        (story.length === 2
          ? `https://www.facebook.com/${encodeURIComponent(story[0])}/posts/${encodeURIComponent(story[1])}`
          : '')
      const count = (key: string) =>
        Array.isArray(raw[key])
          ? raw[key].reduce((n: number, a: any) => n + metricNumber(a.value), 0)
          : null
      return {
        ...studyRow(raw, 'meta', ad.name || raw.ad_name || 'Anúncio'),
        id: String(raw.ad_id),
        platform: 'meta',
        campaignId: String(raw.campaign_id || ad.campaign_id || ''),
        adsetId: raw.adset_id || ad.adset_id || '',
        status: ad.effective_status || 'UNKNOWN',
        format: classifyMetaCreative(creative),
        imageUrl: safeLink(creativeImage(creative)),
        title:
          creative.title || creative.object_story_spec?.link_data?.name || '',
        body:
          creative.body ||
          creative.object_story_spec?.link_data?.message ||
          creative.object_story_spec?.video_data?.message ||
          '',
        previewUrl: preview,
        destinationUrl: safeLink(
          creative.object_url || creative.object_story_spec?.link_data?.link,
        ),
        frequency: raw.frequency != null ? metricNumber(raw.frequency) : null,
        reach: raw.reach != null ? metricNumber(raw.reach) : null,
        video25: count('video_p25_watched_actions'),
        video50: count('video_p50_watched_actions'),
        video95: count('video_p95_watched_actions'),
        results: result.primaryResultValue,
        resultLabel: result.primaryResultLabel,
        resultType: result.primaryResultKey,
      }
    })
    return {
      platform: 'meta',
      accountId,
      datasets: {
        creatives: {
          status: 'available',
          rows,
          truncated: datasets.ads.truncated || datasets.adMetrics.truncated,
          metadataUnavailable: datasets.ads.status !== 'available',
        },
      },
    }
  }
  for (const [name, set] of Object.entries(datasets) as [string, any][]) {
    set.rows = set.rows.map((row: any) => {
      const label =
        name === 'daily'
          ? row.date_start
          : name === 'demographics'
            ? `${row.age || 'Não informado'} · ${row.gender === 'male' ? 'Masculino' : row.gender === 'female' ? 'Feminino' : 'Não informado'}`
            : name === 'regions'
              ? row.region || 'Não informado'
              : name === 'placements'
                ? `${row.publisher_platform || 'Não informado'} · ${row.platform_position || ''}`
                : name === 'devices'
                  ? row.impression_device || 'Não informado'
                  : row.hourly_stats_aggregated_by_advertiser_time_zone ||
                    'Não informado'
      return studyRow(row, 'meta', label, {
        ...(name === 'daily' ? { date: row.date_start } : {}),
        ...(name === 'demographics'
          ? { age: row.age, gender: row.gender }
          : {}),
        ...(name === 'placements'
          ? { network: row.publisher_platform, position: row.platform_position }
          : {}),
      })
    })
  }
  return { platform: 'meta', accountId, datasets }
}
async function googleStudy(
  userId: string,
  accountId: string,
  period: ReportingPeriod,
  view: string,
) {
  const token = (await getValidGoogleToken(userId)).accessToken,
    developer = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  if (!developer)
    throw new StudyError('Google Ads temporariamente indisponível.')
  const where = `segments.date BETWEEN '${period.startDate}' AND '${period.endDate}'`,
    metrics =
      'metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions'
  const queries: Record<string, string> =
    view === 'daily'
      ? {
          daily: `SELECT segments.date, ${metrics} FROM customer WHERE ${where}`,
        }
      : view === 'creative'
        ? {
            creatives: `SELECT ad_group_ad.ad.id, ad_group_ad.ad.name, ad_group_ad.ad.type, ad_group_ad.ad.responsive_search_ad.headlines, ad_group_ad.ad.responsive_search_ad.descriptions, ad_group_ad.ad.final_urls, ad_group_ad.status, campaign.id, campaign.name, ${metrics} FROM ad_group_ad WHERE ${where} ORDER BY metrics.cost_micros DESC LIMIT 1000`,
          }
        : {
            devices: `SELECT segments.device, ${metrics} FROM customer WHERE ${where}`,
            hours: `SELECT segments.hour, ${metrics} FROM customer WHERE ${where}`,
            weekdays: `SELECT segments.day_of_week, ${metrics} FROM customer WHERE ${where}`,
            networks: `SELECT segments.ad_network_type, ${metrics} FROM customer WHERE ${where}`,
            ages: `SELECT ad_group_criterion.age_range.type, ${metrics} FROM age_range_view WHERE ${where}`,
            genders: `SELECT ad_group_criterion.gender.type, ${metrics} FROM gender_view WHERE ${where}`,
          }
  const names = Object.keys(queries),
    reads = await Promise.allSettled(
      names.map((name) =>
        gaqlSearch(accountId, token, developer, queries[name]),
      ),
    )
  const datasets: Record<string, any> = {}
  names.forEach((name, index) => {
    const r = reads[index]
    if (r.status !== 'fulfilled') {
      datasets[name] = {
        status: 'unavailable',
        rows: [],
        message: 'Este recorte não foi disponibilizado pelo Google.',
      }
      return
    }
    datasets[name] = {
      status: 'available',
      truncated: name === 'creatives' && r.value.length >= 1000,
      rows: r.value.map((row: any) => {
        if (name === 'creatives') {
          const ad = row.adGroupAd?.ad || {},
            headlines =
              ad.responsiveSearchAd?.headlines?.map((r: any) => r.text) || [],
            descriptions =
              ad.responsiveSearchAd?.descriptions?.map((r: any) => r.text) || []
          return {
            ...studyRow(
              row,
              'google',
              ad.name || headlines[0] || `Anúncio ${ad.id}`,
            ),
            id: String(ad.id),
            platform: 'google',
            campaignId: String(row.campaign?.id || ''),
            campaignName: row.campaign?.name,
            status: row.adGroupAd?.status || 'UNKNOWN',
            format: classifyGoogleCreative(ad.type || ''),
            adType: ad.type || '',
            title: headlines.join(' · '),
            body: descriptions.join(' '),
            destinationUrl: safeLink(ad.finalUrls?.[0]),
            imageUrl: '',
            previewUrl: '',
            resultType: 'google_conversions',
            resultLabel: 'Conversões principais',
            results: metricNumber(row.metrics?.conversions),
          }
        }
        const segment =
          name === 'daily'
            ? row.segments?.date
            : name === 'devices'
              ? row.segments?.device
              : name === 'hours'
                ? `${String(row.segments?.hour ?? '').padStart(2, '0')}:00`
                : name === 'weekdays'
                  ? row.segments?.dayOfWeek
                  : name === 'networks'
                    ? row.segments?.adNetworkType
                    : name === 'ages'
                      ? row.adGroupCriterion?.ageRange?.type
                      : row.adGroupCriterion?.gender?.type
        return studyRow(
          row,
          'google',
          String(segment || 'Não informado'),
          name === 'daily' ? { date: row.segments?.date } : {},
        )
      }),
    }
  })
  return { platform: 'google', accountId, datasets }
}
export async function readPerformanceStudy(
  userId: string,
  clientId: string,
  input: any,
) {
  const client = await ownedPerformanceClient(userId, clientId),
    view = input.view
  if (!['daily', 'audience', 'creative'].includes(view))
    throw new StudyError('Recorte inválido.', 400)
  let period: ReportingPeriod
  try {
    period = resolveReportingPeriod(input)
  } catch (error) {
    throw new StudyError(
      error instanceof Error ? error.message : 'Período inválido.',
      400,
    )
  }
  const metaId = String(client.extra_data?.selectedMetaAccountId || '').replace(
      /^act_/,
      '',
    ),
    googleId = normalizeCustomerId(
      client.extra_data?.selectedGoogleAccountId || '',
    )
  const sources: {
    platform: 'meta' | 'google'
    id: string
    read: () => Promise<any>
  }[] = []
  if (/^\d+$/.test(metaId))
    sources.push({
      platform: 'meta',
      id: metaId,
      read: () => metaStudy(userId, metaId, period, view),
    })
  if (/^\d{10}$/.test(googleId))
    sources.push({
      platform: 'google',
      id: googleId,
      read: () => googleStudy(userId, googleId, period, view),
    })
  const reads = await Promise.allSettled(sources.map((source) => source.read()))
  return {
    clientId,
    period,
    view,
    fetchedAt: new Date().toISOString(),
    sources: reads.map((read, index) =>
      read.status === 'fulfilled'
        ? { ...read.value, status: 'available' }
        : {
            platform: sources[index].platform,
            accountId: sources[index].id,
            status: 'unavailable',
            datasets: {},
            message:
              'Não foi possível consultar esta conta neste momento. As demais fontes foram preservadas.',
          },
    ),
  }
}
