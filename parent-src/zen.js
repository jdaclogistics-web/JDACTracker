/* ===================== IT & WEB DESK · Zenmeg (IT retainer partner) + own team =====================
   Admin (Darshan sir / Nameera): give website & tech tasks to Zenmeg or to the in-house team, approve finished work.
   Zenmeg (Nayan POC, Krishna founder): own partner login (ZEN-…), sees only Zenmeg tasks, updates them.
   Live site: data lives in the tracker database (/api/it/*). Preview: sample data in this browser. */
const ZEN={name:'Zenmeg',about:'IT retainer partner · websites, integrations, servers'};
I.link=I.link||'<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>';
I.code='<path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>';
P.nayan=Object.assign(P.nayan||{},{n:'Nayan',r:'Zenmeg · POC (daily 12 pm call)',team:'Zenmeg',kind:'partner',work:['it']});
P.krishna={n:'Krishna',r:'Zenmeg · Founder',team:'Zenmeg',kind:'partner',work:['it']};
const isZen=k=>(P[k||S.me]||{}).team==='Zenmeg';
const IT_SITES=[['jdac.in','jdac.in · JDAC Logistics','log'],['govaabazaar','GovaaBazaar site','gb'],['retailer','Retailer Bazaar','gb'],['distributor','Distributor Bazaar','gb'],['studios','JDAC Studios site','studios'],['bahiram','Bahiram (client)','studios'],['tracker','JDAC Tracker / app','studios'],['server','Email & server','studios'],['other','Other','studios']];
const IT_KINDS=['Bug / fix','Integration','New feature','Server & email','Content update','Other'];
const IT_FLOW=['To do','Working','Check','Done'];
const IT={tasks:[],team:[],users:[],me:null,busy:false,err:'',at:0};

/* ---------- data: live API or local sample ---------- */
function itDemo(){if(!D.itDemo){const t0=TODAY;D.itDemo={n:3,users:[{id:1,partner:'zenmeg',name:'Nayan',title:'POC · daily coordination',username:'ZEN-NAYAN',has_password:false,active:true},{id:2,partner:'zenmeg',name:'Krishna',title:'Founder',username:'ZEN-KRISHNA',has_password:false,active:true}],
 tasks:[{id:1,title:'WhatsApp Business API inside the tracker (shared inbox)',detail:'Connect our WhatsApp Business API (BotBees) so CSE chats show in the tracker. Expected: send/receive, templates, team-wise inbox.',doer:'partner',partner:'zenmeg',owner_partner:1,kind:'Integration',site:'tracker',company:'studios',priority:'High',due:addD(t0,7),status:'Working',link:'',proof:'',created_by_name:'Darshan Soni',notes:[{by_name:'Darshan Soni',text:'Task given',created_at:t0},{by_name:'Nayan',text:'Started · BotBees API keys received',created_at:t0}]},
  {id:2,title:'Check jdac.in booking flow for bugs (mobile)',detail:'Book 3 test shipments on mobile. List every bug with screenshot.',doer:'team',owner_emp:'himanshu',kind:'Bug / fix',site:'jdac.in',company:'log',priority:'Normal',due:addD(t0,1),status:'To do',link:'https://jdac.in',proof:'',created_by_name:'Darshan Soni',notes:[{by_name:'Darshan Soni',text:'Task given',created_at:t0}]}]};save()}return D.itDemo}
