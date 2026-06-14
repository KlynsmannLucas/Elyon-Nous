// lib/maturity.ts — Maturidade por pilar derivada de sinais reais (CPL/CTR/conversão/tracking/volume).
// Pilares na ordem exata do prototype: Aquisição · Conversão · Retenção · Eficiência · Criativos · Dados & IA.

export interface Maturity { axes: string[]; you: number[]; sector: number[] }

export function deriveMaturity(rm: any, bench: any, trackOkRatio: number | null, health: number | null): Maturity {
  const clamp = (n: number) => Math.max(20, Math.min(98, Math.round(n)))
  const ctr = rm?.avgCTR ? Number(rm.avgCTR) : null
  const cpl = rm?.avgCPL ? Number(rm.avgCPL) : null
  const cvr = rm?.totalClicks > 0 ? (rm.totalLeads / rm.totalClicks) : null
  const leads = rm?.totalLeads || 0
  const ef = cpl != null && bench ? (cpl <= bench.cpl_min ? 92 : cpl <= bench.cpl_max ? 72 : 48) : (health ?? 60)
  const cr = ctr != null ? (ctr >= 2 ? 86 : ctr >= 1 ? 66 : 46) : (health ?? 60)
  const cv = cvr != null ? (cvr >= 0.05 ? 86 : cvr >= 0.02 ? 66 : 46) : (health ?? 55)
  const dq = trackOkRatio != null ? clamp(40 + trackOkRatio * 58) : (health ?? 60)
  const aq = leads >= 1000 ? 86 : leads >= 300 ? 72 : leads >= 50 ? 56 : 42
  const rt = health ?? 60
  return {
    axes: ['Aquisição', 'Conversão', 'Retenção', 'Eficiência', 'Criativos', 'Dados & IA'],
    you: [aq, cv, rt, ef, cr, dq].map(clamp),
    sector: [70, 68, 66, 70, 65, 60],
  }
}
