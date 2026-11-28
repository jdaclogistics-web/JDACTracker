/* ===== Phone home for every employee, built like a delivery-partner app:
   1) start the shift (selfie + location) before work opens  2) today's numbers  3) big action tiles
   4) "Up next" work queue for the person's role  5) tools  6) end-of-day close.
   Roles: Jupiter warehouse manager (Zubair) · delivery / warehouse team · GovaaBazaar sales (Atmaram) ·
   CSE · Ops · Marketing / Studios · HR · everyone else. Same data as the company pages in the admin panel. ===== */
const rhAtt=()=>D.att.find(x=>x.k===S.me)||null;
const rhNowM=()=>{const n=new Date();return n.getHours()*60+n.getMinutes()};
const rhM=t=>{const[a,b]=String(t||'0:0').split(':').map(Number);return a*60+(b||0)};
const rhDur=m=>m<60?m+'m':Math.floor(m/60)+'h '+String(m%60).padStart(2,'0')+'m';
function rhRole(k){const p=P[k]||{};if(k==='zubair')return 'jmgr';if(k==='atmaram')return 'gb';if(p.team==='Warehouse')return 'rider';if(p.team==='CSE')return 'cse';if(p.team==='Ops')return 'ops';if(p.team==='Marketing')return 'mkt';if(p.team==='HR')return 'hr';return 'gen'}
const JTEAM=()=>STAFF.filter(k=>(P[k]||{}).team==='Warehouse'&&k!=='zubair');
const gbTot=o=>Object.entries(o.items||{}).reduce((a,[p,q])=>a+q*((o.rates||{})[p]!=null?o.rates[p]:(prd(p)||{}).rate||0),0);
const gbShop=o=>((D.retail||[]).find(r=>r.id===o.r)||{}).n||o.cust||'Walk-in';

/* ---------- pieces ---------- */
const rhTile=(a,i,l,n,extra)=>`<button class="rh-tile" data-a="${a}" ${extra||''}><span class="rh-ti">${i}${n?`<em>${n}</em>`:''}</span><b>${l}</b></button>`;
const rhGo=(v,i,l,n,t)=>rhTile('rhGo',i,l,n,`data-v="${v}"${t?` data-t="${t}"`:''}`);
const rhKpi=L=>`<div class="rh-kpi">${L.map(([v,l,c])=>`<div class="${c?'k-'+c:''}"><b>${v}</b><span>${l}</span></div>`).join('')}</div>`;
const rhSec=(t,r)=>`<div class="rh-sec"><b>${t}</b>${r||''}</div>`;
const rhEmpty=(t,s)=>`<div class="rh-empty"><b>${t}</b><span>${s||''}</span></div>`;
A.rhGo=e=>{const v=e.dataset.v;if(e.dataset.t)S.ttab=e.dataset.t;if(v==='crm'&&typeof crmCosNV==='function'){const c=crmCosNV()[0];if(c)S.cmco=c}rhNav(v)};
const rhNav=v=>{S.v=v;render();scrollTo(0,0)};

function rhShift(){const a=rhAtt(),r=rhRole(S.me);
 if(!a||!a.in)return `<div class="rh-off"><div class="rh-offt"><span class="rh-dot off"></span><div><b>You're off duty</b><span>Start your shift to open today's work</span></div></div>
  <button class="rh-start" data-a="clock"><span>${ic('cam')}</span><b>Start shift</b><small>Selfie + location</small></button><div id="camwrap"></div></div>`;
 const end=a.out?rhM(a.out):rhNowM(),m=Math.max(0,end-rhM(a.in));
 if(a.out)return `<div class="rh-on done"><span class="rh-dot"></span><div style="flex:1"><b>Shift ended · ${a.out}</b><span>${a.in} – ${a.out} · ${rhDur(m)} on duty</span></div></div>`;
 return `<div class="rh-on"><span class="rh-dot"></span><div style="flex:1"><b>On duty${a.st==='Late'?' · late mark':''}</b><span>Since ${a.in} · ${rhDur(m)}</span></div><button class="rh-end" data-a="rhEnd">End shift</button></div><div id="camwrap"></div>`}
A.rhEnd=()=>{const r=rhRole(S.me),L=rhClose(r);sheet(`<h2>End your shift?</h2><p class="mut sm">Quick check before you go</p><div class="rh-chk">${L.map(([ok,t])=>`<div class="${ok?'ok':'no'}"><i>${ok?'✓':'!'}</i>${t}</div>`).join('')}</div><button class="btn w" style="margin-top:14px;background:#D92D20;border-color:#D92D20" data-a="rhEndGo">End shift · clock out</button>`)};
A.rhEndGo=()=>{closeM();A.clock()};
function rhClose(r){const me=S.me,open=myTasks().filter(t=>t.st!=='Done'&&t.due&&t.due<=TODAY).length,L=[[!open,open?`${open} task${open>1?'s':''} due today still open`:'All tasks due today are done']];
 if(r==='jmgr'){const w=D.vch.filter(v=>v.co==='jup'&&v.st==='With manager').length,n=D.jord.filter(o=>o.st!=='Delivered').length;L.push([!w,w?`${w} team entr${w>1?'ies':'y'} still to check & send to accounts`:'Team entries sent to accounts']);L.push([!n,n?`${n} order${n>1?'s':''} not delivered yet`:'All orders delivered'])}
 if(r==='rider'){const n=D.jord.filter(o=>o.boy===me&&o.st!=='Delivered').length;L.push([!n,n?`${n} deliver${n>1?'ies':'y'} still open`:'All deliveries done'])}
 if(r==='gb'){const c=(D.petty.find(x=>x.id==='goa')||{}).hold||0;L.push([c<5000,`Cash in hand ${inr(c)}${c>=5000?' · deposit to bank':''}`])}
 if(r==='cse'){const f=(D.wa||[]).filter(c=>c.to===me&&c.fu&&!c.fu.done&&c.fu.d<=TODAY).length;L.push([!f,f?`${f} follow-up${f>1?'s':''} due today`:'Follow-ups done'])}
 return L}

