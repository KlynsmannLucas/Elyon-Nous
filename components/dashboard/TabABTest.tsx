// components/dashboard/TabABTest.tsx — Testes A/B de Criativos
'use client'

import { useState } from 'react'
import { useAppStore, type CreativeTest, type CreativeVariant } from '@/lib/store'
import type { ClientData } from '@/lib/store'

interface Props {
  clientData: ClientData | null
}

function emptyVariant(): CreativeVariant {
  return { headline: '', primaryText: '', hook: '', cta: '', creativeType: 'image', impressions: 0, clicks: 0, conversions: 0, spend: 0 }
}

function calcCTR(v: CreativeVariant) {
  return v.impressions > 0 ? (v.clicks / v.impressions) * 100 : 0
}
function calcCPL(v: CreativeVariant) {
  return v.clicks > 0 ? Math.round(v.spend / v.clicks) : 0
}
function calcConvRate(v: CreativeVariant) {
  return v.clicks > 0 ? (v.conversions / v.clicks) * 100 : 0
}

function detectWinner(test: CreativeTest): 'a' | 'b' | null {
  const minImp = 300
  if (test.variantA.impressions < minImp || test.variantB.impressions < minImp) return null
  const ctrA = calcCTR(test.variantA), ctrB = calcCTR(test.variantB)
  const cplA = calcCPL(test.variantA), cplB = calcCPL(test.variantB)
  const convA = test.variantA.conversions, convB = test.variantB.conversions

  let scoreA = 0, scoreB = 0
  if (ctrA > ctrB * 1.15) scoreA++
  else if (ctrB > ctrA * 1.15) scoreB++
  if (cplA > 0 && cplB > 0) {
    if (cplA < cplB * 0.85) scoreA++
    else if (cplB < cplA * 0.85) scoreB++
  }
  if (convA > convB * 1.15) scoreA++
  else if (convB > convA * 1.15) scoreB++

  if (scoreA >= 2) return 'a'
  if (scoreB >= 2) return 'b'
  return null
}

const CREATIVE_TYPES = ['image', 'video', 'carousel', 'outro'] as const
const CHANNELS = ['Meta Ads', 'Google Ads'] as const

const inputCls = 'w-full bg-[#0D0D10] border border-[#2A2A30] rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-slate-700 focus:outline-none focus:border-[#F0B429] transition-colors'
const inputSmCls = 'w-full bg-[#0D0D10] border border-[#2A2A30] rounded-lg px-2.5 py-2 text-white text-xs placeholder:text-slate-700 focus:outline-none focus:border-[#F0B429] transition-colors'

