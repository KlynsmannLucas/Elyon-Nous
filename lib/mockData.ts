// lib/mockData.ts — Todos os dados mockados do ELYON Dashboard
// Separados dos componentes para facilitar substituição por dados reais

// ── Perfil do cliente ──────────────────────────────────────────────────────────
export const clientProfile = {
  niche: 'Odontologia Estética',
  clientName: 'Dr. Rafael Cunha',
  period: 'Abr 2026',
}

// ── KPIs Overview ─────────────────────────────────────────────────────────────
export const overviewKPIs = [
  {
    label: 'MRR',
    value: 'R$44.800',
    trend: +18.4,
    sub: 'receita mensal recorrente',
    color: '#F0B429',
  },
  {
    label: 'Leads / mês',
    value: '340+',
    trend: +12.0,
    sub: 'média últimos 30 dias',
    color: '#22C55E',
  },
  {
    label: 'ROAS',
    value: '4.2×',
    trend: +5.3,
    sub: 'retorno sobre investimento',
    color: '#A78BFA',
  },
  {
    label: 'CPL',
    value: 'R$63',
    trend: -8.1,
    sub: 'custo por lead (↓ melhor)',
    color: '#38BDF8',
  },
]

// ── Gráfico de Receita ─────────────────────────────────────────────────────────
export const revenueChartData = [
  { month: 'Out', real: 28000, meta: 32000 },
  { month: 'Nov', real: 31500, meta: 34000 },
  { month: 'Dez', real: 29800, meta: 35000 },
  { month: 'Jan', real: 36200, meta: 37000 },
  { month: 'Fev', real: 39100, meta: 40000 },
  { month: 'Mar', real: 42600, meta: 42000 },
  { month: 'Abr', real: 44800, meta: 45000 },
]

// ── Funil de Conversão ─────────────────────────────────────────────────────────
export const funnelData = [
  { label: 'Impressões',    value: 142000, pct: 100, color: '#F0B429' },
  { label: 'Cliques',       value: 8520,   pct: 60,  color: '#FFD166' },
  { label: 'Leads',         value: 340,    pct: 40,  color: '#22C55E' },
  { label: 'Oportunidades', value: 102,    pct: 25,  color: '#A78BFA' },
  { label: 'Clientes',      value: 34,     pct: 12,  color: '#38BDF8' },
]

// ── Canais de Marketing ───────────────────────────────────────────────────────
export const channelCards = [
  { name: 'Meta Ads',  icon: '📱', cpl: 58,  leads: 180, roas: 4.8, status: 'Ativo'    },
  { name: 'Google',    icon: '🔍', cpl: 72,  leads: 95,  roas: 3.9, status: 'Ativo'    },
  { name: 'YouTube',   icon: '▶️', cpl: 91,  leads: 45,  roas: 3.1, status: 'Pausado'  },
  { name: 'Orgânico',  icon: '🌿', cpl: 12,  leads: 20,  roas: 8.2, status: 'Crescendo'},
]

// ── Audiência ─────────────────────────────────────────────────────────────────
export const audienceProfile = {
  metrics: [
    { label: 'Idade',              value: '28–45 anos',     icon: '👤' },
    { label: 'Gênero',            value: '72% feminino',   icon: '⚤'  },
    { label: 'Renda',             value: 'R$5K–15K/mês',  icon: '💰' },
    { label: 'Localização',       value: 'Capitais SP/RJ', icon: '📍' },
    { label: 'Tempo até comprar', value: '3–7 dias',       icon: '⏱' },
    { label: 'ROAS benchmark',    value: '3.8× (nicho)',   icon: '⚡' },
    { label: 'CPL benchmark',     value: 'R$55–90',        icon: '🎯' },
  ],
  pains: [
    'Vergonha do sorriso',
    'Dentes amarelados',
    'Dente faltando',
    'Aparelho metálico',
  ],
  motivations: [
    'Autoestima e confiança',
    'Entrevistas de emprego',
    'Casamento / formatura',
    'Saúde bucal preventiva',
  ],
  hooks: [
    'Antes / depois real',
    'X sessões para resultado',
    'Sem dor, sem desconforto',
    'Parcelamento em 12×',
  ],
  objections: [
    'Preço muito alto',
    'Medo de sentir dor',
    'Já tentei antes sem resultado',
    'Difícil achar dentista bom',
  ],
}

// ── Estratégia ────────────────────────────────────────────────────────────────
export const strategyData = {
  totalBudget: 'R$9.200/mês',
  activeChannels: 3,
  aiInsight: 'Meta Ads com criativos de antes/depois apresentam CPL 34% menor que campanhas genéricas neste nicho. Concentre 55% do budget neste canal.',
  channels: [
    { name: 'Meta Ads',  priority: '🥇 Alta',   budget: 'R$5.100', cpl: 'R$58', status: 'Ativo'   },
    { name: 'Google',    priority: '🥈 Média',  budget: 'R$2.800', cpl: 'R$72', status: 'Ativo'   },
    { name: 'YouTube',   priority: '🥉 Baixa',  budget: 'R$1.300', cpl: 'R$91', status: 'Pausado' },
  ],
}

