// lib/nicheConfigs.ts — Camada central de configuração por nicho para o Modo Simplificado.
// Adapta linguagem, funil, métricas, recomendações, ações, resumo e IA por perfil.
// Sem if/else espalhado nas telas: tudo consome getNicheConfig().

import { useAppStore } from '@/lib/store'

export type NicheKey = 'generic' | 'health_insurance_broker' | 'optics_store'

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

// ── ÓTICAS ───────────────────────────────────────────────────────────────────
const optics_store: NicheConfig = {
  key: 'optics_store',
  label: 'Ótica',
  recommendedMode: 'simple',
  defaultTab: 'funil',
  language: {
    leadName: 'atendimento',
    saleName: 'venda de óculos',
    revenueName: 'faturamento',
    primaryChannel: 'WhatsApp',
  },
  funnelLabels: {
    impressions: 'Viram o anúncio',
    clicks:      'Clicaram para ver modelos',
    leads:       'Chamaram no WhatsApp',
    qualified:   'Tinham receita ou intenção real',
    quotes:      'Receberam orçamento',
    proposals:   'Visitaram ou provaram armações',
    sales:       'Compraram armação + lente',
  },
  emptyStateHints: [
    'Investimento em anúncios',
    'Cliques',
    'Atendimentos no WhatsApp',
    'Orçamentos enviados',
    'Visitas à loja',
    'Vendas de armação + lente',
    'Ticket médio por venda',
  ],
  mainMetrics: [
    'Custo por atendimento',
    'Custo por orçamento',
    'Custo por visita à loja',
    'Custo por venda',
    'Taxa de orçamento para venda',
    'Ticket médio',
  ],
  diagnostics: {
    lead_curioso:          'Você está recebendo contatos, mas muitos ainda não têm receita, urgência ou intenção real de compra.',
    demora_atendimento:    'O atendimento pode estar demorando e o cliente compara com outra ótica antes de você responder.',
    poucas_cotacoes:       'Muitos contatos chegam, mas poucos recebem uma proposta clara de armação + lente.',
    cotacao_sem_fechamento:'O problema parece estar depois do orçamento: a pessoa compara preço, garantia e estilo, mas não avança.',
    custo_venda_alto:      'Cada venda pode estar custando caro demais para o ticket médio da ótica.',
    falta_followup:        'Você pode estar perdendo vendas por não retomar quem recebeu orçamento e ficou de decidir.',
    dados_insuficientes:   'Faltam dados para saber se o gargalo está no anúncio, atendimento, orçamento ou visita à loja.',
  },
  recommendations: {
    geral: [
      'Separar campanhas por intenção: óculos de grau, óculos infantil, multifocal, lente de contato e óculos de sol',
      'Criar roteiro de WhatsApp para pedir receita, estilo desejado, faixa de preço e urgência',
      'Usar criativos com pessoas reais provando armações, não só foto de produto',
      'Criar combo claro de armação + lente + garantia',
      'Fazer follow-up de orçamento em 2h, 24h e 72h',
      'Medir visitas à loja e vendas vindas do WhatsApp',
      'Reativar clientes antigos para troca de grau e revisão de lente',
    ],
  },
  actionTemplates: {
    anuncio: [
      { id: 'opt_anuncio_1', title: 'Criar campanha separada para óculos de grau', why: 'Misturar óculos de grau, sol e lente de contato deixa o anúncio genérico e atrai curiosos.', impact: 'Alto', effort: 'Baixo', prazo: '24h', detail: 'Faça uma campanha focada em óculos de grau com chamada para WhatsApp: receita, estilo de armação e combo armação + lente.' },
      { id: 'opt_anuncio_2', title: 'Trocar foto de produto por prova real de armações', why: 'Cliente compra quando se imagina usando. Produto isolado parece catálogo e reduz intenção.', impact: 'Alto', effort: 'Médio', prazo: 'Esta semana', detail: 'Grave 5 vídeos curtos com pessoas diferentes provando armações. Teste formatos: clássico, moderno, infantil, trabalho/tela e solar.' },
    ],
    landing_page: [
      { id: 'opt_lp_1', title: 'Configurar WhatsApp com perguntas de triagem', why: 'Sem triagem, o atendimento vira conversa solta e poucos viram orçamento.', impact: 'Alto', effort: 'Baixo', prazo: 'Hoje', detail: 'Pergunte: já tem receita? É óculos de grau, sol ou lente? Qual faixa de preço? Prefere armação discreta ou marcante? Quando precisa retirar?' },
      { id: 'opt_lp_2', title: 'Criar mensagem pronta com combo e garantia', why: 'O cliente compara preço. Combo claro reduz dúvida e melhora fechamento.', impact: 'Médio', effort: 'Baixo', prazo: '24h', detail: 'Monte 2-3 opções: entrada, intermediária e premium. Inclua lente, garantia, ajuste grátis e prazo de entrega.' },
    ],
    qualificacao: [
      { id: 'opt_qual_1', title: 'Separar contato com receita de contato curioso', why: 'Quem já tem receita tende a comprar mais rápido e merece prioridade no atendimento.', impact: 'Alto', effort: 'Baixo', prazo: 'Hoje', detail: 'Marque cada atendimento como: com receita, sem receita, troca de grau, lente de contato, óculos infantil ou solar.' },
      { id: 'opt_qual_2', title: 'Registrar motivo de perda do orçamento', why: 'Sem motivo de perda você não sabe se o problema é preço, lente, estilo, prazo ou atendimento.', impact: 'Médio', effort: 'Baixo', prazo: 'Esta semana', detail: 'Crie motivos padrão: achou caro, comprou em rede grande, não gostou da armação, prazo, sem receita, sem retorno.' },
    ],
    fechamento: [
      { id: 'opt_fech_1', title: 'Fazer follow-up de orçamento em 2h, 24h e 72h', why: 'Muita venda de ótica fica parada porque o cliente foi comparar e ninguém retoma.', impact: 'Alto', effort: 'Baixo', prazo: '24h', detail: 'Envie uma mensagem curta com foto/modelo escolhido, benefício da lente, garantia e prazo. No terceiro contato, ofereça uma alternativa de valor menor.' },
      { id: 'opt_fech_2', title: 'Criar oferta de visita/prova na loja', why: 'Óculos é visual. Levar a pessoa para provar aumenta muito a chance de fechar.', impact: 'Médio', effort: 'Médio', prazo: 'Esta semana', detail: 'Convide para separar 3 armações no estilo dela e provar sem compromisso. Registre quem compareceu e quem comprou.' },
    ],
    velocidade: [
      { id: 'opt_vel_1', title: 'Responder WhatsApp em até 10 minutos no horário comercial', why: 'Quem procura ótica costuma falar com 2-3 lojas. Velocidade decide a primeira visita.', impact: 'Alto', effort: 'Baixo', prazo: 'Hoje', detail: 'Use respostas rápidas e deixe alguém responsável por novos leads. Meta: primeira resposta em até 10 minutos.' },
    ],
  },
  aiPrompts: {
    lead_curioso:           'Estou recebendo contatos para ótica, mas muitos não têm receita ou só perguntam preço. Como atrair pessoas com intenção real de comprar óculos?',
    cotacao_sem_fechamento: 'Envio orçamento de armação + lente, mas muita gente não fecha. Me dê um roteiro de follow-up e como contornar preço, garantia e comparação com grandes redes.',
    custo_venda_alto:       'O custo por venda da ótica está alto para o ticket médio. Como reduzir o CAC e aumentar o ticket de armação + lente?',
    geral:                  'Me ajude a vender mais em uma ótica. Quero um plano simples para melhorar anúncios, WhatsApp, orçamento, visita à loja e fechamento.',
  },
  complianceNote: 'Não prometa exame, diagnóstico, correção visual ou resultado médico se a ótica não tiver profissional habilitado. Use a receita do cliente apenas para atendimento e orçamento, com cuidado de privacidade.',
}

