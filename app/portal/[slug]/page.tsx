// app/portal/[slug]/page.tsx — Portal público white-label do cliente
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'

interface PortalData {
  clientName:   string
  agencyName:   string
  showMetrics:  boolean
  showStrategy: boolean
  showActions:  boolean
  niche:        string
  budget:       number
  revenue:      number
  createdAt:    string
}

// Decodifica ?d= param (base64 URL-safe auto-contido na URL)
function decodeDataParam(d: string): PortalData | null {
  try {
    const base64 = d.replace(/-/g, '+').replace(/_/g, '/') + '=='
    const json = decodeURIComponent(escape(Buffer.from(base64, 'base64').toString('binary')))
    const p = JSON.parse(json)
    return {
      clientName:   p.cn || '',
      agencyName:   p.an || 'Agência',
      showMetrics:  p.sm ?? true,
      showStrategy: p.ss ?? true,
      showActions:  p.sa ?? false,
      niche:        p.ni || '',
      budget:       p.b  || 0,
      revenue:      p.r  || 0,
      createdAt:    new Date().toISOString(),
    }
  } catch {
    return null
  }
}

// Fallback: busca no Supabase
async function getPortalFromDB(slug: string): Promise<PortalData | null> {
  if (!supabaseAdmin) return null
  const { data, error } = await supabaseAdmin
    .from('report_shares')
    .select('token, client_name, report_data, created_at')
    .eq('token', slug)
    .maybeSingle()

  if (error || !data || data.report_data?.type !== 'portal') return null
  const r = data.report_data
  return {
    clientName:   data.client_name,
    agencyName:   r?.agencyName  || 'Agência',
    showMetrics:  r?.showMetrics  ?? true,
    showStrategy: r?.showStrategy ?? true,
    showActions:  r?.showActions  ?? false,
    niche:        r?.niche  || '',
    budget:       r?.budget || 0,
    revenue:      r?.revenue|| 0,
    createdAt:    data.created_at,
  }
}

export default async function PortalPage({
  params,
  searchParams,
}: {
  params:       { slug: string }
  searchParams: { d?: string }
}) {
  // Tenta decodificar dados auto-contidos da URL primeiro (sem DB)
  const portal: PortalData | null =
    (searchParams.d ? decodeDataParam(searchParams.d) : null) ??
    (await getPortalFromDB(params.slug))

  if (!portal) notFound()

  const { clientName, agencyName, showMetrics, showStrategy, showActions, niche, budget, revenue, createdAt } = portal

  const metrics = [
    { label: 'Investimento / mês', value: budget  ? `R$${Number(budget).toLocaleString('pt-BR')}`  : '—', icon: '💰' },
    { label: 'Receita gerada',     value: revenue ? `R$${Number(revenue).toLocaleString('pt-BR')}` : '—', icon: '📈' },
    { label: 'Nicho',              value: niche || '—', icon: '🎯' },
    { label: 'Status da conta',    value: 'Ativa', icon: '✅' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#080D1A', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Top bar */}
      <div style={{ background: '#0F1629', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#F1F5F9' }}>{agencyName}</div>
            <div style={{ fontSize: '10px', color: '#64748B' }}>Powered by ELYON</div>
          </div>
        </div>
        <div style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '20px', color: '#22C55E', background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
          Campanha ativa
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#F1F5F9', margin: '0 0 6px' }}>{clientName}</h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            Relatório de performance · {new Date(createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Metrics */}
        {showMetrics && (
          <section style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', letterSpacing: '0.1em', marginBottom: '12px', textTransform: 'uppercase' }}>Resumo da conta</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {metrics.map(m => (
                <div key={m.label} style={{ padding: '16px', borderRadius: '12px', background: '#0F1629', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '20px', marginBottom: '8px' }}>{m.icon}</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#F1F5F9', marginBottom: '4px' }}>{m.value}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>{m.label}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Strategy */}
        {showStrategy && (
          <section style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', letterSpacing: '0.1em', marginBottom: '12px', textTransform: 'uppercase' }}>Estratégia em andamento</div>
            <div style={{ padding: '18px 20px', borderRadius: '12px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '16px' }}>⚡</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#A78BFA' }}>Campanha orientada a crescimento</span>
              </div>
              <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.6, margin: '0 0 12px' }}>
                Rodamos campanhas de performance no Meta e Google Ads com foco em geração de leads qualificados
                {niche ? <> para o nicho <strong style={{ color: '#F1F5F9' }}>{niche}</strong></> : ''}.
                A estratégia prioriza CPL abaixo do benchmark de mercado com escalonamento progressivo de verba.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['Meta Ads', 'Google Ads', 'Funil TOFU→BOFU', 'Criativos A/B'].map(tag => (
                  <span key={tag} style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '5px', color: '#A78BFA', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>{tag}</span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Actions */}
        {showActions && (
          <section style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', letterSpacing: '0.1em', marginBottom: '12px', textTransform: 'uppercase' }}>Próximas ações</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['Renovar criativos para a próxima semana', 'Expandir audiências lookalike para escalar volume', 'Otimizar landing page com base nos dados de CTR'].map((action, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px', background: '#0F1629', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0, background: 'rgba(124,58,237,0.10)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#A78BFA' }}>{i + 1}</div>
                  <span style={{ fontSize: '13px', color: '#94A3B8' }}>{action}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '11px', color: '#64748B' }}>
            Gerado por <strong style={{ color: '#A78BFA' }}>{agencyName}</strong> via ELYON
          </div>
          <div style={{ fontSize: '10px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Link seguro · ELYON.app
          </div>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params:       { slug: string }
  searchParams: { d?: string }
}) {
  const portal = (searchParams.d ? decodeDataParam(searchParams.d) : null) ?? await getPortalFromDB(params.slug)
  if (!portal) return { title: 'Portal não encontrado' }
  return {
    title: `${portal.clientName} — ${portal.agencyName}`,
    description: `Relatório de performance para ${portal.clientName}`,
  }
}
