// app/api/account/route.ts — LGPD: exclusão completa da conta e todos os dados do usuário
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE() {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const errors: string[] = []

  if (supabaseAdmin) {
    const tables = ['clients', 'report_shares', 'report_schedules'] as const
    for (const table of tables) {
      const { error } = await supabaseAdmin.from(table).delete().eq('user_id', userId)
      if (error) errors.push(`${table}: ${error.message}`)
    }
  }

  try {
    const { clerkClient } = await import('@clerk/nextjs/server')
    await clerkClient().users.deleteUser(userId)
  } catch (e: any) {
    errors.push(`clerk: ${e.message}`)
  }

  if (errors.length > 0) {
    console.error('[account DELETE] erros parciais:', errors)
  }

  return NextResponse.json({ success: true, errors: errors.length ? errors : undefined })
}
