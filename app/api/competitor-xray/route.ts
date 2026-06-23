// app/api/competitor-xray/route.ts — RAIO-X DE CONCORRENTES.
// Puxa os anúncios ATIVOS de um concorrente na Biblioteca de Anúncios da Meta,
// calcula há quanto tempo cada um roda (longevidade = está funcionando) e usa IA
// para agrupar em ÂNGULOS com intensidade de aposta (nº de variações), a brecha
// que você não explora e o contra-ataque. Engenharia reversa do que dá certo no
// seu mercado.
import { NextRequest, NextResponse } from 'next/server'
import { getValidMetaToken } from '@/services/meta/token-manager'
import { gateAndCharge, refundGate } from '@/lib/gate'
import { sanitizeText } from '@/lib/sanitize'

export const maxDuration = 40

const daysSince = (iso?: string): number => {
  if (!iso) return 0
  const t = new Date(iso).getTime()
  return Number.isFinite(t) ? Math.max(0, Math.floor((Date.now() - t) / 86400000)) : 0
}

export async function POST(req: NextRequest) {
  const gate = await gateAndCharge('competitor_xray')
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })
  const userId = gate.userId!

  try {
    const body = await req.json().catch(() => ({}))
    const competitor = sanitizeText(body.competitor, 80)
    const niche = sanitizeText(body.niche, 120)
    const myAngles = sanitizeText(body.myAngles, 400) // ângulos que o usuário já roda (opcional)
    if (!competitor) { await refundGate(gate, 'competitor_xray'); return NextResponse.json({ error: 'Informe o nome do concorrente.' }, { status: 400 }) }

    // ── Token Meta + Biblioteca de Anúncios (anúncios ATIVOS no Brasil) ────────
    let accessToken = ''
    try { accessToken = (await getValidMetaToken(userId)).accessToken } catch {}
    if (!accessToken) { await refundGate(gate, 'competitor_xray'); return NextResponse.json({ error: 'Conecte uma conta Meta para usar o Raio-X (usamos seu acesso à Biblioteca de Anúncios).' }, { status: 400 }) }

    const fields = ['page_name', 'ad_creative_bodies', 'ad_creative_link_titles', 'ad_creative_link_descriptions', 'ad_delivery_start_time', 'ad_snapshot_url'].join(',')
    const params = new URLSearchParams({
      ad_type: 'ALL', ad_active_status: 'ACTIVE', ad_reached_countries: JSON.stringify(['BR']),
      search_terms: competitor, fields, limit: '40', access_token: accessToken,
    })
    const res = await fetch(`https://graph.facebook.com/v21.0/ads_archive?${params}`, { signal: AbortSignal.timeout(15000) })
    if (!(res.headers.get('content-type') || '').includes('application/json')) {
      await refundGate(gate, 'competitor_xray'); return NextResponse.json({ error: 'A Biblioteca de Anúncios não respondeu. Tente novamente.' }, { status: 502 })
    }
    const data = await res.json()
    if (data.error) { await refundGate(gate, 'competitor_xray'); return NextResponse.json({ error: 'Não foi possível consultar a Biblioteca de Anúncios.' }, { status: 502 }) }

    const ads = (data.data || []).map((ad: any) => ({
      page: ad.page_name || '',
      hook: ((ad.ad_creative_link_titles || [])[0] || (ad.ad_creative_bodies || [])[0] || '').slice(0, 200),
      body: ((ad.ad_creative_bodies || [])[0] || '').slice(0, 300),
      days: daysSince(ad.ad_delivery_start_time),
    })).filter((a: any) => a.hook || a.body)

    // Foca nos anúncios DO concorrente quando o nome bate na página; senão usa todos (mencionam ele).
    const lc = competitor.toLowerCase()
    const own = ads.filter((a: any) => a.page && a.page.toLowerCase().includes(lc))
    const pool = (own.length >= 3 ? own : ads).slice(0, 30)

    if (pool.length === 0) {
      await refundGate(gate, 'competitor_xray')
      return NextResponse.json({ success: true, competitor, totalAds: 0, analysis: null, reason: 'no_ads' })
    }

    // ── IA agrupa em ângulos + aposta + brecha + contra-ataque (saída estruturada) ──
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) { await refundGate(gate, 'competitor_xray'); return NextResponse.json({ error: 'IA não configurada.' }, { status: 500 }) }

    const adList = pool.map((a: any, i: number) => `${i + 1}. [há ${a.days}d] ${a.hook}${a.body ? ` — ${a.body.slice(0, 120)}` : ''}`).join('\n')
    const prompt = `Você é um analista sênior de inteligência competitiva de tráfego pago no Brasil.
Concorrente analisado: "${competitor}"${niche ? ` · nicho: ${niche}` : ''}.
${myAngles ? `Ângulos que MEU cliente já roda: ${myAngles}\n` : ''}
Abaixo estão ${pool.length} anúncios ATIVOS do concorrente (com há quantos dias cada um roda — quanto mais tempo + mais variações do mesmo tema, mais forte a aposta, porque ele só mantém no ar o que converte):

${adList}

Agrupe em 2 a 4 ÂNGULOS/ofertas distintos. Para cada ângulo conte quantos anúncios (variações) e o maior tempo rodando. Identifique a APOSTA principal (mais variações × mais tempo), a BRECHA (ângulo forte que meu cliente NÃO explora) e o CONTRA-ATAQUE acionável. Use a ferramenta emit_xray.`

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
                    variations: { type: 'integer' },
                    maxDays: { type: 'integer' },
                    intensity: { type: 'string', enum: ['alta', 'média', 'baixa'] },
                    sampleHook: { type: 'string' },
                  },
                  required: ['label', 'variations', 'maxDays', 'intensity', 'sampleHook'],
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
      new Promise<null>(resolve => setTimeout(() => resolve(null), 32000)),
    ])

    if (!message) { await refundGate(gate, 'competitor_xray'); return NextResponse.json({ error: 'A análise demorou demais — tente novamente.' }, { status: 504 }) }
    const tool = (message.content as any[]).find(b => b.type === 'tool_use') as any
    const analysis = tool?.input
    if (!analysis?.angles) { await refundGate(gate, 'competitor_xray'); return NextResponse.json({ error: 'Não consegui analisar os anúncios — tente novamente.' }, { status: 500 }) }

    return NextResponse.json({
      success: true, competitor,
      totalAds: pool.length,
      oldestDays: Math.max(0, ...pool.map((a: any) => a.days)),
      analysis,
      sampleAds: pool.slice(0, 6).map((a: any) => ({ hook: a.hook, days: a.days })),
    })
  } catch (e: any) {
    await refundGate(gate, 'competitor_xray')
    console.error('[competitor-xray]', e?.message)
    return NextResponse.json({ error: e?.message || 'Erro no Raio-X.' }, { status: 500 })
  }
}
