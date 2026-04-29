// lib/niche_benchmarks.ts — Benchmarks reais de mercado brasileiro 2024–2025
// 21 nichos cobertos com CPL, CVR, ticket médio, LTV e insights de mercado

export interface NicheBenchmark {
  name: string
  cpl_min: number
  cpl_max: number
  cpl_by_channel: Record<string, string>
  cvr_lead_to_sale: number   // 0.0–1.0
  avg_ticket: number
  ltv_multiplier: number
  best_channels: string[]
  budget_floor: number
  budget_ideal: number       // budget para resultados consistentes
  kpi_thresholds: {
    cpl_good: number
    cpl_bad: number
    roas_good: number
    cvr_good: number
  }
  seasonality: string[]      // meses de pico (ex: ['Jan', 'Jul'])
  insights: string[]
}

/** KPIs calculados a partir de budget + benchmark */
export interface NicheProjection {
  cplAvg: number
  leadsMonth: number
  leadsMin: number
  leadsMax: number
  salesMonth: number
  revenueMonth: number
  revenueMin: number
  revenueMax: number
  roas: number
  roasLtv: number
  ltv: number
  budgetStatus: 'abaixo' | 'mínimo' | 'ideal'
  budgetRecommended: number
  roasStatus: 'excelente' | 'bom' | 'atenção'
  roasIsLtvBased: boolean
  recommendation: string
  chartData: { month: string; projetado: number; meta: number }[]
  funnelData: { label: string; value: number; pct: number; color: string }[]
  // Inteligência avançada
  seasonalityIndex: number        // multiplicador do mês atual (1.0 = baseline)
  seasonalityLabel: string        // 'CPL 20% abaixo da média — bom momento para escalar'
  seasonalityTrend: 'subindo' | 'descendo' | 'estável'
  adjustedCPLAvg: number         // CPL ajustado por sazonalidade + tamanho de mercado
  citySizeTier: 'capital' | 'grande' | 'medio' | 'pequeno' | 'online'
  citySizeModifier: number
  citySizeLabel: string
}

export interface CreativeAngles {
  saturated: string[]
  trending: string[]
  underexplored: string[]
}

export interface CampaignMaturityStage {
  stage: 'aprendizado' | 'otimizacao' | 'estabilizacao' | 'fadiga'
  label: string
  weekRange: string
  cplMultiplier: number
  color: string
  advice: string
  progress: number
}

