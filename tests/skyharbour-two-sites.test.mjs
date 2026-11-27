import test from 'node:test';
import assert from 'node:assert/strict';
import {generateSite} from '../examples/skyharbour-two-sites/generate.mjs';
test('researched campus cases preserve raw electrical accounting, exact peak and reproducible events',()=>{
 for(const id of ['sgr','bna']){
  const g=generateSite(id);assert.equal(g.data.load.length,35040);assert.equal(Math.max(...g.data.load),6000);assert.equal(g.data.synthetic,true);
  let energy=0,thermal=0;
  for(let i=0;i<g.rows.length;i++){
   const row=g.rows[i],electric=Object.values(row.components).reduce((a,b)=>a+b,0);
   assert(Math.abs(electric-g.rawLoad[i])<1e-8);assert(Math.abs(electric*g.normalizationFactor-g.data.load[i])<1e-8);
   assert(row.dewpointF<=row.temperatureF);assert(g.rawLoad[i]>0);energy+=electric*.25/1000;thermal+=row.heatingThermalKW;
   if(id==='bna')assert.equal(row.components.electricHeating,0);
  }
  assert(thermal>0);assert(Math.abs(energy-g.stats.rawAnnualMWh)<1e-7);
  assert.equal(g.events.filter(e=>e.type==='door_opening').length,g.stats.doorEvents);
  assert(g.stats.meanDoorEventsPerBayDay>1.7&&g.stats.meanDoorEventsPerBayDay<2.3);
  assert.deepEqual(generateSite(id).data.load,g.data.load);
 }
});
