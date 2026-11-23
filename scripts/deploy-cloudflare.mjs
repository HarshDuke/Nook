import {readFile,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';

// This runs in the signed-in hosting environment. Credentials stay in its environment.
const configPath=new URL('../wrangler.jsonc',import.meta.url);
const config=JSON.parse(await readFile(configPath,'utf8'));
const npx=process.platform==='win32'?'npx.cmd':'npx';
function wrangler(args,capture=false){
 const result=spawnSync(npx,['--yes','wrangler@4',...args],{stdio:capture?['ignore','pipe','pipe']:'inherit',encoding:'utf8',env:{...process.env,CI:'true',WRANGLER_SEND_METRICS:'false'}});
 if(result.error)throw result.error;
 if(result.status!==0){if(capture)process.stderr.write(result.stderr||'');throw new Error('Cloudflare deployment step failed: '+args[0]+' '+(args[1]||''));}
 return capture?result.stdout:'';
}
const binding=config.d1_databases.find(b=>b.binding==='DB');
function databases(){const data=JSON.parse(wrangler(['d1','list','--json'],true));if(!Array.isArray(data))throw new Error('Unexpected D1 database list.');return data;}
let matches=databases().filter(db=>db.name===binding.database_name);
if(matches.length===0){wrangler(['d1','create',binding.database_name]);matches=databases().filter(db=>db.name===binding.database_name);}
if(matches.length!==1 || !matches[0].uuid)throw new Error('Could not uniquely resolve the intake database.');
binding.database_id=matches[0].uuid;
await writeFile(configPath,JSON.stringify(config,null,2)+'\n');
wrangler(['d1','migrations','apply','DB','--remote']);
wrangler(['deploy']);
