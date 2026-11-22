import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdirSync} from 'node:fs';
import worker from '../dist/server/index.js';
mkdirSync('.sites-runtime',{recursive:true});const db=new DatabaseSync('.sites-runtime/preview.sqlite');
db.exec(readFileSync('drizzle/0000_site_intake.sql','utf8').replaceAll('--> statement-breakpoint',''));
const DB={prepare(sql){let values=[];const api={bind(...args){values=args;return api;},async first(){return db.prepare(sql).get(...values)||null;},async all(){return {results:db.prepare(sql).all(...values)};},async run(){return db.prepare(sql).run(...values);}};return api;}};
createServer(async(req,res)=>{try{const chunks=[];for await(const c of req)chunks.push(c);const request=new Request('http://127.0.0.1:5173'+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});const response=await worker.fetch(request,{DB,ADMIN_EMAIL:process.env.ADMIN_EMAIL});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch(e){console.error(e.message);res.writeHead(500);res.end('Preview error');}}).listen(5173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:5173'));