const BENCHMARKS: Record<string, NicheBenchmark> = {
  financeiro: {
    name: 'Financeiro / Crédito',
    cpl_min: 35, cpl_max: 120,
    cpl_by_channel: {
      'Google Search': 'R$45–80',
      'Meta Ads': 'R$35–65',
      'YouTube': 'R$60–110',
      'LinkedIn': 'R$90–150',
    },
    cvr_lead_to_sale: 0.08,
    avg_ticket: 1800,
    ltv_multiplier: 3.2,
    best_channels: ['Google Search', 'Meta Ads', 'YouTube'],
    budget_floor: 3000,
    budget_ideal: 8000,
    kpi_thresholds: { cpl_good: 50, cpl_bad: 100, roas_good: 3.5, cvr_good: 0.10 },
    seasonality: ['Jan', 'Jul'],
    insights: [
      'Regulamentação CVM exige disclaimers em todos os criativos',
      'Prova social (depoimentos de clientes) reduz CPL em 28%',
      'Webinar de educação financeira converte 3× mais que anúncio direto',
      'Pico de interesse em Jan (dívidas) e Jul (férias escolares)',
    ],
  },
  saude: {
    name: 'Saúde / Clínica',
    cpl_min: 25, cpl_max: 90,
    cpl_by_channel: {
      'Meta Ads': 'R$28–55',
      'Google Search': 'R$40–75',
      'YouTube': 'R$50–85',
      'TikTok': 'R$20–45',
    },
    cvr_lead_to_sale: 0.12,
    avg_ticket: 850,
    ltv_multiplier: 4.1,
    best_channels: ['Meta Ads', 'Google Search', 'TikTok'],
    budget_floor: 2000,
    budget_ideal: 6000,
    kpi_thresholds: { cpl_good: 40, cpl_bad: 80, roas_good: 4.0, cvr_good: 0.15 },
    seasonality: ['Jan', 'Set'],
    insights: [
      'Conteúdo antes/depois tem CTR 2.8× maior que imagens genéricas',
      'CFO proíbe promessas de cura — foco em bem-estar e qualidade de vida',
      'TikTok emerge como canal de baixo CPL para público 25–40 anos',
      'Jan e Set são picos de busca (resolução de ano novo e volta ao trabalho)',
    ],
  },
  odontologia: {
    name: 'Odontologia Estética',
    cpl_min: 45, cpl_max: 95,
    cpl_by_channel: {
      'Meta Ads': 'R$48–75',
      'Google Search': 'R$55–90',
      'Instagram': 'R$40–70',
      'YouTube': 'R$65–95',
    },
    cvr_lead_to_sale: 0.15,
    avg_ticket: 3200,
    ltv_multiplier: 2.8,
    best_channels: ['Meta Ads', 'Google Search', 'Instagram'],
    budget_floor: 2500,
    budget_ideal: 7000,
    kpi_thresholds: { cpl_good: 60, cpl_bad: 90, roas_good: 3.8, cvr_good: 0.18 },
    seasonality: ['Dez', 'Mar'],
    insights: [
      'Antes/depois de clareamento tem CPL 34% menor que campanhas genéricas',
      'Horário 19h–22h gera leads com 41% mais chance de agendar em 48h',
      'WhatsApp pós-lead reduz CAC em 22% e aumenta comparecimento para 78%',
      'PMAX subutilizado — early adopters capturam leads 28% mais baratos',
    ],
  },
  educacao: {
    name: 'Educação / Cursos',
    cpl_min: 15, cpl_max: 60,
    cpl_by_channel: {
      'Meta Ads': 'R$18–40',
      'Google Search': 'R$25–55',
      'YouTube': 'R$20–45',
      'TikTok': 'R$12–30',
    },
    cvr_lead_to_sale: 0.06,
    avg_ticket: 1200,
    ltv_multiplier: 1.8,
    best_channels: ['Meta Ads', 'YouTube', 'TikTok'],
    budget_floor: 1500,
    budget_ideal: 5000,
    kpi_thresholds: { cpl_good: 25, cpl_bad: 55, roas_good: 5.0, cvr_good: 0.08 },
    seasonality: ['Jan', 'Ago'],
    insights: [
      'Lançamentos funcionam melhor com lista quente (leads já engajados)',
      'CPL cai 40% quando o nicho do curso é ultra-específico',
      'Prova de resultado (prints de alunos) converte 3× mais que depoimentos genéricos',
      'Jan e Ago são picos de matrículas — concentre 60% do budget nesses meses',
    ],
  },
  imobiliario: {
    name: 'Imobiliário',
    cpl_min: 80, cpl_max: 250,
    cpl_by_channel: {
      'Meta Ads': 'R$85–160',
      'Google Search': 'R$100–220',
      'YouTube': 'R$90–180',
      'LinkedIn': 'R$120–250',
    },
    cvr_lead_to_sale: 0.03,
    avg_ticket: 450000,
    ltv_multiplier: 1.5,
    best_channels: ['Meta Ads', 'Google Search', 'YouTube'],
    budget_floor: 5000,
    budget_ideal: 15000,
    kpi_thresholds: { cpl_good: 120, cpl_bad: 200, roas_good: 8.0, cvr_good: 0.04 },
    seasonality: ['Mar', 'Set'],
    insights: [
      'Tempo de resposta crítico: 80% do CVR cai após 1h sem contato',
      'Tour virtual 360° reduz visitas desnecessárias e aumenta qualificação',
      'Retargeting de visitantes do site converte 5× mais que público frio',
      'CPL alto é normal — ROI de uma venda justifica meses de investimento',
    ],
  },
  ecommerce: {
    name: 'E-commerce / Varejo',
    cpl_min: 12, cpl_max: 55,
    cpl_by_channel: {
      'Meta Ads': 'R$12–45',
      'Google Shopping': 'R$15–50',
      'TikTok': 'R$10–30',
      'Google PMAX': 'R$12–35',
    },
    cvr_lead_to_sale: 0.04,
    avg_ticket: 420,
    ltv_multiplier: 3.0,
    best_channels: ['Meta Ads', 'Google Shopping', 'Google PMAX'],
    budget_floor: 2000,
    budget_ideal: 8000,
    kpi_thresholds: { cpl_good: 25, cpl_bad: 50, roas_good: 4.5, cvr_good: 0.04 },
    seasonality: ['Nov', 'Dez'],
    insights: [
      'ROAS break-even = ticket ÷ margem — calcule antes de escalar',
      'Recuperação de carrinho abandonado via email/WhatsApp recupera 15% das vendas',
      'Black Friday: CPL sobe 80% mas conversão triplica — planeje budget extra',
      'Google PMAX está convertendo 30% melhor que Shopping isolado em 2025',
    ],
  },
  loja_moveis: {
    name: 'Loja de Móveis',
    cpl_min: 28, cpl_max: 80,
    cpl_by_channel: {
      'Meta Ads': 'R$30–75',
      'Instagram': 'R$28–65',
      'Google Search': 'R$40–85',
      'Google Shopping': 'R$25–60',
      'Pinterest': 'R$22–55',
    },
    cvr_lead_to_sale: 0.09,
    avg_ticket: 2200,
    ltv_multiplier: 2.0,
    best_channels: ['Meta Ads', 'Instagram', 'Google Shopping', 'Pinterest'],
    budget_floor: 3000,
    budget_ideal: 12000,
    kpi_thresholds: { cpl_good: 50, cpl_bad: 80, roas_good: 4.0, cvr_good: 0.10 },
    seasonality: ['Jan', 'Fev', 'Out', 'Nov'],
    insights: [
      'Fotos de ambientes montados convertem 3× mais que produtos isolados',
      'Antes/depois de decoração e reformas são os criativos de maior CTR',
      'WhatsApp é essencial no pós-lead: aumenta comparecimento em 40%',
      'Picos em Jan/Fev (mudanças, casamentos) e pré-Black Friday (Out/Nov)',
      'Pinterest gera tráfego de alta intenção com CPL 20% menor que Meta',
    ],
  },
  juridico: {
    name: 'Jurídico / Advocacia',
    cpl_min: 60, cpl_max: 180,
    cpl_by_channel: {
      'Google Search': 'R$70–160',
      'Meta Ads': 'R$60–120',
      'LinkedIn': 'R$100–180',
      'YouTube': 'R$80–150',
    },
    cvr_lead_to_sale: 0.20,
    avg_ticket: 5000,
    ltv_multiplier: 2.2,
    best_channels: ['Google Search', 'Meta Ads', 'LinkedIn'],
    budget_floor: 3000,
    budget_ideal: 8000,
    kpi_thresholds: { cpl_good: 90, cpl_bad: 160, roas_good: 6.0, cvr_good: 0.25 },
    seasonality: ['Mar', 'Out'],
    insights: [
      'OAB proíbe publicidade direta — foco em conteúdo educativo e autoridade',
      'Google Search capta intenção de compra alta (pessoa já tem o problema)',
      'Especialização ultra-nicho (ex: direito previdenciário) reduz CPL em 50%',
      'YouTube com conteúdo explicativo gera leads mais qualificados e baratos',
    ],
  },
  contabilidade: {
    name: 'Contabilidade / Fiscal',
    cpl_min: 40, cpl_max: 120,
    cpl_by_channel: {
      'Google Search': 'R$45–100',
      'Meta Ads': 'R$40–80',
      'LinkedIn': 'R$70–120',
    },
    cvr_lead_to_sale: 0.18,
    avg_ticket: 800,
    ltv_multiplier: 5.0,
    best_channels: ['Google Search', 'Meta Ads', 'LinkedIn'],
    budget_floor: 2000,
    budget_ideal: 6000,
    kpi_thresholds: { cpl_good: 60, cpl_bad: 100, roas_good: 5.0, cvr_good: 0.20 },
    seasonality: ['Jan', 'Mar'],
    insights: [
      'Pico em Mar–Abr (IRPF) e Jan (planejamento fiscal) — aumente budget',
      'LTV alto: cliente médio fica 4–6 anos — justifica CPL maior',
      'Conteúdo de economia de impostos converte 4× mais que pitch direto',
      'LinkedIn eficaz para alcançar sócios e diretores de PMEs',
    ],
  },
  beleza: {
    name: 'Beleza / Estética',
    cpl_min: 20, cpl_max: 65,
    cpl_by_channel: {
      'Instagram': 'R$22–50',
      'Meta Ads': 'R$20–55',
      'TikTok': 'R$15–40',
      'Google Search': 'R$30–65',
    },
    cvr_lead_to_sale: 0.20,
    avg_ticket: 350,
    ltv_multiplier: 4.5,
    best_channels: ['Instagram', 'Meta Ads', 'TikTok'],
    budget_floor: 1200,
    budget_ideal: 4000,
    kpi_thresholds: { cpl_good: 35, cpl_bad: 60, roas_good: 4.0, cvr_good: 0.25 },
    seasonality: ['Mai', 'Dez'],
    insights: [
      'Reels com transformação antes/depois têm alcance orgânico 5× maior',
      'Programa de fidelidade reduz CAC em 35% via indicações',
      'Datas: Dia das Mães, Natal e Carnaval são os maiores picos',
      'TikTok está superando Instagram em CPL para público 18–35 anos',
    ],
  },
  fitness: {
    name: 'Academia / Fitness',
    cpl_min: 18, cpl_max: 55,
    cpl_by_channel: {
      'Meta Ads': 'R$20–45',
      'Instagram': 'R$18–40',
      'TikTok': 'R$15–35',
      'Google Search': 'R$28–55',
    },
    cvr_lead_to_sale: 0.22,
    avg_ticket: 150,
    ltv_multiplier: 6.0,
    best_channels: ['Meta Ads', 'Instagram', 'TikTok'],
    budget_floor: 1000,
    budget_ideal: 4000,
    kpi_thresholds: { cpl_good: 28, cpl_bad: 50, roas_good: 5.0, cvr_good: 0.25 },
    seasonality: ['Jan', 'Ago'],
    insights: [
      'Jan e Ago são picos de matrícula — dobre o budget nesses meses',
      'Trial gratuito de 7 dias converte 3× mais que desconto direto',
      'Retenção é o maior desafio: 60% cancelam antes de 3 meses',
      'Personal trainers online crescem 4× mais rápido com TikTok',
    ],
  },
  tecnologia: {
    name: 'Tecnologia / SaaS',
    cpl_min: 30, cpl_max: 150,
    cpl_by_channel: {
      'Google Search': 'R$40–130',
      'LinkedIn': 'R$80–150',
      'Meta Ads': 'R$30–80',
      'YouTube': 'R$45–100',
    },
    cvr_lead_to_sale: 0.10,
    avg_ticket: 2500,
    ltv_multiplier: 8.0,
    best_channels: ['Google Search', 'LinkedIn', 'Meta Ads'],
    budget_floor: 4000,
    budget_ideal: 12000,
    kpi_thresholds: { cpl_good: 60, cpl_bad: 120, roas_good: 5.0, cvr_good: 0.12 },
    seasonality: ['Mar', 'Set'],
    insights: [
      'Trial gratuito é o melhor CTA para SaaS — converte 4× mais que demo',
      'LinkedIn essencial para B2B — cargo e empresa como critério de segmentação',
      'CAC payback < 12 meses é o benchmark saudável para SaaS',
      'Conteúdo de caso de uso converte 2× mais que pitch de funcionalidades',
    ],
  },
  pet: {
    name: 'Pet Shop / Veterinário',
    cpl_min: 22, cpl_max: 70,
    cpl_by_channel: {
      'Meta Ads': 'R$25–55',
      'Instagram': 'R$22–50',
      'Google Search': 'R$35–70',
      'TikTok': 'R$18–40',
    },
    cvr_lead_to_sale: 0.18,
    avg_ticket: 200,
    ltv_multiplier: 5.5,
    best_channels: ['Meta Ads', 'Instagram', 'TikTok'],
    budget_floor: 1000,
    budget_ideal: 3500,
    kpi_thresholds: { cpl_good: 35, cpl_bad: 60, roas_good: 4.5, cvr_good: 0.22 },
    seasonality: ['Dez', 'Jun'],
    insights: [
      'Conteúdo de cuidados com pets tem engajamento 3× acima da média',
      'LTV alto justifica investir em fidelização (petlover programs)',
      'Datas: Natal, Dia dos Namorados e aniversário do pet (coleta no cadastro)',
      'TikTok com vídeos de pets virais gera leads orgânicos a custo zero',
    ],
  },
  turismo: {
    name: 'Turismo / Agências de Viagem',
    cpl_min: 35, cpl_max: 110,
    cpl_by_channel: {
      'Meta Ads': 'R$38–85',
      'Google Search': 'R$45–100',
      'YouTube': 'R$50–110',
      'Instagram': 'R$35–75',
    },
    cvr_lead_to_sale: 0.08,
    avg_ticket: 4500,
    ltv_multiplier: 2.5,
    best_channels: ['Meta Ads', 'Google Search', 'YouTube'],
    budget_floor: 3000,
    budget_ideal: 9000,
    kpi_thresholds: { cpl_good: 60, cpl_bad: 100, roas_good: 6.0, cvr_good: 0.10 },
    seasonality: ['Jan', 'Jun'],
    insights: [
      'Jan–Fev e Jun–Jul são picos de compra de pacotes — aumente budget 2×',
      'Vídeos de destino têm CTR 4× maior que fotos estáticas',
      'Retargeting de abandono de cotação recupera 20% dos leads perdidos',
      'WhatsApp business com atendimento rápido é diferencial competitivo',
    ],
  },

  // ── Novos nichos ──────────────────────────────────────────────────────────────

  restaurante: {
    name: 'Restaurante / Food',
    cpl_min: 10, cpl_max: 40,
    cpl_by_channel: {
      'Instagram': 'R$10–28',
      'Meta Ads': 'R$12–35',
      'Google Maps/Search': 'R$15–40',
      'TikTok': 'R$8–22',
    },
    cvr_lead_to_sale: 0.30,
    avg_ticket: 90,
    ltv_multiplier: 8.0,
    best_channels: ['Instagram', 'Meta Ads', 'TikTok'],
    budget_floor: 800,
    budget_ideal: 3000,
    kpi_thresholds: { cpl_good: 18, cpl_bad: 35, roas_good: 5.0, cvr_good: 0.35 },
    seasonality: ['Dez', 'Jun'],
    insights: [
      'Google Meu Negócio é gratuito e gera 40% das reservas — priorize fotos',
      'Reels de pratos sendo preparados têm alcance orgânico 6× maior',
      'LTV é altíssimo — cliente satisfeito visita 2–3× por mês por anos',
      'Promoções de fidelidade (ex: compre 9 ganhe 1) reduzem churn em 45%',
    ],
  },
  consultoria: {
    name: 'Consultoria de Negócios',
    cpl_min: 80, cpl_max: 300,
    cpl_by_channel: {
      'LinkedIn': 'R$100–280',
      'Google Search': 'R$80–200',
      'Meta Ads': 'R$90–180',
      'YouTube': 'R$100–220',
    },
    cvr_lead_to_sale: 0.15,
    avg_ticket: 8000,
    ltv_multiplier: 3.5,
    best_channels: ['LinkedIn', 'Google Search', 'YouTube'],
    budget_floor: 4000,
    budget_ideal: 12000,
    kpi_thresholds: { cpl_good: 150, cpl_bad: 250, roas_good: 4.0, cvr_good: 0.18 },
    seasonality: ['Jan', 'Set'],
    insights: [
      'LinkedIn é obrigatório para B2B — perfil otimizado gera leads orgânicos',
      'Case studies em vídeo aumentam conversão em 60% vs texto',
      'Diagnóstico gratuito como isca digital converte 4× mais que e-book',
      'Ciclo de venda longo (30–90 dias) — nurturing por email é essencial',
    ],
  },
  marketing_agencia: {
    name: 'Marketing / Agência',
    cpl_min: 50, cpl_max: 180,
    cpl_by_channel: {
      'LinkedIn': 'R$70–160',
      'Meta Ads': 'R$50–120',
      'Google Search': 'R$60–150',
      'YouTube': 'R$65–140',
    },
    cvr_lead_to_sale: 0.12,
    avg_ticket: 3500,
    ltv_multiplier: 4.0,
    best_channels: ['LinkedIn', 'Meta Ads', 'Google Search'],
    budget_floor: 3000,
    budget_ideal: 8000,
    kpi_thresholds: { cpl_good: 90, cpl_bad: 150, roas_good: 4.5, cvr_good: 0.15 },
    seasonality: ['Jan', 'Set'],
    insights: [
      'Portfólio de resultados com dados reais é o melhor gatilho de conversão',
      'Proposta de diagnóstico gratuito converte 3× mais que orçamento direto',
      'Nichar em 1-2 segmentos reduz CPL em 40% e aumenta CVR',
      'Case studies com ROI comprovado diminuem ciclo de venda em 50%',
    ],
  },
  construcao: {
    name: 'Construção Civil / Reforma',
    cpl_min: 50, cpl_max: 160,
    cpl_by_channel: {
      'Google Search': 'R$60–140',
      'Meta Ads': 'R$50–120',
      'YouTube': 'R$70–150',
      'Instagram': 'R$55–130',
    },
    cvr_lead_to_sale: 0.12,
    avg_ticket: 25000,
    ltv_multiplier: 1.8,
    best_channels: ['Google Search', 'Meta Ads', 'Instagram'],
    budget_floor: 3000,
    budget_ideal: 8000,
    kpi_thresholds: { cpl_good: 80, cpl_bad: 140, roas_good: 5.0, cvr_good: 0.15 },
    seasonality: ['Mar', 'Out'],
    insights: [
      'Fotos e vídeos de obras concluídas têm CVR 3× maior que renderizações 3D',
      'Google Search com intenção "reforma + cidade" capta leads prontos para comprar',
      'Orçamento rápido (< 24h) é o maior diferencial competitivo neste nicho',
      'Instagram stories mostrando o dia a dia da obra geram credibilidade',
    ],
  },
  moda: {
    name: 'Moda / Vestuário',
    cpl_min: 10, cpl_max: 50,
    cpl_by_channel: {
      'Instagram': 'R$10–35',
      'TikTok': 'R$8–28',
      'Meta Ads': 'R$12–40',
      'Pinterest': 'R$15–45',
    },
    cvr_lead_to_sale: 0.04,
    avg_ticket: 180,
    ltv_multiplier: 4.0,
    best_channels: ['Instagram', 'TikTok', 'Meta Ads'],
    budget_floor: 1000,
    budget_ideal: 5000,
    kpi_thresholds: { cpl_good: 22, cpl_bad: 42, roas_good: 4.0, cvr_good: 0.05 },
    seasonality: ['Nov', 'Jan'],
    insights: [
      'TikTok Shop está crescendo 200% ao ano — pioneiros têm vantagem enorme',
      'Influencer micro (10k–100k) tem ROI 3× maior que influencer macro',
      'Coleções sazonais + urgência (edição limitada) aumentam CVR em 50%',
      'UGC (conteúdo de clientes) reduz CPL em 35% vs criativos produzidos',
    ],
  },
  psicologia: {
    name: 'Psicologia / Terapia',
    cpl_min: 30, cpl_max: 90,
    cpl_by_channel: {
      'Instagram': 'R$30–65',
      'Meta Ads': 'R$28–70',
      'Google Search': 'R$40–85',
      'YouTube': 'R$45–90',
    },
    cvr_lead_to_sale: 0.25,
    avg_ticket: 250,
    ltv_multiplier: 6.0,
    best_channels: ['Instagram', 'Meta Ads', 'Google Search'],
    budget_floor: 1200,
    budget_ideal: 4000,
    kpi_thresholds: { cpl_good: 45, cpl_bad: 80, roas_good: 3.5, cvr_good: 0.30 },
    seasonality: ['Jan', 'Ago'],
    insights: [
      'CFM proíbe depoimentos de pacientes — foco em conteúdo educativo',
      'Pós-pandemia: demanda por terapia online cresceu 180% e se mantém',
      'Conteúdo sobre saúde mental tem alcance orgânico 4× acima da média',
      'Primeira sessão gratuita ou a preço reduzido converte 3× mais',
    ],
  },
  nutricao: {
    name: 'Nutrição / Alimentação Saudável',
    cpl_min: 20, cpl_max: 70,
    cpl_by_channel: {
      'Instagram': 'R$20–50',
      'TikTok': 'R$15–40',
      'Meta Ads': 'R$22–60',
      'YouTube': 'R$30–70',
    },
    cvr_lead_to_sale: 0.18,
    avg_ticket: 400,
    ltv_multiplier: 4.5,
    best_channels: ['Instagram', 'TikTok', 'Meta Ads'],
    budget_floor: 1200,
    budget_ideal: 4000,
    kpi_thresholds: { cpl_good: 35, cpl_bad: 60, roas_good: 4.0, cvr_good: 0.22 },
    seasonality: ['Jan', 'Mai'],
    insights: [
      'Jan é o mês de ouro — búsca por nutricionista cresce 250% na virada do ano',
      'Antes/depois com dados (peso, exames) converte melhor que imagem genérica',
      'Atendimento online elimina barreira geográfica e dobra a base potencial',
      'CFN proíbe uso de antes/depois sem autorização — verifique regulação',
    ],
  },
  eventos: {
    name: 'Eventos / Entretenimento',
    cpl_min: 15, cpl_max: 60,
    cpl_by_channel: {
      'Instagram': 'R$15–45',
      'Meta Ads': 'R$18–55',
      'Google Search': 'R$25–60',
      'TikTok': 'R$12–35',
    },
    cvr_lead_to_sale: 0.10,
    avg_ticket: 1200,
    ltv_multiplier: 2.0,
    best_channels: ['Instagram', 'Meta Ads', 'TikTok'],
    budget_floor: 1500,
    budget_ideal: 5000,
    kpi_thresholds: { cpl_good: 30, cpl_bad: 55, roas_good: 5.0, cvr_good: 0.12 },
    seasonality: ['Nov', 'Dez'],
    insights: [
      'Urgência (ingressos limitados / early bird) é o maior gatilho de conversão',
      'Vídeos de edições anteriores têm CVR 4× maior que artes estáticas',
      'Antecipar campanha 45–60 dias do evento é essencial para preencher lotes',
      'Remarketing de quem visitou a página mas não comprou converte 8× mais',
    ],
  },
  moveis_planejados: {
    name: 'Móveis Planejados',
    cpl_min: 35, cpl_max: 90,
    cpl_by_channel: {
      'Facebook Ads': 'R$35–75',
      'Instagram Ads': 'R$40–90',
      'Google Search': 'R$50–100',
      'Google Display': 'R$30–60',
      'Pinterest Ads': 'R$25–55',
    },
    cvr_lead_to_sale: 0.12,
    avg_ticket: 18000,
    ltv_multiplier: 2.5,
    best_channels: ['Facebook Ads', 'Instagram Ads', 'Google Search', 'Pinterest Ads'],
    budget_floor: 2000,
    budget_ideal: 6000,
    kpi_thresholds: { cpl_good: 60, cpl_bad: 100, roas_good: 3.5, cvr_good: 0.10 },
    seasonality: ['Jan', 'Fev', 'Ago', 'Set', 'Nov'],
    insights: [
      'Tour virtual do projeto em 3D aumenta a taxa de conversão em 60-80%',
      'O ciclo de venda é longo (30-90 dias) — nutrição de lead via WhatsApp é essencial',
      'Antes/depois de ambientes reais é o criativo de maior CTR no segmento',
      'Picos de demanda: início do ano (mudanças/casamentos) e pré-Black Friday',
      'Concorrência com grandes redes (Tok&Stok, MadeiraMadeira) — diferencie pelo projeto personalizado',
    ],
  },
  automotivo: {
    name: 'Automotivo / Oficina / Concessionária',
    cpl_min: 30, cpl_max: 110,
    cpl_by_channel: {
      'Google Search': 'R$40–100',
      'Meta Ads': 'R$30–80',
      'YouTube': 'R$50–110',
      'Instagram': 'R$35–75',
    },
    cvr_lead_to_sale: 0.14,
    avg_ticket: 1800,
    ltv_multiplier: 4.0,
    best_channels: ['Google Search', 'Meta Ads', 'Instagram'],
    budget_floor: 2000,
    budget_ideal: 7000,
    kpi_thresholds: { cpl_good: 55, cpl_bad: 95, roas_good: 4.5, cvr_good: 0.18 },
    seasonality: ['Jan', 'Jul'],
    insights: [
      'Google Search com "revisão + cidade" capta leads de alta intenção',
      'Vídeos de serviços sendo realizados geram confiança e reduzem objeções',
      'LTV alto: cliente fiel retorna a cada 6 meses para revisão',
      'Jan (IPVA/licenciamento) e Jul (viagens) são picos de demanda',
    ],
  },
  barbearia: {
    name: 'Barbearia / Salão Masculino',
    cpl_min: 12, cpl_max: 45,
    cpl_by_channel: {
      'Instagram': 'R$12–32',
      'Meta Ads': 'R$15–40',
      'TikTok': 'R$10–28',
      'Google Maps': 'R$18–45',
    },
    cvr_lead_to_sale: 0.35,
    avg_ticket: 80,
    ltv_multiplier: 10.0,
    best_channels: ['Instagram', 'TikTok', 'Google Maps'],
    budget_floor: 600,
    budget_ideal: 2500,
    kpi_thresholds: { cpl_good: 22, cpl_bad: 40, roas_good: 5.0, cvr_good: 0.40 },
    seasonality: ['Dez', 'Jun'],
    insights: [
      'LTV excepcional: cliente fiel vai toda semana — fidelização é prioridade',
      'Reels de transformações (corte + barba) têm CTR 5× maior que posts estáticos',
      'Google Meu Negócio gratuito gera 50%+ das buscas locais',
      'Programa de fidelidade (ex: 9ª visita grátis) reduz churn em 60%',
    ],
  },
  fisioterapia: {
    name: 'Fisioterapia / Reabilitação',
    cpl_min: 28, cpl_max: 85,
    cpl_by_channel: {
      'Google Search': 'R$35–80',
      'Meta Ads': 'R$28–65',
      'Instagram': 'R$30–70',
      'YouTube': 'R$40–85',
    },
    cvr_lead_to_sale: 0.22,
    avg_ticket: 600,
    ltv_multiplier: 4.5,
    best_channels: ['Google Search', 'Meta Ads', 'Instagram'],
    budget_floor: 1500,
    budget_ideal: 5000,
    kpi_thresholds: { cpl_good: 45, cpl_bad: 75, roas_good: 4.5, cvr_good: 0.25 },
    seasonality: ['Jan', 'Ago'],
    insights: [
      'Google Search para dores específicas (ex: "fisio para hérnia de disco") tem CVR altíssimo',
      'Conteúdo educativo sobre prevenção gera autoridade e leads orgânicos',
      'Regulação CREFITO proíbe promessas de cura — foco em qualidade de vida',
      'Parceria com academias e médicos ortopedistas é canal de indicação poderoso',
    ],
  },
  farmacia: {
    name: 'Farmácia / Drogaria',
    cpl_min: 8, cpl_max: 35,
    cpl_by_channel: {
      'Google Shopping': 'R$8–25',
      'Meta Ads': 'R$10–30',
      'Google Search': 'R$12–35',
      'Instagram': 'R$10–28',
    },
    cvr_lead_to_sale: 0.25,
    avg_ticket: 120,
    ltv_multiplier: 6.0,
    best_channels: ['Google Shopping', 'Meta Ads', 'Google Search'],
    budget_floor: 1000,
    budget_ideal: 4000,
    kpi_thresholds: { cpl_good: 18, cpl_bad: 30, roas_good: 5.0, cvr_good: 0.30 },
    seasonality: ['Jan', 'Jun'],
    insights: [
      'Google Shopping para medicamentos de marca tem ROAS elevado e intenção alta',
      'ANVISA regula publicidade de medicamentos — foco em dermocosméticos e suplementos',
      'Programa de fidelidade e delivery expressam diferenciação de grandes redes',
      'Jan (gripes/alergias) e Jun (inverno) são os maiores picos de demanda',
    ],
  },
  servicos_residenciais: {
    name: 'Serviços Residenciais (Limpeza, Jardinagem, Dedetização)',
    cpl_min: 18, cpl_max: 65,
    cpl_by_channel: {
      'Google Search': 'R$22–60',
      'Meta Ads': 'R$18–50',
      'Google Maps': 'R$20–55',
      'Instagram': 'R$20–45',
    },
    cvr_lead_to_sale: 0.28,
    avg_ticket: 350,
    ltv_multiplier: 5.0,
    best_channels: ['Google Search', 'Meta Ads', 'Google Maps'],
    budget_floor: 1000,
    budget_ideal: 3500,
    kpi_thresholds: { cpl_good: 32, cpl_bad: 58, roas_good: 4.5, cvr_good: 0.30 },
    seasonality: ['Jan', 'Out'],
    insights: [
      'Google Search com "serviço + bairro/cidade" capta intenção imediata',
      'Fotos de antes/depois do ambiente tratado aumentam CVR em 45%',
      'Contratos mensais de manutenção criam LTV recorrente — foco em recorrência',
      'Velocidade de resposta (< 30min) é fator decisivo no fechamento',
    ],
  },
  arquitetura_design: {
    name: 'Arquitetura / Design de Interiores',
    cpl_min: 50, cpl_max: 160,
    cpl_by_channel: {
      'Instagram': 'R$50–130',
      'Pinterest': 'R$40–110',
      'Meta Ads': 'R$55–150',
      'Google Search': 'R$70–160',
    },
    cvr_lead_to_sale: 0.12,
    avg_ticket: 35000,
    ltv_multiplier: 2.0,
    best_channels: ['Instagram', 'Pinterest', 'Meta Ads'],
    budget_floor: 2500,
    budget_ideal: 8000,
    kpi_thresholds: { cpl_good: 90, cpl_bad: 140, roas_good: 5.0, cvr_good: 0.15 },
    seasonality: ['Jan', 'Fev', 'Out'],
    insights: [
      'Portfolio visual no Instagram e Pinterest é o principal canal de conversão',
      'Ciclo de venda longo (60–120 dias) — nurturing com projetos inspiracionais é essencial',
      'Projeto 3D gratuito como isca digital converte 4× mais que orçamento direto',
      'Parceria com construtoras e imobiliárias é fonte estratégica de indicações',
    ],
  },
  franquias: {
    name: 'Franquias / Expansão de Negócio',
    cpl_min: 60, cpl_max: 200,
    cpl_by_channel: {
      'Google Search': 'R$80–180',
      'Meta Ads': 'R$60–160',
      'LinkedIn': 'R$120–250',
      'YouTube': 'R$90–200',
    },
    cvr_lead_to_sale: 0.05,
    avg_ticket: 120000,
    ltv_multiplier: 3.5,
    best_channels: ['Google Search', 'Meta Ads', 'LinkedIn'],
    budget_floor: 4000,
    budget_ideal: 15000,
    kpi_thresholds: { cpl_good: 100, cpl_bad: 170, roas_good: 4.0, cvr_good: 0.07 },
    seasonality: ['Jan', 'Fev', 'Jul', 'Ago'],
    insights: [
      'Ciclo de venda longo (3–6 meses) — nutrição com conteúdo educativo é essencial',
      'Google Search captura candidatos de alta intenção ("franquia de X", "investir em franquia")',
      'Vídeo com depoimento de franqueado existente tem 4× mais engajamento que texto',
      'Investimento mínimo e prazo de retorno são os gatilhos de conversão principais',
      'Jan/Fev (planejamento anual) e Jul/Ago (decisões de meio de ano) são picos de busca',
    ],
  },
  fotografia_video: {
    name: 'Fotografia / Vídeo / Produção',
    cpl_min: 35, cpl_max: 120,
    cpl_by_channel: {
      'Instagram': 'R$35–90',
      'Meta Ads': 'R$40–100',
      'Google Search': 'R$50–120',
      'YouTube': 'R$55–115',
    },
    cvr_lead_to_sale: 0.18,
    avg_ticket: 2500,
    ltv_multiplier: 2.5,
    best_channels: ['Instagram', 'Meta Ads', 'Google Search'],
    budget_floor: 1500,
    budget_ideal: 5000,
    kpi_thresholds: { cpl_good: 65, cpl_bad: 105, roas_good: 4.0, cvr_good: 0.22 },
    seasonality: ['Nov', 'Dez'],
    insights: [
      'Portfólio visual é o maior gatilho de conversão — Instagram como vitrine principal',
      'Datas: casamentos (Out–Dez), formaturas (Nov–Dez), Natal são picos de alta demanda',
      'Depoimentos em vídeo de noivos e empresas convertem 3× mais que texto',
      'Especialização em nicho (ex: só casamentos ou só corporativo) reduz CPL em 35%',
    ],
  },
  seguranca_privada: {
    name: 'Segurança Privada / Monitoramento',
    cpl_min: 55, cpl_max: 180,
    cpl_by_channel: {
      'Google Search': 'R$65–160',
      'Meta Ads': 'R$55–130',
      'LinkedIn': 'R$90–180',
      'YouTube': 'R$70–150',
    },
    cvr_lead_to_sale: 0.15,
    avg_ticket: 1200,
    ltv_multiplier: 8.0,
    best_channels: ['Google Search', 'Meta Ads', 'LinkedIn'],
    budget_floor: 3000,
    budget_ideal: 9000,
    kpi_thresholds: { cpl_good: 90, cpl_bad: 155, roas_good: 5.0, cvr_good: 0.18 },
    seasonality: ['Jan', 'Out'],
    insights: [
      'LTV altíssimo: contratos mensais recorrentes por anos — CAC elevado é justificável',
      'Google Search para "segurança eletrônica + cidade" capta intenção de alta urgência',
      'LinkedIn para abordagem B2B (condomínios, empresas, shoppings)',
      'Cases de segurança frustrada evitada geram credibilidade imediata',
    ],
  },
  padaria_cafeteria: {
    name: 'Padaria / Cafeteria / Confeitaria',
    cpl_min: 8, cpl_max: 35,
    cpl_by_channel: {
      'Instagram': 'R$8–25',
      'Meta Ads': 'R$10–30',
      'TikTok': 'R$7–22',
      'Google Maps': 'R$12–35',
    },
    cvr_lead_to_sale: 0.40,
    avg_ticket: 55,
    ltv_multiplier: 12.0,
    best_channels: ['Instagram', 'TikTok', 'Google Maps'],
    budget_floor: 500,
    budget_ideal: 2000,
    kpi_thresholds: { cpl_good: 15, cpl_bad: 30, roas_good: 6.0, cvr_good: 0.45 },
    seasonality: ['Dez', 'Jun'],
    insights: [
      'LTV excepcional: cliente fiel visita 3–4× por semana — foco em fidelização',
      'Google Meu Negócio e fotos atualizadas geram 60% das descobertas orgânicas',
      'Reels de produtos sendo preparados (pão saindo do forno, café artesanal) viralizam',
      'Delivery via iFood/Rappi amplia alcance geográfico sem custo de mídia extra',
    ],
  },
  depilacao: {
    name: 'Depilação a Laser / Cera',
    cpl_min: 18, cpl_max: 60,
    cpl_by_channel: {
      'Instagram': 'R$18–45',
      'Meta Ads': 'R$20–55',
      'TikTok': 'R$15–38',
      'Google Search': 'R$28–60',
    },
    cvr_lead_to_sale: 0.28,
    avg_ticket: 300,
    ltv_multiplier: 5.0,
    best_channels: ['Instagram', 'Meta Ads', 'TikTok'],
    budget_floor: 1000,
    budget_ideal: 3500,
    kpi_thresholds: { cpl_good: 32, cpl_bad: 55, roas_good: 4.5, cvr_good: 0.32 },
    seasonality: ['Out', 'Nov'],
    insights: [
      'Pré-verão (Out/Nov) é o pico de demanda — concentre 40% do budget anual',
      'Pacotes de sessões criam recorrência e aumentam LTV em 3×',
      'Antes/depois (somente com autorização) têm CTR 4× maior que imagens genéricas',
      'TikTok emerge como canal de baixo CPL para público 20–35 anos',
    ],
  },
  harmonizacao: {
    name: 'Harmonização Facial / Estética Avançada',
    cpl_min: 40, cpl_max: 120,
    cpl_by_channel: {
      'Instagram': 'R$40–95',
      'Meta Ads': 'R$45–110',
      'TikTok': 'R$35–80',
      'YouTube': 'R$55–120',
    },
    cvr_lead_to_sale: 0.18,
    avg_ticket: 1500,
    ltv_multiplier: 4.0,
    best_channels: ['Instagram', 'Meta Ads', 'TikTok'],
    budget_floor: 2000,
    budget_ideal: 6000,
    kpi_thresholds: { cpl_good: 65, cpl_bad: 105, roas_good: 4.0, cvr_good: 0.22 },
    seasonality: ['Nov', 'Dez'],
    insights: [
      'CFM/CFO regulam antes/depois — use conteúdo educativo sobre procedimentos',
      'TikTok está superando Instagram em alcance orgânico para este nicho',
      'Autoridade médica (formação, certificações) é o principal gatilho de conversão',
      'Pré-Natal e pré-Carnaval são picos além do verão',
    ],
  },
  autoescola: {
    name: 'Autoescola / CNH',
    cpl_min: 20, cpl_max: 70,
    cpl_by_channel: {
      'Google Search': 'R$25–65',
      'Meta Ads': 'R$20–55',
      'Instagram': 'R$22–60',
      'TikTok': 'R$18–45',
    },
    cvr_lead_to_sale: 0.30,
    avg_ticket: 1800,
    ltv_multiplier: 1.5,
    best_channels: ['Google Search', 'Meta Ads', 'Instagram'],
    budget_floor: 1000,
    budget_ideal: 3500,
    kpi_thresholds: { cpl_good: 38, cpl_bad: 62, roas_good: 5.0, cvr_good: 0.35 },
    seasonality: ['Jan', 'Jul'],
    insights: [
      'Google Search com "autoescola + bairro" tem a maior intenção de compra',
      'Jan (início do ano, novos objetivos) e Jul (férias escolares) são picos',
      'Parcelamento sem juros é diferencial decisivo na conversão',
      'Depoimentos de alunos aprovados na primeira tentativa reduzem objeções',
    ],
  },
  lavanderia: {
    name: 'Lavanderia / Lavanderias Industriais',
    cpl_min: 15, cpl_max: 55,
    cpl_by_channel: {
      'Google Search': 'R$18–50',
      'Meta Ads': 'R$15–45',
      'Google Maps': 'R$20–55',
      'Instagram': 'R$15–40',
    },
    cvr_lead_to_sale: 0.32,
    avg_ticket: 120,
    ltv_multiplier: 8.0,
    best_channels: ['Google Search', 'Meta Ads', 'Google Maps'],
    budget_floor: 800,
    budget_ideal: 3000,
    kpi_thresholds: { cpl_good: 28, cpl_bad: 48, roas_good: 5.0, cvr_good: 0.38 },
    seasonality: ['Jan', 'Jun'],
    insights: [
      'LTV alto: cliente fiel usa mensalmente por anos — fidelização tem ROI enorme',
      'Google Maps e Meu Negócio geram 50% dos leads locais sem custo adicional',
      'Serviço de coleta e entrega é diferencial competitivo decisivo',
      'Parcerias com hotéis, pousadas e restaurantes criam receita B2B recorrente',
    ],
  },
  lava_jato: {
    name: 'Lava Jato / Auto Detailing',
    cpl_min: 12, cpl_max: 40,
    cpl_by_channel: {
      'Meta Ads':       'R$12–28',
      'Instagram':      'R$10–25',
      'Google Search':  'R$18–38',
      'WhatsApp Ads':   'R$10–22',
    },
    cvr_lead_to_sale: 0.42,
    avg_ticket: 180,
    ltv_multiplier: 6.5,
    best_channels: ['Meta Ads', 'Instagram', 'Google Search'],
    budget_floor: 600,
    budget_ideal: 2000,
    kpi_thresholds: { cpl_good: 18, cpl_bad: 35, roas_good: 3.0, cvr_good: 0.45 },
    seasonality: ['Dez', 'Jan'],
    insights: [
      'Cliente médio volta a cada 3–4 semanas — LTV 6× o ticket inicial é conservador',
      'Vídeo antes/depois de 15s no Instagram Reels tem CPL 40% abaixo de imagem estática',
      'Pacote fidelidade (ex: 4 lavagens por R$X) aumenta ticket médio em 65% e churn zero',
      'Chuva e temporada chuvosa (Nov–Mar no Sudeste) criam urgência natural nos criativos',
      'Segmentação por raio de 5–8 km + renda B/C converte melhor que segmentação por interesse',
    ],
  },
  auditoria: {
    name: 'Auditoria / Compliance / Riscos',
    cpl_min: 150, cpl_max: 600,
    cpl_by_channel: {
      'LinkedIn':      'R$180–500',
      'Google Search': 'R$150–450',
      'E-mail Mkt':    'R$120–350',
      'YouTube':       'R$200–600',
    },
    cvr_lead_to_sale: 0.10,
    avg_ticket: 18000,
    ltv_multiplier: 5.0,
    best_channels: ['LinkedIn', 'Google Search', 'E-mail Mkt'],
    budget_floor: 5000,
    budget_ideal: 15000,
    kpi_thresholds: { cpl_good: 280, cpl_bad: 500, roas_good: 4.0, cvr_good: 0.12 },
    seasonality: ['Jan', 'Mar'],
    insights: [
      'CFC/CRC regulam publicidade — foco em conteúdo técnico e autoridade, sem promessas de resultado',
      'Empresas obrigadas por lei (CVM, BACEN, seguradoras) são os leads mais quentes — segmente por setor',
      'Ciclo de venda longo (60–120 dias): LinkedIn + e-mail nurturing com conteúdo regulatório é essencial',
      'Relatórios e benchmarks de mercado como iscas digitais convertem 4× mais que pitch direto',
      'Depoimento de CFO ou Comitê de Auditoria é o gatilho de conversão mais poderoso neste nicho',
    ],
  },
  corretor_saude: {
    name: 'Corretor de Planos de Saúde',
    cpl_min: 38, cpl_max: 95,
    cpl_by_channel: {
      'Google Search': 'R$50–110',
      'Meta Ads':      'R$38–85',
      'YouTube':       'R$55–100',
      'Instagram':     'R$40–80',
    },
    cvr_lead_to_sale: 0.11,
    avg_ticket: 1200,
    ltv_multiplier: 3.5,
    best_channels: ['Google Search', 'Meta Ads', 'YouTube'],
    budget_floor: 2500,
    budget_ideal: 6000,
    kpi_thresholds: { cpl_good: 55, cpl_bad: 90, roas_good: 3.5, cvr_good: 0.12 },
    seasonality: ['Jan', 'Mar', 'Abr'],
    insights: [
      'Jan e Mar são picos: demissões (perda de plano PJ) + reajuste anual geram ondas de migração',
      'Palavra-chave "plano de saúde individual" tem CPC 40% menor que "plano empresarial" com CTR similar',
      'WhatsApp imediato após lead reduz perda para concorrente — 70% do mercado decide em 24h',
      'Vídeo de comparação (ANS + reajuste histórico) converte 3× mais que imagem estática',
      'SUSEP proíbe comparação direta de preço entre operadoras — copy deve focar em cobertura e carência',
    ],
  },

  corretor_imobiliario: {
    name: 'Corretor Imobiliário',
    cpl_min: 75, cpl_max: 220,
    cpl_by_channel: {
      'Google Search': 'R$90–250',
      'Meta Ads':      'R$75–180',
      'Instagram':     'R$70–160',
      'YouTube':       'R$100–220',
      'LinkedIn':      'R$140–320',
    },
    cvr_lead_to_sale: 0.05,
    avg_ticket: 5500,
    ltv_multiplier: 2.0,
    best_channels: ['Google Search', 'Meta Ads', 'Instagram'],
    budget_floor: 3500,
    budget_ideal: 10000,
    kpi_thresholds: { cpl_good: 120, cpl_bad: 200, roas_good: 4.0, cvr_good: 0.06 },
    seasonality: ['Mar', 'Abr', 'Set', 'Out'],
    insights: [
      'Ciclo médio de decisão: 45–90 dias — funil de nutrição via WhatsApp + email é obrigatório',
      'Vídeo de tour de imóvel gera 5× mais engajamento e 2× mais leads qualificados que foto estática',
      'Segmentar por faixa de renda + bairro reduz CPL em até 35% vs público amplo',
      'CRECI proíbe promessas de valorização garantida — foco em dados de mercado e localização',
      'Retargeting de visitantes do site converte 4× mais que tráfego frio — instale pixel antes de anunciar',
    ],
  },

  protecao_patrimonial: {
    name: 'Proteção Patrimonial',
    cpl_min: 65, cpl_max: 170,
    cpl_by_channel: {
      'Google Search': 'R$80–200',
      'Meta Ads':      'R$65–150',
      'LinkedIn':      'R$140–320',
      'YouTube':       'R$90–180',
    },
    cvr_lead_to_sale: 0.08,
    avg_ticket: 9000,
    ltv_multiplier: 5.0,
    best_channels: ['Google Search', 'LinkedIn', 'Meta Ads'],
    budget_floor: 4000,
    budget_ideal: 12000,
    kpi_thresholds: { cpl_good: 100, cpl_bad: 160, roas_good: 4.5, cvr_good: 0.10 },
    seasonality: ['Jan', 'Mar', 'Abr'],
    insights: [
      'Jan (planejamento fiscal) e Mar–Abr (declaração IR) são gatilhos naturais de interesse',
      'Público: empresários 35–60 anos com patrimônio >R$500k — LinkedIn e Google funcionam melhor que TikTok',
      'Copy de medo funciona: "o que acontece com seu patrimônio se você falecer amanhã?"',
      'Webinar de educação (holding, offshore, previdência) converte 4× mais que anúncio direto',
      'OAB e CVM regulam — evite promessas de proteção total; foque em "estratégia jurídica legal"',
    ],
  },

  seguro_vida: {
    name: 'Seguro de Vida',
    cpl_min: 32, cpl_max: 90,
    cpl_by_channel: {
      'Google Search': 'R$42–100',
      'Meta Ads':      'R$32–80',
      'YouTube':       'R$50–95',
      'Instagram':     'R$35–75',
    },
    cvr_lead_to_sale: 0.12,
    avg_ticket: 1400,
    ltv_multiplier: 5.0,
    best_channels: ['Google Search', 'Meta Ads', 'YouTube'],
    budget_floor: 2000,
    budget_ideal: 5500,
    kpi_thresholds: { cpl_good: 50, cpl_bad: 85, roas_good: 5.0, cvr_good: 0.13 },
    seasonality: ['Jan', 'Mar', 'Set'],
    insights: [
      'Gatilhos naturais: nascimento de filho, casamento, financiamento imobiliário, herança recebida',
      'Vídeo curto (30s) mostrando o que a família recebe converte melhor que texto sobre cobertura',
      'SUSEP proíbe uso de palavras como "garantido" sem ressalvas — foque em "proteção" e "tranquilidade"',
      'Produto de baixo LTV imediato mas alto LTV estrutural: priorize retenção pós-venda',
      'Simulador de cotação como lead magnet reduz CPL em 28% vs formulário padrão',
    ],
  },

  seguro_auto: {
    name: 'Seguro Automotivo',
    cpl_min: 22, cpl_max: 65,
    cpl_by_channel: {
      'Google Search': 'R$28–72',
      'Meta Ads':      'R$22–55',
      'Instagram':     'R$20–50',
      'YouTube':       'R$35–70',
    },
    cvr_lead_to_sale: 0.17,
    avg_ticket: 650,
    ltv_multiplier: 3.0,
    best_channels: ['Google Search', 'Meta Ads', 'Instagram'],
    budget_floor: 2000,
    budget_ideal: 5000,
    kpi_thresholds: { cpl_good: 38, cpl_bad: 60, roas_good: 3.5, cvr_good: 0.18 },
    seasonality: ['Jan', 'Mar', 'Abr', 'Dez'],
    insights: [
      'Jan e Dez: compra de carro novo dispara demanda — antecipe budget nesses meses',
      'Mar–Abr: vencimento de apólices do início do ano gera onda de cotação — ideal para migração',
      'Produto altamente comparado por preço: diferencie por atendimento 24h e carro reserva',
      'Remarketing de visitantes de comparadores (Bidu, MercadoSeguro) converte 5× mais',
      'Simulador de economia vs seguro atual é o criativo de maior CTR neste nicho',
    ],
  },

  seguro_residencial: {
    name: 'Seguro Residencial',
    cpl_min: 28, cpl_max: 70,
    cpl_by_channel: {
      'Google Search': 'R$33–80',
      'Meta Ads':      'R$28–65',
      'Instagram':     'R$25–60',
      'YouTube':       'R$38–75',
    },
    cvr_lead_to_sale: 0.15,
    avg_ticket: 400,
    ltv_multiplier: 3.5,
    best_channels: ['Google Search', 'Meta Ads', 'Instagram'],
    budget_floor: 1500,
    budget_ideal: 4000,
    kpi_thresholds: { cpl_good: 40, cpl_bad: 65, roas_good: 3.0, cvr_good: 0.16 },
    seasonality: ['Jan', 'Mar', 'Out'],
    insights: [
      'Jan é pico de mudanças e aluguéis novos — gatilho natural de contratação',
      'Imobiliárias e corretores são fonte de indicação poderosa — crie programa de parceiros',
      'Copy de cenário real ("o que acontece se você inundar o apê do vizinho?") converte mais que genérico',
      'Preço médio baixo = decisão rápida; foco em volume e automação no pós-lead',
      'Diferencial de assistência 24h (chaveiro, encanador) gera mais conversão que cobertura completa',
    ],
  },

  rh_empresa: {
    name: 'Empresas de RH / Recursos Humanos',
    cpl_min: 55, cpl_max: 160,
    cpl_by_channel: {
      'LinkedIn':      'R$120–300',
      'Google Search': 'R$75–190',
      'Meta Ads':      'R$55–140',
      'YouTube':       'R$80–170',
    },
    cvr_lead_to_sale: 0.09,
    avg_ticket: 8000,
    ltv_multiplier: 4.5,
    best_channels: ['LinkedIn', 'Google Search', 'Meta Ads'],
    budget_floor: 4000,
    budget_ideal: 12000,
    kpi_thresholds: { cpl_good: 90, cpl_bad: 150, roas_good: 5.0, cvr_good: 0.11 },
    seasonality: ['Jan', 'Fev', 'Ago', 'Set'],
    insights: [
      'Jan–Fev: planejamento anual de headcount — decisores estão definindo budget de RH',
      'Ago–Set: preparação de budget Q4 + planejamento de 2026 — segundo pico do ano',
      'LinkedIn para decisores (CHRO, CEO PME); Meta para empresas <50 funcionários',
      'Conteúdo técnico (guia de turnover, custo de contratação errada em R$) gera lead qualificado',
      'Ciclo B2B de 30–60 dias: sequência de e-mail + case de cliente é essencial no nurturing',
    ],
  },

  energia_solar: {
    name: 'Energia Solar',
    cpl_min: 80, cpl_max: 180,
    cpl_by_channel: { 'Google Search': 'R$90–160', 'Meta Ads': 'R$80–150', 'YouTube': 'R$110–200' },
    cvr_lead_to_sale: 0.08, avg_ticket: 35000, ltv_multiplier: 1.3,
    best_channels: ['Google Search', 'Meta Ads', 'YouTube'],
    budget_floor: 5000, budget_ideal: 15000,
    kpi_thresholds: { cpl_good: 110, cpl_bad: 170, roas_good: 5.0, cvr_good: 0.10 },
    seasonality: ['Jan', 'Fev', 'Out', 'Nov'],
    insights: [
      'Pico de contas de luz no verão (Jan–Fev) e pré-verão (Out–Nov) — melhor momento para campanhas',
      'Simulador de economia online reduz CPL em 35% vs criativo direto — use como isca',
      'Google Search captura intenção forte: "energia solar [cidade]" tem CVR 2× maior que Meta',
      'Financiamento em 60× sem entrada é o argumento mais efetivo — destaque no criativo, não só na LP',
    ],
  },
  clinica_veterinaria: {
    name: 'Clínica Veterinária',
    cpl_min: 25, cpl_max: 60,
    cpl_by_channel: { 'Instagram Ads': 'R$22–45', 'Meta Ads': 'R$25–55', 'Google Search': 'R$35–65' },
    cvr_lead_to_sale: 0.20, avg_ticket: 380, ltv_multiplier: 4.5,
    best_channels: ['Instagram Ads', 'Meta Ads', 'Google Maps'],
    budget_floor: 1500, budget_ideal: 4000,
    kpi_thresholds: { cpl_good: 35, cpl_bad: 55, roas_good: 5.0, cvr_good: 0.22 },
    seasonality: ['Jul', 'Ago', 'Dez'],
    insights: [
      'Inverno (Jul–Ago) aumenta doenças respiratórias em pets — pico de consultas de emergência',
      'Dez: adoção de animais nas festas → pico de demanda por vacinação e castração',
      'Instagram com vídeo de pet tratado gera CPL 40% menor que foto estática',
      'Pacote mensal de consultas + vacinas tem ticket 2.8× maior e fideliza o cliente por anos',
    ],
  },
  oftalmologia: {
    name: 'Oftalmologia',
    cpl_min: 40, cpl_max: 90,
    cpl_by_channel: { 'Google Search': 'R$45–85', 'Meta Ads': 'R$40–75', 'Instagram Ads': 'R$35–70' },
    cvr_lead_to_sale: 0.16, avg_ticket: 1800, ltv_multiplier: 3.5,
    best_channels: ['Google Search', 'Meta Ads', 'Instagram Ads'],
    budget_floor: 3000, budget_ideal: 8000,
    kpi_thresholds: { cpl_good: 55, cpl_bad: 85, roas_good: 4.5, cvr_good: 0.18 },
    seasonality: ['Jan', 'Jul'],
    insights: [
      'LASIK e cirurgia refrativa têm ticket 8× maior que consulta — segmente criativos por intenção',
      'Busca por "óculos" não é lead de clínica — use palavras-chave negativas agressivamente no Google',
      'Pico Jan (resolução de cuidar da saúde visual) e Jul (férias para procedimentos eletivos)',
      'Depoimento de paciente que parou de usar óculos tem CTR 3× maior em Meta Ads',
    ],
  },
  dermatologia: {
    name: 'Dermatologia',
    cpl_min: 45, cpl_max: 100,
    cpl_by_channel: { 'Instagram Ads': 'R$40–85', 'Meta Ads': 'R$45–90', 'TikTok': 'R$30–65', 'Google Search': 'R$55–100' },
    cvr_lead_to_sale: 0.18, avg_ticket: 650, ltv_multiplier: 3.8,
    best_channels: ['Instagram Ads', 'Meta Ads', 'TikTok'],
    budget_floor: 2500, budget_ideal: 7000,
    kpi_thresholds: { cpl_good: 60, cpl_bad: 90, roas_good: 4.0, cvr_good: 0.20 },
    seasonality: ['Out', 'Nov', 'Jan'],
    insights: [
      'Pré-verão (Out–Nov) é pico absoluto — manchas, acne, laser e rejuvenescimento disparam',
      'TikTok emergiu como canal de baixo CPL para derma — conteúdo educativo converte bem',
      'CFM/CFO: fotos antes/depois exigem consentimento — não use sem autorização formal',
      'Segmente por procedimento específico (não "acne" genérico) para leads mais qualificados',
    ],
  },
  cirurgia_plastica: {
    name: 'Cirurgia Plástica',
    cpl_min: 120, cpl_max: 350,
    cpl_by_channel: { 'Instagram Ads': 'R$120–280', 'Meta Ads': 'R$130–310', 'Google Search': 'R$180–380', 'YouTube': 'R$150–300' },
    cvr_lead_to_sale: 0.05, avg_ticket: 18000, ltv_multiplier: 1.8,
    best_channels: ['Instagram Ads', 'Meta Ads', 'Google Search'],
    budget_floor: 8000, budget_ideal: 25000,
    kpi_thresholds: { cpl_good: 180, cpl_bad: 320, roas_good: 3.5, cvr_good: 0.07 },
    seasonality: ['Set', 'Out', 'Nov'],
    insights: [
      'Ciclo de decisão de 60–120 dias — remarketing com conteúdo educativo é obrigatório',
      'Pré-verão (Set–Nov) concentra 60% das consultas de rinoplastia, lipo e mamoplastia',
      'CFM proíbe promoção de procedimentos — foque em autoridade médica e educação',
      'Instagram com médico explicando técnica em vídeo tem maior conversão que foto de resultado',
    ],
  },
  ortopedia: {
    name: 'Ortopedia',
    cpl_min: 50, cpl_max: 110,
    cpl_by_channel: { 'Google Search': 'R$55–100', 'Meta Ads': 'R$50–95', 'YouTube': 'R$70–120' },
    cvr_lead_to_sale: 0.18, avg_ticket: 1500, ltv_multiplier: 3.0,
    best_channels: ['Google Search', 'Meta Ads', 'YouTube'],
    budget_floor: 3000, budget_ideal: 8000,
    kpi_thresholds: { cpl_good: 65, cpl_bad: 100, roas_good: 4.0, cvr_good: 0.20 },
    seasonality: ['Mai', 'Jun', 'Jan'],
    insights: [
      'Inverno (Mai–Jun) aumenta lombalgias e lesões articulares — pico de consultas',
      'Jan: atividade física intensa no verão gera lesões esportivas — segundo pico',
      'Google Search com palavras de dor ("dor no joelho", "hérnia de disco") converte muito mais',
      'Conteúdo sobre lesões esportivas é viral e gera leads orgânicos qualificados no Instagram',
    ],
  },
  pediatria: {
    name: 'Pediatria',
    cpl_min: 30, cpl_max: 70,
    cpl_by_channel: { 'Facebook': 'R$30–65', 'Meta Ads': 'R$28–60', 'Instagram Ads': 'R$25–55', 'Google Search': 'R$35–70' },
    cvr_lead_to_sale: 0.22, avg_ticket: 380, ltv_multiplier: 5.5,
    best_channels: ['Facebook', 'Meta Ads', 'Instagram Ads'],
    budget_floor: 2000, budget_ideal: 5000,
    kpi_thresholds: { cpl_good: 40, cpl_bad: 65, roas_good: 5.0, cvr_good: 0.25 },
    seasonality: ['Ago', 'Set', 'Jan'],
    insights: [
      'Volta às aulas (Ago) e início do ano (Jan) são picos — pais agendam checkups preventivos',
      'Facebook (35–45 anos) supera Instagram para atingir pais de crianças pequenas',
      'Puericultura (consultas de rotina) é o produto de entrada que fideliza por anos',
      'Calendário vacinal como isca de conteúdo — pais pesquisam muito e engajam alto',
    ],
  },
  ginecologia: {
    name: 'Ginecologia & Obstetrícia',
    cpl_min: 35, cpl_max: 75,
    cpl_by_channel: { 'Instagram Ads': 'R$30–65', 'Meta Ads': 'R$35–70', 'Google Search': 'R$40–80' },
    cvr_lead_to_sale: 0.20, avg_ticket: 550, ltv_multiplier: 4.5,
    best_channels: ['Instagram Ads', 'Meta Ads', 'Google Search'],
    budget_floor: 2000, budget_ideal: 5000,
    kpi_thresholds: { cpl_good: 45, cpl_bad: 70, roas_good: 4.5, cvr_good: 0.22 },
    seasonality: ['Jan', 'Jul', 'Out'],
    insights: [
      'Pré-natal (obstetrícia) tem LTV 4× maior que consulta avulsa — priorize esse produto',
      'Conteúdo sobre saúde feminina (TPM, menopausa, fertilidade) tem alto engajamento orgânico',
      'Mulheres de 25–45 anos no Instagram com interesse em maternidade são o segmento de ouro',
      'Exame Papanicolau como gatilho de campanha sazonal preventiva — Jan e Jul ideais',
    ],
  },
  cardiologia: {
    name: 'Cardiologia',
    cpl_min: 55, cpl_max: 120,
    cpl_by_channel: { 'Google Search': 'R$60–110', 'Facebook': 'R$60–115', 'YouTube': 'R$75–130', 'Meta Ads': 'R$55–100' },
    cvr_lead_to_sale: 0.15, avg_ticket: 1800, ltv_multiplier: 3.5,
    best_channels: ['Google Search', 'Facebook', 'YouTube'],
    budget_floor: 4000, budget_ideal: 10000,
    kpi_thresholds: { cpl_good: 70, cpl_bad: 110, roas_good: 4.0, cvr_good: 0.18 },
    seasonality: ['Jan', 'Abr', 'Mai'],
    insights: [
      'Público predominante 45+ anos → Facebook supera Instagram para geração de leads qualificados',
      'Jan (resolução de saúde) e Abr–Mai (pré-inverno, risco cardiovascular) são picos',
      'Conteúdo sobre prevenção de infarto e hipertensão tem CTR alto com esse público',
      'Check-up cardiovascular como produto de entrada — ticket menor, LTV alto por acompanhamento',
    ],
  },
  psiquiatria: {
    name: 'Psiquiatria',
    cpl_min: 40, cpl_max: 95,
    cpl_by_channel: { 'Meta Ads': 'R$38–80', 'Instagram Ads': 'R$35–75', 'Google Search': 'R$50–95' },
    cvr_lead_to_sale: 0.18, avg_ticket: 700, ltv_multiplier: 6.5,
    best_channels: ['Meta Ads', 'Instagram Ads', 'Google Search'],
    budget_floor: 2500, budget_ideal: 6000,
    kpi_thresholds: { cpl_good: 55, cpl_bad: 85, roas_good: 4.5, cvr_good: 0.20 },
    seasonality: ['Jan', 'Set', 'Out'],
    insights: [
      'Estigma reduz busca ativa — conteúdo que normaliza tratamento psiquiátrico tem alta retenção',
      'LTV mais alto de clínicas médicas: pacientes tratam por meses ou anos continuamente',
      'Ansiedade, TDAH e depressão pós-pandemia elevaram busca em 80% — mercado crescente',
      'Consulta online abre mercado nacional sem limitação geográfica — diferencial estratégico',
    ],
  },
  fonoaudiologia: {
    name: 'Fonoaudiologia',
    cpl_min: 30, cpl_max: 65,
    cpl_by_channel: { 'Meta Ads': 'R$28–55', 'Instagram Ads': 'R$25–50', 'Google Search': 'R$35–65' },
    cvr_lead_to_sale: 0.22, avg_ticket: 420, ltv_multiplier: 4.8,
    best_channels: ['Meta Ads', 'Instagram Ads', 'Google Search'],
    budget_floor: 1500, budget_ideal: 4000,
    kpi_thresholds: { cpl_good: 38, cpl_bad: 60, roas_good: 5.0, cvr_good: 0.25 },
    seasonality: ['Fev', 'Mar', 'Ago', 'Set'],
    insights: [
      'Volta às aulas (Fev–Mar, Ago) é o principal gatilho — professores identificam dificuldades de fala',
      'Gagueira, dislexia e atrasos de fala são as principais buscas — conteúdo para pais converte bem',
      'Fonoaudiologia para adultos (disfagia, voz profissional) é segmento sub-explorado com CPL menor',
      'Facebook é melhor que Instagram para atingir pais de 30–45 anos com filhos em idade escolar',
    ],
  },
  clinica_reabilitacao: {
    name: 'Clínica de Reabilitação',
    cpl_min: 40, cpl_max: 90,
    cpl_by_channel: { 'Google Search': 'R$42–80', 'Meta Ads': 'R$40–75', 'Instagram Ads': 'R$35–70' },
    cvr_lead_to_sale: 0.20, avg_ticket: 1200, ltv_multiplier: 3.2,
    best_channels: ['Google Search', 'Meta Ads', 'Instagram Ads'],
    budget_floor: 2500, budget_ideal: 6000,
    kpi_thresholds: { cpl_good: 55, cpl_bad: 82, roas_good: 4.5, cvr_good: 0.22 },
    seasonality: ['Jan', 'Jun', 'Jul'],
    insights: [
      'Jan: maratonas e atividade física intensa geram lesões — pico de demanda',
      'Jun–Jul: frio aumenta tendinites, lombalgias e fraturas em idosos',
      'Reabilitação pós-cirúrgica (ortopedia, joelho) tem LTV alto — parceria com ortopedistas gera referral',
      'Pilates clínico como diferencial — atrai público feminino de maior poder aquisitivo',
    ],
  },
  clinica_capilar: {
    name: 'Clínica Capilar / Transplante de Cabelo',
    cpl_min: 60, cpl_max: 150,
    cpl_by_channel: { 'Instagram Ads': 'R$55–130', 'Meta Ads': 'R$60–140', 'YouTube': 'R$80–160', 'Google Search': 'R$90–170' },
    cvr_lead_to_sale: 0.10, avg_ticket: 8000, ltv_multiplier: 2.0,
    best_channels: ['Instagram Ads', 'Meta Ads', 'YouTube'],
    budget_floor: 4000, budget_ideal: 12000,
    kpi_thresholds: { cpl_good: 85, cpl_bad: 140, roas_good: 4.0, cvr_good: 0.12 },
    seasonality: ['Set', 'Out', 'Nov'],
    insights: [
      'Pré-verão (Set–Nov) é o pico — homens querem resolver a calvície antes do verão',
      'YouTube com conteúdo sobre calvície tem alto engajamento com público masculino 30–50 anos',
      'Antes/depois de transplante capilar é o criativo de maior CVR — use com autorização do paciente',
      'Minoxidil e finasterida como topo de funil educativo atraem leads interessados em tratamento',
    ],
  },
  escola_idiomas: {
    name: 'Escola de Idiomas',
    cpl_min: 25, cpl_max: 60,
    cpl_by_channel: { 'Meta Ads': 'R$22–50', 'Instagram Ads': 'R$20–45', 'TikTok': 'R$15–35', 'Google Search': 'R$30–60' },
    cvr_lead_to_sale: 0.18, avg_ticket: 4800, ltv_multiplier: 2.5,
    best_channels: ['Meta Ads', 'Instagram Ads', 'TikTok'],
    budget_floor: 2000, budget_ideal: 5000,
    kpi_thresholds: { cpl_good: 35, cpl_bad: 55, roas_good: 5.5, cvr_good: 0.20 },
    seasonality: ['Jan', 'Fev', 'Jul', 'Ago'],
    insights: [
      'Jan e Jul são janelas de matrícula — 70% das matrículas acontecem nessas épocas',
      'TikTok com "dica de inglês em 60s" gera CPL 30% menor que Meta — invista em conteúdo',
      'Inglês profissional (MBA, carreira) tem ticket 40% maior e CVR 2× maior que inglês básico',
      'Aula experimental gratuita converte 35–45% dos participantes em matrículas pagas',
    ],
  },
  curso_concurso: {
    name: 'Curso Preparatório para Concursos',
    cpl_min: 20, cpl_max: 45,
    cpl_by_channel: { 'YouTube': 'R$22–48', 'Meta Ads': 'R$18–40', 'TikTok': 'R$12–30', 'Google Search': 'R$25–50' },
    cvr_lead_to_sale: 0.15, avg_ticket: 2400, ltv_multiplier: 1.8,
    best_channels: ['YouTube', 'Meta Ads', 'TikTok'],
    budget_floor: 1500, budget_ideal: 4000,
    kpi_thresholds: { cpl_good: 28, cpl_bad: 42, roas_good: 6.0, cvr_good: 0.18 },
    seasonality: ['Mar', 'Abr', 'Ago', 'Set'],
    insights: [
      'Abertura de edital de concurso é o principal gatilho — monitore editais e dispare campanhas imediato',
      'YouTube com aulas gratuitas de qualidade gera autoridade e leads orgânicos baratos',
      'PDF gratuito de questões anteriores como lead magnet tem alta conversão',
      'Candidato que tentou 2–3 vezes é o lead mais qualificado — aborde com estratégia específica',
    ],
  },
  crossfit_funcional: {
    name: 'CrossFit / Treino Funcional',
    cpl_min: 20, cpl_max: 50,
    cpl_by_channel: { 'Instagram Ads': 'R$18–42', 'TikTok': 'R$14–35', 'Meta Ads': 'R$20–45' },
    cvr_lead_to_sale: 0.28, avg_ticket: 2400, ltv_multiplier: 2.2,
    best_channels: ['Instagram Ads', 'TikTok', 'Meta Ads'],
    budget_floor: 1500, budget_ideal: 4000,
    kpi_thresholds: { cpl_good: 28, cpl_bad: 45, roas_good: 5.5, cvr_good: 0.30 },
    seasonality: ['Jan', 'Fev', 'Set', 'Out'],
    insights: [
      'Jan (resolução de ano novo) concentra 40% das matrículas anuais — não reduza budget em janeiro',
      'Aula experimental gratuita converte 35–50% dos visitantes em alunos regulares',
      'TikTok com treinos ao vivo e challenges tem CPL 30% menor que foto no Instagram',
      'Comunidade é o diferencial — conteúdo de bastidores e conquistas de alunos gera referral orgânico',
    ],
  },
  yoga_pilates: {
    name: 'Yoga / Pilates',
    cpl_min: 15, cpl_max: 40,
    cpl_by_channel: { 'Instagram Ads': 'R$13–35', 'TikTok': 'R$10–28', 'Meta Ads': 'R$15–38' },
    cvr_lead_to_sale: 0.25, avg_ticket: 2000, ltv_multiplier: 2.8,
    best_channels: ['Instagram Ads', 'TikTok', 'Meta Ads'],
    budget_floor: 1200, budget_ideal: 3000,
    kpi_thresholds: { cpl_good: 22, cpl_bad: 36, roas_good: 5.5, cvr_good: 0.28 },
    seasonality: ['Jan', 'Set', 'Out'],
    insights: [
      'Público feminino 25–45 anos responde muito bem a Reels de prática ao vivo',
      'Pilates clínico (com laudo médico) tem ticket 60% maior e CVR mais alto que pilates fitness',
      'Pacote de aulas online abre mercado nacional — escala sem aumentar estrutura física',
      'Depoimento de melhora de postura/dor lombar tem CTR alto e especificidade que converte',
    ],
  },
  coaching_carreira: {
    name: 'Coaching de Carreira / Executivo',
    cpl_min: 55, cpl_max: 150,
    cpl_by_channel: { 'LinkedIn': 'R$80–180', 'Meta Ads': 'R$55–130', 'Instagram Ads': 'R$50–120', 'Google Search': 'R$70–155' },
    cvr_lead_to_sale: 0.10, avg_ticket: 8000, ltv_multiplier: 1.8,
    best_channels: ['LinkedIn', 'Meta Ads', 'Instagram Ads'],
    budget_floor: 3000, budget_ideal: 8000,
    kpi_thresholds: { cpl_good: 80, cpl_bad: 140, roas_good: 4.0, cvr_good: 0.12 },
    seasonality: ['Jan', 'Jul', 'Ago'],
    insights: [
      'Jan e Jul: picos de transição de carreira — gatilho natural de reflexão profissional',
      'LinkedIn é o canal de mais alta qualificação — CPL maior, mas CVR 2× maior que Meta',
      'Webinar gratuito de transformação de carreira é a isca de maior conversão para high-ticket',
      'Ciclo de decisão de 30–60 dias — sequência de e-mail educativo é essencial',
    ],
  },
  desenvolvimento_software: {
    name: 'Desenvolvimento de Software / Apps',
    cpl_min: 80, cpl_max: 200,
    cpl_by_channel: { 'Google Search': 'R$85–180', 'LinkedIn': 'R$120–250', 'Meta Ads': 'R$80–160' },
    cvr_lead_to_sale: 0.08, avg_ticket: 45000, ltv_multiplier: 3.0,
    best_channels: ['Google Search', 'LinkedIn', 'Meta Ads'],
    budget_floor: 5000, budget_ideal: 15000,
    kpi_thresholds: { cpl_good: 110, cpl_bad: 180, roas_good: 4.0, cvr_good: 0.10 },
    seasonality: ['Mar', 'Set', 'Out'],
    insights: [
      'Ciclo de venda de 30–90 dias — remarketing com cases e portfólio é fundamental',
      'LinkedIn é obrigatório para CTOs, CPOs e fundadores de startups — tomadores de decisão B2B',
      'Case de sucesso com ROI documentado converte 3× mais que portfólio genérico',
      'Budget planning corporativo em Mar (Q2) e Set (Q4) → ative campanhas nesses períodos',
    ],
  },
  saas_b2b: {
    name: 'SaaS B2B',
    cpl_min: 90, cpl_max: 250,
    cpl_by_channel: { 'Google Search': 'R$95–220', 'LinkedIn': 'R$130–280', 'Meta Ads': 'R$90–200', 'YouTube': 'R$100–230' },
    cvr_lead_to_sale: 0.06, avg_ticket: 24000, ltv_multiplier: 4.5,
    best_channels: ['Google Search', 'LinkedIn', 'Meta Ads'],
    budget_floor: 6000, budget_ideal: 18000,
    kpi_thresholds: { cpl_good: 130, cpl_bad: 220, roas_good: 3.5, cvr_good: 0.08 },
    seasonality: ['Jan', 'Set'],
    insights: [
      'Trial gratuito de 14–30 dias é o modelo de mais alta conversão para SaaS B2B no Brasil',
      'LTV é o KPI principal — churn de 2–5% ao mês inviabiliza o modelo, monitore de perto',
      'Jan (planejamento de ferramentas) e Set (prep Q4) são os maiores momentos de decisão',
      'LinkedIn para awareness + Google Search para capturar intenção = combo de menor CPA',
    ],
  },
  marketing_digital_cursos: {
    name: 'Cursos de Marketing Digital',
    cpl_min: 15, cpl_max: 45,
    cpl_by_channel: { 'Meta Ads': 'R$13–38', 'Instagram Ads': 'R$12–35', 'YouTube': 'R$18–48', 'TikTok': 'R$10–28' },
    cvr_lead_to_sale: 0.20, avg_ticket: 1800, ltv_multiplier: 1.5,
    best_channels: ['Meta Ads', 'YouTube', 'TikTok'],
    budget_floor: 2000, budget_ideal: 6000,
    kpi_thresholds: { cpl_good: 22, cpl_bad: 40, roas_good: 6.0, cvr_good: 0.22 },
    seasonality: ['Jan', 'Jul', 'Ago'],
    insights: [
      'Menor CPL do mercado, mas alta saturação — diferencial criativo é crítico para se destacar',
      'Lançamentos: CPL baixo nos primeiros dias, sobe rápido — monitore diariamente e ajuste',
      'YouTube Ads com aula gratuita prévia tem ticket médio 40% maior que Meta Ads direto',
      'FOMO e urgência de vagas funcionam mas desgastam a marca — use com moderação estratégica',
    ],
  },
  consorcio: {
    name: 'Consórcio',
    cpl_min: 50, cpl_max: 130,
    cpl_by_channel: { 'Meta Ads': 'R$48–115', 'Google Search': 'R$60–130', 'Instagram Ads': 'R$45–105', 'YouTube': 'R$65–140' },
    cvr_lead_to_sale: 0.08, avg_ticket: 55000, ltv_multiplier: 1.3,
    best_channels: ['Meta Ads', 'Google Search', 'Instagram Ads'],
    budget_floor: 4000, budget_ideal: 10000,
    kpi_thresholds: { cpl_good: 70, cpl_bad: 120, roas_good: 4.5, cvr_good: 0.10 },
    seasonality: ['Jan', 'Nov'],
    insights: [
      'Jan (planejamento financeiro) e Nov (IPVA, IPTU — reorganização de finanças) são picos',
      'Simulador de parcela vs financiamento é o criativo de maior CVR no segmento',
      'Consórcio de imóvel tem ticket 4× maior que consórcio de auto — segmente criativos separado',
      'Lead de cota contemplada (carta de crédito) tem conversão 3× maior — produto distinto',
    ],
  },
  cambio_remessas: {
    name: 'Câmbio / Remessas Internacionais',
    cpl_min: 35, cpl_max: 90,
    cpl_by_channel: { 'Google Search': 'R$40–85', 'Meta Ads': 'R$35–80', 'Instagram Ads': 'R$30–70' },
    cvr_lead_to_sale: 0.12, avg_ticket: 8000, ltv_multiplier: 5.0,
    best_channels: ['Google Search', 'Meta Ads', 'Instagram Ads'],
    budget_floor: 3000, budget_ideal: 8000,
    kpi_thresholds: { cpl_good: 50, cpl_bad: 80, roas_good: 4.5, cvr_good: 0.15 },
    seasonality: ['Dez', 'Jan', 'Jun', 'Jul'],
    insights: [
      'Dez e Jan: remessas de férias e presentes para família no exterior — pico de volume',
      'Jun–Jul: pagamentos de universidades e intercâmbios no hemisfério norte',
      'Google Search com intenção ("câmbio hoje", "enviar dinheiro para") tem CVR 3× maior que Meta',
      'Comparativo de spread e tarifa vs bancos tradicionais é o argumento mais efetivo',
    ],
  },
  previdencia_privada: {
    name: 'Previdência Privada',
    cpl_min: 60, cpl_max: 150,
    cpl_by_channel: { 'Google Search': 'R$65–140', 'Meta Ads': 'R$60–130', 'LinkedIn': 'R$90–180', 'YouTube': 'R$80–155' },
    cvr_lead_to_sale: 0.08, avg_ticket: 30000, ltv_multiplier: 3.5,
    best_channels: ['Google Search', 'Meta Ads', 'LinkedIn'],
    budget_floor: 4000, budget_ideal: 10000,
    kpi_thresholds: { cpl_good: 80, cpl_bad: 140, roas_good: 4.0, cvr_good: 0.10 },
    seasonality: ['Mar', 'Abr', 'Out', 'Nov'],
    insights: [
      'Mar–Abr: temporada de IRPF → PGBL reduz imposto — argumento de alta conversão',
      'Out–Nov: planejamento financeiro de fim de ano — decisão de iniciar previdência',
      'Comparativo PGBL vs VGBL em linguagem simples tem alto engajamento',
      'Calculadora de quanto acumularia em X anos é a isca digital de mais alta conversão',
    ],
  },
  ar_condicionado: {
    name: 'Ar-Condicionado / Climatização',
    cpl_min: 35, cpl_max: 80,
    cpl_by_channel: { 'Google Search': 'R$38–75', 'Meta Ads': 'R$35–70', 'Instagram Ads': 'R$30–65' },
    cvr_lead_to_sale: 0.20, avg_ticket: 3500, ltv_multiplier: 2.5,
    best_channels: ['Google Search', 'Meta Ads', 'Instagram Ads'],
    budget_floor: 2000, budget_ideal: 5000,
    kpi_thresholds: { cpl_good: 48, cpl_bad: 72, roas_good: 5.0, cvr_good: 0.22 },
    seasonality: ['Out', 'Nov', 'Jan', 'Fev'],
    insights: [
      'Out–Nov: pré-verão — cliente antecipa compra antes do pico de demanda e preços subirem',
      'Jan–Fev: onda de calor gera compra emergencial — lead quer instalação em 24–48h',
      'Google Search com modelo + "instalação" é o intent mais quente do segmento',
      'Manutenção e higienização periódica geram recorrência — upsell pós-venda de alto LTV',
    ],
  },
  dedetizacao: {
    name: 'Dedetização / Controle de Pragas',
    cpl_min: 25, cpl_max: 60,
    cpl_by_channel: { 'Google Search': 'R$28–55', 'Meta Ads': 'R$25–50', 'Instagram Ads': 'R$20–45' },
    cvr_lead_to_sale: 0.22, avg_ticket: 650, ltv_multiplier: 3.0,
    best_channels: ['Google Search', 'Meta Ads'],
    budget_floor: 1500, budget_ideal: 4000,
    kpi_thresholds: { cpl_good: 32, cpl_bad: 55, roas_good: 5.5, cvr_good: 0.25 },
    seasonality: ['Set', 'Out', 'Nov', 'Jan'],
    insights: [
      'Primavera e verão (Set–Jan) são pico — calor e chuva aumentam proliferação de pragas',
      'Google Search com urgência ("cupim em casa", "dedetização urgente") tem CVR altíssimo',
      'Contrato anual para condomínios/restaurantes tem LTV 5× maior — segmento B2B prioritário',
      'Certificado ANVISA como argumento de autoridade — inclua no criativo e landing page',
    ],
  },
  mudancas_transporte: {
    name: 'Mudanças / Transporte de Cargas',
    cpl_min: 30, cpl_max: 75,
    cpl_by_channel: { 'Google Search': 'R$32–70', 'Meta Ads': 'R$30–65' },
    cvr_lead_to_sale: 0.25, avg_ticket: 2800, ltv_multiplier: 1.5,
    best_channels: ['Google Search', 'Meta Ads'],
    budget_floor: 2000, budget_ideal: 5000,
    kpi_thresholds: { cpl_good: 40, cpl_bad: 68, roas_good: 5.0, cvr_good: 0.28 },
    seasonality: ['Dez', 'Jan', 'Fev', 'Mar'],
    insights: [
      'Dez–Mar concentra mudanças: fim de contrato de aluguel, início do ano letivo, férias',
      'Google Search com cidade de origem + destino tem intenção alta: "mudança SP para RJ"',
      'Orçamento online em 2 minutos é o diferencial mais citado por clientes que convertem',
      'Seguro de carga como upsell aumenta ticket médio em R$400–800 e protege a empresa',
    ],
  },
  micropigmentacao: {
    name: 'Micropigmentação / Sobrancelha',
    cpl_min: 25, cpl_max: 70,
    cpl_by_channel: { 'Instagram Ads': 'R$22–58', 'TikTok': 'R$15–40', 'Meta Ads': 'R$25–62' },
    cvr_lead_to_sale: 0.22, avg_ticket: 900, ltv_multiplier: 2.8,
    best_channels: ['Instagram Ads', 'TikTok', 'Meta Ads'],
    budget_floor: 1500, budget_ideal: 4000,
    kpi_thresholds: { cpl_good: 35, cpl_bad: 62, roas_good: 5.5, cvr_good: 0.25 },
    seasonality: ['Set', 'Out', 'Nov', 'Fev'],
    insights: [
      'Pré-verão (Set–Nov) e pós-Carnaval (Fev) são os picos de demanda',
      'TikTok com procedimento ao vivo tem CPL 35% menor — cliente chega sabendo o que quer',
      'Antes/depois de sobrancelha tem o mais alto CTR do segmento de beleza no Instagram',
      'Manutenção anual é recorrência garantida — cliente de micropig retorna todo ano',
    ],
  },
  tatuagem_piercing: {
    name: 'Estúdio de Tatuagem / Piercing',
    cpl_min: 15, cpl_max: 50,
    cpl_by_channel: { 'Instagram Ads': 'R$12–42', 'TikTok': 'R$10–35', 'Meta Ads': 'R$15–45' },
    cvr_lead_to_sale: 0.30, avg_ticket: 550, ltv_multiplier: 2.5,
    best_channels: ['Instagram Ads', 'TikTok', 'Meta Ads'],
    budget_floor: 1000, budget_ideal: 3000,
    kpi_thresholds: { cpl_good: 22, cpl_bad: 44, roas_good: 6.0, cvr_good: 0.32 },
    seasonality: ['Nov', 'Dez', 'Jan'],
    insights: [
      'Verão (Nov–Jan): cliente quer mostrar a tattoo na praia e nos eventos de fim de ano',
      'Instagram é o portfólio do tatuador — qualidade das fotos determina o nível do cliente',
      'Flash tattoo com preço fixo tem CVR altíssimo: remove a objeção de precificação',
      'TikTok com timelapse do processo é organicamente viral — invista em conteúdo orgânico',
    ],
  },
  estetica_corporal: {
    name: 'Estética Corporal',
    cpl_min: 30, cpl_max: 80,
    cpl_by_channel: { 'Instagram Ads': 'R$28–68', 'TikTok': 'R$20–50', 'Meta Ads': 'R$30–72' },
    cvr_lead_to_sale: 0.22, avg_ticket: 2800, ltv_multiplier: 2.8,
    best_channels: ['Instagram Ads', 'TikTok', 'Meta Ads'],
    budget_floor: 2000, budget_ideal: 5000,
    kpi_thresholds: { cpl_good: 42, cpl_bad: 72, roas_good: 5.0, cvr_good: 0.25 },
    seasonality: ['Set', 'Out', 'Nov', 'Jan'],
    insights: [
      'Pré-verão (Set–Nov) concentra 55% das matrículas anuais em pacotes corporais',
      'Ultracavitação, criolipólise e drenagem linfática são os procedimentos de maior demanda',
      'Pacote de X sessões tem ticket alto e CVR maior do que sessão avulsa — precifique assim',
      'TikTok com "transformação de 30 dias" tem engajamento viral no segmento corporal',
    ],
  },
  delivery_food: {
    name: 'Delivery de Comida / Restaurante',
    cpl_min: 8, cpl_max: 25,
    cpl_by_channel: { 'Meta Ads': 'R$8–22', 'Instagram Ads': 'R$7–20', 'TikTok': 'R$6–18' },
    cvr_lead_to_sale: 0.35, avg_ticket: 70, ltv_multiplier: 6.5,
    best_channels: ['Meta Ads', 'Instagram Ads', 'TikTok'],
    budget_floor: 1500, budget_ideal: 4000,
    kpi_thresholds: { cpl_good: 12, cpl_bad: 22, roas_good: 8.0, cvr_good: 0.40 },
    seasonality: ['Jun', 'Jul', 'Nov', 'Dez'],
    insights: [
      'Jun–Jul: Festa Junina e frio aumentam pedidos de delivery — pico de volume',
      'Nov–Dez: festas e confraternizações elevam ticket médio com combos e kits',
      '"Abrir agora" com imagem do prato quente tem CTR 2× maior que foto genérica',
      'LTV é o KPI crítico — cliente fidelizado faz 8–12 pedidos por mês',
    ],
  },
  catering_buffet: {
    name: 'Catering / Buffet',
    cpl_min: 35, cpl_max: 90,
    cpl_by_channel: { 'Instagram Ads': 'R$32–80', 'Meta Ads': 'R$35–85', 'Google Search': 'R$45–95' },
    cvr_lead_to_sale: 0.18, avg_ticket: 15000, ltv_multiplier: 1.8,
    best_channels: ['Instagram Ads', 'Meta Ads', 'Google Search'],
    budget_floor: 2500, budget_ideal: 6000,
    kpi_thresholds: { cpl_good: 50, cpl_bad: 82, roas_good: 5.0, cvr_good: 0.20 },
    seasonality: ['Out', 'Nov', 'Dez', 'Mai'],
    insights: [
      'Out–Dez: confraternizações corporativas, casamentos e formaturas — alta temporada absoluta',
      'Mai–Jun: formaturas universitárias e casamentos de inverno — segundo pico do ano',
      'Instagram com vídeo de montagem de mesa e cardápio tem altíssimo engajamento',
      'Google Search com "buffet para evento corporativo" tem maior CVR — intenção clara',
    ],
  },
  producao_audiovisual: {
    name: 'Produção Audiovisual / Vídeo',
    cpl_min: 60, cpl_max: 150,
    cpl_by_channel: { 'Instagram Ads': 'R$55–130', 'LinkedIn': 'R$90–170', 'Meta Ads': 'R$60–140' },
    cvr_lead_to_sale: 0.12, avg_ticket: 12000, ltv_multiplier: 2.5,
    best_channels: ['Instagram Ads', 'LinkedIn', 'Meta Ads'],
    budget_floor: 3000, budget_ideal: 8000,
    kpi_thresholds: { cpl_good: 80, cpl_bad: 138, roas_good: 4.5, cvr_good: 0.15 },
    seasonality: ['Out', 'Nov', 'Mar'],
    insights: [
      'Out–Nov: marcas planejam conteúdo para o Natal e fim de ano — pico de demanda',
      'Mar: inicio de ano corporativo com budget liberado — campanhas e institucional entram em pauta',
      'Portfolio em vídeo (não foto estática) é o diferencial — use o produto para se vender',
      'LinkedIn é essencial para B2B: CMOs e diretores de marketing tomam a decisão de compra',
    ],
  },
  desenvolvimento_pessoal: {
    name: 'Desenvolvimento Pessoal',
    cpl_min: 25, cpl_max: 65,
    cpl_by_channel: { 'Instagram Ads': 'R$22–55', 'YouTube': 'R$30–70', 'TikTok': 'R$18–45', 'Meta Ads': 'R$25–60' },
    cvr_lead_to_sale: 0.15, avg_ticket: 3200, ltv_multiplier: 2.0,
    best_channels: ['Instagram Ads', 'YouTube', 'TikTok'],
    budget_floor: 2000, budget_ideal: 5000,
    kpi_thresholds: { cpl_good: 35, cpl_bad: 58, roas_good: 5.5, cvr_good: 0.18 },
    seasonality: ['Jan', 'Jul'],
    insights: [
      'Jan concentra a maior demanda do ano — resolução de ano novo é o gatilho principal',
      'Jul: férias de inverno criam espaço mental para investimento em desenvolvimento pessoal',
      'Webinar ou workshop gratuito de transformação pessoal é a isca de mais alta conversão',
      'Depoimento emocional e específico supera qualquer argumento racional — trabalhe histórias reais',
    ],
  },
  ecommerce_cosmeticos: {
    name: 'E-commerce de Cosméticos',
    cpl_min: 12, cpl_max: 35,
    cpl_by_channel: { 'Instagram Ads': 'R$10–28', 'TikTok': 'R$8–22', 'Meta Ads': 'R$11–30', 'Google Shopping': 'R$14–38' },
    cvr_lead_to_sale: 0.035, avg_ticket: 180, ltv_multiplier: 5.0,
    best_channels: ['Instagram Ads', 'TikTok', 'Meta Ads'],
    budget_floor: 3000, budget_ideal: 8000,
    kpi_thresholds: { cpl_good: 18, cpl_bad: 32, roas_good: 6.0, cvr_good: 0.04 },
    seasonality: ['Mai', 'Dez', 'Fev'],
    insights: [
      'Dia das Mães (Mai) e Natal (Dez) são os dois maiores picos — antecipe estoque e budget',
      'TikTok Shop emergiu como canal de alto ROAS: "TikTok made me buy it" é fenômeno real',
      'Routine de skincare em vídeo curto tem engajamento orgânico alto como topo de funil',
      'Frete grátis acima de ticket mínimo é a alavanca de maior impacto em cosméticos online',
    ],
  },
  ecommerce_moda: {
    name: 'E-commerce de Moda',
    cpl_min: 10, cpl_max: 30,
    cpl_by_channel: { 'Instagram Ads': 'R$9–26', 'TikTok': 'R$7–20', 'Meta Ads': 'R$10–28', 'Google Shopping': 'R$12–32' },
    cvr_lead_to_sale: 0.025, avg_ticket: 220, ltv_multiplier: 3.5,
    best_channels: ['Instagram Ads', 'TikTok', 'Google Shopping'],
    budget_floor: 4000, budget_ideal: 12000,
    kpi_thresholds: { cpl_good: 16, cpl_bad: 28, roas_good: 5.5, cvr_good: 0.03 },
    seasonality: ['Nov', 'Dez', 'Abr', 'Mai'],
    insights: [
      'Black Friday (Nov) e Natal (Dez) concentram 40% do faturamento anual de moda online',
      'Abr–Mai: virada de estação outono/inverno — nova coleção é o gatilho de compra',
      'Reels com look do dia e styling tips têm engajamento 4× maior que foto de produto plano',
      'Retargeting de carrinho abandonado com desconto de 10% recupera 15–25% das vendas perdidas',
    ],
  },

  outro: {
    name: 'Outro / Geral',
    cpl_min: 30, cpl_max: 120,
    cpl_by_channel: {
      'Meta Ads': 'R$30–90',
      'Google Search': 'R$40–110',
      'Instagram': 'R$25–80',
    },
    cvr_lead_to_sale: 0.10,
    avg_ticket: 1000,
    ltv_multiplier: 3.0,
    best_channels: ['Meta Ads', 'Google Search', 'Instagram'],
    budget_floor: 1500,
    budget_ideal: 5000,
    kpi_thresholds: { cpl_good: 60, cpl_bad: 110, roas_good: 4.0, cvr_good: 0.12 },
    seasonality: ['Jan', 'Nov'],
    insights: [
      'Teste A/B nos primeiros 30 dias para identificar o canal mais eficiente',
      'CPL alvo = ticket médio × CVR — garanta que a conta fecha',
      'Foco em 2 canais no início: volume suficiente para otimização',
    ],
  },
}

