// lib/createClientFlow.ts — fluxo enxuto de geração de estratégia + persistência,
// reutilizado pelo onboarding v2 (/novo). Reproduz o essencial do handleWizardComplete
// do dashboard legado, lendo tudo do store (sem depender de helpers locais).
'use client'

import { useAppStore } from '@/lib/store'

export interface WizardImportData {
  filename: string
  platform: string
  campaigns: any[]
}

/**
 * Gera a estratégia para o cliente ativo (já setado no store pelo SetupWizard),
 * persiste localmente + no banco e, se houver importação, roda a auditoria.
 */
export async function generateStrategyForActiveClient(
  importData?: WizardImportData[],
  onStep?: (s: string) => void,
): Promise<{ ok: boolean; error?: string }> {
  const store = useAppStore.getState()
  const clientData = store.clientData
  if (!clientData) return { ok: false, error: 'Nenhum cliente ativo.' }

  try {
    onStep?.('Analisando o nicho e o mercado…')

    const controller = new AbortController()
    // 150s: cobre o pior caso da cadeia de fallback do servidor (IA 42s + Gemini 40s
    // + RAG/processamento), agora que o /api/strategy tem maxDuration 300.
    const timeout = setTimeout(() => controller.abort(), 150000)
    const { auditCache: ac, campaignHistory: ch, generatedPersona: gp, connectedAccounts: ca } = useAppStore.getState()

    const res = await fetch('/api/strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...clientData,
        campaignHistory: ch,
        recentAudit: ac[clientData.clientName]?.[0]?.audit ?? null,
        persona: gp,
        metaAccessToken: ca.find((a: any) => a.platform === 'meta')?.accessToken ?? null,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok || !res.body) throw new Error(`Erro ${res.status} ao gerar estratégia.`)

    onStep?.('Montando sua estratégia personalizada…')
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let json: any = null
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim()
        if (line.startsWith('data: ')) { try { json = JSON.parse(line.slice(6)) } catch {} }
      }
      buffer = lines[lines.length - 1]
      if (json) break
    }

    if (!json) throw new Error('Resposta vazia do servidor.')
    if (!json.success) throw new Error(json.error || 'Falha ao gerar estratégia.')

    const s = useAppStore.getState()
    s.setStrategyData({
      analysis: json.strategy,
      strategy: json.strategy,
      adCopy: {},
      audienceSuggestions: {},
      creativeBrief: {},
      generatedAt: new Date().toISOString(),
    })
    s.recordStrategyGeneration?.()
    s.saveCurrentClient()

    // Persiste no banco (best-effort)
    try {
      const st = useAppStore.getState()
      const entry = st.savedClients.find((c: any) => c.clientData.clientName === clientData.clientName)
      if (entry) {
        await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...entry, auditData: st.auditCache[clientData.clientName] ?? null, extraData: null }),
        })
      }
    } catch { /* salvo localmente; segue */ }

    // Auditoria automática quando há importação de CSV
    if (importData && importData.length > 0) {
      onStep?.('Auditando as campanhas importadas…')
      try {
        const auditRes = await fetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientName: clientData.clientName,
            niche: clientData.niche,
            budget: clientData.budget,
            objective: clientData.objective,
            uploadedFiles: importData.map(d => ({ filename: d.filename, platform: d.platform, campaigns: d.campaigns })),
          }),
        })
        const auditJson = await auditRes.json()
        if (auditJson.success) useAppStore.getState().setAuditCache(clientData.clientName, auditJson.audit)
      } catch { /* não bloqueia */ }
    }

    return { ok: true }
  } catch (e: any) {
    if (e?.name === 'AbortError') return { ok: false, error: 'Tempo esgotado ao gerar a estratégia. Tente novamente.' }
    return { ok: false, error: e?.message || 'Erro ao gerar estratégia.' }
  }
}