// ── Intelligence ──────────────────────────────────────────────────────────────
export const intelligenceData = {
  stats: [
    { label: 'Insights gerados', value: '24',   color: '#F0B429' },
    { label: 'Aplicados',        value: '18',   color: '#22C55E' },
    { label: 'Impacto estimado', value: '+28%', color: '#A78BFA' },
  ],
  insights: [
    {
      icon: '🎯',
      title: 'Segmentação por comportamento aumenta CVR',
      category: 'Audiência',
      categoryColor: '#A78BFA',
      description: 'Campanhas segmentadas por comportamento de busca ("clarear dentes") convertem 2.3× mais que interesse genérico.',
    },
    {
      icon: '📸',
      title: 'Criativos de antes/depois dominam o nicho',
      category: 'Criativo',
      categoryColor: '#F0B429',
      description: 'Análise de 340 criativos mostra CPL 34% menor com imagens reais de pacientes. Evite imagens de banco.',
    },
    {
      icon: '⏰',
      title: 'Melhor horário: 19h–22h (dias úteis)',
      category: 'Timing',
      categoryColor: '#22C55E',
      description: 'Leads gerados nesse intervalo têm 41% mais chance de agendar consulta em menos de 48h.',
    },
    {
      icon: '💬',
      title: 'WhatsApp como canal de nurturing reduz CAC',
      category: 'Canal',
      categoryColor: '#38BDF8',
      description: 'Fluxo automatizado pós-lead via WhatsApp reduz CAC em 22% e aumenta taxa de comparecimento para 78%.',
    },
    {
      icon: '📊',
      title: 'Campanha PMAX subutilizada no nicho',
      category: 'Oportunidade',
      categoryColor: '#FF4D4D',
      description: 'Somente 12% das clínicas usam PMAX. Early adopters estão capturando leads com CPL 28% abaixo da média.',
    },
  ],
}

// ── Growth / Projeção ─────────────────────────────────────────────────────────
export const growthData = {
  scenarios: [
    {
      name: 'Conservador',
      budget: 'R$1.500/mês',
      leads: 35,
      revenue: 'R$12.600',
      roas: 2.8,
      recommended: false,
      color: '#94A3B8',
    },
    {
      name: 'Moderado',
      budget: 'R$4.500/mês',
      leads: 110,
      revenue: 'R$44.800',
      roas: 4.2,
      recommended: true,
      color: '#F0B429',
    },
    {
      name: 'Agressivo',
      budget: 'R$11.500/mês',
      leads: 280,
      revenue: 'R$114.000',
      roas: 6.1,
      recommended: false,
      color: '#A78BFA',
    },
  ],
  projectionData: [
    { month: 'Mês 1', conservador: 12600, moderado: 44800, agressivo: 114000 },
    { month: 'Mês 2', conservador: 14200, moderado: 52300, agressivo: 138000 },
    { month: 'Mês 3', conservador: 15800, moderado: 61100, agressivo: 158000 },
    { month: 'Mês 4', conservador: 17100, moderado: 70400, agressivo: 178000 },
    { month: 'Mês 5', conservador: 18900, moderado: 82000, agressivo: 204000 },
  ],
}

// ── Performance ───────────────────────────────────────────────────────────────
export const performanceData = {
  stats: [
    { label: 'Impressões',  value: '142K',    sub: 'últimos 30 dias', color: '#F0B429' },
    { label: 'CTR',         value: '5.98%',   sub: 'acima da média',  color: '#22C55E' },
    { label: 'Leads',       value: '340',     sub: 'mês corrente',    color: '#A78BFA' },
    { label: 'Gasto total', value: 'R$9.200', sub: 'budget mensal',   color: '#38BDF8' },
  ],
  creatives: [
    { name: 'Antes/depois — Clareamento',  channel: 'Meta',   score: 94, status: 'Top performer', statusColor: '#22C55E' },
    { name: 'Depoimento Dra. Ana — Implante', channel: 'Meta', score: 87, status: 'Em destaque',  statusColor: '#F0B429' },
    { name: 'Promoção lentes de contato',  channel: 'Google', score: 71, status: 'Estável',       statusColor: '#38BDF8' },
    { name: 'Roteiro YouTube — Medo dor',  channel: 'YouTube',score: 63, status: 'Monitorando',   statusColor: '#A78BFA' },
    { name: 'Parcelamento 12× sem juros',  channel: 'Meta',   score: 55, status: 'Otimizar',      statusColor: '#FF4D4D' },
  ],
}

// ── Números da landing page ───────────────────────────────────────────────────
export const landingMetrics = [
  { value: '340+',   label: 'Leads/mês em média'       },
  { value: '4.2×',   label: 'ROAS médio por cliente'   },
  { value: 'R$1.2M', label: 'Mercado endereçado'       },
  { value: '20+',    label: 'Setores atendidos'        },
]
