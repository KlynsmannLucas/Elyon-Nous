// app/api/meta/tracking-audit/route.ts
// Auditoria de rastreamento Meta: pixel, CAPI, verificação de domínio e qualidade de eventos.
// Atualmente verifica apenas pixels. CAPI, domain e EMQ requerem endpoints adicionais.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getValidMetaToken, metaTokenErrorToResponse } from '@/services/meta/token-manager'

type CheckStatus = 'ok' | 'warning' | 'error' | 'not_checked'

interface TrackingCheckItem {
  id:          string
  name:        string
  description: string
  status:      CheckStatus
  detail:      string | null
  actionRequired: string | null
}

interface TrackingAuditResult {
  overallStatus: CheckStatus
  checks:        TrackingCheckItem[]
  summary:       string
}

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
      { success: false, error: 'Ad Account ID não encontrado', code: 'NO_ACCOUNT_ID' },
      { status: 400 }
    )
  }

  const checks: TrackingCheckItem[] = []

  // ── 1. Verificação de Pixel ───────────────────────────────────────────────
  try {
    const pixelRes = await fetch(
      `https://graph.facebook.com/v21.0/act_${accountId}/adspixels?` +
      `fields=id,name,last_fired_time,is_unavailable&limit=10` +
      `&access_token=${accessToken}`,
      { signal: AbortSignal.timeout(15_000) }
    )
    const pixelData = await pixelRes.json()
    const pixels    = (pixelData.data || []) as Array<Record<string, unknown>>

    if (pixels.length === 0) {
      checks.push({
        id:             'pixel',
        name:           'Meta Pixel',
        description:    'Pixel de rastreamento instalado e ativo na conta',
        status:         'error',
        detail:         'Nenhum pixel encontrado na conta de anúncio',
        actionRequired: 'Crie um pixel em Gerenciador de Eventos e instale-o no seu site',
      })
    } else {
      const activePixel = pixels.find(px => {
        const lastFired = px.last_fired_time as string | undefined
        return lastFired && Date.now() - new Date(lastFired).getTime() < FORTY_EIGHT_HOURS_MS
      })

      if (activePixel) {
        const lastFired  = activePixel.last_fired_time as string
        checks.push({
          id:             'pixel',
          name:           'Meta Pixel',
          description:    'Pixel de rastreamento instalado e ativo na conta',
          status:         'ok',
          detail:         `Pixel "${activePixel.name as string}" ativo — último disparo: ${new Date(lastFired).toLocaleString('pt-BR')}`,
          actionRequired: null,
        })
      } else {
        const px         = pixels[0]
        const lastFired  = px.last_fired_time as string | null | undefined
        checks.push({
          id:             'pixel',
          name:           'Meta Pixel',
          description:    'Pixel de rastreamento instalado e ativo na conta',
          status:         'warning',
          detail:         lastFired
            ? `Pixel "${px.name as string}" sem disparos recentes — último: ${new Date(lastFired).toLocaleString('pt-BR')}`
            : `Pixel "${px.name as string}" nunca disparou`,
          actionRequired: 'Verifique a instalação do pixel no seu site e teste com o Meta Pixel Helper',
        })
      }
    }
  } catch {
    checks.push({
      id:             'pixel',
      name:           'Meta Pixel',
      description:    'Pixel de rastreamento instalado e ativo na conta',
      status:         'error',
      detail:         'Falha ao verificar pixels — erro na chamada à API',
      actionRequired: 'Verifique as permissões da conta e tente novamente',
    })
  }

  // ── 2. CAPI (Conversions API) — não verificável sem permissão especial ────
  checks.push({
    id:             'capi',
    name:           'Conversions API (CAPI)',
    description:    'Rastreamento server-side complementando o pixel browser',
    status:         'not_checked',
    detail:         'Verificação de CAPI requer acesso ao dataset de eventos server-side',
    actionRequired: 'Configure o CAPI via parceiro (Shopify, GTM Server-Side) ou pela API direta',
  })

  // ── 3. Verificação de Domínio ─────────────────────────────────────────────
  checks.push({
    id:             'domain',
    name:           'Verificação de Domínio',
    description:    'Domínio verificado no Business Manager para evitar limitações de iOS 14+',
    status:         'not_checked',
    detail:         'Verificação de domínio requer acesso ao Business Manager via API',
    actionRequired: 'Acesse Configurações de Negócios → Segurança da Marca → Domínios para verificar',
  })

  // ── 4. Event Match Quality (EMQ) ──────────────────────────────────────────
  checks.push({
    id:             'emq',
    name:           'Qualidade de Correspondência de Eventos (EMQ)',
    description:    'Score de qualidade dos parâmetros de clientes enviados com eventos',
    status:         'not_checked',
    detail:         'EMQ requer acesso ao endpoint /signal_source_registrations (acesso especial)',
    actionRequired: 'Melhore EMQ enviando: email, phone, fbc, fbp, client_ip_address, client_user_agent',
  })

  // Determina status geral
  const hasError   = checks.some(c => c.status === 'error')
  const hasWarning = checks.some(c => c.status === 'warning')
  const allOk      = checks.every(c => c.status === 'ok' || c.status === 'not_checked')

  const overallStatus: CheckStatus = hasError ? 'error' : hasWarning ? 'warning' : allOk ? 'ok' : 'warning'

  const okCount       = checks.filter(c => c.status === 'ok').length
  const errorCount    = checks.filter(c => c.status === 'error').length
  const warningCount  = checks.filter(c => c.status === 'warning').length

  const result: TrackingAuditResult = {
    overallStatus,
    checks,
    summary: `${okCount} verificação(ões) OK, ${warningCount} aviso(s), ${errorCount} erro(s)`,
  }

  return NextResponse.json({ success: true, ...result })
}
