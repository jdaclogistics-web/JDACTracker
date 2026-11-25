/* ===================== Zenmeg (IT partner) = the XENMAG team inside Tasks =====================
   • No separate IT section: Zenmeg work is a normal task in the XENMAG team; in-house IT work goes in SMM.
   • Nayan (POC) and Krishna (founder) log in with ZEN- IDs and see only the Tasks page, only XENMAG.
   • Live site: Tasks and teams are saved on the server, so every login sees the same tasks and dates. */
const ZEN={name:'Zenmeg',proj:'xenmag'};
P.nayan=Object.assign(P.nayan||{},{n:'Nayan',r:'Zenmeg · POC (daily 12 pm call)',team:'Zenmeg',kind:'partner',work:['it']});
P.krishna={n:'Krishna',r:'Zenmeg · Founder',team:'Zenmeg',kind:'partner',work:['it']};
['nayan','krishna'].forEach(k=>{if(!STAFF.includes(k))STAFF.push(k)});
const isZen=k=>(P[k||S.me]||{}).team==='Zenmeg';
(function(){const x=(D.projects||[]).find(p=>p.id===ZEN.proj);if(x){['nayan','krishna'].forEach(k=>{if(!x.m.includes(k))x.m.push(k)})}})();

/* partner sees only Tasks → XENMAG */
const _tabsZ=tabsFor;tabsFor=function(who){if(isZen(who||S.me))return [['tasks','Tasks','task']];return _tabsZ(who)};
const _allowedZ=allowed;allowed=function(v){if(isZen())return v==='tasks';return _allowedZ(v)};
const _myTZ=myTasks;myTasks=function(){if(isZen())return D.tasks.filter(t=>t.proj===ZEN.proj);return _myTZ()};
const _myPZ=myProjects;myProjects=function(){if(isZen())return D.projects.filter(p=>p.id===ZEN.proj);return _myPZ()};
const _vtZ=V.tasks;V.tasks=()=>{if(isZen()){S.kp=ZEN.proj;if(S.ttab==='meet')S.ttab='proj'}return _vtZ()};

/* ---------- Zenmeg logins (admin, from the XENMAG team toolbar) ---------- */
let ZU=[];
async function zenUsers(){if(LIVE&&LV.tok){try{ZU=(await lapi('GET','/api/it/partners')).users}catch(x){toast(x.message)}}else ZU=ZU.length?ZU:[{id:1,name:'Nayan',title:'POC · daily coordination',username:'ZEN-NAYAN',has_password:false,active:true},{id:2,name:'Krishna',title:'Founder',username:'ZEN-KRISHNA',has_password:false,active:true}]}
A.zenLogins=async()=>{await zenUsers();sheet(`<h2>${ZEN.name} logins</h2><p class="sm mut">Nayan and Krishna open the same JDAC Parent link and log in with these IDs. They see only the <b>XENMAG</b> team in Tasks — no staff, attendance, money or chats.</p>
 <div class="note">Link: <b>https://jdaclogistics-web.github.io/JDACTracker/</b></div>
 ${ZU.map(u=>`<div class="card" style="margin:8px 0"><div class="row nw">${av(u.name)}<div style="flex:1"><b>${h(u.name)}</b> <span class="xs mut">${h(u.title||'')}</span><div class="sm">Login ID: <b>${h(u.username)}</b> · ${u.has_password?pill('Password set','g'):pill('Password not set','a')}${u.active===false?' '+pill('Blocked','r'):''}</div>${u.last_login_at?`<div class="xs mut">Last login ${h(String(u.last_login_at).slice(0,16).replace('T',' '))}</div>`:''}</div></div>
 <div class="row nw" style="margin-top:8px"><input id="zpw${u.id}" placeholder="New password (min 6)" style="flex:1"><button class="btn sm" data-a="zenPw" data-id="${u.id}">Set</button><button class="btn sm sec" data-a="zenBlk" data-id="${u.id}" data-on="${u.active===false?1:0}">${u.active===false?'Unblock':'Block'}</button></div></div>`).join('')}
 <p class="xs mut">Setting a new password logs them out everywhere. Share the ID and password with them yourself.</p>`)};