// ── Keyword map para matching ─────────────────────────────────────────────────

const KEY_MAP: Record<string, string> = {
  // ── Frases compostas (mais longas primeiro — evitam falsos positivos) ──────
  'estética automotiva':  'lava_jato',
  'estetica automotiva':  'lava_jato',
  'hotel para pet':       'pet',
  'lava jato':            'lava_jato',
  'lavajato':             'lava_jato',
  'auto detailing':       'lava_jato',
  'detailing':            'lava_jato',
  'higienização interna': 'lava_jato',
  'higienizacao interna': 'lava_jato',
  'aulas particulares':   'educacao',
  'aula particular':      'educacao',
  'home care':            'saude',
  'terapias alternativas':'psicologia',
  'pintura residencial':  'construcao',
  'pintura predial':      'construcao',
  'funilaria':            'automotivo',
  'despachante':          'outro',
  'despacho':             'outro',
  'móveis planejados':    'moveis_planejados',
  'moveis planejados':    'moveis_planejados',
  'loja de móveis':       'loja_moveis',
  'loja de moveis':       'loja_moveis',
  'loja moveis':          'loja_moveis',
  'loja de decoração':    'loja_moveis',
  'home decor':           'loja_moveis',

  // ── Financeiro ────────────────────────────────────────────────────────────
  financeiro: 'financeiro', crédito: 'financeiro', credito: 'financeiro',
  investimento: 'financeiro', banco: 'financeiro', empréstimo: 'financeiro', emprestimo: 'financeiro',

  // ── Automotivo ────────────────────────────────────────────────────────────
  automotivo: 'automotivo', oficina: 'automotivo', concessionária: 'automotivo', concessionaria: 'automotivo',
  mecânica: 'automotivo', mecanica: 'automotivo', carro: 'automotivo', veículo: 'automotivo', veiculo: 'automotivo',
  borracharia: 'automotivo', borracheiro: 'automotivo', guincho: 'automotivo',
  autopeças: 'automotivo', autopecas: 'automotivo', insulfilm: 'automotivo', blindagem: 'automotivo',

  // ── Lava Jato ─────────────────────────────────────────────────────────────
  polimento: 'lava_jato', ceramica: 'lava_jato', enceramento: 'lava_jato',

  // ── Barbearia ─────────────────────────────────────────────────────────────
  barbearia: 'barbearia', barbeiro: 'barbearia', barber: 'barbearia',

  // ── Beleza (complementares) ───────────────────────────────────────────────
  cabeleireiro: 'beleza', cabeleireira: 'beleza',
  sobrancelha: 'micropigmentacao', micropigmentação: 'micropigmentacao', micropigmentacao: 'micropigmentacao',

  // ── Fisioterapia ──────────────────────────────────────────────────────────
  fisioterapia: 'fisioterapia', fisioterapeuta: 'fisioterapia', reabilitação: 'clinica_reabilitacao', reabilitacao: 'clinica_reabilitacao',

  // ── Farmácia ──────────────────────────────────────────────────────────────
  farmácia: 'farmacia', farmacia: 'farmacia', drogaria: 'farmacia', droga: 'farmacia',

  // ── Serviços Residenciais ─────────────────────────────────────────────────
  'serviços residenciais': 'servicos_residenciais', 'servicos residenciais': 'servicos_residenciais',
  limpeza: 'servicos_residenciais', jardinagem: 'servicos_residenciais', dedetização: 'dedetizacao',
  dedetizacao: 'dedetizacao', diarista: 'servicos_residenciais', faxina: 'servicos_residenciais',
  eletricista: 'servicos_residenciais', elétrica: 'servicos_residenciais', eletrica: 'servicos_residenciais',
  encanador: 'servicos_residenciais', encanamento: 'servicos_residenciais', hidráulica: 'servicos_residenciais', hidraulica: 'servicos_residenciais',
  serralheria: 'servicos_residenciais', serralheiro: 'servicos_residenciais',
  vidraçaria: 'servicos_residenciais', vidracaria: 'servicos_residenciais',

  // ── Arquitetura / Design ──────────────────────────────────────────────────
  'design de interiores': 'arquitetura_design', 'interiores': 'arquitetura_design',
  arquiteto: 'arquitetura_design', arquitetura: 'arquitetura_design', designer: 'arquitetura_design',

  // ── Franquias ─────────────────────────────────────────────────────────────
  franquia: 'franquias', franquias: 'franquias', franqueado: 'franquias', franqueadora: 'franquias',

  // ── Fotografia / Vídeo ────────────────────────────────────────────────────
  fotografia: 'fotografia_video', fotografo: 'fotografia_video', fotógrafo: 'fotografia_video',
  videomaker: 'fotografia_video', produção: 'fotografia_video', producao: 'fotografia_video',
  filmagem: 'fotografia_video',

  // ── Segurança Privada ─────────────────────────────────────────────────────
  'segurança': 'seguranca_privada', seguranca: 'seguranca_privada', monitoramento: 'seguranca_privada',
  vigilância: 'seguranca_privada', vigilancia: 'seguranca_privada', câmera: 'seguranca_privada', camera: 'seguranca_privada',

  // ── Padaria / Cafeteria ───────────────────────────────────────────────────
  padaria: 'padaria_cafeteria', cafeteria: 'padaria_cafeteria', confeitaria: 'padaria_cafeteria',
  café: 'padaria_cafeteria', cafe: 'padaria_cafeteria', pãodaçúcar: 'padaria_cafeteria', doces: 'padaria_cafeteria',

  // ── Depilação ─────────────────────────────────────────────────────────────
  'depilação': 'depilacao', depilacao: 'depilacao', 'depilação a laser': 'depilacao', laser: 'depilacao',

  // ── Harmonização ──────────────────────────────────────────────────────────
  'harmonização': 'harmonizacao', harmonizacao: 'harmonizacao',
  botox: 'harmonizacao', preenchimento: 'harmonizacao', lipo: 'harmonizacao',

  // ── Autoescola ────────────────────────────────────────────────────────────
  autoescola: 'autoescola', 'auto escola': 'autoescola', cnh: 'autoescola', habilitação: 'autoescola', habilitacao: 'autoescola',

  // ── Lavanderia ────────────────────────────────────────────────────────────
  lavanderia: 'lavanderia', lavagem: 'lavanderia', laundry: 'lavanderia',

  // ── Saúde ─────────────────────────────────────────────────────────────────
  'saúde': 'saude', saude: 'saude', clínica: 'saude', clinica: 'saude', hospital: 'saude', médico: 'saude', medico: 'saude',
  laboratório: 'saude', laboratorio: 'saude', exames: 'saude', diagnóstico: 'saude', diagnostico: 'saude',

  // ── Odontologia ───────────────────────────────────────────────────────────
  odontolog: 'odontologia', dentista: 'odontologia', clareamento: 'odontologia',
  implante: 'odontologia', ortodont: 'odontologia',

  // ── Educação ──────────────────────────────────────────────────────────────
  'educaç': 'educacao', educac: 'educacao', curso: 'educacao',
  escola: 'educacao', faculdade: 'educacao', ensino: 'educacao', treinamento: 'educacao',
  aula: 'educacao', professor: 'educacao', reforço: 'educacao', reforco: 'educacao',

  // ── Imobiliário ───────────────────────────────────────────────────────────
  'imóvel': 'imobiliario', imovel: 'imobiliario', imobili: 'imobiliario',
  construtora: 'construcao', corretor: 'corretor_imobiliario',

  // ── Jurídico ──────────────────────────────────────────────────────────────
  'jurídico': 'juridico', juridico: 'juridico', advocacia: 'juridico',
  advogado: 'juridico', direito: 'juridico', oab: 'juridico',

  // ── Contabilidade ─────────────────────────────────────────────────────────
  contabilidade: 'contabilidade', contabil: 'contabilidade',
  fiscal: 'contabilidade', contador: 'contabilidade',

  // ── Beleza ────────────────────────────────────────────────────────────────
  beleza: 'beleza', 'estética': 'beleza', estetica: 'beleza',
  'salão': 'beleza', salao: 'beleza', spa: 'beleza', manicure: 'beleza', pedicure: 'beleza',

  // ── Fitness ───────────────────────────────────────────────────────────────
  academia: 'fitness', fitness: 'fitness', personal: 'fitness', pilates: 'yoga_pilates',
  crossfit: 'crossfit_funcional', musculação: 'fitness', musculacao: 'fitness',

  // ── Tecnologia ────────────────────────────────────────────────────────────
  tech: 'tecnologia', tecnologia: 'tecnologia', software: 'tecnologia',
  saas: 'saas_b2b', startup: 'tecnologia', sistema: 'tecnologia',

  // ── Pet ───────────────────────────────────────────────────────────────────
  pet: 'pet', 'veterinário': 'clinica_veterinaria', veterinario: 'clinica_veterinaria', petshop: 'pet',
  adestramento: 'pet', adestrador: 'pet', veterinária: 'clinica_veterinaria', veterinaria: 'clinica_veterinaria',

  // ── Turismo ───────────────────────────────────────────────────────────────
  turismo: 'turismo', viagem: 'turismo', hotel: 'turismo', pousada: 'turismo', pacote: 'turismo',

  // ── Restaurante ───────────────────────────────────────────────────────────
  restaurante: 'restaurante', food: 'restaurante', comida: 'restaurante',
  lanchonete: 'restaurante', pizzaria: 'delivery_food', hamburger: 'restaurante', hamburguer: 'restaurante',
  marmita: 'restaurante', marmitaria: 'restaurante', delivery: 'delivery_food', refeição: 'restaurante', refeicao: 'restaurante',

  // ── Consultoria ───────────────────────────────────────────────────────────
  consultoria: 'consultoria', coach: 'coaching_carreira', mentor: 'consultoria',

  // ── Marketing ─────────────────────────────────────────────────────────────
  marketing: 'marketing_agencia', 'agência': 'marketing_agencia', agencia: 'marketing_agencia', publicidade: 'marketing_agencia',

  // ── Construção ────────────────────────────────────────────────────────────
  'construção': 'construcao', construcao: 'construcao', reforma: 'construcao',
  engenharia: 'construcao',

  // ── Moda ──────────────────────────────────────────────────────────────────
  moda: 'moda', 'vestuário': 'moda', vestuario: 'moda', roupas: 'moda', roupa: 'moda',
  costureira: 'moda', alfaiataria: 'moda', costura: 'moda', calçados: 'moda', calcados: 'moda',

  // ── Psicologia ────────────────────────────────────────────────────────────
  'psicolog': 'psicologia', terapia: 'psicologia', terapeuta: 'psicologia',

  // ── Nutrição ──────────────────────────────────────────────────────────────
  'nutriç': 'nutricao', nutric: 'nutricao', nutricionista: 'nutricao', dieta: 'nutricao',

  // ── Eventos ───────────────────────────────────────────────────────────────
  eventos: 'eventos', evento: 'eventos', festa: 'eventos', casamento: 'eventos',
  formatura: 'eventos', show: 'eventos',
  buffet: 'catering_buffet', entretenimento: 'eventos', animação: 'eventos', animacao: 'eventos',

  // ── Móveis Planejados ─────────────────────────────────────────────────────
  marcenaria: 'moveis_planejados', planejados: 'moveis_planejados', marceneiro: 'moveis_planejados',
  'móveis': 'loja_moveis', moveis: 'loja_moveis',  // genérico → loja_moveis

  // ── E-commerce genérico (lojas sem niche específico) ─────────────────────
  ecommerce: 'ecommerce', 'e-commerce': 'ecommerce', marketplace: 'ecommerce',
  varejo: 'ecommerce', produto: 'ecommerce',
  papelaria: 'ecommerce', gráfica: 'ecommerce', grafica: 'ecommerce', impressão: 'ecommerce', impressao: 'ecommerce',
  loja: 'ecommerce',   // fallback genérico para "loja" sem modificador específico

  // ── Auditoria / Compliance ────────────────────────────────────────────────
  auditoria: 'auditoria', auditor: 'auditoria', compliance: 'auditoria',
  'gestão de riscos': 'auditoria', 'gestao de riscos': 'auditoria',
  'controle interno': 'auditoria', 'controles internos': 'auditoria',
  sox: 'auditoria', 'due diligence': 'auditoria', 'due diligência': 'auditoria',
  'governança': 'auditoria', governanca: 'auditoria',
  lgpd: 'auditoria', iso: 'auditoria',

  // ── Palavras genéricas que precisam de fallback razoável ─────────────────────
  seguro:               'seguro_auto',      // "seguro" genérico → automotivo (mais comum)
  rh:                   'rh_empresa',

  // ── Energia Solar ─────────────────────────────────────────────────────────
  'energia solar':      'energia_solar', 'solar': 'energia_solar', 'painel solar': 'energia_solar',
  'fotovoltaico':       'energia_solar', 'placas solares': 'energia_solar',

  // ── Clínica Veterinária ───────────────────────────────────────────────────
  'clínica vet':        'clinica_veterinaria', 'pet shop': 'clinica_veterinaria',
  'hospital veterinário':'clinica_veterinaria',

  // ── Especialidades médicas ────────────────────────────────────────────────
  oftalmologia:         'oftalmologia', oftalmologista: 'oftalmologia',
  'cirurgia ocular':    'oftalmologia', 'lasik': 'oftalmologia', 'olhos': 'oftalmologia',
  dermatologia:         'dermatologia', dermatologista: 'dermatologia',
  'skin care': 'dermatologia', 'tratamento de pele': 'dermatologia',
  'cirurgia plástica':  'cirurgia_plastica', 'plastica': 'cirurgia_plastica',
  'rinoplastia': 'cirurgia_plastica', 'lipoaspiração': 'cirurgia_plastica', 'mamoplastia': 'cirurgia_plastica',
  ortopedia:            'ortopedia', ortopedista: 'ortopedia',
  'coluna': 'ortopedia', 'joelho': 'ortopedia', 'ombro': 'ortopedia',
  pediatria:            'pediatria', pediatra: 'pediatria',
  ginecologia:          'ginecologia', ginecologista: 'ginecologia',
  'obstetricia': 'ginecologia', 'pré-natal': 'ginecologia',
  cardiologia:          'cardiologia', cardiologista: 'cardiologia',
  'coração': 'cardiologia', 'hipertensão': 'cardiologia',
  psiquiatria:          'psiquiatria', psiquiatra: 'psiquiatria',
  'saúde mental': 'psiquiatria', 'ansiedade clínica': 'psiquiatria',
  fonoaudiologia:       'fonoaudiologia', fonoaudiólogo: 'fonoaudiologia',
  fono:                 'fonoaudiologia',
  'fisioterapia esportiva': 'clinica_reabilitacao',
  'clinica de reabilitacao':'clinica_reabilitacao',
  capilar:              'clinica_capilar', 'transplante capilar': 'clinica_capilar',
  calvície:             'clinica_capilar', 'queda de cabelo': 'clinica_capilar',

  // ── Educação ─────────────────────────────────────────────────────────────
  idiomas:              'escola_idiomas', inglês: 'escola_idiomas', 'escola de inglês': 'escola_idiomas',
  espanhol:             'escola_idiomas', 'curso de idiomas': 'escola_idiomas',
  concurso:             'curso_concurso', 'preparatorio': 'curso_concurso',
  'curso preparatório': 'curso_concurso', enem: 'curso_concurso',

  // ── Fitness ───────────────────────────────────────────────────────────────
  'treino funcional': 'crossfit_funcional',
  'box de crossfit':    'crossfit_funcional',
  yoga:                 'yoga_pilates',
  'studio de yoga':     'yoga_pilates', 'studio de pilates': 'yoga_pilates',

  // ── Coaching & Carreira ───────────────────────────────────────────────────
  coaching:             'coaching_carreira',
  mentoria:             'coaching_carreira', 'mentoring': 'coaching_carreira',
  'desenvolvimento pessoal': 'desenvolvimento_pessoal',
  'crescimento pessoal': 'desenvolvimento_pessoal',

  // ── Tech/SaaS ─────────────────────────────────────────────────────────────
  'desenvolvimento de software': 'desenvolvimento_software',
  'agencia de tecnologia': 'desenvolvimento_software', 'app mobile': 'desenvolvimento_software',
  'software b2b': 'saas_b2b', 'plataforma': 'saas_b2b',
  'marketing digital curso': 'marketing_digital_cursos',
  'curso de trafego': 'marketing_digital_cursos', 'gestor de trafego curso': 'marketing_digital_cursos',

  // ── Finanças ──────────────────────────────────────────────────────────────
  consorcio:            'consorcio', consórcio: 'consorcio',
  câmbio:               'cambio_remessas', cambio: 'cambio_remessas',
  remessa:              'cambio_remessas', 'envio de dinheiro': 'cambio_remessas',
  'previdência privada':'previdencia_privada', previdência: 'previdencia_privada',
  pgbl:                 'previdencia_privada', vgbl: 'previdencia_privada',

  // ── Serviços ──────────────────────────────────────────────────────────────
  'ar condicionado':    'ar_condicionado', 'ar-condicionado': 'ar_condicionado',
  'climatizacao': 'ar_condicionado', split: 'ar_condicionado',
  'controle de pragas': 'dedetizacao', 'cupim': 'dedetizacao',
  mudança:              'mudancas_transporte', mudancas: 'mudancas_transporte',
  'frete': 'mudancas_transporte', 'carreto': 'mudancas_transporte',

  // ── Beleza ───────────────────────────────────────────────────────────────
  'design de sobrancelha': 'micropigmentacao',
  tatuagem:             'tatuagem_piercing', tattoo: 'tatuagem_piercing',
  piercing:             'tatuagem_piercing', 'studio de tatuagem': 'tatuagem_piercing',
  'estetica corporal':  'estetica_corporal', 'estética corporal': 'estetica_corporal',
  criolipolise:         'estetica_corporal', 'ultracavitacao': 'estetica_corporal',

  // ── Gastronomia ───────────────────────────────────────────────────────────
  'restaurante delivery': 'delivery_food',
  hamburgueria:         'delivery_food',
  catering:             'catering_buffet',

  // ── Audiovisual ───────────────────────────────────────────────────────────
  'produção audiovisual':'producao_audiovisual', 'video maker': 'producao_audiovisual',
  'produtora': 'producao_audiovisual',

  // ── E-commerce segmentado ────────────────────────────────────────────────
  'loja de cosmeticos': 'ecommerce_cosmeticos', 'cosméticos online': 'ecommerce_cosmeticos',
  'skincare online':    'ecommerce_cosmeticos',
  'loja de roupas':     'ecommerce_moda', 'moda online': 'ecommerce_moda',
  'loja de moda':       'ecommerce_moda',

  // ── Seguros ───────────────────────────────────────────────────────────────
  'plano de saúde':     'corretor_saude',
  'plano de saude':     'corretor_saude',
  'plano saúde':        'corretor_saude',
  'plano saude':        'corretor_saude',
  'corretor de saúde':  'corretor_saude',
  'corretor de saude':  'corretor_saude',
  'operadora de saúde': 'corretor_saude',
  'operadora de saude': 'corretor_saude',
  'seguro saúde':       'corretor_saude',
  'seguro saude':       'corretor_saude',
  'seguro de vida':     'seguro_vida',
  'vida seguro':        'seguro_vida',
  'seguro automotivo':  'seguro_auto',
  'seguro de carro':    'seguro_auto',
  'seguro auto':        'seguro_auto',
  'seguro veicular':    'seguro_auto',
  'seguro residencial': 'seguro_residencial',
  'seguro imóvel':      'seguro_residencial',
  'seguro imovel':      'seguro_residencial',
  'seguro casa':        'seguro_residencial',
  'seguro patrimonial': 'protecao_patrimonial',
  'proteção patrimonial': 'protecao_patrimonial',
  'protecao patrimonial': 'protecao_patrimonial',
  'holding familiar':   'protecao_patrimonial',
  'planejamento patrimonial': 'protecao_patrimonial',
  'planejamento sucessorio': 'protecao_patrimonial',
  'planejamento sucessório': 'protecao_patrimonial',
  'offshore':           'protecao_patrimonial',

  // ── Corretor Imobiliário (específico, diferente de construtora) ───────────
  'corretor imobiliário': 'corretor_imobiliario',
  'corretor imobiliario': 'corretor_imobiliario',
  'agente imobiliário': 'corretor_imobiliario',
  'agente imobiliario': 'corretor_imobiliario',
  'venda de imóveis':   'corretor_imobiliario',
  'venda de imoveis':   'corretor_imobiliario',
  'compra e venda de imóveis': 'corretor_imobiliario',
  'compra e venda de imoveis': 'corretor_imobiliario',

  // ── RH / Recursos Humanos ─────────────────────────────────────────────────
  'recursos humanos':   'rh_empresa',
  'gestão de pessoas':  'rh_empresa',
  'gestao de pessoas':  'rh_empresa',
  'recrutamento e seleção': 'rh_empresa',
  'recrutamento e selecao': 'rh_empresa',
  'outsourcing de rh':  'rh_empresa',
  'bpo rh':             'rh_empresa',
  'departamento pessoal': 'rh_empresa',
  'folha de pagamento': 'rh_empresa',
  'treinamento corporativo': 'rh_empresa',
  'consultoria de rh':  'rh_empresa',

  // ── Outro ─────────────────────────────────────────────────────────────────
  outro: 'outro',
}

