import {mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {openDatabase} from './database.mjs';
import {generateSkyHarbour,PROFILE_IDS,PARAMETERS,SITE_METADATA} from '../examples/skyharbour/generate.mjs';
await import('./build.mjs');
const {default:worker}=await import('../dist/server/index.js');
mkdirSync('.sites-runtime',{recursive:true});const {db,DB}=openDatabase('.sites-runtime/preview.sqlite');
async function call(path,body){const response=await worker.fetch(new Request('http://127.0.0.1:5173/api/capacity'+path,{method:body?'POST':'GET',headers:body?{'content-type':'application/json',origin:'http://127.0.0.1:5173'}:{},...body?{body:JSON.stringify(body)}:{}}),{DB,CAPACITY_LOCAL_DEV:'1'});const out=await response.json();if(!response.ok)throw Error(out.error);return out;}
function idFor(body){const b=Buffer.from(createHash('sha256').update(JSON.stringify(body)).digest().subarray(0,16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=b.toString('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;}
try{
 let company=(await call('/companies')).companies.find(c=>c.name_key==='sky harbour');if(!company)company=(await call('/companies',{name:'Sky Harbour',notes:'SYNTHETIC research example, not measured customer data. Connection 10 MW and peak 6 MW are user assumptions.'})).company;
 let detail=await call('/companies/'+company.id),site=detail.sites.find(s=>s.name===SITE_METADATA.siteName);if(!site)site=(await call(`/companies/${company.id}/sites`,{name:SITE_METADATA.siteName,metadata:SITE_METADATA})).site;
 for(const profile of PROFILE_IDS){const g=generateSkyHarbour(profile),{dataset}=await call(`/companies/${company.id}/datasets`,{siteId:site.id,label:'SYNTHETIC 2025 / '+g.name,data:g.data});const body={siteId:site.id,datasetId:dataset.id,title:'SYNTHETIC / '+g.name,notes:'Research-informed shape only. All profiles are normalized to exactly 6 MW peak; 10 MW connection, heating fuel, equipment coincidence, tariff, rent and costs are unverified. See examples/skyharbour/research.md.',parameters:PARAMETERS,metadata:SITE_METADATA};const out=await call(`/companies/${company.id}/runs`,{...body,requestId:idFor(body)});console.log(`${out.duplicate?'Existing':'Saved'} ${g.name}: ${out.run.id}`);}
 console.log('Sky Harbour example is ready at http://127.0.0.1:5173/capacity after npm run dev.');
}finally{db.close();}
