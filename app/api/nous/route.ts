// app/api/nous/route.ts — IA NOUS: assistente estratégica por nicho com fallback
import { NextRequest, NextResponse } from 'next/server'
import { fetchRealtimeBenchmarks } from '@/lib/tavily'

// Resposta inteligente usando os dados reais do cliente extraídos do context
function buildLocalReply(message: string, context: string): string {
  const msg = message.toLowerCase()

  // Extrai dados do contexto para personalizar a resposta
  const budgetMatch   = context.match(/Budget:\s*R\$([0-9.,]+)/)
  const nicheMatch    = context.match(/Nicho:\s*([^\n]+)/)
  const cplMatch      = context.match(/CPL atual:\s*R\$([0-9.,]+)/)
  const revenueMatch  = context.match(/Faturamento:\s*R\$([0-9.,]+)/)
  const desafioMatch  = context.match(/Maior desafio:\s*([^\n]+)/)
  const origemMatch   = context.match(/Origem de leads:\s*([^\n]+)/)
  const recomMatch    = context.match(/Recomendação estratégica atual:\s*([^\n]+)/)
  const problemaMatch = context.match(/Problema principal identificado:\s*([^\n]+)/)

  const budget  = budgetMatch?.[1]  || null
  const niche   = nicheMatch?.[1]?.trim()  || 'seu nicho'
  const cpl     = cplMatch?.[1]    || null
  const revenue = revenueMatch?.[1] || null
  const desafio = desafioMatch?.[1]?.trim() || null
  const origem  = origemMatch?.[1]?.trim()  || null
  const recom   = recomMatch?.[1]?.trim()   || null
  const problema = problemaMatch?.[1]?.trim() || null

  // Extrai histórico de campanhas do contexto
  const temHistorico = context.includes('Histórico de campanhas')
  const temVencedora = context.includes('resultado: vencedora')
  const temPerdedora = context.includes('resultado: perdedora')

  if (msg.includes('cpl') || msg.includes('custo por lead') || msg.includes('lead')) {
    const cplAtual = cpl ? `Seu CPL atual de R$${cpl}` : 'Seu CPL atual'
    return `**Reduzir CPL em ${niche}:**\n\n${cplAtual} pode ser melhorado com:\n\n→ **Segmentação cirúrgica** — públicos amplos inflam CPL em 40–60%. No seu nicho, lookalike de clientes reais costuma ter CPL 35% menor que interesses.\n→ **Rotação de criativos a cada 14 dias** — CTR cai, CPL sobe com o mesmo criativo rodando muito tempo.\n→ **Remarketing ativo** — visitantes e leads não convertidos têm CPL 2–3× menor que tráfego frio.\n→ **Pausa automática** — qualquer grupo com CPL 30%+ acima da média por 3 dias consecutivos: pause sem hesitar.${temHistorico && temVencedora ? '\n\n→ Você tem campanhas vencedoras no histórico — replique o canal e ângulo de criativo que funcionou.' : ''}`
  }

  if (msg.includes('criativ') || msg.includes('anúncio') || msg.includes('copy')) {
    return `**Criativos para ${niche}:**\n\n→ **Vídeo 15–30s:** problema real → solução → resultado → CTA. Melhor formato agora.\n→ **Antes/depois real:** funciona bem para nichos de transformação — mais CTR que qualquer copy.\n→ **Depoimento em vídeo (30–60s):** o cliente fala por você — mais persuasivo que texto.\n\n**3 ângulos para testar em paralelo:**\n1. Dor: "Cansado de [problema específico do ${niche}]?"\n2. Aspiração: "Como [resultado desejado] em X dias"\n3. Prova: "[Nome] conseguiu [resultado] — veja como"\n\nRegra: 7 dias de dados → pause os 2 piores → escale o melhor.`
  }

  if (msg.includes('priorizar') || msg.includes('prioridade') || msg.includes('começar') || msg.includes('primeiro')) {
    const budgetInfo = budget ? ` Com R$${budget}/mês` : ''
    return `**Prioridades para ${niche}:${budgetInfo}**\n\n${problema ? `Problema identificado: "${problema}"\n\n` : ''}1. **Pixel e tracking** — sem dados, tudo é achismo. Valide eventos antes de gastar.\n2. **1 canal, não 5** — valide um canal completamente antes de diversificar.\n3. **CPL máximo de corte** — defina o número e discipline-se a pausar quando ultrapassar.\n4. **Follow-up em 5 minutos** — lead que não atende em 5 min tem 80% menos chance de fechar.\n5. **3 criativos diferentes** — ângulo de dor, aspiração e prova social. Veja qual vence.${desafio ? `\n\nSeu maior desafio ("${desafio}") → foco total nisso antes de qualquer outra coisa.` : ''}`
  }

  if (msg.includes('escal') || msg.includes('crescer') || msg.includes('aumentar')) {
    return `**Como escalar ${niche} com segurança:**\n\n→ Só escale com 7+ dias de CPL estável abaixo do benchmark.\n→ **+15–20% de budget por semana** — saltos grandes resetam o aprendizado do algoritmo.\n→ **Duplique** a campanha vencedora — não edite a original.\n→ Expanda público gradualmente: 1% lookalike → 2% → 3%.\n→ Tenha criativos novos prontos — ao escalar, o algoritmo os queima mais rápido.\n${budget ? `\nCom R$${budget}/mês, o próximo patamar é R$${Math.round(Number(budget.replace(',','')) * 1.3).toLocaleString('pt-BR')}/mês após validação.` : ''}`
  }

  if (msg.includes('conversão') || msg.includes('converter') || msg.includes('fechar') || msg.includes('venda')) {
    return `**Aumentar conversão em ${niche}:**\n\n→ **5 minutos** — contato imediato após o lead é o maior alavancador de fechamento.\n→ **Qualifique antes de propor** — 2–3 perguntas no WhatsApp antes de apresentar preço.\n→ **Objeções do ${niche}:** preço, timing e "vou pensar" são as mais comuns. Prepare respostas.\n→ **Não venda na 1ª mensagem** — entenda o problema, depois apresente a solução.\n→ Leads frios (>24h sem resposta): sequência de 3 mensagens em 7 dias — última com gatilho de escassez.${temHistorico && temPerdedora ? '\n\n→ Suas campanhas perdedoras indicam problema de qualidade de lead — alinhe o criativo com o que o time de vendas recebe.' : ''}`
  }

  if (msg.includes('desperdício') || msg.includes('cortar') || msg.includes('otimizar') || msg.includes('budget')) {
    return `**Onde está o desperdício em ${niche}:**\n\n${origem ? `Você usa ${origem} como principal canal.` : ''} Os maiores desperdiçadores:\n\n→ **Públicos amplos sem dados** — geram volume, mas leads sem intenção real.\n→ **Criativos rodando >21 dias** — CPL aumenta ~40% depois desse período.\n→ **Budget fragmentado em muitos canais** — sem massa crítica em nenhum.\n→ **Sem remarketing** — 60–70% dos leads precisam de mais de 1 contato para converter.\n→ **Horário errado** — ${niche} tem horários pico específicos. Concentre entrega neles.`
  }

  if (msg.includes('canal') || msg.includes('plataforma') || msg.includes('onde anunciar')) {
    return `**Melhores canais para ${niche}:**\n\n${recom ? `Análise atual: "${recom}"\n\n` : ''}→ Priorize o canal onde seu público já tem **intenção** (Google) antes de trabalhar **descoberta** (Meta/TikTok).\n→ Teste 1 canal por mês — dados limpos valem mais que diversificação prematura.\n→ Google Local + GMB é canal gratuito de alto retorno para negócios locais — muitos ignoram.\n→ WhatsApp como canal de nutrição (custo zero) depois que o lead entra.`
  }

  if (msg.includes('serviço') || msg.includes('produto') || msg.includes('oferta') || msg.includes('negócio')) {
    return `**Análise do negócio — ${niche}:**\n\n${revenue ? `Faturamento atual de R$${revenue}/mês.` : ''}${budget ? ` Budget de R$${budget}/mês.` : ''}\n\n→ **Posicionamento:** o cliente precisa entender em 5 segundos o que você faz e por que você, não o concorrente.\n→ **Oferta de entrada:** produto/serviço de menor risco facilita a primeira compra e abre a relação.\n→ **LTV:** clientes recorrentes valem 5× mais — pense em upsell e recorrência antes de só adquirir.\n→ **Prova social visível:** nenhum criativo converte melhor que resultado real de cliente real.`
  }

  // Resposta contextualizada com dados reais quando não encaixa em categoria específica
  const linhas: string[] = [`**NOUS · ${niche}:**\n`]
  if (problema) linhas.push(`→ Problema identificado: "${problema}"`)
  if (desafio)  linhas.push(`→ Seu maior desafio: "${desafio}"`)
  if (recom)    linhas.push(`→ ${recom}`)
  linhas.push('\nMe faça uma pergunta específica — CPL, criativos, canal, conversão, escala — e entrego uma análise precisa para o seu caso.')

  return linhas.join('\n')
}

