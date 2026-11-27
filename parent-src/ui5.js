/* ===================== Premium Communication header · personal daily line · date chip ===================== */
/* ---- date chip: same look on Dashboard and Tasks ---- */
document.head.insertAdjacentHTML('beforeend','<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&display=swap">');
const dateChip=()=>{const d=new Date(TODAY+'T12:00:00');return `<span class="dchip" aria-label="${d.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}"><span class="dccal"><span class="dcmo">${d.toLocaleDateString('en-IN',{month:'short'}).toUpperCase()}</span><span class="dcn">${d.getDate()}</span></span><span class="dctx"><span class="dcd">${d.toLocaleDateString('en-IN',{weekday:'long'})}</span><span class="dcm">${d.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</span></span></span>`};
/* ---- short line, different for every person every day ---- */
const LINES=['Own today.','Small wins, every day.','Finish what you start.','Make every call count.','Customers first, always.','Done is better than perfect.','Follow up. Then follow up again.','Be the calm in the rush.','Speed with care.','Plan it. Do it. Close it.','Earn trust, one task at a time.','Fix it, don’t just flag it.','One team, one target.','Quality is our signature.','Show up. Stand out.','Today’s effort, tomorrow’s growth.','Keep promises small and sure.','Listen first, then solve.','Progress over excuses.','Every detail matters.','Make someone’s day easier.','Commit fully, deliver fully.','Clear head, clean work.','Learn one thing today.','Results speak loudest.','Respect time — always.','Lead by doing.','Simple, fast, right.','Ask, learn, grow.','Own the result.','Kind words, strong work.','Win the morning.','Make it count today.','Stay curious, stay sharp.','Better than yesterday.','Deliver what you promise.','Think customer.','Every rupee counts.','Energy is contagious.','Teamwork wins.'];
const lineFor=k=>{const ks=Object.keys(P).sort(),i=Math.max(0,ks.indexOf(k));return LINES[(dayIdx()+i)%LINES.length]};
const _homeL5=V.home;V.home=()=>{const o=_homeL5();return o.replace(/<div class="greet greetR"><div class="gdt">[\s\S]*?<\/div><h1>[\s\S]*?<\/h1><\/div>/,`<div class="greet greetR g5">${dateChip()}<div class="gline">${h(lineFor(S.me))}</div></div>`)};
const _thd5=taskHead;taskHead=function(me){return _thd5(me).replace(/<span class="tpill hide-m">[^<]*<\/span>/,`<span class="hide-m">${dateChip()}</span>`)};

/* ---- Communication header ---- */
chatHead=function(){if(S.chm==='wa'){S.chm='crm';S.cmv='inbox'}if(S.chm==='call'){S.chm='crm';S.cmv='calls'}
 const m=S.chm,co=cmCo(),cos=cmCos(),G=myGroups(),unT=G.reduce((a,g)=>a+unreadG(g),0),inf=cmInfo(co),T=myWaTeams(),unC=cmWA().filter(c=>c.unread).length;
 const numOf=k=>{if(k==='all'){const n=CM_CO.filter(x=>{const v=cmNum(x[0]);return v.wa||v.vn}).length;return n+' of '+CM_CO.length+' numbers connected'}const v=cmNum(k);return v.wa||v.vn?(v.wa||v.vn):'Number to be added'};
 const cnt=k=>D.wa.filter(c=>(k==='all'?true:cmTeams(k).includes(c.team))&&_myWaCM().includes(c.team)).length;
 const nav=(k,l,i,c)=>`<button class="c5n ${m===k?'on':''}" data-a="chm" data-t="${k}">${ic(i)}<span>${l}</span>${c?`<em>${c}</em>`:''}</button>`;
 const dd=cos.length>1?`<div class="ccdd ${S.cmdd?'open':''}"><button class="ccbtn" data-a="cmDD" aria-haspopup="listbox" aria-expanded="${!!S.cmdd}" style="--cc:${inf[4]}"><span class="ccav">${h(inf[3].slice(0,2).toUpperCase())}</span><span class="cctx"><b>${h(inf[1])}</b><small>${h(numOf(co))}</small></span><span class="ccchev">▾</span></button>
   ${S.cmdd?`<div class="ccmenu" role="listbox">${cos.map(k=>{const x=cmInfo(k);return `<button role="option" aria-selected="${k===co}" class="${k===co?'on':''}" data-a="cmCo" data-k="${k}" style="--cc:${x[4]}"><span class="ccav">${h(x[3].slice(0,2).toUpperCase())}</span><span class="cctx"><b>${h(x[1])}</b><small>${h(numOf(k))}</small></span><span class="ccn">${cnt(k)}</span></button>`}).join('')}${isAdm()?`<button class="ccedit" data-a="cmNums">Edit company numbers</button>`:''}</div>`:''}</div>`
  :`<div class="ccdd"><div class="ccbtn static" style="--cc:${inf[4]}"><span class="ccav">${h(inf[3].slice(0,2).toUpperCase())}</span><span class="cctx"><b>${h(inf[1])}</b><small>${h(numOf(co))}</small></span></div></div>`;
 const groups=m==='team'?chatTeamsRow():'';
 return `<div class="c5h"><div class="c5l">${m==='crm'?dd:`<div class="c5t"><b>${m==='email'?'Email':'Team chat'}</b><small>${m==='email'?'Your own mailbox':'Company groups · everyone in the team'}</small></div>`}
  ${m==='crm'?`<div class="usq ${S.cmq?'on':''}">${sfi('search',17)}<label class="sr" for="cmq">Search customers</label><input id="cmq" value="${h(S.cmq||'')}" placeholder="Search customers — name, number or anything said in chat" autocomplete="off">${S.cmq?`<button class="ib" data-a="cmQx" aria-label="Clear search">✕</button>`:''}</div>`:''}</div>
  <nav class="c5nav" aria-label="Communication">${nav('crm','CRM','users',T.length?unC:0)}${nav('email','Email','mail',0)}${nav('team','Team chat','chat',unT)}</nav></div>${groups}`};
