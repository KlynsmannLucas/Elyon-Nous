const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const path = require('node:path')
function load(file, mocks = {}, globals = {}) {
  const module = { exports: {} }
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText
  vm.runInNewContext(source, { module, exports: module.exports, require: id => {
    if (id in mocks) return mocks[id]
    throw new Error(`Unexpected dependency: ${id}`)
  }, console, Response, ...globals }, { filename: file })
  return module.exports
}
const access = () => load('lib/access.ts', { '@/lib/planUtils': { TRIAL_DAYS: 7 } })
test('admin role is private; legacy subscription admin never grants privileges', () => {
  const a = access(), now = Date.now()
  assert.equal(a.isAdministrator({ publicMetadata: { plan: 'admin' } }), false)
  assert.equal(a.isAdministrator({ privateMetadata: { role: 'admin' } }), true)
  assert.equal(a.effectivePlanForUser({ publicMetadata: { plan: 'admin' }, createdAt: 0 }, now), null)
  assert.equal(a.effectivePlanForUser({ publicMetadata: { plan: 'avancada' }, createdAt: 0 }, now), 'avancada')
  assert.equal(a.effectivePlanForUser({ createdAt: now - 7 * 86400000 }, now), null)
  assert.equal(a.effectivePlanForUser({ createdAt: now - 6 * 86400000 }, now), 'trial')
})
test('scope clears unknown and different owners, preserves same owner and clears logout', () => {
  const local = new Map(), session = new Map(); let wipes = 0
  const storage = m => ({ getItem: k => m.get(k) ?? null, setItem: (k,v) => m.set(k,v), removeItem: k => m.delete(k) })
  const state = { clearAll: () => wipes++, setUserExperience() {}, setWelcomeTourSeen() {}, setDashboardMode() {} }
  const s = load('lib/userScope.ts', { '@/lib/store': { useAppStore: { getState: () => state } } }, { localStorage: storage(local), sessionStorage: storage(session) })
  assert.equal(s.enforceUserScope('A'), true); assert.equal(wipes, 1)
  assert.equal(s.enforceUserScope('A'), false); assert.equal(wipes, 1)
  session.set('elyon_ai_context','private'); s.enforceUserScope('B')
  assert.equal(wipes, 2); assert.equal(session.has('elyon_ai_context'), false)
  s.clearUserScopeOnLogout(); assert.equal(wipes, 3); assert.equal(local.has('elyon_active_user'), false)
})
test('credits fail closed on database failures and reject unknown operations', async () => {
  for (const db of [null, { rpc: async () => ({ error: new Error('offline') }) }]) {
    const c = load('lib/credits.ts', { '@/lib/supabase': { supabaseAdmin: db } })
    assert.equal((await c.checkAndDeductCredits('A','individual','audit')).status,503)
    assert.equal((await c.checkAndDeductCredits('A','individual','invented')).status,400)
  }
})
test('credit reads report next month after expiry, and refunds pass the exact charge', async () => {
  const calls = []
  const db = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { used: 100, reset_at: '2020-01-01' } }) }) }) }), rpc: async (...args) => { calls.push(args); return { data: { allowed: true, chargeId: 'charge-1' } } } }
  const c = load('lib/credits.ts', { '@/lib/supabase': { supabaseAdmin: db } })
  const balance = await c.getCredits('A','individual')
  assert.equal(balance.used,0); assert.ok(new Date(balance.resetAt) > new Date())
  await c.refundCredits('A','individual','audit','charge-1')
  assert.equal(calls[0][1].p_charge_id,'charge-1')
})
test('gate rejects missing auth, failed identity lookup, expired trials and insufficient credits', async () => {
  const make = (id, user, credits) => load('lib/gate.ts', {
    '@clerk/nextjs/server': { auth: async () => ({ userId:id }), clerkClient: async () => ({ users: { getUser: async () => { if (user === 'error') throw Error(); return user } } }) },
    '@/lib/access': access(), '@/lib/credits': { checkAndDeductCredits: async () => credits, refundCredits: async () => {} }
  })
  assert.equal((await make(null,null).gateAndCharge('audit')).status,401)
  assert.equal((await make('A','error').gateAndCharge('audit')).status,503)
  assert.equal((await make('A',{ createdAt:0 }).gateAndCharge('audit')).status,402)
  assert.equal((await make('A',{ createdAt:Date.now() },{allowed:false,status:402}).gateAndCharge('audit')).status,402)
})
test('JSON wrapper refunds failed responses and exceptions but keeps successful debit', async () => {
  let refunds=0
  const g=load('lib/gate.ts', {
    '@clerk/nextjs/server': { auth: async () => ({userId:'A'}), clerkClient: async () => ({users:{getUser:async () => ({createdAt:Date.now()})}}) },
    '@/lib/access':access(), '@/lib/credits':{checkAndDeductCredits:async () => ({allowed:true,chargeId:'1'}),refundCredits:async () => refunds++}
  })
  await g.withCreditCharge('audit',async () => Response.json({success:false})); assert.equal(refunds,1)
  await g.withCreditCharge('audit',async () => {throw Error()}); assert.equal(refunds,2)
  await g.withCreditCharge('audit',async () => Response.json({success:true})); assert.equal(refunds,2)
})
test('set-plan HTTP route refuses a normal user without modifying Clerk metadata', async () => {
  let updates=0
  const handler=load('app/api/admin/set-plan/route.ts', {
    'next/server':{NextResponse:Response}, '@/lib/access':access(),
    '@clerk/nextjs/server': {auth:async () => ({userId:'A'}),clerkClient:async () => ({users:{getUser:async () => ({publicMetadata:{plan:'avancada'}}),updateUserMetadata:async () => updates++}})}
  })
  const response=await handler.POST({json:async () => ({plan:'avancada'})})
  assert.equal(response.status,403);assert.equal(updates,0)
})
test('every charged operation has an explicit configured price', () => {
  const costs=load('lib/credits.ts', {'@/lib/supabase':{supabaseAdmin:null}}).OPERATION_COSTS
  const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)])
  for(const file of walk(path.join(__dirname,'../app/api')).filter(f=>f.endsWith('route.ts'))) {
    for(const match of fs.readFileSync(file,'utf8').matchAll(/(?:gateAndCharge|withCreditCharge)\('([^']+)'/g)) assert.ok(costs[match[1]]>0,`${file}: ${match[1]}`)
  }
})
