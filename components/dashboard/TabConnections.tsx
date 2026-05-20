// components/dashboard/TabConnections.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import type { AdsCampaign } from '@/lib/store'

// ── Design tokens ──────────────────────────────────────────────────────────────
const T = {
  bg:       '#080D1A',
  surface:  '#0F1629',
  elevated: '#131E35',
  border:   'rgba(255,255,255,0.06)',
  purple:   '#7C3AED',
  purpleL:  '#A78BFA',
  purpleD:  'rgba(124,58,237,0.10)',
  purpleB:  'rgba(124,58,237,0.22)',
  green:    '#22C55E',
  red:      '#EF4444',
  amber:    '#F59E0B',
  blue:     '#38BDF8',
  text1:    '#F1F5F9',
  text2:    '#94A3B8',
  text3:    '#64748B',
}

// ── Format helpers ─────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1_000_000) return `R$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000)      return `R$${(n / 1000).toFixed(1)}k`
  return `R$${n.toFixed(0)}`
}
function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000)      return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface Totals {
  spend: number; impressions: number; clicks: number
  leads: number; revenue: number; cpl: number; roas: number; ctr: number
}
type SortKey = 'name' | 'spend' | 'leads' | 'cpl' | 'ctr' | 'impressions' | 'roas'
type SortDir = 'asc' | 'desc'

// ── SVG platform icons ─────────────────────────────────────────────────────────
function MetaIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" fill="rgba(24,119,242,0.15)" stroke="rgba(24,119,242,0.4)" strokeWidth="1"/>
      <text x="12" y="16" textAnchor="middle" fill="#1877F2" fontSize="11" fontWeight="800" fontFamily="Georgia, serif">f</text>
    </svg>
  )
}

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" fill="rgba(234,67,53,0.12)" stroke="rgba(234,67,53,0.3)" strokeWidth="1"/>
      <path d="M16.5 12.2h-4.5v1.6h2.7c-.25 1.2-1.3 2-2.7 2-1.65 0-3-1.35-3-3s1.35-3 3-3c.7 0 1.35.26 1.84.68l1.18-1.18A4.7 4.7 0 0 0 12 8c-2.65 0-4.8 2.15-4.8 4.8s2.15 4.8 4.8 4.8c2.76 0 4.6-1.94 4.6-4.67 0-.3-.03-.6-.1-.73z" fill="#EA4335"/>
    </svg>
  )
}

// ── StatusDot ──────────────────────────────────────────────────────────────────
function StatusDot({ status }: { status: string }) {
  const active = status === 'ACTIVE' || status === 'ENABLED'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{
        width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
        background: active ? T.green : T.text3,
        boxShadow: active ? `0 0 5px ${T.green}80` : 'none',
      }} />
      <span style={{ fontSize: '11px', color: active ? T.green : T.text3 }}>
        {active ? 'Ativo' : 'Pausado'}
      </span>
    </div>
  )
}

// ── Sort header ────────────────────────────────────────────────────────────────
function SortTh({ label, sortKey, current, dir, onSort }: {
  label: string; sortKey: SortKey; current: SortKey; dir: SortDir
  onSort: (k: SortKey) => void
}) {
  const active = current === sortKey
  return (
    <th onClick={() => onSort(sortKey)} style={{
      padding: '12px 16px', textAlign: 'right',
      fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
      color: active ? T.purpleL : T.text3, cursor: 'pointer', userSelect: 'none',
      whiteSpace: 'nowrap', transition: 'color 0.15s',
    }}>
      {label} <span style={{ opacity: 0.6 }}>{active ? (dir === 'desc' ? '↓' : '↑') : '↕'}</span>
    </th>
  )
}

