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

/* ---------- ONE task list: JDAC Parent and the phone app share the same tasks (live site) ---------- */
const TS={snap:{},busy:false,ready:false,t:null,emp:{},key:{},pid:{},pkey:{}};
const tsSeed=id=>/^k\d{1,2}$/.test(id);           /* built-in sample tasks: preview only */
const tsOn=()=>LIVE&&!!LV.tok;
const _saveRaw=save;
save=function(){_saveRaw();if(tsOn()&&TS.ready){clearTimeout(TS.t);TS.t=setTimeout(tsPush,500)}};
const PKEY={'ops logistics':'ops','xenmag':'xenmag','cse jdac':'cse','hr':'hr','warehouse team':'wh','accounts':'acc','account':'acc','smm':'smm','govaabazaar':'gb','govaa bazaar':'gb','bahiram':'bahiram'};
const L2ST=(d)=>{const s=String(d.status||''),j=(d.jp||{}).st;const col=/done|closed|complete/i.test(s)?'Completed':/stuck|block/i.test(s)?'Stuck':/plan|progress|working|doing/i.test(s)?'Planning':'To do';
 if(j&&KCOL.find(c=>c[0]===colOf({st:j}))[1]===col)return j;return {Completed:'Done',Stuck:'Stuck',Planning:'Working','To do':'To do'}[col]};
const ST2L=t=>KCOL.find(c=>c[0]===colOf(t))[1];
function fromL(d){const jp=d.jp||{},o=d.assignee_emp!=null&&TS.key[d.assignee_emp]?TS.key[d.assignee_emp]:(jp.o||(d.assigneeId!=null&&TS.keyL[d.assigneeId])||'darshan');
 const t={...jp,id:d.cid||'L'+d._rid,rid:d._rid,t:d.title||'',desc:d.notes||'',o,proj:TS.pkey[String(d.projectId)]||'',due:String(d.due||TODAY).slice(0,10),pri:d.priority||'Normal',type:d.type||'One-time',
  tags:Array.isArray(jp.tags)?jp.tags:(Array.isArray(d.tags)?d.tags.map(x=>x&&x.n||x).filter(Boolean):[]),check:(d.checklist||[]).map(c=>({t:c.title,d:!!c.done})),st:L2ST(d),co:jp.co||'studios',by:jp.by||'darshan'};
 if(d.start)t.start=String(d.start).slice(0,10);else delete t.start;delete t.o2;return t}
function toL(t){const e=TS.emp[t.o];const {id,rid,t:ti,desc,o,proj,due,start,pri,type,tags,check,st,...rest}=t;
 return {cid:t.id,title:ti,notes:desc||'',status:ST2L(t),priority:pri||'Normal',due,start:start||null,type:type||'One-time',projectId:TS.pid[proj]||null,assignee_emp:e?e.id:null,assigneeId:e&&e.legacy_id!=null?e.legacy_id:null,
  tags:(tags||[]).map(n=>({n,c:'#64748B'})),jp:{...rest,o,st,tags}}}
const coreJ=t=>JSON.stringify(toL(t)),chkJ=t=>JSON.stringify((t.check||[]).map(c=>[c.t,!!c.d]));
async function tsPull(){if(!tsOn()||TS.busy)return;TS.busy=true;let ch=false;
 try{const r=await lapi('GET','/api/team/tasks');
  TS.emp={};TS.key={};TS.keyL={};(r.emps||[]).forEach(e=>{const k=lvKey(e);if(e.active||!TS.emp[k])TS.emp[k]=e;TS.key[e.id]=k;if(e.legacy_id!=null)TS.keyL[e.legacy_id]=k});
  TS.pid={};TS.pkey={};const PR=r.projects.map(p=>{const nk=lvNorm(p.name),k=PKEY[nk]||'P'+p.id;TS.pid[k]=p.id;TS.pkey[p.id]=k;const old=D.projects.find(x=>x.id===k)||{};
   const m=[...new Set(p.members.map(x=>x.emp_id!=null?TS.key[x.emp_id]:x.person_id!=null?TS.keyL[x.person_id]:null).filter(Boolean))];return {...old,id:k,n:p.name,lid:p.id,m:m.length?m:(old.m||[])}});
  if(isZen()){D.projects=D.projects.filter(p=>p.id!==ZEN.proj).concat(PR)}else{const keep=D.projects.filter(p=>!p.lid&&!PR.some(x=>x.id===p.id));if(JSON.stringify(PR.concat(keep))!==JSON.stringify(D.projects)){D.projects=PR.concat(keep);ch=true}}
  const seen=new Set();
  r.tasks.forEach(d=>{const t=fromL(d);seen.add(t.id);const i=D.tasks.findIndex(x=>x.id===t.id),sn=TS.snap[t.id];
   if(i>=0&&sn&&(coreJ(D.tasks[i])!==sn.c||chkJ(D.tasks[i])!==sn.k))return; /* my unsent edit wins */
   if(i<0){D.tasks.push(t);ch=true}else if(JSON.stringify(D.tasks[i])!==JSON.stringify(t)){D.tasks[i]=t;ch=true}TS.snap[t.id]={c:coreJ(t),k:chkJ(t),rid:d._rid}});
  /* removed on the server (deleted / closed long ago / moved out of view) */
  Object.keys(TS.snap).forEach(id=>{if(!seen.has(id)){const i=D.tasks.findIndex(x=>x.id===id);const lc=i>=0?coreJ(D.tasks[i]):null;if(i>=0&&lc===TS.snap[id].c){D.tasks.splice(i,1);ch=true}delete TS.snap[id]}});
  TS.err='';
 }catch(x){TS.err=x.message}TS.busy=false;if(ch){_saveRaw();if(!document.querySelector('.gx-b.drag,.kc.drag'))render()}}
