import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import worker from '../dist/server/index.js';
import {openDatabase} from '../scripts/database.mjs';
import {synthetic,analyze} from '../src/capacity/model.mjs';

const token='test-only-capacity-workspace-secret';
const html=readFileSync(new URL('../src/capacity/index.html',import.meta.url),'utf8');
const keys=['lowPct','lowHours','targetDays','capacity','future','growth','margin','pue','normalPct','highPct','normalHours','highHours','efficiency','depth','retention','energyRate','demandRate','rent','occupancy','dcCapex','battEnergy','battPower','battFixed','battOM','opex','lease','enabling','years','discount','refreshYear','refreshPct','alternative','delay'];
const parameters=Object.fromEntries(keys.map(k=>[k,Number(html.match(new RegExp(`id="${k}"[^>]*value="([^"]+)"`))[1])]));
const metadata={siteName:'Test site',address:'Example address',description:'Synthetic test',evidence:'Owner estimate · unverified'};
function call(DB,path,body,extra={}){return worker.fetch(new Request('https://nook.example/api/capacity'+path,{method:body?'POST':'GET',headers:{authorization:'Bearer '+token,...body?{'content-type':'application/json',origin:'https://nook.example'}:{},...extra.headers},...body?{body:JSON.stringify(body)}:{}}),{DB,CAPACITY_LAB_TOKEN:token,...extra.env});}
async function ok(response,status=200){const r=await response,body=await r.json();assert.equal(r.status,status,JSON.stringify(body));return body;}
async function seed(DB,name='Test company'){
 const {company}=await ok(call(DB,'/companies',{name}),201);
 const {site}=await ok(call(DB,`/companies/${company.id}/sites`,{name:'Test site',metadata}),201);
 const d=synthetic();d.load=d.load.slice(0,168);d.dates=d.dates.slice(0,168);
 const {dataset}=await ok(call(DB,`/companies/${company.id}/datasets`,{siteId:site.id,label:'Synthetic week',data:d}),201);
 return {company,site,dataset,data:d};
}
test('private APIs reject missing, spoofed, short and cross-origin credentials',async()=>{
 const {db,DB}=openDatabase();try{
  assert.equal((await worker.fetch(new Request('https://nook.example/api/capacity/companies'),{DB})).status,401);
  assert.equal((await worker.fetch(new Request('https://nook.example/api/capacity/companies',{headers:{'oai-authenticated-user-email':'admin@example.com'}}),{DB,ADMIN_EMAIL:'admin@example.com'})).status,401);
  assert.equal((await call(DB,'/companies',undefined,{headers:{authorization:'Bearer wrong'}})).status,401);
  assert.equal((await call(DB,'/companies',{name:'Blocked'},{headers:{origin:'https://evil.example'}})).status,403);
  assert.equal((await worker.fetch(new Request('https://nook.example/api/capacity/companies'),{DB,CAPACITY_LOCAL_DEV:'1'})).status,401);
  assert.equal((await worker.fetch(new Request('http://127.0.0.1:5173/api/capacity/companies'),{DB,CAPACITY_LOCAL_DEV:'1'})).status,200);
 }finally{db.close();}
});
test('company, site, dataset, immutable runs and retries work end to end',async()=>{
 const {db,DB}=openDatabase();try{
  const a=await seed(DB),{company,site,dataset,data}=a;
  const duplicate=await ok(call(DB,`/companies/${company.id}/datasets`,{siteId:site.id,label:'Same data again',data}));assert.equal(duplicate.dataset.id,dataset.id);assert(duplicate.duplicate);
  const loaded=await ok(call(DB,'/datasets/'+dataset.id));assert.deepEqual(loaded.data.load,data.load);assert.deepEqual(loaded.data.dates,data.dates);
  const body={requestId:crypto.randomUUID(),siteId:site.id,datasetId:dataset.id,title:'Initial screening',notes:'First pass',metadata,parameters};
  const first=await ok(call(DB,`/companies/${company.id}/runs`,body),201);assert.equal(first.run.report.scenarios.length,4);assert.equal(first.run.model_version,'1.2.0');assert.equal(first.run.report.annual,false);assert.equal(first.run.report.scenarios[0].residual,null);assert.equal(first.run.report.scenarios[0].dispatch.rows,undefined);
  const retry=await ok(call(DB,`/companies/${company.id}/runs`,body));assert.equal(retry.run.id,first.run.id);assert(retry.duplicate);
  assert.equal((await call(DB,`/companies/${company.id}/runs`,{...body,title:'Changed request'})).status,409);
  const next=await ok(call(DB,`/companies/${company.id}/runs`,{...body,requestId:crypto.randomUUID(),title:'More host load',parameters:{...parameters,future:200}}),201);
  assert(next.run.report.scenarios[0].it<first.run.report.scenarios[0].it);
  const old=await ok(call(DB,'/runs/'+first.run.id));assert.equal(old.run.inputs.parameters.future,0);assert.equal(old.run.report.scenarios[0].it,first.run.report.scenarios[0].it);
  const history=await ok(call(DB,'/runs?companyId='+company.id));assert.equal(history.runs.length,2);assert.equal(history.runs[0].company_name,company.name);
  const companies=await ok(call(DB,'/companies'));assert.equal(companies.companies[0].run_count,2);assert.equal(companies.companies[0].site_count,1);
  assert.equal(db.prepare('SELECT count(*) n FROM capacity_dataset_chunks').get().n,1);
 }finally{db.close();}
});
test('cross-company and cross-site datasets cannot be attached to a run',async()=>{
 const {db,DB}=openDatabase();try{const a=await seed(DB,'Company A'),b=await seed(DB,'Company B');const base={requestId:crypto.randomUUID(),siteId:b.site.id,datasetId:a.dataset.id,title:'Invalid association',metadata,parameters};assert.equal((await call(DB,`/companies/${b.company.id}/runs`,base)).status,404);assert.equal((await call(DB,`/companies/${a.company.id}/runs`,{...base,siteId:b.site.id})).status,404);assert.equal(db.prepare('select count(*) n from capacity_runs').get().n,0);}finally{db.close();}
});
test('invalid data is rejected without partial dataset rows',async()=>{
 const {db,DB}=openDatabase();try{const a=await seed(DB);const count=db.prepare('select count(*) n from capacity_datasets').get().n;const bad={...a.data,load:[...a.data.load]};bad.load[5]=-1;assert.equal((await call(DB,`/companies/${a.company.id}/datasets`,{siteId:a.site.id,label:'Bad',data:bad})).status,400);assert.equal(db.prepare('select count(*) n from capacity_datasets').get().n,count);assert.equal((await call(DB,'/companies',{name:'   '})).status,400);assert.equal((await call(DB,'/companies',{name:'TEST COMPANY'})).status,409);}finally{db.close();}
});
test('annual saved outputs match the model and support all four IT-relative cases',async()=>{
 const {db,DB}=openDatabase();try{const a=await seed(DB);const data=synthetic();const {dataset}=await ok(call(DB,`/companies/${a.company.id}/datasets`,{siteId:a.site.id,label:'Full synthetic year',data}),201);const {run}=await ok(call(DB,`/companies/${a.company.id}/runs`,{requestId:crypto.randomUUID(),siteId:a.site.id,datasetId:dataset.id,title:'Annual screen',metadata,parameters}),201);assert(run.report.annual);const direct=analyze(data,parameters);for(let i=0;i<4;i++){const s=run.report.scenarios[i];assert.equal(s.it,direct.scenarios[i].it);assert.equal(s.residual,direct.scenarios[i].residual);assert(s.dispatch.badDays<=3);if(i)assert.equal(s.energy,4*s.power);}assert(db.prepare('select count(*) n from capacity_dataset_chunks where dataset_id=?').get(dataset.id).n>1);}finally{db.close();}
});
test('records survive closing and reopening the local database',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'nook-db-')),path=join(dir,'workspace.sqlite');try{let a=openDatabase(path);const saved=await seed(a.DB,'Persistent customer');a.db.close();a=openDatabase(path);const out=await ok(call(a.DB,'/companies/'+saved.company.id));assert.equal(out.company.name,'Persistent customer');assert.equal(out.datasets.length,1);const d=await ok(call(a.DB,'/datasets/'+saved.dataset.id));assert.deepEqual(d.data.load,saved.data.load);a.db.close();}finally{rmSync(dir,{recursive:true,force:true});}
});
test('workspace page and compiled JavaScript have no missing placeholders or inline scripts',async()=>{const response=await worker.fetch(new Request('https://nook.example/capacity'));assert.equal(response.status,200);const body=await response.text();assert.match(body,/companyPicker/);assert.match(body,/historyRows/);assert.doesNotMatch(body,/INLINE_SCRIPT|INLINE_STYLE|<script>/);assert.match(response.headers.get('Content-Security-Policy'),/script-src 'self'/);const js=await(await worker.fetch(new Request('https://nook.example/capacity.js'))).text();assert.doesNotThrow(()=>new Function(js));assert.match(js,/saveWorkflow/);assert.match(js,/startWorkspace/);});
