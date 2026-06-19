// lib/maturity.ts — Maturidade por pilar derivada de sinais reais (CPL/CTR/conversão/tracking/volume).
// Pilares na ordem exata do prototype: Aquisição · Conversão · Retenção · Eficiência · Criativos · Dados & IA.

export interface Maturity { axes: string[]; you: number[]; sector: number[] }

// 11 dimensões da auditoria profunda (ordem do prototype), derivadas dos sinais reais.
export function deriveDimensions(maturity: Maturity, audit: any, rm: any): { k: string; v: number }[] {
  const clamp = (n: number) => Math.max(35, Math.min(96, Math.round(n)))
  const ax = (name: string) => { const i = maturity.axes.indexOf(name); return i >= 0 ? maturity.you[i] : 60 }
  const wastePct = audit?._wastePercent ?? 0
  const tArr: any[] = audit?._trackingChecklist || []
  const tRatio = tArr.length ? tArr.filter(t => t.status === 'verificado').length / tArr.length : null
  const track = tRatio != null ? clamp(40 + tRatio * 58) : 62
  const wasteScore = clamp(94 - wastePct * 1.8)
  const campN = rm?.campaignCount || 0
  return [
    { k: 'Estrutura de conta', v: clamp(campN >= 8 ? 84 : campN >= 3 ? 72 : 58) },
    { k: 'Segmentação', v: ax('Conversão') },
    { k: 'Criativos', v: ax('Criativos') },
    { k: 'Lances & orçamento', v: wasteScore },
    { k: 'Conversão / CRO', v: clamp(ax('Conversão') - 4) },
    { k: 'Tracking & pixel', v: track },
    { k: 'Palavras-chave', v: ax('Aquisição') },
    { k: 'Públicos', v: ax('Aquisição') },
    { k: 'Landing pages', v: clamp(ax('Conversão') - 8) },
    { k: 'Frequência & fadiga', v: ax('Criativos') },
    { k: 'Atribuição', v: clamp((track + ax('Eficiência')) / 2) },
  ]
}

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
