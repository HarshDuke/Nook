import {readFile,mkdir,writeFile,cp} from 'node:fs/promises';
const assets={};for(const [key,file] of Object.entries({css:'styles.css',js:'form.js',home:'landing.html',form:'form.html',privacy:'privacy.html'}))assets[key]=await readFile(new URL('../src/'+file,import.meta.url),'utf8');
await mkdir(new URL('../dist/server/',import.meta.url),{recursive:true});await mkdir(new URL('../dist/.openai/',import.meta.url),{recursive:true});
const worker=await readFile(new URL('../src/worker.js',import.meta.url),'utf8');
await writeFile(new URL('../dist/server/index.js',import.meta.url),'const ASSETS='+JSON.stringify(assets)+';\n'+worker);
await cp(new URL('../.openai/hosting.json',import.meta.url),new URL('../dist/.openai/hosting.json',import.meta.url));
await cp(new URL('../drizzle',import.meta.url),new URL('../dist/.openai/drizzle',import.meta.url),{recursive:true});
await import(new URL('../dist/server/index.js?build='+Date.now(),import.meta.url));console.log('Built and verified dependency-free Worker.');
