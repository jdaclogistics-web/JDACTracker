/* ===================== MOBILE VIEW (phones only — the web view is untouched) =====================
   Below 820px wide the app switches to a phone layout, in the spirit of Swiggy / Zomato:
   · bottom bar: Home · Tasks · [Chat, raised in the middle] · CRM · More
   · More = a sheet of big tiles for every other section, companies included
   · Tasks open as a simple list (no drag-and-drop board on a phone)
   · CRM leads = stage chips on top + one full-width list, tap a lead to open it full screen
   · tables scroll sideways, no element spills off the screen */
const MOB_MQ=matchMedia('(max-width: 820px)');const isMob=()=>MOB_MQ.matches;
try{MOB_MQ.addEventListener('change',()=>render())}catch(x){MOB_MQ.addListener&&MOB_MQ.addListener(()=>render())}

/* ---------- bottom bar ---------- */
const MOB_ALL=[['money','Accounts','rupee','#1F9D55'],['wallet','JD Wallet','wallet','#7A2E8E'],['crm','CRM','users','#2563C9'],['people','HR Desk','users','#C2410C'],['camp','Campaigns','mega','#DB2777'],
 ['crl','Creative Library','pic','#0796A6'],['contacts','Contacts','book','#0E7490'],['me','Me','user','#24408E'],['settings','Settings','gear','#475467'],['kpi','KPIs','star','#B45309']];
const mobBadge=(old,v)=>{const b=old&&old.querySelector(`[data-v="${v}"] .bdg, [data-v="${v}"] .dot, [data-v="${v}"] [class*="dot"]`);return b?b.outerHTML:''};
function mobNav(){const nav=document.querySelector('.bnav');if(!nav)return;const old=nav.cloneNode(true);
 const third=allowed('crm')?['crm','CRM','users']:['me','Me','user'];
 const it=(v,l,i)=>`<button data-a="go" data-v="${v}" class="${S.v===v?'on':''}" ${S.v===v?'aria-current="page"':''}>${ic(i)}<span>${l}</span>${mobBadge(old,v)}</button>`;
 nav.classList.add('mnav');
 nav.innerHTML=it('home','Home','home')+it('tasks','Tasks','task')+`<button class="mchat ${S.v==='chat'?'on':''}" data-a="go" data-v="chat" aria-label="Chat"><i>${ic('chat')}</i><span>Chat</span>${mobBadge(old,'chat')}</button>`+it(third[0],third[1],third[2])+`<button data-a="mobMore" class="${['home','tasks','chat',third[0]].includes(S.v)?'':'on'}">${ic('grid')}<span>More</span></button>`}
A.mobMore=()=>{const seen=new Set(['home','tasks','chat',allowed('crm')?'crm':'me']);const T=(tabsFor()||[]).filter(x=>!seen.has(x[0])&&x[0]!=='more'&&x[0]!=='co');
 const L=[...MOB_ALL.filter(x=>!seen.has(x[0])&&allowed(x[0])),...T.filter(x=>!MOB_ALL.some(m=>m[0]===x[0])).map(x=>[x[0],x[1],x[2]||'grid','#24408E'])];
 const uniq=[];L.forEach(x=>{if(!uniq.some(u=>u[0]===x[0]))uniq.push(x)});
 const cos=(typeof isAdm==='function'&&isAdm())?COK:(typeof wkCos==='function'?wkCos():[]);
 const tile=(a,l,i,c,extra='')=>`<button class="mtile" ${a}${extra}><i style="background:${c}14;color:${c}">${ic(i)}</i><span>${h(l)}</span></button>`;
 sheet(`<div class="mmore"><h2>Everything</h2><div class="mtiles">${uniq.map(x=>tile(`data-a="mobGo" data-v="${x[0]}"`,x[1],x[2],x[3])).join('')}</div>
 ${cos.length?`<h3>Companies</h3><div class="mtiles">${cos.map(k=>tile(`data-a="mobCo" data-k="${k}"`,{gb:'GovaaBazaar',log:'Logistics',jup:'Jupiter',hr:'HR Consultancy',studios:'Studios'}[k]||CO[k].n,'work',CO[k].c)).join('')}</div>`:''}</div>`)};
A.mobGo=e=>{closeM();A.go(e)};A.mobCo=e=>{closeM();S.v='co';A.co(e)};

/* ---------- tasks: list on a phone ---------- */
const _vTasksMob=V.tasks;V.tasks=()=>{if(isMob()&&S.kv!=='list'&&S.kv!=='cal')S.kv='list';return _vTasksMob()};

/* ---------- CRM: stage chips + one list ---------- */
const _boardMob=boardView;boardView=function(L){if(!isMob())return _boardMob(L);const st=S.cmMs||'all';
 const cnt=k=>L.filter(c=>cmColOf(c)===k).length,show=st==='all'?L:L.filter(c=>cmColOf(c)===st);
 const sorted=show.slice().sort((a,b)=>(b.at>a.at?1:b.at<a.at?-1:(waLast(b).at||'').localeCompare(waLast(a).at||'')));
 const lbl=k=>(CM_COL.find(x=>x[0]===k)||[k,k])[1],col=k=>(CM_COL.find(x=>x[0]===k)||[,,,'#999'])[3];
 return `<div class="mstg">${[['all','All',L.length,'#24408E'],...CM_COL.map(([k,l,,c])=>[k,l,cnt(k),c])].map(([k,l,n,c])=>`<button class="${st===k?'on':''}" data-a="mStg" data-t="${k}" style="--c:${c}"><i></i>${h(l)}<b>${n}</b></button>`).join('')}</div>
 <div class="mleads">${sorted.map(c=>cmCard2(c).replace('<div class="cmt2">',`<div class="mstgtag" style="--c:${col(cmColOf(c))}">${h(lbl(cmColOf(c)))}</div><div class="cmt2">`)).join('')||`<div class="empty">No leads here</div>`}</div>`};