/* ---------- role: Jupiter warehouse manager (Zubair) ---------- */
const JST=[['New','New',"#2F6BE0"],['Assigned','Dispatched','#7A4CC2'],['Out for delivery','On the way','#C2410C'],['Delivered','Delivered','#1F9D55']];
function rhJmgr(){const O=D.jord,nw=O.filter(o=>o.st==='New'),dis=O.filter(o=>o.st==='Assigned'),out=O.filter(o=>o.st==='Out for delivery'),dT=O.filter(o=>o.st==='Delivered'&&o.dd===TODAY),wm=D.vch.filter(v=>v.co==='jup'&&v.st==='With manager'),ren=(D.jinv||[]).filter(x=>x.end&&x.st!=='Available'&&x.end<=addD(TODAY,7)),av0=(D.jinv||[]).filter(x=>x.st==='Available').length;
 const f=S.rhJf||'open',L=O.filter(o=>f==='open'?o.st!=='Delivered':o.st===f).slice(0,12);
 return rhKpi([[nw.length,'new','blue'],[dis.length+out.length,'out','org'],[dT.length,'delivered today','grn'],[wm.length,'to approve',wm.length?'red':'']])+
 `<div class="rh-tiles">${rhTile('rhJNew',ic('plus'),'New order')}${rhTile('rhJBoard',ic('truck'),'Dispatch',nw.length||'')}${rhTile('rhInv',ic('bed'),'Equipment')}${rhTile('rhReview',ic('rupee'),'Team entries',wm.length||'')}${rhTile('rhRenew',ic('clock'),'Renewals',ren.length||'')}${rhTile('expNew',ic('rupee'),'My expense')}${rhGo('chat',ic('chat'),'Team chat')}${rhGo('tasks',ic('task'),'Tasks')}</div>`+
 rhSec('Orders',`<span class="rh-mut">${O.filter(o=>o.st!=='Delivered').length} open</span>`)+`<div class="rh-chips">${[['open','Open'],...JST.map(x=>[x[0],x[1]])].map(([k,l])=>`<button class="${f===k?'on':''}" data-a="rhJf" data-t="${k}">${l} <span>${k==='open'?O.filter(o=>o.st!=='Delivered').length:O.filter(o=>o.st===k).length}</span></button>`).join('')}</div>`+
 (L.map(rhJCard).join('')||rhEmpty('No orders here','New WhatsApp orders show here'))+
 (wm.length?rhSec('End of day · check your team')+`<button class="rh-band" data-a="rhReview"><b>${wm.length} entr${wm.length>1?'ies':'y'} · ${inr(wm.reduce((a,v)=>a+v.amt,0))}</b><span>Check bills, approve and send to Snehal (accounts)</span>${ic('right')}</button>`:'')}
function rhJCard(o){const s=JST.find(x=>x[0]===o.st)||JST[0],boy=o.boy?nmF(o.boy):'',next=o.st==='New'?['rhDisp','Assign equipment & person']:o.st==='Assigned'?['jNext','Mark on the way']:o.st==='Out for delivery'?['jNext','KYC & deliver']:null;
 return `<div class="rh-card" style="--c:${s[2]}"><div class="rh-cr1"><b>${h(o.item)}</b><span class="rh-st">${s[1]}</span></div><div class="rh-cr2">${h(o.id)} · ${h(o.name?o.name+' · ':'')}${h(o.cust)}${o.sn?' · '+h(o.sn):''}</div>
  <div class="rh-cr3"><span>${o.from?h(o.from):''}</span>${boy?`<span class="waown"><i>${h(sfIni(nmF(o.boy)))}</i>${h(boy)}</span>`:''}${o.kyc>=4?'<span class="rh-ok">KYC ✓</span>':''}${o.transport?`<span>${inr(o.transport)} transport</span>`:''}</div>
  ${next||o.ph?`<div class="rh-cr4">${o.ph?`<a class="rh-ib" href="tel:${h(String(o.ph).replace(/\D/g,''))}" aria-label="Call">${ic('phone')}</a><a class="rh-ib wa" href="https://wa.me/91${h(String(o.ph).replace(/\D/g,'').slice(-10))}" target="_blank" rel="noopener" aria-label="WhatsApp">${ic('chat')}</a>`:''}${next?`<button class="rh-cta" data-a="${next[0]}" data-id="${o.id}">${next[1]} →</button>`:''}</div>`:''}</div>`}
A.rhJf=e=>{S.rhJf=e.dataset.t;render()};
A.rhJBoard=()=>{S.rhJf='New';render();setTimeout(()=>{const c=document.querySelector('.rh-chips');if(c)c.scrollIntoView({behavior:'smooth',block:'start'})},50)};
const JITEMS=['Hospital bed · manual','Hospital bed · electric','Oxygen concentrator','Wheelchair','Walker','Air mattress','Other'];
A.rhJNew=()=>sheet(`<h2>New order</h2><p class="mut sm">From WhatsApp, a call or Jupiter sales</p>
 <label>Came from</label>${opts('rjs',['WhatsApp','Phone call','Nadeem (Jupiter sales)','Facebook ad','Walk-in'],'WhatsApp')}
 <div class="rh-2"><div><label for="rjn">Customer name</label><input id="rjn"></div><div><label for="rjp">Mobile</label><input id="rjp" inputmode="tel" maxlength="14"></div></div>
 <label for="rja">Area / address</label><input id="rja" placeholder="e.g. Kothrud, Lane 4">
 <label>Equipment</label>${opts('rji',JITEMS,'Hospital bed · manual')}
 <label>Rent or sale</label>${opts('rjk',['Rent','Sale'],'Rent')}
 <div class="rh-2"><div><label for="rjr">Rent / price ₹</label><input id="rjr" type="number" inputmode="numeric"></div><div><label for="rjt">Transport ₹</label><input id="rjt" type="number" inputmode="numeric" value="500"></div></div>
 <button class="btn w" style="margin-top:14px" data-a="rhJSave">Create order</button>`);