A.cmDD=()=>{S.cmdd=!S.cmdd;render()};
const _cmCo5=A.cmCo;A.cmCo=e=>{S.cmdd=false;_cmCo5(e)};
document.addEventListener('click',e=>{if(S.cmdd&&!(e.target.closest&&e.target.closest('.ccdd'))){S.cmdd=false;render()}},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&S.cmdd){S.cmdd=false;render()}});

document.head.insertAdjacentHTML('beforeend',`<style>




.dchip{display:inline-flex;align-items:center;gap:10px;background:#fff;border:1px solid #E3E7EF;border-radius:14px;padding:5px 14px 5px 5px;box-shadow:0 2px 6px -2px rgba(16,24,40,.10)}
.dccal{display:flex;flex-direction:column;align-items:center;width:40px;border-radius:9px;overflow:hidden;border:1px solid #E3E7EF;background:#fff}
.dcmo{display:block;width:100%;text-align:center;background:#24408E;color:#fff;font:700 9.5px Outfit,Inter,sans-serif;letter-spacing:.12em;padding:2px 0}
.dcn{font:800 18px/1.15 Outfit,Inter,sans-serif;color:#0B1F3A;padding:1px 0 3px;letter-spacing:-.02em}
.dctx{display:flex;flex-direction:column;line-height:1.1}.dcd{font:700 21px 'Dancing Script','Brush Script MT',cursive;color:#1D3378;letter-spacing:.01em}.dcm{font:italic 600 12.5px 'Playfair Display',Georgia,serif;color:#5B6475}
.g5{display:flex;flex-direction:column;align-items:flex-end;gap:6px}
.gline{font:italic 500 17px 'Playfair Display',Georgia,serif;color:#24408E;letter-spacing:.1px}
@media(max-width:760px){.g5{align-items:flex-start}.gline{font-size:15px}}
.c5h{display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,#0B1F3A 0%,#1A3466 100%);border-radius:18px;padding:12px 14px;margin:0 0 12px;box-shadow:0 10px 30px rgba(11,31,58,.18)}
.c5l{display:flex;align-items:center;gap:12px;flex:1;min-width:0}
.c5t{display:flex;flex-direction:column;color:#fff;padding:2px 6px}.c5t b{font-size:17px}.c5t small{color:#AFC0DE;font-size:12px}
.ccdd{position:relative;flex:none}
.ccbtn{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);border-radius:14px;padding:7px 12px 7px 8px;cursor:pointer;color:#fff;min-width:250px;text-align:left;font:inherit}
.ccbtn:hover,.ccdd.open .ccbtn{background:rgba(255,255,255,.14)}.ccbtn.static{cursor:default}
.ccav{width:34px;height:34px;border-radius:10px;background:var(--cc);display:inline-flex;align-items:center;justify-content:center;font:800 12px Inter,sans-serif;color:#fff;flex:none;box-shadow:0 0 0 2px rgba(255,255,255,.25)}
.cctx{display:flex;flex-direction:column;min-width:0;flex:1}.cctx b{font-size:14.5px;white-space:nowrap}.cctx small{font-size:11.5px;color:#AFC0DE;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ccchev{color:#C9D3E6;font-size:13px;transition:transform .15s}.ccdd.open .ccchev{transform:rotate(180deg)}
.ccmenu{position:absolute;top:calc(100% + 8px);left:0;z-index:80;width:320px;background:#fff;border-radius:16px;padding:6px;box-shadow:0 18px 50px rgba(11,31,58,.28);border:1px solid #E6E9EF}
.ccmenu button{display:flex;align-items:center;gap:10px;width:100%;border:0;background:none;padding:8px;border-radius:11px;cursor:pointer;text-align:left;font:inherit;color:var(--ink)}
.ccmenu button:hover{background:#F4F6FA}.ccmenu button.on{background:#EEF2FB}.ccmenu .cctx small{color:var(--mut)}
.ccn{font:700 12px Inter,sans-serif;background:#F1F3F8;border-radius:999px;padding:2px 9px;color:#4A5468}
.ccmenu .ccedit{justify-content:center;color:#24408E;font-weight:700;font-size:13px;border-top:1px solid #F0F2F5;border-radius:0 0 11px 11px;margin-top:4px}
.c5h .usq{order:0;flex:1;min-width:200px;background:rgba(255,255,255,.96);border:0;height:46px;border-radius:13px}
.c5h .usq:focus-within,.c5h .usq.on{background:#fff;box-shadow:0 0 0 3px rgba(242,140,40,.45)}
.c5nav{display:flex;gap:4px;background:rgba(255,255,255,.08);border-radius:14px;padding:4px;flex:none}
.c5n{display:inline-flex;align-items:center;gap:7px;border:0;background:transparent;border-radius:10px;padding:9px 14px;font:700 13.5px Inter,sans-serif;color:#C9D3E6;cursor:pointer}
.c5n .ico{width:16px;height:16px}.c5n:hover{color:#fff;background:rgba(255,255,255,.08)}
.c5n.on{background:#fff;color:#0B1F3A;box-shadow:0 2px 8px rgba(0,0,0,.18)}
.c5n em{font-style:normal;background:#F28C28;color:#fff;border-radius:999px;font-size:10.5px;font-weight:800;padding:1px 7px}
.c5g{display:flex;gap:6px;flex-wrap:wrap;margin:-2px 0 12px}.c5g button{border:1px solid #E3E7EF;background:#fff;border-radius:999px;padding:7px 14px;font:700 13px Inter,sans-serif;color:#3B4456;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.c5g button.on{background:#0B1F3A;border-color:#0B1F3A;color:#fff}.c5g em{font-style:normal;background:#E5484D;color:#fff;border-radius:999px;font-size:10.5px;padding:0 6px}
.c5g .c5add{border-style:dashed;color:#24408E}.c5g .c5add .ico{width:14px;height:14px}
.cmh2,.cnum{display:none!important}
@media(max-width:760px){.c5h{flex-direction:column;align-items:stretch;gap:10px;border-radius:14px}.c5l{flex-direction:column;align-items:stretch}.ccbtn{min-width:0;width:100%}.ccmenu{width:100%}.c5nav{justify-content:space-between}.c5n{flex:1;justify-content:center;padding:8px 6px}.c5n span{font-size:12.5px;white-space:nowrap}.c5h .usq{flex:none;height:44px}}
</style>`);

