/* ===================== Tasks page header: three clearly different rows =====================
   Row 1  SECTIONS  · Projects / Forms / Calendar / Timeline / Meetings  → page tabs with icons + orange underline
   Row 2  TEAMS     · All projects / Bahiram / OPS / … (project = team)  → coloured soft pills with a "Teams" label
   Row 3  TOOLBAR   · List|Kanban · Person · + Project · + Add task      → one grey control strip              */
Object.assign(I,{
 t_proj:'<rect x="3" y="4" width="7" height="16" rx="2"/><rect x="14" y="4" width="7" height="10" rx="2"/>',
 t_form:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
 t_cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
 t_time:'<path d="M4 6h10M8 12h12M4 18h8"/>',
 t_meet:'<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/>',
 t_list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
 t_kan:'<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="10" rx="1.5"/><rect x="17" y="4" width="4" height="13" rx="1.5"/>',
 t_info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'
});
const TPAL=['#2F6BE0','#E8772E','#7A2E8E','#1F9D55','#0B6E8A','#C0392B','#B8860B','#3D5AFE','#00897B','#AD1457'];
const projCol=id=>{if(id==='all')return '#24408E';const i=(D.projects||[]).findIndex(p=>p.id===id);return TPAL[(i<0?0:i)%TPAL.length]};

taskHead=function(me){const T=[['proj','Projects','t_proj'],['forms','Forms','t_form'],['cal','Calendar','t_cal'],['time','Timeline','t_time'],...(isAdm()||['mohin','omadsul','himanshu'].includes(S.me)?[['meet','Meetings','t_meet']]:[])];
 return `<div class="thd"><h1 class="ttl">Tasks<span class="tsub"> / ${{proj:'Projects',forms:'Forms',cal:'Calendar',time:'Timeline',meet:'Meetings'}[S.ttab]}</span></h1><span class="sp"></span><span class="tpill hide-m">${new Date().toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}</span><button class="tpill tme hide-m" data-a="whoSheet" aria-label="Account">${av(me.n)}<span><b>${h(nmF(S.me))}</b><small>${h(me.r||'')}</small></span></button></div>
 <nav class="tsec" aria-label="Task sections">${T.map(([k,n,i])=>`<button class="${S.ttab===k?'on':''}" data-a="ttab" data-t="${k}" ${S.ttab===k?'aria-current="page"':''}>${ic(i)}<span>${n}</span></button>`).join('')}</nav>`};

projBar=function(){const PR=myProjects(),T=myTasks();S.kp=S.kp||'all';
 return `<div class="tteam"><div class="tlbl">${ic('users')}Teams</div><div class="kchips">${[['all','All projects'],...PR.map(p=>[p.id,p.n])].map(([id,n])=>`<button class="kchip ${S.kp===id?'on':''}" style="--pc:${projCol(id)}" data-a="kp" data-t="${id}" ${id!=='all'?`data-pid="${id}"`:''}><i></i>${h(n)} <span>${T.filter(t=>(id==='all'||t.proj===id)&&t.st!=='Done').length}</span></button>`).join('')}</div></div>`};

/* Projects tab: swap the old chip row for the Teams row, and turn the tool row into the grey toolbar */
const _kbUI=kanban;kanban=function(){let o=_kbUI();
 o=o.replace(/<div class="kchips">[\s\S]*?<\/div>/,projBar());
 o=o.replace('<div class="ktool">','<div class="ktool tbar"><span class="tlbl2">View</span>')
  .replace('☰ List',ic('t_list')+'List').replace('▦ Kanban',ic('t_kan')+'Kanban')
  .replace(/<span class="xs mut hide-m" style="flex:1">([\s\S]*?)<\/span>/,(m,t)=>`<span class="tsp"></span><span class="thint hide-m" tabindex="0" title="${t.replace(/"/g,'&quot;')}">${ic('t_info')}How to use</span>`);
 return o};

