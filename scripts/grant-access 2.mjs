// scripts/grant-access.mjs — Concede um plano a um usuário pelo email (admin, via Clerk REST API)
//
// Uso:
//   node scripts/grant-access.mjs <email> [plano]
// Exemplos:
//   node scripts/grant-access.mjs alissonrs@outlook.com avancada
//
// Lê CLERK_SECRET_KEY do ambiente (.env.local). Mostra o estado atual antes de alterar.
// NÃO há expiração automática — grava compAccessUntil apenas como lembrete para reversão manual.

import { readFileSync } from 'node:fs'

// Carrega CLERK_SECRET_KEY do .env.local se não estiver no ambiente
function loadEnv() {
  if (process.env.CLERK_SECRET_KEY) return
  try {
    const raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*CLERK_SECRET_KEY\s*=\s*(.+)\s*$/)
      if (m) { process.env.CLERK_SECRET_KEY = m[1].trim().replace(/^["']|["']$/g, '') ; break }
    }
  } catch { /* ignore */ }
}

const ALLOWED = ['free', 'individual', 'profissional', 'avancada']
const API = 'https://api.clerk.com/v1'

async function main() {
  loadEnv()
  const key = process.env.CLERK_SECRET_KEY
  if (!key) { console.error('❌ CLERK_SECRET_KEY não encontrada (defina no ambiente ou .env.local)'); process.exit(1) }

  const email = (process.argv[2] || '').trim().toLowerCase()
  const plan  = (process.argv[3] || 'avancada').trim()
  if (!email)               { console.error('❌ Informe o email: node scripts/grant-access.mjs <email> [plano]'); process.exit(1) }
  if (!ALLOWED.includes(plan)) { console.error(`❌ Plano inválido. Use: ${ALLOWED.join(', ')}`); process.exit(1) }

  const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }

  // 1. Encontra o usuário pelo email
  const res = await fetch(`${API}/users?email_address=${encodeURIComponent(email)}`, { headers })
  if (!res.ok) { console.error(`❌ Erro ao buscar usuário (${res.status}): ${await res.text()}`); process.exit(1) }
  const users = await res.json()
  if (!Array.isArray(users) || users.length === 0) { console.error(`❌ Nenhum usuário encontrado com o email ${email}`); process.exit(1) }

  const user = users[0]
  const currentPlan = user.public_metadata?.plan || '(nenhum / free)'
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || '(sem nome)'
  console.log('\n── Usuário encontrado ──────────────────────────')
  console.log(`  ID:           ${user.id}`)
  console.log(`  Nome:         ${name}`)
  console.log(`  Email:        ${email}`)
  console.log(`  Plano atual:  ${currentPlan}`)
  console.log('────────────────────────────────────────────────\n')

  // 2. Calcula data de reversão (1 mês) — apenas documental
  const revertBy = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  // 3. Atualiza o plano (merge no public_metadata)
  const patch = await fetch(`${API}/users/${user.id}/metadata`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      public_metadata: {
        plan,
        planUpdatedAt:   new Date().toISOString(),
        compAccess:      true,             // acesso cortesia (não pago)
        compAccessUntil: revertBy,         // lembrete de reversão manual
        compPreviousPlan: user.public_metadata?.plan || 'free',
      },
    }),
  })
  if (!patch.ok) { console.error(`❌ Erro ao atualizar plano (${patch.status}): ${await patch.text()}`); process.exit(1) }

  console.log(`✅ Plano de ${email} definido como "${plan}".`)
  console.log(`   Acesso cortesia registrado. Reverter manualmente em: ${revertBy}`)
  console.log(`   (Para reverter: node scripts/grant-access.mjs ${email} ${user.public_metadata?.plan || 'free'})\n`)
}

main().catch(e => { console.error('❌ Falha inesperada:', e); process.exit(1) })
