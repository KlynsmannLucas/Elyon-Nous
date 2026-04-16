// lib/niche_content.ts — Conteúdo por nicho: audiência, insights e calendário de marketing

export interface NicheAudience {
  age: string
  gender: string
  income: string
  location: string
  buyTime: string
  pains: string[]
  motivations: string[]
  hooks: string[]
  objections: string[]
}

export interface NicheInsight {
  icon: string
  title: string
  category: string
  categoryColor: string
  description: string
  steps?: string[]   // passos de aplicação — opcionais, gerados por nicho
}

export interface NicheCreative {
  name: string
  channel: string
  score: number
  status: string
  statusColor: string
}

export interface CalendarEvent {
  month: string
  monthNum: number  // 1–12
  actions: {
    type: 'invest' | 'retain' | 'creative' | 'pause' | 'scale' | 'test'
    label: string
    detail: string
    color: string
  }[]
}

export interface NicheContent {
  audience: NicheAudience
  insights: NicheInsight[]
  creatives: NicheCreative[]
  calendar: CalendarEvent[]
}

// ── Calendário base (meses do ano com eventos fixos de mktg digital) ──────────
function buildCalendar(
  peakMonths: number[],    // ex: [1, 7]
  lowMonths: number[],     // ex: [3, 9]
  creativeRotateMonths: number[] = [2, 5, 8, 11],
  nicheSpecific: Partial<Record<number, string>> = {}
): CalendarEvent[] {
  const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return MONTHS.map((month, i) => {
    const num = i + 1
    const actions: CalendarEvent['actions'] = []

    if (peakMonths.includes(num)) {
      actions.push({
        type: 'scale',
        label: 'Escalar budget',
        detail: 'Pico de demanda do nicho — aumente investimento 40–80%',
        color: '#22C55E',
      })
    }
    if (lowMonths.includes(num)) {
      actions.push({
        type: 'retain',
        label: 'Foco em retenção',
        detail: 'Baixa temporada — priorize reengajamento e base existente',
        color: '#A78BFA',
      })
    }
    if (creativeRotateMonths.includes(num)) {
      actions.push({
        type: 'creative',
        label: 'Renovar criativos',
        detail: 'Fadiga de anúncio: troque criativos que rodam há +45 dias',
        color: '#F0B429',
      })
    }
    if ([1].includes(num)) {
      actions.push({
        type: 'test',
        label: 'A/B de audiência',
        detail: 'Início de ano: teste novos públicos e reset de aprendizado',
        color: '#38BDF8',
      })
    }
    if ([11, 12].includes(num)) {
      actions.push({
        type: 'invest',
        label: 'Pré-Black Friday / Natal',
        detail: 'Aqueça públicos e liste leads antes do pico de compra',
        color: '#FFD166',
      })
    }
    if (nicheSpecific[num]) {
      actions.push({
        type: 'invest',
        label: nicheSpecific[num]!,
        detail: 'Ação específica do nicho para este período',
        color: '#F0B429',
      })
    }
    if (actions.length === 0) {
      actions.push({
        type: 'test',
        label: 'Otimizar campanhas',
        detail: 'Analise CPL e ROAS por canal — pause o que não converte',
        color: '#64748B',
      })
    }
    return { month, monthNum: num, actions }
  })
}

