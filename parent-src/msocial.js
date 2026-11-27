/* ===================== PHONE: Studios → Social media (rebuilt) =====================
   Day view only. Top: company chips with this month's post count · search · one swipeable day strip.
   Body: Netflix-style rows of post cards — the chosen day, next 7 days, late, ready to post, recently posted.
   Tap a card to open it; the small button under it moves it to the next stage. */
const SM_COL={Script:'#8A93A3',Shoot:'#C2410C',Edit:'#2563C9',Posted:'#1F9D55'};
function mSocial(){const mon=TODAY.slice(0,7),q=(S.smq||'').trim().toLowerCase();
 const P0=(D.posts||[]).filter(p=>!S.stC||p.co===S.stC),inMon=(D.posts||[]).filter(p=>(p.date||'').slice(0,7)===mon);
 const cos=[...new Set(inMon.map(p=>p.co))].sort((a,b)=>inMon.filter(p=>p.co===b).length-inMon.filter(p=>p.co===a).length);
 const coChips=`<div class="smco"><button class="${!S.stC?'on':''}" data-a="smCo" data-t=""><b>${inMon.length}</b><span>All · ${new Date(TODAY+'T12:00:00').toLocaleDateString('en-IN',{month:'short'})}</span></button>${cos.map(k=>{const b=brandOf(k);return `<button class="${S.stC===k?'on':''}" data-a="smCo" data-t="${k}" style="--c:${b.c}"><b>${inMon.filter(p=>p.co===k).length}</b><span>${h(b.n)}</span></button>`}).join('')}</div>`;
 const card=p=>{const b=brandOf(p.co),late=isLate(p),nx={Script:'Mark shot',Shoot:'Checklist',Edit:'Mark posted'}[p.st];
  return `<div class="smc"><button class="smp" data-a="pOpen" data-id="${p.id}" style="background:${p.thumb?`linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.65)),center/cover url(${p.thumb})`:`linear-gradient(165deg,${b.c},${b.c}99 70%,#0008)`}">
  <span class="smt"><span class="smpl">${p.plats.map(x=>ic(PLAT[x]||'web')).join('')}</span><em style="background:${late?'#D92D20':SM_COL[p.st]}">${late?'Late':h(p.st)}</em></span>
  <span class="smb"><b>${h(p.t)}</b><small>${h(p.type)} · ${p.date===TODAY?'Today':fmt(p.date)} ${tm12(p.time)}</small><small class="smbr">${h(b.n)}${p.series?' · '+h(p.code||''):''}</small></span></button>
  ${nx?`<button class="smn" data-a="pNext" data-id="${p.id}">${nx} ›</button>`:`<span class="smn done">✓ Posted</span>`}</div>`};
 const row=(title,L,sub)=>L.length?`<div class="smr"><div class="smrh"><b>${title}</b><span>${sub||L.length}</span></div><div class="smrow">${L.map(card).join('')}</div></div>`:'';
 const byT=(a,b)=>(a.date+a.time).localeCompare(b.date+b.time);
 const head=`<div class="smtop"><div class="smsr">${ic('search')}<input data-in="smq" value="${h(S.smq||'')}" placeholder="Search posts, reels, series…" aria-label="Search posts">${q?`<button data-a="smQx">×</button>`:''}</div>${canEditPost()?`<button class="smadd" data-a="pNew" aria-label="Plan a post">${ic('plus')}</button>`:''}</div>${coChips}`;
 if(q){const R=P0.filter(p=>[p.t,p.type,p.code,p.series,brandOf(p.co).n,...(p.plats||[])].join(' ').toLowerCase().includes(q)).sort(byT);
  return head+`<div class="msec">${R.length} post${R.length===1?'':'s'} found</div><div class="smgrid">${R.map(card).join('')||'<div class="mempty"><b>No posts match</b></div>'}</div>`}
 const day=S.smd||TODAY,days=[];for(let i=-7;i<=30;i++)days.push(addD(TODAY,i));
 const n=d=>P0.filter(p=>p.date===d).length,late=P0.filter(isLate).sort(byT);
 const strip=`<div class="mds" id="smds">${days.map(d=>{const dt=new Date(d+'T12:00:00'),c=n(d),sel=d===day;return `<button class="mdy ${sel?'on':''} ${d===TODAY?'tdy':''} ${d<TODAY?'past':''}" data-a="smD" data-t="${d}" ${sel?'id="smsel"':''}><small>${d===TODAY?'Today':dt.toLocaleDateString('en-IN',{weekday:'short'})}</small><b>${dt.getDate()}</b><i>${c?`<s></s>`.repeat(Math.min(c,4)):''}</i></button>`}).join('')}</div>`;
 setTimeout(()=>{const s=document.getElementById('smsel'),w=document.getElementById('smds');if(s&&w)w.scrollLeft=s.offsetLeft-w.clientWidth/2+s.clientWidth/2},0);
 const st=CST.map(k=>[k,P0.filter(p=>(p.date||'').slice(0,7)===mon&&p.st===k).length]);
 const stats=`<div class="smst">${st.map(([k,c])=>`<span style="--c:${SM_COL[k]}"><i></i>${k} <b>${c}</b></span>`).join('')}${late.length?`<span style="--c:#D92D20"><i></i>Late <b>${late.length}</b></span>`:''}</div>`;
 const dL=P0.filter(p=>p.date===day).sort(byT),dn=new Date(day+'T12:00:00');
 const next=P0.filter(p=>p.date>day&&p.date<=addD(day,7)).sort(byT),ready=P0.filter(p=>p.st==='Edit'&&!isLate(p)).sort(byT),done=P0.filter(p=>p.st==='Posted'&&p.date<=TODAY).sort((a,b)=>byT(b,a)).slice(0,10);
 return head+stats+strip+`<div class="smr"><div class="smrh"><b>${day===TODAY?'Today':dn.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'short'})}</b><span>${dL.length} post${dL.length===1?'':'s'}</span></div>${dL.length?`<div class="smrow">${dL.map(card).join('')}</div>`:`<div class="smempty">Nothing planned for this day${canEditPost()?` · <button class="lnk" data-a="pNew">Plan a post</button>`:''}</div>`}</div>`
 +row('⚠ Late · not posted yet',late)+row('Next 7 days',next)+row('Ready to post',ready)+row('Recently posted',done)
 +`<button class="smser" data-a="smSeries">${ic('film')}Parivaar series ›</button>`};
A.smCo=e=>{S.stC=e.dataset.t;S.cb=S.stC;render()};A.smD=e=>{S.smd=e.dataset.t;render()};A.smQx=()=>{S.smq='';render()};
A.smSeries=()=>{S.ct='series';S.smSer=1;render()};
const _cpSm=CP['studios:sm'];CP['studios:sm']=()=>{if(!isMob())return _cpSm();if(S.smSer&&S.ct==='series')return `<button class="crmback" data-a="smSerX">${ic('back')}Post calendar</button>`+_cpSm();return mSocial()};
A.smSerX=()=>{S.smSer=0;S.ct='cal';render()};
document.head.insertAdjacentHTML('beforeend',`<style>
@media(max-width:820px){
 .smtop{display:flex;gap:8px;margin:10px 0}.smsr{flex:1;display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:0 12px;min-height:44px}.smsr svg{width:18px;height:18px;color:var(--mut)}
 .smsr input{flex:1;border:0;outline:none;font:inherit;font-size:15px;background:none;padding:0;min-height:42px}.smsr button{border:0;background:none;font-size:20px;color:var(--mut)}
 .smadd{width:46px;height:46px;border-radius:14px;border:0;background:var(--navy);color:#fff;display:grid;place-items:center;flex:none}.smadd svg{width:22px;height:22px}
 .smco{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin:0 -16px 10px;padding:0 16px}.smco::-webkit-scrollbar{display:none}
 .smco button{flex:none;display:flex;align-items:center;gap:7px;border:1px solid var(--line);background:#fff;border-radius:12px;padding:6px 11px;font:inherit;font-size:12.5px;font-weight:600;color:#344054}
 .smco button b{font-size:15px;color:var(--c,var(--navy))}.smco button.on{background:var(--c,var(--navy));border-color:var(--c,var(--navy));color:#fff}.smco button.on b{color:#fff}
 .smst{display:flex;gap:12px;overflow-x:auto;scrollbar-width:none;font-size:12px;color:#475467;margin:0 0 10px;font-weight:600}.smst span{flex:none;display:inline-flex;align-items:center;gap:5px}.smst i{width:8px;height:8px;border-radius:50%;background:var(--c)}.smst b{color:#101828}
 .smr{margin:6px 0 14px}.smrh{display:flex;align-items:baseline;justify-content:space-between;margin:0 2px 8px}.smrh b{font-size:17px}.smrh span{font-size:12px;color:var(--mut);font-weight:600}
 .smrow{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:none;margin:0 -16px;padding:0 16px 4px}.smrow::-webkit-scrollbar{display:none}
 .smc{flex:none;width:146px;scroll-snap-align:start;display:flex;flex-direction:column;gap:6px}
 .smp{position:relative;width:146px;height:200px;border:0;border-radius:16px;padding:9px;display:flex;flex-direction:column;justify-content:space-between;text-align:left;color:#fff;font:inherit;box-shadow:0 6px 16px rgba(16,24,40,.15);overflow:hidden}
 .smp:active{transform:scale(.97)}.smt{display:flex;justify-content:space-between;align-items:center}.smpl{display:flex;gap:3px}.smpl svg{width:16px;height:16px}
 .smt em{font-style:normal;font-size:10.5px;font-weight:800;border-radius:999px;padding:2px 8px;box-shadow:0 0 0 1.5px rgba(255,255,255,.6)}
 .smb b{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;font-size:14px;line-height:1.25;text-shadow:0 1px 3px rgba(0,0,0,.4)}.smb small{display:block;font-size:11px;opacity:.92;margin-top:3px}.smb .smbr{font-weight:700;opacity:.85}
 .smn{border:1px solid var(--line);background:#fff;border-radius:10px;padding:7px 4px;font:inherit;font-size:12px;font-weight:700;color:var(--navy);text-align:center}.smn.done{color:#1F9D55;border-color:#D1FADF;background:#F6FEF9}
 .smempty{background:#fff;border-radius:14px;padding:16px;text-align:center;color:var(--mut);font-size:13.5px}
 .smgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.smgrid .smc,.smgrid .smp{width:100%}
 .smser{display:flex;align-items:center;gap:8px;width:100%;border:1px solid var(--line);background:#fff;border-radius:14px;padding:12px 14px;font:inherit;font-weight:700;color:#344054;margin:4px 0 10px}.smser svg{width:18px;height:18px}
 html.mob #main[data-v="co"] .stbar:has(+ .smtop),html.mob .stbar:has(~ .smtop){display:none}
}
</style>`);
