// components/dashboard/SetupWizard.tsx — Onboarding inteligente por nicho (ELYON AGENT)
'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { getBenchmark } from '@/lib/niche_benchmarks'
import { getNicheConfig } from '@/lib/niche_prompts'

const NICHE_GROUPS: { label: string; niches: string[] }[] = [
  {
    label: '🍽️ Alimentação',
    niches: [
      'Restaurante', 'Lanchonete', 'Hamburgueria', 'Pizzaria', 'Marmitaria',
      'Padaria', 'Confeitaria', 'Cafeteria', 'Food Truck', 'Delivery de Comida',
    ],
  },
  {
    label: '🏪 Comércio e Varejo',
    niches: [
      'Loja de Roupas', 'Loja de Calçados', 'Loja de Eletrônicos', 'Loja de Móveis',
      'Loja de Cosméticos', 'Loja de Suplementos', 'Loja de Brinquedos',
      'Papelaria', 'Loja de Presentes', 'E-commerce / Loja Online',
    ],
  },
  {
    label: '💅 Beleza e Estética',
    niches: [
      'Salão de Beleza', 'Barbearia', 'Clínica Estética', 'Manicure e Pedicure',
      'Estúdio de Sobrancelhas', 'Clínica de Depilação', 'Harmonização Facial',
      'Estética Corporal', 'Spa', 'Cabeleireiro',
    ],
  },
  {
    label: '🏥 Saúde e Serviços Médicos',
    niches: [
      'Odontologia Estética', 'Odontologia Geral', 'Clínica Médica', 'Fisioterapia',
      'Psicologia / Terapia', 'Nutricionista', 'Farmácia', 'Laboratório',
      'Clínica Veterinária', 'Home Care', 'Terapias Alternativas',
    ],
  },
  {
    label: '🏗️ Construção e Casa',
    niches: [
      'Construção Civil', 'Reformas', 'Pintura Residencial', 'Marcenaria / Móveis Planejados',
      'Vidraçaria', 'Serralheria', 'Eletricista', 'Encanador',
      'Limpeza Residencial', 'Dedetização',
    ],
  },
  {
    label: '🚗 Automotivo',
    niches: [
      'Mecânica', 'Funilaria e Pintura', 'Lava Jato', 'Estética Automotiva',
      'Autopeças', 'Borracharia', 'Guincho', 'Aluguel de Carros',
      'Venda de Veículos', 'Insulfilm',
    ],
  },
  {
    label: '📚 Educação e Treinamento',
    niches: [
      'Escola / Colégio', 'Curso de Idiomas', 'Reforço Escolar', 'Curso Técnico',
      'Autoescola', 'Escola de Música', 'Cursos Profissionalizantes',
      'Treinamento Corporativo', 'Aulas Particulares', 'Educação Infantil',
    ],
  },
  {
    label: '🐾 Pets e Serviços',
    niches: [
      'Pet Shop', 'Hotel para Pets', 'Clínica Veterinária', 'Adestramento',
    ],
  },
  {
    label: '💼 Serviços Profissionais',
    niches: [
      'Contabilidade', 'Advocacia / Jurídico', 'Imobiliária / Corretor',
      'Agência de Marketing', 'Consultoria de Negócios', 'Financeiro / Crédito',
      'Segurança Privada', 'Tecnologia / SaaS', 'Fotografia / Vídeo',
      'Arquitetura / Design de Interiores',
    ],
  },
  {
    label: '🎉 Eventos e Lazer',
    niches: [
      'Organização de Eventos', 'Buffet', 'Turismo / Agência de Viagens',
      'Academia / Fitness', 'Pilates / Yoga', 'Entretenimento',
    ],
  },
  {
    label: '🔧 Serviços Cotidianos',
    niches: [
      'Lavanderia', 'Costureira / Alfaiataria', 'Gráfica',
      'Despacho / Despachante', 'Outro',
    ],
  },
]


const OBJECTIVES = [
  { value: 'leads',    label: 'Gerar leads / clientes qualificados',  icon: '🎯' },
  { value: 'vendas',   label: 'Aumentar vendas e faturamento',         icon: '💰' },
  { value: 'brand',    label: 'Construir autoridade e marca',          icon: '🏆' },
  { value: 'retencao', label: 'Reter e fidelizar clientes',            icon: '❤️' },
]

