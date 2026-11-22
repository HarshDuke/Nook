import {readFile,writeFile} from 'node:fs/promises';
import worker from '../dist/server/index.js';
const css=(await readFile(new URL('../src/styles.css',import.meta.url),'utf8')).replace(/^@import[^\n]*\n/,'');
const pages=[];
for(const [name,path] of [['overview','/'],['submit-site','/submit-site'],['privacy','/privacy']]){
 const response=await worker.fetch(new Request('https://nook.example'+path));let body=(await response.text()).split('<body>')[1].split('</body>')[0];
 body=body.replaceAll('href="/submit-site"','href="#submit-site"').replaceAll('href="/privacy"','href="#privacy"').replaceAll('href="/"','href="#overview"').replaceAll('target="_blank"','').replaceAll('id="main"',`id="${name}-main"`).replaceAll('href="#main"',`href="#${name}-main"`);
 pages.push(`<div data-review-page="${name}" ${name==='overview'?'':'hidden'}>${body}</div>`);
}
const js=await readFile(new URL('../src/form.js',import.meta.url),'utf8');
const review=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nook — V1 design preview</title><style>${css}\n[data-review-page][hidden]{display:none!important}.review-banner{padding:9px 24px;background:#e4efda;color:#233d28;text-align:center;font-size:14px}</style></head><body><div class="review-banner">V1 design preview · Submissions will save after deployment. Nothing entered here is sent.</div>${pages.join('')}<script>window.fetch=async()=>({ok:false,json:async()=>({error:'This is a design preview. Your information has not been sent. The live form will save submissions after deployment.'})});\n${js}\nfunction reviewRoute(){const hash=location.hash.slice(1);if(['overview','submit-site','privacy',''].includes(hash)){for(const el of document.querySelectorAll('[data-review-page]'))el.hidden=el.dataset.reviewPage!==(hash||'overview');scrollTo(0,0);}}addEventListener('hashchange',reviewRoute);reviewRoute();</script></body></html>`;
await writeFile(new URL('../../Nook-V1-Preview.html',import.meta.url),review);
console.log('Created standalone design preview.');