// ── Conteúdo por nicho ────────────────────────────────────────────────────────
const NICHE_CONTENT: Record<string, NicheContent> = {

  odontologia: {
    audience: {
      age: '28–45 anos', gender: '68% feminino', income: 'R$5K–15K/mês',
      location: 'Capitais e cidades médias', buyTime: '3–7 dias',
      pains: ['Vergonha do sorriso', 'Dentes amarelados', 'Dente faltando', 'Aparelho visível'],
      motivations: ['Autoestima e confiança', 'Emprego e entrevistas', 'Casamento / formatura', 'Saúde preventiva'],
      hooks: ['Antes/depois real', 'Resultado em X sessões', 'Sem dor, com resultado', 'Parcelamento em 12×'],
      objections: ['Preço alto', 'Medo de dor', 'Já tentei sem resultado', 'Difícil confiar no dentista'],
    },
    insights: [
      { icon: '📸', title: 'Criativos antes/depois dominam o nicho', category: 'Criativo', categoryColor: '#F0B429', description: 'Análise de 340 criativos: CPL 34% menor com fotos reais de pacientes vs imagens de banco.' },
      { icon: '⏰', title: 'Horário 19h–22h aumenta agendamento em 41%', category: 'Timing', categoryColor: '#22C55E', description: 'Leads captados nesse intervalo têm 41% mais chance de comparecer à consulta em 48h.' },
      { icon: '💬', title: 'WhatsApp pós-lead reduz CAC em 22%', category: 'Canal', categoryColor: '#38BDF8', description: 'Fluxo automático de WhatsApp aumenta comparecimento para 78% vs 54% sem nurturing.' },
      { icon: '🎯', title: 'PMAX subutilizado — CPL 28% menor', category: 'Oportunidade', categoryColor: '#FF4D4D', description: 'Apenas 12% das clínicas usam PMAX. Early adopters capturam leads com custo bem abaixo da média.' },
      { icon: '📊', title: 'Segmentação por procedimento converte 2.3×', category: 'Audiência', categoryColor: '#A78BFA', description: 'Campanhas segmentadas por interesse ("clareamento dental") convertem 2.3× mais que interesse genérico.' },
    ],
    creatives: [
      { name: 'Antes/depois — Clareamento', channel: 'Meta', score: 94, status: 'Top performer', statusColor: '#22C55E' },
      { name: 'Depoimento real — Implante', channel: 'Meta', score: 87, status: 'Em destaque', statusColor: '#F0B429' },
      { name: 'Promoção lentes de porcelana', channel: 'Google', score: 71, status: 'Estável', statusColor: '#38BDF8' },
      { name: 'Roteiro YouTube — Sem dor', channel: 'YouTube', score: 63, status: 'Monitorando', statusColor: '#A78BFA' },
      { name: 'Parcelamento 12× sem juros', channel: 'Meta', score: 55, status: 'Otimizar', statusColor: '#FF4D4D' },
    ],
    calendar: buildCalendar([12, 3], [6, 8], [2, 5, 9], { 12: 'Dezembro: Presente de Natal — sorriso novo', 3: 'Março: Verão acabou — foco em autoestima' }),
  },

  financeiro: {
    audience: {
      age: '25–55 anos', gender: '52% masculino', income: 'R$2K–8K/mês',
      location: 'Nacional (concentração SP, RJ, MG)', buyTime: '7–21 dias',
      pains: ['Dívidas acumuladas', 'Score de crédito baixo', 'Juros abusivos', 'Renda insuficiente'],
      motivations: ['Sair das dívidas', 'Comprar imóvel', 'Guardar reserva', 'Financiar negócio'],
      hooks: ['Aprovação em minutos', 'Sem consulta ao SPC/SERASA', 'Taxa menor que o banco', 'Portabilidade fácil'],
      objections: ['Medo de golpe', 'Já fui recusado', 'Taxa muito alta', 'Processo complicado'],
    },
    insights: [
      { icon: '🏦', title: 'Portabilidade de crédito converte 3× em Jan', category: 'Sazonalidade', categoryColor: '#22C55E', description: 'Janeiro é o pico de busca por crédito — dívidas do fim de ano geram demanda reprimida.' },
      { icon: '🎥', title: 'Webinar educativo converte 3× vs anúncio direto', category: 'Criativo', categoryColor: '#F0B429', description: 'Educar antes de vender gera confiança — requisito no setor financeiro regulado.' },
      { icon: '⚠️', title: 'Disclaimers obrigatórios em todos os criativos', category: 'Compliance', categoryColor: '#FF4D4D', description: 'CVM e BACEN exigem disclaimers de risco. Criativos sem eles são bloqueados pelo Meta.' },
      { icon: '📱', title: 'WhatsApp é o canal de fechamento #1', category: 'Canal', categoryColor: '#38BDF8', description: 'No setor financeiro, leads que vão ao WhatsApp têm CVR 4× maior que ligações telefônicas.' },
      { icon: '🎯', title: 'Depoimentos de clientes reduzem CPL em 28%', category: 'Prova social', categoryColor: '#A78BFA', description: 'Mostre histórias de clientes que resolveram problemas similares. Especificidade = confiança.' },
    ],
    creatives: [
      { name: 'Depoimento: saí das dívidas em 6 meses', channel: 'Meta', score: 91, status: 'Top performer', statusColor: '#22C55E' },
      { name: 'Simulação: taxa vs banco tradicional', channel: 'Google', score: 84, status: 'Em destaque', statusColor: '#F0B429' },
      { name: 'Webinar: organize sua vida financeira', channel: 'YouTube', score: 76, status: 'Estável', statusColor: '#38BDF8' },
      { name: 'Aprovação em 2 minutos — sem burocracia', channel: 'Meta', score: 61, status: 'Monitorando', statusColor: '#A78BFA' },
      { name: 'Portabilidade: pague menos hoje', channel: 'Google', score: 48, status: 'Otimizar', statusColor: '#FF4D4D' },
    ],
    calendar: buildCalendar([1, 7], [4, 10], [3, 6, 9, 12], { 1: 'Janeiro: pico de crédito — escale ao máximo', 12: 'Dezembro: 13° salário ativo — crédito e investimento' }),
  },

  saude: {
    audience: {
      age: '30–55 anos', gender: '65% feminino', income: 'R$4K–12K/mês',
      location: 'Capitais e regiões metropolitanas', buyTime: '5–14 dias',
      pains: ['Dores crônicas', 'Cansaço e baixa imunidade', 'Dificuldade de dormir', 'Peso acima do ideal'],
      motivations: ['Qualidade de vida', 'Mais energia no dia a dia', 'Prevenção de doenças', 'Longevidade'],
      hooks: ['Consulta online sem filas', 'Resultado em X semanas', 'Método comprovado', 'Sem efeitos colaterais'],
      objections: ['Preço do plano', 'Já consultei médico sem resultado', 'Desconfiança de tratamento online', 'Falta de tempo'],
    },
    insights: [
      { icon: '📱', title: 'TikTok emerge com CPL 40% menor para 25–40 anos', category: 'Canal', categoryColor: '#38BDF8', description: 'Conteúdo educativo sobre saúde em TikTok tem custo por lead significativamente menor que Meta.', steps: ['Crie uma conta no TikTok for Business separada do perfil pessoal', 'Produza 3–5 vídeos curtos (30–60s) com dicas de saúde do seu nicho específico', 'Lance campanha com objetivo "Geração de leads" com orçamento de teste de R$30/dia', 'Compare CPL do TikTok vs Meta após 15 dias e redirecione budget para o melhor'] },
      { icon: '📸', title: 'Antes/depois com dados (exames) converte melhor', category: 'Criativo', categoryColor: '#F0B429', description: 'Mostrar evolução com números (colesterol, peso, energia) é mais convincente que imagens genéricas.', steps: ['Peça autorização por escrito ao paciente para usar dados anonimizados', 'Produza um carrossel: Situação inicial (com números) → Tratamento → Resultado final', 'Use gráficos simples mostrando a evolução — não precisa ser profissional', 'Teste esse formato vs foto genérica e meça qual tem maior taxa de clique'] },
      { icon: '⚖️', title: 'CFM proíbe promessas de cura — foco em bem-estar', category: 'Compliance', categoryColor: '#FF4D4D', description: 'Use linguagem de "melhoria de qualidade de vida" — promessas de cura são bloqueadas.', steps: ['Revise todos os anúncios ativos: substitua "cura", "elimina" e "resolve" por "auxilia", "melhora" e "contribui"', 'Evite depoimentos com resultado específico de saúde ("perdi 20kg em 30 dias")', 'Inclua "Resultados individuais podem variar" em qualquer caso de sucesso', 'Consulte o CFM/CRM da sua especialidade para orientações específicas por área'] },
      { icon: '📅', title: 'Janeiro e setembro são picos de +65%', category: 'Sazonalidade', categoryColor: '#22C55E', description: 'Resolução de ano novo e volta das férias geram picos expressivos de busca por saúde.', steps: ['Aumente budget em 50–80% nos meses de Janeiro e Setembro', 'Prepare criativos temáticos: "Novo ano, nova saúde" (Jan) e "Volte das férias melhor" (Set)', 'Lance campanhas 2 semanas antes do pico para já acumular dados de otimização', 'Reduza budget em Fevereiro e Julho (férias escolares) para compensar os picos'] },
      { icon: '💬', title: 'Conteúdo pré-consulta reduz no-show em 35%', category: 'Retenção', categoryColor: '#A78BFA', description: 'Envio de conteúdo educativo entre agendamento e consulta aumenta taxa de comparecimento.', steps: ['Configure sequência automática de WhatsApp: confirmação imediata + lembrete 48h antes + lembrete 2h antes', 'Envie um conteúdo curto relacionado ao motivo da consulta 24h antes', 'Inclua endereço + link do Maps + instruções de preparo se necessário', 'Após consulta, envie follow-up de satisfação — isso aumenta indicações em 40%'] },
    ],
    creatives: [
      { name: 'Jornada do paciente: antes e depois real', channel: 'Meta', score: 89, status: 'Top performer', statusColor: '#22C55E' },
      { name: 'Consulta online em 24h — sem fila', channel: 'Google', score: 82, status: 'Em destaque', statusColor: '#F0B429' },
      { name: 'Rotina de saúde em 30 dias', channel: 'TikTok', score: 77, status: 'Estável', statusColor: '#38BDF8' },
      { name: '5 sinais de que seu corpo precisa de ajuda', channel: 'YouTube', score: 68, status: 'Monitorando', statusColor: '#A78BFA' },
      { name: 'Primeira consulta grátis', channel: 'Meta', score: 52, status: 'Otimizar', statusColor: '#FF4D4D' },
    ],
    calendar: buildCalendar([1, 9], [5, 7], [3, 6, 10], { 1: 'Janeiro: Resolução de ano novo — saúde em alta', 9: 'Setembro: Volta ao trabalho — check-up preventivo' }),
  },

  educacao: {
    audience: {
      age: '18–40 anos', gender: '55% feminino', income: 'R$2K–10K/mês',
      location: 'Nacional (online)', buyTime: '3–14 dias',
      pains: ['Estagnação de carreira', 'Falta de qualificação', 'Baixo salário', 'Falta de tempo para estudar'],
      motivations: ['Promoção no emprego', 'Mudar de área', 'Empreender', 'Aprender nova habilidade'],
      hooks: ['Comece hoje, no seu tempo', 'Certificado reconhecido', 'Método direto ao resultado', 'Alunos que já conseguiram'],
      objections: ['Não tenho tempo', 'Já fiz curso e não aprendi', 'Preço alto', 'Não sei se vou conseguir'],
    },
    insights: [
      { icon: '📊', title: 'Prova de resultado real converte 3× mais', category: 'Criativo', categoryColor: '#F0B429', description: 'Prints de alunos com salário novo, promoção ou vaga conquistada são os criativos #1 do setor.' },
      { icon: '🚀', title: 'Lançamentos com lista quente CVR 4× maior', category: 'Estratégia', categoryColor: '#22C55E', description: 'Base aquecida por 7–14 dias antes do lançamento multiplica conversão vs lançamento frio.' },
      { icon: '🎯', title: 'Nicho ultra-específico reduz CPL em 40%', category: 'Audiência', categoryColor: '#A78BFA', description: '"Curso de Excel para RH" converte muito mais que "Curso de Excel". Seja específico.' },
      { icon: '📱', title: 'TikTok e YouTube geram leads de menor custo', category: 'Canal', categoryColor: '#38BDF8', description: 'Conteúdo gratuito educativo funciona como funil para o curso pago neste nicho.' },
      { icon: '📅', title: 'Janeiro e agosto são os maiores picos do ano', category: 'Sazonalidade', categoryColor: '#FF4D4D', description: 'Início de ano e volta das férias concentram 55% das matrículas — concentre 60% do budget.' },
    ],
    creatives: [
      { name: 'Print: aluno conseguiu R$8K/mês depois do curso', channel: 'Meta', score: 93, status: 'Top performer', statusColor: '#22C55E' },
      { name: 'Aula gratuita: aprenda X em 30 minutos', channel: 'YouTube', score: 85, status: 'Em destaque', statusColor: '#F0B429' },
      { name: 'Vaga: acesso por R$X por mês', channel: 'Meta', score: 72, status: 'Estável', statusColor: '#38BDF8' },
      { name: 'Stories: dia a dia de quem largou o emprego', channel: 'Instagram', score: 66, status: 'Monitorando', statusColor: '#A78BFA' },
      { name: 'Última chamada — vagas encerram amanhã', channel: 'Meta', score: 54, status: 'Otimizar', statusColor: '#FF4D4D' },
    ],
    calendar: buildCalendar([1, 8], [4, 10], [3, 6, 9, 12], { 1: 'Janeiro: maior mês do ano — lançamento obrigatório', 8: 'Agosto: 2° pico — volta das férias' }),
  },

  imobiliario: {
    audience: {
      age: '28–50 anos', gender: '54% masculino', income: 'R$8K–30K/mês',
      location: 'SP, RJ, MG, PR, RS', buyTime: '30–120 dias',
      pains: ['Aluguel caro', 'Imóvel não valorizou', 'Dificuldade de financiamento', 'Medo de escolha errada'],
      motivations: ['Sair do aluguel', 'Investimento seguro', 'Primeiro imóvel', 'Localização estratégica'],
      hooks: ['Condições especiais de lançamento', 'Tour virtual disponível', 'Simulação sem compromisso', 'Documentação simplificada'],
      objections: ['Renda insuficiente para financiar', 'Momento errado para comprar', 'Receio de construtora', 'Burocracia'],
    },
    insights: [
      { icon: '⚡', title: 'Resposta em < 1h aumenta CVR em 80%', category: 'Processo', categoryColor: '#22C55E', description: 'Imóvel é decisão emocional — lead esfria rápido. Resposta imediata é o principal diferencial.' },
      { icon: '🎥', title: 'Tour virtual 360° qualifica e filtra leads', category: 'Criativo', categoryColor: '#F0B429', description: 'Reduz visitas presenciais de baixa qualidade e aumenta o nível de interesse médio do lead.' },
      { icon: '🎯', title: 'Retargeting de visitantes converte 5× mais', category: 'Audiência', categoryColor: '#A78BFA', description: 'Quem visitou o site ou viu o vídeo do imóvel está a 1 passo da decisão — não abandone esse público.' },
      { icon: '📊', title: 'CPL alto é normal — ROI compensa muito', category: 'Estratégia', categoryColor: '#38BDF8', description: 'Um CPL de R$200 que gera 1 venda de R$500K tem ROAS de 2.500×. Não otimize só para CPL baixo.' },
      { icon: '📅', title: 'Março e setembro são picos de busca', category: 'Sazonalidade', categoryColor: '#FF4D4D', description: 'Lançamentos e feiras de imóveis nesses meses amplificam resultados de campanhas.' },
    ],
    creatives: [
      { name: 'Tour virtual: conheça sem sair de casa', channel: 'Meta', score: 92, status: 'Top performer', statusColor: '#22C55E' },
      { name: 'Simulação: saia do aluguel por R$X/mês', channel: 'Google', score: 85, status: 'Em destaque', statusColor: '#F0B429' },
      { name: 'Lançamento exclusivo — primeiras unidades', channel: 'Meta', score: 74, status: 'Estável', statusColor: '#38BDF8' },
      { name: 'Valorização: R$X% ao ano na região', channel: 'YouTube', score: 62, status: 'Monitorando', statusColor: '#A78BFA' },
      { name: 'FGTS como entrada — sabia que é possível?', channel: 'Meta', score: 57, status: 'Otimizar', statusColor: '#FF4D4D' },
    ],
    calendar: buildCalendar([3, 9], [1, 7], [2, 5, 8, 11], { 3: 'Março: maior mês de lançamentos do ano', 9: 'Setembro: feiras de imóveis — alta intenção' }),
  },

  ecommerce: {
    audience: {
      age: '20–45 anos', gender: '60% feminino', income: 'R$2K–8K/mês',
      location: 'Nacional (foco SP, RJ, MG)', buyTime: '1–7 dias',
      pains: ['Produto caro nas lojas físicas', 'Frete caro', 'Medo de não receber', 'Tamanho errado'],
      motivations: ['Preço menor', 'Conveniência', 'Variedade maior', 'Entrega rápida'],
      hooks: ['Frete grátis acima de R$X', 'Desconto de X% no Pix', 'Entrega em X dias úteis', 'Devolução garantida'],
      objections: ['Site não é confiável', 'Já comprei e não recebi', 'Não posso devolver', 'Foto diferente do produto'],
    },
    insights: [
      { icon: '🛒', title: 'Google PMAX supera Shopping isolado em 30%', category: 'Canal', categoryColor: '#22C55E', description: 'PMAX com feed de produtos bem configurado está gerando ROAS 30% maior que campanhas de Shopping em 2025.' },
      { icon: '📱', title: 'TikTok Shop cresce 200% — sea o primeiro', category: 'Oportunidade', categoryColor: '#F0B429', description: 'A vantagem do pioneiro em TikTok Shop no Brasil ainda é grande — custo de aquisição muito menor.' },
      { icon: '🔄', title: 'Recuperação de carrinho recupera 15% das vendas', category: 'Estratégia', categoryColor: '#38BDF8', description: 'Email + WhatsApp 1h, 6h e 24h após abandono de carrinho é o fluxo com maior ROI do e-commerce.' },
      { icon: '📅', title: 'Black Friday: CPL sobe 80%, conversão triplica', category: 'Sazonalidade', categoryColor: '#FF4D4D', description: 'Planeje orçamento dobrado em novembro. A margem compensa o CPL maior.' },
      { icon: '🤳', title: 'UGC (conteúdo de clientes) reduz CPL em 35%', category: 'Criativo', categoryColor: '#A78BFA', description: 'Vídeos de unboxing e uso real do produto convertem muito mais que fotos profissionais.' },
    ],
    creatives: [
      { name: 'Unboxing real — cliente filmou', channel: 'TikTok', score: 95, status: 'Top performer', statusColor: '#22C55E' },
      { name: 'Desconto relâmpago — 4 horas', channel: 'Meta', score: 88, status: 'Em destaque', statusColor: '#F0B429' },
      { name: 'Comparativo: nossa loja vs concorrente', channel: 'Google', score: 73, status: 'Estável', statusColor: '#38BDF8' },
      { name: 'Frete grátis + brinde acima de R$X', channel: 'Meta', score: 65, status: 'Monitorando', statusColor: '#A78BFA' },
      { name: 'Produto do mês em destaque', channel: 'Shopping', score: 51, status: 'Otimizar', statusColor: '#FF4D4D' },
    ],
    calendar: buildCalendar([11, 12], [2, 8], [3, 6, 9], { 11: 'Novembro: Black Friday — orçamento dobrado', 12: 'Dezembro: Natal — ticket médio sobe 40%' }),
  },

  juridico: {
    audience: {
      age: '30–60 anos', gender: '50% cada', income: 'R$5K–20K/mês',
      location: 'SP, RJ, BH e capitais estaduais', buyTime: '7–30 dias',
      pains: ['Processo trabalhista aberto', 'Acidente de trânsito', 'Divórcio complicado', 'Problema com herança'],
      motivations: ['Recuperar direito', 'Evitar multa / pena', 'Resolver rápido', 'Assessoria confiável'],
      hooks: ['Consulta gratuita', 'Só cobra se ganhar', 'Especialista em X', 'Mais de X casos resolvidos'],
      objections: ['Advogado caro', 'Processo demora', 'Não sei se tenho caso', 'Já tentei e perdi'],
    },
    insights: [
      { icon: '🔍', title: 'Google Search capta intenção alta de compra', category: 'Canal', categoryColor: '#22C55E', description: 'Quem busca "advogado trabalhista SP" já tem o problema — é o lead mais qualificado possível.' },
      { icon: '📚', title: 'Conteúdo educativo é a única publicidade possível', category: 'Compliance', categoryColor: '#FF4D4D', description: 'OAB proíbe publicidade direta. Artigos e vídeos educativos são o único caminho legal e eficaz.' },
      { icon: '🎯', title: 'Ultra-especialização reduz CPL em 50%', category: 'Estratégia', categoryColor: '#F0B429', description: '"Advogado de direito previdenciário" converte muito mais que "advogado geral" mesmo para casos gerais.' },
      { icon: '🎥', title: 'YouTube com Q&A jurídico gera leads orgânicos', category: 'Criativo', categoryColor: '#A78BFA', description: 'Responder dúvidas comuns em vídeo curto posiciona como autoridade e atrai leads qualificados.' },
      { icon: '💬', title: 'WhatsApp como CTA principal aumenta conversão', category: 'Canal', categoryColor: '#38BDF8', description: 'CTA direto para WhatsApp (não formulário) reduz atrito e aumenta taxa de resposta em 3×.' },
    ],
    creatives: [
      { name: 'Você tem direito a isso e não sabe', channel: 'Google', score: 90, status: 'Top performer', statusColor: '#22C55E' },
      { name: 'Fui demitido — o que fazer em 5 passos', channel: 'YouTube', score: 83, status: 'Em destaque', statusColor: '#F0B429' },
      { name: 'Consulta gratuita — fale com especialista', channel: 'Meta', score: 74, status: 'Estável', statusColor: '#38BDF8' },
      { name: 'Já ganhamos R$X em indenizações', channel: 'Meta', score: 67, status: 'Monitorando', statusColor: '#A78BFA' },
      { name: 'Prazo está acabando — entre em contato', channel: 'Google', score: 55, status: 'Otimizar', statusColor: '#FF4D4D' },
    ],
    calendar: buildCalendar([3, 10], [1, 7], [2, 5, 8, 11], { 3: 'Março: declaração IR gera demanda jurídica fiscal', 10: 'Outubro: rescisões de fim de ano a caminho' }),
  },

  beleza: {
    audience: {
      age: '20–45 anos', gender: '80% feminino', income: 'R$2K–10K/mês',
      location: 'Capitais e cidades médias', buyTime: '1–5 dias',
      pains: ['Cabelo danificado', 'Pele opaca ou com manchas', 'Celulite e gordura localizada', 'Unhas fracas'],
      motivations: ['Autoestima', 'Ocasião especial', 'Cuidado pessoal rotineiro', 'Sentir-se bem'],
      hooks: ['Resultado visível na primeira sessão', 'Antes/depois de clientes reais', 'Desconto para primeira visita', 'Agendamento online fácil'],
      objections: ['Preço caro', 'Resultado dura pouco', 'Prefiro salão de sempre', 'Medo de reação alérgica'],
    },
    insights: [
      { icon: '🎥', title: 'Reels de transformação têm alcance 5× maior', category: 'Criativo', categoryColor: '#F0B429', description: 'Vídeos mostrando o processo + resultado final geram alcance orgânico muito acima da média do nicho.' },
      { icon: '🤝', title: 'Programa de indicação reduz CAC em 35%', category: 'Retenção', categoryColor: '#22C55E', description: 'Cliente indicado converte 2× mais rápido e tem LTV 60% maior. Crie incentivo para indicações.' },
      { icon: '📅', title: 'Dia das Mães e Natal são os maiores picos', category: 'Sazonalidade', categoryColor: '#A78BFA', description: 'Inicie campanhas 3 semanas antes — agendamentos lotam rápido nessas datas.' },
      { icon: '📱', title: 'TikTok supera Instagram em CPL para 18–35', category: 'Canal', categoryColor: '#38BDF8', description: 'Formato short video de resultados de beleza tem performance crescente e CPL ainda baixo no TikTok.' },
      { icon: '💬', title: 'Reengajamento de clientes inativos: 45% retornam', category: 'Retenção', categoryColor: '#FF4D4D', description: 'Mensagem personalizada no WhatsApp para clientes que não visitaram em 60+ dias tem taxa de retorno alta.' },
    ],
    creatives: [
      { name: 'Antes/depois — mechas loiro platinado', channel: 'Instagram', score: 92, status: 'Top performer', statusColor: '#22C55E' },
      { name: 'Transformação completa em 2h — timelapse', channel: 'TikTok', score: 86, status: 'Em destaque', statusColor: '#F0B429' },
      { name: 'Pacote Dia das Mães com desconto', channel: 'Meta', score: 75, status: 'Estável', statusColor: '#38BDF8' },
      { name: '1ª visita com X% off — agende agora', channel: 'Meta', score: 64, status: 'Monitorando', statusColor: '#A78BFA' },
      { name: 'Conheça nossa linha de produtos', channel: 'Google', score: 49, status: 'Otimizar', statusColor: '#FF4D4D' },
    ],
    calendar: buildCalendar([5, 12], [3, 8], [2, 6, 9], { 5: 'Maio: Dia das Mães — maior pico do ano', 12: 'Dezembro: Natal e formaturas — agenda cheia' }),
  },

  fitness: {
    audience: {
      age: '18–45 anos', gender: '55% feminino', income: 'R$2K–8K/mês',
      location: 'Capitais e cidades médias', buyTime: '1–7 dias',
      pains: ['Sedentarismo', 'Peso acima do ideal', 'Falta de motivação', 'Academia muito cara'],
      motivations: ['Perder peso', 'Ganhar massa muscular', 'Qualidade de vida', 'Estética e autoestima'],
      hooks: ['Resultado em 30 dias comprovado', 'Trial gratuito de 7 dias', 'Profissional acompanha', 'Horários flexíveis'],
      objections: ['Falta de tempo', 'Já desisti antes', 'Mensalidade cara', 'Não gosto de academia'],
    },
    insights: [
      { icon: '📅', title: 'Janeiro e agosto dobram a demanda', category: 'Sazonalidade', categoryColor: '#22C55E', description: 'Concentre 60% do budget nesses meses. Resolução de ano novo e preparação para o verão.' },
      { icon: '🎁', title: 'Trial de 7 dias converte 3× vs desconto', category: 'Estratégia', categoryColor: '#F0B429', description: 'Deixar o lead "experimentar" reduz risco percebido e gera comprometimento emocional.' },
      { icon: '📱', title: 'TikTok gera leads de personal online baratos', category: 'Canal', categoryColor: '#38BDF8', description: 'Conteúdo de treino em casa ou dica de exercício funciona como funil de entrada para planos.' },
      { icon: '🔄', title: 'Retenção: 60% cancelam antes de 3 meses', category: 'Retenção', categoryColor: '#FF4D4D', description: 'Acompanhamento ativo nos primeiros 90 dias é decisivo para o LTV — o churn acontece cedo.' },
      { icon: '📊', title: 'Fotos de progressão de alunos convertem mais', category: 'Criativo', categoryColor: '#A78BFA', description: 'Resultados reais de alunos, com timeline de semanas, são o tipo de criativo com mais prova social.' },
    ],
    creatives: [
      { name: 'Transformação: -12kg em 90 dias — aluno real', channel: 'Meta', score: 94, status: 'Top performer', statusColor: '#22C55E' },
      { name: 'Trial gratuito — comece hoje mesmo', channel: 'Meta', score: 87, status: 'Em destaque', statusColor: '#F0B429' },
      { name: 'Treino de 20 min que muda o corpo — dica grátis', channel: 'TikTok', score: 79, status: 'Estável', statusColor: '#38BDF8' },
      { name: 'Plano anual com desconto de X%', channel: 'Google', score: 62, status: 'Monitorando', statusColor: '#A78BFA' },
      { name: 'Motivação: aluno que desistiu e voltou', channel: 'Instagram', score: 53, status: 'Otimizar', statusColor: '#FF4D4D' },
    ],
    calendar: buildCalendar([1, 8], [4, 10], [3, 6, 9, 12], { 1: 'Janeiro: pico máximo — resolução de ano novo', 8: 'Agosto: preparação para o verão' }),
  },

  tecnologia: {
    audience: {
      age: '25–45 anos', gender: '65% masculino', income: 'R$5K–25K/mês',
      location: 'SP, SC, RS, RJ (hubs de tech)', buyTime: '14–60 dias',
      pains: ['Processo manual que consume tempo', 'Erros humanos em operações', 'Integração de sistemas', 'Custo de TI elevado'],
      motivations: ['Automatizar e escalar', 'Reduzir custos operacionais', 'Tomar decisão com dados', 'Vantagem competitiva'],
      hooks: ['Trial gratuito 14 dias', 'Integra com o que você já usa', 'ROI comprovado em X semanas', 'Suporte especializado incluso'],
      objections: ['Migração complicada', 'Time não vai adotar', 'Já temos solução', 'Preço acima do budget'],
    },
    insights: [
      { icon: '🆓', title: 'Trial gratuito converte 4× vs demo agendada', category: 'Estratégia', categoryColor: '#22C55E', description: 'Deixar o cliente testar sozinho elimina a fricção de vendas. Free trial é o maior conversor de SaaS.' },
      { icon: '💼', title: 'LinkedIn essencial para decisores B2B', category: 'Canal', categoryColor: '#38BDF8', description: 'Segmentação por cargo (CEO, CTO, Gerente de TI) no LinkedIn traz leads com autoridade de compra.' },
      { icon: '📊', title: 'Case studies com ROI reduzem ciclo de venda', category: 'Criativo', categoryColor: '#F0B429', description: '"Empresa X economizou R$200K em 6 meses" é mais convincente que qualquer funcionalidade.' },
      { icon: '📅', title: 'CAC payback < 12 meses é referência saudável', category: 'Indicador', categoryColor: '#A78BFA', description: 'No SaaS, o CAC pode ser alto pois o LTV (MRR × meses de retenção) compensa no longo prazo.' },
      { icon: '🤝', title: 'Parcerias com consultorias aceleram vendas', category: 'Canal', categoryColor: '#FF4D4D', description: 'Consultores que implementam o sistema são os melhores canais de indicação — invista nessa relação.' },
    ],
    creatives: [
      { name: 'Case: empresa economizou R$180K em 6 meses', channel: 'LinkedIn', score: 91, status: 'Top performer', statusColor: '#22C55E' },
      { name: 'Trial grátis 14 dias — sem cartão', channel: 'Google', score: 84, status: 'Em destaque', statusColor: '#F0B429' },
      { name: 'Demo: veja o sistema em 3 minutos', channel: 'YouTube', score: 76, status: 'Estável', statusColor: '#38BDF8' },
      { name: 'Webinar: como automatizar X processo', channel: 'LinkedIn', score: 67, status: 'Monitorando', statusColor: '#A78BFA' },
      { name: 'Comparativo: antes e depois de adotar o sistema', channel: 'Meta', score: 54, status: 'Otimizar', statusColor: '#FF4D4D' },
    ],
    calendar: buildCalendar([3, 9], [1, 7], [2, 5, 8, 11], { 3: 'Março: planejamento de budget de TI — bom momento para pitch', 9: 'Setembro: Q4 planning — decisões de compra de software' }),
  },

  marketing_agencia: {
    audience: {
      age: '28–50 anos', gender: '55% masculino', income: 'R$8K–30K/mês',
      location: 'SP, RJ, SC, MG', buyTime: '14–45 dias',
      pains: ['Resultados de mktg inconsistentes', 'Equipe interna não tem expertise', 'ROAS abaixo do esperado', 'Falta de estratégia clara'],
      motivations: ['Escalar faturamento', 'Ter previsibilidade de leads', 'Liberar tempo do dono', 'Vantagem sobre concorrentes'],
      hooks: ['Diagnóstico gratuito', 'Resultados comprovados no seu nicho', 'Contrato por performance', 'Time especializado'],
      objections: ['Já tive agência ruim', 'Preço do serviço', 'Quanto tempo para ver resultado', 'Não vou perder o controle'],
    },
    insights: [
      { icon: '📊', title: 'Case com ROI real é o principal gatilho de venda', category: 'Criativo', categoryColor: '#F0B429', description: 'Mostrar resultados concretos de clientes do mesmo nicho é o argumento de venda #1 para agências.' },
      { icon: '🔍', title: 'Proposta de diagnóstico gratuito converte 3×', category: 'Estratégia', categoryColor: '#22C55E', description: 'Diagnóstico de campanhas atuais do prospect gera valor imediato e posiciona a agência como especialista.' },
      { icon: '💼', title: 'LinkedIn gera leads B2B com autoridade de compra', category: 'Canal', categoryColor: '#38BDF8', description: 'Donos e diretores de marketing que tomam a decisão de contratar agência estão no LinkedIn.' },
      { icon: '🎯', title: 'Nichar em 1–2 segmentos reduz CPL em 40%', category: 'Posicionamento', categoryColor: '#A78BFA', description: '"Agência especialista em odontologia" converte 3× mais que "agência full service".' },
      { icon: '🤝', title: 'Contrato de performance gera confiança imediata', category: 'Oferta', categoryColor: '#FF4D4D', description: 'Garantia baseada em resultados elimina a objeção de risco e qualifica prospects com budget real.' },
    ],
    creatives: [
      { name: 'Case: cliente faturou R$450K com R$15K investidos', channel: 'LinkedIn', score: 93, status: 'Top performer', statusColor: '#22C55E' },
      { name: 'Diagnóstico gratuito — veja onde está perdendo leads', channel: 'Meta', score: 86, status: 'Em destaque', statusColor: '#F0B429' },
      { name: 'Webinar: como escalar para R$500K/mês', channel: 'YouTube', score: 77, status: 'Estável', statusColor: '#38BDF8' },
      { name: 'Nossa metodologia explicada em 3 minutos', channel: 'LinkedIn', score: 65, status: 'Monitorando', statusColor: '#A78BFA' },
      { name: 'Contrato por performance — sem risco', channel: 'Meta', score: 58, status: 'Otimizar', statusColor: '#FF4D4D' },
    ],
    calendar: buildCalendar([1, 9], [6, 12], [3, 6, 9], { 1: 'Janeiro: empresas planejando mktg do ano — pico de contratação', 9: 'Setembro: Q4 — empresas acelerando resultados' }),
  },

  consultoria: {
    audience: {
      age: '30–55 anos', gender: '60% masculino', income: 'R$10K–50K/mês',
      location: 'SP, RJ, MG, RS', buyTime: '30–90 dias',
      pains: ['Negócio estagnado', 'Equipe sem direção', 'Margens apertando', 'Concorrência crescente'],
      motivations: ['Crescimento sustentável', 'Eficiência operacional', 'Planejamento estratégico', 'Saída para M&A'],
      hooks: ['Diagnóstico gratuito de 1h', 'Case do seu setor', 'Resultado garantido no contrato', 'Implementação inclusa'],
      objections: ['Já tentamos sem resultado', 'Muito caro', 'Demora para ver retorno', 'Não é o momento'],
    },
    insights: [
      { icon: '🎥', title: 'Case studies em vídeo convertem 60% mais', category: 'Criativo', categoryColor: '#F0B429', description: 'CEO contando o resultado da consultoria em vídeo tem credibilidade 3× maior que depoimento escrito.' },
      { icon: '💼', title: 'LinkedIn domina a geração de leads B2B', category: 'Canal', categoryColor: '#22C55E', description: 'Donos e diretores que decidem contratar consultoria estão no LinkedIn. CPL pode ser alto mas CVR compensa.' },
      { icon: '🎁', title: 'Diagnóstico gratuito: isca de conversão #1', category: 'Estratégia', categoryColor: '#38BDF8', description: '1h de diagnóstico gera valor real para o prospect e demonstra competência antes de qualquer venda.' },
      { icon: '📧', title: 'Nurturing por email é essencial no ciclo longo', category: 'Canal', categoryColor: '#A78BFA', description: 'Ciclo de 30–90 dias exige sequência de emails com conteúdo de valor para manter o lead aquecido.' },
      { icon: '📅', title: 'Janeiro e setembro são os maiores picos', category: 'Sazonalidade', categoryColor: '#FF4D4D', description: 'Planejamento de início de ano e de Q4 são os momentos onde empresas mais buscam consultoria.' },
    ],
    creatives: [
      { name: 'CEO conta: crescemos 180% em 18 meses', channel: 'LinkedIn', score: 92, status: 'Top performer', statusColor: '#22C55E' },
      { name: 'Diagnóstico gratuito — identifique gargalos', channel: 'Meta', score: 84, status: 'Em destaque', statusColor: '#F0B429' },
      { name: 'Masterclass: como estruturar para crescer', channel: 'YouTube', score: 76, status: 'Estável', statusColor: '#38BDF8' },
      { name: 'Os 3 erros que impedem seu negócio de crescer', channel: 'LinkedIn', score: 69, status: 'Monitorando', statusColor: '#A78BFA' },
      { name: 'Resultado garantido ou devolvemos', channel: 'Meta', score: 57, status: 'Otimizar', statusColor: '#FF4D4D' },
    ],
    calendar: buildCalendar([1, 9], [6, 12], [3, 6, 9, 12], { 1: 'Janeiro: empresas planejando o ano — momento ideal', 9: 'Setembro: Q4 planning — urgência de resultados' }),
  },

  restaurante: {
    audience: {
      age: '22–50 anos', gender: '55% feminino', income: 'R$3K–15K/mês',
      location: 'Raio de 5–10km do restaurante', buyTime: '0–2 dias',
      pains: ['Poucas opções de qualidade perto', 'Atendimento ruim', 'Entrega que demora', 'Cardápio que não renova'],
      motivations: ['Praticidade', 'Experiência gastronômica', 'Reunião social / família', 'Comida de qualidade'],
      hooks: ['Avaliação 5 estrelas no Google', 'Entrega em X min', 'Chef premiado', 'Cardápio com fotos reais'],
      objections: ['Preço alto', 'Já sei onde como', 'Delivery demora', 'Porcão pequena'],
    },
    insights: [
      { icon: '📍', title: 'Google Meu Negócio gera 40% dos clientes', category: 'Canal', categoryColor: '#22C55E', description: 'Perfil otimizado com fotos, horários e respostas a avaliações é o canal mais rentável do setor.' },
      { icon: '🎥', title: 'Reels de preparo de pratos têm alcance 6× maior', category: 'Criativo', categoryColor: '#F0B429', description: 'Mostrar o chef preparando um prato especial gera 6× mais visualizações e compartilhamentos.' },
      { icon: '💰', title: 'LTV altíssimo — cliente fiel visita anos', category: 'Estratégia', categoryColor: '#38BDF8', description: 'Um cliente que gasta R$90/visita e vem 2× por mês por 3 anos vale R$6.480. CAC de R$50 tem ROI de 128×.' },
      { icon: '🤝', title: 'Programa de fidelidade retém 45% a mais', category: 'Retenção', categoryColor: '#A78BFA', description: 'Cartão de fidelidade digital (app ou WhatsApp) aumenta frequência de visita em 35%.' },
      { icon: '⭐', title: 'Avaliações no Google: 1 estrela a mais = +18% clientes', category: 'Reputação', categoryColor: '#FF4D4D', description: 'Peça avaliação ativamente após cada visita. A nota média no Google é o principal fator de decisão.' },
    ],
    creatives: [
      { name: 'Chef preparando prato especial — bastidores', channel: 'Instagram', score: 95, status: 'Top performer', statusColor: '#22C55E' },
      { name: 'Prato do dia com desconto exclusivo app', channel: 'Meta', score: 87, status: 'Em destaque', statusColor: '#F0B429' },
      { name: 'Avaliações reais + ambiente aconchegante', channel: 'Google', score: 75, status: 'Estável', statusColor: '#38BDF8' },
      { name: 'Promoção happy hour — toda semana', channel: 'Instagram', score: 66, status: 'Monitorando', statusColor: '#A78BFA' },
      { name: 'Pedido mínimo com frete grátis', channel: 'Meta', score: 52, status: 'Otimizar', statusColor: '#FF4D4D' },
    ],
    calendar: buildCalendar([12, 6], [2, 8], [3, 7, 10], { 12: 'Dezembro: festas de fim de ano — bufê e eventos', 6: 'Junho: São João e datas sazonais' }),
  },

  construcao: {
    audience: {
      age: '30–55 anos', gender: '60% masculino', income: 'R$8K–25K/mês',
      location: 'SP, RJ, MG e capitais regionais', buyTime: '14–60 dias',
      pains: ['Reforma atrasada e cara', 'Mão de obra não confiável', 'Orçamento estourado', 'Obra interrompida'],
      motivations: ['Valorizar imóvel', 'Conforto da família', 'Negócio precisando de reforma', 'Novo empreendimento'],
      hooks: ['Orçamento em 24h', 'Prazo garantido em contrato', 'Fotos de obras entregues', 'Referências verificáveis'],
      objections: ['Pedreiro sumiu antes', 'Medo de extrapolar orçamento', 'Não sei qual empresa contratar', 'Demora na entrega'],
    },
    insights: [
      { icon: '📸', title: 'Fotos de obras entregues convertem 3× mais', category: 'Criativo', categoryColor: '#F0B429', description: 'Portfólio real com antes/depois de reformas concluídas gera mais confiança que renderizações 3D.' },
      { icon: '⏱', title: 'Orçamento rápido é o principal diferencial', category: 'Processo', categoryColor: '#22C55E', description: 'Empresas que respondem em < 2h têm taxa de conversão 3× maior. Velocidade = vantagem competitiva.' },
      { icon: '🔍', title: 'Google Search com localização capta intenção alta', category: 'Canal', categoryColor: '#38BDF8', description: '"Empresa de reforma em [bairro]" capta leads que já decidiram reformar — são os mais qualificados.' },
      { icon: '📱', title: 'Stories de obra em andamento geram confiança', category: 'Criativo', categoryColor: '#A78BFA', description: 'Mostrar o dia a dia da obra no Stories humaniza a empresa e demonstra transparência no processo.' },
      { icon: '📅', title: 'Março e outubro são os picos do setor', category: 'Sazonalidade', categoryColor: '#FF4D4D', description: 'Início de ano com planejamento e pré-fim de ano com urgência são os maiores momentos.' },
    ],
    creatives: [
      { name: 'Antes/depois: cozinha reformada em 30 dias', channel: 'Instagram', score: 91, status: 'Top performer', statusColor: '#22C55E' },
      { name: 'Orçamento grátis em 24h — sem compromisso', channel: 'Google', score: 84, status: 'Em destaque', statusColor: '#F0B429' },
      { name: 'Timelapse: reforma completa em 2 minutos', channel: 'TikTok', score: 78, status: 'Estável', statusColor: '#38BDF8' },
      { name: 'Depoimento de cliente satisfeito', channel: 'Meta', score: 65, status: 'Monitorando', statusColor: '#A78BFA' },
      { name: 'Pacote reforma completa por R$X/m²', channel: 'Google', score: 53, status: 'Otimizar', statusColor: '#FF4D4D' },
    ],
    calendar: buildCalendar([3, 10], [1, 7], [2, 5, 8, 11], { 3: 'Março: planejamentos de reforma do ano', 10: 'Outubro: urgência para terminar antes do verão' }),
  },

  psicologia: {
    audience: {
      age: '22–50 anos', gender: '72% feminino', income: 'R$3K–15K/mês',
      location: 'Nacional (online dominante)', buyTime: '3–14 dias',
      pains: ['Ansiedade e burnout', 'Relacionamentos difíceis', 'Luto ou trauma não processado', 'Baixa autoestima'],
      motivations: ['Bem-estar emocional', 'Melhorar relacionamentos', 'Superar trauma', 'Crescimento pessoal'],
      hooks: ['1ª sessão com valor reduzido', 'Atendimento online — sem deslocamento', 'Especialista em X', 'Sigilo garantido'],
      objections: ['Terapia é cara', 'Medo de julgamento', 'Não sei se preciso', 'Nunca tentei, não sei como funciona'],
    },
    insights: [
      { icon: '💻', title: 'Atendimento online dobrou a demanda no pós-pandemia', category: 'Oportunidade', categoryColor: '#22C55E', description: 'Terapia online eliminoua barreira geográfica — psicólogos sem fronteira de cidade têm 2× mais leads.' },
      { icon: '📚', title: 'Conteúdo educativo é o único caminho legal', category: 'Compliance', categoryColor: '#FF4D4D', description: 'CFM proíbe depoimentos de pacientes e antes/depois. Conteúdo sobre temas de saúde mental é permitido.' },
      { icon: '📅', title: 'Janeiro é o pico — busca cresce 250%', category: 'Sazonalidade', categoryColor: '#F0B429', description: 'Resolução de ano novo + Burnout pós-dezembro. Concentre budget máximo em Jan e Ago (volta das férias).' },
      { icon: '🎥', title: 'Vídeos sobre ansiedade e burnout têm alcance orgânico alto', category: 'Criativo', categoryColor: '#A78BFA', description: 'Conteúdo curto sobre sintomas e como tratar posiciona como autoridade e atrai leads qualificados.' },
      { icon: '💬', title: '1ª sessão experimental converte 3× mais', category: 'Oferta', categoryColor: '#38BDF8', description: 'Reduzir barreira de entrada com primeira sessão acessível ou gratuita aumenta taxa de conversão.' },
    ],
    creatives: [
      { name: '5 sinais de que você precisa de terapia', channel: 'Instagram', score: 90, status: 'Top performer', statusColor: '#22C55E' },
      { name: 'Como funciona a terapia online — desmistificando', channel: 'YouTube', score: 83, status: 'Em destaque', statusColor: '#F0B429' },
      { name: '1ª sessão por R$X — agende agora', channel: 'Meta', score: 74, status: 'Estável', statusColor: '#38BDF8' },
      { name: 'Ansiedade: como o cérebro reage e o que fazer', channel: 'TikTok', score: 67, status: 'Monitorando', statusColor: '#A78BFA' },
      { name: 'Atendimento online — sem filas, sem deslocamento', channel: 'Google', score: 55, status: 'Otimizar', statusColor: '#FF4D4D' },
    ],
    calendar: buildCalendar([1, 8], [4, 10], [3, 6, 9], { 1: 'Janeiro: maior pico do ano — burnout + resolução', 8: 'Agosto: volta das férias e estresse de retorno' }),
  },

  nutricao: {
    audience: {
      age: '22–45 anos', gender: '75% feminino', income: 'R$3K–12K/mês',
      location: 'Nacional (atendimento online)', buyTime: '3–10 dias',
      pains: ['Dificuldade de emagrecer', 'Relação difícil com comida', 'Dieta yo-yo', 'Problemas hormonais de peso'],
      motivations: ['Emagrecer com saúde', 'Melhorar exames', 'Mais energia', 'Relacionamento saudável com comida'],
      hooks: ['Cardápio personalizado', 'Acompanhamento pelo WhatsApp', 'Resultado sem passar fome', 'Especialista em X'],
      objections: ['Já fiz dieta e não adiantou', 'Preço da consulta', 'Não tenho disciplina', 'Online não funciona para mim'],
    },
    insights: [
      { icon: '📅', title: 'Janeiro: busca por nutricionista cresce 250%', category: 'Sazonalidade', categoryColor: '#22C55E', description: 'O mês de ouro do nicho. Concentre budget máximo em janeiro — CPL compensa mesmo sendo mais alto.' },
      { icon: '📊', title: 'Antes/depois com dados converte melhor que foto', category: 'Criativo', categoryColor: '#F0B429', description: 'Mostrar -8kg + exames normalizados + antes/depois é o criativo de maior conversão do nicho.' },
      { icon: '💻', title: 'Atendimento online elimina barreira geográfica', category: 'Oportunidade', categoryColor: '#38BDF8', description: 'Nutricionistas online têm base de clientes nacional — escala muito maior que atendimento presencial.' },
      { icon: '⚖️', title: 'CFN: cuidado com antes/depois sem autorização', category: 'Compliance', categoryColor: '#FF4D4D', description: 'O Conselho Federal de Nutrição restringe uso de imagens de transformação. Consulte a regulação atual.' },
      { icon: '💬', title: 'Acompanhamento por WhatsApp aumenta adesão', category: 'Retenção', categoryColor: '#A78BFA', description: 'Pacientes que recebem check-ins por WhatsApp têm 55% mais chance de completar o plano.' },
    ],
    creatives: [
      { name: '-9kg em 90 dias: antes, depois e exames', channel: 'Instagram', score: 93, status: 'Top performer', statusColor: '#22C55E' },
      { name: 'Cardápio de 1 semana que funciona — gratuito', channel: 'TikTok', score: 86, status: 'Em destaque', statusColor: '#F0B429' },
      { name: 'Consulta online: nutricionista do seu lado', channel: 'Meta', score: 74, status: 'Estável', statusColor: '#38BDF8' },
      { name: '5 erros de dieta que sabotam seu resultado', channel: 'YouTube', score: 68, status: 'Monitorando', statusColor: '#A78BFA' },
      { name: 'Plano X semanas — resultado garantido', channel: 'Meta', score: 56, status: 'Otimizar', statusColor: '#FF4D4D' },
    ],
    calendar: buildCalendar([1, 5], [4, 9], [3, 6, 10], { 1: 'Janeiro: maior pico — resolução de ano novo', 5: 'Maio: preparação para o Verão do Sul / Inverno SP' }),
  },

  pet: {
    audience: {
      age: '22–45 anos', gender: '65% feminino', income: 'R$3K–12K/mês',
      location: 'Capitais e cidades médias', buyTime: '1–7 dias',
      pains: ['Pet doente e sem diagnóstico', 'Banho e tosa caro', 'Falta de tempo para cuidar', 'Pet com comportamento difícil'],
      motivations: ['Saúde e bem-estar do animal', 'Praticidade de serviço próximo', 'Qualidade do atendimento', 'Preço justo'],
      hooks: ['Primeira consulta gratuita', 'Busca e entrega grátis', 'Vet disponível 24h', 'Pet shop com entrega rápida'],
      objections: ['Veterinário caro', 'Meu pet não gosta', 'Já tenho fornecedor de sempre', 'Produto caro demais'],
    },
    insights: [
      { icon: '🐾', title: 'Conteúdo de pets tem engajamento 3× acima da média', category: 'Criativo', categoryColor: '#F0B429', description: 'Vídeos e fotos de animais têm engajamento orgânico altíssimo — aproveite para gerar audiência gratuita.' },
      { icon: '🎂', title: 'Aniversário do pet: data de ouro para campanhas', category: 'Retenção', categoryColor: '#22C55E', description: 'Colete a data de nascimento no cadastro e envie oferta especial no aniversário — conversão de 40%.' },
      { icon: '📱', title: 'TikTok com vídeos virais gera leads orgânicos', category: 'Canal', categoryColor: '#38BDF8', description: 'Conteúdo sobre pets virais no TikTok pode gerar centenas de leads novos a custo zero.' },
      { icon: '🤝', title: 'LTV altíssimo: cliente cuida do pet anos', category: 'Estratégia', categoryColor: '#A78BFA', description: 'Um cliente de pet shop que gasta R$200/mês por 5 anos vale R$12.000. CAC de R$50 tem ROI de 240×.' },
      { icon: '📅', title: 'Natal e Dia dos Namorados são picos', category: 'Sazonalidade', categoryColor: '#FF4D4D', description: 'Presentear pets em datas comemorativas cresce 30% ao ano — crie campanhas temáticas.' },
    ],
    creatives: [
      { name: 'Transformação: pet antes e depois do banho', channel: 'TikTok', score: 94, status: 'Top performer', statusColor: '#22C55E' },
      { name: 'Promoção aniversário do seu pet 🎂', channel: 'Meta', score: 88, status: 'Em destaque', statusColor: '#F0B429' },
      { name: '1ª consulta veterinária gratuita', channel: 'Google', score: 76, status: 'Estável', statusColor: '#38BDF8' },
      { name: 'Cuidados essenciais: rotina saudável do pet', channel: 'Instagram', score: 65, status: 'Monitorando', statusColor: '#A78BFA' },
      { name: 'Ração premium com entrega em 24h', channel: 'Meta', score: 54, status: 'Otimizar', statusColor: '#FF4D4D' },
    ],
    calendar: buildCalendar([12, 6], [3, 9], [2, 5, 8, 11], { 12: 'Dezembro: presentear pets no Natal — pico', 6: 'Junho: Dia dos Namorados — promoções para pets' }),
  },

  turismo: {
    audience: {
      age: '28–55 anos', gender: '55% feminino', income: 'R$5K–20K/mês',
      location: 'SP, RJ, MG, RS, PR', buyTime: '7–30 dias',
      pains: ['Preço caro de passagens', 'Dificuldade de planejar viagem', 'Medo de golpe online', 'Destino sem novidade'],
      motivations: ['Descanso e lazer', 'Experiência nova', 'Lua de mel / férias em família', 'Conhecer o mundo'],
      hooks: ['Pacote completo com tudo incluso', 'Melhor preço garantido', 'Atendimento especializado', 'Parcelamento em 12×'],
      objections: ['Preço acima do esperado', 'Quero fazer por conta própria', 'Incerteza com cancelamentos', 'Destino sem atrações'],
    },
    insights: [
      { icon: '📅', title: 'Jan–Fev e Jun–Jul: picos de compra de pacotes', category: 'Sazonalidade', categoryColor: '#22C55E', description: 'Aumente budget em 2× nesses períodos. Férias de verão e inverno concentram 60% das vendas anuais.' },
      { icon: '🎥', title: 'Vídeos de destino têm CTR 4× maior que fotos', category: 'Criativo', categoryColor: '#F0B429', description: 'Drone + pôr do sol + música = criativo que para o dedo no feed. Invista em produção de vídeo.' },
      { icon: '🔄', title: 'Retargeting de cotação recupera 20% dos leads', category: 'Estratégia', categoryColor: '#38BDF8', description: 'Quem pediu cotação e não fechou é o lead mais quente — 3 touchpoints de retargeting são essenciais.' },
      { icon: '💬', title: 'WhatsApp com atendimento rápido é diferencial', category: 'Canal', categoryColor: '#A78BFA', description: 'No turismo, decisão é emocional. Atendimento personalizado pelo WhatsApp converte 3× mais que formulário.' },
      { icon: '🌟', title: 'Depoimentos com fotos reais de viagem convertem', category: 'Prova social', categoryColor: '#FF4D4D', description: 'Fotos reais de clientes em destinos vendidos geram 2× mais interesse que fotos de banco de imagens.' },
    ],
    creatives: [
      { name: 'Drone: pôr do sol em [destino] — venha viver', channel: 'Instagram', score: 92, status: 'Top performer', statusColor: '#22C55E' },
      { name: 'Pacote completo: tudo incluso por R$X/pessoa', channel: 'Meta', score: 85, status: 'Em destaque', statusColor: '#F0B429' },
      { name: 'Depoimento: viagem dos sonhos pela agência', channel: 'Meta', score: 76, status: 'Estável', statusColor: '#38BDF8' },
      { name: 'Última chamada — vagas para [destino]', channel: 'Google', score: 64, status: 'Monitorando', statusColor: '#A78BFA' },
      { name: 'Simule sua viagem sem compromisso', channel: 'Meta', score: 52, status: 'Otimizar', statusColor: '#FF4D4D' },
    ],
    calendar: buildCalendar([1, 6], [4, 9], [3, 5, 8, 11], { 1: 'Janeiro: férias de verão — pico máximo de compras', 6: 'Junho: férias de inverno — 2° maior pico' }),
  },

  moda: {
    audience: {
      age: '18–40 anos', gender: '72% feminino', income: 'R$2K–10K/mês',
      location: 'Nacional (SP, RJ, MG em destaque)', buyTime: '1–5 dias',
      pains: ['Não encontra estilo próprio', 'Roupas que não encaixam bem', 'Preço de marcas caras', 'Entrega que atrasa'],
      motivations: ['Autoexpressão', 'Ocasião especial', 'Tendência atual', 'Preço acessível com qualidade'],
      hooks: ['Frete grátis e troca fácil', 'Edição limitada', 'Influencer usando', 'Entrega expressa'],
      objections: ['Tamanho errado', 'Cor diferente da foto', 'Devolução complicada', 'Qualidade duvidosa'],
    },
    insights: [
      { icon: '📱', title: 'TikTok Shop cresce 200% — pioneiros têm vantagem', category: 'Oportunidade', categoryColor: '#22C55E', description: 'Loja no TikTok com live de vendas pode gerar volumes enormes com CPL ainda muito baixo no Brasil.' },
      { icon: '🤳', title: 'Micro-influencer tem ROI 3× maior que macro', category: 'Canal', categoryColor: '#F0B429', description: 'Influencers de 10k–100k seguidores têm audiência mais engajada e cobram muito menos por resultado.' },
      { icon: '⏱', title: 'Urgência (edição limitada) aumenta CVR em 50%', category: 'Estratégia', categoryColor: '#38BDF8', description: '"Só X peças disponíveis" e "Oferta válida por 24h" ativam FOMO e aceleram a decisão de compra.' },
      { icon: '🤳', title: 'UGC (clientes usando) reduz CPL em 35%', category: 'Criativo', categoryColor: '#A78BFA', description: 'Repost de clientes usando as peças com muito mais autenticidade que fotos produzidas de estúdio.' },
      { icon: '📅', title: 'Black Friday e Janeiro são os maiores picos', category: 'Sazonalidade', categoryColor: '#FF4D4D', description: 'Novembro (Black Friday) e Janeiro (liquidação pós-festa) concentram 40% das vendas anuais de moda.' },
    ],
    creatives: [
      { name: 'Clientes usando a coleção — fotos reais', channel: 'Instagram', score: 93, status: 'Top performer', statusColor: '#22C55E' },
      { name: 'Edição limitada — só X peças restantes', channel: 'Meta', score: 87, status: 'Em destaque', statusColor: '#F0B429' },
      { name: 'Live de vendas: 50% OFF por 1 hora', channel: 'TikTok', score: 81, status: 'Estável', statusColor: '#38BDF8' },
      { name: 'Micro-influencer lookbook nova coleção', channel: 'Instagram', score: 70, status: 'Monitorando', statusColor: '#A78BFA' },
      { name: 'Frete grátis acima de R$X este fim de semana', channel: 'Meta', score: 58, status: 'Otimizar', statusColor: '#FF4D4D' },
    ],
    calendar: buildCalendar([11, 1], [4, 7], [2, 5, 8], { 11: 'Novembro: Black Friday — maior mês do ano', 1: 'Janeiro: liquidação — clientes com dinheiro de 13°' }),
  },

  eventos: {
    audience: {
      age: '25–55 anos', gender: '58% feminino', income: 'R$5K–20K/mês',
      location: 'Raio de 50–200km do evento', buyTime: '7–30 dias',
      pains: ['Eventos sem qualidade', 'Preço caro de organização', 'Dificuldade de encontrar fornecedores', 'Eventos sem originalidade'],
      motivations: ['Celebrar momento especial', 'Networking profissional', 'Entretenimento', 'Formatura / casamento'],
      hooks: ['Portfólio de eventos realizados', 'Pacote completo', 'Depoimentos de noivos', 'Lotes com desconto'],
      objections: ['Preço acima do budget', 'Já contratei e decepcionou', 'Não sei se vai funcionar', 'Data conflitando'],
    },
    insights: [
      { icon: '⏱', title: 'Urgência de lotes converte 4× mais', category: 'Estratégia', categoryColor: '#22C55E', description: 'Ingressos em lotes com preço crescente ativam FOMO e antecipam receita. Esgote lotes rapidamente.' },
      { icon: '🎥', title: 'Vídeos de edições anteriores CVR 4× maior', category: 'Criativo', categoryColor: '#F0B429', description: 'Mostrar o evento passado com depoimentos e imagens reais é muito mais convincente que artes.' },
      { icon: '📅', title: 'Inicie campanha 45–60 dias antes do evento', category: 'Planejamento', categoryColor: '#38BDF8', description: 'Funil precisa de tempo para aquecer — campanha de última hora tem CPL 2× maior e menor preenchimento.' },
      { icon: '🔄', title: 'Remarketing de visitantes converte 8×', category: 'Audiência', categoryColor: '#A78BFA', description: 'Quem visitou a página de vendas mas não comprou é o público mais quente — invista neste retargeting.' },
      { icon: '📅', title: 'Nov–Dez e Jun–Jul são os maiores picos', category: 'Sazonalidade', categoryColor: '#FF4D4D', description: 'Festas de fim de ano e formaturas de julho concentram 55% da demanda anual de eventos.' },
    ],
    creatives: [
      { name: 'Highlight: evento anterior com depoimentos', channel: 'Instagram', score: 91, status: 'Top performer', statusColor: '#22C55E' },
      { name: 'Último lote — garanta sua vaga', channel: 'Meta', score: 86, status: 'Em destaque', statusColor: '#F0B429' },
      { name: 'O que te espera no evento — sneak peek', channel: 'YouTube', score: 77, status: 'Estável', statusColor: '#38BDF8' },
      { name: 'Testemunho: o evento mudou minha carreira', channel: 'LinkedIn', score: 68, status: 'Monitorando', statusColor: '#A78BFA' },
      { name: 'Informações gerais e programação', channel: 'Meta', score: 54, status: 'Otimizar', statusColor: '#FF4D4D' },
    ],
    calendar: buildCalendar([11, 12], [2, 8], [3, 6, 9], { 11: 'Novembro: formaturas e festas de fim de ano', 12: 'Dezembro: reveillon e confraternizações' }),
  },
  moveis_planejados: {
    audience: {
      age: '28–50 anos', gender: '65% feminino, 35% masculino',
      income: 'R$5K–25K/mês', location: 'Regiões de classe média-alta, condomínios, lançamentos',
      buyTime: '30–90 dias',
      pains: [
        'Não saber o preço real antes de ir à loja',
        'Receber orçamentos incomparáveis entre lojas',
        'Medo de errar no projeto e se arrepender',
        'Prazo de entrega muito longo',
        'Não visualizar como vai ficar antes de comprar',
      ],
      motivations: [
        'Ver o projeto completo em 3D antes de assinar',
        'Preço transparente e sem surpresas',
        'Referências de projetos similares realizados',
        'Prazo de entrega garantido em contrato',
        'Empresa local com quem posso reclamar se der errado',
      ],
      hooks: [
        '"Veja como ficará sua cozinha antes de gastar R$1"',
        '"Orçamento grátis sem compromisso — projeto em 48h"',
        '"Cliente aqui do bairro fez e aprovou — veja o resultado"',
        '"Entregamos em 45 dias ou devolvemos o sinal"',
      ],
      objections: [
        'Muito caro comparado com outros',
        'Prazo de entrega muito longo',
        'Não sei se vai ficar do jeito que imagino',
        'Já tive experiência ruim com marceneiro',
      ],
    },
    insights: [
      { icon: '🎨', title: 'Projeto em 3D é o maior diferencial de conversão', category: 'Produto', categoryColor: '#F0B429', description: 'Clientes que veem o projeto renderizado em 3D antes da assinatura convertem 60-80% mais e têm 40% menos cancelamentos.' },
      { icon: '📸', title: 'Antes/depois é o criativo de maior CTR', category: 'Criativo', categoryColor: '#22C55E', description: 'Fotos reais de projetos realizados geram CTR 3× maior que renderizações. Crie um portfólio fotográfico de pelo menos 20 projetos.' },
      { icon: '💬', title: 'WhatsApp é o canal de conversão mais rápido', category: 'Canal', categoryColor: '#38BDF8', description: 'No segmento de móveis, 70% dos leads preferem WhatsApp para tirar dúvidas. Resposta em até 15 min aumenta conversão em 50%.' },
      { icon: '📅', title: 'Ciclo de venda longo exige nutrição ativa', category: 'Estratégia', categoryColor: '#A78BFA', description: 'O cliente pesquisa por 30-90 dias. E-mail + WhatsApp semanais com dicas de ambientes mantêm sua marca na mente.' },
      { icon: '🏠', title: 'Parcerias com construtoras e corretores são ouro', category: 'Crescimento', categoryColor: '#FF4D4D', description: 'Um corretor de imóvel fecha um apartamento por mês. Se indicar você, são 12 projetos por ano. Crie programa de indicação.' },
    ],
    creatives: [
      { name: 'Antes e depois: cozinha transformada', channel: 'Instagram', score: 94, status: 'Top performer', statusColor: '#22C55E' },
      { name: 'Tour 3D do dormitório planejado', channel: 'Facebook', score: 88, status: 'Em destaque', statusColor: '#F0B429' },
      { name: 'Depoimento: "ficou exatamente como imaginei"', channel: 'Meta', score: 80, status: 'Testando', statusColor: '#38BDF8' },
      { name: 'Processo de instalação (time-lapse)', channel: 'Instagram', score: 72, status: 'Estável', statusColor: '#A78BFA' },
      { name: 'Comparativo: planejado vs modulado', channel: 'YouTube', score: 60, status: 'Monitorando', statusColor: '#FF4D4D' },
    ],
    calendar: buildCalendar([1, 2, 8, 9, 11], [4, 5], [3, 6, 10], {
      1: 'Janeiro: pico de casamentos e mudanças — empurrar orçamentos',
      2: 'Fevereiro: apartamentos novos prontos — parcerias com construtoras',
      8: 'Agosto: pré-primavera, reformas de final de ano',
      11: 'Novembro: Black Friday — promoção de fechamento de projetos',
    }),
  },
}

