// app/api/nous-creatives/route.ts — Rastreio dos criativos CRIADOS PELO NOUS (Fase 2c).
// O usuário marca, no app, quais anúncios nasceram de uma sugestão do NOUS (por id —
// 100% confiável, sem falso positivo). Guardamos em campaign_memory (memory_type
// 'creative_nous_ad'; NÃO é lido pelo getClientMemoryContext, então não polui os prompts).
// O front cruza esses ids com os criativos ao vivo p/ mostrar o IMPACTO (CPL deles vs o resto).
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/nous-creatives?clientName=X — ids dos anúncios marcados como "criado pelo NOUS".
export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!supabaseAdmin) return NextResponse.json({ adIds: [] })

  const clientName = new URL(req.url).searchParams.get('clientName') || ''
  if (!clientName) return NextResponse.json({ adIds: [] })

  const { data, error } = await supabaseAdmin
    .from('campaign_memory')
    .select('description')
    .eq('user_id', userId).eq('client_name', clientName).eq('memory_type', 'creative_nous_ad')
  if (error) { console.error('[nous-creatives GET]', error.message); return NextResponse.json({ adIds: [] }) }

  const adIds = Array.from(new Set((data || []).map((r: any) => r.description).filter(Boolean)))
  return NextResponse.json({ adIds })
}

// POST /api/nous-creatives — marca/desmarca um anúncio como criado pelo NOUS.
// body: { clientName, adId, adName?, niche?, mark: boolean }
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!supabaseAdmin) return NextResponse.json({ success: true })

  const body = await req.json().catch(() => ({}))
  const clientName = String(body.clientName || '').slice(0, 120)
  const adId = String(body.adId || '').slice(0, 80)
  const mark = body.mark !== false
  if (!clientName || !adId) return NextResponse.json({ error: 'clientName e adId obrigatórios' }, { status: 400 })

  if (mark) {
    // Evita duplicar
    const { data: existing } = await supabaseAdmin
      .from('campaign_memory').select('id')
      .eq('user_id', userId).eq('client_name', clientName).eq('memory_type', 'creative_nous_ad').eq('description', adId).limit(1)
    if (!existing || existing.length === 0) {
      const { error } = await supabaseAdmin.from('campaign_memory').insert({
        user_id: userId, client_name: clientName, niche: body.niche || null,
        memory_type: 'creative_nous_ad', title: String(body.adName || '').slice(0, 120), description: adId,
        metrics: {}, confidence: 1,
      })
      if (error) { console.error('[nous-creatives POST]', error.message); return NextResponse.json({ error: error.message }, { status: 500 }) }
    }
  } else {
    const { error } = await supabaseAdmin
      .from('campaign_memory').delete()
      .eq('user_id', userId).eq('client_name', clientName).eq('memory_type', 'creative_nous_ad').eq('description', adId)
    if (error) { console.error('[nous-creatives DELETE]', error.message); return NextResponse.json({ error: error.message }, { status: 500 }) }
  }
  return NextResponse.json({ success: true })
}
