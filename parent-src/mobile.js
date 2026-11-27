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