const TOTAL_STEPS = 6

interface Props {
  onComplete: () => void
}

function inputClass(focused = false) {
  return `w-full bg-[#111114] border rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none transition-colors ${
    focused ? 'border-[#F0B429]' : 'border-[#2A2A30] focus:border-[#F0B429]'
  }`
}

export function SetupWizard({ onComplete }: Props) {
  const { setClientData, setWizardStep, wizardStep } = useAppStore()

  const [form, setForm] = useState({
    clientName:         '',
    niche:              '',
    customNiche:        '',
    city:               '',
    products:           '',
    budget:             '',
    objective:          'leads',
    monthlyRevenue:     '',
    nicheDetails:       {} as Record<string, string>,
    currentCPL:         '',
    mainChallenge:      '',
    currentLeadSource:  '',
  })
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const step      = wizardStep
  const niche     = form.niche === 'Outro' ? form.customNiche : form.niche
  const bench     = getBenchmark(niche)
  const nicheConf = getNicheConfig(niche)

  const update = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const updateDetail = (key: string, value: string) =>
    setForm((f) => ({ ...f, nicheDetails: { ...f.nicheDetails, [key]: value } }))

  const canNext = () => {
    if (step === 0) return form.clientName.trim().length > 1
    if (step === 1) return form.niche.length > 0
    if (step === 2) return true // detalhes do nicho são opcionais
    if (step === 3) return form.products.trim().length > 3
    if (step === 4) return Number(form.budget) >= 500
    return true
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    try {
      const clientData = {
        clientName:        form.clientName,
        niche,
        city:              form.city || undefined,
        products:          form.products.split('\n').filter(Boolean),
        budget:            Math.max(0, Number(form.budget) || 0),
        objective:         form.objective,
        monthlyRevenue:    Number(form.monthlyRevenue) || 0,
        nicheDetails:      Object.keys(form.nicheDetails).length > 0 ? form.nicheDetails : undefined,
        currentCPL:        form.currentCPL ? Number(form.currentCPL) : undefined,
        mainChallenge:     form.mainChallenge || undefined,
        currentLeadSource: form.currentLeadSource || undefined,
      }
      setClientData(clientData)
      onComplete()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const productPlaceholder = nicheConf?.productPlaceholder
    || 'Liste um produto/serviço por linha\nEx: Serviço A\nServiço B'

  // Label do objetivo adaptada ao nicho
  const objectiveLabel = (value: string) => {
    if (nicheConf?.objectiveLabels?.[value]) return nicheConf.objectiveLabels[value]
    return OBJECTIVES.find((o) => o.value === value)?.label || value
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-lg">

        {/* Progress bar */}
        <div className="flex items-center gap-1.5 mb-8">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full transition-all duration-500"
              style={{
                background: i <= step
                  ? 'linear-gradient(90deg, #F0B429, #FFD166)'
                  : '#2A2A30',
              }}
            />
          ))}
        </div>

        {/* ── Step 0: Nome do cliente ── */}
        {step === 0 && (
          <div className="animate-fade-up">
            <p className="text-xs text-[#F0B429] font-semibold uppercase tracking-widest mb-3">
              Passo 1 de {TOTAL_STEPS}
            </p>
            <h2 className="font-display text-3xl font-bold text-white mb-2">
              Qual é o nome do cliente?
            </h2>
            <p className="text-slate-500 text-sm mb-8">
              Pode ser o nome da empresa ou da pessoa.
            </p>
            <input
              type="text"
              className={inputClass()}
              style={{ fontSize: '1.125rem' }}
              placeholder="Ex: Clínica Dr. Rafael, Studio Fit, Imobiliária Silva..."
              value={form.clientName}
              onChange={(e) => update('clientName', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && canNext() && setWizardStep(1)}
              autoFocus
            />
            <div className="mt-4">
              <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
                Cidade / Região (opcional)
              </label>
              <input
                type="text"
                className={inputClass()}
                placeholder="Ex: São Paulo - SP, Campinas, Grande BH..."
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ── Step 1: Nicho ── */}
        {step === 1 && (
          <div className="animate-fade-up">
            <p className="text-xs text-[#F0B429] font-semibold uppercase tracking-widest mb-3">
              Passo 2 de {TOTAL_STEPS}
            </p>
            <h2 className="font-display text-3xl font-bold text-white mb-2">
              Qual é o segmento de mercado?
            </h2>
            <p className="text-slate-500 text-sm mb-4">
              O ELYON ajusta toda a análise ao seu mercado específico.
            </p>

            {/* Busca rápida */}
            <input
              type="text"
              className={inputClass()}
              placeholder="🔍  Buscar nicho..."
              value={form.customNiche}
              onChange={(e) => update('customNiche', e.target.value)}
            />

            <div className="mt-3 max-h-64 overflow-y-auto pr-1 space-y-3">
              {NICHE_GROUPS.map((group) => {
                const filtered = form.customNiche
                  ? group.niches.filter((n) =>
                      n.toLowerCase().includes(form.customNiche.toLowerCase())
                    )
                  : group.niches
                if (filtered.length === 0) return null
                return (
                  <div key={group.label}>
                    <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5 px-1">
                      {group.label}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {filtered.map((n) => (
                        <button
                          key={n}
                          onClick={() => { update('niche', n); update('customNiche', '') }}
                          className="px-3 py-2 rounded-xl text-xs font-medium text-left transition-all"
                          style={{
                            background: form.niche === n ? 'rgba(240,180,41,0.12)' : '#111114',
                            border: form.niche === n ? '1px solid rgba(240,180,41,0.5)' : '1px solid #2A2A30',
                            color: form.niche === n ? '#F0B429' : '#94A3B8',
                          }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {form.niche && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.2)' }}>
                <span className="text-xs text-[#F0B429] font-semibold">Selecionado:</span>
                <span className="text-xs text-white">{form.niche}</span>
                <button onClick={() => update('niche', '')} className="ml-auto text-slate-600 hover:text-slate-400 text-sm">×</button>
              </div>
            )}
            {/* Preview do benchmark */}
            {bench && (
              <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(240,180,41,0.06)', border: '1px solid rgba(240,180,41,0.2)' }}>
                <p className="text-xs text-[#F0B429] font-semibold mb-2">
                  📊 Dados reais do mercado: {bench.name}
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-sm font-bold text-white">R${bench.cpl_min}–{bench.cpl_max}</div>
                    <div className="text-[10px] text-slate-500">CPL médio</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#22C55E]">{bench.kpi_thresholds.roas_good}×</div>
                    <div className="text-[10px] text-slate-500">ROAS bom</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#A78BFA]">{(bench.cvr_lead_to_sale * 100).toFixed(0)}%</div>
                    <div className="text-[10px] text-slate-500">CVR lead→venda</div>
                  </div>
                </div>
                {nicheConf && (
                  <p className="text-[10px] text-slate-500 mt-2 italic">
                    "{nicheConf.analystRole}"
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Detalhes do nicho (campos dinâmicos) ── */}
        {step === 2 && (
          <div className="animate-fade-up">
            <p className="text-xs text-[#F0B429] font-semibold uppercase tracking-widest mb-3">
              Passo 3 de {TOTAL_STEPS}
            </p>
            {nicheConf ? (
              <>
                <h2 className="font-display text-3xl font-bold text-white mb-2">
                  Detalhes do negócio
                </h2>
                <p className="text-slate-500 text-sm mb-6">
                  Quanto mais específico, mais precisa é a análise do ELYON.
                </p>
                <div className="space-y-4">
                  {nicheConf.fields.map((field) => (
                    <div key={field.key}>
                      <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">
                        {field.label}
                      </label>
                      {field.type === 'select' && field.options ? (
                        <div className="grid grid-cols-1 gap-1.5">
                          {field.options.map((opt) => (
                            <button
                              key={opt}
                              onClick={() => updateDetail(field.key, opt)}
                              className="px-3 py-2.5 rounded-xl text-sm text-left transition-all"
                              style={{
                                background: form.nicheDetails[field.key] === opt ? 'rgba(240,180,41,0.1)' : '#111114',
                                border: form.nicheDetails[field.key] === opt ? '1px solid rgba(240,180,41,0.45)' : '1px solid #2A2A30',
                                color: form.nicheDetails[field.key] === opt ? '#F0B429' : '#94A3B8',
                              }}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <input
                          type={field.type === 'number' ? 'number' : 'text'}
                          className={inputClass()}
                          placeholder={field.placeholder}
                          value={form.nicheDetails[field.key] || ''}
                          onChange={(e) => updateDetail(field.key, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 className="font-display text-3xl font-bold text-white mb-2">
                  Conte mais sobre o negócio
                </h2>
                <p className="text-slate-500 text-sm mb-6">
                  Essas informações personalizam a análise estratégica.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Ticket médio por cliente</label>
                    <input type="text" className={inputClass()} placeholder="Ex: R$500 por procedimento, R$3.000 por projeto..."
                      value={form.nicheDetails['ticket_medio'] || ''}
                      onChange={(e) => updateDetail('ticket_medio', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Principal diferencial competitivo</label>
                    <input type="text" className={inputClass()} placeholder="O que faz melhor que a concorrência..."
                      value={form.nicheDetails['diferencial'] || ''}
                      onChange={(e) => updateDetail('diferencial', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Maior dificuldade atual</label>
                    <input type="text" className={inputClass()} placeholder="Ex: Gerar leads, fechar clientes, retenção..."
                      value={form.nicheDetails['maior_dor'] || ''}
                      onChange={(e) => updateDetail('maior_dor', e.target.value)} />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Step 3: Produtos / Serviços ── */}
        {step === 3 && (
          <div className="animate-fade-up">
            <p className="text-xs text-[#F0B429] font-semibold uppercase tracking-widest mb-3">
              Passo 4 de {TOTAL_STEPS}
            </p>
            <h2 className="font-display text-3xl font-bold text-white mb-2">
              Quais produtos ou serviços?
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              Liste um por linha. Seja específico — isso define o foco da estratégia.
            </p>
            <textarea
              className={inputClass()}
              style={{ resize: 'none' }}
              placeholder={productPlaceholder}
              rows={5}
              value={form.products}
              onChange={(e) => update('products', e.target.value)}
            />
            <p className="text-xs text-slate-600 mt-2">
              Dica: priorize os serviços que você mais quer vender / que têm maior margem.
            </p>
          </div>
        )}

        {/* ── Step 4: Budget ── */}
        {step === 4 && (
          <div className="animate-fade-up">
            <p className="text-xs text-[#F0B429] font-semibold uppercase tracking-widest mb-3">
              Passo 5 de {TOTAL_STEPS}
            </p>
            <h2 className="font-display text-3xl font-bold text-white mb-2">
              Budget mensal de mídia?
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              Quanto planeja investir por mês em anúncios (Meta Ads, Google Ads, etc).
              {bench ? ` Para ${bench.name}: mínimo R$${bench.budget_floor.toLocaleString('pt-BR')} · ideal R$${bench.budget_ideal.toLocaleString('pt-BR')}/mês.` : ''}
            </p>
            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">R$</span>
              <input
                type="number"
                className={inputClass()}
                style={{ paddingLeft: '2.5rem', fontSize: '1.125rem' }}
                placeholder="5000"
                value={form.budget}
                onChange={(e) => update('budget', e.target.value)}
              />
            </div>
            <div className="flex gap-2 mb-6">
              {(() => {
                const floor   = bench?.budget_floor  || 1500
                const ideal   = bench?.budget_ideal  || 5000
                const presets = [floor, Math.round((floor + ideal) / 2 / 500) * 500, ideal, ideal * 2]
                  .filter((v, i, arr) => arr.indexOf(v) === i)
                return presets.map((v) => (
                  <button key={v} onClick={() => update('budget', String(v))}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: form.budget === String(v) ? 'rgba(240,180,41,0.15)' : '#111114',
                      border: form.budget === String(v) ? '1px solid rgba(240,180,41,0.4)' : '1px solid #2A2A30',
                      color: form.budget === String(v) ? '#F0B429' : '#64748B',
                    }}>
                    R${v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : v}
                  </button>
                ))
              })()}
            </div>

            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">
                Faturamento atual (opcional — melhora a análise)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">R$</span>
                <input
                  type="number"
                  className={inputClass()}
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="50000"
                  value={form.monthlyRevenue}
                  onChange={(e) => update('monthlyRevenue', e.target.value)}
                />
              </div>
            </div>

            {/* Situação atual — enriquece o diagnóstico de crescimento */}
            <div className="pt-2 border-t border-[#1E1E24]">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-3">
                Situação atual (opcional · diagnóstico mais preciso)
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">
                    CPL atual (custo por lead que está pagando)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">R$</span>
                    <input
                      type="number"
                      className={inputClass()}
                      style={{ paddingLeft: '2.5rem' }}
                      placeholder="Ex: 45"
                      value={form.currentCPL}
                      onChange={(e) => update('currentCPL', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">
                    Principal origem de leads hoje
                  </label>
                  <input
                    type="text"
                    className={inputClass()}
                    placeholder="Ex: indicação, Meta Ads, Google, orgânico..."
                    value={form.currentLeadSource}
                    onChange={(e) => update('currentLeadSource', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">
                    Maior desafio de crescimento hoje
                  </label>
                  <input
                    type="text"
                    className={inputClass()}
                    placeholder="Ex: gerar leads, converter, escalar sem perder qualidade..."
                    value={form.mainChallenge}
                    onChange={(e) => update('mainChallenge', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 5: Objetivo + Gerar ── */}
        {step === 5 && (
          <div className="animate-fade-up">
            <p className="text-xs text-[#F0B429] font-semibold uppercase tracking-widest mb-3">
              Passo 6 de {TOTAL_STEPS} · Último passo
            </p>
            <h2 className="font-display text-3xl font-bold text-white mb-2">
              Objetivo principal?
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              Isso define o foco da estratégia gerada pelo ELYON.
            </p>
            <div className="space-y-2 mb-6">
              {OBJECTIVES.map((obj) => (
                <button
                  key={obj.value}
                  onClick={() => update('objective', obj.value)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all"
                  style={{
                    background: form.objective === obj.value ? 'rgba(240,180,41,0.08)' : '#111114',
                    border: form.objective === obj.value ? '1px solid rgba(240,180,41,0.4)' : '1px solid #2A2A30',
                    color: form.objective === obj.value ? '#F0B429' : '#94A3B8',
                  }}
                >
                  <span className="text-xl">{obj.icon}</span>
                  <span className="font-medium text-sm">{objectiveLabel(obj.value)}</span>
                </button>
              ))}
            </div>

            {/* Preview do que será gerado */}
            <div className="p-4 rounded-xl mb-5" style={{ background: 'rgba(240,180,41,0.05)', border: '1px solid rgba(240,180,41,0.15)' }}>
              <div className="text-xs text-[#F0B429] font-semibold mb-2">📋 O ELYON vai gerar para você:</div>
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center gap-2"><span className="text-[#22C55E]">✓</span> Estratégia completa de canais com budget recomendado</div>
                <div className="flex items-center gap-2"><span className="text-[#22C55E]">✓</span> CPL e ROAS esperados com benchmarks reais do nicho</div>
                <div className="flex items-center gap-2"><span className="text-[#22C55E]">✓</span> Plano de ação de 90 dias pronto para executar</div>
                <div className="flex items-center gap-2"><span className="text-[#22C55E]">✓</span> Perfil de audiência, dores, hooks e objeções</div>
                <div className="flex items-center gap-2"><span className="text-[#22C55E]">✓</span> Calendário de marketing com sazonalidade do nicho</div>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 mb-4">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-4 rounded-xl font-bold text-black text-lg transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)' }}
            >
              {generating ? '⚡ Gerando análise...' : '⚡ Gerar Análise Estratégica'}
            </button>
          </div>
        )}

        {/* Botões de navegação */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setWizardStep(Math.max(0, step - 1))}
            className="px-6 py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-300 transition-colors"
            style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
          >
            ← Voltar
          </button>
          {step < 5 && (
            <button
              onClick={() => setWizardStep(step + 1)}
              disabled={!canNext()}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
              style={{
                background: canNext() ? 'rgba(240,180,41,0.12)' : 'transparent',
                border: '1px solid rgba(240,180,41,0.3)',
                color: '#F0B429',
              }}
            >
              Próximo →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
