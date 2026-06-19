// lib/viewMode.ts — Sistema global de modos de visualização (Simplificado / Avançado)
// Usa o store Zustand existente como fonte de verdade (persiste em localStorage)

import { useAppStore } from '@/lib/store'

// ── Hook principal ────────────────────────────────────────────────────────────
export function useViewMode() {
  const mode    = useAppStore(s => s.dashboardMode)
  const setMode = useAppStore(s => s.setDashboardMode)
  return {
    mode,
    isSimple:   mode === 'simple',
    isAdvanced: mode === 'pro',
    setMode,
    toggle: () => setMode(mode === 'simple' ? 'pro' : 'simple'),
  }
}

// ── Traduções de métricas ─────────────────────────────────────────────────────
export const METRIC_LABELS: Record<'simple' | 'pro', Record<string, string>> = {
  simple: {
    CTR:        'Pessoas que clicaram no anúncio',
    CPC:        'Quanto custa cada clique',
    CPM:        'Custo para aparecer para mil pessoas',
    CPL:        'Quanto custa cada possível cliente',
    CPA:        'Quanto custa cada nova venda',
    ROAS:       'Retorno do dinheiro investido',
    Frequência: 'Vezes que a mesma pessoa viu o anúncio',
    Conversão:  'Ação importante feita pelo cliente',
    Criativo:   'Imagem, vídeo ou texto do anúncio',
    Leads:      'Novos contatos recebidos',
    Impressões: 'Pessoas alcançadas pelos anúncios',
    Alcance:    'Número de pessoas diferentes alcançadas',
    CTR_short:  'Cliques',
    CPL_short:  'Custo / Contato',
    ROAS_short: 'Retorno',
  },
  pro: {
    CTR:        'CTR',
    CPC:        'CPC',
    CPM:        'CPM',
    CPL:        'CPL',
    CPA:        'CPA',
    ROAS:       'ROAS',
    Frequência: 'Frequência',
    Conversão:  'Conversão',
    Criativo:   'Criativo',
    Leads:      'Leads',
    Impressões: 'Impressões',
    Alcance:    'Alcance',
    CTR_short:  'CTR',
    CPL_short:  'CPL',
    ROAS_short: 'ROAS',
  },
}

export function getMetricLabel(key: string, mode: 'simple' | 'pro'): string {
  return METRIC_LABELS[mode][key] ?? key
}

// ── Traduções de urgência / prioridade ───────────────────────────────────────
export const URGENCY_LABELS: Record<'simple' | 'pro', Record<string, string>> = {
  simple: {
    critica: 'Fazer agora',
    alta:    'Fazer esta semana',
    media:   'Acompanhar',
    baixa:   'Pode esperar',
  },
  pro: {
    critica: 'Crítica',
    alta:    'Alta',
    media:   'Média',
    baixa:   'Baixa',
  },
}

export function getUrgencyLabel(urgency: string, mode: 'simple' | 'pro'): string {
  return URGENCY_LABELS[mode][urgency] ?? urgency
}

// ── Traduções de status ───────────────────────────────────────────────────────
export const STATUS_DISPLAY: Record<'simple' | 'pro', Record<string, { label: string; icon: string }>> = {
  simple: {
    ok:      { label: 'Tudo bem',     icon: '✅' },
    atencao: { label: 'Atenção',      icon: '⚠️' },
    critico: { label: 'Precisa agir', icon: '🔴' },
  },
  pro: {
    ok:      { label: 'OK',       icon: '✓' },
    atencao: { label: 'Atenção',  icon: '⚠' },
    critico: { label: 'Crítico',  icon: '!' },
  },
}

// ── Labels das abas (sidebar) por modo ───────────────────────────────────────
export const TAB_LABELS_SIMPLE: Record<string, string> = {
  overview:     'Como Estou Indo',
  analise:      'Diagnóstico da Conta',
  diagnostic:   'Saúde do Negócio',
  funil:        'Jornada do Cliente',
  performance:  'Resultados',
  strategy:     'Plano de Crescimento',
  acoes:        'O Que Fazer Agora',
  cenarios:     'Projeções',
  anuncios:     'Meus Anúncios',
  audiencias:   'Meu Público',
  budget:       'Onde Investir Mais',
  channelmix:   'Melhores Canais',
  concorrentes: 'Minha Concorrência',
  cro:          'Melhorar Conversão',
  conteudo:     'Criar Anúncios',
  assets:       'Arquivos da Empresa',
  persona:      'Meu Cliente Ideal',
  inteligencia: 'Inteligência de Negócio',
  mercado:      'Pesquisa de Mercado',
  memory:       'Histórico de Aprendizado',
  workflow:     'Alertas Automáticos',
  relatorios:   'Relatórios',
  checklist:    'Próximos Passos',
  portal:       'Área do Cliente',
  campanha:     'Histórico de Campanhas',
  financeiro:   'Financeiro',
}

// ── Tooltips educativos para termos técnicos ──────────────────────────────────
export const METRIC_TOOLTIPS: Record<string, string> = {
  CTR:        'CTR mostra quantas pessoas clicaram no seu anúncio. Acima de 1% é considerado bom.',
  CPC:        'CPC é o valor pago por cada clique no anúncio. Quanto menor, mais barato está sendo atrair visitantes.',
  CPM:        'CPM é o custo para o anúncio aparecer 1.000 vezes. Indica o preço da visibilidade.',
  CPL:        'CPL é quanto custou cada lead (possível cliente). Compara com o benchmark do seu setor.',
  ROAS:       'ROAS mostra quanto você recebeu de volta para cada R$1 investido. Acima de 3× costuma ser lucrativo.',
  Frequência: 'Frequência alta (>3×) significa que as mesmas pessoas estão vendo seu anúncio repetidamente — pode indicar saturação.',
  Score:      'Score de saúde da conta calculado pela IA com base em métricas, alertas e qualidade das campanhas.',
}

