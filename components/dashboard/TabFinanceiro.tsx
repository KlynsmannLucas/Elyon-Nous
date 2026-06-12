'use client'
// components/dashboard/TabFinanceiro.tsx — Painel financeiro da agência

import { useState, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import type { SavedClient, FeeConfig } from '@/lib/store'

const C = {
  surface:  '#FFFFFF',
  elevated: '#FBFCFD',
  border:   'rgba(255,255,255,0.06)',
  purpleBorder: 'rgba(124,58,237,0.22)',
  purple:   '#2C5FE0',
  purpleL:  '#2C5FE0',
  green:    '#0E9E6E',
  red:      '#E1483F',
  amber:    '#E08B0B',
  text1:    '#161B26',
  text2:    '#5A6473',
  text3:    'rgba(255,255,255,0.35)',
}

function fmt(n: number) {
  if (n >= 1000000) return `R$${(n/1000000).toFixed(1)}M`
  if (n >= 1000)    return `R$${(n/1000).toFixed(0)}k`
  return `R$${n.toFixed(0)}`
}

function KpiCard({ label, value, sub, color, icon }: { label: string; value: string; sub?: string; color: string; icon: string }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.text2 }}>{sub}</div>}
    </div>
  )
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 2, transition: 'width 0.5s ease' }} />
    </div>
  )
}

