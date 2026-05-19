// app/api/alerts/route.ts — Motor de alertas proativos (AGENT.md: Alert Agent)
import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getBenchmark } from '@/lib/niche_benchmarks'

async function sendAlertEmail(
  toEmail: string,
  clientName: string,
  criticalAlerts: Alert[],
): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return

  const alertRows = criticalAlerts.slice(0, 5).map(a => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
        <div style="font-size:13px;font-weight:700;color:#FF4D4D;margin-bottom:3px;">🚨 ${a.title}</div>
        <div style="font-size:12px;color:#94A3B8;margin-bottom:4px;">${a.message}</div>
        ${a.action ? `<div style="font-size:11px;color:#F0B429;">→ ${a.action}</div>` : ''}
      </td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#080D1A;font-family:system-ui,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
      <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#7C3AED,#A78BFA);display:flex;align-items:center;justify-content:center;font-size:18px;">⚡</div>
      <div>
        <div style="font-size:15px;font-weight:700;color:#F1F5F9;">ELYON — Alerta Crítico</div>
        <div style="font-size:11px;color:#64748B;">${clientName}</div>
      </div>
    </div>
    <div style="background:#0F1629;border:1px solid rgba(255,77,77,0.25);border-radius:14px;padding:20px;margin-bottom:16px;">
      <div style="font-size:12px;font-weight:700;color:#FF4D4D;margin-bottom:14px;">
        ⚠️ ${criticalAlerts.length} alerta${criticalAlerts.length > 1 ? 's' : ''} crítico${criticalAlerts.length > 1 ? 's' : ''} detectado${criticalAlerts.length > 1 ? 's' : ''}
      </div>
      <table style="width:100%;border-collapse:collapse;">${alertRows}</table>
    </div>
    <div style="text-align:center;margin-top:20px;">
      <a href="https://elyon.app/dashboard" style="display:inline-block;padding:12px 28px;border-radius:10px;background:linear-gradient(135deg,#F0B429,#FFD166);color:#000;font-weight:700;font-size:14px;text-decoration:none;">
        Ver no painel →
      </a>
    </div>
    <div style="text-align:center;margin-top:16px;font-size:11px;color:#334155;">
      ELYON TrafficBrain · <a href="https://elyon.app" style="color:#64748B;">elyon.app</a>
    </div>
  </div>
</body></html>`

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from: 'ELYON <relatorios@elyon.app>',
      to: [toEmail],
      subject: `🚨 ${criticalAlerts.length} alerta${criticalAlerts.length > 1 ? 's' : ''} crítico${criticalAlerts.length > 1 ? 's' : ''} — ${clientName}`,
      html,
    }),
  }).catch(() => {/* silent — email failure não bloqueia resposta */})
}

export interface Alert {
  id: string
  type: 'critical' | 'warning' | 'info' | 'opportunity'
  category: 'cpl' | 'frequency' | 'ctr' | 'budget' | 'roas' | 'creative' | 'scale' | 'general'
  title: string
  message: string
  metric?: string
  benchmark?: string
  action?: string
  campaign?: string
  platform?: 'meta' | 'google'
  createdAt: string
}

function generateAlerts(
  campaigns: any[],
  audit: any,
  niche: string,
  clientData: any,
): Alert[] {
  const alerts: Alert[] = []
  const bench = getBenchmark(niche)
  const now = new Date().toISOString()

  const benchCPLMin = bench?.cpl_min ?? 30
  const benchCPLMax = bench?.cpl_max ?? 120
  const benchCPLMid = (benchCPLMin + benchCPLMax) / 2

  // ── Analisa campanhas individuais ──────────────────────────────────────────
  for (const camp of campaigns) {
    const name = camp.name || camp.campaignName || 'Campanha sem nome'
    const spend = Number(camp.spend || 0)
    const leads = Number(camp.leads || 0)
    const ctr = Number(camp.ctr || 0)
    const frequency = Number(camp.frequency || camp.freq || 0)
    const impressions = Number(camp.impressions || 0)
    const cpl = leads > 0 ? spend / leads : 0
    const platform: 'meta' | 'google' = camp.platform === 'google' ? 'google' : 'meta'

    // CPL crítico (>2.5x benchmark médio)
    if (cpl > 0 && benchCPLMid > 0 && cpl > benchCPLMid * 2.5) {
      alerts.push({
        id: `cpl-critical-${camp.id || name}`,
        type: 'critical',
        category: 'cpl',
        title: 'CPL crítico detectado',
        message: `"${name}" está com CPL R$${cpl.toFixed(0)} — ${((cpl / benchCPLMid - 1) * 100).toFixed(0)}% acima do benchmark do seu nicho.`,
        metric: `R$${cpl.toFixed(2)}`,
        benchmark: `R$${benchCPLMin}–R$${benchCPLMax}`,
        action: 'Pause esta campanha e analise criativos e público.',
        campaign: name,
        platform,
        createdAt: now,
      })
    }
    // CPL alto (>1.5x benchmark)
    else if (cpl > 0 && benchCPLMid > 0 && cpl > benchCPLMax * 1.5) {
      alerts.push({
        id: `cpl-warning-${camp.id || name}`,
        type: 'warning',
        category: 'cpl',
        title: 'CPL acima do benchmark',
        message: `"${name}" com CPL R$${cpl.toFixed(0)} está acima do teto do nicho (R$${benchCPLMax}).`,
        metric: `R$${cpl.toFixed(2)}`,
        benchmark: `até R$${benchCPLMax}`,
        action: 'Revise segmentação e criativos desta campanha.',
        campaign: name,
        platform,
        createdAt: now,
      })
    }

    // Frequência alta (>4)
    if (frequency > 4 && spend > 100) {
      alerts.push({
        id: `freq-high-${camp.id || name}`,
        type: frequency > 6 ? 'critical' : 'warning',
        category: 'frequency',
        title: frequency > 6 ? 'Fadiga de criativo severa' : 'Frequência alta',
        message: `"${name}" com frequência ${frequency.toFixed(1)}x — público vendo o mesmo anúncio repetidamente. CTR provavelmente caindo.`,
        metric: `${frequency.toFixed(1)}x`,
        benchmark: 'Ideal: < 3x',
        action: frequency > 6
          ? 'Pause e renove os criativos imediatamente.'
          : 'Adicione novos criativos e expanda o público.',
        campaign: name,
        platform,
        createdAt: now,
      })
    }

    // CTR baixo (<0.5%)
    if (impressions > 1000 && ctr > 0 && ctr < 0.5) {
      alerts.push({
        id: `ctr-low-${camp.id || name}`,
        type: ctr < 0.3 ? 'critical' : 'warning',
        category: 'ctr',
        title: 'CTR abaixo do mínimo',
        message: `"${name}" com CTR ${ctr.toFixed(2)}% — criativos não estão gerando cliques suficientes.`,
        metric: `${ctr.toFixed(2)}%`,
        benchmark: 'Meta: ≥ 1%',
        action: 'Teste novos hooks, imagens e textos de chamada.',
        campaign: name,
        platform,
        createdAt: now,
      })
    }

    // Gasto sem leads (desperdício)
    if (spend > 200 && leads === 0) {
      alerts.push({
        id: `waste-${camp.id || name}`,
        type: 'critical',
        category: 'budget',
        title: 'Verba gasta sem leads',
        message: `"${name}" gastou R$${spend.toFixed(0)} sem gerar nenhum lead. Possível problema no pixel ou landing page.`,
        metric: `R$${spend.toFixed(0)} gasto`,
        benchmark: '0 leads',
        action: 'Verifique o pixel, o evento de conversão e a landing page.',
        campaign: name,
        platform,
        createdAt: now,
      })
    }

    // ROAS negativo (<1)
    const roas = Number(camp.roas || 0)
    if (roas > 0 && roas < 1 && spend > 300) {
      alerts.push({
        id: `roas-low-${camp.id || name}`,
        type: 'warning',
        category: 'roas',
        title: 'ROAS abaixo do break-even',
        message: `"${name}" com ROAS ${roas.toFixed(2)}x — cada R$1 investido retorna menos do que custa.`,
        metric: `${roas.toFixed(2)}x`,
        benchmark: '≥ 1x',
        action: 'Revise a oferta e o funil de vendas desta campanha.',
        campaign: name,
        platform,
        createdAt: now,
      })
    }

    // Oportunidade: CPL abaixo do mínimo = escalar
    if (cpl > 0 && cpl < benchCPLMin * 0.7 && spend > 100 && leads > 5) {
      alerts.push({
        id: `scale-${camp.id || name}`,
        type: 'opportunity',
        category: 'scale',
        title: 'Campanha pronta para escalar',
        message: `"${name}" com CPL R$${cpl.toFixed(0)} — ${((1 - cpl / benchCPLMin) * 100).toFixed(0)}% abaixo do mínimo do nicho. Excelente resultado!`,
        metric: `R$${cpl.toFixed(2)} CPL`,
        benchmark: `mínimo R$${benchCPLMin}`,
        action: 'Aumente o orçamento desta campanha 20–30% para escalar com segurança.',
        campaign: name,
        platform,
        createdAt: now,
      })
    }
  }

  // ── Alertas do audit (seções com nota crítica) ─────────────────────────────
  if (audit) {
    const auditData = audit.audit ?? audit
    const sections = auditData.sections || {}

    for (const [key, section] of Object.entries(sections) as [string, any][]) {
      if (section?.grade === 'D' || section?.grade === 'F') {
        const sectionNames: Record<string, string> = {
          pixel:           'Pixel & Rastreamento',
          estrutura:       'Estrutura de Campanhas',
          copys:           'Copywriting',
          criativos:       'Criativos',
          publicos:        'Públicos-Alvo',
          lancesOrcamento: 'Lances & Orçamento',
          funil:           'Funil de Conversão',
          analise:         'Análise de Dados',
          planejamento:    'Planejamento',
          concorrencia:    'Análise Competitiva',
          ia:              'Uso de IA',
        }
        const sectionLabel = sectionNames[key] || key
        if (!alerts.some(a => a.id === `audit-${key}`)) {
          alerts.push({
            id: `audit-${key}`,
            type: 'warning',
            category: 'general',
            title: `Ponto crítico: ${sectionLabel}`,
            message: section?.summary || `A auditoria identificou problemas sérios em ${sectionLabel}.`,
            action: section?.recommendations?.[0] || 'Revise esta área na aba Auditoria.',
            createdAt: now,
          })
        }
      }
    }

    // Health score crítico
    const score = auditData.healthScore ?? auditData.overallScore
    if (score && score < 45) {
      alerts.unshift({
        id: 'health-critical',
        type: 'critical',
        category: 'general',
        title: `Score de saúde crítico: ${score}/100`,
        message: `A conta tem pontuação ${score}/100 — nível crítico que pode estar comprometendo resultados e desperdiçando verba.`,
        action: 'Execute a auditoria completa e implemente as ações prioritárias.',
        createdAt: now,
      })
    }
  }

  // ── Deduplica e ordena por severidade ──────────────────────────────────────
  const seen = new Set<string>()
  const unique = alerts.filter(a => {
    if (seen.has(a.id)) return false
    seen.add(a.id)
    return true
  })

  const order = { critical: 0, warning: 1, opportunity: 2, info: 3 }
  unique.sort((a, b) => (order[a.type] ?? 99) - (order[b.type] ?? 99))

  return unique.slice(0, 20) // máximo 20 alertas
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { campaigns = [], audit = null, niche = '', clientData = {}, sendEmail = false } = body

    const alerts = generateAlerts(campaigns, audit, niche, clientData)
    const criticalAlerts = alerts.filter(a => a.type === 'critical')

    if (sendEmail && criticalAlerts.length > 0) {
      try {
        const clerk = await clerkClient()
        const user = await clerk.users.getUser(userId)
        const email = user.emailAddresses[0]?.emailAddress
        if (email) {
          await sendAlertEmail(email, clientData.clientName || niche || 'Campanha', criticalAlerts)
        }
      } catch { /* silent — email failure não bloqueia */ }
    }

    return NextResponse.json({
      alerts,
      emailSent: sendEmail && criticalAlerts.length > 0,
      summary: {
        total: alerts.length,
        critical: criticalAlerts.length,
        warning: alerts.filter(a => a.type === 'warning').length,
        opportunity: alerts.filter(a => a.type === 'opportunity').length,
        info: alerts.filter(a => a.type === 'info').length,
      },
    })
  } catch (err) {
    console.error('[alerts] error:', err)
    return NextResponse.json({ alerts: [], summary: { total: 0, critical: 0, warning: 0, opportunity: 0, info: 0 } })
  }
}
