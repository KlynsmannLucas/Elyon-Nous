// components/dashboard/TabSimpleActionPlan.tsx — Plano de Ação (Modo Simplificado)
// Transforma diagnósticos em ações priorizadas. Reaproveita diagnose() do funil + unit economics.
// A versão técnica (TabAcoes) permanece intacta no modo avançado.
'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { getBenchmark, BENCHMARKS } from '@/lib/niche_benchmarks'
import { diagnose, type Bottleneck } from './TabFunil'
import type { ClientData } from '@/lib/store'
import type { TabKey } from './DashboardSidebar'

interface Props {
  clientData: ClientData | null
  onNavigate?: (tab: TabKey) => void
}

const STATUS_KEY = 'dashboard_simple_action_plan_status'
type Status = 'pendente' | 'em_andamento' | 'concluido'

const C = {
  surface:  '#0C1426',
  border:   'rgba(255,255,255,0.06)',
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

const IMPACT = { Alto: C.green, Médio: C.amber, Baixo: C.text3 } as const
const STATUS_META: Record<Status, { label: string; color: string }> = {
  pendente:     { label: 'Pendente',     color: C.text3 },
  em_andamento: { label: 'Em andamento', color: C.amber },
  concluido:    { label: 'Concluído',    color: C.green },
}

interface Action {
  id: string
  title: string
  why: string
  impact: 'Alto' | 'Médio' | 'Baixo'
  effort: 'Alto' | 'Médio' | 'Baixo'
  prazo: 'Hoje' | '24h' | '48h' | 'Esta semana'
  detail: string
}

function askNous(question: string) {
  window.dispatchEvent(new CustomEvent('elyon:open-nous', { detail: { question } }))
}

// ── Templates de ações por problema ───────────────────────────────────────────
const FUNNEL_ACTIONS: Record<Bottleneck, Action[]> = {
  anuncio: [
    { id: 'f_anuncio_1', title: 'Melhorar a imagem ou vídeo do anúncio', why: 'Poucas pessoas clicam depois de ver — o criativo não está chamando atenção.', impact: 'Alto', effort: 'Médio', prazo: '48h', detail: 'Crie 2-3 versões com imagens/ângulos diferentes. Teste qual chama mais atenção nos primeiros 3 segundos.' },
    { id: 'f_anuncio_2', title: 'Testar uma promessa mais clara', why: 'A mensagem pode não estar deixando claro o benefício para o cliente.', impact: 'Médio', effort: 'Baixo', prazo: '24h', detail: 'Reescreva a primeira frase respondendo: "o que a pessoa ganha?" de forma direta.' },
    { id: 'f_anuncio_3', title: 'Revisar o público dos anúncios', why: 'O anúncio pode estar chegando para as pessoas erradas.', impact: 'Médio', effort: 'Médio', prazo: 'Esta semana', detail: 'Ajuste idade, região e interesses para focar em quem realmente compra de você.' },
  ],
  landing_page: [
    { id: 'f_lp_1', title: 'Revisar a página ou WhatsApp de destino', why: 'As pessoas clicam mas não avançam para o contato — algo trava no caminho.', impact: 'Alto', effort: 'Médio', prazo: '48h', detail: 'Abra o link do anúncio no celular. Está rápido? Está claro o que fazer? O botão de contato aparece logo?' },
    { id: 'f_lp_2', title: 'Deixar o botão de contato mais claro', why: 'Se a pessoa não vê como falar com você, ela desiste.', impact: 'Médio', effort: 'Baixo', prazo: 'Hoje', detail: 'Coloque um botão grande de WhatsApp no topo e no fim da página, com texto direto: "Falar agora".' },
    { id: 'f_lp_3', title: 'Criar uma mensagem inicial pronta no WhatsApp', why: 'Facilitar o primeiro contato aumenta a chance da pessoa chamar.', impact: 'Médio', effort: 'Baixo', prazo: '24h', detail: 'Configure uma mensagem automática de boas-vindas e uma pergunta simples para iniciar a conversa.' },
  ],
  qualificacao: [
    { id: 'f_qual_1', title: 'Criar perguntas de qualificação', why: 'Você recebe contatos, mas muitos não têm perfil de compra.', impact: 'Alto', effort: 'Baixo', prazo: '24h', detail: 'Crie 2-3 perguntas para entender se a pessoa tem o perfil (orçamento, urgência, necessidade).' },
    { id: 'f_qual_2', title: 'Ajustar a promessa para atrair o perfil certo', why: 'A comunicação pode estar atraindo curiosos em vez de compradores.', impact: 'Médio', effort: 'Médio', prazo: 'Esta semana', detail: 'Seja específico sobre para quem é o serviço (e para quem não é) já no anúncio.' },
    { id: 'f_qual_3', title: 'Filtrar curiosos no atendimento', why: 'Gastar tempo com quem não vai comprar reduz sua eficiência.', impact: 'Médio', effort: 'Baixo', prazo: 'Esta semana', detail: 'Use as perguntas de qualificação logo no início da conversa para focar nos contatos certos.' },
  ],
  fechamento: [
    { id: 'f_fech_1', title: 'Criar um roteiro de atendimento', why: 'Os contatos têm perfil bom, mas poucos fecham — falta consistência na venda.', impact: 'Alto', effort: 'Médio', prazo: 'Esta semana', detail: 'Monte um passo a passo: acolhida → entender a dor → apresentar solução → proposta → fechamento.' },
    { id: 'f_fech_2', title: 'Criar follow-up de 24h e 48h', why: 'Muitas vendas se perdem por falta de acompanhamento.', impact: 'Alto', effort: 'Baixo', prazo: '24h', detail: 'Defina 2 mensagens de retorno: uma em 24h e outra em 48h após a proposta, de forma natural.' },
    { id: 'f_fech_3', title: 'Revisar proposta, preço ou condição', why: 'Pode haver uma objeção recorrente travando o fechamento.', impact: 'Médio', effort: 'Médio', prazo: 'Esta semana', detail: 'Liste as 3 objeções mais comuns e prepare uma resposta clara para cada uma.' },
  ],
  velocidade: [
    { id: 'f_vel_1', title: 'Responder os contatos mais rápido', why: 'Contatos esfriam rápido — responder em minutos aumenta muito a conversão.', impact: 'Alto', effort: 'Baixo', prazo: 'Hoje', detail: 'Configure notificação de novos contatos e responda em até 15 minutos no horário comercial.' },
    { id: 'f_vel_2', title: 'Configurar resposta automática no WhatsApp', why: 'Atender 24/7 evita perder o contato enquanto você não está disponível.', impact: 'Médio', effort: 'Baixo', prazo: '24h', detail: 'Use o WhatsApp Business para enviar uma mensagem imediata de boas-vindas e qualificação.' },
  ],
  saudavel: [
    { id: 's_scale_1', title: 'Aumentar o orçamento aos poucos', why: 'Sua jornada está saudável — é hora de crescer com segurança.', impact: 'Alto', effort: 'Baixo', prazo: 'Esta semana', detail: 'Aumente 15-20% por semana nas campanhas que trazem clientes baratos e monitore o custo.' },
    { id: 's_scale_2', title: 'Duplicar os anúncios que funcionam', why: 'Replicar o que já dá resultado é o caminho mais rápido de crescer.', impact: 'Médio', effort: 'Baixo', prazo: 'Esta semana', detail: 'Crie variações dos melhores anúncios com pequenas mudanças de imagem e texto.' },
  ],
}

const CAC_ACTIONS: Action[] = [
  { id: 'cac_1', title: 'Pausar os anúncios mais caros', why: 'Você está pagando caro por cliente — alguns anúncios consomem verba sem retorno.', impact: 'Alto', effort: 'Baixo', prazo: 'Hoje', detail: 'Identifique os anúncios com maior custo por contato e pause os que estão muito acima da média.' },
  { id: 'cac_2', title: 'Melhorar os criativos com pouca resposta', why: 'Criativos fracos elevam o custo de aquisição.', impact: 'Médio', effort: 'Médio', prazo: '48h', detail: 'Troque imagem e chamada dos anúncios que têm pouco engajamento por versões novas.' },
  { id: 'cac_3', title: 'Revisar a oferta antes de aumentar a verba', why: 'Escalar com custo alto só aumenta o prejuízo.', impact: 'Médio', effort: 'Médio', prazo: 'Esta semana', detail: 'Garanta que a oferta é clara e atraente antes de investir mais dinheiro.' },
]

const MARGIN_ACTIONS: Action[] = [
  { id: 'mar_1', title: 'Revisar seu ticket médio', why: 'Margem apertada deixa pouco lucro depois dos custos.', impact: 'Alto', effort: 'Médio', prazo: 'Esta semana', detail: 'Avalie se dá para aumentar o preço ou agregar valor para subir o valor médio por venda.' },
  { id: 'mar_2', title: 'Criar um combo ou upsell', why: 'Vender mais por cliente melhora a margem sem aumentar o custo de aquisição.', impact: 'Médio', effort: 'Médio', prazo: 'Esta semana', detail: 'Ofereça um produto/serviço complementar no momento da compra.' },
  { id: 'mar_3', title: 'Evitar escalar campanhas sem lucro', why: 'Crescer no prejuízo só aumenta o problema.', impact: 'Alto', effort: 'Baixo', prazo: 'Hoje', detail: 'Mantenha o investimento estável até garantir que cada venda dá lucro real.' },
]

const SETUP_ACTIONS: Action[] = [
  { id: 'setup_1', title: 'Organizar seus números principais', why: 'Sem dados, não dá para saber o que melhorar primeiro.', impact: 'Alto', effort: 'Baixo', prazo: 'Hoje', detail: 'Anote: quanto investiu, quantos contatos recebeu, quantas vendas fez e o valor médio de cada venda.' },
  { id: 'setup_2', title: 'Definir seu objetivo da semana', why: 'Ter um foco claro evita dispersão e acelera resultados.', impact: 'Médio', effort: 'Baixo', prazo: 'Hoje', detail: 'Escolha um objetivo único: mais contatos, mais vendas ou menor custo.' },
  { id: 'setup_3', title: 'Revisar onde os contatos estão chegando', why: 'Saber a origem dos contatos ajuda a investir no que funciona.', impact: 'Médio', effort: 'Baixo', prazo: '24h', detail: 'Confirme se os contatos chegam por WhatsApp, formulário ou direct — e qual traz mais clientes.' },
]

export function TabSimpleActionPlan({ clientData, onNavigate }: Props) {
  const auditCache    = useAppStore(s => s.auditCache)
  const funnelEntries = useAppStore(s => s.funnelEntries)

  const [statuses, setStatuses] = useState<Record<string, Status>>({})
  const [expanded, setExpanded] = useState<string | null>(null)

  const clientKey = clientData?.clientName || ''

  // Carrega status do localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STATUS_KEY)
      if (raw) {
        const all = JSON.parse(raw)
        setStatuses(all[clientKey] || {})
      }
    } catch {}
  }, [clientKey])

  function setStatus(id: string, next: Status) {
    setStatuses(prev => {
      const updated = { ...prev, [id]: next }
      try {
        const raw = localStorage.getItem(STATUS_KEY)
        const all = raw ? JSON.parse(raw) : {}
        all[clientKey] = updated
        localStorage.setItem(STATUS_KEY, JSON.stringify(all))
      } catch {}
      return updated
    })
  }
  function cycleStatus(id: string) {
    const cur = statuses[id] || 'pendente'
    setStatus(id, cur === 'pendente' ? 'em_andamento' : cur === 'em_andamento' ? 'concluido' : 'pendente')
  }

  if (!clientData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: C.text3, fontSize: '13px' }}>
        Configure um cliente para ver o plano de ação.
      </div>
    )
  }

  // ── Detecta problemas ─────────────────────────────────────────────────────
  const hist  = auditCache[clientKey]
  const audit = Array.isArray(hist) ? hist[0]?.audit : (hist as any)?.audit ?? hist
  const rm    = audit?._realMetrics as any

  const entries = funnelEntries.filter(e => e.clientName === clientKey)
  const entry   = entries[0]
  const bench   = getBenchmark(clientData.niche)
  const benchKey = bench ? (Object.keys(BENCHMARKS).find(k => BENCHMARKS[k] === bench) || 'outro') : 'outro'
  const dx      = entry ? diagnose(entry, benchKey) : null

  const ticket = clientData.ticketPrice || 0
  const margin = clientData.grossMargin || 0
  const cvr    = clientData.conversionRate || 0
  const cpl    = rm?.avgCPL || clientData.currentCPL || 0
  const marginPerSale = ticket > 0 && margin > 0 ? ticket * (margin / 100) : null
  const cac           = cpl > 0 && cvr > 0 ? cpl / (cvr / 100) : null
  const cacHigh   = cac != null && marginPerSale != null && cac > marginPerSale
  const marginLow = margin > 0 && margin < 20

  const hasAnyData = !!entry || !!rm || (ticket > 0 && margin > 0)

  // ── Monta lista priorizada de ações ──────────────────────────────────────────
  let actions: Action[] = []
  let focus: { icon: string; color: string; headline: string; rec: string }

  if (!hasAnyData) {
    actions = SETUP_ACTIONS
    focus = { icon: '🟡', color: C.amber, headline: 'Vamos organizar seu ponto de partida', rec: 'Preencha seus números principais para receber um plano mais certeiro. Por enquanto, comece pela organização básica.' }
  } else if (cacHigh) {
    actions = [...CAC_ACTIONS, ...(dx && dx.bottleneck !== 'saudavel' ? FUNNEL_ACTIONS[dx.bottleneck].slice(0, 2) : [])]
    focus = { icon: '🔴', color: C.red, headline: 'Prioridade: baixar o custo por cliente', rec: 'Cada cliente está custando mais do que o lucro por venda. Corrija isso antes de aumentar o investimento.' }
  } else if (dx && dx.bottleneck !== 'saudavel') {
    const lossLabel: Record<Bottleneck, string> = {
      anuncio: 'entre ver o anúncio e clicar', landing_page: 'entre clicar e entrar em contato',
      qualificacao: 'entre o contato e o perfil de compra', fechamento: 'entre o contato qualificado e a venda',
      velocidade: 'na velocidade de resposta', saudavel: '',
    }
    actions = [...FUNNEL_ACTIONS[dx.bottleneck], ...(marginLow ? MARGIN_ACTIONS.slice(0, 1) : [])]
    focus = { icon: dx.score < 55 ? '🔴' : '🟡', color: dx.score < 55 ? C.red : C.amber, headline: `Corrigir o ponto de maior perda: ${lossLabel[dx.bottleneck]}`, rec: 'É aqui que você mais perde possíveis clientes. Resolver essa etapa traz o maior ganho agora.' }
  } else if (marginLow) {
    actions = MARGIN_ACTIONS
    focus = { icon: '🟡', color: C.amber, headline: 'Prioridade: proteger sua margem', rec: 'Mesmo vendendo, sobra pouco lucro. Ajuste isso antes de escalar.' }
  } else {
    actions = FUNNEL_ACTIONS.saudavel
    focus = { icon: '🟢', color: C.green, headline: 'Tudo certo — hora de crescer com segurança', rec: 'Seus indicadores estão saudáveis. Foque em escalar o que já funciona, com cuidado.' }
  }

  // dedupe + cap em 5
  const seen = new Set<string>()
  actions = actions.filter(a => (seen.has(a.id) ? false : (seen.add(a.id), true))).slice(0, 5)

  const doneCount = actions.filter(a => statuses[a.id] === 'concluido').length

  return (
    <div style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* 1 — Card principal de prioridade */}
      <div style={{ padding: '20px 22px', borderRadius: '16px', background: `${focus.color}0d`, border: `1px solid ${focus.color}33` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ fontSize: '18px' }}>{focus.icon}</span>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: focus.color, margin: 0, letterSpacing: '-0.01em', lineHeight: 1.3 }}>{focus.headline}</h2>
        </div>
        <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: 1.65, margin: 0 }}>{focus.rec}</p>
        {actions.length > 0 && (
          <div style={{ marginTop: '12px', fontSize: '11px', color: focus.color, fontWeight: 600 }}>
            {doneCount} de {actions.length} ações concluídas
          </div>
        )}
      </div>

      {/* Estado vazio: lista de números que faltam */}
      {!hasAnyData && (
        <div style={{ padding: '16px 18px', borderRadius: '12px', background: C.surface, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: C.text1, marginBottom: '6px' }}>Ainda não dá para montar um plano preciso</div>
          <p style={{ fontSize: '12px', color: C.text2, lineHeight: 1.6, margin: '0 0 12px' }}>Preencha seus principais números para receber ações mais certeiras:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' }}>
            {['Quanto investe por mês', 'Quantos contatos recebe', 'Quantas vendas faz', 'Valor médio de cada venda'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: C.text2 }}><span style={{ color: C.purpleHi }}>○</span>{t}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
            <button onClick={() => onNavigate?.('overview')} style={{ fontSize: '12px', fontWeight: 700, padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', border: 'none', color: '#fff', background: 'linear-gradient(135deg, #7C3AED, #A78BFA)' }}>Preencher meus números →</button>
            <button onClick={() => askNous('Quais números preciso preencher para ter um plano de ação?')} style={{ fontSize: '12px', fontWeight: 600, padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,58,237,0.25)', color: C.purpleHi }}>💬 Perguntar para a IA</button>
          </div>
        </div>
      )}

      {/* 2 — Lista de ações priorizadas */}
      <div>
        <div style={{ fontSize: '10px', fontWeight: 700, color: C.text3, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '10px' }}>
          Suas ações em ordem de prioridade
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {actions.map((a, i) => {
            const st = statuses[a.id] || 'pendente'
            const done = st === 'concluido'
            const isTop = i < 3
            const isFirst = i === 0
            const stCfg = STATUS_META[st]
            return (
              <div key={a.id} style={{
                padding: isFirst ? '18px 20px' : '14px 16px', borderRadius: '12px',
                background: isFirst ? 'rgba(124,58,237,0.07)' : C.surface,
                border: `1px solid ${isFirst ? 'rgba(124,58,237,0.28)' : C.border}`,
                opacity: done ? 0.6 : 1, transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  {/* número / prioridade */}
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0, marginTop: '1px', background: done ? C.green : isFirst ? 'linear-gradient(135deg, #7C3AED, #A78BFA)' : 'rgba(255,255,255,0.06)', color: done || isFirst ? '#fff' : C.text2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>
                    {done ? '✓' : i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const, marginBottom: '2px' }}>
                      {isFirst && !done && <span style={{ fontSize: '9px', fontWeight: 800, color: C.purpleHi, background: 'rgba(124,58,237,0.15)', padding: '2px 7px', borderRadius: '99px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Comece por aqui</span>}
                      <span style={{ fontSize: isFirst ? '15px' : '13px', fontWeight: 700, color: done ? C.text3 : C.text1, textDecoration: done ? 'line-through' : 'none', lineHeight: 1.35 }}>{a.title}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: C.text2, lineHeight: 1.55, margin: '2px 0 10px' }}>{a.why}</p>

                    {/* meta: impacto / esforço / prazo */}
                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' as const, marginBottom: '10px', fontSize: '11px' }}>
                      <span style={{ color: C.text3 }}>Impacto <strong style={{ color: IMPACT[a.impact] }}>{a.impact}</strong></span>
                      <span style={{ color: C.text3 }}>Esforço <strong style={{ color: C.text2 }}>{a.effort}</strong></span>
                      <span style={{ color: C.text3 }}>Prazo <strong style={{ color: C.text2 }}>{a.prazo}</strong></span>
                    </div>

                    {/* detalhe expandível */}
                    {expanded === a.id && (
                      <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', marginBottom: '10px', fontSize: '12px', color: '#CBD5E1', lineHeight: 1.6 }}>
                        {a.detail}
                      </div>
                    )}

                    {/* botões */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                      <button onClick={() => setExpanded(expanded === a.id ? null : a.id)} style={{ fontSize: '11px', fontWeight: 700, padding: '6px 12px', borderRadius: '7px', cursor: 'pointer', border: 'none', color: '#fff', background: isFirst ? 'linear-gradient(135deg, #7C3AED, #A78BFA)' : 'rgba(124,58,237,0.5)' }}>
                        {expanded === a.id ? 'Ocultar' : 'Ver o que fazer'}
                      </button>
                      <button onClick={() => askNous(`Como faço para "${a.title}"?`)} style={{ fontSize: '11px', fontWeight: 600, padding: '6px 12px', borderRadius: '7px', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,58,237,0.25)', color: C.purpleHi }}>
                        💬 Perguntar para a IA
                      </button>
                      <button onClick={() => setStatus(a.id, done ? 'pendente' : 'concluido')} style={{ fontSize: '11px', fontWeight: 600, padding: '6px 12px', borderRadius: '7px', cursor: 'pointer', background: done ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${done ? 'rgba(34,197,94,0.3)' : C.border}`, color: done ? C.green : C.text2 }}>
                        {done ? '✓ Concluído' : 'Marcar como concluído'}
                      </button>
                    </div>
                  </div>

                  {/* status pill (clicável, cicla os 3 estados) */}
                  <button onClick={() => cycleStatus(a.id)} title="Toque para mudar o status" style={{ flexShrink: 0, fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '99px', cursor: 'pointer', background: `${stCfg.color}18`, border: `1px solid ${stCfg.color}30`, color: stCfg.color }}>
                    {stCfg.label}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Rodapé */}
      <div style={{ padding: '12px 16px', borderRadius: '10px', background: C.purpleBg, border: '1px solid rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <span style={{ fontSize: '11px', color: C.text3 }}>Quer ver o plano de ações técnico completo (por campanha, urgência, responsável)?</span>
        <button onClick={() => useAppStore.getState().setDashboardMode('pro')} style={{ flexShrink: 0, fontSize: '11px', fontWeight: 700, color: C.purpleHi, background: 'none', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '7px', padding: '5px 12px', cursor: 'pointer' }}>
          Modo Avançado ⚙
        </button>
      </div>
    </div>
  )
}
