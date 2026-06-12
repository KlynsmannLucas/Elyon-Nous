// app/api/oauth/callback/route.ts — Recebe o código OAuth e troca pelo access token
// SEGURANÇA: refresh_token é persistido no Supabase (criptografado). Nunca vai na URL.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { saveConnection } from '@/repositories/user-connections'
import { API_VERSIONS } from '@/lib/google-ads'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code      = searchParams.get('code')
  const stateRaw  = searchParams.get('state') ?? ''
  const oauthErr  = searchParams.get('error')

  // state format: "platform:csrfToken"
  const colonIdx  = stateRaw.indexOf(':')
  const platform  = colonIdx > -1 ? stateRaw.slice(0, colonIdx) : stateRaw
  const csrfToken = colonIdx > -1 ? stateRaw.slice(colonIdx + 1) : ''

  const cookieCsrf = req.cookies.get('oauth_csrf')?.value ?? ''
  if (!csrfToken || !cookieCsrf || csrfToken !== cookieCsrf) {
    return NextResponse.redirect(
      new URL(`/dashboard?oauth_error=csrf_invalid&platform=${platform}`, req.url)
    )
  }

  if (oauthErr || !code) {
    return NextResponse.redirect(
      new URL(`/dashboard?oauth_error=${oauthErr || 'sem_codigo'}&platform=${platform}`, req.url)
    )
  }

  try {
    let accessToken  = ''
    let refreshToken = ''
    let expiresAt    = ''
    let accountId    = ''
    let accountName  = ''
    let allAccounts: { id: string; name: string }[] = []

    let appOrigin = (process.env.NEXT_PUBLIC_APP_URL || '').trim().replace(/\/$/, '')
    if (!appOrigin.startsWith('http://') && !appOrigin.startsWith('https://')) {
      appOrigin = appOrigin ? `https://${appOrigin}` : new URL(req.url).origin
    }

    // ── META ─────────────────────────────────────────────────────────────────
    if (platform === 'meta') {
      const clientId     = process.env.META_APP_ID
      const clientSecret = process.env.META_APP_SECRET
      if (!clientId || !clientSecret) throw new Error('Credenciais Meta não configuradas no servidor')
      const redirectUri  = `${appOrigin}/api/oauth/callback`

      // 1. Troca código pelo short-lived token
      const tokenRes = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?` +
        `client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&client_secret=${clientSecret}&code=${code}`
      )
      const metaCT = tokenRes.headers.get('content-type') || ''
      if (!metaCT.includes('application/json') && !metaCT.includes('text/javascript')) {
        const text = await tokenRes.text()
        throw new Error(`Resposta inesperada do Meta (${tokenRes.status}): ${text.slice(0, 200)}`)
      }
      const tokenData = await tokenRes.json()
      if (tokenData.error) throw new Error(tokenData.error.message)
      const shortLivedToken = tokenData.access_token as string

      // 2. Troca pelo long-lived token (~60 dias)
      const llRes = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?` +
        `grant_type=fb_exchange_token` +
        `&client_id=${clientId}` +
        `&client_secret=${clientSecret}` +
        `&fb_exchange_token=${shortLivedToken}`,
        { signal: AbortSignal.timeout(10_000) }
      )
      const llCT = llRes.headers.get('content-type') || ''
      if (!llCT.includes('application/json') && !llCT.includes('text/javascript')) {
        // Fallback: usa short-lived se a troca falhar
        accessToken = shortLivedToken
        expiresAt   = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
      } else {
        const llData = await llRes.json()
        if (llData.error) {
          // Fallback: usa short-lived
          accessToken = shortLivedToken
          expiresAt   = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
        } else {
          accessToken = llData.access_token as string
          // Meta retorna expires_in em segundos quando disponível, senão assume 60 dias
          const expiresIn = llData.expires_in ? (llData.expires_in as number) : 60 * 24 * 60 * 60
          expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()
        }
      }

      // 3. Busca ad accounts associados
      const accountsRes  = await fetch(
        `https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name&limit=50&access_token=${accessToken}`
      )
      const accountsData = await accountsRes.json()
      allAccounts = (accountsData.data || []).map((a: any) => ({
        id:   a.id.replace('act_', ''),
        name: a.name,
      }))
      if (allAccounts[0]) { accountId = allAccounts[0].id; accountName = allAccounts[0].name }

      // 4. Persiste token no Supabase (criptografado)
      try {
        const { userId } = await auth()
        if (userId) {
          await saveConnection({
            userId,
            platform:     'meta',
            accessToken,
            refreshToken: null, // Meta não usa refresh_token
            accountId:    accountId   || null,
            accountName:  accountName || null,
            connectedAt:  new Date().toISOString(),
            expiresAt:    expiresAt   || null,
          })
          console.info(`[oauth] Token Meta salvo no DB para usuário ${userId.slice(0, 8)}… (expira: ${expiresAt})`)
        }
      } catch (dbErr: unknown) {
        // Não bloqueia o fluxo se o DB falhar — o token ainda vai no cookie
        const msg = dbErr instanceof Error ? dbErr.message : String(dbErr)
        console.warn('[oauth] Falha ao persistir token Meta no Supabase:', msg)
      }
    }

    // ── GOOGLE ───────────────────────────────────────────────────────────────
    if (platform === 'google') {
      // Usa o mesmo client_id que iniciou o fluxo (NEXT_PUBLIC_ é o mesmo valor,
      // mas garante consistência caso GOOGLE_CLIENT_ID tenha typo no Vercel)
      const clientId     = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET
      if (!clientId || !clientSecret) throw new Error('Credenciais Google não configuradas no servidor')
      // redirect_uri deve ser idêntico ao que o browser enviou ao Google.
      // req.url.origin é a URL real recebida pelo servidor (mesmo domínio do browser).
      const callbackOrigin = new URL(req.url).origin
      const redirectUri    = `${callbackOrigin}/api/oauth/callback`

      console.info(`[oauth/google] clientId=${clientId?.slice(0, 20)}… redirectUri=${redirectUri}`)

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id:     clientId,
          client_secret: clientSecret,
          redirect_uri:  redirectUri,
          grant_type:    'authorization_code',
        }),
      })

      const googleCT = tokenRes.headers.get('content-type') || ''
      if (!googleCT.includes('application/json') && !googleCT.includes('text/json')) {
        const text = await tokenRes.text()
        throw new Error(`Resposta inesperada do Google OAuth (${tokenRes.status}): ${text.slice(0, 200)}`)
      }
      const tokenData = await tokenRes.json()
      if (tokenData.error) {
        console.error(`[oauth/google] Erro token exchange: ${tokenData.error} — ${tokenData.error_description} | redirect_uri=${redirectUri} | clientId_prefix=${clientId?.slice(0, 20)}`)
        throw new Error(tokenData.error_description || tokenData.error)
      }

      accessToken  = tokenData.access_token
      refreshToken = tokenData.refresh_token || ''    // presente quando prompt=consent
      expiresAt    = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : ''

      // Email do usuário para accountName
      try {
        const userRes  = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        })
        const userData = await userRes.json()
        accountName = userData.email || 'Google Ads'
      } catch { accountName = 'Google Ads' }

      // Customer ID do Google Ads
      const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
      if (devToken) {
        try {
          const customerRes = await fetch(
            `https://googleads.googleapis.com/${API_VERSIONS[0]}/customers:listAccessibleCustomers`,
            { headers: { 'Authorization': `Bearer ${accessToken}`, 'developer-token': devToken } }
          )
          const customerCT = customerRes.headers.get('content-type') || ''
          if (customerCT.includes('application/json') || customerCT.includes('text/json')) {
            const customerData = await customerRes.json()
            if (customerData.resourceNames?.[0]) {
              accountId = customerData.resourceNames[0].replace('customers/', '')
            }
          }
        } catch { /* não bloqueia o OAuth */ }
      }

      // Persiste tokens no Supabase (criptografados) — usa Clerk userId
      // auth() sem parâmetros funciona no App Router
      try {
        const { userId } = await auth()
        if (userId) {
          await saveConnection({
            userId,
            platform:     'google',
            accessToken,
            refreshToken: refreshToken || null,
            accountId:    accountId   || null,
            accountName:  accountName || null,
            connectedAt:  new Date().toISOString(),
            expiresAt:    expiresAt   || null,
          })
          console.info(`[oauth] Tokens Google salvos no DB para usuário ${userId.slice(0, 8)}…`)
        }
      } catch (dbErr: any) {
        // Não bloqueia o fluxo se o DB falhar — o token ainda vai no cookie
        console.warn('[oauth] Falha ao persistir token Google no Supabase:', dbErr.message)
      }
    }

    // Token vai em cookie httpOnly por 60s para o frontend ler e armazenar em memória
    const oauthResult = Buffer.from(JSON.stringify({
      platform, accessToken, accountId, accountName,
      accounts: allAccounts,
    })).toString('base64')

    // Volta para onde o usuário iniciou a conexão (ex.: /integracoes no v2), default /dashboard
    const rt = req.cookies.get('oauth_return')?.value
    const returnTo = rt && rt.startsWith('/') && !rt.includes('//') ? rt : '/dashboard'
    const res = NextResponse.redirect(
      new URL(`${returnTo}?oauth_success=1&platform=${platform}`, req.url)
    )
    res.cookies.set('oauth_return', '', { maxAge: 0, path: '/' })
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
