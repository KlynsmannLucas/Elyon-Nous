// app/api/audit/route.ts — Auditoria sênior de tráfego pago (11 seções, nível consultor premium)
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getBenchmark, getBenchmarkSummary } from '@/lib/niche_benchmarks'

// ── Fallback estruturado quando a IA não está disponível ─────────────────────
function buildFallbackAudit(
  clientName: string,
  niche: string,
  allCampaigns: any[],
  metaTotals: Record<string, any> | null,
  googleTotals: Record<string, any> | null,
  bench: NonNullable<ReturnType<typeof getBenchmark>>
) {
  const totalSpend = allCampaigns.reduce((s, c) => s + (c.spend || 0), 0)
    || (metaTotals?.spend || 0) + (googleTotals?.spend || 0)
  const totalLeads = allCampaigns.reduce((s, c) => s + (c.leads || 0), 0)
    || (metaTotals?.leads || 0) + (googleTotals?.leads || 0)
  const realCPL = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0
  const benchCPL = Math.round((bench.cpl_min + bench.cpl_max) / 2)
  const cplDiff = realCPL > 0 ? ((realCPL - benchCPL) / benchCPL) * 100 : 0

  let score = 65
  if (realCPL > 0 && realCPL <= bench.cpl_min) score = 88
  else if (realCPL > 0 && realCPL <= bench.cpl_max) score = 72
  else if (realCPL > bench.cpl_max) score = 50

  const grade = score >= 85 ? 'A' : score >= 72 ? 'B+' : score >= 58 ? 'B' : score >= 45 ? 'C+' : 'C'
  const activeCamps = allCampaigns.filter(c => c.leads > 0).sort((a, b) => (a.cpl || 999) - (b.cpl || 999))

  return {
    health_score: score,
    grade,
    executive_summary: `Conta de ${clientName} (${niche}) com CPL real de R$${realCPL} vs benchmark R$${bench.cpl_min}–${bench.cpl_max}. ${allCampaigns.length} campanhas analisadas com investimento total de R$${Math.round(totalSpend).toLocaleString('pt-BR')}.`,

    visao_geral: {
      modelo_aquisicao: `Modelo de aquisição baseado em tráfego pago para ${niche}. Investimento de R$${Math.round(totalSpend).toLocaleString('pt-BR')} gerando ${totalLeads} leads com CPL médio de R$${realCPL}.`,
      desalinhamentos: realCPL > bench.cpl_max
        ? [`CPL ${Math.round(cplDiff)}% acima do benchmark do nicho — sinaliza desalinhamento entre criativo, audiência ou oferta`]
        : [`Performance dentro do benchmark do nicho ${niche}`],
      riscos: ['Dependência de um único canal de aquisição', 'Tracking não auditado — pode haver sub-registro de conversões'],
    },

    estrutura_campanhas: {
      meta: metaTotals ? {
        resumo: `${allCampaigns.filter(c => c.platform !== 'google').length} campanhas no Meta Ads`,
        organizacao_funil: 'Estrutura não auditada — necessário acesso ao Gerenciador de Anúncios',
        separacao_publicos: 'Não verificado via export. Conferir separação frio/morno/quente nas campanhas.',
        tipos_campanha: 'Dados de campanha disponíveis no export.',
        erros: realCPL > bench.cpl_max ? [`CPL médio R$${realCPL} acima do benchmark — revisar estrutura`] : [],
      } : null,
      google: googleTotals ? {
        resumo: `${allCampaigns.filter(c => c.platform === 'google').length} campanhas no Google Ads`,
        organizacao: 'Estrutura disponível via export de campanhas.',
        palavras_chave_estrutura: 'Verificar separação de campanhas por intenção de compra.',
        tipos_campanha: 'Conferir uso correto de Search vs PMAX vs Display.',
        erros: [],
      } : null,
    },

    tracking: {
      meta: metaTotals ? {
        pixel_ok: null,
        api_conversoes: null,
        eventos_duplicados: null,
        problemas: ['Auditoria de pixel requer acesso ao Events Manager — não verificável via export'],
      } : null,
      google: googleTotals ? {
        conversoes_confiaveis: null,
        importacao_correta: null,
        problema_vaidade: null,
        problemas: ['Verificar importação de conversões GA4 vs tag direta — conferir no Google Ads'],
      } : null,
      prioridade_maxima: false,
      alerta: 'Audite o tracking manualmente — é a base de toda otimização. Sem tracking correto, todo o restante é suposição.',
    },

    performance: {
      meta: metaTotals ? {
        metricas: { cpm: 0, ctr: metaTotals.ctr || 0, cpc: 0, cpa: realCPL, frequencia: 0 },
        gargalos: [
          metaTotals.ctr < 1 ? 'CTR abaixo de 1% — criativos com baixo engajamento' : 'CTR dentro do esperado',
          realCPL > bench.cpl_max ? `CPL R$${realCPL} acima do benchmark R$${bench.cpl_max}` : 'CPL no benchmark',
        ],
        interpretacao: `CTR de ${metaTotals.ctr}% com CPL R$${metaTotals.cpl || realCPL}. ${metaTotals.roas > 0 ? `ROAS ${metaTotals.roas}× no período.` : 'ROAS não calculado — verificar rastreamento de receita.'}`,
      } : null,
      google: googleTotals ? {
        metricas: { ctr: googleTotals.ctr || 0, cpc: 0, taxa_conversao: 0 },
        palavras_chave_analise: 'Análise detalhada requer export de termos de pesquisa. Verificar palavras de cauda longa vs genéricas.',
        interpretacao: `CTR ${googleTotals.ctr}% com ${googleTotals.leads || 0} conversões registradas.`,
      } : null,
    },

    criativos_meta: metaTotals ? {
      quantidade: 'Não verificável via export de campanhas — necessário export de anúncios',
      qualidade_ganchos: 'Análise de criativo requer acesso aos anúncios ativos',
      clareza_oferta: 'Verificar se a proposta de valor está explícita nos primeiros 3 segundos',
      prova_social: 'Incluir depoimentos, casos de sucesso e números reais na comunicação',
      teste_ab: 'Rodar mínimo 3–5 criativos simultaneamente para identificar o melhor ângulo',
      fadiga: allCampaigns.some(c => (c.frequency || 0) > 4) ? 'ATENÇÃO: frequência alta detectada — criativos podem estar saturados' : 'Frequência não disponível via export',
      angulo: `Para ${niche}: priorizar dor do cliente, urgência e prova social como ângulos principais`,
      problemas: [],
    } : null,

    publicos: {
      meta: metaTotals ? {
        amplos_segmentados: 'Verificar se há segmentação excessiva (Advantage+ recomendado para topo de funil)',
        lookalikes: 'Criar lookalike de clientes pagantes — não de leads frios',
        remarketing: 'Estruturar remarketing em 3 camadas: visitantes 7d, 30d e leads sem conversão',
        problemas: [],
      } : null,
      google: googleTotals ? {
        qualidade_kws: 'Exportar relatório de termos de pesquisa e negativar irrelevantes',
        correspondencia: 'Usar correspondência exata para termos de alta intenção, frase para exploração',
        negativacao: 'Lista de palavras negativas deve ter mínimo 50 termos para conta madura',
        problemas: [],
      } : null,
    },

    funil: {
      landing_page: 'Auditar velocidade (>3s = perda de 50% dos leads), headline clara e CTA visível above the fold',
      atendimento: 'Definir SLA de primeiro atendimento — resposta em até 5min aumenta conversão em 3×',
      follow_up: 'Implementar sequência de 5–7 touchpoints para leads não convertidos',
      gargalo_principal: realCPL > bench.cpl_max ? 'trafego' : 'pos-clique',
      nota: `CPL atual R$${realCPL} vs benchmark R$${benchCPL} — ${realCPL > benchCPL ? 'gargalo está no tráfego (custo por lead elevado)' : 'gargalo provavelmente no pós-clique (qualificação e atendimento)'}`,
    },

    gargalos: [
      realCPL > bench.cpl_max ? {
        rank: 1, titulo: `CPL ${Math.round(cplDiff)}% acima do benchmark`,
        descricao: `R$${realCPL} vs benchmark R$${bench.cpl_min}–${bench.cpl_max} para ${niche}`,
        impacto: `Desperdício estimado: R$${Math.round(totalSpend * 0.2).toLocaleString('pt-BR')}/mês em custo excessivo por lead`,
      } : {
        rank: 1, titulo: 'Tracking não auditado',
        descricao: 'Sem confirmação de pixel e API de conversões, os dados de otimização são incompletos',
        impacto: 'Otimização do algoritmo comprometida — pode estar otimizando para o evento errado',
      },
      {
        rank: 2, titulo: 'Ausência de estrutura de remarketing clara',
        descricao: 'Leads que não converteram na primeira visita representam 97% do tráfego — sem remarketing, esse tráfego é desperdício',
        impacto: `Potencial de +20–35% nas conversões sem aumentar investimento`,
      },
      {
        rank: 3, titulo: 'Testes A/B insuficientes',
        descricao: 'Sem rotação sistemática de criativos, fadiga de anúncio reduz CTR em 30–40% após 2–3 semanas',
        impacto: 'Aumento progressivo de CPM e CPL com o tempo',
      },
    ],

    oportunidades: [
      {
        titulo: `Escalar ${bench.best_channels[0] || 'Meta Ads'} com segmentação refinada`,
        descricao: `Canal com melhor histórico para ${niche}. Aumentar 20% do investimento semanalmente enquanto CPL estiver no benchmark`,
        potencial: `+30–50% em volume de leads sem aumentar CPL`,
      },
      {
        titulo: 'Remarketing estruturado em camadas',
        descricao: 'Criar 3 audiências: visitantes 7d (oferta direta), leads 30d (nova abordagem) e clientes (upsell)',
        potencial: 'Taxa de conversão +15–25% no funil total',
      },
    ],

    plano_acao: {
      curto: [
        { acao: 'Auditar tracking (pixel + API conversões)', como: 'Acessar Meta Events Manager e verificar cada evento. Instalar conversions API se não tiver.', impacto: 'Crítico — base de tudo' },
        { acao: 'Pausar campanhas com CPL > benchmark máximo', como: `Identificar campanhas com CPL > R$${bench.cpl_max} e redirecionar verba para as que performam`, impacto: 'Alto — redução imediata de desperdício' },
      ],
      medio: [
        { acao: 'Criar estrutura de remarketing em 3 camadas', como: 'Audiências: visitantes 7d, 30d e leads sem conversão. Criativos diferentes para cada grupo.', impacto: '+20% conversão sem aumento de custo' },
        { acao: 'Lançar ciclo de testes A/B de criativos', como: 'Mínimo 3 criativos por conjunto. Testar: problema vs. solução vs. prova social', impacto: 'CTR +30%, CPL -15%' },
      ],
      longo: [
        { acao: 'Estrutura de funil completo TOFU/MOFU/BOFU', como: 'Separar campanhas por temperatura de público. Objetivos diferentes por etapa do funil.', impacto: 'Escalabilidade sustentável' },
        { acao: `Diversificar para ${bench.best_channels[1] || 'Google Search'}`, como: 'Após dominar o canal principal, expandir para captura de demanda existente', impacto: 'Redução de dependência e maior cobertura de mercado' },
      ],
    },

    insights_senior: [
      {
        titulo: 'O problema raramente está onde você pensa',
        texto: `Em ${niche}, o gargalo mais comum não é o criativo ou o público — é o processo de atendimento. Um lead que espera mais de 30 minutos para ser contactado tem 80% menos chance de converter. Audite o funil de pós-clique antes de otimizar o tráfego.`,
      },
      {
        titulo: 'CPL baixo nem sempre significa resultado',
        texto: 'Um CPL baixo com taxa de conversão em vendas de 1% é pior que CPL alto com 10% de conversão. Rastreie sempre até a venda final, não apenas o lead.',
      },
    ],

    generated_at: new Date().toISOString(),
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

    const { clerkClient } = await import('@clerk/nextjs/server')
    const clerkUser = await clerkClient().users.getUser(userId)
    const plan = (clerkUser.publicMetadata as any)?.plan as string | undefined
    const inTrial = (Date.now() - clerkUser.createdAt) < 7 * 24 * 60 * 60 * 1000
    if (!plan && !inTrial) {
      return NextResponse.json({ success: false, error: 'Período de avaliação encerrado.' }, { status: 402 })
    }

    const body = await req.json()
    const {
      clientName,
      niche,
      budget            = 0,
      objective         = '',
      metaCampaigns     = [],
      metaTotals        = null,
      googleCampaigns   = [],
      googleTotals      = null,
      uploadedFiles     = [],   // novo: array de { filename, platform, campaigns[] }
      uploadedCampaigns = [],   // legado: array plano de campanhas
      uploadedPlatform  = null,
    } = body

    if (!clientName || !niche) {
      return NextResponse.json({ success: false, error: 'clientName e niche são obrigatórios.' }, { status: 400 })
    }

    const hasMeta   = metaTotals !== null || metaCampaigns.length > 0
    const hasGoogle = googleTotals !== null || googleCampaigns.length > 0

    // Suporte a múltiplos arquivos (novo) e arquivo único (legado)
    const allUploadedFiles: Array<{ filename: string; platform: string; campaigns: any[] }> = uploadedFiles.length > 0
      ? uploadedFiles
      : uploadedCampaigns.length > 0
        ? [{ filename: 'arquivo.csv', platform: uploadedPlatform || 'desconhecido', campaigns: uploadedCampaigns }]
        : []

    const allUploadedCampaigns = allUploadedFiles.flatMap(f => f.campaigns)
    const hasUpload = allUploadedCampaigns.length > 0

    if (!hasMeta && !hasGoogle && !hasUpload) {
      return NextResponse.json({
        success: false,
        error: 'Conecte uma conta de anúncios ou importe pelo menos um arquivo CSV/XLSX para auditar.',
      }, { status: 400 })
    }

    const bench = getBenchmark(niche)
    const benchmarkText = getBenchmarkSummary(niche)
    const allCampaigns = [...metaCampaigns, ...googleCampaigns, ...allUploadedCampaigns]

    const uploadTotalSpend = allUploadedCampaigns.reduce((s: number, c: any) => s + (c.spend || 0), 0)
    const uploadTotalLeads = allUploadedCampaigns.reduce((s: number, c: any) => s + (c.leads || 0), 0)
    const totalSpend = (metaTotals?.spend || 0) + (googleTotals?.spend || 0) + uploadTotalSpend
    const totalLeads = (metaTotals?.leads || 0) + (googleTotals?.leads || 0) + uploadTotalLeads
    const realCPL    = totalLeads > 0 ? (totalSpend / totalLeads).toFixed(2) : '0'

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (apiKey) {
      try {
        const { default: Anthropic } = await import('@anthropic-ai/sdk')
        const anthropic = new Anthropic({ apiKey })

        // ── Monta o contexto completo de dados ─────────────────────────────
        const metaSummary = hasMeta ? `
=== META ADS ===
Gasto: R$${(metaTotals?.spend || 0).toFixed(2)} | Impressões: ${(metaTotals?.impressions || 0).toLocaleString('pt-BR')} | Cliques: ${metaTotals?.clicks || 0}
CTR: ${metaTotals?.ctr || 0}% | CPL: R$${metaTotals?.cpl || 0} | ROAS: ${metaTotals?.roas || 0}× | Leads: ${metaTotals?.leads || 0}
Campanhas (${metaCampaigns.length}):
${metaCampaigns.slice(0, 20).map((c: any) =>
  `  [${c.status || 'ACTIVE'}] ${c.name}
   Gasto: R$${(c.spend||0).toFixed(2)} | Leads: ${c.leads||0} | CPL: R$${(c.cpl||0).toFixed(2)} | CTR: ${(c.ctr||0).toFixed(2)}% | ROAS: ${(c.roas||0).toFixed(2)}× | Frequência: ${(c.frequency||0).toFixed(1)}`
).join('\n')}` : ''

        const googleSummary = hasGoogle ? `
=== GOOGLE ADS ===
Gasto: R$${(googleTotals?.spend || 0).toFixed(2)} | Impressões: ${(googleTotals?.impressions || 0).toLocaleString('pt-BR')} | Cliques: ${googleTotals?.clicks || 0}
CTR: ${googleTotals?.ctr || 0}% | CPL: R$${googleTotals?.cpl || 0} | ROAS: ${googleTotals?.roas || 0}× | Conversões: ${googleTotals?.leads || 0}
Campanhas (${googleCampaigns.length}):
${googleCampaigns.slice(0, 20).map((c: any) =>
  `  [${c.status || 'ACTIVE'}] ${c.name}
   Gasto: R$${(c.spend||0).toFixed(2)} | Leads: ${c.leads||0} | CPL: R$${(c.cpl||0).toFixed(2)} | CTR: ${(c.ctr||0).toFixed(2)}%`
).join('\n')}` : ''

        const uploadSummary = allUploadedFiles.length > 0 ? allUploadedFiles.map(file => `
=== ARQUIVO IMPORTADO: ${file.filename.toUpperCase()} [${(file.platform || 'desconhecido').toUpperCase()}] ===
Total de campanhas/anúncios: ${file.campaigns.length}
${file.campaigns.slice(0, 25).map((c: any) =>
  `  [${c.status || '-'}] ${c.name}${c.adName && c.adName !== c.name ? ` / Anúncio: ${c.adName}` : ''}
   Gasto: R$${(c.spend||0).toFixed(2)} | Leads: ${c.leads||0} | CPL: R$${(c.cpl||0).toFixed(2)} | CTR: ${(c.ctr||0).toFixed(2)}% | ROAS: ${(c.roas||0).toFixed(2)}×${c.frequency ? ` | Freq: ${c.frequency}` : ''}${c.placement ? ` | Pos: ${c.placement}` : ''}`
).join('\n')}
Subtotal: Gasto R$${file.campaigns.reduce((s:number,c:any)=>s+(c.spend||0),0).toFixed(2)} | Leads ${file.campaigns.reduce((s:number,c:any)=>s+(c.leads||0),0)}`
        ).join('\n') : ''

        // ── Detecção de anomalias e qualidade de dados ─────────────────
        const allCamps = [...metaCampaigns, ...googleCampaigns, ...allUploadedCampaigns]
        const anomalies: string[] = []

        // CTR suspeito (possível tráfego bot ou erro de tracking)
        const highCTR = allCamps.filter((c: any) => (c.ctr || 0) > 10)
        if (highCTR.length > 0) anomalies.push(`⚠ CTR SUSPEITO (>10%): ${highCTR.map((c:any) => `${c.name} (${c.ctr}%)`).join(', ')} — possível tráfego inválido, bot traffic ou erro de configuração de evento`)

        // ROAS impossível (conversão inflacionada)
        const absurdROAS = allCamps.filter((c: any) => (c.roas || 0) > 40)
        if (absurdROAS.length > 0) anomalies.push(`⚠ ROAS IMPOSSÍVEL (>40×): ${absurdROAS.map((c:any) => `${c.name} (${c.roas}×)`).join(', ')} — provável erro no valor de conversão (duplicado ou errado no pixel)`)

        // CPL zero com leads (evento de conversão mal configurado)
        const zeroCPL = allCamps.filter((c: any) => (c.leads || 0) > 0 && (c.cpl || 0) === 0 && (c.spend || 0) > 0)
        if (zeroCPL.length > 0) anomalies.push(`⚠ CPL=R$0 COM LEADS: ${zeroCPL.map((c:any) => c.name).join(', ')} — pixel contando evento mas não vinculando ao gasto correto`)

        // Campanhas com gasto alto mas zero leads (desperdício crítico)
        const wasteCamps = allCamps.filter((c: any) => (c.spend || 0) > (totalSpend * 0.1) && (c.leads || 0) === 0)
        if (wasteCamps.length > 0) anomalies.push(`🔴 DESPERDÍCIO CRÍTICO: ${wasteCamps.map((c:any) => `${c.name} (R$${c.spend?.toFixed(0)})`).join(', ')} — investimento alto SEM resultado`)

        // Frequência muito alta (fadiga criativa)
        const highFreq = allCamps.filter((c: any) => (c.frequency || 0) > 4)
        if (highFreq.length > 0) anomalies.push(`⚠ FADIGA CRIATIVA: ${highFreq.map((c:any) => `${c.name} (freq ${c.frequency?.toFixed(1)})`).join(', ')} — público saturado, CTR caindo progressivamente`)

        // Gasto total zerado com campanhas ativas (tracking quebrado)
        if (totalSpend === 0 && allCamps.length > 0) anomalies.push(`🔴 GASTO TOTAL = R$0 COM ${allCamps.length} CAMPANHAS — dados provavelmente incompletos ou período sem atividade`)

        const anomalySection = anomalies.length > 0 ? `
=== ANOMALIAS DETECTADAS (analise estas PRIMEIRO) ===
${anomalies.join('\n')}
` : '=== QUALIDADE DOS DADOS: OK (nenhuma anomalia crítica detectada) ==='

        const prompt = `Você é um consultor sênior de tráfego pago com 10+ anos de experiência no mercado brasileiro. Especialista em Meta Ads (Advantage+, CBO, ASC, campanhas de conversão/leads), Google Ads (Search, PMAX, Display, YouTube, smart bidding com tCPA/tROAS/Max Conversions), atribuição de conversões e growth para PMEs. Você já gerenciou mais de R$50M em investimento publicitário.

Faça uma AUDITORIA COMPLETA E CIRÚRGICA. Seja direto como um especialista de R$10.000/análise:
- Cite nomes REAIS das campanhas nos problemas identificados
- Interprete o que cada métrica SIGNIFICA para o negócio (não apenas descreva)
- Priorize as anomalias detectadas automaticamente (listadas abaixo)
- Avalie uso correto de Advantage+ vs campanha manual, objetivo vs estratégia de lance
- Identifique problemas de atribuição (last-click inflacionado, sem API de Conversões, janela errada)

=== DADOS DO CLIENTE ===
Cliente: ${clientName}
Nicho: ${niche}
Investimento mensal: R$${budget}
Objetivo: ${objective}

${anomalySection}

=== DADOS DE PERFORMANCE ===
${metaSummary}
${googleSummary}
${uploadSummary}

=== CONSOLIDADO GERAL ===
Investimento total analisado: R$${totalSpend.toFixed(2)}
Total de leads/conversões: ${totalLeads}
CPL médio real: R$${realCPL}

${benchmarkText ? `=== BENCHMARK DO NICHO (${niche}) ===\n${benchmarkText}` : ''}

=== ESTRUTURA OBRIGATÓRIA DA AUDITORIA ===
Siga EXATAMENTE esta estrutura no JSON. Analise os dados reais acima — NÃO use dados genéricos.
Use os nomes reais das campanhas. Cite métricas reais. Interprete o que as métricas SIGNIFICAM, não apenas descreva.

Responda APENAS com JSON válido (sem markdown, sem \`\`\`json):
{
  "health_score": <0-100 baseado nos dados reais>,
  "grade": "<A+|A|A-|B+|B|B-|C+|C|D>",
  "executive_summary": "<2-3 frases executivas com os números mais críticos>",

  "visao_geral": {
    "modelo_aquisicao": "<análise do modelo de aquisição atual com dados reais>",
    "desalinhamentos": ["<desalinhamento identificado entre tráfego/oferta/funil — específico>"],
    "riscos": ["<risco estratégico específico com base nos dados>"]
  },

  "estrutura_campanhas": {
    "meta": ${hasMeta ? `{
      "resumo": "<análise da estrutura geral — organize ou não? Por quê?>",
      "organizacao_funil": "<as campanhas estão divididas por etapa do funil? TOFU/MOFU/BOFU?>",
      "separacao_publicos": "<há separação clara de frio, morno e quente? Cite nomes das campanhas>",
      "tipos_campanha": "<objetivos estão corretos para a fase do funil?>",
      "erros": ["<erro estrutural grave específico com nome da campanha>"]
    }` : 'null'},
    "google": ${hasGoogle ? `{
      "resumo": "<análise da estrutura do Google Ads>",
      "organizacao": "<estrutura de campanhas está lógica?>",
      "palavras_chave_estrutura": "<separação por intenção está correta?>",
      "tipos_campanha": "<Search vs PMAX vs Display usado corretamente?>",
      "erros": ["<erro estrutural com impacto financeiro>"]
    }` : 'null'}
  },

  "tracking": {
    "meta": ${hasMeta ? `{
      "pixel_ok": <true|false|null — inferir dos dados se possível>,
      "api_conversoes": <true|false|null>,
      "eventos_duplicados": <true|false|null>,
      "problemas": ["<problema específico de tracking com impacto>"]
    }` : 'null'},
    "google": ${hasGoogle ? `{
      "conversoes_confiaveis": <true|false|null>,
      "importacao_correta": <true|false|null>,
      "problema_vaidade": <true|false>,
      "problemas": ["<problema de tracking Google>"]
    }` : 'null'},
    "prioridade_maxima": <true se há problemas críticos de tracking>,
    "alerta": "<se há problema de tracking, descreva o impacto no negócio>"
  },

  "performance": {
    "meta": ${hasMeta ? `{
      "metricas": {
        "cpm": <valor ou 0>,
        "ctr": <${metaTotals?.ctr || 0}>,
        "cpc": <valor ou 0>,
        "cpa": <${metaTotals?.cpl || 0}>,
        "frequencia": <valor médio ou 0>
      },
      "gargalos": ["<gargalo identificado com causa raiz — NÃO genérico>"],
      "interpretacao": "<o que essas métricas SIGNIFICAM para o negócio — impacto financeiro>"
    }` : 'null'},
    "google": ${hasGoogle ? `{
      "metricas": {
        "ctr": <${googleTotals?.ctr || 0}>,
        "cpc": <valor ou 0>,
        "taxa_conversao": <valor ou 0>
      },
      "palavras_chave_analise": "<intenção das palavras-chave está alinhada com a oferta?>",
      "interpretacao": "<o que os dados do Google indicam>"
    }` : 'null'}
  },

  "criativos_meta": ${hasMeta || allUploadedCampaigns.length > 0 ? `{
    "quantidade": "<suficiente ou insuficiente — cite dados>",
    "qualidade_ganchos": "<os ganchos capturam atenção ou são genéricos?>",
    "clareza_oferta": "<a oferta está clara nos 3 primeiros segundos?>",
    "prova_social": "<há depoimentos, casos e números?>",
    "teste_ab": "<há testes A/B ativos? Quantos criativos por conjunto?>",
    "fadiga": "<há indícios de fadiga? Cite campanhas com frequência alta>",
    "angulo": "<qual ângulo de comunicação está sendo usado? É o ideal para o nicho?>",
    "problemas": ["<problema específico de criativo que está custando dinheiro>"]
  }` : 'null'},

  "publicos": {
    "meta": ${hasMeta ? `{
      "amplos_segmentados": "<está usando público amplo (Advantage+) ou hiper-segmentado? O que indica os dados?>",
      "lookalikes": "<há uso de lookalike? De qual fonte?>",
      "remarketing": "<há estrutura de remarketing? Cite campanhas se existirem>",
      "problemas": ["<problema de segmentação com impacto financeiro>"]
    }` : 'null'},
    "google": ${hasGoogle ? `{
      "qualidade_kws": "<palavras-chave estão com intenção comercial ou desperdiçando em buscas genéricas?>",
      "correspondencia": "<uso de correspondência exata/frase/ampla está equilibrado?>",
      "negativacao": "<há lista de negativos robusta?>",
      "problemas": ["<problema de segmentação Google>"]
    }` : 'null'}
  },

  "funil": {
    "landing_page": "<análise da provável eficiência da LP com base na taxa de conversão implícita nos dados>",
    "atendimento": "<o processo de atendimento (WhatsApp/CRM) parece estruturado ou ad-hoc?>",
    "follow_up": "<há indícios de follow-up estruturado ou os leads são perdidos?>",
    "gargalo_principal": "<'trafego' se CPL alto | 'pos-clique' se CPL bom mas conversão baixa | 'ambos'>",
    "nota": "<onde está o maior vazamento de dinheiro no funil — seja específico>"
  },

  "gargalos": [
    {
      "rank": 1,
      "titulo": "<problema mais crítico — específico e com dados>",
      "descricao": "<o que está acontecendo e por quê — cite métricas>",
      "impacto": "<impacto financeiro estimado em R$ ou % do investimento>"
    }
  ],

  "oportunidades": [
    {
      "titulo": "<oportunidade específica não explorada>",
      "descricao": "<como capitalizar — ação concreta>",
      "potencial": "<resultado esperado em % ou R$>"
    }
  ],

  "plano_acao": {
    "curto": [
      {
        "acao": "<ação específica com nome de campanha/canal se aplicável>",
        "como": "<passo a passo de execução>",
        "impacto": "<resultado esperado>"
      }
    ],
    "medio": [
      {
        "acao": "<ação de médio prazo>",
        "como": "<como executar>",
        "impacto": "<impacto esperado>"
      }
    ],
    "longo": [
      {
        "acao": "<ação estratégica de longo prazo>",
        "como": "<como estruturar>",
        "impacto": "<transformação esperada>"
      }
    ]
  },

  "insights_senior": [
    {
      "titulo": "<título do insight — não genérico>",
      "texto": "<insight que conecta marketing, comportamento do consumidor e estratégia — nível consultor premium>"
    }
  ]
}`

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 6000,
          messages: [{ role: 'user', content: prompt }],
        })

        const raw = (message.content[0] as any).text.trim()
        const jsonStr = raw.startsWith('```') ? raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '') : raw
        const audit = JSON.parse(jsonStr)
        audit.generated_at = new Date().toISOString()
        return NextResponse.json({ success: true, audit, source: 'ai' })

      } catch (aiError: any) {
        console.warn('Anthropic API falhou na auditoria, usando fallback:', aiError.message)
      }
    }

    // ── Fallback por benchmark ──────────────────────────────────────────────
    if (!bench) {
      return NextResponse.json({ success: false, error: 'Nicho não reconhecido e API indisponível.' }, { status: 400 })
    }
    const audit = buildFallbackAudit(clientName, niche, allCampaigns, metaTotals, googleTotals, bench)
    return NextResponse.json({ success: true, audit, source: 'benchmark' })

  } catch (error: any) {
    console.error('Audit route error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
