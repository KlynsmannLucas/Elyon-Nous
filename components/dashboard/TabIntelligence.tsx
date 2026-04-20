// components/dashboard/TabIntelligence.tsx — Inteligência de mercado senior (não ideias de conteúdo)
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

function IntelCard({ item, index }: { item: IntelItem; index: number }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="bg-[#111114] border rounded-2xl overflow-hidden transition-all duration-300 animate-fade-up"
      style={{
        borderColor: expanded ? `${item.categoriaColor}40` : '#2A2A30',
        animationDelay: `${index * 0.07}s`,
      }}
    >
      <div
        className="p-5 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: `${item.categoriaColor}18` }}
          >
            {item.icone}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-1">
              <h4 className="font-display font-bold text-white text-sm leading-snug">{item.titulo}</h4>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap"
                style={{ color: item.categoriaColor, background: `${item.categoriaColor}18` }}
              >
                {item.categoria}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{item.insight}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-semibold" style={{ color: item.categoriaColor }}>
                {expanded ? '▲ Fechar análise' : '▼ Ver análise completa →'}
              </span>
              <span className="text-[10px] text-slate-700">{item.potencial}</span>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 pt-0" style={{ borderTop: `1px solid ${item.categoriaColor}20` }}>
          <div className="pt-4 space-y-4">
            {/* Dados quantitativos */}
            <div className="bg-[#16161A] rounded-xl p-4 border border-[#2A2A30]">
              <div className="text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1.5"
                style={{ color: item.categoriaColor }}>
                <span>📊</span> Dados & Métricas
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{item.dados}</p>
            </div>

            {/* Ação concreta */}
            <div className="bg-[#16161A] rounded-xl p-4 border border-[#2A2A30]">
              <div className="text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1.5"
                style={{ color: item.categoriaColor }}>
                <span>⚡</span> Ação Concreta
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{item.acao_concreta}</p>
            </div>

            {/* Potencial */}
            <div className="rounded-xl p-3"
              style={{ background: `${item.categoriaColor}08`, border: `1px solid ${item.categoriaColor}25` }}>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: item.categoriaColor }}>
                🎯 Potencial
              </div>
              <p className="text-sm font-semibold" style={{ color: item.categoriaColor }}>{item.potencial}</p>
            </div>

            {/* Copiar */}
            <CopyButton item={item} color={item.categoriaColor} />
          </div>
        </div>
      )}
    </div>
  )
}