document.head.insertAdjacentHTML('beforeend',`<style>
/* page header: title + date + user on one row; the old top bar is gone on desktop */
@media(min-width:761px){.hd{display:none!important}}
.thd{display:flex;align-items:center;gap:10px;margin:2px 0 6px;flex-wrap:wrap}.thd .ttl{margin:0}.thd .sp{flex:1}
.tsub{font-size:18px;font-weight:600;color:var(--mut)}
.tme{border:1px solid var(--line);cursor:pointer;font:inherit;text-align:left}
/* Row 1 · sections: page tabs, underline, icons */
.tsec{display:flex;gap:4px;border-bottom:2px solid var(--line);margin:4px 0 18px;overflow-x:auto;scrollbar-width:none}
.tsec button{flex:none;display:inline-flex;align-items:center;gap:8px;border:0;background:none;padding:12px 18px 13px;margin-bottom:-2px;border-bottom:3px solid transparent;font-weight:700;font-size:15px;color:var(--mut);cursor:pointer;border-radius:10px 10px 0 0}
.tsec button .ico{width:18px;height:18px}
.tsec button:hover{color:var(--ink);background:#F4F6FA}
.tsec button.on{color:#24408E;border-bottom-color:#F28C28;background:none}
/* Row 2 · teams: labelled soft pills with colour dots */
.tteam{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid var(--line);border-radius:16px;padding:8px 10px 8px 14px;margin-bottom:12px}
.tlbl{flex:none;display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);padding-right:12px;border-right:1px solid var(--line)}
.tlbl .ico{width:16px;height:16px}
.tteam .kchips{padding:2px 0;flex:1;min-width:0}
.tteam .kchip{background:#F7F8FB;border:1px solid transparent;border-radius:999px;padding:7px 14px 7px 11px;font-size:13.5px}
.tteam .kchip i{width:9px;height:9px;border-radius:50%;background:var(--pc);flex:none}
.tteam .kchip:hover{border-color:var(--line);background:#fff}
.tteam .kchip.on{background:color-mix(in srgb,var(--pc) 12%,#fff);border-color:var(--pc);color:var(--pc)}
.tteam .kchip.on span{background:var(--pc);color:#fff}
/* Row 3 · toolbar: one grey strip, iOS-style segmented view switch */
.tbar{background:#EEF1F6;border-radius:14px;padding:8px 10px;margin:0 0 16px;gap:10px}
.tlbl2{font-size:11.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);padding:0 2px 0 4px}
.tbar .vsw{background:#DDE2EB;border:0;padding:3px}
.tbar .vsw button{display:inline-flex;align-items:center;gap:6px;color:#4A5468;padding:7px 14px}
.tbar .vsw button .ico{width:16px;height:16px}
.tbar .vsw button.on{background:#fff;color:#24408E;box-shadow:0 1px 3px rgba(16,24,40,.15)}
.tbar .ksel{background:#fff;border:1px solid #D5DAE3;min-height:38px;min-width:170px}
.tsp{flex:1}
.thint{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:600;color:var(--mut);cursor:help;padding:6px 8px;border-radius:8px}
.thint .ico{width:16px;height:16px}.thint:hover,.thint:focus{background:#fff;color:var(--ink)}
.tbar .btn.sm{min-height:38px}
@media(max-width:760px){.tsec button{padding:10px 12px 11px;font-size:14px}.tteam{flex-direction:column;align-items:stretch;gap:6px;padding:8px}.tlbl{border-right:0;padding:0}.tlbl2{display:none}.tbar .thint,.tbar .tsp{display:none}.tbar .ksel{min-width:130px;flex:1}.tbar .btn.sm{flex:1;justify-content:center}}
</style>`);

/* ===================== Timeline v2 =====================
   • Team → Person → Task rows (collapsible). Person row shows their workload as a light strip.
   • Drag a bar to move it, drag its left / right edge to change start / due. Saved instantly.
   • People cards (open · today · late · "working on today") under Teams, click to see one person's work. */
