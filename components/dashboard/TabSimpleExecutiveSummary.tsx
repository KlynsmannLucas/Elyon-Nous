// components/dashboard/TabSimpleExecutiveSummary.tsx — Resumo Executivo (Modo Simplificado)
// Consolida os diagnósticos (funil + saúde do negócio + auditoria) em um resumo em linguagem humana,
// pronto para copiar ou apresentar a cliente/sócio. Reaproveita diagnose() do funil.
'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { getBenchmark, BENCHMARKS } from '@/lib/niche_benchmarks'
import { diagnose, type Bottleneck } from './TabFunil'
import { askAIWithContext } from '@/lib/askAI'
import { isUsingSimpleDemoData, getDemoFunnelEntry, getDemoClientFields, getDemoRealMetrics } from '@/lib/simpleDemoData'
import { DemoDataButton } from './DemoDataButton'
import type { ClientData } from '@/lib/store'
import type { TabKey } from './DashboardSidebar'

interface Props {
  clientData: ClientData | null
  onNavigate?: (tab: TabKey) => void
}

const C = {
  surface:  '#0C1426',
  border:   'rgba(255,255,255,0.06)',
  purpleHi: '#A78BFA',
  purpleBg: 'rgba(124,58,237,0.08)',
  green:    '#22C55E',
  amber:    '#F59E0B',
  red:      '#EF4444',
  text1:    '#F1F5F9',
  text2:    '#94A3B8',
  text3:    'rgba(255,255,255,0.32)',
}

const LOSS_LABEL: Record<Bottleneck, string> = {
  anuncio: 'entre ver o anúncio e clicar',
  landing_page: 'entre clicar e entrar em contato',
  qualificacao: 'entre o contato e o perfil de compra',
  fechamento: 'entre o contato qualificado e a venda',
  velocidade: 'na velocidade de resposta',
  saudavel: '',
}

