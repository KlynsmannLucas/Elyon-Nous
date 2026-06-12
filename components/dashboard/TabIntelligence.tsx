// components/dashboard/TabIntelligence.tsx — Inteligência de mercado senior (redesign Fase 3)
'use client'

import { useState } from 'react'
import { getNicheContent } from '@/lib/niche_content'
import type { ClientData } from '@/lib/store'
import { useAppStore } from '@/lib/store'

interface IntelItem {
  tipo: string
  icone: string
  titulo: string
  categoria: string
  categoriaColor: string
  insight: string
  dados: string
  acao_concreta: string
  potencial: string
}

interface Props {
  clientData: ClientData | null
}

// ── Design tokens (Fase 3 — Linear/Stripe padrão) ─────────────────────────────
const T = {
  bg:       '#050B1A',
  surface:  '#0C1426',
  elevated: '#111D33',
  border:   'rgba(255,255,255,0.06)',
  borderMd: 'rgba(255,255,255,0.10)',
  purple:   '#2C5FE0',
  purpleHi: '#2C5FE0',
  purpleBg: 'rgba(124,58,237,0.08)',
  text1:    '#161B26',
  text2:    '#5A6473',
  text3:    'rgba(255,255,255,0.32)',
  mono:     'var(--font-mono)',
}

const CATEGORIES = [
  { tipo: 'oportunidade_mercado', icon: '◎', label: 'Mercado',    color: '#E08B0B' },
  { tipo: 'audiencia_avancada',   icon: '◎', label: 'Audiência',  color: '#0E9E6E' },
  { tipo: 'alocacao_orcamento',   icon: '◎', label: 'Orçamento',  color: '#2C5FE0' },
  { tipo: 'analise_competitiva',  icon: '◎', label: 'Competição', color: '#2C5FE0' },
  { tipo: 'escala_inteligente',   icon: '◎', label: 'Escala',     color: '#FB923C' },
  { tipo: 'criativo_estrategico', icon: '◎', label: 'Criativo',   color: '#EC4899' },
]

