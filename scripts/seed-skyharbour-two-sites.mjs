import {mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {openDatabase} from './database.mjs';
import {generateSite,VERSION} from '../examples/skyharbour-two-sites/generate.mjs';
import {PARAMETERS} from '../examples/skyharbour/generate.mjs';
await import('./build.mjs');
const {default:worker}=await import('../dist/server/index.js');
mkdirSync('.sites-runtime',{recursive:true});const {db,DB}=openDatabase('.sites-runtime/preview.sqlite');
async function call(path,body){const response=await worker.fetch(new Request('http://127.0.0.1:5173/api/capacity'+path,{method:body?'POST':'GET',headers:body?{'content-type':'application/json',origin:'http://127.0.0.1:5173'}:{},...body?{body:JSON.stringify(body)}:{}}),{DB,CAPACITY_LOCAL_DEV:'1'});const out=await response.json();if(!response.ok)throw Error(out.error);return out;}
function idFor(body){const b=Buffer.from(createHash('sha256').update(JSON.stringify(body)).digest().subarray(0,16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=b.toString('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;}
try{
 let company=(await call('/companies')).companies.find(c=>c.name_key==='sky harbour');if(!company)company=(await call('/companies',{name:'Sky Harbour',notes:'SYNTHETIC research examples; not measured customer data. 10 MW connection / 6 MW peak imposed.'})).company;
 for(const id of ['sgr','bna']){
  const g=generateSite(id),s=g.site,metadata={siteName:`${s.code} — SYNTHETIC researched working case`,address:s.address,city:s.city,state:s.state,description:`${VERSION}; ${s.hangars} hangars, ${s.sqft} rentable sf. Synthetic load and weather, imposed 10 MW connection / 6 MW peak. ${s.heatEvidence}`,utility:'Current account/service capacity unverified',fiber:'Not sure',internet:'Unverified',zoning:'Airport land; permissions unverified',generation:'No PV, host BESS or propulsion charging included.',evidence:'Synthetic · research-informed'};
  const detail=await call('/companies/'+company.id);let site=detail.sites.find(x=>x.name===metadata.siteName);if(!site)site=(await call(`/companies/${company.id}/sites`,{name:metadata.siteName,metadata})).site;
  const {dataset}=await call(`/companies/${company.id}/datasets`,{siteId:site.id,label:`SYNTHETIC / ${s.code} working case / ${VERSION}`,data:g.data});
  const body={siteId:site.id,datasetId:dataset.id,title:`${s.code} / researched working case / SYNTHETIC`,notes:`Raw illustration peak ${g.stats.rawPeakKW.toFixed(1)} kW scaled ${g.normalizationFactor.toFixed(3)}× to imposed 6000 kW. All data synthetic. See examples/skyharbour-two-sites/research.md for facts versus assumptions.`,parameters:PARAMETERS,metadata};
  const result=await call(`/companies/${company.id}/runs`,{...body,requestId:idFor(body)});console.log(`${result.duplicate?'Existing':'Saved'} ${s.code}: ${result.run.id}`);
 }
}finally{db.close();}
