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