/* ===== Team chat = the same teams as Tasks (one chat group per team) + Announcement + "All teams" overview ===== */
const PJ2G={smm:'smm',acc:'acc',wh:'wh',hr:'hrt',cse:'cse',ops:'ops',gb:'goa'};
function syncTeamGroups(){let ch=false;(D.projects||[]).forEach(p=>{const gid=PJ2G[p.id]||'pj_'+p.id;let g=D.groups.find(x=>x.id===gid);
  if(!g){g={id:gid,n:p.n,m:[...new Set(['darshan','nameera',...(p.m||[])])]};D.groups.push(g);ch=true}
  else{if(g.n!==p.n){g.n=p.n;ch=true}(p.m||[]).forEach(k=>{if(!g.m.includes(k)){g.m.push(k);ch=true}})}});if(ch)save()}
const teamGroups=()=>{syncTeamGroups();const mine=myGroups(),ids=new Set(mine.map(g=>g.id));
 const ann=mine.filter(g=>g.id==='ann'),teams=(D.projects||[]).map(p=>({p,g:D.groups.find(x=>x.id===(PJ2G[p.id]||'pj_'+p.id))})).filter(x=>x.g&&ids.has(x.g.id));
 const other=mine.filter(g=>g.id!=='ann'&&!teams.some(t=>t.g.id===g.id));return {ann,teams,other}};
