import { z } from 'zod'

export const studioFormats = ['feed', 'story', 'square', 'landscape'] as const
export type StudioFormat = (typeof studioFormats)[number]
export const FORMAT_DIMENSIONS: Record<
  StudioFormat,
  { width: number; height: number; generationSize: `${number}x${number}`; label: string }
> = {
  feed: { width: 1080, height: 1350, generationSize: '1280x1600', label: 'Feed · 4:5' },
  story: { width: 1080, height: 1920, generationSize: '1152x2048', label: 'Stories · 9:16' },
  square: { width: 1080, height: 1080, generationSize: '1024x1024', label: 'Quadrado · 1:1' },
  landscape: { width: 1200, height: 628, generationSize: '1536x800', label: 'Horizontal · 1,91:1' },
}
export const briefSchema = z
  .object({
    mode: z.enum(['campaign', 'creative', 'audience']),
    prompt: z.string().trim().min(10).max(4000),
    platforms: z
      .array(z.enum(['meta', 'google']))
      .min(1)
      .max(2),
    objective: z.enum(['leads', 'whatsapp', 'sales', 'traffic']),
    dailyBudget: z.number().finite().min(0).max(100000),
    city: z.string().trim().max(120),
    radiusKm: z.number().int().min(17).max(80),
    destinationUrl: z.string().trim().max(2048),
    referenceIds: z.array(z.string().regex(/^(legacy:)?[a-f0-9-]{36}$/i)).max(5),
    formats: z.array(z.enum(studioFormats)).max(2),
    brandColors: z.array(z.string().regex(/^#[a-f0-9]{6}$/i)).max(3),
  })
  .superRefine((brief, context) => {
    if (
      new Set(brief.platforms).size !== brief.platforms.length ||
      new Set(brief.formats).size !== brief.formats.length ||
      new Set(brief.referenceIds).size !== brief.referenceIds.length
    )
      context.addIssue({ code: 'custom', message: 'Remova as seleções repetidas.' })
    if (brief.mode !== 'audience' && !brief.formats.length)
      context.addIssue({ code: 'custom', message: 'Escolha ao menos um formato.' })
    if (brief.destinationUrl && !publicDestination(brief.destinationUrl))
      context.addIssue({ code: 'custom', message: 'Informe um endereço HTTPS público válido.' })
  })
export type StudioBrief = z.infer<typeof briefSchema>
export function publicDestination(value: string) {
  try {
    const url = new URL(value)
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.port &&
      url.hostname.includes('.') &&
      !/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[)/i.test(url.hostname) &&
      !/^172\.(1[6-9]|2\d|3[01])\./.test(url.hostname) &&
      !/\.(local|internal)$/i.test(url.hostname)
    )
  } catch {
    return false
  }
}

const note = z.string().min(1).max(600)
export const campaignPlanSchema = z.object({
  name: z.string().min(1).max(120),
  summary: z.string().min(1).max(1400),
  positioning: note,
  confirmedFacts: z.array(z.string().max(240)).max(12),
  missingInformation: z.array(z.string().max(240)).max(12),
  warnings: z.array(z.string().max(240)).max(12),
  measurement: z.object({ primaryEvent: z.string().max(160), howToMeasure: note, attributionNote: note }),
  meta: z.object({
    enabled: z.boolean(),
    campaignName: z.string().max(120),
    objective: z.enum(['OUTCOME_LEADS', 'OUTCOME_SALES', 'OUTCOME_TRAFFIC', 'OUTCOME_ENGAGEMENT']),
    dailyBudget: z.number().min(0).max(100000),
    specialCategory: z.enum(['NONE', 'HOUSING', 'EMPLOYMENT', 'CREDIT', 'ISSUES_ELECTIONS_POLITICS']),
    audiences: z
      .array(
        z.object({
          name: z.string().max(100),
          strategy: z.enum(['broad', 'interests', 'remarketing']),
          interestQueries: z.array(z.string().max(80)).max(3),
          exclusions: z.array(z.string().max(120)).max(5),
          reasoning: note,
          hypothesis: note,
        }),
      )
      .min(1)
      .max(3),
    ads: z
      .array(
        z.object({
          headline: z.string().min(1).max(40),
          primaryText: z.string().min(1).max(500),
          description: z.string().max(30),
          cta: z.enum([
            'LEARN_MORE',
            'CONTACT_US',
            'GET_QUOTE',
            'SIGN_UP',
            'SHOP_NOW',
            'BOOK_NOW',
            'WHATSAPP_MESSAGE',
          ]),
          angle: z.string().max(160),
          testHypothesis: note,
        }),
      )
      .min(1)
      .max(3),
  }),
  google: z.object({
    enabled: z.boolean(),
    campaignName: z.string().max(120),
    dailyBudget: z.number().min(0).max(100000),
    adGroups: z
      .array(
        z.object({
          name: z.string().max(100),
          keywords: z
            .array(z.object({ text: z.string().min(1).max(80), matchType: z.enum(['EXACT', 'PHRASE']) }))
            .min(1)
            .max(12),
          negativeKeywords: z.array(z.string().min(1).max(80)).max(20),
          headlines: z.array(z.string().min(1).max(30)).min(3).max(10),
          descriptions: z.array(z.string().min(1).max(90)).min(2).max(4),
          path1: z.string().max(15),
          path2: z.string().max(15),
          reasoning: note,
        }),
      )
      .min(1)
      .max(2),
    audienceSignals: z.array(z.string().max(160)).max(6),
    goalNote: note,
  }),
  creativeBriefs: z
    .array(
      z.object({
        concept: z.string().max(160),
        artDirection: note,
        imagePrompt: z.string().min(30).max(1800),
        overlayHeadline: z.string().max(70),
        overlayCTA: z.string().max(25),
      }),
    )
    .min(1)
    .max(2),
  testPlan: z
    .array(
      z.object({
        hypothesis: note,
        change: z.string().max(240),
        successMetric: z.string().max(160),
        minimumEvidence: z.string().max(300),
      }),
    )
    .min(1)
    .max(4),
})
export type CampaignPlan = z.infer<typeof campaignPlanSchema>

export function normalizeCampaignPlan(plan: CampaignPlan, brief: StudioBrief): CampaignPlan {
  const result = campaignPlanSchema.parse(plan)
  result.meta.enabled = brief.platforms.includes('meta')
  result.google.enabled = brief.platforms.includes('google')
  result.meta.objective =
    brief.objective === 'whatsapp'
      ? 'OUTCOME_ENGAGEMENT'
      : brief.objective === 'sales'
        ? 'OUTCOME_SALES'
        : brief.objective === 'traffic'
          ? 'OUTCOME_TRAFFIC'
          : 'OUTCOME_LEADS'
  const cents = Math.round(brief.dailyBudget * 100)
  const metaWeight = result.meta.enabled ? Math.max(0, result.meta.dailyBudget) : 0
  const googleWeight = result.google.enabled ? Math.max(0, result.google.dailyBudget) : 0
  const weight = metaWeight + googleWeight
  const metaCents = !result.meta.enabled
    ? 0
    : !result.google.enabled
      ? cents
      : weight > 0
        ? Math.round((cents * metaWeight) / weight)
        : Math.round(cents / 2)
  result.meta.dailyBudget = metaCents / 100
  result.google.dailyBudget = result.google.enabled ? (cents - metaCents) / 100 : 0
  if (!brief.city)
    result.missingInformation.push('Cidade ou região de atendimento para confirmar a segmentação geográfica.')
  if (!brief.destinationUrl && brief.mode === 'campaign')
    result.missingInformation.push('Destino do anúncio antes de enviar à plataforma.')
  if (brief.mode === 'campaign' && !brief.dailyBudget)
    result.missingInformation.push('Orçamento diário para o rascunho.')
  result.missingInformation = [...new Set(result.missingInformation)]
  for (const group of result.google.adGroups) {
    group.headlines = [...new Set(group.headlines)]
    group.descriptions = [...new Set(group.descriptions)]
    group.keywords = group.keywords.filter(
      (keyword, index, rows) =>
        rows.findIndex(
          (row) =>
            row.text.toLowerCase() === keyword.text.toLowerCase() && row.matchType === keyword.matchType,
        ) === index,
    )
    if (!group.path1) group.path2 = ''
  }
  return campaignPlanSchema.parse(result)
}

export function generationCost(brief: Pick<StudioBrief, 'mode' | 'formats'>) {
  const plan = brief.mode === 'creative' ? 2 : 4
  return {
    plan,
    images: brief.mode === 'audience' ? 0 : brief.formats.length * 5,
    total: plan + (brief.mode === 'audience' ? 0 : brief.formats.length * 5),
  }
}