export async function POST(req: NextRequest) {
  try {
    const { message, context, history, niche, city } = await req.json()

    // Busca dados em tempo real se a pergunta for sobre benchmarks/mercado
    const needsRealtime = /cpl|roas|benchmark|mercado|média|custo|canal|tendência/i.test(message)
    const realtimeData = needsRealtime && niche
      ? await fetchRealtimeBenchmarks(niche, city).catch(() => '')
      : ''

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (apiKey) {
      try {
        const { default: Anthropic } = await import('@anthropic-ai/sdk')
        const anthropic = new Anthropic({ apiKey })

        const systemPrompt = `Você é a NOUS — analista estratégica de crescimento da plataforma ELYON, especializada em marketing digital para o mercado brasileiro.

Você tem acesso ao contexto completo do cliente:
${context}
${realtimeData ? `\nDADOS DE MERCADO EM TEMPO REAL:\n${realtimeData}` : ''}

Sua forma de responder:
- Direta, estratégica e orientada a dados — sem enrolação
- Use **negrito** para destacar pontos-chave
- Máximo 5–6 linhas por resposta, salvo quando solicitado mais detalhe
- Sempre pense como dono do negócio: cada resposta deve impactar receita, eficiência ou escala
- Quando houver dados reais (histórico de campanhas, CPL atual), use-os na resposta
- Nunca seja genérica — adapte ao nicho e à situação específica do cliente

Você não é um chatbot genérico. Você é a analista estratégica deste cliente específico.`

        const messages: { role: 'user' | 'assistant'; content: string }[] = [
          ...(history || []),
          { role: 'user', content: message },
        ]

        const response = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 600,
          system: systemPrompt,
          messages,
        })

        const reply = (response.content[0] as any).text.trim()
        return NextResponse.json({ success: true, reply })

      } catch (aiError: any) {
        console.warn('NOUS API falhou, usando fallback local:', aiError.message)
      }
    }

    // Fallback local inteligente
    const reply = buildLocalReply(message, context)
    return NextResponse.json({ success: true, reply, source: 'local' })

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
