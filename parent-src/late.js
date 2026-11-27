/* ===== Holiday list (HR Desk → Holidays): add / delete, per Pune or Goa ===== */
if(!D.holi){D.holi=[{id:'h1',d:'2026-12-19',n:'Goa Liberation Day',w:'Goa'},{id:'h2',d:'2026-12-25',n:'Christmas',w:'All'},
 {id:'p1',d:'2027-01-26',n:'Republic Day',w:'Pune'},{id:'p2',d:'2027-03-10',n:'Ramzan Eid (Id-ul-Fitr)',w:'Pune',moon:1},{id:'p3',d:'2027-03-23',n:'Holi',w:'Pune'},{id:'p4',d:'2027-05-01',n:'Maharashtra Day / Labour Day',w:'Pune'},{id:'p5',d:'2027-05-17',n:'Bakri Eid (Id-ul-Zuha)',w:'Pune',moon:1},{id:'p6',d:'2027-08-15',n:'Independence Day',w:'Pune'},{id:'p7',d:'2027-09-04',n:'Ganesh Chaturthi',w:'Pune'},{id:'p8',d:'2027-10-29',n:'Diwali (Laxmi Pujan)',w:'Pune'},{id:'p9',d:'2027-12-25',n:'Christmas',w:'Pune'}];save()}
function holReg(e){return e.city==='Goa'?'Goa':'Pune'}
function holOn(e,d){if(e.noHol)return false;return (D.holi||[]).some(x=>x.d===d&&(x.w==='All'||x.w===holReg(e)))}
/* =================== Late rule: every 3rd late in a month = half day =================== */
if(!D.latex)D.latex={};
function wasLate(e,d){if(!e||d>TODAY)return false;const o=(D.latex[e.id]||{})[d];if(o!=null)return o;if(d===TODAY){const a=D.att.find(x=>x.k===e.k);return !!a&&a.st==='Late'}let hh=2166136261;for(const ch of 'late'+e.id+d){hh^=ch.charCodeAt(0);hh=Math.imul(hh,16777619)>>>0}return hh%100<9}
const _attRaw=attOf;
function lateIdx(e,d){let n=0;for(let x=monStart(d);x<=d;x=addD(x,1)){if(_attRaw(e,x)==='P'&&wasLate(e,x))n++}return n}
function lateMark(e,d){return _attRaw(e,d)==='P'&&wasLate(e,d)}
function lateHD(e,d){return _attRaw(e,d)==='P'&&wasLate(e,d)&&lateIdx(e,d)%3===0}
attOf=function(e,d){const s=_attRaw(e,d);if(s==='P'&&wasLate(e,d)&&!(D.attx[e.id]||{})[d]&&lateIdx(e,d)%3===0)return 'HD';return s};
function lateInfo(e,m){const en=monEnd(m)<TODAY?monEnd(m):TODAY,L=[],H=[];for(let d=m;d<=en;d=addD(d,1)){if(_attRaw(e,d)==='P'&&wasLate(e,d)){L.push(d);if(L.length%3===0)H.push(d)}}return {L,H}}
/* employee page: notice */
const _me2=V.me;V.me=()=>{let out=_me2();const e=empOf(S.me);if(!e)return out;const m=S.mym||monStart(TODAY),{L,H}=lateInfo(e,m),mon=new Date(m+'T12:00:00').toLocaleDateString('en-IN',{month:'long'});
 const note=H.length?`<div class="latenote"><b>⚠ Late ${L.length} times in ${mon}</b><div class="sm">Every 3rd late in a month counts as a half day. ${H.map(d=>fmt(d)).join(', ')} ${H.length>1?'were':'was'} marked as a half day.</div></div>`:L.length?`<div class="latenote soft"><b>Late ${L.length} time${L.length>1?'s':''} in ${mon}</b><div class="sm">${3-L.length%3} more late mark${3-L.length%3>1?'s':''} and one day becomes a half day.</div></div>`:'';
 return out.replace('<div class="grid g2" style="align-items:start">',note+'<div class="grid g2" style="align-items:start">')};
/* notifications when a late turns into a half day */
if(!D.lnote)D.lnote={};
D.emp.forEach(e=>{const {H}=lateInfo(e,monStart(TODAY));H.forEach(d=>{const k=e.id+d;if(!D.lnote[k]){D.lnote[k]=1;D.msgs.push({id:nid('m'),g:'late_'+e.id,f:'nameera',t:`${e.n.split(' ')[0]}, you were late 3 times this month, so ${fmt(d)} is marked as a half day.`,at:'10:15'})}})});
/* attendance sheet legend + payroll note */
const _p4=V.people;V.people=()=>{let out=_p4();if(S.ptab==='att')out=out.replace('<div class="note">P = present','<div class="note"><span class="ac P lt sm">P</span> orange corner = came late. Every 3rd late in a month turns that day into <b>HD</b> automatically, and the employee is told on their page. P = present');return out};
/* employee notifications on Home */
const _sh=staffHome;staffHome=function(){let out=_sh();const e=empOf(S.me);if(!e)return out;const {H}=lateInfo(e,monStart(TODAY));if(!H.length)return out;const d=H[H.length-1];return out.replace('<div style="margin-top:14px">',`<button class="latenote" data-a="go" data-v="me" style="width:100%;text-align:left;border:0;margin-top:14px;cursor:pointer"><b>⚠ ${fmt(d)} marked as a half day</b><div class="sm">You were late 3 times this month. Tap to see your attendance.</div></button><div style="margin-top:14px">`)};
A.sbM=e=>{S.sbm=!(e.getAttribute&&e.getAttribute('aria-expanded')==='true');render()};
document.addEventListener('input',e=>{if(e.target&&e.target.id==='msg'&&e.target.tagName==='TEXTAREA'){e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,140)+'px'}});
/* ===== Chat: delete for everyone (soft) — only Darshan & Nameera can see what was deleted ===== */
A.msgDel=e=>{const m=D.msgs.find(x=>x.id===e.dataset.id);if(!m)return;m.orig={t:m.t||'',kind:m.kind||'',src:m.src||'',name:m.name||'',dur:m.dur||''};m.delBy=S.me;m.delAt=nowT();m.kind='del';m.t='🚫 This message was deleted';m.rx={};delete m.src;save();closeM();render();toast('Deleted for everyone')};
const _bub=bubble;bubble=function(m,G){if(m.kind!=='del')return _bub(m,G);const me=m.f===S.me,adm=isAdm(),o=m.orig||{},open=S.delOpen===m.id;
 const what=o.kind==='voice'?'🎤 Voice note':o.kind==='img'?'📷 Photo'+(o.t?' · '+o.t:''):o.kind==='file'?'📄 '+(o.name||'File'):o.t;
 return `<div class="bub del ${me?'me':''}" ${adm?`data-a="delView" data-id="${m.id}" role="button" tabindex="0"`:''}>${!me&&G?`<div class="w" style="color:${colr(nm(m.f))}">${h(nmF(m.f))}</div>`:''}<i>🚫 ${me?'You deleted this message':'This message was deleted'}</i>${adm?(open?`<div class="delorig"><div class="xs mut">Deleted by ${h(nmF(m.delBy||m.f))} at ${h(m.delAt||'')} · only Darshan & Nameera can see this</div>${h(what||'')}</div>`:`<div class="xs" style="color:var(--o);font-weight:700;margin-top:3px">Admin · tap to see what was deleted</div>`):''}<div class="t">${m.at}</div></div>`};
