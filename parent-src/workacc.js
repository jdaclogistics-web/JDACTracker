/* ===================== WORK ACCESS: which company tabs each employee can open (View or Edit) =====================
   Set by Darshan / Nameera in HR Desk → Employee Master → Work access. Kept on the server so it follows the
   employee to every device. Everyone keeps Dashboard, Tasks, CRM (their company), Communication and Tool Section;
   under Companies they see only the companies and tabs ticked for them. */
const WK_DEF={omadsul:{'log:pick':'edit','log:ship':'edit','log:carriers':'edit'},mohin:{'log:pick':'edit','log:ship':'edit','log:carriers':'edit'},
 shubham:{'log:pick':'edit','log:ship':'edit','log:carriers':'edit','jup:deliv':'edit','jup:equip':'edit'},zubair:{'jup:deliv':'edit','jup:equip':'edit','jup:renew':'edit'},
 swapnil:{'studios:sm':'edit','studios:crl':'edit'},omparvate:{'studios:pm':'edit','studios:crl':'edit'},himanshu:{'studios:it':'edit','studios:crl':'edit'}};
if(!D.st)D.st={};if(!D.st.wacc)D.st.wacc=[];
/* Logistics: the pickups tab is the Operations desk */
CTABS.log=CTABS.log.map(x=>x[0]==='pick'?['pick','Operations']:x);
/* Snehal Z (Accounts) sees every company: money tabs to work in, the rest view only */
(()=>{const M=['dash','money','inv','pur','exp','settle','mis'],a={};COK.forEach(c=>CTABS[c].forEach(t=>{a[c+':'+t[0]]=M.includes(t[0])?'edit':'view'}));WK_DEF.snehalz=a})();
const wkRow=k=>(D.st.wacc||[]).find(r=>r.id===k&&!r.deleted);
const wkOf=k=>{const r=wkRow(k);return r?(r.a||{}):(WK_DEF[k]||{})};
const wkLvl=(co,t,k=S.me)=>isTop()?'edit':wkOf(k)[co+':'+t]||'';
const wkCos=(k=S.me)=>isTop()?COK.slice():COK.filter(c=>Object.keys(wkOf(k)).some(x=>x.startsWith(c+':')&&wkOf(k)[x]));
/* pull from the server once signed in */
(function waPullLoop(){let n=0;const t=setInterval(()=>{n++;if(typeof LV!=='undefined'&&LV.ok&&typeof stPull==='function'){clearInterval(t);stPull('wacc')}else if(n>40)clearInterval(t)},1500)})();
/* menu: Companies for staff who have work there; the old "Studios" item goes (it is under Companies now) */
const _allowedWA=allowed;allowed=function(v){if(v==='co'&&!isTop()&&!isAdm())return wkCos().length>0;if(v==='studio'&&!isTop())return false;return _allowedWA(v)};
const _tabsWA=tabsFor;tabsFor=function(who){const T=_tabsWA(who).filter(x=>x[0]!=='studio');if((!who||who===S.me)&&!isTop()&&!isAdm()&&wkCos().length&&!T.some(x=>x[0]==='co')){const i=T.findIndex(x=>x[0]==='chat');T.splice(i>=0?i+1:T.length,0,['co','Companies','work'])}return T};
const _coDropWA=coDrop;coDrop=function(){if(isAdm())return _coDropWA();const L=wkCos();if(!L.length)return '';const open=S.sbco==null?S.v==='co':S.sbco;
 return `<button class="sb-more ${open?'op':''}" data-a="sbCo" aria-expanded="${open}" title="Companies">${ic('work')}<span>Companies</span><i class="chev">${ic('right')}</i></button>${open?`<div class="sb-sub">${L.map(k=>`<button data-a="co" data-k="${k}" class="${S.v==='co'&&S.co===k?'on':''}" title="${h(CO[k].n)}"><span class="cdot" style="background:${CO[k].c};width:10px;height:10px;border-radius:50%;display:inline-block;flex:none"></span><span>${h({gb:'GovaaBazaar',log:'Logistics',jup:'Jupiter',hr:'HR Consultancy',studios:'Studios'}[k])}</span></button>`).join('')}</div>`:''}`};
