// components/dashboard/SetupWizard.tsx — Onboarding inteligente por nicho (ELYON AGENT)
'use client'

import { useState, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { getBenchmark } from '@/lib/niche_benchmarks'
import { getNicheConfig } from '@/lib/niche_prompts'
import { parseImportFile, type ImportSummary } from '@/lib/csv-import'

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

const TOTAL_STEPS = 9

export interface WizardImportData {
  platform: 'meta' | 'google' | 'unknown'
  filename: string
  campaigns: any[]
  totalSpend: number
  totalLeads: number
  avgCPL: number
}

interface Props {
  onComplete: (importData?: WizardImportData[]) => void
}

function inputClass(focused = false) {
  return `w-full bg-[#111114] border rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none transition-colors ${
    focused ? 'border-[#F0B429]' : 'border-[#2A2A30] focus:border-[#F0B429]'
  }`
}

function Tip({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-block align-middle ml-1">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="w-4 h-4 rounded-full text-[9px] font-bold inline-flex items-center justify-center cursor-help"
        style={{ background: 'rgba(255,255,255,0.06)', color: '#64748B', border: '1px solid #2A2A30' }}
      >?</button>
      {show && (
        <div className="absolute bottom-6 left-0 z-50 w-52 text-[11px] leading-relaxed pointer-events-none"
          style={{ background: '#1E1E24', border: '1px solid #3A3A42', borderRadius: '8px', padding: '8px 10px', color: '#CBD5E1', whiteSpace: 'normal' }}>
          {text}
        </div>
      )}
    </span>
  )
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
    // Unit economics
    ticketPrice:        '',
    grossMargin:        '',
    isRecurring:        false,
    conversionRate:     '',
    // Persona do cliente ideal
    targetAge:          '',
    targetGender:       '',
    mainPains:          '',
    mainObjection:      '',
    onlineChannels:     [] as string[],
    targetIncome:       '',
    awarenessStage:     '',
  })
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [importedFiles, setImportedFiles] = useState<ImportSummary[]>([])
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState('')
  const [importDragOver, setImportDragOver] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

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
    if (step === 2) return true
    if (step === 3) return form.products.trim().length > 3
    if (step === 4) return Number(form.budget) >= 500
    if (step === 5) return true // unit economics opcional
    if (step === 6) return true // import é opcional
    if (step === 7) return true // persona é opcional
    return true
  }

  const handleImportFile = async (file: File) => {
    const name = file.name.toLowerCase()
    if (!name.endsWith('.csv') && !name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      setImportError('Formato inválido. Use .csv ou .xlsx')
      return
    }
    setImportLoading(true)
    setImportError('')
    try {
      const summary = await parseImportFile(file)
      if (summary.campaigns.length === 0) {
        setImportError('Nenhuma campanha encontrada no arquivo. Verifique o formato.')
        return
      }
      setImportedFiles(prev => [...prev, summary])
      // Auto-preenche CPL se não estiver definido
      if (!form.currentCPL && summary.avgCPL > 0) {
        setForm(f => ({ ...f, currentCPL: String(summary.avgCPL) }))
      }
    } catch {
      setImportError('Erro ao ler o arquivo. Verifique se é um CSV ou XLSX válido do Meta Ads / Google Ads.')
    } finally {
      setImportLoading(false)
    }
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
        ticketPrice:       form.ticketPrice ? Number(form.ticketPrice) : undefined,
        grossMargin:       form.grossMargin ? Number(form.grossMargin) : undefined,
        isRecurring:       form.isRecurring || undefined,
        conversionRate:    form.conversionRate ? Number(form.conversionRate) : undefined,
        targetAge:         form.targetAge || undefined,
        targetGender:      form.targetGender || undefined,
        mainPains:         form.mainPains || undefined,
        mainObjection:     form.mainObjection || undefined,
        onlineChannels:    form.onlineChannels.length > 0 ? form.onlineChannels : undefined,
        targetIncome:      form.targetIncome || undefined,
        awarenessStage:    form.awarenessStage || undefined,
      }
      setClientData(clientData)
      onComplete(importedFiles.length > 0 ? importedFiles : undefined)
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
              Investimento mensal de mídia?
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
              <div className="relative mb-2">
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
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '10k',  value: '10000' },
                  { label: '30k',  value: '30000' },
                  { label: '50k',  value: '50000' },
                  { label: '100k', value: '100000' },
                  { label: '250k', value: '250000' },
                  { label: '500k', value: '500000' },
                  { label: '1M',   value: '1000000' },
                  { label: '3M',   value: '3000000' },
                  { label: '5M+',  value: '5000000' },
                ].map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => update('monthlyRevenue', p.value)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                    style={{
                      background: form.monthlyRevenue === p.value ? 'rgba(240,180,41,0.15)' : '#111114',
                      border: form.monthlyRevenue === p.value ? '1px solid rgba(240,180,41,0.4)' : '1px solid #2A2A30',
                      color: form.monthlyRevenue === p.value ? '#F0B429' : '#64748B',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
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
                    CPL atual (custo por lead)
                    <Tip text="CPL = Custo Por Lead. Quanto você paga para conseguir cada contato interessado no seu produto/serviço." />
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

        {/* ── Step 5: Unit Economics / Financeiro ── */}
        {step === 5 && (
          <div className="animate-fade-up">
            <p className="text-xs text-[#F0B429] font-semibold uppercase tracking-widest mb-3">
              Passo 6 de {TOTAL_STEPS}
            </p>
            <h2 className="font-display text-3xl font-bold text-white mb-2">
              Financeiro do negócio
            </h2>
            <p className="text-slate-500 text-sm mb-2">
              Com esses dados calculamos seu <strong className="text-white">ROAS break-even real</strong>, CPL máximo lucrativo e retorno sobre investimento.
            </p>
            {bench && (
              <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-xl text-xs"
                style={{ background: 'rgba(240,180,41,0.06)', border: '1px solid rgba(240,180,41,0.2)' }}>
                <span className="text-[#F0B429]">💡</span>
                <span className="text-slate-400">Benchmark {bench.name}: ticket típico ~R${bench.avg_ticket.toLocaleString('pt-BR')} · CVR ~{(bench.cvr_lead_to_sale * 100).toFixed(0)}%</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-semibold uppercase tracking-wider mb-2 block">
                  Ticket médio por venda / cliente
                  <Tip text="Valor que o cliente paga. Se tiver múltiplos serviços, use o valor do principal ou a média ponderada." />
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">R$</span>
                  <input type="number" className={inputClass()} style={{ paddingLeft: '2.5rem', fontSize: '1.125rem' }}
                    placeholder={bench ? String(bench.avg_ticket) : '2000'}
                    value={form.ticketPrice}
                    onChange={(e) => update('ticketPrice', e.target.value)} />
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[500, 1000, 2000, 5000, 10000, 20000].map((v) => (
                    <button key={v} type="button" onClick={() => update('ticketPrice', String(v))}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                      style={{
                        background: form.ticketPrice === String(v) ? 'rgba(240,180,41,0.15)' : '#111114',
                        border: form.ticketPrice === String(v) ? '1px solid rgba(240,180,41,0.4)' : '1px solid #2A2A30',
                        color: form.ticketPrice === String(v) ? '#F0B429' : '#64748B',
                      }}>
                      R${v >= 1000 ? `${v / 1000}k` : v}
                    </button>
                  ))}
                </div>
                {nicheConf && nicheConf.fields.length > 1 && (
                  <p className="text-[10px] text-slate-600 mt-1.5">
                    Multi-serviços? Use o ticket do serviço principal ou a média ponderada dos que mais anuncia.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-300 font-semibold uppercase tracking-wider mb-2 block">
                    Margem bruta
                    <Tip text="Do que entra de receita, quanto fica após pagar custo direto (material, mão de obra). Ex: 40% → para cada R$100 vendido, R$40 é seu lucro bruto." />
                  </label>
                  <div className="relative">
                    <input type="number" className={inputClass()} style={{ paddingRight: '2rem', fontSize: '1.125rem' }}
                      placeholder="40" min="1" max="100"
                      value={form.grossMargin}
                      onChange={(e) => update('grossMargin', e.target.value)} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">%</span>
                  </div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {[20, 30, 40, 50, 60, 70].map((v) => (
                      <button key={v} type="button" onClick={() => update('grossMargin', String(v))}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold transition-all"
                        style={{
                          background: form.grossMargin === String(v) ? 'rgba(240,180,41,0.15)' : '#111114',
                          border: form.grossMargin === String(v) ? '1px solid rgba(240,180,41,0.4)' : '1px solid #2A2A30',
                          color: form.grossMargin === String(v) ? '#F0B429' : '#64748B',
                        }}>{v}%</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold uppercase tracking-wider mb-2 block">
                    Taxa de fechamento
                    <Tip text="CVR: de cada 100 leads gerados, quantos viram clientes pagantes. Ex: 10% = 10 de 100 leads fecham negócio." />
                  </label>
                  <div className="relative">
                    <input type="number" className={inputClass()} style={{ paddingRight: '2rem', fontSize: '1.125rem' }}
                      placeholder={bench ? String(Math.round((bench.cvr_lead_to_sale || 0.1) * 100)) : '10'} min="1" max="100"
                      value={form.conversionRate}
                      onChange={(e) => update('conversionRate', e.target.value)} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">%</span>
                  </div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {[5, 10, 15, 20, 30, 50].map((v) => (
                      <button key={v} type="button" onClick={() => update('conversionRate', String(v))}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold transition-all"
                        style={{
                          background: form.conversionRate === String(v) ? 'rgba(240,180,41,0.15)' : '#111114',
                          border: form.conversionRate === String(v) ? '1px solid rgba(240,180,41,0.4)' : '1px solid #2A2A30',
                          color: form.conversionRate === String(v) ? '#F0B429' : '#64748B',
                        }}>{v}%</button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold uppercase tracking-wider mb-2 block">
                  Modelo de receita
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: false, label: 'Venda única', sub: 'Cada cliente compra uma vez', icon: '🛒' },
                    { val: true,  label: 'Recorrente / Assinatura', sub: 'Cliente paga mensalmente', icon: '🔄' },
                  ].map((opt) => (
                    <button key={String(opt.val)} type="button"
                      onClick={() => setForm(f => ({ ...f, isRecurring: opt.val }))}
                      className="py-3 px-3 rounded-xl text-left transition-all"
                      style={form.isRecurring === opt.val
                        ? { background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.45)', color: '#F0B429' }
                        : { background: '#111114', border: '1px solid #2A2A30', color: '#64748B' }
                      }>
                      <div className="text-lg mb-1">{opt.icon}</div>
                      <div className="text-xs font-semibold">{opt.label}</div>
                      <div className="text-[10px] opacity-70 mt-0.5">{opt.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Break-even calculator em tempo real */}
            {form.ticketPrice && form.grossMargin && form.conversionRate && (() => {
              const ticket = Number(form.ticketPrice)
              const margin = Number(form.grossMargin) / 100
              const cvr    = Number(form.conversionRate) / 100
              const breakEvenROAS = margin > 0 ? (1 / margin).toFixed(2) : '—'
              const maxCPL = cvr > 0 ? (ticket * margin * cvr).toFixed(0) : '—'
              const ltv = form.isRecurring ? (ticket / 0.05).toFixed(0) : ticket.toFixed(0)
              return (
                <div className="mt-5 p-4 rounded-2xl" style={{ background: 'rgba(240,180,41,0.05)', border: '1px solid rgba(240,180,41,0.2)' }}>
                  <p className="text-xs text-[#F0B429] font-bold mb-3">📊 Seus números calculados em tempo real</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-lg font-bold text-[#F0B429]">{breakEvenROAS}×</div>
                      <div className="text-[10px] text-slate-500">ROAS break-even</div>
                      <div className="text-[9px] text-slate-700">retorno mínimo s/ prejuízo</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-[#22C55E]">R${maxCPL}</div>
                      <div className="text-[10px] text-slate-500">CPL máximo</div>
                      <div className="text-[9px] text-slate-700">acima disso = prejuízo</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-[#A78BFA]">R${Number(ltv).toLocaleString('pt-BR')}</div>
                      <div className="text-[10px] text-slate-500">LTV estimado</div>
                      <div className="text-[9px] text-slate-700">{form.isRecurring ? 'valor vitalício (churn 5%)' : 'venda única'}</div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-3 text-center">
                    ROAS = retorno sobre investimento em anúncios · CPL = custo por lead · LTV = valor total do cliente
                  </p>
                </div>
              )
            })()}

            <p className="text-[10px] text-slate-600 mt-4 text-center">
              Pode pular — mas com esses dados a estratégia fica muito mais precisa.
            </p>
          </div>
        )}

        {/* ── Step 6: Import de CSV (opcional) ── */}
        {step === 6 && (
          <div className="animate-fade-up">
            <p className="text-xs text-[#F0B429] font-semibold uppercase tracking-widest mb-3">
              Passo 7 de {TOTAL_STEPS} · Opcional
            </p>
            <h2 className="font-display text-3xl font-bold text-white mb-2">
              Importar dados de campanhas
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              Faça upload do export do <strong className="text-slate-300">Meta Ads</strong> ou <strong className="text-slate-300">Google Ads</strong> para receber uma análise completa imediata. Ou pule e faça depois na aba Auditoria.
            </p>

            {/* Zona de drop */}
            <div
              onDragOver={e => { e.preventDefault(); setImportDragOver(true) }}
              onDragLeave={() => setImportDragOver(false)}
              onDrop={e => {
                e.preventDefault(); setImportDragOver(false)
                Array.from(e.dataTransfer.files).forEach(handleImportFile)
              }}
              onClick={() => importRef.current?.click()}
              className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors mb-4"
              style={{
                borderColor: importDragOver ? '#F0B429' : '#2A2A30',
                background: importDragOver ? 'rgba(240,180,41,0.05)' : '#111114',
              }}
            >
              <input
                ref={importRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                multiple
                className="hidden"
                onChange={e => { Array.from(e.target.files || []).forEach(handleImportFile); e.target.value = '' }}
              />
              {importLoading ? (
                <div className="text-[#F0B429] text-sm font-semibold animate-pulse">⚡ Analisando arquivo...</div>
              ) : (
                <>
                  <div className="text-3xl mb-3 opacity-40">📊</div>
                  <div className="text-sm font-semibold text-white mb-1">Arraste o CSV/XLSX aqui ou clique para selecionar</div>
                  <div className="text-xs text-slate-600">Meta Ads ou Google Ads · .csv, .xlsx</div>
                </>
              )}
            </div>

            {/* Como exportar */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { platform: 'Meta Ads', steps: 'Gerenciador de Anúncios → Relatórios → Exportar CSV', icon: '📘' },
                { platform: 'Google Ads', steps: 'Campanhas → Download → Formato CSV', icon: '🔵' },
              ].map(p => (
                <div key={p.platform} className="bg-[#111114] border border-[#2A2A30] rounded-xl p-3">
                  <div className="text-xs font-semibold text-white mb-1">{p.icon} {p.platform}</div>
                  <div className="text-[10px] text-slate-600">{p.steps}</div>
                </div>
              ))}
            </div>

            {importError && (
              <div className="text-xs text-red-400 bg-red-900/20 border border-red-500/30 rounded-xl px-3 py-2 mb-3">{importError}</div>
            )}

            {/* Arquivos importados */}
            {importedFiles.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs text-[#22C55E] font-semibold mb-1">✓ {importedFiles.length} arquivo{importedFiles.length > 1 ? 's' : ''} importado{importedFiles.length > 1 ? 's' : ''}:</div>
                {importedFiles.map((f, i) => (
                  <div key={i} className="bg-[#111114] border border-[#22C55E30] rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-white">{f.filename}</span>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                          style={{ color: f.platform === 'meta' ? '#38BDF8' : f.platform === 'google' ? '#F0B429' : '#64748B',
                            background: f.platform === 'meta' ? 'rgba(56,189,248,0.1)' : f.platform === 'google' ? 'rgba(240,180,41,0.1)' : 'rgba(100,116,139,0.1)' }}>
                          {f.platform === 'unknown' ? 'desconhecido' : f.platform}
                        </span>
                        <button onClick={() => setImportedFiles(prev => prev.filter((_, j) => j !== i))}
                          className="text-slate-700 hover:text-slate-500 text-sm">×</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-xs font-bold text-white">{f.campaigns.length}</div>
                        <div className="text-[10px] text-slate-600">campanhas</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#F0B429]">R${Math.round(f.totalSpend).toLocaleString('pt-BR')}</div>
                        <div className="text-[10px] text-slate-600">investimento</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#22C55E]">{f.totalLeads}</div>
                        <div className="text-[10px] text-slate-600">leads/conv.</div>
                      </div>
                    </div>
                    {f.avgCPL > 0 && (
                      <div className="mt-2 text-center text-[10px] text-slate-500">
                        CPL médio: <span className="text-[#F0B429] font-bold">R${f.avgCPL}</span>
                      </div>
                    )}
                  </div>
                ))}
                <div className="text-[10px] text-slate-600 text-center">
                  ✓ CPL preenchido automaticamente · a IA vai analisar esses dados ao gerar a estratégia
                </div>
              </div>
            )}

            {importedFiles.length === 0 && !importLoading && (
              <div className="text-center text-xs text-slate-600 py-2">
                Passo opcional — você pode pular e importar depois na aba Auditoria.
              </div>
            )}
          </div>
        )}

        {/* ── Step 7: Cliente Ideal / Persona ── */}
        {step === 7 && (
          <div className="animate-fade-up">
            <p className="text-xs text-[#F0B429] font-semibold uppercase tracking-widest mb-3">
              Passo 8 de {TOTAL_STEPS} · Opcional
            </p>
            <h2 className="font-display text-3xl font-bold text-white mb-2">
              Quem é o cliente ideal?
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              Essas informações vão gerar a persona do seu cliente e personalizar toda a estratégia de comunicação.
            </p>

            {/* Faixa etária */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-400 mb-2">Faixa etária predominante</label>
              <div className="flex flex-wrap gap-2">
                {['18–24', '25–34', '35–44', '45–54', '55+', 'Variado'].map((age) => (
                  <button key={age} type="button"
                    onClick={() => setForm((f) => ({ ...f, targetAge: f.targetAge === age ? '' : age }))}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: form.targetAge === age ? 'rgba(240,180,41,0.12)' : '#111114',
                      border: form.targetAge === age ? '1px solid rgba(240,180,41,0.45)' : '1px solid #2A2A30',
                      color: form.targetAge === age ? '#F0B429' : '#94A3B8',
                    }}>
                    {age}
                  </button>
                ))}
              </div>
            </div>

            {/* Gênero */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-400 mb-2">Gênero predominante</label>
              <div className="flex gap-2">
                {['Majoritariamente feminino', 'Majoritariamente masculino', 'Equilibrado'].map((g) => (
                  <button key={g} type="button"
                    onClick={() => setForm((f) => ({ ...f, targetGender: f.targetGender === g ? '' : g }))}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: form.targetGender === g ? 'rgba(240,180,41,0.12)' : '#111114',
                      border: form.targetGender === g ? '1px solid rgba(240,180,41,0.45)' : '1px solid #2A2A30',
                      color: form.targetGender === g ? '#F0B429' : '#94A3B8',
                    }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Renda */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-400 mb-2">Renda mensal aproximada</label>
              <div className="flex flex-wrap gap-2">
                {['Até R$2k', 'R$2k–5k', 'R$5k–10k', 'R$10k–20k', 'Acima de R$20k', 'Variada'].map((inc) => (
                  <button key={inc} type="button"
                    onClick={() => setForm((f) => ({ ...f, targetIncome: f.targetIncome === inc ? '' : inc }))}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: form.targetIncome === inc ? 'rgba(240,180,41,0.12)' : '#111114',
                      border: form.targetIncome === inc ? '1px solid rgba(240,180,41,0.45)' : '1px solid #2A2A30',
                      color: form.targetIncome === inc ? '#F0B429' : '#94A3B8',
                    }}>
                    {inc}
                  </button>
                ))}
              </div>
            </div>

            {/* Canais online */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-400 mb-2">Onde passa o tempo online? <span className="text-slate-600">(múltiplos)</span></label>
              <div className="flex flex-wrap gap-2">
                {['Instagram', 'Facebook', 'TikTok', 'YouTube', 'Google', 'LinkedIn', 'WhatsApp', 'Twitter/X', 'Pinterest'].map((ch) => {
                  const active = form.onlineChannels.includes(ch)
                  return (
                    <button key={ch} type="button"
                      onClick={() => setForm((f) => ({
                        ...f,
                        onlineChannels: active ? f.onlineChannels.filter((c) => c !== ch) : [...f.onlineChannels, ch],
                      }))}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: active ? 'rgba(240,180,41,0.12)' : '#111114',
                        border: active ? '1px solid rgba(240,180,41,0.45)' : '1px solid #2A2A30',
                        color: active ? '#F0B429' : '#94A3B8',
                      }}>
                      {ch}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Dores */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Qual a maior dor ou problema que você resolve?
              </label>
              <textarea
                value={form.mainPains}
                onChange={(e) => setForm((f) => ({ ...f, mainPains: e.target.value }))}
                placeholder="Ex: Meu cliente sofre com falta de tempo para cuidar da saúde e quer resultados rápidos sem sair de casa..."
                rows={2}
                className="w-full bg-[#111114] border border-[#2A2A30] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 resize-none outline-none focus:border-[#F0B429]/40"
              />
            </div>

            {/* Objeção */}
            <div className="mb-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Qual a principal objeção de compra?
              </label>
              <input
                type="text"
                value={form.mainObjection}
                onChange={(e) => setForm((f) => ({ ...f, mainObjection: e.target.value }))}
                placeholder="Ex: 'Não tenho dinheiro agora' / 'Vou pensar' / 'Já tentei outras coisas'"
                className="w-full bg-[#111114] border border-[#2A2A30] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-[#F0B429]/40"
              />
            </div>

            <div className="text-center text-xs text-slate-600 pt-3">
              Todos os campos são opcionais — quanto mais você preencher, mais precisa será a persona gerada.
            </div>
          </div>
        )}

        {/* ── Step 8: Objetivo + Gerar ── */}
        {step === 8 && (
          <div className="animate-fade-up">
            <p className="text-xs text-[#F0B429] font-semibold uppercase tracking-widest mb-3">
              Passo 9 de {TOTAL_STEPS} · Último passo
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
                <div className="flex items-center gap-2"><span className="text-[#22C55E]">✓</span> Estratégia completa de canais com investimento recomendado</div>
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
          {step < 8 && (
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
              {(step === 6 && importedFiles.length === 0) || step === 7 ? 'Pular →' : 'Próximo →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