function itOwnerName(t){if(t.owner_name)return t.owner_name;if(t.doer==='partner'){const u=(IT.users||[]).find(x=>x.id===t.owner_partner);return u?u.name:'Zenmeg'}const e=IT.team.find(x=>String(x.id)===String(t.owner_emp));return e?e.name:nm(t.owner_emp)}
async function itLoad(force){if(IT.busy)return;await null;if(IT.busy)return;if(!force&&IT.at&&Date.now()-IT.at<20000)return;IT.busy=true;IT.err='';
 try{if(LIVE&&LV.tok){const r=await lapi('GET','/api/it/tasks');IT.tasks=r.tasks;IT.team=r.team;IT.users=r.partner_users;IT.me=r.me}
  else{const d=itDemo();IT.tasks=JSON.parse(JSON.stringify(d.tasks));IT.users=d.users;IT.team=STAFF.filter(k=>P[k].team!=='Zenmeg'&&P[k].kind!=='partner').map(k=>({id:k,name:P[k].n,designation:P[k].r}));IT.me={kind:isZen()?'partner':'emp',admin:isAdm()}}
  IT.at=Date.now()}catch(x){IT.err=x.message}IT.busy=false;if(S.v==='itdesk')render()}
async function itCall(m,p,b){if(LIVE&&LV.tok){const r=await lapi(m,p,b);IT.at=0;await itLoad(true);return r}
 /* sample mode: same rules as the server */
 const d=itDemo(),who=isZen()?{name:P[S.me].n,partner:true}:{name:nm(S.me),admin:isAdm()},id=+((p.match(/tasks\/(\d+)/)||[])[1]),t=d.tasks.find(x=>x.id===id),nt=(x,s)=>t.notes.push({by_name:who.name,text:x,status_to:s||null,created_at:TODAY});
 if(p==='/api/it/tasks'&&m==='POST'){if(!who.admin)throw new Error('Only Darshan sir / Nameera can give IT tasks');const n=d.n++;d.tasks.unshift({id:n,...b,status:'To do',proof:'',created_by_name:who.name,notes:[{by_name:who.name,text:'Task given',created_at:TODAY}]})}
 else if(/\/status$/.test(p)){if(b.status==='Done'&&!who.admin)throw new Error('Only JDAC can approve and close a task — send it for check');if(b.status==='Check'&&!b.proof&&!t.proof&&!b.note)throw new Error('Add a proof link or a short note of what was done');t.status=b.status;if(b.proof!=null)t.proof=b.proof;nt(b.note||{Working:'Started',Check:'Sent to JDAC for check',Done:'Approved & closed',Stuck:'Stuck','To do':'Moved back to To do'}[b.status],b.status)}
 else if(/\/note$/.test(p))nt(b.text);
 else if(p==='/api/it/partners'){const u=d.users.find(x=>x.id===b.id);if(u){if(b.password)u.has_password=true;if(b.active!=null)u.active=!!b.active}}
 else if(t){Object.assign(t,b)}
 save();IT.at=0;await itLoad(true)}

/* ---------- navigation ---------- */
const _tabsZ=tabsFor;tabsFor=function(who){const k=who||S.me;if(isZen(k))return [['itdesk','Our tasks','code']];const T=_tabsZ(who);
 if((isAdm()&&!who)||['boss','hr'].includes((P[k]||{}).kind)||k==='himanshu'){const i=T.findIndex(x=>x[0]==='tasks');if(!T.some(x=>x[0]==='itdesk'))T.splice(i<0?1:i+1,0,['itdesk','IT & Web','code'])}return T};
const _allowedZ=allowed;allowed=function(v){if(v==='itdesk')return isAdm()||isZen()||S.me==='himanshu'||IT.tasks.some(t=>String(t.owner_emp)===String(S.me));if(isZen())return v==='itdesk';return _allowedZ(v)};

