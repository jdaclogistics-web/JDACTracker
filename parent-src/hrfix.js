/* ===== Client CRM / Job-seeker CRM: drag cards between stages (mouse and touch) ===== */
const _crmBoardDD=crmBoard;crmBoard=function(L,stg,kind){let i=0;return _crmBoardDD(L,stg,kind).replace(/<div class="kcol" style="min-height:0">/g,()=>`<div class="kcol crmdrop" style="min-height:0" data-st="${h(stg[i++]||'')}" data-k="${kind}">`).replace('<div class="kb crm">','<div class="kb crm crmdd">')};
(()=>{let d=null;
 document.addEventListener('pointerdown',e=>{const c=e.target.closest('.crmdd .kc[data-a="hrLeadOpen"]');if(!c||e.button>0)return;d={c,x:e.clientX,y:e.clientY,on:false,id:e.pointerId}},true);
 document.addEventListener('pointermove',e=>{if(!d||e.pointerId!==d.id)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;
  if(!d.on){if(Math.hypot(dx,dy)<8)return;if(e.pointerType==='touch'&&Math.abs(dy)>Math.abs(dx)*1.3&&!d.hold){d=null;return}d.on=true;const r=d.c.getBoundingClientRect();d.g=d.c.cloneNode(true);Object.assign(d.g.style,{position:'fixed',left:r.left+'px',top:r.top+'px',width:r.width+'px',zIndex:9999,pointerEvents:'none',transform:'rotate(2deg)',boxShadow:'0 14px 30px rgba(15,23,42,.25)',opacity:.95});d.ox=d.x-r.left;d.oy=d.y-r.top;document.body.appendChild(d.g);d.c.style.opacity=.35}
  e.preventDefault();d.g.style.left=(e.clientX-d.ox)+'px';d.g.style.top=(e.clientY-d.oy)+'px';
  document.querySelectorAll('.crmdrop.over').forEach(x=>x.classList.remove('over'));const t=document.elementFromPoint(e.clientX,e.clientY);const col=t&&t.closest('.crmdrop');if(col)col.classList.add('over');
  const kb=d.c.closest('.kb');if(kb){const r=kb.getBoundingClientRect();if(e.clientX>r.right-40)kb.scrollLeft+=12;else if(e.clientX<r.left+40)kb.scrollLeft-=12}},{passive:false});
 const end=e=>{if(!d||e.pointerId!==d.id)return;const D0=d;d=null;if(!D0.on)return;D0.g.remove();D0.c.style.opacity='';document.querySelectorAll('.crmdrop.over').forEach(x=>x.classList.remove('over'));
  const t=document.elementFromPoint(e.clientX,e.clientY),col=t&&t.closest('.crmdrop');const stop=ev=>{ev.stopPropagation();ev.preventDefault()};document.addEventListener('click',stop,{capture:true,once:true});setTimeout(()=>document.removeEventListener('click',stop,true),300);
  if(!col)return;const k=D0.c.dataset.k,l=LK(k).find(x=>x.id===D0.c.dataset.id),st=col.dataset.st;if(!l||!st||l.st===st)return;
  l.log=l.log||[];l.log.push({at:new Date().toISOString(),by:S.me,t:`Moved ${l.st} → ${st}`});l.st=st;save();render();toast(`${k==='e'?(l.co||l.n):l.n} → ${st}`)};
 document.addEventListener('pointerup',end,true);document.addEventListener('pointercancel',e=>{if(d&&d.on){d.g.remove();d.c.style.opacity=''}d=null},true)})();
