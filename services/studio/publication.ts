import { createHash } from 'crypto'
import { z } from 'zod'
import { studioJob, studioClient, studioDb, StudioError } from './access'
import { ownedStudioAsset } from './assets'
import { getValidMetaToken } from '@/services/meta/token-manager'
import { getValidGoogleToken } from '@/services/google/token-manager'
import { gaqlSearch, normalizeCustomerId } from '@/lib/google-ads'
import {
  campaignPlanSchema,
  briefSchema,
  publicDestination,
  type CampaignPlan,
  type StudioBrief,
} from '@/lib/studio/schema'

const META = 'https://graph.facebook.com/v21.0'
const selectionSchema = z.object({
  platform: z.enum(['meta', 'google']),
  location: z.string().min(1).max(100),
  pageId: z.string().max(40).default(''),
  pixelId: z.string().max(40).default(''),
  assetId: z.string().uuid().optional(),
  audienceIndex: z.number().int().min(0).max(2).default(0),
  interestIds: z.array(z.string().regex(/^\d+$/)).max(5).default([]),
  customAudienceId: z.string().max(40).default(''),
  maxCpc: z.number().finite().min(0.1).max(1000).default(1),
  confirmedBudget: z.number().finite().min(0.01),
  confirmedDestination: z.string().max(2048),
  reviewed: z.literal(true),
  political: z.literal(false),
})
class DeliveryError extends StudioError {
  constructor(
    message = 'A plataforma recusou o rascunho. Confira a configuração e as permissões no gerenciador.',
    public uncertain = false,
  ) {
    super(message, 409)
  }
}
async function meta(path: string, token: string, parameters: Record<string, string>, write = false) {
  let response: Response
  try {
    response = await fetch(`${META}/${path}${write ? '' : '?' + new URLSearchParams(parameters)}`, {
      method: write ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        ...(write ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      },
      ...(write ? { body: new URLSearchParams(parameters) } : {}),
      signal: AbortSignal.timeout(20000),
      cache: 'no-store',
    })
  } catch {
    throw new DeliveryError(
      'A confirmação do Meta não chegou. Confira os objetos pausados no gerenciador antes de repetir.',
      write,
    )
  }
  let data: any
  try {
    data = await response.json()
  } catch {
    throw new DeliveryError('O Meta retornou uma confirmação inválida. Confira o gerenciador.', write)
  }
  if (!response.ok || data.error) throw new DeliveryError(undefined, write && response.status >= 500)
  return data
}
async function googleMutate(id: string, token: string, payload: unknown, validateOnly: boolean) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    'Content-Type': 'application/json',
  }
  const manager = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
  if (manager && normalizeCustomerId(manager) !== id)
    headers['login-customer-id'] = normalizeCustomerId(manager)
  let response: Response
  try {
    response = await fetch(`https://googleads.googleapis.com/v26/customers/${id}/googleAds:mutate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ mutateOperations: payload, partialFailure: false, validateOnly }),
      signal: AbortSignal.timeout(25000),
      cache: 'no-store',
    })
  } catch {
    throw new DeliveryError(
      'A confirmação do Google não chegou. Confira o gerenciador antes de repetir.',
      !validateOnly,
    )
  }
  let data: any
  try {
    data = await response.json()
  } catch {
    throw new DeliveryError(
      'O Google retornou uma confirmação inválida. Confira o gerenciador.',
      !validateOnly,
    )
  }
  if (!response.ok || data.error || data.partialFailureError)
    throw new DeliveryError(undefined, !validateOnly && response.status >= 500)
  return data
}
async function context(userId: string, id: string, platform: 'meta' | 'google') {
  const job = await studioJob(userId, id),
    client = await studioClient(userId, job.client_id),
    brief = briefSchema.parse(job.brief),
    plan = campaignPlanSchema.parse(job.plan?.campaign)
  if (brief.mode !== 'campaign' || !brief.platforms.includes(platform))
    throw new StudioError('Prepare uma campanha completa para este canal antes de enviar.', 400)
  const research = job.plan?.targeting?.sources?.find((source: any) => source.platform === platform)
  if (!research?.locations?.length)
    throw new StudioError(
      'Confirme a cidade no briefing e gere o pacote novamente para verificar a localização.',
      409,
    )
  if (platform === 'meta' && /formul[aá]rio\s+instant[aâ]neo|lead\s*form/i.test(brief.prompt))
    throw new StudioError(
      'Formulários instantâneos devem ser configurados no gerenciador com o pacote preparado. O envio integrado atende site e WhatsApp.',
      409,
    )
  if (!publicDestination(brief.destinationUrl))
    throw new StudioError('Informe o destino HTTPS no briefing antes de enviar.', 409)
  if (platform === 'meta') {
    const accountId = String(client.extra_data?.selectedMetaAccountId || '').replace(/^act_/, '')
    if (!/^\d+$/.test(accountId)) throw new StudioError('Selecione a conta Meta deste cliente.', 409)
    if (String(research.account?.id || '').replace(/^act_/, '') !== accountId)
      throw new StudioError('A conta do cliente mudou. Prepare a campanha novamente.', 409)
    if (plan.meta.specialCategory !== 'NONE')
      throw new StudioError(
        'Esta categoria especial precisa ser configurada diretamente no gerenciador. O pacote foi preservado.',
        409,
      )
    const token = (await getValidMetaToken(userId)).accessToken
    const [account, pages, pixels, custom] = await Promise.all([
      meta(`act_${accountId}`, token, { fields: 'id,name,currency,account_status' }),
      meta(`act_${accountId}/promote_pages`, token, { fields: 'id,name', limit: '100' }),
      brief.objective === 'leads' || brief.objective === 'sales'
        ? meta(`act_${accountId}/adspixels`, token, { fields: 'id,name', limit: '100' })
        : Promise.resolve({ data: [] }),
      meta(`act_${accountId}/customaudiences`, token, { fields: 'id,name', limit: '100' }).catch(() => ({
        data: [],
      })),
    ])
    if (account.currency !== 'BRL' || Number(account.account_status) !== 1)
      throw new StudioError(
        'O envio requer uma conta de anúncios ativa em reais. O rascunho foi preservado.',
        409,
      )
    return {
      job,
      client,
      brief,
      plan,
      research,
      account,
      accountId,
      token,
      pages: pages.data || [],
      pixels: pixels.data || [],
      custom: custom.data || [],
      language: '',
    }
  }
  const accountId = normalizeCustomerId(client.extra_data?.selectedGoogleAccountId || '')
  if (!/^\d{10}$/.test(accountId) || !process.env.GOOGLE_ADS_DEVELOPER_TOKEN)
    throw new StudioError('Selecione a conta Google deste cliente.', 409)
  if (String(research.account?.id) !== accountId)
    throw new StudioError('A conta do cliente mudou. Prepare a campanha novamente.', 409)
  const token = (await getValidGoogleToken(userId)).accessToken,
    developer = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  const [accounts, languages] = await Promise.all([
    gaqlSearch(
      accountId,
      token,
      developer,
      'SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.manager FROM customer LIMIT 1',
    ),
    gaqlSearch(
      accountId,
      token,
      developer,
      "SELECT language_constant.resource_name FROM language_constant WHERE language_constant.code = 'pt' LIMIT 1",
    ),
  ])
  const account = accounts[0]?.customer,
    language = languages[0]?.languageConstant?.resourceName
  if (String(account?.id) !== accountId || account.currencyCode !== 'BRL' || account.manager || !language)
    throw new StudioError(
      'É necessário selecionar uma conta de anúncios Google em reais com idioma português disponível.',
      409,
    )
  return {
    job,
    client,
    brief,
    plan,
    research,
    account: { id: account.id, name: account.descriptiveName, currency: account.currencyCode },
    accountId,
    token,
    pages: [],
    pixels: [],
    custom: [],
    language,
  }
}
export async function publicationOptions(userId: string, id: string, platform: 'meta' | 'google') {
  const ctx = await context(userId, id, platform)
  const assets = await studioDb()
    .from('studio_assets')
    .select('id,name,format')
    .eq('user_id', userId)
    .eq('client_id', ctx.client.id)
    .eq('job_id', id)
    .eq('kind', 'generated')
  if (assets.error) throw new StudioError('Não foi possível ler as artes.')
  const saved = await studioDb()
    .from('studio_publications')
    .select('status,receipts,error')
    .eq('user_id', userId)
    .eq('job_id', id)
    .eq('platform', platform)
    .maybeSingle()
  if (saved.error) throw new StudioError('Não foi possível confirmar um envio anterior.')
  return {
    account: ctx.account,
    locations: ctx.research.locations,
    pages: ctx.pages.map((p: any) => ({ id: p.id, name: p.name })),
    pixels: ctx.pixels.map((p: any) => ({ id: p.id, name: p.name })),
    customAudiences: ctx.custom.map((r: any) => ({ id: r.id, name: r.name })),
    audiences: ctx.plan.meta.audiences,
    interests: (ctx.research.interests || [])
      .flatMap((group: any) => group.options)
      .filter((row: any, index: number, rows: any[]) => rows.findIndex((r) => r.id === row.id) === index),
    assets: assets.data || [],
    budget: ctx.plan[platform].dailyBudget,
    destination: ctx.brief.destinationUrl,
    publication: saved.data,
  }
}
export function googleDraftOperations(
  id: string,
  brief: StudioBrief,
  plan: CampaignPlan,
  location: string,
  language: string,
  maxCpc: number,
  jobId: string,
) {
  const root = `customers/${id}`,
    budget = `${root}/campaignBudgets/-1`,
    campaign = `${root}/campaigns/-2`,
    stamp = jobId.slice(0, 8),
    operations: any[] = []
  operations.push({
    campaignBudgetOperation: {
      create: {
        resourceName: budget,
        name: `${plan.google.campaignName} · Nous ${stamp}`,
        amountMicros: String(Math.round(plan.google.dailyBudget * 1000000)),
        deliveryMethod: 'STANDARD',
        explicitlyShared: false,
      },
    },
  })
  operations.push({
    campaignOperation: {
      create: {
        resourceName: campaign,
        name: `${plan.google.campaignName} · Nous ${stamp}`,
        status: 'PAUSED',
        advertisingChannelType: 'SEARCH',
        campaignBudget: budget,
        manualCpc: {},
        containsEuPoliticalAdvertising: 'DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING',
        networkSettings: {
          targetGoogleSearch: true,
          targetSearchNetwork: false,
          targetContentNetwork: false,
        },
        geoTargetTypeSetting: { positiveGeoTargetType: 'PRESENCE' },
      },
    },
  })
  operations.push(
    { campaignCriterionOperation: { create: { campaign, location: { geoTargetConstant: location } } } },
    { campaignCriterionOperation: { create: { campaign, language: { languageConstant: language } } } },
  )
  plan.google.adGroups.forEach((group, index) => {
    const adGroup = `${root}/adGroups/${-10 - index}`
    operations.push({
      adGroupOperation: {
        create: {
          resourceName: adGroup,
          campaign,
          name: group.name,
          type: 'SEARCH_STANDARD',
          status: 'PAUSED',
          cpcBidMicros: String(Math.round(maxCpc * 1000000)),
        },
      },
    })
    for (const keyword of group.keywords)
      operations.push({
        adGroupCriterionOperation: {
          create: {
            adGroup,
            status: 'PAUSED',
            keyword: { text: keyword.text, matchType: keyword.matchType },
          },
        },
      })
    for (const text of [...new Set(group.negativeKeywords)])
      operations.push({
        adGroupCriterionOperation: {
          create: { adGroup, negative: true, keyword: { text, matchType: 'PHRASE' } },
        },
      })
    operations.push({
      adGroupAdOperation: {
        create: {
          adGroup,
          status: 'PAUSED',
          ad: {
            finalUrls: [brief.destinationUrl],
            responsiveSearchAd: {
              headlines: group.headlines.map((text) => ({ text })),
              descriptions: group.descriptions.map((text) => ({ text })),
              ...(group.path1 ? { path1: group.path1 } : {}),
              ...(group.path2 ? { path2: group.path2 } : {}),
            },
          },
        },
      },
    })
  })
  return operations
}
export async function deliverPausedDraft(userId: string, id: string, input: unknown) {
  const parsed = selectionSchema.safeParse(input)
  if (!parsed.success) throw new StudioError('Revise e confirme os dados do rascunho.', 400)
  const selection = parsed.data,
    ctx = await context(userId, id, selection.platform),
    { job, client, brief, plan, accountId, token, research } = ctx,
    db = studioDb()
  if (
    Math.round(selection.confirmedBudget * 100) !== Math.round(plan[selection.platform].dailyBudget * 100) ||
    selection.confirmedDestination !== brief.destinationUrl
  )
    throw new StudioError('O orçamento ou destino não corresponde à campanha revisada.', 409)
  if (
    selection.platform === 'meta' &&
    !research.locations.some((r: any) => String(r.key) === selection.location)
  )
    throw new StudioError('Localização não verificada para esta campanha.', 400)
  if (
    selection.platform === 'google' &&
    !research.locations.some((r: any) => r.resourceName === selection.location)
  )
    throw new StudioError('Localização não verificada para esta campanha.', 400)
  if (
    selection.platform === 'meta' &&
    (!ctx.pages.some((p: any) => p.id === selection.pageId) ||
      !selection.assetId ||
      (['leads', 'sales'].includes(brief.objective) &&
        !ctx.pixels.some((p: any) => p.id === selection.pixelId)))
  )
    throw new StudioError('Escolha uma página, uma arte e o pixel da conta quando necessário.', 400)
  if (selection.platform === 'google' && !/^geoTargetConstants\/\d+$/.test(selection.location))
    throw new StudioError('Localização inválida.', 400)
  if (selection.platform === 'meta' && !/^\d+$/.test(selection.location))
    throw new StudioError('Localização inválida.', 400)
  const audience = plan.meta.audiences[selection.audienceIndex]
  if (selection.platform === 'meta' && !audience) throw new StudioError('Público inválido.', 400)
  const fingerprint = createHash('sha256')
    .update(JSON.stringify([accountId, job.plan, selection]))
    .digest('hex')
  let inserted = await db
    .from('studio_publications')
    .insert({
      user_id: userId,
      client_id: client.id,
      job_id: id,
      platform: selection.platform,
      status: 'creating',
      fingerprint,
    })
    .select('*')
    .single()
  if (inserted.error) {
    const prior = await db
      .from('studio_publications')
      .select('*')
      .eq('user_id', userId)
      .eq('job_id', id)
      .eq('platform', selection.platform)
      .maybeSingle()
    if (prior.data?.status === 'failed' && !prior.data.receipts?.length) {
      inserted = await db
        .from('studio_publications')
        .update({ status: 'creating', fingerprint, error: null })
        .eq('id', prior.data.id)
        .eq('user_id', userId)
        .eq('status', 'failed')
        .select('*')
        .maybeSingle()
      if (inserted.error || !inserted.data)
        throw new StudioError('Um envio desta campanha já está em andamento.', 409)
    } else if (prior.data)
      return { status: prior.data.status, receipts: prior.data.receipts, error: prior.data.error }
    else throw new StudioError('Não foi possível registrar o envio. Nenhuma publicação foi iniciada.')
  }
  const receipts: any[] = []
  const save = async (status: string, error?: string) => {
    const result = await db
      .from('studio_publications')
      .update({ status, receipts, error: error || null, updated_at: new Date().toISOString() })
      .eq('id', inserted.data.id)
      .eq('user_id', userId)
    if (result.error)
      throw new DeliveryError(
        'O registro da confirmação falhou. Confira o gerenciador antes de repetir.',
        true,
      )
  }
  let issuedWrite = false
  try {
    if (selection.platform === 'google') {
      const geo = await gaqlSearch(
        accountId,
        token,
        process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
        `SELECT geo_target_constant.resource_name, geo_target_constant.status FROM geo_target_constant WHERE geo_target_constant.resource_name = '${selection.location}' LIMIT 1`,
      )
      if (geo[0]?.geoTargetConstant?.status !== 'ENABLED')
        throw new StudioError('A localização não está mais disponível. Prepare o pacote novamente.', 409)
      const operations = googleDraftOperations(
        accountId,
        brief,
        plan,
        selection.location,
        ctx.language,
        selection.maxCpc,
        id,
      )
      await googleMutate(accountId, token, operations, true)
      issuedWrite = true
      const result = await googleMutate(accountId, token, operations, false)
      for (const row of result.mutateOperationResponses || [])
        for (const [type, value] of Object.entries(row))
          if ((value as any)?.resourceName) receipts.push({ type, resourceName: (value as any).resourceName })
      if (!receipts.length)
        throw new DeliveryError(
          'O Google não retornou os identificadores. Confira o gerenciador antes de repetir.',
          true,
        )
    } else {
      const { row, bucket } = await ownedStudioAsset(userId, client.id, selection.assetId!)
      if (row.job_id !== id || row.kind !== 'generated')
        throw new StudioError('Escolha uma arte desta campanha.', 400)
      const page = await meta(selection.pageId, token, {
        fields: brief.objective === 'whatsapp' ? 'id,name,whatsapp_number' : 'id,name',
      })
      if (page.id !== selection.pageId) throw new StudioError('Página inválida.', 409)
      if (brief.objective === 'whatsapp') {
        const url = new URL(brief.destinationUrl),
          phone = url.hostname === 'wa.me' ? url.pathname.replace(/\D/g, '') : ''
        if (!phone || String(page.whatsapp_number || '').replace(/\D/g, '') !== phone)
          throw new StudioError(
            'O destino deve ser o endereço wa.me do WhatsApp conectado à página selecionada.',
            409,
          )
      }
      const locations = await meta('search', token, {
        type: 'adgeolocation',
        location_types: '["city"]',
        q: brief.city,
        limit: '25',
        locale: 'pt_BR',
      })
      if (!locations.data?.some((r: any) => String(r.key) === selection.location))
        throw new StudioError('A cidade não está mais disponível. Prepare o pacote novamente.', 409)
      let audienceTarget: Record<string, unknown> = {}
      if (audience.strategy === 'remarketing') {
        if (!ctx.custom.some((r: any) => r.id === selection.customAudienceId))
          throw new StudioError(
            'Escolha uma base existente na conta Meta. A elegibilidade será validada pela plataforma.',
            409,
          )
        audienceTarget = { custom_audiences: [{ id: selection.customAudienceId }] }
      }
      if (audience.strategy === 'interests') {
        if (!selection.interestIds.length)
          throw new StudioError('Selecione ao menos um interesse verificado.', 400)
        const queries = [
          ...new Set((research.interests || []).map((group: any) => String(group.query))),
        ].slice(0, 3) as string[]
        const fresh = await Promise.all(
          queries.map((q) => meta('search', token, { type: 'adinterest', q, limit: '25', locale: 'pt_BR' })),
        )
        const options = fresh.flatMap((response) => response.data || [])
        if (selection.interestIds.some((id) => !options.some((r: any) => String(r.id) === id)))
          throw new StudioError('Um interesse não está mais disponível. Revise as opções.', 409)
        audienceTarget = { flexible_spec: [{ interests: selection.interestIds.map((id) => ({ id })) }] }
      }
      const downloaded = await db.storage.from(bucket).download(row.storage_path)
      if (downloaded.error || !downloaded.data) throw new StudioError('Não foi possível ler a arte.')
      issuedWrite = true
      const uploaded = await meta(
        `act_${accountId}/adimages`,
        token,
        { bytes: Buffer.from(await downloaded.data.arrayBuffer()).toString('base64') },
        true,
      )
      const imageHash = (Object.values(uploaded.images || {})[0] as any)?.hash
      if (!imageHash) throw new DeliveryError('O Meta não confirmou o envio da arte.', true)
      receipts.push({ type: 'image', hash: imageHash })
      await save('creating')
      const campaign = await meta(
        `act_${accountId}/campaigns`,
        token,
        {
          name: `${plan.meta.campaignName} · Nous ${id.slice(0, 8)}`,
          objective: plan.meta.objective,
          status: 'PAUSED',
          special_ad_categories: '[]',
        },
        true,
      )
      if (!campaign.id) throw new DeliveryError(undefined, true)
      receipts.push({ type: 'campaign', id: campaign.id, status: 'PAUSED' })
      await save('creating')
      const conversion = brief.objective === 'leads' || brief.objective === 'sales',
        whatsapp = brief.objective === 'whatsapp'
      const targeting = {
        ...audienceTarget,
        age_min: 18,
        geo_locations: {
          cities: [{ key: selection.location, radius: brief.radiusKm, distance_unit: 'kilometer' }],
        },
        publisher_platforms: ['facebook', 'instagram'],
        facebook_positions: [row.format === 'story' ? 'story' : 'feed'],
        instagram_positions: [row.format === 'story' ? 'story' : 'stream'],
      }
      const adset = await meta(
        `act_${accountId}/adsets`,
        token,
        {
          name: `${plan.meta.audiences[selection.audienceIndex].name} · ${row.format}`,
          campaign_id: campaign.id,
          daily_budget: String(Math.round(plan.meta.dailyBudget * 100)),
          billing_event: 'IMPRESSIONS',
          optimization_goal: whatsapp ? 'CONVERSATIONS' : conversion ? 'OFFSITE_CONVERSIONS' : 'LINK_CLICKS',
          destination_type: whatsapp ? 'WHATSAPP' : 'WEBSITE',
          ...(whatsapp
            ? { promoted_object: JSON.stringify({ page_id: selection.pageId }) }
            : conversion
              ? {
                  promoted_object: JSON.stringify({
                    pixel_id: selection.pixelId,
                    custom_event_type: brief.objective === 'sales' ? 'PURCHASE' : 'LEAD',
                  }),
                }
              : {}),
          bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
          targeting: JSON.stringify(targeting),
          status: 'PAUSED',
        },
        true,
      )
      if (!adset.id) throw new DeliveryError(undefined, true)
      receipts.push({ type: 'adset', id: adset.id, status: 'PAUSED' })
      await save('creating')
      for (const [index, ad] of plan.meta.ads.entries()) {
        const creative = await meta(
          `act_${accountId}/adcreatives`,
          token,
          {
            name: `${plan.name} · variação ${index + 1}`,
            object_story_spec: JSON.stringify({
              page_id: selection.pageId,
              link_data: {
                message: ad.primaryText,
                link: brief.destinationUrl,
                name: ad.headline,
                description: ad.description,
                image_hash: imageHash,
                call_to_action: {
                  type: whatsapp ? 'WHATSAPP_MESSAGE' : ad.cta === 'WHATSAPP_MESSAGE' ? 'LEARN_MORE' : ad.cta,
                  value: { link: brief.destinationUrl, ...(whatsapp ? { app_destination: 'WHATSAPP' } : {}) },
                },
              },
            }),
          },
          true,
        )
        if (!creative.id) throw new DeliveryError(undefined, true)
        receipts.push({ type: 'creative', id: creative.id })
        await save('creating')
        const created = await meta(
          `act_${accountId}/ads`,
          token,
          {
            name: `${ad.angle} · ${index + 1}`,
            adset_id: adset.id,
            creative: JSON.stringify({ creative_id: creative.id }),
            status: 'PAUSED',
          },
          true,
        )
        if (!created.id) throw new DeliveryError(undefined, true)
        receipts.push({ type: 'ad', id: created.id, status: 'PAUSED' })
        await save('creating')
      }
    }
    await save('paused')
    return { status: 'paused', receipts, error: null }
  } catch (error) {
    const message =
      error instanceof StudioError
        ? error.message
        : 'Não foi possível concluir o rascunho. Confira o gerenciador antes de tentar novamente.'
    const status = receipts.length || issuedWrite ? 'partial' : 'failed'
    await save(status, message)
    return { status, receipts, error: message }
  }
}