const zenSave=async b=>{if(LIVE&&LV.tok)await lapi('POST','/api/it/partners',b);else{const u=ZU.find(x=>x.id===b.id);if(b.password)u.has_password=true;if(b.active!=null)u.active=!!b.active}};
A.zenPw=async e=>{const p=val('zpw'+e.dataset.id);if(p.length<6)return toast('Password must be at least 6 characters');try{await zenSave({id:+e.dataset.id,password:p});toast('Password set');A.zenLogins()}catch(x){toast(x.message)}};
A.zenBlk=async e=>{try{await zenSave({id:+e.dataset.id,active:e.dataset.on==='1'});toast('Saved');A.zenLogins()}catch(x){toast(x.message)}};
const _kbZ=kanban;kanban=function(){const o=_kbZ();return isAdm()&&S.kp===ZEN.proj?o.replace('<button class="btn sm sec" data-a="projNew">',`<button class="btn sm sec" data-a="zenLogins">${ic('user')}Zenmeg logins</button><button class="btn sm sec" data-a="projNew">`):o};

/* ---------- shared Tasks on the server (live site) ---------- */
const TS={snap:{},since:'',busy:false,ready:false,t:null,proj:''};
const tsSeed=id=>/^k\d{1,2}$/.test(id);           /* built-in sample tasks stay on this device only */
const tsOn=()=>LIVE&&!!LV.tok;
const _saveRaw=save;
save=function(){_saveRaw();if(tsOn()&&TS.ready){clearTimeout(TS.t);TS.t=setTimeout(tsPush,500)}};
async function tsPull(){if(!tsOn()||TS.busy)return;TS.busy=true;let ch=false;
 try{const r=await lapi('GET','/api/team/tasks'+(TS.since?'?since='+encodeURIComponent(TS.since):''));
  r.tasks.forEach(t=>{delete t._u;const js=JSON.stringify(t),i=D.tasks.findIndex(x=>x.id===t.id);
   if(i>=0&&TS.snap[t.id]!==undefined&&JSON.stringify(D.tasks[i])!==TS.snap[t.id])return; /* my unsent edit wins */
   if(i<0){D.tasks.push(t);ch=true}else if(JSON.stringify(D.tasks[i])!==js){D.tasks[i]=t;ch=true}TS.snap[t.id]=js});
  (r.deleted||[]).forEach(id=>{const i=D.tasks.findIndex(x=>x.id===id);if(i>=0){D.tasks.splice(i,1);ch=true}delete TS.snap[id]});
  if(r.projects){const js=JSON.stringify(r.projects);if(isZen()){if(JSON.stringify(D.projects.filter(p=>p.id===ZEN.proj))!==js){D.projects=D.projects.filter(p=>p.id!==ZEN.proj).concat(r.projects);ch=true}}else{if(js!==JSON.stringify(D.projects)){D.projects=r.projects;ch=true}TS.proj=js}}
  TS.since=new Date(Date.parse(r.now)-5000).toISOString();TS.err='';
 }catch(x){TS.err=x.message}TS.busy=false;if(ch){_saveRaw();if(!document.querySelector('.gx-b.drag,.kc.drag'))render()}}
async function tsPush(){if(!tsOn()||!TS.ready)return;const ids=new Set(),ch=[];
 D.tasks.forEach(t=>{ids.add(t.id);if(tsSeed(t.id))return;if(isZen()&&t.proj!==ZEN.proj)return;const js=JSON.stringify(t);if(TS.snap[t.id]!==js)ch.push(t)});
 if(!isZen())Object.keys(TS.snap).forEach(id=>{if(!ids.has(id))ch.push({id,deleted:true})});
 for(let i=0;i<ch.length;i+=150){const part=ch.slice(i,i+150);try{await lapi('POST','/api/team/tasks',{tasks:part});part.forEach(t=>{if(t.deleted)delete TS.snap[t.id];else TS.snap[t.id]=JSON.stringify(t)})}catch(x){toast('Not saved to server: '+x.message);return}}
 if(isAdm()&&!isZen()){const js=JSON.stringify(D.projects);if(js!==TS.proj){try{await lapi('POST','/api/team/projects',{projects:D.projects});TS.proj=js}catch(x){}}}}
