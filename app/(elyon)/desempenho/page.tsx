// app/(elyon)/desempenho/page.tsx — Desempenho com DADOS REAIS (auditoria + estratégia).
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Icon, Card, Badge, Button, SectionHead, SourceBadge, Delta, Sparkline, Donut, BarChart, Funnel, LineChart, LegendDot, HBar, ChannelMark, platformName, Modal, CHART_COLORS } from '@/components/dashboard/v2'
import { useDailySeries } from '@/lib/useDailySeries'

const CHANNEL_META: Record<string, { label: string; color: string }> = {
  meta: { label: 'Meta Ads', color: CHART_COLORS.blue },
  facebook: { label: 'Meta Ads', color: CHART_COLORS.blue },
  instagram: { label: 'Meta Ads', color: CHART_COLORS.blue },
  google: { label: 'Google Ads', color: CHART_COLORS.green },
  tiktok: { label: 'TikTok Ads', color: CHART_COLORS.teal },
  linkedin: { label: 'LinkedIn', color: CHART_COLORS.amber },
}
const channelOf = (c: any): { key: string; label: string; color: string } => {
  const raw = String(c.platform || c.channel || c.source || '').toLowerCase()
  const hit = Object.keys(CHANNEL_META).find(k => raw.includes(k))
  if (hit) return { key: CHANNEL_META[hit].label, ...CHANNEL_META[hit] }
  return { key: 'Outros', label: 'Outros', color: CHART_COLORS.slate }
}
// ROI só é exibido quando plausível (cálculo de benchmark pode estourar p/ nichos de ticket alto).
const roiOk = (range: any) => { const m = String(range || '').match(/(\d+)/g); return m ? Number(m[m.length - 1]) <= 600 : false }

const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n || 0)
const int = (n: number) => new Intl.NumberFormat('pt-BR').format(n || 0)
const campCPL = (c: any) => (c.leads > 0 ? Math.round(c.spend / c.leads) : null)

// Exporta as campanhas filtradas como CSV real (download no navegador).
function exportCsv(rows: any[]) {
  const head = ['Campanha', 'Canal', 'Investimento', 'Receita', 'Conversoes', 'ROAS', 'CPA', 'CTR', 'Status']
  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = rows.map(c => [
    c.name || '', String(c.platform || ''), Math.round(c.spend || 0), Math.round(c.revenue || 0),
    Math.round(c.leads || 0), c.roas ? Number(c.roas).toFixed(2) : '', campCPL(c) ?? '',
    c.ctr ? Number(c.ctr).toFixed(2) : '', STATUS_LABEL[c._s] || '',
  ].map(esc).join(','))
  const csv = [head.map(esc).join(','), ...lines].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `campanhas_${new Date().toISOString().slice(0, 10)}.csv`
  a.click(); URL.revokeObjectURL(url)
  if (typeof window !== 'undefined') window.toast?.({ tone: 'good', title: 'CSV exportado', body: `${rows.length} campanhas baixadas.` })
}

type SubTab = 'visao' | 'campanhas' | 'audiencias' | 'canais' | 'criativos' | 'funil' | 'alocador'
const STATUS_TONE: Record<string, 'good' | 'warn' | 'bad'> = { vencedora: 'good', atencao: 'warn', critica: 'bad' }
const STATUS_LABEL: Record<string, string> = { vencedora: 'Escalar', atencao: 'Otimizar', critica: 'Revisar' }

function Empty() {
  return (
    <div className="p-4 md:p-6">
      <Card className="max-w-xl mx-auto mt-12">
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-blue-soft flex items-center justify-center mx-auto mb-4"><Icon name="chart" size={26} /></div>
          <h2 className="text-lg font-semibold text-ink mb-2">Sem dados de performance</h2>
          <p className="text-sm text-ink-2 mb-4">Rode a Análise Profunda (ou conecte suas contas) para ver o desempenho por campanha.</p>
          <Button onClick={() => (window.location.href = '/diagnostico')}>Rodar Análise Profunda</Button>
        </div>
      </Card>
    </div>
  )
}