A.rhJSave=()=>{const n=val('rjn').trim(),p=val('rjp').trim(),a=val('rja').trim();if(!n||!a)return toast('Customer name and area are needed');const src=pick1('rjs');
 const o={id:'JE-'+(884+D.jord.length),item:pick1('rji')+(pick1('rjk')==='Sale'?' (sale)':''),name:n,ph:p,cust:a,from:src==='WhatsApp'?'WhatsApp · '+nmF(S.me):src,st:'New',boy:'',kyc:0,rent:+val('rjr')||0,transport:+val('rjt')||0,at:TODAY,by:S.me};D.jord.unshift(o);save();closeM();render();toast(o.id+' created · now assign equipment');setTimeout(()=>A.rhDisp({dataset:{id:o.id}}),300)};
A.rhDisp=e=>{const o=D.jord.find(x=>x.id===e.dataset.id);if(!o)return;const base=o.item.replace(' (sale)',''),fr=(D.jinv||[]).filter(x=>x.st==='Available'),m=fr.filter(x=>x.t===base),rest=fr.filter(x=>x.t!==base),T=JTEAM();
 const busy=k=>D.jord.filter(x=>x.boy===k&&x.st!=='Delivered').length,att=k=>{const a=D.att.find(x=>x.k===k);return a&&a.in&&!a.out};
 sheet(`<h2>Dispatch ${h(o.id)}</h2><p class="mut sm">${h(o.item)} · ${h(o.name||'')} ${h(o.cust)}</p>
  <div class="cmdl">Pick the equipment (serial no.)</div><div class="rh-pick" id="rhsn">${[...m,...rest].map((x,i)=>`<button class="${i===0&&m.length?'on':''}" data-a="rhPk" data-g="rhsn" data-k="${x.sn}"><b>${h(x.sn)}</b><span>${h(x.t)}</span></button>`).join('')||'<div class="xs mut">No free equipment. Mark one as available in Equipment.</div>'}</div>
  <div class="cmdl" style="margin-top:12px">Who delivers?</div><div class="rh-pick ppl" id="rhboy">${T.map((k,i)=>`<button class="${i===0?'on':''}" data-a="rhPk" data-g="rhboy" data-k="${k}">${av(nm(k))}<b>${h(nmF(k))}</b><span>${att(k)?'🟢 on duty':'⚪ off'} · ${busy(k)} open</span></button>`).join('')}</div>
  <button class="btn w" style="margin-top:14px" data-a="rhDispGo" data-id="${o.id}">Dispatch</button>`)};
A.rhPk=e=>{document.querySelectorAll('#'+e.dataset.g+' button').forEach(b=>b.classList.toggle('on',b===e))};
A.rhDispGo=e=>{const o=D.jord.find(x=>x.id===e.dataset.id),sn=(document.querySelector('#rhsn button.on')||{dataset:{}}).dataset.k,boy=(document.querySelector('#rhboy button.on')||{dataset:{}}).dataset.k;if(!boy)return toast('Pick who delivers');
 if(sn){const it=D.jinv.find(x=>x.sn===sn);if(it){it.st='Reserved';it.cust=o.cust}o.sn=sn}o.boy=boy;o.st='Assigned';o.disp=nowT();save();closeM();render();toast('Sent to '+nmF(boy))};
/* KYC sheet opens filled with what we already know; delivery puts the equipment on rent */
const _jNextRH=A.jNext;A.jNext=e=>{const o=D.jord.find(x=>x.id===e.dataset.id);_jNextRH(e);if(o&&o.st==='Out for delivery')setTimeout(()=>{const a=document.getElementById('k1'),b=document.getElementById('k2');if(a&&o.name)a.value=o.name;if(b&&o.ph)b.value=o.ph},30)};
const _jDoneRH=A.jDone;A.jDone=e=>{const o=D.jord.find(x=>x.id===e.dataset.id);_jDoneRH(e);if(o&&o.st==='Delivered'){o.dd=TODAY;o.dt=nowT();if(o.sn){const it=D.jinv.find(x=>x.sn===o.sn);if(it&&!/sale/i.test(o.item)){it.st='Rented';it.cust=o.cust;it.end=addD(TODAY,30)}else if(it)it.st='Sold'}save();render()}};
A.rhInv=()=>{const I=D.jinv||[],st=['Available','Reserved','Rented','Return pending','Repair'],g=S.rhIv||'Available';
 sheet(`<h2>Equipment</h2><div class="rh-chips">${st.map(s=>`<button class="${g===s?'on':''}" data-a="rhIv" data-t="${s}">${s} <span>${I.filter(x=>x.st===s).length}</span></button>`).join('')}</div><div class="list">${I.filter(x=>x.st===g).map(x=>`<div class="li"><div class="tx"><b>${h(x.sn)} · ${h(x.t)}</b><div class="m">${x.cust?h(x.cust):''}${x.end?' · till '+fmt(x.end):''}</div></div>${g==='Return pending'||g==='Repair'?`<button class="btn sm sec" data-a="rhFree" data-id="${x.sn}">Mark free</button>`:''}</div>`).join('')||'<div class="xs mut" style="padding:10px">None</div>'}</div>`)};
