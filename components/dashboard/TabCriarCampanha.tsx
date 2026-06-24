// components/dashboard/TabCriarCampanha.tsx — Criador de campanha Meta Ads via IA + Tool Use
'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import type { ClientData } from '@/lib/store'
import { AdAccountPicker } from '@/components/dashboard/v2/AdAccountPicker'
import { NousOrb, Icon } from '@/components/dashboard/v2'

const EXAMPLES = [
  'Gerar leads de crédito pessoal em SP com R$ 150/dia',
  'Campanha de remarketing para quem abandonou a simulação',
  'Reconhecimento de marca para o novo produto, público 25–45',
]

// Passo a passo de como o NOUS monta a campanha (exibido antes de gerar)
const BUILD_STEPS: { icon: string; title: string; desc: string }[] = [
  { icon: '🎯', title: 'Objetivo & estrutura', desc: 'A IA lê seu pedido + dados do cliente e escolhe o objetivo certo (leads, conversões, tráfego…) e nomeia a campanha.' },
  { icon: '👥', title: 'Público & orçamento', desc: 'Define idade, gênero, região e interesses com base na sua persona/cadastro, e calibra o orçamento diário.' },
  { icon: '🖼️', title: 'Criativo & copy', desc: 'Gera texto principal, título, descrição, CTA e URL de destino alinhados ao seu nicho.' },
  { icon: '🚀', title: 'Revisão & publicação', desc: 'Você revisa o plano completo, escolhe a página do Facebook e a IA publica tudo no Meta Ads (em pausa, pronto para ativar).' },
]

interface Props {
  clientData: ClientData | null
  onNavigateToConnections: () => void
}

type Step = 'input' | 'planning' | 'review' | 'creating' | 'done' | 'error'

interface CampaignPlan {
  campaign:  { name: string; objective: string; status: string; reasoning: string }
  ad_set:    { name: string; daily_budget_brl: number; optimization_goal: string; age_min: number; age_max: number; genders: number[]; geo_description: string; countries: string[]; reasoning: string }
  creative:  { primary_text: string; headline: string; description: string; call_to_action: string; website_url: string; reasoning: string }
  ad:        { name: string; status: string }
  summary:   string
}

interface StreamEvent {
  type: 'tool_call' | 'tool_result' | 'done' | 'error'
  tool?: string
  input?: any
  result?: any
  summary?: string
  message?: string
}

const OBJECTIVE_LABELS: Record<string, string> = {
  LEAD_GENERATION: 'Geração de Leads',
  CONVERSIONS:     'Conversões',
  TRAFFIC:         'Tráfego',
  BRAND_AWARENESS: 'Reconhecimento de Marca',
  REACH:           'Alcance',
  MESSAGES:        'Mensagens',
  VIDEO_VIEWS:     'Visualizações de Vídeo',
}

const CTA_LABELS: Record<string, string> = {
  LEARN_MORE:  'Saiba Mais',
  SIGN_UP:     'Cadastre-se',
  CONTACT_US:  'Entre em Contato',
  GET_QUOTE:   'Solicitar Orçamento',
  SUBSCRIBE:   'Assinar',
  BOOK_NOW:    'Reserve Agora',
  SHOP_NOW:    'Compre Agora',
}

const TOOL_LABELS: Record<string, { label: string; icon: string }> = {
  create_campaign:    { label: 'Criando campanha...', icon: '📣' },
  create_ad_set:      { label: 'Configurando público e orçamento...', icon: '🎯' },
  create_ad_creative: { label: 'Montando criativo...', icon: '🖼️' },
  create_ad:          { label: 'Publicando anúncio...', icon: '🚀' },
}

const TOOL_DONE_LABELS: Record<string, string> = {
  create_campaign:    'Campanha criada',
  create_ad_set:      'Público e orçamento configurados',
  create_ad_creative: 'Criativo montado',
  create_ad:          'Anúncio publicado',
}

