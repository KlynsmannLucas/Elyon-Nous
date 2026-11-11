const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const vm=require('node:vm')
const ts=require('typescript')
const root=path.join(__dirname,'..')
function load(file,mocks={},globals={}){
 const module={exports:{}}
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:id=>id in mocks?mocks[id]:require(id),console,Buffer,Response,Request,URL,URLSearchParams,AbortSignal,process:{env:{}},...globals},{filename:file})
 return module.exports
}
const schema=load('lib/studio/schema.ts'),plain=value=>JSON.parse(JSON.stringify(value))
const brief={mode:'campaign',prompt:'Criar campanha de móveis em Curitiba',platforms:['meta','google'],objective:'leads',dailyBudget:100.01,city:'Curitiba, PR, Brasil',radiusKm:25,destinationUrl:'https://example.com',referenceIds:[],formats:['feed','story'],brandColors:[]}
const plan={name:'Cozinhas',summary:'Campanha de teste',positioning:'Projeto com atendimento local',confirmedFacts:['Atende Curitiba'],missingInformation:[],warnings:[],measurement:{primaryEvent:'Lead',howToMeasure:'Validar o evento',attributionNote:'Não somar origens'},meta:{enabled:true,campaignName:'Meta',objective:'OUTCOME_LEADS',dailyBudget:500,specialCategory:'NONE',audiences:[{name:'Amplo local',strategy:'broad',interestQueries:['Móveis'],exclusions:[],reasoning:'Teste local',hypothesis:'A oferta pode atrair contatos'}],ads:[{headline:'Sua cozinha planejada',primaryText:'Conheça as opções.',description:'Peça um orçamento',cta:'LEARN_MORE',angle:'Projeto',testHypothesis:'Comparar a oferta'}]},google:{enabled:true,campaignName:'Search',dailyBudget:500,adGroups:[{name:'Cozinhas',keywords:[{text:'cozinha planejada',matchType:'EXACT'}],negativeKeywords:['grátis'],headlines:['Cozinha planejada','Projeto para seu espaço','Converse com a equipe'],descriptions:['Conheça as opções para sua cozinha.','Solicite uma avaliação do seu projeto.'],path1:'cozinhas',path2:'projetos',reasoning:'Intenção comercial'}],audienceSignals:['Busca por orçamento'],goalNote:'Revisar a conversão principal'},creativeBriefs:[{concept:'Cozinha real',artDirection:'Preservar o produto da referência',imagePrompt:'Foto comercial de uma cozinha, com produto fiel à imagem de referência e iluminação natural.',overlayHeadline:'Sua cozinha planejada',overlayCTA:'Saiba mais'}],testPlan:[{hypothesis:'A oferta ajuda a resposta',change:'Título',successMetric:'Custo por lead',minimumEvidence:'Aguardar amostra suficiente'}]}
test('budget preserves cents across channels and removes allocation to disabled channels',()=>{
 for(const dailyBudget of [0,.01,13.59,100.01,999.99]){
  const normalized=schema.normalizeCampaignPlan(plan,{...brief,dailyBudget})
  assert.equal(Math.round(normalized.meta.dailyBudget*100)+Math.round(normalized.google.dailyBudget*100),Math.round(dailyBudget*100))
 }
 const single=schema.normalizeCampaignPlan(plan,{...brief,platforms:['google']});assert.equal(single.meta.dailyBudget,0);assert.equal(single.google.dailyBudget,100.01)
 assert.deepEqual(plain(schema.generationCost(brief)),{plan:4,images:10,total:14})
 assert.equal(schema.generationCost({...brief,mode:'audience'}).total,4)
})
test('brief rejects duplicate refs, bad links, private addresses and excessive formats',()=>{
 assert.equal(schema.briefSchema.safeParse(brief).success,true)
 for(const destinationUrl of ['http://example.com','https://localhost','https://127.0.0.1','https://169.254.169.254','https://172.16.1.2','https://user:pass@example.com'])assert.equal(schema.briefSchema.safeParse({...brief,destinationUrl}).success,false)
 assert.equal(schema.briefSchema.safeParse({...brief,formats:['feed','feed']}).success,false)
 assert.equal(schema.briefSchema.safeParse({...brief,platforms:['meta','meta']}).success,false)
})
test('reference bytes reach the image editing provider without a silent reference-free fallback',async()=>{
 const calls=[],buffer=Buffer.from('real-reference-fixture')
 const imageModel={supportsFileInputs:true}
 const gateway=()=>({});gateway.image=()=>{throw new Error('References must not use an unverified adapter')}
 const ai=load('services/studio/ai.ts',{'ai':{generateImage:async args=>{calls.push(args);return {image:{uint8Array:Buffer.from('png')}}},gateway},'@ai-sdk/openai':{createOpenAI:()=>({image:()=>imageModel})},'@/lib/studio/schema':schema,'./access':{StudioError:class extends Error{}}},{process:{env:{OPENAI_API_KEY:'fixture'}}})
 const result=await ai.renderStudioCreative({...brief,referenceIds:['00000000-0000-4000-8000-000000000001']},plan,'story',[{name:'Produto',kind:'product',buffer}])
 assert.equal(calls.length,1);assert.equal(calls[0].prompt.images[0],buffer);assert.equal(calls[0].size,'1152x2048');assert.equal(result.model,'gpt-image-2.6-sunburst')
})
test('ambiguous inference failure never retries on another billing provider',async()=>{
 let calls=0
 const ai=load('services/studio/ai.ts',{'ai':{generateText:async()=>{calls++;throw {statusCode:504}},gateway:()=>({}),Output:{object:()=>({})}},'@ai-sdk/openai':{createOpenAI:()=>()=>({})},'@/lib/studio/schema':schema,'./access':{StudioError:class extends Error{}}},{process:{env:{OPENAI_API_KEY:'fixture',AI_GATEWAY_API_KEY:'fixture'}}})
 await assert.rejects(ai.createStudioPlan(brief,{client_data:{}},[]));assert.equal(calls,1)
})
test('only pre-inference rejection falls back and plan receives image context',async()=>{
 let calls=0,received
 const ai=load('services/studio/ai.ts',{'ai':{generateText:async args=>{calls++;received=args;if(calls===1)throw {statusCode:403};return {output:plan}},gateway:()=>({}),Output:{object:()=>({})}},'@ai-sdk/openai':{createOpenAI:()=>()=>({})},'@/lib/studio/schema':schema,'./access':{StudioError:class extends Error{}}},{process:{env:{OPENAI_API_KEY:'fixture',AI_GATEWAY_API_KEY:'fixture'}}})
 const result=await ai.createStudioPlan(brief,{client_data:{clientName:'A'}},[{name:'Produto',kind:'product',buffer:Buffer.from('ref')}]);assert.equal(calls,2);assert.equal(received.messages[0].content[1].type,'image');assert.equal(result.provider,'openai')
})
test('automatic internal Reportei link accepts only matching verified ad accounts, never CRM or a project name',()=>{
 const internal=load('services/reportei/internal.ts',{'./workspace':{},'./crypto':{},'./client':{integrationPlatform:slug=>({facebook_ads:'meta',google_adwords:'google',kommo:'kommo'})[slug]},'@/lib/reporting-period':{},'@/lib/reportei-metrics':{normalizeAccountId:(platform,id)=>String(id).replace(/^act_/,'').replace(/-/g,'')},'@/services/meta/token-manager':{},'@/services/google/token-manager':{},'@/lib/google-ads':{}})
 const rows=[{id:1,slug:'facebook_ads',source_id:'act_123'},{id:2,slug:'facebook_ads',source_id:'act_999'},{id:3,slug:'kommo',source_id:'123'},{id:4,slug:'google_adwords',source_id:'123-456-7890'}]
 assert.deepEqual(plain(internal.accountMatches(rows,[{platform:'meta',accountId:'123'}])).map(r=>r.id),[1])
})
test('image access never crosses a user or a client path, even if stored metadata is inconsistent',async()=>{
 let row={id:'00000000-0000-4000-8000-000000000003',client_id:'00000000-0000-4000-8000-000000000001',user_id:'A',storage_path:'A/00000000-0000-4000-8000-000000000002/secret.png'}
 const client={id:row.client_id,client_data:{clientName:'A'}},filters=[]
 const query={select(){return this},eq(k,v){filters.push([k,v]);return this},maybeSingle:async()=>({data:filters.every(([k,v])=>row?.[k]===v)?row:null})}
 const assets=load('services/studio/assets.ts',{'sharp':()=>{},'@/lib/persistence':{normalizeClientId:v=>v},'@/lib/studio/schema':schema,'./access':{studioClient:async()=>client,studioDb:()=>({from:()=>query}),StudioError:class extends Error{constructor(message,status){super(message);this.status=status}}}})
 await assert.rejects(assets.ownedStudioAsset('A',client.id,row.id),e=>e.status===403)
 filters.length=0;await assert.rejects(assets.ownedStudioAsset('B',client.id,row.id),e=>e.status===404)
})
module.exports={brief,plan}
test('all Studio routes and internal administration reject unauthenticated access before database work',async()=>{
 class StudioError extends Error{constructor(message,status){super(message);this.status=status}}
 const denied={studioIdentity:async()=>{throw new StudioError('Entre na sua conta.',401)},studioFailure:error=>Response.json({error:error.message},{status:error.status}),sameOrigin:()=>{},studioResponse:()=>{throw new Error('Unexpected success')},studioDb:()=>{throw new Error('Unauthorized database access')},StudioError}
 const never=new Proxy({}, {get:()=>()=>{throw new Error('Unauthorized service access')}})
 for(const [file,method]of [['jobs/route.ts','GET'],['jobs/route.ts','POST'],['jobs/[id]/route.ts','GET'],['jobs/[id]/run/route.ts','POST'],['assets/route.ts','GET'],['assets/route.ts','POST'],['assets/[id]/file/route.ts','GET'],['assets/[id]/route.ts','DELETE'],['jobs/[id]/publication/route.ts','GET'],['jobs/[id]/publication/route.ts','POST']]){
  const route=load(`app/api/studio/${file}`,{'@/services/studio/access':denied,'@/services/studio/assets':never,'@/services/studio/jobs':never,'@/services/studio/publication':never})
  const response=await route[method](new Request('https://nous.example/api/studio/test'),{params:{id:'00000000-0000-4000-8000-000000000001'}})
  assert.equal(response.status,401,file)
 }
 for(const status of [401,403]){
  const route=load('app/api/admin/reportei/route.ts',{'next/server':{NextResponse:Response},'@/lib/server-admin':{administrator:async()=>({allowed:false,status})},'@/services/reportei/workspace':never,'@/services/reportei/internal':never,'@/services/reportei/response':never})
  assert.equal((await route.GET(new Request('https://nous.example/api/admin/reportei'))).status,status)
  assert.equal((await route.POST(new Request('https://nous.example/api/admin/reportei'))).status,status)
 }
})