A.delView=e=>{if(!isAdm())return;S.delOpen=S.delOpen===e.dataset.id?null:e.dataset.id;render()};
/* right-click / double-click / long-press opens message options */
const openMsg=t=>{const b=t.closest&&t.closest('.bub[data-a="msgAct"]');if(b){A.msgAct(b);return true}return false};
document.addEventListener('contextmenu',e=>{if(openMsg(e.target))e.preventDefault()});
document.addEventListener('dblclick',e=>{openMsg(e.target)});
let LP=null;document.addEventListener('touchstart',e=>{const b=e.target.closest&&e.target.closest('.bub[data-a="msgAct"]');if(!b)return;LP=setTimeout(()=>{LP=null;A.msgAct(b)},550)},{passive:true});
['touchend','touchmove','touchcancel'].forEach(k=>document.addEventListener(k,()=>{if(LP){clearTimeout(LP);LP=null}},{passive:true}));
/* ===== Weekly offs per person + mark-from-anywhere ===== */
if(!D.woV1){const W={zubair:0,abrar:3,samadhan:4,mustafa:5};D.emp.forEach(e=>{e.wo=W[e.k]!=null?W[e.k]:0;if(e.city==='Goa')e.anyLoc=true});const s=D.att.find(a=>a.k==='samadhan');if(s&&s.st==='Week off'){s.st='In';s.in='09:25';s.gps='Warehouse · live'}D.woV1=1;save()}
const _es2=A.empSave;A.empSave=el=>{const wo=val('ef-wo'),loc=pick1('ef-loc'),hol=pick1('ef-hol'),np=val('ef-np'),rs=val('ef-rs'),id=el.dataset.id||val('ef-id');_es2(el);const x=D.emp.find(y=>y.id===id);if(x){if(np!=='')x.notice=+np;x.resign=rs||'';if(wo!=='')x.wo=+wo;x.anyLoc=loc==='Anywhere';if(hol)x.noHol=hol.startsWith('No');save();render()}};
const _me3=V.me;V.me=()=>{let out=_me3();const e=empOf(S.me);if(!e)return out;const m=S.mym||monStart(TODAY),en=monEnd(m);let n=0;for(let d=m;d<=en;d=addD(d,1))if(new Date(d+'T12:00:00').getDay()===woDay(e))n++;
 return out.replace(`<div class="mut sm">${e.id} · ${h(e.desig)} · ${h(e.time)}</div>`,`<div class="mut sm">${e.id} · ${h(e.desig)} · ${h(e.time)}</div><div class="xs" style="margin-top:4px"><b>Weekly off:</b> ${DAYN[woDay(e)]} · ${n} paid weekly-off leaves (L) this month${e.anyLoc?' · <b>can mark attendance from anywhere</b>':''}</div>`)};
/* ===== Salary advances: normally not given; only Darshan adds one and picks full or instalments ===== */
if(!D.adv)D.adv=[];
const mAdd=(m,n)=>{const d=new Date(m+'T12:00:00');d.setDate(1);d.setMonth(d.getMonth()+n);return iso(d)};
const mIdx=m=>{const d=new Date(m+'T12:00:00');return d.getFullYear()*12+d.getMonth()};
function advCut(a,m){const k=mIdx(m)-mIdx(a.start);if(k<0||k>=a.n)return 0;const per=Math.floor(a.amt/a.n);return k===a.n-1?a.amt-per*(a.n-1):per}
function advFor(x,m){let due=0,given=0,before=0;D.adv.filter(a=>a.eid===x.id).forEach(a=>{due+=advCut(a,m);if(a.dt.slice(0,7)===m.slice(0,7))given+=a.amt;if(a.dt.slice(0,7)<m.slice(0,7)){let rec=0;for(let j=0;mIdx(mAdd(a.start,j))<mIdx(m)&&j<a.n;j++)rec+=advCut(a,mAdd(a.start,j));before+=a.amt-rec}});return {due,given,before}}
const _pc2=payCalc;payCalc=function(x,m){const i=payIn(x,m),o={adv:i.adv,ded:i.ded,prevPend:i.prevPend},f=advFor(x,m);if(!f.due&&!f.given&&!f.before)return _pc2(x,m);
 i.adv=(+o.adv||0)+f.given;i.ded=(+o.ded||0)+f.due;i.prevPend=(+o.prevPend||0)+f.before;try{const k=_pc2(x,m);k.i=Object.assign({},i);return k}finally{Object.assign(i,o)}};
function payWin(m){const n=mAdd(m,1),e5=n.slice(0,8)+'05',e10=n.slice(0,8)+'10';return {e5,e10}}
const _p5=V.people;V.people=()=>{let out=_p5();if(S.ptab!=='pay')return out;const s=S.pm,st=D.payst[s]||'Draft',{e5,e10}=payWin(s),mon=new Date(s+'T12:00:00').toLocaleDateString('en-IN',{month:'long'});
 const late=st!=='Paid'&&TODAY>e10,soon=st!=='Paid'&&!late&&TODAY>=addD(e5,-4);
 const win=`<div class="${late?'latenote':soon?'latenote soft':'note'}" style="margin:0 0 12px"><b>${mon} salary · pay between ${fmt(e5)} and ${fmt(e10)}</b>${st==='Paid'?' · done':late?' · past the 10th and not paid yet':soon?' · payment window is coming up — get the MIS approved':''}</div>`;
 const L=D.adv.slice().sort((a,b)=>b.dt.localeCompare(a.dt));
 const rows=L.map(a=>{const x=D.emp.find(y=>y.id===a.eid)||{n:a.eid};let rec=0;for(let j=0;j<a.n;j++){const mm=mAdd(a.start,j);if(monEnd(mm)<TODAY)rec+=advCut(a,mm)}const left=a.amt-rec;return `<div class="li"><div class="tx"><b>${h(x.n)} · ${inr(a.amt)}</b><div class="m">Given ${fmt(a.dt)} · ${a.n===1?'full amount from '+new Date(a.start+'T12:00:00').toLocaleDateString('en-IN',{month:'short',year:'numeric'})+' salary':a.n+' instalments of ~'+inr(Math.floor(a.amt/a.n))+' from '+new Date(a.start+'T12:00:00').toLocaleDateString('en-IN',{month:'short',year:'numeric'})}${a.note?' · '+h(a.note):''}</div></div>${pill(left>0?inr(left)+' left':'Recovered',left>0?'a':'g')}${isBoss()?`<button class="lnk" data-a="advDel" data-id="${a.id}" style="color:var(--r)">Remove</button>`:''}</div>`}).join('');
 const sec=`<div class="card" style="margin-top:14px"><div class="row nw"><b style="flex:1">Salary advances</b>${isBoss()?`<button class="btn sm" data-a="advNew">${ic('plus')}Give advance</button>`:''}</div><div class="xs mut" style="margin-top:4px">Advances are normally not given. Only Darshan can add one, and he chooses whether it is cut in full from the next salary or in instalments. The cut shows up automatically in the payroll and on the salary slip.</div><div class="list" style="margin:10px 0 0;box-shadow:none">${rows||'<div class="empty xs">No advances</div>'}</div></div>`;
 return out.replace('<div class="note">Salary is always worked out',sec+'<div class="note">Salary is always worked out')};
A.advNew=()=>{if(!isBoss())return;const nx=mAdd(monStart(TODAY),1);sheet(`<h2>Give salary advance</h2><label for="ad-e">Employee</label><select id="ad-e">${D.emp.filter(e=>e.st==='Active').map(e=>`<option value="${e.id}">${h(e.n)} · ${e.id}</option>`).join('')}</select>
 <div class="grid g2"><div><label for="ad-a">Amount ₹</label><input id="ad-a" type="number" inputmode="numeric"></div><div><label for="ad-d">Date given</label><input id="ad-d" type="date" value="${TODAY}"></div></div>
 <label>How should it be cut?</label>${opts('ad-m',['Full from next salary','In instalments'],'Full from next salary')}
 <div class="grid g2"><div><label for="ad-n">Number of instalments (months)</label><input id="ad-n" type="number" min="2" value="3"></div><div><label for="ad-s">Start cutting from</label><input id="ad-s" type="month" value="${nx.slice(0,7)}"></div></div>
 <label for="ad-x">Note (optional)</label><input id="ad-x" placeholder="Reason">
 <button class="btn w" style="margin-top:14px" data-a="advSave">Save advance</button>`)};
A.advSave=()=>{const amt=+val('ad-a');if(!amt)return toast('Enter the amount');const full=pick1('ad-m')!=='In instalments',n=full?1:Math.max(2,+val('ad-n')||2),s=(val('ad-s')||mAdd(monStart(TODAY),1).slice(0,7))+'-01';
 D.adv.push({id:nid('adv'),eid:val('ad-e'),amt,dt:val('ad-d')||TODAY,n,start:s,note:val('ad-x'),by:S.me});save();closeM();render();toast('Advance saved · '+(full?'full cut':'cut in '+n+' instalments'))};
