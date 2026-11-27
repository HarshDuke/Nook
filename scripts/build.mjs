import {readFile,mkdir,writeFile,cp} from 'node:fs/promises';
const assets={};for(const [key,file] of Object.entries({css:'styles.css',js:'form.js',home:'landing.html',form:'form.html',privacy:'privacy.html'}))assets[key]=await readFile(new URL('../src/'+file,import.meta.url),'utf8');
assets.portal=await readFile(new URL('../src/portal/page.html',import.meta.url),'utf8');
assets.portalJS=await readFile(new URL('../src/portal/app.js',import.meta.url),'utf8');
assets.portalPhoto=(await readFile(new URL('../src/portal/hero.jpg',import.meta.url))).toString('base64');
const model=(await readFile(new URL('../src/capacity/model.mjs',import.meta.url),'utf8')).replace(/^export /gm,'');
const capacityAPI=(await readFile(new URL('../src/capacity/api.mjs',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replace(/^export /gm,'');
assets.lab=await readFile(new URL('../src/capacity/index.html',import.meta.url),'utf8');
assets.labCSS=await readFile(new URL('../src/capacity/style.css',import.meta.url),'utf8');
assets.labJS=model+'\n'+await readFile(new URL('../src/capacity/app.js',import.meta.url),'utf8')+'\n'+await readFile(new URL('../src/capacity/workspace.js',import.meta.url),'utf8');
await mkdir(new URL('../dist/server/',import.meta.url),{recursive:true});await mkdir(new URL('../dist/.openai/',import.meta.url),{recursive:true});
const worker=(await readFile(new URL('../src/worker.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'');
await writeFile(new URL('../dist/server/index.js',import.meta.url),'const ASSETS='+JSON.stringify(assets)+';\n'+model+'\n'+capacityAPI+'\n'+worker);
await cp(new URL('../.openai/hosting.json',import.meta.url),new URL('../dist/.openai/hosting.json',import.meta.url));
await cp(new URL('../drizzle',import.meta.url),new URL('../dist/.openai/drizzle',import.meta.url),{recursive:true});
await import(new URL('../dist/server/index.js?build='+Date.now(),import.meta.url));console.log('Built and verified dependency-free Worker.');

