// app/api/audit/route.ts — Auditoria sênior de tráfego pago (11 seções, nível consultor premium)
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getBenchmark, getBenchmarkSummary } from '@/lib/niche_benchmarks'
import { sanitizeText } from '@/lib/sanitize'
import { supabaseAdmin } from '@/lib/supabase'
import { saveAuditReport, upsertPriorityActions, upsertHealthScore } from '@/lib/persistence'
import { getClientMemoryContext } from '@/lib/memory'
import { errMsg } from '@/lib/errMsg'

// Auditoria pode chamar Claude (bound 46s) + fallback Gemini (12s) + persistência.
// Com Meta + Google o payload fica maior e o pior caso passava de 60s → 504.
// 300s dá folga (mesmo teto das rotas pesadas daily-snapshot/briefing).
export const maxDuration = 300

// ── Salva padrões da auditoria diretamente no Supabase (fire-and-forget) ─────
async function saveAuditMemory(
  userId: string,
  clientName: string,
  niche: string,
  audit: any,
  realMetrics: any,
) {
  if (!supabaseAdmin) return
  try {
    const score = audit.health_score ?? audit.healthScore ?? audit.overallScore ?? 0
    const cpl   = realMetrics?.avgCPL ?? 0
    const spend = realMetrics?.totalSpend ?? 0
    const leads = realMetrics?.totalLeads ?? 0

    if (spend < 100) return  // sem dados suficientes para aprender

    const rows: any[] = []
    const now = new Date().toISOString()
    const period = now.slice(0, 7)
    const base = { user_id: userId, client_name: clientName, niche, source: 'audit', period, tags: [] as string[], updated_at: now }
    const campCPL = (c: any) => (c.leads > 0 ? Math.round(c.spend / c.leads) : null)

    // 1. Benchmark da conta (tendência de CPL ao longo do tempo)
    if (cpl > 0) {
      rows.push({
        ...base, memory_type: 'benchmark',
        title: `Benchmark real — ${niche} — CPL R$${cpl}`,
        description: `Conta com gasto R$${spend} gerou ${leads} leads com CPL médio R$${cpl}. Score de saúde: ${score}/100.`,
        metrics: { cpl, spend, leads, roas: realMetrics?.avgROAS, ctr: realMetrics?.avgCTR },
        confidence: 0.9,
      })
    }

    // 2. Campanhas VENCEDORAS (padrões que funcionam — nome recorrente vira aprendizado)
    const vencedoras: any[] = audit._campanhasClassificadas?.vencedoras ?? []
    for (const c of vencedoras.slice(0, 3)) {
      const name = c.name || c.campaign_name
      if (!name) continue
      rows.push({
        ...base, memory_type: 'winning_creative',
        title: `Vencedora: ${name}`,
        description: c.evidence || `Campanha "${name}" com bom desempenho (CPL R$${campCPL(c) ?? '—'}).`,
        metrics: { cpl: campCPL(c), spend: c.spend, leads: c.leads },
        confidence: 0.85,
      })
    }

    // 3. Campanhas CRÍTICAS + gargalos (padrões que falham/reincidem)
    const criticas: any[] = audit._campanhasClassificadas?.criticas ?? []
    for (const c of criticas.slice(0, 3)) {
      const name = c.name || c.campaign_name
      if (!name) continue
      rows.push({
        ...base, memory_type: 'losing_pattern',
        title: `Crítica: ${name}`,
        description: c.evidence || `Campanha "${name}" com performance insuficiente (CPL R$${campCPL(c) ?? '—'}).`,
        metrics: { cpl: campCPL(c), spend: c.spend, leads: c.leads },
        confidence: 0.85,
      })
    }
    const gargalos: any[] = audit.gargalos ?? []
    for (const g of gargalos.slice(0, 2)) {
      if (!g?.titulo) continue
      rows.push({
        ...base, memory_type: 'losing_pattern',
        title: g.titulo,
        description: g.descricao || g.impacto || g.titulo,
        metrics: { cpl, spend },
        confidence: 0.8,
      })
    }

    if (rows.length > 0) {
      await supabaseAdmin.from('campaign_memory').insert(rows)
    }
  } catch {
    // silencioso — não quebra a auditoria
  }
}

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

  // ── Inferências de estrutura a partir dos dados reais ──────────────────────
  const metaCamps = allCampaigns.filter(c => c.platform !== 'google')
  const googleCamps = allCampaigns.filter(c => c.platform === 'google')

  // Pixel: se há leads registrados via API, pixel está funcionando
  const metaLeads = (metaTotals?.leads || 0) + metaCamps.reduce((s, c) => s + (c.leads || 0), 0)
  const metaSpend  = metaTotals?.spend || metaCamps.reduce((s, c) => s + (c.spend || 0), 0)
  const pixelOk: boolean | null =
    metaLeads > 0 ? true :
    metaSpend > 500 && metaLeads === 0 ? false :
    null

  // Eventos duplicados: ROAS impossível (>20×) sugere valor de conversão inflado
  const avgROAS = metaTotals?.roas || (metaCamps.length > 0
    ? metaCamps.reduce((s, c) => s + (c.roas || 0), 0) / metaCamps.filter(c => c.roas > 0).length
    : 0)
  const eventosDuplicados: boolean | null = avgROAS > 20 ? true : null

  // Estrutura do funil: analisa nomes das campanhas
  const tofKw = /\b(tof|tofu|topo|cold|frio|prospe[çc]|prospect|awareness|alcance|aquisic)/i
  const mofKw = /\b(mof|mofu|morno|meio|consider|warm|engajamento)/i
  const bofKw = /\b(bof|bofu|quente|hot|remar|retar|remarketing|retargeting|conv|compra|oferta)/i
  const hasTof = metaCamps.some(c => tofKw.test(c.name || ''))
  const hasMof = metaCamps.some(c => mofKw.test(c.name || ''))
  const hasBof = metaCamps.some(c => bofKw.test(c.name || ''))
  const funnelTiers = [hasTof && 'TOF', hasMof && 'MOF', hasBof && 'BOF'].filter(Boolean)

  let organizacaoFunil: string
  if (metaCamps.length === 0) {
    organizacaoFunil = 'Sem dados de campanhas disponíveis.'
  } else if (funnelTiers.length >= 2) {
    organizacaoFunil = `Estrutura de funil detectada com camadas ${funnelTiers.join('+')} nos nomes das campanhas. Confirmar separação de públicos por temperatura.`
  } else if (funnelTiers.length === 1) {
    organizacaoFunil = `Apenas campanhas de ${funnelTiers[0]} detectadas — ausência de estrutura completa de funil (TOF→MOF→BOF). Recomendado criar camadas de consideração e remarketing.`
  } else {
    organizacaoFunil = `${metaCamps.length} campanhas sem nomenclatura de funil. Padronizar com prefixos TOF/MOF/BOF para facilitar otimização e diagnóstico.`
  }

  const hasBofCamps = metaCamps.some(c => bofKw.test(c.name || ''))
  const separacaoPublicos = hasBofCamps
    ? 'Presença de campanhas de remarketing/BOF detectada. Confirmar audiências frio, morno e quente no Gerenciador de Anúncios.'
    : 'Sem campanhas de remarketing identificadas pelos nomes. Criar audiências separadas: visitantes 7d, 30d e leads sem conversão.'

  // Campanhas com desperdício crítico (gasto > 10% do total, zero leads)
  const wasteCamps = metaCamps.filter(c => (c.spend || 0) > totalSpend * 0.1 && (c.leads || 0) === 0)
  const highFreqCamps = metaCamps.filter(c => (c.frequency || 0) > 4)

  const metaErros: string[] = []
  if (realCPL > bench.cpl_max) metaErros.push(`CPL médio R$${realCPL} acima do benchmark — revisar estrutura de segmentação`)
  wasteCamps.forEach(c => metaErros.push(`"${c.name}" — R$${Math.round(c.spend).toLocaleString('pt-BR')} gastos sem conversão`))
  highFreqCamps.forEach(c => metaErros.push(`"${c.name}" — frequência ${c.frequency?.toFixed(1)}× (público saturado)`))

  const trackingProblemas: string[] = []
  if (pixelOk === false) trackingProblemas.push('Pixel com problema: gasto registrado mas zero leads via API — verificar evento de conversão no Events Manager')
  if (eventosDuplicados) trackingProblemas.push('ROAS extremamente alto — possível duplicidade de eventos de conversão. Auditar no Events Manager.')
  if (trackingProblemas.length === 0) {
    trackingProblemas.push(pixelOk === true
      ? 'Pixel registrando conversões corretamente. Validar se o evento otimizado corresponde ao lead real (não apenas PageView).'
      : 'Auditoria completa requer acesso ao Events Manager para validar eventos e API de Conversões.')
  }

  // ── Plano de ação DATA-DRIVEN: nomeia campanhas reais (pausar/escalar) com CPL real.
  // Cai no genérico só quando a conta não tem dados de campanha.
  const money = (n: number) => 'R$' + Math.round(n || 0).toLocaleString('pt-BR')
  const cplOf = (c: any) => ((c.leads || 0) > 0 ? (c.spend || 0) / c.leads : Infinity)
  const withLeads = metaCamps.filter(c => (c.leads || 0) > 0 && (c.spend || 0) > 0)
  const worstCamps = withLeads.filter(c => cplOf(c) > bench.cpl_max).sort((a, b) => cplOf(b) - cplOf(a)).slice(0, 3)
  const bestCamps  = withLeads.filter(c => cplOf(c) <= bench.cpl_min).sort((a, b) => cplOf(a) - cplOf(b)).slice(0, 2)
  const wasteTotal = wasteCamps.reduce((s, c) => s + (c.spend || 0), 0)

  const curto: any[] = []
  if (wasteCamps.length) {
    curto.push({
      acao: `Pausar ${wasteCamps.length} campanha(s) que gastam sem converter`,
      como: wasteCamps.slice(0, 3).map(c => `"${c.name}" (${money(c.spend)} gastos, 0 leads)`).join(' · '),
      impacto: `Recupera ~${money(wasteTotal)} já no próximo ciclo`,
    })
  }
  if (worstCamps.length) {
    const w = worstCamps[0]
    curto.push({
      acao: `Revisar/cortar a campanha de CPL mais alto: "${w.name}"`,
      como: `CPL ${money(cplOf(w))} — ${(cplOf(w) / Math.max(1, benchCPL)).toFixed(1)}× o benchmark (${money(benchCPL)}). Realocar a verba para os conjuntos eficientes.`,
      impacto: 'Alto — corta o maior ralo de CPL da conta',
    })
  }
  if (pixelOk === false) {
    curto.push({ acao: 'Corrigir o tracking (pixel + API de Conversões)', como: 'Gasto registrado e 0 leads via API — validar o evento de conversão no Events Manager e instalar a Conversions API.', impacto: 'Crítico — sem isso toda otimização é cega' })
  }
  if (!curto.length) {
    curto.push(
      { acao: 'Auditar tracking (pixel + API conversões)', como: 'Acessar o Meta Events Manager e verificar cada evento. Instalar Conversions API se não tiver.', impacto: 'Crítico — base de tudo' },
      { acao: `Definir CPL máximo de corte em ${money(bench.cpl_max)}`, como: 'Pausar automaticamente qualquer conjunto acima desse CPL por 3 dias seguidos.', impacto: 'Alto — reduz desperdício' },
    )
  }

  const medio: any[] = []
  if (bestCamps.length) {
    const b = bestCamps[0]
    medio.push({
      acao: `Escalar a campanha vencedora "${b.name}"`,
      como: `CPL ${money(cplOf(b))} (abaixo do piso ${money(bench.cpl_min)} do nicho). Subir budget 15–20%/semana enquanto o CPL segurar.`,
      impacto: '+volume de leads sem subir o CPL',
    })
  }
  medio.push({
    acao: hasBof ? 'Reforçar o remarketing existente em 3 camadas' : 'Criar estrutura de remarketing em 3 camadas',
    como: hasBof ? 'Já há campanhas de remarketing — separar visitantes 7d / 30d / leads sem conversão com criativos próprios.' : 'Sem remarketing detectado nos nomes das campanhas — criar audiências: visitantes 7d, 30d e leads sem conversão.',
    impacto: '+15–25% de conversão no funil total',
  })
  medio.push({ acao: 'Lançar ciclo de testes A/B de criativos', como: `Mínimo 3 criativos por conjunto para ${niche}: ângulo de dor vs. solução vs. prova social.`, impacto: 'CTR +30%, CPL -15%' })

  const longo: any[] = []
  longo.push({
    acao: funnelTiers.length >= 2 ? 'Otimizar o funil TOFU/MOFU/BOFU já existente' : 'Estruturar o funil completo TOFU/MOFU/BOFU',
    como: funnelTiers.length >= 2 ? `Funil com ${funnelTiers.join('+')} detectado — balancear verba entre as etapas e alinhar objetivos por temperatura.` : `Hoje há ${funnelTiers.length === 1 ? `só ${funnelTiers[0]}` : 'campanhas sem nomenclatura de funil'} — separar topo, meio e fundo com objetivos distintos.`,
    impacto: 'Escalabilidade sustentável',
  })
  longo.push({ acao: `Diversificar para ${bench.best_channels[1] || 'Google Search'}`, como: 'Após estabilizar o canal principal, abrir um 2º canal para captura de demanda e reduzir dependência.', impacto: 'Mais cobertura de mercado' })

  const planoAcao = { curto, medio, longo }

  return {
    health_score: score,
    grade,
    executive_summary: `Conta de ${clientName} (${niche}) com CPL real de R$${realCPL} vs benchmark R$${bench.cpl_min}–${bench.cpl_max}. ${allCampaigns.length} campanhas analisadas com investimento total de R$${Math.round(totalSpend).toLocaleString('pt-BR')}.`,

    visao_geral: {
      modelo_aquisicao: totalSpend > 0
        ? `Modelo de aquisição baseado em tráfego pago para ${niche}. Investimento de R$${Math.round(totalSpend).toLocaleString('pt-BR')} gerando ${totalLeads} leads com CPL médio de R$${realCPL}.`
        : `Análise de ${niche} baseada em benchmarks do mercado. Sem dados de performance disponíveis para o período selecionado — conecte a conta correta ou importe um relatório para análise real.`,
      desalinhamentos: realCPL > bench.cpl_max
        ? [`CPL ${Math.round(cplDiff)}% acima do benchmark do nicho — sinaliza desalinhamento entre criativo, audiência ou oferta`]
        : [`Performance dentro do benchmark do nicho ${niche}`],
      riscos: ['Dependência de um único canal de aquisição', pixelOk === false ? 'Pixel com problema detectado — conversões podem estar sub-registradas' : 'Validar tracking antes de escalar investimento'],
    },

    estrutura_campanhas: {
      meta: metaTotals || metaCamps.length > 0 ? {
        resumo: `${metaCamps.length || metaTotals?.campaignCount || '?'} campanhas no Meta Ads analisadas via API`,
        organizacao_funil: organizacaoFunil,
        separacao_publicos: separacaoPublicos,
        tipos_campanha: metaCamps.length > 0
          ? `Campanhas: ${metaCamps.slice(0, 3).map(c => `"${c.name}"`).join(', ')}${metaCamps.length > 3 ? ` e mais ${metaCamps.length - 3}` : ''}.`
          : 'Dados de campanha disponíveis via API.',
        erros: metaErros,
      } : null,
      google: googleTotals || googleCamps.length > 0 ? {
        resumo: `${googleCamps.length || '?'} campanhas no Google Ads`,
        organizacao: googleCamps.length > 0
          ? `Campanhas detectadas: ${googleCamps.slice(0,3).map(c => `"${c.name}"`).join(', ')}.`
          : 'Estrutura disponível via export de campanhas.',
        palavras_chave_estrutura: 'Verificar separação de campanhas por intenção de compra.',
        tipos_campanha: 'Conferir uso correto de Search vs PMAX vs Display.',
        erros: [],
      } : null,
    },

    tracking: {
      meta: metaTotals || metaCamps.length > 0 ? {
        pixel_ok: pixelOk,
        api_conversoes: metaLeads > 0 ? true : null,
        eventos_duplicados: eventosDuplicados,
        problemas: trackingProblemas,
      } : null,
      google: googleTotals || googleCamps.length > 0 ? {
        conversoes_confiaveis: (googleTotals?.leads || 0) > 0 ? true : null,
        importacao_correta: null,
        problema_vaidade: null,
        problemas: ['Verificar importação de conversões GA4 vs tag direta — conferir no Google Ads'],
      } : null,
      prioridade_maxima: pixelOk === false || eventosDuplicados === true,
      alerta: pixelOk === false
        ? 'CRÍTICO: Pixel registrando gasto sem conversões — otimização do algoritmo está comprometida. Corrija o evento de conversão antes de continuar investindo.'
        : 'Audite o tracking manualmente — é a base de toda otimização. Sem tracking correto, todo o restante é suposição.',
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

    plano_acao: planoAcao,

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

// Detecta se o texto de uma ação indica problema crítico e sobe a urgência
function escalateUrgency(text: string, base: string): string {
  const t = text.toLowerCase()
  const CRITICAL_SIGNALS = [
    'tracking', 'pixel', 'sem conversão', 'zero conversão', 'sem leads', 'zero leads',
    'gasto sem resultado', 'gasto sem conversão', 'desperdício crítico', 'cpl muito acima',
    'roas negativo', 'roas abaixo de 1', 'cpl crítico', 'pausar urgente', 'parar imediatamente',
    'evento mal configurado', 'pixel quebrado', 'tracking quebrado', 'sem rastreamento',
  ]
  const HIGH_SIGNALS = [
    'frequência alta', 'fadiga criativa', 'ctr muito baixo', 'cpl acima do benchmark',
    'roas abaixo', 'sem remarketing', 'landing page', 'lp com problema', 'atendimento lento',
  ]
  if (CRITICAL_SIGNALS.some((p) => t.includes(p))) return 'critica'
  if (base === 'media' && HIGH_SIGNALS.some((p) => t.includes(p))) return 'alta'
  return base
}

function extractPriorityActions(audit: any, platform: string, clientId: string, clientName: string): any[] {
  const plan = audit.plano_acao
  if (!plan) return []
  const actions: any[] = []
  const plat = platform as 'meta' | 'google' | 'ambos'
  const now = new Date().toISOString()
  const origin = `audit_${now.slice(0, 10)}_${clientName.toLowerCase().replace(/\s+/g, '_')}`

  // Infere a métrica principal a partir do texto da ação
  const inferMetric = (text: string): string | undefined => {
    const t = text.toLowerCase()
    if (t.includes('cpl') || t.includes('custo por lead')) return 'CPL'
    if (t.includes('roas') || t.includes('retorno')) return 'ROAS'
    if (t.includes('ctr') || t.includes('clique')) return 'CTR'
    if (t.includes('frequência') || t.includes('frequencia')) return 'Frequência'
    if (t.includes('tracking') || t.includes('pixel') || t.includes('conversão')) return 'Tracking'
    if (t.includes('criativo') || t.includes('anúncio') || t.includes('creative')) return 'Criativo'
    if (t.includes('orçamento') || t.includes('budget') || t.includes('verba')) return 'Orçamento'
    return undefined
  }

  let priority = 1
  const toAction = (item: any, baseUrgency: string) => {
    const title = item.acao || item.titulo || ''
    const description = item.como || item.descricao || ''
    const impact = item.impacto || ''
    const fullText = `${title} ${description} ${impact}`
    const urgency = escalateUrgency(fullText, baseUrgency)
    return {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      clientId,
      title,
      description,
      platform: plat,
      urgency,
      priority: priority++,
      impact,
      metric: inferMetric(fullText),
      evidence: item.evidencia || item.dado || undefined,
      status: 'pendente',
      source: 'auditoria',
      origin,
      relatedCampaign: item.campanha || item.campaign || undefined,
      relatedAdSet:    item.conjunto || item.adset || undefined,
      relatedAd:       item.anuncio  || item.ad    || undefined,
      createdAt: now,
      updatedAt: now,
    }
  }

  ;(plan.curto || []).forEach((a: any) => actions.push(toAction(a, 'critica')))
  ;(plan.medio || []).forEach((a: any) => actions.push(toAction(a, 'alta')))
  ;(plan.longo || []).forEach((a: any) => actions.push(toAction(a, 'media')))

  return actions.slice(0, 12)
}

// ── Persistência centralizada com logs e status granular ─────────────────────
async function runPersistence(
  userId: string,
  clientName: string,
  audit: any,
  realMetrics: any,
  dataSources: string[],
  source: 'ai' | 'benchmark',
  priorityActions: any[],
): Promise<{ auditReportId: string | null; dbActions: any[]; status: Record<string, any> }> {
  const status: Record<string, any> = {
    auditReportSaved:      false,
    priorityActionsSaved:  false,
    healthScoreSaved:      false,
    auditReportId:         null as string | null,
    actionsSaved:          0,
    errors:                [] as string[],
  }
  let dbActions: any[] = []

  console.info('[AUDIT_PERSISTENCE_START]', {
    userId:             userId.slice(0, 8) + '…',
    clientName,
    source,
    supabaseAdminReady: !!supabaseAdmin,
    actionsCount:       priorityActions.length,
    hasHealthScore:     !!audit.health_score,
  })

  if (!supabaseAdmin) {
    const msg = 'supabaseAdmin=null — SUPABASE_SERVICE_ROLE_KEY ausente ou NEXT_PUBLIC_SUPABASE_URL não configurada'
    status.errors.push(msg)
    console.error('[AUDIT_PERSISTENCE] BLOQUEADO:', msg)
    return { auditReportId: null, dbActions, status }
  }

  // STEP 1 — audit_reports
  try {
    const id = await saveAuditReport(userId, clientName, audit, realMetrics, dataSources, source)
    if (id) {
      status.auditReportSaved = true
      status.auditReportId   = id
      console.info('[AUDIT_PERSISTENCE] audit_reports: OK', { id, clientName, score: audit.health_score })
    } else {
      const msg = 'saveAuditReport retornou null — verifique RLS e SUPABASE_SERVICE_ROLE_KEY'
      status.errors.push(msg)
      console.error('[AUDIT_PERSISTENCE] audit_reports: insert retornou null —', msg)
    }
  } catch (e: any) {
    status.errors.push(`saveAuditReport: ${e.message}`)
    console.error('[AUDIT_PERSISTENCE] audit_reports: exception', e.message)
  }

  // STEP 2 — priority_actions (independente do audit_report — salva mesmo sem auditReportId)
  if (priorityActions.length > 0) {
    try {
      const rawForDB = priorityActions.map((a: any) => ({
        clientId:        userId,
        title:           a.title,
        description:     a.description,
        platform:        a.platform,
        source:          a.source,
        priority:        a.priority,
        urgency:         a.urgency,
        metric:          a.metric,
        evidence:        a.evidence,
        impact:          a.impact,
        origin:          a.origin,
        relatedCampaign: a.relatedCampaign,
        relatedAdSet:    a.relatedAdSet,
        relatedAd:       a.relatedAd,
        auditReportId:   status.auditReportId,
      }))
      dbActions = await upsertPriorityActions(userId, clientName, rawForDB)
      if (dbActions.length > 0) {
        status.priorityActionsSaved = true
        status.actionsSaved         = dbActions.length
        console.info('[AUDIT_PERSISTENCE] priority_actions: OK', { saved: dbActions.length, total: rawForDB.length })
      } else {
        const msg = `upsertPriorityActions: 0/${rawForDB.length} ações salvas`
        status.errors.push(msg)
        console.error('[AUDIT_PERSISTENCE] priority_actions: nenhuma ação persistida —', msg)
      }
    } catch (e: any) {
      status.errors.push(`upsertPriorityActions: ${e.message}`)
      console.error('[AUDIT_PERSISTENCE] priority_actions: exception', e.message)
    }
  }

  // STEP 3 — client_health_scores (independente dos passos anteriores)
  if (audit.health_score) {
    try {
      const hs = await upsertHealthScore(userId, clientName, audit.health_score, audit.grade || 'B', source, status.auditReportId)
      if (hs) {
        status.healthScoreSaved = true
        console.info('[AUDIT_PERSISTENCE] health_score: OK', { score: audit.health_score, grade: audit.grade })
      } else {
        const msg = 'upsertHealthScore retornou null'
        status.errors.push(msg)
        console.error('[AUDIT_PERSISTENCE] health_score:', msg)
      }
    } catch (e: any) {
      status.errors.push(`upsertHealthScore: ${e.message}`)
      console.error('[AUDIT_PERSISTENCE] health_score: exception', e.message)
    }
  }

  console.info('[AUDIT_PERSISTENCE_DONE]', {
    auditReportSaved:     status.auditReportSaved,
    priorityActionsSaved: status.priorityActionsSaved,
    healthScoreSaved:     status.healthScoreSaved,
    actionsSaved:         status.actionsSaved,
    errorsCount:          (status.errors as string[]).length,
  })

  return { auditReportId: status.auditReportId, dbActions, status }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

    const { rateLimit } = await import('@/lib/rateLimit')
    const rl = rateLimit(userId, 'audit', { max: 5, windowSec: 3600 })
    if (!rl.ok) {
      const waitSec = rl.retryAfterSec ?? 3600
      const minutesLeft = Math.ceil(waitSec / 60)
      return NextResponse.json({
        success: false,
        error: `Você atingiu o limite de 5 auditorias por hora. Aguarde ${minutesLeft} minuto${minutesLeft !== 1 ? 's' : ''} antes de tentar novamente.`,
      }, {
        status: 429,
        headers: { 'Retry-After': String(waitSec) },
      })
    }

    const { clerkClient } = await import('@clerk/nextjs/server')
    const clerkUser = await (await clerkClient()).users.getUser(userId)
    const plan = (clerkUser.publicMetadata as any)?.plan as string | undefined
    const hasActivePlan = plan && plan !== 'free'
    const createdAtMs = typeof clerkUser.createdAt === 'number' ? clerkUser.createdAt : new Date(clerkUser.createdAt as any).getTime()
    const inTrial = (Date.now() - createdAtMs) < 14 * 24 * 60 * 60 * 1000
    if (!hasActivePlan && !inTrial) {
      return NextResponse.json({ success: false, error: 'Período de avaliação encerrado.' }, { status: 402 })
    }
    const effectivePlan = hasActivePlan ? plan! : (inTrial ? 'trial' : 'free')

    const { checkAndDeductCredits, refundCredits } = await import('@/lib/credits')
    const creditResult = await checkAndDeductCredits(userId, effectivePlan, 'audit')
    if (!creditResult.allowed) {
      return NextResponse.json({ success: false, error: creditResult.error }, { status: 402 })
    }

    const body = await req.json()
    const {
      clientName: _cn,
      niche: _ni,
      budget            = 0,
      objective: _obj   = '',
      metaCampaigns     = [],
      metaTotals        = null,
      googleCampaigns   = [],
      googleTotals      = null,
      uploadedFiles     = [],
      uploadedCampaigns = [],
      uploadedPlatform  = null,
      datePreset        = 'last_30d',
      period            = null,
      auditSource       = 'auto',
      previousAudits    = [],
    } = body
    const clientName = sanitizeText(_cn, 120)
    const niche      = sanitizeText(_ni, 120)
    const objective  = sanitizeText(_obj, 300)

    if (!clientName || !niche) {
      return NextResponse.json({ success: false, error: 'clientName e niche são obrigatórios.' }, { status: 400 })
    }

    // hasMeta/hasGoogle reflect o que está conectado (para contexto de UI e fallback)
    const hasMeta   = metaTotals !== null || metaCampaigns.length > 0
    const hasGoogle = googleTotals !== null || googleCampaigns.length > 0

    // Suporte a múltiplos arquivos (novo) e arquivo único (legado)
    const allUploadedFiles: Array<{ filename: string; platform: string; campaigns: any[] }> = uploadedFiles.length > 0
      ? uploadedFiles
      : uploadedCampaigns.length > 0
        ? [{ filename: 'arquivo.csv', platform: uploadedPlatform || 'desconhecido', campaigns: uploadedCampaigns }]
        : []

    // ── Source selection — qual fonte alimenta as métricas desta auditoria ────
    // 'api':        só dados da API (ignora uploads da mesma plataforma)
    // 'upload':     só arquivo importado (ignora dados da API)
    // 'consolidate': soma tudo (comportamento legado — só usar se períodos compatíveis)
    // 'auto':       padrão — consolida com aviso quando há conflito
    const srcMetaTotals      = auditSource === 'upload' ? null : metaTotals
    const srcMetaCampaigns   = auditSource === 'upload' ? [] : [...metaCampaigns]
    const srcGoogleTotals    = auditSource === 'upload' ? null : googleTotals
    const srcGoogleCampaigns = auditSource === 'upload' ? [] : [...googleCampaigns]
    const srcUploadedFiles   = auditSource === 'api'    ? [] : allUploadedFiles
    const srcUploadedCampaigns = srcUploadedFiles.flatMap((f: any) => f.campaigns)
    const srcHasMeta   = srcMetaTotals !== null || srcMetaCampaigns.length > 0
    const srcHasGoogle = srcGoogleTotals !== null || srcGoogleCampaigns.length > 0
    const hasUpload    = srcUploadedCampaigns.length > 0

    if (!srcHasMeta && !srcHasGoogle && !hasUpload) {
      return NextResponse.json({
        success: false,
        error: 'Conecte uma conta de anúncios ou importe pelo menos um arquivo CSV/XLSX para auditar.',
      }, { status: 400 })
    }

    const bench = getBenchmark(niche)
    const benchmarkText = getBenchmarkSummary(niche)
    // allCampaigns usa SOMENTE as fontes selecionadas pelo usuário
    const allCampaigns = [...srcMetaCampaigns, ...srcGoogleCampaigns, ...srcUploadedCampaigns]

    // ── Totais de arquivos enviados — usa MAX spend por plataforma ─────────────
    // Quando o usuário sobe 2 arquivos do mesmo Meta (ex: conjuntos + anúncios),
    // os totais seriam duplicados se simplesmente somados. A heurística: para
    // cada plataforma, usa o arquivo com maior investimento total (mais completo).
    const platformBest: Record<string, { spend: number; leads: number }> = {}
    for (const file of srcUploadedFiles) {
      const p = (file as any).platform || 'unknown'
      const fs = (file as any).campaigns.reduce((s: number, c: any) => s + (c.spend || 0), 0)
      const fl = (file as any).campaigns.reduce((s: number, c: any) => s + (c.leads || 0), 0)
      if (!platformBest[p] || fs > platformBest[p].spend) {
        platformBest[p] = { spend: fs, leads: fl }
      }
    }
    const uploadTotalSpend = Object.values(platformBest).reduce((s, v) => s + v.spend, 0)
    const uploadTotalLeads = Object.values(platformBest).reduce((s, v) => s + v.leads, 0)
    const totalSpend = (srcMetaTotals?.spend || 0) + (srcGoogleTotals?.spend || 0) + uploadTotalSpend
    const totalLeads = (srcMetaTotals?.leads || 0) + (srcGoogleTotals?.leads || 0) + uploadTotalLeads
    const realCPL    = totalLeads > 0 ? +(totalSpend / totalLeads).toFixed(2) : 0

    // ── Métricas reais agregadas (usadas pelo Overview) ────────────────────────
    // IMPORTANTE: impressions/clicks/revenue vêm como STRING da API do Meta/Google.
    // Sem Number() o "+" CONCATENA strings → número astronômico (bug do funil).
    const num = (v: any) => Number(v) || 0
    const totalImpressions = allCampaigns.reduce((s: number, c: any) => s + num(c.impressions), 0)
      + num(srcMetaTotals?.impressions) + num(srcGoogleTotals?.impressions)
    const totalClicks = allCampaigns.reduce((s: number, c: any) => s + num(c.clicks), 0)
      + num(srcMetaTotals?.clicks) + num(srcGoogleTotals?.clicks)
    const totalRevenue = allCampaigns.reduce((s: number, c: any) => s + num(c.revenue ?? c.conversionValue), 0)
      + num(srcMetaTotals?.revenue) + num(srcGoogleTotals?.revenue)
    const avgROAS = totalSpend > 0 && totalRevenue > 0 ? +(totalRevenue / Number(totalSpend)).toFixed(2) : null
    const avgCTR  = totalImpressions > 0 ? +((totalClicks / totalImpressions) * 100).toFixed(2) : null

    const realMetrics = {
      totalSpend:    Math.round(Number(totalSpend)),
      totalLeads:    Math.round(totalLeads),
      totalRevenue:  Math.round(totalRevenue),
      totalClicks:   Math.round(totalClicks),
      totalImpressions: Math.round(totalImpressions),
      avgCPL:        totalLeads > 0 ? Math.round(Number(totalSpend) / totalLeads) : null,
      avgROAS,
      avgCTR,
      campaignCount: allCampaigns.length,
      dataSource:    srcHasMeta && srcHasGoogle ? 'meta+google' : srcHasMeta ? 'meta' : srcHasGoogle ? 'google' : 'upload',
    }

    // ── Memória viva: evolução vs auditorias anteriores deste cliente ──────────
    // O frontend envia previousAudits (resumos das auditorias passadas). Calcula
    // deltas para a IA referenciar a evolução e para a UI mostrar a tendência.
    const prevList = Array.isArray(previousAudits) ? previousAudits.filter((p: any) => p && (p.health_score != null || p.avgCPL != null)) : []
    const prevAudit = prevList[0] || null
    const pct = (cur: number, prev: number) => (prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null)
    const evolution = prevAudit ? {
      sinceDate:      prevAudit.date ?? null,
      cplDelta:       (realMetrics.avgCPL != null && prevAudit.avgCPL != null) ? pct(realMetrics.avgCPL, prevAudit.avgCPL) : null,
      leadsDelta:     (prevAudit.totalLeads != null) ? pct(realMetrics.totalLeads, prevAudit.totalLeads) : null,
      spendDelta:     (prevAudit.totalSpend != null) ? pct(realMetrics.totalSpend, prevAudit.totalSpend) : null,
      prevScore:      prevAudit.health_score ?? null,
      prevCPL:        prevAudit.avgCPL ?? null,
      count:          prevList.length,
    } : null

    const evolutionText = prevList.length > 0 ? `

EVOLUÇÃO HISTÓRICA DESTE CLIENTE (auditorias anteriores — use para comparar e mostrar progresso/regressão real):
${prevList.slice(0, 3).map((p: any, i: number) => `- ${p.date ? new Date(p.date).toLocaleDateString('pt-BR') : `auditoria ${i + 1}`}: score ${p.health_score ?? '—'}/100${p.grade ? ` (${p.grade})` : ''}, investido R$${Math.round(p.totalSpend || 0).toLocaleString('pt-BR')}, ${p.totalLeads ?? 0} leads, CPL R$${p.avgCPL ?? '—'}`).join('\n')}
Agora: investido R$${realMetrics.totalSpend.toLocaleString('pt-BR')}, ${realMetrics.totalLeads} leads, CPL R$${realMetrics.avgCPL ?? '—'}.
INSTRUÇÃO: Comece o resumo executivo referenciando a EVOLUÇÃO real vs a auditoria anterior (melhorou ou piorou? em quê?). Aponte padrões que se repetem (ex.: mesma campanha vencedora/perdedora reaparecendo). Seja específico com os números do delta.` : ''

    // RAG read-back: histórico aprendido (memória de auditorias anteriores)
    const memoryContext = await getClientMemoryContext(userId, clientName, niche)

    // ── Classificação determinística de campanhas ─────────────────────────────
    // Roda ANTES do prompt para que a IA receba classificações pré-calculadas
    // e para que a resposta final inclua os dados mesmo no fallback.
    const classifiedCampaigns = (() => {
      const camps = allCampaigns.filter((c: any) => (c.spend || 0) > 0)
      const vencedoras: any[] = [], atencao: any[] = [], criticas: any[] = []
      const leadsValid = camps.filter((x: any) => (x.leads || 0) > 0)
      const avgCPLRef = leadsValid.length > 0
        ? leadsValid.reduce((s: number, x: any) => s + x.spend / x.leads, 0) / leadsValid.length
        : 0
      for (const c of camps) {
        const cpl = (c.leads || 0) > 0 ? c.spend / c.leads : null
        if (bench) {
          if (cpl !== null && cpl <= bench.cpl_min * 1.3)       vencedoras.push(c)
          else if (cpl !== null && cpl <= bench.cpl_max * 1.2)  atencao.push(c)
          else                                                    criticas.push(c)
        } else {
          if (avgCPLRef > 0 && cpl !== null && cpl < avgCPLRef * 0.7) vencedoras.push(c)
          else if (avgCPLRef > 0 && cpl !== null && cpl < avgCPLRef * 1.5) atencao.push(c)
          else                                                    criticas.push(c)
        }
      }

      const enrich = (c: any, type: 'vencedora' | 'atencao' | 'critica') => {
        const cpl = (c.leads || 0) > 0 ? c.spend / c.leads : null
        let evidence = ''
        let recommended_action = ''
        if (type === 'vencedora') {
          const pctBelow = bench && cpl && bench.cpl_min > 0 ? Math.round((1 - cpl / bench.cpl_min) * 100) : 0
          evidence = cpl
            ? `CPL R$${Math.round(cpl)}${bench ? ` — ${pctBelow > 0 ? `${pctBelow}% abaixo do mínimo benchmark (R$${bench.cpl_min})` : 'no mínimo do benchmark'}` : ' — melhor CPL da conta'}`
            : 'Alta performance relativa à conta'
          recommended_action = 'Escalar gradualmente: +20–30% de verba por semana mantendo CPL controlado.'
        } else if (type === 'atencao') {
          evidence = cpl
            ? `CPL R$${Math.round(cpl)}${bench ? ` — dentro do benchmark (R$${bench.cpl_min}–R$${bench.cpl_max})` : ' — acima da média mas com conversões'}`
            : 'Conversões registradas, mas volume baixo'
          recommended_action = 'Manter e otimizar: revisar público, criativo e oferta antes de escalar.'
        } else {
          if (!c.leads || c.leads === 0) {
            evidence = `R$${Math.round(c.spend || 0).toLocaleString('pt-BR')} investidos sem nenhuma conversão registrada`
            recommended_action = 'Pausar e investigar: verificar criativo, público, página de destino e evento de conversão.'
          } else {
            const pctAbove = bench && cpl && bench.cpl_max > 0 ? Math.round((cpl / bench.cpl_max - 1) * 100) : 0
            evidence = cpl
              ? `CPL R$${Math.round(cpl)}${bench ? ` — ${pctAbove > 0 ? `${pctAbove}% acima do máximo benchmark (R$${bench.cpl_max})` : 'no limite do benchmark'}` : ' — acima da média da conta'}`
              : 'Performance insuficiente'
            recommended_action = 'Reduzir verba em 50% e revisar: novo ângulo criativo e segmentação de público.'
          }
        }
        return { ...c, evidence, recommended_action }
      }

      return {
        vencedoras: vencedoras.sort((a, b) => (a.spend / Math.max(a.leads, 1)) - (b.spend / Math.max(b.leads, 1))).slice(0, 8).map(c => enrich(c, 'vencedora')),
        atencao:    atencao.sort((a, b) => (b.spend || 0) - (a.spend || 0)).slice(0, 8).map(c => enrich(c, 'atencao')),
        criticas:   criticas.sort((a, b) => (b.spend || 0) - (a.spend || 0)).slice(0, 8).map(c => enrich(c, 'critica')),
      }
    })()

    // ── Desperdício de verba ──────────────────────────────────────────────────
    const wasteCampaigns = allCampaigns
      .filter((c: any) => (c.spend || 0) > 0 && (c.leads || 0) === 0)
      .sort((a: any, b: any) => (b.spend || 0) - (a.spend || 0))
      .slice(0, 8)
    const totalWaste     = wasteCampaigns.reduce((s: number, c: any) => s + (c.spend || 0), 0)
    const wastePercent   = Number(totalSpend) > 0 ? +((totalWaste / Number(totalSpend)) * 100).toFixed(1) : 0

    // ── Detecção de inconsistência API + arquivo do mesmo canal ───────────────
    // Só avisa quando o usuário NÃO fez escolha explícita de fonte.
    // Em modo 'api' ou 'upload' a inconsistência foi resolvida pelo seletor.
    const dataWarnings: string[] = []
    if (auditSource === 'auto' || auditSource === 'consolidate') {
      const metaUploads = allUploadedFiles.filter((f: any) => f.platform === 'meta')
      if (hasMeta && metaUploads.length > 0) {
        const metaUp  = metaUploads.reduce((s: number, f: any) => s + f.campaigns.reduce((ss: number, c: any) => ss + (c.spend || 0), 0), 0)
        const metaApi = metaTotals?.spend || 0
        if (metaUp > metaApi * 0.3 && metaApi > 0) {
          dataWarnings.push(`Meta Ads: API retornou R$${Math.round(metaApi).toLocaleString('pt-BR')} e o arquivo importado contém R$${Math.round(metaUp).toLocaleString('pt-BR')}. Se cobrem o mesmo período e conta, o investimento total pode estar duplicado. Use o seletor de fonte para escolher qual usar.`)
        }
      }
      const gUploads = allUploadedFiles.filter((f: any) => f.platform === 'google')
      if (hasGoogle && gUploads.length > 0) {
        const gUp  = gUploads.reduce((s: number, f: any) => s + f.campaigns.reduce((ss: number, c: any) => ss + (c.spend || 0), 0), 0)
        const gApi = googleTotals?.spend || 0
        if (gUp > gApi * 0.3 && gApi > 0) {
          dataWarnings.push(`Google Ads: API (R$${Math.round(gApi).toLocaleString('pt-BR')}) + arquivo importado (R$${Math.round(gUp).toLocaleString('pt-BR')}) — totais podem estar duplicados se cobrem o mesmo período.`)
        }
      }
    }

    // ── Qualidade dos dados ───────────────────────────────────────────────────
    const dataQuality = (() => {
      const issues: string[] = []
      let score = 0
      if (srcHasMeta || srcHasGoogle) score += 35; else if (hasUpload) score += 25
      if (Number(totalSpend) > 0) score += 25; else issues.push('Sem dados de investimento')
      if (totalLeads > 0) score += 25; else issues.push('Sem dados de conversão')
      if (avgROAS !== null) score += 10
      if (allCampaigns.length > 0) score += 5
      const confidence: 'alta' | 'media' | 'baixa' = score >= 70 ? 'alta' : score >= 40 ? 'media' : 'baixa'

      const reasonParts: string[] = []
      if (srcHasMeta || srcHasGoogle) reasonParts.push(`dados reais de API (${auditSource === 'api' ? 'somente API' : 'consolidado'})`)
      else if (hasUpload) reasonParts.push('dados de arquivo importado')
      if (totalLeads === 0) reasonParts.push('sem conversões registradas')
      if (avgROAS === null) reasonParts.push('ROAS não calculado')
      if (dataWarnings.length > 0) reasonParts.push('possível inconsistência de fontes detectada')
      const apiOrUpload = reasonParts.find(p => p.startsWith('dados'))
      const problems = reasonParts.filter(p => !p.startsWith('dados'))
      const reason = confidence === 'alta'
        ? `Dados reais de API disponíveis com investimento, conversões e métricas completas.`
        : `Confiança ${confidence === 'media' ? 'média' : 'baixa'}: ${[apiOrUpload, ...problems].filter(Boolean).join(', ')}.`
      return { confidence, issues, reason }
    })()

    // ── Checklist de tracking (determinístico — base para a seção de tracking) ─
    const trackingChecklist = [
      {
        id: 'pixel', label: 'Pixel instalado',
        status: (srcHasMeta || hasUpload) ? (totalLeads > 0 ? 'verificado' : 'nao_verificado') : 'indisponivel',
      },
      { id: 'api_conv',    label: 'API de Conversões ativa',               status: 'nao_verificado' as const },
      {
        id: 'evento_lead', label: 'Evento Lead configurado',
        status: totalLeads > 0 ? 'verificado' : 'nao_verificado',
      },
      { id: 'deduplicacao', label: 'Deduplicação ativa',                   status: 'nao_verificado' as const },
      {
        id: 'evento_compra', label: 'Evento de compra/receita configurado',
        status: totalRevenue > 0 ? 'verificado' : 'nao_verificado',
      },
      { id: 'utms',          label: 'UTMs instaladas',                     status: 'nao_verificado' as const },
      { id: 'crm',           label: 'CRM/planilha confere leads reais',    status: 'nao_verificado' as const },
      {
        id: 'evento_otimizado', label: 'Evento otimizado corresponde ao objetivo da campanha',
        status: totalLeads > 0 ? 'verificado' : 'nao_verificado',
      },
    ]

    // ── Período legível ────────────────────────────────────────────────────────
    const periodLabel = period ? `${period.startDate} a ${period.endDate}`
      : datePreset === 'last_7d'    ? 'Últimos 7 dias'
      : datePreset === 'last_90d'   ? 'Últimos 90 dias'
      : datePreset === 'this_month' ? 'Este mês'
      : datePreset === 'last_month' ? 'Mês anterior'
      : 'Últimos 30 dias'

    // Fallback aditivo: se o Claude falhar, o Gemini preenche este audit (mesmo
    // enriquecimento/persistência do caminho de benchmark mais abaixo).
    let geminiAudit: Record<string, any> | null = null

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (apiKey) {
      let prompt = ''  // hoisted: usado também no fallback do Gemini (catch)
      try {
        const { default: Anthropic } = await import('@anthropic-ai/sdk')
        const anthropic = new Anthropic({ apiKey })

        // ── Monta o contexto completo de dados ─────────────────────────────
        const metaSummary = srcHasMeta ? `
=== META ADS ===
Fonte dos dados: ${auditSource === 'upload' ? 'arquivo importado' : 'API Meta Ads'}
Gasto: R$${(srcMetaTotals?.spend || 0).toFixed(2)} | Impressões: ${(srcMetaTotals?.impressions || 0).toLocaleString('pt-BR')} | Cliques: ${srcMetaTotals?.clicks || 0}
CTR: ${srcMetaTotals?.ctr || 0}% | CPL: R$${srcMetaTotals?.cpl || 0} | ROAS: ${srcMetaTotals?.roas || 0}× | Leads: ${srcMetaTotals?.leads || 0}
Campanhas (${srcMetaCampaigns.length}):
${srcMetaCampaigns.slice(0, 20).map((c: any) =>
  `  [${c.status || 'ACTIVE'}] ${c.name}
   Gasto: R$${(c.spend||0).toFixed(2)} | Leads: ${c.leads||0} | CPL: R$${(c.cpl||0).toFixed(2)} | CTR: ${(c.ctr||0).toFixed(2)}% | ROAS: ${(c.roas||0).toFixed(2)}× | Frequência: ${(c.frequency||0).toFixed(1)}`
).join('\n')}` : ''

        const googleSummary = srcHasGoogle ? `
=== GOOGLE ADS ===
Fonte dos dados: ${auditSource === 'upload' ? 'arquivo importado' : 'API Google Ads'}
Gasto: R$${(srcGoogleTotals?.spend || 0).toFixed(2)} | Impressões: ${(srcGoogleTotals?.impressions || 0).toLocaleString('pt-BR')} | Cliques: ${srcGoogleTotals?.clicks || 0}
CTR: ${srcGoogleTotals?.ctr || 0}% | CPL: R$${srcGoogleTotals?.cpl || 0} | ROAS: ${srcGoogleTotals?.roas || 0}× | Conversões: ${srcGoogleTotals?.leads || 0}
(ATENÇÃO: conversões no Google Ads podem incluir múltiplas ações configuradas na conta — verificar se o evento otimizado é o correto)
Campanhas (${srcGoogleCampaigns.length}):
${srcGoogleCampaigns.slice(0, 20).map((c: any) =>
  `  [${c.status || 'ACTIVE'}] ${c.name}
   Gasto: R$${(c.spend||0).toFixed(2)} | Conv.: ${c.leads||0} | CPA: R$${(c.cpl||0).toFixed(2)} | CTR: ${(c.ctr||0).toFixed(2)}%`
).join('\n')}` : ''

        const uploadSummary = srcUploadedFiles.length > 0 ? srcUploadedFiles.map((file: any) => `
=== ARQUIVO IMPORTADO: ${file.filename.toUpperCase()} [${(file.platform || 'desconhecido').toUpperCase()}] ===
Total de campanhas/anúncios: ${file.campaigns.length}
${file.campaigns.slice(0, 25).map((c: any) =>
  `  [${c.status || '-'}] ${c.name}${c.adName && c.adName !== c.name ? ` / Anúncio: ${c.adName}` : ''}
   Gasto: R$${(c.spend||0).toFixed(2)} | Leads: ${c.leads||0} | CPL: R$${(c.cpl||0).toFixed(2)} | CTR: ${(c.ctr||0).toFixed(2)}% | ROAS: ${(c.roas||0).toFixed(2)}×${c.frequency ? ` | Freq: ${c.frequency}` : ''}${c.placement ? ` | Pos: ${c.placement}` : ''}`
).join('\n')}
Subtotal: Gasto R$${file.campaigns.reduce((s:number,c:any)=>s+(c.spend||0),0).toFixed(2)} | Leads ${file.campaigns.reduce((s:number,c:any)=>s+(c.leads||0),0)}`
        ).join('\n') : ''

        // ── Detecção de anomalias e qualidade de dados ─────────────────
        const allCamps = allCampaigns  // já filtrado pelo auditSource
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

        // ── Pré-análise de campanhas: ranking por eficiência ───────────────
        const rankedCamps = [...allCampaigns]
          .filter((c: any) => (c.spend || 0) > 0)
          .sort((a: any, b: any) => {
            // Campanhas com leads: ordena por CPA crescente (menor = melhor)
            if ((a.leads || 0) > 0 && (b.leads || 0) > 0)
              return (a.cpl || a.spend / a.leads) - (b.cpl || b.spend / b.leads)
            // Campanhas sem leads: vai para o final
            if ((a.leads || 0) === 0) return 1
            if ((b.leads || 0) === 0) return -1
            return 0
          })

        const campRankingText = rankedCamps.length > 0 ? `
=== RANKING DE CAMPANHAS POR EFICIÊNCIA (pré-calculado — use estes dados) ===
${rankedCamps.map((c: any, i: number) => {
  const cpa = c.leads > 0 ? Math.round(c.spend / c.leads) : null
  const efficiency = cpa === null ? '⛔ SEM CONVERSÃO' :
    (bench && cpa <= bench.cpl_min * 1.1) ? '🏆 EXCELENTE' :
    (bench && cpa <= bench.cpl_max) ? '✅ DENTRO DO BENCHMARK' :
    (bench && cpa <= bench.cpl_max * 2) ? '⚠ ACIMA DO BENCHMARK' : '🔴 CRÍTICO'
  return `  ${i+1}. [${efficiency}] "${c.name}"${c.campaignType ? ` (${c.campaignType})` : ''}
     Gasto: R$${Math.round(c.spend).toLocaleString('pt-BR')} | Conversões: ${c.leads || 0} | CPA: ${cpa ? `R$${cpa}` : 'N/A'} | CTR: ${(c.ctr||0).toFixed(2)}%${c.roas ? ` | ROAS: ${c.roas.toFixed(1)}×` : ''}`
}).join('\n')}

Campanhas CRÍTICAS (gasto alto, zero conversões):
${rankedCamps.filter((c: any) => (c.leads || 0) === 0).map((c: any) =>
  `  ⛔ "${c.name}" — R$${Math.round(c.spend).toLocaleString('pt-BR')} GASTOS SEM RESULTADO`
).join('\n') || '  Nenhuma'}

Melhor campanha: ${rankedCamps[0] ? `"${rankedCamps[0].name}" (CPA R$${rankedCamps[0].leads > 0 ? Math.round(rankedCamps[0].spend / rankedCamps[0].leads) : 'N/A'})` : 'N/A'}
Pior campanha com gasto: ${rankedCamps.filter((c:any) => c.leads === 0).length > 0
  ? `"${rankedCamps.filter((c:any) => c.leads === 0).sort((a:any,b:any) => b.spend - a.spend)[0].name}" (R$${Math.round(rankedCamps.filter((c:any) => c.leads === 0).sort((a:any,b:any) => b.spend - a.spend)[0].spend).toLocaleString('pt-BR')} sem conversão)`
  : rankedCamps[rankedCamps.length-1] ? `"${rankedCamps[rankedCamps.length-1].name}" (CPA R$${rankedCamps[rankedCamps.length-1].leads > 0 ? Math.round(rankedCamps[rankedCamps.length-1].spend / rankedCamps[rankedCamps.length-1].leads) : 'N/A'})` : 'N/A'}
` : ''

        prompt = `Você é um consultor sênior de tráfego pago com 10+ anos de experiência no mercado brasileiro, especialista em Meta Ads (Advantage+, CBO, ASC) e Google Ads (Search, PMAX, Smart Bidding, tCPA/tROAS). Já gerenciou mais de R$50M em investimento publicitário.

REGRAS DA ANÁLISE — siga obrigatoriamente:
1. Use os NOMES EXATOS das campanhas do ranking abaixo em todos os problemas e recomendações
2. Cite NÚMEROS REAIS (CPA, gasto, conversões) — nunca invente métricas
3. Classifique cada campanha como ESCALAR / MANTER / PAUSAR com justificativa numérica
4. Dê % exatas de realocação de verba (ex: "+30% para X, -50% de Y")
5. Para Google: liste negativos específicos para adicionar com base nos dados
6. Seja tão direto quanto um relatório de R$10.000 — sem rodeios, sem genéricos

=== DADOS DO CLIENTE ===
Cliente: ${clientName}
Nicho: ${niche}
Investimento mensal configurado: R$${budget}
Objetivo: ${objective}
Período analisado: ${period ? `${period.startDate} a ${period.endDate}` : datePreset === 'last_7d' ? 'Últimos 7 dias' : datePreset === 'last_90d' ? 'Últimos 90 dias' : datePreset === 'this_month' ? 'Este mês' : datePreset === 'last_month' ? 'Mês anterior' : 'Últimos 30 dias'}
Fonte selecionada: ${auditSource === 'api' ? 'Somente API' : auditSource === 'upload' ? 'Somente arquivo importado' : 'Consolidado'}
Dados disponíveis: ${[srcHasMeta && 'Meta Ads', srcHasGoogle && 'Google Ads', hasUpload && 'Arquivo importado'].filter(Boolean).join(' + ')}

${anomalySection}

${campRankingText}

=== DADOS BRUTOS DE PERFORMANCE ===
${metaSummary}
${googleSummary}
${uploadSummary}

=== CONSOLIDADO GERAL ===
Investimento total analisado: R$${Number(totalSpend).toFixed(2)}
Total de leads/conversões: ${totalLeads}
CPL médio real: R$${realCPL}

${benchmarkText ? `=== BENCHMARK DO NICHO (${niche}) ===\n${benchmarkText}` : ''}
${evolutionText}
${memoryContext}

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
    "meta": ${srcHasMeta ? `{
      "resumo": "<análise da estrutura geral — organize ou não? Por quê?>",
      "organizacao_funil": "<as campanhas estão divididas por etapa do funil? TOFU/MOFU/BOFU?>",
      "separacao_publicos": "<há separação clara de frio, morno e quente? Cite nomes das campanhas>",
      "tipos_campanha": "<objetivos estão corretos para a fase do funil?>",
      "erros": ["<erro estrutural grave específico com nome da campanha>"]
    }` : 'null'},
    "google": ${srcHasGoogle ? `{
      "resumo": "<análise da estrutura do Google Ads>",
      "organizacao": "<estrutura de campanhas está lógica?>",
      "palavras_chave_estrutura": "<separação por intenção está correta?>",
      "tipos_campanha": "<Search vs PMAX vs Display usado corretamente?>",
      "erros": ["<erro estrutural com impacto financeiro>"]
    }` : 'null'}
  },

  "tracking": {
    "meta": ${srcHasMeta ? `{
      "pixel_ok": <true|false|null — inferir dos dados se possível>,
      "api_conversoes": <true|false|null>,
      "eventos_duplicados": <true|false|null>,
      "problemas": ["<problema específico de tracking com impacto>"]
    }` : 'null'},
    "google": ${srcHasGoogle ? `{
      "conversoes_confiaveis": <true|false|null — LEMBRE: conversões Google podem ser múltiplas ações configuradas>,
      "importacao_correta": <true|false|null>,
      "problema_vaidade": <true|false>,
      "problemas": ["<problema de tracking Google — mencionar se conversões incluem ações de vaidade>"]
    }` : 'null'},
    "prioridade_maxima": <true se há problemas críticos de tracking>,
    "alerta": "<se há problema de tracking, descreva o impacto no negócio>"
  },

  "performance": {
    "meta": ${srcHasMeta ? `{
      "metricas": {
        "cpm": <valor ou 0>,
        "ctr": <${srcMetaTotals?.ctr || 0}>,
        "cpc": <valor ou 0>,
        "cpa": <${srcMetaTotals?.cpl || 0}>,
        "frequencia": <valor médio ou 0>
      },
      "gargalos": ["<gargalo identificado com causa raiz — NÃO genérico>"],
      "interpretacao": "<o que essas métricas SIGNIFICAM para o negócio — impacto financeiro>"
    }` : 'null'},
    "google": ${srcHasGoogle ? `{
      "metricas": {
        "ctr": <${srcGoogleTotals?.ctr || 0}>,
        "cpc": <valor ou 0>,
        "taxa_conversao": <valor ou 0>
      },
      "palavras_chave_analise": "<intenção das palavras-chave está alinhada com a oferta?>",
      "interpretacao": "<o que os dados do Google indicam>"
    }` : 'null'}
  },

  "criativos_meta": ${srcHasMeta || srcUploadedCampaigns.length > 0 ? `{
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
    "meta": ${srcHasMeta ? `{
      "amplos_segmentados": "<está usando público amplo (Advantage+) ou hiper-segmentado? O que indica os dados?>",
      "lookalikes": "<há uso de lookalike? De qual fonte?>",
      "remarketing": "<há estrutura de remarketing? Cite campanhas se existirem>",
      "problemas": ["<problema de segmentação com impacto financeiro>"]
    }` : 'null'},
    "google": ${srcHasGoogle ? `{
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
  ],

  "o_que_eu_faria_agora": [
    {
      "titulo": "<ação direta — máx 8 palavras>",
      "prioridade": "<P1|P2|P3>",
      "motivo": "<por que é urgente — 1 frase específica>",
      "evidencia": "<dado real que justifica — cite número exato>",
      "impacto": "<resultado esperado em 1 frase>",
      "prazo": "<48h|3 dias|7 dias|15 dias>",
      "esforco": "<baixo|medio|alto>"
    }
  ],

  "qualidade_dados": "<1-2 frases: os dados disponíveis são suficientes para tomar decisões? Qual é o maior ponto cego desta auditoria — o que não conseguimos ver com estes dados?>"
}`

        // Limita o tempo do Claude para a função não estourar (504). Se exceder,
        // cai no fallback (Gemini → benchmark) que ainda cabe na janela de 60s.
        const message = await Promise.race([
          anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 8000,
            system: 'Você é um consultor sênior de tráfego pago com 10+ anos no mercado brasileiro. Responda APENAS com JSON válido e completo. Sem markdown, sem texto antes ou depois do JSON. Sem ```json. Comece direto com { e termine com }.',
            messages: [{ role: 'user', content: prompt }],
          }),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 46000)),
        ])

        if (!message) throw new Error('AI timeout — usando fallback')

        let raw = (message.content[0] as any).text.trim()
        // Remove TODAS as markdown fences independente de posição
        raw = raw.replace(/```(?:json)?[ \t]*\r?\n?/gi, '').replace(/[ \t]*```[ \t]*/g, '').trim()
        // Descarta texto antes do primeiro { ou [
        const firstBrace = raw.search(/[\[{]/)
        if (firstBrace > 0) raw = raw.slice(firstBrace)
        // Descarta texto após o último } ou ]
        const lastClose = Math.max(raw.lastIndexOf('}'), raw.lastIndexOf(']'))
        if (lastClose >= 0 && lastClose < raw.length - 1) raw = raw.slice(0, lastClose + 1)

        let audit: any
        try {
          audit = JSON.parse(raw)
        } catch {
          const objMatch = raw.match(/(\{[\s\S]*\})/)
          if (objMatch) audit = JSON.parse(objMatch[1])
          else throw new Error('Resposta da IA não contém JSON válido')
        }
        audit.generated_at             = new Date().toISOString()
        audit._realMetrics             = realMetrics
        audit._evolution               = evolution ? { ...evolution, scoreDelta: (typeof audit.health_score === 'number' && evolution.prevScore != null) ? audit.health_score - evolution.prevScore : null } : null
        audit._campanhasClassificadas  = classifiedCampaigns
        audit._wasteCampaigns          = wasteCampaigns
        audit._wastePercent            = wastePercent
        audit._dataQuality             = dataQuality
        audit._dataWarnings            = dataWarnings
        audit._period                  = periodLabel
        audit._datePreset              = datePreset
        audit._platforms               = [srcHasMeta && 'Meta Ads', srcHasGoogle && 'Google Ads', hasUpload && 'Arquivo importado'].filter(Boolean)
        audit._auditSource             = auditSource
        audit._trackingChecklist       = trackingChecklist
        audit._hasGoogleConversions    = srcHasGoogle && (srcGoogleTotals?.leads || 0) > 0

        // ── Salva padrões na memória RAG (fire-and-forget) ─────────────────
        saveAuditMemory(userId, clientName, niche, audit, realMetrics).catch(() => {})

        const dataSource = hasMeta && hasGoogle ? 'ambos' : hasMeta ? 'meta' : hasGoogle ? 'google' : 'ambos'
        const priorityActions = extractPriorityActions(audit, dataSource, userId, clientName)

        // ── Persiste no Supabase ──────────────────────────────────────────────
        const dataSrcList = [hasMeta && 'meta', hasGoogle && 'google', hasUpload && 'upload'].filter(Boolean) as string[]
        const persistence = await runPersistence(userId, clientName, audit, realMetrics, dataSrcList, 'ai', priorityActions)
        const dbActions = persistence.dbActions

        // Merge DB IDs into the actions returned to frontend
        const mergedActions = priorityActions.map((a: any) => {
          const saved = dbActions.find((d: any) => d.title.toLowerCase() === a.title.toLowerCase() && d.platform === a.platform)
          return saved ? { ...a, dbId: saved.id } : a
        })

        return NextResponse.json({ success: true, audit, source: 'ai', priorityActions: mergedActions, auditReportId: persistence.auditReportId, persistence: persistence.status })

      } catch (aiError: any) {
        console.warn('Anthropic API falhou na auditoria, usando fallback:', aiError.message)

        // Tenta o Gemini antes de cair no benchmark estático. Timeout curto para
        // não estourar o limite da função, e só usa se vier um audit COMPLETO
        // (com health_score) — caso contrário, mantém o fallback de benchmark.
        try {
          const { callGeminiJson, geminiModel, isGeminiEnabled } = await import('@/lib/gemini')
          if (isGeminiEnabled()) {
            const g = await callGeminiJson<Record<string, any>>({
              model: geminiModel('FALLBACK'),
              system: 'Você é um consultor sênior de tráfego pago com 10+ anos no mercado brasileiro. Responda APENAS com JSON válido e completo. Sem markdown, sem texto antes ou depois do JSON.',
              user: prompt,
              maxTokens: 8000,
              timeoutMs: 12000,
            })
            if (g && typeof g.health_score === 'number') {
              geminiAudit = g
            } else {
              console.warn('Gemini fallback (auditoria) retornou estrutura incompleta — usando benchmark')
            }
          }
        } catch (gemErr: any) {
          console.warn('Gemini fallback (auditoria) também falhou:', gemErr.message)
        }
      }
    }

    // ── Fallback: Gemini (se disponível) ou benchmark estático ───────────────
    if (!geminiAudit && !bench) {
      // IA falhou E nicho desconhecido → usuário não recebe nenhum resultado: devolve créditos
      refundCredits(userId, effectivePlan, 'audit').catch(() => {})
      return NextResponse.json({ success: false, error: 'Nicho não reconhecido e API indisponível.' }, { status: 400 })
    }
    const auditSrcLabel = geminiAudit ? 'gemini' : 'benchmark'
    const audit: Record<string, any> = geminiAudit
      ?? buildFallbackAudit(clientName, niche, allCampaigns, srcMetaTotals, srcGoogleTotals, bench!)
    audit._realMetrics             = realMetrics
    audit._evolution               = evolution ? { ...evolution, scoreDelta: (typeof audit.health_score === 'number' && evolution.prevScore != null) ? audit.health_score - evolution.prevScore : null } : null
    audit._campanhasClassificadas  = classifiedCampaigns
    audit._wasteCampaigns          = wasteCampaigns
    audit._wastePercent            = wastePercent
    audit._dataQuality             = dataQuality
    audit._dataWarnings            = dataWarnings
    audit._period                  = periodLabel
    audit._datePreset              = datePreset
    audit._platforms               = [srcHasMeta && 'Meta Ads', srcHasGoogle && 'Google Ads', hasUpload && 'Arquivo importado'].filter(Boolean)
    audit._auditSource             = auditSource
    audit._trackingChecklist       = trackingChecklist
    audit._hasGoogleConversions    = srcHasGoogle && (srcGoogleTotals?.leads || 0) > 0

    saveAuditMemory(userId, clientName, niche, audit, realMetrics).catch(() => {})

    const fbDataSource = hasMeta && hasGoogle ? 'ambos' : hasMeta ? 'meta' : hasGoogle ? 'google' : 'ambos'
    const priorityActions = extractPriorityActions(audit, fbDataSource, userId, clientName)

    // ── Persiste fallback no Supabase ────────────────────────────────────────
    const fbDataSrcList = [hasMeta && 'meta', hasGoogle && 'google', hasUpload && 'upload'].filter(Boolean) as string[]
    const fbPersistence = await runPersistence(userId, clientName, audit, realMetrics, fbDataSrcList, geminiAudit ? 'ai' : 'benchmark', priorityActions)
    const fbDbActions = fbPersistence.dbActions

    const fbMergedActions = priorityActions.map((a: any) => {
      const saved = fbDbActions.find((d: any) => d.title.toLowerCase() === a.title.toLowerCase() && d.platform === a.platform)
      return saved ? { ...a, dbId: saved.id } : a
    })

    return NextResponse.json({ success: true, audit, source: auditSrcLabel, priorityActions: fbMergedActions, auditReportId: fbPersistence.auditReportId, persistence: fbPersistence.status })

  } catch (error: any) {
    console.error('Audit route error:', error)
    return NextResponse.json({ success: false, error: errMsg(error, 'Erro ao gerar auditoria.') }, { status: 500 })
  }
}
