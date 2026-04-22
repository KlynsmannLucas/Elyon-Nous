// app/api/oauth/callback/route.ts — Recebe o código OAuth e troca pelo access token
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code     = searchParams.get('code')
  const platform = searchParams.get('state') // 'meta' ou 'google' passado no state
  const error    = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/dashboard?oauth_error=${error || 'sem_codigo'}&platform=${platform}`, req.url)
    )
  }

  try {
    let accessToken = ''
    let accountId   = ''
    let accountName = ''

    const appOrigin = new URL(req.url).origin

    // ── META ────────────────────────────────────────────────────────────────────
    if (platform === 'meta') {
      const clientId     = process.env.META_APP_ID!
      const clientSecret = process.env.META_APP_SECRET!
      const redirectUri  = `${appOrigin}/api/oauth/callback`

      const tokenRes = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?` +
        `client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&client_secret=${clientSecret}&code=${code}`
      )
      const metaContentType = tokenRes.headers.get('content-type') || ''
      if (!metaContentType.includes('application/json') && !metaContentType.includes('text/javascript')) {
        const text = await tokenRes.text()
        throw new Error(`Resposta inesperada do Meta (${tokenRes.status}): ${text.slice(0, 200)}`)
      }
      const tokenData = await tokenRes.json()
      if (tokenData.error) throw new Error(tokenData.error.message)
      accessToken = tokenData.access_token

      // Busca ad accounts do usuário
      const accountsRes = await fetch(
        `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name&access_token=${accessToken}`
      )
      const accountsData = await accountsRes.json()
      if (accountsData.data?.[0]) {
        accountId   = accountsData.data[0].id.replace('act_', '')
        accountName = accountsData.data[0].name
      }
    }

    // ── GOOGLE ──────────────────────────────────────────────────────────────────
    if (platform === 'google') {
      const clientId     = process.env.GOOGLE_CLIENT_ID!
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
      const redirectUri  = `${appOrigin}/api/oauth/callback`

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code, client_id: clientId, client_secret: clientSecret,
          redirect_uri: redirectUri, grant_type: 'authorization_code',
        }),
      })

      // Guard: parse JSON only if response is actually JSON
      const tokenContentType = tokenRes.headers.get('content-type') || ''
      if (!tokenContentType.includes('application/json') && !tokenContentType.includes('text/json')) {
        const text = await tokenRes.text()
        throw new Error(`Resposta inesperada do Google OAuth (${tokenRes.status}): ${text.slice(0, 200)}`)
      }
      const tokenData = await tokenRes.json()
      if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error)
      accessToken = tokenData.access_token

      // Busca email do usuário para accountName (não depende do developer token)
      try {
        const userRes  = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        })
        const userData = await userRes.json()
        accountName = userData.email || 'Google Ads'
      } catch {
        accountName = 'Google Ads'
      }

      // Tenta buscar customer ID do Google Ads — falha silenciosa se developer token ausente/inválido
      const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
      if (devToken) {
        try {
          const customerRes = await fetch(
            'https://googleads.googleapis.com/v18/customers:listAccessibleCustomers',
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'developer-token': devToken,
              },
            }
          )
          const customerContentType = customerRes.headers.get('content-type') || ''
          if (customerContentType.includes('application/json') || customerContentType.includes('text/json')) {
            const customerData = await customerRes.json()
            if (customerData.resourceNames?.[0]) {
              accountId = customerData.resourceNames[0].replace('customers/', '')
            }
          }
        } catch {
          // Não bloqueia o OAuth se o Google Ads API falhar
        }
      }
    }

    // Redireciona de volta com os dados via query string (salvo no client pelo TabConnections)
    const params = new URLSearchParams({
      oauth_success: '1',
      platform: platform || '',
      access_token: accessToken,
      account_id: accountId,
      account_name: accountName,
    })
    return NextResponse.redirect(new URL(`/dashboard?${params}`, req.url))

  } catch (e: any) {
    return NextResponse.redirect(
      new URL(`/dashboard?oauth_error=${encodeURIComponent(e.message)}&platform=${platform}`, req.url)
    )
  }
}