const tStart=t=>{const s=t.start||addD(t.due,-(t.pri==='High'?4:2));return s>t.due?t.due:s};
const tActive=t=>t.st!=='Done'&&tStart(t)<=TODAY&&t.due>=TODAY;
const tLate=t=>t.st!=='Done'&&t.due<TODAY;
const canMove=t=>isAdm()||t.o===S.me||t.by===S.me;
const dDiff=(a,b)=>Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/864e5);
function scopeTasks(){S.kp=S.kp||'all';return myTasks().filter(t=>S.kp==='all'||t.proj===S.kp)}

/* People cards: who is doing what in the selected team */
function peopleBar(){const T=scopeTasks(),ks=[...new Set(T.map(t=>t.o))].filter(Boolean);if(!ks.length)return '';S.kw=S.kw||'all';
 const row=k=>{const L=T.filter(t=>t.o===k),open=L.filter(t=>t.st!=='Done'),td=L.filter(tActive),lt=L.filter(tLate),now=td.sort((a,b)=>a.due.localeCompare(b.due))[0]||open.sort((a,b)=>a.due.localeCompare(b.due))[0];
  return {k,open:open.length,td:td.length,lt:lt.length,now}};
 const R=ks.map(row).sort((a,b)=>b.lt-a.lt||b.td-a.td||b.open-a.open);
 const team=S.kp==='all'?'All teams':projN(S.kp);
 return `<div class="tppl"><div class="tppl-h"><b>People · ${h(team)}</b><span class="xs mut">${R.length} ${R.length===1?'person':'people'} · tap a person to see only their work</span>${S.kw!=='all'?`<button class="tclr" data-a="kwSet" data-k="all">✕ Show everyone</button>`:''}</div>
 <div class="tppl-l">${R.map(r=>`<button class="tpc ${S.kw===r.k?'on':''}" data-a="kwSet" data-k="${r.k}">${av(nm(r.k))}<span class="tpc-b"><b>${h(nmF(r.k))}</b><span class="tpc-s"><em>${r.open} open</em>${r.td?`<em class="g">${r.td} today</em>`:''}${r.lt?`<em class="r">${r.lt} late</em>`:''}</span><span class="tpc-n">${r.now?(tActive(r.now)?'Now: ':'Next: ')+h(r.now.t):'Nothing open'}</span></span></button>`).join('')}</div></div>`}
A.kwSet=e=>{S.kw=e.dataset.k;render()};

