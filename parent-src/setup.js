/* ===================== Companies order · Incentives in HR Desk · Training Day 1–6 files · no clock-in for Darshan · App blueprint · Settings & screen modes ===================== */

/* ---- Companies order everywhere: Logistics, HR Consultancy, GovaaBazaar, Jupiter, Studios ---- */
const CORD=['log','hr','gb','jup','studios','bah'];
COK.sort((a,b)=>(CORD.indexOf(a)+1||99)-(CORD.indexOf(b)+1||99));

/* ---- Incentives: HR Desk → Incentives. Nameera raises / approves → Accounts pays ---- */
const incW=l=>/wait|pending|raised/i.test(l.st),incA=l=>/approved/i.test(l.st)&&!/paid/i.test(l.st),incP=l=>/paid/i.test(l.st);
const _peopleX9=V.people;V.people=()=>{let out=_peopleX9();const n=D.ledger.filter(l=>incW(l)&&incOk(l.k)).length;
 out=out.replace(/(<button role="tab"[^>]*data-t="pay"[^>]*>[^<]*<\/button>)/,`$1<button role="tab" aria-selected="${S.ptab==='inc'}" class="${S.ptab==='inc'?'on':''}" data-a="ptab" data-t="inc">Incentives${n?` <span class="n">${n}</span>`:''}</button>`);
 if(S.ptab==='inc'){const i=out.indexOf('<div style="margin-top:12px"></div>');if(i>0)out=out.slice(0,i)+'<div style="margin-top:12px"></div>'+pInc()}return out};
const incPer=()=>S.incP||'m';
const incIn=l=>{const p=incPer(),d=String(l.at||TODAY).slice(0,10);if(p==='all')return true;if(p==='d')return d===TODAY;if(p==='w')return d>=addD(TODAY,-6)&&d<=TODAY;return d.slice(0,7)===TODAY.slice(0,7)};
A.incP=e=>{S.incP=e.dataset.t;render()};
function pInc(){const L=D.ledger.map((l,i)=>Object.assign({i},l)).filter(incIn).filter(l=>incOk(l.k)),W=L.filter(incW),Ap=L.filter(incA),Pd=L.filter(incP),R=L.filter(l=>/reject/i.test(l.st));
 const sum=a=>inr(a.reduce((s,l)=>s+(+l.amt||0),0));const can=isAdm();
 const row=l=>`<div class="li">${av(nm(l.k))}<div class="tx"><b>${h(nm(l.k))} · ${h(l.what)}</b><div class="m">${h(l.st)}${l.at?' · '+fmt(l.at):''}</div></div><b class="amt">${inr(l.amt)}</b>${incW(l)&&can?`<button class="btn sm" data-a="incOk" data-i="${l.i}">Approve</button><button class="btn sm sec" data-a="incNo" data-i="${l.i}">Reject</button>`:''}${incA(l)&&(K()==='acc'||isBoss())?`<button class="btn sm" data-a="incPaid" data-i="${l.i}">Mark paid</button>`:''}</div>`;
 const per={};L.filter(l=>!/reject/i.test(l.st)).forEach(l=>{const o=per[l.k]=per[l.k]||{n:0,t:0,w:0,a:0,p:0};o.n++;o.t+=+l.amt||0;if(incW(l))o.w+=+l.amt||0;else if(incA(l))o.a+=+l.amt||0;else if(incP(l))o.p+=+l.amt||0});
 const pl={d:'Today',w:'This week',m:'This month',all:'All time'}[incPer()];
 const byP=Object.entries(per).sort((a,b)=>b[1].t-a[1].t);
 return `<div class="chips" role="tablist" style="margin-bottom:10px">${[['d','Today'],['w','This week'],['m','This month'],['all','All time']].map(([k,l])=>`<button role="tab" aria-selected="${incPer()===k}" class="${incPer()===k?'on':''}" data-a="incP" data-t="${k}">${l}</button>`).join('')}</div>
 ${st('Who gets how much · '+pl)}<div class="xsheet" style="margin-bottom:14px"><table><thead><tr><th class="stk">Employee</th><th>Incentives</th><th>Total</th><th>Waiting</th><th>With Accounts</th><th>Paid</th></tr></thead><tbody>${byP.map(([k,o])=>`<tr><td class="stk"><b>${h(nm(k))}</b><span>${h((P[k]||{}).r||'')}</span></td><td>${o.n}</td><td><b>${inr(o.t)}</b></td><td>${o.w?inr(o.w):'–'}</td><td>${o.a?inr(o.a):'–'}</td><td>${o.p?inr(o.p):'–'}</td></tr>`).join('')||`<tr><td colspan="6">${empty('No incentives '+pl.toLowerCase(),'')}</td></tr>`}${byP.length>1?`<tr><td class="stk"><b>Total</b></td><td>${byP.reduce((a,x)=>a+x[1].n,0)}</td><td><b>${inr(byP.reduce((a,x)=>a+x[1].t,0))}</b></td><td></td><td></td><td></td></tr>`:''}</tbody></table></div>
 <div class="row" style="margin-bottom:10px"><div class="xs mut" style="flex:1">Nameera raises or approves incentives here. Approved incentives go to Accounts (Snehal Z), who pays them with salary and marks them paid.</div>${can?`<button class="btn" data-a="incNew">${ic('plus')}Raise incentive</button>`:''}</div>
 <div class="stats" style="margin-bottom:12px"><div><b>${W.length}</b><span>waiting · ${sum(W)}</span></div><div><b>${Ap.length}</b><span>with Accounts · ${sum(Ap)}</span></div><div><b>${Pd.length}</b><span>paid · ${sum(Pd)}</span></div></div>
 ${st('Waiting for approval')}<div class="list">${W.map(row).join('')||empty('Nothing waiting','New incentives appear here')}</div>
 ${st('Approved · sent to Accounts')}<div class="list">${Ap.map(row).join('')||empty('Nothing with Accounts','')}</div>
 ${Pd.length||R.length?`${st('Paid / rejected')}<div class="list">${[...Pd,...R].map(row).join('')}</div>`:''}`}
A.incNew=()=>{const ks=Object.keys(P).filter(k=>['staff','hr','acc'].includes(P[k].kind)&&incOk(k));sheet(`<h2>Raise incentive</h2><label for="inc-k">Employee</label><select id="inc-k">${ks.map(k=>`<option value="${k}">${h(P[k].n)} · ${h(P[k].r||'')}</option>`).join('')}</select><label for="inc-w">For what</label><input id="inc-w" placeholder="e.g. Spot incentive · 5 bookings"><label for="inc-a">Amount ₹</label><input id="inc-a" type="number" min="1"><button class="btn w" style="margin-top:12px" data-a="incNewGo">${isAdm()?'Raise & approve':'Raise'}</button>`)};
A.incNewGo=()=>{const k=val('inc-k'),w=val('inc-w').trim(),a=+val('inc-a');if(!w||!(a>0))return toast('Write what it is for and the amount');D.ledger.unshift({k,what:w,amt:a,at:TODAY,st:K()==='hr'?'Approved · Nameera → Accounts':isBoss()?'Approved · Darshan → Accounts':'Waiting · Nameera',by:S.me});save();closeM();render();toast('Incentive added')};
A.incOk=e=>{const l=D.ledger[+e.dataset.i];if(!l)return;l.st='Approved · '+nm(S.me).split(' ')[0]+' → Accounts';save();render();toast('Approved · sent to Accounts')};
A.incNo=e=>{const l=D.ledger[+e.dataset.i];if(!l)return;l.st='Rejected · '+nm(S.me).split(' ')[0];save();render()};
A.incPaid=e=>{const l=D.ledger[+e.dataset.i];if(!l)return;l.st='Paid · '+nm(S.me).split(' ')[0]+' · '+fmt(TODAY);save();render();toast('Marked paid')};
/* Accounts sees what HR approved */
const _moneyX9=V.money;V.money=()=>{const out=_moneyX9(),Ap=D.ledger.map((l,i)=>Object.assign({i},l)).filter(incA);if(!Ap.length||!(K()==='acc'||isAdm()))return out;
 return out+`${st('Incentives approved by HR · to pay',`<button class="lnk" data-a="incGo">HR Desk →</button>`)}<div class="list">${Ap.map(l=>`<div class="li">${av(nm(l.k))}<div class="tx"><b>${h(nm(l.k))} · ${h(l.what)}</b><div class="m">${h(l.st)}</div></div><b class="amt">${inr(l.amt)}</b>${K()==='acc'||isBoss()?`<button class="btn sm" data-a="incPaid" data-i="${l.i}">Mark paid</button>`:''}</div>`).join('')}</div>`};
A.incGo=()=>{S.v='people';S.ptab='inc';render()};

