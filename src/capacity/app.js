const $=s=>document.getElementById(s);
const numeric=['lowPct','lowHours','targetDays','capacity','future','growth','margin','pue','normalPct','highPct','normalHours','highHours','efficiency','depth','retention','energyRate','demandRate','rent','occupancy','dcCapex','battEnergy','battPower','battFixed','battOM','opex','lease','enabling','years','discount','refreshYear','refreshPct','alternative','delay'];
const metadata=['siteName','address','city','state','description','contact','email','relationship','utility','fiber','internet','zoning','generation','evidence'];
let data=synthetic(),result=null,lastParams=null,lastMetadata=null,dirty=false;
const fmt=(v,n=2)=>Number(v).toLocaleString('en-US',{maximumFractionDigits:n,minimumFractionDigits:n});
const money=v=>v===null?'Needs full year':`${v<0?'−':''}$${Math.abs(v).toLocaleString('en-US',{maximumFractionDigits:0})}`;
const mw=v=>`${fmt(v/1000,3)} MW`;
function saveFile(name,text,type='text/plain'){const u=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function params(){return Object.fromEntries(numeric.map(k=>[k,Number($(k).value)]));}
function meta(){return Object.fromEntries(metadata.map(k=>[k,$(k).value]));}
function escape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fail(e){$('error').textContent=e.message||String(e);$('error').hidden=false;}
function markDirty(){dirty=true;$('dirty').textContent='Inputs changed · evaluate to refresh results';$('dirty').style.color='#aa5039';}
async function evaluate(){
  const button=$('inputs').querySelector('button[type="submit"]');button.disabled=true;
  try{const p=params();for(const k of ['years','refreshYear','delay'])if(!Number.isInteger(p[k]))throw Error(`${k} must be a whole number.`);
    const preview=analyze(data,p),m=meta();workspaceMessage('Running analysis and saving its input snapshot…');const run=await saveWorkflow(p,m);
    result=frozenResult(preview,run);lastParams=p;lastMetadata=m;dirty=false;$('dirty').textContent='Saved run · '+run.id.slice(0,8);$('dirty').style.color='';$('error').hidden=true;render();
    await loadCompanies();await loadRuns(false);workspaceMessage('Saved '+run.inputs.companyName+' / '+run.title+' · '+new Date(run.created_at).toLocaleString());
  }catch(e){markDirty();fail(e);workspaceMessage(e.message,true);}finally{button.disabled=false;}
}
function render(){
  const r=result,p=r.p,s=r.scenarios,m=lastMetadata;
  $('resultTitle').textContent=m.siteName||'Untitled site';
  $('coverage').textContent=`${fmt(r.hours,0)} hours · ${data.dt*60}-minute intervals`;
  const warnings=[];
  if(r.synthetic)warnings.push('SYNTHETIC EXAMPLE — these results do not describe a real site.');
  warnings.push(`${fmt(p.targetDays,1)}% daily headroom-coverage target. Grid outages, battery failures, other downtime and SLA credits are not simulated.`);
  if(!r.annual)warnings.push('Financial outputs require a continuous year aligned to a UTC calendar-month boundary. Capacity applies only to supplied intervals; incomplete or misaligned profiles do not establish annual capacity.');
  if(r.assumedDates)warnings.push('No timestamps: UTC dates assumed from January 1, 2025. Calendar-month billing is approximate.');
  warnings.push(`Capacity evidence: ${m.evidence}. Space, fiber, zoning, utility permissions, and electrical design remain separate checks.`);
  $('notice').textContent=warnings.join(' ');
  $('limitMetric').textContent=mw(p.capacity);$('gapMetric').textContent=mw(r.minRaw);$('upliftMetric').textContent=`+${fmt((s[3].it-s[0].it)/1000,3)} MW`;
  $('dataStatus').textContent=`${data.source} · ${data.load.length.toLocaleString()} readings · ${fmt(r.hours,0)} hours`;
  const best=s.reduce((a,b)=>b.residual!==null&&b.residual>a.residual?b:a,s[0]);
  $('cards').innerHTML=s.map((v,i)=>`<article class="scenario ${v===best?'selected':''}"><div class="top"><strong>${v.name}</strong>${v===best&&r.annual?'<span class="tag">Highest modeled NPV</span>':''}</div><div class="body"><div class="capacity">${fmt(v.it/1000,3)} <span>MW IT</span></div><p>${fmt(p.targetDays,1)}% days target · ${mw(v.facility)} facility</p><dl><div><dt>100% headroom-coverage IT</dt><dd>${mw(v.firmIT)}</dd></div><div><dt>Days fully served</dt><dd>${v.dispatch.days-v.dispatch.badDays} / ${v.dispatch.days}</dd></div><div><dt>Hours with insufficient power</dt><dd>${fmt(v.dispatch.shortfallHours,2)}</dd></div><div><dt>Battery power / energy</dt><dd>${i?`${fmt(v.power/1000,2)} MW / ${fmt(v.energy/1000,2)} MWh`:'None'}</dd></div><div><dt>Battery installed cost</dt><dd>${money(v.battCapex)}</dd></div><div><dt>Upfront rights budget</dt><dd class="${v.residual<0?'negative':''}">${money(v.residual)}</dd></div><div><dt>Versus no-battery NPV</dt><dd class="${v.residual!==null&&v.residual-s[0].residual<0?'negative':''}">${r.annual?money(v.residual-s[0].residual):'Needs full year'}</dd></div></dl></div></article>`).join('');
  const rows=[['IT capacity · chosen days target',v=>mw(v.it)],['IT capacity · 100% interval coverage',v=>mw(v.firmIT)],['Fully served days / total days',v=>`${v.dispatch.days-v.dispatch.badDays} / ${v.dispatch.days}`],['Fully served days · %',v=>fmt(v.dispatch.dayCoverage,3)+'%'],['Intervals fully served · % of hours',v=>fmt(v.dispatch.hourCoverage,3)+'%'],['Hours with insufficient power',v=>fmt(v.dispatch.shortfallHours,2)],['Longest continuous shortfall · h',v=>fmt(v.dispatch.longestHours,2)],['Unserved facility energy · MWh',v=>fmt(v.dispatch.unmetEnergy/1000,3)],['Maximum shortfall · MW',v=>fmt(v.dispatch.maxShortfall/1000,3)],['Total DC facility load',v=>mw(v.facility)],['Battery nameplate / usable energy',v=>`${fmt(v.energy/1000,2)} / ${fmt(v.usable/1000,2)} MWh`],['Battery charge / discharge energy',v=>`${fmt(v.dispatch.charge/1000,1)} / ${fmt(v.dispatch.discharge/1000,1)} MWh`],['Equivalent usable-window cycles in profile',v=>fmt(v.cycles,1)],['DC + battery + enabling capex',v=>money(v.initial)],['Incremental power bill · supplied profile',v=>money(v.bill)],['Annual lease revenue',v=>money(v.revenue)],['Annual operating cash',v=>money(v.cash)],['Residual upfront rights budget',v=>money(v.residual)],['Advantage vs delayed alternative',v=>money(v.speedAdvantage)]];
  $('comparison').innerHTML=rows.map(([k,f])=>`<tr><td>${k}</td>${s.map(v=>`<td>${f(v)}</td>`).join('')}</tr>`).join('');
  draw();
}
function draw(){if(!result)return;const c=$('chart'),rect=c.getBoundingClientRect(),ratio=window.devicePixelRatio||1;const w=Math.max(250,rect.width),h=250;c.width=w*ratio;c.height=h*ratio;const ctx=c.getContext('2d');ctx.scale(ratio,ratio);ctx.clearRect(0,0,w,h);
  const si=Number($('chartScenario').value),s=result.scenarios[si],n=data.load.length,peak=result.adjusted.reduce((best,v,i)=>v>result.adjusted[best]?i:best,0),week=Math.min(n,Math.round(168/data.dt)),start=Math.max(0,Math.min(n-week,peak-Math.round(72/data.dt))),end=Math.min(n,start+week);
  const l=48,t=20,b=33,r=15,pw=w-l-r,ph=h-t-b;
  let ymax=Math.max(s.facility,...result.available.slice(start,end))*1.12;if(ymax<1)ymax=1;
  const x=i=>l+(i-start)/(end-start-1||1)*pw,y=v=>t+ph-v/ymax*ph;
  ctx.font='10px system-ui';ctx.strokeStyle='#e5ebe5';ctx.fillStyle='#637477';
  for(let j=0;j<=4;j++){const v=ymax*j/4,yy=y(v);ctx.beginPath();ctx.moveTo(l,yy);ctx.lineTo(w-r,yy);ctx.stroke();ctx.fillText(fmt(v/1000,1),7,yy+3);}
  ctx.fillText('MW',8,11);
  const bar=Math.max(1,pw/(end-start)*.8);
  for(let i=start;i<end;i++){const row=s.dispatch.rows[i];if(row.unmet>0.0001){ctx.fillStyle='#c74a4a22';ctx.fillRect(x(i),t,bar,ph);}if(row.discharge>0){ctx.fillStyle='#ca814e88';ctx.fillRect(x(i),y(row.discharge),bar,y(0)-y(row.discharge));}if(row.charge>0){ctx.fillStyle='#72a6ba66';ctx.fillRect(x(i),y(row.charge),bar,y(0)-y(row.charge));}}
  const line=(values,color,dash=[])=>{ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=1.6;ctx.setLineDash(dash);for(let i=start;i<end;i++){i===start?ctx.moveTo(x(i),y(values(i))):ctx.lineTo(x(i),y(values(i)));}ctx.stroke();ctx.setLineDash([]);};
  line(i=>result.available[i],'#238467');line(()=>s.facility,'#152d34',[5,4]);
  ctx.fillStyle='#637477';for(let j=0;j<4;j++){let i=Math.round(start+(end-start-1)*j/3);const d=new Date(data.dates[i]);let text=d.toLocaleString('en-US',{month:'short',day:'numeric',timeZone:'UTC'});ctx.fillText(text,l+(pw-45)*j/3,h-10);}
  $('chartCaption').textContent=`${s.name} · ${new Date(data.dates[start]).toLocaleDateString('en-US',{timeZone:'UTC'})} onward (UTC). Starting / ending stored energy across the full profile: ${fmt(s.dispatch.start/1000,3)} / ${fmt(s.dispatch.end/1000,3)} MWh. Usable energy: ${fmt(s.usable/1000,3)} MWh.`;
}
$('inputs').addEventListener('submit',e=>{e.preventDefault();evaluate();});
$('inputs').addEventListener('input',markDirty);$('inputs').addEventListener('change',markDirty);
$('csv').addEventListener('change',async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>15000000)throw Error('Please use a CSV smaller than 15 MB.');data=parseCSV(await f.text(),Number($('interval').value),$('units').value);data.source=f.name;W.datasetId='';W.saved=null;W.pending=null;W.dataReady=true;$('datasetPicker').value='';$('datasetLabel').value=f.name;$('dataStatus').textContent=`Loaded ${f.name} · ${data.load.length} readings. Evaluate to save.`;markDirty();}catch(err){fail(err);}});
$('demo').onclick=()=>{data=synthetic();$('interval').value='1';$('units').value='kW';$('csv').value='';W.datasetId='';W.saved=null;W.pending=null;W.dataReady=true;$('datasetPicker').value='';$('datasetLabel').value='Synthetic example';$('dataStatus').textContent='Synthetic example loaded. Evaluate to save a labeled demo run.';markDirty();};
$('template').onclick=()=>saveFile('nook-load-format.csv','timestamp,load_kw\n2025-01-01T00:00:00Z,1200\n2025-01-01T01:00:00Z,1250\n2025-01-01T02:00:00Z,1180\n','text/csv');
$('chartScenario').onchange=draw;window.addEventListener('resize',draw);
function ensureFresh(){if(dirty){workspaceMessage("Evaluate and save the changed inputs before exporting this result.",true);return false;}return !!result;}
$('export').onclick=()=>{if(!ensureFresh())return;saveFile('nook-site-project.json',JSON.stringify({schema:'nook-capacity-lab/1.2',batteryBasis:'it_load',exportedAt:new Date().toISOString(),notice:'Contains site details and full electricity load profile. Share only with intended reviewers.',metadata:lastMetadata,parameters:lastParams,data},null,2),'application/json');};
$('projectFile').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>20000000)throw Error('Project is too large.');const o=JSON.parse(await f.text());if(!['nook-capacity-lab/1','nook-capacity-lab/1.1','nook-capacity-lab/1.2'].includes(o.schema)||!Array.isArray(o.data?.load)||o.data.load.length>110000)throw Error('Unsupported project file.');if(o.schema!=='nook-capacity-lab/1.2'){o.parameters={...o.parameters,lowPct:10,normalPct:25,highPct:50,lowHours:4,normalHours:4,highHours:4,targetDays:o.parameters?.targetDays??100};o.data.source=String(o.data.source||'Imported project')+' · migrated to 4h / IT-relative battery defaults';}else if(o.batteryBasis!=='it_load')throw Error('Project battery sizing basis must be it_load.');validate(o.parameters);if(![1,.5,.25,1/12].includes(o.data.dt)||o.data.load.length*o.data.dt>8800)throw Error('Invalid project intervals.');if(o.data.dates?.length!==o.data.load.length)throw Error('Invalid project dates.');for(let i=0;i<o.data.dates.length;i++){let ts=Date.parse(o.data.dates[i]);if(!Number.isFinite(ts)||(i&&Math.abs(ts-Date.parse(o.data.dates[i-1])-o.data.dt*3600000)>1000))throw Error('Project timestamps are irregular.');}
  for(const k of numeric)$(k).value=o.parameters[k];for(const k of metadata)if(typeof o.metadata?.[k]==='string')$(k).value=o.metadata[k];data=o.data;W.datasetId="";W.saved=null;W.pending=null;W.dataReady=true;markDirty();workspaceMessage("Project loaded. Choose a company and evaluate to save a new run.");
}catch(err){fail(err);}};
$('print').onclick=()=>{if(ensureFresh())window.print();};
$('comparisonExport').onclick=()=>{if(!ensureFresh())return;const q=v=>'"'+String(v).replaceAll('"','""')+'"';const rows=[['Nook Capacity Lab v1.2',lastMetadata.siteName],['Profile',data.source],['Evidence',lastMetadata.evidence],['Hours',result.hours],['Synthetic',data.synthetic],['Metric',...result.scenarios.map(s=>s.name)],...Array.from($('comparison').rows).map(tr=>Array.from(tr.cells).map(td=>td.textContent)),[],['Assumptions'],...Object.entries(lastParams)];saveFile('nook-capacity-comparison.csv',rows.map(r=>r.map(q).join(',')).join('\n'),'text/csv');};

$('dispatchExport').onclick=()=>{if(!ensureFresh())return;const s=result.scenarios[Number($('chartScenario').value)],rows=[['timestamp_utc','adjusted_host_kw','usable_headroom_kw','dc_target_kw','battery_charge_kw','battery_discharge_kw','stored_energy_kwh','unserved_dc_kw','project_grid_kw','total_site_grid_kw']];for(let i=0;i<data.load.length;i++){let r=s.dispatch.rows[i];rows.push([data.dates[i],result.adjusted[i],result.available[i],s.facility,r.charge,r.discharge,r.soc,r.unmet,r.grid,result.adjusted[i]+r.grid]);}saveFile('nook-interval-dispatch.csv',rows.map(r=>r.join(',')).join('\n'),'text/csv');};