V.studio=()=>{S.v='co';S.co='studios';return V.co()};
const _vContentWA=V.content;V.content=()=>{if(isTop())return _vContentWA();if(wkLvl('studios','sm')){S.v='co';S.co='studios';S.tab='sm';return V.co()}S.v='home';return V.home()};
/* company page for staff: only their tabs; view-only tabs are marked and locked */
const _coPageWA=coPage;coPage=function(staff){if(isTop()||isAdm())return _coPageWA(staff);
 const L=wkCos();if(!L.includes(S.co))S.co=L[0];const k=S.co,all=CTABS[k],mine=all.filter(x=>wkLvl(k,x[0]));if(!mine.length)return empty('No access','Ask Darshan or Nameera for access');
 if(!mine.some(x=>x[0]===S.tab))S.tab=mine[0][0];CTABS[k]=mine;let o;try{o=_coPageWA(false)}finally{CTABS[k]=all}
 if(wkLvl(k,S.tab)==='view'){const t=document.createElement('template');t.innerHTML=o;t.content.querySelectorAll('[data-a]').forEach(b=>{if(!WK_NAV.test(b.dataset.a)&&WK_WRITE.test(b.dataset.a))b.classList.add('rohide')});t.content.querySelectorAll('input[type=file]').forEach(x=>{const l=x.closest('label');(l||x).classList.add('rohide')});o=t.innerHTML}
 return wkLvl(k,S.tab)==='view'?`<div class="coro">${o.replace(/(<div class="chips" role="tablist">[\s\S]*?<\/div>)/,'$1<div class="rotag">'+ic('lock')+'View only · ask Darshan or Nameera for edit access</div>')}</div>`:o};
Object.assign(I,{lock:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'});
/* view-only: anything that saves, adds, moves or deletes is blocked (also inside pop-ups opened from there) */
const WK_NAV=/^(tab|go|co|closeM|toast|sbCo|sbM|sbT|whoSheet)$/;
const WK_WRITE=/(New|Save|Del|Next|Add|Create|Ok$|Post|Set|Done|Pay|Approve|Assign|Mark|Swap|Book|Upload|Edit|Reset|Close|Send|punch|Go$|Step|Move|Remove|Cancel|Confirm|Status|St$)/i;
let WK_RO=false;
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a||'',inRo=!!b.closest('.coro'),inSheet=!!b.closest('.sheet');
 if(inRo){if(WK_NAV.test(a))return;WK_RO=true;if(WK_WRITE.test(a)){e.preventDefault();e.stopImmediatePropagation();toast('View only · ask Darshan or Nameera for edit access')}return}
 if(inSheet&&WK_RO){if(WK_WRITE.test(a)){e.preventDefault();e.stopImmediatePropagation();toast('View only · ask Darshan or Nameera for edit access')}return}
 if(!inSheet)WK_RO=false},true);
document.addEventListener('change',e=>{if(e.target.closest&&(e.target.closest('.coro')||(WK_RO&&e.target.closest('.sheet')))&&e.target.type==='file'){e.stopImmediatePropagation();e.target.value='';toast('View only')}},true);

/* ---------- HR Desk → Employee Master → Work access ---------- */
const WK_CO=()=>COK.map(k=>[k,CO[k].n,CTABS[k].filter(x=>!['dash'].includes(x[0])||true)]);
function WKacc(){const E=(D.emp||[]).filter(e=>e.st==='Active'&&e.k&&!TOP.includes(e.k)).sort((a,b)=>String(a.n).localeCompare(String(b.n)));
 const cell=(e,k)=>{const a=wkOf(e.k),T=CTABS[k].filter(x=>a[k+':'+x[0]]);return T.length?T.map(x=>`<span class="wap ${a[k+':'+x[0]]}">${h(x[1])}${a[k+':'+x[0]]==='view'?' · view':''}</span>`).join(''):'<span class="mut xs">—</span>'};
 return `<div class="note" style="margin-top:4px">Tick which company tabs each person can open. <b>Edit</b> = can work in it. <b>View</b> = can only look. Everyone always has Dashboard, Tasks, Communication and Tool Section, plus the CRM of their own company. Darshan and Nameera see everything.</div>
 <div class="sttw" style="margin-top:12px"><table class="sttbl watbl"><thead><tr><th>Employee</th>${COK.map(k=>`<th><span class="stdot" style="background:${CO[k].c}"></span>${h(coShort(k))}</th>`).join('')}<th></th></tr></thead><tbody>${E.map(e=>`<tr data-a="waOpen" data-k="${e.k}" tabindex="0"><td><b>${h(e.n)}</b><small>${h(e.desig||'')}</small></td>${COK.map(k=>`<td>${cell(e,k)}</td>`).join('')}<td class="n"><span class="lnk">Set ›</span></td></tr>`).join('')}</tbody></table></div>`}