/* ---------- views ---------- */
const itLate=t=>t.status!=='Done'&&t.due&&t.due<TODAY;
const itDoer=t=>t.doer==='partner'?`<span class="pill p">${ZEN.name}</span>`:`<span class="pill b">Own team</span>`;
const itSt=t=>({'To do':pill('To do'),Working:pill('Working','b'),Check:pill(isZen()?'With JDAC for check':'Needs your check','a'),Done:pill('Done','g'),Stuck:pill('Stuck','r')}[t.status]||pill(t.status));
const itSite=k=>(IT_SITES.find(x=>x[0]===k)||[k,k||'—'])[1];
function itRow(t){return `<div class="li tap" data-a="itOpen" data-id="${t.id}" role="button" tabindex="0"><div class="av" style="background:${t.doer==='partner'?'var(--p)':'var(--b)'};border-radius:12px">${ic(t.kind==='Integration'?'link':'code')}</div><div class="tx"><b style="${t.status==='Done'?'text-decoration:line-through;color:var(--mut)':''}">${h(t.title)}</b><div class="m">${isZen()?'':itDoer(t)+' '}${h(itOwnerName(t))} · ${h(t.kind||'')} · ${h(itSite(t.site))} · ${itLate(t)?`<b style="color:var(--r)">${-daysTo(t.due)}d late</b>`:t.due?'due '+fmt(t.due):'no date'}${t.priority==='High'?' · <b style="color:var(--r)">High</b>':''}</div></div>${itSt(t)}</div>`}
function itCounts(L){return {open:L.filter(t=>t.status!=='Done').length,check:L.filter(t=>t.status==='Check').length,late:L.filter(itLate).length,stuck:L.filter(t=>t.status==='Stuck').length,done:L.filter(t=>t.status==='Done').length}}
function itBoard(L){return `<div class="car" style="align-items:flex-start">${[['To do','To do'],['Working','Working'],['Check',isZen()?'With JDAC for check':'Needs your check'],['Done','Done']].map(([s,l])=>{const C=L.filter(t=>s==='To do'?['To do','Stuck'].includes(t.status):t.status===s);return `<div style="flex:1 0 260px;min-width:260px"><div class="grp" style="border-radius:16px 16px 0 0;background:#fff">${l} · ${C.length}</div><div class="list" style="border-radius:0 0 16px 16px">${C.map(itRow).join('')||'<div class="empty xs">Empty</div>'}</div></div>`}).join('')}</div>`}
V.itdesk=()=>{if(!IT.at&&!IT.busy)itLoad();
 if(IT.err)return page('IT & Web','')+`<div class="card"><b>Could not load</b><p class="sm mut">${h(IT.err)}</p><button class="btn" data-a="itRe">Try again</button></div>`;
 if(!IT.at)return page('IT & Web','Loading…');
 return isZen()?itPartnerView():itAdminView()};
