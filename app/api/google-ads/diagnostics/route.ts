// app/api/google-ads/diagnostics/route.ts
// Diagnóstico técnico da integração Google Ads — valida token, env vars e acesso à conta.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { normalizeCustomerId, validateCustomerId, gaqlSearch, API_VERSIONS, parseGoogleAdsError } from '@/lib/google-ads'

interface CheckResult {
  id: string
  label: string
  status: 'ok' | 'error' | 'warning' | 'skip'
  detail: string
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const accountId = body.accountId as string | undefined

  const checks: CheckResult[] = []

  // 1. Developer Token
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  if (!devToken) {
    checks.push({ id: 'dev_token', label: 'Developer Token', status: 'error', detail: 'GOOGLE_ADS_DEVELOPER_TOKEN não configurado no servidor.' })
  } else {
    checks.push({ id: 'dev_token', label: 'Developer Token', status: 'ok', detail: `Configurado (${devToken.length} chars, termina em …${devToken.slice(-4)}).` })
  }

  // 2. Login Customer ID (MCC)
  const loginCid = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
  if (loginCid) {
    const v = validateCustomerId(loginCid)
    checks.push({
      id: 'login_cid', label: 'Login Customer ID (MCC)',
      status: v.valid ? 'ok' : 'warning',
      detail: v.warning || `Configurado: ${loginCid}.`,
    })
  } else {
    checks.push({
      id: 'login_cid', label: 'Login Customer ID (MCC)',
      status: 'warning',
      detail: 'GOOGLE_ADS_LOGIN_CUSTOMER_ID não configurado. Necessário apenas para contas gerenciadas (MCC). Pode ser ignorado para contas diretas.',
    })
  }

  // 3. OAuth Token
  let accessToken: string | null = null
  let storedAccountId: string | null = null
  try {
    const { getValidGoogleToken } = await import('@/services/google/token-manager')
    const token = await getValidGoogleToken(userId)
    accessToken = token.accessToken
    storedAccountId = token.accountId
    checks.push({ id: 'oauth_token', label: 'Token OAuth', status: 'ok', detail: 'Token válido obtido com sucesso (refresh automático OK).' })
  } catch (err: any) {
    checks.push({ id: 'oauth_token', label: 'Token OAuth', status: 'error', detail: `Falha ao obter token: ${err.message}` })
  }

  if (!accessToken || !devToken) {
    return NextResponse.json({ success: true, checks, accountId: null, accessibleAccounts: null })
  }

  // 4. Customer ID validation
  const targetId = accountId || storedAccountId
  if (!targetId) {
    checks.push({ id: 'customer_id', label: 'Customer ID', status: 'error', detail: 'Nenhum Customer ID fornecido nem encontrado nas conexões.' })
  } else {
    const cleanId = normalizeCustomerId(targetId)
    const v = validateCustomerId(cleanId)
    checks.push({
      id: 'customer_id', label: 'Customer ID',
      status: v.valid ? (v.warning ? 'warning' : 'ok') : 'error',
      detail: v.warning || `Customer ID "${cleanId}" validado (${cleanId.length} dígitos).`,
    })
  }

  // 5. listAccessibleCustomers
  let accessibleAccounts: string[] = []
  try {
    for (const version of API_VERSIONS) {
      const res = await fetch(
        `https://googleads.googleapis.com/${version}/customers:listAccessibleCustomers`,
        {
          headers: { Authorization: `Bearer ${accessToken}`, 'developer-token': devToken },
          signal: AbortSignal.timeout(10_000),
        }
      )
      const ct = res.headers.get('content-type') || ''
      if (!ct.includes('application/json')) continue
      const data = await res.json()
      if (data.error) {
        const detail = parseGoogleAdsError(data, res.status)
        checks.push({ id: 'list_accounts', label: 'Listar contas acessíveis', status: 'error', detail: detail.rawMessage })
        break
      }
      if (data.resourceNames) {
        accessibleAccounts = (data.resourceNames as string[]).map(r => r.replace('customers/', ''))
        checks.push({
          id: 'list_accounts', label: 'Listar contas acessíveis',
          status: 'ok',
          detail: `${accessibleAccounts.length} conta(s) acessível(is): ${accessibleAccounts.slice(0, 5).join(', ')}${accessibleAccounts.length > 5 ? ` +${accessibleAccounts.length - 5} mais` : ''}.`,
        })
        break
      }
    }
    // All versions returned non-JSON (HTML 404) — API not enabled or endpoint unreachable
    if (!checks.some(c => c.id === 'list_accounts')) {
      checks.push({
        id: 'list_accounts', label: 'Listar contas acessíveis', status: 'error',
        detail: `A API retornou HTML (não JSON) para todas as versões testadas (${API_VERSIONS.join(', ')}). Causas prováveis: (1) Google Ads API não está habilitada no Google Cloud Console para este projeto; (2) Developer Token em modo de teste bloqueando produção; (3) problema de rede ou CORS. Acesse console.cloud.google.com → APIs & Services → Google Ads API → Ativar.`,
      })
    }
  } catch (err: any) {
    checks.push({ id: 'list_accounts', label: 'Listar contas acessíveis', status: 'error', detail: err.message })
  }

  // 6. Validate target account access
  if (targetId && accessibleAccounts.length > 0) {
    const cleanId = normalizeCustomerId(targetId)
    const found = accessibleAccounts.includes(cleanId)
    if (!found) {
      checks.push({
        id: 'account_access', label: 'Acesso ao Customer ID alvo',
        status: 'error',
        detail: `Customer ID "${cleanId}" NÃO está na lista de contas acessíveis. Contas disponíveis: ${accessibleAccounts.slice(0, 5).join(', ')}. Selecione uma delas ou verifique se o zero à esquerda foi perdido.`,
      })
    } else {
      checks.push({ id: 'account_access', label: 'Acesso ao Customer ID alvo', status: 'ok', detail: `Customer ID "${cleanId}" encontrado nas contas acessíveis.` })
    }
  }

  // 7. Minimal GAQL query
  if (targetId) {
    const cleanId = normalizeCustomerId(targetId)
    try {
      const results = await gaqlSearch(
        cleanId, accessToken, devToken,
        'SELECT customer.id, customer.descriptive_name, customer.currency_code FROM customer LIMIT 1'
      )
      const cust = results?.[0]?.customer
      checks.push({
        id: 'gaql_query', label: 'Consulta GAQL mínima',
        status: 'ok',
        detail: cust
          ? `Sucesso. Conta: "${cust.descriptiveName || 'sem nome'}", moeda: ${cust.currencyCode || '?'}.`
          : 'Consulta executada (sem resultado de conta).',
      })
    } catch (err: any) {
      checks.push({ id: 'gaql_query', label: 'Consulta GAQL mínima', status: 'error', detail: err.message })
    }
  } else {
    checks.push({ id: 'gaql_query', label: 'Consulta GAQL mínima', status: 'skip', detail: 'Pulado — nenhum Customer ID disponível.' })
  }

  const hasError = checks.some(c => c.status === 'error')
  return NextResponse.json({
    success: true,
    healthy: !hasError,
    checks,
    accountId: targetId ? normalizeCustomerId(targetId) : null,
    accessibleAccounts: accessibleAccounts.length > 0 ? accessibleAccounts : null,
  })
}