export const nicheConfigs: Record<NicheKey, NicheConfig> = {
  generic,
  health_insurance_broker,
  optics_store,
}

// Mapa de perfil do onboarding → nicho
const PROFILE_TO_NICHE: Record<string, NicheKey> = {
  health_insurance_broker: 'health_insurance_broker',
  optics_store: 'optics_store',
}

export function getNicheConfig(profileOrNiche?: string): NicheConfig {
  if (!profileOrNiche) return generic
  // aceita tanto a chave do nicho quanto a chave do perfil
  if (profileOrNiche in nicheConfigs) return nicheConfigs[profileOrNiche as NicheKey]
  const mapped = PROFILE_TO_NICHE[profileOrNiche]
  return mapped ? nicheConfigs[mapped] : generic
}

const PROFILE_GOAL_KEY = 'dashboard_profile_goal_onboarding'

// Detecta o nicho pelo texto do segmento de mercado (campo livre do wizard).
// Ex: "plano de saúde", "corretor de planos", "saúde suplementar" → health_insurance_broker
export function detectNicheFromText(text?: string): NicheKey {
  if (!text) return 'generic'
  const t = text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  if ((t.includes('plano') && t.includes('saude')) || (t.includes('corretor') && t.includes('saude')) || t.includes('saude suplementar') || t.includes('convenio medico')) {
    return 'health_insurance_broker'
  }
  if (t.includes('otica') || t.includes('optica') || t.includes('oculos') || t.includes('lente de contato') || t.includes('armacao')) {
    return 'optics_store'
  }
  return 'generic'
}

export function getCurrentNicheFromOnboarding(): NicheConfig {
  // 1) Perfil escolhido no onboarding "Quem é você?"
  try {
    const raw = localStorage.getItem(PROFILE_GOAL_KEY)
    if (raw) {
      const byProfile = getNicheConfig(JSON.parse(raw)?.profile)
      if (byProfile.key !== 'generic') return byProfile
    }
  } catch {}
  // 2) Texto do segmento de mercado do cliente (campo livre do wizard)
  try {
    const detected = detectNicheFromText(useAppStore.getState().clientData?.niche)
    if (detected !== 'generic') return nicheConfigs[detected]
  } catch {}
  return generic
}