// ── Campaign table ─────────────────────────────────────────────────────────────
function CampaignTable({ title, platformIcon, color, campaigns, totals }: {
  title: string
  platformIcon: React.ReactNode
  color: string
  campaigns: AdsCampaign[]
  totals: Totals | null
}) {
  const [search,     setSearch]     = useState('')
  const [statusFilt, setStatusFilt] = useState<'all' | 'active' | 'paused'>('all')
  const [sortKey,    setSortKey]    = useState<SortKey>('spend')
  const [sortDir,    setSortDir]    = useState<SortDir>('desc')
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const handleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(k); setSortDir('desc') }
  }

  const filtered = useMemo(() => {
    let list = [...campaigns]
    if (statusFilt === 'active') list = list.filter(c => c.status === 'ACTIVE' || c.status === 'ENABLED')
    if (statusFilt === 'paused') list = list.filter(c => c.status !== 'ACTIVE' && c.status !== 'ENABLED')
    if (search.trim()) list = list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    list.sort((a, b) => {
      const av = sortKey === 'name' ? a.name : (a as any)[sortKey] ?? 0
      const bv = sortKey === 'name' ? b.name : (b as any)[sortKey] ?? 0
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      return sortDir === 'asc' ? av - bv : bv - av
    })
    return list
  }, [campaigns, statusFilt, search, sortKey, sortDir])

  const activeCount = campaigns.filter(c => c.status === 'ACTIVE' || c.status === 'ENABLED').length
  const pausedCount = campaigns.length - activeCount
  const hasRoas     = campaigns.some(c => c.roas > 0)

  const FILTERS: { key: typeof statusFilt; label: string }[] = [
    { key: 'all',    label: `Todos (${campaigns.length})` },
    { key: 'active', label: `Ativos (${activeCount})` },
    { key: 'paused', label: `Pausados (${pausedCount})` },
  ]

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '16px', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {platformIcon}
            <span style={{ fontSize: '14px', fontWeight: 700, color: T.text1 }}>{title}</span>
            <span style={{ fontSize: '11px', color: T.text3 }}>· {campaigns.length} campanhas · 30 dias</span>
          </div>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Pesquisar campanha..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                fontSize: '11px', background: T.elevated, border: `1px solid ${T.border}`,
                borderRadius: '8px', padding: '6px 28px 6px 10px', color: T.text1,
                outline: 'none', width: '200px', transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = T.purpleB)}
              onBlur={e => (e.target.style.borderColor = T.border)}
            />
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.text3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
        </div>
        {/* Status tabs */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setStatusFilt(f.key)} style={{
              fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px',
              border: `1px solid ${statusFilt === f.key ? color : T.border}`,
              background: statusFilt === f.key ? `${color}18` : 'transparent',
              color: statusFilt === f.key ? color : T.text3,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI totals bar */}
      {totals && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${T.border}` }}>
          {[
            { label: 'Investido',  value: fmt(totals.spend),                         color: T.amber },
            { label: 'Impressões', value: fmtNum(totals.impressions),                 color: T.text2 },
            { label: 'Cliques',    value: fmtNum(totals.clicks),                      color: T.text2 },
            { label: 'CTR',        value: `${totals.ctr}%`,                           color: totals.ctr >= 1.5 ? T.green : totals.ctr >= 0.8 ? T.amber : T.red },
            { label: 'Leads',      value: String(totals.leads),                       color: T.blue },
            { label: 'CPL Real',   value: `R$${totals.cpl}`,                          color: T.purpleL },
            { label: 'ROAS',       value: totals.roas > 0 ? `${totals.roas}×` : '—', color: totals.roas >= 3 ? T.green : totals.roas > 0 ? T.amber : T.text3 },
          ].map((k, i) => (
            <div key={k.label} style={{
              padding: '10px 8px', textAlign: 'center',
              borderRight: i < 6 ? `1px solid ${T.border}` : 'none',
            }}>
              <div style={{ fontSize: '9px', color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{k.label}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: k.color, fontFamily: 'var(--font-mono)' }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${T.border}` }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.text3, width: '32px' }}>#</th>
              <th
                onClick={() => handleSort('name')}
                style={{ padding: '12px 16px', textAlign: 'left', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: sortKey === 'name' ? T.purpleL : T.text3, cursor: 'pointer', userSelect: 'none' }}
              >
                Campanha <span style={{ opacity: 0.6 }}>{sortKey === 'name' ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}</span>
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.text3 }}>Status</th>
              <SortTh label="Investido"   sortKey="spend"       current={sortKey} dir={sortDir} onSort={handleSort} />
              <SortTh label="Leads"       sortKey="leads"       current={sortKey} dir={sortDir} onSort={handleSort} />
              <SortTh label="CPL"         sortKey="cpl"         current={sortKey} dir={sortDir} onSort={handleSort} />
              <SortTh label="CTR"         sortKey="ctr"         current={sortKey} dir={sortDir} onSort={handleSort} />
              <SortTh label="Impressões"  sortKey="impressions" current={sortKey} dir={sortDir} onSort={handleSort} />
              {hasRoas && <SortTh label="ROAS" sortKey="roas" current={sortKey} dir={sortDir} onSort={handleSort} />}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={hasRoas ? 9 : 8} style={{ padding: '32px 20px', textAlign: 'center', color: T.text3, fontSize: '13px' }}>
                  {search ? 'Nenhuma campanha encontrada para essa busca.' : 'Nenhuma campanha neste filtro.'}
                </td>
              </tr>
            ) : filtered.map((c, i) => {
              const active   = c.status === 'ACTIVE' || c.status === 'ENABLED'
              const cplColor = c.cpl > 0 ? (c.cpl < 30 ? T.green : c.cpl < 80 ? T.amber : T.red) : T.text3
              const ctrColor = c.ctr >= 1.5 ? T.green : c.ctr >= 0.8 ? T.amber : c.ctr > 0 ? T.red : T.text3
              const isHov    = hoveredRow === c.id
              return (
                <tr key={c.id}
                  onMouseEnter={() => setHoveredRow(c.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    borderBottom: `1px solid ${T.border}`,
                    background: isHov ? 'rgba(124,58,237,0.04)' : 'transparent',
                    transition: 'background 0.12s',
                  }}>
                  <td style={{ padding: '12px 16px', color: T.text3, fontFamily: 'var(--font-mono)', fontSize: '10px' }}>{i + 1}</td>
                  <td style={{ padding: '12px 16px', maxWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '3px', height: '28px', borderRadius: '2px', flexShrink: 0, background: active ? color : T.border }} />
                      <span style={{ fontWeight: 600, color: T.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}><StatusDot status={c.status} /></td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: T.amber }}>{fmt(c.spend)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: T.blue }}>
                    {c.leads > 0 ? c.leads.toLocaleString('pt-BR') : <span style={{ color: T.text3 }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: cplColor }}>
                    {c.cpl > 0 ? `R$${c.cpl}` : <span style={{ color: T.text3 }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: ctrColor }}>
                    {c.ctr > 0 ? `${c.ctr}%` : <span style={{ color: T.text3 }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: T.text3 }}>{fmtNum(c.impressions)}</td>
                  {hasRoas && (
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700,
                      color: c.roas >= 3 ? T.green : c.roas > 0 ? T.amber : T.text3 }}>
                      {c.roas > 0 ? `${c.roas}×` : <span style={{ color: T.text3 }}>—</span>}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
          {totals && filtered.length > 0 && (
            <tfoot>
              <tr style={{ borderTop: `2px solid ${T.border}`, background: 'rgba(255,255,255,0.02)' }}>
                <td style={{ padding: '10px 16px' }} />
                <td style={{ padding: '10px 16px', fontSize: '10px', fontWeight: 600, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}
                  colSpan={2}>
                  Total ({filtered.length} campanhas)
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: T.amber, fontSize: '12px' }}>{fmt(totals.spend)}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: T.blue, fontSize: '12px' }}>{totals.leads.toLocaleString('pt-BR')}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: T.purpleL, fontSize: '12px' }}>R${totals.cpl}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '12px',
                  color: totals.ctr >= 1.5 ? T.green : totals.ctr >= 0.8 ? T.amber : T.red }}>
                  {totals.ctr}%
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: T.text3, fontSize: '12px' }}>{fmtNum(totals.impressions)}</td>
                {hasRoas && (
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '12px',
                    color: totals.roas >= 3 ? T.green : totals.roas > 0 ? T.amber : T.text3 }}>
                    {totals.roas > 0 ? `${totals.roas}×` : '—'}
                  </td>
                )}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}

