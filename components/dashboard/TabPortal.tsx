// components/dashboard/TabPortal.tsx — Portal do Cliente white-label MVP
'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import type { ClientPortal } from '@/lib/store'

const C = {
  surface:  '#0F1629',
  elevated: '#131E35',
  border:   'rgba(255,255,255,0.06)',
  purple:   '#7C3AED',
  purpleL:  '#A78BFA',
  purpleD:  'rgba(124,58,237,0.10)',
  purpleB:  'rgba(124,58,237,0.22)',
  green:    '#22C55E',
  greenD:   'rgba(34,197,94,0.10)',
  text1:    '#F1F5F9',
  text2:    '#94A3B8',
  text3:    '#64748B',
}

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://elyon.app'

interface Props {
  clientData: { clientName: string; niche?: string; budget?: number; monthlyRevenue?: number } | null
}

export function TabPortal({ clientData }: Props) {
  const clientPortalsSaved = useAppStore(s => s.clientPortalsSaved)
  const addClientPortal    = useAppStore(s => s.addClientPortal)
  const deleteClientPortal = useAppStore(s => s.deleteClientPortal)

  const [agencyName, setAgencyName] = useState('')
  const [showMetrics,   setShowMetrics]   = useState(true)
  const [showStrategy,  setShowStrategy]  = useState(true)
  const [showActions,   setShowActions]   = useState(false)
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [createError, setCreateError] = useState('')

  const myPortals = clientPortalsSaved.filter(p => p.clientName === (clientData?.clientName || ''))

  // Codifica UTF-8 corretamente: encodeURIComponent → btoa (só ASCII)
  const encodePayload = (obj: object): string =>
    btoa(encodeURIComponent(JSON.stringify(obj)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  // Gera a URL completa com dados embutidos, mesmo para portais antigos sem dataParam
  const getPortalUrl = (portal: ClientPortal): string => {
    const dp = portal.dataParam ?? encodePayload({
      cn: portal.clientName,
      an: portal.agencyName,
      sm: portal.showMetrics,
      ss: portal.showStrategy,
      sa: portal.showActions,
      ni: portal.niche || clientData?.niche || '',
      b:  portal.budget || clientData?.budget || 0,
      r:  portal.revenue || clientData?.monthlyRevenue || 0,
    })
    return `${BASE_URL}/portal/${portal.slug}?d=${dp}`
  }

  const handleCreate = async () => {
    if (!clientData) return
    if (!agencyName.trim()) { setCreateError('Informe o nome da sua agência ou empresa.'); return }
    setCreating(true)
    setCreateError('')

    try {
      const slug = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      const agency = agencyName.trim()

      // Gera data param auto-contido na URL (independe do Supabase)
      const payload = {
        cn: clientData.clientName,
        an: agency,
        sm: showMetrics,
        ss: showStrategy,
        sa: showActions,
        ni: clientData.niche || '',
        b:  clientData.budget || 0,
        r:  clientData.monthlyRevenue || 0,
      }
      const dataParam = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

      // Salva no store local com todos os dados embutidos
      addClientPortal({
        slug, clientName: clientData.clientName, agencyName: agency,
        showMetrics, showStrategy, showActions,
        dataParam,
        niche: clientData.niche, budget: clientData.budget, revenue: clientData.monthlyRevenue,
      })
      setAgencyName('')

      // Persiste no Supabase em background (best-effort)
      fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, clientName: clientData.clientName, agencyName: agency, showMetrics, showStrategy, showActions, niche: clientData.niche, budget: clientData.budget, revenue: clientData.monthlyRevenue }),
      }).catch(() => {})
    } catch (e: any) {
      setCreateError(e.message)
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = (portal: ClientPortal) => {
    const url = getPortalUrl(portal)
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(portal.id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const handleDelete = async (portal: ClientPortal) => {
    if (!window.confirm(`Remover o portal de "${portal.clientName}"?\n\nO link ficará inacessível imediatamente.`)) return
    deleteClientPortal(portal.id)
    fetch(`/api/portal/${portal.slug}`, { method: 'DELETE' }).catch(() => {})
  }

  if (!clientData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔗</div>
          <p style={{ color: C.text2, fontSize: '14px' }}>Configure um cliente para criar portais.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: C.text1, margin: '0 0 4px' }}>
          Portal do Cliente
        </h2>
        <p style={{ fontSize: '12px', color: C.text3, margin: 0 }}>
          Gere um link white-label para o cliente acompanhar os resultados da campanha.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>

        {/* Create form */}
        <div style={{
          padding: '20px', borderRadius: '14px',
          background: C.surface, border: `1px solid ${C.border}`,
        }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: C.text1, marginBottom: '16px' }}>
            ✨ Novo portal
          </div>

          {/* Cliente */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '11px', color: C.text3, marginBottom: '6px', display: 'block' }}>
              CLIENTE
            </label>
            <div style={{
              padding: '9px 12px', borderRadius: '8px',
              background: C.elevated, border: `1px solid ${C.border}`,
              fontSize: '13px', color: C.text2,
            }}>
              {clientData.clientName}
            </div>
          </div>

          {/* Agency name */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '11px', color: C.text3, marginBottom: '6px', display: 'block' }}>
              NOME DA AGÊNCIA / EMPRESA
            </label>
            <input
              value={agencyName}
              onChange={e => { setAgencyName(e.target.value); setCreateError('') }}
              placeholder="Ex: Growth Digital"
              style={{
                width: '100%', padding: '9px 12px', borderRadius: '8px',
                background: C.elevated, border: `1px solid ${C.border}`,
                fontSize: '13px', color: C.text1, outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = C.purpleB }}
              onBlur={e => { e.currentTarget.style.borderColor = C.border }}
            />
          </div>

          {/* Toggles */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ fontSize: '11px', color: C.text3, marginBottom: '8px', display: 'block' }}>
              O QUE MOSTRAR AO CLIENTE
            </label>
            {[
              { key: 'metrics',  label: 'Métricas de campanha', val: showMetrics,  set: setShowMetrics },
              { key: 'strategy', label: 'Resumo da estratégia', val: showStrategy, set: setShowStrategy },
              { key: 'actions',  label: 'Próximas ações',       val: showActions,  set: setShowActions },
            ].map(t => (
              <label key={t.key} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 0', cursor: 'pointer',
              }}>
                <div
                  onClick={() => t.set(!t.val)}
                  style={{
                    width: '34px', height: '18px', borderRadius: '9px', flexShrink: 0,
                    background: t.val ? C.purple : 'rgba(255,255,255,0.1)',
                    position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '2px', width: '14px', height: '14px',
                    borderRadius: '50%', background: '#fff',
                    left: t.val ? '18px' : '2px',
                    transition: 'left 0.2s',
                  }} />
                </div>
                <span style={{ fontSize: '12px', color: C.text2 }}>{t.label}</span>
              </label>
            ))}
          </div>

          {createError && (
            <div style={{ fontSize: '11px', color: '#EF4444', marginBottom: '12px', padding: '8px 10px', borderRadius: '6px', background: 'rgba(239,68,68,0.08)' }}>
              {createError}
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={creating}
            style={{
              width: '100%', padding: '10px', borderRadius: '10px', border: 'none',
              background: creating ? 'rgba(124,58,237,0.3)' : 'linear-gradient(135deg, #7C3AED, #A78BFA)',
              color: '#fff', fontSize: '13px', fontWeight: 700,
              cursor: creating ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            {creating ? (
              <>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />
                Criando...
              </>
            ) : (
              '🔗 Gerar link do portal'
            )}
          </button>
        </div>

        {/* Portals list */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: C.text1, marginBottom: '12px' }}>
            Portais ativos {myPortals.length > 0 && (
              <span style={{ fontSize: '11px', fontWeight: 400, color: C.text3, marginLeft: '6px' }}>
                ({myPortals.length})
              </span>
            )}
          </div>

          {myPortals.length === 0 ? (
            <div style={{
              padding: '32px 20px', borderRadius: '14px', textAlign: 'center',
              background: C.surface, border: `1px dashed rgba(255,255,255,0.08)`,
            }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔗</div>
              <div style={{ fontSize: '13px', color: C.text3 }}>
                Nenhum portal criado ainda.<br />Crie um ao lado e compartilhe com o cliente.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {myPortals.map(portal => (
                <div key={portal.id} style={{
                  padding: '14px 16px', borderRadius: '12px',
                  background: C.surface, border: `1px solid ${C.border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: C.text1 }}>
                        {portal.agencyName}
                      </div>
                      <div style={{ fontSize: '11px', color: C.text3, marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                        /portal/{portal.slug}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(portal)}
                      style={{
                        padding: '4px 8px', borderRadius: '6px', border: 'none',
                        background: 'transparent', color: C.text3, cursor: 'pointer',
                        fontSize: '14px', flexShrink: 0,
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#EF4444' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.text3 }}
                      title="Remover portal"
                    >
                      ×
                    </button>
                  </div>

                  {/* Tags */}
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {portal.showMetrics   && <span style={tagStyle}>Métricas</span>}
                    {portal.showStrategy  && <span style={tagStyle}>Estratégia</span>}
                    {portal.showActions   && <span style={tagStyle}>Ações</span>}
                  </div>

                  {/* Copy + Open */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleCopy(portal)}
                      style={{
                        flex: 1, padding: '7px 10px', borderRadius: '8px', border: 'none',
                        background: copiedId === portal.id ? C.greenD : C.purpleD,
                        color: copiedId === portal.id ? C.green : C.purpleL,
                        outline: `1px solid ${copiedId === portal.id ? 'rgba(34,197,94,0.25)' : C.purpleB}`,
                        fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {copiedId === portal.id ? '✓ Copiado!' : '📋 Copiar link'}
                    </button>
                    <a
                      href={getPortalUrl(portal)}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: '7px 12px', borderRadius: '8px',
                        background: 'transparent',
                        border: `1px solid ${C.border}`,
                        color: C.text3, fontSize: '12px', fontWeight: 600,
                        textDecoration: 'none',
                        display: 'flex', alignItems: 'center', gap: '4px',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.text1; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.text3; (e.currentTarget as HTMLElement).style.borderColor = C.border }}
                    >
                      ↗ Ver
                    </a>
                  </div>

                  <div style={{ fontSize: '10px', color: C.text3, marginTop: '8px' }}>
                    Criado em {new Date(portal.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info footer */}
      <div style={{
        marginTop: '24px', padding: '14px 16px', borderRadius: '12px',
        background: C.purpleD, border: `1px solid ${C.purpleB}`,
        display: 'flex', alignItems: 'flex-start', gap: '12px',
      }}>
        <span style={{ fontSize: '15px', flexShrink: 0 }}>ℹ️</span>
        <div style={{ fontSize: '11px', color: C.text2, lineHeight: 1.6 }}>
          O portal é um link público com seu branding. Compartilhe com o cliente para que ele acompanhe os resultados sem precisar de acesso ao ELYON. Os dados exibidos são os da última atualização registrada.
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const tagStyle: React.CSSProperties = {
  fontSize: '10px', padding: '2px 7px', borderRadius: '4px',
  color: '#A78BFA', background: 'rgba(124,58,237,0.08)',
  border: '1px solid rgba(124,58,237,0.2)',
  fontFamily: 'var(--font-mono)',
}
