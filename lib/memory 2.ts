// lib/memory.ts — Leitura da memória de campanhas (RAG read-back).
// A campaign_memory acumula padrões por auditoria (benchmark / winning / losing).
// Aqui montamos um resumo compacto do histórico do cliente/nicho para injetar
// nos prompts de auditoria e estratégia — é o que faz a IA "aprender" ao longo
// do tempo, em vez de analisar cada conta do zero.

import { supabaseAdmin } from '@/lib/supabase'

interface MemoryRow {
  memory_type: string
  title: string | null
  description: string | null
  metrics: any
  confidence: number | null
  created_at: string | null
  client_name: string | null
  niche: string | null
}

/** Agrupa por padrão (título normalizado) e conta recorrências. */
function recurrence(rows: MemoryRow[]): { n: number; row: MemoryRow }[] {
  const map = new Map<string, { n: number; row: MemoryRow }>()
  for (const r of rows) {
    const key = (r.title || r.description || '').toLowerCase().trim().slice(0, 60)
    if (!key) continue
    const cur = map.get(key)
    if (cur) cur.n++
    else map.set(key, { n: 1, row: r })
  }
  return [...map.values()].sort((a, b) => b.n - a.n)
}

/**
 * Resumo do histórico aprendido para este cliente/nicho. Retorna '' se não há
 * memória ou DB indisponível (degrada sem quebrar).
 */
export async function getClientMemoryContext(userId: string, clientName: string, niche: string): Promise<string> {
  if (!supabaseAdmin || !userId) return ''
  try {
    // Busca por user (filtragem por cliente/nicho em JS — evita injeção no .or()).
    const { data } = await supabaseAdmin
      .from('campaign_memory')
      .select('memory_type,title,description,metrics,confidence,created_at,client_name,niche')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(80)

    const rows = (data as MemoryRow[] | null) || []
    if (rows.length === 0) return ''

    const ofClient = rows.filter(r => r.client_name === clientName)
    const ofNiche  = rows.filter(r => r.niche === niche && r.client_name !== clientName)

    const lines: string[] = []

    // 1) Tendência de CPL do próprio cliente ao longo das auditorias
    const ownBench = ofClient.filter(r => r.memory_type === 'benchmark')
    const cpls = ownBench.map(r => r.metrics?.cpl).filter((x: any): x is number => typeof x === 'number' && x > 0)
    if (cpls.length >= 2) {
      lines.push(`Histórico de CPL deste cliente (recente → antigo): ${cpls.slice(0, 5).map(c => `R$${c}`).join(' → ')}.`)
    }

    // 2) Padrões vencedores/perdedores recorrentes do cliente
    const winners = recurrence(ofClient.filter(r => r.memory_type === 'winning_creative')).slice(0, 4)
    if (winners.length) {
      lines.push(`Padrões que já FUNCIONARAM: ${winners.map(w => `${w.row.title || w.row.description}${w.n > 1 ? ` (recorrente ${w.n}×)` : ''}`).join(' · ')}.`)
    }
    const losers = recurrence(ofClient.filter(r => r.memory_type === 'losing_pattern')).slice(0, 4)
    if (losers.length) {
      lines.push(`Problemas que já FALHARAM/reincidiram: ${losers.map(l => `${l.row.title || l.row.description}${l.n > 1 ? ` (reincidiu ${l.n}×)` : ''}`).join(' · ')}.`)
    }

    // 3) Aprendizado cruzado do mesmo nicho (outros clientes do usuário)
    const nicheWinners = recurrence(ofNiche.filter(r => r.memory_type === 'winning_creative')).slice(0, 2)
    if (nicheWinners.length) {
      lines.push(`No mesmo nicho (${niche}), já funcionou em outras contas: ${nicheWinners.map(w => w.row.title || w.row.description).join(' · ')}.`)
    }

    if (lines.length === 0) return ''
    return `\n=== MEMÓRIA DO HISTÓRICO (aprendizado de auditorias anteriores — use de verdade) ===\n${lines.join('\n')}\nINSTRUÇÃO: priorize o que já funcionou; se um problema reincide, marque-o como urgente; compare com o CPL histórico para dizer se está melhorando ou piorando.`
  } catch {
    return ''
  }
}