// ── Sazonalidade mensal por nicho ─────────────────────────────────────────────
// Índice 1.0 = CPL base · >1.0 = mês mais caro (alta demanda/concorrência)
// Ordem: [Jan, Fev, Mar, Abr, Mai, Jun, Jul, Ago, Set, Out, Nov, Dez]
const SEASONALITY_INDEXES: Record<string, number[]> = {
  financeiro:          [1.40, 1.00, 0.85, 0.80, 0.85, 0.90, 1.30, 0.95, 0.85, 0.90, 0.95, 1.00],
  saude:               [1.35, 1.05, 0.90, 0.80, 0.85, 0.80, 0.85, 0.90, 1.25, 1.05, 0.95, 1.00],
  odontologia:         [1.25, 1.10, 1.20, 0.85, 0.80, 0.75, 0.80, 0.85, 0.90, 1.00, 1.10, 1.35],
  educacao:            [1.45, 1.10, 0.85, 0.80, 0.85, 0.80, 0.85, 1.40, 0.90, 0.85, 0.85, 0.85],
  imobiliario:         [0.90, 0.95, 1.30, 1.10, 1.00, 0.85, 0.80, 0.90, 1.35, 1.15, 1.00, 0.90],
  ecommerce:           [1.00, 0.85, 0.80, 0.80, 0.90, 0.85, 0.85, 0.90, 0.95, 1.15, 1.50, 1.45],
  loja_moveis:         [1.30, 1.25, 0.90, 0.80, 0.85, 0.80, 0.85, 0.85, 0.90, 1.20, 1.30, 1.05],
  juridico:            [0.90, 0.95, 1.30, 1.10, 1.00, 0.85, 0.80, 0.90, 1.00, 1.25, 1.05, 0.90],
  contabilidade:       [1.35, 1.00, 1.40, 1.20, 0.85, 0.80, 0.80, 0.85, 0.85, 0.90, 0.90, 0.90],
  beleza:              [0.90, 0.90, 0.95, 1.00, 1.35, 1.00, 0.85, 0.85, 0.90, 1.00, 1.10, 1.30],
  fitness:             [1.50, 1.10, 0.85, 0.80, 0.85, 0.80, 0.85, 1.25, 1.30, 1.10, 1.00, 0.90],
  tecnologia:          [0.90, 0.90, 1.20, 1.00, 0.95, 0.85, 0.80, 0.85, 1.20, 1.05, 1.00, 0.90],
  pet:                 [0.95, 0.90, 0.90, 0.90, 1.00, 1.20, 0.90, 0.85, 0.90, 0.95, 1.00, 1.30],
  turismo:             [1.30, 1.20, 1.00, 0.85, 0.85, 1.25, 1.35, 0.90, 0.85, 0.90, 0.95, 1.00],
  restaurante:         [0.90, 0.90, 0.95, 0.95, 1.00, 1.20, 0.90, 0.85, 0.90, 0.95, 1.05, 1.30],
  consultoria:         [1.30, 0.95, 1.00, 0.90, 0.85, 0.80, 0.80, 0.90, 1.25, 1.05, 0.95, 0.85],
  marketing_agencia:   [1.35, 1.00, 0.95, 0.90, 0.85, 0.80, 0.80, 0.90, 1.20, 1.10, 1.00, 0.95],
  construcao:          [0.90, 0.95, 1.25, 1.10, 1.00, 0.85, 0.80, 0.85, 0.95, 1.25, 1.10, 0.85],
  moda:                [1.25, 0.95, 0.85, 0.80, 0.85, 0.80, 0.80, 0.90, 0.95, 1.10, 1.45, 1.30],
  psicologia:          [1.40, 1.10, 0.90, 0.85, 0.90, 0.85, 0.85, 1.25, 1.10, 0.95, 0.90, 0.95],
  nutricao:            [1.55, 1.15, 0.90, 0.85, 1.20, 0.90, 0.85, 0.90, 0.95, 0.95, 0.95, 0.90],
  eventos:             [0.85, 0.90, 0.95, 1.00, 1.00, 1.00, 0.90, 0.90, 0.95, 1.05, 1.30, 1.40],
  moveis_planejados:   [1.30, 1.25, 0.95, 0.80, 0.85, 0.80, 0.85, 1.15, 1.25, 1.00, 1.20, 0.90],
  automotivo:          [1.35, 1.05, 0.90, 0.85, 0.85, 0.85, 1.25, 0.90, 0.85, 0.90, 0.95, 0.95],
  barbearia:           [0.95, 0.95, 0.90, 0.90, 0.95, 1.15, 0.90, 0.85, 0.90, 0.95, 1.00, 1.30],
  fisioterapia:        [1.30, 1.05, 0.90, 0.85, 0.85, 0.85, 0.85, 1.20, 1.10, 0.95, 0.90, 0.95],
  farmacia:            [1.25, 1.05, 0.90, 0.85, 0.85, 1.30, 1.20, 1.00, 0.90, 0.90, 0.95, 1.00],
  servicos_residenciais:[1.25, 1.00, 0.90, 0.85, 0.90, 0.90, 0.85, 0.85, 0.90, 1.20, 1.10, 1.00],
  arquitetura_design:  [1.30, 1.20, 1.00, 0.85, 0.85, 0.80, 0.80, 0.85, 0.95, 1.25, 1.10, 0.90],
  franquias:           [1.40, 1.30, 0.95, 0.85, 0.85, 0.85, 1.25, 1.20, 0.90, 0.90, 0.85, 0.80],
  fotografia_video:    [0.85, 0.85, 0.90, 0.90, 0.95, 0.90, 0.85, 0.85, 0.90, 1.05, 1.35, 1.45],
  seguranca_privada:   [1.25, 0.95, 0.90, 0.85, 0.85, 0.85, 0.85, 0.90, 0.90, 1.25, 1.05, 0.90],
  padaria_cafeteria:   [0.95, 0.90, 0.90, 0.90, 0.95, 1.20, 0.95, 0.90, 0.90, 0.95, 1.00, 1.30],
  depilacao:           [0.85, 0.85, 0.85, 0.85, 0.90, 0.85, 0.80, 0.85, 0.95, 1.35, 1.50, 1.20],
  harmonizacao:        [0.90, 0.90, 1.20, 0.90, 0.85, 0.85, 0.85, 0.90, 0.95, 1.05, 1.30, 1.40],
  autoescola:          [1.40, 1.10, 0.90, 0.85, 0.85, 0.85, 1.25, 1.00, 0.85, 0.85, 0.90, 0.90],
  lavanderia:          [1.20, 1.00, 0.90, 0.90, 0.95, 1.25, 1.15, 0.95, 0.90, 0.90, 0.95, 1.00],
  lava_jato:           [1.20, 1.15, 1.10, 0.90, 0.80, 0.75, 0.75, 0.80, 0.90, 0.95, 1.10, 1.35],
  auditoria:           [1.35, 1.20, 1.40, 1.25, 0.85, 0.75, 0.70, 0.80, 0.90, 0.95, 1.05, 1.35],
  corretor_saude:      [1.45, 1.05, 1.30, 1.25, 0.85, 0.80, 0.80, 0.85, 0.90, 0.95, 0.95, 1.00],
  corretor_imobiliario:[0.90, 0.90, 1.30, 1.20, 1.00, 0.85, 0.80, 0.85, 1.30, 1.20, 1.00, 0.85],
  protecao_patrimonial:[1.30, 0.95, 1.25, 1.20, 0.85, 0.80, 0.80, 0.85, 0.90, 1.00, 0.95, 0.95],
  seguro_vida:         [1.30, 0.95, 1.20, 1.00, 0.85, 0.80, 0.80, 0.85, 1.15, 0.95, 0.90, 1.05],
  seguro_auto:         [1.30, 0.95, 1.20, 1.20, 0.90, 0.85, 0.85, 0.90, 0.90, 0.90, 0.95, 1.30],
  seguro_residencial:  [1.20, 0.95, 1.15, 0.95, 0.90, 0.85, 0.85, 0.90, 0.90, 1.10, 1.00, 0.95],
  rh_empresa:          [1.40, 1.30, 1.00, 0.85, 0.85, 0.80, 0.75, 1.25, 1.30, 1.00, 0.90, 0.80],
  energia_solar:       [1.30, 1.25, 0.90, 0.80, 0.80, 0.80, 0.85, 0.85, 0.90, 1.20, 1.35, 1.05],
  clinica_veterinaria: [0.90, 0.85, 0.85, 0.85, 0.90, 0.95, 1.35, 1.40, 0.95, 0.90, 0.95, 1.35],
  oftalmologia:        [1.30, 1.10, 0.90, 0.85, 0.85, 0.80, 1.30, 1.10, 0.90, 0.90, 0.95, 1.00],
  dermatologia:        [1.10, 0.90, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.95, 1.30, 1.45, 0.95],
  cirurgia_plastica:   [0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 1.25, 1.35, 1.50, 1.15],
  ortopedia:           [1.20, 1.05, 0.90, 0.85, 1.35, 1.40, 1.05, 0.85, 0.85, 0.90, 0.90, 0.95],
  pediatria:           [1.30, 1.05, 0.90, 0.85, 0.85, 0.85, 0.85, 1.35, 1.25, 0.90, 0.90, 0.95],
  ginecologia:         [1.25, 1.00, 0.90, 0.85, 0.85, 0.85, 1.15, 0.90, 0.85, 1.20, 0.95, 0.90],
  cardiologia:         [1.30, 1.05, 0.90, 1.25, 1.35, 1.05, 0.85, 0.85, 0.85, 0.90, 0.90, 0.90],
  psiquiatria:         [1.40, 1.10, 0.90, 0.85, 0.85, 0.85, 0.85, 0.85, 1.20, 1.35, 1.05, 0.90],
  fonoaudiologia:      [0.90, 1.30, 1.35, 1.00, 0.85, 0.85, 0.85, 1.25, 1.30, 0.95, 0.90, 0.85],
  clinica_reabilitacao:[1.30, 1.05, 0.90, 0.85, 0.90, 1.25, 1.35, 1.05, 0.85, 0.85, 0.90, 0.90],
  clinica_capilar:     [0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 1.30, 1.40, 1.45, 1.00],
  escola_idiomas:      [1.40, 1.25, 0.90, 0.85, 0.85, 0.85, 1.40, 1.25, 0.90, 0.85, 0.85, 0.85],
  curso_concurso:      [0.90, 0.90, 1.25, 1.35, 0.90, 0.85, 0.85, 1.30, 1.40, 1.05, 0.90, 0.85],
  crossfit_funcional:  [1.55, 1.10, 0.85, 0.80, 0.85, 0.80, 0.85, 0.85, 1.30, 1.35, 1.05, 0.90],
  yoga_pilates:        [1.50, 1.05, 0.85, 0.80, 0.85, 0.80, 0.85, 0.85, 1.25, 1.35, 1.10, 0.90],
  coaching_carreira:   [1.35, 1.10, 0.90, 0.85, 0.85, 0.85, 1.20, 1.30, 1.05, 0.90, 0.85, 0.85],
  desenvolvimento_software:[0.90, 0.90, 1.25, 1.10, 0.95, 0.90, 0.85, 0.85, 1.20, 1.15, 1.00, 0.90],
  saas_b2b:            [1.40, 1.10, 0.90, 0.85, 0.85, 0.85, 0.80, 0.80, 1.30, 1.20, 0.95, 0.90],
  marketing_digital_cursos:[1.40, 1.10, 0.90, 0.85, 0.85, 0.85, 1.35, 1.25, 1.00, 0.90, 0.90, 0.90],
  consorcio:           [1.35, 1.05, 0.90, 0.85, 0.85, 0.85, 0.85, 0.85, 0.90, 0.90, 1.30, 1.15],
  cambio_remessas:     [1.20, 1.05, 0.90, 0.85, 0.85, 1.25, 1.30, 0.90, 0.85, 0.85, 0.90, 1.35],
  previdencia_privada: [0.90, 0.90, 1.35, 1.40, 0.85, 0.80, 0.80, 0.80, 0.90, 1.25, 1.35, 1.05],
  ar_condicionado:     [1.30, 1.25, 0.90, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 1.15, 1.35, 1.00],
  dedetizacao:         [1.15, 1.05, 0.90, 0.85, 0.85, 0.85, 0.85, 0.85, 1.25, 1.30, 1.40, 1.00],
  mudancas_transporte: [1.20, 1.30, 1.25, 1.00, 0.85, 0.85, 0.85, 0.85, 0.85, 0.90, 0.90, 1.25],
  micropigmentacao:    [0.85, 1.20, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 1.25, 1.35, 1.50, 1.00],
  tatuagem_piercing:   [0.90, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.90, 1.30, 1.45],
  estetica_corporal:   [1.10, 0.90, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 1.25, 1.35, 1.50, 1.00],
  delivery_food:       [0.95, 0.90, 0.90, 0.90, 0.95, 1.25, 1.35, 0.95, 0.90, 0.90, 1.15, 1.40],
  catering_buffet:     [0.85, 0.85, 0.85, 0.90, 1.15, 1.20, 0.90, 0.85, 0.90, 1.10, 1.35, 1.50],
  producao_audiovisual:[0.85, 0.90, 1.25, 1.00, 0.90, 0.85, 0.85, 0.85, 0.90, 1.15, 1.35, 1.15],
  desenvolvimento_pessoal:[1.50, 1.10, 0.85, 0.80, 0.85, 0.80, 1.25, 1.10, 0.85, 0.85, 0.85, 0.90],
  ecommerce_cosmeticos:[0.90, 1.20, 0.90, 0.85, 1.45, 0.90, 0.85, 0.90, 0.90, 0.95, 1.10, 1.40],
  ecommerce_moda:      [0.90, 0.90, 0.90, 1.25, 1.35, 0.90, 0.85, 0.85, 0.90, 0.95, 1.40, 1.35],
  outro:               [1.05, 0.95, 0.95, 0.90, 0.90, 0.90, 0.95, 0.95, 1.00, 1.05, 1.05, 1.00],
}