// Linha label↔valor do plano (fiel a screens-studio.jsx › PlanField)
function PlanField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderBottom: '1px solid #EFEFEB', fontSize: 13 }}>
      <span style={{ color: '#898C97', flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: 'right', fontFamily: mono ? 'var(--font-mono)' : 'inherit' }}>{value}</span>
    </div>
  )
}

// Card de seção do plano (chip de ícone + reasoning box azul)
function PlanCard({ icon, title, reasoning, children }: { icon: string; title: string; reasoning?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E6E5E0', borderRadius: 12, padding: 18, marginBottom: 14, boxShadow: '0 1px 2px rgba(24,25,29,.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span style={{ width: 30, height: 30, borderRadius: 8, background: '#EBF0FE', color: '#1E47C4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={16} /></span>
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', color: '#18191D' }}>{title}</span>
      </div>
      <div>{children}</div>
      {reasoning && (
        <div style={{ display: 'flex', gap: 8, marginTop: 11, padding: '9px 11px', background: '#EBF0FE', border: '1px solid #CCDAFB', borderRadius: 8 }}>
          <span style={{ color: '#1E47C4', flexShrink: 0, marginTop: 1 }}><Icon name="spark" size={13} /></span>
          <span style={{ fontSize: 12, color: '#565862', lineHeight: 1.5 }}>{reasoning}</span>
        </div>
      )}
    </div>
  )
}

export function TabCriarCampanha({ clientData, onNavigateToConnections }: Props) {
  const connectedAccounts = useAppStore((s) => s.connectedAccounts)
  const selectedMetaAccountByClient = useAppStore((s) => s.selectedMetaAccountByClient)
  const metaAccount       = connectedAccounts.find((a) => a.platform === 'meta')
  const clientKey         = (clientData as any)?.clientName || ''
  // Isolamento por cliente: cria SÓ na conta que ESTE cliente selecionou — nunca cai na
  // conta padrão do usuário (que é de outro cliente). Criar campanha na conta errada é grave.
  const effectiveAccountId = (clientKey && selectedMetaAccountByClient[clientKey]) || ''

  const [step,        setStep]        = useState<Step>('input')
  const [intent,      setIntent]      = useState('')

  // Preenche a intenção quando vem do hub do Estúdio (/criar?intent=…).
  useEffect(() => {
    if (typeof window === 'undefined') return
    const q = new URLSearchParams(window.location.search).get('intent')
    if (q) setIntent(q)
  }, [])
  const [plan,        setPlan]        = useState<CampaignPlan | null>(null)
  const [pages,       setPages]       = useState<{ id: string; name: string }[]>([])
  const [selectedPage, setSelectedPage] = useState('')
  const [events,      setEvents]      = useState<StreamEvent[]>([])
  const [errorMsg,    setErrorMsg]    = useState('')
  const [finalUrl,    setFinalUrl]    = useState('')
  const [editPlan,    setEditPlan]    = useState(false)

  if (!metaAccount) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
          <h3 style={{ color: '#18191D', fontSize: 18, fontWeight: 700, marginBottom: 8, fontFamily: 'var(--font-syne)' }}>
            Conecte o Meta Ads primeiro
          </h3>
          <p style={{ color: '#898C97', fontSize: 14, marginBottom: 24 }}>
            Para criar campanhas via IA você precisa conectar sua conta Meta Ads.
          </p>
          <button
            onClick={onNavigateToConnections}
            style={{ padding: '10px 24px', borderRadius: 10, background: '#2B5BE3', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}
          >
            📘 Conectar Meta Ads
          </button>
        </div>
      </div>
    )
  }

  // ── Step 1: Input ────────────────────────────────────────────────────────────
  const handlePlan = async () => {
    if (!intent.trim()) return
    setStep('planning')
    setErrorMsg('')
    try {
      const res  = await fetch('/api/meta/campaign/plan', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          intent,
          accountId: effectiveAccountId,
          clientData:  clientData ? {
            clientName:       (clientData as any).clientName,
            niche:            (clientData as any).niche,
            budget_monthly:   (clientData as any).budget_monthly,
            target_audience:  (clientData as any).target_audience,
            approved_channels:(clientData as any).approved_channels,
            products:         (clientData as any).products,
          } : null,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPlan(data.plan)
      setPages(data.pages || [])
      if (data.pages?.length === 1) setSelectedPage(data.pages[0].id)
      setStep('review')
    } catch (e: any) {
      setErrorMsg(e.message)
      setStep('error')
    }
  }

  // ── Step 3: Create ───────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!plan || !selectedPage) return
    setStep('creating')
    setEvents([])

    try {
      const res = await fetch('/api/meta/campaign/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          plan,
          accountId: effectiveAccountId,
          pageId:    selectedPage,
        }),
      })

      if (!res.body) throw new Error('Stream indisponível')

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value)
        for (const line of text.split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const event: StreamEvent = JSON.parse(line.slice(6))
            setEvents((prev) => [...prev, event])
            if (event.type === 'done') {
              const accId = effectiveAccountId?.replace('act_', '')
              setFinalUrl(`https://www.facebook.com/adsmanager/manage/campaigns?act=${accId}`)
              setStep('done')
            }
            if (event.type === 'error') {
              setErrorMsg(event.message || 'Erro desconhecido')
              setStep('error')
            }
          } catch {}
        }
      }
    } catch (e: any) {
      setErrorMsg(e.message)
      setStep('error')
    }
  }

  const reset = () => {
    setStep('input'); setIntent(''); setPlan(null)
    setPages([]); setSelectedPage(''); setEvents([])
    setErrorMsg(''); setFinalUrl(''); setEditPlan(false)
  }

  // ── Renders ──────────────────────────────────────────────────────────────────
  const S: Record<string, React.CSSProperties> = {
    wrap:    { maxWidth: 720, margin: '0 auto', padding: '0 0 40px' },
    card:    { background: '#FFFFFF', border: '1px solid #E6E5E0', borderRadius: 16, padding: 28 },
    label:   { fontSize: 11, fontFamily: 'var(--font-mono)', color: '#898C97', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, display: 'block' },
    input:   { width: '100%', background: '#FFFFFF', border: '1px solid #E6E5E0', borderRadius: 10, padding: '12px 14px', color: '#18191D', fontSize: 14, outline: 'none', resize: 'vertical' as const, fontFamily: 'inherit' },
    btn:     { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none', transition: 'opacity 0.15s' },
    btnPrim: { background: '#2B5BE3', color: '#fff' },
    btnSec:  { background: '#E6E5E0', border: '1px solid #565862', color: '#18191D' },
    row:     { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid #EFEFEB' },
    rowKey:  { fontSize: 12, color: '#898C97', width: 140, flexShrink: 0, paddingTop: 2 },
    rowVal:  { fontSize: 14, color: '#18191D', flex: 1 },
  }

  if (step === 'input') return (
    <div style={S.wrap}>
      {/* Hero escuro — prompt do NOUS (fiel a screens-studio.jsx › CriarCampanha) */}
      <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--sh-ink)', border: '1px solid var(--ink-line)',
        background: 'radial-gradient(130% 130% at 8% -10%, rgba(43,91,227,.32), transparent 48%), var(--ink-surface)', padding: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <NousOrb size={44} />
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--blue-500)' }}>Criar campanha · NOUS IA</div>
            <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--on-ink)', marginTop: 2 }}>Descreva o que você quer — o NOUS monta a campanha.</div>
          </div>
        </div>
        <textarea
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          rows={3}
          placeholder="Ex: gerar leads de crédito pessoal em São Paulo com R$ 150/dia, público 25–45…"
          style={{ width: '100%', resize: 'vertical', padding: '13px 15px', fontSize: 14, lineHeight: 1.55, color: 'var(--on-ink)', background: 'rgba(255,255,255,.05)', border: '1px solid var(--ink-line)', borderRadius: 12, outline: 'none', fontFamily: 'inherit' }}
        />
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 12 }}>
          {EXAMPLES.map((ex, i) => (
            <button key={i} onClick={() => setIntent(ex)} style={{ fontSize: 11.5, color: 'var(--on-ink-2)', background: 'rgba(255,255,255,.05)', border: '1px solid var(--ink-line)', borderRadius: 999, padding: '6px 12px', cursor: 'pointer' }}>{ex}</button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button
            onClick={handlePlan}
            disabled={!intent.trim() || !effectiveAccountId}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer', border: 'none', background: '#2B5BE3', color: '#fff', opacity: intent.trim() && effectiveAccountId ? 1 : 0.45 }}
          >
            <Icon name="spark" size={15} /> Planejar com o NOUS
          </button>
        </div>
      </div>

      {/* Conta de anúncio (feature: escolher a conta) */}
      <div style={{ ...S.card, marginTop: 16, padding: 20 }}>
        <label style={S.label}>Em qual conta criar a campanha?</label>
        <AdAccountPicker platform="meta" clientKey={clientKey} compact />
        <div style={{ marginTop: 6, fontSize: 11, color: '#898C97' }}>
          A campanha será criada na conta selecionada acima. Você pode trocar a qualquer momento.
        </div>
      </div>

      {/* Passo a passo: como o NOUS monta a campanha */}
      <div style={{ ...S.card, marginTop: 16, padding: 20 }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#2B5BE3', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
          Como o NOUS vai montar
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {BUILD_STEPS.map((s, i) => (
            <div key={s.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '12px 0', borderBottom: i < BUILD_STEPS.length - 1 ? '1px solid #EFEFEB' : 'none' }}>
              <div style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 9, background: 'rgba(43,91,227,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, position: 'relative' }}>
                {s.icon}
                <span style={{ position: 'absolute', top: -6, left: -6, width: 18, height: 18, borderRadius: '50%', background: '#2B5BE3', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)' }}>{i + 1}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#18191D', marginBottom: 2 }}>{s.title}</div>
                <div style={{ fontSize: 12.5, color: '#565862', lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, fontSize: 11.5, color: '#898C97', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>🔒</span> Nada é publicado sem a sua revisão — você confirma o plano antes de criar.
        </div>
      </div>
    </div>
  )

  if (step === 'planning') return (
    <div style={S.wrap}>
      <div style={{ ...S.card, textAlign: 'center', padding: 48 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><NousOrb size={56} thinking /></div>
        <div style={{ color: '#18191D', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>O NOUS está planejando sua campanha…</div>
        <div style={{ color: '#898C97', fontSize: 13 }}>Cruzando seu nicho, verba e público de melhor ROAS.</div>
      </div>
    </div>
  )

  if (step === 'review' && plan) return (
    <div style={S.wrap}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: '#EBF0FE', color: '#1E47C4', border: '1px solid #CCDAFB' }}>
          <span style={{ width: 6, height: 6, borderRadius: 99, background: '#2B5BE3' }} /> Plano gerado pelo NOUS
        </span>
        <span style={{ fontSize: 12.5, color: '#898C97' }}>Revise e ajuste antes de publicar — nada vai ao ar sem sua aprovação.</span>
      </div>

      <PlanCard icon="megaphone" title="Campanha" reasoning={plan.campaign.reasoning}>
        <PlanField label="Nome" value={plan.campaign.name} />
        <PlanField label="Objetivo" value={OBJECTIVE_LABELS[plan.campaign.objective] || plan.campaign.objective} />
      </PlanCard>

      <PlanCard icon="users" title="Público & Orçamento" reasoning={plan.ad_set.reasoning}>
        <PlanField label="Orçamento diário" value={`R$${plan.ad_set.daily_budget_brl}/dia`} mono />
        <PlanField label="Idade" value={`${plan.ad_set.age_min}–${plan.ad_set.age_max} anos`} mono />
        <PlanField label="Gênero" value={!plan.ad_set.genders?.length ? 'Todos' : plan.ad_set.genders.includes(1) && plan.ad_set.genders.includes(2) ? 'Todos' : plan.ad_set.genders.includes(1) ? 'Masculino' : 'Feminino'} />
        <PlanField label="Localização" value={plan.ad_set.geo_description || 'Brasil'} />
      </PlanCard>

      <PlanCard icon="image" title="Criativo" reasoning={plan.creative.reasoning}>
        <PlanField label="Título" value={plan.creative.headline} />
        <div style={{ padding: '9px 0', borderBottom: '1px solid #EFEFEB' }}>
          <div style={{ fontSize: 12, color: '#898C97', marginBottom: 4 }}>Texto principal</div>
          <div style={{ fontSize: 13, color: '#18191D', lineHeight: 1.55 }}>{plan.creative.primary_text}</div>
        </div>
        <PlanField label="CTA" value={CTA_LABELS[plan.creative.call_to_action] || plan.creative.call_to_action} />
        <PlanField label="Destino" value={plan.creative.website_url} mono />
      </PlanCard>

      {/* Seleção de página */}
      {pages.length > 0 && (
        <div style={{ ...S.card, marginBottom: 20 }}>
          <label style={S.label}>Página do Facebook para o anúncio</label>
          {pages.length === 1 ? (
            <div style={{ padding: '10px 14px', background: 'rgba(24,119,242,0.08)', border: '1px solid rgba(24,119,242,0.2)', borderRadius: 8, fontSize: 14, color: '#1E47C4' }}>
              📘 {pages[0].name}
            </div>
          ) : (
            <select
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
              style={{ ...S.input, height: 'auto' }}
            >
              <option value="">Selecione uma página...</option>
              {pages.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {pages.length === 0 && (
        <div style={{ ...S.card, marginBottom: 20, background: 'rgba(245,165,0,0.06)', borderColor: 'rgba(245,165,0,0.2)' }}>
          <p style={{ color: '#2B5BE3', fontSize: 13, margin: 0 }}>
            ⚠️ Nenhuma Página do Facebook encontrada. Verifique se o token tem permissão <code>pages_read_engagement</code> e reconecte o Meta Ads.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <button onClick={reset} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', fontSize: 13.5, fontWeight: 600, borderRadius: 8, background: 'transparent', color: '#565862', border: '1px solid #E6E5E0', cursor: 'pointer' }}>
          <Icon name="chevL" size={15} /> Refazer
        </button>
        <button
          onClick={handleCreate}
          disabled={!selectedPage && pages.length > 0}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer', border: 'none', background: '#2B5BE3', color: '#fff', opacity: (!selectedPage && pages.length > 0) ? 0.45 : 1 }}
        >
          <Icon name="rocket" size={15} /> Publicar campanha
        </button>
      </div>

      <p style={{ textAlign: 'right', fontSize: 11, color: '#565862', marginTop: 8 }}>
        A campanha será criada em status <strong>PAUSADA</strong>. Ative no Gerenciador quando estiver pronto.
      </p>
    </div>
  )

  if (step === 'creating') return (
    <div style={S.wrap}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18 }}>
        <NousOrb size={40} thinking />
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#18191D' }}>Publicando na Meta…</div>
          <div style={{ fontSize: 12.5, color: '#898C97' }}>O NOUS executa cada etapa via API.</div>
        </div>
      </div>
      <div style={S.card}>
        {events.length === 0 && (
          <div style={{ color: '#898C97', fontSize: 14, textAlign: 'center', padding: 24 }}>Iniciando...</div>
        )}
        {events.map((e, i) => {
          if (e.type === 'tool_call') {
            const info = TOOL_LABELS[e.tool || ''] || { label: e.tool, icon: '⚙️' }
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #EFEFEB' }}>
                <span style={{ fontSize: 20 }}>{info.icon}</span>
                <div>
                  <div style={{ color: '#18191D', fontSize: 13, fontWeight: 600 }}>{info.label}</div>
                  <div style={{ color: '#565862', fontSize: 11, fontFamily: 'var(--font-mono)', marginTop: 2 }}>{e.tool}</div>
                </div>
                <div style={{ marginLeft: 'auto', width: 16, height: 16, border: '2px solid #565862', borderTopColor: '#2B5BE3', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
              </div>
            )
          }
          if (e.type === 'tool_result') {
            const hasError = !!e.result?.error
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #EFEFEB' }}>
                <span style={{ fontSize: 16, color: hasError ? '#E1483F' : '#0E9E6E' }}>{hasError ? '✗' : '✓'}</span>
                <div>
                  <div style={{ color: hasError ? '#E1483F' : '#0E9E6E', fontSize: 13, fontWeight: 600 }}>
                    {hasError ? `Erro: ${e.result.error}` : TOOL_DONE_LABELS[e.tool || ''] || 'Concluído'}
                  </div>
                  {!hasError && e.result && (
                    <div style={{ color: '#565862', fontSize: 11, fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                      ID: {e.result.campaign_id || e.result.adset_id || e.result.creative_id || e.result.ad_id}
                    </div>
                  )}
                </div>
              </div>
            )
          }
          return null
        })}
      </div>
    </div>
  )

  if (step === 'done') return (
    <div style={S.wrap}>
      <div style={{ ...S.card, textAlign: 'center', padding: 48 }}>
        <span style={{ width: 56, height: 56, borderRadius: 99, background: '#E3F6EE', color: '#0B855D', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}><Icon name="check" size={28} w={2.6} /></span>
        <h2 style={{ color: '#18191D', fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-syne)', marginBottom: 8, letterSpacing: '-0.02em' }}>
          Campanha criada com sucesso!
        </h2>
        <p style={{ color: '#898C97', fontSize: 14, marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
          {events.find(e => e.type === 'done')?.summary || 'Sua campanha está pronta no Meta Ads em status pausado.'}
        </p>

        {/* IDs criados */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E6E5E0', borderRadius: 10, padding: '16px 20px', marginBottom: 24, textAlign: 'left', maxWidth: 400, margin: '0 auto 24px' }}>
          {events.filter(e => e.type === 'tool_result' && !e.result?.error).map((e, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12, color: '#565862' }}>
              <span>{TOOL_DONE_LABELS[e.tool || ''] || e.tool}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#0E9E6E' }}>
                {e.result?.campaign_id || e.result?.adset_id || e.result?.creative_id || e.result?.ad_id}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {finalUrl && (
            <a
              href={finalUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...S.btn, ...S.btnPrim, textDecoration: 'none' }}
            >
              📘 Abrir no Gerenciador de Anúncios
            </a>
          )}
          <button onClick={reset} style={{ ...S.btn, ...S.btnSec }}>+ Criar outra campanha</button>
        </div>

        <p style={{ marginTop: 20, fontSize: 12, color: '#565862' }}>
          A campanha está <strong>pausada</strong>. Adicione a imagem e ative no Gerenciador quando estiver pronto.
        </p>
      </div>
    </div>
  )

  if (step === 'error') return (
    <div style={S.wrap}>
      <div style={{ ...S.card, textAlign: 'center', padding: 48 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ color: '#E1483F', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Erro ao criar campanha</h2>
        <p style={{ color: '#898C97', fontSize: 14, marginBottom: 24 }}>{errorMsg}</p>
        <button onClick={reset} style={{ ...S.btn, ...S.btnSec }}>← Tentar novamente</button>
      </div>
    </div>
  )

  return null
}
