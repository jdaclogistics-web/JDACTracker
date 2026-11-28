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
/* ===== CRM customer pop-up: clearer, more attractive ===== */
const _cmDrawerP=cmDrawer;cmDrawer=function(c){return _cmDrawerP(c)
 .replace('<button class="lnk" style="margin-top:6px" data-a="cmTab" data-t="chat">Open the full WhatsApp chat →</button>',`<button class="cmwa" data-a="cmTab" data-t="chat"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg>Open full WhatsApp chat</button>`)
 .replace('<div class="cmdl">Latest messages</div>','<div class="cmdl">Latest messages</div>')};
document.head.insertAdjacentHTML('beforeend',`<style>
.cmd{border-radius:22px!important;overflow-x:hidden;overflow-y:auto;border:1px solid #E3E8F2!important;box-shadow:0 24px 60px rgba(15,23,42,.18)!important;padding:0!important;background:#fff}
.cmd>*:not(.cmdh){margin-left:16px;margin-right:16px}
.cmdh{background:linear-gradient(135deg,#0F2A5F,#1E3A8A 60%,#2F5BD8);color:#fff;padding:18px 16px!important;margin:0 0 14px!important;position:relative}
.cmdh b{color:#fff;font-size:17px}.cmdh .xs.mut{color:#C9D6F5!important}.cmdh .xs.mut span{color:#fff!important;background:rgba(255,255,255,.16);padding:1px 8px;border-radius:999px;margin-left:2px}
.cmdh .sfav.big{background:#fff!important;color:#1E3A8A!important;box-shadow:0 0 0 3px rgba(255,255,255,.25)}
.cmd .cmdh button.ib{background:rgba(255,255,255,.18)!important;color:#fff!important;border:1px solid rgba(255,255,255,.35)!important;width:34px;height:34px;border-radius:999px!important;font-size:15px}
.cmda{display:grid!important;grid-template-columns:1fr 1fr;gap:8px}
.cmda .btn{height:44px;border-radius:12px!important;font-size:14.5px!important;justify-content:center}
.cmda .btn:first-child{background:linear-gradient(135deg,#15803D,#22C55E)!important;border:0!important;box-shadow:0 6px 14px rgba(34,197,94,.3)}
.cmda .btn.sec{background:#ECFDF3!important;color:#128C7E!important;border:1px solid #A7E9C9!important}
.cmdg{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px!important}
.cmdg label{background:#F6F8FC;border:1px solid #E3E8F2;border-radius:12px;padding:8px 10px;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:#64748B;font-weight:700}
.cmdg select{border:0!important;background:transparent!important;padding:2px 0!important;height:auto!important;font-size:14px!important;font-weight:700;color:#0F172A;text-transform:none;letter-spacing:0;box-shadow:none!important}
.cmdt{display:flex;gap:4px;background:#F1F4FA;border-radius:12px;padding:4px;margin-top:14px!important;border:0!important}
.cmdt button{flex:1;border:0!important;border-radius:9px!important;padding:7px 4px!important;font-size:12.5px!important;color:#475569!important;background:none}
.cmdt button.on{background:#fff!important;color:#1E3A8A!important;box-shadow:0 2px 6px rgba(15,23,42,.1);font-weight:700}
.cmsum{display:grid!important;grid-template-columns:1fr 1fr;gap:8px;background:none!important;padding:0!important;margin-top:12px}
.cmsum>div{display:flex!important;flex-direction:column;gap:3px;background:#F8FAFD;border:1px solid #E8EDF5;border-radius:12px;padding:9px 11px}
.cmsum>div>span{font-size:10.5px!important;letter-spacing:.06em;color:#64748B!important;font-weight:700}
.cmsum>div>div{font-size:13.5px;font-weight:600;color:#0F172A}
.cmsum>div:nth-child(2){grid-column:1/-1}
.cmsum>div:last-child{grid-column:1/-1;background:linear-gradient(135deg,#FFF7ED,#FFEDD5);border-color:#FDBA74}
.cmsum>div:last-child>div{color:#C2410C!important;font-size:14.5px;font-weight:800}
.cmdm{background:#EFEAE2 radial-gradient(rgba(0,0,0,.035) 1px,transparent 1px) 0 0/14px 14px!important;border-radius:14px!important;padding:10px!important}
.cmbb{background:#fff!important;border-radius:10px 10px 10px 2px!important;box-shadow:0 1px 1px rgba(0,0,0,.08)}
.cmbb.me{background:#D9FDD3!important;border-radius:10px 10px 2px 10px!important}
.cmwa{display:flex;align-items:center;justify-content:center;gap:8px;width:calc(100% - 32px);height:46px;margin:12px 16px 16px!important;border:0;border-radius:13px;background:linear-gradient(135deg,#128C7E,#25D366);color:#fff;font:700 14.5px Inter,sans-serif;cursor:pointer;box-shadow:0 8px 18px rgba(37,211,102,.3);transition:transform .12s,filter .12s}
.cmwa:hover{transform:translateY(-1px);filter:brightness(1.05)}
.cmd .cmdl{margin-top:14px!important;font-size:10.5px;letter-spacing:.07em;color:#64748B}
</style>`);
/* Dashboard: faint JDAC "The Logistics Aggregator" logo watermark in the background */
document.documentElement.style.setProperty('--jdwm',`url("${JLOGO}")`);
const _renderWM=render;render=function(){const r=_renderWM.apply(this,arguments);try{document.body.classList.toggle('jdwm',S.v==='home')}catch(e){}return r};
document.head.insertAdjacentHTML('beforeend',`<style>
body.jdwm #main{position:relative;isolation:isolate}
body.jdwm #main::before{content:'';position:fixed;z-index:30;mix-blend-mode:multiply;pointer-events:none;left:calc(50% + 125px);top:52%;width:min(620px,56vw);aspect-ratio:480/144;transform:translate(-50%,-50%) rotate(-12deg);background:var(--jdwm) center/contain no-repeat;opacity:.05;filter:grayscale(.2)}
html.mob body.jdwm #main::before{left:50%;width:82vw;opacity:.06}
</style>`);