/* Timeline */
const GX={n:{'2w':14,'5w':35,'3m':91}};
taskGantt=function(){S.gz=S.gz||'5w';const N=GX.n[S.gz];S.gs=S.gs||wkStart(addD(TODAY,-7));const s=S.gs,days=Array.from({length:N},(_,i)=>addD(s,i)),e=days[N-1];
 S.kw=S.kw||'all';const T=scopeTasks().filter(t=>S.kw==='all'||t.o===S.kw);
 const col=d=>dDiff(s,d);S.gc=S.gc||{};
 const cell=S.gz==='3m'?16:S.gz==='2w'?64:34;
 const head=`<div class="gx-tools"><div class="gx-nav"><button data-a="gxNav" data-n="-1" aria-label="Earlier">‹</button><button data-a="gxNav" data-n="0">Today</button><button data-a="gxNav" data-n="1" aria-label="Later">›</button></div><b class="gx-rng">${fmt(s)} – ${fmtY(e)}</b><span class="tsp"></span>
  <div class="vsw">${[['2w','2 weeks'],['5w','5 weeks'],['3m','3 months']].map(([k,n])=>`<button class="${S.gz===k?'on':''}" data-a="gxZ" data-t="${k}">${n}</button>`).join('')}</div>
  <button class="btn sm sec" data-a="gxAll" data-o="${Object.values(S.gc).some(Boolean)?1:0}">${Object.values(S.gc).some(Boolean)?'Expand all':'Collapse all'}</button></div>`;
 const grid=(inner,cls='')=>`<div class="gx-g ${cls}" style="--n:${N}">${days.map((d,i)=>{const w=new Date(d+'T12:00:00').getDay();return `<i class="gx-c ${w===0?'sun':''} ${d===TODAY?'now':''}" style="grid-column:${i+1}"></i>`}).join('')}${inner}</div>`;
 const bar=t=>{const a=col(tStart(t)),b=col(t.due);if(b<0||a>N-1)return '';const c=KCOL.find(x=>x[0]===colOf(t)),A1=Math.max(0,a),B1=Math.min(N-1,b),mv=canMove(t);
  return `<div class="gx-b ${mv?'mv':''} ${tLate(t)?'late':''}" data-gid="${t.id}" data-a0="${a}" data-b0="${b}" style="grid-column:${A1+1}/${B1+2};--bc:${c[2]}" title="${h(t.t)} · ${fmt(tStart(t))} → ${fmt(t.due)}${mv?' · drag to move, drag the edges to change dates':''}">${mv&&a>=0?'<span class="gx-h l"></span>':''}<span class="gx-bt">${a===b?fmt(t.due):fmt(tStart(t))+' – '+fmt(t.due)}</span>${mv&&b<=N-1?'<span class="gx-h r"></span>':''}</div>`};
 const load=L=>L.filter(t=>t.st!=='Done').map(t=>{const a=Math.max(0,col(tStart(t))),b=Math.min(N-1,col(t.due));return b<0||a>N-1?'':`<i class="gx-ld" style="grid-column:${a+1}/${b+2}"></i>`}).join('');
 const groups=(S.kp==='all'?D.projects.filter(p=>T.some(t=>t.proj===p.id)):D.projects.filter(p=>p.id===S.kp)).concat(T.some(t=>!D.projects.find(p=>p.id===t.proj))?[{id:'_none',n:'No project'}]:[]);
 const inG=(t,g)=>g.id==='_none'?!D.projects.find(p=>p.id===t.proj):t.proj===g.id;
 let body='';
 groups.forEach(g=>{const GT=T.filter(t=>inG(t,g));if(!GT.length)return;const gk='p:'+g.id,gc=S.gc[gk];
  body+=`<div class="gx-r gx-team"><button class="gx-l" data-a="gxTog" data-k="${gk}"><span class="gx-ar ${gc?'':'o'}">▸</span><i style="background:${projCol(g.id)}"></i><b>${h(g.n)}</b><span class="gx-cnt">${GT.filter(t=>t.st!=='Done').length} open · ${[...new Set(GT.map(t=>t.o))].length} people</span></button>${grid('')}</div>`;
  if(gc)return;
  [...new Set(GT.map(t=>t.o))].sort((a,b)=>nmF(a).localeCompare(nmF(b))).forEach(k=>{const PT=GT.filter(t=>t.o===k).sort((a,b)=>tStart(a).localeCompare(tStart(b))),pk='u:'+g.id+':'+k,pc=S.gc[pk],td=PT.filter(tActive).length,lt=PT.filter(tLate).length;
   body+=`<div class="gx-r gx-per"><button class="gx-l" data-a="gxTog" data-k="${pk}"><span class="gx-ar ${pc?'':'o'}">▸</span>${av(nm(k),'s')}<b>${h(nmF(k))}</b><span class="gx-cnt">${PT.length} task${PT.length>1?'s':''}${td?` · <em class="g">${td} today</em>`:''}${lt?` · <em class="r">${lt} late</em>`:''}</span></button>${grid(load(PT),'ld')}</div>`;
   if(!pc)PT.forEach(t=>{const c=KCOL.find(x=>x[0]===colOf(t));body+=`<div class="gx-r gx-task"><button class="gx-l" data-a="tOpen" data-id="${t.id}"><i class="gx-dot" style="background:${c[2]}"></i><span class="gx-tt"><b>${h(t.t)}</b><span>${c[1]}${t.pri==='High'?' · High':''}${tLate(t)?' · <em class="r">late</em>':tActive(t)?' · <em class="g">today</em>':''}</span></span></button>${grid(bar(t))}</div>`})})});
 const tline=col(TODAY)>=0&&col(TODAY)<N?`<i class="gx-now" style="left:calc(var(--lw) + (100% - var(--lw)) * ${(col(TODAY)+.5)/N})"></i>`:'';
 return head+`<div class="gx" style="--n:${N};--cw:${cell}px"><div class="gx-in"><div class="gx-r gx-hd"><div class="gx-l">Team / person / task</div><div class="gx-g" style="--n:${N}">${days.map((d,i)=>{const x=new Date(d+'T12:00:00'),wd=x.getDay(),lab=S.gz==='3m'?(x.getDate()===1||i===0?`<b>${x.toLocaleDateString('en-IN',{month:'short'})}</b>`:wd===1?x.getDate():''):(wd===1||i===0?`<b>${x.getDate()} ${x.toLocaleDateString('en-IN',{month:'short'})}</b>`:x.getDate());return `<div class="gx-d ${d===TODAY?'now':''} ${wd===0?'sun':''}" style="grid-column:${i+1}">${S.gz==='2w'?`<small>${x.toLocaleDateString('en-IN',{weekday:'short'})}</small>`:''}${lab}</div>`}).join('')}</div></div>${body||`<div class="gx-empty">${empty('No tasks in this view','Change the team or person filter')}</div>`}${tline}</div></div>
 <div class="xs mut" style="margin-top:8px">Drag a bar to move a task · drag its left or right edge to change the start or due date · tap a task name to open it · colours: grey To do, blue Planning, red Stuck, green Completed.</div>`};
