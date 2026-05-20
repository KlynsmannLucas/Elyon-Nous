// app/api/ads-data/google-pmax-alert/route.ts
// Detecta campanhas Performance Max com possível desperdício de verba.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getValidGoogleToken, tokenErrorToResponse } from '@/services/google/token-manager'
import { gaqlSearch, normalizeCustomerId } from '@/lib/google-ads'

type AlertLevel = 'critical' | 'warning' | 'ok'

interface PMaxAlert {
  campaignId:   string
  campaignName: string
  spend:        number
  conversions:  number
  revenue:      number
  cpa:          number
  roas:         number
  budgetShare:  number          // % do orçamento total
  convShare:    number          // % das conversões totais
  spendShare:   number          // % do gasto total
  level:        AlertLevel
  issues:       string[]
  recommendations: string[]
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })

  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  if (!devToken) return NextResponse.json({ success: false, error: 'Developer token não configurado' }, { status: 500 })

  const body = await req.json().catch(() => ({}))
  const bodyAccountId = body.accountId as string | undefined

  let accessToken: string
  let accountId:   string | null
  try {
    const token = await getValidGoogleToken(userId)
    accessToken = token.accessToken
    accountId   = bodyAccountId || token.accountId
  } catch (err) {
    const { error, code } = tokenErrorToResponse(err)
    return NextResponse.json({ success: false, error, code }, { status: 401 })
  }

  if (!accountId) {
    return NextResponse.json({ success: false, error: 'Customer ID não encontrado', code: 'NO_ACCOUNT_ID' }, { status: 400 })
  }

  const cleanId = normalizeCustomerId(accountId)

  try {
    // Busca todas as campanhas ativas para comparação
    const allCampaigns = await gaqlSearch(cleanId, accessToken, devToken, `
      SELECT
        campaign.id,
        campaign.name,
        campaign.advertising_channel_type,
        campaign.status,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
        AND campaign.status = 'ENABLED'
      ORDER BY metrics.cost_micros DESC
      LIMIT 100
    `)

    const totalSpend       = allCampaigns.reduce((s, r) => s + (r.metrics.costMicros || 0) / 1_000_000, 0)
    const totalConversions = allCampaigns.reduce((s, r) => s + parseFloat(r.metrics.conversions || '0'), 0)
    const totalRevenue     = allCampaigns.reduce((s, r) => s + (r.metrics.conversionsValue || 0), 0)
    const accountAvgCPA    = totalConversions > 0 ? totalSpend / totalConversions : 0
    const accountAvgROAS   = totalSpend > 0 && totalRevenue > 0 ? totalRevenue / totalSpend : 0

    const pmaxCampaigns = allCampaigns.filter((r: any) =>
      r.campaign.advertisingChannelType === 'PERFORMANCE_MAX'
    )

    const alerts: PMaxAlert[] = pmaxCampaigns.map((r: any) => {
      const camp        = r.campaign
      const m           = r.metrics
      const spend       = (m.costMicros || 0) / 1_000_000
      const conversions = parseFloat(m.conversions || '0')
      const revenue     = m.conversionsValue || 0
      const cpa         = conversions > 0 ? +(spend / conversions).toFixed(2) : 0
      const roas        = spend > 0 && revenue > 0 ? +(revenue / spend).toFixed(2) : 0

      const spendShare = totalSpend > 0 ? +(spend / totalSpend * 100).toFixed(1) : 0
      const convShare  = totalConversions > 0 ? +(conversions / totalConversions * 100).toFixed(1) : 0

      const issues: string[] = []
      const recommendations: string[] = []

      // Critério 1: PMax > 40% do gasto com conversões proporcionalmente baixas
      if (spendShare > 40 && convShare < spendShare * 0.6) {
        issues.push(`Consome ${spendShare}% do orçamento mas gera apenas ${convShare}% das conversões`)
        recommendations.push('Reduza o orçamento do PMax em 20-30% e redistribua para campanhas Search com conversões comprovadas')
      }

      // Critério 2: CPA acima da média da conta
      if (accountAvgCPA > 0 && cpa > accountAvgCPA * 1.5 && conversions > 0) {
        issues.push(`CPA R$${cpa} — 50% acima da média da conta (R$${accountAvgCPA.toFixed(0)})`)
        recommendations.push('Adicione mais sinais de audiência (listas de clientes, remarketing) para o Google otimizar melhor')
      }

      // Critério 3: Gasto alto sem conversões
      if (spend > 500 && conversions === 0) {
        issues.push(`R$${spend.toFixed(0)} gastos sem nenhuma conversão registrada`)
        recommendations.push('Verifique se as conversões estão configuradas corretamente (tag, evento, janela de conversão)')
        recommendations.push('Adicione assets de alta qualidade: imagens, vídeos e textos. PMax precisa de variação criativa.')
      }

      // Critério 4: ROAS abaixo da média quando há dados
      if (accountAvgROAS > 0 && roas > 0 && roas < accountAvgROAS * 0.7) {
        issues.push(`ROAS ${roas}× — 30% abaixo da média da conta (${accountAvgROAS.toFixed(1)}×)`)
        recommendations.push('Defina um ROAS alvo explícito na campanha e verifique se os valores de conversão estão corretos')
      }

      // Critério 5: Crescendo em custo sem conversões crescendo (detecção simples)
      if (spendShare > 25 && conversions < 10) {
        issues.push(`Alto orçamento (${spendShare}% do total) com volume de conversões baixo (<10)`)
        recommendations.push('PMax precisa de ao menos 30 conversões/mês para o machine learning funcionar. Considere pausar e redirecionar o budget.')
      }

      const level: AlertLevel = issues.length >= 2 ? 'critical'
        : issues.length === 1 ? 'warning'
        : 'ok'

      return {
        campaignId:   camp.id,
        campaignName: camp.name,
        spend: +spend.toFixed(2),
        conversions: +conversions.toFixed(1),
        revenue: +revenue.toFixed(2),
        cpa, roas, spendShare, convShare,
        budgetShare: spendShare,
        level,
        issues,
        recommendations,
      }
    })

    // Alerta global se PMax domina o account
    const totalPMaxSpend = pmaxCampaigns.reduce((s, r) => s + (r.metrics.costMicros || 0) / 1_000_000, 0)
    const totalPMaxShare = totalSpend > 0 ? +(totalPMaxSpend / totalSpend * 100).toFixed(1) : 0

    const globalAlert = totalPMaxShare > 60 ? {
      level: 'warning' as AlertLevel,
      message: `Performance Max representa ${totalPMaxShare}% do orçamento total. Diversifique com campanhas Search para palavras-chave de alta intenção.`,
    } : null

    return NextResponse.json({
      success: true,
      alerts,
      globalAlert,
      accountStats: {
        totalSpend:       +totalSpend.toFixed(2),
        totalConversions: +totalConversions.toFixed(1),
        totalRevenue:     +totalRevenue.toFixed(2),
        avgCPA:           +accountAvgCPA.toFixed(2),
        avgROAS:          +accountAvgROAS.toFixed(2),
        pmaxSpendShare:   totalPMaxShare,
        pmaxCampaigns:    pmaxCampaigns.length,
        totalCampaigns:   allCampaigns.length,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
