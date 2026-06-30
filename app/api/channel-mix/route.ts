// app/api/channel-mix/route.ts — Channel Mix Agent (AGENT.md)
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getBenchmark } from '@/lib/niche_benchmarks'
import { sanitizeText } from '@/lib/sanitize'
import { safeExtractJson } from '@/lib/aiJson'

export type Channel =
  | 'meta'
  | 'google_search'
  | 'google_display'
  | 'youtube'
  | 'tiktok'
  | 'linkedin'
  | 'pinterest'
  | 'email'

export interface ChannelRecommendation {
  channel: Channel
  name: string
  icon: string
  allocationPct: number       // % do budget total
  allocationBRL: number       // R$ por mês
  priority: 'primary' | 'secondary' | 'test' | 'avoid'
  fit: number                 // 0-100 — fit com nicho/objetivo
  expectedCPL: number | null
  expectedROAS: number | null
  expectedLeadsPerMonth: number | null
  strengths: string[]
  weaknesses: string[]
  bestFor: string             // ex: "público frio de topo de funil"
  setup: string               // ex: "Campanha de leads com formulário nativo"
  minBudget: number           // orçamento mínimo para ser eficiente neste canal (R$/mês)
  timeToResults: string       // ex: "7-14 dias"
}

export interface ChannelMixResult {
  recommendedChannels: ChannelRecommendation[]
  avoidChannels: ChannelRecommendation[]
  totalBudget: number
  strategy: string
  primaryChannel: string
  diversificationScore: number   // 0-100 (100 = mix diversificado)
  maturityNote: string
  projectedTotalLeads: number
  projectedAvgCPL: number
}

const CHANNEL_META: Record<Channel, { name: string; icon: string; minBudget: number }> = {
  meta:           { name: 'Meta Ads',        icon: '📘', minBudget: 1500 },
  google_search:  { name: 'Google Search',   icon: '🔍', minBudget: 2000 },
  google_display: { name: 'Google Display',  icon: '🖼️', minBudget: 1000 },
  youtube:        { name: 'YouTube Ads',     icon: '▶️', minBudget: 3000 },
  tiktok:         { name: 'TikTok Ads',      icon: '🎵', minBudget: 1500 },
  linkedin:       { name: 'LinkedIn Ads',    icon: '💼', minBudget: 4000 },
  pinterest:      { name: 'Pinterest Ads',   icon: '📌', minBudget: 1000 },
  email:          { name: 'E-mail Marketing',icon: '📧', minBudget: 200 },
}

// Scores de fit por nicho e canal (0-10)
const NICHE_CHANNEL_FIT: Record<string, Partial<Record<Channel, number>>> = {
  odonto:     { meta: 9, google_search: 8, youtube: 6, tiktok: 5, google_display: 5 },
  saude:      { meta: 8, google_search: 9, youtube: 6, tiktok: 4, google_display: 5 },
  financeiro: { meta: 8, google_search: 9, youtube: 7, linkedin: 7, google_display: 5 },
  imobiliario:{ meta: 9, google_search: 8, youtube: 7, tiktok: 6, google_display: 6 },
  fitness:    { meta: 9, tiktok: 9, youtube: 8, google_search: 6 },
  beleza:     { meta: 9, tiktok: 9, pinterest: 7, youtube: 7 },
  educacao:   { meta: 8, google_search: 8, youtube: 8, tiktok: 6, linkedin: 5 },
  juridico:   { meta: 7, google_search: 9, linkedin: 7, youtube: 5, google_display: 5 },
  tech:       { meta: 7, google_search: 8, linkedin: 9, youtube: 7, email: 8 },
  ecommerce:  { meta: 9, google_display: 8, youtube: 7, tiktok: 7, email: 9 },
  restaurante:{ meta: 9, google_search: 8, tiktok: 7, google_display: 6 },
  marketing:  { meta: 8, google_search: 7, linkedin: 9, youtube: 7, email: 8 },
  default:    { meta: 9, google_search: 7, youtube: 6, tiktok: 5, google_display: 5 },
}