// ── Ângulos criativos por nicho ───────────────────────────────────────────────
const CREATIVE_ANGLES_DATA: Record<string, CreativeAngles> = {
  financeiro: {
    saturated:     ['promessa de renda passiva rápida', 'aprovação garantida de crédito', 'juros zero sem contexto'],
    trending:      ['educação financeira em 60s', 'comparativo real de parcelas', 'transparência total sem asteriscos'],
    underexplored: ['simulação interativa de crédito', 'história real de recuperação de dívida', 'previdência privada vs poupança explicada'],
  },
  saude: {
    saturated:     ['antes/depois genérico', '"melhor clínica da cidade"', 'desconto % em consulta'],
    trending:      ['bastidores do atendimento', 'depoimento em vídeo específico com dado real', 'FAQ de procedimento em 60s'],
    underexplored: ['dia a dia do especialista', 'saúde preventiva vs curativa', 'comparação honesta de tratamentos'],
  },
  odontologia: {
    saturated:     ['antes/depois de clareamento genérico', 'sorriso perfeito sem contexto', 'preço do tratamento'],
    trending:      ['processo do tratamento passo a passo', 'resultado em número específico de sessões', 'tour da clínica com apresentação da equipe'],
    underexplored: ['objeções comuns respondidas (dói? quanto tempo?)', 'saúde bucal preventiva para crianças', 'impacto da saúde bucal na autoestima'],
  },
  educacao: {
    saturated:     ['certificado + salário alto genérico', 'formação em X dias', 'depoimento de aluno sem especificidade'],
    trending:      ['aula gratuita como isca', 'taxa de empregabilidade real com números', 'aluno mostrando projeto prático'],
    underexplored: ['metodologia diferenciada explicada', 'comunidade de alunos como benefício', 'parceria com empresa para emprego direto'],
  },
  imobiliario: {
    saturated:     ['imóvel dos sonhos genérico', 'financiamento facilitado sem detalhe', 'tour virtual básico'],
    trending:      ['localização com dados reais de valorização %', 'comparativo custo aluguel vs compra', 'tour 360° com dados de infraestrutura do bairro'],
    underexplored: ['história de família comprando primeiro imóvel', 'desmistificar financiamento CEF passo a passo', 'bairros em valorização antecipada'],
  },
  ecommerce: {
    saturated:     ['desconto %', 'frete grátis sem urgência', 'promoção relâmpago sem gatilho real'],
    trending:      ['unboxing e experiência de entrega', 'UGC — clientes usando o produto no dia a dia', 'comparativo honesto com concorrente'],
    underexplored: ['por trás da fabricação do produto', 'sustentabilidade e impacto ambiental', 'personalização do produto como experiência'],
  },
  loja_moveis: {
    saturated:     ['renderização 3D genérica sem cliente', 'promoção sem prazo definido', 'foto de catálogo'],
    trending:      ['antes/depois de ambiente real com cliente', 'tour do showroom com especialista', 'cliente contando experiência de compra'],
    underexplored: ['dicas de decoração para pequenos espaços', 'processo da marcenaria até entrega', 'aproveitamento de espaços difíceis'],
  },
  juridico: {
    saturated:     ['"advocacia de resultado"', '"melhor advogado" sem comprovação', 'garantia de ganhar causa'],
    trending:      ['educacional sobre direito específico (trabalhista, previdenciário)', 'FAQ de casos comuns em 60s', 'desmistificar o processo judicial'],
    underexplored: ['consultoria prévia gratuita curta', 'estatísticas reais de casos por área', 'direitos que as pessoas desconhecem'],
  },
  contabilidade: {
    saturated:     ['economia de impostos genérica', '"contador especialista" sem prova', 'prazo de declaração IRPF'],
    trending:      ['quanto você perde sem contabilidade em R$', 'simulação real de economia tributária', 'impacto da reforma tributária no seu setor'],
    underexplored: ['planejamento sucessório para PMEs', 'contabilidade específica por segmento (MEI, e-commerce)', 'como abrir empresa em 5 passos'],
  },
  beleza: {
    saturated:     ['antes/depois básico', 'promoção de pacote genérico', 'foto de portfólio sem contexto'],
    trending:      ['processo ao vivo em Reels', 'resultado mantido semanas depois', 'tutorial curto de autocuidado em casa'],
    underexplored: ['bastidores da clínica (humanização)', 'cuidado preventivo vs corretivo', 'clientes voltando e mostrando resultado'],
  },
  fitness: {
    saturated:     ['antes/depois de transformação corporal', 'resolução de ano novo', 'promoção de matrícula genérica'],
    trending:      ['dia a dia real de treino sem perfeição', 'resultado de aluno com método e prazo específico', 'funcional curto adaptável'],
    underexplored: ['saúde mental + exercício físico', 'treino adaptado para iniciantes sem tempo', 'fitness para 40+ (mercado crescente)'],
  },
  tecnologia: {
    saturated:     ['lista de funcionalidades técnicas', 'demo genérica sem contexto', 'preço vs concorrente isolado'],
    trending:      ['caso de uso real com resultado mensurável', 'integração com ferramentas que o cliente já usa', 'tempo economizado em horas/semana'],
    underexplored: ['problema resolvido antes/depois', 'onboarding em 2 minutos para testar', 'depoimento de decisor (CEO/CFO) específico'],
  },
  pet: {
    saturated:     ['pets fofos genéricos', 'desconto em banho e tosa', 'foto de animal sem contexto'],
    trending:      ['vídeo de pet no atendimento (reação)', 'tutorial de cuidados em casa', 'antes/depois de grooming'],
    underexplored: ['saúde preventiva de pets (vacinação, check-up)', 'nutrição pet personalizada por raça', 'serviço de coleta e entrega domiciliar'],
  },
  turismo: {
    saturated:     ['foto de destino editorial genérica', 'promoção de pacote sem data', 'paisagem profissional sem pessoa'],
    trending:      ['vídeo de experiência real de viajante', 'comparativo de destinos por budget', 'data específica com urgência de vagas'],
    underexplored: ['bastidores da agência e curadoria', 'mapa de itinerário personalizado', 'destinos nacionais premium underrated'],
  },
  restaurante: {
    saturated:     ['foto de prato profissional sem contexto', 'promoção de combo genérico', 'happy hour sem diferencial'],
    trending:      ['processo de preparo ao vivo', 'história por trás do prato (ingrediente, receita)', 'cliente fazendo review espontâneo'],
    underexplored: ['ingredientes locais e sazonais', 'chef contando a história do cardápio', 'experiência gastronômica completa (não só comida)'],
  },
  consultoria: {
    saturated:     ['case study com números inflados', '"especialista reconhecido"', 'webinar genérico sem entrega clara'],
    trending:      ['diagnóstico ao vivo em 5 minutos', 'resultado específico com tempo de implementação', 'problema → solução em 30 segundos'],
    underexplored: ['erro comum do setor que custa R$X/mês', 'comparativo antes/depois de empresa cliente real', 'bastidores do processo de consultoria'],
  },
  marketing_agencia: {
    saturated:     ['"aumentamos X% o faturamento" sem contexto', 'portfólio de marcas grandes', 'número de campanhas gerenciadas'],
    trending:      ['processo transparente de gestão mês a mês', 'resultado específico de cliente pequeno', 'especialização em 1-2 nichos'],
    underexplored: ['campanha que falhou e o que aprendemos', 'ROI comparativo de canais por setor', 'gestão de crise de reputação online'],
  },
  construcao: {
    saturated:     ['obra concluída sem contexto', 'preço de m² genérico', '"empresa mais barata da região"'],
    trending:      ['acompanhamento de obra ao vivo (stories)', 'antes/depois com cliente contando história', 'custo real documentado de uma reforma'],
    underexplored: ['erros comuns de reforma que geram prejuízo', 'manutenção preventiva que economiza', 'como escolher material com custo-benefício'],
  },
  moda: {
    saturated:     ['foto de produto em fundo branco', 'desconto %', 'nova coleção sem contexto'],
    trending:      ['UGC — clientes usando a peça no dia a dia', 'vídeo de styling com múltiplos looks', 'haul espontâneo no TikTok'],
    underexplored: ['por trás da produção da peça', 'lookbook por tipo de corpo', 'moda circular / segunda mão'],
  },
  psicologia: {
    saturated:     ['"cuide da sua saúde mental" genérico', 'foto clínica formal', 'terapeuta em pose profissional'],
    trending:      ['conteúdo educativo sobre tema específico de saúde mental', 'desmistificar terapia (custo, como funciona)', 'FAQ sobre transtornos comuns sem estigma'],
    underexplored: ['diferença entre tipos de terapia explicada', 'terapia online para iniciantes', 'mindfulness e autocompaixão em práticas curtas'],
  },
  nutricao: {
    saturated:     ['antes/depois de peso (restrições regulatórias)', 'dieta restritiva', '"alimento proibido"'],
    trending:      ['receita rápida e saudável em 60s', 'desmistificar mito alimentar com dado', 'cardápio semanal acessível e completo'],
    underexplored: ['nutrição para performance (não só estética)', 'alimentação para condição específica (diabetes, hipertensão)', 'compras no mercado com nutricionista'],
  },
  eventos: {
    saturated:     ['foto de evento genérica', 'data e preço sem gancho', 'lineup sem contexto'],
    trending:      ['bastidores da organização', 'depoimento de participante de edição anterior', 'countdown com urgência real de ingressos'],
    underexplored: ['impacto do evento na carreira/vida do participante', 'momento específico de transformação', 'comunidade gerada pós-evento'],
  },
  moveis_planejados: {
    saturated:     ['renderização 3D sem cliente real', 'showroom vazio', 'preço de cozinha genérica'],
    trending:      ['projeto real com cliente contando a história', 'tour pelo apartamento entregue', 'processo da medição até a instalação'],
    underexplored: ['aproveitamento de espaços pequenos com planejados', 'móveis planejados vs prontos — comparativo honesto', 'erro comum em projetos que gera retrabalho e custo extra'],
  },
  automotivo: {
    saturated:     ['foto do carro limpo sem contexto', 'promoção de revisão genérica', '"mecânica de confiança"'],
    trending:      ['antes/depois de funilaria ou estética', 'diagnóstico ao vivo de problema', 'cliente no delivery do carro revisado'],
    underexplored: ['dicas de manutenção preventiva em 60s', 'custo de NÃO fazer manutenção (o que quebra)', 'comparativo serviço bom vs ruim'],
  },
  barbearia: {
    saturated:     ['foto de corte com filtro', 'barbeiro posando com cliente', 'promoção de corte + barba'],
    trending:      ['time-lapse de transformação completa', 'ASMR de barba sendo feita', 'tutorial de finalização em casa'],
    underexplored: ['história do barbeiro e tradição do ofício', 'cuidados masculinos além do corte', 'barbearia como espaço de comunidade masculina'],
  },
  fisioterapia: {
    saturated:     ['"alívio de dor rápido"', 'exercício genérico sem contexto', '"clínica especializada" sem prova'],
    trending:      ['exercício curto para dor específica (lombar, ombro)', 'explicação de diagnóstico comum', 'antes/depois de tratamento com prazo real'],
    underexplored: ['fisioterapia preventiva vs corretiva', 'ergonomia para home office (crescente)', 'fisioterapia pediátrica / geriátrica'],
  },
  farmacia: {
    saturated:     ['desconto em medicamentos (ANVISA restringe)', 'foto de produto isolado', '"genérico igual ao original"'],
    trending:      ['dicas de saúde preventiva por estação', 'dermocosméticos com resenha real', 'programa de fidelidade com benefício concreto'],
    underexplored: ['saúde em cada fase da vida', 'fitoterapia e suplementos naturais', 'delivery rápido como diferencial vs grandes redes'],
  },
  servicos_residenciais: {
    saturated:     ['"empresa de confiança"', 'foto de equipamento profissional', 'promoção de primeira limpeza'],
    trending:      ['antes/depois de ambiente tratado', 'processo ao vivo de limpeza profunda', 'cliente mostrando resultado em casa'],
    underexplored: ['produtos ecológicos e não tóxicos', 'garantia de satisfação com política detalhada', 'agendamento via app como diferencial'],
  },
  arquitetura_design: {
    saturated:     ['renderização editorial de alto padrão', 'foto de portfólio sem cliente', '"premiado e renomado"'],
    trending:      ['processo do projeto do zero à entrega', 'cliente contando transformação do espaço', 'antes/depois com quem mora lá'],
    underexplored: ['design funcional para espaços pequenos', 'arquitetura biofílica (tendência global)', 'reformas sem derrubar paredes'],
  },
  franquias: {
    saturated:     ['"franquia de sucesso"', 'foto genérica de loja franqueada', 'tabela de investimento sem contexto'],
    trending:      ['depoimento real de franqueado com resultados em números', 'dia a dia do franqueado em vídeo curto', 'comparativo de retorno vs. emprego CLT'],
    underexplored: ['franquias com baixo investimento inicial (<R$50k)', 'operação home office ou remota', 'suporte da franqueadora no pós-abertura'],
  },
  fotografia_video: {
    saturated:     ['portfólio em slideshow genérico', 'foto de casamento sem contexto', '"fotógrafo profissional"'],
    trending:      ['making-of e bastidores do ensaio', 'processo criativo em timelapse', 'depoimento emocional do cliente'],
    underexplored: ['vídeo corporativo curto e impactante', 'fotografia de família em locação urbana', 'fotografia documental de negócios/marca'],
  },
  seguranca_privada: {
    saturated:     ['"segurança 24h" genérico', 'foto de câmera e alarme', 'preço de monitoramento sem contexto'],
    trending:      ['caso real de crime evitado pelo monitoramento', 'instalação documentada passo a passo', 'central de monitoramento ao vivo'],
    underexplored: ['segurança específica por segmento (escola, condomínio)', 'análise de risco gratuita como isca', 'IA em câmeras — nova geração de segurança'],
  },
  padaria_cafeteria: {
    saturated:     ['foto de pão na vitrine', 'promoção de café da manhã', 'cardápio em foto genérica'],
    trending:      ['processo de fabricação ao vivo', 'barista mostrando preparo de drink especial', 'reels de produto sendo embalado/finalizado'],
    underexplored: ['história da receita tradicional familiar', 'sazonalidade de produtos especiais (Páscoa, Natal)', 'programa de fidelidade gamificado'],
  },
  depilacao: {
    saturated:     ['"sem dor"', 'mulher satisfeita genérica', 'desconto % em pacote de sessões'],
    trending:      ['processo de laser explicado em 60s', 'resultado real com número de sessões necessárias', 'FAQ sobre dor, contraindicações e cuidados'],
    underexplored: ['depilação masculina (mercado em crescimento)', 'skin care pós-depilação como diferencial', 'pacote + indicação com benefício concreto'],
  },
  harmonizacao: {
    saturated:     ['antes/depois (restrição CFM/CFO)', '"naturalidade em primeiro lugar"', 'promoção de procedimento'],
    trending:      ['médico explicando técnica e segurança', 'FAQ sobre medos e mitos do procedimento', 'educacional sobre o que muda com harmonização'],
    underexplored: ['harmonização para homens (mercado crescente)', 'rejuvenescimento não cirúrgico explicado', 'cuidados pós-procedimento com dicas práticas'],
  },
  autoescola: {
    saturated:     ['aprovação garantida', 'foto de aluno na aula', '"melhor autoescola da cidade"'],
    trending:      ['simulado de prova ao vivo', 'dicas de trânsito em 60s', 'depoimento de aprovado na primeira tentativa'],
    underexplored: ['CNH por categoria específica (moto, carreta, ônibus)', 'aulas online de legislação como diferencial', 'plano parcelado sem juros detalhado'],
  },
  lavanderia: {
    saturated:     ['roupa limpa foto genérica', 'desconto de primeira lavagem', '"qualidade e cuidado"'],
    trending:      ['antes/depois de peça difícil (tapete, edredom)', 'processo de remoção de mancha ao vivo', 'coleta e entrega como diferencial prático'],
    underexplored: ['lavanderia para empresas/hotéis (B2B)', 'cuidado de peças delicadas (lã, seda, jeans premium)', 'assinatura mensal com desconto'],
  },
  lava_jato: {
    saturated:     ['"lavagem completa por R$X"', 'foto estática de carro molhado', '"qualidade e rapidez"'],
    trending:      ['vídeo antes/depois em Reels (15s)', 'pacote fidelidade mensal', 'higienização interna completa com processo visível'],
    underexplored: ['lavagem ecológica/a seco (sem água)', 'atendimento domiciliar / drive-thru', 'proteção de pintura e ceramização para iniciantes'],
  },
  auditoria: {
    saturated:     ['"auditoria independente e especializada"', 'lista de certificações sem contexto', 'preço de relatório sem âncora de valor'],
    trending:      ['impacto regulatório em linguagem do C-Level', 'caso real de risco evitado por auditoria', 'radar de mudanças normativas (CVM, BACEN, LGPD)'],
    underexplored: ['diagnóstico gratuito de conformidade como isca', 'diferença entre auditoria interna vs externa explicada', 'ROI financeiro de uma auditoria de processos'],
  },
  corretor_saude: {
    saturated:     ['"melhor plano de saúde" sem comparativo', 'preço baixo sem detalhar cobertura', 'lista de operadoras sem diferencial'],
    trending:      ['simulador de cotação comparativa (ANS)', 'vídeo explicando carência e o que cobre', 'reajuste histórico por operadora em dados reais'],
    underexplored: ['impacto financeiro de não ter plano (procedimento urgente em R$)', 'guia de como migrar sem perder carência', 'plano para MEI e autônomos — nicho sub-atendido'],
  },
  corretor_imobiliario: {
    saturated:     ['tour virtual básico sem contexto', '"ótima localização"', 'foto de fachada sem dados de valorização'],
    trending:      ['análise de valorização do bairro com dados reais', 'vídeo mostrando arredores (escola, mercado, transporte)', 'comparativo custo de aluguel vs financiamento mês a mês'],
    underexplored: ['desmistificar FGTS no financiamento', 'histórico do preço do m² no bairro', 'imóvel como investimento — rentabilidade real vs renda fixa'],
  },
  protecao_patrimonial: {
    saturated:     ['"proteja seu patrimônio" genérico', 'lista de produtos sem contexto de necessidade', 'jargão jurídico sem tradução'],
    trending:      ['cenário hipotético de risco real (inventário, dívidas, separação)', 'webinar de planejamento patrimonial com especialista', 'holding familiar — quanto economiza em impostos por ano'],
    underexplored: ['patrimônio de filhos menores — como proteger', 'sócio como risco patrimonial — blindagem jurídica', 'offshore acessível — desmistificar para classe média alta'],
  },
  seguro_vida: {
    saturated:     ['"deixe sua família protegida" genérico', 'preço baixo sem explicar cobertura', 'apelo ao medo sem solução concreta'],
    trending:      ['quanto sua família precisaria por mês sem sua renda', 'seguro de vida como investimento (resgate em vida)', 'comparativo seguro vs poupança para o mesmo objetivo'],
    underexplored: ['seguro de vida para autônomos (renda garantida em doença)', 'desmistificar carência e exclusões reais', 'seguro de vida atrelado ao financiamento imobiliário'],
  },
  seguro_auto: {
    saturated:     ['preço mais barato sem âncora', '"cobertura completa" sem detalhe', 'foto de carro batido sem solução'],
    trending:      ['simulador de economia vs seguro atual', 'quanto custa um roubo sem seguro no seu modelo de carro', 'assistência 24h como diferencial — carro reserva imediato'],
    underexplored: ['seguro para carro financiado — obrigação do banco explicada', 'proteção rastreador + seguro vs só rastreador', 'seguro para Uber/app — nicho crescente sub-segurado'],
  },
  seguro_residencial: {
    saturated:     ['"proteja seu lar" genérico', 'lista de coberturas sem tradução humana', 'foto de casa sem contexto de risco'],
    trending:      ['quanto custaria reparar incêndio/enchente sem seguro em R$', 'assistência 24h como carro-chefe (encanador, eletricista, chaveiro)', 'seguro para apartamento alugado — quem paga?'],
    underexplored: ['responsabilidade civil para dano ao vizinho', 'seguro conteúdo para quem mora de aluguel', 'diferença seguro residencial vs garantia de aluguel'],
  },
  rh_empresa: {
    saturated:     ['"gestão de pessoas estratégica"', 'lista de serviços sem ROI demonstrado', '"parceiro de RH" sem evidência'],
    trending:      ['custo real de uma contratação errada (até 3× o salário)', 'turnover em % vs benchmark do setor com dados', 'IA no recrutamento — redução de tempo de seleção com dados'],
    underexplored: ['RH para PME sem RH interno — custo vs contratar CLT', 'onboarding estruturado reduz turnover em X% — caso real', 'compliance trabalhista — o que pode multar sua empresa agora'],
  },
  energia_solar: {
    saturated:     ['economia de X% na conta de luz genérica', 'foto de painel no telhado sem contexto', '"energia limpa e sustentável"'],
    trending:      ['simulação de economia real com CEP e consumo kWh', 'antes/depois da conta de luz com valor exato economizado', 'depoimento de cliente com retorno de investimento em meses'],
    underexplored: ['financiamento em 60× sem entrada vs conta de luz atual', 'geração de crédito de energia: revenda ao vizinho', 'comparativo solar vs gerador para empresas'],
  },
  clinica_veterinaria: {
    saturated:     ['"ame seu pet" genérico', 'foto de cão ou gato fofo sem contexto clínico', 'desconto na primeira consulta'],
    trending:      ['vídeo de consulta real com tutor presente', 'dica de saúde preventiva por raça/espécie', 'bastidores do atendimento de emergência'],
    underexplored: ['plano de saúde pet — nicho crescente e sub-explorado', 'cuidados com pets idosos — público fidelíssimo', 'pet day care com transmissão ao vivo para o dono'],
  },
  oftalmologia: {
    saturated:     ['foto de olho com raio de luz', '"visão perfeita" sem dado concreto', 'desconto em consulta sem âncora de valor'],
    trending:      ['antes/depois de LASIK com depoimento do paciente', 'FAQ sobre cirurgia refrativa em 60s', 'processo do exame explicado passo a passo'],
    underexplored: ['saúde ocular digital — tempo de tela e danos à visão', 'óculos vs lente vs cirurgia: comparativo real de custo em 5 anos', 'check-up ocular para crianças — prevenção de miopia'],
  },
  dermatologia: {
    saturated:     ['antes/depois básico (risco CFM)', '"pele perfeita" sem contexto de tratamento', 'lista de procedimentos sem âncora de resultado'],
    trending:      ['dermatologista explicando ativo cosmético em 60s', 'rotina de skincare com lógica científica simples', 'FAQ: o que tratar primeiro — acne, manchas ou rugas?'],
    underexplored: ['dermatologia para homens — mercado em aceleração', 'saúde da pele como investimento (não só estética)', 'microbioma da pele — educação de vanguarda que converte'],
  },
  cirurgia_plastica: {
    saturated:     ['antes/depois sem contexto médico', '"resultado natural garantido"', 'preço de procedimento como call-to-action'],
    trending:      ['médico explicando técnica cirúrgica em linguagem acessível', 'FDA e ANVISA aprovação como argumento de segurança', 'tour pela clínica com equipe e tecnologia'],
    underexplored: ['medicina estética não cirúrgica como alternativa acessível', 'cirurgia pós-bariátrica — nicho crescente e underserved', 'reconstrução mamária pós-câncer — causa com alto engajamento'],
  },
  ortopedia: {
    saturated:     ['foto de raio-X genérica', '"especialista em ortopedia"', 'desconto em consulta inicial'],
    trending:      ['médico respondendo dúvidas de dor específica em vídeo curto', 'fisioterapia preventiva para quem treina — crossfit, corrida', 'diagnóstico digital: "responda 3 perguntas e saiba se precisa de um ortopedista"'],
    underexplored: ['ortopedia para trabalhadores manuais (LER, DORT)', 'prevenção de lesões em atletas amadores', 'osteoporose e saúde óssea para 50+ — audience sub-atendida'],
  },
  pediatria: {
    saturated:     ['criança sorrindo genérica', '"seu filho merece o melhor"', 'lista de vacinas sem contexto'],
    trending:      ['pediatra respondendo dúvida de pai/mãe em Reels', 'guia de febre: quando ir à UPA vs aguardar em casa', 'desenvolvimento infantil por faixa etária — conteúdo evergreen'],
    underexplored: ['pediatria para bebês prematuros — nicho de alta fidelidade', 'saúde mental infantil — tema em ascensão pós-pandemia', 'nutrição infantil e alimentação complementar saudável'],
  },
  ginecologia: {
    saturated:     ['"cuidado feminino completo"', 'imagem de mulher genérica', 'lista de exames preventivos sem call-to-action'],
    trending:      ['ginecologista falando sobre saúde hormonal em Reels', 'mito vs realidade: anticoncepcional, TPM, menopausa', 'pré-natal humanizado — diferencial de clínica moderna'],
    underexplored: ['saúde da mulher 40+ — menopausa e qualidade de vida', 'fertilidade: quando procurar um especialista', 'ginecologia para adolescentes — first visit sem medo'],
  },
  cardiologia: {
    saturated:     ['coração genérico como ícone', '"cuide do seu coração"', 'lista de sintomas de infarto sem ação clara'],
    trending:      ['cardiologista explicando exame específico em 2 minutos', 'relação entre estresse e doenças cardíacas — conteúdo viral', 'paciente jovem que teve infarto — quebra de objeção de "sou jovem e saudável"'],
    underexplored: ['saúde cardiovascular para atletas amadores', 'wearables e monitoramento cardíaco domiciliar', 'genética e risco cardíaco familiar — check-up proativo'],
  },
  psiquiatria: {
    saturated:     ['"cuide da sua saúde mental"', 'imagem cerebro/neuronios genérica', 'lista de sintomas sem normalização'],
    trending:      ['psiquiatra desmistificando remédio psiquiátrico em vídeo', 'TDAH em adultos: como é o diagnóstico', 'ansiedade no ambiente de trabalho — conteúdo viral B2B'],
    underexplored: ['psiquiatria para executivos e líderes — burnout enterprise', 'saúde mental masculina — homens não pedem ajuda, conteúdo que quebra isso', 'psiquiatria online como democratização do acesso'],
  },
  fonoaudiologia: {
    saturated:     ['"seu filho fala bem?"', 'foto de criança com fonoaudiólogo', 'lista de atrasos de fala por idade'],
    trending:      ['vídeo de exercício vocal para professores e apresentadores', 'gagueira: mitos e realidade em 60s', 'depoimento de criança que melhorou com fonoterapia'],
    underexplored: ['fonoaudiologia para idosos (disfagia, deglutição)', 'voz profissional — cantores, advogados, professores', 'autismo e comunicação alternativa — nicho com alta fidelidade'],
  },
  clinica_reabilitacao: {
    saturated:     ['foto de aparelho de fisioterapia genérico', '"recupere sua mobilidade"', 'lista de convênios aceitos'],
    trending:      ['vídeo de exercício de reabilitação que o paciente pode fazer em casa', 'antes/depois de amplitude de movimento com dado real de semanas', 'fisioterapeuta explicando pós-operatório de joelho/ombro'],
    underexplored: ['reabilitação de atletas de alta performance', 'fisioterapia respiratória pós-COVID — demanda ainda alta', 'neuro reabilitação pós-AVC — família é o decisor de compra'],
  },
  clinica_capilar: {
    saturated:     ['transplante genérico "sem dor"', '"cabelo de volta em X meses"', 'foto de calvície sem contexto de tratamento'],
    trending:      ['cirurgião explicando técnica FUE vs FUT em 90s', 'resultado real com número de fios transplantados', 'linha do tempo de crescimento mês a mês em vídeo'],
    underexplored: ['calvície feminina — mercado com muito menos concorrência', 'microagulhamento capilar como alternativa ao transplante', 'minoxidil capipenho — educação de produto de entrada que filtra interesse'],
  },
  escola_idiomas: {
    saturated:     ['"fale inglês fluente em X meses"', 'foto de globo/bandeira', 'nível básico ao avançado sem diferencial'],
    trending:      ['professor nativo em aula experimental ao vivo', 'inglês para situações reais: reunião de trabalho, viagem, apresentação', 'aluno contando como o inglês mudou a carreira dele'],
    underexplored: ['inglês para saúde (médicos, enfermeiros, pesquisadores)', 'espanhol para negócios com América Latina', 'aulas híbridas: presencial + app para prática diária'],
  },
  curso_concurso: {
    saturated:     ['"aprovação garantida"', 'foto de candidato feliz com carta de aprovação', 'lista de bancas atendidas'],
    trending:      ['professor resolvendo questão difícil ao vivo em 5 minutos', 'mapa de estudos personalizado por tempo disponível', 'candidato aprovado contando estratégia de estudo real'],
    underexplored: ['concurso específico por área (saúde, TI, jurídico) com taxa de aprovação real', 'preparação para provas de residência médica', 'concurso municipal com baixa concorrência — nicho sub-atendido'],
  },
  crossfit_funcional: {
    saturated:     ['"transforme seu corpo"', 'atleta musculoso levantando peso', 'desconto na matrícula'],
    trending:      ['WOD ao vivo em Reels — 30 segundos que deixam o lead com vontade de experimentar', 'aluno antes/depois com tempo real e número de treinos', '"vem uma semana grátis" como CTA direto no criativo'],
    underexplored: ['crossfit para iniciantes — quebrar a barreira de medo de intensidade', 'crossfit masters (40+) — nicho crescente com poder de compra', 'recuperação e mobilidade como diferencial — não só performance'],
  },
  yoga_pilates: {
    saturated:     ['foto de pose complexa em cenário bonito', '"paz interior e equilíbrio"', 'pacote de aulas com desconto genérico'],
    trending:      ['aula experimental de yoga ao vivo em Reels', 'pilates clínico com resultado de melhora de dor lombar mensurado', 'yoga para ansiedade: rotina de 10 minutos que qualquer pessoa faz'],
    underexplored: ['pilates para homens — nicho sub-explorado que cresce rápido', 'yoga pré-natal e pós-parto', 'yoga corporativo B2B — empresas contratando para equipes'],
  },
  coaching_carreira: {
    saturated:     ['"desbloqueie seu potencial"', '"o coach que mudou minha vida"', 'lista de ferramentas/metodologias sem resultado'],
    trending:      ['case real de promoção ou aumento salarial com dado concreto', 'diagnóstico de carreira gratuito em 5 questões como isca', 'executivo contando como o coaching mudou sua liderança'],
    underexplored: ['coaching para transição de carreira (CLT → PJ, carreira → empreendedorismo)', 'coaching para profissionais de saúde — burnout médico', 'coaching de recolocação para 50+ — mercado com dor real'],
  },
  desenvolvimento_software: {
    saturated:     ['"tecnologia de ponta"', 'foto de código na tela', 'lista de linguagens/frameworks sem contexto de negócio'],
    trending:      ['case de redução de custo ou aumento de receita com software desenvolvido', 'demo ao vivo de produto construído em 60 segundos', 'fundador explicando problema que resolveu com tecnologia'],
    underexplored: ['automação de processos para PMEs que ainda usam planilha', 'sistema para nichos específicos (clínicas, escritórios, escolas)', 'MVP em 30 dias com orçamento fechado — argumento anti-objeção'],
  },
  saas_b2b: {
    saturated:     ['"aumente sua produtividade"', 'dashboard screenshot sem contexto', 'lista de features sem benefício'],
    trending:      ['ROI calculado: economia de X horas/mês × custo da hora do time', 'demo self-serve de 3 minutos sem precisar falar com vendedor', 'case de cliente com número real de resultado'],
    underexplored: ['integração com ferramentas que o cliente já usa (CRM, ERP)', 'segurança e conformidade como diferencial para grandes empresas', 'trial com onboarding guiado — reduz churn de primeiros 30 dias'],
  },
  marketing_digital_cursos: {
    saturated:     ['"ganhe R$10k/mês como gestor"', 'guru mostrando estilo de vida', 'promessa de resultado em 30 dias'],
    trending:      ['case de aluno com campanha real e ROAS documentado', 'ferramenta ao vivo sendo configurada no criativo', 'mentor revelando erro que queimou R$50k de budget'],
    underexplored: ['marketing digital para nichos específicos (saúde, jurídico, imóveis)', 'gestão de tráfego para e-commerce vs local business — cursos distintos', 'ferramentas de IA no dia a dia do gestor — conteúdo de vanguarda'],
  },
  consorcio: {
    saturated:     ['"realize seu sonho"', 'foto de casa ou carro genérico', 'parcela baixa sem contexto'],
    trending:      ['simulador: consórcio vs financiamento com juros reais calculados', '"fui contemplado em X meses" — depoimento específico com prazo real', 'consórcio de imóvel como forma de investimento vs renda fixa'],
    underexplored: ['consórcio de energia solar — nicho novo e crescente', 'consórcio de serviços (reforma, viagem, cirurgia)', 'cota contemplada para compra imediata — produto distinto'],
  },
  cambio_remessas: {
    saturated:     ['cotação do dólar como foco', '"câmbio sem taxas" sem comprovação', 'foto de moedas ou cartão'],
    trending:      ['comparativo real de spread: banco tradicional vs fintech em R$ concreto', 'processo de remessa internacional passo a passo em 2 minutos', 'depoimento de brasileiro no exterior que usa a plataforma'],
    underexplored: ['câmbio para importadores PME', 'remessa para pagar universidade fora do Brasil', 'câmbio para nômades digitais — público crescente e sub-atendido'],
  },
  previdencia_privada: {
    saturated:     ['"garanta seu futuro"', 'casal de aposentados sorrindo', 'taxa de retorno sem comparativo'],
    trending:      ['calculadora ao vivo: quanto terei em X anos com Y por mês', 'PGBL e abatimento de IR explicado em 90s para quem declara completo', 'previdência vs tesouro direto: comparativo real com dados'],
    underexplored: ['previdência para autônomos e MEI — sub-segurados', 'previdência corporativa como benefício de RH para PMEs', 'previdência para filhos — presente de longo prazo'],
  },
  ar_condicionado: {
    saturated:     ['"instalação rápida e garantida"', 'foto de split na parede', 'desconto na instalação'],
    trending:      ['comparativo de BTU vs tamanho de ambiente com simulador simples', 'higienização antes/depois com foto do filtro sujo', 'instalação documentada em timelapse — transmite confiança'],
    underexplored: ['ar-condicionado para home office — público crescente pós-pandemia', 'ar multi-split para casa toda — ticket 3× maior', 'manutenção preventiva como assinatura mensal — recorrência'],
  },
  dedetizacao: {
    saturated:     ['"exterminamos toda praga"', 'foto de barata genérica', 'garantia de X dias sem resultado específico'],
    trending:      ['antes/depois de infestação documentado', 'produto e certificado ANVISA como argumento de segurança para família', 'processo de dedetização seguro para pets e crianças'],
    underexplored: ['controle de pragas para restaurantes e hotéis — B2B com contrato anual', 'dedetização ecológica/orgânica — nicho crescente', 'cupim estrutural em imóveis — lead com urgência alta e ticket grande'],
  },
  mudancas_transporte: {
    saturated:     ['"mudança rápida e segura"', 'foto de caminhão baú', 'orçamento sem frictionless'],
    trending:      ['processo de embalagem e cuidado com objetos frágeis documentado em vídeo', '"calculadora de custo" por m² e distância como isca', 'depoimento de mudança interstate com resultado real'],
    underexplored: ['mudança corporativa (empresas relocando funcionários)', 'transporte de arte, instrumentos e objetos de alto valor', 'self-storage como complemento — parceria e upsell'],
  },
  micropigmentacao: {
    saturated:     ['"sobrancelha perfeita"', 'antes/depois básico', 'desconto no procedimento'],
    trending:      ['processo ao vivo em 90s mostrando técnica e resultado imediato', 'FAQ: dói? Quanto dura? Como é a recuperação? — em Reels', 'manutenção: por que retornar após X meses explicado com foto comparativa'],
    underexplored: ['micropigmentação para homens (barba e couro cabeludo)', 'micropigmentação oncológica pós-quimioterapia — nicho com causa social', 'lips blush como serviço em alta com baixa concorrência digital'],
  },
  tatuagem_piercing: {
    saturated:     ['portfólio em grade de fotos sem contexto', '"artista premiado"', 'promoção de data comemorativa'],
    trending:      ['timelapse do processo de tatuagem em 15 segundos', 'fine line e aquarela em tendência — conteúdo de estilo atual', '"traga a ideia, fazemos o projeto" como CTA de personalização'],
    underexplored: ['tatoo cover-up — alta demanda, baixa oferta digital', 'piercing de alta qualidade (titânio implante) vs bijou', 'tatuagem para quem tem medo — tour emocional que converte primeiro-timer'],
  },
  estetica_corporal: {
    saturated:     ['"elimine a gordura localizada"', 'antes/depois básico', 'preço por sessão sem âncora de pacote'],
    trending:      ['resultado de pacote de 10 sessões com fotos semana a semana', 'dermatologista parceiro validando o procedimento', 'FAQ: criolipólise vs lipoaspiração — educar para converter'],
    underexplored: ['estética masculina corporal — mercado crescendo rapidamente', 'drenagem linfática pós-operatória — alta demanda cirurgiões parceiros', 'body positive com estética funcional — tom não invasivo que converte'],
  },
  delivery_food: {
    saturated:     ['foto de prato com iluminação ruim', 'desconto na primeira entrega', '"entrega rápida"'],
    trending:      ['vídeo do prato sendo finalizado na cozinha — sensory marketing', 'combo de fim de semana com urgência de horário limitado', 'bastidores da produção — humaniza a marca e gera engajamento'],
    underexplored: ['delivery para empresas (almoço corporativo com assinatura semanal)', 'culinária regional ou nicho específico (vegana, fitness, comfort food)', 'kit jantar especial para datas — Valentine\'s, Natal, aniversário'],
  },
  catering_buffet: {
    saturated:     ['foto de mesa montada genérica', '"festa inesquecível"', 'lista de opções de cardápio sem âncora de valor'],
    trending:      ['making-of de evento real com depoimento do contratante', 'cardápio degustação filmado com apresentação gourmet', '"simule seu evento" com orçamento online em 3 perguntas'],
    underexplored: ['buffet para evento corporativo — ticket alto e decisor é RH', 'coffee break e catering de confraternizações de pequenas empresas', 'buffet de comida saudável e restritiva — nicho sem líder claro'],
  },
  producao_audiovisual: {
    saturated:     ['showreel genérico de 2 minutos', '"storytelling poderoso"', 'lista de equipamentos'],
    trending:      ['case de resultado: vídeo que gerou X leads ou Y vendas para o cliente', 'produção de UGC/creator content como serviço escalável', 'processo criativo em 60s — da briefing à entrega'],
    underexplored: ['vídeo institucional para startups que captam investimento', 'conteúdo de produto para e-commerce com alta conversão documentada', 'vídeo de recrutamento — employer branding visual'],
  },
  desenvolvimento_pessoal: {
    saturated:     ['"seja a melhor versão de si"', 'guru em palco aplaudido', 'promessa de mudança em 21 dias'],
    trending:      ['microtransformação documentada: 30 dias com hábito específico + resultado mensurável', 'ferramenta prática (planilha, método) entregue como isca de lead magnet', 'depoimento antes/depois com dado concreto (salário, relacionamento, tempo)'],
    underexplored: ['desenvolvimento pessoal para profissionais de saúde em burnout', 'liderança para primeiro emprego de gestão', 'saúde financeira como desenvolvimento pessoal — nicho em crescimento'],
  },
  ecommerce_cosmeticos: {
    saturated:     ['"pele perfeita em X dias"', 'foto de produto em fundo branco', 'desconto % sem âncora'],
    trending:      ['skincare routine em Reels: produto usado, resultado visto', 'UGC de cliente real com skin type específico — alta credibilidade', '"clean beauty" e ingredientes seguros como argumento crescente'],
    underexplored: ['cosméticos para homens — mercado crescendo 3× mais rápido que feminino', 'skincare para pele negra — nicho sub-representado e fidelíssimo', 'assinatura mensal de cosméticos curados — recorrência garantida'],
  },
  ecommerce_moda: {
    saturated:     ['foto de modelo em estúdio', 'desconto 50% sem urgência real', '"qualidade premium"'],
    trending:      ['look do dia em Reels com link direto para produto', 'UGC: clientes reais usando a peça no dia a dia', 'colaboração com micro-influencer de nicho (fitness, casual, formal)'],
    underexplored: ['moda plus size com representatividade real', 'moda sustentável com transparência de cadeia produtiva', 'aluguel de peças de festa — modelo de negócio em crescimento'],
  },

  outro: {
    saturated:     ['promoção genérica', 'foto sem contexto', '"empresa de confiança"'],
    trending:      ['prova social específica com resultado mensurável', 'processo de atendimento transparente', 'FAQ das objeções mais comuns'],
    underexplored: ['história da empresa / fundador', 'impacto local e na comunidade', 'comparativo honesto com alternativas'],
  },
}

