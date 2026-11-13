const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const crypto = require('node:crypto')
const root = path.join(__dirname, '..')

function load(file, mocks = {}, globals = {}) {
  const module = { exports: {} }
  const source = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText
  vm.runInNewContext(source, { module, exports: module.exports, require: id => {
    if (id in mocks) return mocks[id]
    if (id === 'crypto') return crypto
    if (id === '@/lib/performance/observations') return load('lib/performance/observations.ts', {'@/lib/reportei-metrics': metrics, '@/lib/marketing-totals': totals}, globals)
    if (id === '@/lib/reporting-period') return periods
    if (id === '@/services/meta/graph-collection') return load('services/meta/graph-collection.ts', {}, globals)
    throw new Error(`Unexpected dependency: ${id}`)
  }, console, Response, Request, URL, URLSearchParams, AbortSignal, Buffer, Intl, process, ...globals }, { filename: file })
  return module.exports
}
const totals = load('lib/marketing-totals.ts')
const periods = load('lib/reporting-period.ts')
const metrics = load('lib/reportei-metrics.ts')
const plain = value => JSON.parse(JSON.stringify(value))

test('numeric API strings, fractional conversions and zero totals are preserved without double counting', () => {
  const campaigns = [{ spend: '10.10', clicks: '10', impressions: '1000', leads: '.25', revenue: '100', platform: 'google' },
    { spend: '20.20', clicks: '20', impressions: '2000', leads: '1.5', revenue: '200', platform: 'google' }]
  const sum = totals.platformTotals(campaigns)
  const result = totals.aggregateAuditMetrics([{ campaigns, totals: sum }])
  assert.equal(result.totalSpend, 30.3)
  assert.equal(result.totalClicks, 30)
  assert.equal(result.totalImpressions, 3000)
  assert.equal(result.totalRevenue, 300)
  assert.equal(result.totalLeads, 1.75)
  assert.equal(totals.platformTotals(campaigns, { clicks: 0 }).clicks, 0)
  assert.throws(() => totals.metricNumber('9.417216730425122e38'), /seguro/)
  assert.throws(() => totals.metricNumber('unknown'), /seguro/)
})

test('mixed campaign objectives do not produce a comparable blended cost per result', () => {
  const result = totals.aggregateAuditMetrics([{ campaigns: [
    { spend: 100, results: 10000, resultLabel: 'Exibições' }, { spend: 100, results: 10, resultLabel: 'Conversas' }
  ] }])
  assert.equal(result.resultsComparable, false)
  assert.equal(result.avgCostPerResult, null)
})

test('all providers use inclusive dates with equal previous periods and the client calendar', () => {
  const period = periods.resolveReportingPeriod({ datePreset: 'last_14d' }, new Date('2026-11-11T01:00:00Z'))
  assert.equal(period.endDate, '2026-11-09') // still Nov 10 in Sao Paulo
  assert.equal(period.startDate, '2026-10-27')
  const previous = periods.previousReportingPeriod(period)
  assert.equal(previous.endDate, '2026-10-26')
  assert.equal(previous.startDate, '2026-10-13')
  const one = periods.previousReportingPeriod({ ...period, startDate: '2026-11-01', endDate: '2026-11-01' })
  assert.equal(one.startDate, '2026-10-31'); assert.equal(one.endDate, '2026-10-31')
  assert.throws(() => periods.resolveReportingPeriod({ startDate: "2026-01-01' OR 1=1", endDate: '2026-11-01' }))
  assert.throws(() => periods.resolveReportingPeriod({ startDate: '2026-02-30', endDate: '2026-03-01' }))
  assert.throws(() => periods.resolveReportingPeriod({ datePreset: 'anything' }))
})

test('catalog discovery excludes duplicate views, dimensions and all-time CRM widgets', () => {
  const widget = (reference_key, metric, extra = {}) => ({ reference_key, component: 'number_v1', metrics: [metric], ...extra })
  const selected = metrics.selectReporteiMetrics([
    widget('fb_ads:first', 'actions:onsite_conversion.messaging_first_reply'),
    widget('fb_ads:conversations', 'actions:onsite_conversion.messaging_conversation_started_7d'),
    widget('fb_ads:conversations_instagram', 'actions:onsite_conversion.messaging_conversation_started_7d', { dimensions: ['instagram'] }),
    widget('kommo:open_leads', 'open_leads'), widget('kommo:total_open_leads', 'open_leads')
  ])
  assert.deepEqual(plain(selected.map(row => row.reference_key)), ['fb_ads:first', 'fb_ads:conversations', 'kommo:open_leads'])
})

