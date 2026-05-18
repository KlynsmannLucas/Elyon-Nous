// services/google/token-manager.ts
// Fonte única de tokens Google válidos.
// Faz refresh automático quando o access_token expira.
// Nunca expõe tokens ao frontend.
import { getConnection, updateAccessToken } from '@/repositories/user-connections'

export class GoogleTokenError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'NO_CONNECTION'
      | 'EXPIRED_NO_REFRESH'
      | 'REFRESH_FAILED'
      | 'REVOKED'
      | 'SERVER_CONFIG'
  ) { super(message) }
}

export interface ValidToken {
  accessToken:  string
  accountId:    string | null
  accountName:  string | null
}

// Margem de 5 min para evitar usar token no limite de expiração
const EXPIRY_BUFFER_MS = 5 * 60 * 1000

export async function getValidGoogleToken(userId: string): Promise<ValidToken> {
  const conn = await getConnection(userId, 'google')

  if (!conn?.accessToken) {
    throw new GoogleTokenError(
      'Conexão com Google não encontrada. Reconecte sua conta Google Ads.',
      'NO_CONNECTION'
    )
  }

  // Verifica se o token ainda é válido (com buffer de 5 min)
  const isExpired = conn.expiresAt
    ? Date.now() >= new Date(conn.expiresAt).getTime() - EXPIRY_BUFFER_MS
    : false // sem expiresAt = token legado, tenta usar

  if (!isExpired) {
    return { accessToken: conn.accessToken, accountId: conn.accountId, accountName: conn.accountName }
  }

  // Token expirado — tenta renovar
  if (!conn.refreshToken) {
    throw new GoogleTokenError(
      'Token Google expirado. Reconecte sua conta para restaurar o acesso.',
      'EXPIRED_NO_REFRESH'
    )
  }

  return await refreshGoogleToken(userId, conn.refreshToken, conn.accountId, conn.accountName)
}

export async function refreshGoogleToken(
  userId: string,
  refreshToken: string,
  accountId: string | null,
  accountName: string | null
): Promise<ValidToken> {
  const clientId     = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new GoogleTokenError(
      'Configuração OAuth do Google ausente no servidor.',
      'SERVER_CONFIG'
    )
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
      client_id:     clientId,
      client_secret: clientSecret,
    }),
    signal: AbortSignal.timeout(10_000),
  })

  const data = await res.json()

  if (!res.ok || data.error) {
    if (data.error === 'invalid_grant') {
      throw new GoogleTokenError(
        'Autorização do Google foi revogada. Por favor, reconecte sua conta.',
        'REVOKED'
      )
    }
    throw new GoogleTokenError(
      `Falha ao renovar token Google: ${data.error_description || data.error || `HTTP ${res.status}`}`,
      'REFRESH_FAILED'
    )
  }

  const newAccessToken = data.access_token as string
  const newExpiresAt   = new Date(Date.now() + (data.expires_in as number) * 1000).toISOString()

  await updateAccessToken(userId, 'google', newAccessToken, newExpiresAt)

  console.info(`[token-manager] Token Google renovado para usuário ${userId.slice(0, 8)}…`)

  return { accessToken: newAccessToken, accountId, accountName }
}

// Converte erros do TokenManager em mensagens amigáveis para o frontend
export function tokenErrorToResponse(err: unknown): { error: string; code: string } {
  if (err instanceof GoogleTokenError) {
    return { error: err.message, code: err.code }
  }
  const msg = err instanceof Error ? err.message : 'Erro desconhecido'
  return { error: `Erro de autenticação Google: ${msg}`, code: 'UNKNOWN' }
}