A.waOpen=e=>{const k=e.dataset.k,a=wkOf(k),em=(D.emp||[]).find(x=>x.k===k)||{n:nm(k)};
 sheet(`<h2>Work access · ${h(em.n)}</h2><p class="mut sm">${h(em.desig||'')} · pick None, View or Edit for each tab.</p>${COK.map(c=>`<div class="wasec"><div class="wah"><span class="stdot" style="background:${CO[c].c}"></span><b>${h(CO[c].n)}</b><span class="sp"></span><button class="lnk xs" data-a="waAll" data-k="${k}" data-c="${c}" data-l="edit">All edit</button><button class="lnk xs" data-a="waAll" data-k="${k}" data-c="${c}" data-l="">None</button></div>${CTABS[c].map(t=>{const l=a[c+':'+t[0]]||'';return `<div class="war"><span>${h(t[1])}</span><div class="waseg">${[['','None'],['view','View'],['edit','Edit']].map(([v,lb])=>`<button class="${l===v?'on':''} ${v}" data-a="waSet" data-k="${k}" data-x="${c}:${t[0]}" data-l="${v}">${lb}</button>`).join('')}</div></div>`}).join('')}</div>`).join('')}
 <button class="btn sec w" style="margin-top:12px" data-a="waReset" data-k="${k}">Reset to suggested access</button>`)};
function wkPut(k,a){let r=wkRow(k);if(!r){r={id:k,a:{}};D.st.wacc.push(r)}r.a=a;save();if(typeof stPush==='function')stPush('wacc',r)}
A.waSet=e=>{const k=e.dataset.k,a={...wkOf(k)};if(e.dataset.l)a[e.dataset.x]=e.dataset.l;else delete a[e.dataset.x];wkPut(k,a);A.waOpen(e);render()};
A.waAll=e=>{const k=e.dataset.k,c=e.dataset.c,a={...wkOf(k)};CTABS[c].forEach(t=>{if(e.dataset.l)a[c+':'+t[0]]=e.dataset.l;else delete a[c+':'+t[0]]});wkPut(k,a);A.waOpen(e);render()};
A.waReset=e=>{const k=e.dataset.k;wkPut(k,{...(WK_DEF[k]||{})});A.waOpen(e);render();toast('Back to suggested access')};
/* add the tab to HR Desk → Employee Master */
HRG.forEach(g=>{if(g[0]==='ge'&&!g[2].includes('wacc'))g[2].push('wacc')});
const _peopleWA=V.people;V.people=()=>{const isW=S.ptab==='wacc';if(isW){if(!isTop())S.ptab='master';else S.ptab='login'}let o=_peopleWA();if(!isW||!isTop())return o;S.ptab='wacc';
 const t=document.createElement('template');t.innerHTML=o;const sub=t.content.querySelector('.hrsub');
 if(sub){sub.querySelectorAll('button').forEach(b=>{b.classList.remove('on');b.setAttribute('aria-selected','false')});sub.insertAdjacentHTML('beforeend',`<button role="tab" aria-selected="true" class="on" data-a="ptab" data-t="wacc">Work access</button>`);
  let n=sub.nextSibling;while(n){const nx=n.nextSibling;n.remove();n=nx}sub.insertAdjacentHTML('afterend',WKacc())}
 return t.innerHTML};
const _peopleWA2=V.people;V.people=()=>{const o=_peopleWA2();if(!isTop()||S.ptab==='wacc'||!/data-t="login"/.test(o))return o;return o.replace(/(<button[^>]*data-a="ptab" data-t="login"[\s\S]*?<\/button>)/,'$1<button role="tab" aria-selected="false" class="" data-a="ptab" data-t="wacc">Work access</button>')};
document.head.insertAdjacentHTML('beforeend',`<style>
.coro .rohide{display:none!important}
.coro .rotag{display:inline-flex;align-items:center;gap:6px;margin:10px 0 0;padding:6px 12px;border-radius:999px;background:#FFF4E5;color:#8A5300;font-size:12.5px;font-weight:700}.coro .rotag svg{width:14px;height:14px}
.watbl td{vertical-align:top}.wap{display:inline-block;font-size:11.5px;font-weight:600;padding:2px 8px;border-radius:999px;margin:0 4px 4px 0;background:#E7F6EE;color:#13804B}.wap.view{background:#FFF4E5;color:#8A5300}
.wasec{border:1px solid var(--line);border-radius:14px;padding:10px 12px;margin-top:10px}.wah{display:flex;align-items:center;gap:8px;margin-bottom:6px}.wah .lnk{margin-left:8px}
.war{display:flex;align-items:center;gap:10px;padding:6px 0;border-top:1px solid var(--line)}.war span{flex:1;font-size:14px}
.waseg{display:inline-flex;background:var(--bg);border-radius:10px;padding:3px}.waseg button{border:0;background:none;padding:5px 12px;border-radius:8px;font:600 13px inherit;cursor:pointer;color:var(--mut)}
.waseg button.on{background:#fff;color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,.12)}.waseg button.on.edit{color:#13804B}.waseg button.on.view{color:#8A5300}
</style>`);
