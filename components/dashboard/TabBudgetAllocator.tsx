// components/dashboard/TabBudgetAllocator.tsx — Budget Allocator Agent (AGENT.md)
'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import type { BudgetAllocation, CampaignAllocation } from '@/app/api/budget-allocator/route'

const ACTION_CONFIG = {
  scale:    { color: '#22C55E', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)',   icon: '↑', label: 'Escalar' },
  maintain: { color: '#38BDF8', bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.2)',  icon: '→', label: 'Manter' },
  reduce:   { color: '#F0B429', bg: 'rgba(240,180,41,0.08)',  border: 'rgba(240,180,41,0.2)',  icon: '↓', label: 'Reduzir' },
  pause:    { color: '#FF4D4D', bg: 'rgba(255,77,77,0.08)',   border: 'rgba(255,77,77,0.2)',   icon: '⏸', label: 'Pausar' },
  test:     { color: '#A78BFA', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)', icon: '🧪', label: 'Testar' },
}

function EfficiencyBar({ value }: { value: number }) {
  const color = value >= 75 ? '#22C55E' : value >= 55 ? '#38BDF8' : value >= 35 ? '#F0B429' : '#FF4D4D'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        flex: 1, height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden',
      }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: '11px', fontWeight: 700, color, minWidth: '28px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
        {value}
      </span>
    </div>
  )
}

function BudgetChangeChip({ change, pct }: { change: number; pct: number }) {
  if (Math.abs(change) < 0.5) return <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>—</span>
  const isPos = change > 0
  return (
    <span style={{
      fontSize: '10px', fontWeight: 700,
      color: isPos ? '#22C55E' : '#FF4D4D',
      background: isPos ? 'rgba(34,197,94,0.08)' : 'rgba(255,77,77,0.08)',
      border: `1px solid ${isPos ? 'rgba(34,197,94,0.2)' : 'rgba(255,77,77,0.2)'}`,
      borderRadius: '4px', padding: '2px 6px',
    }}>
      {isPos ? '+' : ''}R${Math.abs(change).toFixed(0)} ({isPos ? '+' : ''}{pct.toFixed(0)}%)
    </span>
  )
}

interface ManualCampaign {
  id: string
  name: string
  platform: 'meta' | 'google'
  spend: number
  leads: number
  cpl: number
  ctr: number
  roas: number
  dailyBudget: number
  status: string
}