function itAdminView(){const A0=IT.tasks,Z=A0.filter(t=>t.doer==='partner'),M=A0.filter(t=>t.doer==='team'),cz=itCounts(Z),cm=itCounts(M),adm=isAdm();
 const f=S.itf||'all',v=S.itv||'board';let L=A0;
 if(f==='zen')L=Z;if(f==='team')L=M;if(f==='check')L=A0.filter(t=>t.status==='Check');if(f==='late')L=A0.filter(itLate);if(f==='done')L=A0.filter(t=>t.status==='Done');if(f!=='done'&&v==='list')L=L.filter(t=>t.status!=='Done'||f==='all');
 const zp=(IT.users||[]).filter(u=>u.partner==='zenmeg'),tm=IT.team.filter(e=>/\b(IT|web|website|landing|developer)\b/i.test(e.designation||'')).slice(0,3);
 const lane=(title,sub,who,c,doer,col)=>`<div class="card" style="border-top:4px solid ${col};margin:0"><div class="row" style="align-items:flex-start"><div style="flex:1;min-width:180px"><b style="font-size:17px">${title}</b><div class="xs mut">${sub}</div></div>${adm?`<button class="btn sm" data-a="itNew" data-d="${doer}">${ic('plus')}Give task</button>`:''}</div>
  <div class="row" style="gap:6px;margin:10px 0">${who}</div>
  <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">${kpi(c.open,'Open')}${kpi(c.check,'Needs your check')}${kpi(c.late,'Late',c.stuck?c.stuck+' stuck':'')}</div></div>`;
 return page('IT & Web',`Website & tech work · given to ${ZEN.name} (IT partner) or to your own team`,adm?`<div class="row hide-m"><button class="btn sec" data-a="itLogins">${ic('user')}${ZEN.name} logins</button><button class="btn" data-a="itNew">${ic('plus')}Give task</button></div>`:'')+
 `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;margin-bottom:14px">
  ${lane(ZEN.name+' · IT partner','Retainer · integrations, servers, email, APIs',zp.map(u=>`<span class="row nw" style="gap:6px">${av(u.name,'s')}<span class="sm"><b>${h(u.name)}</b> <span class="mut xs">${h(u.title||'')}</span></span></span>`).join(''),cz,'partner','var(--p)')}
  ${lane('Own team','In-house · bug checks, website changes, landing pages',(tm.length?tm:[{name:nm('himanshu'),designation:'IT & Landing pages'}]).map(e=>`<span class="row nw" style="gap:6px">${av(e.name,'s')}<span class="sm"><b>${h(String(e.name).split(' ')[0])}</b> <span class="mut xs">${h(e.designation||'')}</span></span></span>`).join(''),cm,'team','var(--b)')}</div>
 <div class="note"><b>How it works:</b> Give task → they tap <b>Start</b> → they send it for your check with a proof link → you <b>Approve</b> (or send it back). ${ZEN.name} only sees ${ZEN.name} tasks; every update is kept on the task, so no WhatsApp follow-ups needed.</div>
 ${chips([['all','All',A0.filter(t=>t.status!=='Done').length],['zen',ZEN.name,cz.open],['team','Own team',cm.open],['check','Needs your check',cz.check+cm.check],['late','Late',cz.late+cm.late],['done','Done',cz.done+cm.done]],f,'itF')}
 <div style="margin:10px 0 12px">${chips([['board','Board'],['list','List']],v,'itV')}</div>
 ${!A0.length?`<div class="list">${empty('No IT tasks yet','Tap “Give task” to send the first one to '+ZEN.name+' or your team')}</div>`:v==='board'&&f!=='done'?itBoard(L):`<div class="list">${L.map(itRow).join('')||empty('Nothing here')}</div>`}
 ${adm?`<div class="fab"><button data-a="itNew" aria-label="Give IT task">${ic('plus')}</button></div>`:''}`}
function itPartnerView(){const L=IT.tasks.filter(t=>t.doer==='partner'),c=itCounts(L),f=S.itf2||'open';const F=f==='open'?L.filter(t=>!['Check','Done'].includes(t.status)):f==='check'?L.filter(t=>t.status==='Check'):L.filter(t=>t.status==='Done');
 return `<div class="card" style="background:linear-gradient(135deg,#2a1240,#6E2E8E);color:#fff"><div class="row nw"><div style="flex:1"><div class="xs" style="opacity:.8">${ZEN.name} × JDAC Sales Pvt Ltd</div><h1 style="color:#fff;margin:4px 0">Hi ${h(nmF(S.me))}</h1><div class="sm" style="opacity:.9">${c.open} open · ${c.late} late · ${c.check} waiting for JDAC</div></div>${LIVE?`<button class="btn sm sec" data-a="lvOut">Log out</button>`:''}</div></div>
 <div class="note">Tap a task → <b>Start</b> when you begin → add updates as you go → <b>Send for check</b> with a proof link (page URL, screenshot or Drive link). JDAC closes it after checking.</div>
 ${chips([['open','To do & working',L.filter(t=>!['Check','Done'].includes(t.status)).length],['check','With JDAC',c.check],['done','Done',c.done]],f,'itF2')}
 <div class="list" style="margin-top:10px">${F.sort((a,b)=>(a.due||'9').localeCompare(b.due||'9')).map(itRow).join('')||empty('Nothing here','New tasks from JDAC show up here')}</div>`}

