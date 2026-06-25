// lib/pulse.ts — Motor do Pulse diário. Monta, a partir de dados JÁ no banco
// (última auditoria + daily_metrics + ações executadas), um resumo acionável:
// 1-3 itens urgentes + 1 vitória. Mesma inteligência alimenta e-mail e WhatsApp.
import { supabaseAdmin } from '@/lib/supabase'

const brl = (n: number) => 'R$ ' + new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Math.round(n || 0))

export interface PulseData {
  clientName: string
  dateLabel: string
  score: number | null
  grade: string | null
  scoreDelta: number | null
  cplDelta: number | null
  urgent: string[]
  win: string | null
  auditAgeDays: number | null
  hasData: boolean
  dashboardUrl: string
}

const DASH_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.elyonnous.com'
const DAY = 86400000

export async function buildPulseData(userId: string, clientName: string, niche?: string): Promise<PulseData> {
  const dateLabel = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const out: PulseData = {
    clientName, dateLabel: dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1),
    score: null, grade: null, scoreDelta: null, cplDelta: null,
    urgent: [], win: null, auditAgeDays: null, hasData: false,
    dashboardUrl: `${DASH_URL}/hoje`,
  }
  if (!supabaseAdmin) return out

  // ── Conta de anúncio DESTE cliente (isolamento) ────────────────────────────
  // Salva em clients.extra_data pelo /api/clients/account. Sem ela, o radar do Pulse
  // cairia na conta padrão do usuário (que é de outro cliente).
  let selMeta: string | null = null
  let selGoogle: string | null = null
  try {
    const { data: cr } = await supabaseAdmin
      .from('clients').select('extra_data, client_data').eq('user_id', userId)
    const row = (cr || []).find((r: any) => r?.client_data?.clientName === clientName)
    selMeta = (row?.extra_data as any)?.selectedMetaAccountId || null
    selGoogle = (row?.extra_data as any)?.selectedGoogleAccountId || null
  } catch { /* sem seleção salva — radar fica vazio (não vaza outro cliente) */ }

  // ── Sinais de URGÊNCIA — da última auditoria ───────────────────────────────
  try {
    const { data: la } = await supabaseAdmin
      .from('audit_reports')
      .select('score, grade, summary, raw_response, created_at')
      .eq('user_id', userId).eq('client_name', clientName)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (la) {
      out.hasData = true
      const raw: any = la.raw_response || {}
      const ev: any = raw._evolution || {}
      out.score = la.score ?? raw.health_score ?? null
      out.grade = la.grade ?? raw.grade ?? null
      out.scoreDelta = typeof ev.scoreDelta === 'number' ? ev.scoreDelta : null
      out.cplDelta = typeof ev.cplDelta === 'number' ? ev.cplDelta : null
      out.auditAgeDays = la.created_at ? Math.floor((Date.now() - new Date(la.created_at).getTime()) / DAY) : null

      // 1) Desperdício de verba (campanhas gastando sem conversão)
      const waste: any[] = Array.isArray(raw._wasteCampaigns) ? raw._wasteCampaigns : []
      const wasteTotal = waste.reduce((s, c) => s + (Number(c.spend) || 0), 0)
      if (waste.length > 0 && wasteTotal > 0) {
        out.urgent.push(`${brl(wasteTotal)} em desperdício · ${waste.length} ${waste.length === 1 ? 'campanha gastando' : 'campanhas gastando'} sem conversão`)
      }
      // 2) CPL subindo
      if (out.cplDelta != null && out.cplDelta > 5) {
        out.urgent.push(`CPL subiu ${out.cplDelta}% vs. última auditoria — revisar segmentação/criativo`)
      }
      // 3) Ações prioritárias do NOUS
      const acts: any[] = Array.isArray(raw.o_que_eu_faria_agora) ? raw.o_que_eu_faria_agora : []
      for (const a of acts) { if (a?.titulo && out.urgent.length < 3) out.urgent.push(String(a.titulo)) }
      if (out.urgent.length < 3 && Array.isArray(raw.gargalos)) {
        for (const g of raw.gargalos) { if (g?.titulo && out.urgent.length < 3) out.urgent.push(String(g.titulo)) }
      }
    }
  } catch { /* sem auditoria — segue sem urgências */ }

  // ── VITÓRIA — do Impacto ELYON (ações executadas + trajetória de CPL) ───────
  try {
    const { data: ex } = await supabaseAdmin
      .from('executed_actions')
      .select('account_id, action, cpl_before, executed_at')
      .eq('user_id', userId).eq('client_name', clientName)
      .order('executed_at', { ascending: false }).limit(60)
    if (ex && ex.length > 0) {
      out.hasData = true
      const accCount: Record<string, number> = {}
      for (const a of ex) if (a.account_id) accCount[a.account_id] = (accCount[a.account_id] || 0) + 1
      const primaryAcc = Object.entries(accCount).sort((x, y) => y[1] - x[1])[0]?.[0] || null

      let cplNow: number | null = null
      let leads30d = 0
      if (primaryAcc) {
        const { data: m } = await supabaseAdmin
          .from('daily_metrics')
          .select('cpl, leads').eq('user_id', userId).eq('account_id', primaryAcc)
          .order('date', { ascending: false }).limit(30)
        cplNow = (m || []).find(r => r.cpl != null)?.cpl ?? null
        leads30d = (m || []).reduce((s, r) => s + (r.leads || 0), 0)
      }
      const asc = [...ex].reverse()
      const cplBaseline = asc.find(a => a.cpl_before != null)?.cpl_before ?? null
      const firstAt = asc[0]?.executed_at ? new Date(asc[0].executed_at).getTime() : null
      const daysSinceFirst = firstAt ? Math.floor((Date.now() - firstAt) / DAY) : 0

      if (cplBaseline != null && cplNow != null && cplNow < cplBaseline && leads30d > 0 && daysSinceFirst >= 3) {
        const saved = Math.round((cplBaseline - cplNow) * leads30d)
        out.win = `CPL caiu de ${brl(cplBaseline)} para ${brl(cplNow)} — o ELYON já gerou cerca de +${brl(saved)}/mês`
      } else {
        const pauses = ex.filter(a => a.action === 'pause').length
        const scales = ex.filter(a => a.action === 'scale').length
        if (pauses > 0 || scales > 0) {
          const parts = []
          if (pauses > 0) parts.push(`cortou desperdício em ${pauses} ${pauses === 1 ? 'campanha' : 'campanhas'}`)
          if (scales > 0) parts.push(`escalou ${scales} ${scales === 1 ? 'vencedora' : 'vencedoras'}`)
          out.win = `O NOUS ${parts.join(' e ')} este período`
        }
      }
    }
  } catch { /* sem ações — segue sem vitória específica */ }

  // ── RADAR ao vivo (Meta+Google, últimos 7d) — substitui as urgências da auditoria ──
  // quando há sinais reais agora. É mais atual e ranqueado por dinheiro.
  try {
    const { buildRadar } = await import('@/lib/radar')
    // strictAccounts: usa SÓ a conta deste cliente; sem conta selecionada, não roda radar
    // (não cai na conta padrão do usuário, que pertence a outro cliente).
    const { alerts } = (selMeta || selGoogle)
      ? await buildRadar({ userId, niche, metaAccountId: selMeta || undefined, googleAccountId: selGoogle || undefined, strictAccounts: true })
      : { alerts: [] as Awaited<ReturnType<typeof buildRadar>>['alerts'] }
    if (alerts.length > 0) {
      out.hasData = true
      const leaksRisks = alerts.filter(a => a.severity !== 'opportunity')
      if (leaksRisks.length > 0) out.urgent = leaksRisks.slice(0, 3).map(a => a.title)
      const opp = alerts.find(a => a.severity === 'opportunity')
      if (!out.win && opp) out.win = `Oportunidade: ${opp.title}`
    }
  } catch { /* radar opcional — mantém as urgências da auditoria */ }

  // Fallbacks de vitória vindos da evolução da auditoria
  if (!out.win && out.cplDelta != null && out.cplDelta < 0) out.win = `CPL caiu ${Math.abs(out.cplDelta)}% vs. última auditoria`
  if (!out.win && out.scoreDelta != null && out.scoreDelta > 0) out.win = `Saúde da conta subiu ${out.scoreDelta} pts`

  return out
}

