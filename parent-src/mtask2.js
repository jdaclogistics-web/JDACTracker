/* ===================== PHONE: task app pieces — funnel, grouped list, meetings, timeline ===================== */
const MTF=[['To do','#8A93A3'],['Planning','#2563C9'],['Working','#C2410C'],['Stuck','#D92D20'],['Review','#7A2E8E'],['Done','#1F9D55']];
function mtFunnel(L){const n=k=>L.filter(t=>t.st===k).length,tot=L.length||1,late=L.filter(t=>t.st!=='Done'&&mtDue(t)&&mtDue(t)<TODAY).length,st=S.mts||'open',open=L.filter(t=>t.st!=='Done').length,done=n('Done');
 return `<div class="mfn"><div class="mfnh"><div><b>${open}</b><span> open · ${done} done</span></div><div class="mfnr"><i style="width:${Math.round(done*100/tot)}%"></i></div><em>${Math.round(done*100/tot)}%</em></div>
 <div class="mfnb">${MTF.map(([k,c])=>n(k)?`<i style="flex:${n(k)};background:${c}"></i>`:'').join('')}</div>
 <div class="mfnt"><button class="${S.mtd==='late'?'on':''} lt" data-a="mtD" data-t="${S.mtd==='late'?'all':'late'}" style="--c:#D92D20"><b>${late}</b><span>Late</span></button><button class="${st==='open'&&S.mtd!=='late'?'on':''}" data-a="mtSt" data-t="open" style="--c:#24408E"><b>${open}</b><span>All open</span></button>${MTF.map(([k,c])=>`<button class="${st===k&&S.mtd!=='late'?'on':''}" data-a="mtSt" data-t="${k}" style="--c:${c}"><b>${n(k)}</b><span>${k}</span></button>`).join('')}</div></div>`}
A.mtSt=e=>{S.mts=e.dataset.t;S.mtd='all';render()};
function mtGrouped(L){const w=addD(TODAY,7),G=[['Overdue',t=>mtDue(t)&&mtDue(t)<TODAY&&t.st!=='Done'],['Today',t=>mtDue(t)===TODAY],['This week',t=>mtDue(t)>TODAY&&mtDue(t)<=w],['Later',t=>mtDue(t)>w],['No date',t=>!mtDue(t)],['Done earlier',t=>t.st==='Done'&&mtDue(t)&&mtDue(t)<TODAY]];
 const used=new Set();return G.map(([l,f])=>{const R=L.filter(t=>!used.has(t.id)&&f(t));R.forEach(t=>used.add(t.id));return R.length?`<div class="mgh ${l==='Overdue'?'bad':''}">${l}<span>${R.length}</span></div>${R.map(mtCard).join('')}`:''}).join('')}
/* meetings: Google-Meet simple */
function mMeet(){const M=(D.meet||[]).slice().sort((a,b)=>String(a.dt+a.time).localeCompare(b.dt+b.time));
 return `<div class="mmt"><a class="mmt-new" href="https://meet.google.com/new" target="_blank" rel="noopener" data-a="gmNew">${ic('video')}<span><b>New meeting</b><small>Start an instant Google Meet</small></span></a>
 <div class="mmt-join"><input id="gmj" placeholder="Enter a code or link" autocomplete="off"><button data-a="gmJoin">Join</button></div>
 <div class="mmt-2"><button data-a="gmSched">${ic('cal')}Schedule</button><button data-a="gmQuick">${ic('notes')}Take notes</button></div></div>
 <div class="msec">Meetings · ${M.length}</div><div class="mtl">${M.map(m=>{const c=m.link&&typeof meetCode==='function'?meetCode(m.link):'';return `<div class="mmc"><button class="mmc-b" data-a="gmOpenN" data-id="${m.id}"><i>${ic('video')}</i><span><b>${h(m.t)}</b><small>${h(m.when||((m.dt?fmt(m.dt):'')+' '+(m.time||'')))}${(m.with||[]).length?' · '+m.with.length+' people':''}</small></span></button>${c?`<a class="mmc-j" href="${meetUrl(c)}" target="_blank" rel="noopener">Join</a>`:`<button class="mmc-j sec" data-a="gmLink" data-id="${m.id}">+ Link</button>`}</div>`}).join('')||'<div class="mempty"><b>No meetings yet</b></div>'}</div>`}