/* ---------- task sheet ---------- */
A.itOpen=e=>{const t=IT.tasks.find(x=>String(x.id)===String(e.dataset.id));if(!t)return;const adm=isAdm()&&!isZen(),doer=isZen()?t.doer==='partner':String(t.owner_emp)===String(S.me)||(!LIVE&&t.owner_emp===S.me)||(LIVE&&IT.me&&String(t.owner_emp)===String(IT.me.id));
 const cur=t.status==='Done'?4:Math.max(0,IT_FLOW.indexOf(t.status==='Stuck'?'To do':t.status));
 let btns='';
 if(t.status!=='Done'&&doer){if(['To do','Stuck'].includes(t.status))btns+=`<button class="btn" style="flex:1" data-a="itGo" data-id="${t.id}" data-n="Working">Start</button>`;if(t.status==='Working')btns+=`<button class="btn" style="flex:1" data-a="itGo" data-id="${t.id}" data-n="Check">Send for check</button>`;if(t.status!=='Stuck'&&t.status!=='Check')btns+=`<button class="btn sec" data-a="itGo" data-id="${t.id}" data-n="Stuck">Stuck</button>`}
 if(adm&&t.status==='Check')btns=`<button class="btn" style="flex:1;background:var(--g)" data-a="itGo" data-id="${t.id}" data-n="Done">Approve ✓</button><button class="btn sec" data-a="itGo" data-id="${t.id}" data-n="Working">Send back</button>`;
 if(adm&&t.status==='Done')btns=`<button class="btn sec" style="flex:1" data-a="itGo" data-id="${t.id}" data-n="Working">Reopen</button>`;
 if(!btns&&adm&&['To do','Working','Stuck'].includes(t.status))btns=`<div class="pill" style="flex:1;justify-content:center;min-height:46px">${t.status==='Stuck'?'Stuck · write an update to help':'With '+h(itOwnerName(t))+' · you approve once it is sent for check'}</div>`;
 if(!btns&&t.status==='Check')btns=`<div class="pill a" style="flex:1;justify-content:center;min-height:46px">Waiting for JDAC to check</div>`;
 sheet(`<div class="row" style="gap:6px">${isZen()?'':itDoer(t)}${pill(t.kind||'Other')}${pill(itSite(t.site))}${t.priority==='High'?pill('High priority','r'):''}</div><h2 style="margin-top:10px">${h(t.title)}</h2>
 <div class="row nw" style="margin-top:8px">${av(itOwnerName(t))}<div class="sm"><b>${h(itOwnerName(t))}</b><div class="mut">given by ${h(t.created_by_name||'JDAC')} · ${t.due?'due '+fmtY(t.due):'no due date'}${itLate(t)?` · <b style="color:var(--r)">late</b>`:''}</div></div></div>
 ${trk(['To do','Working','JDAC check','Done'],cur)}
 ${t.detail?`<p class="sm" style="background:var(--bg);border-radius:12px;padding:10px 12px;white-space:pre-wrap">${h(t.detail)}</p>`:''}
 ${t.link?`<div class="sm" style="margin:6px 0">Reference: <a href="${h(t.link)}" target="_blank" rel="noopener">${h(t.link)}</a></div>`:''}
 ${t.proof?`<div class="sm" style="margin:6px 0">Proof: <a href="${h(t.proof)}" target="_blank" rel="noopener">${h(t.proof)}</a></div>`:''}
 ${t.status!=='Done'&&doer?`<label for="itpr">Proof link · page, screenshot or Drive (needed to send for check)</label><input id="itpr" value="${h(t.proof||'')}" placeholder="https://">`:''}
 <div class="row" style="margin-top:14px">${btns}</div>
 <label style="margin-top:16px">Updates</label><div class="list">${(t.notes||[]).map(n=>`<div class="li"><div class="tx"><b class="sm">${h(n.by_name||'')}</b> <span class="xs mut">${h(String(n.created_at||'').slice(0,16).replace('T',' '))}</span><div class="sm">${h(n.text)}</div></div></div>`).join('')||'<div class="empty xs">No updates yet</div>'}</div>
 ${t.status!=='Done'?`<div class="row nw" style="margin-top:8px"><input id="itnt" placeholder="Write an update or question…" style="flex:1"><button class="btn sm" data-a="itNote" data-id="${t.id}">Send</button></div>`:''}
 ${adm&&t.status!=='Done'?`<details style="margin-top:14px"><summary class="sm" style="cursor:pointer;font-weight:700">Change due date / person</summary><div class="grid g2"><div><label for="itedu">Due</label><input id="itedu" type="date" value="${t.due||''}"></div><div><label for="iteo">Person</label><select id="iteo">${t.doer==='partner'?(IT.users||[]).map(u=>`<option value="${u.id}" ${u.id===t.owner_partner?'selected':''}>${h(u.name)} · ${ZEN.name}</option>`).join(''):IT.team.map(e=>`<option value="${e.id}" ${String(e.id)===String(t.owner_emp)?'selected':''}>${h(e.name)}</option>`).join('')}</select></div></div><button class="btn sec w" style="margin-top:8px" data-a="itEdit" data-id="${t.id}">Save change</button></details>`:''}`)};
