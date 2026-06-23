// app/api/competitor-xray/route.ts — RAIO-X DE CONCORRENTES (pesquisa web + IA).
// A API da Biblioteca de Anúncios da Meta NÃO entrega anúncios comerciais no Brasil
// (só políticos), então o Raio-X usa PESQUISA WEB (Tavily + grounding do Gemini)
// sobre o concorrente — site, ofertas, redes, reputação — e o NOUS sintetiza:
// ângulos/posicionamento, a aposta, a brecha e o contra-ataque.
import { NextRequest, NextResponse } from 'next/server'
import { gateAndCharge, refundGate } from '@/lib/gate'
import { sanitizeText } from '@/lib/sanitize'

export const maxDuration = 45

export async function POST(req: NextRequest) {
  const gate = await gateAndCharge('competitor_xray')
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  try {
    const body = await req.json().catch(() => ({}))
    const competitor = sanitizeText(body.competitor, 80)
    const niche = sanitizeText(body.niche, 120)
    const city = sanitizeText(body.city, 80)
    const myAngles = sanitizeText(body.myAngles, 400)
    if (!competitor) { await refundGate(gate, 'competitor_xray'); return NextResponse.json({ error: 'Informe o nome do concorrente.' }, { status: 400 }) }

    // ── 1) Pesquisa web sobre o concorrente ───────────────────────────────────
    let webContext = ''
    try {
      const tvKey = process.env.TAVILY_API_KEY
      if (tvKey) {
        const { searchTavily } = await import('@/lib/tavily')
        const queries = [
          `${competitor} ${niche} ${city} ofertas promoções diferenciais site`,
          `${competitor} avaliações reputação reclame aqui redes sociais`,
        ]
        const r = await Promise.all(queries.map(q => searchTavily(q, tvKey).catch(() => '')))
        webContext = r.filter(Boolean).join('\n\n')
      }
    } catch { /* segue sem Tavily */ }
    if (!webContext) {
      try {
        const { fetchFocusedGrounded, isGeminiEnabled } = await import('@/lib/gemini')
        if (isGeminiEnabled()) webContext = await fetchFocusedGrounded(niche || 'mercado', competitor, city)
      } catch { /* segue sem grounding */ }
    }
    const hasWeb = webContext.trim().length > 40

    // ── 2) IA sintetiza a inteligência competitiva (structured output) ─────────
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) { await refundGate(gate, 'competitor_xray'); return NextResponse.json({ error: 'IA não configurada.' }, { status: 500 }) }

    const prompt = `Você é um analista sênior de inteligência competitiva de marketing no Brasil.
Concorrente analisado: "${competitor}"${niche ? ` · nicho: ${niche}` : ''}${city ? ` · região: ${city}` : ''}.
${myAngles ? `Ângulos/ofertas que MEU cliente já usa: ${myAngles}\n` : ''}
${hasWeb
  ? `Pesquisa na web sobre o concorrente (use como base factual):\n${webContext.slice(0, 2800)}`
  : 'NÃO foi encontrada informação pública relevante sobre este concorrente. Baseie a análise nos padrões TÍPICOS desse nicho/região no Brasil e deixe claro (no texto) que são hipóteses a validar.'}

Identifique de 2 a 4 ÂNGULOS/posicionamentos que esse concorrente provavelmente usa (oferta principal, mensagem/promessa, diferencial percebido), cada um com a intensidade (forte/média/leve) com que ele aposta nisso. Depois aponte: a APOSTA principal dele, a BRECHA (ângulo forte que meu cliente NÃO explora) e o CONTRA-ATAQUE acionável. Use a ferramenta emit_xray.`

    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const anthropic = new Anthropic({ apiKey })
    const message = await Promise.race([
      anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        tools: [{
          name: 'emit_xray',
          description: 'Retorna a análise de inteligência competitiva.',
          input_schema: {
            type: 'object',
            properties: {
              angles: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    label: { type: 'string', description: 'nome curto do ângulo/oferta' },
                    messaging: { type: 'string', description: 'a mensagem/promessa que ele usa' },
                    intensity: { type: 'string', enum: ['forte', 'média', 'leve'] },
                  },
                  required: ['label', 'messaging', 'intensity'],
                },
              },
              bet: { type: 'string', description: 'a aposta principal do concorrente (1 frase)' },
              gap: { type: 'string', description: 'a brecha: ângulo forte que meu cliente não explora (1 frase)' },
              counterMove: { type: 'string', description: 'contra-ataque acionável (1-2 frases)' },
            },
            required: ['angles', 'bet', 'gap', 'counterMove'],
          },
        }],
        tool_choice: { type: 'tool', name: 'emit_xray' },
        messages: [{ role: 'user', content: prompt }],
      }),
      new Promise<null>(resolve => setTimeout(() => resolve(null), 34000)),
    ])

    if (!message) { await refundGate(gate, 'competitor_xray'); return NextResponse.json({ error: 'A análise demorou demais — tente novamente.' }, { status: 504 }) }
    const tool = (message.content as any[]).find(b => b.type === 'tool_use') as any
    const analysis = tool?.input
    if (!analysis?.angles) { await refundGate(gate, 'competitor_xray'); return NextResponse.json({ error: 'Não consegui montar a análise — tente novamente.' }, { status: 500 }) }

    return NextResponse.json({ success: true, competitor, hasWeb, analysis })
  } catch (e: any) {
    await refundGate(gate, 'competitor_xray')
    console.error('[competitor-xray]', e?.message)
    return NextResponse.json({ error: e?.message || 'Erro no Raio-X.' }, { status: 500 })
  }
}
