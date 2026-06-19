// app/api/meta/campaign/action/route.ts
// Executa ações reais numa campanha do Meta (pausar / reativar / escalar budget),
// a partir de um insight. Fecha o loop: recomendação -> ação executada.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getValidMetaToken, metaTokenErrorToResponse } from '@/services/meta/token-manager'

export const maxDuration = 30
const META_BASE = 'https://graph.facebook.com/v21.0'

type ActionType = 'pause' | 'resume' | 'scale'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const action = body.action as ActionType
  const id = String(body.id || '').trim()           // campaign id
  const factor = Number(body.factor) || 1.2          // escala: +20% por padrão
  if (!['pause', 'resume', 'scale'].includes(action)) {
    return NextResponse.json({ success: false, error: 'Ação inválida.' }, { status: 400 })
  }
  if (!id) return NextResponse.json({ success: false, error: 'ID da campanha ausente.' }, { status: 400 })

  let accessToken: string
  try {
    const t = await getValidMetaToken(userId)
    accessToken = t.accessToken
  } catch (err) {
    const { error, code } = metaTokenErrorToResponse(err)
    return NextResponse.json({ success: false, error, code }, { status: 401 })
  }

  const post = async (path: string, params: Record<string, string>) => {
    const res = await fetch(`${META_BASE}/${path}`, {
      method: 'POST',
      body: new URLSearchParams({ ...params, access_token: accessToken }),
      signal: AbortSignal.timeout(15000),
    })
    const j = await res.json().catch(() => ({}))
    return { ok: res.ok && !j?.error, error: j?.error?.message as string | undefined, data: j }
  }

  try {
    if (action === 'pause' || action === 'resume') {
      const status = action === 'pause' ? 'PAUSED' : 'ACTIVE'
      const r = await post(id, { status })
      if (!r.ok) return NextResponse.json({ success: false, error: r.error || 'Falha ao atualizar a campanha no Meta.' }, { status: 502 })
      return NextResponse.json({ success: true, message: action === 'pause' ? 'Campanha pausada no Meta Ads.' : 'Campanha reativada no Meta Ads.' })
    }

    // scale: lê o budget atual da campanha (CBO) e aumenta pelo fator.
    const cur = await fetch(`${META_BASE}/${id}?fields=daily_budget,lifetime_budget,name&access_token=${encodeURIComponent(accessToken)}`, { signal: AbortSignal.timeout(15000) })
    const cj = await cur.json().catch(() => ({}))
    if (cj?.error) return NextResponse.json({ success: false, error: cj.error.message || 'Não foi possível ler o orçamento.' }, { status: 502 })

    const daily = Number(cj?.daily_budget || 0) // em centavos
    if (!daily) {
      // Sem budget no nível da campanha → está no conjunto (ABO). Não mexemos às cegas.
      return NextResponse.json({ success: false, error: 'O orçamento desta campanha está no nível do conjunto (ABO). Ajuste o budget do ad set vencedor manualmente — escalar a campanha inteira poderia inflar conjuntos ruins.' }, { status: 409 })
    }
    const next = Math.round(daily * factor)
    const r = await post(id, { daily_budget: String(next) })
    if (!r.ok) return NextResponse.json({ success: false, error: r.error || 'Falha ao escalar o orçamento.' }, { status: 502 })
    const fmt = (cents: number) => 'R$' + Math.round(cents / 100).toLocaleString('pt-BR')
    return NextResponse.json({ success: true, message: `Orçamento elevado de ${fmt(daily)} para ${fmt(next)}/dia.` })
  } catch (e: any) {
    console.error('[meta/campaign/action]', e?.message)
    return NextResponse.json({ success: false, error: 'Erro ao executar a ação no Meta.' }, { status: 500 })
  }
}