const itTry=async(f,ok)=>{try{await f();if(ok)toast(ok)}catch(x){toast(x.message)}};
A.itGo=e=>itTry(async()=>{const id=e.dataset.id,n=e.dataset.n;await itCall('POST','/api/it/tasks/'+id+'/status',{status:n,proof:document.getElementById('itpr')?val('itpr'):undefined,note:''});closeM();render()},{Working:'Started',Check:'Sent to JDAC for check',Done:'Approved ✓',Stuck:'Marked stuck · JDAC can see it'}[e.dataset.n]);
A.itNote=e=>itTry(async()=>{const x=val('itnt');if(!x)throw new Error('Write the update');await itCall('POST','/api/it/tasks/'+e.dataset.id+'/note',{text:x});A.itOpen(e)},'Update sent');
A.itEdit=e=>itTry(async()=>{const t=IT.tasks.find(x=>String(x.id)===String(e.dataset.id)),o=val('iteo');await itCall('POST','/api/it/tasks/'+t.id,{due:val('itedu')||null,...(t.doer==='partner'?{owner_partner:+o}:{owner_emp:LIVE?+o:o})});closeM();render()},'Saved');
A.itF=e=>{S.itf=e.dataset.t;render()};A.itV=e=>{S.itv=e.dataset.t;render()};A.itF2=e=>{S.itf2=e.dataset.t;render()};A.itRe=()=>{IT.at=0;itLoad(true)};

/* ---------- give a task ---------- */
A.itNew=e=>{const d=(e&&e.dataset&&e.dataset.d)||S.itd||'partner';S.itd=d;const due=addD(TODAY,2);
 sheet(`<h2>Give IT task</h2><label>Who does it?</label><div class="grid g2" style="gap:8px">${[['partner',ZEN.name,'IT partner · integrations, servers, APIs','var(--p)'],['team','Own team','Bug checks, website changes','var(--b)']].map(x=>`<button type="button" class="card" data-a="itWho" data-d="${x[0]}" style="margin:0;text-align:left;border:2px solid ${d===x[0]?x[3]:'transparent'};cursor:pointer"><b style="color:${x[3]}">${x[1]}</b><div class="xs mut">${x[2]}</div></button>`).join('')}</div>
 <label>Type of work</label>${opts('itk',IT_KINDS.map(k=>[k,k]),d==='partner'?'Integration':'Bug / fix')}
 <label>Which website / system?</label>${opts('its',IT_SITES.map(x=>[x[0],x[1]]),'jdac.in')}
 <label for="itt">What needs to be done?</label><input id="itt" placeholder="${d==='partner'?'e.g. Integrate WhatsApp Business API in the tracker':'e.g. Check jdac.in booking page on mobile for bugs'}">
 <label for="itd">Details · what is wrong / what to build / expected result</label><textarea id="itd" placeholder="Steps, page, what you expect when it is done"></textarea>
 <label for="itl">Reference link · page URL, screenshot or Drive (optional)</label><input id="itl" placeholder="https://">
 <label>Person</label>${d==='partner'?opts('ito',(IT.users||[]).filter(u=>u.active!==false).map(u=>[String(u.id),u.name+' · '+(u.title||'')]),String(((IT.users||[])[0]||{}).id||'')):`<select id="itos">${IT.team.map(x=>`<option value="${x.id}" ${/himanshu/i.test(x.name)?'selected':''}>${h(x.name)}${x.designation?' · '+h(x.designation):''}</option>`).join('')}</select>`}
 <label>Due</label>${opts('itdu',[[TODAY,'Today'],[addD(TODAY,1),'Tomorrow'],[addD(TODAY,3),'In 3 days'],[addD(TODAY,7),'Next week']],'')}<input id="itdd" type="date" value="${due}" style="margin-top:8px" aria-label="Due date">
 <label class="row nw" style="color:var(--ink);font-weight:600"><input type="checkbox" id="itp" style="width:20px;min-height:20px"> High priority</label>
 <button class="btn w" style="margin-top:14px" data-a="itSave">Give to ${d==='partner'?ZEN.name:'team'}</button>`)};