A.mStg=e=>{S.cmMs=e.dataset.t;render()};

/* ---------- after every render: phone class, bottom bar, no drag on touch ---------- */
const _renderMob=render;render=function(){_renderMob.apply(this,arguments);const m=isMob();document.documentElement.classList.toggle('mob',m);if(!m)return;
 try{const mn=document.getElementById('main');if(mn)mn.dataset.v=S.v;mobNav();document.querySelectorAll('[draggable="true"]').forEach(x=>x.setAttribute('draggable','false'))}catch(x){}};

document.head.insertAdjacentHTML('beforeend',`<style>
@media(max-width:820px){
 html.mob body{-webkit-tap-highlight-color:transparent}
 html.mob #main{padding-bottom:110px!important;overflow-x:hidden}
 /* bottom bar */
 .bnav.mnav{grid-auto-columns:unset;grid-template-columns:repeat(5,1fr);align-items:end;height:66px;padding:0 4px env(safe-area-inset-bottom);background:rgba(255,255,255,.97);backdrop-filter:blur(10px);box-shadow:0 -6px 24px rgba(16,24,40,.08);border-top:0}
 .bnav.mnav button{min-height:62px;padding:8px 0 6px;font-size:11px;color:#667085}.bnav.mnav button svg{width:23px;height:23px}
 .bnav.mnav button.on{color:var(--navy)}.bnav.mnav button.on:before{left:34%;right:34%;background:var(--navy)}
 .bnav.mnav .mchat{position:relative;justify-content:flex-end}.bnav.mnav .mchat i{position:absolute;top:-22px;left:50%;transform:translateX(-50%);width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(145deg,#2F4FB3,#1C2F70);color:#fff;box-shadow:0 8px 20px rgba(36,64,142,.35),0 0 0 5px #fff}
 .bnav.mnav .mchat i svg{width:26px;height:26px}.bnav.mnav .mchat.on:before{display:none}.bnav.mnav .mchat span{margin-top:auto}
 .bnav.mnav .bdg{top:4px;left:58%}.bnav.mnav .mchat .bdg{top:-24px;left:60%;z-index:2}
 /* More sheet */
 .mmore h2{margin:0 0 12px}.mmore h3{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);margin:18px 0 10px}
 .mtiles{display:grid;grid-template-columns:repeat(4,1fr);gap:14px 8px}
 .mtile{border:0;background:none;display:flex;flex-direction:column;align-items:center;gap:7px;font:inherit;font-size:12px;font-weight:600;color:#1D2939;text-align:center;cursor:pointer;padding:0}
 .mtile i{width:56px;height:56px;border-radius:18px;display:grid;place-items:center}.mtile i svg{width:26px;height:26px}.mtile span{line-height:1.2}
 /* generic: nothing spills off the screen */
 html.mob .grid.g2,html.mob .grid.g3,html.mob .grid.g4{grid-template-columns:1fr!important}
 html.mob .sttw,html.mob .wawrap,html.mob .xsheet{overflow-x:auto;-webkit-overflow-scrolling:touch}
 html.mob .chips{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}html.mob .chips::-webkit-scrollbar{display:none}
 html.mob .chips>*{flex:none}
 html.mob .btn{min-height:44px}
 html.mob [data-a="kv"][data-t="kanban"]{display:none}

 html.mob .cmlay{flex-direction:column}html.mob .cmlay.open .mstg,html.mob .cmlay.open .mleads{display:none}html.mob .mleads{width:100%}
 /* tasks list as cards */
 html.mob #main[data-v="tasks"] .ktool{flex-wrap:wrap;gap:8px}html.mob #main[data-v="tasks"] .ktool .tlbl2{display:none}
 html.mob #main[data-v="tasks"] .xsheet{overflow:visible;border:0!important;background:none!important;box-shadow:none!important}
 html.mob #main[data-v="tasks"] .xsheet table,html.mob #main[data-v="tasks"] .xsheet tbody{display:block;width:100%}
 html.mob #main[data-v="tasks"] .xsheet thead{display:none}
 html.mob #main[data-v="tasks"] .xsheet tr{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin-bottom:8px;box-shadow:0 1px 3px rgba(16,24,40,.04)}
 html.mob #main[data-v="tasks"] .xsheet tr:has(td[colspan]){background:none;border:0;box-shadow:none;padding:10px 2px 2px;margin:0}
 html.mob #main[data-v="tasks"] .xsheet td{display:inline-flex;align-items:center;border:0!important;padding:0!important;height:auto!important;font-size:12.5px;color:var(--mut);white-space:normal;position:static!important;box-shadow:none!important;background:none!important;min-width:0!important}
 html.mob #main[data-v="tasks"] .xsheet td.stk{flex:1 1 100%;font-size:15px;color:var(--ink);border-left:0!important;margin-bottom:2px}
 html.mob #main[data-v="tasks"] .xsheet td:nth-child(4){display:none}
 html.mob #main[data-v="tasks"] .xsheet td:nth-child(2):after,html.mob #main[data-v="tasks"] .xsheet td:nth-child(3):after{content:'·';margin-left:10px;color:#C3C8D2}
 html.mob #main[data-v="tasks"] .xsheet tr:has(td[colspan]) td{font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}

 html.mob #main[data-v="tasks"] .ktool{display:flex!important;flex-wrap:wrap!important;gap:8px!important;align-items:stretch}html.mob #main[data-v="tasks"] .ktool .vsw{display:none}
 html.mob #main[data-v="tasks"] .ktool .ksel{flex:1 1 100%;min-height:44px}html.mob #main[data-v="tasks"] .ktool>button{flex:1 1 0;min-height:44px}
 html.mob .cmbar{display:flex!important;flex-wrap:wrap!important;gap:8px!important;align-items:center}html.mob .cmbar .cseg{flex:1 1 100%;display:flex}html.mob .cmbar .cseg button{flex:1}
 html.mob .cmbar .t4sel{flex:1;min-width:0;min-height:44px}html.mob .cmbar .sp{display:none}
 html.mob .cmbar [data-a="waNew"]{position:fixed;right:16px;bottom:calc(84px + env(safe-area-inset-bottom));z-index:44;min-height:50px;padding:0 20px;border-radius:999px;box-shadow:0 10px 24px rgba(36,64,142,.35)}
 html.mob .cmlay.open~*,html.mob .cmwrap:has(.cmlay.open) .cmbar [data-a="waNew"]{display:none}

 html.mob .cmlay.open .cmd{position:fixed!important;left:0;right:0;top:0;bottom:calc(66px + env(safe-area-inset-bottom));width:auto!important;max-width:none!important;max-height:none!important;z-index:46;overflow-y:auto;border-radius:0!important;margin:0!important;background:#fff;padding-top:env(safe-area-inset-top)}
 html.mob .cmlay.open .cmd *{max-width:100%}

 html.mob .cohead{flex-wrap:wrap}html.mob .cotag{flex-basis:100%;margin:6px 0 0;padding-left:0;font-size:13px;text-align:left;opacity:.85}
 /* CRM on a phone */
 html.mob .cmboard{display:none}
 html.mob .mstg{display:flex;gap:8px;overflow-x:auto;padding:2px 0 10px;scrollbar-width:none;margin:0 -2px}html.mob .mstg::-webkit-scrollbar{display:none}
 html.mob .mstg button{flex:none;display:inline-flex;align-items:center;gap:7px;border:1px solid var(--line);background:#fff;border-radius:999px;padding:8px 14px;font:inherit;font-size:13px;font-weight:600;color:#344054}
 html.mob .mstg button i{width:8px;height:8px;border-radius:50%;background:var(--c)}html.mob .mstg button b{font-size:11.5px;background:#F2F4F7;border-radius:999px;padding:1px 7px}
 html.mob .mstg button.on{background:var(--navy);border-color:var(--navy);color:#fff}html.mob .mstg button.on b{background:rgba(255,255,255,.2)}
 html.mob .mleads{display:flex;flex-direction:column;gap:10px}
 html.mob .mleads .cmc2{border-radius:16px;padding:12px 14px;border-left:4px solid var(--c,#24408E)}html.mob .mleads .cmc2:hover{transform:none}
 html.mob .mleads .cmc2 .cmn small{font-size:13px}html.mob .mleads .cmc2 .cmt2 .sfav{width:40px!important;height:40px!important;font-size:13px!important}
 html.mob .mstgtag{display:inline-block;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--c);margin-bottom:6px}
 html.mob .mleads .cmb{width:42px;height:42px}
}
</style>`);

