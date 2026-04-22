// lib/niche_prompts.ts — Sistema de prompts especializados por nicho (ELYON AGENT)
// Cada nicho tem: terminologia correta, contexto de mercado, campos dinâmicos e prompt injection

export interface NicheField {
  key: string
  label: string
  placeholder: string
  type: 'text' | 'select' | 'number'
  options?: string[]
  required?: boolean
}

export interface NicheConfig {
  key: string
  label: string
  icon: string
  title: string                // nome do negócio no setor
  analystRole: string          // papel do ELYON no contexto do nicho
  fields: NicheField[]         // campos específicos do onboarding
  promptContext: string        // injeção no prompt da IA
  productPlaceholder: string   // placeholder do campo de produtos
  objectiveLabels: Record<string, string> // nomes dos objetivos no idioma do nicho
}

// ── Configurações por nicho ────────────────────────────────────────────────────

const NICHE_CONFIGS: NicheConfig[] = [
  // ─ MÓVEIS PLANEJADOS ───────────────────────────────────────────────
  {
    key: 'moveis',
    label: 'Móveis Planejados',
    icon: '🪑',
    title: 'marcenaria / loja de móveis planejados',
    analystRole: 'Analista especializado em marcenarias e lojas de móveis planejados no Brasil',
    fields: [
      {
        key: 'ambiente_principal',
        label: 'Ambiente mais vendido',
        type: 'select',
        options: ['Cozinha planejada', 'Dormitório/closet', 'Sala de estar', 'Home office', 'Banheiro', 'Múltiplos ambientes'],
        placeholder: '',
      },
      {
        key: 'faixa_preco',
        label: 'Ticket médio por projeto',
        type: 'select',
        options: ['R$5k–R$15k (econômico)', 'R$15k–R$40k (médio)', 'R$40k–R$100k (premium)', 'Acima de R$100k (alto padrão)'],
        placeholder: '',
      },
      {
        key: 'prazo_entrega',
        label: 'Prazo médio de entrega',
        type: 'select',
        options: ['15–30 dias', '30–60 dias', '60–90 dias', 'Acima de 90 dias'],
        placeholder: '',
      },
      {
        key: 'possui_showroom',
        label: 'Possui showroom físico?',
        type: 'select',
        options: ['Sim, showroom próprio', 'Sim, showroom compartilhado', 'Não (digital/showroom parceiros)', 'Atendimento domiciliar'],
        placeholder: '',
      },
    ],
    promptContext: `
CONTEXTO DO NICHO — MÓVEIS PLANEJADOS:
- O ciclo de venda é longo (30 a 120 dias desde o lead até a assinatura)
- O lead ideal já tem apartamento/casa e está em fase de acabamento ou reforma
- A maior dor é: visitar várias lojas, receber orçamentos incomparáveis, não saber o preço justo
- O maior gatilho de compra é: ver o projeto em 3D antes de assinar (tour virtual)
- Concorrência principal: Tok&Stok, MadeiraMadeira, marcenarias locais
- Sazonalidade: picos em Jan-Feb (mudanças/casamentos), Ago-Set (imóveis prontos), Nov (Black Friday)
- Canais que mais convertem: Facebook/Instagram (projeto bonito = criativo forte), Google (busca ativa por showroom), Pinterest (inspiração)
- Terminologia correta do setor: "projeto", "ambiente", "modulado" vs "planejado", "acabamento", "ferragem", "MDF/MDP"
- Métrica chave: custo por visita ao showroom (não só custo por lead)
`,
    productPlaceholder: 'Cozinha planejada completa\nDormitório com closet\nHome office\nSala de TV planejada',
    objectiveLabels: {
      leads: 'Gerar visitas ao showroom / orçamentos',
      vendas: 'Aumentar projetos fechados por mês',
      brand: 'Construir autoridade na região',
      retencao: 'Recomendações e projetos de indicação',
    },
  },

  // ─ CLÍNICAS / SAÚDE ───────────────────────────────────────────────
  {
    key: 'clinica',
    label: 'Clínicas e Consultórios',
    icon: '🏥',
    title: 'clínica / consultório de saúde',
    analystRole: 'Analista especializado em marketing para clínicas e consultórios no Brasil',
    fields: [
      {
        key: 'especialidade',
        label: 'Especialidade principal',
        type: 'select',
        options: ['Odontologia estética', 'Odontologia geral', 'Psicologia / Terapia', 'Nutrição', 'Fisioterapia', 'Dermatologia estética', 'Medicina do esporte', 'Oftalmologia', 'Ginecologia', 'Cardiologia', 'Outra'],
        placeholder: '',
      },
      {
        key: 'aceita_convenio',
        label: 'Aceita convênios?',
        type: 'select',
        options: ['Não — apenas particular', 'Sim — principal fonte', 'Sim — complementar (foco no particular)'],
        placeholder: '',
      },
      {
        key: 'num_profissionais',
        label: 'Número de profissionais',
        type: 'select',
        options: ['1 (clínica solo)', '2–3', '4–8', '9–20', 'Acima de 20'],
        placeholder: '',
      },
      {
        key: 'ticket_consulta',
        label: 'Ticket médio por procedimento',
        type: 'select',
        options: ['Até R$200', 'R$200–R$500', 'R$500–R$1.500', 'R$1.500–R$5.000', 'Acima de R$5.000'],
        placeholder: '',
      },
    ],
    promptContext: `
CONTEXTO DO NICHO — CLÍNICAS E CONSULTÓRIOS:
- O lead de saúde é motivado por dor (problema real) ou vaidade (estética)
- Clínica particular compete diretamente com convênio — o diferencial precisa ser claro
- Regulação do CFM/CRO proíbe certas formas de publicidade — evitar promessas de resultados
- A jornada do paciente: busca no Google → redes sociais (prova social) → WhatsApp para agendamento
- Gatilhos de conversão: antes/depois (dentro das normas), depoimentos, expertise do profissional
- Canais principais: Google (busca por sintoma/procedimento), Instagram (estética e autoridade)
- Terminologia: "paciente" (não "cliente"), "procedimento" (não "serviço"), "consulta de avaliação"
- Métrica chave: custo por agendamento confirmado (não por lead)
- Sazonalidade: Pré-verão (Out-Nov), Pós-férias (Mar), Dia das mães, Dia dos namorados
`,
    productPlaceholder: 'Consulta de avaliação\nClareamento dental\nAparelho transparente\nBotox\nHarmonização facial',
    objectiveLabels: {
      leads: 'Gerar agendamentos de avaliação',
      vendas: 'Aumentar procedimentos realizados',
      brand: 'Construir autoridade e reputação online',
      retencao: 'Fidelizar pacientes e indicações',
    },
  },

  // ─ IMOBILIÁRIO ────────────────────────────────────────────────────
  {
    key: 'imobiliario',
    label: 'Imobiliárias e Corretores',
    icon: '🏠',
    title: 'imobiliária / corretor de imóveis',
    analystRole: 'Analista especializado em marketing imobiliário no Brasil',
    fields: [
      {
        key: 'tipo_imovel',
        label: 'Tipo de imóvel principal',
        type: 'select',
        options: ['Residencial (apartamentos)', 'Residencial (casas)', 'Comercial (salas/lojas)', 'Lançamentos (incorporação)', 'Terrenos/loteamentos', 'Imóveis de luxo', 'Múltiplos tipos'],
        placeholder: '',
      },
      {
        key: 'faixa_preco_imovel',
        label: 'Faixa de preço trabalhada',
        type: 'select',
        options: ['Até R$200k (MCMV/popular)', 'R$200k–R$500k (médio)', 'R$500k–R$1,5M (médio-alto)', 'Acima de R$1,5M (alto padrão)'],
        placeholder: '',
      },
      {
        key: 'modelo_negocio',
        label: 'Modelo de negócio',
        type: 'select',
        options: ['Venda (ganho na comissão)', 'Locação (administração)', 'Venda + locação', 'Lançamento (captação de leads)'],
        placeholder: '',
      },
      {
        key: 'regiao_atuacao',
        label: 'Abrangência de atuação',
        type: 'select',
        options: ['Bairro específico', 'Cidade inteira', 'Região metropolitana', 'Estado inteiro'],
        placeholder: '',
      },
    ],
    promptContext: `
CONTEXTO DO NICHO — IMOBILIÁRIO:
- O funil de compra é longo: 3–18 meses entre o primeiro contato e o fechamento
- O lead de imóvel tem altíssima intenção de busca — Google é o canal dominante
- Conteúdo que converte: tour virtual, vídeos do bairro, planta do imóvel, simulação de financiamento
- Principal objeção: medo de sair do aluguel, medo de não conseguir financiamento
- Gatilhos: "últimas unidades", simulação de parcela baixa, valorização da região
- CRECI exige que o número de registro apareça em toda publicidade
- Métricas chave: custo por lead qualificado (CPL), custo por visita ao imóvel, taxa de conversão lead→proposta
- Terminologia: "lead qualificado" = cliente com renda comprovável para o ticket do imóvel
- Canais: Google Ads (busca por imóvel), Facebook/Instagram (descoberta e remarketing), portais (ZAP/VivaReal)
`,
    productPlaceholder: 'Apartamentos 2 quartos\nApartamentos 3 quartos com suíte\nCasas em condomínio\nSalas comerciais',
    objectiveLabels: {
      leads: 'Gerar leads qualificados para visita',
      vendas: 'Aumentar contratos de compra/venda assinados',
      brand: 'Construir presença e autoridade regional',
      retencao: 'Fidelizar clientes para indicações e locação',
    },
  },

  // ─ ACADEMIA / FITNESS ─────────────────────────────────────────────
  {
    key: 'fitness',
    label: 'Academias e Estúdios Fitness',
    icon: '💪',
    title: 'academia / estúdio fitness',
    analystRole: 'Analista especializado em marketing para academias e estúdios fitness no Brasil',
    fields: [
      {
        key: 'modalidades',
        label: 'Modalidade principal',
        type: 'select',
        options: ['Musculação/academia tradicional', 'Funcional / CrossFit', 'Yoga / Pilates', 'Natação', 'Artes marciais / Luta', 'Dança / Zumba', 'Estúdio personal (treino individual)', 'Múltiplas modalidades'],
        placeholder: '',
      },
      {
        key: 'plano_mensal',
        label: 'Plano mensal médio',
        type: 'select',
        options: ['Até R$80/mês', 'R$80–R$150/mês', 'R$150–R$300/mês', 'R$300–R$600/mês', 'Acima de R$600/mês (premium/personal)'],
        placeholder: '',
      },
      {
        key: 'num_alunos',
        label: 'Alunos ativos atualmente',
        type: 'select',
        options: ['Menos de 50', '50–150', '150–400', '400–1000', 'Acima de 1000'],
        placeholder: '',
      },
    ],
    promptContext: `
CONTEXTO DO NICHO — ACADEMIAS E FITNESS:
- A principal motivação de compra é estética (emagrecer, definir) e saúde (médico recomendou)
- O churn é alto: 30-50% dos alunos cancelam nos primeiros 3 meses
- A retenção é a maior alavanca de crescimento — mais barato que adquirir
- Campanhas de Janeiro/Fevereiro (Ano Novo) são as mais fortes do ano
- Gatilhos de conversão: aula experimental grátis, semana gratuita, avaliação física grátis
- O lead qualificado quer saber: preço, localização, horários, modalidades
- Métricas chave: CAC (custo de aquisição de aluno), LTV por plano, taxa de renovação
- Canais: Instagram/TikTok (transformações, bastidores, professores), Facebook (público 35+), Google Local
- Terminologia: "matrícula" (não "venda"), "aluno" (não "cliente"), "plano" (não "assinatura")
`,
    productPlaceholder: 'Plano mensal musculação\nPlano trimestral\nPlano anual\nAula experimental grátis\nAvaliação física',
    objectiveLabels: {
      leads: 'Gerar matrículas e aulas experimentais',
      vendas: 'Aumentar conversão de experimentais em alunos',
      brand: 'Construir comunidade e autoridade local',
      retencao: 'Reduzir churn e aumentar renovações',
    },
  },

  // ─ RESTAURANTE / FOOD ─────────────────────────────────────────────
  {
    key: 'restaurante',
    label: 'Restaurantes e Alimentação',
    icon: '🍽️',
    title: 'restaurante / negócio de alimentação',
    analystRole: 'Analista especializado em marketing para restaurantes e negócios de alimentação',
    fields: [
      {
        key: 'tipo_cozinha',
        label: 'Tipo de cozinha / conceito',
        type: 'select',
        options: ['Brasileira tradicional', 'Italiana/Pizza', 'Japonesa/Sushi', 'Fast food / Hambúrguer', 'Saudável / Fit', 'Churrascaria', 'Bar / Boteco', 'Cafeteria / Confeitaria', 'Delivery especializado', 'Outro'],
        placeholder: '',
      },
      {
        key: 'modelo_servico',
        label: 'Modelo de serviço',
        type: 'select',
        options: ['Presencial (salão)', 'Delivery (iFood/Rappi)', 'Ambos (salão + delivery)', 'Dark kitchen (só delivery)', 'Buffet / eventos'],
        placeholder: '',
      },
      {
        key: 'ticket_medio_mesa',
        label: 'Ticket médio por pessoa',
        type: 'select',
        options: ['Até R$30 (fast food)', 'R$30–R$70 (casual)', 'R$70–R$150 (médio-alto)', 'Acima de R$150 (fine dining)'],
        placeholder: '',
      },
    ],
    promptContext: `
CONTEXTO DO NICHO — RESTAURANTES E ALIMENTAÇÃO:
- O cliente decide onde comer em menos de 5 minutos — a decisão é emocional e visual
- O Google Maps é o canal mais importante para restaurante local (nota, fotos, horários)
- Delivery: iFood/Rappi têm comissão de 25-30% — estratégia própria de delivery é diferencial
- Conteúdo que converte: fotos profissionais do prato, vídeo de preparo, ambiente aconchegante
- Sazonalidade: Dia dos namorados, Dia das mães, Natal, Carnaval (delivery) são picos
- O maior erro: não responder comentários negativos no Google
- Métricas chave: custo por pedido (delivery), ticket médio por mesa, taxa de retorno de clientes
- Fidelização: programas de pontos, WhatsApp marketing, promoções exclusivas para cadastrados
- Terminologia: "cardápio" (não "menu" em casual), "cover", "entrada/principal/sobremesa"
`,
    productPlaceholder: 'Almoço executivo\nJantar à la carte\nPedido delivery\nEvento / confraternização\nCatering',
    objectiveLabels: {
      leads: 'Gerar reservas e pedidos',
      vendas: 'Aumentar ticket médio e frequência',
      brand: 'Construir presença e nota no Google Maps',
      retencao: 'Fidelizar clientes frequentes',
    },
  },

  // ─ E-COMMERCE / VAREJO ────────────────────────────────────────────
  {
    key: 'ecommerce',
    label: 'E-commerce e Lojas',
    icon: '🛒',
    title: 'e-commerce / loja online ou física',
    analystRole: 'Analista especializado em e-commerce e varejo no Brasil',
    fields: [
      {
        key: 'categoria_principal',
        label: 'Categoria principal de produto',
        type: 'select',
        options: ['Moda e vestuário', 'Calçados', 'Eletrônicos', 'Casa e decoração', 'Beleza e cosméticos', 'Suplementos e saúde', 'Alimentos e bebidas', 'Brinquedos e kids', 'Pet', 'Esportes', 'Outro'],
        placeholder: '',
      },
      {
        key: 'plataforma',
        label: 'Plataforma / canal de venda',
        type: 'select',
        options: ['Shopify', 'VTEX', 'WooCommerce', 'Nuvemshop / Loja Integrada', 'Mercado Livre / marketplaces', 'Instagram Shopping', 'Loja física apenas', 'Múltiplos canais'],
        placeholder: '',
      },
      {
        key: 'ticket_ecommerce',
        label: 'Ticket médio por pedido',
        type: 'select',
        options: ['Até R$80', 'R$80–R$200', 'R$200–R$500', 'Acima de R$500'],
        placeholder: '',
      },
    ],
    promptContext: `
CONTEXTO DO NICHO — E-COMMERCE E VAREJO:
- ROAS é a métrica principal — target mínimo de 3× para ser lucrativo (considerando CMV + frete)
- O funil padrão: Discovery (topo) → Remarketing (carrinho abandonado) → Conversão (fundo)
- Sazonalidade crítica: Black Friday (principal), Natal, Dia das mães, Dia dos namorados, Dia dos pais
- O pixel do Meta e a tag do Google são obrigatórios para remarketing eficiente
- CAC e LTV são as métricas de sustentabilidade — cliente recorrente vale 5× mais que novo
- Frete grátis é o maior gatilho de conversão no Brasil — usar com inteligência
- Terminologia: "ROAS", "CAC", "LTV", "ticket médio", "taxa de conversão", "carrinho abandonado"
- Google Shopping é obrigatório para e-commerce — custo por clique mais baixo que search
- Canais: Meta Ads (discovery + remarketing), Google Shopping, Email marketing, WhatsApp
`,
    productPlaceholder: 'Produto principal 1\nProduto principal 2\nKit/combo mais vendido\nProduto de entrada (menor ticket)',
    objectiveLabels: {
      leads: 'Gerar tráfego qualificado para a loja',
      vendas: 'Aumentar ROAS e receita mensal',
      brand: 'Construir brand awareness e recorrência',
      retencao: 'Aumentar LTV e recompra',
    },
  },

  // ─ EDUCAÇÃO / CURSOS ──────────────────────────────────────────────
  {
    key: 'educacao',
    label: 'Educação e Infoprodutos',
    icon: '📚',
    title: 'escola de cursos / produtor de infoprodutos',
    analystRole: 'Analista especializado em marketing para educação e infoprodutos no Brasil',
    fields: [
      {
        key: 'formato_curso',
        label: 'Formato de entrega',
        type: 'select',
        options: ['Online (gravado / EAD)', 'Online (ao vivo / turmas)', 'Presencial', 'Híbrido (online + presencial)', 'Mentoria individual', 'Assinatura / membership'],
        placeholder: '',
      },
      {
        key: 'preco_principal',
        label: 'Preço do produto principal',
        type: 'select',
        options: ['Até R$197 (entrada)', 'R$197–R$997 (mid-ticket)', 'R$997–R$2.997 (high-ticket)', 'Acima de R$2.997 (premium/mentoria)'],
        placeholder: '',
      },
      {
        key: 'area_conhecimento',
        label: 'Área de conhecimento',
        type: 'select',
        options: ['Negócios e empreendedorismo', 'Marketing e vendas', 'Tecnologia / programação', 'Concursos e vestibulares', 'Saúde e bem-estar', 'Arte e criatividade', 'Idiomas', 'Finanças pessoais', 'Outro'],
        placeholder: '',
      },
    ],
    promptContext: `
CONTEXTO DO NICHO — EDUCAÇÃO E INFOPRODUTOS:
- O mercado de cursos online cresceu 40% pós-pandemia e ainda tem espaço
- Estratégia de lançamento (Jeff Walker) vs. perpétuo — cada modelo tem métricas diferentes
- Lançamento: CPL mais alto mas conversão concentrada (evento = urgência)
- Perpétuo: CPL menor, funil automático, menor conversão mas previsível
- A principal objeção: "já tentei outros cursos e não funcionou" — prova social é essencial
- Gatilhos de conversão: depoimentos de alunos com resultados reais, aula grátis, bônus
- Hotmart/Kiwify cobram ~9.9% — incluir no cálculo de ROAS
- Terminologia: "aluno" (não "cliente"), "turma", "mentoria", "mastermind", "perpétuo"
- Métricas: CPL (custo por lead), CPA (custo por inscrição), ROAS, taxa de conclusão do curso
- Canais: YouTube (conteúdo que educa), Instagram (autoridade), Email marketing (nutrição), Meta Ads
`,
    productPlaceholder: 'Curso principal (nome)\nMentoria individual\nWorkshop ao vivo\nProduto de entrada (isca digital)',
    objectiveLabels: {
      leads: 'Gerar leads qualificados para a lista/funil',
      vendas: 'Aumentar matrículas e faturamento',
      brand: 'Construir autoridade e audiência',
      retencao: 'Engajar alunos e vender upgrades',
    },
  },

  // ─ PRESTADORES DE SERVIÇO LOCAL ───────────────────────────────────
  {
    key: 'servico_local',
    label: 'Prestadores de Serviço Local',
    icon: '🔧',
    title: 'prestador de serviço local',
    analystRole: 'Analista especializado em marketing para prestadores de serviço local no Brasil',
    fields: [
      {
        key: 'tipo_servico',
        label: 'Tipo de serviço',
        type: 'select',
        options: ['Advocacia / Jurídico', 'Contabilidade', 'Arquitetura / Design de interiores', 'Engenharia / Construção', 'Reforma / Pintura / Elétrica', 'Fotografia / Vídeo', 'Consultoria empresarial', 'Segurança (câmeras, alarmes)', 'Limpeza / Conservação', 'Outro'],
        placeholder: '',
      },
      {
        key: 'modelo_cobranca',
        label: 'Como cobra pelos serviços',
        type: 'select',
        options: ['Por hora/diária', 'Por projeto (valor fixo)', 'Mensalidade (recorrência)', 'Por êxito / comissão', 'Múltiplos modelos'],
        placeholder: '',
      },
      {
        key: 'raio_atuacao',
        label: 'Raio de atuação',
        type: 'select',
        options: ['Bairro (até 5km)', 'Cidade', 'Região metropolitana', 'Estado', 'Nacional'],
        placeholder: '',
      },
    ],
    promptContext: `
CONTEXTO DO NICHO — PRESTADORES DE SERVIÇO LOCAL:
- Reputação e indicação são os maiores geradores de negócio — digital amplifica isso
- Google Meu Negócio (GMB) é o canal #1 para serviço local — nota e fotos definem a escolha
- O orçamento é a conversão do funil — muitas vezes o lead pede 3 orçamentos
- Diferencial precisa ser claro e rápido: por que você vs. o concorrente?
- Construção de autoridade: antes/depois, certificações, tempo de mercado, clientes conhecidos
- Canais: Google Local (busca + GMB), WhatsApp (converta o lead rapidamente), Instagram (portfólio)
- Métricas: custo por orçamento solicitado, taxa de conversão orçamento→cliente, ticket médio
- Regulamentações específicas por área (OAB/CRC/CREA) — respeitar nas peças publicitárias
- Sazonalidade: depende do nicho específico — reformas no 2º semestre, contabilidade em Março/Dezembro
`,
    productPlaceholder: 'Serviço principal\nConsulta inicial (avaliação)\nPacote/retainer mensal\nProjeto pontual',
    objectiveLabels: {
      leads: 'Gerar pedidos de orçamento',
      vendas: 'Converter mais orçamentos em contratos',
      brand: 'Construir reputação e autoridade local',
      retencao: 'Fidelizar clientes para recorrência/indicação',
    },
  },
  {
    key: 'auditoria',
    label: 'Auditoria / Compliance / Riscos',
    icon: '🔎',
    title: 'empresa de auditoria, compliance e gestão de riscos',
    analystRole: 'Analista especializado em marketing B2B para empresas de auditoria e compliance no Brasil',
    fields: [
      {
        key: 'tipo_servico',
        label: 'Tipo de serviço principal',
        type: 'select',
        options: ['Auditoria Independente (Externa)', 'Auditoria Interna', 'Compliance / LGPD', 'Gestão de Riscos', 'Controles Internos / SOX', 'Due Diligence', 'Governança Corporativa', 'Auditoria de TI / CISA', 'Múltiplos serviços'],
        placeholder: '',
      },
      {
        key: 'porte_cliente',
        label: 'Porte dos clientes-alvo',
        type: 'select',
        options: ['Pequenas empresas (MEI/ME)', 'Médias empresas', 'Grandes empresas', 'Empresas listadas em bolsa (CVM)', 'Instituições financeiras (BACEN)', 'Setor público', 'Multinacionais'],
        placeholder: '',
      },
      {
        key: 'modelo_cobranca',
        label: 'Modelo de cobrança',
        type: 'select',
        options: ['Por projeto (valor fixo)', 'Retainer mensal / anual', 'Por hora (time sheet)', 'Misto (projeto + retainer)'],
        placeholder: '',
      },
    ],
    promptContext: `
CONTEXTO DO NICHO — AUDITORIA / COMPLIANCE / RISCOS:
- Ciclo de venda longo (60–120 dias): decisão envolve CFO, CEO e Comitê de Auditoria
- CFC/CRC regulam a publicidade — foco em conteúdo técnico e autoridade, sem promessas de resultado
- LinkedIn é o canal principal: segmentação por cargo (CFO, Diretor Financeiro, Conselheiro)
- Empresas obrigadas por lei (CVM, BACEN, seguradoras, planos de saúde) são os leads mais quentes
- Conteúdo educativo regulatório (mudanças CVM, LGPD, reforma tributária) gera autoridade e leads orgânicos
- Relatórios, e-books e benchmarks do setor como iscas digitais convertem 4× mais que pitch direto
- Depoimento de CFO ou membro de Comitê de Auditoria é o maior gatilho de conversão
- E-mail marketing para base segmentada por setor é mais eficiente que mídia paga neste nicho
- LGPD, ESG e compliance de dados são as dores mais quentes em 2024–2025
`,
    productPlaceholder: 'Auditoria independente anual\nDiagnóstico de compliance LGPD\nGestão de riscos (retainer)\nDue diligence para M&A',
    objectiveLabels: {
      leads: 'Gerar reuniões com decisores (CFO/CEO)',
      vendas: 'Converter propostas em contratos assinados',
      brand: 'Construir autoridade técnica e credibilidade',
      retencao: 'Renovar contratos anuais e ampliar escopo',
    },
  },
]

