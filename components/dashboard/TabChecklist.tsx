// components/dashboard/TabChecklist.tsx — Checklist de otimização diário
'use client'

import { useMemo, useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import type { ChecklistItem } from '@/lib/store'

const C = {
  surface:  '#0F1629',
  elevated: '#131E35',
  border:   'rgba(255,255,255,0.06)',
  purple:   '#7C3AED',
  purpleL:  '#A78BFA',
  purpleD:  'rgba(124,58,237,0.10)',
  purpleB:  'rgba(124,58,237,0.20)',
  green:    '#22C55E',
  greenD:   'rgba(34,197,94,0.10)',
  amber:    '#F59E0B',
  amberD:   'rgba(245,158,11,0.10)',
  red:      '#EF4444',
  redD:     'rgba(239,68,68,0.10)',
  text1:    '#F1F5F9',
  text2:    '#94A3B8',
  text3:    '#64748B',
}

const CATEGORY_META: Record<ChecklistItem['category'], { label: string; color: string; bg: string; icon: string }> = {
  critico:      { label: 'Crítico',      color: C.red,    bg: C.redD,    icon: '🚨' },
  otimizacao:   { label: 'Otimização',   color: C.amber,  bg: C.amberD,  icon: '⚙️' },
  estrategia:   { label: 'Estratégia',   color: C.purpleL,bg: C.purpleD, icon: '⚡' },
  monitoramento:{ label: 'Monitoramento',color: C.text2,  bg: 'rgba(148,163,184,0.08)', icon: '📊' },
}

const PRIORITY_ORDER: Record<ChecklistItem['priority'], number> = { alta: 0, media: 1, baixa: 2 }

function generateItems(
  clientKey: string,
  auditCache: Record<string, any>,
  actionPlanCache: Record<string, any[]>,
  strategyData: any,
  clientData: any,
): ChecklistItem[] {
  const items: ChecklistItem[] = []

  // ── Padrão: itens de monitoramento sempre presentes
  items.push(
    { id: 'mon-ctr',    category: 'monitoramento', priority: 'media',  source: 'padrao', title: 'Verificar CTR das campanhas ativas', description: 'CTR abaixo de 1% indica criativo ou segmentação fraca — ajuste ou pause.' },
    { id: 'mon-freq',   category: 'monitoramento', priority: 'media',  source: 'padrao', title: 'Checar frequência dos anúncios', description: 'Frequência > 3 esgota o público. Renove criativos ou expanda a audiência.' },
    { id: 'mon-budget', category: 'monitoramento', priority: 'baixa',  source: 'padrao', title: 'Revisar pacing do orçamento diário', description: 'Confirme que o gasto está dentro do esperado e sem anomalias de entrega.' },
  )

  // ── Alertas da auditoria mais recente
  const auditHistory = auditCache[clientKey]
  const latestAudit = Array.isArray(auditHistory) ? auditHistory[0]?.audit : auditHistory

  if (latestAudit) {
    const alerts: any[] = latestAudit.alerts || []

    for (const alert of alerts.slice(0, 5)) {
      const isCritical = alert.type === 'critical'
      items.push({
        id: `alert-${alert.metric || alert.id || Math.random().toString(36).slice(2)}`,
        category: isCritical ? 'critico' : 'otimizacao',
        priority:  isCritical ? 'alta' : 'media',
        source:   'alerta',
        title:    alert.title || alert.message?.slice(0, 60) || 'Alerta de campanha',
        description: alert.recommendation || alert.message || 'Revise essa métrica nas campanhas ativas.',
      })
    }

    // Seções com nota baixa
    const sections: Record<string, any> = latestAudit.sections || {}
    for (const [key, section] of Object.entries(sections)) {
      if (section?.grade === 'D' || section?.grade === 'F') {
        items.push({
          id: `audit-${key}`,
          category: 'otimizacao',
          priority:  section.grade === 'F' ? 'alta' : 'media',
          source:   'auditoria',
          title:    `Melhorar ${section.label || key}`,
          description: section.topIssue || `Seção com nota ${section.grade} — revise e aplique as recomendações da auditoria.`,
        })
      }
    }
  }

  // ── Ações pendentes de alta prioridade
  const actions: any[] = actionPlanCache[clientKey] || []
  const pendingHigh = actions.filter(a => a.priority === 'alta' && a.status !== 'done').slice(0, 3)
  for (const action of pendingHigh) {
    items.push({
      id: `action-${action.id}`,
      category: 'estrategia',
      priority:  'alta',
      source:   'estrategia',
      title:    action.title || action.task || 'Ação prioritária pendente',
      description: action.description || action.details || 'Complete esta ação para avançar na estratégia.',
    })
  }

  // ── Recomendações da estratégia
  if (strategyData?.strategy) {
    const strat = strategyData.strategy
    const quickWins: string[] = strat.quickWins || strat.acoes_imediatas || []
    for (const win of quickWins.slice(0, 2)) {
      if (typeof win === 'string' && win.length > 10) {
        items.push({
          id: `strat-${win.slice(0, 20).replace(/\s/g, '-')}`,
          category: 'estrategia',
          priority:  'media',
          source:   'estrategia',
          title:    win.slice(0, 80),
          description: 'Recomendação da estratégia gerada — implemente ainda hoje.',
        })
      }
    }
  }

  // ── Dedup por ID e sort: crítico → otimização → estratégia → monitoramento
  const seen = new Set<string>()
  const unique = items.filter(item => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })

  return unique.sort((a, b) => {
    const catOrder: Record<ChecklistItem['category'], number> = { critico: 0, otimizacao: 1, estrategia: 2, monitoramento: 3 }
    const catDiff = catOrder[a.category] - catOrder[b.category]
    if (catDiff !== 0) return catDiff
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  })
}

