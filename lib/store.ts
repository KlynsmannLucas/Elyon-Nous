// lib/store.ts — Estado global com Zustand
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ConnectedAccount {
  platform: 'meta' | 'google'
  accessToken: string
  accountId?: string
  accountName?: string
  connectedAt: string
}

export interface AdsCampaign {
  id: string
  name: string
  status: string
  spend: number
  impressions: number
  clicks: number
  ctr: number
  leads: number
  cpl: number
  roas: number
  platform: 'meta' | 'google'
}

export interface CampaignRecord {
  id: string
  channel: string           // Meta Ads, Google, TikTok, etc.
  period: string            // "Jan 2025", "Q1 2025"
  budgetSpent: number       // quanto foi investido
  leads: number             // leads gerados
  cplReal: number           // CPL real (calculado)
  conversions: number       // vendas/conversões
  revenue: number           // receita gerada
  outcome: 'vencedora' | 'neutra' | 'perdedora'
  whatWorked: string        // o que funcionou
  whatFailed: string        // o que não funcionou
  notes: string             // observações gerais
  createdAt: string
}

export interface ClientData {
  clientName: string
  niche: string
  products: string[]
  budget: number
  objective: string
  monthlyRevenue: number
  nicheDetails?: Record<string, string>   // campos específicos do nicho (ex: especialidade, ticket)
  city?: string                            // cidade/região de atuação
  currentCPL?: number                      // CPL atual do cliente
  mainChallenge?: string                   // maior desafio de crescimento atual
  currentLeadSource?: string               // principal origem de leads hoje
}

export interface StrategyData {
  analysis: Record<string, any>
  strategy: Record<string, any>
  adCopy: Record<string, any>
  audienceSuggestions: Record<string, any>
  creativeBrief: Record<string, any>
  generatedAt: string
}

export interface SavedClient {
  id: string
  clientData: ClientData
  strategyData: StrategyData | null
  savedAt: string
}

interface AppStore {
  clientData: ClientData | null
  setClientData: (data: ClientData) => void

  strategyData: StrategyData | null
  setStrategyData: (data: StrategyData) => void

  isGenerating: boolean
  setIsGenerating: (v: boolean) => void

  wizardStep: number
  setWizardStep: (step: number) => void

  // Contas conectadas (Meta / Google)
  connectedAccounts: ConnectedAccount[]
  connectAccount: (account: ConnectedAccount) => void
  disconnectAccount: (platform: 'meta' | 'google') => void

  // Histórico de campanhas por cliente
  campaignHistory: CampaignRecord[]
  addCampaign: (record: Omit<CampaignRecord, 'id' | 'createdAt'>) => void
  updateCampaign: (id: string, record: Partial<CampaignRecord>) => void
  deleteCampaign: (id: string) => void

  // Clientes salvos
  savedClients: SavedClient[]
  setSavedClients: (clients: SavedClient[]) => void
  saveCurrentClient: () => void
  loadSavedClient: (id: string) => SavedClient | null
  deleteSavedClient: (id: string) => void

  // Rate limiting: timestamps das gerações de estratégia (últimas 1h)
  strategyTimestamps: number[]
  recordStrategyGeneration: () => void
  getStrategyCountLastHour: () => number

  clearAll: () => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      clientData: null,
      setClientData: (data) => set({ clientData: data }),

      strategyData: null,
      setStrategyData: (data) => set({ strategyData: data }),

      isGenerating: false,
      setIsGenerating: (v) => set({ isGenerating: v }),

      wizardStep: 0,
      setWizardStep: (step) => set({ wizardStep: step }),

      connectedAccounts: [],

      connectAccount: (account) => {
        set((s) => ({
          connectedAccounts: [
            ...s.connectedAccounts.filter((a) => a.platform !== account.platform),
            account,
          ],
        }))
      },

      disconnectAccount: (platform) => {
        set((s) => ({
          connectedAccounts: s.connectedAccounts.filter((a) => a.platform !== platform),
        }))
      },

      campaignHistory: [],

      addCampaign: (record) => {
        const newEntry: CampaignRecord = {
          ...record,
          id: crypto.randomUUID(),
          cplReal: record.leads > 0 ? Math.round(record.budgetSpent / record.leads) : 0,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ campaignHistory: [newEntry, ...s.campaignHistory] }))
      },

      updateCampaign: (id, partial) => {
        set((s) => ({
          campaignHistory: s.campaignHistory.map((c) =>
            c.id === id
              ? {
                  ...c,
                  ...partial,
                  cplReal: partial.leads !== undefined || partial.budgetSpent !== undefined
                    ? Math.round((partial.budgetSpent ?? c.budgetSpent) / ((partial.leads ?? c.leads) || 1))
                    : c.cplReal,
                }
              : c
          ),
        }))
      },

      deleteCampaign: (id) => {
        set((s) => ({ campaignHistory: s.campaignHistory.filter((c) => c.id !== id) }))
      },

      savedClients: [],

      setSavedClients: (clients) => set({ savedClients: clients }),

      saveCurrentClient: () => {
        const { clientData, strategyData, savedClients } = get()
        if (!clientData) return

        // Atualiza se já existe um salvo com mesmo nome, senão adiciona
        const existing = savedClients.find(
          (s) => s.clientData.clientName === clientData.clientName
        )
        const entry: SavedClient = {
          id: existing?.id ?? crypto.randomUUID(),
          clientData,
          strategyData,
          savedAt: new Date().toISOString(),
        }
        const updated = existing
          ? savedClients.map((s) => (s.id === existing.id ? entry : s))
          : [...savedClients, entry]

        set({ savedClients: updated })
      },

      loadSavedClient: (id) => {
        const { savedClients } = get()
        const found = savedClients.find((s) => s.id === id)
        if (!found) return null
        set({ clientData: found.clientData, strategyData: found.strategyData })
        return found
      },

      deleteSavedClient: (id) => {
        const { savedClients } = get()
        set({ savedClients: savedClients.filter((s) => s.id !== id) })
      },

      strategyTimestamps: [],
      recordStrategyGeneration: () => {
        const now = Date.now()
        const oneHourAgo = now - 60 * 60 * 1000
        set((s) => ({
          strategyTimestamps: [...s.strategyTimestamps.filter((t) => t > oneHourAgo), now],
        }))
      },
      getStrategyCountLastHour: () => {
        const oneHourAgo = Date.now() - 60 * 60 * 1000
        return get().strategyTimestamps.filter((t) => t > oneHourAgo).length
      },

      clearAll: () => set({
        clientData: null,
        strategyData: null,
        isGenerating: false,
        wizardStep: 0,
      }),
    }),
    {
      name: 'elyon-store',
      partialize: (state) => ({
        clientData:          state.clientData,
        strategyData:        state.strategyData,
        savedClients:        state.savedClients,
        campaignHistory:     state.campaignHistory,
        connectedAccounts:   state.connectedAccounts,
        strategyTimestamps:  state.strategyTimestamps,
      }),
    }
  )
)
