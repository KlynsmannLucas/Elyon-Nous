// app/(elyon)/estudio/page.tsx - Estúdio de Criação (hub operacional).
// Transforma sinais reais da conta em fila de criação, teste e otimização.
'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { Badge, Button, Icon, NousOrb } from '@/components/dashboard/v2'

interface Tool {
  k: string; n: number; icon: string; title: string; badge?: string
  desc: string; stat: string; verb: string
  c: string; soft: string; line: string; accent: string
}

type StudioTone = 'good' | 'bad' | 'warn' | 'blue' | 'neutral'

interface StudioAction {
  id: string
  title: string
  body: string
  href: string
  cta: string
  icon: string
  tone: StudioTone
  meta: string
  priority: number
}

const TOOLS: Tool[] = [
  { k: 'criar', n: 1, icon: 'rocket', title: 'Criar campanha', badge: 'IA',
    desc: 'Descreva a intenção e o NOUS monta público, verba e criativo para revisão.',
    stat: '~2 min para revisar', verb: 'Criar agora',
    c: 'var(--blue-600)', soft: 'var(--blue-soft)', line: 'var(--blue-line)', accent: 'var(--blue)' },
  { k: 'biblioteca', n: 2, icon: 'image', title: 'Biblioteca',
    desc: 'Organize assets e conecte criativos aos aprendizados da conta.',
    stat: 'Ativos e variações', verb: 'Abrir biblioteca',
    c: 'var(--teal)', soft: 'rgba(14,156,176,.10)', line: 'rgba(14,156,176,.28)', accent: 'var(--teal)' },
  { k: 'conteudo', n: 3, icon: 'megaphone', title: 'Conteúdo',
    desc: 'Gere posts por plataforma usando memória e ângulos que já funcionaram.',
    stat: '6 plataformas', verb: 'Gerar conteúdo',
    c: 'var(--amber)', soft: 'var(--amber-soft)', line: 'rgba(217,135,11,.28)', accent: 'var(--amber)' },
  { k: 'abtest', n: 4, icon: 'scale', title: 'Teste A/B',
    desc: 'Compare variantes por conversão, CTR e custo real por resultado.',
    stat: 'Vencedor por dados', verb: 'Ver testes',
    c: '#565862', soft: 'rgba(100,116,139,.10)', line: 'rgba(100,116,139,.28)', accent: '#565862' },
  { k: 'cro', n: 5, icon: 'target', title: 'Otimização (CRO)',
    desc: 'Encontre gargalos de conversão e transforme recomendações em ação.',
    stat: 'Impacto no CPL', verb: 'Otimizar',
    c: 'var(--green-600)', soft: 'var(--green-soft)', line: 'var(--green-line)', accent: 'var(--green)' },
]

const FLOW: [string, string][] = [
  ['Criar', 'rocket'], ['Guardar', 'image'], ['Produzir', 'megaphone'], ['Testar', 'scale'], ['Otimizar', 'target'],
]

const EXAMPLES = [
  'Quero gerar leads pelo WhatsApp com R$ 150/dia',
  'Criar variação para uma campanha vencedora sem mexer no aprendizado',
  'Renovar criativo com frequência alta antes do CPL subir',
]

const OBJECTIVES = [
  { label: 'Formulário', icon: 'clipboard', hint: 'Lead form Meta', intent: 'Criar campanha Meta Ads para gerar leads por formulário instantâneo. Separar o resultado como formulário, não misturar com WhatsApp ou ligação.' },
  { label: 'WhatsApp', icon: 'send', hint: 'Conversas', intent: 'Criar campanha Meta Ads focada em conversas no WhatsApp. Separar resultado como conversa no WhatsApp e sugerir criativo direto para atendimento.' },
  { label: 'Ligação', icon: 'pulse', hint: 'Chamadas', intent: 'Criar campanha para gerar ligações qualificadas. Separar resultado como ligação e priorizar horário comercial.' },
  { label: 'Conversão no site', icon: 'target', hint: 'Pixel/CAPI', intent: 'Criar campanha para conversão no site. Validar pixel, evento principal, URL e UTM antes de ativar.' },
  { label: 'Compra', icon: 'money', hint: 'Vendas', intent: 'Criar campanha de vendas/compras com leitura separada de compra, receita e ROAS.' },
  { label: 'Tráfego qualificado', icon: 'link', hint: 'Cliques/LPV', intent: 'Criar campanha de tráfego qualificado para landing page, medindo visualização de página e cliques separadamente.' },
]