/* ---- Training: Day 1–6 induction files (PDF, mock tests…) ---- */
const TRD={files:null,busy:false,err:''};
const trLive=()=>typeof LIVE!=='undefined'&&LIVE&&LV.ok;
async function trLoad(){if(TRD.busy)return;if(!trLive()){TRD.files=D.trFiles||[];return}TRD.busy=true;try{TRD.files=(await lapi('GET','/api/training/files')).files||[]}catch(x){TRD.err=x.message;TRD.files=[]}TRD.busy=false;render()}
const trSize=b=>b>1048576?(b/1048576).toFixed(1)+' MB':Math.max(1,Math.round(b/1024))+' KB';
const trIcon=n=>/^(Day \d|Boss Exam)/.test(n)?'🎓':/\.pdf$/i.test(n)?'📕':/\.(xlsx?|csv)$/i.test(n)?'📗':/\.(docx?)$/i.test(n)?'📘':/\.(pptx?)$/i.test(n)?'📙':/\.(png|jpe?g|webp)$/i.test(n)?'🖼':/\.(mp4|mov|webm)$/i.test(n)?'🎬':'📄';
const TRDAY=['JDAC ko jaano','WhatsApp aur quotation','Stages aur rounds','Convince karo, booking pakki','Apni leads','Final day'];
/* Built-in CSE induction (from cse_training_jdac): one interactive page per day + Boss exam on Day 6 */
const TRBASE=/github\.io$/.test(location.hostname)?'./training/':'https://jdaclogistics-web.github.io/JDACTracker/training/';
const TRCL=['MzhPyFKbJt53a3DTiMChAZ','7dreZRy8MmLUU4SBUBZb6L','5SUTqiqUGZzMkK8BL7a2f3','TQ8Sz7SYYR9tQRtq8orUVa','Jcm8drdsYsSi8hjvuwHbh7','YbnCeJQH7iJkp9UnGAU5vN','MWLjagXGPb2tD7gTeN1JSL'].map(x=>'https://claude.ai/artifact/'+x);
const TRB=[1,2,3,4,5,6].map(d=>({id:'b'+d,day:d,name:'Day '+d+' · '+TRDAY[d-1],url:TRBASE+'day'+d+'.html',mime:'text/html',built:1,by:'JDAC CSE induction'})).concat([{id:'b7',day:6,name:'Boss Exam · CSE Day 6',url:TRBASE+'boss-exam.html',mime:'text/html',built:1,by:'JDAC CSE induction'}]);
function trBlock(){if(TRD.files===null&&!TRD.busy)setTimeout(trLoad,0);const d=+(S.trDay||1),ALL=[...TRB,...(TRD.files||[])],F=ALL.filter(f=>+f.day===d),can=isAdm();
 const cnt=k=>ALL.filter(f=>+f.day===k).length;
 return `${st('6-day CSE induction · click a day')}<div class="trdays" role="tablist">${[1,2,3,4,5,6].map(k=>`<button role="tab" aria-selected="${d===k}" class="${d===k?'on':''}" data-a="trDay" data-d="${k}"><b>Day ${k}</b><span>${TRDAY[k-1]}</span>${cnt(k)?`<em>${cnt(k)}</em>`:''}</button>`).join('')}</div>
 <div class="card"><div class="row" style="margin-bottom:8px"><b style="flex:1">Day ${d} · ${TRDAY[d-1]}</b>${can?`<label class="btn sm" style="cursor:pointer">${ic('plus')}Upload files<input type="file" multiple class="sr" data-ch="trUp" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.mp4,.txt"></label>`:''}</div>
 <div class="list">${F.map(f=>`<div class="li"><span style="font-size:22px">${trIcon(f.name)}</span><div class="tx"><button class="lnk" style="font-weight:700;text-align:left" data-a="trView" data-id="${f.id}">${h(f.name)}</button><div class="m">${f.built?'Interactive lesson + tests · '+h(f.by):trSize(f.size||0)+' · '+h(f.by||'')+' · '+fmt(String(f.at||TODAY).slice(0,10))}</div></div><button class="btn sm sec" data-a="trView" data-id="${f.id}">Open</button>${can&&f.built?`<button class="btn sm trwa" data-a="trShare" data-id="${f.id}">Share</button>`:''}${can&&!f.built?`<button class="lnk" style="color:var(--r)" data-a="trDel" data-id="${f.id}" aria-label="Delete ${h(f.name)}">Delete</button>`:''}</div>`).join('')||empty(TRD.busy?'Loading…':TRD.err||'No files for Day '+d+' yet',can?'Press Upload files to add PDFs, mock tests or slides':'HR will add the files for this day')}</div></div>`}
const _vTrX9=V.training;V.training=()=>{let out=_vTrX9();const j=out.indexOf('<div class="st"><h2>6-day induction');if(j>0)out=out.slice(0,j);const i=out.indexOf('<div class="st">');return (i>0?out.slice(0,i)+trBlock()+out.slice(i):out+trBlock())+libBlock()};
function libBlock(){const F=(TRD.files||[]).filter(f=>+f.day===0),can=isAdm();
 return `${st('Library · other training files',can?`<label class="btn sm" style="cursor:pointer">${ic('plus')}Upload<input type="file" multiple class="sr" data-ch="trUp" data-day="0" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.mp4,.txt"></label>`:'')}<div class="list">${F.map(f=>`<div class="li"><span style="font-size:22px">${trIcon(f.name)}</span><div class="tx"><button class="lnk" style="font-weight:700;text-align:left" data-a="trView" data-id="${f.id}">${h(f.name)}</button><div class="m">${trSize(f.size||0)} · ${h(f.by||'')} · ${fmt(String(f.at||TODAY).slice(0,10))}</div></div><button class="btn sm sec" data-a="trView" data-id="${f.id}">Open</button>${can?`<button class="lnk" style="color:var(--r)" data-a="trDel" data-id="${f.id}">Delete</button>`:''}</div>`).join('')||empty('No files yet',can?'Upload PDFs, videos or guides that are not tied to one day — e.g. rate cards, SOPs, product sheets':'HR will add files here')}</div>`}
A.trDay=e=>{S.trDay=+e.dataset.d;render()};
function trBuiltOpen(f){closeM();const o=document.createElement('div');o.className='ov trfull';o.id='ov';
 o.innerHTML=`<div class="trfbar"><button class="btn sm sec" data-a="closeM">← Back to Training</button><div class="trfdays" role="tablist">${TRB.map(b=>`<button role="tab" aria-selected="${b.id===f.id}" class="${b.id===f.id?'on':''}" data-a="trBuilt" data-id="${b.id}">${b.id==='b7'?'Boss Exam':'Day '+b.day}</button>`).join('')}</div><a class="btn sm sec hide-m" href="${f.url}" target="_blank" rel="noopener">New tab ↗</a><button class="x" data-a="closeM" aria-label="Close" style="position:static">×</button></div><iframe title="${h(f.name)}" src="${f.url}"></iframe>`;document.body.appendChild(o)}
A.trBuilt=e=>{const f=TRB.find(x=>x.id===e.dataset.id);if(f){S.trDay=f.day;trBuiltOpen(f)}};
document.addEventListener('change',async e=>{if(!(e.target.dataset&&e.target.dataset.ch==='trUp'))return;const fs=[...(e.target.files||[])],d=e.target.dataset.day!=null?+e.target.dataset.day:+(S.trDay||1);e.target.value='';if(!fs.length)return;
 for(const f of fs){if(f.size>25*1048576){toast(f.name+' is over 25 MB');continue}toast('Uploading '+f.name+'…');
  try{if(trLive()){const r=await fetch(API+'/api/admin/training/files?day='+d+'&name='+encodeURIComponent(f.name),{method:'POST',headers:{Authorization:'Bearer '+LV.tok,'Content-Type':f.type||'application/octet-stream'},body:f});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||('Upload failed '+r.status))}
   else{if(f.size>1.5*1048576)throw new Error('Too big for offline mode');const url=await new Promise(ok=>{const rd=new FileReader();rd.onload=()=>ok(rd.result);rd.readAsDataURL(f)});D.trFiles=D.trFiles||[];D.trFiles.push({id:'t'+Date.now(),day:d,name:f.name,size:f.size,mime:f.type,url,at:TODAY,by:ME().n});save()}
   toast('Uploaded '+f.name)}catch(x){toast(x.message)}}
 TRD.files=null;trLoad();render()});
A.trView=async e=>{const f=[...TRB,...(TRD.files||[])].find(x=>x.id===e.dataset.id);if(!f)return;let url=f.url;
 if(f.built&&/github\.io$/.test(location.hostname))return trBuiltOpen(f);
 if(f.built&&!/github\.io$/.test(location.hostname))return sheet(`<h2>🎓 6-day CSE induction</h2><p class="sm">Pick a day. Each opens the lesson with its tests; come back here for the next day.</p><div class="trlinks">${TRB.map((b,i)=>`<a class="${b.id===f.id?'on':''}" href="${TRCL[i]}" target="_blank" rel="noopener"><b>${b.day===6&&b.id==='b7'?'Boss Exam':'Day '+b.day}</b><span>${h(b.id==='b7'?'CSE Day 6 test':TRDAY[b.day-1])}</span></a>`).join('')}</div><p class="xs mut" style="margin-top:10px">On the website (jdaclogistics-web.github.io/JDACTracker) the days open full-screen inside the tracker.</p>`);
 if(!url){try{toast('Opening…');const r=await fetch(API+'/api/training/files/'+f.id,{headers:{Authorization:'Bearer '+LV.tok}});if(!r.ok)throw new Error('Could not open ('+r.status+')');url=URL.createObjectURL(await r.blob())}catch(x){return toast(x.message)}}
 closeM();const show=/pdf|image|video|text|html/.test(f.mime||'')||/\.(pdf|png|jpe?g|mp4|txt)$/i.test(f.name);const o=document.createElement('div');o.className='ov trov';o.id='ov';
 o.innerHTML=`<div class="trpv" role="dialog" aria-modal="true" aria-label="${h(f.name)}"><div class="row" style="gap:8px;padding:10px 12px;border-bottom:1px solid var(--line)"><b style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${trIcon(f.name)} ${h(f.name)}</b>${f.built?`<a class="btn sm sec" href="${url}" target="_blank" rel="noopener">Full screen ↗</a>`:`<a class="btn sm sec" href="${url}" download="${h(f.name)}">Download</a>`}<button class="x" data-a="closeM" aria-label="Close" style="position:static">×</button></div>${show?`<iframe title="${h(f.name)}" src="${url}"></iframe>`:`<div style="padding:40px;text-align:center">This file type opens after download.<br><a class="btn" style="margin-top:12px" href="${url}" download="${h(f.name)}">Download ${h(f.name)}</a></div>`}</div>`;
 o.addEventListener('click',ev=>{if(ev.target===o)closeM()});document.body.appendChild(o)};
A.trDel=e=>{const f=(TRD.files||[]).find(x=>x.id===e.dataset.id);if(!f)return;sheet(`<h2>Delete this file?</h2><p class="sm">${h(f.name)} · Day ${f.day}</p><button class="btn w" style="background:var(--r);border-color:var(--r)" data-a="trDelGo" data-id="${f.id}">Delete</button>`)};
A.trDelGo=async e=>{const id=e.dataset.id;closeM();try{if(trLive())await lapi('POST','/api/admin/training/files/'+id+'/delete',{});else{D.trFiles=(D.trFiles||[]).filter(x=>x.id!==id);save()}toast('Deleted')}catch(x){toast(x.message)}TRD.files=null;trLoad();render()};

/* ---- Darshan (Boss): no clock in / clock out ---- */
const isWarehouse=k=>{const e=(D.emp||[]).find(x=>x.k===k)||{},p=P[k]||{};return /warehouse|goa team|godown/i.test([e.unit,e.team,e.dept,p.team,p.r,e.desig].join(' '))};
const _meStaffX=V.me;V.me=()=>{let out=_meStaffX();if(isBoss())return out;
 /* header: only name, ID, designation + today's date on the right */
 out=out.replace(/(<div class="mut sm">[^<]*?)( · \d{1,2}(?::\d\d)?\s?(?:am|pm)\s?[–-]\s?\d{1,2}(?::\d\d)?\s?(?:am|pm))(<\/div>)/i,'$1$3');
 out=out.replace(/<div class="xs" style="margin-top:4px"><b>Weekly off:<\/b>[^<]*<\/div>/,'');
 out=out.replace(/(<main class="wrap[^"]*" id="main"><div class="row nw" style="margin-bottom:14px">[\s\S]*?<\/div><\/div>)(\s*<\/div>)?/,(m)=>m);
 const dt=new Date(TODAY+'T12:00:00').toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
 out=out.replace(/<div class="row nw" style="margin-bottom:14px">(<div class="av l"[^>]*>[^<]*<\/div>)<div style="flex:1">(<h1 style="font-size:22px">[^<]*<\/h1><div class="mut sm">[^<]*<\/div>)<\/div><\/div>/,(m,avh,nmh)=>`<div class="mehead"><div class="medate"><b>${dt.split(',')[0]}</b><span>${dt.split(',').slice(1).join(',').trim()}</span></div><div class="mewho"><div style="text-align:right">${nmh}</div>${avh}</div></div>`);
 const ln=out.match(/<div class="latenote[^"]*"><b>([^<]*)<\/b><div class="sm">([^<]*)<\/div><\/div>/);
 if(ln){out=out.replace(ln[0],'');out=out.replace('<div class="mehead">',`<div class="mehead">`).replace(/(<div class="medate">[\s\S]*?<\/div>)/,`$1<button class="latechip" data-a="lateInfo" data-t="${h(ln[1])}" data-d="${h(ln[2])}">⚠ ${h(ln[1])}</button>`)}
 /* salary slips → request from HR (email template) */
 out=out.replace(/<div class="card"><b>My salary slips<\/b>[\s\S]*?<\/div><\/div>(?=\s*(<div class="card">|<\/div>|$))/,'');

 if(!isWarehouse(S.me))out=out.replace(/<div class="card"><div class="row nw"><b style="flex:1">Weekly off swap<\/b>[\s\S]*?<\/div><\/div><\/div>/,'');
 return out};
const _meX9=V.me;V.me=()=>{let out=_meX9();if(!isBoss())return out;
 out=out.replace(/<div class="card"><div class="row nw"><div style="flex:1"><div class="mut sm">Today<\/div>[\s\S]*?<div id="camwrap"><\/div><\/div>/,'');
 out=out.replace(/<div class="st"><h2>This month<\/h2><span class="sp"><\/span><\/div><div class="stats">(?:<div>[\s\S]*?<\/div>){3}<\/div>/,'');return out};

/* ---- App blueprint: short summary of every section + all logins ---- */
const BPX={home:'Goals, team today, this month numbers, alerts',tasks:'Give, track and approve tasks for every team',people:'Attendance, leave, payroll, employee master, incentives, holidays, rules',chat:'WhatsApp, mail, calls, team chats, Google Meet, JDAC Notetaker',money:'Income, expenses, cash, P&L for every company, incentives to pay',camp:'Meta ads results for each company, Today / Yesterday / 7 / 30 days',content:'Content calendar, library, series for every brand',contacts:'All contacts of all companies',kpi:'Score of every person: 70% numbers + 30% tasks on time',training:'Daily topic, 6-day induction files (Day 1–6), mock tests, library',settings:'Who sees what, connections, screen modes',blueprint:'This page',me:'Your profile, attendance, leave, salary',work:'Your daily work list'};
function bpHeads(v){try{const sv=S.v;let html='';try{S.v=v;html=V[v]?V[v]():''}finally{S.v=sv}const out=[];
 html.replace(/<div class="st"><h2>([^<]{2,40})<\/h2>/g,(m,t)=>{out.push(t.trim());return m});const un=t=>t.replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"');html.replace(/<div class="chips" role="tablist">([\s\S]*?)<\/div>/,(m,c)=>{c.replace(/data-t="[^"]*">([^<]{2,30})/g,(mm,t)=>{out.unshift(t.trim());return mm});return m});
 return [...new Set(out.map(un))].slice(0,9)}catch(x){return []}}
const BPL={list:null,busy:false,err:''};
async function bpLoad(){if(BPL.busy)return;if(!(typeof LIVE!=='undefined'&&LIVE&&LV.ok)){const seen=new Set(),A2=[];(D.emp||[]).forEach(e=>{const u=e.code||e.id;if(!u||seen.has(e.name))return;seen.add(e.name);A2.push({username:u,name:e.name,role:e.role||'employee',designation:e.desig||e.designation||'',phone:e.phone||e.mob||'',login_mode:e.phone||e.mob?'phone':'demo',active:e.active!==false})});Object.keys(P).filter(k=>!['employer','candidate','ext'].includes(P[k].kind)&&!seen.has(P[k].n)).forEach(k=>A2.push({username:k,name:P[k].n,role:P[k].kind,designation:P[k].r,phone:'',login_mode:'demo',active:true}));BPL.list=A2;return}
 BPL.busy=true;try{BPL.list=(await lapi('GET','/api/admin/employees')).employees||[]}catch(x){BPL.err=x.message;BPL.list=[]}BPL.busy=false;render()}
const BPC={home:['#0B1F3A','#1E3A6E','📊'],tasks:['#0E4D3F','#16765F','✅'],people:['#5B1530','#8C2A4D','🧑‍💼'],chat:['#123A6B','#2160A8','💬'],money:['#0F4C4C','#1C7A72','₹'],camp:['#33205E','#5B3A9E','📣'],content:['#6A3A10','#A35F1C','🎬'],contacts:['#263445','#41566E','📇'],kpi:['#6B4A0C','#A9781A','🏆'],training:['#1F4A25','#2F7A3A','🎓'],settings:['#2B2B33','#4A4A57','⚙️'],me:['#3A2D57','#5E4A8C','👤'],work:['#0E4D3F','#16765F','🗂']};
V.blueprint=()=>{if(BPL.list===null&&!BPL.busy)setTimeout(bpLoad,0);const T=tabsFor().filter(x=>x[0]!=='more'),extra=['people','chat','contacts','kpi','training','settings'].filter(v=>allowed(v)&&!T.some(x=>x[0]===v));
 const sec=[...T.map(x=>[x[0],x[0]==='home'?'Dashboard':x[1]]),...extra.map(v=>[v,{people:'HR Desk',chat:'Communication',contacts:'Contacts',kpi:'KPIs',training:'Training',settings:'Settings'}[v]])];
 const L=(BPL.list||[]).filter(e=>e.active!==false),q=(S.bpQ||'').toLowerCase(),L2=L.filter(e=>!q||(e.name+' '+e.username+' '+(e.phone||'')+' '+(e.designation||'')).toLowerCase().includes(q));
 const pw=e=>e.login_mode==='phone'?`<span class="bpk">Mobile number</span>${e.phone?` <span class="xs mut">${h(e.phone)}</span>`:''}`:e.login_mode==='locked'?'<span class="bpk lk">Locked</span>':e.login_mode==='demo'?'<span class="bpk">Demo login</span>':'<span class="bpk own">Own password</span>';
 const roles={};L.forEach(e=>roles[e.role]=(roles[e.role]||0)+1);
 const op=k=>(S.bpO||{h:1})[k]?'open':'';const ic2={h:'🧭',s:'🗂',c:'🏢',l:'🔐'};
 return `<details class="bpsec bpdd" ${op('h')}><summary class="bph" data-a="bpO" data-k="h"><span class="bpsi">${ic2.h}</span>How the app works</summary><div class="bpflow">${[['🔐','Log in','User ID (JD…) + password on the web link or the Android app'],['📸','Clock in','Live selfie + location starts the day; late marks are automatic'],['✅','Work','Tasks, leads, bookings and orders for your team'],['🏆','Score','KPIs: 70% numbers + 30% tasks on time'],['₹','Pay','HR runs payroll and incentives; Accounts pays']].map(([i,t,d],n)=>`<div class="bpstep"><span class="bpn">${n+1}</span><b>${i} ${t}</b><span>${d}</span></div>`).join('')}</div>
 <p class="bpnote">Darshan sir and Nameera see everything. Nameera runs HR (attendance, leave, payroll, incentives); Snehal Z runs Accounts. Each company — ${COK.map(k=>h(CO[k].n)).join(', ')} — has its own tabs under <b>Companies</b>.</p></details>
 <details class="bpsec bpdd" ${op('s')}><summary class="bph" data-a="bpO" data-k="s"><span class="bpsi">${ic2.s}</span>Sections in the menu <span class="bpcount">${sec.length}</span></summary><div class="bpgrid">${sec.map(([v,n])=>{const hd=bpHeads(v),c=BPC[v]||['#1B2A41','#34507A','•'];return `<button class="bpc" style="--c1:${c[0]};--c2:${c[1]}" data-a="go" data-v="${v}"><span class="bpi">${c[2]}</span><b>${h(n)}</b><span class="bpd2">${h(BPX[v]||'')}</span>${hd.length?`<ul>${hd.map(t=>`<li>${h(t)}</li>`).join('')}</ul>`:''}<span class="bpgo">Open →</span></button>`}).join('')}
 </div></details>
 ${COK.length&&isAdm()?`<details class="bpsec bpdd" ${op('c')}><summary class="bph" data-a="bpO" data-k="c"><span class="bpsi">${ic2.c}</span>Companies <span class="bpcount">${COK.length}</span></summary><div class="bpgrid">${COK.map((k,i)=>{const c=[['#0B1F3A','#24477F'],['#5B1530','#8C2A4D'],['#5C4410','#B08A2E'],['#0E4D3F','#16765F'],['#33205E','#5B3A9E'],['#263445','#41566E']][i%6];return `<button class="bpc" style="--c1:${c[0]};--c2:${c[1]}" data-a="coGo" data-k="${k}"><span class="bpi">🏢</span><b>${h(CO[k].n)}</b><ul>${(CO[k].tabs||[]).map(t=>`<li>${h(t[1])}</li>`).join('')}</ul><span class="bpgo">Open →</span></button>`}).join('')}</div></details>`:''}
 ${isAdm()?`<details class="bpsec bpdd bplog" ${op('l')}><summary class="bph" data-a="bpO" data-k="l"><span class="bpsi">${ic2.l}</span>Login credentials <span class="bpcount">${L.length}</span></summary><div class="row" style="flex-wrap:wrap;gap:10px;margin-bottom:10px"><span style="flex:1"></span><input class="bpq" placeholder="Search name, ID, mobile" value="${h(S.bpQ||'')}" data-ch="bpQ" aria-label="Search logins"></div>
 <div class="bpinfo"><span>🔗 Login link: <b>jdaclogistics-web.github.io/JDACTracker</b></span><span>${Object.entries(roles).map(([r,n])=>`${h(r)} ${n}`).join(' · ')}</span><span class="xs">New logins appear here automatically.</span></div>
 <div class="xsheet bptab"><table><thead><tr><th class="stk">Name</th><th>User ID</th><th>Password</th><th>Role</th><th>Phone app</th><th></th></tr></thead><tbody>${L2.map(e=>`<tr><td class="stk"><b>${h(e.name)}</b><span>${h(e.designation||'')}</span></td><td><b class="bpid">${h(e.username)}</b></td><td>${pw(e)}</td><td>${h(e.role)}</td><td>${e.device_linked?'✅ Linked':'<span class="mut">Not linked</span>'}</td><td>${e.id&&typeof LIVE!=='undefined'&&LIVE&&e.login_mode!=='phone'?`<button class="lnk" data-a="bpReset" data-id="${e.id}">Reset to mobile</button>`:''}</td></tr>`).join('')||`<tr><td colspan="6">${empty(BPL.busy?'Loading logins…':BPL.err||'No logins yet','')}</td></tr>`}</tbody></table></div>
 <p class="xs mut" style="margin-top:8px">Passwords people set themselves are stored locked and can’t be shown. Use Reset to mobile: the password becomes their 10-digit mobile number.</p></details>`:''}`};
A.bpO=e=>{const k=e.dataset.k,was=!!(S.bpO||{h:1})[k];S.bpO={};S.bpO[k]=!was;render()};
A.coGo=e=>{S.v='co';S.co=e.dataset.k;render();scrollTo(0,0)};
A.bpL=()=>{S.bpL=!S.bpL};
const _rBP=render;render=function(){if(S.v==='blueprint'&&!(typeof LIVE!=='undefined'&&LIVE)&&BPL.list&&BPL.list.length!==(D.emp||[]).length)BPL.list=null;_rBP.apply(this,arguments)};
document.addEventListener('input',e=>{if(e.target.dataset&&e.target.dataset.ch==='bpQ'){S.bpQ=e.target.value;const p=e.target.selectionStart;render();const n=document.querySelector('[data-ch="bpQ"]');if(n){n.focus();try{n.setSelectionRange(p,p)}catch(x){}}}});
A.bpReset=e=>sheet(`<h2>Reset password?</h2><p class="sm">Their password becomes their 10-digit mobile number. They can change it later.</p><button class="btn w" data-a="bpResetGo" data-id="${e.dataset.id}">Reset to mobile number</button>`);
A.bpResetGo=async e=>{closeM();try{await lapi('PATCH','/api/admin/employees/'+e.dataset.id,{password_phone:true});toast('Password reset to mobile number');BPL.list=null;bpLoad()}catch(x){toast(x.message)}};

/* ---- Screen modes: Day / Night / Eye protection · fit · text size ---- */
const UIP={get:()=>{try{return Object.assign({theme:'day',fit:'full',size:'m'},JSON.parse(localStorage.getItem('jdac-ui')||'{}'))}catch(e){return {theme:'day',fit:'full',size:'m'}}},set:o=>{try{localStorage.setItem('jdac-ui',JSON.stringify(Object.assign(UIP.get(),o)))}catch(e){}uiApply()}};
function uiApply(){try{const u=UIP.get(),c=document.documentElement.classList;['th-day','th-night','th-eye','fit-centre','fs-s','fs-l'].forEach(x=>c.remove(x));c.add('th-'+u.theme);if(u.fit==='centre')c.add('fit-centre');}catch(e){}}
uiApply();
A.uiSet=e=>{const o={};o[e.dataset.k]=e.dataset.v;UIP.set(o);render()};

/* ---- Settings ---- */
const CONN=[['GitHub → Cloudflare','Live','https://github.com/jdaclogistics-web/JDACTracker','Tracker code and automatic updates'],['jdac.in API','Next','https://jdac.in','Bookings and rates from the JDAC website'],['Superfone → tracker','Live','#co:log:audit','Call recordings and call logs → Logistics · Call Audit'],['WhatsApp API + BotBee','Next','https://botbee.io','WhatsApp inbox in Communication'],['name@jdac.in mail','Next','#chat:email','Each person’s work mailbox in Communication'],['Razorpay','Next','https://dashboard.razorpay.com','Online payments'],['Meta ads & leads','Live','#camp','Campaign results → Campaigns'],['WordPress shops','Next','#co:gb','GovaaBazaar online shop orders'],['Google Drive','Next','https://drive.google.com','Company files'],['Tally import','Next','#money','Accounts'],['Bank statement import','Next','#money','Accounts']];
V.settings=()=>{const u=UIP.get(),opt=(k,v,l,d,ico)=>`<button class="uio ${u[k]===v?'on':''}" data-a="uiSet" data-k="${k}" data-v="${v}" aria-pressed="${u[k]===v}"><span class="uii">${ico}</span><b>${l}</b>${d?`<span>${d}</span>`:''}</button>`;
 const who=[['Darshan sir','Everything, incl. profit · final approvals','#0B1F3A'],['Nameera','Everything (same as Darshan sir) · approves leave & incentives · edits targets','#5B1530'],['Snehal Z','Accounts for all companies · pays approved incentives','#0F4C4C'],['Snehal B','HR hiring board','#33205E'],['CSEs','Leads, bookings, payments · Logistics only','#123A6B'],['Ops','Pickups, shipments, NDR/RTO','#0E4D3F'],['Atmaram','GovaaBazaar orders, stock, shops, expenses, cash','#6A3A10'],['Warehouse','Jupiter deliveries, equipment, renewals, expenses','#263445'],['Marketing','Content calendar & library','#6B4A0C'],['Partners','Sameer (Nashik orders), Nadeem & Jupiter (orders, renewals), Nayan (meetings)','#3A2D57'],['Customers','Shops, HR employers & job-seekers: own small login','#1F4A25']];
 const op=k=>(S.stO||{})[k]?'open':'';
 return `<div class="sthead"><h1>Settings</h1></div>
 <section class="stpanel"><div class="stph"><span class="bpsi">🖥</span><b>Screen</b></div>
 <div class="stgrp"><div class="stlab">Light</div><div class="uiopts">${opt('theme','day','Day','Bright, normal','☀️')}${opt('theme','night','Night','Dark screen','🌙')}${opt('theme','eye','Eye protection','Warm, softer light','🟠')}</div></div>
 <div class="stgrp"><div class="stlab">View</div><div class="uiopts">${opt('fit','full','Fit to screen','Uses the full width','⤢')}${opt('fit','centre','Centred','Narrow column in the middle','▥')}<button class="uio ${S.split?'on':''}" data-a="splitT" aria-pressed="${!!S.split}"><span class="uii">◫</span><b>Split screen</b><span>Two sections side by side</span></button></div></div></section>
 <details class="bpsec bpdd" ${op('w')}><summary class="bph" data-a="stO" data-k="w"><span class="bpsi">👥</span>Who sees what <span class="bpcount">${who.length}</span></summary><div class="stwho">${who.map(r=>`<div class="stw" style="--c1:${r[2]}"><b>${r[0]}</b><span>${r[1]}</span></div>`).join('')}</div></details>
 <details class="bpsec bpdd" ${op('c')}><summary class="bph" data-a="stO" data-k="c"><span class="bpsi">🔗</span>Connections <span class="bpcount">${CONN.filter(c=>c[1]==='Live').length} live</span></summary><div class="stconn">${CONN.map(c=>{const ext=/^https?:/.test(c[2]);return `<${ext?'a':'button'} class="stc" ${ext?`href="${c[2]}" target="_blank" rel="noopener"`:`data-a="connGo" data-to="${c[2].slice(1)}"`}><span class="stdot ${c[1]==='Live'?'on':''}"></span><span class="sttx"><b>${c[0]}</b><span>${c[3]}</span></span><span class="stst">${c[1]==='Live'?'Live':'Next'}</span><span class="stgo">Open ${ext?'↗':'→'}</span></${ext?'a':'button'}>`}).join('')}</div></details>`};
A.stO=e=>{const k=e.dataset.k,was=!!(S.stO||{})[k];S.stO={};S.stO[k]=!was;render()};
A.connGo=e=>{const [v,a,b]=e.dataset.to.split(':');if(v==='co'){S.v='co';S.co=a;if(b)S.tab=b}else if(v==='chat'){S.v='chat';S.chm=a}else S.v=v;render()};
/* ---- Communication: no page header, just the tabs; WhatsApp fills the screen ---- */
const _chHeadX9=chatHead;chatHead=function(){const o=_chHeadX9(),i=o.indexOf('<div class="ctabs">');const t=i>=0?o.slice(i):o;
 /* tabs → small floating dock (bottom-right); the page shows only the open panel */
 return t.replace('<div class="ctabs">','<div class="ctabs cdock" role="tablist" aria-label="Switch: WhatsApp, Email, Chat, Calls, Google Meet">')};
/* ---- JDAC Notetaker: no tab in the header; "Generate notes" inside Google Meet + in the meeting ---- */
const _chHeadX10=chatHead;chatHead=function(){return _chHeadX10().replace(/<button class="[^"]*" data-a="chm" data-t="notes">[\s\S]*?<\/button>/,'')};
function gmAuto(m){m.log=m.log||[];m.tr=m.tr||[];const have=new Set(m.log.map(x=>x.t));let d=0,a=0;
 m.tr.forEach(x=>{const t=String(x.t||'').trim();if(t.length<8||have.has(t))return;
  if(/\b(decide|decided|final|finalise|agreed|approve|approved|confirm|pakka|tay|fix kar)/i.test(t)){m.log.push({k:'dec',t,at:x.at,auto:1});have.add(t);d++}
  else if(/\b(will|kar(na|ni|o|enge|dena|denge)|send|call|follow ?up|by (today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|kal tak|aaj tak|deadline|assign|bhej)/i.test(t)){const who=Object.keys(P).find(k=>P[k].n&&new RegExp('\\b'+P[k].n.split(' ')[0].replace(/[^a-z]/gi,'')+'\\b','i').test(t))||S.me;m.log.push({k:'act',t,at:x.at,o:who,due:addD(TODAY,1),auto:1});have.add(t);a++}});
 m.gen=Date.now();return {d,a,n:m.tr.length}}
A.gmGen=()=>{const M=D.meet||[],m=gmActive()||(S.gmN&&M.find(x=>x.id===S.gmN))||M.filter(x=>x.st).sort((a,b)=>(b.st||0)-(a.st||0))[0];
 if(!m)return toast('Start or join a meeting first — the notetaker listens and writes notes');const r=gmAuto(m);save();S.v='chat';S.chm='notes';S.gmN=m.id;render();scrollTo(0,0);
 toast(r.n?`Notes ready · ${r.d} decisions, ${r.a} action points from ${r.n} lines`:'Notes ready · turn on the mic in the meeting to capture what is said')};
const _meetViewX=meetView;meetView=function(){const m=gmActive(),top=`<div class="card gmgen"><div style="flex:1"><b>📝 JDAC Notetaker</b><div class="xs mut">${m?`Meeting on: <b>${h(m.t)}</b> · ${(m.tr||[]).length} lines heard`:'Start or join a meeting below — the notetaker writes what is said.'}</div></div><button class="btn" data-a="gmGen">Generate notes</button><button class="btn sec" data-a="gmNotesAll">All notes</button></div>`;const b=_meetViewX();return b.includes('card gmgen')?b:top+b};
A.gmNotesAll=()=>{S.chm='notes';S.gmN=null;render()};
const shortP=t=>{t=String(t||'').replace(/\s+/g,' ').trim();return t.length>90?t.slice(0,87).replace(/\s\S*$/,'')+'…':t};
function gmPointsCard(m){const L=m.log||[],dec=L.filter(x=>x.k==='dec'),act=L.filter(x=>x.k==='act'),nt=L.filter(x=>x.k==='note'||!x.k).slice(0,4);
 const li=(a,f)=>a.length?a.slice(0,6).map(f).join(''):'<li class="mut">—</li>';
 return `<div class="card gmpts"><div class="row nw" style="margin-bottom:8px"><b style="flex:1">📋 Summary · short points</b><span class="xs mut">${h(m.t)} · ${fmt(m.dt||TODAY)}${m.dur?' · '+m.dur+' min':''}</span><button class="btn sm sec" data-a="gmCopySum">Copy</button></div>
 <div class="gmpg"><div><div class="gmph d">✔ Decisions</div><ul>${li(dec,x=>`<li>${h(shortP(x.t))}</li>`)}</ul></div><div><div class="gmph a">➜ Action points</div><ul>${li(act,x=>`<li>${h(shortP(x.t))}${x.o?` <em>· ${h(nmF(x.o))}${x.due?', '+fmt(x.due):''}</em>`:''}</li>`)}</ul></div>${nt.length?`<div><div class="gmph n">• Key notes</div><ul>${li(nt,x=>`<li>${h(shortP(x.t))}</li>`)}</ul></div>`:''}</div></div>`}
A.gmDel=e=>{const m=(D.meet||[]).find(x=>x.id===e.dataset.id);if(!m)return;sheet(`<h2>Delete this meeting?</h2><p class="sm"><b>${h(m.t)}</b> · ${fmt(m.dt||TODAY)} · ${(m.log||[]).length} notes, ${(m.tr||[]).length} transcript lines.</p><p class="xs mut">Tasks already created from it stay.</p><button class="btn w" style="background:var(--r);border-color:var(--r)" data-a="gmDelGo" data-id="${m.id}">Delete meeting</button>`)};
A.gmDelGo=e=>{D.meet=(D.meet||[]).filter(x=>x.id!==e.dataset.id);if(S.gmN===e.dataset.id)S.gmN=null;save();closeM();render();toast('Meeting deleted')};
const _noteViewX=noteView;noteView=function(){const m=gmM(),o=_noteViewX();if(!m)return o;const bar=`<div class="card gmgen"><div style="flex:1"><b>📝 Notes for ${h(m.t)}</b><div class="xs mut">${m.gen?'Generated '+new Date(m.gen).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})+' · ':''}${(m.tr||[]).length} lines heard · ${(m.log||[]).length} notes</div></div><button class="btn" data-a="gmGen">${m.gen?'Update notes':'Generate notes'}</button><button class="btn sec" data-a="gmNotesAll">All notes</button><button class="btn sec gmdel" data-a="gmDel" data-id="${m.id}">🗑 Delete</button></div>${(m.gen||m.end)?gmPointsCard(m):''}`;return bar+o.replace(/<div class="card" style="margin-top:12px"><b class="mh">Summary<\/b><pre class="ntpre">[\s\S]*?<\/pre>/,'<div class="card" style="margin-top:12px"><b class="mh">Share summary</b>')};

/* ---- Staff (e.g. Neetu): clean top bar — no Split view, Contacts or Live/Prototype label ---- */
const _rStaffX=render;render=function(){_rStaffX.apply(this,arguments);try{document.documentElement.classList.toggle('staffmode',!isAdm())}catch(e){}};
/* ---- Salary slip request: ready email template to HR Manager Nameera ---- */
const HRMAIL=()=>{const e=(D.emp||[]).find(x=>x.k==='nameera')||{};return e.email||e.mail||''};
function slipMail(mon){const e=(D.emp||[]).find(x=>x.k===S.me)||{},me=ME(),id=e.id||me.id||'',nm2=me.n||e.n||'';
 return {sub:`Salary slip request – ${nm2} (${id}) – ${mon}`,body:`Dear Nameera Ma'am,\n\nI request you to please share my salary slip for ${mon}.\n\nName: ${nm2}\nEmployee ID: ${id}\nDesignation: ${e.desig||me.r||''}\nDepartment: ${e.unit||''}\nPurpose: ${'{bank loan / personal record / visa / other}'}\n\nPlease send it to my email address.\n\nThank you,\n${nm2}`}}