// ── Render para WhatsApp (params do template) ─────────────────────────────────
// Template `pulse_diario` (ver README/credenciais): corpo com {{1}}..{{4}}.
export function pulseToWhatsAppParams(p: PulseData): string[] {
  const urgent = p.urgent.length ? p.urgent.slice(0, 2).join(' · ') : 'Tudo sob controle — nada urgente hoje'
  const win = p.win || (p.score != null ? `Saúde da conta: ${p.score}/100 (${p.grade || '—'})` : 'Conta estável')
  return [
    `${p.clientName} · ${p.dateLabel}`,
    urgent,
    win,
    p.dashboardUrl,
  ]
}

// Texto livre (fallback de teste dentro da janela de 24h).
export function pulseToWhatsAppText(p: PulseData): string {
  const lines = [`☀️ *Pulse ELYON* — ${p.clientName}`, p.dateLabel, '']
  if (p.urgent.length) { lines.push('⚠️ *Precisa de atenção:*'); p.urgent.slice(0, 3).forEach(u => lines.push(`• ${u}`)); lines.push('') }
  else { lines.push('✅ Nada urgente hoje.'); lines.push('') }
  if (p.win) lines.push(`🏆 *Vitória:* ${p.win}`, '')
  lines.push(`👉 ${p.dashboardUrl}`)
  return lines.join('\n')
}

// ── Render para e-mail (bloco HTML do Pulse, injetado no template do briefing) ─
export function pulseToEmailBlocks(p: PulseData): string {
  const urgentHtml = p.urgent.length
    ? p.urgent.slice(0, 3).map(u => `
      <div style="display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-top:1px solid rgba(255,255,255,0.05);">
        <span style="color:#F59E0B;font-size:14px;line-height:1.4;">⚠️</span>
        <span style="font-size:13px;color:#CBD5E1;line-height:1.5;">${u}</span>
      </div>`).join('')
    : `<div style="font-size:13px;color:#22C55E;padding:8px 0;">✅ Nada urgente hoje — conta sob controle.</div>`

  const winHtml = p.win ? `
    <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.22);border-radius:14px;padding:16px 18px;margin-bottom:16px;">
      <div style="font-size:11px;color:#22C55E;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;font-weight:700;">🏆 Vitória do período</div>
      <div style="font-size:13.5px;color:#E2E8F0;line-height:1.5;">${p.win}</div>
    </div>` : ''

  return `
    <div style="background:#0F1629;border:1px solid rgba(245,158,11,0.18);border-radius:14px;padding:18px 20px;margin-bottom:16px;">
      <div style="font-size:11px;color:#F59E0B;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px;font-weight:700;">O que precisa de atenção</div>
      ${urgentHtml}
    </div>
    ${winHtml}`
}
