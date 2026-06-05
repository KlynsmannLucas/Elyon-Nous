// components/dashboard/TabSimpleFunil.tsx — Jornada do Cliente / Onde Perco Clientes (Modo Simplificado)
// Reaproveita diagnose() + PRESCRIPTIONS do TabFunil. Versão técnica permanece intacta no modo avançado.
'use client'

import { useAppStore } from '@/lib/store'
import { getBenchmark, BENCHMARKS } from '@/lib/niche_benchmarks'
import { diagnose, PRESCRIPTIONS, type Bottleneck } from './TabFunil'
import type { ClientData } from '@/lib/store'
import type { TabKey } from './DashboardSidebar'

interface Props {
  clientData: ClientData | null
  onNavigate?: (tab: TabKey) => void
}

const C = {
  surface:  '#0C1426',
  border:   'rgba(255,255,255,0.06)',
  purple:   '#7C3AED',
  purpleHi: '#A78BFA',
  purpleBg: 'rgba(124,58,237,0.08)',
  green:    '#22C55E',
  greenBg:  'rgba(34,197,94,0.07)',
  amber:    '#F59E0B',
  red:      '#EF4444',
  text1:    '#F1F5F9',
  text2:    '#94A3B8',
  text3:    'rgba(255,255,255,0.32)',
}

// Mapeia o gargalo técnico para a transição da jornada em linguagem humana
const LOSS_NARRATIVE: Record<Bottleneck, { stageLoss: string; meaning: string }> = {
  anuncio: {
    stageLoss: 'entre ver o anúncio e clicar',
    meaning: 'Muita gente vê seu anúncio, mas poucas pessoas clicam. Isso costuma indicar que a imagem, a promessa ou o público não estão chamando atenção suficiente.',
  },
  landing_page: {
    stageLoss: 'entre clicar e entrar em contato',
    meaning: 'As pessoas clicam no anúncio, mas não avançam para o contato. Isso pode indicar problema na página, no WhatsApp, na oferta, na velocidade de carregamento ou na clareza da mensagem.',
  },
  qualificacao: {
    stageLoss: 'entre o contato e o perfil de compra',
    meaning: 'Você recebe contatos, mas poucos têm perfil real de compra. Geralmente isso vem da segmentação do público ou de uma comunicação que atrai as pessoas erradas.',
  },
  fechamento: {
    stageLoss: 'entre o contato qualificado e a venda',
    meaning: 'Os contatos têm perfil bom, mas poucos fecham. O gargalo está no atendimento, na proposta, no preço ou no acompanhamento (follow-up).',
  },
  velocidade: {
    stageLoss: 'na velocidade de resposta',
    meaning: 'Os contatos estão esfriando antes do primeiro atendimento. Responder rápido (em minutos) aumenta muito a chance de venda.',
  },
  saudavel: {
    stageLoss: '',
    meaning: 'Sua jornada está convertendo bem em todas as etapas. É um bom momento para investir mais com segurança.',
  },
}

function askNous(question: string) {
  window.dispatchEvent(new CustomEvent('elyon:open-nous', { detail: { question } }))
}