A.itWho=e=>{S.itd=e.dataset.d;A.itNew(e)};
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#itdu button');if(b){const i=document.getElementById('itdd');if(i)i.value=b.dataset.k}},true);
A.itSave=()=>itTry(async()=>{const d=S.itd||'partner',t=val('itt');if(!t)throw new Error('Write what needs to be done');const site=pick1('its')||'other';
 const b={title:t,detail:val('itd'),link:val('itl'),doer:d,partner:'zenmeg',kind:pick1('itk')||'Other',site,company:(IT_SITES.find(x=>x[0]===site)||[])[2]||'studios',priority:document.getElementById('itp').checked?'High':'Normal',due:val('itdd')};
 if(d==='partner')b.owner_partner=+(pick1('ito')||0)||undefined;else{const o=val('itos');if(!o)throw new Error('Choose who in your team will do it');b.owner_emp=LIVE?+o:o}
 await itCall('POST','/api/it/tasks',b);closeM();S.itf=d==='partner'?'zen':'team';render()},'Task given to '+((S.itd||'partner')==='partner'?ZEN.name:'your team'));

/* ---------- Zenmeg logins (admin) ---------- */
A.itLogins=()=>{const U=IT.users||[];sheet(`<h2>${ZEN.name} logins</h2><p class="sm mut">They open the same JDAC Parent link and log in with these IDs. They see only ${ZEN.name} tasks — no staff, attendance, money or chats.</p>
 <div class="note">Link: <b>https://jdaclogistics-web.github.io/JDACTracker/</b></div>
 ${U.map(u=>`<div class="card" style="margin:8px 0"><div class="row nw">${av(u.name)}<div style="flex:1"><b>${h(u.name)}</b> <span class="xs mut">${h(u.title||'')}</span><div class="sm">Login ID: <b>${h(u.username)}</b> · ${u.has_password?pill('Password set','g'):pill('Password not set','a')}${u.active===false?' '+pill('Blocked','r'):''}</div>${u.last_login_at?`<div class="xs mut">Last login ${h(String(u.last_login_at).slice(0,16).replace('T',' '))}</div>`:''}</div></div>
  ${LIVE&&LV.tok&&!isAdm()?'':`<div class="row nw" style="margin-top:8px"><input id="itpw${u.id}" placeholder="New password (min 6)" style="flex:1"><button class="btn sm" data-a="itPw" data-id="${u.id}">Set</button><button class="btn sm sec" data-a="itBlk" data-id="${u.id}" data-on="${u.active===false?1:0}">${u.active===false?'Unblock':'Block'}</button></div>`}</div>`).join('')}
 <p class="xs mut">Setting a new password logs them out everywhere. Share the ID and password with Nayan / Krishna yourself.</p>`)};
