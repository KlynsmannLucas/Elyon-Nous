// app/api/nous/route.ts — IA NOUS: assistente estratégica por nicho com fallback
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { fetchFocusedBenchmark } from '@/lib/tavily'
import { sanitizeText } from '@/lib/sanitize'

// Determina se o contexto contém dados reais de campanha (auditoria com Meta/Google Ads)
function detectContextDataQuality(context: string): 'real' | 'benchmark' | 'unavailable' {
  if (context.includes('ANÁLISE PROFUNDA — DADOS REAIS') || context.includes('Dados reais de campanha (Meta/Google Ads): SIM')) return 'real'
  if (context.includes('BENCHMARKS DO NICHO') || context.includes('Nicho:')) return 'benchmark'
  return 'unavailable'
}

// Fallback local quando Claude API está indisponível
function buildLocalReply(message: string, context: string): string {
  const msg = message.toLowerCase()

  const budgetMatch   = context.match(/Budget mensal:\s*R\$([0-9.,]+)/)
  const nicheMatch    = context.match(/Nicho:\s*([^\n]+)/)
  const cplMatch      = context.match(/CPL atual:\s*R\$([0-9.,]+)/)
  const revenueMatch  = context.match(/Faturamento mensal:\s*R\$([0-9.,]+)/)
  const desafioMatch  = context.match(/Maior desafio:\s*([^\n]+)/)
  const origemMatch   = context.match(/Origem de leads:\s*([^\n]+)/)
  const recomMatch    = context.match(/Recomendação estratégica atual:\s*([^\n]+)/)
  const problemaMatch = context.match(/Problema principal identificado:\s*([^\n]+)/)

  const budget   = budgetMatch?.[1]        || null
  const niche    = nicheMatch?.[1]?.trim() || 'seu nicho'
  const cpl      = cplMatch?.[1]           || null
  const revenue  = revenueMatch?.[1]       || null
  const desafio  = desafioMatch?.[1]?.trim() || null
  const origem   = origemMatch?.[1]?.trim()  || null
  const recom    = recomMatch?.[1]?.trim()   || null
  const problema = problemaMatch?.[1]?.trim() || null

  const temHistorico = context.includes('HISTÓRICO DE CAMPANHAS')
  const temVencedora = context.includes('resultado: vencedora')
  const temPerdedora = context.includes('resultado: perdedora')
  const temDadosReais = context.includes('Dados reais de campanha (Meta/Google Ads): SIM')

  const disclaimer = temDadosReais
    ? ''
    : '\n\n→ *Nota: sem dados reais de campanha conectados, estas referências são baseadas em benchmark do nicho.*'

  if (msg.includes('cpl') || msg.includes('custo por lead') || msg.includes('lead')) {
    const cplAtual = cpl
      ? `Com base nas informações fornecidas, seu CPL de R$${cpl}`
      : `Com base no benchmark do nicho ${niche}, o CPL`
    return `**CPL em ${niche}:**\n\n${cplAtual} pode ser reduzido com:\n\n→ **Segmentação cirúrgica** — públicos amplos inflam CPL em 40–60%. Lookalike de clientes reais costuma ter CPL 35% menor que interesses.\n→ **Rotação de criativos a cada 14 dias** — CTR cai, CPL sobe com o mesmo criativo rodando muito tempo.\n→ **Remarketing ativo** — leads não convertidos têm CPL 2–3× menor que tráfego frio.\n→ **Pausa automática** — qualquer grupo com CPL 30%+ acima da média por 3 dias: pause.${temHistorico && temVencedora ? '\n\n→ Há campanhas vencedoras no histórico declarado — replique o canal e ângulo que funcionou.' : ''}${disclaimer}`
  }

  if (msg.includes('criativ') || msg.includes('anúncio') || msg.includes('copy')) {
    return `**Criativos para ${niche}:**\n\n→ **Vídeo 15–30s:** problema real → solução → resultado → CTA. Melhor formato atual.\n→ **Antes/depois real:** funciona bem para nichos de transformação.\n→ **Depoimento em vídeo (30–60s):** o cliente fala por você — mais persuasivo que texto.\n\n**3 ângulos para testar (referência de mercado para ${niche}):**\n1. Dor: "Cansado de [problema específico do ${niche}]?"\n2. Aspiração: "Como [resultado desejado] em X dias"\n3. Prova: "[Nome] conseguiu [resultado] — veja como"\n\nRegra: 7 dias de dados → pause os 2 piores → escale o melhor.${disclaimer}`
  }

  if (msg.includes('priorizar') || msg.includes('prioridade') || msg.includes('começar') || msg.includes('primeiro')) {
    const budgetInfo = budget ? ` Com R$${budget}/mês (informações fornecidas)` : ''
    return `**Prioridades para ${niche}:${budgetInfo}**\n\n${problema ? `Problema configurado: "${problema}"\n\n` : ''}1. **Pixel e tracking** — sem dados, tudo é achismo. Valide eventos antes de gastar.\n2. **1 canal, não 5** — valide um canal completamente antes de diversificar.\n3. **CPL máximo de corte** — defina o número e pause quando ultrapassar.\n4. **Follow-up em 5 minutos** — lead que não atende em 5 min tem 80% menos chance de fechar.\n5. **3 criativos diferentes** — dor, aspiração e prova social.${desafio ? `\n\nSeu maior desafio configurado ("${desafio}") → foco total nisso antes de qualquer outra coisa.` : ''}${disclaimer}`
  }

  if (msg.includes('escal') || msg.includes('crescer') || msg.includes('aumentar')) {
    return `**Como escalar ${niche} com segurança:**\n\n→ Só escale com 7+ dias de CPL estável abaixo do benchmark do nicho.\n→ **+15–20% de budget por semana** — saltos grandes resetam o aprendizado do algoritmo.\n→ **Duplique** a campanha vencedora — não edite a original.\n→ Expanda público gradualmente: 1% lookalike → 2% → 3%.\n→ Tenha criativos novos prontos — ao escalar o algoritmo os queima mais rápido.\n${budget ? `\nCom R$${budget}/mês (informado), o próximo patamar seria ~R$${Math.round(Number(budget.replace(/\./g,'').replace(',','.')) * 1.3).toLocaleString('pt-BR')}/mês após validação.` : ''}${disclaimer}`
  }

  if (msg.includes('conversão') || msg.includes('converter') || msg.includes('fechar') || msg.includes('venda')) {
    return `**Aumentar conversão em ${niche}:**\n\n→ **5 minutos** — contato imediato após o lead é o maior alavancador de fechamento.\n→ **Qualifique antes de propor** — 2–3 perguntas antes de apresentar preço.\n→ **Não venda na 1ª mensagem** — entenda o problema, depois apresente a solução.\n→ Leads frios (>24h sem resposta): sequência de 3 mensagens em 7 dias.${temHistorico && temPerdedora ? '\n\n→ O histórico declarado indica campanhas com baixa qualidade de lead — alinhe criativo com o perfil que o time de vendas recebe.' : ''}${disclaimer}`
  }

  if (msg.includes('desperdício') || msg.includes('cortar') || msg.includes('otimizar') || msg.includes('budget')) {
    return `**Onde costuma estar o desperdício em ${niche}:**\n\n${origem ? `Canal principal informado: ${origem}.` : ''} Maiores desperdiçadores de referência:\n\n→ **Públicos amplos sem dados** — leads sem intenção real.\n→ **Criativos rodando >21 dias** — CPL sobe ~40% depois desse período.\n→ **Budget fragmentado** — sem massa crítica em nenhum canal.\n→ **Sem remarketing** — 60–70% dos leads precisam de mais de 1 contato para converter.\n\n→ Para identificar onde *especificamente* você está perdendo verba, conecte Meta Ads ou Google Ads e rode a Análise Profunda.`
  }

  if (msg.includes('canal') || msg.includes('plataforma') || msg.includes('onde anunciar')) {
    return `**Canais para ${niche} — referência de mercado:**\n\n${recom ? `Estratégia gerada: "${recom}"\n\n` : ''}→ Priorize o canal onde seu público já tem **intenção** (Google) antes de trabalhar **descoberta** (Meta/TikTok).\n→ Teste 1 canal por mês — dados limpos valem mais que diversificação prematura.\n→ Google Local + GMB: canal gratuito de alto retorno para negócios locais.\n\n→ Para comparar canais com dados reais das suas campanhas, conecte as contas.${disclaimer}`
  }

  if (msg.includes('serviço') || msg.includes('produto') || msg.includes('oferta') || msg.includes('negócio')) {
    return `**Negócio — ${niche}:**\n\n${revenue ? `Faturamento informado: R$${revenue}/mês.` : ''}${budget ? ` Budget informado: R$${budget}/mês.` : ''}\n\n→ **Posicionamento:** o cliente precisa entender em 5 segundos o que você faz e por que você, não o concorrente.\n→ **Oferta de entrada:** produto de menor risco facilita a primeira compra.\n→ **LTV:** clientes recorrentes valem 5× mais — pense em upsell antes de só adquirir.\n→ **Prova social:** nenhum criativo converte melhor que resultado real de cliente real.`
  }

  const linhas: string[] = [`**NOUS · ${niche}${temDadosReais ? ' · dados reais' : ' · benchmark'}:**\n`]
  if (problema) linhas.push(`→ Problema configurado: "${problema}"`)
  if (desafio)  linhas.push(`→ Maior desafio configurado: "${desafio}"`)
  if (recom)    linhas.push(`→ ${recom}`)
  if (!temDadosReais) linhas.push('\n→ *Ainda não há dados reais de campanha. Conecte Meta Ads/Google Ads ou rode a Análise Profunda para análise baseada nos seus números.*')
  linhas.push('\nMe faça uma pergunta específica — CPL, criativos, canal, conversão, escala.')

  return linhas.join('\n')
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

  const { rateLimit } = await import('@/lib/rateLimit')
  const rl = rateLimit(userId, 'nous', { max: 20, windowSec: 3600 })
  if (!rl.ok) {
    const waitSec = rl.retryAfterSec ?? 3600
    const minutesLeft = Math.ceil(waitSec / 60)
    return NextResponse.json({
      success: false,
      error: `Você atingiu o limite de 20 mensagens por hora. Aguarde ${minutesLeft} minuto${minutesLeft !== 1 ? 's' : ''} antes de tentar novamente.`,
    }, { status: 429, headers: { 'Retry-After': String(waitSec) } })
  }

  // Sempre busca do Clerk diretamente — JWT pode estar cacheado sem o plano atualizado
  const { clerkClient } = await import('@clerk/nextjs/server')
  const clerkUser = await (await clerkClient()).users.getUser(userId)
  const plan = (clerkUser.publicMetadata as any)?.plan as string | undefined
  const hasActivePlan = plan && plan !== 'free'
  let effectivePlan = plan || 'free'

  if (!hasActivePlan) {
    const createdAtMs = typeof clerkUser.createdAt === 'number' ? clerkUser.createdAt : new Date(clerkUser.createdAt as any).getTime()
    const inTrial = (Date.now() - createdAtMs) < 14 * 24 * 60 * 60 * 1000
    if (!inTrial) {
      return NextResponse.json({ success: false, error: 'Período de avaliação encerrado. Assine um plano para continuar.' }, { status: 402 })
    }
    effectivePlan = 'trial'
  }

  const { checkAndDeductCredits } = await import('@/lib/credits')
  const creditResult = await checkAndDeductCredits(userId, effectivePlan, 'nous_chat')
  if (!creditResult.allowed) {
    return NextResponse.json({ success: false, error: creditResult.error }, { status: 402 })
  }

  try {
    const { message: _msg, context, history, niche: _ni, city, hasRealData, viewMode, nicheProfile } = await req.json()
    const isSimpleMode = viewMode === 'simple'
    const isHealthBroker = nicheProfile === 'health_insurance_broker'
    const message = sanitizeText(_msg, 600)
    const niche   = sanitizeText(_ni, 120)
    const dataSource = hasRealData ? 'real' : (context?.includes('BENCHMARKS DO NICHO') ? 'benchmark' : 'unavailable')

    // 1 query focada (Tavily + grounding do Gemini) no tópico — rápida, não bloqueia o chat
    const topicMatch = message.match(/cpl|roas|benchmark|tendência|custo por lead|canal|criativo|sazonalidade/i)
    const realtimeData = topicMatch && niche
      ? await Promise.race([
          (async () => {
            const { fetchFocusedGrounded } = await import('@/lib/gemini')
            const [tav, gem] = await Promise.allSettled([
              fetchFocusedBenchmark(niche, topicMatch[0], city),
              fetchFocusedGrounded(niche, topicMatch[0], city),
            ])
            return [
              tav.status === 'fulfilled' ? tav.value : '',
              gem.status === 'fulfilled' ? gem.value : '',
            ].filter(Boolean).join('\n')
          })().catch(() => ''),
          new Promise<string>(res => setTimeout(() => res(''), 3500)),
        ])
      : ''

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (apiKey) {
      try {
        const { default: Anthropic } = await import('@anthropic-ai/sdk')
        const anthropic = new Anthropic({ apiKey })

        const systemPrompt = `Você é a NOUS — a analista estratégica sênior da plataforma ELYON. Você tem 10 anos de experiência em tráfego pago, funis de aquisição e crescimento de negócios no Brasil.

CONTEXTO DO CLIENTE (leia os rótulos de cada seção antes de responder):
${context}
${realtimeData ? `\nDADOS EXTERNOS DE MERCADO (Tavily — fonte externa, não da conta):\n${realtimeData}` : ''}

══════════════════════════════════════════
REGRAS DE ORIGEM DOS DADOS — INEGOCIÁVEIS
══════════════════════════════════════════
Cada seção do contexto está rotulada com seu tipo. Use esses rótulos para saber o que pode afirmar como fato real.

• [STATUS DOS DADOS — LEIA PRIMEIRO]: indica se há dados reais de campanha. Se disser "NÃO", não afirme ter analisado campanhas reais.
• [ANÁLISE PROFUNDA — DADOS REAIS]: métricas extraídas do Meta/Google Ads via auditoria. Use: "com base nos dados reais da conta..."
• [DADOS DECLARADOS PELO USUÁRIO]: valores que o usuário configurou manualmente (budget, CPL estimado, faturamento). Use: "com base nas informações fornecidas..."
• [UNIT ECONOMICS]: calculado a partir dos dados declarados. Use: "com base nos números informados..."
• [BENCHMARKS DO NICHO]: dados de mercado estimados — NÃO são métricas da conta. Use: "com base no benchmark do nicho [nome]..."
• [SAZONALIDADE DO NICHO] e [ÂNGULOS DE CRIATIVO]: estimativas de mercado. Use: "estimativa para o nicho..."
• [HISTÓRICO DE CAMPANHAS]: declarado pelo usuário, não extraído de plataforma. Use: "no histórico declarado..."

PROIBIÇÕES ABSOLUTAS:
1. Se [STATUS DOS DADOS] indicar "NÃO" para dados reais: NUNCA diga "suas campanhas estão..." ou "analisando sua conta...". Diga: "Ainda não tenho dados reais de campanha para afirmar isso com precisão."
2. NUNCA apresente benchmark como métrica real da conta.
3. NUNCA invente números que não estão no contexto.
4. Quando dados forem ausentes ou limitados, inclua: "→ Para análise mais precisa: conecte Meta Ads/Google Ads ou rode a Análise Profunda."

══════════════════════════════════
REGRAS DE RESPOSTA
══════════════════════════════════
1. Cite números, mas sempre com a origem clara (veja rótulos acima)
2. Quando houver [ANÁLISE PROFUNDA — DADOS REAIS] ou histórico declarado, analise o que funcionou/falhou
3. Dê uma recomendação principal clara — o que fazer AGORA
4. Use negrito apenas nos pontos mais importantes, não em tudo
5. Máximo 6 linhas — seja direta como mentor sênior
6. Postura: direta, sem "ótima pergunta" ou "posso ajudar com"
7. Perguntas fora de marketing: responda brevemente, redirecione para o negócio

Você não é um chatbot. Você é a analista que conhece este cliente — mas só pode afirmar o que os dados realmente confirmam.
${isSimpleMode ? `
══════════════════════════════════
MODO SIMPLIFICADO — ATIVO
══════════════════════════════════
O usuário é dono de um pequeno/médio negócio e NÃO entende termos técnicos de marketing.
- Fale como um consultor explicando para o dono do negócio, não como especialista para outro especialista.
- EVITE jargão. Em vez de "CTR baixo", diga "poucas pessoas estão clicando no seu anúncio". Em vez de "CPL alto", diga "cada possível cliente está saindo caro". Em vez de "ROAS abaixo do break-even", diga "o dinheiro investido ainda não está voltando como deveria".
- Sempre termine com UMA ação prática e simples (ex: "teste uma nova imagem no anúncio", "coloque mais verba na campanha que traz clientes mais baratos").
- Seja claro e acolhedor, mas não infantil. Máximo 5 linhas.` : `
══════════════════════════════════
MODO AVANÇADO — ATIVO
══════════════════════════════════
O usuário é gestor de tráfego / analista. Use linguagem técnica precisa (CTR, CPL, CPA, ROAS, frequência, fadiga criativa, sobreposição de público, break-even) e recomendações de mídia paga de nível especialista.`}
${isHealthBroker ? `
══════════════════════════════════
NICHO — CORRETOR DE PLANO DE SAÚDE
══════════════════════════════════
O usuário é corretor de plano de saúde. Use o vocabulário do nicho: "contato no WhatsApp" (não "lead"), "perfil para contratar", "cotação", "proposta", "contrato fechado" (não "venda"), "comissão" (não "faturamento"), "vidas", "carência", "rede credenciada", "coparticipação", "MEI/PME/empresarial".
Foque em: qualificação no WhatsApp, velocidade de resposta, follow-up pós-cotação (2h/24h/48h), separação de campanhas por tipo de plano, e registro de motivo de perda (preço, carência, rede, região, sem CNPJ).
COMPLIANCE — OBRIGATÓRIO: nunca prometa aprovação, preço final ou ausência de carência sem validação da operadora. Não incentive coleta de dados sensíveis desnecessários. Oriente o corretor a deixar claro ao contato como os dados serão usados.` : ''}`

        const messages: { role: 'user' | 'assistant'; content: string }[] = [
          ...(history || []),
          { role: 'user', content: message },
        ]

        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 800,
          system: systemPrompt,
          messages,
        })

        const reply = (response.content[0] as any).text.trim()
        return NextResponse.json({ success: true, reply, dataSource })

      } catch (aiError: any) {
        console.warn('NOUS API falhou, tentando Gemini / fallback local:', aiError.message)

        // Fallback aditivo: tenta o Gemini antes do fallback local por regras.
        try {
          const { callGemini, geminiModel, isGeminiEnabled } = await import('@/lib/gemini')
          if (isGeminiEnabled()) {
            const reply = await callGemini({
              model: geminiModel('FALLBACK'),
              system: `Você é o Nous, consultor sênior de growth e tráfego pago no Brasil. Responda em português, direto ao ponto, usando o contexto abaixo.\n\n${context}`,
              user: message,
              maxTokens: 800,
              timeoutMs: 18000,
            })
            return NextResponse.json({ success: true, reply, dataSource })
          }
        } catch (gemErr: any) {
          console.warn('Gemini (NOUS) também falhou, usando fallback local:', gemErr.message)
        }
      }
    }

    // Fallback local inteligente
    const reply = buildLocalReply(message, context)
    return NextResponse.json({ success: true, reply, dataSource: 'local' })

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
