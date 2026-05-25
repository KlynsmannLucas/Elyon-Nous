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

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/me/adaccounts?` +
      `fields=id,name,currency,timezone_name,account_status,business,amount_spent,balance` +
      `&limit=50` +
      `&access_token=${accessToken}`,
      { signal: AbortSignal.timeout(15_000) }
    )

    const data = await res.json()
    if (data.error) {
      return NextResponse.json({ success: false, error: data.error.message }, { status: 400 })
    }

    const accounts: MetaAdAccount[] = (data.data || []).map((a: Record<string, unknown>) => ({
      id:            (a.id as string).replace('act_', ''),
      name:          a.name as string,
      currency:      (a.currency as string) || 'BRL',
      timezone:      (a.timezone_name as string) || 'America/Sao_Paulo',
      accountStatus: ACCOUNT_STATUS_LABELS[a.account_status as number] || String(a.account_status),
      businessId:    a.business ? ((a.business as Record<string, unknown>).id as string) : null,
      amountSpent:   parseFloat((a.amount_spent as string) || '0') / 100,
      balance:       parseFloat((a.balance as string) || '0') / 100,
    }))

    return NextResponse.json({ success: true, accounts })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
