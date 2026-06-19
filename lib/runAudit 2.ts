// lib/runAudit.ts — Roda a Análise Profunda do cliente ativo de qualquer lugar
// (v2 ou app antigo), replicando o fluxo do TabAuditoria: busca dados Meta/Google
// → /api/audit → salva no store. Retorna { ok, error }.
import { useAppStore } from '@/lib/store'

export async function runAuditForActiveClient(opts?: { datePreset?: string; onStep?: (s: string) => void }): Promise<{ ok: boolean; error?: string }> {
  const s = useAppStore.getState()
  const clientData = s.clientData
  if (!clientData) return { ok: false, error: 'Nenhum cliente ativo.' }

  const datePreset = opts?.datePreset || 'last_30d'
  const step = opts?.onStep || (() => {})

  const metaAccount = s.connectedAccounts.find(a => a.platform === 'meta')
  const googleAccount = s.connectedAccounts.find(a => a.platform === 'google')
  if (!metaAccount && !googleAccount) {
    return { ok: false, error: 'Conecte uma conta (Meta ou Google) em Integrações para rodar a auditoria.' }
  }
  const selMeta = s.selectedMetaAccountByClient[clientData.clientName] || metaAccount?.accountId
  const selGoogle = s.selectedGoogleAccountByClient[clientData.clientName] || googleAccount?.accountId

  try {
    step('Buscando dados das plataformas…')
    const [metaResult, googleResult] = await Promise.all([
      metaAccount
        ? fetch('/api/ads-data/meta', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountId: selMeta || undefined, datePreset }) }).then(r => r.json()).catch(() => null)
        : Promise.resolve(null),
      googleAccount
        ? fetch('/api/ads-data/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountId: selGoogle || undefined, datePreset }) }).then(r => r.json()).catch(() => null)
        : Promise.resolve(null),
    ])

    const metaError = metaResult && !metaResult.success ? metaResult.error : null
    const googleError = googleResult && !googleResult.success ? googleResult.error : null
    if (metaError && googleError) return { ok: false, error: `Meta Ads: ${metaError} · Google Ads: ${googleError}` }

    step('Analisando campanhas com IA…')
    const metaCampaigns = metaResult?.success ? metaResult.campaigns : []
    const metaTotals = metaResult?.success ? metaResult.totals : null
    const googleCampaigns = googleResult?.success ? googleResult.campaigns : []
    const googleTotals = googleResult?.success ? googleResult.totals : null

    const res = await fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: clientData.clientName,
        niche: clientData.niche,
        budget: clientData.budget,
        objective: clientData.objective,
        datePreset,
        metaCampaigns, metaTotals, googleCampaigns, googleTotals,
        uploadedFiles: [],
        auditSource: 'auto',
        previousAudits: (s.auditCache[clientData.clientName] || []).slice(0, 3).map((e: any) => ({
          date: e.createdAt, health_score: e.audit?.health_score, grade: e.audit?.grade,
          totalSpend: e.audit?._realMetrics?.totalSpend, totalLeads: e.audit?._realMetrics?.totalLeads, avgCPL: e.audit?._realMetrics?.avgCPL,
        })),
      }),
    })
    const json = await res.json().catch(() => ({ success: false, error: `Resposta inválida (HTTP ${res.status}).` }))
    if (!json.success) return { ok: false, error: json.error || 'Falha na auditoria.' }

    step('Salvando…')
    const st = useAppStore.getState()
    st.setAuditCache(clientData.clientName, json.audit)
    if (json.priorityActions?.length) st.addPendingActions(clientData.clientName, json.priorityActions)
    if (json.audit?.health_score) {
      st.setClientHealthScore(clientData.clientName, json.audit.health_score, json.audit.grade || 'B', json.source === 'ai' ? 'ai' : 'benchmark')
    }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Erro ao gerar auditoria.' }
  }
}
