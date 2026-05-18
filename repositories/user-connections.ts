// repositories/user-connections.ts
// Fonte confiável de tokens OAuth — leitura/escrita no Supabase com criptografia.
// Nunca expõe tokens raw para o frontend.
import { supabaseAdmin } from '@/lib/supabase'
import { encryptToken, decryptToken, isEncrypted } from '@/services/security/encryption'

export interface UserConnection {
  userId:      string
  platform:    'google' | 'meta'
  accessToken: string
  refreshToken: string | null
  accountId:   string | null
  accountName: string | null
  connectedAt: string
  expiresAt:   string | null
}

export type PublicConnection = Omit<UserConnection, 'accessToken' | 'refreshToken'>

function safeDecrypt(value: string | null): string {
  if (!value) return ''
  try { return isEncrypted(value) ? decryptToken(value) : value }
  catch { return value }
}

export async function saveConnection(conn: UserConnection): Promise<void> {
  if (!supabaseAdmin) return
  const { error } = await supabaseAdmin
    .from('ads_connections')
    .upsert({
      user_id:      conn.userId,
      platform:     conn.platform,
      access_token: encryptToken(conn.accessToken),
      refresh_token: conn.refreshToken ? encryptToken(conn.refreshToken) : null,
      account_id:   conn.accountId   || null,
      account_name: conn.accountName || null,
      connected_at: conn.connectedAt,
      expires_at:   conn.expiresAt   || null,
    }, { onConflict: 'user_id,platform' })

  if (error) throw new Error(`[connections] save failed: ${error.message}`)
}

export async function getConnection(userId: string, platform: string): Promise<UserConnection | null> {
  if (!supabaseAdmin) return null
  const { data, error } = await supabaseAdmin
    .from('ads_connections')
    .select('*')
    .eq('user_id',  userId)
    .eq('platform', platform)
    .maybeSingle()

  if (error || !data) return null

  return {
    userId:      data.user_id,
    platform:    data.platform,
    accessToken: safeDecrypt(data.access_token),
    refreshToken: data.refresh_token ? safeDecrypt(data.refresh_token) : null,
    accountId:   data.account_id   || null,
    accountName: data.account_name || null,
    connectedAt: data.connected_at,
    expiresAt:   data.expires_at   || null,
  }
}

export async function updateAccessToken(
  userId: string, platform: string,
  accessToken: string, expiresAt: string
): Promise<void> {
  if (!supabaseAdmin) return
  const { error } = await supabaseAdmin
    .from('ads_connections')
    .update({ access_token: encryptToken(accessToken), expires_at: expiresAt })
    .eq('user_id',  userId)
    .eq('platform', platform)
  if (error) throw new Error(`[connections] update token failed: ${error.message}`)
}

export async function deleteConnection(userId: string, platform: string): Promise<void> {
  if (!supabaseAdmin) return
  await supabaseAdmin
    .from('ads_connections')
    .delete()
    .eq('user_id',  userId)
    .eq('platform', platform)
}

// Retorna metadados da conexão SEM tokens — seguro para o frontend
export async function listPublicConnections(userId: string): Promise<PublicConnection[]> {
  if (!supabaseAdmin) return []
  const { data, error } = await supabaseAdmin
    .from('ads_connections')
    .select('platform, account_id, account_name, connected_at, expires_at')
    .eq('user_id', userId)
  if (error || !data) return []
  return data.map((row: any) => ({
    userId,
    platform:    row.platform,
    accountId:   row.account_id   || null,
    accountName: row.account_name || null,
    connectedAt: row.connected_at,
    expiresAt:   row.expires_at   || null,
  }))
}