/* ===================== PHONE: Tasks (rebuilt for touch) =====================
   One page, one scroll: people row (who) → day strip (when) → status chips → task cards.
   Tap a day to see its tasks; "Late" shows everything overdue; tap a card to open the task. */
const MT_ST=[['open','Open'],['To do','To do'],['Planning','Planning'],['Working','Working'],['Stuck','Stuck'],['Review','Review'],['Done','Done']];
const MT_COL={'To do':'#8A93A3','Planning':'#2563C9','Working':'#C2410C','Stuck':'#D92D20','Review':'#7A2E8E','Done':'#1F9D55'};
const mtDue=t=>t.due||t.end||'';
const mtProj=t=>(D.projects||[]).find(p=>p.id===t.proj);
const mtPN=t=>{const p=mtProj(t);return p?p.n:(t.co&&CO[t.co]?coShort(t.co):'')};
const mtCard=t=>{const late=t.st!=='Done'&&mtDue(t)&&mtDue(t)<TODAY,c=MT_COL[t.st]||'#8A93A3',pn=mtPN(t);
 return `<button class="mtc" data-a="tOpen" data-id="${t.id}" style="--c:${c}"><div class="mtc1"><b>${h(t.t)}</b><span class="mtst">${h(t.st)}</span></div>
 <div class="mtc2">${t.o?`<span class="mtp">${av(nm(t.o),'s')}${h(nmF(t.o))}</span>`:''}${pn?`<span class="mtpj">${h(pn)}</span>`:''}${mtDue(t)?`<span class="mtd ${late?'late':mtDue(t)===TODAY?'tdy':''}">${ic('cal')}${mtDue(t)===TODAY?'Today':fmt(mtDue(t))}${late?' · late':''}</span>`:''}${t.pri==='High'?'<span class="mthi">High</span>':''}</div></button>`};