A.slipReq=()=>{const ms=[0,1,2,3,4,5].map(i=>{const d=new Date(TODAY+'T12:00:00');d.setDate(1);d.setMonth(d.getMonth()-1-i);return d.toLocaleDateString('en-IN',{month:'long',year:'numeric'})});const t=slipMail(ms[0]);
 sheet(`<h2>Request salary slip</h2><label for="sr-m">Month</label><select id="sr-m" data-ch="slipM">${ms.map(m=>`<option>${m}</option>`).concat([`<option>Last 3 months</option>`,`<option>Last 6 months</option>`]).join('')}</select><label for="sr-to">To</label><input id="sr-to" value="${h(HRMAIL())}" placeholder="Nameera's email"><label for="sr-s">Subject</label><input id="sr-s" value="${h(t.sub)}"><label for="sr-b">Email</label><textarea id="sr-b" rows="12">${h(t.body)}</textarea><p class="xs mut">Change the purpose line, then send.</p><div class="row" style="gap:8px;margin-top:10px"><button class="btn" style="flex:1" data-a="slipSend">Email HR Manager Nameera</button><button class="btn sec" data-a="slipCopy">Copy</button></div>`)};
document.addEventListener('change',e=>{if(e.target.dataset&&e.target.dataset.ch==='slipM'){const t=slipMail(e.target.value);const s1=document.getElementById('sr-s'),b1=document.getElementById('sr-b');if(s1)s1.value=t.sub;if(b1)b1.value=t.body}});
A.slipSend=()=>{const to=val('sr-to'),sub=val('sr-s'),body=val('sr-b');try{D.msgs=D.msgs||[];const g=(D.groups||[]).find(x=>x.m&&x.m.includes('nameera')&&x.m.includes(S.me)&&x.m.length===2);if(g)D.msgs.push({id:nid('m'),g:g.id,f:S.me,t:'🧾 '+sub,at:nowT()});save()}catch(x){}
 const a=document.createElement('a');a.href='mailto:'+encodeURIComponent(to)+'?subject='+encodeURIComponent(sub)+'&body='+encodeURIComponent(body);document.body.appendChild(a);a.click();a.remove();closeM();toast('Opening your email · send it to HR Manager Nameera')};
