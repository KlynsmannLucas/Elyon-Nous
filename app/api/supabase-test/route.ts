// app/api/supabase-test/route.ts — Diagnóstico de conectividade Supabase
// Acesse: POST /api/supabase-test  (requer auth Clerk)
// Testa insert em cada tabela de persistência e retorna erros detalhados
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const report: Record<string, any> = {
    env: {
      NEXT_PUBLIC_SUPABASE_URL:     !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY:!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY:    !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseAdminReady:           !!supabaseAdmin,
    },
    tests: {} as Record<string, any>,
    summary: '',
  }

  if (!supabaseAdmin) {
    report.summary = 'BLOQUEADO: supabaseAdmin=null — SUPABASE_SERVICE_ROLE_KEY não configurada'
    return NextResponse.json(report, { status: 500 })
  }

  const TEST_ID     = `test_diag_${Date.now()}`
  const TEST_CLIENT = 'supabase_test_diag'

  // ── Teste 1: audit_reports ──────────────────────────────────────────────────
  let auditId: string | null = null
  try {
    const { data, error } = await supabaseAdmin
      .from('audit_reports')
      .insert({
        user_id:      TEST_ID,
        client_id:    TEST_CLIENT,
        client_name:  'SUPABASE DIAGNOSTIC TEST',
        data_sources: ['test'],
        score:        42,
        grade:        'B',
        summary:      'Registro de teste — pode ser deletado',
        source:       'ai',
      })
      .select('id')
      .single()
    if (error) {
      report.tests.audit_reports = { ok: false, error: error.message, code: error.code, hint: error.hint }
    } else {
      auditId = data?.id ?? null
      report.tests.audit_reports = { ok: true, id: auditId }
    }
  } catch (e: any) {
    report.tests.audit_reports = { ok: false, error: e.message }
  }

  // ── Teste 2: priority_actions ───────────────────────────────────────────────
  try {
    const { data, error } = await supabaseAdmin
      .from('priority_actions')
      .insert({
        user_id:        TEST_ID,
        client_id:      TEST_CLIENT,
        title:          'TESTE DIAGNÓSTICO — pode deletar',
        platform:       'ambos',
        source:         'auditoria',
        priority:       1,
        urgency:        'media',
        status:         'pendente',
        audit_report_id: auditId,
      })
      .select('id')
      .single()
    if (error) {
      report.tests.priority_actions = { ok: false, error: error.message, code: error.code, hint: error.hint }
    } else {
      report.tests.priority_actions = { ok: true, id: data?.id }
    }
  } catch (e: any) {
    report.tests.priority_actions = { ok: false, error: e.message }
  }

  // ── Teste 3: client_health_scores ───────────────────────────────────────────
  try {
    const { data, error } = await supabaseAdmin
      .from('client_health_scores')
      .upsert(
        {
          user_id:        TEST_ID,
          client_id:      TEST_CLIENT,
          score:          42,
          grade:          'B',
          source:         'ai',
          audit_report_id: auditId,
          calculated_at:  new Date().toISOString(),
          updated_at:     new Date().toISOString(),
        },
        { onConflict: 'user_id,client_id' }
      )
      .select('id')
      .single()
    if (error) {
      report.tests.client_health_scores = { ok: false, error: error.message, code: error.code, hint: error.hint }
    } else {
      report.tests.client_health_scores = { ok: true, id: data?.id }
    }
  } catch (e: any) {
    report.tests.client_health_scores = { ok: false, error: e.message }
  }

  // ── Limpeza — deleta registros de teste ────────────────────────────────────
  try { await supabaseAdmin.from('priority_actions').delete().eq('user_id', TEST_ID) } catch {}
  try { await supabaseAdmin.from('client_health_scores').delete().eq('user_id', TEST_ID) } catch {}
  try { await supabaseAdmin.from('audit_reports').delete().eq('user_id', TEST_ID) } catch {}

  const allOk = Object.values(report.tests).every((t: any) => t.ok)
  const anyOk = Object.values(report.tests).some((t: any) => t.ok)
  report.summary = allOk
    ? 'TUDO OK — supabaseAdmin inseriu e deletou nas 3 tabelas com sucesso'
    : anyOk
    ? 'PARCIAL — algumas tabelas funcionaram, outras falharam — veja report.tests'
    : 'FALHA TOTAL — nenhuma tabela aceitou insert — verifique SUPABASE_SERVICE_ROLE_KEY, schema e RLS'

  return NextResponse.json(report, { status: allOk ? 200 : 500 })
}