function mTasks(){const all=myTasks(),who=S.mtw||'all',L0=who==='all'?all:who==='me'?all.filter(t=>t.o===S.me):all.filter(t=>t.o===who);
 const pj=S.mtp||'',L1=pj?L0.filter(t=>t.proj===pj):L0,day=S.mtd||'today',st=S.mts||'open';
 const stOk=t=>st==='open'?t.st!=='Done':t.st===st,late=L1.filter(t=>t.st!=='Done'&&mtDue(t)&&mtDue(t)<TODAY);
 /* people row */
 const ppl=isAdm()?[...new Set(all.map(t=>t.o).filter(Boolean))].sort((a,b)=>all.filter(t=>t.o===b&&t.st!=='Done').length-all.filter(t=>t.o===a&&t.st!=='Done').length):[];
 const pBtn=(k,l,avh,n,lt)=>`<button class="mpp ${who===k?'on':''}" data-a="mtW" data-t="${k}">${avh}<span>${h(l)}</span>${n?`<em class="${lt?'lt':''}">${n}</em>`:''}</button>`;
 const people=isAdm()?`<div class="mppl">${pBtn('all','Everyone',`<i class="mpall">${ic('users')}</i>`,all.filter(t=>t.st!=='Done').length)}${pBtn('me','Me',av(nm(S.me)),all.filter(t=>t.o===S.me&&t.st!=='Done').length)}${ppl.filter(k=>k!==S.me).map(k=>{const o=all.filter(t=>t.o===k&&t.st!=='Done'),lt=o.some(t=>mtDue(t)&&mtDue(t)<TODAY);return pBtn(k,nmF(k),av(nm(k)),o.length,lt)}).join('')}</div>`:'';
 /* day strip */
 const days=[];for(let i=-3;i<=21;i++)days.push(addD(TODAY,i));
 const dn=d=>L1.filter(t=>mtDue(t)===d&&t.st!=='Done').length;
 const strip=`<div class="mds" id="mds"><button class="mdy late ${day==='late'?'on':''}" data-a="mtD" data-t="late"><small>Late</small><b>${late.length}</b><i></i></button><button class="mdy ${day==='all'?'on':''}" data-a="mtD" data-t="all"><small>All</small><b>${ic('grid')}</b><i></i></button>${days.map(d=>{const dt=new Date(d+'T12:00:00'),n=dn(d),sel=day===d||(day==='today'&&d===TODAY);return `<button class="mdy ${sel?'on':''} ${d===TODAY?'tdy':''} ${d<TODAY?'past':''}" data-a="mtD" data-t="${d===TODAY?'today':d}" ${sel?'id="mdsel"':''}><small>${d===TODAY?'Today':dt.toLocaleDateString('en-IN',{weekday:'short'})}</small><b>${dt.getDate()}</b><i>${n?'<s></s>'.repeat(Math.min(n,3)):''}</i></button>`}).join('')}</div>`;
 /* which tasks */
 let list,title;
 if(day==='late'){list=late;title='Overdue'}
 else if(day==='all'){list=L1.filter(stOk);title='All tasks'}
 else{const d=day==='today'?TODAY:day;list=L1.filter(t=>mtDue(t)===d&&stOk(t));const dt=new Date(d+'T12:00:00');title=d===TODAY?'Today':dt.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'short'})}
 if(day==='all'||day==='late')list=list.slice().sort((a,b)=>String(mtDue(a)||'9').localeCompare(String(mtDue(b)||'9')));
 const stc=k=>(day==='late'?late:L1).filter(t=>k==='open'?t.st!=='Done':t.st===k).length;
 const chipsSt=day==='late'?'':`<div class="mstc">${MT_ST.map(([k,l])=>`<button class="${st===k?'on':''}" data-a="mtS" data-t="${k}" style="--c:${MT_COL[k]||'#24408E'}">${h(l)}<b>${stc(k)}</b></button>`).join('')}</div>`;
 const pjL=(D.projects||[]).filter(p=>L0.some(t=>t.proj===p.id));
 const lateNote=day==='today'&&late.length?`<button class="mlate" data-a="mtD" data-t="late">${ic('clock')}<span><b>${late.length} task${late.length===1?'':'s'} overdue</b><small>Tap to see and clear them</small></span>${ic('right')}</button>`:'';
 setTimeout(()=>{const s=document.getElementById('mdsel'),w=document.getElementById('mds');if(s&&w)w.scrollLeft=s.offsetLeft-w.clientWidth/2+s.clientWidth/2},0);
 const whoL=who==='all'?'Everyone':who==='me'?'Me':nmF(who);
 return `${mtTabs()}${S.mtMode==='cal'?strip:mtFunnel(L1)}
 <div class="mfl">${isAdm()?`<button class="mpill ${who!=='all'?'on':''}" data-a="mtWho">${who==='all'?ic('users'):av(nm(who==='me'?S.me:who))}${h(whoL)}${ic('down')}</button>`:''}<button class="mpill ${pj?'on':''}" data-a="mtPj">${ic('grid')}${h(pj?((pjL.find(p=>p.id===pj)||{}).n||'Project'):'All projects')}${ic('down')}</button>${isAdm()?`<button class="mpill ic" data-a="projNew" aria-label="New project">${ic('plus')}</button>`:''}</div>
 ${S.mtMode==='cal'?lateNote+chipsSt:''}<div class="msec">${h(title)} · ${list.length}</div>
 <button class="mcompose mtfab" data-a="tNew" aria-label="Add task">${ic('plus')}Task</button><div class="mtl">${(S.mtMode!=='cal'&&day==='all'?mtGrouped(list):list.map(mtCard).join(''))||`<div class="mempty">${ic('check')}<b>${day==='late'?'Nothing overdue':'No tasks here'}</b><small>${day==='late'?'Great — everything is on time':'Pick another day or tap + to add one'}</small></div>`}</div>`}
