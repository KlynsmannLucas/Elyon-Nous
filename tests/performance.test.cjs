const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript'),crypto=require('node:crypto')
const root=path.join(__dirname,'..'),plain=value=>JSON.parse(JSON.stringify(value))
function load(file,mocks={},globals={}){const module={exports:{}},source=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(source,{module,exports:module.exports,require:id=>id in mocks?mocks[id]:id==='crypto'?crypto:id.startsWith('.')?load(path.posix.join(path.posix.dirname(file),id)+'.ts',mocks,globals):id.startsWith('@/lib/')?load(id.slice(2)+'.ts',mocks,globals):require(id),Response,Request,URL,URLSearchParams,AbortSignal,Buffer,Intl,Date,console,process:{env:{}},...globals},{filename:file});return module.exports}
const summary=load('lib/metaResults.ts'),observations=load('lib/performance/observations.ts'),model=load('lib/performance/model.ts'),formats=load('lib/performance/creative.ts')
const actions=entries=>Object.entries(entries).map(([action_type,value])=>({action_type,value:String(value)}))
test('Meta lead umbrella is not added to forms or site leads; registrations remain a separate event',()=>{
 const data=summary.summarizeMetaResults({objective:'OUTCOME_LEADS',actions:actions({lead:50,'onsite_conversion.lead_grouped':30,'offsite_conversion.fb_pixel_lead':20,'offsite_conversion.fb_pixel_complete_registration':10}),spend:100})
 assert.equal(data.leads,50);assert.equal(data.formLeads,30);assert.equal(data.websiteLeads,20);assert.equal(data.primaryResultValue,30)
 const observed=observations.metaEventValues({actions:actions({'offsite_conversion.fb_pixel_complete_registration':10})});assert.equal(observed.website_leads,0);assert.equal(observed.website_registrations,10)
})
test('new messaging contacts never substitute for conversations and an authoritative zero does not fall back to a different event',()=>{
 const first=summary.summarizeMetaResults({objective:'MESSAGES',actions:actions({'onsite_conversion.messaging_first_reply':12})});assert.equal(first.totalMessages,0);assert.equal(first.primaryResultValue,0)
 const data=observations.metaEventValues({actions:actions({'onsite_conversion.messaging_conversation_started_7d':0,'messaging_conversation_started':25,'onsite_conversion.messaging_first_reply':12})});assert.equal(data.messages_started,0);assert.equal(data.new_message_contacts,12)
})
test('Meta purchase values and destination message totals do not double count aliases or an aggregate',()=>{
 const data=summary.summarizeMetaResults({objective:'OUTCOME_SALES',actions:[...actions({'purchase':2,'omni_purchase':2}),{action_type:'onsite_conversion.messaging_conversation_started_7d',value:'10'},{action_type:'onsite_conversion.messaging_conversation_started_7d',action_destination:'whatsapp',value:'8'},{action_type:'onsite_conversion.messaging_conversation_started_7d',action_destination:'instagram',value:'2'}],actionValues:[{action_type:'purchase',value:'100.25'},{action_type:'omni_purchase',value:'100.25'},{action_type:'offsite_conversion.fb_pixel_purchase',value:'100.25'}]})
 assert.equal(data.revenue,100.25);assert.equal(data.purchases,2);assert.equal(data.totalMessages,10);assert.equal(data.messageConversations,0)
})
test('a conversion campaign with no conversion never becomes a click or reach conversion',()=>{
 const data=summary.summarizeMetaResults({objective:'OUTCOME_LEADS',actions:actions({'link_click':100,'post_engagement':20}),reach:5000,spend:50});assert.equal(data.primaryResultValue,0);assert.equal(data.primaryResultKey,'meta_lead')
})
test('phone stages are not added as if they were distinct calls',()=>{
 const data=summary.summarizeMetaResults({actions:actions({'phone_call':3,'click_to_call':10})});assert.equal(data.phoneCalls,3)
})
test('video metadata is independent of thumbnail availability; mixed formats and carousel are explicit',()=>{
 for(const data of [{video_id:'1',thumbnail_url:'preview.jpg'},{object_story_spec:{video_data:{video_id:'2'}}},{asset_feed_spec:{videos:[{video_id:'3'}]}}])assert.equal(formats.classifyMetaCreative(data),'video')
 assert.equal(formats.classifyMetaCreative({asset_feed_spec:{videos:[{video_id:'3'}],images:[{hash:'image'}]}}),'dynamic')
 assert.equal(formats.classifyMetaCreative({object_story_spec:{link_data:{child_attachments:[{video_id:'1'},{video_id:'2'}]}}}),'carousel')
 assert.equal(formats.classifyMetaCreative({thumbnail_url:'preview.jpg'}),'unknown');assert.equal(formats.classifyMetaCreative({image_hash:'1'}),'image')
 assert.equal(formats.classifyGoogleCreative('RESPONSIVE_SEARCH_AD'),'text');assert.equal(formats.classifyGoogleCreative('VIDEO_AD'),'video');assert.equal(formats.classifyGoogleCreative('RESPONSIVE_DISPLAY_AD'),'dynamic')
})
test('missing observations stay missing, zero is reported, and Google values preserve fractions',()=>{
 assert.equal(observations.metaEventValues(null).messages_started,null);assert.equal(observations.metaEventValues({actions:[]}).messages_started,0)
 const rows=observations.googleObservedMetrics([{spend:12.345,leads:.25,allConversions:1.75,impressions:100,clicks:10}],null)
 assert.equal(rows.find(r=>r.key==='google_conversions').value,.25);assert.equal(rows.find(r=>r.key==='google_forms').value,null)
 assert.equal(observations.purchaseValueFromGoogle([{segments:{conversionActionCategory:'CONTACT'},metrics:{conversionsValue:'50'}},{segments:{conversionActionCategory:'PURCHASE'},metrics:{conversionsValue:'100.5'}}]),100.5)
})
test('result groups preserve event and platform boundaries; reach is not added between campaigns',()=>{
 const groups=model.resultGroups([{platform:'meta',resultType:'message_conversation',resultLabel:'Conversas',results:10,spend:100},{platform:'google',results:2.75,resultLabel:'Conversões',resultType:'google_conversions',spend:50},{platform:'meta',resultType:'reach',resultLabel:'Alcance',results:1000,spend:10},{platform:'meta',resultType:'reach',resultLabel:'Alcance',results:2000,spend:15}])
 assert.equal(groups.length,3);assert.equal(groups.find(r=>r.key==='google_conversions').value,2.75);assert.equal(groups.find(r=>r.key==='reach').value,null)
 assert.equal(model.statusLabel('UNKNOWN'),'Não informado');assert.equal(model.ratio(100,0),null)
})
test('efficiency compares only the same platform and event and does not pronounce low volume a winner',()=>{
 const c={platform:'meta',spend:100,results:5,resultType:'form_lead',resultLabel:'Formulários'}
 const rows=[c,{platform:'google',spend:100,results:1000,resultType:'google_conversions',resultLabel:'Conversões'}]
 assert.equal(model.efficiencySignal(c,rows).label,'Em observação')
})
test('a Reportei account is matched by platform and account ID, never the project name',()=>{
 const report={sources:[{platform:'meta',accountId:'act_123',metrics:[{key:'messages_started',value:10,status:'available'}]},{platform:'meta',accountId:'act_999',metrics:[{key:'messages_started',value:99,status:'available'}]}]}
 assert.equal(model.reportedMetric(report,'meta','messages_started','123').value,10);assert.equal(model.reportedMetric(report,'meta','messages_started','555'),null)
})
test('Meta collection pagination keeps credentials in a header and refuses repeated cursors',async()=>{
 let requests=0
 const graph=load('services/meta/graph-collection.ts',{}, {fetch:async(url,init)=>{requests++;assert.ok(!url.includes('access_token'));assert.equal(init.headers.Authorization,'Bearer test-secret');return Response.json({data:[{id:String(requests)}],paging:{next:'https://untrusted.invalid/do-not-follow',cursors:{after:'same'}}})}})
 await assert.rejects(graph.graph('act_123/insights','test-secret',{fields:'spend'}),/paginação/);assert.equal(requests,2)
})
test('study auth and ownership are verified before reading native tokens or provider data',async()=>{
 let tokens=0
 const query={select(){return this},eq(){return this},maybeSingle:async()=>({data:null})}
 const service=load('services/performance/study.ts',{'@/lib/supabase':{supabaseAdmin:{from:()=>query}},'@/services/meta/token-manager':{getValidMetaToken:async()=>{tokens++;return {}}},'@/services/google/token-manager':{getValidGoogleToken:async()=>{tokens++;return {}}},'@/lib/google-ads':{normalizeCustomerId:v=>v},'@/services/meta/graph-collection':{} })
 await assert.rejects(service.readPerformanceStudy('B','00000000-0000-4000-8000-000000000001',{view:'audience'}),e=>e.status===404);assert.equal(tokens,0)
 const route=load('app/api/performance/study/route.ts',{'@clerk/nextjs/server':{auth:async()=>({userId:null})},'@/services/performance/study':{readPerformanceStudy:async()=>{throw Error('Unauthorized access')}}})
 assert.equal((await route.GET(new Request('https://nous.test/api/performance/study'))).status,401)
})
test('study uses the owned client accounts and exact requested dates; partial breakdown errors do not erase other datasets',async()=>{
 const seen=[],query={select(){return this},eq(){return this},maybeSingle:async()=>({data:{id:'00000000-0000-4000-8000-000000000001',extra_data:{selectedMetaAccountId:'123'}}})}
 const service=load('services/performance/study.ts',{'@/lib/supabase':{supabaseAdmin:{from:()=>query}},'@/services/meta/token-manager':{getValidMetaToken:async()=>({accessToken:'fixture'})},'@/services/google/token-manager':{},'@/lib/google-ads':{normalizeCustomerId:v=>v},'@/services/meta/graph-collection':{graph:async(path,token,params)=>{seen.push({path,params});if(params.breakdowns==='region')throw Error('Unavailable');return {rows:[{spend:'10.25',impressions:'1000',clicks:'10',age:'25-34',gender:'female',actions:actions({'onsite_conversion.messaging_first_reply':3})}],truncated:false}}}})
 const result=await service.readPerformanceStudy('A','00000000-0000-4000-8000-000000000001',{view:'audience',accountId:'999',startDate:'2026-11-01',endDate:'2026-11-02'})
 assert.equal(result.sources[0].accountId,'123');assert.ok(seen.every(r=>r.path==='act_123/insights'));assert.ok(seen.every(r=>JSON.parse(r.params.time_range).since==='2026-11-01'&&JSON.parse(r.params.time_range).until==='2026-11-02'))
 assert.equal(result.sources[0].datasets.regions.status,'unavailable');assert.equal(result.sources[0].datasets.demographics.status,'available');assert.equal(result.sources[0].datasets.demographics.rows[0].events.new_message_contacts,3)
})
test('a missing Reportei service credential reports historical metadata without relabeling old figures as the requested period',async()=>{
 const clientId='00000000-0000-4000-8000-000000000001',config={company_id:1},link={project_id:2,integration_ids:[3],grant_type:'administrator',native_bindings:{},timezone:'America/Sao_Paulo',project_name:'Owned project'}
 const calls=[]
 const db={from(table){let select='',filters=[];const query={select(s){select=s;return this},eq(k,v){filters.push([k,v]);return this},order(){return this},maybeSingle:async()=>({data:table==='reportei_service_config'?config:link}),limit:async()=>{calls.push({table,select,filters});return {data:select==='start_date,end_date,fetched_at'?[{start_date:'2026-10-12',end_date:'2026-11-10',fetched_at:'2026-11-11T12:00:00Z'}]:[]}}};return query}}
 const service=load('services/reportei/internal.ts',{'./workspace':{reporteiDb:()=>db,ownedClient:async()=>({id:clientId})},'./crypto':{},'./client':{ReporteiError:class extends Error{}},'@/services/meta/token-manager':{},'@/services/google/token-manager':{},'@/lib/google-ads':{}})
 const result=await service.readInternalReporteiData('A',clientId,{startDate:'2026-11-01',endDate:'2026-11-12'})
 assert.equal(result.syncState,'setup_pending');assert.deepEqual(plain(result.sources),[]);assert.equal(result.period.startDate,'2026-11-01');assert.equal(result.lastAvailablePeriod.startDate,'2026-10-12');assert.ok(calls.every(c=>c.filters.some(([k,v])=>k==='user_id'&&v==='A')))
})

