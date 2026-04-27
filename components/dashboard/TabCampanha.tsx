'use client'
// components/dashboard/TabCampanha.tsx — Campanha Campeã
import { useState } from 'react'
import { useAppStore } from '@/lib/store'

interface AdVariation {
  framework: string
  platform: 'meta' | 'google'
  headline: string
  primaryText?: string
  description?: string
  hook: string
  cta: string
  angle: string
  visualNotes: string
  testHypothesis: string
}

interface CampaignResult {
  bigIdea: string
  toneOfVoice: string
  metaVariations: AdVariation[]
  googleVariations: AdVariation[]
  alternativeHeadlines: string[]
  alternativeCTAs: string[]
  creativePlan: Array<{ week: string; test: string; metric: string }>
  anglesToAvoid: string[]
  generatedAt: string
  context: {
    benchmarkUsed: boolean
    auditorDataUsed: boolean
    estrategistaDataUsed: boolean
    cplTarget: number | null
    funnelGap: string | null
  }
}

const FRAMEWORK_LABELS: Record<string, { label: string; color: string }> = {
  dor:          { label: 'Dor',          color: 'bg-red-500/15 text-red-400 border-red-500/30' },
  desejo:       { label: 'Desejo',       color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  prova_social: { label: 'Prova Social', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  urgencia:     { label: 'Urgência',     color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  autoridade:   { label: 'Autoridade',   color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  transformacao:{ label: 'Transformação',color: 'bg-green-500/15 text-green-400 border-green-500/30' },
  objecao:      { label: 'Objeção',      color: 'bg-pink-500/15 text-pink-400 border-pink-500/30' },
  curiosidade:  { label: 'Curiosidade',  color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {})
}

function AdCard({ ad }: { ad: AdVariation }) {
  const [copied, setCopied] = useState(false)
  const fw = FRAMEWORK_LABELS[ad.framework] || { label: ad.framework, color: 'bg-zinc-700 text-zinc-300 border-zinc-600' }

  function handleCopy() {
    const text = ad.platform === 'meta'
      ? `HEADLINE: ${ad.headline}\n\nTEXTO: ${ad.primaryText}\n\nCTA: ${ad.cta}`
      : `HEADLINE: ${ad.headline}\n\nDESCRIÇÃO: ${ad.description}\n\nCTA: ${ad.cta}`
    copyToClipboard(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group relative rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 hover:border-zinc-700 transition-all">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${fw.color}`}>
            {fw.label}
          </span>
          <span className="text-xs text-zinc-500 capitalize">{ad.angle}</span>
        </div>
        <button
          onClick={handleCopy}
          className="shrink-0 text-xs px-2 py-1 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-all"
        >
          {copied ? '✓ Copiado' : 'Copiar'}
        </button>
      </div>

      <div className="mb-2">
        <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-0.5">Headline</p>
        <p className="font-bold text-white text-sm leading-tight">{ad.headline}</p>
      </div>

      {ad.platform === 'meta' && ad.primaryText && (
        <div className="mb-2">
          <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-0.5">Texto principal</p>
          <p className="text-zinc-300 text-sm leading-relaxed">{ad.primaryText}</p>
        </div>
      )}
      {ad.platform === 'google' && ad.description && (
        <div className="mb-2">
          <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-0.5">Descrição</p>
          <p className="text-zinc-300 text-sm leading-relaxed">{ad.description}</p>
        </div>
      )}

      <div className="mb-3">
        <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          → {ad.cta}
        </span>
      </div>

      <div className="border-t border-zinc-800 pt-3 space-y-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-0.5">Gancho</p>
          <p className="text-zinc-500 text-xs italic">"{ad.hook}"</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-0.5">Orientação visual</p>
          <p className="text-zinc-500 text-xs">{ad.visualNotes}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-0.5">O que esta variação testa</p>
          <p className="text-zinc-500 text-xs">{ad.testHypothesis}</p>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ title, count, platform }: { title: string; count: number; platform: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold
        ${platform === 'meta' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
        {platform === 'meta' ? 'M' : 'G'}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="text-xs text-zinc-500">{count} variações geradas</p>
      </div>
    </div>
  )
}

export function TabCampanha() {
  const clientData = useAppStore(s => s.clientData)

  const [loading,   setLoading]   = useState(false)
  const [result,    setResult]    = useState<CampaignResult | null>(null)
  const [error,     setError]     = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'meta' | 'google' | 'extras'>('meta')

  const [form, setForm] = useState({
    product:         '',
    offer:           '',
    mainPain:        '',
    mainDesire:      '',
    variationsPerFw: '2',
  })

  async function handleGenerate() {
    if (!clientData?.niche) {
      setError('Configure seu nicho no setup primeiro.')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/campaign/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName:            clientData.clientName || 'Cliente',
          niche:                 clientData.niche,
          ticketPrice:           clientData.ticketPrice,
          grossMargin:           clientData.grossMargin,
          conversionRate:        clientData.conversionRate,
          currentCPL:            clientData.currentCPL,
          budget:                clientData.budget,
          product:               form.product  || clientData.products?.[0],
          offer:                 form.offer    || undefined,
          mainPain:              form.mainPain || undefined,
          mainDesire:            form.mainDesire || undefined,
          variationsPerFramework: parseInt(form.variationsPerFw) || 2,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Erro ao gerar campanha')
      setResult(data)
      setActiveTab('meta')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Campanha Campeã</h2>
          <p className="text-sm text-zinc-400 mt-0.5">
            Copy gerado pelo benchmark real do seu nicho — não por suposições.
          </p>
        </div>
        {result && (
          <span className="shrink-0 text-xs text-zinc-500 pt-1">
            Gerado {new Date(result.generatedAt).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Formulário de customização */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Personalizar campanha (opcional)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: 'product',   label: 'Produto / Serviço',        placeholder: clientData?.products?.[0] || 'Ex: Clareamento dental' },
            { key: 'offer',     label: 'Oferta específica',         placeholder: 'Ex: 1ª consulta grátis' },
            { key: 'mainPain',  label: 'Principal dor do cliente',  placeholder: 'Ex: Vergonha de sorrir em fotos' },
            { key: 'mainDesire',label: 'Principal desejo',          placeholder: 'Ex: Sorriso bonito sem parecer forçado' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs text-zinc-500 mb-1">{label}</label>
              <input
                type="text"
                placeholder={placeholder}
                value={form[key as keyof typeof form]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs text-zinc-500">Variações por framework:</label>
          {['1', '2', '3'].map(n => (
            <button
              key={n}
              onClick={() => setForm(f => ({ ...f, variationsPerFw: n }))}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-all
                ${form.variationsPerFw === n
                  ? 'bg-white text-zinc-900'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Botão */}
      <button
        onClick={handleGenerate}
        disabled={loading || !clientData?.niche}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-all bg-white text-zinc-900 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin" />
            Gerando campanha com IA...
          </span>
        ) : result ? 'Gerar nova versão' : '⚡ Gerar Campanha Campeã'}
      </button>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Resultado */}
      {result && (
        <div className="space-y-6">

          {/* Big Idea */}
          <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-4">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Big Idea da Campanha</p>
            <p className="text-white font-semibold text-sm leading-relaxed">"{result.bigIdea}"</p>
            <p className="text-zinc-500 text-xs mt-2">{result.toneOfVoice}</p>
          </div>

          {/* Badges de contexto */}
          {(result.context.benchmarkUsed || result.context.cplTarget) && (
            <div className="flex flex-wrap gap-2">
              {result.context.benchmarkUsed && (
                <span className="text-xs px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  ✓ Benchmark do nicho aplicado
                </span>
              )}
              {result.context.cplTarget && (
                <span className="text-xs px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  ✓ CPL alvo R${result.context.cplTarget}
                </span>
              )}
              {result.context.funnelGap && (
                <span className="text-xs px-2 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  ⚠ Foco no {result.context.funnelGap}
                </span>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
            {([
              { id: 'meta',   label: `Meta Ads (${result.metaVariations.length})` },
              { id: 'google', label: `Google Ads (${result.googleVariations.length})` },
              { id: 'extras', label: 'Extras & Plano' },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all
                  ${activeTab === tab.id ? 'bg-white text-zinc-900' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'meta' && (
            <div>
              <SectionHeader title="Anúncios para Meta Ads" count={result.metaVariations.length} platform="meta" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.metaVariations.map((ad, i) => <AdCard key={i} ad={ad} />)}
              </div>
            </div>
          )}

          {activeTab === 'google' && (
            <div>
              <SectionHeader title="Anúncios para Google Ads" count={result.googleVariations.length} platform="google" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.googleVariations.map((ad, i) => <AdCard key={i} ad={ad} />)}
              </div>
            </div>
          )}

          {activeTab === 'extras' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                  Headlines para testes rápidos
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.alternativeHeadlines.map((h, i) => (
                    <button key={i} onClick={() => copyToClipboard(h)} title="Clique para copiar"
                      className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all cursor-copy">
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">CTAs alternativos</p>
                <div className="flex flex-wrap gap-2">
                  {result.alternativeCTAs.map((cta, i) => (
                    <button key={i} onClick={() => copyToClipboard(cta)} title="Clique para copiar"
                      className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-copy">
                      → {cta}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                  Plano de testes — 3 semanas
                </p>
                <div className="space-y-3">
                  {result.creativePlan.map((step, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="shrink-0 text-xs font-bold text-zinc-500 w-16 pt-0.5">{step.week}</span>
                      <div>
                        <p className="text-sm text-white">{step.test}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">Métrica decisora: {step.metric}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {result.anglesToAvoid?.length > 0 && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">
                    Ângulos que não funcionam neste nicho
                  </p>
                  <ul className="space-y-1">
                    {result.anglesToAvoid.map((a, i) => (
                      <li key={i} className="text-sm text-zinc-400 flex gap-2">
                        <span className="text-red-500 shrink-0">✗</span>{a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Estado vazio */}
      {!result && !loading && !error && (
        <div className="rounded-xl border border-dashed border-zinc-800 p-10 text-center">
          <p className="text-3xl mb-3">⚡</p>
          <p className="text-sm font-semibold text-zinc-300 mb-1">Gere anúncios calibrados pelo nicho</p>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            A IA usa o benchmark real do nicho para criar variações de Meta e Google Ads prontas para subir.
          </p>
        </div>
      )}
    </div>
  )
}
