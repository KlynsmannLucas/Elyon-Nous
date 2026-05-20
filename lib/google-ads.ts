// lib/google-ads.ts — Shared Google Ads REST API helpers

export const API_VERSIONS = ['v19', 'v18', 'v17']

/** Remove hyphens, preserve leading zeros — never coerce to number */
export function normalizeCustomerId(id: string | number): string {
  return String(id).replace(/-/g, '').trim()
}

/** Validate customer ID is 9–10 digits. Returns warning for 9-digit IDs (possible lost leading zero). */
export function validateCustomerId(id: string): { valid: boolean; warning?: string } {
  const clean = normalizeCustomerId(id)
  if (!/^\d{9,10}$/.test(clean)) {
    return { valid: false, warning: `Customer ID "${clean}" inválido — deve ter 9 ou 10 dígitos numéricos.` }
  }
  if (clean.length === 9) {
    return {
      valid: true,
      warning: `Customer ID com 9 dígitos detectado. Se a conta foi criada com ID "0${clean}", o zero à esquerda pode ter sido perdido ao salvar como número.`,
    }
  }
  return { valid: true }
}

export interface GoogleAdsErrorDetail {
  httpStatus: number
  rawMessage: string
  errorCode?: string
}

/** Extract structured error info from a Google Ads API error response body */
export function parseGoogleAdsError(data: any, httpStatus: number): GoogleAdsErrorDetail {
  const error = data?.error
  if (!error) return { httpStatus, rawMessage: `HTTP ${httpStatus}` }
  const rawMessage = typeof error.message === 'string' ? error.message : JSON.stringify(error)
  const firstDetail = error.details?.[0]
  const firstErr    = firstDetail?.errors?.[0]
  const codeObj     = firstErr?.errorCode
  const errorCode   = codeObj
    ? Object.keys(codeObj)
        .map(k => `${k}/${codeObj[k]}`)
        .join(', ')
    : undefined
  return { httpStatus, rawMessage, errorCode }
}

/** Map a structured error to a user-readable, actionable message in Portuguese */
export function friendlyGoogleAdsError(detail: GoogleAdsErrorDetail, customerId: string): string {
  const msg = detail.rawMessage.toLowerCase()

  if (msg.includes('not found') || detail.httpStatus === 404) {
    return (
      `Customer ID ${customerId} não encontrado ou sem acesso. ` +
      `Verifique: (1) o ID está correto e sem zeros perdidos; ` +
      `(2) a conta OAuth tem permissão sobre esse Customer ID; ` +
      `(3) se for conta gerenciada (MCC), configure GOOGLE_ADS_LOGIN_CUSTOMER_ID no servidor.`
    )
  }
  if (msg.includes('permission denied') || msg.includes('authorization') || detail.httpStatus === 403) {
    return (
      `Sem permissão para acessar a conta ${customerId}. ` +
      `Verifique se o Developer Token tem acesso de produção e se a conta OAuth está vinculada corretamente.`
    )
  }
  if (msg.includes('developer token') || msg.includes('developertoken')) {
    return (
      `Developer Token inválido ou com acesso apenas a contas de teste. ` +
      `Solicite acesso Basic/Standard em ads.google.com → Ferramentas → Central do Desenvolvedor.`
    )
  }
  if (msg.includes('unauthenticated') || detail.httpStatus === 401) {
    return `Token de acesso expirado ou inválido. Reconecte sua conta Google Ads nas Conexões.`
  }
  if (msg.includes('quota exceeded') || msg.includes('rate limit') || detail.httpStatus === 429) {
    return `Limite de requisições atingido. Aguarde alguns minutos e tente novamente.`
  }
  if (msg.includes('login_customer_id') || msg.includes('login-customer-id')) {
    return (
      `Esta conta exige acesso via conta gerenciadora (MCC). ` +
      `Configure a variável de ambiente GOOGLE_ADS_LOGIN_CUSTOMER_ID com o ID da sua conta MCC.`
    )
  }
  if (msg.includes('invalid customer id') || msg.includes('customer_id')) {
    return `Customer ID ${customerId} inválido. O formato correto é 10 dígitos numéricos (ex: 1234567890).`
  }

  return detail.rawMessage
}

/** Returns true only for errors that are specific to an API version (safe to retry with an older version) */
function isVersionError(msg: string): boolean {
  return /\bversion\b.*\bnot supported\b|\bdeprecated\b|\bsunset\b|\bapi version\b/i.test(msg)
}

/**
 * Execute a GAQL query against the Google Ads REST API.
 * - Retries across API_VERSIONS only for version-incompatibility errors.
 * - Never swallows "not found" or permission errors — throws immediately with a friendly message.
 * - login-customer-id is set from loginCustomerIdOverride → GOOGLE_ADS_LOGIN_CUSTOMER_ID env → omitted.
 *   It is only sent when the login CID differs from the target customer ID (MCC access pattern).
 */
export async function gaqlSearch(
  customerId: string,
  accessToken: string,
  developerToken: string,
  query: string,
  loginCustomerIdOverride?: string,
): Promise<any[]> {
  const loginCid =
    loginCustomerIdOverride ??
    process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID ??
    null

  let lastError = 'Google Ads API indisponível'
  let lastDetail: GoogleAdsErrorDetail | null = null

  for (const version of API_VERSIONS) {
    const headers: Record<string, string> = {
      Authorization:   `Bearer ${accessToken}`,
      'developer-token': developerToken,
      'Content-Type':  'application/json',
    }
    if (loginCid && loginCid !== customerId) {
      headers['login-customer-id'] = loginCid
    }

    let res: Response
    try {
      res = await fetch(
        `https://googleads.googleapis.com/${version}/customers/${customerId}/googleAds:search`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ query: query.trim() }),
          signal: AbortSignal.timeout(20_000),
        }
      )
    } catch (err: any) {
      lastError = err?.message || 'Timeout ou erro de rede'
      continue
    }

    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('application/json')) {
      // Non-JSON (HTML 404 page) means the API version endpoint is gone — try next version
      lastError = `HTTP ${res.status}`
      continue
    }

    const data = await res.json()

    if (!res.ok || data.error) {
      const detail = parseGoogleAdsError(data, res.status)
      lastDetail = detail
      lastError = detail.rawMessage

      if (isVersionError(detail.rawMessage)) {
        // Version-specific error: safe to retry with older version
        continue
      }

      // Any other error (auth, permissions, not found, etc.): throw immediately
      throw new Error(friendlyGoogleAdsError(detail, customerId))
    }

    return data.results || []
  }

  // All versions exhausted
  if (lastDetail) {
    throw new Error(friendlyGoogleAdsError(lastDetail, customerId))
  }
  throw new Error(
    `Google Ads API indisponível após testar ${API_VERSIONS.join(', ')} (${lastError}). ` +
    `Verifique se o Customer ID ${customerId} está correto e se o Developer Token tem acesso de produção.`
  )
}