A.mtW=e=>{S.mtw=e.dataset.t;closeM();render()};
A.mtWho=()=>{const all=myTasks(),ppl=[...new Set(all.map(t=>t.o).filter(Boolean))].sort((a,b)=>all.filter(t=>t.o===b&&t.st!=='Done').length-all.filter(t=>t.o===a&&t.st!=='Done').length);
 const row=(k,l,a)=>{const o=all.filter(t=>(k==='all'||t.o===(k==='me'?S.me:k))&&t.st!=='Done'),lt=o.filter(t=>mtDue(t)&&mtDue(t)<TODAY).length;return `<button class="li" data-a="mtW" data-t="${k}">${a}<div class="tx"><b>${h(l)}</b><div class="m">${o.length} open${lt?` · <span style="color:#D92D20">${lt} late</span>`:''}</div></div>${(S.mtw||'all')===k?ic('check'):''}</button>`};
 sheet(`<h2>Whose tasks</h2><input id="mtwq" placeholder="Search a person…" style="margin:4px 0 10px" oninput="const q=this.value.toLowerCase();document.querySelectorAll('#mtwl .li').forEach(r=>r.style.display=r.querySelector('b').textContent.toLowerCase().includes(q)?'':'none')"><div class="list" id="mtwl">${row('all','Everyone',`<i class="mpall">${ic('users')}</i>`)}${row('me','Me',av(nm(S.me)))}${ppl.filter(k=>k!==S.me).map(k=>row(k,nmF(k),av(nm(k)))).join('')}</div>`)};A.mtD=e=>{S.mtd=e.dataset.t;render()};A.mtS=e=>{S.mts=e.dataset.t;render()};
A.mtPj=()=>{const all=myTasks(),P=(D.projects||[]).filter(p=>all.some(t=>t.proj===p.id));sheet(`<h2>Project</h2><div class="list">${[['','All projects',all.filter(t=>t.st!=='Done').length],...P.map(p=>[p.id,p.n,all.filter(t=>t.proj===p.id&&t.st!=='Done').length])].map(([k,l,n])=>`<button class="li" data-a="mtPjGo" data-t="${k}"><div class="tx"><b>${h(l)}</b></div>${n?pill(n+' open','b'):''}${(S.mtp||'')===k?ic('check'):''}</button>`).join('')}</div>`)};
A.mtPjGo=e=>{S.mtp=e.dataset.t;closeM();render()};
const mtTabs=()=>{const T=[['proj','Tasks','task'],['forms','Forms','doc'],['cal','Calendar','cal'],['meet','Meetings','meet'],['time','Timeline','t_time'],['score','Scoreboard','star']].filter(([k])=>{const o=taskHead(P[S.me]||{n:nmF(S.me)});return k==='proj'||new RegExp('data-t="'+k+'"').test(o)});
 return `<div class="mtt">${T.map(([k,l,i])=>`<button class="${(S.ttab||'proj')===k?'on':''}" data-a="ttab" data-t="${k}">${l}</button>`).join('')}</div>`};
const _vTasksMob2=V.tasks;V.tasks=()=>{if(!isMob())return _vTasksMob2();const tt=S.ttab||'proj';
 if(tt==='proj'){S.mtMode='list';if(!['all','late'].includes(S.mtd))S.mtd='all';return mTasks()}
 if(tt==='cal'){S.mtMode='cal';if(!S.mtd||['all','late'].includes(S.mtd))S.mtd='today';return mTasks()}
 if(tt==='meet'&&!S.gmN)return mtTabs()+mMeet();
 if(tt==='time')return mtTabs()+mTimeline();
 {const o=_vTasksMob2(),t=document.createElement('template');t.innerHTML=o;t.content.querySelectorAll('.tcrumb,.thd,nav.tsec').forEach(x=>x.remove());return mtTabs()+t.innerHTML}};