// ── Etapa do funil visual ─────────────────────────────────────────────────────
function FunnelStage({ label, value, pct, isLoss, widthPct }: {
  label: string; value: number | null; pct: string | null; isLoss: boolean; widthPct: number
}) {
  const color = isLoss ? C.red : C.purpleHi
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{
          width: `${Math.max(widthPct, 22)}%`, minWidth: '90px',
          height: '44px', borderRadius: '10px',
          background: isLoss ? 'rgba(239,68,68,0.12)' : 'rgba(124,58,237,0.14)',
          border: `1px solid ${isLoss ? 'rgba(239,68,68,0.3)' : 'rgba(124,58,237,0.28)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 14px', transition: 'width 0.5s ease',
        }}>
          <span style={{ fontSize: '12px', color: C.text2, whiteSpace: 'nowrap' as const }}>{label}</span>
          <span style={{ fontSize: '15px', fontWeight: 800, color, marginLeft: '10px' }}>
            {value != null ? value.toLocaleString('pt-BR') : '—'}
          </span>
        </div>
      </div>
      <div style={{ width: '64px', flexShrink: 0, textAlign: 'right' as const }}>
        {pct && <span style={{ fontSize: '11px', fontWeight: 700, color: isLoss ? C.red : C.text3 }}>{pct}</span>}
      </div>
    </div>
  )
}

export function TabSimpleFunil({ clientData, onNavigate }: Props) {
  const funnelEntries = useAppStore(s => s.funnelEntries)

  if (!clientData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: C.text3, fontSize: '13px' }}>
        Configure um cliente para ver a jornada.
      </div>
    )
  }

  const entries = funnelEntries.filter(e => e.clientName === clientData.clientName)
  const entry = entries[0]  // mais recente

  // ── Estado vazio ────────────────────────────────────────────────────────────
  if (!entry) {
    return (
      <div style={{ maxWidth: '640px' }}>
        <div style={{ padding: '32px 28px', borderRadius: '16px', background: C.surface, border: `1px solid ${C.border}`, textAlign: 'center' as const }}>
          <div style={{ fontSize: '40px', marginBottom: '14px' }}>🔻</div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.text1, margin: '0 0 8px' }}>
            Ainda não temos seus números para analisar
          </h2>
          <p style={{ fontSize: '13px', color: C.text2, lineHeight: 1.6, margin: '0 0 18px' }}>
            Para descobrir onde você perde clientes, precisamos de alguns números simples:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' as const, maxWidth: '320px', margin: '0 auto 20px' }}>
            {['Quantas pessoas viram o anúncio', 'Quantas clicaram', 'Quantos contatos chegaram', 'Quantas vendas aconteceram'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: C.text2 }}>
                <span style={{ color: C.purpleHi }}>○</span>{t}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' as const }}>
            <button
              onClick={() => useAppStore.getState().setDashboardMode('pro')}
              style={{ padding: '10px 18px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #7C3AED, #A78BFA)' }}
            >
              Preencher meus números →
            </button>
            <button
              onClick={() => askNous('Como descobrir onde estou perdendo clientes no meu funil?')}
              style={{ padding: '10px 18px', borderRadius: '9px', fontSize: '13px', fontWeight: 600, color: C.purpleHi, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,58,237,0.25)', cursor: 'pointer' }}
            >
              💬 Perguntar para a IA
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Diagnóstico (reaproveita a lógica técnica) ───────────────────────────────
  const bench    = getBenchmark(clientData.niche)
  const benchKey = bench ? (Object.keys(BENCHMARKS).find(k => BENCHMARKS[k] === bench) || 'outro') : 'outro'
  const dx       = diagnose(entry, benchKey)
  const presc    = PRESCRIPTIONS[dx.bottleneck]
  const narrative = LOSS_NARRATIVE[dx.bottleneck]

  const isHealthy = dx.bottleneck === 'saudavel'
  const statusCfg = isHealthy
    ? { icon: '🟢', color: C.green, headline: 'Sua jornada está saudável' }
    : dx.score >= 55
    ? { icon: '🟡', color: C.amber, headline: `Seu maior gargalo está ${narrative.stageLoss}` }
    : { icon: '🔴', color: C.red, headline: `Atenção: você perde muitos clientes ${narrative.stageLoss}` }

  // ── Funil visual (contagens absolutas) ────────────────────────────────────────
  const rawStages = [
    { label: 'Viram o anúncio',        value: entry.impressions > 0 ? entry.impressions : null,       lossKey: 'anuncio' },
    { label: 'Clicaram',               value: entry.clicks > 0 ? entry.clicks : null,                 lossKey: 'landing_page' },
    { label: 'Viraram contato',        value: entry.leads > 0 ? entry.leads : null,                   lossKey: 'qualificacao' },
    { label: 'Com perfil de compra',   value: entry.qualifiedLeads > 0 ? entry.qualifiedLeads : null, lossKey: 'fechamento' },
    { label: 'Vendas geradas',         value: entry.sales > 0 ? entry.sales : null,                   lossKey: null },
  ]
  const maxVal = Math.max(...rawStages.map(s => s.value ?? 0), 1)

  // qual transição é o gargalo (a etapa de DESTINO da perda)
  const lossTargetIdx = (() => {
    const map: Record<Bottleneck, number> = { anuncio: 1, landing_page: 2, qualificacao: 3, fechamento: 4, velocidade: 4, saudavel: -1 }
    return map[dx.bottleneck] ?? -1
  })()

  const recs = presc.actions.slice(0, 3)

  return (
    <div style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* 1 — Card principal de diagnóstico */}
      <div style={{ padding: '20px 22px', borderRadius: '16px', background: `${statusCfg.color}0d`, border: `1px solid ${statusCfg.color}33` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ fontSize: '18px' }}>{statusCfg.icon}</span>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: statusCfg.color, margin: 0, letterSpacing: '-0.01em', lineHeight: 1.3 }}>{statusCfg.headline}</h2>
        </div>
        <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: 1.65, margin: 0 }}>{narrative.meaning}</p>
        {!isHealthy && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${statusCfg.color}22`, fontSize: '12px', color: C.text2 }}>
            <strong style={{ color: statusCfg.color }}>Recomendação principal:</strong> {presc.title.replace('Problema ', '').replace('no ', 'revisar ').replace('na ', 'revisar ').replace('do ', 'revisar ')}.
          </div>
        )}
      </div>

      {/* 2 — Funil visual em linguagem humana */}
      <div style={{ padding: '20px', borderRadius: '14px', background: C.surface, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: C.text3, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '16px' }}>
          Sua jornada de clientes
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {rawStages.map((s, i) => {
            const prev = rawStages[i - 1]
            const pct = i > 0 && prev?.value && s.value ? `${((s.value / prev.value) * 100).toFixed(1)}%` : null
            const widthPct = s.value != null ? (s.value / maxVal) * 100 : 22
            return (
              <FunnelStage key={s.label} label={s.label} value={s.value} pct={pct} isLoss={i === lossTargetIdx} widthPct={widthPct} />
            )
          })}
        </div>
        {rawStages.some(s => s.value == null) && (
          <p style={{ fontSize: '11px', color: C.text3, marginTop: '12px', lineHeight: 1.5 }}>
            Algumas etapas ainda não têm número preenchido. Complete-as no Modo Avançado para um diagnóstico mais preciso.
          </p>
        )}
      </div>

      {/* 3 — Onde você mais perde clientes */}
      {!isHealthy && (
        <div style={{ padding: '18px 20px', borderRadius: '14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '16px' }}>📉</span>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: C.text1, margin: 0 }}>Onde você mais perde clientes</h3>
          </div>
          <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: 1.65, margin: 0 }}>
            Seu maior ponto de perda está <strong style={{ color: C.red }}>{narrative.stageLoss}</strong>. {narrative.meaning}
          </p>
        </div>
      )}

      {/* 4 — Recomendações práticas (máx 3) */}
      {recs.length > 0 && (
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: C.text3, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '10px' }}>
            {isHealthy ? 'Como crescer com segurança' : 'O que fazer para perder menos clientes'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recs.map((action, i) => (
              <div key={i} style={{ padding: '14px 16px', borderRadius: '12px', background: C.surface, border: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, background: presc.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>{i + 1}</span>
                  <span style={{ fontSize: '13px', color: C.text1, lineHeight: 1.5, fontWeight: 500 }}>{action}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const, paddingLeft: '32px' }}>
                  <button
                    onClick={() => onNavigate?.('acoes')}
                    style={{ fontSize: '11px', fontWeight: 700, padding: '6px 12px', borderRadius: '7px', cursor: 'pointer', border: 'none', color: '#fff', background: presc.color }}
                  >
                    Ver o que fazer →
                  </button>
                  <button
                    onClick={() => askNous(`Como faço para "${action}"?`)}
                    style={{ fontSize: '11px', fontWeight: 600, padding: '6px 12px', borderRadius: '7px', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,58,237,0.25)', color: C.purpleHi }}
                  >
                    💬 Perguntar para a IA
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rodapé: versão técnica */}
      <div style={{ padding: '12px 16px', borderRadius: '10px', background: C.purpleBg, border: '1px solid rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <span style={{ fontSize: '11px', color: C.text3 }}>Quer ver o funil técnico completo (CTR, CPC, taxa de conversão)?</span>
        <button
          onClick={() => useAppStore.getState().setDashboardMode('pro')}
          style={{ flexShrink: 0, fontSize: '11px', fontWeight: 700, color: C.purpleHi, background: 'none', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '7px', padding: '5px 12px', cursor: 'pointer' }}
        >
          Modo Avançado ⚙
        </button>
      </div>
    </div>
  )
}
