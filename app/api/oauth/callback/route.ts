// app/api/oauth/callback/route.ts — Recebe o código OAuth e troca pelo access token
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code      = searchParams.get('code')
  const stateRaw  = searchParams.get('state') ?? ''
  const error     = searchParams.get('error')

  // state format: "platform:csrfToken"
  const colonIdx  = stateRaw.indexOf(':')
  const platform  = colonIdx > -1 ? stateRaw.slice(0, colonIdx) : stateRaw
  const csrfToken = colonIdx > -1 ? stateRaw.slice(colonIdx + 1) : ''

  // Verify CSRF token against cookie
  const cookieCsrf = req.cookies.get('oauth_csrf')?.value ?? ''
  if (!csrfToken || !cookieCsrf || csrfToken !== cookieCsrf) {
    return NextResponse.redirect(
      new URL(`/dashboard?oauth_error=csrf_invalid&platform=${platform}`, req.url)
    )
  }

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
      const clientId     = process.env.META_APP_ID
      const clientSecret = process.env.META_APP_SECRET
      if (!clientId || !clientSecret) throw new Error('Credenciais Meta não configuradas no servidor')
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
      const clientId     = process.env.GOOGLE_CLIENT_ID
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET
      if (!clientId || !clientSecret) throw new Error('Credenciais Google não configuradas no servidor')
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

    // Token nunca vai na URL — armazenado em cookie httpOnly por 60s
    const oauthResult = Buffer.from(JSON.stringify({
      platform, accessToken, accountId, accountName,
    })).toString('base64')

    const res = NextResponse.redirect(
      new URL(`/dashboard?oauth_success=1&platform=${platform}`, req.url)
    )
    res.cookies.set('oauth_result', oauthResult, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   60,
      path:     '/',
    })
    res.cookies.set('oauth_csrf', '', { maxAge: 0, path: '/' })
    return res

  } catch (e: any) {
    return NextResponse.redirect(
      new URL(`/dashboard?oauth_error=${encodeURIComponent(e.message)}&platform=${platform}`, req.url)
    )
  }
}
