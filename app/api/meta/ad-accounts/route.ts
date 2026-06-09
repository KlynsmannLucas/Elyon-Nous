// app/api/meta/ad-accounts/route.ts
// Lista as contas de anúncio Meta associadas ao token do usuário.
// Nunca expõe accessToken na resposta.
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getValidMetaToken, metaTokenErrorToResponse } from '@/services/meta/token-manager'
import type { MetaAdAccount } from '@/types/meta'

const ACCOUNT_STATUS_LABELS: Record<number, string> = {
  1:   'ACTIVE',
  2:   'DISABLED',
  3:   'UNSETTLED',
  7:   'PENDING_RISK_REVIEW',
  9:   'IN_GRACE_PERIOD',
  100: 'PENDING_CLOSURE',
  101: 'CLOSED',
  201: 'ANY_ACTIVE',
  202: 'ANY_CLOSED',
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })

  let accessToken: string
  try {
    const tokenData = await getValidMetaToken(userId)
    accessToken = tokenData.accessToken
  } catch (err) {
    const { error, code } = metaTokenErrorToResponse(err)
    return NextResponse.json({ success: false, error, code }, { status: 401 })
  }

  const AD_FIELDS = 'id,name,currency,timezone_name,account_status,business,amount_spent,balance'

  const mapAccount = (a: Record<string, unknown>): MetaAdAccount => ({
    id:            (a.id as string).replace('act_', ''),
    name:          a.name as string,
    currency:      (a.currency as string) || 'BRL',
    timezone:      (a.timezone_name as string) || 'America/Sao_Paulo',
    accountStatus: ACCOUNT_STATUS_LABELS[a.account_status as number] || String(a.account_status),
    businessId:    a.business ? ((a.business as Record<string, unknown>).id as string) : null,
    amountSpent:   parseFloat((a.amount_spent as string) || '0') / 100,
    balance:       parseFloat((a.balance as string) || '0') / 100,
  })

  // Busca um edge do Graph que retorna { data: [...] }. Falha → [] (não quebra).
  const fetchAccountsEdge = async (url: string): Promise<Record<string, unknown>[]> => {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(15_000) })
      const j = await r.json()
      if (j.error || !Array.isArray(j.data)) return []
      return j.data as Record<string, unknown>[]
    } catch {
      return []
    }
  }

  try {
    const base = 'https://graph.facebook.com/v21.0'

    // 1) Contas diretamente atribuídas ao usuário
    const meRes = await fetch(
      `${base}/me/adaccounts?fields=${AD_FIELDS}&limit=100&access_token=${accessToken}`,
      { signal: AbortSignal.timeout(15_000) }
    )
    const meData = await meRes.json()
    if (meData.error) {
      return NextResponse.json({ success: false, error: meData.error.message }, { status: 400 })
    }
    const raw: Record<string, unknown>[] = Array.isArray(meData.data) ? [...meData.data] : []

    // 2) Contas de Business Manager (owned + client) — requer business_management.
    //    Se o escopo não foi concedido, o edge retorna [] e seguimos só com (1).
    const businesses = await fetchAccountsEdge(
      `${base}/me/businesses?fields=id,name&limit=50&access_token=${accessToken}`
    )
    if (businesses.length > 0) {
      const bizEdges = await Promise.all(
        businesses.slice(0, 30).flatMap((b) => {
          const bizId = b.id as string
          return [
            fetchAccountsEdge(`${base}/${bizId}/owned_ad_accounts?fields=${AD_FIELDS}&limit=100&access_token=${accessToken}`),
            fetchAccountsEdge(`${base}/${bizId}/client_ad_accounts?fields=${AD_FIELDS}&limit=100&access_token=${accessToken}`),
          ]
        })
      )
      for (const edge of bizEdges) raw.push(...edge)
    }

    // 3) Mapeia + deduplica por id
    const seen = new Set<string>()
    const accounts: MetaAdAccount[] = []
    for (const a of raw) {
      const acc = mapAccount(a)
      if (acc.id && !seen.has(acc.id)) {
        seen.add(acc.id)
        accounts.push(acc)
      }
    }

    return NextResponse.json({ success: true, accounts })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
