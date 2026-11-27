import {spawnSync} from 'node:child_process';
import {readdirSync} from 'node:fs';
await import('./build.mjs');
const result=spawnSync(process.execPath,['--test',...readdirSync('tests').filter(n=>n.endsWith('.test.mjs')).sort().map(n=>'tests/'+n)],{stdio:'inherit'});
process.exitCode=result.status??1;
