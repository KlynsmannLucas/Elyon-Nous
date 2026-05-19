// components/dashboard/TabWorkflow.tsx — Workflow Builder (automações pré-construídas)
'use client'

import { useState, useEffect } from 'react'

interface WorkflowRule {
  id: string
  category: 'alerta' | 'pausa' | 'email' | 'otimizacao'
  icon: string
  title: string
  description: string
  trigger: string
  action: string
  severity: 'critical' | 'warning' | 'info'
  enabled: boolean
}

const CATEGORY_CONFIG = {
  alerta:     { label: 'Alerta',       color: '#FF4D4D', bg: 'rgba(255,77,77,0.07)',    border: 'rgba(255,77,77,0.2)' },
  email:      { label: 'Email',        color: '#38BDF8', bg: 'rgba(56,189,248,0.07)',   border: 'rgba(56,189,248,0.2)' },
  pausa:      { label: 'Pausa',        color: '#F0B429', bg: 'rgba(240,180,41,0.07)',   border: 'rgba(240,180,41,0.2)' },
  otimizacao: { label: 'Otimização',   color: '#22C55E', bg: 'rgba(34,197,94,0.07)',    border: 'rgba(34,197,94,0.2)' },
}

const DEFAULT_RULES: WorkflowRule[] = [
  {
    id: 'cpl-critical-email',
    category: 'email',
    icon: '📧',
    title: 'Email quando CPL crítico',
    description: 'Envia email de alerta quando uma campanha ultrapassa 2.5× o benchmark de CPL do nicho.',
    trigger: 'CPL > 2.5× benchmark do nicho',
    action: 'Enviar email de alerta com detalhes da campanha',
    severity: 'critical',
    enabled: false,
  },
  {
    id: 'frequency-alert',
    category: 'alerta',
    icon: '🔁',
    title: 'Alerta de fadiga de criativo',
    description: 'Gera alerta quando frequência de qualquer campanha supera 4× (público vendo o mesmo anúncio repetidamente).',
    trigger: 'Frequência > 4× com gasto > R$100',
    action: 'Alerta in-app com prioridade alta',
    severity: 'warning',
    enabled: true,
  },
  {
    id: 'ctr-low-alert',
    category: 'alerta',
    icon: '📉',
    title: 'Alerta de CTR baixo',
    description: 'Notifica quando CTR cai abaixo de 0.5% após 1.000 impressões — sinal de criativo fraco.',
    trigger: 'CTR < 0.5% com impressões > 1.000',
    action: 'Alerta in-app com sugestão de troca de criativo',
    severity: 'warning',
    enabled: true,
  },
  {
    id: 'waste-budget-email',
    category: 'email',
    icon: '🚨',
    title: 'Email: verba gasta sem leads',
    description: 'Alerta imediato quando uma campanha gasta mais de R$200 sem gerar nenhum lead.',
    trigger: 'Gasto > R$200 e leads = 0',
    action: 'Email de alerta crítico + notificação in-app',
    severity: 'critical',
    enabled: false,
  },
  {
    id: 'scale-opportunity',
    category: 'otimizacao',
    icon: '🚀',
    title: 'Detectar oportunidade de escala',
    description: 'Identifica campanhas com CPL abaixo de 70% do mínimo do nicho — candidatas a escalar o orçamento.',
    trigger: 'CPL < 70% do mínimo do nicho com leads > 5',
    action: 'Sugestão de escala com % recomendado de aumento',
    severity: 'info',
    enabled: true,
  },
  {
    id: 'roas-critical',
    category: 'alerta',
    icon: '📊',
    title: 'Alerta de ROAS negativo',
    description: 'Sinaliza campanhas com ROAS abaixo do break-even (< 1×) quando o gasto supera R$300.',
    trigger: 'ROAS < 1× e gasto > R$300',
    action: 'Alerta de nível warning com revisão de oferta recomendada',
    severity: 'warning',
    enabled: true,
  },
  {
    id: 'health-score-critical',
    category: 'email',
    icon: '🩺',
    title: 'Email: score de conta crítico',
    description: 'Email semanal quando o score de saúde da conta fica abaixo de 45/100 na auditoria.',
    trigger: 'Score de auditoria < 45/100',
    action: 'Email com lista das seções críticas e ações prioritárias',
    severity: 'critical',
    enabled: false,
  },
  {
    id: 'frequency-pause-rec',
    category: 'pausa',
    icon: '⏸',
    title: 'Recomendação de pausa por fadiga severa',
    description: 'Quando frequência supera 6×, recomenda pausar o criativo imediatamente para evitar queimar o público.',
    trigger: 'Frequência > 6× com gasto > R$200',
    action: 'Recomendação de pausa com instrução passo a passo',
    severity: 'critical',
    enabled: true,
  },
]

const STORAGE_KEY = 'elyon_workflow_rules'

function loadRules(): WorkflowRule[] {
  if (typeof window === 'undefined') return DEFAULT_RULES
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_RULES
    const saved: Record<string, boolean> = JSON.parse(raw)
    return DEFAULT_RULES.map(r => ({ ...r, enabled: saved[r.id] ?? r.enabled }))
  } catch {
    return DEFAULT_RULES
  }
}