A.advDel=e=>{if(!isBoss())return;D.adv=D.adv.filter(a=>a.id!==e.dataset.id);save();render();toast('Advance removed')};
/* ===== Nameera (HR admin) gets the same dashboard as Darshan ===== */
const _home2=V.home;V.home=()=>{const p=P[S.me];if(!p||p.kind!=='hr')return _home2();p.kind='boss';try{return _home2()}finally{p.kind='hr'}};
const _allowed2=allowed;allowed=function(v){if(K()==='hr'&&['money','content','contacts','co','kpi','training','blueprint','settings'].includes(v))return true;return _allowed2(v)};
const _vco=V.co;V.co=()=>{if(K()!=='hr')return _vco();const p=P[S.me];if(!CO[S.co])S.co='gb';p.kind='boss';try{return coPage(false)}finally{p.kind='hr'}};
function pHol(){const yr=S.hy||TODAY.slice(0,4),W=S.hw||'All',L=D.holi.filter(x=>x.d.slice(0,4)===yr&&(W==='All'||x.w===W||x.w==='All')).sort((a,b)=>a.d.localeCompare(b.d));
 const yrs=[...new Set([TODAY.slice(0,4),String(+TODAY.slice(0,4)+1),...D.holi.map(x=>x.d.slice(0,4))])].sort();const cnt=w=>D.holi.filter(x=>x.d.slice(0,4)===yr&&(x.w===w||x.w==='All')).length;
 return `<div class="row" style="margin-bottom:10px">${chips(yrs.map(y=>[y,y]),yr,'hy')}<span style="width:12px"></span>${chips([['All','All'],['Pune','Pune · '+cnt('Pune')],['Goa','Goa · '+cnt('Goa')]],W,'hw')}<span class="sp"></span>${isAdm()?`<button class="btn sm" data-a="holNew">${ic('plus')}Add holiday</button>`:''}</div>
 <div class="list">${L.map(x=>{const dt=new Date(x.d+'T12:00:00'),sun=dt.getDay()===0;return `<div class="li"><div style="width:54px;text-align:center"><b style="font:800 20px Outfit;display:block">${dt.getDate()}</b><span class="xs mut">${dt.toLocaleDateString('en-IN',{month:'short'})}</span></div><div class="tx"><b>${h(x.n)}</b><div class="m">${dt.toLocaleDateString('en-IN',{weekday:'long'})}${sun?' · falls on a Sunday':''}${x.moon?' · date may shift with the moon':''}${x.d<TODAY?' · done':''}</div></div>${pill(x.w==='All'?'Pune + Goa':x.w,x.w==='Goa'?'p':x.w==='Pune'?'b':'g')}${isAdm()?`<button class="lnk" data-a="holDel" data-id="${x.id}" style="color:var(--r)" aria-label="Delete ${h(x.n)}">Delete</button>`:''}</div>`}).join('')||`<div class="empty">No holidays added for ${yr}${W!=='All'?' · '+W:''} yet</div>`}</div>
 <div class="note">Every holiday here shows as <b>L</b> (paid) on the attendance sheet for staff of that location, and counts in payroll automatically. Goa staff get the Goa list; everyone else gets the Pune list. Holi 2027 is set to 23 March as per the central government list; some calendars say 22 March, so change it if the Maharashtra list differs. Eid dates depend on the moon.</div>`}
A.holNew=()=>sheet(`<h2>Add holiday</h2><label for="hn">Holiday name</label><input id="hn" placeholder="e.g. Gudi Padwa"><label for="hd">Date</label><input id="hd" type="date" value="${(S.hy||TODAY.slice(0,4))}-01-01"><label>Applies to</label>${opts('hwh',['Pune','Goa','Pune + Goa'],S.hw&&S.hw!=='All'?S.hw:'Pune')}<button class="btn w" style="margin-top:14px" data-a="holSave">Add holiday</button>`);
A.holSave=()=>{const n=val('hn'),d=val('hd');if(!n||!d)return toast('Add the name and date');const w0=pick1('hwh')||'Pune',w=w0==='Pune + Goa'?'All':w0;if(D.holi.some(x=>x.d===d&&x.w===w))return toast('A holiday is already on that date');D.holi.push({id:nid('hol'),d,n,w});save();closeM();S.hy=d.slice(0,4);render();toast(n+' added')};
A.holDel=e=>{const x=D.holi.find(y=>y.id===e.dataset.id);if(!x)return;sheet(`<h2>Delete ${h(x.n)}?</h2><p class="mut">${fmt(x.d)} will go back to a normal working day on the attendance sheet.</p><div class="row" style="margin-top:14px"><button class="btn sec" data-a="closeM">Keep it</button><button class="btn" style="background:var(--r)" data-a="holDelOk" data-id="${x.id}">Delete</button></div>`)};
A.holDelOk=e=>{D.holi=D.holi.filter(y=>y.id!==e.dataset.id);save();closeM();render();toast('Holiday deleted')};
['hy','hw'].forEach(k=>A[k]=e=>{S[k]=e.dataset.t;render()});
/* warehouse team: weekly off only, no public holidays */
if(!D.holV2){D.emp.forEach(e=>{if(['zubair','abrar','samadhan','mustafa'].includes(e.k))e.noHol=true});D.holV2=1;save()}
/* mid-month joiner: first part-month salary is held and paid with the next month's salary */
function joinedMid(x,m){return x.doj>m&&x.doj<=monEnd(m)}
const _pc3=payCalc;payCalc=function(x,m){const prev=mAdd(m,-1),i=payIn(x,m),o=i.last;let carry=0;
 if(joinedMid(x,prev)){const kp=_pc3(x,prev);carry=kp.net}
 if(carry){i.last=(+o||0)+carry}let k;try{k=_pc3(x,m);if(carry)k.i=Object.assign({},k.i,{last:i.last})}finally{i.last=o}
 if(joinedMid(x,m)){k.held=k.net;k.net=0}if(carry)k.carry=carry;return k};