interface Props {
  clientData: { clientName: string; niche?: string; budget?: number } | null
}

export function TabChecklist({ clientData }: Props) {
  const auditCache          = useAppStore(s => s.auditCache)
  const actionPlanCache     = useAppStore(s => s.actionPlanCache)
  const strategyData        = useAppStore(s => s.strategyData)
  const checklistCompleted  = useAppStore(s => s.checklistCompleted)
  const checklistDate       = useAppStore(s => s.checklistDate)
  const toggleChecklistItem = useAppStore(s => s.toggleChecklistItem)
  const resetChecklist      = useAppStore(s => s.resetChecklist)
  const briefingEnabled     = useAppStore(s => s.briefingEnabled)
  const setBriefingEnabled  = useAppStore(s => s.setBriefingEnabled)

  const [briefingSaving, setBriefingSaving] = useState(false)

  const clientKey = clientData?.clientName || '__global__'
  const today = new Date().toISOString().split('T')[0]

  // Daily reset
  useEffect(() => {
    if (checklistDate[clientKey] !== today) {
      resetChecklist(clientKey)
    }
  }, [clientKey, today, checklistDate, resetChecklist])

  const items = useMemo(
    () => generateItems(clientKey, auditCache, actionPlanCache, strategyData, clientData),
    [clientKey, auditCache, actionPlanCache, strategyData, clientData]
  )

  const completed = checklistCompleted[clientKey] || {}
  const doneCount = items.filter(i => completed[i.id]).length
  const totalCount = items.length
  const scorePercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  const scoreColor = scorePercent >= 80 ? C.green : scorePercent >= 50 ? C.amber : C.red
  const scoreLabel = scorePercent >= 80 ? 'Excelente' : scorePercent >= 50 ? 'Em progresso' : 'Atenção necessária'

  const categories = ['critico', 'otimizacao', 'estrategia', 'monitoramento'] as const
  const byCategory = Object.fromEntries(
    categories.map(cat => [cat, items.filter(i => i.category === cat)])
  ) as Record<ChecklistItem['category'], ChecklistItem[]>

  if (!clientData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>📋</div>
          <p style={{ color: C.text2, fontSize: '14px' }}>Configure um cliente para ver o checklist.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: C.text1, margin: '0 0 4px' }}>
            Checklist Diário
          </h2>
          <p style={{ fontSize: '12px', color: C.text3, margin: 0 }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })} · reinicia à meia-noite
          </p>
        </div>

        {/* Score card */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          padding: '12px 20px', borderRadius: '14px',
          background: C.surface, border: `1px solid ${C.border}`,
          flexShrink: 0,
        }}>
          {/* Circular progress */}
          <div style={{ position: 'relative', width: '52px', height: '52px', flexShrink: 0 }}>
            <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
              <circle
                cx="26" cy="26" r="22" fill="none"
                stroke={scoreColor} strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 22}`}
                strokeDashoffset={`${2 * Math.PI * 22 * (1 - scorePercent / 100)}`}
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 700, color: scoreColor,
            }}>
              {scorePercent}%
            </div>
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: C.text1 }}>
              {doneCount}/{totalCount} concluídos
            </div>
            <div style={{ fontSize: '11px', color: scoreColor, marginTop: '2px' }}>
              {scoreLabel}
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        height: '4px', borderRadius: '2px',
        background: 'rgba(255,255,255,0.05)',
        marginBottom: '28px', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: '2px',
          width: `${scorePercent}%`,
          background: scorePercent >= 80
            ? `linear-gradient(90deg, ${C.green}, #4ADE80)`
            : scorePercent >= 50
              ? `linear-gradient(90deg, ${C.amber}, #FCD34D)`
              : `linear-gradient(90deg, ${C.red}, #F87171)`,
          transition: 'width 0.6s ease',
        }} />
      </div>

      {/* Checklist by category */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {categories.map((cat) => {
          const catItems = byCategory[cat]
          if (!catItems || catItems.length === 0) return null
          const meta = CATEGORY_META[cat]
          const catDone = catItems.filter(i => completed[i.id]).length

          return (
            <div key={cat}>
              {/* Category header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px' }}>{meta.icon}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: meta.color, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  {meta.label}
                </span>
                <span style={{
                  fontSize: '10px', padding: '1px 6px', borderRadius: '4px',
                  color: meta.color, background: meta.bg,
                  fontFamily: 'var(--font-mono)',
                }}>
                  {catDone}/{catItems.length}
                </span>
              </div>

              {/* Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {catItems.map(item => {
                  const isDone = !!completed[item.id]
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleChecklistItem(clientKey, item.id)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '12px',
                        padding: '12px 14px', borderRadius: '10px', border: 'none',
                        background: isDone ? 'rgba(34,197,94,0.04)' : C.surface,
                        outline: isDone ? '1px solid rgba(34,197,94,0.12)' : `1px solid ${C.border}`,
                        cursor: 'pointer', textAlign: 'left', width: '100%',
                        transition: 'all 0.15s',
                        opacity: isDone ? 0.65 : 1,
                      }}
                      onMouseEnter={e => {
                        if (!isDone) (e.currentTarget as HTMLElement).style.outline = '1px solid rgba(124,58,237,0.3)'
                      }}
                      onMouseLeave={e => {
                        if (!isDone) (e.currentTarget as HTMLElement).style.outline = `1px solid ${C.border}`
                      }}
                    >
                      {/* Checkbox */}
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0, marginTop: '1px',
                        border: isDone ? 'none' : `2px solid rgba(255,255,255,0.2)`,
                        background: isDone ? C.green : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}>
                        {isDone && (
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                            <polyline points="2 6 5 9 10 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '13px', fontWeight: 600,
                          color: isDone ? C.text3 : C.text1,
                          textDecoration: isDone ? 'line-through' : 'none',
                          marginBottom: '3px', lineHeight: 1.4,
                        }}>
                          {item.title}
                        </div>
                        {!isDone && (
                          <div style={{ fontSize: '11px', color: C.text3, lineHeight: 1.5 }}>
                            {item.description}
                          </div>
                        )}
                      </div>

                      {/* Priority badge */}
                      {!isDone && item.priority === 'alta' && (
                        <span style={{
                          fontSize: '9px', fontWeight: 700, padding: '2px 6px',
                          borderRadius: '4px', flexShrink: 0,
                          color: C.red, background: C.redD,
                          fontFamily: 'var(--font-mono)',
                        }}>
                          URGENTE
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* All done celebration */}
      {doneCount === totalCount && totalCount > 0 && (
        <div style={{
          marginTop: '28px', padding: '20px', borderRadius: '14px', textAlign: 'center',
          background: C.greenD, border: '1px solid rgba(34,197,94,0.2)',
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎉</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: C.green, marginBottom: '4px' }}>
            Checklist concluído!
          </div>
          <div style={{ fontSize: '12px', color: C.text3 }}>
            Ótimo trabalho hoje. O checklist será renovado amanhã.
          </div>
        </div>
      )}

      {/* Morning briefing opt-in */}
      <div style={{
        marginTop: '24px', padding: '16px 18px', borderRadius: '12px',
        background: C.surface, border: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px', flexShrink: 0 }}>☀️</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: C.text1, marginBottom: '2px' }}>
              Morning Briefing por email
            </div>
            <div style={{ fontSize: '11px', color: C.text3 }}>
              Receba o checklist do dia às 8h no seu email.
            </div>
          </div>
        </div>

        <div
          onClick={async () => {
            const next = !briefingEnabled
            setBriefingEnabled(next)
            setBriefingSaving(true)
            try {
              await fetch('/api/briefing/prefs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  enabled: next,
                  clientName: clientData?.clientName,
                  niche: clientData?.niche,
                  budget: clientData?.budget,
                }),
              })
            } catch {}
            setBriefingSaving(false)
          }}
          style={{
            width: '44px', height: '24px', borderRadius: '12px', flexShrink: 0,
            background: briefingEnabled ? C.purple : 'rgba(255,255,255,0.1)',
            position: 'relative', transition: 'background 0.2s',
            cursor: briefingSaving ? 'not-allowed' : 'pointer',
            opacity: briefingSaving ? 0.6 : 1,
          }}
        >
          <div style={{
            position: 'absolute', top: '3px', width: '18px', height: '18px',
            borderRadius: '50%', background: '#fff',
            left: briefingEnabled ? '23px' : '3px',
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }} />
        </div>
      </div>

      {/* Footer note */}
      <div style={{
        marginTop: '12px', padding: '12px 14px', borderRadius: '10px',
        background: C.purpleD, border: `1px solid ${C.purpleB}`,
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <span style={{ fontSize: '14px', flexShrink: 0 }}>💡</span>
        <p style={{ fontSize: '11px', color: C.text2, margin: 0, lineHeight: 1.6 }}>
          Os itens são gerados automaticamente com base nos seus alertas, auditoria e plano de ações. Novos itens aparecem ao executar uma auditoria ou gerar estratégia.
        </p>
      </div>
    </div>
  )
}