// ── City size detection ───────────────────────────────────────────────────────
const CAPITALS = ['são paulo', 'rio de janeiro', 'belo horizonte', 'brasília', 'brasilia',
  'fortaleza', 'recife', 'salvador', 'curitiba', 'manaus', 'porto alegre', 'goiânia', 'goiania',
  'belém', 'belem', 'guarulhos', 'campinas', 'são luís', 'sao luis', 'maceió', 'maceio']
const LARGE_CITIES = ['natal', 'teresina', 'campo grande', 'joão pessoa', 'joao pessoa',
  'aracaju', 'cuiabá', 'cuiaba', 'macapá', 'macapa', 'porto velho', 'rio branco', 'palmas',
  'ribeirão preto', 'ribeirao preto', 'uberlândia', 'uberlandia', 'contagem', 'juiz de fora',
  'sorocaba', 'joinville', 'feira de santana', 'caxias do sul', 'são bernardo', 'sao bernardo',
  'santo andré', 'santo andre', 'osasco', 'são josé dos campos', 'sao jose dos campos',
  'londrina', 'maringá', 'maringa', 'niterói', 'niteroi', 'florianópolis', 'florianopolis']
const INDICATORS_SMALL = ['interior', 'zona rural', 'município', 'municipio', 'vila', 'distrito']

