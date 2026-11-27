// Capacity Lab v1. AC-side, constant facility load, periodic chronological simulation.
export function validate(p) {
  for(const k of ['lowHours','normalHours','highHours'])if(p[k]!==4)throw Error('All battery scenarios use a 4-hour nameplate duration.');
  for(const [k,a,b] of [['lowPct',0,100],['lowHours',0.1,24],['targetDays',90,100]])if(!Number.isFinite(p[k])||p[k]<a||p[k]>b)throw Error(`${k}: enter a number between ${a} and ${b}.`);
  const ranges={capacity:[0.001,1000000],future:[0,1000000],growth:[0,500],margin:[0,50],pue:[1,3],normalPct:[0,100],highPct:[0,100],normalHours:[0.1,24],highHours:[0.1,24],efficiency:[50,100],depth:[10,100],retention:[10,100],energyRate:[0,10],demandRate:[0,1000],rent:[0,5000],occupancy:[0,100],dcCapex:[0,100000],battEnergy:[0,10000],battPower:[0,10000],battFixed:[0,100000000],battOM:[0,30],opex:[0,100000],lease:[0,100000000],enabling:[0,1000000000],years:[1,30],discount:[0,50],refreshYear:[1,30],refreshPct:[0,100],alternative:[0,1000000000],delay:[0,360]};
  for(const [k,[a,b]] of Object.entries(ranges)) if(!Number.isFinite(p[k])||p[k]<a||p[k]>b) throw Error(`${k}: enter a number between ${a} and ${b}.`);
}
export function synthetic() {
  const load=[],dates=[];
  for(let i=0;i<8760;i++) {
    const d=new Date(Date.UTC(2025,0,1,i)),h=d.getUTCHours(),day=Math.floor(i/24);
    const summer=(1+Math.cos(2*Math.PI*(day-205)/365))/2;
    let v=1150+320*summer+260*Math.max(0,Math.sin(Math.PI*(h-6)/14));
    if(d.getUTCDay()===0||d.getUTCDay()===6)v-=140;
    if(day%47===0&&h>=14&&h<16)v+=850;
    load.push(v);dates.push(d.toISOString());
  }
  return {load,dates,dt:1,source:'Synthetic example · not a real property',synthetic:true,assumedDates:false};
}
export function parseCSV(text,dt,units) {
  if(![0.08333333333333333,0.25,0.5,1].includes(dt))throw Error('Choose 5, 15, 30, or 60 minutes.');
  const lines=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/);if(lines.length>110000)throw Error('Maximum 110,000 rows per file.');
  // CSV uses commas and ordinary numeric values; quoted fields supported.
  const split=line=>{let r=[],s='',q=false;for(let i=0;i<line.length;i++){let c=line[i];if(c==='"'){if(q&&line[i+1]==='"'){s+='"';i++;}else q=!q;}else if(c===','&&!q){r.push(s.trim());s='';}else s+=c;}if(q)throw Error('Unclosed CSV quote.');r.push(s.trim());return r;};
  const head=split(lines.shift()).map(s=>s.toLowerCase());
  const li=head.findIndex(s=>['load_kw','load_mw','load_kwh','load','value'].includes(s));
  const ti=head.findIndex(s=>['timestamp','datetime','date_time'].includes(s));
  if(li<0)throw Error('Use a load_kw, load_mw, load_kwh, load, or value column. Select matching units below.');
  const explicit=head[li]==='load_kw'?'kW':head[li]==='load_mw'?'MW':head[li]==='load_kwh'?'kWh':null;
  if(explicit&&explicit!==units)throw Error(`Column is ${head[li]}; select ${explicit} as the input unit.`);
  let load=[],dates=[],last=null;
  for(let i=0;i<lines.length;i++) {
    if(!lines[i].trim())throw Error(`Blank interval at row ${i+2}; fill or correct missing readings before import.`);
    const row=split(lines[i]),raw=row[li];
    if(raw===undefined||raw==='')throw Error(`Missing load at row ${i+2}.`);
    let v=Number(raw);if(!Number.isFinite(v)||v<0)throw Error(`Invalid or negative load at row ${i+2}. Use a nonnegative import/load profile.`);
    if(units==='MW')v*=1000;if(units==='kWh')v/=dt;
    let ts;
    if(ti>=0){const s=row[ti]||'';if(!/(Z|[+-]\d\d:\d\d)$/i.test(s))throw Error('Timestamps must include a time zone, e.g. 2025-01-01T00:00:00Z. Normalize daylight-saving changes first.');ts=Date.parse(s);if(!Number.isFinite(ts))throw Error(`Invalid timestamp at row ${i+2}.`);if(last!==null&&Math.abs(ts-last-dt*3600000)>1000)throw Error(`Missing, duplicated, or irregular interval at row ${i+2}.`);last=ts;}
    else ts=Date.UTC(2025,0,1)+i*dt*3600000;
    load.push(v);dates.push(new Date(ts).toISOString());
  }
  if(load.length<24/dt)throw Error('Supply at least 24 hours of continuous data.');
  if(load.length*dt>8800)throw Error('Use one continuous year (or a shorter screening sample) per analysis.');
  return {load,dates,dt,source:'Imported CSV',synthetic:false,assumedDates:ti<0};
}
export function simulate(available,dt,facility,power,usable,efficiency,trace=false) {
  const eta=Math.sqrt(efficiency),eps=1e-6;
  function pass(start,record){let soc=start,discharge=0,charge=0,minSOC=start,maxDischarge=0;const rows=record?[]:null;
    for(let i=0;i<available.length;i++){
      const gap=available[i]-facility;let c=0,d=0;
      if(gap<0){d=-gap;if(d>power+eps||d*dt/eta>soc+eps)return {ok:false};soc-=d*dt/eta;discharge+=d*dt;maxDischarge=Math.max(maxDischarge,d);}
      else if(power>0){c=Math.max(0,Math.min(gap,power,(usable-soc)/(eta*dt)));soc+=c*eta*dt;charge+=c*dt;}
      soc=Math.max(0,Math.min(usable,soc));minSOC=Math.min(minSOC,soc);
      if(record)rows.push({soc,charge:c,discharge:d,grid:facility+c-d});
    }
    return {ok:true,end:soc,charge,discharge,minSOC,maxDischarge,rows};
  }
  const warm=pass(usable,false);if(!warm.ok)return warm;
  const run=pass(warm.end,trace);if(!run.ok||run.end<warm.end-eps)return {ok:false};
  return {...run,start:warm.end};
}
export function size(available,dt,power,usable,efficiency){
  const loGap=available.reduce((a,b)=>Math.min(a,b),Infinity),avg=available.reduce((a,b)=>a+b,0)/available.length;
  let lo=Math.max(0,loGap),hi=Math.max(lo,Math.min(avg,loGap+power));
  for(let i=0;i<32;i++){const m=(lo+hi)/2;if(simulate(available,dt,m,power,usable,efficiency).ok)lo=m;else hi=m;}
  const facility=Math.max(0,lo-1e-5);
  return {facility,dispatch:simulate(available,dt,facility,power,usable,efficiency,true)};
}
export function npv(cash,initial,p,refresh=0){let v=-initial;for(let y=1;y<=p.years;y++)v+=cash/Math.pow(1+p.discount/100,y);if(p.refreshYear<=p.years)v-=refresh/Math.pow(1+p.discount/100,p.refreshYear);return v;}
// Repeatable load-following controller, permitting explicitly reported DC shortfalls.
// This is not an optimization that strategically sacrifices selected days.
export function simulateAvailability(available,dt,facility,power,usable,efficiency,dayIndex,days,trace=false){
  const eta=Math.sqrt(efficiency),eps=1e-4;
  let net=0;for(const a of available)net+=(a>=facility?Math.min(a-facility,power)*eta:-Math.min(facility-a,power)/eta)*dt;
  function pass(start,record){let soc=start,charge=0,discharge=0,unmetEnergy=0,shortfallHours=0,longestHours=0,runHours=0,maxShortfall=0,minSOC=start;const bad=new Uint8Array(days),rows=record?[]:null;
    for(let i=0;i<available.length;i++){
      const gap=available[i]-facility;let c=0,d=0,unmet=0;
      if(gap<0){d=Math.min(-gap,power,soc*eta/dt);soc-=d*dt/eta;unmet=Math.max(0,-gap-d);}
      else{c=Math.max(0,Math.min(gap,power,(usable-soc)/(eta*dt)));soc+=c*eta*dt;}
      soc=Math.max(0,Math.min(usable,soc));charge+=c*dt;discharge+=d*dt;minSOC=Math.min(minSOC,soc);
      if(unmet>eps){bad[dayIndex[i]]=1;shortfallHours+=dt;unmetEnergy+=unmet*dt;runHours+=dt;longestHours=Math.max(longestHours,runHours);maxShortfall=Math.max(maxShortfall,unmet);}else runHours=0;
      if(record)rows.push({soc,charge:c,discharge:d,unmet,grid:facility-unmet+c-d});
    }
    // Merge a shortfall spanning the repeated-profile boundary.
    if(record&&rows[0]?.unmet>eps&&rows.at(-1)?.unmet>eps){let first=0,last=0;for(let i=0;i<rows.length&&rows[i].unmet>eps;i++)first+=dt;for(let i=rows.length-1;i>=0&&rows[i].unmet>eps;i--)last+=dt;longestHours=Math.min(available.length*dt,Math.max(longestHours,first+last));}
    const badDays=bad.reduce((a,b)=>a+b,0);
    return {ok:true,end:soc,charge,discharge,minSOC,rows,badDays,days,dayCoverage:100*(days-badDays)/days,hourCoverage:100*(1-shortfallHours/(available.length*dt)),shortfallHours,unmetEnergy,maxShortfall,longestHours};
  }
  // Compositions of clipped SOC increments have a fixed point after a warm pass
  // from the boundary in the direction of net annual charging.
  const warm=pass(net>=0?usable:0,false),run=pass(warm.end,trace);
  if(Math.abs(run.end-warm.end)>1e-5)return {ok:false};
  return {...run,start:warm.end};
}
export function sizeAvailability(available,dt,power,usable,efficiency,dayIndex,days,target,firmFacility=0){
  const allowedBad=Math.floor(days*(1-target/100)+1e-8);
  let lo=firmFacility,hi=available.reduce((a,b)=>Math.max(a,b),0)+power;
  for(let i=0;i<32;i++){const m=(lo+hi)/2,r=simulateAvailability(available,dt,m,power,usable,efficiency,dayIndex,days);if(r.ok&&r.badDays<=allowedBad)lo=m;else hi=m;}
  const facility=Math.max(0,lo-0.0002),dispatch=simulateAvailability(available,dt,facility,power,usable,efficiency,dayIndex,days,true);
  return {facility,dispatch,allowedBad};
}
// Solve the circular definition: battery AC kW = fraction × resulting IT kW.
export function sizeITRelative(available,dt,fraction,duration,pue,efficiency,window,retention,dayIndex,days,target){
  const allowedBad=Math.floor(days*(1-target/100)+1e-8),requiredGood=days-allowedBad;
  // Over a periodic profile, a battery adds no net energy. Full service on the
  // required good days alone gives this conservative finite search ceiling.
  let lo=0,hi=available.reduce((a,b)=>a+b,0)*dt/(requiredGood*24);
  const specs=d=>{const power=d/pue*fraction,energy=power*duration;return {power,energy,usable:energy*window*retention};};
  for(let i=0;i<34;i++){const d=(lo+hi)/2,b=specs(d),r=simulateAvailability(available,dt,d,b.power,b.usable,efficiency,dayIndex,days);if(r.ok&&r.badDays<=allowedBad)lo=d;else hi=d;}
  const facility=Math.max(0,lo-0.0002),b=specs(facility),dispatch=simulateAvailability(available,dt,facility,b.power,b.usable,efficiency,dayIndex,days,true);
  return {facility,...b,dispatch,allowedBad};
}
export function analyze(data,p,{includeTraces=true}={}){
  validate(p);const n=data.load.length,dt=data.dt,hours=n*dt;
  if(n===0||data.dates.length!==n||!Number.isFinite(dt)||dt<=0)throw Error('Invalid interval dataset.');
  const adjusted=data.load.map(v=>{if(!Number.isFinite(v)||v<0)throw Error('Invalid load data.');return v*(1+p.growth/100)+p.future;});
  const raw=adjusted.map(v=>p.capacity-v);
  const minRaw=raw.reduce((a,b)=>Math.min(a,b),Infinity);
  if(minRaw<0)throw Error('Host load plus planned growth exceeds the connection limit. Resolve that host-side overload before allocating capacity to Nook.');
  const available=raw.map(v=>v*(1-p.margin/100));
  const first=new Date(data.dates[0]),end=new Date(Date.parse(data.dates.at(-1))+dt*3600000);
  if(first.getUTCHours()||first.getUTCMinutes()||first.getUTCSeconds()||end.getUTCHours()||end.getUTCMinutes()||end.getUTCSeconds())throw Error('Daily coverage requires complete UTC days: start at 00:00 UTC and end at the following 00:00 UTC boundary.');
  const dayMap=new Map(),dayIndex=new Int32Array(n);
  data.dates.forEach((d,i)=>{const key=new Date(d).toISOString().slice(0,10);if(!dayMap.has(key))dayMap.set(key,dayMap.size);dayIndex[i]=dayMap.get(key);});
  const days=dayMap.size;
  const annualHours=Math.abs(hours-8760)<0.001||Math.abs(hours-8784)<0.001;
  const monthBoundary=first.getUTCDate()===1&&first.getUTCHours()===0&&first.getUTCMinutes()===0;
  const annual=annualHours&&monthBoundary&&end.getUTCMonth()===first.getUTCMonth()&&end.getUTCDate()===1&&end.getUTCHours()===0&&end.getUTCMinutes()===0;
  const scale=annual?1:null;
  const month=d=>d.slice(0,7),basePeaks={};
  adjusted.forEach((v,i)=>{const k=month(data.dates[i]);basePeaks[k]=Math.max(basePeaks[k]||0,v);});
  const configs=[['No battery',0,0],['Low battery',p.lowPct/100,4],['Moderate battery',p.normalPct/100,4],['High battery',p.highPct/100,4]];
  const scenarios=configs.map(([name,fraction,duration])=>{
    const result=sizeITRelative(available,dt,fraction,duration,p.pue,p.efficiency/100,p.depth/100,p.retention/100,dayIndex,days,p.targetDays);
    const {facility,power,energy,usable}=result,it=facility/p.pue;
    // Compare 100% coverage using the very same installed battery selected above.
    const firm=size(available,dt,power,usable,p.efficiency/100);
    if(!result.dispatch.ok)throw Error('No cyclic dispatch found.');
    let energyExtra=0;const newPeaks={};
    result.dispatch.rows.forEach((r,i)=>{energyExtra+=r.grid*dt;const k=month(data.dates[i]);newPeaks[k]=Math.max(newPeaks[k]||0,adjusted[i]+r.grid);});
    const demandIncrement=Object.keys(basePeaks).reduce((sum,k)=>sum+Math.max(0,newPeaks[k]-basePeaks[k]),0);
    const bill=energyExtra*p.energyRate+demandIncrement*p.demandRate;
    const battCapex=power>0?energy*p.battEnergy+power*p.battPower+p.battFixed:0;
    const dcCapex=it*p.dcCapex,initial=dcCapex+battCapex+p.enabling;
    const revenue=annual?it*p.rent*12*p.occupancy/100:null;
    const cash=annual?revenue-bill-it*p.opex-p.lease-battCapex*p.battOM/100:null;
    const refresh=battCapex*p.refreshPct/100;
    const residual=annual?npv(cash,initial,p,refresh):null;
    // Same operating cash and DC/BESS, fixed evaluation date, delayed commissioning.
    const r=p.discount/100,df=t=>Math.pow(1+r,-t),delayYears=p.delay/12;
    let delayedValue=null,speedAdvantage=null;
    if(annual){delayedValue=-(dcCapex+battCapex+p.alternative)*df(delayYears);for(let m=p.delay+1;m<=p.years*12;m++)delayedValue+=cash/12*df(m/12);if(p.refreshYear+delayYears<=p.years)delayedValue-=refresh*df(p.refreshYear+delayYears);let nowMonthly=-initial;for(let m=1;m<=p.years*12;m++)nowMonthly+=cash/12*df(m/12);if(p.refreshYear<=p.years)nowMonthly-=refresh*df(p.refreshYear);speedAdvantage=nowMonthly-delayedValue;}
    const cycles=usable>0?result.dispatch.discharge/Math.sqrt(p.efficiency/100)/usable:0;
    if(!includeTraces)result.dispatch.rows=undefined;
    return {name,power,duration,energy,usable,facility,it,firmFacility:firm.facility,firmIT:firm.facility/p.pue,...result,energyExtra,bill,battCapex,dcCapex,initial,revenue,cash,residual,speedAdvantage,cycles};
  });
  return {annual,hours,days,adjusted,available,minRaw,scenarios,p,source:data.source,synthetic:data.synthetic,assumedDates:data.assumedDates,scale};
}
