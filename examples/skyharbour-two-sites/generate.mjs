// Public facts + explicit engineering assumptions. NOT measured site demand.
export const VERSION='skyharbour-two-sites-1.0';
export const SHARED={year:2025,dtHours:.25,intervals:35040,timeZone:'America/Chicago',
 imposedPeakKW:6000,assumedConnectionKW:10000,suiteFraction:.14,hangarHeightFt:32,suiteHeightFt:10,
 hangarHeatF:55,hangarCoolF:78,suiteHeatF:68,suiteCoolF:74,hangarRH:.60,suiteRH:.50,
 envelopeWPerSqftF:.07,hangarACH:.15,suiteACH:.5,coolingCOP:3.2,
 solarThermalWPerSqft:.4,securityWPerSqft:.06,hangarLightWPerSqft:.5,
 suiteLightWPerSqft:.7,suitePlugWPerSqft:1,fanWPerSqft:.12,
 dailyDoorEventsPerHangar:2,weekdayActivity:1.12,weekendActivity:.7,
 doorOpenMinutes:15,doorMotorKW:15,doorMotorMinutes:3,doorAirExchanges:.5,recoveryHours:.75,
 groundPowerProbability:.65,groundPowerInputKW:40,groundPowerDurationIntervals:[2,6],
 maintenanceProbabilityPerBayWeekday:.35,maintenanceKW:12,maintenanceHours:2,
 gseChargerKW:7.2,gseChargeHours:2,evChargerKW:7.2,evChargeHours:3,
 evSessionProbabilityPerBayWeekday:.25,hotWaterKWPerBay:1.5,
 weatherDailyAR:.8,weatherInnovationF:3,weatherAnomalyClipF:18};
