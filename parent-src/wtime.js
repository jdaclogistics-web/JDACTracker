/* ===== Web timeline: Quarter + Year views (big-screen version of the phone Year view)
   Year = 12-month overview cards with progress + milestones, then a month-scale Gantt with a milestone lane.
   Bars are still draggable (by day). Click a month card or a month header to open that month. ===== */
TL4.q=['Quarter',91];TL4.y=['Year',365];
const wtIso=x=>{const y=x.getFullYear(),m=String(x.getMonth()+1).padStart(2,'0'),d=String(x.getDate()).padStart(2,'0');return `${y}-${m}-${d}`};
const wtD=d=>new Date(d+'T12:00:00');
const _tl4Range=tl4Range;
tl4Range=function(){const v=S.tl4||'w',x=wtD(S.tl4d||TODAY);
 if(v==='y')return [x.getFullYear()+'-01-01',x.getFullYear()+'-12-31'];
 if(v==='q'){const q=Math.floor(x.getMonth()/3)*3;return [wtIso(new Date(x.getFullYear(),q,1)),wtIso(new Date(x.getFullYear(),q+3,0))]}
 return _tl4Range()};
const _tl4=tl4;
tl4=function(){const v=S.tl4||'w';if(v!=='y'&&v!=='q')return _tl4();
 const pj=S.tlp||'all',pe=S.tlo||'all',[s,e]=tl4Range(),ND=dDiff(s,e)+1,y=wtD(s).getFullYear(),m0=wtD(s).getMonth(),NM=v==='y'?12:3;
 const months=Array.from({length:NM},(_,i)=>{const a=wtIso(new Date(y,m0+i,1)),b=wtIso(new Date(y,m0+i+1,0));return {a,b,n:dDiff(a,b)+1}});
 const all=myTasks(),T=all.filter(t=>(pj==='all'||t.proj===pj)&&(pe==='all'||t.o===pe)&&t.due);
 const R=T.filter(t=>t.due>=s&&tStart(t)<=e);
 const people=[...new Set(all.filter(t=>pj==='all'||t.proj===pj).map(t=>t.o))].filter(Boolean).sort((a,b)=>nmF(a).localeCompare(nmF(b)));
 const projs=D.projects.filter(p=>all.some(t=>t.proj===p.id));
 const late=T.filter(tLate),dueT=T.filter(t=>t.st!=='Done'&&t.due===TODAY),prog=R.filter(t=>t.st!=='Done'&&!tLate(t)&&t.due!==TODAY),dn=R.filter(t=>t.st==='Done');
 const isMile=t=>typeof tlMile==='function'?tlMile(t):/milestone/i.test((t.tags||[]).join(' '));
 const G=(D.goals||[]).filter(g=>g.by&&g.by>=s&&g.by<=e&&(pe==='all'||!g.o||g.o===pe));
 const MS=R.filter(t=>isMile(t)&&t.due>=s&&t.due<=e);
 const lab=v==='y'?String(y):`Q${Math.floor(m0/3)+1} ${y} · ${wtD(s).toLocaleDateString('en-IN',{month:'short'})} – ${wtD(e).toLocaleDateString('en-IN',{month:'short'})}`;
 const bar=`<div class="t4bar"><div class="t4seg">${Object.entries(TL4).map(([k,x])=>`<button class="${v===k?'on':''}" data-a="t4V" data-t="${k}">${x[0]}</button>`).join('')}</div>
  <div class="t4nav"><button data-a="t4N" data-n="-1" aria-label="Previous">‹</button><b>${lab}</b><button data-a="t4N" data-n="1" aria-label="Next">›</button></div>
  <button class="t4today ${s<=TODAY&&e>=TODAY?'on':''}" data-a="t4T">${v==='y'?'This year':'This quarter'}</button><input type="date" class="t4pick" data-ch="t4Pick" value="${S.tl4d||TODAY}" aria-label="Go to date">
  <span class="tsp"></span><select class="t4sel" data-ch="tlP" aria-label="Project"><option value="all">All projects</option>${projs.map(p=>`<option value="${p.id}" ${pj===p.id?'selected':''}>${h(p.n)}</option>`).join('')}</select>
  <select class="t4sel" data-ch="tlO" aria-label="Person"><option value="all">Everyone</option>${people.map(k=>`<option value="${k}" ${pe===k?'selected':''}>${h(nmF(k))}</option>`).join('')}</select></div>`;
 const kpi=`<div class="t4kpi"><div class="r"><b>${late.length}</b><span>Overdue</span></div><div class="o"><b>${dueT.length}</b><span>Due today</span></div><div class="b"><b>${prog.length}</b><span>Ongoing</span></div><div class="g"><b>${dn.length}</b><span>Done in this ${v==='y'?'year':'quarter'}</span></div><div class="p"><b>${MS.length+G.length}</b><span>Milestones</span></div></div>`;
 const stc=t=>tLate(t)?['Overdue','#DC2626']:(()=>{const c=KCOL.find(x=>x[0]===colOf(t))||['','To do','#8A93A3'];return [c[1],c[2]]})();
 /* 1 · month overview cards */
 const cards=`<div class="wyc ${v}">${months.map(M=>{const L=T.filter(t=>t.due>=M.a&&t.due<=M.b),d=L.filter(t=>t.st==='Done').length,lt=L.filter(tLate).length,mi=L.filter(isMile),g=G.filter(x=>x.by>=M.a&&x.by<=M.b),cur=TODAY>=M.a&&TODAY<=M.b,past=M.b<TODAY,pc=L.length?Math.round(d/L.length*100):0;
  return `<button class="wycm ${cur?'cur':''} ${past?'past':''}" data-a="wtMon" data-d="${M.a}" title="Open ${wtD(M.a).toLocaleDateString('en-IN',{month:'long'})}">
   <div class="wych"><b>${wtD(M.a).toLocaleDateString('en-IN',{month:'short'})}</b>${cur?'<em>Now</em>':''}<span>${L.length?pc+'%':''}</span></div>
   <div class="wycb"><i style="width:${pc}%"></i>${lt?`<u style="width:${lt/L.length*100}%"></u>`:''}</div>
   <div class="wycn">${L.length?`<span>${d}/${L.length} done</span>${lt?`<span class="r">${lt} late</span>`:''}`:'<span class="mut">No tasks</span>'}</div>
   <div class="wycl">${g.map(x=>`<span class="wgl" title="${h(x.t)}">🎯 ${h(x.t)}</span>`).join('')}${mi.slice(0,v==='y'?2:5).map(t=>`<span style="--c:${stc(t)[1]}" title="${h(t.t)} · ${fmt(t.due)}">◆ ${h(t.t)}</span>`).join('')}${mi.length>(v==='y'?2:5)?`<span class="more">+${mi.length-(v==='y'?2:5)} more</span>`:''}</div></button>`}).join('')}</div>`;
 /* 2 · Gantt at month scale */
 const pos=d=>Math.max(0,Math.min(ND,dDiff(s,d)))/ND*100;
 const ti=dDiff(s,TODAY),now=ti>=0&&ti<ND?`<i class="t4now" style="left:${(ti+.5)/ND*100}%"></i>`:'';
 const bg=`<div class="wybg">${months.map((M,i)=>`<i class="${i%2?'alt':''} ${TODAY>=M.a&&TODAY<=M.b?'cur':''}" style="width:${M.n/ND*100}%"></i>`).join('')}</div>`;
 const head=`<div class="t4row t4hd"><div class="t4l">${v==='y'?'Task · '+y:'Task'}</div><div class="t4tr"><div class="wyhd">${v==='y'?`<div class="wyq">${[0,1,2,3].map(q=>`<span style="width:${months.slice(q*3,q*3+3).reduce((a,M)=>a+M.n,0)/ND*100}%">Q${q+1}</span>`).join('')}</div>`:''}<div class="wym">${months.map(M=>`<button class="${TODAY>=M.a&&TODAY<=M.b?'cur':''}" style="width:${M.n/ND*100}%" data-a="wtMon" data-d="${M.a}">${wtD(M.a).toLocaleDateString('en-IN',{month:v==='y'?'short':'long'})}${v==='q'?`<small>${T.filter(t=>t.due>=M.a&&t.due<=M.b).length} tasks</small>`:''}</button>`).join('')}</div></div></div></div>`;
 const pts=[...G.map(g=>({d:g.by,t:g.t,c:'#7C3AED',goal:1})),...MS.map(t=>({d:t.due,t:t.t,c:stc(t)[1],id:t.id}))].sort((a,b)=>a.d.localeCompare(b.d));
 const CL=[];pts.forEach(p=>{const x=(dDiff(s,p.d)+.5)/ND*100,c=CL[CL.length-1];if(c&&x-c.x0<(v==='y'?2.2:1.6))c.L.push(p);else CL.push({x0:x,L:[p]})});
 let lastX=[-99,-99];
 const mlane=`<div class="t4row wyml"><div class="t4l"><span class="wydi">◆</span><b>Milestones</b><span class="wycnt">${pts.length}</span></div><div class="t4tr">${bg}${now}${CL.map(c=>{const p=c.L[0],n=c.L.length,x=c.x0,row=x-lastX[0]>9?0:x-lastX[1]>9?1:2;if(row<2)lastX[row]=x;const tip=c.L.map(q=>`${q.goal?'🎯':'◆'} ${q.t} · ${fmt(q.d)}`).join('\n');const act=n>1?`data-a="wtMon" data-d="${p.d.slice(0,8)}01"`:p.id?`data-a="tOpen" data-id="${p.id}"`:'';
   return `<button class="wymk r${row} ${x>82?'lft':''}" style="left:${x}%;--c:${p.c}" ${act} title="${h(tip)}"><i>${p.goal?'🎯':''}</i>${n>1?`<b>${n}</b>`:''}${row<2?`<span>${h(p.t)}${n>1?` +${n-1}`:''}</span>`:''}</button>`}).join('')||'<span class="wyno">No milestones yet · tag a task “milestone” or mark it High priority</span>'}</div></div>`;
 const groups=(pj==='all'?D.projects.filter(p=>R.some(t=>t.proj===p.id)):D.projects.filter(p=>p.id===pj)).concat(R.some(t=>!D.projects.find(p=>p.id===t.proj))?[{id:'_none',n:'No project'}]:[]);
 const inG=(t,g)=>g.id==='_none'?!D.projects.find(p=>p.id===t.proj):t.proj===g.id;
 let body='';groups.forEach(g=>{const GT=R.filter(t=>inG(t,g)).sort((a,b)=>tStart(a).localeCompare(tStart(b))||a.due.localeCompare(b.due));if(!GT.length)return;
  const shut=!!(S.tl4c||{})[g.id],gd=GT.filter(t=>t.st==='Done').length;
  const spans=GT.map(t=>`<i style="left:${pos(tStart(t))}%;width:${Math.max(.35,pos(addD(t.due,1))-pos(tStart(t)))}%;background:${stc(t)[1]}"></i>`).join('');
  body+=`<div class="t4row t4g" style="--pc:${projCol(g.id)}"><button class="t4l t4gh" data-a="t4C" data-k="${g.id}" aria-expanded="${!shut}"><span class="t4cv">${shut?'▸':'▾'}</span><b>${h(g.n)}</b><span>${gd}/${GT.length} done</span></button><div class="t4tr">${bg}${now}<div class="wysum">${spans}</div></div></div>`;
  if(shut)return;
  GT.forEach(t=>{const a0=dDiff(s,tStart(t)),b0=dDiff(s,t.due),a=Math.max(0,a0),b=Math.min(ND-1,b0),c=stc(t);
   body+=`<div class="t4row t4t" style="--pc:${projCol(t.proj)}"><div class="t4l"><span class="t4pt">•</span>${av(nm(t.o),'s')}<button class="t4nm" data-a="tOpen" data-id="${t.id}" title="${h(t.t)}"><b>${isMile(t)?'◆ ':''}${h(t.t)}</b><span>${h(nmF(t.o))} · ${tStart(t)===t.due?fmt(t.due):fmt(tStart(t))+' – '+fmt(t.due)}</span></button><span class="t4st" style="--c:${c[1]}">${c[0]}</span></div>
   <div class="t4tr">${bg}${now}<div class="t4b wyb ${canMove(t)?'mv':''} ${a0<0?'c0':''} ${b0>ND-1?'c1':''}" role="button" tabindex="0" style="left:${a/ND*100}%;width:${(b-a+1)/ND*100}%;--c:${c[1]}" data-gid="${t.id}" data-a0="${a0}" data-b0="${b0}" data-n="${ND}" ${canMove(t)?'':`data-a="tOpen" data-id="${t.id}"`} title="${h(t.t)} · ${c[0]} · ${fmt(tStart(t))} → ${fmt(t.due)}${canMove(t)?' · drag to move':''}"><span>${(b-a+1)/ND>.06?h(t.t):''}</span></div>${(b-a+1)/ND<=.06?((b+1)/ND>.8?`<span class="wylb" style="right:calc(${100-a/ND*100}% + 6px);text-align:right">${h(t.t)}</span>`:`<span class="wylb" style="left:calc(${(b+1)/ND*100}% + 6px)">${h(t.t)}</span>`):''}</div></div>`})});
 return bar+kpi+cards+`<div class="t4g-wrap wyg" style="--n:12;--cw:${v==='y'?78:300}px">${head}${mlane}${body||`<div class="t4empty">${empty('No tasks in this '+(v==='y'?'year':'quarter'),'Try another year, project or person')}</div>`}</div>
 <div class="t4leg">${KCOL.map(c=>`<span><i style="background:${c[2]}"></i>${c[1]}</span>`).join('')}<span><i style="background:#DC2626"></i>Overdue</span><span>◆ Milestone</span><span>🎯 Goal</span><span><i class="nw"></i>Today</span><span class="mut">· Click a month to open it · drag a bar to move it</span></div>`};