test('source errors and missing data stay unavailable while a real reported zero stays zero', () => {
  const widget = { reference_key: 'fb_ads:first', component: 'number_v1', metrics: ['actions:onsite_conversion.messaging_first_reply'] }
  assert.equal(metrics.normalizeReporteiMetric(widget, { values: '0' }).value, 0)
  for (const result of [undefined, { values: null }, { values: '' }, { values: 'Infinity' }, { type: 'expired_token' }]) {
    const normalized = metrics.normalizeReporteiMetric(widget, result)
    assert.equal(normalized.value, null); assert.equal(normalized.status, 'unavailable')
  }
})

test('comparison retains both readings, and unknown native breakdowns are never invented', () => {
  const native = metrics.nativeObservedMetrics({ platform: 'meta', success: true, accountId: '123', totals: { spend: 100 }, campaigns: [{ totalMessageConversations: 10 }] })
  const observation = { key: 'messages_started', referenceKey: 'fb', label: 'Conversas', description: '', value: 11, status: 'available' }
  const compared = metrics.compareObservedMetrics(native, [observation]).find(row => row.key === 'messages_started')
  assert.equal(compared.native.value, 10); assert.equal(compared.reportei.value, 11); assert.equal(compared.status, 'different')
  assert.equal(native.find(row => row.key === 'website_leads').value, null)
  assert.equal(metrics.normalizeAccountId('meta', 'act_123'), '123')
  assert.equal(metrics.normalizeAccountId('google', '012-345-6789'), '0123456789')
})

test('legacy audits are archived and cannot supply current metrics after hydration', () => {
  const cache = load('lib/audit-data.ts').normalizeAuditCache({ A: [{ id: 'old', audit: { _realMetrics: { totalClicks: 1e38 }, _campanhasClassificadas: { vencedoras: [] } } }],
    B: [{ audit: { _metricsVersion: 2, _realMetrics: { totalClicks: 30 } } }] })
  assert.equal(cache.A[0].audit._realMetrics, null)
  assert.equal(cache.A[0].audit._legacyRealMetrics.totalClicks, 1e38)
  assert.equal(cache.A[0].audit._metricsNeedRefresh, true)
  assert.equal(cache.B[0].audit._realMetrics.totalClicks, 30)
})

test('Google pagination reads every page and refuses a repeated page token', async () => {
  const requests = []
  const google = load('lib/google-ads.ts', {}, { fetch: async (_, request) => {
    const body = JSON.parse(request.body); requests.push(body)
    return Response.json(body.pageToken ? { results: [{ campaign: { id: '2' } }] } : { results: [{ campaign: { id: '1' } }], nextPageToken: 'next' })
  } })
  const rows = await google.gaqlSearch('123', 'test-access', 'test-developer', 'select campaign.id from campaign')
  assert.equal(rows.length, 2); assert.equal(requests[1].pageToken, 'next')
  const looping = load('lib/google-ads.ts', {}, { fetch: async () => Response.json({ results: [], nextPageToken: 'same' }) })
  await assert.rejects(looping.gaqlSearch('123', 'test-access', 'test-developer', 'query'), /repetiu/)
})

test('Reportei API respects pagination, never follows credential redirects and handles a partial source independently', async () => {
  const requests = []
  const client = load('services/reportei/client.ts', { '@/lib/reportei-metrics': metrics }, { fetch: async (url, request) => {
    requests.push({ url, request })
    return Response.json({ data: [{ id: url.includes('page=2&') ? 2 : 1 }], meta: { last_page: 2 } })
  } })
  const rows = await client.reporteiList('test-token', '/projects')
  assert.equal(rows.length, 2); assert.equal(rows[1].id, 2)
  assert.equal(requests[0].request.redirect, 'error')
  assert.equal(requests[0].request.cache, 'no-store')
  const failing = load('services/reportei/client.ts', { '@/lib/reportei-metrics': metrics }, { fetch: async () => Response.json({ error: 'secret must not be echoed' }, { status: 401 }) })
  await assert.rejects(failing.reporteiRequest('test-token', '/projects'), error => error.status === 401 && !error.message.includes('secret'))
  const source = await failing.fetchReporteiIntegration('test-token', { id: 1, slug: 'kommo', status: 'active' }, { startDate: '2026-11-01', endDate: '2026-11-09' })
  assert.equal(source.status, 'unavailable'); assert.equal(source.metrics.length, 0)
})

