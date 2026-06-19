// types/meta.ts — Interfaces TypeScript para a integração Meta Ads
// Nunca expõe accessToken para o frontend

export interface MetaAdAccount {
  id: string
  name: string
  currency: string
  timezone: string
  accountStatus: string
  businessId: string | null
  amountSpent: number
  balance: number
}

export interface MetaCampaign {
  id: string
  name: string
  objective: string
  objectiveLabel: string
  status: string
  effectiveStatus: string
  dailyBudget: number
  lifetimeBudget: number
  budgetRemaining: number
  spend: number
  impressions: number
  reach: number
  frequency: number
  clicks: number
  ctr: number
  cpc: number
  cpm: number
  leads: number
  cpl: number
  purchases: number
  revenue: number
  roas: number
  messages: number
  videoViews: number
  learningPhase: 'learning' | 'learning_limited' | 'stable' | 'inactive'
  ageDays: number
  issues: string[]
  recommendations: string[]
}

export interface MetaAdSet {
  id: string
  campaignId: string
  campaignName: string
  name: string
  status: string
  optimizationGoal: string
  billingEvent: string
  bidStrategy: string
  dailyBudget: number
  hasRemarketing: boolean
  spend: number
  impressions: number
  clicks: number
  leads: number
  cpl: number
  ctr: number
  frequency: number
  issues: string[]
}

export interface MetaAd {
  id: string
  adsetId: string
  campaignId: string
  name: string
  status: string
  title: string
  body: string
  imageUrl: string
  callToAction: string
  spend: number
  impressions: number
  clicks: number
  leads: number
  cpl: number
  ctr: number
  frequency: number
  tag: 'winner' | 'waste' | 'learning' | 'ok'
}

export interface MetaPixel {
  id: string
  name: string
  lastFiredTime: string | null
  isActive: boolean
  events: string[]
}

export interface MetaInsight {
  spend: number
  impressions: number
  reach: number
  frequency: number
  clicks: number
  ctr: number
  cpc: number
  cpm: number
  leads: number
  cpl: number
  purchases: number
  revenue: number
  roas: number
}

export interface MetaPlacementBreakdown {
  platform: string
  position: string
  spend: number
  leads: number
  cpl: number
  impressions: number
  clicks: number
  ctr: number
}

export interface MetaDemoBreakdown {
  age: string
  gender: string
  spend: number
  leads: number
  cpl: number
  impressions: number
}

export class MetaTokenError extends Error {
  constructor(
    public readonly code: 'NO_CONNECTION' | 'EXPIRED' | 'EXPIRING_SOON' | 'INVALID' | 'SERVER_CONFIG',
    message: string
  ) {
    super(message)
    this.name = 'MetaTokenError'
  }
}

export interface MetaAuditIssue {
  type: string
  entity: 'account' | 'campaign' | 'adset' | 'ad'
  entityId: string
  entityName: string
  metric: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  evidence: string
  impact: string
  recommendation: string
}