A.itPw=e=>itTry(async()=>{const p=val('itpw'+e.dataset.id);if(p.length<6)throw new Error('Password must be at least 6 characters');if(LIVE&&LV.tok)await lapi('POST','/api/it/partners',{id:+e.dataset.id,password:p});else await itCall('POST','/api/it/partners',{id:+e.dataset.id,password:p});await itUsers();A.itLogins()},'Password set');
A.itBlk=e=>itTry(async()=>{const on=e.dataset.on==='1';if(LIVE&&LV.tok)await lapi('POST','/api/it/partners',{id:+e.dataset.id,active:on});else await itCall('POST','/api/it/partners',{id:+e.dataset.id,active:on});await itUsers();A.itLogins()},'Saved');
async function itUsers(){if(LIVE&&LV.tok){try{const r=await lapi('GET','/api/it/partners');IT.users=r.users}catch(x){}}}
const _itl=A.itLogins;A.itLogins=async()=>{await itUsers();_itl()};

/* ---------- live login for Zenmeg (IDs start with ZEN-) ---------- */
if(LIVE){
 const _lvIn=A.lvIn;A.lvIn=async()=>{const u=val('lvu');if(!/^zen-/i.test(u))return _lvIn();const p=document.getElementById('lvp').value;LV.u=u;if(!p){LV.err='Enter your password';return render()}LV.busy=true;LV.err='';render();
  try{const r=await lapi('POST','/api/partner/login',{username:u.trim(),password:p});LV.tok=r.token;LV.me=r.me;localStorage.setItem('jdac_token',r.token);localStorage.setItem('jdac_me',JSON.stringify(r.me));LV.busy=false;await lvLoad()}catch(x){LV.busy=false;LV.err=x.message;render()}};
 const _lvLoad=lvLoad;lvLoad=async function(){if(!LV.me||LV.me.role!=='partner')return _lvLoad();LV.busy=true;render();
  const k=/nayan/i.test(LV.me.name)?'nayan':/krishna/i.test(LV.me.name)?'krishna':'zen'+LV.me.id;if(!P[k])P[k]={n:LV.me.name,r:ZEN.name+' · '+(LV.me.title||''),team:'Zenmeg',kind:'partner',work:['it']};
  S.me=k;S.v='itdesk';D.emp=[];D.att=[];D.leave=[];IT.at=0;try{await itLoad(true);LV.ok=true;LV.at=new Date()}catch(x){LV.err=x.message}LV.busy=false;render()};
 const _whoZ=A.whoSheet;A.whoSheet=()=>{if(LV.me&&LV.me.role==='partner')return sheet(`<h2>${h(LV.me.name)}</h2><p class="mut sm">${ZEN.name} · ${h(LV.me.username)}</p><button class="btn sec w" data-a="itRe">Refresh</button><button class="btn w" style="margin-top:8px;background:var(--r)" data-a="lvOut">Log out</button>`);return _whoZ()};
 /* while a partner is logged in, every screen is the Zenmeg desk only */
 const _rZ=render;render=function(){if(LV.me&&LV.me.role==='partner'&&LV.ok&&S.v!=='itdesk')S.v='itdesk';return _rZ.apply(this,arguments)};
 /* on the login page, hint the partner ID format */
 const _lh=lvLoginHTML;lvLoginHTML=function(){return _lh().replace('Employee ID (or username / mobile number) and your password.','Employee ID (or username / mobile number) and your password. IT partner (Zenmeg): use your ZEN- login ID.')};
}
/* preview: the person switcher shows the Zenmeg logins too */
if(!LIVE&&typeof A.whoSheet==='function'){const _ws=A.whoSheet;A.whoSheet=()=>{_ws();const s=document.querySelector('.sheet');if(s&&!s.querySelector('[data-k="krishna"]'))s.insertAdjacentHTML('beforeend',`<div class="xs mut" style="font-weight:700;margin-top:12px">${ZEN.name.toUpperCase()} · IT PARTNER</div>${['nayan','krishna'].map(k=>`<button class="li tap" style="width:100%;text-align:left" data-a="whoSet" data-k="${k}">${av(P[k].n)}<div class="tx"><b>${h(P[k].n)}</b><div class="m">${h(P[k].r)}</div></div></button>`).join('')}`)}}
render();
