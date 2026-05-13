// app/api/memory/route.ts — Memory Agent: salva e busca padrões de campanhas com RAG
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

async function getEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null
  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text.slice(0, 8000) }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.data?.[0]?.embedding ?? null
  } catch {
    return null
  }
}

// POST /api/memory — salva uma memória de campanha
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!supabaseAdmin) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

    const body = await req.json()
    const {
      clientName, niche, memoryType = 'general',
      title, description, metrics, tags, platform, confidence = 0.8,
      source = 'manual', period,
    } = body

    if (!title || !description || !niche) {
      return NextResponse.json({ error: 'title, description e niche são obrigatórios' }, { status: 400 })
    }

    // Gera embedding do título + descrição + métricas
    const textToEmbed = [
      `Nicho: ${niche}`,
      `Tipo: ${memoryType}`,
      title,
      description,
      metrics ? `CPL: R$${metrics.cpl ?? '?'} | ROAS: ${metrics.roas ?? '?'} | CTR: ${metrics.ctr ?? '?'}%` : '',
      tags?.length ? `Tags: ${tags.join(', ')}` : '',
    ].filter(Boolean).join('\n')

    const embedding = await getEmbedding(textToEmbed)

    const { data, error } = await supabaseAdmin
      .from('campaign_memory')
      .upsert({
        user_id: userId,
        client_name: clientName,
        niche,
        memory_type: memoryType,
        title,
        description,
        metrics: metrics ?? null,
        tags: tags ?? [],
        platform: platform ?? null,
        confidence,
        embedding,
        source,
        period: period ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,client_name,title' })
      .select('id')
      .single()

    if (error) {
      // Tenta inserir sem o conflito
      const { data: ins, error: insErr } = await supabaseAdmin
        .from('campaign_memory')
        .insert({
          user_id: userId,
          client_name: clientName,
          niche,
          memory_type: memoryType,
          title,
          description,
          metrics: metrics ?? null,
          tags: tags ?? [],
          platform: platform ?? null,
          confidence,
          embedding,
          source,
          period: period ?? null,
        })
        .select('id')
        .single()

      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
      return NextResponse.json({ id: ins?.id, embedded: !!embedding })
    }

    return NextResponse.json({ id: data?.id, embedded: !!embedding })
  } catch (err) {
    console.error('[memory POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// GET /api/memory?query=...&niche=...&limit=10 — busca semântica
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!supabaseAdmin) return NextResponse.json({ memories: [] })

    const { searchParams } = new URL(req.url)
    const query  = searchParams.get('query') || ''
    const niche  = searchParams.get('niche') || null
    const limit  = Math.min(Number(searchParams.get('limit') || '8'), 20)
    const type   = searchParams.get('type') || null

    if (!query) {
      // Lista as memórias mais recentes sem busca semântica
      let q = supabaseAdmin
        .from('campaign_memory')
        .select('id,memory_type,title,description,metrics,tags,platform,confidence,created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (niche) q = q.eq('niche', niche)
      if (type)  q = q.eq('memory_type', type)

      const { data } = await q
      return NextResponse.json({ memories: data ?? [], source: 'list' })
    }

    // Busca semântica com embedding
    const embedding = await getEmbedding(query)
    if (!embedding) {
      // Fallback: busca textual simples
      const { data } = await supabaseAdmin
        .from('campaign_memory')
        .select('id,memory_type,title,description,metrics,tags,platform,confidence,created_at')
        .eq('user_id', userId)
        .ilike('description', `%${query}%`)
        .limit(limit)

      return NextResponse.json({ memories: data ?? [], source: 'text_search' })
    }

    // Busca vetorial via função SQL
    const { data, error } = await supabaseAdmin.rpc('search_campaign_memory', {
      query_embedding: embedding,
      target_user_id:  userId,
      target_niche:    niche,
      match_threshold: 0.65,
      match_count:     limit,
    })

    if (error) {
      console.error('[memory GET rpc]', error)
      return NextResponse.json({ memories: [], source: 'error' })
    }

    return NextResponse.json({ memories: data ?? [], source: 'semantic' })
  } catch (err) {
    console.error('[memory GET]', err)
    return NextResponse.json({ memories: [] })
  }
}

// DELETE /api/memory?id=... — remove uma memória
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!supabaseAdmin) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

    await supabaseAdmin
      .from('campaign_memory')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[memory DELETE]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