// ── Lookup por keyword ─────────────────────────────────────────────────────────
const NICHE_KEYWORD_MAP: Record<string, string> = {
  // Móveis planejados
  'móveis planejados': 'moveis', 'moveis planejados': 'moveis', 'marcenaria': 'moveis',
  'móveis': 'moveis', 'moveis': 'moveis', 'planejados': 'moveis',

  // Clínicas
  'odontologia': 'clinica', 'clínica': 'clinica', 'clinica': 'clinica',
  'consultório': 'clinica', 'consultorio': 'clinica', 'saúde': 'clinica',
  'psicologia': 'clinica', 'nutrição': 'clinica', 'fisioterapia': 'clinica',
  'médico': 'clinica', 'medico': 'clinica', 'estética': 'clinica',

  // Imobiliário
  'imobiliário': 'imobiliario', 'imobiliaria': 'imobiliario', 'imóveis': 'imobiliario',
  'corretor': 'imobiliario', 'apartamento': 'imobiliario', 'incorporadora': 'imobiliario',

  // Fitness
  'academia': 'fitness', 'fitness': 'fitness', 'crossfit': 'fitness',
  'pilates': 'fitness', 'yoga': 'fitness', 'personal': 'fitness',

  // Restaurante
  'restaurante': 'restaurante', 'food': 'restaurante', 'alimentação': 'restaurante',
  'cafeteria': 'restaurante', 'pizzaria': 'restaurante', 'hamburgueria': 'restaurante',

  // E-commerce
  'e-commerce': 'ecommerce', 'ecommerce': 'ecommerce', 'loja': 'ecommerce',
  'varejo': 'ecommerce', 'moda': 'ecommerce',

  // Educação
  'educação': 'educacao', 'cursos': 'educacao', 'escola': 'educacao',
  'infoproduto': 'educacao', 'mentoria': 'educacao', 'ead': 'educacao',

  // Serviço local
  'advocacia': 'servico_local', 'jurídico': 'servico_local', 'contabilidade': 'servico_local',
  'construção': 'servico_local', 'reforma': 'servico_local', 'arquitetura': 'servico_local',
  'fotografia': 'servico_local', 'consultoria': 'servico_local',

  // Auditoria / Compliance
  'auditoria / compliance': 'auditoria', 'auditoria': 'auditoria', 'compliance': 'auditoria',
  'gestão de riscos': 'auditoria', 'controles internos': 'auditoria', 'sox': 'auditoria',
  'due diligence': 'auditoria', 'governança': 'auditoria', 'lgpd': 'auditoria',
}