document.head.insertAdjacentHTML('beforeend',`<style>
@media(max-width:820px){
 .mth{display:flex;align-items:center;justify-content:space-between;margin:2px 0 12px}.mth h1{margin:0;font-size:26px}.mth small{color:var(--mut);font-size:12.5px}
 .mfab0{width:46px;height:46px;border-radius:15px;border:0;background:var(--navy);color:#fff;display:grid;place-items:center;box-shadow:0 8px 18px rgba(36,64,142,.3)}.mfab0 svg{width:22px;height:22px}
 .mtt{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;margin:0 -16px 10px;padding:0 16px;border-bottom:1px solid var(--line)}.mtt::-webkit-scrollbar{display:none}
 .mtt button{flex:none;border:0;background:none;padding:8px 10px 10px;font:inherit;font-size:14px;font-weight:700;color:var(--mut);border-bottom:2.5px solid transparent;margin-bottom:-1px}.mtt button.on{color:var(--navy);border-bottom-color:var(--navy)}
 .mpill.ic{padding:8px 10px}.mpill .av{width:20px!important;height:20px!important;font-size:8.5px!important}.sheet .mpall{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:#EEF2FB;color:var(--navy)}.sheet .mpall svg{width:18px;height:18px}
 .mppl{display:flex;gap:14px;overflow-x:auto;padding:4px 2px 12px;scrollbar-width:none;margin:0 -16px;padding-left:16px;padding-right:16px}.mppl::-webkit-scrollbar{display:none}
 .mpp{flex:none;border:0;background:none;display:flex;flex-direction:column;align-items:center;gap:5px;width:58px;font:inherit;font-size:11.5px;font-weight:600;color:#475467;position:relative;padding:0}
 .mpp .av,.mpp .mpall{width:50px!important;height:50px!important;font-size:15px!important;border-radius:50%;box-shadow:0 0 0 2px #fff,0 0 0 4px transparent}.mpp .mpall{display:grid;place-items:center;background:#EEF2FB;color:var(--navy)}.mpp .mpall svg{width:22px;height:22px}
 .mpp.on .av,.mpp.on .mpall{box-shadow:0 0 0 2px #fff,0 0 0 4px var(--navy)}.mpp.on span{color:var(--navy)}
 .mpp em{position:absolute;top:-2px;right:0;min-width:20px;height:20px;border-radius:10px;background:var(--navy);color:#fff;font-style:normal;font-size:10.5px;display:grid;place-items:center;padding:0 5px;border:2px solid #F2F4F7}.mpp em.lt{background:#D92D20}
 .mds{display:flex;gap:8px;overflow-x:auto;scroll-behavior:smooth;padding:4px 16px 12px;margin:0 -16px;scrollbar-width:none}.mds::-webkit-scrollbar{display:none}
 .mdy{flex:none;width:48px;height:62px;border-radius:15px;border:1px solid var(--line);background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font:inherit;color:#344054;padding:0}
 .mdy small{font-size:11px;font-weight:600;color:var(--mut)}.mdy b{font-size:17px;font-weight:700;line-height:1.1}.mdy b svg{width:18px;height:18px}.mdy i{height:6px;display:flex;gap:3px}.mdy i s{width:5px;height:5px;border-radius:50%;background:var(--navy);display:block}
 .mdy.past{opacity:.6}.mdy.tdy{border-color:var(--navy)}.mdy.late{background:#FEF3F2;border-color:#FECDCA}.mdy.late b,.mdy.late small{color:#D92D20}
 .mdy.on{background:var(--navy);border-color:var(--navy);opacity:1;box-shadow:0 8px 18px rgba(36,64,142,.28)}.mdy.on small,.mdy.on b{color:#fff}.mdy.on i s{background:#fff}.mdy.late.on{background:#D92D20;border-color:#D92D20}
 .mfl{display:flex;gap:8px;margin:0 0 10px;overflow-x:auto;scrollbar-width:none}
 .mpill{flex:none;display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:#fff;border-radius:999px;padding:8px 14px;font:inherit;font-size:13px;font-weight:600;color:#344054}.mpill svg{width:15px;height:15px}.mpill.on{border-color:var(--navy);color:var(--navy);background:#EEF2FB}
 .mstc{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin:0 -16px 6px;padding:0 16px 4px}.mstc::-webkit-scrollbar{display:none}
 .mstc button{flex:none;border:0;background:#fff;border-radius:12px;padding:8px 12px;font:inherit;font-size:13px;font-weight:600;color:#475467;display:inline-flex;gap:6px;align-items:center;box-shadow:inset 0 0 0 1px var(--line)}
 .mstc button b{font-size:11.5px;color:var(--mut)}.mstc button.on{background:var(--c);color:#fff;box-shadow:none}.mstc button.on b{color:rgba(255,255,255,.85)}
 .mlate{display:flex;align-items:center;gap:12px;width:100%;border:0;background:#FEF3F2;border-radius:16px;padding:12px 14px;margin:0 0 10px;font:inherit;text-align:left;color:#B42318}.mlate>svg{width:22px;height:22px;flex:none}.mlate span{flex:1}.mlate b{display:block;font-size:14px}.mlate small{color:#D92D20;font-size:12px}
 .msec{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);margin:12px 2px 8px}
 .mtl{display:flex;flex-direction:column;gap:7px}
 .mtc{display:block;width:100%;text-align:left;border:0;background:#fff;border-radius:14px;padding:10px 12px 9px 14px;font:inherit;box-shadow:0 1px 2px rgba(16,24,40,.05),0 4px 14px rgba(16,24,40,.04);position:relative;overflow:hidden}
 .mtc:before{content:'';position:absolute;left:0;top:12px;bottom:12px;width:4px;border-radius:0 4px 4px 0;background:var(--c)}
 .mtc:active{transform:scale(.985)}
 .mtc1{display:flex;gap:10px;align-items:flex-start}.mtc1 b{flex:1;font-size:14.5px;line-height:1.35;color:#101828;font-weight:600}
 .mtst{flex:none;font-size:11px;font-weight:700;color:var(--c);background:color-mix(in srgb,var(--c) 12%,#fff);border-radius:999px;padding:3px 9px}
 .mtc2{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:center;margin-top:6px;font-size:12.5px;color:#667085}
 .mtp{display:inline-flex;align-items:center;gap:6px;font-weight:600;color:#344054}.mtp .av{width:22px!important;height:22px!important;font-size:9.5px!important}
 .mtpj{background:#F2F4F7;border-radius:6px;padding:2px 8px;font-weight:600}.mtd{display:inline-flex;align-items:center;gap:4px}.mtd svg{width:13px;height:13px}.mtd.late{color:#D92D20;font-weight:700}.mtd.tdy{color:#C2410C;font-weight:700}
 .mthi{color:#D92D20;font-weight:700}
 .mempty{background:#fff;border-radius:18px;padding:28px 16px;text-align:center;color:var(--mut)}.mempty svg{width:28px;height:28px;color:#1F9D55}.mempty b{display:block;color:#101828;margin:6px 0 2px}
}
</style>`);

