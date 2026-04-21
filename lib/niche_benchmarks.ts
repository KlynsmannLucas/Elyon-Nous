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
    seasonality: ['Jan', 'Feb', 'Aug', 'Sep', 'Nov'],
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
  sobrancelha: 'beleza', micropigmentação: 'beleza', micropigmentacao: 'beleza',

  // ── Fisioterapia ──────────────────────────────────────────────────────────
  fisioterapia: 'fisioterapia', fisioterapeuta: 'fisioterapia', reabilitação: 'fisioterapia', reabilitacao: 'fisioterapia',

  // ── Farmácia ──────────────────────────────────────────────────────────────
  farmácia: 'farmacia', farmacia: 'farmacia', drogaria: 'farmacia', droga: 'farmacia',

  // ── Serviços Residenciais ─────────────────────────────────────────────────
  'serviços residenciais': 'servicos_residenciais', 'servicos residenciais': 'servicos_residenciais',
  limpeza: 'servicos_residenciais', jardinagem: 'servicos_residenciais', dedetização: 'servicos_residenciais',
  dedetizacao: 'servicos_residenciais', diarista: 'servicos_residenciais', faxina: 'servicos_residenciais',
  eletricista: 'servicos_residenciais', elétrica: 'servicos_residenciais', eletrica: 'servicos_residenciais',
  encanador: 'servicos_residenciais', encanamento: 'servicos_residenciais', hidráulica: 'servicos_residenciais', hidraulica: 'servicos_residenciais',
  serralheria: 'servicos_residenciais', serralheiro: 'servicos_residenciais',
  vidraçaria: 'servicos_residenciais', vidracaria: 'servicos_residenciais',

  // ── Arquitetura / Design ──────────────────────────────────────────────────
  'design de interiores': 'arquitetura_design', 'interiores': 'arquitetura_design',
  arquiteto: 'arquitetura_design', designer: 'arquitetura_design',

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
  construtora: 'construcao', corretor: 'imobiliario',

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
  academia: 'fitness', fitness: 'fitness', personal: 'fitness', pilates: 'fitness',
  crossfit: 'fitness', musculação: 'fitness', musculacao: 'fitness',

  // ── Tecnologia ────────────────────────────────────────────────────────────
  tech: 'tecnologia', tecnologia: 'tecnologia', software: 'tecnologia',
  saas: 'tecnologia', startup: 'tecnologia', sistema: 'tecnologia',

  // ── Pet ───────────────────────────────────────────────────────────────────
  pet: 'pet', 'veterinário': 'pet', veterinario: 'pet', petshop: 'pet',
  adestramento: 'pet', adestrador: 'pet', veterinária: 'pet', veterinaria: 'pet',

  // ── Turismo ───────────────────────────────────────────────────────────────
  turismo: 'turismo', viagem: 'turismo', hotel: 'turismo', pousada: 'turismo', pacote: 'turismo',

  // ── Restaurante ───────────────────────────────────────────────────────────
  restaurante: 'restaurante', food: 'restaurante', comida: 'restaurante',
  lanchonete: 'restaurante', pizzaria: 'restaurante', hamburger: 'restaurante', hamburguer: 'restaurante',
  marmita: 'restaurante', marmitaria: 'restaurante', delivery: 'restaurante', refeição: 'restaurante', refeicao: 'restaurante',

  // ── Consultoria ───────────────────────────────────────────────────────────
  consultoria: 'consultoria', coach: 'consultoria', mentor: 'consultoria',

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
  buffet: 'eventos', entretenimento: 'eventos', animação: 'eventos', animacao: 'eventos',

  // ── Móveis Planejados ─────────────────────────────────────────────────────
  marcenaria: 'moveis_planejados', planejados: 'moveis_planejados', marceneiro: 'moveis_planejados',
  'móveis': 'loja_moveis', moveis: 'loja_moveis',  // genérico → loja_moveis

  // ── E-commerce genérico (lojas sem niche específico) ─────────────────────
  ecommerce: 'ecommerce', 'e-commerce': 'ecommerce', marketplace: 'ecommerce',
  varejo: 'ecommerce', produto: 'ecommerce',
  papelaria: 'ecommerce', gráfica: 'ecommerce', grafica: 'ecommerce', impressão: 'ecommerce', impressao: 'ecommerce',
  loja: 'ecommerce',   // fallback genérico para "loja" sem modificador específico

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
  fotografia_video:    [0.85, 0.85, 0.90, 0.90, 0.95, 0.90, 0.85, 0.85, 0.90, 1.05, 1.35, 1.45],
  seguranca_privada:   [1.25, 0.95, 0.90, 0.85, 0.85, 0.85, 0.85, 0.90, 0.90, 1.25, 1.05, 0.90],
  padaria_cafeteria:   [0.95, 0.90, 0.90, 0.90, 0.95, 1.20, 0.95, 0.90, 0.90, 0.95, 1.00, 1.30],
  depilacao:           [0.85, 0.85, 0.85, 0.85, 0.90, 0.85, 0.80, 0.85, 0.95, 1.35, 1.50, 1.20],
  harmonizacao:        [0.90, 0.90, 1.20, 0.90, 0.85, 0.85, 0.85, 0.90, 0.95, 1.05, 1.30, 1.40],
  autoescola:          [1.40, 1.10, 0.90, 0.85, 0.85, 0.85, 1.25, 1.00, 0.85, 0.85, 0.90, 0.90],
  lavanderia:          [1.20, 1.00, 0.90, 0.90, 0.95, 1.25, 1.15, 0.95, 0.90, 0.90, 0.95, 1.00],
  lava_jato:           [1.20, 1.15, 1.10, 0.90, 0.80, 0.75, 0.75, 0.80, 0.90, 0.95, 1.10, 1.35],
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
  const isHighTicket  = ['imobiliario','juridico','financeiro','tecnologia','construcao','moveis_planejados','arquitetura_design','consultoria','marketing_agencia','eventos'].includes(benchKey)
  const isLocalService = ['barbearia','beleza','depilacao','harmonizacao','fisioterapia','lava_jato','lavanderia','autoescola','servicos_residenciais','padaria_cafeteria','restaurante','automotivo','pet'].includes(benchKey)
  const isMedical     = ['saude','odontologia','psicologia','nutricao','farmacia','fisioterapia'].includes(benchKey)

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