export function TabBudgetAllocator() {
  const [allocation, setAllocation] = useState<BudgetAllocation | null>(null)
  const [loading, setLoading] = useState(false)
  const [source, setSource] = useState<'ai' | 'fallback' | null>(null)
  const [totalBudget, setTotalBudget] = useState('')
  const [manualCampaigns, setManualCampaigns] = useState<ManualCampaign[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCamp, setNewCamp] = useState<Partial<ManualCampaign>>({
    platform: 'meta', status: 'ACTIVE',
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<'table' | 'visual'>('table')

  const clientData = useAppStore(s => s.clientData)
  const auditCache = useAppStore(s => s.auditCache)

  // Pré-preenche budget do cliente
  useEffect(() => {
    if (clientData?.budget && !totalBudget) {
      setTotalBudget(String(clientData.budget))
    }
  }, [clientData])

  // Tenta extrair campanhas da auditoria
  const auditCampaigns = clientData?.clientName
    ? (() => {
        const audit = auditCache[clientData.clientName]?.[0]?.audit
        // Retorna vazio — campanhas individuais não ficam no cache de auditoria
        return []
      })()
    : []

  const allCampaigns = manualCampaigns.length > 0 ? manualCampaigns : auditCampaigns

  async function runAllocator() {
    if (!clientData || allCampaigns.length === 0) return
    const budget = Number(totalBudget)
    if (!budget || budget <= 0) return

    setLoading(true)
    setAllocation(null)
    try {
      const res = await fetch('/api/budget-allocator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaigns: allCampaigns,
          totalBudget: budget,
          niche: clientData.niche,
          clientData,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setAllocation(data.allocation)
      setSource(data.source)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  function addCampaign() {
    if (!newCamp.name) return
    const camp: ManualCampaign = {
      id: String(Date.now()),
      name: newCamp.name || '',
      platform: newCamp.platform || 'meta',
      spend: Number(newCamp.spend || 0),
      leads: Number(newCamp.leads || 0),
      cpl: Number(newCamp.cpl || 0) || (newCamp.leads && newCamp.spend ? Number(newCamp.spend) / Number(newCamp.leads) : 0),
      ctr: Number(newCamp.ctr || 0),
      roas: Number(newCamp.roas || 0),
      dailyBudget: Number(newCamp.dailyBudget || 0),
      status: newCamp.status || 'ACTIVE',
    }
    if (editingId) {
      setManualCampaigns(prev => prev.map(c => c.id === editingId ? { ...camp, id: editingId } : c))
      setEditingId(null)
    } else {
      setManualCampaigns(prev => [...prev, camp])
    }
    setNewCamp({ platform: 'meta', status: 'ACTIVE' })
    setShowAddForm(false)
  }

  function removeCampaign(id: string) {
    setManualCampaigns(prev => prev.filter(c => c.id !== id))
    if (allocation) setAllocation(null)
  }

  function editCampaign(c: ManualCampaign) {
    setNewCamp(c)
    setEditingId(c.id)
    setShowAddForm(true)
  }

  const hasCampaigns = allCampaigns.length > 0
  const canRun = hasCampaigns && Number(totalBudget) > 0 && !loading

  return (
    <div style={{ padding: '24px', maxWidth: '960px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '20px' }}>💰</span>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Budget Allocator</h2>
            <span style={{
              fontSize: '9px', fontFamily: 'var(--font-mono)', color: '#F0B429',
              background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.2)',
              borderRadius: '4px', padding: '2px 6px', letterSpacing: '0.06em',
            }}>IA</span>
          </div>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0, maxWidth: '520px' }}>
            Distribui o orçamento entre campanhas com base na eficiência real — escala o que funciona, pausa o que desperdiça.
          </p>
        </div>
        <button
          onClick={runAllocator}
          disabled={!canRun}
          style={{
            padding: '9px 20px', borderRadius: '9px', flexShrink: 0,
            background: canRun ? 'rgba(240,180,41,0.12)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${canRun ? 'rgba(240,180,41,0.3)' : 'rgba(255,255,255,0.06)'}`,
            color: canRun ? '#F0B429' : 'rgba(255,255,255,0.2)',
            fontSize: '13px', fontWeight: 600, cursor: canRun ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
          }}
        >
          {loading ? '⏳ Calculando...' : allocation ? '↻ Recalcular' : '💰 Calcular alocação'}
        </button>
      </div>

      {/* Config row */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'end',
        background: '#111114', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
        padding: '16px 20px', marginBottom: '16px',
      }}>
        <div>
          <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>
            Orçamento mensal total (R$)
          </label>
          <input
            type="number"
            value={totalBudget}
            onChange={e => setTotalBudget(e.target.value)}
            placeholder={clientData?.budget ? `${clientData.budget}` : 'Ex: 5000'}
            style={{
              width: '200px', padding: '8px 12px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', fontSize: '14px', fontWeight: 600, outline: 'none',
            }}
          />
          {totalBudget && (
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginLeft: '10px' }}>
              = R${(Number(totalBudget) / 30).toFixed(2)}/dia
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => { setShowAddForm(v => !v); setEditingId(null); setNewCamp({ platform: 'meta', status: 'ACTIVE' }) }}
            style={{
              padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
              background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
            }}
          >
            + Adicionar campanha
          </button>
        </div>
      </div>

      {/* Add campaign form */}
      {showAddForm && (
        <div style={{
          background: '#111114', border: '1px solid rgba(240,180,41,0.2)', borderRadius: '12px',
          padding: '16px 20px', marginBottom: '16px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#F0B429', marginBottom: '14px' }}>
            {editingId ? '✏️ Editar campanha' : '+ Nova campanha'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginBottom: '12px' }}>
            {[
              { key: 'name', label: 'Nome da campanha', type: 'text', full: true },
              { key: 'platform', label: 'Plataforma', type: 'select', options: ['meta', 'google'] },
              { key: 'spend', label: 'Gasto total (R$)', type: 'number' },
              { key: 'leads', label: 'Leads gerados', type: 'number' },
              { key: 'cpl', label: 'CPL (R$)', type: 'number' },
              { key: 'ctr', label: 'CTR (%)', type: 'number' },
              { key: 'roas', label: 'ROAS (×)', type: 'number' },
              { key: 'dailyBudget', label: 'Budget diário atual (R$)', type: 'number' },
            ].map(f => (
              <div key={f.key} style={f.full ? { gridColumn: '1 / -1' } : {}}>
                <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>
                  {f.label}
                </label>
                {f.type === 'select' ? (
                  <select
                    value={(newCamp as any)[f.key] || ''}
                    onChange={e => setNewCamp(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{
                      width: '100%', padding: '7px 10px', borderRadius: '7px',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                      color: '#fff', fontSize: '12px', outline: 'none',
                    }}
                  >
                    {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    type={f.type}
                    value={(newCamp as any)[f.key] || ''}
                    onChange={e => setNewCamp(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{
                      width: '100%', padding: '7px 10px', borderRadius: '7px',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                      color: '#fff', fontSize: '12px', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={addCampaign}
              disabled={!newCamp.name}
              style={{
                padding: '7px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
                background: 'rgba(240,180,41,0.12)', border: '1px solid rgba(240,180,41,0.3)',
                color: '#F0B429', cursor: newCamp.name ? 'pointer' : 'not-allowed',
              }}
            >
              {editingId ? 'Salvar' : 'Adicionar'}
            </button>
            <button
              onClick={() => { setShowAddForm(false); setEditingId(null) }}
              style={{
                padding: '7px 14px', borderRadius: '7px', fontSize: '12px',
                background: 'transparent', border: '1px solid rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Manual campaigns list (before analysis) */}
      {manualCampaigns.length > 0 && !allocation && (
        <div style={{
          background: '#111114', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
          padding: '16px 20px', marginBottom: '16px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: '10px' }}>
            {manualCampaigns.length} campanha{manualCampaigns.length > 1 ? 's' : ''} adicionada{manualCampaigns.length > 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {manualCampaigns.map(c => (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px',
                background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)',
              }}>
                <span style={{ fontSize: '12px' }}>{c.platform === 'meta' ? '📘' : '🔵'}</span>
                <span style={{ flex: 1, fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{c.name}</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>
                  R${c.spend} gasto · {c.leads} leads · CPL R${c.cpl || (c.leads > 0 ? (c.spend / c.leads).toFixed(0) : '?')}
                </span>
                <button onClick={() => editCampaign(c)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '12px' }}>✏️</button>
                <button onClick={() => removeCampaign(c.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,77,77,0.5)', cursor: 'pointer', fontSize: '12px' }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasCampaigns && !loading && !allocation && (
        <div style={{
          padding: '40px 24px', textAlign: 'center',
          background: '#111114', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>💰</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>
            Adicione suas campanhas para calcular a alocação ideal
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', maxWidth: '360px', margin: '0 auto 16px' }}>
            Insira dados de cada campanha (gasto, leads, CPL) e o Budget Allocator vai distribuir o orçamento para maximizar resultados.
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              padding: '9px 20px', borderRadius: '9px', fontSize: '13px', fontWeight: 600,
              background: 'rgba(240,180,41,0.10)', border: '1px solid rgba(240,180,41,0.25)',
              color: '#F0B429', cursor: 'pointer',
            }}
          >
            + Adicionar primeira campanha
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{
          padding: '40px 24px', textAlign: 'center',
          background: '#111114', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>💰</div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Calculando alocação ideal...</div>
        </div>
      )}

      {/* Results */}
      {allocation && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Strategy banner */}
          <div style={{
            padding: '14px 18px',
            background: 'rgba(240,180,41,0.05)', border: '1px solid rgba(240,180,41,0.15)', borderRadius: '12px',
            display: 'flex', gap: '12px', alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>💡</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#F0B429', marginBottom: '4px' }}>
                Estratégia recomendada
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.5' }}>{allocation.strategy}</div>
              {allocation.topInsight && (
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>
                  → {allocation.topInsight}
                </div>
              )}
              {source === 'ai' && (
                <div style={{ fontSize: '10px', color: '#22C55E', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                  ✓ Análise com Claude AI
                </div>
              )}
            </div>
          </div>

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {[
              {
                label: 'Leads/mês atual',
                value: allocation.summary.currentLeadsPerMonth,
                sub: `CPL R$${allocation.summary.currentAvgCPL}`,
                color: 'rgba(255,255,255,0.5)',
              },
              {
                label: 'Leads/mês projetado',
                value: allocation.summary.projectedLeadsPerMonth,
                sub: `CPL R$${allocation.summary.projectedAvgCPL}`,
                color: '#22C55E',
                highlight: allocation.summary.leadsGain > 0,
              },
              {
                label: 'Ganho de leads',
                value: `+${allocation.summary.leadsGain}`,
                sub: `+${allocation.summary.leadsGainPct.toFixed(1)}%`,
                color: allocation.summary.leadsGain > 0 ? '#22C55E' : '#64748B',
              },
              {
                label: 'Redução de CPL',
                value: allocation.summary.cplReduction > 0
                  ? `-R$${allocation.summary.cplReduction}`
                  : '—',
                sub: allocation.summary.cplReductionPct > 0
                  ? `-${allocation.summary.cplReductionPct.toFixed(1)}%`
                  : '',
                color: allocation.summary.cplReduction > 0 ? '#22C55E' : '#64748B',
              },
            ].map((card, i) => (
              <div key={i} style={{
                padding: '14px 16px',
                background: card.highlight ? 'rgba(34,197,94,0.06)' : '#111114',
                border: `1px solid ${card.highlight ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '10px',
              }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginBottom: '6px' }}>{card.label}</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '3px' }}>{card.sub}</div>
              </div>
            ))}
          </div>

          {/* Action summary pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {allocation.summary.campaignsToScale > 0 && (
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22C55E' }}>
                ↑ {allocation.summary.campaignsToScale} para escalar
              </span>
            )}
            {allocation.summary.campaignsToMaintain > 0 && (
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', color: '#38BDF8' }}>
                → {allocation.summary.campaignsToMaintain} para manter
              </span>
            )}
            {allocation.summary.campaignsToPause > 0 && (
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)', color: '#FF4D4D' }}>
                ⏸ {allocation.summary.campaignsToPause} para pausar
              </span>
            )}
          </div>

          {/* Campaign table */}
          <div style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 80px 90px 90px 90px 90px 110px',
              gap: '0', padding: '10px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
            }}>
              {['Campanha', 'Eficiência', 'CPL atual', 'Budget atual', 'Budget proposto', 'Variação', 'Ação'].map(h => (
                <div key={h} style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>{h}</div>
              ))}
            </div>

            {/* Rows */}
            {allocation.allocations.map((camp, i) => {
              const cfg = ACTION_CONFIG[camp.action]
              return (
                <div key={camp.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 80px 90px 90px 90px 90px 110px',
                  gap: '0', padding: '12px 16px', alignItems: 'center',
                  borderBottom: i < allocation.allocations.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  transition: 'background 0.1s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Name */}
                  <div style={{ minWidth: 0, paddingRight: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {camp.platform === 'meta' ? '📘' : '🔵'} {camp.name}
                    </div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                      {camp.currentLeads} leads · {camp.currentCTR > 0 ? `CTR ${camp.currentCTR.toFixed(1)}%` : ''}
                    </div>
                  </div>

                  {/* Efficiency */}
                  <div><EfficiencyBar value={camp.efficiency} /></div>

                  {/* CPL atual */}
                  <div style={{ fontSize: '12px', fontWeight: 600, color: camp.currentCPL > 0 ? '#fff' : 'rgba(255,255,255,0.25)' }}>
                    {camp.currentCPL > 0 ? `R$${camp.currentCPL}` : '—'}
                    {camp.projectedCPL > 0 && camp.projectedCPL !== camp.currentCPL && (
                      <div style={{ fontSize: '10px', color: camp.projectedCPL < camp.currentCPL ? '#22C55E' : '#FF4D4D', marginTop: '1px' }}>
                        → R${camp.projectedCPL}
                      </div>
                    )}
                  </div>

                  {/* Budget atual */}
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                    {camp.currentBudget > 0 ? `R$${camp.currentBudget.toFixed(0)}/dia` : '—'}
                  </div>

                  {/* Budget proposto */}
                  <div style={{ fontSize: '12px', fontWeight: 700, color: camp.action === 'pause' ? '#FF4D4D' : '#fff' }}>
                    {camp.action === 'pause' ? 'R$0' : `R$${camp.proposedBudget.toFixed(0)}/dia`}
                  </div>

                  {/* Variação */}
                  <div>
                    <BudgetChangeChip change={camp.budgetChange} pct={camp.budgetChangePct} />
                  </div>

                  {/* Ação */}
                  <div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      fontSize: '11px', fontWeight: 700,
                      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
                      borderRadius: '5px', padding: '3px 8px',
                    }}>
                      <span>{cfg.icon}</span> {cfg.label}
                    </div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '3px', lineHeight: '1.3' }}>
                      {camp.actionReason}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* How to apply */}
          <div style={{
            padding: '14px 18px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
              Como aplicar
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {[
                'Acesse o Gerenciador de Anúncios do Meta ou Google Ads',
                'Para cada campanha marcada "Escalar": aumente o orçamento diário para o valor proposto',
                'Para "Reduzir": reduza o orçamento gradualmente (20–30% por vez)',
                'Para "Pausar": pause a campanha e crie nova com ajustes de segmentação e criativo',
                'Aguarde 3–7 dias e monitore os resultados antes de novos ajustes',
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '11px', color: '#F0B429', flexShrink: 0, fontFamily: 'var(--font-mono)', minWidth: '16px' }}>{i + 1}.</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
