/* ===== Who sees what: only Darshan and Nameera see everything =====
   Everyone else: Dashboard · Tasks (only projects they are a member of) · Communication (only their company,
   executives only their own customers) · Tool Section → Contacts (no team / HR employer / partner contacts) and Settings. */
const TOP=['darshan','nameera'];const isTop=()=>TOP.includes(S.me);
const STAFF_V=['home','tasks','chat','more','settings','contacts','me'];
/* extra sections for named people: Snehal Z handles Accounts */
const EXTRA_V={snehalz:['money']};const myV=()=>[...STAFF_V,...(EXTRA_V[S.me]||[])];
/* an HR or boss login that is not Darshan / Nameera is treated as staff */
const accNorm=()=>{const p=P[S.me];if(p&&!isTop()&&!(EXTRA_V[S.me]||[]).includes('money')&&['hr','boss','acc'].includes(p.kind)){p.kind0=p.kind;p.kind='staff'}};
const _allowedAC=allowed;allowed=function(v){if(isTop()||isZen())return _allowedAC(v);return myV().includes(v)};
const _tabsAC=tabsFor;tabsFor=function(who){const T=_tabsAC(who);if(TOP.includes(who||S.me)||isZen())return T;const me2=who||S.me,V2=[...STAFF_V,...(EXTRA_V[me2]||[])],L=T.filter(x=>V2.includes(x[0]));if((EXTRA_V[me2]||[]).includes('money')&&!L.some(x=>x[0]==='money'))L.push(['money','Accounts','rupee']);['home','tasks','chat'].forEach((k,i)=>{if(!L.some(x=>x[0]===k)){const n={home:['home','Dashboard','home'],tasks:['tasks','Tasks','t_tasks'],chat:['chat','Communication','chat']}[k];L.splice(i,0,n)}});return L};
const _renderAC=render;render=function(){accNorm();if(!isTop()&&!isZen()&&S.v&&!allowed(S.v))S.v='home';return _renderAC.apply(this,arguments)};
/* Tasks: only projects they are a member of */
const _myPAC=myProjects;myProjects=function(){if(isTop()||isZen())return _myPAC();return D.projects.filter(p=>(p.m||[]).includes(S.me))};
/* Contacts: no internal team, HR employers or partners */
const _myCAC=myContacts;myContacts=function(){const L=_myCAC();if(isTop())return L;return L.filter(c=>!['Team','Employer','Partner'].includes(c.type))};
/* side menu: fixed in place, never scrolls; tighter on short screens so everything fits */
document.head.insertAdjacentHTML('beforeend',`<style>.sb{overflow:hidden!important;overscroll-behavior:contain}
@media (max-height:860px){.sb{padding-top:10px!important;padding-bottom:10px!important}.sb-nav{gap:0!important}.sb-nav>a,.sb-nav>button,.sb-nav .sbi,.sb-sub>a,.sb-sub>button{padding-top:7px!important;padding-bottom:7px!important}.sb-logo{width:130px!important}}
@media (max-height:720px){.sb-nav>a,.sb-nav>button,.sb-nav .sbi,.sb-sub>a,.sb-sub>button{padding-top:5px!important;padding-bottom:5px!important;font-size:13.5px}}</style>`);
/* Tasks: Timeline only for Darshan and Nameera */
const _tHeadAC=taskHead;taskHead=function(me){const o=_tHeadAC(me);return isTop()?o:o.replace(/<button[^>]*data-t="time"[\s\S]*?<\/button>/,'')};
const _vtAC=V.tasks;V.tasks=()=>{if(!isTop()&&S.ttab==='time')S.ttab='proj';return _vtAC()};
/* Tasks for staff: only their own tasks and tasks in projects they are a member of; no Forms tab */
const _myTAC=myTasks;myTasks=function(){if(isTop()||isZen())return _myTAC();const mp=new Set(myProjects().map(p=>p.id));return D.tasks.filter(t=>t.o===S.me||t.by===S.me||(t.cc||[]).includes(S.me)||mp.has(t.proj))};
const _tHeadAC2=taskHead;taskHead=function(me){const o=_tHeadAC2(me);return isTop()?o:o.replace(/<button[^>]*data-t="forms"[\s\S]*?<\/button>/,'')};
const _vtAC2=V.tasks;V.tasks=()=>{if(!isTop()&&S.ttab==='forms')S.ttab='proj';return _vtAC2()};
/* side menu never scrolls: mouse wheel over it does nothing */
document.addEventListener('wheel',e=>{if(e.target.closest&&e.target.closest('.sb'))e.preventDefault()},{passive:false});
/* App blueprint: one Darshan only */
const _vbpAC=V.blueprint;V.blueprint=()=>{if(Array.isArray(BPL.list)){const ds=BPL.list.filter(e=>/^darshan/i.test(e.name||''));if(ds.length>1){const keep=ds.find(e=>e.username==='darshan'||e.role==='boss')||ds[0];BPL.list=BPL.list.filter(e=>!/^darshan/i.test(e.name||'')||e===keep);keep.name='Darshan Soni'}}return _vbpAC()};
/* photo from the name card at the top right */
const _whoAC=A.whoSheet;A.whoSheet=function(){_whoAC.apply(this,arguments);setTimeout(()=>{const sh=document.querySelector('.sheet');if(!sh||sh.querySelector('.phrow2'))return;const my=D.photos[S.me];sh.insertAdjacentHTML('afterbegin',`<div class="phrow2">${av(nm(S.me),'l')}<div><label class="btn sm" for="phIn" style="cursor:pointer">${my?'Change my photo':'Add my photo'}</label><input id="phIn" type="file" accept="image/*" hidden>${my?' <button class="btn sm sec" data-a="phDel">Remove</button>':''}</div></div>`)},30)};
document.head.insertAdjacentHTML('beforeend',`<style>.phrow2{display:flex;align-items:center;gap:12px;margin:0 0 12px;padding-bottom:12px;border-bottom:1px solid var(--line)}.phrow2 label.btn{color:#fff!important;margin:0;display:inline-flex;align-items:center}.phrow2 .av{width:54px!important;height:54px!important;font-size:18px!important}</style>`);
/* people who have left (Exited in the employee master) drop off every people list: owners, assignees, scoreboard, settings */
(()=>{const gone=(D.emp||[]).filter(e=>e.st==='Exited'&&e.k).map(e=>e.k);for(let i=STAFF.length-1;i>=0;i--)if(gone.includes(STAFF[i]))STAFF.splice(i,1)})();
/* Settings for staff: only Light (day / night / eye), View (fit / centre / split) and My account */
const _stAC=V.settings;V.settings=()=>{const o=_stAC();if(isTop())return o;
 return o.replace(/<details class="bpsec bpdd"[\s\S]*?<\/details>/g,m=>{const k=(m.match(/data-k="([^"]+)"/)||[])[1]||'';return ['uLight','uView','sAcc'].includes(k)?m:''})};
/* people no longer with us: off every people list (pickers, owners, Scoreboard, incentives, chat members) */
const GONE=['tejas','raihan','priyanka','ashish','zaman','sushil','jayashree','catherine','atul'];
(()=>{const act=new Set((D.emp||[]).filter(e=>e.st==='Active').map(e=>e.k));for(let i=STAFF.length-1;i>=0;i--){const k=STAFF[i],f=String((P[k]||{}).n||k).trim().split(/\s+/)[0].toLowerCase();if(!act.has(k)&&!TOP.includes(k)&&GONE.includes(f))STAFF.splice(i,1)}})();
/* App blueprint: Login credentials section removed (it lives in HR Desk → Employee Master) */
const _vbpAC2=V.blueprint;V.blueprint=()=>_vbpAC2().replace(/<details class="bpsec bpdd"[^>]*>\s*<summary class="bph" data-a="bpO" data-k="l"[\s\S]*?<\/details>/,'');