A.slipCopy=()=>{try{navigator.clipboard.writeText('To: '+val('sr-to')+'\nSubject: '+val('sr-s')+'\n\n'+val('sr-b'));toast('Copied')}catch(x){toast('Copy not available here')}};
/* ---- Contacts: team members' details only for Darshan sir & Nameera; staff see their customers, carriers, partners ---- */
const seesTeam=()=>isBoss()||S.me==='nameera'||(typeof LV!=='undefined'&&LV.me&&['boss','developer'].includes(LV.me.role))||(typeof LV!=='undefined'&&LV.me&&/nameera/i.test(LV.me.name||''));
const myTypes=()=>{const e=(D.emp||[]).find(x=>x.k===S.me)||{},r=[(P[S.me]||{}).r,e.desig,e.unit,K()].join(' ').toLowerCase();
 if(/account|finance|acc\b/.test(r))return ['Customer','Carrier','Vendor','Supplier','Partner','Shop'];
 if(/customer success|cse|sales|telecall/.test(r))return ['Customer','Shop','Partner'];
 if(/operation|logistics coordinator|ops|pickup|delivery|driver/.test(r))return ['Carrier','Vendor','Customer','Partner'];
 if(/warehouse|godown|store|goa team/.test(r))return ['Supplier','Shop','Carrier','Vendor'];
 if(/hr|hiring|recruit/.test(r))return ['Employer','Job seeker'];
 if(/social|marketing|content|design|studio/.test(r))return ['Partner','Vendor'];
 return ['Customer','Partner']};