const _t4N=A.t4N;A.t4N=e=>{const v=S.tl4||'w';if(v!=='y'&&v!=='q')return _t4N(e);const n=+e.dataset.n,x=wtD(S.tl4d||TODAY);S.tl4d=wtIso(v==='y'?new Date(x.getFullYear()+n,0,1):new Date(x.getFullYear(),x.getMonth()+3*n,1));render()};
A.wtMon=e=>{S.tl4='m';S.tl4d=e.dataset.d;render()};
document.head.insertAdjacentHTML('beforeend',`<style>
.t4kpi:has(.p){grid-template-columns:repeat(5,1fr)!important}
.t4kpi .p{border-left-color:#7C3AED!important}
.wyc{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin:0 0 14px}
.wyc.q{grid-template-columns:repeat(3,1fr)}
.wycm{display:flex;flex-direction:column;gap:6px;text-align:left;background:#fff;border:1px solid var(--line);border-radius:14px;padding:11px 12px;cursor:pointer;min-height:118px;font:inherit;color:inherit;transition:box-shadow .15s,border-color .15s}
.wycm:hover{border-color:#B9C6E4;box-shadow:0 4px 14px rgba(16,24,40,.08)}
.wycm.cur{border:1.5px solid #2F6BE0;background:#F5F8FF}
.wycm.past{background:#FCFCFD}
.wych{display:flex;align-items:center;gap:6px}
.wych b{font-size:15px}
.wych em{font-style:normal;font-size:10.5px;font-weight:700;color:#fff;background:#2F6BE0;border-radius:999px;padding:1px 7px}
.wych span{margin-left:auto;font-size:12px;font-weight:700;color:#5B6478}
.wycb{position:relative;height:6px;border-radius:9px;background:#EEF0F4;overflow:hidden;display:flex}
.wycb i{display:block;height:100%;background:#16A34A}
.wycb u{display:block;height:100%;background:#DC2626;margin-left:auto}
.wycn{display:flex;gap:8px;font-size:11.5px;color:#5B6478}
.wycn .r{color:#DC2626;font-weight:600}
.wycl{display:flex;flex-direction:column;gap:3px;min-width:0}
.wycl span{font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--c,#334155);font-weight:600}
.wycl span.wgl{color:#7C3AED}
.wycl span.more{color:#8A93A3;font-weight:500}
.wyg .t4row{grid-template-columns:300px 1fr;min-width:calc(300px + 12*78px)}
.wyhd{display:flex;flex-direction:column;height:100%}
.wyq{display:flex;border-bottom:1px solid #ECEEF2}
.wyq span{text-align:center;font:700 10.5px Inter;color:#8A93A3;padding:3px 0;border-right:1px solid #ECEEF2;letter-spacing:.05em}
.wym{display:flex;flex:1}
.wym button{border:0;border-right:1px solid #ECEEF2;background:none;font:700 12px Inter;color:#334155;padding:7px 0;cursor:pointer;text-transform:uppercase;letter-spacing:.03em}
.wym button small{display:block;font:500 10.5px Inter;color:#8A93A3;text-transform:none;letter-spacing:0}
.wym button:hover{background:#EEF4FF}
.wym button.cur{background:#2F6BE0;color:#fff}
.wym button.cur small{color:#DCE7FF}
.wybg{position:absolute;inset:0;display:flex;pointer-events:none}
.wybg i{border-right:1px solid #EEF0F4;height:100%}
.wybg i.alt{background:#FBFBFD}
.wybg i.cur{background:#F2F6FF}
.wyml{background:#FBF9FF}
.wyml .t4l{background-color:#FBF9FF;gap:8px}
.wyml .t4tr{min-height:62px}
.wydi{color:#7C3AED;font-size:14px}
.wycnt{margin-left:auto;font-size:11.5px;background:#EDE7FB;color:#5B21B6;border-radius:999px;padding:1px 8px}
.wymk{position:absolute;top:8px;transform:translateX(-7px);display:flex;align-items:center;gap:5px;border:0;background:none;padding:0;cursor:pointer;z-index:2;max-width:150px}
.wymk b{position:absolute;left:5px;top:-8px;font:700 9px Inter;background:#111827;color:#fff;border-radius:999px;padding:0 4px;z-index:3}
.wymk.lft{flex-direction:row-reverse;transform:translateX(calc(-100% + 7px))}
.wymk.lft b{left:auto;right:-3px}
.wyg .t4nm span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}
.wyg .t4nm{min-width:0;flex:1}
.wyg .t4t .t4tr{min-height:44px}
.wymk.r1{top:32px}.wymk.r2{top:20px}
.wymk i{width:12px;height:12px;flex:none;background:var(--c);transform:rotate(45deg);border-radius:2px;box-shadow:0 0 0 2px #fff;font-style:normal;font-size:9px;display:grid;place-items:center}
.wymk i:not(:empty){background:none;transform:none;box-shadow:none;font-size:12px}
.wymk span{font:600 11px Inter;color:#334155;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:rgba(255,255,255,.85);border-radius:4px;padding:0 3px}
.wymk:hover span{color:#2F6BE0}
.wyno{position:absolute;left:12px;top:22px;font-size:12px;color:#8A93A3}
.wysum{position:absolute;left:0;right:0;top:12px;height:10px}
.wysum i{position:absolute;top:0;height:10px;border-radius:3px;opacity:.75}
.wyg .t4b.wyb{min-width:8px;height:22px;top:12px}
.wylb{position:absolute;top:15px;font-size:11px;color:#5B6478;white-space:nowrap;pointer-events:none;max-width:220px;overflow:hidden;text-overflow:ellipsis}
@media (max-width:1200px){.wyc{grid-template-columns:repeat(4,1fr)}}
</style>`);