export default function DesempenhoPage() {
  const clientData = useAppStore(s => s.clientData)
  const savedClients = useAppStore(s => s.savedClients)
  const auditCache = useAppStore(s => s.auditCache)
  const strategyData = useAppStore(s => s.strategyData)
  const connectedAccounts = useAppStore(s => s.connectedAccounts)
  const selectedMetaAccountByClient = useAppStore(s => s.selectedMetaAccountByClient)
  const selectedGoogleAccountByClient = useAppStore(s => s.selectedGoogleAccountByClient)
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState<SubTab>('visao')
  const [filterOpen, setFilterOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [channelFilter, setChannelFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [intel, setIntel] = useState<any | null>(null)
  const [intelLoading, setIntelLoading] = useState(false)
  const [creativeSort, setCreativeSort] = useState<'spend' | 'recent' | 'cpl'>('spend')
  const competitors = useAppStore(s => s.competitors)
  const [crIntel, setCrIntel] = useState<any | null>(null)
  const [crIntelLoading, setCrIntelLoading] = useState(false)
  const [crIntelErr, setCrIntelErr] = useState('')
  const [openCre, setOpenCre] = useState<any | null>(null)
  const [nousAdIds, setNousAdIds] = useState<string[]>([])
  const [crDetail, setCrDetail] = useState<Record<string, any>>({})
  const [crDetailLoad, setCrDetailLoad] = useState<string>('')
  const [crDetailErr, setCrDetailErr] = useState<string>('')
  const [detailCamp, setDetailCamp] = useState<any | null>(null)
  const [campBreakdown, setCampBreakdown] = useState<any | null>(null)
  const [campBreakdownLoading, setCampBreakdownLoading] = useState(false)
  const [stratGen, setStratGen] = useState(false)
  const [execId, setExecId] = useState<string | null>(null)

  // Executa ação na campanha (Meta ou Google) com aprovação explícita: preview -> aprovar -> executar.
  const execCampaign = async (c: any, action: 'pause' | 'scale') => {
    if (!c?.id) return
    const isGoogle = c.platform === 'google'
    const endpoint = isGoogle ? '/api/google/campaign/action' : '/api/meta/campaign/action'
    const canal = isGoogle ? 'Google Ads' : 'Meta Ads'
    const payload = { action, id: String(c.id), accountId: isGoogle ? undefined : (metaAcctId || undefined), clientName: acctKey, campaignName: c.name }
    setExecId(String(c.id))
    try {
      const prev = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, dryRun: true }) })
      const pd = await prev.json()
      if (!pd?.success) { window.toast?.({ tone: 'bad', title: 'Não foi possível', body: pd?.error || 'Tente novamente.' }); return }
      if (typeof window !== 'undefined' && !window.confirm(`${pd.plan}\n\nConfirmar e executar no ${canal}?`)) return
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const d = await res.json()
      window.toast?.(d?.success ? { tone: 'good', title: 'Ação executada', body: d.message } : { tone: 'bad', title: 'Não foi possível', body: d?.error || 'Tente novamente.' })
    } catch { window.toast?.({ tone: 'bad', title: 'Falha de conexão' }) } finally { setExecId(null) }
  }
  useEffect(() => { setMounted(true) }, [])

  // Regenera a estratégia (público-alvo, ranking) sem sair da tela.
  const genStrat = async () => {
    setStratGen(true)
    const { generateStrategyForActiveClient } = await import('@/lib/createClientFlow')
    const r = await generateStrategyForActiveClient()
    setStratGen(false)
    if (typeof window !== 'undefined') window.toast?.(r.ok
      ? { tone: 'good', title: 'Estratégia gerada', body: 'Público-alvo, regiões e ranking atualizados.' }
      : { tone: 'bad', title: 'Falha ao gerar', body: r.error })
  }
  const StrategyEmpty = ({ text }: { text: string }) => (
    <Card><div className="text-center py-8 text-ink-3">
      <p className="text-sm">{text}</p>
      <Button variant="primary" size="sm" className="mt-3" icon={<Icon name="spark" size={14} />} onClick={genStrat} disabled={stratGen}>{stratGen ? 'Gerando…' : 'Gerar estratégia'}</Button>
    </div></Card>
  )

  const acctKey = clientData?.clientName || savedClients?.[0]?.clientData?.clientName || ''
  // Isolamento por cliente: SÓ a conta que ESTE cliente selecionou (sem fallback pra
  // conta padrão do usuário, que é de outro cliente).
  const metaAcctId = (acctKey && selectedMetaAccountByClient[acctKey]) || ''
  const googleAcctId = (acctKey && selectedGoogleAccountByClient[acctKey]) || ''
  const hasMeta = !!metaAcctId
  // Inteligência da conta (criativos, geo, posicionamentos, ad sets, pixel) sob demanda.
  const loadIntel = useCallback(() => {
    if (intel !== null || intelLoading || !hasMeta) return
    setIntelLoading(true)
    // O endpoint é POST (lê accountId no corpo) e pesado (até ~60s em contas grandes).
    // Antes chamávamos via GET → 405. Não mascarar falha como {} — mostra o motivo real.
    fetch('/api/ads-data/meta-intelligence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: metaAcctId, niche: clientData?.niche }),
      signal: AbortSignal.timeout(120000),
    })
      .then(async r => {
        const d = await r.json().catch(() => null)
        if (!r.ok || !d) { setIntel({ _error: `Falha ao carregar (HTTP ${r.status}). Conta grande — tente recarregar.` }); return }
        if (!d.success) { setIntel({ _error: d.error || 'Falha ao carregar os dados da conta.' }); return }
        setIntel(d)
      })
      .catch((e: any) => setIntel({ _error: e?.name === 'TimeoutError' ? 'Tempo esgotado ao carregar a conta (muito grande). Tente recarregar.' : 'Falha de conexão ao carregar a conta.' }))
      .finally(() => setIntelLoading(false))
  }, [intel, intelLoading, hasMeta, metaAcctId])
  useEffect(() => { if (tab === 'criativos' || tab === 'audiencias') loadIntel() }, [tab, loadIntel])
  // Drill-down: busca os breakdowns DESTA campanha (não da conta), na plataforma dela.
  useEffect(() => {
    const c = detailCamp
    if (!c?.id) { setCampBreakdown(null); return }
    const isG = c.platform === 'google'
    let active = true
    setCampBreakdownLoading(true); setCampBreakdown(null)
    fetch('/api/ads-data/campaign-breakdown', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId: String(c.id), platform: isG ? 'google' : 'meta', accountId: isG ? (googleAcctId || undefined) : (metaAcctId || undefined) }),
      signal: AbortSignal.timeout(60000),
    })
      .then(r => r.json()).then(d => { if (active) setCampBreakdown(d?.success ? d : { _err: d?.error || true }) })
      .catch((e: any) => { if (active) setCampBreakdown({ _err: e?.name === 'TimeoutError' ? 'Tempo esgotado' : true }) })
      .finally(() => { if (active) setCampBreakdownLoading(false) })
    return () => { active = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailCamp?.id])
  // Criativos marcados como "criado pelo NOUS" (Fase 2c) — por cliente.
  useEffect(() => {
    const cn = clientData?.clientName
    if (!cn) { setNousAdIds([]); return }
    let active = true
    fetch(`/api/nous-creatives?clientName=${encodeURIComponent(cn)}`)
      .then(r => r.ok ? r.json() : { adIds: [] }).then(d => { if (active) setNousAdIds(Array.isArray(d.adIds) ? d.adIds : []) }).catch(() => {})
    return () => { active = false }
  }, [clientData?.clientName])
  const creatives: any[] | null = intel ? (Array.isArray(intel.ads) ? intel.ads : []) : null
  const creLoading = intelLoading

  // Inteligência de criativo (IA): ângulo vencedor + o que não funciona + próximo a testar.
  const runCreativeIntel = () => {
    if (crIntelLoading || !creatives || creatives.length === 0) return
    setCrIntelLoading(true); setCrIntelErr('')
    // Brecha do concorrente (Raio-X) p/ o NOUS explorar no próximo criativo.
    const cn = clientData?.clientName || ''
    const competitorGap = (competitors[cn] || []).map((c: any) => c.xray?.gap).filter(Boolean).slice(0, 2).join(' · ')
    fetch('/api/creative-intelligence', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ niche: clientData?.niche, clientName: cn, competitorGap, creatives }),
    })
      .then(async r => {
        const d = await r.json().catch(() => null)
        if (!r.ok || !d?.success) { setCrIntelErr(d?.error || 'Não foi possível analisar agora.'); return }
        setCrIntel(d.analysis)
      })
      .catch(() => setCrIntelErr('Falha de conexão.'))
      .finally(() => setCrIntelLoading(false))
  }
  // Veredito por criativo (determinístico, dos números reais) — o "o que fazer" do clique.
  const verdictFor = (c: any): { label: string; tone: 'good' | 'warn' | 'bad'; action: string; replace?: boolean } => {
    const freq = +(c.frequency || 0), cpl = +(c.cpl || 0), ctr = +(c.ctr || 0), leads = +(c.leads || 0), spend = +(c.spend || 0)
    if (freq >= 3.5 && spend > 0) return { label: 'Fadiga', tone: 'bad', action: `Frequência ${freq.toFixed(1)}× — o público já viu demais. Troque por um criativo novo no mesmo ângulo antes do CPL subir.`, replace: true }
    if (spend > 100 && leads === 0) return { label: 'Desperdício', tone: 'bad', action: `Gastou ${brl(spend)} sem 1 lead. Pause este criativo e realoque a verba.` }
    if (c.tag === 'winner' || (leads >= 3 && cpl > 0)) return { label: 'Vencedor', tone: 'good', action: `CPL ${brl(cpl)} com ${leads} leads. Escale: suba o orçamento ~20% enquanto o CPL segurar.` }
    if (ctr >= 1.2 && leads < 3 && spend > 50) return { label: 'Revisar oferta', tone: 'warn', action: `CTR ${ctr}% é bom, mas converte pouco — o gargalo é a oferta/landing, não o criativo.` }
    if (ctr > 0 && ctr < 0.8 && spend > 30) return { label: 'Gancho fraco', tone: 'warn', action: `CTR ${ctr}% — o gancho dos 3 primeiros segundos não prende. Teste outra abertura.`, replace: true }
    if (spend < 30) return { label: 'Aprendendo', tone: 'warn', action: 'Ainda em aprendizado — pouca verba pra concluir. Dê mais tempo antes de decidir.' }
    return { label: 'Saudável', tone: 'good', action: 'Performance ok. Mantenha rodando e fique de olho na frequência.' }
  }
  // Fase 2c: este criativo nasceu de uma sugestão do NOUS? (marca explícita por id OU tag [NOUS] no nome)
  const isNous = (c: any) => nousAdIds.includes(c.id) || /\[nous\]/i.test(c.name || '')
  const markNous = (c: any, mark: boolean) => {
    const cn = clientData?.clientName || ''
    if (!cn || !c.id) return
    setNousAdIds(prev => mark ? Array.from(new Set([...prev, c.id])) : prev.filter(x => x !== c.id))
    fetch('/api/nous-creatives', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientName: cn, adId: c.id, adName: c.name, niche: clientData?.niche, mark }) }).catch(() => {})
    if (typeof window !== 'undefined') window.toast?.({ tone: 'good', title: mark ? 'Marcado como criado pelo NOUS' : 'Desmarcado', body: mark ? 'Vou medir o resultado dele vs os demais.' : '' })
  }

  // Análise individual sob demanda (no clique do card). Cacheia por id — re-abrir é grátis.
  const analyzeCreative = (c: any) => {
    const id = c.id
    if (!id || crDetail[id] || crDetailLoad === id) return
    setCrDetailLoad(id); setCrDetailErr('')
    fetch('/api/creative-detail', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ niche: clientData?.niche, clientName: clientData?.clientName, creative: { name: c.name, title: c.title, body: c.body, format: c.format, ctr: c.ctr, cpl: c.cpl, frequency: c.frequency, leads: c.leads, ageDays: c.ageDays } }),
    })
      .then(async r => {
        const d = await r.json().catch(() => null)
        if (!r.ok || !d?.success) { setCrDetailErr(d?.error || 'Não foi possível analisar agora.'); return }
        setCrDetail(prev => ({ ...prev, [id]: d.detail }))
      })
      .catch(() => setCrDetailErr('Falha de conexão.'))
      .finally(() => setCrDetailLoad(''))
  }
  const replaceInStudio = (c: any) => {
    const brief = `Criar um substituto para o anúncio "${c.title || c.name || ''}" de ${clientData?.clientName || 'meu negócio'} (${clientData?.niche || ''}). Manter o ângulo que funciona, com gancho e criativo NOVOS (o atual está saturado/fraco). Formato sugerido: ${c.format || 'vídeo'}.\n\nAo publicar no Meta, inclua [NOUS] no NOME do anúncio para o ELYON medir o resultado automaticamente.`
    if (typeof window !== 'undefined') window.location.href = `/criar?intent=${encodeURIComponent(brief)}`
  }
  // Briefa o próximo criativo no Estúdio (mesma rota do hub: /criar?intent=…).
  const sendNextToStudio = (nc: any) => {
    const brief = `Criar um anúncio de ${nc.format} para ${clientData?.clientName || 'meu negócio'} (${clientData?.niche || ''}).\nÂngulo: ${nc.angle}\nGancho (3s): ${nc.hook}\nTexto principal: ${nc.primary_text}\nHeadline: ${nc.headline}\nCTA: ${nc.cta}\n\nAo publicar no Meta, inclua [NOUS] no NOME do anúncio para o ELYON medir o resultado automaticamente.`
    if (typeof window !== 'undefined') window.location.href = `/criar?intent=${encodeURIComponent(brief)}`
  }

  const key = clientData?.clientName || savedClients?.[0]?.clientData?.clientName || ''
  const daily = useDailySeries(auditCache[key]?.[0]?.audit?._realMetrics?.avgROAS ?? null)
  if (!mounted) return null
  if (!key) return <Empty />

  const audit: any = auditCache[key]?.[0]?.audit
  const rm = audit?._realMetrics
  const cc = audit?._campanhasClassificadas
  const ranking: any[] = strategyData?.strategy?.priority_ranking || []

  const camps = cc
    ? [
        ...(cc.vencedoras || []).map((c: any) => ({ ...c, _s: 'vencedora' })),
        ...(cc.atencao || []).map((c: any) => ({ ...c, _s: 'atencao' })),
        ...(cc.criticas || []).map((c: any) => ({ ...c, _s: 'critica' })),
      ].sort((a, b) => (b.spend || 0) - (a.spend || 0))
    : []

  if (!rm && camps.length === 0 && ranking.length === 0) return <Empty />

  // Split por canal derivado das campanhas reais. Se a conta tem só UMA plataforma
  // conectada (dataSource), todo o investimento é dela — evita subcontar como "Outros".
  const singlePlatform = rm?.dataSource === 'meta' ? { label: 'Meta Ads', color: CHART_COLORS.blue }
    : rm?.dataSource === 'google' ? { label: 'Google Ads', color: CHART_COLORS.green } : null
  const chMap = new Map<string, { label: string; color: string; spend: number; leads: number }>()
  for (const c of camps) {
    const ch = singlePlatform || channelOf(c)
    const e = chMap.get(ch.label) || { label: ch.label, color: ch.color, spend: 0, leads: 0 }
    e.spend += c.spend || 0; e.leads += c.leads || 0
    chMap.set(ch.label, e)
  }
  const channels = [...chMap.values()].sort((a, b) => b.spend - a.spend)
  const hasChannelSplit = channels.length >= 2 && !(channels.length === 1)
  const channelDonut = channels.map(c => ({ label: c.label, value: c.spend, color: c.color }))

  // KPIs (6 rótulos exatos do prototype) com mini-sparkline derivada do delta real.
  const prev = audit?._previousTotals
  const spark = (cur: number, deltaPct: number | null | undefined): number[] | null => {
    if (cur == null || deltaPct == null || deltaPct === 0) return null
    return [cur / (1 + deltaPct / 100), cur]
  }
  const kpis = rm ? [
    { label: 'Investimento', value: brl(rm.totalSpend), trend: prev?.spendDelta ?? null, inverse: false, series: spark(rm.totalSpend, prev?.spendDelta), up: (prev?.spendDelta ?? 0) >= 0 },
    { label: 'Receita', value: rm.totalRevenue > 0 ? brl(rm.totalRevenue) : '—', trend: prev?.revenueDelta ?? null, inverse: false, series: rm.totalRevenue > 0 ? spark(rm.totalRevenue, prev?.revenueDelta) : null, up: (prev?.revenueDelta ?? 0) >= 0 },
    { label: 'ROAS', value: rm.avgROAS ? `${rm.avgROAS}x` : '—', trend: null, inverse: false, series: null, up: true },
    { label: 'Conversões', value: int(rm.totalLeads), trend: prev?.leadsDelta ?? null, inverse: false, series: spark(rm.totalLeads, prev?.leadsDelta), up: (prev?.leadsDelta ?? 0) >= 0 },
    { label: 'CPA médio', value: rm.avgCPL ? brl(rm.avgCPL) : '—', trend: prev?.cplDelta ?? null, inverse: true, series: spark(rm.avgCPL, prev?.cplDelta), up: (prev?.cplDelta ?? 0) <= 0 },
    { label: 'CTR médio', value: rm.avgCTR ? `${rm.avgCTR}%` : '—', trend: null, inverse: false, series: null, up: true },
  ] : []

  const tabs: { key: SubTab; label: string; icon: string }[] = [
    { key: 'visao', label: 'Visão geral', icon: 'chart' }, { key: 'campanhas', label: 'Campanhas', icon: 'megaphone' },
    { key: 'audiencias', label: 'Audiências', icon: 'users' }, { key: 'canais', label: 'Canais', icon: 'layers' },
    { key: 'criativos', label: 'Criativos', icon: 'spark' }, { key: 'funil', label: 'Funil', icon: 'funnel' },
    { key: 'alocador', label: 'Alocador IA', icon: 'scale' },
  ]
  const ta: any = strategyData?.strategy?.target_audience
  const criativos: any = audit?.criativos_meta

  const CampTable = ({ rows }: { rows: any[] }) => {
    // Omite colunas sem dado real (Receita/ROAS/CTR ausentes em contas de leads).
    const hasRev = rows.some(r => (r.revenue || 0) > 0)
    const hasRoas = rows.some(r => (r.roas || 0) > 0)
    const hasCtr = rows.some(r => (r.ctr || 0) > 0)
    const th = 'py-2.5 px-3 font-semibold border-b border-line whitespace-nowrap'
    return (
      <div className="overflow-x-auto no-sb">
        <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr className="text-[10.5px] font-mono uppercase tracking-[0.06em] text-ink-3">
              <th className={`text-left ${th}`}>Campanha</th>
              <th className={`text-right ${th}`}>Investimento</th>
              {hasRev && <th className={`text-right ${th}`}>Receita</th>}
              <th className={`text-right ${th}`}>Conv.</th>
              {hasRoas && <th className={`text-right ${th}`}>ROAS</th>}
              <th className={`text-right ${th}`}>CPA</th>
              {hasCtr && <th className={`text-right ${th}`}>CTR</th>}
              <th className={`text-center ${th}`}>Status</th>
              <th className={`border-b border-line w-8`}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c, i) => {
              const id = `${c.name}-${i}`
              const cpa = c.leads > 0 ? Math.round(c.spend / c.leads) : null
              const roas = Number(c.roas || 0)
              const td = 'py-[11px] px-3 border-b border-line-2 whitespace-nowrap font-mono'
              return (
                <tr key={id} className="hover:bg-canvas transition-colors cursor-pointer" onClick={() => setDetailCamp(c)}>
                  <td className="py-[11px] px-3 border-b border-line-2 max-w-[300px]">
                    <div className="flex items-center gap-2.5">
                      <ChannelMark name={platformName(c.platform)} size={20} />
                      <span className="text-ink font-medium truncate">{c.name || 'Sem nome'}</span>
                    </div>
                  </td>
                  <td className={`text-right text-ink ${td}`}>{brl(c.spend || 0)}</td>
                  {hasRev && <td className={`text-right text-ink ${td}`}>{(c.revenue || 0) > 0 ? brl(c.revenue) : '—'}</td>}
                  <td className={`text-right text-ink ${td}`}>{int(c.leads || 0)}</td>
                  {hasRoas && <td className={`text-right ${td} font-semibold`} style={{ color: roas >= 3 ? '#0B855D' : '#E08B0B' }}>{roas > 0 ? `${roas.toFixed(2)}x` : '—'}</td>}
                  <td className={`text-right text-ink ${td}`}>{cpa != null ? brl(cpa) : '—'}</td>
                  {hasCtr && <td className={`text-right text-ink-2 ${td}`}>{(c.ctr || 0) > 0 ? `${Number(c.ctr).toFixed(2)}%` : '—'}</td>}
                  <td className="py-[11px] px-3 border-b border-line-2 text-center"><Badge tone={STATUS_TONE[c._s]} dot>{STATUS_LABEL[c._s]}</Badge></td>
                  <td className="py-[11px] px-3 border-b border-line-2 text-right text-ink-4"><Icon name="chevR" size={15} className="inline" /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  // Drill-down de campanha — breakdowns reais DESTA campanha (não da conta), na plataforma dela.
  const CampanhaDetalhe = ({ c }: { c: any }) => {
    const dv = [CHART_COLORS.blue, CHART_COLORS.green, CHART_COLORS.teal, CHART_COLORS.amber, CHART_COLORS.red, CHART_COLORS.slate]
    const isGoogleCamp = c.platform === 'google'
    const cd = campBreakdown
    const cdLoading = campBreakdownLoading
    const adsets: any[] = cd?.adsets || []
    const placements: any[] = cd?.placements || []
    const geo: any[] = cd?.geo || []
    const demo: any[] = cd?.demo || []
    const placeTotal = placements.reduce((s, p) => s + (p.spend || 0), 0) || 1
    const geoTotal = geo.reduce((s, g) => s + (g.spend || 0), 0) || 1
    const cpaC = c.leads > 0 ? Math.round(c.spend / c.leads) : null
    const gLabel = (g: string) => g === 'male' ? 'Homens' : g === 'female' ? 'Mulheres' : (g || '—')
    return (
      <div className="space-y-4 animate-fade-up">
        <button onClick={() => setDetailCamp(null)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 hover:text-ink">
          <Icon name="chevL" size={16} /> Voltar para campanhas
        </button>
        <Card>
          <div className="flex items-center gap-3 flex-wrap">
            <ChannelMark name={platformName(c.platform)} size={32} />
            <div className="flex-1 min-w-[200px]">
              <div className="text-[17px] font-bold text-ink" style={{ letterSpacing: '-0.01em' }}>{c.name || 'Campanha'}</div>
              <div className="text-[12.5px] text-ink-3">{c.objective || (c.name?.toLowerCase().includes('lead') ? 'Geração de leads' : 'Conversões')}</div>
            </div>
            <Badge tone={STATUS_TONE[c._s]} dot>{STATUS_LABEL[c._s]}</Badge>
            <div className="text-right"><div className="text-[10px] font-mono uppercase tracking-wider text-ink-3">Investido</div><div className="font-mono font-bold text-ink">{brl(c.spend || 0)}</div></div>
            <div className="text-right"><div className="text-[10px] font-mono uppercase tracking-wider text-ink-3">CPA</div><div className="font-mono font-bold text-ink">{cpaC != null ? brl(cpaC) : '—'}</div></div>
          </div>
          {(c.evidence || c.recommended_action) && (
            <div className="grid md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-line-2">
              {c.evidence && <div className="p-3 rounded-sm bg-canvas-2"><div className="text-[10px] font-mono uppercase tracking-wider text-ink-3 mb-1">Evidência</div><p className="text-xs text-ink-2 leading-relaxed">{c.evidence}</p></div>}
              {c.recommended_action && <div className="p-3 rounded-sm bg-blue-soft border border-blue-line"><div className="text-[10px] font-mono uppercase tracking-wider text-blue mb-1">Recomendação do NOUS</div><p className="text-xs text-ink-2 leading-relaxed">{c.recommended_action}</p></div>}
            </div>
          )}
          {/* Ações executáveis (Meta e Google) com aprovação explícita */}
          {c.id && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-line-2">
              {c._s === 'vencedora'
                ? <Button size="sm" variant="primary" icon={<Icon name="arrowUp" size={14} />} disabled={execId === String(c.id)} onClick={() => execCampaign(c, 'scale')}>{execId === String(c.id) ? 'Aguarde…' : 'Escalar (+20%)'}</Button>
                : <Button size="sm" variant="soft" icon={<Icon name="alert" size={14} />} disabled={execId === String(c.id)} onClick={() => execCampaign(c, 'pause')}>{execId === String(c.id) ? 'Aguarde…' : 'Pausar campanha'}</Button>}
              <span className="text-[11px] text-ink-3">no {c.platform === 'google' ? 'Google Ads' : 'Meta Ads'} · com aprovação</span>
            </div>
          )}
        </Card>

        {/* ── Diagnóstico do NOUS desta campanha (sempre renderiza, dados da própria campanha) ── */}
        {(() => {
          const cpl = campCPL(c)
          const ctr = Number(c.ctr || 0)
          const roas = Number(c.roas || 0)
          const freq = Number(c.frequency || 0)
          const reach = Number(c.reach || 0)
          const impressions = Number(c.impressions || 0)
          const revenue = Number(c.revenue || 0)
          const cpc = c.clicks > 0 ? c.spend / c.clicks : (impressions && ctr ? (c.spend / (impressions * ctr / 100)) : null)
          const cpm = impressions > 0 ? (c.spend / impressions) * 1000 : null
          const accCpls = camps.map((x: any) => campCPL(x)).filter((v: any) => v && v > 0) as number[]
          const avgCpl = accCpls.length ? Math.round(accCpls.reduce((a, b) => a + b, 0) / accCpls.length) : null
          const be = (clientData?.ticketPrice && clientData?.grossMargin && clientData?.conversionRate)
            ? Math.round(clientData.ticketPrice * (clientData.grossMargin / 100) * (clientData.conversionRate / 100)) : null
          const diag: { t: 'good' | 'warn' | 'bad'; text: string }[] = []
          if (cpl && avgCpl) { const d = Math.round((cpl / avgCpl - 1) * 100); diag.push({ t: d <= -15 ? 'good' : d >= 15 ? 'bad' : 'warn', text: `CPL ${brl(cpl)} — ${Math.abs(d)}% ${d < 0 ? 'abaixo' : 'acima'} da média da conta (${brl(avgCpl)}).` }) }
          if (cpl && be) diag.push({ t: cpl <= be ? 'good' : 'bad', text: cpl <= be ? `Dentro do ponto de equilíbrio (${brl(be)}) — cada lead dá lucro.` : `${(cpl / be).toFixed(1)}× o ponto de equilíbrio (${brl(be)}) — cada lead aqui dá prejuízo.` })
          if (ctr) diag.push({ t: ctr >= 2 ? 'good' : ctr >= 1 ? 'warn' : 'bad', text: `CTR ${ctr.toFixed(2)}% — ${ctr >= 2 ? 'criativo forte' : ctr >= 1 ? 'mediano' : 'criativo pouco atrativo, teste um novo ângulo'}.` })
          if (freq >= 3.5) diag.push({ t: freq >= 5 ? 'bad' : 'warn', text: `Frequência ${freq.toFixed(1)}× — público ${freq >= 5 ? 'saturado' : 'saturando'}; renove o criativo antes do CTR cair.` })
          if (roas) diag.push({ t: roas >= 3 ? 'good' : roas >= 1.5 ? 'warn' : 'bad', text: `ROAS ${roas.toFixed(2)}× — ${roas >= 3 ? 'retorno saudável' : roas >= 1.5 ? 'no limite' : 'abaixo do break-even'}.` })
          const verdict = c._s === 'vencedora' ? { t: 'good' as const, label: 'Escalar', why: 'Eficiência acima da conta — suba a verba com segurança.' }
            : c._s === 'critica' ? { t: 'bad' as const, label: 'Pausar / revisar', why: 'Custo alto sem retorno proporcional — corte ou reestruture.' }
            : { t: 'warn' as const, label: 'Monitorar', why: 'Resultado mediano — otimize criativo e segmentação.' }
          const proj = (c._s === 'vencedora' && cpl) ? Math.round((c.spend * 0.2) / cpl) : null
          const metrics: [string, string][] = [
            ['Investido', brl(c.spend || 0)], ['Conversões', int(c.leads || 0)], ['CPL/CPA', cpl ? brl(cpl) : '—'],
            ['CTR', ctr ? `${ctr.toFixed(2)}%` : '—'], ['ROAS', roas ? `${roas.toFixed(2)}×` : '—'], ['Receita', revenue > 0 ? brl(revenue) : '—'],
            ['CPC', cpc ? brl(cpc) : '—'], ['CPM', cpm ? brl(cpm) : '—'], ['Frequência', freq ? `${freq.toFixed(1)}×` : '—'], ['Alcance', reach ? int(reach) : '—'],
          ]
          const tc: Record<string, string> = { good: '#0E9E6E', warn: '#D9870B', bad: '#E1483F' }
          return (
            <>
              <Card>
                <SectionHead title="Diagnóstico do NOUS" subtitle="Leitura desta campanha vs. sua conta e ponto de equilíbrio" icon={<Icon name="spark" size={17} />} action={<SourceBadge source="real" />} />
                <div className="flex items-start gap-3 mb-3 p-3 rounded-md" style={{ background: `${tc[verdict.t]}10`, border: `1px solid ${tc[verdict.t]}30` }}>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-pill shrink-0" style={{ color: tc[verdict.t], background: `${tc[verdict.t]}1A` }}>{verdict.label}</span>
                  <span className="text-[13px] text-ink-2 leading-relaxed">{verdict.why}{proj ? ` Escalar +20% ≈ +${int(proj)} leads/mês no mesmo CPL.` : ''}</span>
                </div>
                <div className="space-y-1.5">
                  {diag.map((d, i) => (
                    <div key={i} className="flex items-start gap-2 text-[13px] text-ink-2"><span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: tc[d.t] }} />{d.text}</div>
                  ))}
                  {diag.length === 0 && <p className="text-[13px] text-ink-3">Dados insuficientes para um diagnóstico completo — rode a Análise Profunda para enriquecer.</p>}
                </div>
              </Card>
              <Card>
                <SectionHead title="Métricas detalhadas" icon={<Icon name="chart" size={17} />} action={<SourceBadge source="real" />} />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  {metrics.map(([k, v]) => (
                    <div key={k} className="p-2.5 rounded-sm bg-canvas-2 border border-line">
                      <div className="text-[9.5px] font-mono uppercase tracking-wider text-ink-3 mb-0.5">{k}</div>
                      <div className="text-[15px] font-mono font-bold text-ink">{v}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )
        })()}

        {cdLoading && <Card><div className="text-center py-10 text-ink-3 text-sm">Carregando os detalhes desta campanha…</div></Card>}
        {!cdLoading && cd && !cd._err && (
          <>
            {placements.length > 0 && (
              <Card>
                <SectionHead title={isGoogleCamp ? 'Redes' : 'Posicionamentos'} subtitle={`Distribuição de entrega · esta campanha`} icon={<Icon name="layers" size={17} />} action={<SourceBadge source="real" />} />
                <div className="flex gap-4 items-center">
                  <Donut data={placements.map((p, i) => ({ label: p.platform, value: p.spend, color: dv[i % dv.length] }))} centerLabel={placements[0]?.platform || ''} centerSub="top" />
                  <div className="flex-1 space-y-2">
                    {placements.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 text-[12.5px]">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: dv[i % dv.length] }} />
                        <span className="flex-1 text-ink capitalize truncate">{p.platform}{p.position ? ` · ${p.position}` : ''}</span>
                        <span className="font-mono text-ink-2">{Math.round((p.spend / placeTotal) * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {adsets.length > 0 && (
              <Card>
                <SectionHead title={isGoogleCamp ? 'Grupos de anúncios' : 'Conjuntos de anúncios (ad sets)'} subtitle={`${adsets.length} ${isGoogleCamp ? 'grupos' : 'ad sets'} desta campanha`} icon={<Icon name="grid" size={17} />} action={<SourceBadge source="real" />} />
                <div className="overflow-x-auto no-sb">
                  <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse' }}>
                    <thead><tr className="text-[10.5px] font-mono uppercase tracking-[0.06em] text-ink-3">
                      <th className="text-left py-2.5 px-3 font-semibold border-b border-line">{isGoogleCamp ? 'Grupo' : 'Ad set'}</th>
                      <th className="text-right py-2.5 px-3 font-semibold border-b border-line">Investido</th>
                      <th className="text-right py-2.5 px-3 font-semibold border-b border-line">Leads</th>
                      <th className="text-right py-2.5 px-3 font-semibold border-b border-line">CPL</th>
                    </tr></thead>
                    <tbody>
                      {adsets.slice(0, 15).map((a, i) => (
                        <tr key={a.id || i} className="hover:bg-canvas">
                          <td className="py-[11px] px-3 border-b border-line-2 max-w-[280px]"><span className="text-ink font-medium truncate block">{a.name}</span></td>
                          <td className="py-[11px] px-3 border-b border-line-2 text-right font-mono text-ink">{brl(a.spend || 0)}</td>
                          <td className="py-[11px] px-3 border-b border-line-2 text-right font-mono text-ink">{int(a.leads || 0)}</td>
                          <td className="py-[11px] px-3 border-b border-line-2 text-right font-mono text-ink">{a.cpl > 0 ? brl(a.cpl) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {demo.length > 0 && (
                <Card>
                  <SectionHead title="Quem mais converte" subtitle="Idade × gênero · esta campanha" icon={<Icon name="target" size={17} />} action={<SourceBadge source="real" />} />
                  <div className="space-y-2">
                    {demo.slice(0, 6).map((d, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-[12.5px]">
                        <span className="text-ink w-[120px] shrink-0 truncate">{gLabel(d.gender)} · {d.age || '—'}</span>
                        <span className="flex-1 font-mono text-ink-3">{int(d.leads)} leads</span>
                        <span className="font-mono text-ink-2 w-14 text-right">{d.cpl > 0 ? brl(d.cpl) : '—'}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
              {geo.length > 0 && (
                <Card>
                  <SectionHead title="Geografia" subtitle="Top regiões · esta campanha" icon={<Icon name="globe" size={17} />} action={<SourceBadge source="real" />} />
                  <div className="space-y-2.5">
                    {geo.slice(0, 8).map((g, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <span className="font-mono text-[12px] font-semibold text-ink w-[90px] shrink-0 truncate">{g.region}</span>
                        <div className="flex-1"><HBar value={(g.spend / geoTotal) * 100} color={CHART_COLORS.blue} h={7} /></div>
                        <span className="font-mono text-[11.5px] text-ink-3 w-9 text-right">{Math.round((g.spend / geoTotal) * 100)}%</span>
                        <span className="font-mono text-[11.5px] text-ink-2 w-14 text-right">{g.cpl > 0 ? brl(g.cpl) : '—'}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
            {placements.length === 0 && adsets.length === 0 && demo.length === 0 && geo.length === 0 && (
              <Card><div className="text-center py-6 text-ink-3 text-sm">Sem detalhamento por grupo/posicionamento para esta campanha no período.</div></Card>
            )}
          </>
        )}
        {!cdLoading && cd?._err && <Card><div className="text-center py-6 text-sm text-amber">Não consegui carregar os detalhes desta campanha. {typeof cd._err === 'string' ? cd._err : ''}</div></Card>}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <header className="mb-5 animate-fade-up">
        <h1 className="text-[23px] font-bold text-ink" style={{ letterSpacing: '-0.02em' }}>Desempenho</h1>
        <p className="text-sm text-ink-2 mt-0.5">{key}{rm ? ` · ${int(rm.campaignCount || camps.length)} campanhas` : ''}</p>
      </header>

      <div className="mb-5 flex gap-1 border-b border-line overflow-x-auto no-sb">
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setDetailCamp(null) }}
            className={`px-3.5 py-2.5 text-[13.5px] font-medium border-b-2 -mb-px whitespace-nowrap transition-colors inline-flex items-center gap-1.5 ${tab === t.key ? 'text-ink border-blue font-semibold' : 'text-ink-3 border-transparent hover:text-ink'}`}>
            <Icon name={t.icon} size={15} />{t.label}
          </button>
        ))}
      </div>

      {tab === 'visao' && (
        <div className="space-y-4 animate-fade-up">
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
            {kpis.map(k => (
              <Card key={k.label} padding="sm" hover>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3">{k.label}</span>
                  {k.trend != null && k.trend !== 0 && <Delta value={k.trend} inverse={k.inverse} />}
                </div>
                <span className="text-[20px] font-bold font-mono text-ink block count-up" style={{ letterSpacing: '-0.02em' }}>{k.value}</span>
                {k.series && <div className="mt-2"><Sparkline data={k.series} h={26} color={k.up ? CHART_COLORS.green : CHART_COLORS.red} /></div>}
              </Card>
            ))}
          </div>
          {daily && (
            <Card>
              <SectionHead title={daily.hasRevenue ? 'Tendência de receita × investimento' : 'Tendência de investimento × leads'} subtitle="Série diária real (Meta)" icon={<Icon name="chart" size={17} />}
                action={<div className="flex gap-3">{daily.hasRevenue ? <LegendDot color={CHART_COLORS.green}>Receita</LegendDot> : <LegendDot color={CHART_COLORS.green}>Leads</LegendDot>}<LegendDot color={CHART_COLORS.blue}>Investimento</LegendDot></div>} />
              <LineChart
                labels={daily.labels}
                money={daily.hasRevenue}
                series={daily.hasRevenue
                  ? [{ name: 'Receita', color: CHART_COLORS.green, data: daily.revenue! }, { name: 'Investimento', color: CHART_COLORS.blue, data: daily.spend }]
                  : [{ name: 'Leads', color: CHART_COLORS.green, data: daily.leads }, { name: 'Investimento', color: CHART_COLORS.blue, data: daily.spend }]} />
              {daily.hasRevenue && <p className="text-[11px] text-ink-3 mt-2">Receita estimada a partir do investimento diário real × ROAS médio da conta.</p>}
            </Card>
          )}
          {hasChannelSplit && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <SectionHead title="Distribuição por canal" subtitle="Investimento" icon={<Icon name="layers" size={17} />} />
                <Donut data={channelDonut} centerLabel={brl(channels.reduce((s, c) => s + c.spend, 0)).replace('R$ ', 'R$')} centerSub="total" />
              </Card>
              <Card>
                <SectionHead title="Leads por canal" subtitle="Volume de conversões" icon={<Icon name="chart" size={17} />} />
                <BarChart data={channels.map(c => ({ label: c.label.replace(' Ads', ''), value: c.leads, color: c.color }))} height={200} valueFmt={(v) => int(v)} />
              </Card>
            </div>
          )}
          <Card>
            <SectionHead title="Top campanhas" subtitle={camps.length ? `${camps.length} com investimento` : undefined} icon={<Icon name="chart" size={17} />} />
            {camps.length > 0 ? <CampTable rows={camps.slice(0, 8)} /> : <p className="text-center py-8 text-ink-3 text-sm">Sem dados por campanha. Rode a Análise Profunda.</p>}
          </Card>
        </div>
      )}

      {tab === 'campanhas' && detailCamp && <CampanhaDetalhe c={detailCamp} />}
      {tab === 'campanhas' && !detailCamp && (() => {
        const channels = Array.from(new Set(camps.map((c: any) => platformName(c.platform))))
        const filtered = camps.filter((c: any) =>
          (channelFilter === 'all' || platformName(c.platform) === channelFilter) &&
          (statusFilter === 'all' || c._s === statusFilter))
        const activeFilters = (channelFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0)
        const pill = (active: boolean) => `px-3 py-1.5 text-[12.5px] font-semibold rounded-pill border-[1.5px] ${active ? 'border-blue bg-blue-soft text-blue-600' : 'border-line bg-paper text-ink-2 hover:border-line-strong'}`
        return (
          <div className="animate-fade-up">
            <Card>
              <SectionHead title="Desempenho por campanha" subtitle={`${filtered.length} de ${camps.length} campanhas · clique numa linha para detalhes`} icon={<Icon name="megaphone" size={17} />}
                action={camps.length ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" icon={<Icon name="funnel" size={14} />} onClick={() => setFilterOpen(true)}>Filtros{activeFilters ? ` · ${activeFilters}` : ''}</Button>
                    <Button size="sm" variant="ghost" icon={<Icon name="download" size={14} />} onClick={() => setExportOpen(true)}>Exportar</Button>
                  </div>
                ) : undefined} />
              {filtered.length > 0 ? <CampTable rows={filtered} /> : <p className="text-center py-8 text-ink-3 text-sm">Nenhuma campanha{activeFilters ? ' com esses filtros' : ''}.</p>}
            </Card>

            <Modal open={filterOpen} onClose={() => setFilterOpen(false)} icon="filter" title="Filtrar campanhas" sub="Refine a lista por canal e status"
              footer={<><Button variant="ghost" onClick={() => { setChannelFilter('all'); setStatusFilter('all') }}>Limpar</Button><Button onClick={() => setFilterOpen(false)}>Aplicar</Button></>}>
              <div className="text-xs font-semibold text-ink-2 mb-2">Canal</div>
              <div className="flex flex-wrap gap-2 mb-4">
                {['all', ...channels].map(c => <button key={c} onClick={() => setChannelFilter(c)} className={pill(channelFilter === c)}>{c === 'all' ? 'Todos' : c}</button>)}
              </div>
              <div className="text-xs font-semibold text-ink-2 mb-2">Status</div>
              <div className="flex flex-wrap gap-2">
                {[['all', 'Todos'], ['vencedora', 'Escalar'], ['atencao', 'Otimizar'], ['critica', 'Revisar']].map(([k, l]) => <button key={k} onClick={() => setStatusFilter(k)} className={pill(statusFilter === k)}>{l}</button>)}
              </div>
            </Modal>

            <Modal open={exportOpen} onClose={() => setExportOpen(false)} icon="download" title="Exportar campanhas" sub="Escolha o formato">
              <div className="grid gap-2.5">
                {[['CSV detalhado', 'layers'], ['PDF executivo', 'doc'], ['Slides para diretoria', 'image']].map(([l, ic]) => (
                  <button key={l} onClick={() => { setExportOpen(false); if (l === 'CSV detalhado') exportCsv(filtered); else window.toast?.({ tone: 'good', title: 'Gerando', body: `${l}…` }) }}
                    className="flex items-center gap-3 p-3.5 rounded-sm border border-line bg-paper hover:border-blue-line transition-colors text-left">
                    <span className="text-blue"><Icon name={ic} size={17} /></span>
                    <span className="flex-1 text-[13.5px] font-semibold text-ink">{l}</span>
                    <Icon name="chevR" size={15} className="text-ink-3" />
                  </button>
                ))}
              </div>
            </Modal>
          </div>
        )
      })()}

      {tab === 'canais' && (
        <div className="space-y-4 animate-fade-up">
          {hasChannelSplit && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {channels.map(c => {
                  const cpl = c.leads > 0 ? Math.round(c.spend / c.leads) : null
                  return (
                    <Card key={c.label} padding="sm" hover>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                        <span className="text-sm font-semibold text-ink truncate">{c.label}</span>
                      </div>
                      <div className="text-[18px] font-bold font-mono text-ink">{brl(c.spend)}</div>
                      <div className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3 mt-0.5">investido</div>
                      <div className="mt-2 pt-2 border-t border-line-2 flex justify-between text-xs">
                        <span className="text-ink-3">Leads</span><span className="font-mono text-ink">{int(c.leads)}</span>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-ink-3">CPL</span><span className="font-mono text-ink">{cpl != null ? brl(cpl) : '—'}</span>
                      </div>
                    </Card>
                  )
                })}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <SectionHead title="Leads por canal" icon={<Icon name="chart" size={17} />} />
                  <BarChart data={channels.map(c => ({ label: c.label.replace(' Ads', ''), value: c.leads, color: c.color }))} height={200} valueFmt={(v) => int(v)} />
                </Card>
                <Card>
                  <SectionHead title="Distribuição de verba" subtitle="Participação no investimento" icon={<Icon name="layers" size={17} />} />
                  <Donut data={channelDonut} centerLabel={int(channels.reduce((s, c) => s + c.leads, 0))} centerSub="leads" />
                </Card>
              </div>
            </>
          )}
        <Card>
          <SectionHead title="Canais recomendados" subtitle="Ranking e alocação sugerida pela IA" icon={<Icon name="layers" size={17} />} />
          {ranking.length > 0 ? (
            <div className="space-y-3">
              {ranking.map((ch: any, i: number) => (
                <div key={ch.channel || i} className="flex items-center gap-3 p-3 bg-canvas-2 rounded-sm">
                  <span className="w-7 h-7 rounded-md bg-paper border border-line text-ink font-mono text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink">{ch.channel}</div>
                    <div className="text-xs text-ink-3">{ch.budget_brl ? `${brl(ch.budget_brl)}/mês` : ''}{ch.cpl_avg ? ` · CPL ~${brl(ch.cpl_avg)}` : ''}{ch.leads_min ? ` · ${int(ch.leads_min)}–${int(ch.leads_max)} leads` : ''}</div>
                  </div>
                  {roiOk(ch.roi_range) && <Badge tone="good">ROI {ch.roi_range}</Badge>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-ink-3">
              <p className="text-sm">Gere a estratégia para ver o ranking de canais.</p>
              <Button variant="primary" size="sm" className="mt-3" icon={<Icon name="spark" size={14} />} onClick={genStrat} disabled={stratGen}>{stratGen ? 'Gerando…' : 'Gerar estratégia'}</Button>
            </div>
          )}
        </Card>
        </div>
      )}

      {tab === 'audiencias' && (() => {
        // Audiências REAIS da conta (ad sets = públicos, demografia, geo) + recomendação do NOUS.
        const adsets: any[] = (intel?.adSets || []).filter((a: any) => (a.spend || 0) > 0)
        const demo: any[] = (intel?.demoBreakdown || []).filter((d: any) => (d.leads || 0) > 0 || (d.spend || 0) > 0)
        const geoReal: any[] = (intel?.geoBreakdown || intel?.intelligenceData?.geoBreakdown || []).filter((g: any) => (g.spend || 0) > 0)
        const hasReal = adsets.length > 0 || demo.length > 0 || geoReal.length > 0

        // Mediana de CPL entre públicos com lead → base para classificar (escalar/manter/cortar).
        const cplArr = adsets.filter(a => (a.leads || 0) > 0 && (a.cpl || 0) > 0).map(a => a.cpl).sort((x, y) => x - y)
        const medCpl = cplArr.length ? cplArr[Math.floor(cplArr.length / 2)] : 0
        const recOf = (a: any): { t: string; tone: 'good' | 'bad' | 'blue'; txt: string } => {
          if ((a.leads || 0) === 0 && (a.spend || 0) >= Math.max(medCpl || 0, 25)) return { t: 'Revisar', tone: 'bad', txt: 'Investiu sem gerar lead — revise segmentação/criativo' }
          if (medCpl && (a.cpl || 0) > 0 && a.cpl <= medCpl * 0.85) return { t: 'Escalar', tone: 'good', txt: 'CPL abaixo da mediana da conta — candidato a +orçamento' }
          if (medCpl && (a.cpl || 0) >= medCpl * 1.4) return { t: 'Cortar', tone: 'bad', txt: 'CPL bem acima da mediana — realoque a verba' }
          return { t: 'Manter', tone: 'blue', txt: 'Dentro da média da conta' }
        }
        const topAdsets = [...adsets].sort((a, b) => (b.spend || 0) - (a.spend || 0)).slice(0, 8)

        // Ignora o bucket "unknown/Unknown" que o Meta às vezes devolve (sem idade/gênero).
        const validCohort = (d: any) => d.gender && !/unknown/i.test(String(d.gender)) && d.age && !/unknown/i.test(String(d.age))
        const demoLeads = demo.filter(d => (d.leads || 0) > 0 && validCohort(d))
        const maxLeads = Math.max(1, ...demoLeads.map(d => d.leads || 0))
        const topDemo = [...demoLeads].sort((a, b) => (b.leads || 0) - (a.leads || 0)).slice(0, 6)
        // Melhor coorte = menor CPL entre os coortes com VOLUME relevante (≥15% do maior),
        // pra não eleger um coorte de pouquíssimos leads. Cai pra qualquer válido se preciso.
        const withCpl = demoLeads.filter(d => (d.cpl || 0) > 0)
        const substantial = withCpl.filter(d => (d.leads || 0) >= maxLeads * 0.15)
        const bestCohort = (substantial.length ? substantial : withCpl).sort((a, b) => a.cpl - b.cpl)[0] || null
        const gLabel = (g: string) => g === 'male' ? 'Homens' : g === 'female' ? 'Mulheres' : (g || '—')

        const topGeo = [...geoReal].sort((a, b) => (b.leads || 0) - (a.leads || 0) || (b.spend || 0) - (a.spend || 0)).slice(0, 6)

        if (!hasReal && !ta) {
          return (
            <div className="space-y-4 animate-fade-up">
              {intelLoading
                ? <Card><div className="text-center py-10 text-ink-3 text-sm">Carregando audiências reais da Meta…</div></Card>
                : <StrategyEmpty text="Conecte o Meta e sincronize, ou gere a estratégia, para ver públicos, idade/gênero e regiões." />}
            </div>
          )
        }

        return (
          <div className="space-y-4 animate-fade-up">
            {intelLoading && !hasReal && <Card><div className="text-center py-8 text-ink-3 text-sm">Carregando audiências reais da Meta…</div></Card>}

            {/* ── Públicos ativos (ad sets reais) com CPL e o que fazer ── */}
            {topAdsets.length > 0 && (
              <Card>
                <SectionHead title="Públicos ativos" subtitle="Cada conjunto de anúncios é um público — CPL real e recomendação" icon={<Icon name="users" size={17} />} action={<SourceBadge source="real" />} />
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-sm min-w-[560px]">
                    <thead><tr className="text-left text-[10.5px] font-mono uppercase tracking-wider text-ink-3 border-b border-line">
                      <th className="py-2 px-1 font-medium">Público</th>
                      <th className="py-2 px-1 font-medium text-right">Investido</th>
                      <th className="py-2 px-1 font-medium text-right">Leads</th>
                      <th className="py-2 px-1 font-medium text-right">CPL</th>
                      <th className="py-2 px-1 font-medium text-right">Ação</th>
                    </tr></thead>
                    <tbody>
                      {topAdsets.map((a, i) => { const r = recOf(a); return (
                        <tr key={a.id || i} className="border-b border-line-2 last:border-0">
                          <td className="py-2.5 px-1">
                            <div className="font-semibold text-ink truncate max-w-[240px]">{a.name || `Público ${i + 1}`}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {a.hasRemarketing && <span className="text-[10px] font-mono uppercase tracking-wide text-blue shrink-0">remarketing</span>}
                              <span className="text-[11px] text-ink-3 truncate max-w-[220px]">{r.txt}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-1 text-right font-mono text-ink-2">{brl(a.spend || 0)}</td>
                          <td className="py-2.5 px-1 text-right font-mono text-ink-2">{a.leads || 0}</td>
                          <td className="py-2.5 px-1 text-right font-mono font-semibold text-ink">{(a.leads || 0) > 0 && (a.cpl || 0) > 0 ? brl(a.cpl) : '—'}</td>
                          <td className="py-2.5 px-1 text-right"><Badge tone={r.tone}>{r.t}</Badge></td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* ── Quem mais converte: idade × gênero (demografia real) ── */}
            {topDemo.length > 0 && (
              <Card>
                <SectionHead title="Quem mais converte" subtitle="Leads e CPL real por faixa etária e gênero" icon={<Icon name="target" size={17} />} action={<SourceBadge source="real" />} />
                {bestCohort && <p className="text-sm text-ink-2 mb-3">Melhor coorte: <span className="font-semibold text-ink">{gLabel(bestCohort.gender)} {bestCohort.age}</span> — CPL {brl(bestCohort.cpl)}.</p>}
                <div className="space-y-2">
                  {topDemo.map((d, i) => { const w = Math.round(((d.leads || 0) / maxLeads) * 100); return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-[116px] text-sm text-ink shrink-0 truncate">{gLabel(d.gender)} · {d.age}</div>
                      <div className="flex-1 h-6 rounded-sm bg-canvas-2 overflow-hidden relative">
                        <div className="h-full bg-blue/25" style={{ width: `${Math.max(4, w)}%` }} />
                        <span className="absolute inset-y-0 left-2 flex items-center text-[11px] font-mono text-ink-2">{d.leads || 0} leads</span>
                      </div>
                      <div className="w-[78px] text-right font-mono text-sm font-semibold text-ink shrink-0">{(d.cpl || 0) > 0 ? brl(d.cpl) : '—'}</div>
                    </div>
                  )})}
                </div>
              </Card>
            )}

            {/* ── Regiões reais (ou recomendação) + público-alvo ideal (persona) ── */}
            {(topGeo.length > 0 || ta) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {topGeo.length > 0 ? (
                  <Card>
                    <SectionHead title="Melhores regiões" subtitle="Por leads reais" icon={<Icon name="globe" size={17} />} action={<SourceBadge source="real" />} />
                    <div className="space-y-2">
                      {topGeo.map((g, i) => (
                        <div key={i} className="flex items-center gap-2 p-2.5 rounded-sm bg-canvas-2">
                          <span className="w-5 h-5 rounded-md bg-paper border border-line text-ink font-mono text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                          <span className="text-sm text-ink flex-1 truncate">{g.region || g.city || g.name || '—'}</span>
                          <span className="text-xs font-mono text-ink-2">{g.leads || 0} leads</span>
                          {(g.cpl || 0) > 0 && <span className="text-xs font-mono text-ink-3">CPL {brl(g.cpl)}</span>}
                        </div>
                      ))}
                    </div>
                  </Card>
                ) : (ta?.best_regions?.length > 0 && (
                  <Card>
                    <SectionHead title="Melhores regiões" subtitle="Recomendação da estratégia" icon={<Icon name="globe" size={17} />} action={<Badge tone="blue" dot>NOUS</Badge>} />
                    <div className="space-y-2">
                      {ta.best_regions.slice(0, 5).map((r: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 p-2.5 rounded-sm bg-canvas-2">
                          <span className="w-5 h-5 rounded-md bg-paper border border-line text-ink font-mono text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                          <span className="text-sm text-ink flex-1">{r.region || r}</span>
                          {r.why && <span className="text-xs text-ink-3 truncate max-w-[50%]">{r.why}</span>}
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}

                {ta && (
                  <Card>
                    <SectionHead title="Público-alvo ideal" subtitle="Recomendação do NOUS" icon={<Icon name="users" size={17} />} action={<Badge tone="blue" dot>NOUS</Badge>} />
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {[['Faixa etária', ta.demographics?.age_range], ['Gênero', ta.demographics?.gender], ['Renda', ta.demographics?.income_range], ['Foco de canal', (ta.channel_focus || [])[0]]].map(([l, v]) => (
                        <div key={l as string} className="p-3 rounded-sm bg-canvas-2">
                          <div className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3 mb-1">{l}</div>
                          <div className="text-sm font-semibold text-ink">{(v as string) || '—'}</div>
                        </div>
                      ))}
                    </div>
                    {ta.interests?.length > 0 && <div className="flex flex-wrap gap-2">{ta.interests.map((it: string, i: number) => <Badge key={i} tone="blue">{it}</Badge>)}</div>}
                    {ta.persona_snapshot?.one_liner && <p className="text-sm text-ink-2 mt-3 leading-relaxed">{ta.persona_snapshot.one_liner}</p>}
                  </Card>
                )}
              </div>
            )}
          </div>
        )
      })()}

      {tab === 'criativos' && (
        <div className="space-y-4 animate-fade-up">
          {/* Fase 2c — Impacto dos criativos criados pelo NOUS (vs os demais) */}
          {creatives && creatives.some(isNous) && (() => {
            const nousCr = creatives.filter(isNous)
            const otherCr = creatives.filter((c: any) => !isNous(c) && (c.spend || 0) > 0)
            const avgCpl = (arr: any[]) => { const w = arr.filter((c: any) => c.cpl > 0); return w.length ? Math.round(w.reduce((s: number, c: any) => s + c.cpl, 0) / w.length) : null }
            const nCpl = avgCpl(nousCr), oCpl = avgCpl(otherCr)
            const nLeads = nousCr.reduce((s: number, c: any) => s + (c.leads || 0), 0)
            const better = nCpl != null && oCpl != null && nCpl < oCpl
            const diff = (nCpl != null && oCpl != null && oCpl > 0) ? Math.round((1 - nCpl / oCpl) * 100) : null
            return (
              <Card className={better ? 'bg-green-soft border-green/30' : ''}>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="w-9 h-9 rounded-lg bg-ink flex items-center justify-center text-white shrink-0"><Icon name="spark" size={17} /></span>
                  <div className="flex-1 min-w-[200px]">
                    <div className="text-[14px] font-bold text-ink">Impacto dos criativos do NOUS</div>
                    <div className="text-[12.5px] text-ink-2 mt-0.5">
                      {nousCr.length} criativo{nousCr.length > 1 ? 's' : ''} criado{nousCr.length > 1 ? 's' : ''} com o NOUS{nLeads > 0 ? ` · ${nLeads} leads` : ''}.{' '}
                      {nCpl != null && oCpl != null
                        ? <>CPL médio <strong className={better ? 'text-green-600' : 'text-ink'}>{brl(nCpl)}</strong> vs <strong>{brl(oCpl)}</strong> dos demais{diff != null && diff > 0 ? ` — ${diff}% mais barato` : diff != null && diff < 0 ? ` — ${Math.abs(diff)}% mais caro` : ''}.</>
                        : nCpl != null ? <>CPL médio <strong>{brl(nCpl)}</strong>.</> : <span className="text-ink-3">Aguardando entrega pra medir o resultado.</span>}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })()}
          {/* Inteligência de criativo — ângulo vencedor + próximo a testar (IA sobre os dados reais) */}
          {creatives && creatives.length > 0 && (() => {
            const fatigued = creatives.filter((c: any) => (c.frequency || 0) >= 3.5 && (c.spend || 0) > 0)
            return (
              <Card className="bg-gradient-to-br from-blue-soft to-paper border-blue-line">
                <SectionHead title="Inteligência de criativo" subtitle="O ângulo que converte + o próximo criativo a testar" icon={<Icon name="spark" size={17} />}
                  action={!crIntel && <Button size="sm" onClick={runCreativeIntel} disabled={crIntelLoading} icon={<Icon name="spark" size={14} />}>{crIntelLoading ? 'Analisando…' : 'Analisar com o NOUS'}</Button>} />
                {!crIntel && !crIntelLoading && (
                  <p className="text-[12.5px] text-ink-2">
                    O NOUS lê seus {creatives.length} criativos reais e diz qual <strong>ângulo está vencendo</strong>, o que não funciona, e desenha o <strong>próximo criativo a testar</strong> — pronto pro Estúdio.
                    {fatigued.length > 0 && <span className="text-red font-medium"> · {fatigued.length} criativo(s) com fadiga (freq ≥3.5×).</span>}
                  </p>
                )}
                {crIntelErr && <div className="text-[12.5px] text-amber mt-1">{crIntelErr} <button onClick={runCreativeIntel} className="text-blue hover:underline ml-1">Tentar de novo</button></div>}
                {crIntel && (
                  <div className="space-y-3.5 mt-1">
                    {/* Ângulo vencedor */}
                    <div>
                      <div className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3 mb-1.5">Ângulo vencedor</div>
                      <div className="space-y-1.5">
                        {(crIntel.winning_angles || []).map((a: any, i: number) => (
                          <div key={i} className="p-2.5 rounded-md bg-paper border border-line">
                            <div className="text-[13px] font-semibold text-ink">{a.angle}</div>
                            <div className="text-[12px] text-ink-2 mt-0.5">{a.why}</div>
                            {a.evidence && <div className="text-[11px] font-mono text-green-600 mt-1">↳ {a.evidence}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* O que não funciona */}
                    {crIntel.not_working && (
                      <div>
                        <div className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3 mb-1">O que não está funcionando</div>
                        <div className="text-[12.5px] text-ink-2">{crIntel.not_working}</div>
                      </div>
                    )}
                    {/* Próximo criativo a testar */}
                    {crIntel.next_creative && (
                      <div className="p-3 rounded-md bg-ink/[0.03] border border-line">
                        <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                          <div className="text-[10.5px] font-mono uppercase tracking-wider text-blue">Próximo criativo a testar · {crIntel.next_creative.format}</div>
                          <Button size="sm" variant="primary" onClick={() => sendNextToStudio(crIntel.next_creative)} icon={<Icon name="spark" size={13} />}>Gerar no Estúdio</Button>
                        </div>
                        <div className="text-[13px] font-semibold text-ink mb-1">{crIntel.next_creative.angle}</div>
                        <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
                          <div><span className="text-ink-3">Gancho (3s):</span> <span className="text-ink-2">{crIntel.next_creative.hook}</span></div>
                          <div><span className="text-ink-3">Headline:</span> <span className="text-ink-2">{crIntel.next_creative.headline}</span></div>
                          <div className="sm:col-span-2"><span className="text-ink-3">Texto:</span> <span className="text-ink-2">{crIntel.next_creative.primary_text}</span></div>
                          <div><span className="text-ink-3">CTA:</span> <span className="text-ink-2">{crIntel.next_creative.cta}</span></div>
                        </div>
                        {crIntel.next_creative.rationale && <div className="text-[11.5px] text-ink-3 mt-1.5 italic">{crIntel.next_creative.rationale}</div>}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-[11px] text-ink-3 pt-1">
                      <Icon name="check" size={12} className="text-green-600" />
                      O NOUS guardou estes aprendizados na memória deste cliente — as próximas análises constroem em cima.
                    </div>
                  </div>
                )}
              </Card>
            )
          })()}
          {/* Top criativos — métricas reais por anúncio (Meta) */}
          {creLoading && <Card><div className="text-center py-10 text-ink-3 text-sm">Carregando criativos da Meta…</div></Card>}
          {creatives && creatives.length > 0 && (() => {
            const FT: Record<string, { label: string; tone: 'good' | 'warn' | 'bad' }> = {
              winner: { label: 'saudável', tone: 'good' }, ok: { label: 'saudável', tone: 'good' },
              learning: { label: 'monitorar', tone: 'warn' }, waste: { label: 'fadiga', tone: 'bad' },
            }
            const sorters: Record<typeof creativeSort, (a: any, b: any) => number> = {
              spend:  (a, b) => (b.spend || 0) - (a.spend || 0),
              recent: (a, b) => (a.ageDays ?? 99999) - (b.ageDays ?? 99999),
              cpl:    (a, b) => (a.cpl > 0 ? a.cpl : Infinity) - (b.cpl > 0 ? b.cpl : Infinity),
            }
            const active = creatives.filter((c: any) => c.status === 'ACTIVE' || (c.spend || 0) > 0)
            const top = [...active].sort(sorters[creativeSort]).slice(0, 60)
            const SORT_LABELS: Record<typeof creativeSort, string> = { spend: 'Maior gasto', recent: 'Mais recentes', cpl: 'Melhor CPL' }
            return (
              <Card>
                <SectionHead title="Todos os criativos" subtitle={`${active.length} anúncios ativos · dados reais`} icon={<Icon name="image" size={17} />}
                  action={
                    <div className="flex items-center gap-1 bg-canvas-2 rounded-md p-0.5">
                      {(['spend', 'recent', 'cpl'] as const).map(s => (
                        <button key={s} onClick={() => setCreativeSort(s)}
                          className={`text-[11px] font-medium px-2 py-1 rounded-sm transition-colors ${creativeSort === s ? 'bg-paper text-ink shadow-sm' : 'text-ink-3 hover:text-ink'}`}>
                          {SORT_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  } />
                <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
                  {top.map((c, i) => {
                    const ft = FT[c.tag] || FT.ok
                    const hook = (c.title || c.body || c.name || `Criativo ${i + 1}`).slice(0, 80)
                    const fmtLabel: Record<string, string> = { video: 'Vídeo', carousel: 'Carrossel', image: 'Imagem' }
                    const fatigued = (c.frequency || 0) >= 3.5
                    return (
                      <div key={c.id || i} onClick={() => setOpenCre(c)} role="button" tabIndex={0}
                        className="rounded-md border border-line overflow-hidden bg-paper cursor-pointer hover:border-blue hover:shadow-md transition-all">
                        <div className="h-[150px] relative border-b border-line flex items-center justify-center"
                          style={c.imageUrl ? { backgroundImage: `url(${c.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: 'repeating-linear-gradient(135deg, var(--canvas) 0 10px, var(--canvas-2) 10px 20px)' }}>
                          {!c.imageUrl && <span className="font-mono text-[10.5px] text-ink-4">prévia indisponível</span>}
                          {c.format && <span className="absolute top-2 left-2 text-[9.5px] font-mono uppercase tracking-wider bg-ink/75 text-white px-1.5 py-0.5 rounded-sm">{fmtLabel[c.format] || c.format}</span>}
                          <span className="absolute top-2 right-2"><Badge tone={ft.tone}>{ft.label}</Badge></span>
                          {isNous(c) && <span className="absolute bottom-2 left-2 text-[9.5px] font-bold bg-blue text-white px-1.5 py-0.5 rounded-sm shadow-sm">✦ NOUS</span>}
                        </div>
                        <div className="p-3">
                          <div className="text-[12.5px] font-semibold leading-snug mb-2.5 line-clamp-2 min-h-[34px] text-ink">"{hook}"</div>
                          <div className="flex justify-between text-[11.5px] mb-2">
                            <div><div className="text-[10px] font-mono uppercase tracking-wider text-ink-3">CTR</div><div className="font-mono font-bold text-[14px] text-ink">{c.ctr ? `${Number(c.ctr).toFixed(2)}%` : '—'}</div></div>
                            <div className="text-center"><div className="text-[10px] font-mono uppercase tracking-wider text-ink-3">Freq.</div><div className={`font-mono font-bold text-[14px] ${fatigued ? 'text-red' : 'text-ink'}`}>{c.frequency ? `${Number(c.frequency).toFixed(1)}×` : '—'}</div></div>
                            <div className="text-right"><div className="text-[10px] font-mono uppercase tracking-wider text-ink-3">CPL</div><div className="font-mono font-bold text-[14px] text-green-600">{c.cpl > 0 ? brl(c.cpl) : '—'}</div></div>
                          </div>
                          <div className="flex items-center justify-between text-[10.5px] text-ink-3 pt-2 border-t border-line">
                            <span>{c.ageDays != null ? `há ${c.ageDays}d no ar` : 'ativo'}</span>
                            {fatigued && <span className="text-red font-semibold">fadiga · freq alta</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )
          })()}
          {creatives && creatives.length === 0 && !creLoading && hasMeta && (() => {
            const liveCamps = Array.isArray(intel?.campaigns) ? intel.campaigns.length : 0
            return (
            <Card><div className="text-center py-6 text-sm">
              {intel?._error ? (
                <><span className="text-amber font-medium">{intel._error}</span><button onClick={() => setIntel(null)} className="block mx-auto mt-2 text-[12px] text-blue hover:underline">Recarregar</button></>
              ) : intel?.adsError ? (
                <><span className="text-amber font-medium">{intel.adsError}</span><button onClick={() => setIntel(null)} className="block mx-auto mt-2 text-[12px] text-blue hover:underline">Recarregar</button></>
              ) : liveCamps === 0 ? (
                <>
                  <div className="text-ink font-medium">A conta selecionada não retornou campanhas nem anúncios ao vivo.</div>
                  <div className="text-[12px] text-ink-3 mt-1">Conta consultada: <span className="font-mono">act_{metaAcctId || '—'}</span>. Provavelmente não é a conta de anúncio certa deste cliente.</div>
                  <button onClick={() => (window.location.href = '/diagnostico')} className="mt-2 text-[12px] text-blue hover:underline">Conferir a conta em Diagnóstico</button>
                </>
              ) : (
                <>
                  <div className="text-ink-3">A conta tem {liveCamps} campanha(s) ao vivo, mas o Meta não retornou anúncios no período.</div>
                  <div className="text-[12px] text-ink-3 mt-1">Conta: <span className="font-mono">act_{metaAcctId || '—'}</span> · pode ser anúncios pausados/sem entrega nos últimos 30 dias.</div>
                </>
              )}
            </div></Card>
            )
          })()}

        </div>
      )}

      {/* Detalhe do criativo (clique no card) — veredito + o que fazer, específico */}
      {openCre && (() => {
        const c = openCre
        const v = verdictFor(c)
        const fmtLabel: Record<string, string> = { video: 'Vídeo', carousel: 'Carrossel', image: 'Imagem' }
        const toneCls = v.tone === 'good' ? 'text-green-600 bg-green-soft' : v.tone === 'bad' ? 'text-red bg-red-soft' : 'text-amber bg-amber-soft'
        const adSet = (intel?.adSets || []).find((a: any) => a.id === c.adsetId)
        const campName = adSet?.campaignName || (intel?.campaigns || []).find((cm: any) => cm.id === c.campaignId)?.name || ''
        const adSetName = adSet?.name || ''
        const ai = crDetail[c.id]
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm" onClick={() => setOpenCre(null)}>
            <div className="bg-paper rounded-lg border border-line max-w-md w-full max-h-[88vh] overflow-y-auto shadow-xl animate-fade-up" onClick={e => e.stopPropagation()}>
              <div className="h-[200px] relative bg-canvas-2"
                style={c.imageUrl ? { backgroundImage: `url(${c.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
                <button onClick={() => setOpenCre(null)} className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-ink/60 text-white flex items-center justify-center hover:bg-ink transition-colors"><Icon name="x" size={14} /></button>
                <span className="absolute top-2.5 left-2.5 text-[9.5px] font-mono uppercase tracking-wider bg-ink/75 text-white px-1.5 py-0.5 rounded-sm">{fmtLabel[c.format] || 'Imagem'}</span>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${toneCls}`}>{v.label}</span>
                  {c.ageDays != null && <span className="text-[11px] text-ink-3">há {c.ageDays}d no ar</span>}
                </div>
                <div className="text-[14px] font-semibold text-ink mb-2.5 leading-snug">&ldquo;{(c.title || c.body || c.name || '').slice(0, 120)}&rdquo;</div>
                {(campName || adSetName) && (
                  <div className="flex flex-col gap-0.5 mb-3 text-[11.5px]">
                    {campName && <div><span className="text-ink-3">Campanha:</span> <span className="text-ink-2 font-medium">{campName}</span></div>}
                    {adSetName && <div><span className="text-ink-3">Conjunto:</span> <span className="text-ink-2 font-medium">{adSetName}</span></div>}
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {([['CTR', c.ctr ? `${(+c.ctr).toFixed(2)}%` : '—'], ['Freq.', c.frequency ? `${(+c.frequency).toFixed(1)}×` : '—'], ['CPL', c.cpl > 0 ? brl(c.cpl) : '—'], ['Leads', String(c.leads ?? 0)], ['Gasto', brl(c.spend || 0)], ['Cliques', String(c.clicks ?? '—')]] as [string, string][]).map(([l, val], i) => (
                    <div key={i} className="bg-canvas-2 rounded-sm p-2 text-center">
                      <div className="text-[9.5px] font-mono uppercase tracking-wider text-ink-3">{l}</div>
                      <div className={`text-[14px] font-mono font-bold ${l === 'Freq.' && (c.frequency || 0) >= 3.5 ? 'text-red' : 'text-ink'}`}>{val}</div>
                    </div>
                  ))}
                </div>
                {/* Inteligência do NOUS sobre ESTE criativo — sob demanda (1 crédito), cacheada */}
                {ai ? (
                  <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
                    <div><div className="text-[9.5px] font-mono uppercase tracking-wider text-ink-3">Ângulo</div><div className="font-medium text-ink">{ai.angle}</div></div>
                    <div><div className="text-[9.5px] font-mono uppercase tracking-wider text-ink-3">Tom</div><div className="font-medium text-ink">{ai.tone}</div></div>
                    <div className="col-span-2"><div className="text-[9.5px] font-mono uppercase tracking-wider text-ink-3">Gancho</div><div className="text-ink-2">{ai.hook}</div></div>
                    {ai.what_works && <div className="col-span-2"><div className="text-[9.5px] font-mono uppercase tracking-wider text-ink-3">O que funciona</div><div className="text-ink-2">{ai.what_works}</div></div>}
                    <div className="col-span-2 flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${ai.fatigued ? 'text-red bg-red-soft' : 'text-green-600 bg-green-soft'}`}>{ai.fatigued ? 'Fatigado' : 'Sem fadiga'}</span>
                      {ai.fatigue_note && <span className="text-[11px] text-ink-3">{ai.fatigue_note}</span>}
                    </div>
                  </div>
                ) : (
                  <div className="mb-3">
                    <Button size="sm" variant="soft" onClick={() => analyzeCreative(c)} disabled={crDetailLoad === c.id} icon={<Icon name="spark" size={13} />}>
                      {crDetailLoad === c.id ? 'Analisando…' : 'Analisar este criativo (1 crédito)'}
                    </Button>
                    <div className="text-[11px] text-ink-3 mt-1.5">Ângulo, gancho, tom e fadiga deste anúncio — pelo NOUS.</div>
                    {crDetailErr && crDetailLoad !== c.id && <div className="text-[11.5px] text-amber mt-1">{crDetailErr}</div>}
                  </div>
                )}
                <div className="rounded-md p-3 border border-line bg-blue-soft">
                  <div className="text-[10.5px] font-mono uppercase tracking-wider text-blue mb-1">O que fazer</div>
                  <div className="text-[13px] text-ink-2 leading-relaxed">{v.action}</div>
                  {ai?.tip && <div className="text-[12px] text-ink-3 mt-1.5"><span className="text-ink-2 font-medium">Dica do NOUS:</span> {ai.tip}</div>}
                  {v.replace && <Button size="sm" variant="primary" className="mt-2.5" onClick={() => replaceInStudio(c)} icon={<Icon name="spark" size={13} />}>Gerar substituto no Estúdio</Button>}
                </div>
                {/* Fase 2c — marcar este anúncio como criado pelo NOUS (mede vs os demais) */}
                <button onClick={() => markNous(c, !isNous(c))}
                  className={`mt-3 w-full text-[12px] font-medium rounded-md py-2 border transition-colors ${isNous(c) ? 'border-blue text-blue bg-blue-soft' : 'border-line text-ink-3 hover:text-ink hover:border-ink-4'}`}>
                  {isNous(c) ? '✦ Criado pelo NOUS — clique para desmarcar' : 'Marcar como criado pelo NOUS'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {tab === 'alocador' && (() => {
        // Alocador = RECOMENDAÇÃO pura (não executa nada). Realoca verba dos que perdem
        // para os que ganham, mantendo o orçamento total — com base em performance real.
        const list = camps.filter((c: any) => (c.spend || 0) > 0)
        if (list.length === 0) return <div className="animate-fade-up"><StrategyEmpty text="Rode a Análise Profunda para o alocador recomendar a realocação de verba." /></div>

        const cplOf = (c: any) => (c.leads > 0 ? c.spend / c.leads : Infinity)
        const totalSpend = list.reduce((s: number, c: any) => s + (c.spend || 0), 0)
        const winners = list.filter((c: any) => c._s === 'vencedora')
        const losers = list.filter((c: any) => c._s === 'critica')

        // Recomendação de verba por campanha (mantém o total).
        const rec = new Map<any, { sug: number; cut: number; reason: string }>()
        let freed = 0
        for (const c of losers) {
          const isWaste = (c.leads || 0) === 0
          const cut = isWaste ? (c.spend || 0) : (c.spend || 0) * 0.5
          rec.set(c, { sug: (c.spend || 0) - cut, cut, reason: isWaste ? 'Gasta sem conversão — corte a verba' : `CPL alto (${brl(Math.round(cplOf(c)))}) — reduza pela metade` })
          freed += cut
        }
        const wWeight = (c: any) => ((c.leads || 0) > 0 ? c.leads : (isFinite(cplOf(c)) ? 1 / cplOf(c) : 0))
        const totalW = winners.reduce((s: number, c: any) => s + wWeight(c), 0) || 1
        let placed = 0
        for (const c of winners) {
          const add = Math.min(freed * (wWeight(c) / totalW), (c.spend || 0) * 0.5) // máx +50%/campanha
          if (add > 0) { rec.set(c, { sug: (c.spend || 0) + add, cut: -add, reason: `Eficiente (CPL ${cplOf(c) !== Infinity ? brl(Math.round(cplOf(c))) : '—'}) — reforce o orçamento` }); placed += add }
        }
        const remainder = Math.max(0, Math.round(freed - placed))

        // Impacto estimado: leads ganhos ao reforçar vencedoras − leads perdidos ao cortar.
        let extraLeads = 0, lostLeads = 0
        for (const c of winners) { const r = rec.get(c); const cpl = cplOf(c); if (r && isFinite(cpl) && cpl > 0) extraLeads += (-r.cut) / cpl }
        for (const c of losers) { const r = rec.get(c); const cpl = cplOf(c); if (r && isFinite(cpl) && cpl > 0) lostLeads += r.cut / cpl }
        const netLeads = Math.round(extraLeads - lostLeads)

        const moves = list.filter((c: any) => rec.has(c))
          .map((c: any) => { const r = rec.get(c)!; const cur = Math.round(c.spend || 0); const sug = Math.round(r.sug); return { c, cur, sug, delta: cur > 0 ? Math.round((sug / cur - 1) * 100) : null, reason: r.reason, boost: r.cut < 0 } })
          .sort((a: any, b: any) => (b.sug - b.cur) - (a.sug - a.cur))
        const maxV = Math.max(...moves.flatMap((m: any) => [m.cur, m.sug]), 1)

        // Resumo por canal (Meta vs Google).
        const chAgg = new Map<string, { cur: number; sug: number }>()
        for (const c of list) {
          const label = singlePlatform?.label || platformName(c.platform)
          const e = chAgg.get(label) || { cur: 0, sug: 0 }
          e.cur += c.spend || 0; e.sug += rec.has(c) ? rec.get(c)!.sug : (c.spend || 0)
          chAgg.set(label, e)
        }
        const chRows = [...chAgg.entries()].filter(([, v]) => v.cur > 0)

        return (
          <div className="space-y-4 animate-fade-up">
            <Card className="bg-gradient-to-br from-blue-soft to-green-soft border-blue-line">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue flex items-center justify-center shrink-0"><span className="text-white text-lg">◎</span></div>
                <div className="flex-1">
                  <div className="text-[10.5px] font-mono uppercase tracking-wider text-ink-3 mb-1">Alocador de verba · recomendação do NOUS</div>
                  {moves.length > 0 ? (
                    <p className="text-sm text-ink">Realoque cerca de <span className="font-semibold">{brl(Math.round(freed))}</span> dos que perdem para os que ganham — mantendo o mesmo orçamento total ({brl(Math.round(totalSpend))}).{netLeads > 0 && <> Estimativa: <span className="font-semibold text-green-600">+{netLeads} leads/mês</span> ao mesmo custo.</>}</p>
                  ) : (
                    <p className="text-sm text-ink">Conta equilibrada — sem realocação óbvia agora. Foque em testar novos criativos e públicos para criar novas vencedoras.</p>
                  )}
                  <p className="text-[11.5px] text-ink-3 mt-1.5">Isto é uma recomendação — o Alocador não executa nada. Você decide se aplica no gerenciador. Estimativa baseada no CPL atual de cada campanha.</p>
                </div>
              </div>
            </Card>

            {moves.length > 0 && (
              <Card>
                <SectionHead title="Realocação sugerida" subtitle="Por campanha · atual → sugerido" icon={<Icon name="scale" size={17} />} action={<SourceBadge source="real" />} />
                <div className="space-y-3.5">
                  {moves.map((m: any, i: number) => (
                    <div key={i}>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <ChannelMark name={platformName(m.c.platform)} size={16} />
                        <span className="text-sm font-medium text-ink flex-1 min-w-[120px] truncate">{m.c.name || 'Campanha'}</span>
                        <span className="font-mono text-xs text-ink-3">{brl(m.cur)} → <span className="text-ink font-semibold">{brl(m.sug)}</span></span>
                        {m.delta != null && m.delta !== 0 && <Badge tone={m.boost ? 'good' : 'bad'}>{m.boost ? '↑' : '↓'} {Math.abs(m.delta)}%</Badge>}
                      </div>
                      <div className="relative">
                        <HBar value={m.cur} max={maxV} color="#C7CDD6" h={6} className="mb-1" />
                        <HBar value={m.sug} max={maxV} color={m.boost ? CHART_COLORS.green : CHART_COLORS.red} h={6} />
                      </div>
                      <div className="text-[11.5px] text-ink-3 mt-1">{m.boost ? '↑ Reforçar' : '↓ Reduzir'} · {m.reason}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 mt-4 pt-3 border-t border-line-2 flex-wrap">
                  <LegendDot color="#C7CDD6">Atual</LegendDot><LegendDot color={CHART_COLORS.green}>Reforçar</LegendDot><LegendDot color={CHART_COLORS.red}>Reduzir</LegendDot>
                </div>
                {remainder > 0 && <p className="text-[11.5px] text-ink-3 mt-3">Sobra ~{brl(remainder)} sem destino claro (vencedoras já no teto de +50%). Considere testar um novo público/criativo para absorver essa verba.</p>}
              </Card>
            )}

            {chRows.length > 1 && (
              <Card>
                <SectionHead title="Entre canais" subtitle="Meta × Google · atual → sugerido" icon={<Icon name="layers" size={17} />} />
                <div className="space-y-4">
                  {chRows.map(([label, v]) => {
                    const cur = Math.round(v.cur), sug = Math.round(v.sug)
                    const delta = cur > 0 ? Math.round((sug / cur - 1) * 100) : null
                    const maxC = Math.max(...chRows.flatMap(([, x]) => [x.cur, x.sug]), 1)
                    return (
                      <div key={label}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-sm font-medium text-ink flex-1">{label}</span>
                          <span className="font-mono text-xs text-ink-3">{brl(cur)} → <span className="text-ink font-semibold">{brl(sug)}</span></span>
                          {delta != null && delta !== 0 && <Badge tone={delta > 0 ? 'good' : 'bad'}>{delta > 0 ? '↑' : '↓'} {Math.abs(delta)}%</Badge>}
                        </div>
                        <div className="relative">
                          <HBar value={v.cur} max={maxC} color="#C7CDD6" h={6} className="mb-1" />
                          <HBar value={v.sug} max={maxC} color={CHART_COLORS.blue} h={6} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}
          </div>
        )
      })()}

      {tab === 'funil' && (() => {
        // Sanitiza: impressões/cliques às vezes vêm como string (concatenação) ou
        // de cache antigo corrompido. Soma das campanhas (Number) é a fonte confiável;
        // valores absurdos (> 10 trilhões) são descartados.
        const sane = (v: any) => { const n = Number(v); return Number.isFinite(n) && n >= 0 && n < 1e13 ? n : 0 }
        const fromCamps = (k: string) => camps.reduce((s: number, c: any) => s + (Number(c[k]) || 0), 0)
        const fImp = fromCamps('impressions') || sane(rm?.totalImpressions)
        const fClk = fromCamps('clicks') || sane(rm?.totalClicks)
        const fLeads = fromCamps('leads') || sane(rm?.totalLeads)
        const hasFunnel = fImp > 0 || fClk > 0 || fLeads > 0
        const stages = [
          { stage: 'Impressões', v: fImp, color: CHART_COLORS.blue },
          { stage: 'Cliques', v: fClk, color: CHART_COLORS.teal },
          { stage: 'Leads', v: fLeads, color: CHART_COLORS.green },
        ]
        return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-up">
          <Card>
            <SectionHead title="Funil de conversão" subtitle="Da impressão ao lead" icon={<Icon name="funnel" size={17} />}
              action={fImp > 0 && fLeads > 0 ? <Badge tone="blue">Conv. {((fLeads / fImp) * 100).toFixed(2)}%</Badge> : undefined} />
            {hasFunnel ? (
              <Funnel stages={stages.map(s => ({ label: s.stage, value: s.v, color: s.color }))} />
            ) : (
              <p className="text-center py-8 text-ink-3 text-sm">Sem dados de funil. Rode a Análise Profunda com dados de campanha.</p>
            )}
          </Card>
          {hasFunnel && (
            <Card>
              <SectionHead title="Conversão por etapa" icon={<Icon name="chart" size={17} />} />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-[10.5px] font-mono uppercase tracking-wider text-ink-3">
                      <th className="text-left py-2.5 px-2 font-semibold">Etapa</th>
                      <th className="text-right py-2.5 px-2 font-semibold">Volume</th>
                      <th className="text-right py-2.5 px-2 font-semibold">% topo</th>
                      <th className="text-right py-2.5 px-2 font-semibold">Queda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stages.map((s, i, arr) => {
                      const top = arr[0].v || 1
                      const drop = i > 0 && arr[i - 1].v > 0 ? Math.round((1 - s.v / arr[i - 1].v) * 100) : null
                      return (
                        <tr key={s.stage} className="border-b border-line-2">
                          <td className="py-2.5 px-2 text-ink font-medium">{s.stage}</td>
                          <td className="py-2.5 px-2 text-right font-mono text-ink">{int(s.v)}</td>
                          <td className="py-2.5 px-2 text-right font-mono text-ink-2">{(() => { const p = (s.v / top) * 100; return p >= 1 || p === 0 ? Math.round(p) : p.toFixed(2) })()}%</td>
                          <td className="py-2.5 px-2 text-right font-mono text-red">{drop != null ? `−${drop}%` : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
        )
      })()}
    </div>
  )
}