// ── Accordion item — padrão Linear ──────────────────────────────────────────
function AccordionItem({ item, index, isOpen, onToggle }: {
  item: IntelItem; index: number; isOpen: boolean; onToggle: () => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const text = `${item.titulo}\n\nInsight: ${item.insight}\n\nDados: ${item.dados}\n\nAção: ${item.acao_concreta}\n\nPotencial: ${item.potencial}`
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      borderBottom: `1px solid ${T.border}`,
      transition: 'background 0.15s',
    }}>
      {/* ── Cabeçalho clicável ────────────────────────────────────────────── */}
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
          padding: '14px 0', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {/* Número / índice */}
        <span style={{
          fontSize: '11px', fontFamily: T.mono, color: T.text3, flexShrink: 0,
          width: '20px', textAlign: 'right',
        }}>
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Dot de categoria */}
        <span style={{
          width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
          background: item.categoriaColor,
          boxShadow: isOpen ? `0 0 8px ${item.categoriaColor}60` : 'none',
          transition: 'box-shadow 0.2s',
        }} />

        {/* Título */}
        <span style={{
          flex: 1, fontSize: '13px', fontWeight: isOpen ? 600 : 400,
          color: isOpen ? T.text1 : T.text2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          transition: 'color 0.15s',
        }}>
          {item.titulo}
        </span>

        {/* Categoria chip */}
        <span style={{
          fontSize: '10px', fontWeight: 700, flexShrink: 0,
          padding: '2px 8px', borderRadius: '999px',
          background: `${item.categoriaColor}12`,
          color: item.categoriaColor,
          border: `1px solid ${item.categoriaColor}25`,
          display: 'none', // oculto em mobile, visível a partir de md
        }} className="hidden md:inline-flex">
          {item.categoria}
        </span>

        {/* Potencial */}
        <span style={{
          fontSize: '10px', color: T.text3, flexShrink: 0, maxWidth: '140px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.potencial}
        </span>

        {/* Chevron */}
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke={T.text3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{
            flexShrink: 0, transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* ── Conteúdo expandido ───────────────────────────────────────────── */}
      {isOpen && (
        <div style={{
          paddingBottom: '20px',
          paddingLeft: '34px',  // alinha com o título (20px index + 8px dot + gap)
          animation: 'fadeDown 0.18s ease',
        }}>
          {/* Insight */}
          <p style={{ fontSize: '13px', color: T.text2, lineHeight: 1.7, marginBottom: '16px' }}>
            {item.insight}
          </p>

          {/* Dados + Ação — duas colunas */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '12px', marginBottom: '14px',
          }}>
            {/* Dados */}
            <div style={{
              padding: '12px 14px', borderRadius: '10px',
              background: T.surface, border: `1px solid ${T.border}`,
            }}>
              <div style={{
                fontSize: '9px', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.1em', color: T.text3, fontFamily: T.mono,
                marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px',
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={item.categoriaColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                Dados & Métricas
              </div>
              <p style={{ fontSize: '12px', color: T.text2, lineHeight: 1.65 }}>{item.dados}</p>
            </div>

            {/* Ação */}
            <div style={{
              padding: '12px 14px', borderRadius: '10px',
              background: T.surface, border: `1px solid ${item.categoriaColor}25`,
            }}>
              <div style={{
                fontSize: '9px', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.1em', color: item.categoriaColor, fontFamily: T.mono,
                marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px',
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={item.categoriaColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                Ação Concreta
              </div>
              <p style={{ fontSize: '12px', color: T.text1, lineHeight: 1.65, fontWeight: 400 }}>{item.acao_concreta}</p>
            </div>
          </div>

          {/* Footer: potencial + copiar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{
              fontSize: '11px', fontWeight: 600,
              color: item.categoriaColor,
              background: `${item.categoriaColor}10`,
              border: `1px solid ${item.categoriaColor}20`,
              borderRadius: '6px', padding: '3px 10px',
            }}>
              🎯 {item.potencial}
            </span>
            <button
              onClick={handleCopy}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                fontSize: '11px', fontWeight: 500, cursor: 'pointer',
                padding: '4px 10px', borderRadius: '6px', transition: 'all 0.15s',
                background: copied ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${copied ? 'rgba(34,197,94,0.25)' : T.border}`,
                color: copied ? '#0E9E6E' : T.text3,
              }}
              onMouseEnter={e => { if (!copied) { e.currentTarget.style.color = T.text2; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' } }}
              onMouseLeave={e => { if (!copied) { e.currentTarget.style.color = T.text3; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' } }}
            >
              {copied ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              )}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Fallback estático
function buildStaticIntel(niche: string, budget: number): IntelItem[] {
  return [
    {
      tipo: 'oportunidade_mercado',
      icone: '◎',
      titulo: `Janela de menor CPL em ${niche}: períodos de menor concorrência`,
      categoria: 'Mercado',
      categoriaColor: '#E08B0B',
      insight: `No nicho ${niche}, CPL tende a ser 20-40% menor fora dos períodos de alta concorrência (início do mês e vésperas de datas comerciais). Poucos gestores exploram este timing.`,
      dados: 'Semanas 2 e 3 do mês: -25% no CPM. Terça a quinta: CTR 15% acima da média. Horário 10h–12h: maior intenção de compra.',
      acao_concreta: 'Analisar custos por dia da semana nos últimos 30 dias. Concentrar 70% do budget nos dias de menor concorrência identificados. Testar campanhas com início às 6h da manhã.',
      potencial: 'Redução de CPL de 20–35% com mesmo budget',
    },
    {
      tipo: 'audiencia_avancada',
      icone: '◎',
      titulo: 'Segmento de maior conversão: quem já pesquisou concorrentes',
      categoria: 'Audiência',
      categoriaColor: '#0E9E6E',
      insight: `Público que visitou páginas de concorrentes nos últimos 7 dias tem intenção de compra 3× maior que tráfego frio. No nicho ${niche}, este segmento raramente é explorado.`,
      dados: 'Remarketing de concorrentes: CPL 40-60% menor. Lookalike de compradores recentes: CVR 2× maior. Audiência por engajamento com conteúdo do nicho: CTR 2.5×.',
      acao_concreta: 'Criar audiência personalizada no Meta com visitantes de páginas de concorrentes. No Google, adicionar listas de remarketing em campanhas de busca (RLSA). Testar com 20% do budget.',
      potencial: 'CPL 40–60% menor vs tráfego frio',
    },
    {
      tipo: 'alocacao_orcamento',
      icone: '◎',
      titulo: `Redistribuição de R$${budget.toLocaleString('pt-BR')} para máximo ROAS`,
      categoria: 'Orçamento',
      categoriaColor: '#2C5FE0',
      insight: `Com budget de R$${budget.toLocaleString('pt-BR')}/mês, a alocação mais eficiente para ${niche} prioriza captura de demanda existente (Search) antes de criar demanda (Social).`,
      dados: `Google Search: CPL 30% menor mas volume limitado. Meta Awareness→Conversão: maior volume. Remarketing: menor CPL de todos os canais. Alocação ideal: 40% Search + 45% Meta + 15% Remarketing.`,
      acao_concreta: `Alocar R$${Math.round(budget * 0.4).toLocaleString('pt-BR')} em Google Search, R$${Math.round(budget * 0.45).toLocaleString('pt-BR')} em Meta e R$${Math.round(budget * 0.15).toLocaleString('pt-BR')} em remarketing unificado.`,
      potencial: 'Aumento de 25–35% no volume de leads',
    },
    {
      tipo: 'analise_competitiva',
      icone: '◎',
      titulo: `Brecha competitiva em ${niche}: o que os concorrentes ignoram`,
      categoria: 'Competição',
      categoriaColor: '#2C5FE0',
      insight: `A maioria dos anunciantes de ${niche} compete pelo mesmo público com os mesmos criativos. Existem segmentos subservidos que representam 30-40% da demanda não atendida.`,
      dados: 'Criativos genéricos do nicho têm CTR médio de 0.8-1.2%. Criativos com dor específica: CTR 2.5-4%. Campanhas com prova social (números reais): CVR 2× maior.',
      acao_concreta: 'Pesquisar os 3 maiores concorrentes na Biblioteca de Anúncios do Meta. Identificar ângulos NÃO usados. Criar 2 criativos com ângulo diferenciado e testar contra o padrão do nicho.',
      potencial: 'CTR 2–3× maior e CPL 30–50% menor',
    },
    {
      tipo: 'escala_inteligente',
      icone: '◎',
      titulo: 'Sinais de que o modelo está pronto para dobrar o investimento',
      categoria: 'Escala',
      categoriaColor: '#FB923C',
      insight: `Escalar antes da hora é o maior erro em tráfego pago. Para ${niche}, existem 3 métricas-gatilho que indicam maturidade para escalar sem elevar CPL.`,
      dados: 'Gatilhos: CPL estável por 14+ dias consecutivos, CVR lead→venda ≥ benchmark do nicho, mínimo 3 campanhas com performance reproduzível.',
      acao_concreta: 'Semana 1: Documentar CPL diário. Semana 2: Se CPL estável, aumentar 20% do budget. Semana 3-4: Aumentar mais 20% se CPL mantiver. Mês 2: Escalar canal principal agressivamente.',
      potencial: `De R$${budget.toLocaleString('pt-BR')} → R$${(budget * 3).toLocaleString('pt-BR')}/mês sem elevar CPL`,
    },
    {
      tipo: 'criativo_estrategico',
      icone: '◎',
      titulo: `Ângulo criativo de maior conversão: transformação, não produto`,
      categoria: 'Criativo',
      categoriaColor: '#EC4899',
      insight: `O público de ${niche} não compra produto — compra transformação e alívio de dor. Anúncios que mostram o ANTES e DEPOIS com prova social convertem 3× mais que anúncios de produto.`,
      dados: 'Formato vídeo com gancho de problema: CTR 3.5% (vs 1% média). Imagens com antes/depois: CVR 2.8×. Depoimento em vídeo com número real: CPL 40% menor.',
      acao_concreta: 'Gancho (0-3s): "Se você [dor específica do nicho]...". Conflito (3-10s): mostrar o problema. Solução (10-20s): resultado com prova social. CTA: urgência específica.',
      potencial: 'CTR de 2–4% e CPL 30–50% menor',
    },
  ]
}

export function TabIntelligence({ clientData }: Props) {
  const { strategyData, campaignHistory, auditCache } = useAppStore()
  const [aiIntel, setAiIntel]       = useState<IntelItem[] | null>(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [source, setSource]         = useState<'static' | 'ai'>('static')
  const [openIndex, setOpenIndex]   = useState<number | null>(0)   // primeiro item aberto por padrão
  const [activeFilter, setActiveFilter] = useState<string>('all')

  const clientAudits    = auditCache[clientData?.clientName || ''] || []
  const lastAudit       = clientAudits[0]?.audit
  const auditRealMetrics = lastAudit?._realMetrics || null

  const staticIntel  = buildStaticIntel(clientData?.niche || 'seu nicho', clientData?.budget || 5000)
  const displayIntel = source === 'ai' && aiIntel ? aiIntel : staticIntel

  const filteredIntel = activeFilter === 'all'
    ? displayIntel
    : displayIntel.filter(i => i.tipo === activeFilter)

  const handleGenerate = async () => {
    if (!clientData) return
    setLoading(true)
    setError('')
    setOpenIndex(0)
    try {
      const res = await fetch('/api/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName:     clientData.clientName,
          niche:          clientData.niche,
          budget:         clientData.budget,
          objective:      clientData.objective,
          currentCPL:     clientData.currentCPL,
          mainChallenge:  clientData.mainChallenge,
          ticketPrice:    clientData.ticketPrice,
          grossMargin:    clientData.grossMargin,
          conversionRate: clientData.conversionRate,
          isRecurring:    clientData.isRecurring,
          strategy:       strategyData?.strategy,
          campaignHistory,
          auditRealMetrics,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setAiIntel(json.inteligencia)
      setSource('ai')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '860px', display: 'flex', flexDirection: 'column', gap: '0' }}>

      {/* ── Cabeçalho ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: T.text1, margin: 0, marginBottom: '4px', letterSpacing: '-0.02em' }}>
            Inteligência de Mercado
          </h2>
          <p style={{ fontSize: '12px', color: T.text3, margin: 0 }}>
            {source === 'ai'
              ? `Análise personalizada para ${clientData?.clientName} — dados reais do nicho.`
              : 'Inteligência estratégica de tráfego pago. Gere com IA para personalizar ao máximo.'}
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading || !clientData}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 18px', borderRadius: '10px',
            fontSize: '13px', fontWeight: 700, cursor: loading || !clientData ? 'not-allowed' : 'pointer',
            background: 'linear-gradient(135deg, #2C5FE0, #2C5FE0)',
            border: 'none', color: '#fff', opacity: loading || !clientData ? 0.6 : 1,
            transition: 'opacity 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={e => { if (!loading && clientData) e.currentTarget.style.opacity = '0.85' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = loading || !clientData ? '0.6' : '1' }}
        >
          {loading ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              Analisando...
            </>
          ) : source === 'ai' ? '↻ Reanalisar' : '⚡ Gerar Inteligência'}
        </button>
      </div>

      {/* ── Filtros de categoria — tabs ──────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '4px',
        paddingBottom: '16px', borderBottom: `1px solid ${T.border}`,
      }}>
        {/* All */}
        <button
          onClick={() => { setActiveFilter('all'); setOpenIndex(null) }}
          style={{
            padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.12s',
            background: activeFilter === 'all' ? T.purpleBg : 'transparent',
            border: `1px solid ${activeFilter === 'all' ? 'rgba(124,58,237,0.3)' : T.border}`,
            color: activeFilter === 'all' ? T.purpleHi : T.text3,
          }}
        >
          Todos ({displayIntel.length})
        </button>

        {CATEGORIES.map(cat => {
          const count  = displayIntel.filter(i => i.tipo === cat.tipo).length
          const active = activeFilter === cat.tipo
          return (
            <button
              key={cat.tipo}
              onClick={() => { setActiveFilter(active ? 'all' : cat.tipo); setOpenIndex(0) }}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.12s',
                background: active ? `${cat.color}12` : 'transparent',
                border: `1px solid ${active ? cat.color + '35' : T.border}`,
                color: active ? cat.color : T.text3,
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: active ? cat.color : T.text3, flexShrink: 0, transition: 'background 0.12s' }} />
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* ── Status / badges ──────────────────────────────────────────────── */}
      {(source === 'ai' || auditRealMetrics) && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '10px 0 4px' }}>
          {source === 'ai' && (
            <span style={{
              fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px',
              background: T.purpleBg, color: T.purpleHi, border: `1px solid rgba(124,58,237,0.2)`,
            }}>✨ Personalizada por IA</span>
          )}
          {auditRealMetrics && (
            <span style={{
              fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px',
              background: 'rgba(34,197,94,0.08)', color: '#0E9E6E', border: '1px solid rgba(34,197,94,0.2)',
            }}>📊 Dados reais da auditoria</span>
          )}
        </div>
      )}

      {/* ── Banner "padrão do nicho" ─────────────────────────────────────── */}
      {source === 'static' && !loading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 12px', borderRadius: '8px', margin: '8px 0',
          background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)',
        }}>
          <span style={{ fontSize: '13px', flexShrink: 0 }}>💡</span>
          <span style={{ fontSize: '11px', color: T.text3, lineHeight: 1.5 }}>
            Mostrando inteligência padrão do nicho.{' '}
            <button
              onClick={handleGenerate}
              style={{ color: T.purpleHi, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0, fontSize: '11px' }}
            >
              Gerar Inteligência
            </button>
            {' '}para análise personalizada com os dados deste cliente.
          </span>
        </div>
      )}

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: '8px', margin: '4px 0', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '12px', color: '#E1483F' }}>
          {error}
        </div>
      )}

      {/* ── Loading skeleton ─────────────────────────────────────────────── */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', marginTop: '8px' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '16px 0', borderBottom: `1px solid ${T.border}`,
            }}>
              <div style={{ width: '20px', height: '10px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
              <div style={{ flex: 1, height: '13px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }} />
              <div style={{ width: '120px', height: '13px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', flexShrink: 0 }} />
            </div>
          ))}
        </div>
      )}

      {/* ── Lista accordion ──────────────────────────────────────────────── */}
      {!loading && (
        <div style={{ marginTop: '4px' }}>
          {filteredIntel.map((item, i) => (
            <AccordionItem
              key={`${source}-${activeFilter}-${i}`}
              item={item}
              index={i}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}

          {filteredIntel.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: T.text3, fontSize: '13px' }}>
              Nenhum insight nesta categoria.
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeDown { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
