/* ELYON NOUS — mock data (window.DATA) ---------------------------------- */
(function () {
  // helper: deterministic series
  function series(base, n, vol, seed) {
    let h = 0; for (let i = 0; i < seed.length; i++) h = ((h << 5) - h) + seed.charCodeAt(i);
    const rnd = () => { h = (h * 1664525 + 1013904223) & 0xffffffff; return (h & 0x7fffffff) / 0x7fffffff; };
    const out = []; let v = base * 0.82;
    for (let i = 0; i < n; i++) { v += (rnd() - 0.44) * base * vol; v = Math.max(base * 0.45, Math.min(base * 1.5, v)); out.push(Math.round(v)); }
    out[n - 1] = base; return out;
  }

  const days7 = ['6 jun', '7 jun', '8 jun', '9 jun', '10 jun', '11 jun', '12 jun'];

  const DATA = {
    user: { name: 'Rhyann Martins', first: 'Rhyann', role: 'Diretor de Growth', initials: 'RM', plan: 'Enterprise', streak: 12 },
    company: { name: 'Aurora Capital', niche: 'Crédito & Fintech', sector: 'Financeiro' },

    // ── Multi-cliente (seletor no topo) ────────────────────────────────
    clients: [
      { id: 'aurora', name: 'Aurora Capital', niche: 'Crédito & Fintech', initials: 'AC', score: 78, color: 'var(--dv-1)', active: true },
      { id: 'novalar', name: 'NovaLar Imóveis', niche: 'Imóveis', initials: 'NL', score: 64, color: 'var(--dv-2)' },
      { id: 'vitalis', name: 'Vitalis Saúde', niche: 'Saúde', initials: 'VS', score: 71, color: 'var(--dv-3)' },
      { id: 'edu', name: 'EduMais', niche: 'Educação', initials: 'EM', score: 59, color: 'var(--dv-4)' },
    ],
    // ── Créditos de IA ─────────────────────────────────────────────────
    credits: { used: 1840, total: 5000 },

    channels: ['Meta', 'Google', 'TikTok', 'LinkedIn'],
    period: 'Últimos 7 dias',
    days7,

    // ── Health score (the habit metric) ────────────────────────────────
    health: {
      score: 78, delta: +6, label: 'Saudável',
      history: [62, 64, 63, 67, 69, 72, 78],
      pillars: [
        { k: 'Aquisição',  v: 82, d: +4 },
        { k: 'Conversão',  v: 61, d: -3 },
        { k: 'Retenção',   v: 74, d: +2 },
        { k: 'Eficiência', v: 80, d: +5 },
        { k: 'Criativos',  v: 70, d: +1 },
        { k: 'Dados & IA', v: 88, d: +7 },
      ],
    },

    // ── Daily briefing (NOUS) ──────────────────────────────────────────
    briefing: {
      headline: 'Bom dia, Rhyann. Sua operação subiu 6 pontos esta semana.',
      summary: 'O ROAS geral cresceu 12,5% puxado por remarketing no Meta. Mas o CPA do Google Ads em Pesquisa está 18,7% acima da meta — vale agir hoje. Há R$ 41.800 em ganhos rápidos esperando aprovação.',
      changed: [
        { icon: 'up',   text: 'ROAS geral subiu para 3,2x', sub: '+12,5% vs. semana anterior', tone: 'good' },
        { icon: 'down', text: 'CPA do Google Search em alta', sub: '+18,7% — acima da meta', tone: 'bad' },
        { icon: 'flag', text: '3 criativos entraram em fadiga', sub: 'CTR caindo há 3 dias', tone: 'warn' },
      ],
    },

    // ── KPIs ───────────────────────────────────────────────────────────
    kpis: [
      { k: 'investimento', label: 'Investimento', value: 'R$ 124.560', raw: 124560, delta: +12.5, fmt: 'brl', spark: series(124560, 7, .1, 'inv'), good: 'neutral' },
      { k: 'receita',      label: 'Receita',      value: 'R$ 398.640', raw: 398640, delta: +17.6, fmt: 'brl', spark: series(398640, 7, .12, 'rec'), good: 'up' },
      { k: 'roas',         label: 'ROAS',         value: '3,2x',       raw: 3.2,    delta: +12.5, fmt: 'x',   spark: series(320, 7, .1, 'roas'), good: 'up' },
      { k: 'conversoes',   label: 'Conversões',   value: '3.248',      raw: 3248,   delta: +15.8, fmt: 'int', spark: series(3248, 7, .12, 'conv'), good: 'up' },
      { k: 'cpa',          label: 'CPA médio',    value: 'R$ 38,30',   raw: 38.3,   delta: -5.6,  fmt: 'brl', spark: series(383, 7, .1, 'cpa'), good: 'down' },
      { k: 'ctr',          label: 'CTR médio',    value: '2,34%',      raw: 2.34,   delta: +4.2,  fmt: 'pct', spark: series(234, 7, .08, 'ctr'), good: 'up' },
    ],

    revenueTrend: {
      labels: days7,
      receita: series(57000, 7, .12, 'rt-receita'),
      investimento: series(17800, 7, .1, 'rt-inv'),
    },

    roasTrend: { labels: days7, value: [2.8, 2.9, 3.0, 3.1, 3.0, 3.1, 3.2] },

    // ── Channel mix ────────────────────────────────────────────────────
    channelMix: [
      { name: 'Meta Ads',    spend: 49824, conv: 1357, roas: 3.4, cpa: 36.7, share: 40, color: 'var(--dv-1)' },
      { name: 'Google Ads',  spend: 37368, conv: 1051, roas: 3.1, cpa: 35.6, share: 30, color: 'var(--dv-2)' },
      { name: 'TikTok Ads',  spend: 18684, conv: 545,  roas: 4.1, cpa: 25.2, share: 15, color: 'var(--dv-3)' },
      { name: 'LinkedIn',    spend: 12456, conv: 195,  roas: 1.9, cpa: 63.9, share: 10, color: 'var(--dv-4)' },
      { name: 'Outros',      spend: 6228,  conv: 100,  roas: 2.4, cpa: 62.3, share: 5,  color: 'var(--dv-6)' },
    ],

    // ── Funnel ─────────────────────────────────────────────────────────
    funnel: [
      { stage: 'Visitantes',  v: 124560, pct: 100,  drop: null },
      { stage: 'Leads',       v: 18432,  pct: 14.8, drop: -85.2 },
      { stage: 'Qualificados',v: 7456,   pct: 6.0,  drop: -59.6 },
      { stage: 'Oportunidades',v: 3782,  pct: 3.0,  drop: -49.3 },
      { stage: 'Clientes',    v: 1256,   pct: 1.0,  drop: -66.8 },
    ],

    // ── Priority actions w/ R$ impact ──────────────────────────────────
    actions: [
      { id: 1, title: 'Reduzir CPA no Google Search', why: 'CPA 18,7% acima da meta nas campanhas de Pesquisa.', impact: 22300, effort: 'Baixo', urgency: 'alta', channel: 'Google Ads' },
      { id: 2, title: 'Escalar remarketing Meta (ROAS 4,8x)', why: '3 campanhas subinvestidas com retorno acima da média.', impact: 53800, effort: 'Baixo', urgency: 'alta', channel: 'Meta Ads' },
      { id: 3, title: 'Renovar 3 criativos em fadiga', why: 'CTR caindo há 3 dias, frequência acima de 7.', impact: 12600, effort: 'Médio', urgency: 'média', channel: 'Meta Ads' },
      { id: 4, title: 'Testar públicos Lookalike 1%', why: 'Topo de funil precisa de novas fontes de leads.', impact: 18400, effort: 'Médio', urgency: 'média', channel: 'Meta Ads' },
      { id: 5, title: 'Otimizar landing do Produto A', why: 'Conversão da página 20% abaixo do ideal.', impact: 14600, effort: 'Médio', urgency: 'baixa', channel: 'Site / CRO' },
    ],

    // ── Proactive alerts ───────────────────────────────────────────────
    alerts: [
      { tone: 'bad',  title: 'CPA em alta no Google Ads', body: 'Aumento de 18,7% nos últimos 7 dias, concentrado em Pesquisa.', tag: 'Anomalia' },
      { tone: 'warn', title: 'Queda no CTR de criativos', body: 'CTR médio caiu de 1,2% para 1,0% nos últimos 3 dias.', tag: 'Tendência' },
      { tone: 'good', title: 'Oportunidade de escala', body: 'Remarketing com ROAS 4,8x pode receber mais verba.', tag: 'Oportunidade' },
    ],

    // ── Goals (gamification) ───────────────────────────────────────────
    goals: [
      { k: 'Receita do mês', cur: 398640, target: 500000, fmt: 'brl' },
      { k: 'ROAS alvo', cur: 3.2, target: 3.5, fmt: 'x' },
      { k: 'Novos clientes', cur: 1256, target: 1500, fmt: 'int' },
    ],

    // ── Campaigns table ────────────────────────────────────────────────
    campaigns: [
      { name: 'Black Friday | Prospecting', channel: 'Meta',   spend: 28540, rev: 117500, conv: 842, roas: 4.12, cpa: 28.41, ctr: 2.85, status: 'ativa' },
      { name: 'Remarketing | Search',       channel: 'Google', spend: 22130, rev: 84960,  conv: 621, roas: 3.84, cpa: 31.02, ctr: 3.12, status: 'ativa' },
      { name: 'Conversão | Performance Max', channel: 'Google', spend: 18240, rev: 58550, conv: 518, roas: 3.21, cpa: 33.17, ctr: 2.41, status: 'ativa' },
      { name: 'Video Views | Awareness',     channel: 'TikTok', spend: 15620, rev: 52400,  conv: 437, roas: 3.35, cpa: 35.74, ctr: 2.31, status: 'atenção' },
      { name: 'Lead Gen | B2B',              channel: 'LinkedIn',spend: 12480, rev: 23700, conv: 121, roas: 1.90, cpa: 62.00, ctr: 1.12, status: 'atenção' },
    ],

    // ── Creatives ──────────────────────────────────────────────────────
    creatives: [
      { id: 1, hook: 'Resultados reais em menos tempo', ctr: 3.42, conv: 2.18, fatigue: 'saudável', roas: 4.32 },
      { id: 2, hook: 'Menos custo, mais clientes',       ctr: 2.91, conv: 1.92, fatigue: 'saudável', roas: 3.71 },
      { id: 3, hook: 'Gestão que gera resultado',        ctr: 2.47, conv: 1.61, fatigue: 'monitorar', roas: 3.10 },
      { id: 4, hook: 'A virada que faltava',             ctr: 1.71, conv: 1.22, fatigue: 'fadiga',    roas: 2.20 },
    ],

    // ── Diagnosis ──────────────────────────────────────────────────────
    diagnosis: {
      bottleneck: { stage: 'Conversão (fundo de funil)', impact: 48700, conv: '20,5%', bench: '32%' },
      swot: {
        forcas:        ['Boa escala de aquisição', 'CAC competitivo', 'Diversificação de canais'],
        fraquezas:     ['Conversão abaixo do ideal', 'Baixa qualificação de leads', 'Dependência de 2 canais'],
        oportunidades: ['Expansão para TikTok', 'Automação de nutrição', 'Novas ofertas'],
        ameacas:       ['Aumento de CAC no setor', 'Concorrência agressiva', 'Mudança de algoritmo'],
      },
      causes: [
        { text: 'Conversão baixa na etapa de oportunidades', sev: 'alta' },
        { text: 'Mensagens pouco alinhadas à proposta de valor', sev: 'média' },
        { text: 'Qualificação insuficiente de leads no topo', sev: 'alta' },
        { text: 'Falta de nutrição no meio do funil', sev: 'média' },
      ],
    },

    // ── Market ─────────────────────────────────────────────────────────
    market: {
      demand: { value: 118.7, delta: +12.4, series: series(110, 7, .06, 'demand') },
      bench: [
        { k: 'CPC médio', you: 'R$ 2,48', mkt: 'R$ 2,71', delta: -8.3, good: true },
        { k: 'CPL médio', you: 'R$ 24,63', mkt: 'R$ 22,40', delta: +10.1, good: false },
        { k: 'CTR médio', you: '2,35%', mkt: '2,15%', delta: +9.2, good: true },
      ],
      competitors: [
        { name: 'Concorrente Alfa',  sov: 28.4, d: +2.6, score: 8.6 },
        { name: 'Concorrente Beta',  sov: 21.7, d: +1.3, score: 7.5 },
        { name: 'Sua Empresa',       sov: 18.2, d: +1.8, score: 7.8, you: true },
        { name: 'Concorrente Gama',  sov: 15.9, d: -0.8, score: 6.6 },
        { name: 'Concorrente Delta', sov: 8.6,  d: +0.4, score: 5.5 },
      ],
      opps: [
        { name: 'Crédito Pessoal', growth: 42, cpl: 'R$ 18,50', ease: 'Alta' },
        { name: 'Cartão de Crédito', growth: 28, cpl: 'R$ 22,10', ease: 'Média' },
        { name: 'Consórcio de Imóveis', growth: 31, cpl: 'R$ 35,80', ease: 'Média' },
      ],
    },

    // ── Suggested NOUS questions ───────────────────────────────────────
    suggestions: [
      'Qual campanha devo pausar?',
      'Onde estão os maiores gastos de CPA?',
      'O que devo fazer essa semana?',
      'Quais canais geram mais ROAS?',
    ],

    // ── Audiências ─────────────────────────────────────────────────────
    audiences: [
      { name: 'Lookalike 1% — Compradores', type: 'Lookalike', size: '420 mil', roas: 4.6, cpa: 24.1, share: 28, status: 'escalar' },
      { name: 'Remarketing 30d — Site', type: 'Remarketing', size: '86 mil', roas: 5.2, cpa: 19.8, share: 22, status: 'escalar' },
      { name: 'Interesses — Crédito', type: 'Interesse', size: '1,2 mi', roas: 2.8, cpa: 38.5, share: 20, status: 'manter' },
      { name: 'Lookalike 3% — Leads', type: 'Lookalike', size: '980 mil', roas: 2.1, cpa: 47.2, share: 17, status: 'testar' },
      { name: 'Frio — Ampla', type: 'Aberto', size: '4,8 mi', roas: 1.6, cpa: 61.0, share: 13, status: 'cortar' },
    ],
    audienceMatrix: { // idade x conversão
      ages: ['18-24', '25-34', '35-44', '45-54', '55+'],
      male: [12, 38, 31, 14, 5],
      female: [9, 34, 36, 16, 5],
    },

    // ── Alocador de verba (IA) ─────────────────────────────────────────
    allocator: {
      totalBudget: 124560,
      projectedGain: 41800,
      rows: [
        { ch: 'Meta Ads', cur: 49824, sug: 58600, roas: 3.4, color: 'var(--dv-1)' },
        { ch: 'Google Ads', cur: 37368, sug: 31200, roas: 3.1, color: 'var(--dv-2)' },
        { ch: 'TikTok Ads', cur: 18684, sug: 24800, roas: 4.1, color: 'var(--dv-3)' },
        { ch: 'LinkedIn', cur: 12456, sug: 6200, roas: 1.9, color: 'var(--dv-4)' },
        { ch: 'Outros', cur: 6228, sug: 3760, roas: 2.4, color: 'var(--dv-6)' },
      ],
    },

    // ── Detalhe de campanha (drill-down) ───────────────────────────────
    campaignDetail: {
      name: 'Black Friday | Prospecting',
      channel: 'Meta',
      objective: 'Conversões',
      learning: 'Otimizado', // Aprendizado | Limitado | Otimizado
      byObjective: [
        { obj: 'Conversões', roas: 4.12, spend: 18540 },
        { obj: 'Tráfego', roas: 2.31, spend: 6200 },
        { obj: 'Alcance', roas: 1.84, spend: 3800 },
      ],
      adsets: [
        { name: 'LAL 1% Compradores', spend: 8420, roas: 4.8, status: 'Otimizado' },
        { name: 'Remarketing 30d', spend: 6100, roas: 5.1, status: 'Otimizado' },
        { name: 'Interesses amplos', spend: 4020, roas: 2.2, status: 'Aprendizado' },
      ],
      geo: [
        { uf: 'SP', share: 38, roas: 4.3 }, { uf: 'RJ', share: 18, roas: 3.6 },
        { uf: 'MG', share: 12, roas: 3.9 }, { uf: 'RS', share: 9, roas: 3.2 },
        { uf: 'PR', share: 8, roas: 3.4 }, { uf: 'Outros', share: 15, roas: 2.8 },
      ],
      placements: [
        { p: 'Feed', share: 44, color: 'var(--dv-1)' }, { p: 'Stories', share: 28, color: 'var(--dv-2)' },
        { p: 'Reels', share: 20, color: 'var(--dv-3)' }, { p: 'Audience Net.', share: 8, color: 'var(--dv-4)' },
      ],
      pixel: { events: 12480, match: 92, dedup: 'OK' },
    },

    // ── Auditoria profunda (11 dimensões) ──────────────────────────────
    audit: {
      grade: 'B+', score: 78, date: '12 jun', prevScore: 71,
      dimensions: [
        { k: 'Estrutura de conta', v: 84, s: 'good' },
        { k: 'Segmentação', v: 72, s: 'warn' },
        { k: 'Criativos', v: 70, s: 'warn' },
        { k: 'Lances & orçamento', v: 80, s: 'good' },
        { k: 'Conversão / CRO', v: 58, s: 'bad' },
        { k: 'Tracking & pixel', v: 88, s: 'good' },
        { k: 'Palavras-chave', v: 74, s: 'warn' },
        { k: 'Públicos', v: 81, s: 'good' },
        { k: 'Landing pages', v: 62, s: 'warn' },
        { k: 'Frequência & fadiga', v: 66, s: 'warn' },
        { k: 'Atribuição', v: 90, s: 'good' },
      ],
      waste: {
        total: 18640,
        items: [
          { what: 'Termos genéricos sem conversão (Google)', value: 8200 },
          { what: 'Públicos amplos com ROAS < 1,5x', value: 6100 },
          { what: 'Criativos em fadiga ainda ativos', value: 4340 },
        ],
      },
      tracking: [
        { k: 'Pixel da Meta', ok: true }, { k: 'Conversions API', ok: true },
        { k: 'GA4 conectado', ok: true }, { k: 'Google Ads tag', ok: true },
        { k: 'Eventos de conversão', ok: true }, { k: 'UTM padronizadas', ok: false },
        { k: 'Consent mode v2', ok: false },
      ],
      evolution: [62, 64, 66, 68, 71, 74, 78],
      secondOpinion: {
        engine: 'Gemini',
        agree: 82,
        note: 'Concordo com o diagnóstico principal de conversão. Acrescento: a frequência no Meta (7,2) sugere saturação de público — priorize expansão de Lookalike antes de aumentar verba.',
      },
    },

    // ── Estratégia (90 dias) ───────────────────────────────────────────
    strategy: {
      thesis: 'Crescer receita em 28% em 90 dias corrigindo a conversão de fundo de funil e realocando verba para públicos de alto ROAS (remarketing + Lookalike 1%), sem aumentar o investimento total.',
      matrix: {
        escalar: ['Remarketing 30d (ROAS 5,2x)', 'Lookalike 1% Compradores', 'TikTok prospecting'],
        corrigir: ['CPA do Google Search', 'Landing do Produto A', 'Qualificação de leads'],
        testar: ['Lookalike 1% Leads', 'Novos criativos UGC', 'Públicos por renda'],
        cortar: ['Públicos amplos frios', 'LinkedIn Lead Gen B2B', 'Termos genéricos'],
      },
      persona: {
        name: 'Marina, 34',
        age: '28–42 anos', gender: '58% mulheres', income: 'Classe B (R$ 5–12 mil)',
        regions: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte'],
        interests: ['Educação financeira', 'Investimentos', 'Empreendedorismo', 'Crédito'],
        summary: 'Profissional que busca crédito para organizar finanças ou investir no próprio negócio. Decide por confiança e prova social; responde a ofertas claras e sem letras miúdas.',
      },
      channelRanking: [
        { ch: 'Meta Ads', score: 92, rec: 'Escalar' },
        { ch: 'TikTok Ads', score: 86, rec: 'Escalar' },
        { ch: 'Google Ads', score: 74, rec: 'Otimizar' },
        { ch: 'LinkedIn', score: 41, rec: 'Reduzir' },
      ],
      plan: {
        d7: ['Negativar 14 termos no Google Search', 'Renovar 3 criativos em fadiga', 'Subir verba do remarketing +20%'],
        d30: ['Lançar 6 criativos UGC novos', 'Otimizar landing do Produto A', 'Testar Lookalike 1% de Leads'],
        d90: ['Escalar TikTok para 20% do mix', 'Implementar nutrição de meio de funil', 'Reduzir LinkedIn e realocar verba'],
      },
    },

    // ── Memória viva (RAG) ─────────────────────────────────────────────
    memory: [
      { pattern: 'CPL caiu 18% vs. última auditoria', evidence: 'Tendência consistente há 3 semanas', date: '12 jun', tone: 'good' },
      { pattern: 'Criativos UGC superam estáticos em +42% de CTR', evidence: 'Padrão reincidente em 4 campanhas', date: '08 jun', tone: 'good' },
      { pattern: 'Públicos amplos saturam após ~R$ 6 mil/sem', evidence: 'Observado em 3 ciclos', date: '02 jun', tone: 'warn' },
      { pattern: 'Black Friday | Prospecting foi a campanha vencedora', evidence: 'ROAS 4,1x · maior volume', date: '28 mai', tone: 'good' },
    ],

    // ── Portal do cliente ──────────────────────────────────────────────
    portal: {
      link: 'elyon.app/p/aurora-capital',
      lastViewed: 'há 2 dias',
      visits: 14,
      sections: [
        { k: 'Resumo executivo', on: true }, { k: 'KPIs principais', on: true },
        { k: 'Plano de ação', on: true }, { k: 'Detalhe de campanhas', on: false },
        { k: 'Custos e verba', on: false },
      ],
    },

    // ── Plans (jornada Diagnóstico → Acompanhamento → Operação) ─────────
    journey: [
      { k: 'diagnostico',   label: 'Diagnóstico' },
      { k: 'acompanhamento',label: 'Acompanhamento' },
      { k: 'operacao',      label: 'Operação' },
    ],
    plans: [
      { k: 'diagnostico', name: 'Diagnóstico', stage: 'diagnostico', price: 0, priceLabel: 'Grátis', cycle: 'Para sempre',
        pitch: 'Para encontrar um primeiro sinal de ineficiência.', cta: 'Fazer diagnóstico grátis', accent: 'green',
        features: ['Diagnóstico inicial de CPL', 'Faixa esperada estimada por nicho', 'Desvio e prioridade sugerida', 'Sem conexão de conta · Sem cartão'] },
      { k: 'plataforma', name: 'Plataforma', stage: 'acompanhamento', price: 297, priceLabel: 'R$ 297', cycle: 'por mês',
        pitch: 'Para acompanhar uma operação própria com mais clareza.', cta: 'Começar acompanhamento', accent: 'blue',
        features: ['Visão geral do negócio', 'Saúde do negócio e campanhas', 'Resultados e monitoramento', 'Relatórios básicos', 'Plano de ação inicial'] },
      { k: 'agency', name: 'Agency', stage: 'operacao', price: 997, priceLabel: 'R$ 997', cycle: 'por mês', badge: 'Recomendado para agências',
        pitch: 'Para gestores e agências que precisam organizar múltiplos clientes.', cta: 'Usar com clientes', accent: 'gold', featured: true,
        features: ['Até 8 clientes', 'NOUS IA completo', 'Pesquisa de mercado', 'Audiências e mix de canais', 'Conteúdo e conversão com IA', 'Relatórios em PDF'] },
      { k: 'enterprise', name: 'Enterprise', stage: 'operacao', price: 2997, priceLabel: 'R$ 2.997', cycle: 'por mês',
        pitch: 'Para operações que precisam transformar análise em rotina contínua.', cta: 'Falar sobre operação', accent: 'ink', current: true,
        features: ['Até 15 clientes', 'Regras de alerta', 'Histórico de aprendizado', 'Inteligência contínua por cliente', 'Múltiplas contas por plataforma', 'Acesso à API'] },
    ],

    nav: [
      { k: 'hoje',       label: 'Hoje',        icon: 'home',   group: 'main' },
      { k: 'desempenho', label: 'Desempenho',  icon: 'chart',  group: 'main' },
      { k: 'diagnostico',label: 'Diagnóstico', icon: 'pulse',  group: 'main' },
      { k: 'mercado',    label: 'Mercado',     icon: 'globe',  group: 'main' },
      { k: 'plano',      label: 'Plano de Ação',icon: 'check', group: 'main', badge: 5 },
      { k: 'relatorios', label: 'Relatórios',  icon: 'doc',    group: 'main' },
      { k: 'integracoes',label: 'Integrações', icon: 'plug',   group: 'sys' },
      { k: 'config',     label: 'Configurações',icon: 'gear',  group: 'sys' },
    ],
  };

  // Format helpers shared everywhere
  DATA.fmt = {
    brl: (n) => 'R$ ' + n.toLocaleString('pt-BR', { maximumFractionDigits: 0 }),
    brlc: (n) => 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    int: (n) => n.toLocaleString('pt-BR'),
    pct: (n) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%',
    x: (n) => (n).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'x',
  };

  window.DATA = DATA;
})();
