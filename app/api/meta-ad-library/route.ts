// app/api/meta-ad-library/route.ts
// Pesquisa INTERNA na Biblioteca de Anúncios do Meta — nunca exibida ao usuário
// Alimenta geração de criativos com exemplos reais do mercado
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { accessToken, searchTerms, niche } = await req.json()
    if (!accessToken || (!searchTerms && !niche)) {
      return NextResponse.json({ success: false, ads: [] })
    }

    const query = searchTerms || niche
    const fields = [
      'ad_creative_bodies',
      'ad_creative_link_captions',
      'ad_creative_link_descriptions',
      'ad_creative_link_titles',
      'page_name',
      'ad_delivery_start_time',
    ].join(',')

    const params = new URLSearchParams({
      ad_type:              'ALL',
      ad_reached_countries: JSON.stringify(['BR']),
      search_terms:         query,
      fields,
      limit:                '8',
      access_token:         accessToken,
    })

    const res = await fetch(
      `https://graph.facebook.com/v19.0/ads_archive?${params}`,
      { signal: AbortSignal.timeout(8000) }
    )

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ success: false, ads: [] })
    }

    const data = await res.json()
    if (data.error) {
      return NextResponse.json({ success: false, ads: [] })
    }

    // Extract only text content — no IDs or URLs
    const ads = (data.data || [])
      .map((ad: any) => ({
        page:        ad.page_name || '',
        body:        (ad.ad_creative_bodies || [])[0] || '',
        title:       (ad.ad_creative_link_titles || [])[0] || '',
        description: (ad.ad_creative_link_descriptions || [])[0] || '',
        caption:     (ad.ad_creative_link_captions || [])[0] || '',
      }))
      .filter((ad: any) => ad.body || ad.title)
      .slice(0, 5)

    return NextResponse.json({ success: true, ads })
  } catch {
    return NextResponse.json({ success: false, ads: [] })
  }
}