/* ===================== PHONE: Home =====================
   Greeting · search · quick actions · "your day" strip, then the usual dashboard cards below. */
const _vHomeMob=V.home;V.home=()=>{const o=_vHomeMob();if(!isMob())return o;
 const t=document.createElement('template');t.innerHTML=o;const g=t.content.querySelector('.greet');
 const ql=g&&g.querySelector('.gline'),quote=ql?ql.textContent.trim():'';if(g)g.remove();
 const hr=+new Date().toLocaleString('en-US',{hour:'numeric',hour12:false,timeZone:'Asia/Kolkata'}),hi=hr<12?'Good morning':hr<17?'Good afternoon':'Good evening';
 const T=myTasks(),mine=isAdm()?T:T.filter(t=>t.o===S.me),od=mine.filter(t=>t.st!=='Done'&&mtDue(t)&&mtDue(t)<TODAY).length,td=mine.filter(t=>t.st!=='Done'&&mtDue(t)===TODAY).length,op=mine.filter(t=>t.st!=='Done').length;
 const qa=[['tNew','','New task','plus','#24408E'],['go','tasks','My day','cal','#C2410C'],['go','chat','Chat','chat','#1F9D55'],...(allowed('crm')?[['go','crm','CRM','users','#2563C9']]:[]),['go','me','Me','user','#7A2E8E']].slice(0,5);
 const hero=`<div class="mhero"><small>${hi}</small><h1>Hi, ${h((nmF(S.me)||'').split(' ')[0])} 👋</h1><span>${new Date(TODAY+'T12:00:00').toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</span>${quote?`<em class="mquote">✦ ${h(quote)}</em>`:''}</div>
 <div class="mqa">${qa.map(([a,v,l,i,c])=>`<button data-a="${a}" ${v?`data-v="${v}"`:''}><i style="background:${c}14;color:${c}">${ic(i)}</i><span>${l}</span></button>`).join('')}</div>
 <button class="mday" data-a="go" data-v="tasks"><div><b>${td}</b><span>due today</span></div><div class="${od?'bad':''}"><b>${od}</b><span>overdue</span></div><div><b>${op}</b><span>open${isAdm()?' · team':''}</span></div>${ic('right')}</button>`;
 t.content.prepend(document.createRange().createContextualFragment(hero));const sr=t.content.querySelector('.search');if(sr){sr.remove();t.content.querySelector('.mqa').before(sr)}
 return t.innerHTML};
document.head.insertAdjacentHTML('beforeend',`<style>
@media(max-width:820px){
 html.mob #main{padding-top:14px!important}
 .mhero{margin:2px 0 12px}.mhero small{font-size:13px;color:var(--mut);font-weight:600}.mhero h1{margin:2px 0 4px;font-size:26px;line-height:1.15}.mhero span{font-size:13px;color:#475467;display:block;line-height:1.4}.mquote{display:inline-block;margin-top:8px;font-style:normal;font-size:12.5px;font-weight:700;color:#C2410C;background:#FFF4ED;border-radius:999px;padding:4px 12px}
 html.mob #main[data-v="home"] .search{margin:0 0 14px;border-radius:16px;box-shadow:0 1px 2px rgba(16,24,40,.05)}
 .mqa{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:0 0 14px}
 .mqa button{border:0;background:none;display:flex;flex-direction:column;align-items:center;gap:6px;font:inherit;font-size:11.5px;font-weight:600;color:#344054;padding:0}
 .mqa i{width:54px;height:54px;border-radius:18px;display:grid;place-items:center}.mqa i svg{width:24px;height:24px}
 .mday{display:flex;align-items:center;width:100%;border:0;background:linear-gradient(135deg,#24408E,#1A2D66);color:#fff;border-radius:20px;padding:16px 14px;margin:0 0 16px;font:inherit;text-align:left;box-shadow:0 10px 24px rgba(36,64,142,.25)}
 .mday>div{flex:1;border-right:1px solid rgba(255,255,255,.18);padding:0 10px}.mday>div:nth-child(3){border-right:0}.mday b{display:block;font-size:24px;font-weight:800}.mday span{font-size:12px;opacity:.8}.mday .bad b{color:#FDA29B}.mday>svg{width:20px;height:20px;opacity:.8}
 html.mob #main[data-v="home"] .car{margin-left:-16px;margin-right:-16px;padding-left:16px;padding-right:16px}
}
</style>`);