// ── Genérico para nichos sem template específico ──────────────────────────────
const GENERIC_CONTENT: NicheContent = {
  audience: {
    age: '25–50 anos', gender: '50% cada', income: 'R$3K–15K/mês',
    location: 'Nacional', buyTime: '5–15 dias',
    pains: ['Solução atual não atende bem', 'Preço acima do esperado', 'Falta de agilidade', 'Atendimento ruim'],
    motivations: ['Resolver problema urgente', 'Melhor custo-benefício', 'Confiança no fornecedor', 'Resultado comprovado'],
    hooks: ['Resultado garantido', 'Atendimento rápido', 'Melhor preço da região', 'Avaliações reais'],
    objections: ['Preço caro', 'Já tentei outra solução', 'Não sei se funciona', 'Demora no atendimento'],
  },
  insights: [
    { icon: '📊', title: 'Teste A/B nos primeiros 30 dias é fundamental', category: 'Estratégia', categoryColor: '#F0B429', description: 'Sem dados históricos, o A/B é a única forma de identificar criativos e canais mais eficientes para seu nicho.' },
    { icon: '📱', title: 'Comece com 2 canais e escale o que funciona', category: 'Canal', categoryColor: '#22C55E', description: 'Foco nos 2 melhores canais do nicho evita dispersão e gera volume de dados para otimização mais rápida.' },
    { icon: '💬', title: 'Prova social é o gatilho mais poderoso', category: 'Criativo', categoryColor: '#38BDF8', description: 'Depoimentos reais com nome e foto convertem 3× mais que qualquer argumento de venda.' },
    { icon: '🔄', title: 'Troque criativos a cada 45 dias', category: 'Operação', categoryColor: '#A78BFA', description: 'Fadiga de anúncio começa a aparecer após 6 semanas rodando o mesmo criativo — monitore frequência.' },
    { icon: '📅', title: 'Identifique sazonalidade nos primeiros 3 meses', category: 'Planejamento', categoryColor: '#FF4D4D', description: 'Monitore CPL por período para identificar picos e vales do seu nicho específico.' },
  ],
  creatives: [
    { name: 'Depoimento de cliente satisfeito', channel: 'Meta', score: 88, status: 'Top performer', statusColor: '#22C55E' },
    { name: 'Problema X — como resolvemos em Y dias', channel: 'Google', score: 80, status: 'Em destaque', statusColor: '#F0B429' },
    { name: 'Demonstração do serviço/produto', channel: 'YouTube', score: 70, status: 'Estável', statusColor: '#38BDF8' },
    { name: 'Oferta especial por tempo limitado', channel: 'Meta', score: 62, status: 'Monitorando', statusColor: '#A78BFA' },
    { name: 'Comparativo vs solução atual', channel: 'Google', score: 50, status: 'Otimizar', statusColor: '#FF4D4D' },
  ],
  calendar: buildCalendar([1, 11], [4, 8], [2, 5, 8, 11]),
}