// ── Formulário de variante ───────────────────────────────────────────────────
function VariantForm({ label, variant, onChange }: {
  label: 'A' | 'B'
  variant: CreativeVariant
  onChange: (v: CreativeVariant) => void
}) {
  const color = label === 'A' ? '#38BDF8' : '#A78BFA'
  const u = (k: keyof CreativeVariant, v: any) => onChange({ ...variant, [k]: v })

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center"
          style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
          {label}
        </span>
        <span className="text-xs font-semibold text-slate-400">Variante {label}</span>
      </div>

      <div>
        <label className="text-[10px] text-slate-600 uppercase tracking-wider block mb-1">Headline / Título</label>
        <input className={inputSmCls} placeholder="Ex: Transforme seu sorriso em 1 visita"
          value={variant.headline} onChange={e => u('headline', e.target.value)} />
      </div>
      <div>
        <label className="text-[10px] text-slate-600 uppercase tracking-wider block mb-1">Hook de abertura</label>
        <input className={inputSmCls} placeholder="Ex: Você sabia que 87% das pessoas..."
          value={variant.hook} onChange={e => u('hook', e.target.value)} />
      </div>
      <div>
        <label className="text-[10px] text-slate-600 uppercase tracking-wider block mb-1">Texto principal</label>
        <textarea className={inputSmCls} rows={3} style={{ resize: 'none' }}
          placeholder="Corpo do anúncio..."
          value={variant.primaryText} onChange={e => u('primaryText', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-slate-600 uppercase tracking-wider block mb-1">CTA</label>
          <input className={inputSmCls} placeholder="Ex: Agende agora"
            value={variant.cta} onChange={e => u('cta', e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] text-slate-600 uppercase tracking-wider block mb-1">Formato</label>
          <select className={inputSmCls} value={variant.creativeType} onChange={e => u('creativeType', e.target.value)}>
            {CREATIVE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}

// ── Card de métricas de uma variante ────────────────────────────────────────
function VariantMetrics({ label, variant, isWinner, isLoser }: {
  label: 'A' | 'B'
  variant: CreativeVariant
  isWinner: boolean
  isLoser: boolean
}) {
  const color = label === 'A' ? '#38BDF8' : '#A78BFA'
  const ctr = calcCTR(variant)
  const cpl = calcCPL(variant)
  const cvr = calcConvRate(variant)

  return (
    <div className="rounded-xl p-4 relative"
      style={{
        background: isWinner ? 'rgba(34,197,94,0.04)' : isLoser ? 'rgba(255,77,77,0.03)' : '#111114',
        border: isWinner ? '1px solid rgba(34,197,94,0.25)' : isLoser ? '1px solid rgba(255,77,77,0.15)' : '1px solid #2A2A30',
      }}>
      {isWinner && (
        <div className="absolute -top-2 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', color: '#22C55E' }}>
          🏆 Vencedora
        </div>
      )}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-5 h-5 rounded text-[10px] font-black flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
          {label}
        </span>
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Variante {label}</span>
      </div>
      {variant.headline && (
        <p className="text-xs font-semibold text-white mb-3 leading-relaxed line-clamp-2">{variant.headline}</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Impressões', value: variant.impressions > 0 ? variant.impressions.toLocaleString('pt-BR') : '—', color: '#64748B' },
          { label: 'Cliques', value: variant.clicks > 0 ? variant.clicks.toLocaleString('pt-BR') : '—', color: '#64748B' },
          { label: 'CTR', value: variant.impressions > 0 ? `${ctr.toFixed(2)}%` : '—', color: ctr > 3 ? '#22C55E' : ctr > 1 ? '#F0B429' : '#FF4D4D' },
          { label: 'CPL', value: cpl > 0 ? `R$${cpl}` : '—', color: '#F0B429' },
          { label: 'Conversões', value: variant.conversions > 0 ? String(variant.conversions) : '—', color: '#22C55E' },
          { label: 'Conv. Rate', value: variant.clicks > 0 ? `${cvr.toFixed(1)}%` : '—', color: '#A78BFA' },
        ].map(m => (
          <div key={m.label} className="bg-[#0A0A0B] rounded-lg p-2 text-center">
            <div className="text-xs font-bold" style={{ color: m.color }}>{m.value}</div>
            <div className="text-[9px] text-slate-600 mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>
      {variant.spend > 0 && (
        <div className="mt-2 text-center text-[10px] text-slate-600">
          Gasto: <span className="text-slate-400 font-semibold">R${variant.spend.toLocaleString('pt-BR')}</span>
        </div>
      )}
    </div>
  )
}

// ── Form de métricas inline ──────────────────────────────────────────────────
function MetricsForm({ test, onSave, onClose }: {
  test: CreativeTest
  onSave: (a: Partial<CreativeVariant>, b: Partial<CreativeVariant>) => void
  onClose: () => void
}) {
  const [a, setA] = useState({ ...test.variantA })
  const [b, setB] = useState({ ...test.variantB })
  const ua = (k: keyof CreativeVariant, v: any) => setA(x => ({ ...x, [k]: Number(v) || 0 }))
  const ub = (k: keyof CreativeVariant, v: any) => setB(x => ({ ...x, [k]: Number(v) || 0 }))

  return (
    <div className="mt-4 p-4 rounded-xl animate-fade-up" style={{ background: '#0D0D10', border: '1px solid #2A2A30' }}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-white">Atualizar Métricas</span>
        <button onClick={onClose} className="text-slate-600 hover:text-slate-400 text-base">×</button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {(['A', 'B'] as const).map((lbl) => {
          const vals = lbl === 'A' ? a : b
          const upd = lbl === 'A' ? ua : ub
          const color = lbl === 'A' ? '#38BDF8' : '#A78BFA'
          return (
            <div key={lbl}>
              <div className="text-[10px] font-bold mb-2" style={{ color }}>Variante {lbl}</div>
              <div className="space-y-2">
                {[
                  { k: 'impressions', label: 'Impressões' },
                  { k: 'clicks', label: 'Cliques' },
                  { k: 'conversions', label: 'Conversões' },
                  { k: 'spend', label: 'Gasto (R$)' },
                ].map(f => (
                  <div key={f.k}>
                    <label className="text-[9px] text-slate-600 block mb-0.5">{f.label}</label>
                    <input type="number" className={inputSmCls}
                      value={(vals as any)[f.k] || ''}
                      onChange={e => upd(f.k as keyof CreativeVariant, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <button onClick={() => { onSave(a, b); onClose() }}
        className="mt-4 w-full py-2 rounded-xl text-xs font-bold text-black"
        style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)' }}>
        Salvar métricas
      </button>
    </div>
  )
}

// ── Card de um teste ─────────────────────────────────────────────────────────
function TestCard({ test, clientData }: { test: CreativeTest; clientData: ClientData | null }) {
  const { updateCreativeTest, deleteCreativeTest } = useAppStore()
  const [showMetrics, setShowMetrics] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  const suggested = detectWinner(test)
  const winner = test.status === 'winner_a' ? 'a' : test.status === 'winner_b' ? 'b' : null
  const displayWinner = winner ?? suggested

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    running:  { label: '🟢 Rodando',    color: '#22C55E' },
    winner_a: { label: '🏆 A venceu',   color: '#38BDF8' },
    winner_b: { label: '🏆 B venceu',   color: '#A78BFA' },
    paused:   { label: '⏸ Pausado',     color: '#64748B' },
  }
  const st = STATUS_LABELS[test.status]

  const generateVariantB = async () => {
    if (!clientData) return
    setGenerating(true)
    try {
      const prompt = `Sou gestor de tráfego para ${clientData.niche} (${clientData.city || 'Brasil'}). Estou testando anúncios no ${test.channel}.

Variante A atual:
- Headline: ${test.variantA.headline || '(sem headline)'}
- Hook: ${test.variantA.hook || '(sem hook)'}
- Texto: ${test.variantA.primaryText || '(sem texto)'}
- CTA: ${test.variantA.cta || '(sem CTA)'}

Crie uma Variante B com abordagem completamente diferente. Mude o ângulo, o gatilho emocional ou o formato. Retorne exatamente neste formato JSON:
{"headline":"...","hook":"...","primaryText":"...","cta":"..."}`

      const res = await fetch('/api/nous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, context: `Nicho: ${clientData.niche}. Canal: ${test.channel}.`, niche: clientData.niche, history: [] }),
      })
      const json = await res.json()
      if (json.success) {
        const match = json.reply.match(/\{[\s\S]*\}/)
        if (match) {
          const parsed = JSON.parse(match[0])
          updateCreativeTest(test.id, {
            variantB: { ...test.variantB, ...parsed },
          })
        }
      }
    } catch {
      // silently fail
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="bg-[#111114] border border-[#2A2A30] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#1E1E24] flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white text-sm truncate">{test.name}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono"
              style={{ background: 'rgba(240,180,41,0.1)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.2)' }}>
              {test.channel}
            </span>
            <span className="text-[10px] font-semibold" style={{ color: st.color }}>{st.label}</span>
          </div>
          <div className="text-[10px] text-slate-600 mt-0.5">
            {new Date(test.createdAt).toLocaleDateString('pt-BR')}
          </div>
        </div>

        {/* Status change */}
        <select
          value={test.status}
          onChange={e => updateCreativeTest(test.id, { status: e.target.value as CreativeTest['status'] })}
          className="text-[10px] bg-[#0D0D10] border border-[#2A2A30] rounded-lg px-2 py-1 text-slate-400 focus:outline-none focus:border-[#F0B429]"
        >
          <option value="running">Rodando</option>
          <option value="winner_a">A Venceu</option>
          <option value="winner_b">B Venceu</option>
          <option value="paused">Pausado</option>
        </select>

        {confirmDel ? (
          <div className="flex items-center gap-1">
            <button onClick={() => deleteCreativeTest(test.id)}
              className="text-[10px] text-red-400 hover:text-red-300 px-2 py-1 rounded-lg border border-red-500/30">
              Confirmar
            </button>
            <button onClick={() => setConfirmDel(false)} className="text-[10px] text-slate-600 hover:text-slate-400 px-1">×</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDel(true)} className="text-slate-700 hover:text-slate-500 text-lg flex-shrink-0">🗑</button>
        )}
      </div>

      {/* Variantes */}
      <div className="grid grid-cols-2 gap-px bg-[#1E1E24]">
        <div className="bg-[#111114] p-4">
          <VariantMetrics label="A" variant={test.variantA}
            isWinner={displayWinner === 'a'} isLoser={displayWinner === 'b'} />
        </div>
        <div className="bg-[#111114] p-4">
          <VariantMetrics label="B" variant={test.variantB}
            isWinner={displayWinner === 'b'} isLoser={displayWinner === 'a'} />
        </div>
      </div>

      {/* Insight de vencedor sugerido */}
      {suggested && !winner && (
        <div className="px-5 py-3 border-t border-[#1E1E24] flex items-center gap-2"
          style={{ background: 'rgba(34,197,94,0.04)' }}>
          <span className="text-[#22C55E] text-sm">💡</span>
          <span className="text-xs text-[#22C55E] font-semibold">
            Variante {suggested.toUpperCase()} está performando melhor — declare vencedora acima.
          </span>
        </div>
      )}

      {/* Comparação de barras */}
      {(test.variantA.impressions > 0 || test.variantB.impressions > 0) && (
        <div className="px-5 py-3 border-t border-[#1E1E24]">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'CTR', a: calcCTR(test.variantA), b: calcCTR(test.variantB), fmt: (v: number) => `${v.toFixed(2)}%`, higherBetter: true },
              { label: 'CPL', a: calcCPL(test.variantA), b: calcCPL(test.variantB), fmt: (v: number) => v > 0 ? `R$${v}` : '—', higherBetter: false },
              { label: 'Conv.', a: test.variantA.conversions, b: test.variantB.conversions, fmt: (v: number) => String(v), higherBetter: true },
            ].map(m => {
              const total = m.a + m.b
              const pctA = total > 0 ? (m.a / total) * 100 : 50
              const aWins = m.higherBetter ? m.a > m.b : (m.b > 0 && (m.a < m.b || m.a === 0))
              const bWins = m.higherBetter ? m.b > m.a : (m.a > 0 && (m.b < m.a || m.b === 0))
              return (
                <div key={m.label}>
                  <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">{m.label}</div>
                  <div className="flex h-1.5 rounded-full overflow-hidden mb-2">
                    <div className="transition-all duration-500"
                      style={{ width: `${pctA}%`, background: aWins ? '#38BDF8' : '#2A2A30' }} />
                    <div className="transition-all duration-500"
                      style={{ width: `${100 - pctA}%`, background: bWins ? '#A78BFA' : '#2A2A30' }} />
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span style={{ color: aWins ? '#38BDF8' : '#475569' }}>{m.fmt(m.a)}</span>
                    <span style={{ color: bWins ? '#A78BFA' : '#475569' }}>{m.fmt(m.b)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-5 py-3 border-t border-[#1E1E24] flex items-center gap-2">
        <button
          onClick={() => setShowMetrics((x) => !x)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
          style={{ background: '#16161A', border: '1px solid #2A2A30', color: '#94A3B8' }}
        >
          📊 Atualizar métricas
        </button>
        <button
          onClick={generateVariantB}
          disabled={generating || !clientData}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
          style={{ background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.25)', color: '#F0B429' }}
        >
          {generating ? '⏳ Gerando...' : '🤖 Gerar B com IA'}
        </button>
      </div>

      {showMetrics && (
        <div className="px-5 pb-5">
          <MetricsForm
            test={test}
            onSave={(a, b) => updateCreativeTest(test.id, { variantA: { ...test.variantA, ...a }, variantB: { ...test.variantB, ...b } })}
            onClose={() => setShowMetrics(false)}
          />
        </div>
      )}
    </div>
  )
}

// ── Formulário de criação ────────────────────────────────────────────────────
function CreateForm({ onClose }: { onClose: () => void }) {
  const { addCreativeTest } = useAppStore()
  const [name, setName] = useState('')
  const [channel, setChannel] = useState<'Meta Ads' | 'Google Ads'>('Meta Ads')
  const [variantA, setVariantA] = useState<CreativeVariant>(emptyVariant())
  const [variantB, setVariantB] = useState<CreativeVariant>(emptyVariant())

  const canSave = name.trim().length > 2

  const handleSave = () => {
    if (!canSave) return
    addCreativeTest({ name: name.trim(), channel, status: 'running', variantA, variantB, notes: '' })
    onClose()
  }

  return (
    <div className="bg-[#111114] border border-[#F0B42930] rounded-2xl p-5 mb-6 animate-fade-up">
      <div className="flex items-center justify-between mb-5">
        <div className="font-display font-bold text-white text-sm">Novo Teste A/B</div>
        <button onClick={onClose} className="text-slate-600 hover:text-slate-400 text-lg">×</button>
      </div>

      <div className="space-y-4 mb-5">
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1.5">Nome do teste *</label>
          <input className={inputCls} placeholder="Ex: Headline emocional vs racional"
            value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1.5">Canal</label>
          <div className="flex gap-2">
            {CHANNELS.map(c => (
              <button key={c} onClick={() => setChannel(c)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: channel === c ? 'rgba(240,180,41,0.12)' : '#16161A',
                  border: channel === c ? '1px solid rgba(240,180,41,0.4)' : '1px solid #2A2A30',
                  color: channel === c ? '#F0B429' : '#64748B',
                }}>{c}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-5">
        <div className="bg-[#0D0D10] rounded-xl p-4 border border-[#38BDF820]">
          <VariantForm label="A" variant={variantA} onChange={setVariantA} />
        </div>
        <div className="bg-[#0D0D10] rounded-xl p-4 border border-[#A78BFA20]">
          <VariantForm label="B" variant={variantB} onChange={setVariantB} />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={!canSave}
        className="w-full py-3 rounded-xl text-sm font-bold text-black disabled:opacity-40 transition-opacity"
        style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)' }}
      >
        🧪 Criar teste A/B
      </button>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────
export function TabABTest({ clientData }: Props) {
  const creativeTests = useAppStore((s) => s.creativeTests)
  const [creating, setCreating] = useState(false)

  const active = creativeTests.filter(t => t.status === 'running')
  const archived = creativeTests.filter(t => t.status !== 'running')

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-lg font-bold text-white">Testes A/B de Criativos</h2>
          <p className="text-xs text-slate-500 mt-0.5">Compare copy, hooks e CTAs. Deixe os dados escolherem o vencedor.</p>
        </div>
        <button
          onClick={() => setCreating((x) => !x)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: creating ? '#111114' : 'linear-gradient(135deg, #F0B429, #FFD166)',
            color: creating ? '#F0B429' : '#000',
            border: creating ? '1px solid rgba(240,180,41,0.3)' : 'none',
          }}
        >
          {creating ? '× Cancelar' : '+ Novo Teste'}
        </button>
      </div>

      {creating && <CreateForm onClose={() => setCreating(false)} />}

      {creativeTests.length === 0 && !creating && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4 opacity-30">🧪</div>
          <h3 className="font-display text-lg font-bold text-white mb-2">Nenhum teste ativo</h3>
          <p className="text-slate-500 text-sm max-w-xs mb-6">
            Crie seu primeiro teste A/B para descobrir qual criativo performa melhor no seu nicho.
          </p>
          <button
            onClick={() => setCreating(true)}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-black"
            style={{ background: 'linear-gradient(135deg, #F0B429, #FFD166)' }}
          >
            + Criar primeiro teste
          </button>
        </div>
      )}

      {active.length > 0 && (
        <div className="space-y-4 mb-6">
          <div className="text-[10px] text-slate-600 uppercase tracking-wider">Ativos ({active.length})</div>
          {active.map(t => <TestCard key={t.id} test={t} clientData={clientData} />)}
        </div>
      )}

      {archived.length > 0 && (
        <div className="space-y-4">
          <div className="text-[10px] text-slate-600 uppercase tracking-wider">Encerrados / Pausados ({archived.length})</div>
          {archived.map(t => <TestCard key={t.id} test={t} clientData={clientData} />)}
        </div>
      )}
    </div>
  )
}