/* one-time: tasks given earlier on the old IT & Web page move into XENMAG (Zenmeg) or SMM (own team) */
async function zenImport(){if(!isAdm()||isZen()||D.itImported)return;try{const r=await lapi('GET','/api/it/tasks');const stMap={'To do':'To do',Working:'Working',Check:'Review',Done:'Done',Stuck:'Stuck'};
 r.tasks.forEach(x=>{const id='it'+x.id;if(D.tasks.some(t=>t.id===id))return;const o=x.doer==='partner'?(/krishna/i.test(x.owner_name)?'krishna':'nayan'):(Object.keys(P).find(k=>lvNorm(P[k].n)===lvNorm(x.owner_name||''))||'himanshu');
  D.tasks.push({id,t:x.title,desc:[x.detail,x.link?'Link: '+x.link:'',x.proof?'Proof: '+x.proof:''].filter(Boolean).join('\n'),o,co:x.company||'studios',proj:x.doer==='partner'?ZEN.proj:'smm',due:x.due||TODAY,pri:x.priority==='High'?'High':'Normal',type:'One-time',tags:[x.kind||'IT'].filter(Boolean),check:[],st:stMap[x.status]||'To do',by:'darshan'})});
 D.itImported=1;save()}catch(x){}}

if(LIVE){
 const _lvIn=A.lvIn;A.lvIn=async()=>{const u=val('lvu');if(!/^zen-/i.test(u))return _lvIn();const p=document.getElementById('lvp').value;LV.u=u;if(!p){LV.err='Enter your password';return render()}LV.busy=true;LV.err='';render();
  try{const r=await lapi('POST','/api/partner/login',{username:u.trim(),password:p});LV.tok=r.token;LV.me=r.me;localStorage.setItem('jdac_token',r.token);localStorage.setItem('jdac_me',JSON.stringify(r.me));LV.busy=false;await lvLoad()}catch(x){LV.busy=false;LV.err=x.message;render()}};
 const _lvLoad=lvLoad;lvLoad=async function(){
  if(LV.me&&LV.me.role==='partner'){LV.busy=true;render();const k=/nayan/i.test(LV.me.name)?'nayan':/krishna/i.test(LV.me.name)?'krishna':'zen'+LV.me.id;
   if(!P[k])P[k]={n:LV.me.name,r:ZEN.name+' · '+(LV.me.title||''),team:'Zenmeg',kind:'partner',work:['it']};
   S.me=k;S.v='tasks';S.ttab=S.ttab&&S.ttab!=='meet'&&S.ttab!=='forms'?S.ttab:'proj';S.kp=ZEN.proj;S.kw='all';D.emp=[];D.att=[];D.leave=[];
   if(!TS.ready){D.tasks=D.tasks.filter(t=>t.proj===ZEN.proj&&!tsSeed(t.id))}
   await tsPull();TS.ready=true;LV.ok=true;LV.at=new Date();LV.busy=false;_saveRaw();render();return}
  await _lvLoad();if(!LV.tok)return;await tsPull();TS.ready=true;await zenImport();tsPush()};
 const _out=lvOut;lvOut=function(q){TS.ready=false;TS.snap={};TS.since='';TS.proj='';return _out(q)};
 setInterval(()=>{if(TS.ready&&document.visibilityState==='visible')tsPull()},45000);
 document.addEventListener('visibilitychange',()=>{if(TS.ready&&document.visibilityState==='visible')tsPull()});
 const _whoZ=A.whoSheet;A.whoSheet=()=>{if(LV.me&&LV.me.role==='partner')return sheet(`<h2>${h(LV.me.name)}</h2><p class="mut sm">${ZEN.name} · ${h(LV.me.username)}</p><button class="btn w" style="background:var(--r)" data-a="lvOut">Log out</button>`);return _whoZ()};
 const _rZ=render;render=function(){if(LV.me&&LV.me.role==='partner'&&LV.ok&&S.v!=='tasks')S.v='tasks';return _rZ.apply(this,arguments)};
 const _lh=lvLoginHTML;lvLoginHTML=function(){return _lh().replace('Employee ID (or username / mobile number) and your password.','Employee ID (or username / mobile number) and your password. IT partner (Zenmeg): use your ZEN- login ID.')};
}
/* preview: the person switcher shows the Zenmeg logins too */
if(!LIVE&&typeof A.whoSheet==='function'){const _ws=A.whoSheet;A.whoSheet=()=>{_ws();const s=document.querySelector('.sheet');if(s&&!s.querySelector('[data-k="krishna"]'))s.insertAdjacentHTML('beforeend',`<div class="xs mut" style="font-weight:700;margin-top:12px">${ZEN.name.toUpperCase()} · IT PARTNER</div>${['nayan','krishna'].map(k=>`<button class="li tap" style="width:100%;text-align:left" data-a="whoSet" data-k="${k}">${av(P[k].n)}<div class="tx"><b>${h(P[k].n)}</b><div class="m">${h(P[k].r)}</div></div></button>`).join('')}`)}}
render();
