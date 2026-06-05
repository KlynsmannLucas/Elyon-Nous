// lib/simpleDemoData.ts — Dados de exemplo para o Modo Simplificado.
// Overlay read-only via localStorage: NUNCA toca no store nem nos dados reais/persistidos.
// Só é oferecido em estados vazios (sem dados reais), então não há risco de substituição.

import type { FunnelEntry } from '@/lib/store'
import { getCurrentNicheFromOnboarding } from '@/lib/nicheConfigs'

const FLAG_KEY = 'using_simple_demo_data'

// Cenário específico do corretor de plano de saúde
const HEALTH_DEMO = {
  investimento: 2000, impressoes: 40000, cliques: 800,
  leads: 80, qualificados: 30, cotacoes: 22, propostas: 14, contratos: 5,
  comissaoMedia: 700, comissaoEstimada: 3500,
}

export const SIMPLE_DEMO_DATA = {
  investimento: 2000,
  impressoes:   40000,
  cliques:      800,
  leads:        80,
  qualificados: 30,
  vendas:       8,
  faturamento:  9600,
  ticketMedio:  1200,
  margem:       35,   // %
  periodoDias:  30,
}

// Derivados
const CPL  = Math.round(SIMPLE_DEMO_DATA.investimento / SIMPLE_DEMO_DATA.leads)            // 25
const CTR  = +((SIMPLE_DEMO_DATA.cliques / SIMPLE_DEMO_DATA.impressoes) * 100).toFixed(1)  // 2.0
const ROAS = +(SIMPLE_DEMO_DATA.faturamento / SIMPLE_DEMO_DATA.investimento).toFixed(1)    // 4.8
const CVR  = +((SIMPLE_DEMO_DATA.vendas / SIMPLE_DEMO_DATA.leads) * 100).toFixed(0)        // 10

// ── Flag ───────────────────────────────────────────────────────────────────────
export function isUsingSimpleDemoData(): boolean {
  try { return localStorage.getItem(FLAG_KEY) === '1' } catch { return false }
}

export function applySimpleDemoData() {
  try { localStorage.setItem(FLAG_KEY, '1') } catch {}
  window.dispatchEvent(new Event('elyon:demo-changed'))
}

export function clearSimpleDemoData() {
  try { localStorage.removeItem(FLAG_KEY) } catch {}
  window.dispatchEvent(new Event('elyon:demo-changed'))
}

function isHealthNiche() {
  return getCurrentNicheFromOnboarding().key === 'health_insurance_broker'
}

// ── Shapes prontos para as telas simples (variam conforme o nicho do onboarding) ──
export function getDemoFunnelEntry(clientName: string): Omit<FunnelEntry, 'id' | 'createdAt'> & { id: string; createdAt: string; quotes?: number; proposals?: number } {
  const h = isHealthNiche()
  return {
    id: 'simple_demo_entry',
    clientName,
    period: 'Últimos 30 dias',
    channel: 'Meta Ads',
    investment:       h ? HEALTH_DEMO.investimento : SIMPLE_DEMO_DATA.investimento,
    impressions:      h ? HEALTH_DEMO.impressoes   : SIMPLE_DEMO_DATA.impressoes,
    clicks:           h ? HEALTH_DEMO.cliques       : SIMPLE_DEMO_DATA.cliques,
    leads:            h ? HEALTH_DEMO.leads         : SIMPLE_DEMO_DATA.leads,
    qualifiedLeads:   h ? HEALTH_DEMO.qualificados  : SIMPLE_DEMO_DATA.qualificados,
    sales:            h ? HEALTH_DEMO.contratos     : SIMPLE_DEMO_DATA.vendas,
    avgTicket:        h ? HEALTH_DEMO.comissaoMedia : SIMPLE_DEMO_DATA.ticketMedio,
    avgResponseHours: h ? 0.3 : 2,
    createdAt:        new Date().toISOString(),
    // Campos extras do corretor (cotações/propostas) — só no cenário de saúde
    ...(h ? { quotes: HEALTH_DEMO.cotacoes, proposals: HEALTH_DEMO.propostas } : {}),
  }
}

/** Campos numéricos do cliente (ticket, margem, conversão, budget, faturamento) */
export function getDemoClientFields() {
  if (isHealthNiche()) {
    return {
      ticketPrice:    HEALTH_DEMO.comissaoMedia,                                        // comissão média
      grossMargin:    80,                                                              // corretagem: margem alta
      conversionRate: +((HEALTH_DEMO.contratos / HEALTH_DEMO.leads) * 100).toFixed(0), // ~6%
      budget:         HEALTH_DEMO.investimento,
      monthlyRevenue: HEALTH_DEMO.comissaoEstimada,
    }
  }
  return {
    ticketPrice:    SIMPLE_DEMO_DATA.ticketMedio,
    grossMargin:    SIMPLE_DEMO_DATA.margem,
    conversionRate: CVR,
    budget:         SIMPLE_DEMO_DATA.investimento,
    monthlyRevenue: SIMPLE_DEMO_DATA.faturamento,
  }
}

/** Métricas no formato _realMetrics da auditoria (usado por home/saúde) */
export function getDemoRealMetrics() {
  if (isHealthNiche()) {
    return {
      totalSpend:    HEALTH_DEMO.investimento,
      totalLeads:    HEALTH_DEMO.leads,
      totalRevenue:  HEALTH_DEMO.comissaoEstimada,
      avgCPL:        Math.round(HEALTH_DEMO.investimento / HEALTH_DEMO.leads),
      avgCTR:        +((HEALTH_DEMO.cliques / HEALTH_DEMO.impressoes) * 100).toFixed(1),
      avgROAS:       +(HEALTH_DEMO.comissaoEstimada / HEALTH_DEMO.investimento).toFixed(1),
      campaignCount: 3,
      dataSource:    'exemplo',
    }
  }
  return {
    totalSpend:    SIMPLE_DEMO_DATA.investimento,
    totalLeads:    SIMPLE_DEMO_DATA.leads,
    totalRevenue:  SIMPLE_DEMO_DATA.faturamento,
    avgCPL:        CPL,
    avgCTR:        CTR,
    avgROAS:       ROAS,
    campaignCount: 3,
    dataSource:    'exemplo',
  }
}
