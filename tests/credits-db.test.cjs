const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
// Run with PGLITE_MODULE pointing to a separately installed @electric-sql/pglite.
const { PGlite } = require(process.env.PGLITE_MODULE || '@electric-sql/pglite')
test('PostgreSQL migration: atomic limit, rollover, retry-safe refund and access control', async () => {
  const db = new PGlite()
  try {
    await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;')
    const sql=fs.readFileSync(path.join(__dirname,'../supabase/migrations/20261110_atomic_credits.sql'),'utf8')
    await db.exec(sql)
    await db.exec('CREATE TABLE clients (id text, user_id text); GRANT ALL ON clients TO anon, authenticated;')
    await db.exec(fs.readFileSync(path.join(__dirname,'../supabase/migrations/20261110_user_data_access.sql'),'utf8'))
    const charge=async (user='A') => (await db.query("SELECT elyon_charge_credits($1,15,6,'diagnostic') AS result",[user])).rows[0].result
    const results=await Promise.all(Array.from({length:12},()=>charge()))
    assert.equal(results.filter(r=>r.allowed).length,2)
    assert.equal((await db.query("SELECT used FROM ai_credits WHERE user_id='A'")).rows[0].used,12)
    const id=results.find(r=>r.allowed).chargeId
    await db.query("SELECT elyon_refund_credits('B',$1)",[id])
    assert.equal((await db.query("SELECT used FROM ai_credits WHERE user_id='A'")).rows[0].used,12)
    await db.query("SELECT elyon_refund_credits('A',$1)",[id])
    await db.query("SELECT elyon_refund_credits('A',$1)",[id])
    assert.equal((await db.query("SELECT used FROM ai_credits WHERE user_id='A'")).rows[0].used,6)
    const old=(await charge()).chargeId
    await db.exec("UPDATE ai_credits SET reset_at='2020-01-01' WHERE user_id='A'; UPDATE ai_credit_charges SET period_end='2020-01-01' WHERE user_id='A'")
    assert.equal((await charge()).used,6); assert.equal((await charge()).used,12)
    await db.query("SELECT elyon_refund_credits('A',$1)",[old])
    assert.equal((await db.query("SELECT used FROM ai_credits WHERE user_id='A'")).rows[0].used,12)
    assert.equal((await charge('B')).used,6)
    await db.exec('SET ROLE anon')
    await assert.rejects(db.query("SELECT elyon_charge_credits('A',9999999,1,'audit')"), /permission denied/)
    await assert.rejects(db.query('SELECT * FROM ai_credits'), /permission denied/)
    await assert.rejects(db.query('SELECT * FROM clients'), /permission denied/)
    await db.exec('RESET ROLE; SET ROLE service_role')
    assert.equal((await charge('C')).allowed,true)
  } finally { await db.close() }
})