const _p6=V.people;V.people=()=>{let out=_p6();if(S.ptab==='hol')out=out.replace('Eid dates depend on the moon.','Eid dates depend on the moon. A holiday that falls on someone\'s weekly off (for example Independence Day on Sunday 15 Aug 2027) gives no extra day off. The warehouse team (Zubair, Abrar, Samadhan, Mustafa) gets no public holidays, only their weekly off; Nameera can change this per person in Edit employee.');
 if(S.ptab==='pay'){const s=S.pm,J=D.emp.filter(x=>joinedMid(x,s)&&x.sal),C=D.emp.filter(x=>joinedMid(x,mAdd(s,-1))&&x.sal);
  if(false&&(J.length||C.length)){const note=`<div class="note" style="margin-bottom:12px">${J.length?`<b>Held:</b> ${J.map(x=>`${h(x.n)} (joined ${fmt(x.doj)}, ${inr(payCalc(x,s).held||0)})`).join(', ')} — first part-month salary is held and paid with next month's salary. `:''}${C.length?`<b>Added this month:</b> ${C.map(x=>`${h(x.n)} +${inr(payCalc(x,s).carry||0)} for last month's days`).join(', ')}.`:''}</div>`;out=out.replace('<div class="stats">',note+'<div class="stats">')}}
 return out};
/* ===== Exit: final salary only if notice period is served (or waived by Darshan / Nameera) ===== */
const ntc=x=>x.notice!=null?+x.notice:30;
function noticeEnd(x){return x.resign?addD(x.resign,ntc(x)):''}
function noticeOk(x){if(x.nWaive)return true;if(!x.resign||!x.dox)return null;return x.dox>=noticeEnd(x)}
const _pc4=payCalc;payCalc=function(x,m){const k=_pc4(x,m);if(x.dox&&x.dox>=m&&x.dox<=monEnd(m)&&noticeOk(x)===false){k.forfeit=k.net;k.net=0}return k};
A.nWaive=e=>{if(!isAdm())return;const x=D.emp.find(y=>y.id===e.dataset.id);sheet(`<h2>Approve final salary for ${h(x.n)}?</h2><p class="mut">${h(x.n)} left on ${fmt(x.dox)} without completing the ${ntc(x)}-day notice period (it ends ${fmt(noticeEnd(x))}). Approving pays the final salary anyway. This is recorded as approved by ${h(nmF(S.me))}.</p><div class="row" style="margin-top:14px"><button class="btn sec" data-a="closeM">Cancel</button><button class="btn" data-a="nWaiveOk" data-id="${x.id}">Approve final salary</button></div>`)};
A.nWaiveOk=e=>{const x=D.emp.find(y=>y.id===e.dataset.id);x.nWaive={by:S.me,at:TODAY};save();closeM();render();toast('Final salary approved')};
A.nUnwaive=e=>{if(!isAdm())return;const x=D.emp.find(y=>y.id===e.dataset.id);delete x.nWaive;save();render();toast('Approval removed')};
const _p7=V.people;V.people=()=>{let out=_p7();if(S.ptab!=='pay')return out;const s=S.pm,en=monEnd(s);
 const SN=D.emp.filter(x=>x.resign&&x.st==='Active'),EX=D.emp.filter(x=>x.dox&&x.dox>=s&&x.dox<=en);
 if(!SN.length&&!EX.length)return out;
 const row=x=>{const ok=noticeOk(x);return `<div class="li"><div class="tx"><b>${h(x.n)}</b><div class="m">${x.resign?`Resigned ${fmt(x.resign)} · ${ntc(x)}-day notice ends ${fmt(noticeEnd(x))}`:'No resignation date entered'}${x.dox?` · left ${fmt(x.dox)}`:''}${x.nWaive?` · final salary approved by ${h(nmF(x.nWaive.by))}`:''}</div></div>${x.st==='Active'?pill('Serving notice','a'):ok===null?pill('Add resignation date','a'):ok?pill(x.nWaive&&x.dox<noticeEnd(x)?'Approved · will be paid':'Notice served · will be paid','g'):pill('Notice not served · not paid','r')}${isAdm()&&x.dox&&ok===false?`<button class="lnk" data-a="nWaive" data-id="${x.id}">Approve anyway</button>`:''}${isAdm()&&x.nWaive?`<button class="lnk" data-a="nUnwaive" data-id="${x.id}" style="color:var(--r)">Remove approval</button>`:''}</div>`};
 const sec=`<div class="card" style="margin-top:14px"><b>Resignations & final salary</b><div class="xs mut" style="margin-top:4px">Final salary is paid only if the notice period in the offer letter is fully served. If not, nothing is paid, unless Darshan or Nameera approve it. Add the notice period and resignation date in Edit employee.</div><div class="list" style="margin:10px 0 0;box-shadow:none">${[...EX,...SN.filter(x=>!EX.includes(x))].map(row).join('')}</div></div>`;
 return out.replace('<div class="note">Salary is always worked out',sec+'<div class="note">Salary is always worked out')};
/* ===== Weekly-off swap: e.g. Mustafa takes Sunday off, Zubair covers Sunday and takes Mustafa's Friday ===== */
if(!D.wos)D.wos=[];
function swapRole(e,d){for(const s of D.wos){if(s.st!=='Approved')continue;if(s.k===e.k){if(d===s.day)return 'off';if(d===s.orig)return 'work'}if(s.cov===e.k){if(d===s.day)return 'work';if(d===s.orig)return 'off'}}return ''}
const _att9=attOf;attOf=function(e,d){const r=swapRole(e,d),s=_att9(e,d);if(!r||(D.attx[e.id]||{})[d])return s;if(r==='off')return d>TODAY?'':'WO';if(s==='WO'){if(d>TODAY)return '';if(d===TODAY){const a=D.att.find(a=>a.k===e.k);return a?({In:'P',Late:'P',Leave:'L','Not in':'NS'}[a.st]||'NS'):'NS'}return 'P'}return s};
const offIn=(e,d)=>{const w=wkStart(d);for(let i=0;i<7;i++){const x=addD(w,i);if(new Date(x+'T12:00:00').getDay()===woDay(e))return x}return ''};
A.swapNew=()=>{const e=empOf(S.me);if(!e)return;const C=D.emp.filter(x=>x.st==='Active'&&x.k!==e.k).sort((a,b)=>(b.city===e.city)-(a.city===e.city));
 sheet(`<h2>Swap my weekly off</h2><p class="mut sm">Your weekly off is ${DAYN[woDay(e)]}. Pick the day you want off instead, and the colleague who will cover it. You work your usual ${DAYN[woDay(e)]} that week, and your colleague takes it off instead. Nameera approves.</p>
 <label for="sw-d">Day I want off</label><input id="sw-d" type="date" min="${addD(TODAY,1)}"><label for="sw-c">Colleague who will cover</label><select id="sw-c">${C.map(x=>`<option value="${x.k}">${h(x.n)} · off ${DAYN[woDay(x)]}</option>`).join('')}</select><label for="sw-r">Reason (optional)</label><input id="sw-r" placeholder="e.g. family function">
 <button class="btn w" style="margin-top:14px" data-a="swapSave">Send to HR Manager Nameera</button>`)};
A.swapSave=()=>{const e=empOf(S.me),d=val('sw-d'),c=val('sw-c');if(!d)return toast('Pick the day');if(d<=TODAY)return toast('Pick a future date');if(new Date(d+'T12:00:00').getDay()===woDay(e))return toast('That is already your weekly off');const o=offIn(e,d);
 D.wos.unshift({id:nid('sw'),k:e.k,day:d,orig:o,cov:c,why:val('sw-r'),st:'Pending',at:TODAY});save();closeM();render();toast('Swap request sent to Nameera')};
A.swapSt=e=>{if(!isAdm())return;const s=D.wos.find(x=>x.id===e.dataset.id);s.st=e.dataset.s;s.by=S.me;save();render();toast('Swap '+s.st.toLowerCase())};
const swapLine=(s,act)=>{const a=empOf(s.k)||{n:s.k},c=empOf(s.cov)||{n:s.cov};return `<div class="li"><div class="tx"><b>${h(a.n)} off on ${fmt(s.day)} (${DAYN[new Date(s.day+'T12:00:00').getDay()].slice(0,3)})</b><div class="m">${h(c.n)} covers that day · ${h(a.n.split(' ')[0])} works ${fmt(s.orig)} and ${h(c.n.split(' ')[0])} takes it off${s.why?' · '+h(s.why):''}</div></div>${act&&s.st==='Pending'?`<button class="btn sm" data-a="swapSt" data-id="${s.id}" data-s="Approved">Approve</button><button class="btn sm sec" data-a="swapSt" data-id="${s.id}" data-s="Rejected">Reject</button>`:pill(s.st==='Pending'?'With Nameera':s.st,s.st==='Approved'?'g':s.st==='Rejected'?'r':'a')}</div>`};
const _p8=V.people;V.people=()=>{let out=_p8();if(S.ptab!=='leave')return out;const L=D.wos.filter(s=>s.day>=addD(TODAY,-30));
 return out.replace('<div style="margin-top:12px"></div>','<div style="margin-top:12px"></div>'+`<div class="card" style="margin-bottom:14px"><b>Weekly-off swaps</b>${D.wos.filter(s=>s.st==='Pending').length?` ${pill(D.wos.filter(s=>s.st==='Pending').length+' waiting','a')}`:''}<div class="xs mut" style="margin-top:4px">Staff can swap their weekly off with a colleague for one week (for example Mustafa takes Sunday off while Zubair covers Sunday and takes Mustafa's Friday). Approving updates both people's attendance automatically.</div><div class="list" style="margin:10px 0 0;box-shadow:none">${L.map(s=>swapLine(s,isAdm())).join('')||'<div class="empty xs">No swap requests</div>'}</div></div>`)};
const _me4=V.me;V.me=()=>{let out=_me4();const e=empOf(S.me);if(!e)return out;const M=D.wos.filter(s=>(s.k===e.k||s.cov===e.k)&&s.day>=addD(TODAY,-7));
 const card=`<div class="card"><div class="row nw"><b style="flex:1">Weekly off swap</b><button class="btn sm sec" data-a="swapNew">${ic('plus')}Swap my off day</button></div><div class="list" style="margin:10px 0 0;box-shadow:none">${M.map(s=>swapLine(s,false)).join('')||`<div class="empty xs">Your weekly off is ${DAYN[woDay(e)]}. Need a different day off one week? Swap with a colleague.</div>`}</div></div>`;
 return out.replace('<div class="card"><div class="row nw"><b style="flex:1">Leave</b>',card+'<div class="card"><div class="row nw"><b style="flex:1">Leave</b>')};
if(!D.ntcV1){D.emp.forEach(e=>{if(e.notice==null)e.notice=e.k==='nameera'?90:30});D.ntcV1=1;save()}
/* daily target not reached: shown at the top of the employee's own page */
const _sh3=staffHome;staffHome=function(){const out=_sh3(),T=[];if(!T.length)return out;const u=(t,n)=>t.unit==='₹'?inr(n):n;
 return `<div class="latenote soft" style="margin-bottom:14px"><b>⚠ Daily target not reached yet</b><div class="sm">${T.map(t=>`${h(t.l)}: ${u(t,t.v)} of ${u(t,t.goal)} · ${u(t,t.goal-t.v)} to go`).join('<br>')}</div></div>`+out};
/* late = more than 15 minutes after the person's own shift start */
const LATE_MIN=15;
function shiftStart(e){const m=String((e&&e.time)||'10am').match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);if(!m)return 600;let hh=+m[1]%12;if(/pm/i.test(m[3]))hh+=12;return hh*60+(+m[2]||0)}
const _snap=A.snap;A.snap=()=>{_snap();const a=D.att.find(x=>x.k===S.me),e=empOf(S.me);if(!a||!a.in)return;const [hh,mm]=a.in.split(':').map(Number),late=hh*60+mm>shiftStart(e)+LATE_MIN;a.st=late?'Late':'In';save();render();toast('Clocked in '+ownIn(e,a)+(late?' · late mark (more than 15 min after shift start)':''))};
/* ===== Auto mark-out at 12 am if someone forgets; only shift hours count; told next day ===== */
if(!D.autoOut)D.autoOut=[];
if(!D.attDay)D.attDay=TODAY;
if(D.attDay<TODAY){const yd=D.attDay;D.emp.filter(e=>e.st==='Active').forEach(e=>{const a=D.att.find(x=>x.k===e.k),lv=D.leave.some(l=>l.k===e.k&&l.st==='Approved'&&yd>=l.from&&yd<=l.to),own=(D.attx[e.id]||{})[yd];if(!own&&!lv&&yd>=e.doj&&(!a||!a.in)&&!(a&&a.st==='Leave')&&new Date(yd+'T12:00:00').getDay()!==woDay(e)&&!holOn(e,yd)){D.attx[e.id]=D.attx[e.id]||{};D.attx[e.id][yd]='A'}});D.att.forEach(a=>{const e=empOf(a.k);if(a.in&&e&&!(D.attx[e.id]||{})[yd]){D.attx[e.id]=D.attx[e.id]||{};D.attx[e.id][yd]='P'}if(a.in&&!a.out){a.out='00:00';D.autoOut.push({k:a.k,d:yd,in:a.in})}});D.attDay=TODAY;save()}
if(!D.aoV1){D.autoOut.push({k:'balaji',d:addD(TODAY,-1),in:'10:12',demo:1});D.aoV1=1;save()}
function shiftEndTxt(e){const m=String((e&&e.time)||'').split(/[–-]/)[1];return (m||'').trim()||'shift end'}
const aoNote=k=>{const x=D.autoOut.filter(a=>a.k===k&&a.d===addD(TODAY,-1));if(!x.length)return '';const e=empOf(k);return `<div class="latenote soft" style="margin-bottom:14px"><b>⏰ You were marked out automatically yesterday</b><div class="sm">You forgot to mark out on ${fmt(x[0].d)}, so the app marked you out at 12 am. The day still counts as Present because you took your start-of-day selfie. Only your shift hours count (${h(e?e.time:'')}), so the day is counted up to ${h(shiftEndTxt(e))}.</div></div>`};
const _sh4=staffHome;staffHome=function(){return aoNote(S.me)+_sh4()};
const _me5=V.me;V.me=()=>{const out=_me5(),n=aoNote(S.me);return n?out.replace('<div class="grid g2" style="align-items:start">',n+'<div class="grid g2" style="align-items:start">'):out};
const _p9=V.people;V.people=()=>{let out=_p9();if(S.ptab!=='today')return out;const Y=D.autoOut.filter(a=>a.d===addD(TODAY,-1));if(!Y.length)return out;
 return out.replace('<div class="stats">',`<div class="note" style="margin-bottom:12px"><b>Marked out automatically last night:</b> ${Y.map(a=>{const e=empOf(a.k);return h(e?e.n:a.k)+' (in at '+a.in+')'}).join(', ')}. They forgot to mark out; only their shift hours count and they have been told on their page.</div><div class="stats">`)};
D.att.forEach(a=>{if(a.in&&['In','Late'].includes(a.st)){const e=empOf(a.k),[hh,mm]=a.in.split(':').map(Number);a.st=hh*60+mm>shiftStart(e)+LATE_MIN?'Late':'In'}});
/* early selfie: actual time kept for admins; hours count from shift start */
const hhmm=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
function earlyTxt(e,a){if(!a||!a.in)return '';const [hh,mm]=a.in.split(':').map(Number),st=shiftStart(e);return hh*60+mm<st?`early · counted from ${hhmm(st)} · `:''}
/* ===== Salary slips on the employee's Me page — only after Nameera releases them ===== */
if(!D.slipRel)D.slipRel={};
const relOk=(x,m)=>!!(D.slipRel[m]&&(D.slipRel[m].all||(D.slipRel[m].ids||[]).includes(x.id)));
A.slipRel=e=>{if(!isAdm())return;const m=S.pm;D.slipRel[m]={all:true,by:S.me,at:TODAY};save();render();toast('Slips released — staff can now download them from their Me page')};
A.slipUnrel=e=>{if(!isAdm())return;delete D.slipRel[S.pm];save();render();toast('Slips hidden from staff')};
A.slipRelOne=e=>{if(!isAdm())return;const m=S.pm||monStart(TODAY),r=D.slipRel[m]=D.slipRel[m]||{ids:[],by:S.me,at:TODAY};r.ids=r.ids||[];if(!r.ids.includes(e.dataset.id))r.ids.push(e.dataset.id);save();closeM();render();toast('Slip released to the employee')};
A.mySlip=e=>{const x=empOf(S.me);if(!x||!relOk(x,e.dataset.m))return toast('Not released yet');const keep=S.pm;S.pm=e.dataset.m;A.slip({dataset:{id:x.id}});S.pm=keep};
const _p10=V.people;V.people=()=>{let out=_p10();if(S.ptab!=='pay')return out;const r=D.slipRel[S.pm],mon=new Date(S.pm+'T12:00:00').toLocaleDateString('en-IN',{month:'long'});
 const bar=`<div class="card row nw" style="margin-bottom:12px"><div style="flex:1"><b>Salary slips · ${mon}</b><div class="xs mut">${r&&r.all?`Released by ${h(nmF(r.by))} on ${fmt(r.at)} — staff can view and download their slip from their Me page.`:r&&r.ids&&r.ids.length?`Released to ${r.ids.length} employee${r.ids.length>1?'s':''} only.`:'Not released yet — staff cannot see their slip until you release it.'}</div></div>${isAdm()?(r&&r.all?`<button class="btn sm sec" data-a="slipUnrel">Hide from staff</button>`:`<button class="btn sm" data-a="slipRel">Release slips to staff</button>`):''}</div>`;
 return out};
const _me6=V.me;V.me=()=>{let out=_me6();const x=empOf(S.me);if(!x)return out;const ms=[];for(let i=1;i<=6;i++){const m=mAdd(monStart(TODAY),-i);if(monEnd(m)>=x.doj)ms.push(m)}
 const card=`<div class="card"><b>My salary slips</b><div class="list" style="margin:10px 0 0;box-shadow:none">${ms.map(m=>`<div class="li"><div class="tx"><b>${new Date(m+'T12:00:00').toLocaleDateString('en-IN',{month:'long',year:'numeric'})}</b></div>${relOk(x,m)?`<button class="btn sm" data-a="mySlip" data-m="${m}">${ic('dl')}View & download</button>`:pill('Not released yet','')}</div>`).join('')||'<div class="empty xs">No slips yet</div>'}</div><div class="xs mut" style="margin-top:6px">Your slip appears here once Nameera releases it.</div></div>`;
 return out.replace('<div class="card"><div class="row nw"><b style="flex:1">Leave</b>',card+'<div class="card"><div class="row nw"><b style="flex:1">Leave</b>')};
/* employee sees the day starting at their shift time, not the early selfie time */
const ownIn=(x,a)=>{if(!a||!a.in)return '';const [hh,mm]=a.in.split(':').map(Number),st=shiftStart(x);return hh*60+mm<st?hhmm(st):a.in};
const _me7=V.me;V.me=()=>{let out=_me7();const x=empOf(S.me),a=D.att.find(y=>y.k===S.me);if(!x||!a||!a.in)return out;return out.replace('In at '+a.in,'In at '+ownIn(x,a))};
const _sh5=staffHome;staffHome=function(){let out=_sh5();const x=empOf(S.me),a=D.att.find(y=>y.k===S.me);if(!x||!a||!a.in)return out;return out.replace('Clocked in · '+a.in,'Clocked in · '+ownIn(x,a))};
/* per-person "Share slip" switch (only Darshan / Nameera) */
function slipSw(x){const on=relOk(x,S.pm||monStart(TODAY));return `<button class="sw ${on?'on':''}" data-a="slipTog" data-id="${x.id}" role="switch" aria-checked="${on}" aria-label="Share ${h(x.n)}'s slip" ${isAdm()?'':'disabled'}></button>`}
A.slipTog=e=>{if(!isAdm())return;const m=S.pm||monStart(TODAY),id=e.dataset.id,r=D.slipRel[m]=D.slipRel[m]||{ids:[],by:S.me,at:TODAY};r.ids=r.ids||[];const x=D.emp.find(y=>y.id===id);
 if(relOk(x,m)){if(r.all){r.all=false;r.ids=D.emp.map(y=>y.id).filter(i=>i!==id)}else r.ids=r.ids.filter(i=>i!==id);toast(x.n+"'s slip hidden")}else{r.ids.push(id);r.by=S.me;r.at=TODAY;toast(x.n+"'s slip shared — they can download it from their Me page")}save();render()};
/* access ends after the last working day (exit date) */
function accessClosed(k){const e=empOf(k);if(!e)return false;return (e.dox&&TODAY>e.dox)||(e.st==='Exited'&&!e.dox)}
const _render0=render;render=function(){if(S.me&&!['darshan'].includes(S.me)&&accessClosed(S.me)){const e=empOf(S.me);document.getElementById('app').innerHTML=`<div style="max-width:420px;margin:12vh auto;padding:24px;text-align:center" class="card"><div style="font-size:40px">🔒</div><h2 style="margin:8px 0">Access closed</h2><p class="mut">${h(e.n)}, your last working day was ${fmt(e.dox||TODAY)}. Your access to the JDAC app has ended. For your final settlement or documents, please contact Nameera (HR).</p><button class="btn sec w" style="margin-top:14px" data-a="whoSheet">Switch person (prototype)</button></div>`;return}return _render0()};
/* KPI: staff see only their own score + their own incentives */
function incSeries(k){const s=monStart(TODAY),out=[];for(let d=s;d<=TODAY;d=addD(d,1)){let v=0;D.ledger.filter(l=>l.k===k&&(l.at||'')===d).forEach(l=>v+=l.amt);if(!v&&d<TODAY){let hh=2166136261;for(const c of 'inc'+k+d){hh^=c.charCodeAt(0);hh=Math.imul(hh,16777619)>>>0}v=hh%100<55?[50,100,150,200][hh%4]:0}out.push([d,v])}return out}
function myIncCard(k){const S0=incSeries(k),tot=S0.reduce((a,x)=>a+x[1],0),mx=Math.max(...S0.map(x=>x[1]),1),today=(S0.find(x=>x[0]===TODAY)||[0,0])[1],half=Math.floor(S0.length/2),a1=S0.slice(0,half).reduce((a,x)=>a+x[1],0),a2=S0.slice(half).reduce((a,x)=>a+x[1],0);
 return `<div class="card"><div class="row nw"><b style="flex:1">My incentives · ${new Date(TODAY+'T12:00:00').toLocaleDateString('en-IN',{month:'long'})}</b><b class="num" style="font-size:20px;color:var(--g)">${inr(tot)}</b></div><div class="xs mut">Today ${inr(today)} · ${a2>=a1?'▲ growing':'▼ slower'} this half of the month (${inr(a2)} vs ${inr(a1)})</div>
 <div class="incbars" aria-label="Daily incentives">${S0.map(([d,v])=>`<i class="${d===TODAY?'td':v?'on':''}" style="height:${Math.max(2,Math.round(v/mx*100))}%" title="${fmt(d)} · ${inr(v)}"></i>`).join('')}</div><div class="row xs mut" style="margin-top:4px"><span>${fmt(S0[0][0])}</span><span class="sp"></span><span>Today</span></div>
 <div class="xs mut" style="margin-top:6px">Updated every day. Incentives are paid with your salary once approved.</div></div>`}
const _kpi=V.kpi;V.kpi=()=>{if(isAdm())return _kpi();const r=kpiRows().find(x=>x.k===S.me);
 return page('My KPI','Only you can see your score')+(r?`<div class="card row nw">${av(nm(r.k))}<div class="tx" style="flex:1"><b>${h(nmF(r.k))}</b><div class="m">Numbers ${r.num}% · tasks on time ${r.tsk}% · 70% numbers + 30% tasks</div></div><span class="pill ${r.s>=75?'g':r.s>=55?'a':'r'}" style="font-size:16px">★ ${r.s}</span></div>`:'<div class="empty">No KPI score yet</div>')+myIncCard(S.me)+`<div class="list" style="margin-top:12px">${D.ledger.filter(l=>l.k===S.me).map(l=>`<div class="li"><div class="tx"><b>${h(l.what)}</b><div class="m">${fmt(l.at)} · ${h(l.st)}</div></div><b class="amt">${inr(l.amt)}</b></div>`).join('')}</div>`};
const _me8=V.me;V.me=()=>{const out=_me8();if(!empOf(S.me))return out;return out.replace('<div class="card"><b>My salary slips</b>',myIncCard(S.me)+'<div class="card"><b>My salary slips</b>')};
/* ===== Company rules — same list in HR Desk → Rules and on every employee's app ===== */
const RULES=[['Attendance',[
 'Start your day with a selfie in the app. No selfie by midnight = Absent (A) for that day.',
 'Shift timings: Pune office 10 am – 7 pm, Pune Camp 10 am – 8 pm, Goa 9 am – 6 pm. You can take your selfie early, but your day counts from your shift start.',
 'Late = more than 15 minutes after your shift start. Every 3rd late mark in a month = 1 half day (HD). You will see this on your page.',
 'Mark out at the end of your day. You can mark out only if you started your day with a selfie. If you forget, the app marks you out at 12 am — the day still counts as Present for your shift hours, and you are told the next day.',
 'Office staff must mark attendance from the office. Staff allowed by HR (for example the Goa team) can mark from anywhere.',
 'Forgot to mark your attendance (for example, phone left at home)? Raise a request to Nameera (HR) from your Me page.']],
 ['Weekly off & holidays',[
 'You get one paid weekly off (L) every week — Sunday for most staff. Warehouse team: Zubair Sunday, Abrar Wednesday, Samadhan Thursday, Mustafa Friday.',
 'Need a different day off for one week? Swap with a colleague from your Me page; Nameera approves.',
 'Public holidays on the company list are paid (L) — Pune staff follow the Pune list, Goa staff the Goa list.',
 'The Pune warehouse team gets only the weekly off, no public holidays.',
 'If a holiday falls on your weekly off (e.g. a Sunday), there is no extra day off.']],
 ['Leave',[
 'Apply for leave in advance from your Me page. Nameera approves it as paid (L), unpaid (A) or half day (HD), or rejects it.']],
 ['Salary & incentives',[
 'Salary is worked out on 30 days every month and paid between the 5th and 10th of the next month.',
 'If you join mid-month, that month\'s salary is paid together with the next month\'s salary.',
 'Your salary slip appears on your Me page only after Nameera shares it with you.',
 'Salary advances are normally not given; only Darshan sir can approve one.',
 'You can see your incentives every day under My KPI. They are paid with your salary once approved.',
 'Your KPI score is private — you see only your own.',
 'You see only your own attendance and your own tasks. A team can see each other\'s tasks only if Darshan sir or Nameera turn on task sharing for that team.']],
 ['Phone & login',[
 'You can log in and mark attendance from any phone — your own, a colleague\'s or a spare. You only ever see your own page.',
 'To reset your data on a new phone (lost or changed phone), request a phone reset from your Me page — Nameera must approve it.']],
 ['Leaving the company',[
 'Serve the notice period in your offer letter (most staff 1 month; Nameera 3 months).',
 'Final salary is paid only if the notice period is fully served, unless Darshan sir or Nameera approve it.',
 'Your app access ends after your last working day.']]];
function rulesHTML(){return RULES.map(([t,L])=>`<div class="card"><b>${h(t)}</b><ol style="margin:8px 0 0 18px;padding:0;line-height:1.6">${L.map(x=>`<li class="sm">${h(x)}</li>`).join('')}</ol></div>`).join('')}
function pRules(){return `<div class="note" style="margin-bottom:12px">Every employee sees this same list under <b>More → Company rules</b> in their app.</div>`+rulesHTML()}
V.hrrules=()=>page('Company rules','JDAC Sales Pvt Ltd · for all staff')+rulesHTML();
const _allowed3=allowed;allowed=function(v){if(v==='hrrules')return isAdm();if(v==='kpi')return !isExt();return _allowed3(v)};
/* ===== Phone reset (new phone) — Nameera approves ===== */
if(!D.devReq)D.devReq=[];
A.devReq=()=>sheet(`<h2>Move my login to a new phone</h2><p class="mut sm">Use this if your phone was lost or changed. Nameera will approve it, then you can log in on the new phone with your mobile number + OTP. You can still mark attendance from any phone meanwhile.</p><label for="dv-w">Reason</label>${opts('dv-w',['Phone lost','New phone','Phone not working'],'New phone')}<button class="btn w" style="margin-top:14px" data-a="devSave">Send to HR Manager Nameera</button>`);
A.devSave=()=>{D.devReq.unshift({id:nid('dv'),k:S.me,why:pick1('dv-w')||'New phone',at:TODAY,st:'Pending'});save();closeM();render();toast('Request sent to Nameera')};
A.devSt=e=>{if(!isAdm())return;const r=D.devReq.find(x=>x.id===e.dataset.id);r.st=e.dataset.s;r.by=S.me;save();render();toast(r.st==='Approved'?'Approved — they can log in on the new phone':'Rejected')};
const _me9=V.me;V.me=()=>{const out=_me9();if(!empOf(S.me))return out;const r=D.devReq.find(x=>x.k===S.me&&x.at>=addD(TODAY,-30));
 const card=`<div class="card"><div class="row nw"><div style="flex:1"><b>Changed or lost your phone?</b><div class="xs mut">${r?`${h(r.why)} · ${fmt(r.at)}`:'Ask Nameera to move your login to a new phone.'}</div></div>${r?pill(r.st==='Pending'?'With Nameera':r.st,r.st==='Approved'?'g':r.st==='Rejected'?'r':'a'):`<button class="btn sm sec" data-a="devReq">Request phone reset</button>`}</div></div>`;
 return out.replace('<div class="card"><div class="row nw"><b style="flex:1">Leave</b>',card+'<div class="card"><div class="row nw"><b style="flex:1">Leave</b>')};
const _p11=V.people;V.people=()=>{let out=_p11();if(S.ptab!=='leave')return out;const L=D.devReq.filter(x=>x.at>=addD(TODAY,-30));if(!L.length)return out;
 return out.replace('<div style="margin-top:12px"></div>','<div style="margin-top:12px"></div>'+`<div class="card" style="margin-bottom:14px"><b>Phone reset requests</b><div class="list" style="margin:10px 0 0;box-shadow:none">${L.map(r=>{const e=empOf(r.k)||{n:r.k};return `<div class="li"><div class="tx"><b>${h(e.n)}</b><div class="m">${h(r.why)} · ${fmt(r.at)}</div></div>${r.st==='Pending'?`<button class="btn sm" data-a="devSt" data-id="${r.id}" data-s="Approved">Approve</button><button class="btn sm sec" data-a="devSt" data-id="${r.id}" data-s="Rejected">Reject</button>`:pill(r.st,r.st==='Approved'?'g':'r')}</div>`}).join('')}</div></div>`)};
/* ===== Privacy: own attendance + own tasks only; admins can switch on task sharing per team ===== */
if(!D.shareTeams)D.shareTeams=[];
const _myTasks=myTasks;myTasks=function(){if(isAdm())return _myTasks();const tm=(P[S.me]||{}).team;const share=tm&&D.shareTeams.includes(tm);return D.tasks.filter(t=>t.o===S.me||t.by===S.me||(share&&P[t.o]&&P[t.o].team===tm))};
A.shareTog=e=>{if(!isAdm())return;const t=e.dataset.t;D.shareTeams=D.shareTeams.includes(t)?D.shareTeams.filter(x=>x!==t):[...D.shareTeams,t];save();render();toast(D.shareTeams.includes(t)?t+' can now see each other\'s tasks':t+' see only their own tasks')};
const _pR=pRules;pRules=function(){const teams=[...new Set(STAFF.filter(k=>!['darshan','nameera'].includes(k)).map(k=>P[k].team))].filter(Boolean);
 return `<div class="card" style="margin-bottom:14px"><b>Task sharing by team</b><div class="xs mut" style="margin-top:4px">Off = everyone sees only their own tasks (default). On = people in that team can see each other's tasks. Attendance is always private.</div><div class="list" style="margin:10px 0 0;box-shadow:none">${teams.map(t=>{const on=D.shareTeams.includes(t);return `<div class="li"><div class="tx"><b>${h(t)}</b><div class="m">${STAFF.filter(k=>P[k].team===t).map(k=>h(nm(k))).join(', ')}</div></div><button class="sw ${on?'on':''}" data-a="shareTog" data-t="${h(t)}" role="switch" aria-checked="${on}" aria-label="Task sharing for ${h(t)}"></button></div>`}).join('')}</div></div>`+_pR()};
/* ===== Downloads: only Darshan & Nameera (staff can download only their own shared slip) ===== */
let ALLOWDL=false;
const _saveFile=saveFile;saveFile=async function(n,t){if(!isAdm()&&!ALLOWDL)return toast('Only Darshan and Nameera can download files');return _saveFile(n,t)};
const _slipDl=A.slipDl;A.slipDl=async e=>{const x=D.emp.find(y=>y.id===e.dataset.id);if(!isAdm()){if(!x||x.k!==S.me||!relOk(x,S.pm||monStart(TODAY)))return toast('Only Darshan and Nameera can download files');ALLOWDL=true}try{return await _slipDl(e)}finally{ALLOWDL=false}};
/* ===== View (eye) in Employee master opens that person's own app ===== */
A.empApp=e=>{const x=D.emp.find(y=>y.id===e.dataset.id);if(!x)return;if(!x.k||!P[x.k])return A.empView(e);if(x.st!=='Active')return toast(x.n+' has left — their app access is closed');S.viewer=S.me;A.whoSet({dataset:{k:x.k}});toast('Viewing as '+x.n)};
A.viewBack=()=>{const k=S.viewer||'darshan';S.viewer=null;A.whoSet({dataset:{k}});S.v='people';S.ptab='master';render()};
const _render1=render;render=function(){_render1();if(S.viewer&&S.viewer!==S.me){const app=document.getElementById('app');if(app&&app.insertAdjacentHTML&&!document.getElementById('vbar'))app.insertAdjacentHTML('afterbegin',`<div id="vbar" style="position:sticky;top:0;z-index:50;background:#24408E;color:#fff;padding:8px 14px;display:flex;align-items:center;gap:10px;font-size:13px"><b style="flex:1">👁 Viewing ${h(nmF(S.me))}'s app — exactly what they see</b><button data-a="viewBack" style="background:#fff;color:#24408E;border:0;border-radius:8px;padding:6px 12px;font-weight:700;cursor:pointer">Back to my view</button></div>`)}};
/* ===== Company rules: each employee sees only what applies to them ===== */
function rulesFor(e){const goa=e.city==='Goa',wh=!!e.noHol,anyL=!!e.anyLoc,wo=DAYN[woDay(e)],ntcD=ntc(e),ntcTxt=ntcD%30===0?(ntcD/30)+' month'+(ntcD>30?'s':''):ntcD+' days',st=hhmm(shiftStart(e));
 return [['Attendance',[
 'Start your day with a selfie in the app. No selfie by midnight = Absent (A) for that day.',
 `Your shift: ${e.time}. You can take your selfie early, but your day counts from ${st}.`,
 `Late = clocking in after ${hhmm(shiftStart(e)+15)} (more than 15 minutes after ${st}). Every 3rd late mark in a month = 1 half day (HD). You will see this on your page.`,
 'Mark out at the end of your day. You can mark out only if you started your day with a selfie. If you forget, the app marks you out at 12 am — the day still counts as Present for your shift hours, and you are told the next day.',
 anyL?'You can mark your attendance from anywhere.':'Mark your attendance from your work location.',
 'Only Nameera (HR) or Darshan can correct your attendance, for example if you forgot your phone at home.']],
 ['Weekly off & holidays',[
 `Your paid weekly off (L) is every ${wo}.`,
 'Need a different day off for one week? Swap with a colleague from your Me page; Nameera approves.',
 wh?'You get your weekly off only — public holidays are working days for you.':`Public holidays on the ${goa?'Goa':'Pune'} holiday list are paid (L). The list is below.`,
 ...(wh?[]:['If a holiday falls on your weekly off, there is no extra day off.'])]],
 ['Leave',['Apply for leave in advance from your Me page. Nameera approves it as paid (L), unpaid (A) or half day (HD), or rejects it.']],
 ['Salary & incentives',[
 'Your salary is worked out on 30 days every month and paid between the 5th and 10th of the next month.',
 ...(e.doj>=mAdd(monStart(TODAY),-1)?['Your first part-month salary is paid together with the next month\'s salary.']:[]),
 'Your salary slip appears on your Me page only after Nameera shares it with you.',
 'Salary advances are normally not given; only Darshan can approve one.',
 'You can see your incentives every day under My KPI. They are paid with your salary once approved.',
 'Your KPI score, attendance and tasks are private — you see only your own.']],
 ['Phone & login',['You can log in and mark attendance from any phone. You only ever see your own page.','To reset your data on a new phone, request a phone reset from your Me page — Nameera must approve it.']],
 ['Leaving the company',[`Your notice period is ${ntcTxt}.`,'Your final salary is paid only if you serve the full notice period, unless Darshan or Nameera approve it.','Your app access ends after your last working day.']]]}
V.hrrules=()=>{const e=empOf(S.me);if(isAdm()||!e)return page('Company rules','JDAC Sales Pvt Ltd · full list (admin view)')+rulesHTML();
 return page('My rules',`${h(e.n)} · ${h(e.desig)} · only the rules that apply to you`)+rulesFor(e).map(([t,L])=>`<div class="card"><b>${h(t)}</b><ol style="margin:8px 0 0 18px;padding:0;line-height:1.6">${L.map(x=>`<li class="sm">${h(x)}</li>`).join('')}</ol></div>`).join('')+(e.noHol?'':myHolCard(e))};
function myHolCard(e){const reg=holReg(e),yrs=[TODAY.slice(0,4),String(+TODAY.slice(0,4)+1)];return yrs.map(y=>{const L=D.holi.filter(x=>x.d.slice(0,4)===y&&(x.w==='All'||x.w===reg)).sort((a,b)=>a.d.localeCompare(b.d));return `<div class="card"><b>My holidays ${y} · ${reg}</b><div class="list" style="margin:8px 0 0;box-shadow:none">${L.map(x=>`<div class="li"><div class="tx"><b>${h(x.n)}</b><div class="m">${fmtL?fmtL(x.d):fmt(x.d)}${x.moon?' · date may shift with the moon':''}</div></div></div>`).join('')||'<div class="empty xs">Not announced yet</div>'}</div></div>`}).join('')}
pRules=(f=>function(){return f().replace('Every employee sees this same list under <b>More → Company rules</b> in their app.','Only you and Nameera can see these rules. Employees do not see a rules page in their app.')})(pRules);
const _dlC=download;download=async function(n,t){if(!isAdm())return toast('Only Darshan and Nameera can download files');return _dlC(n,t)};
/* ===== Forgot to mark attendance → request to Nameera ===== */
if(!D.attReq)D.attReq=[];
A.attReqNew=()=>sheet(`<h2>Forgot to mark attendance?</h2><p class="mut sm">Send a request to Nameera (HR). She will check and correct your attendance.</p><label for="ar-d">Date</label><input id="ar-d" type="date" max="${TODAY}" value="${TODAY}"><label>What happened?</label>${opts('ar-w',['Forgot my phone at home','Phone not working','Forgot to mark in','Forgot to mark out','Other'],'Forgot my phone at home')}<label for="ar-n">Note (optional)</label><input id="ar-n" placeholder="e.g. came at 10:05, was at the office all day"><button class="btn w" style="margin-top:14px" data-a="attReqSave">Send to HR Manager Nameera</button>`);
A.attReqSave=()=>{const d=val('ar-d');if(!d)return toast('Pick the date');D.attReq.unshift({id:nid('ar'),k:S.me,d,why:pick1('ar-w')||'Other',note:val('ar-n'),at:TODAY,st:'Pending'});save();closeM();render();toast('Request sent to Nameera')};
A.attReqSt=e=>{if(!isAdm())return;const r=D.attReq.find(x=>x.id===e.dataset.id),x=empOf(r.k);r.st=e.dataset.s;r.by=S.me;if(r.st==='Approved'&&x){D.attx[x.id]=D.attx[x.id]||{};D.attx[x.id][r.d]='P';D.attn=D.attn||{};D.attn[x.id]=D.attn[x.id]||{};D.attn[x.id][r.d]={by:S.me,why:'Request: '+r.why+(r.note?' — '+r.note:''),at:TODAY}}save();render();toast(r.st==='Approved'?'Marked Present for '+fmt(r.d):'Request rejected')};
const _me10=V.me;V.me=()=>{const out=_me10();if(!empOf(S.me))return out;const M=D.attReq.filter(r=>r.k===S.me&&r.at>=addD(TODAY,-30));
 const card=`<div class="card"><div class="row nw"><div style="flex:1"><b>Forgot to mark attendance?</b><div class="xs mut">Raise a request to Nameera (HR).</div></div><button class="btn sm sec" data-a="attReqNew">Raise request</button></div>${M.length?`<div class="list" style="margin:10px 0 0;box-shadow:none">${M.map(r=>`<div class="li"><div class="tx"><b>${fmt(r.d)}</b><div class="m">${h(r.why)}${r.note?' · '+h(r.note):''}</div></div>${pill(r.st==='Pending'?'With Nameera':r.st,r.st==='Approved'?'g':r.st==='Rejected'?'r':'a')}</div>`).join('')}</div>`:''}</div>`;
 return out.replace('<div class="card"><div class="row nw"><b style="flex:1">Leave</b>',card+'<div class="card"><div class="row nw"><b style="flex:1">Leave</b>')};
const _p12=V.people;V.people=()=>{let out=_p12();if(S.ptab!=='leave')return out;const L=D.attReq.filter(r=>r.at>=addD(TODAY,-30));
 return out.replace('<div style="margin-top:12px"></div>','<div style="margin-top:12px"></div>'+`<div class="card" style="margin-bottom:14px"><b>Attendance correction requests</b>${L.filter(r=>r.st==='Pending').length?' '+pill(L.filter(r=>r.st==='Pending').length+' waiting','a'):''}<div class="list" style="margin:10px 0 0;box-shadow:none">${L.map(r=>{const e=empOf(r.k)||{n:r.k};return `<div class="li"><div class="tx"><b>${h(e.n)} · ${fmt(r.d)}</b><div class="m">${h(r.why)}${r.note?' · '+h(r.note):''}</div></div>${r.st==='Pending'?`<button class="btn sm" data-a="attReqSt" data-id="${r.id}" data-s="Approved">Mark present</button><button class="btn sm sec" data-a="attReqSt" data-id="${r.id}" data-s="Rejected">Reject</button>`:pill(r.st,r.st==='Approved'?'g':'r')}</div>`}).join('')||'<div class="empty xs">No requests</div>'}</div></div>`)};