// ── Platform connection card ───────────────────────────────────────────────────
function ConnectCard({
  platformName, platformDetail, platformIcon, accentColor,
  account, pendingMeta, onConnect, onDisconnect, onRefresh, loading,
  onSelectAccount, onCancelSelect,
}: {
  platformName: string; platformDetail: string
  platformIcon: React.ReactNode; accentColor: string
  account: any; pendingMeta?: any
  onConnect: () => void; onDisconnect: () => void; onRefresh: () => void
  loading: boolean
  onSelectAccount?: (acc: { id: string; name: string }) => void
  onCancelSelect?: () => void
}) {
  const connected = !!account
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '24px' }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
            background: `${accentColor}12`, border: `1px solid ${accentColor}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {platformIcon}
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: T.text1 }}>{platformName}</div>
            <div style={{ fontSize: '11px', color: T.text3, marginTop: '2px' }}>{platformDetail}</div>
          </div>
        </div>
        {connected ? (
          <span style={{
            fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px',
            background: 'rgba(34,197,94,0.1)', color: T.green, border: '1px solid rgba(34,197,94,0.2)',
          }}>
            ✓ Conectado
          </span>
        ) : (
          <span style={{
            fontSize: '10px', padding: '3px 9px', borderRadius: '20px',
            background: 'rgba(255,255,255,0.03)', color: T.text3, border: `1px solid ${T.border}`,
          }}>
            Desconectado
          </span>
        )}
      </div>

      {/* Account selector (Meta multi-account flow) */}
      {!account && pendingMeta && onSelectAccount && onCancelSelect ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '11px', color: T.text2, fontWeight: 600 }}>Selecione a conta de anúncios:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
            {pendingMeta.accounts.map((acc: any) => (
              <button key={acc.id} onClick={() => onSelectAccount(acc)} style={{
                width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '10px',
                background: `${accentColor}10`, border: `1px solid ${accentColor}25`,
                cursor: 'pointer', transition: 'opacity 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                <div style={{ fontSize: '13px', fontWeight: 600, color: T.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.name}</div>
                <div style={{ fontSize: '10px', color: T.text3, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>ID: {acc.id}</div>
              </button>
            ))}
          </div>
          <button onClick={onCancelSelect} style={{
            fontSize: '11px', color: T.text3, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
          }}>
            Cancelar
          </button>
        </div>
      ) : connected ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Account info */}
          <div style={{ background: T.elevated, borderRadius: '10px', padding: '10px 12px', border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: '9px', color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>Conta ativa</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: T.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {account.accountName || account.accountId || 'Conta conectada'}
            </div>
            {account.accountId && (
              <div style={{ fontSize: '10px', color: T.text3, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>ID: {account.accountId}</div>
            )}
          </div>
          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onRefresh} disabled={loading} style={{
              flex: 1, padding: '8px', borderRadius: '10px', fontSize: '12px', fontWeight: 600,
              background: T.purpleD, border: `1px solid ${T.purpleB}`, color: T.purpleL,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, transition: 'all 0.15s',
            }}>
              {loading ? '⏳ Buscando...' : '↻ Atualizar dados'}
            </button>
            <button onClick={onDisconnect} style={{
              padding: '8px 12px', borderRadius: '10px', fontSize: '11px',
              background: 'transparent', border: `1px solid ${T.border}`, color: T.text3,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = T.red; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.color = T.text3; e.currentTarget.style.borderColor = T.border }}
            >
              Desconectar
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '12px', color: T.text3, lineHeight: 1.6, margin: 0 }}>
            Conecte sua conta para ver campanhas, CPL real e ROAS atualizado automaticamente.
          </p>
          {/* Permissions */}
          <div style={{ background: T.elevated, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '10px 12px' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: T.text2, marginBottom: '6px' }}>Permissões solicitadas:</div>
            {platformName === 'Meta Ads' ? (
              <>
                <div style={{ fontSize: '10px', color: T.text3, marginBottom: '3px' }}>→ ads_read (ler campanhas e métricas)</div>
                <div style={{ fontSize: '10px', color: T.text3 }}>→ ads_management (criar e editar campanhas)</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '10px', color: T.text3, marginBottom: '3px' }}>→ adwords (ler campanhas e métricas)</div>
                <div style={{ fontSize: '10px', color: T.text3 }}>→ userinfo.email (identificar a conta)</div>
              </>
            )}
          </div>
          {/* CTA */}
          <button onClick={onConnect} style={{
            width: '100%', padding: '12px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
            background: `linear-gradient(135deg, ${T.purple}, ${T.purpleL})`,
            border: 'none', color: '#fff', cursor: 'pointer',
            boxShadow: `0 4px 14px rgba(124,58,237,0.4)`, transition: 'opacity 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Conectar {platformName}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyConnections({ onConnectMeta, onConnectGoogle }: { onConnectMeta: () => void; onConnectGoogle: () => void }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: '16px',
      padding: '48px 32px', textAlign: 'center',
    }}>
      <div style={{
        width: '64px', height: '64px', borderRadius: '18px', margin: '0 auto 20px',
        background: T.purpleD, border: `1px solid ${T.purpleB}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={T.purpleL} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
      </div>
      <div style={{ fontSize: '16px', fontWeight: 700, color: T.text1, marginBottom: '8px' }}>
        Conecte sua conta de anúncios
      </div>
      <div style={{ fontSize: '13px', color: T.text3, lineHeight: 1.6, maxWidth: '380px', margin: '0 auto 24px' }}>
        Após conectar, seus dados reais de CPL, ROAS, leads e campanhas aparecem automaticamente no dashboard.
      </div>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={onConnectMeta} style={{
          padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
          background: `linear-gradient(135deg, ${T.purple}, ${T.purpleL})`,
          border: 'none', color: '#fff', cursor: 'pointer',
          boxShadow: `0 4px 14px rgba(124,58,237,0.4)`,
        }}>
          Conectar Meta Ads
        </button>
        <button onClick={onConnectGoogle} style={{
          padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
          background: 'transparent', border: `1px solid ${T.border}`, color: T.text2, cursor: 'pointer',
        }}>
          Conectar Google Ads
        </button>
      </div>
      {/* Trust badges */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '20px' }}>
        {[
          { icon: '🔒', label: 'Acesso somente leitura', desc: 'Nunca modificamos campanhas' },
          { icon: '🛡️', label: 'OAuth oficial', desc: 'Autenticação via Meta & Google' },
          { icon: '🗑️', label: 'Revogar a qualquer hora', desc: 'Desconecte com 1 clique' },
        ].map(b => (
          <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: T.text3 }}>
            <span style={{ fontSize: '14px' }}>{b.icon}</span>
            <div>
              <div style={{ fontWeight: 600, color: T.text2 }}>{b.label}</div>
              <div>{b.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export function TabConnections() {
  const { connectedAccounts, connectAccount, disconnectAccount } = useAppStore()

  const [metaCampaigns,   setMetaCampaigns]   = useState<AdsCampaign[]>([])
  const [googleCampaigns, setGoogleCampaigns] = useState<AdsCampaign[]>([])
  const [metaTotals,      setMetaTotals]      = useState<Totals | null>(null)
  const [googleTotals,    setGoogleTotals]    = useState<Totals | null>(null)
  const [loadingMeta,     setLoadingMeta]     = useState(false)
  const [loadingGoogle,   setLoadingGoogle]   = useState(false)
  const [error,           setError]           = useState('')
  const [pendingMeta,     setPendingMeta]     = useState<{ accessToken: string; accounts: { id: string; name: string }[] } | null>(null)

  const metaAccount   = connectedAccounts.find(a => a.platform === 'meta')
  const googleAccount = connectedAccounts.find(a => a.platform === 'google')
  const noneConnected = !metaAccount && !googleAccount

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params   = new URLSearchParams(window.location.search)
    const success  = params.get('oauth_success')
    const platform = params.get('platform') as 'meta' | 'google' | null
    const oauthErr = params.get('oauth_error')

    if (oauthErr) {
      setError(`Erro ao conectar: ${oauthErr}`)
      window.history.replaceState({}, '', '/dashboard')
      return
    }

    if (success && platform) {
      window.history.replaceState({}, '', '/dashboard')
      fetch('/api/oauth/token')
        .then(r => r.json())
        .then(data => {
          if (!data.success || !data.accessToken) return
          const accounts: { id: string; name: string }[] = data.accounts || []
          if (data.platform === 'meta' && accounts.length > 1) {
            setPendingMeta({ accessToken: data.accessToken, accounts })
            return
          }
          const accountToConnect = {
            platform: data.platform, accessToken: data.accessToken,
            accountId: data.accountId || undefined, accountName: data.accountName || undefined,
            connectedAt: new Date().toISOString(),
          }
          connectAccount(accountToConnect)
          fetch('/api/connections', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(accountToConnect),
          }).catch(() => {})
        })
        .catch(() => setError('Erro ao recuperar token de conexão. Tente conectar novamente.'))
    }
  }, [])

  useEffect(() => {
    if (metaAccount?.accessToken && metaAccount?.accountId) fetchMetaData(metaAccount.accessToken, metaAccount.accountId)
  }, [metaAccount?.accountId])

  useEffect(() => {
    if (googleAccount?.accessToken && googleAccount?.accountId) fetchGoogleData(googleAccount.accessToken, googleAccount.accountId)
  }, [googleAccount?.accountId])

  const fetchMetaData = async (token: string, accountId: string) => {
    setLoadingMeta(true)
    try {
      const res  = await fetch('/api/ads-data/meta', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accessToken: token, accountId }) })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setMetaCampaigns(data.campaigns)
      setMetaTotals(data.totals)
    } catch (e: any) { setError(`Meta Ads: ${e.message}`) }
    finally { setLoadingMeta(false) }
  }

  const fetchGoogleData = async (token: string, accountId: string) => {
    setLoadingGoogle(true)
    try {
      const res  = await fetch('/api/ads-data/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accessToken: token, accountId }) })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setGoogleCampaigns(data.campaigns)
      setGoogleTotals(data.totals)
    } catch (e: any) { setError(`Google Ads: ${e.message}`) }
    finally { setLoadingGoogle(false) }
  }

  const connectMeta = () => {
    const csrf = crypto.randomUUID()
    document.cookie = `oauth_csrf=${csrf}; path=/; max-age=300; samesite=lax`
    const appId = process.env.NEXT_PUBLIC_META_APP_ID
    const redirectUri = `${window.location.origin}/api/oauth/callback`
    window.location.href =
      `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=ads_read,ads_management&state=${encodeURIComponent(`meta:${csrf}`)}`
  }

  const connectGoogle = () => {
    const csrf = crypto.randomUUID()
    document.cookie = `oauth_csrf=${csrf}; path=/; max-age=300; samesite=lax`
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const redirectUri = `${window.location.origin}/api/oauth/callback`
    const scope = encodeURIComponent('https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/userinfo.email')
    window.location.href =
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code&scope=${scope}&state=${encodeURIComponent(`google:${csrf}`)}&access_type=offline&prompt=consent`
  }

  const handleSelectMetaAccount = (acc: { id: string; name: string }) => {
    const chosen = { platform: 'meta' as const, accessToken: pendingMeta!.accessToken, accountId: acc.id, accountName: acc.name, connectedAt: new Date().toISOString() }
    connectAccount(chosen)
    setPendingMeta(null)
    fetch('/api/connections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(chosen) }).catch(() => {})
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: T.text1, margin: '0 0 6px', letterSpacing: '-0.02em' }}>Conexões de Anúncios</h2>
        <p style={{ fontSize: '13px', color: T.text3, margin: '0 0 10px', lineHeight: 1.6 }}>
          Conecte suas contas para acompanhar campanhas reais em tempo real — CPL, ROAS e leads direto do Meta e Google.
        </p>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          {[
            { icon: '🔒', text: 'Acesso somente leitura — nunca modificamos suas campanhas' },
            { icon: '🛡️', text: 'OAuth oficial via Meta e Google — seus dados ficam seguros' },
            { icon: '🗑️', text: 'Desconecte a qualquer momento com 1 clique' },
          ].map(b => (
            <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: T.text3 }}>
              <span>{b.icon}</span>
              <span>{b.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: T.red,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} style={{ background: 'transparent', border: 'none', color: T.red, cursor: 'pointer', fontSize: '18px', lineHeight: 1, opacity: 0.7 }}>×</button>
        </div>
      )}

      {/* Show full empty state if nothing connected */}
      {noneConnected && !pendingMeta ? (
        <EmptyConnections onConnectMeta={connectMeta} onConnectGoogle={connectGoogle} />
      ) : (
        /* Connection cards */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          <ConnectCard
            platformName="Meta Ads"
            platformDetail="Facebook · Instagram · Reels"
            platformIcon={<MetaIcon size={22} />}
            accentColor="#1877F2"
            account={metaAccount}
            pendingMeta={pendingMeta}
            onConnect={connectMeta}
            onDisconnect={() => { disconnectAccount('meta'); setMetaCampaigns([]); setMetaTotals(null); fetch('/api/connections/meta', { method: 'DELETE' }).catch(() => {}) }}
            onRefresh={() => metaAccount?.accountId && fetchMetaData(metaAccount.accessToken, metaAccount.accountId)}
            loading={loadingMeta}
            onSelectAccount={handleSelectMetaAccount}
            onCancelSelect={() => setPendingMeta(null)}
          />
          <ConnectCard
            platformName="Google Ads"
            platformDetail="Search · Shopping · YouTube · PMAX"
            platformIcon={<GoogleIcon size={22} />}
            accentColor="#EA4335"
            account={googleAccount}
            onConnect={connectGoogle}
            onDisconnect={() => { disconnectAccount('google'); setGoogleCampaigns([]); setGoogleTotals(null); fetch('/api/connections/google', { method: 'DELETE' }).catch(() => {}) }}
            onRefresh={() => googleAccount?.accountId && fetchGoogleData(googleAccount.accessToken, googleAccount.accountId)}
            loading={loadingGoogle}
          />
        </div>
      )}

      {/* Campaign tables */}
      {metaCampaigns.length > 0 && (
        <CampaignTable title="Campanhas Meta Ads" platformIcon={<MetaIcon size={18} />} color="#1877F2" campaigns={metaCampaigns} totals={metaTotals} />
      )}
      {googleCampaigns.length > 0 && (
        <CampaignTable title="Campanhas Google Ads" platformIcon={<GoogleIcon size={18} />} color="#EA4335" campaigns={googleCampaigns} totals={googleTotals} />
      )}

      {/* Connected but no data yet */}
      {((metaAccount && metaCampaigns.length === 0 && !loadingMeta) || (googleAccount && googleCampaigns.length === 0 && !loadingGoogle)) && (
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px',
          padding: '24px', textAlign: 'center',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.text3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ margin: '0 auto 10px', display: 'block' }}>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          <div style={{ fontSize: '13px', color: T.text3 }}>
            Clique em <strong style={{ color: T.text2 }}>↻ Atualizar dados</strong> para buscar suas campanhas ativas.
          </div>
        </div>
      )}
    </div>
  )
}
