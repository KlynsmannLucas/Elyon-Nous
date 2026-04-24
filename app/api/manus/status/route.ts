// app/api/manus/status/route.ts — Verifica status e resultado de uma task Manus
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { manusGetResult } from '@/lib/manus'

export async function GET(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const taskId = req.nextUrl.searchParams.get('task_id')
  if (!taskId) return NextResponse.json({ error: 'task_id não informado' }, { status: 400 })

  try {
    const result = await manusGetResult(taskId)

    // Tenta parsear JSON do output se a task terminou
    let parsed: any = null
    if (result.status === 'stopped' && result.output) {
      try {
        const clean = result.output.replace(/```json|```/g, '').trim()
        parsed = JSON.parse(clean)
      } catch {
        parsed = null // output é texto, não JSON — retorna raw mesmo
      }
    }

    return NextResponse.json({
      status: result.status,
      output: result.output,
      parsed,
      done: result.status === 'stopped' || result.status === 'error',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
