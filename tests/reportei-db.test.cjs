const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { PGlite } = require(process.env.PGLITE_MODULE || '@electric-sql/pglite')

test('Reportei migration denies browser roles and prevents a cross-user client link even with service-role access', async () => {
  const db = new PGlite()
  try {
    await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE TABLE clients (id uuid PRIMARY KEY, user_id text NOT NULL);')
    await db.exec(fs.readFileSync(path.join(__dirname, '../supabase/migrations/20261110185737_reportei_complementary_data.sql'), 'utf8'))
    await db.exec("INSERT INTO clients VALUES ('00000000-0000-4000-8000-000000000001','user-A'), ('00000000-0000-4000-8000-000000000002','user-B'); SET ROLE service_role;")
    await db.exec("INSERT INTO reportei_connections(user_id,token_ciphertext,company_id,company_name) VALUES ('user-A','encrypted-test',1,'A'),('user-B','encrypted-test',2,'B');")
    await assert.rejects(db.exec("INSERT INTO reportei_client_links(user_id,client_id,project_id,project_name,timezone,integration_ids) VALUES ('user-A','00000000-0000-4000-8000-000000000002',1,'A','America/Sao_Paulo',ARRAY[1]);"), /foreign key/)
    await db.exec("INSERT INTO reportei_client_links(user_id,client_id,project_id,project_name,timezone,integration_ids) VALUES ('user-A','00000000-0000-4000-8000-000000000001',1,'A','America/Sao_Paulo',ARRAY[1]);")
    await db.exec("INSERT INTO reportei_snapshots(user_id,client_id,start_date,end_date,config_version,payload) VALUES ('user-A','00000000-0000-4000-8000-000000000001','2026-11-01','2026-11-09','version','{}');")
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`RESET ROLE; SET ROLE ${role}`)
      for (const table of ['reportei_connections', 'reportei_client_links', 'reportei_snapshots']) await assert.rejects(db.query(`SELECT * FROM ${table}`), /permission denied/)
    }
    await db.exec("RESET ROLE; SET ROLE service_role; DELETE FROM reportei_connections WHERE user_id='user-A'")
    assert.equal((await db.query('SELECT count(*)::int AS count FROM reportei_snapshots')).rows[0].count, 0)
    assert.equal((await db.query('SELECT count(*)::int AS count FROM reportei_connections')).rows[0].count, 1)
  } finally { await db.close() }
})
