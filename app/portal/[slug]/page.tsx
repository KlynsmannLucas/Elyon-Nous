// app/portal/[slug]/page.tsx — Portal público white-label do cliente
import { notFound } from 'next/navigation'

const C = {
  base:    '#080D1A',
  surface: '#0F1629',
  elevated:'#131E35',
  border:  'rgba(255,255,255,0.06)',
  purple:  '#7C3AED',
  purpleL: '#A78BFA',
  purpleD: 'rgba(124,58,237,0.10)',
  green:   '#22C55E',
  amber:   '#F59E0B',
  text1:   '#F1F5F9',
  text2:   '#94A3B8',
  text3:   '#64748B',
}

async function getPortal(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/portal/${slug}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function PortalPage({ params }: { params: { slug: string } }) {
  const portal = await getPortal(params.slug)
  if (!portal) notFound()

  const metrics = [
    { label: 'Investimento / mês', value: portal.budget ? `R$${Number(portal.budget).toLocaleString('pt-BR')}` : '—', icon: '💰' },
    { label: 'Receita gerada',     value: portal.revenue ? `R$${Number(portal.revenue).toLocaleString('pt-BR')}` : '—', icon: '📈' },
    { label: 'Nicho',              value: portal.niche || '—', icon: '🎯' },
    { label: 'Status da conta',    value: 'Ativa', icon: '✅' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: C.base, fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Top bar */}
      <div style={{
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
            background: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: C.text1 }}>
              {portal.agencyName}
            </div>
            <div style={{ fontSize: '10px', color: C.text3 }}>
              Powered by ELYON
            </div>
          </div>
        </div>

        <div style={{
          fontSize: '10px', padding: '3px 10px', borderRadius: '20px',
          color: C.green, background: 'rgba(34,197,94,0.10)',
          border: '1px solid rgba(34,197,94,0.2)',
          display: 'flex', alignItems: 'center', gap: '5px',
        }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: C.green, display: 'inline-block' }} />
          Campanha ativa
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Client header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: C.text1, margin: '0 0 6px' }}>
            {portal.clientName}
          </h1>
          <p style={{ fontSize: '13px', color: C.text3, margin: 0 }}>
            Relatório de performance · Atualizado em {new Date(portal.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Metrics grid */}
        {portal.showMetrics && (
          <section style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: C.text3, letterSpacing: '0.1em', marginBottom: '12px', textTransform: 'uppercase' }}>
              Resumo da conta
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {metrics.map(m => (
                <div key={m.label} style={{
                  padding: '16px', borderRadius: '12px',
                  background: C.surface, border: `1px solid ${C.border}`,
                }}>
                  <div style={{ fontSize: '20px', marginBottom: '8px' }}>{m.icon}</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: C.text1, marginBottom: '4px' }}>
                    {m.value}
                  </div>
                  <div style={{ fontSize: '11px', color: C.text3 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Strategy summary */}
        {portal.showStrategy && (
          <section style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: C.text3, letterSpacing: '0.1em', marginBottom: '12px', textTransform: 'uppercase' }}>
              Estratégia em andamento
            </div>
            <div style={{
              padding: '18px 20px', borderRadius: '12px',
              background: C.purpleD, border: `1px solid rgba(124,58,237,0.2)`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '16px' }}>⚡</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: C.purpleL }}>
                  Campanha orientada a crescimento
                </span>
              </div>
              <p style={{ fontSize: '13px', color: C.text2, lineHeight: 1.6, margin: '0 0 12px' }}>
                Estamos rodando campanhas de performance no Meta e Google Ads com foco em geração de leads qualificados para o nicho <strong style={{ color: C.text1 }}>{portal.niche || 'do cliente'}</strong>. A estratégia prioriza CPL abaixo do benchmark de mercado com escalonamento progressivo de verba.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['Meta Ads', 'Google Ads', 'Funil TOFU→BOFU', 'Criativos A/B'].map(tag => (
                  <span key={tag} style={{
                    fontSize: '11px', padding: '3px 9px', borderRadius: '5px',
                    color: C.purpleL, background: 'rgba(124,58,237,0.08)',
                    border: '1px solid rgba(124,58,237,0.2)',
                  }}>{tag}</span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Next actions */}
        {portal.showActions && (
          <section style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: C.text3, letterSpacing: '0.1em', marginBottom: '12px', textTransform: 'uppercase' }}>
              Próximas ações
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                'Renovar criativos para a próxima semana',
                'Expandir audiências lookalike para escalar volume',
                'Otimizar landing page com base nos dados de CTR',
              ].map((action, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 14px', borderRadius: '10px',
                  background: C.surface, border: `1px solid ${C.border}`,
                }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                    background: C.purpleD, border: `1px solid rgba(124,58,237,0.2)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 700, color: C.purpleL,
                  }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: '13px', color: C.text2 }}>{action}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <div style={{
          borderTop: `1px solid ${C.border}`, paddingTop: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px',
        }}>
          <div style={{ fontSize: '11px', color: C.text3 }}>
            Este relatório foi gerado por <strong style={{ color: C.purpleL }}>{portal.agencyName}</strong> via ELYON
          </div>
          <div style={{
            fontSize: '10px', color: C.text3,
            display: 'flex', alignItems: 'center', gap: '5px',
          }}>
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

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const portal = await getPortal(params.slug)
  if (!portal) return { title: 'Portal não encontrado' }
  return {
    title: `${portal.clientName} — ${portal.agencyName}`,
    description: `Relatório de performance de campanha para ${portal.clientName}`,
  }
}
