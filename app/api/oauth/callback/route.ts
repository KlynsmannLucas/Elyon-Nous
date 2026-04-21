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
      const tokenData = await tokenRes.json()
      if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error)
      accessToken = tokenData.access_token

      // Busca customer ID do Google Ads
      const customerRes = await fetch(
        'https://googleads.googleapis.com/v16/customers:listAccessibleCustomers',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
          },
        }
      )
      const customerData = await customerRes.json()
      if (customerData.resourceNames?.[0]) {
        accountId   = customerData.resourceNames[0].replace('customers/', '')
        accountName = `Google Ads — ${accountId}`
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
