// lib/userScope.ts — Isolamento de dados por usuário no mesmo navegador.
// Garante que, ao trocar de conta logada, NENHUM dado local do usuário anterior
// permaneça (Zustand persistido + chaves soltas de localStorage/sessionStorage).

import { useAppStore } from '@/lib/store'

const ACTIVE_USER_KEY = 'elyon_active_user'

// Todas as chaves soltas de localStorage do ELYON (fora do Zustand 'elyon-store').
const LOOSE_LOCAL_KEYS = [
  'elyon_terms_v1',
  'elyon_onboarding_dismissed',
  'dashboard_profile_goal_onboarding',
  'dashboard_simple_action_plan_status',
  'using_simple_demo_data',
]
const SESSION_KEYS = ['elyon_ai_context']

/** Limpa TODO o estado local do app (memória + persistência). */
function wipeAllLocalState() {
  try {
    // 1) Zustand em memória (e o persist 'elyon-store' é reescrito vazio em seguida)
    const s = useAppStore.getState()
    s.clearAll()
    // Preferências por usuário que o clearAll não cobre
    s.setUserExperience(null)
    s.setWelcomeTourSeen(false)
    s.setDashboardMode('pro')
  } catch {}
  // 2) Chaves soltas
  try { LOOSE_LOCAL_KEYS.forEach(k => localStorage.removeItem(k)) } catch {}
  try { SESSION_KEYS.forEach(k => sessionStorage.removeItem(k)) } catch {}
}

/**
 * Deve ser chamado assim que o usuário autenticado é conhecido.
 * Se o usuário ativo no navegador mudou (ou é a primeira vez), apaga todo o
 * estado local do usuário anterior. Retorna true se houve limpeza.
 */
export function enforceUserScope(userId: string | null | undefined): boolean {
  if (!userId) return false
  let active: string | null = null
  try { active = localStorage.getItem(ACTIVE_USER_KEY) } catch {}

  if (active === userId) return false  // mesmo usuário — nada a fazer

  // Usuário diferente (ou primeira vez) → limpa tudo do anterior
  if (active !== null) wipeAllLocalState()
  try { localStorage.setItem(ACTIVE_USER_KEY, userId) } catch {}
  return active !== null
}

/** Chamado no logout — limpa o estado e o marcador de usuário ativo. */
export function clearUserScopeOnLogout() {
  wipeAllLocalState()
  try { localStorage.removeItem(ACTIVE_USER_KEY) } catch {}
}