function getNicheKey(niche: string): string {
  const n = niche.toLowerCase()
  if (n.includes('odonto') || n.includes('dental') || n.includes('dent')) return 'odonto'
  if (n.includes('saúde') || n.includes('saude') || n.includes('clínica') || n.includes('médic')) return 'saude'
  if (n.includes('financ') || n.includes('crédito') || n.includes('invest') || n.includes('seguro')) return 'financeiro'
  if (n.includes('imobil') || n.includes('imóvel') || n.includes('corretor')) return 'imobiliario'
  if (n.includes('fitness') || n.includes('academia') || n.includes('nutri') || n.includes('personal')) return 'fitness'
  if (n.includes('beleza') || n.includes('estét') || n.includes('salão') || n.includes('cosmet')) return 'beleza'
  if (n.includes('educ') || n.includes('curso') || n.includes('escola') || n.includes('treina')) return 'educacao'
  if (n.includes('juríd') || n.includes('advoc') || n.includes('advocacia') || n.includes('direito')) return 'juridico'
  if (n.includes('tech') || n.includes('saas') || n.includes('software') || n.includes('startup')) return 'tech'
  if (n.includes('ecommer') || n.includes('loja') || n.includes('varejo') || n.includes('produto')) return 'ecommerce'
  if (n.includes('restaur') || n.includes('food') || n.includes('gastr')) return 'restaurante'
  if (n.includes('market') || n.includes('agência') || n.includes('agencia')) return 'marketing'
  return 'default'
}

