// app/portal/[slug]/page.tsx — Portal público white-label do cliente (tema claro, padrão ELYON v2)
import type { CSSProperties } from 'react'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'

interface PortalKpis {
  spend?: number; leads?: number; cpl?: number; roas?: number; revenue?: number; ctr?: number; score?: number | null
  spendDelta?: number | null; leadsDelta?: number | null; cplDelta?: number | null; revenueDelta?: number | null
}
interface PortalData {
  clientName:   string
  agencyName:   string
  showMetrics:  boolean
  showStrategy: boolean
  showActions:  boolean
  niche:        string
  budget:       number
  revenue:      number
  kpis:         PortalKpis | null
  createdAt:    string
}

function decodeDataParam(d: string): PortalData | null {
  try {
    const base64 = d.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(Buffer.from(base64, 'base64').toString('ascii'))
    const p = JSON.parse(json)
    return {
      clientName: p.cn || '', agencyName: p.an || 'Agência',
      showMetrics: p.sm ?? true, showStrategy: p.ss ?? true, showActions: p.sa ?? false,
      niche: p.ni || '', budget: p.b || 0, revenue: p.r || 0, kpis: p.k || null,
      createdAt: new Date().toISOString(),
    }
  } catch { return null }
}

async function getPortalFromDB(slug: string): Promise<PortalData | null> {
  if (!supabaseAdmin) return null
  const { data, error } = await supabaseAdmin
    .from('report_shares').select('token, client_name, report_data, created_at').eq('token', slug).maybeSingle()
  if (error || !data || data.report_data?.type !== 'portal') return null
  const r = data.report_data
  return {
    clientName: data.client_name, agencyName: r?.agencyName || 'Agência',
    showMetrics: r?.showMetrics ?? true, showStrategy: r?.showStrategy ?? true, showActions: r?.showActions ?? false,
    niche: r?.niche || '', budget: r?.budget || 0, revenue: r?.revenue || 0, kpis: r?.kpis || null,
    createdAt: data.created_at,
  }
}

// Paleta clara (padrão v2)
const C = { canvas: '#F4F6F9', paper: '#FFFFFF', ink: '#0F1828', ink2: '#3D4859', ink3: '#6B7686', line: '#E6E9EF', blue: '#2B5BE3', green: '#0E9E6E', red: '#E1483F' }
const brl = (n: number) => 'R$ ' + Math.round(n || 0).toLocaleString('pt-BR')
const int = (n: number) => Math.round(n || 0).toLocaleString('pt-BR')

// Tendência client-friendly: mode define quando "subir" é bom.
function trendChip(deltaPct: number | null | undefined, mode: 'up-good' | 'down-good' | 'neutral') {
  if (deltaPct == null || deltaPct === 0) return null
  const up = deltaPct > 0
  const good = mode === 'neutral' ? null : (mode === 'up-good' ? up : !up)
  const color = good == null ? C.ink3 : good ? C.green : C.red
  return { arrow: up ? '↑' : '↓', pct: Math.abs(Math.round(deltaPct)), color, word: good == null ? '' : good ? 'melhorou' : 'piorou' }
}

