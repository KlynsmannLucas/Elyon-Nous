import { NextResponse } from 'next/server'
import { ReporteiError } from './client'

export function reporteiErrorResponse(error: unknown) {
  return NextResponse.json({ error: error instanceof ReporteiError ? error.message : 'Não foi possível consultar o Reportei. Tente novamente.' },
    { status: error instanceof ReporteiError ? error.status : 503, headers: { 'Cache-Control': 'private, no-store' } })
}