async function tsPush(){if(!tsOn()||!TS.ready)return;
 /* new teams made here → real projects */
 if(isAdm()&&!isZen())for(const p of D.projects.filter(p=>!p.lid&&!TS.pid[p.id])){try{const r=await lapi('POST','/api/team/projects',{name:p.n,emp_ids:(p.m||[]).map(k=>TS.emp[k]&&TS.emp[k].id).filter(Boolean)});p.lid=r.id;TS.pid[p.id]=r.id;TS.pkey[r.id]=p.id}catch(x){}}
 const ids=new Set(),items=[];
 D.tasks.forEach(t=>{ids.add(t.id);if(tsSeed(t.id))return;if(isZen()&&t.proj!==ZEN.proj)return;if(t.proj&&!TS.pid[t.proj])return;const sn=TS.snap[t.id],c=coreJ(t),k=chkJ(t);
  if(!sn||sn.c!==c||sn.k!==k)items.push({t,it:{rid:sn&&sn.rid||t.rid||undefined,data:toL(t),...(!sn||sn.k!==k?{checklist:(t.check||[]).map(x=>({title:x.t,done:!!x.d}))}:{})}})});
 if(!isZen())Object.keys(TS.snap).forEach(id=>{if(!ids.has(id))items.push({del:id,it:{rid:TS.snap[id].rid,data:{cid:id},deleted:true}})});
 for(let i=0;i<items.length;i+=100){const part=items.slice(i,i+100);try{const r=await lapi('POST','/api/team/tasks',{tasks:part.map(x=>x.it)});
  part.forEach(x=>{if(x.del){delete TS.snap[x.del];return}const rid=r.rids[x.t.id]||x.it.rid;TS.snap[x.t.id]={c:coreJ(x.t),k:chkJ(x.t),rid}})}catch(x){toast('Not saved to server: '+x.message);return}}}
/* one-time: tasks saved on 25 Nov in the separate store move into the shared task list */
async function tsMoveV1(){if(!isAdm()||isZen())return;try{const r=await lapi('GET','/api/team/v1');if(!r.tasks.length)return;r.tasks.forEach(t=>{delete t._u;if(!D.tasks.some(x=>x.id===t.id))D.tasks.push(t)});_saveRaw();await tsPush();await lapi('POST','/api/team/v1/done',{})}catch(x){}}
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
  await _lvLoad();if(!LV.tok)return;D.tasks=D.tasks.filter(t=>!tsSeed(t.id));await tsPull();TS.ready=true;await tsMoveV1();await zenImport();tsPush()};
 const _out=lvOut;lvOut=function(q){TS.ready=false;TS.snap={};return _out(q)};
 setInterval(()=>{if(TS.ready&&document.visibilityState==='visible')tsPull()},45000);
 document.addEventListener('visibilitychange',()=>{if(TS.ready&&document.visibilityState==='visible')tsPull()});
 const _whoZ=A.whoSheet;A.whoSheet=()=>{if(LV.me&&LV.me.role==='partner')return sheet(`<h2>${h(LV.me.name)}</h2><p class="mut sm">${ZEN.name} · ${h(LV.me.username)}</p><button class="btn w" style="background:var(--r)" data-a="lvOut">Log out</button>`);return _whoZ()};
 const _rZ=render;render=function(){if(LV.me&&LV.me.role==='partner'&&LV.ok&&S.v!=='tasks')S.v='tasks';return _rZ.apply(this,arguments)};
 const _lh=lvLoginHTML;lvLoginHTML=function(){return _lh().replace('Employee ID (or username / mobile number) and your password.','Employee ID (or username / mobile number) and your password. IT partner (Zenmeg): use your ZEN- login ID.')};
}
/* preview: the person switcher shows the Zenmeg logins too */
if(!LIVE&&typeof A.whoSheet==='function'){const _ws=A.whoSheet;A.whoSheet=()=>{_ws();const s=document.querySelector('.sheet');if(s&&!s.querySelector('[data-k="krishna"]'))s.insertAdjacentHTML('beforeend',`<div class="xs mut" style="font-weight:700;margin-top:12px">${ZEN.name.toUpperCase()} · IT PARTNER</div>${['nayan','krishna'].map(k=>`<button class="li tap" style="width:100%;text-align:left" data-a="whoSet" data-k="${k}">${av(P[k].n)}<div class="tx"><b>${h(P[k].n)}</b><div class="m">${h(P[k].r)}</div></div></button>`).join('')}`)}}
render();
