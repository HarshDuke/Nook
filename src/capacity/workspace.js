// Persistent company/site/dataset/run workflow. No AI service or API key required.
const W={companyId:'',siteId:'',datasetId:'',detail:null,companies:[],runs:[],selected:new Map(),nextOffset:null,pending:null,saved:null,dataReady:false,key:sessionStorage.getItem('nook-capacity-key')||''};
async function api(path,options={}){
 const response=await fetch('/api/capacity'+path,{...options,headers:{...(options.body?{'content-type':'application/json'}:{}),...(W.key?{authorization:'Bearer '+W.key}:{}),...options.headers}});
 let out;try{out=await response.json();}catch{throw Error('The server returned an unreadable response.');}
 if(!response.ok){if(response.status===401)$('accessPanel').hidden=false;throw Error(out.error||'Workspace request failed.');}
 return out;
}
function workspaceMessage(text,error=false){$('workspaceState').textContent=text;$('workspaceState').classList.toggle('negative',error);}
async function loadCompanies(){const out=await api('/companies');W.companies=out.companies;$('companyPicker').innerHTML='<option value="">Choose a company…</option>'+W.companies.map(c=>`<option value="${c.id}">${escape(c.name)} (${c.run_count} runs)</option>`).join('');$('companyPicker').value=W.companyId;$('accessPanel').hidden=true;workspaceMessage(`${W.companies.length} companies · records are saved in the workspace database.`);}
async function loadCompany(id){W.companyId=id;W.siteId='';W.datasetId='';W.detail=null;W.pending=null;W.saved=null;W.dataReady=false;markDirty();if(id){W.detail=await api('/companies/'+id);$('companyPicker').value=id;}$('sitePicker').innerHTML='<option value="">New site (use the site name below)</option>'+(W.detail?.sites||[]).map(s=>`<option value="${s.id}">${escape(s.name)}</option>`).join('');$('datasetPicker').innerHTML='<option value="">New dataset — upload CSV or use example</option>';await loadRuns(false);}
function siteDatasets(){const datasets=(W.detail?.datasets||[]).filter(d=>d.site_id===W.siteId);$('datasetPicker').innerHTML='<option value="">New dataset — upload CSV or use example</option>'+datasets.map(d=>`<option value="${d.id}">${escape(d.label)} · ${d.row_count} readings${d.synthetic?' · SYNTHETIC':''}</option>`).join('');$('datasetPicker').value=W.datasetId;}
async function refreshCompany(){if(!W.companyId)return;W.detail=await api('/companies/'+W.companyId);$('sitePicker').innerHTML='<option value="">New site (use the site name below)</option>'+W.detail.sites.map(s=>`<option value="${s.id}">${escape(s.name)}</option>`).join('');$('sitePicker').value=W.siteId;siteDatasets();}
async function loadRuns(append=false){const companyId=$('allCompanies').checked?'':W.companyId;if(!companyId&&!$('allCompanies').checked){W.runs=[];W.nextOffset=null;renderHistory();return;}const out=await api('/runs?'+new URLSearchParams({...companyId?{companyId}:{},offset:append?W.nextOffset||0:0}));W.runs=append?[...W.runs,...out.runs]:out.runs;W.nextOffset=out.nextOffset;renderHistory();}
function renderHistory(){
 $('historyRows').innerHTML=W.runs.map(r=>`<tr><td><input type="checkbox" aria-label="Compare ${escape(r.title)}" data-compare="${r.id}" ${W.selected.has(r.id)?'checked':''}></td><td><button class="text-button" data-open="${r.id}">${escape(r.title)}</button><br><small>${escape(r.company_name)} / ${escape(r.site_name)}</small><br><small>${new Date(r.created_at).toLocaleString()}</small></td>${r.report.scenarios.map(s=>`<td>${fmt(s.it/1000,3)}</td>`).join('')}<td>${r.report.annual?money(Math.max(...r.report.scenarios.map(s=>s.residual))):'Partial profile'}</td></tr>`).join('')||'<tr><td colspan="7">No saved analyses yet. Choose a company, upload a profile and evaluate.</td></tr>';
 $('moreRuns').hidden=W.nextOffset===null;$('historyCount').textContent=`${W.runs.length} saved runs shown`;
 for(const b of $('historyRows').querySelectorAll('[data-open]'))b.onclick=()=>openRun(b.dataset.open).catch(e=>workspaceMessage(e.message,true));
 for(const c of $('historyRows').querySelectorAll('[data-compare]'))c.onchange=()=>{const id=c.dataset.compare;if(c.checked){if(W.selected.size>=4){c.checked=false;workspaceMessage('Compare up to four runs at once.',true);return;}W.selected.set(id,W.runs.find(r=>r.id===id));}else W.selected.delete(id);renderRunComparison();};
}
function renderRunComparison(){const runs=[...W.selected.values()];$('runComparison').hidden=!runs.length;$('compareCount').textContent=`${runs.length} selected`;if(!runs.length)return;
 const rows=[['Company',r=>escape(r.company_name)],['Site',r=>escape(r.site_name)],['Connection · MW',r=>fmt(r.report.p.capacity/1000,3)],['Daily coverage target',r=>fmt(r.report.p.targetDays,1)+'%'],...['No battery','Low','Moderate','High'].map((name,i)=>[name+' · MW IT',r=>fmt(r.report.scenarios[i].it/1000,3)]),...['No battery','Low','Moderate','High'].map((name,i)=>[name+' · rights budget',r=>money(r.report.scenarios[i].residual)])];
 $('compareTable').innerHTML='<thead><tr><th>Metric</th>'+runs.map(r=>`<th>${escape(r.title)}</th>`).join('')+'</tr></thead><tbody>'+rows.map(([k,f])=>`<tr><td>${k}</td>${runs.map(r=>`<td>${f(r)}</td>`).join('')}</tr>`).join('')+'</tbody>';
}
async function saveWorkflow(parameters,metadata){
 if(!W.companyId)throw Error('Create or choose a company before saving an analysis.');if(!W.dataReady)throw Error('Choose a saved dataset, upload a CSV, or explicitly load the synthetic example for this site.');
 const title=$('runTitle').value.trim();if(!title)throw Error('Give this run a title, such as “Initial screen” or “2026 profile”.');
 if(!W.siteId){const name=metadata.siteName.trim();if(!name)throw Error('Enter a site name.');const out=await api('/companies/'+W.companyId+'/sites',{method:'POST',body:JSON.stringify({name,metadata})});W.siteId=out.site.id;await refreshCompany();}
 if(!W.datasetId){const out=await api('/companies/'+W.companyId+'/datasets',{method:'POST',body:JSON.stringify({siteId:W.siteId,label:$('datasetLabel').value.trim()||data.source,data})});W.datasetId=out.dataset.id;await refreshCompany();}
 const body={siteId:W.siteId,datasetId:W.datasetId,title,notes:$('runNotes').value,parameters,metadata},key=JSON.stringify(body);if(W.pending?.key!==key)W.pending={key,id:crypto.randomUUID()};
 const out=await api('/companies/'+W.companyId+'/runs',{method:'POST',body:JSON.stringify({...body,requestId:W.pending.id})});W.pending=null;W.saved=out.run;return out.run;
}
function frozenResult(preview,run){if(run.model_version!=='1.2.0')throw Error('This run uses a different model version. Its saved report remains available through Export run JSON.');return {...preview,...run.report,scenarios:run.report.scenarios.map((s,i)=>({...s,dispatch:{...s.dispatch,rows:preview.scenarios[i].dispatch.rows}}))};}
async function openRun(id){
 const {run}=await api('/runs/'+id);await loadCompany(run.company_id);W.siteId=run.site_id;W.datasetId=run.dataset_id;W.saved=run;await refreshCompany();
 const out=await api('/datasets/'+run.dataset_id);data=out.data;W.dataReady=true;for(const k of numeric)$(k).value=run.inputs.parameters[k];for(const k of metadata)$(k).value=run.inputs.metadata[k]||'';
 $('runTitle').value=run.title;$('runNotes').value=run.notes;$('datasetLabel').value=run.inputs.datasetLabel;$('interval').value=data.dt;$('units').value='kW';
 result=frozenResult(analyze(data,run.inputs.parameters),run);lastParams=run.inputs.parameters;lastMetadata=run.inputs.metadata;dirty=false;render();$('dirty').textContent='Viewing saved run · evaluating again creates a new run';$('dirty').style.color='';workspaceMessage(`Opened ${run.inputs.companyName} / ${run.title} · ${new Date(run.created_at).toLocaleString()}. Original result preserved.`);$('resultTitle').scrollIntoView({behavior:'smooth',block:'start'});
}
$('createCompany').onclick=async()=>{try{const out=await api('/companies',{method:'POST',body:JSON.stringify({name:$('newCompany').value})});await loadCompanies();await loadCompany(out.company.id);$('newCompany').value='';workspaceMessage('Company created. Add its site and load data below.');}catch(e){workspaceMessage(e.message,true);}};
$('companyPicker').onchange=e=>loadCompany(e.target.value).catch(e=>workspaceMessage(e.message,true));
$('sitePicker').onchange=e=>{W.siteId=e.target.value;W.datasetId='';W.pending=null;W.saved=null;W.dataReady=false;const site=W.detail?.sites.find(s=>s.id===W.siteId);if(site)for(const k of metadata)$(k).value=site.metadata[k]||'';else $('siteName').value='';siteDatasets();markDirty();};
$('datasetPicker').onchange=async e=>{try{W.datasetId=e.target.value;W.pending=null;W.dataReady=false;if(W.datasetId){const out=await api('/datasets/'+W.datasetId);data=out.data;W.dataReady=true;$('datasetLabel').value=out.dataset.label;$('interval').value=data.dt;$('units').value='kW';$('dataStatus').textContent=`Loaded saved dataset: ${out.dataset.label} · ${data.load.length} readings`;}markDirty();}catch(err){workspaceMessage(err.message,true);}};
$('allCompanies').onchange=()=>loadRuns(false).catch(e=>workspaceMessage(e.message,true));
$('moreRuns').onclick=()=>loadRuns(true).catch(e=>workspaceMessage(e.message,true));
$('clearComparison').onclick=()=>{W.selected.clear();renderHistory();renderRunComparison();};
$('unlockForm').onsubmit=async e=>{e.preventDefault();W.key=$('accessKey').value;try{await loadCompanies();sessionStorage.setItem('nook-capacity-key',W.key);$('accessKey').value='';await loadRuns();}catch(err){workspaceMessage(err.message,true);}};
$('logout').onclick=()=>{W.key='';sessionStorage.removeItem('nook-capacity-key');location.reload();};
for(const id of ['runTitle','runNotes','datasetLabel'])$(id).addEventListener('input',markDirty);
$('exportRun').onclick=()=>{if(!W.saved){workspaceMessage('Open or save an analysis first.',true);return;}saveFile('nook-run-'+W.saved.id+'.json',JSON.stringify({schema:'nook-capacity-run/1',...W.saved},null,2),'application/json');};
async function startWorkspace(){
 // The example is a visual preview, never an automatically saved customer run.
 try{lastParams=params();lastMetadata=meta();result=analyze(data,lastParams);render();markDirty();await loadCompanies();await loadRuns();}catch(e){workspaceMessage(e.message,true);}
}
startWorkspace();