export function getNicheConfig(nicheRaw: string): NicheConfig | null {
  if (!nicheRaw) return null
  const lower = nicheRaw.toLowerCase()

  // Match exato
  const exactKey = NICHE_KEYWORD_MAP[lower]
  if (exactKey) return NICHE_CONFIGS.find((c) => c.key === exactKey) || null

  // Match parcial
  for (const [keyword, key] of Object.entries(NICHE_KEYWORD_MAP)) {
    if (lower.includes(keyword) || keyword.includes(lower)) {
      return NICHE_CONFIGS.find((c) => c.key === key) || null
    }
  }

  return null
}

/** Injeta o contexto do nicho no prompt da API */
export function buildNichePromptContext(
  nicheRaw: string,
  nicheDetails: Record<string, string>
): string {
  const config = getNicheConfig(nicheRaw)
  if (!config) return ''

  const detailLines = Object.entries(nicheDetails)
    .filter(([, v]) => v)
    .map(([k, v]) => {
      const field = config.fields.find((f) => f.key === k)
      return `- ${field?.label || k}: ${v}`
    })
    .join('\n')

  return `
${config.promptContext}
${detailLines ? `\nDETALHES ESPECÍFICOS DO CLIENTE:\n${detailLines}` : ''}
`
}

export { NICHE_CONFIGS }