test('Google draft is atomic, paused, scoped to a verified account and preserves approved budget and exact matches',()=>{
 const pub=load('services/studio/publication.ts',{'./access':{StudioError:class extends Error{}},'./assets':{},'@/services/meta/token-manager':{},'@/services/google/token-manager':{},'@/lib/google-ads':{},'@/lib/studio/schema':schema})
 const prepared=schema.normalizeCampaignPlan(plan,brief)
 const operations=pub.googleDraftOperations('1234567890',brief,prepared,'geoTargetConstants/123','languageConstants/999',2.5,'fixture-job')
 const campaign=operations.find(r=>r.campaignOperation).campaignOperation.create
 assert.equal(campaign.status,'PAUSED');assert.equal(campaign.advertisingChannelType,'SEARCH')
 assert.equal(operations[0].campaignBudgetOperation.create.amountMicros,String(Math.round(prepared.google.dailyBudget*1e6)))
 const keyword=operations.find(r=>r.adGroupCriterionOperation?.create.keyword&&!r.adGroupCriterionOperation.create.negative).adGroupCriterionOperation.create
 assert.equal(keyword.keyword.matchType,'EXACT');assert.equal(keyword.status,'PAUSED')
 const ad=operations.find(r=>r.adGroupAdOperation).adGroupAdOperation.create
 assert.equal(ad.status,'PAUSED');assert.equal(ad.ad.finalUrls[0],brief.destinationUrl)
 assert.ok(!JSON.stringify(operations).includes('"ACTIVE"'));assert.ok(!JSON.stringify(operations).includes('"ENABLED"'))
 assert.ok(campaign.resourceName.startsWith('customers/1234567890/'))
})
function publicationFixture(platform='google',ambiguous=false){
 const clientId='00000000-0000-4000-8000-000000000001',jobId='00000000-0000-4000-8000-000000000003',assetId='00000000-0000-4000-8000-000000000004'
 const normalized=schema.normalizeCampaignPlan(plan,brief),calls=[],state={publication:null}
 const client={id:clientId,extra_data:{selectedGoogleAccountId:'1234567890',selectedMetaAccountId:'123'}}
 const job={id:jobId,client_id:clientId,brief,plan:{campaign:normalized,targeting:{sources:[{platform:'google',account:{id:'1234567890'},locations:[{resourceName:'geoTargetConstants/123'}]},{platform:'meta',account:{id:'act_123'},locations:[{key:'456'}],interests:[]}]}}}
 class StudioError extends Error{constructor(message,status){super(message);this.status=status}}
 const db={from:()=>{let action='read',value;const query={insert(v){action='insert';value=v;return this},update(v){action='update';value=v;return this},select(){return this},eq(){return this},single:async()=>{if(state.publication)return {data:null,error:{code:'23505'}};state.publication={id:'publication',...value};return {data:state.publication}},maybeSingle:async()=>({data:state.publication}),then(resolve,reject){if(action==='update')Object.assign(state.publication,value);return Promise.resolve({error:null}).then(resolve,reject)}};return query},storage:{from:()=>({download:async()=>({data:new Blob(['png fixture'])})})}}
 const api=load('services/studio/publication.ts',{'./access':{studioJob:async user=>{if(user!=='A')throw new StudioError('Not found',404);return job},studioClient:async()=>client,studioDb:()=>db,StudioError},'./assets':{ownedStudioAsset:async()=>({row:{job_id:jobId,kind:'generated',format:'feed',storage_path:'A/client/asset.png'},bucket:'studio-assets'})},'@/services/meta/token-manager':{getValidMetaToken:async()=>({accessToken:'fixture'})},'@/services/google/token-manager':{getValidGoogleToken:async()=>({accessToken:'fixture'})},'@/lib/google-ads':{normalizeCustomerId:v=>String(v).replace(/-/g,''),gaqlSearch:async(id,token,developer,query)=>{assert.equal(id,'1234567890');return query.includes('geo_target_constant')?[{geoTargetConstant:{status:'ENABLED'}}]:query.includes('language_constant')?[{languageConstant:{resourceName:'languageConstants/999'}}]:[{customer:{id:'1234567890',currencyCode:'BRL',manager:false}}]}},'@/lib/studio/schema':schema},{process:{env:{GOOGLE_ADS_DEVELOPER_TOKEN:'fixture'}},fetch:async(url,init)=>{
  calls.push({url,init})
  if(platform==='google'){
   const body=JSON.parse(init.body)
   if(ambiguous&&!body.validateOnly)throw new Error('Network timeout')
   return Response.json(body.validateOnly?{}:{mutateOperationResponses:[{campaignResult:{resourceName:'customers/1234567890/campaigns/1'}}]})
  }
  const uri=new URL(url),resource=uri.pathname.replace('/v21.0/','')
  let data=resource==='act_123'?{id:'act_123',currency:'BRL',account_status:1}:resource.endsWith('promote_pages')?{data:[{id:'10',name:'Page'}]}:resource.endsWith('adspixels')?{data:[{id:'99',name:'Pixel'}]}:resource.endsWith('customaudiences')?{data:[]}:resource==='10'?{id:'10'}:resource==='search'?{data:[{key:'456'}]}:resource.endsWith('adimages')?{images:{upload:{hash:'image-hash'}}}:{id:resource.endsWith('campaigns')?'campaign-id':resource.endsWith('adsets')?'set-id':resource.endsWith('adcreatives')?'creative-id':'ad-id'}
  return Response.json(data)
 }})
 const selection={platform,location:platform==='meta'?'456':'geoTargetConstants/123',reviewed:true,political:false,confirmedBudget:normalized[platform].dailyBudget,confirmedDestination:brief.destinationUrl,pageId:'10',pixelId:'99',assetId,audienceIndex:0,maxCpc:2}
 return {api,selection,calls,state,jobId,client}
}
test('Google delivery validates, mutates once, and returns the receipt on duplicate submission',async()=>{
 const f=publicationFixture(),first=await f.api.deliverPausedDraft('A',f.jobId,f.selection)
 assert.equal(first.status,'paused');assert.equal(f.calls.length,2)
 assert.equal(JSON.parse(f.calls[0].init.body).validateOnly,true);assert.equal(JSON.parse(f.calls[1].init.body).validateOnly,false)
 assert.equal(JSON.parse(f.calls[1].init.body).partialFailure,false)
 assert.equal((await f.api.deliverPausedDraft('A',f.jobId,f.selection)).status,'paused');assert.equal(f.calls.length,2)
})
test('an uncertain Google mutation is recorded and never automatically repeated',async()=>{
 const f=publicationFixture('google',true)
 assert.equal((await f.api.deliverPausedDraft('A',f.jobId,f.selection)).status,'partial');assert.equal(f.calls.length,2)
 assert.equal((await f.api.deliverPausedDraft('A',f.jobId,f.selection)).status,'partial');assert.equal(f.calls.length,2)
})
test('Meta delivery uses selected account/page/pixel, owned art, exact budget and PAUSED for every serving object',async()=>{
 const f=publicationFixture('meta'),result=await f.api.deliverPausedDraft('A',f.jobId,f.selection)
 assert.equal(result.status,'paused')
 const writes=f.calls.filter(r=>r.init.method==='POST')
 assert.equal(writes.length,5)
 for(const call of writes.filter(r=>/\/(campaigns|adsets|ads)$/.test(r.url)))assert.equal(new URLSearchParams(call.init.body).get('status'),'PAUSED')
 const adset=new URLSearchParams(writes.find(r=>r.url.endsWith('/adsets')).init.body)
 assert.equal(adset.get('daily_budget'),String(Math.round(f.selection.confirmedBudget*100)))
 assert.equal(JSON.parse(adset.get('promoted_object')).pixel_id,'99')
 assert.equal(JSON.parse(adset.get('targeting')).geo_locations.cities[0].key,'456')
 const count=f.calls.length;assert.equal((await f.api.deliverPausedDraft('A',f.jobId,f.selection)).status,'paused');assert.equal(f.calls.filter(r=>r.init.method==='POST').length,writes.length)
})
test('publication refuses a changed native account, unowned job, unreviewed payload and inflated budget before any write',async()=>{
 for(const mutation of ['account','user','review','budget']){
  const f=publicationFixture();let user='A',input={...f.selection}
  if(mutation==='account')f.client.extra_data.selectedGoogleAccountId='9999999999'
  if(mutation==='user')user='B'
  if(mutation==='review')input.reviewed=false
  if(mutation==='budget')input.confirmedBudget=999
  await assert.rejects(f.api.deliverPausedDraft(user,f.jobId,input));assert.equal(f.calls.length,0)
 }
})