// ── Mapa de matching ──────────────────────────────────────────────────────────
const CONTENT_KEY_MAP: Record<string, string> = {
  'móveis planejados': 'moveis_planejados', 'moveis planejados': 'moveis_planejados',
  marcenaria: 'moveis_planejados', marceneiro: 'moveis_planejados',
  'móveis': 'moveis_planejados', moveis: 'moveis_planejados', planejados: 'moveis_planejados',
  odontolog: 'odontologia', dentist: 'odontologia', clareament: 'odontologia',
  financeiro: 'financeiro', crédito: 'financeiro', credito: 'financeiro', investiment: 'financeiro',
  'saúde': 'saude', saude: 'saude', clínica: 'saude', clinica: 'saude', hospital: 'saude',
  'educaç': 'educacao', educac: 'educacao', curso: 'educacao', escola: 'educacao',
  imóvel: 'imobiliario', imovel: 'imobiliario', imobili: 'imobiliario',
  ecommerce: 'ecommerce', 'e-commerce': 'ecommerce', loja: 'ecommerce', varejo: 'ecommerce',
  jurídico: 'juridico', juridico: 'juridico', advocaci: 'juridico', advogado: 'juridico',
  contabilidade: 'contabilidade', contador: 'contabilidade',
  beleza: 'beleza', 'estética': 'beleza', estetica: 'beleza', salão: 'beleza',
  academia: 'fitness', fitness: 'fitness', personal: 'fitness', pilates: 'fitness',
  tecnologia: 'tecnologia', software: 'tecnologia', saas: 'tecnologia', startup: 'tecnologia',
  marketing: 'marketing_agencia', agência: 'marketing_agencia', agencia: 'marketing_agencia', publicidade: 'marketing_agencia',
  consultoria: 'consultoria', coach: 'consultoria',
  restaurante: 'restaurante', food: 'restaurante', pizzaria: 'restaurante', lanchonete: 'restaurante',
  'construç': 'construcao', construcao: 'construcao', reforma: 'construcao', engenharia: 'construcao',
  fisioterapia: 'saude', fisioterapeuta: 'saude',
  psicolog: 'psicologia', terapia: 'psicologia',
  'nutriç': 'nutricao', nutric: 'nutricao', nutricionista: 'nutricao',
  pet: 'pet', veterinário: 'pet', veterinario: 'pet',
  turismo: 'turismo', viagem: 'turismo', hotel: 'turismo',
  moda: 'moda', vestuário: 'moda', vestuario: 'moda', roupas: 'moda',
  eventos: 'eventos', evento: 'eventos', casamento: 'eventos', formatura: 'eventos',
}

export function getNicheContent(nicheRaw: string): NicheContent {
  if (!nicheRaw) return GENERIC_CONTENT
  const n = nicheRaw.toLowerCase()
  for (const [kw, key] of Object.entries(CONTENT_KEY_MAP)) {
    if (n.includes(kw)) return NICHE_CONTENT[key] || GENERIC_CONTENT
  }
  return GENERIC_CONTENT
}
