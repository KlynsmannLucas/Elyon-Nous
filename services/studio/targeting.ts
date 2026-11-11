import { getValidMetaToken } from '@/services/meta/token-manager'
import { getValidGoogleToken } from '@/services/google/token-manager'
import { gaqlSearch, normalizeCustomerId } from '@/lib/google-ads'
import type { CampaignPlan, StudioBrief } from '@/lib/studio/schema'

async function metaRead(path: string, params: Record<string, string>, token: string) {
  const response = await fetch(`https://graph.facebook.com/v21.0/${path}?${new URLSearchParams(params)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(9000),
  })
  const data = await response.json()
  if (!response.ok || data.error) throw new Error('Meta não disponível')
  return data
}
async function googleRead(path: string, body: unknown, token: string) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    'Content-Type': 'application/json',
  }
  if (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID)
    headers['login-customer-id'] = normalizeCustomerId(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID)
  const response = await fetch(`https://googleads.googleapis.com/v26/${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(12000),
  })
  const data = await response.json()
  if (!response.ok || data.error) throw new Error('Google não disponível')
  return data
}
export async function researchTargeting(userId: string, client: any, brief: StudioBrief, plan: CampaignPlan) {
  const results = await Promise.allSettled(
    brief.platforms.map(async (platform) => {
      if (platform === 'meta') {
        const id = String(client.extra_data?.selectedMetaAccountId || '').replace(/^act_/, '')
        if (!/^\d+$/.test(id))
          return {
            platform,
            status: 'unavailable',
            message: 'Selecione a conta Meta deste cliente nas integrações. O plano permanece como hipótese.',
          }
        const token = (await getValidMetaToken(userId)).accessToken
        const account = await metaRead(`act_${id}`, { fields: 'id,name,currency,account_status' }, token)
        const queries = [...new Set(plan.meta.audiences.flatMap((a) => a.interestQueries))].slice(0, 3)
        const searches = await Promise.allSettled(
          queries.map(async (query) => {
            const data = await metaRead(
              'search',
              { type: 'adinterest', q: query, limit: '8', locale: 'pt_BR' },
              token,
            )
            return {
              query,
              options: (data.data || []).map((r: any) => ({
                id: String(r.id),
                name: r.name,
                sizeLower: r.audience_size_lower_bound ?? null,
                sizeUpper: r.audience_size_upper_bound ?? null,
              })),
            }
          }),
        )
        const geo = brief.city
          ? await metaRead(
              'search',
              {
                type: 'adgeolocation',
                location_types: '["city"]',
                q: brief.city,
                limit: '8',
                locale: 'pt_BR',
              },
              token,
            ).catch(() => null)
          : null
        return {
          platform,
          status:
            searches.every((r) => r.status === 'fulfilled') && (!brief.city || geo) ? 'verified' : 'partial',
          account: { id: account.id, name: account.name, currency: account.currency },
          interests: searches.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])),
          locations: (geo?.data || []).map((r: any) => ({
            key: r.key,
            name: r.name,
            region: r.region,
            country: r.country_code,
          })),
          note: 'Opções consultadas no Meta. Confirme a localização e disponibilidade ao publicar. Tamanho de interesse não é previsão de alcance da campanha. Remarketing exige uma base elegível.',
        }
      }
      const id = normalizeCustomerId(client.extra_data?.selectedGoogleAccountId || '')
      if (!/^\d{10}$/.test(id) || !process.env.GOOGLE_ADS_DEVELOPER_TOKEN)
        return {
          platform,
          status: 'unavailable',
          message:
            'Selecione a conta Google deste cliente nas integrações. As palavras-chave permanecem como hipóteses.',
        }
      const token = (await getValidGoogleToken(userId)).accessToken,
        developer = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
      const [accounts, languages] = await Promise.all([
        gaqlSearch(
          id,
          token,
          developer,
          'SELECT customer.id, customer.descriptive_name, customer.currency_code FROM customer LIMIT 1',
        ),
        gaqlSearch(
          id,
          token,
          developer,
          "SELECT language_constant.resource_name FROM language_constant WHERE language_constant.code = 'pt' LIMIT 1",
        ),
      ])
      if (String(accounts[0]?.customer?.id) !== id) throw new Error('Conta não verificada')
      const geo = brief.city
        ? await googleRead(
            'geoTargetConstants:suggest',
            { locale: 'pt', locationNames: { names: [brief.city] } },
            token,
          ).catch(() => null)
        : null
      const locations = (geo?.geoTargetConstantSuggestions || [])
        .filter((r: any) => r.geoTargetConstant?.status === 'ENABLED')
        .map((r: any) => ({
          resourceName: r.geoTargetConstant.resourceName,
          name: r.geoTargetConstant.name,
          canonicalName: r.geoTargetConstant.canonicalName,
          country: r.geoTargetConstant.countryCode,
        }))
      // Never silently choose one city from several similarly named candidates.
      const geoResources = locations.length === 1 ? [locations[0].resourceName] : []
      const seeds = [...new Set(plan.google.adGroups.flatMap((g) => g.keywords.map((k) => k.text)))].slice(
        0,
        20,
      )
      const language = languages[0]?.languageConstant?.resourceName
      const ideas =
        language && (!brief.city || geoResources.length)
          ? await googleRead(
              `customers/${id}:generateKeywordIdeas`,
              {
                language,
                geoTargetConstants: geoResources,
                keywordPlanNetwork: 'GOOGLE_SEARCH',
                includeAdultKeywords: false,
                keywordSeed: { keywords: seeds },
                pageSize: 30,
              },
              token,
            ).catch(() => null)
          : null
      return {
        platform,
        status: ideas ? 'verified' : 'partial',
        account: {
          id,
          name: accounts[0]?.customer?.descriptiveName,
          currency: accounts[0]?.customer?.currencyCode,
        },
        locations,
        keywords: (ideas?.results || [])
          .slice(0, 30)
          .map((r: any) => ({
            text: r.text,
            averageMonthlySearches: r.keywordIdeaMetrics?.avgMonthlySearches ?? null,
            competition: r.keywordIdeaMetrics?.competition ?? null,
            lowCpcMicros: r.keywordIdeaMetrics?.lowTopOfPageBidMicros ?? null,
            highCpcMicros: r.keywordIdeaMetrics?.highTopOfPageBidMicros ?? null,
          })),
        note: ideas
          ? 'Histórico do Planejador de palavras-chave; não é previsão de leads nem custo garantido. Revise local, idioma e conversão principal antes de publicar.'
          : 'Pesquisa histórica pendente. Confirme a localização e o acesso ao Planejador; sugestões do plano continuam como hipóteses.',
      }
    }),
  )
  return {
    researchedAt: new Date().toISOString(),
    sources: results.map((r, index) =>
      r.status === 'fulfilled'
        ? r.value
        : {
            platform: brief.platforms[index],
            status: 'unavailable',
            message:
              'Não foi possível verificar esta plataforma agora. O planejamento foi preservado como hipótese.',
          },
    ),
  }
}
