// app/api/clients/account/route.ts — Persiste a CONTA DE ANÚNCIO escolhida por cliente.
// A seleção (selectedMeta/GoogleAccountByClient) vive no localStorage e é invisível ao
// servidor. O cron do Pulse (e o daily-snapshot) precisam dela para isolar os dados por
// cliente — sem isto, caem na conta padrão do usuário (que é de outro cliente).
// Guardamos em clients.extra_data.{selectedMetaAccountId, selectedGoogleAccountId}.
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!supabaseAdmin) return NextResponse.json({ success: true })

  const body = await req.json().catch(() => ({}))
  // { selections: { [clientName]: { meta?: string|null, google?: string|null } } }
  const selections: Record<string, { meta?: string | null; google?: string | null }> = body.selections || {}
  const names = Object.keys(selections)
  if (!names.length) return NextResponse.json({ success: true, updated: 0 })

  const { data: rows, error } = await supabaseAdmin
    .from('clients')
    .select('id, extra_data, client_data')
    .eq('user_id', userId)
  if (error) {
    // Coluna extra_data ausente ou outro erro: degrada sem quebrar (Pulse fica como antes).
    console.error('[clients/account]', error.message)
    return NextResponse.json({ success: false, error: error.message })
  }

  let updated = 0
  for (const row of rows || []) {
    const name = (row.client_data as any)?.clientName
    if (!name || !(name in selections)) continue
    const sel = selections[name]
    const extra = { ...((row.extra_data as any) || {}) }
    if (sel.meta !== undefined) extra.selectedMetaAccountId = sel.meta || null
    if (sel.google !== undefined) extra.selectedGoogleAccountId = sel.google || null
    const { error: upErr } = await supabaseAdmin
      .from('clients')
      .update({ extra_data: extra })
      .eq('id', row.id)
      .eq('user_id', userId)
    if (!upErr) updated++
    else console.error('[clients/account update]', upErr.message)
  }
  return NextResponse.json({ success: true, updated })
}
