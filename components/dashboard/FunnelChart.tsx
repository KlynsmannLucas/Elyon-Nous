// components/dashboard/FunnelChart.tsx — Funil de conversão
'use client'

import { funnelData as mockFunnelData } from '@/lib/mockData'

interface FunnelStage {
  label: string
  value: number
  pct: number
  color: string
}

interface Props {
  data?: FunnelStage[]
}

export function FunnelChart({ data }: Props) {
  const stages = data && data.length > 0 ? data : mockFunnelData

  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-6 animate-fade-up delay-300">
      <div className="font-display font-bold text-white text-lg mb-1">Funil de Conversão</div>
      <div className="text-xs text-slate-500 mb-6">Impressões → Vendas</div>

      <div className="space-y-4">
        {stages.map((stage, i) => (
          <div key={stage.label}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: stage.color }} />
                <span className="text-sm text-slate-300">{stage.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">
                  {stage.value.toLocaleString('pt-BR')}
                </span>
                <span className="text-xs font-bold" style={{ color: stage.color }}>
                  {stage.pct}%
                </span>
              </div>
            </div>

            <div className="h-2 bg-[#1E1E24] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${stage.pct}%`, background: stage.color }}
              />
            </div>

            {i < stages.length - 1 && stage.value > 0 && (
              <div className="text-[10px] text-slate-600 mt-1 text-right">
                → {((stages[i + 1].value / stage.value) * 100).toFixed(1)}% avançam
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