A.rhIv=e=>{S.rhIv=e.dataset.t;A.rhInv()};A.rhFree=e=>{const x=D.jinv.find(i=>i.sn===e.dataset.id);x.st='Available';x.cust='';x.end='';save();A.rhInv();toast(x.sn+' is free')};
A.rhRenew=()=>{const R=(D.jinv||[]).filter(x=>x.end&&x.st!=='Available').sort((a,b)=>a.end.localeCompare(b.end));sheet(`<h2>Renewals</h2><p class="mut sm">Rent ending in the next days · call and renew</p><div class="list">${R.map(x=>`<div class="li"><div class="tx"><b>${h(x.sn)} · ${h(x.cust||'')}</b><div class="m ${x.end<TODAY?'bad':''}">${h(x.t)} · ${x.end<TODAY?'ended ':'ends '}${fmt(x.end)}</div></div><button class="btn sm" data-a="renew" data-id="${x.sn}">+30 days</button></div>`).join('')||'<div class="xs mut" style="padding:10px">Nothing due</div>'}</div>`)};
const _renewRH=A.renew;A.renew=e=>{_renewRH(e);if(document.getElementById('ov'))A.rhRenew()};
/* team entries: warehouse team expenses wait for Zubair, then go to Snehal (accounts) */
const _expSaveRH=A.expSave;A.expSave=()=>{const n=D.vch.length;_expSaveRH();if(D.vch.length>n){const v=D.vch[0];if(v.co==='jup'&&S.me!=='zubair'&&!isAdm()&&K()!=='acc'){v.st='With manager';v.src='Waiting for Zubair';save();render()}}};
A.rhReview=()=>{const W=D.vch.filter(v=>v.co==='jup'&&v.st==='With manager'),rc=D.vch.filter(v=>v.co==='jup'&&v.ty==='Receipt'&&v.dt===TODAY),cash=rc.filter(v=>v.mode==='Cash').reduce((a,v)=>a+v.amt,0);
 sheet(`<h2>Team entries</h2><p class="mut sm">Check each bill, then send to Snehal (accounts) to verify and pay</p>
  <div class="rh-kpi" style="margin:8px 0 12px"><div><b>${W.length}</b><span>to check</span></div><div><b>${inr(W.reduce((a,v)=>a+v.amt,0))}</b><span>expenses</span></div><div class="k-grn"><b>${inr(cash)}</b><span>cash collected today</span></div></div>
  <div class="list">${W.map(v=>`<div class="li rh-rv"><div class="tx"><b>${inr(v.amt)} · ${h(v.head||v.party)}</b><div class="m">${h(nmF(v.by))} · ${h(v.party)} · ${h(v.mode)}${v.file?' · 📎 bill':' · no bill'}</div></div><button class="ib" data-a="rhRvNo" data-id="${v.id}" aria-label="Reject">✕</button><button class="ib ok" data-a="rhRvOk" data-id="${v.id}" aria-label="Approve">✓</button></div>`).join('')||'<div class="xs mut" style="padding:10px">Nothing waiting. All entries are with accounts.</div>'}</div>
  ${W.length?`<button class="btn w" style="margin-top:12px" data-a="rhRvAll">Approve all & send to Snehal</button>`:''}`)};
const rvOk=v=>{v.st='To verify';v.src='Approved by Zubair';v.apBy=S.me;v.apAt=TODAY};
A.rhRvOk=e=>{const v=D.vch.find(x=>x.id===e.dataset.id);rvOk(v);save();render();A.rhReview();toast('Sent to accounts')};
A.rhRvNo=e=>{const v=D.vch.find(x=>x.id===e.dataset.id);v.st='Rejected';v.src='Rejected by Zubair';save();render();A.rhReview();toast('Rejected · '+nmF(v.by)+' will see it')};
A.rhRvAll=()=>{const W=D.vch.filter(v=>v.co==='jup'&&v.st==='With manager');W.forEach(rvOk);save();closeM();render();toast(W.length+' entries sent to Snehal')};

/* ---------- role: delivery / warehouse team ---------- */
function rhRider(){const me=S.me,M=D.jord.filter(o=>o.boy===me),open=M.filter(o=>o.st!=='Delivered'),dT=M.filter(o=>o.st==='Delivered'&&o.dd===TODAY),cash=D.vch.filter(v=>v.co==='jup'&&v.ty==='Receipt'&&v.by===me&&v.dt===TODAY&&v.mode==='Cash').reduce((a,v)=>a+v.amt,0),ex=D.vch.filter(v=>v.by===me&&v.ty==='Expense'&&v.dt===TODAY),rej=D.vch.filter(v=>v.by===me&&v.st==='Rejected');
 const cur=open.find(o=>o.st==='Out for delivery')||open[0];
 return rhKpi([[open.length,'to deliver','org'],[dT.length,'delivered today','grn'],[inr(cash),'cash with you'],[ex.length,'expenses today']])+
 (cur?rhSec('Current delivery')+`<div class="rh-job"><div class="rh-jt"><span class="rh-st" style="--c:${cur.st==='Out for delivery'?'#C2410C':'#7A4CC2'}">${cur.st==='Out for delivery'?'On the way':'Pick up from warehouse'}</span><span class="rh-mut">${h(cur.id)}</span></div><b class="rh-jb">${h(cur.item)}</b><div class="rh-ja">${h(cur.name?cur.name+' · ':'')}${h(cur.cust)}${cur.sn?` · <b>${h(cur.sn)}</b>`:''}</div>
  <div class="rh-jr"><a class="rh-jbtn" href="https://maps.google.com/?q=${encodeURIComponent((cur.cust||'')+' Pune')}" target="_blank" rel="noopener">${ic('pin')}Map</a>${cur.ph?`<a class="rh-jbtn" href="tel:${h(String(cur.ph).replace(/\D/g,''))}">${ic('phone')}Call</a>`:''}<a class="rh-jbtn" href="tel:" data-a="rhCallMgr">${ic('users')}Zubair</a></div>
  <button class="rh-swipe" data-a="jNext" data-id="${cur.id}">${cur.st==='Out for delivery'?'Reached · do KYC & deliver':'Picked up · start trip'} <span>→</span></button></div>`:rhSec('Current delivery')+rhEmpty('No delivery right now','Zubair will assign your next one'))+
 (rej.length?`<button class="rh-band red" data-a="rhMyEx"><b>${rej.length} expense${rej.length>1?'s':''} rejected</b><span>Tap to see and add again with a bill</span>${ic('right')}</button>`:'')+
 `<div class="rh-tiles">${rhTile('expNew',ic('rupee'),'Add expense')}${rhTile('rhMyEx',ic('book'),'My expenses')}${rhGo('chat',ic('chat'),'Team chat')}${rhGo('tasks',ic('task'),'Tasks')}</div>`+
 (open.length>1?rhSec('Next deliveries')+open.filter(o=>o!==cur).map(rhJCard).join(''):'')}