document.head.insertAdjacentHTML('beforeend',`<style>.crmdd .kc{touch-action:pan-y;user-select:none;cursor:grab!important}.crmdd .kc:active{cursor:grabbing!important}.crmdrop{transition:background .12s,box-shadow .12s}.crmdrop.over{background:#EEF4FF!important;box-shadow:inset 0 0 0 2px #2F6BE0;border-radius:14px}</style>`);
/* ===== HR Desk: one teal family — full on Attendance & Leave, lighter on Employee Master, lightest on Payroll & Rewards ===== */
document.head.insertAdjacentHTML('beforeend',`<style>
#main .hrg button[data-t="ga"],#main .hrsub button:nth-child(1),#main .hrcard:nth-child(1){--c1:#0B5E58!important;--c2:#14A396!important;--t:#E3F5F2!important;--tx:#fff}
#main .hrg button[data-t="ge"],#main .hrsub button:nth-child(2),#main .hrcard:nth-child(2){--c1:#2B8F86!important;--c2:#55C2B6!important;--t:#EBF8F6!important;--tx:#fff}
#main .hrg button[data-t="gp"],#main .hrsub button:nth-child(3),#main .hrcard:nth-child(3){--c1:#6BBFB6!important;--c2:#9EDCD3!important;--t:#F1FAF8!important;--tx:#0B4A45}
#main .hrsub button:nth-child(4){--c1:#97D3CB!important;--c2:#C4EAE4!important;--t:#F5FCFB!important;--tx:#0B4A45}
#main .hrg button,#main .hrsub button{color:#0B5E58!important}
#main .hrg button.on,#main .hrsub button.on{color:var(--tx)!important}
#main .hrcard b{color:#0B5E58!important}
#main .stats>*:nth-child(n){border-top-color:#14A396!important;background:linear-gradient(180deg,#F0FAF8,#fff)!important}
#main .stats>*:nth-child(2n){border-top-color:#55C2B6!important;background:linear-gradient(180deg,#F5FCFB,#fff)!important}
</style>`);
/* Attendance sheet: compact search beside the Excel button instead of a full-width bar */
const _renderHQ=render;render=function(){const a=document.activeElement,fid=a&&a.id==='aq'?[a.selectionStart,a.selectionEnd]:null;const r=_renderHQ.apply(this,arguments);
 try{if(S.v==='people'){const s=document.querySelector('#main .search input#aq');if(s){const box=s.closest('.search'),row=box.previousElementSibling,x=row&&[...row.querySelectorAll('button')].find(b=>/Excel/.test(b.innerText));if(x){box.classList.add('hrsq');s.placeholder='Search…';x.parentNode.insertBefore(box,x)}if(fid){s.focus();try{s.setSelectionRange(fid[0],fid[1])}catch(e){}}}}}catch(e){}return r};
document.head.insertAdjacentHTML('beforeend',`<style>#main .search.hrsq{margin:0 8px 0 auto!important;width:200px;flex:none;height:40px;border-radius:12px}#main .search.hrsq input{font-size:13.5px}html.mob #main .search.hrsq{width:130px;margin-right:6px!important}</style>`);
/* ===== Add / edit employee: premium teal pop-up · auto ID · designation suggestions · city dropdown · emergency contact ===== */
const EF_CITY=['Pune Camp','Goa','Mumbai'];
const efDesigs=()=>[...new Set(['Customer Success Executive','Customer Success Manager','Operations Executive','Operations Manager','Warehouse Manager','Warehouse Associate','Delivery Associate','Marketing Executive','Performance Marketer','Graphic Designer','Video Editor','HR Executive','HR Manager','Accountant','Accounts Manager','Business Development Executive','Admin Executive',...(D.emp||[]).map(e=>e.desig).filter(Boolean)])].sort();
const efSec=(n,t)=>`</div><div class="pefs"><div class="pcft"><span>${n}</span>${t}</div>`;
const _empFormP=empForm;empForm=function(e){const x=e||{};let o=_empFormP(e);
 const cur=x.city&&!EF_CITY.includes(x.city)?x.city:null,cv=x.city&&EF_CITY.includes(x.city)?x.city:'Pune Camp';
 o=o.replace(/<label>City<\/label><div class="chips[^"]*" id="ef-c"[\s\S]*?<\/div>(?=\s*<label>Shift time)/,`<label for="ef-c2">City / office *</label><select id="ef-c2">${[...EF_CITY,...(cur?[cur]:[])].map(c=>`<option ${c===(cur||cv)?'selected':''}>${h(c)}</option>`).join('')}</select>`);
 o=o.replace('<input id="ef-d" ','<input id="ef-d" list="ef-dl" autocomplete="off" ').replace('placeholder="e.g. Warehouse Incharge">',`placeholder="Start typing… e.g. Cus">`+`<datalist id="ef-dl">${efDesigs().map(d=>`<option value="${h(d)}">`).join('')}</datalist>`);
 o=o.replace('<input id="ef-id" value=','<input id="ef-id" class="efauto" value=').replace('<label for="ef-id">Employee ID</label>','<label for="ef-id">Employee ID <em class="efa">auto</em></label>');
 const emg=`<div class="grid g2"><div><label for="ef-en">Emergency contact person</label><input id="ef-en" value="${h(x.ecn||'')}" placeholder="Name · relation"></div><div><label for="ef-ep">Emergency contact number</label><input id="ef-ep" inputmode="tel" value="${h(x.ecp||'')}" placeholder="+91"></div></div>`;
 o=o.replace('<label>Status</label>',efSec(2,'Employment & contact')+'<label>Status</label>');
 o=o.replace(/(<label for="ef-l">Reports to<\/label><select id="ef-l">[\s\S]*?<\/select><\/div><\/div>)/,`$1${emg}`);
 o=o.replace(/<label for="ef-c2">/,efSec(3,'Location & shift')+'<label for="ef-c2">');
 o=o.replace('<div class="grid g2"><div><label for="ef-s">',efSec(4,'Salary & documents')+'<div class="grid g2"><div><label for="ef-s">');
 return `<div class="pefs"><div class="pcft"><span>1</span>Basic details</div>${o}</div>`};