/* ===================== PHONE: Chat =====================
   Team list = one row of team chips + the conversation list. An open conversation takes the full screen
   (header with back arrow, messages, composer at the bottom), like WhatsApp. */
const _vChatMob=V.chat;V.chat=()=>{const o=_vChatMob();if(!isMob()||S.v!=='chat')return o;
 if(!/class="wahd"/.test(o))return o;
 return o.replace('<div class="wahd">','<div class="wahd"><button class="mback" data-a="mChatBack" aria-label="Back to chats">'+ic('back')+'</button>')};
A.mChatBack=()=>{S.chat=null;S.mchatAll=1;render();scrollTo(0,0)};
const _chatGoMob=A.chatGo;A.chatGo=e=>{S.mchatAll=0;_chatGoMob(e);if(isMob())scrollTo(0,0)};
const _renderMob2=render;render=function(){_renderMob2.apply(this,arguments);if(!isMob())return;const m=document.getElementById('main');if(!m)return;
 m.classList.toggle('mconv',S.v==='chat'&&!!m.querySelector('.wahd'));document.documentElement.classList.toggle('mconvon',S.v==='chat'&&!!m.querySelector('.wahd'))};
document.head.insertAdjacentHTML('beforeend',`<style>
@media(max-width:820px){
 html.mob #main[data-v="chat"] .c5h{padding:12px 14px!important;border-radius:18px!important}html.mob #main[data-v="chat"] .c5l{display:none}
 html.mob #main[data-v="chat"] .kchips{flex-wrap:nowrap!important;overflow-x:auto;scrollbar-width:none;margin:0 -14px;padding:0 14px 2px}html.mob #main[data-v="chat"] .kchips::-webkit-scrollbar{display:none}html.mob #main[data-v="chat"] .kchips>*{flex:none}
 html.mob #main[data-v="chat"] .tteam{padding:10px 14px!important}html.mob #main[data-v="chat"] .tteam .tlbl{display:none}
 /* open conversation = full screen */
 html.mob #main.mconv .c5h,html.mob #main.mconv .tteam{display:none!important}
 html.mob #main.mconv .wahd{position:fixed;top:0;left:0;right:0;z-index:47;border-radius:0!important;margin:0!important;padding:10px 12px calc(10px) 8px!important;padding-top:calc(10px + env(safe-area-inset-top))!important;gap:10px}
 html.mob #main.mconv .thread{position:fixed;left:0;right:0;top:calc(62px + env(safe-area-inset-top));bottom:calc(64px + env(safe-area-inset-bottom));z-index:46;margin:0!important;border-radius:0!important;max-height:none!important;height:auto!important;overflow-y:auto}
 html.mob #main.mconv .compose{position:fixed;left:0;right:0;bottom:0;z-index:47;margin:0!important;border-radius:0!important;padding:8px 10px calc(8px + env(safe-area-inset-bottom))!important;background:#fff;box-shadow:0 -4px 14px rgba(16,24,40,.06)}
 html.mob #main.mconv .emo,html.mob #main.mconv .ment-s{position:fixed;left:8px;right:8px;bottom:calc(70px + env(safe-area-inset-bottom));z-index:48}
 html.mob.mconvon .bnav{display:none!important}
 .mback{border:0;background:rgba(255,255,255,.15);color:inherit;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;flex:none}.mback svg{width:20px;height:20px}
}
</style>`);

/* ===================== PHONE: HR Desk employee list as cards; page headers tighter ===================== */
document.head.insertAdjacentHTML('beforeend',`<style>
@media(max-width:820px){
 html.mob #main .row.nw>div>h1+p,html.mob #main h1+.mut{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
 html.mob .xsheet.master{overflow:visible!important;border:0!important;background:none!important;box-shadow:none!important}
 html.mob .xsheet.master table,html.mob .xsheet.master tbody{display:block;width:100%}html.mob .xsheet.master thead{display:none}
 html.mob .xsheet.master tr{display:grid;grid-template-columns:1fr auto;gap:4px 10px;background:#fff;border-radius:16px;padding:12px 14px;margin-bottom:10px;box-shadow:0 1px 2px rgba(16,24,40,.05),0 4px 14px rgba(16,24,40,.04)}
 html.mob .xsheet.master td{display:none;border:0!important;padding:0!important;height:auto!important;position:static!important;box-shadow:none!important;background:none!important;min-width:0!important;white-space:normal!important;font-size:12.5px!important;color:#667085}
 html.mob .xsheet.master td:nth-child(2){display:block;grid-column:1;grid-row:1}html.mob .xsheet.master td:nth-child(2) b{font-size:15px!important;color:#101828}
 html.mob .xsheet.master td:nth-child(3){display:block;grid-column:2;grid-row:1;justify-self:end}
 html.mob .xsheet.master td:nth-child(1){display:block;grid-column:1;grid-row:2}html.mob .xsheet.master td:nth-child(5){display:block;grid-column:1;grid-row:3;color:#344054}
 html.mob .xsheet.master td:nth-child(4){display:block;grid-column:2;grid-row:2;justify-self:end}
 html.mob .xsheet.master td:nth-child(9){display:block;grid-column:1;grid-row:4}
 html.mob .xsheet.master td:nth-child(18){display:block;grid-column:2;grid-row:3/5;align-self:end;justify-self:end}
}
</style>`);