A.rhCallMgr=e=>{const p=(P.zubair||{}).ph;if(!p){toast('Opening chat with Zubair');rhNav('chat')}};
A.rhMyEx=()=>{const L=D.vch.filter(v=>v.by===S.me&&v.ty==='Expense').slice(0,20);sheet(`<h2>My expenses</h2><div class="list">${L.map(v=>`<div class="li"><div class="tx"><b>${inr(v.amt)} · ${h(v.head||v.party)}</b><div class="m">${fmt(v.dt)} · ${h(v.party)}</div></div><span class="rh-vs ${/reject/i.test(v.st)?'red':/verified|paid/i.test(v.st)?'grn':''}">${h(v.st==='With manager'?'With Zubair':v.st==='To verify'?'With accounts':v.st)}</span></div>`).join('')||'<div class="xs mut" style="padding:10px">No expenses yet</div>'}</div><button class="btn w" style="margin-top:12px" data-a="expNew">Add expense</button>`)};

/* ---------- role: GovaaBazaar sales (Atmaram) ---------- */
function rhGb(){const t=D.targets.find(x=>x.who===S.me),O=D.gbo.filter(o=>o.at===TODAY&&(o.src==='Atmaram'||o.by===S.me)),sale=O.reduce((a,o)=>a+gbTot(o),0),cash=(D.petty.find(x=>x.id==='goa')||{}).hold||0,cr=new Set(D.gbo.filter(o=>o.r&&!/paid/i.test(o.pay||'')&&o.st!=='Cancelled').map(o=>o.r)).size;
 const v=t?t.v:sale,g=t?t.goal:0,p=pct(v,g);
 return `<div class="rh-goal"><div class="rh-gl"><span>Today's sale</span><b>${inr(v)}</b><small>of ${inr(g)} target · ${p}%</small></div><div class="rh-ring" style="--p:${p}"><b>${p}%</b></div><div class="rh-gbar"><i style="width:${p}%"></i></div><div class="rh-gfoot">${g>v?`Only <b>${inr(g-v)}</b> to go`:'🎉 Target done'} · ${O.length} order${O.length===1?'':'s'} today</div></div>`+
 rhKpi([[inr(cash),'cash in hand',cash>=5000?'red':''],[cr,'shops on credit'],[O.length,'orders today','grn']])+
 `<div class="rh-tiles">${rhTile('punch',ic('plus'),'Punch order')}${rhTile('grnNew',ic('box'),'Goods arrived')}${rhTile('expNew',ic('rupee'),'Expense')}${rhTile('depNew',ic('home'),'Cash to bank')}${rhGo('chat',ic('chat'),'Chat')}${rhGo('tasks',ic('task'),'Tasks')}${allowed('crl')?rhGo('crl',ic('lib'),'Library'):''}${rhTile('rhGbAll',ic('book'),'My orders')}</div>`+
 rhSec("Today's orders",`<button class="lnk" data-a="rhGbAll">All</button>`)+(O.slice(0,6).map(rhGbRow).join('')||rhEmpty('No orders yet today','Tap Punch order when a shop orders'))}
const rhGbRow=o=>`<div class="rh-row"><span class="rh-ri">${ic('box')}</span><div class="tx"><b>${h(gbShop(o))}</b><span>${h(o.id)} · ${Object.values(o.items||{}).reduce((a,b)=>a+b,0)} items · ${h(o.st||'Punched')}</span></div><b class="rh-amt">${inr(gbTot(o))}</b></div>`;
A.rhGbAll=()=>{const O=D.gbo.filter(o=>o.src==='Atmaram'||o.by===S.me).slice(0,30);sheet(`<h2>My orders</h2><div class="rh-list">${O.map(rhGbRow).join('')||'<div class="xs mut">No orders yet</div>'}</div>`)};

/* ---------- CSE · Ops · Marketing · HR · everyone ---------- */
function rhCse(){const me=S.me,W=(D.wa||[]).filter(c=>c.to===me),fu=W.filter(c=>c.fu&&!c.fu.done&&c.fu.d<=TODAY),un=W.filter(c=>c.unread),t=D.targets.find(x=>x.who===me);
 return rhKpi([[fu.length,'follow-ups due',fu.length?'red':''],[un.length,'unread chats','blue'],[W.length,'my leads'],[t?t.v+'/'+t.goal:myTasks().filter(x=>x.st!=='Done').length,t?'target':'open tasks','grn']])+
 `<div class="rh-tiles">${rhGo('crm',ic('chat'),'WhatsApp',un.length||'')}${rhTile('cmPad',ic('phone'),'Dialer')}${rhTile('bookNew',ic('plus'),'Add booking')}${rhTile('payNew',ic('rupee'),'Payment in')}${rhGo('tasks',ic('task'),'Tasks')}${rhGo('chat',ic('users'),'Team chat')}${allowed('crl')?rhGo('crl',ic('lib'),'Library'):''}${rhGo('tasks',ic('book'),'Forms','','forms')}</div>`+
 rhSec('Follow-ups due')+(fu.map(c=>`<button class="rh-row" data-a="rhLead" data-id="${c.id}"><span class="rh-ri">${h(sfIni(c.n))}</span><div class="tx"><b>${h(c.n)}</b><span>${h(c.fu.t)} · ${c.fu.d<TODAY?'late':'today'}${c.fu.tm?' '+c.fu.tm:''}</span></div><span class="stgp" style="--c:#B8860B">${h(c.stg)}</span></button>`).join('')||rhEmpty('No follow-ups due','Set them from the WhatsApp chat'))}