export function TabSimpleExecutiveSummary({ clientData, onNavigate }: Props) {
  const auditCache    = useAppStore(s => s.auditCache)
  const funnelEntries = useAppStore(s => s.funnelEntries)
  const [forClient, setForClient] = useState(false)
  const [copied, setCopied]       = useState(false)

  if (!clientData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: C.text3, fontSize: '13px' }}>
        Configure um cliente para gerar o resumo.
      </div>
    )
  }

  // ── Coleta de dados ─────────────────────────────────────────────────────────
  const key   = clientData.clientName
  const hist  = auditCache[key]
  const audit = Array.isArray(hist) ? hist[0]?.audit : (hist as any)?.audit ?? hist
  const demo  = isUsingSimpleDemoData()
  const df    = demo ? getDemoClientFields() : null
  const rm    = (audit?._realMetrics as any) || (demo ? getDemoRealMetrics() : null)
  const score = (audit?.health_score as number) ?? null

  const entry = funnelEntries.filter(e => e.clientName === key)[0] || (demo ? getDemoFunnelEntry(key) : undefined)
  const bench = getBenchmark(clientData.niche)
  const benchKey = bench ? (Object.keys(BENCHMARKS).find(k => BENCHMARKS[k] === bench) || 'outro') : 'outro'
  const dx    = entry ? diagnose(entry, benchKey) : null

  const ticket = clientData.ticketPrice || df?.ticketPrice || 0
  const margin = clientData.grossMargin || df?.grossMargin || 0
  const cvr    = clientData.conversionRate || df?.conversionRate || 0
  const cpl    = rm?.avgCPL || clientData.currentCPL || 0
  const marginPerSale = ticket > 0 && margin > 0 ? ticket * (margin / 100) : null
  const cac           = cpl > 0 && cvr > 0 ? cpl / (cvr / 100) : null
  const cacHigh   = cac != null && marginPerSale != null && cac > marginPerSale
  const marginLow = margin > 0 && margin < 20

  const hasData = !!entry || !!rm || (ticket > 0 && margin > 0)

  // ── Estado vazio ────────────────────────────────────────────────────────────
  if (!hasData) {
    const missing = [
      !ticket && 'Valor médio de cada venda (ticket)',
      !margin && 'Margem de lucro',
      !entry && 'Números do funil (viram → clicam → contatam → compram)',
      !rm && 'Conexão com a conta de anúncios',
    ].filter(Boolean) as string[]
    return (
      <div style={{ maxWidth: '640px' }}>
        <div style={{ padding: '32px 28px', borderRadius: '16px', background: C.surface, border: `1px solid ${C.border}`, textAlign: 'center' as const }}>
          <div style={{ fontSize: '40px', marginBottom: '14px' }}>📋</div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.text1, margin: '0 0 8px' }}>Ainda não dá para gerar um resumo preciso</h2>
          <p style={{ fontSize: '13px', color: C.text2, lineHeight: 1.6, margin: '0 0 18px' }}>Preencha alguns números para montar o resumo do seu negócio:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' as const, maxWidth: '340px', margin: '0 auto 20px' }}>
            {missing.map(t => <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: C.text2 }}><span style={{ color: C.purpleHi }}>○</span>{t}</div>)}
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' as const }}>
            <button onClick={() => onNavigate?.('overview')} style={{ padding: '10px 18px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #7C3AED, #A78BFA)' }}>Preencher meus números →</button>
            <button onClick={() => askAIWithContext({ source: 'resumo', title: 'Resumo Executivo', suggestedPrompt: 'Quais números preciso preencher para gerar um resumo do meu negócio?' })} style={{ padding: '10px 18px', borderRadius: '9px', fontSize: '13px', fontWeight: 600, color: C.purpleHi, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,58,237,0.25)', cursor: 'pointer' }}>💬 Perguntar para a IA</button>
            <DemoDataButton />
          </div>
        </div>
      </div>
    )
  }

  // ── Status geral ──────────────────────────────────────────────────────────────
  const critico = cacHigh || (dx && dx.score < 55) || marginLow
  const atencao = (dx && dx.bottleneck !== 'saudavel') || (cvr > 0 && cvr < 5) || (score != null && score < 70)
  const overall = critico ? 'critico' : atencao ? 'atencao' : 'bom'
  const overallCfg = {
    bom:     { icon: '🟢', label: 'Saudável', color: C.green },
    atencao: { icon: '🟡', label: 'Atenção',  color: C.amber },
    critico: { icon: '🔴', label: 'Crítico',  color: C.red },
  }[overall]

  // ── Conteúdo das seções (interno vs versão cliente) ──────────────────────────
  const negocioAgora = forClient
    ? `O negócio${clientData.city ? ` em ${clientData.city}` : ''} está em operação no setor de ${clientData.niche}, com investimento ativo em anúncios e geração de contatos.`
    : overall === 'bom'
    ? `Seu negócio está saudável: as campanhas trazem resultado e os números estão dentro do esperado para ${clientData.niche}.`
    : overall === 'atencao'
    ? `Seu negócio está vendendo, mas há pontos que limitam o crescimento e merecem atenção.`
    : `Seu negócio precisa de ajustes antes de crescer — alguns indicadores estão fora do ideal.`

  const gargalo = dx && dx.bottleneck !== 'saudavel'
    ? (forClient
        ? `A maior oportunidade está ${LOSS_LABEL[dx.bottleneck]} — é onde podemos recuperar mais resultado.`
        : `Seu principal gargalo está ${LOSS_LABEL[dx.bottleneck]}. É aí que você mais perde possíveis clientes hoje.`)
    : 'Não há um gargalo crítico no funil no momento — a jornada está convertendo bem.'

  const risco = cacHigh
    ? (forClient ? 'O custo de aquisição está próximo do limite saudável — recomendamos otimizar antes de aumentar o investimento.' : 'Maior risco: cada cliente está custando mais do que o lucro por venda. Corrigir isso é prioridade antes de escalar.')
    : marginLow
    ? (forClient ? 'A margem atual pede atenção antes de uma escala mais agressiva.' : 'Maior risco: margem apertada — sobra pouco lucro depois dos custos.')
    : (dx && dx.score < 55)
    ? (forClient ? 'Há uma etapa da jornada com espaço claro de melhoria.' : `Maior risco: perda relevante de clientes ${LOSS_LABEL[dx.bottleneck]}.`)
    : 'Sem riscos críticos no momento — manter o acompanhamento.'

  const fazerPrimeiro = cacHigh ? 'Reduzir o custo por cliente antes de investir mais.'
    : dx && dx.bottleneck !== 'saudavel' ? `Corrigir a etapa ${LOSS_LABEL[dx.bottleneck]}.`
    : marginLow ? 'Proteger a margem (preço, ticket, custos) antes de escalar.'
    : 'Escalar com segurança o que já funciona.'

  const proximas = (() => {
    if (cacHigh) return ['Pausar os anúncios mais caros', 'Melhorar os criativos com pouca resposta', 'Revisar a oferta antes de aumentar a verba']
    if (dx && dx.bottleneck === 'landing_page') return ['Revisar página/WhatsApp de destino', 'Deixar o botão de contato mais claro', 'Criar mensagem inicial pronta']
    if (dx && dx.bottleneck === 'anuncio') return ['Melhorar a imagem/vídeo do anúncio', 'Testar uma promessa mais clara', 'Revisar o público']
    if (dx && dx.bottleneck === 'fechamento') return ['Criar roteiro de atendimento', 'Criar follow-up de 24h e 48h', 'Revisar proposta/preço']
    if (dx && dx.bottleneck === 'qualificacao') return ['Criar perguntas de qualificação', 'Ajustar a promessa para o perfil certo', 'Filtrar curiosos no atendimento']
    if (marginLow) return ['Revisar ticket médio', 'Criar combo/upsell', 'Evitar escalar sem lucro']
    return ['Aumentar o orçamento aos poucos', 'Duplicar os anúncios que funcionam', 'Acompanhar o custo por venda']
  })()

  const evitar = cacHigh ? 'Evite aumentar o orçamento agora — escalar com custo alto aumenta o prejuízo.'
    : marginLow ? 'Evite escalar campanhas enquanto a margem estiver apertada.'
    : dx && dx.bottleneck !== 'saudavel' ? 'Evite investir mais em tráfego antes de corrigir o gargalo — você só perderia mais gente no mesmo ponto.'
    : 'Evite mudanças bruscas no que já está funcionando — escale com calma.'

  // ── Texto para copiar ─────────────────────────────────────────────────────────
  const plainText =
