// app/api/first-ad/route.ts — "Meu Primeiro Anúncio" para quem NUNCA anunciou.
// Gera um anúncio completo e PRONTO PARA PUBLICAR (copy + criativo + público +
// orçamento) e ensina a publicar — sem precisar de conta Meta conectada.
// Aditivo e isolado: não toca em nenhum fluxo existente.
import { NextRequest, NextResponse } from 'next/server'
import { gateAndCharge, refundGate } from '@/lib/gate'
import { sanitizeText } from '@/lib/sanitize'
import { getBenchmark } from '@/lib/niche_benchmarks'

export const maxDuration = 40

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

export async function POST(req: NextRequest) {
  const gate = await gateAndCharge('first_ad')
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  try {
    const body = await req.json().catch(() => ({}))
    const clientName = sanitizeText(body.clientName, 120)
    const niche = sanitizeText(body.niche, 120)
    const objective = sanitizeText(body.objective, 80) || 'leads'
    const city = sanitizeText(body.city, 80)
    const products = sanitizeText(body.products, 300)
    const pains = sanitizeText(body.mainPains, 300)
    const objection = sanitizeText(body.mainObjection, 200)
    const budgetMonthly = Number(body.budget) || 0
    if (!niche) { await refundGate(gate, 'first_ad'); return NextResponse.json({ error: 'Informe o segmento do negócio.' }, { status: 400 }) }

    // ── Orçamento de partida (determinístico, do benchmark) — começar pequeno p/ aprender ──
    const bench = getBenchmark(niche)
    const cplMin = bench?.cpl_min ?? 25
    const cplMax = bench?.cpl_max ?? 60
    const dailyBRL = clamp(Math.round((budgetMonthly > 0 ? budgetMonthly / 30 : 20)), 15, 40)
    const durationDays = 7
    const totalBRL = dailyBRL * durationDays
    const leadsMin = Math.max(1, Math.floor(totalBRL / cplMax))
    const leadsMax = Math.max(leadsMin, Math.floor(totalBRL / cplMin))

    // ── IA: gera as partes criativas (saída estruturada via tool use = JSON sempre válido) ──
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) { await refundGate(gate, 'first_ad'); return NextResponse.json({ error: 'IA não configurada.' }, { status: 500 }) }

    const prompt = `Você é um especialista em tráfego pago que ensina DONOS DE NEGÓCIO que NUNCA anunciaram a fazer o primeiro anúncio (Meta/Instagram). Linguagem simples, sem jargão.

Negócio: ${niche}${products ? ` — ${products}` : ''}${city ? ` · região: ${city}` : ''}.
Objetivo: ${objective}.
${pains ? `Dor que resolve: ${pains}.` : ''}${objection ? ` Objeção comum: ${objection}.` : ''}

Crie o PRIMEIRO anúncio (Instagram/Facebook). Deve ser autêntico e direto — iniciante não tem produção sofisticada. Use a ferramenta emit_first_ad com:
- platformWhy: por que começar no Instagram/Facebook (1-2 frases simples).
- headline: título curto e chamativo (máx 8 palavras).
- primaryText: texto principal do anúncio, pronto para colar — gancho na 1ª linha, benefício claro, e termina com chamada para ação. Use emojis com moderação e quebras de linha. Máx ~80 palavras.
- cta: o botão ideal (ex: "Enviar mensagem", "Saiba mais", "Chamar no WhatsApp").
- creativeIdea: que FOTO ou VÍDEO simples usar (algo que o dono consegue tirar com o celular).
- audienceAge: faixa etária a mirar (ex: "25 a 45 anos").
- audienceInterests: 3 a 5 interesses/segmentações da Meta, simples e relevantes.
- audienceNote: 1 dica de público para iniciante (não segmentar demais).
- tips: 3 boas práticas para quem está começando (ex: não julgar nos primeiros 3 dias, responder rápido, testar 2 imagens).`

    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const anthropic = new Anthropic({ apiKey })
    const message = await Promise.race([
      anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        tools: [{
          name: 'emit_first_ad',
          description: 'Retorna o primeiro anúncio pronto para o iniciante.',
          input_schema: {
            type: 'object',
            properties: {
              platformWhy: { type: 'string' },
              headline: { type: 'string' },
              primaryText: { type: 'string' },
              cta: { type: 'string' },
              creativeIdea: { type: 'string' },
              audienceAge: { type: 'string' },
              audienceInterests: { type: 'array', items: { type: 'string' } },
              audienceNote: { type: 'string' },
              tips: { type: 'array', items: { type: 'string' } },
            },
            required: ['platformWhy', 'headline', 'primaryText', 'cta', 'creativeIdea', 'audienceAge', 'audienceInterests', 'audienceNote', 'tips'],
          },
        }],
        tool_choice: { type: 'tool', name: 'emit_first_ad' },
        messages: [{ role: 'user', content: prompt }],
      }),
      new Promise<null>(resolve => setTimeout(() => resolve(null), 32000)),
    ])

    if (!message) { await refundGate(gate, 'first_ad'); return NextResponse.json({ error: 'A geração demorou demais — tente novamente.' }, { status: 504 }) }
    const tool = (message.content as any[]).find(b => b.type === 'tool_use') as any
    const ai = tool?.input
    if (!ai?.headline) { await refundGate(gate, 'first_ad'); return NextResponse.json({ error: 'Não consegui gerar o anúncio — tente novamente.' }, { status: 500 }) }

    // ── Passo a passo de publicação (fixo e correto — não deixar a IA inventar a UI) ──
    const howToPublish = {
      easy: {
        title: 'Mais fácil: impulsionar no Instagram',
        steps: [
          'Poste no feed do Instagram a foto/vídeo da ideia acima, com o texto principal na legenda.',
          'Abra o post e toque em "Impulsionar publicação".',
          `Objetivo: escolha "Mais mensagens" (ou "Mais visitas no perfil" se for atrair seguidores).`,
          `Público: use "Criar o seu" → idade ${ai.audienceAge}${city ? `, localização ${city} (raio de 15–25 km)` : ''}, e adicione os interesses sugeridos.`,
          `Orçamento: R$${dailyBRL}/dia por ${durationDays} dias (total R$${totalBRL}).`,
          'Revise e toque em "Impulsionar publicação". Pronto — seu primeiro anúncio está no ar! 🚀',
        ],
      },
      advanced: {
        title: 'No Gerenciador de Anúncios da Meta (mais controle)',
        steps: [
          'Acesse o Gerenciador de Anúncios (business.facebook.com/adsmanager) e clique em "Criar".',
          `Objetivo da campanha: "Leads" ou "Mensagens".`,
          `Conjunto de anúncios: localização ${city || 'sua cidade'} (raio 15–25 km), idade ${ai.audienceAge}, interesses sugeridos. Orçamento R$${dailyBRL}/dia.`,
          'Anúncio: faça o upload da foto/vídeo, cole o texto principal e o título, e escolha o botão de CTA.',
          'Publique e aguarde a aprovação (geralmente em até 1 hora).',
        ],
      },
    }

    return NextResponse.json({
      success: true,
      clientName,
      platform: { name: 'Instagram e Facebook (Meta)', why: ai.platformWhy },
      ad: { headline: ai.headline, primaryText: ai.primaryText, cta: ai.cta, creativeIdea: ai.creativeIdea },
      targeting: { age: ai.audienceAge, location: city || 'Sua cidade e região', interests: ai.audienceInterests, note: ai.audienceNote },
      budget: { dailyBRL, durationDays, totalBRL, cplRange: `R$${cplMin}–${cplMax}`, leadsMin, leadsMax },
      howToPublish,
      tips: ai.tips,
    })
  } catch (e: any) {
    await refundGate(gate, 'first_ad')
    console.error('[first-ad]', e?.message)
    return NextResponse.json({ error: e?.message || 'Erro ao gerar o primeiro anúncio.' }, { status: 500 })
  }
}
