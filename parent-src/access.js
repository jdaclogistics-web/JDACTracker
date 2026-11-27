/* ===== Who sees what: only Darshan and Nameera see everything =====
   Everyone else: Dashboard · Tasks (only projects they are a member of) · Communication (only their company,
   executives only their own customers) · Tool Section → Contacts (no team / HR employer / partner contacts) and Settings. */
const TOP=['darshan','nameera'];const isTop=()=>TOP.includes(S.me);
const STAFF_V=['home','tasks','chat','more','settings','contacts','me'];
/* an HR or boss login that is not Darshan / Nameera is treated as staff */
const accNorm=()=>{const p=P[S.me];if(p&&!isTop()&&['hr','boss','acc'].includes(p.kind)){p.kind0=p.kind;p.kind='staff'}};
const _allowedAC=allowed;allowed=function(v){if(isTop()||isZen())return _allowedAC(v);return STAFF_V.includes(v)&&(['more','settings','contacts','me','home','tasks','chat'].includes(v))};
const _tabsAC=tabsFor;tabsFor=function(who){const T=_tabsAC(who);if(TOP.includes(who||S.me)||isZen())return T;const L=T.filter(x=>STAFF_V.includes(x[0]));['home','tasks','chat'].forEach((k,i)=>{if(!L.some(x=>x[0]===k)){const n={home:['home','Dashboard','home'],tasks:['tasks','Tasks','t_tasks'],chat:['chat','Communication','chat']}[k];L.splice(i,0,n)}});return L};
const _renderAC=render;render=function(){accNorm();if(!isTop()&&!isZen()&&S.v&&!allowed(S.v))S.v='home';return _renderAC.apply(this,arguments)};
/* Tasks: only projects they are a member of */
const _myPAC=myProjects;myProjects=function(){if(isTop()||isZen())return _myPAC();return D.projects.filter(p=>(p.m||[]).includes(S.me))};
/* Contacts: no internal team, HR employers or partners */
const _myCAC=myContacts;myContacts=function(){const L=_myCAC();if(isTop())return L;return L.filter(c=>!['Team','Employer','Partner'].includes(c.type))};