A.rhLead=e=>{const c=D.wa.find(x=>x.id===e.dataset.id);if(!c)return;S.cmco=(typeof WACO!=='undefined'&&WACO[c.team])||S.cmco;S.cmv='wa';S.cmd=c.id;rhNav('crm')};
function rhOps(){return rhKpi([['90%','pickup rate · 3 days','grn'],[myTasks().filter(t=>t.st!=='Done').length,'open tasks'],[myTasks().filter(t=>t.st!=='Done'&&t.due<TODAY).length,'late','red']])+`<div class="rh-tiles">${rhGo('work',ic('truck'),'Pickups')}${rhTile('expNew',ic('rupee'),'Expense')}${rhGo('chat',ic('chat'),'Team chat')}${rhGo('tasks',ic('task'),'Tasks')}</div>`}
function rhMkt(){return rhKpi([[myTasks().filter(t=>t.st!=='Done'&&t.due<=TODAY).length,'due today','org'],[myTasks().filter(t=>t.st!=='Done'&&t.due<TODAY).length,'late','red'],[(D.posts||[]).filter(p=>p.d===TODAY||p.date===TODAY).length,'posts today','blue']])+`<div class="rh-tiles">${allowed('studio')?rhGo('studio',ic('film'),'Studios'):''}${allowed('crl')?rhGo('crl',ic('lib'),'Library'):''}${allowed('content')?rhGo('content',ic('star'),'Content'):''}${rhGo('tasks',ic('book'),'Forms','','forms')}${rhGo('tasks',ic('task'),'Tasks')}${rhGo('chat',ic('chat'),'Team chat')}</div>`}
function rhHr(){return rhKpi([[myTasks().filter(t=>t.st!=='Done').length,'open tasks'],[myTasks().filter(t=>t.st!=='Done'&&t.due<TODAY).length,'late','red']])+`<div class="rh-tiles">${rhGo('work',ic('users'),'Hiring board')}${rhGo('tasks',ic('book'),'Forms','','forms')}${rhGo('tasks',ic('task'),'Tasks')}${rhGo('chat',ic('chat'),'Team chat')}${allowed('crl')?rhGo('crl',ic('lib'),'Library'):''}</div>`}
function rhGen(){return rhKpi([[myTasks().filter(t=>t.st!=='Done'&&t.due<=TODAY).length,'due today','org'],[myTasks().filter(t=>t.st!=='Done').length,'open']])+`<div class="rh-tiles">${rhGo('tasks',ic('task'),'Tasks')}${rhGo('chat',ic('chat'),'Team chat')}${allowed('crl')?rhGo('crl',ic('lib'),'Library'):''}${rhTile('expNew',ic('rupee'),'Expense')}</div>`}

function rhTasks(){const L=myTasks().filter(t=>t.st!=='Done'&&t.o===S.me).sort((a,b)=>(a.due||'9').localeCompare(b.due||'9')).slice(0,4);if(!L.length)return '';
 return rhSec('My tasks',`<button class="lnk" data-a="rhGo" data-v="tasks">See all</button>`)+`<div class="rh-list">${L.map(t=>`<button class="rh-row" data-a="tOpen" data-id="${t.id}"><span class="rh-ri ${t.due<TODAY?'red':''}">${ic('task')}</span><div class="tx"><b>${h(t.t)}</b><span>${t.due?(t.due<TODAY?'Late · ':t.due===TODAY?'Today · ':'')+fmt(t.due):'No date'} · ${h(t.st)}</span></div></button>`).join('')}</div>`}
function roleHome(){const me=ME(),r=rhRole(S.me),a=rhAtt(),hr=+new Date().toLocaleString('en-US',{hour:'numeric',hour12:false,timeZone:'Asia/Kolkata'}),gr=hr<12?'Good morning':hr<17?'Good afternoon':'Good evening',tr=D.training||{},ann=(D.msgs||[]).filter(m=>m.g==='ann').slice(-1)[0];
 const head=`<div class="rh-hd"><div style="flex:1;min-width:0"><span>${gr}</span><h1>${h(nmF(S.me))}</h1><small>${h(me.r||'')}</small></div><button class="rh-me" data-a="rhGo" data-v="me" aria-label="My profile">${av(nm(S.me))}</button></div>`;
 const train=tr.done&&!tr.done[S.me]&&tr.today?`<button class="rh-band blue" data-a="trOpen"><b>Compulsory training · 1 min</b><span>${h(tr.today.t)}</span>${ic('right')}</button>`:'';
 if(!a||!a.in)return `<div class="rh">${head}${rhShift()}${train}<div class="rh-lock">${ic('clock')}<b>Your work opens after you start the shift</b><span>Orders, deliveries, leads and tasks for today show here</span></div>${ann?rhSec('Announcement')+`<div class="rh-ann">${h(ann.t)}<small>${h(nmF(ann.f))} · ${h(ann.at)}</small></div>`:''}</div>`;
 const body={jmgr:rhJmgr,rider:rhRider,gb:rhGb,cse:rhCse,ops:rhOps,mkt:rhMkt,hr:rhHr,gen:rhGen}[r]();
 return `<div class="rh">${head}${rhShift()}${train}${body}${rhTasks()}${ann?rhSec('Announcement')+`<div class="rh-ann">${h(ann.t)}<small>${h(nmF(ann.f))} · ${h(ann.at)}</small></div>`:''}</div>`}
const _vHomeRH=V.home;V.home=()=>{if(isMob()&&!isAdm()&&K()!=='acc'&&K()!=='partner'&&!isZen())return roleHome();return _vHomeRH()};

