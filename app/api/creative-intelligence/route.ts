// app/api/creative-intelligence/route.ts — INTELIGÊNCIA DE CRIATIVO.
// Lê os criativos REAIS da conta (cópia + métricas: CTR/CPL/frequência/leads/idade/formato)
// e o NOUS sintetiza: o ÂNGULO VENCEDOR (o que converte pra ESTE cliente), o que NÃO está
// funcionando, e o PRÓXIMO criativo a testar (brief pronto pro Estúdio). Tudo a partir do
// que já roda — nada inventado. Pós-iOS, o criativo é o lever de performance.
import { NextRequest, NextResponse } from 'next/server'
import { gateAndCharge, refundGate } from '@/lib/gate'
import { sanitizeText } from '@/lib/sanitize'

export const maxDuration = 45

interface InCreative {
  id?: string; name?: string; title?: string; body?: string; format?: string
  ctr?: number; cpl?: number; frequency?: number; leads?: number; spend?: number; ageDays?: number | null; tag?: string
}

export async function POST(req: NextRequest) {
  const gate = await gateAndCharge('creative_intelligence')
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  try {
    const body = await req.json().catch(() => ({}))
    const niche = sanitizeText(body.niche, 120)
    const competitorGap = sanitizeText(body.competitorGap, 400) // brecha do Raio-X (opcional)
    const raw: InCreative[] = Array.isArray(body.creatives) ? body.creatives : []
    if (raw.length === 0) {
      await refundGate(gate, 'creative_intelligence')
      return NextResponse.json({ error: 'Sem criativos para analisar. Carregue os criativos primeiro.' }, { status: 400 })
    }

    // Só os que têm entrega (gasto/leads) entram na análise; ordena por gasto e limita o
    // prompt. Mantém a cópia, que é o que revela o ângulo.
    const list = raw
      .filter(c => (c.spend || 0) > 0 || (c.leads || 0) > 0)
      .sort((a, b) => (b.spend || 0) - (a.spend || 0))
      .slice(0, 24)
      .map(c => ({
        id: String(c.id || ''),
        nome: sanitizeText(c.name || c.title || '', 80),
        copy: sanitizeText([c.title, c.body].filter(Boolean).join(' — '), 220),
        formato: c.format || 'image',
        ctr: Number(c.ctr) || 0,
        cpl: Number(c.cpl) || 0,
        freq: Number(c.frequency) || 0,
        leads: Number(c.leads) || 0,
        idadeDias: c.ageDays ?? null,
      }))
    if (list.length === 0) {
      await refundGate(gate, 'creative_intelligence')
      return NextResponse.json({ error: 'Nenhum criativo com entrega no período para analisar.' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) { await refundGate(gate, 'creative_intelligence'); return NextResponse.json({ error: 'IA não configurada.' }, { status: 500 }) }

    const prompt = `Você é um diretor de criação e performance de tráfego pago no Brasil, especialista em criativos de Meta Ads${niche ? ` no nicho "${niche}"` : ''}. Pós-iOS, o CRIATIVO é o principal lever de performance.

Aqui estão os criativos REAIS que estão rodando nesta conta (com métricas dos últimos 30 dias). CPL menor = melhor; CTR maior = melhor; frequência alta (≥3.5×) indica saturação/fadiga.
${list.map((c, i) => `${i + 1}. [${c.formato}] "${c.copy || c.nome}" — CTR ${c.ctr}% · CPL R$${c.cpl} · freq ${c.freq}× · ${c.leads} leads${c.idadeDias != null ? ` · ${c.idadeDias}d no ar` : ''}`).join('\n')}
${competitorGap ? `\nBrecha do concorrente (do Raio-X), considere ao propor o próximo criativo: ${competitorGap}` : ''}

Analise com base SÓ nestes dados reais (não invente métricas):
1) ÂNGULO VENCEDOR: que mensagem/gancho/formato está convertendo melhor (menor CPL / maior CTR) — agrupe os vencedores num padrão, com evidência (cite o criativo e o número).
2) O QUE NÃO ESTÁ FUNCIONANDO: o padrão dos que gastam e não convertem ou estão fatigando.
3) PRÓXIMO CRIATIVO A TESTAR: um criativo concreto e pronto pra briefar, que DOBRE a aposta no ângulo vencedor (ou explore a brecha), diferente do que já está saturado. Dê formato, gancho (primeiros 3s), texto principal, headline e CTA — em português, prontos pra usar.
Use a ferramenta emit_creative_intel.`

    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const anthropic = new Anthropic({ apiKey })
    const message = await Promise.race([
      anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        tools: [{
          name: 'emit_creative_intel',
          description: 'Retorna a inteligência de criativo a partir dos dados reais.',
          input_schema: {
            type: 'object',
            properties: {
              winning_angles: {
                type: 'array',
                description: '1 a 3 ângulos vencedores, do mais forte ao mais fraco.',
                items: {
                  type: 'object',
                  properties: {
                    angle: { type: 'string', description: 'nome curto do ângulo/gancho vencedor' },
                    why: { type: 'string', description: 'por que vence (1 frase, ligada à métrica)' },
                    evidence: { type: 'string', description: 'criativo + número que comprova (ex.: "Converse conosco · CPL R$13")' },
                  },
                  required: ['angle', 'why', 'evidence'],
                },
              },
              not_working: { type: 'string', description: 'o padrão do que não converte/está fatigando (1-2 frases)' },
              next_creative: {
                type: 'object',
                description: 'o próximo criativo a testar, pronto pra briefar',
                properties: {
                  format: { type: 'string', enum: ['imagem', 'vídeo', 'carrossel'] },
                  angle: { type: 'string', description: 'o ângulo que ele dobra/explora' },
                  hook: { type: 'string', description: 'gancho dos primeiros 3 segundos' },
                  primary_text: { type: 'string', description: 'texto principal do anúncio, pronto' },
                  headline: { type: 'string', description: 'título/headline curto' },
                  cta: { type: 'string', description: 'chamada para ação' },
                  rationale: { type: 'string', description: 'por que esse é o próximo teste certo (1 frase)' },
                },
                required: ['format', 'angle', 'hook', 'primary_text', 'headline', 'cta', 'rationale'],
              },
            },
            required: ['winning_angles', 'not_working', 'next_creative'],
          },
        }],
        tool_choice: { type: 'tool', name: 'emit_creative_intel' },
        messages: [{ role: 'user', content: prompt }],
      }),
      new Promise<null>(resolve => setTimeout(() => resolve(null), 34000)),
    ])

    if (!message) { await refundGate(gate, 'creative_intelligence'); return NextResponse.json({ error: 'A análise demorou demais — tente novamente.' }, { status: 504 }) }
    const tool = (message.content as any[]).find(b => b.type === 'tool_use') as any
    const analysis = tool?.input
    if (!analysis?.winning_angles || !analysis?.next_creative) {
      await refundGate(gate, 'creative_intelligence')
      return NextResponse.json({ error: 'Não consegui montar a análise — tente novamente.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, analyzed: list.length, analysis })
  } catch (e: any) {
    await refundGate(gate, 'creative_intelligence')
    console.error('[creative-intelligence]', e?.message)
    return NextResponse.json({ error: e?.message || 'Erro na inteligência de criativo.' }, { status: 500 })
  }
}