const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n || 0)
const int = (n: number) => new Intl.NumberFormat('pt-BR').format(n || 0)

function auditFrom(history: any): { audit: any | null; createdAt: string | null } {
  const entry = Array.isArray(history) ? history[0] : history
  if (!entry) return { audit: null, createdAt: null }
  return { audit: entry.audit || entry, createdAt: entry.createdAt || null }
}

function resultValueOf(c: any) {
  return Number(c?.results ?? c?.primaryResultValue ?? c?.leads ?? c?.leads30 ?? 0)
}

function resultLabelOf(c: any) {
  return c?.resultLabel || c?.primaryResultLabel || 'resultados'
}

function costPerResultOf(c: any) {
  const cost = Number(c?.costPerResult || c?.cpl || c?.cpl30 || 0)
  if (cost > 0) return Math.round(cost)
  const value = resultValueOf(c)
  return value > 0 ? Math.round((Number(c?.spend || c?.spend30 || 0)) / value) : null
}

function campaignsFromAudit(audit: any) {
  const cc = audit?._campanhasClassificadas
  if (!cc) return []
  return [
    ...(cc.criticas || []).map((c: any) => ({ ...c, _s: 'critica' })),
    ...(cc.vencedoras || []).map((c: any) => ({ ...c, _s: 'vencedora' })),
    ...(cc.atencao || []).map((c: any) => ({ ...c, _s: 'atencao' })),
  ].sort((a: any, b: any) => Number(b.spend || b.spend30 || 0) - Number(a.spend || a.spend30 || 0))
}

function createHref(intent: string) {
  return `/criar?intent=${encodeURIComponent(intent)}`
}

function ToolCard({ t, onNav, i }: { t: Tool; onNav: (k: string) => void; i: number }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={() => onNav(t.k)} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      className="animate-fade-up text-left flex flex-col gap-3 bg-paper rounded-lg p-[18px] transition-all"
      style={{ animationDelay: `${i * 0.05}s`, border: `1px solid ${h ? t.line : 'var(--line)'}`, boxShadow: h ? 'var(--sh-2)' : 'var(--sh-1)', transform: h ? 'translateY(-3px)' : 'none' }}
    >
      <div className="flex items-center justify-between">
        <span className="w-[42px] h-[42px] rounded-md flex items-center justify-center shrink-0" style={{ background: t.soft, color: t.c }}><Icon name={t.icon} size={20} /></span>
        <span className="font-mono text-[11px] font-semibold text-ink-4">0{t.n}</span>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base font-bold text-ink" style={{ letterSpacing: '-0.02em' }}>{t.title}</span>
          {t.badge && <Badge tone="blue">{t.badge}</Badge>}
        </div>
        <p className="text-[13px] text-ink-2 leading-relaxed m-0">{t.desc}</p>
      </div>
      <div className="mt-auto pt-3 border-t border-line-2 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold" style={{ color: t.c }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.accent }} />{t.stat}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors" style={{ color: h ? t.c : 'var(--ink-3)' }}>
          {t.verb} <Icon name="arrowR" size={14} />
        </span>
      </div>
    </button>
  )
}

function ActionCard({ action, onOpen }: { action: StudioAction; onOpen: () => void }) {
  const toneColor: Record<StudioTone, string> = {
    good: 'var(--green)', bad: 'var(--red)', warn: 'var(--amber)', blue: 'var(--blue)', neutral: 'var(--ink-3)',
  }
  const toneBg: Record<StudioTone, string> = {
    good: 'var(--green-soft)', bad: 'var(--red-soft)', warn: 'var(--amber-soft)', blue: 'var(--blue-soft)', neutral: 'var(--canvas-2)',
  }
  return (
    <button onClick={onOpen} className="text-left rounded-md border border-line bg-paper p-3.5 hover-lift hover:shadow-card-hover transition-all">
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-md flex items-center justify-center shrink-0" style={{ background: toneBg[action.tone], color: toneColor[action.tone] }}>
          <Icon name={action.icon} size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[13.5px] font-bold text-ink">{action.title}</span>
            <Badge tone={action.tone} dot>{action.meta}</Badge>
          </div>
          <p className="text-[12.5px] text-ink-2 leading-relaxed m-0">{action.body}</p>
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-blue mt-2">
            {action.cta} <Icon name="arrowR" size={13} />
          </span>
        </div>
      </div>
    </button>
  )
}

