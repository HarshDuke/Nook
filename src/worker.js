import {capacityAPI} from './capacity/api.mjs';
// Templates are embedded by scripts/build.mjs. No build-time or runtime packages.
const securityHeaders = {
 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'strict-origin-when-cross-origin',
 'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
 'Content-Security-Policy':"default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; object-src 'none'",
};
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function html(body,title='Nook | Power, put to work',script=false,status=200){return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="Nook is developing modular data centers at existing industrial sites with underused power. Explore your site's potential."><meta name="theme-color" content="#102d25"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="Modular data centers. Overlooked power. A new footprint for compute."><meta property="og:type" content="website"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/styles.css?v=orchard">${script?'<script src="/form.js" defer></script>':''}</head><body>${body}</body></html>`,{status,headers:{...securityHeaders,'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});}
function header(active='home'){return `<a class="skip-link" href="#main">Skip to content</a><header class="header"><a class="wordmark" href="/" aria-label="Nook home">nook<span class="brand-mark" aria-hidden="true">▪</span></a><nav aria-label="Main navigation"><a href="/" ${active==='home'?'aria-current="page"':''}>Overview</a><a href="/submit-site" ${active==='submit'?'aria-current="page"':''}>Submit a site</a></nav><span class="header-descriptor">Power, put to work.</span></header>`;}
const footer=()=>`<footer class="footer wrap"><a class="wordmark" href="/" aria-label="Nook home">nook<span class="brand-mark" aria-hidden="true">▪</span></a><p>A new footprint for compute.</p><div><a href="/submit-site">Submit a site</a><a href="/privacy">Privacy</a><span>© ${new Date().getFullYear()} Nook</span></div></footer>`;
const page=(content,active)=>content.replace('{{HEADER}}',header(active)).replace('{{FOOTER}}',footer());
const json=(data,status=200,extra={})=>Response.json(data,{status,headers:{...securityHeaders,'Cache-Control':'no-store',...extra}});
const choices={
 siteType:['Manufacturing / industrial','Warehouse / logistics','Commercial property','Industrial park / campus','Land / development site','Other'],
 siteControl:['Owner','Operator / tenant','Developer','Broker / advisor','Utility / power partner','Other'],
 availablePower:['Under 500 kW','500 kW–1 MW','1–3 MW','3–5 MW','5–10 MW','More than 10 MW','Not sure yet'],
 powerStatus:['Energized service with spare capacity','Existing service; capacity to be confirmed','Utility expansion being explored','On-site generation','New connection planned','Not sure yet'],
 timeline:['Available now','Within 6 months','6–12 months','More than 12 months','Exploring / not sure yet'],
};
export function validateSubmission(payload){
 if(!payload || typeof payload!=='object' || Array.isArray(payload))throw new Error('Please check your submission and try again.');
 const limits={contactName:150,email:254,company:200,siteName:150,location:200,country:100,phone:60,details:4000,siteType:100,siteControl:100,availablePower:100,powerStatus:100,timeline:100};
 const data={};for(const [name,limit] of Object.entries(limits)){
   const raw=payload[name]??'';if(typeof raw!=='string'||raw.length>limit)throw new Error('A field is too long or invalid. Please check your submission.');
   data[name]=raw.trim();
 }
 for(const name of ['contactName','email','location','country'])if(!data[name])throw new Error('Please complete all required fields.');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))throw new Error('Please enter a valid email address.');
 data.email=data.email.toLowerCase();
 for(const [name,allowed] of Object.entries(choices))if(!allowed.includes(data[name]))throw new Error('Please choose a valid option for each required field.');
 if(payload.consent!=='yes')throw new Error('Please agree to the privacy notice before submitting.');
 if(typeof payload.submissionId!=='string'||!/^\w{8}-\w{4}-4\w{3}-[89ab]\w{3}-\w{12}$/i.test(payload.submissionId))throw new Error('Please reload the form and try again.');
 data.id=payload.submissionId;data.consentVersion='2026-11-22';return data;
}
async function boundedJson(request){
 if(!request.headers.get('content-type')?.startsWith('application/json'))throw new Error('Please use the site submission form.');
 const reader=request.body?.getReader();if(!reader)throw new Error('The submission is empty.');
 let size=0;const chunks=[];try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>24000){await reader.cancel();throw new Error('Your submission is too large. Please shorten the notes.');}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return JSON.parse(new TextDecoder().decode(bytes));
}
async function submitSite(request,env){
 const url=new URL(request.url);if(request.headers.get('origin')!==url.origin)return json({error:'Please submit using the form on this website.'},403);
 let payload,data;try{payload=await boundedJson(request);if(payload.website)return json({error:'Please leave the website field empty.'},400);data=validateSubmission(payload);}catch(e){return json({error:e instanceof SyntaxError?'Please check your submission and try again.':e.message},400);}
 if(!env.DB)return json({error:'Submissions are temporarily unavailable. Please try again later.'},503);
 try{
   // Exact duplicate requests return the same reference without creating another record.
   const existing=await env.DB.prepare('SELECT email FROM site_submissions WHERE id = ?').bind(data.id).first();
   if(existing){if(existing.email!==data.email)return json({error:'Please reload the form and try again.'},409);return json({reference:data.id},200);}
   const now=Date.now(),hour=Math.floor(now/3600000);
   const ip=request.headers.get('cf-connecting-ip');
   if(ip){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${url.hostname}:${hour}:${ip}`));const key=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
    const counter=await env.DB.prepare('INSERT INTO intake_rate_limits (key, expires_at, count) VALUES (?, ?, 1) ON CONFLICT(key) DO UPDATE SET count = count + 1 RETURNING count').bind(key,now+7200000).first();
    if(counter.count>10)return json({error:'Too many submissions. Please try again in an hour.'},429,{'Retry-After':'3600'});
    await env.DB.prepare('DELETE FROM intake_rate_limits WHERE expires_at < ?').bind(now).run();
   }
   const recent=await env.DB.prepare('SELECT COUNT(*) AS count FROM site_submissions WHERE email = ? AND created_at > ?').bind(data.email,now-3600000).first();
   if(recent.count>=5)return json({error:'You have submitted several sites recently. Please try again in an hour.'},429,{'Retry-After':'3600'});
   const fields=['id','created_at','contact_name','email','company','site_name','location','country','site_type','site_control','available_power','power_status','timeline','details','phone','consent_version'];
   const values=[data.id,now,data.contactName,data.email,data.company,data.siteName,data.location,data.country,data.siteType,data.siteControl,data.availablePower,data.powerStatus,data.timeline,data.details,data.phone,data.consentVersion];
   await env.DB.prepare(`INSERT INTO site_submissions (${fields.join(',')}) VALUES (${fields.map(()=>'?').join(',')}) ON CONFLICT(id) DO NOTHING`).bind(...values).run();
   return json({reference:data.id},201);
 }catch{return json({error:'We could not save your site right now. Please try again; your reference will stay the same.'},503);}
}
async function admin(request,env){
 // Trust these headers only behind Sites dispatch, never on a standalone Worker.
 if(env.AUTH_MODE!=='sites')return html(header('')+'<main id="main" class="privacy-content wrap"><h1>Team access only</h1><p>Submissions are available to the Nook team through the hosting dashboard.</p><a class="button dark" href="/">Back to Nook</a></main>'+footer(),'Team access | Nook',false,403);
 const email=request.headers.get('oai-authenticated-user-email');
 if(!email)return Response.redirect(new URL('/signin-with-chatgpt?return_to=%2Fadmin',request.url),302);
 if(!env.ADMIN_EMAIL || email.toLowerCase()!==env.ADMIN_EMAIL.toLowerCase())return html(header('')+'<main id="main" class="privacy-content wrap"><h1>Team access only</h1><p>This page is restricted to the configured Nook administrator.</p><a class="button dark" href="/">Back to Nook</a></main>'+footer(),'Team access | Nook',false,403);
 try{const result=await env.DB.prepare('SELECT * FROM site_submissions ORDER BY created_at DESC LIMIT 200').all();
 const rows=result.results.map(r=>`<tr><td>${esc(new Date(r.created_at).toLocaleDateString('en-US',{timeZone:'America/New_York'}))}<br><small>${esc(r.id)}</small></td><td>${esc(r.contact_name)}<br>${esc(r.company)}<br><a href="mailto:${esc(r.email)}">${esc(r.email)}</a><br>${esc(r.phone)}</td><td>${esc(r.site_name)}<br>${esc(r.location)}, ${esc(r.country)}<br>${esc(r.site_type)}</td><td>${esc(r.available_power)}<br>${esc(r.power_status)}<br>${esc(r.timeline)}</td><td><details><summary>View details</summary><pre>${esc(r.details||'No additional notes.')}<br>Relationship: ${esc(r.site_control)}<br>Consent: ${esc(r.consent_version)}</pre></details></td></tr>`).join('');
 return html(header('')+`<main id="main" class="wrap" style="padding-top:50px;padding-bottom:70px;max-width:1600px"><p class="eyebrow">Nook team</p><h1 style="font-size:2.5rem;margin:20px 0">Site submissions</h1><p style="margin-bottom:25px">Showing the most recent ${result.results.length} submissions. This page is private.</p><table class="admin-table"><thead><tr><th>Received</th><th>Contact</th><th>Site</th><th>Power & timing</th><th>Notes</th></tr></thead><tbody>${rows||'<tr><td colspan="5">No submissions yet.</td></tr>'}</tbody></table></main>`+footer(),'Site submissions | Nook');
 }catch{return html(header('')+'<main id="main" class="privacy-content wrap"><h1>Temporarily unavailable</h1><p>Please try again in a moment.</p></main>'+footer(),'Site submissions | Nook',false,503);}
}
export default {async fetch(request,env={}){
 const url=new URL(request.url);const path=url.pathname.replace(/\/$/,'')||'/';
 const portalOrigin=env.PORTAL_ORIGIN||url.origin;
 if(['/login','/portal'].includes(path)&&url.origin!==portalOrigin)return Response.redirect(portalOrigin+path+url.search,302);
 if(path.startsWith('/api/portal/')){
   if(url.origin!==portalOrigin)return json({error:'Use the portal domain.'},403);
   const upstream=env.CONVEX_SITE_URL;
   if(!upstream)return json({error:'Portal setup is pending.'},503);
   const headers=new Headers();
   for(const key of ['Cookie','Content-Type','Origin'])if(request.headers.has(key))headers.set(key,request.headers.get(key));
   return fetch(new URL(url.pathname+url.search,upstream),{method:request.method,headers,body:['GET','HEAD'].includes(request.method)?undefined:request.body,redirect:'manual'});
 }
 if(path.startsWith('/api/capacity/'))return capacityAPI(request,env);
 if(path==='/api/submissions'){if(request.method!=='POST')return json({error:'Method not allowed'},405,{Allow:'POST'});return submitSite(request,env);}
 if(!['GET','HEAD'].includes(request.method))return json({error:'Method not allowed'},405,{Allow:'GET, HEAD'});
 let response;
 if(path==='/portal'||path==='/login')response=html(ASSETS.portal,'Nook | Customer portal');
 else if(path==='/portal.js')response=new Response(ASSETS.portalJS,{headers:{...securityHeaders,'Content-Type':'application/javascript'}});
 else if(path==='/portal-photo.jpg')response=new Response(Uint8Array.from(atob(ASSETS.portalPhoto),c=>c.charCodeAt(0)),{headers:{...securityHeaders,'Content-Type':'image/jpeg','Cache-Control':'public, max-age=3600'}});
 else if(path==='/capacity')response=new Response(ASSETS.lab,{headers:{...securityHeaders,'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
 else if(path==='/capacity.js')response=new Response(ASSETS.labJS,{headers:{...securityHeaders,'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store'}});
 else if(path==='/capacity.css')response=new Response(ASSETS.labCSS,{headers:{...securityHeaders,'Content-Type':'text/css; charset=utf-8','Cache-Control':'no-store'}});
 else if(path==='/styles.css')response=new Response(ASSETS.css,{headers:{...securityHeaders,'Content-Type':'text/css; charset=utf-8','Cache-Control':'public, max-age=300'}});
 else if(path==='/form.js')response=new Response(ASSETS.js,{headers:{...securityHeaders,'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'public, max-age=300'}});
 else if(path==='/favicon.svg')response=new Response('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#102d25"/><path d="M17 47V20h9v4c7-9 22-7 22 6v17h-9V31c0-8-13-7-13 1v15Z" fill="#d5f49b"/></svg>',{headers:{...securityHeaders,'Content-Type':'image/svg+xml'}});
 else if(path==='/')response=html(page(ASSETS.home,'home'));
 else if(path==='/submit-site')response=html(page(ASSETS.form,'submit'),'Submit a site | Nook',true);
 else if(path==='/privacy')response=html(page(ASSETS.privacy,''),'Privacy | Nook');
 else if(path==='/admin')response=await admin(request,env);
 else if(path==='/robots.txt')response=new Response('User-agent: *\nDisallow: /admin\nDisallow: /capacity\nDisallow: /api/\n',{headers:{'Content-Type':'text/plain'}});
 else response=html(header('')+'<main class="privacy-content wrap" id="main"><h1>A little off the grid.</h1><p>We could not find that page.</p><a class="button dark" href="/">Back to Nook</a></main>'+footer(),'Page not found | Nook',false,404);
 if(request.method==='HEAD')return new Response(null,{status:response.status,headers:response.headers});return response;
}};

