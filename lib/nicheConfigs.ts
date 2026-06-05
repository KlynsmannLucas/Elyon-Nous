// lib/nicheConfigs.ts — Camada central de configuração por nicho para o Modo Simplificado.
// Adapta linguagem, funil, métricas, recomendações, ações, resumo e IA por perfil.
// Sem if/else espalhado nas telas: tudo consome getNicheConfig().

export type NicheKey = 'generic' | 'health_insurance_broker'

export interface NicheAction {
  id: string
  title: string
  why: string
  impact: 'Alto' | 'Médio' | 'Baixo'
  effort: 'Alto' | 'Médio' | 'Baixo'
  prazo: 'Hoje' | '24h' | '48h' | 'Esta semana'
  detail: string
}

export interface NicheConfig {
  key: NicheKey
  label: string
  recommendedMode: 'simple' | 'advanced'
  defaultTab: string
  language: {
    leadName: string
    saleName: string
    revenueName: string
    primaryChannel: string
  }
  funnelLabels: {
    impressions: string
    clicks: string
    leads: string
    qualified: string
    quotes?: string
    proposals?: string
    sales: string
  }
  emptyStateHints: string[]
  mainMetrics: string[]
  diagnostics: Record<string, string>
  recommendations: Record<string, string[]>
  actionTemplates: Record<string, NicheAction[]>
  aiPrompts: Record<string, string>
  complianceNote?: string
}

// ── GENERIC (fallback — linguagem atual) ──────────────────────────────────────
const generic: NicheConfig = {
  key: 'generic',
  label: 'Negócio',
  recommendedMode: 'simple',
  defaultTab: 'diagnostic',
  language: {
    leadName: 'contato',
    saleName: 'venda',
    revenueName: 'faturamento',
    primaryChannel: 'WhatsApp',
  },
  funnelLabels: {
    impressions: 'Viram o anúncio',
    clicks:      'Clicaram',
    leads:       'Viraram contato',
    qualified:   'Com perfil de compra',
    sales:       'Vendas geradas',
  },
  emptyStateHints: [
    'Quanto investe por mês',
    'Quantos contatos recebe',
    'Quantas vendas faz',
    'Valor médio de cada venda',
  ],
  mainMetrics: ['Custo por contato', 'Custo por venda', 'Retorno do investimento'],
  diagnostics: {},
  recommendations: {},
  actionTemplates: {},
  aiPrompts: {},
}