test('CRM period totals are displayed with their own meaning and duplicate integrations are not summed',()=>{
 const report={sources:[{platform:'kommo',metrics:[{key:'crm_total_leads',value:150,status:'available'},{key:'crm_won_leads',value:12,status:'available'}]}]}
 assert.deepEqual(plain(model.crmIntakeMetric(report)),{label:'Negócios no CRM (período)',value:150})
 report.sources[0].metrics.push({key:'crm_created_leads',value:0,status:'available'})
 assert.deepEqual(plain(model.crmIntakeMetric(report)),{label:'Negócios criados',value:0})
 report.sources.push(plain(report.sources[0]));assert.equal(model.crmMetricValue(report,'crm_won_leads'),null)
})
test('Reportei comparisons fail closed when the selected account is ambiguous',()=>{
 const source={platform:'meta',accountId:'act_123',metrics:[{key:'messages_started',value:10,status:'available'}]}
 assert.equal(model.reportedMetric({sources:[source,{...source,accountId:'999'}]},'meta','messages_started'),null)
 assert.equal(model.reportedMetric({sources:[source,source]},'meta','messages_started','123'),null)
})

test('a failed Meta comparison period or delivery metadata does not erase valid current metrics',async()=>{
 const graph=async(path,token,params)=>{const dates=JSON.parse(params.time_range);if(dates.since!=='2026-11-01')throw Error('Previous unavailable');return {rows:[{campaign_id:'123',campaign_name:'Lead campaign',objective:'OUTCOME_LEADS',spend:'10.25',impressions:'100',clicks:'10',actions:[]}],truncated:false}}
 const route=load('app/api/ads-data/meta/route.ts',{'next/server':{NextResponse:Response},'@clerk/nextjs/server':{auth:async()=>({userId:'owner'})},'@/services/meta/token-manager':{getValidMetaToken:async()=>({accessToken:'fixture',accountId:'123'})},'@/services/meta/graph-collection':{graph}}, {fetch:async()=>{throw Error('Optional metadata unavailable')}})
 const response=await route.POST(new Request('https://nous.test/api/ads-data/meta',{method:'POST',body:JSON.stringify({startDate:'2026-11-01',endDate:'2026-11-02'})})),data=await response.json()
 assert.equal(response.status,200);assert.equal(data.totals.spend,10.25);assert.equal(data.previousTotals,null);assert.equal(data.campaigns[0].status,'UNKNOWN');assert.equal(data.campaigns[0].results,0)
})
test('creative study uses the actual Meta objective instead of substituting clicks for absent leads',async()=>{
 const query={select(){return this},eq(){return this},maybeSingle:async()=>({data:{extra_data:{selectedMetaAccountId:'123'}}})}
 const service=load('services/performance/study.ts',{'@/lib/supabase':{supabaseAdmin:{from:()=>query}},'@/services/meta/token-manager':{getValidMetaToken:async()=>({accessToken:'fixture'})},'@/services/google/token-manager':{},'@/lib/google-ads':{normalizeCustomerId:v=>v},'@/services/meta/graph-collection':{graph:async(path,token,params)=>({rows:path.endsWith('/ads')?[{id:'ad1',creative:{video_id:'v1',thumbnail_url:'https://example.com/preview.jpg'}}]:[{ad_id:'ad1',objective:'OUTCOME_LEADS',spend:'20',impressions:'1000',clicks:'50',actions:[]}],truncated:false})}})
 const data=await service.readPerformanceStudy('owner','00000000-0000-4000-8000-000000000001',{view:'creative',startDate:'2026-11-01',endDate:'2026-11-02'}),ad=data.sources[0].datasets.creatives.rows[0]
 assert.equal(ad.format,'video');assert.equal(ad.results,0);assert.equal(ad.resultType,'meta_lead')
})