const _myCX=myContacts;myContacts=function(){const L=_myCX();if(seesTeam())return L;const T=myTypes();return L.filter(c=>c.type!=='Team'&&T.includes(c.type))};
A.lateInfo=e=>sheet(`<h2>⚠ ${h(e.dataset.t)}</h2><p>${h(e.dataset.d)}</p><button class="btn w" data-a="closeM">OK</button>`);
/* ---- Dashboard greeting: top-right, elegant ---- */
const SLOGANS=['Small wins every day build big companies.','Own the outcome, not just the task.','Quality is doing it right when no one is watching.','Every call is a chance to earn a customer for life.','Plan the day, then work the plan.','Progress beats perfection — ship it, then improve it.','Clients remember how you made them feel.','Discipline today, freedom tomorrow.','One team, one target, one direction.','Speed matters, but trust matters more.','Do the hard thing first.','Great service is our best advertisement.','Results speak louder than reasons.','Be the reason someone’s day went smoothly.','Learn something new, teach someone today.','Follow up — fortune lives in the follow-up.','Excellence is a habit, not an act.','Solve problems, don’t just report them.','Today’s effort is tomorrow’s growth.','Commit fully, deliver fully.','Respect time — yours, the team’s, the customer’s.','A promise made is a delivery owed.','Focus on what you can control.','Every shipment carries our name — handle it with pride.','Ask, listen, act.','Consistency builds credibility.','Work smart, stay humble, keep moving.','Turn every no into next time.','Clarity first, then speed.','Leaders take responsibility, not credit.','Finish strong — the last mile counts most.'];
const dayIdx=()=>{const d=new Date(TODAY+'T12:00:00'),s0=new Date(d.getFullYear(),0,0);return Math.floor((d-s0)/864e5)};
const _homeGX=V.home;V.home=()=>{const o=_homeGX(),sl=SLOGANS[dayIdx()%SLOGANS.length],d=new Date(TODAY+'T12:00:00');
 const dt=`<span class="gday">${d.toLocaleDateString('en-IN',{weekday:'long'})}</span><span class="gdate">${d.getDate()} ${d.toLocaleDateString('en-IN',{month:'long'})} ${d.getFullYear()}</span>`;
 return o.replace(/<div class="greet"><h1>[^<]*<\/h1><p>[\s\S]*?<\/p><\/div>/,`<div class="greet greetR"><div class="gdt">${dt}</div><h1>“${h(sl)}”</h1></div>`)};
/* ---- Tasks: no visible scrollbars ---- */
const _rTasksX=render;render=function(){_rTasksX.apply(this,arguments);try{document.documentElement.classList.toggle('v-tasks',S.v==='tasks')}catch(e){}};
/* ---- Tasks → Meetings: no second "Tasks" heading, no dead List/Board/Calendar buttons ---- */
const _vtMeetX=V.tasks;V.tasks=()=>{let o=_vtMeetX();if(S.ttab==='meet'){o=o.replace(/<div class="row nw" style="margin-bottom:14px"><div style="flex:1"><h1>Tasks<\/h1>[\s\S]*?<\/div>(<[^>]*>)?<\/div>/,'').replace(/<div class="chips" role="tablist">(?:<button[^>]*data-a="tv"[\s\S]*?<\/button>)+<\/div>/,'')}
 if(S.ttab==='time')o=o.replace(/<div class="tppl">[\s\S]*?<\/div><\/div><\/div>/,'');return o};

