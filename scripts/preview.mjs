import {createServer} from 'node:http';
import {mkdirSync} from 'node:fs';
import {openDatabase} from './database.mjs';
import worker from '../dist/server/index.js';
mkdirSync('.sites-runtime',{recursive:true});const {DB}=openDatabase('.sites-runtime/preview.sqlite');
createServer(async(req,res)=>{try{const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>8000000){res.writeHead(413);res.end('Request too large');return;}chunks.push(c);}const request=new Request('http://127.0.0.1:5173'+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});const response=await worker.fetch(request,{DB,CAPACITY_LOCAL_DEV:'1',ADMIN_EMAIL:process.env.ADMIN_EMAIL});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch(e){console.error(e.message);res.writeHead(500);res.end('Preview error');}}).listen(5173,'127.0.0.1',()=>console.log('Nook: http://127.0.0.1:5173\nCapacity workspace: http://127.0.0.1:5173/capacity\nCompany data persists locally in .sites-runtime/preview.sqlite.'));

