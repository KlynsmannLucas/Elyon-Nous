// services/meta/token-manager.ts
// Fonte única de tokens Meta válidos.
// Tokens Meta de longa duração duram ~60 dias — sem refresh_token.
// Se expirado, lança erro. Se expirando em breve, sinaliza com flag.
// Nunca expõe tokens ao frontend.
import { getConnection } from '@/repositories/user-connections'
import { MetaTokenError } from '@/types/meta'

export { MetaTokenError }

const EXPIRY_BUFFER_DAYS = 7
const EXPIRY_BUFFER_MS   = EXPIRY_BUFFER_DAYS * 24 * 60 * 60 * 1000

export interface ValidMetaToken {
  accessToken:  string
  accountId:    string | null
  expiringSoon: boolean
}

export async function getValidMetaToken(userId: string): Promise<ValidMetaToken> {
  const conn = await getConnection(userId, 'meta')

  if (!conn?.accessToken) {
    throw new MetaTokenError(
      'NO_CONNECTION',
      'Conexão com Meta Ads não encontrada. Reconecte sua conta Meta Ads.'
    )
  }

  // Se temos expires_at, verificamos se o token expirou ou está prestes a expirar
  if (conn.expiresAt) {
    const expiresAtMs  = new Date(conn.expiresAt).getTime()
    const nowMs        = Date.now()

    if (nowMs >= expiresAtMs) {
      throw new MetaTokenError(
        'EXPIRED',
        'Token Meta Ads expirado. Reconecte sua conta para restaurar o acesso.'
      )
    }

    if (nowMs >= expiresAtMs - EXPIRY_BUFFER_MS) {
      // Token expira em menos de 7 dias — avisa, mas ainda funciona
      return {
        accessToken:  conn.accessToken,
        accountId:    conn.accountId,
        expiringSoon: true,
      }
    }
  }

  return {
    accessToken:  conn.accessToken,
    accountId:    conn.accountId,
    expiringSoon: false,
  }
}

// Converte erros do token-manager em mensagens amigáveis para o frontend
export function metaTokenErrorToResponse(err: unknown): { error: string; code: string } {
  if (err instanceof MetaTokenError) {
    return { error: err.message, code: err.code }
  }
  const msg = err instanceof Error ? err.message : 'Erro desconhecido'
  return { error: `Erro de autenticação Meta: ${msg}`, code: 'UNKNOWN' }
}
