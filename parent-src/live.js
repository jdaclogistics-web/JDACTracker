/* ===================== LIVE MODE · real login + real staff & attendance from the tracker database =====================
   Runs only on the real website (github.io). The claude.ai preview keeps sample data. */
const LIVE=/github\.io$|^localhost$|^127\./.test(location.hostname);
const API='https://jdac-tracker-api.jdaclogistics.workers.dev';
const LV={tok:null,me:null,ok:false,err:'',busy:false,at:null};
try{LV.tok=localStorage.getItem('jdac_token');LV.me=JSON.parse(localStorage.getItem('jdac_me')||'null')}catch(x){}
async function lapi(m,p,b){const r=await fetch(API+p,{method:m,headers:{'Content-Type':'application/json',...(LV.tok?{Authorization:'Bearer '+LV.tok}:{})},body:b?JSON.stringify(b):undefined});const d=await r.json().catch(()=>({}));if(r.status===401&&p!=='/api/login'){lvOut(true);throw new Error('Login expired — please log in again')}if(!r.ok)throw new Error(d.error||('Error '+r.status));return d}
function lvOut(quiet){LV.tok=null;LV.me=null;LV.ok=false;try{localStorage.removeItem('jdac_token');localStorage.removeItem('jdac_me')}catch(x){}if(!quiet)render()}
const istHM=s=>{if(!s)return'';const d=new Date(s);return d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Kolkata'})};
const lvNorm=s=>String(s||'').toLowerCase().replace(/[^a-z ]/g,' ').replace(/\s+/g,' ').trim();
function lvKey(e){const n=lvNorm(e.name),f=n.split(' ')[0];let k=Object.keys(P).find(k=>lvNorm(P[k].n)===n);if(!k)k=Object.keys(P).find(k=>n.startsWith(lvNorm(P[k].n))&&lvNorm(P[k].n).length>2);if(!k){const c=Object.keys(P).filter(k=>lvNorm(P[k].n).split(' ')[0]===f&&P[k].kind!=='ext');if(c.length===1)k=c[0]}
 if(!k){k='u'+e.id;P[k]={n:e.name,r:e.designation||'',team:e.department||e.team||'Office',kind:'staff',work:[]};if(!STAFF.includes(k))STAFF.push(k)}
 if(e.role==='boss'||e.role==='developer')P[k].kind='boss';else if(e.role==='hr')P[k].kind='hr';
 P[k].rid=e.id;if(e.designation)P[k].r=e.designation;return k}
const MK={Present:'P','Half Day':'HD',Absent:'A',Leave:'L','Week Off':'WO'};
function lvEmp(e){const k=lvKey(e),old=(D.emp||[]).find(x=>x.rid===e.id)||{};const st=e.status==='Dropped'||e.exit_date&&e.exit_date<TODAY?'Exited':e.active?'Active':'Inactive';
 return Object.assign({},old,{id:e.emp_code||('ID'+e.id),rid:e.id,k,n:e.name,unit:e.department||e.team||'—',st,desig:e.designation||'—',doj:e.joining_date||'2025-01-01',dox:e.exit_date||'',ph:e.phone?'+91 '+e.phone:'—',time:(e.shift_start||'10:00')+' – '+(e.shift_end||'19:00'),shift:e.shift_start||'10:00',city:e.work_location||(e.team==='Warehouse'?'Warehouse':'Office'),sal:e.salary_inhand,offer:e.offer_letter||'Pending',appt:e.appointment_letter||'Pending',docs:e.documents||'Pending',login:e.device_linked?'Logged in':'Not yet',team:e.team,lead:'nameera',wo:old.wo!=null?old.wo:0})}
function lvFill(E,mon,ses,marks,leaves){const [y,m]=mon.split('-').map(Number),dim=new Date(y,m,0).getDate();
 const S2=new Map(ses.map(s=>[s.emp_id+'|'+s.date,s])),M2=new Map(marks.map(x=>[x.emp_id+'|'+x.date,x.status])),L2=new Map(leaves.map(x=>[x.emp_id+'|'+x.date,x]));
 E.forEach(e=>{const ax=D.attx[e.id]=D.attx[e.id]||{};for(let d=1;d<=dim;d++){const ds=mon+'-'+String(d).padStart(2,'0');if(ds>=TODAY)break;if(ds<e.doj||(e.dox&&ds>e.dox)){delete ax[ds];continue}
  const k=e.rid+'|'+ds,mk=M2.get(k),s=S2.get(k);let c=mk?MK[mk]:L2.get(k)?'L':s?'P':(new Date(ds+'T12:00:00').getDay()===woDay(e)?'WO':'NR');ax[ds]=c;
  if(s){D.attIn=D.attIn||{};D.attIn[e.id+'|'+ds]=istHM(s.start_at)}}})}
async function lvLoad(){LV.busy=true;LV.err='';render();try{
 const me=LV.me,adm=['boss','hr','developer'].includes(me.role),mons=[0,1,2].map(i=>{const d=new Date(TODAY+'T12:00:00');d.setDate(1);d.setMonth(d.getMonth()-i);return d.toISOString().slice(0,7)});
 if(adm){const [em,td,lr,...rp]=await Promise.all([lapi('GET','/api/admin/employees'),lapi('GET','/api/admin/today'),lapi('GET','/api/admin/leaves'),...mons.map(m=>lapi('GET','/api/admin/report?month='+m))]);
  em.employees.forEach(lvKey);const E=em.employees.filter(e=>!['developer','boss'].includes(e.role)).map(lvEmp);D.emp=E;D.attx={};
  rp.forEach(r=>lvFill(E,r.month,r.sessions,r.marks,r.leaves));
  D.att=td.rows.map(r=>{const e=E.find(x=>x.rid===r.emp.id);if(!e)return null;const s=r.session;const st=r.status==='leave'?'Leave':r.status==='off'?'Week off':r.status==='marked'?({Present:'In','Half Day':'In',Absent:'Not in',Leave:'Leave','Week Off':'Week off'}[r.mark.status]||'Not in'):s?(r.late?'Late':'In'):'Not in';
   return {k:e.k,in:s?istHM(s.start_at):'',out:s&&s.end_at?istHM(s.end_at):'',st,gps:r.last?(r.status==='no_signal'?'No signal '+r.last_min+' min':'Live · '+(r.last_min!=null?r.last_min+' min ago':'')):(s?(e.city||''):''),rid:r.emp.id,sid:s?s.id:null}}).filter(Boolean);
  const kOf=id=>{const x=em.employees.find(z=>z.id===id);return x?lvKey(x):'u'+id};
  D.leave=lr.leaves.map(l=>({id:'R'+l.id,rid:l.id,k:kOf(l.emp_id),from:l.date,to:l.date,why:l.reason||'—',type:l.kind||'Full day',st:l.status,at:String(l.created_at||l.date).slice(0,10)}));
  D.autoOut=[];D.attReq=(D.attReq||[]).filter(r=>r.live);
 }else{const rs=await Promise.all(mons.map(m=>lapi('GET','/api/me/month?month='+m)));const e=lvEmp(me);D.emp=[e];D.attx={};rs.forEach((r,i)=>lvFill([e],mons[i],r.sessions.map(s=>({...s,emp_id:me.id})),r.marks.map(x=>({...x,emp_id:me.id})),[]));
  const t=rs[0].sessions.find(s=>s.date===TODAY);D.att=[{k:e.k,in:t?istHM(t.start_at):'',out:t&&t.end_at?istHM(t.end_at):'',st:t?'In':'Not in',gps:''}]}
 S.me=lvKey(me);if(!adm){D.leave=[];try{const ml=await lapi('GET','/api/leaves/mine');D.leave=ml.leaves.map(l=>({id:'R'+l.id,rid:l.id,k:S.me,from:l.date,to:l.date,why:l.reason||'—',type:l.kind||'Full day',st:l.status,at:String(l.created_at||l.date).slice(0,10)}))}catch(x){}D.autoOut=[]}if(!allowed(S.v))S.v=tabsFor()[0][0];LV.ok=true;LV.at=new Date();save()}catch(x){LV.err=x.message||'Could not reach the server'}LV.busy=false;render()}
function lvLoginHTML(){return `<div class="lvwrap"><div class="lvcard"><img src="${typeof JLOGO!=='undefined'?JLOGO:''}" alt="JDAC" class="lvlogo"><h1>JDAC Parent</h1><p class="mut sm">Use the same login as the tracker app: Employee ID (or username / mobile number) and your password.</p>
 <label for="lvu">Employee ID / username / mobile</label><input id="lvu" autocomplete="username" placeholder="JD1001" value="${h(LV.u||(LV.me||{}).username||'')}"><label for="lvp">Password</label><input id="lvp" type="password" autocomplete="current-password" placeholder="Password" data-enter="lvIn">
 ${LV.err?`<div class="lverr">${h(LV.err)}</div>`:''}<button class="btn w" style="margin-top:14px" data-a="lvIn" ${LV.busy?'disabled':''}>${LV.busy?'Logging in…':'Log in'}</button>
 <p class="xs mut" style="margin-top:14px">Old panel: <a href="./old/">open the previous design</a></p></div></div>`}
A.lvIn=async()=>{const u=val('lvu'),p=document.getElementById('lvp').value;LV.u=u;if(!u||!p){LV.err='Enter your login ID and password';return render()}LV.busy=true;LV.err='';render();
 try{const r=await lapi('POST','/api/login',{username:u.trim(),password:p,device_id:'web'});LV.tok=r.token;LV.me=r.me;localStorage.setItem('jdac_token',r.token);localStorage.setItem('jdac_me',JSON.stringify(r.me));LV.busy=false;await lvLoad()}catch(x){LV.busy=false;LV.err=x.message;render()}};
A.lvOut=()=>{closeM&&closeM();lvOut()};A.lvSync=()=>lvLoad();
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target&&e.target.id==='lvp'){e.preventDefault();A.lvIn()}});
if(LIVE){const _rLV=render;render=function(){if(!LV.tok||!LV.me){document.getElementById('app').innerHTML=lvLoginHTML();return}
  if(!LV.ok){document.getElementById('app').innerHTML=`<div class="lvwrap"><div class="lvcard"><h1>JDAC Parent</h1>${LV.err?`<div class="lverr">${h(LV.err)}</div><button class="btn w" data-a="lvSync">Try again</button><button class="btn sec w" style="margin-top:8px" data-a="lvOut">Log out</button>`:'<p class="mut">Loading live data…</p>'}</div></div>`;return}
  _rLV.apply(this,arguments);const pr=document.querySelector('.proto');if(pr){pr.textContent='● Live data';pr.classList.add('lvon');pr.title='Staff and attendance come from the tracker database · synced '+(LV.at?LV.at.toLocaleTimeString():'')}};
 /* attendance edits are saved to the real database */
 const _attSet=A.attSet;A.attSet=async e=>{const id=e.dataset.id,d=e.dataset.d,s=e.dataset.s,em=D.emp.find(x=>x.id===id),why=val('atn')||'Edited in JDAC Parent';const st={P:'Present',HD:'Half Day',A:'Absent',L:'Leave',LV:'Leave',WO:'Week Off',H:'Leave'}[s];
  if(em&&em.rid&&st){try{await lapi('POST','/api/admin/marks',{emp_id:em.rid,date:d,status:st,reason:why.length<3?'Edited in JDAC Parent':why})}catch(x){return toast('Not saved: '+x.message)}}_attSet(e);toast('Saved to the database')};
 /* person switch: real users see their own login, admins can still preview others */
 const _who=A.whoSheet;A.whoSheet=()=>{const adm=['boss','hr','developer'].includes((LV.me||{}).role);if(!adm)return sheet(`<h2>${h(LV.me.name)}</h2><p class="mut sm">${h(LV.me.designation||'')} · ${h(LV.me.username)}</p><button class="btn sec w" data-a="lvSync">Refresh data</button><button class="btn w" style="margin-top:8px;background:var(--r)" data-a="lvOut">Log out</button>`);
  _who();const s=document.querySelector('.sheet');if(s)s.insertAdjacentHTML('afterbegin',`<div class="lvme"><div><b>Logged in: ${h(LV.me.name)}</b><span>${h(LV.me.role)} · ${h(LV.me.username)} · live data</span></div><button class="btn sm sec" data-a="lvSync">Refresh</button><button class="btn sm" style="background:var(--r)" data-a="lvOut">Log out</button></div>`)};

 /* "NR" = no record in the database for that day (shown as –, not counted as absent) */
 ACODE.NR=['No record in the tracker',''];
 const _attSum=attSum;attSum=function(e,f,t){const c=_attSum(e,f,t);c.NR=c.NR||0;if(isNaN(c.days))c.days=c.P+c.L+c.HD*0.5;return c};
 const _rNR=render;render=function(){_rNR.apply(this,arguments);try{document.querySelectorAll('.ac.NR').forEach(b=>{b.textContent='–'})}catch(x){}};
 /* leave decisions and new leave requests go to the database */
 const _lvAp=A.lvAp;A.lvAp=async e=>{const l=D.leave.find(x=>x.id===e.dataset.id);if(l&&l.rid){try{await lapi('POST','/api/admin/leaves/'+l.rid+'/decide',{status:'Approved'})}catch(x){return toast('Not saved: '+x.message)}}_lvAp(e)};
 const _lvRj=A.lvRj;A.lvRj=async e=>{const l=D.leave.find(x=>x.id===e.dataset.id);if(l&&l.rid){try{await lapi('POST','/api/admin/leaves/'+l.rid+'/decide',{status:'Rejected'})}catch(x){return toast('Not saved: '+x.message)}}_lvRj(e)};
 const _lvSave=A.lvSave;A.lvSave=async e=>{const n=D.leave.length;_lvSave(e);const l=D.leave.length>n?D.leave[D.leave.length-1]:null;if(!l||l.k!==S.me)return;
  try{for(let d=l.from;d<=l.to;d=addD(d,1)){const r=await lapi('POST','/api/leaves',{date:d,kind:l.type==='Half day'?'Half day':'Full day',reason:(l.why||'Leave').length<3?'Leave request':l.why})}l.rid=1;toast('Leave request sent to Nameera')}catch(x){toast('Not saved: '+x.message)}};
 if(LV.tok&&LV.me)lvLoad();
 setInterval(()=>{if(LV.ok&&document.visibilityState==='visible'&&!document.querySelector('.sheet'))lapi('GET','/api/admin/today').then(()=>{}).catch(()=>{})},600000);
}
render();