test('Reportei encryption fails closed, authenticates ciphertext and has no shared fallback', () => {
  const previous = process.env.REPORTEI_ENCRYPTION_KEY
  try {
    delete process.env.REPORTEI_ENCRYPTION_KEY
    const encryption = load('services/reportei/crypto.ts')
    assert.throws(() => encryption.encryptReporteiToken('example'), /configured/)
    process.env.REPORTEI_ENCRYPTION_KEY = 'ab'.repeat(32)
    const cipher = encryption.encryptReporteiToken('example')
    assert.ok(!cipher.includes('example'))
    assert.equal(encryption.decryptReporteiToken(cipher), 'example')
    process.env.REPORTEI_ENCRYPTION_KEY = 'cd'.repeat(32)
    assert.throws(() => encryption.decryptReporteiToken(cipher))
  } finally { if (previous === undefined) delete process.env.REPORTEI_ENCRYPTION_KEY; else process.env.REPORTEI_ENCRYPTION_KEY = previous }
})

test('ownership is checked before querying another client link or the Reportei service', async () => {
  const calls = []
  const reporteiClient = load('services/reportei/client.ts', { '@/lib/reportei-metrics': metrics })
  const db = { from: table => {
    calls.push(['table', table]); const filters = {}
    const query = { select: () => query, eq: (key, value) => { filters[key] = value; return query }, maybeSingle: async () => {
      calls.push(['filters', filters]); return { data: null, error: null }
    } }; return query
  } }
  const workspace = load('services/reportei/workspace.ts', { '@/lib/supabase': { supabaseAdmin: db }, './crypto': {}, '@/lib/reporting-period': periods, './client': reporteiClient })
  await assert.rejects(workspace.clientReporteiLink('user-A', '00000000-0000-4000-8000-000000000001'), error => error.status === 404)
  assert.equal(calls.length, 2); assert.equal(calls[0][1], 'clients')
  assert.equal(calls[1][1].user_id, 'user-A')
})

test('every Reportei endpoint rejects unauthenticated requests before database/API calls', async () => {
  for (const [file, methods] of [['connection', ['GET','POST','DELETE']], ['client', ['GET','PUT','DELETE']], ['projects',['GET']], ['data',['GET']]]) {
    const route = load(`app/api/reportei/${file}/route.ts`, {
      '@clerk/nextjs/server': { auth: async () => ({ userId: null }) }, 'next/server': { NextResponse: Response },
      '@/services/reportei/workspace': {}, '@/services/reportei/client': {}, '@/services/reportei/response': {}
    })
    for (const method of methods) assert.equal((await route[method](new Request('https://nous.example/api/reportei'))).status, 401)
  }
})