/* ---- Tasks → Timeline v3: date bar, Day list, Project / Person filters, edit dates ---- */
const TLV={d:1,'1w':7,'2w':14,m:31};
const tlFrom=()=>{const v=S.tlv||'2w';if(v==='d')return S.tld||TODAY;return S.tls||wkStart(TODAY)};
taskGantt=function(){S.tlv=S.tlv||'2w';const v=S.tlv,pj=S.tlp||'all',pe=S.tlo||'all';
 const all=myTasks(),T=all.filter(t=>(pj==='all'||t.proj===pj)&&(pe==='all'||t.o===pe));
 const people=[...new Set(all.filter(t=>pj==='all'||t.proj===pj).map(t=>t.o))].filter(Boolean).sort((a,b)=>nmF(a).localeCompare(nmF(b)));
 const projs=D.projects.filter(p=>all.some(t=>t.proj===p.id));
 const s=tlFrom(),N=TLV[v],days=Array.from({length:N},(_,i)=>addD(s,i)),e=days[N-1];
 const lab=v==='d'?(s===TODAY?'Today':s===addD(TODAY,1)?'Tomorrow':s===addD(TODAY,-1)?'Yesterday':'')+' · '+new Date(s+'T12:00:00').toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'}):`${fmt(s)} – ${fmtY(e)}`;
 const tools=`<div class="tl-bar"><div class="tl-nav"><button data-a="tlNav" data-n="-1" aria-label="Earlier">‹</button><button class="${v==='d'&&s===TODAY?'on':''}" data-a="tlGo" data-d="0">Today</button><button class="${v==='d'&&s===addD(TODAY,1)?'on':''}" data-a="tlGo" data-d="1">Tomorrow</button><button data-a="tlWeek">This week</button><button data-a="tlNav" data-n="1" aria-label="Later">›</button><label class="tl-pick">📅<input type="date" value="${s}" data-ch="tlPick" aria-label="Go to date"></label></div>
 <b class="tl-rng">${lab}</b><span class="tsp"></span>
 <div class="vsw">${[['d','Day'],['1w','1 week'],['2w','2 weeks'],['m','Month']].map(([k,n])=>`<button class="${v===k?'on':''}" data-a="tlV" data-t="${k}">${n}</button>`).join('')}</div></div>
 <div class="tl-flt"><label>Project<select data-ch="tlP"><option value="all">All projects</option>${projs.map(p=>`<option value="${p.id}" ${pj===p.id?'selected':''}>${h(p.n)}</option>`).join('')}</select></label><label>Person<select data-ch="tlO"><option value="all">Everyone (${people.length})</option>${people.map(k=>`<option value="${k}" ${pe===k?'selected':''}>${h(nmF(k))}</option>`).join('')}</select></label>
 <span class="tl-leg">${KCOL.map(c=>`<span><i style="background:${c[2]}"></i>${c[1]}</span>`).join('')}<span><i class="lt"></i>Late</span></span></div>`;
 const pill=t=>{const c=KCOL.find(x=>x[0]===colOf(t));return `<span class="tl-st" style="--bc:${c[2]}">${c[1]}</span>`};
 const edit=t=>canMove(t)?`<button class="tl-ed" data-a="tlEd" data-id="${t.id}" aria-label="Change dates of ${h(t.t)}">📅</button>`:'';
 if(v==='d'){const L=T.filter(t=>t.st!=='Done'&&tStart(t)<=s&&t.due>=s),late=s===TODAY?T.filter(tLate):[],done=T.filter(t=>t.st==='Done'&&t.due===s);
  const grp={};L.forEach(t=>(grp[t.o]=grp[t.o]||[]).push(t));
  const row=t=>`<div class="tl-li ${tLate(t)?'late':''}"><i class="tl-pc" style="background:${projCol(t.proj)}"></i><button class="tl-nm" data-a="tOpen" data-id="${t.id}"><b>${h(t.t)}</b><span>${h(projN(t.proj)||'No project')} · ${tStart(t)===t.due?'due '+fmt(t.due):fmt(tStart(t))+' → '+fmt(t.due)}${t.pri==='High'?' · <em class="r">High</em>':''}</span></button>${pill(t)}${edit(t)}</div>`;
  return tools+`<div class="tl-day">${late.length?`<div class="tl-sec r"><b>Late (${late.length})</b></div>${late.map(row).join('')}`:''}
  ${Object.keys(grp).sort((a,b)=>nmF(a).localeCompare(nmF(b))).map(k=>`<div class="tl-sec">${av(nm(k),'s')}<b>${h(nmF(k))}</b><span class="xs mut">${grp[k].length} task${grp[k].length>1?'s':''}</span></div>${grp[k].map(row).join('')}`).join('')||empty('Nothing planned for this day','Pick another day or person')}
  ${done.length?`<div class="tl-sec g"><b>Completed (${done.length})</b></div>${done.map(row).join('')}`:''}</div>`}
 const col=d=>dDiff(s,d);
 const groups=(pj==='all'?D.projects.filter(p=>T.some(t=>t.proj===p.id)):D.projects.filter(p=>p.id===pj)).concat(T.some(t=>!D.projects.find(p=>p.id===t.proj))?[{id:'_none',n:'No project'}]:[]);
 const inG=(t,g)=>g.id==='_none'?!D.projects.find(p=>p.id===t.proj):t.proj===g.id;
 const grid=inner=>`<div class="gx-g" style="--n:${N}">${days.map((d,i)=>{const w=new Date(d+'T12:00:00').getDay();return `<i class="gx-c ${w===0?'sun':''} ${d===TODAY?'now':''}" style="grid-column:${i+1}"></i>`}).join('')}${inner}</div>`;
 const bar=t=>{const a=col(tStart(t)),b=col(t.due);if(b<0||a>N-1)return '';const c=KCOL.find(x=>x[0]===colOf(t)),mv=canMove(t);
  return `<div class="gx-b ${mv?'mv':''} ${tLate(t)?'late':''}" data-gid="${t.id}" data-a0="${a}" data-b0="${b}" style="grid-column:${Math.max(0,a)+1}/${Math.min(N-1,b)+2};--bc:${c[2]}" title="${h(t.t)} · ${fmt(tStart(t))} → ${fmt(t.due)}">${mv&&a>=0?'<span class="gx-h l"></span>':''}<span class="gx-bt">${a===b?fmt(t.due):fmt(tStart(t))+' – '+fmt(t.due)}</span>${mv&&b<=N-1?'<span class="gx-h r"></span>':''}</div>`};
 let body='';
 groups.forEach(g=>{const GT=T.filter(t=>inG(t,g)&&col(t.due)>=0&&col(tStart(t))<=N-1).sort((a,b)=>tStart(a).localeCompare(tStart(b)));if(!GT.length)return;
  body+=`<div class="gx-r tl-grp"><div class="gx-l"><i style="background:${projCol(g.id)}"></i><b>${h(g.n)}</b><span class="gx-cnt">${GT.filter(t=>t.st!=='Done').length} open</span></div>${grid('')}</div>`;
  GT.forEach(t=>{body+=`<div class="gx-r gx-task"><div class="gx-l tl-tl">${av(nm(t.o),'s')}<button class="tl-nm" data-a="tOpen" data-id="${t.id}"><b>${h(t.t)}</b><span>${h(nmF(t.o))}${tLate(t)?' · <em class="r">late</em>':tActive(t)?' · <em class="g">on today</em>':''}</span></button>${edit(t)}</div>${grid(bar(t))}</div>`})});
 S.gs=s;
 const hd=`<div class="gx-r gx-hd"><div class="gx-l">Task · owner</div><div class="gx-g" style="--n:${N}">${days.map((d,i)=>{const x=new Date(d+'T12:00:00'),wd=x.getDay();return `<div class="gx-d ${d===TODAY?'now':''} ${wd===0?'sun':''}" style="grid-column:${i+1}">${N<=14?`<small>${x.toLocaleDateString('en-IN',{weekday:'short'})}</small>`:''}${(wd===1||i===0||N<=14)?`<b>${x.getDate()}${wd===1||i===0?' '+x.toLocaleDateString('en-IN',{month:'short'}):''}</b>`:x.getDate()}</div>`}).join('')}</div></div>`;
 return tools+`<div class="gx tlx" style="--n:${N};--cw:${N<=7?110:N<=14?60:30}px"><div class="gx-in">${hd}${body||`<div class="tl-empty">${empty('No tasks in these dates','Change the dates, project or person')}</div>`}</div></div>
 <div class="xs mut" style="margin-top:8px">📅 changes a task's start and due date · you can also drag a bar, or drag its edges · tap a task to open it.</div>`};
A.tlV=e=>{S.tlv=e.dataset.t;if(S.tlv==='d')S.tld=S.tld||TODAY;else S.tls=S.tlv==='m'?TODAY.slice(0,8)+'01':wkStart(S.tld||TODAY);render()};
A.tlGo=e=>{S.tlv='d';S.tld=addD(TODAY,+e.dataset.d);render()};
A.tlWeek=()=>{S.tlv='1w';S.tls=wkStart(TODAY);render()};
A.tlNav=e=>{const n=+e.dataset.n,v=S.tlv||'2w';if(v==='d')S.tld=addD(S.tld||TODAY,n);else S.tls=addD(tlFrom(),n*(v==='m'?28:7));render()};
document.addEventListener('change',e=>{const k=e.target.dataset&&e.target.dataset.ch;if(k==='tlPick'&&e.target.value){if((S.tlv||'2w')==='d')S.tld=e.target.value;else S.tls=(S.tlv==='m'?e.target.value:wkStart(e.target.value));render()}if(k==='tlP'){S.tlp=e.target.value;S.tlo='all';render()}if(k==='tlO'){S.tlo=e.target.value;render()}});
A.tlEd=e=>{const t=D.tasks.find(x=>x.id===e.dataset.id);if(!t)return;const q=(l,a,b)=>`<button class="btn sm sec" data-a="tlQ" data-s="${a}" data-u="${b}">${l}</button>`;
 sheet(`<h2>Change dates</h2><p class="sm"><b>${h(t.t)}</b> · ${h(nmF(t.o))}</p><div class="row" style="gap:8px"><div style="flex:1"><label for="tl-s">Start</label><input id="tl-s" type="date" value="${tStart(t)}"></div><div style="flex:1"><label for="tl-u">Due</label><input id="tl-u" type="date" value="${t.due}"></div></div>
 <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px">${q('Today',TODAY,TODAY)}${q('Tomorrow',addD(TODAY,1),addD(TODAY,1))}${q('This week',TODAY,addD(wkStart(TODAY),5))}${q('Next week',addD(wkStart(TODAY),7),addD(wkStart(TODAY),12))}${q('+1 week',addD(tStart(t),7),addD(t.due,7))}</div>
 <button class="btn w" style="margin-top:12px" data-a="tlSave" data-id="${t.id}">Save dates</button>`)};
A.tlQ=e=>{const a=document.getElementById('tl-s'),b=document.getElementById('tl-u');if(a)a.value=e.dataset.s;if(b)b.value=e.dataset.u};
A.tlSave=e=>{const t=D.tasks.find(x=>x.id===e.dataset.id);if(!t)return;let s1=val('tl-s'),u1=val('tl-u');if(!s1||!u1)return toast('Pick both dates');if(u1<s1)[s1,u1]=[u1,s1];const s0=tStart(t),u0=t.due;t.start=s1;t.due=u1;(t.log=t.log||[]).push({by:S.me,at:TODAY,x:`Dates changed ${fmt(s0)}–${fmt(u0)} → ${fmt(s1)}–${fmt(u1)}`});save();closeM();render();toast('Dates saved · '+(s1===u1?fmt(u1):fmt(s1)+' → '+fmt(u1)))};

render();