function CopyButton({ item, color }: { item: IntelItem; color: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    const text = `🎯 ${item.titulo}\n\nInsight: ${item.insight}\n\nDados: ${item.dados}\n\nAção: ${item.acao_concreta}\n\nPotencial: ${item.potencial}`
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg transition-all hover:opacity-80 w-full justify-center"
      style={{
        background: copied ? 'rgba(34,197,94,0.1)' : `${color}10`,
        color: copied ? '#22C55E' : color,
        border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : `${color}25`}`,
      }}
    >
      {copied ? '✓ Copiado!' : '📋 Copiar inteligência'}
    </button>
  )
}

// Fallback estático quando IA não disponível
function buildStaticIntel(niche: string, budget: number): IntelItem[] {
  return [
    {
      tipo: 'oportunidade_mercado',
      icone: '🎯',
      titulo: `Janela de menor CPL em ${niche}: períodos de menor concorrência`,
      categoria: 'Mercado',
      categoriaColor: '#F0B429',
      insight: `No nicho ${niche}, CPL tende a ser 20-40% menor fora dos períodos de alta concorrência (início do mês e vésperas de datas comerciais). Poucos gestores exploram este timing.`,
      dados: 'Semanas 2 e 3 do mês: -25% no CPM. Terça a quinta: CTR 15% acima da média. Horário 10h–12h: maior intenção de compra.',
      acao_concreta: 'Analisar custos por dia da semana nos últimos 30 dias. Concentrar 70% do budget nos dias de menor concorrência identificados. Testar campanhas com início às 6h da manhã.',
      potencial: 'Redução de CPL de 20-35% com mesmo budget',
    },
    {
      tipo: 'audiencia_avancada',
      icone: '👥',
      titulo: 'Segmento de audiência com maior conversão: quem já pesquisou concorrentes',
      categoria: 'Audiência',
      categoriaColor: '#22C55E',
      insight: `Público que visitou páginas de concorrentes nos últimos 7 dias tem intenção de compra 3× maior que tráfego frio. No nicho ${niche}, este segmento raramente é explorado.`,
      dados: 'Remarketing de concorrentes: CPL 40-60% menor. Lookalike de compradores recentes: CVR 2× maior. Audiência por engajamento com conteúdo do nicho: CTR 2.5×.',
      acao_concreta: 'Criar audiência personalizada no Meta com visitantes de páginas de concorrentes. No Google, adicionar listas de remarketing em campanhas de busca (RLSA). Testar com 20% do budget.',
      potencial: 'CPL 40-60% menor neste segmento vs tráfego frio',
    },
    {
      tipo: 'alocacao_orcamento',
      icone: '💰',
      titulo: `Redistribuição de R$${budget.toLocaleString('pt-BR')} para máximo ROAS`,
      categoria: 'Orçamento',
      categoriaColor: '#38BDF8',
      insight: `Com budget de R$${budget.toLocaleString('pt-BR')}/mês, a alocação mais eficiente para ${niche} prioriza captura de demanda existente (Search) antes de criar demanda (Social).`,
      dados: `Google Search: CPL 30% menor mas volume limitado. Meta Awareness→Conversão: maior volume. Remarketing: menor CPL de todos os canais. Alocação ideal: 40% Search + 45% Meta + 15% Remarketing.`,
      acao_concreta: `Alocar R$${Math.round(budget * 0.4).toLocaleString('pt-BR')} em Google Search (termos de intenção alta), R$${Math.round(budget * 0.45).toLocaleString('pt-BR')} em Meta (prospecção) e R$${Math.round(budget * 0.15).toLocaleString('pt-BR')} em remarketing unificado.`,
      potencial: 'Aumento de 25-35% no volume de leads com mesmo investimento',
    },
    {
      tipo: 'analise_competitiva',
      icone: '🔍',
      titulo: `Brecha competitiva em ${niche}: o que os concorrentes ignoram`,
      categoria: 'Competição',
      categoriaColor: '#A78BFA',
      insight: `A maioria dos anunciantes de ${niche} compete pelo mesmo público com os mesmos criativos. Existem segmentos subservidos que representam 30-40% da demanda não atendida.`,
      dados: 'Criativos genéricos do nicho têm CTR médio de 0.8-1.2%. Criativos com dor específica: CTR 2.5-4%. Campanhas com prova social (números reais): CVR 2× maior.',
      acao_concreta: 'Pesquisar os 3 maiores concorrentes do nicho na Biblioteca de Anúncios do Meta. Identificar ângulos NÃO usados. Criar 2 criativos com ângulo diferenciado e testar contra o padrão do nicho.',
      potencial: 'CTR 2-3× maior e CPL 30-50% menor vs criativos padrão do nicho',
    },
    {
      tipo: 'escala_inteligente',
      icone: '📈',
      titulo: 'Sinais de que o modelo está pronto para dobrar o investimento',
      categoria: 'Escala',
      categoriaColor: '#FB923C',
      insight: `Escalar antes da hora é o maior erro em tráfego pago. Para ${niche}, existem 3 métricas-gatilho que indicam que o modelo está maduro para escalar sem elevar CPL.`,
      dados: 'Gatilhos de escala: CPL estável por 14+ dias consecutivos, CVR lead→venda ≥ benchmark do nicho, mínimo 3 campanhas com performance reproduzível.',
      acao_concreta: 'Semana 1: Documentar CPL diário. Semana 2: Se CPL estável, aumentar 20% do budget. Semana 3-4: Aumentar mais 20% se CPL mantiver. Mês 2: Escalar canal principal agressivamente.',
      potencial: `De R$${budget.toLocaleString('pt-BR')} para R$${(budget * 3).toLocaleString('pt-BR')}/mês sem elevar CPL`,
    },
    {
      tipo: 'criativo_estrategico',
      icone: '🎨',
      titulo: `Ângulo criativo de maior conversão para ${niche}: transformação, não produto`,
      categoria: 'Criativo',
      categoriaColor: '#EC4899',
      insight: `O público de ${niche} não compra produto — compra transformação e alívio de dor. Anúncios que mostram o ANTES e DEPOIS com prova social convertem 3× mais que anúncios de produto.`,
      dados: 'Formato vídeo com gancho de problema: CTR 3.5% (vs 1% média). Imagens com antes/depois: CVR 2.8×. Depoimento em vídeo com número real: CPL 40% menor. Primeira frase: "Se você tem [dor específica]..."',
      acao_concreta: 'Estrutura do próximo criativo: Gancho (0-3s): "Se você [dor específica do nicho]...". Conflito (3-10s): mostrar o problema. Solução (10-20s): resultado com prova social. CTA: urgência específica.',
      potencial: 'CTR de 2-4% e redução de CPL de 30-50% vs criativos atuais',
    },
  ]
}

export function TabIntelligence({ clientData }: Props) {
  const { strategyData, campaignHistory, auditCache } = useAppStore()
  const [aiIntel, setAiIntel] = useState<IntelItem[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [source, setSource] = useState<'static' | 'ai'>('static')

  const clientAudits = auditCache[clientData?.clientName || ''] || []
  const lastAudit = clientAudits[0]?.audit
  const auditRealMetrics = lastAudit?._realMetrics || null

  const staticIntel = buildStaticIntel(clientData?.niche || 'seu nicho', clientData?.budget || 5000)
  const displayIntel = source === 'ai' && aiIntel ? aiIntel : staticIntel

  const handleGenerate = async () => {
    if (!clientData) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientData.clientName,
          niche: clientData.niche,
          budget: clientData.budget,
          objective: clientData.objective,
          currentCPL: clientData.currentCPL,
          mainChallenge: clientData.mainChallenge,
          ticketPrice: clientData.ticketPrice,
          grossMargin: clientData.grossMargin,
          conversionRate: clientData.conversionRate,
          isRecurring: clientData.isRecurring,
          strategy: strategyData?.strategy,
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

  const tipoLabel: Record<string, string> = {
    oportunidade_mercado: '📊 Oportunidade de Mercado',
    audiencia_avancada: '👥 Audiência Avançada',
    alocacao_orcamento: '💰 Alocação de Orçamento',
    analise_competitiva: '🔍 Análise Competitiva',
    escala_inteligente: '📈 Estratégia de Escala',
    criativo_estrategico: '🎨 Criativo Estratégico',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-white mb-1">Inteligência de Mercado</h2>
          <p className="text-slate-500 text-sm">
            {source === 'ai'
              ? `Análise estratégica personalizada para ${clientData?.clientName || 'este cliente'} — dados reais do nicho.`
              : 'Inteligência estratégica de tráfego pago. Gere com IA para personalizar ao máximo.'}
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading || !clientData}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #A78BFA, #7C3AED)', color: '#fff' }}
        >
          {loading ? '🧠 Analisando mercado...' : source === 'ai' ? '🔄 Reanalisar' : '🧠 Gerar Inteligência'}
        </button>
      </div>

      {/* Resumo dos módulos */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {[
          { tipo: 'oportunidade_mercado', icon: '🎯', label: 'Mercado', color: '#F0B429' },
          { tipo: 'audiencia_avancada', icon: '👥', label: 'Audiência', color: '#22C55E' },
          { tipo: 'alocacao_orcamento', icon: '💰', label: 'Orçamento', color: '#38BDF8' },
          { tipo: 'analise_competitiva', icon: '🔍', label: 'Competição', color: '#A78BFA' },
          { tipo: 'escala_inteligente', icon: '📈', label: 'Escala', color: '#FB923C' },
          { tipo: 'criativo_estrategico', icon: '🎨', label: 'Criativo', color: '#EC4899' },
        ].map((m) => (
          <div key={m.tipo} className="bg-[#111114] border border-[#2A2A30] rounded-xl p-2.5 text-center">
            <div className="text-lg mb-0.5">{m.icon}</div>
            <div className="text-[10px] font-semibold" style={{ color: m.color }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        {clientData?.niche && (
          <span className="px-3 py-1 rounded-full font-semibold"
            style={{ background: 'rgba(240,180,41,0.1)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.25)' }}>
            Nicho: {clientData.niche}
          </span>
        )}
        {source === 'ai' && (
          <span className="px-3 py-1 rounded-full font-semibold"
            style={{ background: 'rgba(167,139,250,0.1)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.25)' }}>
            ✨ Personalizada por IA Sênior
          </span>
        )}
        {auditRealMetrics && (
          <span className="px-3 py-1 rounded-full font-semibold"
            style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.25)' }}>
            📊 Dados reais da auditoria
          </span>
        )}
        {campaignHistory.length > 0 && (
          <span className="text-slate-600 text-[11px]">
            · {campaignHistory.length} períodos de histórico
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#111114] border border-[#2A2A30] rounded-2xl p-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#1E1E24] flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#1E1E24] rounded w-3/4" />
                  <div className="h-3 bg-[#1E1E24] rounded w-full" />
                  <div className="h-3 bg-[#1E1E24] rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cards de inteligência */}
      {!loading && (
        <div className="space-y-3">
          {source === 'static' && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs"
              style={{ background: 'rgba(240,180,41,0.06)', border: '1px solid rgba(240,180,41,0.2)' }}>
              <span className="text-[#F0B429]">💡</span>
              <span className="text-slate-400">Mostrando inteligência padrão do nicho. Clique em <strong className="text-white">Gerar Inteligência</strong> para análise personalizada com os dados deste cliente.</span>
            </div>
          )}
          {displayIntel.map((item, i) => (
            <IntelCard key={`${source}-${i}`} item={item} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