function buildChannelMix(
  niche: string,
  budget: number,
  objective: string,
  clientData: any,
  realMetrics: any,
): ChannelMixResult {
  const bench = getBenchmark(niche)
  const benchCPL = bench ? (bench.cpl_min + bench.cpl_max) / 2 : 60
  const nicheKey = getNicheKey(niche)
  const fitMap = NICHE_CHANNEL_FIT[nicheKey] ?? NICHE_CHANNEL_FIT.default

  const isLowBudget  = budget < 3000
  const isMidBudget  = budget >= 3000 && budget < 10000
  const isHighBudget = budget >= 10000

  const isLeadObj    = /lead|capta|contact/i.test(objective)
  const isSalesObj   = /venda|compra|receita|revenue/i.test(objective)
  const isBrandObj   = /brand|marca|awareness|alcance/i.test(objective)

  // Determina canais elegíveis pelo budget
  const eligible: Channel[] = ['meta', 'google_search']
  if (!isLowBudget) eligible.push('google_display', 'tiktok', 'youtube')
  if (isHighBudget) eligible.push('linkedin', 'pinterest', 'email')

  // Calcula fit score para cada canal elegível
  const scored = eligible.map(ch => {
    const baseFit = (fitMap[ch] ?? 5) * 10 // 0-100
    const meta = CHANNEL_META[ch]

    let fit = baseFit
    // Penaliza canais abaixo do mínimo de budget
    if (budget < meta.minBudget) fit -= 25
    // Bonus por objetivo
    if (ch === 'google_search' && isLeadObj) fit += 8
    if (ch === 'meta' && (isLeadObj || isBrandObj)) fit += 5
    if (ch === 'linkedin' && (nicheKey === 'tech' || nicheKey === 'marketing')) fit += 10
    if (ch === 'tiktok' && (nicheKey === 'fitness' || nicheKey === 'beleza')) fit += 10
    if (ch === 'youtube' && isBrandObj) fit += 8

    fit = Math.max(0, Math.min(100, fit))

    return { channel: ch, fit, meta }
  }).sort((a, b) => b.fit - a.fit)

  // Top 3 recomendados, resto é avoid se fit < 30
  const recommended = scored.filter(s => s.fit >= 30)
  const avoided     = scored.filter(s => s.fit < 30)

  // Distribui budget entre recomendados
  const totalFit = recommended.reduce((s, r) => s + r.fit, 0)

  const buildRec = (s: typeof scored[0], allocationPct: number): ChannelRecommendation => {
    const allocationBRL = Math.round(budget * allocationPct / 100)
    const ch = s.channel
    const isEfficient = allocationBRL >= s.meta.minBudget

    const cplFactor: Record<Channel, number> = {
      meta:           1.0,
      google_search:  0.9,
      google_display: 1.3,
      youtube:        1.4,
      tiktok:         0.95,
      linkedin:       2.0,
      pinterest:      1.2,
      email:          0.3,
    }
    const expectedCPL = isEfficient ? Math.round(benchCPL * cplFactor[ch]) : null
    const expectedLeads = (expectedCPL && expectedCPL > 0) ? Math.round(allocationBRL / expectedCPL) : null

    const strengths: Record<Channel, string[]> = {
      meta: ['Maior escala de audiência do Brasil', 'Lookalike audiences poderosos', 'Criativos em vídeo e imagem', 'Retargeting preciso'],
      google_search: ['Captura intenção de compra ativa', 'CPL previsível e consistente', 'Alta qualidade de lead', 'Fácil mensurar ROI'],
      google_display: ['Grande alcance a custo baixo', 'Bom para retargeting', 'Reforça marca após clique'],
      youtube: ['Storytelling em vídeo', 'Awareness de alta qualidade', 'TrueView só cobra por view completo'],
      tiktok: ['CPM mais barato', 'Alta taxa de engajamento', 'Viral orgânico possível', 'Público jovem (18-35)'],
      linkedin: ['Segmentação B2B precisa (cargo, empresa)', 'Leads de alta qualidade para B2B', 'Ideal para tickets altos'],
      pinterest: ['Público com alta intenção de compra', 'Bom para produtos visuais', 'Tráfego de qualidade em nichos'],
      email: ['CAC mais baixo de todos os canais', 'Relação direta com lead', 'Alta conversão para base quente'],
    }

    const weaknesses: Record<Channel, string[]> = {
      meta: ['Custo crescendo ano a ano', 'Qualidade do lead pode variar', 'Frequência satura públicos pequenos'],
      google_search: ['Volume limitado por busca', 'Keywords competitivas caras', 'Setup mais complexo'],
      google_display: ['CTR muito baixo (0.1-0.3%)', 'Leads menos qualificados', 'Fraude de cliques'],
      youtube: ['Requer vídeo de qualidade', 'Resultados mais lentos', 'Difícil atribuição direta'],
      tiktok: ['Público mais jovem', 'Criativos saturam rápido', 'Menor poder de compra médio'],
      linkedin: ['CPM 5-10x mais caro que Meta', 'Volume menor de leads', 'Pouco eficiente para B2C'],
      pinterest: ['Nicho muito específico', 'Volume baixo no Brasil', 'Pouco suporte local'],
      email: ['Requer lista de contatos', 'Baixo para aquisição fria', 'LGPD — cuidado com compra de lista'],
    }

    const bestFor: Record<Channel, string> = {
      meta: 'Público frio de topo de funil e retargeting de visitantes',
      google_search: 'Capturar leads que já pesquisam ativamente sua solução',
      google_display: 'Retargeting e reforço de marca pós-visita',
      youtube: 'Construção de autoridade e awareness de topo de funil',
      tiktok: 'Público jovem (18-35) com criativos de entretenimento',
      linkedin: 'Decisores e empresas B2B com tickets acima de R$5.000',
      pinterest: 'Produtos de decoração, moda, casamento e lifestyle',
      email: 'Nutrição e reativação de leads já captados',
    }

    const setup: Record<Channel, string> = {
      meta: 'Campanha de Leads (objetivo Conversão) com formulário nativo ou LP',
      google_search: 'Campanha de Pesquisa com palavras-chave de intenção de compra + extensões de chamada',
      google_display: 'Campanha de Display com listas de remarketing (visitaram LP há 7-30 dias)',
      youtube: 'Campanha TrueView In-Stream com vídeo de 15-60s + CTA para LP',
      tiktok: 'Campanha de Leads com vídeo nativo de 15-30s no formato vertical',
      linkedin: 'Campanha de Lead Gen Form com oferta de valor (ebook, demo, diagnóstico)',
      pinterest: 'Campanha de conversão com Promoted Pins de produto/serviço visual',
      email: 'Sequência de e-mails de nutrição (3-7 mensagens nos primeiros 14 dias)',
    }

    const timeToResults: Record<Channel, string> = {
      meta: '7-14 dias',
      google_search: '14-21 dias',
      google_display: '14-30 dias',
      youtube: '30-60 dias',
      tiktok: '7-14 dias',
      linkedin: '14-30 dias',
      pinterest: '21-45 dias',
      email: '3-7 dias',
    }

    const priority: ChannelRecommendation['priority'] =
      s.fit >= 80 ? 'primary' :
      s.fit >= 55 ? 'secondary' :
      s.fit >= 30 ? 'test' : 'avoid'

    return {
      channel: ch,
      name: s.meta.name,
      icon: s.meta.icon,
      allocationPct,
      allocationBRL,
      priority,
      fit: s.fit,
      expectedCPL,
      expectedROAS: null,
      expectedLeadsPerMonth: expectedLeads,
      strengths: (strengths[ch] ?? []).slice(0, 3),
      weaknesses: (weaknesses[ch] ?? []).slice(0, 2),
      bestFor: bestFor[ch] ?? '',
      setup: setup[ch] ?? '',
      minBudget: s.meta.minBudget,
      timeToResults: timeToResults[ch] ?? '14-21 dias',
    }
  }

  const recommendedRecs: ChannelRecommendation[] = recommended.map((s, i) => {
    // Distribuição: primário recebe mais, os demais dividem o restante
    let pct: number
    if (recommended.length === 1) {
      pct = 100
    } else if (i === 0) {
      pct = Math.round(s.fit / totalFit * 100 * 1.2)  // primário ganha bônus
      pct = Math.min(pct, 70)
    } else {
      const remaining = 100 - Math.min(Math.round(recommended[0].fit / totalFit * 100 * 1.2), 70)
      const restFit = recommended.slice(1).reduce((acc, r) => acc + r.fit, 0)
      pct = Math.round(s.fit / restFit * remaining)
    }
    return buildRec(s, pct)
  })

  // Normaliza para 100%
  const totalPct = recommendedRecs.reduce((s, r) => s + r.allocationPct, 0)
  if (totalPct !== 100 && recommendedRecs.length > 0) {
    recommendedRecs[0].allocationPct += 100 - totalPct
    recommendedRecs[0].allocationBRL = Math.round(budget * recommendedRecs[0].allocationPct / 100)
  }

  const avoidRecs: ChannelRecommendation[] = avoided.map(s => buildRec(s, 0))

  // Summary stats
  const projectedLeads = recommendedRecs.reduce((s, r) => s + (r.expectedLeadsPerMonth ?? 0), 0)
  const projectedCPL   = projectedLeads > 0 ? Math.round(budget / projectedLeads) : 0
  const primary = recommendedRecs[0]

  // Strategy text
  let strategy = ''
  if (isLowBudget) {
    strategy = `Com R$${budget.toLocaleString('pt-BR')}/mês, concentre 100% no Meta Ads — único canal com volume e escala suficientes neste orçamento. Diversifique quando superar R$3.000/mês.`
  } else if (isMidBudget) {
    strategy = `Orçamento médio: distribua ~${recommendedRecs[0]?.allocationPct}% no ${recommendedRecs[0]?.name} (primário) e o restante em ${recommendedRecs.slice(1).map(r => r.name).join(' + ')}. Monitore CPL por canal e realoque mensalmente.`
  } else {
    strategy = `Com R$${budget.toLocaleString('pt-BR')}/mês, mix diversificado reduz risco e escala resultados. ${primary?.name} é o motor principal — os canais secundários capturam demanda que o primário não alcança.`
  }

  const maturityNote = isLowBudget
    ? 'Conta iniciante: domine um canal antes de diversificar. Foco = Meta Ads.'
    : isMidBudget
    ? 'Conta em crescimento: 2 canais simultâneos é o ideal — não disperse mais do que isso.'
    : 'Conta madura: diversificação de canais reduz dependência e estabiliza o CPL no longo prazo.'

  return {
    recommendedChannels: recommendedRecs,
    avoidChannels: avoidRecs,
    totalBudget: budget,
    strategy,
    primaryChannel: primary?.name ?? 'Meta Ads',
    diversificationScore: Math.min(100, recommendedRecs.length * 25 + (isHighBudget ? 25 : 0)),
    maturityNote,
    projectedTotalLeads: projectedLeads,
    projectedAvgCPL: projectedCPL,
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { niche = '', budget = 0, objective = '', clientData = {}, realMetrics = null } = body

    const sanitizedNiche = sanitizeText(niche || clientData?.niche || '')
    const totalBudget = Number(budget || clientData?.budget || 0)

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (apiKey && sanitizedNiche && totalBudget > 0) {
      try {
        const { default: Anthropic } = await import('@anthropic-ai/sdk')
        const anthropic = new Anthropic({ apiKey })
        const bench = getBenchmark(sanitizedNiche)

        const prompt = `Você é especialista em media mix para tráfego pago no Brasil.

DADOS DO CLIENTE:
Nicho: ${sanitizedNiche}
Budget mensal: R$${totalBudget}
Objetivo: ${objective || clientData?.objective || 'geração de leads'}
Receita mensal: R$${clientData?.monthlyRevenue || '?'}
Ticket médio: R$${clientData?.ticketPrice || '?'}
Benchmark CPL do nicho: R$${bench?.cpl_min}–R$${bench?.cpl_max}
${realMetrics ? `Dados reais: gasto R$${realMetrics.totalSpend}, leads ${realMetrics.totalLeads}, CPL R$${realMetrics.avgCPL}` : ''}

Gere uma recomendação de mix de canais específica para o nicho. Use a ferramenta emit_channel_mix.`

        const msg = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 1200,
          tools: [{
            name: 'emit_channel_mix',
            description: 'Retorna a recomendação de mix de canais.',
            input_schema: {
              type: 'object',
              properties: {
                strategy: { type: 'string', description: 'estratégia em 2-3 frases' },
                maturityNote: { type: 'string', description: 'maturidade da conta em 1 frase' },
                channels: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      channel: { type: 'string', enum: ['meta', 'google_search', 'google_display', 'youtube', 'tiktok', 'linkedin', 'pinterest', 'email'] },
                      allocationPct: { type: 'number' },
                      priority: { type: 'string', enum: ['primary', 'secondary', 'test', 'avoid'] },
                      expectedCPL: { type: 'number', description: 'CPL esperado (omita se não der pra estimar)' },
                      expectedLeadsPerMonth: { type: 'number', description: 'leads/mês esperados (omita se não der)' },
                      bestFor: { type: 'string', description: 'uso ideal em 1 frase' },
                      setup: { type: 'string', description: 'como configurar em 1 frase' },
                    },
                    required: ['channel', 'allocationPct', 'priority', 'bestFor', 'setup'],
                  },
                },
              },
              required: ['strategy', 'channels'],
            },
          }],
          tool_choice: { type: 'tool', name: 'emit_channel_mix' },
          messages: [{ role: 'user', content: prompt }],
        })

        const aiData = (msg.content as any[]).find((b: any) => b.type === 'tool_use')?.input
        if (aiData?.channels) {
          // Usa cálculo base e enriquece com IA
          const base = buildChannelMix(sanitizedNiche, totalBudget, objective, clientData, realMetrics)
          if (aiData.strategy) base.strategy = aiData.strategy
          if (aiData.maturityNote) base.maturityNote = aiData.maturityNote

          for (const aiCh of (aiData.channels ?? [])) {
            const rec = base.recommendedChannels.find(r => r.channel === aiCh.channel)
            if (rec) {
              if (aiCh.allocationPct) { rec.allocationPct = aiCh.allocationPct; rec.allocationBRL = Math.round(totalBudget * aiCh.allocationPct / 100) }
              if (aiCh.expectedCPL) rec.expectedCPL = aiCh.expectedCPL
              if (aiCh.expectedLeadsPerMonth) rec.expectedLeadsPerMonth = aiCh.expectedLeadsPerMonth
              if (aiCh.bestFor) rec.bestFor = aiCh.bestFor
              if (aiCh.setup) rec.setup = aiCh.setup
            }
          }

          return NextResponse.json({ mix: base, source: 'ai' })
        }
      } catch (err) {
        console.error('[channel-mix] AI error, falling back:', err)
      }
    }

    const result = buildChannelMix(sanitizedNiche, totalBudget, objective, clientData, realMetrics)
    return NextResponse.json({ mix: result, source: 'fallback' })
  } catch (err) {
    console.error('[channel-mix] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