export default async function PortalPage({ params, searchParams }: { params: { slug: string }; searchParams: { d?: string } }) {
  const portal: PortalData | null =
    (searchParams.d ? decodeDataParam(searchParams.d) : null) ?? (await getPortalFromDB(params.slug))
  if (!portal) notFound()

  const { clientName, agencyName, showMetrics, showStrategy, showActions, niche, budget, revenue, kpis, createdAt } = portal
  const k = kpis
  const hasReal = !!k && ((k.leads || 0) > 0 || (k.spend || 0) > 0)

  // Modelo recomendado de KPIs — linguagem do dono do negócio, com tendência.
  const cards: { label: string; value: string; hint: string; t: ReturnType<typeof trendChip> }[] = hasReal
    ? [
        { label: 'Investimento no período', value: brl(k!.spend || 0), hint: 'quanto foi aplicado em anúncios', t: trendChip(k!.spendDelta, 'neutral') },
        { label: 'Contatos gerados', value: int(k!.leads || 0), hint: 'pessoas interessadas que chegaram', t: trendChip(k!.leadsDelta, 'up-good') },
        { label: 'Custo por contato', value: (k!.cpl || 0) > 0 ? brl(k!.cpl || 0) : '—', hint: 'quanto custou cada interessado (menor é melhor)', t: trendChip(k!.cplDelta, 'down-good') },
        (k!.roas || 0) > 0
          ? { label: 'Retorno', value: `${k!.roas}×`, hint: 'cada R$1 investido virou esse valor', t: trendChip(k!.revenueDelta, 'up-good') }
          : { label: 'Receita gerada', value: (k!.revenue || 0) > 0 ? brl(k!.revenue || 0) : '—', hint: 'faturamento atribuído aos anúncios', t: trendChip(k!.revenueDelta, 'up-good') },
      ]
    : [
        { label: 'Investimento / mês', value: budget ? brl(budget) : '—', hint: '', t: null },
        { label: 'Receita', value: revenue ? brl(revenue) : '—', hint: '', t: null },
        { label: 'Segmento', value: niche || '—', hint: '', t: null },
        { label: 'Status', value: 'Ativa', hint: '', t: null },
      ]

  // Resumo em 1 frase — responde "como vão as coisas" sem o cliente precisar perguntar.
  const summary = hasReal ? (() => {
    const parts: string[] = []
    if ((k!.leads || 0) > 0) parts.push(`geramos ${int(k!.leads || 0)} contatos${(k!.cpl || 0) > 0 ? ` a ${brl(k!.cpl || 0)} cada` : ''}`)
    if ((k!.spend || 0) > 0) { const d = k!.spendDelta; parts.push(`investimos ${brl(k!.spend || 0)}${d != null && d !== 0 ? ` (${Math.abs(Math.round(d))}% ${d > 0 ? 'a mais' : 'a menos'})` : ''}`) }
    const l = k!.leadsDelta
    const tail = l != null && l !== 0 ? ` Os resultados ${l > 0 ? 'melhoraram' : 'caíram'} ${Math.abs(Math.round(l))}% em relação ao período anterior.` : ''
    return parts.length ? `No período, ${parts.join(' e ')}.${tail}` : ''
  })() : ''
  const health = (k?.score != null)
    ? (k.score >= 70 ? { txt: 'Tudo saudável', color: C.green } : k.score >= 50 ? { txt: 'Indo bem, com pontos a melhorar', color: '#D9870B' } : { txt: 'Precisa de atenção', color: C.red })
    : null

  const card: CSSProperties = { padding: '18px', borderRadius: '14px', background: C.paper, border: `1px solid ${C.line}`, boxShadow: '0 1px 2px rgba(15,24,40,0.04)' }
  const sectionLabel: CSSProperties = { fontSize: '11px', fontWeight: 700, color: C.ink3, letterSpacing: '0.08em', marginBottom: '12px', textTransform: 'uppercase' }

  return (
    <div style={{ minHeight: '100vh', background: C.canvas, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top bar */}
      <div style={{ background: C.paper, borderBottom: `1px solid ${C.line}`, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: C.ink }}>{agencyName}</div>
            <div style={{ fontSize: '10px', color: C.ink3 }}>Powered by ELYON</div>
          </div>
        </div>
        <div style={{ fontSize: '11px', padding: '4px 11px', borderRadius: '20px', color: C.green, background: 'rgba(14,158,110,0.08)', border: '1px solid rgba(14,158,110,0.2)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.green, display: 'inline-block' }} />
          Campanha ativa
        </div>
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: C.ink, margin: '0 0 6px', letterSpacing: '-0.02em' }}>{clientName}</h1>
          <p style={{ fontSize: '13px', color: C.ink3, margin: 0 }}>
            Como estão seus resultados · {new Date(createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Resumo em linguagem simples (só quando há dado real) */}
        {showMetrics && (summary || health) && (
          <div style={{ ...card, marginBottom: '20px', background: 'rgba(43,91,227,0.04)', borderColor: 'rgba(43,91,227,0.18)' }}>
            {health && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: health.color, marginBottom: summary ? '8px' : 0 }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: health.color, display: 'inline-block' }} />
                Como estão as campanhas: {health.txt}
              </div>
            )}
            {summary && <p style={{ fontSize: '14px', color: C.ink2, lineHeight: 1.6, margin: 0 }}>{summary}</p>}
          </div>
        )}

        {/* KPIs */}
        {showMetrics && (
          <section style={{ marginBottom: '28px' }}>
            <div style={sectionLabel}>Seus números{hasReal ? ' (vs. período anterior)' : ''}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {cards.map((m, i) => (
                <div key={i} style={card}>
                  <div style={{ fontSize: '11px', color: C.ink3, marginBottom: '8px' }}>{m.label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: C.ink, letterSpacing: '-0.01em' }}>{m.value}</div>
                    {m.t && (
                      <span style={{ fontSize: '12px', fontWeight: 700, color: m.t.color }}>
                        {m.t.arrow} {m.t.pct}%{m.t.word ? ` · ${m.t.word}` : ''}
                      </span>
                    )}
                  </div>
                  {m.hint && <div style={{ fontSize: '11.5px', color: C.ink3, marginTop: '6px', lineHeight: 1.4 }}>{m.hint}</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Estratégia */}
        {showStrategy && (
          <section style={{ marginBottom: '28px' }}>
            <div style={sectionLabel}>O que estamos fazendo</div>
            <div style={{ padding: '18px 20px', borderRadius: '14px', background: 'rgba(43,91,227,0.05)', border: `1px solid rgba(43,91,227,0.18)` }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: C.blue, marginBottom: '10px' }}>Anúncios para atrair clientes</div>
              <p style={{ fontSize: '13.5px', color: C.ink2, lineHeight: 1.65, margin: '0 0 12px' }}>
                Estamos divulgando {clientName} no Instagram, Facebook e Google para atrair {niche ? <>clientes certos de <strong style={{ color: C.ink }}>{niche.toLowerCase()}</strong></> : 'os clientes certos'}.
                O foco é trazer o maior número de contatos qualificados pelo menor custo, e aumentar o investimento conforme os resultados aparecem.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['Instagram & Facebook', 'Google', 'Vários anúncios testados', 'Otimização contínua'].map(tag => (
                  <span key={tag} style={{ fontSize: '11.5px', padding: '4px 10px', borderRadius: '6px', color: C.blue, background: 'rgba(43,91,227,0.07)', border: `1px solid rgba(43,91,227,0.18)` }}>{tag}</span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Próximos passos */}
        {showActions && (
          <section style={{ marginBottom: '28px' }}>
            <div style={sectionLabel}>Próximos passos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['Criar novos anúncios para manter o interesse alto', 'Ampliar o alcance para mais clientes parecidos com os que já compram', 'Melhorar a página de destino para converter mais contatos'].map((action, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 15px', borderRadius: '11px', background: C.paper, border: `1px solid ${C.line}` }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '7px', flexShrink: 0, background: 'rgba(43,91,227,0.08)', border: `1px solid rgba(43,91,227,0.18)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: C.blue }}>{i + 1}</div>
                  <span style={{ fontSize: '13.5px', color: C.ink2 }}>{action}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '11.5px', color: C.ink3 }}>
            Feito por <strong style={{ color: C.blue }}>{agencyName}</strong> com ELYON
          </div>
          <div style={{ fontSize: '10.5px', color: C.ink3, display: 'flex', alignItems: 'center', gap: '5px' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Link seguro
          </div>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params, searchParams }: { params: { slug: string }; searchParams: { d?: string } }) {
  const portal = (searchParams.d ? decodeDataParam(searchParams.d) : null) ?? (await getPortalFromDB(params.slug))
  if (!portal) return { title: 'Portal não encontrado' }
  return { title: `${portal.clientName} — ${portal.agencyName}`, description: `Resultados de ${portal.clientName}` }
}