// ── CORRETOR DE PLANO DE SAÚDE ────────────────────────────────────────────────
const health_insurance_broker: NicheConfig = {
  key: 'health_insurance_broker',
  label: 'Corretor de plano de saúde',
  recommendedMode: 'simple',
  defaultTab: 'funil',
  language: {
    leadName: 'contato',
    saleName: 'contrato fechado',
    revenueName: 'comissão',
    primaryChannel: 'WhatsApp',
  },
  funnelLabels: {
    impressions: 'Viram o anúncio',
    clicks:      'Clicaram para saber mais',
    leads:       'Chamaram no WhatsApp',
    qualified:   'Tinham perfil para contratar',
    quotes:      'Receberam cotação',
    proposals:   'Receberam proposta',
    sales:       'Fecharam o plano',
  },
  emptyStateHints: [
    'Investimento em anúncios',
    'Cliques',
    'Contatos no WhatsApp',
    'Contatos com perfil',
    'Cotações enviadas',
    'Propostas enviadas',
    'Contratos fechados',
    'Comissão média por contrato',
  ],
  mainMetrics: [
    'Custo por contato',
    'Custo por contato qualificado',
    'Custo por cotação',
    'Custo por venda',
    'Taxa de cotação para venda',
    'Comissão estimada',
  ],
  diagnostics: {
    lead_curioso:          'Você está recebendo contatos, mas poucos têm perfil para contratar.',
    demora_atendimento:    'O lead pode estar esfriando antes de receber atendimento.',
    poucas_cotacoes:       'Muitos contatos chegam, mas poucos recebem cotação.',
    cotacao_sem_fechamento:'O problema parece estar depois da cotação: as pessoas recebem preço, mas não avançam.',
    custo_venda_alto:      'Cada contrato pode estar custando caro demais para a comissão gerada.',
    falta_followup:        'Você pode estar perdendo vendas por falta de acompanhamento depois da cotação.',
    dados_insuficientes:   'Faltam dados para entender onde seus leads estão travando.',
  },
  recommendations: {
    geral: [
      'Criar roteiro de qualificação no WhatsApp',
      'Separar campanhas por tipo de plano: individual/familiar, MEI, PME, empresarial e odontológico',
      'Criar follow-up pós-cotação em 2h, 24h e 48h',
      'Criar comparativo simples entre opções',
      'Ajustar a promessa do anúncio para filtrar curiosos',
      'Medir o tempo médio de resposta',
      'Registrar o motivo de perda: preço, carência, rede, coparticipação, sem CNPJ, região não atendida',
    ],
  },
  actionTemplates: {
    // mapeado pelos mesmos "bottlenecks" do diagnose() do funil
    anuncio: [
      { id: 'his_anuncio_1', title: 'Ajustar a promessa do anúncio para filtrar curiosos', why: 'Anúncios genéricos atraem quem não tem perfil para contratar.', impact: 'Alto', effort: 'Baixo', prazo: '24h', detail: 'Deixe claro no anúncio para quem é o plano (ex: "para famílias", "para MEI/CNPJ", "empresarial"). Isso atrai contatos mais qualificados.' },
      { id: 'his_anuncio_2', title: 'Separar campanhas por tipo de plano', why: 'Misturar individual, MEI, PME e empresarial confunde o público e encarece o contato.', impact: 'Médio', effort: 'Médio', prazo: 'Esta semana', detail: 'Crie campanhas separadas: individual/familiar, MEI, PME, empresarial e odontológico — cada uma com sua mensagem.' },
    ],
    landing_page: [
      { id: 'his_lp_1', title: 'Criar uma mensagem inicial pronta no WhatsApp', why: 'As pessoas clicam mas não chamam — facilitar o primeiro contato aumenta os atendimentos.', impact: 'Alto', effort: 'Baixo', prazo: 'Hoje', detail: 'Configure uma saudação automática e uma primeira pergunta de qualificação (ex: "É para você, família ou empresa?").' },
      { id: 'his_lp_2', title: 'Medir o tempo médio de resposta', why: 'Lead de plano de saúde esfria rápido — resposta em minutos aumenta muito o fechamento.', impact: 'Alto', effort: 'Baixo', prazo: 'Hoje', detail: 'Acompanhe quanto tempo leva para responder cada contato. Meta: responder em até 15 minutos no horário comercial.' },
    ],
    qualificacao: [
      { id: 'his_qual_1', title: 'Criar roteiro de qualificação no WhatsApp', why: 'Você recebe contatos, mas muitos não têm perfil para contratar.', impact: 'Alto', effort: 'Baixo', prazo: '24h', detail: 'Pergunte logo no início: idade/quantidade de vidas, se tem CNPJ, cidade/região e se já tem plano. Isso separa quem realmente pode contratar.' },
      { id: 'his_qual_2', title: 'Registrar o motivo de perda', why: 'Sem saber por que perde (preço, carência, rede, região), não dá para melhorar.', impact: 'Médio', effort: 'Baixo', prazo: 'Esta semana', detail: 'Anote o motivo de cada contato que não fecha: preço, carência, rede, coparticipação, sem CNPJ, região não atendida.' },
    ],
    fechamento: [
      { id: 'his_fech_1', title: 'Criar follow-up pós-cotação em 2h, 24h e 48h', why: 'Muitos contratos se perdem por falta de acompanhamento depois da cotação.', impact: 'Alto', effort: 'Baixo', prazo: '24h', detail: 'Defina 3 retornos: 2h (tirar dúvidas), 24h (reforçar benefícios) e 48h (criar urgência leve, sem pressionar).' },
      { id: 'his_fech_2', title: 'Criar um comparativo simples entre opções', why: 'Quem recebe preço mas não decide costuma precisar de clareza para comparar.', impact: 'Médio', effort: 'Médio', prazo: 'Esta semana', detail: 'Monte um comparativo visual entre 2-3 opções (preço, rede, carência, coparticipação) para facilitar a decisão do contato.' },
    ],
    velocidade: [
      { id: 'his_vel_1', title: 'Responder os contatos no WhatsApp mais rápido', why: 'Lead de plano de saúde esfria em minutos — agilidade é decisiva.', impact: 'Alto', effort: 'Baixo', prazo: 'Hoje', detail: 'Ative notificações e tenha respostas rápidas prontas. Responder em até 15 min aumenta muito a chance de cotação.' },
    ],
  },
  aiPrompts: {
    lead_curioso:           'Estou recebendo contatos de plano de saúde no WhatsApp, mas poucos têm perfil para contratar. Como qualificar melhor e atrair o público certo?',
    cotacao_sem_fechamento: 'Meus contatos recebem cotação de plano de saúde mas não fecham. Me dê um passo a passo de follow-up e como contornar objeções de preço, carência e rede.',
    custo_venda_alto:       'O custo por contrato fechado de plano de saúde está alto para a comissão. Como reduzir o custo por venda?',
    geral:                  'Me ajude a vender mais planos de saúde. Quero um plano simples para melhorar atendimento no WhatsApp, qualificação e follow-up pós-cotação.',
  },
  complianceNote: 'Use apenas dados necessários para cotação e atendimento. Evite coletar informações sensíveis sem necessidade e deixe claro ao lead como os dados serão usados. Não prometa aprovação, preço final ou ausência de carência sem validação da operadora.',
}

export const nicheConfigs: Record<NicheKey, NicheConfig> = {
  generic,
  health_insurance_broker,
}

// Mapa de perfil do onboarding → nicho
const PROFILE_TO_NICHE: Record<string, NicheKey> = {
  health_insurance_broker: 'health_insurance_broker',
}

export function getNicheConfig(profileOrNiche?: string): NicheConfig {
  if (!profileOrNiche) return generic
  // aceita tanto a chave do nicho quanto a chave do perfil
  if (profileOrNiche in nicheConfigs) return nicheConfigs[profileOrNiche as NicheKey]
  const mapped = PROFILE_TO_NICHE[profileOrNiche]
  return mapped ? nicheConfigs[mapped] : generic
}

const PROFILE_GOAL_KEY = 'dashboard_profile_goal_onboarding'

export function getCurrentNicheFromOnboarding(): NicheConfig {
  try {
    const raw = localStorage.getItem(PROFILE_GOAL_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      return getNicheConfig(data?.profile)
    }
  } catch {}
  return generic
}
