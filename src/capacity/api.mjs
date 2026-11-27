import {analyze,validate} from './model.mjs';

export const CAPACITY_MODEL_VERSION='1.2.0';
const capHeaders={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const capJSON=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:capHeaders});
const capError=(message,status=400)=>Object.assign(new Error(message),{status});
const capId=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v);
const capText=(v,label,max=200,required=false)=>{if(v===undefined||v===null)v='';if(typeof v!=='string'||v.length>max)throw capError(`${label} must be text with at most ${max} characters.`);v=v.trim();if(required&&!v)throw capError(`${label} is required.`);return v;};
async function capHash(value){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),n=>n.toString(16).padStart(2,'0')).join('');}
export async function capacityAuthorized(request,env){
 const host=new URL(request.url).hostname;
 if(env.CAPACITY_LOCAL_DEV==='1'&&['127.0.0.1','localhost','[::1]'].includes(host))return true;
 if(env.AUTH_MODE==='sites'&&env.ADMIN_EMAIL&&request.headers.get('oai-authenticated-user-email')?.toLowerCase()===env.ADMIN_EMAIL.toLowerCase())return true;
 const expected=env.CAPACITY_LAB_TOKEN,provided=request.headers.get('authorization')?.replace(/^Bearer /,'');
 if(typeof expected!=='string'||expected.length<24||!provided)return false;
 const a=await capHash(expected),b=await capHash(provided);let mismatch=0;for(let i=0;i<a.length;i++)mismatch|=a.charCodeAt(i)^b.charCodeAt(i);return mismatch===0;
}
async function capBody(request,max=8000000){
 if(!request.headers.get('content-type')?.startsWith('application/json'))throw capError('Send application/json.');
 const reader=request.body?.getReader();if(!reader)throw capError('Request body is empty.');let size=0;const chunks=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw capError('Request is too large.',413);}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 let body;try{body=JSON.parse(new TextDecoder().decode(bytes));}catch{throw capError('Invalid JSON.');}if(!body||typeof body!=='object'||Array.isArray(body))throw capError('Expected a JSON object.');return body;
}
export function validateCapacityData(data){
 if(!data||typeof data!=='object'||!Array.isArray(data.load)||!Array.isArray(data.dates)||data.load.length!==data.dates.length||data.load.length>110000)throw capError('A complete interval dataset is required.');
 if(![1,.5,.25,1/12].includes(data.dt)||data.load.length*data.dt<24||data.load.length*data.dt>8784)throw capError('Use 24 hours to one year of 5/15/30/60-minute data.');
 const start=Date.parse(data.dates[0]);if(!Number.isFinite(start))throw capError('Invalid start timestamp.');
 for(let i=0;i<data.load.length;i++){if(!Number.isFinite(data.load[i])||data.load[i]<0||data.load[i]>1e9)throw capError('Load readings must be finite, nonnegative kW values.');const ts=Date.parse(data.dates[i]);if(!Number.isFinite(ts)||Math.abs(ts-start-i*data.dt*3600000)>1000)throw capError('Missing, duplicated or irregular timestamps.');}
 const end=start+data.load.length*data.dt*3600000;if(start%86400000!==0||end%86400000!==0)throw capError('Supply complete UTC days, beginning at 00:00.');
 return {load:data.load,dates:data.dates.map(d=>new Date(d).toISOString()),dt:data.dt,source:capText(data.source,'Source',250)||'Imported load data',synthetic:data.synthetic===true,assumedDates:data.assumedDates===true};
}
function capMetadata(value){if(!value||typeof value!=='object'||Array.isArray(value))throw capError('Site information is required.');const out={};for(const k of ['siteName','address','city','state','description','contact','email','relationship','utility','fiber','internet','zoning','generation','evidence'])out[k]=capText(value[k],k,k==='description'||k==='generation'?4000:500);return out;}
async function capCompany(DB,id){if(!capId(id))throw capError('Invalid company reference.');const c=await DB.prepare('SELECT * FROM capacity_companies WHERE id = ?').bind(id).first();if(!c)throw capError('Company not found.',404);return c;}
async function capSite(DB,id,companyId){if(!capId(id))throw capError('Invalid site reference.');const s=await DB.prepare('SELECT * FROM capacity_sites WHERE id = ? AND company_id = ?').bind(id,companyId).first();if(!s)throw capError('Site does not belong to this company.',404);return s;}
async function capDataset(DB,id,companyId,siteId){if(!capId(id))throw capError('Invalid dataset reference.');const d=await DB.prepare('SELECT * FROM capacity_datasets WHERE id = ? AND company_id = ? AND site_id = ?').bind(id,companyId,siteId).first();if(!d)throw capError('Dataset does not belong to this company and site.',404);return d;}
async function capLoad(DB,d){const chunks=await DB.prepare('SELECT values_json FROM capacity_dataset_chunks WHERE dataset_id = ? ORDER BY chunk_index').bind(d.id).all();const load=chunks.results.flatMap(c=>JSON.parse(c.values_json));if(load.length!==d.row_count)throw capError('Stored dataset is incomplete.',503);const start=Date.parse(d.start_utc);return {load,dates:load.map((_,i)=>new Date(start+i*d.interval_hours*3600000).toISOString()),dt:d.interval_hours,source:d.source,synthetic:!!d.synthetic,assumedDates:!!d.assumed_dates};}
function capRun(row){return {...row,inputs:JSON.parse(row.inputs_json),report:JSON.parse(row.report_json),inputs_json:undefined,report_json:undefined};}
export function compactCapacityReport(result){
 const {adjusted,available,...report}=result;
 return {...report,scenarios:result.scenarios.map(({dispatch,...s})=>({...s,dispatch:{...dispatch,rows:undefined}}))};
}
export async function capacityAPI(request,env){
 if(!await capacityAuthorized(request,env))return capJSON({error:'Team access required. Enter the configured workspace access key.'},401);
 if(!env.DB)return capJSON({error:'Workspace storage is not configured.'},503);
 const url=new URL(request.url),path=url.pathname.replace(/\/$/,''),DB=env.DB;
 if(!['GET','POST'].includes(request.method))return capJSON({error:'Method not allowed.'},405);
 if(request.method==='POST'&&request.headers.get('origin')!==url.origin)return capJSON({error:'Use this application to save records.'},403);
 try{
  if(path==='/api/capacity/companies'){
   if(request.method==='GET'){const rows=await DB.prepare('SELECT c.*, (SELECT COUNT(*) FROM capacity_sites s WHERE s.company_id=c.id) AS site_count, (SELECT COUNT(*) FROM capacity_runs r WHERE r.company_id=c.id) AS run_count FROM capacity_companies c ORDER BY c.name_key').all();return capJSON({companies:rows.results});}
   const b=await capBody(request,12000),name=capText(b.name,'Company name',200,true),notes=capText(b.notes,'Notes',4000),key=name.toLowerCase().replace(/\s+/g,' ');
   if(await DB.prepare('SELECT id FROM capacity_companies WHERE name_key = ?').bind(key).first())throw capError('That company already exists. Select it from the company list.',409);
   const company={id:crypto.randomUUID(),name,name_key:key,notes,created_at:Date.now()};await DB.prepare('INSERT INTO capacity_companies (id,name,name_key,notes,created_at) VALUES (?,?,?,?,?)').bind(company.id,name,key,notes,company.created_at).run();return capJSON({company},201);
  }
  let match=path.match(/^\/api\/capacity\/companies\/([^/]+)$/);
  if(match&&request.method==='GET'){
   const company=await capCompany(DB,match[1]),sites=await DB.prepare('SELECT * FROM capacity_sites WHERE company_id = ? ORDER BY created_at DESC').bind(company.id).all(),datasets=await DB.prepare('SELECT * FROM capacity_datasets WHERE company_id = ? ORDER BY created_at DESC').bind(company.id).all();
   return capJSON({company,sites:sites.results.map(s=>({...s,metadata:JSON.parse(s.metadata_json),metadata_json:undefined})),datasets:datasets.results});
  }
  match=path.match(/^\/api\/capacity\/companies\/([^/]+)\/sites$/);
  if(match&&request.method==='POST'){
   const company=await capCompany(DB,match[1]),b=await capBody(request,20000),name=capText(b.name,'Site name',200,true),metadata=capMetadata(b.metadata),site={id:crypto.randomUUID(),company_id:company.id,name,metadata,created_at:Date.now()};
   await DB.prepare('INSERT INTO capacity_sites (id,company_id,name,metadata_json,created_at) VALUES (?,?,?,?,?)').bind(site.id,company.id,name,JSON.stringify(metadata),site.created_at).run();return capJSON({site},201);
  }
  match=path.match(/^\/api\/capacity\/companies\/([^/]+)\/datasets$/);
  if(match&&request.method==='POST'){
   const company=await capCompany(DB,match[1]),b=await capBody(request),site=await capSite(DB,b.siteId,company.id),data=validateCapacityData(b.data),label=capText(b.label,'Dataset label',200,true);
   const fingerprint=await capHash(JSON.stringify({start:data.dates[0],dt:data.dt,load:data.load,synthetic:data.synthetic,assumedDates:data.assumedDates}));
   const existing=await DB.prepare('SELECT * FROM capacity_datasets WHERE company_id=? AND site_id=? AND fingerprint=?').bind(company.id,site.id,fingerprint).first();if(existing)return capJSON({dataset:existing,duplicate:true});
   const dataset={id:crypto.randomUUID(),company_id:company.id,site_id:site.id,label,source:data.source,fingerprint,start_utc:data.dates[0],interval_hours:data.dt,row_count:data.load.length,synthetic:Number(data.synthetic),assumed_dates:Number(data.assumedDates),created_at:Date.now()};
   const steps=[DB.prepare('INSERT INTO capacity_datasets (id,company_id,site_id,label,source,fingerprint,start_utc,interval_hours,row_count,synthetic,assumed_dates,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').bind(...['id','company_id','site_id','label','source','fingerprint','start_utc','interval_hours','row_count','synthetic','assumed_dates','created_at'].map(k=>dataset[k]))];
   for(let i=0;i<data.load.length;i+=4096)steps.push(DB.prepare('INSERT INTO capacity_dataset_chunks (dataset_id,chunk_index,values_json) VALUES (?,?,?)').bind(dataset.id,i/4096,JSON.stringify(data.load.slice(i,i+4096))));
   await DB.batch(steps);return capJSON({dataset},201);
  }
  match=path.match(/^\/api\/capacity\/datasets\/([^/]+)$/);
  if(match&&request.method==='GET'){
   if(!capId(match[1]))throw capError('Invalid dataset reference.');const d=await DB.prepare('SELECT * FROM capacity_datasets WHERE id=?').bind(match[1]).first();if(!d)throw capError('Dataset not found.',404);return capJSON({dataset:d,data:await capLoad(DB,d)});
  }
  if(path==='/api/capacity/runs'&&request.method==='GET'){
   const companyId=url.searchParams.get('companyId'),limit=50,offset=Number(url.searchParams.get('offset')||0);if(!Number.isInteger(offset)||offset<0||offset>100000)throw capError('Invalid page.');
   if(companyId)await capCompany(DB,companyId);const where=companyId?' WHERE r.company_id = ?':'';
   const sql='SELECT r.id,r.company_id,r.site_id,r.dataset_id,r.title,r.notes,r.model_version,r.created_at,c.name AS company_name,s.name AS site_name,r.report_json FROM capacity_runs r JOIN capacity_companies c ON c.id=r.company_id JOIN capacity_sites s ON s.id=r.site_id'+where+' ORDER BY r.created_at DESC,r.id LIMIT ? OFFSET ?';
   const rows=await DB.prepare(sql).bind(...(companyId?[companyId]:[]),limit+1,offset).all();return capJSON({runs:rows.results.slice(0,limit).map(row=>({...row,report:JSON.parse(row.report_json),report_json:undefined})),nextOffset:rows.results.length>limit?offset+limit:null});
  }
  match=path.match(/^\/api\/capacity\/companies\/([^/]+)\/runs$/);
  if(match&&request.method==='POST'){
   const company=await capCompany(DB,match[1]),b=await capBody(request,40000);if(!capId(b.requestId))throw capError('A valid run request ID is required.');
   const site=await capSite(DB,b.siteId,company.id),dataset=await capDataset(DB,b.datasetId,company.id,site.id),metadata=capMetadata(b.metadata),parameters=b.parameters;validate(parameters);
   for(const k of ['years','refreshYear','delay'])if(!Number.isInteger(parameters[k]))throw capError(`${k} must be a whole number.`);
   const title=capText(b.title,'Run title',200,true),notes=capText(b.notes,'Run notes',4000),inputs={parameters,metadata,companyName:company.name,siteName:site.name,datasetLabel:dataset.label,datasetFingerprint:dataset.fingerprint};
   const inputHash=await capHash(JSON.stringify({companyId:company.id,siteId:site.id,datasetId:dataset.id,title,notes,inputs}));
   const old=await DB.prepare('SELECT * FROM capacity_runs WHERE id=?').bind(b.requestId).first();if(old){if(old.input_hash!==inputHash||old.company_id!==company.id)throw capError('This request reference was already used for different inputs.',409);return capJSON({run:capRun(old),duplicate:true});}
   const data=await capLoad(DB,dataset),result=analyze(data,parameters,{includeTraces:false}),report=compactCapacityReport(result);
   const row={id:b.requestId,company_id:company.id,site_id:site.id,dataset_id:dataset.id,title,notes,model_version:CAPACITY_MODEL_VERSION,input_hash:inputHash,inputs_json:JSON.stringify(inputs),report_json:JSON.stringify(report),created_at:Date.now()};
   await DB.prepare('INSERT INTO capacity_runs (id,company_id,site_id,dataset_id,title,notes,model_version,input_hash,inputs_json,report_json,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(...['id','company_id','site_id','dataset_id','title','notes','model_version','input_hash','inputs_json','report_json','created_at'].map(k=>row[k])).run();return capJSON({run:capRun(row)},201);
  }
  match=path.match(/^\/api\/capacity\/runs\/([^/]+)$/);
  if(match&&request.method==='GET'){if(!capId(match[1]))throw capError('Invalid run reference.');const row=await DB.prepare('SELECT * FROM capacity_runs WHERE id=?').bind(match[1]).first();if(!row)throw capError('Run not found.',404);return capJSON({run:capRun(row)});}
  return capJSON({error:'Workspace endpoint not found.'},404);
 }catch(e){if(e.status)return capJSON({error:e.message},e.status);if(e.message?.includes('SQLITE')||e.message?.includes('D1_')||e.message?.includes('no such table'))return capJSON({error:'Storage operation failed. Check database availability and apply the capacity workspace migration.'},503);return capJSON({error:e.message||'Could not complete the request.'},400);}
}
