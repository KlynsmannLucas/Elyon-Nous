// lib/simpleDemoData.ts — Dados de exemplo para o Modo Simplificado.
// Overlay read-only via localStorage: NUNCA toca no store nem nos dados reais/persistidos.
// Só é oferecido em estados vazios (sem dados reais), então não há risco de substituição.

import type { FunnelEntry } from '@/lib/store'

const FLAG_KEY = 'using_simple_demo_data'

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

// ── Shapes prontos para as telas simples ─────────────────────────────────────────
export function getDemoFunnelEntry(clientName: string): Omit<FunnelEntry, 'id' | 'createdAt'> & { id: string; createdAt: string } {
  return {
    id: 'simple_demo_entry',
    clientName,
    period: 'Últimos 30 dias',
    channel: 'Meta Ads',
    investment:       SIMPLE_DEMO_DATA.investimento,
    impressions:      SIMPLE_DEMO_DATA.impressoes,
    clicks:           SIMPLE_DEMO_DATA.cliques,
    leads:            SIMPLE_DEMO_DATA.leads,
    qualifiedLeads:   SIMPLE_DEMO_DATA.qualificados,
    sales:            SIMPLE_DEMO_DATA.vendas,
    avgTicket:        SIMPLE_DEMO_DATA.ticketMedio,
    avgResponseHours: 2,
    createdAt:        new Date().toISOString(),
  }
}

/** Campos numéricos do cliente (ticket, margem, conversão, budget, faturamento) */
export function getDemoClientFields() {
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
