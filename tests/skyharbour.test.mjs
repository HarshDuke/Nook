import test from 'node:test';
import assert from 'node:assert/strict';
import {generateSkyHarbour,PROFILE_IDS,PARAMETERS,profileStats} from '../examples/skyharbour/generate.mjs';
import {analyze} from '../src/capacity/model.mjs';
test('Sky Harbour generators are reproducible synthetic full years with exactly 6 MW peak',()=>{
 for(const profile of PROFILE_IDS){const g=generateSkyHarbour(profile);assert.equal(g.data.load.length,35040);assert.equal(g.data.dt,.25);assert.equal(Math.max(...g.data.load),6000);assert(g.data.load.every(v=>v>=0&&v<=6000));assert(g.data.synthetic);assert.match(g.data.source,/SYNTHETIC/);assert.equal(g.data.dates[0],'2025-01-01T00:00:00.000Z');assert.equal(g.data.dates.at(-1),'2025-12-31T23:45:00.000Z');assert.deepEqual(generateSkyHarbour(profile).data.load,g.data.load);const stats=profileStats(g);assert.equal(stats.peakMW,6);assert.equal(stats.monthly.length,12);const componentSum=Object.values(stats.componentMWh).reduce((a,b)=>a+b,0);assert(Math.abs(componentSum-stats.annualMWh)<.001);}
});
test('Sky Harbour stress exposes prolonged peak risk and all profiles retain the 3.04 MW strict baseline',()=>{
 let base,stress;for(const profile of PROFILE_IDS){const r=analyze(generateSkyHarbour(profile).data,PARAMETERS,{includeTraces:false});assert(r.annual);assert(Math.abs(r.scenarios[0].firmIT/1000-3.04)<.00001);for(const s of r.scenarios)assert(s.dispatch.badDays<=3);if(profile==='electrified')base=r;if(profile==='persistent_peak')stress=r;}
 assert(stress.scenarios[3].it<base.scenarios[3].it);
});
