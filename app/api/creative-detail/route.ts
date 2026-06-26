// app/api/creative-detail/route.ts — ANÁLISE DE UM ÚNICO CRIATIVO (sob demanda, no clique).
// Mais barato/rápido que o lote: o usuário analisa só o criativo que abrir. Lê a cópia +
// métricas reais daquele anúncio e devolve ângulo, gancho, tom, fadiga e dica específicos.
import { NextRequest, NextResponse } from 'next/server'
import { gateAndCharge, refundGate } from '@/lib/gate'
import { sanitizeText } from '@/lib/sanitize'
import { getClientMemoryContext } from '@/lib/memory'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const gate = await gateAndCharge('creative_detail')
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  try {
    const body = await req.json().catch(() => ({}))
    const niche = sanitizeText(body.niche, 120)
    const clientName = sanitizeText(body.clientName, 120)
    const c = body.creative || {}
    const copy = sanitizeText([c.title, c.body].filter(Boolean).join(' — '), 280)
    const name = sanitizeText(c.name || c.title || '', 80)
    if (!copy && !name) {
      await refundGate(gate, 'creative_detail')
      return NextResponse.json({ error: 'Criativo sem texto para analisar.' }, { status: 400 })
    }
    const metrics = `formato ${c.format || 'imagem'} · CTR ${Number(c.ctr) || 0}% · CPL R$${Number(c.cpl) || 0} · frequência ${Number(c.frequency) || 0}× · ${Number(c.leads) || 0} leads · ${c.ageDays != null ? `${c.ageDays}d no ar` : 'ativo'}`

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) { await refundGate(gate, 'creative_detail'); return NextResponse.json({ error: 'IA não configurada.' }, { status: 500 }) }

    const memory = clientName ? await getClientMemoryContext(gate.userId!, clientName, niche).catch(() => '') : ''

    const prompt = `Você é um diretor de criação de tráfego pago no Brasil${niche ? ` (nicho: ${niche})` : ''}. Analise ESTE criativo de Meta Ads de forma específica e curta (sem encher de texto):
Criativo: "${copy || name}"
Métricas (30d): ${metrics}
${memory}
Frequência ≥3.5× indica fadiga (público saturado). CPL menor e CTR maior = melhor.${memory ? ' Considere a memória do histórico deste cliente ao avaliar (ângulos que já vencem/falham).' : ''}
Diga: o ângulo, o gancho (a abertura/promessa), o tom (1-2 palavras), se está fatigado (e por quê, curtíssimo), o que funciona nele, e 1 dica acionável de melhoria. Use a ferramenta emit_detail.`

    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const anthropic = new Anthropic({ apiKey })
    const message = await Promise.race([
      anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 700,
        tools: [{
          name: 'emit_detail',
          description: 'Retorna a análise específica deste criativo.',
          input_schema: {
            type: 'object',
            properties: {
              angle: { type: 'string', description: 'o ângulo deste criativo (curto)' },
              hook: { type: 'string', description: 'o gancho/abertura que ele usa (curto)' },
              tone: { type: 'string', description: 'o tom em 1-2 palavras (ex.: urgência, emocional, prova social, promocional)' },
              fatigued: { type: 'boolean', description: 'se está fatigado' },
              fatigue_note: { type: 'string', description: 'por que está (ou não) fatigado, curtíssimo' },
              what_works: { type: 'string', description: 'o que funciona nele (1 frase)' },
              tip: { type: 'string', description: '1 dica acionável de melhoria' },
            },
            required: ['angle', 'hook', 'tone', 'fatigued', 'what_works', 'tip'],
          },
        }],
        tool_choice: { type: 'tool', name: 'emit_detail' },
        messages: [{ role: 'user', content: prompt }],
      }),
      new Promise<null>(resolve => setTimeout(() => resolve(null), 22000)),
    ])

    if (!message) { await refundGate(gate, 'creative_detail'); return NextResponse.json({ error: 'A análise demorou demais — tente novamente.' }, { status: 504 }) }
    const tool = (message.content as any[]).find(b => b.type === 'tool_use') as any
    const detail = tool?.input
    if (!detail?.angle) { await refundGate(gate, 'creative_detail'); return NextResponse.json({ error: 'Não consegui analisar — tente novamente.' }, { status: 500 }) }

    return NextResponse.json({ success: true, detail })
  } catch (e: any) {
    await refundGate(gate, 'creative_detail')
    console.error('[creative-detail]', e?.message)
    return NextResponse.json({ error: e?.message || 'Erro na análise do criativo.' }, { status: 500 })
  }
}