/* timeline: compact gantt — 3-letter names column, 14 swipeable day columns */
function mTimeline(){const all=myTasks(),who=S.mtw||'all',pj=S.mtp||'';let T=all.filter(t=>(who==='all'||t.o===(who==='me'?S.me:who))&&(!pj||t.proj===pj));
 const s0=S.mtls||addD(TODAY,-2),days=Array.from({length:14},(_,i)=>addD(s0,i)),e0=days[13];
 const st=t=>t.start||t.s||t.from||mtDue(t),en=t=>mtDue(t)||st(t);
 T=T.filter(t=>en(t)&&st(t)<=e0&&en(t)>=s0).sort((a,b)=>String(st(a)).localeCompare(st(b)));
 const W=40,col=t=>MT_COL[t.st]||'#8A93A3';
 const row=t=>{const a=Math.max(0,days.indexOf(st(t)<s0?s0:st(t))),b=Math.max(a,days.indexOf(en(t)>e0?e0:en(t))),late=t.st!=='Done'&&mtDue(t)<TODAY;
  return `<div class="mgr"><button class="mgn" data-a="tOpen" data-id="${t.id}">${av(nm(t.o))}<span>${h(t.t)}</span></button><div class="mgc" style="width:${W*14}px">${days.map(d=>`<i class="${d===TODAY?'tdy':''}"></i>`).join('')}<button class="mgbar ${late?'late':''}" data-a="tOpen" data-id="${t.id}" style="left:${a*W+3}px;width:${(b-a+1)*W-6}px;background:${col(t)}">${b>a?h(t.t):''}</button>${b===a?`<span class="mglab" style="left:${(b+1)*W+2}px">${h(t.o?nmF(t.o).split(' ')[0]:'')} · ${h(t.st)}</span>`:''}</div></div>`};
 const pjL=(D.projects||[]).filter(p=>all.some(t=>t.proj===p.id)),whoL=who==='all'?'Everyone':who==='me'?'Me':nmF(who).split(' ')[0];
 return `<div class="mfl">${isAdm()?`<button class="mpill ${who!=='all'?'on':''}" data-a="mtWho">${ic('users')}${h(whoL)}${ic('down')}</button>`:''}<button class="mpill ${pj?'on':''}" data-a="mtPj">${ic('grid')}${h(pj?((pjL.find(p=>p.id===pj)||{}).n||'Project'):'All projects')}${ic('down')}</button><span class="sp"></span><button class="mpill ic" data-a="mtlN" data-n="-7" aria-label="Earlier">‹</button><button class="mpill ic" data-a="mtlN" data-n="0">Today</button><button class="mpill ic" data-a="mtlN" data-n="7" aria-label="Later">›</button></div>
 <div class="mgt"><div class="mgr mghd"><div class="mgn">${fmt(s0)} – ${fmt(e0)}</div><div class="mgc" style="width:${W*14}px">${days.map(d=>{const x=new Date(d+'T12:00:00');return `<b class="${d===TODAY?'tdy':''}">${x.toLocaleDateString('en-IN',{weekday:'narrow'})}<br>${x.getDate()}</b>`}).join('')}</div></div>${T.map(row).join('')||'<div class="mempty"><b>No tasks in these two weeks</b></div>'}</div>
 <div class="mleg" style="margin-top:10px">${Object.entries(MT_COL).map(([k,c])=>`<span><i style="background:${c}"></i>${k}</span>`).join('')}</div>`}