export function detectCitySize(city?: string): 'capital' | 'grande' | 'medio' | 'pequeno' | 'online' {
  if (!city) return 'capital'
  const c = city.toLowerCase()
  if (INDICATORS_SMALL.some(i => c.includes(i))) return 'pequeno'
  if (CAPITALS.some(i => c.includes(i))) return 'capital'
  if (LARGE_CITIES.some(i => c.includes(i))) return 'grande'
  // Heurística: se tem " - SP", " - RJ" etc e não é capital conhecida → medio
  if (/- (SP|RJ|MG|RS|PR|BA|SC|GO|PE|CE|MA|PA|MT|MS|ES|PI|RN|AL|PB|SE|AM|TO|RO|AC|AP|RR)/i.test(c)) return 'medio'
  return 'medio'
}

const CITY_SIZE_MODIFIERS: Record<string, { modifier: number; label: string }> = {
  capital:  { modifier: 1.00, label: 'Capital / Grande metrópole' },
  grande:   { modifier: 0.78, label: 'Cidade grande (500k–2M hab.)' },
  medio:    { modifier: 0.62, label: 'Cidade média (100k–500k hab.)' },
  pequeno:  { modifier: 0.48, label: 'Cidade pequena (<100k hab.) — audiência limitante' },
  online:   { modifier: 0.90, label: 'Negócio online — alcance nacional' },
}