export default function EstudioPage() {
  const router = useRouter()
  const [intent, setIntent] = useState('')
  const clientData = useAppStore(s => s.clientData)
  const savedClients = useAppStore(s => s.savedClients)
  const auditCache = useAppStore(s => s.auditCache)
  const pendingActionsCache = useAppStore(s => s.pendingActionsCache)
  const creativeTests = useAppStore(s => s.creativeTests)
  const connectedAccounts = useAppStore(s => s.connectedAccounts)
  const selectedMetaAccountByClient = useAppStore(s => s.selectedMetaAccountByClient)
  const selectedGoogleAccountByClient = useAppStore(s => s.selectedGoogleAccountByClient)

  const activeClient = clientData || savedClients[0]?.clientData || null
  const key = activeClient?.clientName || ''
  const { audit, createdAt } = auditFrom(key ? auditCache[key] : null)
  const rm = audit?._realMetrics
  const campaigns = useMemo(() => campaignsFromAudit(audit), [audit])
  const critical = campaigns.filter((c: any) => c._s === 'critica')
  const winners = campaigns.filter((c: any) => c._s === 'vencedora')
  const pending = (key ? pendingActionsCache[key] || [] : []).filter((a: any) => a.status === 'pendente')
  const runningTests = creativeTests.filter(t => t.status === 'running').length
  const hasMeta = !!(key && selectedMetaAccountByClient[key]) || connectedAccounts.some(a => a.platform === 'meta')
  const hasGoogle = !!(key && selectedGoogleAccountByClient[key]) || connectedAccounts.some(a => a.platform === 'google')
  const lastAudit = createdAt ? new Date(createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : null

  const actions = useMemo<StudioAction[]>(() => {
    const list: StudioAction[] = []
    if (!activeClient) {
      list.push({ id: 'client', title: 'Criar primeiro cliente', body: 'O Estúdio precisa de um cliente ativo para gerar campanhas, criativos e testes com contexto.', href: '/novo', cta: 'Criar cliente', icon: 'plus', tone: 'blue', meta: 'base', priority: 1 })
      return list
    }
    if (!hasMeta && !hasGoogle) {
      list.push({ id: 'connect', title: 'Conectar conta de anúncios', body: 'Sem Meta ou Google conectado, o Estúdio gera ideias, mas não consegue decidir com dados reais.', href: '/integracoes', cta: 'Conectar agora', icon: 'plug', tone: 'warn', meta: 'dados', priority: 2 })
    }
    if (!audit) {
      list.push({ id: 'audit', title: 'Rodar análise profunda', body: 'Antes de criar ou escalar, rode a análise para descobrir criativos cansados, campanhas vencedoras e tracking.', href: '/diagnostico', cta: 'Analisar conta', icon: 'search', tone: 'blue', meta: 'primeiro passo', priority: 3 })
      return list.sort((a, b) => a.priority - b.priority)
    }

    const topCritical = critical[0]
    if (topCritical) {
      const cost = costPerResultOf(topCritical)
      list.push({
        id: `critical-${topCritical.id || topCritical.name}`,
        title: 'Revisar desperdício antes de criar mais',
        body: `${topCritical.name || 'Campanha crítica'} está puxando atenção${cost ? ` com custo de ${brl(cost)}` : ''}. Veja o criativo/campanha antes de aumentar verba.`,
        href: '/desempenho?tab=campanhas',
        cta: 'Abrir campanhas',
        icon: 'alert',
        tone: 'bad',
        meta: 'crítico',
        priority: 4,
      })
    }

    const topWinner = winners[0]
    if (topWinner) {
      const value = resultValueOf(topWinner)
      const label = resultLabelOf(topWinner).toLowerCase()
      list.push({
        id: `winner-${topWinner.id || topWinner.name}`,
        title: 'Criar variação da vencedora',
        body: `${topWinner.name || 'Campanha vencedora'} gerou ${int(value)} ${label}. Crie uma variação no mesmo ângulo para escalar sem saturar.`,
        href: createHref(`Criar uma variação de criativo para a campanha vencedora "${topWinner.name || ''}" de ${activeClient.clientName}. Manter o mesmo ângulo que converte, mas mudar gancho, visual e CTA para evitar fadiga.`),
        cta: 'Gerar variação',
        icon: 'spark',
        tone: 'good',
        meta: 'escala',
        priority: 5,
      })
    }

    const creativePending = pending.find((a: any) => /criativ|ctr|frequ|an[uú]ncio|fadiga/i.test(`${a.title} ${a.description} ${a.metric || ''}`))
    if (creativePending) {
      list.push({
        id: `pending-${creativePending.id}`,
        title: creativePending.title,
        body: creativePending.evidence || creativePending.description || 'Existe uma ação criativa pendente no plano de ação.',
        href: '/plano',
        cta: 'Resolver no plano',
        icon: 'clipboard',
        tone: creativePending.urgency === 'critica' ? 'bad' : creativePending.urgency === 'alta' ? 'warn' : 'blue',
        meta: 'pendente',
        priority: 6,
      })
    }

    if (Number(rm?.avgCTR || 0) > 0 && Number(rm.avgCTR) < 1) {
      list.push({
        id: 'low-ctr',
        title: 'Criar novos ganchos',
        body: `CTR médio em ${Number(rm.avgCTR).toFixed(2)}%. O próximo teste deve focar nos primeiros segundos e promessa principal.`,
        href: createHref(`Criar 3 novos ganchos de anúncio para ${activeClient.clientName}, focados em aumentar CTR. Usar ângulos diferentes: dor direta, prova social e comparação.`),
        cta: 'Criar hooks',
        icon: 'megaphone',
        tone: 'warn',
        meta: 'criativo',
        priority: 7,
      })
    }

    if (runningTests > 0) {
      list.push({
        id: 'ab-running',
        title: 'Atualizar testes em andamento',
        body: `${runningTests} teste${runningTests > 1 ? 's' : ''} A/B aguardando leitura de resultado. Atualize conversões e gasto antes de declarar vencedor.`,
        href: '/abtest',
        cta: 'Ver A/B',
        icon: 'scale',
        tone: 'blue',
        meta: 'teste',
        priority: 8,
      })
    } else {
      list.push({
        id: 'ab-start',
        title: 'Abrir novo teste criativo',
        body: 'Use a próxima variação do Estúdio como teste controlado, com custo por conversão e CTR acompanhados.',
        href: '/abtest',
        cta: 'Criar teste',
        icon: 'scale',
        tone: 'neutral',
        meta: 'proximo',
        priority: 12,
      })
    }

    return list
      .sort((a, b) => a.priority - b.priority)
      .filter((a, i, arr) => arr.findIndex(x => x.id === a.id) === i)
      .slice(0, 5)
  }, [activeClient, audit, critical, hasGoogle, hasMeta, pending, rm, runningTests, winners])

  const toolStats = useMemo<Record<string, Partial<Tool>>>(() => ({
    criar: { stat: hasMeta ? 'Meta pronto' : hasGoogle ? 'Google conectado' : 'conectar conta' },
    biblioteca: { stat: winners.length ? `${winners.length} vencedora${winners.length > 1 ? 's' : ''}` : 'ativos e variações' },
    conteudo: { stat: audit ? 'usa memória real' : 'aguarda análise' },
    abtest: { stat: runningTests ? `${runningTests} em andamento` : 'sem teste ativo' },
    cro: { stat: rm ? 'dados reais' : 'rodar análise' },
  }), [audit, hasGoogle, hasMeta, rm, runningTests, winners.length])

  const tools = TOOLS.map(t => ({ ...t, ...(toolStats[t.k] || {}) }))

  const go = (preset?: string) => {
    const q = (preset ?? intent).trim()
    router.push(q ? createHref(q) : '/criar')
  }

  return (
    <div className="p-4 md:p-6 flex flex-col gap-[18px]">
      <div className="animate-fade-up rounded-lg overflow-hidden sheen"
        style={{ border: '1px solid var(--ink-line)', boxShadow: 'var(--sh-ink)',
          background: 'radial-gradient(130% 130% at 6% -10%, rgba(43,91,227,.32), transparent 46%), radial-gradient(120% 130% at 102% 120%, rgba(14,156,176,.18), transparent 52%), var(--ink-surface)', padding: '26px 26px 24px' }}>
        <div className="flex items-center gap-3 mb-4">
          <NousOrb size={46} />
          <div className="min-w-0">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.14em]" style={{ color: 'var(--blue-500)' }}>Estúdio de Criação · NOUS IA</div>
            <div className="text-[22px] font-bold mt-0.5" style={{ letterSpacing: '-0.025em', color: 'var(--on-ink)' }}>
              {key ? `O que vamos criar para ${key}?` : 'O que você quer criar hoje?'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-md" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--ink-line)', padding: '4px 4px 4px 15px' }}>
          <input
            value={intent} onChange={e => setIntent(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') go() }}
            placeholder="Descreva uma campanha, peça um criativo ou um post..."
            className="flex-1 bg-transparent border-none outline-none text-[14px]"
            style={{ color: 'var(--on-ink)' }}
          />
          <Button variant="primary" icon={<Icon name="spark" size={15} />} onClick={() => go()}>Começar</Button>
        </div>
        <div className="flex gap-2 flex-wrap mt-3">
          {EXAMPLES.map((ex, i) => (
            <button key={i} onClick={() => go(ex)} className="text-[11.5px] rounded-pill px-3 py-1.5"
              style={{ color: 'var(--on-ink-2)', background: 'rgba(255,255,255,.05)', border: '1px solid var(--ink-line)' }}>{ex}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_.8fr] gap-4">
        <section className="rounded-lg border border-line bg-paper p-4 shadow-card">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
            <div>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-blue">Fila operacional</div>
              <h2 className="text-[18px] font-bold text-ink mt-0.5" style={{ letterSpacing: '-0.02em' }}>O que criar ou revisar agora</h2>
              <p className="text-[13px] text-ink-2 mt-0.5">A prioridade muda conforme campanhas, criativos, tracking e testes evoluem.</p>
            </div>
            <Badge tone={audit ? 'good' : 'warn'} dot>{audit ? 'dados da conta' : 'sem análise'}</Badge>
          </div>
          <div className="grid gap-2.5">
            {actions.map(action => (
              <ActionCard key={action.id} action={action} onOpen={() => router.push(action.href)} />
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-line bg-paper p-4 shadow-card">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-3 mb-2">Sinais usados</div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-sm border border-line bg-canvas-2 p-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-ink-3">Conta</div>
              <div className="text-sm font-semibold text-ink mt-1 truncate">{key || 'Sem cliente'}</div>
            </div>
            <div className="rounded-sm border border-line bg-canvas-2 p-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-ink-3">Última análise</div>
              <div className="text-sm font-semibold text-ink mt-1">{lastAudit || 'pendente'}</div>
            </div>
            <div className="rounded-sm border border-line bg-canvas-2 p-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-ink-3">Campanhas</div>
              <div className="text-sm font-semibold text-ink mt-1">{campaigns.length ? `${campaigns.length} lidas` : 'sem dados'}</div>
            </div>
            <div className="rounded-sm border border-line bg-canvas-2 p-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-ink-3">Testes A/B</div>
              <div className="text-sm font-semibold text-ink mt-1">{runningTests ? `${runningTests} ativos` : 'nenhum'}</div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone={hasMeta ? 'good' : 'neutral'} dot>Meta {hasMeta ? 'conectado' : 'off'}</Badge>
            <Badge tone={hasGoogle ? 'good' : 'neutral'} dot>Google {hasGoogle ? 'conectado' : 'off'}</Badge>
            {rm?.avgCPL && <Badge tone="blue">Custo médio {brl(Number(rm.avgCPL))}</Badge>}
            {rm?.totalLeads && <Badge tone="good">{int(Number(rm.totalLeads))} resultados</Badge>}
          </div>
        </section>
      </div>

      <div>
        <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-3 mb-2.5">Criar por objetivo separado</div>
        <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          {OBJECTIVES.map(obj => (
            <button key={obj.label} onClick={() => router.push(createHref(obj.intent))}
              className="text-left rounded-md border border-line bg-paper p-3 hover-lift hover:shadow-card-hover transition-all">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-8 h-8 rounded-md bg-blue-soft text-blue flex items-center justify-center"><Icon name={obj.icon} size={15} /></span>
                <span className="text-sm font-bold text-ink">{obj.label}</span>
              </div>
              <div className="text-[11.5px] text-ink-3">{obj.hint}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-3 mb-2.5">O fluxo de criação</div>
        <div className="no-sb flex items-center gap-1 overflow-x-auto py-0.5">
          {FLOW.map(([l, ic], i) => (
            <div key={l} className="flex items-center gap-1 shrink-0">
              <div className="inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 bg-canvas-2 border border-line shrink-0">
                <span className="text-ink-3 flex"><Icon name={ic} size={13} /></span>
                <span className="text-[12px] font-semibold text-ink-2">{l}</span>
              </div>
              {i < FLOW.length - 1 && <span className="text-ink-4 flex shrink-0"><Icon name="arrowR" size={14} /></span>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(232px, 1fr))' }}>
        {tools.map((t, i) => <ToolCard key={t.k} t={t} onNav={(k) => router.push(`/${k}`)} i={i} />)}
      </div>
    </div>
  )
}