A.mtlN=e=>{const n=+e.dataset.n;S.mtls=n?addD(S.mtls||addD(TODAY,-2),n):addD(TODAY,-2);render()};
document.head.insertAdjacentHTML('beforeend',`<style>
@media(max-width:820px){
 .mfn{background:#fff;border-radius:18px;padding:12px;margin:0 0 10px;box-shadow:0 1px 2px rgba(16,24,40,.05)}
 .mfnh{display:flex;align-items:center;gap:10px}.mfnh b{font-size:22px}.mfnh span{font-size:12.5px;color:var(--mut);font-weight:600}.mfnh>div:first-child{flex:none}
 .mfnr{flex:1;height:6px;background:#F2F4F7;border-radius:9px;overflow:hidden}.mfnr i{display:block;height:100%;background:#1F9D55;border-radius:9px}.mfnh em{font-style:normal;font-size:12px;font-weight:800;color:#1F9D55}
 .mfnb{display:flex;height:10px;border-radius:9px;overflow:hidden;gap:2px;margin:10px 0}.mfnb i{display:block;min-width:6px}
 .mfnt{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:0 -12px;padding:0 12px}.mfnt::-webkit-scrollbar{display:none}
 .mfnt button{flex:none;min-width:64px;border:0;background:#F7F8FA;border-radius:12px;padding:7px 8px;font:inherit;display:flex;flex-direction:column;align-items:center;border-top:3px solid var(--c)}
 .mfnt b{font-size:17px;color:var(--c)}.mfnt span{font-size:10.5px;font-weight:700;color:#475467;white-space:nowrap}.mfnt button.on{background:var(--c)}.mfnt button.on b,.mfnt button.on span{color:#fff}
 .mgh{display:flex;justify-content:space-between;font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:#475467;margin:10px 2px 2px}.mgh span{color:var(--mut)}.mgh.bad{color:#D92D20}
 .mmt{background:#fff;border-radius:20px;padding:14px;box-shadow:0 1px 2px rgba(16,24,40,.05);display:flex;flex-direction:column;gap:10px}
 .mmt-new{display:flex;align-items:center;gap:14px;background:#0B57D0;color:#fff!important;border-radius:16px;padding:14px 16px;text-decoration:none}.mmt-new svg{width:28px;height:28px}.mmt-new b{display:block;font-size:16px}.mmt-new small{opacity:.85;font-size:12.5px}
 .mmt-join{display:flex;gap:8px}.mmt-join input{flex:1;min-height:46px;border-radius:12px}.mmt-join button{border:0;background:#E8F0FE;color:#0B57D0;border-radius:12px;padding:0 18px;font:inherit;font-weight:800}
 .mmt-2{display:grid;grid-template-columns:1fr 1fr;gap:8px}.mmt-2 button{display:flex;align-items:center;justify-content:center;gap:7px;border:1px solid var(--line);background:#fff;border-radius:12px;padding:11px;font:inherit;font-weight:700;color:#344054}.mmt-2 svg{width:17px;height:17px}
 .mmc{display:flex;align-items:center;gap:8px;background:#fff;border-radius:14px;padding:8px 10px}.mmc-b{flex:1;min-width:0;display:flex;gap:10px;align-items:center;border:0;background:none;font:inherit;text-align:left;padding:0}
 .mmc-b i{width:38px;height:38px;border-radius:12px;background:#E8F0FE;color:#0B57D0;display:grid;place-items:center;flex:none}.mmc-b i svg{width:18px;height:18px}.mmc-b span{min-width:0}.mmc-b b{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mmc-b small{color:var(--mut);font-size:12px}
 .mmc-j{border:0;background:#0B57D0;color:#fff!important;border-radius:999px;padding:7px 14px;font:inherit;font-size:13px;font-weight:700;text-decoration:none;flex:none}.mmc-j.sec{background:#F2F4F7;color:#344054!important}
 .mgt{background:#fff;border-radius:16px;overflow-x:auto;-webkit-overflow-scrolling:touch;box-shadow:0 1px 2px rgba(16,24,40,.05)}
 .mgr{display:flex;border-bottom:1px solid #F2F4F7;min-width:max-content}.mgr:last-child{border-bottom:0}
 .mgn{position:sticky;left:0;z-index:2;width:118px;flex:none;background:#fff;border:0;border-right:1px solid #EAECF0;display:flex;align-items:center;gap:6px;padding:6px 8px;font:inherit;font-size:11.5px;font-weight:600;text-align:left;color:#344054}
 .mgn .av{width:20px!important;height:20px!important;font-size:8px!important;flex:none}.mgn span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.2}
 .mghd .mgn{font-size:11px;color:var(--mut);font-weight:700}.mgc{position:relative;display:flex;min-height:40px}.mgc>i{width:40px;flex:none;border-right:1px dashed #F2F4F7}.mgc>i.tdy{background:#EEF4FF}
 .mghd .mgc>b{width:40px;flex:none;text-align:center;font-size:10.5px;color:#667085;padding:6px 0;line-height:1.3}.mghd .mgc>b.tdy{color:#fff;background:var(--navy);border-radius:8px}
 .mgbar{position:absolute;top:8px;height:24px;border:0;border-radius:8px;color:#fff;font:inherit;font-size:10.5px;font-weight:700;padding:0 6px;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 2px 6px rgba(16,24,40,.15)}.mglab{position:absolute;top:12px;font-size:10.5px;font-weight:600;color:#667085;white-space:nowrap;pointer-events:none}.mgbar.late{outline:2px solid #D92D20;outline-offset:1px}
 .mleg{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:11.5px;color:#475467}.mleg span{display:inline-flex;align-items:center;gap:5px}.mleg i{width:8px;height:8px;border-radius:50%}
}
</style>`);