A.gxNav=e=>{const n=+e.dataset.n,N=GX.n[S.gz||'5w'];S.gs=n?addD(S.gs||wkStart(TODAY),n*(N>=35?14:7)):wkStart(addD(TODAY,N>=35?-7:-2));render()};
A.gxZ=e=>{S.gz=e.dataset.t;S.gs=wkStart(addD(TODAY,S.gz==='2w'?-2:S.gz==='3m'?-14:-7));render()};
A.gxTog=e=>{S.gc=S.gc||{};S.gc[e.dataset.k]=!S.gc[e.dataset.k];render()};
A.gxAll=e=>{S.gc={};if(e.dataset.o==='0'){D.projects.forEach(p=>{S.gc['p:'+p.id]=true})}render()};

/* drag to move / resize */
(function(){let G=null;
 const daysOf=(el,dx)=>{const g=el.closest('.gx-g'),N=+getComputedStyle(g).getPropertyValue('--n')||35;return Math.round(dx/(g.getBoundingClientRect().width/N))};
 document.addEventListener('pointerdown',e=>{const b=e.target.closest&&e.target.closest('.gx-b.mv');if(!b||e.button>0)return;const t=D.tasks.find(x=>x.id===b.dataset.gid);if(!t)return;
  const mode=e.target.classList.contains('gx-h')?(e.target.classList.contains('l')?'l':'r'):'m';
  G={b,t,mode,x:e.clientX,a0:+b.dataset.a0,b0:+b.dataset.b0,d:0,moved:false,N:+getComputedStyle(b.closest('.gx-g')).getPropertyValue('--n')};
  b.setPointerCapture(e.pointerId);b.classList.add('drag');e.preventDefault()});
 document.addEventListener('pointermove',e=>{if(!G)return;const dx=e.clientX-G.x;if(Math.abs(dx)>4)G.moved=true;const d=daysOf(G.b,dx);if(d===G.d)return;G.d=d;
  let a=G.a0,b=G.b0;if(G.mode==='m'){a+=d;b+=d}else if(G.mode==='l'){a=Math.min(G.a0+d,G.b0)}else{b=Math.max(G.b0+d,G.a0)}
  G.b.style.gridColumn=`${Math.max(0,a)+1}/${Math.min(G.N-1,b)+2}`;const s=addD(S.gs,a),u=addD(S.gs,b);const tx=G.b.querySelector('.gx-bt');if(tx)tx.textContent=a===b?fmt(u):fmt(s)+' – '+fmt(u)});
 const end=()=>{if(!G)return;const {t,b,moved,d,mode}=G;G=null;b.classList.remove('drag');
  if(!moved||!d){if(!moved)A.tOpen({dataset:{id:t.id}});return}
  const s0=tStart(t),u0=t.due;let s=s0,u=u0;if(mode==='m'){s=addD(s0,d);u=addD(u0,d)}else if(mode==='l'){s=addD(s0,d);if(s>u)s=u}else{u=addD(u0,d);if(u<s)u=s}
  t.start=s;t.due=u;(t.log=t.log||[]).push({by:S.me,at:TODAY,x:`Dates changed ${fmt(s0)}–${fmt(u0)} → ${fmt(s)}–${fmt(u)}`});save();render();
  toast(`${t.t.length>34?t.t.slice(0,34)+'…':t.t}: ${s===u?fmt(u):fmt(s)+' → '+fmt(u)}`)};
 document.addEventListener('pointerup',end);document.addEventListener('pointercancel',()=>{if(G){G.b.classList.remove('drag');G=null;render()}});
})();