function getCitySizeInfo(city?: string) {
  const tier = detectCitySize(city)
  return { tier, ...CITY_SIZE_MODIFIERS[tier] }
}

// ── Curva de maturidade de campanha ──────────────────────────────────────────
export function getCampaignMaturityStage(weeksActive: number): CampaignMaturityStage {
  if (weeksActive <= 2) return {
    stage: 'aprendizado', label: 'Fase de Aprendizado', weekRange: 'Semana 1–2',
    cplMultiplier: 1.70, color: '#F59E0B', progress: 15,
    advice: 'CPL naturalmente alto enquanto o algoritmo aprende. Não pause nem altere campanhas. Resultado real aparece na semana 3.',
  }
  if (weeksActive <= 6) return {
    stage: 'otimizacao', label: 'Fase de Otimização', weekRange: 'Semana 3–6',
    cplMultiplier: 0.82, color: '#22C55E', progress: 45,
    advice: 'Melhor janela de performance. CPL 18% abaixo do benchmark. Momento ideal para escalar budget em até 20%/semana.',
  }
  if (weeksActive <= 14) return {
    stage: 'estabilizacao', label: 'Fase de Estabilização', weekRange: 'Semana 7–14',
    cplMultiplier: 1.00, color: '#38BDF8', progress: 70,
    advice: 'Performance estável. Prepare novos criativos para evitar fadiga. Teste novas audiências mantendo o que funciona.',
  }
  return {
    stage: 'fadiga', label: 'Fadiga de Criativo', weekRange: `Semana ${weeksActive}+`,
    cplMultiplier: 1.35, color: '#FF4D4D', progress: 95,
    advice: 'CPL subindo = audiência saturada com esse criativo. Troque pelo menos 2 peças criativas agora. Considere novo ângulo ou formato.',
  }
}

// ── Contexto de sazonalidade ──────────────────────────────────────────────────
const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const MONTH_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export function getSeasonalityContext(benchKey: string, monthOverride?: number) {
  const idx = SEASONALITY_INDEXES[benchKey] || SEASONALITY_INDEXES['outro']
  const month = monthOverride ?? new Date().getMonth() // 0-based
  const current = idx[month]
  const next = idx[(month + 1) % 12]

  const trend: 'subindo' | 'descendo' | 'estável' =
    next > current + 0.05 ? 'subindo' :
    next < current - 0.05 ? 'descendo' : 'estável'

  const pct = Math.round(Math.abs(1 - current) * 100)
  const cheaper = current < 1.0

  const interpretation = current >= 1.20
    ? `🔴 Pico de mercado — CPL ${Math.round((current - 1) * 100)}% acima da média. Mês de alta concorrência.`
    : current >= 1.05
    ? `🟡 Mês levemente mais caro — CPL ${Math.round((current - 1) * 100)}% acima. Monitore frequência de anúncios.`
    : current <= 0.82
    ? `🟢 Ótimo momento — CPL ${pct}% abaixo da média histórica. Ideal para escalar budget.`
    : current <= 0.92
    ? `🟢 Mês favorável — CPL ${pct}% abaixo da média. Boa janela para testes e escala.`
    : '⚪ CPL dentro da média histórica para este mês.'

  const peakMonths = idx.map((v, i) => ({ v, i })).filter(x => x.v >= 1.15).map(x => MONTH_SHORT[x.i])
  const valleyMonths = idx.map((v, i) => ({ v, i })).filter(x => x.v <= 0.82).map(x => MONTH_SHORT[x.i])

  const chartData = idx.map((v, i) => ({
    month: MONTH_SHORT[i],
    index: v,
    isCurrent: i === month,
    isPeak: v >= 1.15,
    isValley: v <= 0.82,
  }))

  return { current, currentMonth: MONTH_NAMES[month], trend, interpretation, peakMonths, valleyMonths, chartData, cheaper }
}

// ── Ângulos criativos públicos ────────────────────────────────────────────────
export function getCreativeAngles(nicheRaw: string): CreativeAngles | null {
  const bench = getBenchmark(nicheRaw)
  if (!bench) return null
  const key = Object.keys(BENCHMARKS).find(k => BENCHMARKS[k] === bench)
  return key ? (CREATIVE_ANGLES_DATA[key] || CREATIVE_ANGLES_DATA['outro']) : null
}

export function getSeasonalityIndex(benchKey: string): number[] {
  return SEASONALITY_INDEXES[benchKey] || SEASONALITY_INDEXES['outro']
}

// ── Funções públicas ──────────────────────────────────────────────────────────

/** Busca benchmark pelo nicho (matching por palavras-chave, mais específico primeiro) */
export function getBenchmark(nicheRaw: string): NicheBenchmark | null {
  if (!nicheRaw) return null
  const n = nicheRaw.toLowerCase()

  // Ordena por comprimento da keyword decrescente:
  // palavras compostas ("móveis planejados") vencem sobre palavras simples ("loja")
  const sorted = Object.entries(KEY_MAP).sort(([a], [b]) => b.length - a.length)

  for (const [kw, key] of sorted) {
    if (n.includes(kw)) return BENCHMARKS[key] || null
  }
  // fallback genérico
  if (n.length > 0) return BENCHMARKS['outro']
  return null
}

/**
 * Calcula projeções de KPIs com base no benchmark do nicho e budget informado.
 * Retorna dados para KPI cards, gráfico de projeção e funil.
 */
export function computeNicheProjection(bench: NicheBenchmark, budget: number, city?: string, benchKey?: string): NicheProjection {
  // ── Inteligência de sazonalidade e mercado ────────────────────────────────
  const key = benchKey ?? (Object.keys(BENCHMARKS).find(k => BENCHMARKS[k] === bench) || 'outro')
  const seasonCtx   = getSeasonalityContext(key)
  const cityInfo    = getCitySizeInfo(city)
  const combinedMod = seasonCtx.current * cityInfo.modifier
  const cplAvg      = (bench.cpl_min + bench.cpl_max) / 2
  const adjustedCPLAvg = Math.round(cplAvg * combinedMod)

  const leadsMin  = Math.round(budget / (bench.cpl_max * combinedMod))
  const leadsMax  = Math.round(budget / (bench.cpl_min * combinedMod))
  const leadsMonth = Math.round(budget / adjustedCPLAvg)

  const salesMonth   = Math.round(leadsMonth * bench.cvr_lead_to_sale)
  const revenueMonth = salesMonth * bench.avg_ticket
  const revenueMin   = Math.round(leadsMin * bench.cvr_lead_to_sale) * bench.avg_ticket
  const revenueMax   = Math.round(leadsMax * bench.cvr_lead_to_sale) * bench.avg_ticket
  const roas    = budget > 0 ? +(revenueMonth / budget).toFixed(1) : 0
  const ltv     = bench.avg_ticket * bench.ltv_multiplier
  const roasLtv = +(roas * bench.ltv_multiplier).toFixed(1)

  const roasForComparison = bench.ltv_multiplier >= 3 ? roasLtv : roas
  const roasIsLtvBased    = bench.ltv_multiplier >= 3

  const budgetStatus: NicheProjection['budgetStatus'] =
    budget < bench.budget_floor  ? 'abaixo' :
    budget < bench.budget_ideal  ? 'mínimo' : 'ideal'

  const roasStatus: NicheProjection['roasStatus'] =
    roasForComparison >= bench.kpi_thresholds.roas_good * 1.1 ? 'excelente' :
    roasForComparison >= bench.kpi_thresholds.roas_good * 0.75 ? 'bom' : 'atenção'

  const cplFmt     = `R$${adjustedCPLAvg}`
  const topChannel = bench.best_channels[0] || 'Meta Ads'
  const channel2   = bench.best_channels[1] || 'Google'

  const budgetCtx = budgetStatus === 'abaixo'
    ? `Budget de R$${budget.toLocaleString('pt-BR')}/mês está abaixo do mínimo (R$${bench.budget_floor.toLocaleString('pt-BR')}) para ${bench.name} — resultados serão limitados e o CPL tende a ficar acima de R$${bench.cpl_max}. Aumente para R$${bench.budget_ideal.toLocaleString('pt-BR')}/mês para ter previsibilidade.`
    : budgetStatus === 'mínimo'
    ? `Budget de R$${budget.toLocaleString('pt-BR')}/mês está no patamar mínimo para ${bench.name}. Funciona, mas o ideal é R$${bench.budget_ideal.toLocaleString('pt-BR')}/mês para otimização e escala.`
    : `Budget de R$${budget.toLocaleString('pt-BR')}/mês está bem posicionado para ${bench.name}.`

  const roasCtx = roasIsLtvBased
    ? `ROAS da campanha será ~${roas}× na primeira venda — normal para este segmento. Contabilizando o LTV do cliente (${bench.ltv_multiplier}× o ticket médio), o ROAS efetivo chega a ${roasLtv}×, que é o que move o negócio.`
    : `ROAS estimado de ${roas}× ${roas >= bench.kpi_thresholds.roas_good ? `está dentro do benchmark (${bench.kpi_thresholds.roas_good}× é considerado bom para ${bench.name})` : `está abaixo do benchmark de ${bench.kpi_thresholds.roas_good}× — foque em ${topChannel} com CPL abaixo de R$${bench.kpi_thresholds.cpl_good}`}.`

  const recommendation = `Com R$${budget.toLocaleString('pt-BR')}/mês em ${bench.name}, a projeção é de ${leadsMin}–${leadsMax} leads/mês a CPL médio de ${cplFmt}. ${budgetCtx} Canal principal recomendado: ${topChannel} + ${channel2}. ${roasCtx}`

  // Gráfico de projeção 6 meses: crescimento gradual de 0 → receita estabilizada
  const months = ['Mês 1', 'Mês 2', 'Mês 3', 'Mês 4', 'Mês 5', 'Mês 6']
  const rampFactors = [0.55, 0.70, 0.82, 0.91, 0.97, 1.00]
  const chartData = months.map((month, i) => ({
    month,
    projetado: Math.round(revenueMonth * rampFactors[i]),
    meta: Math.round(revenueMonth * (1 + i * 0.05)),  // meta cresce 5% ao mês
  }))

  // Funil baseado em taxas reais do benchmark
  const impressions = leadsMonth * 150  // CPM estimado: 1 lead a cada 150 impressões
  const clicks      = Math.round(impressions * 0.03)
  const leads       = leadsMonth
  const sales       = salesMonth

  const funnelData = [
    { label: 'Impressões',  value: impressions, pct: 100,  color: '#F0B429' },
    { label: 'Cliques',     value: clicks,      pct: Math.round((clicks / impressions) * 100),    color: '#A78BFA' },
    { label: 'Leads',       value: leads,       pct: Math.round((leads / impressions) * 100),     color: '#38BDF8' },
    { label: 'Vendas',      value: sales,       pct: Math.round((sales / impressions) * 100) || 1, color: '#22C55E' },
  ]

  return {
    cplAvg,
    leadsMonth,
    leadsMin,
    leadsMax,
    salesMonth,
    revenueMonth,
    revenueMin,
    revenueMax,
    roas,
    roasLtv,
    ltv,
    budgetStatus,
    budgetRecommended: bench.budget_ideal,
    roasStatus,
    roasIsLtvBased,
    recommendation,
    chartData,
    funnelData,
    // Inteligência avançada
    seasonalityIndex:   seasonCtx.current,
    seasonalityLabel:   seasonCtx.interpretation,
    seasonalityTrend:   seasonCtx.trend,
    adjustedCPLAvg,
    citySizeTier:       cityInfo.tier,
    citySizeModifier:   cityInfo.modifier,
    citySizeLabel:      cityInfo.label,
  }
}

// ── Benchmarks de funil por etapa ────────────────────────────────────────────
export interface FunnelBenchmarks {
  cpl_good: number
  cpl_bad: number
  ctr_meta: number
  ctr_google: number
  lp_cvr_meta: number
  lp_cvr_google: number
  qualification_rate: number
  closing_rate: number
  response_max_hours: number
  roas_good: number
}

export function getFunnelBenchmarks(benchKey: string): FunnelBenchmarks {
  const bench = BENCHMARKS[benchKey] || BENCHMARKS['outro']
  const isHighTicket  = ['imobiliario','juridico','financeiro','tecnologia','construcao','moveis_planejados','arquitetura_design','consultoria','marketing_agencia','eventos','franquias','corretor_imobiliario','protecao_patrimonial','rh_empresa','auditoria'].includes(benchKey)
  const isLocalService = ['barbearia','beleza','depilacao','harmonizacao','fisioterapia','lava_jato','lavanderia','autoescola','servicos_residenciais','padaria_cafeteria','restaurante','automotivo','pet'].includes(benchKey)
  const isMedical     = ['saude','odontologia','psicologia','nutricao','farmacia'].includes(benchKey) // fisioterapia removida (já em isLocalService)

  return {
    cpl_good:           bench.kpi_thresholds.cpl_good,
    cpl_bad:            bench.kpi_thresholds.cpl_bad,
    ctr_meta:           isHighTicket ? 0.8  : isLocalService ? 2.2 : isMedical ? 1.5 : 1.2,
    ctr_google:         isHighTicket ? 3.5  : isLocalService ? 5.5 : isMedical ? 5.0 : 4.0,
    lp_cvr_meta:        isHighTicket ? 4.0  : isLocalService ? 14.0 : isMedical ? 10.0 : 8.0,
    lp_cvr_google:      isHighTicket ? 6.0  : isLocalService ? 18.0 : isMedical ? 14.0 : 12.0,
    qualification_rate: isHighTicket ? 30.0 : isLocalService ? 68.0 : isMedical ? 50.0 : 45.0,
    closing_rate:       bench.cvr_lead_to_sale * 100,
    response_max_hours: isHighTicket ? 4    : isLocalService ? 1    : isMedical ? 2    : 2,
    roas_good:          bench.kpi_thresholds.roas_good,
  }
}

/** Formata benchmark como texto para injetar em prompts de IA */
export function getBenchmarkSummary(nicheRaw: string): string {
  const b = getBenchmark(nicheRaw)
  if (!b) return ''
  const angles = getCreativeAngles(nicheRaw)
  const key = Object.keys(BENCHMARKS).find(k => BENCHMARKS[k] === b) || 'outro'
  const seasonCtx = getSeasonalityContext(key)

  return `
BENCHMARK REAL — ${b.name} (Brasil 2024–2025):
- CPL médio: R$${b.cpl_min}–${b.cpl_max} | CPL ajustado sazonalmente: depende do mês (atual: índice ${seasonCtx.current.toFixed(2)})
- CPL por canal: ${Object.entries(b.cpl_by_channel).map(([k, v]) => `${k}: ${v}`).join(' | ')}
- Taxa de conversão lead→venda: ${(b.cvr_lead_to_sale * 100).toFixed(0)}%
- Ticket médio: R$${b.avg_ticket.toLocaleString('pt-BR')} | LTV: ${b.ltv_multiplier}× o ticket
- Melhores canais: ${b.best_channels.join(', ')}
- Budget mínimo: R$${b.budget_floor.toLocaleString('pt-BR')}/mês | Ideal: R$${b.budget_ideal.toLocaleString('pt-BR')}/mês
- ROAS bom: ≥ ${b.kpi_thresholds.roas_good}×
- Sazonalidade: ${seasonCtx.peakMonths.length ? `picos em ${seasonCtx.peakMonths.join('/')}` : 'demanda estável'} | ${seasonCtx.valleyMonths.length ? `vales em ${seasonCtx.valleyMonths.join('/')}` : ''}
- Insights: ${b.insights.join(' | ')}${angles ? `
- Criativos SATURADOS (evitar): ${angles.saturated.join(' | ')}
- Criativos em ALTA (testar): ${angles.trending.join(' | ')}
- Criativos SUBEXPLORADOS (oportunidade): ${angles.underexplored.join(' | ')}` : ''}
  `.trim()
}

export { BENCHMARKS }
