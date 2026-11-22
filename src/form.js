const form = document.querySelector('#site-form');
const steps = [...form.querySelectorAll('[data-step]')];
const labels = [...form.querySelectorAll('[data-step-label]')];
const next = document.querySelector('#next');
const back = document.querySelector('#back');
const submit = document.querySelector('#submit');
const error = document.querySelector('#form-error');
let step = 0;
document.querySelector('#submissionId').value = crypto.randomUUID();
document.querySelector('#startedAt').value = String(Date.now());
function showStep(n, focus = true) {
  step = n; steps.forEach((el, i) => {el.hidden = i !== n; el.disabled = i !== n;});
  labels.forEach((el, i) => {el.classList.toggle('complete', i < n); if(i === n) el.setAttribute('aria-current','step'); else el.removeAttribute('aria-current');});
  back.hidden = n === 0; next.hidden = n === 2; submit.hidden = n !== 2;
  document.querySelector('.form-actions').classList.toggle('single', n === 0);
  error.hidden = true;
  if(n === 2) {
    const review = document.querySelector('#review'); review.replaceChildren();
    const dl = document.createElement('dl'); dl.style.margin='0';
    for(const [title,value] of [['Site', document.querySelector('#location').value + ', ' + document.querySelector('#country').value],['Power',document.querySelector('#availablePower').value],['Timing',document.querySelector('#timeline').value]]) {
      const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=title;dd.textContent=value;dl.append(dt,dd);
    } review.append(dl);
  }
  if(focus) {const legend=steps[n].querySelector('legend');legend.tabIndex=-1;legend.focus({preventScroll:true}); form.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
}
function validateStep(){for(const field of steps[step].querySelectorAll('input,select,textarea')) if(!field.reportValidity()) return false;return true;}
next.addEventListener('click',()=>{if(validateStep())showStep(step+1);});
back.addEventListener('click',()=>showStep(step-1));
form.addEventListener('keydown',e=>{if(e.key==='Enter' && e.target.tagName!=='TEXTAREA' && e.target.tagName!=='BUTTON' && e.target.tagName!=='A' && step<2){e.preventDefault();next.click();}});
form.addEventListener('submit',async e=>{
  e.preventDefault(); if(step!==2){next.click();return;} if(!validateStep())return;
  steps.forEach(el=>el.disabled=false); const data=Object.fromEntries(new FormData(form)); steps.forEach((el,i)=>el.disabled=i!==step);
  submit.disabled=true;back.disabled=true;submit.textContent='Saving your site…';error.hidden=true;
  try {
    const response=await fetch('/api/submissions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(20000)});
    const result=await response.json(); if(!response.ok)throw new Error(result.error||'We could not save your submission. Please try again.');
    form.hidden=true;document.querySelector('#success').hidden=false;document.querySelector('#reference').textContent='Reference: '+result.reference;
    const heading=document.querySelector('#success h2');heading.tabIndex=-1;heading.focus();
  }catch(err){error.textContent=err.name==='TimeoutError'?'The connection timed out. Please try again; your submission reference will stay the same.':err.message||'Connection failed. Please try again.';error.hidden=false;}
  finally{submit.disabled=false;back.disabled=false;submit.textContent='Submit your site';}
});
showStep(0,false);