const efHead=(t,s)=>`<div class="pcf pef"><div class="pcfh"><i>${ic('users')}</i><div><h2>${t}</h2><small>${s}</small></div></div>`;
A.empNew=()=>sheet(`${efHead('Add employee','Employee ID is created automatically')}${empForm()}<p class="xs mut" style="margin:10px 2px">Saving creates their tracker login (mobile + OTP) and sends the onboarding link for bank, PAN, documents and policies.</p><button class="btn w pcfgo" data-a="empSave">${ic('check')}Add employee</button></div>`);
A.empEdit=e=>{const x=D.emp.find(y=>y.id===e.dataset.id);sheet(`${efHead('Edit · '+h(x.n),h(x.id)+' · '+h(x.desig||''))}${empForm(x)}<button class="btn w pcfgo" style="margin-top:12px" data-a="empSave" data-id="${x.id}">${ic('check')}Save changes</button></div>`)};
const _empSaveP=A.empSave;A.empSave=e=>{const g=id=>{const z=document.getElementById(id);return z?z.value.trim():''},city=g('ef-c2'),ecn=g('ef-en'),ecp=g('ef-ep'),id=e.dataset.id,n0=D.emp.length;
 _empSaveP(e);const x=id?D.emp.find(y=>y.id===id):(D.emp.length>n0?D.emp[D.emp.length-1]:null);if(!x)return;if(city)x.city=city;x.ecn=ecn;x.ecp=ecp;
 if(!id&&D.joiners&&D.joiners[0]&&D.joiners[0].n===x.n&&city)D.joiners[0].loc=city;save();render()};
document.head.insertAdjacentHTML('beforeend',`<style>
.pef .pcfh{background:linear-gradient(135deg,#073B37,#0B5E58 55%,#14A396)!important;box-shadow:0 10px 24px rgba(11,94,88,.28)!important}
.pefs{background:linear-gradient(180deg,#FFFFFF,#F6FBFA);border:1px solid #DCEBE8;border-radius:16px;padding:12px 14px 14px;margin-bottom:10px}
.pefs:nth-of-type(odd){background:linear-gradient(180deg,#F4FBFA,#EEF8F6);border-color:#CDE7E2}
.pef .pcft{color:#0B5E58}.pef .pcft span{background:linear-gradient(135deg,#0B5E58,#14A396)}
.pef input:focus,.pef select:focus{border-color:#14A396!important;box-shadow:0 0 0 3px rgba(20,163,150,.15)!important}
.pef select{border-radius:11px!important;border:1px solid #D5DEE8!important;background:#fff!important}
.pef .pcfgo{background:linear-gradient(135deg,#073B37,#0B5E58 50%,#14A396)!important;box-shadow:0 10px 22px rgba(11,94,88,.3)!important}
.efauto{background:#EEF8F6!important;color:#0B5E58!important;font-weight:700;letter-spacing:.04em}
.efa{font-style:normal;font-size:10px;font-weight:700;background:#14A396;color:#fff;border-radius:999px;padding:1px 7px;margin-left:4px;vertical-align:1px}
#main .page-h .btn[data-a="empNew"],#main button[data-a="empNew"]{background:linear-gradient(135deg,#0B5E58,#14A396)!important;border:0!important;box-shadow:0 6px 16px rgba(11,94,88,.25)}
</style>`);
/* People no longer working with JDAC: hidden from New task "Who?" and every assign list */
const GONE2=[...GONE,'jayshree','rehan','raihan'];
const isGone=k=>{const n=((P[k]&&P[k].n)||k||'').toLowerCase().split(' ')[0];return GONE2.includes(String(k).toLowerCase())||GONE2.includes(n)||(D.emp||[]).some(e=>e.k===k&&e.st==='Exited')};
const _assignableG=assignable;assignable=function(){return _assignableG().filter(k=>!isGone(k))};
/* server logins load after start-up, so clear ex-staff from STAFF before every screen draw */
const _renderGone=render;render=function(){try{for(let i=STAFF.length-1;i>=0;i--){const k=STAFF[i];if(!(typeof TOP!=='undefined'&&TOP.includes(k))&&isGone(k))STAFF.splice(i,1)}}catch(e){}return _renderGone.apply(this,arguments)};
