// Research-informed synthetic scenario. No measured Sky Harbour electricity data.
// All public facts and scenario assumptions are documented in research.md.
export const GENERATOR_VERSION='skyharbour-swf-1.0';
export const PROFILE_IDS=['electrified','non_electric_heat','persistent_peak'];
export const PROFILE_NAMES={electrified:'Electrified climate-control shape',non_electric_heat:'Non-electric heating / summer-peak shape',persistent_peak:'Persistent winter demand stress'};
export const CLIMATE_NORMALS={
 meanF:[27.1,29.2,37.6,49.0,59.5,68.4,73.6,71.7,63.9,52.2,41.5,32.1],
 highF:[36,38.9,47.9,60.6,71.3,79.8,84.8,82.8,75.3,63.3,51.4,40.5],
 lowF:[18.2,19.5,27.4,37.5,47.7,57.1,62.3,60.7,52.5,41.1,31.6,23.8]
};
export const ASSUMPTIONS={year:2025,intervalMinutes:15,randomSeed:20261127,connectionKW:10000,peakKW:6000,hangars:8,contextRentableSqft:256240,heatingSetpointF:55,coolingSetpointF:72,averageDoorOpeningsPerHangarDay:2,doorOpenMinutes:15,doorMotorMinutes:3,doorMotorKW:18,groundPowerRatingKVA:90,groundPowerAssumedKW:40,groundSupportChargeKW:30,vehicleChargeKW:22,baseSecurityControlsKW:125,fullHangarLightingKW:256,officeSuiteKW:45};
export const PARAMETERS={capacity:10000,future:0,growth:0,margin:5,pue:1.25,lowPct:10,normalPct:25,highPct:50,lowHours:4,normalHours:4,highHours:4,targetDays:99,efficiency:85,depth:80,retention:80,energyRate:.12,demandRate:10,rent:250,occupancy:90,dcCapex:6500,battEnergy:250,battPower:250,battFixed:50000,battOM:3,opex:180,lease:50000,enabling:250000,years:10,discount:10,refreshYear:8,refreshPct:50,alternative:2000000,delay:24};
export const SITE_METADATA={siteName:'Stewart SWF — SYNTHETIC 10 MW / 6 MW example',address:'Sky Harbour planned campus, north side of New York Stewart International Airport (KSWF); parcel/service point unverified',city:'New Windsor',state:'NY',description:'Research-informed future operating-campus illustration. All electricity data is synthetic, with user-imposed 10 MW connection and 6 MW 15-minute peak. Latest Q3 2026 filing lists SWF in development, 8 hangars / 256,240 rentable sqft, timing TBD. Neither the utility connection nor the load is verified.',contact:'',email:'',relationship:'Potential host — not contacted for this analysis',utility:'Unverified; obtain actual service account and approved service limit',fiber:'Not sure',internet:'Not verified',zoning:'Airport land; non-aeronautical use and ground-lease permissions require review',generation:'No onsite PV or existing battery modeled. No electric-aircraft propulsion charging. Heating technology unknown; separate shapes tested.',evidence:'Owner estimate · unverified'};
function randomFactory(seed){return()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};}
function monthly(values,m,day){const n=new Date(Date.UTC(2025,m+1,0)).getUTCDate(),fraction=(day-.5)/n;let a,b,w;if(fraction<.5){a=(m+11)%12;b=m;w=fraction+.5;}else{a=m;b=(m+1)%12;w=fraction-.5;}return values[a]*(1-w)+values[b]*w;}
const nyFormat=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',hourCycle:'h23'});
function localParts(date){const p=Object.fromEntries(nyFormat.formatToParts(date).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));return {month:p.month-1,day:p.day,hour:p.hour+p.minute/60,weekday:new Date(Date.UTC(p.year,p.month-1,p.day)).getUTCDay()};}
export function generateSkyHarbour(profile='electrified'){
 if(!PROFILE_IDS.includes(profile))throw Error('Unknown Sky Harbour profile.');
 const random=randomFactory(ASSUMPTIONS.randomSeed),dates=[],components=[],temp=[],activity=[],dailyNoise=[];let noise=0;
 for(let day=0;day<366;day++){noise=.82*noise+(random()-.5)*8;dailyNoise.push(noise);}
 let recovery=0,ground=0,charge=0;
 for(let i=0;i<35040;i++){
  const stamp=new Date(Date.UTC(2025,0,1)+i*900000),day=Math.floor(i/96),p=localParts(stamp),h=p.hour,business=h>=7&&h<19,weekend=p.weekday===0||p.weekday===6;
  let weather=monthly(CLIMATE_NORMALS.meanF,p.month,p.day)+(monthly(CLIMATE_NORMALS.highF,p.month,p.day)-monthly(CLIMATE_NORMALS.lowF,p.month,p.day))/2*Math.sin(2*Math.PI*(h-9)/24)+dailyNoise[day];
  // Invented, explicitly labeled spells; NOT observed 2025 airport weather.
  if(day>=20&&day<23)weather-=14;if(day>=29&&day<35)weather-=9;if(day>=197&&day<202)weather+=10;if(day>=220&&day<224)weather+=8;
  const morning=Math.exp(-Math.pow((h-8.5)/2,2)),evening=Math.exp(-Math.pow((h-17)/2.5,2));
  // 16 campus door openings/day on average; reduced weekends, with 24/7 tails.
  const openingRate=(.018+.17*morning+.13*evening)*(weekend?.75:1);
  let openings=0;for(let bay=0;bay<8;bay++)if(random()<openingRate)openings++;
  const occupied=business?(weekend?.6:1):.12;
  recovery=recovery*Math.exp(-.25/1.25)+openings*(Math.max(0,55-weather)*9+Math.max(0,weather-72)*11);
  ground=Math.max(0,ground-25)+openings*40;
  charge=Math.max(0,charge-16)+(random()<.07?30:0);
  const base=ASSUMPTIONS.baseSecurityControlsKW;
  const lighting=ASSUMPTIONS.fullHangarLightingKW*(.08+.62*occupied+.15*(h<7||h>=18));
  const offices=ASSUMPTIONS.officeSuiteKW*(.18+.82*occupied);
  const maintenance=100*occupied*(.6+.4*random());
  const doorMotors=openings*ASSUMPTIONS.doorMotorKW*ASSUMPTIONS.doorMotorMinutes/15;
  const aircraftGroundPower=Math.min(8*40,ground);
  const evAndGSE=Math.min(180,charge)+(business&&random()<.18?2*22:0);
  const heating=profile==='non_electric_heat'?Math.max(0,55-weather)*1.5:Math.max(0,55-weather)*42+Math.max(0,15-weather)*100;
  const cooling=Math.max(0,weather-72)*65;
  const humidity=Math.max(0,monthly(CLIMATE_NORMALS.meanF,p.month,p.day)-58)*3;
  const doorConditioning=recovery*(profile==='non_electric_heat'&&weather<55?.05:1);
  let stress=0;if(profile==='persistent_peak'&&(day<60||day>330))stress=(h>=5&&h<23?1900:1400);if(profile==='persistent_peak'&&day>=29&&day<35)stress+=1700;
  components.push({base,lighting,offices,maintenance,doorMotors,aircraftGroundPower,evAndGSE,heating,cooling,humidity,doorConditioning,stress});dates.push(stamp.toISOString());temp.push(weather);activity.push(openings);
 }
 const raw=components.map(c=>Object.values(c).reduce((a,b)=>a+b,0)),rawPeak=raw.reduce((a,b)=>Math.max(a,b),0),factor=6000/rawPeak;
 const load=raw.map(v=>Math.min(6000,Math.round(v*factor*1000000)/1000000));load[raw.indexOf(rawPeak)]=6000;
 const scaledComponents=components.map(c=>Object.fromEntries(Object.entries(c).map(([k,v])=>[k,v*factor])));
 // Deliberate sensitivity overlay: sustained demand, not a measured weather event.
 // Keeps the same 6 MW peak while testing a materially different load duration.
 if(profile==='persistent_peak')for(let i=0;i<load.length;i++){
  const day=Math.floor(i/96),h=localParts(new Date(dates[i])).hour;let floor=0;
  if(day<60||day>330)floor=h>=5&&h<23?5000+250*Math.sin(2*Math.PI*h/24):3900;
  if(day>=29&&day<35)floor=Math.max(floor,5700+200*Math.sin(2*Math.PI*h/24));
  const next=Math.max(load[i],floor);scaledComponents[i].stressOverlay=next-load[i];load[i]=Math.round(next*1000000)/1000000;
 }
 return {data:{load,dates,dt:.25,source:`SYNTHETIC Sky Harbour Stewart | ${PROFILE_NAMES[profile]} | ${GENERATOR_VERSION}`,synthetic:true,assumedDates:false},profile,name:PROFILE_NAMES[profile],generatorVersion:GENERATOR_VERSION,normalizationFactor:factor,unscaledPeakKW:rawPeak,temperatureF:temp,doorOpenings:activity,components:scaledComponents,assumptions:ASSUMPTIONS};
}
export function profileStats(g){const {data}=g,sorted=[...data.load].sort((a,b)=>a-b),sum=data.load.reduce((a,b)=>a+b,0),monthly=[];for(let m=0;m<12;m++){const values=data.load.filter((_,i)=>Number(data.dates[i].slice(5,7))===m+1);monthly.push({month:m+1,energyMWh:values.reduce((a,b)=>a+b,0)*.25/1000,peakMW:Math.max(...values)/1000,meanMW:values.reduce((a,b)=>a+b,0)/values.length/1000});}const totalMWh=sum*.25/1000;return {annualMWh:totalMWh,meanMW:sum/data.load.length/1000,minMW:sorted[0]/1000,peakMW:6,loadFactor:sum/data.load.length/6000,p95MW:sorted[Math.floor(sorted.length*.95)]/1000,p99MW:sorted[Math.floor(sorted.length*.99)]/1000,hoursAbove5MW:data.load.filter(v=>v>5000).length*.25,monthly,componentMWh:Object.fromEntries(Object.keys(g.components[0]).map(k=>[k,g.components.reduce((a,c)=>a+c[k],0)*.25/1000]))};}
