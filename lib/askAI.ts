// lib/askAI.ts — Helper central para abrir o chat da IA já com contexto da tela.
// Credit-safe: prepara a mensagem no input (não envia sozinho) — o usuário confirma o envio.

export interface AIContext {
  source: string                       // de onde veio (ex: 'plano-acao', 'funil', 'saude-negocio')
  title: string                        // título do card/ação
  problem?: string                     // problema detectado
  recommendation?: string              // recomendação relacionada
  metrics?: Record<string, unknown>    // métricas de apoio (opcional)
  suggestedPrompt: string              // pergunta pronta, em linguagem humana
}

export const AI_CONTEXT_KEY = 'elyon_ai_context'

/**
 * Abre o chat consultivo já com a pergunta sugerida preenchida no input.
 * Guarda o contexto completo em sessionStorage (para enriquecimento/fallback).
 * NÃO envia automaticamente — evita consumo de crédito sem ação clara do usuário.
 */
export function askAIWithContext(ctx: AIContext) {
  try { sessionStorage.setItem(AI_CONTEXT_KEY, JSON.stringify(ctx)) } catch {}
  window.dispatchEvent(new CustomEvent('elyon:open-nous', { detail: { question: ctx.suggestedPrompt } }))
}

/** Atalho para casos simples — apenas uma pergunta, sem contexto estruturado. */
export function askAI(suggestedPrompt: string, source = 'simple') {
  askAIWithContext({ source, title: '', suggestedPrompt })
}