export const SITES={
 sgr:{code:'SGR',name:'Sugar Land Regional Airport',city:'Sugar Land',state:'TX',
 address:'132 Lee Duggan Dr, Sugar Land, TX 77498',hangars:7,sqft:66080,occupancy:1,
 heat:'heat_pump',heatEvidence:'ASSUMED: no public mechanical schedule found; not verified.',seed:2026112701,
 climateStation:'Houston Hobby AP / USW00012918; nearby proxy, not on-site weather',
 meanF:[55,58.8,64.7,70.5,77.6,82.9,84.8,85.1,81.1,73,63.3,56.9],
 highF:[63.8,67.6,73.4,79.3,85.9,91,92.9,93.5,89.3,82.1,72.6,65.7],
 lowF:[46.1,50.1,55.9,61.8,69.3,74.9,76.6,76.7,72.9,63.9,54,48],
 // Engineering humidity assumptions, NOT NOAA normals or measured dew points.
 assumedDewpointF:[45,48,53,59,66,72,74,74,69,61,53,47]},
 bna:{code:'BNA',name:'Nashville International Airport',city:'Nashville',state:'TN',
 address:'1480 Murfreesboro Pike, Nashville, TN 37217',hangars:10,sqft:149069,occupancy:.99,
 heat:'gas',heatEvidence:'Gas heaters documented in new hangars in May/June 2022; continued operation, office fuel and legacy Hangar 14 fuel assumed.',seed:2026112702,
 climateStation:'Nashville Intl AP / USW00013897',
 meanF:[39.6,43.4,51.5,60.8,69.3,77.1,80.7,79.7,73.1,61.7,50.3,42.7],
 highF:[49.1,53.8,62.7,72.6,80.4,87.7,90.9,90.4,84.4,73.5,61.4,52.2],
 lowF:[30.1,33,40.2,48.9,58.3,66.4,70.5,69,61.8,49.9,39.2,33.3],
 assumedDewpointF:[27,30,37,45,55,63,67,66,59,47,37,31]}
};
const fmt=new Intl.DateTimeFormat('en-US',{timeZone:SHARED.timeZone,year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',hourCycle:'h23'});
function clock(date){const p=Object.fromEntries(fmt.formatToParts(date).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));return {...p,hour:p.hour+p.minute/60,weekday:new Date(Date.UTC(p.year,p.month-1,p.day)).getUTCDay()};}
function rng(seed){return()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return(seed+.5)/4294967296;};}
function normal(r){return Math.sqrt(-2*Math.log(r()))*Math.cos(2*Math.PI*r());}
function poisson(lambda,r){let k=0,p=1;const limit=Math.exp(-lambda);do{k++;p*=r();}while(p>limit);return k-1;}
function sample(weights,r){let x=r()*weights.reduce((a,b)=>a+b,0);for(let i=0;i<weights.length;i++){x-=weights[i];if(x<0)return i;}return weights.length-1;}
function smoothMonthly(a,month,day){const days=new Date(Date.UTC(2025,month,0)).getUTCDate(),f=(day-.5)/days;return f<.5?a[(month+10)%12]*(.5-f)+a[month-1]*(.5+f):a[month-1]*(1.5-f)+a[month%12]*(f-.5);}
const celsius=f=>(f-32)*5/9;
function vaporPressure(tC){return .61094*Math.exp(17.625*tC/(tC+243.04));}
function humidityRatio(tF,rh=1){const v=rh*vaporPressure(celsius(tF));return .62198*v/(101.325-v);}
export function generateSite(id){
 const s=SITES[id];if(!s)throw Error('Choose sgr or bna.');const a=SHARED,n=a.intervals,dt=a.dtHours,r=rng(s.seed),start=Date.UTC(a.year,0,1);
 const dates=Array.from({length:n},(_,i)=>new Date(start+i*900000).toISOString()),clocks=dates.map(d=>clock(new Date(d)));
 const weatherR=rng(s.seed+100),anomaly=[];let state=0;
 for(let d=0;d<365;d++){state=Math.max(-a.weatherAnomalyClipF,Math.min(a.weatherAnomalyClipF,a.weatherDailyAR*state+a.weatherInnovationF*normal(weatherR)));anomaly.push(state);}
 const openings=Array(n).fill(0),gpu=Array.from({length:s.hangars},()=>new Float64Array(n)),maintenance=new Float64Array(n),ev=new Float64Array(n),gse=new Float64Array(n),active=Array.from({length:s.hangars},()=>new Uint8Array(n));
 const events=[],add=(arr,i,len,kw)=>{for(let k=0;k<len;k++)arr[(i+k)%n]+=kw;};
 for(let d=0;d<365;d++){
  const weekend=[0,6].includes(clocks[d*96+48].weekday),activity=weekend?a.weekendActivity:a.weekdayActivity;
  const weights=clocks.slice(d*96,(d+1)*96).map(p=>.02+Math.exp(-(((p.hour-8.5)/2)**2))+.85*Math.exp(-(((p.hour-17)/2.5)**2)));
  for(let bay=0;bay<s.hangars;bay++){
   const count=poisson(a.dailyDoorEventsPerHangar*activity*s.occupancy,r);
   for(let k=0;k<count;k++){
    const i=d*96+sample(weights,r);openings[i]++;events.push({timestamp:dates[i],bay:bay+1,type:'door_opening'});active[bay][i]=1;
    if(r()<a.groundPowerProbability){const len=2+Math.floor(r()*5);for(let j=0;j<len;j++)gpu[bay][(i+j)%n]=a.groundPowerInputKW;events.push({timestamp:dates[i],bay:bay+1,type:'aircraft_ground_power',durationHours:len*dt,inputKW:a.groundPowerInputKW});}
   }
   if(!weekend&&r()<a.maintenanceProbabilityPerBayWeekday*s.occupancy){const i=d*96+sample(clocks.slice(d*96,(d+1)*96).map(p=>p.hour>=9&&p.hour<15?1:0),r);add(maintenance,i,8,a.maintenanceKW);for(let j=0;j<8;j++)active[bay][(i+j)%n]=1;events.push({timestamp:dates[i],bay:bay+1,type:'routine_maintenance',durationHours:2,inputKW:12});}
   if(r()<a.evSessionProbabilityPerBayWeekday*(weekend?.5:1)*s.occupancy){const i=d*96+sample(clocks.slice(d*96,(d+1)*96).map(p=>p.hour>=8&&p.hour<15?1:0),r);add(ev,i,12,a.evChargerKW);events.push({timestamp:dates[i],bay:bay+1,type:'car_charging',durationHours:3,inputKW:7.2});}
  }
  // One 2-hour recharge per GSE charger per UTC day; each start chosen in local 19:00-23:00.
  for(let unit=0;unit<Math.ceil(s.hangars/3);unit++){const i=d*96+sample(clocks.slice(d*96,(d+1)*96).map(p=>p.hour>=19&&p.hour<23?1:0),r);add(gse,i,8,a.gseChargerKW);events.push({timestamp:dates[i],type:'gse_charging',unit:unit+1,durationHours:2,inputKW:7.2});}
 }
 const suite=s.sqft*a.suiteFraction,hangar=s.sqft-suite,vol=hangar*a.hangarHeightFt*.0283168466,suiteVol=suite*a.suiteHeightFt*.0283168466;
 const rows=[],raw=[],decay=Math.exp(-dt/a.recoveryHours);let storedCool=0,storedHeat=0,storedLatent=0;
 // Two passes make the door recovery state periodic across the year boundary.
 for(let pass=0;pass<2;pass++)for(let i=0;i<n;i++){
  const p=clocks[i],h=p.hour,d=Math.floor(i/96),weekend=[0,6].includes(p.weekday),occupied=h>=7&&h<19?(weekend?.6:1):.1;
  const f=(i%96+.5)/96;
  const dayNoise=f<.5?anomaly[(d+364)%365]*(.5-f)+anomaly[d]*(.5+f):anomaly[d]*(1.5-f)+anomaly[(d+1)%365]*(f-.5);
  const t=smoothMonthly(s.meanF,p.month,p.day)+(smoothMonthly(s.highF,p.month,p.day)-smoothMonthly(s.lowF,p.month,p.day))/2*Math.cos(2*Math.PI*(h-15)/24)+dayNoise;
  const dew=Math.min(t,smoothMonthly(s.assumedDewpointF,p.month,p.day)+.35*dayNoise);
  const outsideW=humidityRatio(dew),hangarW=humidityRatio(a.hangarCoolF,a.hangarRH),suiteW=humidityRatio(a.suiteCoolF,a.suiteRH);
  const massDoor=openings[i]*a.doorAirExchanges*vol/s.hangars*1.2;
  storedCool+=massDoor*1.006*Math.max(0,celsius(t)-celsius(a.hangarCoolF))/3600;
  storedHeat+=massDoor*1.006*Math.max(0,celsius(a.hangarHeatF)-celsius(t))/3600;
  storedLatent+=massDoor*2501*Math.max(0,outsideW-hangarW)/3600;
  const doorCool=storedCool*(1-decay)/dt,doorHeat=storedHeat*(1-decay)/dt,doorLatent=storedLatent*(1-decay)/dt;
  storedCool*=decay;storedHeat*=decay;storedLatent*=decay;
  const litBays=active.reduce((sum,v,bay)=>sum+Math.max(v[i],gpu[bay][i]>0?1:0),0)/s.hangars;
  const lighting=hangar*a.hangarLightWPerSqft/1000*Math.max(.1+.5*occupied,litBays)+suite*a.suiteLightWPerSqft/1000*(.1+.9*occupied);
  const officePlug=suite*a.suitePlugWPerSqft/1000*(.15+.85*occupied),ground=gpu.reduce((sum,v)=>sum+v[i],0);
  const security=s.sqft*a.securityWPerSqft/1000;
  // Sun proxy: fixed 06:00-18:00, seasonal amplitude. Not measured irradiance/daylight.
  const solar=Math.max(0,Math.sin(Math.PI*(h-6)/12))*(.65+.35*Math.cos(2*Math.PI*(d-172)/365));
  const solarKW=s.sqft*a.solarThermalWPerSqft*solar/1000;
  const hMass=vol*a.hangarACH/3600*1.2,oMass=suiteVol*a.suiteACH/3600*1.2;
  const ua=s.sqft*a.envelopeWPerSqftF/1000;
  const coolThermal=Math.max(0,ua*(1-a.suiteFraction)*(t-a.hangarCoolF)+hMass*1.006*(celsius(t)-celsius(a.hangarCoolF))+.86*solarKW+.8*(lighting+maintenance[i]+ground))+Math.max(0,ua*a.suiteFraction*(t-a.suiteCoolF)+oMass*1.006*(celsius(t)-celsius(a.suiteCoolF))+.14*solarKW+.8*officePlug);
  const heatThermal=Math.max(0,ua*(1-a.suiteFraction)*(a.hangarHeatF-t)+hMass*1.006*(celsius(a.hangarHeatF)-celsius(t))-.86*solarKW-.8*(lighting+maintenance[i]+ground))+Math.max(0,ua*a.suiteFraction*(a.suiteHeatF-t)+oMass*1.006*(celsius(a.suiteHeatF)-celsius(t))-.14*solarKW-.8*officePlug)+doorHeat;
  const latentThermal=(hMass*Math.max(0,outsideW-hangarW)+oMass*Math.max(0,outsideW-suiteW))*2501+doorLatent;
  const cop=Math.max(2.4,a.coolingCOP-.04*Math.max(0,t-95)),heatCOP=Math.max(1.8,Math.min(3,3-.03*Math.max(0,47-t)));
  const component={security,lighting,officePlug,maintenance:maintenance[i],aircraftGroundPower:ground,vehicleCharging:ev[i],gseCharging:gse[i],hotWater:s.hangars*a.hotWaterKWPerBay*(h>=7&&h<19?.3:.02),fans:s.sqft*a.fanWPerSqft/1000*(.4+.6*occupied),cooling:(coolThermal+doorCool)/cop,dehumidification:latentThermal/cop,electricHeating:s.heat==='heat_pump'?heatThermal/heatCOP:0,gasHeaterBlowers:s.heat==='gas'&&heatThermal>0?s.sqft*.02/1000:0,doorMotor:openings[i]*a.doorMotorKW*a.doorMotorMinutes/15};
  if(pass===1){rows.push({timestamp:dates[i],localHour:h,temperatureF:t,dewpointF:dew,doorEvents:openings[i],heatingThermalKW:heatThermal,components:component});raw.push(Object.values(component).reduce((sum,v)=>sum+v,0));}
 }
 const rawPeak=Math.max(...raw),factor=a.imposedPeakKW/rawPeak,load=raw.map(v=>v*factor);
 load[raw.indexOf(rawPeak)]=a.imposedPeakKW;
 const data={dates,load,dt,source:`SYNTHETIC ${s.code} working case | ${VERSION} | imposed 6 MW peak`,synthetic:true,assumedDates:false};
 const sum=raw.reduce((x,y)=>x+y,0),componentMWh=Object.fromEntries(Object.keys(rows[0].components).map(k=>[k,rows.reduce((x,row)=>x+row.components[k],0)*dt*factor/1000]));
 return {site:s,assumptions:a,version:VERSION,data,rows,events,rawLoad:raw,normalizationFactor:factor,
 stats:{rawPeakKW:rawPeak,rawAnnualMWh:sum*dt/1000,annualMWh:sum*dt*factor/1000,meanMW:sum/n*factor/1000,minMW:Math.min(...load)/1000,peakMW:6,loadFactor:sum/n/rawPeak,hoursAbove5MW:load.filter(v=>v>5000).length*dt,imposedPeakWPerSqft:6000000/s.sqft,doorEvents:openings.reduce((x,y)=>x+y,0),meanDoorEventsPerBayDay:openings.reduce((x,y)=>x+y,0)/(s.hangars*365),componentMWh}};
}