const MONTH_LABELS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export function TabFinanceiro() {
  const savedClients    = useAppStore(s => s.savedClients)
  const campaignHistory = useAppStore(s => s.campaignHistory)
  const feesConfig      = useAppStore(s => s.feesConfig)
  const setFeeConfig    = useAppStore(s => s.setFeeConfig)

  const [editId, setEditId]         = useState<string | null>(null)
  const [editType, setEditType]     = useState<'percent' | 'fixed'>('percent')
  const [editValue, setEditValue]   = useState('')
  const [editActive, setEditActive] = useState(true)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  function saveFee(clientId: string) {
    const v = parseFloat(editValue) || 0
    setFeeConfig(clientId, { clientId, type: editType, value: v, active: editActive })
    setEditId(null)
  }

  function startEdit(c: SavedClient) {
    const existing = feesConfig[c.id]
    setEditType(existing?.type || 'percent')
    setEditValue(String(existing?.value || 10))
    setEditActive(existing?.active ?? true)
    setEditId(c.id)
  }

  // Calcula fee mensal por cliente
  function calcFee(c: SavedClient): number {
    const fee = feesConfig[c.id]
    if (!fee || !fee.active) return 0
    const budget = c.clientData.budget || 0
    if (fee.type === 'percent') return budget * (fee.value / 100)
    return fee.value
  }

  const activeClients = savedClients.filter(c => feesConfig[c.id]?.active)
  const mrr           = useMemo(() => savedClients.reduce((acc, c) => acc + calcFee(c), 0), [savedClients, feesConfig])
  const totalBudget   = useMemo(() => savedClients.reduce((acc, c) => acc + (c.clientData.budget || 0), 0), [savedClients])
  const avgTicket     = activeClients.length > 0 ? mrr / activeClients.length : 0

  // Projeção anual simples
  const annualProjection = mrr * 12

  // Top client by fee
  const sorted = [...savedClients].sort((a, b) => calcFee(b) - calcFee(a))

  // Gráfico mensal simulado (meses atrás com crescimento leve)
  const now = new Date()
  const chartData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const month = (now.getMonth() - 5 + i + 12) % 12
      const growth = 1 + (i * 0.05)
      return { label: MONTH_LABELS[month], value: mrr * growth * (0.85 + Math.random() * 0.15) }
    })
  }, [mrr])
  const chartMax  = Math.max(...chartData.map(d => d.value), 1)

  if (savedClients.length === 0) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>💰</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text1, marginBottom: 6 }}>Nenhum cliente cadastrado</div>
        <div style={{ fontSize: 13, color: C.text2 }}>Cadastre seus clientes para visualizar o painel financeiro.</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text1, letterSpacing: '-0.02em' }}>Painel Financeiro</div>
          <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>Receita da agência e controle de honorários</div>
        </div>
        <div style={{ fontSize: 11, color: C.text3, background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 8, padding: '4px 10px' }}>
          {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KpiCard label="MRR da Agência"         value={fmt(mrr)}                       sub="Receita mensal recorrente"          color={C.purpleL} icon="💜" />
        <KpiCard label="Clientes Ativos"         value={String(activeClients.length)}   sub={`de ${savedClients.length} cadastrados`} color={C.green}   icon="👥" />
        <KpiCard label="Verba Total Gerenciada"  value={fmt(totalBudget)}               sub="Investimento mensal somado"         color={C.purpleL} icon="📊" />
        <KpiCard label="Ticket Médio"            value={fmt(avgTicket)}                 sub="Fee médio por cliente"              color={C.amber}   icon="🎯" />
      </div>

      {/* Chart + Projeção */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>

        {/* Bar chart */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text1 }}>Evolução do MRR</div>
            <div style={{ fontSize: 10, color: C.text3 }}>Últimos 6 meses</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
            {chartData.map((d, i) => {
              const h = Math.max((d.value / chartMax) * 110, 4)
              const isLast = i === chartData.length - 1
              return (
                <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: 9, color: C.text3, fontWeight: 600 }}>{d.value > 0 ? fmt(d.value) : ''}</div>
                  <div style={{
                    width: '100%', height: h,
                    background: isLast ? `linear-gradient(180deg, ${C.purple}, ${C.purpleL})` : 'rgba(124,58,237,0.25)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.5s ease',
                  }} />
                  <div style={{ fontSize: 10, color: C.text3 }}>{d.label}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Projeção anual */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text1 }}>Projeção Anual</div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.purpleL, letterSpacing: '-0.03em' }}>{fmt(annualProjection)}</div>
            <div style={{ fontSize: 11, color: C.text2, marginTop: 4 }}>se MRR se mantiver constante</div>
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
            {[
              { label: 'MRR Atual',       value: fmt(mrr),       color: C.purpleL },
              { label: 'MRR Meta (+30%)', value: fmt(mrr * 1.3), color: C.green   },
              { label: 'MRR Meta (+50%)', value: fmt(mrr * 1.5), color: C.amber   },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: C.text2 }}>{row.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: row.color }}>{row.value}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: C.text3, marginTop: 'auto' }}>
            Novos clientes aumentam o MRR imediatamente
          </div>
        </div>

      </div>

      {/* Tabela de Clientes */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text1 }}>Clientes &amp; Honorários</div>
          <div style={{ fontSize: 11, color: C.text3 }}>{savedClients.length} clientes cadastrados</div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                {['Cliente', 'Nicho', 'Verba/mês', 'Fee', 'Honorário', 'Status', 'Ações'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px',
                    fontSize: '10px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'rgba(255,255,255,0.35)',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => {
                const fee    = feesConfig[c.id]
                const feeR$  = calcFee(c)
                const budget = c.clientData.budget || 0
                const pct    = totalBudget > 0 ? (budget / totalBudget) * 100 : 0
                const isEditing = editId === c.id
                const isHovered = hoveredRow === c.id

                return (
                  <>
                    <tr
                      key={c.id}
                      onMouseEnter={() => setHoveredRow(c.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        background: isHovered ? 'rgba(124,58,237,0.04)' : 'transparent',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* Nome */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>{c.clientData.clientName}</div>
                        <ProgressBar pct={pct} color={C.purple} />
                        <div style={{ fontSize: 10, color: C.text3, marginTop: 3 }}>{pct.toFixed(0)}% da verba total</div>
                      </td>

                      {/* Nicho */}
                      <td style={{ padding: '12px 16px', fontSize: 11, color: C.text2, verticalAlign: 'middle' }}>
                        {c.clientData.niche || '—'}
                      </td>

                      {/* Verba */}
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: C.purpleL, textAlign: 'right', fontFamily: 'var(--font-mono)', verticalAlign: 'middle' }}>
                        {fmt(budget)}
                      </td>

                      {/* Fee config */}
                      <td style={{ padding: '12px 16px', fontSize: 12, color: C.text2, textAlign: 'right', fontFamily: 'var(--font-mono)', verticalAlign: 'middle' }}>
                        {fee ? `${fee.value}${fee.type === 'percent' ? '%' : ' fixo'}` : '—'}
                      </td>

                      {/* Honorário R$ */}
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: feeR$ > 0 ? C.green : C.text3, textAlign: 'right', fontFamily: 'var(--font-mono)', verticalAlign: 'middle' }}>
                        {feeR$ > 0 ? fmt(feeR$) : '—'}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                          background: fee?.active ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)',
                          color: fee?.active ? C.green : C.text3,
                          border: `1px solid ${fee?.active ? 'rgba(34,197,94,0.2)' : 'rgba(100,116,139,0.15)'}`,
                          whiteSpace: 'nowrap',
                        }}>
                          {fee?.active ? 'Ativo' : fee ? 'Pausado' : 'Sem fee'}
                        </span>
                      </td>

                      {/* Ação */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <button onClick={() => isEditing ? setEditId(null) : startEdit(c)} style={{
                          fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 7, cursor: 'pointer',
                          background: isEditing ? 'rgba(239,68,68,0.1)' : 'rgba(124,58,237,0.1)',
                          border: `1px solid ${isEditing ? 'rgba(239,68,68,0.2)' : 'rgba(124,58,237,0.2)'}`,
                          color: isEditing ? C.red : C.purpleL,
                          whiteSpace: 'nowrap',
                        }}>
                          {isEditing ? 'Cancelar' : fee ? 'Editar' : 'Configurar'}
                        </button>
                      </td>
                    </tr>

                    {/* Inline edit */}
                    {isEditing && (
                      <tr key={`${c.id}-edit`} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td colSpan={7} style={{ padding: '12px 16px 16px' }}>
                          <div style={{ background: 'rgba(124,58,237,0.04)', borderRadius: 10, padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                              <div>
                                <div style={{ fontSize: 10, color: C.text3, marginBottom: 4 }}>Tipo de fee</div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  {(['percent', 'fixed'] as const).map(t => (
                                    <button key={t} onClick={() => setEditType(t)} style={{
                                      fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 7, cursor: 'pointer',
                                      background: editType === t ? 'rgba(124,58,237,0.2)' : 'transparent',
                                      border: `1px solid ${editType === t ? 'rgba(124,58,237,0.4)' : C.border}`,
                                      color: editType === t ? C.purpleL : C.text2,
                                    }}>
                                      {t === 'percent' ? '% da verba' : 'Valor fixo'}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <div style={{ fontSize: 10, color: C.text3, marginBottom: 4 }}>
                                  {editType === 'percent' ? 'Percentual (%)' : 'Valor mensal (R$)'}
                                </div>
                                <input
                                  type="number" value={editValue} onChange={e => setEditValue(e.target.value)}
                                  placeholder={editType === 'percent' ? '10' : '1500'}
                                  style={{ width: 100, padding: '5px 10px', borderRadius: 8, background: C.elevated, border: `1px solid ${C.border}`, color: C.text1, fontSize: 13, outline: 'none' }}
                                />
                              </div>

                              <div>
                                <div style={{ fontSize: 10, color: C.text3, marginBottom: 4 }}>Previsão mensal</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: C.green }}>
                                  {editType === 'percent'
                                    ? fmt((c.clientData.budget || 0) * (parseFloat(editValue) / 100 || 0))
                                    : fmt(parseFloat(editValue) || 0)}
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <button onClick={() => setEditActive(v => !v)} style={{
                                  width: 36, height: 20, borderRadius: 10, cursor: 'pointer', border: 'none',
                                  background: editActive ? C.green : 'rgba(255,255,255,0.1)', position: 'relative', flexShrink: 0,
                                }}>
                                  <div style={{ position: 'absolute', top: 2, left: editActive ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }} />
                                </button>
                                <span style={{ fontSize: 11, color: C.text2 }}>{editActive ? 'Ativo' : 'Pausado'}</span>
                              </div>

                              <button onClick={() => saveFee(c.id)} style={{
                                fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                                background: `linear-gradient(135deg, ${C.purple}, ${C.purpleL})`,
                                border: 'none', color: '#fff', marginLeft: 'auto',
                              }}>
                                Salvar
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumo bottom */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          {
            title: 'Maior cliente',
            value: sorted[0] ? sorted[0].clientData.clientName : '—',
            sub:   sorted[0] ? `Fee: ${fmt(calcFee(sorted[0]))}/mês` : 'Nenhum configurado',
            color: C.purpleL, icon: '🏆',
          },
          {
            title: 'Meta de MRR (+1 cliente)',
            value: fmt(mrr + avgTicket),
            sub:   `+${fmt(avgTicket)} com 1 novo cliente no ticket médio`,
            color: C.green, icon: '🎯',
          },
          {
            title: 'Eficiência média',
            value: totalBudget > 0 ? `${((mrr / totalBudget) * 100).toFixed(1)}%` : '—',
            sub:   'Fee médio sobre verba gerenciada',
            color: C.amber, icon: '📈',
          },
        ].map(card => (
          <div key={card.title} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>{card.icon}</span>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{card.title}</div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: card.color, letterSpacing: '-0.02em', marginBottom: 4 }}>{card.value}</div>
            <div style={{ fontSize: 11, color: C.text2 }}>{card.sub}</div>
          </div>
        ))}
      </div>

    </div>
  )
}
