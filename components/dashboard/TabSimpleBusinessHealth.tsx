// components/dashboard/TabSimpleBusinessHealth.tsx — Saúde do Negócio (Modo Simplificado)
// Calcula a saúde do negócio client-side a partir do clientData + auditoria (sem chamada de IA).
// A versão técnica (TabDiagnostic, com LTV:CAC, ROAS break-even, matriz de risco) fica intacta no avançado.
'use client'

import { useAppStore } from '@/lib/store'
import { askAIWithContext } from '@/lib/askAI'
import { isUsingSimpleDemoData, getDemoClientFields, getDemoRealMetrics } from '@/lib/simpleDemoData'
import { getCurrentNicheFromOnboarding } from '@/lib/nicheConfigs'
import { DemoDataButton } from './DemoDataButton'
import type { ClientData } from '@/lib/store'
import type { TabKey } from './DashboardSidebar'

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

interface Props {
  clientData: ClientData | null
  onNavigate?: (tab: TabKey) => void
}

const C = {
  surface:  '#0C1426',
  border:   'rgba(255,255,255,0.06)',
  purpleHi: '#A78BFA',
  purpleBg: 'rgba(124,58,237,0.08)',
  green:    '#22C55E',
  greenBg:  'rgba(34,197,94,0.07)',
  amber:    '#F59E0B',
  amberBg:  'rgba(245,158,11,0.07)',
  red:      '#EF4444',
  redBg:    'rgba(239,68,68,0.07)',
  text1:    '#F1F5F9',
  text2:    '#94A3B8',
  text3:    'rgba(255,255,255,0.32)',
}

type Sig = 'bom' | 'atencao' | 'critico' | 'sem_dado'
const SIG = {
  bom:      { icon: '🟢', color: C.green },
  atencao:  { icon: '🟡', color: C.amber },
  critico:  { icon: '🔴', color: C.red },
  sem_dado: { icon: '⚪', color: C.text3 },
}

