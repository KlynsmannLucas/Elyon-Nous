// app/api/ads-data/google-accounts/route.ts
// Lista contas Google Ads acessíveis para o usuário conectado.
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getValidGoogleToken, tokenErrorToResponse } from '@/services/google/token-manager'
import { gaqlSearch, API_VERSIONS } from '@/lib/google-ads'

async function fetchAccountName(customerId: string, accessToken: string, devToken: string): Promise<string> {
  try {
    const results = await gaqlSearch(
      customerId, accessToken, devToken,
      'SELECT customer.id, customer.descriptive_name FROM customer LIMIT 1'
    )
    return results?.[0]?.customer?.descriptiveName || ''
  } catch {
    return ''
  }
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })

  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  if (!devToken) return NextResponse.json({ success: false, error: 'Developer token não configurado' }, { status: 500 })

  let accessToken: string
  try {
    const token = await getValidGoogleToken(userId)
    accessToken = token.accessToken
  } catch (err) {
    const { error, code } = tokenErrorToResponse(err)
    return NextResponse.json({ success: false, error, code }, { status: 401 })
  }

  try {
    // Passo 1: lista todos os customer IDs acessíveis
    let resourceNames: string[] = []
    for (const version of API_VERSIONS) {
      const res = await fetch(
        `https://googleads.googleapis.com/${version}/customers:listAccessibleCustomers`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}`, 'developer-token': devToken },
          signal: AbortSignal.timeout(10_000),
        }
      )
      const ct = res.headers.get('content-type') || ''
      if (!ct.includes('application/json')) continue
      const data = await res.json()
      if (data.resourceNames) { resourceNames = data.resourceNames; break }
    }

    if (resourceNames.length === 0) {
      return NextResponse.json({ success: true, accounts: [] })
    }

    // Passo 2: busca nome de cada conta (paralelo, máx 15)
    const ids = resourceNames
      .map((r: string) => r.replace('customers/', ''))
      .slice(0, 15)

    const accounts = await Promise.all(
      ids.map(async (id) => {
        const name = await fetchAccountName(id, accessToken, devToken)
        return { id, name: name || `Conta ${id}` }
      })
    )

    return NextResponse.json({ success: true, accounts })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