test('Google HTTP route keeps every campaign, parses numeric strings and uses the requested exact dates', async () => {
  const previous = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  process.env.GOOGLE_ADS_DEVELOPER_TOKEN = 'test-developer'
  let query
  try {
    const route = load('app/api/ads-data/google/route.ts', {
      'next/server': { NextResponse: Response }, '@clerk/nextjs/server': { auth: async () => ({ userId: 'user-A' }) },
      '@/services/google/token-manager': { getValidGoogleToken: async id => { assert.equal(id, 'user-A'); return { accessToken: 'test', accountId: '0123456789' } } },
      '@/lib/google-ads': { normalizeCustomerId: id => String(id).replace(/-/g, ''), gaqlSearch: async (...args) => {
        query = args[3]
        return Array.from({ length: 31 }, (_, index) => ({ campaign: { id: String(index) }, metrics: { costMicros: '1000000', clicks: '10', impressions: '1000', conversions: '.25', conversionsValue: '2' } }))
      } }, '@/lib/errMsg': { errMsg: error => error.message }, '@/lib/marketing-totals': totals, '@/lib/reporting-period': periods
    })
    const response = await route.POST({ json: async () => ({ startDate: '2026-11-01', endDate: '2026-11-09' }) })
    const result = await response.json()
    assert.equal(response.status, 200); assert.equal(result.campaigns.length, 31)
    assert.equal(result.totals.clicks, 310); assert.equal(result.totals.impressions, 31000)
    assert.equal(result.totals.leads, 7.75); assert.equal(result.totals.revenue, 62)
    assert.ok(query.includes("BETWEEN '2026-11-01' AND '2026-11-09'")); assert.ok(!query.includes('LIMIT'))
  } finally { if (previous === undefined) delete process.env.GOOGLE_ADS_DEVELOPER_TOKEN; else process.env.GOOGLE_ADS_DEVELOPER_TOKEN = previous }
})

test('Reportei setup is internal and the retired customer route exposes no credential', async () => {
  const route = load('app/api/reportei/connection/route.ts', {
    '@clerk/nextjs/server': { auth: async () => ({ userId: 'user-A' }) }, 'next/server': { NextResponse: Response },
    '@/services/reportei/workspace': { reporteiConnection: async userId => { assert.equal(userId, 'user-A'); return { token_ciphertext: 'sensitive-example', company_name: 'A', connected_at: '2026-11-01' } } },
    '@/services/reportei/response': {}
  })
  const response = await route.GET()
  const result = await response.text()
  assert.equal(response.status, 410); assert.ok(!result.includes('token')); assert.ok(!result.includes('sensitive-example'))
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
})

test('changing Reportei company refuses the new token without deleting links or replacing credentials', async () => {
  let writes = 0
  const client = load('services/reportei/client.ts', { '@/lib/reportei-metrics': metrics })
  const query = { select() { return this }, eq() { return this }, maybeSingle: async () => ({ data: { company_id: 1 }, error: null }),
    upsert: async () => { writes++; return {} }, delete: () => { writes++; return query } }
  const workspace = load('services/reportei/workspace.ts', {
    '@/lib/supabase': { supabaseAdmin: { from: () => query } }, './crypto': { encryptReporteiToken: () => 'encrypted-fixture' },
    '@/lib/reporting-period': periods, './client': { ...client, reporteiRequest: async () => ({ company: { id: 2, name: 'Other company' } }) }
  })
  await assert.rejects(workspace.connectReportei('user-A', 'fixture-token-with-valid-length'), error => error.status === 409)
  assert.equal(writes, 0)
})

test('daily snapshots are limited to the selected account and current reporting period', async () => {
  const period = periods.resolveReportingPeriod({ datePreset: 'last_7d' })
  const rows = [{ user_id: 'user-A', platform: 'meta', account_id: '111', date: '2026-07-01', spend: 50 },
    { user_id: 'user-A', platform: 'meta', account_id: '111', date: period.startDate, spend: 100 },
    { user_id: 'user-B', platform: 'meta', account_id: '111', date: period.startDate, spend: 200 }]
  const predicates = []
  const query = { select() { return this }, eq(key, value) { predicates.push(row => row[key] === value); return this },
    gte(key, value) { predicates.push(row => row[key] >= value); return this }, lte(key, value) { predicates.push(row => row[key] <= value); return this },
    order() { return this }, limit() { return this }, then(resolve) { return Promise.resolve({ data: rows.filter(row => predicates.every(predicate => predicate(row))), error: null }).then(resolve) } }
  const route = load('app/api/metrics/daily/route.ts', { 'next/server': { NextResponse: Response }, '@clerk/nextjs/server': { auth: async () => ({ userId: 'user-A' }) },
    '@/lib/supabase': { supabaseAdmin: { from: () => query } }, '@/lib/reporting-period': periods })
  const response = await route.GET({ nextUrl: new URL('https://nous.example/api/metrics/daily?accountId=111&datePreset=last_7d') })
  const result = await response.json()
  assert.equal(result.days.length, 1); assert.equal(result.days[0].spend, 100); assert.equal(result.period.startDate, period.startDate)
})