document.head.insertAdjacentHTML('beforeend',`<style>
.rh{padding-bottom:10px}
.rh-hd{display:flex;align-items:center;gap:12px;margin:2px 0 12px}.rh-hd span{font-size:12.5px;color:var(--mut);font-weight:600}.rh-hd h1{margin:0;font-size:24px;line-height:1.15;letter-spacing:-.02em}.rh-hd small{font-size:12.5px;color:var(--mut)}.rh-me{border:0;background:none;padding:0}.rh-me .av{width:42px;height:42px}
.rh-off{background:linear-gradient(150deg,#14213D,#24408E);border-radius:22px;padding:18px;color:#fff;margin-bottom:12px}
.rh-offt{display:flex;gap:12px;align-items:center}.rh-offt b{display:block;font-size:17px}.rh-offt span{font-size:12.5px;opacity:.75}
.rh-dot{width:12px;height:12px;border-radius:50%;background:#22C55E;box-shadow:0 0 0 4px rgba(34,197,94,.25);flex:none}.rh-dot.off{background:#F97316;box-shadow:0 0 0 4px rgba(249,115,22,.25)}
.rh-start{margin-top:16px;width:100%;display:flex;align-items:center;gap:12px;border:0;border-radius:16px;background:#22C55E;color:#fff;padding:12px 14px;cursor:pointer;text-align:left;box-shadow:0 8px 20px rgba(34,197,94,.35)}
.rh-start>span{width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,.22);display:grid;place-items:center}.rh-start svg{width:22px;height:22px}.rh-start b{font-size:17px;flex:1}.rh-start small{font-size:12px;opacity:.9}
.rh-off #camwrap{color:var(--ink)}.rh-off #camwrap .xs{color:#cbd5e1}
.rh-on{display:flex;align-items:center;gap:12px;background:#ECFDF3;border:1px solid #ABEFC6;border-radius:16px;padding:10px 12px;margin-bottom:12px}.rh-on b{display:block;font-size:14px;color:#067647}.rh-on span{font-size:12px;color:#3B7A57}
.rh-on.done{background:#F2F4F7;border-color:#E4E7EC}.rh-on.done b{color:#344054}.rh-on.done span{color:var(--mut)}.rh-on.done .rh-dot{background:#98A2B3;box-shadow:none}
.rh-end{border:1px solid #FDA29B;background:#fff;color:#B42318;border-radius:10px;padding:7px 10px;font:700 12px Inter,sans-serif;cursor:pointer}
.rh-lock{display:flex;flex-direction:column;align-items:center;text-align:center;gap:4px;border:1.5px dashed #D0D5DD;border-radius:18px;padding:22px 16px;color:var(--mut);margin:12px 0}.rh-lock svg{width:28px;height:28px}.rh-lock b{color:var(--ink);font-size:14.5px}.rh-lock span{font-size:12.5px}
.rh-kpi{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;background:#fff;border:1px solid var(--line);border-radius:16px;padding:10px 2px;margin-bottom:12px}
.rh-kpi>div{text-align:center;border-right:1px solid var(--line);padding:0 4px;min-width:0}.rh-kpi>div:last-child{border:0}.rh-kpi b{display:block;font-size:18px;color:#0B3D5C;white-space:nowrap}.rh-kpi span{display:block;font-size:10.5px;color:var(--mut);line-height:1.2;margin-top:2px}
.rh-kpi .k-red b{color:#D92D20}.rh-kpi .k-grn b{color:#1F9D55}.rh-kpi .k-org b{color:#C2410C}.rh-kpi .k-blue b{color:#2563C9}
.rh-tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:10px 6px;background:#fff;border:1px solid var(--line);border-radius:18px;padding:14px 6px;margin-bottom:14px}
.rh-tile{border:0;background:none;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;padding:0;min-width:0}.rh-tile b{font-size:11.5px;font-weight:600;color:#344054;text-align:center;line-height:1.2}
.rh-ti{position:relative;width:48px;height:48px;border-radius:15px;background:#EEF2FB;color:#24408E;display:grid;place-items:center}.rh-ti svg{width:22px;height:22px}
.rh-tile:nth-child(4n+2) .rh-ti{background:#FFF1E6;color:#C2410C}.rh-tile:nth-child(4n+3) .rh-ti{background:#E8F7EF;color:#1F9D55}.rh-tile:nth-child(4n+4) .rh-ti{background:#F3EBFB;color:#7A4CC2}
.rh-ti em{position:absolute;top:-5px;right:-8px;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#D92D20;color:#fff;font:700 10px/18px Inter,sans-serif;font-style:normal;white-space:nowrap}
.rh-sec{display:flex;align-items:center;justify-content:space-between;margin:16px 2px 8px}.rh-sec b{font-size:15.5px}.rh-mut{font-size:12px;color:var(--mut)}
.rh-chips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin-bottom:10px}.rh-chips::-webkit-scrollbar{display:none}.rh-chips button{flex:none;border:1px solid var(--line);background:#fff;border-radius:99px;padding:6px 11px;font:600 12.5px Inter,sans-serif;color:#344054;cursor:pointer}.rh-chips button span{color:var(--mut);margin-left:2px}.rh-chips button.on{background:#14213D;border-color:#14213D;color:#fff}.rh-chips button.on span{color:#cbd5e1}
.rh-card{background:#fff;border:1px solid var(--line);border-left:4px solid var(--c);border-radius:14px;padding:11px 12px;margin-bottom:8px}
.rh-cr1{display:flex;gap:8px;align-items:center}.rh-cr1 b{flex:1;font-size:14.5px;min-width:0}.rh-st{font:700 11px Inter,sans-serif;color:var(--c);background:color-mix(in srgb,var(--c) 12%,#fff);border-radius:99px;padding:3px 9px;white-space:nowrap}
.rh-cr2{font-size:12.5px;color:#475467;margin-top:2px}.rh-cr3{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:6px;font-size:11.5px;color:var(--mut)}.rh-ok{color:#1F9D55;font-weight:700}
.rh-cr4{display:flex;gap:8px;margin-top:10px;align-items:center}.rh-ib{width:38px;height:38px;border-radius:11px;border:1px solid var(--line);display:grid;place-items:center;color:#344054;flex:none}.rh-ib svg{width:18px;height:18px}.rh-ib.wa{color:#1F9D55}
.rh-cta{flex:1;border:0;border-radius:11px;background:#14213D;color:#fff;font:700 13px Inter,sans-serif;padding:11px 10px;cursor:pointer}
.rh-band{width:100%;display:grid;grid-template-columns:1fr auto;align-items:center;text-align:left;border:0;border-radius:16px;background:#FFF4E5;padding:12px 14px;margin-bottom:12px;cursor:pointer}.rh-band b{font-size:14px;color:#93370D}.rh-band span{grid-column:1;font-size:12px;color:#B54708}.rh-band svg{grid-row:1/3;grid-column:2;width:18px;height:18px;color:#B54708}
.rh-band.blue{background:#EEF4FF}.rh-band.blue b{color:#1E3A8A}.rh-band.blue span,.rh-band.blue svg{color:#3B5BDB}.rh-band.red{background:#FEF3F2}.rh-band.red b{color:#B42318}.rh-band.red span,.rh-band.red svg{color:#D92D20}
.rh-row{width:100%;display:flex;align-items:center;gap:10px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:10px 12px;margin-bottom:6px;text-align:left;cursor:pointer;font:inherit;color:inherit}
.rh-row .tx{flex:1;min-width:0;display:flex;flex-direction:column}.rh-row .tx b{font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rh-row .tx span{font-size:11.5px;color:var(--mut)}
.rh-ri{width:34px;height:34px;border-radius:10px;background:#EEF2FB;color:#24408E;display:grid;place-items:center;font:700 12px Inter,sans-serif;flex:none}.rh-ri svg{width:17px;height:17px}.rh-ri.red{background:#FEF3F2;color:#D92D20}.rh-amt{font-size:14px;white-space:nowrap}
.rh-empty{display:flex;flex-direction:column;align-items:center;gap:2px;background:#fff;border:1px dashed var(--line);border-radius:14px;padding:16px;text-align:center}.rh-empty b{font-size:13.5px}.rh-empty span{font-size:12px;color:var(--mut)}
.rh-ann{background:#fff;border:1px solid var(--line);border-radius:14px;padding:11px 12px;font-size:13.5px}.rh-ann small{display:block;color:var(--mut);font-size:11.5px;margin-top:4px}
.rh-goal{position:relative;background:linear-gradient(150deg,#7A3E12,#C2410C);color:#fff;border-radius:20px;padding:16px;margin-bottom:12px;display:grid;grid-template-columns:1fr auto;gap:4px 12px;align-items:center}
.rh-gl span{font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;opacity:.85}.rh-gl b{display:block;font-size:30px;line-height:1.1;letter-spacing:-.02em;margin-top:2px}.rh-gl small{font-size:12.5px;opacity:.9}
.rh-ring{width:66px;height:66px;border-radius:50%;background:conic-gradient(#FDE68A calc(var(--p)*1%),rgba(255,255,255,.2) 0);display:grid;place-items:center}.rh-ring b{width:52px;height:52px;border-radius:50%;background:#A3501A;display:grid;place-items:center;font-size:14px}
.rh-gbar{grid-column:1/-1;height:6px;border-radius:3px;background:rgba(255,255,255,.22);overflow:hidden;margin-top:6px}.rh-gbar i{display:block;height:100%;background:#FDE68A;border-radius:3px}.rh-gfoot{grid-column:1/-1;font-size:12.5px;opacity:.95}
.rh-job{background:#fff;border:1px solid var(--line);border-radius:20px;padding:14px;margin-bottom:12px;box-shadow:0 6px 18px rgba(16,24,40,.06)}
.rh-jt{display:flex;justify-content:space-between;align-items:center}.rh-jb{display:block;font-size:18px;margin-top:8px}.rh-ja{font-size:13px;color:#475467;margin-top:2px}
.rh-jr{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:8px;margin-top:12px}.rh-jbtn{display:flex;align-items:center;justify-content:center;gap:6px;border:1px solid var(--line);border-radius:12px;padding:9px 0;font:600 12.5px Inter,sans-serif;color:#344054;text-decoration:none}.rh-jbtn svg{width:16px;height:16px}
.rh-swipe{margin-top:12px;width:100%;border:0;border-radius:14px;background:#1F9D55;color:#fff;font:700 15px Inter,sans-serif;padding:14px;cursor:pointer;display:flex;justify-content:center;gap:8px}.rh-swipe span{font-size:18px;line-height:1}
.rh-2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.rh-pick{display:flex;gap:8px;overflow-x:auto;padding:4px 0 2px;scrollbar-width:none}.rh-pick button{flex:none;display:flex;flex-direction:column;align-items:flex-start;gap:2px;border:1.5px solid var(--line);background:#fff;border-radius:12px;padding:8px 10px;cursor:pointer;min-width:110px;text-align:left}.rh-pick button b{font-size:13px}.rh-pick button span{font-size:11px;color:var(--mut)}.rh-pick button.on{border-color:#24408E;background:#EEF2FB}
.rh-pick.ppl button{align-items:center;text-align:center;min-width:92px}.rh-pick.ppl .av{width:34px;height:34px}
.rh-chk div{display:flex;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid var(--line);font-size:13.5px}.rh-chk i{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-weight:800;font-size:12px;flex:none}.rh-chk .ok i{background:#ECFDF3;color:#1F9D55}.rh-chk .no i{background:#FEF3F2;color:#D92D20}
.rh-rv .ib{width:36px;height:36px;border-radius:10px;border:1px solid var(--line);background:#fff;color:#D92D20;font-weight:800}.rh-rv .ib.ok{background:#1F9D55;border-color:#1F9D55;color:#fff}
.rh-vs{font:700 11px Inter,sans-serif;border-radius:99px;padding:3px 8px;background:#F2F4F7;color:#475467;white-space:nowrap}.rh-vs.red{background:#FEF3F2;color:#B42318}.rh-vs.grn{background:#ECFDF3;color:#067647}
.rh-list .rh-row{cursor:default}
</style>`);
/* accountant (Snehal Z): bills Zubair approved come to the top of her phone home */
const _vHomeAcc=V.home;V.home=()=>{const o=_vHomeAcc();if(!isMob()||K()!=='acc')return o;const W=D.vch.filter(v=>v.st==='To verify'),Z=W.filter(v=>v.src==='Approved by Zubair');if(!W.length)return o;
 const band=`<button class="rh-band" data-a="mgo" data-t="verify" style="margin-top:4px"><b>${W.length} entr${W.length>1?'ies':'y'} to verify · ${inr(W.reduce((a,v)=>a+v.amt,0))}</b><span>${Z.length?`${Z.length} approved by Zubair (Jupiter Pune) · `:''}check, verify and pay</span>${ic('right')}</button>`;
 const i=o.indexOf('Needs you'),j=i>0?o.lastIndexOf('<div',i):-1;return j>0?o.slice(0,j)+band+o.slice(j):band+o};
