// components/dashboard/TabCriarCampanha.tsx — Criador de campanha Meta Ads via IA + Tool Use
'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import type { ClientData } from '@/lib/store'

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

export function TabCriarCampanha({ clientData, onNavigateToConnections }: Props) {
  const connectedAccounts = useAppStore((s) => s.connectedAccounts)
  const metaAccount       = connectedAccounts.find((a) => a.platform === 'meta')

  const [step,        setStep]        = useState<Step>('input')
  const [intent,      setIntent]      = useState('')
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
          <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 8, fontFamily: 'var(--font-syne)' }}>
            Conecte o Meta Ads primeiro
          </h3>
          <p style={{ color: '#8A93A3', fontSize: 14, marginBottom: 24 }}>
            Para criar campanhas via IA você precisa conectar sua conta Meta Ads.
          </p>
          <button
            onClick={onNavigateToConnections}
            style={{ padding: '10px 24px', borderRadius: 10, background: 'linear-gradient(135deg, #1877F2, #0866FF)', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}
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
          accountId:   metaAccount.accountId,
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
          accountId: metaAccount.accountId,
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
              const accId = metaAccount.accountId?.replace('act_', '')
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
    label:   { fontSize: 11, fontFamily: 'var(--font-mono)', color: '#8A93A3', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, display: 'block' },
    input:   { width: '100%', background: '#0C0C12', border: '1px solid #E6E5E0', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14, outline: 'none', resize: 'vertical' as const, fontFamily: 'inherit' },
    btn:     { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none', transition: 'opacity 0.15s' },
    btnPrim: { background: 'linear-gradient(135deg, #1877F2, #0866FF)', color: '#fff' },
    btnSec:  { background: '#E6E5E0', border: '1px solid #565862', color: '#fff' },
    row:     { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid #1E1E24' },
    rowKey:  { fontSize: 12, color: '#8A93A3', width: 140, flexShrink: 0, paddingTop: 2 },
    rowVal:  { fontSize: 14, color: '#E2E8F0', flex: 1 },
  }

  if (step === 'input') return (
    <div style={S.wrap}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-syne)', marginBottom: 6 }}>
          📣 Criar Campanha com IA
        </h2>
        <p style={{ color: '#8A93A3', fontSize: 14 }}>
          Descreva o que você quer em linguagem natural. A IA monta o plano completo e cria no Meta Ads.
        </p>
      </div>

      <div style={S.card}>
        <label style={S.label}>Descreva sua campanha</label>
        <textarea
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          placeholder={`Ex: "Quero uma campanha de leads para ${(clientData as any)?.niche || 'o meu negócio'}, orçamento R$50/dia, público feminino 30-50 anos em São Paulo"`}
          rows={4}
          style={S.input}
        />
        <div style={{ marginTop: 8, fontSize: 12, color: '#475569' }}>
          Dica: inclua objetivo, orçamento, público e região para um plano mais preciso.
        </div>

        {metaAccount.accountName && (
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(24,119,242,0.08)', border: '1px solid rgba(24,119,242,0.2)', borderRadius: 8 }}>
            <span style={{ fontSize: 14 }}>📘</span>
            <span style={{ fontSize: 12, color: '#93C5FD' }}>Conta: <strong>{metaAccount.accountName}</strong></span>
          </div>
        )}

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handlePlan}
            disabled={!intent.trim()}
            style={{ ...S.btn, ...S.btnPrim, opacity: intent.trim() ? 1 : 0.45 }}
          >
            ✨ Gerar plano com IA
          </button>
        </div>
      </div>
    </div>
  )

  if (step === 'planning') return (
    <div style={S.wrap}>
      <div style={{ ...S.card, textAlign: 'center', padding: 48 }}>
        <div style={{ fontSize: 40, marginBottom: 16, animation: 'spin 2s linear infinite', display: 'inline-block' }}>⚙️</div>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Analisando e planejando campanha...</div>
        <div style={{ color: '#8A93A3', fontSize: 13 }}>Claude está revisando os dados do cliente e gerando o plano ideal</div>
      </div>
    </div>
  )

  if (step === 'review' && plan) return (
    <div style={S.wrap}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-syne)', marginBottom: 4 }}>
            📋 Plano gerado — revise antes de criar
          </h2>
          <p style={{ color: '#8A93A3', fontSize: 13 }}>{plan.summary}</p>
        </div>
        <button onClick={reset} style={{ ...S.btn, ...S.btnSec, padding: '7px 14px', fontSize: 12 }}>← Refazer</button>
      </div>

      {/* Campanha */}
      <div style={{ ...S.card, marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#2B5BE3', letterSpacing: '0.1em', marginBottom: 14 }}>CAMPANHA</div>
        <div style={S.row}><span style={S.rowKey}>Nome</span><span style={S.rowVal}>{plan.campaign.name}</span></div>
        <div style={S.row}><span style={S.rowKey}>Objetivo</span><span style={S.rowVal}>{OBJECTIVE_LABELS[plan.campaign.objective] || plan.campaign.objective}</span></div>
        <div style={{ ...S.row, borderBottom: 'none' }}><span style={S.rowKey}>Por que?</span><span style={{ ...S.rowVal, color: '#5A6473', fontSize: 13 }}>{plan.campaign.reasoning}</span></div>
      </div>

      {/* Ad Set */}
      <div style={{ ...S.card, marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#0E9E6E', letterSpacing: '0.1em', marginBottom: 14 }}>PÚBLICO & ORÇAMENTO</div>
        <div style={S.row}><span style={S.rowKey}>Orçamento diário</span><span style={S.rowVal}>R${plan.ad_set.daily_budget_brl}/dia</span></div>
        <div style={S.row}><span style={S.rowKey}>Idade</span><span style={S.rowVal}>{plan.ad_set.age_min}–{plan.ad_set.age_max} anos</span></div>
        <div style={S.row}><span style={S.rowKey}>Gênero</span><span style={S.rowVal}>{!plan.ad_set.genders?.length ? 'Todos' : plan.ad_set.genders.includes(1) && plan.ad_set.genders.includes(2) ? 'Todos' : plan.ad_set.genders.includes(1) ? 'Masculino' : 'Feminino'}</span></div>
        <div style={S.row}><span style={S.rowKey}>Região</span><span style={S.rowVal}>{plan.ad_set.geo_description || 'Brasil'}</span></div>
        <div style={{ ...S.row, borderBottom: 'none' }}><span style={S.rowKey}>Por que?</span><span style={{ ...S.rowVal, color: '#5A6473', fontSize: 13 }}>{plan.ad_set.reasoning}</span></div>
      </div>

      {/* Creative */}
      <div style={{ ...S.card, marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#2C5FE0', letterSpacing: '0.1em', marginBottom: 14 }}>CRIATIVO</div>
        <div style={S.row}><span style={S.rowKey}>Texto principal</span><span style={S.rowVal}>{plan.creative.primary_text}</span></div>
        <div style={S.row}><span style={S.rowKey}>Título</span><span style={S.rowVal}>{plan.creative.headline}</span></div>
        <div style={S.row}><span style={S.rowKey}>Descrição</span><span style={S.rowVal}>{plan.creative.description || '—'}</span></div>
        <div style={S.row}><span style={S.rowKey}>CTA</span><span style={S.rowVal}>{CTA_LABELS[plan.creative.call_to_action] || plan.creative.call_to_action}</span></div>
        <div style={S.row}><span style={S.rowKey}>URL destino</span><span style={S.rowVal}>{plan.creative.website_url}</span></div>
        <div style={{ ...S.row, borderBottom: 'none' }}><span style={S.rowKey}>Por que?</span><span style={{ ...S.rowVal, color: '#5A6473', fontSize: 13 }}>{plan.creative.reasoning}</span></div>
      </div>

      {/* Seleção de página */}
      {pages.length > 0 && (
        <div style={{ ...S.card, marginBottom: 20 }}>
          <label style={S.label}>Página do Facebook para o anúncio</label>
          {pages.length === 1 ? (
            <div style={{ padding: '10px 14px', background: 'rgba(24,119,242,0.08)', border: '1px solid rgba(24,119,242,0.2)', borderRadius: 8, fontSize: 14, color: '#93C5FD' }}>
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

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={reset} style={{ ...S.btn, ...S.btnSec }}>← Refazer</button>
        <button
          onClick={handleCreate}
          disabled={!selectedPage && pages.length > 0}
          style={{ ...S.btn, ...S.btnPrim, opacity: (!selectedPage && pages.length > 0) ? 0.45 : 1 }}
        >
          🚀 Criar campanha agora
        </button>
      </div>

      <p style={{ textAlign: 'right', fontSize: 11, color: '#475569', marginTop: 8 }}>
        A campanha será criada em status <strong>PAUSADA</strong>. Ative no Gerenciador quando estiver pronto.
      </p>
    </div>
  )

  if (step === 'creating') return (
    <div style={S.wrap}>
      <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-syne)', marginBottom: 20 }}>
        ⚡ Criando campanha...
      </h2>
      <div style={S.card}>
        {events.length === 0 && (
          <div style={{ color: '#8A93A3', fontSize: 14, textAlign: 'center', padding: 24 }}>Iniciando...</div>
        )}
        {events.map((e, i) => {
          if (e.type === 'tool_call') {
            const info = TOOL_LABELS[e.tool || ''] || { label: e.tool, icon: '⚙️' }
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #1E1E24' }}>
                <span style={{ fontSize: 20 }}>{info.icon}</span>
                <div>
                  <div style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 600 }}>{info.label}</div>
                  <div style={{ color: '#475569', fontSize: 11, fontFamily: 'var(--font-mono)', marginTop: 2 }}>{e.tool}</div>
                </div>
                <div style={{ marginLeft: 'auto', width: 16, height: 16, border: '2px solid #565862', borderTopColor: '#2B5BE3', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
              </div>
            )
          }
          if (e.type === 'tool_result') {
            const hasError = !!e.result?.error
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #1E1E24' }}>
                <span style={{ fontSize: 16, color: hasError ? '#E1483F' : '#0E9E6E' }}>{hasError ? '✗' : '✓'}</span>
                <div>
                  <div style={{ color: hasError ? '#E1483F' : '#0E9E6E', fontSize: 13, fontWeight: 600 }}>
                    {hasError ? `Erro: ${e.result.error}` : TOOL_DONE_LABELS[e.tool || ''] || 'Concluído'}
                  </div>
                  {!hasError && e.result && (
                    <div style={{ color: '#475569', fontSize: 11, fontFamily: 'var(--font-mono)', marginTop: 2 }}>
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
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-syne)', marginBottom: 8 }}>
          Campanha criada com sucesso!
        </h2>
        <p style={{ color: '#8A93A3', fontSize: 14, marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
          {events.find(e => e.type === 'done')?.summary || 'Sua campanha está pronta no Meta Ads em status pausado.'}
        </p>

        {/* IDs criados */}
        <div style={{ background: '#0C0C12', border: '1px solid #E6E5E0', borderRadius: 10, padding: '16px 20px', marginBottom: 24, textAlign: 'left', maxWidth: 400, margin: '0 auto 24px' }}>
          {events.filter(e => e.type === 'tool_result' && !e.result?.error).map((e, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12, color: '#5A6473' }}>
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

        <p style={{ marginTop: 20, fontSize: 12, color: '#475569' }}>
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
        <p style={{ color: '#8A93A3', fontSize: 14, marginBottom: 24 }}>{errorMsg}</p>
        <button onClick={reset} style={{ ...S.btn, ...S.btnSec }}>← Tentar novamente</button>
      </div>
    </div>
  )

  return null
}
