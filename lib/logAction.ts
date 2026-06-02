// lib/logAction.ts — Helper client-side para registrar ações no activity_logs
// Falha silenciosamente — nunca bloqueia o fluxo principal

export type LogModule =
  | 'assets'
  | 'clients'
  | 'audit'
  | 'persona'
  | 'campaign'
  | 'market_intelligence'
  | 'competitors'
  | 'conversations'
  | 'workflow'
  | 'connections'
  | 'reports'
  | 'strategy'

export type LogAction =
  | 'upload'
  | 'delete'
  | 'generate'
  | 'save'
  | 'load'
  | 'connect'
  | 'disconnect'
  | 'create'
  | 'update'
  | 'clear'
  | 'export'

export function logAction(
  module: LogModule,
  action: LogAction,
  opts?: {
    clientName?: string
    detail?: string
    metadata?: Record<string, any>
  }
): void {
  // Fire-and-forget — não bloqueia nem propaga erro
  fetch('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      module,
      action,
      clientName: opts?.clientName,
      detail:     opts?.detail,
      metadata:   opts?.metadata,
    }),
  }).catch(() => {})
}