A.tdO=e=>{const k=e.dataset.k;S.tdO=S.tdO||{};S.tdO[k]=!S.tdO[k];render()};
// HR Desk: 3 grouped tabs, Rules removed
const HRG=[['ga','Attendance & Leave',['today','att','leave','hol']],['ge','Employee Master',['master','org']],['gp','Payroll & Rewards',['pay','inc','appr']]];
const _peopleHG=V.people;V.people=()=>{if(S.ptab==='rules')S.ptab='today';let out=_peopleHG();if(['onb','exit'].includes(S.ptab))return out;
 const m=out.match(/<div class="chips" role="tablist">((?:(?!<\/div>)[\s\S])*?data-a="ptab"[\s\S]*?)<\/div>/);if(!m)return out;
 const B={};(m[1].match(/<button role="tab"[\s\S]*?<\/button>/g)||[]).forEach(b=>{const k=(b.match(/data-t="([^"]+)"/)||[])[1];if(k)B[k]=b});
 const g=HRG.find(x=>x[2].includes(S.ptab))||HRG[0],cnt=G=>G[2].reduce((a,k)=>a+(+((B[k]||'').match(/<span class="n">(\d+)/)||[0,0])[1]),0);
 const SN=S.hrSeen=S.hrSeen||{},sc=k=>+((B[k]||'').match(/<span class="n">(\d+)/)||[0,0])[1];SN[g[0]]=Math.max(SN[g[0]]||0,cnt(g));SN[S.ptab]=Math.max(SN[S.ptab]||0,sc(S.ptab));
 const dot='<i class="rdot" aria-label="Needs attention"></i>';
 const top=`<div class="hrg" role="tablist">${HRG.map(G=>{const n=cnt(G);return `<button role="tab" aria-selected="${G===g}" class="${G===g?'on':''}" data-a="hrG" data-t="${G[0]}">${G[1]}${n>(SN[G[0]]||0)?dot:''}</button>`}).join('')}</div>`;
 const sub=`<div class="chips hrsub" role="tablist">${g[2].filter(k=>B[k]).map(k=>B[k].replace(/class="[^"]*"/,`class="${S.ptab===k?'on':''}"`).replace(/aria-selected="[^"]*"/,`aria-selected="${S.ptab===k}"`).replace(/\s*<span class="n">\d+<\/span>/,sc(k)>(SN[k]||0)?dot:'')).join('')}</div>`;saveS&&saveS();
 return out.replace(m[0],top+sub)};
A.hrG=e=>{const G=HRG.find(x=>x[0]===e.dataset.t);S.ptab=G[2][0];render()};

// Training: share a lesson on WhatsApp
const TRPUB='https://jdaclogistics-web.github.io/JDACTracker/training/';
function trPeople(){const L=[];(D.joiners||[]).forEach(j=>{if(j.mob)L.push([j.n,j.mob,'New joiner'])});(D.emp||[]).filter(e=>e.st!=='Exited'&&e.ph).forEach(e=>L.push([e.n,e.ph,e.desig||'']));const seen={};return L.filter(x=>{const k=telOf(x[1]).slice(-10);if(k.length<10||seen[k])return false;return seen[k]=1})}
function trMsg(f,n){const u=TRPUB+(f.id==='b7'?'boss-exam.html':'day'+f.day+'.html');return `Hi ${n||''}, welcome to JDAC 👋\n\nHere is your CSE induction — ${f.name}.\nOpen it, read it fully and complete the test at the end:\n${u}\n\n— HR, JDAC Sales`}
A.trShare=e=>{const f=TRB.find(x=>x.id===e.dataset.id);if(!f)return;S.trSh=f.id;const P=trPeople();
 sheet(`<h2>Share on WhatsApp</h2><p class="sm mut">${h(f.name)}</p><label class="fl" for="trsP">Candidate</label><select id="trsP" data-ch="trsPick"><option value="">— Type a number below —</option>${P.map((x,i)=>`<option value="${i}">${h(x[0])} · ${h(telOf(x[1]).slice(-10))}${x[2]?' · '+h(x[2]):''}</option>`).join('')}</select>
 <label class="fl" for="trsN">WhatsApp number</label><input id="trsN" inputmode="tel" placeholder="10-digit mobile number"><label class="fl" for="trsM">Message</label><textarea id="trsM" rows="7">${h(trMsg(f,''))}</textarea>
 <button class="btn w trwa" data-a="trSend" style="margin-top:10px">Open WhatsApp & send</button>`);window.__trP=P};
document.addEventListener('change',ev=>{const t=ev.target;if(!t||t.dataset.ch!=='trsPick')return;const x=(window.__trP||[])[+t.value],f=TRB.find(y=>y.id===S.trSh);if(!x||!f)return;const n=document.getElementById('trsN'),m=document.getElementById('trsM');if(n)n.value=telOf(x[1]).slice(-10);if(m)m.value=trMsg(f,String(x[0]).split(' ')[0])});
A.trSend=()=>{let n=telOf(val('trsN')).replace(/^\+/,'');if(n.length===10)n='91'+n;if(n.length<12)return toast('Enter a valid WhatsApp number');const m=val('trsM');window.open('https://wa.me/'+n+'?text='+encodeURIComponent(m),'_blank');closeM();toast('WhatsApp opened — press Send')};
// Darshan: no "Me" in More
const _moreNoMe=V.more;V.more=()=>{let o=_moreNoMe();if(isBoss())o=o.replace(/<button[^>]*data-v="me"[\s\S]*?<\/button>/g,'').replace(/<a[^>]*data-v="me"[\s\S]*?<\/a>/g,'');return o};
// Settings: Mobile / Desktop view
const IN_FRAME=/[?&]frame=1/.test(location.search);
function devApply(){try{const d=UIP.get().dev||'auto',vp=document.querySelector('meta[name=viewport]');if(vp&&!IN_FRAME)vp.setAttribute('content',d==='desktop'?'width=1280':'width=device-width, initial-scale=1');const ov=document.getElementById('devfr');if(ov)ov.remove();if(d==='mobile'&&!IN_FRAME&&window.innerWidth>700){const u=location.href.replace(/#.*$/,'').replace(/[?&](frame|as)=[^&]*/g,''),as=devAs(),w=document.createElement('div');w.id='devfr';
 const opts=devStaff().map(k=>`<option value="${k}" ${k===as?'selected':''}>${h(P[k].n||k)}${P[k].r?' · '+h(P[k].r):''}</option>`).join('');
 w.innerHTML=`<div class="devbar"><b>📱 Employee view</b><label class="xs" style="color:#cbd5e1">See it as <select id="devAs" data-ch="devAs" style="width:auto;margin:0 0 0 6px">${opts}</select></label><button class="btn sm sec" data-a="devSet" data-t="desktop">🖥 Back to desktop view</button></div><div class="devphone"><iframe title="Employee mobile view" src="${u}${u.includes('?')?'&':'?'}frame=1&as=${encodeURIComponent(as)}"></iframe></div>`;document.body.appendChild(w)}}catch(e){}}
A.devSet=e=>{UIP.set({dev:e.dataset.t});devApply();render()};
setTimeout(devApply,50);
const _stDev=V.settings;V.settings=()=>{let o=_stDev();const d=UIP.get().dev||'auto',b=(k,t,s,i)=>`<button class="uio ${d===k?'on':''}" data-a="devSet" data-t="${k}" aria-pressed="${d===k}"><span class="uii">${i}</span><b>${t}</b><span>${s}</span></button>`;
 const grp=`<div class="stgrp"><div class="stlab">Screen</div><div class="uiopts">${b('auto','Automatic','Fits this device','✦')}${b('mobile','Mobile view','Phone-size screen','📱')}${b('desktop','Desktop view','Full computer layout','🖥')}</div></div>`;
 return o.replace('<div class="stgrp"><div class="stlab">View</div>',grp+'<div class="stgrp"><div class="stlab">View</div>')};
// Settings: every group as a dropdown
const _stDD=V.settings;V.settings=()=>{let o=_stDD();const IC={Screen:'📱',Light:'💡',View:'🪟','Text size':'🔠'};
 o=o.replace(/<section class="stpanel"><div class="stph">[\s\S]*?<\/div>/,'').replace('</section>','');
 o=o.replace(/<div class="stgrp"><div class="stlab">([^<]+)<\/div><div class="uiopts">([\s\S]*?)<\/div><\/div>(?=\s*(<div class="stgrp">|<details|$))/g,(m,lab,body)=>{const k='u'+lab.replace(/\W/g,''),cur=(body.match(/class="uio on"[^>]*>[\s\S]*?<b>([^<]*)<\/b>/)||[])[1]||'';
  return `<details class="bpsec bpdd" ${(S.stO||{})[k]?'open':''}><summary class="bph" data-a="stO" data-k="${k}"><span class="bpsi">${IC[lab]||'⚙'}</span>${lab}${cur?` <span class="bpcount">${h(cur)}</span>`:''}</summary><div class="uiopts" style="padding:12px 14px">${body}</div></details>`});
 return o};

function devStaff(){return Object.keys(P).filter(k=>!['darshan','nameera','developer'].includes(k)&&!/^h[cp]_/.test(k)&&P[k]&&P[k].n)}
function devAs(){const a=UIP.get().devAs,L=devStaff();return L.includes(a)?a:(L.includes('neetu')?'neetu':L[0])}
document.addEventListener('change',ev=>{const t=ev.target;if(t&&t.dataset&&t.dataset.ch==='devAs'){UIP.set({devAs:t.value});devApply()}});
if(IN_FRAME){try{saveS=function(){};const as=(location.search.match(/[?&]as=([^&]+)/)||[])[1];const k=as&&decodeURIComponent(as);if(k&&P[k]){setTimeout(()=>{S.viewer=null;S.split=false;A.whoSet({dataset:{k}})},80)}document.documentElement.classList.add('in-frame')}catch(e){}}
// Navigation: red attention dot instead of numbers; clears once the section is opened
const _badgesX=badges;badges=function(){const b=_badgesX()||{},SN=S.navSeen=S.navSeen||{},o={};Object.keys(b).forEach(k=>{const n=+b[k]||0;if(S.v===k)SN[k]=Math.max(SN[k]||0,n);if(n>(SN[k]||0))o[k]=1});Object.keys(SN).forEach(k=>{if((+b[k]||0)<SN[k])SN[k]=+b[k]||0});return o};
/* ---- Tasks → Timeline v4: clean, professional, one screen ---- */
const TL4={d:['Day',1],w:['Week',7],'2w':['2 weeks',14],m:['Month',35]};
function tl4Range(){const v=S.tl4||'w',a=S.tl4d||TODAY;if(v==='d')return [a,a];if(v==='m'){const s=wkStart(a);return [s,addD(s,34)]}const s=wkStart(a);return [s,addD(s,TL4[v][1]-1)]}
function tl4(){const v=S.tl4||'w',pj=S.tlp||'all',pe=S.tlo||'all',[s,e]=tl4Range(),N=dDiff(s,e)+1,days=Array.from({length:N},(_,i)=>addD(s,i));
 const all=myTasks(),T=all.filter(t=>(pj==='all'||t.proj===pj)&&(pe==='all'||t.o===pe));
 const inR=t=>t.due>=s&&tStart(t)<=e,R=T.filter(inR);
 const people=[...new Set(all.filter(t=>pj==='all'||t.proj===pj).map(t=>t.o))].filter(Boolean).sort((a,b)=>nmF(a).localeCompare(nmF(b)));
 const projs=D.projects.filter(p=>all.some(t=>t.proj===p.id));
 const late=T.filter(tLate),dueT=T.filter(t=>t.st!=='Done'&&t.due===TODAY),prog=R.filter(t=>t.st!=='Done'&&!tLate(t)&&t.due!==TODAY),dn=R.filter(t=>t.st==='Done');
 const lab=v==='d'?(s===TODAY?'Today, ':s===addD(TODAY,1)?'Tomorrow, ':s===addD(TODAY,-1)?'Yesterday, ':'')+new Date(s+'T12:00:00').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'}):`${fmt(s)} – ${fmtY(e)}`;
 const bar=`<div class="t4bar"><div class="t4seg">${Object.entries(TL4).map(([k,x])=>`<button class="${v===k?'on':''}" data-a="t4V" data-t="${k}">${x[0]}</button>`).join('')}</div>
  <div class="t4nav"><button data-a="t4N" data-n="-1" aria-label="Previous">‹</button><b>${lab}</b><button data-a="t4N" data-n="1" aria-label="Next">›</button></div>
  <button class="t4today ${s<=TODAY&&e>=TODAY?'on':''}" data-a="t4T">Today</button><button class="t4today" data-a="t4Tm">Tomorrow</button><input type="date" class="t4pick" data-ch="t4Pick" value="${s}" aria-label="Go to date">
  <span class="tsp"></span><select class="t4sel" data-ch="tlP" aria-label="Project"><option value="all">All projects</option>${projs.map(p=>`<option value="${p.id}" ${pj===p.id?'selected':''}>${h(p.n)}</option>`).join('')}</select>
  <select class="t4sel" data-ch="tlO" aria-label="Person"><option value="all">Everyone</option>${people.map(k=>`<option value="${k}" ${pe===k?'selected':''}>${h(nmF(k))}</option>`).join('')}</select></div>`;
 const kpi=`<div class="t4kpi"><div class="r"><b>${late.length}</b><span>Overdue</span></div><div class="o"><b>${dueT.length}</b><span>Due today</span></div><div class="b"><b>${prog.length}</b><span>Ongoing</span></div><div class="g"><b>${dn.length}</b><span>Done in this period</span></div></div>`;
 const stc=t=>tLate(t)?['Overdue','#DC2626']:(()=>{const c=KCOL.find(x=>x[0]===colOf(t));return [c[1],c[2]]})();
 const chip=t=>{const c=stc(t);return `<span class="t4st" style="--c:${c[1]}">${c[0]}</span>`};
 if(v==='d'){const col=(t,L,cls)=>`<div class="t4col ${cls}"><div class="t4ch"><b>${t}</b><span>${L.length}</span></div>${L.map(x=>`<div class="t4card" style="--pc:${projCol(x.proj)}"><button class="t4ct" data-a="tOpen" data-id="${x.id}">${h(x.t)}</button><div class="t4cm">${av(nm(x.o),'s')}<span>${h(nmF(x.o))}</span><span class="tsp"></span><span class="xs mut">${h(projN(x.proj)||'')}</span></div><div class="t4cm"><span class="xs mut">${tStart(x)===x.due?'Due '+fmt(x.due):fmt(tStart(x))+' → '+fmt(x.due)}</span><span class="tsp"></span>${canMove(x)?`<button class="lnk xs" data-a="tlEd" data-id="${x.id}">Change date</button>`:''}</div></div>`).join('')||'<div class="t4none">Nothing here</div>'}</div>`;
  const open=T.filter(t=>t.st!=='Done'&&tStart(t)<=s&&t.due>=s&&!tLate(t));
  return bar+kpi+`<div class="t4board">${s===TODAY?col('Overdue',late,'r'):''}${col(s===TODAY?'Due today':'Due this day',open.filter(t=>t.due===s),'o')}${col('Ongoing',open.filter(t=>t.due>s),'b')}${col('Completed',T.filter(t=>t.st==='Done'&&t.due===s),'g')}</div>`}
 const groups=(pj==='all'?D.projects.filter(p=>R.some(t=>t.proj===p.id)):D.projects.filter(p=>p.id===pj)).concat(R.some(t=>!D.projects.find(p=>p.id===t.proj))?[{id:'_none',n:'No project'}]:[]);
 const inG=(t,g)=>g.id==='_none'?!D.projects.find(p=>p.id===t.proj):t.proj===g.id;
 const ti=dDiff(s,TODAY),now=ti>=0&&ti<N?`<i class="t4now" style="left:${(ti+.5)/N*100}%"></i>`:'';
 const bg=`<div class="t4bg">${days.map(d=>{const w=new Date(d+'T12:00:00').getDay();return `<i class="${w===0?'sun':''} ${d===TODAY?'td':''}"></i>`}).join('')}</div>`;
 const head=`<div class="t4row t4hd"><div class="t4l">Task</div><div class="t4tr"><div class="t4days" style="--n:${N}">${days.map(d=>{const x=new Date(d+'T12:00:00');return `<div class="${d===TODAY?'td':''} ${x.getDay()===0?'sun':''}">${N<=14?`<small>${x.toLocaleDateString('en-IN',{weekday:'short'})}</small>`:''}<b>${x.getDate()}</b></div>`}).join('')}</div></div></div>`;
 let body='';groups.forEach(g=>{const GT=R.filter(t=>inG(t,g)).sort((a,b)=>tStart(a).localeCompare(tStart(b))||a.due.localeCompare(b.due));if(!GT.length)return;
  const shut=!!(S.tl4c||{})[g.id];
  body+=`<div class="t4row t4g" style="--pc:${projCol(g.id)}"><button class="t4l t4gh" data-a="t4C" data-k="${g.id}" aria-expanded="${!shut}"><span class="t4cv">${shut?'▸':'▾'}</span><b>${h(g.n)}</b><span>${GT.length} task${GT.length>1?'s':''}</span></button><div class="t4tr">${bg}</div></div>`;
  if(shut)return;
  GT.forEach(t=>{const a=Math.max(0,dDiff(s,tStart(t))),b=Math.min(N-1,dDiff(s,t.due)),c=stc(t),cut0=dDiff(s,tStart(t))<0,cut1=dDiff(s,t.due)>N-1;
   body+=`<div class="t4row t4t" style="--pc:${projCol(t.proj)}"><div class="t4l"><span class="t4pt">•</span>${av(nm(t.o),'s')}<button class="t4nm" data-a="tOpen" data-id="${t.id}" title="${h(t.t)}"><b>${h(t.t)}</b><span>${h(nmF(t.o))} · ${tStart(t)===t.due?fmt(t.due):fmt(tStart(t))+' – '+fmt(t.due)}</span></button>${chip(t)}</div>
   <div class="t4tr">${bg}${now}<div class="t4b ${canMove(t)?'mv':''} ${cut0?'c0':''} ${cut1?'c1':''}" role="button" tabindex="0" style="left:${a/N*100}%;width:${(b-a+1)/N*100}%;--c:${c[1]}" data-gid="${t.id}" data-a0="${dDiff(s,tStart(t))}" data-b0="${dDiff(s,t.due)}" data-n="${N}" ${canMove(t)?'':`data-a="tOpen" data-id="${t.id}"`} title="${h(t.t)} · ${c[0]} · ${fmt(tStart(t))} → ${fmt(t.due)}${canMove(t)?' · drag to move · drag an edge to change start or due':''}">${canMove(t)&&!cut0?'<i class="t4h l"></i>':''}<span>${(b-a+1)/N>.12?h(t.t):''}</span>${canMove(t)&&!cut1?'<i class="t4h r"></i>':''}</div></div></div>`})});
 const aft=T.filter(t=>t.st!=='Done'&&tStart(t)>e),bef=T.filter(t=>t.st!=='Done'&&t.due<s&&!tLate(t));
 const more=(bef.length?`<button class="t4more" data-a="t4Go" data-d="${bef.map(t=>tStart(t)).sort()[0]}">‹ ${bef.length} earlier task${bef.length>1?'s':''}</button>`:'')+(aft.length?`<button class="t4more" data-a="t4Go" data-d="${aft.map(t=>tStart(t)).sort()[0]}">${aft.length} more task${aft.length>1?'s':''} after ${fmt(e)} · next from ${fmt(aft.map(t=>tStart(t)).sort()[0])} ›</button>`:'');
 return bar+kpi+`<div class="t4g-wrap" style="--n:${N};--cw:${N>14?22:34}px">${head}${body||`<div class="t4empty">${empty('No tasks in these dates','Try another date, project or person')}</div>`}</div>${more?`<div class="t4mrow">${more}</div>`:''}
 <div class="t4leg">${KCOL.map(c=>`<span><i style="background:${c[2]}"></i>${c[1]}</span>`).join('')}<span><i style="background:#DC2626"></i>Overdue</span><span><i class="nw"></i>Today</span><span class="mut">· Drag a bar to move it · drag its edge to change start or due · click to open</span></div>`}
A.t4V=e=>{S.tl4=e.dataset.t;render()};A.t4Go=e=>{S.tl4d=e.dataset.d;render()};A.t4T=()=>{S.tl4d=TODAY;render()};A.t4Tm=()=>{S.tl4='d';S.tl4d=addD(TODAY,1);render()};
A.t4N=e=>{const n=+e.dataset.n,v=S.tl4||'w',d=S.tl4d||TODAY;S.tl4d=v==='d'?addD(d,n):v==='m'?addD(d,n*35):addD(d,n*TL4[v][1]);render()};
document.addEventListener('change',ev=>{const t=ev.target;if(t&&t.dataset&&t.dataset.ch==='t4Pick'&&t.value){S.tl4d=t.value;render()}});
const _vtT4=V.tasks;V.tasks=()=>{if(S.ttab==='time')return taskHead(ME()||{n:''})+tl4();return _vtT4()};

A.t4C=e=>{const k=e.dataset.k;S.tl4c=S.tl4c||{};S.tl4c[k]=!S.tl4c[k];render()};

/* Timeline v4: drag a bar to move it, drag an edge to change start / due (saved at once, everyone sees it) */
(function(){let G=null;
 document.addEventListener('pointerdown',e=>{const b=e.target.closest&&e.target.closest('.t4b.mv');if(!b||e.button>0)return;const t=D.tasks.find(x=>x.id===b.dataset.gid);if(!t)return;
  const tr=b.closest('.t4tr');G={b,t,tr,x:e.clientX,a0:+b.dataset.a0,b0:+b.dataset.b0,N:+b.dataset.n,w:tr.getBoundingClientRect().width,d:0,moved:false,mode:e.target.classList.contains('t4h')?(e.target.classList.contains('l')?'l':'r'):'m'};
  b.setPointerCapture(e.pointerId);b.classList.add('drag');e.preventDefault()});
 document.addEventListener('pointermove',e=>{if(!G)return;const dx=e.clientX-G.x;if(Math.abs(dx)>4)G.moved=true;const d=Math.round(dx/(G.w/G.N));if(d===G.d)return;G.d=d;
  let a=G.a0,b=G.b0;if(G.mode==='m'){a+=d;b+=d}else if(G.mode==='l')a=Math.min(G.a0+d,G.b0);else b=Math.max(G.b0+d,G.a0);
  const A1=Math.max(0,a),B1=Math.min(G.N-1,b);G.b.style.left=A1/G.N*100+'%';G.b.style.width=Math.max(1,B1-A1+1)/G.N*100+'%';
  const s0=tStart(G.t),sp=G.b.querySelector('span');let ns=s0,nu=G.t.due;if(G.mode==='m'){ns=addD(s0,d);nu=addD(G.t.due,d)}else if(G.mode==='l'){ns=addD(s0,d);if(ns>nu)ns=nu}else{nu=addD(G.t.due,d);if(nu<ns)nu=ns}
  G.b.dataset.tip=ns===nu?fmt(nu):fmt(ns)+' → '+fmt(nu);if(sp)sp.textContent=G.b.dataset.tip});
 const end=()=>{if(!G)return;const {t,b,moved,d,mode}=G;G=null;b.classList.remove('drag');
  if(!moved||!d){if(!moved)A.tOpen({dataset:{id:t.id}});else render();return}
  const s0=tStart(t),u0=t.due;let s=s0,u=u0;if(mode==='m'){s=addD(s0,d);u=addD(u0,d)}else if(mode==='l'){s=addD(s0,d);if(s>u)s=u}else{u=addD(u0,d);if(u<s)u=s}
  t.start=s;t.due=u;(t.log=t.log||[]).push({by:S.me,at:TODAY,x:`Dates ${fmt(s0)}–${fmt(u0)} → ${fmt(s)}–${fmt(u)}`});save();render();
  toast(`${t.t.length>36?t.t.slice(0,36)+'…':t.t}: ${s===u?fmt(u):fmt(s)+' → '+fmt(u)}`)};
 document.addEventListener('pointerup',end);document.addEventListener('pointercancel',()=>{if(G){G.b.classList.remove('drag');G=null;render()}});
})();
