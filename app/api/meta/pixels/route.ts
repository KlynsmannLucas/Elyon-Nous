// app/api/meta/pixels/route.ts
// Lista os pixels Meta associados à conta de anúncio.
// Pixel ativo = último disparo há menos de 48h.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getValidMetaToken, metaTokenErrorToResponse } from '@/services/meta/token-manager'
import type { MetaPixel } from '@/types/meta'

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const queryAccountId = searchParams.get('accountId')

  let accessToken: string
  let accountId: string | null
  try {
    const tokenData = await getValidMetaToken(userId)
    accessToken = tokenData.accessToken
    accountId   = queryAccountId || tokenData.accountId
  } catch (err) {
    const { error, code } = metaTokenErrorToResponse(err)
    return NextResponse.json({ success: false, error, code }, { status: 401 })
  }

  if (!accountId) {
    return NextResponse.json(
      { success: false, error: 'Ad Account ID não encontrado. Selecione uma conta.', code: 'NO_ACCOUNT_ID' },
      { status: 400 }
    )
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/act_${accountId}/adspixels?` +
      `fields=id,name,last_fired_time,is_unavailable` +
      `&limit=25` +
      `&access_token=${accessToken}`,
      { signal: AbortSignal.timeout(15_000) }
    )

    const data = await res.json()
    if (data.error) {
      return NextResponse.json({ success: false, error: data.error.message }, { status: 400 })
    }

    const pixels: MetaPixel[] = (data.data || []).map((px: Record<string, unknown>) => {
      const lastFiredTime = (px.last_fired_time as string) || null
      const isActive = lastFiredTime
        ? Date.now() - new Date(lastFiredTime).getTime() < FORTY_EIGHT_HOURS_MS
        : false
      return {
        id:            px.id as string,
        name:          (px.name as string) || 'Pixel Meta',
        lastFiredTime,
        isActive,
        events: [], // requer chamada separada a /{pixel_id}/stats
      }
    })

    return NextResponse.json({ success: true, pixels })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