// ── Helpers de exibição condicional ──────────────────────────────────────────

/** Retorna o texto certo baseado no modo atual */
export function modeText(mode: 'simple' | 'pro', simpleText: string, proText: string): string {
  return mode === 'simple' ? simpleText : proText
}

// ── Métricas essenciais por modo (esconde colunas técnicas no simples) ────────
// No modo simples, exibimos apenas as métricas que orientam decisão imediata.
export const ESSENTIAL_METRICS_SIMPLE = ['Investimento', 'Leads', 'CPL', 'ROAS']

/** Decide se uma coluna/métrica deve aparecer no modo atual */
export function shouldShowMetric(metricKey: string, mode: 'simple' | 'pro'): boolean {
  if (mode === 'pro') return true
  return ESSENTIAL_METRICS_SIMPLE.some(m => metricKey.toLowerCase().includes(m.toLowerCase()))
}

// ── Frase de contexto simplificado por tab (banner educativo) ─────────────────
export const TAB_SIMPLE_INTRO: Record<string, string> = {
  performance:  'Veja se o dinheiro investido está trazendo resultado.',
  anuncios:     'Acompanhe quais anúncios estão funcionando e quais estão gastando à toa.',
  audiencias:   'Entenda para quem seus anúncios estão sendo mostrados.',
  budget:       'Descubra onde vale a pena investir mais o seu dinheiro.',
  channelmix:   'Veja quais canais trazem mais clientes pelo menor custo.',
  financeiro:   'Acompanhe quanto você investe e quanto recebe de volta.',
  funil:        'Veja em qual etapa você está perdendo possíveis clientes.',
  diagnostic:   'Um raio-x da saúde do seu negócio em poucos segundos.',
  cenarios:     'Veja o quanto seu negócio pode crescer nos próximos meses.',
  cro:          'Descubra como transformar mais visitantes em clientes.',
  concorrentes: 'Veja o que seus concorrentes estão fazendo nos anúncios.',
  inteligencia: 'Descobertas e oportunidades que a IA encontrou para você.',
}

// ── Títulos/subtítulos das tabs por modo (heading interno de cada tela) ───────
// Cada entrada: [tituloSimples, subtituloSimples]. No modo 'pro' usa-se o original do componente.
export const TAB_HEADINGS_SIMPLE: Record<string, { title: string; subtitle: string }> = {
  funil:       { title: 'Onde você perde clientes',       subtitle: 'Veja em qual etapa da jornada as pessoas desistem de comprar.' },
  diagnostic:  { title: 'Saúde do seu negócio',           subtitle: 'Um raio-x simples de como sua empresa está e o que melhorar.' },
  performance: { title: 'Seus resultados',                subtitle: 'Quanto você investiu e o que recebeu de volta.' },
  cenarios:    { title: 'Quanto você pode crescer',       subtitle: 'Projeções de crescimento para os próximos meses.' },
  cro:         { title: 'Converter mais visitantes',      subtitle: 'Como transformar mais visitas em clientes de verdade.' },
  budget:      { title: 'Onde investir mais',             subtitle: 'Em quais campanhas vale a pena colocar mais dinheiro.' },
  channelmix:  { title: 'Seus melhores canais',           subtitle: 'Quais canais trazem mais clientes pelo menor custo.' },
  concorrentes:{ title: 'Seus concorrentes',              subtitle: 'O que outras empresas do seu ramo estão anunciando.' },
  audiencias:  { title: 'Quem é o seu público',           subtitle: 'O perfil das pessoas que seus anúncios devem alcançar.' },
}

// ── Rótulos de campos/seções técnicos → linguagem de negócio ──────────────────
export const FIELD_LABELS_SIMPLE: Record<string, string> = {
  'Impressões':            'Quantas pessoas viram o anúncio',
  'Cliques no anúncio':    'Quantas pessoas clicaram',
  'Cliques':               'Cliques no anúncio',
  'Leads gerados':         'Contatos recebidos',
  'Leads qualificados':    'Contatos com perfil de compra',
  'Canal principal':       'Onde você anunciou',
  'Investimento (R$)':     'Quanto você investiu (R$)',
  'CPL':                   'Custo por contato',
  'ROAS':                  'Retorno do investimento',
  'CTR':                   'Taxa de cliques',
}

/** Traduz um rótulo de campo para o modo atual (sem mudar nada no modo pro) */
export function getFieldLabel(label: string, mode: 'simple' | 'pro'): string {
  if (mode === 'pro') return label
  return FIELD_LABELS_SIMPLE[label] ?? label
}

/** Traduz análise técnica para linguagem humana */
export function translateAnalysis(mode: 'simple' | 'pro', analysis: string): string {
  if (mode === 'pro') return analysis

  // Substituições comuns
  return analysis
    .replace(/CTR/g, 'taxa de cliques')
    .replace(/CPC/g, 'custo por clique')
    .replace(/CPL/g, 'custo por lead')
    .replace(/ROAS/g, 'retorno do investimento')
    .replace(/CPM/g, 'custo de alcance')
    .replace(/frequência elevada/gi, 'mesmas pessoas vendo o anúncio repetidamente')
    .replace(/fadiga criativa/gi, 'anúncio perdendo força')
    .replace(/benchmark/gi, 'média do mercado')
    .replace(/criativo vencedor/gi, 'melhor anúncio')
    .replace(/sobreposição de público/gi, 'audiências concorrentes entre si')
    .replace(/conjunto de anúncios/gi, 'grupo de anúncios')
    .replace(/gargalo/gi, 'ponto de melhoria')
}