`RESUMO EXECUTIVO — ${clientData.clientName}
Status geral: ${overallCfg.icon} ${overallCfg.label}

COMO ESTÁ O NEGÓCIO
${negocioAgora}

PRINCIPAL GARGALO
${gargalo}

MAIOR RISCO
${risco}

O QUE FAZER PRIMEIRO
${fazerPrimeiro}

PRÓXIMAS 3 AÇÕES
1. ${proximas[0]}
2. ${proximas[1]}
3. ${proximas[2]}

O QUE EVITAR AGORA
${evitar}

— Gerado pela ELYON`

  function copy() {
    navigator.clipboard?.writeText(plainText).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const Section = ({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) => (
    <div style={{ padding: '14px 16px', borderRadius: '12px', background: C.surface, border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: C.text3, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '6px' }}>{icon} {title}</div>
      <div style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: 1.65 }}>{children}</div>
    </div>
  )

  return (
    <div style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Toggle versão + ações */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' as const }}>
        <div style={{ display: 'flex', gap: '2px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '3px' }}>
          {[{ k: false, l: 'Para mim' }, { k: true, l: 'Para o cliente' }].map(o => (
            <button key={String(o.k)} onClick={() => setForClient(o.k)} style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none', background: forClient === o.k ? 'rgba(124,58,237,0.14)' : 'transparent', color: forClient === o.k ? C.purpleHi : C.text3 }}>{o.l}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={copy} style={{ fontSize: '12px', fontWeight: 700, padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', border: 'none', color: copied ? C.green : '#fff', background: copied ? 'rgba(34,197,94,0.12)' : 'linear-gradient(135deg, #7C3AED, #A78BFA)' }}>
            {copied ? '✓ Copiado' : '📋 Copiar resumo'}
          </button>
          <button onClick={() => askAIWithContext({ source: 'resumo', title: 'Resumo Executivo', problem: risco, suggestedPrompt: 'Explique esse resumo em linguagem simples e me diga quais decisões eu devo evitar agora.' })} style={{ fontSize: '12px', fontWeight: 600, padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,58,237,0.25)', color: C.purpleHi }}>
            💬 Perguntar para a IA
          </button>
        </div>
      </div>

      {/* Card principal de status */}
      <div style={{ padding: '20px 22px', borderRadius: '16px', background: `${overallCfg.color}0d`, border: `1px solid ${overallCfg.color}33` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ fontSize: '18px' }}>{overallCfg.icon}</span>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: overallCfg.color, margin: 0 }}>Status geral: {overallCfg.label}</h2>
        </div>
        <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: 1.65, margin: '0 0 8px' }}>{negocioAgora}</p>
        <div style={{ fontSize: '12px', color: overallCfg.color, fontWeight: 600 }}>🎯 Prioridade: {fazerPrimeiro}</div>
      </div>

      {/* Seções do resumo */}
      <Section icon="📊" title="Como está o negócio agora">{negocioAgora}</Section>
      <Section icon="🔻" title="Onde está o principal gargalo">{gargalo}</Section>
      <Section icon="⚠️" title="Maior risco atual">{risco}</Section>
      <Section icon="🎯" title="O que fazer primeiro">{fazerPrimeiro}</Section>

      <div style={{ padding: '14px 16px', borderRadius: '12px', background: C.purpleBg, border: '1px solid rgba(124,58,237,0.18)' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: C.purpleHi, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '10px' }}>🚀 Próximas 3 ações</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {proximas.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, background: 'rgba(124,58,237,0.2)', color: C.purpleHi, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800 }}>{i + 1}</span>
              <span style={{ fontSize: '13px', color: C.text1 }}>{p}</span>
            </div>
          ))}
        </div>
        <button onClick={() => onNavigate?.('acoes')} style={{ marginTop: '12px', fontSize: '11px', fontWeight: 700, padding: '6px 12px', borderRadius: '7px', cursor: 'pointer', border: 'none', color: '#fff', background: 'linear-gradient(135deg, #7C3AED, #A78BFA)' }}>
          Ver plano de ação completo →
        </button>
      </div>

      <Section icon="🚫" title="O que evitar agora">{evitar}</Section>

      {/* Rodapé */}
      <div style={{ padding: '12px 16px', borderRadius: '10px', background: C.purpleBg, border: '1px solid rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <span style={{ fontSize: '11px', color: C.text3 }}>Quer um relatório técnico completo em PDF?</span>
        <button onClick={() => { useAppStore.getState().setDashboardMode('pro'); onNavigate?.('relatorios') }} style={{ flexShrink: 0, fontSize: '11px', fontWeight: 700, color: C.purpleHi, background: 'none', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '7px', padding: '5px 12px', cursor: 'pointer' }}>
          Ir para Relatórios ⚙
        </button>
      </div>
    </div>
  )
}