function chatTeamsRow(){const {ann,teams,other}=teamGroups(),all=[...ann,...teams.map(t=>t.g),...other],tot=all.reduce((a,g)=>a+unreadG(g),0);
 if(!S.chat||(S.chat!=='__all'&&!all.some(g=>g.id===S.chat)))S.chat='__all';
 const chip=(id,n,col,u)=>`<button class="kchip ${S.chat===id?'on':''}" style="--pc:${col}" data-a="chatGo" data-id="${id}"><i></i>${h(n)}${u?` <span>${u}</span>`:''}</button>`;
 return `<div class="tteam ctteam"><div class="tlbl">${ic('users')}Teams</div><div class="kchips">${chip('__all','All teams','#24408E',tot)}${ann.map(g=>chip(g.id,'📣 '+g.n,'#F28C28',unreadG(g))).join('')}${teams.map(t=>chip(t.g.id,t.p.n,projCol(t.p.id),unreadG(t.g))).join('')}${other.map(g=>chip(g.id,g.n,'#8A93A3',unreadG(g))).join('')}${isAdm()?`<button class="kchip c5addc" data-a="grpNew">${ic('plus')}New group</button>`:''}</div></div>`}
function chatOverview(){const {ann,teams,other}=teamGroups(),rows=[...ann.map(g=>({g,n:'📣 '+g.n,col:'#F28C28'})),...teams.map(t=>({g:t.g,n:t.p.n,col:projCol(t.p.id)})),...other.map(g=>({g,n:g.n,col:'#8A93A3'}))];
 return `<div class="chov">${rows.map(({g,n,col})=>{const M=D.msgs.filter(m=>m.g===g.id),l=M[M.length-1],u=unreadG(g);
  return `<button class="chor" data-a="chatGo" data-id="${g.id}" style="--pc:${col}"><span class="chav">${h(n.replace('📣 ','').slice(0,2).toUpperCase())}</span><span class="chb"><span class="cht"><b>${h(n)}</b><small>${l?h(l.at||''):''}</small></span><span class="chm">${l?`<em>${h(nmF(l.f).split(' ')[0])}:</em> ${h((l.t||(l.kind==='voice'?'🎤 Voice note':'📎 File')).slice(0,90))}`:'<span class="mut">No messages yet</span>'}</span><span class="chs">${(g.m||[]).length} members</span></span>${u?`<span class="chu">${u}</span>`:''}</button>`}).join('')}</div>`}
const _vChat5=V.chat;V.chat=()=>{if(S.chm==='team'){teamGroups();if(!S.chat||S.chat==='__all'){S.chat='__all';return chatHead()+chatOverview()}}return _vChat5()};
document.head.insertAdjacentHTML('beforeend',`<style>
.ctteam{margin:-2px 0 12px}.ctteam .kchips{flex-wrap:wrap;overflow:visible}.c5g{display:none}
.kchip.c5addc{border:1px dashed #B9C3D6;background:#fff;color:#24408E;display:inline-flex;align-items:center;gap:5px}.kchip.c5addc .ico{width:14px;height:14px}
.chov{background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden}
.chor{display:flex;align-items:center;gap:12px;width:100%;border:0;border-bottom:1px solid #F0F2F5;background:#fff;padding:12px 14px;text-align:left;cursor:pointer;font:inherit;color:var(--ink)}.chor:hover{background:#F7F8FB}
.chav{width:42px;height:42px;border-radius:12px;background:var(--pc);color:#fff;display:inline-flex;align-items:center;justify-content:center;font:800 13px Inter,sans-serif;flex:none}
.chb{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.cht{display:flex;gap:8px}.cht b{flex:1;font-size:14.5px}.cht small{font-size:11.5px;color:var(--mut)}
.chm{font-size:13px;color:#4A5468;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.chm em{font-style:normal;font-weight:700}.chs{font-size:11.5px;color:var(--mut)}
.chu{background:#1F9D55;color:#fff;border-radius:999px;font-size:11.5px;font-weight:800;padding:2px 8px}
</style>`);
render();