/* People cards on Projects and Timeline */
const _kbP=kanban;kanban=function(){const o=_kbP();return o.replace('<div class="ktool tbar">',peopleBar()+'<div class="ktool tbar">')};
const _vtP=V.tasks;V.tasks=()=>{const o=_vtP();if(S.ttab!=='time')return o;return o.replace(/(<div class="tteam">[\s\S]*?<\/div><\/div>)/,'$1'+peopleBar())};

document.head.insertAdjacentHTML('beforeend',`<style>
.tppl{background:#fff;border:1px solid var(--line);border-radius:16px;padding:12px 14px;margin-bottom:12px}
.tppl-h{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px}.tppl-h b{font-size:14px}
.tclr{margin-left:auto;border:0;background:#EEF1F6;border-radius:999px;padding:6px 12px;font-weight:700;font-size:12.5px;cursor:pointer;color:var(--ink)}
.tppl-l{display:flex;gap:10px;overflow-x:auto;padding-bottom:4px;scrollbar-width:thin}
.tpc{flex:none;width:236px;display:flex;gap:10px;align-items:flex-start;text-align:left;border:1px solid var(--line);background:#FAFBFC;border-radius:14px;padding:10px 12px;cursor:pointer;font:inherit;color:var(--ink)}
.tpc:hover{border-color:#B9C3D6;background:#fff}.tpc.on{border-color:#24408E;background:#EEF2FB;box-shadow:inset 0 0 0 1px #24408E}
.tpc-b{display:flex;flex-direction:column;gap:3px;min-width:0}.tpc-b>b{font-size:14px}
.tpc-s{display:flex;gap:5px;flex-wrap:wrap}.tpc-s em,.gx-cnt em{font-style:normal;font-size:11.5px;font-weight:700;border-radius:8px;padding:1px 7px;background:#EEF1F6;color:var(--mut)}
.tpc-s em.g,.gx-cnt em.g,.gx-tt em.g{background:#E5F5EC;color:#1F7A45}.tpc-s em.r,.gx-cnt em.r,.gx-tt em.r{background:#FDE8E8;color:#C0392B}
.tpc-n{font-size:12px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:170px}
.gx-tools{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:#EEF1F6;border-radius:14px;padding:8px 10px;margin-bottom:12px}
.gx-nav{display:inline-flex;background:#DDE2EB;border-radius:10px;padding:3px;gap:2px}.gx-nav button{border:0;background:#fff;border-radius:8px;padding:6px 12px;font-weight:700;cursor:pointer;color:#24408E}
.gx-rng{font-size:14px}.gx-tools .vsw{background:#DDE2EB;border:0}.gx-tools .vsw button.on{background:#fff;color:#24408E;box-shadow:0 1px 3px rgba(16,24,40,.15)}
.gx{--lw:290px;background:#fff;border:1px solid var(--line);border-radius:14px;overflow:auto;max-height:calc(100vh - 220px)}
.gx-in{position:relative;min-width:calc(var(--lw) + var(--n) * var(--cw))}
.gx-r{display:grid;grid-template-columns:var(--lw) 1fr;border-bottom:1px solid #F0F2F5}
.gx-l{position:sticky;left:0;z-index:3;background:inherit;display:flex;align-items:center;gap:8px;padding:8px 12px;border:0;border-right:1px solid var(--line);text-align:left;font:inherit;color:var(--ink);cursor:pointer;min-width:0}
.gx-r{background:#fff}.gx-hd{position:sticky;top:0;z-index:5;background:#F7F8FA}.gx-hd .gx-l{cursor:default;font-size:12px;font-weight:700;color:var(--mut)}
.gx-g{display:grid;grid-template-columns:repeat(var(--n),1fr);grid-template-rows:1fr;position:relative;align-items:center;min-height:44px}
.gx-c{grid-row:1;align-self:stretch;border-left:1px solid #F3F4F7}.gx-c.sun{background:#FBF5F5}.gx-c.now{background:#EEF2FB}
.gx-d{grid-row:1;text-align:center;font-size:11.5px;color:var(--mut);padding:6px 0;line-height:1.2;white-space:nowrap}.gx-d small{display:block;font-size:10px}.gx-d.sun{color:#D04545}.gx-d.now{color:#fff;background:#24408E;border-radius:8px;font-weight:800}
.gx-team{background:#F4F6FA}.gx-team .gx-l{font-size:13px;letter-spacing:.03em;text-transform:uppercase}.gx-team .gx-l>i{width:10px;height:10px;border-radius:50%;flex:none}.gx-team .gx-g{min-height:40px}
.gx-per .gx-l{padding-left:26px}.gx-per .gx-g{min-height:40px}
.gx-task .gx-l{padding-left:50px}.gx-task .gx-l:hover b{color:#24408E;text-decoration:underline}
.gx-ar{display:inline-block;transition:transform .15s;color:var(--mut);font-size:12px;width:12px}.gx-ar.o{transform:rotate(90deg)}
.gx-cnt{margin-left:auto;font-size:11.5px;font-weight:600;color:var(--mut);text-transform:none;letter-spacing:0;white-space:nowrap}
.gx-dot{width:8px;height:8px;border-radius:50%;flex:none}
.gx-tt{display:flex;flex-direction:column;min-width:0}.gx-tt b{font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gx-tt span{font-size:12px;color:var(--mut)}.gx-tt em{font-style:normal;font-weight:700;border-radius:6px;padding:0 5px}
.gx-ld{grid-row:1;height:8px;border-radius:4px;background:#24408E;opacity:.16;margin:0 1px}
.gx-b{grid-row:1;position:relative;z-index:1;height:28px;border-radius:8px;background:var(--bc);color:#fff;font-size:11.5px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 10px;white-space:nowrap;overflow:hidden;margin:0 2px;box-shadow:0 1px 2px rgba(16,24,40,.15);user-select:none;touch-action:none}
.gx-b.mv{cursor:grab}.gx-b.drag{cursor:grabbing;box-shadow:0 6px 16px rgba(16,24,40,.25);opacity:.95;z-index:4;outline:2px solid #fff}
.gx-b.late{outline:2px solid #E03A3E;outline-offset:1px}
.gx-bt{pointer-events:none;overflow:hidden;text-overflow:ellipsis}
.gx-h{position:absolute;top:0;bottom:0;width:10px;cursor:ew-resize;touch-action:none}.gx-h.l{left:0}.gx-h.r{right:0}
.gx-h::after{content:'';position:absolute;top:8px;bottom:8px;left:4px;width:2px;border-radius:1px;background:rgba(255,255,255,.75);opacity:0}.gx-b:hover .gx-h::after,.gx-b.drag .gx-h::after{opacity:1}
.gx-now{position:absolute;top:0;bottom:0;width:2px;background:#F28C28;z-index:2;pointer-events:none}
.gx-empty{padding:10px}
@media(max-width:760px){.gx{--lw:170px}.gx-cnt{display:none}.gx-task .gx-l{padding-left:22px}.gx-per .gx-l{padding-left:14px}.tpc{width:210px}}
</style>`);
/* switching team clears a person filter that doesn't belong to that team */
const _kpP=A.kp;A.kp=e=>{const p=e.dataset.t;if(S.kw&&S.kw!=='all'&&p!=='all'&&!myTasks().some(t=>t.proj===p&&t.o===S.kw))S.kw='all';_kpP(e)};
