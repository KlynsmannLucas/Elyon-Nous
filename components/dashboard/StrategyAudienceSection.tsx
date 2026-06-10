// components/dashboard/StrategyAudienceSection.tsx
// Bloco "Público-Alvo & Persona" da aba Estratégia. Híbrido e aditivo:
// usa dados REAIS do Meta (geo/demografia por CPL) quando existirem; senão
// cadastro; senão a recomendação da IA (strategy.target_audience). Persona é
// reusada do store e pode ser gerada na hora via /api/persona.
'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { getBenchmark } from '@/lib/niche_benchmarks'
import { SimpleSourceBadge } from './DataSourceBadge'
import type { ClientData } from '@/lib/store'

const C = {
  surface: '#0F1629', elevated: '#131E35', border: 'rgba(255,255,255,0.06)',
  purpleL: '#A78BFA', green: '#22C55E', gold: '#F59E0B', blue: '#38BDF8',
  text1: '#F1F5F9', text2: '#94A3B8', text3: 'rgba(255,255,255,0.4)',
}

const card: React.CSSProperties = { background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px' }
const subHeader: React.CSSProperties = { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.text3, marginBottom: 10 }

function genderLabel(g?: string): string {
  const x = (g || '').toLowerCase()
  if (x === 'male' || x === 'm' || x === 'masculino') return 'Masculino'
  if (x === 'female' || x === 'f' || x === 'feminino') return 'Feminino'
  return '—'
}

export default function StrategyAudienceSection({ strategy, clientData }: { strategy: Record<string, any>; clientData: ClientData | null }) {
  const { clientPersonas, generatedPersona, setGeneratedPersona, auditCache } = useAppStore()
  const [genLoading, setGenLoading] = useState(false)
  const [genError, setGenError] = useState('')

  const cacheKey = clientData?.clientName || ''
  const persona  = clientPersonas[cacheKey] ?? generatedPersona ?? null
  const bench    = clientData?.niche ? getBenchmark(clientData.niche) : null
  const ta       = strategy?.target_audience || null

  // Dados reais do Meta (geo/demografia) cacheados pela aba Meta Intelligence
  const intel = (auditCache[cacheKey] || []).map(e => e.audit?._intelligenceData).find(Boolean) as any
  const geo:  any[] = Array.isArray(intel?.geoBreakdown)  ? intel.geoBreakdown  : []
  const demo: any[] = Array.isArray(intel?.demoBreakdown) ? intel.demoBreakdown : []

  const topBy = (arr: any[]) => {
    const withLeads = arr.filter(x => (x.leads || 0) > 0).sort((a, b) => (a.cpl || 1e9) - (b.cpl || 1e9))
    return (withLeads.length ? withLeads : [...arr].sort((a, b) => (b.spend || 0) - (a.spend || 0))).slice(0, 3)
  }
  const topGeo  = topBy(geo)
  const topDemo = topBy(demo)

  const generatePersona = async () => {
    if (!clientData) return
    setGenError(''); setGenLoading(true)
    try {
      const res = await fetch('/api/persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientData, role: 'gestor' }),
      })
      const data = await res.json()
      if (!res.ok || !data.persona) throw new Error(data.error || 'Falha ao gerar persona.')
      setGeneratedPersona({ ...data.persona, role: 'gestor', generatedAt: new Date().toISOString() })
    } catch (e: any) {
      setGenError(e.message || 'Não foi possível gerar a persona.')
    } finally {
      setGenLoading(false)
    }
  }

  const snap = ta?.persona_snapshot
  const hasAnything = persona || snap || clientData

  if (!hasAnything) return null

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: 'rgba(167,139,250,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🎯</div>
        <div>
          <div style={{ fontSize: 10, color: C.purpleL, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Público-Alvo &amp; Persona</div>
          <div style={{ fontSize: 12, color: C.text2 }}>Quem mirar, onde e com qual mensagem</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>

        {/* ── Persona resumida ── */}
        <div style={{ ...card, gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
            <span style={subHeader}>Persona</span>
            {persona
              ? <SimpleSourceBadge type="estimated" tooltip="Persona gerada por IA a partir do cadastro." />
              : snap ? <SimpleSourceBadge type="fallback" /> : null}
          </div>

          {(persona || snap) ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.text1 }}>{persona?.name || snap?.name}</span>
                <span style={{ fontSize: 12, color: C.text2 }}>
                  {(persona?.age || snap?.age) && `${persona?.age || snap?.age}`}
                  {(persona?.profession || snap?.profile) && ` · ${persona?.profession || snap?.profile}`}
                  {persona?.income && ` · ${persona.income}`}
                </span>
              </div>
              {snap?.one_liner && !persona && <p style={{ fontSize: 12, color: C.text2, margin: '0 0 8px', lineHeight: 1.6 }}>{snap.one_liner}</p>}
              {persona && persona.pains && persona.pains.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: C.text3 }}>Principais dores: </span>
                  <span style={{ fontSize: 12, color: C.text2 }}>{persona.pains.slice(0, 3).join(' · ')}</span>
                </div>
              )}
              {persona && persona.favoriteChannels && persona.favoriteChannels.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {persona.favoriteChannels.slice(0, 5).map((ch: string, i: number) => (
                    <span key={i} style={{ fontSize: 10, color: C.purpleL, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.22)', borderRadius: 6, padding: '2px 7px' }}>{ch}</span>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 12 }}>
                <button onClick={generatePersona} disabled={genLoading} style={ghostBtn}>{genLoading ? '⏳ Gerando…' : '↻ Atualizar persona'}</button>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 12, color: C.text2, margin: '0 0 12px', lineHeight: 1.6 }}>
                Gere uma persona detalhada (idade, dores, canais e interesses) a partir do cadastro do cliente.
              </p>
              <button onClick={generatePersona} disabled={genLoading} style={primaryBtn}>{genLoading ? '⏳ Gerando…' : '✨ Gerar persona'}</button>
            </div>
          )}
          {genError && <div style={{ marginTop: 8, fontSize: 11, color: '#EF4444' }}>{genError}</div>}
        </div>

        {/* ── Demografia ── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={subHeader}>Idade · Gênero · Renda</span>
            {topDemo.length > 0 ? <SimpleSourceBadge type="real" /> : (clientData?.targetAge || clientData?.targetGender) ? <SimpleSourceBadge type="estimated" tooltip="Do cadastro do cliente." /> : ta?.demographics ? <SimpleSourceBadge type="fallback" /> : null}
          </div>
          {topDemo.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topDemo.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 12, color: C.text1 }}>{d.age} · {genderLabel(d.gender)}</span>
                  <span style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>CPL R${Math.round(d.cpl || 0)}</span>
                </div>
              ))}
              <span style={{ fontSize: 10, color: C.text3 }}>Coortes com melhor custo por lead (dados reais).</span>
            </div>
          ) : (clientData?.targetAge || clientData?.targetGender || clientData?.targetIncome) ? (
            <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.8 }}>
              {clientData?.targetAge && <div>Idade: <strong style={{ color: C.text1 }}>{clientData.targetAge}</strong></div>}
              {clientData?.targetGender && <div>Gênero: <strong style={{ color: C.text1 }}>{clientData.targetGender}</strong></div>}
              {clientData?.targetIncome && <div>Renda: <strong style={{ color: C.text1 }}>{clientData.targetIncome}</strong></div>}
            </div>
          ) : ta?.demographics ? (
            <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.8 }}>
              {ta.demographics.age_range && <div>Idade: <strong style={{ color: C.text1 }}>{ta.demographics.age_range}</strong></div>}
              {ta.demographics.gender && <div>Gênero: <strong style={{ color: C.text1 }}>{ta.demographics.gender}</strong></div>}
              {ta.demographics.income_range && <div>Renda: <strong style={{ color: C.text1 }}>{ta.demographics.income_range}</strong></div>}
            </div>
          ) : <span style={{ fontSize: 11, color: C.text3 }}>Sem dados de demografia.</span>}
        </div>

        {/* ── Melhores regiões ── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={subHeader}>Melhores regiões</span>
            {topGeo.length > 0 ? <SimpleSourceBadge type="real" /> : ta?.best_regions?.length ? <SimpleSourceBadge type="fallback" /> : clientData?.city ? <SimpleSourceBadge type="estimated" tooltip="Do cadastro do cliente." /> : null}
          </div>
          {topGeo.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topGeo.map((g, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 12, color: C.text1 }}>{g.region}</span>
                  <span style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>CPL R${Math.round(g.cpl || 0)} · {g.leads || 0} leads</span>
                </div>
              ))}
              <span style={{ fontSize: 10, color: C.text3 }}>Regiões com melhor custo por lead (dados reais).</span>
            </div>
          ) : ta?.best_regions?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ta.best_regions.slice(0, 3).map((r: any, i: number) => (
                <div key={i}>
                  <div style={{ fontSize: 12, color: C.text1, fontWeight: 600 }}>{r.region}</div>
                  {r.why && <div style={{ fontSize: 11, color: C.text2, lineHeight: 1.5 }}>{r.why}</div>}
                </div>
              ))}
            </div>
          ) : clientData?.city ? (
            <div style={{ fontSize: 12, color: C.text2 }}>Região de atuação: <strong style={{ color: C.text1 }}>{clientData.city}</strong></div>
          ) : <span style={{ fontSize: 11, color: C.text3 }}>Sem dados de região.</span>}
        </div>

        {/* ── Canais, interesses & sazonalidade ── */}
        <div style={{ ...card, gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
            <span style={subHeader}>Canais, interesses &amp; sazonalidade</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div>
              <div style={{ fontSize: 10, color: C.text3, marginBottom: 6 }}>Canais prioritários</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(ta?.channel_focus?.length ? ta.channel_focus : (bench?.best_channels?.slice(0, 3) || persona?.favoriteChannels?.slice(0, 3) || [])).map((c: string, i: number) => (
                  <span key={i} style={chip(C.blue)}>{c}</span>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.text3, marginBottom: 6 }}>Interesses / segmentação</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {((persona?.facebookInterests?.length ? persona.facebookInterests.slice(0, 6) : ta?.interests?.slice(0, 6)) || []).map((it: string, i: number) => (
                  <span key={i} style={chip(C.purpleL)}>{it}</span>
                ))}
                {!persona?.facebookInterests?.length && !ta?.interests?.length && <span style={{ fontSize: 11, color: C.text3 }}>—</span>}
              </div>
            </div>
            {bench?.seasonality?.length ? (
              <div>
                <div style={{ fontSize: 10, color: C.text3, marginBottom: 6 }}>Picos de demanda</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {bench.seasonality.map((m: string, i: number) => (<span key={i} style={chip(C.gold)}>{m}</span>))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

const chip = (color: string): React.CSSProperties => ({
  fontSize: 10, color, background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 6, padding: '3px 8px',
})
const primaryBtn: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
  background: 'linear-gradient(135deg,#7C3AED,#A78BFA)', border: 'none', color: '#fff',
}
const ghostBtn: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, padding: '6px 12px', borderRadius: 7, cursor: 'pointer',
  background: 'transparent', border: '1px solid rgba(167,139,250,0.3)', color: '#A78BFA',
}