function fmt(n: number) {
  if (!n) return 'R$0'
  if (n >= 1_000_000) return `R$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000)      return `R$${(n / 1000).toFixed(1)}k`
  return `R$${Math.round(n).toLocaleString('pt-BR')}`
}

function askNous(question: string) {
  askAIWithContext({ source: 'saude-negocio', title: 'Saúde do Negócio', suggestedPrompt: question })
}

// ── Linha de indicador ────────────────────────────────────────────────────────
function IndicatorRow({ icon, label, value, sig, phrase }: {
  icon: string; label: string; value: string; sig: Sig; phrase: string
}) {
  const s = SIG[sig]
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', borderRadius: '12px', background: C.surface, border: `1px solid ${C.border}` }}>
      <span style={{ fontSize: '18px', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', marginBottom: '2px' }}>
          <span style={{ fontSize: '12px', color: C.text3 }}>{label}</span>
          <span style={{ fontSize: '15px', fontWeight: 800, color: s.color }}>{value}</span>
        </div>
        <div style={{ fontSize: '11px', color: C.text2, lineHeight: 1.5 }}>{phrase}</div>
      </div>
      <span style={{ fontSize: '13px', flexShrink: 0 }}>{s.icon}</span>
    </div>
  )
}

export function TabSimpleBusinessHealth({ clientData, onNavigate }: Props) {
  const auditCache = useAppStore(s => s.auditCache)

  if (!clientData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: C.text3, fontSize: '13px' }}>
        Configure um cliente para ver a saúde do negócio.
      </div>
    )
  }

  // ── Entradas (com fallback para dados de exemplo) ───────────────────────────
  const key   = clientData.clientName
  const hist  = auditCache[key]
  const audit = Array.isArray(hist) ? hist[0]?.audit : (hist as any)?.audit ?? hist
  const demo  = isUsingSimpleDemoData()
  const df    = demo ? getDemoClientFields() : null
  const rm    = (audit?._realMetrics as any) || (demo ? getDemoRealMetrics() : null)

  const budget   = clientData.budget || df?.budget || 0
  const ticket   = clientData.ticketPrice || df?.ticketPrice || 0
  const margin   = clientData.grossMargin || df?.grossMargin || 0          // %
  const cvr      = clientData.conversionRate || df?.conversionRate || 0    // % lead→venda
  const cpl      = rm?.avgCPL || clientData.currentCPL || 0
  const roasReal = rm?.avgROAS || null
  const realLeads = rm?.totalLeads || 0
  const realSpend = rm?.totalSpend || 0

  // ── Unit economics (fórmulas padrão) ────────────────────────────────────────
  const marginPerSale = ticket > 0 && margin > 0 ? ticket * (margin / 100) : null   // lucro bruto por venda
  const cac           = cpl > 0 && cvr > 0 ? cpl / (cvr / 100) : null                // custo por venda
  const breakEvenRoas = margin > 0 ? 1 / (margin / 100) : null
  const estSales      = realLeads > 0 && cvr > 0 ? Math.round(realLeads * (cvr / 100)) : null

  // ── Sinais por indicador ─────────────────────────────────────────────────────
  // Vendas
  const vendasSig: Sig = estSales == null && realSpend === 0 ? 'sem_dado'
    : (estSales && estSales > 0) || (rm?.totalRevenue > 0) ? 'bom'
    : 'atencao'
  const niche = getCurrentNicheFromOnboarding()
  const saleName = niche.language.saleName       // ex: "contrato fechado"
  const salePlural = saleName.endsWith('o') ? saleName + 's' : saleName + 's'
  const vendasVal = estSales != null ? `~${estSales}/mês` : realSpend > 0 ? `${realLeads} contatos` : '—'
  const vendasPhrase = vendasSig === 'bom' ? `Seu marketing está gerando ${salePlural}.`
    : vendasSig === 'atencao' ? `Você gera contatos, mas faltam dados de ${salePlural} para confirmar o resultado.`
    : `Ainda não temos dados de ${salePlural} para avaliar.`

  // Investimento
  const investSig: Sig = budget > 0 ? 'bom' : 'sem_dado'
  const investPhrase = budget > 0 ? 'Orçamento de marketing definido e em uso.' : 'Defina seu orçamento mensal de anúncios.'

  // Conversão (lead → venda)
  const convSig: Sig = cvr === 0 ? 'sem_dado' : cvr >= 10 ? 'bom' : cvr >= 5 ? 'atencao' : 'critico'
  const convPhrase = cvr === 0 ? 'Informe quantos contatos viram clientes para avaliar.'
    : cvr >= 10 ? 'Boa parte dos seus contatos vira cliente.'
    : 'Muitos contatos ainda não estão virando clientes — vale revisar atendimento e oferta.'

  // Custo de aquisição (CAC) vs margem por venda
  const cacSig: Sig = cac == null || marginPerSale == null ? 'sem_dado'
    : cac <= marginPerSale * 0.4 ? 'bom'
    : cac <= marginPerSale ? 'atencao'
    : 'critico'
  const cacPhrase = cac == null || marginPerSale == null ? 'Faltam dados de custo ou margem para calcular.'
    : cacSig === 'bom' ? `Cada cliente custa ${fmt(cac)} e ainda sobra bom lucro depois.`
    : cacSig === 'atencao' ? `Cada cliente custa ${fmt(cac)} — perto do limite do que sua margem permite.`
    : `Cada cliente custa ${fmt(cac)}, mais do que o lucro por venda. Você pode estar no prejuízo.`

  // Margem / Lucro
  const marginSig: Sig = margin === 0 ? 'sem_dado' : margin >= 40 ? 'bom' : margin >= 20 ? 'atencao' : 'critico'
  const marginPhrase = margin === 0 ? 'Informe sua margem de lucro para avaliar a saúde financeira.'
    : marginSig === 'bom' ? `Você lucra cerca de ${margin}% em cada venda — boa folga para investir.`
    : marginSig === 'atencao' ? `Margem de ${margin}% — dá pra crescer, mas com cuidado no custo de aquisição.`
    : `Margem de ${margin}% é apertada — sobra pouco depois dos custos.`

  // Crescimento / Escala
  const canScale = (roasReal != null && breakEvenRoas != null && roasReal >= breakEvenRoas) || (cacSig === 'bom')
  const scaleSig: Sig = roasReal == null && cac == null ? 'sem_dado' : canScale ? 'bom' : cacSig === 'critico' ? 'critico' : 'atencao'
  const scalePhrase = scaleSig === 'sem_dado' ? 'Precisamos de mais dados para avaliar se dá pra escalar.'
    : canScale ? 'Há margem para aumentar o investimento com segurança.'
    : scaleSig === 'critico' ? 'Antes de escalar, corrija o custo de aquisição — escalar agora aumentaria o prejuízo.'
    : 'Dá pra escalar aos poucos, monitorando o custo por venda de perto.'

  const indicators = [
    { icon: '🛒', label: cap(salePlural),       value: vendasVal,                          sig: vendasSig, phrase: vendasPhrase },
    { icon: '💰', label: 'Investimento',        value: budget > 0 ? fmt(budget) + '/mês' : '—', sig: investSig, phrase: investPhrase },
    { icon: '🔄', label: 'Conversão',           value: cvr > 0 ? `${cvr}%` : '—',          sig: convSig,   phrase: convPhrase },
    { icon: '🏷️', label: 'Custo por cliente',   value: cac != null ? fmt(cac) : '—',       sig: cacSig,    phrase: cacPhrase },
    { icon: '📊', label: 'Margem / Lucro',      value: margin > 0 ? `${margin}%` : '—',    sig: marginSig, phrase: marginPhrase },
    { icon: '📈', label: 'Crescimento',         value: canScale ? 'Pode escalar' : scaleSig === 'critico' ? 'Risco' : 'Cautela', sig: scaleSig, phrase: scalePhrase },
  ]

  // ── Status geral (pior sinal entre os que têm dado) ──────────────────────────
  const realSigs = indicators.map(i => i.sig).filter(s => s !== 'sem_dado') as Exclude<Sig, 'sem_dado'>[]
  const noData = realSigs.length < 2 || (margin === 0 && cvr === 0 && cpl === 0)

  const overall = realSigs.includes('critico') ? 'critico' : realSigs.includes('atencao') ? 'atencao' : 'bom'
  const overallCfg = {
    bom:     { icon: '🟢', color: C.green, headline: 'Seu negócio está saudável' },
    atencao: { icon: '🟡', color: C.amber, headline: 'Seu negócio está vendendo, mas exige atenção' },
    critico: { icon: '🔴', color: C.red,   headline: 'Seu negócio precisa de ajustes antes de crescer' },
  }[overall]

  // ── Maior risco ───────────────────────────────────────────────────────────────
  const risk =
    vendasSig === 'atencao' && !estSales
      ? { title: 'Faltam dados de vendas', text: 'Você ainda não tem vendas registradas suficientes para validar a estratégia. Acompanhe e registre os resultados.' }
    : cacSig === 'critico'
      ? { title: 'Custo de aquisição alto', text: 'Você está pagando caro para conquistar cada cliente — mais do que o lucro de cada venda. Isso precisa ser corrigido antes de investir mais.' }
    : convSig === 'critico'
      ? { title: 'Conversão baixa', text: 'Você gera contatos, mas poucos viram clientes. O gargalo costuma estar no atendimento, na oferta ou no perfil do público.' }
    : marginSig === 'critico'
      ? { title: 'Margem apertada', text: 'Mesmo vendendo, pode estar sobrando pouco lucro. Vale revisar preço, custos ou ticket médio antes de escalar.' }
    : { title: 'Sem riscos críticos no momento', text: 'Seus indicadores principais estão dentro do esperado. Continue acompanhando e cresça com segurança.' }

  // ── Prioridade principal (frase do card) ──────────────────────────────────────
  const priority = cacSig === 'critico'
    ? 'Sua prioridade hoje é baixar o custo de aquisição antes de aumentar o investimento.'
    : convSig === 'critico' || convSig === 'atencao'
    ? 'Sua prioridade hoje é transformar mais contatos em vendas.'
    : marginSig === 'critico'
    ? 'Antes de escalar, garanta que sobra margem depois de todos os custos.'
    : canScale
    ? 'Você tem espaço para crescer com segurança — foque em escalar o que funciona.'
    : 'Continue acompanhando os números e mantenha o que está funcionando.'

  // ── Recomendações (máx 3) ──────────────────────────────────────────────────────
  const recs: { title: string; desc: string; q: string }[] = []
  if (cacSig === 'critico' || cacSig === 'atencao') recs.push({ title: 'Reduzir o custo por cliente', desc: 'Melhore os anúncios e o público para conseguir contatos mais baratos e qualificados.', q: 'Como reduzir meu custo por cliente?' })
  if (convSig === 'critico' || convSig === 'atencao') recs.push({ title: 'Aumentar a conversão de contatos em vendas', desc: 'Responda mais rápido, melhore a oferta e estruture o follow-up comercial.', q: 'Como converter mais contatos em vendas?' })
  if (marginSig === 'critico') recs.push({ title: 'Revisar preço e margem', desc: 'Avalie ticket médio, custos e precificação para garantir lucro após os gastos.', q: 'Minha margem está saudável para escalar?' })
  if (canScale && recs.length < 3) recs.push({ title: 'Escalar com segurança', desc: 'Aumente o orçamento aos poucos (15–20%) nas campanhas que trazem clientes baratos.', q: 'Quanto posso aumentar de orçamento com segurança?' })
  if (recs.length === 0) recs.push({ title: 'Continuar acompanhando', desc: 'Mantenha o ritmo e registre os resultados para um diagnóstico cada vez mais preciso.', q: 'Como está a saúde do meu negócio?' })
  const recs3 = recs.slice(0, 3)

  // ── Estado vazio ────────────────────────────────────────────────────────────
  if (noData) {
    const missing = [
      !ticket && 'Ticket médio (quanto vale cada venda)',
      !margin && 'Margem de lucro (% que sobra por venda)',
      !cvr && 'Taxa de conversão (quantos contatos viram clientes)',
      !budget && 'Orçamento mensal de anúncios',
    ].filter(Boolean) as string[]
    return (
      <div style={{ maxWidth: '640px' }}>
        <div style={{ padding: '32px 28px', borderRadius: '16px', background: C.surface, border: `1px solid ${C.border}`, textAlign: 'center' as const }}>
          <div style={{ fontSize: '40px', marginBottom: '14px' }}>🩺</div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.text1, margin: '0 0 8px' }}>Ainda não dá para avaliar a saúde do negócio</h2>
          <p style={{ fontSize: '13px', color: C.text2, lineHeight: 1.6, margin: '0 0 18px' }}>
            Faltam alguns números importantes para entender se o seu negócio está saudável:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' as const, maxWidth: '340px', margin: '0 auto 20px' }}>
            {missing.map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: C.text2 }}>
                <span style={{ color: C.purpleHi }}>○</span>{t}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' as const }}>
            <button onClick={() => onNavigate?.('overview')} style={{ padding: '10px 18px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #7C3AED, #A78BFA)' }}>
              Preencher meus números →
            </button>
            <button onClick={() => askNous('Quais números preciso para avaliar a saúde do meu negócio?')} style={{ padding: '10px 18px', borderRadius: '9px', fontSize: '13px', fontWeight: 600, color: C.purpleHi, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,58,237,0.25)', cursor: 'pointer' }}>
              💬 Perguntar para a IA
            </button>
            <DemoDataButton />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* 1 — Card principal de status */}
      <div style={{ padding: '20px 22px', borderRadius: '16px', background: `${overallCfg.color}0d`, border: `1px solid ${overallCfg.color}33` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ fontSize: '18px' }}>{overallCfg.icon}</span>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: overallCfg.color, margin: 0, letterSpacing: '-0.01em' }}>{overallCfg.headline}</h2>
        </div>
        <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: 1.65, margin: 0 }}>{priority}</p>
      </div>

      {/* 2 — Indicadores em linguagem simples */}
      <div>
        <div style={{ fontSize: '10px', fontWeight: 700, color: C.text3, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '10px' }}>
          Os sinais do seu negócio
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
          {indicators.map((ind) => (
            <IndicatorRow key={ind.label} {...ind} />
          ))}
        </div>
      </div>

      {/* 3 — Maior risco agora */}
      <div style={{ padding: '18px 20px', borderRadius: '14px', background: risk.title.startsWith('Sem riscos') ? C.greenBg : C.redBg, border: `1px solid ${risk.title.startsWith('Sem riscos') ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontSize: '16px' }}>{risk.title.startsWith('Sem riscos') ? '✅' : '⚠️'}</span>
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: C.text1, margin: 0 }}>Maior risco agora</h3>
        </div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: risk.title.startsWith('Sem riscos') ? C.green : C.red, marginBottom: '4px' }}>{risk.title}</div>
        <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: 1.65, margin: 0 }}>{risk.text}</p>
      </div>

      {/* 4 — Recomendações práticas */}
      <div>
        <div style={{ fontSize: '10px', fontWeight: 700, color: C.text3, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '10px' }}>
          O que fazer agora
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {recs3.map((r, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRadius: '12px', background: C.surface, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: C.text1, marginBottom: '3px' }}>{r.title}</div>
              <p style={{ fontSize: '12px', color: C.text2, lineHeight: 1.55, margin: '0 0 10px' }}>{r.desc}</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                <button onClick={() => onNavigate?.('acoes')} style={{ fontSize: '11px', fontWeight: 700, padding: '6px 12px', borderRadius: '7px', cursor: 'pointer', border: 'none', color: '#fff', background: 'linear-gradient(135deg, #7C3AED, #A78BFA)' }}>
                  Ver o que fazer →
                </button>
                <button onClick={() => askNous(r.q)} style={{ fontSize: '11px', fontWeight: 600, padding: '6px 12px', borderRadius: '7px', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,58,237,0.25)', color: C.purpleHi }}>
                  💬 Perguntar para a IA
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rodapé: versão técnica */}
      <div style={{ padding: '12px 16px', borderRadius: '10px', background: C.purpleBg, border: '1px solid rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <span style={{ fontSize: '11px', color: C.text3 }}>Quer ver a análise financeira completa (LTV:CAC, ROAS break-even, cenários)?</span>
        <button onClick={() => useAppStore.getState().setDashboardMode('pro')} style={{ flexShrink: 0, fontSize: '11px', fontWeight: 700, color: C.purpleHi, background: 'none', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '7px', padding: '5px 12px', cursor: 'pointer' }}>
          Modo Avançado ⚙
        </button>
      </div>
    </div>
  )
}