function saveRules(rules: WorkflowRule[]) {
  try {
    const map: Record<string, boolean> = {}
    rules.forEach(r => { map[r.id] = r.enabled })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch { /* silent */ }
}

export function TabWorkflow() {
  const [rules, setRules] = useState<WorkflowRule[]>(DEFAULT_RULES)
  const [filterCat, setFilterCat] = useState<string>('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setRules(loadRules())
  }, [])

  function toggle(id: string) {
    setRules(prev => {
      const next = prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
      saveRules(next)
      return next
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const filtered = filterCat ? rules.filter(r => r.category === filterCat) : rules
  const enabledCount = rules.filter(r => r.enabled).length

  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '20px' }}>⚙️</span>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Workflow Builder</h2>
            <span style={{
              fontSize: '9px', fontFamily: 'var(--font-mono)', color: '#22C55E',
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: '4px', padding: '2px 6px', letterSpacing: '0.06em',
            }}>AUTO</span>
          </div>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0, maxWidth: '500px' }}>
            Ative automações pré-construídas que disparam alertas, emails e recomendações com base nos dados das suas campanhas.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {saved && (
            <span style={{ fontSize: '11px', color: '#22C55E', fontFamily: 'var(--font-mono)' }}>✓ Salvo</span>
          )}
          <div style={{
            padding: '8px 14px', borderRadius: '9px',
            background: enabledCount > 0 ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${enabledCount > 0 ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`,
            fontSize: '12px', fontWeight: 700,
            color: enabledCount > 0 ? '#22C55E' : 'rgba(255,255,255,0.3)',
          }}>
            {enabledCount} ativa{enabledCount !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {(Object.entries(CATEGORY_CONFIG) as [string, any][]).map(([cat, cfg]) => {
          const count = rules.filter(r => r.category === cat && r.enabled).length
          const total = rules.filter(r => r.category === cat).length
          return (
            <button
              key={cat}
              onClick={() => setFilterCat(f => f === cat ? '' : cat)}
              style={{
                padding: '12px 14px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer',
                background: filterCat === cat ? cfg.bg : '#111114',
                border: `1px solid ${filterCat === cat ? cfg.border : 'rgba(255,255,255,0.06)'}`,
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                {cfg.label}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: cfg.color }}>
                {count}<span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>/{total}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Rules list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map(rule => {
          const cfg = CATEGORY_CONFIG[rule.category]
          const severityColors = { critical: '#FF4D4D', warning: '#F0B429', info: '#38BDF8' }
          return (
            <div key={rule.id} style={{
              background: '#111114',
              border: `1px solid ${rule.enabled ? cfg.border : 'rgba(255,255,255,0.06)'}`,
              borderRadius: '12px', padding: '16px 18px',
              transition: 'all 0.15s',
              opacity: rule.enabled ? 1 : 0.6,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                {/* Toggle */}
                <button
                  onClick={() => toggle(rule.id)}
                  title={rule.enabled ? 'Desativar' : 'Ativar'}
                  style={{
                    flexShrink: 0, width: '40px', height: '22px',
                    borderRadius: '11px', border: 'none', cursor: 'pointer',
                    background: rule.enabled ? cfg.color : 'rgba(255,255,255,0.1)',
                    position: 'relative', transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '3px',
                    left: rule.enabled ? '21px' : '3px',
                    width: '16px', height: '16px', borderRadius: '50%',
                    background: '#fff', transition: 'left 0.2s',
                  }} />
                </button>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '15px' }}>{rule.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{rule.title}</span>
                    <span style={{
                      fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px',
                      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
                    }}>
                      {cfg.label.toUpperCase()}
                    </span>
                    <span style={{
                      fontSize: '9px', padding: '1px 6px', borderRadius: '4px',
                      color: severityColors[rule.severity],
                      background: `${severityColors[rule.severity]}12`,
                      border: `1px solid ${severityColors[rule.severity]}30`,
                    }}>
                      {rule.severity}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: '0 0 10px', lineHeight: '1.5' }}>
                    {rule.description}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{
                      padding: '8px 10px', borderRadius: '7px',
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                    }}>
                      <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginBottom: '3px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Gatilho</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)' }}>{rule.trigger}</div>
                    </div>
                    <div style={{
                      padding: '8px 10px', borderRadius: '7px',
                      background: rule.enabled ? `${cfg.color}08` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${rule.enabled ? cfg.border : 'rgba(255,255,255,0.05)'}`,
                    }}>
                      <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginBottom: '3px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Ação</div>
                      <div style={{ fontSize: '11px', color: rule.enabled ? cfg.color : 'rgba(255,255,255,0.4)' }}>{rule.action}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer note */}
      <div style={{
        marginTop: '20px', padding: '14px 18px',
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px',
      }}>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', lineHeight: '1.6' }}>
          ℹ️ As automações de <strong style={{ color: 'rgba(255,255,255,0.5)' }}>Alerta</strong> disparam quando você abre a aba de alertas com dados de campanha. As automações de <strong style={{ color: 'rgba(255,255,255,0.5)' }}>Email</strong> requerem que emails estejam habilitados nas configurações do perfil.
          Preferências salvas localmente no navegador.
        </div>
      </div>
    </div>
  )
}
