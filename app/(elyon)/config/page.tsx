// app/(elyon)/config/page.tsx — Configurações (Workspace + Preferências NOUS + Plano + Memória viva)
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { Icon, Card, Badge, Button, SectionHead, SourceBadge } from '@/components/dashboard/v2'

const PREF_KEY = 'elyon_nous_prefs_v1'
type Prefs = { briefing: boolean; alertas: boolean; sugestoes: boolean; semanal: boolean }
const DEFAULT_PREFS: Prefs = { briefing: true, alertas: true, sugestoes: true, semanal: false }

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-10 h-[22px] rounded-full transition-colors relative shrink-0 ${on ? 'bg-blue' : 'bg-canvas-2 border border-line'}`}>
      <span className={`absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-all ${on ? 'left-[20px]' : 'left-0.5'}`} />
    </button>
  )
}

export default function ConfigPage() {
  const router = useRouter()
  const clientData = useAppStore(s => s.clientData)
  const savedClients = useAppStore(s => s.savedClients)
  const auditCache = useAppStore(s => s.auditCache)
  const dashboardMode = useAppStore(s => s.dashboardMode)
  const setDashboardMode = useAppStore(s => s.setDashboardMode)
  const clearAll = useAppStore(s => s.clearAll)
  const [mounted, setMounted] = useState(false)
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS)
  const [plan, setPlan] = useState<{ plan?: string; remaining?: number } | null>(null)

  useEffect(() => {
    setMounted(true)
    try { const raw = localStorage.getItem(PREF_KEY); if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) }) } catch {}
    fetch('/api/credits').then(r => (r.ok ? r.json() : null)).then(d => d && setPlan(d)).catch(() => {})
  }, [])

  if (!mounted) return null

  const key = clientData?.clientName || savedClients?.[0]?.clientData?.clientName || ''
  const niche = clientData?.niche || savedClients?.find(c => c.clientData.clientName === key)?.clientData.niche || '—'
  const audit: any = auditCache[key]?.[0]?.audit
  const ev = audit?._evolution

  const setPref = (k: keyof Prefs) => {
    const next = { ...prefs, [k]: !prefs[k] }
    setPrefs(next)
    try { localStorage.setItem(PREF_KEY, JSON.stringify(next)) } catch {}
    if (typeof window !== 'undefined') window.toast?.({ tone: 'good', title: 'Preferência salva' })
  }
  const setMode = (m: 'pro' | 'simple') => { setDashboardMode(m); if (typeof window !== 'undefined') window.toast?.({ tone: 'blue', title: m === 'pro' ? 'Modo Avançado' : 'Modo Simplificado' }) }

  // Memória viva (RAG) — padrões aprendidos, derivados dos sinais reais da conta.
  const planName = plan?.plan ? plan.plan.charAt(0).toUpperCase() + plan.plan.slice(1) : 'Ativo'
  const memory: { tone: 'good' | 'warn' | 'blue'; title: string; sub?: string }[] = []
  if (ev?.cplDelta != null && ev.cplDelta !== 0) memory.push({ tone: ev.cplDelta < 0 ? 'good' : 'warn', title: `CPL ${ev.cplDelta < 0 ? 'caiu' : 'subiu'} ${Math.abs(ev.cplDelta)}% vs. última auditoria`, sub: ev.sinceDate ? `Desde ${ev.sinceDate}` : 'Tendência observada' })
  if (ev?.scoreDelta != null && ev.scoreDelta !== 0) memory.push({ tone: ev.scoreDelta > 0 ? 'good' : 'warn', title: `Saúde da conta ${ev.scoreDelta > 0 ? 'subiu' : 'caiu'} ${Math.abs(ev.scoreDelta)} pts`, sub: 'Evolução vs. auditorias anteriores' })
  if (audit?.gargalos?.[0]?.titulo) memory.push({ tone: 'warn', title: audit.gargalos[0].titulo, sub: 'Maior gargalo recorrente' })
  if (audit?.oportunidades?.[0]?.titulo) memory.push({ tone: 'blue', title: audit.oportunidades[0].titulo, sub: 'Oportunidade mapeada pelo NOUS' })

  const prefRows: { k: keyof Prefs; label: string; sub: string }[] = [
    { k: 'briefing', label: 'Briefing diário', sub: 'Resumo do NOUS toda manhã' },
    { k: 'alertas', label: 'Alertas proativos', sub: 'Avisos de CPA, fadiga e oportunidades' },
    { k: 'sugestoes', label: 'Sugestões de ação', sub: 'Recomendações priorizadas por impacto' },
    { k: 'semanal', label: 'Relatório semanal automático', sub: 'Enviado por e-mail às segundas' },
  ]

  return (
    <div className="p-4 md:p-6">
      <header className="mb-5 animate-fade-up">
        <h1 className="text-[23px] font-bold text-ink" style={{ letterSpacing: '-0.02em' }}>Configurações</h1>
        <p className="text-sm text-ink-2 mt-0.5">Workspace e preferências{key ? ` · ${key}` : ''}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-up">
        {/* Workspace */}
        <Card>
          <SectionHead title="Workspace" subtitle="Dados da empresa" icon={<Icon name="grid" size={17} />} />
          <div className="divide-y divide-line-2">
            {[['Nome', key || '—'], ['Segmento', niche], ['Modo de visualização', dashboardMode === 'pro' ? 'Avançado' : 'Simplificado'], ['Fuso horário', 'GMT-03 · Brasília'], ['Moeda', 'BRL (R$)']].map(([l, v]) => (
              <div key={l} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-ink-2">{l}</span><span className="text-sm font-semibold text-ink">{v}</span>
              </div>
            ))}
          </div>
          <Button variant="soft" className="w-full mt-3" onClick={() => router.push('/novo')}>Editar informações</Button>
        </Card>

        {/* Preferências do NOUS */}
        <Card>
          <SectionHead title="Preferências do NOUS" subtitle="Como a IA trabalha pra você" icon={<Icon name="spark" size={17} />} />
          <div className="divide-y divide-line-2">
            {prefRows.map(r => (
              <div key={r.k} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0"><div className="text-sm text-ink">{r.label}</div><div className="text-xs text-ink-3">{r.sub}</div></div>
                <Toggle on={prefs[r.k]} onClick={() => setPref(r.k)} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Modo + Plano */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 animate-fade-up">
        <Card>
          <SectionHead title="Modo padrão" subtitle="Densidade e linguagem da interface" icon={<Icon name="gear" size={17} />} />
          <div className="flex gap-2">
            <Button size="sm" variant={dashboardMode === 'simple' ? 'primary' : 'soft'} onClick={() => setMode('simple')}>Simplificado</Button>
            <Button size="sm" variant={dashboardMode === 'pro' ? 'primary' : 'soft'} onClick={() => setMode('pro')}>Avançado</Button>
          </div>
        </Card>
        <Card>
          <SectionHead title="Plano" icon={<Icon name="rocket" size={17} />} action={<Button size="sm" variant="soft" onClick={() => router.push('/planos')}>Ver planos →</Button>} />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-ink">{planName}</div>
              <div className="text-xs text-ink-3">{plan?.remaining != null ? `${plan.remaining} créditos de IA restantes` : 'Inteligência contínua'}</div>
            </div>
            <Badge tone="good" dot>Ativo</Badge>
          </div>
        </Card>
      </div>

      {/* Memória viva (RAG) */}
      <Card className="mt-4 animate-fade-up">
        <SectionHead title="Memória viva do NOUS" subtitle="Padrões aprendidos com o histórico deste cliente" icon={<Icon name="pulse" size={17} />} action={<SourceBadge source={audit ? 'real' : 'ai'} />} />
        {memory.length > 0 ? (
          <div className="space-y-2">
            {memory.map((m, i) => {
              const c = m.tone === 'good' ? '#0E9E6E' : m.tone === 'warn' ? '#E08B0B' : '#2C5FE0'
              return (
                <div key={i} className="flex items-start gap-3 p-3 rounded-sm bg-canvas-2" style={{ borderLeft: `3px solid ${c}` }}>
                  <span style={{ color: c }} className="shrink-0 mt-0.5"><Icon name="spark" size={15} /></span>
                  <div className="min-w-0"><div className="text-sm font-medium text-ink">{m.title}</div>{m.sub && <div className="text-xs text-ink-3 mt-0.5">{m.sub}</div>}</div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-center py-6 text-ink-3 text-sm">Rode a Análise Profunda algumas vezes para o NOUS construir a memória de evolução deste cliente.</p>
        )}
      </Card>

      {/* Dados locais */}
      <Card className="mt-4 animate-fade-up border-red/20">
        <SectionHead title="Dados locais" subtitle="Armazenamento do navegador" icon={<Icon name="alert" size={17} />} />
        <div className="flex items-center justify-between">
          <div><div className="text-sm text-ink">Limpar dados locais</div><div className="text-xs text-ink-3">Remove clientes e caches salvos neste navegador (não afeta o servidor).</div></div>
          <Button size="sm" variant="ghost" className="text-red" onClick={() => { if (window.confirm('Limpar todos os dados locais deste navegador?')) { clearAll(); window.toast?.({ tone: 'warn', title: 'Dados locais limpos' }); router.push('/hoje') } }}>Limpar</Button>
        </div>
      </Card>
    </div>
  )
}
