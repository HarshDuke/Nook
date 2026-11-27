import assert from 'node:assert/strict';
import {parseCSV,size,simulate,analyze,synthetic,simulateAvailability,sizeAvailability,sizeITRelative} from '../src/capacity/model.mjs';
const close=(a,b,e=.001)=>assert(Math.abs(a-b)<e,`${a} != ${b}`);
// A battery cannot create annual energy or use a free initial full charge.
close(size(Array(8760).fill(1000),1,500,2000,.85).facility,1000);
assert.equal(simulate(Array(100).fill(900),1,1000,200,100000,.85).ok,false);
// A recurring two-hour peak is bridgeable if sufficient recharge follows.
let gaps=Array.from({length:8760},(_,i)=>i%24>=14&&i%24<16?500:1500);
const b=size(gaps,1,500,2000,.85);assert(b.facility>999&&b.facility<1001);assert(b.dispatch.end>=b.dispatch.start-1e-6);
for(let i=0;i<gaps.length;i++){let row=b.dispatch.rows[i];assert(row.grid<=gaps[i]+1e-6);assert(row.soc>=0&&row.soc<=2000+1e-6);}
// A long deficit, not a single bad hour, is the binding constraint.
const long=size([...Array(100).fill(500),...Array(100).fill(1500)],1,500,2000,.85);assert(long.facility<521);
// Interval energy converts to average power, and incomplete profiles are explicit.
close(parseCSV('load_kwh\n25\n25\n'+Array(94).fill('25').join('\n'),.25,'kWh').load[0],100);
assert.throws(()=>parseCSV('load_kw\n\n'+Array(24).fill('2').join('\n'),1,'kW'),/Missing|Blank/);
assert.throws(()=>parseCSV('load_kw\n'+Array(24).fill('-1').join('\n'),1,'kW'),/negative/);
assert.throws(()=>parseCSV('timestamp,load_kw\n2025-01-01T00:00:00Z,1\n2025-01-01T02:00:00Z,1',1,'kW'),/irregular/);
assert.throws(()=>parseCSV('load_mw\n1',1,'kW'),/select MW/);
const html=await import('node:fs').then(fs=>fs.readFileSync(new URL('../src/capacity/index.html',import.meta.url),'utf8'));
const ids=['lowPct','lowHours','targetDays','capacity','future','growth','margin','pue','normalPct','highPct','normalHours','highHours','efficiency','depth','retention','energyRate','demandRate','rent','occupancy','dcCapex','battEnergy','battPower','battFixed','battOM','opex','lease','enabling','years','discount','refreshYear','refreshPct','alternative','delay'];
const p=Object.fromEntries(ids.map(k=>[k,Number(html.match(new RegExp(`id="${k}"[^>]*value="([^"]+)"`))[1])]));
const d=synthetic(),a=analyze(d,p);assert(a.annual);assert.equal(a.scenarios.length,4);for(let i=1;i<4;i++)assert(a.scenarios[i].it>=a.scenarios[i-1].it);close(a.scenarios[0].firmFacility,.95*(p.capacity-Math.max(...d.load)));close(a.scenarios[0].it,a.scenarios[0].facility/p.pue);close(a.scenarios[3].power,a.scenarios[3].it*.5);
for(const s of a.scenarios){assert(s.dispatch.badDays<=3);assert(s.facility>=s.firmFacility-.001);close(s.dispatch.end,s.dispatch.start);}
const short=analyze({...d,load:d.load.slice(0,168),dates:d.dates.slice(0,168)},p);assert(!short.annual);assert.equal(short.scenarios[0].residual,null);
assert.throws(()=>analyze(d,{...p,capacity:1000}),/exceeds/);
// Reserve and growth must consistently reduce capacity.
assert(analyze(d,{...p,growth:10}).scenarios[0].it<a.scenarios[0].it);
// No hidden battery fixed cost when size is zero.
close(a.scenarios[0].battCapex,0);
console.log('Passed 15 groups: conservation, cyclic SOC, recharge limits, duration, units, invalid CSV, growth, reserves, finance gating.');
console.log(a.scenarios.map(s=>({scenario:s.name,itMW:s.it/1000,batteryMWh:s.energy/1000,residual:s.residual})));
// Exactly three failed days are allowed at 99% of 365 days; four are not.
const dayIndex=Int32Array.from({length:8760},(_,i)=>Math.floor(i/24));
let daily=Array(8760).fill(1000);for(let day=0;day<3;day++)daily[day*24]=100;
const allow3=sizeAvailability(daily,1,0,0,.85,dayIndex,365,99);close(allow3.facility,1000);assert.equal(allow3.dispatch.badDays,3);close(allow3.dispatch.shortfallHours,3);
daily[3*24]=100;const reject4=sizeAvailability(daily,1,0,0,.85,dayIndex,365,99);close(reject4.facility,100);
// A flat profile cannot gain sustained capacity from a battery, even at 99% days.
close(sizeAvailability(Array(8760).fill(1000),1,500,2000,.85,dayIndex,365,99).facility,1000);
// A power-limited shortfall must be curtailed rather than overload the connection.
const q=simulateAvailability(Array(24).fill(100),1,500,50,200,.85,new Int32Array(24),1,true);assert(q.ok);assert.equal(q.badDays,1);assert(q.rows.every(r=>r.grid<=100.000001&&r.grid>=0));assert(q.unmetEnergy>0);close(q.start,q.end);
// Random profiles: periodic SOC must hold with both net recharge and deficits.
let seed=123;const rand=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
for(let j=0;j<150;j++){let av=Array.from({length:72},()=>rand()*2000);let facility=rand()*2000,power=rand()*1200,energy=rand()*10000;let z=simulateAvailability(av,1,facility,power,energy,.85,Int32Array.from({length:72},(_,i)=>Math.floor(i/24)),3,true);assert(z.ok);close(z.start,z.end);for(let i=0;i<72;i++){assert(z.rows[i].grid<=av[i]+.00001);assert(z.rows[i].soc>=0&&z.rows[i].soc<=energy+.00001);}}
// Leap years permit only three bad days at a 99% daily target, too.
const leapIndex=Int32Array.from({length:8784},(_,i)=>Math.floor(i/24));assert.equal(sizeAvailability(Array(8784).fill(1000),1,0,0,.85,leapIndex,366,99).allowedBad,3);
const strict=analyze(d,{...p,targetDays:100});close(strict.scenarios[0].facility,strict.scenarios[0].firmFacility);
console.log('Daily coverage tests passed: integer-day budget, hours versus days, no free storage energy, cyclic SOC, curtailment balance, 150 randomized profiles, leap year, strict baseline.');
// Battery power is based on resulting IT, with all three at four-hour duration.
for(const [i,f] of [[1,.1],[2,.25],[3,.5]]){const s=a.scenarios[i];close(s.power,s.it*f);close(s.energy,4*s.power);assert.equal(s.duration,4);assert(Math.abs(s.power-p.capacity*f)>1);}
// Coupling must not make storage a net source of sustained energy.
close(sizeITRelative(Array(8760).fill(1000),1,.5,4,1.25,.85,.8,.8,dayIndex,365,99).facility,1000);
// Re-evaluate a slightly larger proposed facility together with its larger battery:
// the result must violate the daily budget, not merely exceed a frozen battery.
for(const s of a.scenarios.slice(1)){const f=s.power/s.it,d=s.facility+.1,power=d/p.pue*f,usable=4*power*p.depth/100*p.retention/100;const z=simulateAvailability(a.available,1,d,power,usable,p.efficiency/100,dayIndex,365);assert(!z.ok||z.badDays>3);}
assert.throws(()=>analyze(d,{...p,lowHours:2}),/4-hour/);
console.log('IT-relative coupling tests passed: 10/25/50% of IT kW, 4-hour energy, finite energy bound, and coupled feasibility boundary.');
