// app/api/meta/audit/route.ts
// Auditoria automática da conta Meta Ads.
// Analisa campanhas dos últimos 30 dias e retorna lista de MetaAuditIssue.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getValidMetaToken, metaTokenErrorToResponse } from '@/services/meta/token-manager'
import type { MetaAuditIssue } from '@/types/meta'

const LEAD_TYPES     = ['lead', 'onsite_conversion.lead_grouped']
const PURCHASE_TYPES = ['purchase', 'omni_purchase']
const MSG_TYPES      = [
  'onsite_conversion.messaging_conversation_started_7d',
  'messaging_first_reply',
  'onsite_conversion.messaging_first_reply',
]

function extractActions(actions: Array<{ action_type: string; value: string }> | undefined, types: string[]): number {
  return (actions || [])
    .filter(a => types.includes(a.action_type))
    .reduce((s, a) => s + parseInt(a.value || '0'), 0)
}

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const bodyAccountId = body.accountId as string | undefined

  let accessToken: string
  let accountId: string | null
  try {
    const tokenData = await getValidMetaToken(userId)
    accessToken = tokenData.accessToken
    accountId   = bodyAccountId || tokenData.accountId
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

  try {
    const act     = `act_${accountId}`
    const baseUrl = 'https://graph.facebook.com/v19.0'
    const token   = encodeURIComponent(accessToken)

    const today       = new Date()
    const thirtyAgo   = new Date(today.getTime() - 30 * 86400000)
    const sixtyAgo    = new Date(today.getTime() - 60 * 86400000)
    const sevenAgo    = new Date(today.getTime() - 7 * 86400000)

    const prevRange = encodeURIComponent(JSON.stringify({ since: dateStr(sixtyAgo), until: dateStr(thirtyAgo) }))
    const sevenRange = encodeURIComponent(JSON.stringify({ since: dateStr(sevenAgo), until: dateStr(today) }))

    const insightFields = 'campaign_id,campaign_name,spend,impressions,clicks,frequency,actions,cpm,ctr'

    const [campaigns30Res, campaigns7Res, campaignsPrevRes, campaignsMetaRes] = await Promise.allSettled([
      fetch(`${baseUrl}/${act}/insights?fields=${insightFields}&date_preset=last_30d&level=campaign&limit=100&access_token=${token}`, { signal: AbortSignal.timeout(20000) }).then(r => r.json()),
      fetch(`${baseUrl}/${act}/insights?fields=campaign_id,spend,actions,cpm&time_range=${sevenRange}&level=campaign&limit=100&access_token=${token}`, { signal: AbortSignal.timeout(20000) }).then(r => r.json()),
      fetch(`${baseUrl}/${act}/insights?fields=campaign_id,spend,actions,cpm&time_range=${prevRange}&level=campaign&limit=100&access_token=${token}`, { signal: AbortSignal.timeout(20000) }).then(r => r.json()),
      fetch(`${baseUrl}/${act}/campaigns?fields=id,name,effective_status,created_time&limit=100&access_token=${token}`, { signal: AbortSignal.timeout(20000) }).then(r => r.json()),
    ])

    const data30   = campaigns30Res.status   === 'fulfilled' ? campaigns30Res.value   : { data: [] }
    const data7    = campaigns7Res.status    === 'fulfilled' ? campaigns7Res.value    : { data: [] }
    const dataPrev = campaignsPrevRes.status === 'fulfilled' ? campaignsPrevRes.value : { data: [] }
    const dataMeta = campaignsMetaRes.status === 'fulfilled' ? campaignsMetaRes.value : { data: [] }

    if (data30.error) {
      return NextResponse.json({ success: false, error: data30.error.message }, { status: 400 })
    }

    // Mapas auxiliares
    const map7: Record<string, Record<string, unknown>>    = {}
    for (const r of (data7.data || []))    map7[(r as Record<string, unknown>).campaign_id as string]    = r as Record<string, unknown>

    const mapPrev: Record<string, Record<string, unknown>> = {}
    for (const r of (dataPrev.data || [])) mapPrev[(r as Record<string, unknown>).campaign_id as string] = r as Record<string, unknown>

    const metaMap: Record<string, Record<string, unknown>> = {}
    for (const c of (dataMeta.data || [])) metaMap[(c as Record<string, unknown>).id as string] = c as Record<string, unknown>

    const issues: MetaAuditIssue[] = []

    for (const row of (data30.data || [])) {
      const r        = row as Record<string, unknown>
      const id       = r.campaign_id as string
      const name     = (r.campaign_name as string) || id
      const spend30  = parseFloat((r.spend as string) || '0')
      const freq30   = parseFloat((r.frequency as string) || '0')
      const ctr30    = parseFloat((r.ctr as string) || '0')
      const cpm30    = parseFloat((r.cpm as string) || '0')
      const actions  = r.actions as Array<{ action_type: string; value: string }> | undefined

      const leads30    = extractActions(actions, LEAD_TYPES) + extractActions(actions, MSG_TYPES)
      const purchases30 = extractActions(actions, PURCHASE_TYPES)
      const conversions30 = leads30 + purchases30

      // ── Regra 1: Gasto sem conversão (spend > 200 e conversões == 0) ─────────
      if (spend30 > 200 && conversions30 === 0) {
        issues.push({
          type:           'SPEND_NO_CONVERSION',
          entity:         'campaign',
          entityId:       id,
          entityName:     name,
          metric:         'conversions',
          severity:       'critical',
          evidence:       `R$${spend30.toFixed(2)} gastos nos últimos 30 dias sem nenhuma conversão registrada`,
          impact:         'Verba sendo desperdiçada sem geração de resultado mensurável',
          recommendation: 'Verifique o pixel de conversão, o evento otimizado e a configuração do público-alvo',
        })
      }

      // ── Regra 2: Fadiga de Audiência (frequency > 5) ──────────────────────────
      if (freq30 > 5) {
        issues.push({
          type:           'AUDIENCE_FATIGUE',
          entity:         'campaign',
          entityId:       id,
          entityName:     name,
          metric:         'frequency',
          severity:       'high',
          evidence:       `Frequência de ${freq30.toFixed(1)}× nos últimos 30 dias (limite recomendado: 5×)`,
          impact:         'Alta frequência eleva CPL, reduz CTR e deteriora a experiência do usuário',
          recommendation: 'Renove os criativos ou expanda a audiência-alvo para reduzir a saturação',
        })
      }

      // ── Regra 3: CTR Abaixo da Média (ctr < 0.5%) ─────────────────────────────
      if (ctr30 > 0 && ctr30 < 0.5 && spend30 > 100) {
        issues.push({
          type:           'LOW_CTR',
          entity:         'campaign',
          entityId:       id,
          entityName:     name,
          metric:         'ctr',
          severity:       'medium',
          evidence:       `CTR de ${ctr30.toFixed(2)}% nos últimos 30 dias (média saudável: >1%)`,
          impact:         'CTR baixo indica criativo ou segmentação irrelevante para o público exibido',
          recommendation: 'Teste novos criativos com proposta de valor mais clara e copy mais chamativa',
        })
      }

      // ── Regra 4: CPM em Alta (7d CPM > 30d CPM * 1.3) ──────────────────────────
      const row7     = map7[id]
      const cpm7     = row7 ? parseFloat((row7.cpm as string) || '0') : 0
      if (cpm7 > 0 && cpm30 > 0 && cpm7 > cpm30 * 1.3) {
        issues.push({
          type:           'RISING_CPM',
          entity:         'campaign',
          entityId:       id,
          entityName:     name,
          metric:         'cpm',
          severity:       'medium',
          evidence:       `CPM últimos 7 dias (R$${cpm7.toFixed(2)}) é ${((cpm7 / cpm30 - 1) * 100).toFixed(0)}% maior que os 30 dias (R$${cpm30.toFixed(2)})`,
          impact:         'CPM crescente reduz o alcance e encarece aquisições',
          recommendation: 'Verifique lances, concorrência no leilão e considere ampliar o público',
        })
      }

      // ── Regra 5: CPL em Alta (comparar 30d vs 30d anterior) ──────────────────
      const rowPrev    = mapPrev[id]
      if (rowPrev && leads30 > 0) {
        const spendPrev  = parseFloat((rowPrev.spend as string) || '0')
        const leadsPrev  = extractActions(rowPrev.actions as Array<{ action_type: string; value: string }> | undefined, LEAD_TYPES) +
                           extractActions(rowPrev.actions as Array<{ action_type: string; value: string }> | undefined, MSG_TYPES)
        const cpl30   = leads30    > 0 ? spend30 / leads30     : 0
        const cplPrev = leadsPrev  > 0 ? spendPrev / leadsPrev : 0
        if (cplPrev > 0 && cpl30 > cplPrev * 1.3) {
          issues.push({
            type:           'RISING_CPL',
            entity:         'campaign',
            entityId:       id,
            entityName:     name,
            metric:         'cpl',
            severity:       'high',
            evidence:       `CPL atual R$${cpl30.toFixed(2)} vs R$${cplPrev.toFixed(2)} no período anterior (+${((cpl30 / cplPrev - 1) * 100).toFixed(0)}%)`,
            impact:         'Custo por lead crescente pode inviabilizar a rentabilidade da campanha',
            recommendation: 'Revise criativos, landing page e qualidade da audiência — considere remarketing',
          })
        }
      }

      // ── Regra 6: Campanha ACTIVE sem dados recentes (últimos 7 dias) ──────────
      const meta       = metaMap[id]
      const isActive   = meta ? (meta.effective_status as string) === 'ACTIVE' : false
      const hasData7d  = row7 && parseFloat((row7.spend as string) || '0') > 0
      if (isActive && !hasData7d && spend30 > 0) {
        issues.push({
          type:           'INACTIVE_ACTIVE_CAMPAIGN',
          entity:         'campaign',
          entityId:       id,
          entityName:     name,
          metric:         'spend',
          severity:       'medium',
          evidence:       'Campanha com status ACTIVE mas sem gastos ou dados nos últimos 7 dias',
          impact:         'Campanha possivelmente parada por falta de orçamento, política ou aprovação de anúncio',
          recommendation: 'Verifique o orçamento disponível, status dos anúncios e possíveis reprovações',
        })
      }
    }

    // Ordena por severidade
    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
    issues.sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9))

    return NextResponse.json({
      success: true,
      count:   issues.length,
      issues,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
